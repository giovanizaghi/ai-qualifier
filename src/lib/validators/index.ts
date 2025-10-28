/**
 * Validation Utilities and Error Reporting
 * Phase 3.2: Comprehensive validation system with type-safe error handling
 */

import { validateICP, ICPValidationOptions } from './icp-validator';
import { ICPValidationResult } from '../../types/icp';
import { validateProspectResult, ProspectValidationOptions, ProspectValidationResult } from './prospect-validator';
import { 
  validateCompanyData, 
  getCompanyDataHealth,
  CompanyValidationOptions, 
  CompanyValidationResult 
} from './company-validator';
import { ICPData } from '../../types/icp';
import { QualificationResult } from '../prospect-qualifier';
import { DomainAnalysisResult, CompanyAnalysis } from '../domain-analyzer';

/**
 * Centralized validation error types
 */
export interface ValidationSummary {
  isValid: boolean;
  overallScore: number; // 0-100 combined validation score
  categories: {
    icp?: ICPValidationResult;
    prospect?: ProspectValidationResult;
    company?: CompanyValidationResult;
  };
  criticalErrors: ValidationError[];
  recommendations: ValidationRecommendation[];
  summary: string;
}

export interface ValidationError {
  category: 'icp' | 'prospect' | 'company' | 'system';
  field: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
  code: string;
  suggestedFix?: string;
  timestamp: Date;
}

export interface ValidationRecommendation {
  category: 'data-quality' | 'performance' | 'accuracy' | 'completeness';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface ValidationReport {
  runId: string;
  timestamp: Date;
  validationSummary: ValidationSummary;
  metrics: ValidationMetrics;
  dataHealth: DataHealthReport;
}

export interface ValidationMetrics {
  totalValidations: number;
  passRate: number;
  errorRate: number;
  averageQualityScore: number;
  averageCompletenessScore: number;
  processingTime: number;
}

export interface DataHealthReport {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  qualityScore: number;
  completenessScore: number;
  reliabilityScore: number;
  issues: DataHealthIssue[];
  trends: DataHealthTrend[];
}

export interface DataHealthIssue {
  type: 'data-missing' | 'data-quality' | 'consistency' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedFields: string[];
  frequency: number; // How often this issue occurs (0-1)
  recommendation: string;
}

export interface DataHealthTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'declining';
  change: number; // Percentage change
  period: string;
}

/**
 * Validation options for comprehensive validation
 */
export interface ComprehensiveValidationOptions {
  icp?: ICPValidationOptions;
  prospect?: ProspectValidationOptions;
  company?: CompanyValidationOptions;
  generateReport?: boolean;
  trackMetrics?: boolean;
  includeRecommendations?: boolean;
}

/**
 * Comprehensive validation of all qualification data
 */
export function validateQualificationData(
  icp: Partial<ICPData>,
  prospectResult: Partial<QualificationResult>,
  options: ComprehensiveValidationOptions = {}
): ValidationSummary {
  const startTime = Date.now();
  const categories: ValidationSummary['categories'] = {};
  const criticalErrors: ValidationError[] = [];
  const recommendations: ValidationRecommendation[] = [];

  // Validate ICP
  if (icp) {
    const icpValidation = validateICP(icp, options.icp);
    categories.icp = icpValidation;

    // Convert ICP errors to common format
    icpValidation.errors.forEach(error => {
      if (error.severity === 'error') {
        criticalErrors.push({
          category: 'icp',
          field: error.field,
          message: error.message,
          severity: 'error',
          code: error.code,
          timestamp: new Date()
        });
      }
    });
  }

  // Validate prospect result
  if (prospectResult) {
    const prospectValidation = validateProspectResult(prospectResult, options.prospect);
    categories.prospect = prospectValidation;

    // Convert prospect errors to common format
    prospectValidation.errors.forEach(error => {
      if (error.severity === 'error') {
        criticalErrors.push({
          category: 'prospect',
          field: error.field,
          message: error.message,
          severity: 'error',
          code: error.code,
          suggestedFix: error.suggestedFix,
          timestamp: new Date()
        });
      }
    });
  }

  // Validate company data if available
  if (prospectResult?.prospectData) {
    const companyValidation = validateCompanyData(
      prospectResult.prospectData.scrapedData,
      prospectResult.prospectData.aiAnalysis,
      options.company
    );
    categories.company = companyValidation;

    // Convert company errors to common format
    companyValidation.errors.forEach(error => {
      if (error.severity === 'error') {
        criticalErrors.push({
          category: 'company',
          field: error.field,
          message: error.message,
          severity: 'error',
          code: error.code,
          suggestedFix: error.suggestedFix,
          timestamp: new Date()
        });
      }
    });
  }

  // Generate recommendations if requested
  if (options.includeRecommendations) {
    recommendations.push(...generateValidationRecommendations(categories));
  }

  // Calculate overall score
  const overallScore = calculateOverallValidationScore(categories);

  // Determine if validation passed
  const isValid = criticalErrors.length === 0 && overallScore >= 70;

  // Generate summary
  const summary = generateValidationSummary(categories, criticalErrors, overallScore);

  return {
    isValid,
    overallScore,
    categories,
    criticalErrors,
    recommendations,
    summary
  };
}

