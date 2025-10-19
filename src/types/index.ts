// Core types for the AI Qualifier application

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Qualification {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  questions: Question[];
  passingScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  qualificationId: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Assessment {
  id: string;
  userId: string;
  qualificationId: string;
  answers: Answer[];
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
}

export interface Answer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

export interface UserProgress {
  userId: string;
  qualificationId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  currentQuestionIndex: number;
  lastAccessedAt: Date;
  attempts: number;
  bestScore?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}