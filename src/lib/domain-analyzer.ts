import * as cheerio from 'cheerio';

import { generateStructuredResponse } from './openai-client';

export interface DomainAnalysisResult {
  domain: string;
  name?: string;
  title?: string;
  description?: string;
  industry?: string;
  mainContent: string[];
  headings: string[];
  metaDescription?: string;
  keywords?: string[];
  error?: string;
  scrapeAttempts?: number;
  fallbackUsed?: boolean;
  errorCategory?: DomainErrorCategory;
  timestamp?: Date;
}

export enum DomainErrorCategory {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  HTTP_ERROR = 'HTTP_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  DOMAIN_NOT_FOUND = 'DOMAIN_NOT_FOUND',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  INVALID_CONTENT = 'INVALID_CONTENT'
}

export interface CompanyAnalysis {
  companyName: string;
  industry: string;
  description: string;
  targetMarket: string;
  keyOfferings: string[];
  companySize?: string;
  confidence?: number;
  fallbackUsed?: boolean;
}

// Circuit breaker configuration
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttemptTime: number;
}

// Global circuit breaker state for domain scraping
const circuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: 5, // Open circuit after 5 failures
  resetTimeout: 60000, // Try again after 1 minute
  monitoringPeriod: 300000, // 5 minute monitoring window
};

const circuitBreakerState: Map<string, CircuitBreakerState> = new Map();

// Fallback data sources configuration
interface FallbackDataSource {
  name: string;
  enabled: boolean;
  priority: number;
  getData: (domain: string) => Promise<Partial<DomainAnalysisResult> | null>;
}

// Health check metrics
interface DomainHealthMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastHealthCheck: Date;
  circuitBreakerTrips: number;
}

const healthMetrics: DomainHealthMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  lastHealthCheck: new Date(),
  circuitBreakerTrips: 0,
};

/**
 * Categorize errors for better handling
 */
function categorizeError(error: Error, response?: Response): DomainErrorCategory {
  // Check if error already has a category set
  if ((error as any).errorCategory) {
    return (error as any).errorCategory;
  }
  
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
    return DomainErrorCategory.TIMEOUT;
  }
  
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('enotfound')) {
    return DomainErrorCategory.NETWORK_ERROR;
  }
  
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return DomainErrorCategory.RATE_LIMITED;
  }
  
  if (response) {
    if (response.status === 404) {
      return DomainErrorCategory.DOMAIN_NOT_FOUND;
    }
    if (response.status >= 400 && response.status < 500) {
      return DomainErrorCategory.HTTP_ERROR;
    }
    if (response.status >= 500) {
      return DomainErrorCategory.HTTP_ERROR;
    }
  }
  
  if (errorMessage.includes('parse') || errorMessage.includes('invalid')) {
    return DomainErrorCategory.PARSING_ERROR;
  }
  
  return DomainErrorCategory.NETWORK_ERROR; // Default fallback
}

/**
 * Circuit breaker implementation for domain scraping
 */
class DomainCircuitBreaker {
  private getCircuitState(domain: string): CircuitBreakerState {
    if (!circuitBreakerState.has(domain)) {
      circuitBreakerState.set(domain, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
        nextAttemptTime: 0,
      });
    }
    return circuitBreakerState.get(domain)!;
  }

  canAttempt(domain: string): boolean {
    const state = this.getCircuitState(domain);
    const now = Date.now();

    switch (state.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        if (now >= state.nextAttemptTime) {
          state.state = 'HALF_OPEN';
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
      default:
        return true;
    }
  }

  recordSuccess(domain: string): void {
    const state = this.getCircuitState(domain);
    state.failures = 0;
    state.state = 'CLOSED';
    state.lastFailureTime = 0;
    state.nextAttemptTime = 0;
  }

  recordFailure(domain: string): void {
    const state = this.getCircuitState(domain);
    const now = Date.now();
    
    state.failures++;
    state.lastFailureTime = now;
    
    if (state.failures >= circuitBreakerConfig.failureThreshold) {
      state.state = 'OPEN';
      state.nextAttemptTime = now + circuitBreakerConfig.resetTimeout;
      healthMetrics.circuitBreakerTrips++;
      console.warn(`Circuit breaker opened for domain: ${domain} after ${state.failures} failures`);
    }
  }

  isOpen(domain: string): boolean {
    const state = this.getCircuitState(domain);
    return state.state === 'OPEN' && Date.now() < state.nextAttemptTime;
  }

  getState(domain: string): CircuitBreakerState {
    return this.getCircuitState(domain);
  }
}

