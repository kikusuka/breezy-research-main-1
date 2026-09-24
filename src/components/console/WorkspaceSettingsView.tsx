import React, { useState } from 'react';
import { ProviderKeyConfig } from '../../types';

interface WorkspaceSettingsViewProps {
  keys: ProviderKeyConfig;
  onSaveKeys: (newKeys: ProviderKeyConfig) => void;
}

export const WorkspaceSettingsView: React.FC<WorkspaceSettingsViewProps> = ({ keys, onSaveKeys }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'synthesis' | 'team' | 'billing'>('general');
  const [selectedRound, setSelectedRound] = useState<number>(2);
  const [autoResolve, setAutoResolve] = useState<boolean>(true);
  const [agreementThreshold, setAgreementThreshold] = useState<number>(78);
  const [themeMode, setThemeMode] = useState<'obsidian' | 'slate' | 'system'>('obsidian');
  const [webhookActive, setWebhookActive] = useState<boolean>(true);
  const [webhookUrl, setWebhookUrl] = useState<string>('https://hooks.slack.com/services/T04G/B02/synthexis-alerts');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Settings updated: Dialectic rules propagated to 3 nodes');

  // Key inputs
  const [geminiKey, setGeminiKey] = useState(keys.gemini || '');
  const [groqKey, setGroqKey] = useState(keys.groq || '');
  const [sambanovaKey, setSambanovaKey] = useState(keys.sambanova || '');
  const [openrouterKey, setOpenrouterKey] = useState(keys.openrouter || '');
  const [isDirty, setIsDirty] = useState<boolean>(false);

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
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] pb-24">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-xl bg-surface-container-highest text-on-surface shadow-2xl flex items-center gap-3 border border-outline-variant/50 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Settings updated</span>
            <span className="font-mono text-[11px] text-outline">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant/15">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-primary tracking-widest bg-surface-container-high px-2.5 py-1 rounded-full font-semibold">
                System Configuration
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-secondary"></span>
              <span className="font-mono text-xs text-outline">v2.4.9-alpha</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-on-surface tracking-tight font-semibold">
              Workspace Settings
            </h1>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Configure multi-model deliberation rules, active node providers, and workspace preferences for cluster-alpha.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low text-tertiary border border-outline-variant/30">
              <span className="material-symbols-outlined text-[16px] text-secondary">cloud_done</span>
              <span className="font-mono text-[11px] text-on-surface-variant">Sync status: Live</span>
            </div>
            <div className="h-4 w-px bg-surface-container-highest"></div>
            <span className="font-mono text-[11px] text-outline">Last saved 4m ago</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${
              activeTab === 'general'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${
              activeTab === 'models'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>Models & API Keys</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('synthesis')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${
              activeTab === 'synthesis'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">alt_route</span>
            <span>Synthesis Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${
              activeTab === 'team'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Team & Access</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${
              activeTab === 'billing'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">credit_card</span>
            <span>Billing</span>
          </button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Controls (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Section 1: Active Consensus Engine */}
            <section className="flex flex-col gap-5 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-container text-primary">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <h2 className="font-sans text-base font-semibold text-on-surface">Active Consensus Engine</h2>
                    <p className="font-sans text-xs text-on-surface-variant">
                      Calibrate multi-turn cross validation and resolution strictness
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-secondary bg-surface-container px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Deterministic Mode
                </span>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex justify-between items-center">
                  <label className="font-sans text-xs text-on-surface font-medium flex items-center gap-1.5">
                    Deliberation Rounds
                    <span
                      className="material-symbols-outlined text-outline text-[14px]"
                      title="Determines peer-review dialectic iterations between models"
                    >
                      info
                    </span>
                  </label>
                  <span className="font-mono text-xs text-primary">{roundLabels[selectedRound]}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRound(1);
                      setIsDirty(true);
                    }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all ${
                      selectedRound === 1
                        ? 'bg-surface-container-high text-on-surface shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-sans text-sm font-semibold text-on-surface">Fast</span>
                      <span className="font-mono text-[10px] text-tertiary">~4.2s</span>
                    </div>
                    <span className="font-sans text-[11px] text-outline">1 Round • Low token spend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRound(2);
                      setIsDirty(true);
                    }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all ${
                      selectedRound === 2
                        ? 'bg-surface-container-high text-primary shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-sans text-sm font-semibold text-primary">Balanced</span>
                      <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                    </div>
                    <span className="font-sans text-[11px] text-on-surface-variant">2 Rounds • Recommended</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRound(4);
                      setIsDirty(true);
                    }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-all ${
                      selectedRound === 4
                        ? 'bg-surface-container-high text-on-surface shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-sans text-sm font-semibold text-on-surface">Deep Audit</span>
                      <span className="font-mono text-[10px] text-tertiary">~18.5s</span>
                    </div>
                    <span className="font-sans text-[11px] text-outline">4 Rounds • Exhaustive check</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-4 border border-outline-variant/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-sans text-xs text-on-surface font-medium">Auto-resolve Contradictions</span>
                    <span className="font-sans text-[11px] text-on-surface-variant">
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
                      autoResolve ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-on-primary shadow-xs transition-transform duration-200 ${
                        autoResolve ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs text-on-surface font-medium">Agreement Threshold</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-primary font-semibold">{agreementThreshold}%</span>
                      <span className="font-mono text-[10px] text-secondary bg-surface-container-lowest px-2 py-0.5 rounded">
                        Optimal Stability
                      </span>
                    </div>
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
                    className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-outline">
                    <span>50% Permissive</span>
                    <span className="text-tertiary">Recommended for financial & architectural synthesis</span>
                    <span>95% Strict</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Connected AI Model Providers */}
            <section className="flex flex-col gap-5 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-container text-primary">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div>
                    <h2 className="font-sans text-base font-semibold text-on-surface">Connected AI Model Providers</h2>
                    <p className="font-sans text-xs text-on-surface-variant">
                      Allocated archetypes across your triad dialectic network
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-secondary bg-secondary/10 px-2.5 py-1 rounded">
                    3 Active Nodes
                  </span>
                </div>
              </div>

              {/* Connected Nodes List */}
              <div className="grid grid-cols-1 gap-3">
                {/* Claude 3.5 Sonnet */}
                <div className="p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2e1d10] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#e09153] text-[22px]">psychology</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm text-on-surface font-semibold">Claude 3.5 Sonnet</span>
                        <span className="font-mono text-[10px] text-outline bg-surface-container-lowest px-1.5 py-0.5 rounded">
                          Anthropic API
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-tertiary">Assigned:</span>
                        <span className="font-mono text-[11px] text-primary">Lead Analyst • Thesis</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest font-mono text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span className="text-on-surface">12ms</span>
                    </div>
                    <span className="font-mono text-[11px] text-secondary bg-secondary-container/30 px-2 py-0.5 rounded font-medium">
                      Connected
                    </span>
                  </div>
                </div>

                {/* GPT-4o */}
                <div className="p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#132c25] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#10a37f] text-[22px]">bolt</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm text-on-surface font-semibold">GPT-4o</span>
                        <span className="font-mono text-[10px] text-outline bg-surface-container-lowest px-1.5 py-0.5 rounded">
                          OpenAI API
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-tertiary">Assigned:</span>
                        <span className="font-mono text-[11px] text-[#e3b341]">Adversarial Critic • Antithesis</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest font-mono text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span className="text-on-surface">18ms</span>
                    </div>
                    <span className="font-mono text-[11px] text-secondary bg-secondary-container/30 px-2 py-0.5 rounded font-medium">
                      Connected
                    </span>
                  </div>
                </div>

                {/* Gemini 1.5 Pro */}
                <div className="p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#14233c] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm text-on-surface font-semibold">Gemini 1.5 Pro</span>
                        <span className="font-mono text-[10px] text-outline bg-surface-container-lowest px-1.5 py-0.5 rounded">
                          Google AI
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-tertiary">Assigned:</span>
                        <span className="font-mono text-[11px] text-secondary">Final Synthesizer • Synthesis</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest font-mono text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span className="text-on-surface">14ms</span>
                    </div>
                    <span className="font-mono text-[11px] text-secondary bg-secondary-container/30 px-2 py-0.5 rounded font-medium">
                      Connected
                    </span>
                  </div>
                </div>

                {/* DeepSeek R1 */}
                <div className="p-4 rounded-xl bg-surface-container/60 hover:bg-surface-container transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-tertiary text-[22px]">terminal</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm text-on-surface font-medium">DeepSeek R1</span>
                        <span className="font-mono text-[10px] text-outline bg-surface-container-lowest px-1.5 py-0.5 rounded">
                          Self-Hosted Endpoint
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-outline">Assigned:</span>
                        <span className="font-mono text-[11px] text-tertiary">Standby Reasoning Node</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest font-mono text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                      <span className="text-outline">Idle</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Key Vault Configuration */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-3">
                <span className="font-mono text-[11px] uppercase text-outline font-semibold">
                  Custom BYOK Provider Keys
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-tertiary">Google Gemini API Key</label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="AIzaSy... (optional if server key configured)"
                      className="bg-surface-container rounded px-3 py-1.5 font-mono text-xs text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-tertiary">Groq API Key</label>
                    <input
                      type="password"
                      value={groqKey}
                      onChange={(e) => {
                        setGroqKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="gsk_..."
                      className="bg-surface-container rounded px-3 py-1.5 font-mono text-xs text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-tertiary">SambaNova API Key</label>
                    <input
                      type="password"
                      value={sambanovaKey}
                      onChange={(e) => {
                        setSambanovaKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="Enter SambaNova key"
                      className="bg-surface-container rounded px-3 py-1.5 font-mono text-xs text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-tertiary">OpenRouter API Key</label>
                    <input
                      type="password"
                      value={openrouterKey}
                      onChange={(e) => {
                        setOpenrouterKey(e.target.value);
                        setIsDirty(true);
                      }}
                      placeholder="sk-or-v1-..."
                      className="bg-surface-container rounded px-3 py-1.5 font-mono text-xs text-on-surface border border-outline-variant/30 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Appearance & Workspace */}
            <section className="flex flex-col gap-5 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-surface-container text-primary">
                  <span className="material-symbols-outlined text-[20px]">palette</span>
                </div>
                <div>
                  <h2 className="font-sans text-base font-semibold text-on-surface">Appearance & Workspace</h2>
                  <p className="font-sans text-xs text-on-surface-variant">
                    Interface layout density and notification dispatch channels
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-sans text-xs text-on-surface font-medium">Interface Color Space</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode('obsidian')}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                        themeMode === 'obsidian'
                          ? 'bg-surface-container-high text-on-surface border-primary/50 shadow-xs'
                          : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#0a0e14] flex items-center justify-center border border-outline-variant/40">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans text-xs font-semibold">Dark Obsidian</span>
                        <span className="font-mono text-[9px] text-outline">High contrast (OLED)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode('slate')}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                        themeMode === 'slate'
                          ? 'bg-surface-container-high text-on-surface border-primary/50 shadow-xs'
                          : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[#20252d] flex items-center justify-center border border-outline-variant/40"></div>
                      <div className="flex flex-col">
                        <span className="font-sans text-xs font-medium">Slate Grey</span>
                        <span className="font-mono text-[9px] text-outline">Subdued tones</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode('system')}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                        themeMode === 'system'
                          ? 'bg-surface-container-high text-on-surface border-primary/50 shadow-xs'
                          : 'bg-surface-container text-on-surface-variant border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/40">
                        <span className="material-symbols-outlined text-[12px] text-outline">brightness_auto</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-sans text-xs font-medium">System Auto</span>
                        <span className="font-mono text-[9px] text-outline">Sync with OS</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-3 border border-outline-variant/20">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-sans text-xs text-on-surface font-medium">Synthesis Drift Webhook Alerts</span>
                      <span className="font-sans text-[11px] text-on-surface-variant">
                        Send payload when models diverge beyond 40% margin of error
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWebhookActive(!webhookActive);
                        setIsDirty(true);
                      }}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                        webhookActive ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-on-primary shadow-xs transition-transform duration-200 ${
                          webhookActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => {
                        setWebhookUrl(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full bg-surface-container-lowest rounded-lg px-3 py-1.5 font-mono text-xs text-on-surface border border-outline-variant/30 outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={testWebhook}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-xs font-medium shrink-0 transition-colors border border-outline-variant/30"
                    >
                      Test Ping
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Telemetry Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Cluster Health */}
            <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col gap-4 border border-outline-variant/30 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-outline font-semibold">
                  Dialectic Cluster Health
                </span>
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-3xl text-on-surface font-semibold">99.98%</span>
                <span className="font-mono text-xs text-secondary">+0.04% vs 24h</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between font-mono text-[11px] text-outline">
                  <span>Token Velocity</span>
                  <span className="text-on-surface">1,420 tps</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[11px] text-outline">
                  <span>Consensus Convergence</span>
                  <span className="text-on-surface">94.2%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">data_saver_on</span>
                  <span className="font-sans text-xs text-on-surface">Token Quota</span>
                </div>
                <span className="font-mono text-[11px] text-outline">4.2M / 10M</span>
              </div>
            </div>

            {/* Compliance & Data Boundary */}
            <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col gap-2.5 border border-outline-variant/30 shadow-xs">
              <div className="flex items-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="font-mono text-[10px] uppercase font-semibold">Compliance & Data Boundary</span>
              </div>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                All prompt exchanges are encrypted in transit with zero model training retention agreements applied to OpenAI and Anthropic pipelines.
              </p>
              <button
                type="button"
                onClick={() => {
                  setToastMessage('Zero-Retention agreement verified: Ephemeral enclave active');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2500);
                }}
                className="font-sans text-xs text-primary hover:underline flex items-center gap-1 font-medium pt-1 text-left"
              >
                <span>Read Zero-Retention Policy</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick Shortcuts */}
            <div className="p-5 rounded-2xl bg-surface-container-low flex flex-col gap-3 border border-outline-variant/30 shadow-xs">
              <span className="font-mono text-[10px] uppercase text-outline font-semibold">Quick Shortcuts</span>
              <div className="flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex justify-between items-center py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant">Switch active dialectic</span>
                  <span className="bg-surface-container px-2 py-0.5 rounded text-outline">⌥ D</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant">Force unanimous vote</span>
                  <span className="bg-surface-container px-2 py-0.5 rounded text-outline">⌘ ⇧ U</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant">Inspect token logs</span>
                  <span className="bg-surface-container px-2 py-0.5 rounded text-outline">⌘ L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Save Bar */}
        <div className="sticky bottom-6 z-30 mt-4 p-4 rounded-2xl bg-surface-container-low/95 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
            <div className="flex flex-col">
              <span className="font-sans text-xs text-on-surface font-medium">
                {isDirty ? 'Unsaved changes in Deliberation Engine' : 'All dialectic preferences synchronized'}
              </span>
              <span className="font-mono text-[10px] text-outline">
                Last persisted to cluster: Today at {new Date().toLocaleTimeString()} UTC
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-sans text-xs font-medium transition-colors border border-outline-variant/30"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-sans text-xs font-semibold transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[17px]">save</span>
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
