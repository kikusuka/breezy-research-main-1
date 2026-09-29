import React, { useState, useEffect } from 'react';
import { SynapSidebar } from './SynapSidebar';
import { SynapHeader } from './SynapHeader';
import { SynapNotebooksView } from './SynapNotebooksView';
import { SynapActiveNotebookView } from './SynapActiveNotebookView';
import { SynapWeakSpotsView } from './SynapWeakSpotsView';
import { SynapFlashcardView } from './SynapFlashcardView';
import { SynapQuizView } from './SynapQuizView';
import { SynapStudyPlanView } from './SynapStudyPlanView';
import { SynapExplainItBackView } from './SynapExplainItBackView';
import { SynapProviderModal } from './SynapProviderModal';
import { SynapAddSourceModal } from './SynapAddSourceModal';
import { SynapCreateNotebookModal } from './SynapCreateNotebookModal';
import {
  SynapNavView,
  SynapNotebook,
  SynapProviderConfig,
  SynapChatMessage,
  SynapStudyItem,
} from '../../types/synap';
import { synapService } from '../../services/synapService';
import { runStorageMigration } from '../../services/synapDatabase';
import { scheduleItem, computeNotebookReadiness } from '../../services/scheduler';
import { ProductMode } from '../console/TopBar';

interface SynapWorkspaceProps {
  productMode?: ProductMode;
  onSelectProductMode?: (mode: ProductMode) => void;
  onOpenProfile?: () => void;
}

export const SynapWorkspace: React.FC<SynapWorkspaceProps> = ({
  productMode,
  onSelectProductMode,
  onOpenProfile,
}) => {
  const [activeView, setActiveView] = useState<SynapNavView>('notebooks');
  const [notebooks, setNotebooks] = useState<SynapNotebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [providerConfig, setProviderConfig] = useState<SynapProviderConfig>(() =>
    synapService.getProvider()
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initDB() {
      try {
        await runStorageMigration();
        const list = await synapService.loadNotebooks();
        setNotebooks(list);
        const activeId = synapService.getActiveNotebookId() || (list[0] ? list[0].id : '');
        setActiveNotebookId(activeId);
      } catch (err) {
        console.error('Failed to initialize Synap IndexedDB workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    initDB();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute overall readiness across notebooks using scheduler prediction
  let validReadinessSum = 0;
  let validCount = 0;
  for (const nb of notebooks) {
    const res = computeNotebookReadiness(nb.studyItems, nb.examDate);
    if (res) {
      validReadinessSum += res.readiness;
      validCount++;
    }
  }
  const overallReadiness = validCount > 0 ? Math.round(validReadinessSum / validCount) : 0;

  const currentNotebook =
    notebooks.find((n) => n.id === activeNotebookId) ?? notebooks[0] ?? null;

  const updateCurrentNotebook = async (updater: (nb: SynapNotebook) => SynapNotebook) => {
    if (!currentNotebook) return;
    const updated = updater(currentNotebook);
    await synapService.saveNotebook(updated);
    setNotebooks((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await synapService.deleteNotebook(id);
    const next = await synapService.loadNotebooks();
    setNotebooks(next);
    if (activeNotebookId === id) {
      const nextId = next.length > 0 ? next[0].id : '';
      setActiveNotebookId(nextId);
      synapService.setActiveNotebookId(nextId);
    }
    showToast('Course notebook deleted.');
  };

  const handleConfirmClearWorkspace = async () => {
    for (const nb of notebooks) {
      await synapService.deleteNotebook(nb.id);
    }
    setNotebooks([]);
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

  const handleCreateNotebook = async (
    data: Partial<SynapNotebook>,
    initialSourceText?: string,
    initialSourceTitle?: string
  ) => {
    const newNb = await synapService.createNotebook(
      data.title || 'Untitled Course',
      data.courseCode || 'GEN-ST',
      data.examDate
    );

    if (initialSourceText) {
      await synapService.addSourceToNotebook(
        newNb.id,
        initialSourceTitle || `${newNb.title} - Initial Notes`,
        'notes',
        initialSourceText
      );
    }

    const list = await synapService.loadNotebooks();
    setNotebooks(list);
    setActiveNotebookId(newNb.id);
    synapService.setActiveNotebookId(newNb.id);
    setActiveView('active-notebook');
    showToast(`Created "${newNb.title}" notebook.`);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentNotebook) return;
    const userMsg: SynapChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now',
    };

    await updateCurrentNotebook((nb) => ({
      ...nb,
      chat: [...nb.chat, userMsg],
    }));

    try {
      const answer = await synapService.queryGroundedAI(
        currentNotebook.id,
        text
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
      await updateCurrentNotebook((nb) => ({
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
      await updateCurrentNotebook((nb) => ({
        ...nb,
        chat: [...nb.chat, errorMsg],
      }));
    }
  };

  const handleMakeFlashcards = async () => {
    if (!currentNotebook) return;
    showToast('Generating flashcards from course sources...');
    try {
      const items = await synapService.generateItems(
        currentNotebook.id,
        'flashcard'
      );
      await updateCurrentNotebook((nb) => ({
        ...nb,
        studyItems: [...nb.studyItems, ...items],
      }));
      showToast(`${items.length} flashcards generated.`);
      setActiveView('flashcard-review');
    } catch (e: any) {
      showToast(`Generation error: ${e.message}`);
    }
  };

  const handleAddSource = async (title: string, text: string) => {
    if (!currentNotebook) return;
    await synapService.addSourceToNotebook(
      currentNotebook.id,
      title,
      'notes',
      text
    );
    const list = await synapService.loadNotebooks();
    setNotebooks(list);
    showToast(`Added source "${title}".`);
  };

  const handleRateFlashcard = async (
    cardId: string,
    rating: number,
    isCorrect: boolean
  ) => {
    if (!currentNotebook) return;
    const nextItems = currentNotebook.studyItems.map((item) => {
      if (item.id === cardId) {
        // Apply SuperMemo-2 (SM-2) scheduling update
        const sm2State = scheduleItem(item, rating);
        return {
          ...item,
          ...sm2State,
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

    const updatedNb = { ...currentNotebook, studyItems: nextItems };
    await synapService.saveNotebook(updatedNb);
    setNotebooks((prev) => prev.map((n) => (n.id === updatedNb.id ? updatedNb : n)));
    showToast(`Recall recorded (${rating === 4 ? 'Easy' : rating === 3 ? 'Good' : rating === 2 ? 'Hard' : 'Again'})`);
  };

  const handleSaveProviderConfig = (cfg: SynapProviderConfig) => {
    setProviderConfig(cfg);
    synapService.saveProvider(cfg);
    showToast('Provider settings updated.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F] text-stone-300 font-sans">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin"></span>
          <span className="text-xs font-mono uppercase tracking-widest">Loading Synap IndexedDB Storage...</span>
        </div>
      </div>
    );
  }

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
          activeNotebookTitle={currentNotebook?.title}
          activeDaysLeft={currentNotebook?.examDate ? Math.max(0, Math.ceil((new Date(currentNotebook.examDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))) : undefined}
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

          {activeView === 'explain' && currentNotebook && (
            <SynapExplainItBackView
              notebook={currentNotebook}
              onAddStudyItems={async (items) => {
                await updateCurrentNotebook((nb) => ({
                  ...nb,
                  studyItems: [...nb.studyItems, ...items],
                }));
              }}
              onUpdateNotebook={async (nb) => {
                await synapService.saveNotebook(nb);
                setNotebooks((prev) => prev.map((n) => (n.id === nb.id ? nb : n)));
              }}
              toast={showToast}
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