/**
 * Generate comprehensive validation report
 */
export function generateValidationReport(
  runId: string,
  validationSummary: ValidationSummary,
  processingTime: number
): ValidationReport {
  const metrics = calculateValidationMetrics(validationSummary, processingTime);
  const dataHealth = generateDataHealthReport(validationSummary);

  return {
    runId,
    timestamp: new Date(),
    validationSummary,
    metrics,
    dataHealth
  };
}

/**
 * Validate and sanitize input data
 */
export function validateAndSanitizeInput<T>(
  data: T,
  validator: (data: T) => { isValid: boolean; sanitizedData?: T; errors: any[] }
): { isValid: boolean; data: T; errors: ValidationError[] } {
  const result = validator(data);
  
  const errors: ValidationError[] = result.errors.map(error => ({
    category: 'system' as const,
    field: error.field || 'unknown',
    message: error.message || 'Validation error',
    severity: error.severity === 'error' ? 'error' as const : 'warning' as const,
    code: error.code || 'VALIDATION_ERROR',
    timestamp: new Date()
  }));

  return {
    isValid: result.isValid,
    data: result.sanitizedData || data,
    errors
  };
}

/**
 * Error aggregation and reporting
 */
export class ValidationErrorAggregator {
  private errors: ValidationError[] = [];
  private metrics: Map<string, number> = new Map();

