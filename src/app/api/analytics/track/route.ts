import { NextRequest, NextResponse } from "next/server"

import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { UserAnalyticsService, AnalyticsEventType } from "@/lib/user-analytics"

// POST /api/analytics/track - Track user analytics event
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return badRequestResponse("Authentication required")
    }

    const body = await req.json()
    const { eventType, data = {}, sessionId } = body

    if (!eventType) {
      return badRequestResponse("Event type is required")
    }

    // Validate event type
    const validEventTypes: AnalyticsEventType[] = [
      'session_start', 'session_end', 'page_view', 'assessment_start',
      'assessment_complete', 'question_answered', 'question_skipped',
      'bookmark_added', 'bookmark_removed', 'learning_path_started',
      'achievement_earned', 'search_performed', 'content_shared',
      'feedback_submitted', 'error_occurred'
    ]

    if (!validEventTypes.includes(eventType)) {
      return badRequestResponse("Invalid event type")
    }

    // Extract metadata from request
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    await UserAnalyticsService.trackEvent(
      session.user.id,
      eventType,
      data,
      {
        sessionId,
        source: 'web',
        userAgent,
        ipAddress
      }
    )

    return successResponse({ tracked: true }, "Event tracked successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/analytics/patterns - Get user learning patterns
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return badRequestResponse("Authentication required")
    }

    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    const patterns = await UserAnalyticsService.analyzeLearningPatterns(session.user.id)
    const insights = await UserAnalyticsService.generatePerformanceInsights(session.user.id)

    return successResponse({
      patterns,
      insights,
      timeframe
    }, "Analytics data retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}