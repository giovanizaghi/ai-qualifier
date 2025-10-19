import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Simple in-memory rate limiter for demonstration
// In production, use Redis or a proper rate limiting solution
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function ratelimit(options: { interval: string; uniqueTokenPerInterval: number }) {
  const intervalMs = options.interval === '1m' ? 60000 : 60000; // 1 minute
  
  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      const windowStart = Math.floor(now / intervalMs) * intervalMs;
      const key = `${identifier}:${windowStart}`;
      
      const current = rateLimitStore.get(key) || { count: 0, resetTime: windowStart + intervalMs };
      
      if (now > current.resetTime) {
        // Reset the counter
        current.count = 1;
        current.resetTime = windowStart + intervalMs;
      } else {
        current.count++;
      }
      
      rateLimitStore.set(key, current);
      
      // Clean up old entries
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }
      
      const limit = 100; // Default limit
      const success = current.count <= limit;
      
      return {
        success,
        remaining: Math.max(0, limit - current.count),
        reset: current.resetTime,
      };
    },
  };
}

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
  authRateLimit: parseInt(process.env.AUTH_RATE_LIMIT || '10'),
  
  // Security headers
  csp: {
    defaultSrc: process.env.CSP_DEFAULT_SRC || "'self'",
    scriptSrc: process.env.CSP_SCRIPT_SRC || "'self' 'unsafe-inline'",
    styleSrc: process.env.CSP_STYLE_SRC || "'self' 'unsafe-inline'",
    imgSrc: process.env.CSP_IMG_SRC || "'self' data: https:",
    fontSrc: process.env.CSP_FONT_SRC || "'self'",
    connectSrc: process.env.CSP_CONNECT_SRC || "'self'",
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // Admin IP whitelist
  adminIpWhitelist: process.env.ADMIN_IP_WHITELIST?.split(',') || ['127.0.0.1', '::1'],
};

// Rate limiting instances
const apiLimiter = ratelimit({
  interval: '1m',
  uniqueTokenPerInterval: 500,
});

const authLimiter = ratelimit({
  interval: '1m',
  uniqueTokenPerInterval: 500,
});

// Security headers
function getSecurityHeaders(): Record<string, string> {
  const csp = Object.entries(SECURITY_CONFIG.csp)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()} ${value}`)
    .join('; ');

  return {
    // Content Security Policy
    'Content-Security-Policy': csp,
    
    // HSTS
    'Strict-Transport-Security': `max-age=${process.env.HSTS_MAX_AGE || 31536000}; includeSubDomains; preload`,
    
    // X-Frame-Options
    'X-Frame-Options': process.env.X_FRAME_OPTIONS || 'DENY',
    
    // X-Content-Type-Options
    'X-Content-Type-Options': process.env.X_CONTENT_TYPE_OPTIONS || 'nosniff',
    
    // X-XSS-Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    
    // Feature Policy / Permissions Policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Remove server information
    'Server': 'AI-Qualifier',
    
    // Prevent MIME sniffing
    'X-Download-Options': 'noopen',
    
    // Permitted cross-domain policies
    'X-Permitted-Cross-Domain-Policies': 'none',
    
    // Cross-origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

// IP address extraction
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback to connection remote address
  return 'unknown';
}

// User Agent validation
function isValidUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  // Block known bot patterns (customize as needed)
  const blockedPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /axios/i,
    /^$/,
  ];
  
  return !blockedPatterns.some(pattern => pattern.test(userAgent));
}

// Suspicious request detection
function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  const url = request.nextUrl;
  
  // Check for suspicious user agents
  if (!isValidUserAgent(userAgent)) {
    return true;
  }
  
  // Check for path traversal attempts
  if (url.pathname.includes('..') || url.pathname.includes('%2e%2e')) {
    return true;
  }
  
  // Check for SQL injection patterns in query parameters
  const sqlPatterns = [
    /union.*select/i,
    /select.*from/i,
    /'.*or.*'/i,
    /drop.*table/i,
    /insert.*into/i,
    /update.*set/i,
    /delete.*from/i,
  ];
  
  const queryString = url.search;
  if (sqlPatterns.some(pattern => pattern.test(queryString))) {
    return true;
  }
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  if (xssPatterns.some(pattern => pattern.test(queryString))) {
    return true;
  }
  
  return false;
}

// Rate limiting
async function checkRateLimit(
  request: NextRequest,
  limiter: any,
  limit: number
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  const ip = getClientIp(request);
  const identifier = `${ip}:${request.nextUrl.pathname}`;
  
  try {
    const result = await limiter.limit(identifier);
    
    if (result.success) {
      return {
        success: true,
        remaining: result.remaining,
        reset: result.reset,
      };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting is down
    return { success: true };
  }
}

// CORS handling
function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const method = request.method;
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    const allowedOrigin = SECURITY_CONFIG.cors.origin.includes(origin || '') ? origin : null;
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin || 'null',
        'Access-Control-Allow-Methods': SECURITY_CONFIG.cors.methods.join(', '),
        'Access-Control-Allow-Headers': SECURITY_CONFIG.cors.allowedHeaders.join(', '),
        'Access-Control-Allow-Credentials': SECURITY_CONFIG.cors.credentials.toString(),
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  return null;
}

// Admin route protection
function isAdminRoute(pathname: string): boolean {
  const adminRoutes = ['/admin', '/api/admin', '/dashboard/admin'];
  return adminRoutes.some(route => pathname.startsWith(route));
}

// Main middleware function
export async function securityMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }
  
  // Check for suspicious requests
  if (isSuspiciousRequest(request)) {
    console.warn(`Suspicious request detected from ${ip}: ${pathname}`);
    return new NextResponse('Forbidden', { 
      status: 403,
      headers: getSecurityHeaders()
    });
  }
  
  // Admin route IP whitelist check
  if (isAdminRoute(pathname) && !SECURITY_CONFIG.adminIpWhitelist.includes(ip)) {
    console.warn(`Unauthorized admin access attempt from ${ip}: ${pathname}`);
    return new NextResponse('Forbidden', { 
      status: 403,
      headers: getSecurityHeaders()
    });
  }
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isAuthRoute = pathname.startsWith('/api/auth/');
    const limiter = isAuthRoute ? authLimiter : apiLimiter;
    const limit = isAuthRoute ? SECURITY_CONFIG.authRateLimit : SECURITY_CONFIG.apiRateLimit;
    
    const rateLimitResult = await checkRateLimit(request, limiter, limit);
    
    if (!rateLimitResult.success) {
      console.warn(`Rate limit exceeded for ${ip}: ${pathname}`);
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          ...getSecurityHeaders(),
          'Retry-After': '60',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
    
    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    
    if (rateLimitResult.remaining !== undefined) {
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    }
    
    if (rateLimitResult.reset) {
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    }
    
    // Add security headers
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  // Add security headers to all responses
  const response = NextResponse.next();
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

export default securityMiddleware;