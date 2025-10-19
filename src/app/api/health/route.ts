import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';

// Health check endpoint for production monitoring
export async function GET(request: NextRequest) {
  if (!env.HEALTH_CHECK_ENABLED) {
    return NextResponse.json(
      { error: 'Health check endpoint is disabled' },
      { status: 404 }
    );
  }

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.APP_ENV,
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      memory: { status: 'unknown', usage: 0, percentage: 0 },
      uptime: process.uptime(),
    },
  };

  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;
    
    healthCheck.checks.database = {
      status: dbResponseTime < env.DB_QUERY_THRESHOLD_WARNING ? 'healthy' : 'degraded',
      responseTime: dbResponseTime,
    };

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryPercentage = Math.round((memoryUsageMB / env.MEMORY_USAGE_THRESHOLD_ERROR) * 100);
    
    healthCheck.checks.memory = {
      status: memoryUsageMB < env.MEMORY_USAGE_THRESHOLD_WARNING ? 'healthy' : 
              memoryUsageMB < env.MEMORY_USAGE_THRESHOLD_ERROR ? 'degraded' : 'unhealthy',
      usage: memoryUsageMB,
      percentage: memoryPercentage,
    };

    // Overall status determination
    const allChecks = Object.values(healthCheck.checks);
    const hasUnhealthy = allChecks.some((check: any) => check.status === 'unhealthy');
    const hasDegraded = allChecks.some((check: any) => check.status === 'degraded');
    
    if (hasUnhealthy) {
      healthCheck.status = 'unhealthy';
    } else if (hasDegraded) {
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

// Detailed metrics endpoint (protected)
export async function POST(request: NextRequest) {
  if (!env.METRICS_ENDPOINT_ENABLED) {
    return NextResponse.json(
      { error: 'Metrics endpoint is disabled' },
      { status: 404 }
    );
  }

  try {
    // Simple authentication check (you might want to use proper API keys)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
      memory: process.memoryUsage(),
      performance: {
        eventLoopDelay: {
          // This would require additional setup with perf_hooks
          min: 0,
          max: 0,
          mean: 0,
          stddev: 0,
        },
      },
      environment: {
        nodeEnv: env.NODE_ENV,
        appEnv: env.APP_ENV,
        logLevel: env.LOG_LEVEL,
        debugMode: env.DEBUG_MODE,
      },
      features: {
        aiTutoring: env.FEATURE_AI_TUTORING,
        advancedAnalytics: env.FEATURE_ADVANCED_ANALYTICS,
        paymentProcessing: env.FEATURE_PAYMENT_PROCESSING,
        socialLogin: env.FEATURE_SOCIAL_LOGIN,
      },
      database: {
        connectionLimit: env.DATABASE_CONNECTION_LIMIT,
        poolTimeout: env.DATABASE_POOL_TIMEOUT,
      },
      rateLimiting: {
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
        windowMs: env.RATE_LIMIT_WINDOW_MS,
      },
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Metrics endpoint failed:', error);
    
    return NextResponse.json(
      {
        error: 'Metrics collection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}