const circuitBreaker = new DomainCircuitBreaker();

/**
 * Fallback data providers
 */
const fallbackDataSources: FallbackDataSource[] = [
  {
    name: 'domain-info-fallback',
    enabled: true,
    priority: 1,
    getData: async (domain: string): Promise<Partial<DomainAnalysisResult> | null> => {
      try {
        // Try to get basic domain info from public APIs or cached data
        // This is a placeholder - in production you might use:
        // - Domain WHOIS data
        // - Cached results from previous successful scrapes
        // - Public domain databases
        
        console.log(`Attempting fallback data retrieval for ${domain}`);
        
        // Basic fallback data based on domain analysis
        const basicInfo = analyzeDomainName(domain);
        
        return {
          domain,
          title: basicInfo.suggestedName,
          description: `${basicInfo.suggestedName} - Information not available`,
          mainContent: [`Unable to retrieve detailed information for ${domain}`],
          headings: [basicInfo.suggestedName],
          fallbackUsed: true,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error(`Fallback data source failed for ${domain}:`, error);
        return null;
      }
    },
  },
];

/**
 * Analyze domain name to extract basic information
 */
function analyzeDomainName(domain: string): { suggestedName: string; category: string } {
  const normalizedDomain = normalizeDomain(domain);
  const parts = normalizedDomain.split('.');
  const rootDomain = parts[0];
  
  // Convert domain to potential company name
  const suggestedName = rootDomain
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Basic categorization based on domain patterns
  let category = 'Unknown';
  if (rootDomain.includes('shop') || rootDomain.includes('store')) {
    category = 'E-commerce';
  } else if (rootDomain.includes('tech') || rootDomain.includes('dev')) {
    category = 'Technology';
  } else if (rootDomain.includes('finance') || rootDomain.includes('bank')) {
    category = 'Finance';
  }
  
  return { suggestedName, category };
}

/**
 * Try fallback data sources when primary scraping fails
 */
async function getFallbackData(domain: string, originalErrorCategory?: DomainErrorCategory): Promise<DomainAnalysisResult> {
  console.log(`Attempting fallback data retrieval for ${domain}`);
  
  for (const source of fallbackDataSources.filter(s => s.enabled).sort((a, b) => a.priority - b.priority)) {
    try {
      const fallbackData = await source.getData(domain);
      if (fallbackData) {
        console.log(`Fallback data retrieved from ${source.name} for ${domain}`);
        return {
          domain: normalizeDomain(domain),
          mainContent: [],
          headings: [],
          error: 'Primary scraping failed - using fallback data',
          fallbackUsed: true,
          timestamp: new Date(),
          errorCategory: originalErrorCategory || DomainErrorCategory.NETWORK_ERROR,
          ...fallbackData,
        };
      }
    } catch (error) {
      console.error(`Fallback source ${source.name} failed for ${domain}:`, error);
    }
  }
  
  // Last resort fallback
  const basicInfo = analyzeDomainName(domain);
  return {
    domain: normalizeDomain(domain),
    title: basicInfo.suggestedName,
    mainContent: [],
    headings: [],
    error: 'All data sources failed - using basic domain analysis',
    fallbackUsed: true,
    errorCategory: DomainErrorCategory.NETWORK_ERROR,
    timestamp: new Date(),
  };
}

/**
 * Normalize domain to ensure it has proper format
 */
function normalizeDomain(domain: string): string {
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '');
  // Remove trailing slash
  domain = domain.replace(/\/$/, '');
  // Remove www. if present for consistency
  domain = domain.replace(/^www\./, '');
  return domain;
}

/**
 * Get full URL from domain
 */
function getUrlFromDomain(domain: string): string {
  const normalized = normalizeDomain(domain);
  return `https://${normalized}`;
}

/**
 * Scrape website content from a domain with circuit breaker and enhanced error handling
 */
