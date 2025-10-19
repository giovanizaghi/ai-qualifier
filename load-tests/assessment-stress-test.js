import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const assessmentErrors = new Rate('assessment_errors')
const assessmentDuration = new Trend('assessment_duration')
const questionsAnswered = new Counter('questions_answered')

// Stress test configuration - sustained high load
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 300 },  // Ramp up to 300 users
    { duration: '5m', target: 300 },  // Stay at 300 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],   // 95% of requests should be below 3s
    http_req_failed: ['rate<0.3'],       // Error rate should be below 30%
    assessment_errors: ['rate<0.2'],     // Assessment error rate should be below 20%
  },
}

const BASE_URL = 'http://localhost:3000'

// Simulate realistic user assessment flow
export default function () {
  const userId = `user_${__VU}_${__ITER}`
  
  // Start assessment session
  const assessmentId = startAssessment(userId)
  
  if (assessmentId) {
    // Answer multiple questions
    const questionsCount = Math.floor(Math.random() * 10) + 5 // 5-15 questions
    
    for (let i = 0; i < questionsCount; i++) {
      const success = answerQuestion(assessmentId, i)
      if (success) {
        questionsAnswered.add(1)
      }
      
      // Simulate user thinking time
      sleep(Math.random() * 5 + 2) // 2-7 seconds per question
    }
    
    // Submit assessment
    submitAssessment(assessmentId)
  }
  
  sleep(Math.random() * 3 + 1) // Pause between assessment sessions
}

function startAssessment(userId) {
  const startTime = new Date()
  
  // Get available qualifications
  let response = http.get(`${BASE_URL}/api/qualifications?limit=5`, {
    headers: { 'Content-Type': 'application/json' },
  })
  
  if (!check(response, { 'qualifications loaded': (r) => r.status === 200 })) {
    assessmentErrors.add(1)
    return null
  }
  
  // Start assessment (this would typically require authentication)
  const assessmentData = {
    qualificationId: 'test-qualification-id',
    userId,
  }
  
  response = http.post(`${BASE_URL}/api/assessments`, JSON.stringify(assessmentData), {
    headers: { 'Content-Type': 'application/json' },
  })
  
  const assessmentStarted = check(response, {
    'assessment started': (r) => r.status === 201 || r.status === 401, // 401 expected for unauthenticated
  })
  
  if (!assessmentStarted) {
    assessmentErrors.add(1)
    return null
  }
  
  // For demo purposes, return a mock assessment ID
  return `assessment_${userId}_${Date.now()}`
}

function answerQuestion(assessmentId, questionIndex) {
  // Get question
  let response = http.get(`${BASE_URL}/api/questions/${questionIndex}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  
  if (!check(response, { 'question loaded': (r) => r.status === 200 || r.status === 404 })) {
    assessmentErrors.add(1)
    return false
  }
  
  // Submit answer
  const answerData = {
    assessmentId,
    questionId: `question_${questionIndex}`,
    answer: Math.floor(Math.random() * 4), // Random answer 0-3
    timeSpent: Math.floor(Math.random() * 60) + 30, // 30-90 seconds
  }
  
  response = http.post(`${BASE_URL}/api/assessments/${assessmentId}/answers`, 
    JSON.stringify(answerData), {
    headers: { 'Content-Type': 'application/json' },
  })
  
  const answerSubmitted = check(response, {
    'answer submitted': (r) => r.status === 200 || r.status === 401,
  })
  
  if (!answerSubmitted) {
    assessmentErrors.add(1)
    return false
  }
  
  return true
}

function submitAssessment(assessmentId) {
  const response = http.post(`${BASE_URL}/api/assessments/${assessmentId}/submit`, 
    JSON.stringify({}), {
    headers: { 'Content-Type': 'application/json' },
  })
  
  const submitted = check(response, {
    'assessment submitted': (r) => r.status === 200 || r.status === 401,
  })
  
  if (!submitted) {
    assessmentErrors.add(1)
    return false
  }
  
  // Get results
  const resultsResponse = http.get(`${BASE_URL}/api/assessment-results/${assessmentId}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  
  check(resultsResponse, {
    'results retrieved': (r) => r.status === 200 || r.status === 401,
  })
  
  return true
}

export function setup() {
  console.log('Starting assessment stress test...')
  
  // Verify server is responsive
  const response = http.get(`${BASE_URL}/`)
  if (response.status !== 200) {
    throw new Error(`Server not responsive. Status: ${response.status}`)
  }
  
  console.log('Server is ready for stress testing')
  return { startTime: new Date().toISOString() }
}

export function teardown(data) {
  console.log(`Assessment stress test completed. Started at: ${data.startTime}`)
  console.log(`Total questions answered: ${questionsAnswered.count}`)
}