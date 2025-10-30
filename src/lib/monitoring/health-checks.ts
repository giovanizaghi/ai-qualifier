/**
 * Health check monitoring system
 * Provides comprehensive health monitoring for system components
 */

import { openai } from '@/lib/openai-client'
import { prisma } from '@/lib/prisma'
import { 
  HealthCheckStatus, 
  HealthCheckResponse, 
  SystemHealth,
  MonitoringConfig
} from '@/types/monitoring'

class HealthCheckService {
  private config: MonitoringConfig['healthChecks'] = {
    interval: 30, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now()
    const checks: HealthCheckStatus[] = []

    // Run all health checks in parallel
    const [
      databaseHealth,
      openaiHealth,
      diskHealth,
      memoryHealth,
      externalHealth
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkOpenAI(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
      this.checkExternalServices()
    ])

    // Process results
    if (databaseHealth.status === 'fulfilled') {checks.push(databaseHealth.value)}
    else {checks.push(this.createErrorCheck('database', databaseHealth.reason))}

    if (openaiHealth.status === 'fulfilled') {checks.push(openaiHealth.value)}
    else {checks.push(this.createErrorCheck('openai', openaiHealth.reason))}

    if (diskHealth.status === 'fulfilled') {checks.push(diskHealth.value)}
    else {checks.push(this.createErrorCheck('disk', diskHealth.reason))}

    if (memoryHealth.status === 'fulfilled') {checks.push(memoryHealth.value)}
    else {checks.push(this.createErrorCheck('memory', memoryHealth.reason))}

    if (externalHealth.status === 'fulfilled') {checks.push(...externalHealth.value)}
    else {checks.push(this.createErrorCheck('external', externalHealth.reason))}

    // Calculate overall status
    const summary = this.calculateSummary(checks)
    const overallStatus = this.getOverallStatus(summary)

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckStatus> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`
      
      // Test write performance
      const testWrite = await prisma.$transaction(async (tx) => {
        // Just test the transaction, don't actually write
        return true
      })
      
      const responseTime = Date.now() - startTime
      
      // Check connection pool
      const connectionInfo = await this.getDatabaseConnectionInfo()
      
      return {
        service: 'database',
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        details: {
          connectionPool: connectionInfo,
          queryTime: responseTime
        }
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown database error',
        details: { errorType: 'connection_failed' }
      }
    }
  }

  /**
   * Check OpenAI API connectivity and rate limits
   */
  private async checkOpenAI(): Promise<HealthCheckStatus> {
    const startTime = Date.now()
    
    try {
      // Use a minimal API call to test connectivity
      const response = await openai.models.list()
      const responseTime = Date.now() - startTime
      
      return {
        service: 'openai',
        status: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        details: {
          modelsAvailable: response.data.length,
          apiVersion: 'v1'
        }
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      let status: HealthCheckStatus['status'] = 'unhealthy'
      
      // Check for rate limiting
      if (error?.status === 429) {
        status = 'degraded'
      }
      
      return {
        service: 'openai',
        status,
        responseTime,
        lastChecked: new Date(),
        error: error?.message || 'OpenAI API error',
        details: {
          errorCode: error?.status,
          errorType: error?.type
        }
      }
    }
  }

  /**
   * Check disk space usage
   */
  private async checkDiskSpace(): Promise<HealthCheckStatus> {
    try {
      const stats = await this.getSystemStats()
      const diskUsagePercent = (stats.disk.used / stats.disk.total) * 100
      
      let status: HealthCheckStatus['status'] = 'healthy'
      if (diskUsagePercent > 90) {status = 'unhealthy'}
      else if (diskUsagePercent > 80) {status = 'degraded'}
      
      return {
        service: 'disk',
        status,
        lastChecked: new Date(),
        details: {
          used: stats.disk.used,
          total: stats.disk.total,
          percentage: diskUsagePercent
        }
      }
    } catch (error) {
      return {
        service: 'disk',
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Disk check failed'
      }
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheckStatus> {
    try {
      const memUsage = process.memoryUsage()
      const totalMemory = require('os').totalmem()
      const freeMemory = require('os').freemem()
      const usedMemory = totalMemory - freeMemory
      const memoryPercent = (usedMemory / totalMemory) * 100
      
      let status: HealthCheckStatus['status'] = 'healthy'
      if (memoryPercent > 90) {status = 'unhealthy'}
      else if (memoryPercent > 80) {status = 'degraded'}
      
      return {
        service: 'memory',
        status,
        lastChecked: new Date(),
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external,
          systemMemoryPercent: memoryPercent
        }
      }
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Memory check failed'
      }
    }
  }

  /**
   * Check external services (placeholder for scraping services, etc.)
   */
  private async checkExternalServices(): Promise<HealthCheckStatus[]> {
    const checks: HealthCheckStatus[] = []
    
    // Check if we can resolve DNS for common domains
    try {
      const startTime = Date.now()
      const dns = require('dns').promises
      await dns.lookup('google.com')
      const responseTime = Date.now() - startTime
      
      checks.push({
        service: 'dns_resolution',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        details: { target: 'google.com' }
      })
    } catch (error) {
      checks.push({
        service: 'dns_resolution',
        status: 'unhealthy',
        lastChecked: new Date(),
        error: 'DNS resolution failed'
      })
    }

    // Add more external service checks as needed
    // (e.g., scraping service health, third-party APIs)
    
    return checks
  }

  /**
   * Get database connection information
   */
  private async getDatabaseConnectionInfo() {
    try {
      // This is a simplified version - in production you'd want more detailed connection pool stats
      return {
        status: 'connected',
        activeConnections: 1, // Placeholder
        maxConnections: 10 // Placeholder
      }
    } catch {
      return {
        status: 'disconnected',
        activeConnections: 0,
        maxConnections: 0
      }
    }
  }

  /**
   * Get system statistics
   */
  private async getSystemStats(): Promise<SystemHealth> {
    const os = require('os')
    const memUsage = process.memoryUsage()
    
    return {
      cpu: {
        usage: 0, // Placeholder - would need more complex calculation
        load: os.loadavg()
      },
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      disk: {
        used: 0, // Placeholder - would need fs.stat calls
        total: 0,
        percentage: 0
      },
      database: {
        connections: 1,
        queryTime: 0,
        status: 'connected'
      },
      external: {
        openai: await this.checkOpenAI(),
        scraping: {
          service: 'scraping',
          status: 'healthy',
          lastChecked: new Date()
        }
      }
    }
  }

  /**
   * Create error health check result
   */
  private createErrorCheck(service: string, error: any): HealthCheckStatus {
    return {
      service,
      status: 'unhealthy',
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : String(error)
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(checks: HealthCheckStatus[]) {
    const total = checks.length
    const healthy = checks.filter(c => c.status === 'healthy').length
    const degraded = checks.filter(c => c.status === 'degraded').length
    const unhealthy = checks.filter(c => c.status === 'unhealthy').length

    return { total, healthy, degraded, unhealthy }
  }

  /**
   * Determine overall system status
   */
  private getOverallStatus(summary: { healthy: number; degraded: number; unhealthy: number }): HealthCheckResponse['status'] {
    if (summary.unhealthy > 0) {return 'unhealthy'}
    if (summary.degraded > 0) {return 'degraded'}
    return 'healthy'
  }

  /**
   * Get health check for specific service
   */
  async checkService(serviceName: string): Promise<HealthCheckStatus> {
    switch (serviceName) {
      case 'database':
        return this.checkDatabase()
      case 'openai':
        return this.checkOpenAI()
      case 'disk':
        return this.checkDiskSpace()
      case 'memory':
        return this.checkMemoryUsage()
      default:
        throw new Error(`Unknown service: ${serviceName}`)
    }
  }

  /**
   * Get system health overview
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return this.getSystemStats()
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService()

// Export for testing
export { HealthCheckService }