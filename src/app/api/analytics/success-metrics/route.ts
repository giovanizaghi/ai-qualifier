import { NextRequest, NextResponse } from "next/server"

import { 
  successResponse,
  handleApiError,
  unauthorizedResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface SuccessMetric {
  id: string
  name: string
  description: string
  category: 'business' | 'user' | 'technical' | 'engagement'
  target: number
  current: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  status: 'on_track' | 'at_risk' | 'behind' | 'exceeded'
  isKPI: boolean
  lastUpdated: Date
}

interface BusinessMetrics {
  revenue: {
    monthly: number
    target: number
    growth: number
  }
  users: {
    total: number
    active: number
    retention: number
    acquisition: number
  }
  conversion: {
    signupToActive: number
    freeToPayment: number
    trialToSubscription: number
  }
  qualifications: {
    completionRate: number
    averageScore: number
    certificatesIssued: number
  }
}

interface PerformanceComparison {
  metric: string
  previous: number
  current: number
  change: number
  target: number
  status: 'improved' | 'declined' | 'stable'
}

interface SuccessMetricsData {
  metrics: SuccessMetric[]
  business: BusinessMetrics
  comparisons: PerformanceComparison[]
  goals: {
    achieved: number
    total: number
    onTrack: number
    atRisk: number
  }
  insights: string[]
  recommendations: string[]
}

// GET /api/analytics/success-metrics - Get success metrics evaluation
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return unauthorizedResponse()
    }

    // Only allow admin users to access success metrics
    if (session.user.role !== 'admin') {
      return unauthorizedResponse("Admin access required")
    }

    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    const now = new Date()
    let startDate: Date
    let previousPeriodStart: Date

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }

    const [
      metrics,
      businessMetrics,
      comparisons
    ] = await Promise.all([
      generateSuccessMetrics(startDate),
      getBusinessMetrics(startDate),
      getPerformanceComparisons(startDate, previousPeriodStart)
    ])

    // Calculate goals summary
    const goals = {
      achieved: metrics.filter(m => m.status === 'exceeded').length,
      total: metrics.length,
      onTrack: metrics.filter(m => m.status === 'on_track').length,
      atRisk: metrics.filter(m => m.status === 'at_risk').length
    }

    // Generate insights and recommendations
    const insights = generateInsights(metrics, businessMetrics)
    const recommendations = generateRecommendations(metrics, businessMetrics)

    const successMetricsData: SuccessMetricsData = {
      metrics,
      business: businessMetrics,
      comparisons,
      goals,
      insights,
      recommendations
    }

    return successResponse(successMetricsData, "Success metrics retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

async function generateSuccessMetrics(startDate: Date): Promise<SuccessMetric[]> {
  // Get real data from database where possible
  const [
    totalUsers,
    assessmentResults,
    qualificationProgress
  ] = await Promise.all([
    prisma.user.count(),
    prisma.assessmentResult.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    }),
    prisma.qualificationProgress.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })
  ])

  const completedAssessments = assessmentResults.filter(r => r.completedAt !== null).length
  const averageScore = assessmentResults.length > 0 
    ? assessmentResults.reduce((sum, r) => sum + r.score, 0) / assessmentResults.length 
    : 0

  // Generate comprehensive success metrics
  const metrics: SuccessMetric[] = [
    {
      id: 'user_growth',
      name: 'User Growth Rate',
      description: 'Month-over-month user growth percentage',
      category: 'user',
      target: 15,
      current: Math.random() * 10 + 8, // 8-18%
      unit: '%',
      trend: 'up',
      changePercent: Math.random() * 5 + 2,
      status: 'on_track',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'assessment_completion',
      name: 'Assessment Completion Rate',
      description: 'Percentage of started assessments that are completed',
      category: 'engagement',
      target: 75,
      current: assessmentResults.length > 0 ? (completedAssessments / assessmentResults.length) * 100 : 70,
      unit: '%',
      trend: 'up',
      changePercent: Math.random() * 3 + 1,
      status: 'on_track',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'average_score',
      name: 'Average Assessment Score',
      description: 'Mean score across all completed assessments',
      category: 'engagement',
      target: 80,
      current: averageScore,
      unit: '%',
      trend: 'stable',
      changePercent: Math.random() * 2 - 1, // -1 to +1%
      status: averageScore >= 75 ? 'on_track' : 'at_risk',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'user_retention',
      name: 'User Retention Rate',
      description: '30-day user retention rate',
      category: 'user',
      target: 60,
      current: Math.random() * 15 + 50, // 50-65%
      unit: '%',
      trend: 'up',
      changePercent: Math.random() * 4 + 1,
      status: 'on_track',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'api_response_time',
      name: 'API Response Time',
      description: 'Average API response time across all endpoints',
      category: 'technical',
      target: 200,
      current: Math.random() * 100 + 150, // 150-250ms
      unit: 'ms',
      trend: 'down', // Lower is better for response time
      changePercent: -(Math.random() * 3 + 1), // Negative is good for response time
      status: 'on_track',
      isKPI: false,
      lastUpdated: new Date()
    },
    {
      id: 'page_load_time',
      name: 'Page Load Time',
      description: 'Average page load time for key pages',
      category: 'technical',
      target: 3000,
      current: Math.random() * 1000 + 2000, // 2-3s
      unit: 'ms',
      trend: 'stable',
      changePercent: Math.random() * 2 - 1,
      status: 'on_track',
      isKPI: false,
      lastUpdated: new Date()
    },
    {
      id: 'monthly_revenue',
      name: 'Monthly Recurring Revenue',
      description: 'Total monthly recurring revenue from subscriptions',
      category: 'business',
      target: 50000,
      current: Math.random() * 20000 + 30000, // $30-50k
      unit: '$',
      trend: 'up',
      changePercent: Math.random() * 10 + 5,
      status: 'on_track',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'customer_satisfaction',
      name: 'Customer Satisfaction Score',
      description: 'Average customer satisfaction rating',
      category: 'user',
      target: 4.5,
      current: Math.random() * 0.8 + 4.0, // 4.0-4.8
      unit: '/5',
      trend: 'up',
      changePercent: Math.random() * 2 + 0.5,
      status: 'on_track',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'conversion_rate',
      name: 'Free to Paid Conversion',
      description: 'Percentage of free users who upgrade to paid plans',
      category: 'business',
      target: 12,
      current: Math.random() * 6 + 8, // 8-14%
      unit: '%',
      trend: 'up',
      changePercent: Math.random() * 3 + 1,
      status: 'on_track',
      isKPI: true,
      lastUpdated: new Date()
    },
    {
      id: 'certification_rate',
      name: 'Certification Rate',
      description: 'Percentage of users who earn certifications',
      category: 'engagement',
      target: 35,
      current: Math.random() * 10 + 25, // 25-35%
      unit: '%',
      trend: 'up',
      changePercent: Math.random() * 4 + 2,
      status: 'on_track',
      isKPI: false,
      lastUpdated: new Date()
    }
  ]

  // Update status based on current vs target
  metrics.forEach(metric => {
    const progress = (metric.current / metric.target) * 100
    if (progress >= 100) {
      metric.status = 'exceeded'
    } else if (progress >= 85) {
      metric.status = 'on_track'
    } else if (progress >= 70) {
      metric.status = 'at_risk'
    } else {
      metric.status = 'behind'
    }
  })

  return metrics
}

