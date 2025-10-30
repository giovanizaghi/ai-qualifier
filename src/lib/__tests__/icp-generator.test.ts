/**
 * Unit tests for ICP Generator Validation Logic
 * Tests for Phase 1.2 - ICP Generation Validation
 */

import {
  generateICP,
  refineICP,
  enhanceExistingICP,
  isICPComplete,
  getICPQualityScore,
  generateICPSummary
} from '../icp-generator';
import {
  validateICP,
  calculateCompletenessScore,
  applyICPFallback,
  sanitizeICPData
} from '../icp-validator';
import {
  ICPData,
  ValidatedICP,
  ICPGenerationOptions,
  BuyerPersona,
  CompanySizeProfile
} from '../../types/icp';
import type { CompanyAnalysis } from '../domain-analyzer';

// Mock the OpenAI client
jest.mock('../openai-client', () => ({
  generateStructuredResponse: jest.fn()
}));

import { generateStructuredResponse } from '../openai-client';
const mockGenerateStructuredResponse = generateStructuredResponse as jest.MockedFunction<typeof generateStructuredResponse>;

describe('ICP Validator', () => {
  describe('validateICP', () => {
    it('should validate a complete ICP as valid and complete', () => {
      const completeICP: ICPData = {
        title: 'Enterprise SaaS Companies',
        description: 'Fast-growing enterprise software companies with complex data needs and growing teams.',
        buyerPersonas: [
          {
            role: 'CTO',
            seniority: 'C-Suite',
            department: 'Engineering',
            painPoints: ['Data silos', 'Scalability issues'],
            goals: ['Improve data architecture', 'Scale engineering team']
          }
        ],
        companySize: {
          minEmployees: 100,
          maxEmployees: 5000,
          minRevenue: '$10M',
          maxRevenue: '$100M',
          stage: ['Growth', 'Scale-up']
        },
        industries: ['Software', 'Technology'],
        geographicRegions: ['North America', 'Europe'],
        fundingStages: ['Series B', 'Series C'],
        technographics: ['AWS', 'React', 'Node.js'],
        keyIndicators: ['Rapid user growth', 'Recent funding round', 'Hiring engineers']
      };

      const result = validateICP(completeICP);
      
      expect(result.isValid).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.completenessScore).toBeGreaterThan(80);
    });

    it('should identify missing required fields', () => {
      const incompleteICP: Partial<ICPData> = {
        title: 'Test Company',
        // Missing description, buyerPersonas, companySize, industries, keyIndicators
      };

      const result = validateICP(incompleteICP);
      
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('description');
      expect(result.missingFields).toContain('buyerPersonas');
      expect(result.missingFields).toContain('companySize');
      expect(result.missingFields).toContain('industries');
      expect(result.missingFields).toContain('keyIndicators');
    });

    it('should validate title length requirements', () => {
      const shortTitle: Partial<ICPData> = {
        title: 'AB', // Too short
        description: 'A valid description that meets the minimum length requirements.',
        buyerPersonas: [],
        companySize: { stage: ['Growth'] },
        industries: ['Tech'],
        keyIndicators: ['Growth']
      };

      const result = validateICP(shortTitle);
      
      const titleError = result.errors.find(e => e.field === 'title');
      expect(titleError).toBeDefined();
      expect(titleError?.code).toBe('INVALID_LENGTH');
    });

    it('should validate buyer persona completeness', () => {
      const incompletePersona: Partial<ICPData> = {
        title: 'Test Company',
        description: 'A valid description that meets the minimum length requirements.',
        buyerPersonas: [
          {
            role: 'Manager',
            seniority: '', // Missing
            department: 'Sales',
            painPoints: [], // Empty
            goals: ['Increase sales']
          } as BuyerPersona
        ],
        companySize: { stage: ['Growth'] },
        industries: ['Tech'],
        keyIndicators: ['Growth', 'Funding']
      };

      const result = validateICP(incompletePersona);
      
      expect(result.errors.some(e => e.field.includes('seniority'))).toBe(true);
      expect(result.errors.some(e => e.field.includes('painPoints'))).toBe(true);
    });

    it('should validate company size stage values', () => {
      const invalidStage: Partial<ICPData> = {
        title: 'Test Company',
        description: 'A valid description that meets the minimum length requirements.',
        buyerPersonas: [
          {
            role: 'Manager',
            seniority: 'Senior',
            department: 'Sales',
            painPoints: ['Competition'],
            goals: ['Growth']
          }
        ],
        companySize: {
          stage: ['InvalidStage', 'Growth'] // InvalidStage is not valid
        },
        industries: ['Tech'],
        keyIndicators: ['Growth', 'Funding']
      };

      const result = validateICP(invalidStage);
      
      const stageError = result.errors.find(e => e.field === 'companySize.stage');
      expect(stageError).toBeDefined();
      expect(stageError?.code).toBe('INVALID_VALUE');
    });

    it('should generate warnings for missing optional fields', () => {
      const basicICP: Partial<ICPData> = {
        title: 'Test Company',
        description: 'A valid description that meets the minimum length requirements.',
        buyerPersonas: [
          {
            role: 'Manager',
            seniority: 'Senior',
            department: 'Sales',
            painPoints: ['Competition'],
            goals: ['Growth']
          }
        ],
        companySize: { stage: ['Growth'] },
        industries: ['Tech'],
        keyIndicators: ['Growth', 'Funding']
        // Missing geographicRegions, fundingStages
      };

      const result = validateICP(basicICP);
      
      expect(result.warnings.some(w => w.field === 'geographicRegions')).toBe(true);
      expect(result.warnings.some(w => w.field === 'fundingStages')).toBe(true);
    });
  });

  describe('calculateCompletenessScore', () => {
    it('should return 100 for a complete ICP', () => {
      const completeICP: ICPData = {
        title: 'Enterprise SaaS Companies',
        description: 'Fast-growing enterprise software companies with complex data needs.',
        buyerPersonas: [
          {
            role: 'CTO',
            seniority: 'C-Suite',
            department: 'Engineering',
            painPoints: ['Data silos', 'Scalability issues', 'Technical debt'],
            goals: ['Improve architecture', 'Scale team', 'Reduce costs']
          }
        ],
        companySize: {
          minEmployees: 100,
          maxEmployees: 5000,
          stage: ['Growth', 'Scale-up']
        },
        industries: ['Software', 'Technology'],
        geographicRegions: ['North America', 'Europe'],
        fundingStages: ['Series B', 'Series C'],
        technographics: ['AWS', 'React', 'Node.js'],
        keyIndicators: ['Rapid growth', 'Recent funding', 'Hiring engineers']
      };

      const score = calculateCompletenessScore(completeICP);
      expect(score).toBe(100);
    });

    it('should return lower score for incomplete ICP', () => {
      const incompleteICP: Partial<ICPData> = {
        title: 'Basic Company',
        description: 'A basic description.',
        buyerPersonas: [
          {
            role: 'Manager',
            seniority: 'Mid',
            department: 'Sales',
            painPoints: ['Issues'],
            goals: ['Growth']
          }
        ],
        companySize: { stage: ['Growth'] },
        industries: ['Tech'],
        keyIndicators: ['Growth']
        // Missing optional fields
      };

      const score = calculateCompletenessScore(incompleteICP);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for empty ICP', () => {
      const emptyICP: Partial<ICPData> = {};
      const score = calculateCompletenessScore(emptyICP);
      expect(score).toBe(0);
    });
  });

  describe('applyICPFallback', () => {
    it('should apply fallback data for missing fields', () => {
      const partialICP: Partial<ICPData> = {
        title: 'Custom Title',
        description: 'Custom description'
        // All other fields missing
      };

      const result = applyICPFallback(partialICP);
      
      expect(result.title).toBe('Custom Title'); // Preserved
      expect(result.description).toBe('Custom description'); // Preserved
      expect(result.buyerPersonas).toBeDefined(); // Fallback applied
      expect(result.companySize).toBeDefined(); // Fallback applied
      expect(result.industries).toBeDefined(); // Fallback applied
      expect(result.keyIndicators).toBeDefined(); // Fallback applied
    });

    it('should preserve existing data over fallback', () => {
      const partialICP: Partial<ICPData> = {
        title: 'Custom Title',
        industries: ['Custom Industry'],
        buyerPersonas: [
          {
            role: 'Custom Role',
            seniority: 'Senior',
            department: 'Custom Dept',
            painPoints: ['Custom Pain'],
            goals: ['Custom Goal']
          }
        ]
      };

      const result = applyICPFallback(partialICP);
      
      expect(result.title).toBe('Custom Title');
      expect(result.industries).toEqual(['Custom Industry']);
      expect(result.buyerPersonas[0].role).toBe('Custom Role');
    });
  });

  describe('sanitizeICPData', () => {
    it('should trim whitespace from strings', () => {
      const dirtyICP: Partial<ICPData> = {
        title: '  Whitespace Title  ',
        description: '  Whitespace Description  ',
        industries: ['  Tech  ', '  Software  ']
      };

      const result = sanitizeICPData(dirtyICP);
      
      expect(result.title).toBe('Whitespace Title');
      expect(result.description).toBe('Whitespace Description');
      expect(result.industries).toEqual(['Tech', 'Software']);
    });

    it('should filter out empty array elements', () => {
      const dirtyICP: Partial<ICPData> = {
        industries: ['Tech', '', '  ', 'Software'],
        keyIndicators: ['Growth', '', 'Funding', '   ']
      };

      const result = sanitizeICPData(dirtyICP);
      
      expect(result.industries).toEqual(['Tech', 'Software']);
      expect(result.keyIndicators).toEqual(['Growth', 'Funding']);
    });

    it('should enforce maximum array lengths', () => {
      const oversizedICP: Partial<ICPData> = {
        industries: Array(15).fill('Industry'), // Exceeds max of 10
        keyIndicators: Array(15).fill('Indicator') // Exceeds max of 10
      };

      const result = sanitizeICPData(oversizedICP);
      
      expect(result.industries).toHaveLength(10);
      expect(result.keyIndicators).toHaveLength(10);
    });
  });
});

