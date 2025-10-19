import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// User Testing Session Schema
const UserTestingSessionSchema = z.object({
  sessionId: z.string().uuid(),
  scenarioId: z.string(),
  userId: z.string().optional(),
  userPersona: z.enum(['new_user', 'intermediate_user', 'expert_user', 'administrator']),
  device: z.enum(['desktop', 'tablet', 'mobile']),
  browser: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  metadata: z.record(z.string(), z.any()).optional(),
});

// User Feedback Schema
const UserFeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  scenarioId: z.string(),
  taskId: z.string(),
  feedbackType: z.enum(['rating', 'comment', 'bug_report', 'suggestion']),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Task Completion Schema
const TaskCompletionSchema = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string(),
  scenarioId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'failed', 'skipped']),
  completionTime: z.number().optional(), // in seconds
  errorCount: z.number().default(0),
  helpRequests: z.number().default(0),
  notes: z.string().optional(),
});

export type UserTestingSession = z.infer<typeof UserTestingSessionSchema>;
export type UserFeedback = z.infer<typeof UserFeedbackSchema>;
export type TaskCompletion = z.infer<typeof TaskCompletionSchema>;

/**
 * User Testing Framework
 * Provides infrastructure for conducting and tracking UAT sessions
 */
export class UserTestingFramework {
  /**
   * Start a new user testing session
   */
  static async startSession(data: Omit<UserTestingSession, 'sessionId' | 'startTime' | 'status'>): Promise<string> {
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      scenarioId: data.scenarioId,
      userId: data.userId,
      userPersona: data.userPersona,
      device: data.device,
      browser: data.browser,
      startTime: new Date(),
      status: 'in_progress' as const,
      metadata: data.metadata,
    };

    // Store session in database
    await prisma.userTestingSession.create({
      data: session,
    });

