import React from 'react';
import { userProfileService } from '../../services/userProfileService';

interface TopBarProps {
  onOpenSearch: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onToggleMobileMenu?: () => void;
  isDeliberating?: boolean;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  isSidebarOpen = true,
  onToggleSidebar,
  onToggleMobileMenu,
  isDeliberating = false,
  onOpenProfile,
  onOpenSettings,
}) => {
  const profile = userProfileService.getProfile();
  const displayName = profile.displayName || 'Breezy user';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'B';

  return (
    <header
      className={
        'fixed left-0 right-0 top-0 z-40 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-[left] duration-200 ' +
        (isSidebarOpen ? 'lg:left-64' : 'left-0')
      }
    >
      <div className="flex h-16 w-full items-center justify-between gap-space-md px-space-lg">
        <div className="flex min-w-0 flex-1 items-center gap-space-md">
          <button
            type="button"
            onClick={onToggleMobileMenu || onToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface lg:hidden"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-outline hover:bg-surface-container-high hover:text-on-surface lg:flex"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined">
              {isSidebarOpen ? 'left_panel_close' : 'left_panel_open'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-9 min-w-0 max-w-xl flex-1 items-center gap-space-sm rounded-full bg-surface-container-low px-space-md text-left text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
            <span className="truncate font-body-sm text-body-sm">Search research, hypotheses, sources...</span>
            <span className="ml-auto hidden shrink-0 items-center gap-0.5 rounded bg-surface-container px-space-xs py-0.5 font-code-sm text-code-sm text-outline sm:flex">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-space-sm">
          <div
            className={
              'hidden items-center gap-space-xs rounded-full bg-surface-container px-space-sm py-1 font-code-sm text-code-sm sm:flex ' +
              (isDeliberating ? 'text-tertiary' : 'text-outline')
            }
          >
            <span
              className={
                'h-1.5 w-1.5 rounded-full ' +
                (isDeliberating ? 'bg-tertiary animate-pulse' : 'bg-outline')
              }
            />
            <span>{isDeliberating ? 'Researching' : 'Ready'}</span>
          </div>

          {onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined text-[19px]">tune</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-container-high font-label-md text-label-md text-primary"
            aria-label={'Profile for ' + displayName}
          >
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
