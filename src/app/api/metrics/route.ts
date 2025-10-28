/**
 * Metrics API endpoint
 * GET /api/metrics - Returns system metrics and performance data
 */

import { NextRequest, NextResponse } from 'next/server'
import { metricsService } from '@/lib/monitoring/metrics'
import { requireAuth, requireAdmin, checkRateLimit, rateLimitConfigs } from '@/lib/api/middleware'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for metrics endpoint
    const rateLimit = checkRateLimit(request, rateLimitConfigs.api)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        resetTime: rateLimit.resetTime
      }, { status: 429 })
    }

    // Optional: Require authentication for sensitive metrics
    // For basic metrics, we might allow public access
    // For detailed metrics, require admin access
    const url = new URL(request.url)
    const detailed = url.searchParams.get('detailed') === 'true'
    
    if (detailed) {
      const auth = await requireAdmin(request)
      if (!auth.authorized) {
        return auth.error
      }
    }

    // Get metrics data
    const metrics = detailed 
      ? await metricsService.getMetrics()
      : {
          timestamp: new Date(),
          summary: (await metricsService.getMetrics()).summary,
          dashboardSummary: metricsService.getDashboardSummary()
        }

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Metrics endpoint error:', error)
    
    return NextResponse.json({
      error: 'Failed to retrieve metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/metrics - Record custom metrics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.error
    }

    // Rate limiting for metric recording
    const rateLimit = checkRateLimit(request, rateLimitConfigs.strict)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        resetTime: rateLimit.resetTime
      }, { status: 429 })
    }

    const body = await request.json()
    const { type, name, value, tags, metadata } = body

    // Validate input
    if (!type || !name || value === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: type, name, value'
      }, { status: 400 })
    }

    // Record metric based on type
    switch (type) {
      case 'performance':
        if (!tags?.unit) {
          return NextResponse.json({
            error: 'Performance metrics require unit in tags'
          }, { status: 400 })
        }
        metricsService.recordPerformance(name, value, tags.unit, tags)
        break
        
      case 'business':
        metricsService.recordBusinessMetric(name, value, metadata)
        break
        
      case 'error':
        if (!metadata?.message) {
          return NextResponse.json({
            error: 'Error metrics require message in metadata'
          }, { status: 400 })
        }
        metricsService.recordError(
          metadata.errorType || 'system_error',
          metadata.message,
          {
            endpoint: metadata.endpoint,
            errorCode: metadata.errorCode,
            stack: metadata.stack,
            userId: auth.user?.id,
            metadata
          }
        )
        break
        
      default:
        return NextResponse.json({
          error: `Invalid metric type: ${type}. Must be one of: performance, business, error`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully',
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Metrics recording error:', error)
    
    return NextResponse.json({
      error: 'Failed to record metric',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/metrics - Clear metrics (admin only, for testing)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (!auth.authorized) {
      return auth.error
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'Metrics clearing is not allowed in production'
      }, { status: 403 })
    }

    metricsService.clearAll()

    return NextResponse.json({
      success: true,
      message: 'All metrics cleared'
    })

  } catch (error) {
    console.error('Metrics clearing error:', error)
    
    return NextResponse.json({
      error: 'Failed to clear metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}