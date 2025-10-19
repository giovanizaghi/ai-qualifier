import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserTestingFramework } from '@/lib/user-testing-framework';

// Request validation schemas
const StartSessionSchema = z.object({
  scenarioId: z.string(),
  userId: z.string().optional(),
  userPersona: z.enum(['new_user', 'intermediate_user', 'expert_user', 'administrator']),
  device: z.enum(['desktop', 'tablet', 'mobile']),
  browser: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const TaskCompletionSchema = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string(),
  scenarioId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'failed', 'skipped']),
  completionTime: z.number().optional(),
  errorCount: z.number().default(0),
  helpRequests: z.number().default(0),
  notes: z.string().optional(),
});

const FeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  scenarioId: z.string(),
  taskId: z.string(),
  feedbackType: z.enum(['rating', 'comment', 'bug_report', 'suggestion']),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/uat/sessions - Start a new UAT session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = StartSessionSchema.parse(body);

    const sessionId = await UserTestingFramework.startSession(validatedData);

    return NextResponse.json({
      success: true,
      data: { sessionId },
      message: 'UAT session started successfully'
    });
  } catch (error) {
    console.error('Error starting UAT session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to start UAT session' },
      { status: 500 }
    );
  }
}

// PATCH /api/uat/sessions/[sessionId] - End a UAT session
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = z.object({
      status: z.enum(['completed', 'abandoned'])
    }).parse(body);

    await UserTestingFramework.endSession(sessionId, status);

    return NextResponse.json({
      success: true,
      message: 'UAT session ended successfully'
    });
  } catch (error) {
    console.error('Error ending UAT session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to end UAT session' },
      { status: 500 }
    );
  }
}

// GET /api/uat/sessions/[sessionId]/analytics - Get session analytics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/')[4]; // /api/uat/sessions/[sessionId]/analytics
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const analytics = await UserTestingFramework.getSessionAnalytics(sessionId);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting session analytics:', error);

    if (error instanceof Error && error.message === 'Session not found') {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to get session analytics' },
      { status: 500 }
    );
  }
}