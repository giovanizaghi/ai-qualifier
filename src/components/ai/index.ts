// AI Integration Components - Phase 5.1
export { AIContentGenerator } from './ai-content-generator';
export { IntelligentTutoring } from './intelligent-tutoring';

// Types for AI integration
export interface AIGeneratedQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  topics: string[];
  estimatedTime: number;
  points: number;
}

export interface TutorHint {
  type: 'hint' | 'explanation' | 'example' | 'step-by-step';
  content: string;
  difficulty: 'basic' | 'detailed' | 'comprehensive';
  followUpQuestions?: string[];
}

export interface UserContext {
  timeSpent: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
  previousAttempts?: string[];
  knownWeaknesses?: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}