import React, { useState, useRef, useEffect } from 'react';
import { EvidenceGraphView } from './EvidenceGraphView';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUserTyping = inputText.trim().length > 0;

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
      alert("GitHub Integration Required: Synthexis coding capabilities are currently offline. Connect your GitHub Personal Access Token in Settings to mount your repositories, save code files, and run terminal simulations.");
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
    <div className="flex flex-col w-full min-h-screen bg-[#10141a] text-stone-200">
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
        {/* Understated Wordmark */}
        <span className="font-serif text-3xl sm:text-4xl font-normal text-stone-100 tracking-tight mb-8">
          Synthexis
        </span>

        {/* Minimalist Question Header */}
        <h1 className="text-xl sm:text-2xl font-serif text-stone-300 font-normal mb-8 tracking-wide">
          What are you curious about?
        </h1>

        {/* The Weirdly Simple Input Area */}
        <div className="w-full bg-[#161a22] border border-white/5 rounded-2xl p-4 shadow-xl text-left focus-within:border-white/10 transition-all max-w-xl">
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

            {/* Standard enter button */}
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

          {/* Depth selection (Appears smoothly when typing) */}
          {isUserTyping && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/25 p-0.5 rounded-lg border border-white/5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setResearchDepth('solo')}
                    title="One model. Fastest response."
                    className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      researchDepth === 'solo'
                        ? 'bg-white/10 text-stone-100'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Solo
                  </button>
                  <button
                    type="button"
                    onClick={() => setResearchDepth('standard')}
                    title="Several perspectives + web search sources."
                    className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      researchDepth === 'standard'
                        ? 'bg-white/10 text-stone-100'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Research
                  </button>
                  <button
                    type="button"
                    onClick={() => setResearchDepth('deep')}
                    title="More models + rigorous verification."
                    className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      researchDepth === 'deep'
                        ? 'bg-white/10 text-stone-100'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Deep
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  {researchDepth === 'solo' && 'One model. Fastest.'}
                  {researchDepth === 'standard' && 'Several perspectives + web sources.'}
                  {researchDepth === 'deep' && 'More models + rigorous verification.'}
                </span>
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
            Synthexis translates complex technical questions into distinct perspectives, cross-checks assumptions across multiple frontier models, and verifies findings using verified documents and public datasets. The machinery stays quiet, giving you clear answers backed by original sources.
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
                  <span className="text-[10px] text-stone-500 flex items-center gap-1">
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
