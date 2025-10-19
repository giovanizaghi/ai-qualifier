/**
 * AI Qualifier Assessment Engine - Main Export
 * 
 * This module provides a comprehensive assessment engine for AI qualifications
 * including scoring algorithms, criteria evaluation, level determination,
 * progress tracking, and AI-powered recommendations.
 */

// Core Assessment Engine
export { 
  QualificationAssessmentEngine, 
  createAssessmentEngine,
  DEFAULT_SCORING_CONFIGS 
} from '../assessment-engine';

// Scoring Algorithms
export {
  SimpleScoringAlgorithm,
  WeightedScoringAlgorithm,
  AdaptiveScoringAlgorithm,
  ScoringAlgorithmFactory,
  scoringAlgorithmFactory,
  calculateScore
} from '../scoring-algorithms';

// Qualification Criteria Management
export {
  QualificationCriteriaService,
  createCriteriaService,
  qualificationCriteriaService
} from '../criteria-service';

// Qualification Levels & Tiers
export {
  QualificationLevelsService,
  createLevelsService,
  qualificationLevelsService
} from '../levels-service';

// Progress Tracking
export {
  ProgressTrackingService,
  createProgressTrackingService,
  progressTrackingService
} from '../progress-tracking';

// AI-Powered Recommendations
export {
  AIRecommendationEngine,
  createRecommendationEngine,
  aiRecommendationEngine
} from '../recommendation-engine';

// Re-export important types
export type {
  AssessmentEngine,
  AssessmentScore,
  ScoringConfig,
  QualificationCriteria,
  QualificationLevel,
  CriteriaEvaluation,
  Recommendation,
  RecommendationResource
} from '../../types';

export type {
  ProgressAnalytics,
  ProgressMilestone,
  StudySession,
  LearningPath,
  PersonalizationFactors
} from '../progress-tracking';

export type {
  RecommendationContext,
  RecommendationEngine
} from '../recommendation-engine';

/**
 * Factory function to create a complete assessment system
 * with all components configured and ready to use
 */
export function createAssessmentSystem() {
  // Import factory functions locally to avoid circular dependencies
  const assessmentEngine = new (require('../assessment-engine').QualificationAssessmentEngine)();
  const criteriaService = new (require('../criteria-service').QualificationCriteriaService)();
  const levelsService = new (require('../levels-service').QualificationLevelsService)();
  const progressService = new (require('../progress-tracking').ProgressTrackingService)();
  const recommendationEngine = new (require('../recommendation-engine').AIRecommendationEngine)();
  
  return {
    assessmentEngine,
    criteriaService,
    levelsService,
    progressService,
    recommendationEngine,
    
    // Convenience method to run a complete assessment evaluation
    async evaluateAssessment(context: {
      userId: string;
      qualificationId: string;
      assessmentId: string;
      answers: any[];
      questions: any[];
      config?: any;
    }) {
      // This would orchestrate the full assessment evaluation process
      // 1. Calculate scores using assessment engine
      // 2. Evaluate criteria
      // 3. Determine qualification level
      // 4. Update progress tracking
      // 5. Generate recommendations
      
      // Implementation would go here...
      throw new Error('Not implemented - this would orchestrate the full assessment process');
    }
  };
}

// Export singleton assessment system
export const assessmentSystem = createAssessmentSystem();