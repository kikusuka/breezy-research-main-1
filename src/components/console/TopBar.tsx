import React from 'react';

export type ProductMode = 'breezy' | 'synthexis';

interface TopBarProps {
  productMode: ProductMode;
  onSelectProductMode: (mode: ProductMode) => void;
  onOpenSearch: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  isSidebarOpen = true,
  onToggleSidebar,
  onToggleMobileMenu,
}) => {
  const handleToggle = onToggleSidebar || onToggleMobileMenu;

  return (
    <header className={`fixed top-0 left-0 ${isSidebarOpen ? 'lg:left-64' : 'left-0'} right-0 z-40 h-16 border-b border-[#3d494d]/50 bg-[#111319]/90 px-3 backdrop-blur-xl sm:px-6 lg:px-8`}>
      <div className="flex h-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={handleToggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#bcc9ce] transition hover:bg-[#272a30] hover:text-[#e1e2e9]" title="Toggle navigation" aria-label="Toggle navigation">
            <span className="material-symbols-outlined text-[20px]">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
          <div className="hidden h-5 w-px border-[#3d494d]/60 sm:block" />
          <div className="flex items-center gap-2.5">
            <img src="/breezy.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#e1e2e9]">Breezy</span>
          </div>
        </div>

        <button type="button" onClick={onOpenSearch} className="group flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#191c21] px-3 py-1.5 text-xs text-[#bcc9ce] transition hover:border-[#4cd6fb]/30 hover:bg-[#272a30] hover:text-[#e1e2e9]" title="Search and quick jump">
          <span className="material-symbols-outlined text-[16px] text-[#4cd6fb]">search</span>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-white/[0.08] bg-[#272a30] px-1.5 py-0.5 font-mono text-[9px] text-[#869398] sm:inline">⌘K</kbd>
        </button>
      </div>
    </header>
  );
};
