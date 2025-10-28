import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'loading',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: 'Mock ICP',
                  description: 'Mock ICP for testing',
                  buyerPersonas: [{ role: 'CTO', painPoints: ['test'] }],
                  companySize: { minEmployees: 10, maxEmployees: 500 },
                  industries: ['Technology'],
                  geographicRegions: ['North America'],
                  fundingStages: ['Series A']
                })
              }
            }]
          })
        }
      }
    }))
  }
});

// Mock environment for API calls
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

// Test data factories
const createTestUser = () => ({
  id: 'test-user-id-' + Math.random().toString(36).substring(7),
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER' as const,
});

const createTestCompanyData = (userId: string) => ({
  domain: 'example.com',
  name: 'Example Company',
  description: 'A test company for integration testing',
  industry: 'Technology',
  size: '50-200',
  userId,
});

const createTestICPData = (companyId: string) => ({
  companyId,
  title: 'Tech Startup ICP',
  description: 'Ideal customer profile for tech startups',
  buyerPersonas: [
    {
      role: 'CTO',
      painPoints: ['Technical debt', 'Scaling challenges'],
      goals: ['Build reliable systems', 'Improve team productivity'],
    },
  ],
  companySize: {
    minEmployees: 10,
    maxEmployees: 500,
    minRevenue: 1000000,
    maxRevenue: 50000000,
  },
  industries: ['Technology', 'Software'],
  geographicRegions: ['North America', 'Europe'],
  fundingStages: ['Series A', 'Series B'],
});

