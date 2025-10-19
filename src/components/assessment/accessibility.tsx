"use client"

import React, { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"

interface AccessibilityAnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
  onAnnounce?: () => void
}

export function AccessibilityAnnouncer({ 
  message, 
  priority = 'polite', 
  onAnnounce 
}: AccessibilityAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear and then set the message to ensure it's announced
      announcerRef.current.textContent = ''
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
          onAnnounce?.()
        }
      }, 100)
    }
  }, [message, onAnnounce])

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  )
}

interface SkipLinkProps {
  targetId: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ targetId, children, className = "" }: SkipLinkProps) {
  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleSkip}
      className={`
        absolute -top-40 left-6 z-50 bg-blue-600 text-white px-4 py-2 rounded
        focus:top-6 transition-all duration-200 font-medium
        ${className}
      `}
    >
      {children}
    </a>
  )
}

interface KeyboardNavigationHelpProps {
  isVisible: boolean
  onClose: () => void
}

export function KeyboardNavigationHelp({ isVisible, onClose }: KeyboardNavigationHelpProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isVisible, onClose])

  if (!isVisible) {return null}

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="keyboard-help-title"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="keyboard-help-title" className="text-lg font-semibold mb-4">
          Keyboard Navigation Help
        </h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Arrow Keys (←/→)</span>
            <span className="text-gray-600 dark:text-gray-400">Navigate questions</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">F</span>
            <span className="text-gray-600 dark:text-gray-400">Flag question</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Tab</span>
            <span className="text-gray-600 dark:text-gray-400">Navigate elements</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Space/Enter</span>
            <span className="text-gray-600 dark:text-gray-400">Select option</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">1-5</span>
            <span className="text-gray-600 dark:text-gray-400">Set confidence level</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Escape</span>
            <span className="text-gray-600 dark:text-gray-400">Close dialogs</span>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} size="sm">
            Close (Esc)
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing focus and announcements
export function useAccessibility() {
  const [announcements, setAnnouncements] = React.useState<string[]>([])
  const [currentAnnouncement, setCurrentAnnouncement] = React.useState<string>('')

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setCurrentAnnouncement(message)
    setAnnouncements(prev => [...prev.slice(-4), message]) // Keep last 5 announcements
  }, [])

  const focusElement = React.useCallback((elementId: string, delay = 0) => {
    setTimeout(() => {
      const element = document.getElementById(elementId)
      if (element) {
        element.focus()
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, delay)
  }, [])

  const announceNavigation = React.useCallback((questionNumber: number, totalQuestions: number) => {
    announce(`Question ${questionNumber} of ${totalQuestions}`)
  }, [announce])

  const announceAnswer = React.useCallback((isCorrect: boolean, explanation?: string) => {
    const message = isCorrect ? 'Correct answer' : 'Incorrect answer'
    announce(explanation ? `${message}. ${explanation}` : message)
  }, [announce])

  const announceTimeWarning = React.useCallback((remainingMinutes: number) => {
    const urgency = remainingMinutes <= 5 ? 'assertive' : 'polite'
    announce(
      `Time warning: ${Math.floor(remainingMinutes)} minutes remaining`,
      urgency as 'polite' | 'assertive'
    )
  }, [announce])

  const announceProgress = React.useCallback((answered: number, total: number) => {
    announce(`Progress update: ${answered} of ${total} questions answered`)
  }, [announce])

  return {
    currentAnnouncement,
    announce,
    focusElement,
    announceNavigation,
    announceAnswer,
    announceTimeWarning,
    announceProgress
  }
}

// Accessible Timer Component
interface AccessibleTimerProps {
  remainingSeconds: number
  totalSeconds: number
  onTimeUpdate: (remainingSeconds: number) => void
  warningThreshold?: number
  criticalThreshold?: number
}

export function AccessibleTimer({
  remainingSeconds,
  totalSeconds,
  onTimeUpdate,
  warningThreshold = 300, // 5 minutes
  criticalThreshold = 60 // 1 minute
}: AccessibleTimerProps) {
  const [lastWarning, setLastWarning] = React.useState<number | null>(null)
  const { announceTimeWarning } = useAccessibility()

  React.useEffect(() => {
    onTimeUpdate(remainingSeconds)

    // Announce time warnings
    if (remainingSeconds <= criticalThreshold && lastWarning !== criticalThreshold) {
      announceTimeWarning(remainingSeconds / 60)
      setLastWarning(criticalThreshold)
    } else if (remainingSeconds <= warningThreshold && lastWarning !== warningThreshold) {
      announceTimeWarning(remainingSeconds / 60)
      setLastWarning(warningThreshold)
    }
  }, [remainingSeconds, onTimeUpdate, lastWarning, announceTimeWarning, criticalThreshold, warningThreshold])

  const percentage = ((totalSeconds - remainingSeconds) / totalSeconds) * 100
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <div 
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
    >
      <div 
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
        aria-label={`Assessment progress: ${Math.round(percentage)}% of time elapsed`}
        className="sr-only"
      >
        {Math.round(percentage)}% complete
      </div>
    </div>
  )
}

// Accessible Form Controls
interface AccessibleRadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; label: string; description?: string }>
  required?: boolean
  disabled?: boolean
  'aria-describedby'?: string
}

export function AccessibleRadioGroup({
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  'aria-describedby': ariaDescribedby
}: AccessibleRadioGroupProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <div 
        role="radiogroup"
        aria-required={required}
        aria-describedby={ariaDescribedby}
      >
        {options.map((option, index) => (
          <label
            key={option.id}
            className="flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              aria-describedby={option.description ? `${option.id}-desc` : undefined}
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {String.fromCharCode(65 + index)}. {option.label}
              </span>
              {option.description && (
                <p 
                  id={`${option.id}-desc`}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default {
  AccessibilityAnnouncer,
  SkipLink,
  KeyboardNavigationHelp,
  useAccessibility,
  AccessibleTimer,
  AccessibleRadioGroup
}