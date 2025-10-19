import { NextRequest, NextResponse } from "next/server"
import { questionBankService } from "@/lib/question-bank"
import { 
  successResponse,
  handleApiError
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"

// GET /api/questions/categories/[qualificationId] - Get question categories for a qualification
export async function GET(req: NextRequest, { params }: { params: Promise<{ qualificationId: string }> }) {
  try {
    // Apply rate limiting
    const protection = await protectApiRoute(req, {
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { qualificationId } = await params

    const categoryHierarchy = await questionBankService.getQuestionCategories(qualificationId)

    return successResponse(categoryHierarchy, "Question categories retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}