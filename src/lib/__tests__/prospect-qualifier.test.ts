import { describe, it, expect } from '@jest/globals';
import {
  validateScore,
  getFitLevel,
  getQualificationStats,
  SCORE_BOUNDS,
  FIT_LEVEL_THRESHOLDS,
  type QualificationResult,
  type FitLevel
} from '../prospect-qualifier';

describe('ProspectQualifier Core Functions', () => {
  describe('validateScore', () => {
    it('should return valid scores unchanged', () => {
      expect(validateScore(50)).toBe(50);
      expect(validateScore(0)).toBe(0);
      expect(validateScore(100)).toBe(100);
      expect(validateScore(75.8)).toBe(76); // rounds to nearest integer
    });

    it('should clamp scores above maximum', () => {
      expect(validateScore(150)).toBe(100);
      expect(validateScore(101)).toBe(100);
      expect(validateScore(999)).toBe(100);
    });

    it('should clamp scores below minimum', () => {
      expect(validateScore(-10)).toBe(0);
      expect(validateScore(-1)).toBe(0);
      expect(validateScore(-999)).toBe(0);
    });

    it('should handle invalid score types', () => {
      expect(validateScore(NaN)).toBe(0);
      expect(validateScore(Infinity)).toBe(100);
      expect(validateScore(-Infinity)).toBe(0);
      expect(validateScore(null as any)).toBe(0);
      expect(validateScore(undefined as any)).toBe(0);
      expect(validateScore('string' as any)).toBe(0);
    });

    it('should round decimal scores', () => {
      expect(validateScore(50.4)).toBe(50);
      expect(validateScore(50.5)).toBe(51);
      expect(validateScore(50.6)).toBe(51);
    });
  });

  describe('getFitLevel', () => {
    it('should return correct fit level for valid scores', () => {
      expect(getFitLevel(85)).toBe('EXCELLENT');
      expect(getFitLevel(80)).toBe('EXCELLENT');
      expect(getFitLevel(75)).toBe('GOOD');
      expect(getFitLevel(60)).toBe('GOOD');
      expect(getFitLevel(45)).toBe('FAIR');
      expect(getFitLevel(40)).toBe('FAIR');
      expect(getFitLevel(15)).toBe('POOR');
      expect(getFitLevel(0)).toBe('POOR');
    });

    it('should validate scores before determining fit level', () => {
      expect(getFitLevel(150)).toBe('EXCELLENT'); // clamped to 100
      expect(getFitLevel(-10)).toBe('POOR'); // clamped to 0
      expect(getFitLevel(NaN)).toBe('POOR'); // defaults to 0
    });

    it('should use correct thresholds', () => {
      expect(getFitLevel(FIT_LEVEL_THRESHOLDS.EXCELLENT)).toBe('EXCELLENT');
      expect(getFitLevel(FIT_LEVEL_THRESHOLDS.EXCELLENT - 1)).toBe('GOOD');
      expect(getFitLevel(FIT_LEVEL_THRESHOLDS.GOOD)).toBe('GOOD');
      expect(getFitLevel(FIT_LEVEL_THRESHOLDS.GOOD - 1)).toBe('FAIR');
      expect(getFitLevel(FIT_LEVEL_THRESHOLDS.FAIR)).toBe('FAIR');
      expect(getFitLevel(FIT_LEVEL_THRESHOLDS.FAIR - 1)).toBe('POOR');
    });
  });

  describe('getQualificationStats', () => {
    it('should calculate correct statistics', () => {
      const mockResults: QualificationResult[] = [
        { score: 85, fitLevel: 'EXCELLENT' } as QualificationResult,
        { score: 75, fitLevel: 'GOOD' } as QualificationResult,
        { score: 45, fitLevel: 'FAIR' } as QualificationResult,
        { score: 25, fitLevel: 'POOR' } as QualificationResult,
        { score: 90, fitLevel: 'EXCELLENT' } as QualificationResult
      ];

      const stats = getQualificationStats(mockResults);

      expect(stats).toEqual({
        total: 5,
        byFitLevel: {
          EXCELLENT: 2,
          GOOD: 1,
          FAIR: 1,
          POOR: 1
        },
        averageScore: 64, // (85 + 75 + 45 + 25 + 90) / 5 = 64
        qualified: 3, // EXCELLENT + GOOD
        qualificationRate: 60 // (3/5) * 100 = 60%
      });
    });

    it('should handle empty results', () => {
      const stats = getQualificationStats([]);

      expect(stats).toEqual({
        total: 0,
        byFitLevel: {
          EXCELLENT: 0,
          GOOD: 0,
          FAIR: 0,
          POOR: 0
        },
        averageScore: 0,
        qualified: 0,
        qualificationRate: 0
      });
    });

    it('should handle single result', () => {
      const mockResults: QualificationResult[] = [
        { score: 75, fitLevel: 'GOOD' } as QualificationResult
      ];

      const stats = getQualificationStats(mockResults);

      expect(stats).toEqual({
        total: 1,
        byFitLevel: {
          EXCELLENT: 0,
          GOOD: 1,
          FAIR: 0,
          POOR: 0
        },
        averageScore: 75,
        qualified: 1,
        qualificationRate: 100
      });
    });

    it('should handle all poor fits', () => {
      const mockResults: QualificationResult[] = [
        { score: 10, fitLevel: 'POOR' } as QualificationResult,
        { score: 20, fitLevel: 'POOR' } as QualificationResult,
        { score: 30, fitLevel: 'POOR' } as QualificationResult
      ];

      const stats = getQualificationStats(mockResults);

      expect(stats).toEqual({
        total: 3,
        byFitLevel: {
          EXCELLENT: 0,
          GOOD: 0,
          FAIR: 0,
          POOR: 3
        },
        averageScore: 20, // (10 + 20 + 30) / 3 = 20
        qualified: 0,
        qualificationRate: 0
      });
    });
  });

  describe('Constants and Configuration', () => {
    it('should maintain consistent scoring bounds', () => {
      expect(SCORE_BOUNDS.MIN).toBe(0);
      expect(SCORE_BOUNDS.MAX).toBe(100);
    });

    it('should have logical fit level thresholds', () => {
      expect(FIT_LEVEL_THRESHOLDS.EXCELLENT).toBeGreaterThan(FIT_LEVEL_THRESHOLDS.GOOD);
      expect(FIT_LEVEL_THRESHOLDS.GOOD).toBeGreaterThan(FIT_LEVEL_THRESHOLDS.FAIR);
      expect(FIT_LEVEL_THRESHOLDS.FAIR).toBeGreaterThan(FIT_LEVEL_THRESHOLDS.POOR);
      
      // Ensure thresholds are within valid score bounds
      expect(FIT_LEVEL_THRESHOLDS.EXCELLENT).toBeGreaterThanOrEqual(SCORE_BOUNDS.MIN);
      expect(FIT_LEVEL_THRESHOLDS.EXCELLENT).toBeLessThanOrEqual(SCORE_BOUNDS.MAX);
    });

    it('should have reasonable threshold values', () => {
      expect(FIT_LEVEL_THRESHOLDS.EXCELLENT).toBe(80);
      expect(FIT_LEVEL_THRESHOLDS.GOOD).toBe(60);
      expect(FIT_LEVEL_THRESHOLDS.FAIR).toBe(40);
      expect(FIT_LEVEL_THRESHOLDS.POOR).toBe(0);
    });
  });

  describe('Score Edge Cases', () => {
    it('should handle boundary values correctly', () => {
      // Test exact threshold boundaries
      expect(getFitLevel(79.9)).toBe('GOOD'); // Just below EXCELLENT
      expect(getFitLevel(80)).toBe('EXCELLENT'); // Exact EXCELLENT threshold
      expect(getFitLevel(59.9)).toBe('FAIR'); // Just below GOOD
      expect(getFitLevel(60)).toBe('GOOD'); // Exact GOOD threshold
      expect(getFitLevel(39.9)).toBe('POOR'); // Just below FAIR
      expect(getFitLevel(40)).toBe('FAIR'); // Exact FAIR threshold
    });

    it('should handle very close to boundary floating point values', () => {
      expect(getFitLevel(79.999)).toBe('GOOD');
      expect(getFitLevel(80.001)).toBe('EXCELLENT');
      expect(getFitLevel(59.999)).toBe('FAIR');
      expect(getFitLevel(60.001)).toBe('GOOD');
    });
  });
});