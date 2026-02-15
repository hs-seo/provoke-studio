import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider } from '../types';
import { ClaudeService } from '../services/api/claude';
import { OpenAIService } from '../services/api/openai';

interface AIState {
  provider: AIProvider;
  apiKey: string;
  claudeService: ClaudeService;
  openaiService: OpenAIService;

  setProvider: (provider: AIProvider) => void;
  setApiKey: (apiKey: string) => void;
  isConfigured: () => boolean;
  getCurrentService: () => ClaudeService | OpenAIService;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      provider: 'claude',
      apiKey: '',
      claudeService: new ClaudeService(),
      openaiService: new OpenAIService(),

      setProvider: (provider) => set({ provider }),

      setApiKey: (apiKey) => {
        const { provider, claudeService, openaiService } = get();

        if (provider === 'claude') {
          claudeService.setApiKey(apiKey);
        } else {
          openaiService.setApiKey(apiKey);
        }

        set({ apiKey });
      },

      isConfigured: () => {
        const { apiKey } = get();
        return apiKey.length > 0;
      },

      getCurrentService: () => {
        const { provider, claudeService, openaiService } = get();
        return provider === 'claude' ? claudeService : openaiService;
      },
    }),
    {
      name: 'provoke-studio-ai',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
      }),
    }
  )
);
