import OpenAI from 'openai';

class OpenAIClient {
  private client: OpenAI | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  }

  async generateCompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<string | null> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      });

      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('OpenAI completion error:', error);
      throw error;
    }
  }

  async generateStructuredResponse<T>(
    prompt: string,
    schema: any,
    options: {
      model?: string;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<T | null> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: messages,
        temperature: options.temperature || 0.7,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return null;

      return JSON.parse(content) as T;
    } catch (error) {
      console.error('OpenAI structured response error:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0]?.embedding || null;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.client !== null;
  }
}

export const openAIClient = new OpenAIClient();