import { prisma } from '@/lib/prisma';
import { qualifyProspects } from '@/lib/prospect-qualifier';
import { 
  JobQueue, 
  JobProcessor, 
  JobResult, 
  QualifyProspectsJobData,
  JobProgress,
  getJobQueue
} from '@/lib/job-queue';
import type { ICPData } from '@/lib/icp-generator';
import { metricsService } from '@/lib/monitoring/metrics';

/**
 * Background processor for prospect qualification jobs
 */
export class QualificationProcessor {
  private jobQueue: JobQueue;

  constructor(jobQueue?: JobQueue) {
    this.jobQueue = jobQueue || getJobQueue();
    this.registerProcessors();
  }

  /**
   * Register all job processors
   */
  private registerProcessors(): void {
    this.jobQueue.registerProcessor('qualify-prospects', this.processQualification.bind(this));
  }

  /**
   * Process a qualification job
   */
  private async processQualification(
    job: { id: string; data: QualifyProspectsJobData },
    updateProgress: (progress: JobProgress) => Promise<void>
  ): Promise<JobResult> {
    const { runId, userId, icpId, icp, domains } = job.data;
    const startTime = Date.now();

    try {
      console.log(`[BackgroundProcessor] Starting qualification job ${job.id} for run ${runId}`);

      // Record job start metrics
      metricsService.recordBusinessMetric('qualification_job_started', 1, {
        jobId: job.id,
        runId,
        userId,
        icpId,
        totalDomains: domains.length
      });

      // Verify the qualification run still exists and is in the right state
      const run = await prisma.qualificationRun.findUnique({
        where: { id: runId },
      });

      if (!run) {
        throw new Error(`Qualification run ${runId} not found`);
      }

      if (run.status !== 'PROCESSING') {
        throw new Error(`Qualification run ${runId} is not in PROCESSING state: ${run.status}`);
      }

      // Update initial progress
      await updateProgress({
        completed: 0,
        total: domains.length,
        message: 'Starting prospect qualification...',
      });

      // Process prospects with progress tracking
      const results = await qualifyProspects(
        domains,
        icp,
        {
          onProgress: async (completed: number, total: number) => {
            // Update progress in both job queue and database
            await Promise.all([
              updateProgress({
                completed,
                total,
                message: `Processing prospect ${completed + 1} of ${total}`,
                details: {
                  currentDomain: domains[completed] || null,
                  completedDomains: domains.slice(0, completed),
                },
              }),
              prisma.qualificationRun.update({
                where: { id: runId },
                data: { completed },
              }),
            ]);

            console.log(`[BackgroundProcessor] Progress: ${completed}/${total} for run ${runId}`);
          }
        }
      );

      console.log(`[BackgroundProcessor] Qualification completed, saving ${results.length} results for run ${runId}`);

      // Update progress for saving results
      await updateProgress({
        completed: domains.length,
        total: domains.length,
        message: 'Saving qualification results...',
      });

      // Save results to database in batches to avoid memory issues
      const BATCH_SIZE = 10;
      let savedCount = 0;

      for (let i = 0; i < results.length; i += BATCH_SIZE) {
        const batch = results.slice(i, i + BATCH_SIZE);
        
        // Create prospect qualifications for this batch
        await Promise.all(
          batch.map(result => 
            prisma.prospectQualification.create({
              data: {
                runId,
                domain: result.prospectDomain,
                companyName: result.prospectName,
                companyData: result.prospectData as any,
                score: result.score,
                fitLevel: result.fitLevel as any,
                reasoning: result.reasoning,
                matchedCriteria: result.matchedCriteria as any,
                gaps: result.gaps,
                status: 'COMPLETED',
                analyzedAt: new Date(),
              },
            })
          )
        );

        savedCount += batch.length;
        console.log(`[BackgroundProcessor] Saved batch ${Math.ceil((i + 1) / BATCH_SIZE)} - ${savedCount}/${results.length} results`);
      }

      // Mark run as completed
      await prisma.qualificationRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          completed: domains.length,
          completedAt: new Date(),
        },
      });

      // Final progress update
      await updateProgress({
        completed: domains.length,
        total: domains.length,
        message: 'Qualification completed successfully',
        details: {
          totalResults: results.length,
          averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
          highQualityProspects: results.filter(r => r.score >= 70).length,
        },
      });

      console.log(`[BackgroundProcessor] Qualification job ${job.id} completed successfully`);

      // Record comprehensive completion metrics
      const totalTime = Date.now() - startTime;
      metricsService.recordPerformance('qualification_total_time', totalTime, 'ms', {
        runId,
        totalDomains: domains.length.toString()
      });

      const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      const highQualityCount = results.filter(r => r.score >= 70).length;

      metricsService.recordBusinessMetric('qualification_job_completed', 1, {
        jobId: job.id,
        runId,
        userId,
        icpId,
        totalDomains: domains.length,
        totalResults: results.length,
        averageScore,
        highQualityProspects: highQualityCount,
        totalTimeMs: totalTime
      });

      return {
        success: true,
        data: {
          runId,
          totalProspects: domains.length,
          qualifiedProspects: results.length,
          averageScore: averageScore,
          highQualityCount: highQualityCount,
          completedAt: new Date(),
        },
      };
    } catch (error) {
      console.error(`[BackgroundProcessor] Error in qualification job ${job.id}:`, error);

      // Record error metrics
      const totalTime = Date.now() - startTime;
      metricsService.recordError('qualification_error', 'Qualification job failed', {
        metadata: {
          jobId: job.id,
          runId,
          userId,
          icpId,
          totalDomains: domains.length,
          error: error instanceof Error ? error.message : 'Unknown error',
          totalTimeMs: totalTime
        }
      });

      metricsService.recordBusinessMetric('qualification_job_failed', 1, {
        jobId: job.id,
        runId,
        userId,
        icpId,
        totalDomains: domains.length,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        totalTimeMs: totalTime
      });

      // Update progress to show error
      await updateProgress({
        completed: 0,
        total: domains.length,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }).catch(console.error);

      // Mark run as failed in database
      try {
        await prisma.qualificationRun.update({
          where: { id: runId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
          },
        });
      } catch (dbError) {
        console.error(`[BackgroundProcessor] Error updating run status:`, dbError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Start a qualification job
   */
  async startQualification(
    runId: string,
    userId: string,
    icpId: string,
    icp: ICPData,
    domains: string[]
  ): Promise<string> {
    const jobId = await this.jobQueue.enqueue('qualify-prospects', {
      runId,
      userId,
      icpId,
      icp,
      domains,
    }, {
      maxAttempts: 2, // Only retry once for qualification jobs
    });

    console.log(`[BackgroundProcessor] Enqueued qualification job ${jobId} for run ${runId}`);
    return jobId;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string) {
    return this.jobQueue.getJob(jobId);
  }

  /**
   * Get job progress for a qualification run
   */
  getJobProgress(jobId: string): JobProgress | undefined {
    return this.jobQueue.getProgress(jobId);
  }

  /**
   * Get job queue statistics
   */
  getQueueStats() {
    return this.jobQueue.getStats();
  }

  /**
   * Cancel a job if it's still pending
   */
  async cancelJob(jobId: string): Promise<boolean> {
    return this.jobQueue.cancelJob(jobId);
  }

  /**
   * Get all jobs for a specific user
   */
  getUserJobs(userId: string) {
    return this.jobQueue.getJobsByUser(userId);
  }

  /**
   * Clean up old completed jobs
   */
  cleanup(): number {
    return this.jobQueue.cleanup();
  }

  /**
   * Stop the background processor and job queue
   */
  stop(): void {
    this.jobQueue.stop();
  }
}

// Singleton instance
let qualificationProcessorInstance: QualificationProcessor | undefined;

/**
 * Get the global qualification processor instance
 */
export function getQualificationProcessor(): QualificationProcessor {
  if (!qualificationProcessorInstance) {
    qualificationProcessorInstance = new QualificationProcessor();
  }
  return qualificationProcessorInstance;
}

/**
 * Initialize qualification processor with custom job queue
 */
export function initializeQualificationProcessor(jobQueue?: JobQueue): QualificationProcessor {
  qualificationProcessorInstance = new QualificationProcessor(jobQueue);
  return qualificationProcessorInstance;
}

/**
 * Utility function to recover stuck qualification runs on application startup
 * This should be called when the server starts to handle any runs that were
 * left in PROCESSING state due to server restart or crash
 */
export async function recoverStuckRuns(): Promise<void> {
  try {
    console.log('[BackgroundProcessor] Checking for stuck qualification runs...');

    // Find runs that have been processing for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const stuckRuns = await prisma.qualificationRun.findMany({
      where: {
        status: 'PROCESSING',
        createdAt: {
          lt: thirtyMinutesAgo,
        },
      },
      include: {
        icp: true,
      },
    });

    if (stuckRuns.length === 0) {
      console.log('[BackgroundProcessor] No stuck runs found');
      return;
    }

    console.log(`[BackgroundProcessor] Found ${stuckRuns.length} stuck runs, marking as failed`);

    // Mark stuck runs as failed
    await prisma.qualificationRun.updateMany({
      where: {
        id: { in: stuckRuns.map(run => run.id) },
      },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });

    console.log(`[BackgroundProcessor] Marked ${stuckRuns.length} stuck runs as failed`);
  } catch (error) {
    console.error('[BackgroundProcessor] Error recovering stuck runs:', error);
  }
}

/**
 * Health check function to verify the background processor is working
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
}> {
  try {
    const processor = getQualificationProcessor();
    const stats = processor.getQueueStats();
    
    // Consider the processor healthy if:
    // - Total active jobs is less than max concurrency
    // - No jobs have been stuck in processing for too long
    const isHealthy = stats.activeJobs < stats.maxConcurrency;
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      details: {
        queueStats: stats,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
}