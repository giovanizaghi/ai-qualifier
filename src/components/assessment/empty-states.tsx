"use client"

import { BookOpen, Mail, ExternalLink, ArrowRight, Clock, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface NoAvailableAssessmentsEmptyStateProps {
  className?: string
}

/**
 * Empty state shown when no assessments exist in the system
 * Phase 2.2 - Assessment System Empty States
 */
export function NoAvailableAssessmentsEmptyState({ 
  className 
}: NoAvailableAssessmentsEmptyStateProps) {
  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <Card className="text-center p-8">
        <CardContent className="space-y-6 pt-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-6">
              <BookOpen className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              New Assessments Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We're currently building our assessment library. Be the first to know when new assessments 
              become available and start your journey to AI qualification.
            </p>
          </div>

          {/* Subscribe Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
              <Mail className="h-5 w-5" />
              Get Notified
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Subscribe to receive updates when new assessments are published
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
              />
              <Button>
                Subscribe
              </Button>
            </div>
          </div>

          {/* Alternative Resources */}
          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              In the meantime, explore these resources:
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Qualifications Card */}
              <Link href="/qualifications">
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      Browse Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Explore available qualification paths and see what skills you can develop
                    </CardDescription>
                    <div className="mt-3 flex items-center text-sm text-blue-600 dark:text-blue-400">
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Learning Paths Card */}
              <Link href="/learning-paths">
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Learning Paths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      Discover structured learning paths to guide your AI education journey
                    </CardDescription>
                    <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
                      Explore paths <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* External Resources */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recommended External Resources
            </h4>
            <div className="flex flex-wrap gap-3 justify-center">
              <a 
                href="https://www.coursera.org/browse/data-science/machine-learning" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Coursera ML Courses
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <a 
                href="https://www.kaggle.com/learn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Kaggle Learn
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <a 
                href="https://www.fast.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Fast.ai
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface NoAssessmentHistoryEmptyStateProps {
  className?: string
}

/**
 * Empty state shown when user hasn't taken any assessments yet
 * Phase 2.2 - Assessment System Empty States
 */
export function NoAssessmentHistoryEmptyState({ 
  className 
}: NoAssessmentHistoryEmptyStateProps) {
  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <Card className="text-center p-8">
        <CardContent className="space-y-6 pt-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-6">
              <Clock className="h-16 w-16 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              No Assessment History Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              You haven't taken any assessments yet. Start your learning journey today and 
              track your progress over time.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center">
              Why take assessments?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Validate Your Knowledge
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Test your understanding and identify areas for improvement
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Earn Certifications
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Get recognized certificates to showcase your expertise
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Track Your Progress
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor your learning journey and celebrate achievements
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Build Your Portfolio
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Add verified credentials to your professional profile
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/assessments">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <BookOpen className="h-4 w-4" />
                Browse Assessments
              </Button>
            </Link>
            <Link href="/qualifications">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Award className="h-4 w-4" />
                View Qualifications
              </Button>
            </Link>
          </div>

          {/* Quick Tips */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              💡 Quick Tip
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start with beginner-level assessments to build confidence, then progress to more 
              advanced topics. Your history will show your improvement over time!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AssessmentFilterEmptyStateProps {
  className?: string
  onClearFilters: () => void
}

/**
 * Empty state shown when search/filters return no results
 * Phase 2.2 - Assessment System Empty States
 */
export function AssessmentFilterEmptyState({ 
  className,
  onClearFilters 
}: AssessmentFilterEmptyStateProps) {
  return (
    <Card className={cn("p-8 text-center", className)}>
      <div className="space-y-4">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No assessments found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find any assessments matching your current search criteria. 
            Try adjusting your filters or search terms.
          </p>
        </div>
        
        <div className="space-y-3 pt-2">
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            or
          </div>
          
          <Link href="/qualifications">
            <Button variant="ghost" className="gap-2">
              Browse by Qualifications
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
