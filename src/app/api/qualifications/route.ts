import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { 
  qualificationCreateSchema, 
  qualificationQuerySchema,
  validatePaginationParams,
  validateRequestBody,
  validateQueryParams
} from "@/lib/api/validation"
import { 
  successResponseWithPagination,
  createdResponse,
  handleApiError,
  calculatePagination,
  conflictResponse
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"

// GET /api/qualifications - List qualifications with pagination and filtering
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
    const query = validateQueryParams(qualificationQuerySchema, params)

    // Build where clause for filtering
    const where: any = {}
    
    if (query.category) {
      where.category = query.category
    }
    
    if (query.difficulty) {
      where.difficulty = query.difficulty
    }
    
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search } }
      ]
    }
    
    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Execute queries
    const [qualifications, total] = await Promise.all([
      prisma.qualification.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          shortDescription: true,
          slug: true,
          category: true,
          difficulty: true,
          estimatedDuration: true,
          tags: true,
          passingScore: true,
          totalQuestions: true,
          timeLimit: true,
          allowRetakes: true,
          learningObjectives: true,
          isActive: true,
          isPublished: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assessments: true,
              questions: true,
              qualificationProgress: true
            }
          }
        },
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      prisma.qualification.count({ where })
    ])

    const pagination = calculatePagination(query.page, query.limit, total)

    return successResponseWithPagination(qualifications, pagination)

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/qualifications - Create new qualification
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
    const validatedData = validateRequestBody(qualificationCreateSchema, body)

    // Check if slug already exists
    const existingQualification = await prisma.qualification.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingQualification) {
      return conflictResponse("A qualification with this slug already exists")
    }

    // Create qualification
    const qualification = await prisma.qualification.create({
      data: validatedData,
      select: {
        id: true,
        title: true,
        description: true,
        shortDescription: true,
        slug: true,
        category: true,
        difficulty: true,
        estimatedDuration: true,
        tags: true,
        passingScore: true,
        totalQuestions: true,
        timeLimit: true,
        allowRetakes: true,
        retakeCooldown: true,
        learningObjectives: true,
        syllabus: true,
        isActive: true,
        isPublished: true,
        version: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return createdResponse(qualification, "Qualification created successfully")

  } catch (error) {
    return handleApiError(error)
  }
}