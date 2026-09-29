import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateSession, DebateStep, ProviderKeyConfig } from '../../types';
import { EvidenceGraphView } from './EvidenceGraphView';
import { userProfileService } from '../../services/userProfileService';

interface ChatDialecticViewProps {
  session: DebateSession;
  isDeliberating: boolean;
  activeRound: number;
  streamingRoundText: string;
  streamingRole: string;
  onStartDebate: (prompt: string) => void;
  onSaveNote?: (title: string, content: string) => void;
  onExportMarkdown?: () => void;
  onStudyInSynap?: (prompt: string, output: string) => void;
  onOpenModelsTab: () => void;
  keys: ProviderKeyConfig;
}

export const ChatDialecticView: React.FC<ChatDialecticViewProps> = ({
  session,
  isDeliberating,
  activeRound,
  streamingRoundText,
  streamingRole,
  onStartDebate,
  onSaveNote,
  onExportMarkdown,
  onStudyInSynap,
  onOpenModelsTab,
  keys,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subView, setSubView] = useState<'perspectives' | 'evidence'>('perspectives');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize input textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (!inputText.trim() || isDeliberating) return;
    const prompt = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onStartDebate(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyText = () => {
    const textToCopy = session.finalOutput || (session.steps && session.steps.length > 0 ? session.steps.map(s => `[${s.agentName}]: ${s.content}`).join('\n\n') : session.prompt);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotesClick = () => {
    const title = session.prompt.slice(0, 60);
    const content = session.finalOutput || 'Dialectic analysis in progress.';
    onSaveNote?.(title, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Find steps for the 3 dialectic perspectives
  const stepAnalyst = session.steps.find((s) => s.role === 'architect');
  const stepCritic = session.steps.find((s) => s.role === 'skeptic');
  const stepSynthesizer = session.steps.find((s) => s.role === 'synthesizer' || s.role === 'arbiter');

  const durationText = session.metrics?.durationMs
    ? `${(session.metrics.durationMs / 1000).toFixed(1)}s`
    : '';

  const getTruthfulBadge = () => {
    if (isDeliberating) return { label: 'ANALYSIS ACTIVE', color: 'bg-amber-500', icon: 'sync', pulse: true };
    if (session.status === 'error') return { label: 'ENGINE FAILURE', color: 'bg-error', icon: 'error' };
    if (session.protocol === 'solo') return { label: 'SOLO INQUIRY', color: 'bg-stone-600', icon: 'bolt' };
    
    if (session.status === 'completed') {
      const metrics = session.researchMetrics;
      // If no metrics yet (legacy or loading), show generic
      if (!metrics || metrics.claimsIdentified === 0) return { label: 'RESEARCH CONCLUDED', color: 'bg-stone-500', icon: 'check_circle' };
      
      if (metrics.claimsContradicted > 0) return { label: 'COUNTER-CLAIMS DETECTED', color: 'bg-amber-500', icon: 'rule' };
      if (metrics.claimsUnresolved > metrics.claimsSupported) return { label: 'INSUFFICIENT EVIDENCE', color: 'bg-amber-600', icon: 'warning' };
      if (metrics.synthexisRate && metrics.synthexisRate >= 90) return { label: 'HIGH SYNTHESIS CONSISTENCY', color: 'bg-emerald-500', icon: 'verified' };
      
      return { label: 'SYNTHESIS AUDITED', color: 'bg-emerald-600', icon: 'fact_check' };
    }
    
    return { label: 'ENGINE STANDBY', color: 'bg-stone-800', icon: 'pause' };
  };

  const badge = getTruthfulBadge();

  const suggestionChips = [
    'Show cost comparison ($/mo)',
    'Explain failover steps',
    'Generate Terraform snippet',
    'Evaluate write concurrency locks',
  ];

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)]">
      {/* Status Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-stone-900/40 border-b border-stone-800/40 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500 uppercase tracking-widest">
            <span className="text-stone-300">Workspace</span>
            <span className="text-stone-700">/</span>
            <span className="text-stone-400">Research</span>
            <span className="text-stone-700">/</span>
            <span className="text-stone-100 font-bold truncate max-w-[160px]">
              Record {session.id.slice(0, 8)}
            </span>
          </div>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-stone-800"></span>
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-stone-950 border border-stone-800">
            <span className={`h-1.5 w-1.5 rounded-full ${isDeliberating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="font-mono text-[9px] text-stone-400 tracking-[0.2em] font-bold uppercase">
              {isDeliberating ? 'Active' : 'Standby'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-2 px-3 py-1 rounded bg-stone-950 border border-stone-800`}>
            <span className={`material-symbols-outlined text-[14px] ${badge.pulse ? 'animate-spin' : ''} text-stone-300`}>{badge.icon}</span>
            <span className={`font-mono text-[9px] text-stone-200 font-bold uppercase tracking-widest`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Session Header Strip */}
      <div className="px-4 sm:px-8 py-5 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/15">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[10px] uppercase tracking-wider font-semibold">
              Deep Research
            </span>
            <span className="font-mono text-[11px] text-outline">
              Initiated {new Date(session.createdAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <h1 className="font-sans text-xl sm:text-2xl text-on-surface tracking-tight font-semibold">
            {session.prompt || 'New Research Inquiry'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {session.status === 'completed' && onStudyInSynap && (
            <button
              type="button"
              onClick={() => onStudyInSynap(session.prompt, session.finalOutput || '')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-semibold border border-emerald-500/20"
              title="Create a study notebook with flashcards based on this research session"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">school</span>
              <span>Study in Synap</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveToNotesClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors text-xs font-medium border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">bookmark_add</span>
            <span>{saved ? 'Saved!' : 'Save to Notes'}</span>
          </button>

          <button
            type="button"
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors text-xs font-medium border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">ios_share</span>
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Main Dialogue & Dialectic Stream Container */}
      <div className="flex-1 px-4 sm:px-8 py-6 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-36">
        {/* 1. User Inquiry Message */}
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-stone-400 text-[18px]">terminal</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-stone-100 uppercase tracking-widest">
                INQUIRY
              </span>
              <span className="font-mono text-[9px] text-stone-500">
                {new Date(session.createdAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800/40 text-stone-200 font-sans text-sm leading-relaxed shadow-xs backdrop-blur-sm">
              {session.prompt}
            </div>
          </div>
        </div>

        {/* 2. Research Synthexis Card */}
        <div className="relative overflow-hidden rounded-xl bg-stone-900/60 border border-stone-700/40 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Top verdict bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800/60 border border-stone-700/60 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-stone-200 text-[20px]">adjust</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-stone-100 uppercase tracking-widest">
                    SYNTHEXIS
                  </span>
                  <div className={`px-2 py-0.5 rounded ${badge.color} text-on-primary font-mono text-[9px] uppercase font-bold tracking-tighter`}>
                    {badge.label.replace('RESEARCH ', '')}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-stone-500 mt-0.5 uppercase tracking-wide">
                  Integrated analysis ({durationText})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenModelsTab}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/40 border border-stone-700/40 hover:border-stone-500/60 text-stone-400 hover:text-stone-100 font-mono text-[10px] transition-all uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[14px]">hub</span>
                <span>Topology</span>
              </button>
            </div>
          </div>

          {/* Recommendation content */}
          <div className="py-4">
            <div className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
              <span>Primary Research Synthesis</span>
            </div>

            {session.finalOutput ? (
              <div className="text-stone-200 font-serif italic text-sm sm:text-base leading-relaxed prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-stone-100 underline underline-offset-4 decoration-stone-700 hover:decoration-stone-400 transition-colors" />,
                  }}
                >
                  {session.finalOutput}
                </ReactMarkdown>
              </div>
            ) : isDeliberating ? (
              <div className="flex items-center gap-3 py-6 text-stone-400 font-mono text-[10px] uppercase tracking-widest">
                <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                <span>Synthesizing research findings and verifying evidence across sources...</span>
              </div>
            ) : (
              <div className="py-8 text-center text-[10px] text-stone-500 flex flex-col items-center justify-center gap-3 border border-dashed border-stone-800 rounded-xl my-2 bg-stone-900/20 uppercase tracking-widest">
                <span className="material-symbols-outlined text-stone-700 text-2xl">hourglass_empty</span>
                <p className="font-bold text-stone-400">Pipeline Idle</p>
                <p className="max-w-md">
                  Submit an inquiry to activate the dialectic engine.
                </p>
              </div>
            )}
          </div>

          {/* Details bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-outline-variant/20 text-outline font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Duration: <strong className="text-on-surface font-medium">{durationText}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenModelsTab}
              className="text-primary hover:underline flex items-center gap-1 text-xs transition-colors"
            >
              <span>Inspect AI providers</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* 3. Independent Dialectic Feeds or Evidence Trail Graph */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-500 text-[18px]">
                {subView === 'perspectives' ? 'device_hub' : 'schema'}
              </span>
              <span className="font-mono text-[10px] uppercase text-stone-500 tracking-[0.2em] font-bold">
                {subView === 'perspectives' ? 'Investigated Perspectives' : 'Evidence Trail Graph'}
              </span>
            </div>

            {/* View Mode Toggle Pill */}
            <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setSubView('perspectives')}
                className={`px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-widest transition-all ${
                  subView === 'perspectives'
                    ? 'bg-stone-100 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                Comparative
              </button>
              <button
                type="button"
                onClick={() => setSubView('evidence')}
                className={`px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${
                  subView === 'evidence'
                    ? 'bg-stone-100 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">schema</span>
                <span>Graph</span>
              </button>
            </div>
          </div>

          {subView === 'evidence' ? (
            <EvidenceGraphView sessionTitle={session.prompt} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Lead Perspective */}
            <div className="rounded-xl bg-stone-900/10 border border-stone-800/40 p-6 flex flex-col gap-6 hover:border-stone-700/60 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-stone-400 text-[20px]">explore</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif italic text-base text-stone-100 font-medium">Lead Thesis</span>
                      <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                        Source Extraction
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[12px] font-sans text-stone-400 leading-relaxed min-h-[80px]">
                  {stepAnalyst?.content ? (
                    <div className="line-clamp-5 font-mono text-[11px] leading-relaxed">
                      {stepAnalyst.content.slice(0, 300)}...
                    </div>
                  ) : isDeliberating && activeRound === 1 ? (
                    <div className="font-mono text-[11px] text-stone-300 animate-pulse">
                      {streamingRoundText || 'Researching primary sources and extracting core claims...'}
                    </div>
                  ) : (
                    <p className="text-stone-600 text-xs italic py-2">
                      Initial analysis will appear here.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800/40 flex items-center justify-between">
                <span className="font-mono text-[9px] text-stone-700 uppercase font-bold tracking-[0.2em]">Phase I</span>
                <span className="font-mono text-[9px] text-stone-500 uppercase font-bold px-2 py-0.5 rounded bg-stone-950 border border-stone-800 tracking-tight">
                  Initial Evidence
                </span>
              </div>
            </div>

            {/* Card 2: Critic */}
            <div className="rounded-xl bg-stone-900/10 border border-stone-800/40 p-6 flex flex-col gap-6 hover:border-stone-700/60 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-stone-400 text-[20px]">rule</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif italic text-base text-stone-100 font-medium">Adversarial Critique</span>
                      <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                        Stress Testing
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[12px] font-sans text-stone-400 leading-relaxed min-h-[80px]">
                  {stepCritic?.content ? (
                    <div className="line-clamp-5 font-mono text-[11px] leading-relaxed">
                      {stepCritic.content.slice(0, 300)}...
                    </div>
                  ) : isDeliberating && activeRound === 2 ? (
                    <div className="font-mono text-[11px] text-stone-300 animate-pulse">
                      {streamingRoundText || 'Checking counter-perspectives and inspecting edge cases...'}
                    </div>
                  ) : (
                    <p className="text-stone-600 text-xs italic py-2">
                      Counter-analysis will appear here.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800/40 flex items-center justify-between">
                <span className="font-mono text-[9px] text-stone-700 uppercase font-bold tracking-[0.2em]">Phase II</span>
                <span className="font-mono text-[9px] text-stone-500 uppercase font-bold px-2 py-0.5 rounded bg-stone-950 border border-stone-800 tracking-tight">
                  Adversary
                </span>
              </div>
            </div>

            {/* Card 3: Synthesizer */}
            <div className="rounded-xl bg-stone-900/10 border border-stone-800/40 p-6 flex flex-col gap-6 hover:border-stone-700/60 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-stone-400 text-[20px]">account_tree</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-serif italic text-base text-stone-100 font-medium">Integrated Synthesis</span>
                      <span className="font-mono text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                        Resolution
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[12px] font-sans text-stone-400 leading-relaxed min-h-[80px]">
                  {stepSynthesizer?.content ? (
                    <div className="line-clamp-5 font-mono text-[11px] leading-relaxed">
                      {stepSynthesizer.content.slice(0, 300)}...
                    </div>
                  ) : (
                    <p className="text-stone-600 text-xs italic py-2">
                      Final resolution will appear after audit rounds.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800/40 flex items-center justify-between">
                <span className="font-mono text-[9px] text-stone-700 uppercase font-bold tracking-[0.2em]">Phase III</span>
                <span className="font-mono text-[9px] text-stone-500 uppercase font-bold px-2 py-0.5 rounded bg-stone-950 border border-stone-800 tracking-tight">
                  Arbiter
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* 4. Action Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">reply</span>
            <span>Follow Up</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copy Text</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToNotesClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">note_add</span>
            <span>Save to Archive</span>
          </button>
        </div>

        {/* 5. Related Exploration */}
        <div className="flex flex-col gap-4 pt-6 border-t border-stone-800/40">
          <span className="font-mono text-[9px] text-stone-600 uppercase tracking-[0.3em] font-bold">
            Related Inquiries
          </span>
          <div className="flex flex-wrap gap-3">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onStartDebate(chip)}
                className="px-4 py-2 rounded-lg border border-stone-800/60 hover:border-stone-600 bg-stone-950/20 text-stone-500 hover:text-stone-200 text-[11px] font-serif italic transition-all text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Prompt Input Dock */}
      <div className="fixed bottom-8 left-0 lg:left-64 right-0 px-4 sm:px-8 flex justify-center pointer-events-none z-30">
        <div className="w-full max-w-4xl bg-stone-900/95 border border-stone-700/50 backdrop-blur-2xl p-2 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] pointer-events-auto transition-all focus-within:border-stone-500/60 ring-1 ring-white/5">
          <div className="flex flex-col gap-1 px-3 pt-1">
            {/* Top tiny indicators */}
            <div className="flex items-center justify-between text-[9px] font-mono text-stone-600 pb-1.5 border-b border-stone-800/40 uppercase tracking-[0.2em] font-bold">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-stone-700"></span>
                  <span>Dialectic Engine Ready</span>
                </div>
              </div>
              <span className="hidden sm:inline">Synthexis Infrastructure</span>
            </div>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDeliberating}
              placeholder={isDeliberating ? 'Processing Research Pipeline...' : 'Enter a research inquiry, architectural hypothesis, or technical claim to verify...'}
              rows={1}
              className="w-full bg-transparent text-stone-100 placeholder:text-stone-600 resize-none outline-none font-serif italic text-lg py-3 leading-relaxed max-h-36 overflow-y-auto"
            />

            <div className="flex items-center justify-between pt-1 pb-1">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="p-1.5 rounded text-stone-600 hover:text-stone-300 transition-colors"
                  title="Add References"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </button>

                <div
                  onClick={onOpenModelsTab}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-stone-950 border border-stone-800 hover:border-stone-700 transition-colors cursor-pointer"
                  title="Configure Infrastructure"
                >
                  <div className="flex -space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 ring-1 ring-stone-950"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-500 ring-1 ring-stone-950"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-700 ring-1 ring-stone-950"></span>
                  </div>
                  <span className="font-mono text-[9px] text-stone-500 font-bold uppercase tracking-widest">
                    Node Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isDeliberating}
                  className={`px-5 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                    inputText.trim() && !isDeliberating
                      ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer shadow-lg active:scale-95'
                      : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  {isDeliberating ? 'Working' : 'Execute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
