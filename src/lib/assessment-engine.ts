/**
 * AI Qualifier Assessment Engine
 * 
 * Core engine for evaluating assessments, calculating scores,
 * and determining qualification levels based on configurable criteria.
 */

import {
  Assessment,
  AssessmentEngine,
  AssessmentResult,
  AssessmentScore,
  CriteriaEvaluation,
  DifficultyLevel,
  Qualification,
  Question,
  QualificationCriteria,
  QualificationLevel,
  QualificationProgress,
  QuestionResult,
  Recommendation,
  ScoringConfig
} from '@/types';

import { scoringAlgorithmFactory } from './scoring-algorithms';

export class QualificationAssessmentEngine implements AssessmentEngine {
  
  /**
   * Calculate the overall score for an assessment based on answers and configuration
   */
  calculateScore(
    answers: QuestionResult[], 
    questions: Question[], 
    config: ScoringConfig
  ): AssessmentScore {
    
    // Use the appropriate scoring algorithm based on the config
    return scoringAlgorithmFactory.calculateScore(config.method, answers, questions, config);
  }
  
  /**
   * Evaluate how well the assessment result meets each qualification criteria
   */
  evaluateCriteria(
    result: AssessmentResult, 
    criteria: QualificationCriteria[]
  ): CriteriaEvaluation[] {
    
    return criteria.map(criterion => {
      // For now, we'll use a simple evaluation based on category scores
      // In a real implementation, this would be more sophisticated
      const categoryScore = result.categoryScores?.[criterion.name] || result.score;
      const score = Math.min(100, categoryScore * criterion.weight);
      const passed = score >= criterion.passingThreshold;
      
      // Generate feedback based on performance
      const feedback = this.generateCriteriaFeedback(score, criterion.passingThreshold, criterion.name);
      const { improvementAreas, strengths } = this.analyzeCriteriaPerformance(score, criterion);
      
      return {
        criteriaId: criterion.id,
        score,
        passed,
        feedback,
        improvementAreas,
        strengths
      };
    });
  }
  
  /**
   * Determine the appropriate qualification level based on assessment performance
   */
  determineQualificationLevel(
    score: number, 
    criteria: CriteriaEvaluation[]
  ): QualificationLevel {
    
    const passedCriteria = criteria.filter(c => c.passed).length;
    const totalCriteria = criteria.length;
    const criteriaPassRate = totalCriteria > 0 ? passedCriteria / totalCriteria : 1;
    
    // Determine level based on score and criteria fulfillment
    let level: DifficultyLevel;
    let estimatedStudyTime: number;
    
    if (score >= 90 && criteriaPassRate >= 0.9) {
      level = DifficultyLevel.EXPERT;
      estimatedStudyTime = 0; // Already at highest level
    } else if (score >= 80 && criteriaPassRate >= 0.8) {
      level = DifficultyLevel.ADVANCED;
      estimatedStudyTime = 10; // Hours to reach expert
    } else if (score >= 70 && criteriaPassRate >= 0.7) {
      level = DifficultyLevel.INTERMEDIATE;
      estimatedStudyTime = 25; // Hours to reach advanced
    } else {
      level = DifficultyLevel.BEGINNER;
      estimatedStudyTime = 40; // Hours to reach intermediate
    }
    
    const nextLevel = this.getNextLevel(level);
    
    return {
      level,
      name: this.getLevelName(level),
      description: this.getLevelDescription(level),
      requirements: this.generateRequirements(score, criteria, level),
      nextLevel,
      estimatedStudyTime
    };
  }
  
