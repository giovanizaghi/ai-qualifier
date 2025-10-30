import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { getQualificationProcessor } from '@/lib/background-processor';

// Request validation schema
const jobIdSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

/**
 * DELETE /api/qualify/jobs/[jobId]
 * Cancel a specific qualification job
 */
export async function DELETE(
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

    // Attempt to cancel the job
    const cancelled = await processor.cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { 
          error: 'Job cannot be cancelled',
          message: 'Job is either already running or completed'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
      jobId,
    });
  } catch (error) {
    console.error('[API] Error cancelling job:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/qualify/jobs/[jobId]
 * Get details for a specific qualification job
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

    // Return detailed job information
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        delay: job.delay,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        progress: job.progress || null,
        data: {
          runId: jobData.runId,
          icpId: jobData.icpId,
          domains: jobData.domains || [],
          domainsCount: Array.isArray(jobData.domains) ? jobData.domains.length : 0,
        },
      },
    });
  } catch (error) {
    console.error('[API] Error getting job details:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}