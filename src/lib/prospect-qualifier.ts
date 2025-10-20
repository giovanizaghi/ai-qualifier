import { generateStructuredResponse } from './openai-client';
import { analyzeCompanyDomain, type DomainAnalysisResult, type CompanyAnalysis } from './domain-analyzer';
import type { ICPData } from './icp-generator';

export type FitLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface MatchedCriteria {
  category: string;
  criteria: string;
  match: boolean;
  confidence: number; // 0-100
  evidence?: string;
}

export interface QualificationResult {
  prospectDomain: string;
  prospectName: string;
  score: number; // 0-100
  fitLevel: FitLevel;
  reasoning: string;
  matchedCriteria: MatchedCriteria[];
  gaps: string[];
  recommendation: string;
  prospectData: {
    scrapedData: DomainAnalysisResult;
    aiAnalysis: CompanyAnalysis;
  };
}

interface AIQualificationResponse {
  score: number;
  fitLevel: FitLevel;
  reasoning: string;
  matchedCriteria: MatchedCriteria[];
  gaps: string[];
  recommendation: string;
}

/**
 * Determine fit level based on score
 */
function getFitLevel(score: number): FitLevel {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'POOR';
}

/**
 * Qualify a prospect against an ICP
 */
export async function qualifyProspect(
  prospectDomain: string,
  icp: ICPData
): Promise<QualificationResult> {
  // Step 1: Analyze the prospect's domain
  const prospectData = await analyzeCompanyDomain(prospectDomain);
  const { scrapedData, aiAnalysis } = prospectData;

  // Step 2: Qualify against ICP using AI
  const systemPrompt = `You are an expert sales qualification analyst. 
Evaluate how well a prospect company fits an Ideal Customer Profile (ICP).

Return a JSON object with this structure:
{
  "score": 75,  // 0-100 score
  "fitLevel": "EXCELLENT" | "GOOD" | "FAIR" | "POOR",
  "reasoning": "2-3 sentence explanation of the score",
  "matchedCriteria": [
    {
      "category": "Industry",
      "criteria": "In target industry",
      "match": true,
      "confidence": 90,
      "evidence": "Company operates in SaaS"
    }
  ],
  "gaps": ["Not in target geographic region", "Company size too small"],
  "recommendation": "Qualified lead - reach out immediately" | "Good fit with caveats" | "Not a priority" | "Poor fit - skip"
}

Scoring guidelines:
- 80-100 (EXCELLENT): Strong match across all key criteria
- 60-79 (GOOD): Solid match with minor gaps
- 40-59 (FAIR): Partial match, some concerns
- 0-39 (POOR): Significant misalignment

Be thorough but concise. Focus on actionable insights.`;

  const userPrompt = `Evaluate this prospect against the ICP:

=== IDEAL CUSTOMER PROFILE ===
Title: ${icp.title}
Description: ${icp.description}

Target Industries: ${icp.industries.join(', ')}
Company Size: ${icp.companySize.minEmployees || '?'}-${icp.companySize.maxEmployees || '?'} employees
Stage: ${icp.companySize.stage.join(', ')}
Geographic Regions: ${icp.geographicRegions.join(', ')}
Funding Stages: ${icp.fundingStages.join(', ')}

Buyer Personas:
${icp.buyerPersonas.map((p) => `- ${p.role} (${p.seniority}, ${p.department})`).join('\n')}

Key Indicators:
${(icp.keyIndicators || []).map((i) => `- ${i}`).join('\n') || '- None specified'}

=== PROSPECT COMPANY ===
Domain: ${prospectDomain}
Name: ${aiAnalysis.companyName}
Industry: ${aiAnalysis.industry}
Description: ${aiAnalysis.description}
Target Market: ${aiAnalysis.targetMarket}
Key Offerings: ${aiAnalysis.keyOfferings.join(', ')}
${aiAnalysis.companySize ? `Company Size: ${aiAnalysis.companySize}` : ''}

=== ANALYSIS ===
Compare the prospect against each ICP criterion. Consider:
1. Industry alignment
2. Company size/stage match
3. Geographic fit
4. Likely buyer personas present
5. Signs of key indicators
6. Overall strategic fit

Provide specific, actionable qualification.`;

  try {
    const qualification = await generateStructuredResponse<AIQualificationResponse>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.3 // Lower temperature for consistent evaluation
    );

    // Ensure fit level matches score
    const validatedFitLevel = getFitLevel(qualification.score);

    return {
      prospectDomain,
      prospectName: aiAnalysis.companyName,
      score: qualification.score,
      fitLevel: validatedFitLevel,
      reasoning: qualification.reasoning,
      matchedCriteria: qualification.matchedCriteria,
      gaps: qualification.gaps,
      recommendation: qualification.recommendation,
      prospectData: {
        scrapedData,
        aiAnalysis,
      },
    };
  } catch (error) {
    console.error('Error qualifying prospect:', error);
    throw new Error(`Failed to qualify prospect: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch qualify multiple prospects
 */
export async function qualifyProspects(
  prospectDomains: string[],
  icp: ICPData,
  onProgress?: (completed: number, total: number) => void
): Promise<QualificationResult[]> {
  const results: QualificationResult[] = [];
  const total = prospectDomains.length;

  for (let i = 0; i < prospectDomains.length; i++) {
    const domain = prospectDomains[i];
    
    try {
      const result = await qualifyProspect(domain, icp);
      results.push(result);
    } catch (error) {
      console.error(`Failed to qualify ${domain}:`, error);
      // Create a failed result
      results.push({
        prospectDomain: domain,
        prospectName: domain,
        score: 0,
        fitLevel: 'POOR',
        reasoning: `Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`,
        matchedCriteria: [],
        gaps: ['Unable to scrape or analyze website'],
        recommendation: 'Unable to qualify - manual review needed',
        prospectData: {
          scrapedData: {
            domain,
            mainContent: [],
            headings: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          aiAnalysis: {
            companyName: domain,
            industry: 'Unknown',
            description: 'Unable to analyze',
            targetMarket: 'Unknown',
            keyOfferings: [],
          },
        },
      });
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}

/**
 * Get qualification statistics
 */
export function getQualificationStats(results: QualificationResult[]) {
  const total = results.length;
  const byFitLevel = {
    EXCELLENT: results.filter((r) => r.fitLevel === 'EXCELLENT').length,
    GOOD: results.filter((r) => r.fitLevel === 'GOOD').length,
    FAIR: results.filter((r) => r.fitLevel === 'FAIR').length,
    POOR: results.filter((r) => r.fitLevel === 'POOR').length,
  };
  
  const averageScore = total > 0
    ? results.reduce((sum, r) => sum + r.score, 0) / total
    : 0;

  const qualified = byFitLevel.EXCELLENT + byFitLevel.GOOD;
  const qualificationRate = total > 0 ? (qualified / total) * 100 : 0;

  return {
    total,
    byFitLevel,
    averageScore: Math.round(averageScore * 10) / 10,
    qualified,
    qualificationRate: Math.round(qualificationRate * 10) / 10,
  };
}
