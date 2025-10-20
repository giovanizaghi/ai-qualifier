"use client"

import { 
  BookOpen, 
  Trophy, 
  Target, 
  ArrowRight, 
  Sparkles,
  Play,
  Users,
  Clock,
  Star,
  Award,
  TrendingUp,
  Rocket
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface NewUserDashboardEmptyStateProps {
  userName?: string
  className?: string
}

export function NewUserDashboardEmptyState({ 
  userName, 
  className 
}: NewUserDashboardEmptyStateProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Hero Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to AI Qualifier{userName ? `, ${userName}` : ''}! 🎉
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                You're about to embark on an exciting journey to master AI skills and earn recognized qualifications. 
                Let's get you started with your first steps toward becoming an AI expert.
              </p>
            </div>
            
            {/* Quick Start Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Link href="/qualifications">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Rocket className="h-4 w-4 mr-2" />
                  Explore Qualifications
                </Button>
              </Link>
              <Link href="/assessments">
                <Button variant="outline" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Take Your First Assessment
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Learning Journey Starts Here
          </CardTitle>
          <CardDescription>
            Follow these simple steps to make the most of your AI learning experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                  1
                </div>
                <h3 className="font-semibold">Choose Your Path</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse our qualification catalog and find topics that interest you most.
              </p>
              <Link href="/qualifications">
                <Button variant="outline" size="sm" className="w-full">
                  Browse Qualifications
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                  2
                </div>
                <h3 className="font-semibold">Start Learning</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Take assessments to test your knowledge and track your progress.
              </p>
              <Link href="/assessments">
                <Button variant="outline" size="sm" className="w-full">
                  Start Assessment
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">
                  3
                </div>
                <h3 className="font-semibold">Earn Recognition</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete qualifications to earn certificates and unlock achievements.
              </p>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Unlock with Progress
                <Trophy className="h-3 w-3 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Learning Paths Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recommended Learning Paths
          </CardTitle>
          <CardDescription>
            Popular paths chosen by learners like you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">AI Fundamentals</h4>
                  <Badge variant="secondary">Beginner</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Perfect for newcomers to artificial intelligence
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~8 hours
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    1.2k learners
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Machine Learning Track</h4>
                  <Badge variant="secondary">Intermediate</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dive deep into ML algorithms and applications
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~15 hours
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    800 learners
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/learning-paths">
              <Button variant="outline">
                View All Learning Paths
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface NoActiveProgressEmptyStateProps {
  className?: string
}

export function NoActiveProgressEmptyState({ className }: NoActiveProgressEmptyStateProps) {
  return (
    <Card className={`text-center p-8 ${className}`}>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-orange-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Ready to Start Learning?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any active qualifications yet. Start your AI learning journey today and 
              track your progress as you master new skills.
            </p>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/assessments">
              <Button size="lg">
                <Play className="h-4 w-4 mr-2" />
                Take Your First Assessment
              </Button>
            </Link>
            <Link href="/qualifications">
              <Button variant="outline" size="lg">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Qualifications
              </Button>
            </Link>
          </div>
        </div>

        {/* Popular Learning Paths Showcase */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground">POPULAR LEARNING PATHS</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              AI Fundamentals
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Machine Learning
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Neural Networks
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Computer Vision
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              Natural Language Processing
            </Badge>
          </div>
          <div className="text-center">
            <Link href="/learning-paths">
              <Button variant="ghost" size="sm">
                Explore All Paths
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface NoAchievementsEmptyStateProps {
  className?: string
}

export function NoAchievementsEmptyState({ className }: NoAchievementsEmptyStateProps) {
  return (
    <Card className={`text-center p-6 ${className}`}>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-100 rounded-full">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Start Earning Achievements!</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Complete assessments and qualifications to unlock badges, earn points, and 
              showcase your AI expertise.
            </p>
          </div>
        </div>

        {/* Achievement System Explanation */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">AVAILABLE ACHIEVEMENT TYPES</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Star className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">First Steps</div>
                  <div className="text-muted-foreground">Complete your first qualification</div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Award className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">Perfect Score</div>
                  <div className="text-muted-foreground">Achieve 100% on any assessment</div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Target className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">Speed Learner</div>
                  <div className="text-muted-foreground">Complete qualifications quickly</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational CTA */}
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-primary">
            🚀 Your first achievement is just one assessment away!
          </p>
          <Link href="/assessments">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Start Earning Achievements
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}