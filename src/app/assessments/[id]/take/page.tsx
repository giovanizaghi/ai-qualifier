"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AssessmentInterface } from '@/components/assessment'
import { Assessment, Question, QuestionResult, AssessmentStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle, Clock, Users, BookOpen } from 'lucide-react'

export default function TakeAssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [previousProgress, setPreviousProgress] = useState<any>(null)

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentData()
    }
  }, [assessmentId])

  const fetchAssessmentData = async () => {
    try {
      setLoading(true)
      
      // Fetch assessment details
      const assessmentResponse = await fetch(`/api/assessments/${assessmentId}`)
      if (!assessmentResponse.ok) {
        throw new Error('Failed to fetch assessment')
      }
      const assessmentData = await assessmentResponse.json()
      setAssessment(assessmentData.data)

      // Fetch questions for this assessment
      const questionsResponse = await fetch(`/api/questions?assessmentId=${assessmentId}`)
      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions')
      }
      const questionsData = await questionsResponse.json()
      setQuestions(questionsData.data)

      // Check for existing progress
      const progressResponse = await fetch(`/api/assessment-results?assessmentId=${assessmentId}&status=IN_PROGRESS`)
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        if (progressData.data && progressData.data.length > 0) {
          setPreviousProgress(progressData.data[0])
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStartAssessment = () => {
    setHasStarted(true)
  }

  const handleSubmitAssessment = async (results: {
    answers: QuestionResult[]
    timeSpent: number
    status: AssessmentStatus
  }) => {
    try {
      const response = await fetch('/api/assessment-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          answers: results.answers,
          timeSpent: results.timeSpent,
          status: results.status
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit assessment')
      }

      const result = await response.json()
      
      // Redirect to results page
      router.push(`/assessments/${assessmentId}/results/${result.data.id}`)
    } catch (err) {
      console.error('Error submitting assessment:', err)
      // Handle error - show toast, etc.
    }
  }

  const handleSaveProgress = async (progress: {
    currentQuestion: number
    answers: QuestionResult[]
    timeSpent: number
    flaggedQuestions: number[]
  }) => {
    try {
      await fetch('/api/assessment-results/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          ...progress
        }),
      })
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  const handleExitAssessment = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Error Loading Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assessment || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The requested assessment could not be found or has no questions.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If assessment hasn't started yet, show the pre-assessment screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {assessment.title}
            </h1>
            {assessment.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {assessment.description}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Assessment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                  <span className="font-medium">{assessment.questionCount}</span>
                </div>
                
                {assessment.timeLimit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time Limit:</span>
                    <span className="font-medium">{assessment.timeLimit} minutes</span>
                  </div>
                )}
                
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
                  <span className="text-gray-600 dark:text-gray-400">Results:</span>
                  <span className="font-medium">
                    {assessment.showResults ? 'Shown immediately' : 'Hidden'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                  <li>• Read each question carefully before selecting your answer</li>
                  <li>• You can flag questions for review and return to them later</li>
                  <li>• Use keyboard shortcuts for faster navigation (? for help)</li>
                  {assessment.timeLimit && (
                    <li>• Your assessment will auto-submit when time expires</li>
                  )}
                  <li>• Your progress is automatically saved as you go</li>
                  <li>• Click "Submit Assessment" when you're finished</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Previous Progress Warning */}
          {previousProgress && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Previous Attempt Found</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  You have an in-progress attempt for this assessment. You can continue from where you left off 
                  or start over with a new attempt.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="text-center">
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              
              {previousProgress && (
                <Button
                  variant="outline"
                  onClick={handleStartAssessment}
                >
                  Continue Previous Attempt
                </Button>
              )}
              
              <Button
                onClick={handleStartAssessment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {previousProgress ? 'Start New Attempt' : 'Start Assessment'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              By starting this assessment, you agree to complete it honestly and without assistance.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show the main assessment interface
  return (
    <AssessmentInterface
      assessment={assessment}
      questions={questions}
      onSubmit={handleSubmitAssessment}
      onSave={handleSaveProgress}
      initialProgress={previousProgress}
      onExit={handleExitAssessment}
      showRealTimeFeedback={true}
      allowPause={true}
    />
  )
}