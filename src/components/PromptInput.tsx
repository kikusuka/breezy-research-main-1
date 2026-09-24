import React, { useState, useRef, useEffect } from 'react';
import { StopCircle, CornerDownLeft } from 'lucide-react';
import { PRESET_QUESTIONS } from '../data/presets';
import { PresetQuestion } from '../types';

interface PromptInputProps {
  onStartDebate: (promptText: string) => void;
  isDeliberating: boolean;
  onCancel?: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onStartDebate,
  isDeliberating,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isDeliberating) return;
    onStartDebate(prompt.trim());
  };

  const handleSelectPreset = (preset: PresetQuestion) => {
    setPrompt(preset.prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Auto resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K anywhere -> Focus prompt
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
      
      // Cmd+Enter or Ctrl+Enter -> Submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (prompt.trim() && !isDeliberating) {
          e.preventDefault();
          onStartDebate(prompt.trim());
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [prompt, isDeliberating, onStartDebate]);

  return (
    <div className="w-full space-y-3">
      {/* Sample Questions */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">
          Sample Questions:
        </span>
        {PRESET_QUESTIONS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className="rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-900/90 p-3 transition-all focus-within:border-slate-700 focus-within:bg-slate-900">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a technical or strategic question, architecture proposal, or security trade-off..."
          rows={2}
          disabled={isDeliberating}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50 leading-relaxed font-sans"
        />

        <div className="flex items-center justify-between border-t border-slate-800 px-2 pt-2.5 text-xs">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span><kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">Enter</kbd> submit</span>
            <span className="text-slate-600">•</span>
            <span><kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">Shift+Enter</kbd> new line</span>
          </div>

          <div className="flex items-center gap-2">
            {isDeliberating ? (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-300 transition-all hover:bg-rose-900/60"
              >
                <StopCircle className="h-3.5 w-3.5" />
                <span>Cancel Analysis</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
                <span>Run Analysis</span>
                <CornerDownLeft className="h-3.5 w-3.5 text-blue-200" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