describe('Qualification Flow Integration Tests', () => {
  let testUser: { id: string; email: string; name: string; role: 'USER' };
  let testCompany: any;
  let testICP: any;

  beforeAll(async () => {
    // Connect to test database
    await testPrisma.$connect();
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await testPrisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanTestDatabase();
    
    // Create test user
    testUser = createTestUser();
    await testPrisma.user.create({
      data: testUser,
    });
  });

  describe('Full Qualification Flow via Database', () => {
    it('should complete the entire qualification process through database operations', async () => {
      const startTime = Date.now();

      // Step 1: Create company (simulating onboarding)
      console.log('Step 1: Creating company...');
      const companyData = createTestCompanyData(testUser.id);
      testCompany = await testPrisma.company.create({
        data: companyData,
      });
      
      expect(testCompany).toBeDefined();
      expect(testCompany.domain).toBe(companyData.domain);
      expect(testCompany.userId).toBe(testUser.id);
      console.log(`✓ Company created with ID: ${testCompany.id}`);

      // Step 2: Generate ICP
      console.log('Step 2: Generating ICP...');
      const icpData = createTestICPData(testCompany.id);
      testICP = await testPrisma.iCP.create({
        data: icpData,
      });
      
      expect(testICP).toBeDefined();
      expect(testICP.companyId).toBe(testCompany.id);
      console.log(`✓ ICP created with ID: ${testICP.id}`);

      // Step 3: Create qualification run
      console.log('Step 3: Creating qualification run...');
      const prospectDomains = ['prospect1.com', 'prospect2.com', 'prospect3.com'];
      const qualificationRun = await testPrisma.qualificationRun.create({
        data: {
          icpId: testICP.id,
          userId: testUser.id,
          status: 'PROCESSING',
          totalProspects: prospectDomains.length,
          completed: 0,
        },
      });
      
      expect(qualificationRun).toBeDefined();
      expect(qualificationRun.totalProspects).toBe(prospectDomains.length);
      expect(qualificationRun.status).toBe('PROCESSING');
      console.log(`✓ Qualification run created with ID: ${qualificationRun.id}`);

      // Step 4: Simulate prospect qualifications
      console.log('Step 4: Simulating prospect qualifications...');
      const qualificationResults = [];
      
      for (let i = 0; i < prospectDomains.length; i++) {
        const domain = prospectDomains[i];
        const score = Math.floor(Math.random() * 100); // Random score 0-100
        const fitLevel = score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'FAIR' : 'POOR';
        
        const prospect = await testPrisma.prospectQualification.create({
          data: {
            runId: qualificationRun.id,
            domain,
            companyName: `${domain} Company`,
            companyData: {
              industry: 'Technology',
              size: '50-100',
              funding: 'Series A',
            },
            score,
            fitLevel: fitLevel as any,
            reasoning: `This prospect scores ${score}/100 based on ICP matching criteria.`,
            matchedCriteria: {
              industry: true,
              size: true,
              funding: score > 50,
            },
            gaps: {
              geographic: score < 80,
              technology: score < 60,
            },
            status: 'COMPLETED',
            analyzedAt: new Date(),
          },
        });
        
        qualificationResults.push(prospect);
      }
      
      // Update run status to completed
      await testPrisma.qualificationRun.update({
        where: { id: qualificationRun.id },
        data: {
          status: 'COMPLETED',
          completed: prospectDomains.length,
          completedAt: new Date(),
        },
      });
      
      console.log(`✓ All ${qualificationResults.length} prospects qualified`);

      // Step 5: Verify qualification results
      console.log('Step 5: Verifying qualification results...');
      const finalResults = await testPrisma.prospectQualification.findMany({
        where: { runId: qualificationRun.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(finalResults).toHaveLength(prospectDomains.length);
      
      for (const result of finalResults) {
        expect(result.domain).toMatch(/^prospect\d\.com$/);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).toContain(result.fitLevel);
        expect(result.reasoning).toBeDefined();
        expect(result.status).toBe('COMPLETED');
        expect(result.analyzedAt).toBeDefined();
      }
      console.log(`✓ All ${finalResults.length} prospects verified successfully`);

      // Step 6: Performance validation
      const totalTime = Date.now() - startTime;
      console.log(`✓ Total test execution time: ${totalTime}ms`);
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for database operations

      // Step 7: Verify database consistency and relationships
      console.log('Step 7: Verifying database consistency...');
      const runWithRelations = await testPrisma.qualificationRun.findUnique({
        where: { id: qualificationRun.id },
        include: {
          user: true,
          icp: {
            include: {
              company: true,
            },
          },
          results: true,
        },
      });

      expect(runWithRelations).toBeDefined();
      expect(runWithRelations!.user.id).toBe(testUser.id);
      expect(runWithRelations!.icp.company.userId).toBe(testUser.id);
      expect(runWithRelations!.icpId).toBe(testICP.id);
      expect(runWithRelations!.results).toHaveLength(prospectDomains.length);
      console.log('✓ Database consistency verified');

      console.log('🎉 Full qualification flow completed successfully!');
    });

    it('should handle cascade deletes correctly', async () => {
      console.log('Testing cascade delete behavior...');
      
      // Create full hierarchy: User -> Company -> ICP -> QualificationRun -> ProspectQualifications
      testCompany = await testPrisma.company.create({
        data: createTestCompanyData(testUser.id),
      });
      
      testICP = await testPrisma.iCP.create({
        data: createTestICPData(testCompany.id),
      });
      
      const qualificationRun = await testPrisma.qualificationRun.create({
        data: {
          icpId: testICP.id,
          userId: testUser.id,
          status: 'COMPLETED',
          totalProspects: 1,
          completed: 1,
        },
      });
      
      await testPrisma.prospectQualification.create({
        data: {
          runId: qualificationRun.id,
          domain: 'cascade-test.com',
          score: 75,
          fitLevel: 'GOOD',
          reasoning: 'Test prospect for cascade delete',
          matchedCriteria: {},
          gaps: {},
          status: 'COMPLETED',
        },
      });
      
      // Delete the company and verify everything cascades
      await testPrisma.company.delete({
        where: { id: testCompany.id },
      });
      
      // Verify all related records are gone
      const remainingICPs = await testPrisma.iCP.findMany({
        where: { companyId: testCompany.id },
      });
      expect(remainingICPs).toHaveLength(0);
      
      const remainingRuns = await testPrisma.qualificationRun.findMany({
        where: { icpId: testICP.id },
      });
      expect(remainingRuns).toHaveLength(0);
      
      const remainingProspects = await testPrisma.prospectQualification.findMany({
        where: { runId: qualificationRun.id },
      });
      expect(remainingProspects).toHaveLength(0);
      
      console.log('✓ Cascade deletes working correctly');
    });

    it('should validate data constraints and relationships', async () => {
      console.log('Testing data validation and constraints...');
      
      // Test unique constraint on company domain per user
      testCompany = await testPrisma.company.create({
        data: createTestCompanyData(testUser.id),
      });
      
      // Try to create duplicate company for same user
      await expect(
        testPrisma.company.create({
          data: createTestCompanyData(testUser.id),
        })
      ).rejects.toThrow();
      
      // But should allow same domain for different user
      const anotherUser = await testPrisma.user.create({
        data: createTestUser(),
      });
      
      const duplicateDomainCompany = await testPrisma.company.create({
        data: createTestCompanyData(anotherUser.id),
      });
      
      expect(duplicateDomainCompany).toBeDefined();
      expect(duplicateDomainCompany.domain).toBe(testCompany.domain);
      expect(duplicateDomainCompany.userId).toBe(anotherUser.id);
      
      console.log('✓ Data constraints working correctly');
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large qualification runs efficiently', async () => {
      console.log('Testing performance with large dataset...');
      
      const startTime = Date.now();
      
      // Create test data
      testCompany = await testPrisma.company.create({
        data: createTestCompanyData(testUser.id),
      });
      
      testICP = await testPrisma.iCP.create({
        data: createTestICPData(testCompany.id),
      });
      
      // Create qualification run with many prospects
      const prospectCount = 100;
      const qualificationRun = await testPrisma.qualificationRun.create({
        data: {
          icpId: testICP.id,
          userId: testUser.id,
          status: 'PROCESSING',
          totalProspects: prospectCount,
          completed: 0,
        },
      });
      
      // Batch create prospects
      const prospects = Array.from({ length: prospectCount }, (_, i) => ({
        runId: qualificationRun.id,
        domain: `prospect-${i}.com`,
        companyName: `Prospect ${i} Company`,
        score: Math.floor(Math.random() * 100),
        fitLevel: 'GOOD' as const,
        reasoning: `Prospect ${i} qualification reasoning`,
        matchedCriteria: { industry: true },
        gaps: { size: false },
        status: 'COMPLETED' as const,
      }));
      
      await testPrisma.prospectQualification.createMany({
        data: prospects,
      });
      
      const creationTime = Date.now() - startTime;
      console.log(`✓ Created ${prospectCount} prospects in ${creationTime}ms`);
      
      // Test bulk query performance
      const queryStartTime = Date.now();
      const results = await testPrisma.prospectQualification.findMany({
        where: { runId: qualificationRun.id },
        include: {
          run: {
            include: {
              icp: {
                include: {
                  company: true,
                },
              },
            },
          },
        },
      });
      
      const queryTime = Date.now() - queryStartTime;
      console.log(`✓ Queried ${results.length} prospects with relations in ${queryTime}ms`);
      
      expect(results).toHaveLength(prospectCount);
      expect(creationTime).toBeLessThan(5000); // 5 seconds
      expect(queryTime).toBeLessThan(2000); // 2 seconds
      
      console.log('✓ Performance test completed successfully');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed data gracefully', async () => {
      console.log('Testing error handling for malformed data...');
      
      testCompany = await testPrisma.company.create({
        data: createTestCompanyData(testUser.id),
      });
      
      // Test with invalid JSON data
      const icpWithInvalidData = {
        companyId: testCompany.id,
        title: 'Test ICP',
        description: 'Test description',
        buyerPersonas: null, // This should be an array
        companySize: { invalid: 'data' },
        industries: ['Technology'],
        geographicRegions: ['North America'],
        fundingStages: ['Series A'],
      };
      
      // Should still create but may have validation issues in application logic
      const icp = await testPrisma.iCP.create({
        data: icpWithInvalidData as any,
      });
      
      expect(icp).toBeDefined();
      expect(icp.buyerPersonas).toBeNull();
      
      console.log('✓ Malformed data handled without database errors');
    });

    it('should handle concurrent modifications', async () => {
      console.log('Testing concurrent modification handling...');
      
      testCompany = await testPrisma.company.create({
        data: createTestCompanyData(testUser.id),
      });
      
      testICP = await testPrisma.iCP.create({
        data: createTestICPData(testCompany.id),
      });
      
      const qualificationRun = await testPrisma.qualificationRun.create({
        data: {
          icpId: testICP.id,
          userId: testUser.id,
          status: 'PROCESSING',
          totalProspects: 10,
          completed: 0,
        },
      });
      
      // Simulate concurrent updates to the same run
      const updates = Array.from({ length: 5 }, (_, i) =>
        testPrisma.qualificationRun.update({
          where: { id: qualificationRun.id },
          data: { completed: i + 1 },
        })
      );
      
      // All updates should succeed
      const results = await Promise.all(updates);
      expect(results).toHaveLength(5);
      
      console.log('✓ Concurrent modifications handled successfully');
    });
  });
});

// Utility function to clean test database
async function cleanTestDatabase() {
  // Delete in correct order to respect foreign key constraints
  await testPrisma.prospectQualification.deleteMany();
  await testPrisma.qualificationRun.deleteMany();
  await testPrisma.iCP.deleteMany();
  await testPrisma.company.deleteMany();
  await testPrisma.session.deleteMany();
  await testPrisma.account.deleteMany();
  await testPrisma.user.deleteMany();
}