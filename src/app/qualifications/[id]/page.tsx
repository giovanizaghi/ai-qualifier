"use client"

import { ArrowLeft, BookOpen, Clock, Users, Award, Play, Target, TrendingUp, CheckCircle, XCircle, Calendar, Trophy, MessageSquare } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { EnrollmentDialog } from '@/components/qualifications/enrollment-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Qualification, Assessment, QualificationCategory, DifficultyLevel } from '@/types'

interface QualificationWithDetails extends Qualification {
  _count: {
    assessments: number
    questions: number
    qualificationProgress: number
  }
  assessments: (Assessment & {
    _count: {
      results: number
    }
    userProgress?: {
      bestScore?: number
      attempts: number
      lastAttemptDate?: string
      passed: boolean
    }
  })[]
  userProgress?: {
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
}

interface LearningPathStep {
  id: string
  title: string
  description: string
  type: 'assessment' | 'study' | 'practice'
  estimatedTime: number
  completed: boolean
  prerequisiteIds: string[]
  assessmentId?: string
}

export default function QualificationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const qualificationId = params?.id as string

  const [qualification, setQualification] = useState<QualificationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)

  useEffect(() => {
    if (qualificationId) {
      fetchQualificationDetails()
    }
  }, [qualificationId])

  const fetchQualificationDetails = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/qualifications/${qualificationId}?includeAssessments=true&includeProgress=true`)
      
      if (!response.ok) {
        throw new Error('Qualification not found')
      }

      const data = await response.json()
      setQualification(data.data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollment = async () => {
    try {
      setEnrolling(true)
      
      const response = await fetch(`/api/qualifications/${qualificationId}/enroll`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to enroll in qualification')
      }

      // Refresh data after enrollment
      await fetchQualificationDetails()
      
    } catch (err) {
      console.error('Enrollment error:', err)
    } finally {
      setEnrolling(false)
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

  const getCategoryDisplayName = (category: QualificationCategory) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes} min`}
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const formatDate = (date?: string | Date) => {
    if (!date) {return ''}
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateLearningPath = (): LearningPathStep[] => {
    if (!qualification?.assessments) {return []}

    return qualification.assessments.map((assessment, index) => ({
      id: assessment.id,
      title: assessment.title,
      description: assessment.description || '',
      type: 'assessment' as const,
      estimatedTime: assessment.timeLimit || 60,
      completed: assessment.userProgress?.passed || false,
      prerequisiteIds: index > 0 ? [qualification.assessments[index - 1].id] : [],
      assessmentId: assessment.id
    }))
  }

  const userProgress = qualification?.userProgress
  const hasStarted = userProgress && userProgress.status !== 'NOT_STARTED'
  const isCompleted = userProgress?.status === 'COMPLETED'
  const learningPath = generateLearningPath()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading qualification details...</p>
        </div>
      </div>
    )
  }

  if (error || !qualification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Award className="w-5 h-5" />
              Qualification Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'The requested qualification could not be found.'}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/qualifications')} variant="outline">
                Back to Qualifications
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
            onClick={() => router.push('/qualifications')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Qualifications
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {qualification.title}
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {qualification.description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getDifficultyColor(qualification.difficulty)}>
                      {qualification.difficulty.toLowerCase()}
                    </Badge>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {getCategoryDisplayName(qualification.category)}
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Trophy className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <Card className="lg:w-80">
              <CardHeader>
                <CardTitle className="text-lg">
                  {hasStarted ? 'Your Progress' : 'Get Started'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasStarted && userProgress ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">{userProgress.completionPercentage}%</span>
                      </div>
                      <Progress value={userProgress.completionPercentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Study Time</div>
                        <div className="font-medium">{Math.floor(userProgress.studyTimeMinutes / 60)}h {userProgress.studyTimeMinutes % 60}m</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Best Score</div>
                        <div className="font-medium">{userProgress.bestScore?.toFixed(1) || 0}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Attempts</div>
                        <div className="font-medium">{userProgress.attempts}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Last Study</div>
                        <div className="font-medium">{formatDate(userProgress.lastStudiedAt)}</div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => router.push(`/qualifications/${qualificationId}/progress`)}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <TrendingUp className="w-4 h-4" />
                      View Progress
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start your journey to master {qualification.title.toLowerCase()}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setShowEnrollDialog(true)}
                      disabled={enrolling}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Play className="w-4 h-4" />
                      Start Qualification
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="path">Learning Path</TabsTrigger>
                <TabsTrigger value="assessments">Assessments</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Learning Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Learning Objectives
                    </CardTitle>
                    <CardDescription>
                      What you'll master in this qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {qualification.learningObjectives.map((objective, index) => (
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

                {/* Syllabus */}
                {qualification.syllabus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Syllabus
                      </CardTitle>
                      <CardDescription>
                        Detailed curriculum and topics covered
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {qualification.syllabus.modules?.map((module: any, index: number) => (
                          <div key={index} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              {module.title}
                            </h4>
                            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              {module.topics?.map((topic: string, topicIndex: number) => (
                                <li key={topicIndex} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="path" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Path</CardTitle>
                    <CardDescription>
                      Step-by-step progression through the qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {learningPath.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                              step.completed 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            )}>
                              {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                            </div>
                            {index < learningPath.length - 1 && (
                              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 my-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {step.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {step.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(step.estimatedTime)}
                                  <span>•</span>
                                  <span className="capitalize">{step.type}</span>
                                </div>
                              </div>
                              <div className="ml-4">
                                {step.assessmentId && (
                                  <Button
                                    size="sm"
                                    variant={step.completed ? "outline" : "default"}
                                    onClick={() => router.push(`/assessments/${step.assessmentId}`)}
                                  >
                                    {step.completed ? 'Review' : 'Start'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Required Assessments</CardTitle>
                    <CardDescription>
                      Complete all assessments to earn your qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {qualification.assessments.map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {assessment.title}
                                </h4>
                                {assessment.userProgress?.passed && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {assessment.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {assessment.questionCount} questions
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDuration(assessment.timeLimit || 60)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {assessment._count?.results || 0} attempts
                                </div>
                              </div>
                              {assessment.userProgress && (
                                <div className="mt-3 text-sm">
                                  <div className="flex items-center gap-4">
                                    <span>Best Score: {assessment.userProgress.bestScore?.toFixed(1) || 0}%</span>
                                    <span>Attempts: {assessment.userProgress.attempts}</span>
                                    {assessment.userProgress.lastAttemptDate && (
                                      <span>Last: {formatDate(assessment.userProgress.lastAttemptDate)}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <Button
                                size="sm"
                                onClick={() => router.push(`/assessments/${assessment.id}`)}
                              >
                                {assessment.userProgress?.attempts ? 'Retake' : 'Start'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Prerequisites</CardTitle>
                    <CardDescription>
                      Knowledge and skills you should have before starting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {qualification.prerequisites.length > 0 ? (
                      <ul className="space-y-2">
                        {qualification.prerequisites.map((prerequisite, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {prerequisite}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">
                        No specific prerequisites required. This qualification is suitable for beginners.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completion Requirements</CardTitle>
                    <CardDescription>
                      What you need to do to earn this qualification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Complete all assessments</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Successfully pass all {qualification._count.assessments} required assessments
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Trophy className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Achieve passing score</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Score at least {qualification.passingScore}% on each assessment
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Earn your qualification</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Receive your digital certificate and badge upon completion
                          </div>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Qualification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Estimated Duration</span>
                  </div>
                  <span className="font-medium">{formatDuration(qualification.estimatedDuration)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Assessments</span>
                  </div>
                  <span className="font-medium">{qualification._count.assessments}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Passing Score</span>
                  </div>
                  <span className="font-medium">{qualification.passingScore}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Enrolled</span>
                  </div>
                  <span className="font-medium">{qualification._count.qualificationProgress}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {qualification.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {qualification.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {!hasStarted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ready to Start?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Begin your journey to master {qualification.title.toLowerCase()}. 
                    You'll progress through structured assessments and learning materials.
                  </p>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Track your progress in real-time</li>
                    <li>• Retake assessments as needed</li>
                    <li>• Earn a digital certificate</li>
                    <li>• Join a community of learners</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Dialog */}
      {qualification && (
        <EnrollmentDialog
          open={showEnrollDialog}
          onOpenChange={setShowEnrollDialog}
          qualification={qualification}
          onEnroll={handleEnrollment}
        />
      )}
    </div>
  )
}