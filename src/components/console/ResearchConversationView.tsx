import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateSession, EvidenceSource, ProviderKeyConfig } from '../../types';
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
  onOpenNotes?: () => void;
  onOpenInBreezy?: (session: DebateSession) => void;
  onOpenInIde?: (session: DebateSession) => void;
  onPinToCanvas?: (session: DebateSession) => void;
}

const stages = [
  { number: '01', title: 'Question', icon: 'help_outline', detail: 'Semantic boundary & parameter validation' },
  { number: '02', title: 'Exploration', icon: 'travel_explore', detail: 'Autonomous literature search & corpus indexing' },
  { number: '03', title: 'Proposals', icon: 'lightbulb', detail: 'Drafting initial hypotheses and counter-claims' },
  { number: '04', title: 'Challenge', icon: 'gavel', detail: 'Adversarial stress-testing & bias elimination' },
  { number: '05', title: 'Evidence', icon: 'fact_check', detail: 'Source attribution & confidence scoring' },
  { number: '06', title: 'Synthesis', icon: 'article', detail: 'Executive synthesis and final answer' },
];

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
  heartbeatState,
  onSaveNote,
  onExportMarkdown,
  onOpenInIde,
  onPinToCanvas,
  onOpenNotes,
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!isDeliberating) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [isDeliberating]);

  const elapsedSeconds = activeRoundStartedAt
    ? Math.max(0, Math.floor((nowMs - activeRoundStartedAt) / 1000))
    : 0;

  const formatDuration = (seconds: number) =>
    Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');

  const handleInitiate = () => {
    if (!inputText.trim()) {
      textareaRef.current?.focus();
      return;
    }

    let promptToSend = inputText.trim();

    if (attachedFile) {
      promptToSend +=
        '\n\n--- [Attached Reference Context: ' +
        attachedFile.name +
        '] ---\n' +
        attachedFile.content +
        '\n--- [End Context] ---';
    }

    const verificationInstruction = {
      'cross-exam':
        'Use grounded cross-examination: distinguish evidence from inference and actively test important claims.',
      consensus:
        'Use a consensus-oriented verification pass: compare independent evidence and prefer conclusions supported across sources.',
      adversarial:
        'Use adversarial verification: actively search for counterexamples, contradictions, edge cases, and unsupported assumptions.',
    }[verificationMode];

    promptToSend +=
      '\n\n--- Verification Preference ---\n' +
      verificationInstruction +
      '\n--- End Verification Preference ---';

    const depthMap = {
      fast: 'solo' as const,
      standard: 'standard' as const,
      exhaustive: 'deep' as const,
    };

    if (isDeliberating && onSteer) {
      onSteer(promptToSend);
    } else {
      onStartDebate(promptToSend, depthMap[researchDepth]);
    }

    setInputText('');
    setAttachedFile(null);
  };

  const handleApplyDirective = (text: string) => {
    setInputText(text);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';
      setAttachedFile({ name: file.name, content: content.slice(0, 15000) });
      showToast('Uploaded ' + file.name);
    };
    reader.readAsText(file);
    event.currentTarget.value = '';
  };

  const handleCopy = () => {
    if (!session?.finalOutput) return;
    navigator.clipboard.writeText(session.finalOutput);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    showToast('Copied synthesis to clipboard');
  };

  const handleSave = () => {
    if (!session || !onSaveNote) return;
    onSaveNote(session.prompt.slice(0, 60), session.finalOutput || session.prompt);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const sampleDirectives = [
    {
      label: 'Domain #01',
      title: 'Electrochemical Degradation',
      desc: 'NMC cathode lattice oxygen release & impedance growth mechanics.',
      prompt:
        'Electrochemical Degradation: Synthesize degradation pathways of high-nickel NMC cathodes during ultra-fast C-rate cycling under thermal stress.',
    },
    {
      label: 'Domain #02',
      title: 'Distributed Consensus',
      desc: 'Asynchronous DAG invariants under network partitions.',
      prompt:
        'Distributed Consensus Kernels: Formalize safety bounds of DAG-based asynchronous consensus protocols under dynamic quorum availability.',
    },
    {
      label: 'Domain #03',
      title: 'Game Theory',
      desc: 'Equilibrium shifts in automated cross-pool liquidity provision.',
      prompt:
        'Algorithmic Game Theory: Evaluate strategic equilibrium stability in high-frequency multi-agent automated market maker pools.',
    },
  ];

  const currentRunTitle = session?.prompt
    ? session.prompt.length > 50
      ? session.prompt.slice(0, 48) + '...'
      : session.prompt
    : 'Unallocated Run';

  const steps = session?.steps || [];
  const proposals = steps.filter((step) => step.role === 'architect' || step.role === 'solo');
  const challenges = steps.filter((step) => step.role === 'skeptic');
  const sources: EvidenceSource[] = session?.evidenceGraph?.sourcesConsulted || [];

  return (
    <div className="relative min-h-full w-full overflow-x-hidden bg-surface text-on-surface [background-image:radial-gradient(circle_at_50%_18%,rgba(0,180,216,0.10)_0%,transparent_62%)]">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.json,.csv,.py,.ts,.tsx,.js"
      />

      <div className="relative w-full overflow-hidden px-4 pb-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary-container/10 blur-[140px]" />
          <div className="absolute right-0 top-40 h-[340px] w-[520px] rounded-full bg-secondary-container/10 blur-[130px]" />
          <div className="absolute bottom-0 left-1/4 h-[280px] w-[640px] rounded-full bg-primary/5 blur-[130px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col gap-space-xl pb-space-xl pt-space-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm text-outline font-code-sm text-code-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="tracking-wider uppercase text-on-surface-variant">Workspace</span>
              <span className="text-surface-container-highest">/</span>
              <span className="truncate text-primary">{currentRunTitle}</span>
            </div>

            <div className="flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-md py-1.5 font-code-sm text-code-sm text-on-surface-variant">
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (isDeliberating ? 'bg-tertiary animate-pulse' : 'bg-outline')
                }
              />
              <span>{isDeliberating ? 'Synthesis active' : 'Verification ready'}</span>
            </div>
          </div>

          <header className="flex flex-col gap-space-sm">
            <div className="flex items-end justify-between gap-space-md">
              <div>
                <div className="flex items-center gap-space-sm font-code-sm text-code-sm uppercase tracking-wider text-outline">
                  <span>Research</span>
                  <span className="text-outline-variant">/</span>
                  <span className="text-primary">Workspace</span>
                </div>
                <h1 className="mt-2 font-headline-lg text-headline-lg tracking-tight text-on-surface">
                  Research Workspace
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Form an inquiry, coordinate the research pipeline, and keep the evidence trail visible.
                </p>
              </div>

              <div className="hidden items-center gap-space-xs rounded-full bg-surface-container-high px-space-sm py-1 font-code-sm text-code-sm text-outline lg:flex">
                <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                <span>{isDeliberating ? 'Live research telemetry' : 'Ready for inquiry'}</span>
              </div>
            </div>
          </header>

          <section className="relative overflow-hidden rounded-[24px] bg-surface-container p-space-lg shadow-xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-space-md pb-space-md">
                <div className="flex items-center gap-space-sm text-primary">
                  <span className="material-symbols-outlined text-[20px]">neurology</span>
                  <div>
                    <div className="font-code-sm text-code-sm uppercase tracking-wider font-semibold">
                      Inquiry Formulation
                    </div>
                    <div className="mt-0.5 text-xs text-on-surface-variant">
                      Start with the question. Let the research stages do the rest.
                    </div>
                  </div>
                </div>
                <span className="hidden rounded-full bg-surface-container-high px-space-sm py-1 font-code-sm text-code-sm text-outline sm:inline-flex">
                  Markdown + attachments
                </span>
              </div>

              <div className="relative rounded-2xl bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleInitiate();
                    }
                  }}
                  rows={4}
                  placeholder="State your research inquiry, theorem, or experimental hypothesis..."
                  className="w-full resize-none bg-transparent px-space-md py-space-md text-base leading-7 text-on-surface placeholder:text-outline focus:outline-none sm:text-lg"
                />
                <div className="flex items-center justify-between px-space-md pb-space-sm font-code-sm text-code-sm text-outline-variant">
                  <span>{inputText.length ? inputText.length + ' characters' : 'Awaiting statement formulation'}</span>
                  <span className="hidden sm:inline">
                    <kbd className="rounded bg-surface-container px-1">Shift</kbd> +{' '}
                    <kbd className="rounded bg-surface-container px-1">Return</kbd> for newline
                  </span>
                </div>
              </div>

              <div className="mt-space-md flex flex-col gap-space-md lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <label className="flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-sm py-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Depth:</span>
                    <select
                      value={researchDepth}
                      onChange={(event) =>
                        setResearchDepth(event.target.value as 'standard' | 'exhaustive' | 'fast')
                      }
                      className="cursor-pointer bg-transparent pr-space-xs text-xs font-medium outline-none"
                    >
                      <option value="fast">Quick</option>
                      <option value="standard">Research</option>
                      <option value="exhaustive">Deep</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-sm py-space-xs text-on-surface">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">fact_check</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Mode:</span>
                    <select
                      value={verificationMode}
                      onChange={(event) =>
                        setVerificationMode(
                          event.target.value as 'cross-exam' | 'consensus' | 'adversarial'
                        )
                      }
                      className="cursor-pointer bg-transparent pr-space-xs text-xs font-medium outline-none"
                    >
                      <option value="cross-exam">Grounded</option>
                      <option value="consensus">Consensus</option>
                      <option value="adversarial">Stress test</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={
                      'flex items-center gap-space-xs rounded-full px-space-sm py-space-xs text-xs transition-colors ' +
                      (attachedFile
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface')
                    }
                  >
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                    <span className="max-w-[220px] truncate">
                      {attachedFile ? attachedFile.name : 'Upload files / DOI list'}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleInitiate}
                  disabled={isDeliberating}
                  className="flex h-11 items-center justify-center gap-space-sm rounded-full bg-primary px-space-lg font-headline-sm text-headline-sm text-on-primary shadow-md transition-all hover:bg-secondary active:scale-[0.98] disabled:opacity-40"
                >
                  <span>{isDeliberating ? 'Researching...' : 'Initiate Synthesis'}</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {isDeliberating ? 'sync' : 'arrow_forward'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          {!session?.finalOutput && !isDeliberating && (
            <section className="relative overflow-hidden rounded-[24px] bg-surface-container-low/70 p-space-lg sm:p-space-xl">
              <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_center,#4cd6fb_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-full max-w-3xl">
                  <div className="relative hidden items-start justify-between sm:flex">
                    <div className="absolute left-6 right-6 top-4 h-px bg-surface-container-highest" />
                    {stages.map((stage, index) => (
                      <div key={stage.number} className="relative z-10 flex flex-col items-center gap-space-xs">
                        <div
                          className={
                            'flex h-9 w-9 items-center justify-center rounded-full ' +
                            (index === 0
                              ? 'bg-surface-container-high text-primary'
                              : 'bg-surface-container text-outline')
                          }
                        >
                          <span className="material-symbols-outlined text-[18px]">{stage.icon}</span>
                        </div>
                        <span
                          className={
                            'font-code-sm text-code-sm ' +
                            (index === 0 ? 'font-medium text-primary' : 'text-outline')
                          }
                        >
                          {stage.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center sm:hidden">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-primary">
                      <span className="material-symbols-outlined text-[18px]">help_outline</span>
                    </div>
                    <span className="mt-2 font-code-sm text-code-sm text-primary">Question</span>
                  </div>
                </div>

                <div className="mt-space-xl max-w-xl">
                  <div className="flex items-center justify-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary">schema</span>
                    <h2 className="font-headline-md text-headline-md">Synthesis Pipeline</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Submit an inquiry to activate multi-model exploration, challenge, evidence collection, and synthesis.
                  </p>
                </div>

                <div className="mt-space-xl w-full max-w-2xl border-t border-outline-variant/30 pt-space-lg">
                  <div className="mb-4 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-wider text-outline">
                    <span className="material-symbols-outlined text-[15px]">bolt</span>
                    <span>Sample Directives</span>
                  </div>

                  <div className="grid gap-space-sm text-left md:grid-cols-3">
                    {sampleDirectives.map((directive) => (
                      <button
                        key={directive.label}
                        type="button"
                        onClick={() => handleApplyDirective(directive.prompt)}
                        className="group flex min-h-[140px] flex-col justify-between rounded-2xl bg-surface-container p-space-md text-left transition-all hover:bg-surface-container-high"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-code-sm text-code-sm uppercase tracking-wider text-primary">
                            {directive.label}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary">
                            arrow_outward
                          </span>
                        </div>
                        <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                          {directive.title}
                        </span>
                        <span className="text-xs leading-5 text-on-surface-variant">{directive.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-space-lg flex w-full max-w-2xl items-center gap-space-md rounded-2xl bg-surface-container-low p-space-md text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-primary">
                    <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-sm text-headline-sm text-on-surface">Ready for new inquiry</div>
                    <div className="text-xs text-on-surface-variant">
                      No research run is active. Your next submission will create a fresh synthesis.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {isDeliberating && (
            <section className="relative overflow-hidden rounded-[24px] bg-surface-container p-space-lg shadow-xl sm:p-space-xl">
              <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-start justify-between gap-space-md border-b border-outline-variant/40 pb-space-md">
                  <div>
                    <div className="flex items-center gap-space-sm font-code-sm text-code-sm uppercase tracking-wider text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse" />
                      Active synthesis
                    </div>
                    <h2 className="mt-1 font-headline-md text-headline-md">
                      Stage {String(activeRound).padStart(2, '0')} · {streamingRole || 'Research'}
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-on-surface-variant">
                      Breezy is working through the research pipeline. You can steer the direction without restarting the workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-space-sm font-code-sm text-code-sm text-outline">
                    <span className="rounded-full bg-surface-container-low px-space-sm py-1.5">
                      {formatDuration(elapsedSeconds)}
                    </span>
                    {liveUsage?.totalTokens ? (
                      <span className="rounded-full bg-surface-container-low px-space-sm py-1.5">
                        {liveUsage.totalTokens.toLocaleString()} tokens
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-space-lg grid gap-space-xl lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="relative pl-space-lg">
                    <div className="absolute bottom-2 left-3 top-2 w-px bg-outline-variant/70" />
                    <div className="flex flex-col gap-space-md">
                      {stages.map((stage, index) => {
                        const active = index + 1 === activeRound;
                        const done = index + 1 < activeRound;

                        return (
                          <div key={stage.number} className="relative">
                            <span
                              className={
                                'absolute -left-7 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface-container ' +
                                (active
                                  ? 'bg-primary text-on-primary'
                                  : done
                                    ? 'bg-tertiary text-on-primary'
                                    : 'bg-surface-container-highest text-outline')
                              }
                            >
                              <span className="material-symbols-outlined text-[11px]">
                                {done ? 'check' : active ? 'radio_button_checked' : 'radio_button_unchecked'}
                              </span>
                            </span>

                            <div>
                              <div
                                className={
                                  'font-headline-sm text-headline-sm ' +
                                  (active
                                    ? 'text-primary'
                                    : done
                                      ? 'text-on-surface'
                                      : 'text-on-surface-variant')
                                }
                              >
                                {stage.number}. {stage.title}
                              </div>
                              <div className="mt-0.5 text-xs leading-5 text-on-surface-variant">
                                {stage.detail}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="rounded-2xl bg-surface-container-low p-space-md">
                      <div className="flex items-center justify-between gap-space-md border-b border-outline-variant/35 pb-space-sm">
                        <span className="font-code-sm text-code-sm uppercase tracking-wider text-outline">
                          Live output
                        </span>
                        {heartbeatState?.statusText ? (
                          <span className="truncate text-xs text-tertiary">{heartbeatState.statusText}</span>
                        ) : null}
                      </div>
                      <p className="mt-space-md whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">
                        {streamingRoundText
                          ? streamingRoundText.slice(-1800)
                          : 'Working through the research stages…'}
                      </p>
                    </div>

                    {heartbeatState?.taskReminder ? (
                      <div className="mt-space-sm rounded-xl bg-tertiary/5 px-space-md py-space-sm text-xs text-on-surface-variant">
                        <span className="font-medium text-tertiary">Focus:</span>{' '}
                        {heartbeatState.taskReminder}
                      </div>
                    ) : null}

                    {onSteer ? (
                      <div className="mt-space-sm flex items-end gap-space-sm rounded-2xl bg-surface-container-low p-space-sm focus-within:bg-surface-container">
                        <textarea
                          value={inputText}
                          onChange={(event) => setInputText(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              handleInitiate();
                            }
                          }}
                          rows={1}
                          placeholder="Steer this research: challenge a claim, add evidence, or change direction…"
                          className="min-h-10 flex-1 resize-none bg-transparent px-space-xs py-space-sm text-sm leading-5 outline-none placeholder:text-outline"
                        />
                        <button
                          type="button"
                          onClick={handleInitiate}
                          disabled={!inputText.trim()}
                          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-space-md text-xs font-semibold text-on-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span>Steer</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          )}

          {session?.finalOutput ? (
            <>
              <section className="grid gap-px overflow-hidden rounded-[24px] border border-outline-variant/45 bg-outline-variant/45 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="min-w-0 bg-surface-container p-space-lg sm:p-space-xl">
                  <div className="flex flex-wrap items-start justify-between gap-space-md border-b border-outline-variant/40 pb-space-md">
                    <div>
                      <div className="font-code-sm text-code-sm uppercase tracking-wider text-primary">Answer</div>
                      <h2 className="mt-1 font-headline-md text-headline-md">Breezy's synthesis</h2>
                    </div>
                    <span className="text-xs text-on-surface-variant">Research completed</span>
                  </div>

                  <div className="prose prose-invert mt-space-lg max-w-none text-[15px] leading-7">
                    <ReactMarkdown>{session.finalOutput}</ReactMarkdown>
                  </div>

                  <div className="mt-space-lg flex flex-wrap gap-space-sm border-t border-outline-variant/40 pt-space-md">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container-high px-space-md text-xs hover:bg-surface-container-highest"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                      {copied ? 'Copied' : 'Copy'}
                    </button>

                    {onExportMarkdown ? (
                      <button
                        type="button"
                        onClick={onExportMarkdown}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container-high px-space-md text-xs hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Export
                      </button>
                    ) : null}

                    {onSaveNote ? (
                      <button
                        type="button"
                        onClick={handleSave}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container-high px-space-md text-xs hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {saved ? 'bookmark_added' : 'bookmark'}
                        </span>
                        {saved ? 'Saved' : 'Save'}
                      </button>
                    ) : null}

                    {onOpenNotes ? (
                      <button
                        type="button"
                        onClick={onOpenNotes}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container-high px-space-md text-xs hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-[16px]">sticky_note_2</span>
                        Notes
                      </button>
                    ) : null}

                    {onPinToCanvas ? (
                      <button
                        type="button"
                        onClick={() => onPinToCanvas(session)}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container-high px-space-md text-xs hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-[16px]">draw</span>
                        Canvas
                      </button>
                    ) : null}

                    {onOpenInIde ? (
                      <button
                        type="button"
                        onClick={() => onOpenInIde(session)}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container-high px-space-md text-xs hover:bg-surface-container-highest"
                      >
                        <span className="material-symbols-outlined text-[16px]">terminal</span>
                        Build
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setShowEvidenceGraph((value) => !value)}
                      className="ml-auto flex h-9 items-center gap-1.5 rounded-full px-space-md text-xs text-primary hover:bg-surface-container-high"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {showEvidenceGraph ? 'expand_less' : 'account_tree'}
                      </span>
                      {showEvidenceGraph ? 'Hide graph' : 'Evidence graph'}
                    </button>
                  </div>

                  {showEvidenceGraph && session.evidenceGraph ? (
                    <div className="mt-space-lg border-t border-outline-variant/40 pt-space-lg">
                      <EvidenceGraphView
                        evidenceGraph={session.evidenceGraph}
                        researchMetrics={session.researchMetrics}
                      />
                    </div>
                  ) : null}
                </article>

                <aside className="bg-surface-container-low p-space-lg">
                  <div className="border-b border-outline-variant/40 pb-space-md">
                    <div className="font-code-sm text-code-sm uppercase tracking-wider text-outline">
                      Research stages
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {session.status === 'completed' ? 'Complete' : 'In progress'}
                    </div>
                  </div>

                  <div className="relative mt-space-lg pl-space-lg">
                    <div className="absolute bottom-2 left-3 top-2 w-px bg-outline-variant/70" />
                    <div className="flex flex-col gap-space-md">
                      {stages.map((stage, index) => {
                        const done = session.status === 'completed' || index < activeRound;
                        const active = isDeliberating && index === activeRound - 1;

                        return (
                          <div key={stage.number} className="relative">
                            <span
                              className={
                                'absolute -left-7 top-0.5 h-4 w-4 rounded-full border-2 border-surface-container-low ' +
                                (active
                                  ? 'bg-primary'
                                  : done
                                    ? 'bg-tertiary'
                                    : 'bg-surface-container-highest')
                              }
                            />

                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={
                                  'text-xs font-medium ' +
                                  (active
                                    ? 'text-primary'
                                    : done
                                      ? 'text-on-surface'
                                      : 'text-on-surface-variant')
                                }
                              >
                                {stage.number}. {stage.title}
                              </span>
                              <span className="material-symbols-outlined text-[15px] text-outline">
                                {done ? 'check' : active ? 'more_horiz' : 'radio_button_unchecked'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </section>

              {sources.length > 0 ? (
                <section className="overflow-hidden rounded-[24px] border border-outline-variant/45 bg-surface-container-low">
                  <div className="flex items-end justify-between gap-space-md border-b border-outline-variant/40 p-space-lg">
                    <div>
                      <div className="font-code-sm text-code-sm uppercase tracking-wider text-tertiary">
                        Evidence
                      </div>
                      <h3 className="mt-1 font-headline-md text-headline-md">Sources</h3>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {sources.length} source{sources.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid gap-px bg-outline-variant/40 md:grid-cols-2">
                    {sources.map((source: EvidenceSource, index: number) => (
                      <a
                        key={source.id || index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group min-w-0 bg-surface-container p-space-md hover:bg-surface-container-high"
                      >
                        <div className="flex items-start justify-between gap-space-md">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium group-hover:text-primary">
                              {source.title || source.url}
                            </div>
                            <div className="mt-1 truncate font-code-sm text-code-sm text-outline">
                              {source.domain || source.url}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[17px] text-outline group-hover:text-primary">
                            north_east
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {proposals.length > 0 || challenges.length > 0 ? (
                <section className="grid gap-px overflow-hidden rounded-[24px] border border-outline-variant/45 bg-outline-variant/45 md:grid-cols-2">
                  <div className="bg-surface-container p-space-lg">
                    <div className="flex items-center gap-space-sm border-b border-outline-variant/40 pb-space-md">
                      <span className="material-symbols-outlined text-[18px] text-primary">lightbulb</span>
                      <h3 className="text-sm font-semibold">Perspectives</h3>
                    </div>
                    <div className="mt-space-md space-y-space-sm">
                      {proposals.map((proposal, index) => (
                        <div key={index} className="rounded-2xl bg-surface-container-low p-space-md">
                          <div className="font-code-sm text-code-sm text-secondary">Perspective {index + 1}</div>
                          <p className="mt-1 line-clamp-5 text-xs leading-5 text-on-surface-variant">
                            {proposal.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-space-lg">
                    <div className="flex items-center gap-space-sm border-b border-outline-variant/40 pb-space-md">
                      <span className="material-symbols-outlined text-[18px] text-secondary">gavel</span>
                      <h3 className="text-sm font-semibold">Challenges</h3>
                    </div>
                    <div className="mt-space-md space-y-space-sm">
                      {challenges.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container p-space-md text-xs text-on-surface-variant">
                          No challenges were returned for this run.
                        </div>
                      ) : (
                        challenges.map((challenge, index) => (
                          <div key={index} className="rounded-2xl bg-surface-container p-space-md">
                            <div className="font-code-sm text-code-sm text-tertiary">Challenge {index + 1}</div>
                            <p className="mt-1 line-clamp-5 text-xs leading-5 text-on-surface-variant">
                              {challenge.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {toastMessage ? (
        <div className="fixed bottom-20 right-4 z-50 rounded-xl border border-outline-variant/60 bg-surface-container-high px-4 py-3 text-xs shadow-[0_12px_32px_-8px_rgba(0,0,0,.65)] lg:bottom-6">
          <span className="material-symbols-outlined mr-2 inline-flex align-middle text-[16px] text-primary">
            info
          </span>
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
};
