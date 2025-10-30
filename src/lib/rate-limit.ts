/**
 * Rate limiting middleware for API endpoints
 * Implements token bucket algorithm with Redis support for distributed systems
 */

import { NextRequest, NextResponse } from 'next/server';

import { cache } from './cache';

// Rate limiting configuration
export const RATE_LIMITS = {
  // General API endpoints
  api: {
    requests: 100,
    window: 60 * 1000, // 1 minute
  },
  // Qualification endpoints (more restrictive)
  qualify: {
    requests: 10,
    window: 60 * 1000, // 1 minute
  },
  // Authentication endpoints
  auth: {
    requests: 5,
    window: 60 * 1000, // 1 minute
  },
  // Company analysis (heavy operations)
  analysis: {
    requests: 20,
    window: 60 * 1000, // 1 minute
  },
  // Default fallback
  default: {
    requests: 50,
    window: 60 * 1000, // 1 minute
  },
} as const;

export interface RateLimit {
  requests: number;
  window: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitResult {
  success: boolean;
  info: RateLimitInfo;
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get user ID from session/auth if available
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT or session if available
    // This would need to be implemented based on your auth system
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Get rate limit configuration based on endpoint
 */
function getRateLimitConfig(pathname: string): RateLimit {
  if (pathname.includes('/api/qualify')) {
    return RATE_LIMITS.qualify;
  }
  if (pathname.includes('/api/auth')) {
    return RATE_LIMITS.auth;
  }
  if (pathname.includes('/api/companies') && pathname.includes('/analyze')) {
    return RATE_LIMITS.analysis;
  }
  if (pathname.startsWith('/api/')) {
    return RATE_LIMITS.api;
  }
  
  return RATE_LIMITS.default;
}

/**
 * Token bucket rate limiter implementation
 */
class TokenBucketRateLimiter {
  private buckets = new Map<string, {
    tokens: number;
    lastRefill: number;
    capacity: number;
    refillRate: number;
  }>();

  /**
   * Check if request is allowed and consume a token
   */
  async checkLimit(
    clientId: string,
    rateLimit: RateLimit
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${clientId}`;
    const now = Date.now();
    
    // Try to get from cache first
    const cached = await cache.get<{
      tokens: number;
      lastRefill: number;
    }>(key);

    const bucket = cached || {
      tokens: rateLimit.requests,
      lastRefill: now,
    };

    // Calculate tokens to add based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(
      (timePassed / rateLimit.window) * rateLimit.requests
    );

    // Refill bucket
    bucket.tokens = Math.min(
      rateLimit.requests,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;

    // Check if we have tokens available
    const hasTokens = bucket.tokens > 0;
    
    if (hasTokens) {
      bucket.tokens--;
    }

    // Save updated bucket state
    await cache.set(key, bucket, rateLimit.window);

    // Calculate reset time
    const resetTime = bucket.lastRefill + rateLimit.window;
    const retryAfter = hasTokens ? undefined : Math.ceil((resetTime - now) / 1000);

    return {
      success: hasTokens,
      info: {
        limit: rateLimit.requests,
        remaining: bucket.tokens,
        reset: resetTime,
        retryAfter,
      },
    };
  }

  /**
   * Get current rate limit status without consuming a token
   */
  async getStatus(
    clientId: string,
    rateLimit: RateLimit
  ): Promise<RateLimitInfo> {
    const key = `rate_limit:${clientId}`;
    const now = Date.now();
    
    const cached = await cache.get<{
      tokens: number;
      lastRefill: number;
    }>(key);

    if (!cached) {
      return {
        limit: rateLimit.requests,
        remaining: rateLimit.requests,
        reset: now + rateLimit.window,
      };
    }

    // Calculate current tokens
    const timePassed = now - cached.lastRefill;
    const tokensToAdd = Math.floor(
      (timePassed / rateLimit.window) * rateLimit.requests
    );
    const currentTokens = Math.min(
      rateLimit.requests,
      cached.tokens + tokensToAdd
    );

    const resetTime = cached.lastRefill + rateLimit.window;

    return {
      limit: rateLimit.requests,
      remaining: currentTokens,
      reset: resetTime,
    };
  }

  /**
   * Reset rate limit for a client (useful for testing or admin actions)
   */
  async resetLimit(clientId: string): Promise<void> {
    const key = `rate_limit:${clientId}`;
    await cache.delete(key);
  }
}

// Create singleton instance
const rateLimiter = new TokenBucketRateLimiter();

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(
  customConfig?: Partial<RateLimit>
) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const clientId = getClientId(request);
    const baseConfig = getRateLimitConfig(request.nextUrl.pathname);
    const config = { ...baseConfig, ...customConfig };

    try {
      const result = await rateLimiter.checkLimit(clientId, config);

      // Add rate limit headers to response
      const response = result.success
        ? await next()
        : NextResponse.json(
            {
              error: 'Too Many Requests',
              message: `Rate limit exceeded. Try again in ${result.info.retryAfter} seconds.`,
              retryAfter: result.info.retryAfter,
            },
            { status: 429 }
          );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', result.info.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.info.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.info.reset.toString());
      
      if (result.info.retryAfter) {
        response.headers.set('Retry-After', result.info.retryAfter.toString());
      }

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed
      return next();
    }
  };
}

/**
 * Wrapper for API route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config?: Partial<RateLimit>
) {
  return async function rateLimitedHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    const clientId = getClientId(request);
    const baseConfig = getRateLimitConfig(request.nextUrl.pathname);
    const finalConfig = { ...baseConfig, ...config };

    try {
      const result = await rateLimiter.checkLimit(clientId, finalConfig);

      if (!result.success) {
        const response = NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${result.info.retryAfter} seconds.`,
            retryAfter: result.info.retryAfter,
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.info.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.info.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.info.reset.toString());
        response.headers.set('Retry-After', result.info.retryAfter!.toString());

        return response;
      }

      // Execute the original handler
      const response = await handler(request, ...args);

      // Add rate limit headers to successful response
      response.headers.set('X-RateLimit-Limit', result.info.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.info.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.info.reset.toString());

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed
      return handler(request, ...args);
    }
  };
}

