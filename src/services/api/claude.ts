import Anthropic from '@anthropic-ai/sdk';
import { AIRequest, AIResponse } from '../../types';

export class ClaudeService {
  private client: Anthropic | null = null;
  private _apiKey: string = '';

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(apiKey: string) {
    this._apiKey = apiKey;
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // For Tauri apps
    });
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Claude API key not set');
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: request.context
              ? `${request.context}\n\n${request.prompt}`
              : request.prompt,
          },
        ],
      });

      const textContent = response.content.find(c => c.type === 'text');

      return {
        text: textContent?.type === 'text' ? textContent.text : '',
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  // Helper methods for writing tasks
  async improveText(text: string): Promise<string> {
    const response = await this.generateText({
      prompt: `다음 텍스트를 더 나은 문장으로 개선해주세요. 원래의 의미와 톤은 유지하되, 문법과 표현을 향상시켜주세요:\n\n${text}`,
      maxTokens: 1024,
    });
    return response.text;
  }

  async continueStory(context: string): Promise<string> {
    const response = await this.generateText({
      prompt: '이야기를 자연스럽게 이어서 작성해주세요.',
      context: context,
      maxTokens: 2048,
      temperature: 0.8,
    });
    return response.text;
  }

  async generateCharacter(description: string): Promise<string> {
    const response = await this.generateText({
      prompt: `다음 설명을 바탕으로 캐릭터의 상세한 프로필을 작성해주세요 (이름, 나이, 성격, 배경 등):\n\n${description}`,
      maxTokens: 1024,
    });
    return response.text;
  }

  async generatePlotIdeas(premise: string): Promise<string> {
    const response = await this.generateText({
      prompt: `다음 전제를 바탕으로 5개의 플롯 아이디어를 제안해주세요:\n\n${premise}`,
      maxTokens: 1536,
      temperature: 0.9,
    });
    return response.text;
  }
}
