import { prisma } from "@/lib/prisma"

export interface Recommendation {
  id: string
  type: 'qualification' | 'topic' | 'skill_gap' | 'review'
  title: string
  description: string
  reason: string
  confidence: number
  priority: 'high' | 'medium' | 'low'
  category: string
  difficulty: string
  estimatedTime: number
  metadata?: {
    currentScore?: number
    averageScore?: number
    completionRate?: number
    relatedQualifications?: string[]
  }
}

export interface StudyInsight {
  type: 'strength' | 'weakness' | 'trend' | 'opportunity'
  title: string
  description: string
  actionItems: string[]
  impact: 'high' | 'medium' | 'low'
}

export class RecommendationService {
  static async generateRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const [userProgress, assessmentResults, allQualifications] = await Promise.all([
        this.getUserProgress(userId),
        this.getUserAssessmentResults(userId),
        this.getAllQualifications()
      ])

      const recommendations: Recommendation[] = []

      // 1. Skill Gap Analysis
      const skillGaps = this.identifySkillGaps(assessmentResults)
      recommendations.push(...skillGaps)

      // 2. Next Logical Steps
      const nextSteps = this.identifyNextSteps(userProgress, allQualifications)
      recommendations.push(...nextSteps)

      // 3. Review Recommendations
      const reviewItems = this.identifyReviewItems(assessmentResults)
      recommendations.push(...reviewItems)

      // 4. Trending/Popular Content
      const trendingContent = await this.getTrendingContent(userId)
      recommendations.push(...trendingContent)

