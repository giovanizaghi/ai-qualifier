/**
 * AI-Powered Recommendation Engine
 * 
 * Provides personalized recommendations for learning paths, study materials,
 * practice exercises, and next qualification steps based on user performance,
 * preferences, and learning patterns.
 */

import {
  AssessmentResult,
  QualificationProgress,
  Recommendation,
  RecommendationResource,
  DifficultyLevel,
  QualificationCategory,
  Qualification,
  User
} from '@/types';

import { ProgressAnalytics, PersonalizationFactors, LearningPath } from './progress-tracking';

export interface RecommendationContext {
  user: User;
  qualification: Qualification;
  assessmentResult: AssessmentResult;
  userProgress: QualificationProgress;
  progressAnalytics: ProgressAnalytics;
  personalizationFactors?: PersonalizationFactors;
  learningPath?: LearningPath;
}

export interface RecommendationEngine {
  generateRecommendations(context: RecommendationContext): Promise<Recommendation[]>;
  getStudyRecommendations(context: RecommendationContext): Promise<Recommendation[]>;
  getPracticeRecommendations(context: RecommendationContext): Promise<Recommendation[]>;
  getAdvancementRecommendations(context: RecommendationContext): Promise<Recommendation[]>;
  getPersonalizedResources(
    topics: string[],
    difficulty: DifficultyLevel,
    preferences: PersonalizationFactors
  ): Promise<RecommendationResource[]>;
}

export class AIRecommendationEngine implements RecommendationEngine {
  
  /**
   * Generate comprehensive set of recommendations based on assessment results and user context
   */
  async generateRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    
    const recommendations: Recommendation[] = [];
    
    // Get different types of recommendations
    const studyRecs = await this.getStudyRecommendations(context);
    const practiceRecs = await this.getPracticeRecommendations(context);
    const advancementRecs = await this.getAdvancementRecommendations(context);
    const retakeRecs = await this.getRetakeRecommendations(context);
    
    // Combine and prioritize recommendations
    recommendations.push(...studyRecs, ...practiceRecs, ...advancementRecs, ...retakeRecs);
    
    // Apply AI-powered personalization and ranking
    const personalizedRecs = await this.personalizeRecommendations(recommendations, context);
    const rankedRecs = this.rankRecommendations(personalizedRecs, context);
    
