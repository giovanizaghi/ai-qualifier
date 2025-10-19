# Question Management System Documentation

## Overview

The AI Qualifier Question Management System provides comprehensive functionality for creating, organizing, validating, and analyzing questions across different qualification categories and difficulty levels. This system implements Phase 3.2 of the AI Qualifier project.

## Features Implemented

### ✅ 3.2.1 Question Bank Structure
- **Hierarchical Categories**: Questions organized by subject areas (AI Fundamentals, Machine Learning, Neural Networks, etc.)
- **Difficulty Classification**: Four-tier system (Beginner, Intermediate, Advanced, Expert)
- **Question Types Support**: 8 different question types including coding challenges and essays
- **Metadata Management**: Tags, time estimates, points, and version control

### ✅ 3.2.2 Question Categories
- **Dynamic Category Management**: Categories are derived from question content and can be hierarchical
- **Category Analytics**: Track question distribution and performance across categories
- **Flexible Organization**: Support for subcategories and cross-category relationships

### ✅ 3.2.3 Question Difficulty Levels
- **Intelligent Difficulty Classification**: Automatic difficulty assessment based on content analysis
- **Performance-Based Validation**: Difficulty accuracy tracking based on actual user performance
- **Adaptive Recommendations**: System suggests difficulty adjustments based on success rates

### ✅ 3.2.4 Dynamic Question Selection
- **Adaptive Selection**: Questions selected based on user skill level and previous performance
- **Distribution Control**: Precise control over difficulty and category distribution
- **Smart Exclusion**: Avoid repeating questions from previous attempts
- **Performance Optimization**: Prioritize new questions or balance usage across question bank

### ✅ 3.2.5 Question Validation
- **Content Validation**: Comprehensive validation for question structure and content quality
- **Type-Specific Validation**: Specialized validation for each question type (multiple choice, coding, etc.)
- **Difficulty Validation**: Automatic difficulty assessment and mismatch detection
- **Quality Scoring**: Content complexity analysis and improvement suggestions

### ✅ 3.2.6 Question Analytics
- **Performance Tracking**: Success rates, usage statistics, and timing data
- **Quality Metrics**: Discrimination index, difficulty accuracy, and trend analysis
- **Automated Recommendations**: Identify questions needing review or difficulty adjustment
- **Coverage Analysis**: Gap identification in question bank coverage

## System Architecture

### Core Components

#### 1. Question Bank Service (`/src/lib/question-bank.ts`)
Main service class providing:
- Question category management
- Dynamic question selection algorithms
- Analytics calculation and reporting
- Performance tracking updates

#### 2. Question Validation System (`/src/lib/question-validation.ts`)
Comprehensive validation including:
- Enhanced question creation schemas
- Type-specific option validation
- Difficulty assessment algorithms
- Content quality analysis

#### 3. API Endpoints

**Question CRUD Operations:**
- `GET /api/questions` - List questions with filtering and pagination
- `POST /api/questions` - Create new questions
- `GET /api/questions/[id]` - Get specific question
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Delete question

**Question Management:**
- `GET /api/questions/categories/[qualificationId]` - Get question categories
- `POST /api/questions/select` - Dynamic question selection
- `POST /api/questions/validate` - Validate question content and difficulty

**Analytics:**
- `GET /api/questions/analytics/[id]` - Individual question analytics
- `POST /api/questions/analytics/[id]/update` - Update question performance data
- `GET /api/questions/analytics/qualification/[id]` - Comprehensive qualification analytics

### Database Schema

The system uses the existing Prisma schema with the `Question` model:

```prisma
model Question {
  id              String    @id @default(cuid())
  qualificationId String
  title           String
  content         String    @db.Text
  explanation     String?   @db.Text
  type            QuestionType
  category        String
  difficulty      DifficultyLevel
  tags            String[]
  options         Json
  correctAnswers  String[]
  points          Int       @default(1)
  timeEstimate    Int?
  timesUsed       Int       @default(0)
  timesCorrect    Int       @default(0)
  averageTime     Float?
  isActive        Boolean   @default(true)
  // ... relationships and timestamps
}
```

## Question Types Supported

### 1. Multiple Choice
- Single correct answer
- 2-10 options
- Randomizable order
- Answer similarity detection

