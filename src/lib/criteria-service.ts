/**
 * Qualification Criteria Service
 * 
 * Manages qualification criteria, assessment rules, and scoring configurations
 * for different types of qualifications and assessment scenarios.
 */

import {
  QualificationCriteria,
  QualificationCategory,
  DifficultyLevel,
  ScoringConfig,
  AssessmentRubric,
  RubricLevel
} from '@/types';

export class QualificationCriteriaService {
  
  /**
   * Get default criteria for a qualification based on its category and difficulty
   */
  getDefaultCriteria(
    qualificationId: string,
    category: QualificationCategory,
    difficulty: DifficultyLevel
  ): QualificationCriteria[] {
    
    const baseCriteria = this.getBaseCriteriaForCategory(category);
    
    return baseCriteria.map((criteria, index) => ({
      ...criteria,
      id: `${qualificationId}-criteria-${index}`,
      qualificationId,
      passingThreshold: this.adjustThresholdForDifficulty(criteria.passingThreshold, difficulty)
    }));
  }
  
  /**
   * Create custom criteria for a qualification
   */
  createCustomCriteria(
    qualificationId: string,
    criteriaConfig: Partial<QualificationCriteria>[]
  ): QualificationCriteria[] {
    
    return criteriaConfig.map((config, index) => ({
      id: config.id || `${qualificationId}-custom-${index}`,
      qualificationId,
      name: config.name || `Criteria ${index + 1}`,
      description: config.description || '',
      weight: config.weight || 1,
      passingThreshold: config.passingThreshold || 70,
      evaluationType: config.evaluationType || 'automatic',
      rubric: config.rubric,
      questions: config.questions || []
    }));
  }
  
  /**
   * Get recommended scoring configuration based on assessment type and difficulty
   */
  getRecommendedScoringConfig(
    category: QualificationCategory,
    difficulty: DifficultyLevel,
    assessmentType: 'certification' | 'practice' | 'placement' = 'certification'
  ): ScoringConfig {
    
    const baseConfig = this.getBaseScoringConfig(assessmentType);
    
    // Adjust difficulty multipliers based on qualification level
    const difficultyMultipliers = {
      [DifficultyLevel.BEGINNER]: 1.0,
      [DifficultyLevel.INTERMEDIATE]: 1.2,
      [DifficultyLevel.ADVANCED]: 1.5,
      [DifficultyLevel.EXPERT]: 2.0
    };
    
    // Adjust category weights based on qualification category
    const categoryWeights = this.getCategoryWeights(category);
    
    return {
      ...baseConfig,
      difficultyMultipliers,
      categoryWeights
    };
  }
  
  /**
   * Create assessment rubric for manual or hybrid evaluation
   */
  createAssessmentRubric(
    criteriaName: string,
    maxScore: number = 100,
    levels: number = 4
  ): AssessmentRubric {
    
    const rubricLevels: RubricLevel[] = [];
    const scorePerLevel = maxScore / levels;
    
    for (let i = 0; i < levels; i++) {
      const level = i + 1;
      const minScore = i * scorePerLevel;
      const maxScoreForLevel = (i + 1) * scorePerLevel;
      
      rubricLevels.push({
        level,
        name: this.getLevelName(level, levels),
        description: this.getLevelDescription(criteriaName, level, levels),
        minScore,
        maxScore: maxScoreForLevel,
        qualityIndicators: this.getQualityIndicators(criteriaName, level, levels)
      });
    }
    
    return {
      levels: rubricLevels,
      scoringMethod: 'points',
      maxScore
    };
  }
  
  /**
   * Validate criteria configuration
   */
  validateCriteria(criteria: QualificationCriteria[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check total weight
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      errors.push(`Total criteria weight should be 1.0, but is ${totalWeight.toFixed(2)}`);
    }
    
    // Check for duplicate names
    const names = criteria.map(c => c.name);
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push(`Duplicate criteria names found: ${duplicateNames.join(', ')}`);
    }
    
