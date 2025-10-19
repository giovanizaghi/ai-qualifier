import { openAIClient } from './openai-client';
import { TutorHint } from './types';

export class IntelligentTutoringService {
  async generateHint(
    question: string,
    userContext: {
      previousAttempts?: string[];
      timeSpent: number;
      difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      knownWeaknesses?: string[];
      learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    },
    hintLevel: 'subtle' | 'moderate' | 'explicit' = 'moderate'
  ): Promise<TutorHint | null> {
    const systemPrompt = `You are an intelligent tutoring system providing personalized learning assistance. 
    Your role is to guide users toward the correct answer without directly giving it away, promoting discovery and understanding.
    
    Hint Guidelines:
    - Subtle: Gentle nudges, thought-provoking questions, or general direction
    - Moderate: More specific guidance, key concepts, or problem-solving approach
    - Explicit: Step-by-step breakdown, clear explanations, but still requiring user to make the final connection
    
    Always encourage learning and build confidence while addressing the user's specific needs.`;

    const hintStrategies = {
      subtle: 'Provide a gentle nudge or thought-provoking question that guides thinking without revealing the answer',
      moderate: 'Give specific guidance about key concepts or problem-solving approach needed',
      explicit: 'Provide step-by-step breakdown while still requiring the user to make the final connection'
    };

    const learningStyleAdaptations = {
      visual: 'Use visual metaphors, suggest drawing diagrams, or describe visual representations',
      auditory: 'Use verbal explanations, suggest reading aloud, or provide audio-friendly descriptions',
      kinesthetic: 'Suggest hands-on approaches, physical analogies, or interactive methods',
      reading: 'Provide written explanations, suggest additional reading, or use text-based analogies'
    };

    const prompt = `Provide a ${hintLevel} hint for this question:

Question: ${question}

User Context:
- Difficulty level: ${userContext.difficultyLevel}
- Time spent so far: ${userContext.timeSpent} seconds
${userContext.previousAttempts ? `- Previous attempts: ${userContext.previousAttempts.join(', ')}` : ''}
${userContext.knownWeaknesses ? `- Known weak areas: ${userContext.knownWeaknesses.join(', ')}` : ''}
${userContext.learningStyle ? `- Learning style: ${userContext.learningStyle}` : ''}

Hint Strategy: ${hintStrategies[hintLevel]}
${userContext.learningStyle ? `Learning Style Adaptation: ${learningStyleAdaptations[userContext.learningStyle]}` : ''}

Create a hint that:
1. Guides without revealing the answer
2. ${userContext.timeSpent > 300 ? 'Addresses potential confusion due to time spent' : 'Maintains appropriate challenge level'}
3. ${userContext.learningStyle ? `Adapts to ${userContext.learningStyle} learning preferences` : 'Uses clear, accessible language'}
4. Builds confidence and encourages continued learning
5. ${userContext.knownWeaknesses ? 'Considers known weak areas' : 'Provides general guidance'}

Respond with JSON:
{
  "type": "hint",
  "content": "Your hint content here",
  "difficulty": "basic|detailed|comprehensive",
  "followUpQuestions": ["Optional follow-up questions to deepen understanding"]
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<TutorHint>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response;
    } catch (error) {
      console.error('Error generating hint:', error);
      return null;
    }
  }

  async generateExplanation(
    question: string,
    correctAnswer: string,
    userAnswer: string,
    isCorrect: boolean,
    context: {
      difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      topics: string[];
      learningObjectives?: string[];
      commonMisconceptions?: string[];
    }
  ): Promise<TutorHint | null> {
    const systemPrompt = `You are an expert educator providing detailed explanations that promote deep understanding. 
    Focus on not just what the correct answer is, but why it's correct and how to approach similar problems in the future.`;

    const prompt = `Provide a comprehensive explanation for this question and answer:

Question: ${question}
Correct Answer: ${correctAnswer}
User's Answer: ${userAnswer}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}

Context:
- Difficulty: ${context.difficultyLevel}
- Topics: ${context.topics.join(', ')}
${context.learningObjectives ? `- Learning objectives: ${context.learningObjectives.join(', ')}` : ''}
${context.commonMisconceptions ? `- Common misconceptions: ${context.commonMisconceptions.join(', ')}` : ''}

Create an explanation that:
1. ${isCorrect ? 'Reinforces why the answer is correct and extends understanding' : 'Explains why the user\'s answer is incorrect and guides to the correct reasoning'}
2. Addresses the underlying concepts and principles
3. ${context.commonMisconceptions ? 'Clarifies common misconceptions in this topic area' : 'Prevents common mistakes'}
4. Provides strategies for approaching similar questions
5. Connects to broader learning objectives
6. Encourages continued learning and curiosity

Respond with JSON:
{
  "type": "explanation",
  "content": "Detailed explanation content",
  "difficulty": "comprehensive",
  "followUpQuestions": ["Questions to deepen understanding of this concept"]
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<TutorHint>(
        prompt,
        {},
        { systemPrompt, temperature: 0.6 }
      );

      return response;
    } catch (error) {
      console.error('Error generating explanation:', error);
      return null;
    }
  }

  async generateWorkThroughExample(
    concept: string,
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    realWorldContext?: string
  ): Promise<TutorHint | null> {
    const systemPrompt = `You are an expert tutor creating step-by-step examples that demonstrate concepts in action. 
    Make complex ideas accessible through clear, practical examples.`;

    const prompt = `Create a detailed step-by-step example demonstrating "${concept}" at ${difficultyLevel} level.

${realWorldContext ? `Real-world context: ${realWorldContext}` : ''}

Requirements:
1. Start with a realistic scenario or problem
2. Break down the solution into clear, logical steps
3. Explain the reasoning behind each step
4. Highlight key concepts and principles being applied
5. ${difficultyLevel === 'beginner' ? 'Use simple language and basic examples' : ''}
6. ${difficultyLevel === 'expert' ? 'Include advanced considerations and edge cases' : ''}
7. Connect to practical applications
8. End with a summary of key takeaways

Structure as a comprehensive tutorial that users can follow along with.

Respond with JSON:
{
  "type": "step-by-step",
  "content": "Detailed step-by-step example with clear explanations",
  "difficulty": "comprehensive",
  "followUpQuestions": ["Questions to test understanding of the demonstrated concept"]
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<TutorHint>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response;
    } catch (error) {
      console.error('Error generating work-through example:', error);
      return null;
    }
  }

