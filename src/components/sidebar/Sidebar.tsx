import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/api/authService';
import { CharacterForm } from './CharacterForm';
import { PlotForm } from './PlotForm';
import { invoke } from '@tauri-apps/api/core';
import {
  FiFileText,
  FiUsers,
  FiTrello,
  FiSettings,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiBarChart2,
} from 'react-icons/fi';

type SidebarTab = 'documents' | 'characters' | 'plots' | 'analysis' | 'settings';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, currentProject } = useAppStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>('documents');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved) : 256; // Default 256px (w-64)
  });
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(200, e.clientX), 600); // Min 200px, Max 600px
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('sidebar-width', sidebarWidth.toString());
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
  }, [isResizing, sidebarWidth]);

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 z-50"
      >
        <FiChevronRight size={20} />
      </button>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header - Combined with Tabs */}
      <div className="h-[52px] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
        <div className="flex items-center flex-1 overflow-x-auto">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white px-4 whitespace-nowrap">
            {currentProject?.name || 'Provoke Studio'}
          </h1>
          <div className="flex ml-2">
            <TabButton
              icon={<FiFileText />}
              label="문서"
              active={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
            />
            <TabButton
              icon={<FiUsers />}
              label="캐릭터"
              active={activeTab === 'characters'}
              onClick={() => setActiveTab('characters')}
            />
            <TabButton
              icon={<FiTrello />}
              label="플롯"
              active={activeTab === 'plots'}
              onClick={() => setActiveTab('plots')}
            />
            <TabButton
              icon={<FiBarChart2 />}
              label="분석"
              active={activeTab === 'analysis'}
              onClick={() => setActiveTab('analysis')}
            />
            <TabButton
              icon={<FiSettings />}
              label="설정"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-2 flex-shrink-0"
        >
          <FiChevronLeft size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'characters' && <CharactersTab />}
        {activeTab === 'plots' && <PlotsTab />}
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>

      {/* Resize Handle - Zen minimal style with wider hit area */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize group z-50"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        title="크기 조절"
      >
        <div className="absolute inset-y-0 right-0 w-px bg-gray-300/30 dark:bg-gray-600/30 group-hover:bg-blue-400/50 transition-all" />
      </div>
    </div>
  );
};

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`px-3 h-full flex items-center justify-center text-xs transition-colors border-b-2
      ${active
        ? 'text-primary-600 dark:text-primary-400 border-primary-600'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
      }`}
  >
    <span className="text-base">{icon}</span>
  </button>
);

