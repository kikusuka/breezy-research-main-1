/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { CouncilChamberWindow } from './components/CouncilChamberWindow';
import { VaultModal } from './components/VaultModal';
import { CouncilConfigModal } from './components/CouncilConfigModal';
import { ExplainerModal } from './components/ExplainerModal';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GettingStartedTour } from './components/GettingStartedTour';
import {
  ProviderKeyConfig,
  DebateStep,
  WindowViewMode,
  HeartbeatState,
  DebateSession,
  DebateTone,
  SearchEngineProvider,
  SessionSnapshot,
} from './types';
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createNewSession,
} from './services/sessionStorage';
import { AlertCircle } from 'lucide-react';

// Storage key constants - using synthexis_ prefix for consistency
const STORAGE_KEYS = 'synthexis_byok_keys';
const STORAGE_PROTOCOL = 'synthexis_protocol_mode';
const STORAGE_TONE = 'synthexis_debate_tone';
const STORAGE_VIEW_MODE = 'synthexis_window_view_mode';
const STORAGE_USER = 'synthexis_user';
const STORAGE_SEARCH_GROUNDING = 'synthexis_search_grounding';
const STORAGE_SEARCH_ENGINE = 'synthexis_search_engine';

export default function App() {
  // Google Authentication State
  const [user, setUser] = useState<{ name: string; email: string; picture: string; verified: boolean; joinedAt: string } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('synthexis_tour_seen');
    } catch {
      return false;
    }
  });

  // BYOK Keys
  const [keys, setKeys] = useState<ProviderKeyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persistent Debate Sessions
  const [sessions, setSessions] = useState<DebateSession[]>(() => loadSessions());
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
      const saved = localStorage.getItem(STORAGE_PROTOCOL);
      return (saved as any) || 'trio';
    } catch {
      return 'trio';
    }
  });

  // Debate Dialectic Tone
  const [tone, setTone] = useState<DebateTone>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TONE);
      return (saved as DebateTone) || 'balanced';
    } catch {
      return 'balanced';
    }
  });

  const handleSelectTone = (newTone: DebateTone) => {
    setTone(newTone);
    try {
      localStorage.setItem(STORAGE_TONE, newTone);
    } catch (e) {
      console.warn('Failed to save tone setting preference', e);
    }
  };

  const [enableSearchGrounding, setEnableSearchGrounding] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SEARCH_GROUNDING);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleSearchGrounding = (enabled: boolean) => {
    setEnableSearchGrounding(enabled);
    try {
      localStorage.setItem(STORAGE_SEARCH_GROUNDING, String(enabled));
    } catch (e) {
      console.warn('Failed to save search grounding preference', e);
    }
  };

  const [searchEngine, setSearchEngine] = useState<SearchEngineProvider>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SEARCH_ENGINE);
      return (saved as SearchEngineProvider) || 'google';
    } catch {
      return 'google';
    }
  });

  const handleSelectSearchEngine = (engine: SearchEngineProvider) => {
    setSearchEngine(engine);
    try {
      localStorage.setItem(STORAGE_SEARCH_ENGINE, engine);
    } catch (e) {
      console.warn('Failed to save search engine preference', e);
    }
  };

  const [seats, setSeats] = useState<{
    architect: { provider: string; model: string };
    skeptic: { provider: string; model: string };
    arbiter: { provider: string; model: string };
  }>({
    architect: { provider: 'gemini', model: 'gemini-2.5-flash' },
    skeptic: { provider: 'gemini', model: 'gemini-2.5-flash' },
    arbiter: { provider: 'gemini', model: 'gemini-2.5-flash' },
  });

  // Window view mode: 'chat' | 'council' | 'split'
  const [viewMode, setViewMode] = useState<WindowViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIEW_MODE);
      return (saved as WindowViewMode) || 'chat';
    } catch {
      return 'chat';
    }
  });

  // Light/Dark Theme Preference
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('synthexis_theme');
      return (saved as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('synthexis_theme', nextTheme);
    } catch (e) {
      console.warn('Failed to save theme setting preference', e);
    }
  };

  // Modals
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isCouncilOpen, setIsCouncilOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global keydown listener for hotkeys ('?' or Shift+/)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Active Deliberation Session State
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [activeRound, setActiveRound] = useState<number>(0);
  const [steps, setSteps] = useState<DebateStep[]>([]);
  const [finalOutput, setFinalOutput] = useState<string>('');
  const [heartbeat, setHeartbeat] = useState<HeartbeatState | undefined>(undefined);
  const [metrics, setMetrics] = useState<{
    durationMs: number;
    consensusRate: number;
    contentionLevel: string;
    resolvedPointsCount: number;
  } | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Interactive Arbiter Interjection states
  const [interjectionEnabled, setInterjectionEnabled] = useState(true);
  const [interjectionActive, setInterjectionActive] = useState(false);
  const [interjectionText, setInterjectionText] = useState('');
  const [interjectedRound, setInterjectedRound] = useState<number | null>(null);
  const interjectionResolveRef = useRef<(() => void) | null>(null);

  const handleToggleInterjection = () => {
    setInterjectionEnabled((prev) => !prev);
  };

  const handleSetInterjectionText = (text: string) => {
    setInterjectionText(text);
  };

  const handleSubmitInterjection = (text: string) => {
    setInterjectionActive(false);
    if (text.trim()) {
      setSteps((prev) => {
        const next = [
          ...prev,
          {
            stepId: `interjection-${Date.now()}`,
            role: 'arbiter',
            agentName: 'The Arbiter',
            provider: 'gemini',
            model: 'gemini-2.5-pro',
            status: 'completed',
            content: `✍️ **[ARBITER INTERVENTION APPLIED]** user clarified: "${text}"`,
            timestamp: Date.now(),
          } as DebateStep
        ];
        updateActiveSession({ steps: next });
        return next;
      });
    }
    setInterjectionText('');
    if (interjectionResolveRef.current) {
      interjectionResolveRef.current();
      interjectionResolveRef.current = null;
    }
  };

  const handleBypassInterjection = () => {
    setInterjectionActive(false);
    setInterjectionText('');
    if (interjectionResolveRef.current) {
      interjectionResolveRef.current();
      interjectionResolveRef.current = null;
    }
  };

  // Reset interjection state when a completely new debate starts (round reset)
  useEffect(() => {
    if (!isDeliberating && activeRound === 0) {
      setInterjectedRound(null);
      setInterjectionActive(false);
    }
  }, [isDeliberating, activeRound]);

  // Restore active session debate transcript on initial mount
  useEffect(() => {
    if (activeSessionId) {
      const current = sessions.find((s) => s.id === activeSessionId);
      if (current) {
        setCurrentPrompt(current.prompt || '');
        setSteps(current.steps || []);
        setFinalOutput(current.finalOutput || '');
        setMetrics(current.metrics);
        if (current.protocol) {
          setProtocol(current.protocol);
        }
        if (current.tone) {
          setTone(current.tone);
        }
        setActiveRound(current.steps?.length || 0);
      }
    }
  }, []); // Run on initial load to restore from localStorage

  const handleSaveKeys = (newKeys: ProviderKeyConfig) => {
    setKeys(newKeys);
    localStorage.setItem(STORAGE_KEYS, JSON.stringify(newKeys));
  };

  const handleSelectProtocol = (p: 'trio' | 'quad' | 'duel' | 'solo') => {
    setProtocol(p);
    localStorage.setItem(STORAGE_PROTOCOL, p);
  };

  const handleSelectViewMode = (mode: WindowViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_VIEW_MODE, mode);
  };

  const handleUpdateSeat = (
    seatName: 'architect' | 'skeptic' | 'arbiter',
    provider: string,
    model: string
  ) => {
    setSeats((prev) => ({
      ...prev,
      [seatName]: { provider, model },
    }));
  };

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
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    if (isDeliberating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsDeliberating(false);
    }

    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    saveActiveSessionId(sessionId);

    setCurrentPrompt(session.prompt || '');
    setSteps(session.steps || []);
    setFinalOutput(session.finalOutput || '');
    setMetrics(session.metrics);
    if (session.protocol) {
      setProtocol(session.protocol);
      localStorage.setItem(STORAGE_PROTOCOL, session.protocol);
    }
    setActiveRound(session.steps?.length || 0);
    setErrorMessage(session.error || null);
  };

  const handleRestoreSnapshot = (snapshot: SessionSnapshot) => {
    const branchedSessionId = `branched-${Date.now()}`;
    const newSession: DebateSession = {
      id: branchedSessionId,
      prompt: snapshot.prompt,
      protocol: snapshot.protocol,
      steps: JSON.parse(JSON.stringify(snapshot.steps)),
      finalOutput: snapshot.finalOutput,
      createdAt: Date.now(),
      status: 'completed',
    };

    setSessions((prev) => {
      const next = [newSession, ...prev];
      saveSessions(next);
      return next;
    });

    activeSessionIdRef.current = branchedSessionId;
    setActiveSessionId(branchedSessionId);
    saveActiveSessionId(branchedSessionId);

    setCurrentPrompt(snapshot.prompt);
    setSteps(snapshot.steps);
    setFinalOutput(snapshot.finalOutput || '');
    setProtocol(snapshot.protocol);
    setActiveRound(snapshot.steps.length);
    setMetrics(undefined);
  };

  const handleNewDebate = () => {
    if (isDeliberating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsDeliberating(false);
    }
    activeSessionIdRef.current = null;
    setActiveSessionId(null);
    saveActiveSessionId(null);

    setCurrentPrompt('');
    setSteps([]);
    setFinalOutput('');
    setMetrics(undefined);
    setActiveRound(0);
    setErrorMessage(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      saveSessions(next);
      if (activeSessionId === sessionId) {
        if (next.length > 0) {
          setTimeout(() => handleSelectSession(next[0].id), 0);
        } else {
          handleNewDebate();
        }
      }
      return next;
    });
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    saveSessions([]);
    handleNewDebate();
  };

  const startDebate = async (promptText: string) => {
    if (!promptText.trim() || isDeliberating) return;

    const trimmedPrompt = promptText.trim();
    setErrorMessage(null);
    setCurrentPrompt(trimmedPrompt);
    setIsDeliberating(true);
    setActiveRound(1);
    setFinalOutput('');
    setMetrics(undefined);
    setHeartbeat({
      bpm: 72,
      role: 'architect',
      agentName: 'The Architect',
      statusText: 'Convening the Council: Initiating baseline hypothesis generation...',
      taskReminder: 'Synthesizing initial first-principles blueprint.',
      timestamp: Date.now(),
    });

    const initialSteps: DebateStep[] = [
      {
        stepId: 'step-1',
        role: 'architect',
        agentName: 'The Architect',
        provider: (seats.architect.provider as any) || 'gemini',
        model: seats.architect.model || 'gemini-3.8-flash',
        status: 'running',
        content: '',
        timestamp: Date.now(),
      },
      {
        stepId: 'step-2',
        role: 'skeptic',
        agentName: 'The Skeptic',
        provider: (seats.skeptic.provider as any) || 'gemini',
        model: seats.skeptic.model || 'gemini-3.8-flash',
        status: 'pending',
        content: '',
        timestamp: Date.now(),
      },
    ];

    if (protocol === 'quad') {
      initialSteps.push({
        stepId: 'step-3',
        role: 'verifier',
        agentName: 'The Verifier',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'pending',
        content: '',
        timestamp: Date.now(),
      });
    } else if (protocol === 'duel') {
      initialSteps.push({
        stepId: 'step-3',
        role: 'architect',
        agentName: 'The Architect (Rebuttal)',
        provider: (seats.architect.provider as any) || 'gemini',
        model: seats.architect.model || 'gemini-3.8-flash',
        status: 'pending',
        content: '',
        timestamp: Date.now(),
      });
    }

    initialSteps.push({
      stepId: `step-${initialSteps.length + 1}`,
      role: 'synthesizer',
      agentName: 'The Synthesizer',
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      status: 'pending',
      content: '',
      timestamp: Date.now(),
    });

    initialSteps.push({
      stepId: `step-${initialSteps.length + 1}`,
      role: 'arbiter',
      agentName: 'The Arbiter',
      provider: (seats.arbiter.provider as any) || 'gemini',
      model: seats.arbiter.model || 'gemini-3.8-flash',
      status: 'pending',
      content: '',
      timestamp: Date.now(),
    });

    setSteps(initialSteps);

    // Create and persist new session in localStorage
    const newSession = createNewSession(trimmedPrompt, protocol, initialSteps, tone);
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
      const response = await fetch('/api/debate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          protocol,
          tone,
          searchEngine,
          keys,
          seats,
          enableSearchGrounding,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server returned status ${response.status}: ${errText}`);
      }

      if (!response.body) {
        throw new Error('No response stream returned from server.');
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
            await handleServerEvent(data);
          } catch (e) {
            console.warn('Failed to parse SSE payload', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Debate cancelled by user');
      } else {
        console.error('Debate error:', err);
        setErrorMessage(err.message || 'Deliberation council encountered an error.');
        updateActiveSession({
          status: 'error',
          error: err.message || 'Deliberation council encountered an error.',
        });
      }
    } finally {
      setIsDeliberating(false);
      abortControllerRef.current = null;
    }
  };

  const handleServerEvent = async (event: any) => {
    switch (event.type) {
      case 'heartbeat': {
        setHeartbeat({
          bpm: event.bpm || 74,
          role: event.role || 'council',
          agentName: event.agentName || 'Council Heartbeat',
          statusText: event.statusText || 'Active cogitation cadence',
          taskReminder: event.taskReminder,
          timestamp: event.timestamp || Date.now(),
        });
        break;
      }

      case 'round_start': {
        setActiveRound(event.round);
        setSteps((prev) => {
          const next = [...prev];
          const targetIndex = event.round - 1;
          if (next[targetIndex]) {
            next[targetIndex] = {
              ...next[targetIndex],
              status: 'running',
              provider: event.provider,
              model: event.model,
              agentName: event.agentName,
              role: event.role,
            };
          } else {
            next.push({
              stepId: `step-${event.round}`,
              role: event.role,
              agentName: event.agentName,
              provider: event.provider,
              model: event.model,
              status: 'running',
              content: '',
              timestamp: Date.now(),
            });
          }
          return next;
        });
        break;
      }

      case 'token': {
        setSteps((prev) => {
          const next = [...prev];
          const targetIndex = event.round - 1;
          if (next[targetIndex]) {
            next[targetIndex] = {
              ...next[targetIndex],
              content: (next[targetIndex].content || '') + event.token,
            };
          }
          return next;
        });
        break;
      }

      case 'round_complete': {
        setSteps((prev) => {
          const next = [...prev];
          const targetIndex = event.round - 1;
          if (next[targetIndex]) {
            next[targetIndex] = {
              ...next[targetIndex],
              status: 'completed',
              durationMs: event.durationMs,
              content: event.content || next[targetIndex].content,
              summary: event.summary || next[targetIndex].summary,
            };
          }
          updateActiveSession({ steps: next });
          return next;
        });

        // Interactive Arbiter Interjection pause mid-debate on Round 2
        if (event.round === 2 && interjectionEnabled) {
          setActiveRound(2);
          setInterjectionActive(true);
          setInterjectedRound(2);
          // Pause execution and wait for resolver to be called by user submit/bypass action
          await new Promise<void>((resolve) => {
            interjectionResolveRef.current = resolve;
          });
        }
        break;
      }

      case 'complete': {
        setFinalOutput(event.finalOutput);
        setMetrics(event.metrics);
        setIsDeliberating(false);
        setSteps((latestSteps) => {
          updateActiveSession({
            status: 'completed',
            finalOutput: event.finalOutput,
            metrics: event.metrics,
            steps: latestSteps,
          });
          return latestSteps;
        });
        break;
      }

      case 'warning': {
        console.warn('Debate warning:', event.message);
        break;
      }

      case 'error': {
        setErrorMessage(event.message);
        setIsDeliberating(false);
        updateActiveSession({
          status: 'error',
          error: event.message,
        });
        break;
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDeliberating(false);
  };

  return (
    <div className={`flex min-h-screen flex-col bg-[#050609] text-[#cbd5e1] antialiased selection:bg-[#28324a] selection:text-white transition-colors duration-300 ${theme}`}>
      {/* Prominent Top Beta Testing Status Bar */}
      <div className="w-full bg-gradient-to-r from-[#0d101a] via-[#121625] to-[#0d101a] border-b border-indigo-500/30 px-4 py-1 text-center text-[11px] font-mono font-semibold text-indigo-300 flex items-center justify-center gap-2 shadow-xs">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.2 rounded-full text-[9.5px]">
          Beta Testing Mode
        </span>
        <span className="hidden sm:inline text-slate-400">•</span>
        <span className="hidden sm:inline text-slate-300">
          Synthexis Strategic Lab v2.5 Active Development
        </span>
        <span className="text-slate-500 hidden md:inline">|</span>
        <button
          type="button"
          onClick={() => setIsTourOpen(true)}
          className="underline text-indigo-300 hover:text-white transition-colors text-[10.5px]"
        >
          Take Guided Workspace Tour
        </button>
      </div>

      {/* Header */}
      <Header
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenCouncil={() => setIsCouncilOpen(true)}
        onOpenExplainer={() => setIsExplainerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        onNewDebate={handleNewDebate}
        sessionCount={sessions.length}
        keys={keys}
        protocol={protocol}
        viewMode={viewMode}
        onSelectViewMode={handleSelectViewMode}
        heartbeat={heartbeat}
        isDeliberating={isDeliberating}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          setUser(null);
          localStorage.removeItem(STORAGE_USER);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        interjectionEnabled={interjectionEnabled}
        onToggleInterjection={handleToggleInterjection}
      />

      {/* Main Workspace Area */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-900/60 bg-rose-950/20 p-4 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-300">Council Pipeline Notice:</span>{' '}
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white font-mono transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* View Mode Router */}
        {viewMode === 'chat' && (
          <div className="h-[calc(100vh-140px)] min-h-[640px] max-w-5xl mx-auto w-full">
            <ChatWindow
              currentPrompt={currentPrompt}
              isDeliberating={isDeliberating}
              steps={steps}
              finalOutput={finalOutput}
              metrics={metrics}
              heartbeat={heartbeat}
              protocol={protocol}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewDebate={handleNewDebate}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onStartDebate={startDebate}
              onCancel={handleCancel}
              onOpenCouncilWindow={() => handleSelectViewMode('council')}
              onRestoreSnapshot={handleRestoreSnapshot}
            />
          </div>
        )}

        {viewMode === 'council' && (
          <div className="h-[calc(100vh-140px)] min-h-[640px] max-w-6xl mx-auto w-full">
            <CouncilChamberWindow
              currentPrompt={currentPrompt}
              isDeliberating={isDeliberating}
              activeRound={activeRound}
              steps={steps}
              protocol={protocol}
              tone={tone}
              seats={seats}
              keys={keys}
              heartbeat={heartbeat}
              finalOutput={finalOutput}
              metrics={metrics}
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onOpenVault={() => setIsVaultOpen(true)}
              onOpenCouncil={() => setIsCouncilOpen(true)}
              onOpenExplainer={() => setIsExplainerOpen(true)}
              onOpenChatWindow={() => handleSelectViewMode('chat')}
              interjectionEnabled={interjectionEnabled}
              onToggleInterjection={handleToggleInterjection}
              interjectionActive={interjectionActive}
              onSetInterjectionActive={setInterjectionActive}
              interjectionText={interjectionText}
              onSetInterjectionText={handleSetInterjectionText}
              onSubmitInterjection={handleSubmitInterjection}
              onBypassInterjection={handleBypassInterjection}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-[calc(100vh-140px)] min-h-[640px] w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChatWindow
              currentPrompt={currentPrompt}
              isDeliberating={isDeliberating}
              steps={steps}
              finalOutput={finalOutput}
              metrics={metrics}
              heartbeat={heartbeat}
              protocol={protocol}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewDebate={handleNewDebate}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onStartDebate={startDebate}
              onCancel={handleCancel}
              onOpenCouncilWindow={() => handleSelectViewMode('council')}
              onRestoreSnapshot={handleRestoreSnapshot}
            />
            <CouncilChamberWindow
              currentPrompt={currentPrompt}
              isDeliberating={isDeliberating}
              activeRound={activeRound}
              steps={steps}
              protocol={protocol}
              tone={tone}
              seats={seats}
              keys={keys}
              heartbeat={heartbeat}
              finalOutput={finalOutput}
              metrics={metrics}
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onOpenVault={() => setIsVaultOpen(true)}
              onOpenCouncil={() => setIsCouncilOpen(true)}
              onOpenExplainer={() => setIsExplainerOpen(true)}
              onOpenChatWindow={() => handleSelectViewMode('chat')}
              interjectionEnabled={interjectionEnabled}
              onToggleInterjection={handleToggleInterjection}
              interjectionActive={interjectionActive}
              onSetInterjectionActive={setInterjectionActive}
              interjectionText={interjectionText}
              onSetInterjectionText={handleSetInterjectionText}
              onSubmitInterjection={handleSubmitInterjection}
              onBypassInterjection={handleBypassInterjection}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <SessionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        onNewDebate={handleNewDebate}
        keys={keys}
      />

      <VaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        keys={keys}
        onSaveKeys={handleSaveKeys}
      />

      <CouncilConfigModal
        isOpen={isCouncilOpen}
        onClose={() => setIsCouncilOpen(false)}
        protocol={protocol}
        onSelectProtocol={handleSelectProtocol}
        tone={tone}
        onSelectTone={handleSelectTone}
        searchEngine={searchEngine}
        onSelectSearchEngine={handleSelectSearchEngine}
        seats={seats}
        onUpdateSeat={handleUpdateSeat}
        keys={keys}
        onOpenVault={() => setIsVaultOpen(true)}
        enableSearchGrounding={enableSearchGrounding}
        onToggleSearchGrounding={handleToggleSearchGrounding}
      />

      <ExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />

      <GoogleAuthModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(profile) => {
          setUser(profile);
          localStorage.setItem(STORAGE_USER, JSON.stringify(profile));
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <GettingStartedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
