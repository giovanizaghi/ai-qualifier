import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qualify/active
 * Get user's active (processing/pending) qualification runs
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch active qualification runs
    const runs = await prisma.qualificationRun.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
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
      take: 5, // Limit to 5 most recent active runs
    });

    return NextResponse.json({
      success: true,
      runs: runs.map((run: typeof runs[number]) => ({
        id: run.id,
        status: run.status,
        totalProspects: run.totalProspects,
        completed: run.completed,
        createdAt: run.createdAt,
        icp: {
          id: run.icp.id,
          title: run.icp.title,
          company: run.icp.company,
        },
      })),
    });
  } catch (error) {
    console.error('[API] Error fetching active runs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
