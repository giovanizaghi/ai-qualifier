"use client"

import { Search, Filter, Grid, List, BookOpen, Clock, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Assessment, DifficultyLevel, QualificationCategory } from '@/types'

interface AssessmentWithQualification extends Assessment {
  qualification: {
    id: string
    title: string
    slug: string
    category: QualificationCategory
    difficulty: DifficultyLevel
  }
  _count: {
    results: number
  }
}

interface AssessmentFilters {
  search: string
  category?: QualificationCategory
  difficulty?: DifficultyLevel
  timeLimit?: 'short' | 'medium' | 'long' // <30min, 30-60min, >60min
  status: 'all' | 'available' | 'taken'
}

export default function AssessmentsPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentWithQualification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<AssessmentFilters>({
    search: '',
    status: 'all'
  })

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assessments')
      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }
      const data = await response.json()
      setAssessments(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredAssessments = assessments.filter(assessment => {
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      if (
        !assessment.title.toLowerCase().includes(searchTerm) &&
        !assessment.description?.toLowerCase().includes(searchTerm) &&
        !assessment.qualification.title.toLowerCase().includes(searchTerm)
      ) {
        return false
      }
    }

    // Category filter
    if (filters.category && assessment.qualification.category !== filters.category) {
      return false
    }

    // Difficulty filter
    if (filters.difficulty && assessment.qualification.difficulty !== filters.difficulty) {
      return false
    }

    // Time limit filter
    if (filters.timeLimit) {
      const timeLimit = assessment.timeLimit || 0
      switch (filters.timeLimit) {
        case 'short':
          if (timeLimit === 0 || timeLimit > 30) return false
          break
        case 'medium':
          if (timeLimit <= 30 || timeLimit > 60) return false
          break
        case 'long':
          if (timeLimit <= 60) return false
          break
      }
    }

    return true
  })

  const updateFilter = (key: keyof AssessmentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all'
    })
  }

  const hasActiveFilters = Boolean(filters.search || filters.category || filters.difficulty || filters.timeLimit)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <BookOpen className="w-5 h-5" />
              Error Loading Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchAssessments} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Assessments
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            Test your knowledge and skills across various AI and technology domains. 
            Choose from our curated collection of assessments to validate your expertise.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search assessments, qualifications, or topics..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <Select
                        value={filters.category || ''}
                        onValueChange={(value) => 
                          updateFilter('category', value || undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All categories</SelectItem>
                          <SelectItem value="ARTIFICIAL_INTELLIGENCE">Artificial Intelligence</SelectItem>
                          <SelectItem value="MACHINE_LEARNING">Machine Learning</SelectItem>
                          <SelectItem value="DATA_SCIENCE">Data Science</SelectItem>
                          <SelectItem value="SOFTWARE_ENGINEERING">Software Engineering</SelectItem>
                          <SelectItem value="CLOUD_COMPUTING">Cloud Computing</SelectItem>
                          <SelectItem value="CYBERSECURITY">Cybersecurity</SelectItem>
                          <SelectItem value="WEB_DEVELOPMENT">Web Development</SelectItem>
                          <SelectItem value="MOBILE_DEVELOPMENT">Mobile Development</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Difficulty</label>
                      <Select
                        value={filters.difficulty || ''}
                        onValueChange={(value) => 
                          updateFilter('difficulty', value || undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All levels</SelectItem>
                          <SelectItem value="BEGINNER">Beginner</SelectItem>
                          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                          <SelectItem value="ADVANCED">Advanced</SelectItem>
                          <SelectItem value="EXPERT">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Duration</label>
                      <Select
                        value={filters.timeLimit || ''}
                        onValueChange={(value) => 
                          updateFilter('timeLimit', value || undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any duration</SelectItem>
                          <SelectItem value="short">Short (≤30 min)</SelectItem>
                          <SelectItem value="medium">Medium (30-60 min)</SelectItem>
                          <SelectItem value="long">Long (&gt;60 min)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              `${filteredAssessments.length} assessment${filteredAssessments.length !== 1 ? 's' : ''} found`
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assessments Grid/List */}
        {!loading && (
          <>
            {filteredAssessments.length === 0 ? (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {filteredAssessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    variant={viewMode}
                    onNavigate={(assessmentId: string) => router.push(`/assessments/${assessmentId}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AssessmentCard({ 
  assessment, 
  variant = 'grid',
  onNavigate
}: { 
  assessment: AssessmentWithQualification
  variant?: 'grid' | 'list'
  onNavigate?: (assessmentId: string) => void
}) {
  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'ADVANCED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'EXPERT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'No time limit'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  if (variant === 'list') {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer" 
        data-testid="assessment-card"
        onClick={() => onNavigate?.(assessment.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {assessment.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {assessment.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                    {assessment.qualification.title}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {assessment.questionCount} questions
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(assessment.timeLimit)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {assessment._count.results} taken
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getDifficultyColor(assessment.qualification.difficulty)}>
                    {assessment.qualification.difficulty.toLowerCase()}
                  </Badge>
                  <Button 
                    size="sm" 
                    className="min-w-[100px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate?.(assessment.id)
                    }}
                  >
                    Start Assessment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      data-testid="assessment-card"
      onClick={() => onNavigate?.(assessment.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">
              {assessment.title}
            </CardTitle>
            <Badge className={getDifficultyColor(assessment.qualification.difficulty)}>
              {assessment.qualification.difficulty.toLowerCase()}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-3">
          {assessment.description}
        </CardDescription>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          {assessment.qualification.title}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {assessment.questionCount} questions
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(assessment.timeLimit)}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {assessment._count.results} taken
            </div>
          </div>
          <Button 
            className="w-full" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate?.(assessment.id)
            }}
          >
            Start Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ 
  hasActiveFilters, 
  onClearFilters 
}: { 
  hasActiveFilters: boolean
  onClearFilters: () => void 
}) {
  return (
    <Card className="p-8 text-center">
      <div className="space-y-4">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {hasActiveFilters ? 'No assessments found' : 'No assessments available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {hasActiveFilters 
              ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
              : 'New assessments are being added regularly. Check back soon for new challenges!'
            }
          </p>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        )}
      </div>
    </Card>
  )
}