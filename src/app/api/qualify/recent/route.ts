import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qualify/recent
 * Get user's recent qualification runs (all statuses)
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    console.log('[API /qualify/recent] Session:', session?.user?.email, 'ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch recent qualification runs
    const runs = await prisma.qualificationRun.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        icp: {
          select: {
            id: true,
            title: true,
            company: {
              select: {
                name: true,
                domain: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 most recent runs
    });

    console.log(`[API /qualify/recent] Found ${runs.length} runs for user ${session.user.email}`);

    return NextResponse.json({
      success: true,
      runs: runs.map((run: typeof runs[number]) => ({
        id: run.id,
        status: run.status,
        totalProspects: run.totalProspects,
        completed: run.completed,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
        icp: {
          id: run.icp.id,
          title: run.icp.title,
          company: run.icp.company,
        },
      })),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[API] Error fetching recent runs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
