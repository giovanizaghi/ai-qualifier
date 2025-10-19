/**
 * Scoring Algorithms Implementation
 * 
 * Various scoring algorithms for different types of assessments and evaluation methods.
 * Supports simple scoring, weighted scoring, adaptive scoring, and Item Response Theory (IRT).
 */

import {
  AssessmentScore,
  DifficultyLevel,
  Question,
  QuestionResult,
  ScoringConfig
} from '@/types';

export interface ScoringAlgorithm {
  name: string;
  calculate(answers: QuestionResult[], questions: Question[], config: ScoringConfig): AssessmentScore;
  description: string;
}

/**
 * Simple scoring algorithm - basic percentage calculation
 */
export class SimpleScoringAlgorithm implements ScoringAlgorithm {
  name = 'simple';
  description = 'Basic percentage scoring with optional speed bonuses';
  
  calculate(answers: QuestionResult[], questions: Question[], config: ScoringConfig): AssessmentScore {
    const questionMap = new Map(questions.map(q => [q.id, q]));
    
    let correctAnswers = 0;
    let totalQuestions = answers.length;
    let timeBonus = 0;
    let penalties = 0;
    
    // Initialize breakdowns
    const categoryBreakdown: Record<string, number> = {};
    const difficultyBreakdown: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 0,
      [DifficultyLevel.INTERMEDIATE]: 0,
      [DifficultyLevel.ADVANCED]: 0,
      [DifficultyLevel.EXPERT]: 0
    };
    
    const categoryTotals: Record<string, number> = {};
    const difficultyTotals: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 0,
      [DifficultyLevel.INTERMEDIATE]: 0,
      [DifficultyLevel.ADVANCED]: 0,
      [DifficultyLevel.EXPERT]: 0
    };
    
    // Count totals for breakdown calculations
    questions.forEach(question => {
      categoryTotals[question.category] = (categoryTotals[question.category] || 0) + 1;
      difficultyTotals[question.difficulty]++;
    });
    
    // Process each answer
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;
      
      if (answer.isCorrect) {
        correctAnswers++;
        categoryBreakdown[question.category] = (categoryBreakdown[question.category] || 0) + 1;
        difficultyBreakdown[question.difficulty]++;
        
        // Apply speed bonus if configured
        if (config.bonusForSpeed && answer.timeSpent && question.timeEstimate) {
          if (answer.timeSpent < config.speedBonusThreshold) {
            timeBonus += 5; // 5 point bonus for fast correct answers
          }
        }
      } else if (config.penalizeIncorrect) {
        penalties += 5 * config.penaltyWeight; // 5 point penalty
      }
    }
    
    // Calculate base score
    const baseScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalScore = Math.min(100, Math.max(0, baseScore + timeBonus - penalties));
    
    // Convert breakdowns to percentages
    Object.keys(categoryBreakdown).forEach(category => {
      const total = categoryTotals[category] || 1;
      categoryBreakdown[category] = (categoryBreakdown[category] / total) * 100;
    });
    
    Object.keys(difficultyBreakdown).forEach(difficulty => {
      const diff = difficulty as DifficultyLevel;
      const total = difficultyTotals[diff] || 1;
      difficultyBreakdown[diff] = (difficultyBreakdown[diff] / total) * 100;
    });
    
    return {
      totalScore,
      rawScore: correctAnswers,
      maxPossibleScore: totalQuestions,
      categoryBreakdown,
      difficultyBreakdown,
      timeBonus,
      penalties,
      confidence: this.calculateSimpleConfidence(correctAnswers, totalQuestions)
    };
  }
  
  private calculateSimpleConfidence(correct: number, total: number): number {
    if (total === 0) return 0;
    
    const proportion = correct / total;
    // Simple confidence based on binomial proportion
    // Higher confidence with more questions and extreme proportions
    const variance = (proportion * (1 - proportion)) / total;
    const standardError = Math.sqrt(variance);
    
    // Convert to percentage, higher confidence when SE is lower
    return Math.min(100, Math.max(10, (1 - standardError * 2) * 100));
  }
}

/**
 * Weighted scoring algorithm - considers question difficulty and category weights
 */
