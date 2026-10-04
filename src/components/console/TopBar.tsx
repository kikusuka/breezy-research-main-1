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
    <header className={`fixed top-0 left-0 ${isSidebarOpen ? 'lg:left-64' : 'left-0'} right-0 z-40 h-16 border-b border-white/[0.07] bg-[#07111f]/88 px-3 backdrop-blur-xl sm:px-6 lg:px-8`}>
      <div className="flex h-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={handleToggle} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.05] hover:text-white" title="Toggle navigation" aria-label="Toggle navigation">
            <span className="material-symbols-outlined text-[20px]">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
          <div className="hidden h-5 w-px bg-white/[0.08] sm:block" />
          <div className="flex items-center gap-2.5">
            <img src="/breezy.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold tracking-[-0.02em] text-white">Breezy</span>
          </div>
        </div>

        <button type="button" onClick={onOpenSearch} className="group flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-slate-400 transition hover:border-sky-300/25 hover:bg-white/[0.05] hover:text-slate-200" title="Search and quick jump">
          <span className="material-symbols-outlined text-[16px] text-sky-300/80">search</span>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-slate-500 sm:inline">⌘K</kbd>
        </button>
      </div>
    </header>
  );
};
