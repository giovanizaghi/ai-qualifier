'use client';

import { useState, useEffect } from 'react';
import { BookmarkCheck, Calendar, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookmarkButton } from './bookmark-button';
import { Qualification } from '@/types';
import { cn } from '@/lib/utils';

interface BookmarkWithQualification {
  id: string;
  qualificationId: string;
  createdAt: Date;
  qualification: Qualification;
}

interface BookmarkListProps {
  bookmarks: BookmarkWithQualification[];
  onRemoveBookmark?: (qualificationId: string) => Promise<void>;
  onQualificationSelect?: (qualification: Qualification) => void;
  className?: string;
  emptyStateMessage?: string;
  showRemoveButton?: boolean;
}

interface BookmarkCardProps {
  bookmark: BookmarkWithQualification;
  onRemove?: (qualificationId: string) => Promise<void>;
  onSelect?: (qualification: Qualification) => void;
  showRemoveButton?: boolean;
}

function BookmarkCard({ bookmark, onRemove, onSelect, showRemoveButton = true }: BookmarkCardProps) {
  const { qualification, createdAt } = bookmark;
  
  const handleToggleBookmark = async (qualificationId: string, isBookmarked: boolean) => {
    if (!isBookmarked && onRemove) {
      await onRemove(qualificationId);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onSelect?.(qualification)}
              >
                {qualification.title}
              </h3>
              <Badge variant="outline">
                {qualification.difficulty.toLowerCase()}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {qualification.shortDescription || qualification.description}
            </p>
          </div>

          {showRemoveButton && (
            <BookmarkButton
              qualificationId={qualification.id}
              isBookmarked={true}
              onToggle={handleToggleBookmark}
              size="sm"
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{qualification.estimatedDuration} min</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{qualification.totalQuestions} questions</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Saved {formatDate(createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect?.(qualification)}
          >
            Start Assessment
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function BookmarkList({
  bookmarks,
  onRemoveBookmark,
  onQualificationSelect,
  className,
  emptyStateMessage = "No bookmarks yet. Start exploring qualifications to save your favorites!",
  showRemoveButton = true
}: BookmarkListProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'difficulty'>('newest');
  
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.qualification.title.localeCompare(b.qualification.title);
      case 'difficulty':
        const difficultyOrder = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
        return difficultyOrder[a.qualification.difficulty] - difficultyOrder[b.qualification.difficulty];
      default:
        return 0;
    }
  });

  if (bookmarks.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <BookmarkCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No bookmarks yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {emptyStateMessage}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          My Bookmarks ({bookmarks.length})
        </h2>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextSort = {
                newest: 'oldest',
                oldest: 'title',
                title: 'difficulty',
                difficulty: 'newest'
              };
              setSortBy(nextSort[sortBy] as any);
            }}
          >
            {sortBy === 'newest' && 'Newest'}
            {sortBy === 'oldest' && 'Oldest'}
            {sortBy === 'title' && 'Title A-Z'}
            {sortBy === 'difficulty' && 'Difficulty'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onRemove={onRemoveBookmark}
            onSelect={onQualificationSelect}
            showRemoveButton={showRemoveButton}
          />
        ))}
      </div>
    </div>
  );
}