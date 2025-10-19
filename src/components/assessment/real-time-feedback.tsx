"use client"

import { CheckCircle, XCircle, Clock, TrendingUp, AlertCircle } from "lucide-react"
import React, { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface FeedbackMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  autoHide?: boolean
  duration?: number
}

interface RealTimeFeedbackProps {
  currentScore?: number
  questionsAnswered: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  averageTimePerQuestion?: number
  showProgress?: boolean
  showEncouragement?: boolean
  className?: string
}

export function RealTimeFeedback({
  currentScore,
  questionsAnswered,
  totalQuestions,
  correctAnswers,
  timeSpent,
  averageTimePerQuestion,
  showProgress = true,
  showEncouragement = true,
  className = ""
}: RealTimeFeedbackProps) {
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([])
  const [previousStats, setPreviousStats] = useState({
    score: currentScore || 0,
    answered: questionsAnswered,
    correct: correctAnswers
  })

  const addFeedbackMessage = (message: Omit<FeedbackMessage, 'id' | 'timestamp'>) => {
    const newMessage: FeedbackMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }

    setFeedbackMessages(prev => [newMessage, ...prev.slice(0, 4)]) // Keep only last 5 messages

    if (message.autoHide !== false) {
      setTimeout(() => {
        setFeedbackMessages(prev => prev.filter(msg => msg.id !== newMessage.id))
      }, message.duration || 3000)
    }
  }

  // Monitor progress and provide feedback
  useEffect(() => {
    // New question answered
    if (questionsAnswered > previousStats.answered) {
      const wasCorrect = correctAnswers > previousStats.correct
      
      if (wasCorrect) {
        addFeedbackMessage({
          type: 'success',
          title: 'Correct!',
          message: `Great job! You're doing well.`,
          autoHide: true,
          duration: 2000
        })
      } else {
        addFeedbackMessage({
          type: 'error',
          title: 'Incorrect',
          message: `Don't worry, keep going!`,
          autoHide: true,
          duration: 2000
        })
      }
    }

    // Score milestones
    if (currentScore !== undefined && currentScore !== previousStats.score) {
      if (currentScore >= 90 && previousStats.score < 90) {
        addFeedbackMessage({
          type: 'success',
          title: 'Excellent!',
          message: 'You\'re performing exceptionally well!',
          autoHide: true,
          duration: 3000
        })
      } else if (currentScore >= 80 && previousStats.score < 80) {
        addFeedbackMessage({
          type: 'success',
          title: 'Great Progress!',
          message: 'You\'re on track for a strong score!',
          autoHide: true,
          duration: 3000
        })
      } else if (currentScore < 60 && questionsAnswered > totalQuestions / 2) {
        addFeedbackMessage({
          type: 'warning',
          title: 'Focus Up!',
          message: 'Take your time and think through each answer.',
          autoHide: true,
          duration: 4000
        })
      }
    }

    // Halfway point encouragement
    if (questionsAnswered === Math.floor(totalQuestions / 2) && showEncouragement) {
      addFeedbackMessage({
        type: 'info',
        title: 'Halfway There!',
        message: `You're making great progress. ${totalQuestions - questionsAnswered} questions to go!`,
        autoHide: true,
        duration: 3000
      })
    }

    // Almost done encouragement
    if (questionsAnswered === totalQuestions - 2 && showEncouragement) {
      addFeedbackMessage({
        type: 'info',
        title: 'Almost Done!',
        message: 'Just a couple more questions left!',
        autoHide: true,
        duration: 3000
      })
    }

    setPreviousStats({
      score: currentScore || 0,
      answered: questionsAnswered,
      correct: correctAnswers
    })
  }, [questionsAnswered, correctAnswers, currentScore, totalQuestions, showEncouragement])

  // Time-based feedback
  useEffect(() => {
    if (averageTimePerQuestion && averageTimePerQuestion > 180) { // More than 3 minutes average
      addFeedbackMessage({
        type: 'warning',
        title: 'Time Check',
        message: 'Consider picking up the pace to ensure you finish on time.',
        autoHide: true,
        duration: 4000
      })
    }
  }, [averageTimePerQuestion])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getAccuracyRate = () => {
    return questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0
  }

  const getFeedbackIcon = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'info':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const getFeedbackStyles = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Real-time Progress Stats */}
      {showProgress && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {questionsAnswered}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Answered
                </div>
              </div>
              
              <div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {Math.round(getAccuracyRate())}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Accuracy
                </div>
              </div>
              
              {currentScore !== undefined && (
                <div>
                  <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {Math.round(currentScore)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Current Score
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeSpent)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Time Spent
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Messages */}
      <div className="space-y-2">
        {feedbackMessages.map((message) => (
          <div
            key={message.id}
            className={`
              p-3 rounded-lg border-l-4 transition-all duration-300 animate-in slide-in-from-right-2
              ${getFeedbackStyles(message.type)}
            `}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              {getFeedbackIcon(message.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {message.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {message.message}
                </div>
              </div>
              <button
                onClick={() => setFeedbackMessages(prev => prev.filter(msg => msg.id !== message.id))}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Badges */}
      {showEncouragement && (
        <div className="flex flex-wrap gap-2">
          {getAccuracyRate() >= 90 && questionsAnswered >= 3 && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              🎯 Sharp Shooter
            </Badge>
          )}
          
          {questionsAnswered === Math.floor(totalQuestions / 2) && (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              🏃‍♂️ Halfway Hero
            </Badge>
          )}
          
          {correctAnswers >= 5 && (
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              🔥 On Fire
            </Badge>
          )}
          
          {averageTimePerQuestion && averageTimePerQuestion < 60 && questionsAnswered >= 3 && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              ⚡ Speed Demon
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Instant Answer Feedback Component
export function AnswerFeedback({
  isCorrect,
  explanation,
  points,
  timeSpent,
  showExplanation = false,
  onNext,
  className = ""
}: {
  isCorrect: boolean
  explanation?: string
  points?: number
  timeSpent?: number
  showExplanation?: boolean
  onNext?: () => void
  className?: string
}) {
  const [showDetails, setShowDetails] = useState(showExplanation)

  const formatTime = (seconds: number) => {
    return `${seconds}s`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Immediate Feedback */}
      <div className={`
        p-4 rounded-lg border-l-4 
        ${isCorrect 
          ? 'bg-green-50 border-green-400 dark:bg-green-950 dark:border-green-600' 
          : 'bg-red-50 border-red-400 dark:bg-red-950 dark:border-red-600'
        }
      `}>
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          )}
          
          <div className="flex-1">
            <div className={`font-medium ${
              isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm">
              {points && (
                <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {isCorrect ? `+${points}` : '0'} points
                </span>
              )}
              
              {timeSpent && (
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(timeSpent)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="space-y-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            {showDetails ? 'Hide' : 'Show'} Explanation
          </button>
          
          {showDetails && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: explanation }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}