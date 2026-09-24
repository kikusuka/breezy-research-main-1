import React, { useEffect, useState, useRef } from 'react';
import {
  Sliders,
  KeyRound,
  BookOpen,
  MessageSquare,
  Columns,
  LayoutGrid,
  History,
  Plus,
  LogIn,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Sun,
  Moon,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { ProviderKeyConfig, WindowViewMode, HeartbeatState } from '../types';
import { HeartbeatIndicator } from './HeartbeatIndicator';

interface HeaderProps {
  onOpenVault: () => void;
  onOpenCouncil: () => void;
  onOpenExplainer: () => void;
  onOpenHistory: () => void;
  onNewDebate: () => void;
  sessionCount: number;
  keys: ProviderKeyConfig;
  protocol: string;
  viewMode: WindowViewMode;
  onSelectViewMode: (mode: WindowViewMode) => void;
  heartbeat?: HeartbeatState;
  isDeliberating?: boolean;
  user: { name: string; email: string; picture: string; verified: boolean; joinedAt: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  interjectionEnabled?: boolean;
  onToggleInterjection?: () => void;
  onOpenShortcuts?: () => void;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVault,
  onOpenCouncil,
  onOpenExplainer,
  onOpenHistory,
  onNewDebate,
  sessionCount,
  keys,
  protocol,
  viewMode,
  onSelectViewMode,
  heartbeat,
  isDeliberating,
  user,
  onOpenLogin,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  interjectionEnabled = true,
  onToggleInterjection,
  onOpenShortcuts,
  onOpenTour,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-lg text-slate-100">
                Synthexis
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
                Research Lab
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 lg:block">
              Multi-Model Research & Strategic Analysis
            </p>
          </div>
        </div>

        {/* Center: View Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => onSelectViewMode('chat')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-all ${
                viewMode === 'chat'
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chat View"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('council')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-all ${
                viewMode === 'council'
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Analysis Workspace View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analysis</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 text-xs font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-slate-800 text-slate-100 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split</span>
            </button>
          </div>

          <HeartbeatIndicator
            heartbeat={heartbeat}
            isDeliberating={isDeliberating}
            onClick={() => onSelectViewMode('council')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewDebate}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-all"
            title="Start New Analysis Session"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-all"
            title="History"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden md:inline">History</span>
            <span className="rounded bg-slate-700 px-1.5 py-0.2 text-[11px] font-mono text-slate-300">
              {sessionCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
          </button>

          {onOpenTour && (
            <button
              type="button"
              onClick={onOpenTour}
              className="hidden lg:flex items-center gap-1 rounded-lg border border-indigo-800/60 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-900/40"
              title="Guided Overview"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Tour</span>
            </button>
          )}

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
              title="Keyboard Shortcuts"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-1.5 hover:bg-slate-700 transition-all"
              >
                <img
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                  alt={user.name}
                  className="h-6 w-6 rounded-full"
                />
                <span className="hidden sm:inline text-xs text-slate-200 font-medium max-w-[80px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && user && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-xl z-50">
                <div className="flex items-center gap-3 p-3 border-b border-slate-800 mb-2">
                  <img
                    src={user.picture || ''}
                    alt={user.name}
                    className="h-9 w-9 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1">
                      {user.name}
                      {user.verified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => { onOpenCouncil(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Model Settings</span>
                  </button>

                  <button
                    onClick={() => { onOpenVault(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>API Keys</span>
                  </button>

                  <button
                    onClick={() => { onOpenExplainer(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>How it Works</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 mt-2 pt-2">
                  <button
                    onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