      // Sort by priority and confidence
      return recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence
        })
        .slice(0, 10) // Limit to top 10 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error)
      return []
    }
  }

  static async generateStudyInsights(userId: string): Promise<StudyInsight[]> {
    try {
      const [assessmentResults, userProgress] = await Promise.all([
        this.getUserAssessmentResults(userId),
        this.getUserProgress(userId)
      ])

      const insights: StudyInsight[] = []

      // Analyze performance patterns
      const performanceInsights = this.analyzePerformancePatterns(assessmentResults)
      insights.push(...performanceInsights)

      // Analyze study patterns
      const studyInsights = this.analyzeStudyPatterns(userProgress)
      insights.push(...studyInsights)

      // Identify opportunities
      const opportunities = this.identifyOpportunities(assessmentResults, userProgress)
      insights.push(...opportunities)

      return insights.slice(0, 5) // Limit to top 5 insights
    } catch (error) {
      console.error('Error generating study insights:', error)
      return []
    }
  }

  private static async getUserProgress(userId: string) {
    return await prisma.qualificationProgress.findMany({
      where: { userId },
      include: {
        qualification: true
      }
    })
  }

  private static async getUserAssessmentResults(userId: string) {
    return await prisma.assessmentResult.findMany({
      where: { userId },
      include: {
        assessment: {
          include: {
            qualification: true
          }
        },
        questionResults: {
          include: {
            question: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })
  }

  private static async getAllQualifications() {
    return await prisma.qualification.findMany({
      where: { 
        isActive: true,
        isPublished: true
      }
    })
  }

  private static identifySkillGaps(assessmentResults: any[]): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Group results by category and find low-performing areas
    const categoryPerformance = new Map<string, { scores: number[], total: number }>()
    
    assessmentResults.forEach(result => {
      if (result.status === 'COMPLETED') {
        const category = result.assessment.qualification.category
        if (!categoryPerformance.has(category)) {
          categoryPerformance.set(category, { scores: [], total: 0 })
        }
        categoryPerformance.get(category)!.scores.push(result.score)
        categoryPerformance.get(category)!.total++
      }
    })

    // Find categories with average score below 70%
    categoryPerformance.forEach((data, category) => {
      const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
      
      if (averageScore < 70 && data.total >= 2) {
        recommendations.push({
          id: `skill_gap_${category.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'skill_gap',
          title: `Strengthen ${category} Skills`,
          description: `Your performance in ${category} shows room for improvement`,
          reason: `Average score of ${Math.round(averageScore)}% in ${category} assessments`,
          confidence: Math.min(90, Math.round((70 - averageScore) * 2)), // Higher confidence for lower scores
          priority: averageScore < 50 ? 'high' : averageScore < 60 ? 'medium' : 'low',
          category: category,
          difficulty: 'Intermediate',
          estimatedTime: 120,
          metadata: {
            currentScore: Math.round(averageScore),
            averageScore: 70
          }
        })
      }
    })

    return recommendations
  }

  private static identifyNextSteps(userProgress: any[], allQualifications: any[]): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Find qualifications the user hasn't started that match their level
    const completedQualificationIds = new Set(
      userProgress
        .filter(p => p.status === 'COMPLETED')
        .map(p => p.qualificationId)
    )

    const inProgressQualificationIds = new Set(
      userProgress
        .filter(p => p.status === 'IN_PROGRESS')
        .map(p => p.qualificationId)
    )

    // Find suitable next qualifications
    const availableQualifications = allQualifications.filter(
      q => !completedQualificationIds.has(q.id) && !inProgressQualificationIds.has(q.id)
    )

    // Recommend based on user's current level and categories
    const userCategories = new Set(
      userProgress.map(p => p.qualification.category)
    )

    availableQualifications
      .filter(q => userCategories.has(q.category) || userCategories.size === 0)
      .slice(0, 3)
      .forEach((qualification, index) => {
        recommendations.push({
          id: qualification.id,
          type: 'qualification',
          title: qualification.title,
          description: qualification.description,
          reason: userCategories.has(qualification.category) 
            ? `Continue your ${qualification.category} learning journey`
            : 'Expand your AI knowledge into new areas',
          confidence: userCategories.has(qualification.category) ? 85 : 70,
          priority: index === 0 ? 'high' : 'medium',
          category: qualification.category,
          difficulty: qualification.difficulty,
          estimatedTime: qualification.estimatedDuration
        })
      })

    return recommendations
  }

  private static identifyReviewItems(assessmentResults: any[]): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Find assessments with low scores that might need review
    const reviewCandidates = assessmentResults
      .filter(result => 
        result.status === 'COMPLETED' && 
        result.score < 80 && 
        result.completedAt &&
        (Date.now() - new Date(result.completedAt).getTime()) > 7 * 24 * 60 * 60 * 1000 // More than a week ago
      )
      .slice(0, 2)

    reviewCandidates.forEach(result => {
      recommendations.push({
        id: `review_${result.assessment.qualificationId}`,
        type: 'review',
        title: `Review ${result.assessment.qualification.title}`,
        description: 'Reinforce your knowledge and improve your score',
        reason: `Your score of ${Math.round(result.score)}% could be improved with review`,
        confidence: 75,
        priority: 'medium',
        category: result.assessment.qualification.category,
        difficulty: result.assessment.qualification.difficulty,
        estimatedTime: Math.round(result.assessment.qualification.estimatedDuration * 0.6), // 60% of original time
        metadata: {
          currentScore: Math.round(result.score),
          averageScore: 80
        }
      })
    })

    return recommendations
  }

  private static async getTrendingContent(userId: string): Promise<Recommendation[]> {
    // Simplified trending logic - in reality you'd track popularity metrics
    const trendingQualifications = await prisma.qualification.findMany({
      where: {
        isActive: true,
        isPublished: true
      },
      take: 2,
      orderBy: { createdAt: 'desc' }
    })

    return trendingQualifications.map(qualification => ({
      id: `trending_${qualification.id}`,
      type: 'qualification' as const,
      title: qualification.title,
      description: qualification.description,
      reason: 'Popular among other learners',
      confidence: 60,
      priority: 'low' as const,
      category: qualification.category,
      difficulty: qualification.difficulty,
      estimatedTime: qualification.estimatedDuration
    }))
  }

  private static analyzePerformancePatterns(assessmentResults: any[]): StudyInsight[] {
    const insights: StudyInsight[] = []
    
    if (assessmentResults.length === 0) return insights

    const scores = assessmentResults
      .filter(r => r.status === 'COMPLETED' && r.completedAt)
      .map(r => r.score)

    if (scores.length >= 3) {
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const recentScores = scores.slice(0, Math.min(3, scores.length))
      const recentAverage = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length

      if (recentAverage > averageScore + 10) {
        insights.push({
          type: 'trend',
          title: 'Improving Performance',
          description: 'Your recent scores show consistent improvement',
          actionItems: [
            'Continue your current study approach',
            'Consider tackling more challenging topics'
          ],
          impact: 'high'
        })
      }

      if (averageScore >= 85) {
        insights.push({
          type: 'strength',
          title: 'Excellent Performance',
          description: 'You consistently achieve high scores across assessments',
          actionItems: [
            'Share your knowledge with other learners',
            'Consider advanced or specialized topics'
          ],
          impact: 'high'
        })
      }
    }

    return insights
  }

  private static analyzeStudyPatterns(userProgress: any[]): StudyInsight[] {
    const insights: StudyInsight[] = []
    
    const totalStudyTime = userProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0)
    const avgStudyTime = totalStudyTime / Math.max(1, userProgress.length)

    if (avgStudyTime > 180) { // More than 3 hours average
      insights.push({
        type: 'opportunity',
        title: 'Optimize Study Time',
        description: 'You spend substantial time studying - consider efficiency techniques',
        actionItems: [
          'Try spaced repetition techniques',
          'Focus on practice questions',
          'Use active recall methods'
        ],
        impact: 'medium'
      })
    }

    return insights
  }

  private static identifyOpportunities(assessmentResults: any[], userProgress: any[]): StudyInsight[] {
    const insights: StudyInsight[] = []
    
    const inProgressCount = userProgress.filter(p => p.status === 'IN_PROGRESS').length
    
    if (inProgressCount > 3) {
      insights.push({
        type: 'opportunity',
        title: 'Focus Your Efforts',
        description: 'You have multiple qualifications in progress',
        actionItems: [
          'Complete one qualification before starting another',
          'Set priority order for your active qualifications',
          'Consider pausing less critical topics'
        ],
        impact: 'medium'
      })
    }

    return insights
  }
}