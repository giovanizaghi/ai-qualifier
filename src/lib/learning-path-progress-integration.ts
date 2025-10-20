/**
 * Learning Path Progress Integration
 * 
 * Integrates the new learning paths system with the existing progress tracking system.
 * Provides unified progress tracking across qualifications and learning paths.
 */

import { 
  LearningPathProgress, 
  LearningPathWithProgress, 
  ProgressStatus as LPProgressStatus,
  StepStatus 
} from '@/types/learning-paths'
import { 
  ProgressAnalytics, 
  ProgressMilestone, 
  ProgressTrackingService 
} from './progress-tracking'

export class LearningPathProgressIntegration {
  private progressService: ProgressTrackingService

  constructor() {
    this.progressService = new ProgressTrackingService()
  }

  /**
   * Convert learning path progress to qualification progress format
   */
  mapLearningPathToQualificationProgress(
    learningPath: LearningPathWithProgress,
    qualificationId: string
  ): any {
    const userProgress = learningPath.userProgress
    
    if (!userProgress) {
      return null
    }

    return {
      id: `lp-${learningPath.id}-${qualificationId}`,
      userId: userProgress.userId,
      qualificationId,
      status: this.mapProgressStatus(userProgress.status),
      completionPercentage: userProgress.completionPercentage,
      studyTimeMinutes: userProgress.totalTimeSpent,
      lastStudiedAt: userProgress.lastActivityAt,
      attempts: 1, // Learning paths don't have attempts like assessments
      bestScore: userProgress.averageScore,
      lastAttemptScore: userProgress.averageScore,
      lastAttemptAt: userProgress.lastActivityAt,
      currentTopic: userProgress.currentStepId,
      completedTopics: userProgress.completedSteps,
      createdAt: userProgress.createdAt,
      updatedAt: userProgress.updatedAt
    }
  }

  /**
   * Map learning path progress status to qualification progress status
   */
  private mapProgressStatus(status: LPProgressStatus): string {
    switch (status) {
      case LPProgressStatus.NOT_STARTED:
        return 'NOT_STARTED'
      case LPProgressStatus.IN_PROGRESS:
        return 'IN_PROGRESS'
      case LPProgressStatus.COMPLETED:
        return 'COMPLETED'
      case LPProgressStatus.PAUSED:
        return 'PAUSED'
      default:
        return 'NOT_STARTED'
    }
  }

  /**
   * Generate progress analytics for learning paths
   */
  async generateLearningPathAnalytics(
    userId: string,
    learningPaths: LearningPathWithProgress[]
  ): Promise<ProgressAnalytics> {
    const enrolledPaths = learningPaths.filter(path => path.userProgress)
    const totalPaths = enrolledPaths.length
    
    if (totalPaths === 0) {
      return this.getEmptyAnalytics()
    }

    const completedPaths = enrolledPaths.filter(
      path => path.userProgress?.status === LPProgressStatus.COMPLETED
    ).length

    const totalTimeSpent = enrolledPaths.reduce(
      (total, path) => total + (path.userProgress?.totalTimeSpent || 0), 
      0
    )

    const averageScore = this.calculateAverageScore(enrolledPaths)
    const overallProgress = this.calculateOverallProgress(enrolledPaths)
    
    const strongAreas = this.identifyStrongAreas(enrolledPaths)
    const weakAreas = this.identifyWeakAreas(enrolledPaths)
    
    const milestones = await this.generateLearningPathMilestones(userId, enrolledPaths)
    const nextMilestone = milestones.find(m => !m.achieved)

    return {
      overallProgress,
      timeSpent: totalTimeSpent,
      assessmentsTaken: this.countCompletedAssessments(enrolledPaths),
      averageScore,
      improvementTrend: this.calculateImprovementTrend(enrolledPaths),
      strongAreas,
      weakAreas,
      milestones,
      nextMilestone,
      estimatedCompletionTime: this.estimateCompletionTime(enrolledPaths)
    }
  }

  /**
   * Calculate overall progress across all learning paths
   */
  private calculateOverallProgress(paths: LearningPathWithProgress[]): number {
    if (paths.length === 0) return 0
    
    const totalProgress = paths.reduce(
      (sum, path) => sum + (path.userProgress?.completionPercentage || 0),
      0
    )
    
    return Math.round(totalProgress / paths.length)
  }

  /**
   * Calculate average score across all learning paths
   */
  private calculateAverageScore(paths: LearningPathWithProgress[]): number {
    const pathsWithScores = paths.filter(path => path.userProgress?.averageScore)
    
    if (pathsWithScores.length === 0) return 0
    
    const totalScore = pathsWithScores.reduce(
      (sum, path) => sum + (path.userProgress?.averageScore || 0),
      0
    )
    
    return Math.round(totalScore / pathsWithScores.length)
  }

  /**
   * Identify strong areas based on completed steps and scores
   */
  private identifyStrongAreas(paths: LearningPathWithProgress[]): string[] {
    const areas: Record<string, { count: number; totalScore: number }> = {}
    
    paths.forEach(path => {
      if (path.userProgress?.strengths) {
        path.userProgress.strengths.forEach(strength => {
          if (!areas[strength]) {
            areas[strength] = { count: 0, totalScore: 0 }
          }
          areas[strength].count++
          areas[strength].totalScore += path.userProgress?.averageScore || 0
        })
      }
    })
    
    return Object.entries(areas)
      .filter(([_, data]) => data.count > 0 && data.totalScore / data.count > 75)
      .map(([area]) => area)
      .slice(0, 5)
  }

