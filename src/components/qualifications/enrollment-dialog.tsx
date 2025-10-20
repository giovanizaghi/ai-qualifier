"use client"

import { Award, BookOpen, Calendar, CheckCircle, Clock, Target, Trophy, Users, Sparkles, ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface EnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qualification: {
    id: string
    title: string
    description: string
    difficulty: string
    category: string
    estimatedDuration: number
    passingScore: number
    prerequisites: string[]
    learningObjectives: string[]
    _count: {
      assessments: number
      qualificationProgress: number
    }
  }
  onEnroll: () => Promise<void>
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  qualification,
  onEnroll
}: EnrollmentDialogProps) {
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [enrollmentData, setEnrollmentData] = useState<any>(null)

  const handleEnroll = async () => {
    try {
      setEnrolling(true)
      await onEnroll()
      
      // Fetch the enrollment data from the API
      const response = await fetch(`/api/qualifications/${qualification.id}?includeProgress=true`)
      if (response.ok) {
        const data = await response.json()
        setEnrollmentData(data.data.userProgress)
        setEnrolled(true)
      }
    } catch (error) {
      console.error('Enrollment failed:', error)
      onOpenChange(false)
    } finally {
      setEnrolling(false)
    }
  }

  const handleClose = () => {
    setEnrolled(false)
    setEnrollmentData(null)
    onOpenChange(false)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes} min`}
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case 'BEGINNER': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'ADVANCED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'EXPERT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!enrolled ? (
          // Enrollment Confirmation View
          <>
            <DialogHeader>
              <div className="flex items-start gap-4 mb-2">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl">{qualification.title}</DialogTitle>
                  <DialogDescription className="mt-2">
                    {qualification.description}
                  </DialogDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getDifficultyColor(qualification.difficulty)}>
                      {qualification.difficulty.toLowerCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {getCategoryDisplayName(qualification.category)}
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium">{formatDuration(qualification.estimatedDuration)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Assessments</div>
                    <div className="font-medium">{qualification._count.assessments}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Passing Score</div>
                    <div className="font-medium">{qualification.passingScore}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Enrolled</div>
                    <div className="font-medium">{qualification._count.qualificationProgress}</div>
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  What You'll Learn
                </h3>
                <ul className="space-y-2">
                  {qualification.learningObjectives.slice(0, 4).map((objective, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                    </li>
                  ))}
                  {qualification.learningObjectives.length > 4 && (
                    <li className="text-sm text-gray-500 ml-6">
                      +{qualification.learningObjectives.length - 4} more objectives
                    </li>
                  )}
                </ul>
              </div>

              {/* Prerequisites */}
              {qualification.prerequisites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Prerequisites
                  </h3>
                  <ul className="space-y-2">
                    {qualification.prerequisites.map((prerequisite, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What Happens Next */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  What happens after enrollment?
                </h3>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>• You'll get immediate access to all learning materials</li>
                  <li>• Track your progress through the qualification dashboard</li>
                  <li>• Take assessments at your own pace</li>
                  <li>• Earn a certificate upon completion</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={enrolling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="gap-2"
              >
                {enrolling ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Enroll Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Success View
          <>
            <DialogHeader>
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-green-600" />
                </div>
                <DialogTitle className="text-3xl mb-2">Successfully Enrolled!</DialogTitle>
                <DialogDescription className="text-base">
                  You're now enrolled in {qualification.title}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Your Learning Journey Begins
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-semibold text-lg">{enrollmentData?.completionPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollmentData?.completionPercentage || 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{qualification._count.assessments}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Assessments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{enrollmentData?.attempts || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatDuration(qualification.estimatedDuration)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Next Steps</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <div className="font-medium">Review Learning Objectives</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Familiarize yourself with what you'll be learning
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <div className="font-medium">Start Your First Assessment</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Begin with the introductory assessment to gauge your level
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <div className="font-medium">Track Your Progress</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor your advancement through the dashboard
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Encouragement */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>💡 Tip:</strong> Set aside regular study time to maintain momentum. 
                  Consistent practice is key to mastering {qualification.title.toLowerCase()}.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={handleClose}
                className="w-full sm:w-auto gap-2"
              >
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
