import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getQualificationProcessor } from '@/lib/background-processor';
import type { ICPData } from '@/lib/icp-generator';
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

    // Map ICP to ICPData structure
    const icpData = {
      title: icp.title,
      description: icp.description,
      buyerPersonas: icp.buyerPersonas as any,
      companySize: icp.companySize as any,
      industries: icp.industries,
      geographicRegions: icp.geographicRegions,
      fundingStages: icp.fundingStages,
      keyIndicators: (icp as any).keyIndicators || [],
      technographics: (icp as any).technographics || [],
    };

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

    // Start background processing using job queue
    const processor = getQualificationProcessor();
    const jobId = await processor.startQualification(
      run.id,
      session.user.id,
      icpId,
      icpData,
      domains
    );

    console.log(`[API] Started background job ${jobId} for qualification run ${run.id}`);

    return NextResponse.json(
      {
        success: true,
        run: {
          id: run.id,
          status: run.status,
          totalProspects: run.totalProspects,
          completed: run.completed,
          jobId, // Include job ID for progress tracking
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
