import { EventEmitter } from 'events';
import type { ICPData } from '@/lib/icp-generator';

// Job types
export type JobType = 'qualify-prospects' | 'analyze-domain' | 'generate-icp';

// Job status
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

// Base job interface
export interface BaseJob {
  id: string;
  type: JobType;
  status: JobStatus;
  data: any;
  attempts: number;
  maxAttempts: number;
  delay: number; // delay in milliseconds for retries
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  progress?: JobProgress;
}

// Job progress tracking
export interface JobProgress {
  completed: number;
  total: number;
  message?: string;
  details?: any;
}

// Specific job data types
export interface QualifyProspectsJobData {
  runId: string;
  userId: string;
  icpId: string;
  icp: ICPData;
  domains: string[];
}

export interface AnalyzeDomainJobData {
  domain: string;
  userId: string;
  companyId?: string;
}

export interface GenerateICPJobData {
  companyId: string;
  userId: string;
  companyData: any;
}

// Union type for all job data
export type JobData = QualifyProspectsJobData | AnalyzeDomainJobData | GenerateICPJobData;

// Job result interface
export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number; // execution time in milliseconds
}

// Job processor function type
export type JobProcessor<T extends JobData = JobData, R = any> = (
  job: BaseJob & { data: T },
  updateProgress: (progress: JobProgress) => Promise<void>
) => Promise<JobResult<R>>;

// Job queue configuration
export interface JobQueueConfig {
  maxConcurrency: number;
  retryDelay: number; // base delay for retries in milliseconds
  maxRetryDelay: number; // maximum delay for retries
  retryMultiplier: number; // exponential backoff multipliplier
  cleanupInterval: number; // interval to clean up old jobs in milliseconds
  maxJobAge: number; // maximum age of completed jobs before cleanup in milliseconds
}

// Default configuration
export const DEFAULT_JOB_QUEUE_CONFIG: JobQueueConfig = {
  maxConcurrency: 3,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  retryMultiplier: 2,
  cleanupInterval: 60000, // 1 minute
  maxJobAge: 3600000, // 1 hour
};

// Job queue events
export interface JobQueueEvents {
  'job:created': [job: BaseJob];
  'job:started': [job: BaseJob];
  'job:progress': [job: BaseJob, progress: JobProgress];
  'job:completed': [job: BaseJob, result: JobResult];
  'job:failed': [job: BaseJob, error: string];
  'job:retry': [job: BaseJob, attempt: number];
  'queue:drained': [];
  'queue:error': [error: Error];
}

/**
 * In-memory job queue implementation with retry logic and progress tracking
 */
export class JobQueue extends EventEmitter {
  private jobs = new Map<string, BaseJob>();
  private processors = new Map<JobType, JobProcessor>();
  private activeJobs = new Set<string>();
  private config: JobQueueConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private processing = false;

  constructor(config: Partial<JobQueueConfig> = {}) {
    super();
    this.config = { ...DEFAULT_JOB_QUEUE_CONFIG, ...config };
    this.startCleanupTimer();
  }

  /**
   * Register a job processor for a specific job type
   */
  registerProcessor<T extends JobData, R = any>(
    type: JobType,
    processor: JobProcessor<T, R>
  ): void {
    this.processors.set(type, processor as JobProcessor);
  }

