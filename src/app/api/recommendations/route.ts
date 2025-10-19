import { NextRequest } from "next/server"

import { auth } from "@/lib/auth"
import { RecommendationService } from "@/lib/recommendation-service"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [recommendations, studyInsights] = await Promise.all([
      RecommendationService.generateRecommendations(session.user.id),
      RecommendationService.generateStudyInsights(session.user.id)
    ])

    return Response.json({
      recommendations,
      studyInsights,
      learningStyle: "Visual", // This would come from user preferences
      preferredDifficulty: "Intermediate" // This would come from user preferences
    })
  } catch (error) {
    console.error("Recommendations API error:", error)
    return Response.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    )
  }
}