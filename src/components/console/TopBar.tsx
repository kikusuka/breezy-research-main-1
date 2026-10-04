import React, { useState } from 'react';
import { SynthexisLogoIcon, BreezyLogoIcon } from '../icons/ProductLogos';

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
  productMode,
  onSelectProductMode,
  onOpenSearch,
  isSidebarOpen = true,
  onToggleSidebar,
  onToggleMobileMenu,
}) => {
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const handleToggle = onToggleSidebar || onToggleMobileMenu;

  return (
    <header
      className={`fixed top-0 left-0 ${
        isSidebarOpen ? 'lg:left-64' : 'left-0'
      } right-0 h-16 backdrop-blur-xl z-40 flex items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-stone-800/80 bg-[#090d16]/90 text-stone-100 shadow-sm transition-all duration-300`}
    >
      {/* Left: Sidebar Toggle + Seamless Unboxed Switch workspace */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={handleToggle}
          className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-100 rounded-xl hover:bg-stone-800/60 active:bg-stone-800 cursor-pointer shrink-0 transition-colors"
          title={isSidebarOpen ? 'Toggle sidebar' : 'Open sidebar'}
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSidebarOpen ? 'menu_open' : 'menu'}
          </span>
        </button>

        {/* Unboxed Brand & Workspace Switcher */}
        <div className="relative animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="group flex items-center gap-2 py-1.5 px-2 rounded-xl bg-transparent hover:bg-white/[0.04] transition-all cursor-pointer border-0 outline-none select-none"
            title="Switch Workspace"
          >
            {productMode === 'synthexis' && (
              <SynthexisLogoIcon className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 group-hover:text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] transition-all shrink-0" />
            )}
            {productMode === 'breezy' && (
              <BreezyLogoIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all shrink-0" />
            )}
            <span className="font-sans font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-sky-200 transition-colors">
              {productMode === 'breezy' ? 'Breezy' : 'Research'}
            </span>
            <span
              className={`material-symbols-outlined text-[20px] text-stone-400 group-hover:text-stone-200 transition-transform duration-200 ${
                isModeDropdownOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {/* Modern Seamless Glassmorphic Dropdown Menu */}
          {isModeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsModeDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#090d16]/95 backdrop-blur-2xl border border-white/[0.08] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_24px_rgba(56,189,248,0.08)] z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-white/[0.06] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    Breezy spaces
                  </span>
                  <span className="text-[9px] text-stone-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">
                    Choose a workspace
                  </span>
                </div>

                {/* Breezy option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProductMode('breezy');
                    setIsModeDropdownOpen(false);
                  }}
                  className={`group relative w-full text-left p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    productMode === 'breezy'
                      ? 'bg-sky-500/10 border border-sky-500/30'
                      : 'bg-white/[0.02] hover:bg-sky-500/[0.08] border border-white/[0.05] hover:border-sky-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src="/breezy-logo.svg"
                      alt="Breezy"
                      className="w-[22.5px] h-[22.5px] object-contain shrink-0"
                      style={{ width: '22.5px', height: '22.5px' }}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-semibold text-xs text-stone-100 group-hover:text-sky-300 transition-colors">
                          Breezy
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          AI Chat
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 group-hover:text-stone-300 truncate">
                        Chat, creative canvas & code ideation
                      </span>
                    </div>
                  </div>
                  {productMode === 'breezy' ? (
                    <span className="material-symbols-outlined text-[18px] text-sky-400 shrink-0">check</span>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] group-hover:bg-sky-500/20 border border-white/[0.06] group-hover:border-sky-500/30 flex items-center justify-center text-stone-400 group-hover:text-sky-300 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  )}
                </button>

                {/* Synthexis option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectProductMode('synthexis');
                    setIsModeDropdownOpen(false);
                  }}
                  className={`group relative w-full text-left p-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 mt-1.5 ${
                    productMode === 'synthexis'
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-white/[0.02] hover:bg-emerald-500/[0.08] border border-white/[0.05] hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SynthexisLogoIcon className="w-6 h-6 text-emerald-400 shrink-0 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)] transition-transform" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-semibold text-xs text-stone-100 group-hover:text-emerald-300 transition-colors">
                          Synthexis
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Research
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 group-hover:text-stone-300 truncate">
                        Multi-model adversarial debate & verification
                      </span>
                    </div>
                  </div>
                  {productMode === 'synthexis' ? (
                    <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">check</span>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] group-hover:bg-emerald-500/20 border border-white/[0.06] group-hover:border-emerald-500/30 flex items-center justify-center text-stone-400 group-hover:text-emerald-300 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  )}
                </button>

                {/* Subtle footer */}
                <div className="px-2.5 pt-2 pb-0.5 mt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-stone-400">
                  <span>
                    Current: <strong className="text-stone-200 capitalize">{productMode}</strong>
                  </span>
                  <span className="font-mono text-[9px] text-stone-400">Click to switch</span>
                </div>
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-900 shadow-sm"
          title="Quick Jump / Search (⌘K)"
        >
          <span className="material-symbols-outlined text-[16px]">search</span>
          <span className="hidden sm:inline font-sans">Quick Jump</span>
          <kbd className="hidden sm:inline font-mono text-[10px] text-stone-400 bg-stone-900 px-1 py-0.5 rounded border border-stone-800">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
};
