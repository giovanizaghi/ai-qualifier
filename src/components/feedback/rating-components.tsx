'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QuickRatingProps {
  onRate: (rating: number) => Promise<void>;
  initialRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

export function QuickRating({
  onRate,
  initialRating = 0,
  size = 'md',
  showLabel = true,
  disabled = false,
  className
}: QuickRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleRate = async (newRating: number) => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRate(newRating);
      setRating(newRating);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && <Label className="text-sm">Rate this:</Label>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled || isSubmitting}
            className={cn(
              "transition-all duration-150",
              disabled || isSubmitting 
                ? "cursor-not-allowed opacity-50" 
                : "cursor-pointer hover:scale-110"
            )}
            onClick={() => handleRate(star)}
            onMouseEnter={() => !disabled && !isSubmitting && setHover(star)}
            onMouseLeave={() => !disabled && !isSubmitting && setHover(0)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                (hover >= star || rating >= star)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300",
                isSubmitting && "animate-pulse"
              )}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          ({rating}/5)
        </span>
      )}
    </div>
  );
}

interface ThumbsRatingProps {
  onRate: (isPositive: boolean) => Promise<void>;
  initialRating?: boolean | null;
  showCounts?: boolean;
  upCount?: number;
  downCount?: number;
  disabled?: boolean;
  className?: string;
}

export function ThumbsRating({
  onRate,
  initialRating = null,
  showCounts = false,
  upCount = 0,
  downCount = 0,
  disabled = false,
  className
}: ThumbsRatingProps) {
  const [rating, setRating] = useState<boolean | null>(initialRating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (isPositive: boolean) => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onRate(isPositive);
      setRating(rating === isPositive ? null : isPositive); // Toggle if same, set if different
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRate(true)}
        disabled={disabled || isSubmitting}
        className={cn(
          "gap-1",
          rating === true && "bg-green-50 border-green-300 text-green-700"
        )}
      >
        <ThumbsUp className={cn(
          "h-4 w-4",
          rating === true && "fill-current"
        )} />
        {showCounts && <span>{upCount}</span>}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRate(false)}
        disabled={disabled || isSubmitting}
        className={cn(
          "gap-1",
          rating === false && "bg-red-50 border-red-300 text-red-700"
        )}
      >
        <ThumbsDown className={cn(
          "h-4 w-4",
          rating === false && "fill-current"
        )} />
        {showCounts && <span>{downCount}</span>}
      </Button>
    </div>
  );
}

interface ContentFeedbackProps {
  contentId: string;
  contentType: 'qualification' | 'question' | 'assessment';
  onRate: (contentId: string, rating: number) => Promise<void>;
  onReport: (contentId: string, reason: string) => Promise<void>;
  onComment: (contentId: string, comment: string) => Promise<void>;
  className?: string;
}

export function ContentFeedback({
  contentId,
  contentType,
  onRate,
  onReport,
  onComment,
  className
}: ContentFeedbackProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [comment, setComment] = useState('');

  const handleReport = async () => {
    if (reportReason.trim()) {
      try {
        await onReport(contentId, reportReason);
        setShowReportDialog(false);
        setReportReason('');
      } catch (error) {
        console.error('Failed to submit report:', error);
      }
    }
  };

  const handleComment = async () => {
    if (comment.trim()) {
      try {
        await onComment(contentId, comment);
        setShowCommentDialog(false);
        setComment('');
      } catch (error) {
        console.error('Failed to submit comment:', error);
      }
    }
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="space-y-3">
        <h4 className="font-medium">How was this {contentType}?</h4>
        
        <QuickRating
          onRate={(rating) => onRate(contentId, rating)}
          showLabel={false}
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentDialog(true)}
            className="gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            Comment
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="gap-1 text-red-600 hover:text-red-700"
          >
            <Flag className="h-4 w-4" />
            Report
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="space-y-3 border-t pt-3">
          <Label htmlFor="report-reason">Report this {contentType}</Label>
          <textarea
            id="report-reason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Please describe the issue..."
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md resize-y"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleReport} size="sm" disabled={!reportReason.trim()}>
              Submit Report
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowReportDialog(false);
                setReportReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comment Dialog */}
      {showCommentDialog && (
        <div className="space-y-3 border-t pt-3">
          <Label htmlFor="comment">Add a comment</Label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md resize-y"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleComment} size="sm" disabled={!comment.trim()}>
              Submit Comment
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowCommentDialog(false);
                setComment('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}