"use client"

import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  BookOpen, 
  Clock, 
  Star,
  ArrowRight,
  Brain,
  Lightbulb,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"


interface Recommendation {
  id: string
  type: 'qualification' | 'topic' | 'skill_gap' | 'review'
  title: string
  description: string
  reason: string
  confidence: number // 0-100
  priority: 'high' | 'medium' | 'low'
  category: string
  difficulty: string
  estimatedTime: number // in minutes
  metadata?: {
    currentScore?: number
    averageScore?: number
    completionRate?: number
    relatedQualifications?: string[]
  }
}

interface StudyInsight {
  type: 'strength' | 'weakness' | 'trend' | 'opportunity'
  title: string
  description: string
  actionItems: string[]
  impact: 'high' | 'medium' | 'low'
}

interface PersonalizedRecommendationsProps {
  recommendations: Recommendation[]
  studyInsights: StudyInsight[]
  learningStyle: string
  preferredDifficulty: string
  className?: string
}

export function PersonalizedRecommendations({ 
  recommendations,
  studyInsights,
  learningStyle,
  preferredDifficulty,
  className 
}: PersonalizedRecommendationsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qualification':
        return <BookOpen className="h-4 w-4" />
      case 'topic':
        return <Target className="h-4 w-4" />
      case 'skill_gap':
        return <TrendingUp className="h-4 w-4" />
      case 'review':
        return <Brain className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Star className="h-4 w-4 text-green-600" />
      case 'weakness':
        return <Target className="h-4 w-4 text-red-600" />
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-orange-600" />
      default:
        return <Brain className="h-4 w-4 text-gray-600" />
    }
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Personalized Recommendations
        </CardTitle>
        <CardDescription>
          AI-powered suggestions tailored to your learning style and goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Learning Profile */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            YOUR LEARNING PROFILE
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Learning Style: </span>
              <Badge variant="outline" className="ml-1">{learningStyle}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Preferred Level: </span>
              <Badge variant="outline" className="ml-1">{preferredDifficulty}</Badge>
            </div>
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">TOP RECOMMENDATIONS</h4>
          <div className="space-y-3">
            {sortedRecommendations.slice(0, 3).map((recommendation) => (
              <div key={recommendation.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getTypeIcon(recommendation.type)}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{recommendation.title}</h5>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {recommendation.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority} priority
                  </Badge>
                </div>

                {/* Recommendation Reason */}
                <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                  <span className="font-medium text-blue-800">Why this recommendation: </span>
                  <span className="text-blue-700">{recommendation.reason}</span>
                </div>

                {/* Metadata */}
                {recommendation.metadata && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-xs">
                    {recommendation.metadata.currentScore && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium">{recommendation.metadata.currentScore}%</div>
                        <div className="text-muted-foreground">Current Score</div>
                      </div>
                    )}
                    {recommendation.metadata.averageScore && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium">{recommendation.metadata.averageScore}%</div>
                        <div className="text-muted-foreground">Average Score</div>
                      </div>
                    )}
                    {recommendation.metadata.completionRate && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium">{recommendation.metadata.completionRate}%</div>
                        <div className="text-muted-foreground">Completion Rate</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recommendation.estimatedTime} min
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {recommendation.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {recommendation.confidence}% match
                    </div>
                  </div>
                  <Link href={`/assessments/${recommendation.id}`}>
                    <Button size="sm" variant="default">
                      Start Now <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">STUDY INSIGHTS</h4>
          <div className="space-y-3">
            {studyInsights.slice(0, 2).map((insight, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{insight.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    insight.impact === 'high' ? 'border-red-200 text-red-700' :
                    insight.impact === 'medium' ? 'border-yellow-200 text-yellow-700' :
                    'border-green-200 text-green-700'
                  }`}>
                    {insight.impact} impact
                  </Badge>
                </div>
                
                {insight.actionItems.length > 0 && (
                  <div className="mt-2 pl-7">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Recommended Actions:
                    </div>
                    <ul className="space-y-1">
                      {insight.actionItems.slice(0, 2).map((action, actionIndex) => (
                        <li key={actionIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">QUICK ACTIONS</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/assessments?difficulty=review">
              <Button variant="outline" className="w-full justify-between" size="sm">
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Review Weak Areas
                </span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/learning-paths">
              <Button variant="outline" className="w-full justify-between" size="sm">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Explore Learning Paths
                </span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Recommendation Confidence</h4>
            <span className="text-sm font-bold text-green-600">
              {Math.round(recommendations.reduce((acc, r) => acc + r.confidence, 0) / recommendations.length)}%
            </span>
          </div>
          <Progress 
            value={recommendations.reduce((acc, r) => acc + r.confidence, 0) / recommendations.length} 
            className="h-2" 
          />
          <p className="text-xs text-muted-foreground mt-1">
            Based on your learning history and performance patterns
          </p>
        </div>
      </CardContent>
    </Card>
  )
}