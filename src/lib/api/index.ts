// API utilities exports
export * from "./validation"
export * from "./responses"
export * from "./middleware"

// Common types
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ApiError {
  success: false
  error: string
  details?: any
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
}