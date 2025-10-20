/**
 * Toast Utilities
 * Consistent toast notifications throughout the app
 */

import { toast as sonnerToast } from 'sonner';

/**
 * Success toast
 */
export function toastSuccess(message: string, description?: string) {
  return sonnerToast.success(message, {
    description,
  });
}

/**
 * Error toast
 */
export function toastError(message: string, description?: string) {
  return sonnerToast.error(message, {
    description,
  });
}

/**
 * Info toast
 */
export function toastInfo(message: string, description?: string) {
  return sonnerToast.info(message, {
    description,
  });
}

/**
 * Warning toast
 */
export function toastWarning(message: string, description?: string) {
  return sonnerToast.warning(message, {
    description,
  });
}

/**
 * Loading toast with promise
 */
export function toastLoading(message: string) {
  return sonnerToast.loading(message);
}

/**
 * Promise toast - shows loading, success, or error based on promise
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) {
  return sonnerToast.promise(promise, messages);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  sonnerToast.dismiss();
}

/**
 * Common toast messages for the app
 */
export const toastMessages = {
  // Authentication
  signInSuccess: () => toastSuccess('Welcome back!', 'You have been signed in successfully.'),
  signOutSuccess: () => toastSuccess('Signed out', 'You have been signed out successfully.'),
  signUpSuccess: () => toastSuccess('Account created!', 'Welcome to ICP Qualifier.'),
  authError: (error?: string) =>
    toastError('Authentication failed', error || 'Please try again.'),

  // Company Analysis
  analysisStarted: () => toastInfo('Analyzing domain...', 'This may take a few moments.'),
  analysisSuccess: (company: string) =>
    toastSuccess('Analysis complete!', `Successfully analyzed ${company}`),
  analysisError: (error?: string) =>
    toastError('Analysis failed', error || 'Unable to analyze domain. Please try again.'),

  // ICP Generation
  icpGenerating: () => toastLoading('Generating ICP...'),
  icpSuccess: () => toastSuccess('ICP generated!', 'Your ideal customer profile is ready.'),
  icpError: (error?: string) =>
    toastError('ICP generation failed', error || 'Unable to generate ICP. Please try again.'),

  // Qualification
  qualificationStarted: (count: number) =>
    toastInfo(`Qualifying ${count} prospect${count > 1 ? 's' : ''}...`, 'This may take a few moments.'),
  qualificationSuccess: (count: number) =>
    toastSuccess(
      'Qualification complete!',
      `Successfully qualified ${count} prospect${count > 1 ? 's' : ''}.`
    ),
  qualificationError: (error?: string) =>
    toastError('Qualification failed', error || 'Unable to qualify prospects. Please try again.'),

  // Validation
  invalidDomain: () => toastError('Invalid domain', 'Please enter a valid domain name.'),
  invalidInput: (field: string) => toastError('Invalid input', `Please check your ${field}.`),
  
  // Rate Limiting
  rateLimitExceeded: () =>
    toastWarning('Too many requests', 'Please wait a moment before trying again.'),

  // Network
  networkError: () =>
    toastError('Network error', 'Unable to connect. Please check your internet connection.'),
  serverError: () =>
    toastError('Server error', 'Something went wrong on our end. Please try again later.'),

  // Generic
  saveSuccess: () => toastSuccess('Saved', 'Your changes have been saved.'),
  saveError: () => toastError('Save failed', 'Unable to save your changes. Please try again.'),
  copySuccess: () => toastSuccess('Copied!', 'Copied to clipboard.'),
  copyError: () => toastError('Copy failed', 'Unable to copy to clipboard.'),
} as const;

// Export the original toast for custom usage
export const toast = sonnerToast;
