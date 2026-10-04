import React, { useState, useEffect } from 'react';
import { ProviderKeyConfig } from '../../types';
import { authService, AuthUser } from '../../services/authService';
import { workspaceService, GoogleDriveFile, GmailMessage, CalendarEvent } from '../../services/workspaceService';
import { gitHubService, GitHubRepository } from '../../services/gitHubService';
import { providerConfigService } from '../../services/providerConfigService';
import { userProfileService, UserProfile } from '../../services/userProfileService';
import { effectiveProviderService } from '../../services/effectiveProviderService';

interface WorkspaceSettingsViewProps {
  keys: ProviderKeyConfig;
  onSaveKeys: (newKeys: ProviderKeyConfig) => void;
  onConnectWorkspace: (scopeType: string) => Promise<void>;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = ({
  keys,
  onSaveKeys,
  onConnectWorkspace,
}) => {
  const canonical = providerConfigService.getConfig();
  const [activeTab, setActiveTab] = useState<'general' | 'synthesis' | 'privacy' | 'storage' | 'shortcuts' | 'integrations' | 'profile'>('general');

  // General settings
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('breezy_workspace_name') || 'My Breezy Workspace');
  const [defaultCanvas, setDefaultCanvas] = useState<'chat' | 'research'>(() => (localStorage.getItem('breezy_default_canvas') as any) || 'research');
  const [executionAlerts, setExecutionAlerts] = useState(true);
  const [sourceConflicts, setSourceConflicts] = useState(true);

  // Synthesis engine settings
  const [reasoningDepth, setReasoningDepth] = useState<number>(() => {
    return canonical.selectedRound ? Math.min(5, Math.max(1, canonical.selectedRound)) : 4;
  });
  const [autoGrounding, setAutoGrounding] = useState<boolean>(true);
  const [adversarialRounds, setAdversarialRounds] = useState<number>(canonical.selectedRound || 2);
  const [quoteInspection, setQuoteInspection] = useState<boolean>(true);

