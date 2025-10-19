import { NextRequest, NextResponse } from "next/server"
import { questionBankService } from "@/lib/question-bank"
import { 
  successResponse,
  handleApiError,
  notFoundResponse
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"

// GET /api/questions/analytics/[id] - Get analytics for a specific question
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Apply authentication and rate limiting
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      requireRoles: ["ADMIN", "INSTRUCTOR"],
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { id } = await params

    try {
      const analytics = await questionBankService.getQuestionAnalytics(id)
      return successResponse(analytics, "Question analytics retrieved successfully")
    } catch (error: any) {
      if (error.message === 'Question not found') {
        return notFoundResponse("Question")
      }
      throw error
    }

  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/questions/analytics/[id]/update - Update question analytics after an assessment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Apply authentication and rate limiting
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      rateLimit: rateLimitConfigs.default
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { id } = await params
    const body = await req.json()

    const { isCorrect, timeSpent } = body

    if (typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { 
          success: false,
          error: "isCorrect must be a boolean" 
        },
        { status: 400 }
      )
    }

    await questionBankService.updateQuestionAnalytics(id, {
      isCorrect,
      timeSpent: timeSpent || undefined
    })

    return successResponse(null, "Question analytics updated successfully")

  } catch (error) {
    return handleApiError(error)
  }
}