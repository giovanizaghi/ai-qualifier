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

interface QualificationAnalytics {
  qualificationId: string
  totalQuestions: number
  overview: {
    categoryDistribution: Record<string, number>
    difficultyDistribution: Record<DifficultyLevel, number>
    typeDistribution: Record<QuestionType, number>
    averageSuccessRate: number
    totalUsage: number
  }
  performance: {
    topPerformingQuestions: Array<{
      id: string
      title: string
      successRate: number
      usage: number
    }>
    poorPerformingQuestions: Array<{
      id: string
      title: string
      successRate: number
      usage: number
      issues: string[]
    }>
  }
  recommendations: {
    questionsNeedingReview: Array<{
      id: string
      title: string
      reason: string
      priority: 'high' | 'medium' | 'low'
    }>
    difficultyAdjustments: Array<{
      id: string
      title: string
      currentDifficulty: DifficultyLevel
      suggestedDifficulty: DifficultyLevel
      confidence: number
    }>
    gapsInCoverage: Array<{
      category: string
      difficulty: DifficultyLevel
      recommendedCount: number
      currentCount: number
    }>
  }
}

// GET /api/questions/analytics/qualification/[id] - Get comprehensive analytics for a qualification
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: qualificationId } = await params

    // Get all questions for the qualification
    const questions = await prisma.question.findMany({
      where: { 
        qualificationId,
        isActive: true 
      },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        type: true,
        timesUsed: true,
        timesCorrect: true,
        averageTime: true,
        questionResults: {
          select: {
            isCorrect: true,
            timeSpent: true,
            assessmentResult: {
              select: {
                score: true
              }
            }
          },
          take: 100 // Recent results for analysis
        }
      }
    })

    if (questions.length === 0) {
      return successResponse({
        qualificationId,
        totalQuestions: 0,
        overview: {
          categoryDistribution: {},
          difficultyDistribution: {},
          typeDistribution: {},
          averageSuccessRate: 0,
          totalUsage: 0
        },
        performance: {
          topPerformingQuestions: [],
          poorPerformingQuestions: []
        },
        recommendations: {
          questionsNeedingReview: [],
          difficultyAdjustments: [],
          gapsInCoverage: []
        }
      })
    }

    // Calculate overview statistics
    const overview = calculateOverview(questions)
    
    // Analyze question performance
    const performance = await analyzePerformance(questions)
    
    // Generate recommendations
    const recommendations = await generateRecommendations(questions, qualificationId)

    const analytics: QualificationAnalytics = {
      qualificationId,
      totalQuestions: questions.length,
      overview,
      performance,
      recommendations
    }

    return successResponse(analytics, "Qualification analytics retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

function calculateOverview(questions: any[]) {
  const categoryDistribution = questions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const difficultyDistribution = questions.reduce((acc, q) => {
    acc[q.difficulty as DifficultyLevel] = (acc[q.difficulty as DifficultyLevel] || 0) + 1
    return acc
  }, {} as Record<DifficultyLevel, number>)

  const typeDistribution = questions.reduce((acc, q) => {
    acc[q.type as QuestionType] = (acc[q.type as QuestionType] || 0) + 1
    return acc
  }, {} as Record<QuestionType, number>)

  const totalUsage = questions.reduce((sum, q) => sum + q.timesUsed, 0)
  const totalCorrect = questions.reduce((sum, q) => sum + q.timesCorrect, 0)
  const averageSuccessRate = totalUsage > 0 ? (totalCorrect / totalUsage) * 100 : 0

  return {
    categoryDistribution,
    difficultyDistribution,
    typeDistribution,
    averageSuccessRate,
    totalUsage
  }
}

async function analyzePerformance(questions: any[]) {
  const questionsWithPerformance = questions.map(q => {
    const successRate = q.timesUsed > 0 ? (q.timesCorrect / q.timesUsed) * 100 : 0
    return {
      id: q.id,
      title: q.title,
      successRate,
      usage: q.timesUsed,
      difficulty: q.difficulty,
      category: q.category,
      questionResults: q.questionResults
    }
  })

  // Top performing questions (high success rate and good usage)
  const topPerformingQuestions = questionsWithPerformance
    .filter(q => q.usage >= 10) // Minimum usage threshold
    .sort((a, b) => {
      // Score based on success rate and usage
      const scoreA = a.successRate * 0.7 + Math.min(a.usage / 100, 1) * 30
      const scoreB = b.successRate * 0.7 + Math.min(b.usage / 100, 1) * 30
      return scoreB - scoreA
    })
    .slice(0, 10)
    .map(q => ({
      id: q.id,
      title: q.title,
      successRate: q.successRate,
      usage: q.usage
    }))

  // Poor performing questions
  const poorPerformingQuestions = await Promise.all(
    questionsWithPerformance
      .filter(q => q.usage >= 5) // Minimum usage for reliable data
      .map(async q => {
        const issues: string[] = []
        
        // Very high success rate (too easy)
        if (q.successRate > 90) {
          issues.push("Success rate too high - question may be too easy")
        }
        
        // Very low success rate (too hard or unclear)
        if (q.successRate < 20) {
          issues.push("Success rate too low - question may be too difficult or unclear")
        }
        
        // Difficulty mismatch analysis
        const expectedRanges = {
          BEGINNER: { min: 70, max: 90 },
          INTERMEDIATE: { min: 50, max: 75 },
          ADVANCED: { min: 30, max: 60 },
          EXPERT: { min: 15, max: 45 }
        }
        
        const expectedRange = expectedRanges[q.difficulty as DifficultyLevel]
        if (expectedRange) {
          if (q.successRate < expectedRange.min || q.successRate > expectedRange.max) {
            issues.push(`Success rate doesn't match ${q.difficulty} difficulty level`)
          }
        }
        
        // Discrimination analysis
        if (q.questionResults.length >= 10) {
          const sortedResults = q.questionResults
            .filter((r: any) => r.assessmentResult?.score !== undefined)
            .sort((a: any, b: any) => b.assessmentResult.score - a.assessmentResult.score)
          
          if (sortedResults.length >= 10) {
            const topCount = Math.floor(sortedResults.length * 0.27)
            const bottomCount = Math.floor(sortedResults.length * 0.27)
            
            const topGroup = sortedResults.slice(0, topCount)
            const bottomGroup = sortedResults.slice(-bottomCount)
            
            const topCorrect = topGroup.filter((r: any) => r.isCorrect).length / topGroup.length
            const bottomCorrect = bottomGroup.filter((r: any) => r.isCorrect).length / bottomGroup.length
            
            const discriminationIndex = (topCorrect - bottomCorrect) * 100
            
            if (discriminationIndex < 20) {
              issues.push("Poor discrimination - doesn't differentiate between high and low performers")
            }
            
            if (discriminationIndex < 0) {
              issues.push("Negative discrimination - low performers do better than high performers")
            }
          }
        }
        
        return {
          id: q.id,
          title: q.title,
          successRate: q.successRate,
          usage: q.usage,
          issues
        }
      })
  )

  const filteredPoorPerforming = poorPerformingQuestions
    .filter(q => q.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 15)

  return {
    topPerformingQuestions,
    poorPerformingQuestions: filteredPoorPerforming
  }
}

async function generateRecommendations(questions: any[], qualificationId: string) {
  const questionsNeedingReview: Array<{
    id: string
    title: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }> = []

  const difficultyAdjustments: Array<{
    id: string
    title: string
    currentDifficulty: DifficultyLevel
    suggestedDifficulty: DifficultyLevel
    confidence: number
  }> = []

  // Analyze each question for issues
  for (const question of questions) {
    if (question.timesUsed < 5) continue // Need sufficient data

    const analytics = await questionBankService.getQuestionAnalytics(question.id)
    
    // Check if question needs review
    if (analytics.recommendations.needsReview) {
      questionsNeedingReview.push({
        id: question.id,
        title: question.title,
        reason: analytics.recommendations.reasons.join('; '),
        priority: analytics.recommendations.retire ? 'high' : analytics.statistics.discriminationIndex < 0 ? 'high' : 'medium'
      })
    }
    
    // Check for difficulty adjustments
    if (analytics.recommendations.adjustDifficulty) {
      difficultyAdjustments.push({
        id: question.id,
        title: question.title,
        currentDifficulty: analytics.difficulty,
        suggestedDifficulty: analytics.recommendations.adjustDifficulty,
        confidence: analytics.statistics.difficultyAccuracy
      })
    }
  }

  // Analyze coverage gaps
  const gapsInCoverage = analyzeCoverageGaps(questions)

  return {
    questionsNeedingReview: questionsNeedingReview.slice(0, 20), // Limit to top 20
    difficultyAdjustments: difficultyAdjustments.slice(0, 15), // Limit to top 15
    gapsInCoverage
  }
}

function analyzeCoverageGaps(questions: any[]) {
  const gaps: Array<{
    category: string
    difficulty: DifficultyLevel
    recommendedCount: number
    currentCount: number
  }> = []

  // Get current distribution
  const distribution = questions.reduce((acc, q) => {
    const key = `${q.category}:${q.difficulty}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Define recommended distribution (this could be configurable)
  const categories = [...new Set(questions.map(q => q.category))]
  const difficulties = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.EXPERT]
  
  const totalQuestions = questions.length
  const questionsPerCategory = Math.max(10, Math.floor(totalQuestions / categories.length))
  
  // Recommended difficulty distribution within each category
  const difficultyRatios = {
    [DifficultyLevel.BEGINNER]: 0.3,
    [DifficultyLevel.INTERMEDIATE]: 0.4,
    [DifficultyLevel.ADVANCED]: 0.25,
    [DifficultyLevel.EXPERT]: 0.05
  }

  categories.forEach(category => {
    difficulties.forEach(difficulty => {
      const key = `${category}:${difficulty}`
      const currentCount = distribution[key] || 0
      const recommendedCount = Math.ceil(questionsPerCategory * difficultyRatios[difficulty])
      
      if (currentCount < recommendedCount * 0.7) { // If we have less than 70% of recommended
        gaps.push({
          category,
          difficulty,
          recommendedCount,
          currentCount
        })
      }
    })
  })

  return gaps.sort((a, b) => (b.recommendedCount - b.currentCount) - (a.recommendedCount - a.currentCount))
}