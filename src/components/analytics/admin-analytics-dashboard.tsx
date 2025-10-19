"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Clock,
  Target,
  Zap
} from "lucide-react"

interface AdminAnalyticsData {
  systemOverview: {
    totalUsers: number
    activeUsers: number
    totalQualifications: number
    totalQuestions: number
    platformHealth: 'excellent' | 'good' | 'warning' | 'critical'
    uptime: number
  }
  userMetrics: {
    newRegistrations: { period: string; count: number }[]
    userRetention: {
      day1: number
      day7: number
      day30: number
    }
    userSegmentation: {
      segment: string
      count: number
      percentage: number
      growthRate: number
    }[]
    topPerformers: {
      userId: string
      name: string
      score: number
      qualificationsCompleted: number
    }[]
  }
  contentAnalytics: {
    questionPerformance: {
      questionId: string
      title: string
      category: string
      difficulty: string
      successRate: number
      usageCount: number
      issues: string[]
    }[]
    categoryInsights: {
      category: string
      totalQuestions: number
      averageSuccessRate: number
      userEngagement: number
      contentGaps: string[]
    }[]
    qualificationStats: {
      qualificationId: string
      title: string
      enrollments: number
      completionRate: number
      averageScore: number
      timeToComplete: number
    }[]
  }
  platformInsights: {
    peakUsageHours: { hour: number; userCount: number }[]
    deviceDistribution: { device: string; percentage: number }[]
    geographicDistribution: { country: string; userCount: number }[]
    errorRates: { endpoint: string; errorRate: number; trend: 'up' | 'down' | 'stable' }[]
  }
  businessMetrics: {
    conversionFunnels: {
      stage: string
      count: number
      conversionRate: number
    }[]
    revenueMetrics: {
      period: string
      revenue: number
      growth: number
    }[]
    costMetrics: {
      infrastructureCost: number
      operationalCost: number
      costPerUser: number
    }
  }
  alerts: {
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: 'performance' | 'security' | 'content' | 'user'
    title: string
    description: string
    timestamp: Date
    status: 'open' | 'investigating' | 'resolved'
    assignedTo?: string
  }[]
}

interface AdminAnalyticsDashboardProps {
  className?: string
}

export function AdminAnalyticsDashboard({ className }: AdminAnalyticsDashboardProps) {
  const [data, setData] = useState<AdminAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
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
    fetchAnalytics()
  }, [timeframe])

  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          timeframe,
          data
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-analytics-${timeframe}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading && !data) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading Admin Analytics...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Admin Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform insights and system monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {data.systemOverview.totalUsers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {data.systemOverview.activeUsers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {data.systemOverview.totalQualifications}
                </div>
                <div className="text-sm text-muted-foreground">Qualifications</div>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getHealthColor(data.systemOverview.platformHealth)}`}>
                  {data.systemOverview.platformHealth.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">Platform Health</div>
              </div>
              <Zap className={`h-8 w-8 ${getHealthColor(data.systemOverview.platformHealth)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {data.alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts
                .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
                .slice(0, 3)
                .map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {alert.severity === 'critical' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground">{alert.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth & Retention</CardTitle>
                <CardDescription>User acquisition and retention metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {(data.userMetrics.userRetention.day1 * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">1-Day Retention</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {(data.userMetrics.userRetention.day7 * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">7-Day Retention</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {(data.userMetrics.userRetention.day30 * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">30-Day Retention</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">User Segmentation</h4>
                    <div className="space-y-2">
                      {data.userMetrics.userSegmentation.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{segment.segment}</span>
                            <Badge variant="outline">{segment.count}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span>{segment.percentage.toFixed(1)}%</span>
                            {segment.growthRate > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={segment.growthRate > 0 ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(segment.growthRate).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest achieving users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userMetrics.topPerformers.map((performer, index) => (
                    <div key={performer.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{performer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {performer.qualificationsCompleted} qualifications completed
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{performer.score.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">avg score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Overview</CardTitle>
                <CardDescription>Assessment content quality and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-3">
                  {data.contentAnalytics.categoryInsights.map((category, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">{category.category}</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <span>{category.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success Rate:</span>
                          <span className={category.averageSuccessRate > 80 ? 'text-green-600' : 'text-yellow-600'}>
                            {category.averageSuccessRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Engagement:</span>
                          <span>{category.userEngagement.toFixed(1)}%</span>
                        </div>
                        {category.contentGaps.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Content Gaps:</div>
                            {category.contentGaps.map((gap, gapIndex) => (
                              <Badge key={gapIndex} variant="outline" className="text-xs mr-1 mb-1">
                                {gap}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Performance Issues</CardTitle>
                <CardDescription>Questions requiring review or optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.contentAnalytics.questionPerformance
                    .filter(q => q.issues.length > 0)
                    .slice(0, 10)
                    .map((question) => (
                      <div key={question.questionId} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{question.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {question.category} • {question.difficulty} • Used {question.usageCount} times
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {question.issues.map((issue, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`font-bold ${
                              question.successRate > 80 ? 'text-green-600' : 
                              question.successRate > 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {question.successRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">success rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platform">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Usage Patterns</CardTitle>
                <CardDescription>User activity and system performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Peak Usage Hours</h4>
                    <div className="space-y-2">
                      {data.platformInsights.peakUsageHours.slice(0, 5).map((hour, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{hour.hour}:00</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${(hour.userCount / Math.max(...data.platformInsights.peakUsageHours.map(h => h.userCount))) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{hour.userCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Error Rates</h4>
                    <div className="space-y-2">
                      {data.platformInsights.errorRates.map((error, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{error.endpoint}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${
                              error.errorRate > 5 ? 'text-red-600' : 
                              error.errorRate > 2 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {error.errorRate.toFixed(2)}%
                            </span>
                            {error.trend === 'up' ? (
                              <TrendingUp className="h-3 w-3 text-red-600" />
                            ) : error.trend === 'down' ? (
                              <TrendingDown className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic & Device Distribution</CardTitle>
                <CardDescription>User demographics and access patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Top Countries</h4>
                    <div className="space-y-2">
                      {data.platformInsights.geographicDistribution.slice(0, 5).map((country, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{country.country}</span>
                          <span className="text-sm font-medium">{country.userCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Device Types</h4>
                    <div className="space-y-2">
                      {data.platformInsights.deviceDistribution.map((device, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{device.device}</span>
                          <span className="text-sm font-medium">{device.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics & Performance</CardTitle>
              <CardDescription>Revenue, costs, and conversion analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Conversion Funnel</h4>
                    <div className="space-y-2">
                      {data.businessMetrics.conversionFunnels.map((stage, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{stage.stage}</span>
                            <span className="text-sm text-muted-foreground">{stage.count}</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${stage.conversionRate}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {stage.conversionRate.toFixed(1)}% conversion
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Cost Analysis</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          ${data.businessMetrics.costMetrics.infrastructureCost.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Infrastructure Cost</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          ${data.businessMetrics.costMetrics.operationalCost.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Operational Cost</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          ${data.businessMetrics.costMetrics.costPerUser.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Cost Per User</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts & Monitoring</CardTitle>
              <CardDescription>All platform alerts and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {alert.severity === 'critical' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : alert.severity === 'high' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">{alert.description}</div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">{alert.category}</Badge>
                            <Badge variant={alert.status === 'resolved' ? 'default' : 'secondary'}>
                              {alert.status}
                            </Badge>
                            {alert.assignedTo && (
                              <span className="text-xs text-muted-foreground">
                                Assigned to: {alert.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}