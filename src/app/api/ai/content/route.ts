import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

// Validation schemas
const generateQuestionsSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  count: z.number().int().min(1).max(20).default(5),
  questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay'])).optional()
});

const generateContentSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  contentType: z.enum(['explanation', 'tutorial', 'summary', 'example'])
});

const enhanceContentSchema = z.object({
  originalContent: z.string().min(1),
  enhancementType: z.enum(['simplify', 'expand', 'add-examples', 'improve-clarity'])
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
      case 'generate-questions': {
        const body = await request.json();
        const validated = generateQuestionsSchema.parse(body);
        
        const questions = await aiService.generateQuestions(
          validated.topic,
          validated.difficulty,
          validated.count,
          validated.questionTypes
        );

        return NextResponse.json({ 
          success: true, 
          data: questions,
          meta: {
            topic: validated.topic,
            difficulty: validated.difficulty,
            count: questions.length
          }
        });
      }

      case 'generate-content': {
        const body = await request.json();
        const validated = generateContentSchema.parse(body);
        
        const content = await aiService.generateLearningContent(
          validated.topic,
          validated.difficulty,
          validated.contentType
        );

        return NextResponse.json({ 
          success: true, 
          data: { content },
          meta: {
            topic: validated.topic,
            difficulty: validated.difficulty,
            type: validated.contentType
          }
        });
      }

      case 'enhance-content': {
        const body = await request.json();
        const validated = enhanceContentSchema.parse(body);
        
        const enhancedContent = await aiService.generateLearningContent(
          validated.originalContent,
          'intermediate',
          'explanation'
        );

        return NextResponse.json({ 
          success: true, 
          data: { enhancedContent },
          meta: {
            enhancementType: validated.enhancementType,
            originalLength: validated.originalContent.length,
            enhancedLength: enhancedContent?.length || 0
          }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: generate-questions, generate-content, enhance-content' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI content generation error:', error);
    
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
      { error: 'Internal server error during AI content generation' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const isEnabled = aiService.isAIEnabled();
    const connectionTest = isEnabled ? await aiService.testAIConnection() : false;

    return NextResponse.json({
      status: 'ok',
      aiEnabled: isEnabled,
      connectionTest,
      capabilities: [
        'generate-questions',
        'generate-content',
        'enhance-content'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        aiEnabled: false,
        connectionTest: false,
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}