  /**
   * Add a job to the queue
   */
  async enqueue<T extends JobData>(
    type: JobType,
    data: T,
    options: {
      maxAttempts?: number;
      delay?: number;
    } = {}
  ): Promise<string> {
    const job: BaseJob = {
      id: this.generateJobId(),
      type,
      status: JobStatus.PENDING,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      delay: options.delay || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.emit('job:created', job);

    // Start processing if not already running
    if (!this.processing) {
      setImmediate(() => this.processJobs());
    }

    return job.id;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): BaseJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get job progress
   */
  getProgress(jobId: string): JobProgress | undefined {
    const job = this.jobs.get(jobId);
    return job?.progress;
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): BaseJob[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  /**
   * Get all jobs for a specific user
   */
  getJobsByUser(userId: string): BaseJob[] {
    return Array.from(this.jobs.values()).filter(job => {
      const data = job.data as any;
      return data.userId === userId;
    });
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === JobStatus.PENDING) {
      job.status = JobStatus.FAILED;
      job.error = 'Job cancelled';
      job.updatedAt = new Date();
      job.completedAt = new Date();
      return true;
    }

    return false; // Cannot cancel running or completed jobs
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
      processing: jobs.filter(j => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      retrying: jobs.filter(j => j.status === JobStatus.RETRYING).length,
      activeJobs: this.activeJobs.size,
      maxConcurrency: this.config.maxConcurrency,
    };
  }

  /**
   * Clear all completed and failed jobs
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) &&
        job.completedAt &&
        (now - job.completedAt.getTime()) > this.config.maxJobAge
      ) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Stop the job queue and cleanup
   */
  stop(): void {
    this.processing = false;
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  // Private methods

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      try {
        const cleaned = this.cleanup();
        if (cleaned > 0) {
          console.log(`[JobQueue] Cleaned up ${cleaned} old jobs`);
        }
      } catch (error) {
        console.error('[JobQueue] Error during cleanup:', error);
      }
    }, this.config.cleanupInterval);
  }

  private async processJobs(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (true) {
        // Check if we can process more jobs
        if (this.activeJobs.size >= this.config.maxConcurrency) {
          await this.delay(100); // Wait a bit before checking again
          continue;
        }

        // Find next job to process
        const job = this.getNextJob();
        if (!job) {
          // No jobs available, check for retry jobs
          const retryJob = this.getRetryJob();
          if (!retryJob) {
            break; // No jobs to process
          }
          this.processJob(retryJob);
        } else {
          this.processJob(job);
        }
      }

      this.emit('queue:drained');
    } catch (error) {
      console.error('[JobQueue] Error processing jobs:', error);
      this.emit('queue:error', error as Error);
    } finally {
      this.processing = false;
    }
  }

  private getNextJob(): BaseJob | undefined {
    return Array.from(this.jobs.values())
      .filter(job => job.status === JobStatus.PENDING)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  }

  private getRetryJob(): BaseJob | undefined {
    const now = Date.now();
    return Array.from(this.jobs.values())
      .filter(job => 
        job.status === JobStatus.RETRYING && 
        (!job.updatedAt || (now - job.updatedAt.getTime()) >= job.delay)
      )
      .sort((a, b) => a.updatedAt!.getTime() - b.updatedAt!.getTime())[0];
  }

  private async processJob(job: BaseJob): Promise<void> {
    this.activeJobs.add(job.id);
    
    try {
      // Update job status
      job.status = JobStatus.PROCESSING;
      job.startedAt = new Date();
      job.updatedAt = new Date();
      job.attempts++;
      this.emit('job:started', job);

      // Get processor
      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }

      // Progress update function
      const updateProgress = async (progress: JobProgress) => {
        job.progress = progress;
        job.updatedAt = new Date();
        this.emit('job:progress', job, progress);
      };

      // Process the job
      const startTime = Date.now();
      const result = await processor(job, updateProgress);
      const duration = Date.now() - startTime;

      if (result.success) {
        // Job completed successfully
        job.status = JobStatus.COMPLETED;
        job.completedAt = new Date();
        job.updatedAt = new Date();
        this.emit('job:completed', job, { ...result, duration });
      } else {
        // Job failed
        throw new Error(result.error || 'Job failed with unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[JobQueue] Job ${job.id} failed:`, errorMessage);

      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        // Schedule retry
        job.status = JobStatus.RETRYING;
        job.error = errorMessage;
        job.delay = Math.min(
          this.config.retryDelay * Math.pow(this.config.retryMultiplier, job.attempts - 1),
          this.config.maxRetryDelay
        );
        job.updatedAt = new Date();
        this.emit('job:retry', job, job.attempts);

        // Continue processing other jobs
        setImmediate(() => this.processJobs());
      } else {
        // Max attempts reached, mark as failed
        job.status = JobStatus.FAILED;
        job.error = errorMessage;
        job.completedAt = new Date();
        job.updatedAt = new Date();
        this.emit('job:failed', job, errorMessage);
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let jobQueueInstance: JobQueue | undefined;

/**
 * Get the global job queue instance
 */
export function getJobQueue(): JobQueue {
  if (!jobQueueInstance) {
    jobQueueInstance = new JobQueue();
  }
  return jobQueueInstance;
}

/**
 * Initialize job queue with custom configuration
 */
export function initializeJobQueue(config?: Partial<JobQueueConfig>): JobQueue {
  if (jobQueueInstance) {
    jobQueueInstance.stop();
  }
  jobQueueInstance = new JobQueue(config);
  return jobQueueInstance;
}