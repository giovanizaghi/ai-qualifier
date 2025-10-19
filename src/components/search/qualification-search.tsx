'use client';

import { useState } from 'react';
import { ArrowUpDown, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from './search-input';
import { SearchFilters, SearchFilters as SearchFiltersType } from './search-filters';
import { useSearch, getFilterSummary } from './use-search';
import { Qualification } from '@/types';
import { cn } from '@/lib/utils';

interface QualificationSearchProps {
  data: Qualification[];
  onResultSelect?: (qualification: Qualification) => void;
  className?: string;
  showFiltersInline?: boolean;
  initialFilters?: SearchFiltersType;
  initialSearchTerm?: string;
}

interface QualificationCardProps {
  qualification: Qualification;
  onClick?: () => void;
  variant?: 'grid' | 'list';
}

function QualificationCard({ qualification, onClick, variant = 'grid' }: QualificationCardProps) {
  const isListView = variant === 'list';
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
        isListView ? "p-4" : "p-6"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "space-y-3",
        isListView && "flex items-center space-x-4 space-y-0"
      )}>
        <div className={cn("space-y-2", isListView && "flex-1")}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              "font-semibold line-clamp-2",
              isListView ? "text-base" : "text-lg"
            )}>
              {qualification.title}
            </h3>
            <Badge variant="outline" className="shrink-0">
              {qualification.difficulty.toLowerCase()}
            </Badge>
          </div>
          
          <p className={cn(
            "text-muted-foreground line-clamp-2",
            isListView ? "text-sm" : "text-base"
          )}>
            {qualification.shortDescription || qualification.description}
          </p>
        </div>

        <div className={cn(
          "flex items-center justify-between text-sm text-muted-foreground",
          isListView && "shrink-0 flex-col items-end space-y-1"
        )}>
          <div className="flex items-center gap-4">
            <span>{qualification.estimatedDuration} min</span>
            <span>{qualification.totalQuestions} questions</span>
            {qualification.passingScore && (
              <span>{qualification.passingScore}% to pass</span>
            )}
          </div>
          
          {!isListView && qualification.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {qualification.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {qualification.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{qualification.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function QualificationSearch({
  data,
  onResultSelect,
  className,
  showFiltersInline = false,
  initialFilters = {},
  initialSearchTerm = ''
}: QualificationSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<SearchFiltersType>(initialFilters);
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'duration' | 'category' | 'created' | 'popularity'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { filteredData, totalCount, appliedFiltersCount, availableTags } = useSearch({
    searchTerm,
    filters,
    data,
    sortBy,
    sortOrder
  });

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filterSummary = getFilterSummary(filters, searchTerm);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search qualifications by title, description, or tags..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={availableTags}
              showAsDropdown={!showFiltersInline}
            />
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
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

        {/* Sort and Results Summary */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {totalCount} qualification{totalCount !== 1 ? 's' : ''} found
            {appliedFiltersCount > 0 && (
              <span> • {filterSummary}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortOrderToggle}
              className="gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
        </div>
      </div>

      {/* Inline Filters */}
      {showFiltersInline && (
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
        />
      )}

      {/* Results */}
      <div className={cn(
        "gap-4",
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "space-y-2"
      )}>
        {filteredData.map((qualification) => (
          <QualificationCard
            key={qualification.id}
            qualification={qualification}
            variant={viewMode}
            onClick={() => onResultSelect?.(qualification)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No qualifications found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            {appliedFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                }}
                className="mt-4"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}