  /**
   * Identify weak areas that need improvement
   */
  private identifyWeakAreas(paths: LearningPathWithProgress[]): string[] {
    const areas: Record<string, { count: number; totalScore: number }> = {}
    
    paths.forEach(path => {
      if (path.userProgress?.areasForImprovement) {
        path.userProgress.areasForImprovement.forEach(area => {
          if (!areas[area]) {
            areas[area] = { count: 0, totalScore: 0 }
          }
          areas[area].count++
          areas[area].totalScore += path.userProgress?.averageScore || 0
        })
      }
    })
    
    return Object.entries(areas)
      .filter(([_, data]) => data.count > 0)
      .sort(([_, a], [__, b]) => b.count - a.count)
      .map(([area]) => area)
      .slice(0, 3)
  }

  /**
   * Count completed assessments across all learning paths
   */
  private countCompletedAssessments(paths: LearningPathWithProgress[]): number {
    return paths.reduce((total, path) => {
      if (!path.userProgress) return total
      
      const completedStepsWithAssessments = path.steps.filter(step => 
        step.hasAssessment && 
        path.userProgress?.completedSteps.includes(step.id)
      )
      
      return total + completedStepsWithAssessments.length
    }, 0)
  }

  /**
   * Calculate improvement trend based on step completion patterns
   */
  private calculateImprovementTrend(paths: LearningPathWithProgress[]): 'improving' | 'stable' | 'declining' {
    // This is a simplified implementation
    // In a real system, you'd analyze completion times, scores over time, etc.
    
    const recentActivity = paths.filter(path => 
      path.userProgress?.lastActivityAt && 
      new Date(path.userProgress.lastActivityAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    
    if (recentActivity.length > paths.length * 0.5) {
      return 'improving'
    } else if (recentActivity.length > 0) {
      return 'stable'
    } else {
      return 'declining'
    }
  }

  /**
   * Estimate time to complete all in-progress learning paths
   */
  private estimateCompletionTime(paths: LearningPathWithProgress[]): number {
    const inProgressPaths = paths.filter(
      path => path.userProgress?.status === LPProgressStatus.IN_PROGRESS
    )
    
    if (inProgressPaths.length === 0) return 0
    
    return inProgressPaths.reduce((total, path) => {
      const remainingPercentage = 100 - (path.userProgress?.completionPercentage || 0)
      const remainingTime = (path.estimatedDuration * remainingPercentage) / 100
      return total + remainingTime
    }, 0) / 60 // Convert minutes to hours
  }

  /**
   * Generate learning path specific milestones
   */
  private async generateLearningPathMilestones(
    userId: string,
    paths: LearningPathWithProgress[]
  ): Promise<ProgressMilestone[]> {
    const milestones: ProgressMilestone[] = []
    
    // First Learning Path Completion
    const completedPaths = paths.filter(
      path => path.userProgress?.status === LPProgressStatus.COMPLETED
    ).length
    
    milestones.push({
      id: 'first-path-completion',
      title: 'First Learning Path',
      description: 'Complete your first learning path',
      type: 'completion',
      achieved: completedPaths > 0,
      achievedAt: completedPaths > 0 ? new Date() : undefined,
      requirement: {
        type: 'paths_completed',
        threshold: 1,
        current: completedPaths
      },
      reward: {
        points: 100,
        badge: 'path-explorer',
        title: 'Path Explorer'
      }
    })
    
    // Multiple Paths Completion
    milestones.push({
      id: 'multi-path-completion',
      title: 'Learning Path Master',
      description: 'Complete 3 learning paths',
      type: 'completion',
      achieved: completedPaths >= 3,
      achievedAt: completedPaths >= 3 ? new Date() : undefined,
      requirement: {
        type: 'paths_completed',
        threshold: 3,
        current: completedPaths
      },
      reward: {
        points: 300,
        badge: 'path-master',
        title: 'Path Master'
      }
    })
    
    // Study Time Milestone
    const totalTime = paths.reduce(
      (total, path) => total + (path.userProgress?.totalTimeSpent || 0),
      0
    )
    
    milestones.push({
      id: 'study-time-milestone',
      title: 'Dedicated Learner',
      description: 'Spend 10 hours learning',
      type: 'study_time',
      achieved: totalTime >= 600, // 10 hours in minutes
      achievedAt: totalTime >= 600 ? new Date() : undefined,
      requirement: {
        type: 'study_time_minutes',
        threshold: 600,
        current: totalTime
      },
      reward: {
        points: 200,
        badge: 'dedicated-learner',
        title: 'Dedicated Learner'
      }
    })
    
    return milestones
  }

  /**
   * Get empty analytics for users with no learning path progress
   */
  private getEmptyAnalytics(): ProgressAnalytics {
    return {
      overallProgress: 0,
      timeSpent: 0,
      assessmentsTaken: 0,
      averageScore: 0,
      improvementTrend: 'stable',
      strongAreas: [],
      weakAreas: [],
      milestones: [],
      estimatedCompletionTime: 0
    }
  }

  /**
   * Sync learning path progress with qualification progress
   */
  async syncWithQualificationProgress(
    userId: string,
    learningPathId: string,
    qualificationId: string
  ): Promise<void> {
    try {
      // This would integrate with the existing progress tracking system
      // to keep qualification progress in sync with learning path progress
      
      console.log('Syncing learning path progress with qualification:', {
        userId,
        learningPathId,
        qualificationId
      })
      
      // In a real implementation, you would:
      // 1. Get the current learning path progress
      // 2. Map it to qualification progress format
      // 3. Update the qualification progress in the database
      // 4. Trigger any necessary events or notifications
      
    } catch (error) {
      console.error('Error syncing learning path progress:', error)
      throw error
    }
  }
}

// Export singleton instance
export const learningPathProgressIntegration = new LearningPathProgressIntegration()
export default learningPathProgressIntegration