export class WeightedScoringAlgorithm implements ScoringAlgorithm {
  name = 'weighted';
  description = 'Weighted scoring based on question difficulty and category importance';
  
  calculate(answers: QuestionResult[], questions: Question[], config: ScoringConfig): AssessmentScore {
    const questionMap = new Map(questions.map(q => [q.id, q]));
    
    let weightedScore = 0;
    let maxWeightedScore = 0;
    let timeBonus = 0;
    let penalties = 0;
    
    const categoryBreakdown: Record<string, number> = {};
    const difficultyBreakdown: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 0,
      [DifficultyLevel.INTERMEDIATE]: 0,
      [DifficultyLevel.ADVANCED]: 0,
      [DifficultyLevel.EXPERT]: 0
    };
    
    const categoryMaxScores: Record<string, number> = {};
    const difficultyMaxScores: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 0,
      [DifficultyLevel.INTERMEDIATE]: 0,
      [DifficultyLevel.ADVANCED]: 0,
      [DifficultyLevel.EXPERT]: 0
    };
    
    // Calculate max possible scores for each category and difficulty
    questions.forEach(question => {
      const difficultyMultiplier = config.difficultyMultipliers?.[question.difficulty] || 1;
      const categoryWeight = config.categoryWeights?.[question.category] || 1;
      const questionMaxScore = question.points * difficultyMultiplier * categoryWeight;
      
      categoryMaxScores[question.category] = (categoryMaxScores[question.category] || 0) + questionMaxScore;
      difficultyMaxScores[question.difficulty] += questionMaxScore;
      maxWeightedScore += questionMaxScore;
    });
    
    // Process each answer
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;
      
      const difficultyMultiplier = config.difficultyMultipliers?.[question.difficulty] || 1;
      const categoryWeight = config.categoryWeights?.[question.category] || 1;
      const questionWeight = question.points * difficultyMultiplier * categoryWeight;
      
      if (answer.isCorrect) {
        let earnedScore = questionWeight;
        
        // Apply speed bonus
        if (config.bonusForSpeed && answer.timeSpent && question.timeEstimate) {
          if (answer.timeSpent < config.speedBonusThreshold) {
            const bonus = earnedScore * 0.1; // 10% bonus
            timeBonus += bonus;
            earnedScore += bonus;
          }
        }
        
        weightedScore += earnedScore;
        categoryBreakdown[question.category] = (categoryBreakdown[question.category] || 0) + earnedScore;
        difficultyBreakdown[question.difficulty] += earnedScore;
        
      } else if (config.penalizeIncorrect) {
        const penalty = questionWeight * config.penaltyWeight;
        penalties += penalty;
        weightedScore = Math.max(0, weightedScore - penalty);
      }
    }
    
    // Calculate final percentage
    const totalScore = maxWeightedScore > 0 ? (weightedScore / maxWeightedScore) * 100 : 0;
    
    // Convert breakdowns to percentages
    Object.keys(categoryBreakdown).forEach(category => {
      const maxScore = categoryMaxScores[category] || 1;
      categoryBreakdown[category] = (categoryBreakdown[category] / maxScore) * 100;
    });
    
    Object.keys(difficultyBreakdown).forEach(difficulty => {
      const diff = difficulty as DifficultyLevel;
      const maxScore = difficultyMaxScores[diff] || 1;
      difficultyBreakdown[diff] = (difficultyBreakdown[diff] / maxScore) * 100;
    });
    
    return {
      totalScore: Math.min(100, totalScore),
      rawScore: weightedScore,
      maxPossibleScore: maxWeightedScore,
      categoryBreakdown,
      difficultyBreakdown,
      timeBonus,
      penalties,
      confidence: this.calculateWeightedConfidence(answers, questions, config)
    };
  }
  
  private calculateWeightedConfidence(
    answers: QuestionResult[], 
    questions: Question[], 
    config: ScoringConfig
  ): number {
    // More sophisticated confidence calculation considering weights
    const questionMap = new Map(questions.map(q => [q.id, q]));
    let totalWeight = 0;
    let correctWeight = 0;
    
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;
      
      const weight = question.points * (config.difficultyMultipliers?.[question.difficulty] || 1);
      totalWeight += weight;
      
      if (answer.isCorrect) {
        correctWeight += weight;
      }
    }
    
    if (totalWeight === 0) return 0;
    
    const weightedProportion = correctWeight / totalWeight;
    // Adjust confidence based on question distribution
    const questionCount = answers.length;
    const confidenceAdjustment = Math.min(1, questionCount / 20); // More confidence with more questions
    
    return Math.min(100, weightedProportion * 100 * confidenceAdjustment);
  }
}

