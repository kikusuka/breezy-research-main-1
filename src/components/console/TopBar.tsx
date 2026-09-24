import React from 'react';
import { ConsoleTab } from './Sidebar';

interface TopBarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  sessionTitle?: string;
  latencyMs?: number;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  sessionTitle,
  latencyMs = 24,
  onOpenSearch,
  onToggleMobileMenu,
}) => {
  const getBreadcrumbTab = () => {
    switch (activeTab) {
      case 'chat':
        return 'chat-session';
      case 'notes':
        return 'consensus-vault';
      case 'models':
        return 'model-matrix';
      case 'settings':
        return 'workspace-settings';
      case 'landing':
        return 'overview';
      default:
        return 'workspace';
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 z-40 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1 text-on-surface-variant hover:text-on-surface lg:hidden rounded hover:bg-surface-container"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="flex items-center gap-1.5 font-mono text-xs text-outline select-none">
          <span
            className="text-tertiary cursor-pointer hover:text-on-surface transition-colors"
            onClick={() => onSelectTab('landing')}
          >
            synthexis
          </span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">workspace</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-medium truncate max-w-[120px] sm:max-w-[220px]">
            {sessionTitle ? sessionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) : getBreadcrumbTab()}
          </span>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low border border-outline-variant/30">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-mono text-[10px] text-tertiary">Synthexis Tri-Stream Active</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search / Command trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 hover:border-primary/40 transition-colors text-outline hover:text-on-surface"
          title="Search telemetry & notes (⌘K)"
        >
          <span className="material-symbols-outlined text-[15px]">search</span>
          <span className="hidden md:inline font-sans text-xs">Search index, telemetry...</span>
          <div className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-surface-container border border-outline-variant/60 font-mono text-[9px] text-tertiary">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>

        {/* Landing Page Toggle Pill */}
        {activeTab === 'landing' ? (
          <button
            type="button"
            onClick={() => onSelectTab('chat')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-on-primary font-sans text-xs font-semibold shadow-xs hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">terminal</span>
            <span>Open Console</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectTab('landing')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-tertiary hover:text-on-surface font-sans text-xs border border-outline-variant/30 transition-colors"
            title="Read Product Overview Landing Page"
          >
            <span className="material-symbols-outlined text-[14px] text-primary">public</span>
            <span>About</span>
          </button>
        )}

        {/* Latency badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 font-mono text-xs text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          <span>{latencyMs}ms</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors relative"
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary"></span>
        </button>

        {/* User avatar */}
        <div
          onClick={() => onSelectTab('settings')}
          className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
          title="Account Settings"
        >
          <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
        </div>
      </div>
    </header>
  );
};
