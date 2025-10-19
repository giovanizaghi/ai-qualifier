import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { 
  successResponseWithPagination,
  successResponse,
  handleApiError,
  calculatePagination,
  notFoundResponse
} from "@/lib/api/responses"
import { 
  validatePaginationParams,
  validateQueryParams
} from "@/lib/api/validation"
import { prisma } from "@/lib/prisma"


// Query schema for qualification progress
const progressQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)),
  userId: z.string().optional(),
  qualificationId: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED"]).optional(),
  sortBy: z.enum(["completionPercentage", "lastStudiedAt", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

// GET /api/progress - List qualification progress with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Apply authentication and rate limiting
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { searchParams } = new URL(req.url)
    const params = validatePaginationParams(searchParams)
    const query = validateQueryParams(progressQuerySchema, params)

    // Build where clause for filtering
    const where: any = {}
    
    // Regular users can only see their own progress
    // Admins and instructors can see all progress
    if (protection.user && !["ADMIN", "INSTRUCTOR"].includes(protection.user.role || "USER")) {
      where.userId = protection.user.id
    } else if (query.userId) {
      where.userId = query.userId
    }
    
    if (query.qualificationId) {
      where.qualificationId = query.qualificationId
    }
    
    if (query.status) {
      where.status = query.status
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Execute queries
    const [progress, total] = await Promise.all([
      prisma.qualificationProgress.findMany({
        where,
        select: {
          id: true,
          userId: true,
          qualificationId: true,
          status: true,
          completionPercentage: true,
          studyTimeMinutes: true,
          lastStudiedAt: true,
          attempts: true,
          bestScore: true,
          lastAttemptScore: true,
          lastAttemptAt: true,
          currentTopic: true,
          completedTopics: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          qualification: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              difficulty: true,
              estimatedDuration: true,
              passingScore: true
            }
          }
        },
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder
        }
      }),
      prisma.qualificationProgress.count({ where })
    ])

    const pagination = calculatePagination(query.page, query.limit, total)

    return successResponseWithPagination(progress, pagination)

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/progress - Create or update qualification progress
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
    const { qualificationId, status, studyTimeMinutes, currentTopic, completedTopics } = body

    if (!qualificationId) {
      return NextResponse.json(
        { success: false, error: "Qualification ID is required" },
        { status: 400 }
      )
    }

    // Check if qualification exists
    const qualification = await prisma.qualification.findUnique({
      where: { id: qualificationId }
    })

    if (!qualification) {
      return notFoundResponse("Qualification")
    }

    // Calculate completion percentage based on completed topics
    const totalTopics = qualification.learningObjectives?.length || 1
    const completedTopicsCount = completedTopics?.length || 0
    const completionPercentage = (completedTopicsCount / totalTopics) * 100

    // Upsert progress record
    const progress = await prisma.qualificationProgress.upsert({
      where: {
        userId_qualificationId: {
          userId: protection.user!.id,
          qualificationId
        }
      },
      update: {
        status: status || undefined,
        studyTimeMinutes: studyTimeMinutes !== undefined ? 
          { increment: studyTimeMinutes } : undefined,
        lastStudiedAt: new Date(),
        currentTopic: currentTopic || undefined,
        completedTopics: completedTopics || undefined,
        completionPercentage: Math.min(completionPercentage, 100)
      },
      create: {
        userId: protection.user!.id,
        qualificationId,
        status: status || "NOT_STARTED",
        studyTimeMinutes: studyTimeMinutes || 0,
        lastStudiedAt: new Date(),
        currentTopic: currentTopic || null,
        completedTopics: completedTopics || [],
        completionPercentage: Math.min(completionPercentage, 100)
      },
      select: {
        id: true,
        status: true,
        completionPercentage: true,
        studyTimeMinutes: true,
        lastStudiedAt: true,
        attempts: true,
        bestScore: true,
        currentTopic: true,
        completedTopics: true,
        qualification: {
          select: {
            title: true,
            estimatedDuration: true
          }
        }
      }
    })

    return successResponse(progress, "Progress updated successfully")

  } catch (error) {
    return handleApiError(error)
  }
}