import React, { useState, useEffect } from 'react';
import { SynapSidebar } from './SynapSidebar';
import { SynapHeader } from './SynapHeader';
import { SynapNotebooksView } from './SynapNotebooksView';
import { SynapActiveNotebookView } from './SynapActiveNotebookView';
import { SynapWeakSpotsView } from './SynapWeakSpotsView';
import { SynapFlashcardView } from './SynapFlashcardView';
import { SynapQuizView } from './SynapQuizView';
import { SynapStudyPlanView } from './SynapStudyPlanView';
import { SynapProviderModal } from './SynapProviderModal';
import { SynapAddSourceModal } from './SynapAddSourceModal';
import { SynapCreateNotebookModal } from './SynapCreateNotebookModal';
import {
  SynapNavView,
  SynapNotebook,
  SynapProviderConfig,
  SynapChatMessage,
} from '../../types/synap';
import { synapService } from '../../services/synapService';
import { ProductMode } from '../console/TopBar';

interface SynapWorkspaceProps {
  productMode?: ProductMode;
  onSelectProductMode?: (mode: ProductMode) => void;
  onOpenProfile?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const SynapWorkspace: React.FC<SynapWorkspaceProps> = ({
  productMode,
  onSelectProductMode,
  onOpenProfile,
  theme,
  onToggleTheme,
}) => {
  const [activeView, setActiveView] = useState<SynapNavView>('notebooks');
  const [notebooks, setNotebooks] = useState<SynapNotebook[]>(() =>
    synapService.loadNotebooks()
  );
  const [activeNotebookId, setActiveNotebookId] = useState<string>(() =>
    synapService.getActiveNotebookId()
  );
  const [providerConfig, setProviderConfig] = useState<SynapProviderConfig>(() =>
    synapService.getProvider()
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalStudyItems = notebooks.reduce((acc, n) => acc + n.studyItems.length, 0);
  const totalMastered = notebooks.reduce(
    (acc, n) =>
      acc +
      n.studyItems.filter((i) => i.history && i.history.some((h) => h.correct)).length,
    0
  );
  const overallReadiness =
    totalStudyItems > 0 ? Math.round((totalMastered / totalStudyItems) * 100) : 0;

  const currentNotebook =
    notebooks.find((n) => n.id === activeNotebookId) ?? notebooks[0] ?? null;

  const updateCurrentNotebook = (updater: (nb: SynapNotebook) => SynapNotebook) => {
    if (!currentNotebook) return;
    setNotebooks((prev) => {
      const next = prev.map((n) =>
        n.id === currentNotebook.id ? updater(n) : n
      );
      synapService.saveNotebooks(next);
      return next;
    });
  };

  const handleDeleteNotebook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = notebooks.filter((n) => n.id !== id);
    setNotebooks(next);
    synapService.saveNotebooks(next);
    if (activeNotebookId === id) {
      const nextId = next.length > 0 ? next[0].id : '';
      setActiveNotebookId(nextId);
      synapService.setActiveNotebookId(nextId);
    }
    showToast('Course notebook deleted.');
  };

  const handleConfirmClearWorkspace = () => {
    setNotebooks([]);
    synapService.saveNotebooks([]);
    setActiveNotebookId('');
    synapService.setActiveNotebookId('');
    setIsResetConfirmOpen(false);
    showToast('Workspace reset. 0 active notebooks.');
  };

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
    synapService.setActiveNotebookId(id);
    setActiveView('active-notebook');
  };

