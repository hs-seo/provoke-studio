import React, { useEffect } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ModelSelector } from '../components/settings/ModelSelector';
import { ProjectSetup } from '../components/settings/ProjectSetup';
import { OAuthLogin } from '../components/auth/OAuthLogin';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { FiMoon, FiSun, FiEye, FiEyeOff } from 'react-icons/fi';
import { isTauri } from '../utils/platform';
import { codexService } from '../services/api/codexService';

export const MainPage: React.FC = () => {
  const { settings, updateSettings, focusMode, toggleFocusMode, currentProject, activeDocumentId, updateChapter } = useAppStore();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState('');

  // Get active chapter
  const activeChapter = currentProject?.chapters.find(ch => ch.id === activeDocumentId);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      // In Tauri mode, always use offline Codex mode
      if (isTauri()) {
        console.log('🚀 Running in Tauri mode - using offline Codex mode');

        try {
          const codexAvailable = await codexService.isCodexInstalled();
          console.log('✅ Codex CLI check result:', codexAvailable);

          // Even if Codex check fails, still set auth state for Tauri
          // This allows the app to work and show appropriate errors later
          useAuthStore.setState({
            isAuthenticated: true,
            user: {
              userId: 0,
              username: 'Codex User',
              email: 'codex@local',
              provider: 'codex-cli',
              hasGitHubToken: false,
              hasOpenAIToken: false,
              isConfigured: true,
            }
          });
          console.log('✅ Auth state set for offline mode');
        } catch (error) {
          console.error('❌ Error checking Codex:', error);
          // Still set auth state even if check fails
          useAuthStore.setState({
            isAuthenticated: true,
            user: {
              userId: 0,
              username: 'Codex User',
              email: 'codex@local',
              provider: 'codex-cli',
              hasGitHubToken: false,
              hasOpenAIToken: false,
              isConfigured: true,
            }
          });
        }

        setAuthChecked(true);
        return;
      }

      // Browser mode: use normal backend auth
      console.log('🌐 Running in browser mode - using backend auth');
      await checkAuth();
      setAuthChecked(true);
    };

    initAuth();
  }, [checkAuth]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    console.log('Applying theme:', settings.theme);

    // Remove any existing theme class first
    root.classList.remove('dark');

    if (settings.theme === 'dark') {
      root.classList.add('dark');
      console.log('Dark mode activated');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
      console.log('Light mode activated');
    } else {
      // Auto mode
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
        console.log('Auto mode: dark');
      } else {
        console.log('Auto mode: light');
      }
    }
  }, [settings.theme]);

  // ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, toggleFocusMode]);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  // Handle title editing
  const handleTitleClick = () => {
    if (activeChapter) {
      setEditedTitle(activeChapter.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (activeDocumentId && editedTitle.trim()) {
      updateChapter(activeDocumentId, { title: editedTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show OAuth login if not authenticated
  if (!isAuthenticated) {
    return <OAuthLogin onSuccess={() => window.location.reload()} />;
  }

  // Show model selector if no project selected yet
  if (!currentProject) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Provoke Studio
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {settings.theme === 'dark' ? (
              <FiSun size={20} className="text-gray-300" />
            ) : (
              <FiMoon size={20} className="text-gray-700" />
            )}
          </button>
        </div>
        <ModelSelector />
        <div className="max-w-4xl mx-auto px-6 mt-8">
          <ProjectSetup />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {!focusMode && <Sidebar />}

      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        {!focusMode && (
          <div className="h-[52px] flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-600 outline-none px-2 py-1"
                  placeholder="문서 제목"
                />
              ) : (
                <h2
                  onClick={handleTitleClick}
                  className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="클릭하여 제목 수정"
                >
                  {activeChapter?.title || currentProject?.name || 'Untitled'}
                </h2>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFocusMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="포커스 모드 (ESC로 나가기)"
              >
                <FiEye size={18} className="text-gray-700 dark:text-gray-300" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="테마 전환"
              >
                {settings.theme === 'dark' ? (
                  <FiSun size={18} className="text-gray-300" />
                ) : (
                  <FiMoon size={18} className="text-gray-700" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Focus Mode Exit Button - Fixed position */}
        {focusMode && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg bg-gray-800/80 dark:bg-gray-200/80 hover:bg-gray-700/80 dark:hover:bg-gray-300/80 backdrop-blur-sm transition-colors"
              title="테마 전환"
            >
              {settings.theme === 'dark' ? (
                <FiSun size={20} className="text-white dark:text-gray-900" />
              ) : (
                <FiMoon size={20} className="text-white dark:text-gray-900" />
              )}
            </button>
            <button
              onClick={toggleFocusMode}
              className="p-3 rounded-lg bg-gray-800/80 dark:bg-gray-200/80 hover:bg-gray-700/80 dark:hover:bg-gray-300/80 backdrop-blur-sm transition-colors"
              title="포커스 모드 종료 (ESC)"
            >
              <FiEyeOff size={20} className="text-white dark:text-gray-900" />
            </button>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 bg-white dark:bg-gray-900">
          <MarkdownEditor />
        </div>
      </div>
    </div>
  );
};
