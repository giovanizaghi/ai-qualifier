'use client';

import { useState } from 'react';
import { FeedbackData } from './feedback-form';

interface UseFeedbackOptions {
  onSuccess?: (feedback: FeedbackData) => void;
  onError?: (error: Error) => void;
}

interface UseFeedbackReturn {
  submitFeedback: (feedback: FeedbackData) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  isSuccess: boolean;
}

export function useFeedback({ onSuccess, onError }: UseFeedbackOptions = {}): UseFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitFeedback = async (feedback: FeedbackData): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      const result = await response.json();
      setIsSuccess(true);
      onSuccess?.(feedback);
      
      // Auto-reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitFeedback,
    isSubmitting,
    error,
    isSuccess
  };
}

// Hook for content rating/feedback
interface UseContentFeedbackOptions {
  contentId: string;
  contentType: 'qualification' | 'question' | 'assessment';
}

export function useContentFeedback({ contentId, contentType }: UseContentFeedbackOptions) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = async (rating: number): Promise<void> => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/content/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          contentType,
          rating
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      setRatings(prev => ({ ...prev, [contentId]: rating }));
    } catch (error) {
      console.error('Failed to submit rating:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReport = async (reason: string): Promise<void> => {
    const response = await fetch('/api/content/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        contentType,
        reason
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit report');
    }
  };

  const submitComment = async (comment: string): Promise<void> => {
    const response = await fetch('/api/content/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        contentType,
        comment
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit comment');
    }
  };

  return {
    rating: ratings[contentId] || 0,
    submitRating,
    submitReport,
    submitComment,
    isSubmitting
  };
}