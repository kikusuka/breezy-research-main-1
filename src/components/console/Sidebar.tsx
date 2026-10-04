import React from 'react';
import { DebateSession } from '../../types';
import { userProfileService } from '../../services/userProfileService';
import { PWAInstallButton } from './PWAInstallButton';

export type ConsoleTab = 'chat' | 'research' | 'history' | 'notes' | 'models' | 'docs' | 'settings' | 'build' | 'canvas' | 'landing' | 'profile';

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
  onOpenGuide?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
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
  onOpenProfile,
  onDeleteSession,
  onOpenGuide,
  isOpen = true,
  onClose,
}) => {
  const handleClose = onCloseMobile || onClose;
  const profile = userProfileService.getProfile();
  const displayName = profile.displayName || 'Dr. Aris Vance';
  const roleTitle = profile.roleTitle || 'Lead Analyst';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'AV';

  const isTabActive = (tabId: ConsoleTab) => {
    if (tabId === 'history' && (activeTab === 'history' || activeTab === 'notes')) return true;
    if (tabId === 'research' && activeTab === 'research') return true;
    return activeTab === tabId;
  };

  const mainNavItems = [
    { id: 'chat' as const, label: 'Chat', icon: 'chat_bubble' },
    { id: 'research' as const, label: 'Research', icon: 'psychology' },
    { id: 'history' as const, label: 'History', icon: 'history', count: sessions.length },
    { id: 'models' as const, label: 'Models', icon: 'hub' },
    { id: 'docs' as const, label: 'Docs', icon: 'menu_book' },
    { id: 'settings' as const, label: 'Settings', icon: 'settings' },
  ];

  const labItems = [
    { id: 'build' as const, label: 'Build', icon: 'terminal' },
    { id: 'canvas' as const, label: 'Canvas', icon: 'draw' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={handleClose}
        />
      )}

      {/* Main Stitch Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col justify-between bg-surface-container-low/95 backdrop-blur-xl border-r border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.2)] transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } ${isOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Logo & Version Header */}
          <div className="h-16 px-space-lg flex items-center justify-between border-b border-outline-variant/30 shrink-0">
            <button
              type="button"
              onClick={() => {
                onSelectTab('landing');
                handleClose?.();
              }}
              className="flex items-center gap-space-sm group focus:outline-none"
            >
              <img
                src="/breezy-logo.svg"
                alt="Breezy Logo"
                className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-headline font-semibold text-headline-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                Breezy
              </span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-code-sm text-primary bg-surface-container-highest px-space-xs py-0.5 rounded-full border border-outline-variant/40">
                v2.4
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface lg:hidden"
                aria-label="Close navigation"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Quick Action: New Research */}
          <div className="px-space-md pt-space-sm pb-space-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                onNewSession();
                onSelectTab('research');
                handleClose?.();
              }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-on-primary font-medium text-body-sm hover:bg-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Investigation</span>
            </button>
          </div>

          {/* Scrollable Nav & Recents */}
          <div className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-md">
            {/* Primary Navigation */}
            <nav className="flex flex-col gap-space-xs" aria-label="Breezy Navigation">
              {mainNavItems.map((item) => {
                const active = isTabActive(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'docs' && onOpenGuide) {
                        onOpenGuide();
                      } else {
                        onSelectTab(item.id);
                      }
                      handleClose?.();
                    }}
                    className={`flex items-center justify-between px-space-md py-space-sm rounded-md transition-colors ${
                      active
                        ? 'bg-surface-container-high text-primary font-medium border-l-2 border-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-space-md min-w-0">
                      <span
                        className={`material-symbols-outlined text-[20px] transition-colors ${
                          active ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-sans text-body-md truncate">{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="font-mono text-code-sm px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Laboratories */}
            <div className="pt-space-xs">
              <div className="px-space-md pb-space-xs font-mono text-label-sm uppercase tracking-wider text-outline">
                Laboratories
              </div>
              <nav className="flex flex-col gap-space-xs">
                {labItems.map((item) => {
                  const active = isTabActive(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        handleClose?.();
                      }}
                      className={`flex items-center gap-space-md px-space-md py-space-sm rounded-md transition-colors ${
                        active
                          ? 'bg-surface-container-high text-primary font-medium border-l-2 border-primary'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-l-2 border-transparent'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] transition-colors ${
                          active ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="font-sans text-body-md">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Recent Investigations List */}
            {sessions.length > 0 && (
              <div className="pt-space-xs border-t border-outline-variant/30">
                <div className="flex items-center justify-between px-space-md pb-space-xs">
                  <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
                    Recent Runs
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('history');
                      handleClose?.();
                    }}
                    className="font-sans text-label-sm text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {sessions.slice(0, 6).map((session) => {
                    const isSelected = session.id === activeSessionId && activeTab === 'research';
                    return (
                      <div
                        key={session.id}
                        className={`group flex items-center justify-between px-space-md py-2 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-surface-container-high text-on-surface'
                            : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSession(session.id);
                            onSelectTab('research');
                            handleClose?.();
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-body-sm font-normal">
                            {session.prompt || 'Untitled investigation'}
                          </span>
                          <span className="font-mono text-code-sm text-outline">
                            {new Date(session.createdAt || Date.now()).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </button>
                        {onDeleteSession && (
                          <button
                            type="button"
                            onClick={(e) => onDeleteSession(session.id, e)}
                            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-outline hover:text-error hover:bg-surface-container-highest group-hover:flex transition-colors"
                            title="Delete session"
                            aria-label="Delete run"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Profile / Account Tile */}
        <div className="p-space-md border-t border-outline-variant/30 bg-surface-container-lowest/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenProfile) onOpenProfile();
              handleClose?.();
            }}
            className="flex items-center gap-space-md p-space-sm rounded-md bg-surface-container hover:bg-surface-container-high transition-colors w-full text-left group border border-outline-variant/30"
          >
            <div className="w-8 h-8 rounded-md bg-surface-container-high group-hover:bg-primary/20 flex items-center justify-center text-primary font-mono text-code-md font-semibold shrink-0 transition-colors">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-sans text-label-md font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                {displayName}
              </span>
              <span className="font-sans text-label-sm text-on-surface-variant truncate">
                {roleTitle}
              </span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-on-surface text-[18px] transition-colors">
              navigate_next
            </span>
          </button>
          <div className="pt-2">
            <PWAInstallButton />
          </div>
        </div>
      </aside>
    </>
  );
};
