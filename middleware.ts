import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
}

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/signup", 
  "/auth/error",
]

// Define auth routes that redirect to dashboard if user is already logged in
const authRoutes = [
  "/auth/signin",
  "/auth/signup",
]

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/qualifications",
]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  
  // Apply security headers to all responses
  const response = NextResponse.next()
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Rate limiting for auth routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    const key = `${ip}-auth`
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxAttempts = 5
    
    const current = rateLimitStore.get(key)
    
    if (current && current.resetTime > now) {
      if (current.count >= maxAttempts) {
        return new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          }
        })
      }
      current.count++
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
    }
  }
  
  // Allow all API routes to pass through (with security headers)
  if (pathname.startsWith("/api")) {
    return response
  }

  // Allow static files and public routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return response
  }

  // Get the JWT token to check authentication status
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const isAuthenticated = !!token

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", req.url))
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const searchParams = new URLSearchParams()
    searchParams.set("callbackUrl", pathname)
    const redirectResponse = NextResponse.redirect(
      new URL(`/auth/signin?${searchParams.toString()}`, req.url)
    )
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}