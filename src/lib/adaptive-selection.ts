/**
 * Advanced Question Selection Algorithms
 * Provides intelligent question selection based on user performance, learning patterns, and adaptive difficulty
 */

import { prisma } from "@/lib/prisma"
import { DifficultyLevel, QuestionType } from "@/types"

export interface AdaptiveSelectionConfig {
  qualificationId: string
  userId: string
  sessionId?: string
  totalQuestions: number
  targetDifficulty?: DifficultyLevel
  learningMode: 'assessment' | 'practice' | 'adaptive_learning'
  previousPerformance?: UserPerformanceHistory
  constraints?: {
    categories?: string[]
    excludeTypes?: QuestionType[]
    timeLimit?: number // total time in minutes
    focusAreas?: string[] // areas user wants to focus on
  }
}

export interface UserPerformanceHistory {
  userId: string
  qualificationId: string
  overallSuccessRate: number
  categoryPerformance: Record<string, {
    successRate: number
    questionsAttempted: number
    averageTime: number
    lastAttempted: Date
  }>
  difficultyPerformance: Record<DifficultyLevel, {
    successRate: number
    questionsAttempted: number
    averageTime: number
    trend: 'improving' | 'stable' | 'declining'
  }>
  learningVelocity: number // questions per hour
  consistencyScore: number // 0-100, how consistent their performance is
  weakAreas: string[]
  strongAreas: string[]
  recommendedLevel: DifficultyLevel
}

export interface AdaptiveQuestionSet {
  questions: AdaptiveQuestion[]
  strategy: {
    name: string
    description: string
    expectedDifficulty: DifficultyLevel
    adaptationPoints: number[] // Indices where difficulty might be adjusted
  }
  metadata: {
    estimatedSuccessRate: number
    estimatedTimeMinutes: number
    difficultyProgression: DifficultyLevel[]
    learningObjectives: string[]
  }
}

export interface AdaptiveQuestion {
  id: string
  title: string
  content: string
  type: QuestionType
  category: string
  difficulty: DifficultyLevel
  points: number
  timeEstimate?: number
  options: any
  adaptiveMetadata: {
    selectionReason: string
    expectedSuccessRate: number
    position: number
    canAdjustDifficulty: boolean
    alternativeQuestions?: string[] // IDs of questions that could replace this one
  }
}

export class AdaptiveQuestionSelector {
  /**
   * Select questions using adaptive algorithms based on user performance
   */
  async selectAdaptiveQuestions(config: AdaptiveSelectionConfig): Promise<AdaptiveQuestionSet> {
    // Get user performance history
    const performance = config.previousPerformance || 
      await this.getUserPerformanceHistory(config.userId, config.qualificationId)

    // Determine selection strategy based on learning mode and performance
    const strategy = this.determineSelectionStrategy(config, performance)

    // Get available questions
    const availableQuestions = await this.getAvailableQuestions(config)

    // Apply adaptive selection algorithm
    const selectedQuestions = await this.applyAdaptiveSelection(
      availableQuestions,
      config,
      performance,
      strategy
    )

    // Generate metadata
    const metadata = this.generateAdaptiveMetadata(selectedQuestions, performance)

    return {
      questions: selectedQuestions,
      strategy,
      metadata
    }
  }

