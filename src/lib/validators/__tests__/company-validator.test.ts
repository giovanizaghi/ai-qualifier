/**
 * Company Validator Unit Tests
 * Phase 3.2: Comprehensive testing for company data validation functionality
 */

import { 
  validateCompanyData,
  getCompanyDataHealth,
  CompanyValidationOptions,
  COMPANY_SIZE_VALUES,
  COMMON_INDUSTRIES
} from '../company-validator';
import { DomainAnalysisResult, CompanyAnalysis, DomainErrorCategory } from '../../domain-analyzer';

describe('Company Validator', () => {
  const validScrapedData: DomainAnalysisResult = {
    domain: 'techcorp.com',
    name: 'TechCorp Solutions',
    title: 'TechCorp - Enterprise Software Solutions',
    description: 'Leading provider of enterprise software solutions for businesses worldwide',
    industry: 'Technology',
    mainContent: [
      'Welcome to TechCorp Solutions',
      'We are a leading provider of enterprise software solutions',
      'Our products help businesses streamline their operations',
      'Founded in 2010, we have served over 1000 customers',
      'Contact us today to learn more about our solutions'
    ],
    headings: [
      'Enterprise Software Solutions',
      'Our Products',
      'Customer Success Stories',
      'About TechCorp',
      'Contact Us'
    ],
    metaDescription: 'TechCorp Solutions provides enterprise software solutions to help businesses improve efficiency and productivity',
    keywords: ['enterprise', 'software', 'solutions', 'business', 'technology']
  };

  const validAIAnalysis: CompanyAnalysis = {
    companyName: 'TechCorp Solutions',
    industry: 'Enterprise Software',
    description: 'TechCorp Solutions is a technology company specializing in enterprise software solutions. Founded in 2010, the company has grown to serve over 1000 customers worldwide with innovative products that help businesses streamline operations and improve productivity.',
    targetMarket: 'Mid-market and enterprise businesses looking to modernize their operations',
    keyOfferings: [
      'Enterprise Resource Planning (ERP) software',
      'Customer Relationship Management (CRM) platform',
      'Business Intelligence and Analytics tools',
      'Workflow automation solutions',
      'Cloud-based collaboration platforms'
    ],
    companySize: 'Mid-Market',
    confidence: 92
  };

  const minimalScrapedData: Partial<DomainAnalysisResult> = {
    domain: 'minimal.com',
    mainContent: [],
    headings: []
  };

  const minimalAIAnalysis: Partial<CompanyAnalysis> = {
    companyName: 'Minimal Company',
    industry: 'Unknown',
    description: 'Brief',
    targetMarket: '',
    keyOfferings: []
  };

  const errorScrapedData: Partial<DomainAnalysisResult> = {
    domain: 'error.com',
    error: 'Failed to scrape website',
    errorCategory: DomainErrorCategory.HTTP_ERROR,
    mainContent: [],
    headings: [],
    fallbackUsed: true
  };

  describe('validateCompanyData', () => {
    it('should validate complete, high-quality company data', () => {
      const result = validateCompanyData(validScrapedData, validAIAnalysis);
      
      expect(result.isValid).toBe(true);
      expect(result.qualityScore).toBeGreaterThanOrEqual(85);
      expect(result.completenessScore).toBeGreaterThanOrEqual(90);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should detect missing domain', () => {
      const dataWithoutDomain = { ...validScrapedData };
      delete (dataWithoutDomain as any).domain;
      
      const result = validateCompanyData(dataWithoutDomain, validAIAnalysis);
      
      expect(result.errors.some(e => 
        e.field === 'scrapedData.domain' && e.code === 'REQUIRED_FIELD_MISSING'
      )).toBe(true);
    });

    it('should validate domain format', () => {
      const invalidDomainData = {
        ...validScrapedData,
        domain: 'invalid-domain-format'
      };
      
      const result = validateCompanyData(invalidDomainData, validAIAnalysis);
      
      expect(result.errors.some(e => 
        e.field === 'scrapedData.domain' && e.code === 'INVALID_DOMAIN_FORMAT'
      )).toBe(true);
    });

    it('should warn about missing main content', () => {
      const result = validateCompanyData(minimalScrapedData, validAIAnalysis, {
        requireMinimumContent: true
      });
      
      expect(result.errors.some(e => 
        e.field === 'scrapedData.mainContent'
      )).toBe(true);
    });

    it('should warn about very brief content', () => {
      const briefContentData = {
        ...validScrapedData,
        mainContent: ['Brief']
      };
      
      const result = validateCompanyData(briefContentData, validAIAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('Very limited content')
      )).toBe(true);
    });

    it('should warn about excessive content length', () => {
      const longContentData = {
        ...validScrapedData,
        mainContent: [new Array(1000).fill('Long content section').join(' ')]
      };
      
      const result = validateCompanyData(longContentData, validAIAnalysis, {
        maxContentLength: 5000
      });
      
      expect(result.warnings.some(w => 
        w.message.includes('exceeds maximum')
      )).toBe(true);
    });

    it('should handle scraping errors gracefully', () => {
      const result = validateCompanyData(errorScrapedData, validAIAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('HTTP error')
      )).toBe(true);
    });

    it('should detect circuit breaker activation', () => {
      const circuitBreakerData = {
        ...validScrapedData,
        error: 'Circuit breaker activated',
        errorCategory: DomainErrorCategory.CIRCUIT_BREAKER
      };
      
      const result = validateCompanyData(circuitBreakerData, validAIAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('Circuit breaker')
      )).toBe(true);
    });

    it('should validate with strict validation options', () => {
      const options: CompanyValidationOptions = {
        strictValidation: true,
        allowPartialData: false,
        requireMinimumContent: true
      };
      
      const result = validateCompanyData(minimalScrapedData, minimalAIAnalysis, options);
      
      expect(result.errors.filter(e => e.severity === 'error').length).toBeGreaterThan(0);
    });

    it('should allow partial data when configured', () => {
      const options: CompanyValidationOptions = {
        allowPartialData: true,
        requireMinimumContent: false
      };
      
      const result = validateCompanyData(minimalScrapedData, minimalAIAnalysis, options);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors.filter(e => e.severity === 'error').length).toBeLessThan(3);
    });
  });

  describe('AI Analysis Validation', () => {
    it('should validate missing company name', () => {
      const analysisWithoutName = { ...validAIAnalysis };
      delete (analysisWithoutName as any).companyName;
      
      const result = validateCompanyData(validScrapedData, analysisWithoutName, {
        allowPartialData: false
      });
      
      expect(result.errors.some(e => 
        e.field === 'aiAnalysis.companyName'
      )).toBe(true);
    });

    it('should warn about missing industry', () => {
      const analysisWithoutIndustry = { ...validAIAnalysis };
      delete (analysisWithoutIndustry as any).industry;
      
      const result = validateCompanyData(validScrapedData, analysisWithoutIndustry);
      
      expect(result.warnings.some(w => 
        w.field === 'aiAnalysis.industry'
      )).toBe(true);
    });

    it('should validate company name quality', () => {
      const suspiciousNames = [
        'home',
        'website.com',
        'www.example.com',
        '12345',
        '!!!'
      ];
      
      suspiciousNames.forEach(name => {
        const analysisWithSuspiciousName = {
          ...validAIAnalysis,
          companyName: name
        };
        
        const result = validateCompanyData(validScrapedData, analysisWithSuspiciousName);
        
        expect(result.warnings.some(w => 
          w.message.includes('generic or extracted incorrectly')
        )).toBe(true);
      });
    });

    it('should validate industry classification', () => {
      const unusualIndustryAnalysis = {
        ...validAIAnalysis,
        industry: 'Completely Unknown Industry Type'
      };
      
      const result = validateCompanyData(validScrapedData, unusualIndustryAnalysis, {
        validateBusinessLogic: true
      });
      
      expect(result.warnings.some(w => 
        w.message.includes('Unusual industry classification')
      )).toBe(true);
    });

    it('should validate description length', () => {
      const briefDescriptionAnalysis = {
        ...validAIAnalysis,
        description: 'Brief'
      };
      
      const longDescriptionAnalysis = {
        ...validAIAnalysis,
        description: new Array(300).fill('Long description').join(' ')
      };
      
      const briefResult = validateCompanyData(validScrapedData, briefDescriptionAnalysis);
      const longResult = validateCompanyData(validScrapedData, longDescriptionAnalysis);
      
      expect(briefResult.warnings.some(w => 
        w.message.includes('very brief')
      )).toBe(true);
      
      expect(longResult.warnings.some(w => 
        w.message.includes('very long')
      )).toBe(true);
    });

    it('should warn about low AI confidence', () => {
      const lowConfidenceAnalysis = {
        ...validAIAnalysis,
        confidence: 30
      };
      
      const result = validateCompanyData(validScrapedData, lowConfidenceAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('Low AI confidence')
      )).toBe(true);
    });

    it('should validate key offerings', () => {
      const noOfferingsAnalysis = {
        ...validAIAnalysis,
        keyOfferings: []
      };
      
      const manyOfferingsAnalysis = {
        ...validAIAnalysis,
        keyOfferings: new Array(25).fill('Sample offering')
      };
      
      const noOfferingsResult = validateCompanyData(validScrapedData, noOfferingsAnalysis);
      const manyOfferingsResult = validateCompanyData(validScrapedData, manyOfferingsAnalysis);
      
      expect(noOfferingsResult.warnings.some(w => 
        w.message.includes('No key offerings')
      )).toBe(true);
      
      expect(manyOfferingsResult.warnings.some(w => 
        w.message.includes('Very large number')
      )).toBe(true);
    });

    it('should validate company size classification', () => {
      const invalidSizeAnalysis = {
        ...validAIAnalysis,
        companySize: 'Completely Invalid Size'
      };
      
      const result = validateCompanyData(validScrapedData, invalidSizeAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('Unusual company size')
      )).toBe(true);
    });

    it('should detect fallback usage', () => {
      const fallbackAnalysis = {
        ...validAIAnalysis,
        fallbackUsed: true
      };
      
      const result = validateCompanyData(validScrapedData, fallbackAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('fallback logic')
      )).toBe(true);
    });
  });

  describe('Data Consistency Validation', () => {
    it('should detect domain-company name inconsistency', () => {
      const inconsistentAnalysis = {
        ...validAIAnalysis,
        companyName: 'Completely Different Company Name Inc'
      };
      
      const inconsistentScrapedData = {
        ...validScrapedData,
        domain: 'totallydifferent.com'
      };
      
      const result = validateCompanyData(inconsistentScrapedData, inconsistentAnalysis, {
        validateBusinessLogic: true
      });
      
      expect(result.warnings.some(w => 
        w.message.includes('Company name and domain appear unrelated')
      )).toBe(true);
    });

    it('should validate meta description consistency', () => {
      const inconsistentScrapedData = {
        ...validScrapedData,
        metaDescription: 'We are a restaurant serving delicious food'
      };
      
      const techAnalysis = {
        ...validAIAnalysis,
        description: 'Advanced technology company specializing in artificial intelligence and machine learning solutions'
      };
      
      const result = validateCompanyData(inconsistentScrapedData, techAnalysis, {
        validateBusinessLogic: true
      });
      
      expect(result.warnings.some(w => 
        w.message.includes('Meta description and AI description appear inconsistent')
      )).toBe(true);
    });
  });

  describe('Quality and Completeness Scoring', () => {
    it('should calculate high scores for complete data', () => {
      const result = validateCompanyData(validScrapedData, validAIAnalysis);
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(85);
      expect(result.completenessScore).toBeGreaterThanOrEqual(90);
    });

    it('should calculate lower scores for incomplete data', () => {
      const result = validateCompanyData(minimalScrapedData, minimalAIAnalysis);
      
      expect(result.qualityScore).toBeLessThan(70);
      expect(result.completenessScore).toBeLessThan(60);
    });

    it('should bonus for high-quality content', () => {
      const highQualityData = {
        ...validScrapedData,
        mainContent: new Array(10).fill('High quality detailed content section with meaningful information')
      };
      
      const highQualityAnalysis = {
        ...validAIAnalysis,
        confidence: 95,
        keyOfferings: [
          'Premium offering 1',
          'Premium offering 2',
          'Premium offering 3'
        ]
      };
      
      const result = validateCompanyData(highQualityData, highQualityAnalysis);
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(90);
    });

    it('should enforce quality thresholds', () => {
      const result = validateCompanyData(minimalScrapedData, minimalAIAnalysis, {
        minContentQuality: 80
      });
      
      expect(result.errors.some(e => 
        e.code === 'QUALITY_THRESHOLD_NOT_MET'
      )).toBe(true);
    });
  });

  describe('Sanitization', () => {
    it('should sanitize scraped data', () => {
      const maliciousScrapedData = {
        ...validScrapedData,
        name: '<script>alert("xss")</script>TechCorp',
        title: 'TechCorp<img onerror="alert(1)" src="x">',
        description: 'Company with javascript:alert("xss") in description',
        mainContent: [
          '<script>evil()</script>Welcome to our site',
          'Normal content here',
          'Content with <b>HTML tags</b>'
        ],
        keywords: ['<script>keyword</script>', 'normal keyword']
      };
      
      const result = validateCompanyData(maliciousScrapedData, validAIAnalysis, {
        sanitizeInput: true
      });
      
      expect(result.sanitizedData?.scrapedData.name).toBe('TechCorp');
      expect(result.sanitizedData?.scrapedData.title).not.toContain('<img');
      expect(result.sanitizedData?.scrapedData.description).not.toContain('javascript:');
      expect(result.sanitizedData?.scrapedData.mainContent?.[0]).toBe('Welcome to our site');
      expect(result.sanitizedData?.scrapedData.mainContent?.[2]).toBe('Content with HTML tags');
      expect(result.sanitizedData?.scrapedData.keywords?.[0]).toBe('keyword');
    });

    it('should sanitize AI analysis data', () => {
      const maliciousAIAnalysis = {
        ...validAIAnalysis,
        companyName: '<script>TechCorp</script>',
        industry: 'Technology<img src="x">',
        description: 'Company description with javascript:alert("xss") malicious code',
        targetMarket: 'Businesses<b>everywhere</b>',
        keyOfferings: [
          '<script>Product 1</script>',
          'Clean product name',
          'Product with <span>HTML</span>'
        ]
      };
      
      const result = validateCompanyData(validScrapedData, maliciousAIAnalysis, {
        sanitizeInput: true
      });
      
      expect(result.sanitizedData?.aiAnalysis.companyName).toBe('TechCorp');
      expect(result.sanitizedData?.aiAnalysis.industry).toBe('Technology');
      expect(result.sanitizedData?.aiAnalysis.description).not.toContain('javascript:');
      expect(result.sanitizedData?.aiAnalysis.targetMarket).toBe('Businesseseverywhere');
      expect(result.sanitizedData?.aiAnalysis.keyOfferings?.[0]).toBe('Product 1');
      expect(result.sanitizedData?.aiAnalysis.keyOfferings?.[2]).toBe('Product with HTML');
    });

    it('should preserve numeric and boolean fields during sanitization', () => {
      const analysisWithSpecialFields = {
        ...validAIAnalysis,
        confidence: 85,
        fallbackUsed: true
      };
      
      const result = validateCompanyData(validScrapedData, analysisWithSpecialFields, {
        sanitizeInput: true
      });
      
      expect(result.sanitizedData?.aiAnalysis.confidence).toBe(85);
      expect(result.sanitizedData?.aiAnalysis.fallbackUsed).toBe(true);
    });
  });

  describe('getCompanyDataHealth', () => {
    it('should return excellent health for high-quality data', () => {
      const health = getCompanyDataHealth(validScrapedData, validAIAnalysis);
      
      expect(health.status).toBe('excellent');
      expect(health.qualityScore).toBeGreaterThanOrEqual(85);
      expect(health.completenessScore).toBeGreaterThanOrEqual(90);
      expect(health.issues).toHaveLength(0);
    });

    it('should return poor health for low-quality data', () => {
      const health = getCompanyDataHealth(minimalScrapedData, minimalAIAnalysis);
      
      expect(health.status).toBe('poor');
      expect(health.qualityScore).toBeLessThan(70);
      expect(health.completenessScore).toBeLessThan(60);
      expect(health.issues.length).toBeGreaterThan(0);
    });

    it('should provide specific recommendations', () => {
      const health = getCompanyDataHealth(minimalScrapedData, minimalAIAnalysis);
      
      expect(health.recommendations.length).toBeGreaterThan(0);
      expect(health.recommendations.some(r => 
        r.includes('complete company information')
      )).toBe(true);
    });

    it('should identify high-impact issues', () => {
      const dataWithErrors = {
        ...validScrapedData,
        error: 'Major scraping failure',
        mainContent: []
      };
      
      const analysisWithIssues = {
        ...validAIAnalysis,
        confidence: 20,
        industry: '',
        keyOfferings: []
      };
      
      const health = getCompanyDataHealth(dataWithErrors, analysisWithIssues);
      
      expect(health.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined input', () => {
      const result = validateCompanyData(null as any, null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty objects', () => {
      const result = validateCompanyData({}, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data types', () => {
      const malformedScrapedData = {
        domain: 123, // Wrong type
        mainContent: 'not an array', // Wrong type
        headings: null // Wrong type
      } as any;
      
      const malformedAIAnalysis = {
        companyName: [], // Wrong type
        keyOfferings: 'not an array', // Wrong type
        confidence: 'high' // Wrong type
      } as any;
      
      const result = validateCompanyData(malformedScrapedData, malformedAIAnalysis);
      
      expect(result.errors.some(e => e.code === 'INVALID_TYPE')).toBe(true);
    });

    it('should handle extreme content lengths', () => {
      const extremeContentData = {
        ...validScrapedData,
        mainContent: [new Array(10000).fill('x').join('')] // Very long content
      };
      
      const result = validateCompanyData(extremeContentData, validAIAnalysis);
      
      expect(result.warnings.some(w => 
        w.message.includes('exceeds maximum')
      )).toBe(true);
    });
  });

  describe('Industry and Company Size Validation', () => {
    it('should recognize valid industries', () => {
      COMMON_INDUSTRIES.forEach(industry => {
        const analysisWithValidIndustry = {
          ...validAIAnalysis,
          industry
        };
        
        const result = validateCompanyData(validScrapedData, analysisWithValidIndustry, {
          validateBusinessLogic: true
        });
        
        // Should not warn about valid industries
        expect(result.warnings.some(w => 
          w.message.includes('Unusual industry classification')
        )).toBe(false);
      });
    });

    it('should recognize valid company sizes', () => {
      COMPANY_SIZE_VALUES.forEach(size => {
        const analysisWithValidSize = {
          ...validAIAnalysis,
          companySize: size
        };
        
        const result = validateCompanyData(validScrapedData, analysisWithValidSize);
        
        // Should not warn about valid company sizes
        expect(result.warnings.some(w => 
          w.message.includes('Unusual company size')
        )).toBe(false);
      });
    });
  });

  describe('Performance', () => {
    it('should validate complex company data quickly', () => {
      const complexScrapedData = {
        ...validScrapedData,
        mainContent: new Array(500).fill('Complex content section with detailed information'),
        headings: new Array(100).fill('Complex heading'),
        keywords: new Array(50).fill('keyword')
      };
      
      const complexAIAnalysis = {
        ...validAIAnalysis,
        keyOfferings: new Array(50).fill('Complex offering description'),
        description: new Array(100).fill('Complex description sentence').join(' ')
      };
      
      const start = performance.now();
      const result = validateCompanyData(complexScrapedData, complexAIAnalysis);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(300); // Should complete within 300ms
      expect(result).toBeDefined();
    });
  });
});