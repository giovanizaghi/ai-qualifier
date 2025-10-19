/**
 * Question Bank Management System
 * Provides comprehensive question management functionality including
 * categorization, difficulty management, and dynamic selection
 */

import { prisma } from "@/lib/prisma"
import { DifficultyLevel, QuestionType } from "@/types"

// Question Category Management
export interface QuestionCategory {
  id: string
  name: string
  description: string
  parentId?: string
  qualificationId: string
  icon?: string
  order: number
  isActive: boolean
  subcategories?: QuestionCategory[]
}

export interface QuestionCategoryHierarchy {
  categories: QuestionCategory[]
  totalQuestions: number
  questionDistribution: Record<string, number>
}

// Dynamic Question Selection Configuration
export interface QuestionSelectionConfig {
  qualificationId: string
  totalQuestions: number
  categories?: {
    categoryId: string
    count: number
    weight?: number
  }[]
  difficultyDistribution: {
    [key in DifficultyLevel]: number
  }
  typeDistribution?: {
    [key in QuestionType]: number
  }
  excludeQuestionIds?: string[]
  prioritizeNew?: boolean
  adaptiveSelection?: boolean
  userLevel?: DifficultyLevel
  previousAttempts?: string[] // Question IDs from previous attempts
}

export interface SelectedQuestionSet {
  questions: {
    id: string
    title: string
    content: string
    type: QuestionType
    category: string
    difficulty: DifficultyLevel
    points: number
    timeEstimate?: number
    options: any
  }[]
  metadata: {
    totalQuestions: number
    categoryBreakdown: Record<string, number>
    difficultyBreakdown: Record<DifficultyLevel, number>
    typeBreakdown: Record<QuestionType, number>
    estimatedTimeMinutes: number
  }
}

// Question Analytics
export interface QuestionAnalytics {
  questionId: string
  title: string
  category: string
  difficulty: DifficultyLevel
  statistics: {
    timesUsed: number
    timesCorrect: number
    successRate: number
    averageTimeSeconds: number
    difficultyAccuracy: number // How accurate the assigned difficulty is
    discriminationIndex: number // How well the question differentiates skill levels
  }
  trends: {
    recentPerformance: {
      period: '7d' | '30d' | '90d'
      successRate: number
      usageCount: number
    }[]
  }
  recommendations: {
    adjustDifficulty?: DifficultyLevel
    needsReview: boolean
    retire: boolean
    reasons: string[]
  }
}

export class QuestionBankService {
  /**
   * Get question categories for a qualification with hierarchy
   */
  async getQuestionCategories(qualificationId: string): Promise<QuestionCategoryHierarchy> {
    // Get all questions to build category structure and counts
    const questions = await prisma.question.findMany({
      where: {
        qualificationId,
        isActive: true
      },
      select: {
        id: true,
        category: true,
        difficulty: true
      }
    })

    // Build category hierarchy from question data
    const categoryMap = new Map<string, QuestionCategory>()
    const categoryQuestionCounts = new Map<string, number>()

    questions.forEach(question => {
      const categoryName = question.category
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          id: categoryName.toLowerCase().replace(/\s+/g, '-'),
          name: categoryName,
          description: `Questions related to ${categoryName}`,
          qualificationId,
          order: categoryMap.size,
          isActive: true
        })
      }
      
