import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getRunManager } from '@/lib/qualification-run-manager';

/**
 * GET /api/qualify/management
 * Get run manager statistics and health overview
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

    const runManager = getRunManager();

    // Get comprehensive stats
    const [stats, healthStatuses] = await Promise.all([
      runManager.getStats(),
      runManager.getRunHealthStatus(),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      activeRuns: healthStatuses,
      summary: {
        totalActive: healthStatuses.length,
        stuckRuns: healthStatuses.filter(h => h.isStuck).length,
        averageProgress: healthStatuses.length > 0 
          ? healthStatuses.reduce((sum, h) => sum + h.progress, 0) / healthStatuses.length 
          : 0,
      },
    });
  } catch (error) {
    console.error('[API] Error getting run management stats:', error);
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
 * POST /api/qualify/management
 * Perform run management actions (recover stuck runs, cleanup, etc.)
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

    const body = await req.json();
    const { action, timeoutMinutes, olderThanDays } = body;

    const runManager = getRunManager();

    switch (action) {
      case 'recover':
        const recoveryResult = await runManager.recoverStuckRuns();
        return NextResponse.json({
          success: true,
          action: 'recover',
          result: recoveryResult,
        });

      case 'checkTimeouts':
        const timeoutResult = await runManager.checkTimeouts();
        return NextResponse.json({
          success: true,
          action: 'checkTimeouts',
          result: timeoutResult,
        });

      case 'cleanup':
        const days = olderThanDays || 30;
        const cleanupCount = await runManager.cleanup(days);
        return NextResponse.json({
          success: true,
          action: 'cleanup',
          result: {
            deletedRuns: cleanupCount,
            olderThanDays: days,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: recover, checkTimeouts, cleanup' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error performing run management action:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}