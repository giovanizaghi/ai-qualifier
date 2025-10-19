import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { UserTestingFramework } from '@/lib/user-testing-framework';

const FeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  scenarioId: z.string(),
  taskId: z.string(),
  feedbackType: z.enum(['rating', 'comment', 'bug_report', 'suggestion']),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/uat/feedback - Submit user feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = FeedbackSchema.parse(body);

    await UserTestingFramework.collectFeedback(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}