  async provideLearningGuidance(
    userStrengths: string[],
    userWeaknesses: string[],
    currentTopic: string,
    learningGoals: string[],
    availableStudyTime: number // in hours per week
  ): Promise<{
    studyPlan: string;
    priorityAreas: string[];
    recommendedApproach: string;
    timeAllocation: { [area: string]: number };
    motivationalMessage: string;
  } | null> {
    const systemPrompt = `You are a personal learning coach providing customized study guidance and motivation for professional development.`;

    const prompt = `Create personalized learning guidance for a user studying "${currentTopic}":

User Profile:
- Strengths: ${userStrengths.join(', ')}
- Areas for improvement: ${userWeaknesses.join(', ')}
- Learning goals: ${learningGoals.join(', ')}
- Available study time: ${availableStudyTime} hours/week

Provide comprehensive guidance including:
1. A structured study plan leveraging strengths and addressing weaknesses
2. Priority areas to focus on first
3. Recommended learning approach and strategies
4. Time allocation across different areas
5. Motivational message tailored to their situation

Respond with JSON:
{
  "studyPlan": "Detailed study plan with specific recommendations",
  "priorityAreas": ["area1", "area2", "area3"],
  "recommendedApproach": "Specific learning strategies and methods",
  "timeAllocation": {
    "weakness_area_1": 3,
    "strength_building": 2,
    "practice_tests": 1.5
  },
  "motivationalMessage": "Encouraging and personalized motivational message"
}`;

    try {
      const response = await openAIClient.generateStructuredResponse<{
        studyPlan: string;
        priorityAreas: string[];
        recommendedApproach: string;
        timeAllocation: { [area: string]: number };
        motivationalMessage: string;
      }>(
        prompt,
        {},
        { systemPrompt, temperature: 0.7 }
      );

      return response;
    } catch (error) {
      console.error('Error generating learning guidance:', error);
      return null;
    }
  }

  async generateProgressiveHints(
    question: string,
    correctAnswer: string,
    userAttempts: string[],
    maxHints: number = 3
  ): Promise<TutorHint[]> {
    const hints: TutorHint[] = [];
    const hintLevels: Array<'subtle' | 'moderate' | 'explicit'> = ['subtle', 'moderate', 'explicit'];
    
    for (let i = 0; i < Math.min(maxHints, hintLevels.length); i++) {
      const hintLevel = hintLevels[i];
      const previousHints = hints.map(h => h.content);
      
      const systemPrompt = `You are providing the ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} hint in a progressive sequence. 
      Each hint should build on previous ones while maintaining the appropriate difficulty level.`;

      const prompt = `Generate a ${hintLevel} hint for this question (hint ${i + 1} of ${maxHints}):

Question: ${question}
Correct Answer: ${correctAnswer}
User Attempts: ${userAttempts.join(', ')}
Previous Hints: ${previousHints.join(' | ')}

This hint should:
1. Be more specific than previous hints
2. ${i === maxHints - 1 ? 'Be explicit enough to guide to the answer without giving it away' : 'Build toward the solution progressively'}
3. Not repeat information from earlier hints
4. Maintain educational value

Respond with JSON format for the hint.`;

      try {
        const hint = await openAIClient.generateStructuredResponse<TutorHint>(
          prompt,
          {},
          { systemPrompt, temperature: 0.6 }
        );

        if (hint) {
          hints.push(hint);
        }

        // Add delay between API calls
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error generating hint ${i + 1}:`, error);
        break;
      }
    }

    return hints;
  }
}

export const intelligentTutoringService = new IntelligentTutoringService();