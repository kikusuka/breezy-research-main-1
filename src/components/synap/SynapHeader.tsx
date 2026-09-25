import React from 'react';
import { ProductMode } from '../console/TopBar';

interface SynapHeaderProps {
  readinessPercentage: number;
  productMode?: ProductMode;
  onSelectProductMode?: (mode: ProductMode) => void;
  onOpenQuickJump?: () => void;
  onToggleMobileMenu?: () => void;
}

export const SynapHeader: React.FC<SynapHeaderProps> = ({
  readinessPercentage,
  productMode = 'synap',
  onSelectProductMode,
  onOpenQuickJump,
  onToggleMobileMenu,
}) => {
  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#0A0A0F]/90 backdrop-blur-xl z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-white/5 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      {/* Left Group: Readiness & Exam Countdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-stone-400 hover:text-stone-100 lg:hidden rounded-lg hover:bg-white/5"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1b23] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#45dfa4] shadow-[0_0_8px_rgba(69,223,164,0.6)]"></span>
          <span className="font-sans text-[11px] text-[#cac4d4]">
            Overall Exam Readiness
          </span>
          <span className="font-mono text-xs text-[#68fcbf] font-bold">
            {readinessPercentage}%
          </span>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b1b23] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)]">
          <span className="material-symbols-outlined text-[#cabeff] text-[15px]">
            schedule
          </span>
          <span className="font-sans text-[11px] text-stone-200">
            Neurobiology Final
          </span>
          <span className="font-mono text-[11px] text-[#e6deff] font-semibold">
            • 4 days left
          </span>
        </div>
      </div>

      {/* Center: Breezy / Synthexis / Synap Mode Switcher */}
      {onSelectProductMode && (
        <div className="hidden md:flex items-center bg-black/40 border border-white/10 rounded-full p-1 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectProductMode('breezy')}
            className={`px-3 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
              productMode === 'breezy'
                ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">air</span>
            <span>Breezy</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectProductMode('synthexis')}
            className={`px-3 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
              productMode === 'synthexis'
                ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">psychology</span>
            <span>Synthexis</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectProductMode('synap')}
            className={`px-3 py-1 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${
              productMode === 'synap'
                ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">lan</span>
            <span>Synap</span>
          </button>
        </div>
      )}

      {/* Right Group: Search and Alerts */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onOpenQuickJump?.()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f27] hover:bg-[#292932] text-[#cac4d4] hover:text-stone-100 transition-all border border-white/5 text-xs cursor-pointer shadow-[inset_0_1px_0_rgba(232,235,255,0.08)]"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <span className="hidden sm:inline font-sans">Quick Jump</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-stone-400 bg-white/5 px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          className="w-8 h-8 rounded-full bg-[#1f1f27] hover:bg-[#292932] text-[#cac4d4] hover:text-stone-100 flex items-center justify-center transition-all border border-white/5 cursor-pointer"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[18px]">
            notifications_none
          </span>
        </button>
      </div>
    </header>
  );
};
