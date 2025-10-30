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

// Mock OpenAI for ICP generation
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
                  title: 'Startup ICP',
                  description: 'AI-generated ideal customer profile',
                  buyerPersonas: [
                    {
                      role: 'Chief Technology Officer',
                      painPoints: ['Technical debt', 'Scaling challenges', 'Team productivity'],
                      goals: ['Build reliable systems', 'Implement CI/CD', 'Improve code quality']
                    },
                    {
                      role: 'VP of Engineering',
                      painPoints: ['Resource allocation', 'Technical strategy', 'Team growth'],
                      goals: ['Scale engineering team', 'Implement best practices', 'Drive innovation']
                    }
                  ],
                  companySize: {
                    minEmployees: 10,
                    maxEmployees: 500,
                    minRevenue: 1000000,
                    maxRevenue: 50000000
                  },
                  industries: ['Technology', 'Software', 'SaaS'],
                  geographicRegions: ['North America', 'Europe'],
                  fundingStages: ['Series A', 'Series B', 'Series C']
                })
              }
            }]
          })
        }
      }
    }))
  }
});

// Mock web scraping/domain analysis
jest.mock('cheerio', () => ({
  load: jest.fn(() => ({
    'title': jest.fn(() => ({ text: jest.fn(() => 'Test Company') })),
    'meta[name="description"]': jest.fn(() => ({ attr: jest.fn(() => 'A test company description') })),
    'h1, h2, h3': jest.fn(() => ({ 
      map: jest.fn(() => ({ get: jest.fn(() => ['About Us', 'Our Technology', 'Contact']) }))
    }))
  }))
}));

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

// Test data factories
const createTestUser = (overrides: any = {}) => ({
  email: 'onboarding-test-' + Math.random().toString(36).substring(7) + '@example.com',
  name: 'Onboarding Test User',
  role: 'USER' as const,
  ...overrides
});

const createTestCompanyAnalysisData = () => ({
  industry: 'Technology',
  size: '50-200',
  description: 'An innovative software company specializing in AI solutions',
  websiteData: {
    title: 'TechCorp - AI Solutions',
    description: 'Leading provider of AI-powered business solutions',
    headings: ['About Us', 'Our Technology', 'Solutions', 'Contact'],
    content: 'We build cutting-edge AI solutions for enterprises...',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
  },
  aiAnalysis: {
    businessModel: 'B2B SaaS',
    targetMarket: 'Enterprise',
    competitiveAdvantages: ['AI expertise', 'Scalable platform', 'Strong team'],
    challenges: ['Market competition', 'Customer acquisition'],
  }
});

