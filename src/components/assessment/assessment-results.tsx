"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  AssessmentResult, 
  Question, 
  QuestionResult, 
  DifficultyLevel, 
  QuestionType 
} from "@/types"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  TrendingUp, 
  Award, 
  RefreshCw,
  Eye,
  Download,
  Share
} from "lucide-react"

interface AssessmentResultsProps {
  result: AssessmentResult
  questions: Question[]
  questionResults: QuestionResult[]
  onRetake?: () => void
  onViewDetails?: () => void
  onDownloadCertificate?: () => void
  onShare?: () => void
  showDetailedBreakdown?: boolean
  className?: string
}

export function AssessmentResults({
  result,
  questions,
  questionResults,
  onRetake,
  onViewDetails,
  onDownloadCertificate,
  onShare,
  showDetailedBreakdown = true,
  className = ""
}: AssessmentResultsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, passed: boolean) => {
    if (!passed) return "text-red-600 dark:text-red-400"
    if (score >= 90) return "text-green-600 dark:text-green-400"
    if (score >= 80) return "text-blue-600 dark:text-blue-400"
    return "text-yellow-600 dark:text-yellow-400"
  }

  const getScoreGrade = (score: number) => {
    if (score >= 95) return "A+"
    if (score >= 90) return "A"
    if (score >= 85) return "A-"
    if (score >= 80) return "B+"
    if (score >= 75) return "B"
    if (score >= 70) return "B-"
    if (score >= 65) return "C+"
    if (score >= 60) return "C"
    return "F"
  }

  const getCategoryScores = () => {
    if (!result.categoryScores) return null
    
    try {
      return typeof result.categoryScores === 'string' 
        ? JSON.parse(result.categoryScores) 
        : result.categoryScores
    } catch {
      return null
    }
  }

  const getDifficultyBreakdown = () => {
    const breakdown = {
      [DifficultyLevel.BEGINNER]: { correct: 0, total: 0 },
      [DifficultyLevel.INTERMEDIATE]: { correct: 0, total: 0 },
      [DifficultyLevel.ADVANCED]: { correct: 0, total: 0 },
      [DifficultyLevel.EXPERT]: { correct: 0, total: 0 }
    }

    questionResults.forEach((qr) => {
      const question = questions.find(q => q.id === qr.questionId)
      if (question) {
        breakdown[question.difficulty].total++
        if (qr.isCorrect) {
          breakdown[question.difficulty].correct++
        }
      }
    })

    return breakdown
  }

  const categoryScores = getCategoryScores()
  const difficultyBreakdown = getDifficultyBreakdown()
  const averageTime = result.timeSpent ? Math.floor(result.timeSpent / result.totalQuestions) : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Results Card */}
      <Card className="overflow-hidden">
        <CardHeader className={`
          text-center pb-8
          ${result.passed 
            ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950'
          }
        `}>
          <div className="flex items-center justify-center mb-4">
            {result.passed ? (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl mb-2">
            {result.passed ? 'Congratulations!' : 'Assessment Complete'}
          </CardTitle>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {result.passed 
              ? 'You have successfully passed this assessment!'
              : 'You did not meet the passing requirements this time.'
            }
          </p>

          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(result.score, result.passed)}`}>
                {Math.round(result.score)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Grade: {getScoreGrade(result.score)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Correct Answers
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <div className="font-semibold text-green-600 dark:text-green-400">
                {result.correctAnswers}
              </div>
              <div className="text-xs text-gray-500">Correct</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <div className="font-semibold text-red-600 dark:text-red-400">
                {result.incorrectAnswers}
              </div>
              <div className="text-xs text-gray-500">Incorrect</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                {result.timeSpent ? formatTime(result.timeSpent) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Total Time</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <div className="font-semibold text-purple-600 dark:text-purple-400">
                {averageTime ? formatTime(averageTime) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Avg/Question</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {onViewDetails && (
              <Button variant="outline" onClick={onViewDetails} className="gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            )}
            
            {onRetake && (
              <Button 
                variant={result.passed ? "outline" : "default"} 
                onClick={onRetake}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {result.passed ? 'Retake Assessment' : 'Try Again'}
              </Button>
            )}
            
            {result.passed && result.certificateId && onDownloadCertificate && (
              <Button variant="default" onClick={onDownloadCertificate} className="gap-2">
                <Download className="w-4 h-4" />
                Download Certificate
              </Button>
            )}
            
            {onShare && (
              <Button variant="outline" onClick={onShare} className="gap-2">
                <Share className="w-4 h-4" />
                Share Result
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          {categoryScores && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(categoryScores).map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">
                        {category.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {Math.round(score as number)}%
                      </span>
                    </div>
                    <Progress value={score as number} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Difficulty Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Difficulty Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(difficultyBreakdown).map(([difficulty, stats]) => {
                if (stats.total === 0) return null
                const percentage = (stats.correct / stats.total) * 100
                
                return (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            difficulty === DifficultyLevel.BEGINNER ? 'bg-green-50 text-green-700' :
                            difficulty === DifficultyLevel.INTERMEDIATE ? 'bg-yellow-50 text-yellow-700' :
                            difficulty === DifficultyLevel.ADVANCED ? 'bg-orange-50 text-orange-700' :
                            'bg-red-50 text-red-700'
                          }`}
                        >
                          {difficulty}
                        </Badge>
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.correct}/{stats.total}
                        </span>
                      </div>
                      <span className="font-medium">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none text-sm">
            {result.passed ? (
              <div className="space-y-2">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  🎉 Excellent work! You've successfully demonstrated your knowledge in this area.
                </p>
                {result.score >= 90 && (
                  <p>Your outstanding score shows exceptional understanding of the material.</p>
                )}
                {result.incorrectAnswers === 0 && (
                  <p>Perfect score! You answered every question correctly.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-orange-600 dark:text-orange-400 font-medium">
                  Keep learning! Here are some areas to focus on for improvement:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  {result.incorrectAnswers > result.correctAnswers && (
                    <li>Review the fundamental concepts covered in this assessment</li>
                  )}
                  {averageTime > 120 && (
                    <li>Practice to improve your response time and confidence</li>
                  )}
                  {result.score < 50 && (
                    <li>Consider additional study materials or practice exercises</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}