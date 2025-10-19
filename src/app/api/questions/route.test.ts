import { describe, it, expect, beforeAll, vi } from 'vitest'
import { GET, POST } from '@/app/api/questions/route'
import { setupTestDatabase, testDataFactory } from '@/test/database'
import { createMockRequest, extractResponseData, createMockAdminSession } from '@/test/api-helpers'

// Mock the auth functions
vi.mock('@/lib/api/middleware', () => ({
  protectApiRoute: vi.fn().mockResolvedValue({ success: true }),
  rateLimitConfigs: {
    api: { requests: 100, windowMs: 60000 },
    default: { requests: 50, windowMs: 60000 }
  }
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    question: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn()
    },
    qualification: {
      findUnique: vi.fn()
    }
  }
}))

const { prisma } = vi.hoisted(() => ({
  prisma: {
    question: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn()
    },
    qualification: {
      findUnique: vi.fn()
    }
  }
}))

describe('/api/questions Integration Tests', () => {
  beforeAll(() => {
    // Setup mocks for database operations
    vi.mocked(prisma.question.findMany).mockResolvedValue([
      testDataFactory.question()
    ])
    vi.mocked(prisma.question.count).mockResolvedValue(1)
  })

  describe('GET /api/questions', () => {
    it('should return paginated questions list', async () => {
      const request = createMockRequest('GET', '/api/questions', {
        query: { page: '1', limit: '10' }
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expect(result.data.success).toBe(true)
      expect(result.data.data).toHaveLength(1)
      expect(result.data.pagination).toBeDefined()
    })

    it('should filter questions by category', async () => {
      const request = createMockRequest('GET', '/api/questions', {
        query: { category: 'AI_FUNDAMENTALS' }
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expect(result.data.success).toBe(true)
      
      // Verify that findMany was called with category filter
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { contains: 'AI_FUNDAMENTALS', mode: 'insensitive' }
          })
        })
      )
    })

    it('should search questions by content', async () => {
      const request = createMockRequest('GET', '/api/questions', {
        query: { search: 'artificial intelligence' }
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expect(result.data.success).toBe(true)
      
      // Verify that findMany was called with search filter
      expect(prisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'artificial intelligence', mode: 'insensitive' } },
              { content: { contains: 'artificial intelligence', mode: 'insensitive' } },
              { tags: { has: 'artificial intelligence' } }
            ])
          })
        })
      )
    })
  })

  describe('POST /api/questions', () => {
    beforeAll(() => {
      // Mock successful qualification lookup
      vi.mocked(prisma.qualification.findUnique).mockResolvedValue(
        testDataFactory.qualification()
      )
      
      // Mock successful question creation
      vi.mocked(prisma.question.create).mockResolvedValue(
        testDataFactory.question()
      )
    })

    it('should create a new question with valid data', async () => {
      const questionData = {
        qualificationId: 'test-qual-id',
        title: 'Test Question',
        content: 'What is AI?',
        explanation: 'AI explanation...',
        type: 'MULTIPLE_CHOICE',
        category: 'AI_FUNDAMENTALS',
        difficulty: 'BEGINNER',
        tags: ['test'],
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswers: [0],
        points: 1,
        timeEstimate: 60
      }

      const request = createMockRequest('POST', '/api/questions', {
        body: questionData
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(201)
      expect(result.data.success).toBe(true)
      expect(result.data.message).toBe('Question created successfully')
      expect(result.data.data).toBeDefined()
    })

    it('should return 400 when qualification does not exist', async () => {
      // Mock qualification not found
      vi.mocked(prisma.qualification.findUnique).mockResolvedValueOnce(null)

      const questionData = testDataFactory.question({
        qualificationId: 'non-existent-id'
      })

      const request = createMockRequest('POST', '/api/questions', {
        body: questionData
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(400)
      expect(result.data.success).toBe(false)
      expect(result.data.error).toBe('Qualification not found')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        title: 'Test Question'
      }

      const request = createMockRequest('POST', '/api/questions', {
        body: invalidData
      })

      // This should throw a validation error
      await expect(POST(request)).rejects.toThrow()
    })
  })
})