  /**
   * Generate personalized recommendations based on assessment results
   */
  generateRecommendations(
    result: AssessmentResult, 
    userProgress: QualificationProgress,
    assessment?: Assessment,
    qualification?: Qualification
  ): Recommendation[] {
    
    const recommendations: Recommendation[] = [];
    const score = result.score;
    
    // Study recommendations based on weak areas
    if (result.categoryScores) {
      Object.entries(result.categoryScores).forEach(([category, categoryScore]) => {
        const score = typeof categoryScore === 'number' ? categoryScore : 0;
        if (score < 70) {
          recommendations.push({
            type: 'study',
            title: `Improve ${category} Knowledge`,
            description: `Your score in ${category} was ${score.toFixed(1)}%. Focus on strengthening this area.`,
            priority: score < 50 ? 'high' : 'medium',
            estimatedTime: Math.max(30, (70 - score) * 2), // minutes
            resources: this.generateCategoryResources(category),
            category
          });
        }
      });
    }
    
    // Practice recommendations
    if (score >= 60 && score < 80) {
      recommendations.push({
        type: 'practice',
        title: 'Take Practice Tests',
        description: 'Your understanding is good, but practice will help you reach the passing threshold.',
        priority: 'high',
        estimatedTime: 45,
        resources: this.generatePracticeResources()
      });
    }
    
    // Retake recommendations
    const passingScore = qualification?.passingScore || 70;
    const allowRetakes = qualification?.allowRetakes ?? true;
    if (score < passingScore && allowRetakes) {
      recommendations.push({
        type: 'retake',
        title: 'Retake Assessment',
        description: 'After studying the recommended areas, consider retaking the assessment.',
        priority: 'medium',
        estimatedTime: assessment?.timeLimit || 60,
        resources: []
      });
    }
    
    // Advancement recommendations
    if (score >= 85 && userProgress.bestScore && userProgress.bestScore >= 85) {
      recommendations.push({
        type: 'advance',
        title: 'Try Advanced Level',
        description: 'You\'ve mastered this level. Consider advancing to more challenging qualifications.',
        priority: 'medium',
        estimatedTime: 0,
        resources: this.generateAdvancementResources()
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  // Private helper methods
  
  private generateCriteriaFeedback(score: number, threshold: number, criteriaName: string): string {
    if (score >= threshold) {
      return `Excellent work on ${criteriaName}! You've met the requirements with a score of ${score.toFixed(1)}%.`;
    } else {
      const gap = threshold - score;
      return `You need to improve your ${criteriaName} knowledge. You scored ${score.toFixed(1)}% but need ${threshold}%. Focus on closing this ${gap.toFixed(1)}% gap.`;
    }
  }
  
  private analyzeCriteriaPerformance(score: number, criterion: QualificationCriteria): {
    improvementAreas: string[];
    strengths: string[];
  } {
    const improvementAreas: string[] = [];
    const strengths: string[] = [];
    
    if (score < criterion.passingThreshold) {
      improvementAreas.push(`Core ${criterion.name} concepts`);
      improvementAreas.push(`Applied ${criterion.name} skills`);
    } else {
      strengths.push(`Strong ${criterion.name} foundation`);
      if (score >= 80) {
        strengths.push(`Advanced ${criterion.name} understanding`);
      }
    }
    
    return { improvementAreas, strengths };
  }
  
  private getNextLevel(currentLevel: DifficultyLevel): DifficultyLevel | undefined {
    const levels = [
      DifficultyLevel.BEGINNER,
      DifficultyLevel.INTERMEDIATE,
      DifficultyLevel.ADVANCED,
      DifficultyLevel.EXPERT
    ];
    
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : undefined;
  }
  
  private getLevelName(level: DifficultyLevel): string {
    const names = {
      [DifficultyLevel.BEGINNER]: 'Beginner',
      [DifficultyLevel.INTERMEDIATE]: 'Intermediate',
      [DifficultyLevel.ADVANCED]: 'Advanced',
      [DifficultyLevel.EXPERT]: 'Expert'
    };
    return names[level];
  }
  
  private getLevelDescription(level: DifficultyLevel): string {
    const descriptions = {
      [DifficultyLevel.BEGINNER]: 'You have basic understanding of fundamental concepts.',
      [DifficultyLevel.INTERMEDIATE]: 'You demonstrate solid knowledge and can apply concepts in common scenarios.',
      [DifficultyLevel.ADVANCED]: 'You have deep understanding and can handle complex problems.',
      [DifficultyLevel.EXPERT]: 'You have mastery-level knowledge and can tackle expert-level challenges.'
    };
    return descriptions[level];
  }
  
  private generateRequirements(
    score: number, 
    criteria: CriteriaEvaluation[], 
    level: DifficultyLevel
  ): any[] {
    // This would generate specific requirements based on the level
    // For now, returning a simple structure
    return [
      {
        type: 'score',
        description: 'Achieve minimum score threshold',
        threshold: level === DifficultyLevel.EXPERT ? 90 : level === DifficultyLevel.ADVANCED ? 80 : 70,
        achieved: score >= (level === DifficultyLevel.EXPERT ? 90 : level === DifficultyLevel.ADVANCED ? 80 : 70)
      }
    ];
  }
  
  private generateCategoryResources(category: string): any[] {
    // In a real implementation, this would return relevant resources for the category
    return [
      {
        type: 'article',
        title: `${category} Fundamentals`,
        url: '#',
        description: `Comprehensive guide to ${category} concepts`,
        estimatedTime: 30,
        difficulty: DifficultyLevel.BEGINNER
      }
    ];
  }
  
  private generatePracticeResources(): any[] {
    return [
      {
        type: 'practice',
        title: 'Practice Questions',
        url: '#',
        description: 'Additional practice questions to reinforce learning',
        estimatedTime: 45,
        difficulty: DifficultyLevel.INTERMEDIATE
      }
    ];
  }
  
  private generateAdvancementResources(): any[] {
    return [
      {
        type: 'course',
        title: 'Advanced Certification Track',
        url: '#',
        description: 'Take your skills to the next level',
        estimatedTime: 120,
        difficulty: DifficultyLevel.ADVANCED
      }
    ];
  }
}

// Factory function to create assessment engine instance
export function createAssessmentEngine(): AssessmentEngine {
  return new QualificationAssessmentEngine();
}

// Default scoring configurations
export const DEFAULT_SCORING_CONFIGS: Record<string, ScoringConfig> = {
  standard: {
    method: 'simple',
    penalizeIncorrect: false,
    penaltyWeight: 0,
    bonusForSpeed: false,
    speedBonusThreshold: 30
  },
  
  strict: {
    method: 'weighted',
    penalizeIncorrect: true,
    penaltyWeight: 0.25,
    bonusForSpeed: false,
    speedBonusThreshold: 30,
    difficultyMultipliers: {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 1.2,
      [DifficultyLevel.ADVANCED]: 1.5,
      [DifficultyLevel.EXPERT]: 2
    }
  },
  
  adaptive: {
    method: 'adaptive',
    penalizeIncorrect: true,
    penaltyWeight: 0.1,
    bonusForSpeed: true,
    speedBonusThreshold: 45,
    difficultyMultipliers: {
      [DifficultyLevel.BEGINNER]: 0.8,
      [DifficultyLevel.INTERMEDIATE]: 1,
      [DifficultyLevel.ADVANCED]: 1.3,
      [DifficultyLevel.EXPERT]: 1.7
    }
  }
};