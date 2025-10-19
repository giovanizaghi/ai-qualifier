"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Assessment, 
  Question, 
  QuestionResult, 
  AssessmentResult, 
  AssessmentStatus 
} from "@/types"
import { QuestionCard } from "./question-card"
import { AssessmentTimer, TimeWarning } from "./assessment-timer"
import { ProgressIndicator, QuestionNavigation } from "./progress-indicator"
import { RealTimeFeedback, AnswerFeedback } from "./real-time-feedback"
import { AssessmentResults } from "./assessment-results"
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Send, 
  AlertTriangle,
  Eye,
  Settings,
  Pause,
  Play
} from "lucide-react"

interface AssessmentInterfaceProps {
  assessment: Assessment
  questions: Question[]
  onSubmit: (results: {
    answers: QuestionResult[]
    timeSpent: number
    status: AssessmentStatus
  }) => void
  onSave?: (progress: {
    currentQuestion: number
    answers: QuestionResult[]
    timeSpent: number
    flaggedQuestions: number[]
  }) => void
  initialProgress?: {
    currentQuestion: number
    answers: QuestionResult[]
    timeSpent: number
    flaggedQuestions: number[]
  }
  onExit?: () => void
  showRealTimeFeedback?: boolean
  allowPause?: boolean
  className?: string
}

interface QuestionAnswer {
  questionId: string
  answer: string[]
  confidence?: number
  timeSpent: number
  flagged: boolean
}

