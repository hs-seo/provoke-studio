import React, { useEffect } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { ModelSelector } from '../components/settings/ModelSelector';
import { ProjectSetup } from '../components/settings/ProjectSetup';
import { OAuthLogin } from '../components/auth/OAuthLogin';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { FiMoon, FiSun, FiEye, FiEyeOff, FiMonitor } from 'react-icons/fi';
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
    const applyTheme = () => {
      const root = document.documentElement;
      const body = document.body;

      console.log('Applying theme:', settings.theme);

      // Remove dark class from both html and body
      root.classList.remove('dark');
      body.classList.remove('dark');

      let shouldBeDark = false;

      if (settings.theme === 'dark') {
        shouldBeDark = true;
        console.log('Dark mode: forced dark');
      } else if (settings.theme === 'light') {
        shouldBeDark = false;
        console.log('Light mode: forced light');
      } else {
        // Auto mode - check system preference
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('Auto mode:', shouldBeDark ? 'dark' : 'light');
      }

      // Apply dark class to both html and body
      if (shouldBeDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        console.log('✅ Dark mode activated');
      } else {
        console.log('✅ Light mode activated');
      }

      // Force repaint
      root.style.colorScheme = shouldBeDark ? 'dark' : 'light';
    };

    applyTheme();

    // Listen for system theme changes in auto mode
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
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
    // Cycle: light -> dark -> auto -> light
    let newTheme: 'light' | 'dark' | 'auto';
    if (settings.theme === 'light') {
      newTheme = 'dark';
    } else if (settings.theme === 'dark') {
      newTheme = 'auto';
    } else {
      newTheme = 'light';
    }
    console.log(`Theme toggle: ${settings.theme} -> ${newTheme}`);
    updateSettings({ theme: newTheme });
  };

  // Get theme icon based on current theme
  const getThemeIcon = (size: number, className?: string) => {
    if (settings.theme === 'dark') {
      return <FiSun size={size} className={className} />;
    } else if (settings.theme === 'light') {
      return <FiMoon size={size} className={className} />;
    } else {
      return <FiMonitor size={size} className={className} />;
    }
  };

  const getThemeTitle = () => {
    const nextTheme = settings.theme === 'light' ? '다크' : settings.theme === 'dark' ? '자동' : '라이트';
    return `테마 전환 (현재: ${settings.theme === 'light' ? '라이트' : settings.theme === 'dark' ? '다크' : '자동'}, 클릭: ${nextTheme})`;
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
            title={getThemeTitle()}
          >
            {getThemeIcon(20, settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}
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
                title={getThemeTitle()}
              >
                {getThemeIcon(18, settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300')}
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
              title={getThemeTitle()}
            >
              {getThemeIcon(20, 'text-white dark:text-gray-900')}
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
