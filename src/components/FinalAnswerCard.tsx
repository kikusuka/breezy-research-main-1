import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Scale,
  Printer,
  FileCode,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DebateStep } from '../types';
import { ExportTranscriptMenu } from './ExportTranscriptMenu';
import {
  exportConsensusAsPdf,
  exportConsensusAsMarkdown,
} from '../utils/exportTranscript';
import { AGENT_AVATARS } from '../data/agentAvatars';

interface FinalAnswerCardProps {
  content: string;
  prompt?: string;
  protocol?: string;
  steps?: DebateStep[];
  metrics?: {
    durationMs: number;
    consensusRate: number;
    contentionLevel: string;
    resolvedPointsCount: number;
  };
  onRerun?: () => void;
}

export const FinalAnswerCard: React.FC<FinalAnswerCardProps> = ({
  content,
  prompt = '',
  protocol = 'trio',
  steps = [],
  metrics,
  onRerun,
}) => {
  const [copied, setCopied] = useState(false);

  const debateData = {
    prompt: prompt || 'Research Inquiry',
    protocol,
    steps,
    finalOutput: content,
    metrics,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    exportConsensusAsPdf(debateData);
  };

  const handleExportMarkdown = () => {
    exportConsensusAsMarkdown(debateData);
  };

  const modelCount = steps.length > 0 ? new Set(steps.map(s => s.role)).size : 3;

  return (
    <div
      id="final-synthesized-answer"
      className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl transition-all"
    >
      {/* Top Banner / Verdict Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-500/40 bg-slate-800 shadow-sm">
            <img
              src={AGENT_AVATARS.arbiter.avatarSrc}
              alt="Reviewer"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-slate-900 bg-slate-800 shadow-xs">
              <Scale className="h-2.5 w-2.5 text-amber-400" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-semibold text-slate-100">
                Synthesized Answer
              </h3>
              <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono uppercase text-slate-300">
                Reviewed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reviewed by {modelCount} models · Reconciled by Reviewer
            </p>
          </div>
        </div>

        {/* Single Copy Button & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-all shadow-xs"
            title="Copy answer to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-all"
            title="Export answer as PDF"
          >
            <Printer className="h-3.5 w-3.5 text-rose-400" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-all"
            title="Download as Markdown (.md)"
          >
            <FileCode className="h-3.5 w-3.5 text-amber-400" />
            <span>.MD</span>
          </button>

          <ExportTranscriptMenu
            debate={debateData}
            variant="secondary"
          />

          {onRerun && (
            <button
              type="button"
              onClick={onRerun}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              title="Rerun analysis"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Rerun</span>
            </button>
          )}
        </div>
      </div>

      {/* Honest Metrics Row */}
      {metrics && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 text-xs font-mono">
          <div className="border-r border-slate-800 last:border-r-0 pr-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Model Agreement
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-emerald-400">
                {metrics.consensusRate}%
              </span>
            </div>
          </div>

          <div className="border-r border-slate-800 last:border-r-0 pr-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Analysis Time
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-slate-200">
                {metrics.durationMs ? `${(metrics.durationMs / 1000).toFixed(1)}s` : 'Realtime'}
              </span>
            </div>
          </div>

          <div className="border-r border-slate-800 last:border-r-0 pr-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Points Resolved
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-slate-200">
                {metrics.resolvedPointsCount}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Models Evaluated
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-semibold text-slate-200">
                {modelCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Body with Clean Sans Typography */}
      <div className="prose prose-invert max-w-none space-y-3 font-sans text-[14.5px] leading-relaxed text-slate-200 selection:bg-blue-500/20 [&_p]:text-[14.5px] [&_p]:leading-relaxed [&_p]:my-2.5 [&_h1]:text-[20px] [&_h1]:font-semibold [&_h1]:text-slate-100 [&_h1]:mt-5 [&_h1]:mb-2 [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-slate-100 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-slate-200 [&_h3]:mt-3.5 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_strong]:text-slate-100 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-slate-800 [&_code]:border [&_code]:border-slate-700 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-slate-200 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-800 [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-500/50 [&_blockquote]:pl-4 [&_blockquote]:py-0.5 [&_blockquote]:my-3 [&_blockquote]:text-slate-300 [&_blockquote]:italic [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-800 [&_th]:bg-slate-800/60 [&_th]:p-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-mono [&_td]:border [&_td]:border-slate-800 [&_td]:p-2.5 [&_td]:text-xs [&_td]:font-mono">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};
