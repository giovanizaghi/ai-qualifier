"use client"

import { Grid, List, BookOpen, Target, TrendingUp, Compass } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'

import { LearningPathCard, PathFilters } from '@/components/learning-paths'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { 
  getMockLearningPathsWithProgress, 
  filterMockLearningPaths 
} from '@/lib/mock-learning-paths'
import { cn } from '@/lib/utils'
import { 
  LearningPathWithProgress, 
  LearningPathFilters, 
  LearningPathCategory,
  DifficultyLevel
} from '@/types/learning-paths'

export default function LearningPathsPage() {
  const router = useRouter()
  const [learningPaths, setLearningPaths] = useState<LearningPathWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'popularity' | 'duration' | 'rating'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const [filters, setFilters] = useState<LearningPathFilters>({
    search: '',
    status: 'all'
  })

  // Simulate API call
  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // In a real app, this would be an API call
        const paths = getMockLearningPathsWithProgress('user-1') // Mock user ID
        setLearningPaths(paths)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLearningPaths()
  }, [])

  // Filter and sort learning paths
  const filteredAndSortedPaths = useMemo(() => {
    let filtered = filterMockLearningPaths(learningPaths, filters)
    
    // Sort the filtered results
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'difficulty':
          const difficultyOrder = { 
            [DifficultyLevel.BEGINNER]: 1, 
            [DifficultyLevel.INTERMEDIATE]: 2, 
            [DifficultyLevel.ADVANCED]: 3, 
            [DifficultyLevel.EXPERT]: 4 
          }
          comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0)
          break
        case 'popularity':
          comparison = (b._count.enrollments || 0) - (a._count.enrollments || 0)
          break
        case 'duration':
          comparison = a.estimatedDuration - b.estimatedDuration
          break
        case 'rating':
          comparison = (b.averageRating || 0) - (a.averageRating || 0)
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
    
    return filtered
  }, [learningPaths, filters, sortBy, sortOrder])

  const hasActiveFilters = Boolean(
    filters.search || 
    filters.category || 
    filters.difficulty || 
    filters.duration || 
    filters.status !== 'all' ||
    (filters.tags && filters.tags.length > 0)
  )

  const handleNavigate = (pathId: string) => {
    router.push(`/learning-paths/${pathId}`)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <BookOpen className="w-5 h-5" />
              Error Loading Learning Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
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
          <div className="flex items-center gap-3 mb-4">
            <Compass className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Learning Paths
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            Discover structured learning journeys designed to take you from beginner to expert. 
            Each path combines theory, practice, and real-world projects to build comprehensive skills.
          </p>
        </div>

        {/* Quick Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{learningPaths.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Learning Paths</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {learningPaths.filter(p => p.userProgress?.status === 'IN_PROGRESS').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {learningPaths.filter(p => p.userProgress?.status === 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <PathFilters
                filters={filters}
                onFiltersChange={setFilters}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
              />
              
              {/* Sort and View Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-sm border rounded-md px-2 py-1 bg-background"
                    >
                      <option value="title">Title</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="popularity">Popularity</option>
                      <option value="duration">Duration</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Order:</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="text-sm border rounded-md px-2 py-1 bg-background"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                
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
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              `${filteredAndSortedPaths.length} learning path${filteredAndSortedPaths.length !== 1 ? 's' : ''} found`
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spinner className="h-8 w-8 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading learning paths...</p>
            </div>
          </div>
        )}

        {/* Learning Paths Grid/List */}
        {!loading && (
          <>
            {filteredAndSortedPaths.length === 0 ? (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => setFilters({ search: '', status: 'all' })}
                onStartBrowsing={() => {
                  setFilters({ search: '', status: 'all' })
                  setShowFilters(false)
                }}
                onSetFilters={setFilters}
              />
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              )}>
                {filteredAndSortedPaths.map((path) => (
                  <LearningPathCard
                    key={path.id}
                    learningPath={path}
                    variant={viewMode}
                    onNavigate={handleNavigate}
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

function EmptyState({ 
  hasActiveFilters, 
  onClearFilters,
  onStartBrowsing,
  onSetFilters
}: { 
  hasActiveFilters: boolean
  onClearFilters: () => void
  onStartBrowsing: () => void
  onSetFilters: (filters: LearningPathFilters) => void
}) {
  return (
    <Card className="p-8 text-center">
      <div className="space-y-4">
        <Compass className="h-12 w-12 text-gray-400 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {hasActiveFilters ? 'No learning paths found' : 'Start Your Learning Journey'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {hasActiveFilters 
              ? 'Try adjusting your search terms or filters to find the perfect learning path for you.'
              : 'Explore our curated learning paths designed to take you from beginner to expert. Each path combines structured lessons, hands-on projects, and practical exercises.'
            }
          </p>
        </div>
        
        {hasActiveFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        ) : (
          <div className="space-y-4">
            <Button onClick={onStartBrowsing}>
              Browse All Learning Paths
            </Button>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Popular categories to get started:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => {
                    onSetFilters({ search: '', status: 'all', category: LearningPathCategory.MACHINE_LEARNING })
                    onStartBrowsing()
                  }}
                >
                  Machine Learning
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => {
                    onSetFilters({ search: '', status: 'all', category: LearningPathCategory.WEB_DEVELOPMENT })
                    onStartBrowsing()
                  }}
                >
                  Web Development
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => {
                    onSetFilters({ search: '', status: 'all', category: LearningPathCategory.DATA_SCIENCE })
                    onStartBrowsing()
                  }}
                >
                  Data Science
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => {
                    onSetFilters({ search: '', status: 'all', category: LearningPathCategory.CLOUD_COMPUTING })
                    onStartBrowsing()
                  }}
                >
                  Cloud Computing
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}