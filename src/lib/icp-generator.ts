import { generateStructuredResponse } from './openai-client';
import type { CompanyAnalysis } from './domain-analyzer';
import {
  ICPData,
  ValidatedICP,
  ICPGenerationOptions,
  ICPGenerationError,
  BuyerPersona,
  CompanySizeProfile
} from '../types/icp';
import {
  validateICP,
  calculateCompletenessScore,
  createValidatedICP,
  applyICPFallback,
  sanitizeICPData
} from './icp-validator';

// Re-export types for backward compatibility
export type { BuyerPersona, CompanySizeProfile, ICPData };

/**
 * Generate an ICP based on company analysis with enhanced validation and fallback
 */
export async function generateICP(
  companyAnalysis: CompanyAnalysis,
  companyDomain: string,
  options: Partial<ICPGenerationOptions> = {}
): Promise<ValidatedICP> {
  const defaultOptions: ICPGenerationOptions = {
    includeOptionalFields: true,
    strictValidation: false,
    fallbackOnError: true,
    maxRetries: 2,
    requireMinimumPersonas: 1,
    requireMinimumIndustries: 1,
    ...options
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= defaultOptions.maxRetries; attempt++) {
    try {
      const systemPrompt = `You are an expert sales strategist specializing in Ideal Customer Profile (ICP) development.
Based on the company's business, generate a comprehensive ICP that describes their ideal customers.

CRITICAL REQUIREMENTS:
- All fields marked as required MUST be included
- Buyer personas must include specific, actionable details
- Key indicators should be observable and measurable
- Industries should be specific and relevant
- Company size parameters should be realistic

Return a JSON object with this exact structure:
{
  "title": "Brief ICP title (e.g., 'Enterprise SaaS Companies')",
  "description": "2-3 sentence overview of the ideal customer",
  "buyerPersonas": [
    {
      "role": "Specific job title",
      "seniority": "Level (e.g., 'Director', 'VP', 'C-Suite')",
      "department": "Department name",
      "painPoints": ["specific pain point 1", "specific pain point 2"],
      "goals": ["specific goal 1", "specific goal 2"]
    }
  ],
  "companySize": {
    "minEmployees": 50,
    "maxEmployees": 5000,
    "minRevenue": "$5M",
    "maxRevenue": "$100M",
    "stage": ["Growth", "Scale-up", "Enterprise"]
  },
  "industries": ["Specific Industry 1", "Specific Industry 2"],
  "geographicRegions": ["North America", "Europe"],
  "fundingStages": ["Series A", "Series B"],
  "technographics": ["Technology 1", "Technology 2"],
  "keyIndicators": ["measurable indicator 1", "observable indicator 2", "specific indicator 3"]
}

Key indicators should be specific signs that a company is a good fit (e.g., "Has a dedicated DevOps team", "Recently raised funding", "Rapid hiring in engineering").`;

      const userPrompt = `Generate an ICP for this company:

Company: ${companyAnalysis.companyName}
Domain: ${companyDomain}
Industry: ${companyAnalysis.industry}
Description: ${companyAnalysis.description}
Target Market: ${companyAnalysis.targetMarket}
Key Offerings: ${companyAnalysis.keyOfferings.join(', ')}

Requirements:
- Include at least ${defaultOptions.requireMinimumPersonas} buyer persona(s)
- Include at least ${defaultOptions.requireMinimumIndustries} target industry(ies)
- Provide at least 3 specific key indicators
- Be specific and actionable

Who would be their ideal customer? Consider:
1. What types of companies would benefit most from their offerings?
2. What challenges do those companies face that this company solves?
3. What characteristics indicate a company is ready to buy?
4. What size companies are most likely to have budget and authority?

Be specific and actionable.`;

      const rawICP = await generateStructuredResponse<ICPData>(
        systemPrompt,
        userPrompt,
        {},
        'gpt-4o-mini',
        0.4 // Slightly creative but still consistent
      );

      // Sanitize the raw data
      const sanitizedICP = sanitizeICPData(rawICP) as ICPData;

      // Validate the generated ICP
      const validation = validateICP(sanitizedICP);

      if (!validation.isValid && defaultOptions.strictValidation) {
        throw new ICPGenerationError(
          `Generated ICP failed validation: ${validation.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_FAILED',
          undefined,
          { validation, attempt: attempt + 1 }
        );
      }

      // If validation failed but we're not in strict mode, apply fallback
      let finalICP: ICPData;
      if (!validation.isValid && defaultOptions.fallbackOnError) {
        finalICP = applyICPFallback(sanitizedICP);
        console.warn(`ICP validation failed on attempt ${attempt + 1}, applying fallback data`, validation.errors);
      } else {
        finalICP = sanitizedICP;
      }

      // Create validated ICP with metadata
      const validatedICP = createValidatedICP(finalICP);

      // Log success
      console.log(`Successfully generated ICP on attempt ${attempt + 1}:`, {
        completenessScore: validatedICP.completenessScore,
        isComplete: validatedICP.isComplete,
        warningCount: validatedICP.warnings.length
      });

      return validatedICP;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`ICP generation failed on attempt ${attempt + 1}:`, lastError);

      // If this is the last attempt and fallback is enabled, return fallback
      if (attempt === defaultOptions.maxRetries && defaultOptions.fallbackOnError) {
        console.warn('All attempts failed, returning fallback ICP');
        const fallbackICP = applyICPFallback({
          title: `${companyAnalysis.companyName} Customer Profile`,
          description: `Companies that would benefit from ${companyAnalysis.companyName}'s ${companyAnalysis.industry} solutions.`,
          industries: [companyAnalysis.industry]
        });
        return createValidatedICP(fallbackICP);
      }

      // If not the last attempt, wait a bit before retrying
      if (attempt < defaultOptions.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // If we get here, all attempts failed
  throw new ICPGenerationError(
    `Failed to generate ICP after ${defaultOptions.maxRetries + 1} attempts`,
    'MAX_RETRIES_EXCEEDED',
    lastError || undefined,
    { companyAnalysis, companyDomain, options: defaultOptions }
  );
}

/**
 * Regenerate or refine an existing ICP with additional context
 */
export async function refineICP(
  existingICP: ICPData,
  feedback: string,
  options: Partial<ICPGenerationOptions> = {}
): Promise<ValidatedICP> {
  const defaultOptions: ICPGenerationOptions = {
    includeOptionalFields: true,
    strictValidation: false,
    fallbackOnError: true,
    maxRetries: 2,
    requireMinimumPersonas: 1,
    requireMinimumIndustries: 1,
    ...options
  };

  try {
    const systemPrompt = `You are an expert sales strategist. Refine the existing ICP based on user feedback.
    
CRITICAL REQUIREMENTS:
- Maintain the same JSON structure
- Improve based on the feedback provided
- Ensure all required fields are present and valid
- Be specific and actionable in your improvements

Maintain this exact JSON structure:`;

    const userPrompt = `Existing ICP:
${JSON.stringify(existingICP, null, 2)}

User Feedback: ${feedback}

Please refine the ICP accordingly while maintaining all required fields and improving based on the feedback.`;

    const refinedICP = await generateStructuredResponse<ICPData>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.4
    );

    // Sanitize and validate the refined ICP
    const sanitizedICP = sanitizeICPData(refinedICP) as ICPData;
    const validation = validateICP(sanitizedICP);

    if (!validation.isValid && defaultOptions.fallbackOnError) {
      // Merge with original ICP as fallback
      const fallbackICP: ICPData = {
        title: sanitizedICP.title || existingICP.title,
        description: sanitizedICP.description || existingICP.description,
        buyerPersonas: sanitizedICP.buyerPersonas && sanitizedICP.buyerPersonas.length > 0 
          ? sanitizedICP.buyerPersonas 
          : existingICP.buyerPersonas,
        companySize: sanitizedICP.companySize || existingICP.companySize,
        industries: sanitizedICP.industries && sanitizedICP.industries.length > 0 
          ? sanitizedICP.industries 
          : existingICP.industries,
        geographicRegions: sanitizedICP.geographicRegions || existingICP.geographicRegions,
        fundingStages: sanitizedICP.fundingStages || existingICP.fundingStages,
        technographics: sanitizedICP.technographics || existingICP.technographics,
        keyIndicators: sanitizedICP.keyIndicators && sanitizedICP.keyIndicators.length > 0 
          ? sanitizedICP.keyIndicators 
          : existingICP.keyIndicators
      };
      return createValidatedICP(fallbackICP);
    }

    return createValidatedICP(sanitizedICP);
  } catch (error) {
    console.error('Error refining ICP:', error);
    
    if (defaultOptions.fallbackOnError) {
      // Return the original ICP as fallback
      console.warn('ICP refinement failed, returning original ICP');
      return createValidatedICP(existingICP);
    }
    
    throw new ICPGenerationError(
      `Failed to refine ICP: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'REFINEMENT_FAILED',
      error instanceof Error ? error : undefined,
      { existingICP, feedback }
    );
  }
}

/**
 * Generate ICP summary for display
 */
export function generateICPSummary(icp: ICPData | ValidatedICP): string {
  const personas = icp.buyerPersonas?.map((p) => p.role).join(', ') || 'Various roles';
  const industries = icp.industries?.slice(0, 3).join(', ') || 'Multiple industries';
  
  const employeeRange = icp.companySize?.minEmployees && icp.companySize?.maxEmployees
    ? `${icp.companySize.minEmployees}-${icp.companySize.maxEmployees}`
    : 'Various sizes';
  
  const stages = icp.companySize?.stage?.join('/') || 'All stages';
  
  return `${icp.title}: Companies in ${industries} with ${personas} as key decision makers. ${stages} stage companies with ${employeeRange} employees.`;
}

/**
 * Validate and enhance an existing ICP with current validation rules
 */
export function enhanceExistingICP(icp: ICPData): ValidatedICP {
  // Sanitize the input first
  const sanitizedICP = sanitizeICPData(icp) as ICPData;
  
  // Apply fallback for any missing required fields
  const enhancedICP = applyICPFallback(sanitizedICP);
  
  // Create validated ICP
  return createValidatedICP(enhancedICP);
}

/**
 * Quick validation check for ICP completeness
 */
export function isICPComplete(icp: Partial<ICPData>): boolean {
  const validation = validateICP(icp);
  return validation.isComplete;
}

/**
 * Get ICP quality score (0-100)
 */
export function getICPQualityScore(icp: Partial<ICPData>): number {
  return calculateCompletenessScore(icp);
}
