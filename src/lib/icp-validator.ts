/**
 * ICP Validation Utilities
 * Comprehensive validation, completeness scoring, and error handling for ICP data
 */

import {
  ICPData,
  ValidatedICP,
  ICPValidationResult,
  ValidationError,
  ValidationWarning,
  BuyerPersona,
  CompanySizeProfile,
  ICP_REQUIRED_FIELDS,
  PERSONA_REQUIRED_FIELDS,
  COMPANY_SIZE_VALIDATION,
  DEFAULT_ICP_FALLBACK,
  ICPGenerationError
} from '../types/icp';

/**
 * Validates an ICP object and returns detailed validation results
 */
export function validateICP(icp: Partial<ICPData>): ICPValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  const suggestions: string[] = [];

  // Validate title
  if (!icp.title) {
    errors.push({
      field: 'title',
      message: 'Title is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    missingFields.push('title');
  } else if (icp.title.length < ICP_REQUIRED_FIELDS.title.minLength) {
    errors.push({
      field: 'title',
      message: `Title must be at least ${ICP_REQUIRED_FIELDS.title.minLength} characters`,
      severity: 'error',
      code: 'INVALID_LENGTH'
    });
  } else if (icp.title.length > ICP_REQUIRED_FIELDS.title.maxLength) {
    warnings.push({
      field: 'title',
      message: `Title is quite long (${icp.title.length} chars). Consider shortening for clarity.`,
      suggestion: 'Keep titles concise and descriptive'
    });
  }

  // Validate description
  if (!icp.description) {
    errors.push({
      field: 'description',
      message: 'Description is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    missingFields.push('description');
  } else if (icp.description.length < ICP_REQUIRED_FIELDS.description.minLength) {
    errors.push({
      field: 'description',
      message: `Description must be at least ${ICP_REQUIRED_FIELDS.description.minLength} characters`,
      severity: 'error',
      code: 'INVALID_LENGTH'
    });
  }

  // Validate buyer personas
  if (!icp.buyerPersonas || !Array.isArray(icp.buyerPersonas)) {
    errors.push({
      field: 'buyerPersonas',
      message: 'Buyer personas are required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    missingFields.push('buyerPersonas');
  } else {
    if (icp.buyerPersonas.length < ICP_REQUIRED_FIELDS.buyerPersonas.minCount) {
      errors.push({
        field: 'buyerPersonas',
        message: `At least ${ICP_REQUIRED_FIELDS.buyerPersonas.minCount} buyer persona is required`,
        severity: 'error',
        code: 'INSUFFICIENT_COUNT'
      });
    }
    
    if (icp.buyerPersonas.length > ICP_REQUIRED_FIELDS.buyerPersonas.maxCount) {
      warnings.push({
        field: 'buyerPersonas',
        message: `Too many buyer personas (${icp.buyerPersonas.length}). Consider consolidating.`,
        suggestion: `Limit to ${ICP_REQUIRED_FIELDS.buyerPersonas.maxCount} most important personas`
      });
    }

    // Validate each persona
    icp.buyerPersonas.forEach((persona, index) => {
      const personaErrors = validatePersona(persona, index);
      errors.push(...personaErrors);
    });
  }

  // Validate company size
  if (!icp.companySize) {
    errors.push({
      field: 'companySize',
      message: 'Company size profile is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    missingFields.push('companySize');
  } else {
    const companySizeErrors = validateCompanySize(icp.companySize);
    errors.push(...companySizeErrors);
  }

  // Validate industries
  if (!icp.industries || !Array.isArray(icp.industries) || icp.industries.length === 0) {
    errors.push({
      field: 'industries',
      message: 'At least one industry is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    missingFields.push('industries');
  } else if (icp.industries.length > ICP_REQUIRED_FIELDS.industries.maxCount) {
    warnings.push({
      field: 'industries',
      message: `Too many industries (${icp.industries.length}). Consider focusing on primary markets.`,
      suggestion: `Limit to ${ICP_REQUIRED_FIELDS.industries.maxCount} most relevant industries`
    });
  }

  // Validate key indicators
  if (!icp.keyIndicators || !Array.isArray(icp.keyIndicators) || icp.keyIndicators.length === 0) {
    errors.push({
      field: 'keyIndicators',
      message: 'Key indicators are required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
    missingFields.push('keyIndicators');
  } else if (icp.keyIndicators.length < ICP_REQUIRED_FIELDS.keyIndicators.minCount) {
    warnings.push({
      field: 'keyIndicators',
      message: `Consider adding more key indicators (currently ${icp.keyIndicators.length})`,
      suggestion: `Aim for ${ICP_REQUIRED_FIELDS.keyIndicators.minCount}-${ICP_REQUIRED_FIELDS.keyIndicators.maxCount} specific indicators`
    });
  }

  // Optional field warnings
  if (!icp.geographicRegions || icp.geographicRegions.length === 0) {
    warnings.push({
      field: 'geographicRegions',
      message: 'No geographic regions specified',
      suggestion: 'Consider specifying target markets for better qualification'
    });
  }

  if (!icp.fundingStages || icp.fundingStages.length === 0) {
    warnings.push({
      field: 'fundingStages',
      message: 'No funding stages specified',
      suggestion: 'Consider specifying preferred company funding stages'
    });
  }

  // Calculate completeness score
  const completenessScore = calculateCompletenessScore(icp);
  const isValid = errors.length === 0;
  const isComplete = completenessScore >= 80 && isValid;

  // Generate suggestions
  if (completenessScore < 80) {
    suggestions.push('Complete missing optional fields to improve ICP quality');
  }
  if (warnings.length > 0) {
    suggestions.push('Address warnings to optimize ICP effectiveness');
  }

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
 * Validates a buyer persona
 */
function validatePersona(persona: Partial<BuyerPersona>, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `buyerPersonas[${index}]`;

  if (!persona.role) {
    errors.push({
      field: `${prefix}.role`,
      message: 'Persona role is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
  }

  if (!persona.seniority) {
    errors.push({
      field: `${prefix}.seniority`,
      message: 'Persona seniority is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
  }

  if (!persona.department) {
    errors.push({
      field: `${prefix}.department`,
      message: 'Persona department is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
  }

  if (!persona.painPoints || !Array.isArray(persona.painPoints) || persona.painPoints.length === 0) {
    errors.push({
      field: `${prefix}.painPoints`,
      message: 'At least one pain point is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
  }

  if (!persona.goals || !Array.isArray(persona.goals) || persona.goals.length === 0) {
    errors.push({
      field: `${prefix}.goals`,
      message: 'At least one goal is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
  }

  return errors;
}

/**
 * Validates company size profile
 */
function validateCompanySize(companySize: Partial<CompanySizeProfile>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!companySize.stage || !Array.isArray(companySize.stage) || companySize.stage.length === 0) {
    errors.push({
      field: 'companySize.stage',
      message: 'At least one company stage is required',
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD'
    });
  } else {
    // Validate stage values
    const validStages = COMPANY_SIZE_VALIDATION.stage.validValues;
    const invalidStages = companySize.stage.filter(stage => !(validStages as readonly string[]).includes(stage));
    if (invalidStages.length > 0) {
      errors.push({
        field: 'companySize.stage',
        message: `Invalid company stages: ${invalidStages.join(', ')}`,
        severity: 'error',
        code: 'INVALID_VALUE'
      });
    }
  }

  // Validate employee count ranges
  if (companySize.minEmployees !== undefined && companySize.maxEmployees !== undefined) {
    if (companySize.minEmployees > companySize.maxEmployees) {
      errors.push({
        field: 'companySize.employees',
        message: 'Minimum employees cannot be greater than maximum employees',
        severity: 'error',
        code: 'INVALID_RANGE'
      });
    }
  }

  return errors;
}

/**
 * Calculates completeness score (0-100) for an ICP
 */
export function calculateCompletenessScore(icp: Partial<ICPData>): number {
  let score = 0;
  let maxScore = 0;

  // Required fields (60% of total score)
  const requiredFieldsWeight = 60;
  const requiredFields = ['title', 'description', 'buyerPersonas', 'companySize', 'industries', 'keyIndicators'];
  
  requiredFields.forEach(field => {
    maxScore += 10;
    if (icp[field as keyof ICPData]) {
      if (field === 'buyerPersonas' && Array.isArray(icp.buyerPersonas)) {
        // Score based on persona completeness
        const personaScore = icp.buyerPersonas.reduce((acc, persona) => {
          const personaValidation = validatePersona(persona, 0);
          return acc + (personaValidation.length === 0 ? 1 : 0.5);
        }, 0) / icp.buyerPersonas.length;
        score += 10 * personaScore;
      } else if (Array.isArray(icp[field as keyof ICPData])) {
        const array = icp[field as keyof ICPData] as unknown[];
        score += array.length > 0 ? 10 : 0;
      } else {
        score += 10;
      }
    }
  });

  // Optional fields (40% of total score)
  const optionalFields = ['geographicRegions', 'fundingStages', 'technographics'];
  optionalFields.forEach(field => {
    maxScore += 10;
    const value = icp[field as keyof ICPData];
    if (value && Array.isArray(value) && value.length > 0) {
      score += 10;
    }
  });

  // Bonus points for quality
  maxScore += 20;
  
  // Quality bonus: detailed personas
  if (icp.buyerPersonas && icp.buyerPersonas.length > 0) {
    const avgPainPoints = icp.buyerPersonas.reduce((acc, p) => acc + (p.painPoints?.length || 0), 0) / icp.buyerPersonas.length;
    const avgGoals = icp.buyerPersonas.reduce((acc, p) => acc + (p.goals?.length || 0), 0) / icp.buyerPersonas.length;
    
    if (avgPainPoints >= 2 && avgGoals >= 2) score += 10;
  }

  // Quality bonus: specific key indicators
  if (icp.keyIndicators && icp.keyIndicators.length >= 3) {
    score += 10;
  }

  return Math.min(100, Math.round((score / maxScore) * 100));
}

/**
 * Creates a validated ICP with metadata
 */
export function createValidatedICP(icp: ICPData): ValidatedICP {
  const validation = validateICP(icp);
  
  return {
    ...icp,
    isComplete: validation.isComplete,
    completenessScore: validation.completenessScore,
    missingFields: validation.missingFields,
    warnings: validation.warnings.map(w => w.message),
    generatedAt: new Date(),
    validationVersion: '1.0.0'
  };
}

/**
 * Applies fallback data to incomplete ICP
 */
export function applyICPFallback(partialICP: Partial<ICPData>): ICPData {
  const fallback = { ...DEFAULT_ICP_FALLBACK };
  
  // Merge with provided data, preferring user data
  const merged: ICPData = {
    title: partialICP.title || fallback.title!,
    description: partialICP.description || fallback.description!,
    buyerPersonas: partialICP.buyerPersonas && partialICP.buyerPersonas.length > 0 
      ? partialICP.buyerPersonas 
      : fallback.buyerPersonas!,
    companySize: partialICP.companySize || fallback.companySize!,
    industries: partialICP.industries && partialICP.industries.length > 0 
      ? partialICP.industries 
      : fallback.industries!,
    geographicRegions: partialICP.geographicRegions || fallback.geographicRegions!,
    fundingStages: partialICP.fundingStages || fallback.fundingStages!,
    technographics: partialICP.technographics || [],
    keyIndicators: partialICP.keyIndicators && partialICP.keyIndicators.length > 0 
      ? partialICP.keyIndicators 
      : fallback.keyIndicators!
  };

  return merged;
}

/**
 * Sanitizes and normalizes ICP data
 */
export function sanitizeICPData(icp: Partial<ICPData>): Partial<ICPData> {
  const sanitized: Partial<ICPData> = {};

  // Sanitize strings
  if (icp.title) {
    sanitized.title = icp.title.trim().substring(0, ICP_REQUIRED_FIELDS.title.maxLength);
  }
  
  if (icp.description) {
    sanitized.description = icp.description.trim().substring(0, ICP_REQUIRED_FIELDS.description.maxLength);
  }

  // Sanitize arrays
  if (icp.industries) {
    sanitized.industries = icp.industries
      .filter(industry => typeof industry === 'string' && industry.trim().length > 0)
      .map(industry => industry.trim())
      .slice(0, ICP_REQUIRED_FIELDS.industries.maxCount);
  }

  if (icp.geographicRegions) {
    sanitized.geographicRegions = icp.geographicRegions
      .filter(region => typeof region === 'string' && region.trim().length > 0)
      .map(region => region.trim())
      .slice(0, ICP_REQUIRED_FIELDS.geographicRegions.maxCount);
  }

  if (icp.fundingStages) {
    sanitized.fundingStages = icp.fundingStages
      .filter(stage => typeof stage === 'string' && stage.trim().length > 0)
      .map(stage => stage.trim());
  }

  if (icp.keyIndicators) {
    sanitized.keyIndicators = icp.keyIndicators
      .filter(indicator => typeof indicator === 'string' && indicator.trim().length > 0)
      .map(indicator => indicator.trim())
      .slice(0, ICP_REQUIRED_FIELDS.keyIndicators.maxCount);
  }

  if (icp.technographics) {
    sanitized.technographics = icp.technographics
      .filter(tech => typeof tech === 'string' && tech.trim().length > 0)
      .map(tech => tech.trim());
  }

  // Sanitize buyer personas
  if (icp.buyerPersonas) {
    sanitized.buyerPersonas = icp.buyerPersonas
      .slice(0, ICP_REQUIRED_FIELDS.buyerPersonas.maxCount)
      .map(persona => ({
        role: persona.role?.trim().substring(0, PERSONA_REQUIRED_FIELDS.role.maxLength) || '',
        seniority: persona.seniority?.trim().substring(0, PERSONA_REQUIRED_FIELDS.seniority.maxLength) || '',
        department: persona.department?.trim().substring(0, PERSONA_REQUIRED_FIELDS.department.maxLength) || '',
        painPoints: (persona.painPoints || [])
          .filter(point => typeof point === 'string' && point.trim().length > 0)
          .map(point => point.trim())
          .slice(0, PERSONA_REQUIRED_FIELDS.painPoints.maxCount),
        goals: (persona.goals || [])
          .filter(goal => typeof goal === 'string' && goal.trim().length > 0)
          .map(goal => goal.trim())
          .slice(0, PERSONA_REQUIRED_FIELDS.goals.maxCount)
      }));
  }

  // Sanitize company size
  if (icp.companySize) {
    sanitized.companySize = {
      ...icp.companySize,
      stage: (icp.companySize.stage || [])
        .filter(stage => (COMPANY_SIZE_VALIDATION.stage.validValues as readonly string[]).includes(stage))
        .slice(0, COMPANY_SIZE_VALIDATION.stage.maxCount)
    };
  }

  return sanitized;
}