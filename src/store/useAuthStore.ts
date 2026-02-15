import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, UserProfile } from '../services/api/authService';

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;

  checkAuth: () => Promise<boolean>;
  login: (token: string) => Promise<void>;
  logout: () => void;
  saveApiKey: (provider: 'claude' | 'openai', apiKey: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: authService.isAuthenticated(),
      user: null,

      checkAuth: async () => {
        if (!authService.isAuthenticated()) {
          console.log('Not authenticated - no token');
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          console.log('Fetching user profile...');
          const user = await authService.getUserProfile();
          console.log('User profile received:', user);
          set({ isAuthenticated: true, user });
          return true;
        } catch (error) {
          console.error('Auth check failed:', error);
          authService.logout();
          set({ isAuthenticated: false, user: null });
          return false;
        }
      },

      login: async (token: string) => {
        authService.setToken(token);
        const user = await authService.getUserProfile();
        set({ isAuthenticated: true, user });
      },

      logout: () => {
        authService.logout();
        set({ isAuthenticated: false, user: null });
      },

      saveApiKey: async (model: string) => {
        await authService.selectModel(model);
        // Refresh user
        const user = await authService.getUserProfile();
        set({ user });
      },

      refreshUser: async () => {
        if (authService.isAuthenticated()) {
          const user = await authService.getUserProfile();
          set({ user });
        }
      },
    }),
    {
      name: 'provoke-studio-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
