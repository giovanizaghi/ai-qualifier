// Main AI Service - Orchestrates all AI capabilities
export { openAIClient } from './openai-client';
export { aiContentGenerator } from './content-generator';
export { personalizedLearningService } from './personalized-learning';
export { adaptiveQuestioningService } from './adaptive-questioning';
export { intelligentTutoringService } from './intelligent-tutoring';
export { contentRecommendationService } from './content-recommendation';
export { performancePredictionService } from './performance-prediction';

// Types
export * from './types';

// Main AI Service Class that orchestrates all capabilities
import { adaptiveQuestioningService } from './adaptive-questioning';
import { aiContentGenerator } from './content-generator';
import { contentRecommendationService } from './content-recommendation';
import { intelligentTutoringService } from './intelligent-tutoring';
import { openAIClient } from './openai-client';
import { performancePredictionService } from './performance-prediction';
import { personalizedLearningService } from './personalized-learning';

export class AIQualifierService {
  // Content Generation
  async generateQuestions(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    count: number = 5,
    questionTypes?: Array<'multiple-choice' | 'true-false' | 'short-answer' | 'essay'>
  ) {
    return aiContentGenerator.generateMultipleQuestions(topic, count, difficulty, questionTypes);
  }

  async generateLearningContent(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    contentType: 'explanation' | 'tutorial' | 'summary' | 'example'
  ) {
    return aiContentGenerator.generateLearningContent(topic, difficulty, contentType);
  }

  // Personalized Learning
  async createPersonalizedLearningPath(
    userId: string,
    targetQualification: string,
    userPerformance: any,
    availableTime: number,
    preferences: any
  ) {
    return personalizedLearningService.generateLearningPath(
      userId,
      targetQualification,
      userPerformance,
      availableTime,
      preferences
    );
  }

  async analyzeUserPerformance(userId: string, assessmentHistory: any[], userProfile: any) {
    return personalizedLearningService.analyzeUserPerformance(userId, assessmentHistory, userProfile);
  }

  // Adaptive Questioning
  async generateAdaptiveQuestion(request: any) {
    return adaptiveQuestioningService.generateAdaptiveQuestion(request);
  }

  async adjustQuestionDifficulty(currentDifficulty: any, recentPerformance: any) {
    return adaptiveQuestioningService.adjustDifficultyBasedOnPerformance(currentDifficulty, recentPerformance);
  }

  // Intelligent Tutoring
  async provideLearningHint(question: string, userContext: any, hintLevel: 'subtle' | 'moderate' | 'explicit' = 'moderate') {
    return intelligentTutoringService.generateHint(question, userContext, hintLevel);
  }

  async generateExplanation(question: string, correctAnswer: string, userAnswer: string, isCorrect: boolean, context: any) {
    return intelligentTutoringService.generateExplanation(question, correctAnswer, userAnswer, isCorrect, context);
  }

  async provideLearningGuidance(userStrengths: string[], userWeaknesses: string[], currentTopic: string, learningGoals: string[], availableStudyTime: number) {
    return intelligentTutoringService.provideLearningGuidance(userStrengths, userWeaknesses, currentTopic, learningGoals, availableStudyTime);
  }

  // Content Recommendations
  async recommendQualifications(userProfile: any, performanceAnalysis: any) {
    return contentRecommendationService.generateQualificationRecommendations(userProfile, performanceAnalysis);
  }

  async recommendStudyTopics(currentQualification: string, userPerformance: any, learningObjectives: string[]) {
    return contentRecommendationService.generateTopicRecommendations(currentQualification, userPerformance, learningObjectives);
  }

  async recommendStudyResources(topic: string, userLearningStyle: any, difficultyLevel: any, timeConstraints: any) {
    return contentRecommendationService.generateStudyResourceRecommendations(topic, userLearningStyle, difficultyLevel, timeConstraints);
  }

  // Performance Prediction
  async predictQualificationSuccess(userId: string, targetQualification: string, userPerformance: any, practiceHistory: any[], studyPlan: any) {
    return performancePredictionService.predictQualificationSuccess(userId, targetQualification, userPerformance, practiceHistory, studyPlan);
  }

  async predictLearningOutcomes(userId: string, learningPath: any, userCapabilities: any, externalFactors: any) {
    return performancePredictionService.predictLearningOutcomes(userId, learningPath, userCapabilities, externalFactors);
  }

  async assessRiskFactors(userPerformance: any, practiceHistory: any[], behaviorPatterns: any) {
    return performancePredictionService.identifyRiskFactors(userPerformance, practiceHistory, behaviorPatterns);
  }

  // Health Check
  isAIEnabled(): boolean {
    return openAIClient.isInitialized();
  }

  async testAIConnection(): Promise<boolean> {
    try {
      const response = await openAIClient.generateCompletion(
        'Test connection - respond with "OK"',
        { maxTokens: 10, temperature: 0 }
      );
      return response?.includes('OK') || false;
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}

export const aiService = new AIQualifierService();