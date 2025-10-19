import { openAIClient } from './openai-client';
import { AdaptiveQuestionRequest, AIGeneratedQuestion } from './types';

export class AdaptiveQuestioningService {
  async generateAdaptiveQuestion(
    request: AdaptiveQuestionRequest
  ): Promise<AIGeneratedQuestion | null> {
    const systemPrompt = `You are an adaptive assessment specialist. Generate questions that dynamically adjust to user performance and learning needs.
    
    Principles:
    - If user is performing well (>80% recent accuracy), increase difficulty or introduce new concepts
    - If user is struggling (<60% recent accuracy), provide foundational questions or review concepts
    - If user is taking too long, simplify language or break down complex concepts
    - Always align with user strengths while addressing weaknesses`;

    // Calculate performance indicators
    const accuracyRate = request.recentPerformance.total > 0 
      ? (request.recentPerformance.correct / request.recentPerformance.total) * 100 
      : 50;

    const isPerformingWell = accuracyRate >= 80;
    const isStruggling = accuracyRate < 60;
    const isTakingTooLong = request.recentPerformance.avgTime > 300; // 5 minutes

    let difficultyAdjustment = request.currentDifficulty;
    let focusArea = 'general';

    // Determine difficulty adjustment
    if (isPerformingWell && !isTakingTooLong) {
      const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      const currentIndex = difficultyLevels.indexOf(request.currentDifficulty);
      if (currentIndex < difficultyLevels.length - 1) {
        difficultyAdjustment = difficultyLevels[currentIndex + 1] as any;
      }
    } else if (isStruggling) {
      const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      const currentIndex = difficultyLevels.indexOf(request.currentDifficulty);
      if (currentIndex > 0) {
        difficultyAdjustment = difficultyLevels[currentIndex - 1] as any;
      }
    }

    // Determine focus area
    if (request.userWeaknesses.length > 0) {
      focusArea = request.userWeaknesses[0]; // Focus on primary weakness
    } else if (request.userStrengths.length > 0) {
      focusArea = request.userStrengths[0]; // Build on strengths
    }

    const prompt = `Generate an adaptive question for the following context:

User Context:
- Topic: ${request.topicId}
- Current difficulty: ${request.currentDifficulty}
- Adjusted difficulty: ${difficultyAdjustment}
- Recent performance: ${accuracyRate.toFixed(1)}% accuracy (${request.recentPerformance.correct}/${request.recentPerformance.total})
- Average time per question: ${request.recentPerformance.avgTime} seconds
- User strengths: ${request.userStrengths.join(', ')}
- User weaknesses: ${request.userWeaknesses.join(', ')}
- Focus area: ${focusArea}

Performance Analysis:
${isPerformingWell ? '- User is performing well - challenge them with more complex concepts' : ''}
${isStruggling ? '- User is struggling - provide foundational review and clearer explanations' : ''}
${isTakingTooLong ? '- User is taking too long - simplify language and provide more direct questions' : ''}

Create a question that:
1. Adjusts difficulty appropriately based on performance
2. Focuses on the identified area (${focusArea})
3. ${isStruggling ? 'Reinforces basic concepts and builds confidence' : 'Challenges the user appropriately'}
4. ${isTakingTooLong ? 'Uses clear, concise language' : 'Can include more complex scenarios'}
5. Provides learning value regardless of whether answered correctly

Respond with JSON:
{
  "question": "Question text adapted to user needs",
  "type": "multiple-choice",
  "difficulty": "${difficultyAdjustment}",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "correct option text",
  "explanation": "Explanation that addresses common misconceptions and builds on this topic",
  "topics": ["${request.topicId}", "${focusArea}"],
  "estimatedTime": ${isTakingTooLong ? 2 : 3},
  "points": ${difficultyAdjustment === 'expert' ? 15 : difficultyAdjustment === 'advanced' ? 12 : difficultyAdjustment === 'intermediate' ? 10 : 8}
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<AIGeneratedQuestion>(
        prompt,
        {},
        { systemPrompt, temperature: 0.6 }
      );

      return response;
    } catch (error) {
      console.error('Error generating adaptive question:', error);
      return null;
    }
  }

  async adjustDifficultyBasedOnPerformance(
    currentDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    recentPerformance: {
      correct: number;
      total: number;
      avgTime: number;
      consecutiveCorrect: number;
      consecutiveIncorrect: number;
    }
  ): Promise<'beginner' | 'intermediate' | 'advanced' | 'expert'> {
    const accuracyRate = recentPerformance.total > 0 
      ? (recentPerformance.correct / recentPerformance.total) * 100 
      : 50;

    const difficultyLevels: Array<'beginner' | 'intermediate' | 'advanced' | 'expert'> = 
      ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);

    // Increase difficulty conditions
    if (recentPerformance.consecutiveCorrect >= 3 && accuracyRate >= 85) {
      if (currentIndex < difficultyLevels.length - 1) {
        return difficultyLevels[currentIndex + 1];
      }
    }

    // Decrease difficulty conditions
    if (recentPerformance.consecutiveIncorrect >= 2 || accuracyRate < 50) {
      if (currentIndex > 0) {
        return difficultyLevels[currentIndex - 1];
      }
    }

    // Gradual adjustments based on performance trends
    if (accuracyRate >= 80 && recentPerformance.avgTime < 120) { // Fast and accurate
      if (currentIndex < difficultyLevels.length - 1) {
        return difficultyLevels[currentIndex + 1];
      }
    }

    if (accuracyRate < 60 && recentPerformance.avgTime > 300) { // Slow and inaccurate
      if (currentIndex > 0) {
        return difficultyLevels[currentIndex - 1];
      }
    }

    return currentDifficulty; // No change needed
  }

  async generateFollowUpQuestion(
    originalQuestion: AIGeneratedQuestion,
    userAnswer: string,
    isCorrect: boolean,
    timeTaken: number
  ): Promise<AIGeneratedQuestion | null> {
    const systemPrompt = `You are an adaptive learning specialist. Generate follow-up questions that build on previous responses to deepen understanding.`;

    const prompt = `Generate a follow-up question based on the user's response to a previous question:

Original Question: ${originalQuestion.question}
Correct Answer: ${originalQuestion.correctAnswer}
User Answer: ${userAnswer}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
Time Taken: ${timeTaken} seconds
Question Topics: ${originalQuestion.topics.join(', ')}

Follow-up Strategy:
${isCorrect 
  ? 'User answered correctly - create a more challenging question that builds on this concept or explores related advanced topics'
  : 'User answered incorrectly - create a question that reinforces the fundamental concept with a different approach or simpler scenario'
}

Create a follow-up question that:
1. ${isCorrect ? 'Advances to the next level of complexity' : 'Reinforces the core concept'}
2. Maintains engagement and learning momentum
3. ${isCorrect ? 'Explores practical applications' : 'Provides another opportunity to master the concept'}
4. Relates to the original topic but approaches it differently

Respond with JSON in the same format as the original question.`;

    try {
      const response = await openAIClient.generateStructuredResponse<AIGeneratedQuestion>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response;
    } catch (error) {
      console.error('Error generating follow-up question:', error);
      return null;
    }
  }

  async optimizeQuestionSequence(
    topicId: string,
    userPerformanceHistory: Array<{
      questionId: string;
      topic: string;
      difficulty: string;
      isCorrect: boolean;
      timeTaken: number;
      date: Date;
    }>,
    targetLearningObjectives: string[]
  ): Promise<{
    recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    focusAreas: string[];
    questionStrategy: 'review' | 'advance' | 'mixed' | 'mastery-check';
    estimatedOptimalTime: number;
  } | null> {
    const systemPrompt = `You are a learning optimization specialist. Analyze user performance patterns to recommend optimal question sequencing strategies.`;

    const recentPerformance = userPerformanceHistory.slice(-10); // Last 10 questions
    const topicPerformance = userPerformanceHistory.filter(q => q.topic === topicId);

    const prompt = `Analyze the user's performance history and recommend an optimal questioning strategy:

Topic: ${topicId}
Target Learning Objectives: ${targetLearningObjectives.join(', ')}

Recent Performance (last 10 questions):
${recentPerformance.map(q => 
  `- ${q.topic} (${q.difficulty}): ${q.isCorrect ? 'Correct' : 'Incorrect'} in ${q.timeTaken}s`
).join('\n')}

Topic-Specific Performance:
${topicPerformance.map(q => 
  `- ${q.difficulty}: ${q.isCorrect ? 'Correct' : 'Incorrect'} in ${q.timeTaken}s on ${q.date.toISOString().split('T')[0]}`
).join('\n')}

Analyze patterns and recommend:
1. Optimal difficulty level for next questions
2. Areas that need more focus
3. Overall strategy (review, advance, mixed approach, or mastery check)
4. Estimated optimal time per question based on user patterns

Respond with JSON:
{
  "recommendedDifficulty": "beginner|intermediate|advanced|expert",
  "focusAreas": ["area1", "area2"],
  "questionStrategy": "review|advance|mixed|mastery-check",
  "estimatedOptimalTime": 180
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<{
        recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        focusAreas: string[];
        questionStrategy: 'review' | 'advance' | 'mixed' | 'mastery-check';
        estimatedOptimalTime: number;
      }>(
        prompt,
        {},
        { systemPrompt, temperature: 0.4 }
      );

      return response;
    } catch (error) {
      console.error('Error optimizing question sequence:', error);
      return null;
    }
  }
}

export const adaptiveQuestioningService = new AdaptiveQuestioningService();