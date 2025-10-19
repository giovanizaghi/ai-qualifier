import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/error",
  "/api/auth",
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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the session
  const session = await auth()
  const isAuthenticated = !!session?.user

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  // Allow API routes and public routes
  if (pathname.startsWith("/api") || isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const searchParams = new URLSearchParams()
    searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(
      new URL(`/auth/signin?${searchParams.toString()}`, request.url)
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