    return sessionId;
  }

  /**
   * End a user testing session
   */
  static async endSession(sessionId: string, status: 'completed' | 'abandoned'): Promise<void> {
    await prisma.userTestingSession.update({
      where: { sessionId },
      data: {
        endTime: new Date(),
        status,
      },
    });
  }

  /**
   * Record task completion
   */
  static async recordTaskCompletion(data: Omit<TaskCompletion, 'startTime'> & { startTime?: string }): Promise<void> {
    const taskCompletion = {
      sessionId: data.sessionId,
      taskId: data.taskId,
      scenarioId: data.scenarioId,
      startTime: data.startTime ? new Date(data.startTime) : new Date(),
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      status: data.status,
      completionTime: data.completionTime,
      errorCount: data.errorCount,
      helpRequests: data.helpRequests,
      notes: data.notes,
    };

    await prisma.taskCompletion.create({
      data: taskCompletion,
    });
  }

  /**
   * Collect user feedback
   */
  static async collectFeedback(data: Omit<UserFeedback, 'timestamp'>): Promise<void> {
    const feedback = {
      sessionId: data.sessionId,
      scenarioId: data.scenarioId,
      taskId: data.taskId,
      feedbackType: data.feedbackType,
      rating: data.rating,
      comment: data.comment,
      timestamp: new Date(),
      metadata: data.metadata,
    };

    await prisma.userTestingFeedback.create({
      data: feedback,
    });
  }

  /**
   * Get session analytics
   */
  static async getSessionAnalytics(sessionId: string) {
    const session = await prisma.userTestingSession.findUnique({
      where: { sessionId },
      include: {
        taskCompletions: true,
        feedback: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const completedTasks = session.taskCompletions.filter((task: any) => task.status === 'completed');
    const averageTaskTime = completedTasks.reduce((sum: number, task: any) => 
      sum + (task.completionTime || 0), 0) / completedTasks.length;

    const totalErrors = session.taskCompletions.reduce((sum: number, task: any) => 
      sum + task.errorCount, 0);

    const ratingsWithValues = session.feedback.filter((f: any) => f.rating);
    const averageRating = ratingsWithValues.length > 0 
      ? ratingsWithValues.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / ratingsWithValues.length
      : null;

    return {
      sessionData: session,
      analytics: {
        totalTasks: session.taskCompletions.length,
        completedTasks: completedTasks.length,
        completionRate: session.taskCompletions.length > 0 ? completedTasks.length / session.taskCompletions.length : 0,
        averageTaskTime: completedTasks.length > 0 ? averageTaskTime : 0,
        totalErrors,
        averageErrorsPerTask: session.taskCompletions.length > 0 ? totalErrors / session.taskCompletions.length : 0,
        averageRating,
        totalFeedbackItems: session.feedback.length,
      },
    };
  }

  /**
   * Get scenario analytics across all sessions
   */
  static async getScenarioAnalytics(scenarioId: string) {
    const sessions = await prisma.userTestingSession.findMany({
      where: { scenarioId },
      include: {
        taskCompletions: true,
        feedback: true,
      },
    });

    const completedSessions = sessions.filter((s: any) => s.status === 'completed');
    const totalTasks = sessions.flatMap((s: any) => s.taskCompletions);
    const completedTasks = totalTasks.filter((t: any) => t.status === 'completed');
    const allFeedback = sessions.flatMap((s: any) => s.feedback);
    const ratingsWithValues = allFeedback.filter((f: any) => f.rating);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      sessionCompletionRate: sessions.length > 0 ? completedSessions.length / sessions.length : 0,
      averageSessionDuration: this.calculateAverageSessionDuration(completedSessions),
      taskCompletionRate: totalTasks.length > 0 ? completedTasks.length / totalTasks.length : 0,
      averageTaskTime: completedTasks.length > 0 
        ? completedTasks.reduce((sum: number, task: any) => sum + (task.completionTime || 0), 0) / completedTasks.length 
        : 0,
      totalErrors: totalTasks.reduce((sum: number, task: any) => sum + task.errorCount, 0),
      averageRating: ratingsWithValues.length > 0 
        ? ratingsWithValues.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / ratingsWithValues.length 
        : null,
      feedbackSentiment: this.analyzeFeedbackSentiment(allFeedback),
      deviceBreakdown: this.getDeviceBreakdown(sessions),
      browserBreakdown: this.getBrowserBreakdown(sessions),
    };
  }

  /**
   * Generate UAT report
   */
  static async generateUATReport() {
    const allSessions = await prisma.userTestingSession.findMany({
      include: {
        taskCompletions: true,
        feedback: true,
      },
    });

    const scenarios = [...new Set(allSessions.map((s: any) => s.scenarioId))];
    const scenarioAnalytics = await Promise.all(
      scenarios.map(async scenarioId => ({
        scenarioId,
        analytics: await this.getScenarioAnalytics(scenarioId),
      }))
    );

    return {
      overview: {
        totalSessions: allSessions.length,
        totalUsers: [...new Set(allSessions.map((s: any) => s.userId).filter(Boolean))].length,
        totalScenarios: scenarios.length,
        overallCompletionRate: allSessions.length > 0 
          ? allSessions.filter((s: any) => s.status === 'completed').length / allSessions.length 
          : 0,
      },
      scenarioAnalytics,
      recommendations: this.generateRecommendations(scenarioAnalytics),
      criticalIssues: this.identifyCriticalIssues(allSessions),
    };
  }

  // Helper methods
  private static calculateAverageSessionDuration(sessions: any[]): number {
    const durationsInMs = sessions
      .filter((s: any) => s.endTime)
      .map((s: any) => new Date(s.endTime!).getTime() - new Date(s.startTime).getTime());
    
    return durationsInMs.length > 0 
      ? durationsInMs.reduce((sum: number, duration: number) => sum + duration, 0) / durationsInMs.length / 1000 
      : 0; // Convert to seconds
  }

  private static analyzeFeedbackSentiment(feedback: any[]) {
    const comments = feedback.filter((f: any) => f.comment && f.comment.trim().length > 0);
    // Simple sentiment analysis based on keywords
    const positiveKeywords = ['good', 'great', 'excellent', 'easy', 'intuitive', 'helpful'];
    const negativeKeywords = ['bad', 'difficult', 'confusing', 'slow', 'broken', 'frustrating'];

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    comments.forEach((f: any) => {
      const comment = f.comment!.toLowerCase();
      const hasPositive = positiveKeywords.some(keyword => comment.includes(keyword));
      const hasNegative = negativeKeywords.some(keyword => comment.includes(keyword));

      if (hasPositive && !hasNegative) positive++;
      else if (hasNegative && !hasPositive) negative++;
      else neutral++;
    });

    return {
      positive,
      negative,
      neutral,
      total: comments.length,
      sentiment: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
    };
  }

  private static getDeviceBreakdown(sessions: any[]) {
    const breakdown: Record<string, number> = {};
    sessions.forEach((s: any) => {
      breakdown[s.device] = (breakdown[s.device] || 0) + 1;
    });
    return breakdown;
  }

  private static getBrowserBreakdown(sessions: any[]) {
    const breakdown: Record<string, number> = {};
    sessions.forEach((s: any) => {
      breakdown[s.browser] = (breakdown[s.browser] || 0) + 1;
    });
    return breakdown;
  }

  private static generateRecommendations(scenarioAnalytics: any[]): string[] {
    const recommendations: string[] = [];

    scenarioAnalytics.forEach(({ scenarioId, analytics }) => {
      if (analytics.sessionCompletionRate < 0.8) {
        recommendations.push(`Scenario ${scenarioId}: Low completion rate (${(analytics.sessionCompletionRate * 100).toFixed(1)}%). Review user journey and identify friction points.`);
      }

      if (analytics.averageRating && analytics.averageRating < 4.0) {
        recommendations.push(`Scenario ${scenarioId}: User satisfaction below target (${analytics.averageRating.toFixed(1)}/5). Investigate user feedback for improvement opportunities.`);
      }

      if (analytics.averageTaskTime > 300) { // 5 minutes
        recommendations.push(`Scenario ${scenarioId}: High average task completion time (${(analytics.averageTaskTime / 60).toFixed(1)} minutes). Consider UX optimizations.`);
      }
    });

    return recommendations;
  }

  private static identifyCriticalIssues(sessions: any[]): string[] {
    const issues: string[] = [];

    if (sessions.length === 0) return issues;

    const abandonmentRate = sessions.filter((s: any) => s.status === 'abandoned').length / sessions.length;
    if (abandonmentRate > 0.2) {
      issues.push(`High session abandonment rate: ${(abandonmentRate * 100).toFixed(1)}%`);
    }

    const highErrorSessions = sessions.filter((s: any) => 
      s.taskCompletions?.some((t: any) => t.errorCount > 5)
    ).length;
    if (highErrorSessions > sessions.length * 0.1) {
      issues.push(`${highErrorSessions} sessions had high error counts (>5 errors per task)`);
    }

    return issues;
  }
}

// Export schemas for use in API routes
export {
  UserTestingSessionSchema,
  UserFeedbackSchema,
  TaskCompletionSchema,
};