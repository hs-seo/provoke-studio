import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { FiCheck, FiLogOut, FiUser } from 'react-icons/fi';

export const AISettingsOAuth: React.FC = () => {
  const { user, saveApiKey, logout, refreshUser } = useAuthStore();
  const [provider, setProvider] = useState<'claude' | 'openai'>(user?.provider || 'claude');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleSave = async () => {
    if (!tempApiKey.trim()) {
      alert('API 키를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await saveApiKey(provider, tempApiKey);
      setSaved(true);
      setTempApiKey('');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save API key:', error);
      alert('API 키 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      window.location.reload();
    }
  };

  const isConfigured = provider === 'claude' ? user?.hasClaudeKey : user?.hasOpenaiKey;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* User Info */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FiUser className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.username}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <FiLogOut />
          로그아웃
        </button>
      </div>

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
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Claude
                </span>
                {provider === 'claude' && (
                  <FiCheck className="text-blue-600" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anthropic의 Claude AI
              </p>
              {user?.hasClaudeKey && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ 설정됨
                </div>
              )}
            </button>

            <button
              onClick={() => setProvider('openai')}
              className={`p-4 border-2 rounded-lg transition-all ${
                provider === 'openai'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  OpenAI
                </span>
                {provider === 'openai' && (
                  <FiCheck className="text-blue-600" size={20} />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OpenAI GPT-4
              </p>
              {user?.hasOpenaiKey && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ 설정됨
                </div>
              )}
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API 키 {isConfigured && '(이미 설정됨 - 변경하려면 입력)'}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder={
                  isConfigured
                    ? '새 API 키 입력 (선택사항)'
                    : provider === 'claude'
                    ? 'sk-ant-...'
                    : 'sk-...'
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
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
                  className="text-blue-600 hover:underline"
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
                  className="text-blue-600 hover:underline"
                >
                  OpenAI Platform
                </a>
                에서 API 키를 발급받을 수 있습니다.
              </>
            )}
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
            <FiCheck className="text-green-600" />
            보안 정보
          </h3>
          <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
            <li>• API 키는 안전하게 서버에 암호화되어 저장됩니다</li>
            <li>• 브라우저나 로컬 스토리지에 저장되지 않습니다</li>
            <li>• AI 요청 시 서버를 통해 안전하게 전송됩니다</li>
          </ul>
        </div>

        {/* Status */}
        {isConfigured && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <FiCheck className="text-green-600" size={20} />
            <span className="text-sm text-green-700 dark:text-green-400">
              {provider === 'claude' ? 'Claude' : 'OpenAI'} API가 설정되었습니다
            </span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={!tempApiKey || isLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              '저장 중...'
            ) : saved ? (
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
