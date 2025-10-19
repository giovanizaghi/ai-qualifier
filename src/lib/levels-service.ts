/**
 * Qualification Levels Service
 * 
 * Manages qualification levels/tiers, determines appropriate levels based on performance,
 * and provides level-specific requirements and progression paths.
 */

import {
  DifficultyLevel,
  QualificationCategory,
  QualificationLevel,
  QualificationRequirement,
  CriteriaEvaluation,
  AssessmentResult
} from '@/types';

export interface LevelProgressionPath {
  currentLevel: DifficultyLevel;
  nextLevel?: DifficultyLevel;
  requirementsToAdvance: QualificationRequirement[];
  estimatedTimeToAdvance: number; // hours
  recommendedActions: string[];
}

export class QualificationLevelsService {
  
  /**
   * Determine the appropriate qualification level based on assessment performance
   */
  determineLevel(
    assessmentResult: AssessmentResult,
    criteriaEvaluations: CriteriaEvaluation[],
    category: QualificationCategory
  ): QualificationLevel {
    
    const score = assessmentResult.score;
    const passedCriteria = criteriaEvaluations.filter(c => c.passed).length;
    const totalCriteria = criteriaEvaluations.length;
    const criteriaPassRate = totalCriteria > 0 ? passedCriteria / totalCriteria : 1;
    
    // Calculate weighted performance considering various factors
    const performanceMetrics = this.calculatePerformanceMetrics(
      assessmentResult, 
      criteriaEvaluations, 
      category
    );
    
    const level = this.determineLevelFromMetrics(performanceMetrics);
    
    return {
      level,
      name: this.getLevelName(level),
      description: this.getLevelDescription(level, category),
      requirements: this.generateLevelRequirements(level, performanceMetrics),
      nextLevel: this.getNextLevel(level),
      estimatedStudyTime: this.estimateStudyTime(level, performanceMetrics)
    };
  }
  
  /**
   * Get all available levels for a qualification category
   */
  getAvailableLevels(category: QualificationCategory): QualificationLevel[] {
    return Object.values(DifficultyLevel).map(level => ({
      level,
      name: this.getLevelName(level),
      description: this.getLevelDescription(level, category),
      requirements: this.getStandardRequirements(level),
      nextLevel: this.getNextLevel(level),
      estimatedStudyTime: this.getStandardStudyTime(level)
    }));
  }
  
  /**
   * Get progression path for a user's current level
   */
  getProgressionPath(
    currentLevel: DifficultyLevel,
    assessmentResult: AssessmentResult,
    criteriaEvaluations: CriteriaEvaluation[]
  ): LevelProgressionPath {
    
    const nextLevel = this.getNextLevel(currentLevel);
    const requirementsToAdvance = nextLevel ? 
      this.getAdvancementRequirements(currentLevel, nextLevel, assessmentResult, criteriaEvaluations) : 
      [];
    
    const estimatedTime = this.estimateAdvancementTime(
      currentLevel, 
      nextLevel, 
      assessmentResult.score
    );
    
    const recommendedActions = this.getRecommendedActions(
      currentLevel, 
      nextLevel, 
      criteriaEvaluations
    );
    
    return {
      currentLevel,
      nextLevel,
      requirementsToAdvance,
      estimatedTimeToAdvance: estimatedTime,
      recommendedActions
    };
  }
  
  /**
   * Check if a user meets the requirements for a specific level
   */
  meetsLevelRequirements(
    targetLevel: DifficultyLevel,
    assessmentResult: AssessmentResult,
    criteriaEvaluations: CriteriaEvaluation[]
  ): {
    meetsRequirements: boolean;
    unmetRequirements: QualificationRequirement[];
    strengthAreas: string[];
  } {
    
    const requirements = this.getStandardRequirements(targetLevel);
    const unmetRequirements: QualificationRequirement[] = [];
    const strengthAreas: string[] = [];
    
    for (const requirement of requirements) {
      const achieved = this.evaluateRequirement(requirement, assessmentResult, criteriaEvaluations);
      
      if (!achieved) {
        unmetRequirements.push({ ...requirement, achieved: false });
      } else {
        strengthAreas.push(requirement.description);
      }
    }
    
    return {
      meetsRequirements: unmetRequirements.length === 0,
      unmetRequirements,
      strengthAreas
    };
  }
  
