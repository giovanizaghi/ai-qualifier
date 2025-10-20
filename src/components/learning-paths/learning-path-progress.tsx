"use client"

import { Calendar, Clock, TrendingUp, Target, Award, BookOpen } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { LearningPathProgress, ProgressStatus } from '@/types/learning-paths'

interface LearningPathProgressProps {
  progress: LearningPathProgress
  totalSteps: number
  estimatedDuration: number
  className?: string
  variant?: 'compact' | 'detailed'
}

export function LearningPathProgressComponent({
  progress,
  totalSteps,
  estimatedDuration,
  className,
  variant = 'detailed'
}: LearningPathProgressProps) {
  const getStatusColor = (status: ProgressStatus) => {
    switch (status) {
      case ProgressStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case ProgressStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case ProgressStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getStatusText = (status: ProgressStatus) => {
    switch (status) {
      case ProgressStatus.COMPLETED:
        return 'Completed'
      case ProgressStatus.IN_PROGRESS:
        return 'In Progress'
      case ProgressStatus.PAUSED:
        return 'Paused'
      default:
        return 'Not Started'
    }
  }

  const completionRate = (progress.completedSteps.length / totalSteps) * 100
  const timeEfficiency = estimatedDuration > 0 ? (progress.totalTimeSpent / estimatedDuration) * 100 : 0

  if (variant === 'compact') {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(progress.status)}>
                {getStatusText(progress.status)}
              </Badge>
              <span className="text-sm font-medium">
                {Math.round(progress.completionPercentage)}%
              </span>
            </div>
            
            <Progress value={progress.completionPercentage} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Steps</span>
                <div className="font-medium">
                  {progress.completedSteps.length} / {totalSteps}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Time</span>
                <div className="font-medium">
                  {formatTime(progress.totalTimeSpent)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Learning Progress</CardTitle>
          <Badge className={getStatusColor(progress.status)}>
            {getStatusText(progress.status)}
          </Badge>
        </div>
        <CardDescription>
          Track your progress through this learning path
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold">
              {Math.round(progress.completionPercentage)}%
            </span>
          </div>
          <Progress value={progress.completionPercentage} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{progress.completedSteps.length} of {totalSteps} steps completed</span>
            {progress.completedAt && (
              <span>Completed {formatDate(progress.completedAt)}</span>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Time Invested</span>
            </div>
            <div className="text-lg font-semibold">
              {formatTime(progress.totalTimeSpent)}
            </div>
            <div className="text-xs text-gray-500">
              of {formatTime(estimatedDuration)} estimated
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <BookOpen className="h-4 w-4" />
              <span>Current Step</span>
            </div>
            <div className="text-lg font-semibold">
              {progress.currentStepOrder} / {totalSteps}
            </div>
            <div className="text-xs text-gray-500">
              Step {progress.currentStepOrder} in progress
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {progress.averageScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-4 w-4" />
              <span>Average Score</span>
            </div>
            <div className="text-lg font-semibold">
              {Math.round(progress.averageScore)}%
            </div>
            <Progress value={progress.averageScore} className="h-2" />
          </div>
        )}

        {/* Strengths and Improvements */}
        {(progress.strengths.length > 0 || progress.areasForImprovement.length > 0) && (
          <div className="grid grid-cols-1 gap-4">
            {progress.strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Award className="h-4 w-4" />
                  <span>Strengths</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {progress.strengths.slice(0, 3).map((strength, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {strength}
                    </Badge>
                  ))}
                  {progress.strengths.length > 3 && (
                    <Badge variant="outline">
                      +{progress.strengths.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {progress.areasForImprovement.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Target className="h-4 w-4" />
                  <span>Areas for Improvement</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {progress.areasForImprovement.slice(0, 3).map((area, index) => (
                    <Badge key={index} variant="outline" className="bg-orange-50 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {area}
                    </Badge>
                  ))}
                  {progress.areasForImprovement.length > 3 && (
                    <Badge variant="outline">
                      +{progress.areasForImprovement.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Timeline</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Started</span>
              <div className="font-medium">
                {formatDate(progress.enrolledAt)}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Last Activity</span>
              <div className="font-medium">
                {formatDate(progress.lastActivityAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        {progress.personalizedRecommendations.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Recommended Next Steps</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {progress.personalizedRecommendations.slice(0, 3).map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}