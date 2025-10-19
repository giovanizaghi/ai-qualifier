import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  assessmentCreateSchema, 
  assessmentQuerySchema,
  validatePaginationParams,
  validateRequestBody,
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

// GET /api/assessments - List assessments with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting
    const protection = await protectApiRoute(req, {
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { searchParams } = new URL(req.url)
    const params = validatePaginationParams(searchParams)
    const query = validateQueryParams(assessmentQuerySchema, params)

    // Build where clause for filtering
    const where: any = {}
    
    if (query.qualificationId) {
      where.qualificationId = query.qualificationId
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Execute queries
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        select: {
          id: true,
          qualificationId: true,
          title: true,
          description: true,
          questionCount: true,
          timeLimit: true,
          randomizeQuestions: true,
          randomizeAnswers: true,
          showResults: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          qualification: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              difficulty: true
            }
          },
          _count: {
            select: {
              results: true
            }
          }
        },
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      prisma.assessment.count({ where })
    ])

    const pagination = calculatePagination(query.page, query.limit, total)

    return successResponseWithPagination(assessments, pagination)

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/assessments - Create new assessment
export async function POST(req: NextRequest) {
  try {
    // Apply authentication and rate limiting
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      requireRoles: ["ADMIN", "INSTRUCTOR"],
      rateLimit: rateLimitConfigs.default
    })
    
    if (!protection.success) {
      return protection.error
    }

    const body = await req.json()
    const validatedData = validateRequestBody(assessmentCreateSchema, body)

    // Check if qualification exists
    const qualification = await prisma.qualification.findUnique({
      where: { id: validatedData.qualificationId }
    })

    if (!qualification) {
      return badRequestResponse("Qualification not found")
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: validatedData,
      select: {
        id: true,
        qualificationId: true,
        title: true,
        description: true,
        questionCount: true,
        timeLimit: true,
        randomizeQuestions: true,
        randomizeAnswers: true,
        showResults: true,
        questionCategories: true,
        difficultyMix: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        qualification: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    })

    return createdResponse(assessment, "Assessment created successfully")

  } catch (error) {
    return handleApiError(error)
  }
}