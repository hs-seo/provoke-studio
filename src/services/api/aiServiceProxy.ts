import { authService } from './authService';
import { codexService } from './codexService';
import { AIRequest, AIResponse, ImageRequest, ImageResponse } from '../../types';

export class AIServiceProxy {
  private codexAvailable: boolean | null = null;

  async generateText(request: AIRequest): Promise<AIResponse> {
    // Check if Codex is available (cache the result)
    if (this.codexAvailable === null) {
      this.codexAvailable = await codexService.isCodexInstalled();
      console.log('Codex available:', this.codexAvailable);
    }

    // Prefer Codex if available
    if (this.codexAvailable) {
      console.log('Using Codex CLI for AI request');
      return await codexService.generateText(request);
    }

    // Fallback to configured provider
    const provider = localStorage.getItem('ai_provider') || 'github';

    if (provider === 'anthropic') {
      return await this.callAnthropicAPI(request);
    } else if (provider === 'openai') {
      return await this.callOpenAIAPI(request);
    } else if (provider === 'openai-oauth' || provider === 'github') {
      // Use backend for both GitHub Models and OpenAI OAuth
      // Backend will automatically route to the correct provider based on user's auth
      return await authService.makeAIRequest(
        request.prompt,
        request.context,
        request.maxTokens,
        request.temperature
      );
    } else {
      // Default to GitHub Models
      return await authService.makeAIRequest(
        request.prompt,
        request.context,
        request.maxTokens,
        request.temperature
      );
    }
  }

  private async callAnthropicAPI(request: AIRequest): Promise<AIResponse> {
    const apiKey = localStorage.getItem('anthropic_api_key');
    if (!apiKey) {
      throw new Error('Anthropic API Key가 설정되지 않았습니다. 설정 탭에서 API Key를 입력해주세요.');
    }

    const prompt = request.context
      ? `${request.context}\n\n${request.prompt}`
      : request.prompt;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API 오류');
    }

    const data = await response.json();
    return {
      text: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  private async callOpenAIAPI(request: AIRequest): Promise<AIResponse> {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      throw new Error('OpenAI API Key가 설정되지 않았습니다. 설정 탭에서 API Key를 입력해주세요.');
    }

    const prompt = request.context
      ? `${request.context}\n\n${request.prompt}`
      : request.prompt;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API 오류');
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
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

  async generateImage(request: ImageRequest): Promise<ImageResponse> {
    // Image generation using OpenAI DALL-E 3
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      throw new Error('이미지 생성을 위해서는 OpenAI API Key가 필요합니다.\n설정 탭에서 OpenAI API Key를 입력해주세요.');
    }

    console.log('🎨 DALL-E 3 이미지 생성 요청:', request.prompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style || 'vivid',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'DALL-E 이미지 생성 오류');
    }

    const data = await response.json();
    return {
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt,
    };
  }
}

// Export singleton instance (now provider-agnostic)
export const claudeServiceProxy = new AIServiceProxy();
export const openaiServiceProxy = new AIServiceProxy(); // Same instance, kept for compatibility
