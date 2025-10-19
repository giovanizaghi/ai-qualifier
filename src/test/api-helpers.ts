import { NextRequest } from 'next/server'
import { createMocks } from 'node-mocks-http'
import { expect } from 'vitest'

// Mock NextRequest for testing API routes
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: any
    headers?: Record<string, string>
    query?: Record<string, string>
  } = {}
): NextRequest {
  const { body, headers = {}, query = {} } = options
  
  // Build URL with query parameters
  const urlWithQuery = new URL(url, 'http://localhost:3000')
  Object.entries(query).forEach(([key, value]) => {
    urlWithQuery.searchParams.set(key, value)
  })

  const request = new NextRequest(urlWithQuery.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })

  return request
}

// Extract response data from Next.js Response
export async function extractResponseData(response: Response | any) {
  if (!response) {
    throw new Error('Response is undefined')
  }
  
  const data = await response.json()
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    data
  }
}

// Mock authentication session
export function createMockSession(overrides: any = {}) {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      ...overrides.user
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  }
}

// Mock admin session
export function createMockAdminSession(overrides: any = {}) {
  return createMockSession({
    user: {
      role: 'ADMIN',
      ...overrides.user
    },
    ...overrides
  })
}

// API test helper
export class ApiTestHelper {
  private baseUrl = 'http://localhost:3000'

  async get(
    endpoint: string,
    options: {
      query?: Record<string, string>
      headers?: Record<string, string>
    } = {}
  ) {
    const request = createMockRequest('GET', `${this.baseUrl}${endpoint}`, options)
    return request
  }

  async post(
    endpoint: string,
    data: any,
    options: {
      headers?: Record<string, string>
    } = {}
  ) {
    const request = createMockRequest('POST', `${this.baseUrl}${endpoint}`, {
      body: data,
      ...options
    })
    return request
  }

  async put(
    endpoint: string,
    data: any,
    options: {
      headers?: Record<string, string>
    } = {}
  ) {
    const request = createMockRequest('PUT', `${this.baseUrl}${endpoint}`, {
      body: data,
      ...options
    })
    return request
  }

  async delete(
    endpoint: string,
    options: {
      headers?: Record<string, string>
    } = {}
  ) {
    const request = createMockRequest('DELETE', `${this.baseUrl}${endpoint}`, options)
    return request
  }
}

// Common test assertions
export const apiAssertions = {
  expectSuccessResponse: (response: any) => {
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
  },

  expectCreatedResponse: (response: any) => {
    expect(response.status).toBe(201)
    expect(response.data.success).toBe(true)
  },

  expectErrorResponse: (response: any, status: number, message?: string) => {
    expect(response.status).toBe(status)
    expect(response.data.success).toBe(false)
    if (message) {
      expect(response.data.error).toContain(message)
    }
  },

  expectUnauthorizedResponse: (response: any) => {
    expect(response.status).toBe(401)
    expect(response.data.success).toBe(false)
  },

  expectForbiddenResponse: (response: any) => {
    expect(response.status).toBe(403)
    expect(response.data.success).toBe(false)
  },

  expectNotFoundResponse: (response: any) => {
    expect(response.status).toBe(404)
    expect(response.data.success).toBe(false)
  },

  expectValidationError: (response: any) => {
    expect(response.status).toBe(400)
    expect(response.data.success).toBe(false)
    expect(response.data.error).toBeDefined()
  }
}