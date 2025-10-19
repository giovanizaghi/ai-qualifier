/**
 * Enhanced Question Validation System
 * Provides comprehensive validation for question content, answers, and metadata
 */

import { z } from "zod"

import { QuestionType, DifficultyLevel } from "@/types"

// Base validation schemas for question options based on type
const multipleChoiceOptionsSchema = z.object({
  choices: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, "Choice text is required"),
    isCorrect: z.boolean().default(false)
  })).min(2, "Multiple choice questions must have at least 2 choices")
    .max(10, "Multiple choice questions can have at most 10 choices")
    .refine(
      choices => choices.filter(c => c.isCorrect).length === 1,
      "Multiple choice questions must have exactly one correct answer"
    ),
  randomizeOrder: z.boolean().default(true),
  showLetters: z.boolean().default(true) // Show A, B, C, D labels
})

const multipleSelectOptionsSchema = z.object({
  choices: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, "Choice text is required"),
    isCorrect: z.boolean().default(false)
  })).min(2, "Multiple select questions must have at least 2 choices")
    .max(15, "Multiple select questions can have at most 15 choices")
    .refine(
      choices => choices.filter(c => c.isCorrect).length >= 1,
      "Multiple select questions must have at least one correct answer"
    ),
  randomizeOrder: z.boolean().default(true),
  minSelections: z.number().min(1).optional(),
  maxSelections: z.number().min(1).optional(),
  partialCredit: z.boolean().default(true)
})

const trueFalseOptionsSchema = z.object({
  correctAnswer: z.boolean(),
  explanation: z.string().optional()
})

const fillInBlankOptionsSchema = z.object({
  blanks: z.array(z.object({
    id: z.string(),
    position: z.number().min(0), // Position in the text where blank appears
    acceptedAnswers: z.array(z.string()).min(1, "Each blank must have at least one accepted answer"),
    caseSensitive: z.boolean().default(false),
    exactMatch: z.boolean().default(false) // If false, allows partial matching
  })).min(1, "Fill in blank questions must have at least one blank"),
  template: z.string().min(1, "Template text is required"), // Text with placeholders like {blank1}
  showBlanksInOrder: z.boolean().default(true)
})

const codingChallengeOptionsSchema = z.object({
  language: z.enum(["javascript", "python", "java", "cpp", "csharp", "go", "rust", "typescript"]),
  starterCode: z.string().optional(),
  solution: z.string().min(1, "Solution code is required"),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false), // Hidden test cases not shown to user
    points: z.number().min(0).default(1)
  })).min(1, "Coding challenges must have at least one test case"),
  timeLimit: z.number().min(30).max(3600).default(300), // seconds
  memoryLimit: z.number().min(16).max(512).default(128), // MB
  allowedImports: z.array(z.string()).optional(),
  executionEnvironment: z.enum(["browser", "docker", "sandbox"]).default("sandbox")
})

const dragAndDropOptionsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    content: z.string(),
    type: z.enum(["text", "image", "code"]).default("text"),
    correctZone: z.string() // ID of the drop zone this item belongs to
  })).min(2, "Drag and drop questions must have at least 2 items"),
  dropZones: z.array(z.object({
    id: z.string(),
    label: z.string(),
    allowMultiple: z.boolean().default(false),
    maxItems: z.number().min(1).optional()
  })).min(2, "Drag and drop questions must have at least 2 drop zones"),
  randomizeItems: z.boolean().default(true),
  partialCredit: z.boolean().default(true)
})

const matchingOptionsSchema = z.object({
  leftColumn: z.array(z.object({
    id: z.string(),
    content: z.string(),
    type: z.enum(["text", "image"]).default("text")
  })).min(2, "Matching questions must have at least 2 items in left column"),
  rightColumn: z.array(z.object({
    id: z.string(),
    content: z.string(),
    type: z.enum(["text", "image"]).default("text"),
    matchesLeft: z.array(z.string()) // IDs from left column that match this item
  })).min(2, "Matching questions must have at least 2 items in right column"),
  allowOneToMany: z.boolean().default(false), // Allow one left item to match multiple right items
  randomizeColumns: z.boolean().default(true),
  partialCredit: z.boolean().default(true)
})