/**
 * Adaptive scoring algorithm - adjusts difficulty and scoring based on performance
 */
export class AdaptiveScoringAlgorithm implements ScoringAlgorithm {
  name = 'adaptive';
  description = 'Adaptive scoring that adjusts based on performance patterns and question difficulty';
  
  calculate(answers: QuestionResult[], questions: Question[], config: ScoringConfig): AssessmentScore {
    const questionMap = new Map(questions.map(q => [q.id, q]));
    
    // Sort answers by time to analyze performance progression
    const sortedAnswers = [...answers].sort((a, b) => 
      (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    );
    
    let adaptiveScore = 0;
    let maxAdaptiveScore = 0;
    let timeBonus = 0;
    let penalties = 0;
    
    const categoryBreakdown: Record<string, number> = {};
    const difficultyBreakdown: Record<DifficultyLevel, number> = {
      [DifficultyLevel.BEGINNER]: 0,
      [DifficultyLevel.INTERMEDIATE]: 0,
      [DifficultyLevel.ADVANCED]: 0,
      [DifficultyLevel.EXPERT]: 0
    };
    
    // Track performance trend
    let recentPerformance = 0.5; // Start at 50% assumed performance
    const performanceWindow = 5; // Consider last 5 questions for trend
    
    // Process answers in sequence to build adaptive scoring
    for (let i = 0; i < sortedAnswers.length; i++) {
      const answer = sortedAnswers[i];
      const question = questionMap.get(answer.questionId);
      if (!question) continue;
      
      // Calculate adaptive multiplier based on recent performance
      const adaptiveMultiplier = this.calculateAdaptiveMultiplier(
        recentPerformance, 
        question.difficulty,
        i,
        sortedAnswers.length
      );
      
      const baseScore = question.points * (config.difficultyMultipliers?.[question.difficulty] || 1);
      const adaptiveQuestionScore = baseScore * adaptiveMultiplier;
      
      maxAdaptiveScore += adaptiveQuestionScore;
      
      if (answer.isCorrect) {
        let earnedScore = adaptiveQuestionScore;
        
        // Speed bonus
        if (config.bonusForSpeed && answer.timeSpent && question.timeEstimate) {
          if (answer.timeSpent < config.speedBonusThreshold) {
            const bonus = earnedScore * 0.15; // Larger bonus for adaptive
            timeBonus += bonus;
            earnedScore += bonus;
          }
        }
        
        adaptiveScore += earnedScore;
        categoryBreakdown[question.category] = (categoryBreakdown[question.category] || 0) + earnedScore;
        difficultyBreakdown[question.difficulty] += earnedScore;
        
        // Update performance trend (positive)
        recentPerformance = this.updatePerformanceTrend(recentPerformance, true, i, performanceWindow);
        
      } else {
        if (config.penalizeIncorrect) {
          const penalty = adaptiveQuestionScore * config.penaltyWeight;
          penalties += penalty;
          adaptiveScore = Math.max(0, adaptiveScore - penalty);
        }
        
        // Update performance trend (negative)
        recentPerformance = this.updatePerformanceTrend(recentPerformance, false, i, performanceWindow);
      }
    }
    
    // Calculate final score
    const totalScore = maxAdaptiveScore > 0 ? (adaptiveScore / maxAdaptiveScore) * 100 : 0;
    
    // Normalize breakdowns (simplified for adaptive)
    const totalQuestions = answers.length;
    Object.keys(categoryBreakdown).forEach(category => {
      const categoryQuestions = answers.filter(a => {
        const q = questionMap.get(a.questionId);
        return q?.category === category;
      }).length;
      if (categoryQuestions > 0) {
        categoryBreakdown[category] = (categoryBreakdown[category] / categoryQuestions) * (100 / totalQuestions);
      }
    });
    
    return {
      totalScore: Math.min(100, totalScore),
      rawScore: adaptiveScore,
      maxPossibleScore: maxAdaptiveScore,
      categoryBreakdown,
      difficultyBreakdown,
      timeBonus,
      penalties,
      confidence: this.calculateAdaptiveConfidence(recentPerformance, answers.length)
    };
  }
  
  private calculateAdaptiveMultiplier(
    recentPerformance: number,
    difficulty: DifficultyLevel,
    position: number,
    totalQuestions: number
  ): number {
    // Base multiplier starts at 1.0
    let multiplier = 1.0;
    
    // Adjust based on recent performance
    if (recentPerformance > 0.7) {
      // Performing well, increase difficulty weight
      multiplier += 0.3;
    } else if (recentPerformance < 0.3) {
      // Struggling, decrease difficulty impact
      multiplier -= 0.2;
    }
    
    // Position-based adjustment (later questions can be weighted more)
    const positionFactor = position / totalQuestions;
    multiplier += positionFactor * 0.2;
    
    // Difficulty-based adjustment
    const difficultyFactors = {
      [DifficultyLevel.BEGINNER]: 0.8,
      [DifficultyLevel.INTERMEDIATE]: 1.0,
      [DifficultyLevel.ADVANCED]: 1.3,
      [DifficultyLevel.EXPERT]: 1.6
    };
    
    multiplier *= difficultyFactors[difficulty];
    
    return Math.max(0.5, Math.min(2.5, multiplier)); // Clamp between 0.5 and 2.5
  }
  
  private updatePerformanceTrend(
    currentTrend: number,
    isCorrect: boolean,
    position: number,
    windowSize: number
  ): number {
    // Weight recent performance more heavily
    const weight = Math.min(1, windowSize / (position + 1));
    const newDataPoint = isCorrect ? 1 : 0;
    
    // Exponential moving average
    const alpha = 0.3; // Smoothing factor
    return currentTrend * (1 - alpha) + newDataPoint * alpha;
  }
  
  private calculateAdaptiveConfidence(finalPerformance: number, questionCount: number): number {
    // Confidence based on final performance trend and question count
    const baseConfidence = finalPerformance * 100;
    const countAdjustment = Math.min(1, questionCount / 15); // More confidence with more questions
    
    return Math.min(100, baseConfidence * countAdjustment);
  }
}

/**
 * Scoring Algorithm Factory
 */
export class ScoringAlgorithmFactory {
  private algorithms: Map<string, ScoringAlgorithm> = new Map();
  
