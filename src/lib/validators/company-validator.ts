/**
 * Company Data Validator
 * Phase 3.2: Comprehensive company data validation and sanitization
 */

import { DomainAnalysisResult, CompanyAnalysis, DomainErrorCategory } from '../domain-analyzer';

export interface CompanyValidationResult {
  isValid: boolean;
  errors: CompanyValidationError[];
  warnings: CompanyValidationWarning[];
  sanitizedData?: {
    scrapedData: Partial<DomainAnalysisResult>;
    aiAnalysis: Partial<CompanyAnalysis>;
  };
  qualityScore: number; // 0-100 data quality score
  completenessScore: number; // 0-100 data completeness score
}

export interface CompanyValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  suggestedFix?: string;
}

export interface CompanyValidationWarning {
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface CompanyValidationOptions {
  strictValidation?: boolean;
  allowPartialData?: boolean;
  sanitizeInput?: boolean;
  requireMinimumContent?: boolean;
  validateBusinessLogic?: boolean;
  maxContentLength?: number;
  minContentQuality?: number; // 0-100 minimum acceptable content quality
}

/**
 * Company size validation values
 */
export const COMPANY_SIZE_VALUES = [
  'Startup',
  'Small Business',
  'Mid-Market',
  'Enterprise',
  'Fortune 500',
  'Fortune 1000',
  'Unknown'
] as const;

export type CompanySize = typeof COMPANY_SIZE_VALUES[number];

/**
 * Industry validation - common industry categories
 */
export const COMMON_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Manufacturing',
  'Retail',
  'Education',
  'Professional Services',
  'Real Estate',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Government',
  'Non-Profit',
  'Agriculture',
  'Construction',
  'Hospitality',
  'Telecommunications',
  'Automotive',
  'Aerospace',
  'Pharmaceuticals',
  'Consulting',
  'E-commerce',
  'Software',
  'Hardware',
  'Biotech',
  'Fintech',
  'Unknown'
] as const;

export type Industry = typeof COMMON_INDUSTRIES[number];

/**
 * Comprehensive company data validation
 */
export function validateCompanyData(
  scrapedData: Partial<DomainAnalysisResult>,
  aiAnalysis: Partial<CompanyAnalysis>,
  options: CompanyValidationOptions = {}
): CompanyValidationResult {
  const errors: CompanyValidationError[] = [];
  const warnings: CompanyValidationWarning[] = [];

  const {
    strictValidation = false,
    allowPartialData = true,
    sanitizeInput = true,
    requireMinimumContent = true,
    validateBusinessLogic = true,
    maxContentLength = 50000,
    minContentQuality = 60
  } = options;

  // Validate scraped data
  validateScrapedDataStructure(scrapedData, errors, warnings, {
    requireMinimumContent,
    maxContentLength,
    allowPartialData
  });

  // Validate AI analysis
  validateAIAnalysisStructure(aiAnalysis, errors, warnings, {
    strictValidation,
    allowPartialData,
    validateBusinessLogic
  });

  // Cross-validate data consistency
  if (validateBusinessLogic) {
    validateDataConsistency(scrapedData, aiAnalysis, errors, warnings);
  }

  // Calculate quality and completeness scores
  const qualityScore = calculateQualityScore(scrapedData, aiAnalysis, errors, warnings);
  const completenessScore = calculateCompletenessScore(scrapedData, aiAnalysis);

  // Check minimum quality threshold
  if (minContentQuality > 0 && qualityScore < minContentQuality) {
    errors.push({
      field: 'overall',
      message: `Data quality score ${qualityScore}% is below minimum threshold ${minContentQuality}%`,
      severity: 'error',
      code: 'QUALITY_THRESHOLD_NOT_MET',
      suggestedFix: 'Improve data collection or use manual review'
    });
  }

  // Sanitize data if requested
  let sanitizedData: { scrapedData: Partial<DomainAnalysisResult>; aiAnalysis: Partial<CompanyAnalysis> } | undefined;
  if (sanitizeInput) {
    sanitizedData = {
      scrapedData: sanitizeScrapedData(scrapedData),
      aiAnalysis: sanitizeAIAnalysis(aiAnalysis)
    };
  }

  const isValid = errors.filter(e => e.severity === 'error').length === 0;

  return {
    isValid,
    errors,
    warnings,
    sanitizedData,
    qualityScore,
    completenessScore
  };
}