/**
 * Get rate limit status for a client
 */
export async function getRateLimitStatus(
  request: NextRequest,
  config?: Partial<RateLimit>
): Promise<RateLimitInfo> {
  const clientId = getClientId(request);
  const baseConfig = getRateLimitConfig(request.nextUrl.pathname);
  const finalConfig = { ...baseConfig, ...config };

  return rateLimiter.getStatus(clientId, finalConfig);
}

/**
 * Reset rate limit for a client (admin function)
 */
export async function resetRateLimit(
  clientId: string
): Promise<void> {
  return rateLimiter.resetLimit(clientId);
}

/**
 * Rate limiting statistics and monitoring
 */
export class RateLimitMonitor {
  private stats = new Map<string, {
    requests: number;
    blocked: number;
    lastReset: number;
  }>();

  recordRequest(clientId: string, blocked: boolean) {
    const key = `client:${clientId}`;
    const existing = this.stats.get(key) || {
      requests: 0,
      blocked: 0,
      lastReset: Date.now(),
    };

    existing.requests++;
    if (blocked) {existing.blocked++;}

    this.stats.set(key, existing);
  }

  getStats() {
    const totalStats = {
      totalRequests: 0,
      totalBlocked: 0,
      blockRate: 0,
      activeClients: this.stats.size,
    };

    for (const stat of this.stats.values()) {
      totalStats.totalRequests += stat.requests;
      totalStats.totalBlocked += stat.blocked;
    }

    totalStats.blockRate = totalStats.totalRequests > 0
      ? (totalStats.totalBlocked / totalStats.totalRequests) * 100
      : 0;

    return {
      ...totalStats,
      clientStats: Object.fromEntries(this.stats.entries()),
    };
  }

  reset() {
    this.stats.clear();
  }
}

export const rateLimitMonitor = new RateLimitMonitor();

/**
 * Middleware for Express-style applications (if needed)
 */
export function expressRateLimit(config?: Partial<RateLimit>) {
  return (req: any, res: any, next: any) => {
    // This would be implemented for Express apps if needed
    // For now, focusing on Next.js middleware
    next();
  };
}

export { rateLimiter };