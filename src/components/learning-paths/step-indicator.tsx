"use client"

import { Check, Lock, Play, Circle, Clock, CheckCircle2, PlayCircle, LockIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { LearningStep, LearningStepType, StepStatus, DifficultyLevel } from '@/types/learning-paths'

interface StepProgress {
  stepId: string
  status: StepStatus
  timeSpent: number
  attempts: number
  bestScore?: number
  lastScore?: number
}

interface StepIndicatorProps {
  step: LearningStep
  progress?: StepProgress
  isUnlocked: boolean
  isCurrent?: boolean
  onStepClick?: (stepId: string) => void
  variant?: 'compact' | 'detailed'
  showProgress?: boolean
  className?: string
}

export function StepIndicator({
  step,
  progress,
  isUnlocked,
  isCurrent = false,
  onStepClick,
  variant = 'compact',
  showProgress = true,
  className
}: StepIndicatorProps) {
  const status = progress?.status || StepStatus.NOT_STARTED
  const isCompleted = status === StepStatus.COMPLETED
  const isInProgress = status === StepStatus.IN_PROGRESS
  const isSkipped = status === StepStatus.SKIPPED
  
  const getStepIcon = () => {
    if (!isUnlocked) {
      return <LockIcon className="h-4 w-4" />
    }
    
    switch (status) {
      case StepStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4" />
      case StepStatus.IN_PROGRESS:
        return <PlayCircle className="h-4 w-4" />
      case StepStatus.SKIPPED:
        return <Circle className="h-4 w-4 opacity-50" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }
  
  const getStepTypeIcon = (type: LearningStepType) => {
    switch (type) {
      case LearningStepType.VIDEO:
        return <PlayCircle className="h-3 w-3" />
      case LearningStepType.READING:
        return <Check className="h-3 w-3" />
      case LearningStepType.ASSESSMENT:
        return <CheckCircle2 className="h-3 w-3" />
      case LearningStepType.PRACTICE:
        return <Play className="h-3 w-3" />
      default:
        return <Circle className="h-3 w-3" />
    }
  }
  
  const getStepTypeColor = (type: LearningStepType) => {
    switch (type) {
      case LearningStepType.VIDEO:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case LearningStepType.READING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case LearningStepType.ASSESSMENT:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case LearningStepType.PRACTICE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case LearningStepType.PROJECT:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case LearningStepType.INTERACTIVE:
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }
  
  const getStatusColor = () => {
    if (!isUnlocked) {
      return 'text-gray-400 bg-gray-100 dark:bg-gray-800'
    }
    
    switch (status) {
      case StepStatus.COMPLETED:
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case StepStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
      case StepStatus.SKIPPED:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
      default:
        return isCurrent 
          ? 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
    }
  }
  
  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case DifficultyLevel.INTERMEDIATE: 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case DifficultyLevel.ADVANCED: 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case DifficultyLevel.EXPERT: 
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) {return `${minutes}m`}
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }
  
  const handleClick = () => {
    if (isUnlocked && onStepClick) {
      onStepClick(step.id)
    }
  }
  
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all",
          isUnlocked ? "cursor-pointer hover:shadow-sm" : "cursor-not-allowed opacity-60",
          isCurrent && "ring-2 ring-blue-500 ring-opacity-50",
          getStatusColor(),
          className
        )}
        onClick={handleClick}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border-2",
          getStatusColor()
        )}>
          {getStepIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{step.title}</h4>
            <Badge className={getStepTypeColor(step.type)} variant="secondary">
              <div className="flex items-center gap-1">
                {getStepTypeIcon(step.type)}
                {step.type.toLowerCase()}
              </div>
            </Badge>
            {step.isOptional && (
              <Badge variant="outline" className="text-xs">
                Optional
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(step.estimatedTime)}
            </span>
            {progress && progress.timeSpent > 0 && (
              <span>Spent: {formatTime(progress.timeSpent)}</span>
            )}
            {progress && progress.bestScore !== undefined && (
              <span>Best: {progress.bestScore}%</span>
            )}
          </div>
        </div>
        
        {showProgress && progress && progress.timeSpent > 0 && (
          <div className="w-16">
            <Progress 
              value={isCompleted ? 100 : isInProgress ? 50 : 0} 
              className="h-1"
            />
          </div>
        )}
      </div>
    )
  }
  
  return (
    <Card className={cn(
      "transition-all",
      isUnlocked ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-60",
      isCurrent && "ring-2 ring-blue-500 ring-opacity-50",
      className
    )} onClick={handleClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0",
            getStatusColor()
          )}>
            {getStepIcon()}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {step.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStepTypeColor(step.type)}>
                  <div className="flex items-center gap-1">
                    {getStepTypeIcon(step.type)}
                    {step.type.toLowerCase()}
                  </div>
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Badge className={getDifficultyColor(step.difficulty)} variant="outline">
                {step.difficulty.toLowerCase()}
              </Badge>
              {step.isOptional && (
                <Badge variant="outline">Optional</Badge>
              )}
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTime(step.estimatedTime)}
              </span>
            </div>
            
            {progress && (
              <div className="space-y-2">
                {progress.timeSpent > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Time spent: {formatTime(progress.timeSpent)}
                    {progress.attempts > 1 && ` • ${progress.attempts} attempts`}
                    {progress.bestScore !== undefined && ` • Best score: ${progress.bestScore}%`}
                  </div>
                )}
                
                {showProgress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>{isCompleted ? '100%' : isInProgress ? '50%' : '0%'}</span>
                    </div>
                    <Progress 
                      value={isCompleted ? 100 : isInProgress ? 50 : 0} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            )}
            
            {isUnlocked && (
              <div className="pt-2">
                <Button 
                  size="sm" 
                  variant={isCurrent ? "default" : "outline"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                >
                  {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}