"use client"

import { BookOpen, Clock, Users, Target, TrendingUp, Play, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { LearningPathWithProgress, DifficultyLevel, LearningPathCategory, ProgressStatus } from '@/types/learning-paths'

interface LearningPathCardProps {
  learningPath: LearningPathWithProgress
  variant?: 'grid' | 'list'
  onNavigate?: (pathId: string) => void
  className?: string
}

export function LearningPathCard({ 
  learningPath, 
  variant = 'grid',
  onNavigate,
  className
}: LearningPathCardProps) {
  const router = useRouter()

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(learningPath.id)
    } else {
      router.push(`/learning-paths/${learningPath.id}`)
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

  const getCategoryDisplayName = (category: LearningPathCategory) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusColor = (status?: ProgressStatus) => {
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes} min`}
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const userProgress = learningPath.userProgress
  const hasProgress = userProgress && userProgress.completionPercentage > 0
  const isCompleted = userProgress?.status === ProgressStatus.COMPLETED
  const isInProgress = userProgress?.status === ProgressStatus.IN_PROGRESS

  if (variant === 'list') {
    return (
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow cursor-pointer group",
          className
        )}
        data-testid="learning-path-card"
        onClick={handleNavigate}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {learningPath.title}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {learningPath.shortDescription || learningPath.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getDifficultyColor(learningPath.difficulty)}>
                      {learningPath.difficulty.toLowerCase()}
                    </Badge>
                    {userProgress && (
                      <Badge className={getStatusColor(userProgress.status)}>
                        {userProgress.status === ProgressStatus.IN_PROGRESS ? 'In Progress' : 
                         userProgress.status === ProgressStatus.COMPLETED ? 'Completed' : 
                         userProgress.status === ProgressStatus.PAUSED ? 'Paused' : 'Not Started'}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">
                      {getCategoryDisplayName(learningPath.category)}
                    </span>
                  </div>
                  
                  {hasProgress && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium">{userProgress.completionPercentage}%</span>
                      </div>
                      <Progress value={userProgress.completionPercentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>{userProgress.completedSteps.length} of {learningPath.totalSteps} steps</span>
                        {userProgress.totalTimeSpent > 0 && (
                          <span>{formatDuration(userProgress.totalTimeSpent)} spent</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {learningPath.totalSteps} steps
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(learningPath.estimatedDuration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {learningPath._count.enrollments} enrolled
                    </div>
                    {learningPath.averageRating && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {learningPath.averageRating.toFixed(1)} rating
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Button 
                    size="sm" 
                    className="min-w-[100px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNavigate()
                    }}
                  >
                    {isCompleted ? (
                      <>Review</>
                    ) : isInProgress ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Continue
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer group h-full",
        className
      )}
      data-testid="learning-path-card"
      onClick={handleNavigate}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {learningPath.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getDifficultyColor(learningPath.difficulty)}>
                {learningPath.difficulty.toLowerCase()}
              </Badge>
              {userProgress && (
                <Badge className={getStatusColor(userProgress.status)}>
                  {userProgress.status === ProgressStatus.IN_PROGRESS ? 'In Progress' : 
                   userProgress.status === ProgressStatus.COMPLETED ? 'Completed' : 
                   userProgress.status === ProgressStatus.PAUSED ? 'Paused' : 'Not Started'}
                </Badge>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </div>
        <CardDescription className="line-clamp-3">
          {learningPath.shortDescription || learningPath.description}
        </CardDescription>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          {getCategoryDisplayName(learningPath.category)}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {hasProgress && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium">{userProgress.completionPercentage}%</span>
              </div>
              <Progress value={userProgress.completionPercentage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1">
                {userProgress.completedSteps.length} of {learningPath.totalSteps} steps completed
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {learningPath.totalSteps} steps
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(learningPath.estimatedDuration)}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {learningPath._count.enrollments} enrolled
              </div>
              {learningPath.completionRate > 0 && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {Math.round(learningPath.completionRate * 100)}% completion rate
                </div>
              )}
            </div>
            
            {learningPath.averageRating && (
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-4 w-4" />
                {learningPath.averageRating.toFixed(1)} average rating
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            className="w-full" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleNavigate()
            }}
          >
            {isCompleted ? (
              'Review Path'
            ) : isInProgress ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Continue Learning
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Start Learning Path
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}