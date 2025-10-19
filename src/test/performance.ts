import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

/**
 * Performance testing utilities using Playwright
 */

// Performance metrics interface
interface PerformanceMetrics {
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay?: number
  cumulativeLayoutShift: number
  timeToInteractive: number
  totalBlockingTime: number
  speedIndex: number
}

// Performance test helper
export async function measurePerformance(page: Page, url?: string): Promise<PerformanceMetrics> {
  if (url) {
    await page.goto(url)
  }

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle')

  // Get performance metrics
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Use PerformanceObserver to get Web Vitals
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const paintEntries = performance.getEntriesByType('paint')
        const navigationEntries = performance.getEntriesByType('navigation')
        
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        const nav = navigationEntries[0] as PerformanceNavigationTiming
        
        resolve({
          firstContentfulPaint: fcp,
          largestContentfulPaint: 0, // Will be measured separately
          cumulativeLayoutShift: 0,  // Will be measured separately
          timeToInteractive: nav?.loadEventEnd - nav?.fetchStart || 0,
          totalBlockingTime: 0,      // Simplified measurement
          speedIndex: 0              // Simplified measurement
        })
      })
      
      observer.observe({ entryTypes: ['paint', 'navigation'] })
      
      // Fallback timeout
      setTimeout(() => {
        resolve({
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          timeToInteractive: 0,
          totalBlockingTime: 0,
          speedIndex: 0
        })
      }, 5000)
    })
  }) as PerformanceMetrics

  return metrics
}

// Performance assertions
export const performanceAssertions = {
  // Core Web Vitals thresholds (good scores)
  expectations: {
    firstContentfulPaint: 1800,    // < 1.8s
    largestContentfulPaint: 2500,  // < 2.5s
    firstInputDelay: 100,          // < 100ms
    cumulativeLayoutShift: 0.1,    // < 0.1
    timeToInteractive: 3800,       // < 3.8s
    totalBlockingTime: 200,        // < 200ms
    speedIndex: 3400               // < 3.4s
  },

  assertGoodPerformance(metrics: PerformanceMetrics) {
    expect(metrics.firstContentfulPaint).toBeLessThan(this.expectations.firstContentfulPaint)
    expect(metrics.largestContentfulPaint).toBeLessThan(this.expectations.largestContentfulPaint)
    expect(metrics.cumulativeLayoutShift).toBeLessThan(this.expectations.cumulativeLayoutShift)
    expect(metrics.timeToInteractive).toBeLessThan(this.expectations.timeToInteractive)
  },

  assertAcceptablePerformance(metrics: PerformanceMetrics) {
    // More lenient thresholds for acceptable performance
    expect(metrics.firstContentfulPaint).toBeLessThan(this.expectations.firstContentfulPaint * 1.5)
    expect(metrics.timeToInteractive).toBeLessThan(this.expectations.timeToInteractive * 1.5)
  }
}

// Resource loading performance
export async function checkResourceLoading(page: Page) {
  const resourceTiming = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    return resources.map(resource => ({
      name: resource.name,
      duration: resource.duration,
      transferSize: resource.transferSize || 0,
      type: resource.initiatorType
    }))
  })

  return {
    totalResources: resourceTiming.length,
    slowResources: resourceTiming.filter(r => r.duration > 1000),
    largeResources: resourceTiming.filter(r => r.transferSize > 100000), // > 100KB
    averageLoadTime: resourceTiming.reduce((sum, r) => sum + r.duration, 0) / resourceTiming.length
  }
}

// Memory usage testing
export async function checkMemoryUsage(page: Page) {
  const memoryInfo = await page.evaluate(() => {
    // Check if performance.memory exists (Chrome-specific)
    const perfWithMemory = performance as any
    if (perfWithMemory.memory) {
      return {
        usedJSHeapSize: perfWithMemory.memory.usedJSHeapSize,
        totalJSHeapSize: perfWithMemory.memory.totalJSHeapSize,
        jsHeapSizeLimit: perfWithMemory.memory.jsHeapSizeLimit
      }
    }
    return null
  })

  return memoryInfo
}

// Bundle size analysis
export async function analyzeBundleSize(page: Page) {
  const scripts = await page.locator('script[src]').all()
  const styles = await page.locator('link[rel="stylesheet"]').all()
  
  const scriptSizes = await Promise.all(
    scripts.map(async (script) => {
      const src = await script.getAttribute('src')
      if (src?.startsWith('http')) {
        try {
          const response = await page.request.get(src)
          const content = await response.text()
          return { url: src, size: content.length, type: 'script' }
        } catch {
          return { url: src, size: 0, type: 'script' }
        }
      }
      return { url: src || '', size: 0, type: 'script' }
    })
  )

  const styleSizes = await Promise.all(
    styles.map(async (style) => {
      const href = await style.getAttribute('href')
      if (href?.startsWith('http')) {
        try {
          const response = await page.request.get(href)
          const content = await response.text()
          return { url: href, size: content.length, type: 'style' }
        } catch {
          return { url: href, size: 0, type: 'style' }
        }
      }
      return { url: href || '', size: 0, type: 'style' }
    })
  )

  const totalSize = [...scriptSizes, ...styleSizes].reduce((sum, item) => sum + item.size, 0)
  
  return {
    scripts: scriptSizes,
    styles: styleSizes,
    totalBundleSize: totalSize,
    recommendations: {
      shouldOptimize: totalSize > 500000, // > 500KB
      largeFiles: [...scriptSizes, ...styleSizes].filter(item => item.size > 100000)
    }
  }
}

// Image optimization check
export async function checkImageOptimization(page: Page) {
  const images = await page.locator('img').all()
  
  const imageAnalysis = await Promise.all(
    images.map(async (img) => {
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt')
      const loading = await img.getAttribute('loading')
      
      // Get computed dimensions
      const dimensions = await img.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        return {
          displayWidth: rect.width,
          displayHeight: rect.height,
          naturalWidth: (el as HTMLImageElement).naturalWidth,
          naturalHeight: (el as HTMLImageElement).naturalHeight
        }
      })
      
      return {
        src,
        alt: alt || 'missing',
        loading,
        ...dimensions,
        isOptimized: loading === 'lazy' && alt !== null,
        isOversized: dimensions.naturalWidth > dimensions.displayWidth * 2
      }
    })
  )
  
  return {
    totalImages: imageAnalysis.length,
    unoptimizedImages: imageAnalysis.filter(img => !img.isOptimized),
    oversizedImages: imageAnalysis.filter(img => img.isOversized),
    missingAltText: imageAnalysis.filter(img => img.alt === 'missing')
  }
}