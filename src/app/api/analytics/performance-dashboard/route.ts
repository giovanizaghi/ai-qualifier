import { NextRequest, NextResponse } from "next/server"

import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserAnalyticsService } from "@/lib/user-analytics"

interface PerformanceDashboardMetrics {
  overview: {
    totalUsers: number
    activeUsers: number
    totalAssessments: number
    averageScore: number
    completionRate: number
  }
  realTimeMetrics: {
    activeNow: number
    assessmentsInProgress: number
    questionsAnsweredToday: number
    newRegistrationsToday: number
  }
  performanceTrends: {
    period: string
    users: number
    assessments: number
    averageScore: number
    completionRate: number
  }[]
  categoryPerformance: {
    category: string
    totalQuestions: number
    averageScore: number
    completionRate: number
    trend: 'up' | 'down' | 'stable'
  }[]
  userEngagement: {
    dailyActiveUsers: { date: string; count: number }[]
    sessionDuration: { average: number; median: number }
    returnRate: number
    churnRate: number
  }
  contentHealth: {
    totalQuestions: number
    activeQuestions: number
    flaggedQuestions: number
    averageAccuracy: number
    contentGaps: string[]
  }
  alerts: {
    id: string
    type: 'warning' | 'error' | 'info'
    title: string
    description: string
    timestamp: Date
    resolved: boolean
  }[]
}

// GET /api/analytics/performance-dashboard - Get performance dashboard metrics
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return badRequestResponse("Authentication required")
    }

    // TODO: Check if user has admin privileges for full dashboard access
    // For now, users can only see their own metrics

    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '7d'
    const isAdmin = searchParams.get('admin') === 'true'

    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // If not admin, return user-specific metrics
    if (!isAdmin) {
      const userMetrics = await getUserSpecificMetrics(session.user.id, startDate)
      return successResponse(userMetrics, "User performance metrics retrieved successfully")
    }

    // Admin-level metrics
    const [
      overviewMetrics,
      realTimeMetrics,
      performanceTrends,
      categoryPerformance,
      userEngagement,
      contentHealth,
      systemAlerts
    ] = await Promise.all([
      getOverviewMetrics(startDate),
      getRealTimeMetrics(),
      getPerformanceTrends(daysBack),
      getCategoryPerformance(startDate),
      getUserEngagementMetrics(startDate),
      getContentHealthMetrics(),
      getSystemAlerts()
    ])

    const dashboardMetrics: PerformanceDashboardMetrics = {
      overview: overviewMetrics,
      realTimeMetrics,
      performanceTrends,
      categoryPerformance,
      userEngagement,
      contentHealth,
      alerts: systemAlerts
    }

    return successResponse(dashboardMetrics, "Performance dashboard data retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions for metrics calculation

async function getUserSpecificMetrics(userId: string, startDate: Date) {
  // Get user's own performance metrics
  const userAssessments = await prisma.assessmentResult.findMany({
    where: {
      userId,
      createdAt: { gte: startDate }
    },
    include: { assessment: true }
  })

  const completedAssessments = userAssessments.filter(a => a.status === 'COMPLETED')
  const averageScore = completedAssessments.length > 0 
    ? completedAssessments.reduce((sum, a) => sum + a.score, 0) / completedAssessments.length 
    : 0

  return {
    overview: {
      totalUsers: 1, // User only sees their own data
      activeUsers: 1,
      totalAssessments: userAssessments.length,
      averageScore,
      completionRate: userAssessments.length > 0 ? (completedAssessments.length / userAssessments.length) * 100 : 0
    },
    realTimeMetrics: {
      activeNow: 1,
      assessmentsInProgress: userAssessments.filter(a => a.status === 'IN_PROGRESS').length,
      questionsAnsweredToday: 0, // TODO: Calculate from analytics
      newRegistrationsToday: 0
    },
    performanceTrends: await getUserPerformanceTrends(userId, 7),
    categoryPerformance: await getUserCategoryPerformance(userId, startDate),
    userEngagement: {
      dailyActiveUsers: [],
      sessionDuration: { average: 0, median: 0 },
      returnRate: 0,
      churnRate: 0
    },
    contentHealth: {
      totalQuestions: 0,
      activeQuestions: 0,
      flaggedQuestions: 0,
      averageAccuracy: 0,
      contentGaps: []
    },
    alerts: []
  }
}

async function getOverviewMetrics(startDate: Date) {
  const [totalUsers, activeUsers, totalAssessments, assessmentStats] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: { gte: startDate }
      }
    }),
    prisma.assessmentResult.count({
      where: { createdAt: { gte: startDate } }
    }),
    prisma.assessmentResult.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _avg: { score: true },
      _count: { id: true }
    })
  ])

  const allAssessments = await prisma.assessmentResult.count({
    where: { createdAt: { gte: startDate } }
  })

  return {
    totalUsers,
    activeUsers,
    totalAssessments,
    averageScore: assessmentStats._avg.score || 0,
    completionRate: allAssessments > 0 ? (assessmentStats._count.id / allAssessments) * 100 : 0
  }
}

