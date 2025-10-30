import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock environment
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.OPENAI_API_KEY = 'test-key';

// Create test database connection
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// Performance measurement utilities
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { avg, min, max, p50, p95, p99, count: values.length };
  }

  clear() {
    this.metrics.clear();
  }

  getMetrics(label: string): number[] {
    return this.metrics.get(label) || [];
  }

  report() {
    console.log('\n📊 Performance Report:');
    console.log('=' .repeat(60));
    
    for (const [label, values] of this.metrics) {
      const stats = this.getStats(label);
      if (stats) {
        console.log(`\n${label}:`);
        console.log(`  Count: ${stats.count}`);
        console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
        console.log(`  Min: ${stats.min.toFixed(2)}ms`);
        console.log(`  Max: ${stats.max.toFixed(2)}ms`);
        console.log(`  P50: ${stats.p50.toFixed(2)}ms`);
        console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
        console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
      }
    }
    console.log('=' .repeat(60));
  }
}

// Test data generators
const generateUser = (index = 0) => ({
  email: `perf-user-${index}-${Math.random().toString(36).substring(7)}@example.com`,
  name: `Performance User ${index}`,
  role: 'USER' as const,
});

const generateCompany = (userId: string, index = 0) => ({
  domain: `perf-company-${index}-${Math.random().toString(36).substring(7)}.com`,
  name: `Performance Company ${index}`,
  description: `Company ${index} for performance testing`,
  industry: 'Technology',
  size: '50-200',
  userId,
  websiteData: {
    title: `Company ${index}`,
    description: `Description for company ${index}`,
    technologies: ['React', 'Node.js', 'PostgreSQL'],
  },
  aiAnalysis: {
    businessModel: 'B2B SaaS',
    targetMarket: 'Enterprise',
    challenges: ['Market competition', 'Customer acquisition'],
  }
});

const generateICP = (companyId: string, index = 0) => ({
  companyId,
  title: `Performance ICP ${index}`,
  description: `ICP ${index} for performance testing`,
  buyerPersonas: [{
    role: `Decision Maker ${index}`,
    painPoints: [`Pain point ${index}`],
    goals: [`Goal ${index}`]
  }],
  companySize: {
    minEmployees: 10,
    maxEmployees: 1000,
    minRevenue: 1000000,
    maxRevenue: 100000000
  },
  industries: ['Technology', 'Software'],
  geographicRegions: ['North America', 'Europe'],
  fundingStages: ['Series A', 'Series B'],
});

