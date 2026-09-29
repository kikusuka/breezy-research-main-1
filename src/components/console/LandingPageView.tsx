import React, { useState, useRef, useEffect } from 'react';
import { EvidenceGraphView } from './EvidenceGraphView';
import { providerConfigService, AVAILABLE_MODELS, PRESET_ROLE_CONFIGS } from '../../services/providerConfigService';
import { loadSessions } from '../../services/sessionStorage';

interface LandingPageViewProps {
  onLaunchWorkspace: (prompt?: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onOpenNotes: () => void;
  onOpenModels: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLaunchWorkspace,
  onOpenNotes,
  onOpenModels,
}) => {
  const [inputText, setInputText] = useState('');
  const [researchDepth, setResearchDepth] = useState<'solo' | 'standard' | 'deep'>('standard');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [showModelSetup, setShowModelSetup] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [config, setConfig] = useState(() => providerConfigService.getConfig());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUserTyping = inputText.trim().length > 0;

  // Real, concrete factual operational state calculations
  const [factualMetric, setFactualMetric] = useState('0 research streams · no active sessions');

  useEffect(() => {
    try {
      const sessions = loadSessions();
      const count = sessions.length;
      if (count === 0) {
        setFactualMetric('0 active research streams');
      } else {
        const lastActiveTime = sessions[0].updatedAt || sessions[0].createdAt || Date.now();
        const diffMs = Date.now() - lastActiveTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        let timeStr = 'active just now';
        if (diffHours >= 24) {
          const days = Math.floor(diffHours / 24);
          timeStr = `last active ${days}d ago`;
        } else if (diffHours >= 1) {
          timeStr = `last active ${diffHours}h ago`;
        }
        setFactualMetric(`${count} research stream${count > 1 ? 's' : ''} · ${timeStr}`);
      }
    } catch {
      setFactualMetric('0 active research streams');
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const [fileContent, setFileContent] = useState<string>('');

  const handleSend = () => {
    if (!inputText.trim() && !fileContent) return;
    let fullPrompt = inputText.trim();
    if (fileContent) {
      fullPrompt += `\n\n--- ATTACHED FILE CONTEXT (${attachedFile?.name}) ---\n${fileContent}`;
    }

    // Only guard explicit GitHub repo mutations
    const isGithubRepoOp = /push to repo|commit to repo|open pull request|create pull request|mount github repo/i.test(fullPrompt);
    const hasGithub = Boolean(localStorage.getItem('synthexis_github_token') || localStorage.getItem('breezy_github_token'));
    if (isGithubRepoOp && !hasGithub) {
      showToast("GitHub Token Required: Direct repository commits require a Personal Access Token in Settings.");
      return;
    }

    setInputText('');
    setAttachedFile(null);
    setFileContent('');
    onLaunchWorkspace(fullPrompt, researchDepth);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          setFileContent(text.slice(0, 12000)); // Cap to prevent token limit overflow
        }
      };
      reader.readAsText(file);
    }
  };

  // Sample real engineering topics with clean descriptions (No AI hype language)
  const realScenarios = [
    {
      title: 'PostgreSQL + pgvector vs. Standalone Pinecone',
      description: 'Evaluating architectural performance trade-offs, vacuuming locks, and indexing overhead when storing 10M+ embeddings.',
      prompt: 'At 10M+ 1536-dimension embeddings, when does PostgreSQL pgvector degrade, and when is a dedicated vector index like Pinecone genuinely worth it?',
    },
    {
      title: 'Kafka Streams vs. DuckDB for Ledger Ingestion',
      description: 'Comparing write-ahead transactional logs with analytical micro-batching for continuous financial ledger consistency.',
      prompt: 'Is DuckDB micro-batching suitable for a high-frequency financial transaction ledger, or is Kafka mandatory for continuous consistency?',
    },
    {
      title: 'Modular Go Monolith vs. Kubernetes Microservices',
      description: 'Understanding team size and request load inflection points where splitting a single codebase adds positive value.',
      prompt: 'Under what concrete load and team size thresholds does a modular Go monolith break down and justify migrating to Kubernetes microservices?',
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-stone-950 text-stone-200 selection:bg-stone-100 selection:text-stone-950">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.csv"
      />

      {/* Main Search Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 sm:py-32">
        <div className="w-full max-w-2xl text-center space-y-12">
          {/* Brand & Context */}
          <div className="space-y-4">
            <span className="font-display text-5xl sm:text-6xl lg:text-7xl text-stone-100 tracking-tight">
              Synthexis
            </span>
            <div className="flex items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-stone-500">
              <span className="w-1 h-1 rounded-full bg-stone-700"></span>
              <span>{factualMetric}</span>
              <span className="w-1 h-1 rounded-full bg-stone-700"></span>
            </div>
          </div>

          {/* Inquiry Input Area */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-stone-800 to-stone-900 rounded-[2rem] opacity-20 group-focus-within:opacity-40 transition-opacity blur-sm"></div>
            <div className="relative bg-stone-900/40 border border-stone-800/60 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl focus-within:border-stone-600 transition-all">
              <div className="flex flex-col gap-4">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Execute research protocol or technical inquiry..."
                  rows={2}
                  className="w-full bg-transparent text-stone-100 placeholder-stone-700 text-lg sm:text-xl font-serif italic resize-none focus:outline-none leading-relaxed border-none focus:ring-0 p-0 uppercase tracking-tighter"
                />

                <div className="flex items-center justify-between pt-4 border-t border-stone-800/40">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-600 hover:text-stone-200 hover:bg-stone-800 transition-all border border-stone-800/60"
                      title="Attach Reference Material"
                    >
                      <span className="material-symbols-outlined text-[18px]">attach_file</span>
                    </button>
                    
                    <div className="h-6 w-px bg-stone-800 mx-1"></div>

                    <div className="flex items-center gap-1 bg-stone-950/40 p-1 rounded-lg border border-stone-800/60">
                      {(['solo', 'standard', 'deep'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setResearchDepth(d);
                            const presetKey = d === 'solo' ? 'fast' : d === 'standard' ? 'balanced' : 'deep';
                            const updated = { ...config, preset: presetKey as any, roles: PRESET_ROLE_CONFIGS[presetKey] };
                            setConfig(updated);
                            providerConfigService.saveConfig(updated);
                          }}
                          className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            researchDepth === d
                              ? 'bg-stone-100 text-stone-950'
                              : 'text-stone-600 hover:text-stone-300'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.25em] transition-all ${
                      inputText.trim()
                        ? 'bg-stone-100 text-stone-950 hover:bg-white cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95'
                        : 'bg-stone-900 text-stone-700 cursor-not-allowed border border-stone-800/40'
                    }`}
                  >
                    <span>Execute</span>
                    <span className="material-symbols-outlined text-[14px]">east</span>
                  </button>
                </div>
              </div>

              {attachedFile && (
                <div className="absolute -bottom-10 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-[10px] text-stone-400">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span className="font-medium truncate max-w-[120px]">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="hover:text-stone-200">×</button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[10px] font-mono uppercase tracking-[0.15em] text-stone-600">
            <button onClick={() => onOpenNotes()} className="hover:text-stone-300 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">auto_stories</span>
              Access Archives
            </button>
            <button onClick={() => onOpenModels()} className="hover:text-stone-300 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">hub</span>
              Configure Matrix
            </button>
            <span className="flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-[14px]">keyboard_command_key</span>
              ⌘K Search
            </span>
          </div>
        </div>

        {/* Feature Grid: Museum Catalog Style */}
        <div className="w-full max-w-4xl mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-3 pb-4 border-b border-stone-800/60 flex items-center justify-between">
            <span className="font-display text-xl text-stone-400 tracking-tight italic">Recommended Inquiries</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-stone-600">Technical Index</span>
          </div>
          
          {realScenarios.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onLaunchWorkspace(item.prompt, 'standard')}
              className="group text-left space-y-4 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[4/3] bg-stone-900/40 border border-stone-800/60 rounded-sm flex items-center justify-center overflow-hidden relative grayscale hover:grayscale-0 transition-all">
                 <div className="absolute inset-0 bg-stone-950/40 group-hover:bg-transparent transition-colors"></div>
                 <span className="font-display text-7xl text-stone-800 opacity-20 group-hover:opacity-40 transition-opacity">0{idx + 1}</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-lg text-stone-200 group-hover:text-white transition-colors">{item.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 italic font-serif">
                  {item.description}
                </p>
                <div className="pt-2 flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-stone-600 group-hover:text-stone-400">
                  <span>Run Analysis</span>
                  <span className="material-symbols-outlined text-[12px]">east</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Mechanism / About section: Institutional Footer */}
        <div className="w-full max-w-2xl mt-48 py-16 border-t border-stone-800/60 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">The Synthesis Pipeline</span>
              <p className="text-sm text-stone-400 leading-relaxed font-serif italic">
                A multi-model dialectic architecture designed to identify technical contradictions, stress-test architectural claims, and synthesize high-integrity resolutions.
              </p>
            </div>
            <div className="space-y-4 text-right sm:text-left">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">Evidence & Verification</span>
              <p className="text-sm text-stone-400 leading-relaxed font-serif italic text-right">
                Every claim is cross-referenced with real-time documentation and public specifications. Zero artificial consensus clamping.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Style Overlay */}
      <div className="fixed inset-0 pointer-events-none border-[1.5rem] border-stone-950/20 z-10"></div>
    </div>
  );
};
