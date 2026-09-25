import React from 'react';
import { DebateSession } from '../../types';

export type ConsoleTab = 'chat' | 'notes' | 'models' | 'settings' | 'landing' | 'ide' | 'canvas';

interface SidebarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  sessions: DebateSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  consensusMode?: boolean;
  onToggleConsensusMode?: () => void;
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
        className={`fixed left-0 top-0 h-full w-64 bg-[#12151c] z-50 flex flex-col justify-between border-r border-white/10 transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                onSelectTab('chat');
                onCloseMobile?.();
              }}
              className="text-left"
            >
              <span className="font-serif text-base font-medium tracking-tight text-stone-100">
                Synthexis
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNewSession();
                onSelectTab('chat');
                onCloseMobile?.();
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors"
              title="New Research (⌘N)"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Primary Views Nav */}
          <div className="p-3 border-b border-white/5">
            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('chat');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">forum</span>
                <span>Research Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('notes');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  activeTab === 'notes'
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">bookmark</span>
                <span>Notes & Archive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('models');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  activeTab === 'models'
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">tune</span>
                <span>Models & Calibration</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('ide');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  activeTab === 'ide'
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">code</span>
                <span>Embedded IDE Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('canvas');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  activeTab === 'canvas'
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">dashboard_customize</span>
                <span>Workspace Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('settings');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white/10 text-stone-100 font-medium'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">settings</span>
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Research History List */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <span className="text-[11px] font-sans text-stone-500 uppercase tracking-wider px-2">
              Recent Inquiries
            </span>

            <div className="flex flex-col gap-1">
              {sessions.map((s) => {
                const isActive = s.id === activeSessionId && activeTab === 'chat';
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectSession(s.id);
                      onSelectTab('chat');
                      onCloseMobile?.();
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex flex-col gap-1 ${
                      isActive
                        ? 'bg-white/10 text-stone-100 font-medium border border-white/10'
                        : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-200'
                    }`}
                  >
                    <span className="truncate leading-tight">
                      {s.prompt}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                      <span>{new Date(s.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      {s.evidenceGraph?.sourcesConsulted && s.evidenceGraph.sourcesConsulted.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{s.evidenceGraph.sourcesConsulted.length} sources</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Privacy / Enclave Status */}
        <div className="p-3 border-t border-white/10">
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Local Storage Enclave</span>
            </div>
            <span className="text-stone-500 text-[10px]">Private</span>
          </div>
        </div>
      </aside>
    </>
  );
};