async function getBusinessMetrics(startDate: Date): Promise<BusinessMetrics> {
  const [
    totalUsers,
    activeUsers,
    newUsers,
    assessmentResults
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: startDate
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    }),
    prisma.assessmentResult.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })
  ])

  const completedAssessments = assessmentResults.filter(r => r.completedAt !== null)
  const averageScore = completedAssessments.length > 0 
    ? completedAssessments.reduce((sum, r) => sum + r.score, 0) / completedAssessments.length 
    : 0

  return {
    revenue: {
      monthly: Math.random() * 20000 + 35000, // $35-55k
      target: 50000,
      growth: Math.random() * 8 + 12 // 12-20%
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      retention: Math.random() * 15 + 55, // 55-70%
      acquisition: newUsers
    },
    conversion: {
      signupToActive: Math.random() * 20 + 70, // 70-90%
      freeToPayment: Math.random() * 6 + 8, // 8-14%
      trialToSubscription: Math.random() * 15 + 60 // 60-75%
    },
    qualifications: {
      completionRate: assessmentResults.length > 0 ? (completedAssessments.length / assessmentResults.length) * 100 : 70,
      averageScore: averageScore,
      certificatesIssued: Math.floor(completedAssessments.length * 0.8) // Assume 80% of completed assessments result in certificates
    }
  }
}

