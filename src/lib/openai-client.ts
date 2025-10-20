import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model configuration
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_TEMPERATURE = 0.7;

/**
 * Helper function to call OpenAI with structured JSON output
 */
export async function generateStructuredResponse<T>(
  systemPrompt: string,
  userPrompt: string,
  schema?: object,
  model: string = DEFAULT_MODEL,
  temperature: number = DEFAULT_TEMPERATURE
): Promise<T> {
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      response_format: schema ? { type: 'json_object' } : undefined,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as T;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to call OpenAI with text output
 */
export async function generateTextResponse(
  systemPrompt: string,
  userPrompt: string,
  model: string = DEFAULT_MODEL,
  temperature: number = DEFAULT_TEMPERATURE
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate OpenAI API key is configured
 */
export function validateOpenAIConfig(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
}
