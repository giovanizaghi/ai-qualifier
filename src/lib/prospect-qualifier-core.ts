// Core validation functions extracted for testing
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

export type FitLevel = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

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
 */
export function getFitLevel(score: number): FitLevel {
  const validatedScore = validateScore(score);
  
  if (validatedScore >= FIT_LEVEL_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (validatedScore >= FIT_LEVEL_THRESHOLDS.GOOD) return 'GOOD';
  if (validatedScore >= FIT_LEVEL_THRESHOLDS.FAIR) return 'FAIR';
  return 'POOR';
}

/**
 * Get qualification statistics
 */
export function getQualificationStats(results: Array<{ score: number; fitLevel: FitLevel }>) {
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