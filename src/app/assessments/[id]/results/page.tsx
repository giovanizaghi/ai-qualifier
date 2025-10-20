"use client"

import { ArrowLeft, BookOpen, Clock, TrendingUp, TrendingDown, Award, Download, Eye, Calendar, Target, RefreshCw } from 'lucide-react'
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
  }
}

interface PerformanceTrend {
  attempt: number
  score: number
  date: string
  passed: boolean
  timeSpent?: number
}

interface CategoryBreakdown {
  category: string
  score: number
  questions: number
  color: string
}

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.id as string

  const [assessment, setAssessment] = useState<AssessmentWithDetails | null>(null)
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<AssessmentResult | null>(null)

  useEffect(() => {
    if (assessmentId) {
      fetchResultsData()
    }
  }, [assessmentId])

  const fetchResultsData = async () => {
    try {
      setLoading(true)
      
      // Fetch assessment details and user's results
      const [assessmentResponse, resultsResponse] = await Promise.all([
        fetch(`/api/assessments/${assessmentId}`),
        fetch(`/api/assessment-results?assessmentId=${assessmentId}`)
      ])

      if (!assessmentResponse.ok) {
        throw new Error('Assessment not found')
      }

      const assessmentData = await assessmentResponse.json()
      setAssessment(assessmentData.data)

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        const userResults = resultsData.data || []
        setResults(userResults)
        
        // Pre-select the most recent result
        if (userResults.length > 0) {
          setSelectedResult(userResults[0])
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getPerformanceTrend = (): PerformanceTrend[] => {
    return results
      .slice()
      .reverse() // Show oldest first for chronological trend
      .map((result, index) => ({
        attempt: index + 1,
        score: result.score,
        date: formatDate(result.completedAt),
        passed: result.passed,
        timeSpent: result.timeSpent
      }))
  }

  const getCategoryBreakdown = (result: AssessmentResult): CategoryBreakdown[] => {
    if (!result.categoryScores) return []
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']
    
    return Object.entries(result.categoryScores as Record<string, any>).map(([category, data], index) => ({
      category,
      score: data.score || 0,
      questions: data.total || 0,
      color: colors[index % colors.length]
    }))
  }

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) return 'text-green-600'
    if (score >= passingScore * 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleRetakeAssessment = () => {
    router.push(`/assessments/${assessmentId}/take`)
  }

  const handleViewDetails = (result: AssessmentResult) => {
    setSelectedResult(result)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading assessment results...</p>
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

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/assessments/${assessmentId}`)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessment
          </Button>
          
          <Card className="max-w-md mx-auto text-center p-8">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Results Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't taken this assessment yet. Start your first attempt to see your results here.
            </p>
            <Button onClick={handleRetakeAssessment} className="gap-2">
              <BookOpen className="w-4 h-4" />
              Take Assessment
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const performanceTrend = getPerformanceTrend()
  const bestScore = Math.max(...results.map(r => r.score))
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const passedAttempts = results.filter(r => r.passed).length
  const totalTime = results.reduce((sum, r) => sum + (r.timeSpent || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/assessments/${assessmentId}`)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessment
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Assessment Results
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {assessment.title}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                {assessment.qualification.title}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={fetchResultsData} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button onClick={handleRetakeAssessment} className="gap-2">
                <BookOpen className="w-4 h-4" />
                Retake Assessment
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getScoreColor(bestScore, assessment.qualification.passingScore))}>
                {bestScore.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {bestScore >= assessment.qualification.passingScore ? 'Passed' : 'Not passed'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Across {results.length} attempt{results.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.length > 0 ? Math.round((passedAttempts / results.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {passedAttempts} of {results.length} passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(totalTime / 60)}min</div>
              <p className="text-xs text-muted-foreground">
                Avg: {Math.floor(totalTime / results.length / 60)}min per attempt
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="trends">Performance Trends</TabsTrigger>
                <TabsTrigger value="attempts">All Attempts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Performance Trend Chart */}
                {performanceTrend.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Score Progression</CardTitle>
                      <CardDescription>
                        Your score improvement over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceTrend.map((trend, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-200">
                                {trend.attempt}
                              </div>
                              <div>
                                <div className="font-medium">{trend.score.toFixed(1)}%</div>
                                <div className="text-sm text-gray-500">{trend.date}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={trend.passed ? "default" : "secondary"}>
                                {trend.passed ? 'Passed' : 'Failed'}
                              </Badge>
                              {index > 0 && (
                                <div className="flex items-center gap-1">
                                  {trend.score > performanceTrend[index - 1].score ? (
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                  ) : trend.score < performanceTrend[index - 1].score ? (
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <div className="w-4 h-4" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Latest Result Details */}
                {selectedResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Latest Attempt Details</CardTitle>
                      <CardDescription>
                        {formatDate(selectedResult.completedAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Final Score:</span>
                            <span className={cn("font-bold", getScoreColor(selectedResult.score, assessment.qualification.passingScore))}>
                              {selectedResult.score.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Correct Answers:</span>
                            <span className="font-medium">
                              {selectedResult.correctAnswers} / {selectedResult.totalQuestions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Incorrect:</span>
                            <span className="font-medium">{selectedResult.incorrectAnswers}</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Time Spent:</span>
                            <span className="font-medium">{formatTime(selectedResult.timeSpent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <Badge variant={selectedResult.passed ? "default" : "secondary"}>
                              {selectedResult.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                          {selectedResult.skippedQuestions > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Skipped:</span>
                              <span className="font-medium">{selectedResult.skippedQuestions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress to passing ({assessment.qualification.passingScore}%)</span>
                          <span>{Math.min(100, (selectedResult.score / assessment.qualification.passingScore) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (selectedResult.score / assessment.qualification.passingScore) * 100)} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Category Breakdown */}
                {selectedResult && getCategoryBreakdown(selectedResult).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Category</CardTitle>
                      <CardDescription>
                        Breakdown of your performance across different topics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getCategoryBreakdown(selectedResult).map((category) => (
                          <div key={category.category} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">{category.category}</span>
                              <span className="text-sm text-gray-500">
                                {category.score.toFixed(0)}% ({category.questions} questions)
                              </span>
                            </div>
                            <Progress value={category.score} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Score History</CardTitle>
                    <CardDescription>
                      Track your improvement across all attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Visual Progress Bar for Trend */}
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>First Attempt</span>
                          <span>Latest Attempt</span>
                        </div>
                        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          {performanceTrend.map((trend, index) => (
                            <div
                              key={index}
                              className="absolute top-0 h-full flex items-center justify-center text-xs font-medium text-white"
                              style={{
                                left: `${(index / (performanceTrend.length - 1)) * 100}%`,
                                width: `${100 / performanceTrend.length}%`,
                                backgroundColor: trend.passed ? '#10B981' : '#EF4444',
                                transform: index === 0 ? 'translateX(0)' : index === performanceTrend.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)'
                              }}
                            >
                              {trend.score.toFixed(0)}%
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {performanceTrend[0]?.score.toFixed(1)}%
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            Passing: {assessment.qualification.passingScore}%
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {performanceTrend[performanceTrend.length - 1]?.score.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Detailed attempt list */}
                      <div className="space-y-3">
                        {performanceTrend.map((trend, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-200">
                                {trend.attempt}
                              </div>
                              <div>
                                <div className={cn("font-bold", getScoreColor(trend.score, assessment.qualification.passingScore))}>
                                  {trend.score.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-500">{trend.date}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {index > 0 && (
                                <div className="flex items-center gap-1 text-sm">
                                  {trend.score > performanceTrend[index - 1].score ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 text-green-500" />
                                      <span className="text-green-600">
                                        +{(trend.score - performanceTrend[index - 1].score).toFixed(1)}%
                                      </span>
                                    </>
                                  ) : trend.score < performanceTrend[index - 1].score ? (
                                    <>
                                      <TrendingDown className="w-4 h-4 text-red-500" />
                                      <span className="text-red-600">
                                        {(trend.score - performanceTrend[index - 1].score).toFixed(1)}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-500">No change</span>
                                  )}
                                </div>
                              )}
                              <Badge variant={trend.passed ? "default" : "secondary"}>
                                {trend.passed ? 'Passed' : 'Failed'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attempts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Attempts</CardTitle>
                    <CardDescription>
                      Complete history of your assessment attempts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.map((result, index) => (
                        <div 
                          key={result.id}
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-colors",
                            selectedResult?.id === result.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                          onClick={() => handleViewDetails(result)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  Attempt #{results.length - index}
                                </span>
                                <Badge variant={result.passed ? "default" : "secondary"}>
                                  {result.passed ? 'Passed' : 'Failed'}
                                </Badge>
                                <span className={cn("font-bold", getScoreColor(result.score, assessment.qualification.passingScore))}>
                                  {result.score.toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {formatDate(result.completedAt)} • {formatTime(result.timeSpent)} • {result.correctAnswers}/{result.totalQuestions} correct
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                <CardTitle className="text-lg">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={cn("text-3xl font-bold", getScoreColor(bestScore, assessment.qualification.passingScore))}>
                    {bestScore.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-500">Best Score</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Best vs Passing</span>
                    <span>{Math.min(100, (bestScore / assessment.qualification.passingScore) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (bestScore / assessment.qualification.passingScore) * 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Latest Achievement */}
            {passedAttempts > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Achievement Unlocked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">Assessment Passed!</div>
                    <p className="text-sm text-gray-500 mt-1">
                      Congratulations on passing this assessment
                    </p>
                    {bestScore >= 90 && (
                      <Badge className="mt-2">Excellent Performance</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleRetakeAssessment} className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retake Assessment
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => router.push(`/assessments/${assessmentId}`)}
                >
                  <BookOpen className="w-4 h-4" />
                  Assessment Details
                </Button>
                {selectedResult?.certificateId && (
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}