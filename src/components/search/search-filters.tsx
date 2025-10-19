'use client';

import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QualificationCategory, DifficultyLevel } from '@/types';
import { cn } from '@/lib/utils';

export interface SearchFilters {
  category?: QualificationCategory;
  difficulty?: DifficultyLevel;
  duration?: 'short' | 'medium' | 'long'; // <30min, 30-60min, >60min
  tags?: string[];
  minScore?: number;
  allowRetakes?: boolean;
  isPublished?: boolean;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags?: string[];
  className?: string;
  showAsDropdown?: boolean;
}

const categoryLabels: Record<QualificationCategory, string> = {
  [QualificationCategory.ARTIFICIAL_INTELLIGENCE]: 'Artificial Intelligence',
  [QualificationCategory.MACHINE_LEARNING]: 'Machine Learning',
  [QualificationCategory.DATA_SCIENCE]: 'Data Science',
  [QualificationCategory.SOFTWARE_ENGINEERING]: 'Software Engineering',
  [QualificationCategory.CLOUD_COMPUTING]: 'Cloud Computing',
  [QualificationCategory.CYBERSECURITY]: 'Cybersecurity',
  [QualificationCategory.BLOCKCHAIN]: 'Blockchain',
  [QualificationCategory.MOBILE_DEVELOPMENT]: 'Mobile Development',
  [QualificationCategory.WEB_DEVELOPMENT]: 'Web Development',
  [QualificationCategory.DEVOPS]: 'DevOps',
  [QualificationCategory.PRODUCT_MANAGEMENT]: 'Product Management',
  [QualificationCategory.UX_UI_DESIGN]: 'UX/UI Design',
  [QualificationCategory.BUSINESS_ANALYSIS]: 'Business Analysis',
  [QualificationCategory.PROJECT_MANAGEMENT]: 'Project Management',
  [QualificationCategory.DIGITAL_MARKETING]: 'Digital Marketing',
  [QualificationCategory.OTHER]: 'Other'
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  [DifficultyLevel.BEGINNER]: 'Beginner',
  [DifficultyLevel.INTERMEDIATE]: 'Intermediate',
  [DifficultyLevel.ADVANCED]: 'Advanced',
  [DifficultyLevel.EXPERT]: 'Expert'
};

const durationLabels = {
  short: 'Quick (< 30 min)',
  medium: 'Standard (30-60 min)',
  long: 'Extended (> 60 min)'
};

export function SearchFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  className,
  showAsDropdown = false
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    handleFilterChange('tags', newTags.length > 0 ? newTags : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && 
      value !== null && 
      !(Array.isArray(value) && value.length === 0)
    ).length;
  };

  const activeCount = getActiveFilterCount();

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {activeCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear ({activeCount})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={filters.category || ''}
            onValueChange={(value) => 
              handleFilterChange('category', value || undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={filters.difficulty || ''}
            onValueChange={(value) => 
              handleFilterChange('difficulty', value || undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All levels</SelectItem>
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration Filter */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Select
            value={filters.duration || ''}
            onValueChange={(value) => 
              handleFilterChange('duration', value || undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any duration</SelectItem>
              {Object.entries(durationLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Retakes Filter */}
        <div className="space-y-2">
          <Label htmlFor="retakes">Retakes</Label>
          <Select
            value={filters.allowRetakes === undefined ? '' : filters.allowRetakes.toString()}
            onValueChange={(value) => 
              handleFilterChange('allowRetakes', value === '' ? undefined : value === 'true')
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="true">Retakes allowed</SelectItem>
              <SelectItem value="false">Single attempt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = filters.tags?.includes(tag) || false;
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (showAsDropdown) {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0">
              {activeCount}
            </Badge>
          )}
        </Button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <Card className="absolute right-0 top-full z-50 mt-2 w-96 p-4">
              <FilterContent />
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <FilterContent />
    </Card>
  );
}