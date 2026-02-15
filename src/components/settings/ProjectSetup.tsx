import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Project } from '../../types';
import { FiBook, FiArrowRight } from 'react-icons/fi';

export const ProjectSetup: React.FC = () => {
  const { setCurrentProject } = useAppStore();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');

  const handleCreate = () => {
    if (!projectName.trim()) {
      alert('프로젝트 이름을 입력해주세요.');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      description: description || undefined,
      genre: genre || undefined,
      currentWordCount: 0,
      characters: [],
      plots: [],
      chapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentProject(newProject);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <FiBook className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Provoke Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            새로운 스토리를 시작하세요
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              프로젝트 이름 *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="나의 첫 소설"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 프로젝트에 대한 간단한 설명..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              장르
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 outline-none transition-all"
            >
              <option value="">선택하세요</option>
              <option value="소설">소설</option>
              <option value="판타지">판타지</option>
              <option value="로맨스">로맨스</option>
              <option value="스릴러">스릴러</option>
              <option value="SF">SF</option>
              <option value="역사">역사</option>
              <option value="에세이">에세이</option>
              <option value="블로그">블로그</option>
              <option value="시나리오">시나리오</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            시작하기
            <FiArrowRight />
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Ulysses의 몰입감과 Scrivener의 관리 기능을 하나로
          </p>
        </div>
      </div>
    </div>
  );
};
