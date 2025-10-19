import { openAIClient } from './openai-client';
import { UserPerformanceAnalysis, LearningPath, LearningPathTopic, LearningResource } from './types';

export class PersonalizedLearningService {
  async generateLearningPath(
    userId: string,
    targetQualification: string,
    userPerformance: UserPerformanceAnalysis,
    availableTime: number, // hours per week
    preferences: {
      learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
      pace: 'slow' | 'moderate' | 'fast';
      focusAreas?: string[];
    }
  ): Promise<LearningPath | null> {
    const systemPrompt = `You are an expert learning path designer for professional qualifications. 
    Create personalized, adaptive learning paths that optimize for individual learner needs and constraints.
    
    Consider:
    - User's current skill level and performance data
    - Time constraints and learning pace preferences
    - Learning style optimization
    - Prerequisite knowledge and skill gaps
    - Real-world application and practical relevance`;

    const prompt = `Create a personalized learning path for a user pursuing "${targetQualification}".

User Profile:
- Current strengths: ${userPerformance.strengths.join(', ')}
- Areas for improvement: ${userPerformance.weaknesses.join(', ')}
- Recommended topics: ${userPerformance.recommendedTopics.join(', ')}
- Difficulty level: ${userPerformance.difficultyLevel}
- Learning style: ${preferences.learningStyle}
- Confidence score: ${userPerformance.confidenceScore}/100
- Available time: ${availableTime} hours/week
- Preferred pace: ${preferences.pace}
${preferences.focusAreas ? `- Focus areas: ${preferences.focusAreas.join(', ')}` : ''}

Respond with a JSON object containing:
{
  "id": "generated-path-id",
  "title": "Personalized path title",
  "description": "Detailed description explaining why this path is optimal for the user",
  "estimatedDuration": 40,
  "difficulty": "intermediate",
  "prerequisites": ["prerequisite topics"],
  "topics": [
    {
      "id": "topic-1",
      "title": "Topic Title",
      "description": "Topic description",
      "estimatedTime": 180,
      "order": 1,
      "resources": [
        {
          "id": "resource-1",
          "title": "Resource Title",
          "type": "article",
          "estimatedTime": 30,
          "difficulty": "beginner"
        }
      ],
      "assessmentIds": ["assessment-1"]
    }
  ],
  "personalizedReasons": ["Reason 1 why this path suits the user", "Reason 2"]
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<LearningPath>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response;
    } catch (error) {
      console.error('Error generating learning path:', error);
      return null;
    }
  }

  async adaptLearningPath(
    currentPath: LearningPath,
    recentPerformance: {
      completedTopics: string[];
      avgScore: number;
      strugglingAreas: string[];
      timeSpent: number;
    },
    userFeedback?: {
      difficulty: 'too-easy' | 'appropriate' | 'too-hard';
      pace: 'too-slow' | 'appropriate' | 'too-fast';
      engagement: number; // 1-5
      comments?: string;
    }
  ): Promise<LearningPath | null> {
    const systemPrompt = `You are an adaptive learning specialist. Modify existing learning paths based on user performance and feedback to optimize learning outcomes.`;

    const prompt = `Adapt the following learning path based on user performance and feedback:

Current Learning Path:
${JSON.stringify(currentPath, null, 2)}

Recent Performance:
- Completed topics: ${recentPerformance.completedTopics.join(', ')}
- Average score: ${recentPerformance.avgScore}%
- Struggling areas: ${recentPerformance.strugglingAreas.join(', ')}
- Time spent: ${recentPerformance.timeSpent} hours

${userFeedback ? `User Feedback:
- Difficulty level: ${userFeedback.difficulty}
- Learning pace: ${userFeedback.pace}
- Engagement level: ${userFeedback.engagement}/5
${userFeedback.comments ? `- Comments: ${userFeedback.comments}` : ''}` : ''}

Adapt the learning path to:
1. Address struggling areas with additional resources or different approaches
2. Adjust difficulty and pacing based on performance and feedback
3. Add or modify topics based on identified gaps
4. Reorder topics if needed for better learning progression
5. Update time estimates based on actual performance

Respond with the updated learning path in the same JSON format.`;

    try {
      const response = await openAIClient.generateStructuredResponse<LearningPath>(
        prompt,
        {},
        { systemPrompt, temperature: 0.6 }
      );

      return response;
    } catch (error) {
      console.error('Error adapting learning path:', error);
      return null;
    }
  }

  async generateLearningResources(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading',
    timeAvailable: number // in minutes
  ): Promise<LearningResource[]> {
    const systemPrompt = `You are a learning resource curator specializing in professional development. 
    Create diverse, high-quality learning resources tailored to specific learning styles and time constraints.`;

    const stylePreferences = {
      visual: 'diagrams, infographics, videos, mind maps, flowcharts',
      auditory: 'podcasts, audio lectures, discussions, verbal explanations',
      kinesthetic: 'hands-on exercises, simulations, interactive tutorials, practice activities',
      reading: 'articles, documentation, case studies, written guides'
    };

    const prompt = `Generate learning resources for "${topic}" at ${difficulty} level, optimized for ${learningStyle} learners with ${timeAvailable} minutes available.

Preferred resource types for ${learningStyle} learners: ${stylePreferences[learningStyle]}

Create a mix of resources that:
1. Cater to the specified learning style
2. Fit within the available time constraint
3. Progress from basic concepts to practical application
4. Include both theoretical and practical elements
5. Are appropriate for ${difficulty} level learners

Respond with a JSON array of resources:
[
  {
    "id": "resource-1",
    "title": "Resource Title",
    "type": "article|video|tutorial|exercise|documentation",
    "content": "Brief description or outline of the resource content",
    "estimatedTime": 30,
    "difficulty": "${difficulty}"
  }
]`;

    try {
      const response = await openAIClient.generateStructuredResponse<LearningResource[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating learning resources:', error);
      return [];
    }
  }

  async analyzeUserPerformance(
    userId: string,
    assessmentHistory: Array<{
      qualificationId: string;
      topicId: string;
      score: number;
      timeSpent: number;
      difficulty: string;
      date: Date;
    }>,
    userProfile: {
      experienceLevel: string;
      background: string[];
      goals: string[];
    }
  ): Promise<UserPerformanceAnalysis | null> {
    const systemPrompt = `You are an expert learning analytics specialist. Analyze user performance data to provide insights and recommendations for personalized learning.`;

    const prompt = `Analyze the following user performance data and provide comprehensive insights:

User Profile:
- Experience level: ${userProfile.experienceLevel}
- Background: ${userProfile.background.join(', ')}
- Goals: ${userProfile.goals.join(', ')}

Assessment History:
${assessmentHistory.map(assessment => 
  `- ${assessment.qualificationId}/${assessment.topicId}: ${assessment.score}% (${assessment.timeSpent}min, ${assessment.difficulty}) on ${assessment.date.toISOString().split('T')[0]}`
).join('\n')}

Provide analysis in JSON format:
{
  "userId": "${userId}",
  "strengths": ["area1", "area2"],
  "weaknesses": ["area1", "area2"],
  "recommendedTopics": ["topic1", "topic2"],
  "difficultyLevel": "beginner|intermediate|advanced|expert",
  "learningStyle": "visual|auditory|kinesthetic|reading",
  "confidenceScore": 75,
  "predictedSuccessRate": 85
}

Base your analysis on:
1. Performance trends across different topics
2. Time efficiency patterns
3. Difficulty level performance
4. Learning progression over time
5. Consistency of performance`;

    try {
      const response = await openAIClient.generateStructuredResponse<UserPerformanceAnalysis>(
        prompt,
        {},
        { systemPrompt, temperature: 0.5 }
      );

      return response;
    } catch (error) {
      console.error('Error analyzing user performance:', error);
      return null;
    }
  }
}

export const personalizedLearningService = new PersonalizedLearningService();