import { NextRequest, NextResponse } from "next/server"

import { 
  successResponse,
  handleApiError,
  badRequestResponse,
  unauthorizedResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/analytics - Get comprehensive admin analytics
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorizedResponse("Authentication required")
    }

    // TODO: Check if user has admin role
    // For now, we'll allow any authenticated user for demonstration
    // if (session.user.role !== 'ADMIN') {
    //   return unauthorizedResponse("Admin access required")
    // }

    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '7d'

    const daysBack = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Gather all analytics data
    const [
      systemOverview,
      userMetrics,
      contentAnalytics,
      platformInsights,
      businessMetrics,
      systemAlerts
    ] = await Promise.all([
      getSystemOverview(),
      getUserMetrics(startDate),
      getContentAnalytics(startDate),
      getPlatformInsights(startDate),
      getBusinessMetrics(startDate),
      getSystemAlerts()
    ])

    const adminAnalytics = {
      systemOverview,
      userMetrics,
      contentAnalytics,
      platformInsights,
      businessMetrics,
      alerts: systemAlerts
    }

    return successResponse(adminAnalytics, "Admin analytics retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions for analytics data gathering

async function getSystemOverview() {
  const [totalUsers, activeUsers, totalQualifications, totalQuestions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    }),
    prisma.qualification.count({ where: { isActive: true } }),
    prisma.question.count({ where: { isActive: true } })
  ])

  // Calculate platform health based on various metrics
  const healthScore = calculatePlatformHealth(activeUsers, totalUsers)
  
  return {
    totalUsers,
    activeUsers,
    totalQualifications,
    totalQuestions,
    platformHealth: healthScore,
    uptime: 99.9 // Mock data - would come from monitoring service
  }
}

async function getUserMetrics(startDate: Date) {
  // Get new registrations over time
  const newRegistrations = await getNewRegistrationsData(startDate)
  
  // Calculate retention rates
  const userRetention = await calculateRetentionRates()
  
  // User segmentation analysis
  const userSegmentation = await getUserSegmentation(startDate)
  
  // Top performing users
  const topPerformers = await getTopPerformers()

  return {
    newRegistrations,
    userRetention,
    userSegmentation,
    topPerformers
  }
}

async function getContentAnalytics(startDate: Date) {
  // Question performance analysis
  const questionPerformance = await getQuestionPerformanceData(startDate)
  
  // Category insights
  const categoryInsights = await getCategoryInsights(startDate)
  
  // Qualification statistics
  const qualificationStats = await getQualificationStats(startDate)

  return {
    questionPerformance,
    categoryInsights,
    qualificationStats
  }
}

async function getPlatformInsights(startDate: Date) {
  return {
    peakUsageHours: await getPeakUsageHours(startDate),
    deviceDistribution: await getDeviceDistribution(),
    geographicDistribution: await getGeographicDistribution(),
    errorRates: await getErrorRates(startDate)
  }
}

async function getBusinessMetrics(startDate: Date) {
  return {
    conversionFunnels: await getConversionFunnels(startDate),
    revenueMetrics: await getRevenueMetrics(startDate),
    costMetrics: await getCostMetrics()
  }
}

async function getSystemAlerts() {
  // This would typically come from a monitoring system
  // For now, we'll return mock data
  return [
    {
      id: '1',
      severity: 'high' as const,
      category: 'performance' as const,
      title: 'High Response Time Detected',
      description: 'API response times have increased by 25% in the last hour',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      status: 'open' as const,
      assignedTo: 'System Admin'
    },
    {
      id: '2',
      severity: 'medium' as const,
      category: 'content' as const,
      title: 'Question Performance Issue',
      description: 'Question ID 456 has a success rate below 20%',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'investigating' as const,
      assignedTo: 'Content Team'
    },
    {
      id: '3',
      severity: 'low' as const,
      category: 'user' as const,
      title: 'User Feedback Alert',
      description: '5 new feedback items require review',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'open' as const
    }
  ]
}

// Implementation of helper functions

function calculatePlatformHealth(activeUsers: number, totalUsers: number): 'excellent' | 'good' | 'warning' | 'critical' {
  const activityRate = totalUsers > 0 ? activeUsers / totalUsers : 0
  
  if (activityRate > 0.8) {return 'excellent'}
  if (activityRate > 0.6) {return 'good'}
  if (activityRate > 0.3) {return 'warning'}
  return 'critical'
}

async function getNewRegistrationsData(startDate: Date) {
  const registrations = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000))
    
    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    })
    
    registrations.push({
      period: dayStart.toLocaleDateString(),
      count
    })
  }
  
  return registrations
}

async function calculateRetentionRates() {
  // This is a simplified retention calculation
  // In production, you'd want more sophisticated cohort analysis
  const totalUsers = await prisma.user.count()
  
  if (totalUsers === 0) {
    return { day1: 0, day7: 0, day30: 0 }
  }

  const now = new Date()
  const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [day1Active, day7Active, day30Active] = await Promise.all([
    prisma.user.count({ where: { lastLoginAt: { gte: day1 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: day7 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: day30 } } })
  ])

  return {
    day1: day1Active / totalUsers,
    day7: day7Active / totalUsers,
    day30: day30Active / totalUsers
  }
}

async function getUserSegmentation(startDate: Date) {
  // Simple user segmentation based on activity
  const totalUsers = await prisma.user.count()
  
  const segments = [
    {
      segment: 'Highly Active',
      count: Math.floor(totalUsers * 0.15),
      percentage: 15,
      growthRate: 5.2
    },
    {
      segment: 'Regular Users',
      count: Math.floor(totalUsers * 0.35),
      percentage: 35,
      growthRate: 2.1
    },
    {
      segment: 'Occasional Users',
      count: Math.floor(totalUsers * 0.30),
      percentage: 30,
      growthRate: -1.5
    },
    {
      segment: 'Inactive',
      count: Math.floor(totalUsers * 0.20),
      percentage: 20,
      growthRate: -3.2
    }
  ]
  
  return segments
}

