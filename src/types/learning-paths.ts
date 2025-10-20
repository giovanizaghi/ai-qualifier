export interface LearningPath {
  id: string
  title: string
  description: string
  shortDescription?: string
  category: LearningPathCategory
  difficulty: DifficultyLevel
  estimatedDuration: number // in minutes
  totalSteps: number
  prerequisites: string[]
  tags: string[]
  
  // Learning objectives and outcomes
  learningObjectives: string[]
  outcomes: string[]
  
  // Status and visibility
  isActive: boolean
  isPublished: boolean
  
  // Relations and metadata
  steps: LearningStep[]
  qualificationIds: string[] // Associated qualifications
  instructorId?: string
  
  // Analytics
  enrollmentCount: number
  completionRate: number
  averageRating?: number
  
  createdAt: Date
  updatedAt: Date
}

export interface LearningStep {
  id: string
  pathId: string
  order: number
  title: string
  description: string
  type: LearningStepType
  content?: LearningStepContent
  
  // Step configuration
  estimatedTime: number // in minutes
  difficulty: DifficultyLevel
  isOptional: boolean
  
  // Prerequisites and dependencies
  prerequisites: string[] // step IDs
  unlocks: string[] // step IDs that this unlocks
  
  // Resources and materials
  resources: LearningResource[]
  
  // Assessment and validation
  hasAssessment: boolean
  assessmentId?: string
  passingCriteria?: PassingCriteria
  
  // Status
  isActive: boolean
  
  createdAt: Date
  updatedAt: Date
}

export interface LearningStepContent {
  type: 'text' | 'video' | 'interactive' | 'assignment' | 'quiz' | 'project'
  contentUrl?: string
  embeddedContent?: string
  metadata?: Record<string, any>
}

export interface LearningResource {
  id: string
  title: string
  type: ResourceType
  url?: string
  content?: string
  isRequired: boolean
  estimatedTime?: number
}

export interface PassingCriteria {
  minScore?: number
  requiredTasks?: string[]
  timeLimit?: number
  maxAttempts?: number
}

export interface LearningPathProgress {
  id: string
  userId: string
  pathId: string
  
  // Overall progress
  status: ProgressStatus
  completionPercentage: number
  currentStepId?: string
  currentStepOrder: number
  
  // Time tracking
  totalTimeSpent: number // in minutes
  lastActivityAt: Date
  enrolledAt: Date
  completedAt?: Date
  
  // Step progress
  completedSteps: string[]
  stepProgress: Record<string, StepProgress>
  
  // Performance tracking
  averageScore?: number
  strengths: string[]
  areasForImprovement: string[]
  
  // Adaptive features
  personalizedRecommendations: string[]
  adaptiveAdjustments: AdaptiveAdjustment[]
  
  createdAt: Date
  updatedAt: Date
}

export interface StepProgress {
  stepId: string
  status: StepStatus
  startedAt?: Date
  completedAt?: Date
  timeSpent: number
  attempts: number
  bestScore?: number
  lastScore?: number
  notes?: string
}

export interface AdaptiveAdjustment {
  id: string
  timestamp: Date
  type: 'skip_step' | 'add_step' | 'modify_difficulty' | 'recommend_resource'
  reason: string
  data: Record<string, any>
}

export interface LearningPathWithProgress extends LearningPath {
  userProgress?: LearningPathProgress
  _count: {
    enrollments: number
    completions: number
    steps: number
  }
}

export interface LearningPathFilters {
  search: string
  category?: LearningPathCategory
  difficulty?: DifficultyLevel
  duration?: DurationRange
  status: 'all' | 'not-started' | 'in-progress' | 'completed'
  tags?: string[]
}

// Enums
export enum LearningPathCategory {
  ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  DATA_SCIENCE = 'DATA_SCIENCE',
  SOFTWARE_ENGINEERING = 'SOFTWARE_ENGINEERING',
  CLOUD_COMPUTING = 'CLOUD_COMPUTING',
  CYBERSECURITY = 'CYBERSECURITY',
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
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

export enum LearningStepType {
  READING = 'READING',
  VIDEO = 'VIDEO',
  INTERACTIVE = 'INTERACTIVE',
  PRACTICE = 'PRACTICE',
  ASSESSMENT = 'ASSESSMENT',
  PROJECT = 'PROJECT',
  DISCUSSION = 'DISCUSSION',
  MILESTONE = 'MILESTONE'
}

export enum ResourceType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  TOOL = 'TOOL',
  TEMPLATE = 'TEMPLATE',
  DATASET = 'DATASET',
  CODE_EXAMPLE = 'CODE_EXAMPLE'
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED'
}

export enum StepStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

export interface DurationRange {
  min?: number
  max?: number
}

export interface LearningPathRecommendation {
  pathId: string
  reason: string
  confidence: number
  basedOn: 'skill_gaps' | 'career_goals' | 'interests' | 'similar_users'
}