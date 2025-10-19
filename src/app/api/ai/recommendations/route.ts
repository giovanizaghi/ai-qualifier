import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { aiService } from '@/lib/ai';

// Validation schemas
const qualificationRecommendationsSchema = z.object({
  userProfile: z.object({
    currentSkills: z.array(z.string()),
    interests: z.array(z.string()),
    careerGoals: z.array(z.string()),
    experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'expert']),
    timeAvailable: z.number().min(1).max(40),
    completedQualifications: z.array(z.string())
  }),
  performanceAnalysis: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    confidenceScore: z.number().min(0).max(100)
  })
});

const topicRecommendationsSchema = z.object({
  currentQualification: z.string().min(1),
  userPerformance: z.object({
    strongTopics: z.array(z.string()),
    weakTopics: z.array(z.string()),
    recentScores: z.record(z.string(), z.number().min(0).max(100))
  }),
  learningObjectives: z.array(z.string())
});

const practiceRecommendationsSchema = z.object({
  userPerformance: z.object({
    currentScore: z.number().min(0).max(100),
    targetScore: z.number().min(0).max(100),
    weakAreas: z.array(z.string()),
    timeUntilExam: z.number().min(1).optional()
  }),
  practiceHistory: z.object({
    totalPracticeHours: z.number().min(0),
    averageScore: z.number().min(0).max(100),
    improvementRate: z.number()
  })
});

const trendBasedRecommendationsSchema = z.object({
  industryTrends: z.array(z.string()),
  userSkills: z.array(z.string()),
  marketDemand: z.record(z.string(), z.number().min(1).max(100)),
  futureProjections: z.array(z.string())
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
      case 'qualification-recommendations': {
        const body = await request.json();
        const validated = qualificationRecommendationsSchema.parse(body);
        
        const recommendations = await aiService.recommendQualifications(
          validated.userProfile,
          validated.performanceAnalysis
        );

        return NextResponse.json({ 
          success: true, 
          data: recommendations,
          meta: {
            userExperience: validated.userProfile.experienceLevel,
            skillsCount: validated.userProfile.currentSkills.length,
            recommendationCount: recommendations.length,
            confidenceScore: validated.performanceAnalysis.confidenceScore
          }
        });
      }

      case 'topic-recommendations': {
        const body = await request.json();
        const validated = topicRecommendationsSchema.parse(body);
        
        const recommendations = await aiService.recommendStudyTopics(
          validated.currentQualification,
          validated.userPerformance,
          validated.learningObjectives
        );

        return NextResponse.json({ 
          success: true, 
          data: recommendations,
          meta: {
            qualification: validated.currentQualification,
            strongTopics: validated.userPerformance.strongTopics.length,
            weakTopics: validated.userPerformance.weakTopics.length,
            objectivesCount: validated.learningObjectives.length
          }
        });
      }

      case 'practice-recommendations': {
        const body = await request.json();
        const validated = practiceRecommendationsSchema.parse(body);
        
        // Create recommendations based on performance gaps and practice history
        const scoreGap = validated.userPerformance.targetScore - validated.userPerformance.currentScore;
        const practiceRecommendations = await aiService.recommendStudyResources(
          'Practice Tests and Drills',
          'kinesthetic', // Practice-focused learning style
          scoreGap > 20 ? 'beginner' : scoreGap > 10 ? 'intermediate' : 'advanced',
          {
            dailyTime: validated.practiceHistory.totalPracticeHours * 60 / 7, // Convert to daily minutes
            preferredSessionLength: 60,
            totalTimeAvailable: Math.max(scoreGap * 2, 10) // Base time on score gap
          }
        );

        return NextResponse.json({ 
          success: true, 
          data: practiceRecommendations,
          meta: {
            currentScore: validated.userPerformance.currentScore,
            targetScore: validated.userPerformance.targetScore,
            scoreGap,
            timeUntilExam: validated.userPerformance.timeUntilExam,
            improvementNeeded: scoreGap > 0
          }
        });
      }

      case 'trend-based-recommendations': {
        const body = await request.json();
        const validated = trendBasedRecommendationsSchema.parse(body);
        
        // Generate market-aware recommendations
        const marketRecommendations = await aiService.recommendQualifications(
          {
            currentSkills: validated.userSkills,
            interests: validated.industryTrends,
            careerGoals: validated.futureProjections,
            experienceLevel: 'mid' as const,
            timeAvailable: 20,
            completedQualifications: []
          },
          {
            strengths: validated.userSkills,
            weaknesses: [],
            difficultyLevel: 'intermediate' as const,
            confidenceScore: 75
          }
        );

        return NextResponse.json({ 
          success: true, 
          data: marketRecommendations,
          meta: {
            trendsConsidered: validated.industryTrends.length,
            currentSkills: validated.userSkills.length,
            marketDemandFactors: Object.keys(validated.marketDemand).length,
            futureProjections: validated.futureProjections.length
          }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: qualification-recommendations, topic-recommendations, practice-recommendations, trend-based-recommendations' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI content recommendation error:', error);
    
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
      { error: 'Internal server error during content recommendation' },
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
        'qualification-recommendations',
        'topic-recommendations',
        'practice-recommendations',
        'trend-based-recommendations'
      ],
      recommendationFeatures: {
        personalizedQualifications: 'Career-aligned qualification recommendations based on skills and goals',
        targetedTopics: 'Study topic recommendations based on performance analysis',
        practiceOptimization: 'Tailored practice recommendations for exam preparation',
        marketAwareness: 'Industry trend-based recommendations for future-relevant skills',
        adaptiveContent: 'Dynamic content suggestions based on learning progress'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI content recommendation health check error:', error);
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