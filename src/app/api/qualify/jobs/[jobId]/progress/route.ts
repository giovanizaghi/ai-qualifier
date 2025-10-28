import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQualificationProcessor } from '@/lib/background-processor';
import { z } from 'zod';

// Request validation schema
const jobIdSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

/**
 * GET /api/qualify/jobs/[jobId]/progress
 * Get progress for a specific qualification job
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    // Validate job ID
    const validationResult = jobIdSchema.safeParse({ jobId });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid job ID', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Get job from queue
    const processor = getQualificationProcessor();
    const job = processor.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user owns this job
    const jobData = job.data as any;
    if (jobData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get progress
    const progress = processor.getJobProgress(jobId);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        progress: progress || null,
      },
    });
  } catch (error) {
    console.error('[API] Error getting job progress:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}