const essayOptionsSchema = z.object({
  wordLimit: z.object({
    min: z.number().min(1).optional(),
    max: z.number().min(1).optional()
  }).optional(),
  timeLimit: z.number().min(60).max(7200).optional(), // seconds
  rubric: z.object({
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      maxPoints: z.number().min(1),
      levels: z.array(z.object({
        score: z.number().min(0),
        description: z.string()
      }))
    }))
  }).optional(),
  sampleAnswer: z.string().optional(),
  keyPoints: z.array(z.string()).optional(), // Key points that should be covered
  autoGrading: z.object({
    enabled: z.boolean().default(false),
    keywords: z.array(z.string()),
    keywordWeights: z.record(z.string(), z.number()).optional()
  }).optional()
})

// Dynamic options schema based on question type
const createOptionsSchema = (type: QuestionType) => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return multipleChoiceOptionsSchema
    case QuestionType.MULTIPLE_SELECT:
      return multipleSelectOptionsSchema
    case QuestionType.TRUE_FALSE:
      return trueFalseOptionsSchema
    case QuestionType.FILL_IN_BLANK:
      return fillInBlankOptionsSchema
    case QuestionType.CODING_CHALLENGE:
      return codingChallengeOptionsSchema
    case QuestionType.DRAG_AND_DROP:
      return dragAndDropOptionsSchema
    case QuestionType.MATCHING:
      return matchingOptionsSchema
    case QuestionType.ESSAY:
      return essayOptionsSchema
    default:
      return z.any()
  }
}

