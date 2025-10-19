import { test, expect } from '@playwright/test'

import { 
  measurePerformance, 
  performanceAssertions,
  checkResourceLoading,
  checkMemoryUsage,
  analyzeBundleSize,
  checkImageOptimization
} from '../src/test/performance'

test.describe('Performance Tests', () => {
  test('homepage should load within performance budget', async ({ page }) => {
    const metrics = await measurePerformance(page, '/')
    
    // Assert good performance metrics
    performanceAssertions.assertAcceptablePerformance(metrics)
    
    console.log('Performance metrics:', metrics)
  })

  test('authentication pages should be performant', async ({ page }) => {
    // Test sign in page performance
    const signinMetrics = await measurePerformance(page, '/auth/signin')
    performanceAssertions.assertAcceptablePerformance(signinMetrics)
    
    // Test sign up page performance
    const signupMetrics = await measurePerformance(page, '/auth/signup')
    performanceAssertions.assertAcceptablePerformance(signupMetrics)
  })

  test('dashboard should load efficiently', async ({ page }) => {
    // Note: This would typically require authentication
    const metrics = await measurePerformance(page, '/dashboard')
    performanceAssertions.assertAcceptablePerformance(metrics)
  })

  test('should have optimized resource loading', async ({ page }) => {
    await page.goto('/')
    
    const resourceStats = await checkResourceLoading(page)
    
    // Assert resource loading performance
    expect(resourceStats.averageLoadTime).toBeLessThan(500) // < 500ms average
    expect(resourceStats.slowResources.length).toBeLessThan(5) // < 5 slow resources
    expect(resourceStats.largeResources.length).toBeLessThan(3) // < 3 large resources
    
    console.log('Resource loading stats:', resourceStats)
  })

  test('should have reasonable memory usage', async ({ page }) => {
    await page.goto('/')
    
    const memoryStats = await checkMemoryUsage(page)
    
    if (memoryStats) {
      // Assert memory usage is reasonable (< 50MB)
      expect(memoryStats.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024)
      
      console.log('Memory usage:', {
        usedMB: Math.round(memoryStats.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(memoryStats.totalJSHeapSize / 1024 / 1024)
      })
    }
  })

  test('should have optimized bundle sizes', async ({ page }) => {
    await page.goto('/')
    
    const bundleAnalysis = await analyzeBundleSize(page)
    
    // Assert bundle size is reasonable (< 1MB total)
    expect(bundleAnalysis.totalBundleSize).toBeLessThan(1024 * 1024)
    
    // Check for large individual files
    expect(bundleAnalysis.recommendations.largeFiles.length).toBeLessThan(2)
    
    console.log('Bundle analysis:', {
      totalSizeKB: Math.round(bundleAnalysis.totalBundleSize / 1024),
      scriptCount: bundleAnalysis.scripts.length,
      styleCount: bundleAnalysis.styles.length,
      shouldOptimize: bundleAnalysis.recommendations.shouldOptimize
    })
  })

  test('should have optimized images', async ({ page }) => {
    await page.goto('/')
    
    const imageStats = await checkImageOptimization(page)
    
    // Assert image optimization
    expect(imageStats.unoptimizedImages.length).toBeLessThan(imageStats.totalImages * 0.3) // < 30% unoptimized
    expect(imageStats.oversizedImages.length).toBeLessThan(imageStats.totalImages * 0.2) // < 20% oversized
    expect(imageStats.missingAltText.length).toBe(0) // No missing alt text
    
    console.log('Image optimization stats:', imageStats)
  })

  test('should perform well on mobile devices', async ({ page }) => {
    // Simulate mobile device
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Throttle network to simulate 3G
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
      await route.continue()
    })
    
    const metrics = await measurePerformance(page, '/')
    
    // Mobile performance should still be acceptable (but more lenient)
    expect(metrics.firstContentfulPaint).toBeLessThan(3000) // < 3s on mobile
    expect(metrics.timeToInteractive).toBeLessThan(5000)    // < 5s on mobile
    
    console.log('Mobile performance:', metrics)
  })

  test('should handle multiple concurrent users', async ({ page }) => {
    // Test with multiple simultaneous page loads
    const promises = []
    
    for (let i = 0; i < 5; i++) {
      promises.push(measurePerformance(page, '/'))
    }
    
    const results = await Promise.all(promises)
    
    // All requests should complete within reasonable time
    results.forEach((metrics, index) => {
      expect(metrics.timeToInteractive).toBeLessThan(6000) // < 6s under load
      console.log(`Concurrent test ${index + 1}:`, metrics)
    })
  })

  test('should have fast API response times', async ({ page }) => {
    await page.goto('/')
    
    // Measure API response times
    const apiTiming = await page.evaluate(async () => {
      const start = performance.now()
      
      try {
        const response = await fetch('/api/questions?limit=10')
        const end = performance.now()
        
        return {
          duration: end - start,
          status: response.status,
          success: response.ok
        }
      } catch (error) {
        return {
          duration: performance.now() - start,
          status: 0,
          success: false,
          error: (error as Error).message
        }
      }
    })
    
    if (apiTiming.success) {
      // API should respond within 1 second
      expect(apiTiming.duration).toBeLessThan(1000)
      expect(apiTiming.status).toBe(200)
      
      console.log('API response time:', `${apiTiming.duration  }ms`)
    }
  })

  test('should maintain performance during long sessions', async ({ page }) => {
    await page.goto('/')
    
    // Simulate user interaction over time
    const initialMetrics = await measurePerformance(page)
    
    // Navigate through multiple pages
    const pages = ['/qualifications', '/dashboard', '/profile', '/']
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // Simulate user reading time
    }
    
    // Measure performance after navigation
    const finalMetrics = await measurePerformance(page, '/')
    
    // Performance shouldn't degrade significantly
    const degradation = finalMetrics.timeToInteractive / initialMetrics.timeToInteractive
    expect(degradation).toBeLessThan(1.5) // < 50% degradation
    
    console.log('Performance degradation factor:', degradation)
  })
})