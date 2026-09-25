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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  productMode,
  onSelectProductMode,
  onNewResearch,
  onOpenSearch,
  onToggleMobileMenu,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className={`fixed top-0 left-0 lg:left-64 right-0 h-14 backdrop-blur-md border-b z-40 flex items-center justify-between px-4 sm:px-6 transition-colors ${
      theme === 'light'
        ? 'bg-white/90 border-slate-200 text-slate-800'
        : 'bg-[#10141a]/90 border-white/10 text-stone-100'
    }`}>
      {/* Zone 1: Brand / Sidebar Icon & Product Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-100 lg:hidden rounded-xl hover:bg-white/5 active:bg-white/10 cursor-pointer shrink-0"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Mode Switcher positioned right beside the sidebar icon for continuity */}
        <div className={`flex items-center border rounded-full p-0.5 sm:p-1 shadow-inner shrink-0 ${
          theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/10'
        }`}>
          <button
            type="button"
            onClick={() => onSelectProductMode('breezy')}
            className={`px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              productMode === 'breezy'
                ? theme === 'light' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">air</span>
            <span>Breezy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectProductMode('synthexis');
              onSelectTab('chat');
            }}
            className={`px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              productMode === 'synthexis'
                ? theme === 'light' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">psychology</span>
            <span>Synthexis</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectProductMode('synap')}
            className={`px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              productMode === 'synap'
                ? theme === 'light' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">lan</span>
            <span>Synap</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Primary Actions (Search, Theme Toggle & Quick Jump) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Light / Dark Mode Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-sans cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                : 'bg-white/5 border-white/10 text-stone-300 hover:text-white hover:bg-white/10'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="hidden sm:inline font-medium">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSearch}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-xs cursor-pointer shadow-xs ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-stone-300 hover:text-stone-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <span className="hidden sm:inline font-sans">Quick Jump</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-stone-400 bg-white/5 px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
