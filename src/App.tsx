/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ConsoleTab } from './components/console/Sidebar';
import { TopBar } from './components/console/TopBar';
import { ResearchConversationView } from './components/console/ResearchConversationView';
import { ChatDialecticView } from './components/console/ChatDialecticView';
import { ResearchNotesView } from './components/console/ResearchNotesView';
import { ModelsConsensusView } from './components/console/ModelsConsensusView';
import { WorkspaceSettingsView } from './components/console/WorkspaceSettingsView';
import { LandingPageView } from './components/console/LandingPageView';
import { CommandPaletteModal } from './components/console/CommandPaletteModal';
import { SynapWorkspace } from './components/synap/SynapWorkspace';
import { BreezyWorkspace } from './components/breezy/BreezyWorkspace';
import { BreezySidebar, BreezyTab } from './components/breezy/BreezySidebar';
import { BreezyIdeWorkspace } from './components/breezy/BreezyIdeWorkspace';
import { BreezyCanvasWorkspace } from './components/breezy/BreezyCanvasWorkspace';
import { ProfileSettingsModal } from './components/console/ProfileSettingsModal';
import { SynapHeader } from './components/synap/SynapHeader';

import {
  ProviderKeyConfig,
  DebateStep,
  DebateSession,
  DebateTone,
  SearchEngineProvider,
} from './types';
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createNewSession,
  SEED_SAMPLE_SESSIONS,
} from './services/sessionStorage';
import { exportConsensusAsMarkdown } from './utils/exportTranscript';

// Storage key constants
const STORAGE_KEYS = 'breezy_byok_keys';
const STORAGE_PROTOCOL = 'breezy_protocol_mode';
const STORAGE_TONE = 'breezy_research_tone';
const STORAGE_USER = 'breezy_user';
const STORAGE_CONSENSUS_MODE = 'breezy_synthesis_mode';

