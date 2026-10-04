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
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
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
      const config = providerConfigService.getConfig();
      const keys = config.keys || {};
      
      const res = await apiClient.chatBreezy({
        prompt: userText,
        history: newHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        provider: 'gemini',
        model: selectedModel,
        apiKey: keys.gemini,
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
    <div className="relative w-full flex-1 flex flex-col justify-between bg-surface font-sans text-on-surface overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.md,.json,.csv,.py,.ts,.tsx,.js,.html,.css"
      />

      {/* Top Utility Indicator Bar */}
      <div className="relative z-10 w-full flex items-center justify-between px-space-md sm:px-space-lg py-space-sm border-b border-outline-variant/20 bg-surface-container-lowest/60 backdrop-blur-sm">
        <div className="inline-flex items-center gap-space-xs bg-surface-container-low px-space-md py-1 rounded-full shadow-sm border border-outline-variant/30">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          <span className="font-mono text-code-sm text-on-surface-variant tracking-tight">
            CANVAS // NEW_INQUIRY
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="p-space-xs rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              title="View History"
              aria-label="History"
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
            </button>
          )}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-space-xs rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              title="Configure Settings"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream or Empty State */}
      <div className="flex-1 overflow-y-auto px-space-md sm:px-space-lg py-space-md max-w-4xl mx-auto w-full flex flex-col justify-between">
        {messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center py-space-xl">
            {/* Emblem Cluster */}
            <div className="relative mb-space-lg flex items-center justify-center group">
              <div className="absolute w-28 h-28 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative w-16 h-16 rounded-full bg-surface-container-high border border-primary/30 flex items-center justify-center shadow-xl p-2">
                <img src="/breezy-logo.svg" alt="Breezy" className="w-9 h-9 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-tertiary-container flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[12px] text-on-tertiary-container font-bold">
                  bolt
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-code-sm mb-space-md shadow-sm border border-outline-variant/30">
              <span>BREEZY COGNITIVE KERNEL</span>
              <span className="text-outline">·</span>
              <span className="text-on-surface-variant">v2.4.2</span>
            </div>

            <h1 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight max-w-lg mb-space-xs">
              What are we investigating today?
            </h1>
            <p className="font-sans text-body-md text-on-surface-variant max-w-md mb-space-xl leading-relaxed">
              Multi-agent synthesis, verified citations, and counterfactual validation.
            </p>

            {/* Suggestion Chips */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-space-sm text-left">
              {suggestionStarters.map((starter) => (
                <button
                  key={starter.title}
                  type="button"
                  onClick={() => {
                    setInput(starter.query);
                    textareaRef.current?.focus();
                  }}
                  className="group p-space-md rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all text-left shadow-sm flex flex-col justify-between h-36 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{starter.icon}</span>
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px]">
                      arrow_forward
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {starter.title}
                    </h3>
                    <p className="font-sans text-label-sm text-outline mt-0.5 truncate">
                      {starter.meta}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-space-lg pb-space-lg w-full">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-space-sm sm:gap-space-md ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <img src="/breezy-logo.svg" alt="" className="w-5 h-5 object-contain" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-space-md py-space-sm max-w-[85%] sm:max-w-[78%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary font-medium rounded-tr-sm shadow-md'
                      : 'bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-tl-sm shadow-md'
                  }`}
                >
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-wrap font-sans text-body-md">{m.content}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-body-md font-sans leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                  <div
                    className={`mt-1 font-mono text-[10px] ${
                      m.role === 'user' ? 'text-on-primary/70 text-right' : 'text-outline text-left'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-space-md items-center text-on-surface-variant font-mono text-code-sm py-space-sm animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-container-high border border-primary/30 flex items-center justify-center">
                  <img src="/breezy-logo.svg" alt="" className="w-5 h-5 object-contain animate-spin" />
                </div>
                <span>Breezy is synthesizing perspectives...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Docked Input Composer Area */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-space-md pb-space-md">
        <div className="relative bg-surface-container rounded-3xl p-space-sm shadow-2xl border border-outline-variant/40 flex flex-col gap-space-xs transition-shadow">
          {/* Attached file banner */}
          {attachedFile && (
            <div className="flex items-center justify-between px-space-md py-1 rounded-xl bg-surface-container-high text-primary font-mono text-code-sm border border-primary/20">
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span className="truncate">{attachedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-outline hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Model selection & ground toggle */}
          <div className="flex items-center justify-between px-space-sm pb-space-xs pt-0.5">
            <div className="flex items-center gap-space-xs">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="h-8 px-space-sm bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant/30 rounded-full font-mono text-code-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="llama-3.3-70b">Llama 3.3 70B</option>
              </select>

              <button
                type="button"
                onClick={() => setGroundingEnabled((prev) => !prev)}
                className={`flex items-center gap-space-xs px-space-sm h-8 rounded-full border transition-all font-sans text-label-sm ${
                  groundingEnabled
                    ? 'bg-surface-container-high border-primary/30 text-primary'
                    : 'bg-surface-container-low border-outline-variant/30 text-outline'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                <span className="hidden sm:inline">Web Grounding</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    groundingEnabled ? 'bg-tertiary' : 'bg-outline'
                  }`}
                />
              </button>
            </div>

            {onStartDeepResearch && (
              <button
                type="button"
                onClick={() => {
                  if (input.trim()) onStartDeepResearch(input.trim());
                }}
                className="hidden sm:flex items-center gap-1 text-secondary hover:text-primary font-mono text-code-sm transition-colors"
                title="Transfer to Deep Multi-Model Research"
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>Deep Mode</span>
              </button>
            )}
          </div>

          {/* Text input area */}
          <div className="px-space-xs">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Breezy anything, or explore an inquiry..."
              rows={2}
              className="w-full bg-transparent resize-none font-sans text-body-md text-on-surface placeholder:text-outline px-space-sm py-space-xs focus:outline-none max-h-36 leading-relaxed selection:bg-primary-container selection:text-on-primary-container"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-space-xs px-space-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
                title="Attach Document"
                aria-label="Attach File"
              >
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className="w-10 h-10 rounded-full bg-primary hover:bg-secondary text-on-primary flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              title="Submit Inquiry"
              aria-label="Send"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">arrow_upward</span>
            </button>
          </div>
        </div>

        {/* Footnote Micro text */}
        <div className="w-full px-space-xs flex items-center justify-between text-outline font-sans text-label-sm pt-space-xs select-none">
          <span>Targeting zero-retention ephemeral scratchpad</span>
          <span className="hidden sm:inline">Return to send · Shift + Return for newline</span>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
