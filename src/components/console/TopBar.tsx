import React, { useState, useEffect, useRef } from 'react';
import { ConsoleTab } from './Sidebar';
import { apiClient, BackendState } from '../../services/apiClient';
import { BreezyLogoIcon, SynthexisLogoIcon, SynapLogoIcon } from '../icons/ProductLogos';

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
  const [backendState, setBackendState] = useState<BackendState>(() => apiClient.getState());
  const [showBackendMenu, setShowBackendMenu] = useState(false);
  const backendMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = apiClient.subscribe((state) => {
      setBackendState(state);
    });
    return () => unsub();
  }, []);

  // Dismiss backend dropdown on outside click or Escape key
  useEffect(() => {
    if (!showBackendMenu) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (backendMenuRef.current && !backendMenuRef.current.contains(e.target as Node)) {
        setShowBackendMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBackendMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBackendMenu]);
  return (
    <header className={`fixed top-0 left-0 lg:left-64 right-0 h-14 backdrop-blur-xl border-b z-40 flex items-center justify-between px-6 transition-all duration-300 ${
      theme === 'light'
        ? 'bg-stone-50/80 border-stone-200 text-stone-900'
        : 'bg-stone-950/80 border-stone-800/60 text-stone-100'
    }`}>
      {/* Zone 1: Breadcrumbs / Context */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-100 lg:hidden rounded-lg hover:bg-stone-800/60 transition-colors shrink-0"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <nav className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
          <span className="hover:text-stone-300 cursor-default transition-colors">Council_Protocol</span>
          <span className="text-stone-800">/</span>
          <span className="text-stone-300 font-bold tracking-normal">{activeTab === 'chat' ? 'Terminal' : activeTab === 'notes' ? 'Archives' : 'Matrix'}</span>
        </nav>
      </div>

      {/* Zone 2: Mode Hub (Center-ish but adhering to 3-zone flow) */}
      <div className="flex items-center gap-1 p-1 bg-stone-900/60 border border-stone-800/60 rounded-xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => onSelectProductMode('synthexis')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
            productMode === 'synthexis'
              ? 'bg-stone-100 text-stone-950 shadow-sm'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">adjust</span>
          <span className="hidden md:inline">Synthexis</span>
        </button>
        <button
          onClick={() => onSelectProductMode('synap')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
            productMode === 'synap'
              ? 'bg-stone-100 text-stone-950 shadow-sm'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">psychology</span>
          <span className="hidden md:inline">Synap</span>
        </button>
        <button
          onClick={() => onSelectProductMode('breezy')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
            productMode === 'breezy'
              ? 'bg-stone-100 text-stone-950 shadow-sm'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span className="hidden md:inline">Console</span>
        </button>
      </div>

      {/* Zone 3: Global Actions */}
      <div className="flex items-center gap-3">
        {/* Backend Selector: Editorial Style */}
        <div className="relative" ref={backendMenuRef}>
          <button
            type="button"
            onClick={() => setShowBackendMenu(!showBackendMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-800/60 bg-stone-900/40 text-[9px] font-mono text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-all cursor-pointer font-bold uppercase tracking-widest"
          >
            <div className="w-1 h-1 rounded-full bg-stone-500"></div>
            <span className="hidden md:inline">{backendState.activeId.toUpperCase()}_NODE</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>

          {showBackendMenu && (
            <div className="absolute right-0 mt-3 w-64 rounded-xl bg-stone-900 border border-stone-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-2xl">
              <div className="px-3 py-2 border-b border-stone-800 mb-1">
                <span className="text-[9px] uppercase font-mono font-bold tracking-[0.2em] text-stone-500">
                  Network_Topology
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {apiClient.getEndpoints().map((ep) => {
                  const isSelected = ep.id === backendState.activeId;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        apiClient.setEndpointManually(ep.id);
                        setShowBackendMenu(false);
                      }}
                      className={`text-left px-3 py-2 rounded-lg transition-colors flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-stone-800 text-stone-100'
                          : 'hover:bg-stone-800/50 text-stone-500 hover:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest">{ep.id}</span>
                        {isSelected && <div className="w-1 h-1 rounded-full bg-stone-100"></div>}
                      </div>
                      <span className="text-[9px] font-mono opacity-60 uppercase tracking-tighter">{ep.tierInfo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-800/60 bg-stone-900/40 text-stone-500 hover:text-stone-100 hover:bg-stone-800 transition-all cursor-pointer shadow-xl"
          title="Search Records (⌘K)"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>
      </div>
    </header>
  );
};
