import { render, type RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { expect } from 'vitest'

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations)

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Common test utilities
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  emailVerified: null,
}

export const mockAssessment = {
  id: 'test-assessment-id',
  title: 'Test Assessment',
  description: 'A test assessment',
  category: 'AI_FUNDAMENTALS',
  difficulty: 'BEGINNER',
  timeLimit: 3600,
  passingScore: 70,
  isActive: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
}

export const mockQuestion = {
  id: 'test-question-id',
  question: 'What is artificial intelligence?',
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 0,
  explanation: 'AI is...',
  difficulty: 'BEGINNER',
  category: 'AI_FUNDAMENTALS',
  tags: ['basic', 'definition'],
  points: 1,
  timeLimit: 60,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
}

// Utility function to create mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

// Utility to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Accessibility testing utility
export const testA11y = async (component: ReactElement, options?: any) => {
  const { container } = render(component)
  const results = await axe(container, options)
  expect(results).toHaveNoViolations()
  return results
}