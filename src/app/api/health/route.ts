/**
 * Health Check API endpoint
 * GET /api/health - Returns system health status
 */

import { NextRequest, NextResponse } from 'next/server'
import { healthCheckService } from '@/lib/monitoring/health-checks'
import { requireAuth } from '@/lib/api/middleware'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for sensitive health data
    // const auth = await requireAuth(request)
    // if (!auth.authorized) {
    //   return auth.error
    // }

    // Perform comprehensive health check
    const healthStatus = await healthCheckService.performHealthCheck()

    // Set appropriate status code based on health
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 206 : 503

    return NextResponse.json(healthStatus, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Check specific service health
 * GET /api/health?service=database
 */
export async function HEAD(request: NextRequest) {
  try {
    const healthStatus = await healthCheckService.performHealthCheck()
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 206 : 503

    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    return new NextResponse(null, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}