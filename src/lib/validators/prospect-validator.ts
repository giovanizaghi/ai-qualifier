/**
 * Prospect Data Validator
 * Phase 3.2: Comprehensive prospect qualification data validation
 */

import { 
  QualificationResult, 
  MatchedCriteria, 
  FitLevel, 
  SCORE_BOUNDS, 
  FIT_LEVEL_THRESHOLDS 
} from '../prospect-qualifier';
import { DomainAnalysisResult, CompanyAnalysis, DomainErrorCategory } from '../domain-analyzer';

export interface ProspectValidationResult {
  isValid: boolean;
  errors: ProspectValidationError[];
  warnings: ProspectValidationWarning[];
  sanitizedData?: Partial<QualificationResult>;
  qualityScore: number; // 0-100 data quality score
}

export interface ProspectValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  suggestedFix?: string;
}

export interface ProspectValidationWarning {
  field: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface ProspectValidationOptions {
  strictValidation?: boolean;
  allowPartialData?: boolean;
  sanitizeInput?: boolean;
  validateScoreAlignment?: boolean;
  requireDomainData?: boolean;
  maxScoreDeviation?: number; // Maximum allowed score deviation for fallback scenarios
}

/**
 * Comprehensive prospect qualification result validation
 */
export function validateProspectResult(
  result: Partial<QualificationResult>,
  options: ProspectValidationOptions = {}
): ProspectValidationResult {
  const errors: ProspectValidationError[] = [];
  const warnings: ProspectValidationWarning[] = [];
  let qualityScore = 100;

  const {
    strictValidation = false,
    allowPartialData = true,
    sanitizeInput = true,
    validateScoreAlignment = true,
    requireDomainData = true,
    maxScoreDeviation = 15
  } = options;

  // Validate basic required fields
  validateBasicFields(result, errors, warnings, allowPartialData);

  // Validate score and fit level alignment
  if (validateScoreAlignment) {
    validateScoreFitAlignment(result, errors, warnings, maxScoreDeviation);
  }

  // Validate prospect data quality
  if (result.prospectData) {
    validateProspectData(result.prospectData, errors, warnings, requireDomainData);
  } else if (requireDomainData) {
    errors.push({
      field: 'prospectData',
      message: 'Prospect data is required',
      severity: 'error',
      code: 'MISSING_PROSPECT_DATA',
      suggestedFix: 'Ensure domain analysis was completed before qualification'
    });
  }

  // Validate matched criteria structure
  if (result.matchedCriteria) {
    validateMatchedCriteria(result.matchedCriteria, errors, warnings);
  }

  // Validate processing metadata
  if (result.processing) {
    validateProcessingMetadata(result.processing, errors, warnings);
  }

  // Validate score validation metadata
  if (result.scoreValidation) {
    validateScoreValidationMetadata(result.scoreValidation, errors, warnings);
  }

  // Calculate quality score
  qualityScore = calculateDataQualityScore(result, errors, warnings);

  // Sanitize data if requested
  let sanitizedData: Partial<QualificationResult> | undefined;
  if (sanitizeInput) {
    sanitizedData = sanitizeProspectResult(result);
  }

  const isValid = errors.filter(e => e.severity === 'error').length === 0;

  return {
    isValid,
    errors,
    warnings,
    sanitizedData,
    qualityScore
  };
}

/**
 * Validate basic required fields
 */
function validateBasicFields(
  result: Partial<QualificationResult>,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[],
  allowPartialData: boolean
): void {
  // Validate domain
  if (!result.prospectDomain) {
    errors.push({
      field: 'prospectDomain',
      message: 'Prospect domain is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING',
      suggestedFix: 'Provide a valid domain name'
    });
  } else if (!isValidDomain(result.prospectDomain)) {
    errors.push({
      field: 'prospectDomain',
      message: 'Invalid domain format',
      severity: 'error',
      code: 'INVALID_DOMAIN_FORMAT',
      suggestedFix: 'Ensure domain follows proper format (e.g., example.com)'
    });
  }

  // Validate prospect name
  if (!result.prospectName) {
    if (!allowPartialData) {
      errors.push({
        field: 'prospectName',
        message: 'Prospect name is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      warnings.push({
        field: 'prospectName',
        message: 'Prospect name is missing',
        impact: 'medium',
        suggestion: 'Company name improves qualification accuracy'
      });
    }
  } else if (typeof result.prospectName !== 'string' || result.prospectName.trim().length === 0) {
    errors.push({
      field: 'prospectName',
      message: 'Prospect name must be a non-empty string',
      severity: 'error',
      code: 'INVALID_VALUE'
    });
  }

  // Validate score
  if (result.score === undefined || result.score === null) {
    errors.push({
      field: 'score',
      message: 'Score is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else if (typeof result.score !== 'number' || isNaN(result.score)) {
    errors.push({
      field: 'score',
      message: 'Score must be a valid number',
      severity: 'error',
      code: 'INVALID_TYPE',
      suggestedFix: 'Ensure score is a number between 0 and 100'
    });
  } else if (result.score < SCORE_BOUNDS.MIN || result.score > SCORE_BOUNDS.MAX) {
    errors.push({
      field: 'score',
      message: `Score must be between ${SCORE_BOUNDS.MIN} and ${SCORE_BOUNDS.MAX}`,
      severity: 'error',
      code: 'SCORE_OUT_OF_BOUNDS',
      suggestedFix: `Clamp score to valid range`
    });
  }

  // Validate fit level
  if (!result.fitLevel) {
    errors.push({
      field: 'fitLevel',
      message: 'Fit level is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else if (!isValidFitLevel(result.fitLevel)) {
    errors.push({
      field: 'fitLevel',
      message: 'Invalid fit level',
      severity: 'error',
      code: 'INVALID_FIT_LEVEL',
      suggestedFix: 'Must be one of: EXCELLENT, GOOD, FAIR, POOR'
    });
  }

  // Validate reasoning
  if (!result.reasoning) {
    if (!allowPartialData) {
      errors.push({
        field: 'reasoning',
        message: 'Reasoning is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    } else {
      warnings.push({
        field: 'reasoning',
        message: 'Reasoning is missing',
        impact: 'high',
        suggestion: 'Reasoning provides important context for qualification decisions'
      });
    }
  } else if (typeof result.reasoning !== 'string') {
    errors.push({
      field: 'reasoning',
      message: 'Reasoning must be a string',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (result.reasoning.trim().length < 10) {
    warnings.push({
      field: 'reasoning',
      message: 'Reasoning appears too brief',
      impact: 'medium',
      suggestion: 'Provide more detailed explanation for qualification decision'
    });
  }
}

/**
 * Validate score and fit level alignment
 */
function validateScoreFitAlignment(
  result: Partial<QualificationResult>,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[],
  maxDeviation: number
): void {
  if (typeof result.score !== 'number' || !result.fitLevel) {
    return; // Skip if basic validation failed
  }

  const expectedFitLevel = getExpectedFitLevel(result.score);
  
  if (result.fitLevel !== expectedFitLevel) {
    // Check if this is within acceptable deviation for edge cases
    const scoreMidpoint = getFitLevelMidpoint(result.fitLevel);
    const deviation = Math.abs(result.score - scoreMidpoint);
    
    if (deviation > maxDeviation) {
      errors.push({
        field: 'fitLevel',
        message: `Fit level "${result.fitLevel}" doesn't align with score ${result.score}. Expected "${expectedFitLevel}"`,
        severity: 'error',
        code: 'SCORE_FIT_MISMATCH',
        suggestedFix: `Adjust fit level to "${expectedFitLevel}" or review score calculation`
      });
    } else {
      warnings.push({
        field: 'fitLevel',
        message: `Fit level "${result.fitLevel}" is close to boundary with score ${result.score}`,
        impact: 'low',
        suggestion: 'Consider if score accurately reflects the assessment'
      });
    }
  }
}

/**
 * Validate prospect data structure and quality
 */
function validateProspectData(
  prospectData: { scrapedData: DomainAnalysisResult; aiAnalysis: CompanyAnalysis },
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[],
  requireDomainData: boolean
): void {
  // Validate scraped data
  if (!prospectData.scrapedData) {
    if (requireDomainData) {
      errors.push({
        field: 'prospectData.scrapedData',
        message: 'Scraped data is missing',
        severity: 'error',
        code: 'MISSING_SCRAPED_DATA'
      });
    }
  } else {
    validateScrapedData(prospectData.scrapedData, errors, warnings);
  }

  // Validate AI analysis
  if (!prospectData.aiAnalysis) {
    if (requireDomainData) {
      errors.push({
        field: 'prospectData.aiAnalysis',
        message: 'AI analysis is missing',
        severity: 'error',
        code: 'MISSING_AI_ANALYSIS'
      });
    }
  } else {
    validateAIAnalysis(prospectData.aiAnalysis, errors, warnings);
  }
}

/**
 * Validate scraped data quality
 */
function validateScrapedData(
  scrapedData: DomainAnalysisResult,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[]
): void {
  // Check for scraping errors
  if (scrapedData.error) {
    warnings.push({
      field: 'prospectData.scrapedData',
      message: `Scraping error: ${scrapedData.error}`,
      impact: 'high',
      suggestion: 'Limited data may affect qualification accuracy'
    });
  }

  // Check data completeness
  if (!scrapedData.mainContent || scrapedData.mainContent.length === 0) {
    warnings.push({
      field: 'prospectData.scrapedData.mainContent',
      message: 'No main content was scraped',
      impact: 'high',
      suggestion: 'Manual review may be needed for accurate qualification'
    });
  }

  if (!scrapedData.headings || scrapedData.headings.length === 0) {
    warnings.push({
      field: 'prospectData.scrapedData.headings',
      message: 'No headings were found',
      impact: 'medium',
      suggestion: 'Website structure may be limiting data extraction'
    });
  }

  // Check for circuit breaker activation
  if (scrapedData.errorCategory === DomainErrorCategory.CIRCUIT_BREAKER) {
    warnings.push({
      field: 'prospectData.scrapedData',
      message: 'Circuit breaker was activated for this domain',
      impact: 'high',
      suggestion: 'Domain may be experiencing issues - retry later'
    });
  }

  // Check fallback usage
  if (scrapedData.fallbackUsed) {
    warnings.push({
      field: 'prospectData.scrapedData',
      message: 'Fallback data was used',
      impact: 'medium',
      suggestion: 'Qualification may be less accurate due to limited data'
    });
  }
}

/**
 * Validate AI analysis quality
 */
function validateAIAnalysis(
  aiAnalysis: CompanyAnalysis,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[]
): void {
  // Validate required fields
  if (!aiAnalysis.companyName) {
    warnings.push({
      field: 'prospectData.aiAnalysis.companyName',
      message: 'Company name not extracted',
      impact: 'medium',
      suggestion: 'May affect qualification accuracy'
    });
  }

  if (!aiAnalysis.industry) {
    warnings.push({
      field: 'prospectData.aiAnalysis.industry',
      message: 'Industry not identified',
      impact: 'high',
      suggestion: 'Industry matching is critical for qualification'
    });
  }

  if (!aiAnalysis.description || aiAnalysis.description.length < 20) {
    warnings.push({
      field: 'prospectData.aiAnalysis.description',
      message: 'Company description is too brief or missing',
      impact: 'medium',
      suggestion: 'Detailed description improves qualification accuracy'
    });
  }

  // Check confidence level
  if (aiAnalysis.confidence !== undefined && aiAnalysis.confidence < 70) {
    warnings.push({
      field: 'prospectData.aiAnalysis.confidence',
      message: `Low AI analysis confidence: ${aiAnalysis.confidence}%`,
      impact: 'high',
      suggestion: 'Consider manual review for this prospect'
    });
  }

  // Check fallback usage
  if (aiAnalysis.fallbackUsed) {
    warnings.push({
      field: 'prospectData.aiAnalysis',
      message: 'AI analysis used fallback logic',
      impact: 'medium',
      suggestion: 'Qualification may be less detailed than usual'
    });
  }

  // Validate array fields
  if (!aiAnalysis.keyOfferings || aiAnalysis.keyOfferings.length === 0) {
    warnings.push({
      field: 'prospectData.aiAnalysis.keyOfferings',
      message: 'No key offerings identified',
      impact: 'medium',
      suggestion: 'Key offerings help with solution fit assessment'
    });
  }
}

/**
 * Validate matched criteria structure
 */
function validateMatchedCriteria(
  matchedCriteria: MatchedCriteria[],
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[]
): void {
  if (!Array.isArray(matchedCriteria)) {
    errors.push({
      field: 'matchedCriteria',
      message: 'Matched criteria must be an array',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
    return;
  }

  matchedCriteria.forEach((criteria, index) => {
    const fieldPrefix = `matchedCriteria[${index}]`;

    if (!criteria.category) {
      errors.push({
        field: `${fieldPrefix}.category`,
        message: 'Category is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (!criteria.criteria) {
      errors.push({
        field: `${fieldPrefix}.criteria`,
        message: 'Criteria description is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (typeof criteria.match !== 'boolean') {
      errors.push({
        field: `${fieldPrefix}.match`,
        message: 'Match must be a boolean',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    }

    if (typeof criteria.confidence !== 'number' || criteria.confidence < 0 || criteria.confidence > 100) {
      errors.push({
        field: `${fieldPrefix}.confidence`,
        message: 'Confidence must be a number between 0 and 100',
        severity: 'error',
        code: 'INVALID_RANGE'
      });
    } else if (criteria.confidence < 50) {
      warnings.push({
        field: `${fieldPrefix}.confidence`,
        message: `Low confidence score: ${criteria.confidence}%`,
        impact: 'medium',
        suggestion: 'Review criteria matching logic'
      });
    }
  });
}

/**
 * Validate processing metadata
 */
function validateProcessingMetadata(
  processing: any,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[]
): void {
  if (processing.duration && typeof processing.duration !== 'number') {
    errors.push({
      field: 'processing.duration',
      message: 'Duration must be a number',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (processing.duration && processing.duration > 60000) { // 60 seconds
    warnings.push({
      field: 'processing.duration',
      message: `Long processing time: ${processing.duration}ms`,
      impact: 'low',
      suggestion: 'Consider optimizing qualification process'
    });
  }

  if (processing.retryCount && typeof processing.retryCount !== 'number') {
    errors.push({
      field: 'processing.retryCount',
      message: 'Retry count must be a number',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (processing.retryCount && processing.retryCount > 3) {
    warnings.push({
      field: 'processing.retryCount',
      message: `High retry count: ${processing.retryCount}`,
      impact: 'medium',
      suggestion: 'May indicate systemic issues with data source'
    });
  }

  if (processing.errors && Array.isArray(processing.errors) && processing.errors.length > 0) {
    warnings.push({
      field: 'processing.errors',
      message: `Processing errors occurred: ${processing.errors.join(', ')}`,
      impact: 'high',
      suggestion: 'Review error handling and data sources'
    });
  }
}

/**
 * Validate score validation metadata
 */
function validateScoreValidationMetadata(
  scoreValidation: any,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[]
): void {
  if (scoreValidation.wasClamped) {
    warnings.push({
      field: 'scoreValidation',
      message: 'Score was clamped to valid range',
      impact: 'medium',
      suggestion: 'Review score calculation logic'
    });
  }

  if (scoreValidation.fallbackUsed) {
    warnings.push({
      field: 'scoreValidation',
      message: 'Fallback scoring was used',
      impact: 'high',
      suggestion: 'AI qualification failed - may need manual review'
    });
  }

  if (scoreValidation.validationErrors && scoreValidation.validationErrors.length > 0) {
    warnings.push({
      field: 'scoreValidation',
      message: `Validation errors: ${scoreValidation.validationErrors.join(', ')}`,
      impact: 'high',
      suggestion: 'Review qualification logic and data quality'
    });
  }
}

/**
 * Calculate data quality score
 */
function calculateDataQualityScore(
  result: Partial<QualificationResult>,
  errors: ProspectValidationError[],
  warnings: ProspectValidationWarning[]
): number {
  let score = 100;

  // Deduct for errors
  errors.forEach(error => {
    if (error.severity === 'error') {
      score -= 20;
    } else {
      score -= 10;
    }
  });

  // Deduct for warnings
  warnings.forEach(warning => {
    switch (warning.impact) {
      case 'high':
        score -= 15;
        break;
      case 'medium':
        score -= 10;
        break;
      case 'low':
        score -= 5;
        break;
    }
  });

  // Bonus for complete data
  if (result.prospectData?.scrapedData && result.prospectData?.aiAnalysis) {
    const scrapedData = result.prospectData.scrapedData;
    const aiAnalysis = result.prospectData.aiAnalysis;

    if (scrapedData.mainContent && scrapedData.mainContent.length > 0) {
      score += 5;
    }
    if (aiAnalysis.industry && aiAnalysis.description) {
      score += 5;
    }
    if (aiAnalysis.keyOfferings && aiAnalysis.keyOfferings.length > 0) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Sanitize prospect result data
 */
function sanitizeProspectResult(result: Partial<QualificationResult>): Partial<QualificationResult> {
  const sanitized: any = {};

  // Sanitize string fields
  if (result.prospectDomain) {
    sanitized.prospectDomain = sanitizeString(result.prospectDomain);
  }
  if (result.prospectName) {
    sanitized.prospectName = sanitizeString(result.prospectName);
  }
  if (result.reasoning) {
    sanitized.reasoning = sanitizeString(result.reasoning);
  }
  if (result.recommendation) {
    sanitized.recommendation = sanitizeString(result.recommendation);
  }

  // Copy numeric/boolean fields
  if (result.score !== undefined) {
    sanitized.score = result.score;
  }
  if (result.fitLevel) {
    sanitized.fitLevel = result.fitLevel;
  }

  // Sanitize arrays
  if (result.gaps) {
    sanitized.gaps = result.gaps.map(gap => sanitizeString(gap));
  }

  if (result.matchedCriteria) {
    sanitized.matchedCriteria = result.matchedCriteria.map(criteria => ({
      ...criteria,
      category: sanitizeString(criteria.category),
      criteria: sanitizeString(criteria.criteria),
      evidence: criteria.evidence ? sanitizeString(criteria.evidence) : undefined
    }));
  }

  // Copy structured data (prospectData, processing, scoreValidation)
  if (result.prospectData) {
    sanitized.prospectData = result.prospectData;
  }
  if (result.processing) {
    sanitized.processing = result.processing;
  }
  if (result.scoreValidation) {
    sanitized.scoreValidation = result.scoreValidation;
  }

  return sanitized;
}

/**
 * Helper functions
 */
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

function isValidFitLevel(fitLevel: any): fitLevel is FitLevel {
  return ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'].includes(fitLevel);
}

function getExpectedFitLevel(score: number): FitLevel {
  if (score >= FIT_LEVEL_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= FIT_LEVEL_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= FIT_LEVEL_THRESHOLDS.FAIR) return 'FAIR';
  return 'POOR';
}

function getFitLevelMidpoint(fitLevel: FitLevel): number {
  switch (fitLevel) {
    case 'EXCELLENT': return 90;
    case 'GOOD': return 70;
    case 'FAIR': return 50;
    case 'POOR': return 20;
  }
}

function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}