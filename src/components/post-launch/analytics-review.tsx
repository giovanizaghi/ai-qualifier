"use client"

import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Target,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  MousePointer,
  Smartphone,
  Globe,
  Award,
  BookOpen
} from "lucide-react"
import { useState, useEffect } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserBehaviorMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  averageSessionDuration: number
  bounceRate: number
  pageViews: number
  uniquePageViews: number
  conversionRate: number
}

interface FeatureUsageMetrics {
  assessments: {
    totalStarted: number
    totalCompleted: number
    averageScore: number
    completionRate: number
    mostPopularCategories: { name: string; count: number }[]
  }
  dashboard: {
    dailyActiveUsers: number
    averageTimeSpent: number
    featureUtilization: { feature: string; usage: number }[]
  }
  qualifications: {
    totalEnrollments: number
    completionRate: number
    averageTimeToComplete: number
    topPerformingQualifications: { name: string; score: number }[]
  }
}

interface TechnicalMetrics {
  pageLoadTimes: {
    average: number
    p50: number
    p95: number
    p99: number
  }
  apiPerformance: {
    averageResponseTime: number
    errorRate: number
    throughput: number
  }
  deviceBreakdown: { device: string; percentage: number }[]
  browserBreakdown: { browser: string; percentage: number }[]
  geographicDistribution: { country: string; users: number }[]
}

interface PostLaunchAnalyticsData {
  userBehavior: UserBehaviorMetrics
  featureUsage: FeatureUsageMetrics
  technical: TechnicalMetrics
  trends: {
    userGrowth: { date: string; users: number }[]
    assessmentVolume: { date: string; assessments: number }[]
    engagementTrends: { date: string; engagement: number }[]
  }
}

interface PostLaunchAnalyticsProps {
  className?: string
}

export function PostLaunchAnalytics({ className }: PostLaunchAnalyticsProps) {
  const [data, setData] = useState<PostLaunchAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedTab, setSelectedTab] = useState('overview')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/post-launch?timeRange=${timeRange}`)
      
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
  }, [timeRange])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'post-launch-analytics',
          format,
          timeRange,
          data
        })
      })

      if (!response.ok) {throw new Error('Export failed')}

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `post-launch-analytics-${timeRange}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Analytics Dashboard...
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
          <CardTitle className="text-red-600">Error Loading Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {return null}

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post-Launch Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of user behavior and platform performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => exportReport('pdf')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Behavior</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid gap-6 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.userBehavior.totalUsers.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(data.userBehavior.totalUsers, data.userBehavior.totalUsers * 0.85)}
                  +{((data.userBehavior.newUsers / data.userBehavior.totalUsers) * 100).toFixed(1)}% new
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.userBehavior.activeUsers.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  {formatPercentage((data.userBehavior.activeUsers / data.userBehavior.totalUsers) * 100)} engagement
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.featureUsage.assessments.totalCompleted.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  {formatPercentage(data.featureUsage.assessments.completionRate)} completion rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatDuration(data.userBehavior.averageSessionDuration)}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatPercentage(100 - data.userBehavior.bounceRate)} retention
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Qualifications</CardTitle>
                <CardDescription>Highest completion rates and scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.featureUsage.qualifications.topPerformingQualifications.map((qual, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">{qual.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {qual.score.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">avg score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Utilization</CardTitle>
                <CardDescription>Most used platform features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.featureUsage.dashboard.featureUtilization.map((feature, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{feature.feature}</span>
                        <span className="text-sm">{formatPercentage(feature.usage)}</span>
                      </div>
                      <Progress value={feature.usage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Behavior Metrics */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Activity and retention metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="font-bold text-green-600">
                      {data.userBehavior.activeUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Users</span>
                    <span className="font-bold text-blue-600">
                      {data.userBehavior.newUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Returning Users</span>
                    <span className="font-bold text-purple-600">
                      {data.userBehavior.returningUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <span className={`font-bold ${data.userBehavior.bounceRate < 40 ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatPercentage(data.userBehavior.bounceRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Analytics</CardTitle>
                <CardDescription>Page views and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Page Views</span>
                    <span className="font-bold">
                      {data.userBehavior.pageViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Unique Page Views</span>
                    <span className="font-bold">
                      {data.userBehavior.uniquePageViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Session Duration</span>
                    <span className="font-bold text-purple-600">
                      {formatDuration(data.userBehavior.averageSessionDuration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(data.userBehavior.conversionRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.technical.geographicDistribution.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <span className="font-medium">{country.users.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Feature Usage Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Analytics</CardTitle>
                <CardDescription>Assessment usage and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {data.featureUsage.assessments.totalStarted.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Started</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {data.featureUsage.assessments.totalCompleted.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="font-bold text-green-600">
                        {formatPercentage(data.featureUsage.assessments.completionRate)}
                      </span>
                    </div>
                    <Progress value={data.featureUsage.assessments.completionRate} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Score</span>
                    <span className="font-bold text-purple-600">
                      {data.featureUsage.assessments.averageScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
                <CardDescription>Most accessed assessment categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.featureUsage.assessments.mostPopularCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{category.count.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">assessments</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Usage</CardTitle>
              <CardDescription>User engagement with dashboard features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.featureUsage.dashboard.dailyActiveUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Daily Active Users</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatDuration(data.featureUsage.dashboard.averageTimeSpent)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Time Spent</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.featureUsage.qualifications.totalEnrollments.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Enrollments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          {/* Technical Performance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Page load times and API performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Load Time</span>
                      <span className="font-bold">{data.technical.pageLoadTimes.average}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">50th Percentile</span>
                      <span className="font-bold">{data.technical.pageLoadTimes.p50}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">95th Percentile</span>
                      <span className="font-bold">{data.technical.pageLoadTimes.p95}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">API Response Time</span>
                      <span className="font-bold">{data.technical.apiPerformance.averageResponseTime}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className={`font-bold ${data.technical.apiPerformance.errorRate < 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(data.technical.apiPerformance.errorRate)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device & Browser Breakdown</CardTitle>
                <CardDescription>User device and browser statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Device Types</h4>
                    <div className="space-y-2">
                      {data.technical.deviceBreakdown.map((device, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{device.device}</span>
                          </div>
                          <span className="font-medium">{formatPercentage(device.percentage)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Top Browsers</h4>
                    <div className="space-y-2">
                      {data.technical.browserBreakdown.slice(0, 3).map((browser, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{browser.browser}</span>
                          </div>
                          <span className="font-medium">{formatPercentage(browser.percentage)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>
                  User growth, assessment volume, and engagement trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Recent Trends Overview</h4>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          +{data.trends.userGrowth[data.trends.userGrowth.length - 1]?.users || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">New Users (Last Period)</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {data.trends.assessmentVolume[data.trends.assessmentVolume.length - 1]?.assessments || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Assessments (Last Period)</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {data.trends.engagementTrends[data.trends.engagementTrends.length - 1]?.engagement.toFixed(1) || 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Engagement Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}