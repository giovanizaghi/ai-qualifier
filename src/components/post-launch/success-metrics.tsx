"use client"

import { 
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  Clock,
  Star,
  ThumbsUp,
  AlertTriangle,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { useState, useEffect } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SuccessMetric {
  id: string
  name: string
  description: string
  category: 'business' | 'user' | 'technical' | 'engagement'
  target: number
  current: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  status: 'on_track' | 'at_risk' | 'behind' | 'exceeded'
  isKPI: boolean
  lastUpdated: Date
}

interface BusinessMetrics {
  revenue: {
    monthly: number
    target: number
    growth: number
  }
  users: {
    total: number
    active: number
    retention: number
    acquisition: number
  }
  conversion: {
    signupToActive: number
    freeToPayment: number
    trialToSubscription: number
  }
  qualifications: {
    completionRate: number
    averageScore: number
    certificatesIssued: number
  }
}

interface PerformanceComparison {
  metric: string
  previous: number
  current: number
  change: number
  target: number
  status: 'improved' | 'declined' | 'stable'
}

interface SuccessMetricsData {
  metrics: SuccessMetric[]
  business: BusinessMetrics
  comparisons: PerformanceComparison[]
  goals: {
    achieved: number
    total: number
    onTrack: number
    atRisk: number
  }
  insights: string[]
  recommendations: string[]
}

interface SuccessMetricsProps {
  className?: string
}

export function SuccessMetrics({ className }: SuccessMetricsProps) {
  const [data, setData] = useState<SuccessMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/success-metrics?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch success metrics: ${response.statusText}`)
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
    fetchMetrics()
  }, [timeframe])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-green-100 text-green-800'
      case 'on_track': return 'bg-blue-100 text-blue-800'
      case 'at_risk': return 'bg-yellow-100 text-yellow-800'
      case 'behind': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'business': return <DollarSign className="h-4 w-4" />
      case 'user': return <Users className="h-4 w-4" />
      case 'technical': return <BarChart3 className="h-4 w-4" />
      case 'engagement': return <ThumbsUp className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {return `${value.toFixed(1)}%`}
    if (unit === '$') {return `$${value.toLocaleString()}`}
    if (unit === 'days') {return `${value} days`}
    return value.toLocaleString()
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const exportReport = async () => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'success-metrics',
          timeframe,
          data
        })
      })

      if (!response.ok) {throw new Error('Export failed')}

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `success-metrics-${timeframe}.pdf`
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
            Loading Success Metrics...
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
          <CardTitle className="text-red-600">Error Loading Success Metrics</CardTitle>
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

  if (!data) {return null}

  const filteredMetrics = selectedCategory === 'all' 
    ? data.metrics 
    : data.metrics.filter(m => m.category === selectedCategory)

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Success Metrics Evaluation</h1>
          <p className="text-muted-foreground">
            Track progress against goals and measure platform success
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Goals Overview */}
      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Achieved</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.goals.achieved}</div>
            <p className="text-xs text-muted-foreground">
              Out of {data.goals.total} total goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.goals.onTrack}</div>
            <p className="text-xs text-muted-foreground">
              Meeting expectations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.goals.atRisk}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {((data.goals.achieved / data.goals.total) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">All Metrics</TabsTrigger>
          <TabsTrigger value="business">Business KPIs</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Most critical metrics for platform success</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.metrics.filter(m => m.isKPI).map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(metric.category)}
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current</span>
                        <span className="font-bold">
                          {formatValue(metric.current, metric.unit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Target</span>
                        <span className="text-sm">
                          {formatValue(metric.target, metric.unit)}
                        </span>
                      </div>
                      <Progress 
                        value={calculateProgress(metric.current, metric.target)} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {calculateProgress(metric.current, metric.target).toFixed(1)}% of target
                        </span>
                        <span className={`font-medium ${metric.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Current period vs previous period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.comparisons.map((comparison, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="font-medium">{comparison.metric}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground">Previous</div>
                        <div className="font-medium">{comparison.previous.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Current</div>
                        <div className="font-medium">{comparison.current.toLocaleString()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Change</div>
                        <div className={`font-medium ${comparison.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {comparison.change >= 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">vs Target</div>
                        <div className="font-medium">
                          {((comparison.current / comparison.target) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Success Metrics</CardTitle>
              <CardDescription>
                Complete view of all tracked metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMetrics.map((metric) => (
                  <div key={metric.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getCategoryIcon(metric.category)}
                          <span className="font-medium">{metric.name}</span>
                          {metric.isKPI && (
                            <Badge variant="outline" className="text-xs">KPI</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {metric.description}
                        </p>
                        
                        <div className="grid gap-4 lg:grid-cols-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Current Value</div>
                            <div className="font-bold text-lg">
                              {formatValue(metric.current, metric.unit)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Target</div>
                            <div className="font-medium">
                              {formatValue(metric.target, metric.unit)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Progress</div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={calculateProgress(metric.current, metric.target)} 
                                className="h-1.5 flex-1" 
                              />
                              <span className="text-sm font-medium">
                                {calculateProgress(metric.current, metric.target).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Trend</div>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(metric.trend)}
                              <span className={`text-sm font-medium ${
                                metric.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status.replace('_', ' ')}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Updated {metric.lastUpdated.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          {/* Business Metrics Dashboard */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Financial performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Revenue</span>
                    <span className="font-bold text-green-600">
                      ${data.business.revenue.monthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Target</span>
                    <span className="text-sm">
                      ${data.business.revenue.target.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(data.business.revenue.monthly / data.business.revenue.target) * 100} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {((data.business.revenue.monthly / data.business.revenue.target) * 100).toFixed(1)}% of target
                    </span>
                    <span className="font-medium text-green-600">
                      +{data.business.revenue.growth.toFixed(1)}% growth
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
                <CardDescription>User acquisition and retention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {data.business.users.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {data.business.users.active.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">
                      {data.business.users.retention.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Retention</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {data.business.users.acquisition.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">New Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
                <CardDescription>User journey conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Signup to Active</span>
                      <span className="font-bold">{data.business.conversion.signupToActive.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.business.conversion.signupToActive} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Free to Payment</span>
                      <span className="font-bold">{data.business.conversion.freeToPayment.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.business.conversion.freeToPayment} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Trial to Subscription</span>
                      <span className="font-bold">{data.business.conversion.trialToSubscription.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.business.conversion.trialToSubscription} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualification Metrics</CardTitle>
                <CardDescription>Assessment and certification performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="font-bold text-green-600">
                      {data.business.qualifications.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Score</span>
                    <span className="font-bold text-blue-600">
                      {data.business.qualifications.averageScore.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Certificates Issued</span>
                    <span className="font-bold text-purple-600">
                      {data.business.qualifications.certificatesIssued.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Data-driven insights from your metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable recommendations to improve performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <ArrowUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}