  /**
   * Get level-specific study recommendations
   */
  getLevelStudyRecommendations(
    currentLevel: DifficultyLevel,
    targetLevel: DifficultyLevel,
    category: QualificationCategory,
    weakAreas: string[] = []
  ): {
    focusAreas: string[];
    studyMaterials: string[];
    practiceActivities: string[];
    timeAllocation: Record<string, number>; // hours per topic
  } {
    
    const levelGap = this.getLevelGap(currentLevel, targetLevel);
    const focusAreas = this.getFocusAreasForProgression(currentLevel, targetLevel, category);
    
    return {
      focusAreas,
      studyMaterials: this.getStudyMaterials(targetLevel, category, focusAreas),
      practiceActivities: this.getPracticeActivities(targetLevel, category),
      timeAllocation: this.calculateTimeAllocation(focusAreas, levelGap, weakAreas)
    };
  }
  
  // Private helper methods
  
  private calculatePerformanceMetrics(
    result: AssessmentResult,
    criteria: CriteriaEvaluation[],
    category: QualificationCategory
  ): {
    overallScore: number;
    criteriaPassRate: number;
    timeEfficiency: number;
    consistencyScore: number;
    categoryStrength: number;
  } {
    
    const overallScore = result.score;
    const criteriaPassRate = criteria.length > 0 ? 
      criteria.filter(c => c.passed).length / criteria.length : 1;
    
    // Calculate time efficiency (lower time spent relative to limit is better)
    const timeEfficiency = result.timeSpent && result.completedAt && result.startedAt ?
      Math.max(0, 1 - (result.timeSpent / (60 * 90))) : 0.5; // Assume 90 min standard
    
    // Calculate consistency (based on score distribution across categories)
    const consistencyScore = this.calculateConsistencyScore(result.categoryScores);
    
    // Category strength based on performance in category-specific areas
    const categoryStrength = this.calculateCategoryStrength(category, criteria);
    
    return {
      overallScore,
      criteriaPassRate,
      timeEfficiency,
      consistencyScore,
      categoryStrength
    };
  }
  
  private calculateConsistencyScore(categoryScores?: any): number {
    if (!categoryScores || typeof categoryScores !== 'object') {return 0.5;}
    
    const scores = Object.values(categoryScores).filter(score => typeof score === 'number') as number[];
    if (scores.length === 0) {return 0.5;}
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation means more consistency
    // Normalize to 0-1 scale where 1 is most consistent
    return Math.max(0, 1 - (standardDeviation / 50)); // 50 is arbitrary max expected SD
  }
  
  private calculateCategoryStrength(category: QualificationCategory, criteria: CriteriaEvaluation[]): number {
    // For now, simple average of criteria scores
    if (criteria.length === 0) {return 0.5;}
    
    const averageScore = criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length;
    return averageScore / 100; // Convert to 0-1 scale
  }
  