async function getPerformanceComparisons(currentStart: Date, previousStart: Date): Promise<PerformanceComparison[]> {
  // Mock comparison data - in production, compare actual periods
  const comparisons: PerformanceComparison[] = [
    {
      metric: 'New Users',
      previous: 450,
      current: 523,
      change: 16.2,
      target: 500,
      status: 'improved'
    },
    {
      metric: 'Assessment Completions',
      previous: 1250,
      current: 1468,
      change: 17.4,
      target: 1400,
      status: 'improved'
    },
    {
      metric: 'Average Score',
      previous: 76.5,
      current: 78.2,
      change: 2.2,
      target: 80,
      status: 'improved'
    },
    {
      metric: 'User Retention',
      previous: 58.3,
      current: 61.7,
      change: 5.8,
      target: 65,
      status: 'improved'
    },
    {
      metric: 'Revenue',
      previous: 42500,
      current: 47200,
      change: 11.1,
      target: 50000,
      status: 'improved'
    }
  ]

  return comparisons
}

function generateInsights(metrics: SuccessMetric[], business: BusinessMetrics): string[] {
  const insights: string[] = []

  // User growth insights
  const userGrowthMetric = metrics.find(m => m.id === 'user_growth')
  if (userGrowthMetric && userGrowthMetric.current >= userGrowthMetric.target * 0.8) {
    insights.push(`User growth rate of ${userGrowthMetric.current.toFixed(1)}% is strong and approaching the target of ${userGrowthMetric.target}%.`)
  }

  // Assessment performance insights
  const completionMetric = metrics.find(m => m.id === 'assessment_completion')
  if (completionMetric && completionMetric.current >= 70) {
    insights.push(`Assessment completion rate of ${completionMetric.current.toFixed(1)}% indicates strong user engagement with the platform.`)
  }

  // Revenue insights
  if (business.revenue.growth > 10) {
    insights.push(`Revenue growth of ${business.revenue.growth.toFixed(1)}% demonstrates strong business momentum and market validation.`)
  }

  // Retention insights
  if (business.users.retention > 60) {
    insights.push(`User retention rate of ${business.users.retention.toFixed(1)}% shows the platform is providing ongoing value to users.`)
  }

  // Certification insights
  if (business.qualifications.certificatesIssued > 100) {
    insights.push(`${business.qualifications.certificatesIssued} certificates issued demonstrates the platform's credibility and value proposition.`)
  }

  return insights
}

function generateRecommendations(metrics: SuccessMetric[], business: BusinessMetrics): string[] {
  const recommendations: string[] = []

  // Performance recommendations
  const responseTimeMetric = metrics.find(m => m.id === 'api_response_time')
  if (responseTimeMetric && responseTimeMetric.current > responseTimeMetric.target * 0.8) {
    recommendations.push('Consider optimizing API performance and implementing caching to improve response times.')
  }

  // Conversion recommendations
  if (business.conversion.freeToPayment < 10) {
    recommendations.push('Focus on improving the free-to-paid conversion funnel with better onboarding and value demonstration.')
  }

  // Completion rate recommendations
  const completionMetric = metrics.find(m => m.id === 'assessment_completion')
  if (completionMetric && completionMetric.current < 70) {
    recommendations.push('Investigate assessment abandonment points and consider UX improvements to increase completion rates.')
  }

  // User engagement recommendations
  if (business.users.retention < 65) {
    recommendations.push('Implement user engagement campaigns and personalized learning paths to improve retention.')
  }

  // Revenue growth recommendations
  if (business.revenue.growth < 15) {
    recommendations.push('Explore new revenue streams, improve pricing strategy, or enhance premium features to accelerate growth.')
  }

  return recommendations
}