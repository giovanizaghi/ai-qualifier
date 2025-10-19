"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Question, QuestionType, DifficultyLevel } from "@/types"
import { Clock, Flag, Star } from "lucide-react"

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  userAnswer: string[]
  onAnswerChange: (answer: string[]) => void
  onFlag: () => void
  isFlagged: boolean
  timeSpent?: number
  showExplanation?: boolean
  isReviewMode?: boolean
  confidence?: number
  onConfidenceChange?: (confidence: number) => void
  className?: string
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  userAnswer,
  onAnswerChange,
  onFlag,
  isFlagged,
  timeSpent,
  showExplanation = false,
  isReviewMode = false,
  confidence,
  onConfidenceChange,
  className = ""
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState<string[]>(userAnswer)

  useEffect(() => {
    setLocalAnswer(userAnswer)
  }, [userAnswer])

  const handleAnswerSelection = (value: string, isSelected: boolean) => {
    let newAnswer: string[]

    if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      newAnswer = isSelected ? [value] : []
    } else if (question.type === QuestionType.MULTIPLE_SELECT) {
      if (isSelected) {
        newAnswer = [...localAnswer, value]
      } else {
        newAnswer = localAnswer.filter(answer => answer !== value)
      }
    } else {
      newAnswer = isSelected ? [value] : []
    }

    setLocalAnswer(newAnswer)
    onAnswerChange(newAnswer)
  }

  const handleTextAnswer = (value: string) => {
    const newAnswer = [value]
    setLocalAnswer(newAnswer)
    onAnswerChange(newAnswer)
  }

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case DifficultyLevel.INTERMEDIATE:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case DifficultyLevel.ADVANCED:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case DifficultyLevel.EXPERT:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const renderQuestionOptions = () => {
    const options = question.options as any

    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.MULTIPLE_SELECT:
        return (
          <div className="space-y-3">
            {options?.choices?.map((option: any, index: number) => {
              const optionId = option.id || String.fromCharCode(65 + index)
              const isSelected = localAnswer.includes(optionId)
              
              return (
                <div
                  key={optionId}
                  className={`
                    flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }
                    ${isReviewMode ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  onClick={() => !isReviewMode && handleAnswerSelection(optionId, !isSelected)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isReviewMode) {
                      e.preventDefault()
                      handleAnswerSelection(optionId, !isSelected)
                    }
                  }}
                >
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300 mr-2">
                      {optionId}.
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {option.text || option}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )

      case QuestionType.TRUE_FALSE:
        return (
          <div className="space-y-3">
            {['true', 'false'].map((option) => {
              const isSelected = localAnswer.includes(option)
              
              return (
                <div
                  key={option}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }
                    ${isReviewMode ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  onClick={() => !isReviewMode && handleAnswerSelection(option, !isSelected)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isReviewMode) {
                      e.preventDefault()
                      handleAnswerSelection(option, !isSelected)
                    }
                  }}
                >
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="capitalize text-gray-900 dark:text-gray-100 font-medium">
                    {option}
                  </span>
                </div>
              )
            })}
          </div>
        )

      case QuestionType.FILL_IN_BLANK:
        return (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter your answer..."
              value={localAnswer[0] || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              disabled={isReviewMode}
              className="w-full"
              aria-label="Your answer"
            />
          </div>
        )

      case QuestionType.ESSAY:
        return (
          <div className="space-y-3">
            <textarea
              placeholder="Enter your detailed answer..."
              value={localAnswer[0] || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              disabled={isReviewMode}
              className="w-full min-h-[120px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              aria-label="Your detailed answer"
            />
          </div>
        )

      default:
        return (
          <div className="text-gray-500 dark:text-gray-400 italic">
            Question type not supported yet
          </div>
        )
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Question {questionNumber} of {totalQuestions}
              </Badge>
              <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                {question.difficulty}
              </Badge>
              {question.category && (
                <Badge variant="secondary" className="text-xs">
                  {question.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {question.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {timeSpent && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onFlag}
              className={`p-2 ${isFlagged ? 'text-yellow-600' : 'text-gray-400'}`}
              aria-label={isFlagged ? "Remove flag" : "Flag for review"}
            >
              <Flag className="w-4 h-4" fill={isFlagged ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {question.content && (
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: question.content }} />
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {question.type === QuestionType.MULTIPLE_SELECT ? 'Select all that apply:' : 'Select your answer:'}
          </h4>
          {renderQuestionOptions()}
        </div>

        {onConfidenceChange && !isReviewMode && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              How confident are you in your answer?
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant={confidence === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => onConfidenceChange(level)}
                  className="p-2"
                  aria-label={`Confidence level ${level}`}
                >
                  <Star 
                    className="w-4 h-4" 
                    fill={confidence && confidence >= level ? "currentColor" : "none"}
                  />
                </Button>
              ))}
              <span className="text-sm text-gray-500 ml-2">
                {confidence ? ['Very Low', 'Low', 'Medium', 'High', 'Very High'][confidence - 1] : 'Not set'}
              </span>
            </div>
          </div>
        )}

        {showExplanation && question.explanation && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Explanation:
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
            </div>
          </div>
        )}

        {question.points && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Points: {question.points}
            {question.timeEstimate && ` • Estimated time: ${Math.ceil(question.timeEstimate / 60)} min`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}