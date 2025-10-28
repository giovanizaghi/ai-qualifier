import { generateStructuredResponse } from './openai-client';
import { analyzeCompanyDomain, type DomainAnalysisResult, type CompanyAnalysis } from './domain-analyzer';
import type { ICPData } from './icp-generator';

export type FitLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

// Scoring configuration constants
export const SCORE_BOUNDS = {
  MIN: 0,
  MAX: 100
} as const;

export const FIT_LEVEL_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 0
} as const;

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
  scoreValidation?: {
    originalScore?: number;
    wasClamped: boolean;
    fallbackUsed: boolean;
    validationErrors?: string[];
  };
  processing?: {
    timestamp: Date;
    duration?: number;
    retryCount?: number;
    errors?: string[];
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
 * Validate and normalize score to ensure it's within bounds
 */
export function validateScore(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) {
    console.warn(`Invalid score type: ${typeof score}, value: ${score}. Defaulting to 0.`);
    return SCORE_BOUNDS.MIN;
  }
  
  return Math.max(SCORE_BOUNDS.MIN, Math.min(SCORE_BOUNDS.MAX, Math.round(score)));
}

/**
 * Determine fit level based on score with proper validation
 * Note: Uses original score for threshold comparison, then validates for storage
 */
export function getFitLevel(score: number): FitLevel {
  // Handle invalid scores first
  if (typeof score !== 'number' || isNaN(score)) {
    return 'POOR';
  }
  
  // Clamp score to valid range but don't round for threshold comparison
  const clampedScore = Math.max(SCORE_BOUNDS.MIN, Math.min(SCORE_BOUNDS.MAX, score));
  
  if (clampedScore >= FIT_LEVEL_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (clampedScore >= FIT_LEVEL_THRESHOLDS.GOOD) return 'GOOD';
  if (clampedScore >= FIT_LEVEL_THRESHOLDS.FAIR) return 'FAIR';
  return 'POOR';
}

/**
 * Calculate fallback score based on available data when AI fails
 */
function calculateFallbackScore(
  prospectData: { scrapedData: DomainAnalysisResult; aiAnalysis: CompanyAnalysis },
  icp: ICPData
): { score: number; reasoning: string; confidence: number } {
  let score = 0;
  const reasons: string[] = [];
  let confidence = 30; // Low confidence for fallback scoring

  // Basic industry matching (30 points max)
  if (prospectData.aiAnalysis.industry && icp.industries.length > 0) {
    const industryMatch = icp.industries.some(targetIndustry => 
      prospectData.aiAnalysis.industry.toLowerCase().includes(targetIndustry.toLowerCase()) ||
      targetIndustry.toLowerCase().includes(prospectData.aiAnalysis.industry.toLowerCase())
    );
    
    if (industryMatch) {
      score += 30;
      reasons.push(`Industry match: ${prospectData.aiAnalysis.industry}`);
      confidence += 20;
    }
  }

  // Company name and description presence (20 points max)
  if (prospectData.aiAnalysis.companyName && prospectData.aiAnalysis.companyName !== prospectData.scrapedData.domain) {
    score += 10;
    reasons.push('Valid company information found');
    confidence += 10;
  }

  if (prospectData.aiAnalysis.description && prospectData.aiAnalysis.description.length > 50) {
    score += 10;
    reasons.push('Detailed company description available');
    confidence += 10;
  }

  // Website content quality (20 points max)
  if (prospectData.scrapedData.mainContent && prospectData.scrapedData.mainContent.length > 0) {
    score += 10;
    reasons.push('Website content successfully scraped');
    confidence += 10;
  }

  if (prospectData.scrapedData.headings && prospectData.scrapedData.headings.length > 0) {
    score += 10;
    reasons.push('Structured website content found');
    confidence += 10;
  }

  // Key offerings presence (10 points max)
  if (prospectData.aiAnalysis.keyOfferings && prospectData.aiAnalysis.keyOfferings.length > 0) {
    score += 10;
    reasons.push(`Found ${prospectData.aiAnalysis.keyOfferings.length} key offerings`);
    confidence += 5;
  }

  const reasoning = reasons.length > 0 
    ? `Fallback scoring based on: ${reasons.join(', ')}`
    : 'Unable to determine qualification - insufficient data available';

  return {
    score: validateScore(score),
    reasoning,
    confidence: Math.min(confidence, 100)
  };
}

/**
 * Log qualification details for debugging and monitoring
 */
function logQualificationDetails(
  prospectDomain: string,
  result: QualificationResult,
  startTime: number,
  fallbackUsed: boolean,
  originalScore?: number
): void {
  const duration = Date.now() - startTime;
  const logData = {
    domain: prospectDomain,
    score: result.score,
    originalScore,
    fitLevel: result.fitLevel,
    fallbackUsed,
    duration,
    timestamp: new Date().toISOString(),
    matchedCriteriaCount: result.matchedCriteria?.length || 0,
    gapsCount: result.gaps?.length || 0,
    hasCompanyData: !!result.prospectData.aiAnalysis.companyName,
    hasScrapedContent: !!result.prospectData.scrapedData.mainContent?.length
  };

  if (fallbackUsed) {
    console.warn('Qualification fallback used:', logData);
  } else {
    console.log('Qualification completed:', logData);
  }

  // Log warnings for edge cases
  if (result.score === 0 && !fallbackUsed) {
    console.warn(`Zero score assigned to ${prospectDomain} - possible AI evaluation issue`);
  }
  
  if (originalScore && Math.abs(originalScore - result.score) > 0) {
    console.warn(`Score clamped for ${prospectDomain}: ${originalScore} -> ${result.score}`);
  }

  if (duration > 30000) { // 30 seconds
    console.warn(`Slow qualification for ${prospectDomain}: ${duration}ms`);
  }
}

/**
 * Qualify a prospect against an ICP
 */
export async function qualifyProspect(
  prospectDomain: string,
  icp: ICPData
): Promise<QualificationResult> {
  const startTime = Date.now();
  let fallbackUsed = false;
  let originalScore: number | undefined;
  let validationErrors: string[] = [];
  
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

  let qualification: AIQualificationResponse;
  
  try {
    qualification = await generateStructuredResponse<AIQualificationResponse>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.3 // Lower temperature for consistent evaluation
    );

    // Validate and normalize the AI response
    originalScore = qualification.score;
    
    // Validate score
    if (typeof qualification.score !== 'number' || isNaN(qualification.score)) {
      validationErrors.push(`Invalid score type: ${typeof qualification.score}`);
      fallbackUsed = true;
    }

    // Validate fit level alignment
    const calculatedFitLevel = getFitLevel(qualification.score);
    if (qualification.fitLevel !== calculatedFitLevel) {
      validationErrors.push(`Fit level mismatch: AI returned ${qualification.fitLevel}, calculated ${calculatedFitLevel}`);
      qualification.fitLevel = calculatedFitLevel;
    }

    // Validate required fields
    if (!qualification.reasoning || qualification.reasoning.length < 10) {
      validationErrors.push('Insufficient reasoning provided');
      qualification.reasoning = 'Limited analysis available - may require manual review';
    }

    if (!qualification.matchedCriteria || !Array.isArray(qualification.matchedCriteria)) {
      validationErrors.push('Invalid matched criteria format');
      qualification.matchedCriteria = [];
    }

    if (!qualification.gaps || !Array.isArray(qualification.gaps)) {
      validationErrors.push('Invalid gaps format');
      qualification.gaps = ['Unable to determine gaps from AI analysis'];
    }

    if (!qualification.recommendation) {
      validationErrors.push('No recommendation provided');
      qualification.recommendation = 'Requires manual review';
    }

  } catch (error) {
    console.error('AI qualification failed, using fallback scoring:', error);
    fallbackUsed = true;
    validationErrors.push(`AI qualification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Use fallback scoring
    const fallbackResult = calculateFallbackScore(prospectData, icp);
    
    qualification = {
      score: fallbackResult.score,
      fitLevel: getFitLevel(fallbackResult.score),
      reasoning: fallbackResult.reasoning,
      matchedCriteria: [],
      gaps: ['AI analysis unavailable - using basic heuristics'],
      recommendation: fallbackResult.score > 40 ? 'Manual review recommended' : 'Low priority - basic analysis suggests poor fit'
    };
  }

  // Final score validation and clamping
  const validatedScore = validateScore(qualification.score);
  const wasClamped = validatedScore !== qualification.score;
  
  if (wasClamped) {
    validationErrors.push(`Score clamped from ${qualification.score} to ${validatedScore}`);
  }

  // Ensure fit level matches final validated score
  const finalFitLevel = getFitLevel(validatedScore);

  const result: QualificationResult = {
    prospectDomain,
    prospectName: aiAnalysis.companyName,
    score: validatedScore,
    fitLevel: finalFitLevel,
    reasoning: qualification.reasoning,
    matchedCriteria: qualification.matchedCriteria,
    gaps: qualification.gaps,
    recommendation: qualification.recommendation,
    prospectData: {
      scrapedData,
      aiAnalysis,
    },
    scoreValidation: {
      originalScore,
      wasClamped,
      fallbackUsed,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    },
    processing: {
      timestamp: new Date(),
      duration: Date.now() - startTime,
      retryCount: 0,
      errors: validationErrors.length > 0 ? validationErrors : undefined
    }
  };

  // Log detailed information for monitoring
  logQualificationDetails(prospectDomain, result, startTime, fallbackUsed, originalScore);

  return result;
}

// Configuration for optimized batching
export const BATCH_CONFIG = {
  DEFAULT_BATCH_SIZE: 5, // Process 5 prospects concurrently
  MAX_BATCH_SIZE: 10,    // Maximum concurrent operations
  DELAY_BETWEEN_BATCHES: 1000, // 1 second delay between batches to avoid rate limits
  MAX_RETRIES: 2,        // Maximum retry attempts for failed prospects
  RETRY_DELAY: 2000,     // 2 second delay before retry
} as const;

/**
 * Create a failed result structure for error cases
 */
function createFailedResult(
  domain: string, 
  error: Error | string, 
  retryCount: number = 0
): QualificationResult {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    prospectDomain: domain,
    prospectName: domain,
    score: 0,
    fitLevel: 'POOR',
    reasoning: `Failed to analyze: ${errorMessage}`,
    matchedCriteria: [],
    gaps: ['Unable to scrape or analyze website', 'Complete analysis failure'],
    recommendation: 'Unable to qualify - manual review needed',
    prospectData: {
      scrapedData: {
        domain,
        mainContent: [],
        headings: [],
        error: errorMessage,
      },
      aiAnalysis: {
        companyName: domain,
        industry: 'Unknown',
        description: 'Unable to analyze',
        targetMarket: 'Unknown',
        keyOfferings: [],
      },
    },
    scoreValidation: {
      originalScore: undefined,
      wasClamped: false,
      fallbackUsed: true,
      validationErrors: [`Complete failure: ${errorMessage}`]
    },
    processing: {
      timestamp: new Date(),
      duration: 0,
      retryCount,
      errors: [`Qualification failed: ${errorMessage}`]
    }
  };
}

/**
 * Process a single prospect with retry logic
 */
async function processProspectWithRetry(
  domain: string, 
  icp: ICPData, 
  maxRetries: number = BATCH_CONFIG.MAX_RETRIES
): Promise<QualificationResult> {
  let lastError: Error | string = 'Unknown error';
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await qualifyProspect(domain, icp);
      
      // Update retry count in the result
      if (result.processing) {
        result.processing.retryCount = attempt;
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : String(error);
      console.error(`Attempt ${attempt + 1} failed for ${domain}:`, lastError);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  // All attempts failed, return failed result
  return createFailedResult(domain, lastError, maxRetries);
}

/**
 * Process a batch of prospects concurrently
 */
async function processBatch(
  domains: string[], 
  icp: ICPData, 
  batchIndex: number,
  onProgress?: (completed: number, total: number, batchIndex: number) => void
): Promise<QualificationResult[]> {
  const batchSize = domains.length;
  console.log(`Processing batch ${batchIndex + 1} with ${batchSize} prospects`);
  
  // Process all prospects in the batch concurrently
  const batchPromises = domains.map(domain => 
    processProspectWithRetry(domain, icp)
  );
  
  // Wait for all prospects in the batch to complete
  const results = await Promise.all(batchPromises);
  
  // Report progress for this batch
  if (onProgress) {
    onProgress(results.length, domains.length, batchIndex);
  }
  
  return results;
}

/**
 * Optimized batch qualify multiple prospects with configurable concurrency
 */
export async function qualifyProspects(
  prospectDomains: string[],
  icp: ICPData,
  options: {
    batchSize?: number;
    onProgress?: (completed: number, total: number, batchIndex?: number) => void;
    maxRetries?: number;
    delayBetweenBatches?: number;
  } = {}
): Promise<QualificationResult[]> {
  const {
    batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE,
    onProgress,
    maxRetries = BATCH_CONFIG.MAX_RETRIES,
    delayBetweenBatches = BATCH_CONFIG.DELAY_BETWEEN_BATCHES
  } = options;
  
  const total = prospectDomains.length;
  const startTime = Date.now();
  const effectiveBatchSize = Math.min(batchSize, BATCH_CONFIG.MAX_BATCH_SIZE);
  
  console.log(`Starting optimized batch qualification of ${total} prospects with batch size ${effectiveBatchSize}`);
  
  if (total === 0) {
    return [];
  }
  
  const results: QualificationResult[] = [];
  let completed = 0;
  
  // Process prospects in batches
  for (let i = 0; i < prospectDomains.length; i += effectiveBatchSize) {
    const batch = prospectDomains.slice(i, i + effectiveBatchSize);
    const batchIndex = Math.floor(i / effectiveBatchSize);
    
    try {
      const batchResults = await processBatch(
        batch, 
        icp, 
        batchIndex, 
        (batchCompleted, batchTotal, batchIdx) => {
          // Update overall progress
          completed = i + batchCompleted;
          if (onProgress) {
            onProgress(completed, total, batchIdx);
          }
        }
      );
      
      results.push(...batchResults);
      completed = i + batch.length;
      
      // Report overall progress
      if (onProgress) {
        onProgress(completed, total, batchIndex);
      }
      
      // Add delay between batches to avoid overwhelming APIs (except for the last batch)
      if (i + effectiveBatchSize < prospectDomains.length && delayBetweenBatches > 0) {
        console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
      
    } catch (error) {
      console.error(`Batch ${batchIndex + 1} failed:`, error);
      
      // Create failed results for the entire batch
      const failedResults = batch.map(domain => 
        createFailedResult(domain, error instanceof Error ? error : 'Batch processing failed', maxRetries)
      );
      
      results.push(...failedResults);
      completed = i + batch.length;
      
      if (onProgress) {
        onProgress(completed, total, batchIndex);
      }
    }
  }
  
  const duration = Date.now() - startTime;
  const successCount = results.filter(r => !r.scoreValidation?.fallbackUsed && !r.processing?.errors?.length).length;
  const fallbackCount = results.filter(r => r.scoreValidation?.fallbackUsed && !r.processing?.errors?.length).length;
  const failureCount = results.filter(r => r.processing?.errors?.length).length;
  const totalRetries = results.reduce((sum, r) => sum + (r.processing?.retryCount || 0), 0);
  
  console.log(`Optimized batch qualification completed in ${duration}ms:`, {
    total,
    successful: successCount,
    fallbacks: fallbackCount,
    failures: failureCount,
    totalRetries,
    averageTime: Math.round(duration / total),
    batchSize: effectiveBatchSize,
    throughput: Math.round((total / duration) * 1000 * 60) // prospects per minute
  });
  
  return results;
}

/**
 * Legacy batch qualify function for backward compatibility
 * @deprecated Use qualifyProspects with options parameter instead
 */
export async function qualifyProspectsLegacy(
  prospectDomains: string[],
  icp: ICPData,
  onProgress?: (completed: number, total: number) => void
): Promise<QualificationResult[]> {
  return qualifyProspects(prospectDomains, icp, { 
    batchSize: 1, // Sequential processing for legacy compatibility
    onProgress 
  });
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
