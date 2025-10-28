import { QualificationProcessor } from '../background-processor';
import { JobQueue, JobStatus } from '../job-queue';

// Simple test focusing on core job queue functionality
const mockQualifyProspects = jest.fn();
const mockPrismaUpdate = jest.fn();
const mockPrismaCreate = jest.fn();
const mockPrismaFindUnique = jest.fn();

jest.mock('../prospect-qualifier', () => ({
  qualifyProspects: mockQualifyProspects,
}));

jest.mock('../prisma', () => ({
  prisma: {
    qualificationRun: {
      findUnique: mockPrismaFindUnique,
      update: mockPrismaUpdate,
    },
    prospectQualification: {
      create: mockPrismaCreate,
    },
  },
}));

// Test data
const mockICP = {
  title: 'Test ICP',
  description: 'Test ICP description',
  buyerPersonas: [],
  companySize: {},
  industries: ['Technology'],
  geographicRegions: ['North America'],
  fundingStages: ['Series A'],
  keyIndicators: [],
  technographics: [],
};

describe('QualificationProcessor', () => {
  let processor: QualificationProcessor;
  let jobQueue: JobQueue;

  beforeEach(() => {
    jobQueue = new JobQueue({
      maxConcurrency: 1,
      retryDelay: 10,
      maxRetryDelay: 100,
      retryMultiplier: 2,
      cleanupInterval: 1000,
      maxJobAge: 500,
    });

    processor = new QualificationProcessor(jobQueue);
    jest.clearAllMocks();

    mockPrismaFindUnique.mockResolvedValue({
      id: 'run-123',
      status: 'PROCESSING',
      totalProspects: 2,
      completed: 0,
    });

    mockPrismaUpdate.mockResolvedValue({});
    mockPrismaCreate.mockResolvedValue({});

    mockQualifyProspects.mockImplementation(async (domains: string[], icp: any, progressCallback: Function) => {
      for (let i = 0; i < domains.length; i++) {
        await progressCallback(i, domains.length);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      await progressCallback(domains.length, domains.length);
      
      return [
        {
          prospectDomain: 'test1.com',
          prospectName: 'Test Company 1',
          prospectData: { domain: 'test1.com' },
          score: 85,
          fitLevel: 'EXCELLENT',
          reasoning: 'Great fit',
          matchedCriteria: ['industry'],
          gaps: [],
        }
      ];
    });
  });

  afterEach(() => {
    jobQueue.stop();
  });

  it('should start qualification jobs', async () => {
    const jobId = await processor.startQualification(
      'run-123',
      'user-123',
      'icp-123',
      mockICP,
      ['test1.com']
    );

    expect(jobId).toBeDefined();
    expect(jobId).toMatch(/^job_/);

    const job = processor.getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.type).toBe('qualify-prospects');
  });

  it('should process jobs successfully', async () => {
    const jobId = await processor.startQualification(
      'run-123',
      'user-123',
      'icp-123',
      mockICP,
      ['test1.com']
    );

    await new Promise(resolve => {
      jobQueue.on('job:completed', (job, result) => {
        if (job.id === jobId) {
          resolve(result);
        }
      });
    });

    const job = processor.getJob(jobId);
    expect(job?.status).toBe(JobStatus.COMPLETED);
  });

  it('should handle job failures', async () => {
    mockQualifyProspects.mockRejectedValue(new Error('Processing failed'));

    const jobId = await processor.startQualification(
      'run-123',
      'user-123',
      'icp-123',
      mockICP,
      ['test1.com']
    );

    await new Promise(resolve => {
      jobQueue.on('job:failed', (job, error) => {
        if (job.id === jobId) {
          resolve(error);
        }
      });
    });

    const job = processor.getJob(jobId);
    expect(job?.status).toBe(JobStatus.FAILED);
    expect(job?.error).toContain('Processing failed');
  });

  it('should provide queue statistics', () => {
    const stats = processor.getQueueStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('pending');
    expect(stats).toHaveProperty('processing');
    expect(stats).toHaveProperty('completed');
    expect(stats).toHaveProperty('failed');
    expect(stats).toHaveProperty('maxConcurrency', 1);
  });

  it('should filter jobs by user', async () => {
    const jobId1 = await processor.startQualification(
      'run-123',
      'user-123',
      'icp-123',
      mockICP,
      ['test1.com']
    );

    const jobId2 = await processor.startQualification(
      'run-456',
      'user-456',
      'icp-456',
      mockICP,
      ['test2.com']
    );

    const user123Jobs = processor.getUserJobs('user-123');
    const user456Jobs = processor.getUserJobs('user-456');

    expect(user123Jobs.length).toBe(1);
    expect(user123Jobs[0].id).toBe(jobId1);
    expect(user456Jobs.length).toBe(1);
    expect(user456Jobs[0].id).toBe(jobId2);
  });

  it('should allow job cancellation', async () => {
    const jobId = await processor.startQualification(
      'run-123',
      'user-123',
      'icp-123',
      mockICP,
      ['test1.com']
    );

    const cancelled = await processor.cancelJob(jobId);
    expect(cancelled).toBe(true);

    const job = processor.getJob(jobId);
    expect(job?.status).toBe(JobStatus.FAILED);
    expect(job?.error).toContain('cancelled');
  });
});