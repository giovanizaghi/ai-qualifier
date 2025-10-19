import { NextRequest, NextResponse } from "next/server"

import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { 
  successResponse,
  handleApiError,
  notFoundResponse,
  badRequestResponse
} from "@/lib/api/responses"
import { 
  questionUpdateSchema,
  validateRequestBody
} from "@/lib/api/validation"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/questions/[id] - Get single question
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

    const question = await prisma.question.findUnique({
      where: { id },
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
            slug: true,
            category: true,
            difficulty: true
          }
        }
      }
    })

    if (!question) {
      return notFoundResponse("Question")
    }

    return successResponse(question)

  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/questions/[id] - Update question
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
    const validatedData = validateRequestBody(questionUpdateSchema, body)

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id }
    })

    if (!existingQuestion) {
      return notFoundResponse("Question")
    }

    // Update question
    const question = await prisma.question.update({
      where: { id },
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
      }
    })

    return successResponse(question, "Question updated successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/questions/[id] - Delete question
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

    // Check if question exists and has dependencies
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questionResults: true
          }
        }
      }
    })

    if (!question) {
      return notFoundResponse("Question")
    }

    // Check if question has been used in assessments
    if (question._count.questionResults > 0) {
      return badRequestResponse(
        "Cannot delete question that has been used in assessments. Please deactivate instead."
      )
    }

    // Delete question
    await prisma.question.delete({
      where: { id }
    })

    return successResponse(null, "Question deleted successfully")

  } catch (error) {
    return handleApiError(error)
  }
}