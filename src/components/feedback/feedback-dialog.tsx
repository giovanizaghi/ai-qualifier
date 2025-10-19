'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FeedbackForm, FeedbackData, FeedbackType } from './feedback-form';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  trigger?: React.ReactNode;
  defaultType?: FeedbackType;
  context?: FeedbackData['context'];
  className?: string;
}

export function FeedbackDialog({
  onSubmit,
  trigger,
  defaultType = 'general',
  context,
  className
}: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (feedback: FeedbackData) => {
    try {
      await onSubmit(feedback);
      setIsSubmitted(true);
      // Auto-close after showing success message
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      throw error; // Let the form handle the error
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <MessageSquare className="h-4 w-4" />
      Send Feedback
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild className={className}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Thank you for your feedback!</h3>
              <p className="text-muted-foreground">
                We appreciate you taking the time to help us improve the platform.
              </p>
            </div>
          </div>
        ) : (
          <FeedbackForm
            onSubmit={handleSubmit}
            initialType={defaultType}
            context={context}
            autoFocus
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Floating feedback button component
interface FloatingFeedbackButtonProps {
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function FloatingFeedbackButton({
  onSubmit,
  position = 'bottom-right',
  className
}: FloatingFeedbackButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      <FeedbackDialog
        onSubmit={onSubmit}
        trigger={
          <Button
            size="lg"
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Feedback
          </Button>
        }
      />
    </div>
  );
}