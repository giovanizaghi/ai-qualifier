/**
 * ICP (Ideal Customer Profile) Types and Validation
 * Enhanced with validation, completeness scoring, and error handling
 */

export interface BuyerPersona {
  role: string;
  seniority: string;
  department: string;
  painPoints: string[];
  goals: string[];
}

export interface CompanySizeProfile {
  minEmployees?: number;
  maxEmployees?: number;
  minRevenue?: string;
  maxRevenue?: string;
  stage: string[]; // e.g., ["Startup", "Growth", "Enterprise"]
}

export interface ICPData {
  title: string;
  description: string;
  buyerPersonas: BuyerPersona[];
  companySize: CompanySizeProfile;
  industries: string[];
  geographicRegions: string[];
  fundingStages: string[];
  technographics?: string[]; // Technologies they might use
  keyIndicators: string[]; // Signs they're a good fit
}

/**
 * Enhanced ICP with validation metadata
 */
export interface ValidatedICP extends ICPData {
  isComplete: boolean;
  completenessScore: number; // 0-100
  missingFields: string[];
  warnings: string[];
  generatedAt: Date;
  validationVersion: string;
}

/**
 * ICP Validation Result
 */
export interface ICPValidationResult {
  isValid: boolean;
  isComplete: boolean;
  completenessScore: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingFields: string[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * ICP Generation Options
 */
export interface ICPGenerationOptions {
  includeOptionalFields: boolean;
  strictValidation: boolean;
  fallbackOnError: boolean;
  maxRetries: number;
  requireMinimumPersonas: number;
  requireMinimumIndustries: number;
}

/**
 * ICP Generation Error with context
 */
export class ICPGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ICPGenerationError';
  }
}

/**
 * Required field definitions for ICP validation
 */
export const ICP_REQUIRED_FIELDS = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    description: 'Brief descriptive title for the ICP'
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
    description: 'Overview description of the ideal customer'
  },
  buyerPersonas: {
    required: true,
    minCount: 1,
    maxCount: 5,
    description: 'Key decision makers and influencers'
  },
  companySize: {
    required: true,
    description: 'Target company size parameters'
  },
  industries: {
    required: true,
    minCount: 1,
    maxCount: 10,
    description: 'Target industry verticals'
  },
  geographicRegions: {
    required: false,
    minCount: 0,
    maxCount: 10,
    description: 'Target geographic markets'
  },
  fundingStages: {
    required: false,
    minCount: 0,
    maxCount: 8,
    description: 'Preferred funding/growth stages'
  },
  keyIndicators: {
    required: true,
    minCount: 2,
    maxCount: 10,
    description: 'Signals that indicate a good fit'
  }
} as const;

/**
 * Buyer persona validation requirements
 */
export const PERSONA_REQUIRED_FIELDS = {
  role: {
    required: true,
    minLength: 2,
    maxLength: 50,
    description: 'Job title or role'
  },
  seniority: {
    required: true,
    minLength: 2,
    maxLength: 30,
    description: 'Seniority level'
  },
  department: {
    required: true,
    minLength: 2,
    maxLength: 30,
    description: 'Department or function'
  },
  painPoints: {
    required: true,
    minCount: 1,
    maxCount: 8,
    description: 'Key challenges or pain points'
  },
  goals: {
    required: true,
    minCount: 1,
    maxCount: 8,
    description: 'Primary goals and objectives'
  }
} as const;

/**
 * Company size validation requirements
 */
export const COMPANY_SIZE_VALIDATION = {
  minEmployees: {
    required: false,
    min: 1,
    max: 1000000,
    description: 'Minimum employee count'
  },
  maxEmployees: {
    required: false,
    min: 1,
    max: 1000000,
    description: 'Maximum employee count'
  },
  stage: {
    required: true,
    minCount: 1,
    maxCount: 5,
    validValues: [
      'Startup',
      'Early Stage',
      'Growth',
      'Scale-up',
      'Mature',
      'Enterprise',
      'Fortune 500',
      'Fortune 1000'
    ],
    description: 'Company growth stage'
  }
} as const;

/**
 * Default ICP fallback data for when AI generation fails
 */
export const DEFAULT_ICP_FALLBACK: Partial<ICPData> = {
  title: 'General Business Customer',
  description: 'Companies that could benefit from business solutions and services.',
  buyerPersonas: [
    {
      role: 'Business Decision Maker',
      seniority: 'Manager or above',
      department: 'Business Operations',
      painPoints: ['Operational inefficiencies', 'Cost optimization needs'],
      goals: ['Improve business processes', 'Increase efficiency']
    }
  ],
  companySize: {
    stage: ['Growth', 'Mature']
  },
  industries: ['Technology', 'Professional Services'],
  geographicRegions: ['North America'],
  fundingStages: ['Self-funded', 'Profitable'],
  keyIndicators: [
    'Actively seeking business improvements',
    'Has budget for solutions',
    'Open to new technologies'
  ]
};