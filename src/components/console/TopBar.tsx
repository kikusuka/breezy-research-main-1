import React, { useEffect, useState } from 'react';
import { userProfileService } from '../../services/userProfileService';
import { apiClient } from '../../services/apiClient';

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
  const handleToggle = onToggleMobileMenu || onToggleSidebar;
  const profile = userProfileService.getProfile();
  const displayName = profile.displayName || 'Dr. Aris Vance';
  const [serverActive, setServerActive] = useState(false);

  useEffect(() => {
    apiClient.getHealth().then((h) => {
      setServerActive(Boolean(h.ok));
    }).catch(() => {
      setServerActive(false);
    });
  }, []);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'AV';

  return (
    <header
      className={`fixed top-0 left-0 ${
        isSidebarOpen ? 'lg:left-64' : 'left-0'
      } right-0 z-40 h-16 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.15)] transition-all duration-300`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, rgba(0, 180, 216, 0.12), transparent 70%)',
      }}
    >
      <div className="h-full w-full px-space-md sm:px-space-lg flex items-center justify-between gap-space-md">
        {/* Left: Mobile hamburger & search input */}
        <div className="flex items-center gap-space-md flex-1 max-w-xl">
          <button
            type="button"
            onClick={handleToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors focus:outline-none"
            aria-label="Toggle navigation"
            title="Toggle navigation"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          {/* Quick search input trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/30 transition-all text-left shadow-sm group"
          >
            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">
              search
            </span>
            <span className="font-sans text-body-sm text-on-surface-variant/80 flex-1 truncate select-none">
              Search research, hypotheses, sources...
            </span>
            <div className="hidden sm:flex items-center gap-0.5 bg-surface-container px-space-xs py-0.5 rounded text-outline font-mono text-code-sm">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </div>
          </button>
        </div>

        {/* Right utility items */}
        <div className="flex items-center gap-space-sm sm:gap-space-md shrink-0">
          {/* Inference Status Badge */}
          <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container border border-outline-variant/30 text-code-sm font-mono shadow-sm">
            {isDeliberating ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-primary font-medium hidden sm:inline">Synthesizing...</span>
                <span className="text-primary font-medium sm:hidden">Running</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                <span className="text-tertiary hidden sm:inline">Inference Idle</span>
                <span className="text-tertiary sm:hidden">Idle</span>
              </>
            )}
          </div>

          {/* Parameter Settings Trigger */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-space-xs sm:p-space-sm rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors hidden sm:flex items-center justify-center"
              title="Open Settings"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          )}

          {/* User Profile Avatar Trigger */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-primary/40 transition-all focus:outline-none"
            title={`Signed in as ${displayName}`}
            aria-label="Profile"
          >
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-container-high ring-1 ring-primary/40 flex items-center justify-center text-primary font-mono text-code-sm font-semibold">
                {initials}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
