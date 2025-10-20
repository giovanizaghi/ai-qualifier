import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/companies/[id]
 * Get a specific company with all its ICPs
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Fetch company with all related data
    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        icps: {
          orderBy: { createdAt: 'desc' },
          include: {
            qualificationRuns: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Get last 5 qualification runs
              include: {
                _count: {
                  select: {
                    results: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (company.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      company,
    });
  } catch (error) {
    console.error('[API] Error fetching company:', error);
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
 * DELETE /api/companies/[id]
 * Delete a company and all its related data
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Fetch company to verify ownership
    const company = await prisma.company.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (company.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete company (cascade will handle related records)
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('[API] Error deleting company:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
