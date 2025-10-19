import { NextRequest, NextResponse } from "next/server"

import { 
  successResponse,
  handleApiError,
  badRequestResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { DashboardService } from "@/lib/dashboard-service"
import { prisma } from "@/lib/prisma"
import { progressTrackingService } from "@/lib/progress-tracking"
import { UserAnalyticsService } from "@/lib/user-analytics"

interface DetailedProgressReport {
  user: {
    id: string
    name: string
    email: string
    joinedAt: Date
  }
  summary: {
    totalQualifications: number
    completedQualifications: number
    inProgressQualifications: number
    averageScore: number
    totalStudyTime: number
    achievementsEarned: number
  }
  qualificationProgress: {
    qualification: {
      id: string
      title: string
      category: string
      difficulty: string
    }
    progress: {
      status: string
      completionPercentage: number
      studyTimeMinutes: number
      attempts: number
      bestScore: number | null
      lastAttemptScore: number | null
      currentTopic: string | null
      completedTopics: string[]
    }
    analytics: {
      learningVelocity: number
      consistencyScore: number
      difficultyProgression: string
      timeToMastery: number | null
    }
  }[]
  categoryAnalysis: {
    category: string
    proficiency: number
    timeInvested: number
    improvementTrend: 'improving' | 'stable' | 'declining'
    recommendedFocus: boolean
    strengths: string[]
    weaknesses: string[]
  }[]
  learningPatterns: {
    preferredStudyTimes: { hour: number; dayOfWeek: number }[]
    sessionDuration: {
      average: number
      optimal: number
      consistency: number
    }
    engagementMetrics: {
      streakData: { current: number; longest: number }
      returnRate: number
      motivationalFactors: string[]
    }
  }
  performanceTrends: {
    period: string
    averageScore: number
    studyTime: number
    assessmentsCompleted: number
    improvementRate: number
  }[]
  achievements: {
    id: string
    type: string
    title: string
    description: string
    earnedAt: Date
    category: string
  }[]
  recommendations: {
    nextSteps: string[]
    focusAreas: string[]
    studySchedule: {
      frequency: string
      duration: number
      timing: string
    }
    difficultyAdjustment: string
  }
  insights: {
    burnoutRisk: 'low' | 'medium' | 'high'
    masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    learningEfficiency: number
    retentionRate: number
  }
}

// GET /api/analytics/progress-report - Get detailed progress report for user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return badRequestResponse("Authentication required")
    }

    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '90d'
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true'
    const targetUserId = searchParams.get('userId') // For admin access

    // Check if requesting data for another user (admin only)
    const userId = session.user.id
    if (targetUserId && targetUserId !== session.user.id) {
      // TODO: Check if user has admin role
      // For now, only allow self-access
      return badRequestResponse("Access denied")
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    if (!user) {
      return badRequestResponse("User not found")
    }

    // Get basic dashboard stats
    const dashboardStats = await DashboardService.getUserDashboardStats(userId)
    
    // Get qualification progress
    const qualificationProgress = await DashboardService.getUserQualificationProgress(userId)
    
    // Get category performance
    const categoryPerformance = await DashboardService.getCategoryPerformance(userId)
    
    // Get achievements
    const achievements = await DashboardService.getUserAchievements(userId)

    // Get analytics data if requested
    let learningPatterns = null
    let performanceInsights = null
    if (includeAnalytics) {
      [learningPatterns, performanceInsights] = await Promise.all([
        UserAnalyticsService.analyzeLearningPatterns(userId),
        UserAnalyticsService.generatePerformanceInsights(userId)
      ])
    }

    // Get performance trends
    const performanceTrends = await getPerformanceTrends(userId, timeframe)

    // Build detailed progress report
    const report: DetailedProgressReport = {
      user: {
        id: user.id,
        name: user.name || 'Anonymous User',
        email: user.email,
        joinedAt: user.createdAt
      },
      summary: {
        totalQualifications: dashboardStats.totalQualifications,
        completedQualifications: dashboardStats.completedQualifications,
        inProgressQualifications: dashboardStats.inProgressQualifications,
        averageScore: dashboardStats.averageScore,
        totalStudyTime: dashboardStats.totalStudyTime,
        achievementsEarned: achievements.length
      },
      qualificationProgress: await Promise.all(
        qualificationProgress.map(async (progress) => {
          let analytics = null
          if (includeAnalytics) {
            analytics = await generateQualificationAnalytics(userId, progress.id)
          }
          
          return {
            qualification: {
              id: progress.id,
              title: progress.title,
              category: progress.category,
              difficulty: progress.difficulty
            },
            progress: {
              status: progress.status,
              completionPercentage: progress.completionPercentage,
              studyTimeMinutes: progress.studyTimeMinutes,
              attempts: progress.attempts,
              bestScore: progress.bestScore || null,
              lastAttemptScore: progress.lastAttemptScore || null,
              currentTopic: progress.currentTopic || null,
              completedTopics: progress.completedTopics
            },
            analytics: analytics || {
              learningVelocity: 0,
              consistencyScore: 0,
              difficultyProgression: 'stable',
              timeToMastery: null
            }
          }
        })
      ),
      categoryAnalysis: categoryPerformance.map(cat => ({
        category: cat.category,
        proficiency: cat.score,
        timeInvested: 0, // TODO: Calculate from analytics
        improvementTrend: cat.trend === 'up' ? 'improving' as const : 
                         cat.trend === 'down' ? 'declining' as const : 'stable' as const,
        recommendedFocus: cat.score < 70,
        strengths: [], // TODO: Extract from detailed analysis
        weaknesses: [] // TODO: Extract from detailed analysis
      })),
      learningPatterns: learningPatterns ? {
        preferredStudyTimes: learningPatterns.preferredStudyTime,
        sessionDuration: {
          average: learningPatterns.sessionDuration.average,
          optimal: learningPatterns.sessionDuration.median, // Use median as optimal
          consistency: calculateConsistencyScore(learningPatterns.sessionDuration)
        },
        engagementMetrics: learningPatterns.engagementMetrics
      } : {
        preferredStudyTimes: [],
        sessionDuration: { average: 0, optimal: 0, consistency: 0 },
        engagementMetrics: { 
          streakData: { current: 0, longest: 0 }, 
          returnRate: 0, 
          motivationalFactors: [] 
        }
      },
      performanceTrends,
      achievements: achievements.map((achievement: any) => ({
        id: achievement.id,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        earnedAt: achievement.earnedAt,
        category: achievement.category
      })),
      recommendations: performanceInsights?.adaptiveRecommendations ? {
        nextSteps: performanceInsights.adaptiveRecommendations.nextTopics,
        focusAreas: performanceInsights.adaptiveRecommendations.nextTopics,
        studySchedule: performanceInsights.adaptiveRecommendations.studySchedule,
        difficultyAdjustment: performanceInsights.adaptiveRecommendations.difficultyAdjustment
      } : {
        nextSteps: [],
        focusAreas: [],
        studySchedule: {
          frequency: 'daily',
          duration: 30,
          timing: 'evening'
        },
        difficultyAdjustment: 'maintain'
      },
      insights: performanceInsights ? {
        burnoutRisk: performanceInsights.learningEfficiency.burnoutRisk,
        masteryLevel: performanceInsights.overallMetrics.masteryLevel,
        learningEfficiency: performanceInsights.learningEfficiency.retentionRate,
        retentionRate: performanceInsights.learningEfficiency.retentionRate
      } : {
        burnoutRisk: 'low',
        masteryLevel: 'intermediate',
        learningEfficiency: 0.7,
        retentionRate: 0.7
      }
    }

    return successResponse(report, "Progress report generated successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions

async function getPerformanceTrends(userId: string, timeframe: string) {
  const days = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
  const periods = []
  
  // Generate weekly periods for the timeframe
  const now = new Date()
  for (let i = 0; i < Math.min(Math.ceil(days / 7), 12); i++) {
    const endDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
    const startDate = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000))
    
    const assessments = await prisma.assessmentResult.findMany({
      where: {
        userId,
        completedAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      }
    })

    const averageScore = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length 
      : 0

    const studyTime = assessments.reduce((sum, a) => sum + (a.timeSpent || 0), 0)

    periods.unshift({
      period: `Week of ${startDate.toLocaleDateString()}`,
      averageScore,
      studyTime: Math.round(studyTime / 60), // Convert to minutes
      assessmentsCompleted: assessments.length,
      improvementRate: 0 // TODO: Calculate improvement rate
    })
  }

  return periods
}

async function generateQualificationAnalytics(userId: string, qualificationId: string) {
  // Get user's progress for this qualification
  const progress = await progressTrackingService.getProgressAnalytics(userId, qualificationId)
  
  return {
    learningVelocity: calculateLearningVelocity(progress),
    consistencyScore: calculateConsistencyScore(progress),
    difficultyProgression: progress.improvementTrend,
    timeToMastery: progress.estimatedCompletionTime
  }
}

function calculateLearningVelocity(progress: any): number {
  // Calculate learning velocity based on progress rate
  if (progress.timeSpent === 0) {return 0}
  return (progress.overallProgress / progress.timeSpent) * 60 // Progress per hour
}

function calculateConsistencyScore(data: any): number {
  // Calculate consistency score based on session duration variance
  if (!data.average || !data.median) {return 0}
  const variance = Math.abs(data.average - data.median) / data.average
  return Math.max(0, 1 - variance) // Higher score = more consistent
}