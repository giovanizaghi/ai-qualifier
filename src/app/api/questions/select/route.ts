import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { questionBankService } from "@/lib/question-bank"
import { DifficultyLevel, QuestionType } from "@/types"

// Schema for question selection request
const questionSelectionSchema = z.object({
  qualificationId: z.string().min(1, "Qualification ID is required"),
  totalQuestions: z.number().min(1).max(200).default(50),
  categories: z.array(z.object({
    categoryId: z.string(),
    count: z.number().min(1),
    weight: z.number().min(0).max(1).optional()
  })).optional(),
  difficultyDistribution: z.object({
    BEGINNER: z.number().min(0).max(1).default(0.3),
    INTERMEDIATE: z.number().min(0).max(1).default(0.4),
    ADVANCED: z.number().min(0).max(1).default(0.25),
    EXPERT: z.number().min(0).max(1).default(0.05)
  }).default({
    BEGINNER: 0.3,
    INTERMEDIATE: 0.4,
    ADVANCED: 0.25,
    EXPERT: 0.05
  }),
  typeDistribution: z.object({
    MULTIPLE_CHOICE: z.number().min(0).max(1).optional(),
    MULTIPLE_SELECT: z.number().min(0).max(1).optional(),
    TRUE_FALSE: z.number().min(0).max(1).optional(),
    FILL_IN_BLANK: z.number().min(0).max(1).optional(),
    CODING_CHALLENGE: z.number().min(0).max(1).optional(),
    DRAG_AND_DROP: z.number().min(0).max(1).optional(),
    MATCHING: z.number().min(0).max(1).optional(),
    ESSAY: z.number().min(0).max(1).optional()
  }).optional(),
  excludeQuestionIds: z.array(z.string()).optional(),
  prioritizeNew: z.boolean().default(false),
  adaptiveSelection: z.boolean().default(false),
  userLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  previousAttempts: z.array(z.string()).optional()
})

// POST /api/questions/select - Dynamically select questions for an assessment
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
    const validatedData = questionSelectionSchema.parse(body)

    // Validate difficulty distribution sums to 1 (with some tolerance)
    const difficultySum = Object.values(validatedData.difficultyDistribution).reduce((sum, val) => sum + val, 0)
    if (Math.abs(difficultySum - 1) > 0.01) {
      return badRequestResponse("Difficulty distribution must sum to 1.0")
    }

    // Validate type distribution if provided
    if (validatedData.typeDistribution) {
      const typeSum = Object.values(validatedData.typeDistribution).reduce((sum, val) => sum + (val || 0), 0)
      if (typeSum > 0 && Math.abs(typeSum - 1) > 0.01) {
        return badRequestResponse("Type distribution must sum to 1.0 if specified")
      }
    }

    const selectedQuestions = await questionBankService.selectQuestions({
      qualificationId: validatedData.qualificationId,
      totalQuestions: validatedData.totalQuestions,
      categories: validatedData.categories,
      difficultyDistribution: validatedData.difficultyDistribution as Record<DifficultyLevel, number>,
      typeDistribution: validatedData.typeDistribution as Record<QuestionType, number> | undefined,
      excludeQuestionIds: validatedData.excludeQuestionIds,
      prioritizeNew: validatedData.prioritizeNew,
      adaptiveSelection: validatedData.adaptiveSelection,
      userLevel: validatedData.userLevel as DifficultyLevel,
      previousAttempts: validatedData.previousAttempts
    })

    return successResponse(selectedQuestions, "Questions selected successfully")

  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse(`Invalid request data: ${error.message}`)
    }
    return handleApiError(error)
  }
}