  private determineLevelFromMetrics(metrics: ReturnType<typeof this.calculatePerformanceMetrics>): DifficultyLevel {
    const {
      overallScore,
      criteriaPassRate,
      timeEfficiency,
      consistencyScore,
      categoryStrength
    } = metrics;
    
    // Weighted scoring for level determination
    const compositeScore = (
      overallScore * 0.4 +
      criteriaPassRate * 100 * 0.3 +
      consistencyScore * 100 * 0.15 +
      categoryStrength * 100 * 0.15
    );
    
    // Determine level based on composite score and thresholds
    if (compositeScore >= 90 && criteriaPassRate >= 0.9) {
      return DifficultyLevel.EXPERT;
    } else if (compositeScore >= 80 && criteriaPassRate >= 0.8) {
      return DifficultyLevel.ADVANCED;
    } else if (compositeScore >= 70 && criteriaPassRate >= 0.7) {
      return DifficultyLevel.INTERMEDIATE;
    } else {
      return DifficultyLevel.BEGINNER;
    }
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
  
  private getLevelDescription(level: DifficultyLevel, category: QualificationCategory): string {
    const baseDescriptions = {
      [DifficultyLevel.BEGINNER]: 'You have basic understanding of fundamental concepts and can handle simple tasks.',
      [DifficultyLevel.INTERMEDIATE]: 'You demonstrate solid knowledge and can apply concepts in common scenarios.',
      [DifficultyLevel.ADVANCED]: 'You have deep understanding and can handle complex problems independently.',
      [DifficultyLevel.EXPERT]: 'You have mastery-level knowledge and can tackle expert-level challenges and mentor others.'
    };
    
    // Could be customized per category in the future
    return baseDescriptions[level];
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
  
  private generateLevelRequirements(
    level: DifficultyLevel,
    metrics: ReturnType<typeof this.calculatePerformanceMetrics>
  ): QualificationRequirement[] {
    
    const baseRequirements = this.getStandardRequirements(level);
    
    // Customize based on current performance
    return baseRequirements.map(req => ({
      ...req,
      achieved: this.checkRequirementAchieved(req, metrics)
    }));
  }
  
  private getStandardRequirements(level: DifficultyLevel): QualificationRequirement[] {
    const requirementSets = {
      [DifficultyLevel.BEGINNER]: [
        {
          type: 'score' as const,
          description: 'Achieve minimum 60% overall score',
          threshold: 60,
          achieved: false
        },
        {
          type: 'criteria' as const,
          description: 'Pass at least 60% of assessment criteria',
          threshold: 0.6,
          achieved: false
        }
      ],
      
      [DifficultyLevel.INTERMEDIATE]: [
        {
          type: 'score' as const,
          description: 'Achieve minimum 70% overall score',
          threshold: 70,
          achieved: false
        },
        {
          type: 'criteria' as const,
          description: 'Pass at least 70% of assessment criteria',
          threshold: 0.7,
          achieved: false
        },
        {
          type: 'time' as const,
          description: 'Complete assessment within reasonable time',
          threshold: 0.5,
          achieved: false
        }
      ],
      
      [DifficultyLevel.ADVANCED]: [
        {
          type: 'score' as const,
          description: 'Achieve minimum 80% overall score',
          threshold: 80,
          achieved: false
        },
        {
          type: 'criteria' as const,
          description: 'Pass at least 80% of assessment criteria',
          threshold: 0.8,
          achieved: false
        },
        {
          type: 'time' as const,
          description: 'Demonstrate time efficiency',
          threshold: 0.6,
          achieved: false
        }
      ],
      
      [DifficultyLevel.EXPERT]: [
        {
          type: 'score' as const,
          description: 'Achieve minimum 90% overall score',
          threshold: 90,
          achieved: false
        },
        {
          type: 'criteria' as const,
          description: 'Pass at least 90% of assessment criteria',
          threshold: 0.9,
          achieved: false
        },
        {
          type: 'time' as const,
          description: 'Demonstrate exceptional efficiency',
          threshold: 0.8,
          achieved: false
        }
      ]
    };
    
    return requirementSets[level];
  }
  
  private checkRequirementAchieved(
    requirement: QualificationRequirement,
    metrics: ReturnType<typeof this.calculatePerformanceMetrics>
  ): boolean {
    
    switch (requirement.type) {
      case 'score':
        return metrics.overallScore >= requirement.threshold;
      case 'criteria':
        return metrics.criteriaPassRate >= requirement.threshold;
      case 'time':
        return metrics.timeEfficiency >= requirement.threshold;
      default:
        return false;
    }
  }
  
  private estimateStudyTime(
    level: DifficultyLevel,
    metrics: ReturnType<typeof this.calculatePerformanceMetrics>
  ): number {
    
    const baseTimes = {
      [DifficultyLevel.BEGINNER]: 20,
      [DifficultyLevel.INTERMEDIATE]: 40,
      [DifficultyLevel.ADVANCED]: 60,
      [DifficultyLevel.EXPERT]: 80
    };
    
    const baseTime = baseTimes[level];
    
    // Adjust based on current performance
    const performanceGap = Math.max(0, 1 - metrics.overallScore / 100);
    const additionalTime = baseTime * performanceGap * 0.5;
    
    return Math.round(baseTime + additionalTime);
  }
  
  private getStandardStudyTime(level: DifficultyLevel): number {
    const times = {
      [DifficultyLevel.BEGINNER]: 20,
      [DifficultyLevel.INTERMEDIATE]: 40,
      [DifficultyLevel.ADVANCED]: 60,
      [DifficultyLevel.EXPERT]: 80
    };
    return times[level];
  }
  
  private getAdvancementRequirements(
    currentLevel: DifficultyLevel,
    nextLevel: DifficultyLevel,
    result: AssessmentResult,
    criteria: CriteriaEvaluation[]
  ): QualificationRequirement[] {
    
    const nextLevelRequirements = this.getStandardRequirements(nextLevel);
    const currentMetrics = this.calculatePerformanceMetrics(result, criteria, QualificationCategory.OTHER);
    
    return nextLevelRequirements.map(req => ({
      ...req,
      achieved: this.checkRequirementAchieved(req, currentMetrics)
    }));
  }
  
  private evaluateRequirement(
    requirement: QualificationRequirement,
    result: AssessmentResult,
    criteria: CriteriaEvaluation[]
  ): boolean {
    
    switch (requirement.type) {
      case 'score':
        return result.score >= requirement.threshold;
      case 'criteria':
        const passRate = criteria.length > 0 ? 
          criteria.filter(c => c.passed).length / criteria.length : 0;
        return passRate >= requirement.threshold;
      case 'time':
        // This would need more sophisticated time analysis
        return true; // Placeholder
      default:
        return false;
    }
  }
  
  private estimateAdvancementTime(
    currentLevel: DifficultyLevel,
    nextLevel: DifficultyLevel | undefined,
    currentScore: number
  ): number {
    
    if (!nextLevel) {return 0;}
    
    const levelGap = this.getLevelGap(currentLevel, nextLevel);
    const baseTime = 20 * levelGap; // 20 hours per level gap
    
    // Adjust based on current performance
    const nextLevelThreshold = this.getStandardRequirements(nextLevel)[0].threshold;
    const scoreGap = Math.max(0, nextLevelThreshold - currentScore);
    const additionalTime = scoreGap * 0.5; // 0.5 hours per point needed
    
    return Math.round(baseTime + additionalTime);
  }
  
  private getLevelGap(currentLevel: DifficultyLevel, targetLevel: DifficultyLevel): number {
    const levels = [
      DifficultyLevel.BEGINNER,
      DifficultyLevel.INTERMEDIATE,
      DifficultyLevel.ADVANCED,
      DifficultyLevel.EXPERT
    ];
    
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(targetLevel);
    
    return Math.max(0, targetIndex - currentIndex);
  }
  
  private getRecommendedActions(
    currentLevel: DifficultyLevel,
    nextLevel: DifficultyLevel | undefined,
    criteria: CriteriaEvaluation[]
  ): string[] {
    
    const actions: string[] = [];
    
    // Add actions based on failed criteria
    const failedCriteria = criteria.filter(c => !c.passed);
    failedCriteria.forEach(criterion => {
      actions.push(`Focus on improving ${criterion.criteriaId} - current score: ${criterion.score.toFixed(1)}%`);
    });
    
    // Add level-specific recommendations
    if (nextLevel) {
      actions.push(`Study ${this.getLevelName(nextLevel).toLowerCase()}-level concepts`);
      actions.push('Practice with more challenging scenarios');
    }
    
    return actions;
  }
  
  private getFocusAreasForProgression(
    currentLevel: DifficultyLevel,
    targetLevel: DifficultyLevel,
    category: QualificationCategory
  ): string[] {
    
    // This would be much more sophisticated in a real implementation
    return [
      'Core concepts review',
      'Practical applications',
      'Advanced problem solving',
      'Industry best practices'
    ];
  }
  
  private getStudyMaterials(
    level: DifficultyLevel,
    category: QualificationCategory,
    focusAreas: string[]
  ): string[] {
    
    // Placeholder - would integrate with actual content management system
    return [
      'Official documentation',
      'Practice exercises',
      'Video tutorials',
      'Case studies'
    ];
  }
  
  private getPracticeActivities(level: DifficultyLevel, category: QualificationCategory): string[] {
    return [
      'Practice assessments',
      'Hands-on labs' ,
      'Project simulations',
      'Peer review exercises'
    ];
  }
  
  private calculateTimeAllocation(
    focusAreas: string[],
    levelGap: number,
    weakAreas: string[]
  ): Record<string, number> {
    
    const totalHours = 20 * levelGap;
    const allocation: Record<string, number> = {};
    
    // Distribute time among focus areas, giving more time to weak areas
    focusAreas.forEach(area => {
      const isWeak = weakAreas.includes(area);
      allocation[area] = isWeak ? totalHours * 0.3 : totalHours * 0.2;
    });
    
    return allocation;
  }
}

// Factory function
export function createLevelsService(): QualificationLevelsService {
  return new QualificationLevelsService();
}

// Export singleton
export const qualificationLevelsService = new QualificationLevelsService();