  constructor() {
    this.registerAlgorithm(new SimpleScoringAlgorithm());
    this.registerAlgorithm(new WeightedScoringAlgorithm());
    this.registerAlgorithm(new AdaptiveScoringAlgorithm());
  }
  
  registerAlgorithm(algorithm: ScoringAlgorithm): void {
    this.algorithms.set(algorithm.name, algorithm);
  }
  
  getAlgorithm(name: string): ScoringAlgorithm | undefined {
    return this.algorithms.get(name);
  }
  
  getAllAlgorithms(): ScoringAlgorithm[] {
    return Array.from(this.algorithms.values());
  }
  
  calculateScore(
    method: string,
    answers: QuestionResult[],
    questions: Question[],
    config: ScoringConfig
  ): AssessmentScore {
    const algorithm = this.getAlgorithm(method);
    if (!algorithm) {
      throw new Error(`Unknown scoring algorithm: ${method}`);
    }
    
    return algorithm.calculate(answers, questions, config);
  }
}

// Export singleton factory
export const scoringAlgorithmFactory = new ScoringAlgorithmFactory();

// Convenience function
export function calculateScore(
  method: string,
  answers: QuestionResult[],
  questions: Question[],
  config: ScoringConfig
): AssessmentScore {
  return scoringAlgorithmFactory.calculateScore(method, answers, questions, config);
}