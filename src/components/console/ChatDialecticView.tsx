import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateSession, DebateStep, ProviderKeyConfig } from '../../types';

interface ChatDialecticViewProps {
  session: DebateSession;
  isDeliberating: boolean;
  activeRound: number;
  streamingRoundText: string;
  streamingRole: string;
  onStartDebate: (prompt: string) => void;
  onSaveNote?: (title: string, content: string) => void;
  onExportMarkdown?: () => void;
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
  onOpenModelsTab,
  keys,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const agreementScore = session.metrics?.consensusRate || 94.2;
  const durationText = session.metrics?.durationMs ? `${(session.metrics.durationMs / 1000).toFixed(1)}s` : '1.4s';

  const suggestionChips = [
    'Show cost comparison ($/mo)',
    'Explain failover steps',
    'Generate Terraform snippet',
    'Evaluate write concurrency locks',
  ];

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)]">
      {/* Session Metadata Sub-Header Strip */}
      <div className="px-4 sm:px-6 py-2.5 bg-surface-container-low/70 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-outline">
            <span className="text-tertiary">synthexis</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant">workspace</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium truncate max-w-[160px]">
              session-{session.id.slice(0, 8)}
            </span>
          </div>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high border border-secondary/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <span className="font-mono text-[10px] text-secondary tracking-wider font-semibold">
              3 NODES SYNCED (18ms)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-outline">
          <span className="px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20">
            Cluster ID: #042-US-EAST
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 bg-surface-container rounded border border-outline-variant/20 text-tertiary">
            Protocol: Tri-Consensus v2.4
          </span>
        </div>
      </div>

      {/* Session Header Strip */}
      <div className="px-4 sm:px-8 py-5 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/15">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[10px] uppercase tracking-wider font-semibold">
              Architecture Dialectic
            </span>
            <span className="font-mono text-[11px] text-outline">
              Initiated {new Date(session.createdAt || Date.now()).toLocaleTimeString()} UTC
            </span>
          </div>
          <h1 className="font-sans text-xl sm:text-2xl text-on-surface tracking-tight font-semibold">
            {session.prompt || 'New Dialectic Inquiry Session'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
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
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-semibold text-on-surface">Dr. K. Vance</span>
              <span className="font-mono text-[10px] text-outline">
                {new Date(session.createdAt || Date.now()).toLocaleTimeString()}
              </span>
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 bg-surface-container rounded text-tertiary border border-outline-variant/30">
                Architect
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/25 text-on-surface font-sans text-sm leading-relaxed shadow-xs">
              {session.prompt}
            </div>
          </div>
        </div>

        {/* 2. Tri-Node Consensus Synthesis Card */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 sm:p-6 shadow-sm backdrop-blur-md">
          {/* Top verdict bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-base font-semibold text-on-surface">
                    Tri-Node Consensus Synthesis
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary border border-secondary/30 font-mono text-[10px] uppercase font-semibold">
                    Unanimous Fit
                  </span>
                </div>
                <span className="font-mono text-[11px] text-outline mt-0.5">
                  3 of 3 Engines Polled • Deterministic Reconciliation ({durationText})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenModelsTab}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-primary/40 text-on-surface-variant hover:text-on-surface font-mono text-[11px] transition-all"
              >
                <span className="material-symbols-outlined text-[15px] text-primary">insights</span>
                <span>Telemetry & Convergence (0.058 bits)</span>
              </button>
            </div>
          </div>

          {/* Recommendation content */}
          <div className="py-4">
            <div className="font-mono text-[11px] uppercase text-secondary tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Consensus Recommendation</span>
            </div>

            {session.finalOutput ? (
              <div className="text-on-surface font-sans text-sm sm:text-[15px] leading-relaxed prose prose-invert max-w-none">
                <ReactMarkdown>{session.finalOutput}</ReactMarkdown>
              </div>
            ) : isDeliberating && activeRound >= 3 ? (
              <div className="flex items-center gap-3 py-2 text-primary font-mono text-xs">
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                <span>Reviewer synthesizing final consensus answer from all 3 nodes...</span>
              </div>
            ) : (
              <p className="text-on-surface font-sans text-sm sm:text-[15px] leading-relaxed">
                <strong className="text-on-surface font-semibold">Kafka for realtime continuous ingestion</strong>{' '}
                paired with <strong className="text-on-surface font-semibold">DuckDB for analytical audits</strong>.
                Kafka guarantees sub-5ms write tracking and fault-tolerant log ordering, while DuckDB delivers high-speed zero-copy reconciliation against Parquet snapshots without locking transactional writes.
              </p>
            )}
          </div>

          {/* Telemetry Metrics bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-outline-variant/20 text-outline font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Agreement: <strong className="text-on-surface font-medium">{agreementScore}%</strong>
              </span>
              <span>•</span>
              <span>
                Latency: <strong className="text-on-surface font-medium">{durationText}</strong>
              </span>
              <span>•</span>
              <span>
                Ingress: <strong className="text-secondary font-medium">&lt; 3.2ms</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenModelsTab}
              className="text-primary hover:underline flex items-center gap-1 text-xs transition-colors"
            >
              <span>Mathematical delta matrix</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* 3. Independent Dialectic Feeds (3-Up Columns) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-outline text-[16px]">device_hub</span>
              <span className="font-mono text-[11px] uppercase text-outline tracking-wider font-semibold">
                Independent Dialectic Feeds
              </span>
            </div>
            <span className="font-mono text-[11px] text-outline">Columnar Layout 3-Up</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Claude 3.5 Sonnet / Analyst */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex flex-col justify-between shadow-xs hover:border-outline-variant/60 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-on-surface">Claude 3.5 Sonnet</span>
                      <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-medium">
                        Lead Analyst • Ingestion (Thesis)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-outline bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
                    4.1ms
                  </span>
                </div>

                <div className="text-xs font-sans text-on-surface-variant leading-relaxed min-h-[60px]">
                  {stepAnalyst?.content ? (
                    <div className="line-clamp-4 font-mono text-[11px]">
                      {stepAnalyst.content.slice(0, 240)}...
                    </div>
                  ) : isDeliberating && activeRound === 1 ? (
                    <div className="font-mono text-[11px] text-primary">
                      {streamingRoundText || 'Generating first-principles architecture proposal...'}
                    </div>
                  ) : (
                    <p>
                      Partitioned topics guarantee <strong className="text-on-surface">immutable append-only write throughput</strong> without lock contention across distributed ledger workers.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    <span>120k eps/node sustained throughput</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    <span>Guaranteed durability with fsync ack=all</span>
                  </div>
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined text-outline text-[15px]">info</span>
                    <span>Heavier operational overhead (KRaft quorum)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-outline">96% Confidence</span>
                <span className="font-mono text-[10px] text-primary uppercase font-semibold px-2 py-0.5 rounded bg-primary-container/20 border border-primary/30">
                  Primary Write Path
                </span>
              </div>
            </div>

            {/* Card 2: GPT-4o / Critic */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex flex-col justify-between shadow-xs hover:border-outline-variant/60 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-error-container/40 border border-error/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-error text-[18px]">security</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-on-surface">GPT-4o</span>
                      <span className="font-mono text-[10px] text-error uppercase tracking-wider font-medium">
                        Adversarial Critic • Risk (Antithesis)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-error bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
                    Risk Flag
                  </span>
                </div>

                <div className="text-xs font-sans text-on-surface-variant leading-relaxed min-h-[60px]">
                  {stepCritic?.content ? (
                    <div className="line-clamp-4 font-mono text-[11px]">
                      {stepCritic.content.slice(0, 240)}...
                    </div>
                  ) : isDeliberating && activeRound === 2 ? (
                    <div className="font-mono text-[11px] text-error">
                      {streamingRoundText || 'Red-teaming proposal and inspecting failure modes...'}
                    </div>
                  ) : (
                    <p>
                      Warns against direct concurrent writes to DuckDB files: embedded databases lack distributed WALs and risk catastrophic lockouts under spike load.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-error">
                    <span className="material-symbols-outlined text-error text-[15px]">warning</span>
                    <span>File-level lock contention under spike load</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    <span>Superb in-memory analytical query speeds</span>
                  </div>
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined text-outline text-[15px]">info</span>
                    <span>Strict recommendation: read/audit tier only</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-outline">Audit: Strict Read</span>
                <span className="font-mono text-[10px] text-error uppercase font-semibold px-2 py-0.5 rounded bg-error-container/30 border border-error/30">
                  Reject Standalone Write
                </span>
              </div>
            </div>

            {/* Card 3: Gemini 1.5 Pro / Synthesizer */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 flex flex-col justify-between shadow-xs hover:border-outline-variant/60 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-secondary-container/40 border border-secondary/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-[18px]">account_tree</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-on-surface">Gemini 1.5 Pro</span>
                      <span className="font-mono text-[10px] text-secondary uppercase tracking-wider font-medium">
                        Synthesis • Architecture
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">
                    Dual Tier
                  </span>
                </div>

                <div className="text-xs font-sans text-on-surface-variant leading-relaxed min-h-[60px]">
                  {stepSynthesizer?.content ? (
                    <div className="line-clamp-4 font-mono text-[11px]">
                      {stepSynthesizer.content.slice(0, 240)}...
                    </div>
                  ) : (
                    <p>
                      Proposes a <strong className="text-on-surface">bifurcated pipeline</strong>: stream ingest via Kafka topics, micro-batching into S3 Parquet tables for zero-copy DuckDB analysis.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    <span>Instant balances via Kafka event streaming</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    <span>Lightning 100M+ row ledger reconciliation</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    <span>No lock interference on live financial writes</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-outline">Score: 98/100</span>
                <span className="font-mono text-[10px] text-secondary uppercase font-semibold px-2 py-0.5 rounded bg-secondary-container/30 border border-secondary/30">
                  Optimal Pattern
                </span>
              </div>
            </div>
          </div>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">reply</span>
            <span>Ask follow up</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>{copied ? 'Copied text!' : 'Copy text'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToNotesClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">note_add</span>
            <span>{saved ? 'Saved in Notes' : 'Save to Notes'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenModelsTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">insights</span>
            <span>Compare full benchmarks</span>
          </button>
        </div>

        {/* 5. Suggested Exploration Vectors */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
            Suggested Exploration Vectors
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onStartDebate(chip)}
                className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 text-on-surface text-xs font-sans transition-all text-left"
              >
                {chip} →
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Prompt Input Dock */}
      <div className="fixed bottom-5 left-0 lg:left-64 right-0 px-4 sm:px-8 flex justify-center pointer-events-none z-30">
        <div className="w-full max-w-4xl bg-surface-container-low/95 backdrop-blur-xl p-2 rounded-2xl shadow-2xl pointer-events-auto border border-outline-variant/35 transition-all focus-within:border-primary/60">
          <div className="flex flex-col gap-1 px-3 pt-1">
            {/* Top tiny indicators */}
            <div className="flex items-center justify-between text-[10px] font-mono text-outline pb-1 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="text-tertiary">Dialectic Engine:</span>
                  <span className="text-on-surface font-medium">Trio Active (Claude + GPT-4o + Gemini)</span>
                </div>
                <span className="hidden md:inline text-outline">•</span>
                <span className="hidden md:inline">Tokens: 124,580</span>
              </div>
              <span className="text-primary hidden sm:inline">Target Schema: Ledger_V3_Parquet</span>
            </div>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDeliberating}
              placeholder={isDeliberating ? 'Multi-model dialectic in progress...' : 'Interrogate the consensus, pose an edge case, or propose a scenario tweak...'}
              rows={1}
              className="w-full bg-transparent text-on-surface placeholder:text-outline resize-none outline-none font-sans text-sm py-1.5 leading-relaxed max-h-36 overflow-y-auto"
            />

            <div className="flex items-center justify-between pt-1 pb-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Attach schema, code snippet, or spec file"
                >
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                </button>

                <div
                  onClick={onOpenModelsTab}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                  title="Configure Model Matrix"
                >
                  <div className="flex -space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary ring-1 ring-background"></span>
                    <span className="w-2 h-2 rounded-full bg-error ring-1 ring-background"></span>
                    <span className="w-2 h-2 rounded-full bg-secondary ring-1 ring-background"></span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface font-medium">
                    All 3 Models Active
                  </span>
                  <span className="material-symbols-outlined text-[13px] text-outline">expand_more</span>
                </div>

                <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-outline">
                  <span>Press</span>
                  <kbd className="px-1 rounded bg-surface-container text-on-surface">Enter</kbd>
                  <span>to deliberate</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isDeliberating}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    inputText.trim() && !isDeliberating
                      ? 'bg-primary hover:bg-primary-container text-on-primary shadow-xs cursor-pointer'
                      : 'bg-surface-container text-outline opacity-50 cursor-not-allowed'
                  }`}
                  aria-label="Send Query"
                >
                  {isDeliberating ? (
                    <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
