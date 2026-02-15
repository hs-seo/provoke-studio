import React, { useState } from 'react';
import { Character } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { claudeServiceProxy, openaiServiceProxy } from '../../services/api/aiServiceProxy';
import { FiX, FiZap } from 'react-icons/fi';

interface CharacterFormProps {
  onClose: () => void;
  character?: Character;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({ onClose, character }) => {
  const { addCharacter, updateCharacter } = useAppStore();
  const { user } = useAuthStore();

  const [name, setName] = useState(character?.name || '');
  const [role, setRole] = useState(character?.role || '');
  const [age, setAge] = useState(character?.age || 0);
  const [description, setDescription] = useState(character?.description || '');
  const [background, setBackground] = useState(character?.background || '');
  const [personality, setPersonality] = useState(character?.personality?.join(', ') || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const characterData: Partial<Character> = {
      name,
      role,
      age: age || undefined,
      description,
      background,
      personality: personality.split(',').map(p => p.trim()).filter(Boolean),
      relationships: character?.relationships || [],
    };

    if (character) {
      updateCharacter(character.id, characterData);
    } else {
      const newCharacter: Character = {
        id: Date.now().toString(),
        ...characterData as Character,
        relationships: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addCharacter(newCharacter);
    }

    onClose();
  };

  const handleAIGenerate = async () => {
    if (!user?.hasGitHubToken) {
      alert('다시 로그인해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const service = user?.provider === 'claude' ? claudeServiceProxy : openaiServiceProxy;
      const prompt = `${name}이라는 이름의 캐릭터를 만들어주세요. ${description ? `설명: ${description}` : ''}`;
      const result = await service.generateCharacter(prompt);

      // Parse AI response and fill in fields
      setBackground(result);
    } catch (error) {
      console.error('AI generation error:', error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {character ? '캐릭터 수정' : '새 캐릭터'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                역할
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="주인공, 조연 등"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              나이
            </label>
            <input
              type="number"
              value={age || ''}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                배경 스토리
              </label>
              {user?.hasGitHubToken && (
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !name}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <FiZap size={14} />
                  {isGenerating ? '생성 중...' : 'AI 생성'}
                </button>
              )}
            </div>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              성격 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="용감한, 친절한, 호기심 많은"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {character ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
