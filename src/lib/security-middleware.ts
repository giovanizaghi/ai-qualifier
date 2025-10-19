/**
 * Security middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, SecurityAuditor, CSRFProtection, type RateLimitConfig } from './security';
import { log } from './logger';

// Default rate limiting configurations
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.',
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'API rate limit exceeded, please slow down.',
  },
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many upload attempts, please try again later.',
  },
};

export interface SecurityMiddlewareOptions {
  rateLimit?: RateLimitConfig | keyof typeof DEFAULT_RATE_LIMITS;
  enableCSRF?: boolean;
  enableSecurityAudit?: boolean;
  requiredHeaders?: string[];
  allowedOrigins?: string[];
  maxBodySize?: number;
}

export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: SecurityMiddlewareOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    try {
      // 1. CORS handling
      if (options.allowedOrigins && req.method === 'OPTIONS') {
        return handleCORS(req, options.allowedOrigins);
      }

      // 2. Rate limiting
      if (options.rateLimit) {
        const rateLimitConfig = typeof options.rateLimit === 'string' 
          ? DEFAULT_RATE_LIMITS[options.rateLimit]
          : options.rateLimit;

        if (rateLimitConfig) {
          const rateLimitKey = `${clientIP}:${req.nextUrl.pathname}`;
          
          if (RateLimiter.shouldLimit(rateLimitKey, rateLimitConfig)) {
            const userId = getUserId(req);
            log.warn('Rate limit exceeded', {
              ...(userId && { userId }),
              action: 'rate_limit',
              metadata: {
                ip: clientIP,
                path: req.nextUrl.pathname,
                userAgent,
              },
            });

            return NextResponse.json(
              { error: rateLimitConfig.message || 'Rate limit exceeded' },
              { 
                status: 429,
                headers: {
                  'Retry-After': String(Math.ceil(rateLimitConfig.windowMs / 1000)),
                  'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
                  'X-RateLimit-Remaining': String(
                    RateLimiter.getRemainingRequests(rateLimitKey, rateLimitConfig)
                  ),
                },
              }
            );
          }
        }
      }

      // 3. Body size check
      if (options.maxBodySize && req.method !== 'GET' && req.method !== 'HEAD') {
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > options.maxBodySize) {
          log.warn('Request body too large', {
            action: 'body_size_exceeded',
            metadata: {
              ip: clientIP,
              size: contentLength,
              limit: options.maxBodySize,
            },
          });

          return NextResponse.json(
            { error: 'Request body too large' },
            { status: 413 }
          );
        }
      }

      // 4. Required headers check
      if (options.requiredHeaders) {
        for (const header of options.requiredHeaders) {
          if (!req.headers.get(header)) {
            return NextResponse.json(
              { error: `Missing required header: ${header}` },
              { status: 400 }
            );
          }
        }
      }

      // 5. CSRF protection
      if (options.enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfHeader = req.headers.get('x-csrf-token');
        const csrfCookie = req.cookies.get('csrf-token')?.value ?? null;

        if (!CSRFProtection.validateToken(csrfHeader, csrfCookie)) {
          log.warn('CSRF token validation failed', {
            action: 'csrf_validation_failed',
            metadata: {
              ip: clientIP,
              path: req.nextUrl.pathname,
            },
          });

          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      // 6. Security audit
      if (options.enableSecurityAudit) {
        const body = req.method !== 'GET' ? await req.clone().text() : undefined;
        
        const auditResult = SecurityAuditor.auditRequest({
          url: req.nextUrl.toString(),
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          ...(body && { body }),
          ip: clientIP,
        });

        if (auditResult.blocked) {
          log.error('Security audit blocked request', undefined, {
            action: 'security_audit_blocked',
            metadata: {
              ip: clientIP,
              path: req.nextUrl.pathname,
              risks: auditResult.risks,
              score: auditResult.score,
            },
          });

          return NextResponse.json(
            { error: 'Request blocked for security reasons' },
            { status: 403 }
          );
        }

        if (auditResult.risks.length > 0) {
          log.warn('Security risks detected', {
            action: 'security_risks_detected',
            metadata: {
              ip: clientIP,
              path: req.nextUrl.pathname,
              risks: auditResult.risks,
              score: auditResult.score,
            },
          });
        }
      }

      // 7. Execute the actual handler
      const response = await handler(req);

      // 8. Add security headers to response
      addSecurityHeaders(response);

      // 9. Log successful request
      const duration = Date.now() - startTime;
      log.info('API request processed', {
        action: 'api_request',
        metadata: {
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status,
          duration,
          ip: clientIP,
        },
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      log.error('API request failed', error instanceof Error ? error : new Error(String(error)), {
        action: 'api_request_failed',
        metadata: {
          method: req.method,
          path: req.nextUrl.pathname,
          duration,
          ip: clientIP,
        },
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

function getClientIP(req: NextRequest): string {
  // Try different headers in order of preference
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('x-client-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (clientIP) {
    return clientIP.trim();
  }
  
  return 'unknown';
}

function getUserId(req: NextRequest): string | undefined {
  // Try to extract user ID from various sources
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Would need to decode JWT token here
    // For now, return undefined
  }
  
  // Could also check session cookies
  const sessionId = req.cookies.get('session-id')?.value;
  return sessionId;
}

function handleCORS(req: NextRequest, allowedOrigins: string[]): NextResponse {
  const origin = req.headers.get('origin');
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return new NextResponse(null, { status: 200, headers });
}

function addSecurityHeaders(response: NextResponse): void {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none'"
  );
  
  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Remove potentially sensitive headers
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
}

// Convenience functions for common use cases
export const withStandardSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, {
    rateLimit: 'default',
    enableSecurityAudit: true,
    maxBodySize: 1024 * 1024, // 1MB
  });

export const withAuthSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, {
    rateLimit: 'auth',
    enableCSRF: true,
    enableSecurityAudit: true,
    requiredHeaders: ['content-type'],
    maxBodySize: 64 * 1024, // 64KB
  });

export const withAPISecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, {
    rateLimit: 'api',
    enableSecurityAudit: true,
    requiredHeaders: ['authorization'],
    maxBodySize: 512 * 1024, // 512KB
  });

export const withUploadSecurity = (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) =>
  withSecurity(handler, {
    rateLimit: 'upload',
    enableCSRF: true,
    enableSecurityAudit: true,
    maxBodySize: 10 * 1024 * 1024, // 10MB
  });