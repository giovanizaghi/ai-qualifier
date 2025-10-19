import { NextResponse } from "next/server"
import { z } from "zod"

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Success response helpers
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  )
}

export function successResponseWithPagination<T>(
  data: T[],
  pagination: PaginationInfo,
  message?: string
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data,
    pagination,
    message
  })
}

export function createdResponse<T>(
  data: T,
  message: string = "Resource created successfully"
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status: 201 }
  )
}

// Error response helpers
export function errorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      details
    },
    { status }
  )
}

export function validationErrorResponse(
  zodError: z.ZodError
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: zodError.issues
    },
    { status: 400 }
  )
}

export function notFoundResponse(
  resource: string = "Resource"
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: `${resource} not found`
    },
    { status: 404 }
  )
}

export function unauthorizedResponse(
  message: string = "Authentication required"
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 401 }
  )
}

export function forbiddenResponse(
  message: string = "Insufficient permissions"
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 403 }
  )
}

export function conflictResponse(
  message: string = "Resource already exists"
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 409 }
  )
}

export function badRequestResponse(
  message: string = "Bad request"
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 400 }
  )
}

export function internalServerErrorResponse(
  message: string = "Internal server error"
): NextResponse<ApiResponse> {
  console.error("Internal server error:", message)
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status: 500 }
  )
}

// Utility function to calculate pagination info
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage
  }
}

// Generic error handler for API routes
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error)

  if (error instanceof z.ZodError) {
    return validationErrorResponse(error)
  }

  if (error instanceof Error) {
    // Handle specific known errors
    if (error.message.includes("not found")) {
      return notFoundResponse()
    }
    
    if (error.message.includes("already exists")) {
      return conflictResponse(error.message)
    }
    
    if (error.message.includes("unauthorized")) {
      return unauthorizedResponse(error.message)
    }
    
    if (error.message.includes("forbidden")) {
      return forbiddenResponse(error.message)
    }
  }

  return internalServerErrorResponse()
}