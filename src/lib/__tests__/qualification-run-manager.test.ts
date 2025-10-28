import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('QualificationRunManager', () => {
  let runManager: any;

  beforeEach(() => {
    // Simple mock objects for testing
    const mockPrisma = {
      qualificationRun: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      prospectQualification: {
        findMany: jest.fn(),
      },
    };

    const mockProcessor = {
      startQualification: jest.fn(),
    };

    // Mock the dependencies
    jest.doMock('../prisma', () => ({
      prisma: mockPrisma,
    }));

    jest.doMock('../background-processor', () => ({
      getQualificationProcessor: () => mockProcessor,
    }));

    // Import the class after mocking
    const { QualificationRunManager } = require('../qualification-run-manager');
    
    runManager = new QualificationRunManager({
      timeoutMinutes: 10, // Short timeout for testing
      checkIntervalMinutes: 1,
      maxRetries: 2,
    });
  });

  afterEach(() => {
    if (runManager && runManager.stop) {
      runManager.stop();
    }
    jest.resetModules();
  });

  describe('initialization', () => {
    it('should create manager instance with config', () => {
      expect(runManager).toBeDefined();
      expect(typeof runManager.start).toBe('function');
      expect(typeof runManager.stop).toBe('function');
      expect(typeof runManager.checkTimeouts).toBe('function');
      expect(typeof runManager.recoverStuckRuns).toBe('function');
    });

    it('should start and stop manager without errors', () => {
      expect(() => runManager.start()).not.toThrow();
      expect(() => runManager.stop()).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return basic stats structure', async () => {
      const mockPrisma = require('../prisma').prisma;
      
      mockPrisma.qualificationRun.findMany.mockResolvedValue([
        { status: 'PENDING' },
        { status: 'PROCESSING' },
        { status: 'PROCESSING' },
      ]);

      mockPrisma.qualificationRun.count
        .mockResolvedValueOnce(10) // Recently completed
        .mockResolvedValueOnce(2); // Recently failed

      const stats = await runManager.getStats();

      expect(stats).toMatchObject({
        activeRuns: 3,
        pendingRuns: 1,
        processingRuns: 2,
        recentlyCompleted: 10,
        recentlyFailed: 2,
        config: expect.any(Object),
      });
    });
  });

  describe('cleanup', () => {
    it('should delete old completed runs', async () => {
      const mockPrisma = require('../prisma').prisma;
      mockPrisma.qualificationRun.deleteMany.mockResolvedValue({ count: 5 });

      const deletedCount = await runManager.cleanup(30);

      expect(deletedCount).toBe(5);
      expect(mockPrisma.qualificationRun.deleteMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED'],
          },
          completedAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('failRun', () => {
    it('should mark run as failed', async () => {
      const mockPrisma = require('../prisma').prisma;
      mockPrisma.qualificationRun.update.mockResolvedValue({});

      await runManager.failRun('run-123', 'Test failure reason');

      expect(mockPrisma.qualificationRun.update).toHaveBeenCalledWith({
        where: { id: 'run-123' },
        data: {
          status: 'FAILED',
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getRunHealthStatus', () => {
    it('should return health status for active runs', async () => {
      const mockPrisma = require('../prisma').prisma;
      
      const activeRuns = [
        {
          id: 'run-1',
          status: 'PROCESSING',
          totalProspects: 100,
          completed: 75,
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (not stuck)
        },
        {
          id: 'run-2',
          status: 'PENDING',
          totalProspects: 50,
          completed: 0,
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago (stuck)
        },
      ];

      mockPrisma.qualificationRun.findMany.mockResolvedValue(activeRuns);

      const healthStatuses = await runManager.getRunHealthStatus();

      expect(healthStatuses).toHaveLength(2);
      
      // First run - healthy and making progress
      expect(healthStatuses[0]).toMatchObject({
        runId: 'run-1',
        status: 'PROCESSING',
        totalProspects: 100,
        completed: 75,
        progress: 75,
        ageMinutes: 5,
        isStuck: false,
        estimatedTimeRemaining: expect.any(Number),
      });

      // Second run - stuck
      expect(healthStatuses[1]).toMatchObject({
        runId: 'run-2',
        status: 'PENDING',
        totalProspects: 50,
        completed: 0,
        progress: 0,
        ageMinutes: 15,
        isStuck: true,
        estimatedTimeRemaining: undefined,
      });
    });
  });
});