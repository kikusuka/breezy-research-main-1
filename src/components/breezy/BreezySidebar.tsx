import React from 'react';
import { userProfileService } from '../../services/userProfileService';

export type BreezyTab = 'chat' | 'ide' | 'canvas' | 'docs';
interface BreezyChat { id: string; title: string; messages: any[]; createdAt: string; }
interface BreezySidebarProps {
  activeTab: BreezyTab; onSelectTab: (tab: BreezyTab) => void; chats: Record<string, BreezyChat>; activeId: string | null;
  onSelectChat: (id: string) => void; onNewChat: () => void; onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onOpenProfile: () => void; onSwitchToSynthexis?: () => void; onOpenGuide?: () => void; isOpen?: boolean; onClose?: () => void;
  isOpenMobile?: boolean; onCloseMobile?: () => void;
}

export const BreezySidebar: React.FC<BreezySidebarProps> = ({ activeTab, onSelectTab, chats, activeId, onSelectChat, onNewChat, onDeleteChat, onOpenProfile, onSwitchToSynthexis, onOpenGuide, isOpen, onClose, isOpenMobile, onCloseMobile }) => {
  const handleClose = onCloseMobile || onClose;
  const profile = userProfileService.getProfile();
  const chatList = Object.values(chats).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const navItems = [
    { id: 'chat' as const, label: 'Chat', icon: 'chat_bubble' },
    { id: 'ide' as const, label: 'Build', icon: 'code' },
    { id: 'canvas' as const, label: 'Canvas', icon: 'dashboard_customize' },
    { id: 'docs' as const, label: 'Docs', icon: 'menu_book' },
  ];

  return <>
    {isOpenMobile && <div aria-hidden="true" className="fixed inset-0 z-40 bg-[#020b16]/75 lg:hidden" onClick={handleClose} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-sky-200/[0.08] bg-[#081525] transition-transform duration-300 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'} ${isOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
      <div className="flex h-[72px] items-center justify-between border-b border-sky-200/[0.08] px-5"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-300 text-slate-950"><span className="material-symbols-outlined text-[18px]">air</span></div><div><div className="text-sm font-semibold tracking-tight text-white">Breezy</div><div className="text-[10px] text-sky-200/45">Everyday workspace</div></div></div><button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Close navigation"><span className="material-symbols-outlined text-[18px]">menu_open</span></button></div>
      <div className="px-4 pt-5"><button type="button" onClick={() => { onSelectTab('chat'); onNewChat(); onCloseMobile?.(); }} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-300 text-xs font-semibold text-slate-950 transition hover:bg-sky-200"><span className="material-symbols-outlined text-[17px]">add</span>New chat</button></div>
      <nav className="px-3 pt-6" aria-label="Breezy navigation"><div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200/40">Workspace</div><div className="space-y-1">{navItems.map((item) => <button key={item.id} type="button" onClick={() => { item.id === 'docs' ? onOpenGuide?.() : onSelectTab(item.id); onCloseMobile?.(); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${activeTab === item.id ? 'bg-sky-300/[0.12] text-sky-100' : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'}`}><span className={`material-symbols-outlined text-[18px] ${activeTab === item.id ? 'text-sky-300' : 'text-slate-500'}`}>{item.icon}</span>{item.label}{activeTab === item.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-300" />}</button>)}</div></nav>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-8"><div className="flex items-center justify-between px-3"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200/40">Recent chats</span><span className="text-[11px] text-slate-600">{chatList.length || ''}</span></div><div className="mt-3 space-y-1">{chatList.length === 0 ? <p className="px-3 py-4 text-xs leading-5 text-slate-600">No chats yet. Start a conversation when you are ready.</p> : chatList.slice(0, 14).map((chat) => { const active = chat.id === activeId && activeTab === 'chat'; return <div key={chat.id} className={`group flex items-start gap-2 rounded-lg px-3 py-2.5 ${active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}><button type="button" onClick={() => { onSelectTab('chat'); onSelectChat(chat.id); onCloseMobile?.(); }} className="min-w-0 flex-1 text-left"><span className={`block truncate text-xs ${active ? 'text-sky-100' : 'text-slate-400 group-hover:text-slate-200'}`}>{chat.title || 'New chat'}</span><span className="mt-1 block text-[10px] text-slate-600">{chat.messages.length ? `${chat.messages.length} messages` : 'Empty chat'}</span></button><button type="button" onClick={(event) => onDeleteChat(chat.id, event)} className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-red-400/10 hover:text-red-300 group-hover:flex" aria-label="Delete chat"><span className="material-symbols-outlined text-[14px]">close</span></button></div>; })}</div></div>
      <div className="border-t border-sky-200/[0.08] p-4"><button type="button" onClick={onSwitchToSynthexis} className="mb-3 flex w-full items-center justify-between rounded-lg border border-sky-200/[0.08] px-3 py-2.5 text-xs text-slate-400 hover:border-sky-300/25 hover:text-sky-100"><span className="flex items-center gap-2"><span className="material-symbols-outlined text-[17px] text-sky-300">travel_explore</span>Open Research</span><span className="material-symbols-outlined text-[15px]">arrow_forward</span></button><button type="button" onClick={onOpenProfile} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-300/10 text-xs font-semibold text-sky-200">{profile.displayName.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-200">{profile.displayName}</span><span className="block truncate text-[10px] text-slate-600">{profile.roleTitle}</span></span><span className="material-symbols-outlined text-[17px] text-slate-600">settings</span></button></div>
    </aside>
  </>;
};
