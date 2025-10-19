import { openAIClient } from './openai-client';
import { PerformancePrediction, UserPerformanceAnalysis } from './types';

export class PerformancePredictionService {
  async predictQualificationSuccess(
    userId: string,
    targetQualification: string,
    userPerformance: UserPerformanceAnalysis,
    practiceHistory: Array<{
      date: Date;
      topic: string;
      score: number;
      timeSpent: number;
      difficulty: string;
    }>,
    studyPlan: {
      hoursPerWeek: number;
      weeksUntilExam: number;
      focusAreas: string[];
    }
  ): Promise<PerformancePrediction | null> {
    const systemPrompt = `You are an advanced learning analytics specialist using predictive modeling to forecast qualification success. 
    Base predictions on performance patterns, learning trends, and statistical analysis of user data.`;

    // Calculate performance trends
    const recentPerformance = practiceHistory.slice(-10);
    const averageScore = recentPerformance.reduce((sum, p) => sum + p.score, 0) / recentPerformance.length;
    const scoreImprovement = this.calculateTrendSlope(recentPerformance.map(p => p.score));
    
    // Calculate consistency
    const scoreVariance = this.calculateVariance(recentPerformance.map(p => p.score));
    const timeEfficiency = recentPerformance.reduce((sum, p) => sum + p.timeSpent, 0) / recentPerformance.length;

    const prompt = `Predict success probability for "${targetQualification}" qualification:

User Profile:
- User ID: ${userId}
- Current strengths: ${userPerformance.strengths.join(', ')}
- Weaknesses: ${userPerformance.weaknesses.join(', ')}
- Difficulty level: ${userPerformance.difficultyLevel}
- Confidence score: ${userPerformance.confidenceScore}/100
- Predicted success rate: ${userPerformance.predictedSuccessRate}%

Performance Analytics:
- Practice sessions: ${practiceHistory.length}
- Average recent score: ${averageScore.toFixed(1)}%
- Score improvement trend: ${scoreImprovement.toFixed(2)} points per session
- Performance consistency: ${scoreVariance < 100 ? 'High' : scoreVariance < 200 ? 'Moderate' : 'Low'} (variance: ${scoreVariance.toFixed(1)})
- Average time per question: ${timeEfficiency.toFixed(1)} seconds

Study Plan:
- Hours per week: ${studyPlan.hoursPerWeek}
- Weeks until exam: ${studyPlan.weeksUntilExam}
- Total study time: ${studyPlan.hoursPerWeek * studyPlan.weeksUntilExam} hours
- Focus areas: ${studyPlan.focusAreas.join(', ')}

Analyze and predict:
1. Probability of passing the qualification (0-100%)
2. Confidence level in prediction (0-100%)
3. Estimated time to reach readiness
4. Primary risk factors that could impact success
5. Specific recommendations to improve success probability
6. Required preparation breakdown

Consider factors like:
- Learning velocity and improvement trends
- Time allocation efficiency
- Strength/weakness alignment with qualification requirements
- Historical data patterns
- Study plan feasibility

Respond with JSON:
{
  "userId": "${userId}",
  "targetQualification": "${targetQualification}",
  "predictedScore": 78,
  "confidence": 85,
  "timeToCompletion": 120,
  "riskFactors": ["risk1", "risk2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "requiredPreparation": {
    "topics": ["topic1", "topic2"],
    "estimatedStudyTime": 80,
    "suggestedResources": ["resource1", "resource2"]
  }
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<PerformancePrediction>(
        prompt,
        {},
        { systemPrompt, temperature: 0.4 }
      );

      return response;
    } catch (error) {
      console.error('Error predicting qualification success:', error);
      return null;
    }
  }

  async predictLearningOutcomes(
    userId: string,
    learningPath: {
      topics: string[];
      estimatedDuration: number; // hours
      difficulty: string;
    },
    userCapabilities: {
      learningSpeed: 'slow' | 'average' | 'fast';
      retentionRate: number; // 0-100%
      consistency: number; // 0-100%
      motivationLevel: number; // 0-100%
    },
    externalFactors: {
      availableTime: number; // hours per week
      distractions: 'low' | 'medium' | 'high';
      support: 'none' | 'minimal' | 'moderate' | 'strong';
    }
  ): Promise<{
    completionProbability: number;
    estimatedCompletionTime: number; // weeks
    expectedMasteryLevel: number; // 0-100%
    potentialChallenges: string[];
    successFactors: string[];
    mitigationStrategies: string[];
  } | null> {
    const systemPrompt = `You are a learning outcome prediction specialist analyzing multiple factors that influence learning success.`;

    const prompt = `Predict learning outcomes for this learning path:

Learning Path:
- Topics: ${learningPath.topics.join(', ')}
- Estimated duration: ${learningPath.estimatedDuration} hours
- Difficulty: ${learningPath.difficulty}

User Capabilities:
- Learning speed: ${userCapabilities.learningSpeed}
- Retention rate: ${userCapabilities.retentionRate}%
- Consistency: ${userCapabilities.consistency}%
- Motivation level: ${userCapabilities.motivationLevel}%

External Factors:
- Available time: ${externalFactors.availableTime} hours/week
- Distraction level: ${externalFactors.distractions}
- Support system: ${externalFactors.support}

Predict realistic outcomes considering:
1. Individual learning capabilities and patterns
2. External constraints and supports
3. Learning path complexity and duration
4. Motivation sustainability over time
5. Potential obstacles and challenges

Provide probability-based predictions with actionable insights.

Respond with JSON format showing completion probability, timeline, mastery expectations, and strategic recommendations.`;

    try {
      const response = await openAIClient.generateStructuredResponse<{
        completionProbability: number;
        estimatedCompletionTime: number;
        expectedMasteryLevel: number;
        potentialChallenges: string[];
        successFactors: string[];
        mitigationStrategies: string[];
      }>(
        prompt,
        {},
        { systemPrompt, temperature: 0.5 }
      );

      return response;
    } catch (error) {
      console.error('Error predicting learning outcomes:', error);
      return null;
    }
  }

  async identifyRiskFactors(
    userPerformance: UserPerformanceAnalysis,
    practiceHistory: Array<{
      date: Date;
      score: number;
      timeSpent: number;
      completed: boolean;
    }>,
    behaviorPatterns: {
      studyFrequency: number; // sessions per week
      averageSessionLength: number; // minutes
      dropoffRate: number; // percentage of incomplete sessions
      peakPerformanceTime: string; // time of day
    }
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    primaryRisks: string[];
    warningSignals: string[];
    interventionRecommendations: string[];
    monitoringMetrics: string[];
  } | null> {
    const systemPrompt = `You are a learning risk assessment specialist identifying potential barriers to qualification success.`;

    // Calculate risk indicators
    const recentScores = practiceHistory.slice(-5).map(p => p.score);
    const scoreTrend = this.calculateTrendSlope(recentScores);
    const completionRate = practiceHistory.filter(p => p.completed).length / practiceHistory.length * 100;
    
    const prompt = `Assess risk factors for learning success:

Performance Analysis:
- Strengths: ${userPerformance.strengths.join(', ')}
- Weaknesses: ${userPerformance.weaknesses.join(', ')}
- Confidence: ${userPerformance.confidenceScore}%
- Current difficulty level: ${userPerformance.difficultyLevel}

Recent Performance Trends:
- Score trend: ${scoreTrend > 0 ? 'Improving' : scoreTrend < 0 ? 'Declining' : 'Stable'} (${scoreTrend.toFixed(2)} points/session)
- Completion rate: ${completionRate.toFixed(1)}%
- Total practice sessions: ${practiceHistory.length}

Behavior Patterns:
- Study frequency: ${behaviorPatterns.studyFrequency} sessions/week
- Session length: ${behaviorPatterns.averageSessionLength} minutes
- Drop-off rate: ${behaviorPatterns.dropoffRate}%
- Peak performance: ${behaviorPatterns.peakPerformanceTime}

Identify risk factors including:
1. Performance decline patterns
2. Engagement and motivation issues  
3. Time management challenges
4. Knowledge gap concerns
5. Behavioral red flags
6. External pressure indicators

Assess overall risk level and provide specific monitoring recommendations.

Respond with JSON format including risk assessment and intervention strategies.`;

    try {
      const response = await openAIClient.generateStructuredResponse<{
        riskLevel: 'low' | 'medium' | 'high';
        primaryRisks: string[];
        warningSignals: string[];
        interventionRecommendations: string[];
        monitoringMetrics: string[];
      }>(
        prompt,
        {},
        { systemPrompt, temperature: 0.4 }
      );

      return response;
    } catch (error) {
      console.error('Error identifying risk factors:', error);
      return null;
    }
  }

  async generatePerformanceInsights(
    historicalData: Array<{
      date: Date;
      qualificationId: string;
      score: number;
      timeSpent: number;
      topics: string[];
      difficulty: string;
    }>,
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{
    trendAnalysis: string;
    strengthsEvolution: string[];
    improvementAreas: string[];
    performancePatterns: string[];
    predictiveInsights: string[];
    actionableRecommendations: string[];
  } | null> {
    const systemPrompt = `You are a performance analytics specialist providing deep insights into learning patterns and progress trends.`;

    const timeframes = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframes[timeframe]);
    
    const filteredData = historicalData.filter(d => d.date >= cutoffDate);

    const prompt = `Analyze performance data over the past ${timeframe}:

Performance Data (${filteredData.length} sessions):
${filteredData.slice(-20).map(d => 
  `${d.date.toISOString().split('T')[0]}: ${d.score}% on ${d.qualificationId} (${d.difficulty}, ${d.timeSpent}min)`
).join('\n')}

Data Summary:
- Total sessions: ${filteredData.length}
- Average score: ${(filteredData.reduce((sum, d) => sum + d.score, 0) / filteredData.length).toFixed(1)}%
- Total study time: ${(filteredData.reduce((sum, d) => sum + d.timeSpent, 0) / 60).toFixed(1)} hours
- Unique qualifications: ${[...new Set(filteredData.map(d => d.qualificationId))].length}

Provide comprehensive analysis including:
1. Overall performance trends and patterns
2. Evolution of strengths and capabilities
3. Persistent improvement areas
4. Learning efficiency patterns
5. Predictive insights for future performance
6. Specific, actionable recommendations

Focus on actionable insights that can drive better learning outcomes.

Respond with JSON format containing detailed analytical insights.`;

    try {
      const response = await openAIClient.generateStructuredResponse<{
        trendAnalysis: string;
        strengthsEvolution: string[];
        improvementAreas: string[];
        performancePatterns: string[];
        predictiveInsights: string[];
        actionableRecommendations: string[];
      }>(
        prompt,
        {},
        { systemPrompt, temperature: 0.5 }
      );

      return response;
    } catch (error) {
      console.error('Error generating performance insights:', error);
      return null;
    }
  }

  // Helper methods for statistical calculations
  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) {return 0;}
    
    const n = values.length;
    const xSum = (n - 1) * n / 2; // Sum of indices 0, 1, 2, ..., n-1
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + val * index, 0);
    const xSquaredSum = (n - 1) * n * (2 * n - 1) / 6; // Sum of squares of indices
    
    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    return slope;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) {return 0;}
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }
}

export const performancePredictionService = new PerformancePredictionService();