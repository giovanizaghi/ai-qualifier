/**
 * Monitoring Dashboard API endpoint
 * GET /api/monitoring/dashboard - Returns comprehensive monitoring data
 */

import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/middleware'
import { healthCheckService } from '@/lib/monitoring/health-checks'
import { metricsService } from '@/lib/monitoring/metrics'

export async function GET(request: NextRequest) {
  try {
    // Require authentication for dashboard access
    const auth = await requireAuth(request)
    if (!auth.authorized) {
      return auth.error
    }

    // Collect all monitoring data in parallel
    const [healthStatus, metrics, dashboardSummary] = await Promise.allSettled([
      healthCheckService.performHealthCheck(),
      metricsService.getMetrics(),
      Promise.resolve(metricsService.getDashboardSummary())
    ])

    // Process results
    const response = {
      timestamp: new Date(),
      user: {
        id: auth.user?.id,
        email: auth.user?.email
      },
      health: healthStatus.status === 'fulfilled' ? healthStatus.value : {
        status: 'unhealthy',
        error: 'Failed to get health status'
      },
      metrics: metrics.status === 'fulfilled' ? {
        summary: metrics.value.summary,
        recentErrors: metrics.value.errors.slice(-10), // Last 10 errors
        performanceOverview: {
          totalRequests: metrics.value.performance.filter(m => m.name === 'api_request_count').length,
          averageResponseTime: metrics.value.performance
            .filter(m => m.name === 'api_response_time')
            .reduce((sum, m) => sum + m.value, 0) / 
            Math.max(1, metrics.value.performance.filter(m => m.name === 'api_response_time').length),
          errorRate: metrics.value.summary.errorRate
        }
      } : {
        error: 'Failed to get metrics'
      },
      dashboard: dashboardSummary.status === 'fulfilled' ? dashboardSummary.value : {
        error: 'Failed to get dashboard summary'
      },
      alerts: metricsService.getActiveAlerts(),
      systemOverview: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Monitoring dashboard error:', error)
    
    return NextResponse.json({
      error: 'Failed to load monitoring dashboard',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }, { status: 500 })
  }
}