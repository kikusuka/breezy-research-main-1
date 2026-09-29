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
    if (isDeliberating) return { label: 'RESEARCH IN PROGRESS', color: 'bg-amber-500', icon: 'sync', pulse: true };
    if (session.status === 'error') return { label: 'PIPELINE FAILURE', color: 'bg-error', icon: 'error' };
    if (session.protocol === 'solo') return { label: 'SOLO INQUIRY', color: 'bg-stone-600', icon: 'bolt' };
    
    if (session.status === 'completed') {
      const metrics = session.researchMetrics;
      // If no metrics yet (legacy or loading), show generic
      if (!metrics || metrics.claimsIdentified === 0) return { label: 'RESEARCH COMPLETE', color: 'bg-stone-500', icon: 'check_circle' };
      
      if (metrics.claimsContradicted > 0) return { label: 'CONTRADICTIONS DETECTED', color: 'bg-amber-500', icon: 'rule' };
      if (metrics.claimsUnresolved > metrics.claimsSupported) return { label: 'INSUFFICIENT EVIDENCE', color: 'bg-amber-600', icon: 'warning' };
      if (metrics.synthexisRate && metrics.synthexisRate >= 90) return { label: 'VERIFIED SOURCES', color: 'bg-emerald-500', icon: 'verified' };
      
      return { label: 'AUDITED', color: 'bg-emerald-600', icon: 'fact_check' };
    }
    
    return { label: 'STATION IDLE', color: 'bg-stone-800', icon: 'pause' };
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
      <div className="px-4 sm:px-6 py-2.5 bg-surface-container-low/70 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-outline">
            <span className="text-tertiary">breezy</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant">research</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium truncate max-w-[160px]">
              session-{session.id.slice(0, 8)}
            </span>
          </div>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/30">
            <span className={`h-2 w-2 rounded-full ${isDeliberating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
            <span className="font-mono text-[10px] text-on-surface-variant tracking-wider font-semibold uppercase">
              {isDeliberating ? 'Research in Progress' : 'Research Ready'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-outline">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${badge.color}/10 border border-${badge.color}/20`}>
            <span className={`material-symbols-outlined text-${badge.color} text-[14px] ${badge.pulse ? 'animate-spin' : ''}`}>{badge.icon}</span>
            <span className={`font-mono text-[10px] text-${badge.color} font-semibold uppercase`}>
              {badge.label}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20 text-tertiary">
            Multi-Perspective Pipeline
          </span>
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
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Config_Matrix</span>
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-outline text-[16px]">
                {subView === 'perspectives' ? 'device_hub' : 'schema'}
              </span>
              <span className="font-mono text-[11px] uppercase text-outline tracking-wider font-semibold">
                {subView === 'perspectives' ? 'Investigated Perspectives & Angles' : 'Evidence Trail & Contradiction Graph'}
              </span>
            </div>

            {/* View Mode Toggle Pill */}
            <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSubView('perspectives')}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  subView === 'perspectives'
                    ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                    : 'text-tertiary hover:text-on-surface'
                }`}
              >
                3-Up Columns
              </button>
              <button
                type="button"
                onClick={() => setSubView('evidence')}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  subView === 'evidence'
                    ? 'bg-surface-container-high text-secondary font-semibold shadow-xs'
                    : 'text-tertiary hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">schema</span>
                <span>Evidence Graph</span>
              </button>
            </div>
          </div>

          {subView === 'evidence' ? (
            <EvidenceGraphView sessionTitle={session.prompt} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Lead Perspective */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex flex-col justify-between shadow-xs hover:border-outline-variant/60 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">explore</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-on-surface">Source Extraction & Thesis</span>
                      <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-medium">
                        Search Findings & Core Claims
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-sans text-on-surface-variant leading-relaxed min-h-[60px]">
                  {stepAnalyst?.content ? (
                    <div className="line-clamp-4 font-mono text-[11px]">
                      {stepAnalyst.content.slice(0, 240)}...
                    </div>
                  ) : isDeliberating && activeRound === 1 ? (
                    <div className="font-mono text-[11px] text-primary">
                      {streamingRoundText || 'Researching primary sources and extracting core claims...'}
                    </div>
                  ) : (
                    <p className="text-outline text-xs italic py-2">
                      Initial analysis will appear here once the inquiry begins.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-outline">Phase 1</span>
                <span className="font-mono text-[10px] text-primary uppercase font-semibold px-2 py-0.5 rounded bg-primary-container/20 border border-primary/30">
                  Initial Evidence
                </span>
              </div>
            </div>

            {/* Card 2: Critic */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex flex-col justify-between shadow-xs hover:border-outline-variant/60 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-error-container/40 border border-error/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-error text-[18px]">rule</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-on-surface">Counter-Analysis</span>
                      <span className="font-mono text-[10px] text-error uppercase tracking-wider font-medium">
                        Limitations & Contrasting Views
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-sans text-on-surface-variant leading-relaxed min-h-[60px]">
                  {stepCritic?.content ? (
                    <div className="line-clamp-4 font-mono text-[11px]">
                      {stepCritic.content.slice(0, 240)}...
                    </div>
                  ) : isDeliberating && activeRound === 2 ? (
                    <div className="font-mono text-[11px] text-error">
                      {streamingRoundText || 'Checking counter-perspectives and inspecting edge cases...'}
                    </div>
                  ) : (
                    <p className="text-outline text-xs italic py-2">
                      Counter-perspectives and risk analysis will appear here.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-outline">Phase 2</span>
                <span className="font-mono text-[10px] text-error uppercase font-semibold px-2 py-0.5 rounded bg-error-container/30 border border-error/30">
                  Critical Verification
                </span>
              </div>
            </div>

            {/* Card 3: Synthesizer */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex flex-col justify-between shadow-xs hover:border-outline-variant/60 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[18px]">account_tree</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-on-surface">Integrated Synthexis</span>
                      <span className="font-mono text-[10px] text-secondary uppercase tracking-wider font-medium">
                        Reconciliation & Balanced Synthexis
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-sans text-on-surface-variant leading-relaxed min-h-[60px]">
                  {stepSynthesizer?.content ? (
                    <div className="line-clamp-4 font-mono text-[11px]">
                      {stepSynthesizer.content.slice(0, 240)}...
                    </div>
                  ) : (
                    <p className="text-outline text-xs italic py-2">
                      Tradeoff reconciliation and synthexis will appear after audit rounds.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-outline">Phase 3</span>
                <span className="font-mono text-[10px] text-secondary uppercase font-semibold px-2 py-0.5 rounded bg-secondary-container/30 border border-secondary/30">
                  Final Synthexis
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* 4. Action Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">reply</span>
            <span>Follow_Up</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>Copy_Raw</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToNotesClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">note_add</span>
            <span>Save_Archive</span>
          </button>
        </div>

        {/* 5. Suggested Exploration Vectors */}
        <div className="flex flex-col gap-3 pt-4 border-t border-stone-800/40">
          <span className="font-mono text-[9px] text-stone-500 uppercase tracking-[0.25em] font-bold">
            Exploration_Vectors
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onStartDebate(chip)}
                className="px-3 py-1.5 rounded border border-stone-800 hover:border-stone-500 bg-stone-950/40 text-stone-400 hover:text-stone-100 text-[10px] font-mono transition-all text-left uppercase tracking-tight"
              >
                {chip} ↵
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
            <div className="flex items-center justify-between text-[9px] font-mono text-stone-500 pb-1 border-b border-stone-800/40 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-700 animate-pulse"></span>
                  <span>Status: Grounded Research Pipeline Active</span>
                </div>
              </div>
              <span className="hidden sm:inline">Ver: 2.0.4-LORA</span>
            </div>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDeliberating}
              placeholder={isDeliberating ? 'Processing Research Pipeline...' : 'Pose a technical inquiry, request architectural verification, or stress-test claims...'}
              rows={1}
              className="w-full bg-transparent text-stone-100 placeholder:text-stone-600 resize-none outline-none font-serif italic text-lg py-2.5 leading-relaxed max-h-36 overflow-y-auto"
            />

            <div className="flex items-center justify-between pt-1 pb-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-1.5 rounded text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                  title="Attach Reference Metadata"
                >
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                </button>

                <div
                  onClick={onOpenModelsTab}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-stone-950/60 border border-stone-800 hover:border-stone-600 transition-colors cursor-pointer"
                  title="Configure Compute Matrix"
                >
                  <div className="flex -space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-100 ring-1 ring-stone-950"></span>
                    <span className="w-2 h-2 rounded-full bg-stone-500 ring-1 ring-stone-950"></span>
                    <span className="w-2 h-2 rounded-full bg-stone-800 ring-1 ring-stone-950"></span>
                  </div>
                  <span className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    Matrix_Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isDeliberating}
                  className={`px-4 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                    inputText.trim() && !isDeliberating
                      ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer shadow-lg active:scale-95'
                      : 'bg-stone-800 text-stone-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isDeliberating ? 'Running' : 'Inquire'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
