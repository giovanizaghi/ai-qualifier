'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  qualificationId: string;
  isBookmarked?: boolean;
  onToggle?: (qualificationId: string, isBookmarked: boolean) => Promise<void>;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
  disabled?: boolean;
}

export function BookmarkButton({
  qualificationId,
  isBookmarked = false,
  onToggle,
  className,
  size = 'default',
  variant = 'ghost',
  showLabel = false,
  disabled = false
}: BookmarkButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleToggle = async () => {
    if (!onToggle || isLoading || disabled) {return;}

    setIsLoading(true);
    try {
      await onToggle(qualificationId, !bookmarked);
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // Optionally show toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = bookmarked ? BookmarkCheck : Bookmark;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading || disabled}
      className={cn(
        "transition-colors",
        bookmarked && "text-blue-600 hover:text-blue-700",
        className
      )}
    >
      <Icon className={cn(
        "h-4 w-4",
        isLoading && "animate-pulse",
        bookmarked && "fill-current"
      )} />
      {showLabel && (
        <span className="ml-2">
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
      <span className="sr-only">
        {bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      </span>
    </Button>
  );
}