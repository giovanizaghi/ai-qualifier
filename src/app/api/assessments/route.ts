import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Validation schemas
const assessmentCreateSchema = z.object({
  qualificationId: z.string().min(1, "Qualification ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questionCount: z.number().min(1).default(50),
  timeLimit: z.number().min(1).optional(),
  randomizeQuestions: z.boolean().default(true),
  randomizeAnswers: z.boolean().default(true),
  showResults: z.boolean().default(true),
  questionCategories: z.any().optional(),
  difficultyMix: z.any().optional(),
  isActive: z.boolean().default(true)
})

const assessmentQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)),
  qualificationId: z.string().optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

// GET /api/assessments - List assessments with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams)
    
    // Set defaults for missing parameters
    const queryParams = {
      page: params.page || "1",
      limit: params.limit || "10",
      ...params
    }
    
    const query = assessmentQuerySchema.parse(queryParams)

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

    const totalPages = Math.ceil(total / query.limit)
    const hasNextPage = query.page < totalPages
    const hasPrevPage = query.page > 1

    return NextResponse.json({
      success: true,
      data: assessments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error("Error fetching assessments:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid query parameters", 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// POST /api/assessments - Create new assessment
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Authentication required" 
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = assessmentCreateSchema.parse(body)

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

    return NextResponse.json(
      {
        success: true,
        message: "Assessment created successfully",
        data: assessment
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error creating assessment:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}