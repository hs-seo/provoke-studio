import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { FiCheck } from 'react-icons/fi';

const AVAILABLE_MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI의 최신 멀티모달 모델',
    provider: 'OpenAI',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: '빠르고 비용 효율적인 모델',
    provider: 'OpenAI',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: '강력한 성능의 GPT-4',
    provider: 'OpenAI',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic의 최신 모델',
    provider: 'Anthropic',
  },
];

export const ModelSelector: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [saved, setSaved] = useState(false);

  const handleSelect = async (modelId: string) => {
    setSelectedModel(modelId);

    try {
      const response = await fetch('http://localhost:3001/api/provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ model: modelId }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save model selection:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI 모델 선택
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          GitHub OAuth로 로그인하여 다양한 AI 모델을 무료로 사용하세요
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FiCheck className="text-green-600" size={20} />
          <span className="font-semibold text-green-900 dark:text-green-300">
            GitHub OAuth 연결됨
          </span>
        </div>
        <p className="text-sm text-green-800 dark:text-green-400">
          {user?.username} 계정으로 로그인되었습니다. API 키 입력 없이 바로 사용 가능합니다!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => handleSelect(model.id)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              selectedModel === model.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {model.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {model.provider}
                </p>
              </div>
              {selectedModel === model.id && (
                <FiCheck className="text-blue-600" size={24} />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {model.description}
            </p>
          </button>
        ))}
      </div>

      {saved && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <FiCheck /> 모델 선택이 저장되었습니다
          </p>
        </div>
      )}

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
          💡 GitHub Models 정보
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <li>• GitHub 계정으로 무료로 AI 모델 사용</li>
          <li>• API 키 관리 불필요</li>
          <li>• 여러 모델 간 자유롭게 전환</li>
          <li>• GPT-4o, Claude 3.5 등 최신 모델 지원</li>
        </ul>
      </div>
    </div>
  );
};