describe('ICP Generator', () => {
  const mockCompanyAnalysis: CompanyAnalysis = {
    companyName: 'Test Company',
    industry: 'Software',
    description: 'A software company that builds great products',
    targetMarket: 'Enterprise',
    keyOfferings: ['Software Solutions', 'Consulting'],
    companySize: '50-100 employees'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateICP', () => {
    it('should generate and validate a complete ICP', async () => {
      const mockAIResponse: ICPData = {
        title: 'Enterprise SaaS Companies',
        description: 'Fast-growing enterprise software companies with complex needs.',
        buyerPersonas: [
          {
            role: 'CTO',
            seniority: 'C-Suite',
            department: 'Engineering',
            painPoints: ['Scalability issues', 'Technical debt'],
            goals: ['Improve architecture', 'Scale team']
          }
        ],
        companySize: {
          minEmployees: 100,
          maxEmployees: 5000,
          stage: ['Growth', 'Scale-up']
        },
        industries: ['Software', 'Technology'],
        geographicRegions: ['North America'],
        fundingStages: ['Series B'],
        technographics: ['AWS', 'React'],
        keyIndicators: ['Rapid growth', 'Recent funding', 'Hiring engineers']
      };

      mockGenerateStructuredResponse.mockResolvedValueOnce(mockAIResponse);

      const result = await generateICP(mockCompanyAnalysis, 'test.com');
      
      expect(result).toBeDefined();
      expect(result.isComplete).toBe(true);
      expect(result.completenessScore).toBeGreaterThan(80);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.validationVersion).toBe('1.0.0');
    });

    it('should handle AI generation failures with fallback', async () => {
      mockGenerateStructuredResponse.mockRejectedValueOnce(new Error('AI service unavailable'));

      const options: Partial<ICPGenerationOptions> = {
        fallbackOnError: true,
        maxRetries: 1
      };

      const result = await generateICP(mockCompanyAnalysis, 'test.com', options);
      
      expect(result).toBeDefined();
      expect(result.title).toContain('Test Company');
      expect(result.industries).toContain('Software');
    });

    it('should validate required minimum personas', async () => {
      const mockAIResponse: Partial<ICPData> = {
        title: 'Test Company',
        description: 'A test company description',
        buyerPersonas: [], // Empty personas
        companySize: { stage: ['Growth'] },
        industries: ['Tech'],
        keyIndicators: ['Growth']
      };

      mockGenerateStructuredResponse.mockResolvedValueOnce(mockAIResponse as ICPData);

      const options: Partial<ICPGenerationOptions> = {
        fallbackOnError: true,
        requireMinimumPersonas: 1
      };

      const result = await generateICP(mockCompanyAnalysis, 'test.com', options);
      
      // Should apply fallback and include at least one persona
      expect(result.buyerPersonas.length).toBeGreaterThanOrEqual(1);
    });

    it('should throw error when strict validation fails and fallback disabled', async () => {
      const mockAIResponse: Partial<ICPData> = {
        title: 'Test',
        // Missing required fields
      };

      mockGenerateStructuredResponse.mockResolvedValue(mockAIResponse as ICPData);

      const options: Partial<ICPGenerationOptions> = {
        strictValidation: true,
        fallbackOnError: false,
        maxRetries: 0
      };

      await expect(
        generateICP(mockCompanyAnalysis, 'test.com', options)
      ).rejects.toThrow('Failed to generate ICP after 1 attempts');
    });

    it('should retry on failures up to maxRetries', async () => {
      mockGenerateStructuredResponse
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({
          title: 'Success after retries',
          description: 'Generated after multiple attempts',
          buyerPersonas: [
            {
              role: 'Manager',
              seniority: 'Senior',
              department: 'Sales',
              painPoints: ['Competition'],
              goals: ['Growth']
            }
          ],
          companySize: { stage: ['Growth'] },
          industries: ['Tech'],
          geographicRegions: ['US'],
          fundingStages: ['Series A'],
          keyIndicators: ['Growth', 'Funding']
        } as ICPData);

      const options: Partial<ICPGenerationOptions> = {
        maxRetries: 2,
        fallbackOnError: false
      };

      const result = await generateICP(mockCompanyAnalysis, 'test.com', options);
      
      expect(result.title).toBe('Success after retries');
      expect(mockGenerateStructuredResponse).toHaveBeenCalledTimes(3);
    });
  });

  describe('refineICP', () => {
    const existingICP: ICPData = {
      title: 'Original Title',
      description: 'Original description',
      buyerPersonas: [
        {
          role: 'Manager',
          seniority: 'Senior',
          department: 'Sales',
          painPoints: ['Old pain'],
          goals: ['Old goal']
        }
      ],
      companySize: { stage: ['Growth'] },
      industries: ['Tech'],
      geographicRegions: ['US'],
      fundingStages: ['Series A'],
      keyIndicators: ['Growth']
    };

    it('should successfully refine an ICP with feedback', async () => {
      const refinedICP: ICPData = {
        ...existingICP,
        title: 'Refined Title',
        description: 'Refined description based on feedback'
      };

      mockGenerateStructuredResponse.mockResolvedValueOnce(refinedICP);

      const result = await refineICP(existingICP, 'Make the title more specific');
      
      expect(result.title).toBe('Refined Title');
      expect(result.description).toBe('Refined description based on feedback');
    });

    it('should fallback to original ICP on refinement failure', async () => {
      mockGenerateStructuredResponse.mockRejectedValueOnce(new Error('Refinement failed'));

      const options: Partial<ICPGenerationOptions> = {
        fallbackOnError: true
      };

      const result = await refineICP(existingICP, 'Invalid feedback', options);
      
      expect(result.title).toBe('Original Title');
      expect(result.description).toBe('Original description');
    });
  });

  describe('utility functions', () => {
    const sampleICP: ICPData = {
      title: 'Test Company',
      description: 'A comprehensive test company description that meets length requirements.',
      buyerPersonas: [
        {
          role: 'CTO',
          seniority: 'C-Suite',
          department: 'Engineering',
          painPoints: ['Scalability issues', 'Technical debt'],
          goals: ['Growth', 'Innovation']
        }
      ],
      companySize: {
        minEmployees: 100,
        maxEmployees: 1000,
        stage: ['Growth']
      },
      industries: ['Software', 'Technology'],
      geographicRegions: ['North America'],
      fundingStages: ['Series B'],
      technographics: ['AWS', 'React'],
      keyIndicators: ['Recent funding', 'Rapid hiring', 'Market expansion']
    };

    describe('generateICPSummary', () => {
      it('should generate a readable summary', () => {
        const summary = generateICPSummary(sampleICP);
        
        expect(summary).toContain('Test Company');
        expect(summary).toContain('CTO');
        expect(summary).toContain('Software');
        expect(summary).toContain('100-1000');
      });

      it('should handle missing optional fields gracefully', () => {
        const minimalICP: ICPData = {
          ...sampleICP,
          companySize: { stage: ['Growth'] }
        };

        const summary = generateICPSummary(minimalICP);
        expect(summary).toBeDefined();
        expect(typeof summary).toBe('string');
      });
    });

    describe('isICPComplete', () => {
      it('should return true for complete ICP', () => {
        expect(isICPComplete(sampleICP)).toBe(true);
      });

      it('should return false for incomplete ICP', () => {
        const incompleteICP: Partial<ICPData> = {
          title: 'Test'
          // Missing other required fields
        };
        
        expect(isICPComplete(incompleteICP)).toBe(false);
      });
    });

    describe('getICPQualityScore', () => {
      it('should return a score between 0 and 100', () => {
        const score = getICPQualityScore(sampleICP);
        
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it('should return higher score for more complete ICP', () => {
        const completeScore = getICPQualityScore(sampleICP);
        const incompleteScore = getICPQualityScore({ title: 'Test' });
        
        expect(completeScore).toBeGreaterThan(incompleteScore);
      });
    });

    describe('enhanceExistingICP', () => {
      it('should enhance and validate existing ICP', () => {
        const enhanced = enhanceExistingICP(sampleICP);
        
        expect(enhanced.isComplete).toBe(true);
        expect(enhanced.generatedAt).toBeInstanceOf(Date);
        expect(enhanced.validationVersion).toBe('1.0.0');
      });

      it('should apply fallback for missing fields', () => {
        const incompleteICP: ICPData = {
          title: 'Test',
          description: '', // Will trigger fallback
          buyerPersonas: [],
          companySize: { stage: [] },
          industries: [],
          geographicRegions: [],
          fundingStages: [],
          keyIndicators: []
        };

        const enhanced = enhanceExistingICP(incompleteICP);
        
        expect(enhanced.description).not.toBe('');
        expect(enhanced.buyerPersonas.length).toBeGreaterThan(0);
        expect(enhanced.industries.length).toBeGreaterThan(0);
      });
    });
  });
});