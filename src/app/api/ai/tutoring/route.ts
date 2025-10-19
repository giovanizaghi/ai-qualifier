import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

// Validation schemas
const generateHintSchema = z.object({
  question: z.string().min(1),
  userContext: z.object({
    previousAttempts: z.array(z.string()).optional(),
    timeSpent: z.number().min(0),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    knownWeaknesses: z.array(z.string()).optional(),
    learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional()
  }),
  hintLevel: z.enum(['subtle', 'moderate', 'explicit']).default('moderate')
});

const generateExplanationSchema = z.object({
  question: z.string().min(1),
  correctAnswer: z.string().min(1),
  userAnswer: z.string().min(1),
  isCorrect: z.boolean(),
  context: z.object({
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    topics: z.array(z.string()),
    learningObjectives: z.array(z.string()).optional(),
    commonMisconceptions: z.array(z.string()).optional()
  })
});

const learningGuidanceSchema = z.object({
  userStrengths: z.array(z.string()),
  userWeaknesses: z.array(z.string()),
  currentTopic: z.string().min(1),
  learningGoals: z.array(z.string()),
  availableStudyTime: z.number().min(1).max(40) // hours per week
});

const workThroughExampleSchema = z.object({
  concept: z.string().min(1),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  realWorldContext: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    if (!aiService.isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI services are not available. Please check your OpenAI API key configuration.' },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'generate-hint': {
        const body = await request.json();
        const validated = generateHintSchema.parse(body);
        
        const hint = await aiService.provideLearningHint(
          validated.question,
          validated.userContext,
          validated.hintLevel
        );

        return NextResponse.json({ 
          success: true, 
          data: hint,
          meta: {
            hintLevel: validated.hintLevel,
            difficultyLevel: validated.userContext.difficultyLevel,
            timeSpent: validated.userContext.timeSpent,
            previousAttempts: validated.userContext.previousAttempts?.length || 0
          }
        });
      }

      case 'generate-explanation': {
        const body = await request.json();
        const validated = generateExplanationSchema.parse(body);
        
        const explanation = await aiService.generateExplanation(
          validated.question,
          validated.correctAnswer,
          validated.userAnswer,
          validated.isCorrect,
          validated.context
        );

        return NextResponse.json({ 
          success: true, 
          data: explanation,
          meta: {
            isCorrect: validated.isCorrect,
            difficultyLevel: validated.context.difficultyLevel,
            topics: validated.context.topics,
            explanationType: 'detailed_feedback'
          }
        });
      }

      case 'learning-guidance': {
        const body = await request.json();
        const validated = learningGuidanceSchema.parse(body);
        
        const guidance = await aiService.provideLearningGuidance(
          validated.userStrengths,
          validated.userWeaknesses,
          validated.currentTopic,
          validated.learningGoals,
          validated.availableStudyTime
        );

        return NextResponse.json({ 
          success: true, 
          data: guidance,
          meta: {
            currentTopic: validated.currentTopic,
            strengthsCount: validated.userStrengths.length,
            weaknessesCount: validated.userWeaknesses.length,
            goalsCount: validated.learningGoals.length,
            weeklyHours: validated.availableStudyTime
          }
        });
      }

      case 'work-through-example': {
        const body = await request.json();
        const validated = workThroughExampleSchema.parse(body);
        
        // Using the intelligent tutoring service to generate step-by-step examples
        const example = await aiService.generateExplanation(
          `Provide a detailed step-by-step example of ${validated.concept}`,
          'Step-by-step demonstration',
          'User request for example',
          true,
          {
            difficultyLevel: validated.difficultyLevel,
            topics: [validated.concept],
            learningObjectives: ['Understanding through practical example']
          }
        );

        return NextResponse.json({ 
          success: true, 
          data: example,
          meta: {
            concept: validated.concept,
            difficultyLevel: validated.difficultyLevel,
            realWorldContext: validated.realWorldContext,
            exampleType: 'step_by_step'
          }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: generate-hint, generate-explanation, learning-guidance, work-through-example' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI intelligent tutoring error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during intelligent tutoring' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isEnabled = aiService.isAIEnabled();
    
    return NextResponse.json({
      status: 'ok',
      aiEnabled: isEnabled,
      capabilities: [
        'generate-hint',
        'generate-explanation',
        'learning-guidance',
        'work-through-example'
      ],
      tutoringFeatures: {
        adaptiveHints: 'Context-aware hints based on user progress and learning style',
        detailedExplanations: 'Comprehensive explanations for both correct and incorrect answers',
        personalizedGuidance: 'Customized study plans and learning strategies',
        stepByStepExamples: 'Detailed demonstrations of concepts with real-world applications',
        progressiveSupport: 'Graduated assistance from subtle hints to explicit guidance'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI intelligent tutoring health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        aiEnabled: false,
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}