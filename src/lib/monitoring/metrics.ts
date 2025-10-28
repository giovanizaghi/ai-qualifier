/**
 * Metrics collection and monitoring system
 * Provides performance tracking, business metrics, and error monitoring
 */

import { 
  PerformanceMetric, 
  BusinessMetric, 
  ErrorMetric, 
  MetricsResponse,
  Alert,
  AlertRule
} from '@/types/monitoring'
import { prisma } from '@/lib/prisma'

class MetricsService {
  private performanceMetrics: PerformanceMetric[] = []
  private businessMetrics: BusinessMetric[] = []
  private errorMetrics: ErrorMetric[] = []
  private alerts: Alert[] = []
  private alertRules: AlertRule[] = []

  // In-memory storage for quick access (in production, use Redis)
  private metricsStore = new Map<string, any>()
  private readonly MAX_METRICS_RETENTION = 1000 // Keep last 1000 entries per type

  constructor() {
    this.initializeDefaultAlertRules()
    this.startMetricsCleanup()
  }

  /**
   * Record a performance metric
   */
  recordPerformance(name: string, value: number, unit: string, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    }

    this.performanceMetrics.push(metric)
    this.trimMetrics(this.performanceMetrics)
    this.checkAlertRules('performance', metric)
  }

  /**
   * Record a business metric
   */
  recordBusinessMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: BusinessMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata
    }

    this.businessMetrics.push(metric)
    this.trimMetrics(this.businessMetrics)
    this.checkAlertRules('business', metric)
  }

  /**
   * Record an error metric
   */
  recordError(
    type: ErrorMetric['type'],
    message: string,
    options: {
      endpoint?: string
      errorCode?: string
      stack?: string
      userId?: string
      sessionId?: string
      metadata?: Record<string, any>
    } = {}
  ) {
    const metric: ErrorMetric = {
      type,
      message,
      timestamp: new Date(),
      ...options
    }

    this.errorMetrics.push(metric)
    this.trimMetrics(this.errorMetrics)
    this.checkAlertRules('error', metric)
  }

  /**
   * Get comprehensive metrics response
   */
  async getMetrics(): Promise<MetricsResponse> {
    const summary = await this.calculateSummary()

    return {
      timestamp: new Date(),
      performance: this.getRecentMetrics(this.performanceMetrics, 100),
      business: this.getRecentMetrics(this.businessMetrics, 100),
      errors: this.getRecentMetrics(this.errorMetrics, 50),
      summary
    }
  }

  /**
   * Calculate summary statistics
   */
  private async calculateSummary() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Performance metrics
    const recentPerformance = this.performanceMetrics.filter(m => m.timestamp >= oneHourAgo)
    const totalRequests = recentPerformance.filter(m => m.name === 'api_request_count').reduce((sum, m) => sum + m.value, 0)
    const responseTimeMetrics = recentPerformance.filter(m => m.name === 'api_response_time')
    const averageResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 0

    // Error metrics
    const recentErrors = this.errorMetrics.filter(m => m.timestamp >= oneHourAgo)
    const errorRate = totalRequests > 0 ? (recentErrors.length / totalRequests) * 100 : 0

    // Business metrics
    const activeUsers = await this.getActiveUserCount()
    const qualificationStats = await this.getQualificationRunStats()

    return {
      totalRequests,
      errorRate,
      averageResponseTime,
      activeUsers,
      qualificationRuns: qualificationStats
    }
  }

  /**
   * Get active user count (last 24 hours)
   */
  private async getActiveUserCount(): Promise<number> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      // Count unique users who have active sessions (not expired)
      const activeUsers = await prisma.session.groupBy({
        by: ['userId'],
        where: {
          expires: {
            gte: twentyFourHoursAgo
          }
        }
      })

      return activeUsers.length
    } catch (error) {
      console.error('Error getting active user count:', error)
      return 0
    }
  }

  /**
   * Get qualification run statistics
   */
  private async getQualificationRunStats() {
    try {
      const stats = await prisma.qualificationRun.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })

      const result = {
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0
      }

      stats.forEach(stat => {
        result.total += stat._count.status
        switch (stat.status) {
          case 'COMPLETED':
            result.completed = stat._count.status
            break
          case 'FAILED':
            result.failed = stat._count.status
            break
          case 'PROCESSING':
            result.inProgress = stat._count.status
            break
        }
      })

      return result
    } catch (error) {
      console.error('Error getting qualification run stats:', error)
      return { total: 0, completed: 0, failed: 0, inProgress: 0 }
    }
  }

  /**
   * Get metrics for specific category and time range
   */
  getMetricsByCategory(category: 'performance' | 'business' | 'error', hours: number = 1) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    switch (category) {
      case 'performance':
        return this.performanceMetrics.filter(m => m.timestamp >= cutoff)
      case 'business':
        return this.businessMetrics.filter(m => m.timestamp >= cutoff)
      case 'error':
        return this.errorMetrics.filter(m => m.timestamp >= cutoff)
    }
  }

  /**
   * Get error rate for specific endpoint
   */
  getErrorRate(endpoint: string, hours: number = 1): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const recentErrors = this.errorMetrics.filter(m => 
      m.endpoint === endpoint && m.timestamp >= cutoff
    )
    const recentRequests = this.performanceMetrics.filter(m => 
      m.name === 'api_request_count' && 
      m.tags?.endpoint === endpoint && 
      m.timestamp >= cutoff
    )

    const totalRequests = recentRequests.reduce((sum, m) => sum + m.value, 0)
    return totalRequests > 0 ? (recentErrors.length / totalRequests) * 100 : 0
  }

  /**
   * Get average response time for endpoint
   */
  getAverageResponseTime(endpoint: string, hours: number = 1): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const responseTimeMetrics = this.performanceMetrics.filter(m => 
      m.name === 'api_response_time' && 
      m.tags?.endpoint === endpoint && 
      m.timestamp >= cutoff
    )

    if (responseTimeMetrics.length === 0) return 0
    return responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule) {
    this.alertRules.push(rule)
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.status === 'active')
  }

  /**
   * Check alert rules against new metric
   */
  private checkAlertRules(category: string, metric: any) {
    this.alertRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        if (this.shouldTriggerAlert(rule, metric)) {
          this.triggerAlert(rule, metric)
        }
      })
  }

  /**
   * Determine if alert should be triggered
   */
  private shouldTriggerAlert(rule: AlertRule, metric: any): boolean {
    const { condition } = rule
    const metricValue = this.getMetricValue(condition.metric, metric)
    
    if (metricValue === undefined) return false

    switch (condition.operator) {
      case '>':
        return metricValue > condition.threshold
      case '<':
        return metricValue < condition.threshold
      case '>=':
        return metricValue >= condition.threshold
      case '<=':
        return metricValue <= condition.threshold
      case '==':
        return metricValue === condition.threshold
      default:
        return false
    }
  }

  /**
   * Extract metric value based on metric name
   */
  private getMetricValue(metricName: string, metric: any): number | undefined {
    switch (metricName) {
      case 'error_rate':
        return this.getErrorRate(metric.endpoint || '', 1)
      case 'response_time':
        return metric.value
      case 'memory_usage':
        return process.memoryUsage().heapUsed / 1024 / 1024 // MB
      default:
        return metric.value
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, metric: any) {
    // Check if alert is already active
    const existingAlert = this.alerts.find(
      alert => alert.ruleId === rule.id && alert.status === 'active'
    )

    if (existingAlert) return // Don't trigger duplicate alerts

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      name: rule.name,
      message: `${rule.description} - Current value: ${metric.value}`,
      severity: rule.severity,
      status: 'active',
      triggeredAt: new Date(),
      metadata: { metric, rule: rule.condition }
    }

    this.alerts.push(alert)
    
    // In production, would send notifications here
    console.warn(`ALERT: ${alert.name} - ${alert.message}`)
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules() {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 5%',
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 5,
          timeWindow: 5
        },
        enabled: true,
        severity: 'high',
        actions: ['email', 'slack']
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: 'Average response time exceeds 3 seconds',
        condition: {
          metric: 'response_time',
          operator: '>',
          threshold: 3000,
          timeWindow: 5
        },
        enabled: true,
        severity: 'medium',
        actions: ['slack']
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 80%',
        condition: {
          metric: 'memory_usage',
          operator: '>',
          threshold: 80,
          timeWindow: 1
        },
        enabled: true,
        severity: 'medium',
        actions: ['email']
      }
    ]
  }

  /**
   * Get recent metrics (last N entries)
   */
  private getRecentMetrics<T>(metrics: T[], count: number): T[] {
    return metrics.slice(-count)
  }

  /**
   * Trim metrics arrays to prevent memory leaks
   */
  private trimMetrics<T>(metrics: T[]) {
    if (metrics.length > this.MAX_METRICS_RETENTION) {
      metrics.splice(0, metrics.length - this.MAX_METRICS_RETENTION)
    }
  }

  /**
   * Start periodic cleanup of old data
   */
  private startMetricsCleanup() {
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours

      // Clean old metrics
      this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp >= cutoff)
      this.businessMetrics = this.businessMetrics.filter(m => m.timestamp >= cutoff)
      this.errorMetrics = this.errorMetrics.filter(m => m.timestamp >= cutoff)

      // Clean resolved alerts older than 7 days
      const alertCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      this.alerts = this.alerts.filter(alert => 
        alert.status === 'active' || (alert.resolvedAt && alert.resolvedAt >= alertCutoff)
      )
    }, 60 * 60 * 1000) // Run every hour
  }

  /**
   * Clear all metrics (for testing)
   */
  clearAll() {
    this.performanceMetrics = []
    this.businessMetrics = []
    this.errorMetrics = []
    this.alerts = []
  }

  /**
   * Get metrics summary for dashboard
   */
  getDashboardSummary() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const recentErrors = this.errorMetrics.filter(m => m.timestamp >= oneHourAgo)
    const recentPerformance = this.performanceMetrics.filter(m => m.timestamp >= oneHourAgo)

    return {
      errorCount: recentErrors.length,
      averageResponseTime: this.getAverageResponseTime('', 1),
      activeAlerts: this.getActiveAlerts().length,
      totalMetrics: this.performanceMetrics.length + this.businessMetrics.length + this.errorMetrics.length
    }
  }
}

// Export singleton instance
export const metricsService = new MetricsService()

// Export class for testing
export { MetricsService }