  /**
   * Get user performance history from assessment results
   */
  private async getUserPerformanceHistory(
    userId: string, 
    qualificationId: string
  ): Promise<UserPerformanceHistory> {
    // Get recent assessment results
    const recentResults = await prisma.assessmentResult.findMany({
      where: {
        userId,
        assessment: {
          qualificationId
        },
        status: 'COMPLETED',
        completedAt: {
          not: null
        }
      },
      include: {
        questionResults: {
          include: {
            question: {
              select: {
                category: true,
                difficulty: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 10 // Last 10 assessments
    })

    if (recentResults.length === 0) {
      // New user - return default profile
      return {
        userId,
        qualificationId,
        overallSuccessRate: 0,
        categoryPerformance: {},
        difficultyPerformance: {
          [DifficultyLevel.BEGINNER]: {
            successRate: 0,
            questionsAttempted: 0,
            averageTime: 0,
            trend: 'stable'
          },
          [DifficultyLevel.INTERMEDIATE]: {
            successRate: 0,
            questionsAttempted: 0,
            averageTime: 0,
            trend: 'stable'
          },
          [DifficultyLevel.ADVANCED]: {
            successRate: 0,
            questionsAttempted: 0,
            averageTime: 0,
            trend: 'stable'
          },
          [DifficultyLevel.EXPERT]: {
            successRate: 0,
            questionsAttempted: 0,
            averageTime: 0,
            trend: 'stable'
          }
        },
        learningVelocity: 20, // Default questions per hour
        consistencyScore: 50,
        weakAreas: [],
        strongAreas: [],
        recommendedLevel: DifficultyLevel.BEGINNER
      }
    }

    // Calculate overall statistics
    const allQuestionResults = recentResults.flatMap(r => r.questionResults)
    const totalQuestions = allQuestionResults.length
    const correctAnswers = allQuestionResults.filter(qr => qr.isCorrect).length
    const overallSuccessRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Calculate category performance
    const categoryStats = new Map<string, {
      correct: number
      total: number
      totalTime: number
      lastAttempted: Date
    }>()

    allQuestionResults.forEach(qr => {
      const category = qr.question.category
      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          correct: 0,
          total: 0,
          totalTime: 0,
          lastAttempted: new Date(qr.createdAt)
        })
      }
      const stats = categoryStats.get(category)!
      stats.total++
      if (qr.isCorrect) stats.correct++
      stats.totalTime += qr.timeSpent || 0
      if (new Date(qr.createdAt) > stats.lastAttempted) {
        stats.lastAttempted = new Date(qr.createdAt)
      }
    })

    const categoryPerformance = Object.fromEntries(
      Array.from(categoryStats.entries()).map(([category, stats]) => [
        category,
        {
          successRate: (stats.correct / stats.total) * 100,
          questionsAttempted: stats.total,
          averageTime: stats.totalTime / stats.total,
          lastAttempted: stats.lastAttempted
        }
      ])
    )

    // Calculate difficulty performance
    const difficultyStats = new Map<DifficultyLevel, {
      correct: number
      total: number
      totalTime: number
      recentResults: boolean[]
    }>()

    Object.values(DifficultyLevel).forEach(diff => {
      difficultyStats.set(diff, {
        correct: 0,
        total: 0,
        totalTime: 0,
        recentResults: []
      })
    })

    allQuestionResults.forEach(qr => {
      const difficulty = qr.question.difficulty as DifficultyLevel
      const stats = difficultyStats.get(difficulty)!
      stats.total++
      if (qr.isCorrect) stats.correct++
      stats.totalTime += qr.timeSpent || 0
      stats.recentResults.push(qr.isCorrect)
    })

    const difficultyPerformance = Object.fromEntries(
      Array.from(difficultyStats.entries()).map(([difficulty, stats]) => [
        difficulty,
        {
          successRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          questionsAttempted: stats.total,
          averageTime: stats.total > 0 ? stats.totalTime / stats.total : 0,
          trend: this.calculateTrend(stats.recentResults)
        }
      ])
    ) as Record<DifficultyLevel, any>

    // Calculate learning velocity (questions per hour)
    const totalTime = recentResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
    const learningVelocity = totalTime > 0 ? (totalQuestions / (totalTime / 3600)) : 20

    // Calculate consistency score
    const scores = recentResults.map(r => r.score)
    const consistencyScore = this.calculateConsistencyScore(scores)

    // Identify weak and strong areas
    const sortedCategories = Object.entries(categoryPerformance)
      .sort((a, b) => a[1].successRate - b[1].successRate)
    
    const weakAreas = sortedCategories
      .filter(([_, perf]) => perf.successRate < 60 && perf.questionsAttempted >= 3)
      .slice(0, 3)
      .map(([category]) => category)

    const strongAreas = sortedCategories
      .filter(([_, perf]) => perf.successRate > 80 && perf.questionsAttempted >= 3)
      .slice(-3)
      .map(([category]) => category)

    // Recommend difficulty level
    const recommendedLevel = this.calculateRecommendedLevel(difficultyPerformance, overallSuccessRate)

    return {
      userId,
      qualificationId,
      overallSuccessRate,
      categoryPerformance,
      difficultyPerformance,
      learningVelocity,
      consistencyScore,
      weakAreas,
      strongAreas,
      recommendedLevel
    }
  }

  /**
   * Determine the best selection strategy based on config and performance
   */
  private determineSelectionStrategy(
    config: AdaptiveSelectionConfig,
    performance: UserPerformanceHistory
  ) {
    switch (config.learningMode) {
      case 'assessment':
        return {
          name: 'balanced_assessment',
          description: 'Balanced question selection for fair assessment',
          expectedDifficulty: performance.recommendedLevel,
          adaptationPoints: []
        }

      case 'practice':
        if (performance.weakAreas.length > 0) {
          return {
            name: 'targeted_practice',
            description: 'Focus on weak areas with gradual difficulty increase',
            expectedDifficulty: this.adjustDifficultyDown(performance.recommendedLevel),
            adaptationPoints: [Math.floor(config.totalQuestions * 0.3), Math.floor(config.totalQuestions * 0.7)]
          }
        } else {
          return {
            name: 'skill_building',
            description: 'Progressive difficulty to build skills',
            expectedDifficulty: performance.recommendedLevel,
            adaptationPoints: [Math.floor(config.totalQuestions * 0.25), Math.floor(config.totalQuestions * 0.75)]
          }
        }

      case 'adaptive_learning':
        return {
          name: 'adaptive_learning',
          description: 'Dynamic difficulty adjustment based on real-time performance',
          expectedDifficulty: performance.recommendedLevel,
          adaptationPoints: Array.from(
            { length: Math.floor(config.totalQuestions / 5) }, 
            (_, i) => (i + 1) * 5
          )
        }

      default:
        return {
          name: 'standard',
          description: 'Standard question selection',
          expectedDifficulty: performance.recommendedLevel,
          adaptationPoints: []
        }
    }
  }

  /**
   * Get available questions with filtering
   */
  private async getAvailableQuestions(config: AdaptiveSelectionConfig) {
    const where: any = {
      qualificationId: config.qualificationId,
      isActive: true
    }

    if (config.constraints?.categories) {
      where.category = { in: config.constraints.categories }
    }

    if (config.constraints?.excludeTypes) {
      where.type = { notIn: config.constraints.excludeTypes }
    }

    return prisma.question.findMany({
      where,
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
        averageTime: true
      }
    })
  }

  /**
   * Apply adaptive selection algorithm
   */
  private async applyAdaptiveSelection(
    availableQuestions: any[],
    config: AdaptiveSelectionConfig,
    performance: UserPerformanceHistory,
    strategy: any
  ): Promise<AdaptiveQuestion[]> {
    const selectedQuestions: AdaptiveQuestion[] = []
    let currentDifficulty = strategy.expectedDifficulty

    // Group questions by category and difficulty
    const questionsByCategory = new Map<string, any[]>()
    const questionsByDifficulty = new Map<DifficultyLevel, any[]>()

    availableQuestions.forEach(q => {
      // By category
      if (!questionsByCategory.has(q.category)) {
        questionsByCategory.set(q.category, [])
      }
      questionsByCategory.get(q.category)!.push(q)

      // By difficulty
      const diff = q.difficulty as DifficultyLevel
      if (!questionsByDifficulty.has(diff)) {
        questionsByDifficulty.set(diff, [])
      }
      questionsByDifficulty.get(diff)!.push(q)
    })

    // Selection based on strategy
    for (let i = 0; i < config.totalQuestions; i++) {
      let question: any

      if (config.learningMode === 'practice' && performance.weakAreas.length > 0) {
        // Focus on weak areas
        const weakCategory = performance.weakAreas[i % performance.weakAreas.length]
        const categoryQuestions = questionsByCategory.get(weakCategory) || []
        const difficultyQuestions = categoryQuestions.filter(q => q.difficulty === currentDifficulty)
        
        question = this.selectRandomWeighted(
          difficultyQuestions.length > 0 ? difficultyQuestions : categoryQuestions
        )
      } else {
        // Standard difficulty-based selection
        const difficultyQuestions = questionsByDifficulty.get(currentDifficulty) || []
        question = this.selectRandomWeighted(difficultyQuestions)
      }

      if (!question) {
        // Fallback to any available question
        const remaining = availableQuestions.filter(q => 
          !selectedQuestions.some(sq => sq.id === q.id)
        )
        question = remaining[Math.floor(Math.random() * remaining.length)]
      }

      if (question) {
        // Remove from available questions
        const index = availableQuestions.findIndex(q => q.id === question.id)
        if (index > -1) {
          availableQuestions.splice(index, 1)
        }

        // Calculate expected success rate
        const categoryPerf = performance.categoryPerformance[question.category]
        const difficultyPerf = performance.difficultyPerformance[question.difficulty as DifficultyLevel]
        
        const expectedSuccessRate = this.calculateExpectedSuccessRate(
          question,
          categoryPerf,
          difficultyPerf,
          performance.overallSuccessRate
        )

        selectedQuestions.push({
          id: question.id,
          title: question.title,
          content: question.content,
          type: question.type as QuestionType,
          category: question.category,
          difficulty: question.difficulty as DifficultyLevel,
          points: question.points,
          timeEstimate: question.timeEstimate,
          options: question.options,
          adaptiveMetadata: {
            selectionReason: this.getSelectionReason(question, performance, strategy),
            expectedSuccessRate,
            position: i + 1,
            canAdjustDifficulty: strategy.adaptationPoints.includes(i + 1),
            alternativeQuestions: [] // Could be populated with similar questions
          }
        })

        // Check if we need to adjust difficulty at adaptation points
        if (strategy.adaptationPoints.includes(i + 1) && config.learningMode === 'adaptive_learning') {
          // This would typically be done based on real-time performance
          // For now, we'll simulate some adjustment logic
          const difficultyData = performance.difficultyPerformance[currentDifficulty as DifficultyLevel]
          if (difficultyData && difficultyData.trend === 'improving') {
            currentDifficulty = this.adjustDifficultyUp(currentDifficulty)
          } else if (difficultyData && difficultyData.trend === 'declining') {
            currentDifficulty = this.adjustDifficultyDown(currentDifficulty)
          }
        }
      }
    }

    return selectedQuestions
  }

  // Helper methods
  private calculateTrend(results: boolean[]): 'improving' | 'stable' | 'declining' {
    if (results.length < 3) return 'stable'
    
    const firstHalf = results.slice(0, Math.floor(results.length / 2))
    const secondHalf = results.slice(Math.floor(results.length / 2))
    
    const firstRate = firstHalf.filter(r => r).length / firstHalf.length
    const secondRate = secondHalf.filter(r => r).length / secondHalf.length
    
    if (secondRate > firstRate + 0.1) return 'improving'
    if (firstRate > secondRate + 0.1) return 'declining'
    return 'stable'
  }

  private calculateConsistencyScore(scores: number[]): number {
    if (scores.length < 2) return 50
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const standardDeviation = Math.sqrt(variance)
    
    // Lower standard deviation = higher consistency
    return Math.max(0, Math.min(100, 100 - (standardDeviation * 2)))
  }

  private calculateRecommendedLevel(
    difficultyPerformance: Record<DifficultyLevel, any>,
    overallSuccessRate: number
  ): DifficultyLevel {
    if (overallSuccessRate < 40) return DifficultyLevel.BEGINNER
    if (overallSuccessRate < 60) return DifficultyLevel.INTERMEDIATE
    if (overallSuccessRate < 80) return DifficultyLevel.ADVANCED
    return DifficultyLevel.EXPERT
  }

  private adjustDifficultyUp(current: DifficultyLevel): DifficultyLevel {
    const levels = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT]
    const index = levels.indexOf(current)
    return index < levels.length - 1 ? levels[index + 1] : current
  }

