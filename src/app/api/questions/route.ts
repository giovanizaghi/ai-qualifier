import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  questionCreateSchema, 
  questionQuerySchema,
  validatePaginationParams,
  validateRequestBody,
  validateQueryParams
} from "@/lib/api/validation"
import { 
  successResponseWithPagination,
  createdResponse,
  handleApiError,
  calculatePagination
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"

// GET /api/questions - List questions with pagination and filtering
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
    const query = validateQueryParams(questionQuerySchema, params)

    // Build where clause for filtering
    const where: any = {}
    
    if (query.qualificationId) {
      where.qualificationId = query.qualificationId
    }
    
    if (query.type) {
      where.type = query.type
    }
    
    if (query.difficulty) {
      where.difficulty = query.difficulty
    }
    
    if (query.category) {
      where.category = { contains: query.category, mode: "insensitive" }
    }
    
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search } }
      ]
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Execute queries
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: {
          id: true,
          qualificationId: true,
          title: true,
          content: true,
          explanation: true,
          type: true,
          category: true,
          difficulty: true,
          tags: true,
          options: true,
          correctAnswers: true,
          points: true,
          timeEstimate: true,
          timesUsed: true,
          timesCorrect: true,
          averageTime: true,
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
        },
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      prisma.question.count({ where })
    ])

    const pagination = calculatePagination(query.page, query.limit, total)

    return successResponseWithPagination(questions, pagination)

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/questions - Create new question
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
    const validatedData = validateRequestBody(questionCreateSchema, body)

    // Check if qualification exists
    const qualification = await prisma.qualification.findUnique({
      where: { id: validatedData.qualificationId }
    })

    if (!qualification) {
      return NextResponse.json(
        { 
          success: false,
          error: "Qualification not found" 
        },
        { status: 400 }
      )
    }

    // Create question
    const question = await prisma.question.create({
      data: validatedData,
      select: {
        id: true,
        qualificationId: true,
        title: true,
        content: true,
        explanation: true,
        type: true,
        category: true,
        difficulty: true,
        tags: true,
        options: true,
        correctAnswers: true,
        points: true,
        timeEstimate: true,
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

    return createdResponse(question, "Question created successfully")

  } catch (error) {
    return handleApiError(error)
  }
}