import React, { useState, useEffect } from 'react';
import { FiGithub, FiCheck } from 'react-icons/fi';
import { SiOpenai } from 'react-icons/si';
import { authService } from '../../services/api/authService';
import { invoke } from '@tauri-apps/api/core';

interface OAuthLoginProps {
  onSuccess: () => void;
}

export const OAuthLogin: React.FC<OAuthLoginProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const provider = params.get('provider');

    if (token) {
      authService.setToken(token);

      // Set AI provider based on OAuth provider
      if (provider === 'openai') {
        localStorage.setItem('ai_provider', 'openai-oauth');
      } else {
        localStorage.setItem('ai_provider', 'github');
      }

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      onSuccess();
    }
  }, [onSuccess]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching GitHub auth URL from:', 'http://localhost:3001/auth/github/url');
      const authUrl = await authService.getGitHubAuthUrl();
      console.log('Auth URL received:', authUrl);

      // Open OAuth in external browser using Tauri
      await invoke('plugin:opener|open', { path: authUrl });

      // Set a message to inform user
      setError('GitHub 로그인 창이 열렸습니다. 로그인 후 이 페이지로 돌아옵니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`로그인 URL을 가져오는데 실패했습니다: ${errorMessage}`);
      console.error('OAuth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAILogin = async () => {
    setIsLoadingOpenAI(true);
    setError(null);

    try {
      console.log('Fetching OpenAI auth URL from:', 'http://localhost:3001/auth/openai/url');
      const authUrl = await authService.getOpenAIAuthUrl();
      console.log('Auth URL received:', authUrl);

      // Open OAuth in external browser using Tauri
      await invoke('plugin:opener|open', { path: authUrl });

      // Set a message to inform user
      setError('OpenAI 로그인 창이 열렸습니다. ChatGPT 계정으로 로그인 후 이 페이지로 돌아옵니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`로그인 URL을 가져오는데 실패했습니다: ${errorMessage}`);
      console.error('OAuth error:', err);
    } finally {
      setIsLoadingOpenAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Provoke Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            안전한 AI 글쓰기 도구
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <FiCheck className="text-green-600" />
              OAuth 로그인의 장점
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• API 키를 안전하게 서버에 저장</li>
              <li>• 브라우저에 민감정보 노출 없음</li>
              <li>• 간편한 계정 연동</li>
              <li>• 여러 기기에서 동일 설정 사용</li>
            </ul>
          </div>

          <button
            onClick={handleGitHubLogin}
            disabled={isLoading || isLoadingOpenAI}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiGithub size={20} />
            {isLoading ? '로그인 중...' : 'GitHub으로 로그인 (무료)'}
          </button>

          <button
            onClick={handleOpenAILogin}
            disabled={isLoading || isLoadingOpenAI}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SiOpenai size={20} />
            {isLoadingOpenAI ? '로그인 중...' : 'OpenAI로 로그인 (ChatGPT Plus)'}
          </button>

          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              error.includes('열렸습니다')
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {error}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            로그인하면 <a href="#" className="text-blue-600 hover:underline">이용약관</a> 및{' '}
            <a href="#" className="text-blue-600 hover:underline">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
