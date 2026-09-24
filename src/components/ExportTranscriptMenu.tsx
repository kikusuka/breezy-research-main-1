import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileText,
  FileCode,
  FileJson,
  Printer,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  ExportableDebate,
  exportConsensusAsPdf,
  exportConsensusAsMarkdown,
  exportFullTranscriptAsPdf,
  exportTranscriptAsMarkdown,
  exportTranscriptAsText,
  exportTranscriptAsJson,
  generateConsensusMarkdown,
  generateMarkdownTranscript,
} from '../utils/exportTranscript';

interface ExportTranscriptMenuProps {
  debate: ExportableDebate;
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
}

export const ExportTranscriptMenu: React.FC<ExportTranscriptMenuProps> = ({
  debate,
  variant = 'secondary',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'consensus' | 'full' | null>(null);
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

  const handleCopyConsensusMarkdown = async () => {
    try {
      const md = generateConsensusMarkdown(debate);
      await navigator.clipboard.writeText(md);
      setCopiedType('consensus');
      setTimeout(() => {
        setCopiedType(null);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy consensus:', err);
    }
  };

  const handleCopyFullMarkdown = async () => {
    try {
      const md = generateMarkdownTranscript(debate);
      await navigator.clipboard.writeText(md);
      setCopiedType('full');
      setTimeout(() => {
        setCopiedType(null);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy full transcript:', err);
    }
  };

  const handleExportConsensusPdf = () => {
    exportConsensusAsPdf(debate);
    setIsOpen(false);
  };

  const handleExportConsensusMd = () => {
    exportConsensusAsMarkdown(debate);
    setIsOpen(false);
  };

  const handleExportFullPdf = () => {
    exportFullTranscriptAsPdf(debate);
    setIsOpen(false);
  };

  const handleExportFullMd = () => {
    exportTranscriptAsMarkdown(debate);
    setIsOpen(false);
  };

  const handleExportTxt = () => {
    exportTranscriptAsText(debate);
    setIsOpen(false);
  };

  const handleExportJson = () => {
    exportTranscriptAsJson(debate);
    setIsOpen(false);
  };

  const buttonStyles = {
    primary:
      'border border-[#2e374d] bg-[#1a2030] text-slate-100 hover:bg-[#222b40] hover:border-[#3d4a66]',
    secondary:
      'border border-[#262c3b] bg-[#121620] text-slate-300 hover:bg-[#181d2a] hover:border-[#363e52] hover:text-white',
    minimal:
      'border border-transparent bg-transparent text-slate-400 hover:bg-[#181d28] hover:text-slate-200',
  }[variant];

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        id="export-transcript-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${buttonStyles}`}
        title="Export debate consensus or transcript as PDF, Markdown, Text, or JSON"
      >
        <Download className="h-3.5 w-3.5 text-amber-400" />
        <span>Export</span>
        <ChevronDown
          className={`h-3 w-3 text-slate-500 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-[#262c3b] bg-[#10131b] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {/* Section: Final Consensus Resolution */}
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 border-b border-[#1b202c] mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            <span>Final Debate Consensus</span>
          </div>

          <button
            type="button"
            onClick={handleExportConsensusPdf}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Printer className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-medium text-white">Consensus Document</span>
            </div>
            <span className="font-mono text-[10px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/40 px-1.5 py-0.5 rounded">
              PDF
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportConsensusMd}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-amber-400" />
              <span>Consensus Markdown</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">.md</span>
          </button>

          {/* Section: Full Transcript */}
          <div className="mt-2 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-[#1b202c] mb-1">
            Full Proceedings Archive
          </div>

          <button
            type="button"
            onClick={handleExportFullPdf}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Printer className="h-3.5 w-3.5 text-indigo-400" />
              <span>Full Proceedings</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportFullMd}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-3.5 w-3.5 text-emerald-400" />
              <span>Full Transcript</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">.md</span>
          </button>

          <button
            type="button"
            onClick={handleExportTxt}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Plain Text Transcript</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">.txt</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileJson className="h-3.5 w-3.5 text-sky-400" />
              <span>Structured JSON Data</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">.json</span>
          </button>

          <div className="my-1 border-t border-[#1b202c]" />

          {/* Clipboard Copy */}
          <button
            type="button"
            onClick={handleCopyConsensusMarkdown}
            className="flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-[#191e2b] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              {copiedType === 'consensus' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>
                {copiedType === 'consensus'
                  ? 'Copied Consensus!'
                  : 'Copy Consensus Markdown'}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
