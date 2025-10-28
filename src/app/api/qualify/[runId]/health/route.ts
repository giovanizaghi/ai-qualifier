import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRunManager } from '@/lib/qualification-run-manager';

/**
 * GET /api/qualify/[runId]/health
 * Get health status for a specific qualification run
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
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

    const { runId } = await params;
    const runManager = getRunManager();

    // Get health status for all runs and filter for the requested run
    const healthStatuses = await runManager.getRunHealthStatus();
    const runHealth = healthStatuses.find(h => h.runId === runId);

    if (!runHealth) {
      return NextResponse.json(
        { error: 'Run not found or not active' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      health: runHealth,
    });
  } catch (error) {
    console.error('[API] Error getting run health:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}