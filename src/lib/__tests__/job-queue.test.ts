import { JobQueue, JobStatus, JobProcessor, JobProgress, QualifyProspectsJobData, AnalyzeDomainJobData } from '../job-queue';

// Test data factories
const createMockQualifyJobData = (overrides: Partial<QualifyProspectsJobData> = {}): QualifyProspectsJobData => ({
  runId: 'test-run-123',
  userId: 'user-123',
  icpId: 'icp-123',
  icp: {
    title: 'Test ICP',
    description: 'Test ICP description',
    buyerPersonas: [],
    companySize: {},
    industries: ['Technology'],
    geographicRegions: ['North America'],
    fundingStages: ['Series A'],
    keyIndicators: [],
    technographics: [],
  },
  domains: ['test1.com', 'test2.com'],
  ...overrides,
});

const createMockAnalyzeJobData = (overrides: Partial<AnalyzeDomainJobData> = {}): AnalyzeDomainJobData => ({
  domain: 'test.com',
  userId: 'user-123',
  companyId: 'company-123',
  ...overrides,
});

// Mock processors for testing
const mockSuccessProcessor: JobProcessor = async (job, updateProgress) => {
  await updateProgress({ completed: 0, total: 3, message: 'Starting...' });
  await new Promise(resolve => setTimeout(resolve, 10));
  await updateProgress({ completed: 1, total: 3, message: 'Progress 1/3' });
  await new Promise(resolve => setTimeout(resolve, 10));
  await updateProgress({ completed: 2, total: 3, message: 'Progress 2/3' });
  await new Promise(resolve => setTimeout(resolve, 10));
  await updateProgress({ completed: 3, total: 3, message: 'Completed' });
  
  return {
    success: true,
    data: { result: 'test-success', processedAt: new Date() },
  };
};

const mockFailProcessor: JobProcessor = async (job, updateProgress) => {
  await updateProgress({ completed: 0, total: 1, message: 'Starting...' });
  await new Promise(resolve => setTimeout(resolve, 10));
  throw new Error('Test processor failure');
};

const mockSlowProcessor: JobProcessor = async (job, updateProgress) => {
  await updateProgress({ completed: 0, total: 2, message: 'Slow processing...' });
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateProgress({ completed: 1, total: 2, message: 'Still processing...' });
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateProgress({ completed: 2, total: 2, message: 'Finally done' });
  
  return {
    success: true,
    data: { result: 'slow-success' },
  };
};

