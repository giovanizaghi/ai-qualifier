"use client"

import { Clock, Target, TrendingUp, BookOpen } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"


interface QualificationProgressData {
  id: string
  title: string
  category: string
  difficulty: string
  completionPercentage: number
  status: string
  studyTimeMinutes: number
  bestScore?: number
  lastAttemptScore?: number
  attempts: number
  estimatedDuration: number
  currentTopic?: string
  completedTopics: string[]
}

interface QualificationProgressWidgetProps {
  qualifications: QualificationProgressData[]
  className?: string
}

export function QualificationProgressWidget({ 
  qualifications, 
  className 
}: QualificationProgressWidgetProps) {
  const inProgressQualifications = qualifications.filter(q => q.status === 'IN_PROGRESS')
  const completedQualifications = qualifications.filter(q => q.status === 'COMPLETED')
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Qualification Progress
        </CardTitle>
        <CardDescription>
          Track your progress across all AI qualifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {inProgressQualifications.length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedQualifications.length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(qualifications.reduce((acc, q) => acc + q.studyTimeMinutes, 0) / 60)}h
            </div>
            <div className="text-sm text-muted-foreground">Study Time</div>
          </div>
        </div>

        {/* Active Qualifications */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">ACTIVE QUALIFICATIONS</h4>
          {inProgressQualifications.length > 0 ? (
            inProgressQualifications.map((qualification) => (
              <div key={qualification.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h5 className="font-medium">{qualification.title}</h5>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {qualification.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {qualification.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {qualification.completionPercentage}% complete
                  </div>
                </div>

                <Progress value={qualification.completionPercentage} className="h-2" />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {qualification.studyTimeMinutes}m studied
                    </div>
                    {qualification.bestScore && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Best: {qualification.bestScore}%
                      </div>
                    )}
                  </div>
                  <Link href={`/assessments/${qualification.id}`}>
                    <Button variant="outline" size="sm">
                      Continue
                    </Button>
                  </Link>
                </div>

                {qualification.currentTopic && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Current topic: </span>
                    <span className="font-medium">{qualification.currentTopic}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active qualifications</p>
              <p className="text-sm">Start a new qualification to track your progress</p>
            </div>
          )}
        </div>

        {/* Completed Qualifications Preview */}
        {completedQualifications.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">RECENTLY COMPLETED</h4>
              <Link href="/qualifications?filter=completed">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all
                </Button>
              </Link>
            </div>
            {completedQualifications.slice(0, 2).map((qualification) => (
              <div key={qualification.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{qualification.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Score: {qualification.bestScore}% • {qualification.attempts} attempt{qualification.attempts !== 1 ? 's' : ''}
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  Completed
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}