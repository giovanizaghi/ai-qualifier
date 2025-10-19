import { openAIClient } from './openai-client';
import { 
  AIGeneratedQuestion, 
  UserPerformanceAnalysis, 
  AdaptiveQuestionRequest,
  TutorHint,
  ContentRecommendation,
  PerformancePrediction,
  LearningPath
} from './types';

export class AIContentGenerator {
  async generateQuestion(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay',
    context?: string
  ): Promise<AIGeneratedQuestion | null> {
    const systemPrompt = `You are an expert AI assessment creator. Generate high-quality, accurate questions for professional qualifications. 
    
Guidelines:
- Create questions that test practical knowledge and real-world application
- Ensure questions are clear, unambiguous, and professionally relevant
- For multiple choice, provide 4 options with only one correct answer
- Include detailed explanations that help learners understand the concept
- Questions should be appropriate for ${difficulty} level learners
- Focus on ${topic} subject matter`;

    const prompt = `Create a ${questionType} question about "${topic}" at ${difficulty} difficulty level.
    ${context ? `Additional context: ${context}` : ''}
    
    Respond with a JSON object containing:
    {
      "question": "The question text",
      "type": "${questionType}",
      "difficulty": "${difficulty}",
      ${questionType === 'multiple-choice' ? '"options": ["option1", "option2", "option3", "option4"],' : ''}
      "correctAnswer": "The correct answer${questionType === 'multiple-choice' ? ' (option text, not letter)' : ''}",
      "explanation": "Detailed explanation of why this is correct and learning points",
      "topics": ["primary topic", "secondary topics"],
      "estimatedTime": 2,
      "points": 10
    }`;

    try {
      const response = await openAIClient.generateStructuredResponse<AIGeneratedQuestion>(
        prompt,
        {},
        { systemPrompt, temperature: 0.8 }
      );

      return response;
    } catch (error) {
      console.error('Error generating question:', error);
      return null;
    }
  }

  async generateMultipleQuestions(
    topic: string,
    count: number,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    questionTypes?: Array<'multiple-choice' | 'true-false' | 'short-answer' | 'essay'>
  ): Promise<AIGeneratedQuestion[]> {
    const types = questionTypes || ['multiple-choice', 'true-false', 'short-answer'];
    const questions: AIGeneratedQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const questionType = types[i % types.length];
      const question = await this.generateQuestion(topic, difficulty, questionType);
      
      if (question) {
        questions.push(question);
      }

      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return questions;
  }

  async generateLearningContent(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    contentType: 'explanation' | 'tutorial' | 'summary' | 'example'
  ): Promise<string | null> {
    const systemPrompt = `You are an expert educator creating learning content for professional qualification courses. 
    Create clear, engaging, and accurate educational content that helps learners master complex topics.`;

    const contentPrompts = {
      explanation: `Provide a comprehensive explanation of "${topic}" suitable for ${difficulty} level learners. Include key concepts, important details, and practical applications.`,
      tutorial: `Create a step-by-step tutorial for "${topic}" at ${difficulty} level. Include practical examples and actionable steps.`,
      summary: `Create a concise but comprehensive summary of "${topic}" for ${difficulty} level learners. Highlight the most important points.`,
      example: `Provide detailed real-world examples demonstrating "${topic}" concepts at ${difficulty} level. Include multiple scenarios if relevant.`
    };

    try {
      const content = await openAIClient.generateCompletion(
        contentPrompts[contentType],
        { systemPrompt, temperature: 0.7, maxTokens: 1500 }
      );

      return content;
    } catch (error) {
      console.error('Error generating learning content:', error);
      return null;
    }
  }

  async enhanceExistingContent(
    originalContent: string,
    enhancementType: 'simplify' | 'expand' | 'add-examples' | 'improve-clarity'
  ): Promise<string | null> {
    const systemPrompt = `You are an expert content editor specializing in educational materials. 
    Enhance the given content while maintaining accuracy and educational value.`;

    const enhancementPrompts = {
      simplify: `Simplify the following content to make it more accessible to beginners while maintaining all key information:\n\n${originalContent}`,
      expand: `Expand the following content with additional details, examples, and practical applications:\n\n${originalContent}`,
      'add-examples': `Add relevant, practical examples to illustrate the concepts in the following content:\n\n${originalContent}`,
      'improve-clarity': `Improve the clarity and readability of the following content while maintaining all information:\n\n${originalContent}`
    };

    try {
      const enhancedContent = await openAIClient.generateCompletion(
        enhancementPrompts[enhancementType],
        { systemPrompt, temperature: 0.6, maxTokens: 2000 }
      );

      return enhancedContent;
    } catch (error) {
      console.error('Error enhancing content:', error);
      return null;
    }
  }
}

export const aiContentGenerator = new AIContentGenerator();