### 2. Multiple Select
- Multiple correct answers
- Partial credit support
- Configurable selection limits

### 3. True/False
- Simple boolean questions
- Explanation support

### 4. Fill in the Blank
- Multiple blanks support
- Flexible answer matching
- Case sensitivity options

### 5. Coding Challenge
- Multi-language support
- Test case validation
- Hidden test cases
- Execution environment isolation

### 6. Drag and Drop
- Visual question type
- Multiple drop zones
- Item type variations

### 7. Matching
- Left-right column matching
- One-to-many relationships
- Partial credit

### 8. Essay
- Word limit enforcement
- Rubric-based grading
- Key point tracking
- Auto-grading support

## Usage Examples

### Creating Questions

```typescript
import { questionBankService } from '@/lib/question-bank'

// Create a new question with validation
const question = await prisma.question.create({
  data: {
    qualificationId: "qual_123",
    title: "What is Machine Learning?",
    content: "Which statement best describes machine learning?",
    type: "MULTIPLE_CHOICE",
    category: "Machine Learning Fundamentals",
    difficulty: "BEGINNER",
    tags: ["ml", "fundamentals"],
    options: {
      choices: [
        { id: "a", text: "A type of computer", isCorrect: false },
        { id: "b", text: "Learning from data", isCorrect: true }
      ],
      randomizeOrder: true
    },
    correctAnswers: ["b"],
    points: 1,
    timeEstimate: 30
  }
})
```

### Dynamic Question Selection

```typescript
// Select questions for an assessment
const selection = await questionBankService.selectQuestions({
  qualificationId: "qual_123",
  totalQuestions: 25,
  difficultyDistribution: {
    BEGINNER: 0.4,
    INTERMEDIATE: 0.4,
    ADVANCED: 0.2,
    EXPERT: 0.0
  },
  adaptiveSelection: true,
  userLevel: "INTERMEDIATE",
  excludeQuestionIds: ["q1", "q2"] // From previous attempts
})

console.log(`Selected ${selection.questions.length} questions`)
console.log(`Estimated time: ${selection.metadata.estimatedTimeMinutes} minutes`)
```

### Question Analytics

```typescript
// Get detailed analytics for a question
const analytics = await questionBankService.getQuestionAnalytics("question_123")

console.log(`Success rate: ${analytics.statistics.successRate}%`)
console.log(`Difficulty accuracy: ${analytics.statistics.difficultyAccuracy}%`)

if (analytics.recommendations.needsReview) {
  console.log("This question needs review:", analytics.recommendations.reasons)
}
```

### Content Validation

```typescript
import { QuestionContentValidator, QuestionDifficultyValidator } from '@/lib/question-validation'

// Validate question content
const contentValidation = QuestionContentValidator.validateContent({
  title: "Sample Question",
  content: "What is AI?",
  type: "MULTIPLE_CHOICE",
  options: { /* question options */ }
})

// Validate difficulty assignment
const difficultyValidation = QuestionDifficultyValidator.validateDifficulty({
  content: "Complex algorithmic question...",
  type: "CODING_CHALLENGE",
  options: { /* coding challenge options */ },
  category: "Advanced Algorithms"
}, "BEGINNER")

if (!difficultyValidation.isValid) {
  console.log("Suggested difficulty:", difficultyValidation.suggestedDifficulty)
}
```

## Analytics and Reporting

### Question Performance Metrics

1. **Success Rate**: Percentage of correct answers
2. **Usage Statistics**: How often questions are used
3. **Time Analysis**: Average time spent on questions
4. **Difficulty Accuracy**: How well assigned difficulty matches performance
5. **Discrimination Index**: How well questions differentiate skill levels

### Qualification-Level Analytics

- **Coverage Analysis**: Identify gaps in question bank
- **Performance Trends**: Track question effectiveness over time
- **Quality Recommendations**: Automated suggestions for improvement
- **Distribution Reports**: Category and difficulty breakdowns

## Quality Assurance

### Automated Quality Checks

1. **Content Analysis**: Complexity scoring and readability assessment
2. **Answer Validation**: Ensure correct answers are properly formatted
3. **Bias Detection**: Identify potentially problematic content
4. **Performance Monitoring**: Track questions that consistently perform poorly

### Review Workflow

