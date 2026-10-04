import React from 'react';
import { DebateSession } from '../../types';
import { userProfileService } from '../../services/userProfileService';
import { PWAInstallButton } from './PWAInstallButton';

export type ConsoleTab = 'chat' | 'notes' | 'models' | 'settings' | 'landing' | 'docs';

interface SidebarProps {
  activeTab: ConsoleTab; onSelectTab: (tab: ConsoleTab) => void; sessions: DebateSession[]; activeSessionId: string | null;
  onSelectSession: (id: string) => void; onNewSession: () => void; synthexisMode?: boolean; onToggleSynthexisMode?: () => void;
  isOpenMobile?: boolean; onCloseMobile?: () => void; onOpenProfile?: () => void; onDeleteSession?: (id: string, e: React.MouseEvent) => void;
  onSwitchToBreezy?: () => void; onOpenGuide?: () => void; isOpen?: boolean; onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, sessions, activeSessionId, onSelectSession, onNewSession, synthexisMode = true, onToggleSynthexisMode, isOpenMobile = false, onCloseMobile, onOpenProfile, onDeleteSession, onSwitchToBreezy, onOpenGuide, isOpen, onClose }) => {
  const handleClose = onCloseMobile || onClose;
  const profile = userProfileService.getProfile();
  const navItems = [
    { id: 'chat' as const, label: 'Research', icon: 'travel_explore' },
    { id: 'notes' as const, label: 'History', icon: 'history' },
    { id: 'models' as const, label: 'Models', icon: 'tune' },
    { id: 'docs' as const, label: 'Docs', icon: 'menu_book' },
  ];

  return <>
    {isOpenMobile && <div aria-hidden="true" className="fixed inset-0 z-40 bg-[#020b16]/70 lg:hidden" onClick={handleClose} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.07] bg-[#07111f] transition-transform duration-300 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'} ${isOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.07] px-5">
        <img src="/breezy.png" alt="Breezy" className="h-8 w-8 object-contain" />
        <div className="min-w-0"><div className="text-sm font-semibold tracking-[-0.02em] text-white">Breezy</div><div className="text-[10px] text-slate-500">Your AI workspace</div></div>
        <button type="button" onClick={handleClose} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.05] hover:text-white lg:hidden" aria-label="Close navigation"><span className="material-symbols-outlined text-[18px]">close</span></button>
      </div>

      <div className="px-3 pt-4">
        <button type="button" onClick={() => { onNewSession(); onSelectTab('chat'); handleClose?.(); }} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-300 text-xs font-semibold text-slate-950 transition hover:bg-sky-200">
          <span className="material-symbols-outlined text-[17px]">add</span>New research
        </button>
      </div>

      <nav className="px-3 pt-5" aria-label="Breezy navigation">
        <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">Workspace</div>
        <div className="space-y-0.5">
          {navItems.map((item) => <button key={item.id} type="button" onClick={() => { item.id === 'docs' ? onOpenGuide?.() : onSelectTab(item.id); onCloseMobile?.(); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${activeTab === item.id ? 'bg-sky-300/[0.10] text-sky-100' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'}`}><span className={`material-symbols-outlined text-[18px] ${activeTab === item.id ? 'text-sky-300' : 'text-slate-600'}`}>{item.icon}</span><span>{item.label}</span>{item.id === 'notes' && sessions.length > 0 && <span className="ml-auto text-[10px] text-slate-600">{sessions.length}</span>}</button>)}
        </div>
      </nav>

      <div className="px-3 pt-5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-300">Research mode</span><button type="button" onClick={onToggleSynthexisMode} aria-label="Toggle research mode" className={`relative h-5 w-9 rounded-full transition ${synthexisMode ? 'bg-sky-300' : 'bg-slate-700'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#07111f] transition ${synthexisMode ? 'left-4' : 'left-0.5'}`} /></button></div>
          <p className="mt-1 text-[11px] leading-4 text-slate-600">{synthexisMode ? 'Multiple perspectives challenge one another.' : 'One model, faster response.'}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-6">
        <div className="flex items-center justify-between px-3"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">Recent research</span><button type="button" onClick={() => onSelectTab('notes')} className="text-[11px] text-slate-600 hover:text-sky-300">All</button></div>
        <div className="mt-2 space-y-0.5">{sessions.length === 0 ? <p className="px-3 py-4 text-xs leading-5 text-slate-600">Your research history will appear here.</p> : sessions.slice(0, 12).map((session) => { const active = session.id === activeSessionId && activeTab === 'chat'; return <div key={session.id} className={`group flex items-start gap-2 rounded-lg px-3 py-2 ${active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.035]'}`}><button type="button" onClick={() => { onSelectSession(session.id); onSelectTab('chat'); onCloseMobile?.(); }} className="min-w-0 flex-1 text-left"><span className={`block truncate text-xs ${active ? 'text-sky-100' : 'text-slate-400 group-hover:text-slate-200'}`}>{session.prompt || 'Untitled research'}</span><span className="mt-1 block text-[10px] text-slate-600">{new Date(session.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></button>{onDeleteSession && <button type="button" onClick={(event) => onDeleteSession(session.id, event)} className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-red-400/10 hover:text-red-300 group-hover:flex" aria-label="Delete research session"><span className="material-symbols-outlined text-[14px]">close</span></button>}</div>; })}</div>
      </div>

      <div className="border-t border-white/[0.07] p-3">
        <button type="button" onClick={onSwitchToBreezy} className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"><span className="material-symbols-outlined text-[18px] text-sky-300">chat_bubble</span>Chat</button>
        <button type="button" onClick={onOpenProfile} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-300/10 text-xs font-semibold text-sky-200">{profile.displayName.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-200">{profile.displayName}</span><span className="block truncate text-[10px] text-slate-600">{profile.roleTitle}</span></span><span className="material-symbols-outlined text-[17px] text-slate-600">settings</span></button>
        <PWAInstallButton />
      </div>
    </aside>
  </>;
};
