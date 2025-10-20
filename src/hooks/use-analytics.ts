"use client"

import { useCallback, useEffect, useRef } from 'react'

// Define analytics event types
export type AnalyticsEventType = 
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'assessment_start'
  | 'assessment_complete'
  | 'question_answered'
  | 'search_performed'
  | 'bookmark_added'
  | 'bookmark_removed'
  | 'error_occurred'
  | string

interface AnalyticsHookOptions {
  enableAutoTracking?: boolean
  sessionTimeout?: number // minutes
}

interface TrackEventOptions {
  data?: Record<string, any>
  immediate?: boolean
}

export function useAnalytics(options: AnalyticsHookOptions = {}) {
  const {
    enableAutoTracking = true,
    sessionTimeout = 30
  } = options

  const sessionId = useRef<string | undefined>(undefined)
  const sessionTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const eventQueue = useRef<Array<{
    eventType: AnalyticsEventType
    data: Record<string, any>
    timestamp: Date
  }>>([])

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Initialize session
  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = generateSessionId()
      if (enableAutoTracking) {
        trackEvent('session_start', {}, { immediate: true })
      }
    }

    // Set up session timeout
    const resetSessionTimer = () => {
      if (sessionTimer.current) {
        clearTimeout(sessionTimer.current)
      }
      sessionTimer.current = setTimeout(() => {
        if (enableAutoTracking) {
          trackEvent('session_end', {}, { immediate: true })
        }
        sessionId.current = generateSessionId()
      }, sessionTimeout * 60 * 1000)
    }

    resetSessionTimer()

    // Reset timer on user activity
    const handleActivity = () => resetSessionTimer()
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      if (sessionTimer.current) {
        clearTimeout(sessionTimer.current)
      }
    }
  }, [enableAutoTracking, sessionTimeout, generateSessionId])

  // Track page views automatically
  useEffect(() => {
    if (!enableAutoTracking) return

    const handleRouteChange = () => {
      trackEvent('page_view', {
        page: window.location.pathname,
        referrer: document.referrer
      })
    }

    // Track initial page view
    handleRouteChange()

    // For Next.js App Router, we'll track on mount
    // In a real implementation, you might want to use Next.js router events
    
    return () => {
      // Cleanup if needed
    }
  }, [enableAutoTracking])

  // Send analytics event to API
  const sendEvent = async (
    eventType: AnalyticsEventType,
    data: Record<string, any> = {}
  ): Promise<void> => {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          data: {
            ...data,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userAgent: navigator.userAgent
          },
          sessionId: sessionId.current
        })
      })

      if (!response.ok) {
        throw new Error(`Analytics tracking failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error)
      // Store failed events for retry
      eventQueue.current.push({
        eventType,
        data,
        timestamp: new Date()
      })
    }
  }

  // Track event with optional queuing
  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    data: Record<string, any> = {},
    options: TrackEventOptions = {}
  ) => {
    const { immediate = false } = options

    if (immediate) {
      await sendEvent(eventType, data)
    } else {
      // Add to queue for batch processing
      eventQueue.current.push({
        eventType,
        data,
        timestamp: new Date()
      })
    }
  }, [])

  // Flush event queue
  const flushEvents = useCallback(async () => {
    const events = [...eventQueue.current]
    eventQueue.current = []

    for (const event of events) {
      await sendEvent(event.eventType, {
        ...event.data,
        queuedAt: event.timestamp.toISOString()
      })
    }
  }, [])

  // Track specific event types with convenience methods
  const trackAssessmentStart = useCallback((assessmentId: string, qualificationId: string) => {
    trackEvent('assessment_start', {
      assessmentId,
      qualificationId,
      startTime: new Date().toISOString()
    }, { immediate: true })
  }, [trackEvent])

  const trackAssessmentComplete = useCallback((
    assessmentId: string,
    qualificationId: string,
    score: number,
    timeSpent: number,
    questionsAnswered: number
  ) => {
    trackEvent('assessment_complete', {
      assessmentId,
      qualificationId,
      score,
      timeSpent,
      questionsAnswered,
      completedAt: new Date().toISOString()
    }, { immediate: true })
  }, [trackEvent])

  const trackQuestionAnswered = useCallback((
    questionId: string,
    assessmentId: string,
    isCorrect: boolean,
    timeSpent: number,
    selectedAnswers: string[]
  ) => {
    trackEvent('question_answered', {
      questionId,
      assessmentId,
      isCorrect,
      timeSpent,
      selectedAnswers,
      answeredAt: new Date().toISOString()
    })
  }, [trackEvent])

  const trackSearch = useCallback((query: string, resultsCount: number, filters?: Record<string, any>) => {
    trackEvent('search_performed', {
      query,
      resultsCount,
      filters,
      searchedAt: new Date().toISOString()
    })
  }, [trackEvent])

  const trackBookmark = useCallback((qualificationId: string, action: 'added' | 'removed') => {
    trackEvent(action === 'added' ? 'bookmark_added' : 'bookmark_removed', {
      qualificationId,
      actionAt: new Date().toISOString()
    })
  }, [trackEvent])

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    trackEvent('error_occurred', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      errorAt: new Date().toISOString()
    }, { immediate: true })
  }, [trackEvent])

  // Periodic flush of queued events
  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (eventQueue.current.length > 0) {
        flushEvents()
      }
    }, 10000) // Flush every 10 seconds

    return () => clearInterval(flushInterval)
  }, [flushEvents])

  // Flush events on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0) {
        // Use sendBeacon for reliable delivery on page unload
        const events = eventQueue.current.map(event => ({
          ...event,
          sessionId: sessionId.current
        }))
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/track', JSON.stringify({
            events,
            bulk: true
          }))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return {
    trackEvent,
    trackAssessmentStart,
    trackAssessmentComplete,
    trackQuestionAnswered,
    trackSearch,
    trackBookmark,
    trackError,
    flushEvents,
    sessionId: sessionId.current
  }
}