describe('JobQueue', () => {
  let jobQueue: JobQueue;

  beforeEach(() => {
    // Create a new job queue with fast settings for testing
    jobQueue = new JobQueue({
      maxConcurrency: 2,
      retryDelay: 10,
      maxRetryDelay: 100,
      retryMultiplier: 2,
      cleanupInterval: 1000,
      maxJobAge: 500,
    });
  });

  afterEach(() => {
    jobQueue.stop();
  });

  describe('Job Enqueueing', () => {
    it('should enqueue qualification jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());

      expect(jobId).toBeDefined();
      expect(jobId).toMatch(/^job_/);

      const job = jobQueue.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe(JobStatus.PENDING);
      expect(job?.type).toBe('qualify-prospects');
    });

    it('should assign unique IDs to jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId1 = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData({ runId: 'run-1' }));
      const jobId2 = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData({ runId: 'run-2' }));

      expect(jobId1).not.toBe(jobId2);
    });

    it('should set correct initial job properties', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData(), {
        maxAttempts: 5,
        delay: 1000,
      });

      const job = jobQueue.getJob(jobId);
      expect(job?.maxAttempts).toBe(5);
      expect(job?.delay).toBe(1000);
      expect(job?.attempts).toBe(0);
      expect(job?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Job Processing', () => {
    it('should process jobs with progress updates', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for processing to complete
      await new Promise(resolve => {
        jobQueue.on('job:completed', (job, result) => {
          if (job.id === jobId) {
            resolve(result);
          }
        });
      });

      const job = jobQueue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.COMPLETED);
      expect(job?.completedAt).toBeInstanceOf(Date);
      expect(job?.progress?.completed).toBe(3);
      expect(job?.progress?.total).toBe(3);
    });

    it('should respect concurrency limits', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSlowProcessor);
      
      const startTime = Date.now();
      const jobPromises = [];

      // Enqueue 4 jobs (more than concurrency limit of 2)
      for (let i = 0; i < 4; i++) {
        const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData({ runId: `run-${i}` }));
        
        jobPromises.push(new Promise(resolve => {
          jobQueue.on('job:completed', (job, result) => {
            if (job.id === jobId) {
              resolve({ jobId, completedAt: Date.now() });
            }
          });
        }));
      }

      // Wait for all jobs to complete
      const results = await Promise.all(jobPromises) as Array<{ jobId: string; completedAt: number }>;
      
      // Sort by completion time
      results.sort((a, b) => a.completedAt - b.completedAt);

      // First two should complete around the same time (within concurrency limit)
      // Next two should complete later (after first batch)
      const firstBatchTime = results[1].completedAt - startTime;
      const secondBatchTime = results[3].completedAt - startTime;
      
      expect(secondBatchTime).toBeGreaterThan(firstBatchTime + 50); // Some buffer for timing
    });

    it('should emit correct events during processing', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const events: Array<{ event: string; jobId: string }> = [];
      
      jobQueue.on('job:created', (job) => {
        events.push({ event: 'created', jobId: job.id });
      });
      
      jobQueue.on('job:started', (job) => {
        events.push({ event: 'started', jobId: job.id });
      });
      
      jobQueue.on('job:progress', (job, progress) => {
        events.push({ event: 'progress', jobId: job.id });
      });
      
      jobQueue.on('job:completed', (job, result) => {
        events.push({ event: 'completed', jobId: job.id });
      });

      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for completion
      await new Promise(resolve => {
        jobQueue.on('job:completed', (job) => {
          if (job.id === jobId) resolve(job);
        });
      });

      // Check that events were emitted in correct order
      const jobEvents = events.filter(e => e.jobId === jobId);
      expect(jobEvents[0].event).toBe('created');
      expect(jobEvents[1].event).toBe('started');
      expect(jobEvents.some(e => e.event === 'progress')).toBe(true);
      expect(jobEvents[jobEvents.length - 1].event).toBe('completed');
    });
  });

  describe('Error Handling and Retries', () => {
    it('should retry failed jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockFailProcessor);
      
      const retryEvents: Array<{ jobId: string; attempt: number }> = [];
      jobQueue.on('job:retry', (job, attempt) => {
        retryEvents.push({ jobId: job.id, attempt });
      });

      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData(), {
        maxAttempts: 3,
      });
      
      // Wait for final failure
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout waiting for job to fail'));
        }, 2000);
        
        jobQueue.on('job:failed', (job) => {
          if (job.id === jobId) {
            clearTimeout(timeout);
            resolve(job);
          }
        });
      });

      const job = jobQueue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.FAILED);
      expect(job?.attempts).toBe(3); // Should have attempted 3 times
      expect(job?.error).toContain('Test processor failure');
      
      // Should have retried 2 times (after first failure)
      const jobRetries = retryEvents.filter(e => e.jobId === jobId);
      expect(jobRetries).toHaveLength(2);
    }, 10000);

    it('should use exponential backoff for retries', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockFailProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData(), {
        maxAttempts: 3,
      });
      
      // Track retry delays
      const retryDelays: number[] = [];
      jobQueue.on('job:retry', (job) => {
        if (job.id === jobId) {
          retryDelays.push(job.delay);
        }
      });

      // Wait for final failure
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout waiting for job to fail'));
        }, 2000);
        
        jobQueue.on('job:failed', (job) => {
          if (job.id === jobId) {
            clearTimeout(timeout);
            resolve(job);
          }
        });
      });

      // Verify exponential backoff (each delay should be roughly double the previous)
      expect(retryDelays).toHaveLength(2);
      expect(retryDelays[1]).toBeGreaterThan(retryDelays[0]);
      expect(retryDelays[1]).toBeLessThanOrEqual(retryDelays[0] * 2.1); // Allow small variance
    }, 10000);

    it('should handle processor errors gracefully', async () => {
      // Don't register any processor
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for failure
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout waiting for job to fail'));
        }, 2000);
        
        jobQueue.on('job:failed', (job) => {
          if (job.id === jobId) {
            clearTimeout(timeout);
            resolve(job);
          }
        });
      });

      const job = jobQueue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.FAILED);
      expect(job?.error).toContain('No processor registered');
    }, 10000);
  });

  describe('Job Management', () => {
    it('should get jobs by status', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      jobQueue.registerProcessor('analyze-domain', mockFailProcessor);
      
      const jobId1 = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      const jobId2 = await jobQueue.enqueue('analyze-domain', createMockAnalyzeJobData(), { maxAttempts: 1 });
      
      // Wait for both to process
      await Promise.all([
        new Promise(resolve => {
          jobQueue.on('job:completed', (job) => {
            if (job.id === jobId1) resolve(job);
          });
        }),
        new Promise(resolve => {
          jobQueue.on('job:failed', (job) => {
            if (job.id === jobId2) resolve(job);
          });
        }),
      ]);

      const completedJobs = jobQueue.getJobsByStatus(JobStatus.COMPLETED);
      const failedJobs = jobQueue.getJobsByStatus(JobStatus.FAILED);
      
      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].id).toBe(jobId1);
      
      expect(failedJobs).toHaveLength(1);
      expect(failedJobs[0].id).toBe(jobId2);
    });

    it('should cancel pending jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSlowProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Cancel immediately before processing starts
      const cancelled = await jobQueue.cancelJob(jobId);
      expect(cancelled).toBe(true);

      const job = jobQueue.getJob(jobId);
      expect(job?.status).toBe(JobStatus.FAILED);
      expect(job?.error).toContain('cancelled');
    });

    it('should not cancel running jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSlowProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for job to start
      await new Promise(resolve => {
        jobQueue.on('job:started', (job) => {
          if (job.id === jobId) resolve(job);
        });
      });

      // Try to cancel running job
      const cancelled = await jobQueue.cancelJob(jobId);
      expect(cancelled).toBe(false);
    });

    it('should provide accurate queue statistics', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSlowProcessor);
      jobQueue.registerProcessor('analyze-domain', mockSuccessProcessor);
      
      // Enqueue multiple jobs
      await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData({ runId: 'run-1' }));
      await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData({ runId: 'run-2' }));
      await jobQueue.enqueue('analyze-domain', createMockAnalyzeJobData());
      
      // Wait a moment for some processing to start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const stats = jobQueue.getStats();
      expect(stats.total).toBe(3);
      expect(stats.maxConcurrency).toBe(2);
      expect(stats.pending + stats.processing + stats.completed).toBe(3);
    });
  });

  describe('Cleanup', () => {
    it('should clean up old completed jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for completion
      await new Promise(resolve => {
        jobQueue.on('job:completed', (job) => {
          if (job.id === jobId) resolve(job);
        });
      });

      // Manually set completion time to be old
      const job = jobQueue.getJob(jobId);
      if (job) {
        job.completedAt = new Date(Date.now() - 1000); // 1 second ago
      }

      // Run cleanup
      const cleaned = jobQueue.cleanup();
      
      expect(cleaned).toBe(1);
      expect(jobQueue.getJob(jobId)).toBeUndefined();
    });

    it('should not clean up recent jobs', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for completion
      await new Promise(resolve => {
        jobQueue.on('job:completed', (job) => {
          if (job.id === jobId) resolve(job);
        });
      });

      // Run cleanup immediately (job should still be recent)
      const cleaned = jobQueue.cleanup();
      
      expect(cleaned).toBe(0);
      expect(jobQueue.getJob(jobId)).toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should track and update job progress', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSuccessProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      const progressUpdates: JobProgress[] = [];
      jobQueue.on('job:progress', (job, progress) => {
        if (job.id === jobId) {
          progressUpdates.push({ ...progress });
        }
      });
      
      // Wait for completion
      await new Promise(resolve => {
        jobQueue.on('job:completed', (job) => {
          if (job.id === jobId) resolve(job);
        });
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].completed).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].completed).toBe(3);
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].completed).toBeGreaterThanOrEqual(progressUpdates[i - 1].completed);
      }
    });

    it('should provide current progress via getProgress', async () => {
      jobQueue.registerProcessor('qualify-prospects', mockSlowProcessor);
      
      const jobId = await jobQueue.enqueue('qualify-prospects', createMockQualifyJobData());
      
      // Wait for job to start and make some progress
      await new Promise(resolve => {
        jobQueue.on('job:progress', (job, progress) => {
          if (job.id === jobId && progress.completed > 0) {
            resolve(progress);
          }
        });
      });

      const currentProgress = jobQueue.getProgress(jobId);
      expect(currentProgress).toBeDefined();
      expect(currentProgress?.completed).toBeGreaterThan(0);
      expect(currentProgress?.total).toBe(2);
    });
  });
});