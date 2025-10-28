/**
 * Unit tests for domain analyzer with enhanced error handling
 */

import { jest } from '@jest/globals';
import * as cheerio from 'cheerio';
import { generateStructuredResponse } from '../openai-client';
import {
  scrapeWebsite,
  analyzeCompanyWithAI,
  analyzeCompanyDomain,
  DomainErrorCategory,
  getDomainAnalysisHealth,
  resetCircuitBreaker,
  resetAllCircuitBreakers,
  isDomainAnalysisHealthy,
  circuitBreaker,
  type DomainAnalysisResult,
  type CompanyAnalysis,
} from '../domain-analyzer';

// Mock dependencies
jest.mock('../openai-client');
jest.mock('cheerio');

// Global fetch mock
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockGenerateStructuredResponse = generateStructuredResponse as jest.MockedFunction<typeof generateStructuredResponse>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
const mockCheerio = cheerio as jest.Mocked<typeof cheerio>;

describe('Domain Analyzer Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllCircuitBreakers();
    
    // Reset health metrics by accessing the module's internal state
    const health = getDomainAnalysisHealth();
    health.totalRequests = 0;
    health.successfulRequests = 0;
    health.failedRequests = 0;
    health.circuitBreakerTrips = 0;
  });

  describe('Error Categorization', () => {
    it('should categorize timeout errors correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout exceeded'));

      const result = await scrapeWebsite('timeout-test.com');
      
      expect(result.error).toBeDefined();
      expect(result.errorCategory).toBe(DomainErrorCategory.TIMEOUT);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should categorize network errors correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fetch failed - network error'));

      const result = await scrapeWebsite('network-fail.com');
      
      expect(result.error).toBeDefined();
      expect(result.errorCategory).toBe(DomainErrorCategory.NETWORK_ERROR);
      expect(result.fallbackUsed).toBe(true);
    });

    it('should categorize HTTP errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await scrapeWebsite('not-found.com');
      
      expect(result.error).toBeDefined();
      expect(result.errorCategory).toBe(DomainErrorCategory.DOMAIN_NOT_FOUND);
    });

    it('should categorize rate limiting errors correctly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('rate limit exceeded'));

      const result = await scrapeWebsite('rate-limited.com');
      
      expect(result.error).toBeDefined();
      expect(result.errorCategory).toBe(DomainErrorCategory.RATE_LIMITED);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should allow requests when circuit is closed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Test</title><p>Content</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Test'),
        attr: jest.fn(),
        each: jest.fn(),
      } as any);

      const result = await scrapeWebsite('working-domain.com');
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should open circuit breaker after multiple failures', async () => {
      const domain = 'failing-domain.com';
      
      // Mock multiple failures
      for (let i = 0; i < 5; i++) {
        mockFetch.mockRejectedValueOnce(new Error('network failure'));
        await scrapeWebsite(domain);
      }
      
      // Circuit should now be open
      expect(circuitBreaker.isOpen(domain)).toBe(true);
      
      // Next attempt should be blocked
      mockFetch.mockClear();
      const result = await scrapeWebsite(domain);
      
      expect(result.errorCategory).toBe(DomainErrorCategory.CIRCUIT_BREAKER);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should allow half-open state after timeout', async () => {
      const domain = 'recovery-test.com';
      
      // Mock failures to open circuit
      for (let i = 0; i < 5; i++) {
        mockFetch.mockRejectedValueOnce(new Error('network failure'));
        await scrapeWebsite(domain);
      }
      
      expect(circuitBreaker.isOpen(domain)).toBe(true);
      
      // Manually reset for testing (in production, time would pass)
      resetCircuitBreaker(domain);
      
      // Should allow attempts again
      expect(circuitBreaker.canAttempt(domain)).toBe(true);
    });

    it('should record success and close circuit', async () => {
      const domain = 'success-after-failure.com';
      
      // Fail a few times
      for (let i = 0; i < 3; i++) {
        mockFetch.mockRejectedValueOnce(new Error('temporary failure'));
        await scrapeWebsite(domain);
      }
      
      // Then succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Success</title><p>Working now</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Success'),
        attr: jest.fn(),
        each: jest.fn((selector: string, callback: (index: number, element: any) => void) => {
          if (selector === 'h1, h2, h3') {
            callback(0, { textContent: 'Success' });
          }
          if (selector === 'p, li') {
            callback(0, { textContent: 'Working now - this is a test paragraph' });
          }
        }),
      } as any);

      const result = await scrapeWebsite(domain);
      
      expect(result.error).toBeUndefined();
      expect(result.title).toBe('Success');
    });
  });

  describe('Fallback Data Sources', () => {
    it('should use fallback data when primary scraping fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Complete failure'));

      const result = await scrapeWebsite('fallback-test.com');
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.title).toBeDefined();
      expect(result.domain).toBe('fallback-test.com');
    });

    it('should generate company name from domain in fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await scrapeWebsite('my-awesome-company.com');
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.title).toBe('My Awesome Company');
    });

    it('should categorize domains in fallback analysis', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await scrapeWebsite('tech-startup.com');
      expect(result.fallbackUsed).toBe(true);
      
      const basicInfo = result.title;
      expect(basicInfo).toBe('Tech Startup');
    });
  });

  describe('AI Analysis Error Handling', () => {
    it('should handle AI analysis failures gracefully', async () => {
      const scrapedData: DomainAnalysisResult = {
        domain: 'test.com',
        title: 'Test Company',
        mainContent: ['Some content'],
        headings: ['Welcome'],
        timestamp: new Date(),
      };

      mockGenerateStructuredResponse.mockRejectedValueOnce(new Error('AI service unavailable'));

      const result = await analyzeCompanyWithAI(scrapedData);
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.companyName).toBe('Test Company');
      expect(result.confidence).toBeLessThan(50);
    });

    it('should use fallback analysis for incomplete AI results', async () => {
      const scrapedData: DomainAnalysisResult = {
        domain: 'incomplete.com',
        mainContent: ['Content'],
        headings: [],
        timestamp: new Date(),
      };

      // Mock incomplete AI response
      mockGenerateStructuredResponse.mockResolvedValueOnce({
        companyName: '', // Empty name should trigger fallback
        industry: 'Tech',
        description: '',
        targetMarket: 'Unknown',
        keyOfferings: [],
      });

      const result = await analyzeCompanyWithAI(scrapedData);
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.companyName).toBe('Incomplete');
    });

    it('should handle fallback data in AI analysis', async () => {
      const fallbackData: DomainAnalysisResult = {
        domain: 'fallback-ai-test.com',
        title: 'Fallback AI Test',
        mainContent: [],
        headings: [],
        fallbackUsed: true,
        error: 'Scraping failed',
        timestamp: new Date(),
      };

      const result = await analyzeCompanyWithAI(fallbackData);
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.companyName).toBe('Fallback AI Test');
      expect(result.confidence).toBeLessThan(50);
    });
  });

  describe('Health Monitoring', () => {
    it('should track health metrics correctly', async () => {
      // Mock some successful requests
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Test</title><p>Content here for testing</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValue({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Test'),
        attr: jest.fn(),
        each: jest.fn((selector: string, callback: (index: number, element: any) => void) => {
          if (selector === 'p, li') {
            callback(0, { textContent: 'Content here for testing - this is enough content' });
          }
        }),
      } as any);

      await scrapeWebsite('health-test-1.com');
      await scrapeWebsite('health-test-2.com');

      const health = getDomainAnalysisHealth();
      expect(health.totalRequests).toBeGreaterThan(0);
      expect(health.successfulRequests).toBeGreaterThan(0);
    });

    it('should detect unhealthy state', async () => {
      // Mock multiple failures
      for (let i = 0; i < 10; i++) {
        mockFetch.mockRejectedValueOnce(new Error('failure'));
        await scrapeWebsite(`fail-${i}.com`);
      }

      const healthCheck = isDomainAnalysisHealthy();
      expect(healthCheck.healthy).toBe(false);
      expect(healthCheck.issues.length).toBeGreaterThan(0);
    });

    it('should reset circuit breakers on demand', () => {
      // Force some circuit breaker state
      circuitBreaker.recordFailure('test-reset.com');
      
      const resetResult = resetCircuitBreaker('test-reset.com');
      expect(resetResult).toBe(true);
      
      // Should be able to attempt again
      expect(circuitBreaker.canAttempt('test-reset.com')).toBe(true);
    });
  });

  describe('Full Domain Analysis Integration', () => {
    it('should complete full analysis with successful scraping and AI', async () => {
      // Mock successful scraping
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Stripe</title><meta name="description" content="Payment processing"><p>Payment solutions for businesses</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockImplementation((selector) => {
          if (!selector) return 'Stripe';
          return 'Stripe';
        }),
        attr: jest.fn().mockImplementation((attr) => {
          if (attr === 'content') return 'Payment processing';
          return undefined;
        }),
        each: jest.fn((selector: string, callback: (index: number, element: any) => void) => {
          if (selector === 'p, li') {
            callback(0, { textContent: 'Payment solutions for businesses everywhere' });
          }
        }),
      } as any);

      // Mock successful AI analysis
      mockGenerateStructuredResponse.mockResolvedValueOnce({
        companyName: 'Stripe',
        industry: 'FinTech',
        description: 'Payment processing platform for businesses',
        targetMarket: 'Businesses of all sizes',
        keyOfferings: ['Payment processing', 'APIs'],
        confidence: 90,
      });

      const result = await analyzeCompanyDomain('stripe.com');
      
      expect(result.scrapedData.error).toBeUndefined();
      expect(result.scrapedData.fallbackUsed).toBeFalsy();
      expect(result.aiAnalysis.companyName).toBe('Stripe');
      expect(result.aiAnalysis.fallbackUsed).toBeFalsy();
      expect(result.aiAnalysis.confidence).toBeGreaterThan(80);
    });

    it('should complete analysis with fallbacks when everything fails', async () => {
      mockFetch.mockRejectedValue(new Error('Complete network failure'));
      mockGenerateStructuredResponse.mockRejectedValue(new Error('AI service down'));

      const result = await analyzeCompanyDomain('disaster-test.com');
      
      expect(result.scrapedData.fallbackUsed).toBe(true);
      expect(result.aiAnalysis.fallbackUsed).toBe(true);
      expect(result.aiAnalysis.companyName).toBe('Disaster Test');
    });

    it('should handle mixed success/failure scenarios', async () => {
      // Scraping succeeds but AI fails
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Mixed Test</title><p>Some content for mixed testing scenario</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Mixed Test'),
        attr: jest.fn(),
        each: jest.fn((selector: string, callback: (index: number, element: any) => void) => {
          if (selector === 'p, li') {
            callback(0, { textContent: 'Some content for mixed testing scenario here' });
          }
        }),
      } as any);

      mockGenerateStructuredResponse.mockRejectedValueOnce(new Error('AI temporary failure'));

      const result = await analyzeCompanyDomain('mixed-test.com');
      
      expect(result.scrapedData.error).toBeUndefined();
      expect(result.scrapedData.fallbackUsed).toBeFalsy();
      expect(result.aiAnalysis.fallbackUsed).toBe(true);
      expect(result.aiAnalysis.companyName).toBe('Mixed Test');
    });
  });

  describe('Retry Logic and Resilience', () => {
    it('should retry failed requests up to maximum attempts', async () => {
      const domain = 'retry-test.com';
      
      // First attempt fails
      mockFetch.mockRejectedValueOnce(new Error('Temporary failure'));
      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Success</title><p>Finally worked on retry</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Success'),
        attr: jest.fn(),
        each: jest.fn((selector: string, callback: (index: number, element: any) => void) => {
          if (selector === 'p, li') {
            callback(0, { textContent: 'Finally worked on retry - sufficient content' });
          }
        }),
      } as any);

      const result = await scrapeWebsite(domain);
      
      expect(result.error).toBeUndefined();
      expect(result.title).toBe('Success');
      expect(result.scrapeAttempts).toBe(2);
    });

    it('should handle server errors with retries', async () => {
      // Mock server error that should trigger retry
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Recovered</title><p>Server recovered successfully</p></html>'),
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Recovered'),
        attr: jest.fn(),
        each: jest.fn((selector: string, callback: (index: number, element: any) => void) => {
          if (selector === 'p, li') {
            callback(0, { textContent: 'Server recovered successfully after retry' });
          }
        }),
      } as any);

      const result = await scrapeWebsite('server-error-test.com');
      
      expect(result.error).toBeUndefined();
      expect(result.title).toBe('Recovered');
    });

    it('should not retry client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await scrapeWebsite('not-found-test.com');
      
      expect(result.errorCategory).toBe(DomainErrorCategory.DOMAIN_NOT_FOUND);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry for 404
    });
  });

  describe('Content Validation', () => {
    it('should handle insufficient content gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><title>Empty</title></html>'), // Very minimal content
      } as Response);

      mockCheerio.load.mockReturnValueOnce({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Empty'),
        attr: jest.fn(),
        each: jest.fn(), // No content found
      } as any);

      const result = await scrapeWebsite('minimal-content.com');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('No meaningful content found');
    });

    it('should validate HTML content length', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''), // Empty response
      } as Response);

      const result = await scrapeWebsite('empty-response.com');
      
      expect(result.error).toBeDefined();
      expect(result.errorCategory).toBe(DomainErrorCategory.INVALID_CONTENT);
    });
  });
});