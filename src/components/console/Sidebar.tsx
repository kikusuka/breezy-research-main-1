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
    {isOpenMobile && <div aria-hidden="true" className="fixed inset-0 z-40 bg-[#07090c]/80 backdrop-blur-[2px] lg:hidden" onClick={handleClose} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#2d363c] bg-[#0e1116] transition-transform duration-300 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'} ${isOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
      <div className="flex h-[72px] items-center gap-3 border-b border-[#273036] px-5">
        <img src="/breezy.png" alt="Breezy" className="h-9 w-9 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight text-white">Breezy</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#647178]">Research workspace</div>
        </div>
        <button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center text-[#718087] hover:bg-[#171b21] hover:text-white lg:hidden" aria-label="Close navigation"><span className="material-symbols-outlined text-[18px]">close</span></button>
      </div>

      <div className="px-4 pt-5">
        <button type="button" onClick={() => { onNewSession(); onSelectTab('chat'); handleClose?.(); }} className="flex h-11 w-full items-center justify-center gap-2 bg-[#63d9f7] text-xs font-semibold text-[#06232b] transition hover:bg-[#8be5fb]">
          <span className="material-symbols-outlined text-[17px]">add</span>
          New research
        </button>
      </div>

      <nav className="px-4 pt-6" aria-label="Breezy navigation">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#59676e]">Workspace</div>
        <div className="space-y-1">
          {navItems.map((item) => (
            <button key={item.id} type="button" onClick={() => { item.id === 'docs' ? onOpenGuide?.() : onSelectTab(item.id); onCloseMobile?.(); }} className={`flex h-10 w-full items-center gap-3 px-3 text-sm transition ${activeTab === item.id ? 'border-l-2 border-[#00b4d8] bg-[#151a20] pl-[10px] text-white' : 'border-l-2 border-transparent text-[#9eabb0] hover:bg-[#151a20] hover:text-white'}`}>
              <span className={`material-symbols-outlined text-[18px] ${activeTab === item.id ? 'text-[#00b4d8]' : 'text-[#66747b]'}`}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'notes' && sessions.length > 0 && <span className="ml-auto text-[10px] text-[#59676e]">{sessions.length}</span>}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-4 pt-6">
        <div className="border border-[#2d363c] bg-[#151a20] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">Research depth</span>
            <button type="button" onClick={onToggleSynthexisMode} aria-label="Toggle research mode" className={`relative h-5 w-9 transition ${synthexisMode ? 'bg-[#00b4d8]' : 'bg-[#3a444a]'}`}>
              <span className={`absolute top-0.5 h-4 w-4 bg-[#0e1116] transition ${synthexisMode ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-[#718087]">{synthexisMode ? 'Multiple perspectives and challenges.' : 'One model, faster response.'}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-7">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#59676e]">Recent research</span>
          <button type="button" onClick={() => onSelectTab('notes')} className="text-[11px] text-[#647178] hover:text-[#63d9f7]">View all</button>
        </div>
        <div className="mt-3 space-y-1">
          {sessions.length === 0 ? <p className="px-2 py-4 text-xs leading-5 text-[#59676e]">Your research history will appear here.</p> : sessions.slice(0, 12).map((session) => {
            const active = session.id === activeSessionId && activeTab === 'chat';
            return <div key={session.id} className={`group flex items-start gap-2 px-2 py-2.5 ${active ? 'bg-[#171d23]' : 'hover:bg-[#151a20]'}`}>
              <button type="button" onClick={() => { onSelectSession(session.id); onSelectTab('chat'); onCloseMobile?.(); }} className="min-w-0 flex-1 text-left">
                <span className={`block truncate text-xs ${active ? 'text-white' : 'text-[#9eabb0] group-hover:text-white'}`}>{session.prompt || 'Untitled research'}</span>
                <span className="mt-1 block text-[10px] text-[#59676e]">{new Date(session.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              </button>
              {onDeleteSession && <button type="button" onClick={(event) => onDeleteSession(session.id, event)} className="hidden h-6 w-6 shrink-0 items-center justify-center text-[#59676e] hover:text-red-300 group-hover:flex" aria-label="Delete research session"><span className="material-symbols-outlined text-[14px]">close</span></button>}
            </div>;
          })}
        </div>
      </div>

      <div className="border-t border-[#273036] p-4">
        <button type="button" onClick={onSwitchToBreezy} className="mb-2 flex h-10 w-full items-center gap-3 px-3 text-sm text-[#9eabb0] hover:bg-[#151a20] hover:text-white">
          <span className="material-symbols-outlined text-[18px] text-[#00b4d8]">chat_bubble</span>
          Chat
        </button>
        <button type="button" onClick={onOpenProfile} className="flex w-full items-center gap-3 px-2 py-2 text-left hover:bg-[#151a20]">
          <span className="flex h-8 w-8 items-center justify-center bg-[#00b4d8]/10 text-xs font-semibold text-[#bcefff]">{profile.displayName.charAt(0).toUpperCase()}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-white">{profile.displayName}</span><span className="block truncate text-[10px] text-[#647178]">{profile.roleTitle}</span></span>
          <span className="material-symbols-outlined text-[17px] text-[#59676e]">settings</span>
        </button>
        <PWAInstallButton />
      </div>
    </aside>
  </>;
};
