/**
 * ICP (Ideal Customer Profile) Validator
 * Phase 3.2: Comprehensive data validation layer
 */

import { 
  ICPData, 
  BuyerPersona, 
  CompanySizeProfile, 
  ICPValidationResult, 
  ValidationError, 
  ValidationWarning,
  ICP_REQUIRED_FIELDS,
  PERSONA_REQUIRED_FIELDS,
  COMPANY_SIZE_VALIDATION,
  DEFAULT_ICP_FALLBACK
} from '../../types/icp';

export interface ICPValidationOptions {
  strictValidation?: boolean;
  allowPartialData?: boolean;
  requireAllOptionalFields?: boolean;
  sanitizeInput?: boolean;
}

export interface SanitizedICP extends ICPData {
  _sanitized: boolean;
  _warnings: string[];
}

/**
 * Comprehensive ICP validation with error reporting
 */
export function validateICP(
  icp: Partial<ICPData>, 
  options: ICPValidationOptions = {}
): ICPValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  const {
    strictValidation = false,
    allowPartialData = true,
    requireAllOptionalFields = false,
    sanitizeInput = true
  } = options;

  // Start with completeness score
  let completenessScore = 0;
  const totalRequiredFields = Object.keys(ICP_REQUIRED_FIELDS).length;
  let validatedFields = 0;

  // Validate title
  if (!icp.title) {
    if (ICP_REQUIRED_FIELDS.title.required) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
      missingFields.push('title');
    }
  } else {
    if (typeof icp.title !== 'string') {
      errors.push({
        field: 'title',
        message: 'Title must be a string',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    } else {
      const titleLength = icp.title.trim().length;
      if (titleLength < ICP_REQUIRED_FIELDS.title.minLength) {
        errors.push({
          field: 'title',
          message: `Title must be at least ${ICP_REQUIRED_FIELDS.title.minLength} characters`,
          severity: 'error',
          code: 'MIN_LENGTH_VIOLATION'
        });
      } else if (titleLength > ICP_REQUIRED_FIELDS.title.maxLength) {
        errors.push({
          field: 'title',
          message: `Title must not exceed ${ICP_REQUIRED_FIELDS.title.maxLength} characters`,
          severity: 'error',
          code: 'MAX_LENGTH_VIOLATION'
        });
      } else {
        validatedFields++;
      }
    }
  }

  // Validate description
  if (!icp.description) {
    if (ICP_REQUIRED_FIELDS.description.required) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
      missingFields.push('description');
    }
  } else {
    if (typeof icp.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    } else {
      const descLength = icp.description.trim().length;
      if (descLength < ICP_REQUIRED_FIELDS.description.minLength) {
        errors.push({
          field: 'description',
          message: `Description must be at least ${ICP_REQUIRED_FIELDS.description.minLength} characters`,
          severity: 'error',
          code: 'MIN_LENGTH_VIOLATION'
        });
      } else if (descLength > ICP_REQUIRED_FIELDS.description.maxLength) {
        errors.push({
          field: 'description',
          message: `Description must not exceed ${ICP_REQUIRED_FIELDS.description.maxLength} characters`,
          severity: 'error',
          code: 'MAX_LENGTH_VIOLATION'
        });
      } else {
        validatedFields++;
      }
    }
  }

  // Validate buyer personas
  if (!icp.buyerPersonas) {
    if (ICP_REQUIRED_FIELDS.buyerPersonas.required) {
      errors.push({
        field: 'buyerPersonas',
        message: 'Buyer personas are required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
      missingFields.push('buyerPersonas');
    }
  } else {
    if (!Array.isArray(icp.buyerPersonas)) {
      errors.push({
        field: 'buyerPersonas',
        message: 'Buyer personas must be an array',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    } else {
      const personaCount = icp.buyerPersonas.length;
      if (personaCount < ICP_REQUIRED_FIELDS.buyerPersonas.minCount) {
        errors.push({
          field: 'buyerPersonas',
          message: `At least ${ICP_REQUIRED_FIELDS.buyerPersonas.minCount} buyer persona is required`,
          severity: 'error',
          code: 'MIN_COUNT_VIOLATION'
        });
      } else if (personaCount > ICP_REQUIRED_FIELDS.buyerPersonas.maxCount) {
        warnings.push({
          field: 'buyerPersonas',
          message: `Consider reducing buyer personas to ${ICP_REQUIRED_FIELDS.buyerPersonas.maxCount} or fewer for focus`,
          suggestion: 'Focus on the most critical decision makers'
        });
      } else {
        validatedFields++;
      }

      // Validate individual personas
      icp.buyerPersonas.forEach((persona, index) => {
        const personaErrors = validateBuyerPersona(persona, `buyerPersonas[${index}]`);
        errors.push(...personaErrors);
      });
    }
  }

  // Validate company size
  if (!icp.companySize) {
    if (ICP_REQUIRED_FIELDS.companySize.required) {
      errors.push({
        field: 'companySize',
        message: 'Company size information is required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
      missingFields.push('companySize');
    }
  } else {
    const companySizeErrors = validateCompanySize(icp.companySize);
    if (companySizeErrors.length === 0) {
      validatedFields++;
    }
    errors.push(...companySizeErrors);
  }

  // Validate industries
  if (!icp.industries) {
    if (ICP_REQUIRED_FIELDS.industries.required) {
      errors.push({
        field: 'industries',
        message: 'Industries are required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
      missingFields.push('industries');
    }
  } else {
    if (!Array.isArray(icp.industries)) {
      errors.push({
        field: 'industries',
        message: 'Industries must be an array',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    } else {
      const industryCount = icp.industries.length;
      if (industryCount < ICP_REQUIRED_FIELDS.industries.minCount) {
        errors.push({
          field: 'industries',
          message: `At least ${ICP_REQUIRED_FIELDS.industries.minCount} industry is required`,
          severity: 'error',
          code: 'MIN_COUNT_VIOLATION'
        });
      } else if (industryCount > ICP_REQUIRED_FIELDS.industries.maxCount) {
        warnings.push({
          field: 'industries',
          message: `Consider focusing on ${ICP_REQUIRED_FIELDS.industries.maxCount} or fewer industries`,
          suggestion: 'Too many industries may dilute targeting effectiveness'
        });
      } else {
        validatedFields++;
      }

      // Validate individual industries
      icp.industries.forEach((industry, index) => {
        if (typeof industry !== 'string' || industry.trim().length === 0) {
          errors.push({
            field: `industries[${index}]`,
            message: 'Industry must be a non-empty string',
            severity: 'error',
            code: 'INVALID_VALUE'
          });
        }
      });
    }
  }

  // Validate key indicators
  if (!icp.keyIndicators) {
    if (ICP_REQUIRED_FIELDS.keyIndicators.required) {
      errors.push({
        field: 'keyIndicators',
        message: 'Key indicators are required',
        severity: 'error',
        code: 'REQUIRED_FIELD_MISSING'
      });
      missingFields.push('keyIndicators');
    }
  } else {
    if (!Array.isArray(icp.keyIndicators)) {
      errors.push({
        field: 'keyIndicators',
        message: 'Key indicators must be an array',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    } else {
      const indicatorCount = icp.keyIndicators.length;
      if (indicatorCount < ICP_REQUIRED_FIELDS.keyIndicators.minCount) {
        errors.push({
          field: 'keyIndicators',
          message: `At least ${ICP_REQUIRED_FIELDS.keyIndicators.minCount} key indicators are required`,
          severity: 'error',
          code: 'MIN_COUNT_VIOLATION'
        });
      } else if (indicatorCount > ICP_REQUIRED_FIELDS.keyIndicators.maxCount) {
        warnings.push({
          field: 'keyIndicators',
          message: `Consider limiting to ${ICP_REQUIRED_FIELDS.keyIndicators.maxCount} key indicators`,
          suggestion: 'Focus on the most predictive signals'
        });
      } else {
        validatedFields++;
      }
    }
  }

  // Validate optional fields if present
  validateOptionalFields(icp, errors, warnings, requireAllOptionalFields);

  // Calculate completeness score
  completenessScore = Math.round((validatedFields / totalRequiredFields) * 100);

  // Add general suggestions
  if (completenessScore < 80) {
    suggestions.push('Consider providing more detailed information to improve qualification accuracy');
  }
  if (warnings.length > 0) {
    suggestions.push('Review warnings to optimize ICP effectiveness');
  }

  const isValid = errors.filter(e => e.severity === 'error').length === 0;
  const isComplete = completenessScore >= 90 && missingFields.length === 0;

  return {
    isValid,
    isComplete,
    completenessScore,
    errors,
    warnings,
    missingFields,
    suggestions
  };
}

/**
 * Validate individual buyer persona
 */
function validateBuyerPersona(persona: any, fieldPrefix: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!persona || typeof persona !== 'object') {
    errors.push({
      field: fieldPrefix,
      message: 'Buyer persona must be an object',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
    return errors;
  }

  // Validate role
  if (!persona.role) {
    errors.push({
      field: `${fieldPrefix}.role`,
      message: 'Role is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else if (typeof persona.role !== 'string' || persona.role.trim().length < PERSONA_REQUIRED_FIELDS.role.minLength) {
    errors.push({
      field: `${fieldPrefix}.role`,
      message: `Role must be at least ${PERSONA_REQUIRED_FIELDS.role.minLength} characters`,
      severity: 'error',
      code: 'MIN_LENGTH_VIOLATION'
    });
  }

  // Validate seniority
  if (!persona.seniority) {
    errors.push({
      field: `${fieldPrefix}.seniority`,
      message: 'Seniority is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else if (typeof persona.seniority !== 'string' || persona.seniority.trim().length < PERSONA_REQUIRED_FIELDS.seniority.minLength) {
    errors.push({
      field: `${fieldPrefix}.seniority`,
      message: `Seniority must be at least ${PERSONA_REQUIRED_FIELDS.seniority.minLength} characters`,
      severity: 'error',
      code: 'MIN_LENGTH_VIOLATION'
    });
  }

  // Validate department
  if (!persona.department) {
    errors.push({
      field: `${fieldPrefix}.department`,
      message: 'Department is required',
      severity: 'error',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else if (typeof persona.department !== 'string' || persona.department.trim().length < PERSONA_REQUIRED_FIELDS.department.minLength) {
    errors.push({
      field: `${fieldPrefix}.department`,
      message: `Department must be at least ${PERSONA_REQUIRED_FIELDS.department.minLength} characters`,
      severity: 'error',
      code: 'MIN_LENGTH_VIOLATION'
    });
  }

  // Validate pain points
  if (!persona.painPoints || !Array.isArray(persona.painPoints)) {
    errors.push({
      field: `${fieldPrefix}.painPoints`,
      message: 'Pain points must be an array',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (persona.painPoints.length < PERSONA_REQUIRED_FIELDS.painPoints.minCount) {
    errors.push({
      field: `${fieldPrefix}.painPoints`,
      message: `At least ${PERSONA_REQUIRED_FIELDS.painPoints.minCount} pain point is required`,
      severity: 'error',
      code: 'MIN_COUNT_VIOLATION'
    });
  }

  // Validate goals
  if (!persona.goals || !Array.isArray(persona.goals)) {
    errors.push({
      field: `${fieldPrefix}.goals`,
      message: 'Goals must be an array',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else if (persona.goals.length < PERSONA_REQUIRED_FIELDS.goals.minCount) {
    errors.push({
      field: `${fieldPrefix}.goals`,
      message: `At least ${PERSONA_REQUIRED_FIELDS.goals.minCount} goal is required`,
      severity: 'error',
      code: 'MIN_COUNT_VIOLATION'
    });
  }

  return errors;
}

/**
 * Validate company size profile
 */
function validateCompanySize(companySize: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!companySize || typeof companySize !== 'object') {
    errors.push({
      field: 'companySize',
      message: 'Company size must be an object',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
    return errors;
  }

  // Validate employee range
  if (companySize.minEmployees !== undefined) {
    if (typeof companySize.minEmployees !== 'number' || companySize.minEmployees < COMPANY_SIZE_VALIDATION.minEmployees.min) {
      errors.push({
        field: 'companySize.minEmployees',
        message: `Minimum employees must be at least ${COMPANY_SIZE_VALIDATION.minEmployees.min}`,
        severity: 'error',
        code: 'INVALID_RANGE'
      });
    }
  }

  if (companySize.maxEmployees !== undefined) {
    if (typeof companySize.maxEmployees !== 'number' || companySize.maxEmployees > COMPANY_SIZE_VALIDATION.maxEmployees.max) {
      errors.push({
        field: 'companySize.maxEmployees',
        message: `Maximum employees cannot exceed ${COMPANY_SIZE_VALIDATION.maxEmployees.max}`,
        severity: 'error',
        code: 'INVALID_RANGE'
      });
    }
  }

  // Validate range consistency
  if (companySize.minEmployees && companySize.maxEmployees && companySize.minEmployees > companySize.maxEmployees) {
    errors.push({
      field: 'companySize',
      message: 'Minimum employees cannot be greater than maximum employees',
      severity: 'error',
      code: 'LOGICAL_ERROR'
    });
  }

  // Validate stage
  if (!companySize.stage || !Array.isArray(companySize.stage)) {
    errors.push({
      field: 'companySize.stage',
      message: 'Company stage must be an array',
      severity: 'error',
      code: 'INVALID_TYPE'
    });
  } else {
    const stageCount = companySize.stage.length;
    if (stageCount < COMPANY_SIZE_VALIDATION.stage.minCount) {
      errors.push({
        field: 'companySize.stage',
        message: `At least ${COMPANY_SIZE_VALIDATION.stage.minCount} company stage is required`,
        severity: 'error',
        code: 'MIN_COUNT_VIOLATION'
      });
    } else if (stageCount > COMPANY_SIZE_VALIDATION.stage.maxCount) {
      errors.push({
        field: 'companySize.stage',
        message: `Maximum ${COMPANY_SIZE_VALIDATION.stage.maxCount} company stages allowed`,
        severity: 'error',
        code: 'MAX_COUNT_VIOLATION'
      });
    }

    // Validate individual stages
    companySize.stage.forEach((stage: any, index: number) => {
      if (!COMPANY_SIZE_VALIDATION.stage.validValues.includes(stage)) {
        errors.push({
          field: `companySize.stage[${index}]`,
          message: `Invalid stage: ${stage}. Must be one of: ${COMPANY_SIZE_VALIDATION.stage.validValues.join(', ')}`,
          severity: 'error',
          code: 'INVALID_VALUE'
        });
      }
    });
  }

  return errors;
}

/**
 * Validate optional fields
 */
function validateOptionalFields(
  icp: Partial<ICPData>, 
  errors: ValidationError[], 
  warnings: ValidationWarning[],
  requireAll: boolean
): void {
  // Geographic regions
  if (icp.geographicRegions) {
    if (!Array.isArray(icp.geographicRegions)) {
      errors.push({
        field: 'geographicRegions',
        message: 'Geographic regions must be an array',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    }
  } else if (requireAll) {
    warnings.push({
      field: 'geographicRegions',
      message: 'Geographic regions not specified',
      suggestion: 'Consider adding target geographic regions for better targeting'
    });
  }

  // Funding stages
  if (icp.fundingStages) {
    if (!Array.isArray(icp.fundingStages)) {
      errors.push({
        field: 'fundingStages',
        message: 'Funding stages must be an array',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    }
  } else if (requireAll) {
    warnings.push({
      field: 'fundingStages',
      message: 'Funding stages not specified',
      suggestion: 'Consider adding target funding stages for more precise qualification'
    });
  }

  // Technographics
  if (icp.technographics) {
    if (!Array.isArray(icp.technographics)) {
      errors.push({
        field: 'technographics',
        message: 'Technographics must be an array',
        severity: 'error',
        code: 'INVALID_TYPE'
      });
    }
  }
}

/**
 * Sanitize ICP data to prevent XSS and injection attacks
 */
export function sanitizeICP(icp: Partial<ICPData>): SanitizedICP {
  const warnings: string[] = [];
  
  const sanitized: any = {
    _sanitized: true,
    _warnings: warnings
  };

  // Sanitize string fields
  if (icp.title) {
    sanitized.title = sanitizeString(icp.title);
    if (sanitized.title !== icp.title) {
      warnings.push('Title was sanitized for security');
    }
  }

  if (icp.description) {
    sanitized.description = sanitizeString(icp.description);
    if (sanitized.description !== icp.description) {
      warnings.push('Description was sanitized for security');
    }
  }

  // Sanitize arrays
  if (icp.industries) {
    sanitized.industries = icp.industries.map(industry => sanitizeString(industry));
  }

  if (icp.geographicRegions) {
    sanitized.geographicRegions = icp.geographicRegions.map(region => sanitizeString(region));
  }

  if (icp.fundingStages) {
    sanitized.fundingStages = icp.fundingStages.map(stage => sanitizeString(stage));
  }

  if (icp.technographics) {
    sanitized.technographics = icp.technographics.map(tech => sanitizeString(tech));
  }

  if (icp.keyIndicators) {
    sanitized.keyIndicators = icp.keyIndicators.map(indicator => sanitizeString(indicator));
  }

  // Sanitize buyer personas
  if (icp.buyerPersonas) {
    sanitized.buyerPersonas = icp.buyerPersonas.map(persona => ({
      role: sanitizeString(persona.role),
      seniority: sanitizeString(persona.seniority),
      department: sanitizeString(persona.department),
      painPoints: persona.painPoints?.map(point => sanitizeString(point)) || [],
      goals: persona.goals?.map(goal => sanitizeString(goal)) || []
    }));
  }

  // Copy company size (no sanitization needed for structured data)
  if (icp.companySize) {
    sanitized.companySize = { ...icp.companySize };
  }

  return sanitized;
}

/**
 * Basic string sanitization
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Check ICP completeness and provide suggestions for improvement
 */
export function getICPCompleteness(icp: Partial<ICPData>): {
  score: number;
  missingFields: string[];
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
} {
  const validation = validateICP(icp);
  
  const suggestions: string[] = [];
  
  if (validation.missingFields.includes('title')) {
    suggestions.push('Add a clear, descriptive title for your ICP');
  }
  
  if (validation.missingFields.includes('buyerPersonas')) {
    suggestions.push('Define key decision makers and influencers');
  }
  
  if (validation.missingFields.includes('keyIndicators')) {
    suggestions.push('Identify specific signals that indicate a good fit');
  }
  
  if (!icp.geographicRegions || icp.geographicRegions.length === 0) {
    suggestions.push('Consider adding target geographic regions');
  }
  
  if (!icp.technographics || icp.technographics.length === 0) {
    suggestions.push('Add technology preferences to improve targeting');
  }

  let priority: 'high' | 'medium' | 'low' = 'low';
  if (validation.completenessScore < 60) {
    priority = 'high';
  } else if (validation.completenessScore < 80) {
    priority = 'medium';
  }

  return {
    score: validation.completenessScore,
    missingFields: validation.missingFields,
    suggestions,
    priority
  };
}

/**
 * Generate fallback ICP when validation fails completely
 */
export function generateFallbackICP(partialICP?: Partial<ICPData>): ICPData {
  return {
    ...DEFAULT_ICP_FALLBACK,
    ...partialICP,
    // Ensure required fields have fallback values
    title: partialICP?.title || DEFAULT_ICP_FALLBACK.title!,
    description: partialICP?.description || DEFAULT_ICP_FALLBACK.description!,
    buyerPersonas: partialICP?.buyerPersonas || DEFAULT_ICP_FALLBACK.buyerPersonas!,
    companySize: partialICP?.companySize || DEFAULT_ICP_FALLBACK.companySize!,
    industries: partialICP?.industries || DEFAULT_ICP_FALLBACK.industries!,
    geographicRegions: partialICP?.geographicRegions || DEFAULT_ICP_FALLBACK.geographicRegions!,
    fundingStages: partialICP?.fundingStages || DEFAULT_ICP_FALLBACK.fundingStages!,
    keyIndicators: partialICP?.keyIndicators || DEFAULT_ICP_FALLBACK.keyIndicators!
  };
}