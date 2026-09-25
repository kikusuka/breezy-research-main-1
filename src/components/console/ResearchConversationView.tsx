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
  onStartDebate: (prompt: string, depth?: 'quick' | 'standard' | 'deep') => void;
  onSaveNote?: (title: string, content: string) => void;
  onExportMarkdown?: () => void;
  keys: ProviderKeyConfig;
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
}) => {
  const [inputText, setInputText] = useState('');
  const [researchDepth, setResearchDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
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

  // Auto-resize input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Scroll into view when response streams or session changes
  useEffect(() => {
    if (isDeliberating) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingRoundText, isDeliberating]);

  const handleSend = () => {
    if (!inputText.trim() || isDeliberating) return;
    const prompt = inputText.trim();
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

  // Determine actual sources from session
  const sources: EvidenceSource[] = session.evidenceGraph?.sourcesConsulted || [];
  const primarySources = sources.filter((s) => s.isPrimary);
  const claims = session.evidenceGraph?.claims || [];
  const contradictions = session.evidenceGraph?.contradictions || [];

  const hasContent = Boolean(session.finalOutput || (session.steps && session.steps.length > 0));
  const isInitialPrompt = !session.finalOutput && !isDeliberating && session.steps.length === 0;

  // Suggested research sparks
  const promptSparks = [
    {
      title: 'Ledger Engine: Kafka vs DuckDB',
      prompt: 'Is DuckDB micro-batching suitable for a high-frequency financial transaction ledger, or is Kafka mandatory for continuous consistency?',
    },
    {
      title: 'Vector Search: pgvector vs Pinecone',
      prompt: 'At 10M+ 1536-dimension embeddings, when does PostgreSQL pgvector degrade, and when is a dedicated vector index like Pinecone genuinely worth it?',
    },
    {
      title: 'Architecture: Go Monolith vs Microservices',
      prompt: 'Under what concrete load and team size thresholds does a modular Go monolith break down and justify migrating to Kubernetes microservices?',
    },
  ];

  // Natural language research state descriptions instead of mechanical codes
  const getSubtleResearchState = () => {
    if (activeRound === 1) return 'Exploring architectural models and core assertions...';
    if (activeRound === 2) return 'Challenging core assumptions and probing known edge cases...';
    if (activeRound === 3) return 'Validating findings against primary technical standards and document archives...';
    if (activeRound >= 4) return 'Consolidating conflicting claims and drafting research paper...';
    return 'Analyzing technical concepts across multi-model peer sessions...';
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] bg-[#10141a] text-stone-200">
      {/* Hidden File Input supporting Audio, Video, Image & Docs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.csv"
      />

      {/* Main Conversation Container */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-between">
        {/* If New / Blank Session: Centered Calm Research Input Hero */}
        {isInitialPrompt ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 sm:py-24 text-center w-full">
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-sans mb-3 font-semibold">
              Deep Technical Inquiry
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-100 font-normal tracking-tight mb-4 leading-tight">
              What are you researching?
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md mb-10">
              Enter an architectural tradeoff or technical hypothesis. Synthexis runs deep comparative analysis across frontier models and crawls live document archives.
            </p>

            {/* Premium, Focused, Single-Box Input Area */}
            <div className="w-full bg-[#161a22] border border-white/5 rounded-2xl p-4 shadow-xl text-left focus-within:border-white/15 transition-all">
              <div className="flex items-start gap-3">
                {/* Plus Icon to Add Multi-Modal files (Audio, Video, Images or Specs) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors shrink-0 mt-0.5"
                  title="Add Audio, Video, Image, or Doc Spec"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>

                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Compare pgvector vs. Pinecone at scale, evaluate ledger micro-batching..."
                    rows={2}
                    className="w-full bg-transparent text-stone-100 placeholder-stone-550 text-sm resize-none focus:outline-none leading-relaxed border-none focus:ring-0 p-0"
                  />
                </div>

                {/* Sleek, Always-Visible Enter/Send Button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0 mt-0.5 ${
                    inputText.trim()
                      ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer shadow-md'
                      : 'bg-white/5 text-stone-500 cursor-not-allowed'
                  }`}
                  title="Press Enter or Click to Inquire"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                </button>
              </div>

              {attachedFile && (
                <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-stone-300 w-fit">
                  <span className="material-symbols-outlined text-[16px] text-stone-400">attach_file</span>
                  <span className="font-medium">{attachedFile.name}</span>
                  <span className="text-stone-500">({attachedFile.size})</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-stone-500 hover:text-stone-200 ml-1 font-bold text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Input Action Controls (Reveal gracefully only when user begins typing) */}
              {isUserTyping && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-3">
                    {/* Research Depth Switcher */}
                    <div className="flex items-center gap-1 bg-black/25 p-0.5 rounded-lg border border-white/5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setResearchDepth('quick')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          researchDepth === 'quick'
                            ? 'bg-white/10 text-stone-100'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Fast answer using targeted research"
                      >
                        Quick
                      </button>
                      <button
                        type="button"
                        onClick={() => setResearchDepth('standard')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          researchDepth === 'standard'
                            ? 'bg-white/10 text-stone-100'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Investigates multiple sources and checks key claims"
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setResearchDepth('deep')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          researchDepth === 'deep'
                            ? 'bg-white/10 text-stone-100'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Explores multiple research angles and reconciles conflicting evidence"
                      >
                        Deep
                      </button>
                    </div>

                    <span className="text-[10px] text-stone-500 italic">
                      supports PDF, Image, Audio, Video verification
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Understated Query Suggestions */}
            <div className="w-full mt-12 flex flex-col gap-3">
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-sans font-semibold">
                Spark Ideas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {promptSparks.map((spark, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(spark.prompt);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 text-left transition-all group"
                  >
                    <span className="text-xs font-semibold text-stone-300 block mb-1 group-hover:text-stone-100 transition-colors">
                      {spark.title}
                    </span>
                    <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                      "{spark.prompt}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Research Article & Conversation Thread */
          <div className="flex flex-col gap-10 pb-36">
            {/* Header / Query Area */}
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
                    className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium"
                    title="Copy report markdown"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium"
                    title="Bookmark to local archive"
                  >
                    <span className="material-symbols-outlined text-[14px]">bookmark</span>
                    <span>{saved ? 'Saved' : 'Save'}</span>
                  </button>
                  {onExportMarkdown && (
                    <button
                      type="button"
                      onClick={onExportMarkdown}
                      className="flex items-center gap-1 hover:text-stone-200 transition-colors text-xs text-stone-400 font-medium"
                      title="Download markdown report"
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

            {/* 2. Fluid Real-Time Natural Research State Indicator */}
            {isDeliberating && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5 shadow-sm">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-stone-200">
                    {getSubtleResearchState()}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Running dialectic cross-checks and verifying evidence against original publications.
                  </span>
                </div>
              </div>
            )}

            {/* 3. The Central Research Report (Sleek Article Format) */}
            <article className="prose prose-invert max-w-none text-stone-200 leading-relaxed font-sans text-sm sm:text-[15px] space-y-4">
              {session.finalOutput ? (
                <ReactMarkdown>{session.finalOutput}</ReactMarkdown>
              ) : isDeliberating && streamingRoundText ? (
                <div className="opacity-90">
                  <ReactMarkdown>{streamingRoundText}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-stone-400 text-xs sm:text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Generating findings and constructing verification graph...</span>
                </div>
              )}
            </article>

            {/* 4. Points of Contention callout */}
            {contradictions.length > 0 && (
              <section className="p-5 rounded-xl bg-amber-500/[0.02] border border-amber-500/15">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2.5">
                  <span className="material-symbols-outlined text-[16px]">balance</span>
                  <span>Key Points of Contention Discovered</span>
                </div>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  The peer evaluation model runs discovered genuine tension or divergent guidelines among documented practices:
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
                          <span><strong>Synthexis Resolution:</strong> {contra.reconciledResolution}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Collapsible 'Research Trail' view (Step logs) */}
            {session.steps && session.steps.length > 0 && (
              <section className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setIsTrailExpanded(!isTrailExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-stone-400 text-[18px]">history_edu</span>
                    <span className="text-xs font-semibold text-stone-300">
                      Explore research details ({session.steps.length} steps analyzed)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-stone-400 text-[18px] transition-transform duration-200" style={{ transform: isTrailExpanded ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </button>
                
                {isTrailExpanded && (
                  <div className="p-4 border-t border-white/5 flex flex-col gap-4 bg-black/10">
                    {session.steps.map((step, idx) => {
                      const humanRole = step.role === 'architect' ? 'Initial perspective' : step.role === 'skeptic' ? 'Adversarial check' : 'Final synthesizer';
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
                            <span className="text-xs text-stone-550 italic mt-1">Analyzing perspective...</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* 6. Consulted Sources strip */}
            <div className="pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-stone-400 font-medium">Consulted Publications:</span>
                {sources.length > 0 ? (
                  sources.slice(0, 4).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedSource(src)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-xs text-stone-300 transition-colors flex items-center gap-1.5 font-medium"
                    >
                      <span className="text-stone-500 text-[10px]">[{i + 1}]</span>
                      <span className="truncate max-w-[130px]">{src.domain || src.title}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-stone-500 italic">Static peer-knowledge bases used</span>
                )}
                {sources.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowResearchTrail(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                  >
                    +{sources.length - 4} more
                  </button>
                )}
              </div>

              {/* Research Trail Slider Trigger */}
              <button
                type="button"
                onClick={() => setShowResearchTrail(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-stone-200 border border-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-stone-400">schema</span>
                <span>Research trail</span>
              </button>
            </div>

            <div ref={scrollEndRef} />
          </div>
        )}
      </div>

      {/* Floating Quiet Research Follow-Up Input (Only when an active conversation is loaded) */}
      {!isInitialPrompt && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#10141a] border-t border-white/5">
          <div className="max-w-3xl mx-auto w-full">
            <div className="bg-[#161a22] border border-white/5 rounded-xl p-3 shadow-lg focus-within:border-white/10 transition-all">
              <div className="flex items-start gap-3">
                {/* Plus Icon to Add Multi-Modal files inside follow up chat box */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors shrink-0 mt-0.5"
                  title="Add Audio, Video, Image, or Doc Spec"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>

                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask follow-up query, challenge a synthesis claim..."
                    rows={1}
                    className="w-full bg-transparent text-stone-100 placeholder-stone-550 text-sm resize-none focus:outline-none leading-relaxed border-none focus:ring-0 p-0"
                  />
                </div>

                {/* Always-Visible Enter/Send Button in follow up chat box */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isDeliberating}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0 mt-0.5 ${
                    inputText.trim() && !isDeliberating
                      ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer'
                      : 'bg-white/5 text-stone-500 cursor-not-allowed'
                  }`}
                  title="Press Enter or Click to Send"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                </button>
              </div>

              {attachedFile && (
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-stone-300 w-fit">
                  <span className="material-symbols-outlined text-[16px] text-stone-400">attach_file</span>
                  <span className="font-medium">{attachedFile.name}</span>
                  <span className="text-stone-500">({attachedFile.size})</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-stone-500 hover:text-stone-200 ml-1 font-bold text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Follow-up action tools (Reveal only when user begins typing follow-up) */}
              {isUserTyping && (
                <div className="flex items-center justify-between gap-3 pt-2 mt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-md border border-white/5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setResearchDepth('quick')}
                        className={`px-2 py-0.5 rounded transition-all font-medium ${
                          researchDepth === 'quick' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
                        }`}
                      >
                        Quick
                      </button>
                      <button
                        type="button"
                        onClick={() => setResearchDepth('standard')}
                        className={`px-2 py-0.5 rounded transition-all font-medium ${
                          researchDepth === 'standard' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
                        }`}
                      >
                        Standard
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

                    <span className="text-[10px] text-stone-500 italic">
                      supports PDF, Image, Audio, Video verification
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Drawer: "Audit Evidence Graph" */}
      {showResearchTrail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#12151c] border-l border-white/5 h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-semibold">
                  Evidence Provenance & Verification
                </span>
                <h3 className="text-xl font-serif font-normal text-stone-100 mt-1">
                  Research Evidence Graph
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResearchTrail(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors"
                aria-label="Close evidence viewer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Dynamic Evidence Graph View */}
            <EvidenceGraphView
              evidenceGraph={session.evidenceGraph}
              researchMetrics={session.researchMetrics}
              sessionTitle={session.prompt}
            />
          </div>
        </div>
      )}

      {/* Source Preview Popover */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg bg-[#161a22] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-stone-450 font-mono font-semibold">
                  {selectedSource.domain}
                </span>
                <h4 className="text-base font-semibold text-stone-100 mt-1 leading-snug">
                  {selectedSource.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="p-1 text-stone-400 hover:text-stone-100"
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
