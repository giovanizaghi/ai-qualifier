# API Documentation

## Overview

This document provides comprehensive documentation for the AI Qualifier API endpoints. All endpoints follow RESTful conventions and include proper error handling, security measures, and performance optimizations.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT-based authentication with NextAuth.js. Include the session token in requests:

```bash
Authorization: Bearer <session-token>
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes
- **Standard API endpoints**: 60 requests per minute
- **Upload endpoints**: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Authentication

#### POST /api/auth/signin

Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "session": {
    "token": "jwt_token_here",
    "expires": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "John Doe",
  "confirmPassword": "securePassword123!"
}
```

**Validation Rules:**
- Email must be valid format
- Password must be at least 8 characters with uppercase, lowercase, number, and special character
- Name must be 2-50 characters

### Assessments

#### GET /api/assessments

Retrieve user's assessments with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by status (`active`, `completed`, `expired`)
- `qualificationId` (optional): Filter by qualification

**Response:**
```json
{
  "assessments": [
    {
      "id": "assessment_123",
      "title": "JavaScript Fundamentals",
      "status": "active",
      "progress": 0.6,
      "startedAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-01-02T00:00:00Z",
      "qualification": {
        "id": "qual_123",
        "title": "Frontend Developer",
        "level": "INTERMEDIATE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/assessments

Start a new assessment.

**Request Body:**
```json
{
  "qualificationId": "qual_123",
  "timeLimit": 3600,
  "settings": {
    "shuffleQuestions": true,
    "allowReview": false
  }
}
```

**Response:**
```json
{
  "assessment": {
    "id": "assessment_123",
    "qualificationId": "qual_123",
    "status": "active",
    "timeLimit": 3600,
    "startedAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-01-01T01:00:00Z"
  }
}
```

#### GET /api/assessments/[id]

Get assessment details and current state.

**Response:**
```json
{
  "assessment": {
    "id": "assessment_123",
    "title": "JavaScript Fundamentals",
    "status": "active",
    "progress": 0.4,
    "currentQuestionIndex": 4,
    "totalQuestions": 10,
    "timeRemaining": 1800,
    "questions": [
      {
        "id": "question_123",
        "type": "MULTIPLE_CHOICE",
        "title": "What is a closure in JavaScript?",
        "content": "A closure is...",
        "choices": [
          {
            "id": "choice_1",
            "text": "A function inside another function",
            "isCorrect": false
          }
        ],
        "points": 10,
        "difficulty": "INTERMEDIATE"
      }
    ]
  }
}
```

#### POST /api/assessments/[id]/submit-answer

Submit an answer for a question.

**Request Body:**
```json
{
  "questionId": "question_123",
  "answer": {
    "selectedChoices": ["choice_1", "choice_3"],
    "textAnswer": "Optional text response",
    "timeSpent": 45
  }
}
```

**Response:**
```json
{
  "result": {
    "questionId": "question_123",
    "isCorrect": true,
    "pointsEarned": 10,
    "explanation": "Correct! A closure is...",
    "nextQuestionId": "question_124"
  },
  "assessment": {
    "progress": 0.5,
    "currentScore": 45,
    "timeRemaining": 1755
  }
}
```

#### POST /api/assessments/[id]/complete

Complete and submit the assessment.

**Response:**
```json
{
  "result": {
    "assessmentId": "assessment_123",
    "status": "completed",
    "finalScore": 85,
    "totalPoints": 100,
    "percentage": 85,
    "passed": true,
    "completedAt": "2024-01-01T00:45:00Z",
    "timeTaken": 2700,
    "breakdown": {
      "correct": 17,
      "incorrect": 3,
      "skipped": 0
    },
    "certificateId": "cert_123"
  }
}
```

### Questions

#### GET /api/questions

Get questions for qualification (admin/instructor only).

**Query Parameters:**
- `qualificationId`: Qualification ID
- `difficulty` (optional): Filter by difficulty
- `type` (optional): Filter by question type
- `page`, `limit`: Pagination

**Response:**
```json
{
  "questions": [
    {
      "id": "question_123",
      "title": "JavaScript Closure Concept",
      "type": "MULTIPLE_CHOICE",
      "difficulty": "INTERMEDIATE",
      "points": 10,
      "category": "fundamentals",
      "tags": ["javascript", "closures"],
      "usage": 45,
      "successRate": 0.72,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/questions

Create a new question (admin/instructor only).

**Request Body:**
```json
{
  "title": "What is a JavaScript closure?",
  "content": "Detailed question content...",
  "type": "MULTIPLE_CHOICE",
  "difficulty": "INTERMEDIATE",
  "points": 10,
  "category": "fundamentals",
  "tags": ["javascript", "closures"],
  "choices": [
    {
      "text": "A function inside another function",
      "isCorrect": false,
      "explanation": "This is only partially correct..."
    }
  ],
  "explanation": "A closure is...",
  "timeLimit": 120
}
```

#### GET /api/questions/analytics/qualification/[id]

Get question analytics for a qualification.

**Response:**
```json
{
  "analytics": {
    "totalQuestions": 50,
    "averageSuccessRate": 0.68,
    "averageUsage": 23,
    "difficultyDistribution": {
      "BEGINNER": 15,
      "INTERMEDIATE": 25,
      "ADVANCED": 8,
      "EXPERT": 2
    },
    "topPerformingQuestions": [
      {
        "id": "question_123",
        "title": "Basic JavaScript Variables",
        "successRate": 0.95,
        "usage": 67
      }
    ],
    "poorPerformingQuestions": [
      {
        "id": "question_456",
        "title": "Advanced Async Patterns",
        "successRate": 0.32,
        "usage": 45,
        "issues": ["Success rate too low", "Question may be too difficult"]
      }
    ]
  }
}
```

### Qualifications

#### GET /api/qualifications

Get available qualifications.

**Query Parameters:**
- `level` (optional): Filter by level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`)
- `category` (optional): Filter by category
- `search` (optional): Search by title or description

**Response:**
```json
{
  "qualifications": [
    {
      "id": "qual_123",
      "title": "Frontend Developer",
      "description": "Comprehensive frontend development skills assessment",
      "level": "INTERMEDIATE",
      "category": "web-development",
      "estimatedDuration": 3600,
      "questionCount": 25,
      "passThreshold": 70,
      "tags": ["javascript", "react", "css", "html"],
      "prerequisites": ["qual_456"],
      "isActive": true
    }
  ]
}
```

#### GET /api/qualifications/[id]

Get detailed qualification information.

**Response:**
```json
{
  "qualification": {
    "id": "qual_123",
    "title": "Frontend Developer",
    "description": "Detailed description...",
    "level": "INTERMEDIATE",
    "category": "web-development",
    "syllabus": [
      {
        "topic": "JavaScript Fundamentals",
        "weight": 30,
        "subtopics": ["Variables", "Functions", "Closures"]
      }
    ],
    "requirements": {
      "passingScore": 70,
      "timeLimit": 3600,
      "maxAttempts": 3
    },
    "statistics": {
      "totalAttempts": 1247,
      "averageScore": 73.5,
      "passRate": 0.68
    }
  }
}
```

### User Analytics

#### GET /api/analytics/user

Get user performance analytics.

**Response:**
```json
{
  "analytics": {
    "overview": {
      "totalAssessments": 15,
      "completedAssessments": 12,
      "averageScore": 78.5,
      "totalStudyTime": 14400,
      "currentStreak": 5
    },
    "performanceByCategory": [
      {
        "category": "javascript",
        "averageScore": 82,
        "assessments": 8,
        "trend": "improving"
      }
    ],
    "recentActivity": [
      {
        "type": "assessment_completed",
        "qualificationTitle": "React Developer",
        "score": 85,
        "date": "2024-01-01T00:00:00Z"
      }
    ],
    "recommendations": [
      {
        "type": "qualification",
        "qualificationId": "qual_789",
        "title": "Advanced React Patterns",
        "reason": "Based on your React performance"
      }
    ]
  }
}
```

### Admin Analytics

#### GET /api/analytics/admin

Get system-wide analytics (admin only).

**Response:**
```json
{
  "analytics": {
    "overview": {
      "totalUsers": 2547,
      "activeUsers": 1823,
      "totalAssessments": 15742,
      "completionRate": 0.73
    },
    "userGrowth": [
      {
        "period": "2024-01",
        "newUsers": 245,
        "activeUsers": 1823
      }
    ],
    "popularQualifications": [
      {
        "qualificationId": "qual_123",
        "title": "Frontend Developer",
        "attempts": 3456,
        "completionRate": 0.68
      }
    ],
    "systemHealth": {
      "apiResponseTime": 125,
      "errorRate": 0.002,
      "uptime": 0.9998
    }
  }
}
```

## WebSocket Events

For real-time features like live assessments and notifications:

### Connection

```javascript
const socket = io('/api/socket', {
  auth: {
    token: sessionToken
  }
});
```

### Assessment Events

- `assessment:started` - Assessment began
- `assessment:question_answered` - Question answered
- `assessment:completed` - Assessment finished
- `assessment:time_warning` - Time running low

### Notification Events

- `notification:new` - New notification received
- `notification:read` - Notification marked as read

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
import { ApiClient } from '@/lib/api-client';

const api = new ApiClient({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key'
});

// Start an assessment
const assessment = await api.assessments.create({
  qualificationId: 'qual_123'
});

// Submit an answer
const result = await api.assessments.submitAnswer(assessment.id, {
  questionId: 'question_123',
  answer: { selectedChoices: ['choice_1'] }
});
```

### cURL Examples

```bash
# Sign in
curl -X POST https://api.example.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get assessments
curl -X GET https://api.example.com/api/assessments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Start assessment
curl -X POST https://api.example.com/api/assessments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qualificationId":"qual_123"}'
```

## Error Codes

### Authentication Errors
- `AUTH_INVALID_CREDENTIALS` - Invalid email or password
- `AUTH_ACCOUNT_LOCKED` - Account temporarily locked
- `AUTH_TOKEN_EXPIRED` - Session token expired

### Assessment Errors
- `ASSESSMENT_NOT_FOUND` - Assessment doesn't exist
- `ASSESSMENT_EXPIRED` - Assessment time expired
- `ASSESSMENT_ALREADY_COMPLETED` - Assessment already finished
- `QUESTION_NOT_FOUND` - Question doesn't exist

### Validation Errors
- `VALIDATION_FAILED` - Input validation failed
- `INVALID_QUESTION_TYPE` - Unsupported question type
- `INVALID_DIFFICULTY_LEVEL` - Invalid difficulty specified

## Security Considerations

1. **Rate Limiting**: All endpoints are rate-limited
2. **Input Validation**: All inputs are validated and sanitized
3. **CSRF Protection**: CSRF tokens required for state-changing operations
4. **SQL Injection Prevention**: Parameterized queries used throughout
5. **XSS Prevention**: Output encoding implemented
6. **Security Headers**: Comprehensive security headers added

## Performance Guidelines

1. **Pagination**: Use pagination for large datasets
2. **Caching**: Responses are cached appropriately
3. **Compression**: All responses are compressed
4. **CDN**: Static assets served via CDN

## Testing

The API includes comprehensive test coverage:

- **Unit Tests**: Individual endpoint testing
- **Integration Tests**: End-to-end API flows
- **Load Tests**: Performance under load
- **Security Tests**: Vulnerability testing

## Support

For API support:
- Documentation: `/docs`
- Status Page: `/status`
- Support Email: api-support@example.com