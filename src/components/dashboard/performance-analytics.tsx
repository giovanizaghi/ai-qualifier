"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3, Clock, Target, Award } from "lucide-react"

interface PerformanceData {
  overallScore: number
  averageScore: number
  bestScore: number
  totalAssessments: number
  passedAssessments: number
  totalStudyTime: number // in minutes
  currentStreak: number
  longestStreak: number
  categoryScores: {
    category: string
    score: number
    assessments: number
    trend: 'up' | 'down' | 'stable'
  }[]
  recentTrends: {
    period: string
    score: number
    change: number
  }[]
  strengths: string[]
  improvementAreas: string[]
}

interface PerformanceAnalyticsProps {
  data: PerformanceData
  className?: string
}

export function PerformanceAnalytics({ data, className }: PerformanceAnalyticsProps) {
  const passRate = data.totalAssessments > 0 ? (data.passedAssessments / data.totalAssessments) * 100 : 0
  const studyTimeHours = Math.round(data.totalStudyTime / 60)

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Analytics
        </CardTitle>
        <CardDescription>
          Detailed insights into your learning performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className={`text-xl font-bold ${getScoreColor(data.averageScore)}`}>
              {data.averageScore}%
            </div>
            <div className="text-xs text-muted-foreground">Average Score</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {Math.round(passRate)}%
            </div>
            <div className="text-xs text-muted-foreground">Pass Rate</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {data.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">
              {studyTimeHours}h
            </div>
            <div className="text-xs text-muted-foreground">Study Time</div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">PERFORMANCE BY CATEGORY</h4>
          <div className="space-y-3">
            {data.categoryScores.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.category}</span>
                    {getTrendIcon(category.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getScoreColor(category.score)}`}>
                      {category.score}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({category.assessments} tests)
                    </span>
                  </div>
                </div>
                <Progress value={category.score} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trends */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">RECENT PERFORMANCE TREND</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.recentTrends.map((trend, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="text-sm font-medium">{trend.period}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold ${getScoreColor(trend.score)}`}>
                    {trend.score}%
                  </span>
                  <div className="flex items-center gap-1">
                    {trend.change > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : trend.change < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                    <span className={`text-xs ${
                      trend.change > 0 ? 'text-green-600' : 
                      trend.change < 0 ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths and Improvement Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              STRENGTHS
            </h4>
            <div className="space-y-2">
              {data.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              FOCUS AREAS
            </h4>
            <div className="space-y-2">
              {data.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Records */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">PERSONAL RECORDS</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-lg font-bold text-purple-600">{data.bestScore}%</div>
              <div className="text-xs text-muted-foreground">Highest Score</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{data.longestStreak}</div>
              <div className="text-xs text-muted-foreground">Longest Streak</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}