  addError(error: ValidationError): void {
    this.errors.push(error);
    
    // Track error frequency
    const key = `${error.category}:${error.code}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  addErrors(errors: ValidationError[]): void {
    errors.forEach(error => this.addError(error));
  }

  getErrorsByCategory(category: ValidationError['category']): ValidationError[] {
    return this.errors.filter(error => error.category === category);
  }

  getErrorsBySeverity(severity: ValidationError['severity']): ValidationError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  getCriticalErrors(): ValidationError[] {
    return this.getErrorsBySeverity('critical').concat(this.getErrorsBySeverity('error'));
  }

  getErrorSummary(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    topErrors: Array<{ code: string; count: number; category: string }>;
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.errors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    const topErrors = Array.from(this.metrics.entries())
      .map(([key, count]) => {
        const [category, code] = key.split(':');
        return { code, count, category };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      topErrors
    };
  }

  clear(): void {
    this.errors = [];
    this.metrics.clear();
  }
}

/**
 * Helper functions
 */
function calculateOverallValidationScore(categories: ValidationSummary['categories']): number {
  const scores: number[] = [];
  
  if (categories.icp) {
    scores.push(categories.icp.completenessScore);
  }
  
  if (categories.prospect) {
    scores.push(categories.prospect.qualityScore);
  }
  
  if (categories.company) {
    scores.push(categories.company.qualityScore, categories.company.completenessScore);
  }

  if (scores.length === 0) return 0;
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function generateValidationRecommendations(categories: ValidationSummary['categories']): ValidationRecommendation[] {
  const recommendations: ValidationRecommendation[] = [];

  // ICP recommendations
  if (categories.icp && categories.icp.completenessScore < 80) {
    recommendations.push({
      category: 'completeness',
      priority: 'high',
      title: 'Improve ICP Completeness',
      description: 'ICP is missing key information that could improve qualification accuracy',
      action: 'Review and complete missing ICP fields, especially buyer personas and key indicators',
      estimatedImpact: 'high'
    });
  }

  // Prospect recommendations
  if (categories.prospect && categories.prospect.qualityScore < 70) {
    recommendations.push({
      category: 'data-quality',
      priority: 'high',
      title: 'Improve Prospect Data Quality',
      description: 'Prospect qualification data has quality issues that may affect accuracy',
      action: 'Review data collection and validation processes',
      estimatedImpact: 'high'
    });
  }

  // Company data recommendations
  if (categories.company && categories.company.completenessScore < 60) {
    recommendations.push({
      category: 'completeness',
      priority: 'medium',
      title: 'Enhance Company Data Collection',
      description: 'Company analysis is incomplete, limiting qualification accuracy',
      action: 'Improve website scraping and AI analysis processes',
      estimatedImpact: 'medium'
    });
  }

  // Performance recommendations
  const hasValidationErrors = Object.values(categories).some(
    category => category?.errors && category.errors.length > 0
  );
  
  if (hasValidationErrors) {
    recommendations.push({
      category: 'performance',
      priority: 'medium',
      title: 'Reduce Validation Errors',
      description: 'Multiple validation errors detected across data categories',
      action: 'Implement stricter input validation and error handling',
      estimatedImpact: 'medium'
    });
  }

  return recommendations;
}

function generateValidationSummary(
  categories: ValidationSummary['categories'],
  criticalErrors: ValidationError[],
  overallScore: number
): string {
  const parts: string[] = [];

  if (criticalErrors.length === 0) {
    parts.push(`Validation passed with score ${overallScore}/100`);
  } else {
    parts.push(`Validation failed with ${criticalErrors.length} critical errors`);
  }

  if (categories.icp) {
    parts.push(`ICP: ${categories.icp.completenessScore}% complete`);
  }

  if (categories.prospect) {
    parts.push(`Prospect: ${categories.prospect.qualityScore}% quality`);
  }

  if (categories.company) {
    parts.push(`Company: ${categories.company.qualityScore}% quality, ${categories.company.completenessScore}% complete`);
  }

  return parts.join(', ');
}

function calculateValidationMetrics(
  validationSummary: ValidationSummary,
  processingTime: number
): ValidationMetrics {
  const totalValidations = Object.keys(validationSummary.categories).length;
  const passedValidations = Object.values(validationSummary.categories).filter(
    category => category?.isValid
  ).length;
  
  const totalErrors = validationSummary.criticalErrors.length;
  const qualityScores = Object.values(validationSummary.categories)
    .map(category => category && 'qualityScore' in category ? category.qualityScore : null)
    .filter((score): score is number => score !== null);
  
  const completenessScores = Object.values(validationSummary.categories)
    .map(category => category && 'completenessScore' in category ? category.completenessScore : null)
    .filter((score): score is number => score !== null);

  return {
    totalValidations,
    passRate: totalValidations > 0 ? passedValidations / totalValidations : 0,
    errorRate: totalValidations > 0 ? totalErrors / totalValidations : 0,
    averageQualityScore: qualityScores.length > 0 ? 
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0,
    averageCompletenessScore: completenessScores.length > 0 ?
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length : 0,
    processingTime
  };
}

function generateDataHealthReport(validationSummary: ValidationSummary): DataHealthReport {
  const issues: DataHealthIssue[] = [];
  const qualityScores: number[] = [];
  const completenessScores: number[] = [];

  // Collect scores and issues
  Object.entries(validationSummary.categories).forEach(([category, validation]) => {
    if (!validation) return;

    if ('qualityScore' in validation) {
      qualityScores.push(validation.qualityScore);
    }
    if ('completenessScore' in validation) {
      completenessScores.push(validation.completenessScore);
    }

    // Convert validation errors to health issues
    validation.errors?.forEach((error: any) => {
      issues.push({
        type: 'data-quality',
        severity: error.severity === 'error' ? 'high' : 'medium',
        description: error.message,
        affectedFields: [error.field],
        frequency: 0.1, // Would be calculated from historical data
        recommendation: 'Review data validation and collection processes'
      });
    });
  });

  const avgQuality = qualityScores.length > 0 ? 
    qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
  const avgCompleteness = completenessScores.length > 0 ?
    completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length : 0;
  
  // Calculate reliability based on error frequency and severity
  const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
  const highIssues = issues.filter(issue => issue.severity === 'high').length;
  const reliabilityScore = Math.max(0, 100 - (criticalIssues * 30) - (highIssues * 15));

  // Determine overall status
  let status: DataHealthReport['status'];
  const overallScore = (avgQuality + avgCompleteness + reliabilityScore) / 3;
  
  if (overallScore >= 90) status = 'excellent';
  else if (overallScore >= 75) status = 'good';
  else if (overallScore >= 60) status = 'fair';
  else if (overallScore >= 40) status = 'poor';
  else status = 'critical';

  // Mock trends (would be calculated from historical data)
  const trends: DataHealthTrend[] = [
    {
      metric: 'Data Quality',
      direction: 'stable',
      change: 0,
      period: 'last 7 days'
    },
    {
      metric: 'Completeness',
      direction: 'stable',
      change: 0,
      period: 'last 7 days'
    }
  ];

  return {
    status,
    qualityScore: avgQuality,
    completenessScore: avgCompleteness,
    reliabilityScore,
    issues,
    trends
  };
}

/**
 * Type-safe validation decorators for common patterns
 */
export function createValidator<T>(
  validationFn: (data: T) => boolean,
  errorMessage: string,
  errorCode: string
) {
  return (data: T): ValidationError | null => {
    if (!validationFn(data)) {
      return {
        category: 'system',
        field: 'data',
        message: errorMessage,
        severity: 'error',
        code: errorCode,
        timestamp: new Date()
      };
    }
    return null;
  };
}

/**
 * Common validators
 */
export const validators = {
  required: createValidator(
    (value: any) => value !== null && value !== undefined && value !== '',
    'Field is required',
    'REQUIRED_FIELD'
  ),
  
  string: createValidator(
    (value: any) => typeof value === 'string',
    'Field must be a string',
    'INVALID_TYPE_STRING'
  ),
  
  number: createValidator(
    (value: any) => typeof value === 'number' && !isNaN(value),
    'Field must be a valid number',
    'INVALID_TYPE_NUMBER'
  ),
  
  email: createValidator(
    (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Field must be a valid email address',
    'INVALID_EMAIL_FORMAT'
  ),
  
  domain: createValidator(
    (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(value),
    'Field must be a valid domain',
    'INVALID_DOMAIN_FORMAT'
  ),
  
  range: (min: number, max: number) => createValidator(
    (value: number) => value >= min && value <= max,
    `Field must be between ${min} and ${max}`,
    'VALUE_OUT_OF_RANGE'
  ),
  
  minLength: (length: number) => createValidator(
    (value: string) => value.length >= length,
    `Field must be at least ${length} characters`,
    'MIN_LENGTH_VIOLATION'
  ),
  
  maxLength: (length: number) => createValidator(
    (value: string) => value.length <= length,
    `Field must not exceed ${length} characters`,
    'MAX_LENGTH_VIOLATION'
  ),
  
  array: createValidator(
    (value: any) => Array.isArray(value),
    'Field must be an array',
    'INVALID_TYPE_ARRAY'
  ),
  
  minCount: (count: number) => createValidator(
    (value: any[]) => Array.isArray(value) && value.length >= count,
    `Array must have at least ${count} items`,
    'MIN_COUNT_VIOLATION'
  ),
  
  maxCount: (count: number) => createValidator(
    (value: any[]) => Array.isArray(value) && value.length <= count,
    `Array must have at most ${count} items`,
    'MAX_COUNT_VIOLATION'
  )
};

/**
 * Export aggregator instance for global error tracking
 */
export const globalValidationErrors = new ValidationErrorAggregator();