      categoryQuestionCounts.set(
        categoryName, 
        (categoryQuestionCounts.get(categoryName) || 0) + 1
      )
    })

    const categories = Array.from(categoryMap.values()).sort((a, b) => a.order - b.order)
    
    const questionDistribution = Object.fromEntries(categoryQuestionCounts)

    return {
      categories,
      totalQuestions: questions.length,
      questionDistribution
    }
  }

  /**
   * Dynamically select questions based on configuration
   */
  async selectQuestions(config: QuestionSelectionConfig): Promise<SelectedQuestionSet> {
    const baseQuery = {
      qualificationId: config.qualificationId,
      isActive: true,
      ...(config.excludeQuestionIds?.length && {
        id: { notIn: config.excludeQuestionIds }
      })
    }

    // Get available questions with their metadata
    const availableQuestions = await prisma.question.findMany({
      where: baseQuery,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        category: true,
        difficulty: true,
        points: true,
        timeEstimate: true,
        options: true,
        timesUsed: true,
        timesCorrect: true,
        averageTime: true,
        createdAt: true
      },
      orderBy: config.prioritizeNew ? { createdAt: 'desc' } : { timesUsed: 'asc' }
    })

    if (availableQuestions.length === 0) {
      throw new Error('No questions available for selection')
    }

    let selectedQuestions: typeof availableQuestions = []

    if (config.adaptiveSelection && config.userLevel) {
      // Adaptive selection based on user level
      selectedQuestions = this.adaptiveQuestionSelection(
        availableQuestions,
        config
      )
    } else {
      // Standard selection based on distribution requirements
      selectedQuestions = this.standardQuestionSelection(
        availableQuestions,
        config
      )
    }

    // Calculate metadata
    const metadata = this.calculateSelectionMetadata(selectedQuestions)

    return {
      questions: selectedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        content: q.content,
        type: q.type as QuestionType,
        category: q.category,
        difficulty: q.difficulty as DifficultyLevel,
        points: q.points,
        timeEstimate: q.timeEstimate || undefined,
        options: q.options
      })),
      metadata
    }
  }

  /**
   * Adaptive question selection based on user skill level
   */
  private adaptiveQuestionSelection(
    questions: any[],
    config: QuestionSelectionConfig
  ): any[] {
    const userLevel = config.userLevel!
    const selected: any[] = []
    
    // Define difficulty preferences based on user level
    const difficultyPreferences = {
      [DifficultyLevel.BEGINNER]: {
        [DifficultyLevel.BEGINNER]: 0.6,
        [DifficultyLevel.INTERMEDIATE]: 0.3,
        [DifficultyLevel.ADVANCED]: 0.1,
        [DifficultyLevel.EXPERT]: 0.0
      },
      [DifficultyLevel.INTERMEDIATE]: {
        [DifficultyLevel.BEGINNER]: 0.2,
        [DifficultyLevel.INTERMEDIATE]: 0.5,
        [DifficultyLevel.ADVANCED]: 0.25,
        [DifficultyLevel.EXPERT]: 0.05
      },
      [DifficultyLevel.ADVANCED]: {
        [DifficultyLevel.BEGINNER]: 0.1,
        [DifficultyLevel.INTERMEDIATE]: 0.3,
        [DifficultyLevel.ADVANCED]: 0.45,
        [DifficultyLevel.EXPERT]: 0.15
      },
      [DifficultyLevel.EXPERT]: {
        [DifficultyLevel.BEGINNER]: 0.05,
        [DifficultyLevel.INTERMEDIATE]: 0.15,
        [DifficultyLevel.ADVANCED]: 0.4,
        [DifficultyLevel.EXPERT]: 0.4
      }
    }

    const preferences = difficultyPreferences[userLevel]
    
    // Calculate target counts for each difficulty
    const targetCounts = Object.entries(preferences).reduce((acc, [difficulty, ratio]) => {
      acc[difficulty as DifficultyLevel] = Math.round(config.totalQuestions * ratio)
      return acc
    }, {} as Record<DifficultyLevel, number>)

    // Group questions by difficulty
    const questionsByDifficulty = questions.reduce((acc, q) => {
      if (!acc[q.difficulty]) {acc[q.difficulty] = []}
      acc[q.difficulty].push(q)
      return acc
    }, {} as Record<DifficultyLevel, any[]>)

    // Select questions for each difficulty level
    Object.entries(targetCounts).forEach(([difficulty, count]) => {
      const available = questionsByDifficulty[difficulty as DifficultyLevel] || []
      const shuffled = available.sort(() => Math.random() - 0.5)
      const toSelect = Math.min(count, shuffled.length)
      selected.push(...shuffled.slice(0, toSelect))
    })

    // Fill remaining slots if needed
    const remaining = config.totalQuestions - selected.length
    if (remaining > 0) {
      const unused = questions.filter(q => !selected.some(s => s.id === q.id))
      const shuffled = unused.sort(() => Math.random() - 0.5)
      selected.push(...shuffled.slice(0, remaining))
    }

    return selected.slice(0, config.totalQuestions)
  }

  /**
   * Standard question selection based on explicit distribution
   */
  private standardQuestionSelection(
    questions: any[],
    config: QuestionSelectionConfig
  ): any[] {
    const selected: any[] = []
    
    // If specific categories are requested
    if (config.categories?.length) {
      config.categories.forEach(categoryConfig => {
        const categoryQuestions = questions.filter(q => 
          q.category === categoryConfig.categoryId || 
          q.category.toLowerCase().replace(/\s+/g, '-') === categoryConfig.categoryId
        )
        
        const shuffled = categoryQuestions.sort(() => Math.random() - 0.5)
        const toSelect = Math.min(categoryConfig.count, shuffled.length)
        selected.push(...shuffled.slice(0, toSelect))
      })
    } else {
      // Select based on difficulty distribution
      const difficultyTargets = Object.entries(config.difficultyDistribution)
        .map(([difficulty, ratio]) => ({
          difficulty: difficulty as DifficultyLevel,
          count: Math.round(config.totalQuestions * ratio)
        }))

      difficultyTargets.forEach(({ difficulty, count }) => {
        const difficultyQuestions = questions.filter(q => q.difficulty === difficulty)
        const shuffled = difficultyQuestions.sort(() => Math.random() - 0.5)
        const toSelect = Math.min(count, shuffled.length)
        selected.push(...shuffled.slice(0, toSelect))
      })

      // Fill remaining slots
      const remaining = config.totalQuestions - selected.length
      if (remaining > 0) {
        const unused = questions.filter(q => !selected.some(s => s.id === q.id))
        const shuffled = unused.sort(() => Math.random() - 0.5)
        selected.push(...shuffled.slice(0, remaining))
      }
    }

    return selected.slice(0, config.totalQuestions)
  }

  /**
   * Calculate metadata for selected questions
   */
  private calculateSelectionMetadata(questions: any[]) {
    const categoryBreakdown = questions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const difficultyBreakdown = questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
      return acc
    }, {} as Record<DifficultyLevel, number>)

    const typeBreakdown = questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1
      return acc
    }, {} as Record<QuestionType, number>)

    const estimatedTimeMinutes = questions.reduce((total, q) => {
      return total + (q.timeEstimate ? Math.ceil(q.timeEstimate / 60) : 2) // Default 2 minutes
    }, 0)

    return {
      totalQuestions: questions.length,
      categoryBreakdown,
      difficultyBreakdown,
      typeBreakdown,
      estimatedTimeMinutes
    }
  }

  /**
   * Get analytics for a specific question
   */
  async getQuestionAnalytics(questionId: string): Promise<QuestionAnalytics> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        timesUsed: true,
        timesCorrect: true,
        averageTime: true,
        questionResults: {
          select: {
            isCorrect: true,
            timeSpent: true,
            createdAt: true,
            assessmentResult: {
              select: {
                score: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1000 // Recent results for trend analysis
        }
      }
    })

    if (!question) {
      throw new Error('Question not found')
    }

    const successRate = question.timesUsed > 0 
      ? (question.timesCorrect / question.timesUsed) * 100
      : 0

    // Calculate difficulty accuracy and discrimination index
    const results = question.questionResults
    const difficultyAccuracy = this.calculateDifficultyAccuracy(question.difficulty as DifficultyLevel, successRate)
    const discriminationIndex = this.calculateDiscriminationIndex(results)

    // Generate trend data
    const trends = this.calculateTrends(results)

    // Generate recommendations
    const recommendations = this.generateQuestionRecommendations({
      successRate,
      difficultyAccuracy,
      discriminationIndex,
      timesUsed: question.timesUsed,
      currentDifficulty: question.difficulty as DifficultyLevel
    })

    return {
      questionId: question.id,
      title: question.title,
      category: question.category,
      difficulty: question.difficulty as DifficultyLevel,
      statistics: {
        timesUsed: question.timesUsed,
        timesCorrect: question.timesCorrect,
        successRate,
        averageTimeSeconds: question.averageTime || 0,
        difficultyAccuracy,
        discriminationIndex
      },
      trends: {
        recentPerformance: trends
      },
      recommendations
    }
  }

  /**
   * Calculate how accurately the question difficulty matches actual performance
   */
  private calculateDifficultyAccuracy(
    assignedDifficulty: DifficultyLevel, 
    successRate: number
  ): number {
    const expectedRanges = {
      [DifficultyLevel.BEGINNER]: { min: 70, max: 90 },
      [DifficultyLevel.INTERMEDIATE]: { min: 50, max: 75 },
      [DifficultyLevel.ADVANCED]: { min: 30, max: 60 },
      [DifficultyLevel.EXPERT]: { min: 15, max: 45 }
    }

    const range = expectedRanges[assignedDifficulty]
    if (successRate >= range.min && successRate <= range.max) {
      return 100 // Perfect accuracy
    }

    // Calculate how far off the success rate is from the expected range
    const distanceFromRange = successRate < range.min 
      ? range.min - successRate
      : successRate - range.max

    return Math.max(0, 100 - (distanceFromRange * 2))
  }

  /**
   * Calculate discrimination index (how well question differentiates skill levels)
   */
  private calculateDiscriminationIndex(results: any[]): number {
    if (results.length < 10) {return 0} // Need sufficient data

    // Sort results by overall assessment score
    const sortedResults = results
      .filter(r => r.assessmentResult?.score !== undefined)
      .sort((a, b) => b.assessmentResult.score - a.assessmentResult.score)

    if (sortedResults.length < 10) {return 0}

    // Take top 27% and bottom 27% (standard practice)
    const topCount = Math.floor(sortedResults.length * 0.27)
    const bottomCount = Math.floor(sortedResults.length * 0.27)

    const topGroup = sortedResults.slice(0, topCount)
    const bottomGroup = sortedResults.slice(-bottomCount)

    const topCorrect = topGroup.filter(r => r.isCorrect).length
    const bottomCorrect = bottomGroup.filter(r => r.isCorrect).length

    const topPercentage = topCorrect / topGroup.length
    const bottomPercentage = bottomCorrect / bottomGroup.length

    // Discrimination index = difference in performance between top and bottom groups
    return (topPercentage - bottomPercentage) * 100
  }

  /**
   * Calculate performance trends over time
   */
  private calculateTrends(results: any[]) {
    const now = new Date()
    const periods = [
      { name: '7d' as const, days: 7 },
      { name: '30d' as const, days: 30 },
      { name: '90d' as const, days: 90 }
    ]

    return periods.map(period => {
      const periodStart = new Date(now.getTime() - (period.days * 24 * 60 * 60 * 1000))
      const periodResults = results.filter(r => new Date(r.createdAt) >= periodStart)
      
      const correctCount = periodResults.filter(r => r.isCorrect).length
      const successRate = periodResults.length > 0 
        ? (correctCount / periodResults.length) * 100 
        : 0

      return {
        period: period.name,
        successRate,
        usageCount: periodResults.length
      }
    })
  }

  /**
   * Generate recommendations for question improvement
   */
  private generateQuestionRecommendations(data: {
    successRate: number
    difficultyAccuracy: number
    discriminationIndex: number
    timesUsed: number
    currentDifficulty: DifficultyLevel
  }) {
    const recommendations: {
      adjustDifficulty?: DifficultyLevel
      needsReview: boolean
      retire: boolean
      reasons: string[]
    } = {
      needsReview: false,
      retire: false,
      reasons: []
    }

    // Check if difficulty needs adjustment
    if (data.successRate > 85 && data.currentDifficulty !== DifficultyLevel.BEGINNER) {
      const levels = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT]
      const currentIndex = levels.indexOf(data.currentDifficulty)
      if (currentIndex > 0) {
        recommendations.adjustDifficulty = levels[currentIndex - 1]
        recommendations.reasons.push(`Success rate ${data.successRate.toFixed(1)}% is too high for ${data.currentDifficulty} level`)
      }
    } else if (data.successRate < 25 && data.currentDifficulty !== DifficultyLevel.EXPERT) {
      const levels = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT]
      const currentIndex = levels.indexOf(data.currentDifficulty)
      if (currentIndex < levels.length - 1) {
        recommendations.adjustDifficulty = levels[currentIndex + 1]
        recommendations.reasons.push(`Success rate ${data.successRate.toFixed(1)}% is too low for ${data.currentDifficulty} level`)
      }
    }

    // Check if question needs review
    if (data.difficultyAccuracy < 60) {
      recommendations.needsReview = true
      recommendations.reasons.push(`Difficulty accuracy is low (${data.difficultyAccuracy.toFixed(1)}%)`)
    }

    if (data.discriminationIndex < 20) {
      recommendations.needsReview = true
      recommendations.reasons.push(`Poor discrimination index (${data.discriminationIndex.toFixed(1)}%)`)
    }

    // Check if question should be retired
    if (data.successRate > 95 || data.successRate < 5) {
      if (data.timesUsed > 50) {
        recommendations.retire = true
        recommendations.reasons.push(`Extreme success rate (${data.successRate.toFixed(1)}%) with sufficient usage`)
      }
    }

    if (data.discriminationIndex < 0) {
      recommendations.retire = true
      recommendations.reasons.push('Negative discrimination - question may be misleading')
    }

    return recommendations
  }

  /**
   * Update question analytics after an assessment
   */
  async updateQuestionAnalytics(questionId: string, result: {
    isCorrect: boolean
    timeSpent?: number
  }): Promise<void> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        timesUsed: true,
        timesCorrect: true,
        averageTime: true
      }
    })

    if (!question) {return}

    const newTimesUsed = question.timesUsed + 1
    const newTimesCorrect = question.timesCorrect + (result.isCorrect ? 1 : 0)
    
    let newAverageTime = question.averageTime
    if (result.timeSpent && result.timeSpent > 0) {
      if (question.averageTime) {
        // Calculate rolling average
        newAverageTime = ((question.averageTime * question.timesUsed) + result.timeSpent) / newTimesUsed
      } else {
        newAverageTime = result.timeSpent
      }
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        timesUsed: newTimesUsed,
        timesCorrect: newTimesCorrect,
        averageTime: newAverageTime
      }
    })
  }
}

export const questionBankService = new QuestionBankService()