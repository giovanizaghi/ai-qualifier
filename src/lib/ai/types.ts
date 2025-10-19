export interface AIGeneratedQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  topics: string[];
  estimatedTime: number; // in minutes
  points: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number; // in hours
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  topics: LearningPathTopic[];
  personalizedReasons: string[];
}

export interface LearningPathTopic {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  order: number;
  resources: LearningResource[];
  assessmentIds: string[];
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'tutorial' | 'exercise' | 'documentation';
  url?: string;
  content?: string;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserPerformanceAnalysis {
  userId: string;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  confidenceScore: number; // 0-100
  predictedSuccessRate: number; // 0-100
}

export interface AdaptiveQuestionRequest {
  userId: string;
  topicId: string;
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  recentPerformance: {
    correct: number;
    total: number;
    avgTime: number;
  };
  userStrengths: string[];
  userWeaknesses: string[];
}

export interface TutorHint {
  type: 'hint' | 'explanation' | 'example' | 'step-by-step';
  content: string;
  difficulty: 'basic' | 'detailed' | 'comprehensive';
  followUpQuestions?: string[];
}

export interface ContentRecommendation {
  type: 'qualification' | 'topic' | 'resource' | 'practice';
  title: string;
  description: string;
  relevanceScore: number; // 0-100
  reasoning: string;
  estimatedTime?: number;
  difficulty?: string;
  url?: string;
  content?: any;
}

export interface PerformancePrediction {
  userId: string;
  targetQualification: string;
  predictedScore: number; // 0-100
  confidence: number; // 0-100
  timeToCompletion: number; // in hours
  riskFactors: string[];
  recommendations: string[];
  requiredPreparation: {
    topics: string[];
    estimatedStudyTime: number;
    suggestedResources: string[];
  };
}