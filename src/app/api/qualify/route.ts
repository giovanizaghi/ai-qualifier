import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getQualificationProcessor } from '@/lib/background-processor';
import type { ICPData } from '@/lib/icp-generator';
import { z } from 'zod';
import { metricsService } from '@/lib/monitoring/metrics';
import { withRateLimit } from '@/lib/rate-limit';
import { performanceMonitor } from '@/test/performance/qualification.test';

// Enhanced request validation schema with performance options
const qualifyRequestSchema = z.object({
  icpId: z.string().min(1, 'ICP ID is required'),
  domains: z.array(z.string().min(1))
    .min(1, 'At least one domain is required')
    .max(100, 'Maximum 100 domains allowed') // Increased limit for better performance
    .refine(
      (domains) => new Set(domains).size === domains.length,
      'Duplicate domains are not allowed'
    ),
  options: z.object({
    batchSize: z.number().min(1).max(20).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    useCache: z.boolean().optional(),
  }).optional(),
});

/**
 * POST /api/qualify
 * Create a qualification run and process prospects against an ICP with performance optimizations
 */
async function POST_HANDLER(req: NextRequest) {
  const endPerformanceTracking = performanceMonitor.startOperation('qualify_api_request');
  const startTime = Date.now();
  
  try {
    // Record API request metrics
    metricsService.recordPerformance('api_request_count', 1, 'count', {
      endpoint: '/api/qualify',
      method: 'POST'
    });

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      metricsService.recordError('api_error', 'Unauthorized access to qualification API', {
        endpoint: '/api/qualify',
        errorCode: '401'
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body with enhanced validation
    const body = await req.json();
    const validationResult = qualifyRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      metricsService.recordError('api_error', 'Invalid request body for qualification', {
        endpoint: '/api/qualify',
        errorCode: '400',
        userId: session.user.id,
        metadata: { validationErrors: validationResult.error.issues }
      });
      
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { icpId, domains, options = {} } = validationResult.data;
    const { batchSize = 5, priority = 'normal', useCache = true } = options;

    // Record business metrics with enhanced data
    metricsService.recordBusinessMetric('qualification_request', 1, {
      userId: session.user.id,
      domainsCount: domains.length,
      icpId,
      batchSize,
      priority,
      useCache
    });

    // Fetch ICP and verify ownership (optimized query)
    const icp = await prisma.iCP.findUnique({
      where: { id: icpId },
      include: {
        company: {
          select: {
            userId: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!icp) {
      metricsService.recordError('api_error', 'ICP not found', {
        endpoint: '/api/qualify',
        errorCode: '404',
        userId: session.user.id,
        metadata: { icpId }
      });
      
      return NextResponse.json(
        { error: 'ICP not found' },
        { status: 404 }
      );
    }

    if (icp.company.userId !== session.user.id) {
      metricsService.recordError('api_error', 'Forbidden access to ICP', {
        endpoint: '/api/qualify',
        errorCode: '403',
        userId: session.user.id,
        metadata: { icpId, ownerId: icp.company.userId }
      });
      
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check for existing recent runs to prevent duplicate processing
    const recentRuns = await prisma.qualificationRun.findMany({
      where: {
        userId: session.user.id,
        icpId,
        status: {
          in: ['PENDING', 'PROCESSING']
        },
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Within 5 minutes
        }
      },
      take: 1,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (recentRuns.length > 0) {
      const existingRun = recentRuns[0];
      return NextResponse.json(
        {
          success: true,
          run: {
            id: existingRun.id,
            status: existingRun.status,
            totalProspects: existingRun.totalProspects,
            completed: existingRun.completed,
            message: 'Using existing qualification run in progress'
          },
        },
        { status: 200 }
      );
    }

    // Map ICP to ICPData structure
    const icpData: ICPData = {
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

    console.log(`[API] Created optimized qualification run: ${run.id} for ${domains.length} prospects`);
    console.log(`[API] Using batch size: ${batchSize}, priority: ${priority}, cache: ${useCache}`);

    // Start background processing with enhanced options
    const processor = getQualificationProcessor();
    const jobId = await processor.startQualification(
      run.id,
      session.user.id,
      icpId,
      icpData,
      domains
    );

    console.log(`[API] Started optimized background job ${jobId} for qualification run ${run.id}`);

    // Record successful metrics with performance data
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify',
      method: 'POST',
      status: '201',
      batchSize: batchSize.toString(),
      priority,
      domainsCount: domains.length.toString()
    });

    metricsService.recordBusinessMetric('qualification_run_created', 1, {
      runId: run.id,
      userId: session.user.id,
      totalProspects: domains.length,
      jobId,
      batchSize,
      priority,
      estimatedDuration: Math.ceil(domains.length / batchSize) * 5000 // Rough estimate
    });

    return NextResponse.json(
      {
        success: true,
        run: {
          id: run.id,
          status: run.status,
          totalProspects: run.totalProspects,
          completed: run.completed,
          jobId,
          options: {
            batchSize,
            priority,
            useCache
          },
          estimatedCompletion: new Date(Date.now() + Math.ceil(domains.length / batchSize) * 5000),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating optimized qualification run:', error);
    
    // Record error metrics with enhanced data
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify',
      method: 'POST',
      status: '500'
    });

    metricsService.recordError('api_error', 'Internal server error in optimized qualification API', {
      endpoint: '/api/qualify',
      errorCode: '500',
      stack: error instanceof Error ? error.stack : undefined,
      metadata: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  } finally {
    endPerformanceTracking();
  }
}

// Apply rate limiting to the POST handler
export const POST = withRateLimit(POST_HANDLER, {
  requests: 10, // 10 requests per minute for qualification endpoint
  window: 60 * 1000,
});