    // Limit to top recommendations to avoid overwhelming the user
    return rankedRecs.slice(0, 8);
  }
  
  /**
   * Generate study-focused recommendations based on weak areas and learning goals
   */
  async getStudyRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    
    const { assessmentResult, progressAnalytics, qualification, personalizationFactors } = context;
    const recommendations: Recommendation[] = [];
    
    // Recommendations based on weak areas
    for (const weakArea of progressAnalytics.weakAreas) {
      const categoryScore = this.getCategoryScore(assessmentResult, weakArea);
      const urgency = categoryScore < 50 ? 'high' : categoryScore < 70 ? 'medium' : 'low';
      
      const studyTime = this.calculateStudyTime(70 - categoryScore, personalizationFactors);
      const resources = await this.getPersonalizedResources(
        [weakArea],
        this.determineDifficultyForWeakArea(categoryScore),
        personalizationFactors || this.getDefaultPersonalizationFactors()
      );
      
      recommendations.push({
        type: 'study',
        title: `Master ${this.formatCategoryName(weakArea)}`,
        description: `Focus on ${weakArea} concepts where you scored ${categoryScore.toFixed(1)}%. Strengthen your foundation in this area.`,
        priority: urgency,
        estimatedTime: studyTime,
        resources,
        category: weakArea,
        qualificationId: qualification.id
      });
    }
    
    // Foundational recommendations for low overall scores
    if (assessmentResult.score < 60) {
      recommendations.push({
        type: 'study',
        title: 'Build Strong Foundations',
        description: 'Start with fundamental concepts and gradually progress to more advanced topics.',
        priority: 'high',
        estimatedTime: this.calculateFoundationalStudyTime(assessmentResult.score, personalizationFactors),
        resources: await this.getFoundationalResources(qualification.category, personalizationFactors),
        qualificationId: qualification.id
      });
    }
    
    // Prerequisites recommendations
    if (qualification.prerequisites.length > 0) {
      const missingPrereqs = await this.identifyMissingPrerequisites(context);
      for (const prereq of missingPrereqs) {
        recommendations.push({
          type: 'study',
          title: `Complete Prerequisite: ${prereq.title}`,
          description: `This prerequisite knowledge will help you better understand the current qualification.`,
          priority: 'medium',
          estimatedTime: 120, // 2 hours estimated
          resources: await this.getPrerequisiteResources(prereq),
          qualificationId: prereq.id
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Generate practice-focused recommendations for skill reinforcement
   */
  async getPracticeRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    
    const { assessmentResult, progressAnalytics, qualification, userProgress } = context;
    const recommendations: Recommendation[] = [];
    
    // Practice for areas with moderate performance (60-80%)
    const moderateAreas = this.identifyModeratePerformanceAreas(assessmentResult);
    
    for (const area of moderateAreas) {
      const score = this.getCategoryScore(assessmentResult, area);
      recommendations.push({
        type: 'practice',
        title: `Practice ${this.formatCategoryName(area)} Problems`,
        description: `You're doing well in ${area} (${score.toFixed(1)}%). Practice exercises will help you reach mastery.`,
        priority: 'medium',
        estimatedTime: 45,
        resources: await this.getPracticeResources(area, qualification.difficulty),
        category: area,
        qualificationId: qualification.id
      });
    }
    
    // Comprehensive practice tests
    if (assessmentResult.score >= 60 && assessmentResult.score < 85) {
      recommendations.push({
        type: 'practice',
        title: 'Take Full Practice Assessments',
        description: 'Practice with comprehensive tests similar to the actual assessment to build confidence and identify remaining gaps.',
        priority: 'high',
        estimatedTime: qualification.estimatedDuration || 60,
        resources: await this.getComprehensivePracticeResources(qualification),
        qualificationId: qualification.id
      });
    }
    
    // Adaptive practice based on question difficulty performance
    const difficultyWeaknesses = this.identifyDifficultyWeaknesses(assessmentResult);
    for (const difficulty of difficultyWeaknesses) {
      recommendations.push({
        type: 'practice',
        title: `${difficulty} Level Practice`,
        description: `Focus on ${difficulty.toLowerCase()}-level questions to build confidence at this difficulty.`,
        priority: 'medium',
        estimatedTime: 30,
        resources: await this.getDifficultyBasedPracticeResources(difficulty, qualification.category),
        qualificationId: qualification.id
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate advancement and next-steps recommendations
   */
  async getAdvancementRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    
    const { assessmentResult, qualification, userProgress, progressAnalytics } = context;
    const recommendations: Recommendation[] = [];
    
    // Qualification completion recommendations
    if (assessmentResult.passed && assessmentResult.score >= 85) {
      
      // Next level qualification
      const nextLevelQualifications = await this.findNextLevelQualifications(qualification);
      for (const nextQual of nextLevelQualifications.slice(0, 2)) { // Limit to 2
        recommendations.push({
          type: 'advance',
          title: `Advance to ${nextQual.title}`,
          description: `You've mastered ${qualification.title}. Take your skills to the next level with ${nextQual.title}.`,
          priority: 'medium',
          estimatedTime: nextQual.estimatedDuration,
          resources: await this.getAdvancementResources(nextQual),
          qualificationId: nextQual.id
        });
      }
      
      // Related qualifications in same category
      const relatedQualifications = await this.findRelatedQualifications(qualification);
      for (const relatedQual of relatedQualifications.slice(0, 1)) {
        recommendations.push({
          type: 'advance',
          title: `Explore ${relatedQual.title}`,
          description: `Expand your expertise in ${qualification.category} by exploring ${relatedQual.title}.`,
          priority: 'low',
          estimatedTime: relatedQual.estimatedDuration,
          resources: await this.getAdvancementResources(relatedQual),
          qualificationId: relatedQual.id
        });
      }
      
      // Specialization recommendations
      const specializations = await this.findSpecializations(qualification);
      for (const spec of specializations.slice(0, 1)) {
        recommendations.push({
          type: 'advance',
          title: `Specialize in ${spec.title}`,
          description: `Deep dive into ${spec.title} to become a specialist in this area.`,
          priority: 'low',
          estimatedTime: spec.estimatedDuration,
          resources: await this.getAdvancementResources(spec),
          qualificationId: spec.id
        });
      }
    }
    
    // Career path recommendations
    if (assessmentResult.score >= 75) {
      recommendations.push({
        type: 'advance',
        title: 'Explore Career Opportunities',
        description: 'Your strong performance opens up new career opportunities. Explore roles that match your skills.',
        priority: 'low',
        estimatedTime: 60,
        resources: await this.getCareerResources(qualification.category),
        qualificationId: qualification.id
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate retake recommendations when assessment wasn't passed
   */
  async getRetakeRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    
    const { assessmentResult, qualification, userProgress } = context;
    const recommendations: Recommendation[] = [];
    
    // Only suggest retake if assessment wasn't passed and retakes are allowed
    if (!assessmentResult.passed && qualification.allowRetakes) {
      
      const timeSinceLastAttempt = userProgress.lastAttemptAt ? 
        Date.now() - userProgress.lastAttemptAt.getTime() : 0;
      const cooldownHours = qualification.retakeCooldown || 24;
      const canRetakeNow = timeSinceLastAttempt >= (cooldownHours * 60 * 60 * 1000);
      
      if (canRetakeNow) {
        const studyTimeNeeded = this.calculateRetakeStudyTime(assessmentResult.score, qualification.passingScore);
        
        recommendations.push({
          type: 'retake',
          title: 'Retake Assessment',
          description: `After addressing your weak areas, retake the assessment. You need ${(qualification.passingScore - assessmentResult.score).toFixed(1)} more points to pass.`,
          priority: assessmentResult.score >= qualification.passingScore - 10 ? 'high' : 'medium',
          estimatedTime: qualification.estimatedDuration,
          resources: await this.getRetakePreparationResources(qualification, assessmentResult),
          qualificationId: qualification.id
        });
      } else {
        const remainingCooldown = Math.ceil((cooldownHours * 60 * 60 * 1000 - timeSinceLastAttempt) / (60 * 60 * 1000));
        recommendations.push({
          type: 'study',
          title: 'Prepare for Retake',
          description: `Use the ${remainingCooldown} hour cooldown period to study and improve. Focus on your weak areas.`,
          priority: 'high',
          estimatedTime: remainingCooldown,
          resources: await this.getRetakePreparationResources(qualification, assessmentResult),
          qualificationId: qualification.id
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Get personalized resources based on topics, difficulty, and user preferences
   */
  async getPersonalizedResources(
    topics: string[],
    difficulty: DifficultyLevel,
    preferences: PersonalizationFactors
  ): Promise<RecommendationResource[]> {
    
    const resources: RecommendationResource[] = [];
    
    // Add resources based on learning style preference
    switch (preferences.learningStyle) {
      case 'visual':
        resources.push(...await this.getVisualResources(topics, difficulty));
        break;
      case 'auditory':
        resources.push(...await this.getAudioResources(topics, difficulty));
        break;
      case 'kinesthetic':
        resources.push(...await this.getHandsOnResources(topics, difficulty));
        break;
      case 'reading':
        resources.push(...await this.getTextResources(topics, difficulty));
        break;
    }
    
    // Add resources based on time availability
    const timeConstrainedResources = this.filterResourcesByTime(resources, preferences.availableTimePerWeek);
    
    // Add resources based on experience level
    const experienceAdjustedResources = this.adjustResourcesForExperience(
      timeConstrainedResources, 
      preferences.experience
    );
    
    return experienceAdjustedResources.slice(0, 5); // Limit to 5 resources per recommendation
  }
  
  // Private helper methods
  
  private async personalizeRecommendations(
    recommendations: Recommendation[],
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    
    // Apply AI-powered personalization (placeholder for ML model integration)
    return recommendations.map(rec => {
      // Adjust timing based on user's available time
      if (context.personalizationFactors?.availableTimePerWeek) {
        const weeklyTime = context.personalizationFactors.availableTimePerWeek;
        if (rec.estimatedTime > weeklyTime * 2) {
          rec.estimatedTime = Math.floor(weeklyTime * 1.5);
          rec.description += ' Split into smaller sessions to fit your schedule.';
        }
      }
      
      // Adjust priority based on motivation
      if (context.personalizationFactors?.motivation === 'certification' && rec.type === 'practice') {
        rec.priority = 'high'; // Higher priority for practice if goal is certification
      }
      
      return rec;
    });
  }
  
  private rankRecommendations(
    recommendations: Recommendation[],
    context: RecommendationContext
  ): Recommendation[] {
    
    // Scoring system for ranking recommendations
    return recommendations.sort((a, b) => {
      const scoreA = this.calculateRecommendationScore(a, context);
      const scoreB = this.calculateRecommendationScore(b, context);
      return scoreB - scoreA; // Higher scores first
    });
  }
  
  private calculateRecommendationScore(rec: Recommendation, context: RecommendationContext): number {
    let score = 0;
    
    // Priority scoring
    const priorityScores = { high: 100, medium: 60, low: 30 };
    score += priorityScores[rec.priority];
    
    // Type relevance based on current performance
    if (context.assessmentResult.score < 60 && rec.type === 'study') {score += 50;}
    if (context.assessmentResult.score >= 60 && context.assessmentResult.score < 80 && rec.type === 'practice') {score += 40;}
    if (context.assessmentResult.score >= 80 && rec.type === 'advance') {score += 30;}
    
    // Time feasibility
    if (context.personalizationFactors?.availableTimePerWeek) {
      const weeklyTime = context.personalizationFactors.availableTimePerWeek;
      if (rec.estimatedTime <= weeklyTime) {score += 20;}
      else if (rec.estimatedTime <= weeklyTime * 2) {score += 10;}
    }
    
    // Resource quality (number of resources available)
    score += Math.min(20, rec.resources.length * 5);
    
    return score;
  }
  
  private getCategoryScore(result: AssessmentResult, category: string): number {
    if (!result.categoryScores || typeof result.categoryScores !== 'object') {
      return result.score; // Fallback to overall score
    }
    
    const categoryScore = result.categoryScores[category];
    return typeof categoryScore === 'number' ? categoryScore : result.score;
  }
  
  private determineDifficultyForWeakArea(score: number): DifficultyLevel {
    if (score < 40) {return DifficultyLevel.BEGINNER;}
    if (score < 60) {return DifficultyLevel.INTERMEDIATE;}
    return DifficultyLevel.ADVANCED;
  }
  
  private getDefaultPersonalizationFactors(): PersonalizationFactors {
    return {
      learningStyle: 'reading',
      preferredPace: 'moderate',
      availableTimePerWeek: 10,
      strongAreas: [],
      weakAreas: [],
      motivation: 'certification',
      experience: 'some'
    };
  }
  
  private formatCategoryName(category: string): string {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  private calculateStudyTime(scoreDifference: number, factors?: PersonalizationFactors): number {
    const baseTime = Math.max(30, scoreDifference * 2); // 2 minutes per point needed
    
    if (!factors) {return baseTime;}
    
    // Adjust for learning pace preference
    const paceMultipliers = { slow: 1.5, moderate: 1.0, fast: 0.7 };
    const adjustedTime = baseTime * paceMultipliers[factors.preferredPace];
    
    // Adjust for experience
    const expMultipliers = { none: 1.3, beginner: 1.1, some: 1.0, experienced: 0.8 };
    const finalTime = adjustedTime * expMultipliers[factors.experience];
    
    return Math.round(finalTime);
  }
  
  private calculateFoundationalStudyTime(currentScore: number, factors?: PersonalizationFactors): number {
    const baseTime = (70 - currentScore) * 3; // 3 minutes per point to reach 70%
    return this.calculateStudyTime(baseTime, factors);
  }
  
  private calculateRetakeStudyTime(currentScore: number, passingScore: number): number {
    const pointsNeeded = passingScore - currentScore;
    return Math.max(60, pointsNeeded * 4); // 4 minutes per point with minimum 1 hour
  }
  
  private identifyModeratePerformanceAreas(result: AssessmentResult): string[] {
    if (!result.categoryScores || typeof result.categoryScores !== 'object') {return [];}
    
    return Object.entries(result.categoryScores)
      .filter(([_, score]) => typeof score === 'number' && score >= 60 && score < 80)
      .map(([category, _]) => category);
  }
  
  private identifyDifficultyWeaknesses(result: AssessmentResult): DifficultyLevel[] {
    // This would analyze performance by difficulty level
    // For now, return a simple analysis
    return result.score < 70 ? [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE] : [];
  }
  
  // Placeholder methods for resource generation (would integrate with content management system)
  private async getFoundationalResources(category: QualificationCategory, factors?: PersonalizationFactors): Promise<RecommendationResource[]> { return []; }
  private async getPrerequisiteResources(qualification: Qualification): Promise<RecommendationResource[]> { return []; }
  private async getPracticeResources(area: string, difficulty: DifficultyLevel): Promise<RecommendationResource[]> { return []; }
  private async getComprehensivePracticeResources(qualification: Qualification): Promise<RecommendationResource[]> { return []; }
  private async getDifficultyBasedPracticeResources(difficulty: DifficultyLevel, category: QualificationCategory): Promise<RecommendationResource[]> { return []; }
  private async getAdvancementResources(qualification: Qualification): Promise<RecommendationResource[]> { return []; }
  private async getCareerResources(category: QualificationCategory): Promise<RecommendationResource[]> { return []; }
  private async getRetakePreparationResources(qualification: Qualification, result: AssessmentResult): Promise<RecommendationResource[]> { return []; }
  private async getVisualResources(topics: string[], difficulty: DifficultyLevel): Promise<RecommendationResource[]> { return []; }
  private async getAudioResources(topics: string[], difficulty: DifficultyLevel): Promise<RecommendationResource[]> { return []; }
  private async getHandsOnResources(topics: string[], difficulty: DifficultyLevel): Promise<RecommendationResource[]> { return []; }
  private async getTextResources(topics: string[], difficulty: DifficultyLevel): Promise<RecommendationResource[]> { return []; }
  
  // Placeholder methods for qualification discovery
  private async identifyMissingPrerequisites(context: RecommendationContext): Promise<Qualification[]> { return []; }
  private async findNextLevelQualifications(qualification: Qualification): Promise<Qualification[]> { return []; }
  private async findRelatedQualifications(qualification: Qualification): Promise<Qualification[]> { return []; }
  private async findSpecializations(qualification: Qualification): Promise<Qualification[]> { return []; }
  
  private filterResourcesByTime(resources: RecommendationResource[], availableTime: number): RecommendationResource[] {
    return resources.filter(resource => resource.estimatedTime <= availableTime * 0.5);
  }
  
  private adjustResourcesForExperience(resources: RecommendationResource[], experience: string): RecommendationResource[] {
    return resources; // Would adjust based on experience level
  }
}

// Factory function
export function createRecommendationEngine(): RecommendationEngine {
  return new AIRecommendationEngine();
}

// Export singleton
export const aiRecommendationEngine = new AIRecommendationEngine();