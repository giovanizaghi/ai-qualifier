import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQualificationProcessor, healthCheck } from '@/lib/background-processor';

/**
 * GET /api/qualify/health
 * Get system health and job queue statistics
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

    // Get health check
    const health = await healthCheck();
    
    // Get queue statistics
    const processor = getQualificationProcessor();
    const queueStats = processor.getQueueStats();

    return NextResponse.json({
      success: true,
      health: health.status,
      timestamp: new Date().toISOString(),
      queue: {
        ...queueStats,
        isHealthy: health.status === 'healthy',
      },
      details: health.details,
    });
  } catch (error) {
    console.error('[API] Error getting system health:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        health: 'unhealthy',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qualify/health/cleanup
 * Manually trigger cleanup of old jobs
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admin users to trigger cleanup (optional security measure)
    // You might want to check for admin role here if you have role-based access

    // Trigger cleanup
    const processor = getQualificationProcessor();
    const cleanedCount = processor.cleanup();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} old jobs`,
      cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Error triggering cleanup:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}