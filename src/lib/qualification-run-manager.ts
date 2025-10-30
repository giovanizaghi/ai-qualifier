import { getQualificationProcessor } from '@/lib/background-processor';
import { prisma } from '@/lib/prisma';

export interface RunTimeoutConfig {
  timeoutMinutes: number;
  checkIntervalMinutes: number;
  maxRetries: number;
}

export interface RunHealthStatus {
  runId: string;
  status: string;
  totalProspects: number;
  completed: number;
  progress: number;
  ageMinutes: number;
  isStuck: boolean;
  lastActivity?: Date;
  estimatedTimeRemaining?: number;
}

export interface RecoveryResult {
  recovered: number;
  failed: number;
  resumed: number;
  details: Array<{
    runId: string;
    action: 'recovered' | 'failed' | 'resumed';
    reason: string;
  }>;
}

/**
 * Comprehensive qualification run state management
 * Handles timeouts, stuck run recovery, cleanup, and health monitoring
 */
export class QualificationRunManager {
  private readonly config: RunTimeoutConfig;
  private timeoutCheckInterval?: NodeJS.Timeout;
  private readonly defaultConfig: RunTimeoutConfig = {
    timeoutMinutes: 30,
    checkIntervalMinutes: 5,
    maxRetries: 2,
  };

  constructor(config?: Partial<RunTimeoutConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Start the run manager with automatic timeout checking
   */
  start(): void {
    this.stop(); // Ensure no duplicate intervals

    console.log(`[RunManager] Starting with config: ${JSON.stringify(this.config)}`);
    
    // Start periodic timeout checking
    this.timeoutCheckInterval = setInterval(
      () => this.checkTimeouts().catch(console.error),
      this.config.checkIntervalMinutes * 60 * 1000
    );

    // Perform initial recovery on startup
    this.recoverStuckRuns().catch(console.error);
  }

  /**
   * Stop the run manager and cleanup intervals
   */
  stop(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = undefined;
    }
    console.log('[RunManager] Stopped');
  }

  /**
   * Check for and handle timed out runs
   */
  async checkTimeouts(): Promise<RecoveryResult> {
    try {
      console.log('[RunManager] Checking for timed out runs...');
      
      const cutoffTime = new Date(Date.now() - this.config.timeoutMinutes * 60 * 1000);
      
      // Find runs that have been processing for too long
      const timedOutRuns = await prisma.qualificationRun.findMany({
        where: {
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
          createdAt: {
            lt: cutoffTime,
          },
        },
        select: {
          id: true,
          status: true,
          totalProspects: true,
          completed: true,
          createdAt: true,
        },
      });

      if (timedOutRuns.length === 0) {
        console.log('[RunManager] No timed out runs found');
        return { recovered: 0, failed: 0, resumed: 0, details: [] };
      }

      console.log(`[RunManager] Found ${timedOutRuns.length} timed out runs`);

      const results: RecoveryResult = {
        recovered: 0,
        failed: 0,
        resumed: 0,
        details: [],
      };

      // Process each timed out run
      for (const run of timedOutRuns) {
        try {
          const ageMinutes = Math.round(
            (Date.now() - new Date(run.createdAt).getTime()) / 1000 / 60
          );

          console.log(
            `[RunManager] Processing timed out run ${run.id}: ` +
            `${run.status}, ${run.completed}/${run.totalProspects}, age: ${ageMinutes}min`
          );

          // Determine if we should retry or fail the run
          const shouldRetry = this.shouldRetryRun(run);

          if (shouldRetry) {
            // Attempt to resume the run
            await this.resumeRun(run.id);
            results.resumed++;
            results.details.push({
              runId: run.id,
              action: 'resumed',
              reason: `Run resumed after ${ageMinutes} minutes of inactivity`,
            });
          } else {
            // Mark as failed
            await this.failRun(run.id, `Timed out after ${ageMinutes} minutes`);
            results.failed++;
            results.details.push({
              runId: run.id,
              action: 'failed',
              reason: `Run failed due to timeout (${ageMinutes} minutes)`,
            });
          }
        } catch (error) {
          console.error(`[RunManager] Error processing run ${run.id}:`, error);
          results.details.push({
            runId: run.id,
            action: 'failed',
            reason: `Error during recovery: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      console.log(`[RunManager] Timeout check completed: ${JSON.stringify(results)}`);
      return results;
    } catch (error) {
      console.error('[RunManager] Error checking timeouts:', error);
      throw error;
    }
  }

  /**
   * Recover stuck runs - comprehensive recovery for startup
   */
  async recoverStuckRuns(): Promise<RecoveryResult> {
    try {
      console.log('[RunManager] Starting comprehensive stuck run recovery...');

      // Get all active runs
      const activeRuns = await prisma.qualificationRun.findMany({
        where: {
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
        },
        include: {
          icp: {
            select: {
              title: true,
              company: {
                select: {
                  name: true,
                  domain: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (activeRuns.length === 0) {
        console.log('[RunManager] No active runs found');
        return { recovered: 0, failed: 0, resumed: 0, details: [] };
      }

      console.log(`[RunManager] Found ${activeRuns.length} active runs`);

      const results: RecoveryResult = {
        recovered: 0,
        failed: 0,
        resumed: 0,
        details: [],
      };

      const cutoffTime = new Date(Date.now() - this.config.timeoutMinutes * 60 * 1000);

      // Process each active run
      for (const run of activeRuns) {
        const ageMinutes = Math.round(
          (Date.now() - new Date(run.createdAt).getTime()) / 1000 / 60
        );

        console.log(
          `[RunManager] Evaluating run ${run.id}: ` +
          `${run.status}, ${run.completed}/${run.totalProspects}, ` +
          `age: ${ageMinutes}min, company: ${run.icp.company.name}`
        );

        // Check if run is stuck (older than timeout)
        const isStuck = new Date(run.createdAt) < cutoffTime;

        if (isStuck) {
          // Attempt recovery based on run state
          if (this.shouldRetryRun(run)) {
            try {
              await this.resumeRun(run.id);
              results.resumed++;
              results.details.push({
                runId: run.id,
                action: 'resumed',
                reason: `Resumed stuck run (age: ${ageMinutes}min)`,
              });
            } catch (error) {
              await this.failRun(run.id, `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              results.failed++;
              results.details.push({
                runId: run.id,
                action: 'failed',
                reason: `Recovery attempt failed`,
              });
            }
          } else {
            // Mark as failed
            await this.failRun(run.id, `Stuck run marked as failed (age: ${ageMinutes}min)`);
            results.failed++;
            results.details.push({
              runId: run.id,
              action: 'failed',
              reason: `Stuck run exceeded retry limits`,
            });
          }
        } else {
          // Run is not stuck yet, but verify it's actually running
          const isHealthy = await this.verifyRunHealth(run.id);
          if (!isHealthy) {
            console.log(`[RunManager] Run ${run.id} appears unhealthy, attempting recovery`);
            try {
              await this.resumeRun(run.id);
              results.recovered++;
              results.details.push({
                runId: run.id,
                action: 'recovered',
                reason: 'Recovered unhealthy run',
              });
            } catch (error) {
              console.error(`[RunManager] Failed to recover unhealthy run ${run.id}:`, error);
            }
          }
        }
      }

      console.log(`[RunManager] Recovery completed: ${JSON.stringify(results)}`);
      return results;
    } catch (error) {
      console.error('[RunManager] Error during stuck run recovery:', error);
      throw error;
    }
  }