export function AssessmentInterface({
  assessment,
  questions,
  onSubmit,
  onSave,
  initialProgress,
  onExit,
  showRealTimeFeedback = true,
  allowPause = true,
  className = ""
}: AssessmentInterfaceProps) {
  // Core state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialProgress?.currentQuestion ? initialProgress.currentQuestion - 1 : 0
  )
  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map())
  const [startTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(initialProgress?.timeSpent || 0)
  const [isPaused, setIsPaused] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>(
    initialProgress?.flaggedQuestions || []
  )

  // UI state
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [showConfirmExit, setShowConfirmExit] = useState(false)
  const [showNavigation, setShowNavigation] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<{
    isCorrect: boolean
    explanation?: string
    points?: number
    timeSpent?: number
  } | null>(null)

  // Assessment results (for completed state)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const totalAnswered = answers.size
  const remainingTime = assessment.timeLimit ? (assessment.timeLimit * 60) - timeSpent : undefined

  // Initialize answers from previous progress
  useEffect(() => {
    if (initialProgress?.answers) {
      const answerMap = new Map<string, QuestionAnswer>()
      initialProgress.answers.forEach(result => {
        answerMap.set(result.questionId, {
          questionId: result.questionId,
          answer: result.userAnswer,
          confidence: result.confidence,
          timeSpent: result.timeSpent || 0,
          flagged: result.flaggedForReview
        })
      })
      setAnswers(answerMap)
    }
  }, [initialProgress])

  // Auto-save progress
  useEffect(() => {
    if (onSave && answers.size > 0) {
      const saveTimer = setTimeout(() => {
        const questionResults = Array.from(answers.values()).map(answer => ({
          id: '', // Will be generated on backend
          assessmentResultId: '', // Will be set on backend
          questionId: answer.questionId,
          userAnswer: answer.answer,
          isCorrect: false, // Will be calculated on backend
          points: 0, // Will be calculated on backend
          timeSpent: answer.timeSpent,
          confidence: answer.confidence,
          flaggedForReview: answer.flagged,
          createdAt: new Date()
        }))

        onSave({
          currentQuestion: currentQuestionIndex + 1,
          answers: questionResults,
          timeSpent,
          flaggedQuestions
        })
      }, 2000) // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer)
    }
  }, [answers, currentQuestionIndex, timeSpent, flaggedQuestions, onSave])

  const handleAnswerChange = useCallback((answer: string[]) => {
    if (!currentQuestion) return

    const currentAnswer = answers.get(currentQuestion.id)
    const questionStartTime = Date.now()
    
    setAnswers(prev => {
      const newAnswers = new Map(prev)
      newAnswers.set(currentQuestion.id, {
        questionId: currentQuestion.id,
        answer,
        confidence: currentAnswer?.confidence,
        timeSpent: currentAnswer?.timeSpent || 0,
        flagged: currentAnswer?.flagged || false
      })
      return newAnswers
    })

    // Show instant feedback if enabled and answer is complete
    if (showRealTimeFeedback && answer.length > 0) {
      // In a real app, you might want to validate the answer here
      // For now, we'll just show that the answer was recorded
    }
  }, [currentQuestion, answers, showRealTimeFeedback])

  const handleQuestionFlag = useCallback(() => {
    const questionNumber = currentQuestionIndex + 1
    setFlaggedQuestions(prev => {
      if (prev.includes(questionNumber)) {
        return prev.filter(q => q !== questionNumber)
      } else {
        return [...prev, questionNumber]
      }
    })

    // Update the answer's flagged status
    if (currentQuestion) {
      setAnswers(prev => {
        const newAnswers = new Map(prev)
        const currentAnswer = newAnswers.get(currentQuestion.id)
        if (currentAnswer) {
          newAnswers.set(currentQuestion.id, {
            ...currentAnswer,
            flagged: !flaggedQuestions.includes(questionNumber)
          })
        }
        return newAnswers
      })
    }
  }, [currentQuestionIndex, currentQuestion, flaggedQuestions])

  const handleConfidenceChange = useCallback((confidence: number) => {
    if (!currentQuestion) return

    setAnswers(prev => {
      const newAnswers = new Map(prev)
      const currentAnswer = newAnswers.get(currentQuestion.id)
      if (currentAnswer) {
        newAnswers.set(currentQuestion.id, {
          ...currentAnswer,
          confidence
        })
      }
      return newAnswers
    })
  }, [currentQuestion])

  const handleNavigation = useCallback((direction: 'prev' | 'next' | number) => {
    let newIndex: number

    if (typeof direction === 'number') {
      newIndex = direction - 1 // Convert to 0-based index
    } else if (direction === 'prev') {
      newIndex = Math.max(0, currentQuestionIndex - 1)
    } else {
      newIndex = Math.min(questions.length - 1, currentQuestionIndex + 1)
    }

    setCurrentQuestionIndex(newIndex)
    setLastAnswerFeedback(null) // Clear feedback when navigating
  }, [currentQuestionIndex, questions.length])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      const questionResults: QuestionResult[] = questions.map(question => {
        const answer = answers.get(question.id)
        return {
          id: '', // Will be generated on backend
          assessmentResultId: '', // Will be set on backend
          questionId: question.id,
          userAnswer: answer?.answer || [],
          isCorrect: false, // Will be calculated on backend
          points: 0, // Will be calculated on backend
          timeSpent: answer?.timeSpent || 0,
          confidence: answer?.confidence,
          flaggedForReview: answer?.flagged || false,
          createdAt: new Date()
        }
      })

      await onSubmit({
        answers: questionResults,
        timeSpent,
        status: AssessmentStatus.COMPLETED
      })

    } catch (error) {
      console.error('Failed to submit assessment:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false)
      setShowConfirmSubmit(false)
    }
  }, [answers, questions, timeSpent, onSubmit])

  const handleTimeUp = useCallback(() => {
    // Auto-submit when time is up
    handleSubmit()
  }, [handleSubmit])

  const handlePause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const handleResume = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Update time spent
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isPaused])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return

      switch (e.key) {
        case 'ArrowLeft':
          if (currentQuestionIndex > 0) {
            handleNavigation('prev')
          }
          break
        case 'ArrowRight':
          if (currentQuestionIndex < questions.length - 1) {
            handleNavigation('next')
          }
          break
        case 'f':
        case 'F':
          handleQuestionFlag()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestionIndex, questions.length, handleNavigation, handleQuestionFlag])

  // If assessment is completed and we have results, show results
  if (assessmentResult) {
    return (
      <div className={className}>
        <AssessmentResults
          result={assessmentResult}
          questions={questions}
          questionResults={Array.from(answers.values()).map(answer => ({
            id: '',
            assessmentResultId: '',
            questionId: answer.questionId,
            userAnswer: answer.answer,
            isCorrect: false,
            points: 0,
            timeSpent: answer.timeSpent,
            confidence: answer.confidence,
            flaggedForReview: answer.flagged,
            createdAt: new Date()
          }))}
          onRetake={() => window.location.reload()}
          onViewDetails={() => {}}
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {assessment.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {assessment.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {assessment.timeLimit && (
                <AssessmentTimer
                  totalTimeMinutes={assessment.timeLimit}
                  onTimeUp={handleTimeUp}
                  onTimeUpdate={(remaining) => {}}
                  isActive={!isPaused}
                  isPaused={isPaused}
                  onPause={allowPause ? handlePause : undefined}
                  onResume={allowPause ? handleResume : undefined}
                  showControls={allowPause}
                />
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNavigation(!showNavigation)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Navigation
                </Button>

                {onExit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmExit(true)}
                  >
                    Exit
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <ProgressIndicator
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              answeredQuestions={totalAnswered}
              flaggedQuestions={flaggedQuestions}
              variant="compact"
            />
          </div>
        </div>
      </div>

      {/* Time Warning */}
      {remainingTime && remainingTime < 600 && showTimeWarning && ( // 10 minutes
        <TimeWarning
          remainingMinutes={remainingTime / 60}
          onDismiss={() => setShowTimeWarning(false)}
        />
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Real-time Feedback */}
              {showRealTimeFeedback && (
                <RealTimeFeedback
                  questionsAnswered={totalAnswered}
                  totalQuestions={questions.length}
                  correctAnswers={0} // This would be calculated based on immediate validation
                  timeSpent={timeSpent}
                  averageTimePerQuestion={totalAnswered > 0 ? timeSpent / totalAnswered : undefined}
                />
              )}

              {/* Question Card */}
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                userAnswer={answers.get(currentQuestion.id)?.answer || []}
                onAnswerChange={handleAnswerChange}
                onFlag={handleQuestionFlag}
                isFlagged={flaggedQuestions.includes(currentQuestionIndex + 1)}
                confidence={answers.get(currentQuestion.id)?.confidence}
                onConfidenceChange={handleConfidenceChange}
              />

              {/* Instant Answer Feedback */}
              {lastAnswerFeedback && (
                <AnswerFeedback
                  isCorrect={lastAnswerFeedback.isCorrect}
                  explanation={lastAnswerFeedback.explanation}
                  points={lastAnswerFeedback.points}
                  timeSpent={lastAnswerFeedback.timeSpent}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('prev')}
                  disabled={currentQuestionIndex === 0}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleQuestionFlag}
                    className={`gap-2 ${
                      flaggedQuestions.includes(currentQuestionIndex + 1)
                        ? 'text-yellow-600 border-yellow-300'
                        : ''
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    {flaggedQuestions.includes(currentQuestionIndex + 1) ? 'Unflag' : 'Flag'}
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={() => setShowConfirmSubmit(true)}
                      className="gap-2"
                      disabled={isSubmitting}
                    >
                      <Send className="w-4 h-4" />
                      Submit Assessment
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleNavigation('next')}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-32">
              {/* Progress Details */}
              <ProgressIndicator
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                answeredQuestions={totalAnswered}
                flaggedQuestions={flaggedQuestions}
                variant="detailed"
              />

              {/* Question Navigation */}
              {showNavigation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Navigation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionNavigation
                      currentQuestion={currentQuestionIndex + 1}
                      totalQuestions={questions.length}
                      answeredQuestions={totalAnswered}
                      flaggedQuestions={flaggedQuestions}
                      onQuestionSelect={handleNavigation}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to submit your assessment?</p>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Answered: {totalAnswered}/{questions.length}</div>
                <div>Flagged: {flaggedQuestions.length}</div>
                <div>Time Spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</div>
                <div>Unanswered: {questions.length - totalAnswered}</div>
              </div>
            </div>

            {questions.length - totalAnswered > 0 && (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  You have {questions.length - totalAnswered} unanswered questions.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showConfirmExit} onOpenChange={setShowConfirmExit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to exit? Your progress will be saved.</p>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              You can return to this assessment later and continue from where you left off.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmExit(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onExit}>
              Exit Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}