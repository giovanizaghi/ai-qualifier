/**
 * Monitoring and metrics types for health checks and performance tracking
 */

export interface HealthCheckStatus {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  lastChecked: Date
  error?: string
  details?: Record<string, any>
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: Date
  uptime: number
  version: string
  environment: string
  checks: HealthCheckStatus[]
  summary: {
    total: number
    healthy: number
    unhealthy: number
    degraded: number
  }
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface BusinessMetric {
  name: string
  value: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ErrorMetric {
  type: 'api_error' | 'qualification_error' | 'system_error'
  endpoint?: string
  errorCode?: string
  message: string
  stack?: string
  timestamp: Date
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface MetricsResponse {
  timestamp: Date
  performance: PerformanceMetric[]
  business: BusinessMetric[]
  errors: ErrorMetric[]
  summary: {
    totalRequests: number
    errorRate: number
    averageResponseTime: number
    activeUsers: number
    qualificationRuns: {
      total: number
      completed: number
      failed: number
      inProgress: number
    }
  }
}

export interface AlertRule {
  id: string
  name: string
  description: string
  condition: {
    metric: string
    operator: '>' | '<' | '==' | '>=' | '<='
    threshold: number
    timeWindow: number // minutes
  }
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  actions: string[] // email, slack, etc.
}

export interface Alert {
  id: string
  ruleId: string
  name: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'suppressed'
  triggeredAt: Date
  resolvedAt?: Date
  metadata?: Record<string, any>
}

export interface SystemHealth {
  cpu: {
    usage: number
    load: number[]
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  database: {
    connections: number
    queryTime: number
    status: 'connected' | 'disconnected' | 'slow'
  }
  external: {
    openai: HealthCheckStatus
    scraping: HealthCheckStatus
  }
}

export interface MonitoringConfig {
  healthChecks: {
    interval: number // seconds
    timeout: number // seconds
    retries: number
  }
  metrics: {
    retentionDays: number
    aggregationInterval: number // seconds
  }
  alerts: {
    enabled: boolean
    rules: AlertRule[]
  }
}