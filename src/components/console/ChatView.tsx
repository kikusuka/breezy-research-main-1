import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../../services/apiClient';
import { providerConfigService } from '../../services/providerConfigService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: { title: string; url: string }[];
}

interface ChatViewProps {
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  onStartDeepResearch?: (prompt: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onOpenHistory,
  onOpenSettings,
  onStartDeepResearch,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('breezy_fast_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groundingEnabled, setGroundingEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState(() => providerConfigService.getActiveRoutableModel()?.model || '');
  const [selectedProvider, setSelectedProvider] = useState(() => providerConfigService.getActiveRoutableModel()?.provider || '');
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('breezy_fast_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    let userText = input.trim();
    if (attachedFile) {
      userText += `\n\n--- [Attached File: ${attachedFile.name}] ---\n${attachedFile.content}\n--- [End File] ---`;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const active = providerConfigService.getActiveRoutableModel();
      if (!active) {
        showToast('No model connected. Connect a provider in Models first.');
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        return;
      }
      setSelectedProvider(active.provider);
      setSelectedModel(active.model);
      const config = providerConfigService.getConfig();
      const keys = config.keys || {};

      const res = await apiClient.chatBreezy({
        prompt: userText,
        history: newHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        provider: active.provider as any,
        model: active.model,
        apiKey: keys[active.provider],
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.text || 'Synthesis complete.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `**Error**: ${err.message || 'Unable to generate response. Please check your model configuration in Settings.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';
      setAttachedFile({ name: file.name, content: content.slice(0, 15000) });
      showToast(`Attached ${file.name}`);
    };
    reader.readAsText(file);
  };

  const suggestionStarters = [
    {
      title: 'Evaluate sodium-ion grid storage',
      meta: 'Techno-economic modeling · ArXiv',
      icon: 'bolt',
      query: 'Evaluate commercial viability and degradation parameters of sodium-ion grid storage vs LFP batteries.',
    },
    {
      title: 'Synthesize FTC cloud lock antitrust',
      meta: 'Legal precedent · Policy challenge',
      icon: 'gavel',
      query: 'Synthesize recent FTC antitrust arguments regarding cloud egress fees and hyperscaler lock-in.',
    },
    {
      title: 'Stress-test LLM reasoning benchmarks',
      meta: 'Verification suite · Contradictions',
      icon: 'biotech',
      query: 'Stress-test optimistic assumptions in current LLM reasoning benchmarks like ARC-AGI and GPQA.',
    },
  ];

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col overflow-hidden bg-surface text-on-surface">
      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv,.py,.ts,.tsx,.js,.html,.css" />

      <main className="relative flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden bg-surface">
        {messages.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-36 pt-12 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-3xl flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container">
                <img src="/breezy-logo.svg" alt="Breezy" className="h-8 w-8 object-contain" />
              </div>

              <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.16em] text-primary">Breezy Chat</div>
              <h1 className="max-w-2xl font-headline text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">What would you like to talk through?</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant sm:text-base">
                Ask directly, work through an idea, or send the question to deeper research.
              </p>

              <div className="mt-8 grid w-full gap-2 md:grid-cols-3">
                {suggestionStarters.map((starter, idx) => (
                  <button
                    key={starter.title}
                    type="button"
                    onClick={() => {
                      setInput(starter.query);
                      textareaRef.current?.focus();
                    }}
                    className="group min-h-[132px] border border-outline-variant/50 bg-surface-container p-4 text-left transition-colors hover:border-outline hover:bg-surface-container-high"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-primary">0{idx + 1}</span>
                      <span className="material-symbols-outlined text-[17px] text-outline group-hover:text-primary">arrow_outward</span>
                    </div>
                    <div className="mt-8">
                      <h2 className="text-sm font-semibold text-on-surface group-hover:text-primary">{starter.title}</h2>
                      <p className="mt-1 text-[11px] leading-5 text-on-surface-variant">{starter.meta}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-6 pb-40">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container">
                      <img src="/breezy-logo.svg" alt="" className="h-4 w-4 object-contain" />
                    </div>
                  )}
                  <div className={`max-w-[88%] sm:max-w-[78%] ${m.role === 'user' ? 'bg-primary text-on-primary' : 'border border-outline-variant/45 bg-surface-container-low text-on-surface'} px-4 py-3 leading-6`}>
                    {m.role === 'user' ? (
                      <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                    <div className={`mt-2 font-mono text-[9px] ${m.role === 'user' ? 'text-on-primary/65' : 'text-outline'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container">
                    <img src="/breezy-logo.svg" alt="" className="h-4 w-4 animate-pulse object-contain" />
                  </div>
                  <span>Thinking…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="pointer-events-auto mx-auto w-full max-w-4xl px-4 pb-3 sm:px-6">
            <div className="border border-outline-variant/55 bg-surface-container p-2 shadow-[0_12px_32px_-8px_rgba(0,0,0,.65)]">
              {attachedFile && (
                <div className="mb-2 flex items-center justify-between border border-primary/25 bg-surface-container-high px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-primary">
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span className="truncate">{attachedFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setAttachedFile(null)} className="text-outline hover:text-error">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 border-b border-outline-variant/35 px-2 pb-2">
                <div className="flex h-8 items-center gap-2 border border-outline-variant/45 bg-surface-container-low px-2.5 text-[11px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-primary">memory</span>
                  <span className="max-w-[220px] truncate">{selectedModel || 'No model connected'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGroundingEnabled((prev) => !prev)}
                  className={`flex h-8 items-center gap-1.5 border px-2.5 text-[11px] transition-colors ${groundingEnabled ? 'border-primary/35 bg-primary/5 text-primary' : 'border-outline-variant/45 bg-surface-container-low text-outline'}`}
                >
                  <span className="material-symbols-outlined text-[15px]">travel_explore</span>
                  <span className="hidden sm:inline">Web grounding</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${groundingEnabled ? 'bg-tertiary' : 'bg-outline'}`} />
                </button>
                {onStartDeepResearch && (
                  <button
                    type="button"
                    onClick={() => input.trim() && onStartDeepResearch(input.trim())}
                    className="ml-auto hidden items-center gap-1 text-[11px] text-secondary hover:text-primary sm:flex"
                  >
                    <span className="material-symbols-outlined text-[15px]">psychology</span>
                    Deep research
                  </button>
                )}
              </div>

              <div className="px-2 py-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Breezy…"
                  rows={2}
                  className="max-h-36 w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 text-on-surface outline-none placeholder:text-outline"
                />
              </div>

              <div className="flex items-center justify-between px-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-9 w-9 items-center justify-center text-outline hover:bg-surface-container-high hover:text-primary" aria-label="Attach file">
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-35"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-outline">
              <span>Conversation saved locally</span>
              <span className="hidden sm:inline">Enter to send · Shift + Enter for newline</span>
            </div>
          </div>
        </div>
      </main>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 border border-outline-variant/60 bg-surface-container-high px-4 py-3 text-xs text-on-surface shadow-[0_12px_32px_-8px_rgba(0,0,0,.65)]">
          <span className="mr-2 inline-flex align-middle material-symbols-outlined text-[16px] text-primary">info</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
};