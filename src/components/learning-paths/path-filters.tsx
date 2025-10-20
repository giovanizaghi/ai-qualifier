"use client"

import { Search, Filter, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { LearningPathFilters, LearningPathCategory, DifficultyLevel } from '@/types/learning-paths'

interface PathFiltersProps {
  filters: LearningPathFilters
  onFiltersChange: (filters: LearningPathFilters) => void
  showFilters: boolean
  onToggleFilters: () => void
  className?: string
}

export function PathFilters({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  className
}: PathFiltersProps) {
  const updateFilter = <K extends keyof LearningPathFilters>(
    key: K,
    value: LearningPathFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all'
    })
  }

  const getCategoryDisplayName = (category: LearningPathCategory) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const hasActiveFilters = Boolean(
    filters.search || 
    filters.category || 
    filters.difficulty || 
    filters.duration || 
    filters.status !== 'all' ||
    (filters.tags && filters.tags.length > 0)
  )

  const removeTag = (tagToRemove: string) => {
    const updatedTags = filters.tags?.filter(tag => tag !== tagToRemove) || []
    updateFilter('tags', updatedTags.length > 0 ? updatedTags : undefined)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar and Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search learning paths, topics, or skills..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          onClick={onToggleFilters}
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
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {getCategoryDisplayName(filters.category)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('category', undefined)}
              />
            </Badge>
          )}
          
          {filters.difficulty && (
            <Badge variant="secondary" className="gap-1">
              {filters.difficulty.toLowerCase()}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('difficulty', undefined)}
              />
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.status === 'not-started' ? 'Not Started' : 
               filters.status === 'in-progress' ? 'In Progress' : 'Completed'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('status', 'all')}
              />
            </Badge>
          )}
          
          {filters.duration && (
            <Badge variant="secondary" className="gap-1">
              {filters.duration.min && filters.duration.max
                ? `${filters.duration.min}-${filters.duration.max}h`
                : filters.duration.min
                ? `${filters.duration.min}h+`
                : `<${filters.duration.max}h`}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('duration', undefined)}
              />
            </Badge>
          )}
          
          {filters.tags && filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) => 
                  updateFilter('category', value ? value as LearningPathCategory : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value={LearningPathCategory.ARTIFICIAL_INTELLIGENCE}>
                    Artificial Intelligence
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.MACHINE_LEARNING}>
                    Machine Learning
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.DATA_SCIENCE}>
                    Data Science
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.SOFTWARE_ENGINEERING}>
                    Software Engineering
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.CLOUD_COMPUTING}>
                    Cloud Computing
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.CYBERSECURITY}>
                    Cybersecurity
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.WEB_DEVELOPMENT}>
                    Web Development
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.MOBILE_DEVELOPMENT}>
                    Mobile Development
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.DEVOPS}>
                    DevOps
                  </SelectItem>
                  <SelectItem value={LearningPathCategory.UX_UI_DESIGN}>
                    UX/UI Design
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <Select
                value={filters.difficulty || ''}
                onValueChange={(value) => 
                  updateFilter('difficulty', value ? value as DifficultyLevel : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value={DifficultyLevel.BEGINNER}>Beginner</SelectItem>
                  <SelectItem value={DifficultyLevel.INTERMEDIATE}>Intermediate</SelectItem>
                  <SelectItem value={DifficultyLevel.ADVANCED}>Advanced</SelectItem>
                  <SelectItem value={DifficultyLevel.EXPERT}>Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <Select
                value={
                  filters.duration?.min === 0 && filters.duration?.max === 120 ? '0-2h' :
                  filters.duration?.min === 120 && filters.duration?.max === 480 ? '2-8h' :
                  filters.duration?.min === 480 && filters.duration?.max === 1200 ? '8-20h' :
                  filters.duration?.min === 1200 ? '20h+' : ''
                }
                onValueChange={(value) => {
                  switch (value) {
                    case '0-2h':
                      updateFilter('duration', { min: 0, max: 120 })
                      break
                    case '2-8h':
                      updateFilter('duration', { min: 120, max: 480 })
                      break
                    case '8-20h':
                      updateFilter('duration', { min: 480, max: 1200 })
                      break
                    case '20h+':
                      updateFilter('duration', { min: 1200 })
                      break
                    default:
                      updateFilter('duration', undefined)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any duration</SelectItem>
                  <SelectItem value="0-2h">Under 2 hours</SelectItem>
                  <SelectItem value="2-8h">2-8 hours</SelectItem>
                  <SelectItem value="8-20h">8-20 hours</SelectItem>
                  <SelectItem value="20h+">20+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Progress</label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilter('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All paths</SelectItem>
                  <SelectItem value="not-started">Not started</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium mb-2">Popular Tags</label>
            <div className="flex flex-wrap gap-2">
              {[
                'Beginner Friendly',
                'Hands-on',
                'Theory',
                'Project-Based',
                'Interactive',
                'Certification Prep',
                'Career Change',
                'Skill Building'
              ].map((tag) => {
                const isSelected = filters.tags?.includes(tag)
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                    onClick={() => {
                      const currentTags = filters.tags || []
                      const updatedTags = isSelected
                        ? currentTags.filter(t => t !== tag)
                        : [...currentTags, tag]
                      updateFilter('tags', updatedTags.length > 0 ? updatedTags : undefined)
                    }}
                  >
                    {tag}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}