export async function scrapeWebsite(domain: string): Promise<DomainAnalysisResult> {
  const startTime = Date.now();
  const normalizedDomain = normalizeDomain(domain);
  
  // Update health metrics
  healthMetrics.totalRequests++;
  
  // Check circuit breaker
  if (circuitBreaker.isOpen(normalizedDomain)) {
    healthMetrics.failedRequests++;
    console.warn(`Circuit breaker is open for domain: ${normalizedDomain}`);
    return await getFallbackData(normalizedDomain, DomainErrorCategory.CIRCUIT_BREAKER);
  }

  if (!circuitBreaker.canAttempt(normalizedDomain)) {
    return {
      domain: normalizedDomain,
      mainContent: [],
      headings: [],
      error: 'Circuit breaker active - too many recent failures',
      errorCategory: DomainErrorCategory.CIRCUIT_BREAKER,
      fallbackUsed: true,
      timestamp: new Date(),
    };
  }

  const url = getUrlFromDomain(normalizedDomain);
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ICP-Qualifier/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        const errorCategory = categorizeError(error, response);
        
        // Record failure and try fallback for certain error types
        if (response.status >= 500 || response.status === 429) {
          circuitBreaker.recordFailure(normalizedDomain);
          
          if (attempts === maxAttempts) {
            healthMetrics.failedRequests++;
            return await getFallbackData(normalizedDomain, errorCategory);
          }
          
          // Wait before retry for server errors
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
        
        // Client errors (4xx) - don't retry but categorize
        healthMetrics.failedRequests++;
        return {
          domain: normalizedDomain,
          mainContent: [],
          headings: [],
          error: error.message,
          errorCategory,
          scrapeAttempts: attempts,
          timestamp: new Date(),
        };
      }

      const html = await response.text();
      
      // Validate content
      if (!html || html.length < 100) {
        const error = new Error('Invalid or insufficient content received');
        const errorCategory = categorizeError(error);
        throw Object.assign(error, { errorCategory: DomainErrorCategory.INVALID_CONTENT });
      }
      
      const $ = cheerio.load(html);

      // Remove script and style elements
      $('script, style, nav, footer, header').remove();

      // Extract title
      const title = $('title').text().trim() || undefined;

      // Extract meta description
      const metaDescription = 
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        undefined;

      // Extract keywords
      const keywordsContent = $('meta[name="keywords"]').attr('content');
      const keywords = keywordsContent
        ? keywordsContent.split(',').map((k) => k.trim())
        : undefined;

      // Extract all headings
      const headings: string[] = [];
      $('h1, h2, h3').each((_, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length < 200) {
          headings.push(text);
        }
      });

      // Extract main content from paragraphs
      const mainContent: string[] = [];
      $('p, li').each((_, elem) => {
        const text = $(elem).text().trim();
        if (text && text.length > 20 && text.length < 500) {
          mainContent.push(text);
        }
      });

      // Validate extracted content
      if (headings.length === 0 && mainContent.length === 0) {
        const error = new Error('No meaningful content found on the page');
        throw Object.assign(error, { errorCategory: DomainErrorCategory.INVALID_CONTENT });
      }

      // Record success
      circuitBreaker.recordSuccess(normalizedDomain);
      healthMetrics.successfulRequests++;
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      healthMetrics.averageResponseTime = 
        (healthMetrics.averageResponseTime * (healthMetrics.successfulRequests - 1) + responseTime) / 
        healthMetrics.successfulRequests;

      return {
        domain: normalizedDomain,
        title,
        metaDescription,
        keywords,
        headings: headings.slice(0, 20), // Limit to first 20 headings
        mainContent: mainContent.slice(0, 30), // Limit to first 30 paragraphs
        scrapeAttempts: attempts,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error(`Error scraping ${normalizedDomain} (attempt ${attempts}):`, error);
      
      const errorCategory = categorizeError(error as Error);
      
      if (attempts === maxAttempts) {
        // Record failure after all attempts exhausted
        circuitBreaker.recordFailure(normalizedDomain);
        healthMetrics.failedRequests++;
        
        // Try fallback data
        if (errorCategory === DomainErrorCategory.NETWORK_ERROR || 
            errorCategory === DomainErrorCategory.TIMEOUT) {
          const fallbackResult = await getFallbackData(normalizedDomain, errorCategory);
          return fallbackResult;
        }
        
        return {
          domain: normalizedDomain,
          mainContent: [],
          headings: [],
          error: error instanceof Error ? error.message : 'Failed to scrape website',
          errorCategory,
          scrapeAttempts: attempts,
          timestamp: new Date(),
        };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500 * attempts));
    }
  }

  // This should never be reached, but include as fallback
  return await getFallbackData(normalizedDomain, DomainErrorCategory.NETWORK_ERROR);
}