/**
 * Validate scraped data structure and content
 */
function validateScrapedDataStructure(
  data: Partial<DomainAnalysisResult>,
  errors: CompanyValidationError[],
  warnings: CompanyValidationWarning[],
  options: {
    requireMinimumContent: boolean;
    maxContentLength: number;
    allowPartialData: boolean;
  }
): void {
  // Validate domain
  if (!data.domain) {
    errors.push({
      field: 'scrapedData.domain',
      message: 'Domain is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING',
      suggestedFix: 'Ensure domain is provided for analysis'
    });
  } else if (!isValidDomain(data.domain)) {
    errors.push({
      field: 'scrapedData.domain',
      message: 'Invalid domain format',
      severity: 'error',
      code: 'INVALID_DOMAIN_FORMAT',
      suggestedFix: 'Use proper domain format (e.g., example.com)'
    });
  }

  // Validate main content
  if (!data.mainContent || !Array.isArray(data.mainContent)) {
    if (options.requireMinimumContent) {
      errors.push({
        field: 'scrapedData.mainContent',
        message: 'Main content is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      warnings.push({
        field: 'scrapedData.mainContent',
        message: 'Main content is missing',
        impact: 'high',
        suggestion: 'Limited content may affect analysis quality'
      });
    }
  } else {
    const totalContentLength = data.mainContent.join(' ').length;
    
    if (totalContentLength === 0) {
      warnings.push({
        field: 'scrapedData.mainContent',
        message: 'Main content is empty',
        impact: 'high',
        suggestion: 'Website may be dynamic or access restricted'
      });
    } else if (totalContentLength > options.maxContentLength) {
      warnings.push({
        field: 'scrapedData.mainContent',
        message: `Content length (${totalContentLength}) exceeds maximum (${options.maxContentLength})`,
        impact: 'medium',
        suggestion: 'Content may be truncated for processing'
      });
    } else if (totalContentLength < 100) {
      warnings.push({
        field: 'scrapedData.mainContent',
        message: 'Very limited content available',
        impact: 'high',
        suggestion: 'May indicate scraping issues or minimal website content'
      });
    }

    // Check content quality indicators
    const hasNavigationText = data.mainContent.some(content => 
      /home|about|contact|services|products/i.test(content)
    );
    if (!hasNavigationText && totalContentLength > 0) {
      warnings.push({
        field: 'scrapedData.mainContent',
        message: 'Content appears to lack typical website structure',
        impact: 'medium',
        suggestion: 'May be a single-page application or unusual site structure'
      });
    }
  }

  // Validate headings
  if (!data.headings || !Array.isArray(data.headings) || data.headings.length === 0) {
    warnings.push({
      field: 'scrapedData.headings',
      message: 'No headings found',
      impact: 'medium',
      suggestion: 'Website may lack structured content'
    });
  }

  // Validate meta description
  if (!data.metaDescription) {
    warnings.push({
      field: 'scrapedData.metaDescription',
      message: 'Meta description not found',
      impact: 'low',
      suggestion: 'Meta description can provide valuable company overview'
    });
  } else if (data.metaDescription.length < 50) {
    warnings.push({
      field: 'scrapedData.metaDescription',
      message: 'Meta description is very short',
      impact: 'low',
      suggestion: 'Brief meta descriptions may provide limited insight'
    });
  }

  // Check for errors
  if (data.error) {
    const errorCategory = data.errorCategory || DomainErrorCategory.PARSING_ERROR;
    
    switch (errorCategory) {
      case DomainErrorCategory.NETWORK_ERROR:
      case DomainErrorCategory.TIMEOUT:
        warnings.push({
          field: 'scrapedData.error',
          message: `Network issue: ${data.error}`,
          impact: 'high',
          suggestion: 'Retry scraping or use alternative data sources'
        });
        break;
      case DomainErrorCategory.HTTP_ERROR:
        warnings.push({
          field: 'scrapedData.error',
          message: `HTTP error: ${data.error}`,
          impact: 'high',
          suggestion: 'Website may be down or access restricted'
        });
        break;
      case DomainErrorCategory.CIRCUIT_BREAKER:
        warnings.push({
          field: 'scrapedData.error',
          message: `Circuit breaker activated: ${data.error}`,
          impact: 'high',
          suggestion: 'Domain experiencing issues - retry later'
        });
        break;
      default:
        warnings.push({
          field: 'scrapedData.error',
          message: `Scraping error: ${data.error}`,
          impact: 'medium',
          suggestion: 'Review error details and consider manual analysis'
        });
    }
  }

  // Validate fallback usage
  if (data.fallbackUsed) {
    warnings.push({
      field: 'scrapedData.fallbackUsed',
      message: 'Fallback data was used',
      impact: 'medium',
      suggestion: 'Primary scraping failed - data may be incomplete'
    });
  }
}

