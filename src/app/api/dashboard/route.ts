import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { DashboardService } from "@/lib/dashboard-service"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [stats, qualificationProgress, categoryPerformance, achievements] = await Promise.all([
      DashboardService.getUserDashboardStats(session.user.id),
      DashboardService.getUserQualificationProgress(session.user.id),
      DashboardService.getCategoryPerformance(session.user.id),
      DashboardService.getUserAchievements(session.user.id)
    ])

    return Response.json({
      stats,
      qualificationProgress,
      categoryPerformance,
      achievements
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}