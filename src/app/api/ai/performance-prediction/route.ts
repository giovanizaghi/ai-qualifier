import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { aiService } from '@/lib/ai';

// Validation schemas
const predictSuccessSchema = z.object({
  userId: z.string().min(1),
  targetQualification: z.string().min(1),
  userPerformance: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    confidenceScore: z.number().min(0).max(100),
    predictedSuccessRate: z.number().min(0).max(100)
  }),
  practiceHistory: z.array(z.object({
    date: z.string().transform(str => new Date(str)),
    topic: z.string(),
    score: z.number().min(0).max(100),
    timeSpent: z.number().min(0),
    difficulty: z.string()
  })),
  studyPlan: z.object({
    hoursPerWeek: z.number().min(1).max(40),
    weeksUntilExam: z.number().min(1).max(52),
    focusAreas: z.array(z.string())
  })
});

const predictLearningOutcomesSchema = z.object({
  userId: z.string().min(1),
  learningPath: z.object({
    topics: z.array(z.string()),
    estimatedDuration: z.number().min(1),
    difficulty: z.string()
  }),
  userCapabilities: z.object({
    learningSpeed: z.enum(['slow', 'average', 'fast']),
    retentionRate: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    motivationLevel: z.number().min(0).max(100)
  }),
  externalFactors: z.object({
    availableTime: z.number().min(1).max(40),
    distractions: z.enum(['low', 'medium', 'high']),
    support: z.enum(['none', 'minimal', 'moderate', 'strong'])
  })
});

const riskAssessmentSchema = z.object({
  userPerformance: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    confidenceScore: z.number().min(0).max(100)
  }),
  practiceHistory: z.array(z.object({
    date: z.string().transform(str => new Date(str)),
    score: z.number().min(0).max(100),
    timeSpent: z.number().min(0),
    completed: z.boolean()
  })),
  behaviorPatterns: z.object({
    studyFrequency: z.number().min(0),
    averageSessionLength: z.number().min(0),
    dropoffRate: z.number().min(0).max(100),
    peakPerformanceTime: z.string()
  })
});

const performanceInsightsSchema = z.object({
  historicalData: z.array(z.object({
    date: z.string().transform(str => new Date(str)),
    qualificationId: z.string(),
    score: z.number().min(0).max(100),
    timeSpent: z.number().min(0),
    topics: z.array(z.string()),
    difficulty: z.string()
  })),
  timeframe: z.enum(['week', 'month', 'quarter', 'year'])
});

export async function POST(request: NextRequest) {
  try {
    if (!aiService.isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI services are not available. Please check your OpenAI API key configuration.' },
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'predict-success': {
        const body = await request.json();
        const validated = predictSuccessSchema.parse(body);
        
        const prediction = await aiService.predictQualificationSuccess(
          validated.userId,
          validated.targetQualification,
          validated.userPerformance,
          validated.practiceHistory,
          validated.studyPlan
        );

        return NextResponse.json({ 
          success: true, 
          data: prediction,
          meta: {
            userId: validated.userId,
            qualification: validated.targetQualification,
            practiceSessionsAnalyzed: validated.practiceHistory.length,
            studyTimeWeeks: validated.studyPlan.weeksUntilExam,
            totalStudyHours: validated.studyPlan.hoursPerWeek * validated.studyPlan.weeksUntilExam
          }
        });
      }

      case 'predict-learning-outcomes': {
        const body = await request.json();
        const validated = predictLearningOutcomesSchema.parse(body);
        
        const outcomes = await aiService.predictLearningOutcomes(
          validated.userId,
          validated.learningPath,
          validated.userCapabilities,
          validated.externalFactors
        );

        return NextResponse.json({ 
          success: true, 
          data: outcomes,
          meta: {
            userId: validated.userId,
            topicsCount: validated.learningPath.topics.length,
            estimatedDuration: validated.learningPath.estimatedDuration,
            learningSpeed: validated.userCapabilities.learningSpeed,
            availableTime: validated.externalFactors.availableTime
          }
        });
      }

      case 'assess-risks': {
        const body = await request.json();
        const validated = riskAssessmentSchema.parse(body);
        
        const riskAssessment = await aiService.assessRiskFactors(
          validated.userPerformance,
          validated.practiceHistory,
          validated.behaviorPatterns
        );

        return NextResponse.json({ 
          success: true, 
          data: riskAssessment,
          meta: {
            practiceSessionsAnalyzed: validated.practiceHistory.length,
            studyFrequency: validated.behaviorPatterns.studyFrequency,
            dropoffRate: validated.behaviorPatterns.dropoffRate,
            confidenceScore: validated.userPerformance.confidenceScore
          }
        });
      }

      case 'performance-insights': {
        const body = await request.json();
        const validated = performanceInsightsSchema.parse(body);
        
        const insights = await aiService.predictLearningOutcomes(
          'analysis-user',
          {
            topics: [...new Set(validated.historicalData.flatMap(d => d.topics))],
            estimatedDuration: validated.historicalData.reduce((sum, d) => sum + d.timeSpent, 0) / 60,
            difficulty: 'intermediate'
          },
          {
            learningSpeed: 'average' as const,
            retentionRate: 75,
            consistency: 80,
            motivationLevel: 70
          },
          {
            availableTime: 10,
            distractions: 'medium' as const,
            support: 'moderate' as const
          }
        );

        return NextResponse.json({ 
          success: true, 
          data: insights,
          meta: {
            timeframe: validated.timeframe,
            sessionsAnalyzed: validated.historicalData.length,
            qualifications: [...new Set(validated.historicalData.map(d => d.qualificationId))].length,
            totalStudyTime: Math.round(validated.historicalData.reduce((sum, d) => sum + d.timeSpent, 0) / 60),
            averageScore: Math.round(validated.historicalData.reduce((sum, d) => sum + d.score, 0) / validated.historicalData.length)
          }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: predict-success, predict-learning-outcomes, assess-risks, performance-insights' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI performance prediction error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during performance prediction' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const isEnabled = aiService.isAIEnabled();
    
    return NextResponse.json({
      status: 'ok',
      aiEnabled: isEnabled,
      capabilities: [
        'predict-success',
        'predict-learning-outcomes',
        'assess-risks',
        'performance-insights'
      ],
      predictionFeatures: {
        successPrediction: 'ML-powered qualification success probability with confidence intervals',
        outcomeForecasting: 'Learning outcome predictions based on multiple factors',
        riskAssessment: 'Early warning system for learning challenges and barriers',
        performanceAnalytics: 'Deep insights into learning patterns and trends',
        predictiveModeling: 'Statistical analysis of performance data for optimization'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI performance prediction health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        aiEnabled: false,
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}