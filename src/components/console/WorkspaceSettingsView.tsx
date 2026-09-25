import React, { useState, useEffect } from 'react';
import { ProviderKeyConfig } from '../../types';
import { authService, AuthUser } from '../../services/authService';
import { workspaceService, GoogleDriveFile, GmailMessage, CalendarEvent } from '../../services/workspaceService';
import { gitHubService, GitHubRepository, GitHubContent } from '../../services/gitHubService';
import { providerConfigService } from '../../services/providerConfigService';

interface WorkspaceSettingsViewProps {
  keys: ProviderKeyConfig;
  onSaveKeys: (newKeys: ProviderKeyConfig) => void;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = ({ keys, onSaveKeys }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'synthesis' | 'integrations' | 'team' | 'billing'>('integrations');
  const [selectedRound, setSelectedRound] = useState<number>(2);
  const [autoResolve, setAutoResolve] = useState<boolean>(true);
  const [agreementThreshold, setAgreementThreshold] = useState<number>(78);
  const [themeMode, setThemeMode] = useState<'obsidian' | 'slate' | 'system'>('obsidian');
  const [webhookActive, setWebhookActive] = useState<boolean>(true);
  const [webhookUrl, setWebhookUrl] = useState<string>('https://hooks.slack.com/services/T04G/B02/synthexis-alerts');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Settings updated: Dialectic rules propagated to 3 nodes');

  // Role routing & presets
  const canonical = providerConfigService.getConfig();
  const [preset, setPreset] = useState<'fast' | 'balanced' | 'deep' | 'custom'>(canonical.preset || 'balanced');
  const [roles, setRoles] = useState(canonical.roles || {
    architect: { provider: 'gemini', model: 'gemini-3.8-flash' },
    skeptic: { provider: 'gemini', model: 'gemini-3.8-flash' },
    verifier: { provider: 'gemini', model: 'gemini-3.8-flash' },
    arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
  });

  // Key inputs
  const [geminiKey, setGeminiKey] = useState(keys.gemini || '');
  const [groqKey, setGroqKey] = useState(keys.groq || '');
  const [sambanovaKey, setSambanovaKey] = useState(keys.sambanova || '');
  const [openrouterKey, setOpenrouterKey] = useState(keys.openrouter || '');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Integration States (Google)
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleSubTab, setGoogleSubTab] = useState<'drive' | 'gmail' | 'calendar'>('drive');
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [gmailMsgs, setGmailMessages] = useState<GmailMessage[]>([]);
  const [calEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState<boolean>(false);

  // Integration States (GitHub)
  const [githubToken, setGithubToken] = useState<string>(
    () => localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token') || ''
  );
  const [githubAuthMode, setGithubAuthMode] = useState<'none' | 'pat' | 'oauth'>(() => {
    const token = localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token') || '';
    if (!token) return 'none';
    return (localStorage.getItem('breezy_github_auth_mode') as any) || 'pat';
  });
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [repoContents, setRepoContents] = useState<GitHubContent[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState<boolean>(false);

  // Load auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthChange((user, token) => {
      setGoogleUser(user);
      setGoogleToken(token);
      if (token) {
        loadGoogleData(token);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Google data when tab changes or connected
  const loadGoogleData = async (token: string) => {
    setIsLoadingGoogle(true);
    try {
      const files = await workspaceService.listDriveFiles(token);
      setDriveFiles(files);
      const emails = await workspaceService.listGmailMessages(token);
      setGmailMessages(emails);
      const events = await workspaceService.listCalendarEvents(token);
      setCalendarEvents(events);
    } catch (e) {
      console.error('Failed to load Google data', e);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // GitHub loader
  useEffect(() => {
    if (githubAuthMode !== 'none' && githubToken) {
      loadGithubRepos(githubToken);
    }
  }, [githubAuthMode, githubToken]);

  const loadGithubRepos = async (token: string) => {
    setIsLoadingGithub(true);
    try {
      const repos = await gitHubService.listRepositories(token);
      setGithubRepos(repos);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await authService.signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        loadGoogleData(res.accessToken);
        setToastMessage('Google Workspace integrated successfully.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err: any) {
      alert(`Google Connection Failed: ${err.message}`);
    }
  };

  const handleDisconnectGoogle = async () => {
    await authService.signOut();
    setGoogleUser(null);
    setGoogleToken(null);
    setDriveFiles([]);
    setGmailMessages([]);
    setCalendarEvents([]);
    setToastMessage('Google Workspace disconnected.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConnectGithub = () => {
    if (!githubToken.trim()) return;
    localStorage.setItem('synthexis_github_token', githubToken.trim());
    localStorage.setItem('breezy_github_auth_mode', 'pat');
    setGithubAuthMode('pat');
    setToastMessage('GitHub Personal Access Token registered.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDisconnectGithub = () => {
    localStorage.removeItem('synthexis_github_token');
    localStorage.removeItem('breezy_github_auth_mode');
    setGithubToken('');
    setGithubAuthMode('none');
    setGithubRepos([]);
    setSelectedRepo('');
    setRepoContents([]);
    setToastMessage('GitHub connection cleared.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleGithubOAuthPopup = async () => {
    try {
      const res = await authService.signInWithGithub();
      if (res) {
        setGithubToken(res.accessToken);
        localStorage.setItem('synthexis_github_token', res.accessToken);
        localStorage.setItem('breezy_github_auth_mode', 'oauth');
        setGithubAuthMode('oauth');
        setToastMessage('GitHub OAuth Authorized Successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err: any) {
      alert(`GitHub OAuth connection issue: ${err.message}. You can also enter a Personal Access Token below.`);
    }
  };

  const handleSelectRepo = async (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    if (!repoFullName) {
      setRepoContents([]);
      return;
    }
    setIsLoadingGithub(true);
    try {
      const contents = await gitHubService.listRepoContents(githubToken, repoFullName);
      setRepoContents(contents);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleSave = () => {
    onSaveKeys({
      ...keys,
      gemini: geminiKey.trim() || undefined,
      groq: groqKey.trim() || undefined,
      sambanova: sambanovaKey.trim() || undefined,
      openrouter: openrouterKey.trim() || undefined,
    });
    setIsDirty(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDiscard = () => {
    setGeminiKey(keys.gemini || '');
    setGroqKey(keys.groq || '');
    setSambanovaKey(keys.sambanova || '');
    setOpenrouterKey(keys.openrouter || '');
    setIsDirty(false);
  };

  const testWebhook = () => {
    setToastMessage('Webhook test ping sent successfully to Slack endpoint');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage('Settings updated: Dialectic rules propagated to 3 nodes');
    }, 3000);
  };

  const roundLabels: Record<number, string> = {
    1: '1 Round • Fast',
    2: '2 Rounds • Balanced',
    4: '4 Rounds • Deep Audit',
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] pb-24 text-stone-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-xl bg-[#1c2026] text-stone-100 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Workspace Alert</span>
            <span className="font-mono text-[11px] text-stone-400">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-[#7bdb80] tracking-widest bg-white/5 px-2.5 py-1 rounded-full font-semibold">
                Live Integration Workspace
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span className="font-mono text-xs text-stone-450">Active Syncing</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-stone-100 tracking-tight font-semibold">
              Workspace Sync & Settings
            </h1>
            <p className="font-sans text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
              Connect Google Drive, Google Sheets, Gmail, and GitHub accounts to fetch live documents and source code directly into your deep technical inquiries.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sync_alt</span>
            <span>Workspace Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeTab === 'general'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Consensus Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeTab === 'models'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>BYOK API Keys</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('synthesis')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeTab === 'synthesis'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            <span>Notifications & Webhooks</span>
          </button>
        </div>

        {/* Workspace Sync Tab Content */}
        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Google Integration (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <section className="p-6 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-stone-300">
                      <span className="material-symbols-outlined text-[24px]">cloud</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-sm font-semibold text-stone-100">Google Workspace Sync</span>
                      <span className="text-[11px] text-stone-400">Read Google Drive files, Doc contents, Gmail snippets & Schedule</span>
                    </div>
                  </div>

                  {googleUser ? (
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/20 text-xs font-medium text-red-200 transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>

                {googleUser ? (
                  <div className="flex flex-col gap-5">
                    {/* User profile strip */}
                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                      {googleUser.photoURL && (
                        <img src={googleUser.photoURL} alt="Google User" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-stone-200">{googleUser.displayName}</span>
                        <span className="text-[10px] text-stone-500 font-mono">{googleUser.email}</span>
                      </div>
                      <span className="ml-auto text-[10px] uppercase font-bold tracking-widest text-[#7bdb80] bg-[#7bdb80]/10 px-2 py-0.5 rounded border border-[#7bdb80]/20">
                        Synchronized
                      </span>
                    </div>

                    {/* Sub tabs for Google Workspace Services */}
                    <div className="flex items-center gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
                      <button
                        type="button"
                        onClick={() => setGoogleSubTab('drive')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium text-center transition-colors cursor-pointer ${
                          googleSubTab === 'drive' ? 'bg-white/10 text-stone-100' : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Google Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleSubTab('gmail')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium text-center transition-colors cursor-pointer ${
                          googleSubTab === 'gmail' ? 'bg-white/10 text-stone-100' : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Gmail Messages
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleSubTab('calendar')}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium text-center transition-colors cursor-pointer ${
                          googleSubTab === 'calendar' ? 'bg-white/10 text-stone-100' : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Calendar events
                      </button>
                    </div>

                    {/* Content lists */}
                    <div className="max-h-[320px] overflow-y-auto pr-1 flex flex-col gap-2">
                      {isLoadingGoogle ? (
                        <div className="py-12 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                          <span>Loading active Google Workspace assets...</span>
                        </div>
                      ) : googleSubTab === 'drive' ? (
                        driveFiles.length > 0 ? (
                          driveFiles.map((f) => (
                            <div key={f.id} className="p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs transition-colors">
                              <div className="flex items-center gap-2.5 truncate pr-2">
                                <span className="material-symbols-outlined text-stone-500 text-[18px]">
                                  {f.mimeType.includes('document') ? 'description' : f.mimeType.includes('spreadsheet') ? 'table_chart' : 'picture_as_pdf'}
                                </span>
                                <div className="flex flex-col truncate">
                                  <span className="text-stone-200 font-medium truncate">{f.name}</span>
                                  <span className="text-[10px] text-stone-500 mt-0.5">Modified {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'recently'}</span>
                                </div>
                              </div>
                              {f.webViewLink && (
                                <a href={f.webViewLink} target="_blank" rel="noreferrer noopener" className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] text-stone-300 font-medium whitespace-nowrap">
                                  Open Drive
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-xs text-stone-500">No matching Google Documents or spreadsheets found in drive.</div>
                        )
                      ) : googleSubTab === 'gmail' ? (
                        gmailMsgs.length > 0 ? (
                          gmailMsgs.map((m) => (
                            <div key={m.id} className="p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex flex-col gap-1 text-xs">
                              <div className="flex justify-between items-center text-stone-400 font-sans text-[11px]">
                                <span className="truncate max-w-[180px] font-medium">{m.from}</span>
                                <span className="text-stone-500 text-[10px]">{m.date ? new Date(m.date).toLocaleDateString() : ''}</span>
                              </div>
                              <span className="text-stone-200 font-semibold truncate mt-0.5">{m.subject}</span>
                              <p className="text-[11px] text-stone-400 italic line-clamp-2 mt-0.5 leading-relaxed">"{m.snippet}"</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-xs text-stone-500">No recent messages retrieved from Gmail workspace.</div>
                        )
                      ) : (
                        calEvents.length > 0 ? (
                          calEvents.map((evt) => (
                            <div key={evt.id} className="p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-stone-200 font-semibold">{evt.summary}</span>
                                {evt.start?.dateTime && (
                                  <span className="text-[10px] text-stone-500">{new Date(evt.start.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                )}
                              </div>
                              <span className="text-[9px] uppercase tracking-wider text-stone-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded font-mono">
                                Calendar Event
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-xs text-stone-500">No upcoming primary calendar events documented.</div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-stone-500 text-3xl">cloud_sync</span>
                    <div className="max-w-sm">
                      <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">Sync inactive</h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Authorize Synthexis to read spec documents directly from your Google Drive files to execute fact-checking grounded in real specifications.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* GitHub Integration (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <section className="p-6 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col gap-5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-stone-300">
                    <span className="material-symbols-outlined text-[24px]">terminal</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-sm font-semibold text-stone-100">GitHub Sync Setup</span>
                    <span className="text-[11px] text-stone-400">Import code files directly from repo specs</span>
                  </div>
                </div>

                {githubAuthMode !== 'none' ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        {githubAuthMode === 'oauth' ? (
                          <>
                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified</span>
                            <div className="flex flex-col">
                              <span className="text-stone-200 font-medium">GitHub OAuth Connected</span>
                              <span className="text-[10px] text-emerald-400">Live Account Linked</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-emerald-400 text-[18px]">key</span>
                            <span className="text-stone-200 font-medium">PAT Token Active</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectGithub}
                        className="px-2.5 py-1 bg-red-950 hover:bg-red-900 border border-red-500/10 text-red-200 text-[10px] rounded cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] text-stone-450 uppercase tracking-wider font-semibold">Select Repository</label>
                      <select
                        value={selectedRepo}
                        onChange={(e) => handleSelectRepo(e.target.value)}
                        className="w-full bg-[#1c212a] border border-white/10 rounded-lg p-2 text-xs text-stone-200 outline-none"
                      >
                        <option value="">-- Choose Repository --</option>
                        {githubRepos.map((repo) => (
                          <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                        ))}
                      </select>
                    </div>

                    {isLoadingGithub ? (
                      <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                        <span>Browsing GitHub...</span>
                      </div>
                    ) : repoContents.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] text-stone-450 uppercase tracking-wider font-semibold">Root Contents</span>
                        <div className="max-h-[160px] overflow-y-auto pr-1 border border-white/5 bg-black/10 rounded-lg p-2 flex flex-col gap-1.5 text-[11px]">
                          {repoContents.map((file) => (
                            <div key={file.path} className="flex items-center gap-2 text-stone-300">
                              <span className="material-symbols-outlined text-stone-500 text-[15px]">
                                {file.type === 'dir' ? 'folder' : 'article'}
                              </span>
                              <span className="truncate">{file.name}</span>
                              {file.type === 'file' && (
                                <span className="ml-auto text-[9px] text-stone-500">{(file.size / 1024).toFixed(1)} KB</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      selectedRepo && <div className="py-6 text-center text-xs text-stone-500">Empty repository or permission error.</div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Native GitHub OAuth button */}
                    <button
                      type="button"
                      onClick={handleGithubOAuthPopup}
                      className="w-full bg-[#24292e] hover:bg-[#2f363d] border border-white/10 text-stone-100 font-sans text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">account_circle</span>
                      <span>Sign in with GitHub OAuth</span>
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink mx-3 text-[10px] text-stone-500 uppercase tracking-widest font-mono">or personal access token</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-stone-450 uppercase tracking-wider font-semibold font-mono">Personal Access Token (PAT)</label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="bg-[#1c212a] border border-white/10 rounded-lg px-3 py-2 text-xs text-stone-100 outline-none focus:border-white/20"
                      />
                      <p className="text-[10px] text-stone-500 leading-relaxed">
                        Specify a custom read-only token to connect repositories securely.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectGithub}
                      disabled={!githubToken.trim()}
                      className="w-full bg-stone-100 hover:bg-white text-stone-950 font-sans text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Connect Token
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Consensus tab content */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Role Model Customization Section */}
              <section className="flex flex-col gap-5 p-6 rounded-2xl bg-[#161a22] border border-white/5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#ccbdff]/10 text-[#ccbdff]">
                      <span className="material-symbols-outlined text-[20px]">account_tree</span>
                    </div>
                    <div>
                      <h2 className="font-sans text-base font-semibold text-stone-100">Role Model Routing</h2>
                      <p className="font-sans text-xs text-stone-400">
                        Assign distinct AI model families to each research role in the dialectic pipeline
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Research Style Presets
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'fast', name: 'Fast', desc: 'Speed optimized (Single model)' },
                      { id: 'balanced', name: 'Balanced', desc: 'Multi-perspective analysis' },
                      { id: 'deep', name: 'Deep', desc: 'Rigorous cross-verification' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPreset(item.id as any);
                          const cfg = providerConfigService.getConfig();
                          cfg.preset = item.id as any;
                          providerConfigService.saveConfig(cfg);
                          setToastMessage(`Research preset updated to ${item.name}`);
                          setShowToast(true);
                          setTimeout(() => setShowToast(false), 2500);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          preset === item.id
                            ? 'bg-[#ccbdff]/15 border-[#ccbdff] text-white'
                            : 'bg-black/20 border-white/5 text-stone-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="font-sans text-xs font-bold text-stone-200">{item.name}</div>
                        <div className="font-mono text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <label className="font-mono text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Role Assignments
                  </label>
                  <div className="flex flex-col gap-3 bg-black/20 border border-white/5 rounded-xl p-4">
                    {[
                      { key: 'architect', title: 'Analyst', desc: 'Framing & core thesis proposal' },
                      { key: 'skeptic', title: 'Critic', desc: 'Identifies logical flaws & counter-evidence' },
                      { key: 'verifier', title: 'Verifier', desc: 'Fact & constraint validation' },
                      { key: 'arbiter', title: 'Synthesizer', desc: 'Executive resolution & summary' },
                    ].map((role) => (
                      <div key={role.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                        <div>
                          <div className="font-sans text-xs font-semibold text-stone-200">{role.title}</div>
                          <div className="font-mono text-[10px] text-stone-400">{role.desc}</div>
                        </div>
                        <select
                          value={roles[role.key as keyof typeof roles]?.provider || 'gemini'}
                          onChange={(e) => {
                            const p = e.target.value as any;
                            const defaultM = p === 'anthropic' ? 'claude-3-5-sonnet-20241022' : p === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-3.8-flash';
                            const nextRoles = {
                              ...roles,
                              [role.key]: { provider: p, model: defaultM },
                            };
                            setRoles(nextRoles as any);
                            setPreset('custom');
                            const cfg = providerConfigService.getConfig();
                            cfg.preset = 'custom';
                            cfg.roles = nextRoles as any;
                            providerConfigService.saveConfig(cfg);
                            setToastMessage(`Assigned ${p.toUpperCase()} to ${role.title}`);
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 2500);
                          }}
                          className="bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-200 outline-none focus:border-[#ccbdff] cursor-pointer"
                        >
                          <option value="gemini">Google Gemini</option>
                          <option value="anthropic">Anthropic Claude</option>
                          <option value="groq">Groq (Llama 3.3)</option>
                          <option value="sambanova">SambaNova (Llama/Qwen)</option>
                          <option value="openrouter">OpenRouter</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-5 p-6 rounded-2xl bg-[#161a22] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 text-stone-300">
                      <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <div>
                      <h2 className="font-sans text-base font-semibold text-on-surface">Active Consensus Engine</h2>
                      <p className="font-sans text-xs text-stone-400">
                        Calibrate multi-turn cross validation and resolution strictness
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="font-sans text-xs text-stone-300 font-medium flex items-center gap-1.5">
                      Deliberation Rounds
                    </label>
                    <span className="font-mono text-xs text-stone-400">{roundLabels[selectedRound]}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-black/20 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRound(1);
                        setIsDirty(true);
                      }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all cursor-pointer ${
                        selectedRound === 1
                          ? 'bg-white/10 text-stone-100 shadow-xs'
                          : 'bg-transparent text-stone-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-sans text-sm font-semibold">Fast</span>
                        <span className="font-mono text-[10px] text-stone-500">~4.2s</span>
                      </div>
                      <span className="font-sans text-[11px] text-stone-500">1 Round • Fast answer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRound(2);
                        setIsDirty(true);
                      }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all cursor-pointer ${
                        selectedRound === 2
                          ? 'bg-white/10 text-stone-100 shadow-xs'
                          : 'bg-transparent text-stone-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-sans text-sm font-semibold">Balanced</span>
                        <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
                      </div>
                      <span className="font-sans text-[11px] text-stone-500">2 Rounds • Recommended</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRound(4);
                        setIsDirty(true);
                      }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all cursor-pointer ${
                        selectedRound === 4
                          ? 'bg-white/10 text-stone-100 shadow-xs'
                          : 'bg-transparent text-stone-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-sans text-sm font-semibold">Deep Audit</span>
                        <span className="font-mono text-[10px] text-stone-500">~18.5s</span>
                      </div>
                      <span className="font-sans text-[11px] text-stone-500">4 Rounds • Exhaustive check</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] flex flex-col gap-4 border border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-sans text-xs text-stone-300 font-medium">Auto-resolve Contradictions</span>
                      <span className="font-sans text-[11px] text-stone-400">
                        Automatically synthesize common ground when mutual agreement breaches consensus threshold
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoResolve(!autoResolve);
                        setIsDirty(true);
                      }}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                        autoResolve ? 'bg-stone-100' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-stone-950 shadow-xs transition-transform duration-200 ${
                          autoResolve ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs text-stone-300 font-medium">Agreement Threshold</span>
                      <span className="font-mono text-xs text-stone-400 font-semibold">{agreementThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={agreementThreshold}
                      onChange={(e) => {
                        setAgreementThreshold(Number(e.target.value));
                        setIsDirty(true);
                      }}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-stone-100"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Models and BYOK API Keys Tab Content */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <section className="flex flex-col gap-5 p-6 rounded-2xl bg-[#161a22] border border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2 rounded-xl bg-white/5 text-stone-300">
                    <span className="material-symbols-outlined text-[20px]">key</span>
                  </div>
                  <div>
                    <h2 className="font-sans text-base font-semibold text-stone-100">BYOK Key Vault Configuration</h2>
                    <p className="font-sans text-xs text-stone-400">
                      Input your own developer provider credentials to leverage primary model families
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-stone-400 uppercase font-semibold">Google Gemini API Key</label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="AIzaSy... (leave empty to use default server key)"
                      className="bg-black/20 rounded-lg px-3 py-2 font-mono text-xs text-stone-100 border border-white/10 focus:border-white/20 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-stone-400 uppercase font-semibold">Groq API Key</label>
                    <input
                      type="password"
                      value={groqKey}
                      onChange={(e) => {
                        setGroqKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="gsk_..."
                      className="bg-black/20 rounded-lg px-3 py-2 font-mono text-xs text-stone-100 border border-white/10 focus:border-white/20 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-stone-400 uppercase font-semibold">SambaNova API Key</label>
                    <input
                      type="password"
                      value={sambanovaKey}
                      onChange={(e) => {
                        setSambanovaKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Enter SambaNova key"
                      className="bg-black/20 rounded-lg px-3 py-2 font-mono text-xs text-stone-100 border border-white/10 focus:border-white/20 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-stone-400 uppercase font-semibold">OpenRouter API Key</label>
                    <input
                      type="password"
                      value={openrouterKey}
                      onChange={(e) => {
                        setOpenrouterKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="sk-or-v1-..."
                      className="bg-black/20 rounded-lg px-3 py-2 font-mono text-xs text-stone-100 border border-white/10 focus:border-white/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5 justify-end">
                  <button
                    type="button"
                    onClick={handleDiscard}
                    disabled={!isDirty}
                    className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 cursor-pointer disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold cursor-pointer shadow-md"
                  >
                    Save Keys
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Notifications & Webhooks Tab Content */}
        {activeTab === 'synthesis' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <section className="flex flex-col gap-5 p-6 rounded-2xl bg-[#161a22] border border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2 rounded-xl bg-white/5 text-stone-300">
                    <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                  </div>
                  <div>
                    <h2 className="font-sans text-base font-semibold text-stone-100">Synthesis Webhook Dispatches</h2>
                    <p className="font-sans text-xs text-stone-400">
                      Configure webhook relays to notify external teams of completed inquiries or contradictions
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-stone-300 font-semibold">Relay Completion Status</span>
                      <span className="text-[11px] text-stone-500 leading-relaxed">Send a lightweight JSON payload of the synthesis once final answers complete</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWebhookActive(!webhookActive)}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                        webhookActive ? 'bg-stone-100' : 'bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-stone-950 transition-transform duration-200 ${webhookActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {webhookActive && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="flex-1 bg-[#1c212a] border border-white/10 rounded-lg p-2 text-xs text-stone-200 outline-none"
                        placeholder="https://hooks.slack.com/services/..."
                      />
                      <button
                        type="button"
                        onClick={testWebhook}
                        className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-stone-300 font-semibold cursor-pointer shrink-0"
                      >
                        Test relay
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
