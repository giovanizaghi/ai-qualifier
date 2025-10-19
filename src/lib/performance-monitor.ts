/**
 * Performance monitoring utilities for Core Web Vitals and custom metrics
 */

import { useState, useEffect } from 'react';

// Define NetworkInformation interface for TypeScript
interface NetworkInformation {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  FCP?: number;  // First Contentful Paint
  TTFB?: number; // Time to First Byte
  
  // Custom metrics
  navigationTiming?: PerformanceNavigationTiming;
  resourceTiming?: PerformanceResourceTiming[];
  memory?: any;
  bundleSize?: number;
}

export interface PerformanceReport {
  url: string;
  timestamp: number;
  userAgent: string;
  connection?: NetworkInformation;
  metrics: PerformanceMetrics;
  score: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          if (lastEntry) {
            this.metrics.LCP = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.FCP = entry.startTime;
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Navigation Timing
      this.captureNavigationTiming();
      
      // Resource Timing
      this.captureResourceTiming();
    }
  }

  private captureNavigationTiming(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        this.metrics.navigationTiming = navTiming;
        this.metrics.TTFB = navTiming.responseStart - navTiming.requestStart;
      }
    }
  }

  private captureResourceTiming(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      this.metrics.resourceTiming = resources;
    }
  }

  private captureMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'performance' in window && (performance as any).memory) {
      this.metrics.memory = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }
  }

  getMetrics(): PerformanceMetrics {
    this.captureMemoryUsage();
    return { ...this.metrics };
  }

  calculatePerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 100;

    // LCP scoring (0-2.5s = good, 2.5-4s = needs improvement, >4s = poor)
    if (metrics.LCP) {
      if (metrics.LCP > 4000) {score -= 30;}
      else if (metrics.LCP > 2500) {score -= 15;}
    }

    // FID scoring (0-100ms = good, 100-300ms = needs improvement, >300ms = poor)
    if (metrics.FID) {
      if (metrics.FID > 300) {score -= 25;}
      else if (metrics.FID > 100) {score -= 10;}
    }

    // CLS scoring (0-0.1 = good, 0.1-0.25 = needs improvement, >0.25 = poor)
    if (metrics.CLS) {
      if (metrics.CLS > 0.25) {score -= 25;}
      else if (metrics.CLS > 0.1) {score -= 10;}
    }

    // FCP scoring (0-1.8s = good, 1.8-3s = needs improvement, >3s = poor)
    if (metrics.FCP) {
      if (metrics.FCP > 3000) {score -= 20;}
      else if (metrics.FCP > 1800) {score -= 10;}
    }

    return Math.max(0, score);
  }

  async generateReport(): Promise<PerformanceReport> {
    const metrics = this.getMetrics();
    const performanceScore = this.calculatePerformanceScore();

    const report: PerformanceReport = {
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connection: typeof navigator !== 'undefined' && 'connection' in navigator 
        ? (navigator as any).connection 
        : undefined,
      metrics,
      score: {
        performance: performanceScore,
        accessibility: 100, // Would need to integrate with axe-core
        bestPractices: 100, // Would need custom scoring
        seo: 100, // Would need custom scoring
      },
    };

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(report);
    }

    return report;
  }

  private async sendToAnalytics(report: PerformanceReport): Promise<void> {
    try {
      // Send to custom analytics endpoint
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        });
      }

      // Send to Google Analytics 4 (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_performance', {
          lcp: report.metrics.LCP,
          fid: report.metrics.FID,
          cls: report.metrics.CLS,
          fcp: report.metrics.FCP,
          performance_score: report.score.performance,
        });
      }
    } catch (error) {
      console.warn('Failed to send performance data to analytics:', error);
    }
  }

  // Clean up observers
  destroy(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  // Measure custom operations
  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      
      // Add to custom metrics
      if (!this.metrics.bundleSize) {
        this.metrics.bundleSize = 0;
      }
    });
  }

  measureSync<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    }
  }
}

// Create singleton instance
const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for component performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [report, setReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    const generateReport = async () => {
      const newReport = await performanceMonitor.generateReport();
      setReport(newReport);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    
    // Generate report on mount and when page is about to unload
    generateReport();
    
    const handleBeforeUnload = () => {
      generateReport();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, []);

  return {
    metrics,
    report,
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
  };
}

// Utility functions
export function formatMetric(value: number | undefined, unit: string = 'ms'): string {
  if (value === undefined) {return 'N/A';}
  return `${value.toFixed(2)}${unit}`;
}

export function getPerformanceGrade(score: number): { grade: string; color: string } {
  if (score >= 90) {return { grade: 'A', color: 'green' };}
  if (score >= 75) {return { grade: 'B', color: 'yellow' };}
  if (score >= 60) {return { grade: 'C', color: 'orange' };}
  return { grade: 'D', color: 'red' };
}

export { performanceMonitor };
export default performanceMonitor;