  const handleCreateNotebook = (
    data: Partial<SynapNotebook>,
    initialSourceText?: string,
    initialSourceTitle?: string
  ) => {
    const initialSources = initialSourceText
      ? [
          {
            id: `src-${Date.now()}`,
            title: initialSourceTitle || `${data.title} - Initial Notes`,
            text: initialSourceText,
            type: 'notes' as const,
            addedAt: 'Just now',
            wordCount: `${initialSourceText.split(/\s+/).length} words`,
            badge: 'User Notes',
          },
        ]
      : [];

    const newNb: SynapNotebook = {
      id: `nb-${Date.now()}`,
      title: data.title || 'Untitled Course',
      courseCode: data.courseCode || 'General',
      track: data.track || 'Course Repository',
      examDate: data.examDate || 'Unscheduled',
      daysLeft: data.daysLeft || 0,
      readiness: 0,
      masteredCount: 0,
      weakCount: 0,
      sourceCount: initialSources.length,
      createdAt: new Date().toISOString(),
      topicTree: [],
      sources: initialSources,
      chat: [],
      studyItems: [],
    };

    const next = [newNb, ...notebooks];
    setNotebooks(next);
    synapService.saveNotebooks(next);
    setActiveNotebookId(newNb.id);
    synapService.setActiveNotebookId(newNb.id);
    setActiveView('active-notebook');
    showToast(`Created "${newNb.title}" notebook.`);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: SynapChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now',
    };

    updateCurrentNotebook((nb) => ({
      ...nb,
      chat: [...nb.chat, userMsg],
    }));