  // Privacy settings
  const [zeroRetention, setZeroRetention] = useState<boolean>(true);
  const [keychainIntegration, setKeychainIntegration] = useState<boolean>(true);
  const [telemetryDisabled, setTelemetryDisabled] = useState<boolean>(true);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle || '');
  const [email, setEmail] = useState(profile.email || '');

  // Integrations state
  const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('breezy_github_token') || '');
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = authService.onAuthChange((user, token) => {
      setGoogleUser(user);
      setGoogleToken(token);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCommitChanges = () => {
    localStorage.setItem('breezy_workspace_name', workspaceName);
    localStorage.setItem('breezy_default_canvas', defaultCanvas);

    const nextConfig = { ...canonical };
    nextConfig.selectedRound = adversarialRounds;
    providerConfigService.saveConfig(nextConfig);

    userProfileService.saveProfile({
      displayName,
      roleTitle,
      email,
    });

    showToast('All configuration nodes committed securely.');
  };

  const handleResetDefaults = () => {
    setWorkspaceName('My Breezy Workspace');
    setDefaultCanvas('research');
    setReasoningDepth(4);
    setAdversarialRounds(2);
    showToast('Settings reset to system defaults.');
  };

  const depthNames = [
    'Quick',
    'Focused',
    'Standard',
    'Deep',
    'Extended',
  ];

  const configuredProviderCount = providerConfigService.getConfiguredProviders().length;
  const serverGeminiConfigured = effectiveProviderService.isServerGeminiConfigured();

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface p-space-md sm:p-space-lg pb-24 max-w-7xl mx-auto">
      {/* Subtle Ambient Radial Lighting */}
      <div className="pointer-events-none absolute -top-12 left-1/4 w-[640px] h-[360px] bg-primary/10 rounded-full blur-[128px] -z-10" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs pb-space-lg">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm text-outline font-mono text-code-sm uppercase tracking-wider">
            <span>Preferences</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Breezy Control Plane</span>
          </div>
          <h1 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight">
            System Configuration
          </h1>
          <p className="font-sans text-body-md text-on-surface-variant max-w-2xl">
            Configure runtime synthesis parameters, data boundaries, storage cache, and identity
            safeguards for local and distributed investigations.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-space-md py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-sans text-label-md"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={handleCommitChanges}
            className="flex items-center gap-space-xs px-space-lg py-2 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shadow-[0_0_14px_rgba(76,214,251,0.25)]"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>Commit changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 flex lg:flex-col gap-space-xs overflow-x-auto lg:overflow-visible pb-space-xs lg:pb-0 sticky top-20 z-30">
          {[
            { id: 'general' as const, label: 'General', icon: 'tune' },
            { id: 'synthesis' as const, label: 'Research & Synthesis', icon: 'psychology', badge: 'v2' },
            { id: 'privacy' as const, label: 'Data & Privacy', icon: 'shield', iconBadge: 'lock' },
            { id: 'storage' as const, label: 'API Keys & Storage', icon: 'database' },
            { id: 'shortcuts' as const, label: 'Shortcuts', icon: 'keyboard', badge: '⌘/' },
            { id: 'integrations' as const, label: 'Integrations', icon: 'hub' },
            { id: 'profile' as const, label: 'Profile', icon: 'person' },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between gap-space-md px-space-md py-2 rounded-xl text-left transition-all font-sans text-body-md border ${
                  active
                    ? 'bg-surface-container-high text-primary font-medium shadow-sm border-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent'
                }`}
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="font-mono text-code-sm text-tertiary px-1 rounded bg-tertiary/10">
                    {item.badge}
                  </span>
                )}
                {item.iconBadge && (
                  <span className="material-symbols-outlined text-[16px] text-tertiary">
                    {item.iconBadge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="hidden lg:flex flex-col mt-space-lg p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex items-center justify-between mb-space-xs font-mono text-code-sm">
              <span className="uppercase text-outline">Provider connections</span>
              <span className={`font-medium ${configuredProviderCount > 0 ? 'text-tertiary' : 'text-outline'}`}>
                {configuredProviderCount > 0 ? 'Configured' : 'None'}
              </span>
            </div>
            <p className="font-mono text-code-sm text-on-surface">
              {configuredProviderCount} provider{configuredProviderCount === 1 ? '' : 's'} configured
            </p>
            <div className="mt-space-sm text-label-sm text-on-surface-variant">
              No model is shown here until Breezy has a real provider/model configuration.
            </div>
          </div>
        </aside>

        {/* Content Panels */}
        <main className="lg:col-span-9 flex flex-col gap-space-lg min-w-0">
          {/* General Section */}
          {activeTab === 'general' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    General Environment
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Workspace namespace, landing defaults, and notification routing.
                  </p>
                </div>
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-primary border border-primary/20">
                  ENV_PROD
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-sans text-label-md text-on-surface font-medium" htmlFor="wsName">
                    Workspace Identifier
                  </label>
                  <input
                    id="wsName"
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-space-md py-2 rounded-xl bg-surface-container text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                  <span className="font-sans text-label-sm text-outline">
                    Shared across collaborative synthesis threads and export schemas.
                  </span>
                </div>

                <div className="flex flex-col gap-space-xs">
                  <label className="font-sans text-label-md text-on-surface font-medium">
                    Default Landing Canvas
                  </label>
                  <div className="grid grid-cols-2 gap-space-xs p-1 rounded-xl bg-surface-container border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => setDefaultCanvas('chat')}
                      className={`py-1.5 px-space-sm rounded-lg font-sans text-label-md transition-all flex items-center justify-center gap-space-xs ${
                        defaultCanvas === 'chat'
                          ? 'bg-primary text-on-primary font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      <span>Direct Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultCanvas('research')}
                      className={`py-1.5 px-space-sm rounded-lg font-sans text-label-md transition-all flex items-center justify-center gap-space-xs ${
                        defaultCanvas === 'research'
                          ? 'bg-primary text-on-primary font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      <span>Deep Research</span>
                    </button>
                  </div>
                  <span className="font-sans text-label-sm text-outline">
                    Initial screen loaded upon application startup.
                  </span>
                </div>
              </div>

              <div className="pt-space-sm flex flex-col gap-space-sm">
                <span className="font-sans text-label-md text-on-surface font-medium">
                  Telemetry &amp; Alert Routing
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <label className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container border border-outline-variant/30 cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input
                      type="checkbox"
                      checked={executionAlerts}
                      onChange={(e) => setExecutionAlerts(e.target.checked)}
                      className="mt-1 accent-primary w-4 h-4 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="font-sans text-label-md text-on-surface font-medium">Execution Alerts</span>
                      <span className="font-sans text-body-sm text-outline">
                        Notify when asynchronous research stages complete.
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container border border-outline-variant/30 cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input
                      type="checkbox"
                      checked={sourceConflicts}
                      onChange={(e) => setSourceConflicts(e.target.checked)}
                      className="mt-1 accent-primary w-4 h-4 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="font-sans text-label-md text-on-surface font-medium">Source Conflicts</span>
                      <span className="font-sans text-body-sm text-outline">
                        Immediate flag on adversarial falsification findings.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Research & Synthesis Section */}
          {activeTab === 'synthesis' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    Research &amp; Synthesis Engine
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Control generative rigor, source anchoring, and adversarial logic verification.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs text-tertiary bg-surface-container-high border border-tertiary/20 px-space-sm py-1 rounded-full font-mono text-code-sm">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Rigorous Mode</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-label-md text-on-surface font-medium">
                    Default Reasoning Depth
                  </label>
                  <span className="font-mono text-code-sm text-primary px-space-xs py-0.5 rounded bg-surface-container border border-primary/20">
                    {depthNames[reasoningDepth - 1]}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={reasoningDepth}
                  onChange={(e) => setReasoningDepth(parseInt(e.target.value, 10))}
                  className="w-full accent-primary bg-surface-container h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between font-sans text-label-sm text-outline">
                  <span>Fast Surface Scan</span>
                  <span>Standard Synthesis</span>
                  <span>Exhaustive Multi-Pass</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-md pt-space-sm">
                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="flex items-start gap-space-md">
                    <span className="material-symbols-outlined text-primary text-headline-md mt-0.5">
                      auto_stories
                    </span>
                    <div className="flex flex-col">
                      <span className="font-sans text-label-md text-on-surface font-medium">
                        Auto-Grounding Against arXiv &amp; Crossref
                      </span>
                      <span className="font-sans text-body-sm text-on-surface-variant max-w-xl">
                        Compiles citation vectors and fetches raw DOI abstracts for factual validation.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoGrounding}
                    onChange={(e) => setAutoGrounding(e.target.checked)}
                    className="accent-primary w-5 h-5 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="flex items-start gap-space-md">
                    <span className="material-symbols-outlined text-secondary text-headline-md mt-0.5">
                      balance
                    </span>
                    <div className="flex flex-col">
                      <span className="font-sans text-label-md text-on-surface font-medium">
                        Adversarial Challenge Loops
                      </span>
                      <span className="font-sans text-body-sm text-on-surface-variant max-w-xl">
                        Applies dedicated skeptic reviewer models to stress-test claims before final synthesis.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0 font-mono text-code-sm">
                    <span className="text-outline">Rounds:</span>
                    <div className="flex items-center bg-surface-container-high rounded-lg border border-outline-variant/30 p-1">
                      <button
                        type="button"
                        onClick={() => setAdversarialRounds((r) => Math.max(1, r - 1))}
                        className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-primary font-bold">{adversarialRounds}</span>
                      <button
                        type="button"
                        onClick={() => setAdversarialRounds((r) => Math.min(5, r + 1))}
                        className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="flex items-start gap-space-md">
                    <span className="material-symbols-outlined text-tertiary text-headline-md mt-0.5">
                      format_quote
                    </span>
                    <div className="flex flex-col">
                      <span className="font-sans text-label-md text-on-surface font-medium">
                        Verbatim Quote Inspection
                      </span>
                      <span className="font-sans text-body-sm text-on-surface-variant max-w-xl">
                        Display direct source fragments side-by-side with synthesized findings.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quoteInspection}
                    onChange={(e) => setQuoteInspection(e.target.checked)}
                    className="accent-primary w-5 h-5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Privacy Section */}
          {activeTab === 'privacy' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    Data &amp; Privacy
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Control local retention preferences and diagnostic behavior for this browser session.
                  </p>
                </div>
                <span className="material-symbols-outlined text-tertiary text-headline-lg">security</span>
              </div>

              <div className="flex flex-col gap-space-md pt-space-xs">
                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-sans text-label-md text-on-surface font-medium">
                        Session retention preference
                      </span>
                      <span className="font-mono text-code-sm text-primary bg-primary/10 px-1 rounded border border-primary/20">
                        LOCAL PREF
                      </span>
                    </div>
                    <span className="font-sans text-body-sm text-on-surface-variant max-w-xl mt-0.5">
                      Prompts and embeddings reside only in volatile local memory during synthesis and are scrubbed
                      instantly after run completion.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={zeroRetention}
                    onChange={(e) => setZeroRetention(e.target.checked)}
                    className="accent-primary w-5 h-5 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-sans text-label-md text-on-surface font-medium">
                        Provider credential storage
                      </span>
                      <span className="font-mono text-code-sm text-outline">BROWSER STORAGE</span>
                    </div>
                    <span className="font-sans text-body-sm text-on-surface-variant max-w-xl mt-0.5">
                      Store remote provider tokens exclusively in your browser/system key vault. Never touches disk
                      in plain text.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={keychainIntegration}
                    onChange={(e) => setKeychainIntegration(e.target.checked)}
                    className="accent-primary w-5 h-5 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="font-sans text-label-md text-on-surface font-medium">
                      Diagnostic telemetry preference
                    </span>
                    <span className="font-sans text-body-sm text-on-surface-variant max-w-xl mt-0.5">
                      Controls whether optional diagnostics are enabled by this workspace.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={telemetryDisabled}
                    onChange={(e) => setTelemetryDisabled(e.target.checked)}
                    className="accent-primary w-5 h-5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Storage & API Keys Section */}
          {activeTab === 'storage' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    API Keys &amp; Storage Footprint
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Provider key vault status, local vector indexing cache, and workspace exports.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-label-md text-on-surface font-medium">Anthropic Claude</span>
                    <span className="font-mono text-code-sm text-tertiary">
                      {keys.anthropic ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <div className="font-mono text-code-sm text-on-surface-variant bg-surface-container-high px-space-sm py-1 rounded-lg">
                    {keys.anthropic ? `sk-ant-••••••••${keys.anthropic.slice(-4)}` : 'No key set'}
                  </div>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-label-md text-on-surface font-medium">Google Gemini</span>
                    <span className="font-mono text-code-sm text-tertiary">
                      {keys.gemini || serverGeminiConfigured ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  <div className="font-mono text-code-sm text-on-surface-variant bg-surface-container-high px-space-sm py-1 rounded-lg">
                    {keys.gemini ? `••••••••${keys.gemini.slice(-4)}` : serverGeminiConfigured ? 'Server-side provider configured' : 'No key configured'}
                  </div>
                </div>
              </div>

              {/* Cache purge */}
              <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-sans text-label-md text-on-surface font-medium">Vector Embeddings Cache</span>
                    <p className="font-sans text-body-sm text-outline">
                      Local Fragment Index and citation registry chunks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('breezy_evidence_cache');
                      showToast('Local vector cache purged successfully.');
                    }}
                    className="px-space-md py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-sm border border-outline-variant/30 transition-colors"
                  >
                    Purge Cache
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Shortcuts Section */}
          {activeTab === 'shortcuts' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    Analytical Shortcuts
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Keyboard navigation keys for accelerated cognitive synthesis.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="font-sans text-body-sm text-on-surface">Direct Inquiry Focus</span>
                  <div className="flex items-center gap-1 font-mono text-code-sm text-primary">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">K</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="font-sans text-body-sm text-on-surface">Initiate Research</span>
                  <div className="flex items-center gap-1 font-mono text-code-sm text-primary">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">Return</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="font-sans text-body-sm text-on-surface">Toggle Navigation Drawer</span>
                  <div className="flex items-center gap-1 font-mono text-code-sm text-primary">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">B</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="font-sans text-body-sm text-on-surface">Close Modal or Dialog</span>
                  <div className="flex items-center gap-1 font-mono text-code-sm text-primary">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">Esc</kbd>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Integrations Section */}
          {activeTab === 'integrations' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    External Integrations
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Connect Google Workspace services and GitHub repositories.
                  </p>
                </div>
              </div>

              {/* Google Workspace */}
              <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-headline-md">cloud_sync</span>
                    <div>
                      <h3 className="font-headline font-semibold text-headline-sm text-on-surface">Google Workspace</h3>
                      <p className="font-sans text-body-sm text-outline">
                        {googleUser ? `Connected as ${googleUser.email}` : 'Sync research docs to Drive, Docs & Sheets'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onConnectWorkspace('drive')}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-sans text-label-md border border-primary/20 transition-colors"
                  >
                    {googleUser ? 'Manage Scopes' : 'Connect Google'}
                  </button>
                </div>
              </div>

              {/* GitHub Integration */}
              <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-secondary text-headline-md">terminal</span>
                    <div>
                      <h3 className="font-headline font-semibold text-headline-sm text-on-surface">GitHub Integration</h3>
                      <p className="font-sans text-body-sm text-outline">
                        Mount repositories directly into Breezy Build / IDE
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-space-sm pt-2">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="Personal Access Token (ghp_...)"
                    className="flex-1 bg-surface-container-low px-space-md py-2 rounded-xl font-mono text-code-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('breezy_github_token', githubToken.trim());
                      showToast('GitHub token saved.');
                    }}
                    className="px-space-md py-2 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all"
                  >
                    Save Token
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Profile Section */}
          {activeTab === 'profile' && (
            <section className="flex flex-col gap-space-md p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
              <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline font-semibold text-headline-md text-on-surface">
                    User Profile
                  </h2>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-0.5">
                    Manage the profile information shown in your Breezy workspace.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-sans text-label-md text-on-surface font-medium">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-space-md py-2 rounded-xl bg-surface-container text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-sans text-label-md text-on-surface font-medium">Role &amp; Title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-space-md py-2 rounded-xl bg-surface-container text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-space-xs md:col-span-2">
                  <label className="font-sans text-label-md text-on-surface font-medium">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-space-md py-2 rounded-xl bg-surface-container text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
