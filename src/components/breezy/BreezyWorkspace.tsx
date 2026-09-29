import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { providerConfigService, AVAILABLE_MODELS } from '../../services/providerConfigService';
import { BreezyLogoIcon, SynthexisLogoIcon } from '../icons/ProductLogos';

export interface BreezyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pending?: boolean;
}

export interface BreezyChat {
  id: string;
  title: string;
  messages: BreezyMessage[];
  createdAt: string;
}

interface BreezyWorkspaceProps {
  onOpenSettings: () => void;
  toast: (msg: string) => void;
  chats?: Record<string, BreezyChat>;
  activeId?: string | null;
  onSelectChat?: (id: string) => void;
  onUpdateChats?: (chats: Record<string, BreezyChat>) => void;
  onNewChat?: () => void;
  onSwitchToSynthexis?: () => void;
}

export const BreezyWorkspace: React.FC<BreezyWorkspaceProps> = ({
  onOpenSettings,
  toast,
  chats: parentChats,
  activeId: parentActiveId,
  onSelectChat: parentSelectChat,
  onUpdateChats: parentUpdateChats,
  onNewChat: parentNewChat,
  onSwitchToSynthexis,
}) => {
  // Local state fallback if parent props are not supplied
  const [localChats, setLocalChats] = useState<Record<string, BreezyChat>>(() => {
    try {
      const raw = localStorage.getItem('breezy:chats');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [localActiveId, setLocalActiveId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('breezy:chats');
      if (raw) {
        const parsed = JSON.parse(raw);
        const keys = Object.keys(parsed);
        return keys.length > 0 ? keys[0] : null;
      }
    } catch {}
    return null;
  });

  const chats = parentChats ?? localChats;
  const activeId = parentActiveId !== undefined ? parentActiveId : localActiveId;

  const saveChats = (nextChats: Record<string, BreezyChat>) => {
    if (parentUpdateChats) {
      parentUpdateChats(nextChats);
    } else {
      setLocalChats(nextChats);
      try {
        localStorage.setItem('breezy:chats', JSON.stringify(nextChats));
      } catch {}
    }
  };

  const setActiveId = (id: string | null) => {
    if (parentSelectChat && id) {
      parentSelectChat(id);
    } else {
      setLocalActiveId(id);
    }
  };

  const [inputVal, setInputVal] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const config = providerConfigService.getConfig();
    return config.defaultModel || 'gemini-3.8-flash';
  });
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    const config = providerConfigService.getConfig();
    return config.defaultProvider || 'gemini';
  });
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getActiveChat = (): BreezyChat | null => {
    if (!activeId || !chats[activeId]) return null;
    return chats[activeId];
  };

  const handleCreateNewChat = () => {
    if (parentNewChat) {
      parentNewChat();
    } else {
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
    }
    toast('Started a new chat.');
  };

  const clearChat = () => {
    if (!activeId || !chats[activeId]) return;
    const next = {
      ...chats,
      [activeId]: {
        ...chats[activeId],
        messages: [],
      },
    };
    saveChats(next);
    toast('Conversation cleared.');
  };

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputVal;
    if (!promptToSend.trim() || isThinking) return;

    let currentId = activeId;
    let nextChats = { ...chats };

    if (!currentId || !chats[currentId]) {
      currentId = `chat-${Date.now()}`;
      const newChat: BreezyChat = {
        id: currentId,
        title: promptToSend.trim().slice(0, 32),
        messages: [],
        createdAt: new Date().toISOString(),
      };
      nextChats = { [currentId]: newChat, ...chats };
      setActiveId(currentId);
    }

    const userMsg: BreezyMessage = {
      role: 'user',
      content: promptToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const targetChat = nextChats[currentId];
    const isFirstMsg = targetChat.messages.length === 0;
    const updatedMessages = [...targetChat.messages, userMsg];

    const updatedChat: BreezyChat = {
      ...targetChat,
      title: isFirstMsg ? promptToSend.trim().slice(0, 32) : targetChat.title,
      messages: updatedMessages,
    };

    const pendingMsg: BreezyMessage = {
      role: 'assistant',
      content: '',
      timestamp: 'Thinking...',
      pending: true,
    };

    const chatsWithPending = {
      ...nextChats,
      [currentId]: {
        ...updatedChat,
        messages: [...updatedMessages, pendingMsg],
      },
    };

    saveChats(chatsWithPending);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    setIsThinking(true);

    try {
      const apiKey = providerConfigService.getKey(selectedProvider) || undefined;
      const data = await apiClient.chatBreezy(
        {
          prompt: (webSearchActive ? `[Web Search Active] ` : '') + userMsg.content,
          history: updatedMessages.slice(-8),
          provider: selectedProvider,
          model: selectedModel,
          apiKey,
        },
        {
          onNotice: (msg) => toast(msg),
        }
      );

      const aiText = data.text || 'Thinking complete.';

      saveChats({
        ...nextChats,
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
        ...nextChats,
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

  const handleRegenerate = async (msgIdx: number) => {
    if (!activeId || !chats[activeId] || isThinking) return;
    const currentMessages = chats[activeId].messages;
    const prevUserMsg = currentMessages
      .slice(0, msgIdx)
      .reverse()
      .find((m) => m.role === 'user');
    if (!prevUserMsg) return;

    const trimmed = currentMessages.slice(0, msgIdx);
    saveChats({
      ...chats,
      [activeId]: {
        ...chats[activeId],
        messages: trimmed,
      },
    });

    handleSend(prevUserMsg.content);
  };

  const handleSpeakText = (text: string, idx: number) => {
    if (!window.speechSynthesis) {
      toast('Speech synthesis is not supported on this browser.');
      return;
    }
    if (speakingMessageIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted.');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingMessageIdx(null);
    utterance.onerror = () => setSpeakingMessageIdx(null);
    setSpeakingMessageIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const recognitionRef = useRef<any>(null);
  const handleMicToggle = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast('Speech recognition is not supported in this browser.');
      return;
    }
    if (isMicActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsMicActive(false);
    } else {
      try {
        const rec = new SR();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = false;
        rec.onstart = () => setIsMicActive(true);
        rec.onend = () => setIsMicActive(false);
        rec.onerror = (e: any) => {
          setIsMicActive(false);
          toast(e.error === 'not-allowed' ? 'Microphone permission denied.' : 'Voice recognition ended.');
        };
        rec.onresult = (e: any) => {
          const text = e.results?.[0]?.[0]?.transcript;
          if (text) {
            setInputVal((prev) => (prev ? `${prev} ${text}` : text));
          }
        };
        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        setIsMicActive(false);
        console.warn('Speech recognition init error:', err);
      }
    }
  };

  const activeChat = getActiveChat();

  return (
    <div className="flex-1 flex flex-col w-full relative min-h-screen bg-[#090d16] text-slate-100 antialiased font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[340px] bg-gradient-to-b from-sky-500/10 via-indigo-950/15 to-transparent blur-3xl pointer-events-none z-0 rounded-full" />

      {/* Top Model & Mode Bar */}
      <div className="h-12 border-b border-slate-800/60 bg-[#0d1424]/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsModelPickerOpen(!isModelPickerOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-700/60 bg-slate-900/60 cursor-pointer shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>{selectedModel}</span>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                {isModelPickerOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {isModelPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsModelPickerOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-1.5 shadow-2xl z-40 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Select AI Model
                  </div>
                  {Object.entries(AVAILABLE_MODELS).flatMap(([prov, models]) =>
                    models.map((m) => {
                      const isCur = selectedModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedProvider(prov);
                            setSelectedModel(m.id);
                            setIsModelPickerOpen(false);
                            toast(`Model switched to ${m.name}`);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isCur
                              ? 'bg-sky-500/20 text-sky-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-sans">{m.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{prov}</div>
                          </div>
                          {isCur && (
                            <span className="material-symbols-outlined text-[16px] text-sky-400">check</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side of chat header */}
        <div className="flex items-center gap-2">
          {activeChat && activeChat.messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="text-slate-400 hover:text-red-400 p-1 rounded-md hover:bg-slate-800/60 transition-colors"
              title="Clear conversation"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col w-full z-10">
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full pt-6 pb-44 scroll-smooth"
        >
          <div className="w-full max-w-[768px] mx-auto px-4 sm:px-6 flex flex-col gap-6">
            {!activeChat || activeChat.messages.length === 0 ? (
              /* Centered Welcome Hero */
              <div className="py-12 sm:py-16 flex flex-col items-center text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 via-sky-400/30 to-indigo-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.25)] mb-5">
                  <BreezyLogoIcon className="w-9 h-9 text-sky-400" />
                </div>

                <h1 className="font-sans text-2xl sm:text-3xl text-white font-bold tracking-tight">
                  What can I help you with today?
                </h1>
                <p className="font-sans text-sm text-slate-300 mt-2 max-w-md">
                  Ask questions, draft code, brainstorm ideas, and build powerful applications.
                </p>

                {/* Prompt Cards */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 text-left">
                  <button
                    type="button"
                    onClick={() => handleSend('Explain quantum computing with a simple, intuitive metaphor.')}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-sky-500/40 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sky-400 text-lg mt-0.5 shrink-0">
                      psychology
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-slate-100 group-hover:text-sky-300">
                        Explain quantum computing
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Simple, intuitive everyday metaphors
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend('Write a React TypeScript hook for debounced search with abort controllers.')}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-sky-500/40 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sky-400 text-lg mt-0.5 shrink-0">
                      code
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-slate-100 group-hover:text-sky-300">
                        Write React hook
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Debounced search with abort controllers
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend('Draft an outline for a high-performance modern web application architecture.')}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-sky-500/40 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sky-400 text-lg mt-0.5 shrink-0">
                      architecture
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-slate-100 group-hover:text-sky-300">
                        Web Architecture
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Modular frontend with resilient caching
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend('Compare the philosophical debate between Rationalism and Empiricism.')}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-sky-500/40 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sky-400 text-lg mt-0.5 shrink-0">
                      balance
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-slate-100 group-hover:text-sky-300">
                        Rationalism vs. Empiricism
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Core epistemological arguments compared
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Conversation Messages Stream */
              activeChat.messages.map((m, idx) => {
                const isUser = m.role === 'user';
                if (isUser) {
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-end gap-1.5 max-w-[85%] self-end animate-in fade-in"
                    >
                      <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-slate-800 border border-slate-700/80 text-white shadow-sm">
                        <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono pr-1">{m.timestamp}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 max-w-[96%] self-start animate-in fade-in"
                  >
                    {/* Assistant Avatar */}
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-sky-400/40 shrink-0 flex items-center justify-center mt-0.5 shadow-sm text-sky-400">
                      <BreezyLogoIcon className="w-4 h-4 text-sky-400" />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      {/* Name & Model tag */}
                      <div className="flex items-center gap-2 text-xs font-sans pl-1">
                        <span className="font-bold text-white">Breezy</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                          {selectedModel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                      </div>

                      {/* Content Bubble */}
                      <div className="p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-[#111827]/90 border border-slate-800/90 shadow-sm text-slate-100 font-sans text-sm leading-relaxed">
                        {m.pending ? (
                          <div className="flex items-center gap-2 py-1 text-sky-300 font-sans text-xs">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                            <span>Breezy is thinking...</span>
                          </div>
                        ) : m.content ? (
                          m.content.split('\n\n').map((para, pIdx) => {
                            if (para.startsWith('```')) {
                              const codeLines = para.split('\n');
                              const filename = codeLines[0].replace('```', '') || 'code';
                              const code = codeLines.slice(1, -1).join('\n');
                              return (
                                <div key={pIdx} className="rounded-xl overflow-hidden bg-[#050811] text-slate-200 border border-slate-800 my-3 shadow-md">
                                  <div className="px-3.5 py-2 bg-[#0d1324] border-b border-slate-800/80 flex items-center justify-between text-xs">
                                    <span className="font-mono text-slate-400 text-[11px]">{filename}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(code);
                                        toast('Code copied to clipboard.');
                                      }}
                                      className="flex items-center gap-1 text-sky-300 hover:text-white cursor-pointer transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                      <span>Copy code</span>
                                    </button>
                                  </div>
                                  <pre className="p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                                    <code>{code}</code>
                                  </pre>
                                </div>
                              );
                            }
                            return <p key={pIdx} className="mb-2 leading-relaxed whitespace-pre-wrap">{para}</p>;
                          })
                        ) : null}
                      </div>

                      {/* Action Bar (Copy, Speak, Regenerate, Synthexis) */}
                      {!m.pending && m.content && (
                        <div className="flex items-center gap-1 pl-1 text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(m.content);
                              toast('Message copied to clipboard.');
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors"
                            title="Copy response"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSpeakText(m.content, idx)}
                            className={`p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors ${
                              speakingMessageIdx === idx ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'
                            }`}
                            title="Read aloud"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {speakingMessageIdx === idx ? 'volume_off' : 'volume_up'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRegenerate(idx)}
                            className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors"
                            title="Regenerate response"
                          >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Floating Bottom Composer */}
        <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-4 pointer-events-none flex flex-col items-center z-30">
          <div className="w-full max-w-[768px] pointer-events-auto flex flex-col items-center gap-2">
            {/* Input Capsule Box */}
            <div className="w-full rounded-2xl bg-[#0d1424]/95 backdrop-blur-2xl p-2.5 border border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.7)] flex flex-col gap-2 focus-within:border-sky-400/60 focus-within:shadow-[0_0_24px_rgba(56,189,248,0.2)] transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Breezy anything... (Shift+Enter for new line)"
                className="w-full bg-transparent resize-none outline-none font-sans text-sm text-slate-100 placeholder:text-slate-400 max-h-44 px-2 pt-1 leading-relaxed"
              />

              {/* Tools row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  {/* Web search toggle */}
                  <button
                    type="button"
                    onClick={() => setWebSearchActive(!webSearchActive)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-sans text-xs transition-all border cursor-pointer ${
                      webSearchActive
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 font-semibold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                    title="Enable web search grounding"
                  >
                    <span className="material-symbols-outlined text-[15px]">public</span>
                    <span>Search {webSearchActive ? 'On' : 'Off'}</span>
                  </button>

                  {/* Settings / BYOK */}
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    title="Configure AI API keys & models"
                  >
                    <span className="material-symbols-outlined text-[15px]">key</span>
                    <span className="hidden sm:inline">Keys</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Mic toggle */}
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isMicActive
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800/80'
                    }`}
                    title="Voice input"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputVal.trim() || isThinking}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      inputVal.trim() && !isThinking
                        ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="font-sans text-[11px] text-slate-400 text-center">
              Breezy · Advanced AI coding assistant & workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
