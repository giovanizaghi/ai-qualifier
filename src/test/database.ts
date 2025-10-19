import { PrismaClient } from '@prisma/client'
import { beforeAll, afterAll, beforeEach } from 'vitest'

// Test database instance
let prisma: PrismaClient

// Setup test database connection
export function setupTestDatabase() {
  beforeAll(async () => {
    // Initialize test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_ai_qualifier'
        }
      }
    })
    
    await prisma.$connect()
  })

  beforeEach(async () => {
    // Clean up database before each test
    await cleanDatabase()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  return { prisma }
}

// Clean database function
async function cleanDatabase() {
  if (!prisma) return

  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  const tables = tablenames
    .map(({ tablename }: { tablename: string }) => tablename)
    .filter((name: string) => name !== '_prisma_migrations')
    .map((name: string) => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
}

// Test data factories
export const testDataFactory = {
  user: (overrides: any = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    emailVerified: new Date(),
    image: null,
    ...overrides
  }),

  qualification: (overrides: any = {}) => ({
    id: 'test-qual-id',
    title: 'Test Qualification',
    slug: 'test-qualification',
    description: 'A test qualification',
    category: 'AI_FUNDAMENTALS',
    difficulty: 'BEGINNER',
    estimatedTime: 3600,
    passingScore: 70,
    isActive: true,
    ...overrides
  }),

  question: (overrides: any = {}) => ({
    id: 'test-question-id',
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
    timeEstimate: 60,
    isActive: true,
    ...overrides
  }),

  assessment: (overrides: any = {}) => ({
    id: 'test-assessment-id',
    userId: 'test-user-id',
    qualificationId: 'test-qual-id',
    status: 'IN_PROGRESS',
    startedAt: new Date(),
    ...overrides
  })
}

export { prisma as testPrisma }