describe('Performance Benchmarks', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeAll(async () => {
    await testPrisma.$connect();
    performanceMonitor = new PerformanceMonitor();
  });

  afterAll(async () => {
    performanceMonitor.report();
    await testPrisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanTestDatabase();
  });

  describe('Database Performance Benchmarks', () => {
    it('should handle user creation performance', async () => {
      console.log('🔥 Testing user creation performance...');

      const userCount = 100;
      const endTimer = performanceMonitor.startTimer('User Creation (Individual)');

      // Test individual user creation performance
      for (let i = 0; i < userCount; i++) {
        const userTimer = performanceMonitor.startTimer('Single User Creation');
        await testPrisma.user.create({
          data: generateUser(i)
        });
        userTimer();
      }

      const totalTime = endTimer();
      const avgTime = totalTime / userCount;
      
      console.log(`✓ Created ${userCount} users in ${totalTime.toFixed(2)}ms`);
      console.log(`✓ Average time per user: ${avgTime.toFixed(2)}ms`);

      // Performance assertions
      expect(avgTime).toBeLessThan(50); // Less than 50ms per user
      expect(totalTime).toBeLessThan(5000); // Total under 5 seconds

      // Test batch creation performance
      const batchTimer = performanceMonitor.startTimer('User Creation (Batch)');
      const batchUsers = Array.from({ length: 50 }, (_, i) => generateUser(i + userCount));
      
      await testPrisma.user.createMany({
        data: batchUsers
      });
      
      const batchTime = batchTimer();
      console.log(`✓ Batch created 50 users in ${batchTime.toFixed(2)}ms`);
      
      expect(batchTime).toBeLessThan(1000); // Batch should be faster
    });

    it('should handle company creation with relationships', async () => {
      console.log('🔥 Testing company creation performance...');

      // Create test users first
      const users = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          testPrisma.user.create({ data: generateUser(i) })
        )
      );

      const companyCount = 50;
      const endTimer = performanceMonitor.startTimer('Company Creation');

      for (let i = 0; i < companyCount; i++) {
        const companyTimer = performanceMonitor.startTimer('Single Company Creation');
        await testPrisma.company.create({
          data: generateCompany(users[i % users.length].id, i)
        });
        companyTimer();
      }

      const totalTime = endTimer();
      const avgTime = totalTime / companyCount;

      console.log(`✓ Created ${companyCount} companies in ${totalTime.toFixed(2)}ms`);
      console.log(`✓ Average time per company: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100); // Less than 100ms per company
      expect(totalTime).toBeLessThan(10000); // Total under 10 seconds
    });

    it('should handle ICP generation performance', async () => {
      console.log('🔥 Testing ICP generation performance...');

      // Setup test data
      const user = await testPrisma.user.create({ data: generateUser() });
      const companies = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          testPrisma.company.create({
            data: generateCompany(user.id, i)
          })
        )
      );

      const icpCount = 20;
      const endTimer = performanceMonitor.startTimer('ICP Generation');

      for (let i = 0; i < icpCount; i++) {
        const icpTimer = performanceMonitor.startTimer('Single ICP Generation');
        await testPrisma.iCP.create({
          data: generateICP(companies[i].id, i)
        });
        icpTimer();
      }

      const totalTime = endTimer();
      const avgTime = totalTime / icpCount;

      console.log(`✓ Generated ${icpCount} ICPs in ${totalTime.toFixed(2)}ms`);
      console.log(`✓ Average time per ICP: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(200); // Less than 200ms per ICP
      expect(totalTime).toBeLessThan(5000); // Total under 5 seconds
    });

    it('should handle qualification run performance', async () => {
      console.log('🔥 Testing qualification run performance...');

      // Setup test data
      const user = await testPrisma.user.create({ data: generateUser() });
      const company = await testPrisma.company.create({
        data: generateCompany(user.id)
      });
      const icp = await testPrisma.iCP.create({
        data: generateICP(company.id)
      });

      const runCount = 30;
      const prospectsPerRun = 10;
      const endTimer = performanceMonitor.startTimer('Qualification Runs');

      for (let i = 0; i < runCount; i++) {
        const runTimer = performanceMonitor.startTimer('Single Qualification Run');
        
        // Create qualification run
        const run = await testPrisma.qualificationRun.create({
          data: {
            icpId: icp.id,
            userId: user.id,
            status: 'PROCESSING',
            totalProspects: prospectsPerRun,
            completed: 0,
          }
        });

        // Create prospect qualifications
        const prospects = Array.from({ length: prospectsPerRun }, (_, j) => ({
          runId: run.id,
          domain: `prospect-${i}-${j}.com`,
          companyName: `Prospect ${i}-${j}`,
          score: Math.floor(Math.random() * 100),
          fitLevel: 'GOOD' as const,
          reasoning: `Prospect ${i}-${j} qualification reasoning`,
          matchedCriteria: { industry: true },
          gaps: { size: false },
          status: 'COMPLETED' as const,
        }));

        await testPrisma.prospectQualification.createMany({
          data: prospects
        });

        // Update run status
        await testPrisma.qualificationRun.update({
          where: { id: run.id },
          data: {
            status: 'COMPLETED',
            completed: prospectsPerRun,
            completedAt: new Date(),
          }
        });

        runTimer();
      }

      const totalTime = endTimer();
      const avgTime = totalTime / runCount;

      console.log(`✓ Completed ${runCount} qualification runs in ${totalTime.toFixed(2)}ms`);
      console.log(`✓ Average time per run: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(500); // Less than 500ms per run
      expect(totalTime).toBeLessThan(20000); // Total under 20 seconds
    });
  });

  describe('Query Performance Benchmarks', () => {
    beforeEach(async () => {
      // Setup large dataset for query testing
      await setupLargeDataset();
    });

    it('should handle complex queries efficiently', async () => {
      console.log('🔥 Testing complex query performance...');

      // Test 1: Companies with ICPs and recent runs
      const query1Timer = performanceMonitor.startTimer('Complex Query - Companies with ICPs');
      
      const companiesWithICPs = await testPrisma.company.findMany({
        include: {
          icps: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              icps: true,
            }
          }
        },
        take: 50,
      });

      query1Timer();
      console.log(`✓ Queried ${companiesWithICPs.length} companies with ICPs`);

      // Test 2: Qualification runs with full relationships
      const query2Timer = performanceMonitor.startTimer('Complex Query - Qualification Runs');
      
      const qualificationRuns = await testPrisma.qualificationRun.findMany({
        include: {
          icp: {
            include: {
              company: true,
            }
          },
          results: {
            take: 5,
            orderBy: { score: 'desc' }
          },
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      query2Timer();
      console.log(`✓ Queried ${qualificationRuns.length} qualification runs with relationships`);

      // Test 3: Aggregation queries
      const query3Timer = performanceMonitor.startTimer('Aggregation Query');
      
      const stats = await testPrisma.prospectQualification.aggregate({
        _avg: { score: true },
        _count: { id: true },
        _min: { score: true },
        _max: { score: true },
      });

      query3Timer();
      console.log(`✓ Computed aggregation stats: avg=${stats._avg.score?.toFixed(2)}, count=${stats._count.id}`);

      // Performance assertions
      const query1Stats = performanceMonitor.getStats('Complex Query - Companies with ICPs');
      const query2Stats = performanceMonitor.getStats('Complex Query - Qualification Runs');
      const query3Stats = performanceMonitor.getStats('Aggregation Query');

      expect(query1Stats?.avg).toBeLessThan(1000); // Less than 1 second
      expect(query2Stats?.avg).toBeLessThan(2000); // Less than 2 seconds
      expect(query3Stats?.avg).toBeLessThan(500); // Less than 0.5 seconds
    });

    it('should handle pagination efficiently', async () => {
      console.log('🔥 Testing pagination performance...');

      const pageSize = 20;
      const totalPages = 10;

      for (let page = 0; page < totalPages; page++) {
        const paginationTimer = performanceMonitor.startTimer('Pagination Query');
        
        const results = await testPrisma.company.findMany({
          skip: page * pageSize,
          take: pageSize,
          include: {
            icps: { take: 1 },
            _count: { select: { icps: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        paginationTimer();
        console.log(`✓ Page ${page + 1}: ${results.length} results`);
      }

      const paginationStats = performanceMonitor.getStats('Pagination Query');
      expect(paginationStats?.avg).toBeLessThan(200); // Less than 200ms per page
      
      // Verify pagination performance doesn't degrade significantly
      const times = performanceMonitor.getMetrics('Pagination Query');
      const firstPage = times[0];
      const lastPage = times[times.length - 1];
      const degradation = lastPage / firstPage;
      
      expect(degradation).toBeLessThan(2); // Last page shouldn't be more than 2x slower
    });

    it('should handle concurrent queries efficiently', async () => {
      console.log('🔥 Testing concurrent query performance...');

      const concurrentQueries = 20;
      const concurrentTimer = performanceMonitor.startTimer('Concurrent Queries');

      // Execute multiple queries concurrently
      const promises = Array.from({ length: concurrentQueries }, async (_, i) => {
        const queryTimer = performanceMonitor.startTimer('Single Concurrent Query');
        
        const result = await testPrisma.company.findMany({
          where: {
            industry: 'Technology'
          },
          include: {
            icps: { take: 2 }
          },
          take: 10,
          skip: i * 5,
        });

        queryTimer();
        return result;
      });

      const results = await Promise.all(promises);
      concurrentTimer();

      console.log(`✓ Executed ${concurrentQueries} concurrent queries`);
      console.log(`✓ Total results: ${results.flat().length}`);

      const concurrentStats = performanceMonitor.getStats('Concurrent Queries');
      const singleQueryStats = performanceMonitor.getStats('Single Concurrent Query');

      expect(concurrentStats?.avg).toBeLessThan(5000); // Total under 5 seconds
      expect(singleQueryStats?.avg).toBeLessThan(1000); // Individual queries under 1 second
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should handle large result sets efficiently', async () => {
      console.log('🔥 Testing large result set handling...');

      // Create a large dataset
      const largeDatasetTimer = performanceMonitor.startTimer('Large Dataset Query');
      
      const companies = await testPrisma.company.findMany({
        include: {
          icps: true,
        }
      });

      largeDatasetTimer();

      console.log(`✓ Retrieved ${companies.length} companies with ICPs`);
      
      // Memory usage estimation (simplified)
      const estimatedMemoryUsage = companies.length * 1024; // Rough estimate in bytes
      console.log(`✓ Estimated memory usage: ${(estimatedMemoryUsage / 1024 / 1024).toFixed(2)} MB`);

      expect(companies.length).toBeGreaterThan(0);
      
      const largeDatasetStats = performanceMonitor.getStats('Large Dataset Query');
      expect(largeDatasetStats?.avg).toBeLessThan(10000); // Under 10 seconds
    });

    it('should handle streaming and batch processing', async () => {
      console.log('🔥 Testing streaming and batch processing...');

      const batchSize = 50;
      let totalProcessed = 0;

      const streamTimer = performanceMonitor.startTimer('Stream Processing');

      // Simulate streaming processing in batches
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const batchTimer = performanceMonitor.startTimer('Batch Processing');
        
        const batch = await testPrisma.prospectQualification.findMany({
          skip: offset,
          take: batchSize,
          orderBy: { createdAt: 'asc' }
        });

        batchTimer();

        if (batch.length === 0) {
          hasMore = false;
        } else {
          totalProcessed += batch.length;
          offset += batchSize;
          
          // Simulate processing work
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (offset > 500) break; // Limit for test
      }

      streamTimer();

      console.log(`✓ Processed ${totalProcessed} records in batches of ${batchSize}`);

      const batchStats = performanceMonitor.getStats('Batch Processing');
      expect(batchStats?.avg).toBeLessThan(500); // Each batch under 500ms
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-frequency operations', async () => {
      console.log('🔥 Testing high-frequency operations...');

      const operationCount = 200;
      const startTime = Date.now();

      // Rapid-fire user creation
      const rapidOperations = Array.from({ length: operationCount }, async (_, i) => {
        const opTimer = performanceMonitor.startTimer('Rapid Operation');
        
        const user = await testPrisma.user.create({
          data: generateUser(1000 + i)
        });

        opTimer();
        return user;
      });

      await Promise.all(rapidOperations);
      
      const totalTime = Date.now() - startTime;
      const opsPerSecond = operationCount / (totalTime / 1000);

      console.log(`✓ Completed ${operationCount} operations in ${totalTime}ms`);
      console.log(`✓ Operations per second: ${opsPerSecond.toFixed(2)}`);

      expect(opsPerSecond).toBeGreaterThan(10); // At least 10 ops/sec
      expect(totalTime).toBeLessThan(30000); // Under 30 seconds total
    });

    it('should maintain performance under load', async () => {
      console.log('🔥 Testing performance under load...');

      const iterations = 5;
      const operationsPerIteration = 20;

      for (let iteration = 0; iteration < iterations; iteration++) {
        const iterationTimer = performanceMonitor.startTimer(`Load Test Iteration ${iteration + 1}`);
        
        // Simulate mixed workload
        const operations = [
          // Create operations
          ...Array.from({ length: operationsPerIteration / 4 }, () =>
            testPrisma.user.create({ data: generateUser(2000 + iteration * 100) })
          ),
          // Read operations
          ...Array.from({ length: operationsPerIteration / 2 }, () =>
            testPrisma.company.findMany({ take: 10 })
          ),
          // Update operations
          ...Array.from({ length: operationsPerIteration / 4 }, async () => {
            const user = await testPrisma.user.findFirst();
            if (user) {
              return testPrisma.user.update({
                where: { id: user.id },
                data: { name: `Updated User ${Date.now()}` }
              });
            }
          })
        ];

        await Promise.all(operations);
        iterationTimer();

        console.log(`✓ Completed iteration ${iteration + 1}/${iterations}`);
      }

      // Verify performance doesn't degrade across iterations
      const iterationTimes = Array.from({ length: iterations }, (_, i) =>
        performanceMonitor.getStats(`Load Test Iteration ${i + 1}`)?.avg || 0
      );

      const avgFirstIteration = iterationTimes[0];
      const avgLastIteration = iterationTimes[iterationTimes.length - 1];
      const degradationRatio = avgLastIteration / avgFirstIteration;

      console.log(`✓ Performance degradation ratio: ${degradationRatio.toFixed(2)}x`);
      expect(degradationRatio).toBeLessThan(1.5); // No more than 50% degradation
    });
  });
});

// Helper functions
async function cleanTestDatabase() {
  await testPrisma.prospectQualification.deleteMany();
  await testPrisma.qualificationRun.deleteMany();
  await testPrisma.iCP.deleteMany();
  await testPrisma.company.deleteMany();
  await testPrisma.session.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.user.deleteMany();
}

async function setupLargeDataset() {
  console.log('Setting up large dataset for query testing...');

  // Create users
  const users = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      testPrisma.user.create({ data: generateUser(i) })
    )
  );

  // Create companies
  const companies = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      testPrisma.company.create({
        data: generateCompany(users[i % users.length].id, i)
      })
    )
  );

  // Create ICPs
  const icps = await Promise.all(
    companies.map((company, i) =>
      testPrisma.iCP.create({
        data: generateICP(company.id, i)
      })
    )
  );

  // Create qualification runs
  const runs = await Promise.all(
    Array.from({ length: 50 }, (_, i) =>
      testPrisma.qualificationRun.create({
        data: {
          icpId: icps[i % icps.length].id,
          userId: users[i % users.length].id,
          status: i % 3 === 0 ? 'COMPLETED' : 'PROCESSING',
          totalProspects: 5 + (i % 15),
          completed: i % 3 === 0 ? 5 + (i % 15) : Math.floor((5 + (i % 15)) / 2),
        }
      })
    )
  );

  // Create prospect qualifications
  for (const run of runs) {
    const prospects = Array.from({ length: run.totalProspects }, (_, j) => ({
      runId: run.id,
      domain: `dataset-prospect-${run.id}-${j}.com`,
      companyName: `Dataset Prospect ${run.id}-${j}`,
      score: Math.floor(Math.random() * 100),
      fitLevel: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'][Math.floor(Math.random() * 4)] as any,
      reasoning: `Generated prospect qualification for testing`,
      matchedCriteria: { industry: Math.random() > 0.5 },
      gaps: { size: Math.random() > 0.7 },
      status: 'COMPLETED' as const,
    }));

    await testPrisma.prospectQualification.createMany({
      data: prospects
    });
  }

  console.log(`✓ Created dataset: ${users.length} users, ${companies.length} companies, ${icps.length} ICPs, ${runs.length} runs`);
}