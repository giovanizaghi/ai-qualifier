/**
 * Prospect Validator Unit Tests
 * Phase 3.2: Comprehensive testing for prospect validation functionality
 */

import { 
  validateProspectResult, 
  ProspectValidationOptions,
  ProspectValidationResult
} from '../prospect-validator';
import { QualificationResult, MatchedCriteria, FitLevel } from '../../prospect-qualifier';
import { DomainAnalysisResult, CompanyAnalysis, DomainErrorCategory } from '../../domain-analyzer';

describe('Prospect Validator', () => {
  const validScrapedData: DomainAnalysisResult = {
    domain: 'example.com',
    name: 'Example Company',
    title: 'Example - Leading Software Company',
    description: 'We provide enterprise software solutions',
    industry: 'Technology',
    mainContent: [
      'Welcome to Example Company',
      'We specialize in enterprise software solutions',
      'Our team of experts delivers cutting-edge technology',
      'Contact us for more information about our services'
    ],
    headings: ['Home', 'About Us', 'Services', 'Contact'],
    metaDescription: 'Example Company provides enterprise software solutions for businesses worldwide',
    keywords: ['software', 'enterprise', 'technology', 'solutions']
  };

  const validAIAnalysis: CompanyAnalysis = {
    companyName: 'Example Company',
    industry: 'Software Development',
    description: 'Example Company is a leading provider of enterprise software solutions, specializing in cloud-based applications for medium to large businesses.',
    targetMarket: 'Enterprise customers in North America and Europe',
    keyOfferings: [
      'Cloud-based CRM platform',
      'Enterprise resource planning software',
      'Business intelligence tools',
      'Customer support automation'
    ],
    companySize: 'Mid-Market',
    confidence: 85
  };

  const validMatchedCriteria: MatchedCriteria[] = [
    {
      category: 'Industry',
      criteria: 'Technology/Software',
      match: true,
      confidence: 90,
      evidence: 'Company operates in software development industry'
    },
    {
      category: 'Company Size',
      criteria: 'Mid-Market (100-1000 employees)',
      match: true,
      confidence: 80,
      evidence: 'Analysis indicates mid-market company size'
    },
    {
      category: 'Geographic Region',
      criteria: 'North America',
      match: true,
      confidence: 85,
      evidence: 'Primary market includes North America'
    }
  ];

  const validQualificationResult: QualificationResult = {
    prospectDomain: 'example.com',
    prospectName: 'Example Company',
    score: 85,
    fitLevel: 'EXCELLENT' as FitLevel,
    reasoning: 'Strong alignment with ICP criteria. Company operates in target industry (software development), serves enterprise customers, and has appropriate company size. Located in target geographic region with clear technology focus.',
    matchedCriteria: validMatchedCriteria,
    gaps: ['No recent funding information available'],
    recommendation: 'Highly qualified prospect - prioritize for immediate outreach',
    prospectData: {
      scrapedData: validScrapedData,
      aiAnalysis: validAIAnalysis
    },
    scoreValidation: {
      originalScore: 85,
      wasClamped: false,
      fallbackUsed: false
    },
    processing: {
      timestamp: new Date(),
      duration: 1500,
      retryCount: 0
    }
  };

  describe('validateProspectResult', () => {
    it('should validate a complete, valid prospect result', () => {
      const result = validateProspectResult(validQualificationResult);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
      expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    });

    it('should detect missing required fields', () => {
      const incompleteResult: Partial<QualificationResult> = {
        prospectDomain: 'example.com',
        // Missing other required fields
      };
      
      const result = validateProspectResult(incompleteResult);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'prospectName')).toBe(true);
      expect(result.errors.some(e => e.field === 'score')).toBe(true);
      expect(result.errors.some(e => e.field === 'fitLevel')).toBe(true);
    });

    it('should validate domain format', () => {
      const invalidDomainResult = {
        ...validQualificationResult,
        prospectDomain: 'invalid-domain'
      };
      
      const result = validateProspectResult(invalidDomainResult);
      
      expect(result.errors.some(e => 
        e.field === 'prospectDomain' && e.code === 'INVALID_DOMAIN_FORMAT'
      )).toBe(true);
    });

    it('should validate score range', () => {
      const invalidScoreResult = {
        ...validQualificationResult,
        score: 150 // Out of bounds
      };
      
      const result = validateProspectResult(invalidScoreResult);
      
      expect(result.errors.some(e => 
        e.field === 'score' && e.code === 'SCORE_OUT_OF_BOUNDS'
      )).toBe(true);
    });

    it('should validate fit level values', () => {
      const invalidFitLevelResult = {
        ...validQualificationResult,
        fitLevel: 'INVALID' as FitLevel
      };
      
      const result = validateProspectResult(invalidFitLevelResult);
      
      expect(result.errors.some(e => 
        e.field === 'fitLevel' && e.code === 'INVALID_FIT_LEVEL'
      )).toBe(true);
    });

    it('should detect score-fit level misalignment', () => {
      const misalignedResult = {
        ...validQualificationResult,
        score: 90, // EXCELLENT score
        fitLevel: 'POOR' as FitLevel // But POOR fit level
      };
      
      const result = validateProspectResult(misalignedResult, {
        validateScoreAlignment: true
      });
      
      expect(result.errors.some(e => 
        e.code === 'SCORE_FIT_MISMATCH'
      )).toBe(true);
    });

    it('should allow partial data when configured', () => {
      const partialResult: Partial<QualificationResult> = {
        prospectDomain: 'example.com',
        score: 75,
        fitLevel: 'GOOD' as FitLevel
      };
      
      const result = validateProspectResult(partialResult, {
        allowPartialData: true,
        requireDomainData: false
      });
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors.filter(e => e.severity === 'error').length).toBeLessThan(3);
    });

    it('should validate strict mode', () => {
      const partialResult: Partial<QualificationResult> = {
        prospectDomain: 'example.com',
        score: 75,
        fitLevel: 'GOOD' as FitLevel
      };
      
      const result = validateProspectResult(partialResult, {
        strictValidation: true,
        allowPartialData: false
      });
      
      expect(result.errors.filter(e => e.severity === 'error').length).toBeGreaterThan(0);
    });
  });

  describe('Prospect Data Validation', () => {
    it('should validate scraped data quality', () => {
      const resultWithPoorScrapedData = {
        ...validQualificationResult,
        prospectData: {
          ...validQualificationResult.prospectData,
          scrapedData: {
            ...validScrapedData,
            mainContent: [], // No content
            error: 'Failed to scrape website',
            errorCategory: DomainErrorCategory.HTTP_ERROR
          }
        }
      };
      
      const result = validateProspectResult(resultWithPoorScrapedData);
      
      expect(result.warnings.some(w => 
        w.field.includes('scrapedData')
      )).toBe(true);
    });

    it('should validate AI analysis quality', () => {
      const resultWithPoorAIAnalysis = {
        ...validQualificationResult,
        prospectData: {
          ...validQualificationResult.prospectData,
          aiAnalysis: {
            ...validAIAnalysis,
            companyName: '',
            industry: '',
            description: 'Too brief',
            confidence: 30 // Low confidence
          }
        }
      };
      
      const result = validateProspectResult(resultWithPoorAIAnalysis);
      
      expect(result.warnings.some(w => 
        w.field.includes('aiAnalysis')
      )).toBe(true);
    });

    it('should detect circuit breaker activation', () => {
      const resultWithCircuitBreaker = {
        ...validQualificationResult,
        prospectData: {
          ...validQualificationResult.prospectData,
          scrapedData: {
            ...validScrapedData,
            error: 'Circuit breaker activated',
            errorCategory: DomainErrorCategory.CIRCUIT_BREAKER,
            fallbackUsed: true
          }
        }
      };
      
      const result = validateProspectResult(resultWithCircuitBreaker);
      
      expect(result.warnings.some(w => 
        w.message.includes('Circuit breaker')
      )).toBe(true);
    });

    it('should validate fallback usage warnings', () => {
      const resultWithFallback = {
        ...validQualificationResult,
        prospectData: {
          ...validQualificationResult.prospectData,
          scrapedData: {
            ...validScrapedData,
            fallbackUsed: true
          },
          aiAnalysis: {
            ...validAIAnalysis,
            fallbackUsed: true
          }
        },
        scoreValidation: {
          originalScore: 85,
          wasClamped: false,
          fallbackUsed: true,
          validationErrors: ['AI qualification failed']
        }
      };
      
      const result = validateProspectResult(resultWithFallback);
      
      expect(result.warnings.some(w => 
        w.message.includes('fallback')
      )).toBe(true);
    });
  });

  describe('Matched Criteria Validation', () => {
    it('should validate matched criteria structure', () => {
      const resultWithBadCriteria = {
        ...validQualificationResult,
        matchedCriteria: [
          {
            // Missing required fields
            category: '',
            criteria: '',
            match: 'yes' as any, // Wrong type
            confidence: 150 // Out of range
          }
        ]
      };
      
      const result = validateProspectResult(resultWithBadCriteria);
      
      expect(result.errors.some(e => 
        e.field.includes('matchedCriteria')
      )).toBe(true);
    });

    it('should warn about low confidence scores', () => {
      const resultWithLowConfidence = {
        ...validQualificationResult,
        matchedCriteria: [
          {
            ...validMatchedCriteria[0],
            confidence: 30 // Low confidence
          }
        ]
      };
      
      const result = validateProspectResult(resultWithLowConfidence);
      
      expect(result.warnings.some(w => 
        w.message.includes('Low confidence')
      )).toBe(true);
    });
  });

  describe('Processing Metadata Validation', () => {
    it('should validate processing duration', () => {
      const resultWithLongProcessing = {
        ...validQualificationResult,
        processing: {
          timestamp: new Date(),
          duration: 70000, // Very long processing time
          retryCount: 0
        }
      };
      
      const result = validateProspectResult(resultWithLongProcessing);
      
      expect(result.warnings.some(w => 
        w.message.includes('Long processing time')
      )).toBe(true);
    });

    it('should validate retry count', () => {
      const resultWithManyRetries = {
        ...validQualificationResult,
        processing: {
          timestamp: new Date(),
          duration: 1500,
          retryCount: 5 // High retry count
        }
      };
      
      const result = validateProspectResult(resultWithManyRetries);
      
      expect(result.warnings.some(w => 
        w.message.includes('High retry count')
      )).toBe(true);
    });

    it('should validate processing errors', () => {
      const resultWithProcessingErrors = {
        ...validQualificationResult,
        processing: {
          timestamp: new Date(),
          duration: 1500,
          retryCount: 1,
          errors: ['Network timeout', 'AI analysis failed']
        }
      };
      
      const result = validateProspectResult(resultWithProcessingErrors);
      
      expect(result.warnings.some(w => 
        w.message.includes('Processing errors')
      )).toBe(true);
    });
  });

  describe('Score Validation Metadata', () => {
    it('should warn about score clamping', () => {
      const resultWithClampedScore = {
        ...validQualificationResult,
        scoreValidation: {
          originalScore: 120,
          wasClamped: true,
          fallbackUsed: false
        }
      };
      
      const result = validateProspectResult(resultWithClampedScore);
      
      expect(result.warnings.some(w => 
        w.message.includes('clamped')
      )).toBe(true);
    });

    it('should warn about validation errors', () => {
      const resultWithValidationErrors = {
        ...validQualificationResult,
        scoreValidation: {
          originalScore: 85,
          wasClamped: false,
          fallbackUsed: false,
          validationErrors: ['Fit level mismatch', 'Invalid criteria format']
        }
      };
      
      const result = validateProspectResult(resultWithValidationErrors);
      
      expect(result.warnings.some(w => 
        w.message.includes('Validation errors')
      )).toBe(true);
    });
  });

  describe('Data Quality Score Calculation', () => {
    it('should calculate high quality score for complete data', () => {
      const result = validateProspectResult(validQualificationResult);
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(85);
    });

    it('should calculate lower score for incomplete data', () => {
      const incompleteResult: Partial<QualificationResult> = {
        prospectDomain: 'example.com',
        score: 75,
        fitLevel: 'GOOD' as FitLevel,
        reasoning: 'Brief reason'
      };
      
      const result = validateProspectResult(incompleteResult, {
        allowPartialData: true
      });
      
      expect(result.qualityScore).toBeLessThan(80);
    });

    it('should bonus complete prospect data', () => {
      const resultWithCompleteData = { ...validQualificationResult };
      const resultWithIncompleteData = {
        ...validQualificationResult,
        prospectData: {
          scrapedData: {
            ...validScrapedData,
            mainContent: []
          },
          aiAnalysis: {
            ...validAIAnalysis,
            industry: '',
            keyOfferings: []
          }
        }
      };
      
      const completeResult = validateProspectResult(resultWithCompleteData);
      const incompleteResult = validateProspectResult(resultWithIncompleteData);
      
      expect(completeResult.qualityScore).toBeGreaterThan(incompleteResult.qualityScore);
    });
  });

  describe('Sanitization', () => {
    it('should sanitize prospect result data when requested', () => {
      const maliciousResult = {
        ...validQualificationResult,
        prospectName: '<script>alert("xss")</script>Evil Company',
        reasoning: 'Company has <img onerror="alert(1)" src="x"> good potential',
        recommendation: 'javascript:alert("xss"); Contact immediately',
        gaps: ['<b>No funding data</b>', 'Missing <script>evil()</script> info']
      };
      
      const result = validateProspectResult(maliciousResult, {
        sanitizeInput: true
      });
      
      expect(result.sanitizedData?.prospectName).toBe('Evil Company');
      expect(result.sanitizedData?.reasoning).not.toContain('<img');
      expect(result.sanitizedData?.recommendation).not.toContain('javascript:');
      expect(result.sanitizedData?.gaps?.[0]).toBe('No funding data');
    });

    it('should sanitize matched criteria', () => {
      const maliciousCriteria: MatchedCriteria[] = [
        {
          category: '<script>Industry</script>',
          criteria: 'Technology<img src="x">',
          match: true,
          confidence: 90,
          evidence: 'javascript:alert("xss"); Strong evidence'
        }
      ];
      
      const maliciousResult = {
        ...validQualificationResult,
        matchedCriteria: maliciousCriteria
      };
      
      const result = validateProspectResult(maliciousResult, {
        sanitizeInput: true
      });
      
      expect(result.sanitizedData?.matchedCriteria?.[0].category).toBe('Industry');
      expect(result.sanitizedData?.matchedCriteria?.[0].criteria).toBe('Technology');
      expect(result.sanitizedData?.matchedCriteria?.[0].evidence).toBe('Strong evidence');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined input', () => {
      const result = validateProspectResult(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty object', () => {
      const result = validateProspectResult({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed matched criteria', () => {
      const resultWithBadCriteria = {
        ...validQualificationResult,
        matchedCriteria: 'not an array' as any
      };
      
      const result = validateProspectResult(resultWithBadCriteria);
      
      expect(result.errors.some(e => 
        e.field === 'matchedCriteria' && e.code === 'INVALID_TYPE'
      )).toBe(true);
    });

    it('should handle score edge cases', () => {
      const edgeCases = [
        { score: NaN, expected: 'INVALID_TYPE' },
        { score: Infinity, expected: 'SCORE_OUT_OF_BOUNDS' },
        { score: -Infinity, expected: 'SCORE_OUT_OF_BOUNDS' },
        { score: null, expected: 'REQUIRED_FIELD_MISSING' }
      ];
      
      edgeCases.forEach(({ score, expected }) => {
        const testResult = {
          ...validQualificationResult,
          score: score as any
        };
        
        const result = validateProspectResult(testResult);
        expect(result.errors.some(e => e.code === expected)).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('should validate complex prospect result quickly', () => {
      const complexResult = {
        ...validQualificationResult,
        matchedCriteria: new Array(20).fill(validMatchedCriteria[0]),
        gaps: new Array(50).fill('Sample gap'),
        prospectData: {
          scrapedData: {
            ...validScrapedData,
            mainContent: new Array(100).fill('Content section'),
            headings: new Array(50).fill('Heading')
          },
          aiAnalysis: {
            ...validAIAnalysis,
            keyOfferings: new Array(30).fill('Sample offering')
          }
        }
      };
      
      const start = performance.now();
      const result = validateProspectResult(complexResult);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(result).toBeDefined();
    });
  });
});