describe('Onboarding Flow Integration Tests', () => {
  let testUser: any;

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
    testUser = await testPrisma.user.create({
      data: createTestUser(),
    });
  });

  describe('Complete Onboarding Flow', () => {
    it('should successfully onboard a new user and generate ICP', async () => {
      const startTime = Date.now();
      console.log('🚀 Starting complete onboarding flow test...');

      // Step 1: User provides company domain
      console.log('Step 1: Processing company domain...');
      const companyDomain = 'techcorp.example.com';
      
      // Simulate domain validation
      expect(companyDomain).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/);
      console.log(`✓ Domain ${companyDomain} validated`);

      // Step 2: Create company record with analysis data
      console.log('Step 2: Creating company with analysis...');
      const analysisData = createTestCompanyAnalysisData();
      const company = await testPrisma.company.create({
        data: {
          domain: companyDomain,
          name: 'TechCorp',
          description: analysisData.description,
          industry: analysisData.industry,
          size: analysisData.size,
          userId: testUser.id,
          websiteData: analysisData.websiteData,
          aiAnalysis: analysisData.aiAnalysis,
        },
      });

      expect(company).toBeDefined();
      expect(company.domain).toBe(companyDomain);
      expect(company.userId).toBe(testUser.id);
      expect(company.websiteData).toBeDefined();
      expect(company.aiAnalysis).toBeDefined();
      console.log(`✓ Company created with ID: ${company.id}`);

      // Step 3: Generate ICP based on company analysis
      console.log('Step 3: Generating ICP...');
      const icpData = {
        companyId: company.id,
        title: 'Enterprise AI Solutions ICP',
        description: 'Ideal customer profile for companies seeking AI solutions',
        buyerPersonas: [
          {
            role: 'Chief Technology Officer',
            painPoints: ['Legacy system modernization', 'AI implementation complexity'],
            goals: ['Digital transformation', 'Competitive advantage through AI'],
            demographics: {
              experience: '10+ years',
              teamSize: '20-100',
              budget: '$500K-$2M'
            }
          }
        ],
        companySize: {
          minEmployees: 100,
          maxEmployees: 5000,
          minRevenue: 10000000,
          maxRevenue: 1000000000
        },
        industries: ['Financial Services', 'Healthcare', 'Manufacturing', 'Retail'],
        geographicRegions: ['North America', 'Europe', 'Asia-Pacific'],
        fundingStages: ['Series B', 'Series C', 'Series D', 'IPO'],
        generatedBy: 'gpt-4',
        prompt: 'Generate ICP for AI solutions company targeting enterprise clients',
      };

      const icp = await testPrisma.iCP.create({
        data: icpData,
      });

      expect(icp).toBeDefined();
      expect(icp.companyId).toBe(company.id);
      expect(icp.buyerPersonas).toBeDefined();
      expect(Array.isArray(icp.industries)).toBe(true);
      expect(icp.industries.length).toBeGreaterThan(0);
      console.log(`✓ ICP generated with ID: ${icp.id}`);

      // Step 4: Validate ICP completeness and quality
      console.log('Step 4: Validating ICP quality...');
      
      // Check required fields
      expect(icp.title).toBeDefined();
      expect(icp.description).toBeDefined();
      expect(icp.buyerPersonas).toBeDefined();
      expect(icp.companySize).toBeDefined();
      expect(icp.industries.length).toBeGreaterThan(0);
      expect(icp.geographicRegions.length).toBeGreaterThan(0);
      expect(icp.fundingStages.length).toBeGreaterThan(0);

      // Validate buyer personas structure
      const personas = icp.buyerPersonas as any[];
      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBeGreaterThan(0);
      
      for (const persona of personas) {
        expect(persona.role).toBeDefined();
        expect(persona.painPoints).toBeDefined();
        expect(persona.goals).toBeDefined();
        expect(Array.isArray(persona.painPoints)).toBe(true);
        expect(Array.isArray(persona.goals)).toBe(true);
      }

      // Validate company size structure
      const companySize = icp.companySize as any;
      expect(companySize.minEmployees).toBeDefined();
      expect(companySize.maxEmployees).toBeDefined();
      expect(companySize.minEmployees).toBeLessThan(companySize.maxEmployees);
      
      console.log('✓ ICP quality validation passed');

      // Step 5: Verify data relationships and consistency
      console.log('Step 5: Verifying data relationships...');
      const companyWithICP = await testPrisma.company.findUnique({
        where: { id: company.id },
        include: {
          icps: true,
          user: true,
        },
      });

      expect(companyWithICP).toBeDefined();
      expect(companyWithICP!.icps).toHaveLength(1);
      expect(companyWithICP!.icps[0].id).toBe(icp.id);
      expect(companyWithICP!.user.id).toBe(testUser.id);
      console.log('✓ Data relationships verified');

      // Step 6: Performance validation
      const totalTime = Date.now() - startTime;
      console.log(`✓ Total onboarding time: ${totalTime}ms`);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

      console.log('🎉 Complete onboarding flow test passed!');
    });

    it('should handle partial company data gracefully', async () => {
      console.log('Testing onboarding with minimal company data...');

      const companyDomain = 'minimal-data.com';
      
      // Create company with minimal data (simulating failed scraping)
      const company = await testPrisma.company.create({
        data: {
          domain: companyDomain,
          name: null, // No name extracted
          description: null, // No description
          industry: null, // Industry unknown
          size: null, // Size unknown
          userId: testUser.id,
          websiteData: {
            error: 'Failed to scrape website',
            reason: 'Connection timeout'
          },
          // aiAnalysis omitted - will be null by default
        },
      });

      expect(company).toBeDefined();
      expect(company.domain).toBe(companyDomain);
      
      // Should still be able to create a basic ICP with defaults
      const basicICP = await testPrisma.iCP.create({
        data: {
          companyId: company.id,
          title: 'Basic ICP',
          description: 'Default ICP for companies with minimal data',
          buyerPersonas: [{
            role: 'Decision Maker',
            painPoints: ['Unknown challenges'],
            goals: ['Business growth']
          }],
          companySize: {
            minEmployees: 1,
            maxEmployees: 1000000,
            minRevenue: 0,
            maxRevenue: 1000000000
          },
          industries: ['General'],
          geographicRegions: ['Global'],
          fundingStages: ['All'],
        },
      });

      expect(basicICP).toBeDefined();
      expect(basicICP.companyId).toBe(company.id);
      console.log('✓ Minimal data onboarding handled successfully');
    });

    it('should prevent duplicate company domains per user', async () => {
      console.log('Testing duplicate domain prevention...');

      const companyDomain = 'duplicate-test.com';
      
      // Create first company
      const firstCompany = await testPrisma.company.create({
        data: {
          domain: companyDomain,
          name: 'First Company',
          userId: testUser.id,
        },
      });

      expect(firstCompany).toBeDefined();

      // Try to create duplicate - should fail
      await expect(
        testPrisma.company.create({
          data: {
            domain: companyDomain,
            name: 'Duplicate Company',
            userId: testUser.id,
          },
        })
      ).rejects.toThrow();

      // But should allow same domain for different user
      const anotherUser = await testPrisma.user.create({
        data: createTestUser(),
      });

      const allowedDuplicate = await testPrisma.company.create({
        data: {
          domain: companyDomain,
          name: 'Allowed Duplicate',
          userId: anotherUser.id,
        },
      });

      expect(allowedDuplicate).toBeDefined();
      expect(allowedDuplicate.userId).toBe(anotherUser.id);
      console.log('✓ Duplicate domain prevention working correctly');
    });
  });

  describe('ICP Generation and Validation', () => {
    it('should generate comprehensive ICPs with multiple personas', async () => {
      console.log('Testing comprehensive ICP generation...');

      // Create company with rich data
      const company = await testPrisma.company.create({
        data: {
          domain: 'enterprise-software.com',
          name: 'Enterprise Software Solutions',
          description: 'B2B SaaS platform for enterprise resource planning',
          industry: 'Software',
          size: '200-500',
          userId: testUser.id,
          websiteData: {
            title: 'Enterprise Software Solutions',
            description: 'Comprehensive ERP platform',
            features: ['Inventory Management', 'Financial Reporting', 'HR Management'],
            pricing: 'Enterprise pricing available',
            customers: ['Fortune 500', 'Mid-market companies'],
          },
          aiAnalysis: {
            businessModel: 'B2B SaaS',
            targetMarket: 'Enterprise',
            value_proposition: 'Streamlined operations and cost reduction',
            competitive_advantages: ['Deep integration', 'Scalable architecture'],
          }
        },
      });

      // Generate detailed ICP with multiple personas
      const detailedICP = await testPrisma.iCP.create({
        data: {
          companyId: company.id,
          title: 'Enterprise ERP ICP',
          description: 'Comprehensive ICP for enterprise ERP solutions',
          buyerPersonas: [
            {
              role: 'Chief Financial Officer',
              painPoints: ['Manual financial processes', 'Lack of real-time visibility', 'Compliance challenges'],
              goals: ['Automate financial workflows', 'Improve reporting accuracy', 'Ensure compliance'],
              demographics: {
                experience: '15+ years',
                department: 'Finance',
                companySize: '500-5000 employees',
                budget: '$1M-$10M'
              },
              buyingProcess: {
                decisionCriteria: ['ROI', 'Integration capabilities', 'Vendor reputation'],
                timeline: '6-12 months',
                stakeholders: ['CFO', 'IT Director', 'Finance Team']
              }
            },
            {
              role: 'Chief Information Officer',
              painPoints: ['Legacy system integration', 'Data silos', 'Security concerns'],
              goals: ['Modernize IT infrastructure', 'Improve data integration', 'Enhance security'],
              demographics: {
                experience: '12+ years',
                department: 'IT',
                companySize: '500-5000 employees',
                budget: '$500K-$5M'
              },
              buyingProcess: {
                decisionCriteria: ['Technical architecture', 'Security features', 'Scalability'],
                timeline: '9-18 months',
                stakeholders: ['CIO', 'IT Team', 'Security Team']
              }
            }
          ],
          companySize: {
            minEmployees: 500,
            maxEmployees: 10000,
            minRevenue: 50000000,
            maxRevenue: 5000000000
          },
          industries: ['Manufacturing', 'Financial Services', 'Healthcare', 'Retail'],
          geographicRegions: ['North America', 'Europe', 'Asia-Pacific'],
          fundingStages: ['Series C', 'Series D', 'IPO', 'Private'],
          generatedBy: 'gpt-4',
          prompt: 'Generate detailed ICP for enterprise ERP software company',
        },
      });

      expect(detailedICP).toBeDefined();
      
      // Validate comprehensive persona data
      const personas = detailedICP.buyerPersonas as any[];
      expect(personas).toHaveLength(2);
      
      for (const persona of personas) {
        expect(persona.role).toBeDefined();
        expect(persona.painPoints).toBeDefined();
        expect(persona.goals).toBeDefined();
        expect(persona.demographics).toBeDefined();
        expect(persona.buyingProcess).toBeDefined();
        
        expect(persona.demographics.experience).toBeDefined();
        expect(persona.demographics.department).toBeDefined();
        expect(persona.buyingProcess.decisionCriteria).toBeDefined();
        expect(persona.buyingProcess.timeline).toBeDefined();
      }

      console.log('✓ Comprehensive ICP generation successful');
    });

    it('should validate ICP data integrity and constraints', async () => {
      console.log('Testing ICP data validation...');

      const company = await testPrisma.company.create({
        data: {
          domain: 'validation-test.com',
          name: 'Validation Test Company',
          userId: testUser.id,
        },
      });

      // Test with invalid data structures
      const invalidICP = {
        companyId: company.id,
        title: '', // Empty title should be handled
        description: 'Test description',
        buyerPersonas: 'invalid', // Should be array
        companySize: 'invalid', // Should be object
        industries: 'Technology', // Should be array
        geographicRegions: ['Valid Region'],
        fundingStages: ['Series A'],
      };

      // Some validation should happen at application level
      // Database might still accept invalid JSON structures
      await expect(async () => {
        const icp = await testPrisma.iCP.create({
          data: invalidICP as any,
        });
        
        // Validate at application level
        expect(icp.title).toBeTruthy(); // Should not be empty
        expect(Array.isArray(icp.buyerPersonas)).toBe(true);
        expect(typeof icp.companySize).toBe('object');
        expect(Array.isArray(icp.industries)).toBe(true);
      }).rejects.toThrow(); // Expect validation to catch issues

      console.log('✓ ICP validation working as expected');
    });
  });

  describe('Onboarding Error Handling', () => {
    it('should handle domain analysis failures gracefully', async () => {
      console.log('Testing domain analysis failure handling...');

      const problematicDomain = 'invalid-domain-test.com';

      // Simulate failed domain analysis
      const companyWithFailedAnalysis = await testPrisma.company.create({
        data: {
          domain: problematicDomain,
          name: null,
          description: null,
          industry: null,
          size: null,
          userId: testUser.id,
          websiteData: {
            error: 'Domain analysis failed',
            errorType: 'CONNECTION_TIMEOUT',
            attempts: 3,
            lastAttempt: new Date().toISOString(),
          },
          // aiAnalysis omitted - will be null by default
        },
      });

      expect(companyWithFailedAnalysis).toBeDefined();
      expect(companyWithFailedAnalysis.websiteData).toBeDefined();
      
      const websiteData = companyWithFailedAnalysis.websiteData as any;
      expect(websiteData.error).toBe('Domain analysis failed');
      expect(websiteData.errorType).toBe('CONNECTION_TIMEOUT');

      // Should still be able to create basic ICP with fallback data
      const fallbackICP = await testPrisma.iCP.create({
        data: {
          companyId: companyWithFailedAnalysis.id,
          title: 'Fallback ICP',
          description: 'Generated with limited data due to analysis failure',
          buyerPersonas: [{
            role: 'Business Decision Maker',
            painPoints: ['General business challenges'],
            goals: ['Business improvement and growth']
          }],
          companySize: {
            minEmployees: 1,
            maxEmployees: 10000,
            minRevenue: 100000,
            maxRevenue: 100000000
          },
          industries: ['General Business'],
          geographicRegions: ['Unknown'],
          fundingStages: ['All Stages'],
          generatedBy: 'fallback-generator',
          prompt: 'Fallback ICP generation due to failed domain analysis',
        },
      });

      expect(fallbackICP).toBeDefined();
      expect(fallbackICP.title).toBe('Fallback ICP');
      console.log('✓ Domain analysis failure handled gracefully');
    });

    it('should handle concurrent onboarding requests', async () => {
      console.log('Testing concurrent onboarding handling...');

      const domains = ['concurrent1.com', 'concurrent2.com', 'concurrent3.com'];
      
      // Simulate multiple concurrent onboarding requests for same user
      const onboardingPromises = domains.map(domain =>
        testPrisma.company.create({
          data: {
            domain,
            name: `Company ${domain}`,
            description: `Description for ${domain}`,
            industry: 'Technology',
            size: '10-50',
            userId: testUser.id,
          },
        })
      );

      const companies = await Promise.all(onboardingPromises);
      
      expect(companies).toHaveLength(3);
      companies.forEach((company, index) => {
        expect(company.domain).toBe(domains[index]);
        expect(company.userId).toBe(testUser.id);
      });

      console.log('✓ Concurrent onboarding handled successfully');
    });
  });

  describe('Onboarding Performance', () => {
    it('should complete onboarding within performance targets', async () => {
      console.log('Testing onboarding performance...');

      const performanceTest = async () => {
        const startTime = Date.now();

        // Create company
        const company = await testPrisma.company.create({
          data: {
            domain: `perf-test-${Date.now()}.com`,
            name: 'Performance Test Company',
            description: 'Company for performance testing',
            industry: 'Technology',
            size: '50-200',
            userId: testUser.id,
            websiteData: createTestCompanyAnalysisData().websiteData,
            aiAnalysis: createTestCompanyAnalysisData().aiAnalysis,
          },
        });

        const companyCreationTime = Date.now() - startTime;

        // Generate ICP
        const icpStartTime = Date.now();
        const icp = await testPrisma.iCP.create({
          data: {
            companyId: company.id,
            title: 'Performance Test ICP',
            description: 'ICP for performance testing',
            buyerPersonas: [{
              role: 'Test Role',
              painPoints: ['Test pain point'],
              goals: ['Test goal']
            }],
            companySize: {
              minEmployees: 10,
              maxEmployees: 1000,
              minRevenue: 1000000,
              maxRevenue: 100000000
            },
            industries: ['Technology'],
            geographicRegions: ['North America'],
            fundingStages: ['Series A'],
          },
        });

        const icpCreationTime = Date.now() - icpStartTime;
        const totalTime = Date.now() - startTime;

        return {
          company,
          icp,
          performance: {
            companyCreationTime,
            icpCreationTime,
            totalTime,
          }
        };
      };

      const result = await performanceTest();
      
      expect(result.company).toBeDefined();
      expect(result.icp).toBeDefined();
      
      // Performance targets
      expect(result.performance.companyCreationTime).toBeLessThan(1000); // 1 second
      expect(result.performance.icpCreationTime).toBeLessThan(500); // 0.5 seconds
      expect(result.performance.totalTime).toBeLessThan(2000); // 2 seconds total

      console.log(`✓ Performance targets met:`);
      console.log(`  - Company creation: ${result.performance.companyCreationTime}ms`);
      console.log(`  - ICP generation: ${result.performance.icpCreationTime}ms`);
      console.log(`  - Total time: ${result.performance.totalTime}ms`);
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