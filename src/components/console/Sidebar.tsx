import React from 'react';
import { DebateSession } from '../../types';
import { SynthexisLogoIcon } from '../icons/ProductLogos';
import { userProfileService } from '../../services/userProfileService';
import { PWAInstallButton } from './PWAInstallButton';

export type ConsoleTab = 'chat' | 'notes' | 'models' | 'settings' | 'landing';

interface SidebarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  sessions: DebateSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  synthexisMode?: boolean;
  onToggleSynthexisMode?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenProfile?: () => void;
  onDeleteSession?: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  synthexisMode = true,
  onToggleSynthexisMode,
  isOpenMobile = false,
  onCloseMobile,
  onOpenProfile,
  onDeleteSession,
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
        className={`fixed left-0 top-0 h-full w-64 bg-stone-950 z-50 flex flex-col justify-between border-r border-stone-800/60 transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header: Editorial Wordmark */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-stone-800/40">
            <button
              type="button"
              onClick={() => {
                onSelectTab('landing');
                onCloseMobile?.();
              }}
              className="text-left flex items-center gap-2.5 group"
            >
              <div className="w-6 h-6 rounded-sm bg-stone-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                 <span className="material-symbols-outlined text-stone-950 text-[16px] font-bold">adjust</span>
              </div>
              <span className="font-display text-lg tracking-tight text-stone-100 italic">
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
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-100 hover:bg-stone-800 transition-all border border-stone-800/40"
              title="New Inquiry"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Primary Views Nav: Minimalist unboxed */}
          <div className="px-3 py-4 border-b border-stone-800/40">
            <nav className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('chat');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-all ${
                  activeTab === 'chat'
                    ? 'bg-stone-800 text-stone-100 font-bold'
                    : 'text-stone-500 hover:bg-stone-900/50 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                <span>Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('notes');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-all ${
                  activeTab === 'notes'
                    ? 'bg-stone-800 text-stone-100 font-bold'
                    : 'text-stone-500 hover:bg-stone-900/50 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">folder_special</span>
                <span>Archives</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('models');
                  onCloseMobile?.();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-all ${
                  activeTab === 'models'
                    ? 'bg-stone-800 text-stone-100 font-bold'
                    : 'text-stone-500 hover:bg-stone-900/50 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">hub</span>
                <span>Model_Matrix</span>
              </button>
            </nav>
          </div>

          {/* Synthexis Mode Toggle: Minimal */}
          <div className="mx-3 mt-4 mb-2 px-3 py-3 rounded-xl bg-stone-900/60 border border-stone-800/60 flex flex-col gap-2 shrink-0 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">Review_Engine</span>
              <button
                type="button"
                onClick={onToggleSynthexisMode}
                className={`w-9 h-5 rounded p-0.5 transition-colors cursor-pointer ${
                  synthexisMode ? 'bg-stone-100' : 'bg-stone-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-sm bg-stone-950 shadow-xs transition-transform duration-200 ${
                    synthexisMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-stone-600 leading-relaxed font-mono uppercase tracking-tighter">
              {synthexisMode 
                ? 'Synthexis_Active' 
                : 'Direct_Mode'}
            </p>
          </div>

          {/* Research History List: Editorial List */}
          <div className="flex-1 overflow-y-auto p-3 mt-4 flex flex-col gap-3">
            <span className="text-[10px] font-sans text-stone-500 uppercase tracking-[0.15em] px-3 font-bold">
              Journal
            </span>

            <div className="flex flex-col gap-0.5">
              {sessions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-stone-600 font-sans italic">
                  No recorded entries.
                </p>
              ) : (
                sessions.map((s) => {
                  if (!s) return null;
                  const isActive = s.id === activeSessionId && activeTab === 'chat';
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectSession(s.id);
                        onSelectTab('chat');
                        onCloseMobile?.();
                      }}
                      className={`group w-full text-left px-3 py-2 rounded-lg transition-all flex items-start justify-between gap-2 cursor-pointer border border-transparent ${
                        isActive
                          ? 'bg-stone-800/40 text-stone-100 border-stone-700/50 shadow-sm'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="truncate text-[13px] leading-snug font-medium">
                          {s.prompt}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono uppercase tracking-tight">
                          <span>{new Date(s.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          {s.evidenceGraph?.sourcesConsulted && s.evidenceGraph.sourcesConsulted.length > 0 && (
                            <>
                              <span className="text-stone-700">/</span>
                              <span>{s.evidenceGraph.sourcesConsulted.length} SRC</span>
                            </>
                          )}
                        </div>
                      </div>

                      {onDeleteSession && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id, e);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-stone-700 text-stone-500 hover:text-stone-200 transition-all shrink-0"
                          title="Purge record"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer: Institutional Profile */}
        <div
          onClick={onOpenProfile}
          className="p-4 border-t border-stone-800/60 bg-stone-950/80 backdrop-blur-md cursor-pointer hover:bg-stone-900 transition-colors"
        >
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded bg-stone-800 border border-stone-700 flex items-center justify-center font-display text-stone-200 text-lg shrink-0">
                {userProfileService.getProfile().displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-xs font-bold text-stone-200 leading-tight truncate">
                  {userProfileService.getProfile().displayName}
                </span>
                <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest truncate mt-0.5">
                  {userProfileService.getProfile().roleTitle}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-stone-500 group-hover:text-stone-300 transition-colors">
              settings
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
