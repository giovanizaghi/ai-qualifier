import { 
  LearningPathWithProgress, 
  LearningPathFilters, 
  LearningPathProgress 
} from '@/types/learning-paths'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface LearningPathsResponse {
  data: LearningPathWithProgress[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  filters: {
    applied: LearningPathFilters
    available: {
      categories: string[]
      difficulties: string[]
      tags: string[]
    }
  }
}

class LearningPathService {
  private baseUrl = '/api/learning-paths'

  /**
   * Fetch learning paths with optional filters and pagination
   */
  async getLearningPaths(
    filters: Partial<LearningPathFilters> = {},
    pagination: { limit?: number; offset?: number } = {},
    sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
  ): Promise<ApiResponse<LearningPathsResponse>> {
    try {
      const params = new URLSearchParams()
      
      // Add filters
      if (filters.search) {params.append('search', filters.search)}
      if (filters.category) {params.append('category', filters.category)}
      if (filters.difficulty) {params.append('difficulty', filters.difficulty)}
      if (filters.status) {params.append('status', filters.status)}
      if (filters.tags?.length) {params.append('tags', filters.tags.join(','))}
      
      // Add pagination
      if (pagination.limit) {params.append('limit', pagination.limit.toString())}
      if (pagination.offset) {params.append('offset', pagination.offset.toString())}
      
      // Add sorting
      if (sorting.sortBy) {params.append('sortBy', sorting.sortBy)}
      if (sorting.sortOrder) {params.append('sortOrder', sorting.sortOrder)}
      
      const response = await fetch(`${this.baseUrl}?${params.toString()}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch learning paths')
      }
      
      return result
    } catch (error) {
      console.error('Error fetching learning paths:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Fetch a specific learning path by ID
   */
  async getLearningPath(pathId: string): Promise<ApiResponse<LearningPathWithProgress>> {
    try {
      const response = await fetch(`${this.baseUrl}/${pathId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch learning path')
      }
      
      return result
    } catch (error) {
      console.error('Error fetching learning path:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user's progress for a specific learning path
   */
  async getLearningPathProgress(pathId: string): Promise<ApiResponse<LearningPathProgress>> {
    try {
      const response = await fetch(`${this.baseUrl}/${pathId}/progress`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch progress')
      }
      
      return result
    } catch (error) {
      console.error('Error fetching learning path progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Enroll in a learning path
   */
  async enrollInLearningPath(pathId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${pathId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enroll'
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to enroll in learning path')
      }
      
      return result
    } catch (error) {
      console.error('Error enrolling in learning path:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Start a step in a learning path
   */
  async startStep(pathId: string, stepId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${pathId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_step',
          stepId
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start step')
      }
      
      return result
    } catch (error) {
      console.error('Error starting step:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Complete a step in a learning path
   */
  async completeStep(
    pathId: string, 
    stepId: string, 
    data: { timeSpent?: number; score?: number }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${pathId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete_step',
          stepId,
          timeSpent: data.timeSpent,
          score: data.score
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete step')
      }
      
      return result
    } catch (error) {
      console.error('Error completing step:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update progress for a learning path
   */
  async updateProgress(
    pathId: string, 
    progressData: Partial<LearningPathProgress>
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/${pathId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_progress',
          data: progressData
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update progress')
      }
      
      return result
    } catch (error) {
      console.error('Error updating progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get recommended learning paths for user
   */
  async getRecommendedPaths(): Promise<ApiResponse<LearningPathWithProgress[]>> {
    try {
      // For now, just return popular paths
      const response = await this.getLearningPaths(
        {},
        { limit: 6 },
        { sortBy: 'popularity', sortOrder: 'desc' }
      )
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.data
        }
      }
      
      return {
        success: false,
        error: 'Failed to fetch recommended paths'
      }
    } catch (error) {
      console.error('Error fetching recommended paths:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Search learning paths
   */
  async searchLearningPaths(query: string): Promise<ApiResponse<LearningPathWithProgress[]>> {
    try {
      const response = await this.getLearningPaths(
        { search: query },
        { limit: 20 }
      )
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.data
        }
      }
      
      return {
        success: false,
        error: 'Failed to search learning paths'
      }
    } catch (error) {
      console.error('Error searching learning paths:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const learningPathService = new LearningPathService()
export default learningPathService