// Application constants

export const APP_CONFIG = {
  name: 'AI Qualifier',
  description: 'Advanced AI qualification and assessment platform',
  version: '1.0.0',
  author: 'AI Qualifier Team',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  QUALIFICATIONS: '/qualifications',
  ASSESSMENT: '/assessment',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
} as const;

export const ASSESSMENT_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const THEME_COLORS = {
  PRIMARY: 'hsl(var(--primary))',
  SECONDARY: 'hsl(var(--secondary))',
  SUCCESS: 'hsl(var(--success))',
  WARNING: 'hsl(var(--warning))',
  ERROR: 'hsl(var(--destructive))',
} as const;

export const LIMITS = {
  MAX_ASSESSMENT_TIME: 3600, // 1 hour in seconds
  MAX_ATTEMPTS_PER_QUALIFICATION: 3,
  MIN_PASSING_SCORE: 70,
  QUESTIONS_PER_PAGE: 1,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  QUALIFICATIONS: {
    LIST: '/api/qualifications',
    DETAIL: '/api/qualifications/[id]',
    QUESTIONS: '/api/qualifications/[id]/questions',
  },
  ASSESSMENTS: {
    START: '/api/assessments/start',
    SUBMIT: '/api/assessments/submit',
    PROGRESS: '/api/assessments/progress',
  },
  USER: {
    PROFILE: '/api/user/profile',
    PROGRESS: '/api/user/progress',
  },
} as const;