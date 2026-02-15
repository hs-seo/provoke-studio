import React, { useState } from 'react';
import { Plot, PlotPoint } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { claudeServiceProxy, openaiServiceProxy } from '../../services/api/aiServiceProxy';
import { FiX, FiPlus, FiZap, FiTrash2 } from 'react-icons/fi';

interface PlotFormProps {
  onClose: () => void;
  plot?: Plot;
}

export const PlotForm: React.FC<PlotFormProps> = ({ onClose, plot }) => {
  const { addPlot, updatePlot } = useAppStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState(plot?.title || '');
  const [description, setDescription] = useState(plot?.description || '');
  const [status, setStatus] = useState<'planning' | 'in-progress' | 'completed'>(
    plot?.status || 'planning'
  );
  const [timeline, setTimeline] = useState<PlotPoint[]>(plot?.timeline || []);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const plotData: Partial<Plot> = {
      title,
      description,
      status,
      timeline,
    };

    if (plot) {
      updatePlot(plot.id, plotData);
    } else {
      const newPlot: Plot = {
        id: Date.now().toString(),
        ...plotData as Plot,
        timeline: timeline,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addPlot(newPlot);
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
      const result = await service.generatePlotIdeas(description);

      // For now, just set the description to the result
      // In a real app, you'd parse this into plot points
      setDescription(result);
    } catch (error) {
      console.error('AI generation error:', error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addPlotPoint = () => {
    const newPoint: PlotPoint = {
      id: Date.now().toString(),
      title: '',
      description: '',
      order: timeline.length,
      completed: false,
      associatedCharacters: [],
    };
    setTimeline([...timeline, newPoint]);
  };

  const updatePlotPoint = (id: string, updates: Partial<PlotPoint>) => {
    setTimeline(timeline.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlotPoint = (id: string) => {
    setTimeline(timeline.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {plot ? '플롯 수정' : '새 플롯'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                설명
              </label>
              {user?.hasGitHubToken && (
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !description}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <FiZap size={14} />
                  {isGenerating ? '생성 중...' : 'AI 아이디어'}
                </button>
              )}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상태
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="planning">계획 중</option>
              <option value="in-progress">진행 중</option>
              <option value="completed">완료</option>
            </select>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                타임라인
              </label>
              <button
                type="button"
                onClick={addPlotPoint}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <FiPlus size={14} />
                포인트 추가
              </button>
            </div>

            <div className="space-y-3">
              {timeline.map((point, index) => (
                <div
                  key={point.id}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                      {index + 1}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={point.title}
                        onChange={(e) =>
                          updatePlotPoint(point.id, { title: e.target.value })
                        }
                        placeholder="포인트 제목"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <textarea
                        value={point.description}
                        onChange={(e) =>
                          updatePlotPoint(point.id, { description: e.target.value })
                        }
                        placeholder="설명"
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => deletePlotPoint(point.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
              {plot ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
