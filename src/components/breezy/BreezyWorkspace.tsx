import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { providerConfigService, AVAILABLE_MODELS } from '../../services/providerConfigService';
import { effectiveProviderService } from '../../services/effectiveProviderService';
import { SynthexisLogoIcon } from '../icons/ProductLogos';
import { googleDriveService } from '../../services/googleDriveService';
import { authService } from '../../services/authService';
import { userProfileService } from '../../services/userProfileService';

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
  isSidebarOpen?: boolean;
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
  isSidebarOpen = true,
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
    const routable = effectiveProviderService.getActiveRoutableModel();
    return routable ? routable.model : 'gemini-2.5-flash';
  });
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    const routable = effectiveProviderService.getActiveRoutableModel();
    return routable ? routable.provider : 'gemini';
  });

  useEffect(() => {
    const unsubscribe = effectiveProviderService.subscribe(() => {
      const routable = effectiveProviderService.getActiveRoutableModel();
      if (routable && (!selectedProvider || !effectiveProviderService.isRoutable(selectedProvider))) {
        setSelectedProvider(routable.provider);
        setSelectedModel(routable.model);
      }
    });
    return unsubscribe;
  }, [selectedProvider]);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; content?: string } | null>(null);
  const breezyFileInputRef = useRef<HTMLInputElement>(null);

  // Background Auto-save to Drive logic
  useEffect(() => {
    const profile = userProfileService.getProfile();
    const autoSave = profile.autoSaveToDrive;
    if (!autoSave || !activeId || !chats[activeId] || chats[activeId].messages.length === 0) return;

    const token = authService.getAccessToken();
    if (!token || authService.isTokenExpired()) return;

    const timeout = setTimeout(async () => {
      try {
        const chat = chats[activeId];
        await googleDriveService.initialize(token);
        await googleDriveService.saveChat(chat);
        console.log('Breezy background auto-save complete.');
      } catch (e) {
        console.warn('Breezy auto-save failed:', e);
      }
    }, 5000); // 5s debounce

    return () => clearTimeout(timeout);
  }, [chats, activeId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getActiveChat = (): BreezyChat | null => {
    if (!activeId || !chats[activeId]) return null;
    return chats[activeId];
  };

  const handleSaveToDrive = async () => {
    const chat = getActiveChat();
    if (!chat || chat.messages.length === 0) return;

    const token = authService.getAccessToken();
    if (!token || authService.isTokenExpired()) {
      toast('Google Workspace authorization required or session expired. Please sign in via Settings.');
      onOpenSettings();
      return;
    }

    setIsSavingToDrive(true);
    try {
      await googleDriveService.initialize(token);
      await googleDriveService.saveChat(chat);
      toast('Chat successfully backed up to Google Drive.');
    } catch (error: any) {
      console.error('Drive save error:', error);
      toast(`Drive backup failed: ${error.message}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = typeof event.target?.result === 'string' ? event.target.result : '';
        const truncated = text.length > 40000 ? text.slice(0, 40000) + '\n... [Context truncated for length]' : text;
        setAttachedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          content: truncated,
        });
        toast(`Attached ${file.name} for chat context.`);
      };
      reader.onerror = () => {
        toast('Could not read file. Please choose a text, code, or document file.');
      };
      reader.readAsText(file);
    }
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
    if ((!promptToSend.trim() && !attachedFile) || isThinking) return;

    const fullPrompt = attachedFile?.content
      ? `${promptToSend.trim()}\n\n--- [Attached Reference File: ${attachedFile.name}] ---\n${attachedFile.content}\n--- [End of Reference File] ---`
      : promptToSend.trim();

    let currentId = activeId;
    let nextChats = { ...chats };

    if (!currentId || !chats[currentId]) {
      currentId = `chat-${Date.now()}`;
      const newChat: BreezyChat = {
        id: currentId,
        title: promptToSend.trim().slice(0, 32) || attachedFile?.name || 'New conversation',
        messages: [],
        createdAt: new Date().toISOString(),
      };
      nextChats = { [currentId]: newChat, ...chats };
      setActiveId(currentId);
    }

    const userMsg: BreezyMessage = {
      role: 'user',
      content: fullPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const targetChat = nextChats[currentId];
    const isFirstMsg = targetChat.messages.length === 0;
    const updatedMessages = [...targetChat.messages, userMsg];

    const updatedChat: BreezyChat = {
      ...targetChat,
      title: isFirstMsg ? (promptToSend.trim().slice(0, 32) || attachedFile?.name || 'Chat') : targetChat.title,
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
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    setIsThinking(true);

    if (!selectedProvider || !providerConfigService.isProviderConfigured(selectedProvider)) {
      toast(`No API key configured for ${selectedProvider || 'an AI provider'}. Please connect your key in Settings.`);
      onOpenSettings();
      saveChats({
        ...nextChats,
        [currentId]: {
          ...updatedChat,
          messages: [
            ...updatedMessages,
            {
              role: 'assistant',
              content: `⚠️ Provider Not Connected: Please add an API key in Settings (BYOK) for ${selectedProvider || 'your preferred model'} to generate responses.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        },
      });
      setIsThinking(false);
      return;
    }

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
              content: `${e.message}`,
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
    <div className="flex-1 flex flex-col w-full relative h-[calc(100vh-4rem)] bg-[#090d16] text-slate-100 antialiased font-sans overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[340px] bg-gradient-to-b from-sky-500/10 via-indigo-950/15 to-transparent blur-3xl pointer-events-none z-0 rounded-full" />

      {/* Floating Top Right Actions for Active Chat */}
      {activeChat && activeChat.messages.length > 0 && (
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveToDrive}
            disabled={isSavingToDrive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-sky-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-sky-500/30 transition-all cursor-pointer shadow-lg disabled:opacity-50 backdrop-blur-md"
            title="Save this conversation to your Google Drive"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSavingToDrive ? 'animate-spin' : ''}`}>
              {isSavingToDrive ? 'sync' : 'cloud_upload'}
            </span>
            <span className="hidden sm:inline">Save to Drive</span>
          </button>

          <button
            type="button"
            onClick={clearChat}
            className="p-2 rounded-xl bg-slate-900/95 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-colors shadow-lg backdrop-blur-md cursor-pointer"
            title="Clear conversation"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col w-full z-10 min-h-0 overflow-hidden">
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full pt-2 sm:pt-4 pb-44 scroll-smooth"
        >
          <div className="w-full max-w-[920px] lg:max-w-[980px] mx-auto px-4 sm:px-6 flex flex-col gap-5">
            {!activeChat || activeChat.messages.length === 0 ? (
              /* Centered Welcome Hero */
              <div className="pt-2 sm:pt-4 pb-2 sm:pb-3 flex flex-col items-center text-center animate-in fade-in duration-200">
                <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-tight">
                  What can I help you with today?
                </h1>
                <p className="font-sans text-sm sm:text-base text-slate-300 mt-2 max-w-lg leading-relaxed">
                  Ask questions, draft code, brainstorm ideas, and build powerful applications.
                </p>

                {/* Prompt Cards */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 sm:mt-5 text-left">
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
                      <div className="flex items-center gap-2 text-[10px] font-sans pr-1 mb-0.5 justify-end">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">{userProfileService.getProfile().displayName}</span>
                      </div>
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
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/25 shrink-0 flex items-center justify-center mt-0.5 shadow-xs text-sky-400 font-bold text-xs select-none">
                      B
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
        <div className={`fixed bottom-0 ${isSidebarOpen ? 'lg:left-64' : 'left-0'} left-0 right-0 p-3 sm:p-4 pointer-events-none flex flex-col items-center z-30 transition-all duration-300`}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={breezyFileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql"
          />

          <div className="w-full max-w-[920px] lg:max-w-[980px] pointer-events-auto flex flex-col items-center gap-2">
            {/* Input Capsule Box */}
            <div className="w-full rounded-2xl sm:rounded-3xl bg-[#0d1424]/95 backdrop-blur-2xl p-3.5 sm:p-4 border border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.75)] flex flex-col gap-2.5 focus-within:border-sky-400/60 focus-within:shadow-[0_0_28px_rgba(56,189,248,0.22)] transition-all">
              {attachedFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-sky-200 self-start">
                  <span className="material-symbols-outlined text-[15px] text-sky-400">attach_file</span>
                  <span className="truncate max-w-[200px] font-medium">{attachedFile.name} ({attachedFile.size})</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-slate-400 hover:text-white font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={2}
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 60), 220)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Breezy anything... (Shift+Enter for new line)"
                className="w-full bg-transparent resize-none outline-none font-sans text-sm sm:text-base text-slate-100 placeholder:text-slate-400 min-h-[58px] sm:min-h-[64px] max-h-56 px-2.5 py-1 leading-relaxed"
              />

              {/* Tools row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs sm:text-sm">
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

                  {/* Attach File button */}
                  <button
                    type="button"
                    onClick={() => breezyFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    title="Attach reference document or code"
                  >
                    <span className="material-symbols-outlined text-[15px]">attach_file</span>
                    <span className="hidden sm:inline">Attach</span>
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
                  {/* Model Selector Dropdown */}
                  <div className="relative">
                    {(() => {
                      const info = effectiveProviderService.getProviderInfo(selectedProvider);
                      const isConfigured = info.hasKey;
                      const displayLabel = selectedModel || 'gemini-2.5-flash';
                      return (
                        <button
                          type="button"
                          onClick={() => setIsModelPickerOpen(!isModelPickerOpen)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer shadow-xs ${
                            isConfigured
                              ? 'text-slate-200 hover:text-white hover:bg-slate-800/80 border-slate-700/60 bg-slate-900/60'
                              : 'text-sky-300 hover:text-white hover:bg-sky-950/40 border-sky-500/40 bg-sky-950/20'
                          }`}
                          title={isConfigured ? `Active Model: ${displayLabel}` : `Model: ${displayLabel} (Connect key or use server)`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
                          <span className="truncate max-w-[120px] font-sans">
                            {displayLabel}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-slate-400">
                            {isModelPickerOpen ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      );
                    })()}

                    {isModelPickerOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsModelPickerOpen(false)}
                        />
                        <div className="absolute bottom-full mb-2 right-0 w-64 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-1.5 shadow-2xl z-40 animate-in fade-in">
                          <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                            <span>Select AI Model</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsModelPickerOpen(false);
                                onOpenSettings();
                              }}
                              className="text-sky-400 hover:underline text-[9px] cursor-pointer"
                            >
                              Manage Keys
                            </button>
                          </div>
                          {Object.entries(AVAILABLE_MODELS).flatMap(([prov, models]) =>
                            models.map((m) => {
                              const isCur = selectedModel === m.id;
                              const pInfo = effectiveProviderService.getProviderInfo(prov);
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
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pInfo.hasKey ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`} />
                                    <div className="truncate">
                                      <div className="font-sans truncate">{m.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                        <span>{prov}</span>
                                        {!pInfo.hasKey ? (
                                          <span className="text-amber-400/90 text-[9px]">· Requires Key</span>
                                        ) : (
                                          <span className="text-emerald-400/90 text-[9px]">· {pInfo.source === 'server' ? 'Server Connected' : 'BYOK Connected'}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {isCur && (
                                    <span className="material-symbols-outlined text-[16px] text-sky-400 shrink-0">check</span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mic toggle */}
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                      isMicActive
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800/80'
                    }`}
                    title="Voice input"
                  >
                    <span className="material-symbols-outlined text-[19px] sm:text-[20px]">mic</span>
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={(!inputVal.trim() && !attachedFile) || isThinking}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      (inputVal.trim() || attachedFile) && !isThinking
                        ? 'bg-white text-slate-950 hover:bg-slate-200 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <span className="material-symbols-outlined text-[19px] sm:text-[20px]">arrow_upward</span>
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
