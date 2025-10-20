import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/companies
 * List all companies for the authenticated user
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

    // Fetch user's companies with their ICPs
    const companies = await prisma.company.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        icps: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the most recent ICP
        },
        _count: {
          select: {
            icps: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      companies,
      total: companies.length,
    });
  } catch (error) {
    console.error('[API] Error fetching companies:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
