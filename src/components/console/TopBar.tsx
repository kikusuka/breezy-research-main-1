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
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'B';

  return (
    <header className={`fixed top-0 left-0 ${isSidebarOpen ? 'lg:left-[260px]' : 'left-0'} right-0 z-40 h-16 bg-[#111319] border-b border-[#3d494d]/40 transition-[left] duration-200`}>
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button type="button" onClick={onToggleMobileMenu || onToggleSidebar}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-[#bcc9ce] hover:text-white hover:bg-[#1d2025] rounded-md"
            aria-label="Open navigation">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <button type="button" onClick={onToggleSidebar}
            className="hidden lg:flex w-9 h-9 items-center justify-center text-[#869398] hover:text-white hover:bg-[#1d2025] rounded-md"
            aria-label="Toggle sidebar">
            <span className="material-symbols-outlined">{isSidebarOpen ? 'left_panel_close' : 'left_panel_open'}</span>
          </button>
          <button type="button" onClick={onOpenSearch}
            className="h-9 max-w-xl flex-1 flex items-center gap-2 px-3 text-left bg-[#191c21] border border-[#3d494d]/50 rounded-md text-[#869398] hover:text-[#e1e2e9] hover:border-[#3d494d] transition-colors">
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span className="truncate text-sm">Search Breezy</span>
            <span className="hidden sm:inline ml-auto font-mono text-[10px] text-[#869398]">⌘ K</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className={`hidden sm:flex items-center gap-2 px-2.5 h-8 rounded-md border border-[#3d494d]/50 bg-[#191c21] font-mono text-[10px] ${isDeliberating ? 'text-[#4cd6fb]' : 'text-[#869398]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDeliberating ? 'bg-[#4cd6fb] animate-pulse' : 'bg-[#869398]'}`} />
            {isDeliberating ? 'RESEARCHING' : 'READY'}
          </div>
          {onOpenSettings && (
            <button type="button" onClick={onOpenSettings} className="w-9 h-9 flex items-center justify-center text-[#869398] hover:text-white hover:bg-[#1d2025] rounded-md" aria-label="Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}
          <button type="button" onClick={onOpenProfile} className="w-8 h-8 rounded-full bg-[#272a30] border border-[#3d494d] text-[#4cd6fb] text-xs font-medium flex items-center justify-center hover:border-[#4cd6fb]" aria-label="Profile">
            {profile.photoURL ? <img src={profile.photoURL} alt={displayName} className="w-full h-full rounded-full object-cover" /> : initials}
          </button>
        </div>
      </div>
    </header>
  );
};
