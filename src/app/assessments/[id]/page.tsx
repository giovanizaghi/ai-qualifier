"use client"

import { ArrowLeft, BookOpen, Clock, Users, Star, Play, Eye, Calendar, Target, Award } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Assessment, AssessmentResult, DifficultyLevel, QualificationCategory } from '@/types'

interface AssessmentWithDetails extends Assessment {
  qualification: {
    id: string
    title: string
    slug: string
    category: QualificationCategory
    difficulty: DifficultyLevel
    passingScore: number
    estimatedDuration: number
    learningObjectives: string[]
  }
  _count: {
    results: number
  }
}

interface UserProgress {
  hasAttempted: boolean
  bestScore?: number
  lastAttemptDate?: string
  totalAttempts: number
  averageScore?: number
  timeSpent?: number
  status?: 'COMPLETED' | 'IN_PROGRESS'
}

export default function AssessmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.id as string

  const [assessment, setAssessment] = useState<AssessmentWithDetails | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentResults, setRecentResults] = useState<AssessmentResult[]>([])

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentDetails()
    }
  }, [assessmentId])

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch assessment details
      const [assessmentResponse, resultsResponse] = await Promise.all([
        fetch(`/api/assessments/${assessmentId}`),
        fetch(`/api/assessment-results?assessmentId=${assessmentId}&limit=5`)
      ])

      if (!assessmentResponse.ok) {
        throw new Error('Assessment not found')
      }

      const assessmentData = await assessmentResponse.json()
      setAssessment(assessmentData.data)

      // Fetch user's progress if results API succeeds
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        const userResults = resultsData.data || []
        setRecentResults(userResults)

        if (userResults.length > 0) {
          const bestScore = Math.max(...userResults.map((r: AssessmentResult) => r.score))
          const totalTime = userResults.reduce((sum: number, r: AssessmentResult) => sum + (r.timeSpent || 0), 0)
          const averageScore = userResults.reduce((sum: number, r: AssessmentResult) => sum + r.score, 0) / userResults.length
          
          setUserProgress({
            hasAttempted: true,
            bestScore,
            lastAttemptDate: userResults[0].completedAt,
            totalAttempts: userResults.length,
            averageScore,
            timeSpent: totalTime,
            status: userResults[0].status
          })
        } else {
          setUserProgress({
            hasAttempted: false,
            totalAttempts: 0
          })
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'ADVANCED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'EXPERT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'No time limit'
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

  const handleStartAssessment = () => {
    router.push(`/assessments/${assessmentId}/take`)
  }

  const handleViewResults = () => {
    router.push(`/assessments/${assessmentId}/results`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading assessment details...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <BookOpen className="w-5 h-5" />
              Assessment Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'The requested assessment could not be found.'}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/assessments')} variant="outline">
                Back to Assessments
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/assessments')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {assessment.title}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {assessment.description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getDifficultyColor(assessment.qualification.difficulty)}>
                      {assessment.qualification.difficulty.toLowerCase()}
                    </Badge>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {assessment.qualification.title}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="lg:w-80">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleStartAssessment}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  {userProgress?.hasAttempted ? 'Retake Assessment' : 'Start Assessment'}
                </Button>
                
                {userProgress?.hasAttempted && (
                  <Button 
                    onClick={handleViewResults}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Past Results
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
                <TabsTrigger value="preparation">Preparation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Assessment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Assessment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                          <span className="font-medium">{assessment.questionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Time Limit:</span>
                          <span className="font-medium">{formatDuration(assessment.timeLimit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Passing Score:</span>
                          <span className="font-medium">{assessment.qualification.passingScore}%</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Question Order:</span>
                          <span className="font-medium">
                            {assessment.randomizeQuestions ? 'Randomized' : 'Sequential'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Answer Options:</span>
                          <span className="font-medium">
                            {assessment.randomizeAnswers ? 'Randomized' : 'Fixed'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Attempts:</span>
                          <span className="font-medium">{assessment._count.results}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Your Progress */}
                {userProgress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Your Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userProgress.hasAttempted ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Best Score:</span>
                                <span className="font-medium text-green-600">
                                  {userProgress.bestScore?.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                                <span className="font-medium">
                                  {userProgress.averageScore?.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Attempts:</span>
                                <span className="font-medium">{userProgress.totalAttempts}</span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Last Attempt:</span>
                                <span className="font-medium">
                                  {formatDate(userProgress.lastAttemptDate)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                                <span className="font-medium">
                                  {userProgress.timeSpent ? Math.floor(userProgress.timeSpent / 60) : 0} min
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {userProgress.bestScore !== undefined && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress to passing ({assessment.qualification.passingScore}%)</span>
                                <span>{Math.min(100, (userProgress.bestScore / assessment.qualification.passingScore) * 100).toFixed(0)}%</span>
                              </div>
                              <Progress 
                                value={Math.min(100, (userProgress.bestScore / assessment.qualification.passingScore) * 100)} 
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Ready to start?</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Take your first assessment to begin tracking your progress.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="objectives" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Objectives</CardTitle>
                    <CardDescription>
                      What you'll be assessed on in this qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {assessment.qualification.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-200 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preparation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Guidelines</CardTitle>
                    <CardDescription>
                      Important information before you start
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Before You Begin:</h4>
                        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                          <li>• Ensure you have a stable internet connection</li>
                          <li>• Find a quiet environment free from distractions</li>
                          <li>• Close unnecessary browser tabs and applications</li>
                          {assessment.timeLimit && (
                            <li>• Set aside at least {formatDuration(assessment.timeLimit)} of uninterrupted time</li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                      
                      <div>
                        <h4 className="font-medium mb-2">During the Assessment:</h4>
                        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                          <li>• Read each question carefully before selecting your answer</li>
                          <li>• You can flag questions for review and return to them later</li>
                          <li>• Your progress is automatically saved as you go</li>
                          {assessment.timeLimit && (
                            <li>• Keep an eye on the timer - the assessment will auto-submit when time expires</li>
                          )}
                          <li>• Use keyboard shortcuts for faster navigation (? for help)</li>
                        </ul>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                      
                      <div>
                        <h4 className="font-medium mb-2">After Completion:</h4>
                        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                          <li>• {assessment.showResults ? 'Results will be shown immediately' : 'Results will be available after review'}</li>
                          <li>• You can review your answers and explanations</li>
                          <li>• Passing score: {assessment.qualification.passingScore}%</li>
                          <li>• Retakes are allowed if needed</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assessment Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Total Attempts</span>
                  </div>
                  <span className="font-medium">{assessment._count.results}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Estimated Duration</span>
                  </div>
                  <span className="font-medium">{formatDuration(assessment.qualification.estimatedDuration)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Passing Score</span>
                  </div>
                  <span className="font-medium">{assessment.qualification.passingScore}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Results Preview */}
            {recentResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Attempts</CardTitle>
                  <CardDescription>Your latest assessment results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentResults.slice(0, 3).map((result, index) => (
                      <div key={result.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {result.score.toFixed(1)}% 
                            {result.passed && <span className="text-green-600 ml-1">✓</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(result.completedAt)}
                          </div>
                        </div>
                        <Badge variant={result.passed ? "default" : "secondary"}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                    
                    {recentResults.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewResults}
                        className="w-full mt-3"
                      >
                        View All Results
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}