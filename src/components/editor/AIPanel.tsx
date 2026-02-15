import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { claudeServiceProxy } from '../../services/api/aiServiceProxy';
import { FiZap, FiRefreshCw, FiArrowRight } from 'react-icons/fi';

interface AIPanelProps {
  selectedText?: string;
  onInsert: (text: string) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ selectedText, onInsert }) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Debug log
  React.useEffect(() => {
    console.log('AIPanel user:', user);
    console.log('hasGitHubToken:', user?.hasGitHubToken);
    console.log('isConfigured:', user?.isConfigured);
  }, [user]);

  const handleAIAction = async (action: 'improve' | 'continue' | 'custom') => {
    console.log('handleAIAction - user:', user);

    if (!user?.hasGitHubToken && !user?.isConfigured) {
      alert('다시 로그인해주세요. User info: ' + JSON.stringify(user));
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      // Use GitHub Models service
      const service = claudeServiceProxy; // Use same proxy
      let response = '';

      switch (action) {
        case 'improve':
          if (!selectedText) {
            alert('개선할 텍스트를 선택해주세요.');
            return;
          }
          response = await service.improveText(selectedText);
          break;

        case 'continue':
          if (!selectedText) {
            alert('이어쓸 텍스트를 선택해주세요.');
            return;
          }
          response = await service.continueStory(selectedText);
          break;

        case 'custom':
          if (!customPrompt) {
            alert('프롬프트를 입력해주세요.');
            return;
          }
          response = (await service.generateText({
            prompt: customPrompt,
            context: selectedText,
          })).text;
          break;
      }

      setResult(response);
    } catch (error) {
      console.error('AI error:', error);
      alert('AI 처리 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (result) {
      onInsert(result);
      setResult('');
    }
  };

  if (!user?.hasGitHubToken && !user?.isConfigured) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          AI 기능을 사용하려면 다시 로그인해주세요.
        </p>
        <details className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
          <summary>디버그 정보</summary>
          <pre className="mt-1">{JSON.stringify(user, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FiZap className="text-primary-600" />
        AI 도우미
      </h3>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAIAction('improve')}
          disabled={isLoading || !selectedText}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <FiRefreshCw size={14} />
          개선
        </button>
        <button
          onClick={() => handleAIAction('continue')}
          disabled={isLoading || !selectedText}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <FiArrowRight size={14} />
          이어쓰기
        </button>
      </div>

      {/* Custom Prompt */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="커스텀 프롬프트 입력..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAIAction('custom');
              }
            }}
          />
          <button
            onClick={() => handleAIAction('custom')}
            disabled={isLoading || !customPrompt}
            className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <FiZap size={14} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
              {result}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInsert}
              className="flex-1 px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              삽입
            </button>
            <button
              onClick={() => setResult('')}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Selected Text Info */}
      {selectedText && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          선택된 텍스트: {selectedText.substring(0, 50)}
          {selectedText.length > 50 && '...'}
        </div>
      )}
    </div>
  );
};
