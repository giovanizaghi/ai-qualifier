import { NextRequest, NextResponse } from "next/server"

import { 
  successResponse,
  handleApiError,
  unauthorizedResponse
} from "@/lib/api/responses"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface SystemMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  systemLoad: number
  databaseHealth: 'healthy' | 'warning' | 'critical'
  memoryUsage: number
  cpuUsage: number
  diskUsage: number
}

interface PerformanceAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  action?: string
}

interface UserMetrics {
  totalUsers: number
  activeUsersLast24h: number
  newRegistrationsToday: number
  assessmentsCompletedToday: number
  averageSessionDuration: number
  bounceRate: number
}

interface MonitoringData {
  system: SystemMetrics
  performance: {
    coreWebVitals: {
      lcp: number
      fid: number
      cls: number
    }
    apiResponse: {
      p50: number
      p95: number
      p99: number
    }
    pageLoad: {
      homepage: number
      dashboard: number
      assessment: number
    }
  }
  users: UserMetrics
  alerts: PerformanceAlert[]
}

// GET /api/monitoring/dashboard - Get post-launch monitoring data
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return unauthorizedResponse()
    }

    // Only allow admin users to access monitoring dashboard
    if (session.user.role !== 'admin') {
      return unauthorizedResponse("Admin access required")
    }

    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || '24h'

    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const [
      systemMetrics,
      performanceMetrics,
      userMetrics,
      activeAlerts
    ] = await Promise.all([
      getSystemMetrics(),
      getPerformanceMetrics(startDate),
      getUserMetrics(startDate),
      getActiveAlerts()
    ])

    const monitoringData: MonitoringData = {
      system: systemMetrics,
      performance: performanceMetrics,
      users: userMetrics,
      alerts: activeAlerts
    }

    return successResponse(monitoringData, "Monitoring data retrieved successfully")

  } catch (error) {
    return handleApiError(error)
  }
}

async function getSystemMetrics(): Promise<SystemMetrics> {
  // Simulate system metrics - in production, these would come from monitoring services
  // like DataDog, New Relic, CloudWatch, etc.
  
  const simulatedMetrics: SystemMetrics = {
    uptime: 99.97, // 99.97% uptime
    responseTime: Math.floor(Math.random() * 100) + 150, // 150-250ms
    errorRate: Math.random() * 2, // 0-2% error rate
    activeUsers: Math.floor(Math.random() * 100) + 50, // 50-150 active users
    systemLoad: Math.random() * 50 + 30, // 30-80% system load
    databaseHealth: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.05 ? 'warning' : 'critical',
    memoryUsage: Math.random() * 30 + 40, // 40-70% memory usage
    cpuUsage: Math.random() * 40 + 20, // 20-60% CPU usage
    diskUsage: Math.random() * 20 + 50, // 50-70% disk usage
  }

  return simulatedMetrics
}

async function getPerformanceMetrics(startDate: Date) {
  // In production, these would come from Real User Monitoring (RUM) tools
  const performanceMetrics = {
    coreWebVitals: {
      lcp: Math.floor(Math.random() * 1500) + 1000, // 1000-2500ms
      fid: Math.floor(Math.random() * 100) + 50, // 50-150ms
      cls: Math.random() * 0.1 + 0.05, // 0.05-0.15
    },
    apiResponse: {
      p50: Math.floor(Math.random() * 100) + 100, // 100-200ms
      p95: Math.floor(Math.random() * 300) + 200, // 200-500ms
      p99: Math.floor(Math.random() * 500) + 500, // 500-1000ms
    },
    pageLoad: {
      homepage: Math.floor(Math.random() * 1000) + 1500, // 1500-2500ms
      dashboard: Math.floor(Math.random() * 1500) + 2000, // 2000-3500ms
      assessment: Math.floor(Math.random() * 1000) + 2000, // 2000-3000ms
    }
  }

  return performanceMetrics
}

async function getUserMetrics(startDate: Date): Promise<UserMetrics> {
  const [
    totalUsers,
    activeUsersLast24h,
    newRegistrationsToday,
    assessmentsCompletedToday
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    prisma.assessmentResult.count({
      where: {
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          not: null
        }
      }
    })
  ])

  // Calculate average session duration (simulated)
  const averageSessionDuration = Math.floor(Math.random() * 600) + 300 // 5-15 minutes

  // Calculate bounce rate (simulated)
  const bounceRate = Math.random() * 30 + 20 // 20-50%

  return {
    totalUsers,
    activeUsersLast24h,
    newRegistrationsToday,
    assessmentsCompletedToday,
    averageSessionDuration,
    bounceRate
  }
}

async function getActiveAlerts(): Promise<PerformanceAlert[]> {
  // In production, these would come from your alerting system
  const sampleAlerts: PerformanceAlert[] = []

  // Simulate some alerts based on current metrics
  const errorRate = Math.random() * 5
  const responseTime = Math.random() * 1000 + 200

  if (errorRate > 3) {
    sampleAlerts.push({
      id: 'alert-error-rate',
      type: 'warning',
      title: 'Elevated Error Rate',
      description: `Error rate has increased to ${errorRate.toFixed(1)}% over the last hour.`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      resolved: false,
      action: 'Check Logs'
    })
  }

  if (responseTime > 800) {
    sampleAlerts.push({
      id: 'alert-response-time',
      type: 'critical',
      title: 'High Response Time',
      description: `API response time is ${responseTime.toFixed(0)}ms, exceeding the 800ms threshold.`,
      timestamp: new Date(Date.now() - Math.random() * 1800000),
      resolved: false,
      action: 'Scale Resources'
    })
  }

  // Add some resolved alerts for demonstration
  sampleAlerts.push({
    id: 'alert-resolved-1',
    type: 'info',
    title: 'Database Connection Pool',
    description: 'Database connection pool was temporarily exhausted but has been resolved.',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    resolved: true
  })

  return sampleAlerts
}