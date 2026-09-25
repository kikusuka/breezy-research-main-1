import React, { useState, useEffect } from 'react';
import { ProviderKeyConfig } from '../../types';
import { providerConfigService, AVAILABLE_MODELS, PRESET_ROLE_CONFIGS } from '../../services/providerConfigService';
import { userProfileService, UserProfile } from '../../services/userProfileService';
import { authService, AuthUser } from '../../services/authService';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  keys?: ProviderKeyConfig;
  onSaveKeys?: (newKeys: ProviderKeyConfig) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  keys,
  onSaveKeys,
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'routing' | 'profile' | 'grounding'>('user');

  // User Profile & Auth State
  const [profile, setProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [organization, setOrganization] = useState(profile.organization);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Role Routing State
  const [preset, setPreset] = useState<'fast' | 'balanced' | 'deep' | 'custom'>('balanced');
  const [roles, setRoles] = useState({
    architect: { provider: 'gemini', model: 'gemini-3.8-flash' },
    skeptic: { provider: 'gemini', model: 'gemini-3.8-flash' },
    verifier: { provider: 'gemini', model: 'gemini-3.8-flash' },
    arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
  });

  // LLM AI Core keys
  const [provider, setProvider] = useState('gemini');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [key, setKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful, encouraging cognitive study coach.');

  // Search Grounding Keys
  const [tavilyKey, setTavilyKey] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const [braveKey, setBraveKey] = useState('');

  // Load current settings from canonical services
  useEffect(() => {
    if (isOpen) {
      try {
        const p = userProfileService.getProfile();
        setProfile(p);
        setDisplayName(p.displayName);
        setEmail(p.email);
        setRoleTitle(p.roleTitle);
        setOrganization(p.organization);

        const canonical = providerConfigService.getConfig();
        const activeKeys = keys || canonical.keys;

        setPreset(canonical.preset || 'balanced');
        if (canonical.roles) {
          setRoles({
            architect: canonical.roles.architect || { provider: 'gemini', model: 'gemini-3.8-flash' },
            skeptic: canonical.roles.skeptic || { provider: 'gemini', model: 'gemini-3.8-flash' },
            verifier: canonical.roles.verifier || { provider: 'gemini', model: 'gemini-3.8-flash' },
            arbiter: canonical.roles.arbiter || { provider: 'gemini', model: 'gemini-3.8-flash' },
          });
        }
        setProvider(canonical.defaultProvider || 'gemini');
        setModel(canonical.defaultModel || 'gemini-3.8-flash');
        setTavilyKey(activeKeys.tavily || '');
        setSerperKey(activeKeys.serper || '');
        setBraveKey(activeKeys.brave || '');

        const currentProviderKey = activeKeys[canonical.defaultProvider || 'gemini'];
        if (currentProviderKey) {
          setKey(currentProviderKey);
        }
      } catch {}
    }
  }, [isOpen, keys]);

  useEffect(() => {
    const unsub = authService.onAuthChange((user) => {
      setAuthUser(user);
      if (user) {
        if (user.displayName) setDisplayName(user.displayName);
        if (user.email) setEmail(user.email);
      }
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    // Save user profile
    userProfileService.saveProfile({
      displayName: displayName.trim() || 'Pranav B',
      email: email.trim() || 'bpranav763@gmail.com',
      roleTitle: roleTitle.trim() || 'Principal Systems Engineer',
      organization: organization.trim() || 'Breezy Research Lab',
      authorizationType: authUser ? 'google_oauth' : 'session_enclave',
    });

    const config = {
      type: provider,
      baseUrl: provider === 'openai' ? baseUrl.trim() : undefined,
      model: model.trim(),
      key: key.trim(),
      systemPrompt: systemPrompt.trim(),
    };
    try {
      localStorage.setItem('synap:provider', JSON.stringify(config));
    } catch {}

    try {
      const existingKeys = providerConfigService.getKeys();

      const updatedKeys: ProviderKeyConfig = {
        ...existingKeys,
        tavily: tavilyKey.trim() || undefined,
        serper: serperKey.trim() || undefined,
        brave: braveKey.trim() || undefined,
      };

      if (provider === 'gemini') {
        updatedKeys.gemini = key.trim() || undefined;
      } else if (provider === 'groq' || provider === 'openai') {
        updatedKeys.groq = key.trim() || undefined;
      } else if (provider === 'anthropic') {
        updatedKeys.anthropic = key.trim() || undefined;
      } else if (provider === 'sambanova') {
        updatedKeys.sambanova = key.trim() || undefined;
      } else if (provider === 'openrouter') {
        updatedKeys.openrouter = key.trim() || undefined;
      }

      providerConfigService.saveConfig({
        defaultProvider: (['gemini', 'groq', 'sambanova', 'openrouter', 'anthropic'].includes(provider) ? provider : 'gemini') as any,
        defaultModel: model.trim() || 'gemini-3.8-flash',
        preset,
        roles: roles as any,
        fallback: { enabled: true, provider: 'gemini', model: 'gemini-3.8-flash' },
        keys: updatedKeys,
      });

      localStorage.setItem('synthexis_byok_keys', JSON.stringify(updatedKeys));

      if (onSaveKeys) {
        onSaveKeys(updatedKeys);
      }
    } catch (e) {
      console.warn('Failed to sync common settings keys:', e);
    }

    if (onSave) onSave();
    onClose();
  };

  const handleClearAll = () => {
    if (
      confirm(
        'Are you sure you want to clear all local state, including course notebooks, sources, and chat threads? This action is irreversible.'
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#141822] rounded-2xl border border-white/10 p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ccbdff] text-[24px]">
              account_circle
            </span>
            <div>
              <h2 className="font-sans text-base font-bold">
                Unified Profile & Settings
              </h2>
              <span className="font-mono text-[10px] text-stone-400">
                Active Enclave: Local Storage (Private & Shared)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#cac4d4] hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black/20 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
              activeTab === 'user'
                ? 'bg-[#ccbdff] text-[#331282]'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Profile & Auth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('routing')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
              activeTab === 'routing'
                ? 'bg-[#ccbdff] text-[#331282]'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Model Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#ccbdff] text-[#331282]'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            API Keys
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grounding')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
              activeTab === 'grounding'
                ? 'bg-[#ccbdff] text-[#331282]'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Search Keys
          </button>
        </div>

        {/* Settings Fields */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[320px] pr-1">
          {activeTab === 'user' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#ccbdff]/20 text-[#ccbdff] border border-[#ccbdff]/30 flex items-center justify-center font-bold text-lg shrink-0">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-bold text-stone-100 truncate">
                      {displayName || 'Researcher'}
                    </span>
                    <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${authUser ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
                      {authUser ? 'Google OAuth Active' : 'Session Enclave Active'}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-stone-400 truncate mt-0.5">
                    {email || 'bpranav763@gmail.com'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name..."
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                    Research Discipline / Role
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Principal Systems Engineer"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                    Organization / Lab
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Breezy Research Lab"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  Google Workspace Authorization
                </label>
                {authUser ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Connected as {authUser.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => authService.signOut()}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await authService.signInWithGoogle();
                        if (res?.user) {
                          setAuthUser(res.user);
                          if (res.user.displayName) setDisplayName(res.user.displayName);
                          if (res.user.email) setEmail(res.user.email);
                        }
                      } catch (e: any) {
                        alert(`Authorization error: ${e.message}`);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-100 font-sans text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">key</span>
                    <span>Sign in with Google OAuth</span>
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === 'routing' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold block mb-2">
                  Research Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'fast', name: 'Fast', desc: '1 model · Fast' },
                    { id: 'balanced', name: 'Balanced', desc: 'Multi-perspective' },
                    { id: 'deep', name: 'Deep', desc: 'Rigorous 4-stage' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPreset(item.id as any);
                        if (PRESET_ROLE_CONFIGS[item.id]) {
                          setRoles(PRESET_ROLE_CONFIGS[item.id]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        preset === item.id
                          ? 'bg-[#9d85f2]/15 border-[#9d85f2] text-white'
                          : 'bg-black/20 border-white/5 text-stone-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-sans text-xs font-bold text-stone-200">{item.name}</div>
                      <div className="font-mono text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  Model Setup per Role
                </label>
                <div className="flex flex-col gap-3 bg-black/30 border border-white/5 rounded-xl p-3">
                  {[
                    { key: 'architect', title: 'Analyst', desc: 'Builds initial argument' },
                    { key: 'skeptic', title: 'Critic', desc: 'Tries to break it' },
                    { key: 'verifier', title: 'Verifier', desc: 'Checks facts & constraints' },
                    { key: 'arbiter', title: 'Synthesizer', desc: 'Produces final answer' },
                  ].map((role) => {
                    const currentSeat = roles[role.key as keyof typeof roles] || { provider: 'gemini', model: 'gemini-3.8-flash' };
                    const currentProvider = currentSeat.provider || 'gemini';
                    const currentModel = currentSeat.model || 'gemini-3.8-flash';
                    const activeKey = providerConfigService.getKey(currentProvider);
                    const hasKey = Boolean(activeKey) || currentProvider === 'gemini';
                    const modelsList = AVAILABLE_MODELS[currentProvider] || [];

                    return (
                      <div key={role.key} className="flex flex-col gap-1.5 pb-2 border-b border-white/5 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-xs text-stone-200">{role.title}</span>
                            <span className="font-mono text-[10px] text-stone-400 ml-2">{role.desc}</span>
                          </div>
                          {!hasKey && (
                            <span className="font-mono text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                              Requires Key
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={currentProvider}
                            onChange={(e) => {
                              const p = e.target.value as any;
                              const defaultM = (AVAILABLE_MODELS[p] && AVAILABLE_MODELS[p][0]?.id) || 'gemini-3.8-flash';
                              setRoles((prev) => ({
                                ...prev,
                                [role.key]: { provider: p, model: defaultM },
                              }));
                              setPreset('custom');
                            }}
                            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-stone-200 outline-none focus:border-[#9d85f2] cursor-pointer"
                          >
                            <option value="gemini">Google Gemini</option>
                            <option value="anthropic">Anthropic Claude</option>
                            <option value="groq">Groq LPU</option>
                            <option value="sambanova">SambaNova</option>
                            <option value="openrouter">OpenRouter</option>
                          </select>

                          <select
                            value={currentModel}
                            onChange={(e) => {
                              const m = e.target.value;
                              setRoles((prev) => ({
                                ...prev,
                                [role.key]: { ...prev[role.key as keyof typeof roles], model: m },
                              }));
                              setPreset('custom');
                            }}
                            className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-stone-200 outline-none focus:border-[#9d85f2] cursor-pointer truncate"
                          >
                            {modelsList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  BYOK API Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProvider(val);
                    if (val === 'gemini') setModel('gemini-3.8-flash');
                    else if (val === 'anthropic') setModel('claude-3-5-sonnet-20241022');
                    else setModel('gpt-4o-mini');
                  }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-stone-100 outline-none focus:border-[#9d85f2] cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Native/Default)</option>
                  <option value="openai">OpenAI-Compatible (Groq / Together / OpenRouter)</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>

              {provider === 'openai' && (
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                    Base URL Endpoint
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.groq.com/openai/v1"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  Model ID
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini / gemini-3.8-flash"
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  BYOK API Key
                </label>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Paste your personal key credentials (sk-... / AIza...)"
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  System Instruction Override
                </label>
                <textarea
                  rows={2}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2] resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="font-sans text-[11px] text-stone-400 leading-relaxed mb-1">
                Configure your search engine keys to enable live real-time search grounding and fact-checking during dialectic inquiries.
              </p>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  Tavily API Key
                </label>
                <input
                  type="password"
                  value={tavilyKey}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="tvly-..."
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  Serper (Google Search) Key
                </label>
                <input
                  type="password"
                  value={serperKey}
                  onChange={(e) => setSerperKey(e.target.value)}
                  placeholder="Paste Serper API Key..."
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
                  Brave Search Key
                </label>
                <input
                  type="password"
                  value={braveKey}
                  onChange={(e) => setBraveKey(e.target.value)}
                  placeholder="Enter Brave Search credentials..."
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 font-sans text-xs transition-colors cursor-pointer"
          >
            Clear All Data
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#cac4d4] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#ccbdff] hover:bg-white text-[#331282] text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
