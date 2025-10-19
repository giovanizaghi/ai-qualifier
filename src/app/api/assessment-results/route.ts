import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  assessmentResultCreateSchema,
  assessmentResultQuerySchema,
  validateRequestBody,
  validatePaginationParams,
  validateQueryParams
} from "@/lib/api/validation"
import { 
  successResponseWithPagination,
  createdResponse,
  handleApiError,
  calculatePagination,
  badRequestResponse
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"

// GET /api/assessment-results - List assessment results with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Apply authentication and rate limiting - require auth to view results
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { searchParams } = new URL(req.url)
    const params = validatePaginationParams(searchParams)
    const query = validateQueryParams(assessmentResultQuerySchema, params)

    // Build where clause for filtering
    const where: any = {}
    
    // Regular users can only see their own results
    // Admins and instructors can see all results
    if (protection.user && !["ADMIN", "INSTRUCTOR"].includes(protection.user.role || "USER")) {
      where.userId = protection.user.id
    } else if (query.userId) {
      where.userId = query.userId
    }
    
    if (query.assessmentId) {
      where.assessmentId = query.assessmentId
    }
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.passed !== undefined) {
      where.passed = query.passed
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Execute queries
    const [results, total] = await Promise.all([
      prisma.assessmentResult.findMany({
        where,
        select: {
          id: true,
          userId: true,
          assessmentId: true,
          score: true,
          totalQuestions: true,
          correctAnswers: true,
          incorrectAnswers: true,
          skippedQuestions: true,
          startedAt: true,
          completedAt: true,
          timeSpent: true,
          status: true,
          passed: true,
          certificateId: true,
          categoryScores: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assessment: {
            select: {
              id: true,
              title: true,
              qualification: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  category: true,
                  difficulty: true
                }
              }
            }
          }
        },
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      prisma.assessmentResult.count({ where })
    ])

    const pagination = calculatePagination(query.page, query.limit, total)

    return successResponseWithPagination(results, pagination)

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/assessment-results - Start or submit assessment
export async function POST(req: NextRequest) {
  try {
    // Apply authentication and rate limiting
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      rateLimit: rateLimitConfigs.default
    })
    
    if (!protection.success) {
      return protection.error
    }

    const body = await req.json()
    const validatedData = validateRequestBody(assessmentResultCreateSchema, body)

    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: validatedData.assessmentId },
      include: {
        qualification: {
          select: {
            passingScore: true,
            allowRetakes: true,
            retakeCooldown: true
          }
        }
      }
    })

    if (!assessment) {
      return badRequestResponse("Assessment not found")
    }

    // Check if user has an existing incomplete attempt
    const existingAttempt = await prisma.assessmentResult.findFirst({
      where: {
        userId: protection.user!.id,
        assessmentId: validatedData.assessmentId,
        status: "IN_PROGRESS"
      }
    })

    if (existingAttempt) {
      return badRequestResponse("You have an incomplete assessment. Please complete or abandon it first.")
    }

    // Check retake cooldown if applicable
    if (!assessment.qualification.allowRetakes) {
      const previousAttempt = await prisma.assessmentResult.findFirst({
        where: {
          userId: protection.user!.id,
          assessmentId: validatedData.assessmentId,
          status: "COMPLETED"
        }
      })

      if (previousAttempt) {
        return badRequestResponse("Retakes are not allowed for this qualification")
      }
    }

    // Process answers and calculate score
    let totalQuestions = validatedData.answers.length
    let correctAnswers = 0
    let score = 0

    const questionResults = []

    for (const answer of validatedData.answers) {
      // Get question details
      const question = await prisma.question.findUnique({
        where: { id: answer.questionId },
        select: {
          correctAnswers: true,
          points: true
        }
      })

      if (!question) continue

      // Check if answer is correct
      const isCorrect = JSON.stringify(answer.userAnswer.sort()) === 
                       JSON.stringify(question.correctAnswers.sort())
      
      if (isCorrect) {
        correctAnswers++
        score += question.points
      }

      questionResults.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        timeSpent: answer.timeSpent,
        confidence: answer.confidence,
        flaggedForReview: answer.flaggedForReview
      })
    }

    // Calculate percentage score
    const allQuestions = await prisma.question.findMany({
      where: {
        id: { in: validatedData.answers.map(a => a.questionId) }
      },
      select: { id: true, points: true }
    })
    
    const questionPointsMap = new Map(allQuestions.map(q => [q.id, q.points]))
    const maxPoints = validatedData.answers.reduce((sum, answer) => 
      sum + (questionPointsMap.get(answer.questionId) || 1), 0
    )
    const percentageScore = maxPoints > 0 ? (score / maxPoints) * 100 : 0

    // Determine if passed
    const passed = percentageScore >= assessment.qualification.passingScore

    // Create assessment result
    const assessmentResult = await prisma.assessmentResult.create({
      data: {
        userId: protection.user!.id,
        assessmentId: validatedData.assessmentId,
        score: percentageScore,
        totalQuestions,
        correctAnswers,
        incorrectAnswers: totalQuestions - correctAnswers,
        skippedQuestions: 0,
        startedAt: new Date(),
        completedAt: new Date(),
        status: "COMPLETED",
        passed,
        questionResults: {
          create: questionResults
        }
      },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        correctAnswers: true,
        incorrectAnswers: true,
        passed: true,
        completedAt: true,
        assessment: {
          select: {
            title: true,
            qualification: {
              select: {
                title: true,
                passingScore: true
              }
            }
          }
        }
      }
    })

    return createdResponse(assessmentResult, "Assessment completed successfully")

  } catch (error) {
    return handleApiError(error)
  }
}