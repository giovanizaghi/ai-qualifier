/**
 * ICP Validator Unit Tests
 * Phase 3.2: Comprehensive testing for ICP validation functionality
 */

import { 
  validateICP, 
  sanitizeICP, 
  getICPCompleteness, 
  generateFallbackICP,
  ICPValidationOptions 
} from '../icp-validator';
import { ICPData, BuyerPersona, CompanySizeProfile } from '../../../types/icp';

describe('ICP Validator', () => {
  const validICP: ICPData = {
    title: 'Enterprise Software Companies',
    description: 'Companies that develop and sell enterprise software solutions to businesses',
    buyerPersonas: [
      {
        role: 'CTO',
        seniority: 'Senior',
        department: 'Technology',
        painPoints: ['Legacy system limitations', 'Scalability challenges'],
        goals: ['Modernize technology stack', 'Improve system performance']
      },
      {
        role: 'VP of Engineering',
        seniority: 'Executive',
        department: 'Engineering',
        painPoints: ['Technical debt', 'Team productivity'],
        goals: ['Reduce development time', 'Improve code quality']
      }
    ],
    companySize: {
      minEmployees: 100,
      maxEmployees: 5000,
      stage: ['Growth', 'Mature']
    },
    industries: ['Software', 'Technology', 'SaaS'],
    geographicRegions: ['North America', 'Europe'],
    fundingStages: ['Series B', 'Series C', 'Profitable'],
    technographics: ['AWS', 'Kubernetes', 'React'],
    keyIndicators: [
      'Actively hiring engineers',
      'Recent funding announcement',
      'Mentions scaling challenges',
      'Using modern tech stack'
    ]
  };

  const partialICP: Partial<ICPData> = {
    title: 'Tech Companies',
    industries: ['Technology'],
    buyerPersonas: [
      {
        role: 'Developer',
        seniority: 'Senior',
        department: 'Engineering',
        painPoints: ['Technical debt'],
        goals: ['Code quality']
      }
    ]
  };

  const invalidICP: Partial<ICPData> = {
    title: 'A', // Too short
    description: 'Brief', // Too short
    buyerPersonas: [], // Empty array
    companySize: {
      minEmployees: -5, // Invalid
      maxEmployees: 10,
      stage: ['InvalidStage'] // Invalid stage
    },
    industries: [], // Empty array
    keyIndicators: ['Only one'] // Too few
  };

  describe('validateICP', () => {
    it('should validate a complete, valid ICP', () => {
      const result = validateICP(validICP);
      
      expect(result.isValid).toBe(true);
      expect(result.isComplete).toBe(true);
      expect(result.completenessScore).toBeGreaterThanOrEqual(90);
      expect(result.errors).toHaveLength(0);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should validate partial ICP with warnings', () => {
      const result = validateICP(partialICP);
      
      expect(result.isValid).toBe(false); // Missing required fields
      expect(result.isComplete).toBe(false);
      expect(result.completenessScore).toBeLessThan(90);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect validation errors in invalid ICP', () => {
      const result = validateICP(invalidICP);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific error codes
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain('MIN_LENGTH_VIOLATION');
      expect(errorCodes).toContain('MIN_COUNT_VIOLATION');
    });

    it('should validate title field', () => {
      const icpWithoutTitle: Partial<ICPData> = { ...validICP };
      delete (icpWithoutTitle as any).title;
      
      const result = validateICP(icpWithoutTitle);
      expect(result.errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should validate title length constraints', () => {
      const shortTitle = { ...validICP, title: 'A' };
      const longTitle = { ...validICP, title: 'A'.repeat(101) };
      
      const shortResult = validateICP(shortTitle);
      const longResult = validateICP(longTitle);
      
      expect(shortResult.errors.some(e => e.code === 'MIN_LENGTH_VIOLATION')).toBe(true);
      expect(longResult.errors.some(e => e.code === 'MAX_LENGTH_VIOLATION')).toBe(true);
    });

    it('should validate buyer personas structure', () => {
      const icpWithBadPersonas = {
        ...validICP,
        buyerPersonas: [
          {
            role: '', // Empty role
            seniority: 'Senior',
            department: 'Tech',
            painPoints: [], // Empty pain points
            goals: [] // Empty goals
          }
        ]
      };
      
      const result = validateICP(icpWithBadPersonas);
      expect(result.errors.some(e => e.field.includes('buyerPersonas'))).toBe(true);
    });

    it('should validate company size constraints', () => {
      const icpWithBadSize = {
        ...validICP,
        companySize: {
          minEmployees: 1000,
          maxEmployees: 500, // Max less than min
          stage: ['InvalidStage']
        }
      };
      
      const result = validateICP(icpWithBadSize);
      expect(result.errors.some(e => e.code === 'LOGICAL_ERROR')).toBe(true);
      expect(result.errors.some(e => e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should validate with strict validation option', () => {
      const options: ICPValidationOptions = {
        strictValidation: true,
        allowPartialData: false
      };
      
      const result = validateICP(partialICP, options);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate with lenient options', () => {
      const options: ICPValidationOptions = {
        strictValidation: false,
        allowPartialData: true,
        requireAllOptionalFields: false
      };
      
      const result = validateICP(partialICP, options);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeICP', () => {
    it('should sanitize malicious input', () => {
      const maliciousICP: Partial<ICPData> = {
        title: '<script>alert("xss")</script>Enterprise Software',
        description: 'Companies with <img onerror="alert(1)" src="x">',
        industries: ['<script>evil()</script>Technology'],
        keyIndicators: ['javascript:alert("xss")Hiring engineers']
      };
      
      const sanitized = sanitizeICP(maliciousICP);
      
      expect(sanitized.title).not.toContain('<script>');
      expect(sanitized.description).not.toContain('<img');
      expect(sanitized.industries?.[0]).not.toContain('<script>');
      expect(sanitized.keyIndicators?.[0]).not.toContain('javascript:');
      expect(sanitized._sanitized).toBe(true);
    });

    it('should preserve clean data', () => {
      const cleanICP: Partial<ICPData> = {
        title: 'Clean Title',
        description: 'Clean description without any malicious content',
        industries: ['Technology', 'Software']
      };
      
      const sanitized = sanitizeICP(cleanICP);
      
      expect(sanitized.title).toBe(cleanICP.title);
      expect(sanitized.description).toBe(cleanICP.description);
      expect(sanitized.industries).toEqual(cleanICP.industries);
      expect(sanitized._warnings).toHaveLength(0);
    });

    it('should sanitize buyer personas', () => {
      const icpWithMaliciousPersonas: Partial<ICPData> = {
        buyerPersonas: [
          {
            role: '<script>CTO</script>',
            seniority: 'Senior<img src="x">',
            department: 'Tech',
            painPoints: ['<b>Technical debt</b>'],
            goals: ['javascript:alert("xss")Improve quality']
          }
        ]
      };
      
      const sanitized = sanitizeICP(icpWithMaliciousPersonas);
      
      expect(sanitized.buyerPersonas?.[0].role).toBe('CTO');
      expect(sanitized.buyerPersonas?.[0].seniority).toBe('Senior');
      expect(sanitized.buyerPersonas?.[0].painPoints?.[0]).toBe('Technical debt');
      expect(sanitized.buyerPersonas?.[0].goals?.[0]).toBe('Improve quality');
    });
  });

  describe('getICPCompleteness', () => {
    it('should return high completeness for valid ICP', () => {
      const completeness = getICPCompleteness(validICP);
      
      expect(completeness.score).toBeGreaterThanOrEqual(90);
      expect(completeness.priority).toBe('low');
      expect(completeness.missingFields).toHaveLength(0);
    });

    it('should return low completeness for minimal ICP', () => {
      const minimalICP: Partial<ICPData> = {
        title: 'Basic ICP'
      };
      
      const completeness = getICPCompleteness(minimalICP);
      
      expect(completeness.score).toBeLessThan(60);
      expect(completeness.priority).toBe('high');
      expect(completeness.missingFields.length).toBeGreaterThan(0);
      expect(completeness.suggestions.length).toBeGreaterThan(0);
    });

    it('should provide specific suggestions for missing fields', () => {
      const icpWithoutPersonas: Partial<ICPData> = {
        title: 'ICP without personas',
        description: 'A valid description',
        industries: ['Technology'],
        keyIndicators: ['Indicator 1', 'Indicator 2']
      };
      
      const completeness = getICPCompleteness(icpWithoutPersonas);
      
      expect(completeness.suggestions.some(s => 
        s.includes('decision makers')
      )).toBe(true);
    });

    it('should suggest geographic regions when missing', () => {
      const icpWithoutRegions: Partial<ICPData> = { ...validICP };
      delete (icpWithoutRegions as any).geographicRegions;
      
      const completeness = getICPCompleteness(icpWithoutRegions);
      
      expect(completeness.suggestions.some(s => 
        s.includes('geographic')
      )).toBe(true);
    });
  });

  describe('generateFallbackICP', () => {
    it('should generate complete fallback ICP', () => {
      const fallback = generateFallbackICP();
      
      expect(fallback.title).toBeDefined();
      expect(fallback.description).toBeDefined();
      expect(fallback.buyerPersonas.length).toBeGreaterThan(0);
      expect(fallback.companySize).toBeDefined();
      expect(fallback.industries.length).toBeGreaterThan(0);
      expect(fallback.keyIndicators.length).toBeGreaterThan(0);
      
      // Validate the fallback ICP itself
      const validation = validateICP(fallback);
      expect(validation.isValid).toBe(true);
    });

    it('should merge with partial ICP', () => {
      const partial: Partial<ICPData> = {
        title: 'Custom Title',
        industries: ['Custom Industry']
      };
      
      const fallback = generateFallbackICP(partial);
      
      expect(fallback.title).toBe('Custom Title');
      expect(fallback.industries).toEqual(['Custom Industry']);
      expect(fallback.description).toBeDefined();
      expect(fallback.buyerPersonas).toBeDefined();
    });

    it('should override missing required fields', () => {
      const partialWithMissing: Partial<ICPData> = {
        title: 'Custom Title'
        // Missing other required fields
      };
      
      const fallback = generateFallbackICP(partialWithMissing);
      
      // All required fields should be present
      expect(fallback.title).toBe('Custom Title');
      expect(fallback.description).toBeDefined();
      expect(fallback.buyerPersonas).toBeDefined();
      expect(fallback.companySize).toBeDefined();
      expect(fallback.industries).toBeDefined();
      expect(fallback.keyIndicators).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined input', () => {
      const result = validateICP(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty object', () => {
      const result = validateICP({});
      expect(result.isValid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it('should handle malformed buyer personas', () => {
      const icpWithBadPersonas = {
        ...validICP,
        buyerPersonas: [
          null, // null persona
          {}, // empty persona
          { role: 'Valid Role' } // incomplete persona
        ] as any
      };
      
      const result = validateICP(icpWithBadPersonas);
      expect(result.errors.some(e => e.field.includes('buyerPersonas'))).toBe(true);
    });

    it('should handle extreme values', () => {
      const icpWithExtremes = {
        ...validICP,
        title: 'A'.repeat(1000), // Very long title
        companySize: {
          minEmployees: 999999999,
          maxEmployees: 999999999,
          stage: ['Growth']
        },
        industries: new Array(100).fill('Technology') // Too many industries
      };
      
      const result = validateICP(icpWithExtremes);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should validate complex ICP quickly', () => {
      const complexICP = {
        ...validICP,
        buyerPersonas: new Array(5).fill(validICP.buyerPersonas[0]),
        industries: new Array(10).fill('Technology'),
        keyIndicators: new Array(10).fill('Sample indicator')
      };
      
      const start = performance.now();
      const result = validateICP(complexICP);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(result).toBeDefined();
    });

    it('should handle large arrays efficiently', () => {
      const icpWithLargeArrays = {
        ...validICP,
        industries: new Array(1000).fill('Technology'),
        keyIndicators: new Array(1000).fill('Indicator')
      };
      
      const start = performance.now();
      validateICP(icpWithLargeArrays);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(500); // Should handle large arrays within 500ms
    });
  });
});