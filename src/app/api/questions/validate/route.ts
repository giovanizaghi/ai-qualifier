import { NextRequest, NextResponse } from "next/server"
import { questionBankService } from "@/lib/question-bank"
import { QuestionDifficultyValidator, QuestionContentValidator } from "@/lib/question-validation"
import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { QuestionType, DifficultyLevel } from "@/types"

// POST /api/questions/validate - Validate question before creation/update
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
    
    const { title, content, type, difficulty, category, options } = body

    if (!title || !content || !type || !difficulty || !category) {
      return badRequestResponse("Missing required fields: title, content, type, difficulty, category")
    }

    // Validate content
    const contentValidation = QuestionContentValidator.validateContent({
      title,
      content,
      type: type as QuestionType,
      options
    })

    // Validate difficulty
    const difficultyValidation = QuestionDifficultyValidator.validateDifficulty({
      content,
      type: type as QuestionType,
      options,
      category
    }, difficulty as DifficultyLevel)

    const result = {
      content: contentValidation,
      difficulty: difficultyValidation,
      overall: {
        isValid: contentValidation.isValid && difficultyValidation.isValid,
        hasWarnings: contentValidation.warnings.length > 0 || difficultyValidation.reasons.length > 0
      }
    }

    return successResponse(result, "Question validation completed")

  } catch (error) {
    return handleApiError(error)
  }
}