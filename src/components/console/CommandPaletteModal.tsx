import React, { useState, useEffect } from 'react';
import { ConsoleTab } from './Sidebar';
import { DebateSession } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ConsoleTab) => void;
  sessions: DebateSession[];
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  sessions,
  onSelectSession,
  onNewSession,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Global escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.prompt.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20 bg-surface-container">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search sessions & telemetry..."
            className="flex-1 bg-transparent border-0 outline-none font-sans text-sm text-on-surface placeholder:text-outline"
          />
          <kbd className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/40 font-mono text-[10px] text-tertiary">
            ESC
          </kbd>
        </div>

        {/* Quick Actions List */}
        <div className="p-2 max-h-80 overflow-y-auto flex flex-col gap-1">
          <div className="px-3 py-1 font-mono text-[10px] uppercase text-outline font-semibold">
            Navigation
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectTab('chat');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px]">forum</span>
              <span className="font-sans text-xs font-medium">Go to Chat Workspace</span>
            </div>
            <span className="font-mono text-[10px] text-outline">⌘1</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('notes');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px]">auto_stories</span>
              <span className="font-sans text-xs font-medium">Browse Research Notes & Archives</span>
            </div>
            <span className="font-mono text-[10px] text-outline">⌘2</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('models');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
              <span className="font-sans text-xs font-medium">Models & Consensus Arbitration</span>
            </div>
            <span className="font-mono text-[10px] text-outline">⌘3</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('settings');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              <span className="font-sans text-xs font-medium">Workspace & Provider Settings</span>
            </div>
            <span className="font-mono text-[10px] text-outline">⌘,</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('landing');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-on-surface transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px]">public</span>
              <span className="font-sans text-xs font-medium">Product Overview & Landing Page</span>
            </div>
          </button>

          <div className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase text-outline font-semibold border-t border-outline-variant/15 mt-1">
            Recent Sessions
          </div>

          <button
            type="button"
            onClick={() => {
              onNewSession();
              onSelectTab('chat');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-secondary transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="font-sans text-xs font-medium">Start New Dialectic Inquiry</span>
            </div>
            <span className="font-mono text-[10px]">⌘N</span>
          </button>

          {filteredSessions.slice(0, 5).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelectSession(s.id);
                onSelectTab('chat');
                onClose();
              }}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-outline text-[16px]">chat_bubble_outline</span>
                <span className="font-sans text-xs truncate max-w-sm">{s.prompt}</span>
              </div>
              <span className="font-mono text-[10px] text-outline">
                {s.steps?.length || 0} nodes
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
