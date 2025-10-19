import { z } from "zod"
import { NextRequest } from "next/server"

// Common validation schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

export const idSchema = z.object({
  id: z.string().min(1, "ID is required")
})

// Qualification schemas
export const qualificationCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  shortDescription: z.string().optional(),
  category: z.enum([
    "ARTIFICIAL_INTELLIGENCE",
    "MACHINE_LEARNING", 
    "DATA_SCIENCE",
    "SOFTWARE_ENGINEERING",
    "CLOUD_COMPUTING",
    "CYBERSECURITY",
    "BLOCKCHAIN",
    "MOBILE_DEVELOPMENT",
    "WEB_DEVELOPMENT",
    "DEVOPS",
    "PRODUCT_MANAGEMENT",
    "UX_UI_DESIGN",
    "BUSINESS_ANALYSIS",
    "PROJECT_MANAGEMENT",
    "DIGITAL_MARKETING",
    "OTHER"
  ]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute"),
  prerequisites: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  passingScore: z.number().min(0).max(100).default(70),
  totalQuestions: z.number().min(1).default(50),
  timeLimit: z.number().min(1).optional(),
  allowRetakes: z.boolean().default(true),
  retakeCooldown: z.number().min(0).optional(),
  learningObjectives: z.array(z.string()).default([]),
  syllabus: z.any().optional(),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  version: z.string().default("1.0")
})

export const qualificationUpdateSchema = qualificationCreateSchema.partial().omit({ slug: true })

export const qualificationQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  difficulty: z.string().optional(),
  isPublished: z.string().transform(val => val === "true").optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "difficulty"]).default("createdAt")
})

// Assessment schemas
export const assessmentCreateSchema = z.object({
  qualificationId: z.string().min(1, "Qualification ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questionCount: z.number().min(1).default(50),
  timeLimit: z.number().min(1).optional(),
  randomizeQuestions: z.boolean().default(true),
  randomizeAnswers: z.boolean().default(true),
  showResults: z.boolean().default(true),
  questionCategories: z.any().optional(),
  difficultyMix: z.any().optional(),
  isActive: z.boolean().default(true)
})

export const assessmentUpdateSchema = assessmentCreateSchema.partial().omit({ qualificationId: true })

export const assessmentQuerySchema = paginationSchema.extend({
  qualificationId: z.string().optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt"]).default("createdAt")
})

// Question schemas
export const questionCreateSchema = z.object({
  qualificationId: z.string().min(1, "Qualification ID is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  explanation: z.string().optional(),
  type: z.enum([
    "MULTIPLE_CHOICE",
    "MULTIPLE_SELECT",
    "TRUE_FALSE",
    "FILL_IN_BLANK",
    "CODING_CHALLENGE",
    "DRAG_AND_DROP",
    "MATCHING",
    "ESSAY"
  ]),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  tags: z.array(z.string()).default([]),
  options: z.any(), // JSON object with answer options
  correctAnswers: z.array(z.string()).min(1, "At least one correct answer is required"),
  points: z.number().min(1).default(1),
  timeEstimate: z.number().min(1).optional(),
  isActive: z.boolean().default(true)
})

export const questionUpdateSchema = questionCreateSchema.partial().omit({ qualificationId: true })

export const questionQuerySchema = paginationSchema.extend({
  qualificationId: z.string().optional(),
  type: z.string().optional(),
  difficulty: z.string().optional(),
  category: z.string().optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "difficulty", "category"]).default("createdAt")
})

// Assessment result schemas
export const assessmentResultCreateSchema = z.object({
  assessmentId: z.string().min(1, "Assessment ID is required"),
  answers: z.array(z.object({
    questionId: z.string(),
    userAnswer: z.array(z.string()),
    timeSpent: z.number().optional(),
    confidence: z.number().min(1).max(5).optional(),
    flaggedForReview: z.boolean().default(false)
  }))
})

// Utility functions for validation
export function validatePaginationParams(searchParams: URLSearchParams) {
  const params = Object.fromEntries(searchParams)
  return {
    page: params.page || "1",
    limit: params.limit || "10",
    ...params
  }
}

export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: any): T {
  return schema.parse(body)
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: any): T {
  return schema.parse(params)
}