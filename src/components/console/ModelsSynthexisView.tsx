import React, { useState, useEffect } from 'react';
import { providerConfigService, CanonicalWorkspaceConfig, AVAILABLE_MODELS } from '../../services/providerConfigService';
import { effectiveProviderService } from '../../services/effectiveProviderService';
import { apiClient } from '../../services/apiClient';

interface ModelsSynthexisViewProps {
  onOpenSettings: () => void;
}

export const ModelsSynthexisView: React.FC<ModelsSynthexisViewProps> = ({ onOpenSettings }) => {
  const [config, setConfig] = useState<CanonicalWorkspaceConfig>(() => providerConfigService.getConfig());
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latencyMs?: number; msg?: string }>>({});

  const [serverGeminiActive, setServerGeminiActive] = useState(false);

  useEffect(() => {
    setConfig(providerConfigService.getConfig());
    apiClient.getHealth().then((h) => {
      setServerGeminiActive(!!h.serverGeminiConfigured);
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRebenchmark = async () => {
    setIsBenchmarking(true);
    const results: Record<string, { ok: boolean; latencyMs?: number; msg?: string }> = {};
    const keys = config.keys || {};

    let serverGemini = false;
    try {
      const health = await apiClient.getHealth();
      serverGemini = !!health.serverGeminiConfigured;
      setServerGeminiActive(serverGemini);
    } catch {}

    const providersToTest = ['gemini', 'anthropic', 'groq', 'sambanova', 'openrouter'].filter(
      (p) => Boolean(keys[p]) || (p === 'gemini' && serverGemini)
    );

    if (providersToTest.length === 0) {
      setIsBenchmarking(false);
      showToast('No API keys configured to test. Please add credentials in Settings.');
      return;
    }

    for (const p of providersToTest) {
      const apiKey = keys[p] || '';
      if (p === 'gemini' && !apiKey && serverGemini) {
        results[p] = { ok: true, msg: 'Server Gemini Key Active' };
        continue;
      }
      try {
        const startTime = Date.now();
        const res = await apiClient.verifyVaultKey(p, apiKey);
        if (res.valid) {
          results[p] = { ok: true, latencyMs: res.latencyMs || Date.now() - startTime, msg: res.message };
        } else {
          results[p] = { ok: false, msg: res.error || 'Key verification failed' };
        }
      } catch (e: any) {
        results[p] = { ok: false, msg: e.message || 'Verification error' };
      }
    }

    setTestResults(results);
    setIsBenchmarking(false);
    showToast('Verified active provider endpoints and key credentials.');
  };

  const updateRole = (roleKey: keyof CanonicalWorkspaceConfig['roles'], provider: string, model: string) => {
    const next = providerConfigService.getConfig();
    next.roles = {
      ...next.roles,
      [roleKey]: { provider: provider as any, model },
    };
    next.preset = 'custom';
    providerConfigService.saveConfig(next);
    setConfig(next);
  };

  const rolesMap = config.roles || {
    architect: { provider: '', model: '' },
    skeptic: { provider: '', model: '' },
    verifier: { provider: '', model: '' },
    arbiter: { provider: '', model: '' },
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] bg-stone-950 text-stone-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-lg shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
          <span className="material-symbols-outlined text-stone-400 text-[18px]">check_circle</span>
          <span className="font-mono text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header Context */}
      <div className="px-4 sm:px-8 py-8 border-b border-stone-800/40 bg-stone-900/10 flex flex-wrap items-center justify-between gap-6 backdrop-blur-sm">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">
              MODEL CONTROL
            </span>
            <span aria-hidden="true" className="text-stone-700">·</span>
            <span className="font-mono text-[10px] text-stone-600 uppercase tracking-widest font-bold font-mono">USER-DEFINED STACK</span>
          </div>
          <h1 className="text-3xl font-serif italic font-medium text-stone-100 tracking-tight">
            Model & Research Control
          </h1>
          <p className="text-[12px] text-stone-500 leading-relaxed font-sans max-w-xl">
            Choose exactly how Breezy researches: which models do what, where evidence comes from, and how much structure the investigation uses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRebenchmark}
            disabled={isBenchmarking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900/40 hover:bg-stone-800 text-stone-400 hover:text-stone-100 text-[11px] font-bold uppercase tracking-widest border border-stone-800/60 transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] ${isBenchmarking ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isBenchmarking ? 'Running Health Check' : 'Verify Credentials'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-100 text-stone-950 text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all cursor-pointer shadow-lg"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Customize stack</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 pt-6 max-w-7xl mx-auto w-full">
        <section className="border border-stone-800/60 bg-stone-900/10 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-stone-100">Research controls</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">This is the part that makes Breezy yours. Presets are starting points; Custom lets you decide the research method and search layer.</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-stone-600 font-mono">No provider = no model</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">Research method</span>
              <select value={config.researchMethod || 'adaptive'} onChange={(e) => {
                const next = providerConfigService.getConfig();
                next.researchMethod = e.target.value as any;
                next.preset = 'custom';
                providerConfigService.saveConfig(next);
                setConfig(next);
              }} className="bg-stone-950 border border-stone-800 rounded-md px-3 py-2.5 text-xs text-stone-200 outline-none">
                <option value="adaptive">Adaptive — choose depth from the question</option>
                <option value="systematic">Systematic — explicit question → evidence → claims</option>
                <option value="evidence-map">Evidence map — themes, gaps & contradictions</option>
                <option value="comparative">Comparative — criteria before alternatives</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">Search layer</span>
              <select value={config.searchEngine || 'duckduckgo'} onChange={(e) => {
                const next = providerConfigService.getConfig();
                next.searchEngine = e.target.value as any;
                next.preset = 'custom';
                providerConfigService.saveConfig(next);
                setConfig(next);
              }} className="bg-stone-950 border border-stone-800 rounded-md px-3 py-2.5 text-xs text-stone-200 outline-none">
                <option value="duckduckgo">DuckDuckGo — no key required</option>
                <option value="tavily">Tavily — connected API key</option>
                <option value="serper">Serper — connected API key</option>
                <option value="brave">Brave Search — connected API key</option>
                <option value="searxng">SearXNG — self-hosted</option>
              </select>
            </label>
          </div>
        </section>

        <section className="border border-stone-800/60 bg-stone-900/10 rounded-lg p-5 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-100">AI access options</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                BYOK keeps provider credentials under your control. Puter.js is an optional user-pays path for the Breezy IDE Agent, so IDE assistance does not require another provider key.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1.5 rounded-md border border-stone-800 text-[10px] font-mono text-stone-400">BYOK · Synthexis</span>
              <span className="px-2.5 py-1.5 rounded-md border border-stone-800 text-[10px] font-mono text-stone-400">Puter.js · IDE Agent</span>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 sm:p-8 flex flex-col gap-10 max-w-7xl mx-auto w-full">
        {/* Section 1: Active Role Assignments */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-500 text-[20px]">hub</span>
              <h2 className="font-sans text-sm text-stone-100">
                Compute Allocations
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500 uppercase tracking-widest">
              <span>Preset Mode</span>
              <span className="text-stone-100 font-bold">{config.preset || 'Balanced'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { roleKey: 'architect', title: 'Lead Analyst', sub: 'Hypothesis Formulation', desc: 'Responsible for framing the initial thesis and proposing a coherent structural response.' },
              { roleKey: 'skeptic', title: 'Adversary', sub: 'Stress Testing', desc: 'Identifies logical flaws, edge cases, and areas of insufficient evidence within the thesis.' },
              { roleKey: 'verifier', title: 'Verifier', sub: 'Fact Verification', desc: 'Validates claims against external constraints and ensures evidential integrity.' },
              { roleKey: 'arbiter', title: 'Synthesizer', sub: 'Resolution', desc: 'Reconciles conflicting perspectives into a unified, high-fidelity research output.' },
            ].map((item) => {
              const seat = rolesMap[item.roleKey as keyof typeof rolesMap] || { provider: '', model: '' };
              const hasProviderKey = Boolean(config.keys?.[seat.provider]) || (seat.provider === 'gemini' && serverGeminiActive);
              const isConfigured = Boolean(seat.provider && seat.model && hasProviderKey);
              const testInfo = testResults[seat.provider];
              return (
                <div key={item.roleKey} className="p-6 rounded-xl bg-stone-900/10 border border-stone-800/40 flex flex-col gap-5 hover:border-stone-700/60 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] text-stone-500 uppercase tracking-[0.2em] font-bold">{item.sub}</span>
                      <h3 className="font-sans text-lg text-stone-200">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-950 border border-stone-800">
                      <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-stone-600'}`} />
                      <span className="font-mono text-[10px] text-stone-400 uppercase font-bold tracking-tight">
                        {seat.provider ? seat.provider : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="font-sans text-[13px] text-stone-500 leading-relaxed italic">{item.desc}</p>
                  
                  <div className="pt-4 border-t border-stone-800/40 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-stone-600 uppercase font-bold tracking-widest">Provider</span>
                        <select value={seat.provider || ''} onChange={(e) => {
                          const nextProvider = e.target.value;
                          const firstModel = nextProvider ? (AVAILABLE_MODELS?.[nextProvider]?.[0]?.id || '') : '';
                          updateRole(item.roleKey as keyof CanonicalWorkspaceConfig['roles'], nextProvider, firstModel);
                        }} className="bg-stone-950 border border-stone-800 rounded-md px-2 py-2 text-[10px] text-stone-300 outline-none">
                          <option value="">Unassigned</option>
                          {Object.keys(AVAILABLE_MODELS).map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[9px] text-stone-600 uppercase font-bold tracking-widest">Model</span>
                        <select value={seat.model || ''} disabled={!seat.provider} onChange={(e) => updateRole(item.roleKey as keyof CanonicalWorkspaceConfig['roles'], seat.provider, e.target.value)} className="bg-stone-950 border border-stone-800 rounded-md px-2 py-2 text-[10px] text-stone-300 outline-none disabled:opacity-40">
                          <option value="">No model</option>
                          {(AVAILABLE_MODELS[seat.provider] || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <input value={seat.model || ''} disabled={!seat.provider} onChange={(e) => updateRole(item.roleKey as keyof CanonicalWorkspaceConfig['roles'], seat.provider, e.target.value)} placeholder="Custom model ID" className="bg-stone-950 border border-stone-800 rounded-md px-2 py-1.5 text-[10px] text-stone-400 outline-none disabled:opacity-40" aria-label="Custom model ID" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-stone-600 uppercase font-bold tracking-widest mb-1">Status</span>
                      {!seat.provider || !seat.model ? (
                        <span className="font-mono text-[10px] text-stone-600 font-bold uppercase tracking-widest">
                          UNASSIGNED
                        </span>
                      ) : !hasProviderKey ? (
                        <span className="font-mono text-[10px] text-amber-400/90 font-bold uppercase tracking-widest">
                          NOT CONNECTED
                        </span>
                      ) : testInfo ? (
                        <span className={`font-mono text-[10px] font-bold ${testInfo.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                          {testInfo.ok ? `CONNECTED (${testInfo.latencyMs ? `${testInfo.latencyMs}ms` : 'OK'})` : 'ERROR'}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-sky-400 font-bold uppercase tracking-widest">
                          CONFIGURED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
