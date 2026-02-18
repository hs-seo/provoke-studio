import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, Project, Character, Plot, Chapter } from '../types';

interface TokenStatus {
  isLimited: boolean;
  retryTime?: string;
  lastChecked?: number;
}

interface AppState {
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Current Project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  focusMode: boolean;
  toggleFocusMode: () => void;

  // Active Document
  activeDocumentId: string | null;
  setActiveDocument: (id: string | null) => void;

  // Token Status
  tokenStatus: TokenStatus;
  setTokenStatus: (status: TokenStatus) => void;

  // Characters
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, character: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  // Plots
  addPlot: (plot: Plot) => void;
  updatePlot: (id: string, plot: Partial<Plot>) => void;
  deletePlot: (id: string) => void;

  // Chapters
  addChapter: (chapter: Chapter) => void;
  updateChapter: (id: string, chapter: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial settings
      settings: {
        theme: 'auto',
        fontSize: 16,
        fontFamily: 'serif',
        textCountUnit: 'chars',
        defaultEpisodeTargetChars: 5500,
        focusMode: false,
        autoSave: true,
        autoSaveInterval: 30,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Project state
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      // UI state
      isSidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      focusMode: false,
      toggleFocusMode: () =>
        set((state) => ({ focusMode: !state.focusMode })),

      // Active document
      activeDocumentId: null,
      setActiveDocument: (id) => set({ activeDocumentId: id }),

      // Token status
      tokenStatus: (() => {
        try {
          const saved = localStorage.getItem('codex-token-status');
          return saved ? JSON.parse(saved) : { isLimited: false };
        } catch {
          return { isLimited: false };
        }
      })(),
      setTokenStatus: (status) => {
        localStorage.setItem('codex-token-status', JSON.stringify(status));
        set({ tokenStatus: status });
      },

      // Character methods
      addCharacter: (character) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              characters: [...state.currentProject.characters, character],
            },
          };
        }),
      updateCharacter: (id, updates) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              characters: state.currentProject.characters.map((c) =>
                c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
              ),
            },
          };
        }),
      deleteCharacter: (id) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              characters: state.currentProject.characters.filter((c) => c.id !== id),
            },
          };
        }),

      // Plot methods
      addPlot: (plot) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              plots: [...state.currentProject.plots, plot],
            },
          };
        }),
      updatePlot: (id, updates) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              plots: state.currentProject.plots.map((p) =>
                p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
              ),
            },
          };
        }),
      deletePlot: (id) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              plots: state.currentProject.plots.filter((p) => p.id !== id),
            },
          };
        }),

      // Chapter methods
      addChapter: (chapter) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              chapters: [...state.currentProject.chapters, chapter],
            },
          };
        }),
      updateChapter: (id, updates) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              chapters: state.currentProject.chapters.map((ch) =>
                ch.id === id ? { ...ch, ...updates, updatedAt: new Date() } : ch
              ),
            },
          };
        }),
      deleteChapter: (id) =>
        set((state) => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              chapters: state.currentProject.chapters.filter((ch) => ch.id !== id),
            },
          };
        }),
    }),
    {
      name: 'provoke-studio-storage',
    }
  )
);
