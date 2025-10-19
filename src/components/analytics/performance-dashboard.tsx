"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
} from "lucide-react"

interface PerformanceDashboardProps {
  className?: string
  isAdmin?: boolean
}

interface DashboardMetrics {
  overview: {
    totalUsers: number
    activeUsers: number
    totalAssessments: number
    averageScore: number
    completionRate: number
  }
  realTimeMetrics: {
    activeNow: number
    assessmentsInProgress: number
    questionsAnsweredToday: number
    newRegistrationsToday: number
  }
  performanceTrends: {
    period: string
    users: number
    assessments: number
    averageScore: number
    completionRate: number
  }[]
  categoryPerformance: {
    category: string
    totalQuestions: number
    averageScore: number
    completionRate: number
    trend: 'up' | 'down' | 'stable'
  }[]
  userEngagement: {
    dailyActiveUsers: { date: string; count: number }[]
    sessionDuration: { average: number; median: number }
    returnRate: number
    churnRate: number
  }
  contentHealth: {
    totalQuestions: number
    activeQuestions: number
    flaggedQuestions: number
    averageAccuracy: number
    contentGaps: string[]
  }
  alerts: {
    id: string
    type: 'warning' | 'error' | 'info'
    title: string
    description: string
    timestamp: Date
    resolved: boolean
  }[]
}

export function PerformanceDashboard({ className, isAdmin = false }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('7d')
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/analytics/performance-dashboard?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }

      const data = await response.json()
      setMetrics(data.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Set up auto-refresh for real-time metrics
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeframe])

  const exportDashboard = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance-dashboard',
          format,
          data: metrics,
          timeframe
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-dashboard-${timeframe}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (loading && !metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Performance Dashboard...
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
          <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportDashboard('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.realTimeMetrics.activeNow}
                </div>
                <div className="text-sm text-muted-foreground">Active Now</div>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.realTimeMetrics.assessmentsInProgress}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.realTimeMetrics.questionsAnsweredToday}
                </div>
                <div className="text-sm text-muted-foreground">Questions Today</div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.realTimeMetrics.newRegistrationsToday}
                </div>
                <div className="text-sm text-muted-foreground">New Users</div>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {metrics.alerts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.alerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 border rounded-lg ${
                    alert.type === 'error' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {alert.type === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="content">Content Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Overview Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>Key platform metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {metrics.overview.totalUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {metrics.overview.activeUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {metrics.overview.totalAssessments.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Assessments</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className={`text-xl font-bold ${getStatusColor(metrics.overview.averageScore, { good: 80, warning: 60 })}`}>
                      {metrics.overview.averageScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion Rate</span>
                    <span>{metrics.overview.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.overview.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Historical performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.performanceTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{trend.period}</div>
                        <div className="text-xs text-muted-foreground">
                          {trend.users} users • {trend.assessments} assessments
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getStatusColor(trend.averageScore, { good: 80, warning: 60 })}`}>
                          {trend.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trend.completionRate.toFixed(1)}% completion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance Analysis</CardTitle>
              <CardDescription>
                Performance breakdown by qualification categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.categoryPerformance.map((category, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.category}</span>
                        {getTrendIcon(category.trend)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{category.totalQuestions} questions</span>
                        <span className={getStatusColor(category.averageScore, { good: 80, warning: 60 })}>
                          {category.averageScore.toFixed(1)}% avg
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Average Score</div>
                        <Progress value={category.averageScore} className="h-2 mb-1" />
                        <div className="text-xs text-muted-foreground">
                          {category.averageScore.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                        <Progress value={category.completionRate} className="h-2 mb-1" />
                        <div className="text-xs text-muted-foreground">
                          {category.completionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>User activity and retention metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {(metrics.userEngagement.returnRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Return Rate</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">
                      {(metrics.userEngagement.churnRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Churn Rate</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Session Duration</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Average:</span>
                      <span>{Math.round(metrics.userEngagement.sessionDuration.average / 60)} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Median:</span>
                      <span>{Math.round(metrics.userEngagement.sessionDuration.median / 60)} minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>User activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.userEngagement.dailyActiveUsers.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(day.count / Math.max(...metrics.userEngagement.dailyActiveUsers.map(d => d.count))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Health Overview</CardTitle>
              <CardDescription>Assessment content quality and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {metrics.contentHealth.totalQuestions.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Questions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {metrics.contentHealth.activeQuestions.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Questions</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Content Accuracy</span>
                      <span className={getStatusColor(metrics.contentHealth.averageAccuracy, { good: 85, warning: 70 })}>
                        {metrics.contentHealth.averageAccuracy.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metrics.contentHealth.averageAccuracy} className="h-2" />
                  </div>
                  
                  {metrics.contentHealth.flaggedQuestions > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">
                          {metrics.contentHealth.flaggedQuestions} questions need review
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-3">Content Gaps</div>
                  {metrics.contentHealth.contentGaps.length > 0 ? (
                    <div className="space-y-2">
                      {metrics.contentHealth.contentGaps.map((gap, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          {gap}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No significant content gaps detected
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}