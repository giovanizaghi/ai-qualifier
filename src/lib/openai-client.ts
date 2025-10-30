import OpenAI from 'openai';

import { cache, generateCacheKey, CACHE_CONFIG } from './cache';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model configuration
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_TEMPERATURE = 0.7;

// Rate limiting configuration
const RATE_LIMIT = {
  requests: new Map<string, number[]>(),
  maxRequestsPerMinute: 60,
  cleanupInterval: 60000, // 1 minute
};

/**
 * Check if we're within rate limits
 */
function checkRateLimit(clientId: string = 'default'): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Get existing requests for this client
  const requests = RATE_LIMIT.requests.get(clientId) || [];
  
  // Filter out requests older than 1 minute
  const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo);
  
  // Update the requests array
  RATE_LIMIT.requests.set(clientId, recentRequests);
  
  // Check if we're under the limit
  return recentRequests.length < RATE_LIMIT.maxRequestsPerMinute;
}

/**
 * Record a new request for rate limiting
 */
function recordRequest(clientId: string = 'default'): void {
  const now = Date.now();
  const requests = RATE_LIMIT.requests.get(clientId) || [];
  requests.push(now);
  RATE_LIMIT.requests.set(clientId, requests);
}

/**
 * Clean up old rate limit data periodically
 */
setInterval(() => {
  const oneMinuteAgo = Date.now() - 60000;
  for (const [clientId, requests] of RATE_LIMIT.requests.entries()) {
    const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo);
    if (recentRequests.length === 0) {
      RATE_LIMIT.requests.delete(clientId);
    } else {
      RATE_LIMIT.requests.set(clientId, recentRequests);
    }
  }
}, RATE_LIMIT.cleanupInterval);

/**
 * Generate cache key for OpenAI requests
 */
function generateOpenAICacheKey(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  temperature: number
): string {
  return generateCacheKey('openai', {
    system: systemPrompt,
    user: userPrompt,
    model,
    temperature
  });
}

/**
 * Helper function to call OpenAI with structured JSON output and caching
 */
export async function generateStructuredResponse<T>(
  systemPrompt: string,
  userPrompt: string,
  schema?: object,
  model: string = DEFAULT_MODEL,
  temperature: number = DEFAULT_TEMPERATURE,
  options: {
    useCache?: boolean;
    cacheKey?: string;
    clientId?: string;
    maxRetries?: number;
  } = {}
): Promise<T> {
  const {
    useCache = true,
    cacheKey,
    clientId = 'default',
    maxRetries = 2
  } = options;

  // Generate cache key
  const finalCacheKey = cacheKey || generateOpenAICacheKey(systemPrompt, userPrompt, model, temperature);

  // Try cache first if enabled
  if (useCache) {
    const cached = await cache.get<T>(finalCacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Check rate limits
  if (!checkRateLimit(clientId)) {
    throw new Error(`Rate limit exceeded for client ${clientId}. Max ${RATE_LIMIT.maxRequestsPerMinute} requests per minute.`);
  }

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Record the request for rate limiting
      recordRequest(clientId);

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        response_format: schema ? { type: 'json_object' } : undefined,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as T;

      // Cache the result if caching is enabled
      if (useCache) {
        await cache.set(finalCacheKey, result, CACHE_CONFIG.OPENAI_RESPONSE_TTL);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`OpenAI API attempt ${attempt + 1} failed:`, lastError.message);

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  console.error('All OpenAI API attempts failed:', lastError!);
  throw new Error(`Failed to generate AI response after ${maxRetries + 1} attempts: ${lastError!.message}`);
}

/**
 * Helper function to call OpenAI with text output and caching
 */
export async function generateTextResponse(
  systemPrompt: string,
  userPrompt: string,
  model: string = DEFAULT_MODEL,
  temperature: number = DEFAULT_TEMPERATURE,
  options: {
    useCache?: boolean;
    cacheKey?: string;
    clientId?: string;
    maxRetries?: number;
  } = {}
): Promise<string> {
  const {
    useCache = true,
    cacheKey,
    clientId = 'default',
    maxRetries = 2
  } = options;

  // Generate cache key
  const finalCacheKey = cacheKey || generateOpenAICacheKey(systemPrompt, userPrompt, model, temperature);

  // Try cache first if enabled
  if (useCache) {
    const cached = await cache.get<string>(finalCacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Check rate limits
  if (!checkRateLimit(clientId)) {
    throw new Error(`Rate limit exceeded for client ${clientId}. Max ${RATE_LIMIT.maxRequestsPerMinute} requests per minute.`);
  }

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Record the request for rate limiting
      recordRequest(clientId);

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Cache the result if caching is enabled
      if (useCache) {
        await cache.set(finalCacheKey, content, CACHE_CONFIG.OPENAI_RESPONSE_TTL);
      }

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`OpenAI API attempt ${attempt + 1} failed:`, lastError.message);

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  console.error('All OpenAI API attempts failed:', lastError!);
  throw new Error(`Failed to generate AI response after ${maxRetries + 1} attempts: ${lastError!.message}`);
}

/**
 * Validate OpenAI API key is configured
 */
export function validateOpenAIConfig(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(clientId: string = 'default'): {
  remainingRequests: number;
  resetTime: number;
} {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const requests = RATE_LIMIT.requests.get(clientId) || [];
  const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo);
  
  const remainingRequests = Math.max(0, RATE_LIMIT.maxRequestsPerMinute - recentRequests.length);
  const oldestRequest = recentRequests[0];
  const resetTime = oldestRequest ? oldestRequest + 60000 : now;
  
  return {
    remainingRequests,
    resetTime
  };
}

/**
 * Clear cache for OpenAI responses (useful for testing)
 */
export async function clearOpenAICache(): Promise<void> {
  // This would need to be implemented in the cache manager
  // For now, we'll clear the entire cache
  await cache.clear();
}
