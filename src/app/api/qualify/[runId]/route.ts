import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qualify/[runId]
 * Get qualification run status and summary
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

    // Fetch qualification run with results
    const run = await prisma.qualificationRun.findUnique({
      where: { id: runId },
      include: {
        icp: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                domain: true,
              },
            },
          },
        },
        results: {
          orderBy: { score: 'desc' },
          select: {
            id: true,
            domain: true,
            companyName: true,
            score: true,
            fitLevel: true,
            status: true,
            reasoning: true,
            matchedCriteria: true,
            gaps: true,
            error: true,
            createdAt: true,
            analyzedAt: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Qualification run not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (run.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate statistics
    type ResultType = typeof run.results[number];
    const completedResults = run.results.filter((r: ResultType) => r.status === 'COMPLETED');
    const stats = {
      total: run.totalProspects,
      completed: run.completed,
      excellent: completedResults.filter((r: ResultType) => r.fitLevel === 'EXCELLENT').length,
      good: completedResults.filter((r: ResultType) => r.fitLevel === 'GOOD').length,
      fair: completedResults.filter((r: ResultType) => r.fitLevel === 'FAIR').length,
      poor: completedResults.filter((r: ResultType) => r.fitLevel === 'POOR').length,
      averageScore: completedResults.length > 0
        ? completedResults.reduce((sum: number, r: ResultType) => sum + r.score, 0) / completedResults.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      run: {
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
        results: run.results,
        stats,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching qualification run:', error);
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
 * DELETE /api/qualify/[runId]
 * Delete a qualification run and all its results
 */
export async function DELETE(
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

    // Fetch run to verify ownership
    const run = await prisma.qualificationRun.findUnique({
      where: { id: runId },
      select: { userId: true },
    });

    if (!run) {
      return NextResponse.json(
        { error: 'Qualification run not found' },
        { status: 404 }
      );
    }

    if (run.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete run (cascade will handle results)
    await prisma.qualificationRun.delete({
      where: { id: runId },
    });

    return NextResponse.json({
      success: true,
      message: 'Qualification run deleted successfully',
    });
  } catch (error) {
    console.error('[API] Error deleting qualification run:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
