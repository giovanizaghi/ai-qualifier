import { NextRequest, NextResponse } from "next/server"
import { adaptiveQuestionSelector } from "@/lib/adaptive-selection"
import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { z } from "zod"
import { DifficultyLevel, QuestionType } from "@/types"

// Schema for adaptive question selection request
const adaptiveSelectionSchema = z.object({
  qualificationId: z.string().min(1, "Qualification ID is required"),
  userId: z.string().min(1, "User ID is required"),
  sessionId: z.string().optional(),
  totalQuestions: z.number().min(1).max(100).default(20),
  targetDifficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  learningMode: z.enum(["assessment", "practice", "adaptive_learning"]).default("practice"),
  constraints: z.object({
    categories: z.array(z.string()).optional(),
    excludeTypes: z.array(z.enum([
      "MULTIPLE_CHOICE",
      "MULTIPLE_SELECT", 
      "TRUE_FALSE",
      "FILL_IN_BLANK",
      "CODING_CHALLENGE",
      "DRAG_AND_DROP",
      "MATCHING",
      "ESSAY"
    ])).optional(),
    timeLimit: z.number().min(5).max(300).optional(), // minutes
    focusAreas: z.array(z.string()).optional()
  }).optional()
})

// POST /api/questions/adaptive-select - Select questions using adaptive algorithms
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
    const validatedData = adaptiveSelectionSchema.parse(body)

    // Convert constraints if provided
    const constraints = validatedData.constraints ? {
      categories: validatedData.constraints.categories,
      excludeTypes: validatedData.constraints.excludeTypes as QuestionType[],
      timeLimit: validatedData.constraints.timeLimit,
      focusAreas: validatedData.constraints.focusAreas
    } : undefined

    const adaptiveQuestions = await adaptiveQuestionSelector.selectAdaptiveQuestions({
      qualificationId: validatedData.qualificationId,
      userId: validatedData.userId,
      sessionId: validatedData.sessionId,
      totalQuestions: validatedData.totalQuestions,
      targetDifficulty: validatedData.targetDifficulty as DifficultyLevel,
      learningMode: validatedData.learningMode,
      constraints
    })

    return successResponse(adaptiveQuestions, "Adaptive questions selected successfully")

  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse(`Invalid request data: ${error.message}`)
    }
    return handleApiError(error)
  }
}