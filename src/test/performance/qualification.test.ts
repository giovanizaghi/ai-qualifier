/**
 * Performance tests for Phase 5 optimization validation
 * Tests the goal of processing 100 prospects under 30 seconds
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { qualifyProspects, BATCH_CONFIG } from '../lib/prospect-qualifier';
import { generateICP } from '../lib/icp-generator';
import type { ICPData } from '../lib/icp-generator';
import { cache, logCacheStats } from '../lib/cache';

// Test configuration
const PERFORMANCE_TARGETS = {
  maxTimeFor100Prospects: 30000, // 30 seconds
  maxTimePerProspect: 5000, // 5 seconds per prospect
  minThroughputPerMinute: 200, // prospects per minute
  maxMemoryUsageMB: 500, // maximum memory usage
  maxCacheSize: 1000, // maximum cache entries
} as const;

// Mock data generators
function generateMockProspectDomains(count: number): string[] {
  const domains = [];
  for (let i = 0; i < count; i++) {
    domains.push(`test-company-${i}.com`);
  }
  return domains;
}

function generateMockICP(): ICPData {
  return {
    title: 'Performance Test ICP',
    description: 'Test ICP for performance validation',
    buyerPersonas: [
      {
        role: 'CTO',
        seniority: 'Senior',
        department: 'Engineering',
        painPoints: ['Technical debt', 'Scalability'],
        goals: ['System optimization'],
        triggers: ['Performance issues']
      }
    ],
    companySize: {
      minEmployees: 50,
      maxEmployees: 500,
      stage: ['Growth', 'Mature']
    },
    industries: ['Technology', 'SaaS'],
    geographicRegions: ['North America', 'Europe'],
    fundingStages: ['Series A', 'Series B'],
    keyIndicators: ['Using cloud infrastructure']
  };
}

// Memory monitoring utilities
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
}

function logMemoryUsage(label: string) {
  const usage = getMemoryUsage();
  console.log(`Memory usage (${label}):`, usage);
  return usage;
}

describe('Performance Tests - Phase 5 Validation', () => {
  let mockICP: ICPData;
  
  beforeAll(() => {
    mockICP = generateMockICP();
    console.log('Performance test suite starting...');
    logMemoryUsage('Initial');
  });

  afterAll(() => {
    logMemoryUsage('Final');
    logCacheStats();
  });

  beforeEach(() => {
    // Clear cache before each test for consistent results
    jest.clearAllMocks();
  });

  describe('Core Performance Targets', () => {
    test('should process 100 prospects under 30 seconds', async () => {
      const prospectCount = 100;
      const prospects = generateMockProspectDomains(prospectCount);
      
      console.log(`Starting performance test: ${prospectCount} prospects`);
      const startTime = performance.now();
      const startMemory = getMemoryUsage();

      // Use optimized batching
      const results = await qualifyProspects(prospects, mockICP, {
        batchSize: BATCH_CONFIG.DEFAULT_BATCH_SIZE,
        onProgress: (completed, total) => {
          if (completed % 20 === 0) {
            const elapsed = performance.now() - startTime;
            const rate = (completed / elapsed) * 1000 * 60; // per minute
            console.log(`Progress: ${completed}/${total} (${Math.round(rate)} prospects/min)`);
          }
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      const endMemory = getMemoryUsage();
      
      // Calculate metrics
      const throughput = (prospectCount / duration) * 1000 * 60; // prospects per minute
      const avgTimePerProspect = duration / prospectCount;
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

      console.log('Performance Test Results:', {
        totalDuration: `${Math.round(duration)}ms`,
        avgTimePerProspect: `${Math.round(avgTimePerProspect)}ms`,
        throughput: `${Math.round(throughput)} prospects/min`,
        memoryIncrease: `${memoryIncrease}MB`,
        successfulResults: results.filter(r => !r.processing?.errors?.length).length,
        totalResults: results.length
      });

      // Assertions
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.maxTimeFor100Prospects);
      expect(avgTimePerProspect).toBeLessThan(PERFORMANCE_TARGETS.maxTimePerProspect);
      expect(throughput).toBeGreaterThan(PERFORMANCE_TARGETS.minThroughputPerMinute);
      expect(endMemory.heapUsed).toBeLessThan(PERFORMANCE_TARGETS.maxMemoryUsageMB);
      expect(results).toHaveLength(prospectCount);
    }, 45000); // Allow 45 seconds for the test itself

    test('should handle concurrent batch processing efficiently', async () => {
      const batchSizes = [1, 3, 5, 10];
      const prospectCount = 20; // Smaller test for concurrency
      const prospects = generateMockProspectDomains(prospectCount);

      const results = [];

      for (const batchSize of batchSizes) {
        console.log(`Testing batch size: ${batchSize}`);
        const startTime = performance.now();
        
        const batchResults = await qualifyProspects(prospects, mockICP, {
          batchSize,
          delayBetweenBatches: 0 // No delay for performance testing
        });

        const duration = performance.now() - startTime;
        const throughput = (prospectCount / duration) * 1000 * 60;

        results.push({
          batchSize,
          duration,
          throughput,
          successCount: batchResults.filter(r => !r.processing?.errors?.length).length
        });

        console.log(`Batch size ${batchSize}: ${Math.round(duration)}ms, ${Math.round(throughput)} prospects/min`);
      }

      // Find optimal batch size (highest throughput)
      const optimal = results.reduce((best, current) => 
        current.throughput > best.throughput ? current : best
      );

      console.log('Optimal batch configuration:', optimal);

      // Ensure optimal batch size is reasonable
      expect(optimal.batchSize).toBeGreaterThan(1);
      expect(optimal.batchSize).toBeLessThanOrEqual(BATCH_CONFIG.MAX_BATCH_SIZE);
      expect(optimal.throughput).toBeGreaterThan(PERFORMANCE_TARGETS.minThroughputPerMinute);
    });

    test('should demonstrate caching performance improvements', async () => {
      const prospects = generateMockProspectDomains(10);
      
      // First run (cold cache)
      console.log('Running cold cache test...');
      await cache.clear();
      const coldStart = performance.now();
      const coldResults = await qualifyProspects(prospects, mockICP, {
        batchSize: 3
      });
      const coldDuration = performance.now() - coldStart;

      // Second run (warm cache) - same prospects
      console.log('Running warm cache test...');
      const warmStart = performance.now();
      const warmResults = await qualifyProspects(prospects, mockICP, {
        batchSize: 3
      });
      const warmDuration = performance.now() - warmStart;

      // Calculate improvement
      const improvement = ((coldDuration - warmDuration) / coldDuration) * 100;
      
      console.log('Cache Performance:', {
        coldDuration: `${Math.round(coldDuration)}ms`,
        warmDuration: `${Math.round(warmDuration)}ms`,
        improvement: `${Math.round(improvement)}%`,
      });

      // Warm cache should be significantly faster
      expect(warmDuration).toBeLessThan(coldDuration);
      expect(improvement).toBeGreaterThan(10); // At least 10% improvement
      expect(coldResults).toHaveLength(prospects.length);
      expect(warmResults).toHaveLength(prospects.length);
    });
  });

  describe('Memory and Resource Management', () => {
    test('should maintain stable memory usage during large batches', async () => {
      const prospects = generateMockProspectDomains(50);
      const initialMemory = getMemoryUsage();
      
      console.log('Testing memory stability...');
      
      // Process in multiple smaller batches to test memory cleanup
      const batchSize = 5;
      const memoryReadings = [];
      
      for (let i = 0; i < prospects.length; i += batchSize) {
        const batch = prospects.slice(i, i + batchSize);
        await qualifyProspects(batch, mockICP, { batchSize: 2 });
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        const currentMemory = getMemoryUsage();
        memoryReadings.push(currentMemory.heapUsed);
      }
      
      const finalMemory = getMemoryUsage();
      const maxMemory = Math.max(...memoryReadings);
      const avgMemory = memoryReadings.reduce((sum, val) => sum + val, 0) / memoryReadings.length;
      
      console.log('Memory Analysis:', {
        initial: `${initialMemory.heapUsed}MB`,
        final: `${finalMemory.heapUsed}MB`,
        max: `${maxMemory}MB`,
        average: `${Math.round(avgMemory)}MB`,
        increase: `${finalMemory.heapUsed - initialMemory.heapUsed}MB`
      });

      // Memory should not grow excessively
      expect(maxMemory).toBeLessThan(PERFORMANCE_TARGETS.maxMemoryUsageMB);
      expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100); // Max 100MB increase
    });

    test('should handle cache size limits appropriately', async () => {
      // Fill cache with many entries
      const prospects = generateMockProspectDomains(200);
      
      console.log('Testing cache size management...');
      
      // Process many prospects to fill cache
      await qualifyProspects(prospects.slice(0, 100), mockICP, {
        batchSize: 10
      });
      
      const cacheStats = cache.getStats();
      console.log('Cache Statistics:', cacheStats);
      
      // Cache should not grow unbounded
      expect(cacheStats.entries).toBeLessThanOrEqual(PERFORMANCE_TARGETS.maxCacheSize);
      expect(cacheStats.hitRate).toBeGreaterThan(0); // Should have some cache hits
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle failures efficiently without blocking other prospects', async () => {
      // Mix of valid and invalid domains
      const prospects = [
        ...generateMockProspectDomains(10),
        'invalid-domain-1.invalid',
        'invalid-domain-2.invalid',
        'timeout-domain.timeout',
        ...generateMockProspectDomains(10)
      ];
      
      console.log('Testing error handling performance...');
      const startTime = performance.now();
      
      const results = await qualifyProspects(prospects, mockICP, {
        batchSize: 5,
        maxRetries: 1 // Faster failure for testing
      });
      
      const duration = performance.now() - startTime;
      const successCount = results.filter(r => !r.processing?.errors?.length).length;
      const failureCount = results.filter(r => r.processing?.errors?.length).length;
      
      console.log('Error Handling Results:', {
        duration: `${Math.round(duration)}ms`,
        total: results.length,
        successful: successCount,
        failed: failureCount,
        avgTimePerProspect: `${Math.round(duration / results.length)}ms`
      });

      // Should complete in reasonable time even with failures
      expect(duration).toBeLessThan(20000); // 20 seconds max
      expect(results).toHaveLength(prospects.length);
      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0); // Should have some failures from invalid domains
    });
  });

  describe('Batch Size Optimization', () => {
    test('should demonstrate optimal batch size selection', async () => {
      const prospects = generateMockProspectDomains(30);
      const batchSizes = [1, 2, 5, 10, 15];
      const results = [];

      for (const batchSize of batchSizes) {
        const startTime = performance.now();
        
        await qualifyProspects(prospects, mockICP, {
          batchSize,
          delayBetweenBatches: 0
        });
        
        const duration = performance.now() - startTime;
        const throughput = (prospects.length / duration) * 1000 * 60;
        
        results.push({ batchSize, duration, throughput });
        console.log(`Batch size ${batchSize}: ${Math.round(throughput)} prospects/min`);
      }

      // Find the sweet spot (usually around 5-10 for most systems)
      const optimal = results.reduce((best, current) => 
        current.throughput > best.throughput ? current : best
      );

      console.log('Batch Size Analysis:', {
        tested: results,
        optimal: optimal
      });

      // Optimal should be better than sequential (batchSize = 1)
      const sequential = results.find(r => r.batchSize === 1)!;
      expect(optimal.throughput).toBeGreaterThan(sequential.throughput);
      expect(optimal.batchSize).toBeGreaterThan(1);
    });
  });
});

// Performance monitoring utilities for production use
export class PerformanceMonitor {
  private metrics = new Map<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  }>();

  startOperation(operationId: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordOperation(operationId, duration);
    };
  }

  recordOperation(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
    };

    existing.count++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    existing.minDuration = Math.min(existing.minDuration, duration);

    this.metrics.set(operation, existing);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics.entries());
  }

  reset() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();