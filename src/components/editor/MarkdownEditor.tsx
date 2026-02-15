import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { claudeServiceProxy } from '../../services/api/aiServiceProxy';
import { AIAssistant } from './AIAssistant';
import { FiZap, FiLoader, FiClock, FiRotateCcw, FiCheck, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

interface MarkdownEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent = '',
  onContentChange,
}) => {
  const { settings, focusMode, currentProject, activeDocumentId, updateChapter } = useAppStore();

  // Get active chapter
  const activeChapter = currentProject?.chapters.find(ch => ch.id === activeDocumentId);

  const [content, setContent] = useState(activeChapter?.scenes[0]?.content || initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Selection tooltip state
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const [, setShowTooltip] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [inlineSuggestion, setInlineSuggestion] = useState<{ original: string; improved: string } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);

  // History state
  interface HistoryItem {
    id: string;
    original: string;
    improved: string;
    timestamp: number;
    applied: boolean;
  }
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // AI Panel toggle
  const [showAIPanel, setShowAIPanel] = useState(true);

  const { user } = useAuthStore();

  // Load active chapter content when activeDocumentId changes
  useEffect(() => {
    if (activeChapter?.scenes[0]?.content) {
      setContent(activeChapter.scenes[0].content);
    } else if (activeChapter) {
      // New chapter with no scenes - create first scene
      setContent('');
    }
  }, [activeDocumentId, activeChapter]);

  // Auto-save content to chapter
  useEffect(() => {
    if (!activeDocumentId || !activeChapter || !settings.autoSave) return;

    const timer = setTimeout(() => {
      // Update or create first scene with content
      const scenes = activeChapter.scenes.length > 0
        ? activeChapter.scenes.map((scene, idx) =>
            idx === 0 ? { ...scene, content } : scene
          )
        : [{
            id: Date.now().toString(),
            title: 'Scene 1',
            content,
            order: 1,
            characters: [],
            status: 'draft' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          }];

      // Calculate word count
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

      updateChapter(activeDocumentId, {
        scenes,
        wordCount,
        updatedAt: new Date(),
      });
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timer);
  }, [content, activeDocumentId, activeChapter, settings.autoSave, updateChapter]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      onContentChange?.(newContent);
    },
    [onContentChange]
  );

  const handleAISuggestion = useCallback((suggestion: string) => {
    const newContent = content + suggestion;
    setContent(newContent);
    onContentChange?.(newContent);

    // 커서를 끝으로 이동
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newContent.length, newContent.length);
      }
    }, 0);
  }, [content, onContentChange]);

  const handleReplace = useCallback((oldText: string, newText: string) => {
    const newContent = content.replace(oldText, newText);
    setContent(newContent);
    onContentChange?.(newContent);

    // 히스토리에 기록
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      original: oldText,
      improved: newText,
      timestamp: Date.now(),
      applied: true,
    };
    setHistory((prev) => [historyItem, ...prev].slice(0, 20)); // 최근 20개만 유지

    // 포커스 유지
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  }, [content, onContentChange]);

  // 히스토리에서 원본으로 복원
  const handleRestoreFromHistory = useCallback((item: HistoryItem) => {
    const newContent = content.replace(item.improved, item.original);
    setContent(newContent);
    onContentChange?.(newContent);

    // 히스토리 업데이트
    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id ? { ...h, applied: false } : h
      )
    );
  }, [content, onContentChange]);

  // 히스토리에서 개선안 다시 적용
  const handleReapplyFromHistory = useCallback((item: HistoryItem) => {
    const newContent = content.replace(item.original, item.improved);
    setContent(newContent);
    onContentChange?.(newContent);

    // 히스토리 업데이트
    setHistory((prev) =>
      prev.map((h) =>
        h.id === item.id ? { ...h, applied: true } : h
      )
    );
  }, [content, onContentChange]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end).trim();

    if (selected && selected.length > 10) {
      setSelectedText(selected);
    } else {
      setSelectedText('');
      setShowTooltip(false);
      setShowContextMenu(false);
    }
  }, [content]);

  // Handle context menu (right click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end).trim();

    if (selected && selected.length > 10) {
      setSelectedText(selected);
      setSelectionPosition({ top: e.clientY, left: e.clientX });
      setShowContextMenu(true);
      setShowTooltip(false);
    }
  }, [content]);

  // Hide menus on click outside
  const handleClickOutside = useCallback(() => {
    setShowTooltip(false);
    setShowContextMenu(false);
  }, []);

  // Request AI improvement for selected text
  const handleAIImprove = useCallback(async () => {
    if (!selectedText || !user?.isConfigured) return;

    setIsImproving(true);
    setShowTooltip(false);
    setShowContextMenu(false);
    setInlineSuggestion(null); // 기존 제안 제거

    try {
      // Rate limit 대비 재시도 로직
      let retries = 3;
      let response;

      while (retries > 0) {
        try {
          response = await claudeServiceProxy.generateText({
            prompt: `당신은 국내 웹소설 전문 작가입니다. 선택된 문장을 웹소설 스타일로 개선하세요.

**웹소설 작법 적용**:
- 긴장감/속도감: 템포를 살려 독자가 멈추지 않고 읽게
- 감정 몰입: 주인공 시점을 생생하게 (내적 독백, 감각 묘사)
- 대화/액션 중심: 설명보다는 보여주기
- 짧은 문장 활용: 필요시 쪼개서 리듬감 UP
- 궁금증 유발: 다음 문장이 궁금하게 만들기

원문:
${selectedText}

웹소설 스타일로 개선된 문장만 출력하세요:`,
            maxTokens: 200,
            temperature: 0.7,
          });
          break; // 성공하면 루프 탈출
        } catch (err: any) {
          if (err.message?.includes('RateLimitReached') && retries > 1) {
            console.log(`Rate limit hit, retrying in 2 seconds... (${retries - 1} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
            retries--;
          } else {
            throw err; // 다른 에러나 재시도 소진 시 throw
          }
        }
      }

      if (response) {
        setInlineSuggestion({
          original: selectedText,
          improved: response.text,
        });
      }
    } catch (error: any) {
      console.error('AI improvement error:', error);
      if (error.message?.includes('RateLimitReached')) {
        alert('AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        alert('AI 개선 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    } finally {
      setIsImproving(false);
    }
  }, [selectedText, user?.isConfigured]);

  // Apply inline suggestion
  const handleApplyInlineSuggestion = useCallback(() => {
    if (!inlineSuggestion) return;
    handleReplace(inlineSuggestion.original, inlineSuggestion.improved);
    setInlineSuggestion(null);
  }, [inlineSuggestion, handleReplace]);

  // Dismiss inline suggestion
  const handleDismissInlineSuggestion = useCallback(() => {
    setInlineSuggestion(null);
  }, []);

  // Word count and character count
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="flex h-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {!focusMode && (
          <div className="h-[52px] flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Editor
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{wordCount} 단어</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{charCount} 글자</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto relative" onClick={handleClickOutside}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onMouseUp={handleTextSelection}
            onContextMenu={handleContextMenu}
            className="w-full h-full px-6 py-4 bg-transparent resize-none outline-none
                       text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500"
            style={{
              fontSize: `${settings.fontSize}px`,
              fontFamily: settings.fontFamily === 'serif'
                ? 'Merriweather, Georgia, serif'
                : settings.fontFamily === 'sans'
                ? 'Inter, system-ui, sans-serif'
                : 'JetBrains Mono, monospace',
              lineHeight: 1.8,
            }}
            placeholder="여기에 글을 작성하세요... AI가 자동으로 도움을 줍니다."
            spellCheck={true}
          />

          {/* Context Menu (Right Click) */}
          {showContextMenu && selectionPosition && selectedText && user?.isConfigured && (
            <div
              className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] animate-fadeIn"
              style={{
                top: selectionPosition.top,
                left: selectionPosition.left,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleAIImprove}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <FiZap size={14} className="text-blue-600" />
                AI 개선
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                선택: {selectedText.substring(0, 30)}
                {selectedText.length > 30 && '...'}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isImproving && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg">
              <FiLoader className="animate-spin" size={14} />
              분석 중...
            </div>
          )}

          {/* Inline Suggestion - Fixed position in center */}
          {inlineSuggestion && !focusMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fadeIn" onClick={handleDismissInlineSuggestion}>
              <div className="w-[500px] max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-blue-200 dark:border-blue-800 p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiZap className="text-blue-600" size={18} />
                    AI 개선 제안
                  </h4>
                  <button
                    onClick={handleDismissInlineSuggestion}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {/* AS-IS */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      AS-IS (원본)
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {inlineSuggestion.original}
                    </p>
                  </div>

                  {/* TO-BE */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      TO-BE (개선)
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed font-medium">
                      {inlineSuggestion.improved}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApplyInlineSuggestion}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    적용
                  </button>
                  <button
                    onClick={handleDismissInlineSuggestion}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Panel Toggle Button (when closed) */}
      {!focusMode && !showAIPanel && (
        <button
          onClick={() => setShowAIPanel(true)}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-l-lg shadow-lg transition-all"
          title="AI 제안 열기"
        >
          <FiChevronLeft size={20} />
        </button>
      )}

      {/* AI Assistant */}
      {!focusMode && showAIPanel && (
        <div className="relative">
          <button
            onClick={() => setShowAIPanel(false)}
            className="absolute top-1/2 -translate-y-1/2 -left-10 z-50 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-l-lg transition-colors shadow-md"
            title="AI 제안 닫기"
          >
            <FiChevronRight size={16} />
          </button>
          <AIAssistant
            content={content}
            onSuggestion={handleAISuggestion}
            onReplace={handleReplace}
          />
        </div>
      )}

      {/* History Toggle Button (when closed) */}
      {!focusMode && !showHistory && (
        <button
          onClick={() => setShowHistory(true)}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-40 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-r-lg shadow-lg transition-all flex items-center gap-2"
          title="히스토리 열기"
        >
          <FiChevronRight size={20} />
          {history.length > 0 && (
            <span className="text-xs font-semibold">{history.length}</span>
          )}
        </button>
      )}

      {/* History Panel */}
      {showHistory && !focusMode && (
        <div className="fixed top-1/2 -translate-y-1/2 left-4 z-50 w-96 max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
          <button
            onClick={() => setShowHistory(false)}
            className="absolute top-1/2 -translate-y-1/2 -right-10 z-50 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-r-lg transition-colors shadow-md"
            title="히스토리 닫기"
          >
            <FiChevronLeft size={16} />
          </button>

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiClock className="text-purple-600" size={16} />
              개선 히스토리
            </h3>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
                아직 히스토리가 없습니다
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    item.applied
                      ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(item.timestamp).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  <div className="space-y-2 mb-2">
                    {/* Original */}
                    <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                      <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        원본
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                        {item.original}
                      </p>
                    </div>

                    {/* Improved */}
                    <div className="bg-purple-100 dark:bg-purple-900/30 rounded p-2 border border-purple-200 dark:border-purple-700">
                      <div className="text-[9px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        개선
                      </div>
                      <p className="text-xs text-gray-900 dark:text-white leading-relaxed font-medium line-clamp-2">
                        {item.improved}
                      </p>
                    </div>
                  </div>

                  {item.applied ? (
                    <button
                      onClick={() => handleRestoreFromHistory(item)}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      <FiRotateCcw size={12} />
                      원본으로 복원
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReapplyFromHistory(item)}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                    >
                      <FiCheck size={12} />
                      개선안 다시 적용
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