    // Check passing thresholds
    criteria.forEach((criterion, index) => {
      if (criterion.passingThreshold < 0 || criterion.passingThreshold > 100) {
        errors.push(`Criteria ${index + 1}: Passing threshold must be between 0 and 100`);
      }
      
      if (criterion.passingThreshold < 50) {
        warnings.push(`Criteria ${index + 1}: Passing threshold ${criterion.passingThreshold}% is quite low`);
      }
      
      if (criterion.weight <= 0) {
        errors.push(`Criteria ${index + 1}: Weight must be greater than 0`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // Private helper methods
  
  private getBaseCriteriaForCategory(category: QualificationCategory): Omit<QualificationCriteria, 'id' | 'qualificationId'>[] {
    const criteriaMap: Record<QualificationCategory, Omit<QualificationCriteria, 'id' | 'qualificationId'>[]> = {
      [QualificationCategory.ARTIFICIAL_INTELLIGENCE]: [
        {
          name: 'AI Fundamentals',
          description: 'Understanding of core AI concepts and principles',
          weight: 0.3,
          passingThreshold: 70,
          evaluationType: 'automatic',
          questions: []
        },
        {
          name: 'Machine Learning',
          description: 'Knowledge of ML algorithms and applications',
          weight: 0.4,
          passingThreshold: 75,
          evaluationType: 'automatic',
          questions: []
        },
        {
          name: 'Practical Application',
          description: 'Ability to apply AI concepts to real-world problems',
          weight: 0.3,
          passingThreshold: 70,
          evaluationType: 'hybrid',
          questions: []
        }
      ],
      
      [QualificationCategory.SOFTWARE_ENGINEERING]: [
        {
          name: 'Programming Fundamentals',
          description: 'Core programming concepts and best practices',
          weight: 0.35,
          passingThreshold: 75,
          evaluationType: 'automatic',
          questions: []
        },
        {
          name: 'System Design',
          description: 'Software architecture and design patterns',
          weight: 0.35,
          passingThreshold: 70,
          evaluationType: 'hybrid',
          questions: []
        },
        {
          name: 'Problem Solving',
          description: 'Algorithmic thinking and debugging skills',
          weight: 0.3,
          passingThreshold: 75,
          evaluationType: 'automatic',
          questions: []
        }
      ],
      
      // Add more categories as needed
      [QualificationCategory.DATA_SCIENCE]: [
        {
          name: 'Statistical Analysis',
          description: 'Statistical methods and data interpretation',
          weight: 0.4,
          passingThreshold: 75,
          evaluationType: 'automatic',
          questions: []
        },
        {
          name: 'Data Visualization',
          description: 'Creating meaningful data visualizations',
          weight: 0.3,
          passingThreshold: 70,
          evaluationType: 'hybrid',
          questions: []
        },
        {
          name: 'Business Impact',
          description: 'Translating data insights into business value',
          weight: 0.3,
          passingThreshold: 70,
          evaluationType: 'manual',
          questions: []
        }
      ],
      
      // Default for other categories
      [QualificationCategory.MACHINE_LEARNING]: [],
      [QualificationCategory.CLOUD_COMPUTING]: [],
      [QualificationCategory.CYBERSECURITY]: [],
      [QualificationCategory.BLOCKCHAIN]: [],
      [QualificationCategory.MOBILE_DEVELOPMENT]: [],
      [QualificationCategory.WEB_DEVELOPMENT]: [],
      [QualificationCategory.DEVOPS]: [],
      [QualificationCategory.PRODUCT_MANAGEMENT]: [],
      [QualificationCategory.UX_UI_DESIGN]: [],
      [QualificationCategory.BUSINESS_ANALYSIS]: [],
      [QualificationCategory.PROJECT_MANAGEMENT]: [],
      [QualificationCategory.DIGITAL_MARKETING]: [],
      [QualificationCategory.OTHER]: []
    };
    
    return criteriaMap[category] || [
      {
        name: 'Core Knowledge',
        description: 'Fundamental understanding of key concepts',
        weight: 0.5,
        passingThreshold: 70,
        evaluationType: 'automatic',
        questions: []
      },
      {
        name: 'Applied Skills',
        description: 'Practical application of learned concepts',
        weight: 0.5,
        passingThreshold: 70,
        evaluationType: 'hybrid',
        questions: []
      }
    ];
  }
  
  private adjustThresholdForDifficulty(baseThreshold: number, difficulty: DifficultyLevel): number {
    const adjustments = {
      [DifficultyLevel.BEGINNER]: -5,    // More lenient
      [DifficultyLevel.INTERMEDIATE]: 0,  // No change
      [DifficultyLevel.ADVANCED]: +5,    // More strict
      [DifficultyLevel.EXPERT]: +10      // Much more strict
    };
    
    return Math.min(100, Math.max(50, baseThreshold + adjustments[difficulty]));
  }
  
  private getBaseScoringConfig(assessmentType: 'certification' | 'practice' | 'placement'): ScoringConfig {
    const configs = {
      certification: {
        method: 'weighted' as const,
        penalizeIncorrect: true,
        penaltyWeight: 0.25,
        bonusForSpeed: false,
        speedBonusThreshold: 30
      },
      practice: {
        method: 'simple' as const,
        penalizeIncorrect: false,
        penaltyWeight: 0,
        bonusForSpeed: true,
        speedBonusThreshold: 45
      },
      placement: {
        method: 'adaptive' as const,
        penalizeIncorrect: true,
        penaltyWeight: 0.1,
        bonusForSpeed: false,
        speedBonusThreshold: 60
      }
    };
    
    return configs[assessmentType];
  }
  
  private getCategoryWeights(category: QualificationCategory): Record<string, number> {
    // This would be more sophisticated in a real implementation
    // For now, return equal weights
    return {};
  }
  
  private getLevelName(level: number, totalLevels: number): string {
    if (totalLevels === 4) {
      const names = ['Needs Improvement', 'Developing', 'Proficient', 'Exemplary'];
      return names[level - 1] || `Level ${level}`;
    }
    
    if (totalLevels === 5) {
      const names = ['Inadequate', 'Developing', 'Adequate', 'Proficient', 'Exemplary'];
      return names[level - 1] || `Level ${level}`;
    }
    
    return `Level ${level}`;
  }
  
  private getLevelDescription(criteriaName: string, level: number, totalLevels: number): string {
    const percentage = (level / totalLevels) * 100;
    
    if (level === 1) {
      return `Does not meet expectations for ${criteriaName}. Significant improvement needed.`;
    } else if (level === totalLevels) {
      return `Exceeds expectations for ${criteriaName}. Demonstrates mastery and innovation.`;
    } else if (level === Math.ceil(totalLevels / 2)) {
      return `Meets expectations for ${criteriaName}. Shows solid understanding.`;
    } else {
      return `Shows ${percentage.toFixed(0)}% proficiency in ${criteriaName}.`;
    }
  }
  
  private getQualityIndicators(criteriaName: string, level: number, totalLevels: number): string[] {
    // This would be more sophisticated and context-aware in a real implementation
    const baseIndicators = [
      'Demonstrates understanding of key concepts',
      'Applies knowledge appropriately',
      'Shows logical reasoning',
      'Communicates ideas clearly'
    ];
    
    if (level === totalLevels) {
      return [
        ...baseIndicators,
        'Shows innovation and creativity',
        'Makes connections across domains',
        'Demonstrates leadership in thinking'
      ];
    } else if (level === 1) {
      return [
        'Limited understanding of concepts',
        'Difficulty applying knowledge',
        'Inconsistent reasoning',
        'Unclear communication'
      ];
    }
    
    return baseIndicators;
  }
}

// Factory function
export function createCriteriaService(): QualificationCriteriaService {
  return new QualificationCriteriaService();
}

// Export singleton instance
export const qualificationCriteriaService = new QualificationCriteriaService();