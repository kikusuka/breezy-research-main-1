import React from 'react';
import { DebateSession } from '../../types';
import { userProfileService } from '../../services/userProfileService';
import { PWAInstallButton } from './PWAInstallButton';

export type ConsoleTab =
  | 'chat'
  | 'research'
  | 'history'
  | 'notes'
  | 'models'
  | 'docs'
  | 'settings'
  | 'build'
  | 'canvas'
  | 'landing'
  | 'profile';

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
  const displayName = profile.displayName || 'Breezy user';
  const roleTitle = profile.roleTitle || 'Workspace member';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'B';

  const isTabActive = (tabId: ConsoleTab) => {
    if (tabId === 'history' && (activeTab === 'history' || activeTab === 'notes')) return true;
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
      {isOpenMobile ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={handleClose}
        />
      ) : null}

      <aside
        className={
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-surface-container-low/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ' +
          (isOpenMobile ? 'translate-x-0 ' : '-translate-x-full ') +
          (isOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full')
        }
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="h-16 shrink-0 px-space-lg flex items-center gap-space-sm">
            <button
              type="button"
              onClick={() => {
                onSelectTab('landing');
                handleClose?.();
              }}
              className="group flex items-center gap-space-sm"
            >
              <img
                src="/breezy-logo.svg"
                alt="Breezy"
                className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-semibold group-hover:text-primary transition-colors">
                Breezy
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNewSession();
                onSelectTab('research');
                handleClose?.();
              }}
              className="ml-auto hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary hover:bg-secondary lg:flex"
              aria-label="New investigation"
              title="New investigation"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface lg:hidden"
              aria-label="Close navigation"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="px-space-md py-space-sm">
            <button
              type="button"
              onClick={() => {
                onNewSession();
                onSelectTab('research');
                handleClose?.();
              }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-space-md text-sm font-medium text-on-primary transition-colors hover:bg-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Investigation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-space-md py-space-sm">
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
                    className={
                      'flex items-center justify-between rounded-lg px-space-md py-space-sm transition-colors ' +
                      (active
                        ? 'bg-surface-container-high text-primary font-medium'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface')
                    }
                  >
                    <span className="flex min-w-0 items-center gap-space-md">
                      <span
                        className={
                          'material-symbols-outlined text-[20px] ' +
                          (active ? 'text-primary' : 'text-on-surface-variant')
                        }
                      >
                        {item.icon}
                      </span>
                      <span className="truncate font-body-md text-body-md">{item.label}</span>
                    </span>

                    {item.count !== undefined && item.count > 0 ? (
                      <span className="rounded-full bg-surface-container px-1.5 py-0.5 font-code-sm text-code-sm text-on-surface-variant">
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="pt-space-lg">
              <div className="px-space-md pb-space-xs font-label-sm text-label-sm uppercase tracking-wider text-outline">
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
                      className={
                        'flex items-center gap-space-md rounded-lg px-space-md py-space-sm transition-colors ' +
                        (active
                          ? 'bg-surface-container-high text-primary font-medium'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface')
                      }
                    >
                      <span
                        className={
                          'material-symbols-outlined text-[20px] ' +
                          (active ? 'text-primary' : 'text-on-surface-variant')
                        }
                      >
                        {item.icon}
                      </span>
                      <span className="font-body-md text-body-md">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {sessions.length > 0 ? (
              <div className="mt-space-lg border-t border-outline-variant/30 pt-space-md">
                <div className="flex items-center justify-between px-space-md pb-space-xs">
                  <span className="font-code-sm text-code-sm uppercase tracking-wider text-outline">
                    Recent runs
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('history');
                      handleClose?.();
                    }}
                    className="font-label-sm text-label-sm text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {sessions.slice(0, 6).map((session) => {
                    const selected = session.id === activeSessionId && activeTab === 'research';

                    return (
                      <div
                        key={session.id}
                        className={
                          'group flex items-center justify-between rounded-xl px-space-md py-2 transition-colors ' +
                          (selected
                            ? 'bg-surface-container-high text-on-surface'
                            : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface')
                        }
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
                          <span className="block truncate text-body-sm">{session.prompt || 'Untitled investigation'}</span>
                          <span className="font-code-sm text-code-sm text-outline">
                            {new Date(session.createdAt || Date.now()).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </button>

                        {onDeleteSession ? (
                          <button
                            type="button"
                            onClick={(event) => onDeleteSession(session.id, event)}
                            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-outline group-hover:flex hover:bg-surface-container-highest hover:text-error"
                            title="Delete run"
                            aria-label="Delete run"
                          >
                            <span className="material-symbols-outlined text-[15px]">close</span>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 bg-surface-container-lowest/60 p-space-md">
          <button
            type="button"
            onClick={() => {
              onOpenProfile?.();
              handleClose?.();
            }}
            className="flex w-full items-center gap-space-md rounded-2xl bg-surface-container p-space-sm text-left transition-colors hover:bg-surface-container-high"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-code-md text-code-md text-primary">
              {initials}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-label-md text-label-md text-on-surface">{displayName}</span>
              <span className="truncate font-label-sm text-label-sm text-on-surface-variant">{roleTitle}</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-outline-variant">navigate_next</span>
          </button>

          <div className="pt-2">
            <PWAInstallButton />
          </div>
        </div>
      </aside>
    </>
  );
};
