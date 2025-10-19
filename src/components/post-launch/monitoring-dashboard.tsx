"use client"

import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Server, 
  TrendingUp, 
  Users,
  Zap,
  RefreshCw,
  Bell,
  Settings
} from "lucide-react"
import { useState, useEffect } from 'react'

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface PostLaunchMonitoringProps {
  className?: string
}

export function PostLaunchMonitoring({ className }: PostLaunchMonitoringProps) {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/monitoring/dashboard?timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch monitoring data: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
    
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) {clearInterval(interval)}
    }
  }, [timeRange, autoRefresh])

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) {return 'text-green-600'}
    if (value <= thresholds.warning) {return 'text-yellow-600'}
    return 'text-red-600'
  }

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) {return 'healthy'}
    if (value <= thresholds.warning) {return 'warning'}
    return 'critical'
  }

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60))
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((uptime % (60 * 60)) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Monitoring Dashboard...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Monitoring Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMonitoringData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {return null}

  const criticalAlerts = data.alerts.filter(alert => alert.type === 'critical' && !alert.resolved)
  const warningAlerts = data.alerts.filter(alert => alert.type === 'warning' && !alert.resolved)

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post-Launch Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button onClick={fetchMonitoringData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="mb-6 space-y-3">
          {criticalAlerts.map((alert) => (
            <Alert key={alert.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>
                {alert.description}
                {alert.action && (
                  <Button className="mt-2" variant="outline" size="sm">
                    {alert.action}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
          {warningAlerts.map((alert) => (
            <Alert key={alert.id}>
              <Bell className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid gap-6 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.system.uptime.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatUptime(Date.now() / 1000 - (1 - data.system.uptime / 100) * 86400)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(data.system.responseTime, { good: 200, warning: 500 })}`}>
                  {data.system.responseTime}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average API response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(data.system.errorRate, { good: 1, warning: 5 })}`}>
                  {data.system.errorRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.system.activeUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resource Usage */}
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>Current resource utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className={`text-sm ${getHealthColor(data.system.cpuUsage, { good: 70, warning: 85 })}`}>
                      {data.system.cpuUsage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.system.cpuUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className={`text-sm ${getHealthColor(data.system.memoryUsage, { good: 70, warning: 85 })}`}>
                      {data.system.memoryUsage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.system.memoryUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className={`text-sm ${getHealthColor(data.system.diskUsage, { good: 70, warning: 85 })}`}>
                      {data.system.diskUsage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={data.system.diskUsage} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>Essential performance metrics for user experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Largest Contentful Paint (LCP)
                  </div>
                  <div className={`text-2xl font-bold ${getHealthColor(data.performance.coreWebVitals.lcp, { good: 2500, warning: 4000 })}`}>
                    {data.performance.coreWebVitals.lcp}ms
                  </div>
                  <Badge 
                    variant={getHealthStatus(data.performance.coreWebVitals.lcp, { good: 2500, warning: 4000 }) === 'healthy' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {getHealthStatus(data.performance.coreWebVitals.lcp, { good: 2500, warning: 4000 })}
                  </Badge>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    First Input Delay (FID)
                  </div>
                  <div className={`text-2xl font-bold ${getHealthColor(data.performance.coreWebVitals.fid, { good: 100, warning: 300 })}`}>
                    {data.performance.coreWebVitals.fid}ms
                  </div>
                  <Badge 
                    variant={getHealthStatus(data.performance.coreWebVitals.fid, { good: 100, warning: 300 }) === 'healthy' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {getHealthStatus(data.performance.coreWebVitals.fid, { good: 100, warning: 300 })}
                  </Badge>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Cumulative Layout Shift (CLS)
                  </div>
                  <div className={`text-2xl font-bold ${getHealthColor(data.performance.coreWebVitals.cls * 1000, { good: 100, warning: 250 })}`}>
                    {data.performance.coreWebVitals.cls.toFixed(3)}
                  </div>
                  <Badge 
                    variant={getHealthStatus(data.performance.coreWebVitals.cls * 1000, { good: 100, warning: 250 }) === 'healthy' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {getHealthStatus(data.performance.coreWebVitals.cls * 1000, { good: 100, warning: 250 })}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API Response Times</CardTitle>
                <CardDescription>Percentile distribution of API responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">50th Percentile (P50)</span>
                    <span className={`font-bold ${getHealthColor(data.performance.apiResponse.p50, { good: 200, warning: 500 })}`}>
                      {data.performance.apiResponse.p50}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">95th Percentile (P95)</span>
                    <span className={`font-bold ${getHealthColor(data.performance.apiResponse.p95, { good: 500, warning: 1000 })}`}>
                      {data.performance.apiResponse.p95}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">99th Percentile (P99)</span>
                    <span className={`font-bold ${getHealthColor(data.performance.apiResponse.p99, { good: 1000, warning: 2000 })}`}>
                      {data.performance.apiResponse.p99}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Load Times</CardTitle>
                <CardDescription>Average load times for key pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Homepage</span>
                    <span className={`font-bold ${getHealthColor(data.performance.pageLoad.homepage, { good: 2000, warning: 4000 })}`}>
                      {data.performance.pageLoad.homepage}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dashboard</span>
                    <span className={`font-bold ${getHealthColor(data.performance.pageLoad.dashboard, { good: 3000, warning: 5000 })}`}>
                      {data.performance.pageLoad.dashboard}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Assessment</span>
                    <span className={`font-bold ${getHealthColor(data.performance.pageLoad.assessment, { good: 2500, warning: 4500 })}`}>
                      {data.performance.pageLoad.assessment}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Metrics */}
          <div className="grid gap-6 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.users.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.users.activeUsersLast24h.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((data.users.activeUsersLast24h / data.users.totalUsers) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Registrations</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.users.newRegistrationsToday.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {data.users.assessmentsCompletedToday.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Behavior */}
          <Card>
            <CardHeader>
              <CardTitle>User Behavior Metrics</CardTitle>
              <CardDescription>Key engagement and retention indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Session Duration</span>
                    <span className="font-bold">
                      {Math.floor(data.users.averageSessionDuration / 60)}m {data.users.averageSessionDuration % 60}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <span className={`font-bold ${getHealthColor(data.users.bounceRate, { good: 30, warning: 50 })}`}>
                      {data.users.bounceRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Session Duration Distribution</div>
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    75% of users stay longer than 5 minutes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Real-time notifications and system health alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No active alerts. All systems are running smoothly!</p>
                  </div>
                ) : (
                  data.alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {alert.type === 'critical' && (
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                          )}
                          {alert.type === 'warning' && (
                            <Bell className="h-5 w-5 text-yellow-600 mt-1" />
                          )}
                          {alert.type === 'info' && (
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                          )}
                          <div>
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={alert.resolved ? 'secondary' : 
                              alert.type === 'critical' ? 'destructive' : 'default'}
                          >
                            {alert.resolved ? 'Resolved' : alert.type}
                          </Badge>
                          {alert.action && !alert.resolved && (
                            <Button size="sm" variant="outline">
                              {alert.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}