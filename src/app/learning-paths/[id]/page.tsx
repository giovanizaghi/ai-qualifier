"use client"

import { 
  BookOpen, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  Play, 
  ArrowLeft, 
  Check,
  Star,
  ChevronRight,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { 
  LearningPathProgressComponent, 
  StepIndicator 
} from '@/components/learning-paths'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMockLearningPath } from '@/lib/mock-learning-paths'
import { cn } from '@/lib/utils'
import { 
  LearningPathWithProgress, 
  DifficultyLevel,
  LearningPathCategory,
  ProgressStatus
} from '@/types/learning-paths'

interface LearningPathPageProps {
  params: {
    id: string
  }
}

export default function LearningPathPage({ params }: LearningPathPageProps) {
  const router = useRouter()
  const [learningPath, setLearningPath] = useState<LearningPathWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        setLoading(true)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))
        
        // In a real app, this would be an API call
        const path = getMockLearningPath(params.id, 'user-1') // Mock user ID
        if (!path) {
          setError('Learning path not found')
          return
        }
        
        setLearningPath(path)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLearningPath()
  }, [params.id])

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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes} min`}
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const getStepIsUnlocked = (stepOrder: number, completedSteps: string[], currentStepOrder: number) => {
    return stepOrder <= currentStepOrder || completedSteps.some(stepId => stepId.includes(`-${stepOrder}`))
  }

  const handleStartPath = () => {
    // In a real app, this would enroll the user and navigate to the first step
    console.log('Starting learning path:', learningPath?.id)
    // For now, just navigate to the first step
    if (learningPath?.steps[0]) {
      router.push(`/learning-paths/${learningPath.id}/steps/${learningPath.steps[0].id}`)
    }
  }

  const handleContinuePath = () => {
    // Navigate to current step
    const currentStep = learningPath?.userProgress?.currentStepId
    if (currentStep) {
      router.push(`/learning-paths/${learningPath.id}/steps/${currentStep}`)
    }
  }

  const handleStepClick = (stepId: string) => {
    if (learningPath) {
      router.push(`/learning-paths/${learningPath.id}/steps/${stepId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spinner className="h-8 w-8 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading learning path...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !learningPath) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <BookOpen className="w-5 h-5" />
                  Learning Path Not Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error || 'The learning path you\'re looking for doesn\'t exist.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                  </Button>
                  <Button onClick={() => router.push('/learning-paths')}>
                    Browse Learning Paths
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const userProgress = learningPath.userProgress
  const isEnrolled = Boolean(userProgress)
  const isCompleted = userProgress?.status === ProgressStatus.COMPLETED
  const isInProgress = userProgress?.status === ProgressStatus.IN_PROGRESS

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/learning-paths')}
            className="gap-2 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Learning Paths
          </Button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">{learningPath.title}</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getDifficultyColor(learningPath.difficulty)}>
                        {learningPath.difficulty.toLowerCase()}
                      </Badge>
                      <Badge variant="outline">
                        {getCategoryDisplayName(learningPath.category)}
                      </Badge>
                      {learningPath.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{learningPath.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl mb-4">{learningPath.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {learningPath.description}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-lg font-semibold">{learningPath.totalSteps}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Steps</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-2">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-lg font-semibold">{formatDuration(learningPath.estimatedDuration)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg mx-auto mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-lg font-semibold">{learningPath._count.enrollments.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Enrolled</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg mx-auto mb-2">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-lg font-semibold">{Math.round(learningPath.completionRate * 100)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completion</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            {isEnrolled && userProgress ? (
              <LearningPathProgressComponent
                progress={userProgress}
                totalSteps={learningPath.totalSteps}
                estimatedDuration={learningPath.estimatedDuration}
                variant="compact"
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Begin your learning journey with this comprehensive path.
                  </p>
                  <Button onClick={handleStartPath} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning Path
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {isEnrolled && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Button 
                    onClick={isCompleted ? () => handleStepClick(learningPath.steps[0].id) : handleContinuePath}
                    className="w-full"
                  >
                    {isCompleted ? 'Review Path' : 'Continue Learning'}
                  </Button>
                  
                  {isInProgress && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Study Time
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Objectives */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {learningPath.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* What You'll Achieve */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    What You'll Achieve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {learningPath.outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Prerequisites */}
            {learningPath.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
                  <CardDescription>
                    Make sure you have these skills before starting this path
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {learningPath.prerequisites.map((prerequisite, index) => (
                      <Badge key={index} variant="outline">
                        {prerequisite}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Topics Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {learningPath.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Steps</CardTitle>
                <CardDescription>
                  Complete these steps in order to master the subject
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {learningPath.steps.map((step, index) => (
                  <StepIndicator
                    key={step.id}
                    step={step}
                    progress={userProgress?.stepProgress[step.id]}
                    isUnlocked={
                      !isEnrolled || 
                      getStepIsUnlocked(
                        step.order,
                        userProgress?.completedSteps || [],
                        userProgress?.currentStepOrder || 1
                      )
                    }
                    isCurrent={userProgress?.currentStepId === step.id}
                    onStepClick={isEnrolled ? handleStepClick : undefined}
                    variant="detailed"
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {isEnrolled && userProgress ? (
              <LearningPathProgressComponent
                progress={userProgress}
                totalSteps={learningPath.totalSteps}
                estimatedDuration={learningPath.estimatedDuration}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Progress Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start this learning path to track your progress and achievements.
                  </p>
                  <Button onClick={handleStartPath}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning Path
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Path Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Category</span>
                      <div className="font-medium">{getCategoryDisplayName(learningPath.category)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Difficulty</span>
                      <div className="font-medium">{learningPath.difficulty.toLowerCase()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total Steps</span>
                      <div className="font-medium">{learningPath.totalSteps}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Estimated Time</span>
                      <div className="font-medium">{formatDuration(learningPath.estimatedDuration)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Enrollments</span>
                      <span className="font-medium">{learningPath._count.enrollments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completions</span>
                      <span className="font-medium">{learningPath._count.completions.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                      <span className="font-medium">{Math.round(learningPath.completionRate * 100)}%</span>
                    </div>
                    {learningPath.averageRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{learningPath.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}