'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, Bug, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  sessionId: string;
  scenarioId: string;
  taskId: string;
  onFeedbackSubmitted?: () => void;
}

interface FeedbackData {
  feedbackType: 'rating' | 'comment' | 'bug_report' | 'suggestion';
  rating?: number;
  comment?: string;
  metadata?: Record<string, any>;
}

export default function FeedbackCollectionForm({ 
  sessionId, 
  scenarioId, 
  taskId, 
  onFeedbackSubmitted 
}: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { 
      value: 'rating', 
      label: 'Rating & Review', 
      icon: Star, 
      description: 'Rate your experience with this task',
      color: 'bg-yellow-500'
    },
    { 
      value: 'comment', 
      label: 'General Comment', 
      icon: MessageSquare, 
      description: 'Share general thoughts or observations',
      color: 'bg-blue-500'
    },
    { 
      value: 'bug_report', 
      label: 'Bug Report', 
      icon: Bug, 
      description: 'Report issues or errors encountered',
      color: 'bg-red-500'
    },
    { 
      value: 'suggestion', 
      label: 'Improvement Suggestion', 
      icon: Lightbulb, 
      description: 'Suggest enhancements or new features',
      color: 'bg-green-500'
    }
  ];

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const submitFeedback = async () => {
    if (!feedbackType) {
      toast.error('Please select a feedback type');
      return;
    }

    if (feedbackType === 'rating' && rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if ((feedbackType === 'comment' || feedbackType === 'bug_report' || feedbackType === 'suggestion') && !comment.trim()) {
      toast.error('Please provide a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        feedbackType: feedbackType as FeedbackData['feedbackType'],
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          screenResolution: `${screen.width}x${screen.height}`,
        }
      };

      if (feedbackType === 'rating') {
        feedbackData.rating = rating;
        if (comment.trim()) {
          feedbackData.comment = comment.trim();
        }
      } else {
        feedbackData.comment = comment.trim();
      }

      const response = await fetch('/api/uat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          scenarioId,
          taskId,
          ...feedbackData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Feedback submitted successfully');
        
        // Reset form
        setFeedbackType('');
        setRating(0);
        setComment('');
        
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFeedbackType = feedbackTypes.find(type => type.value === feedbackType);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Provide Feedback
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your experience with this task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feedback Type Selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            What type of feedback would you like to provide?
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedbackTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.value}
                  variant={feedbackType === type.value ? "default" : "outline"}
                  onClick={() => setFeedbackType(type.value)}
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`p-2 rounded-full ${type.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Rating Component (for rating feedback type) */}
        {feedbackType === 'rating' && (
          <div>
            <Label className="text-base font-medium mb-3 block">
              How would you rate this task?
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRatingClick(value)}
                  className="p-1 h-auto"
                >
                  <Star 
                    className={`h-8 w-8 ${
                      value <= rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                </Button>
              ))}
              {rating > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rating} / 5 stars
                </Badge>
              )}
            </div>
            {rating > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {rating === 1 && "Very poor experience"}
                {rating === 2 && "Poor experience"}
                {rating === 3 && "Average experience"}
                {rating === 4 && "Good experience"}
                {rating === 5 && "Excellent experience"}
              </div>
            )}
          </div>
        )}

        {/* Comment/Description Field */}
        {feedbackType && (
          <div>
            <Label className="text-base font-medium mb-3 block">
              {feedbackType === 'rating' ? 'Additional Comments (Optional)' :
               feedbackType === 'bug_report' ? 'Describe the Issue' :
               feedbackType === 'suggestion' ? 'Describe Your Suggestion' :
               'Your Comments'}
            </Label>
            <Textarea
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder={
                feedbackType === 'rating' ? 'Any additional thoughts about this task...' :
                feedbackType === 'bug_report' ? 'Please describe what went wrong, what you expected to happen, and any steps to reproduce the issue...' :
                feedbackType === 'suggestion' ? 'Describe how this could be improved or what feature would be helpful...' :
                'Share your thoughts...'
              }
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        {/* Feedback Context Info */}
        {feedbackType && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Feedback Context:
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Session ID: {sessionId.slice(0, 8)}...</div>
              <div>Scenario: {scenarioId.replace(/-/g, ' ')}</div>
              <div>Task: {taskId.replace(/-/g, ' ')}</div>
              <div>Type: {selectedFeedbackType?.label}</div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          {feedbackType && (
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackType('');
                setRating(0);
                setComment('');
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={submitFeedback}
            disabled={!feedbackType || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Feedback Component for inline use
interface QuickFeedbackProps {
  sessionId: string;
  scenarioId: string;
  taskId: string;
  compact?: boolean;
}

export function QuickFeedback({ sessionId, scenarioId, taskId, compact = false }: QuickFeedbackProps) {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <div className="mt-4">
        <FeedbackCollectionForm
          sessionId={sessionId}
          scenarioId={scenarioId}
          taskId={taskId}
          onFeedbackSubmitted={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${compact ? 'flex-wrap' : ''}`}>
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Provide Feedback
      </Button>
    </div>
  );
}