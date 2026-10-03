/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ConsoleTab } from './components/console/Sidebar';
import { TopBar, ProductMode } from './components/console/TopBar';
import { ResearchConversationView } from './components/console/ResearchConversationView';
import { ResearchNotesView } from './components/console/ResearchNotesView';
import { ModelsSynthexisView } from './components/console/ModelsSynthexisView';
import { WorkspaceSettingsView } from './components/console/WorkspaceSettingsView';
import { LandingPageView } from './components/console/LandingPageView';
import { CommandPaletteModal } from './components/console/CommandPaletteModal';
import { BreezySidebar, BreezyTab } from './components/breezy/BreezySidebar';
import { BreezyWorkspace } from './components/breezy/BreezyWorkspace';
import { BreezyIdeWorkspace } from './components/breezy/BreezyIdeWorkspace';
import { BreezyCanvasWorkspace } from './components/breezy/BreezyCanvasWorkspace';
import { ProfileSettingsModal } from './components/console/ProfileSettingsModal';
import { authService } from './services/authService';
import { userProfileService } from './services/userProfileService';
import { googleDriveService } from './services/googleDriveService';

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
    if (['chat', 'notes', 'models', 'settings', 'landing'].includes(hash)) {
      return hash as ConsoleTab;
    }
    return 'chat';
  });

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };
  const [productMode, setProductMode] = useState<ProductMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'synthexis' || modeParam === 'breezy') {
      return modeParam;
    }
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('synthexis')) return 'synthexis';

    const saved = localStorage.getItem('breezy_product_mode');
    if (saved === 'synthexis' || saved === 'breezy') {
      return saved as ProductMode;
    }
    return 'breezy';
  });

  useEffect(() => {
    localStorage.setItem('breezy_product_mode', productMode);
  }, [productMode]);

  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [breezyTab, setBreezyTab] = useState<BreezyTab>('chat');

  // Breezy chat states
  const [breezyChats, setBreezyChats] = useState<Record<string, any>>(() => {
    try {
      const profile = userProfileService.getProfile();
      if (profile.autoSaveToDrive) {
        const raw = localStorage.getItem('breezy:chats');
        return raw ? JSON.parse(raw) : {};
      }
      return {};
    } catch {
      return {};
    }
  });

  const [breezyActiveId, setBreezyActiveId] = useState<string | null>(null);

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
    
    const profile = userProfileService.getProfile();
    if (profile.autoSaveToDrive) {
      try {
        localStorage.setItem('breezy:chats', JSON.stringify(next));
      } catch {}
    }
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

  // Sessions and debate states
  const [sessions, setSessions] = useState<DebateSession[]>(() => {
    const profile = userProfileService.getProfile();
    if (profile.autoSaveToDrive) {
      return loadSessions() || [createNewSession('First Inquiry', 'trio', [], 'balanced')];
    }
    return [createNewSession('First Inquiry', 'trio', [], 'balanced')];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => sessions[0]?.id || null);
  const [synthexisMode, setSynthexisMode] = useState(true);

  const handleToggleSynthexisMode = () => setSynthexisMode((prev) => !prev);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [streamingText, setStreamingText] = useState('');
  const [streamingRole, setStreamingRole] = useState('Analyst');
  const [researchEvents, setResearchEvents] = useState<string[]>([]);
  const [appToast, setAppToast] = useState<string | null>(null);

  useEffect(() => {
    const profile = userProfileService.getProfile();
    if (profile.autoSaveToDrive) {
      saveSessions(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    const profile = userProfileService.getProfile();
    if (profile.autoSaveToDrive && activeSessionId) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Global Auto-save to Drive logic for Synthexis Research
  useEffect(() => {
    const profile = userProfileService.getProfile();
    if (!profile.autoSaveToDrive || !currentSession || isDeliberating) return;
    
    const token = authService.getAccessToken();
    if (!token) return;

    const timeout = setTimeout(async () => {
      try {
        await googleDriveService.initialize(token);
        await googleDriveService.saveResearch(currentSession);
        console.log('Synthexis background auto-save complete.');
      } catch (e) {
        console.warn('Synthexis auto-save failed:', e);
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
    const fresh = createNewSession('New Inquiry', 'trio', [], 'balanced');
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setActiveTab('chat');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setActiveTab('chat');
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
      toast('No AI providers configured. Please add an API key in Settings (BYOK) to run deliberations.');
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
    setResearchEvents([
      !synthexisMode 
        ? `Starting lightweight single-model query: "${promptText.slice(0, 50)}..."` 
        : `Starting multi-model synthexis audit: "${promptText.slice(0, 50)}..."`
    ]);

    const protocol = !synthexisMode ? 'solo' : depthMode === 'solo' ? 'solo' : depthMode === 'deep' ? 'deep' : currentSession?.protocol || 'trio';
    const tone: DebateTone = 'balanced';
    const searchEngine: SearchEngineProvider = 'google';
    const seats = providerConfigService.getSeatsPayload();

    const config = providerConfigService.getConfig();
    const agreementThreshold = config.agreementThreshold ?? 78;
    const autoResolve = config.autoResolve ?? true;
    const selectedRound = config.selectedRound ?? 2;

    const newSession = createNewSession(promptText, protocol as any, [], tone);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);

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
          agreementThreshold,
          autoResolve,
          selectedRound,
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
            } else if (data.type === 'complete') {
              setResearchEvents((prev) => [...prev, "Research complete."]);
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
                    metrics: data.metrics || s.metrics,
                  };
                });
              });
              setIsDeliberating(false);
            } else if (data.type === 'error') {
              const errorMessage = data.message || data.error || 'Research failed on server.';
              setResearchEvents((prev) => [...prev, `Error: ${errorMessage}`]);
              setIsDeliberating(false);
            }
          },
        }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Debate cancelled');
      } else {
        console.error('Debate error:', err);
        const errorMessage = err?.message || 'Research engine failure';
        setResearchEvents((prev) => [...prev, `Critical Error: ${errorMessage}`]);
        toast(`Engine Error: ${errorMessage}. Check your network or provider keys.`);
      }
    } finally {
      setIsDeliberating(false);
      abortControllerRef.current = null;
    }
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
  };

  if (productMode === 'breezy') {
    return (
      <div className={`flex min-h-screen font-sans antialiased overflow-x-hidden bg-[#090d16] text-slate-100`}>
        <BreezySidebar
          activeTab={breezyTab}
          onSelectTab={setBreezyTab}
          chats={breezyChats}
          activeId={breezyActiveId}
          onSelectChat={setBreezyActiveId}
          onNewChat={handleNewBreezyChat}
          onDeleteChat={handleDeleteBreezyChat}
          onOpenProfile={() => setIsProfileSettingsOpen(true)}
          onSwitchToSynthexis={() => setProductMode('synthexis')}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <div className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'pl-0 lg:pl-64' : 'pl-0'}`}>
          <TopBar
            productMode={productMode}
            onSelectProductMode={setProductMode}
            onOpenSearch={() => setIsCommandPaletteOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            onToggleMobileMenu={handleToggleSidebar}
          />

          <main className="relative pt-16 flex-1 flex flex-col min-h-0">
            {breezyTab === 'chat' && (
              <BreezyWorkspace
                onOpenSettings={() => setIsProfileSettingsOpen(true)}
                toast={toast}
                chats={breezyChats}
                activeId={breezyActiveId}
                onSelectChat={setBreezyActiveId}
                onUpdateChats={(next) => {
                  setBreezyChats(next);
                  const profile = userProfileService.getProfile();
                  if (profile.autoSaveToDrive) {
                    try {
                      localStorage.setItem('breezy:chats', JSON.stringify(next));
                    } catch {}
                  }
                }}
                onNewChat={handleNewBreezyChat}
                onSwitchToSynthexis={() => {
                  setProductMode('synthexis');
                  toast('Switched to Synthexis Research Console.');
                }}
                isSidebarOpen={isSidebarOpen}
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
          </main>
        </div>

        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectTab={setActiveTab}
          sessions={sessions}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewDebate}
          onSelectProductMode={setProductMode}
        />

        {appToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e2d] text-stone-100 px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
            <span>{appToast}</span>
          </div>
        )}

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
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewDebate}
        synthexisMode={synthexisMode}
        onToggleSynthexisMode={handleToggleSynthexisMode}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenProfile={() => setIsProfileSettingsOpen(true)}
        onDeleteSession={handleDeleteSession}
        onSwitchToBreezy={() => setProductMode('breezy')}
      />

      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'pl-0 lg:pl-64' : 'pl-0'}`}>
        <TopBar
          productMode={productMode}
          onSelectProductMode={setProductMode}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onToggleMobileMenu={handleToggleSidebar}
        />

        <main className="relative pt-16 bg-stone-950 min-h-screen flex-1 flex flex-col">
          {activeTab === 'chat' && (
            currentSession ? (
              <ResearchConversationView
                session={currentSession}
                isDeliberating={isDeliberating}
                activeRound={activeRound}
                streamingRoundText={streamingText}
                streamingRole={streamingRole}
                onStartDebate={startDebate}
                researchEvents={researchEvents}
                onSaveNote={(title, content) => {
                  const newNoteSession = createNewSession(title, currentSession.protocol as any, [], currentSession.tone);
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
                onOpenNotes={() => setActiveTab('notes')}
                onOpenInBreezy={(s) => {
                  handleNewBreezyChat();
                  setProductMode('breezy');
                  setBreezyTab('chat');
                  toast('Transferred session to Breezy AI.');
                }}
                onOpenInIde={(s) => {
                  const codeMatch = s.finalOutput?.match(/```(?:python|javascript|typescript|html|bash|json)?\n([\s\S]*?)```/);
                  const codeContent = codeMatch
                    ? codeMatch[1]
                    : `# Research Output\n# Topic: ${s.prompt}\n\n"""\n${s.finalOutput?.slice(0, 600) || ''}\n"""\n`;
                  localStorage.setItem('breezy_ide_active_code', codeContent);
                  setProductMode('breezy');
                  setBreezyTab('ide');
                }}
                onPinToCanvas={(s) => {
                  const newCard = {
                    id: `card-${Date.now()}`,
                    type: 'research',
                    title: s.prompt.slice(0, 60),
                    content: s.finalOutput?.slice(0, 400) || s.prompt,
                    color: 'violet',
                    tags: ['Synthexis', s.protocol || 'Research'],
                    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  };
                  try {
                    const raw = localStorage.getItem('breezy:canvas:cards');
                    const existing = raw ? JSON.parse(raw) : [];
                    localStorage.setItem('breezy:canvas:cards', JSON.stringify([newCard, ...existing]));
                  } catch {}
                  setProductMode('breezy');
                  setBreezyTab('canvas');
                  toast('Pinned research findings to Breezy Canvas.');
                }}
              />
            ) : (
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
            )
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
              onSync={() => {
                const refreshed = loadSessions();
                setSessions(refreshed || []);
              }}
            />
          )}

          {activeTab === 'models' && (
            <ModelsSynthexisView onOpenSettings={() => setActiveTab('settings')} />
          )}

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

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewDebate}
        onSelectProductMode={setProductMode}
      />

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        keys={keys}
        onSaveKeys={handleSaveKeys}
      />

      {appToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e2d] text-stone-100 px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          <span>{appToast}</span>
        </div>
      )}
    </div>
  );
}
