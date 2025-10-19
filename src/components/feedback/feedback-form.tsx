'use client';

import { useState } from 'react';
import { Star, MessageSquare, Bug, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general' | 'content';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export interface FeedbackData {
  type: FeedbackType;
  priority?: FeedbackPriority;
  title: string;
  description: string;
  rating?: number;
  email?: string;
  context?: {
    page?: string;
    userAgent?: string;
    qualification?: string;
    assessment?: string;
  };
}

interface FeedbackFormProps {
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  className?: string;
  autoFocus?: boolean;
  initialType?: FeedbackType;
  context?: FeedbackData['context'];
}

const feedbackTypes = {
  bug: {
    label: 'Bug Report',
    description: 'Report a problem or error',
    icon: Bug,
    color: 'text-red-600'
  },
  feature: {
    label: 'Feature Request',
    description: 'Suggest a new feature',
    icon: Lightbulb,
    color: 'text-yellow-600'
  },
  improvement: {
    label: 'Improvement',
    description: 'Suggest an enhancement',
    icon: AlertTriangle,
    color: 'text-blue-600'
  },
  content: {
    label: 'Content Feedback',
    description: 'Feedback on questions or qualifications',
    icon: MessageSquare,
    color: 'text-purple-600'
  },
  general: {
    label: 'General Feedback',
    description: 'General comments or suggestions',
    icon: MessageSquare,
    color: 'text-gray-600'
  }
};

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

function StarRating({ rating, onChange, size = 'md', disabled = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size];

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn(
            "transition-colors",
            disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"
          )}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              (hover >= star || rating >= star)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackForm({
  onSubmit,
  className,
  autoFocus = false,
  initialType = 'general',
  context
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FeedbackData>({
    type: initialType,
    priority: 'medium',
    title: '',
    description: '',
    rating: 0,
    email: '',
    context
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        context: {
          ...context,
          page: window.location.pathname,
          userAgent: navigator.userAgent
        }
      });
      
      // Reset form
      setFormData({
        type: 'general',
        priority: 'medium',
        title: '',
        description: '',
        rating: 0,
        email: '',
        context
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes[formData.type];
  const IconComponent = selectedType.icon;

  return (
    <Card className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconComponent className={cn("h-5 w-5", selectedType.color)} />
            <h3 className="text-lg font-semibold">Send Feedback</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Help us improve by sharing your thoughts and suggestions
          </p>
        </div>

        {/* Feedback Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Feedback Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: FeedbackType) => 
              setFormData(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(feedbackTypes).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", type.color)} />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Priority (for bugs and improvements) */}
        {(formData.type === 'bug' || formData.type === 'improvement') && (
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: FeedbackPriority) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor issue</SelectItem>
                <SelectItem value="medium">Medium - Moderate impact</SelectItem>
                <SelectItem value="high">High - Significant impact</SelectItem>
                <SelectItem value="critical">Critical - Blocks usage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Rating (for general feedback) */}
        {formData.type === 'general' && (
          <div className="space-y-2">
            <Label>Overall Rating</Label>
            <div className="flex items-center gap-3">
              <StarRating
                rating={formData.rating || 0}
                onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
              />
              <span className="text-sm text-muted-foreground">
                {formData.rating ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'No rating'}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief summary of your feedback"
            autoFocus={autoFocus}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Please provide detailed information about your feedback..."
            className="w-full min-h-[120px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-y"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Email (optional) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your.email@example.com"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            Provide your email if you'd like us to follow up on your feedback
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            * Required fields
          </p>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </div>
      </form>
    </Card>
  );
}