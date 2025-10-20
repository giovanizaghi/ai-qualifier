import { generateStructuredResponse } from './openai-client';
import type { CompanyAnalysis } from './domain-analyzer';

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
 * Generate an ICP based on company analysis
 */
export async function generateICP(
  companyAnalysis: CompanyAnalysis,
  companyDomain: string
): Promise<ICPData> {
  const systemPrompt = `You are an expert sales strategist specializing in Ideal Customer Profile (ICP) development.
Based on the company's business, generate a comprehensive ICP that describes their ideal customers.

Return a JSON object with this exact structure:
{
  "title": "Brief ICP title (e.g., 'Enterprise SaaS Companies')",
  "description": "2-3 sentence overview of the ideal customer",
  "buyerPersonas": [
    {
      "role": "Job title",
      "seniority": "Level (e.g., 'Director', 'VP', 'C-Suite')",
      "department": "Department name",
      "painPoints": ["pain point 1", "pain point 2"],
      "goals": ["goal 1", "goal 2"]
    }
  ],
  "companySize": {
    "minEmployees": 50,
    "maxEmployees": 5000,
    "minRevenue": "$5M",
    "maxRevenue": "$100M",
    "stage": ["Growth", "Scale-up", "Enterprise"]
  },
  "industries": ["Industry 1", "Industry 2", "Industry 3"],
  "geographicRegions": ["North America", "Europe", "etc."],
  "fundingStages": ["Series A", "Series B", "etc."],
  "technographics": ["Technology 1", "Technology 2"],
  "keyIndicators": ["indicator 1", "indicator 2", "indicator 3"]
}

Key indicators should be specific signs that a company is a good fit (e.g., "Has a dedicated DevOps team", "Recently raised funding", "Rapid hiring in engineering").`;

  const userPrompt = `Generate an ICP for this company:

Company: ${companyAnalysis.companyName}
Domain: ${companyDomain}
Industry: ${companyAnalysis.industry}
Description: ${companyAnalysis.description}
Target Market: ${companyAnalysis.targetMarket}
Key Offerings: ${companyAnalysis.keyOfferings.join(', ')}

Who would be their ideal customer? Consider:
1. What types of companies would benefit most from their offerings?
2. What challenges do those companies face that this company solves?
3. What characteristics indicate a company is ready to buy?

Be specific and actionable.`;

  try {
    const icp = await generateStructuredResponse<ICPData>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.4 // Slightly creative but still consistent
    );

    // Validate required fields
    if (!icp.title || !icp.description || !icp.buyerPersonas || !icp.industries) {
      throw new Error('Invalid ICP structure returned from AI');
    }

    return icp;
  } catch (error) {
    console.error('Error generating ICP:', error);
    throw new Error(`Failed to generate ICP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Regenerate or refine an existing ICP with additional context
 */
export async function refineICP(
  existingICP: ICPData,
  feedback: string
): Promise<ICPData> {
  const systemPrompt = `You are an expert sales strategist. Refine the existing ICP based on user feedback.
Maintain the same JSON structure but improve based on the feedback provided.`;

  const userPrompt = `Existing ICP:
${JSON.stringify(existingICP, null, 2)}

User Feedback: ${feedback}

Please refine the ICP accordingly while maintaining all required fields.`;

  try {
    const refinedICP = await generateStructuredResponse<ICPData>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.4
    );

    return refinedICP;
  } catch (error) {
    console.error('Error refining ICP:', error);
    throw new Error(`Failed to refine ICP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate ICP summary for display
 */
export function generateICPSummary(icp: ICPData): string {
  const personas = icp.buyerPersonas.map((p) => p.role).join(', ');
  const industries = icp.industries.slice(0, 3).join(', ');
  
  return `${icp.title}: Companies in ${industries} with ${personas} as key decision makers. ${icp.companySize.stage.join('/')} stage companies with ${icp.companySize.minEmployees || '?'}-${icp.companySize.maxEmployees || '?'} employees.`;
}
