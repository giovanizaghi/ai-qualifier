import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { metricsService } from '@/lib/monitoring/metrics';
import { prisma } from '@/lib/prisma';
import { getRunManager } from '@/lib/qualification-run-manager';

/**
 * GET /api/qualify/[runId]
 * Get qualification run status and summary
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Record API request metrics
    metricsService.recordPerformance('api_request_count', 1, 'count', {
      endpoint: '/api/qualify/[runId]',
      method: 'GET'
    });

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      metricsService.recordError('api_error', 'Unauthorized access to qualification run', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '401'
      });
      
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
      metricsService.recordError('api_error', 'Qualification run not found', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '404',
        userId: session.user.id,
        metadata: { runId }
      });
      
      return NextResponse.json(
        { error: 'Qualification run not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (run.userId !== session.user.id) {
      metricsService.recordError('api_error', 'Forbidden access to qualification run', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '403',
        userId: session.user.id,
        metadata: { runId, ownerId: run.userId }
      });
      
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

    // Get run health status from run manager
    const runManager = getRunManager();
    const healthStatuses = await runManager.getRunHealthStatus();
    const runHealth = healthStatuses.find(h => h.runId === run.id);

    // Record successful metrics
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify/[runId]',
      method: 'GET',
      status: '200'
    });

    // Record business metrics about run progress
    metricsService.recordBusinessMetric('qualification_run_viewed', 1, {
      runId: run.id,
      userId: session.user.id,
      status: run.status,
      totalProspects: run.totalProspects,
      completed: run.completed,
      progressPercent: (run.completed / run.totalProspects) * 100
    });

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
        health: runHealth ? {
          progress: runHealth.progress,
          ageMinutes: runHealth.ageMinutes,
          isStuck: runHealth.isStuck,
          estimatedTimeRemaining: runHealth.estimatedTimeRemaining,
        } : null,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching qualification run:', error);
    
    // Record error metrics
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify/[runId]',
      method: 'GET',
      status: '500'
    });

    metricsService.recordError('api_error', 'Internal server error fetching qualification run', {
      endpoint: '/api/qualify/[runId]',
      errorCode: '500',
      stack: error instanceof Error ? error.stack : undefined,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    
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
  const startTime = Date.now();
  
  try {
    // Record API request metrics
    metricsService.recordPerformance('api_request_count', 1, 'count', {
      endpoint: '/api/qualify/[runId]',
      method: 'DELETE'
    });

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      metricsService.recordError('api_error', 'Unauthorized deletion attempt', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '401'
      });
      
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
      metricsService.recordError('api_error', 'Qualification run not found for deletion', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '404',
        userId: session.user.id,
        metadata: { runId }
      });
      
      return NextResponse.json(
        { error: 'Qualification run not found' },
        { status: 404 }
      );
    }

    if (run.userId !== session.user.id) {
      metricsService.recordError('api_error', 'Forbidden deletion attempt', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '403',
        userId: session.user.id,
        metadata: { runId, ownerId: run.userId }
      });
      
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete run (cascade will handle results)
    await prisma.qualificationRun.delete({
      where: { id: runId },
    });

    // Record successful metrics
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify/[runId]',
      method: 'DELETE',
      status: '200'
    });

    metricsService.recordBusinessMetric('qualification_run_deleted', 1, {
      runId,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Qualification run deleted successfully',
    });
  } catch (error) {
    console.error('[API] Error deleting qualification run:', error);
    
    // Record error metrics
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify/[runId]',
      method: 'DELETE',
      status: '500'
    });

    metricsService.recordError('api_error', 'Internal server error deleting qualification run', {
      endpoint: '/api/qualify/[runId]',
      errorCode: '500',
      stack: error instanceof Error ? error.stack : undefined,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    
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
 * PUT /api/qualify/[runId]
 * Manage qualification run (resume, fail, etc.)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Record API request metrics
    metricsService.recordPerformance('api_request_count', 1, 'count', {
      endpoint: '/api/qualify/[runId]',
      method: 'PUT'
    });

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      metricsService.recordError('api_error', 'Unauthorized run management attempt', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '401'
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { runId } = await params;
    const body = await req.json();
    const { action, reason } = body;

    // Verify run ownership
    const run = await prisma.qualificationRun.findUnique({
      where: { id: runId },
      select: { userId: true, status: true },
    });

    if (!run) {
      metricsService.recordError('api_error', 'Qualification run not found for management', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '404',
        userId: session.user.id,
        metadata: { runId, action }
      });
      
      return NextResponse.json(
        { error: 'Qualification run not found' },
        { status: 404 }
      );
    }

    if (run.userId !== session.user.id) {
      metricsService.recordError('api_error', 'Forbidden run management attempt', {
        endpoint: '/api/qualify/[runId]',
        errorCode: '403',
        userId: session.user.id,
        metadata: { runId, ownerId: run.userId, action }
      });
      
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const runManager = getRunManager();

    switch (action) {
      case 'resume':
        if (run.status !== 'PENDING' && run.status !== 'PROCESSING') {
          metricsService.recordError('api_error', 'Invalid resume action on completed run', {
            endpoint: '/api/qualify/[runId]',
            errorCode: '400',
            userId: session.user.id,
            metadata: { runId, status: run.status, action }
          });
          
          return NextResponse.json(
            { error: 'Cannot resume run that is not active' },
            { status: 400 }
          );
        }
        await runManager.resumeRun(runId);
        
        // Record successful metrics
        const resumeResponseTime = Date.now() - startTime;
        metricsService.recordPerformance('api_response_time', resumeResponseTime, 'ms', {
          endpoint: '/api/qualify/[runId]',
          method: 'PUT',
          status: '200',
          action: 'resume'
        });

        metricsService.recordBusinessMetric('qualification_run_resumed', 1, {
          runId,
          userId: session.user.id
        });
        
        return NextResponse.json({
          success: true,
          message: 'Run resumed successfully',
        });

      case 'fail':
        if (run.status === 'COMPLETED' || run.status === 'FAILED') {
          metricsService.recordError('api_error', 'Invalid fail action on completed run', {
            endpoint: '/api/qualify/[runId]',
            errorCode: '400',
            userId: session.user.id,
            metadata: { runId, status: run.status, action }
          });
          
          return NextResponse.json(
            { error: 'Cannot fail run that is already completed or failed' },
            { status: 400 }
          );
        }
        await runManager.failRun(runId, reason || 'Manually failed by user');
        
        // Record successful metrics
        const failResponseTime = Date.now() - startTime;
        metricsService.recordPerformance('api_response_time', failResponseTime, 'ms', {
          endpoint: '/api/qualify/[runId]',
          method: 'PUT',
          status: '200',
          action: 'fail'
        });

        metricsService.recordBusinessMetric('qualification_run_failed', 1, {
          runId,
          userId: session.user.id,
          reason: reason || 'Manually failed by user'
        });
        
        return NextResponse.json({
          success: true,
          message: 'Run failed successfully',
        });

      default:
        metricsService.recordError('api_error', 'Invalid run management action', {
          endpoint: '/api/qualify/[runId]',
          errorCode: '400',
          userId: session.user.id,
          metadata: { runId, action }
        });
        
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: resume, fail' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] Error managing qualification run:', error);
    
    // Record error metrics
    const responseTime = Date.now() - startTime;
    metricsService.recordPerformance('api_response_time', responseTime, 'ms', {
      endpoint: '/api/qualify/[runId]',
      method: 'PUT',
      status: '500'
    });

    metricsService.recordError('api_error', 'Internal server error managing qualification run', {
      endpoint: '/api/qualify/[runId]',
      errorCode: '500',
      stack: error instanceof Error ? error.stack : undefined,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
