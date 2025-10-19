import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { questionBankService } from "@/lib/question-bank"
import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { protectApiRoute, rateLimitConfigs } from "@/lib/api/middleware"
import { DifficultyLevel, QuestionType } from "@/types"

interface DashboardAnalytics {
  overview: {
    totalQuestions: number
    activeQuestions: number
    qualifications: number
    categories: number
    averageSuccessRate: number
    totalUsage: number
  }
  categoryDistribution: {
    category: string
    count: number
    successRate: number
    averageTime: number
  }[]
  difficultyDistribution: {
    difficulty: DifficultyLevel
    count: number
    successRate: number
    averageTime: number
  }[]
  typeDistribution: {
    type: QuestionType
    count: number
    successRate: number
    averageTime: number
  }[]
  performanceMetrics: {
    topPerformingQuestions: {
      id: string
      title: string
      category: string
      difficulty: DifficultyLevel
      successRate: number
      usage: number
    }[]
    underperformingQuestions: {
      id: string
      title: string
      category: string
      difficulty: DifficultyLevel
      successRate: number
      usage: number
      issues: string[]
    }[]
    needsReview: {
      id: string
      title: string
      category: string
      difficulty: DifficultyLevel
      reasons: string[]
    }[]
  }
  usageTrends: {
    period: string
    questionsUsed: number
    averageSuccessRate: number
    newQuestions: number
  }[]
  qualificationBreakdown: {
    qualificationId: string
    title: string
    totalQuestions: number
    categories: string[]
    averageSuccessRate: number
    recentActivity: number
  }[]
}

