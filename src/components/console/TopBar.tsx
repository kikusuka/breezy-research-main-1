import React from 'react';
import { BreezyLogoIcon, SynthexisLogoIcon, SynapLogoIcon } from '../icons/ProductLogos';

export type ProductMode = 'breezy' | 'synthexis' | 'synap';

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
  return (
    <header
      className="fixed top-0 left-0 lg:left-64 right-0 h-16 backdrop-blur-xl z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-stone-800/60 bg-stone-950/90 text-stone-100 shadow-xs transition-colors duration-200"
    >
      {/* Left: Mobile Menu Toggle + Product Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-100 lg:hidden rounded-xl hover:bg-stone-800/50 active:bg-stone-800 cursor-pointer shrink-0 transition-colors"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Product Mode Switcher: Breezy / Synthexis / Synap */}
        <div
          className="flex items-center border rounded-full p-0.5 sm:p-1 shadow-inner shrink-0 bg-stone-900/80 border-stone-800"
        >
          <button
            type="button"
            onClick={() => onSelectProductMode('breezy')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
              productMode === 'breezy'
                ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BreezyLogoIcon className="w-4 h-4 text-sky-400" />
            <span>Breezy</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectProductMode('synthexis')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
              productMode === 'synthexis'
                ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <SynthexisLogoIcon className="w-4 h-4" />
            <span>Synthexis</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectProductMode('synap')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
              productMode === 'synap'
                ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <SynapLogoIcon className="w-4 h-4" />
            <span>Synap</span>
          </button>
        </div>
      </div>

      {/* Right: Search */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all bg-stone-900/60 border-stone-800 text-stone-300 hover:text-stone-100"
          title="Quick Jump / Search (⌘K)"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <span className="hidden sm:inline font-sans">Quick Jump</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-stone-400 bg-stone-800/60 px-1 py-0.5 rounded border border-stone-700/50">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
