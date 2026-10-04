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
  onSelectProductMode?: (mode: 'synthexis' | 'breezy') => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  sessions,
  onSelectSession,
  onNewSession,
  onSelectProductMode,
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

  const q = query.trim().toLowerCase();
  const filteredSessions = sessions.filter((s) =>
    (s.prompt || '').toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#14141e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#191924]">
          <span className="material-symbols-outlined text-[#4cd6fb] text-[20px]">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search research sessions, topologies, or type a command..."
            className="flex-1 bg-transparent border-0 outline-none font-sans text-sm text-[#e1e2e9] placeholder:text-[#869398]"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-[#bcc9ce]">
            ESC
          </kbd>
        </div>

        {/* Quick Actions List */}
        <div className="p-2 max-h-96 overflow-y-auto flex flex-col gap-1 text-[#e1e2e9]">
          {/* Modes Section */}
          <div className="px-3 py-1 font-mono text-[10px] uppercase text-[#4cd6fb] font-semibold">
            Product Workspaces
          </div>

          {onSelectProductMode && (
            <div className="grid grid-cols-2 gap-1 px-1 mb-1">
              <button
                type="button"
                onClick={() => {
                  onSelectProductMode('breezy');
                  onClose();
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#9d85f2]/20 hover:text-white transition-colors text-left text-xs font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#7bd0ff]">air</span>
                <span>Breezy AI Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectProductMode('synthexis');
                  onClose();
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#9d85f2]/20 hover:text-white transition-colors text-left text-xs font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#4cd6fb]">account_tree</span>
                <span>Breezy Research Council</span>
              </button>
            </div>
          )}

          {/* Navigation Section */}
          <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-[#bcc9ce] font-semibold border-t border-white/5">
            Quick Navigation
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSelectProductMode) onSelectProductMode('synthexis');
              onSelectTab('chat');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-white/5 text-[#e1e2e9] hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#4cd6fb] text-[18px]">forum</span>
              <span className="font-sans text-xs font-medium">Research workspace</span>
            </div>
            <span className="font-mono text-[10px] text-[#bcc9ce]">⌘1</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectProductMode) onSelectProductMode('synthexis');
              onSelectTab('notes');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-white/5 text-[#e1e2e9] hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#4cd6fb] text-[18px]">menu_book</span>
              <span className="font-sans text-xs font-medium">Dialectic Knowledge Archives</span>
            </div>
            <span className="font-mono text-[10px] text-[#bcc9ce]">⌘2</span>
          </button>

          {/* Research sessions */}
          <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-[#bcc9ce] font-semibold border-t border-white/5 mt-1">
            Research sessions
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSelectProductMode) onSelectProductMode('synthexis');
              onNewSession();
              onSelectTab('chat');
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-white/5 text-[#4cd6fb] hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="font-sans text-xs font-medium">Start new research</span>
            </div>
            <span className="font-mono text-[10px]">⌘N</span>
          </button>

          {filteredSessions.slice(0, 5).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (onSelectProductMode) onSelectProductMode('synthexis');
                onSelectSession(s.id);
                onSelectTab('chat');
                onClose();
              }}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-white/5 text-[#bcc9ce] hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-[#869398] text-[16px]">chat_bubble_outline</span>
                <span className="font-sans text-xs truncate max-w-sm">{s.prompt}</span>
              </div>
              <span className="font-mono text-[10px] text-[#bcc9ce]">
                {s.steps?.length || 0} nodes
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
