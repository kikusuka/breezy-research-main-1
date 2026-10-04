import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateSession, ProviderKeyConfig, EvidenceSource } from '../../types';
import { EvidenceGraphView } from './EvidenceGraphView';

interface ResearchConversationViewProps {
  session?: DebateSession | null;
  isDeliberating: boolean;
  activeRound: number;
  streamingRoundText: string;
  streamingRole: string;
  onStartDebate: (prompt: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onSteer?: (prompt: string) => void;
  activeRoundStartedAt?: number | null;
  liveUsage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; reasoningTokens?: number; round?: number } | null;
  heartbeatState?: { statusText?: string; taskReminder?: string; checkpoint?: string } | null;
  onSaveNote?: (title: string, content: string) => void;
  onExportMarkdown?: () => void;
  keys: ProviderKeyConfig;
  researchEvents?: string[];
  onOpenNotes?: () => void;
  onOpenInBreezy?: (session: DebateSession) => void;
  onOpenInIde?: (session: DebateSession) => void;
  onPinToCanvas?: (session: DebateSession) => void;
}

export const ResearchConversationView: React.FC<ResearchConversationViewProps> = ({
  session,
  isDeliberating,
  activeRound,
  streamingRoundText,
  streamingRole,
  onStartDebate,
  onSteer,
  activeRoundStartedAt,
  liveUsage,
  onSaveNote,
  onExportMarkdown,
  onOpenInIde,
  onPinToCanvas,
}) => {
  const [inputText, setInputText] = useState('');
  const [researchDepth, setResearchDepth] = useState<'standard' | 'exhaustive' | 'fast'>('standard');
  const [verificationMode, setVerificationMode] = useState<'cross-exam' | 'consensus' | 'adversarial'>('cross-exam');
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEvidenceGraph, setShowEvidenceGraph] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!isDeliberating) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [isDeliberating]);

  const elapsedSeconds = activeRoundStartedAt ? Math.max(0, Math.floor((nowMs - activeRoundStartedAt) / 1000)) : 0;
  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const handleInitiate = () => {
    if (!inputText.trim()) {
      textareaRef.current?.focus();
      return;
    }
    let promptToSend = inputText.trim();
    if (attachedFile) {
      promptToSend += `\n\n--- [Attached Reference Context: ${attachedFile.name}] ---\n${attachedFile.content}\n--- [End Context] ---`;
    }
    const depthMap = {
      fast: 'solo' as const,
      standard: 'standard' as const,
      exhaustive: 'deep' as const,
    };
    onStartDebate(promptToSend, depthMap[researchDepth]);
    setInputText('');
    setAttachedFile(null);
  };

  const handleApplyDirective = (text: string) => {
    setInputText(text);
    textareaRef.current?.focus();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';
      setAttachedFile({ name: file.name, content: content.slice(0, 15000) });
      showToast(`Uploaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    if (!session?.finalOutput) return;
    navigator.clipboard.writeText(session.finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied synthesis to clipboard');
  };

  const handleSave = () => {
    if (!session || !onSaveNote) return;
    onSaveNote(session.prompt.slice(0, 60), session.finalOutput || session.prompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sampleDirectives = [
    {
      domain: 'Domain #01',
      title: 'Electrochemical Degradation',
      desc: 'NMC cathode lattice oxygen release & impedance growth mechanics.',
      prompt: 'Electrochemical Degradation: Synthesize degradation pathways of high-nickel NMC cathodes during ultra-fast C-rate cycling under thermal stress.',
    },
    {
      domain: 'Domain #02',
      title: 'Distributed Consensus',
      desc: 'Asynchronous DAG invariants under network partitions.',
      prompt: 'Distributed Consensus Kernels: Formalize safety bounds of DAG-based asynchronous consensus protocols under dynamic quorum availability.',
    },
    {
      domain: 'Domain #03',
      title: 'Game Theory',
      desc: 'Equilibrium shifts in automated cross-pool liquidity provision.',
      prompt: 'Algorithmic Game Theory: Evaluate strategic equilibrium stability in high-frequency multi-agent automated market maker pools.',
    },
  ];

  const currentRunTitle = session?.prompt
    ? session.prompt.length > 50
      ? `${session.prompt.slice(0, 48)}...`
      : session.prompt
    : 'Unallocated Run';

  const steps = session?.steps || [];
  const proposals = steps.filter((s) => s.role === 'architect' || s.role === 'solo');
  const challenges = steps.filter((s) => s.role === 'skeptic');
  const verifications = steps.filter((s) => s.role === 'verifier');
  const sources: EvidenceSource[] = session?.evidenceGraph?.sourcesConsulted || [];

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface overflow-x-hidden pb-16">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.json,.csv,.py,.ts,.tsx,.js"
      />

      {/* Atmospheric Ambient Glows */}
      

      <div className="w-full max-w-5xl mx-auto px-space-md sm:px-space-lg pt-space-md flex flex-col gap-space-lg">
        {/* Workspace Subheader & Operational Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs border-b border-outline-variant/20">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm font-mono text-code-sm uppercase tracking-wider text-outline">
              <span>Workspace / Research</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary truncate max-w-xs sm:max-w-md">{currentRunTitle}</span>
            </div>
            <h1 className="font-headline font-semibold text-headline-lg text-on-surface tracking-tight">
              Research Workspace
            </h1>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-space-sm self-start md:self-auto font-mono text-code-sm">
            <div className="flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high border border-outline-variant/30 shadow-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDeliberating ? 'bg-primary animate-pulse' : 'bg-tertiary'
                }`}
              />
              <span className="font-sans text-label-md text-on-surface">
                {isDeliberating ? 'Researching' : 'Ready'}
              </span>
              <span className="text-outline-variant">·</span>
              <span className="text-on-surface-variant">
                {isDeliberating ? `Round ${activeRound} (${formatDuration(elapsedSeconds)})` : 'Ready to research'}
              </span>
            </div>
          </div>
        </div>

        {/* Central Progressive Inquiry Formulation Composer */}
        <div className="bg-surface-container border border-outline-variant/30 shadow-xl p-space-md sm:p-space-lg rounded-3xl relative">
          <div className="flex items-center justify-between pb-space-sm">
            <div className="flex items-center gap-space-sm text-primary font-mono text-code-sm">
              <span className="material-symbols-outlined text-headline-sm">neurology</span>
              <span className="tracking-wide uppercase font-semibold">Inquiry Formulation</span>
            </div>
            <div className="flex items-center gap-space-xs text-outline font-mono text-code-sm">
              <span>LaTeX &amp; Markdown Enabled</span>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative bg-surface-container-low rounded-2xl border border-outline-variant/30 focus-within:border-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleInitiate();
                }
              }}
              placeholder="State your research inquiry, theorem, or experimental hypothesis..."
              rows={3}
              className="w-full bg-transparent px-space-md py-space-md font-sans text-body-md text-on-surface placeholder:text-outline focus:outline-none resize-none leading-relaxed"
            />
            <div className="px-space-md pb-space-sm flex items-center justify-between text-outline font-mono text-code-sm">
              <span>{inputText.length > 0 ? `${inputText.length} characters staged` : 'Awaiting statement formulation'}</span>
              <div className="hidden sm:flex items-center gap-space-xs">
                <kbd className="bg-surface-container px-1 py-0.5 rounded text-outline-variant">⌘</kbd>
                <span>+</span>
                <kbd className="bg-surface-container px-1 py-0.5 rounded text-outline-variant">Return</kbd>
                <span>to initiate</span>
              </div>
            </div>
          </div>

          {/* Parameter Controls Bar */}
          <div className="pt-space-md flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex flex-wrap items-center gap-space-sm">
              {/* Depth Selection */}
              <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-1 text-on-surface rounded-full border border-outline-variant/30">
                <span className="material-symbols-outlined text-[16px] text-primary">speed</span>
                <span className="font-mono text-label-sm text-outline uppercase tracking-wider">Depth:</span>
                <select
                  value={researchDepth}
                  onChange={(e) => setResearchDepth(e.target.value as any)}
                  className="bg-transparent font-sans text-label-md text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="fast" className="bg-surface-container-high text-on-surface">
                    Fast Scan (12k tokens)
                  </option>
                  <option value="standard" className="bg-surface-container-high text-on-surface">
                    Comprehensive (48k tokens)
                  </option>
                  <option value="exhaustive" className="bg-surface-container-high text-on-surface">
                    Exhaustive Answer (128k)
                  </option>
                </select>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-1 text-on-surface rounded-full border border-outline-variant/30">
                <span className="material-symbols-outlined text-[16px] text-tertiary">fact_check</span>
                <span className="font-mono text-label-sm text-outline uppercase tracking-wider">Mode:</span>
                <select
                  value={verificationMode}
                  onChange={(e) => setVerificationMode(e.target.value as any)}
                  className="bg-transparent font-sans text-label-md text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="cross-exam" className="bg-surface-container-high text-on-surface">
                    Rigorous Cross-Exam
                  </option>
                  <option value="consensus" className="bg-surface-container-high text-on-surface">
                    Peer Consensus Protocol
                  </option>
                  <option value="adversarial" className="bg-surface-container-high text-on-surface">
                    Adversarial Falsification
                  </option>
                </select>
              </div>

              {/* File / Context attachment */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-space-xs px-space-sm py-1 rounded-full border transition-colors font-sans text-label-md ${
                  attachedFile
                    ? 'bg-surface-container-highest border-primary/40 text-primary'
                    : 'bg-surface-container-high hover:bg-surface-container-highest border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">attachment</span>
                <span>{attachedFile ? attachedFile.name : '+ Upload Files / DOI list'}</span>
              </button>
            </div>

            {/* Initiate Button */}
            <button
              type="button"
              onClick={handleInitiate}
              disabled={isDeliberating}
              className="flex items-center gap-space-sm bg-primary hover:bg-secondary text-on-primary font-headline font-semibold text-headline-sm px-space-lg py-2 rounded-full shadow-[0_0_16px_rgba(76,214,251,0.25)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isDeliberating ? 'Researching...' : 'Start research'}</span>
              <span className="material-symbols-outlined text-headline-sm">
                {isDeliberating ? 'sync' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>

        {/* 6-Stage Pipeline Stepper */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-space-md sm:p-space-lg shadow-sm">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-outline-variant/20">
            <span className="font-mono text-code-sm text-outline uppercase tracking-wider">
              Research progress
            </span>
            <span className="font-mono text-code-sm text-tertiary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              {isDeliberating ? `Stage 0${activeRound} Active` : session?.status === 'completed' ? 'Research complete' : 'Standby'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-xs text-left">
            {[
              { num: '01', name: 'Question', sub: 'Boundary Parse', icon: 'help_outline' },
              { num: '02', name: 'Exploration', sub: 'Corpus Grounding', icon: 'travel_explore' },
              { num: '03', name: 'Proposals', sub: 'Multi-Hypothesis', icon: 'lightbulb' },
              { num: '04', name: 'Challenge', sub: 'Adversarial Stress', icon: 'gavel' },
              { num: '05', name: 'Evidence', sub: 'DOI Verification', icon: 'fact_check' },
              { num: '06', name: 'Answer', sub: 'Final answer', icon: 'auto_stories' },
            ].map((step, idx) => {
              const stepRound = idx + 1;
              const isPast = (session?.status === 'completed') || (isDeliberating && activeRound > stepRound);
              const isCurrent = isDeliberating && activeRound === stepRound;

              return (
                <div
                  key={step.num}
                  className={`p-space-sm rounded-xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-surface-container-high border-primary/50 text-primary shadow-md'
                      : isPast
                      ? 'bg-surface-container border-tertiary/30 text-tertiary'
                      : 'bg-surface-container-lowest border-outline-variant/20 text-outline'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-code-sm font-semibold">{step.num}</span>
                    <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                  </div>
                  <div className="font-headline font-semibold text-body-sm text-on-surface">
                    {step.name}
                  </div>
                  <div className="font-sans text-[11px] text-on-surface-variant truncate">
                    {step.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Display: Results / Answer OR Empty State */}
        {session?.finalOutput || isDeliberating ? (
          <div ref={resultsTopRef} className="flex flex-col gap-space-lg w-full">
            {/* Live Streaming Indicator (if active) */}
            {isDeliberating && (
              <div className="p-space-md rounded-2xl bg-surface-container border border-primary/30 shadow-lg flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm text-primary font-mono text-code-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>Stage {activeRound}: {streamingRole} Deliberation in progress</span>
                  </div>
                  <span className="font-mono text-code-sm text-outline">
                    Tokens: {liveUsage?.totalTokens ? liveUsage.totalTokens.toLocaleString() : '—'}
                  </span>
                </div>
                {streamingRoundText ? (
                  <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-on-surface font-sans text-body-sm leading-relaxed max-h-56 overflow-y-auto font-mono text-xs">
                    {streamingRoundText.slice(-600)}
                  </div>
                ) : (
                  <div className="text-body-sm text-on-surface-variant animate-pulse font-sans">
                    Orchestrating model nodes, cross-examining assertions, and validating citation paths...
                  </div>
                )}
              </div>
            )}

            {/* Answer First: Executive Answer Takeaway */}
            {session?.finalOutput && (
              <div className="rounded-3xl bg-surface-container border border-outline-variant/40 shadow-xl p-space-md sm:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="font-headline font-semibold text-headline-sm text-on-surface">
                      Breezy's answer
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs font-mono text-code-sm text-outline">
                    <span></span>
                    <span>·</span>
                    <span className="text-tertiary">Verified</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none font-sans text-body-md text-on-surface leading-relaxed">
                  <ReactMarkdown>{session.finalOutput}</ReactMarkdown>
                </div>

                {/* Bottom Action Ribbon */}
                <div className="pt-space-md border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                      <span>{copied ? 'Copied' : 'Copy Answer'}</span>
                    </button>

                    {onExportMarkdown && (
                      <button
                        type="button"
                        onClick={onExportMarkdown}
                        className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span>Export Markdown</span>
                      </button>
                    )}

                    {onSaveNote && (
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {saved ? 'bookmark_added' : 'bookmark'}
                        </span>
                        <span>{saved ? 'Saved' : 'Save to History'}</span>
                      </button>
                    )}

                    {onPinToCanvas && (
                      <button
                        type="button"
                        onClick={() => onPinToCanvas(session)}
                        className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">draw</span>
                        <span>Pin to Canvas</span>
                      </button>
                    )}

                    {onOpenInIde && (
                      <button
                        type="button"
                        onClick={() => onOpenInIde(session)}
                        className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">terminal</span>
                        <span>Open in Build</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEvidenceGraph((prev) => !prev)}
                    className="font-mono text-code-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{showEvidenceGraph ? 'Hide Evidence Graph' : 'Inspect Evidence Graph'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {showEvidenceGraph ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {/* Evidence Graph Drawer */}
                {showEvidenceGraph && session.evidenceGraph && (
                  <div className="mt-space-sm pt-space-sm border-t border-outline-variant/20">
                    <EvidenceGraphView
                      evidenceGraph={session.evidenceGraph}
                      researchMetrics={session.researchMetrics}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Supporting Reasoning: Verified Evidence Sources */}
            {sources.length > 0 && (
              <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-tertiary text-headline-sm">
                      verified_user
                    </span>
                    <h3 className="font-headline font-semibold text-headline-sm text-on-surface">
                      Sources ({sources.length})
                    </h3>
                  </div>
                  <span className="font-mono text-code-sm text-tertiary"></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs pt-1">
                  {sources.map((src: EvidenceSource, idx: number) => (
                    <a
                      key={src.id || idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-space-sm rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 flex flex-col justify-between transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-space-xs">
                        <span className="font-mono text-code-sm text-primary group-hover:underline truncate">
                          {src.title || src.url}
                        </span>
                        <span className="material-symbols-outlined text-outline text-[16px]">
                          north_east
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-outline mt-2">
                        <span>{src.domain || 'Verified Domain'}</span>
                        <span className="text-tertiary">Source</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Perspectives vs Contradictions Grid */}
            {(proposals.length > 0 || challenges.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                {/* Perspectives Considered */}
                <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-xs text-primary font-mono text-code-sm">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    <span className="font-semibold uppercase">Perspectives</span>
                  </div>
                  <div className="space-y-space-sm">
                    {proposals.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-space-sm rounded-xl bg-surface-container border border-outline-variant/20 font-sans text-body-sm leading-relaxed"
                      >
                        <div className="font-mono text-code-sm text-secondary font-medium pb-1">
                          Perspective {idx + 1} ({p.role})
                        </div>
                        <p className="line-clamp-4 text-on-surface-variant">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges & Contradictions Surfaced */}
                <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-xs text-secondary font-mono text-code-sm">
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span className="font-semibold uppercase">Challenges</span>
                  </div>
                  <div className="space-y-space-sm">
                    {challenges.length === 0 ? (
                      <div className="p-space-md rounded-xl bg-surface-container text-outline font-sans text-body-sm">
                        No critical logic flaws detected across participating models.
                      </div>
                    ) : (
                      challenges.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-space-sm rounded-xl bg-surface-container border border-outline-variant/20 font-sans text-body-sm leading-relaxed"
                        >
                          <div className="font-mono text-code-sm text-tertiary font-medium pb-1">
                            Challenge {idx + 1} ({c.role})
                          </div>
                          <p className="line-clamp-4 text-on-surface-variant">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Slate State */
          <div className="bg-surface-container-low/70 border border-outline-variant/30 p-space-lg sm:p-space-xl rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm">
            <div className="max-w-xl flex flex-col items-center gap-space-xs">
              <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                No active synthesis in progress
              </h2>
              <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
                Submit an inquiry above to coordinate multi-model exploration, adversarial
                cross-examination, and literature grounding.
              </p>
            </div>

            {/* Sample Directives */}
            <div className="mt-space-xl pt-space-lg w-full max-w-3xl border-t border-outline-variant/20">
              <div className="flex items-center justify-center gap-space-xs mb-space-md text-outline font-mono text-label-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-label-md text-primary">bolt</span>
                <span>Sample Directives</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm text-left">
                {sampleDirectives.map((d) => (
                  <button
                    key={d.domain}
                    type="button"
                    onClick={() => handleApplyDirective(d.prompt)}
                    className="p-space-md bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 transition-all group flex flex-col justify-between rounded-2xl active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between w-full mb-space-xs">
                      <span className="font-mono text-code-sm text-primary">{d.domain}</span>
                      <span className="material-symbols-outlined text-label-md text-outline group-hover:text-primary transition-colors">
                        north_east
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline font-semibold text-headline-sm text-on-surface mb-1">
                        {d.title}
                      </h4>
                      <p className="font-sans text-body-sm text-on-surface-variant line-clamp-2">
                        {d.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Cluster Hardware Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm font-mono text-code-sm text-outline pt-space-xs">
          <div className="flex items-center gap-space-sm bg-surface-container-low border border-outline-variant/30 px-space-md py-space-sm rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span className="text-on-surface-variant">Verifier:</span>
            <span className="text-on-surface ml-auto truncate">Claude 3.7 Sonnet</span>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-low border border-outline-variant/30 px-space-md py-space-sm rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-on-surface-variant">Explorer:</span>
            <span className="text-on-surface ml-auto truncate">DeepSeek-R1</span>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-low border border-outline-variant/30 px-space-md py-space-sm rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="text-on-surface-variant">Corpus:</span>
            <span className="text-on-surface ml-auto truncate">arXiv + PubMed</span>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-low border border-outline-variant/30 px-space-md py-space-sm rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
            <span className="text-on-surface-variant">Sandbox:</span>
            <span className="text-on-surface ml-auto truncate">Lean 4 Kernel</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
