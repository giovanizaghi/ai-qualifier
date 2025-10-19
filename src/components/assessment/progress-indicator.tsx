"use client"

import { CheckCircle, Circle, Flag, AlertCircle } from "lucide-react"
import React from "react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ProgressIndicatorProps {
  currentQuestion: number
  totalQuestions: number
  answeredQuestions: number
  flaggedQuestions?: number[]
  skippedQuestions?: number[]
  className?: string
  showDetails?: boolean
  variant?: 'compact' | 'detailed' | 'minimal'
}

export function ProgressIndicator({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  flaggedQuestions = [],
  skippedQuestions = [],
  className = "",
  showDetails = true,
  variant = 'detailed'
}: ProgressIndicatorProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100
  const completionPercentage = (answeredQuestions / totalQuestions) * 100
  const remainingQuestions = totalQuestions - currentQuestion
  const unansweredQuestions = totalQuestions - answeredQuestions

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1">
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {currentQuestion}/{totalQuestions}
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Question {currentQuestion} of {totalQuestions}
          </span>
          <span className="text-gray-500">
            {Math.round(progressPercentage)}% complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        {showDetails && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {answeredQuestions} answered
            </span>
            {flaggedQuestions.length > 0 && (
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3 text-yellow-500" />
                {flaggedQuestions.length} flagged
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Assessment Progress
        </h3>
        <Badge variant="outline" className="text-xs">
          {Math.round(progressPercentage)}% Complete
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Question {currentQuestion} of {totalQuestions}</span>
          <span>{remainingQuestions} remaining</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Stats Grid */}
      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-lg font-semibold text-green-700 dark:text-green-300">
              {answeredQuestions}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Answered
            </div>
          </div>

          <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {unansweredQuestions}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Unanswered
            </div>
          </div>

          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Flag className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
              {flaggedQuestions.length}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              Flagged
            </div>
          </div>

          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Circle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {Math.round(completionPercentage)}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Complete
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Question Navigation Component
export function QuestionNavigation({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  flaggedQuestions = [],
  skippedQuestions = [],
  onQuestionSelect,
  className = ""
}: {
  currentQuestion: number
  totalQuestions: number
  answeredQuestions: number
  flaggedQuestions?: number[]
  skippedQuestions?: number[]
  onQuestionSelect: (questionNumber: number) => void
  className?: string
}) {
  const getQuestionStatus = (questionNum: number) => {
    if (questionNum === currentQuestion) {return 'current'}
    if (flaggedQuestions.includes(questionNum)) {return 'flagged'}
    if (skippedQuestions.includes(questionNum)) {return 'skipped'}
    if (questionNum <= answeredQuestions) {return 'answered'}
    return 'unanswered'
  }

  const getQuestionStyles = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 ring-offset-2'
      case 'answered':
        return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
      case 'flagged':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700'
      case 'skipped':
        return 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700'
      default:
        return 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Question Navigation
      </h4>
      
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const questionNum = index + 1
          const status = getQuestionStatus(questionNum)
          
          return (
            <button
              key={questionNum}
              onClick={() => onQuestionSelect(questionNum)}
              className={`
                relative w-10 h-10 text-sm font-medium rounded-lg border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${getQuestionStyles(status)}
              `}
              aria-label={`Go to question ${questionNum} (${status})`}
              title={`Question ${questionNum} - ${status}`}
            >
              {questionNum}
              {status === 'flagged' && (
                <Flag className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" fill="currentColor" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Flagged</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-gray-600 dark:text-gray-400">Unanswered</span>
        </div>
      </div>
    </div>
  )
}