  /**
   * Get health status for all active runs
   */
  async getRunHealthStatus(): Promise<RunHealthStatus[]> {
    try {
      const activeRuns = await prisma.qualificationRun.findMany({
        where: {
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
        },
        select: {
          id: true,
          status: true,
          totalProspects: true,
          completed: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const cutoffTime = new Date(Date.now() - this.config.timeoutMinutes * 60 * 1000);

      return activeRuns.map(run => {
        const ageMinutes = Math.round(
          (Date.now() - new Date(run.createdAt).getTime()) / 1000 / 60
        );
        const progress = run.totalProspects > 0 ? (run.completed / run.totalProspects) * 100 : 0;
        const isStuck = new Date(run.createdAt) < cutoffTime;

        // Estimate time remaining based on current progress
        let estimatedTimeRemaining: number | undefined;
        if (run.completed > 0 && run.totalProspects > run.completed) {
          const timePerProspect = ageMinutes / run.completed;
          const remainingProspects = run.totalProspects - run.completed;
          estimatedTimeRemaining = Math.round(timePerProspect * remainingProspects);
        }

        return {
          runId: run.id,
          status: run.status,
          totalProspects: run.totalProspects,
          completed: run.completed,
          progress: Math.round(progress * 100) / 100,
          ageMinutes,
          isStuck,
          lastActivity: run.createdAt, // Use createdAt as proxy for last activity
          estimatedTimeRemaining,
        };
      });
    } catch (error) {
      console.error('[RunManager] Error getting run health status:', error);
      throw error;
    }
  }

  /**
   * Manually fail a specific run
   */
  async failRun(runId: string, reason: string): Promise<void> {
    try {
      console.log(`[RunManager] Failing run ${runId}: ${reason}`);
      
      await prisma.qualificationRun.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        },
      });

      // Log the failure reason (you might want to add a failures table for detailed tracking)
      console.log(`[RunManager] Run ${runId} marked as FAILED: ${reason}`);
    } catch (error) {
      console.error(`[RunManager] Error failing run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Attempt to resume a stuck run
   */
  async resumeRun(runId: string): Promise<void> {
    try {
      console.log(`[RunManager] Attempting to resume run ${runId}`);

      // Get the run details
      const run = await prisma.qualificationRun.findUnique({
        where: { id: runId },
        include: {
          icp: true,
          results: {
            where: {
              status: 'COMPLETED',
            },
            select: {
              domain: true,
            },
          },
        },
      });

      if (!run) {
        throw new Error(`Run ${runId} not found`);
      }

      // Get list of completed domains to avoid reprocessing
      const completedDomains = new Set(run.results.map(r => r.domain));
      
      // Get all domains that were supposed to be processed
      // Note: This assumes you store the original domain list somewhere
      // You might need to adjust this based on your data structure
      const allResults = await prisma.prospectQualification.findMany({
        where: { runId },
        select: { domain: true, status: true },
      });

      const pendingDomains = allResults
        .filter(r => r.status === 'PENDING' || r.status === 'ANALYZING')
        .map(r => r.domain);

      if (pendingDomains.length === 0) {
        // No pending work, mark as completed
        await prisma.qualificationRun.update({
          where: { id: runId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
        console.log(`[RunManager] Run ${runId} marked as completed (no pending work)`);
        return;
      }

      // Reset run to PROCESSING and restart with pending domains
      await prisma.qualificationRun.update({
        where: { id: runId },
        data: {
          status: 'PROCESSING',
        },
      });

      // Start background processing for pending domains
      const processor = getQualificationProcessor();
      const jobId = await processor.startQualification(
        run.id,
        run.userId,
        run.icpId,
        run.icp as any, // You might need to properly type this
        pendingDomains
      );

      console.log(`[RunManager] Resumed run ${runId} with job ${jobId} for ${pendingDomains.length} pending domains`);
    } catch (error) {
      console.error(`[RunManager] Error resuming run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup old completed runs and their results
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    try {
      console.log(`[RunManager] Cleaning up runs older than ${olderThanDays} days`);

      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      // Delete old completed runs (cascade will handle results)
      const result = await prisma.qualificationRun.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED'],
          },
          completedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`[RunManager] Cleaned up ${result.count} old runs`);
      return result.count;
    } catch (error) {
      console.error('[RunManager] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Verify if a run is actually healthy and making progress
   */
  private async verifyRunHealth(runId: string): Promise<boolean> {
    try {
      // Check if the run has made recent progress
      const recentResults = await prisma.prospectQualification.findMany({
        where: {
          runId,
          analyzedAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
          },
        },
        take: 1,
      });

      // If we have recent results, the run is healthy
      return recentResults.length > 0;
    } catch (error) {
      console.error(`[RunManager] Error verifying run health for ${runId}:`, error);
      return false;
    }
  }

  /**
   * Determine if a run should be retried or failed
   */
  private shouldRetryRun(run: any): boolean {
    // For now, simple logic: retry if some progress has been made
    // You could enhance this with retry count tracking in the database
    const hasProgress = run.completed > 0;
    const progressRatio = run.totalProspects > 0 ? run.completed / run.totalProspects : 0;
    
    // Retry if:
    // - Some progress has been made (at least 1 prospect completed)
    // - Progress is less than 90% (close to completion, worth finishing)
    return hasProgress && progressRatio < 0.9;
  }

  /**
   * Get manager statistics
   */
  async getStats(): Promise<{
    activeRuns: number;
    pendingRuns: number;
    processingRuns: number;
    recentlyCompleted: number;
    recentlyFailed: number;
    config: RunTimeoutConfig;
  }> {
    try {
      const [activeRuns, recentCompleted, recentFailed] = await Promise.all([
        prisma.qualificationRun.findMany({
          where: {
            status: {
              in: ['PENDING', 'PROCESSING'],
            },
          },
          select: { status: true },
        }),
        prisma.qualificationRun.count({
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
        prisma.qualificationRun.count({
          where: {
            status: 'FAILED',
            completedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      const pendingRuns = activeRuns.filter(r => r.status === 'PENDING').length;
      const processingRuns = activeRuns.filter(r => r.status === 'PROCESSING').length;

      return {
        activeRuns: activeRuns.length,
        pendingRuns,
        processingRuns,
        recentlyCompleted: recentCompleted,
        recentlyFailed: recentFailed,
        config: this.config,
      };
    } catch (error) {
      console.error('[RunManager] Error getting stats:', error);
      throw error;
    }
  }
}

// Singleton instance
let runManagerInstance: QualificationRunManager | undefined;

/**
 * Get the global run manager instance
 */
export function getRunManager(config?: Partial<RunTimeoutConfig>): QualificationRunManager {
  if (!runManagerInstance) {
    runManagerInstance = new QualificationRunManager(config);
  }
  return runManagerInstance;
}

/**
 * Initialize run manager with custom config
 */
export function initializeRunManager(config?: Partial<RunTimeoutConfig>): QualificationRunManager {
  if (runManagerInstance) {
    runManagerInstance.stop();
  }
  runManagerInstance = new QualificationRunManager(config);
  return runManagerInstance;
}