/**
 * Generate fallback company analysis when AI fails
 */
function generateFallbackCompanyAnalysis(scrapedData: DomainAnalysisResult): CompanyAnalysis {
  const basicInfo = analyzeDomainName(scrapedData.domain);
  
  const industry = basicInfo.category;
  let companyName = basicInfo.suggestedName;
  let description = `${companyName} - Business analysis not available`;
  const targetMarket = 'Unknown';
  let keyOfferings: string[] = [];
  
  // Try to extract some info from available data
  if (scrapedData.title) {
    companyName = scrapedData.title.split(' - ')[0] || scrapedData.title.split('|')[0] || companyName;
  }
  
  if (scrapedData.metaDescription) {
    description = scrapedData.metaDescription.length > 200 
      ? `${scrapedData.metaDescription.substring(0, 200)  }...`
      : scrapedData.metaDescription;
  }
  
  // Extract potential offerings from headings
  if (scrapedData.headings && scrapedData.headings.length > 0) {
    keyOfferings = scrapedData.headings
      .filter(h => h.length > 5 && h.length < 100)
      .slice(0, 3);
  }
  
  return {
    companyName: companyName.trim(),
    industry,
    description,
    targetMarket,
    keyOfferings,
    confidence: 30, // Low confidence for fallback
    fallbackUsed: true,
  };
}

/**
 * Analyze company using AI based on scraped data with enhanced error handling
 */
export async function analyzeCompanyWithAI(
  scrapedData: DomainAnalysisResult
): Promise<CompanyAnalysis> {
  // If scraping failed but we have fallback data, try to analyze it
  if (scrapedData.error && !scrapedData.fallbackUsed) {
    throw new Error(`Cannot analyze company: ${scrapedData.error}`);
  }
  
  // If we only have fallback data with minimal content, use fallback analysis
  if (scrapedData.fallbackUsed || 
      (scrapedData.mainContent.length === 0 && scrapedData.headings.length === 0)) {
    console.log(`Using fallback analysis for ${scrapedData.domain}`);
    return generateFallbackCompanyAnalysis(scrapedData);
  }

  const systemPrompt = `You are an expert business analyst. Analyze the provided website data and extract key information about the company.
Return a JSON object with the following structure:
{
  "companyName": "Company name",
  "industry": "Primary industry/vertical",
  "description": "2-3 sentence company description",
  "targetMarket": "Who they serve (e.g., 'Enterprise B2B', 'SMB SaaS', 'E-commerce brands')",
  "keyOfferings": ["main product/service 1", "main product/service 2"],
  "companySize": "estimated size if mentioned (e.g., 'Startup', 'Mid-market', 'Enterprise') or null",
  "confidence": 85
}`;

  const userPrompt = `Analyze this company website data:

Domain: ${scrapedData.domain}
Title: ${scrapedData.title || 'N/A'}
Meta Description: ${scrapedData.metaDescription || 'N/A'}
Keywords: ${scrapedData.keywords?.join(', ') || 'N/A'}

Headings:
${scrapedData.headings.slice(0, 10).join('\n')}

Content Excerpts:
${scrapedData.mainContent.slice(0, 15).join('\n\n')}

Provide a comprehensive analysis with confidence score (0-100).`;

  try {
    const analysis = await generateStructuredResponse<CompanyAnalysis>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.3 // Lower temperature for more consistent analysis
    );

    // Validate the analysis result
    if (!analysis.companyName || !analysis.industry || !analysis.description) {
      console.warn(`Incomplete AI analysis for ${scrapedData.domain}, using fallback`);
      return generateFallbackCompanyAnalysis(scrapedData);
    }

    // Ensure confidence is set
    if (!analysis.confidence) {
      analysis.confidence = 75; // Default confidence
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing company with AI, using fallback:', error);
    return generateFallbackCompanyAnalysis(scrapedData);
  }
}

/**
 * Health check functions for domain analysis system
 */
