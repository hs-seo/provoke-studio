import OpenAI from 'openai';
import { AIRequest, AIResponse } from '../../types';

export class OpenAIService {
  private client: OpenAI | null = null;
  private _apiKey: string = '';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(apiKey: string) {
    this._apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // For Tauri apps
    });
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not set');
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (request.context) {
        messages.push({
          role: 'system',
          content: request.context,
        });
      }

      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.7,
      });

      return {
        text: response.choices[0]?.message?.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  // Helper methods for writing tasks
  async improveText(text: string): Promise<string> {
    const response = await this.generateText({
      prompt: `Improve the following text while maintaining its original meaning and tone:\n\n${text}`,
      maxTokens: 1024,
    });
    return response.text;
  }

  async continueStory(context: string): Promise<string> {
    const response = await this.generateText({
      prompt: 'Continue the story naturally.',
      context: context,
      maxTokens: 2048,
      temperature: 0.8,
    });
    return response.text;
  }

  async generateCharacter(description: string): Promise<string> {
    const response = await this.generateText({
      prompt: `Create a detailed character profile based on this description (name, age, personality, background, etc.):\n\n${description}`,
      maxTokens: 1024,
    });
    return response.text;
  }

  async generatePlotIdeas(premise: string): Promise<string> {
    const response = await this.generateText({
      prompt: `Generate 5 plot ideas based on this premise:\n\n${premise}`,
      maxTokens: 1536,
      temperature: 0.9,
    });
    return response.text;
  }
}
