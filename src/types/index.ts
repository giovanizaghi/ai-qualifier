// Core types for the AI Qualifier application

// Enums matching Prisma schema
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR'
}

export enum QualificationCategory {
  ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  DATA_SCIENCE = 'DATA_SCIENCE',
  SOFTWARE_ENGINEERING = 'SOFTWARE_ENGINEERING',
  CLOUD_COMPUTING = 'CLOUD_COMPUTING',
  CYBERSECURITY = 'CYBERSECURITY',
  BLOCKCHAIN = 'BLOCKCHAIN',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  DEVOPS = 'DEVOPS',
  PRODUCT_MANAGEMENT = 'PRODUCT_MANAGEMENT',
  UX_UI_DESIGN = 'UX_UI_DESIGN',
  BUSINESS_ANALYSIS = 'BUSINESS_ANALYSIS',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  DIGITAL_MARKETING = 'DIGITAL_MARKETING',
  OTHER = 'OTHER'
}

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  CODING_CHALLENGE = 'CODING_CHALLENGE',
  DRAG_AND_DROP = 'DRAG_AND_DROP',
  MATCHING = 'MATCHING',
  ESSAY = 'ESSAY'
}

export enum AssessmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  EXPIRED = 'EXPIRED'
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED'
}

// Core Domain Models
export interface User {
  id: string;
  email: string;
  emailVerified?: Date;
  name?: string;
  image?: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  bio?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Qualification {
  id: string;
  title: string;
  description: string;
  slug: string;
  shortDescription?: string;
  category: QualificationCategory;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in minutes
  prerequisites: string[];
  tags: string[];
  passingScore: number;
  totalQuestions: number;
  timeLimit?: number; // in minutes
  allowRetakes: boolean;
  retakeCooldown?: number; // hours
  learningObjectives: string[];
  syllabus?: any; // JSON structure
  isActive: boolean;
  isPublished: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  qualificationId: string;
  title: string;
  description?: string;
  questionCount: number;
  timeLimit?: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showResults: boolean;
  questionCategories?: any; // JSON
  difficultyMix?: any; // JSON
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  qualificationId: string;
  title: string;
  content: string;
  explanation?: string;
  type: QuestionType;
  category: string;
  difficulty: DifficultyLevel;
  tags: string[];
  options: any; // JSON structure
  correctAnswers: string[];
  points: number;
  timeEstimate?: number; // seconds
  timesUsed: number;
  timesCorrect: number;
  averageTime?: number; // seconds
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  assessmentId: string;
  score: number; // percentage 0-100
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number; // seconds
  status: AssessmentStatus;
  passed: boolean;
  certificateId?: string;
  categoryScores?: any; // JSON
  metadata?: any; // JSON
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionResult {
  id: string;
  assessmentResultId: string;
  questionId: string;
  userAnswer: string[];
  isCorrect: boolean;
  points: number;
  timeSpent?: number; // seconds
  confidence?: number; // 1-5
  flaggedForReview: boolean;
  createdAt: Date;
}

export interface QualificationProgress {
  id: string;
  userId: string;
  qualificationId: string;
  status: ProgressStatus;
  completionPercentage: number;
  studyTimeMinutes: number;
  lastStudiedAt?: Date;
  attempts: number;
  bestScore?: number;
  lastAttemptScore?: number;
  lastAttemptAt?: Date;
  currentTopic?: string;
  completedTopics: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Assessment Engine Types
export interface QualificationCriteria {
  id: string;
  qualificationId: string;
  name: string;
  description: string;
  weight: number; // 0-1, how much this criteria contributes to overall score
  passingThreshold: number; // minimum score required for this criteria
  evaluationType: 'automatic' | 'manual' | 'hybrid';
  rubric?: AssessmentRubric;
  questions: string[]; // question IDs that contribute to this criteria
}

export interface AssessmentRubric {
  levels: RubricLevel[];
  scoringMethod: 'points' | 'percentage' | 'weighted';
  maxScore: number;
}

export interface RubricLevel {
  level: number;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
  qualityIndicators: string[];
}

export interface ScoringConfig {
  method: 'simple' | 'weighted' | 'adaptive' | 'irt'; // Item Response Theory
  penalizeIncorrect: boolean;
  penaltyWeight: number; // 0-1
  bonusForSpeed: boolean;
  speedBonusThreshold: number; // seconds
  categoryWeights?: Record<string, number>;
  difficultyMultipliers?: Record<DifficultyLevel, number>;
}

export interface AssessmentEngine {
  calculateScore(answers: QuestionResult[], questions: Question[], config: ScoringConfig): AssessmentScore;
  evaluateCriteria(result: AssessmentResult, criteria: QualificationCriteria[]): CriteriaEvaluation[];
  determineQualificationLevel(score: number, criteria: CriteriaEvaluation[]): QualificationLevel;
  generateRecommendations(result: AssessmentResult, userProgress: QualificationProgress, assessment?: Assessment, qualification?: Qualification): Recommendation[];
}

export interface AssessmentScore {
  totalScore: number; // 0-100 percentage
  rawScore: number; // actual points earned
  maxPossibleScore: number;
  categoryBreakdown: Record<string, number>;
  difficultyBreakdown: Record<DifficultyLevel, number>;
  timeBonus: number;
  penalties: number;
  confidence: number; // statistical confidence in the score
}

export interface CriteriaEvaluation {
  criteriaId: string;
  score: number;
  passed: boolean;
  feedback: string;
  improvementAreas: string[];
  strengths: string[];
}

export interface QualificationLevel {
  level: DifficultyLevel;
  name: string;
  description: string;
  requirements: QualificationRequirement[];
  nextLevel?: DifficultyLevel;
  estimatedStudyTime: number; // hours to reach next level
}

export interface QualificationRequirement {
  type: 'score' | 'criteria' | 'time' | 'attempts';
  description: string;
  threshold: number;
  achieved: boolean;
}

export interface Recommendation {
  type: 'study' | 'practice' | 'retake' | 'advance';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  resources: RecommendationResource[];
  qualificationId?: string;
  category?: string;
}

export interface RecommendationResource {
  type: 'article' | 'video' | 'practice' | 'course' | 'documentation';
  title: string;
  url: string;
  description: string;
  estimatedTime: number; // minutes
  difficulty: DifficultyLevel;
}

// Legacy compatibility (keeping for now)
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