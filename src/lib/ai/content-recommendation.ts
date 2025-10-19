import { openAIClient } from './openai-client';
import { ContentRecommendation, UserPerformanceAnalysis } from './types';

export class ContentRecommendationService {
  async generateQualificationRecommendations(
    userProfile: {
      currentSkills: string[];
      interests: string[];
      careerGoals: string[];
      experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'expert';
      timeAvailable: number; // hours per week
      completedQualifications: string[];
    },
    performanceAnalysis: UserPerformanceAnalysis
  ): Promise<ContentRecommendation[]> {
    const systemPrompt = `You are a career development and qualification specialist. 
    Recommend relevant professional qualifications that align with user goals, skills, and performance patterns.`;

    const prompt = `Recommend qualifications for a user with the following profile:

User Profile:
- Current skills: ${userProfile.currentSkills.join(', ')}
- Interests: ${userProfile.interests.join(', ')}
- Career goals: ${userProfile.careerGoals.join(', ')}
- Experience level: ${userProfile.experienceLevel}
- Available study time: ${userProfile.timeAvailable} hours/week
- Completed qualifications: ${userProfile.completedQualifications.join(', ')}

Performance Analysis:
- Strengths: ${performanceAnalysis.strengths.join(', ')}
- Areas for improvement: ${performanceAnalysis.weaknesses.join(', ')}
- Difficulty level: ${performanceAnalysis.difficultyLevel}
- Confidence score: ${performanceAnalysis.confidenceScore}/100

Recommend 5-7 qualifications that:
1. Build on existing strengths while addressing skill gaps
2. Align with career goals and interests
3. Are appropriate for the user's experience level
4. Can be completed within available time constraints
5. Provide clear career advancement value
6. Progress logically from current skill level

Respond with JSON array:
[
  {
    "type": "qualification",
    "title": "Qualification Title",
    "description": "Detailed description of the qualification and its benefits",
    "relevanceScore": 95,
    "reasoning": "Why this qualification is recommended for this user",
    "estimatedTime": 40,
    "difficulty": "intermediate"
  }
]`;

    try {
      const response = await openAIClient.generateStructuredResponse<ContentRecommendation[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.6 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating qualification recommendations:', error);
      return [];
    }
  }

  async generateTopicRecommendations(
    currentQualification: string,
    userPerformance: {
      strongTopics: string[];
      weakTopics: string[];
      recentScores: { [topic: string]: number };
    },
    learningObjectives: string[]
  ): Promise<ContentRecommendation[]> {
    const systemPrompt = `You are a learning path optimization specialist. 
    Recommend specific topics and study areas to maximize learning efficiency and qualification success.`;

    const prompt = `Recommend study topics for a user pursuing "${currentQualification}":

Current Performance:
- Strong topics: ${userPerformance.strongTopics.join(', ')}
- Weak topics: ${userPerformance.weakTopics.join(', ')}
- Recent scores: ${Object.entries(userPerformance.recentScores).map(([topic, score]) => `${topic}: ${score}%`).join(', ')}

Learning Objectives:
${learningObjectives.join('\n- ')}

Recommend topics that:
1. Address the weakest areas first for foundational improvement
2. Build on strong areas for advanced mastery
3. Fill critical knowledge gaps for qualification success
4. Provide the highest learning impact per time invested
5. Create logical learning progression

Include both review topics and new concepts. Prioritize based on impact and user needs.

Respond with JSON array of topic recommendations.`;

    try {
      const response = await openAIClient.generateStructuredResponse<ContentRecommendation[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.5 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating topic recommendations:', error);
      return [];
    }
  }

  async generateStudyResourceRecommendations(
    topic: string,
    userLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading',
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    timeConstraints: {
      dailyTime: number; // minutes per day
      preferredSessionLength: number; // minutes per session
      totalTimeAvailable: number; // total hours for this topic
    }
  ): Promise<ContentRecommendation[]> {
    const systemPrompt = `You are a learning resource specialist curating personalized study materials and resources.`;

    const learningStylePreferences = {
      visual: 'videos, infographics, diagrams, mind maps, flowcharts, visual tutorials',
      auditory: 'podcasts, audio lectures, webinars, discussion groups, verbal explanations',
      kinesthetic: 'hands-on exercises, simulations, labs, interactive tutorials, practice projects',
      reading: 'articles, books, documentation, case studies, written guides, research papers'
    };

    const prompt = `Recommend study resources for "${topic}" optimized for a ${userLearningStyle} learner:

Learning Preferences: ${learningStylePreferences[userLearningStyle]}
Difficulty Level: ${difficultyLevel}
Time Constraints:
- Daily available time: ${timeConstraints.dailyTime} minutes
- Preferred session length: ${timeConstraints.preferredSessionLength} minutes
- Total time for topic: ${timeConstraints.totalTimeAvailable} hours

Recommend diverse resources that:
1. Match the user's learning style preference
2. Fit within time constraints
3. Progress from foundational to advanced concepts
4. Include both theoretical and practical elements
5. Provide measurable learning outcomes
6. Are from reputable, high-quality sources

Include a mix of free and premium resources, with priority on effectiveness for this learning style.

Respond with JSON array of resource recommendations including specific resource types, estimated completion times, and clear value propositions.`;

    try {
      const response = await openAIClient.generateStructuredResponse<ContentRecommendation[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating resource recommendations:', error);
      return [];
    }
  }

  async generatePracticeRecommendations(
    userPerformance: {
      currentScore: number;
      targetScore: number;
      weakAreas: string[];
      timeUntilExam?: number; // days
    },
    practiceHistory: {
      totalPracticeHours: number;
      averageScore: number;
      improvementRate: number; // score improvement per week
    }
  ): Promise<ContentRecommendation[]> {
    const systemPrompt = `You are a test preparation specialist creating targeted practice recommendations to maximize score improvement.`;

    const scoreGap = userPerformance.targetScore - userPerformance.currentScore;
    const timeConstraint = userPerformance.timeUntilExam ? `with ${userPerformance.timeUntilExam} days until exam` : '';

    const prompt = `Create practice recommendations for score improvement:

Current Situation:
- Current score: ${userPerformance.currentScore}%
- Target score: ${userPerformance.targetScore}%
- Score gap: ${scoreGap} points
- Weak areas: ${userPerformance.weakAreas.join(', ')}
${timeConstraint}

Practice History:
- Total practice time: ${practiceHistory.totalPracticeHours} hours
- Average practice score: ${practiceHistory.averageScore}%
- Weekly improvement rate: ${practiceHistory.improvementRate} points

Recommend practice activities that:
1. Target the highest-impact areas for score improvement
2. ${userPerformance.timeUntilExam ? 'Are optimized for the available time remaining' : 'Provide sustainable long-term improvement'}
3. Address weak areas with focused practice
4. Include both practice tests and targeted skill drills
5. Build confidence and test-taking strategies
6. ${scoreGap > 20 ? 'Focus on fundamental concept mastery' : 'Fine-tune existing knowledge'}

Provide specific practice schedules, question types, and success metrics.

Respond with JSON array of practice recommendations.`;

    try {
      const response = await openAIClient.generateStructuredResponse<ContentRecommendation[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.6 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating practice recommendations:', error);
      return [];
    }
  }

  async generatePersonalizedContent(
    userId: string,
    userInterests: string[],
    learningHistory: Array<{
      contentType: string;
      topic: string;
      rating: number; // 1-5
      completionTime: number;
      difficulty: string;
    }>,
    currentGoals: string[]
  ): Promise<ContentRecommendation[]> {
    const systemPrompt = `You are a personalization engine creating highly relevant content recommendations based on user behavior and preferences.`;

    // Analyze user preferences from history
    const preferredTypes = learningHistory
      .filter(item => item.rating >= 4)
      .map(item => item.contentType);
    
    const preferredDifficulty = learningHistory
      .reduce((acc, item) => {
        acc[item.difficulty] = (acc[item.difficulty] || 0) + item.rating;
        return acc;
      }, {} as Record<string, number>);

    const prompt = `Generate personalized content recommendations for user ${userId}:

User Profile:
- Interests: ${userInterests.join(', ')}
- Current goals: ${currentGoals.join(', ')}
- Preferred content types: ${[...new Set(preferredTypes)].join(', ')}
- Learning history: ${learningHistory.length} completed items, average rating: ${(learningHistory.reduce((sum, item) => sum + item.rating, 0) / learningHistory.length).toFixed(1)}/5

Performance Patterns:
- Highly rated content types: ${Object.entries(preferredDifficulty).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, score]) => `${type} (${score})`).join(', ')}
- Average completion time: ${Math.round(learningHistory.reduce((sum, item) => sum + item.completionTime, 0) / learningHistory.length)} minutes

Create recommendations that:
1. Align with demonstrated preferences and interests
2. Support current learning goals
3. Match preferred content formats and difficulty levels
4. Introduce new topics that complement existing interests
5. Provide optimal challenge level based on history
6. Consider typical engagement patterns and time preferences

Respond with JSON array of personalized content recommendations.`;

    try {
      const response = await openAIClient.generateStructuredResponse<ContentRecommendation[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.6 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating personalized content:', error);
      return [];
    }
  }

  async generateContentBasedOnTrends(
    industryTrends: string[],
    userSkills: string[],
    marketDemand: { [skill: string]: number }, // 1-100 demand score
    futureProjections: string[]
  ): Promise<ContentRecommendation[]> {
    const systemPrompt = `You are a market intelligence specialist recommending learning content based on industry trends and future skill demands.`;

    const prompt = `Recommend content based on current market trends and future projections:

Industry Trends:
${industryTrends.join('\n- ')}

User's Current Skills:
${userSkills.join(', ')}

Market Demand (1-100 scale):
${Object.entries(marketDemand).map(([skill, demand]) => `${skill}: ${demand}`).join(', ')}

Future Projections:
${futureProjections.join('\n- ')}

Recommend content that:
1. Positions the user for high-demand, future-relevant skills
2. Builds on existing skills to create valuable skill combinations
3. Addresses emerging trends and technologies
4. Provides competitive advantage in the job market
5. Balances immediate value with long-term career prospects
6. Considers industry transformation and automation impact

Focus on skills and qualifications that will be most valuable in the next 2-5 years.

Respond with JSON array of trend-based content recommendations.`;

    try {
      const response = await openAIClient.generateStructuredResponse<ContentRecommendation[]>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response || [];
    } catch (error) {
      console.error('Error generating trend-based recommendations:', error);
      return [];
    }
  }
}

export const contentRecommendationService = new ContentRecommendationService();