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

  const handleSend = () => {
    if (!inputText.trim()) return;
    const prompt = inputText.trim();

    // Coding capabilities guard
    const isCodeQuery = /code|function|program|write|class|react|html|javascript|python|css|typescript|develop|git|repo/i.test(prompt);
    const hasGithub = Boolean(localStorage.getItem('synthexis_github_token'));
    if (isCodeQuery && !hasGithub) {
      alert("GitHub Integration Required: Synthesis coding capabilities are currently offline. Connect your GitHub Personal Access Token in Settings to mount your repositories, save code files, and run terminal simulations.");
      return;
    }

    setInputText('');
    setAttachedFile(null);
    onLaunchWorkspace(prompt, researchDepth);
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
    <div className="flex flex-col w-full min-h-screen bg-[#08090c] text-stone-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.csv"
      />

      {/* Hero Container */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-24 flex flex-col justify-center items-center text-center">
        {/* Understated Wordmark in elegant Serif */}
        <span className="font-serif italic text-4xl sm:text-5xl font-normal text-stone-100 tracking-tight mb-2">
          Synthesis
        </span>

        {/* Dynamic Factual Metric Greeting (No jargon, 100% verified state) */}
        <div className="font-mono text-[11px] text-[#d4ff33] tracking-wide mb-8 uppercase">
          {factualMetric}
        </div>

        {/* Minimalist Question Header */}
        <h1 className="text-xl sm:text-2xl font-serif text-stone-300 font-normal mb-8 tracking-wide">
          What are you curious about?
        </h1>

        {/* The Industrial Input Area */}
        <div className="w-full bg-[#0f1218] border border-white/5 rounded-2xl p-4 shadow-xl text-left focus-within:border-[#d4ff33]/40 transition-all max-w-xl">
          <div className="flex items-start gap-3">
            {/* Plus Icon to attach media/files */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors shrink-0 mt-0.5"
              title="Add Audio, Video, Image, or Doc Spec"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>

            {/* Focused text box */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, explore an idea, or give me something difficult to figure out..."
                rows={2}
                className="w-full bg-transparent text-stone-100 placeholder-stone-550 text-sm resize-none focus:outline-none leading-relaxed border-none focus:ring-0 p-0"
              />
            </div>

            {/* Industrial Acid Lime Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shrink-0 mt-0.5 ${
                inputText.trim()
                  ? 'bg-[#d4ff33] text-black hover:bg-[#d4ff33]/90 cursor-pointer shadow-md'
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

          {/* Quick Model Setup Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/5 font-sans">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setResearchDepth('solo');
                    const updated = { ...config, preset: 'fast' as const, roles: PRESET_ROLE_CONFIGS.fast };
                    setConfig(updated);
                    providerConfigService.saveConfig(updated);
                  }}
                  title="One model. Fastest response."
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    researchDepth === 'solo'
                      ? 'bg-[#d4ff33]/15 text-[#d4ff33] border border-[#d4ff33]/30 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Fast
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResearchDepth('standard');
                    const updated = { ...config, preset: 'balanced' as const, roles: PRESET_ROLE_CONFIGS.balanced };
                    setConfig(updated);
                    providerConfigService.saveConfig(updated);
                  }}
                  title="3 perspectives: Analyst + Critic + Synthesizer."
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    researchDepth === 'standard'
                      ? 'bg-[#d4ff33]/15 text-[#d4ff33] border border-[#d4ff33]/30 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResearchDepth('deep');
                    const updated = { ...config, preset: 'deep' as const, roles: PRESET_ROLE_CONFIGS.deep };
                    setConfig(updated);
                    providerConfigService.saveConfig(updated);
                  }}
                  title="4 stages: Analyst + Critic + Verifier + Synthesizer."
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    researchDepth === 'deep'
                      ? 'bg-[#d4ff33]/15 text-[#d4ff33] border border-[#d4ff33]/30 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Deep
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowModelSetup(!showModelSetup)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs transition-colors cursor-pointer border border-white/5 focus:border-[#d4ff33]"
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span className="font-mono text-[11px]">Model Setup</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>

            <span className="text-[10px] text-stone-400 font-mono">
              {researchDepth === 'solo' && '1 model · Fast'}
              {researchDepth === 'standard' && 'Analyst + Critic + Synthesizer'}
              {researchDepth === 'deep' && 'Analyst + Critic + Verifier + Synthesizer'}
            </span>
          </div>

          {/* Model Setup Popover Panel */}
          {showModelSetup && (
            <div className="mt-3 p-4 rounded-xl bg-[#0f1218] border border-white/10 shadow-2xl text-left flex flex-col gap-3 text-stone-200 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="font-sans text-xs font-bold text-stone-100">Model Setup per Role</span>
                <button
                  type="button"
                  onClick={() => setShowModelSetup(false)}
                  className="text-stone-400 hover:text-[#d4ff33] text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'architect', title: 'Analyst', desc: 'Builds argument' },
                  { key: 'skeptic', title: 'Critic', desc: 'Stress-tests claims' },
                  { key: 'verifier', title: 'Verifier', desc: 'Checks facts & math' },
                  { key: 'arbiter', title: 'Synthesizer', desc: 'Final resolution' },
                ].map((role) => {
                  const currentSeat = config.roles?.[role.key as keyof typeof config.roles] || { provider: 'gemini', model: 'gemini-3.8-flash' };
                  const modelsList = AVAILABLE_MODELS[currentSeat.provider] || [];

                  return (
                    <div key={role.key} className="p-2 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-stone-200">{role.title}</span>
                        <span className="font-mono text-[9px] text-stone-400 uppercase">{currentSeat.provider}</span>
                      </div>
                      <select
                        value={currentSeat.model}
                        onChange={(e) => {
                          const nextM = e.target.value;
                          const nextConfig = {
                            ...config,
                            preset: 'custom' as const,
                            roles: {
                              ...config.roles,
                              [role.key]: { ...currentSeat, model: nextM },
                            },
                          };
                          setConfig(nextConfig);
                          providerConfigService.saveConfig(nextConfig);
                        }}
                        className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-stone-200 outline-none focus:border-[#d4ff33] cursor-pointer"
                      >
                        {modelsList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quiet Footnote Actions */}
        <div className="flex items-center gap-6 text-xs text-stone-500 mt-6 font-sans">
          <button
            type="button"
            onClick={() => {
              setInputText('Compare pgvector vs. Pinecone index scaling...');
              if (textareaRef.current) textareaRef.current.focus();
            }}
            className="hover:text-stone-300 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">search</span>
            <span>Research deeply</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hover:text-stone-300 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">attach_file</span>
            <span>Attach document</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotes}
            className="hover:text-stone-300 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>Recent inquiries</span>
          </button>
        </div>

        {/* Explaining the mechanism in simple, direct human language */}
        <div className="w-full max-w-xl mt-16 text-left border-t border-white/5 pt-8">
          <span className="text-[10px] text-stone-500 uppercase tracking-widest block mb-4 font-semibold">
            How it works
          </span>
          <p className="text-xs text-stone-400 leading-relaxed mb-6">
            Synthesis translates complex technical questions into distinct perspectives, cross-checks assumptions across multiple frontier models, and verifies findings using verified documents and public datasets. The machinery stays quiet, giving you clear answers backed by original sources.
          </p>

          <span className="text-[10px] text-stone-500 uppercase tracking-widest block mb-4 font-semibold">
            Recent topics
          </span>
          <div className="flex flex-col gap-4">
            {realScenarios.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onLaunchWorkspace(item.prompt, 'standard')}
                className="p-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 text-left transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-stone-300 group-hover:text-stone-100 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-stone-500 flex items-center gap-1 group-hover:text-[#d4ff33] transition-colors">
                    Explore <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
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
    </div>
  );
};
