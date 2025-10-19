import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { UserTestingFramework } from '@/lib/user-testing-framework';

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

// POST /api/uat/tasks - Record task completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = TaskCompletionSchema.parse(body);

    await UserTestingFramework.recordTaskCompletion(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Task completion recorded successfully'
    });
  } catch (error) {
    console.error('Error recording task completion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to record task completion' },
      { status: 500 }
    );
  }
}