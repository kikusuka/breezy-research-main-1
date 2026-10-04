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
    <div className="relative min-h-full w-full overflow-x-hidden bg-surface text-on-surface">
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv,.py,.ts,.tsx,.js" />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-outline-variant/40 pb-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-outline"><span>Workspace</span><span className="text-outline-variant">/</span><span className="truncate text-primary">{currentRunTitle}</span></div>
            <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight sm:text-3xl">Research</h1>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">Explore a question, compare perspectives, challenge assumptions, and follow the evidence.</p>
          </div>
          <div className={`flex items-center gap-2 self-start border border-outline-variant/50 bg-surface-container-low px-2.5 py-1.5 font-mono text-[10px] md:self-auto ${isDeliberating ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isDeliberating ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
            {isDeliberating ? `Researching · ${formatDuration(elapsedSeconds)}` : 'Ready'}
          </div>
        </header>

        <section className="border border-outline-variant/50 bg-surface-container p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-outline-variant/40 pb-3">
            <div><span className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">New research</span><p className="mt-1 text-sm text-on-surface-variant">Start with a question or an idea you want tested.</p></div>
            <span className="hidden font-mono text-[10px] text-outline sm:block">Shift + Enter for newline</span>
          </div>
          <div className="mt-4 border border-outline-variant/45 bg-surface-container-low focus-within:border-primary/60">
            <textarea ref={textareaRef} value={inputText} onChange={(e)=>setInputText(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleInitiate();}}} rows={5} placeholder="What are you trying to figure out?" className="min-h-[150px] w-full resize-none bg-transparent px-4 py-4 text-base leading-7 outline-none placeholder:text-outline sm:px-5 sm:text-lg" />
            <div className="flex items-center justify-between border-t border-outline-variant/35 px-4 py-2.5 text-[10px] font-mono text-outline"><span>{inputText.length ? `${inputText.length} characters` : 'Ready for your question'}</span><span className="hidden sm:inline">Enter to start</span></div>
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 border border-outline-variant/50 bg-surface-container-low px-2.5 py-2 text-xs"><span className="material-symbols-outlined text-[17px] text-primary">speed</span><span className="text-outline">Depth</span><select value={researchDepth} onChange={(e)=>setResearchDepth(e.target.value as any)} className="bg-transparent font-medium outline-none"><option value="fast">Quick</option><option value="standard">Research</option><option value="exhaustive">Deep</option></select></label>
              <label className="flex items-center gap-2 border border-outline-variant/50 bg-surface-container-low px-2.5 py-2 text-xs"><span className="material-symbols-outlined text-[17px] text-tertiary">fact_check</span><span className="text-outline">Mode</span><select value={verificationMode} onChange={(e)=>setVerificationMode(e.target.value as any)} className="bg-transparent font-medium outline-none"><option value="cross-exam">Grounded</option><option value="consensus">Consensus</option><option value="adversarial">Stress test</option></select></label>
              <button type="button" onClick={()=>fileInputRef.current?.click()} className={`flex items-center gap-2 border px-2.5 py-2 text-xs transition-colors ${attachedFile ? 'border-primary/60 bg-primary/10 text-primary' : 'border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:border-outline'}`}><span className="material-symbols-outlined text-[17px]">attach_file</span><span className="max-w-[220px] truncate">{attachedFile ? attachedFile.name : 'Add file'}</span></button>
            </div>
            <button type="button" onClick={handleInitiate} disabled={isDeliberating} className="flex h-11 items-center justify-center gap-2 bg-primary px-5 text-xs font-semibold text-on-primary hover:bg-secondary disabled:opacity-40">{isDeliberating ? 'Researching...' : 'Start research'}<span className="material-symbols-outlined text-[17px]">{isDeliberating?'sync':'arrow_forward'}</span></button>
          </div>
        </section>

        {!session?.finalOutput && !isDeliberating && (
          <section className="grid gap-px border border-outline-variant/45 bg-outline-variant/45 lg:grid-cols-[1.15fr_.85fr]">
            <div className="bg-surface-container-low p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="font-headline text-lg font-semibold">Research pipeline</h2><p className="mt-1 text-sm text-on-surface-variant">Breezy works through these stages without making you manage them.</p></div><span className="font-mono text-[10px] uppercase tracking-wider text-outline">Ready</span></div>
              <div className="relative mt-6 pl-7"><div className="absolute bottom-2 left-2 top-2 w-px bg-outline-variant/70" />
                {[
                  ['01','Question','Understand the problem','help_outline'],['02','Exploration','Find relevant information','travel_explore'],['03','Perspectives','Develop independent views','lightbulb'],['04','Challenge','Look for weak assumptions','gavel'],['05','Evidence','Check supporting sources','fact_check'],['06','Answer','Bring the useful pieces together','auto_stories']
                ].map(([num,title,desc,icon],index)=>(
                  <div key={num} className="relative mb-5 flex items-start gap-3 last:mb-0"><div className={`absolute -left-7 top-0 flex h-5 w-5 items-center justify-center border bg-surface ${index===0?'border-primary/60 text-primary':'border-outline-variant text-outline'}`}><span className="material-symbols-outlined text-[14px]">{icon}</span></div><div><span className="text-sm font-semibold">{num}. {title}</span><p className="mt-0.5 text-xs text-on-surface-variant">{desc}</p></div></div>
                ))}
              </div>
            </div>
            <div className="bg-surface-container p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="font-headline text-lg font-semibold">Good places to start</h2><p className="mt-1 text-sm text-on-surface-variant">Use one as-is or edit it in the composer.</p></div><span className="material-symbols-outlined text-primary">north_east</span></div>
              <div className="mt-5 space-y-2">{sampleDirectives.map((d,idx)=><button key={d.domain} type="button" onClick={()=>handleApplyDirective(d.prompt)} className="group flex w-full items-start gap-3 border border-outline-variant/40 bg-surface-container-low p-3 text-left hover:bg-surface-container-high"><span className="font-mono text-[10px] text-primary">0{idx+1}</span><span className="min-w-0"><span className="block text-sm font-medium">{d.title}</span><span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">{d.desc}</span></span></button>)}</div>
            </div>
          </section>
        )}

        {isDeliberating && <section className="border border-primary/35 bg-surface-container-low p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pb-3"><div className="flex items-center gap-2 text-sm font-medium text-primary"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" />Stage {String(activeRound).padStart(2,'0')} · {streamingRole || 'Research'}</div><span className="font-mono text-[10px] text-outline">{liveUsage?.totalTokens ? liveUsage.totalTokens.toLocaleString()+' tokens' : 'Running'}</span></div><div className="mt-4 min-h-20 text-sm leading-6 text-on-surface-variant">{streamingRoundText ? streamingRoundText.slice(-1200) : 'Working through the research stages…'}</div></section>}

        {session?.finalOutput && (
          <>
            <section className="grid gap-px border border-outline-variant/45 bg-outline-variant/45 lg:grid-cols-[minmax(0,1fr)_320px]">
              <article className="min-w-0 bg-surface-container p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/40 pb-4"><div><div className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary">Answer</div><h2 className="mt-1 font-headline text-xl font-semibold sm:text-2xl">Breezy's answer</h2></div><span className="text-xs text-on-surface-variant">Research completed</span></div>
                <div className="prose prose-invert mt-6 max-w-none text-[15px] leading-7"><ReactMarkdown>{session.finalOutput}</ReactMarkdown></div>
                <div className="mt-7 flex flex-wrap gap-2 border-t border-outline-variant/40 pt-4">
                  <button type="button" onClick={handleCopy} className="flex h-9 items-center gap-1.5 border border-outline-variant/60 bg-surface-container-high px-3 text-xs hover:border-outline"><span className="material-symbols-outlined text-[16px]">{copied?'check':'content_copy'}</span>{copied?'Copied':'Copy'}</button>
                  {onExportMarkdown&&<button type="button" onClick={onExportMarkdown} className="flex h-9 items-center gap-1.5 border border-outline-variant/60 bg-surface-container-high px-3 text-xs hover:border-outline"><span className="material-symbols-outlined text-[16px]">download</span>Export</button>}
                  {onSaveNote&&<button type="button" onClick={handleSave} className="flex h-9 items-center gap-1.5 border border-outline-variant/60 bg-surface-container-high px-3 text-xs hover:border-outline"><span className="material-symbols-outlined text-[16px]">{saved?'bookmark_added':'bookmark'}</span>{saved?'Saved':'Save'}</button>}
                  {onPinToCanvas&&<button type="button" onClick={()=>onPinToCanvas(session)} className="flex h-9 items-center gap-1.5 border border-outline-variant/60 bg-surface-container-high px-3 text-xs hover:border-outline"><span className="material-symbols-outlined text-[16px]">draw</span>Canvas</button>}
                  {onOpenInIde&&<button type="button" onClick={()=>onOpenInIde(session)} className="flex h-9 items-center gap-1.5 border border-outline-variant/60 bg-surface-container-high px-3 text-xs hover:border-outline"><span className="material-symbols-outlined text-[16px]">terminal</span>Build</button>}
                  <button type="button" onClick={()=>setShowEvidenceGraph(v=>!v)} className="ml-auto flex h-9 items-center gap-1.5 text-xs text-primary"><span className="material-symbols-outlined text-[16px]">{showEvidenceGraph?'expand_less':'account_tree'}</span>{showEvidenceGraph?'Hide graph':'Evidence graph'}</button>
                </div>
                {showEvidenceGraph&&session.evidenceGraph&&<div className="mt-5 border-t border-outline-variant/40 pt-5"><EvidenceGraphView evidenceGraph={session.evidenceGraph} researchMetrics={session.researchMetrics}/></div>}
              </article>
              <aside className="bg-surface-container-low p-5 sm:p-6">
                <div className="border-b border-outline-variant/40 pb-4"><div className="text-[10px] font-mono uppercase tracking-[0.14em] text-outline">Research stages</div><div className="mt-1 text-sm font-semibold">{session.status==='completed'?'Complete':'In progress'}</div></div>
                <div className="relative mt-5 pl-6"><div className="absolute bottom-2 left-2 top-2 w-px bg-outline-variant/70" />
                  {[
                    ['01','Question'],['02','Exploration'],['03','Perspectives'],['04','Challenge'],['05','Evidence'],['06','Answer']
                  ].map(([num,title],index)=>{const done=session.status==='completed'||index<activeRound;const active=isDeliberating&&index===activeRound-1;return <div key={num} className="relative mb-4 last:mb-0"><span className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-surface-container-low ${active?'bg-primary':done?'bg-tertiary':'bg-surface-container-highest'}`} /><div className="flex items-center justify-between gap-2"><span className={`text-xs font-medium ${active?'text-primary':done?'text-on-surface':'text-on-surface-variant'}`}>{num}. {title}</span><span className="material-symbols-outlined text-[15px] text-outline">{done?'check':active?'more_horiz':'radio_button_unchecked'}</span></div></div>;})}
                </div>
              </aside>
            </section>

            {sources.length>0&&<section className="border border-outline-variant/45 bg-surface-container-low p-5 sm:p-6"><div className="flex items-end justify-between gap-3 border-b border-outline-variant/40 pb-3"><div><div className="text-[10px] font-mono uppercase tracking-[0.14em] text-tertiary">Evidence</div><h3 className="mt-1 font-headline text-lg font-semibold">Sources</h3></div><span className="text-xs text-on-surface-variant">{sources.length} source{sources.length===1?'':'s'}</span></div><div className="mt-4 grid gap-px border border-outline-variant/40 bg-outline-variant/40 md:grid-cols-2">{sources.map((src:EvidenceSource,idx:number)=><a key={src.id||idx} href={src.url} target="_blank" rel="noopener noreferrer" className="group min-w-0 bg-surface-container p-4 hover:bg-surface-container-high"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-medium group-hover:text-primary">{src.title||src.url}</div><div className="mt-1 truncate font-mono text-[10px] text-outline">{src.domain||src.url}</div></div><span className="material-symbols-outlined text-[17px] text-outline group-hover:text-primary">north_east</span></div></a>)}</div></section>}

            {(proposals.length>0||challenges.length>0)&&<section className="grid gap-px border border-outline-variant/45 bg-outline-variant/45 md:grid-cols-2"><div className="bg-surface-container p-5 sm:p-6"><div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3"><span className="material-symbols-outlined text-[18px] text-primary">lightbulb</span><h3 className="text-sm font-semibold">Perspectives</h3></div><div className="mt-4 space-y-2">{proposals.map((p,idx)=><div key={idx} className="border border-outline-variant/40 bg-surface-container-low p-3"><div className="font-mono text-[10px] text-secondary">Perspective {idx+1}</div><p className="mt-1 line-clamp-5 text-xs leading-5 text-on-surface-variant">{p.content}</p></div>)}</div></div><div className="bg-surface-container-low p-5 sm:p-6"><div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3"><span className="material-symbols-outlined text-[18px] text-secondary">gavel</span><h3 className="text-sm font-semibold">Challenges</h3></div><div className="mt-4 space-y-2">{challenges.length===0?<div className="border border-outline-variant/40 bg-surface-container p-3 text-xs text-on-surface-variant">No challenges were returned for this run.</div>:challenges.map((item,idx)=><div key={idx} className="border border-outline-variant/40 bg-surface-container p-3"><div className="font-mono text-[10px] text-tertiary">Challenge {idx+1}</div><p className="mt-1 line-clamp-5 text-xs leading-5 text-on-surface-variant">{item.content}</p></div>)}</div></div></section>}
          </>
        )}
      </div>
      {toastMessage&&<div className="fixed bottom-4 right-4 z-50 border border-outline-variant/60 bg-surface-container-high px-4 py-3 text-xs shadow-[0_12px_32px_-8px_rgba(0,0,0,.65)]"><span className="mr-2 inline-flex align-middle material-symbols-outlined text-[16px] text-primary">info</span>{toastMessage}</div>}
    </div>
  );
};
