/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ConsoleTab } from './components/console/Sidebar';
import { TopBar } from './components/console/TopBar';
import { ResearchConversationView } from './components/console/ResearchConversationView';
import { ResearchNotesView } from './components/console/ResearchNotesView';
import { ModelsSynthexisView } from './components/console/ModelsSynthexisView';
import { WorkspaceSettingsView } from './components/console/WorkspaceSettingsView';
import { LandingPageView } from './components/console/LandingPageView';
import { GuideView } from './components/console/GuideView';
import { ChatView } from './components/console/ChatView';
import { CommandPaletteModal } from './components/console/CommandPaletteModal';
import { BreezyIdeWorkspace } from './components/breezy/BreezyIdeWorkspace';
import { BreezyCanvasWorkspace } from './components/breezy/BreezyCanvasWorkspace';
import { ProfileSettingsModal } from './components/console/ProfileSettingsModal';
import { authService } from './services/authService';
import { userProfileService } from './services/userProfileService';
import { googleDocsService } from './services/googleDocsService';

import {
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
} from './services/sessionStorage';
import { exportSynthexisAsMarkdown } from './utils/exportTranscript';
import { apiClient } from './services/apiClient';
import { providerConfigService } from './services/providerConfigService';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ConsoleTab>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['landing', 'chat', 'research', 'history', 'notes', 'models', 'docs', 'settings', 'build', 'canvas'].includes(hash)) {
      return hash as ConsoleTab;
    }
    return 'research';
  });

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  // Sessions and debate states
  const [sessions, setSessions] = useState<DebateSession[]>(() => {
    const profile = userProfileService.getProfile();
    if (profile.autoSaveToDrive) {
      return loadSessions() || [];
    }
    return loadSessions() || [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => loadActiveSessionId() || sessions[0]?.id || null);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [streamingText, setStreamingText] = useState('');
  const [streamingRole, setStreamingRole] = useState('Analyst');
  const [researchEvents, setResearchEvents] = useState<string[]>([]);
  const [appToast, setAppToast] = useState<string | null>(null);
  const [activeRoundStartedAt, setActiveRoundStartedAt] = useState<number | null>(null);
  const [liveUsage, setLiveUsage] = useState<any>(null);
  const [heartbeatState, setHeartbeatState] = useState<any>(null);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Google Docs archive sync
  useEffect(() => {
    const profile = userProfileService.getProfile();
    if (!profile.autoSaveToDrive || !currentSession || isDeliberating) return;

    const token = authService.getAccessToken();
    if (!token) return;

    const savedKey = 'breezy_google_doc_saved_' + currentSession.id;
    if (localStorage.getItem(savedKey) === '1') return;

    const timeout = setTimeout(async () => {
      try {
        await googleDocsService.saveResearchSession(currentSession);
        localStorage.setItem(savedKey, '1');
        console.log('Breezy Research Google Docs archive sync complete.');
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [sessions, activeSessionId, isDeliberating]);

  const toast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 3500);
  };

  const keys = providerConfigService.getKeys();
  const handleSaveKeys = (newKeys: any) => {
    providerConfigService.saveKeys(newKeys);
    toast('API keys saved successfully.');
  };

  const handleNewDebate = () => {
    const fresh = createNewSession('New Investigation', 'trio', [], 'balanced');
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setActiveTab('research');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setActiveTab('research');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    if (activeSessionId === id) {
      setActiveSessionId(next.length > 0 ? next[0].id : null);
    }
  };

  const activeSessionIdRef = useRef(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startDebate = async (customPrompt?: string, depthMode?: string) => {
    const promptText = customPrompt || currentSession?.prompt;
    if (!promptText || !promptText.trim()) return;

    const configuredList = providerConfigService.getConfiguredProviders();
    let serverGeminiAvailable = false;
    try {
      const health = await apiClient.getHealth();
      serverGeminiAvailable = !!health.serverGeminiConfigured;
    } catch {}

    if (configuredList.length === 0 && !serverGeminiAvailable) {
      toast('No AI providers configured. Please add an API key in Settings (BYOK).');
      setIsProfileSettingsOpen(true);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsDeliberating(true);
    setActiveRound(1);
    setStreamingText('');
    setActiveRoundStartedAt(Date.now());
    setLiveUsage(null);
    setHeartbeatState(null);
    setResearchEvents([`Initiating multi-model research investigation: "${promptText.slice(0, 50)}..."`]);

    const protocol = depthMode === 'solo' ? 'solo' : depthMode === 'deep' ? 'deep' : currentSession?.protocol || 'trio';
    const tone: DebateTone = 'balanced';
    const searchEngine: SearchEngineProvider = providerConfigService.getConfig().searchEngine || 'duckduckgo';
    const seats = providerConfigService.getSeatsPayload();

    const config = providerConfigService.getConfig();
    const autoResolve = config.autoResolve ?? true;
    const selectedRound = config.selectedRound ?? 2;

    const newSession = createNewSession(promptText, protocol as any, [], tone);
    newSession.searchEngine = searchEngine;
    newSession.enableSearchGrounding = true;
    newSession.researchMethod = config.researchMethod || 'adaptive';
    newSession.heartbeatEnabled = config.heartbeatEnabled !== false;
    newSession.heartbeatIntervalSec = config.heartbeatIntervalSec || 60;
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveTab('research');

    try {
      await apiClient.streamDebate(
        {
          prompt: promptText,
          protocol,
          tone,
          searchEngine,
          keys,
          seats,
          enableSearchGrounding: true,
          autoResolve,
          selectedRound,
          researchMethod: config.researchMethod || 'adaptive',
          heartbeatEnabled: config.heartbeatEnabled !== false,
          heartbeatIntervalSec: config.heartbeatIntervalSec || 60,
        },
        {
          signal: controller.signal,
          onEvent: (data) => {
            if (data.type === 'status') {
              setResearchEvents((prev) => [...prev, data.message]);
              if (data.role) {
                if (data.role === 'architect') setActiveRound(1);
                if (data.role === 'skeptic') setActiveRound(2);
                if (data.role === 'verifier') setActiveRound(3);
                if (data.role === 'arbiter') setActiveRound(4);
                setStreamingRole(data.agentName || data.role);
              }
            } else if (data.type === 'round_start') {
              setActiveRound(data.round || 1);
              setStreamingText('');
              setStreamingRole(data.agentName || data.role);
              setActiveRoundStartedAt(Date.now());
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                return prev.map((s) => {
                  if (s.id !== currentId) return s;
                  const updatedSteps = [...s.steps];
                  const idx = (data.round || 1) - 1;
                  if (updatedSteps[idx]) {
                    updatedSteps[idx] = {
                      ...updatedSteps[idx],
                      status: 'running',
                      agentName: data.agentName || updatedSteps[idx].agentName,
                      provider: data.provider || updatedSteps[idx].provider,
                      model: data.model || updatedSteps[idx].model,
                      role: data.role || updatedSteps[idx].role,
                    };
                  }
                  return { ...s, steps: updatedSteps };
                });
              });
            } else if (data.type === 'token') {
              setStreamingText((prev) => prev + (data.token || ''));
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                return prev.map((s) => {
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
              });
            } else if (data.type === 'round_complete') {
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                return prev.map((s) => {
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
              });
            } else if (data.type === 'usage') {
              setLiveUsage((prev: any) => {
                const next = { ...(prev || {}), ...(data.usage || {}) };
                if (data.round) next.round = data.round;
                return next;
              });
            } else if (data.type === 'heartbeat') {
              setHeartbeatState(data);
              if (data.statusText) setResearchEvents((prev) => [...prev, data.statusText]);
            } else if (data.type === 'research_plan') {
              const plan = Array.isArray(data.plan) ? data.plan : [];
              setResearchEvents((prev) => [
                ...prev,
                plan.length ? 'Research plan established: ' + plan.slice(0, 3).join(' · ') : 'Research plan established.',
              ]);
            } else if (data.type === 'search_grounding') {
              if (data.sources) {
                setSessions((prev) => {
                  const currentId = activeSessionIdRef.current;
                  return prev.map((s) => (s.id === currentId ? { ...s, sources: data.sources } : s));
                });
              }
            } else if (data.type === 'complete') {
              setResearchEvents((prev) => [...prev, 'Research investigation complete.']);
              setSessions((prev) => {
                const currentId = activeSessionIdRef.current;
                return prev.map((s) => {
                  if (s.id !== currentId) return s;
                  return {
                    ...s,
                    status: 'completed' as const,
                    finalOutput: data.finalOutput || s.finalOutput,
                    evidenceGraph: data.evidenceGraph || s.evidenceGraph,
                    researchMetrics: data.researchMetrics || s.researchMetrics,
                    usage: data.usage || s.usage,
                    metrics: data.metrics || s.metrics,
                  };
                });
              });
              setIsDeliberating(false);
              setActiveRoundStartedAt(null);
            } else if (data.type === 'error') {
              const errorMessage = data.message || data.error || 'Research failed on server.';
              setResearchEvents((prev) => [...prev, `Error: ${errorMessage}`]);
              setIsDeliberating(false);
              setActiveRoundStartedAt(null);
              toast(`Investigation error: ${errorMessage}`);
            }
          },
        }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Debate cancelled');
      } else {
        console.error('Debate error:', err);
        const errorMessage = err?.message || 'Research failure';
        setResearchEvents((prev) => [...prev, `Critical Error: ${errorMessage}`]);
        toast(`Engine Error: ${errorMessage}. Check your network or provider keys.`);
      }
    } finally {
      setIsDeliberating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSteerCurrentResearch = (instruction: string) => {
    if (!currentSession || !instruction.trim()) return;
    const transcript = (currentSession.steps || [])
      .filter((step) => step.content)
      .map((step) => `[Round ${step.role}] ${step.content}`)
      .join('\n\n')
      .slice(-16000);
    const branchedPrompt = `${currentSession.prompt}\n\nUSER STEERING INPUT:\n${instruction.trim()}\n\nCURRENT DEBATE STATE:\n${transcript}\n\nContinue the research with the user's steering input treated as the newest instruction.`;
    toast('Steering the research into a new branch…');
    startDebate(branchedPrompt, currentSession.protocol === 'solo' ? 'solo' : 'deep');
  };

  const handleExportMarkdown = () => {
    if (!currentSession) return;
    exportSynthexisAsMarkdown({
      prompt: currentSession.prompt,
      protocol: currentSession.protocol,
      steps: currentSession.steps,
      finalOutput: currentSession.finalOutput,
      metrics: currentSession.metrics,
    });
    toast('Transcript exported as Markdown.');
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Stitch Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewDebate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenProfile={() => setIsProfileSettingsOpen(true)}
        onDeleteSession={handleDeleteSession}
        onOpenGuide={() => setActiveTab('docs')}
      />

      {/* Main Content Layout with Fixed TopBar */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'pl-0 lg:pl-[260px]' : 'pl-0'}`}>
        <TopBar
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onToggleMobileMenu={handleToggleSidebar}
          isDeliberating={isDeliberating}
          onOpenProfile={() => setIsProfileSettingsOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
        />

        <main className="relative pt-16 bg-surface min-h-screen flex-1 flex flex-col pb-16 lg:pb-0">
          {activeTab === 'landing' && (
            <LandingPageView
              onLaunchWorkspace={(query, depth) => {
                if (query) {
                  startDebate(query, depth);
                } else {
                  setActiveTab('research');
                }
              }}
              onOpenNotes={() => setActiveTab('history')}
              onOpenModels={() => setActiveTab('models')}
              onOpenDocs={() => setActiveTab('docs')}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              onOpenHistory={() => setActiveTab('history')}
              onOpenSettings={() => setActiveTab('settings')}
              onStartDeepResearch={(query) => {
                startDebate(query);
                setActiveTab('research');
              }}
            />
          )}

          {activeTab === 'research' && (
            <ResearchConversationView
              session={currentSession}
              isDeliberating={isDeliberating}
              activeRound={activeRound}
              streamingRoundText={streamingText}
              streamingRole={streamingRole}
              activeRoundStartedAt={activeRoundStartedAt}
              liveUsage={liveUsage}
              heartbeatState={heartbeatState}
              onStartDebate={startDebate}
              onSteer={handleSteerCurrentResearch}
              researchEvents={researchEvents}
              onSaveNote={(title, content) => {
                const newNoteSession = createNewSession(title, currentSession?.protocol as any || 'trio', [], currentSession?.tone || 'balanced');
                newNoteSession.finalOutput = content;
                setSessions((prev) => {
                  const next = [newNoteSession, ...prev];
                  saveSessions(next);
                  return next;
                });
                toast('Note saved to research archive.');
              }}
              onExportMarkdown={handleExportMarkdown}
              keys={keys}
              onOpenNotes={() => setActiveTab('history')}
              onOpenInIde={(s) => {
                const codeMatch = s.finalOutput?.match(/```(?:python|javascript|typescript|html|bash|json)?\n([\s\S]*?)```/);
                const codeContent = codeMatch
                  ? codeMatch[1]
                  : `# Research Output\n# Topic: ${s.prompt}\n\n"""\n${s.finalOutput?.slice(0, 600) || ''}\n"""\n`;
                localStorage.setItem('breezy_ide_active_code', codeContent);
                setActiveTab('build');
              }}
              onPinToCanvas={(s) => {
                const newCard = {
                  id: `card-${Date.now()}`,
                  type: 'research',
                  title: s.prompt.slice(0, 60),
                  content: s.finalOutput?.slice(0, 400) || s.prompt,
                  color: 'cyan',
                  tags: ['Breezy', s.protocol || 'Research'],
                  createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                };
                try {
                  const raw = localStorage.getItem('breezy:canvas:cards');
                  const existing = raw ? JSON.parse(raw) : [];
                  localStorage.setItem('breezy:canvas:cards', JSON.stringify([newCard, ...existing]));
                } catch {}
                setActiveTab('canvas');
                toast('Pinned research findings to Canvas.');
              }}
            />
          )}

          {(activeTab === 'history' || activeTab === 'notes') && (
            <ResearchNotesView
              sessions={sessions}
              onSelectNotePrompt={(prompt) => {
                if (prompt) {
                  startDebate(prompt);
                }
                setActiveTab('research');
              }}
              onSync={() => {
                const refreshed = loadSessions();
                setSessions(refreshed || []);
              }}
            />
          )}

          {activeTab === 'models' && (
            <ModelsSynthexisView onOpenSettings={() => setActiveTab('settings')} />
          )}

          {activeTab === 'docs' && <GuideView />}

          {activeTab === 'settings' && (
            <WorkspaceSettingsView
              keys={keys}
              onSaveKeys={handleSaveKeys}
              onConnectWorkspace={async (scopeType: string) => {
                const scopeMap: Record<string, string[]> = {
                  drive: ['https://www.googleapis.com/auth/drive.readonly'],
                  docs: ['https://www.googleapis.com/auth/documents.readonly'],
                  sheets: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
                  gmail: ['https://www.googleapis.com/auth/gmail.readonly'],
                  calendar: ['https://www.googleapis.com/auth/calendar.readonly'],
                };
                const scopes = scopeMap[scopeType] || ['https://www.googleapis.com/auth/drive.readonly'];
                const token = await authService.requestWorkspaceScopes(scopes);
                if (token) {
                  toast(`Successfully connected Google ${scopeType} scope.`);
                } else {
                  toast(`Failed to authorize Google ${scopeType} scope.`);
                }
              }}
            />
          )}

          {activeTab === 'build' && (
            <BreezyIdeWorkspace onOpenSettings={() => setIsProfileSettingsOpen(true)} />
          )}

          {activeTab === 'canvas' && (
            <BreezyCanvasWorkspace onOpenSettings={() => setIsProfileSettingsOpen(true)} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 flex justify-around items-center h-16 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.35)]"
      >
        {[
          { id: 'chat' as const, label: 'Chat', icon: 'chat_bubble' },
          { id: 'research' as const, label: 'Research', icon: 'psychology' },
          { id: 'history' as const, label: 'History', icon: 'history' },
          { id: 'models' as const, label: 'Models', icon: 'hub' },
          { id: 'docs' as const, label: 'Docs', icon: 'menu_book' },
          { id: 'settings' as const, label: 'Settings', icon: 'settings' },
        ].map((item) => {
          const active = activeTab === item.id || (item.id === 'history' && activeTab === 'notes');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] h-12 rounded-lg transition-colors gap-0.5 ${
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="font-sans text-[11px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

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

      {appToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <span>{appToast}</span>
        </div>
      )}
    </div>
  );
}
