import { NextRequest, NextResponse } from "next/server"

import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { 
  successResponse,
  handleApiError,
  notFoundResponse,
  badRequestResponse
} from "@/lib/api/responses"
import { 
  assessmentUpdateSchema,
  validateRequestBody
} from "@/lib/api/validation"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/assessments/[id] - Get single assessment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting
    const protection = await protectApiRoute(req, {
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { id } = await params

    const assessment = await prisma.assessment.findUnique({
      where: { id },
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
            slug: true,
            category: true,
            difficulty: true,
            passingScore: true,
            estimatedDuration: true,
            learningObjectives: true
          }
        },
        _count: {
          select: {
            results: true
          }
        }
      }
    })

    if (!assessment) {
      return notFoundResponse("Assessment")
    }

    return successResponse(assessment)

  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/assessments/[id] - Update assessment
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params
    const body = await req.json()
    const validatedData = validateRequestBody(assessmentUpdateSchema, body)

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id }
    })

    if (!existingAssessment) {
      return notFoundResponse("Assessment")
    }

    // Update assessment
    const assessment = await prisma.assessment.update({
      where: { id },
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

    return successResponse(assessment, "Assessment updated successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/assessments/[id] - Delete assessment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Check if assessment exists and has results
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            results: true
          }
        }
      }
    })

    if (!assessment) {
      return notFoundResponse("Assessment")
    }

    // Check if assessment has results
    if (assessment._count.results > 0) {
      return badRequestResponse(
        "Cannot delete assessment with existing results. Please remove assessment results first."
      )
    }

    // Delete assessment
    await prisma.assessment.delete({
      where: { id }
    })

    return successResponse(null, "Assessment deleted successfully")

  } catch (error) {
    return handleApiError(error)
  }
}