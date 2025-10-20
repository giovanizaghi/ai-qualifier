import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { qualifyProspects } from '@/lib/prospect-qualifier';
import { z } from 'zod';

// Request validation schema
const qualifyRequestSchema = z.object({
  icpId: z.string().min(1, 'ICP ID is required'),
  domains: z.array(z.string().min(1)).min(1, 'At least one domain is required').max(50, 'Maximum 50 domains allowed'),
});

/**
 * POST /api/qualify
 * Create a qualification run and process prospects against an ICP
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = qualifyRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { icpId, domains } = validationResult.data;

    // Fetch ICP and verify ownership
    const icp = await prisma.iCP.findUnique({
      where: { id: icpId },
      include: {
        company: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!icp) {
      return NextResponse.json(
        { error: 'ICP not found' },
        { status: 404 }
      );
    }

    if (icp.company.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Create qualification run
    const run = await prisma.qualificationRun.create({
      data: {
        icpId,
        userId: session.user.id,
        status: 'PROCESSING',
        totalProspects: domains.length,
        completed: 0,
      },
    });

    console.log(`[API] Created qualification run: ${run.id} for ${domains.length} prospects`);

    // Process prospects asynchronously
    // Note: In production, this should be moved to a background job queue
    processQualification(run.id, icp, domains).catch((error) => {
      console.error(`[API] Error processing qualification run ${run.id}:`, error);
    });

    return NextResponse.json(
      {
        success: true,
        run: {
          id: run.id,
          status: run.status,
          totalProspects: run.totalProspects,
          completed: run.completed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating qualification run:', error);
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
 * Process qualification run in the background
 */
async function processQualification(
  runId: string,
  icp: any,
  domains: string[]
) {
  try {
    console.log(`[Background] Starting qualification for run ${runId}`);

    // Process prospects with progress tracking
    const results = await qualifyProspects(
      domains,
      icp,
      async (completed: number, total: number) => {
        // Update progress in database
        await prisma.qualificationRun.update({
          where: { id: runId },
          data: { completed },
        });
        console.log(`[Background] Progress: ${completed}/${total}`);
      }
    );

    // Save results to database
    for (const result of results) {
      await prisma.prospectQualification.create({
        data: {
          runId,
          domain: result.prospectDomain,
          companyName: result.prospectName,
          companyData: result.prospectData as any,
          score: result.score,
          fitLevel: result.fitLevel as any,
          reasoning: result.reasoning,
          matchedCriteria: result.matchedCriteria as any,
          gaps: result.gaps,
          status: 'COMPLETED',
          analyzedAt: new Date(),
        },
      });
    }

    // Mark run as completed
    await prisma.qualificationRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log(`[Background] Qualification run ${runId} completed`);
  } catch (error) {
    console.error(`[Background] Error in qualification run ${runId}:`, error);
    
    // Mark run as failed
    await prisma.qualificationRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });
  }
}
