import React from 'react';
import { ConsoleTab } from './Sidebar';

export type ProductMode = 'breezy' | 'synthexis' | 'synap';

interface TopBarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  productMode: ProductMode;
  onSelectProductMode: (mode: ProductMode) => void;
  onNewResearch?: () => void;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  productMode,
  onSelectProductMode,
  onNewResearch,
  onOpenSearch,
  onToggleMobileMenu,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#10141a]/90 backdrop-blur-md border-b border-white/10 z-40 flex items-center justify-between px-4 sm:px-6">
      {/* Zone 1: Brand Mark */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-stone-400 hover:text-stone-100 lg:hidden rounded-lg hover:bg-white/5"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className="text-left group cursor-pointer flex items-center gap-2"
        >
          <span className="text-base font-serif font-medium tracking-tight text-stone-100 group-hover:text-stone-300 transition-colors">
            {productMode === 'breezy' ? 'Breezy' : productMode === 'synap' ? 'Synap' : 'Synthexis'}
          </span>
        </button>
      </div>

      {/* Zone 2: Breezy / Synthexis / Synap Pill Switcher */}
      <div className="hidden md:flex items-center bg-black/30 border border-white/10 rounded-full p-1 shadow-inner">
        <button
          type="button"
          onClick={() => onSelectProductMode('breezy')}
          className={`px-3.5 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
            productMode === 'breezy'
              ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">air</span>
          <span>Breezy</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectProductMode('synthexis');
            onSelectTab('chat');
          }}
          className={`px-3.5 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
            productMode === 'synthexis'
              ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">psychology</span>
          <span>Synthexis</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectProductMode('synap')}
          className={`px-3.5 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
            productMode === 'synap'
              ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">lan</span>
          <span>Synap</span>
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-400 hover:text-stone-200 transition-colors text-xs"
          title="Search research and notes (⌘K)"
        >
          <span className="material-symbols-outlined text-[15px]">search</span>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-stone-500 bg-white/5 px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* New Research Action */}
        <button
          type="button"
          onClick={() => {
            onNewResearch?.();
            onSelectTab('chat');
            onSelectProductMode('synthexis');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-sans text-xs font-semibold shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span className="hidden sm:inline">New Research</span>
        </button>
      </div>
    </header>
  );
};