export function getDomainAnalysisHealth(): DomainHealthMetrics & {
  circuitBreakerStates: { [domain: string]: CircuitBreakerState };
} {
  const states: { [domain: string]: CircuitBreakerState } = {};
  for (const [domain, state] of circuitBreakerState.entries()) {
    states[domain] = { ...state };
  }
  
  return {
    ...healthMetrics,
    lastHealthCheck: new Date(),
    circuitBreakerStates: states,
  };
}

/**
 * Reset circuit breaker for a specific domain (for manual recovery)
 */
export function resetCircuitBreaker(domain: string): boolean {
  const normalizedDomain = normalizeDomain(domain);
  circuitBreakerState.delete(normalizedDomain);
  console.log(`Circuit breaker reset for domain: ${normalizedDomain}`);
  return true;
}

/**
 * Reset all circuit breakers (for system recovery)
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakerState.clear();
  healthMetrics.circuitBreakerTrips = 0;
  console.log('All circuit breakers reset');
}

/**
 * Check if domain analysis system is healthy
 */
export function isDomainAnalysisHealthy(): {
  healthy: boolean;
  issues: string[];
  metrics: DomainHealthMetrics;
} {
  const issues: string[] = [];
  
  // Check success rate
  const successRate = healthMetrics.totalRequests > 0 
    ? (healthMetrics.successfulRequests / healthMetrics.totalRequests) * 100 
    : 100;
    
  if (successRate < 70) {
    issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
  }
  
  // Check circuit breaker trips
  if (healthMetrics.circuitBreakerTrips > 10) {
    issues.push(`High circuit breaker trips: ${healthMetrics.circuitBreakerTrips}`);
  }
  
  // Check average response time
  if (healthMetrics.averageResponseTime > 10000) {
    issues.push(`High average response time: ${healthMetrics.averageResponseTime}ms`);
  }
  
  // Check for stuck open circuit breakers
  const openCircuitBreakers = Array.from(circuitBreakerState.entries())
    .filter(([_, state]) => state.state === 'OPEN')
    .length;
    
  if (openCircuitBreakers > 5) {
    issues.push(`Many open circuit breakers: ${openCircuitBreakers}`);
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    metrics: { ...healthMetrics },
  };
}

/**
 * Enhanced full domain analysis with comprehensive error handling and fallbacks
 */
export async function analyzeCompanyDomain(domain: string): Promise<{
  scrapedData: DomainAnalysisResult;
  aiAnalysis: CompanyAnalysis;
}> {
  const startTime = Date.now();
  console.log(`Starting domain analysis for: ${domain}`);
  
  try {
    // Step 1: Scrape website with enhanced error handling
    const scrapedData = await scrapeWebsite(domain);
    
    // Step 2: Analyze with AI (this now handles fallbacks internally)
    const aiAnalysis = await analyzeCompanyWithAI(scrapedData);
    
    const duration = Date.now() - startTime;
    console.log(`Domain analysis completed for ${domain} in ${duration}ms`);
    
    return {
      scrapedData,
      aiAnalysis,
    };
    
  } catch (error) {
    console.error(`Domain analysis failed for ${domain}:`, error);
    
    // Last resort fallback - try to get basic fallback data
    try {
      const fallbackData = await getFallbackData(domain, DomainErrorCategory.NETWORK_ERROR);
      const fallbackAnalysis = generateFallbackCompanyAnalysis(fallbackData);
      
      return {
        scrapedData: fallbackData,
        aiAnalysis: fallbackAnalysis,
      };
    } catch (fallbackError) {
      console.error(`Even fallback failed for ${domain}:`, fallbackError);
      
      // Absolute last resort
      const basicInfo = analyzeDomainName(domain);
      const absoluteFallback: DomainAnalysisResult = {
        domain: normalizeDomain(domain),
        title: basicInfo.suggestedName,
        mainContent: [],
        headings: [],
        error: 'Complete analysis failure - using minimal fallback',
        errorCategory: DomainErrorCategory.NETWORK_ERROR,
        fallbackUsed: true,
        timestamp: new Date(),
      };
      
      return {
        scrapedData: absoluteFallback,
        aiAnalysis: generateFallbackCompanyAnalysis(absoluteFallback),
      };
    }
  }
}

// Export circuit breaker for testing
export { circuitBreaker };
