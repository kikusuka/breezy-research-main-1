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

  const q = query.trim().toLowerCase();

  const navigationActions: { id: ConsoleTab; label: string; icon: string; category: string }[] = [
    { id: 'chat', label: 'Direct Chat', icon: 'chat_bubble', category: 'Navigation' },
    { id: 'research', label: 'Research Workspace', icon: 'psychology', category: 'Navigation' },
    { id: 'history', label: 'Investigation History', icon: 'history', category: 'Navigation' },
    { id: 'models', label: 'Models & Providers', icon: 'hub', category: 'Navigation' },
    { id: 'docs', label: 'Architecture & Documentation', icon: 'menu_book', category: 'Navigation' },
    { id: 'settings', label: 'System Configuration', icon: 'settings', category: 'Navigation' },
    { id: 'build', label: 'Build Laboratory (IDE)', icon: 'terminal', category: 'Laboratories' },
    { id: 'canvas', label: 'Canvas Visual Board', icon: 'draw', category: 'Laboratories' },
  ];

  const filteredNav = navigationActions.filter(
    (n) => n.label.toLowerCase().includes(q) || n.id.includes(q)
  );

  const filteredSessions = sessions.filter((s) =>
    (s.prompt || '').toLowerCase().includes(q)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface-container border border-outline-variant/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-space-sm px-space-md py-3.5 border-b border-outline-variant/30 bg-surface-container-low">
          <span className="material-symbols-outlined text-primary text-[20px]">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search sessions, or navigate..."
            className="flex-1 bg-transparent text-on-surface placeholder:text-outline font-sans text-body-md focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30 text-outline font-mono text-[10px]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-space-sm space-y-space-md">
          {/* Quick Action: New Investigation */}
          <div>
            <button
              type="button"
              onClick={() => {
                onNewSession();
                onSelectTab('research');
                onClose();
              }}
              className="w-full flex items-center gap-space-md px-space-md py-2.5 rounded-xl hover:bg-surface-container-high transition-colors text-left group"
            >
              <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </span>
              <div className="flex flex-col">
                <span className="font-headline font-semibold text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                  New Investigation
                </span>
                <span className="font-sans text-label-sm text-outline">
                  Start an asynchronous multi-model research inquiry
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-space-md pb-1 font-mono text-[10px] uppercase tracking-wider text-outline">
                Navigation
              </div>
              <div className="flex flex-col gap-0.5">
                {filteredNav.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-space-md px-space-md py-2 rounded-xl hover:bg-surface-container-high transition-colors text-left group"
                  >
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">
                      {item.icon}
                    </span>
                    <span className="font-sans text-body-md text-on-surface flex-1">
                      {item.label}
                    </span>
                    <span className="font-mono text-[11px] text-outline">Jump</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions Section */}
          {filteredSessions.length > 0 && (
            <div>
              <div className="px-space-md pb-1 font-mono text-[10px] uppercase tracking-wider text-outline">
                Past Investigations
              </div>
              <div className="flex flex-col gap-0.5">
                {filteredSessions.slice(0, 5).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      onSelectSession(session.id);
                      onSelectTab('research');
                      onClose();
                    }}
                    className="w-full flex items-center gap-space-md px-space-md py-2 rounded-xl hover:bg-surface-container-high transition-colors text-left group"
                  >
                    <span className="material-symbols-outlined text-outline group-hover:text-tertiary transition-colors text-[18px]">
                      history
                    </span>
                    <span className="font-sans text-body-md text-on-surface truncate flex-1">
                      {session.prompt || 'Untitled investigation'}
                    </span>
                    <span className="font-mono text-code-sm text-outline">
                      {new Date(session.createdAt || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-space-md py-2 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between text-outline font-sans text-label-sm">
          <span>Search inquiries, docs, models, and settings</span>
          <div className="flex items-center gap-space-sm font-mono text-code-sm">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
