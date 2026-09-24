import React from 'react';
import { DebateSession } from '../../types';

export type ConsoleTab = 'chat' | 'notes' | 'models' | 'settings' | 'landing';

interface SidebarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  sessions: DebateSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  consensusMode: boolean;
  onToggleConsensusMode: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  consensusMode,
  onToggleConsensusMode,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between border-r border-outline-variant/30 transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-outline-variant/20">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => onSelectTab('landing')}
              title="Go to Product Overview"
            >
              <div className="relative flex items-center justify-center w-7 h-7 rounded bg-surface-container-high border border-primary/30 shadow-[0_0_12px_rgba(170,199,255,0.15)]">
                <span className="material-symbols-outlined text-primary text-[16px]">hub</span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_#7bdb80]"></span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-sm font-semibold tracking-tight text-on-surface">
                  Synthexis
                </span>
                <span className="font-mono text-[9px] text-tertiary uppercase tracking-widest leading-none">
                  Protocol v2.4
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container border border-secondary/30">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-[9px] text-secondary font-medium tracking-tight">
                3 Nodes
              </span>
            </div>
          </div>

          {/* Dialectic Workspace Label */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-semibold text-outline tracking-wider">
              Workspace Dialectic
            </span>
          </div>

          {/* Navigation Links */}
          <div className="px-2">
            <nav className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('chat');
                  onCloseMobile?.();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs transition-all duration-150 ${
                  activeTab === 'chat'
                    ? 'bg-surface-container-high text-on-surface font-medium border border-outline-variant/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      activeTab === 'chat' ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    forum
                  </span>
                  <span>Chat</span>
                </div>
                <span className="font-mono text-[10px] text-outline">⌘1</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('notes');
                  onCloseMobile?.();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs transition-all duration-150 ${
                  activeTab === 'notes'
                    ? 'bg-surface-container-high text-on-surface font-medium border border-outline-variant/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      activeTab === 'notes' ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    auto_stories
                  </span>
                  <span>Research Notes</span>
                </div>
                <span className="font-mono text-[10px] text-outline">⌘2</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('models');
                  onCloseMobile?.();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs transition-all duration-150 ${
                  activeTab === 'models'
                    ? 'bg-surface-container-high text-on-surface font-medium border border-outline-variant/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      activeTab === 'models' ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    account_tree
                  </span>
                  <span>Models & Consensus</span>
                </div>
                <span className="font-mono text-[10px] text-outline">⌘3</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('settings');
                  onCloseMobile?.();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs transition-all duration-150 ${
                  activeTab === 'settings'
                    ? 'bg-surface-container-high text-on-surface font-medium border border-outline-variant/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      activeTab === 'settings' ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    tune
                  </span>
                  <span>Settings</span>
                </div>
                <span className="font-mono text-[10px] text-outline">⌘,</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('landing');
                  onCloseMobile?.();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg font-sans text-xs transition-all duration-150 ${
                  activeTab === 'landing'
                    ? 'bg-surface-container-high text-on-surface font-medium border border-outline-variant/60 shadow-[0_2px_10px_rgba(0,0,0,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      activeTab === 'landing' ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    public
                  </span>
                  <span>Product Overview</span>
                </div>
                <span className="font-mono text-[9px] text-primary uppercase px-1 rounded bg-primary/10">
                  Intro
                </span>
              </button>
            </nav>
          </div>

          {/* Recent Sessions List */}
          <div className="mt-4 flex-1 min-h-0 flex flex-col px-2 border-t border-outline-variant/15 pt-3">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                Recent Sessions
              </span>
              <button
                type="button"
                onClick={() => {
                  onNewSession();
                  onSelectTab('chat');
                }}
                className="text-outline hover:text-on-surface transition-colors p-0.5 rounded hover:bg-surface-container"
                title="Start New Dialectic Inquiry (⌘N)"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 mt-1 pr-1">
              {sessions.map((s) => {
                const isSelected = activeSessionId === s.id;
                const preview = s.prompt || 'Untitled Research Inquiry';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSession(s.id);
                      onSelectTab('chat');
                      onCloseMobile?.();
                    }}
                    className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors text-xs ${
                      isSelected && activeTab === 'chat'
                        ? 'bg-surface-container-high text-on-surface font-medium'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          isSelected ? 'text-primary' : 'text-outline group-hover:text-primary'
                        } transition-colors`}
                      >
                        chat_bubble_outline
                      </span>
                      <span className="truncate max-w-[145px]">{preview}</span>
                    </div>
                    <span className="font-mono text-[9px] text-outline shrink-0 ml-1">
                      {s.steps?.length > 0 ? `${s.steps.length}n` : 'idle'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lower Dialectic Engine & User Profile */}
        <div className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest/80 flex flex-col gap-2.5">
          {/* Dialectic Engine Box */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-primary">alt_route</span>
                <span className="font-mono text-[10px] uppercase font-semibold text-on-surface-variant">
                  Dialectic Engine
                </span>
              </div>
              <span className="font-mono text-[10px] text-secondary bg-secondary-container/40 px-1.5 py-0.5 rounded border border-secondary/20">
                Trio Active
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="font-sans text-[11px] text-on-surface font-medium">Consensus Mode</span>
                <span className="font-mono text-[9px] text-outline">3-Way Cross Synthesis</span>
              </div>
              <button
                type="button"
                onClick={onToggleConsensusMode}
                className={`w-8 h-4 rounded-full relative p-0.5 transition-colors border ${
                  consensusMode
                    ? 'bg-primary-container border-primary/50'
                    : 'bg-surface-container-highest border-outline-variant'
                }`}
                title="Toggle Consensus Cross-Synthesis"
              >
                <div
                  className={`w-3 h-3 rounded-full bg-on-primary shadow-xs transition-transform ${
                    consensusMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* User Profile Bar */}
          <div
            onClick={() => onSelectTab('settings')}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-xs font-medium text-on-surface truncate">Dr. K. Vance</span>
                <span className="font-mono text-[10px] text-outline truncate">Lead Architect</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">more_vert</span>
          </div>
        </div>
      </aside>
    </>
  );
};