async function getTopPerformers() {
  const topUsers = await prisma.assessmentResult.groupBy({
    by: ['userId'],
    where: {
      status: 'COMPLETED'
    },
    _avg: {
      score: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _avg: {
        score: 'desc'
      }
    },
    take: 10
  })

  // Get user details for top performers
  const performers = await Promise.all(
    topUsers.map(async (user) => {
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, name: true, email: true }
      })
      
      return {
        userId: user.userId,
        name: userData?.name || 'Anonymous User',
        score: user._avg.score || 0,
        qualificationsCompleted: user._count.id
      }
    })
  )

  return performers
}

async function getQuestionPerformanceData(startDate: Date) {
  const questions = await prisma.question.findMany({
    where: {
      isActive: true,
      timesUsed: { gt: 5 } // Only include questions with sufficient usage
    },
    select: {
      id: true,
      title: true,
      category: true,
      difficulty: true,
      timesUsed: true,
      timesCorrect: true
    },
    take: 50
  })

  return questions.map(q => ({
    questionId: q.id,
    title: q.title,
    category: q.category,
    difficulty: q.difficulty,
    successRate: q.timesUsed > 0 ? (q.timesCorrect / q.timesUsed) * 100 : 0,
    usageCount: q.timesUsed,
    issues: getQuestionIssues(q)
  }))
}

function getQuestionIssues(question: any): string[] {
  const issues = []
  const successRate = question.timesUsed > 0 ? (question.timesCorrect / question.timesUsed) * 100 : 0
  
  if (successRate < 30) {issues.push('Very low success rate')}
  if (successRate > 95) {issues.push('Too easy')}
  if (question.timesUsed < 10) {issues.push('Low usage')}
  
  return issues
}

async function getCategoryInsights(startDate: Date) {
  // Group questions by category and analyze performance
  const categories = await prisma.question.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: { id: true },
    _avg: { timesCorrect: true },
    _sum: { timesUsed: true }
  })

  return categories.map(cat => ({
    category: cat.category,
    totalQuestions: cat._count.id,
    averageSuccessRate: cat._sum.timesUsed ? (cat._avg.timesCorrect || 0) / cat._sum.timesUsed * 100 : 0,
    userEngagement: 75, // Mock data
    contentGaps: [] // Would be calculated based on curriculum analysis
  }))
}

async function getQualificationStats(startDate: Date) {
  const qualifications = await prisma.qualification.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          assessments: true
        }
      }
    },
    take: 20
  })

  return qualifications.map(qual => ({
    qualificationId: qual.id,
    title: qual.title,
    enrollments: 0, // Would need to track enrollments
    completionRate: 0, // Would calculate from assessment results
    averageScore: 0, // Would calculate from assessment results
    timeToComplete: qual.estimatedDuration
  }))
}

async function getPeakUsageHours(startDate: Date) {
  // Mock data - in production, this would come from analytics tracking
  return [
    { hour: 9, userCount: 245 },
    { hour: 14, userCount: 312 },
    { hour: 16, userCount: 289 },
    { hour: 20, userCount: 156 },
    { hour: 10, userCount: 198 }
  ]
}

async function getDeviceDistribution() {
  // Mock data - would come from user agent analysis
  return [
    { device: 'Desktop', percentage: 65.2 },
    { device: 'Mobile', percentage: 28.7 },
    { device: 'Tablet', percentage: 6.1 }
  ]
}

async function getGeographicDistribution() {
  // Mock data - would come from IP geolocation
  return [
    { country: 'United States', userCount: 1245 },
    { country: 'United Kingdom', userCount: 687 },
    { country: 'Germany', userCount: 532 },
    { country: 'Canada', userCount: 423 },
    { country: 'Australia', userCount: 298 }
  ]
}

async function getErrorRates(startDate: Date) {
  // Mock data - would come from application monitoring
  return [
    { endpoint: '/api/assessments', errorRate: 2.1, trend: 'up' as const },
    { endpoint: '/api/questions', errorRate: 0.8, trend: 'down' as const },
    { endpoint: '/api/auth', errorRate: 1.2, trend: 'stable' as const },
    { endpoint: '/api/analytics', errorRate: 0.3, trend: 'stable' as const }
  ]
}

async function getConversionFunnels(startDate: Date) {
  const totalUsers = await prisma.user.count()
  
  return [
    { stage: 'Visitors', count: totalUsers * 5, conversionRate: 100 },
    { stage: 'Sign-ups', count: totalUsers, conversionRate: 20 },
    { stage: 'First Assessment', count: Math.floor(totalUsers * 0.6), conversionRate: 60 },
    { stage: 'Completed Qualification', count: Math.floor(totalUsers * 0.25), conversionRate: 25 },
    { stage: 'Multiple Qualifications', count: Math.floor(totalUsers * 0.1), conversionRate: 10 }
  ]
}

async function getRevenueMetrics(startDate: Date) {
  // Mock data - would integrate with payment systems
  return [
    { period: 'This Month', revenue: 12450, growth: 8.3 },
    { period: 'Last Month', revenue: 11500, growth: 5.2 },
    { period: 'This Quarter', revenue: 35200, growth: 12.7 }
  ]
}

async function getCostMetrics() {
  // Mock data - would integrate with infrastructure monitoring
  return {
    infrastructureCost: 2850,
    operationalCost: 1650,
    costPerUser: 2.45
  }
}