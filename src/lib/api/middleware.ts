import { NextRequest, NextResponse } from "next/server"

import { unauthorizedResponse, forbiddenResponse } from "@/lib/api/responses"
import { auth } from "@/lib/auth"

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
}

// Default rate limit configurations
export const rateLimitConfigs = {
  default: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes for auth
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute for API
  strict: { windowMs: 60 * 1000, maxRequests: 10 } // 10 requests per minute for sensitive operations
}

// Rate limiting middleware
export function checkRateLimit(req: NextRequest, config: RateLimitConfig = rateLimitConfigs.default) {
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get("x-real-ip") || "unknown"
  const key = `rate_limit:${ip}`
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  // Reset if window has expired
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return { allowed: true, remaining: config.maxRequests - 1 }
  }
  
  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: current.resetTime,
      message: config.message || "Too many requests. Please try again later."
    }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return { 
    allowed: true, 
    remaining: config.maxRequests - current.count 
  }
}

// Authentication middleware
export async function requireAuth(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return { authorized: false, error: unauthorizedResponse() }
  }
  
  return { 
    authorized: true, 
    user: session.user,
    session 
  }
}

// Role-based authorization middleware
export async function requireRole(req: NextRequest, allowedRoles: string[] = ["ADMIN", "INSTRUCTOR"]) {
  const authResult = await requireAuth(req)
  
  if (!authResult.authorized || !authResult.user) {
    return authResult
  }
  
  const userRole = authResult.user.role || "USER"
  
  if (!allowedRoles.includes(userRole)) {
    return { 
      authorized: false, 
      error: forbiddenResponse("Insufficient permissions for this operation") 
    }
  }
  
  return authResult
}

// Admin-only middleware
export async function requireAdmin(req: NextRequest) {
  return requireRole(req, ["ADMIN"])
}

// Instructor or Admin middleware
export async function requireInstructor(req: NextRequest) {
  return requireRole(req, ["ADMIN", "INSTRUCTOR"])
}

// Combined middleware for API protection
export async function protectApiRoute(
  req: NextRequest, 
  options: {
    requireAuth?: boolean
    requireRoles?: string[]
    rateLimit?: RateLimitConfig
  } = {}
) {
  const { requireAuth: needsAuth = false, requireRoles = [], rateLimit } = options
  
  // Apply rate limiting if configured
  if (rateLimit) {
    const rateLimitResult = checkRateLimit(req, rateLimit)
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: NextResponse.json(
          {
            success: false,
            error: rateLimitResult.message || "Rate limit exceeded",
            resetTime: rateLimitResult.resetTime
          },
          { status: 429 }
        )
      }
    }
  }
  
  // Apply authentication if required
  if (needsAuth || requireRoles.length > 0) {
    const authResult = requireRoles.length > 0 
      ? await requireRole(req, requireRoles)
      : await requireAuth(req)
    
    if (!authResult.authorized) {
      return {
        success: false,
        error: authResult.error
      }
    }
    
    return {
      success: true,
      user: authResult.user,
      session: authResult.session
    }
  }
  
  return { success: true }
}

// CORS middleware
export function applyCors(req: NextRequest) {
  const origin = req.headers.get("origin")
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "https://localhost:3000"
  ]
  
  const corsHeaders = new Headers()
  
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders.set("Access-Control-Allow-Origin", origin)
  }
  
  corsHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  corsHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  corsHeaders.set("Access-Control-Max-Age", "86400")
  
  return corsHeaders
}

// Security headers middleware
export function applySecurityHeaders() {
  const headers = new Headers()
  
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-Frame-Options", "DENY")
  headers.set("X-XSS-Protection", "1; mode=block")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  
  return headers
}

// Input sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/[<>]/g, "") // Remove < and >
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === "string" ? sanitizeInput(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}