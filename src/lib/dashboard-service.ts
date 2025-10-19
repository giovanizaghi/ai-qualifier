import { prisma } from "@/lib/prisma"

export interface DashboardStats {
  totalQualifications: number
  completedQualifications: number
  inProgressQualifications: number
  averageScore: number
  bestScore: number
  totalStudyTime: number
  currentStreak: number
  longestStreak: number
  totalAssessments: number
  passedAssessments: number
}

export interface QualificationProgressData {
  id: string
  title: string
  category: string
  difficulty: string
  completionPercentage: number
  status: string
  studyTimeMinutes: number
  bestScore?: number
  lastAttemptScore?: number
  attempts: number
  estimatedDuration: number
  currentTopic?: string
  completedTopics: string[]
}

export interface CategoryPerformance {
  category: string
  score: number
  assessments: number
  trend: 'up' | 'down' | 'stable'
}

export class DashboardService {
  static async getUserDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get qualification progress
      const qualificationProgress = await prisma.qualificationProgress.findMany({
        where: { userId },
        include: {
          qualification: true
        }
      })

      // Get assessment results
      const assessmentResults = await prisma.assessmentResult.findMany({
        where: { userId },
        include: {
          assessment: {
            include: {
              qualification: true
            }
          }
        },
        orderBy: { completedAt: 'desc' }
      })

      const completedQualifications = qualificationProgress.filter(
        p => p.status === 'COMPLETED'
      ).length

      const inProgressQualifications = qualificationProgress.filter(
        p => p.status === 'IN_PROGRESS'
      ).length

      const totalStudyTime = qualificationProgress.reduce(
        (total, p) => total + p.studyTimeMinutes, 0
      )

      const completedAssessments = assessmentResults.filter(
        r => r.status === 'COMPLETED'
      )

      const scores = completedAssessments.map(r => r.score)
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0

      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const passedAssessments = completedAssessments.filter(r => r.passed).length

      // Calculate streak (simplified - in reality you'd want more sophisticated logic)
      const currentStreak = await this.calculateCurrentStreak(userId)
      const longestStreak = await this.calculateLongestStreak(userId)

      return {
        totalQualifications: qualificationProgress.length,
        completedQualifications,
        inProgressQualifications,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        totalStudyTime,
        currentStreak,
        longestStreak,
        totalAssessments: assessmentResults.length,
        passedAssessments
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw new Error('Failed to fetch dashboard statistics')
    }
  }

  static async getUserQualificationProgress(userId: string): Promise<QualificationProgressData[]> {
    try {
      const progress = await prisma.qualificationProgress.findMany({
        where: { userId },
        include: {
          qualification: true
        },
        orderBy: { updatedAt: 'desc' }
      })

      // Get best scores for each qualification
      const qualificationIds = progress.map(p => p.qualificationId)
      const bestScores = await prisma.assessmentResult.groupBy({
        by: ['assessmentId'],
        where: {
          userId,
          assessment: {
            qualificationId: { in: qualificationIds }
          },
          status: 'COMPLETED'
        },
        _max: {
          score: true
        }
      })

      // Get attempt counts
      const attemptCounts = await prisma.assessmentResult.groupBy({
        by: ['assessmentId'],
        where: {
          userId,
          assessment: {
            qualificationId: { in: qualificationIds }
          }
        },
        _count: {
          id: true
        }
      })

      return progress.map(p => ({
        id: p.qualificationId,
        title: p.qualification.title,
        category: p.qualification.category,
        difficulty: p.qualification.difficulty,
        completionPercentage: p.completionPercentage,
        status: p.status,
        studyTimeMinutes: p.studyTimeMinutes,
        bestScore: p.bestScore || undefined,
        lastAttemptScore: p.lastAttemptScore || undefined,
        attempts: p.attempts,
        estimatedDuration: p.qualification.estimatedDuration,
        currentTopic: p.currentTopic || undefined,
        completedTopics: p.completedTopics
      }))
    } catch (error) {
      console.error('Error fetching qualification progress:', error)
      throw new Error('Failed to fetch qualification progress')
    }
  }

  static async getCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
    try {
      const results = await prisma.assessmentResult.findMany({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        include: {
          assessment: {
            include: {
              qualification: true
            }
          }
        },
        orderBy: { completedAt: 'desc' }
      })

      // Group by category and calculate performance
      const categoryMap = new Map<string, { scores: number[], dates: Date[] }>()
      
      results.forEach(result => {
        const category = result.assessment.qualification.category
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { scores: [], dates: [] })
        }
        categoryMap.get(category)!.scores.push(result.score)
        categoryMap.get(category)!.dates.push(result.completedAt!)
      })

      return Array.from(categoryMap.entries()).map(([category, data]) => {
        const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        
        // Simple trend calculation - compare first half vs second half of attempts
        const midpoint = Math.floor(data.scores.length / 2)
        const firstHalf = data.scores.slice(0, midpoint)
        const secondHalf = data.scores.slice(midpoint)
        
        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
          
          if (secondAvg > firstAvg + 5) trend = 'up'
          else if (secondAvg < firstAvg - 5) trend = 'down'
        }

        return {
          category,
          score: Math.round(averageScore),
          assessments: data.scores.length,
          trend
        }
      })
    } catch (error) {
      console.error('Error fetching category performance:', error)
      throw new Error('Failed to fetch category performance')
    }
  }

  private static async calculateCurrentStreak(userId: string): Promise<number> {
    // Simplified streak calculation - count consecutive days with completed assessments
    // In a real implementation, you'd want more sophisticated logic
    const recentResults = await prisma.assessmentResult.findMany({
      where: { 
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    // Group by date and count consecutive days
    const dates = new Set(
      recentResults.map(r => r.completedAt!.toDateString())
    )

    let streak = 0
    let currentDate = new Date()
    
    while (dates.has(currentDate.toDateString())) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }

  private static async calculateLongestStreak(userId: string): Promise<number> {
    // Simplified implementation - in reality you'd want to track this in the database
    return 12 // Placeholder
  }

  static async getUserAchievements(userId: string) {
    try {
      return await prisma.achievement.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' }
      })
    } catch (error) {
      console.error('Error fetching achievements:', error)
      throw new Error('Failed to fetch achievements')
    }
  }
}