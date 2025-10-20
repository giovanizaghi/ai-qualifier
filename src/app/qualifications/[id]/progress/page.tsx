"use client"

import { ArrowLeft, TrendingUp, Clock, Trophy, Target, CheckCircle, XCircle, Calendar, Award, BookOpen, BarChart3 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ProgressData {
  qualification: {
    id: string
    title: string
    description: string
    passingScore: number
    estimatedDuration: number
    _count: {
      assessments: number
    }
  }
  progress: {
    id: string
    completionPercentage: number
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    studyTimeMinutes: number
    bestScore?: number
    lastStudiedAt?: Date
    attempts: number
    completedTopics: string[]
    currentTopic?: string
  }
  assessments: Array<{
    id: string
    title: string
    description: string
    questionCount: number
    timeLimit?: number
    passingScore: number
    userProgress?: {
      bestScore?: number
      attempts: number
      lastAttemptDate?: string
      passed: boolean
      timeSpent?: number
    }
  }>
  milestones: Array<{
    id: string
    title: string
    description: string
    requirement: number
    achieved: boolean
    achievedDate?: string
    points?: number
  }>
  recommendations: Array<{
    type: 'assessment' | 'study' | 'review'
    title: string
    description: string
    estimatedTime: number
    priority: 'high' | 'medium' | 'low'
    actionUrl?: string
  }>
}

export default function QualificationProgressPage() {
  const params = useParams()
  const router = useRouter()
  const qualificationId = params?.id as string

  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (qualificationId) {
      fetchProgressData()
    }
  }, [qualificationId])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/qualifications/${qualificationId}/progress`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress data')
      }

      const result = await response.json()
      setData(result.data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const formatDate = (date?: string | Date) => {
    if (!date) return ''
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const calculateOverallStats = () => {
    if (!data) return { completed: 0, total: 0, avgScore: 0, totalTime: 0 }
    
    const completed = data.assessments.filter(a => a.userProgress?.passed).length
    const total = data.assessments.length
    const scoresWithData = data.assessments.filter(a => a.userProgress?.bestScore !== undefined)
    const avgScore = scoresWithData.length > 0 
      ? scoresWithData.reduce((sum, a) => sum + (a.userProgress?.bestScore || 0), 0) / scoresWithData.length
      : 0
    const totalTime = data.assessments.reduce((sum, a) => sum + (a.userProgress?.timeSpent || 0), 0)
    
    return { completed, total, avgScore, totalTime }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading progress data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingUp className="w-5 h-5" />
              Error Loading Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Failed to load progress data.'}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/qualifications/${qualificationId}`)} variant="outline">
                Back to Qualification
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = calculateOverallStats()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/qualifications/${qualificationId}`)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Qualification
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Progress: {data.qualification.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Track your learning journey and see what's next
              </p>
              
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Overall Progress</span>
                    </div>
                    <div className="text-2xl font-bold mb-2">{data.progress.completionPercentage}%</div>
                    <Progress value={data.progress.completionPercentage} className="h-2" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.completed}/{stats.total}</div>
                    <div className="text-sm text-gray-500">Assessments</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">Avg Score</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Across attempts</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium">Study Time</span>
                    </div>
                    <div className="text-2xl font-bold">{Math.floor(data.progress.studyTimeMinutes / 60)}h</div>
                    <div className="text-sm text-gray-500">{data.progress.studyTimeMinutes % 60}m total</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="assessments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="assessments">Assessments</TabsTrigger>
                <TabsTrigger value="milestones">Achievements</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="assessments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Progress</CardTitle>
                    <CardDescription>
                      Complete all assessments to earn your qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.assessments.map((assessment, index) => (
                        <div key={assessment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                  assessment.userProgress?.passed
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : assessment.userProgress?.attempts
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                )}>
                                  {assessment.userProgress?.passed ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : assessment.userProgress?.attempts ? (
                                    <XCircle className="w-4 h-4" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {assessment.title}
                                </h4>
                                {assessment.userProgress?.passed && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Passed
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {assessment.description}
                              </p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">Questions</div>
                                  <div className="font-medium">{assessment.questionCount}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Time Limit</div>
                                  <div className="font-medium">{formatDuration(assessment.timeLimit || 60)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Best Score</div>
                                  <div className="font-medium">
                                    {assessment.userProgress?.bestScore?.toFixed(1) || 0}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Attempts</div>
                                  <div className="font-medium">{assessment.userProgress?.attempts || 0}</div>
                                </div>
                              </div>
                              
                              {assessment.userProgress?.bestScore !== undefined && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span>Progress to passing ({assessment.passingScore}%)</span>
                                    <span>{Math.min(100, (assessment.userProgress.bestScore / assessment.passingScore) * 100).toFixed(0)}%</span>
                                  </div>
                                  <Progress 
                                    value={Math.min(100, (assessment.userProgress.bestScore / assessment.passingScore) * 100)} 
                                    className="h-2"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-4 flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => router.push(`/assessments/${assessment.id}`)}
                                variant={assessment.userProgress?.passed ? "outline" : "default"}
                              >
                                {assessment.userProgress?.passed 
                                  ? 'Review' 
                                  : assessment.userProgress?.attempts 
                                  ? 'Retake' 
                                  : 'Start'
                                }
                              </Button>
                              {assessment.userProgress && assessment.userProgress.attempts > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/assessments/${assessment.id}/results`)}
                                >
                                  View Results
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Achievement Milestones</CardTitle>
                    <CardDescription>
                      Unlock achievements as you progress through the qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            milestone.achieved
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          )}>
                            {milestone.achieved ? (
                              <Trophy className="w-5 h-5" />
                            ) : (
                              <Award className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {milestone.title}
                              </h4>
                              {milestone.achieved && (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Achieved
                                </Badge>
                              )}
                              {milestone.points && (
                                <Badge variant="outline">
                                  {milestone.points} pts
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {milestone.description}
                            </p>
                            {milestone.achieved && milestone.achievedDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                Achieved on {formatDate(milestone.achievedDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Analytics</CardTitle>
                    <CardDescription>
                      Detailed insights into your learning progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Study Pattern</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Total Study Time</span>
                            <span className="font-medium">{formatDuration(data.progress.studyTimeMinutes)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last Studied</span>
                            <span className="font-medium">{formatDate(data.progress.lastStudiedAt)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Current Topic</span>
                            <span className="font-medium">{data.progress.currentTopic || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Topics Completed</span>
                            <span className="font-medium">{data.progress.completedTopics.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Performance Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Best Overall Score</span>
                            <span className="font-medium">{data.progress.bestScore?.toFixed(1) || 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Attempts</span>
                            <span className="font-medium">{data.progress.attempts}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Average Score</span>
                            <span className="font-medium">{stats.avgScore.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate</span>
                            <span className="font-medium">{((stats.completed / stats.total) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
                <CardDescription>
                  Personalized recommendations for your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                          getPriorityColor(rec.priority)
                        )}>
                          {rec.type === 'assessment' && <BookOpen className="w-3 h-3" />}
                          {rec.type === 'study' && <Clock className="w-3 h-3" />}
                          {rec.type === 'review' && <TrendingUp className="w-3 h-3" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {rec.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatDuration(rec.estimatedTime)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {rec.priority}
                            </Badge>
                          </div>
                          {rec.actionUrl && (
                            <Button size="sm" variant="outline" className="w-full mt-2 text-xs h-7">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => router.push(`/qualifications/${qualificationId}`)}
                  variant="outline" 
                  className="w-full gap-2"
                >
                  <Award className="w-4 h-4" />
                  View Qualification
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline" 
                  className="w-full gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time to completion</span>
                    <span className="font-medium">
                      {Math.max(0, data.qualification.estimatedDuration - data.progress.studyTimeMinutes)} min remaining
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Progress rate</span>
                    <span className="font-medium">
                      {data.progress.completionPercentage > 0 
                        ? `${(data.progress.completionPercentage / (data.progress.studyTimeMinutes / 60)).toFixed(1)}%/hr`
                        : 'Not calculated'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <Badge variant={data.progress.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {data.progress.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}