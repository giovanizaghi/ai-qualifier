// Web Vitals implementation for performance monitoring
import React from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

// Global gtag declaration
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, any>) => void
  }
}

// Performance thresholds based on Google recommendations
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint (ms) - replaces FID
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
}

interface AnalyticsData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
  id: string
  timestamp: number
  url: string
  userAgent: string
}

// Function to determine performance rating
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) {return 'good'}
  
  if (value <= threshold.good) {return 'good'}
  if (value <= threshold.poor) {return 'needs-improvement'}
  return 'poor'
}

// Send metric to analytics service
function sendToAnalytics(metric: Metric) {
  const data: AnalyticsData = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    navigationType: metric.navigationType || 'unknown',
    id: metric.id,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', data)
  }

  // Send to your analytics service
  // Example implementations:

  // 1. Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      custom_map: {
        metric_rating: data.rating,
        metric_delta: metric.delta,
      },
    })
  }

  // 2. Send to your own analytics API
  if (typeof fetch !== 'undefined') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      keepalive: true, // Ensure the request completes even if the page is unloading
    }).catch(error => {
      console.error('Failed to send web vitals data:', error)
    })
  }

  // 3. Store in localStorage for offline analysis
  try {
    const stored = localStorage.getItem('webVitals') || '[]'
    const vitals = JSON.parse(stored)
    vitals.push(data)
    
    // Keep only the last 100 measurements
    if (vitals.length > 100) {
      vitals.splice(0, vitals.length - 100)
    }
    
    localStorage.setItem('webVitals', JSON.stringify(vitals))
  } catch (error) {
    console.error('Failed to store web vitals data:', error)
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  try {
    onCLS(sendToAnalytics)
    onINP(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
    
    console.log('✅ Web Vitals monitoring initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Web Vitals:', error)
  }
}

// Export function to manually report custom metrics
export function reportCustomMetric(name: string, value: number, attributes?: Record<string, any>) {
  const customMetric = {
    name: `custom_${name}`,
    value,
    delta: value,
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    navigationType: 'custom',
    ...attributes,
  }

  sendToAnalytics(customMetric as Metric)
}

// Function to get stored Web Vitals data
export function getStoredWebVitals(): AnalyticsData[] {
  try {
    const stored = localStorage.getItem('webVitals')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to retrieve stored web vitals:', error)
    return []
  }
}

// Function to clear stored Web Vitals data
export function clearStoredWebVitals(): void {
  try {
    localStorage.removeItem('webVitals')
    console.log('Cleared stored Web Vitals data')
  } catch (error) {
    console.error('Failed to clear stored web vitals:', error)
  }
}

// Performance observer for additional metrics
export function initPerformanceObserver() {
  if ('PerformanceObserver' in window) {
    try {
      // Long tasks observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            reportCustomMetric('long_task', entry.duration, {
              startTime: entry.startTime,
              name: entry.name,
            })
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })

      // Navigation timing observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming
          
          // Report additional navigation metrics
          reportCustomMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart)
          reportCustomMetric('dom_complete', navEntry.domComplete - navEntry.responseEnd)
          reportCustomMetric('load_complete', navEntry.loadEventEnd - navEntry.loadEventStart)
        }
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })

      // Resource timing observer for large resources
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Report slow loading resources (> 1s)
          if (resourceEntry.duration > 1000) {
            reportCustomMetric('slow_resource', resourceEntry.duration, {
              name: resourceEntry.name,
              transferSize: resourceEntry.transferSize,
              type: resourceEntry.initiatorType,
            })
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })

    } catch (error) {
      console.error('Failed to initialize Performance Observer:', error)
    }
  }
}

// React hook for Web Vitals
export function useWebVitals() {
  const [vitals, setVitals] = React.useState<AnalyticsData[]>([])

  React.useEffect(() => {
    setVitals(getStoredWebVitals())
    
    // Update vitals when new ones are stored
    const interval = setInterval(() => {
      setVitals(getStoredWebVitals())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    vitals,
    clearVitals: clearStoredWebVitals,
    reportMetric: reportCustomMetric,
  }
}

// Default export for easy import
export default initWebVitals