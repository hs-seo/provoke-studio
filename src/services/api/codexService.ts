import { invoke } from '@tauri-apps/api/core';

export interface CodexRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CodexResponse {
  text: string;
}

export class CodexService {
  // Check if Codex CLI is installed
  async isCodexInstalled(): Promise<boolean> {
    try {
      return await invoke<boolean>('check_codex_installed');
    } catch (error) {
      console.error('Failed to check Codex installation:', error);
      return false;
    }
  }

  // General Codex request
  async request(
    prompt: string,
    context?: string,
    maxTokens?: number,
    temperature?: number
  ): Promise<string> {
    try {
      return await invoke<string>('codex_request', {
        prompt,
        context,
        maxTokens,
        temperature,
      });
    } catch (error) {
      throw new Error(`Codex request failed: ${error}`);
    }
  }

  // Improve text
  async improveText(text: string): Promise<string> {
    try {
      return await invoke<string>('codex_improve_text', { text });
    } catch (error) {
      throw new Error(`Text improvement failed: ${error}`);
    }
  }

  // Continue story
  async continueStory(context: string): Promise<string> {
    try {
      return await invoke<string>('codex_continue_story', { context });
    } catch (error) {
      throw new Error(`Story continuation failed: ${error}`);
    }
  }

  // Analyze story
  async analyzeStory(text: string): Promise<string> {
    try {
      return await invoke<string>('codex_analyze_story', { text });
    } catch (error) {
      throw new Error(`Story analysis failed: ${error}`);
    }
  }

  // Generate text using Codex (compatible with AIServiceProxy interface)
  async generateText(request: CodexRequest): Promise<{ text: string; usage?: any }> {
    const text = await this.request(
      request.prompt,
      request.context,
      request.maxTokens,
      request.temperature
    );

    return { text };
  }
}

export const codexService = new CodexService();
