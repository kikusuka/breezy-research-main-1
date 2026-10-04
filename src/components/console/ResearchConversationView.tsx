import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateSession, ProviderKeyConfig, EvidenceSource } from '../../types';
import { EvidenceGraphView } from './EvidenceGraphView';
import { googleDriveService } from '../../services/googleDriveService';
import { authService } from '../../services/authService';
import { providerConfigService } from '../../services/providerConfigService';

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
  heartbeatState,
  onSaveNote,
  onExportMarkdown,
  keys,
  researchEvents = [],
  onOpenNotes,
  onOpenInBreezy,
  onOpenInIde,
  onPinToCanvas,
}) => {
  const [inputText, setInputText] = useState('');
  const [researchDepth, setResearchDepth] = useState<'solo' | 'standard' | 'deep'>('standard');
  const [showResearchTrail, setShowResearchTrail] = useState(false);
  const [isTrailExpanded, setIsTrailExpanded] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; content?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isUserTyping = inputText.trim().length > 0;
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    if (!isDeliberating) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [isDeliberating]);
  const elapsedSeconds = activeRoundStartedAt ? Math.max(0, Math.floor((nowMs - activeRoundStartedAt) / 1000)) : 0;
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const formatTokens = (value?: number) => typeof value === 'number' ? value.toLocaleString() : '—';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Scroll to bottom during streaming or active updates
  useEffect(() => {
    if (isDeliberating) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingRoundText, isDeliberating]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const prompt = inputText.trim();
    
    // Only guard direct GitHub repo mutations
    const isGithubRepoOp = /push to repo|commit to repo|open pull request|create pull request|mount github repo/i.test(prompt);
    const hasGithub = Boolean(localStorage.getItem('synthexis_github_token') || localStorage.getItem('breezy_github_token'));
    if (isGithubRepoOp && !hasGithub) {
      showToast("GitHub Token Required: Direct repository commits require a Personal Access Token in Settings.");
      return;
    }

    const fullPromptWithContext = attachedFile?.content
      ? `${prompt}\n\n--- [Attached Document: ${attachedFile.name}] ---\n${attachedFile.content}\n--- [End of Document Context] ---`
      : prompt;

    setInputText('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (isDeliberating && onSteer) {
      onSteer(fullPromptWithContext);
    } else {
      onStartDebate(fullPromptWithContext, researchDepth);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = () => {
    if (!session) return;
    const textToCopy = session.finalOutput || session.prompt;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!session) return;
    onSaveNote?.(session.prompt.slice(0, 60), session.finalOutput || '');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = typeof event.target?.result === 'string' ? event.target.result : '';
        // Limit text to 40,000 chars to avoid overflowing model context
        const truncated = text.length > 40000 ? text.slice(0, 40000) + '\n... [Context truncated for length]' : text;
        setAttachedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: truncated,
        });
        showToast(`Loaded ${file.name} for research context.`);
      };
      reader.onerror = () => {
        showToast('Could not parse selected file. Please select a text, code, or document file.');
      };
      reader.readAsText(file);
    }
  };

  const sources: EvidenceSource[] = session?.evidenceGraph?.sourcesConsulted || [];
  const claims = session?.evidenceGraph?.claims || [];
  const contradictions = session?.evidenceGraph?.contradictions || [];

  const isInitialPrompt = !session || (!session.finalOutput && !isDeliberating && (!session.steps || session.steps.length === 0));

  const researchWorkflows = [
    { label: 'Investigate', description: 'Open-ended question with adaptive web grounding.', method: 'adaptive' as const, depth: 'standard' as const },
    { label: 'Systematic review', description: 'Explicit subquestions, evidence boundaries, and traceable claims.', method: 'systematic' as const, depth: 'deep' as const },
    { label: 'Compare', description: 'Set criteria first, then test competing approaches.', method: 'comparative' as const, depth: 'deep' as const },
    { label: 'Evidence map', description: 'Map themes, contradictions, and what the evidence does not answer.', method: 'evidence-map' as const, depth: 'deep' as const },
  ];

  // Natural language research state tracker
  const getSubtleResearchState = () => {
    if (activeRound === 1) return 'Exploring primary premises and establishing theoretical baseline...';
    if (activeRound === 2) return 'Challenging assumptions and investigating boundary failures...';
    if (activeRound === 3) return 'Reviewing Analyst and Critic output for unsupported claims and math errors...';
    if (activeRound >= 4) return 'Analyzing divergent guidelines and resolving point of tension...';
    return 'Conducting multi-model research...';
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] bg-stone-950 text-stone-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.csv"
      />

      {isDeliberating && (
        <div className="sticky top-0 z-20 border-b border-stone-800/60 bg-stone-950/95 px-4 py-2">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-stone-500 uppercase tracking-wider">
            <span className="text-stone-300">{streamingRole || 'Research'} · {formatDuration(elapsedSeconds)}</span>
            <span>input {formatTokens(liveUsage?.inputTokens)}</span>
            <span>output {formatTokens(liveUsage?.outputTokens)}</span>
            <span>total {formatTokens(liveUsage?.totalTokens)}</span>
            {liveUsage?.reasoningTokens ? <span>reasoning {formatTokens(liveUsage.reasoningTokens)}</span> : null}
            <span className="text-emerald-400">LIVE</span>
            {heartbeatState?.statusText ? <span className="text-amber-400 truncate max-w-[280px]">{heartbeatState.statusText}</span> : null}
          </div>
        </div>
      )}
      {heartbeatState?.checkpoint && isDeliberating && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 w-full">
          <div className="border border-amber-500/10 bg-amber-500/[0.025] px-3 py-2 rounded-md text-[10px] text-stone-500 font-mono">
            <span className="text-amber-400">PROGRESS</span> · {heartbeatState.taskReminder || 'Progress check complete'}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-between">
        {isInitialPrompt ? (
          /* Centered, Weirdly Simple Landing State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 sm:py-24 text-center w-full">
            {/* Elegant Serif Header Group */}
            <span className="font-serif text-4xl sm:text-5xl font-normal text-stone-100 tracking-tight mb-3">
              Breezy Research
            </span>
            <h1 className="text-base sm:text-lg font-serif text-stone-400 font-normal mb-3 tracking-wide">
              What are you trying to figure out?
            </h1>
            <p className="max-w-lg text-xs leading-6 text-stone-600 mb-8">
              Models can challenge one another before Breezy writes the conclusion.
            </p>

            {/* The Ultra-Simple Input Box */}
            <div className="w-full bg-[#161a22] border border-white/5 rounded-2xl p-4 shadow-xl text-left focus-within:border-white/10 transition-all max-w-xl relative">
              <div className="flex flex-col gap-3 min-h-[72px] justify-between">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question, explore an idea, or give me something difficult to figure out..."
                  rows={2}
                  className="w-full bg-transparent text-stone-100 placeholder-stone-500 text-sm resize-none focus:outline-none leading-relaxed border-none focus:ring-0 p-0"
                />

                <div className="flex items-center justify-between mt-1">
                  {/* Attached file slot if present */}
                  {attachedFile ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-stone-300">
                      <span className="material-symbols-outlined text-[14px] text-stone-400">attach_file</span>
                      <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-stone-500 hover:text-stone-200 font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Actions inside the box */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Plus Icon Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                      title="Add document, image, audio or video"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>

                    {/* Up Arrow Send Button */}
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                        inputText.trim()
                          ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer shadow-md'
                          : 'bg-white/5 text-stone-500 cursor-not-allowed'
                      }`}
                      title="Send inquiry"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Depth Toggles inside the input container (reveals only when typing starts) */}
              {isUserTyping && (
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-1 bg-black/25 p-0.5 rounded-lg border border-white/5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setResearchDepth('solo')}
                      className={`px-3 py-1 rounded-md transition-all font-medium ${
                        researchDepth === 'solo'
                          ? 'bg-white/10 text-stone-100'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      title="Solo Mode: Direct, fast analysis"
                    >
                      Solo
                    </button>
                    <button
                      type="button"
                      onClick={() => setResearchDepth('standard')}
                      className={`px-3 py-1 rounded-md transition-all font-medium ${
                        researchDepth === 'standard'
                          ? 'bg-white/10 text-stone-100'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      title="Research Mode: Fact-checks and live web search"
                    >
                      Research
                    </button>
                    <button
                      type="button"
                      onClick={() => setResearchDepth('deep')}
                      className={`px-3 py-1 rounded-md transition-all font-medium ${
                        researchDepth === 'deep'
                          ? 'bg-white/10 text-stone-100'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      title="Deep mode: multiple perspectives and independent checks"
                    >
                      Deep
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500 italic">
                    {researchDepth === 'solo' ? 'Fast & lightweight' : researchDepth === 'deep' ? 'Deconstructs subquestions' : 'Active web validation'}
                  </span>
                </div>
              )}
            </div>

            {/* Quiet Centered Typographic Footer Links (No capsules or boxes) */}
            <div className="flex items-center gap-6 text-xs text-stone-500 mt-6 font-sans">
              <button
                type="button"
                onClick={() => {
                  setResearchDepth('deep');
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                className="hover:text-stone-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">travel_explore</span>
                <span>Research deeply</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-stone-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">attach_file</span>
                <span>Attach</span>
              </button>

              <button
                type="button"
                onClick={onOpenNotes}
                className="hover:text-stone-300 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>Recent</span>
              </button>
            </div>

            <div className="w-full max-w-xl mt-16 text-left border-t border-white/5 pt-8 font-sans">
              <span className="text-[10px] text-stone-500 uppercase tracking-widest block mb-4 font-semibold">Choose a workflow</span>
              <p className="text-xs text-stone-500 leading-relaxed mb-6">You can change this later. The workflow controls how Research structures the investigation; your model routing stays yours.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {researchWorkflows.map((item) => (
                  <button key={item.method} type="button" onClick={() => {
                    setResearchDepth(item.depth);
                    const next = providerConfigService.getConfig();
                    next.researchMethod = item.method;
                    next.preset = 'custom';
                    providerConfigService.saveConfig(next);
                    textareaRef.current?.focus();
                  }} className="p-3 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.025] text-left transition-colors group">
                    <span className="text-xs font-medium text-stone-300 group-hover:text-stone-100">{item.label}</span>
                    <span className="block text-[11px] text-stone-500 leading-relaxed mt-1">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Research Article & Conversation Thread */
          <div className="flex flex-col gap-10 pb-36">
            {/* Header Area */}
            <header className="border-b border-white/5 pb-6">
              <div className="flex items-center justify-between gap-3 text-xs text-stone-400 mb-3 font-sans">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-wider text-[10px] text-stone-500 font-semibold">Research Inquiry</span>
                  <span>·</span>
                  <span>{new Date(session?.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {sources.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-stone-300 font-medium">{sources.length} sources</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium cursor-pointer"
                    title="Copy response"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium cursor-pointer"
                    title="Save report to local journal"
                  >
                    <span className="material-symbols-outlined text-[14px]">bookmark</span>
                    <span>{saved ? 'Saved' : 'Journal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = authService.getAccessToken();
                      if (!token) {
                        showToast('Please connect Google Workspace in Settings.');
                        return;
                      }
                      if (!session) return;
                      try {
                        await googleDriveService.initialize(token);
                        await googleDriveService.saveResearch(session);
                        showToast('Research report backed up to Google Drive!');
                      } catch (e: any) {
                        showToast(`Backup failed: ${e.message}`);
                      }
                    }}
                    className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium cursor-pointer"
                    title="Save report to Google Drive"
                  >
                    <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                    <span>Drive</span>
                  </button>
                  {onExportMarkdown && (
                    <button
                      type="button"
                      onClick={onExportMarkdown}
                      className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium cursor-pointer"
                      title="Export report markdown"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      <span>Export</span>
                    </button>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-normal text-stone-100 leading-snug tracking-tight">
                {session?.prompt}
              </h1>
            </header>

            {/* Deliberation Status Indicators */}
            {isDeliberating && (
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                  <span className="text-sm font-medium text-stone-200">
                    {getSubtleResearchState()}
                  </span>
                  
                  {/* Subtle status matching requested pattern */}
                  <div className="flex items-center gap-2 text-xs text-stone-400 py-2 border-t border-white/5">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span>Researching</span>
                    <span>·</span>
                    <span>{activeRound || 1} angles</span>
                    <span>·</span>
                    <span>{sources.length} sources</span>
                  </div>
                </div>

                {researchEvents.length > 0 && (
                  <div className="text-[11px] text-stone-500 font-mono leading-relaxed pl-4 border-l border-white/5 flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                    {researchEvents.slice(-3).map((evt, i) => (
                      <span key={i}>· {evt}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Central Sourced Answer */}
            <article className="prose prose-invert max-w-none text-stone-200 leading-relaxed font-sans text-sm sm:text-[15px] space-y-4">
              {session?.finalOutput ? (
                <ReactMarkdown>{session.finalOutput}</ReactMarkdown>
              ) : isDeliberating && streamingRoundText ? (
                <div className="opacity-95">
                  <ReactMarkdown>{streamingRoundText}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-stone-400 text-xs sm:text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Reviewing assumptions and evidence...</span>
                </div>
              )}
            </article>

            {/* Action Bridge: Integration into other workspaces */}
            {session?.finalOutput && !isDeliberating && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 to-sky-500/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg my-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-stone-200 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-100">Workspace Integration</span>
                    <span className="text-[11px] text-stone-400">Export verified insights into active work environments</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {onOpenInBreezy && (
                    <button
                      type="button"
                      onClick={() => onOpenInBreezy(session)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">air</span>
                      <span>Chat in Breezy</span>
                    </button>
                  )}
                  {onOpenInIde && (
                    <button
                      type="button"
                      onClick={() => onOpenInIde(session)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md border border-stone-700 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">terminal</span>
                      <span>Open in Terminal IDE</span>
                    </button>
                  )}
                  {onPinToCanvas && (
                    <button
                      type="button"
                      onClick={() => onPinToCanvas(session)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 font-sans text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md border border-violet-500/40 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
                      <span>Pin to Canvas</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Points of Contention block */}
            {contradictions.length > 0 && (
              <section className="p-5 rounded-xl bg-amber-500/[0.02] border border-amber-500/10">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2.5">
                  <span className="material-symbols-outlined text-[16px]">balance</span>
                  <span>Point of Tension Discovered</span>
                </div>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  Scrutiny of technical evidence highlighted diverging recommendations:
                </p>
                <div className="flex flex-col gap-3">
                  {contradictions.map((contra, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-black/10 border border-white/5 text-xs text-stone-300">
                      <div className="font-semibold text-stone-200 mb-1">
                        {contra.claimA} vs. {contra.claimB}
                      </div>
                      <p className="text-stone-400 leading-relaxed mb-2">
                        {contra.description}
                      </p>
                      {contra.reconciledResolution && (
                        <div className="pt-2.5 mt-2 border-t border-white/5 text-emerald-300 flex items-start gap-1.5 leading-relaxed">
                          <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">check_circle</span>
                          <span><strong>Resolution:</strong> {contra.reconciledResolution}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Collapsible Research Trail View (technical steps) */}
            {session?.steps && session.steps.length > 0 && (
              <section className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setIsTrailExpanded(!isTrailExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-stone-400 text-[18px]">history_edu</span>
                    <span className="text-xs font-semibold text-stone-300">
                      Explore detailed research logs ({session.steps.length} rounds analyzed)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-stone-400 text-[18px] transition-transform duration-200" style={{ transform: isTrailExpanded ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </button>
                
                {isTrailExpanded && (
                  <div className="p-4 border-t border-white/5 flex flex-col gap-4 bg-black/10">
                    {session.steps.map((step, idx) => {
                      const humanRole = step.role === 'architect' ? 'Initial proposal' : step.role === 'skeptic' ? 'Challenges' : 'Resolution';
                      return (
                        <div key={idx} className="flex flex-col gap-2 p-3.5 rounded-lg bg-[#141820] border border-white/5">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              <span className="text-xs font-semibold text-stone-200">{step.agentName}</span>
                              <span className="text-[10px] text-stone-500">({humanRole})</span>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${
                              step.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                : step.status === 'running'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10 animate-pulse'
                                : 'bg-white/5 text-stone-400 border border-white/5'
                            }`}>
                              {step.status}
                            </span>
                          </div>
                          {step.content ? (
                            <div className="text-xs text-stone-300 leading-relaxed font-sans max-h-[300px] overflow-y-auto mt-1 prose prose-xs prose-invert">
                              <ReactMarkdown>{step.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-500 italic mt-1">Analyzing perspective...</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Zero-Pill Footer Metadata Strip */}
            <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400 font-sans">
              <div className="flex items-center gap-2">
                <span>{sources.length} sources</span>
                <span>·</span>
                <span>{contradictions.length || 0} disagreements</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setShowResearchTrail(true)}
                  className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors cursor-pointer"
                >
                  View research trail
                </button>
              </div>
              
              {sources.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500 text-[10px]">Citations:</span>
                  {sources.slice(0, 4).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSource(src)}
                      className="text-stone-300 hover:text-blue-400 hover:underline text-[11px] font-mono cursor-pointer"
                      title={src.title}
                    >
                      [{i + 1}]
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={scrollEndRef} />
          </div>
        )}
      </div>

      {/* Persistent Follow-up Input area inside active thread (Minimizes blurring overlay completely) */}
      {!isInitialPrompt && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-stone-950 border-t border-stone-800/40 z-10">
          <div className="max-w-3xl mx-auto w-full">
            <div className="bg-[#161a22] border border-white/5 rounded-xl p-3 shadow-lg focus-within:border-white/10 transition-all relative">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isDeliberating ? 'Steer the debate: challenge a claim, add evidence, or change direction...' : 'Ask a follow-up, challenge a claim, or steer the research...'}
                    rows={1}
                    className="w-full bg-transparent text-stone-100 placeholder-stone-500 text-sm resize-none focus:outline-none leading-relaxed border-none focus:ring-0 p-0"
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  {attachedFile ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-stone-300">
                      <span className="material-symbols-outlined text-[12px] text-stone-400">attach_file</span>
                      <span className="truncate max-w-[120px]">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="text-stone-500 hover:text-stone-200">×</button>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Plus Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                      title="Add document, image, audio or video"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>

                    {/* Up Arrow Send Button */}
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                        inputText.trim() && !isDeliberating
                          ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer'
                          : 'bg-white/5 text-stone-500 cursor-not-allowed'
                      }`}
                      title={isDeliberating ? 'Steer the active research branch' : 'Send follow-up'}
                    >
                      <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Research depth selection reveal on type */}
              {isUserTyping && (
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-md border border-white/5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setResearchDepth('solo')}
                      className={`px-2 py-0.5 rounded transition-all font-medium ${
                        researchDepth === 'solo' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
                      }`}
                    >
                      Solo
                    </button>
                    <button
                      type="button"
                      onClick={() => setResearchDepth('standard')}
                      className={`px-2 py-0.5 rounded transition-all font-medium ${
                        researchDepth === 'standard' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
                      }`}
                    >
                      Research
                    </button>
                    <button
                      type="button"
                      onClick={() => setResearchDepth('deep')}
                      className={`px-2 py-0.5 rounded transition-all font-medium ${
                        researchDepth === 'deep' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
                      }`}
                    >
                      Deep
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Graph Slide-Over (Strict Solid Fill backdrop to prevent blurry halo) */}
      {showResearchTrail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#12151c] border-l border-white/5 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex flex-col font-sans">
                <span className="text-[10px] uppercase tracking-wider text-stone-450 font-semibold">
                  Evidence Provenance & Verification
                </span>
                <h3 className="text-xl font-serif font-normal text-stone-100 mt-1">
                  Research Evidence Graph
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResearchTrail(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close evidence viewer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Evidence Graph View Component */}
            <EvidenceGraphView
              evidenceGraph={session?.evidenceGraph}
              researchMetrics={session?.researchMetrics}
              sessionTitle={session?.prompt}
            />
          </div>
        </div>
      )}

      {/* Source Preview Modal (Strict Solid Fill backdrop to prevent blurry halo) */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-sans">
          <div className="w-full max-w-lg bg-[#161a22] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold font-mono">
                  {selectedSource.domain}
                </span>
                <h4 className="text-base font-semibold text-stone-100 mt-1 leading-snug">
                  {selectedSource.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="p-1 text-stone-400 hover:text-stone-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {selectedSource.snippet && (
              <div className="p-3.5 rounded-lg bg-black/25 border border-white/5 text-xs text-stone-300 leading-relaxed italic">
                "{selectedSource.snippet}"
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
              <span className="text-stone-400">
                {selectedSource.isPrimary ? 'Primary Documentation' : 'Reference Source'}
              </span>
              {selectedSource.url && (
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                >
                  <span>Open URL</span>
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#1e1e2d] text-stone-100 px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[16px] text-amber-400">warning</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
