"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Award,
  User,
  BookOpen,
  Brain,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react"

interface DetailedProgressReportProps {
  userId?: string
  timeframe?: '30d' | '90d' | '365d'
  className?: string
}

interface ProgressReport {
  user: {
    id: string
    name: string
    email: string
    joinedAt: Date
  }
  summary: {
    totalQualifications: number
    completedQualifications: number
    inProgressQualifications: number
    averageScore: number
    totalStudyTime: number
    achievementsEarned: number
  }
  qualificationProgress: any[]
  categoryAnalysis: any[]
  learningPatterns: any
  performanceTrends: any[]
  achievements: any[]
  recommendations: any
  insights: any
}

export function DetailedProgressReport({ 
  userId, 
  timeframe = '90d', 
  className 
}: DetailedProgressReportProps) {
  const [report, setReport] = useState<ProgressReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeAnalytics, setIncludeAnalytics] = useState(true)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        timeframe,
        includeAnalytics: includeAnalytics.toString()
      })
      
      if (userId) {
        params.append('userId', userId)
      }

      const response = await fetch(`/api/analytics/progress-report?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`)
      }

      const data = await response.json()
      setReport(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [userId, timeframe, includeAnalytics])

  const exportReport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!report) return

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'progress-report',
          format,
          data: report,
          userId: report.user.id,
          timeframe
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `progress-report-${report.user.id}-${timeframe}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Generating Progress Report...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReport} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!report) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getInsightColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              <div>
                <CardTitle>{report.user.name}</CardTitle>
                <CardDescription>
                  Member since {new Date(report.user.joinedAt).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportReport('pdf')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchReport}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {report.summary.totalQualifications}
            </div>
            <div className="text-sm text-muted-foreground">Total Qualifications</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {report.summary.completedQualifications}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(report.summary.averageScore)}`}>
              {report.summary.averageScore.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(report.summary.totalStudyTime / 60)}h
            </div>
            <div className="text-sm text-muted-foreground">Study Time</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {report.summary.achievementsEarned}
            </div>
            <div className="text-sm text-muted-foreground">Achievements</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getInsightColor(report.insights.burnoutRisk)}`}>
              {report.insights.burnoutRisk.toUpperCase()}
            </div>
            <div className="text-sm text-muted-foreground">Burnout Risk</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.categoryAnalysis.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={category.recommendedFocus ? "destructive" : "secondary"}>
                          {category.improvementTrend === 'improving' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : category.improvementTrend === 'declining' ? (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          ) : null}
                          {category.proficiency.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.proficiency} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.performanceTrends.slice(0, 6).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{trend.period}</div>
                        <div className="text-xs text-muted-foreground">
                          {trend.assessmentsCompleted} assessments
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getScoreColor(trend.averageScore)}`}>
                          {trend.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trend.studyTime}m study
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="qualifications">
          <div className="space-y-4">
            {report.qualificationProgress.map((qual, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{qual.qualification.title}</CardTitle>
                      <CardDescription>
                        {qual.qualification.category} • {qual.qualification.difficulty}
                      </CardDescription>
                    </div>
                    <Badge variant={qual.progress.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {qual.progress.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Progress</div>
                      <Progress value={qual.progress.completionPercentage} className="mb-2" />
                      <div className="text-sm text-muted-foreground">
                        {qual.progress.completionPercentage.toFixed(1)}% complete
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Performance</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Best Score:</span>
                          <span className={getScoreColor(qual.progress.bestScore || 0)}>
                            {qual.progress.bestScore?.toFixed(1) || 'N/A'}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Attempts:</span>
                          <span>{qual.progress.attempts}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Study Time:</span>
                          <span>{Math.round(qual.progress.studyTimeMinutes / 60)}h</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Analytics</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Learning Velocity:</span>
                          <span>{qual.analytics.learningVelocity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consistency:</span>
                          <span>{(qual.analytics.consistencyScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progression:</span>
                          <span className="capitalize">{qual.analytics.difficultyProgression}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {qual.progress.currentTopic && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">
                        Current Topic: {qual.progress.currentTopic}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of your learning performance across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Mastery Level:</span>
                      <Badge variant="outline" className="capitalize">
                        {report.insights.masteryLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Learning Efficiency:</span>
                      <span>{(report.insights.learningEfficiency * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retention Rate:</span>
                      <span>{(report.insights.retentionRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Burnout Risk:</span>
                      <Badge 
                        variant={report.insights.burnoutRisk === 'high' ? 'destructive' : 
                                report.insights.burnoutRisk === 'medium' ? 'secondary' : 'default'}
                        className="capitalize"
                      >
                        {report.insights.burnoutRisk}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Focus Areas:</div>
                      <div className="flex flex-wrap gap-1">
                        {report.recommendations.focusAreas.map((area: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Study Schedule:</div>
                      <div className="text-sm text-muted-foreground">
                        {report.recommendations.studySchedule.frequency} • {' '}
                        {report.recommendations.studySchedule.duration} minutes • {' '}
                        {report.recommendations.studySchedule.timing}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Difficulty Adjustment:</div>
                      <Badge 
                        variant={report.recommendations.difficultyAdjustment === 'increase' ? 'default' : 
                                report.recommendations.difficultyAdjustment === 'decrease' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {report.recommendations.difficultyAdjustment}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Study Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Preferred Study Times</div>
                    <div className="space-y-2">
                      {report.learningPatterns.preferredStudyTimes.slice(0, 3).map((time: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][time.dayOfWeek]} 
                            {' '}at {time.hour}:00
                          </span>
                          <span className="text-muted-foreground">Frequent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Session Metrics</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Average Duration:</span>
                        <span>{Math.round(report.learningPatterns.sessionDuration.average / 60)} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimal Duration:</span>
                        <span>{Math.round(report.learningPatterns.sessionDuration.optimal / 60)} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consistency Score:</span>
                        <span>{(report.learningPatterns.sessionDuration.consistency * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Streak Data</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {report.learningPatterns.engagementMetrics.streakData.current}
                        </div>
                        <div className="text-xs text-muted-foreground">Current Streak</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {report.learningPatterns.engagementMetrics.streakData.longest}
                        </div>
                        <div className="text-xs text-muted-foreground">Longest Streak</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Return Rate</div>
                    <Progress 
                      value={report.learningPatterns.engagementMetrics.returnRate * 100} 
                      className="mb-1" 
                    />
                    <div className="text-sm text-muted-foreground">
                      {(report.learningPatterns.engagementMetrics.returnRate * 100).toFixed(1)}% return rate
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Motivational Factors</div>
                    <div className="flex flex-wrap gap-1">
                      {report.learningPatterns.engagementMetrics.motivationalFactors.map((factor: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs capitalize">
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements Earned
              </CardTitle>
              <CardDescription>
                Your accomplishments and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {report.achievements.map((achievement, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Award className="h-6 w-6 text-yellow-500 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{achievement.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {achievement.category}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Learning Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Mastery Assessment</div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Based on your performance across all qualifications
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Current Level:</span>
                      <Badge variant="default" className="capitalize">
                        {report.insights.masteryLevel}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">Burnout Risk Analysis</div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Assessment of learning sustainability
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Risk Level:</span>
                      <Badge 
                        variant={report.insights.burnoutRisk === 'high' ? 'destructive' : 
                                report.insights.burnoutRisk === 'medium' ? 'secondary' : 'default'}
                        className="capitalize"
                      >
                        {report.insights.burnoutRisk}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium mb-2">Next Steps</div>
                    <ul className="space-y-1 text-sm">
                      {report.recommendations.nextSteps.map((step: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-2">Optimal Study Plan</div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium">
                          {report.recommendations.studySchedule.frequency} sessions
                        </div>
                        <div>
                          {report.recommendations.studySchedule.duration} minutes each
                        </div>
                        <div className="text-muted-foreground capitalize">
                          Best time: {report.recommendations.studySchedule.timing}
                        </div>
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