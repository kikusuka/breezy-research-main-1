import React from 'react';
import { ConsoleTab } from './Sidebar';

interface TopBarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  onNewResearch?: () => void;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
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
          className="text-left group cursor-pointer"
        >
          <span className="text-base font-serif font-medium tracking-tight text-stone-100 group-hover:text-stone-300 transition-colors">
            Synthexis
          </span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Clean Text, No Badges) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-400">
        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className={`transition-colors hover:text-stone-100 ${
            activeTab === 'chat' ? 'text-stone-100 font-semibold border-b border-stone-100 pb-0.5' : ''
          }`}
        >
          Research
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('notes')}
          className={`transition-colors hover:text-stone-100 ${
            activeTab === 'notes' ? 'text-stone-100 font-semibold border-b border-stone-100 pb-0.5' : ''
          }`}
        >
          Notes & Archive
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('models')}
          className={`transition-colors hover:text-stone-100 ${
            activeTab === 'models' ? 'text-stone-100 font-semibold border-b border-stone-100 pb-0.5' : ''
          }`}
        >
          Models & Calibration
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`transition-colors hover:text-stone-100 ${
            activeTab === 'settings' ? 'text-stone-100 font-semibold border-b border-stone-100 pb-0.5' : ''
          }`}
        >
          Settings
        </button>
      </nav>

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