    try {
      const answer = await synapService.queryGroundedAI(
        text,
        currentNotebook.sources
      );
      const assistantMsg: SynapChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: 'Just now',
        citations: currentNotebook.sources.length
          ? [`${currentNotebook.sources[0].title}`]
          : undefined,
      };
      updateCurrentNotebook((nb) => ({
        ...nb,
        chat: [...nb.chat, assistantMsg],
      }));
    } catch (e: any) {
      const errorMsg: SynapChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `Synap Coach: Grounded in your materials — ${e.message}`,
        timestamp: 'Just now',
      };
      updateCurrentNotebook((nb) => ({
        ...nb,
        chat: [...nb.chat, errorMsg],
      }));
    }
  };

  const handleMakeFlashcards = async () => {
    showToast('Generating flashcards from course sources...');
    try {
      const items = await synapService.generateItems(
        currentNotebook,
        'flashcard'
      );
      updateCurrentNotebook((nb) => ({
        ...nb,
        studyItems: [...nb.studyItems, ...items],
      }));
      showToast(`${items.length} flashcards generated.`);
      setActiveView('flashcard-review');
    } catch (e: any) {
      showToast(`Generation error: ${e.message}`);
    }
  };

  const handleAddSource = (title: string, text: string) => {
    const newSource = {
      id: `src-${Date.now()}`,
      title,
      text,
      type: 'notes' as const,
      addedAt: 'Just now',
      wordCount: `${text.split(' ').length} words`,
      badge: 'User Notes',
    };
    updateCurrentNotebook((nb) => ({
      ...nb,
      sources: [newSource, ...nb.sources],
      sourceCount: nb.sources.length + 1,
    }));
    showToast(`Added source "${title}".`);
  };

  const handleRateFlashcard = (
    cardId: string,
    rating: number,
    isCorrect: boolean
  ) => {
    updateCurrentNotebook((nb) => {
      const nextItems = nb.studyItems.map((item) => {
        if (item.id === cardId) {
          return {
            ...item,
            history: [
              ...item.history,
              {
                timestamp: new Date().toISOString(),
                correct: isCorrect,
                rating,
              },
            ],
          };
        }
        return item;
      });
      return { ...nb, studyItems: nextItems };
    });
    showToast(`Recall recorded (${rating === 4 ? 'Easy' : rating === 3 ? 'Good' : rating === 2 ? 'Hard' : 'Again'})`);
  };

  const handleSaveProviderConfig = (cfg: SynapProviderConfig) => {
    setProviderConfig(cfg);
    synapService.saveProvider(cfg);
    showToast('Provider settings updated.');
  };

  return (
    <div className="flex bg-[#0A0A0F] text-[#e4e1ed] min-h-screen font-sans antialiased overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 p-4 rounded-xl bg-[#181824] text-stone-100 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-[#9d85f2] text-[20px]">
            neurology
          </span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-bold">Synap Engine</span>
            <span className="font-mono text-[11px] text-[#A5B0D6]">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* Synap Left Sidebar */}
      <SynapSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenProfile={onOpenProfile || (() => {})}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-72 flex flex-col flex-1 min-h-screen">
        {/* Top Header */}
        <SynapHeader
          readinessPercentage={overallReadiness}
          productMode={productMode}
          onSelectProductMode={onSelectProductMode}
          onOpenQuickJump={() => setActiveView('weak-spots')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          theme={theme}
          onToggleTheme={onToggleTheme}
          activeNotebookTitle={currentNotebook?.title}
          activeDaysLeft={currentNotebook?.daysLeft}
        />

        {/* View Router */}
        <main className="relative pt-20 w-full min-h-screen px-4 sm:px-8 pb-12 bg-[#0A0A0F]">
          {(activeView === 'notebooks' || !currentNotebook) && (
            <SynapNotebooksView
              notebooks={notebooks}
              onSelectNotebook={handleSelectNotebook}
              onNewNotebook={() => setIsCreateNotebookOpen(true)}
              onInspectWeakSpots={() => setActiveView('weak-spots')}
              onResumeReview={() => setActiveView('flashcard-review')}
              onStartQuiz={() => setActiveView('quiz-mode')}
              onClearWorkspace={() => setIsResetConfirmOpen(true)}
              onDeleteNotebook={handleDeleteNotebook}
            />
          )}

          {activeView === 'active-notebook' && currentNotebook && (
            <SynapActiveNotebookView
              notebook={currentNotebook}
              onSendMessage={handleSendMessage}
              onAddSourceModal={() => setIsAddSourceOpen(true)}
              onMakeFlashcards={handleMakeFlashcards}
              onOpenExamProbe={() => setActiveView('weak-spots')}
            />
          )}

          {activeView === 'weak-spots' && (
            <SynapWeakSpotsView
              notebooks={notebooks}
              onStartTriage={() => setActiveView('flashcard-review')}
              onReviewCard={(concept) => {
                showToast(`Assembling triage for ${concept}...`);
                setActiveView('flashcard-review');
              }}
            />
          )}

          {activeView === 'flashcard-review' && currentNotebook && (
            <SynapFlashcardView
              studyItems={currentNotebook.studyItems}
              onRateCard={handleRateFlashcard}
              onExit={() => setActiveView('active-notebook')}
              onAskAiToBreakDown={(concept) => {
                setActiveView('active-notebook');
                handleSendMessage(`Explain: ${concept}`);
              }}
            />
          )}

          {activeView === 'quiz-mode' && currentNotebook && (
            <SynapQuizView
              studyItems={currentNotebook.studyItems}
              onAnswerQuestion={(isCorrect) => {
                showToast(
                  isCorrect
                    ? 'Correct response! Recorded in history.'
                    : 'Miss recorded. Added to review history.'
                );
              }}
              onExplainWithSynap={(prompt) => {
                setActiveView('active-notebook');
                handleSendMessage(prompt);
              }}
              onGoToNotebook={() => setActiveView('active-notebook')}
            />
          )}

          {activeView === 'study-plan' && (
            <SynapStudyPlanView
              notebooks={notebooks}
              onStartFlashcards={() => setActiveView('flashcard-review')}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <SynapCreateNotebookModal
        isOpen={isCreateNotebookOpen}
        onClose={() => setIsCreateNotebookOpen(false)}
        onCreate={handleCreateNotebook}
      />

      <SynapProviderModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={providerConfig}
        onSaveConfig={handleSaveProviderConfig}
      />

      <SynapAddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onAddSource={handleAddSource}
      />

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#161622] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-stone-200">
            <div className="flex items-center gap-3 text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
              <h3 className="font-sans text-base font-bold text-stone-100">Reset Study Workspace</h3>
            </div>
            <p className="font-sans text-xs text-[#cac4d4] leading-relaxed">
              This will permanently remove all stored course notebooks, flashcards, and practice histories from your local browser storage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#cac4d4] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearWorkspace}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ffb4ab] hover:bg-white text-[#690005] transition-colors cursor-pointer shadow-md"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