// Enhanced question creation schema with type-specific validation
export const enhancedQuestionCreateSchema = z.object({
  qualificationId: z.string().min(1, "Qualification ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  explanation: z.string().max(2000, "Explanation too long").optional(),
  type: z.nativeEnum(QuestionType),
  category: z.string().min(1, "Category is required").max(100, "Category name too long"),
  difficulty: z.nativeEnum(DifficultyLevel),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").default([]),
  points: z.number().min(1).max(20).default(1),
  timeEstimate: z.number().min(10).max(3600).optional(), // seconds
  isActive: z.boolean().default(true),
  // Version control
  version: z.string().default("1.0"),
  changeLog: z.string().optional(),
  // Metadata
  authorNotes: z.string().max(1000).optional(),
  reviewStatus: z.enum(["draft", "pending_review", "approved", "needs_revision"]).default("draft"),
  reviewNotes: z.string().optional(),
  lastReviewedAt: z.date().optional(),
  // Advanced options
  options: z.any() // Will be validated based on question type
}).refine(async (data) => {
  // Validate options based on question type
  const optionsSchema = createOptionsSchema(data.type)
  try {
    optionsSchema.parse(data.options)
    return true
  } catch {
    return false
  }
}, {
  message: "Invalid options for question type",
  path: ["options"]
})

// Question difficulty validation helpers
export class QuestionDifficultyValidator {
  /**
   * Validate question difficulty based on content analysis
   */
  static validateDifficulty(question: {
    content: string
    type: QuestionType
    options: any
    category: string
  }, assignedDifficulty: DifficultyLevel): {
    isValid: boolean
    suggestedDifficulty?: DifficultyLevel
    reasons: string[]
  } {
    const reasons: string[] = []
    let suggestedDifficulty: DifficultyLevel | undefined

    // Content complexity analysis
    const contentComplexity = this.analyzeContentComplexity(question.content)
    
    // Question type complexity
    const typeComplexity = this.getTypeComplexity(question.type, question.options)
    
    // Category-based difficulty expectations
    const categoryComplexity = this.getCategoryComplexity(question.category)

    // Calculate overall complexity score (0-100)
    const overallComplexity = (contentComplexity + typeComplexity + categoryComplexity) / 3

    // Map complexity to difficulty level
    const expectedDifficulty = this.complexityToDifficulty(overallComplexity)
    
    const isValid = expectedDifficulty === assignedDifficulty || 
                   Math.abs(this.difficultyToScore(expectedDifficulty) - this.difficultyToScore(assignedDifficulty)) <= 1

    if (!isValid) {
      suggestedDifficulty = expectedDifficulty
      reasons.push(`Content analysis suggests ${expectedDifficulty} difficulty (complexity score: ${overallComplexity.toFixed(1)})`)
    }

    // Additional validation rules
    if (question.type === QuestionType.CODING_CHALLENGE && assignedDifficulty === DifficultyLevel.BEGINNER) {
      reasons.push("Coding challenges are typically at least INTERMEDIATE difficulty")
    }

    if (question.type === QuestionType.ESSAY && assignedDifficulty === DifficultyLevel.BEGINNER) {
      const wordLimit = question.options?.wordLimit?.min || 0
      if (wordLimit > 200) {
        reasons.push("Essay questions with high word limits are typically more challenging")
      }
    }

    return {
      isValid: reasons.length === 0,
      suggestedDifficulty,
      reasons
    }
  }

  private static analyzeContentComplexity(content: string): number {
    let score = 0

    // Length factor
    if (content.length > 500) {score += 20}
    else if (content.length > 200) {score += 10}

    // Technical terms (basic heuristic)
    const technicalTerms = [
      'algorithm', 'complexity', 'optimization', 'architecture', 'framework',
      'implementation', 'integration', 'scalability', 'performance', 'security'
    ]
    const technicalCount = technicalTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length
    score += Math.min(technicalCount * 5, 25)

    // Code snippets
    if (content.includes('```') || content.includes('`')) {
      score += 15
    }

    // Mathematical expressions
    if (/\$.*\$|\\\(.*\\\)|\\\[.*\\\]/.test(content)) {
      score += 10
    }

    // Question complexity indicators
    if (content.includes('explain') || content.includes('analyze')) {score += 10}
    if (content.includes('compare') || content.includes('evaluate')) {score += 15}
    if (content.includes('design') || content.includes('implement')) {score += 20}

    return Math.min(score, 100)
  }

  private static getTypeComplexity(type: QuestionType, options: any): number {
    const complexityMap = {
      [QuestionType.TRUE_FALSE]: 10,
      [QuestionType.MULTIPLE_CHOICE]: 20,
      [QuestionType.MULTIPLE_SELECT]: 30,
      [QuestionType.FILL_IN_BLANK]: 40,
      [QuestionType.MATCHING]: 50,
      [QuestionType.DRAG_AND_DROP]: 60,
      [QuestionType.CODING_CHALLENGE]: 80,
      [QuestionType.ESSAY]: 70
    }

    let baseComplexity = complexityMap[type] || 50

    // Adjust based on options
    if (type === QuestionType.MULTIPLE_CHOICE && options?.choices?.length > 6) {
      baseComplexity += 10
    }

    if (type === QuestionType.CODING_CHALLENGE) {
      const testCaseCount = options?.testCases?.length || 0
      if (testCaseCount > 5) {baseComplexity += 10}
      if (options?.timeLimit < 300) {baseComplexity += 10} // Short time limit increases difficulty
    }

    return Math.min(baseComplexity, 100)
  }

  private static getCategoryComplexity(category: string): number {
    const categoryMap: Record<string, number> = {
      'fundamentals': 20,
      'basic concepts': 25,
      'intermediate topics': 50,
      'advanced concepts': 75,
      'expert topics': 90,
      'algorithms': 70,
      'system design': 80,
      'architecture': 85,
      'optimization': 90
    }

    const lowerCategory = category.toLowerCase()
    
    // Find matching category
    for (const [cat, complexity] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(cat)) {
        return complexity
      }
    }

    return 50 // Default complexity
  }

  private static complexityToDifficulty(complexity: number): DifficultyLevel {
    if (complexity < 25) {return DifficultyLevel.BEGINNER}
    if (complexity < 50) {return DifficultyLevel.INTERMEDIATE}
    if (complexity < 75) {return DifficultyLevel.ADVANCED}
    return DifficultyLevel.EXPERT
  }

  private static difficultyToScore(difficulty: DifficultyLevel): number {
    const scoreMap = {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 2,
      [DifficultyLevel.ADVANCED]: 3,
      [DifficultyLevel.EXPERT]: 4
    }
    return scoreMap[difficulty]
  }
}

