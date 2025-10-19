import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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
  
  // Allow all API routes to pass through
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // Allow static files and public routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
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
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const searchParams = new URLSearchParams()
    searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(
      new URL(`/auth/signin?${searchParams.toString()}`, req.url)
    )
  }

  return NextResponse.next()
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