export default function App() {
  // Navigation tab state: chat | notes | models | settings | landing
  const [activeTab, setActiveTab] = useState<ConsoleTab>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['chat', 'notes', 'models', 'settings', 'landing'].includes(hash)) {
      return hash as ConsoleTab;
    }
    return 'chat';
  });

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [productMode, setProductMode] = useState<'breezy' | 'synthexis' | 'synap'>(() => {
    // Check URL params or hash first
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'synthexis' || modeParam === 'synap' || modeParam === 'breezy') {
      return modeParam;
    }
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('synap')) return 'synap';
    if (hash.includes('synthexis')) return 'synthexis';

    const saved = localStorage.getItem('breezy_product_mode');
    if (saved === 'synthexis' || saved === 'synap' || saved === 'breezy') {
      return saved;
    }
    return 'breezy';
  });

  useEffect(() => {
    localStorage.setItem('breezy_product_mode', productMode);
  }, [productMode]);

  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [breezyTab, setBreezyTab] = useState<BreezyTab>('chat');

  // Global Light/Dark Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('breezy_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('breezy_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Breezy chat states
  const [breezyChats, setBreezyChats] = useState<Record<string, any>>(() => {
    try {
      const raw = localStorage.getItem('breezy:chats');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [breezyActiveId, setBreezyActiveId] = useState<string | null>(() => {
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

  const handleNewBreezyChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat = {
      id: newId,
      title: 'New chat',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    const next = { [newId]: newChat, ...breezyChats };
    setBreezyChats(next);
    setBreezyActiveId(newId);
    try {
      localStorage.setItem('breezy:chats', JSON.stringify(next));
    } catch {}
  };

  const handleDeleteBreezyChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = { ...breezyChats };
    delete next[id];
    setBreezyChats(next);
    try {
      localStorage.setItem('breezy:chats', JSON.stringify(next));
    } catch {}
    if (breezyActiveId === id) {
      const remaining = Object.keys(next);
      setBreezyActiveId(remaining.length ? remaining[0] : null);
    }
  };

  // Consensus mode toggle
  const [consensusMode, setConsensusMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CONSENSUS_MODE) ?? localStorage.getItem('synthexis_consensus_mode');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleConsensusMode = () => {
    setConsensusMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_CONSENSUS_MODE, String(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  // BYOK Keys
  const [keys, setKeys] = useState<ProviderKeyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS) || localStorage.getItem('synthexis_byok_keys');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSaveKeys = (newKeys: ProviderKeyConfig) => {
    setKeys(newKeys);
    try {
      localStorage.setItem(STORAGE_KEYS, JSON.stringify(newKeys));
    } catch (e) {
      console.warn(e);
    }
  };

  // Persistent Debate Sessions
  const [sessions, setSessions] = useState<DebateSession[]>(() => {
    const loaded = loadSessions();
    return loaded || [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const savedId = loadActiveSessionId();
    const all = loadSessions();
    if (savedId && all.some((s) => s.id === savedId)) return savedId;
    return all.length > 0 ? all[0].id : null;
  });

  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Protocol & Seat Config
  const [protocol, setProtocol] = useState<'trio' | 'quad' | 'duel' | 'solo'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROTOCOL) || localStorage.getItem('synthexis_protocol_mode');
      return (saved as any) || 'trio';
    } catch {
      return 'trio';
    }
  });

  const [tone, setTone] = useState<DebateTone>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TONE) || localStorage.getItem('synthexis_debate_tone');
      return (saved as DebateTone) || 'balanced';
    } catch {
      return 'balanced';
    }
  });

  // Active Session and Streaming State
  const currentSession: DebateSession =
    sessions.find((s) => s.id === activeSessionId) ||
    sessions[0] ||
    SEED_SAMPLE_SESSIONS[0];

  const [isDeliberating, setIsDeliberating] = useState(false);
  const [activeRound, setActiveRound] = useState<number>(0);
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingRole, setStreamingRole] = useState<string>('');
  const [researchEvents, setResearchEvents] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      // ⌘K or Ctrl+K -> Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If user is actively typing in textarea/input, don't trigger tab navigation shortcuts
      if (isInputFocused) return;

      // ⌘1 -> Chat
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setActiveTab('chat');
      }
      // ⌘2 -> Notes
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setActiveTab('notes');
      }
      // ⌘3 -> Models
      if ((e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        setActiveTab('models');
      }
      // ⌘, -> Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setActiveTab('settings');
      }
      // ⌘N -> New Session
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewDebate();
        setActiveTab('chat');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const updateActiveSession = (updates: Partial<DebateSession>) => {
    const currentId = activeSessionIdRef.current;
    if (!currentId) return;
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === currentId ? { ...s, ...updates, updatedAt: Date.now() } : s
      );
      saveSessions(next);
      return next;
    });
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    saveActiveSessionId(sessionId);
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setActiveRound(target.steps?.length || 0);
    }
  };

  const handleNewDebate = () => {
    if (isDeliberating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsDeliberating(false);
    }

    const newSession = createNewSession('New Dialectic Inquiry', protocol, [], tone);
    setActiveSessionId(newSession.id);
    saveActiveSessionId(newSession.id);
    setSessions((prev) => {
      const next = [newSession, ...prev.filter((s) => s.id !== newSession.id)];
      saveSessions(next);
      return next;
    });
    setActiveRound(0);
    setStreamingText('');
  };

  const startDebate = async (promptText: string, depth: 'solo' | 'standard' | 'deep' = 'standard') => {
    if (!promptText.trim() || isDeliberating) return;
    const trimmedPrompt = promptText.trim();

    setIsDeliberating(true);
    setActiveRound(1);
    setStreamingText('');
    setStreamingRole(depth === 'solo' ? 'solo' : 'architect');
    setResearchEvents([]);

    const chosenProtocol = depth === 'solo' ? 'solo' : (depth === 'deep' ? 'quad' : 'trio');

    const initialSteps: DebateStep[] = depth === 'solo' ? [
      {
        stepId: 'step-1',
        role: 'solo',
        agentName: 'Solo Assistant',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'running',
        content: '',
        timestamp: Date.now(),
      }
    ] : [
      {
        stepId: 'step-1',
        role: 'architect',
        agentName: 'Claude 3.5 Sonnet',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'running',
        content: '',
        timestamp: Date.now(),
      },
      {
        stepId: 'step-2',
        role: 'skeptic',
        agentName: 'GPT-4o',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'pending',
        content: '',
        timestamp: Date.now(),
      },
      {
        stepId: 'step-3',
        role: 'synthesizer',
        agentName: 'Gemini 1.5 Pro',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'pending',
        content: '',
        timestamp: Date.now(),
      },
      {
        stepId: 'step-4',
        role: 'arbiter',
        agentName: 'Synthexis Reviewer',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'pending',
        content: '',
        timestamp: Date.now(),
      },
    ];

    const newSession = createNewSession(trimmedPrompt, chosenProtocol, initialSteps, tone);
    activeSessionIdRef.current = newSession.id;
    setActiveSessionId(newSession.id);
    saveActiveSessionId(newSession.id);
    setSessions((prev) => {
      const next = [newSession, ...prev.filter((s) => s.id !== newSession.id)];
      saveSessions(next);
      return next;
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const searchEngineValue = keys.tavily ? 'tavily' : (keys.serper ? 'serper' : (keys.brave ? 'brave' : 'duckduckgo'));
      const response = await fetch('/api/debate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          protocol: chosenProtocol,
          tone,
          enableSearchGrounding: depth !== 'solo' || true,
          searchEngine: searchEngineValue,
          keys,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response stream from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'status') {
              if (data.message) {
                setResearchEvents((prev) => [...prev, data.message]);
              }
            } else if (data.type === 'search_grounding') {
              if (data.sources) {
                setResearchEvents((prev) => [...prev, `Found ${data.sources.length} useful sources.`]);
              }
            } else if (data.type === 'round_start') {
              setActiveRound(data.round);
              setStreamingRole(data.role || '');
              setStreamingText('');
              
              // Push human-friendly state indicators to the event stream
              if (data.round === 1) {
                setResearchEvents((prev) => [...prev, "Looking into this..."]);
              } else if (data.round === 2) {
                setResearchEvents((prev) => [...prev, "Checking another angle..."]);
              } else if (data.round === 3) {
                setResearchEvents((prev) => [...prev, "Comparing sources..."]);
              } else if (data.round >= 4) {
                setResearchEvents((prev) => [...prev, "One source disagrees — checking why..."]);
              }
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                const next = prev.map((s) => {
                  if (s.id !== currentId) return s;
                  const updatedSteps = [...s.steps];
                  const idx = data.round - 1;
                  if (updatedSteps[idx]) {
                    updatedSteps[idx] = {
                      ...updatedSteps[idx],
                      status: 'running',
                      agentName: data.agentName || updatedSteps[idx].agentName,
                    };
                  }
                  return { ...s, steps: updatedSteps };
                });
                saveSessions(next);
                return next;
              });
            } else if (data.type === 'token') {
              setStreamingText((prev) => prev + (data.token || ''));
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                const next = prev.map((s) => {
                  if (s.id !== currentId) return s;
                  const updatedSteps = [...s.steps];
                  const idx = (data.round || 1) - 1;
                  if (updatedSteps[idx]) {
                    updatedSteps[idx] = {
                      ...updatedSteps[idx],
                      content: (updatedSteps[idx].content || '') + data.token,
                    };
                  }
                  return { ...s, steps: updatedSteps };
                });
                return next;
              });
            } else if (data.type === 'round_complete') {
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                const next = prev.map((s) => {
                  if (s.id !== currentId) return s;
                  const updatedSteps = [...s.steps];
                  const idx = (data.round || 1) - 1;
                  if (updatedSteps[idx]) {
                    updatedSteps[idx] = {
                      ...updatedSteps[idx],
                      status: 'completed',
                      content: data.content || updatedSteps[idx].content,
                    };
                  }
                  return { ...s, steps: updatedSteps };
                });
                saveSessions(next);
                return next;
              });
            } else if (data.type === 'evidence_graph') {
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                const next: DebateSession[] = prev.map((s) => {
                  if (s.id !== currentId) return s;
                  return {
                    ...s,
                    evidenceGraph: data.evidenceGraph || s.evidenceGraph,
                    researchMetrics: data.researchMetrics || s.researchMetrics,
                  };
                });
                saveSessions(next);
                return next;
              });
            } else if (data.type === 'complete') {
              setResearchEvents((prev) => [...prev, "Research complete."]);
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                const next: DebateSession[] = prev.map((s) => {
                  if (s.id !== currentId) return s;
                  return {
                    ...s,
                    status: 'completed' as const,
                    finalOutput: data.finalOutput || s.finalOutput,
                    evidenceGraph: data.evidenceGraph || s.evidenceGraph,
                    researchMetrics: data.researchMetrics || s.researchMetrics,
                    metrics: data.metrics || s.metrics,
                  };
                });
                saveSessions(next);
                return next;
              });
              setIsDeliberating(false);
            }
          } catch (e) {
            console.warn('Failed to parse SSE line', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Debate cancelled by user');
      } else {
        console.error('Debate error:', err);
      }
    } finally {
      setIsDeliberating(false);
      abortControllerRef.current = null;
    }
  };

  const handleExportMarkdown = () => {
    exportConsensusAsMarkdown({
      prompt: currentSession.prompt,
      protocol: currentSession.protocol,
      steps: currentSession.steps,
      finalOutput: currentSession.finalOutput,
      metrics: currentSession.metrics,
    });
  };

  if (productMode === 'synap') {
    return (
      <div className={`min-h-screen font-sans antialiased overflow-x-hidden ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0A0A0F] text-[#e4e1ed]'}`}>
        <SynapWorkspace
          productMode={productMode}
          onSelectProductMode={setProductMode}
          onOpenProfile={() => setIsProfileSettingsOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />
        <ProfileSettingsModal
          isOpen={isProfileSettingsOpen}
          onClose={() => setIsProfileSettingsOpen(false)}
          keys={keys}
          onSaveKeys={handleSaveKeys}
        />
      </div>
    );
  }

  if (productMode === 'breezy') {
    return (
      <div className={`flex min-h-screen font-sans antialiased overflow-x-hidden ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#090d16] text-slate-100'}`}>
        {/* Breezy Sidebar navigation panel */}
        <BreezySidebar
          activeTab={breezyTab}
          onSelectTab={setBreezyTab}
          chats={breezyChats}
          activeId={breezyActiveId}
          onSelectChat={setBreezyActiveId}
          onNewChat={handleNewBreezyChat}
          onDeleteChat={handleDeleteBreezyChat}
          onOpenProfile={() => setIsProfileSettingsOpen(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <div className="pl-0 lg:pl-72 flex flex-col flex-1 min-h-screen">
          {/* Top Bar showing overall study readiness progress & product mode pill */}
          <SynapHeader
            readinessPercentage={81}
            productMode={productMode}
            onSelectProductMode={setProductMode}
            onOpenQuickJump={() => setIsCommandPaletteOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            theme={theme}
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          />

          {/* Breezy Sub-Views */}
          {breezyTab === 'chat' && (
            <BreezyWorkspace
              onOpenSettings={() => setIsProfileSettingsOpen(true)}
              toast={(msg) => alert(msg)}
            />
          )}

          {breezyTab === 'ide' && (
            <BreezyIdeWorkspace
              onOpenSettings={() => setIsProfileSettingsOpen(true)}
            />
          )}

          {breezyTab === 'canvas' && (
            <BreezyCanvasWorkspace
              onOpenSettings={() => setIsProfileSettingsOpen(true)}
            />
          )}
        </div>

        <ProfileSettingsModal
          isOpen={isProfileSettingsOpen}
          onClose={() => setIsProfileSettingsOpen(false)}
          keys={keys}
          onSaveKeys={handleSaveKeys}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewDebate}
        consensusMode={consensusMode}
        onToggleConsensusMode={handleToggleConsensusMode}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenProfile={() => setIsProfileSettingsOpen(true)}
      />

      {/* Main Workspace Stage */}
      <div className="pl-0 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          productMode={productMode}
          onSelectProductMode={setProductMode}
          onNewResearch={handleNewDebate}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />

        {/* Content Body Router */}
        <main className="relative pt-14 bg-[#10141a] min-h-screen flex-1 flex flex-col">
          {activeTab === 'chat' && (
            <ResearchConversationView
              session={currentSession}
              isDeliberating={isDeliberating}
              activeRound={activeRound}
              streamingRoundText={streamingText}
              streamingRole={streamingRole}
              onStartDebate={startDebate}
              researchEvents={researchEvents}
              onSaveNote={(title, content) => {
                const newNoteSession = createNewSession(title, protocol, [], tone);
                newNoteSession.finalOutput = content;
                setSessions((prev) => {
                  const next = [newNoteSession, ...prev];
                  saveSessions(next);
                  return next;
                });
              }}
              onExportMarkdown={handleExportMarkdown}
              keys={keys}
              onOpenNotes={() => setActiveTab('notes')}
            />
          )}

          {activeTab === 'notes' && (
            <ResearchNotesView
              sessions={sessions}
              onSelectNotePrompt={(prompt) => {
                if (prompt) {
                  startDebate(prompt);
                }
                setActiveTab('chat');
              }}
            />
          )}

          {activeTab === 'models' && (
            <ModelsConsensusView onOpenSettings={() => setActiveTab('settings')} />
          )}

          {activeTab === 'settings' && (
            <WorkspaceSettingsView keys={keys} onSaveKeys={handleSaveKeys} />
          )}

          {activeTab === 'landing' && (
            <LandingPageView
              onLaunchWorkspace={(query, depth) => {
                if (query) {
                  startDebate(query, depth);
                }
                setActiveTab('chat');
              }}
              onOpenNotes={() => setActiveTab('notes')}
              onOpenModels={() => setActiveTab('models')}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette Modal (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewDebate}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        keys={keys}
        onSaveKeys={handleSaveKeys}
      />
    </div>
  );
}