  private adjustDifficultyDown(current: DifficultyLevel): DifficultyLevel {
    const levels = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT]
    const index = levels.indexOf(current)
    return index > 0 ? levels[index - 1] : current
  }

  private selectRandomWeighted(questions: any[]): any {
    if (questions.length === 0) return null
    
    // Weight questions based on usage (prefer less used questions)
    const weights = questions.map(q => {
      const baseWeight = 1
      const usageWeight = Math.max(0.1, 1 - (q.timesUsed / 100)) // Less used = higher weight
      return baseWeight * usageWeight
    })
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < questions.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return questions[i]
      }
    }
    
    return questions[questions.length - 1]
  }

  private calculateExpectedSuccessRate(
    question: any,
    categoryPerf: any,
    difficultyPerf: any,
    overallRate: number
  ): number {
    let rate = overallRate
    
    if (categoryPerf && categoryPerf.questionsAttempted > 0) {
      rate = (rate + categoryPerf.successRate) / 2
    }
    
    if (difficultyPerf && difficultyPerf.questionsAttempted > 0) {
      rate = (rate + difficultyPerf.successRate) / 2
    }
    
    // Adjust based on question's historical performance
    if (question.timesUsed > 0) {
      const questionRate = (question.timesCorrect / question.timesUsed) * 100
      rate = (rate + questionRate) / 2
    }
    
    return Math.max(0, Math.min(100, rate))
  }

  private getSelectionReason(question: any, performance: UserPerformanceHistory, strategy: any): string {
    if (performance.weakAreas.includes(question.category)) {
      return `Selected to strengthen weak area: ${question.category}`
    }
    
    if (strategy.name === 'adaptive_learning') {
      return 'Selected for adaptive learning progression'
    }
    
    return `Selected for ${question.difficulty.toLowerCase()} level practice`
  }

  private generateAdaptiveMetadata(questions: AdaptiveQuestion[], performance: UserPerformanceHistory) {
    const avgExpectedSuccessRate = questions.reduce((sum, q) => 
      sum + q.adaptiveMetadata.expectedSuccessRate, 0
    ) / questions.length

    const estimatedTimeMinutes = questions.reduce((sum, q) => 
      sum + (q.timeEstimate ? Math.ceil(q.timeEstimate / 60) : 2), 0
    )

    const difficultyProgression = questions.map(q => q.difficulty)
    
    const categories = [...new Set(questions.map(q => q.category))]
    const learningObjectives = categories.map(cat => 
      `Improve proficiency in ${cat}`
    )

    return {
      estimatedSuccessRate: avgExpectedSuccessRate,
      estimatedTimeMinutes,
      difficultyProgression,
      learningObjectives
    }
  }
}

export const adaptiveQuestionSelector = new AdaptiveQuestionSelector()