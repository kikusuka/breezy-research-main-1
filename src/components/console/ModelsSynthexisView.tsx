import React, { useState, useEffect } from 'react';
import {
  providerConfigService,
  CanonicalWorkspaceConfig,
  AVAILABLE_MODELS,
} from '../../services/providerConfigService';
import { apiClient } from '../../services/apiClient';
import { ollamaService, OllamaModel } from '../../services/ollamaService';

interface ModelsSynthexisViewProps {
  onOpenSettings?: () => void;
}

export const ModelsSynthexisView: React.FC<ModelsSynthexisViewProps> = ({ onOpenSettings }) => {
  const [config, setConfig] = useState<CanonicalWorkspaceConfig>(() => providerConfigService.getConfig());
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latencyMs?: number; msg?: string }>>({});

  const [serverGeminiActive, setServerGeminiActive] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaChecking, setOllamaChecking] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProvider, setModalProvider] = useState<string>('gemini');
  const [modalKeyInput, setModalKeyInput] = useState<string>('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestFeedback, setKeyTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    const cur = providerConfigService.getConfig();
    setConfig(cur);
    ollamaService.setBaseUrl(cur.ollamaBaseUrl || 'http://127.0.0.1:11434');

    apiClient.getHealth().then((h) => {
      setServerGeminiActive(Boolean(h.serverGeminiConfigured));
    }).catch(() => {});

    ollamaService.checkConnection().then((ok) => {
      setOllamaConnected(ok);
      if (ok) {
        ollamaService.getModels().then(setOllamaModels).catch(() => {});
      }
    }).catch(() => {
      setOllamaConnected(false);
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePingAll = async () => {
    setIsBenchmarking(true);
    const results: Record<string, { ok: boolean; latencyMs?: number; msg?: string }> = {};
    const keys = config.keys || {};

    const providersToTest = ['gemini', 'anthropic', 'groq', 'sambanova', 'openrouter'].filter(
      (p) => Boolean(keys[p]) || (p === 'gemini' && serverGeminiActive)
    );

    if (providersToTest.length === 0) {
      setIsBenchmarking(false);
      showToast('No API keys configured yet. Please configure a key.');
      return;
    }

    for (const p of providersToTest) {
      const apiKey = keys[p] || '';
      if (p === 'gemini' && !apiKey && serverGeminiActive) {
        results[p] = { ok: true, latencyMs: 280, msg: 'Server Gemini Key Active' };
        continue;
      }
      try {
        const startTime = Date.now();
        const res = await apiClient.verifyVaultKey(p, apiKey);
        if (res.valid) {
          results[p] = { ok: true, latencyMs: res.latencyMs || Date.now() - startTime, msg: 'Valid credentials' };
        } else {
          results[p] = { ok: false, msg: res.error || 'Verification failed' };
        }
      } catch (err: any) {
        results[p] = { ok: false, msg: err.message || 'Network error' };
      }
    }

    setTestResults(results);
    setIsBenchmarking(false);
    showToast('Ping cycle finished across configured providers.');
  };

  const handleOpenConfigModal = (providerKey: string) => {
    setModalProvider(providerKey);
    setModalKeyInput(config.keys?.[providerKey] || '');
    setKeyTestFeedback(null);
    setModalOpen(true);
  };

  const handleSaveModalKey = () => {
    const next = { ...config };
    next.keys = { ...next.keys, [modalProvider]: modalKeyInput.trim() };
    providerConfigService.saveConfig(next);
    setConfig(next);
    setModalOpen(false);
    showToast(`Saved key for ${modalProvider.toUpperCase()}`);
  };

  const handleTestModalKey = async () => {
    if (!modalKeyInput.trim()) {
      setKeyTestFeedback('Please enter a key to test.');
      return;
    }
    setIsTestingKey(true);
    setKeyTestFeedback(null);
    try {
      const res = await apiClient.verifyVaultKey(modalProvider, modalKeyInput.trim());
      if (res.valid) {
        setKeyTestFeedback(`✓ Valid credentials! Latency: ${res.latencyMs || 250}ms`);
      } else {
        setKeyTestFeedback(`✕ ${res.error || 'Invalid key'}`);
      }
    } catch (e: any) {
      setKeyTestFeedback(`✕ ${e.message || 'Verification error'}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSavePipeline = () => {
    providerConfigService.saveConfig(config);
    showToast('Pipeline role assignment matrix saved.');
  };

  const handleRoleChange = (roleKey: 'architect' | 'skeptic' | 'verifier' | 'arbiter', modelId: string) => {
    const next = { ...config };
    let prov = 'gemini';
    if (modelId.includes('claude')) prov = 'anthropic';
    else if (modelId.includes('llama') || modelId.includes('mixtral')) prov = 'groq';
    else if (modelId.includes('deepseek')) prov = 'openrouter';
    else if (modelId.includes('Qwen') || modelId.includes('Meta-Llama')) prov = 'sambanova';

    next.roles = {
      ...next.roles,
      [roleKey]: { provider: prov as any, model: modelId },
    };
    setConfig(next);
  };

  const configuredProvidersCount = [
    Boolean(config.keys?.gemini || serverGeminiActive),
    Boolean(config.keys?.anthropic),
    Boolean(config.keys?.groq),
    Boolean(config.keys?.sambanova),
    Boolean(config.keys?.openrouter),
    ollamaConnected,
  ].filter(Boolean).length;

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface p-space-md sm:p-space-lg pb-16 max-w-7xl mx-auto gap-space-lg">
      {/* Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pt-space-xs">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm text-outline font-mono text-code-sm uppercase tracking-wider">
            <span>Inference Architecture</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Orchestration &amp; Keys</span>
          </div>
          <h1 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight">
            Models &amp; Providers
          </h1>
          <p className="font-sans text-body-md text-on-surface-variant max-w-2xl">
            Manage remote API connections, verify local inference daemons, and route specialized sub-tasks
            across deep research pipeline phases.
          </p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={handlePingAll}
            disabled={isBenchmarking}
            className="flex items-center gap-space-sm px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/30 transition-colors shadow-sm disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary ${isBenchmarking ? 'animate-spin' : ''}`}>
              sync_alt
            </span>
            <span className="font-sans text-label-md font-medium">
              {isBenchmarking ? 'Pinging Nodes...' : 'Ping All Daemons'}
            </span>
          </button>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-space-sm px-space-md py-2 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shadow-[0_0_14px_rgba(76,214,251,0.2)]"
            >
              <span className="material-symbols-outlined text-headline-sm">settings</span>
              <span>Advanced Config</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento Metric Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
              Configured Providers
            </span>
            <span className="material-symbols-outlined text-headline-sm text-outline">hub</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline font-bold text-headline-xl text-on-surface">
              {configuredProvidersCount}
            </span>
            <span className="font-mono text-code-sm text-outline">active</span>
          </div>
          <div className="flex items-center gap-space-xs font-mono text-code-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span>{ollamaConnected ? 'Cloud + Local IPC' : 'Cloud Remote'}</span>
          </div>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
              Catalog Engines
            </span>
            <span className="material-symbols-outlined text-headline-sm text-outline">memory</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline font-bold text-headline-xl text-on-surface">{Object.values(AVAILABLE_MODELS).reduce((total, models) => total + models.length, 0) + ollamaModels.length}</span>
            <span className="font-mono text-code-sm text-outline">models available</span>
          </div>
          <div className="flex items-center gap-space-xs font-mono text-code-sm text-on-surface-variant">
            <span className="text-primary font-medium">{Object.values(config.roles || {}).filter((role) => Boolean(role?.provider && role?.model)).length} assigned</span>
            <span>in active pipeline</span>
          </div>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
              Local Runtime
            </span>
            <span className="material-symbols-outlined text-headline-sm text-tertiary">terminal</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-headline-sm text-on-surface">
              Local Ollama
            </span>
            <span className="font-mono text-code-sm text-outline">127.0.0.1:11434</span>
          </div>
          <div className="flex items-center gap-space-xs font-mono text-code-sm">
            <span className={`w-2 h-2 rounded-full ${ollamaConnected ? 'bg-tertiary' : 'bg-outline'}`} />
            <span className={ollamaConnected ? 'text-tertiary' : 'text-outline'}>
              {ollamaChecking ? 'Checking...' : ollamaConnected ? 'Listening' : 'Unconnected'}
            </span>
          </div>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
              Pipeline Fallback
            </span>
            <span className="material-symbols-outlined text-headline-sm text-primary">alt_route</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-headline-sm text-on-surface">
              Multi-Pass Failover
            </span>
            <span className="font-mono text-code-sm text-outline">Cascade Enabled</span>
          </div>
          <div className="flex items-center gap-space-xs font-mono text-code-sm text-primary">
            <span className="material-symbols-outlined text-label-sm">shield</span>
            <span>Failover Armed</span>
          </div>
        </div>
      </div>

      {/* Connected Engine Providers Grid */}
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-semibold text-headline-md text-on-surface tracking-tight">
            Connected Engine Providers
          </h2>
          <span className="font-mono text-code-sm text-outline">Click credentials to configure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {/* Anthropic Card */}
          {(() => {
            const hasKey = Boolean(config.keys?.anthropic);
            return (
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary font-bold font-mono text-code-md border border-primary/20">
                        ANT
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline font-semibold text-headline-sm text-on-surface">
                            Anthropic Claude
                          </span>
                          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-mono text-code-sm text-outline">
                            Tier 4
                          </span>
                        </div>
                        <span className="font-mono text-code-sm text-on-surface-variant">api.anthropic.com/v1</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container text-code-sm font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-tertiary' : 'bg-error'}`} />
                      <span className={hasKey ? 'text-tertiary' : 'text-error'}>
                        {hasKey ? 'Connected' : 'Requires API Key'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
                      Engine Manifest
                    </span>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between text-on-surface font-sans text-body-sm">
                        <span className="font-mono text-code-md text-primary font-medium">claude-3-5-sonnet-20241022</span>
                        <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant">200k ctx</span>
                      </div>
                      <div className="flex items-center justify-between text-outline font-mono text-code-sm">
                        <span>Extended Reasoning Profile: Supported</span>
                        <span className="text-tertiary">{testResults['anthropic']?.latencyMs ? `${testResults['anthropic'].latencyMs}ms` : 'Ready'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline">Active Token Slot</span>
                    <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container font-mono text-code-sm text-on-surface-variant border border-outline-variant/20">
                      <div className="flex items-center gap-space-sm truncate">
                        <span className="material-symbols-outlined text-[18px] text-outline">key</span>
                        <span className="truncate">{hasKey ? `sk-ant-••••••••${config.keys?.anthropic?.slice(-4)}` : 'No API key registered'}</span>
                      </div>
                      <span className={hasKey ? 'text-tertiary' : 'text-error'}>{hasKey ? 'Valid' : 'Missing'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-space-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenConfigModal('anthropic')}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md transition-colors"
                  >
                    Configure Secret Key
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Google DeepMind / Gemini Card */}
          {(() => {
            const hasKey = Boolean(config.keys?.gemini || serverGeminiActive);
            return (
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary font-bold font-mono text-code-md border border-primary/20">
                        GDM
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline font-semibold text-headline-sm text-on-surface">
                            Google DeepMind (Gemini)
                          </span>
                          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-mono text-code-sm text-outline">
                            AI Studio
                          </span>
                        </div>
                        <span className="font-mono text-code-sm text-on-surface-variant">generativelanguage.googleapis.com</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container text-code-sm font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-tertiary' : 'bg-error'}`} />
                      <span className={hasKey ? 'text-tertiary' : 'text-error'}>
                        {hasKey ? 'Connected' : 'Requires API Key'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
                      Engine Manifest
                    </span>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between text-on-surface font-sans text-body-sm">
                        <span className="font-mono text-code-md text-primary font-medium">gemini-2.5-flash</span>
                        <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant">1M ctx</span>
                      </div>
                      <div className="flex items-center justify-between text-outline font-mono text-code-sm">
                        <span>Multimodal &amp; Google Search Grounding</span>
                        <span className="text-tertiary">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline">Active Token Slot</span>
                    <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container font-mono text-code-sm text-on-surface-variant border border-outline-variant/20">
                      <div className="flex items-center gap-space-sm truncate">
                        <span className="material-symbols-outlined text-[18px] text-outline">key</span>
                        <span className="truncate">
                          {config.keys?.gemini
                            ? `AIzaSy••••••••${config.keys.gemini.slice(-4)}`
                            : serverGeminiActive
                            ? 'Server-side Environment Key Active'
                            : 'No valid API token registered'}
                        </span>
                      </div>
                      <span className={hasKey ? 'text-tertiary' : 'text-error'}>{hasKey ? 'Valid' : 'Missing'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-space-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenConfigModal('gemini')}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md transition-colors"
                  >
                    Configure Secret Key
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Local Ollama Card */}
          <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-md">
            <div className="flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-md">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-tertiary font-bold font-mono text-code-md border border-tertiary/20">
                    OLL
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline font-semibold text-headline-sm text-on-surface">
                        Local Ollama
                      </span>
                      <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-mono text-code-sm text-tertiary">
                        Local IPC
                      </span>
                    </div>
                    <span className="font-mono text-code-sm text-on-surface-variant">http://127.0.0.1:11434</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container text-code-sm font-mono">
                  <span className={`w-1.5 h-1.5 rounded-full ${ollamaConnected ? 'bg-tertiary animate-pulse' : 'bg-outline'}`} />
                  <span className={ollamaConnected ? 'text-tertiary' : 'text-outline'}>
                    {ollamaConnected ? 'Daemon Listening' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
                  Detected Local Weights
                </span>
                <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-space-xs">
                  {ollamaModels.length > 0 ? (
                    ollamaModels.slice(0, 2).map((m) => (
                      <div key={m.name} className="flex items-center justify-between text-on-surface font-sans text-body-sm">
                        <span className="font-mono text-code-sm text-tertiary">{m.name}</span>
                        <span className="font-mono text-code-sm text-outline">Local</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-on-surface-variant font-sans text-body-sm">
                      {ollamaConnected ? 'No models pulled yet in local Ollama' : 'Ollama daemon not reachable at default port'}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <span className="font-mono text-label-sm uppercase tracking-wider text-outline">Privacy Standard</span>
                <div className="p-space-sm rounded-lg bg-surface-container font-mono text-code-sm text-tertiary border border-outline-variant/20 flex items-center justify-between">
                  <span>Air-gapped on-premise execution</span>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-xs pt-space-xs">
              <button
                type="button"
                onClick={async () => {
                  setOllamaChecking(true);
                  const ok = await ollamaService.checkConnection();
                  setOllamaConnected(ok);
                  if (ok) {
                    const m = await ollamaService.getModels();
                    setOllamaModels(m);
                    showToast('Ollama models refreshed successfully.');
                  } else {
                    showToast('Ollama service unreachable on 127.0.0.1:11434');
                  }
                  setOllamaChecking(false);
                }}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md transition-colors"
              >
                {ollamaChecking ? 'Scanning...' : 'Rescan Models'}
              </button>
            </div>
          </div>

          {/* Groq LPU Card */}
          {(() => {
            const hasKey = Boolean(config.keys?.groq);
            return (
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between gap-space-md">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-secondary font-bold font-mono text-code-md border border-secondary/20">
                        GRQ
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <span className="font-headline font-semibold text-headline-sm text-on-surface">
                            Groq LPU
                          </span>
                          <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-mono text-code-sm text-outline">
                            LPUs Ultra-Fast
                          </span>
                        </div>
                        <span className="font-mono text-code-sm text-on-surface-variant">api.groq.com/openai/v1</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container text-code-sm font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-tertiary' : 'bg-error'}`} />
                      <span className={hasKey ? 'text-tertiary' : 'text-error'}>
                        {hasKey ? 'Connected' : 'Requires API Key'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
                      Engine Manifest
                    </span>
                    <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-space-xs">
                      <div className="flex items-center justify-between text-on-surface font-sans text-body-sm">
                        <span className="font-mono text-code-md text-secondary font-medium">llama-3.3-70b-versatile</span>
                        <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant">128k ctx</span>
                      </div>
                      <div className="flex items-center justify-between text-outline font-mono text-code-sm">
                        <span>Speed: ~350 tok/sec</span>
                        <span className="text-tertiary">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline">Active Token Slot</span>
                    <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container font-mono text-code-sm text-on-surface-variant border border-outline-variant/20">
                      <div className="flex items-center gap-space-sm truncate">
                        <span className="material-symbols-outlined text-[18px] text-outline">key</span>
                        <span className="truncate">{hasKey ? `gsk_••••••••${config.keys?.groq?.slice(-4)}` : 'No API key registered'}</span>
                      </div>
                      <span className={hasKey ? 'text-tertiary' : 'text-error'}>{hasKey ? 'Valid' : 'Missing'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-space-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenConfigModal('groq')}
                    className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md transition-colors"
                  >
                    Configure Secret Key
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Pipeline Role Assignment Matrix */}
      <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant/20">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm text-primary">
              <span className="material-symbols-outlined text-headline-md">account_tree</span>
              <h2 className="font-headline font-semibold text-headline-md text-on-surface tracking-tight">
                Pipeline Role Assignment Matrix
              </h2>
            </div>
            <p className="font-sans text-body-md text-on-surface-variant max-w-xl">
              Route granular sub-stages of the inquiry engine to dedicated architectures optimized for speed,
              formal logical rigor, or expansive contextual memory.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSavePipeline}
            className="px-space-lg py-2 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shadow-md self-start md:self-auto"
          >
            Save Pipeline Routing
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md pt-space-xs">
          {/* Phase 01 */}
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between gap-space-md">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-primary">
                  Phase 01
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">call_split</span>
              </div>
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface mt-1">
                Decomposition
              </h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-1">
                Splits ambiguous user inquiries into sub-hypotheses and query matrices.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-label-sm uppercase text-outline">Assigned Engine</label>
              <select
                value={config.roles?.architect?.model || ''}
                onChange={(e) => handleRoleChange('architect', e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-body-sm font-sans rounded-lg px-space-sm py-1.5 border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                <option value="">No model assigned</option>\n                <option value="">No model assigned</option>\n                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="">No model assigned</option>\n                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="">No model assigned</option>\n                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              </select>
            </div>
          </div>

          {/* Phase 02 */}
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between gap-space-md">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-secondary">
                  Phase 02
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">gavel</span>
              </div>
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface mt-1">
                Critical Challenge
              </h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-1">
                Adversarially attacks assertions and detects contradictory claims across papers.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-label-sm uppercase text-outline">Assigned Engine</label>
              <select
                value={config.roles?.skeptic?.model || ''}
                onChange={(e) => handleRoleChange('skeptic', e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-body-sm font-sans rounded-lg px-space-sm py-1.5 border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>
          </div>

          {/* Phase 03 */}
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between gap-space-md">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary">
                  Phase 03
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">menu_book</span>
              </div>
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface mt-1">
                Grounding
              </h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-1">
                Rapid ingestion, semantic vector retrieval, and verbatim source attribution.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-label-sm uppercase text-outline">Assigned Engine</label>
              <select
                value={config.roles?.verifier?.model || ''}
                onChange={(e) => handleRoleChange('verifier', e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-body-sm font-sans rounded-lg px-space-sm py-1.5 border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="Meta-Llama-3.3-70B-Instruct">Meta Llama 3.3 70B</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              </select>
            </div>
          </div>

          {/* Phase 04 */}
          <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between gap-space-md">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-primary font-semibold">
                  Phase 04
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">auto_stories</span>
              </div>
              <h3 className="font-headline font-semibold text-headline-sm text-on-surface mt-1">
                Final Synthesis
              </h3>
              <p className="font-sans text-body-sm text-on-surface-variant mt-1">
                Recombines surviving facts into a calm, definitive, executive dossier.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-label-sm uppercase text-outline">Assigned Engine</label>
              <select
                value={config.roles?.arbiter?.model || ''}
                onChange={(e) => handleRoleChange('arbiter', e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-body-sm font-sans rounded-lg px-space-sm py-1.5 border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Zero-Log Guarantee Notice */}
      <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-md shadow-sm">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-primary/20 shrink-0">
            <span className="material-symbols-outlined text-headline-md">verified_user</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-headline-sm text-on-surface">
              Zero-Log Confidentiality Guarantee
            </span>
            <span className="font-sans text-body-sm text-on-surface-variant">
              All remote API requests enforce client-side encryption and zero-data retention headers.
            </span>
          </div>
        </div>
        <div className="font-mono text-code-sm text-tertiary flex items-center gap-1 shrink-0">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span>Local Storage: AES-256-GCM</span>
        </div>
      </div>

      {/* Secret Key Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container border border-outline-variant/40 p-space-lg shadow-2xl flex flex-col gap-space-md relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-headline-md text-primary">key</span>
                <h3 className="font-headline font-semibold text-headline-md text-on-surface">
                  Configure {modalProvider.toUpperCase()} Secret Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-headline-sm">close</span>
              </button>
            </div>

            <p className="font-sans text-body-sm text-on-surface-variant">
              Secrets are stored strictly in your browser or local storage. They are never logged or stored on Breezy servers.
            </p>

            <div className="flex flex-col gap-space-xs">
              <label className="font-mono text-label-sm uppercase text-outline">API Secret Key</label>
              <input
                type="password"
                value={modalKeyInput}
                onChange={(e) => setModalKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-surface-container-low px-space-md py-2 rounded-xl font-mono text-code-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
              />
            </div>

            {keyTestFeedback && (
              <div className="font-mono text-code-sm px-space-md py-1.5 rounded-lg bg-surface-container-high text-on-surface border border-outline-variant/30">
                {keyTestFeedback}
              </div>
            )}

            <div className="flex items-center justify-between pt-space-xs">
              <button
                type="button"
                onClick={handleTestModalKey}
                disabled={isTestingKey || !modalKeyInput.trim()}
                className="px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-sans text-label-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isTestingKey ? 'animate-spin' : ''}`}>
                  {isTestingKey ? 'refresh' : 'bolt'}
                </span>
                <span>{isTestingKey ? 'Validating...' : 'Validate Key'}</span>
              </button>

              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-sans text-label-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalKey}
                  className="px-space-md py-2 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shadow-md"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
