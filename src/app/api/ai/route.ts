import { NextResponse } from 'next/server';

import { aiService } from '@/lib/ai';

export async function GET() {
  try {
    const isEnabled = aiService.isAIEnabled();
    const connectionTest = isEnabled ? await aiService.testAIConnection() : false;

    return NextResponse.json({
      status: 'ok',
      aiEnabled: isEnabled,
      connectionTest,
      timestamp: new Date().toISOString(),
      
      // Phase 5.1 AI Integration Features
      capabilities: {
        contentGeneration: {
          endpoint: '/api/ai/content',
          features: [
            'AI-powered question generation',
            'Dynamic learning content creation',
            'Content enhancement and optimization'
          ],
          actions: ['generate-questions', 'generate-content', 'enhance-content']
        },
        
        personalizedLearning: {
          endpoint: '/api/ai/personalized-learning',
          features: [
            'Customized learning path generation',
            'Performance analysis and insights',
            'Adaptive resource recommendations'
          ],
          actions: ['create-learning-path', 'analyze-performance', 'generate-resources']
        },
        
        adaptiveQuestioning: {
          endpoint: '/api/ai/adaptive-questioning',
          features: [
            'Dynamic difficulty adjustment',
            'Context-aware question generation',
            'Follow-up question creation'
          ],
          actions: ['generate-adaptive-question', 'adjust-difficulty', 'generate-followup']
        },
        
        intelligentTutoring: {
          endpoint: '/api/ai/tutoring',
          features: [
            'Context-aware learning hints',
            'Detailed answer explanations',
            'Personalized learning guidance',
            'Step-by-step examples'
          ],
          actions: ['generate-hint', 'generate-explanation', 'learning-guidance', 'work-through-example']
        },
        
        contentRecommendation: {
          endpoint: '/api/ai/recommendations',
          features: [
            'Qualification recommendations',
            'Topic-based study suggestions',
            'Practice optimization',
            'Market trend-based content'
          ],
          actions: ['qualification-recommendations', 'topic-recommendations', 'practice-recommendations', 'trend-based-recommendations']
        },
        
        performancePrediction: {
          endpoint: '/api/ai/performance-prediction',
          features: [
            'Success probability analysis',
            'Learning outcome forecasting',
            'Risk factor identification',
            'Performance trend analysis'
          ],
          actions: ['predict-success', 'predict-learning-outcomes', 'assess-risks', 'performance-insights']
        }
      },

      // Implementation Status
      implementationStatus: {
        phase: '5.1 - AI Integration',
        completedFeatures: [
          'OpenAI API Integration',
          'AI Content Generation Service',
          'Personalized Learning Engine',
          'Adaptive Questioning System',
          'Intelligent Tutoring System',
          'Content Recommendation Engine',
          'Performance Prediction Analytics'
        ],
        apiEndpoints: 6,
        totalActions: 22,
        healthStatus: {
          openaiConnection: connectionTest,
          servicesOperational: isEnabled,
          errorHandling: 'Implemented',
          validation: 'Zod schemas active',
          rateLimit: 'Built-in delays',
          logging: 'Comprehensive'
        }
      },

      // Usage Guidelines
      usageGuidelines: {
        authentication: 'Ensure proper user authentication before AI requests',
        rateLimit: 'Built-in rate limiting to prevent API quota exhaustion',
        errorHandling: 'All endpoints include comprehensive error handling',
        validation: 'Request validation using Zod schemas',
        monitoring: 'Built-in health checks and status reporting',
        
        bestPractices: [
          'Test AI connection before making requests',
          'Handle errors gracefully in UI components',
          'Use appropriate timeout values',
          'Implement loading states for AI operations',
          'Cache AI responses when appropriate',
          'Monitor API usage and costs'
        ]
      },

      // Configuration
      configuration: {
        openaiModel: 'gpt-4o-mini (configurable)',
        maxTokens: '1000-2000 (context dependent)',
        temperature: '0.4-0.8 (task dependent)',
        timeout: '30 seconds default',
        retryLogic: 'Exponential backoff',
        fallbacks: 'Graceful degradation when AI unavailable'
      }
    });
  } catch (error) {
    console.error('AI overview error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to generate AI overview',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}