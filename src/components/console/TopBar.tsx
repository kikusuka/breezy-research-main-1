import React, { useState } from 'react';
import { BreezyLogoIcon, SynthexisLogoIcon } from '../icons/ProductLogos';

export type ProductMode = 'breezy' | 'synthexis';

interface TopBarProps {
  productMode: ProductMode;
  onSelectProductMode: (mode: ProductMode) => void;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  productMode,
  onSelectProductMode,
  onOpenSearch,
  onToggleMobileMenu,
}) => {
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 left-0 lg:left-64 right-0 h-16 backdrop-blur-xl z-40 flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-sky-200/60 bg-[#f0f7ff]/95 text-slate-900 shadow-sm transition-all duration-200`}
    >
      {/* Left: Mobile Menu + Brand + Workspace Selector */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 lg:hidden rounded-xl hover:bg-sky-200/40 active:bg-sky-200/60 cursor-pointer shrink-0 transition-colors"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Workspace Mode Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="flex items-center gap-1.5 py-1 text-sm sm:text-base font-sans font-bold text-slate-900 hover:text-sky-700 transition-colors cursor-pointer"
            title="Switch Workspace"
          >
            <span>
              {productMode === 'breezy' ? 'Breezy' : 'Synthexis'}
            </span>
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              expand_more
            </span>
          </button>

          {/* Dropdown Menu */}
          {isModeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsModeDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-stone-900/95 backdrop-blur-2xl border border-stone-800 p-2 shadow-2xl z-40 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-800/70 mb-1 flex items-center justify-between">
                  <span>Workspace</span>
                  <span className="text-[9px] text-stone-500">Switch mode</span>
                </div>

                {/* Option 1: Breezy */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProductMode('breezy');
                    setIsModeDropdownOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    productMode === 'breezy'
                      ? 'bg-sky-500/15 border border-sky-500/30 text-white'
                      : 'hover:bg-stone-800/60 text-stone-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-400">
                      <BreezyLogoIcon className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <span className="font-semibold text-xs text-white">Breezy</span>
                  </div>
                  {productMode === 'breezy' && (
                    <span className="material-symbols-outlined text-[16px] text-sky-400">check</span>
                  )}
                </button>

                {/* Option 2: Synthexis */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProductMode('synthexis');
                    setIsModeDropdownOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer mt-1 ${
                    productMode === 'synthexis'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                      : 'hover:bg-stone-800/60 text-stone-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <SynthexisLogoIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-white">Synthexis</span>
                  </div>
                  {productMode === 'synthexis' && (
                    <span className="material-symbols-outlined text-[16px] text-emerald-400">check</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Quick Search */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all bg-white/50 border-sky-200/60 text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm"
          title="Quick Jump / Search (⌘K)"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <span className="hidden sm:inline font-sans">Quick Jump</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-slate-400 bg-sky-100/80 px-1 py-0.5 rounded border border-sky-200/50">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
