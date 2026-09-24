import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileCode,
  FileText,
  Printer,
  FileJson,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import {
  ExportableDebate,
  exportConsensusAsMarkdown,
  exportConsensusAsPdf,
  exportFullTranscriptAsPdf,
  exportTranscriptAsMarkdown,
  exportTranscriptAsJson,
  generateConsensusMarkdown,
} from '../utils/exportTranscript';

interface FloatingExportButtonProps {
  debate: ExportableDebate;
  className?: string;
}

export const FloatingExportButton: React.FC<FloatingExportButtonProps> = ({
  debate,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasConsensus = Boolean(debate.finalOutput && debate.finalOutput.trim().length > 0);
  const hasSteps = Boolean(debate.steps && debate.steps.length > 0);

  // If no content to export yet, don't show the button
  if (!hasConsensus && !hasSteps) {
    return null;
  }

  const handleExportConsensusMd = () => {
    exportConsensusAsMarkdown(debate);
    setLastAction('Downloaded Consensus (.md)');
    setTimeout(() => {
      setLastAction(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleExportConsensusPdf = () => {
    exportConsensusAsPdf(debate);
    setLastAction('Opened PDF Archival View');
    setTimeout(() => {
      setLastAction(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleExportFullMd = () => {
    exportTranscriptAsMarkdown(debate);
    setLastAction('Downloaded Full Transcript (.md)');
    setTimeout(() => {
      setLastAction(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleExportFullPdf = () => {
    exportFullTranscriptAsPdf(debate);
    setLastAction('Opened Full PDF Archival View');
    setTimeout(() => {
      setLastAction(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleExportJson = () => {
    exportTranscriptAsJson(debate);
    setLastAction('Downloaded Structured JSON');
    setTimeout(() => {
      setLastAction(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleCopyMarkdown = async () => {
    try {
      const md = generateConsensusMarkdown(debate);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setLastAction('Copied to Clipboard!');
      setTimeout(() => {
        setCopied(false);
        setLastAction(null);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy consensus markdown:', err);
    }
  };

  return (
    <div
      ref={menuRef}
      className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 select-none ${className}`}
    >
      {/* Floating Trigger Button */}
      <div className="flex items-center shadow-2xl rounded-full border border-amber-500/40 bg-[#121622]/95 backdrop-blur-md p-1 pl-1.5 transition-all duration-200 hover:border-amber-400/70 hover:shadow-amber-950/40">
        {/* Quick Click: Trigger primary consensus markdown download or toggle menu */}
        <button
          type="button"
          id="floating-export-consensus-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600/90 to-amber-500/90 hover:from-amber-500 hover:to-amber-400 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-sm transition-all active:scale-95"
          title="Export current council deliberation consensus (Markdown or PDF)"
        >
          <Download className="h-3.5 w-3.5 text-slate-950 stroke-[2.5]" />
          <span>Export Consensus</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-950 transition-transform duration-200 stroke-[2.5] ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Direct PDF Quick Action Button */}
        <button
          type="button"
          onClick={handleExportConsensusPdf}
          className="ml-1 rounded-full p-1.5 text-slate-300 hover:bg-[#1f2638] hover:text-rose-300 transition-colors"
          title="Direct print / save consensus as PDF"
        >
          <Printer className="h-3.5 w-3.5" />
        </button>

        {/* Direct Markdown Quick Action Button */}
        <button
          type="button"
          onClick={handleExportConsensusMd}
          className="rounded-full p-1.5 text-slate-300 hover:bg-[#1f2638] hover:text-amber-300 transition-colors"
          title="Direct download consensus as Markdown (.md)"
        >
          <FileCode className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2.5 w-72 rounded-2xl border border-[#2a3248] bg-[#0e111a]/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#1c2232] mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Export Consensus & Record</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Consensus Section */}
          <div className="space-y-1">
            <div className="px-2.5 pt-1 text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
              Final Consensus
            </div>

            <button
              type="button"
              onClick={handleExportConsensusMd}
              className="flex items-center justify-between w-full rounded-xl px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#1a2132] hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                  <FileCode className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-slate-100">Consensus Markdown</div>
                  <div className="text-[10px] text-slate-400">Structured markdown document</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                .md
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportConsensusPdf}
              className="flex items-center justify-between w-full rounded-xl px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#1a2132] hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
                  <Printer className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-slate-100">Consensus Document</div>
                  <div className="text-[10px] text-slate-400">Print-ready archival PDF</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.5 rounded">
                PDF
              </span>
            </button>
          </div>

          <div className="my-1.5 border-t border-[#1c2232]" />

          {/* Full Proceedings Section */}
          <div className="space-y-1">
            <div className="px-2.5 pt-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Complete Proceedings
            </div>

            <button
              type="button"
              onClick={handleExportFullMd}
              className="flex items-center justify-between w-full rounded-xl px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-[#1a2132] hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">Full Debate Ledger</div>
                  <div className="text-[10px] text-slate-400">All rounds + critique synthesis</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-400">.md</span>
            </button>

            <button
              type="button"
              onClick={handleExportFullPdf}
              className="flex items-center justify-between w-full rounded-xl px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-[#1a2132] hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Printer className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">Full Proceedings PDF</div>
                  <div className="text-[10px] text-slate-400">Complete multi-round archive</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-400">PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center justify-between w-full rounded-xl px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-[#1a2132] hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <FileJson className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-medium text-slate-200">Structured Data</div>
                  <div className="text-[10px] text-slate-400">Complete JSON telemetry object</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-slate-400">.json</span>
            </button>
          </div>

          <div className="my-1.5 border-t border-[#1c2232]" />

          {/* Clipboard Copy */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center justify-between w-full rounded-xl px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#1a2132] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="font-medium">
                {copied ? 'Copied to Clipboard!' : 'Copy Consensus Markdown'}
              </span>
            </div>
          </button>

          {/* Confirmation Toast */}
          {lastAction && (
            <div className="mt-1 px-2.5 py-1 text-center text-[10.5px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 rounded-lg animate-in fade-in">
              {lastAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
