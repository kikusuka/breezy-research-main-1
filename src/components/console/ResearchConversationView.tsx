import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { DebateSession, ProviderKeyConfig, EvidenceSource } from '../../types';
import { EvidenceGraphView } from './EvidenceGraphView';

interface ResearchConversationViewProps {
  session: DebateSession;
  isDeliberating: boolean;
  activeRound: number;
  streamingRoundText: string;
  streamingRole: string;
  onStartDebate: (prompt: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onSaveNote?: (title: string, content: string) => void;
  onExportMarkdown?: () => void;
  keys: ProviderKeyConfig;
  researchEvents?: string[];
  onOpenNotes?: () => void;
}

export const ResearchConversationView: React.FC<ResearchConversationViewProps> = ({
  session,
  isDeliberating,
  activeRound,
  streamingRoundText,
  streamingRole,
  onStartDebate,
  onSaveNote,
  onExportMarkdown,
  keys,
  researchEvents = [],
  onOpenNotes,
}) => {
  const [inputText, setInputText] = useState('');
  const [researchDepth, setResearchDepth] = useState<'solo' | 'standard' | 'deep'>('standard');
  const [showResearchTrail, setShowResearchTrail] = useState(false);
  const [isTrailExpanded, setIsTrailExpanded] = useState(false);
  const [selectedSource, setSelectedSource] = useState<EvidenceSource | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const isUserTyping = inputText.trim().length > 0;

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
    if (!inputText.trim() || isDeliberating) return;
    const prompt = inputText.trim();
    
    // Only guard direct GitHub repo mutations
    const isGithubRepoOp = /push to repo|commit to repo|open pull request|create pull request|mount github repo/i.test(prompt);
    const hasGithub = Boolean(localStorage.getItem('synthexis_github_token') || localStorage.getItem('breezy_github_token'));
    if (isGithubRepoOp && !hasGithub) {
      alert("GitHub Integration Required: Direct repository commits require a connected GitHub Personal Access Token in Settings.");
      return;
    }

    setInputText('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onStartDebate(prompt, researchDepth);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = () => {
    const textToCopy = session.finalOutput || session.prompt;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSaveNote?.(session.prompt.slice(0, 60), session.finalOutput || '');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    }
  };

  const sources: EvidenceSource[] = session.evidenceGraph?.sourcesConsulted || [];
  const claims = session.evidenceGraph?.claims || [];
  const contradictions = session.evidenceGraph?.contradictions || [];

  const isInitialPrompt = !session.finalOutput && !isDeliberating && session.steps.length === 0;

  // Real, natural technical topics
  const realScenarios = [
    {
      title: 'PostgreSQL + pgvector vs. Dedicated Pinecone Index',
      description: 'Evaluating vacuum constraints, scale degradation past 10M vectors, and latency vectors.',
      prompt: 'At 10M+ 1536-dimension embeddings, when does PostgreSQL pgvector degrade, and when is a dedicated vector index like Pinecone genuinely worth it?',
    },
    {
      title: 'Kafka Streams vs. DuckDB for Transaction Ledger Ingestion',
      description: 'Micro-batch transactional writes compared to event-based streaming consistency architectures.',
      prompt: 'Is DuckDB micro-batching suitable for a high-frequency financial transaction ledger, or is Kafka mandatory for continuous consistency?',
    },
    {
      title: 'Modular Go Monolith vs. Kubernetes Microservices Migrations',
      description: 'Identifying structural load inflection points and organizational scale boundaries for service splits.',
      prompt: 'Under what concrete load and team size thresholds does a modular Go monolith break down and justify migrating to Kubernetes microservices?',
    },
  ];

  // Natural language research state tracker
  const getSubtleResearchState = () => {
    if (activeRound === 1) return 'Exploring primary premises and establishing theoretical baseline...';
    if (activeRound === 2) return 'Challenging assumptions and investigating boundary failures...';
    if (activeRound === 3) return 'Verifying statements against crawled publications and primary datasets...';
    if (activeRound >= 4) return 'Analyzing divergent guidelines and resolving point of tension...';
    return 'Conducting multi-model research...';
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] bg-[#10141a] text-stone-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.csv"
      />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-between">
        {isInitialPrompt ? (
          /* Centered, Weirdly Simple Landing State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 sm:py-24 text-center w-full">
            {/* Elegant Serif Header Group */}
            <span className="font-serif text-4xl sm:text-5xl font-normal text-stone-100 tracking-tight mb-3">
              Synthexis
            </span>
            <h1 className="text-base sm:text-lg font-serif text-stone-300 font-normal mb-8 tracking-wide">
              What are you curious about?
            </h1>

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
                      title="Deep Mode: Multi-angle synthesis and exhaustive cross-checks"
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

            {/* Direct human language explanation & topics block */}
            <div className="w-full max-w-xl mt-16 text-left border-t border-white/5 pt-8 font-sans">
              <span className="text-[10px] text-stone-500 uppercase tracking-widest block mb-4 font-semibold">
                How Synthexis Works
              </span>
              <p className="text-xs text-stone-400 leading-relaxed mb-8">
                Synthexis translates technical questions into distinct research angles, verifies claims against original publications or uploaded document specifications, and harmonizes findings into a unified, sourced response. No theatrical AI council indicators — just verified technical consensus.
              </p>

              <span className="text-[10px] text-stone-500 uppercase tracking-widest block mb-4 font-semibold">
                Explore Scenarios
              </span>
              <div className="flex flex-col gap-3">
                {realScenarios.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onStartDebate(item.prompt, 'standard')}
                    className="p-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-stone-300 group-hover:text-stone-100 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-stone-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        Inquire <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      {item.description}
                    </p>
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
                  <span>{new Date(session.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                    title="Save report"
                  >
                    <span className="material-symbols-outlined text-[14px]">bookmark</span>
                    <span>{saved ? 'Saved' : 'Save'}</span>
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
                {session.prompt}
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
              {session.finalOutput ? (
                <ReactMarkdown>{session.finalOutput}</ReactMarkdown>
              ) : isDeliberating && streamingRoundText ? (
                <div className="opacity-95">
                  <ReactMarkdown>{streamingRoundText}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-stone-400 text-xs sm:text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Evaluating assumptions and synthesis matrices...</span>
                </div>
              )}
            </article>

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
            {session.steps && session.steps.length > 0 && (
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
                      const humanRole = step.role === 'architect' ? 'Baseline hypothesis' : step.role === 'skeptic' ? 'Scrutiny objections' : 'Harmonized synthesis';
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
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#10141a] border-t border-white/5 z-10">
          <div className="max-w-3xl mx-auto w-full">
            <div className="bg-[#161a22] border border-white/5 rounded-xl p-3 shadow-lg focus-within:border-white/10 transition-all relative">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask follow-up query, challenge a synthesis claim..."
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
                      disabled={!inputText.trim() || isDeliberating}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                        inputText.trim() && !isDeliberating
                          ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer'
                          : 'bg-white/5 text-stone-500 cursor-not-allowed'
                      }`}
                      title="Send follow-up"
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
              evidenceGraph={session.evidenceGraph}
              researchMetrics={session.researchMetrics}
              sessionTitle={session.prompt}
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
    </div>
  );
};
