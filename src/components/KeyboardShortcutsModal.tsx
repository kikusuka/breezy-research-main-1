import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Workspace Navigation',
      items: [
        { keyCombo: ['Cmd', 'K'], label: 'Focus Prompt Input' },
        { keyCombo: ['Cmd', 'Enter'], label: 'Start Analysis' },
        { keyCombo: ['1'], label: 'Switch to Chat View' },
        { keyCombo: ['2'], label: 'Switch to Analysis View' },
        { keyCombo: ['3'], label: 'Switch to Split View' },
      ],
    },
    {
      category: 'Analysis & Controls',
      items: [
        { keyCombo: ['Space'], label: 'Play / Pause Session Replay' },
        { keyCombo: ['Shift', '?'], label: 'Open Keyboard Shortcuts Help' },
        { keyCombo: ['Esc'], label: 'Close Active Modal / Overlay' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-[11px] text-slate-400">
              Quick keyboard navigation and controls
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {shortcuts.map((sec) => (
            <div key={sec.category} className="space-y-2">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                {sec.category}
              </h4>
              <div className="space-y-1.5">
                {sec.items.map((sc) => (
                  <div
                    key={sc.label}
                    className="flex items-center justify-between rounded-lg bg-slate-950/80 px-3 py-2 text-xs text-slate-300 border border-slate-800"
                  >
                    <span>{sc.label}</span>
                    <div className="flex items-center gap-1 font-mono text-[10.5px]">
                      {sc.keyCombo.map((k) => (
                        <kbd
                          key={k}
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-200 shadow-xs font-semibold"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-800 pt-4 flex justify-between items-center text-[10.5px] font-mono text-slate-400">
          <span>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">Esc</kbd> to exit</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-200 border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
