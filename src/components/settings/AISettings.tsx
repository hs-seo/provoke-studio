import React, { useState } from 'react';
import { useAIStore } from '../../store/useAIStore';
import { FiCheck, FiX } from 'react-icons/fi';

export const AISettings: React.FC = () => {
  const { provider, apiKey, setProvider, setApiKey, isConfigured } = useAIStore();
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(tempApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        AI 설정
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            AI 제공자
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setProvider('claude')}
              className={`p-4 border-2 rounded-lg transition-all ${
                provider === 'claude'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Claude
                </span>
                {provider === 'claude' && (
                  <FiCheck className="text-primary-600" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anthropic의 Claude AI
              </p>
            </button>

            <button
              onClick={() => setProvider('openai')}
              className={`p-4 border-2 rounded-lg transition-all ${
                provider === 'openai'
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  OpenAI
                </span>
                {provider === 'openai' && (
                  <FiCheck className="text-primary-600" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OpenAI GPT-4
              </p>
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API 키
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder={
                  provider === 'claude'
                    ? 'sk-ant-...'
                    : 'sk-...'
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {provider === 'claude' ? (
              <>
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Anthropic Console
                </a>
                에서 API 키를 발급받을 수 있습니다.
              </>
            ) : (
              <>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  OpenAI Platform
                </a>
                에서 API 키를 발급받을 수 있습니다.
              </>
            )}
          </p>
        </div>

        {/* Status */}
        {isConfigured() && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <FiCheck className="text-green-600" size={20} />
            <span className="text-sm text-green-700 dark:text-green-400">
              AI가 설정되었습니다
            </span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={!tempApiKey}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <FiCheck /> 저장됨
              </span>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </div>

      {/* AI Features Info */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
          AI 기능
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <li>• 텍스트 개선 및 교정</li>
          <li>• 스토리 이어쓰기</li>
          <li>• 캐릭터 프로필 생성</li>
          <li>• 플롯 아이디어 제안</li>
          <li>• 대화 생성 및 개선</li>
        </ul>
      </div>
    </div>
  );
};
