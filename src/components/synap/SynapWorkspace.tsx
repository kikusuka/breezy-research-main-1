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
}

export const SynapWorkspace: React.FC<SynapWorkspaceProps> = ({
  productMode,
  onSelectProductMode,
  onOpenProfile,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentNotebook =
    notebooks.find((n) => n.id === activeNotebookId) || notebooks[0];

  const updateCurrentNotebook = (updater: (nb: SynapNotebook) => SynapNotebook) => {
    setNotebooks((prev) => {
      const next = prev.map((n) =>
        n.id === currentNotebook.id ? updater(n) : n
      );
      synapService.saveNotebooks(next);
      return next;
    });
  };

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
    synapService.setActiveNotebookId(id);
    setActiveView('active-notebook');
  };

  const handleNewNotebook = () => {
    const title = prompt('Enter Notebook Title (e.g. "Advanced Electrophysiology")');
    if (!title) return;
    const newNb: SynapNotebook = {
      id: `nb-${Date.now()}`,
      title,
      courseCode: 'Bio 405',
      track: 'Neuroscience Core',
      examDate: 'June 12',
      daysLeft: 28,
      readiness: 45,
      masteredCount: 12,
      weakCount: 4,
      sourceCount: 0,
      createdAt: new Date().toISOString(),
      topicTree: [
        { id: `t-${Date.now()}-1`, name: 'Synaptic Integration', progress: 50 },
      ],
      sources: [],
      chat: [],
      studyItems: [],
    };
    const next = [newNb, ...notebooks];
    setNotebooks(next);
    synapService.saveNotebooks(next);
    setActiveNotebookId(newNb.id);
    synapService.setActiveNotebookId(newNb.id);
    setActiveView('active-notebook');
    showToast(`Created "${title}" notebook.`);
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
          readinessPercentage={currentNotebook.readiness || 78}
          productMode={productMode}
          onSelectProductMode={onSelectProductMode}
          onOpenQuickJump={() => setActiveView('weak-spots')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* View Router */}
        <main className="relative pt-20 w-full min-h-screen px-4 sm:px-8 pb-12 bg-[#0A0A0F]">
          {activeView === 'notebooks' && (
            <SynapNotebooksView
              notebooks={notebooks}
              onSelectNotebook={handleSelectNotebook}
              onNewNotebook={handleNewNotebook}
              onInspectWeakSpots={() => setActiveView('weak-spots')}
              onResumeReview={() => setActiveView('flashcard-review')}
              onStartQuiz={() => setActiveView('quiz-mode')}
            />
          )}

          {activeView === 'active-notebook' && (
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
              onStartTriage={() => setActiveView('flashcard-review')}
              onReviewCard={(concept) => {
                showToast(`Assembling triage for ${concept}...`);
                setActiveView('flashcard-review');
              }}
            />
          )}

          {activeView === 'flashcard-review' && (
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

          {activeView === 'quiz-mode' && (
            <SynapQuizView
              studyItems={currentNotebook.studyItems}
              onAnswerQuestion={(isCorrect) => {
                showToast(
                  isCorrect
                    ? 'Correct response! Readiness +3.2%'
                    : 'Miss recorded. Added to Weak Spots matrix.'
                );
              }}
              onExplainWithSynap={(prompt) => {
                setActiveView('active-notebook');
                handleSendMessage(prompt);
              }}
            />
          )}

          {activeView === 'study-plan' && (
            <SynapStudyPlanView
              onStartFlashcards={() => setActiveView('flashcard-review')}
            />
          )}
        </main>
      </div>

      {/* Modals */}
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
    </div>
  );
};
