import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/qualify/[runId]/results
 * Get detailed prospect qualification results
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { runId: string } }
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

    const { runId } = params;

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url);
    const fitLevel = searchParams.get('fitLevel');
    const sortBy = searchParams.get('sortBy') || 'score';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Verify run exists and user owns it
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

    // Build where clause
    const where: any = { runId };
    if (fitLevel) {
      where.fitLevel = fitLevel;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'score') {
      orderBy.score = order;
    } else if (sortBy === 'companyName') {
      orderBy.companyName = order;
    } else if (sortBy === 'analyzedAt') {
      orderBy.analyzedAt = order;
    } else {
      orderBy.score = 'desc'; // default
    }

    // Fetch results with pagination
    const [results, total] = await Promise.all([
      prisma.prospectQualification.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.prospectQualification.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + results.length < total,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching qualification results:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
