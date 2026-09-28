import React from 'react';
import { Sidebar, ConsoleTab } from '../components/console/Sidebar';
import { TopBar, ProductMode } from '../components/console/TopBar';
import { ResearchConversationView } from '../components/console/ResearchConversationView';
import { ResearchNotesView } from '../components/console/ResearchNotesView';
import { ModelsConsensusView } from '../components/console/ModelsConsensusView';
import { WorkspaceSettingsView } from '../components/console/WorkspaceSettingsView';
import { LandingPageView } from '../components/console/LandingPageView';
import { CommandPaletteModal } from '../components/console/CommandPaletteModal';
import { ProfileSettingsModal } from '../components/console/ProfileSettingsModal';
import { DebateSession } from '../types';

interface SynthexisProductProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  sessions: DebateSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  consensusMode: boolean;
  onToggleConsensusMode: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  isCommandPaletteOpen: boolean;
  onCloseCommandPalette: () => void;
  onOpenCommandPalette: () => void;
  isProfileSettingsOpen: boolean;
  onCloseProfile: () => void;
  productMode: ProductMode;
  onSelectProductMode: (mode: ProductMode) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentSession: DebateSession | undefined;
  isDeliberating: boolean;
  activeRound: number;
  streamingText: string;
  streamingRole: string;
  startDebate: (prompt?: string, depth?: string) => void;
  researchEvents: string[];
  handleExportMarkdown: () => void;
  keys: any;
  handleSaveKeys: (keys: any) => void;
  handleDeleteSession: (id: string, e: React.MouseEvent) => void;
  loadSessions: () => DebateSession[];
  setSessions: React.Dispatch<React.SetStateAction<DebateSession[]>>;
  appToast: string | null;
}

export const SynthexisProduct: React.FC<SynthexisProductProps> = ({
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  consensusMode,
  onToggleConsensusMode,
  isMobileMenuOpen,
  onToggleMobileMenu,
  isCommandPaletteOpen,
  onCloseCommandPalette,
  onOpenCommandPalette,
  isProfileSettingsOpen,
  onCloseProfile,
  productMode,
  onSelectProductMode,
  theme,
  onToggleTheme,
  currentSession,
  isDeliberating,
  activeRound,
  streamingText,
  streamingRole,
  startDebate,
  researchEvents,
  handleExportMarkdown,
  keys,
  handleSaveKeys,
  handleDeleteSession,
  loadSessions,
  setSessions,
  appToast,
}) => {
  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onNewSession={onNewSession}
        consensusMode={consensusMode}
        onToggleConsensusMode={onToggleConsensusMode}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={onToggleMobileMenu}
        onOpenProfile={() => {}}
        onDeleteSession={handleDeleteSession}
      />

      <div className="pl-0 lg:pl-64 flex flex-col min-h-screen">
        <TopBar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          productMode={productMode}
          onSelectProductMode={onSelectProductMode}
          onNewResearch={onNewSession}
          onOpenSearch={onOpenCommandPalette}
          onToggleMobileMenu={onToggleMobileMenu}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="relative pt-14 bg-[#10141a] min-h-screen flex-1 flex flex-col">
          {activeTab === 'chat' && (
            currentSession ? (
              <ResearchConversationView
                session={currentSession}
                isDeliberating={isDeliberating}
                activeRound={activeRound}
                streamingRoundText={streamingText}
                streamingRole={streamingRole}
                onStartDebate={startDebate}
                researchEvents={researchEvents}
                onSaveNote={(title, content) => {
                  // Handled in orchestrator
                }}
                onExportMarkdown={handleExportMarkdown}
                keys={keys}
                onOpenNotes={() => onSelectTab('notes')}
                onExportToSynap={async () => {}}
                onOpenInIde={() => {}}
              />
            ) : (
              <LandingPageView
                onLaunchWorkspace={(query, depth) => {
                  if (query) {
                    startDebate(query, depth);
                  }
                  onSelectTab('chat');
                }}
                onOpenNotes={() => onSelectTab('notes')}
                onOpenModels={() => onSelectTab('models')}
              />
            )
          )}

          {activeTab === 'notes' && (
            <ResearchNotesView
              sessions={sessions}
              onSelectNotePrompt={(prompt) => {
                if (prompt) {
                  startDebate(prompt);
                }
                onSelectTab('chat');
              }}
              onSync={() => {
                const refreshed = loadSessions();
                setSessions(refreshed || []);
              }}
            />
          )}

          {activeTab === 'models' && (
            <ModelsConsensusView onOpenSettings={() => onSelectTab('settings')} />
          )}

          {activeTab === 'settings' && (
            <WorkspaceSettingsView keys={keys} onSaveKeys={handleSaveKeys} />
          )}

          {activeTab === 'landing' && (
            <LandingPageView
              onLaunchWorkspace={(query, depth) => {
                if (query) {
                  startDebate(query, depth);
                }
                onSelectTab('chat');
              }}
              onOpenNotes={() => onSelectTab('notes')}
              onOpenModels={() => onSelectTab('models')}
            />
          )}
        </main>
      </div>

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={onCloseCommandPalette}
        onSelectTab={onSelectTab}
        sessions={sessions}
        onSelectSession={onSelectSession}
        onNewSession={onNewSession}
        onSelectProductMode={onSelectProductMode}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={onCloseProfile}
        keys={keys}
        onSaveKeys={handleSaveKeys}
      />

      {appToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e2d] text-stone-100 px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          <span>{appToast}</span>
        </div>
      )}
    </div>
  );
};
