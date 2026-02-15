import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { claudeServiceProxy } from '../../services/api/aiServiceProxy';
import { FiZap, FiCheck, FiX, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';

interface AIAssistantProps {
  content: string;
  onSuggestion?: (suggestion: string) => void;
  onReplace?: (oldText: string, newText: string) => void;
}

interface Suggestion {
  id: string;
  type: 'improvement' | 'continuation' | 'feedback';
  title: string;
  content: string;
  originalText?: string; // AS-IS (원본)
  timestamp: number;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ content, onReplace }) => {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('');
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('ai-panel-width');
    return saved ? parseInt(saved) : 320; // Default 320px (w-80)
  });
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(280, window.innerWidth - e.clientX), 600); // Min 280px, Max 600px
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('ai-panel-width', panelWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, panelWidth]);

  // Auto-analyze content after user stops typing (debounced)
  useEffect(() => {
    if (!user?.isConfigured) return;
    if (content.length < 50) return; // 최소 50자 이상
    if (content === lastAnalyzedContent) return;

    const timer = setTimeout(() => {
      analyzeContent();
    }, 3000); // 3초 후 분석

    return () => clearTimeout(timer);
  }, [content, user?.isConfigured, lastAnalyzedContent]);

  const analyzeContent = useCallback(async () => {
    if (!user?.isConfigured || isAnalyzing) return;
    if (content.length < 50) return;

    setIsAnalyzing(true);
    setLastAnalyzedContent(content);

    try {
      // 마지막 500자만 분석 (컨텍스트)
      const recentContent = content.slice(-500);
      const wordCount = content.trim().split(/\s+/).length;

      // 마지막 1-2 문장 추출 (개선 대상)
      const sentences = recentContent.match(/[^.!?]+[.!?]+/g) || [];
      const lastSentences = sentences.slice(-2).join(' ').trim();

      // AI에게 여러 가지 제안 요청 (순차적으로 실행하여 Rate Limit 방지)
      let improvementSuggestion = null;
      let feedbackSuggestion = null;

      // 1. 문장 개선 제안 (마지막 1-2 문장만) - 웹소설 스타일
      if (lastSentences) {
        try {
          improvementSuggestion = await claudeServiceProxy.generateText({
            prompt: `당신은 국내 웹소설 전문 작가입니다. 다음 문장을 웹소설 스타일로 개선하세요.

**개선 방향**:
- 긴장감과 속도감 UP (독자가 다음 문장을 궁금해하게)
- 감정과 몰입도 강화 (주인공 시점 생생하게)
- 불필요한 설명 제거, 액션/대화 중심
- 필요시 짧은 문장으로 쪼개서 템포 살리기

원문: ${lastSentences}

웹소설 스타일로 개선된 문장만 출력하세요:`,
            maxTokens: 200,
            temperature: 0.7,
          });
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        } catch (err) {
          console.error('Improvement suggestion error:', err);
        }
      }

      // 2. 전체 글에 대한 피드백 (200자 이상일 때만) - 웹소설 상업성 중심
      if (wordCount > 50) {
        try {
          feedbackSuggestion = await claudeServiceProxy.generateText({
            prompt: `당신은 국내 웹소설 편집자입니다. 다음 최근 500자를 상업성 관점에서 피드백하세요 (2-3줄).

**체크 포인트**:
✅ 독자 이탈 방지: 지루한 부분 없는가?
✅ 궁금증 유발: 다음이 궁금한가?
✅ 감정 몰입: 주인공에게 공감되는가?
✅ 떡밥/복선: 나중에 회수할 요소가 있는가?

최근 내용:
${recentContent}

피드백 (2-3줄, 실전 조언):`,
            maxTokens: 200,
            temperature: 0.6,
          });
        } catch (err) {
          console.error('Feedback suggestion error:', err);
        }
      }

      const newSuggestions: Suggestion[] = [];

      if (improvementSuggestion?.text && lastSentences) {
        newSuggestions.push({
          id: Date.now().toString() + '-improvement',
          type: 'improvement',
          title: '✨ 문장 개선',
          originalText: lastSentences,
          content: improvementSuggestion.text,
          timestamp: Date.now(),
        });
      }

      if (feedbackSuggestion?.text) {
        newSuggestions.push({
          id: Date.now().toString() + '-feedback',
          type: 'feedback',
          title: '💡 피드백 & 제안',
          content: feedbackSuggestion.text,
          timestamp: Date.now(),
        });
      }

      // 기존 제안 중 최근 5개만 유지
      setSuggestions((prev) => [...newSuggestions, ...prev].slice(0, 5));
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, user?.isConfigured, isAnalyzing]);


  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const manualAnalyze = () => {
    setSuggestions([]); // 기존 제안 제거
    analyzeContent();
  };

  if (!user?.isConfigured) {
    return (
      <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          AI 어시스턴트를 사용하려면 로그인해주세요.
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full relative"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Header */}
      <div className="h-[52px] px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiZap className="text-blue-600" size={16} />
            AI 제안
          </h3>
          <button
            onClick={manualAnalyze}
            disabled={isAnalyzing}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="새로고침"
          >
            <FiRefreshCw className={`text-gray-600 dark:text-gray-400 ${isAnalyzing ? 'animate-spin' : ''}`} size={16} />
          </button>
        </div>

        {isAnalyzing && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
            분석 중...
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-12">
            <FiMessageSquare className="mx-auto mb-3 opacity-50" size={28} />
            <p>글을 작성하면</p>
            <p>AI가 자동으로 제안합니다</p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-3 rounded-lg border ${
                suggestion.type === 'improvement'
                  ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                  {suggestion.title}
                </h4>
                <button
                  onClick={() => dismissSuggestion(suggestion.id)}
                  className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded"
                >
                  <FiX size={14} className="text-gray-500" />
                </button>
              </div>

              {/* AS-IS / TO-BE for improvement only */}
              {suggestion.type === 'improvement' && suggestion.originalText ? (
                <div className="space-y-2 mb-3">
                  {/* AS-IS */}
                  <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      AS-IS (원본)
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {suggestion.originalText}
                    </p>
                  </div>

                  {/* TO-BE */}
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded p-2 border border-purple-300 dark:border-purple-700">
                    <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      TO-BE (개선)
                    </div>
                    <p className="text-xs text-gray-900 dark:text-white leading-relaxed font-medium">
                      {suggestion.content}
                    </p>
                  </div>
                </div>
              ) : (
                /* Feedback - 기존 스타일 유지 */
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap leading-relaxed">
                  {suggestion.content}
                </p>
              )}

              {suggestion.type === 'improvement' && suggestion.originalText && (
                <button
                  onClick={() => {
                    if (onReplace && suggestion.originalText) {
                      onReplace(suggestion.originalText, suggestion.content);
                      dismissSuggestion(suggestion.id);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  <FiCheck size={14} />
                  개선 적용
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resize Handle - Zen minimal style with wider hit area */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize group"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        title="크기 조절"
      >
        <div className="absolute inset-y-0 left-0 w-px bg-gray-300/30 dark:bg-gray-600/30 group-hover:bg-blue-400/50 transition-all" />
      </div>
    </div>
  );
};