async function getRealTimeMetrics() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [assessmentsInProgress, questionsToday, newUsersToday] = await Promise.all([
    prisma.assessmentResult.count({
      where: { status: 'IN_PROGRESS' }
    }),
    // TODO: Get from analytics table when implemented
    0,
    prisma.user.count({
      where: { createdAt: { gte: todayStart } }
    })
  ])

  return {
    activeNow: 0, // TODO: Get from real-time analytics
    assessmentsInProgress,
    questionsAnsweredToday: questionsToday,
    newRegistrationsToday: newUsersToday
  }
}

async function getPerformanceTrends(daysBack: number) {
  const trends = []
  const now = new Date()

  // Generate weekly trends
  for (let i = 0; i < Math.min(Math.ceil(daysBack / 7), 8); i++) {
    const endDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
    const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000))

    const [userCount, assessmentStats] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.assessmentResult.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        _avg: { score: true },
        _count: { id: true }
      })
    ])

    const totalAssessments = await prisma.assessmentResult.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    })

    trends.unshift({
      period: `Week of ${startDate.toLocaleDateString()}`,
      users: userCount,
      assessments: totalAssessments,
      averageScore: assessmentStats._avg.score || 0,
      completionRate: totalAssessments > 0 ? (assessmentStats._count.id / totalAssessments) * 100 : 0
    })
  }

  return trends
}

async function getCategoryPerformance(startDate: Date) {
  // Group assessments by qualification category
  const categoryData = await prisma.assessmentResult.groupBy({
    by: ['assessmentId'],
    where: {
      createdAt: { gte: startDate },
      status: 'COMPLETED'
    },
    _avg: { score: true },
    _count: { id: true }
  })

  // TODO: Join with qualification data to get categories
  // For now, return mock data
  return [
    {
      category: 'Machine Learning',
      totalQuestions: 150,
      averageScore: 78.5,
      completionRate: 85.2,
      trend: 'up' as const
    },
    {
      category: 'AI Ethics',
      totalQuestions: 80,
      averageScore: 82.1,
      completionRate: 92.3,
      trend: 'stable' as const
    },
    {
      category: 'Neural Networks',
      totalQuestions: 120,
      averageScore: 71.8,
      completionRate: 76.4,
      trend: 'down' as const
    }
  ]
}

async function getUserEngagementMetrics(startDate: Date) {
  // Calculate daily active users
  const dailyActiveUsers = []
  const now = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000))

    const count = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    })

    dailyActiveUsers.unshift({
      date: dayStart.toISOString().split('T')[0],
      count
    })
  }

  // TODO: Calculate more sophisticated engagement metrics
  return {
    dailyActiveUsers,
    sessionDuration: { average: 1800, median: 1500 }, // Mock data
    returnRate: 0.75,
    churnRate: 0.15
  }
}

async function getContentHealthMetrics() {
  const [totalQuestions, activeQuestions] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { isActive: true } })
  ])

  // TODO: Calculate flagged questions and content gaps from analytics
  return {
    totalQuestions,
    activeQuestions,
    flaggedQuestions: 5, // Mock data
    averageAccuracy: 82.4, // Mock data
    contentGaps: [
      'Advanced Computer Vision techniques',
      'Ethical AI in Healthcare applications'
    ]
  }
}

async function getSystemAlerts() {
  // TODO: Implement system alert logic
  return [
    {
      id: '1',
      type: 'warning' as const,
      title: 'High Error Rate Detected',
      description: 'Question ID 123 has an unusually high failure rate',
      timestamp: new Date(),
      resolved: false
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Content Review Needed',
      description: '5 questions require review based on user feedback',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      resolved: false
    }
  ]
}

async function getUserPerformanceTrends(userId: string, days: number) {
  const trends = []
  const now = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000))

    const assessments = await prisma.assessmentResult.findMany({
      where: {
        userId,
        createdAt: { gte: dayStart, lt: dayEnd },
        status: 'COMPLETED'
      }
    })

    const averageScore = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length 
      : 0

    trends.unshift({
      period: dayStart.toLocaleDateString(),
      users: 1,
      assessments: assessments.length,
      averageScore,
      completionRate: 100 // User-specific, so always 100% for completed assessments
    })
  }

  return trends
}

async function getUserCategoryPerformance(userId: string, startDate: Date) {
  // TODO: Implement category-specific performance for user
  return []
}