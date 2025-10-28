import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQualificationProcessor } from '@/lib/background-processor';
import { JobStatus } from '@/lib/job-queue';

/**
 * GET /api/qualify/jobs
 * Get all jobs for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as JobStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get processor and user jobs
    const processor = getQualificationProcessor();
    let jobs = processor.getUserJobs(session.user.id);

    // Filter by status if provided
    if (status && Object.values(JobStatus).includes(status)) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Sort by creation date (newest first)
    jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const totalJobs = jobs.length;
    const paginatedJobs = jobs.slice(offset, offset + limit);

    // Format response
    const formattedJobs = paginatedJobs.map(job => ({
      id: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      progress: job.progress || null,
      data: {
        // Only expose safe data fields
        runId: (job.data as any).runId,
        icpId: (job.data as any).icpId,
        domainsCount: Array.isArray((job.data as any).domains) 
          ? (job.data as any).domains.length 
          : 0,
      },
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        total: totalJobs,
        limit,
        offset,
        hasMore: offset + limit < totalJobs,
      },
    });
  } catch (error) {
    console.error('[API] Error getting user jobs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}