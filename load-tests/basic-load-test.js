import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 50 },  // Ramp up to 50 users over 30 seconds
    { duration: '2m', target: 50 },   // Stay at 50 users for 2 minutes
    { duration: '30s', target: 100 }, // Ramp up to 100 users over 30 seconds
    { duration: '2m', target: 100 },  // Stay at 100 users for 2 minutes
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    errors: ['rate<0.1'],             // Custom error rate should be below 10%
  },
}

const BASE_URL = 'http://localhost:3000'

// API endpoints to test
const endpoints = {
  homepage: `${BASE_URL}/`,
  questions: `${BASE_URL}/api/questions`,
  qualifications: `${BASE_URL}/api/qualifications`,
  healthcheck: `${BASE_URL}/api/health`, // Assuming you have a health check endpoint
}

export default function () {
  // Test homepage
  let response = http.get(endpoints.homepage, {
    headers: {
      'User-Agent': 'k6-load-test',
    },
  })

  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 1s': (r) => r.timings.duration < 1000,
  })

  errorRate.add(response.status !== 200)
  responseTime.add(response.timings.duration)

  sleep(1)

  // Test questions API
  response = http.get(`${endpoints.questions}?page=1&limit=10`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test',
    },
  })

  check(response, {
    'questions API status is 200': (r) => r.status === 200,
    'questions API response time < 500ms': (r) => r.timings.duration < 500,
    'questions API returns data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success === true && Array.isArray(data.data)
      } catch {
        return false
      }
    },
  })

  errorRate.add(response.status !== 200)
  responseTime.add(response.timings.duration)

  sleep(1)

  // Test qualifications API
  response = http.get(`${endpoints.qualifications}?page=1&limit=5`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test',
    },
  })

  check(response, {
    'qualifications API status is 200': (r) => r.status === 200,
    'qualifications API response time < 500ms': (r) => r.timings.duration < 500,
  })

  errorRate.add(response.status !== 200)
  responseTime.add(response.timings.duration)

  sleep(2)
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting load test...')
  
  // Warmup request to ensure the server is ready
  const warmupResponse = http.get(endpoints.homepage)
  console.log(`Warmup response status: ${warmupResponse.status}`)
  
  return { startTime: new Date().toISOString() }
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`)
}