import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const apiErrorRate = new Rate('api_errors')
const apiResponseTime = new Trend('api_response_time')

// Spike test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Normal load
    { duration: '30s', target: 200 }, // Spike to 200 users
    { duration: '1m', target: 200 },  // Stay at spike level
    { duration: '30s', target: 10 },  // Return to normal
    { duration: '1m', target: 10 },   // Stay at normal level
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% of requests should be below 2s
    http_req_failed: ['rate<0.2'],     // Error rate should be below 20%
    api_errors: ['rate<0.2'],          // API error rate should be below 20%
  },
}

const BASE_URL = 'http://localhost:3000'

// Test scenarios for API endpoints under spike load
export default function () {
  const scenarios = [
    testQuestionsAPI,
    testQualificationsAPI,
    testAssessmentAPI,
    testUserAPI,
  ]

  // Randomly select a scenario to simulate real user behavior
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  scenario()

  sleep(Math.random() * 2 + 1) // Random sleep between 1-3 seconds
}

function testQuestionsAPI() {
  // Test questions listing
  let response = http.get(`${BASE_URL}/api/questions?page=1&limit=20`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const listingCheck = check(response, {
    'questions listing status 200': (r) => r.status === 200,
    'questions listing response time OK': (r) => r.timings.duration < 1000,
  })

  apiErrorRate.add(!listingCheck)
  apiResponseTime.add(response.timings.duration)

  if (response.status === 200) {
    // Test individual question fetch
    response = http.get(`${BASE_URL}/api/questions/test-question-id`, {
      headers: { 'Content-Type': 'application/json' },
    })

    const detailCheck = check(response, {
      'question detail status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'question detail response time OK': (r) => r.timings.duration < 500,
    })

    apiErrorRate.add(!detailCheck)
    apiResponseTime.add(response.timings.duration)
  }
}

function testQualificationsAPI() {
  // Test qualifications listing
  let response = http.get(`${BASE_URL}/api/qualifications?page=1&limit=10`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const check1 = check(response, {
    'qualifications listing status 200': (r) => r.status === 200,
    'qualifications listing response time OK': (r) => r.timings.duration < 1000,
  })

  apiErrorRate.add(!check1)
  apiResponseTime.add(response.timings.duration)

  // Test qualification categories
  response = http.get(`${BASE_URL}/api/qualifications/categories`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const check2 = check(response, {
    'qualification categories status 200': (r) => r.status === 200,
    'qualification categories response time OK': (r) => r.timings.duration < 500,
  })

  apiErrorRate.add(!check2)
  apiResponseTime.add(response.timings.duration)
}

function testAssessmentAPI() {
  // Test assessment endpoints (these might require authentication)
  let response = http.get(`${BASE_URL}/api/assessments`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const check1 = check(response, {
    'assessments status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'assessments response time OK': (r) => r.timings.duration < 1000,
  })

  apiErrorRate.add(response.status >= 500) // Only count server errors
  apiResponseTime.add(response.timings.duration)

  // Test assessment results
  response = http.get(`${BASE_URL}/api/assessment-results`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const check2 = check(response, {
    'assessment results status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'assessment results response time OK': (r) => r.timings.duration < 1000,
  })

  apiErrorRate.add(response.status >= 500)
  apiResponseTime.add(response.timings.duration)
}

function testUserAPI() {
  // Test user-related endpoints
  let response = http.get(`${BASE_URL}/api/auth/session`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const check1 = check(response, {
    'auth session status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'auth session response time OK': (r) => r.timings.duration < 500,
  })

  apiErrorRate.add(response.status >= 500)
  apiResponseTime.add(response.timings.duration)

  // Test user profile endpoint
  response = http.get(`${BASE_URL}/api/user/profile`, {
    headers: { 'Content-Type': 'application/json' },
  })

  const check2 = check(response, {
    'user profile status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'user profile response time OK': (r) => r.timings.duration < 500,
  })

  apiErrorRate.add(response.status >= 500)
  apiResponseTime.add(response.timings.duration)
}

export function setup() {
  console.log('Starting API spike test...')
  
  // Test server availability
  const healthResponse = http.get(`${BASE_URL}/`)
  if (healthResponse.status !== 200) {
    throw new Error(`Server not available. Status: ${healthResponse.status}`)
  }
  
  return { startTime: new Date().toISOString() }
}

export function teardown(data) {
  console.log(`API spike test completed. Started at: ${data.startTime}`)
}