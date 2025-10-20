"use client"

import { Search, Filter, Grid, List, BookOpen, Clock, Users, Award, Target, TrendingUp, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Qualification, QualificationCategory, DifficultyLevel } from '@/types'

interface QualificationWithProgress extends Qualification {
  _count: {
    assessments: number
    questions: number
    qualificationProgress: number
  }
  userProgress?: {
    id: string
    completionPercentage: number
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    studyTimeMinutes: number
    bestScore?: number
    lastStudiedAt?: Date
  }
}

interface QualificationFilters {
  search: string
  category?: QualificationCategory
  difficulty?: DifficultyLevel
  provider?: string
  status: 'all' | 'not-started' | 'in-progress' | 'completed'
}

export default function QualificationsPage() {
  const router = useRouter()
  const [qualifications, setQualifications] = useState<QualificationWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'popularity' | 'progress'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const [filters, setFilters] = useState<QualificationFilters>({
    search: '',
    status: 'all'
  })

  useEffect(() => {
    fetchQualifications()
  }, [])

  const fetchQualifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/qualifications?limit=50&includeProgress=true')
      if (!response.ok) {
        throw new Error('Failed to fetch qualifications')
      }
      const data = await response.json()
      setQualifications(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedQualifications = qualifications
    .filter(qualification => {
      // Search filter
      if (filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase()
        if (
          !qualification.title.toLowerCase().includes(searchTerm) &&
          !qualification.description.toLowerCase().includes(searchTerm) &&
          !qualification.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        ) {
          return false
        }
      }

      // Category filter
      if (filters.category && qualification.category !== filters.category) {
        return false
      }

      // Difficulty filter
      if (filters.difficulty && qualification.difficulty !== filters.difficulty) {
        return false
      }

      // Status filter
      if (filters.status !== 'all') {
        const userProgress = qualification.userProgress
        switch (filters.status) {
          case 'not-started':
            if (userProgress && userProgress.status !== 'NOT_STARTED') {return false}
            break
          case 'in-progress':
            if (!userProgress || userProgress.status !== 'IN_PROGRESS') {return false}
            break
          case 'completed':
            if (!userProgress || userProgress.status !== 'COMPLETED') {return false}
            break
        }
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'difficulty':
          const difficultyOrder = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3, 'EXPERT': 4 }
          comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0)
          break
        case 'popularity':
          comparison = (b._count.qualificationProgress || 0) - (a._count.qualificationProgress || 0)
          break
        case 'progress':
          const aProgress = a.userProgress?.completionPercentage || 0
          const bProgress = b.userProgress?.completionPercentage || 0
          comparison = bProgress - aProgress
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

  const updateFilter = (key: keyof QualificationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all'
    })
  }

  const hasActiveFilters = Boolean(filters.search || filters.category || filters.difficulty || filters.status !== 'all')

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Award className="w-5 h-5" />
              Error Loading Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchQualifications} className="w-full">
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
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Qualifications
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            Explore and pursue professional qualifications to validate your expertise. 
            Each qualification consists of multiple assessments and learning paths designed 
            to comprehensively evaluate your skills.
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
                    placeholder="Search qualifications, topics, or tags..."
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      <label className="block text-sm font-medium mb-2">Your Progress</label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => updateFilter('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All qualifications</SelectItem>
                          <SelectItem value="not-started">Not started</SelectItem>
                          <SelectItem value="in-progress">In progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Sort by</label>
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="difficulty">Difficulty</SelectItem>
                          <SelectItem value="popularity">Popularity</SelectItem>
                          <SelectItem value="progress">Your Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="block text-sm font-medium mb-2">Order</label>
                      <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} size="sm">
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
              `${filteredAndSortedQualifications.length} qualification${filteredAndSortedQualifications.length !== 1 ? 's' : ''} found`
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
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Qualifications Grid/List */}
        {!loading && (
          <>
            {filteredAndSortedQualifications.length === 0 ? (
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
                {filteredAndSortedQualifications.map((qualification) => (
                  <QualificationCard
                    key={qualification.id}
                    qualification={qualification}
                    variant={viewMode}
                    onNavigate={(qualificationId: string) => router.push(`/qualifications/${qualificationId}`)}
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

function QualificationCard({ 
  qualification, 
  variant = 'grid',
  onNavigate
}: { 
  qualification: QualificationWithProgress
  variant?: 'grid' | 'list'
  onNavigate?: (qualificationId: string) => void
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

  const getCategoryDisplayName = (category: QualificationCategory) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {return `${minutes} min`}
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
  }

  const userProgress = qualification.userProgress
  const hasProgress = userProgress && userProgress.completionPercentage > 0

  if (variant === 'list') {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer" 
        data-testid="qualification-card"
        onClick={() => onNavigate?.(qualification.id)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {qualification.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {qualification.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getDifficultyColor(qualification.difficulty)}>
                      {qualification.difficulty.toLowerCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {getCategoryDisplayName(qualification.category)}
                    </span>
                  </div>
                  
                  {hasProgress && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium">{userProgress.completionPercentage}%</span>
                      </div>
                      <Progress value={userProgress.completionPercentage} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {qualification._count.assessments} assessments
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(qualification.estimatedDuration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {qualification._count.qualificationProgress} enrolled
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {userProgress && (
                    <Badge className={getStatusColor(userProgress.status)}>
                      {userProgress.status === 'IN_PROGRESS' ? 'In Progress' : 
                       userProgress.status === 'COMPLETED' ? 'Completed' : 'Not Started'}
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    className="min-w-[100px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate?.(qualification.id)
                    }}
                  >
                    {hasProgress ? 'Continue' : 'Start'}
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
      data-testid="qualification-card"
      onClick={() => onNavigate?.(qualification.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">
              {qualification.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getDifficultyColor(qualification.difficulty)}>
                {qualification.difficulty.toLowerCase()}
              </Badge>
              {userProgress && (
                <Badge className={getStatusColor(userProgress.status)}>
                  {userProgress.status === 'IN_PROGRESS' ? 'In Progress' : 
                   userProgress.status === 'COMPLETED' ? 'Completed' : 'Not Started'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-3">
          {qualification.description}
        </CardDescription>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          {getCategoryDisplayName(qualification.category)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hasProgress && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium">{userProgress.completionPercentage}%</span>
              </div>
              <Progress value={userProgress.completionPercentage} className="h-2" />
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {qualification._count.assessments} assessments
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(qualification.estimatedDuration)}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {qualification._count.qualificationProgress} enrolled
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {qualification.passingScore}% to pass
            </div>
          </div>
          <Button 
            className="w-full" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate?.(qualification.id)
            }}
          >
            {hasProgress ? 'Continue' : 'Start Qualification'}
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
        <Award className="h-12 w-12 text-gray-400 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {hasActiveFilters ? 'No qualifications found' : 'Welcome to Qualifications'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {hasActiveFilters 
              ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
              : 'Start your learning journey by exploring our comprehensive qualification programs. Each qualification is designed to help you master specific skills and validate your expertise.'
            }
          </p>
        </div>
        {hasActiveFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Popular categories to get started:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="cursor-pointer">Artificial Intelligence</Badge>
              <Badge variant="outline" className="cursor-pointer">Web Development</Badge>
              <Badge variant="outline" className="cursor-pointer">Data Science</Badge>
              <Badge variant="outline" className="cursor-pointer">Cloud Computing</Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}