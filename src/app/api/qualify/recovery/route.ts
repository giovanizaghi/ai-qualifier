import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { recoverStuckRuns, getStuckRuns } from '@/lib/background-recovery';

/**
 * GET /api/qualify/recovery
 * Check for stuck qualification runs
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication (only admins should access this)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const timeoutMinutes = parseInt(searchParams.get('timeout') || '30', 10);

    const stuckRuns = await getStuckRuns(timeoutMinutes);

    return NextResponse.json({
      success: true,
      count: stuckRuns.length,
      runs: stuckRuns.map((run: typeof stuckRuns[number]) => ({
        id: run.id,
        status: run.status,
        totalProspects: run.totalProspects,
        completed: run.completed,
        createdAt: run.createdAt,
        icp: {
          title: run.icp.title,
          company: run.icp.company,
        },
        stuckFor: Math.round((Date.now() - new Date(run.createdAt).getTime()) / 1000 / 60), // minutes
      })),
    });
  } catch (error) {
    console.error('[API] Error checking stuck runs:', error);
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
 * POST /api/qualify/recovery
 * Recover stuck qualification runs by marking them as failed
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication (only admins should access this)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const timeoutMinutes = body.timeout || 30;

    const result = await recoverStuckRuns(timeoutMinutes);

    return NextResponse.json({
      success: true,
      message: `Recovered ${result.recovered} stuck runs`,
      recovered: result.recovered,
      runs: result.runs.map((run: typeof result.runs[number]) => ({
        id: run.id,
        status: run.status,
        totalProspects: run.totalProspects,
        completed: run.completed,
        createdAt: run.createdAt,
      })),
    });
  } catch (error) {
    console.error('[API] Error recovering stuck runs:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