/**
 * Validate AI analysis structure and content
 */
function validateAIAnalysisStructure(
  analysis: Partial<CompanyAnalysis>,
  errors: CompanyValidationError[],
  warnings: CompanyValidationWarning[],
  options: {
    strictValidation: boolean;
    allowPartialData: boolean;
    validateBusinessLogic: boolean;
  }
): void {
  // Validate company name
  if (!analysis.companyName) {
    if (!options.allowPartialData) {
      errors.push({
        field: 'aiAnalysis.companyName',
        message: 'Company name is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      warnings.push({
        field: 'aiAnalysis.companyName',
        message: 'Company name not extracted',
        impact: 'medium',
        suggestion: 'Company name improves qualification accuracy'
      });
    }
  } else if (typeof analysis.companyName !== 'string' || analysis.companyName.trim().length === 0) {
    errors.push({
      field: 'aiAnalysis.companyName',
      message: 'Company name must be a non-empty string',
      severity: 'error',
      code: 'INVALID_VALUE'
    });
  } else if (analysis.companyName.length > 200) {
    warnings.push({
      field: 'aiAnalysis.companyName',
      message: 'Company name appears unusually long',
      impact: 'low',
      suggestion: 'Verify extracted name is correct'
    });
  } else if (isSuspiciousCompanyName(analysis.companyName)) {
    warnings.push({
      field: 'aiAnalysis.companyName',
      message: 'Company name appears to be generic or extracted incorrectly',
      impact: 'medium',
      suggestion: 'Manual verification recommended'
    });
  }

  // Validate industry
  if (!analysis.industry) {
    if (!options.allowPartialData) {
      errors.push({
        field: 'aiAnalysis.industry',
        message: 'Industry is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      warnings.push({
        field: 'aiAnalysis.industry',
        message: 'Industry not identified',
        impact: 'high',
        suggestion: 'Industry classification is critical for qualification'
      });
    }
  } else if (typeof analysis.industry !== 'string' || analysis.industry.trim().length === 0) {
    errors.push({
      field: 'aiAnalysis.industry',
      message: 'Industry must be a non-empty string',
      severity: 'error',
      code: 'INVALID_VALUE'
    });
  } else if (options.validateBusinessLogic && !isValidIndustry(analysis.industry)) {
    warnings.push({
      field: 'aiAnalysis.industry',
      message: `Unusual industry classification: ${analysis.industry}`,
      impact: 'medium',
      suggestion: 'Verify industry classification is accurate'
    });
  }

  // Validate description
  if (!analysis.description) {
    warnings.push({
      field: 'aiAnalysis.description',
      message: 'Company description not extracted',
      impact: 'medium',
      suggestion: 'Description provides valuable context for qualification'
    });
  } else if (typeof analysis.description !== 'string') {
    errors.push({
      field: 'aiAnalysis.description',
      message: 'Description must be a string',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (analysis.description.length < 20) {
    warnings.push({
      field: 'aiAnalysis.description',
      message: 'Company description is very brief',
      impact: 'medium',
      suggestion: 'Brief descriptions may limit qualification accuracy'
    });
  } else if (analysis.description.length > 2000) {
    warnings.push({
      field: 'aiAnalysis.description',
      message: 'Company description is very long',
      impact: 'low',
      suggestion: 'May need summarization for processing efficiency'
    });
  }

  // Validate target market
  if (!analysis.targetMarket) {
    warnings.push({
      field: 'aiAnalysis.targetMarket',
      message: 'Target market not identified',
      impact: 'medium',
      suggestion: 'Target market helps assess customer fit'
    });
  } else if (typeof analysis.targetMarket !== 'string') {
    errors.push({
      field: 'aiAnalysis.targetMarket',
      message: 'Target market must be a string',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  }

  // Validate key offerings
  if (!analysis.keyOfferings) {
    warnings.push({
      field: 'aiAnalysis.keyOfferings',
      message: 'Key offerings not identified',
      impact: 'medium',
      suggestion: 'Key offerings help assess solution fit'
    });
  } else if (!Array.isArray(analysis.keyOfferings)) {
    errors.push({
      field: 'aiAnalysis.keyOfferings',
      message: 'Key offerings must be an array',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (analysis.keyOfferings.length === 0) {
    warnings.push({
      field: 'aiAnalysis.keyOfferings',
      message: 'No key offerings identified',
      impact: 'medium',
      suggestion: 'Products/services information improves qualification'
    });
  } else if (analysis.keyOfferings.length > 20) {
    warnings.push({
      field: 'aiAnalysis.keyOfferings',
      message: 'Very large number of key offerings identified',
      impact: 'low',
      suggestion: 'Consider focusing on primary offerings'
    });
  }

  // Validate company size
  if (analysis.companySize && !isValidCompanySize(analysis.companySize)) {
    warnings.push({
      field: 'aiAnalysis.companySize',
      message: `Unusual company size classification: ${analysis.companySize}`,
      impact: 'low',
      suggestion: 'Verify size classification is accurate'
    });
  }

  // Validate confidence score
  if (analysis.confidence !== undefined) {
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 100) {
      errors.push({
        field: 'aiAnalysis.confidence',
        message: 'Confidence must be a number between 0 and 100',
        severity: 'error',
        code: 'INVALID_RANGE'
      });
    } else if (analysis.confidence < 50) {
      warnings.push({
        field: 'aiAnalysis.confidence',
        message: `Low AI confidence: ${analysis.confidence}%`,
        impact: 'high',
        suggestion: 'Consider manual review or additional data collection'
      });
    }
  }

  // Check fallback usage
  if (analysis.fallbackUsed) {
    warnings.push({
      field: 'aiAnalysis.fallbackUsed',
      message: 'AI analysis used fallback logic',
      impact: 'medium',
      suggestion: 'Primary AI analysis failed - results may be less detailed'
    });
  }
}

/**
 * Validate data consistency between scraped data and AI analysis
 */
function validateDataConsistency(
  scrapedData: Partial<DomainAnalysisResult>,
  aiAnalysis: Partial<CompanyAnalysis>,
  errors: CompanyValidationError[],
  warnings: CompanyValidationWarning[]
): void {
  // Check domain consistency
  if (scrapedData.domain && aiAnalysis.companyName) {
    const domainParts = scrapedData.domain.split('.');
    const companyName = aiAnalysis.companyName.toLowerCase();
    
    const hasCompanyInDomain = domainParts.some(part => 
      companyName.includes(part.toLowerCase()) || part.toLowerCase().includes(companyName.substring(0, 5))
    );
    
    if (!hasCompanyInDomain && scrapedData.domain !== aiAnalysis.companyName) {
      warnings.push({
        field: 'consistency',
        message: 'Company name and domain appear unrelated',
        impact: 'medium',
        suggestion: 'Verify extracted company name is correct'
      });
    }
  }

  // Check content consistency
  if (scrapedData.mainContent && aiAnalysis.description) {
    const hasDescriptionContent = scrapedData.mainContent.some(content =>
      content.toLowerCase().includes(aiAnalysis.description!.substring(0, 50).toLowerCase())
    );
    
    if (!hasDescriptionContent && aiAnalysis.description.length > 100) {
      warnings.push({
        field: 'consistency',
        message: 'AI-generated description may not match scraped content',
        impact: 'low',
        suggestion: 'Verify description accuracy'
      });
    }
  }

  // Check meta description consistency
  if (scrapedData.metaDescription && aiAnalysis.description) {
    const similarity = calculateStringSimilarity(
      scrapedData.metaDescription.toLowerCase(),
      aiAnalysis.description.toLowerCase()
    );
    
    if (similarity < 0.3 && scrapedData.metaDescription.length > 50) {
      warnings.push({
        field: 'consistency',
        message: 'Meta description and AI description appear inconsistent',
        impact: 'low',
        suggestion: 'Consider which description is more accurate'
      });
    }
  }
}

/**
 * Calculate data quality score
 */
function calculateQualityScore(
  scrapedData: Partial<DomainAnalysisResult>,
  aiAnalysis: Partial<CompanyAnalysis>,
  errors: CompanyValidationError[],
  warnings: CompanyValidationWarning[]
): number {
  let score = 100;

  // Deduct for errors
  errors.forEach(error => {
    score -= error.severity === 'error' ? 20 : 10;
  });

  // Deduct for warnings based on impact
  warnings.forEach(warning => {
    switch (warning.impact) {
      case 'high': score -= 15; break;
      case 'medium': score -= 10; break;
      case 'low': score -= 5; break;
    }
  });

  // Bonus for data presence and quality
  if (scrapedData.mainContent && scrapedData.mainContent.length > 0) {
    const contentLength = scrapedData.mainContent.join(' ').length;
    if (contentLength > 500) {score += 10;}
    else if (contentLength > 100) {score += 5;}
  }

  if (aiAnalysis.companyName && aiAnalysis.industry && aiAnalysis.description) {
    score += 10;
  }

  if (aiAnalysis.keyOfferings && aiAnalysis.keyOfferings.length > 0) {
    score += 5;
  }

  if (aiAnalysis.confidence && aiAnalysis.confidence > 80) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate data completeness score
 */
function calculateCompletenessScore(
  scrapedData: Partial<DomainAnalysisResult>,
  aiAnalysis: Partial<CompanyAnalysis>
): number {
  let score = 0;
  const totalFields = 10; // Total trackable fields

  // Scraped data fields (4 fields)
  if (scrapedData.domain) {score += 10;}
  if (scrapedData.mainContent && scrapedData.mainContent.length > 0) {score += 10;}
  if (scrapedData.headings && scrapedData.headings.length > 0) {score += 10;}
  if (scrapedData.metaDescription) {score += 10;}

  // AI analysis fields (6 fields)
  if (aiAnalysis.companyName) {score += 10;}
  if (aiAnalysis.industry) {score += 10;}
  if (aiAnalysis.description) {score += 10;}
  if (aiAnalysis.targetMarket) {score += 10;}
  if (aiAnalysis.keyOfferings && aiAnalysis.keyOfferings.length > 0) {score += 10;}
  if (aiAnalysis.companySize) {score += 10;}

  return score;
}

/**
 * Sanitize scraped data
 */
function sanitizeScrapedData(data: Partial<DomainAnalysisResult>): Partial<DomainAnalysisResult> {
  const sanitized: Partial<DomainAnalysisResult> = {};

  if (data.domain) {
    sanitized.domain = sanitizeString(data.domain).toLowerCase();
  }
  if (data.name) {
    sanitized.name = sanitizeString(data.name);
  }
  if (data.title) {
    sanitized.title = sanitizeString(data.title);
  }
  if (data.description) {
    sanitized.description = sanitizeString(data.description);
  }
  if (data.industry) {
    sanitized.industry = sanitizeString(data.industry);
  }
  if (data.metaDescription) {
    sanitized.metaDescription = sanitizeString(data.metaDescription);
  }

  if (data.mainContent) {
    sanitized.mainContent = data.mainContent.map(content => sanitizeString(content));
  }
  if (data.headings) {
    sanitized.headings = data.headings.map(heading => sanitizeString(heading));
  }
  if (data.keywords) {
    sanitized.keywords = data.keywords.map(keyword => sanitizeString(keyword));
  }

  // Copy non-string fields as-is
  if (data.error) {sanitized.error = data.error;}
  if (data.scrapeAttempts) {sanitized.scrapeAttempts = data.scrapeAttempts;}
  if (data.fallbackUsed) {sanitized.fallbackUsed = data.fallbackUsed;}
  if (data.errorCategory) {sanitized.errorCategory = data.errorCategory;}
  if (data.timestamp) {sanitized.timestamp = data.timestamp;}

  return sanitized;
}

/**
 * Sanitize AI analysis data
 */
function sanitizeAIAnalysis(analysis: Partial<CompanyAnalysis>): Partial<CompanyAnalysis> {
  const sanitized: Partial<CompanyAnalysis> = {};

  if (analysis.companyName) {
    sanitized.companyName = sanitizeString(analysis.companyName);
  }
  if (analysis.industry) {
    sanitized.industry = sanitizeString(analysis.industry);
  }
  if (analysis.description) {
    sanitized.description = sanitizeString(analysis.description);
  }
  if (analysis.targetMarket) {
    sanitized.targetMarket = sanitizeString(analysis.targetMarket);
  }
  if (analysis.companySize) {
    sanitized.companySize = sanitizeString(analysis.companySize);
  }

  if (analysis.keyOfferings) {
    sanitized.keyOfferings = analysis.keyOfferings.map(offering => sanitizeString(offering));
  }

  // Copy numeric/boolean fields as-is
  if (analysis.confidence !== undefined) {sanitized.confidence = analysis.confidence;}
  if (analysis.fallbackUsed !== undefined) {sanitized.fallbackUsed = analysis.fallbackUsed;}

  return sanitized;
}

/**
 * Helper functions
 */
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

function isSuspiciousCompanyName(name: string): boolean {
  const suspiciousPatterns = [
    /^(home|about|contact|welcome|page|website|site|domain|company|business)$/i,
    /^[a-z]+\.(com|org|net|edu)$/i,
    /^www\./i,
    /^\d+$/,
    /^[^a-zA-Z]*$/
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(name.trim()));
}

function isValidIndustry(industry: string): boolean {
  const normalizedIndustry = industry.toLowerCase().trim();
  return COMMON_INDUSTRIES.some(validIndustry => 
    validIndustry.toLowerCase().includes(normalizedIndustry) ||
    normalizedIndustry.includes(validIndustry.toLowerCase())
  );
}

function isValidCompanySize(size: string): boolean {
  const normalizedSize = size.toLowerCase().trim();
  return COMPANY_SIZE_VALUES.some(validSize =>
    validSize.toLowerCase().includes(normalizedSize) ||
    normalizedSize.includes(validSize.toLowerCase())
  );
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

function sanitizeString(input: string): string {
  if (typeof input !== 'string') {return '';}
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ') // HTML entities
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get company data health report
 */
export function getCompanyDataHealth(
  scrapedData: Partial<DomainAnalysisResult>,
  aiAnalysis: Partial<CompanyAnalysis>
): {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  recommendations: string[];
  qualityScore: number;
  completenessScore: number;
} {
  const validation = validateCompanyData(scrapedData, aiAnalysis, {
    strictValidation: false,
    allowPartialData: true,
    validateBusinessLogic: true
  });

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Collect issues from errors and high-impact warnings
  validation.errors.forEach(error => {
    issues.push(error.message);
  });

  validation.warnings
    .filter(warning => warning.impact === 'high')
    .forEach(warning => {
      issues.push(warning.message);
      if (warning.suggestion) {
        recommendations.push(warning.suggestion);
      }
    });

  // Add general recommendations
  if (validation.completenessScore < 70) {
    recommendations.push('Improve data collection to get more complete company information');
  }
  if (validation.qualityScore < 80) {
    recommendations.push('Review data sources and extraction methods for better quality');
  }

  let status: 'excellent' | 'good' | 'fair' | 'poor';
  if (validation.qualityScore >= 90 && validation.completenessScore >= 80) {
    status = 'excellent';
  } else if (validation.qualityScore >= 75 && validation.completenessScore >= 60) {
    status = 'good';
  } else if (validation.qualityScore >= 60 && validation.completenessScore >= 40) {
    status = 'fair';
  } else {
    status = 'poor';
  }

  return {
    status,
    issues,
    recommendations,
    qualityScore: validation.qualityScore,
    completenessScore: validation.completenessScore
  };
}