1. **Draft Status**: New questions start in draft mode
2. **Validation**: Automated validation checks
3. **Review**: Manual review by instructors/admins
4. **Approval**: Questions marked as approved for use
5. **Monitoring**: Ongoing performance tracking

## Installation and Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Prisma configured

### Database Setup
The question management system uses the existing database schema. No additional migrations are required.

### Environment Variables
No additional environment variables are needed beyond the existing database configuration.

### Seeding Sample Data

Run the question bank seeding script to populate the database with sample questions:

```bash
npx tsx src/lib/seeds/question-bank-seed.ts
```

This will create diverse sample questions across different categories and difficulty levels.

## API Reference

### Question Selection API

**POST** `/api/questions/select`

Select questions dynamically based on criteria:

```json
{
  "qualificationId": "string",
  "totalQuestions": 25,
  "difficultyDistribution": {
    "BEGINNER": 0.3,
    "INTERMEDIATE": 0.4,
    "ADVANCED": 0.25,
    "EXPERT": 0.05
  },
  "adaptiveSelection": true,
  "userLevel": "INTERMEDIATE",
  "excludeQuestionIds": ["id1", "id2"]
}
```

### Question Analytics API

**GET** `/api/questions/analytics/[id]`

Get comprehensive analytics for a specific question.

**GET** `/api/questions/analytics/qualification/[id]`

Get qualification-level analytics including:
- Overview statistics
- Performance analysis
- Quality recommendations
- Coverage gaps

### Question Validation API

**POST** `/api/questions/validate`

Validate question content and difficulty before creation/update.

## Best Practices

### Question Creation

1. **Clear Objectives**: Each question should test specific learning objectives
2. **Appropriate Difficulty**: Match difficulty to target skill level
3. **Quality Options**: Ensure distractors are plausible but clearly incorrect
4. **Comprehensive Explanations**: Provide detailed explanations for learning

### Category Organization

1. **Logical Hierarchy**: Organize categories in a logical, learnable sequence
2. **Balanced Distribution**: Ensure adequate coverage across all important topics
3. **Clear Naming**: Use descriptive, consistent category names

### Performance Monitoring

1. **Regular Reviews**: Monitor question performance metrics regularly
2. **Update Content**: Refresh questions that show poor discrimination
3. **Gap Analysis**: Identify and fill gaps in question coverage
4. **User Feedback**: Incorporate feedback from users and instructors

## Troubleshooting

### Common Issues

1. **Low Success Rates**: Questions may be too difficult or poorly written
2. **Poor Discrimination**: Questions may not effectively differentiate skill levels
3. **Category Imbalances**: Some categories may be over/under-represented
4. **Performance Degradation**: Question quality may decline over time

### Solutions

1. **Content Review**: Regular review and updating of question content
2. **Difficulty Adjustment**: Use analytics to adjust question difficulty levels
3. **Gap Filling**: Create new questions to address coverage gaps
4. **Quality Monitoring**: Implement automated quality monitoring alerts

## Future Enhancements

### Planned Improvements

1. **AI-Powered Question Generation**: Automatic question creation using LLMs
2. **Advanced Analytics**: Machine learning-based performance prediction
3. **Collaborative Filtering**: Question recommendations based on user behavior
4. **A/B Testing**: Compare different question versions for effectiveness
5. **Multi-language Support**: Questions in multiple languages
6. **Accessibility Features**: Enhanced support for users with disabilities

### Integration Opportunities

1. **Learning Management Systems**: Integration with external LMS platforms
2. **Content Libraries**: Import/export to standard question formats (QTI)
3. **Assessment Engines**: Integration with third-party assessment platforms
4. **Analytics Platforms**: Export data to business intelligence tools

---

## Implementation Status

✅ **Completed Features:**
- Question bank structure design
- Category management system
- Difficulty level classification
- Dynamic question selection algorithms
- Comprehensive validation system
- Analytics and performance tracking
- Quality assurance workflows
- API endpoints and documentation

🎯 **Phase 3.2 Status: COMPLETE**

All requirements from Phase 3.2 (Question Management System) have been successfully implemented, including the question bank structure, categories, difficulty levels, dynamic selection, validation, and analytics.

The system is now ready for integration with the assessment interface (Phase 3.3) and provides a solid foundation for the AI Qualifier's question management capabilities.