// Question content validators
export class QuestionContentValidator {
  /**
   * Validate question content for common issues
   */
  static validateContent(question: {
    title: string
    content: string
    type: QuestionType
    options: any
  }): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Title validation
    if (question.title.length < 10) {
      warnings.push("Question title is very short - consider making it more descriptive")
    }

    if (question.title.endsWith('?') && question.type !== QuestionType.TRUE_FALSE) {
      warnings.push("Question title ends with '?' but content should contain the actual question")
    }

    // Content validation
    if (!question.content.includes('?') && 
        ![QuestionType.FILL_IN_BLANK, QuestionType.CODING_CHALLENGE, QuestionType.ESSAY].includes(question.type)) {
      warnings.push("Question content doesn't contain a question mark - ensure it's asking something")
    }

    // Type-specific validation
    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        this.validateMultipleChoice(question.options, errors, warnings)
        break
      case QuestionType.MULTIPLE_SELECT:
        this.validateMultipleSelect(question.options, errors, warnings)
        break
      case QuestionType.CODING_CHALLENGE:
        this.validateCodingChallenge(question.options, errors, warnings)
        break
      case QuestionType.ESSAY:
        this.validateEssay(question.options, errors, warnings)
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static validateMultipleChoice(options: any, errors: string[], warnings: string[]) {
    if (!options?.choices) {
      errors.push("Multiple choice questions must have choices")
      return
    }

    const choices = options.choices
    const correctChoices = choices.filter((c: any) => c.isCorrect)

    if (correctChoices.length !== 1) {
      errors.push("Multiple choice questions must have exactly one correct answer")
    }

    // Check for similar answer choices
    const texts = choices.map((c: any) => c.text.toLowerCase())
    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        if (this.calculateSimilarity(texts[i], texts[j]) > 0.8) {
          warnings.push(`Choices ${i + 1} and ${j + 1} are very similar`)
        }
      }
    }

    // Check choice length consistency
    const lengths = choices.map((c: any) => c.text.length)
    const avgLength = lengths.reduce((a: number, b: number) => a + b, 0) / lengths.length
    const correctChoice = correctChoices[0]
    
    if (correctChoice.text.length > avgLength * 1.5) {
      warnings.push("Correct answer is significantly longer than other choices - this might be a giveaway")
    }
  }

  private static validateMultipleSelect(options: any, errors: string[], warnings: string[]) {
    if (!options?.choices) {
      errors.push("Multiple select questions must have choices")
      return
    }

    const choices = options.choices
    const correctChoices = choices.filter((c: any) => c.isCorrect)

    if (correctChoices.length < 1) {
      errors.push("Multiple select questions must have at least one correct answer")
    }

    if (correctChoices.length === choices.length) {
      warnings.push("All choices are correct - consider if this is intentional")
    }
  }

  private static validateCodingChallenge(options: any, errors: string[], warnings: string[]) {
    if (!options?.testCases || options.testCases.length === 0) {
      errors.push("Coding challenges must have test cases")
      return
    }

    const testCases = options.testCases
    const hiddenCases = testCases.filter((tc: any) => tc.isHidden)
    
    if (hiddenCases.length === 0) {
      warnings.push("Consider adding hidden test cases to prevent hardcoded solutions")
    }

    if (!options.solution) {
      errors.push("Coding challenges must include a solution")
    }

    // Check for edge cases
    const hasEmptyInput = testCases.some((tc: any) => tc.input.trim() === '')
    const hasLargeInput = testCases.some((tc: any) => tc.input.length > 1000)
    
    if (!hasEmptyInput && !hasLargeInput) {
      warnings.push("Consider adding edge cases (empty input, large input)")
    }
  }

  private static validateEssay(options: any, errors: string[], warnings: string[]) {
    if (options?.wordLimit) {
      const { min, max } = options.wordLimit
      if (min && max && min >= max) {
        errors.push("Minimum word limit must be less than maximum")
      }
    }

    if (!options?.rubric && !options?.keyPoints) {
      warnings.push("Essay questions should have either a rubric or key points for grading")
    }

    if (options?.timeLimit && options.timeLimit < 300) {
      warnings.push("Very short time limit for essay question - ensure it's adequate")
    }
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) {return 1.0}
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}