const DocumentsTab: React.FC = () => {
  const { currentProject, addChapter, setActiveDocument } = useAppStore();

  const handleNewDocument = () => {
    const newChapter = {
      id: Date.now().toString(),
      title: `새 문서 ${(currentProject?.chapters.length || 0) + 1}`,
      order: (currentProject?.chapters.length || 0) + 1,
      scenes: [],
      wordCount: 0,
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addChapter(newChapter);
    setActiveDocument(newChapter.id);
  };

  return (
    <div>
      <button
        onClick={handleNewDocument}
        className="w-full flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mb-4"
      >
        <FiPlus />
        <span>새 문서</span>
      </button>
      <div className="space-y-2">
        {currentProject?.chapters.map((chapter) => (
          <div
            key={chapter.id}
            onClick={() => setActiveDocument(chapter.id)}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">
              {chapter.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chapter.wordCount} words
            </p>
          </div>
        ))}
        {(!currentProject?.chapters || currentProject.chapters.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            문서가 없습니다
          </p>
        )}
      </div>
    </div>
  );
};

const CharactersTab: React.FC = () => {
  const { currentProject } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mb-4">
        <FiPlus />
        <span>새 캐릭터</span>
      </button>
      <div className="space-y-2">
        {currentProject?.characters.map((character) => (
          <div
            key={character.id}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">
              {character.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {character.role || '역할 없음'}
            </p>
          </div>
        ))}
        {(!currentProject?.characters || currentProject.characters.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            캐릭터가 없습니다
          </p>
        )}
      </div>
      {showForm && <CharacterForm onClose={() => setShowForm(false)} />}
    </div>
  );
};

const PlotsTab: React.FC = () => {
  const { currentProject } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 mb-4">
        <FiPlus />
        <span>새 플롯</span>
      </button>
      <div className="space-y-2">
        {currentProject?.plots.map((plot) => (
          <div
            key={plot.id}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">
              {plot.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {plot.status}
            </p>
          </div>
        ))}
        {(!currentProject?.plots || currentProject.plots.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            플롯이 없습니다
          </p>
        )}
      </div>
      {showForm && <PlotForm onClose={() => setShowForm(false)} />}
    </div>
  );
};

const AnalysisTab: React.FC = () => {
  const { currentProject, activeDocumentId, updateChapter } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isWritingNext, setIsWritingNext] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  // Get all content
  const getAllContent = () => {
    return currentProject?.chapters
      .map(ch => ch.scenes.map(s => s.content).join('\n\n'))
      .join('\n\n---\n\n') || '';
  };

  const handleAnalyze = async () => {
    const content = getAllContent();
    if (!content.trim()) {
      alert('분석할 내용이 없습니다. 먼저 글을 작성해주세요.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const { claudeServiceProxy } = await import('../../services/api/aiServiceProxy');

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const charCount = content.length;

      // AI 분석 요청 - 웹소설/웹툰 전략 중심
      const response = await claudeServiceProxy.generateText({
        prompt: `당신은 국내 웹소설/웹툰 전문 스토리 컨설턴트입니다. 다음 작품을 분석하고, **상업적 성공**을 위한 실전 피드백을 제공하세요.

**현재 분량**: ${charCount}자 (${wordCount}단어)
**목표**: 회차당 5,000-5,500자, 매회 유료 결제 유도, 절벽 엔딩(cliffhanger) 필수

다음 JSON 형식으로 답변하세요 (markdown 코드 블록 없이 순수 JSON만):

{
  "episode_analysis": {
    "current_length": ${charCount},
    "target_length": "5000-5500자",
    "pacing": "현재 회차의 템포 분석 (너무 느림/적절/너무 빠름)",
    "cliffhanger_strength": "현재 엔딩의 절벽 강도 (1-10점)",
    "cliffhanger_feedback": "절벽 엔딩 개선 방법"
  },
  "characters": {
    "identified": ["주요 캐릭터 이름/역할"],
    "protagonist_appeal": "주인공의 매력 포인트 (독자 몰입 요소)",
    "character_hooks": "캐릭터별 떡밥/미스터리 (독자 궁금증 유발)",
    "missing": "추가하면 좋을 캐릭터나 관계"
  },
  "plot": {
    "hook_strength": "도입부 훅의 강도 (독자 이탈 방지)",
    "conflict_escalation": "갈등 고조 전략 (웹소설 3막 구조 기준)",
    "mystery_boxes": "미해결 떡밥/복선 목록 (장기 연재 유지)",
    "next_episode_hook": "다음 화 예고/궁금증 유발 포인트"
  },
  "commercial_checklist": [
    {"item": "첫 3문단에 강력한 훅이 있는가?", "status": true/false, "feedback": "독자 이탈 방지"},
    {"item": "회차 중반에 반전/사건이 있는가?", "status": true/false, "feedback": "지루함 방지"},
    {"item": "엔딩이 다음 화를 궁금하게 만드는가?", "status": true/false, "feedback": "절벽 강도"},
    {"item": "캐릭터 성장/변화가 보이는가?", "status": true/false, "feedback": "장기 독자 유지"},
    {"item": "떡밥/복선이 적절히 깔려있는가?", "status": true/false, "feedback": "재미 지속성"}
  ],
  "cliffhanger_suggestions": [
    "현재 회차 엔딩을 강화할 절벽 아이디어 3가지"
  ],
  "next_episode_ideas": [
    "다음 화 전개 아이디어 (5000자 분량, 절벽 포함)"
  ],
  "revision_priority": [
    "지금 당장 수정하면 좋을 부분 (우선순위 순)"
  ]
}

작품 내용:
${content}`,
        maxTokens: 1500,
        temperature: 0.7,
      });

      try {
        // Remove markdown code fences if present
        let jsonText = response.text.trim();

        // Check if wrapped in markdown code block
        const codeBlockMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim();
        }

        const parsed = JSON.parse(jsonText);
        setAnalysis(parsed);
      } catch (e) {
        console.error('JSON parsing failed:', e);
        // JSON 파싱 실패 시 텍스트 그대로 저장
        setAnalysis({ raw: response.text });
      }
    } catch (error: any) {
      console.error('Analysis error:', error);

      // Rate limit 에러 체크
      if (error.message?.includes('RateLimitReached') || error.message?.includes('Rate limit')) {
        alert('⏰ AI 요청 제한에 도달했습니다.\n\nGitHub Models API는 하루에 50번까지만 사용할 수 있습니다.\n약 6시간 후 다시 시도해주세요.\n\n또는 다른 GitHub 계정으로 로그인하세요.');
      } else {
        alert('분석 중 오류가 발생했습니다.\n\n' + (error.message || '알 수 없는 오류'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Write next episode based on analysis
  const handleWriteNextEpisode = async () => {
    if (!analysis || !activeDocumentId) return;

    setIsWritingNext(true);
    try {
      const { claudeServiceProxy } = await import('../../services/api/aiServiceProxy');
      const currentContent = getAllContent();

      const response = await claudeServiceProxy.generateText({
        prompt: `당신은 국내 웹소설 작가입니다. 다음 회차를 작성하세요.

**요구사항**:
- 분량: 5,000-5,500자
- 이전 화의 절벽 엔딩을 바로 이어받아 시작
- 회차 중반에 반전이나 사건 배치
- 마지막은 강력한 절벽 엔딩으로 마무리 (다음 화 궁금증 유발)

**분석 결과 반영**:
${analysis.next_episode_ideas ? '- 다음 화 아이디어: ' + analysis.next_episode_ideas.join(', ') : ''}
${analysis.plot?.next_episode_hook ? '- 다음 화 훅: ' + analysis.plot.next_episode_hook : ''}
${analysis.characters?.character_hooks ? '- 캐릭터 떡밥: ' + analysis.characters.character_hooks : ''}

**이전 화 내용**:
${currentContent.slice(-2000)}

다음 화를 작성하세요 (순수 소설 텍스트만, 설명 없이):`,
        maxTokens: 2000,
        temperature: 0.8,
      });

      // Create new chapter with next episode
      const newChapter = {
        id: Date.now().toString(),
        title: `${currentProject?.chapters.length ? currentProject.chapters.length + 1 : 1}화`,
        order: (currentProject?.chapters.length || 0) + 1,
        scenes: [{
          id: Date.now().toString(),
          title: 'Scene 1',
          content: response.text,
          order: 1,
          characters: [],
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        wordCount: response.text.trim().split(/\s+/).filter(Boolean).length,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { addChapter: addChapterFn, setActiveDocument: setActiveDocumentFn } = useAppStore.getState();
      addChapterFn(newChapter);
      setActiveDocumentFn(newChapter.id);

      alert('✅ 다음 화가 작성되었습니다!');
    } catch (error: any) {
      console.error('Next episode error:', error);
      alert('다음 화 작성 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsWritingNext(false);
    }
  };

  // Revise current content based on analysis
  const handleReviseContent = async () => {
    if (!analysis || !activeDocumentId) return;

    const activeChapter = currentProject?.chapters.find(ch => ch.id === activeDocumentId);
    if (!activeChapter) return;

    setIsRevising(true);
    try {
      const { claudeServiceProxy } = await import('../../services/api/aiServiceProxy');
      const currentContent = activeChapter.scenes[0]?.content || '';

      const response = await claudeServiceProxy.generateText({
        prompt: `당신은 국내 웹소설 전문 편집자입니다. 다음 원고를 수정하세요.

**수정 우선순위**:
${analysis.revision_priority ? analysis.revision_priority.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n') : ''}

**절벽 엔딩 강화**:
${analysis.cliffhanger_suggestions ? analysis.cliffhanger_suggestions[0] : '마지막을 더 강렬하게'}

**상업성 체크리스트 반영**:
${analysis.commercial_checklist ? analysis.commercial_checklist.filter((item: any) => !item.status).map((item: any) => `- ${item.item}: ${item.feedback}`).join('\n') : ''}

**원본**:
${currentContent}

수정된 원고를 작성하세요 (순수 소설 텍스트만, 설명 없이):`,
        maxTokens: 2000,
        temperature: 0.7,
      });

      // Update current chapter with revised content
      const wordCount = response.text.trim().split(/\s+/).filter(Boolean).length;
      const updatedScenes = activeChapter.scenes.map((scene, idx) =>
        idx === 0 ? { ...scene, content: response.text } : scene
      );

      updateChapter(activeDocumentId, {
        scenes: updatedScenes,
        wordCount,
        updatedAt: new Date(),
      });

      alert('✅ 원고가 수정되었습니다!');
    } catch (error: any) {
      console.error('Revision error:', error);
      alert('원고 수정 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
      >
        <FiBarChart2 size={18} />
        {isAnalyzing ? '분석 중...' : 'AI 스토리 분석'}
      </button>

      {/* Action buttons when analysis exists */}
      {analysis && !isAnalyzing && (
        <div className="flex gap-2">
          <button
            onClick={handleWriteNextEpisode}
            disabled={isWritingNext}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            title="분석 결과를 반영하여 다음 화 자동 작성"
          >
            <FiPlus size={16} />
            {isWritingNext ? '작성 중...' : '다음 화 작성'}
          </button>
          <button
            onClick={handleReviseContent}
            disabled={isRevising}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            title="분석 결과를 반영하여 현재 회차 수정"
          >
            <FiBarChart2 size={16} />
            {isRevising ? '수정 중...' : '원고 수정'}
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            글을 분석하는 중입니다...
          </p>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <div className="space-y-4">
          {/* Episode Analysis */}
          {analysis.episode_analysis && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                📊 회차 분석
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">현재 분량:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.episode_analysis.current_length}자
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">목표 분량:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.episode_analysis.target_length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">템포:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.episode_analysis.pacing}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">절벽 강도:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {analysis.episode_analysis.cliffhanger_strength}/10
                  </span>
                </div>
                {analysis.episode_analysis.cliffhanger_feedback && (
                  <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 p-2 rounded mt-2">
                    💡 {analysis.episode_analysis.cliffhanger_feedback}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Commercial Checklist */}
          {analysis.commercial_checklist && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                💰 상업성 체크리스트
              </h3>
              <div className="space-y-2">
                {analysis.commercial_checklist.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      item.status
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base">
                        {item.status ? '✅' : '❌'}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {item.item}
                        </p>
                        {item.feedback && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {item.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cliffhanger Suggestions */}
          {analysis.cliffhanger_suggestions && analysis.cliffhanger_suggestions.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                🔥 절벽 엔딩 아이디어
              </h3>
              <ul className="space-y-2">
                {analysis.cliffhanger_suggestions.map((suggestion: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-red-600 dark:text-red-400 font-bold">{idx + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Episode Ideas */}
          {analysis.next_episode_ideas && analysis.next_episode_ideas.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                ▶️ 다음 화 전개 아이디어
              </h3>
              <ul className="space-y-2">
                {analysis.next_episode_ideas.map((idea: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-purple-600 dark:text-purple-400">→</span>
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Characters */}
          {analysis.characters && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                👥 캐릭터 분석
              </h3>
              {analysis.characters.identified?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    등장 캐릭터:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.characters.identified.map((char: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.characters.protagonist_appeal && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">주인공 매력:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {analysis.characters.protagonist_appeal}
                  </p>
                </div>
              )}
              {analysis.characters.character_hooks && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">떡밥/미스터리:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {analysis.characters.character_hooks}
                  </p>
                </div>
              )}
              {analysis.characters.missing && (
                <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                  💡 {analysis.characters.missing}
                </p>
              )}
            </div>
          )}

          {/* Plot */}
          {analysis.plot && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                📖 플롯 분석
              </h3>
              {analysis.plot.hook_strength && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">도입부 훅:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.plot.hook_strength}</p>
                </div>
              )}
              {analysis.plot.conflict_escalation && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">갈등 고조:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.plot.conflict_escalation}</p>
                </div>
              )}
              {analysis.plot.mystery_boxes && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">미해결 떡밥:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.plot.mystery_boxes}</p>
                </div>
              )}
              {analysis.plot.next_episode_hook && (
                <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  🎣 {analysis.plot.next_episode_hook}
                </p>
              )}
            </div>
          )}

          {/* Revision Priority */}
          {analysis.revision_priority && analysis.revision_priority.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                🔧 수정 우선순위
              </h3>
              <ul className="space-y-2">
                {analysis.revision_priority.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-orange-600 dark:text-orange-400 font-bold">{idx + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw text fallback */}
          {analysis.raw && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                AI 분석 결과
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {analysis.raw}
              </p>
            </div>
          )}
        </div>
      )}

      {!analysis && !isAnalyzing && (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          <FiBarChart2 className="mx-auto mb-3 text-gray-400" size={40} />
          <p>AI가 글을 분석하여</p>
          <p>캐릭터, 플롯, 부족한 요소를</p>
          <p>체크리스트로 보여줍니다</p>
        </div>
      )}
    </div>
  );
};

const SettingsTab: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const { user } = useAuthStore();
  const [selectedProvider, setSelectedProvider] = useState<'github' | 'openai-oauth' | 'anthropic' | 'openai'>('github');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load saved keys from localStorage
  useEffect(() => {
    const savedAnthropicKey = localStorage.getItem('anthropic_api_key') || '';
    const savedOpenaiKey = localStorage.getItem('openai_api_key') || '';
    const savedProvider = localStorage.getItem('ai_provider') as 'github' | 'openai-oauth' | 'anthropic' | 'openai' || 'github';

    setAnthropicKey(savedAnthropicKey);
    setOpenaiKey(savedOpenaiKey);
    setSelectedProvider(savedProvider);
  }, []);

  const handleOpenAIOAuth = async () => {
    setIsLoggingIn(true);

    try {
      const authUrl = await authService.getOpenAIAuthUrl();

      // Open browser for OAuth using Tauri
      await invoke('plugin:opener|open', { path: authUrl });

      alert('브라우저에서 OpenAI 로그인을 완료해주세요. 로그인 후 자동으로 연결됩니다.');
    } catch (error) {
      console.error('OpenAI OAuth error:', error);
      alert('OpenAI 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveApiKey = () => {
    setIsSavingKey(true);

    try {
      if (selectedProvider === 'anthropic' && anthropicKey.trim()) {
        localStorage.setItem('anthropic_api_key', anthropicKey.trim());
        localStorage.setItem('ai_provider', 'anthropic');
      } else if (selectedProvider === 'openai' && openaiKey.trim()) {
        localStorage.setItem('openai_api_key', openaiKey.trim());
        localStorage.setItem('ai_provider', 'openai');
      } else if (selectedProvider === 'github') {
        localStorage.setItem('ai_provider', 'github');
      } else if (selectedProvider === 'openai-oauth') {
        localStorage.setItem('ai_provider', 'openai-oauth');
      }

      alert('설정이 저장되었습니다. 페이지를 새로고침해주세요.');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Provider Selection */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🤖 AI 제공자
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="github"
              checked={selectedProvider === 'github'}
              onChange={() => setSelectedProvider('github')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                GitHub Models (무료)
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                OAuth 로그인 · 50회/일 제한 · 빠른 응답
              </div>
              {user?.hasGitHubToken && selectedProvider === 'github' && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ 연결됨
                </div>
              )}
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="openai-oauth"
              checked={selectedProvider === 'openai-oauth'}
              onChange={() => setSelectedProvider('openai-oauth')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                OpenAI OAuth (ChatGPT Plus/Pro)
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                OAuth 로그인 · ChatGPT Plus 구독 필요 · GPT-4 사용
              </div>
              {user?.provider === 'openai' && user?.hasOpenAIToken && selectedProvider === 'openai-oauth' && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ 연결됨
                </div>
              )}
            </div>
          </label>

          {selectedProvider === 'openai-oauth' && (
            <div className="ml-6 space-y-2">
              <button
                onClick={handleOpenAIOAuth}
                disabled={isLoggingIn}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoggingIn ? '로그인 중...' : 'OpenAI로 로그인'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ChatGPT Plus 또는 Pro 구독이 필요합니다.
              </p>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="anthropic"
              checked={selectedProvider === 'anthropic'}
              onChange={() => setSelectedProvider('anthropic')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                Anthropic (Claude) - API Key
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                API Key 필요 · 유료 · 고품질 응답
              </div>
            </div>
          </label>

          {selectedProvider === 'anthropic' && (
            <div className="ml-6 space-y-2">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  API Key 발급받기 →
                </a>
              </p>
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="openai"
              checked={selectedProvider === 'openai'}
              onChange={() => setSelectedProvider('openai')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                OpenAI (GPT)
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                API Key 필요 · 유료 · 범용 모델
              </div>
            </div>
          </label>

          {selectedProvider === 'openai' && (
            <div className="ml-6 space-y-2">
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  API Key 발급받기 →
                </a>
              </p>
            </div>
          )}

          <button
            onClick={handleSaveApiKey}
            disabled={isSavingKey}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSavingKey ? '저장 중...' : 'AI 설정 저장'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          테마
        </label>
        <select
          value={settings.theme}
          onChange={(e) => updateSettings({ theme: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="light">라이트</option>
          <option value="dark">다크</option>
          <option value="auto">자동</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          폰트 크기: {settings.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="24"
          value={settings.fontSize}
          onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          폰트 패밀리
        </label>
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="serif">Serif</option>
          <option value="sans">Sans-serif</option>
          <option value="mono">Monospace</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => updateSettings({ autoSave: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            자동 저장
          </span>
        </label>
      </div>
    </div>
  );
};
