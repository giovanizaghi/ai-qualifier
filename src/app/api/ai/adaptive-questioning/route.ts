import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

// Validation schemas
const adaptiveQuestionSchema = z.object({
  userId: z.string().min(1),
  topicId: z.string().min(1),
  currentDifficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  recentPerformance: z.object({
    correct: z.number().min(0),
    total: z.number().min(1),
    avgTime: z.number().min(0)
  }),
  userStrengths: z.array(z.string()),
  userWeaknesses: z.array(z.string())
});

const adjustDifficultySchema = z.object({
  currentDifficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  recentPerformance: z.object({
    correct: z.number().min(0),
    total: z.number().min(1),
    avgTime: z.number().min(0),
    consecutiveCorrect: z.number().min(0),
    consecutiveIncorrect: z.number().min(0)
  })
});

const followUpQuestionSchema = z.object({
  originalQuestion: z.object({
    question: z.string(),
    type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    topics: z.array(z.string())
  }),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
  timeTaken: z.number().min(0)
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
      case 'generate-adaptive-question': {
        const body = await request.json();
        const validated = adaptiveQuestionSchema.parse(body);
        
        const question = await aiService.generateAdaptiveQuestion(validated);

        return NextResponse.json({ 
          success: true, 
          data: question,
          meta: {
            userId: validated.userId,
            topicId: validated.topicId,
            adaptedDifficulty: question?.difficulty,
            performanceContext: {
              accuracy: `${((validated.recentPerformance.correct / validated.recentPerformance.total) * 100).toFixed(1)}%`,
              avgTime: `${validated.recentPerformance.avgTime}s`
            }
          }
        });
      }

      case 'adjust-difficulty': {
        const body = await request.json();
        const validated = adjustDifficultySchema.parse(body);
        
        const newDifficulty = await aiService.adjustQuestionDifficulty(
          validated.currentDifficulty,
          validated.recentPerformance
        );

        return NextResponse.json({ 
          success: true, 
          data: { newDifficulty },
          meta: {
            originalDifficulty: validated.currentDifficulty,
            adjustedDifficulty: newDifficulty,
            performanceTrigger: {
              accuracy: `${((validated.recentPerformance.correct / validated.recentPerformance.total) * 100).toFixed(1)}%`,
              consecutiveCorrect: validated.recentPerformance.consecutiveCorrect,
              consecutiveIncorrect: validated.recentPerformance.consecutiveIncorrect
            }
          }
        });
      }

      case 'generate-followup': {
        const body = await request.json();
        const validated = followUpQuestionSchema.parse(body);
        
        const followUpQuestion = await aiService.generateAdaptiveQuestion({
          userId: 'temp-user',
          topicId: validated.originalQuestion.topics[0] || 'general',
          currentDifficulty: validated.originalQuestion.difficulty,
          recentPerformance: {
            correct: validated.isCorrect ? 1 : 0,
            total: 1,
            avgTime: validated.timeTaken
          },
          userStrengths: [],
          userWeaknesses: []
        });

        return NextResponse.json({ 
          success: true, 
          data: followUpQuestion,
          meta: {
            originalQuestion: validated.originalQuestion.question,
            userPerformance: validated.isCorrect ? 'correct' : 'incorrect',
            timeTaken: validated.timeTaken,
            adaptationStrategy: validated.isCorrect ? 'increase_complexity' : 'reinforce_concept'
          }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: generate-adaptive-question, adjust-difficulty, generate-followup' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI adaptive questioning error:', error);
    
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
      { error: 'Internal server error during adaptive questioning' },
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
        'generate-adaptive-question',
        'adjust-difficulty',
        'generate-followup'
      ],
      adaptiveFeatures: {
        difficultyAdjustment: 'Dynamic difficulty based on performance patterns',
        personalizedQuestions: 'Questions adapted to user strengths and weaknesses',
        followUpGeneration: 'Contextual follow-up questions based on responses',
        performanceTracking: 'Real-time adaptation to user progress'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI adaptive questioning health check error:', error);
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