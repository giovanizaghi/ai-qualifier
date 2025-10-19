'use client';

import { toast } from 'sonner';
import { CheckCircle, AlertCircle, XCircle, Info, Trophy, Star, Clock, Target } from 'lucide-react';

interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

interface ProgressNotificationOptions extends NotificationOptions {
  current: number;
  total: number;
  label?: string;
}

export const notification = {
  // Basic notifications
  success: (message: string, options?: NotificationOptions) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      dismissible: options?.dismissible ?? true
    });
  },

  error: (message: string, options?: NotificationOptions) => {
    return toast.error(message, {
      duration: options?.duration || 6000,
      action: options?.action,
      dismissible: options?.dismissible ?? true
    });
  },

  warning: (message: string, options?: NotificationOptions) => {
    return toast.warning(message, {
      duration: options?.duration || 5000,
      action: options?.action,
      dismissible: options?.dismissible ?? true
    });
  },

  info: (message: string, options?: NotificationOptions) => {
    return toast.info(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      dismissible: options?.dismissible ?? true
    });
  },

  // Assessment-specific notifications
  assessmentStarted: (qualificationTitle: string, timeLimit?: number) => {
    const message = timeLimit 
      ? `Assessment started: ${qualificationTitle}. You have ${timeLimit} minutes.`
      : `Assessment started: ${qualificationTitle}`;
    
    return toast.info(message, {
      duration: 3000
    });
  },

  assessmentCompleted: (qualificationTitle: string, score: number, passed: boolean) => {
    const message = `Assessment completed: ${qualificationTitle}. Score: ${Math.round(score)}%`;
    
    if (passed) {
      return toast.success(message, {
        duration: 6000,
        action: {
          label: 'View Results',
          onClick: () => {
            // Handle navigation to results
          }
        }
      });
    } else {
      return toast.warning(message, {
        duration: 6000,
        action: {
          label: 'Review',
          onClick: () => {
            // Handle navigation to review
          }
        }
      });
    }
  },

  achievementUnlocked: (title: string, description: string) => {
    return toast.success(`🏆 Achievement Unlocked: ${title}`, {
      description,
      duration: 8000,
      action: {
        label: 'View',
        onClick: () => {
          // Handle navigation to achievements
        }
      }
    });
  },

  perfectScore: (qualificationTitle: string) => {
    return toast.success(`🌟 Perfect Score!`, {
      description: `You aced the ${qualificationTitle} assessment!`,
      duration: 8000
    });
  },

  // Progress notifications
  progressUpdate: (qualificationTitle: string, options: ProgressNotificationOptions) => {
    const percentage = Math.round((options.current / options.total) * 100);
    const message = `${options.label || 'Progress'}: ${percentage}% complete (${options.current}/${options.total})`;
    
    return toast.info(message, {
      description: qualificationTitle,
      duration: options.duration || 3000
    });
  },

  // Time-based notifications
  timeWarning: (remainingMinutes: number) => {
    return toast.warning(`⏰ ${remainingMinutes} minutes remaining`, {
      duration: 4000
    });
  },

  timeUp: () => {
    return toast.error('⏰ Time\'s up! Your assessment has been submitted.', {
      duration: 6000
    });
  },

  // Study reminders
  studyReminder: (qualificationTitle: string, daysSinceLastStudy: number) => {
    return toast.info(`📚 Continue your progress on ${qualificationTitle}`, {
      description: `It's been ${daysSinceLastStudy} days since your last study session.`,
      duration: 6000,
      action: {
        label: 'Continue',
        onClick: () => {
          // Handle navigation to qualification
        }
      }
    });
  },

  // Bookmark notifications
  bookmarkAdded: (qualificationTitle: string) => {
    return toast.success(`Bookmarked: ${qualificationTitle}`, {
      duration: 2000
    });
  },

  bookmarkRemoved: (qualificationTitle: string) => {
    return toast.info(`Removed bookmark: ${qualificationTitle}`, {
      duration: 2000
    });
  },

  // System notifications
  connectionLost: () => {
    return toast.error('Connection lost. Please check your internet connection.', {
      duration: Infinity,
      dismissible: false,
      action: {
        label: 'Retry',
        onClick: () => {
          window.location.reload();
        }
      }
    });
  },

  connectionRestored: () => {
    return toast.success('Connection restored!', {
      duration: 3000
    });
  },

  // Batch operations
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },

  // Loading notifications
  loading: (message: string) => {
    return toast.loading(message);
  },

  // Custom notification with JSX content
  custom: (content: React.ReactNode, options?: NotificationOptions) => {
    return toast.custom(content, {
      duration: options?.duration || 4000,
      dismissible: options?.dismissible ?? true
    });
  }
};

// Hook for managing notification preferences
export function useNotificationPreferences() {
  const getPreferences = () => {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem('notification-preferences');
      return stored ? JSON.parse(stored) : {
        achievements: true,
        progress: true,
        reminders: true,
        assessments: true,
        system: true
      };
    } catch {
      return {
        achievements: true,
        progress: true,
        reminders: true,
        assessments: true,
        system: true
      };
    }
  };

  const updatePreferences = (preferences: Record<string, boolean>) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  return {
    preferences: getPreferences(),
    updatePreferences
  };
}