import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

// Validation schemas
const createLearningPathSchema = z.object({
  userId: z.string().min(1),
  targetQualification: z.string().min(1),
  userPerformance: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendedTopics: z.array(z.string()),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']),
    confidenceScore: z.number().min(0).max(100),
    predictedSuccessRate: z.number().min(0).max(100)
  }),
  availableTime: z.number().min(1).max(40), // hours per week
  preferences: z.object({
    learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']),
    pace: z.enum(['slow', 'moderate', 'fast']),
    focusAreas: z.array(z.string()).optional()
  })
});

const analyzePerformanceSchema = z.object({
  userId: z.string().min(1),
  assessmentHistory: z.array(z.object({
    qualificationId: z.string(),
    topicId: z.string(),
    score: z.number().min(0).max(100),
    timeSpent: z.number().min(1),
    difficulty: z.string(),
    date: z.string().transform(str => new Date(str))
  })),
  userProfile: z.object({
    experienceLevel: z.string(),
    background: z.array(z.string()),
    goals: z.array(z.string())
  })
});

const generateResourcesSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']),
  timeAvailable: z.number().min(5).max(480) // 5 minutes to 8 hours
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
      case 'create-learning-path': {
        const body = await request.json();
        const validated = createLearningPathSchema.parse(body);
        
        const learningPath = await aiService.createPersonalizedLearningPath(
          validated.userId,
          validated.targetQualification,
          validated.userPerformance,
          validated.availableTime,
          validated.preferences
        );

        return NextResponse.json({ 
          success: true, 
          data: learningPath,
          meta: {
            userId: validated.userId,
            qualification: validated.targetQualification,
            timeAvailable: validated.availableTime
          }
        });
      }

      case 'analyze-performance': {
        const body = await request.json();
        const validated = analyzePerformanceSchema.parse(body);
        
        const analysis = await aiService.analyzeUserPerformance(
          validated.userId,
          validated.assessmentHistory,
          validated.userProfile
        );

        return NextResponse.json({ 
          success: true, 
          data: analysis,
          meta: {
            userId: validated.userId,
            assessmentsAnalyzed: validated.assessmentHistory.length,
            analysisDate: new Date().toISOString()
          }
        });
      }

      case 'generate-resources': {
        const body = await request.json();
        const validated = generateResourcesSchema.parse(body);
        
        const resources = await aiService.recommendStudyResources(
          validated.topic,
          validated.learningStyle,
          validated.difficulty,
          {
            dailyTime: validated.timeAvailable,
            preferredSessionLength: Math.min(validated.timeAvailable, 60),
            totalTimeAvailable: validated.timeAvailable / 60
          }
        );

        return NextResponse.json({ 
          success: true, 
          data: resources,
          meta: {
            topic: validated.topic,
            difficulty: validated.difficulty,
            learningStyle: validated.learningStyle,
            resourceCount: resources.length
          }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: create-learning-path, analyze-performance, generate-resources' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI personalized learning error:', error);
    
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
      { error: 'Internal server error during personalized learning generation' },
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
        'create-learning-path',
        'analyze-performance', 
        'generate-resources'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI personalized learning health check error:', error);
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