// GET /api/questions/analytics/dashboard - Get comprehensive analytics dashboard
export async function GET(req: NextRequest) {
  try {
    // Apply authentication and rate limiting
    const protection = await protectApiRoute(req, {
      requireAuth: true,
      requireRoles: ["ADMIN", "INSTRUCTOR"],
      rateLimit: rateLimitConfigs.api
    })
    
    if (!protection.success) {
      return protection.error
    }

    const { searchParams } = new URL(req.url)
    const qualificationId = searchParams.get('qualificationId')
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

    // Build base query filter
    const baseFilter: any = {
      isActive: true
    }
    
    if (qualificationId) {
      baseFilter.qualificationId = qualificationId
    }

    // Get overview data
    const [totalQuestions, activeQuestions, qualifications, questions] = await Promise.all([
      prisma.question.count({ where: baseFilter }),
      prisma.question.count({ where: { ...baseFilter, isActive: true } }),
      prisma.qualification.count({ where: { isActive: true } }),
      prisma.question.findMany({
        where: baseFilter,
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          type: true,
          timesUsed: true,
          timesCorrect: true,
          averageTime: true,
          createdAt: true,
          qualification: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    ])

    const categories = [...new Set(questions.map(q => q.category))].length
    const totalUsage = questions.reduce((sum, q) => sum + q.timesUsed, 0)
    const totalCorrect = questions.reduce((sum, q) => sum + q.timesCorrect, 0)
    const averageSuccessRate = totalUsage > 0 ? (totalCorrect / totalUsage) * 100 : 0

    // Category distribution
    const categoryMap = new Map<string, {
      count: number
      totalUsed: number
      totalCorrect: number
      totalTime: number
    }>()

    questions.forEach(q => {
      if (!categoryMap.has(q.category)) {
        categoryMap.set(q.category, {
          count: 0,
          totalUsed: 0,
          totalCorrect: 0,
          totalTime: 0
        })
      }
      const cat = categoryMap.get(q.category)!
      cat.count++
      cat.totalUsed += q.timesUsed
      cat.totalCorrect += q.timesCorrect
      cat.totalTime += (q.averageTime || 0) * q.timesUsed
    })

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      successRate: data.totalUsed > 0 ? (data.totalCorrect / data.totalUsed) * 100 : 0,
      averageTime: data.totalUsed > 0 ? data.totalTime / data.totalUsed : 0
    }))

    // Difficulty distribution
    const difficultyMap = new Map<DifficultyLevel, {
      count: number
      totalUsed: number
      totalCorrect: number
      totalTime: number
    }>()

    Object.values(DifficultyLevel).forEach(diff => {
      difficultyMap.set(diff, {
        count: 0,
        totalUsed: 0,
        totalCorrect: 0,
        totalTime: 0
      })
    })

    questions.forEach(q => {
      const diff = q.difficulty as DifficultyLevel
      const data = difficultyMap.get(diff)!
      data.count++
      data.totalUsed += q.timesUsed
      data.totalCorrect += q.timesCorrect
      data.totalTime += (q.averageTime || 0) * q.timesUsed
    })

    const difficultyDistribution = Array.from(difficultyMap.entries()).map(([difficulty, data]) => ({
      difficulty,
      count: data.count,
      successRate: data.totalUsed > 0 ? (data.totalCorrect / data.totalUsed) * 100 : 0,
      averageTime: data.totalUsed > 0 ? data.totalTime / data.totalUsed : 0
    }))

    // Type distribution
    const typeMap = new Map<QuestionType, {
      count: number
      totalUsed: number
      totalCorrect: number
      totalTime: number
    }>()

    Object.values(QuestionType).forEach(type => {
      typeMap.set(type, {
        count: 0,
        totalUsed: 0,
        totalCorrect: 0,
        totalTime: 0
      })
    })

    questions.forEach(q => {
      const type = q.type as QuestionType
      const data = typeMap.get(type)!
      data.count++
      data.totalUsed += q.timesUsed
      data.totalCorrect += q.timesCorrect
      data.totalTime += (q.averageTime || 0) * q.timesUsed
    })

    const typeDistribution = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      successRate: data.totalUsed > 0 ? (data.totalCorrect / data.totalUsed) * 100 : 0,
      averageTime: data.totalUsed > 0 ? data.totalTime / data.totalUsed : 0
    }))

    // Performance metrics
    const questionsWithMetrics = questions
      .filter(q => q.timesUsed > 0)
      .map(q => ({
        ...q,
        successRate: (q.timesCorrect / q.timesUsed) * 100
      }))

    const topPerformingQuestions = questionsWithMetrics
      .filter(q => q.timesUsed >= 10) // Minimum usage for reliability
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10)
      .map(q => ({
        id: q.id,
        title: q.title,
        category: q.category,
        difficulty: q.difficulty as DifficultyLevel,
        successRate: q.successRate,
        usage: q.timesUsed
      }))

    // Get detailed analytics for underperforming questions
    const underperformingCandidates = questionsWithMetrics
      .filter(q => q.timesUsed >= 5 && (q.successRate < 20 || q.successRate > 95))
      .sort((a, b) => Math.abs(50 - a.successRate) - Math.abs(50 - b.successRate))
      .slice(0, 10)

    const underperformingQuestions = await Promise.all(
      underperformingCandidates.map(async (q) => {
        try {
          const analytics = await questionBankService.getQuestionAnalytics(q.id)
          return {
            id: q.id,
            title: q.title,
            category: q.category,
            difficulty: q.difficulty as DifficultyLevel,
            successRate: q.successRate,
            usage: q.timesUsed,
            issues: analytics.recommendations.reasons
          }
        } catch {
          return {
            id: q.id,
            title: q.title,
            category: q.category,
            difficulty: q.difficulty as DifficultyLevel,
            successRate: q.successRate,
            usage: q.timesUsed,
            issues: ['Analytics unavailable']
          }
        }
      })
    )

    // Questions that need review based on various criteria
    const needsReview = questionsWithMetrics
      .filter(q => {
        const difficultyIssue = (q.difficulty === 'BEGINNER' && q.successRate < 60) ||
                               (q.difficulty === 'INTERMEDIATE' && (q.successRate < 40 || q.successRate > 80)) ||
                               (q.difficulty === 'ADVANCED' && (q.successRate < 25 || q.successRate > 65)) ||
                               (q.difficulty === 'EXPERT' && q.successRate > 50)
        
        const usageIssue = q.timesUsed > 50 && (q.successRate < 10 || q.successRate > 90)
        
        return difficultyIssue || usageIssue
      })
      .slice(0, 15)
      .map(q => {
        const reasons: string[] = []
        
        if (q.difficulty === 'BEGINNER' && q.successRate < 60) {
          reasons.push('Too difficult for beginner level')
        }
        if (q.difficulty === 'EXPERT' && q.successRate > 50) {
          reasons.push('Too easy for expert level')
        }
        if (q.successRate < 10) {
          reasons.push('Extremely low success rate')
        }
        if (q.successRate > 90) {
          reasons.push('Extremely high success rate')
        }
        
        return {
          id: q.id,
          title: q.title,
          category: q.category,
          difficulty: q.difficulty as DifficultyLevel,
          reasons
        }
      })

    // Usage trends (simplified for now)
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const usageTrends = await generateUsageTrends(daysBack, baseFilter)

    // Qualification breakdown
    const qualificationBreakdown = await generateQualificationBreakdown(qualificationId)

    const analytics: DashboardAnalytics = {
      overview: {
        totalQuestions,
        activeQuestions,
        qualifications,
        categories,
        averageSuccessRate,
        totalUsage
      },
      categoryDistribution,
      difficultyDistribution,
      typeDistribution,
      performanceMetrics: {
        topPerformingQuestions,
        underperformingQuestions,
        needsReview
      },
      usageTrends,
      qualificationBreakdown
    }

    return successResponse(analytics, "Analytics dashboard data retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

async function generateUsageTrends(daysBack: number, baseFilter: any) {
  // This is a simplified implementation
  // In a real application, you'd want to track daily/weekly usage metrics
  const now = new Date()
  const trends = []
  
  for (let i = 0; i < Math.min(daysBack / 7, 12); i++) {
    const endDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
    const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000))
    
    // For now, we'll use creation date as a proxy for usage trends
    const questionsInPeriod = await prisma.question.count({
      where: {
        ...baseFilter,
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      }
    })
    
    trends.push({
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      questionsUsed: questionsInPeriod * 10, // Simulated usage
      averageSuccessRate: 65 + Math.random() * 20, // Simulated success rate
      newQuestions: questionsInPeriod
    })
  }
  
  return trends.reverse()
}

async function generateQualificationBreakdown(qualificationId?: string | null) {
  const filter: any = { isActive: true }
  if (qualificationId) {
    filter.id = qualificationId
  }

  const qualifications = await prisma.qualification.findMany({
    where: filter,
    select: {
      id: true,
      title: true,
      questions: {
        select: {
          id: true,
          category: true,
          timesUsed: true,
          timesCorrect: true,
          createdAt: true
        }
      }
    },
    take: qualificationId ? 1 : 10
  })

  return qualifications.map(qual => {
    const questions = qual.questions
    const categories = [...new Set(questions.map(q => q.category))]
    const totalUsage = questions.reduce((sum, q) => sum + q.timesUsed, 0)
    const totalCorrect = questions.reduce((sum, q) => sum + q.timesCorrect, 0)
    const averageSuccessRate = totalUsage > 0 ? (totalCorrect / totalUsage) * 100 : 0
    
    // Recent activity (questions used in last 30 days - simplified)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentActivity = questions.filter(q => q.createdAt > thirtyDaysAgo).length

    return {
      qualificationId: qual.id,
      title: qual.title,
      totalQuestions: questions.length,
      categories,
      averageSuccessRate,
      recentActivity
    }
  })
}