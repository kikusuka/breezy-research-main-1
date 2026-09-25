import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { providerConfigService } from '../../services/providerConfigService';

interface BreezyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pending?: boolean;
}

interface BreezyChat {
  id: string;
  title: string;
  messages: BreezyMessage[];
  createdAt: string;
}

interface BreezyWorkspaceProps {
  onOpenSettings: () => void;
  toast: (msg: string) => void;
}

export const BreezyWorkspace: React.FC<BreezyWorkspaceProps> = ({
  onOpenSettings,
  toast,
}) => {
  const [chats, setChats] = useState<Record<string, BreezyChat>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chats from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('breezy:chats');
      if (raw) {
        const parsed = JSON.parse(raw);
        setChats(parsed);
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          setActiveId(keys[0]);
        }
      }
    } catch {}
  }, []);

  // Save chats to localStorage
  const saveChats = (nextChats: Record<string, BreezyChat>) => {
    setChats(nextChats);
    try {
      localStorage.setItem('breezy:chats', JSON.stringify(nextChats));
    } catch {}
  };

  const getActiveChat = (): BreezyChat | null => {
    if (!activeId || !chats[activeId]) return null;
    return chats[activeId];
  };

  const createNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: BreezyChat = {
      id: newId,
      title: 'New chat',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    const next = { [newId]: newChat, ...chats };
    saveChats(next);
    setActiveId(newId);
    toast('Started a new weightless chat.');
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = { ...chats };
    delete next[id];
    saveChats(next);
    if (activeId === id) {
      const remaining = Object.keys(next);
      setActiveId(remaining.length ? remaining[0] : null);
    }
  };

  const clearChat = () => {
    if (!activeId) return;
    updateCurrentChat((chat) => ({
      ...chat,
      messages: [],
    }));
    toast('Conversation cleared.');
  };

  const updateCurrentChat = (updater: (chat: BreezyChat) => BreezyChat) => {
    if (!activeId || !chats[activeId]) return;
    const next = {
      ...chats,
      [activeId]: updater(chats[activeId]),
    };
    saveChats(next);
  };

  const handleSend = async () => {
    if (!inputVal.trim()) return;
    let currentId = activeId;
    let nextChats = { ...chats };

    if (!currentId || !chats[currentId]) {
      currentId = `chat-${Date.now()}`;
      const newChat: BreezyChat = {
        id: currentId,
        title: inputVal.trim().slice(0, 30),
        messages: [],
        createdAt: new Date().toISOString(),
      };
      nextChats = { [currentId]: newChat, ...chats };
      setActiveId(currentId);
    }

    const userMsg: BreezyMessage = {
      role: 'user',
      content: inputVal.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const targetChat = nextChats[currentId];
    const isFirstMsg = targetChat.messages.length === 0;
    const updatedMessages = [...targetChat.messages, userMsg];

    const updatedChat: BreezyChat = {
      ...targetChat,
      title: isFirstMsg ? inputVal.trim().slice(0, 30) : targetChat.title,
      messages: updatedMessages,
    };

    const finalChats = { ...nextChats, [currentId]: updatedChat };
    saveChats(finalChats);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    // Call real AI endpoint (uses canonical providerConfigService, falling back to server key)
    setIsThinking(true);
    const canonicalConfig = providerConfigService.getConfig();
    let provider = canonicalConfig.defaultProvider || 'gemini';
    let model = canonicalConfig.defaultModel || 'gemini-3.8-flash';
    let apiKey = providerConfigService.getKey(provider) || '';

    // Legacy override check if present
    try {
      const byokRaw = localStorage.getItem('synap:provider');
      if (byokRaw) {
        const parsed = JSON.parse(byokRaw);
        if (parsed.key) apiKey = parsed.key;
        if (parsed.model) model = parsed.model;
        if (parsed.type) provider = parsed.type;
      }
    } catch {}

    const aiPlaceholder: BreezyMessage = {
      role: 'assistant',
      content: '',
      timestamp: 'Just now',
      pending: true,
    };

    saveChats({
      ...finalChats,
      [currentId]: {
        ...updatedChat,
        messages: [...updatedMessages, aiPlaceholder],
      },
    });

    try {
      const data = await apiClient.chatBreezy(
        {
          prompt: userMsg.content,
          history: updatedMessages.slice(-6),
          provider,
          model,
          apiKey: apiKey || undefined,
        },
        {
          onNotice: (msg) => toast(msg),
        }
      );

      const aiText = data.text || 'Synthesis complete.';

      saveChats({
        ...finalChats,
        [currentId]: {
          ...updatedChat,
          messages: [
            ...updatedMessages,
            {
              role: 'assistant',
              content: aiText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        },
      });
    } catch (e: any) {
      saveChats({
        ...finalChats,
        [currentId]: {
          ...updatedChat,
          messages: [
            ...updatedMessages,
            {
              role: 'assistant',
              content: `⚠️ Generation Note: ${e.message}`,
              timestamp: 'Just now',
            },
          ],
        },
      });
    } finally {
      setIsThinking(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  const handleMicToggle = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast('Speech recognition not supported in this browser.');
      return;
    }
    if (isMicActive) {
      setIsMicActive(false);
    } else {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.onstart = () => setIsMicActive(true);
      rec.onend = () => setIsMicActive(false);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setInputVal(text);
      };
      rec.start();
    }
  };

  const activeChat = getActiveChat();

  return (
    <div className="flex-1 flex flex-col w-full relative min-h-screen bg-[#090d16] text-slate-100 antialiased font-sans">
      {/* Parallax Atmospheric Background Backing Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-gradient-to-b from-sky-500/10 via-indigo-950/15 to-transparent blur-3xl pointer-events-none z-0 rounded-full"></div>
      <div className="absolute top-96 right-16 w-80 h-80 bg-sky-500/5 blur-3xl pointer-events-none z-0 rounded-full"></div>
      <div className="absolute top-[640px] left-10 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none z-0 rounded-full"></div>

      {/* Main Container Stage */}
      <div className="flex-1 flex flex-col w-full z-10">
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full pt-24 sm:pt-28 pb-48 scroll-smooth"
        >
          <div className="w-full max-w-[768px] mx-auto px-4 sm:px-6 flex flex-col gap-6">
            {!activeChat || activeChat.messages.length === 0 ? (
              /* Welcome Hero Card */
              <section className="relative overflow-hidden rounded-xl bg-slate-900/50 backdrop-blur-2xl p-6 sm:p-8 border border-sky-500/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col items-center text-center">
                <div className="relative mb-4 group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500 via-cyan-400 to-sky-300 blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 p-2 border border-sky-400/25 shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex items-center justify-center">
                    <img
                      alt="Breezy Wind Robot"
                      className="w-16 h-16 object-contain drop-shadow-[0_4px_12px_rgba(56,189,248,0.4)] transition-transform duration-500 hover:rotate-6 hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-mJtgsuRAXsu9FP8BDS2WmvOO8XE6mZ34JR7qzeah5XqeUX9fsYqhHcvVuet6c7jjfulZ8KASRiOcoMrZINxSoLX16DF7Kka5wBBxKxl9rI_haMCsw_NhbOMPMUcWdFE-400VjRp82eoDeoyXw1xenvGO1fBtKPW2KIxfHHQtUMeP_uFb0gqIs0zXKjpGb7KDGh7VG4ZjoDGQA2OL7F8gjFb2ou5UvIB3UIRDCo0fWrhja-SqKrx7DNvj7LzLgSZjTiU"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8] ring-2 ring-slate-900"></span>
                </div>

                <div className="flex flex-col items-center max-w-lg mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 font-sans text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                    <span>Adaptive Intelligence Active</span>
                  </div>
                  <h1 className="font-sans text-2xl sm:text-3xl text-white font-bold tracking-tight">
                    Good day, Breezer.
                  </h1>
                  <p className="font-sans text-sm text-slate-300 mt-1.5">
                    How can Breezy help you float through your day?
                  </p>
                </div>

                {/* Suggested Prompt Cards */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <button
                    type="button"
                    onClick={() =>
                      setInputVal(
                        'Explain quantum computing with a simple, intuitive metaphor.'
                      )
                    }
                    className="group p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-sky-500/40 hover:-translate-y-0.5 transition text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sky-400 shrink-0">
                      psychology
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-xs text-slate-100 truncate group-hover:text-sky-300">
                        Explain quantum computing
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                        Simple intuitive metaphors
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInputVal(
                        'Draft a design pitch for an atmospheric glassmorphic AI chat interface.'
                      )
                    }
                    className="group p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-sky-500/40 hover:-translate-y-0.5 transition text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sky-400 shrink-0">
                      auto_awesome
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-xs text-slate-100 truncate group-hover:text-sky-300">
                        Draft a design pitch
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                        Elevate a design system
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInputVal(
                        'Write a React 19 TypeScript hook for smooth atmosphere parallax scrolling.'
                      )
                    }
                    className="group p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-sky-500/40 hover:-translate-y-0.5 transition text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sky-400 shrink-0">
                      code_blocks
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-xs text-slate-100 truncate group-hover:text-sky-300">
                        Refactor React hook
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                        Optimize scroll listener
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInputVal(
                        'Condense the key notes of atmospheric, glassmorphic UI design.'
                      )
                    }
                    className="group p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-sky-500/40 hover:-translate-y-0.5 transition text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sky-400 shrink-0">
                      edit_note
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-xs text-slate-100 truncate group-hover:text-sky-300">
                        Synthesize notes
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                        Condense into pain points
                      </span>
                    </span>
                  </button>
                </div>
              </section>
            ) : (
              /* Conversation Stream */
              activeChat.messages.map((m, idx) => {
                const isUser = m.role === 'user';
                if (isUser) {
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-end gap-1.5 max-w-[85%] self-end animate-in fade-in"
                    >
                      <div className="flex items-center gap-2 pr-1 text-slate-400 font-mono text-[10px]">
                        <span className="text-slate-200 font-sans font-semibold">
                          Elena
                        </span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <div className="relative px-5 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-[0_8px_24px_rgba(2,132,199,0.35)] border border-sky-400/30">
                        <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 max-w-[96%] self-start animate-in fade-in"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-800/90 border border-sky-400/30 shrink-0 flex items-center justify-center mt-1 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                      <span className="material-symbols-outlined text-sky-300 text-lg">
                        air
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-mono text-[10px] pl-1">
                        <span className="font-sans font-bold text-white text-sm leading-none">
                          Breezy AI
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold leading-none">
                          v3.5 Turbo
                        </span>
                        <span className="text-slate-500">{m.timestamp}</span>
                      </div>

                      <div className="p-5 rounded-2xl rounded-tl-sm bg-[#111827]/90 border border-slate-800/80 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-slate-100 font-sans text-sm leading-relaxed prose-msg">
                        {m.content ? (
                          m.content.split('\n\n').map((para, pIdx) => {
                            if (para.startsWith('```')) {
                              const codeLines = para.split('\n');
                              const filename = codeLines[0].replace('```', '') || 'code.ts';
                              const code = codeLines.slice(1, -1).join('\n');
                              return (
                                <div key={pIdx} className="rounded-lg overflow-hidden bg-[#050811] text-slate-200 border border-slate-800 my-4 shadow-xl">
                                  <div className="px-4 py-2 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between text-xs">
                                    <span className="font-mono text-slate-400">{filename}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(code);
                                        toast('Code copied to clipboard.');
                                      }}
                                      className="text-sky-300 hover:text-white"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="p-4 font-mono text-xs overflow-x-auto">
                                    <code>{code}</code>
                                  </pre>
                                </div>
                              );
                            }
                            return <p key={pIdx} className="mb-2 leading-relaxed">{para}</p>;
                          })
                        ) : (
                          <div className="flex items-center gap-1.5 py-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-200"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Bottom Floating Composer */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none flex flex-col items-center z-20">
          <div className="w-full max-w-[760px] pointer-events-auto flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full px-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWebSearchActive(!webSearchActive)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-sans text-xs transition-all border cursor-pointer ${
                    webSearchActive
                      ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    public
                  </span>
                  <span>Web Search: {webSearchActive ? 'On' : 'Off'}</span>
                </button>

                <div
                  onClick={onOpenSettings}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111827]/90 border border-slate-800 text-slate-200 cursor-pointer hover:border-sky-500/40"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                  <span>Breezy Engine (BYOK)</span>
                </div>
              </div>

              {activeChat && activeChat.messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="text-slate-500 hover:text-[#ffb4ab] flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    delete_sweep
                  </span>
                  <span>Clear Stream</span>
                </button>
              )}
            </div>

            {/* Input Capsule Box */}
            <div className="w-full rounded-2xl bg-[#0d1424]/95 backdrop-blur-2xl p-2 border border-slate-800/80 shadow-[0_12px_36px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] flex items-end gap-2 focus-within:border-sky-400/50 focus-within:shadow-[0_0_24px_rgba(56,189,248,0.25)] transition-all">
              <button
                type="button"
                onClick={createNewChat}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-sky-400 hover:bg-slate-800 shrink-0 cursor-pointer"
                title="New Chat Stream"
              >
                <span className="material-symbols-outlined text-[20px]">
                  add_comment
                </span>
              </button>

              <div className="flex-1 py-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Whisper your idea to Breezy or ask anything..."
                  className="w-full bg-transparent resize-none outline-none font-sans text-xs text-slate-100 placeholder:text-slate-500 max-h-36 leading-normal"
                />
              </div>

              <button
                type="button"
                onClick={handleMicToggle}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  isMicActive ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                }`}
                title="Voice Query"
              >
                <span className="material-symbols-outlined text-[20px]">mic</span>
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={!inputVal.trim() && !isThinking}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_upward
                </span>
              </button>
            </div>

            <p className="font-sans text-[10px] text-slate-500 text-center leading-normal">
              Breezy is fully client-side and persistent. Always verify generated code before production delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
