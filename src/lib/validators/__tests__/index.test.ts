/**
 * Validation Utilities Unit Tests
 * Phase 3.2: Comprehensive testing for validation utilities and error reporting
 */

import {
  validateQualificationData,
  generateValidationReport,
  validateAndSanitizeInput,
  ValidationErrorAggregator,
  validators,
  ComprehensiveValidationOptions
} from '../index';
import { ICPData } from '../../../types/icp';
import { QualificationResult, FitLevel } from '../../prospect-qualifier';

describe('Validation Utilities', () => {
  const validICP: ICPData = {
    title: 'Tech Companies',
    description: 'Technology companies in the enterprise space',
    buyerPersonas: [
      {
        role: 'CTO',
        seniority: 'Senior',
        department: 'Technology',
        painPoints: ['Legacy systems'],
        goals: ['Modernization']
      }
    ],
    companySize: {
      minEmployees: 100,
      maxEmployees: 1000,
      stage: ['Growth']
    },
    industries: ['Technology'],
    geographicRegions: ['North America'],
    fundingStages: ['Series B'],
    keyIndicators: ['Recent hiring', 'Technology focus']
  };

  const validProspectResult: QualificationResult = {
    prospectDomain: 'example.com',
    prospectName: 'Example Corp',
    score: 85,
    fitLevel: 'EXCELLENT' as FitLevel,
    reasoning: 'Strong alignment with ICP criteria',
    matchedCriteria: [
      {
        category: 'Industry',
        criteria: 'Technology',
        match: true,
        confidence: 90,
        evidence: 'Operates in technology sector'
      }
    ],
    gaps: [],
    recommendation: 'High priority prospect',
    prospectData: {
      scrapedData: {
        domain: 'example.com',
        mainContent: ['Company information'],
        headings: ['About Us']
      },
      aiAnalysis: {
        companyName: 'Example Corp',
        industry: 'Technology',
        description: 'A technology company',
        targetMarket: 'Enterprise',
        keyOfferings: ['Software solutions']
      }
    }
  };

  describe('validateQualificationData', () => {
    it('should validate complete qualification data successfully', () => {
      const result = validateQualificationData(validICP, validProspectResult, {
        includeRecommendations: true
      });

      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(70);
      expect(result.categories.icp).toBeDefined();
      expect(result.categories.prospect).toBeDefined();
      expect(result.categories.company).toBeDefined();
      expect(result.criticalErrors).toHaveLength(0);
      expect(result.summary).toContain('Validation passed');
    });

    it('should detect critical errors in invalid data', () => {
      const invalidICP: Partial<ICPData> = {
        title: 'A', // Too short
        buyerPersonas: [], // Empty
        industries: [] // Empty
      };

      const invalidProspectResult: Partial<QualificationResult> = {
        prospectDomain: 'invalid-domain',
        score: 150, // Out of bounds
        fitLevel: 'INVALID' as FitLevel
      };

      const result = validateQualificationData(invalidICP, invalidProspectResult);

      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThan(70);
      expect(result.summary).toContain('failed');
    });

    it('should generate recommendations when requested', () => {
      const incompleteICP: Partial<ICPData> = {
        title: 'Basic ICP',
        industries: ['Technology']
      };

      const result = validateQualificationData(incompleteICP, validProspectResult, {
        includeRecommendations: true
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => 
        r.category === 'completeness'
      )).toBe(true);
    });

    it('should validate with different options', () => {
      const options: ComprehensiveValidationOptions = {
        icp: { strictValidation: true },
        prospect: { allowPartialData: false },
        company: { validateBusinessLogic: true },
        includeRecommendations: true
      };

      const result = validateQualificationData(validICP, validProspectResult, options);

      expect(result).toBeDefined();
      expect(result.categories.icp).toBeDefined();
      expect(result.categories.prospect).toBeDefined();
      expect(result.categories.company).toBeDefined();
    });

    it('should handle missing prospect data gracefully', () => {
      const prospectWithoutData: Partial<QualificationResult> = {
        prospectDomain: 'example.com',
        score: 75,
        fitLevel: 'GOOD' as FitLevel,
        reasoning: 'Basic qualification',
        matchedCriteria: [],
        gaps: [],
        recommendation: 'Consider'
        // Missing prospectData
      };

      const result = validateQualificationData(validICP, prospectWithoutData);

      expect(result).toBeDefined();
      expect(result.categories.company).toBeUndefined(); // No company validation without data
    });

    it('should calculate overall score correctly', () => {
      const highQualityResult = validateQualificationData(validICP, validProspectResult);
      
      const lowQualityICP: Partial<ICPData> = {
        title: 'Incomplete'
      };
      
      const lowQualityProspectResult: Partial<QualificationResult> = {
        prospectDomain: 'example.com',
        score: 30,
        fitLevel: 'POOR' as FitLevel
      };

      const lowQualityResult = validateQualificationData(lowQualityICP, lowQualityProspectResult);

      expect(highQualityResult.overallScore).toBeGreaterThan(lowQualityResult.overallScore);
    });
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      const validationSummary = validateQualificationData(validICP, validProspectResult, {
        includeRecommendations: true
      });

      const report = generateValidationReport('test-run-123', validationSummary, 1500);

      expect(report.runId).toBe('test-run-123');
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.validationSummary).toBe(validationSummary);
      expect(report.metrics).toBeDefined();
      expect(report.dataHealth).toBeDefined();

      // Check metrics
      expect(report.metrics.totalValidations).toBeGreaterThan(0);
      expect(report.metrics.processingTime).toBe(1500);
      expect(typeof report.metrics.passRate).toBe('number');
      expect(typeof report.metrics.errorRate).toBe('number');

      // Check data health
      expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(report.dataHealth.status);
      expect(typeof report.dataHealth.qualityScore).toBe('number');
      expect(typeof report.dataHealth.completenessScore).toBe('number');
      expect(typeof report.dataHealth.reliabilityScore).toBe('number');
    });

    it('should calculate metrics correctly', () => {
      const validationSummary = validateQualificationData(validICP, validProspectResult);
      const report = generateValidationReport('test-run-456', validationSummary, 2000);

      expect(report.metrics.totalValidations).toBe(3); // ICP + Prospect + Company
      expect(report.metrics.processingTime).toBe(2000);
      
      if (validationSummary.isValid) {
        expect(report.metrics.passRate).toBeGreaterThan(0);
        expect(report.metrics.errorRate).toBe(0);
      }
    });

    it('should determine appropriate data health status', () => {
      // High quality data
      const highQualityValidation = validateQualificationData(validICP, validProspectResult);
      const highQualityReport = generateValidationReport('high-quality', highQualityValidation, 1000);

      // Low quality data
      const lowQualityICP: Partial<ICPData> = { title: 'Basic' };
      const lowQualityProspect: Partial<QualificationResult> = {
        prospectDomain: 'invalid',
        score: -10
      };
      const lowQualityValidation = validateQualificationData(lowQualityICP, lowQualityProspect);
      const lowQualityReport = generateValidationReport('low-quality', lowQualityValidation, 1000);

      expect(['excellent', 'good']).toContain(highQualityReport.dataHealth.status);
      expect(['poor', 'critical']).toContain(lowQualityReport.dataHealth.status);
    });
  });

  describe('validateAndSanitizeInput', () => {
    it('should validate and sanitize valid input', () => {
      const testData = {
        name: 'Valid Name',
        email: 'test@example.com'
      };

      const mockValidator = (data: typeof testData) => ({
        isValid: true,
        sanitizedData: { ...data, name: data.name.trim() },
        errors: []
      });

      const result = validateAndSanitizeInput(testData, mockValidator);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle validation errors', () => {
      const testData = {
        name: '',
        email: 'invalid-email'
      };

      const mockValidator = (data: typeof testData) => ({
        isValid: false,
        errors: [
          { field: 'name', message: 'Name is required', severity: 'error', code: 'REQUIRED' },
          { field: 'email', message: 'Invalid email', severity: 'error', code: 'INVALID_EMAIL' }
        ]
      });

      const result = validateAndSanitizeInput(testData, mockValidator);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0].category).toBe('system');
      expect(result.errors[0].timestamp).toBeInstanceOf(Date);
    });

    it('should use sanitized data when available', () => {
      const testData = {
        name: '  Padded Name  ',
        description: '<script>alert("xss")</script>Clean content'
      };

      const mockValidator = (data: typeof testData) => ({
        isValid: true,
        sanitizedData: {
          name: data.name.trim(),
          description: 'Clean content'
        },
        errors: []
      });

      const result = validateAndSanitizeInput(testData, mockValidator);

      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('Padded Name');
      expect(result.data.description).toBe('Clean content');
    });
  });

  describe('ValidationErrorAggregator', () => {
    let aggregator: ValidationErrorAggregator;

    beforeEach(() => {
      aggregator = new ValidationErrorAggregator();
    });

    it('should add and track errors', () => {
      const error1 = {
        category: 'icp' as const,
        field: 'title',
        message: 'Title is required',
        severity: 'error' as const,
        code: 'REQUIRED_FIELD',
        timestamp: new Date()
      };

      const error2 = {
        category: 'prospect' as const,
        field: 'score',
        message: 'Invalid score',
        severity: 'warning' as const,
        code: 'INVALID_SCORE',
        timestamp: new Date()
      };

      aggregator.addError(error1);
      aggregator.addError(error2);

      const summary = aggregator.getErrorSummary();

      expect(summary.total).toBe(2);
      expect(summary.byCategory.icp).toBe(1);
      expect(summary.byCategory.prospect).toBe(1);
      expect(summary.bySeverity.error).toBe(1);
      expect(summary.bySeverity.warning).toBe(1);
    });

    it('should get errors by category', () => {
      const icpError = {
        category: 'icp' as const,
        field: 'title',
        message: 'ICP error',
        severity: 'error' as const,
        code: 'ICP_ERROR',
        timestamp: new Date()
      };

      const prospectError = {
        category: 'prospect' as const,
        field: 'score',
        message: 'Prospect error',
        severity: 'error' as const,
        code: 'PROSPECT_ERROR',
        timestamp: new Date()
      };

      aggregator.addErrors([icpError, prospectError]);

      const icpErrors = aggregator.getErrorsByCategory('icp');
      const prospectErrors = aggregator.getErrorsByCategory('prospect');

      expect(icpErrors).toHaveLength(1);
      expect(icpErrors[0].message).toBe('ICP error');
      expect(prospectErrors).toHaveLength(1);
      expect(prospectErrors[0].message).toBe('Prospect error');
    });

    it('should get errors by severity', () => {
      const criticalError = {
        category: 'system' as const,
        field: 'data',
        message: 'Critical error',
        severity: 'critical' as const,
        code: 'CRITICAL',
        timestamp: new Date()
      };

      const warningError = {
        category: 'system' as const,
        field: 'data',
        message: 'Warning error',
        severity: 'warning' as const,
        code: 'WARNING',
        timestamp: new Date()
      };

      aggregator.addErrors([criticalError, warningError]);

      const criticalErrors = aggregator.getCriticalErrors();
      const warningErrors = aggregator.getErrorsBySeverity('warning');

      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].severity).toBe('critical');
      expect(warningErrors).toHaveLength(1);
      expect(warningErrors[0].severity).toBe('warning');
    });

    it('should track error frequency', () => {
      const error1 = {
        category: 'icp' as const,
        field: 'title',
        message: 'Title error',
        severity: 'error' as const,
        code: 'TITLE_ERROR',
        timestamp: new Date()
      };

      const error2 = {
        category: 'icp' as const,
        field: 'title',
        message: 'Another title error',
        severity: 'error' as const,
        code: 'TITLE_ERROR', // Same code
        timestamp: new Date()
      };

      aggregator.addErrors([error1, error2]);

      const summary = aggregator.getErrorSummary();
      const topError = summary.topErrors[0];

      expect(topError.code).toBe('TITLE_ERROR');
      expect(topError.count).toBe(2);
      expect(topError.category).toBe('icp');
    });

    it('should clear errors', () => {
      const error = {
        category: 'system' as const,
        field: 'test',
        message: 'Test error',
        severity: 'error' as const,
        code: 'TEST_ERROR',
        timestamp: new Date()
      };

      aggregator.addError(error);
      expect(aggregator.getErrorSummary().total).toBe(1);

      aggregator.clear();
      expect(aggregator.getErrorSummary().total).toBe(0);
    });
  });

  describe('Common Validators', () => {
    it('should validate required fields', () => {
      expect(validators.required('')).toBeNull();
      expect(validators.required('value')).toBeNull();
      expect(validators.required(null)?.code).toBe('REQUIRED_FIELD');
      expect(validators.required(undefined)?.code).toBe('REQUIRED_FIELD');
    });

    it('should validate string type', () => {
      expect(validators.string('text')).toBeNull();
      expect(validators.string(123)?.code).toBe('INVALID_TYPE_STRING');
      expect(validators.string(null)?.code).toBe('INVALID_TYPE_STRING');
    });

    it('should validate number type', () => {
      expect(validators.number(42)).toBeNull();
      expect(validators.number(3.14)).toBeNull();
      expect(validators.number('123')?.code).toBe('INVALID_TYPE_NUMBER');
      expect(validators.number(NaN)?.code).toBe('INVALID_TYPE_NUMBER');
    });

    it('should validate email format', () => {
      expect(validators.email('test@example.com')).toBeNull();
      expect(validators.email('user@domain.co.uk')).toBeNull();
      expect(validators.email('invalid-email')?.code).toBe('INVALID_EMAIL_FORMAT');
      expect(validators.email('test@')?.code).toBe('INVALID_EMAIL_FORMAT');
    });

    it('should validate domain format', () => {
      expect(validators.domain('example.com')).toBeNull();
      expect(validators.domain('sub.domain.org')).toBeNull();
      expect(validators.domain('invalid-domain')?.code).toBe('INVALID_DOMAIN_FORMAT');
      expect(validators.domain('http://example.com')?.code).toBe('INVALID_DOMAIN_FORMAT');
    });

    it('should validate ranges', () => {
      const rangeValidator = validators.range(1, 100);
      
      expect(rangeValidator(50)).toBeNull();
      expect(rangeValidator(1)).toBeNull();
      expect(rangeValidator(100)).toBeNull();
      expect(rangeValidator(0)?.code).toBe('VALUE_OUT_OF_RANGE');
      expect(rangeValidator(101)?.code).toBe('VALUE_OUT_OF_RANGE');
    });

    it('should validate string lengths', () => {
      const minLengthValidator = validators.minLength(5);
      const maxLengthValidator = validators.maxLength(10);
      
      expect(minLengthValidator('hello')).toBeNull();
      expect(minLengthValidator('hi')?.code).toBe('MIN_LENGTH_VIOLATION');
      
      expect(maxLengthValidator('short')).toBeNull();
      expect(maxLengthValidator('this is too long')?.code).toBe('MAX_LENGTH_VIOLATION');
    });

    it('should validate arrays', () => {
      expect(validators.array([1, 2, 3])).toBeNull();
      expect(validators.array('not array')?.code).toBe('INVALID_TYPE_ARRAY');
    });

    it('should validate array counts', () => {
      const minCountValidator = validators.minCount(2);
      const maxCountValidator = validators.maxCount(5);
      
      expect(minCountValidator([1, 2])).toBeNull();
      expect(minCountValidator([1])?.code).toBe('MIN_COUNT_VIOLATION');
      
      expect(maxCountValidator([1, 2, 3])).toBeNull();
      expect(maxCountValidator([1, 2, 3, 4, 5, 6])?.code).toBe('MAX_COUNT_VIOLATION');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const result = validateQualificationData(null as any, null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.overallScore).toBe(0);
    });

    it('should validate complex data structures quickly', () => {
      const complexICP = {
        ...validICP,
        buyerPersonas: new Array(10).fill(validICP.buyerPersonas[0]),
        industries: new Array(20).fill('Technology'),
        keyIndicators: new Array(15).fill('Sample indicator')
      };

      const complexProspectResult = {
        ...validProspectResult,
        matchedCriteria: new Array(25).fill(validProspectResult.matchedCriteria[0]),
        gaps: new Array(10).fill('Sample gap')
      };

      const start = performance.now();
      const result = validateQualificationData(complexICP, complexProspectResult, {
        includeRecommendations: true
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(result).toBeDefined();
      expect(result.categories.icp).toBeDefined();
      expect(result.categories.prospect).toBeDefined();
      expect(result.categories.company).toBeDefined();
    });

    it('should handle large error aggregation efficiently', () => {
      const aggregator = new ValidationErrorAggregator();
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        aggregator.addError({
          category: 'system',
          field: `field${i % 10}`,
          message: `Error ${i}`,
          severity: i % 3 === 0 ? 'critical' : 'error',
          code: `ERROR_${i % 5}`,
          timestamp: new Date()
        });
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should handle 1000 errors within 100ms
      
      const summary = aggregator.getErrorSummary();
      expect(summary.total).toBe(1000);
      expect(summary.topErrors.length).toBeGreaterThan(0);
    });
  });
});