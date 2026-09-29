import React, { useState, useEffect } from 'react';
import { providerConfigService, CanonicalWorkspaceConfig } from '../../services/providerConfigService';
import { apiClient } from '../../services/apiClient';

interface ModelsSynthexisViewProps {
  onOpenSettings: () => void;
}

export const ModelsSynthexisView: React.FC<ModelsSynthexisViewProps> = ({ onOpenSettings }) => {
  const [config, setConfig] = useState<CanonicalWorkspaceConfig>(() => providerConfigService.getConfig());
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latencyMs?: number; msg?: string }>>({});

  useEffect(() => {
    setConfig(providerConfigService.getConfig());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRebenchmark = async () => {
    setIsBenchmarking(true);
    const results: Record<string, { ok: boolean; latencyMs?: number; msg?: string }> = {};
    const keys = config.keys || {};

    // First check server health to see if server-side Gemini is available
    let serverGeminiActive = false;
    try {
      const health = await apiClient.getHealth();
      serverGeminiActive = !!health.serverGeminiConfigured;
    } catch {}

    const providersToTest = ['gemini', 'anthropic', 'groq', 'sambanova', 'openrouter'].filter(
      (p) => Boolean(keys[p]) || (p === 'gemini' && serverGeminiActive)
    );

    for (const p of providersToTest) {
      const apiKey = keys[p] || '';
      if (p === 'gemini' && !apiKey && serverGeminiActive) {
        results[p] = { ok: true, msg: 'Server Gemini API Key configured.' };
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

  const rolesMap = config.roles || {
    architect: { provider: 'gemini', model: 'gemini-3.8-flash' },
    skeptic: { provider: 'gemini', model: 'gemini-3.8-flash' },
    verifier: { provider: 'gemini', model: 'gemini-3.8-flash' },
    arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
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
              Infrastructure
            </span>
            <span aria-hidden="true" className="text-stone-700">·</span>
            <span className="font-mono text-[10px] text-stone-600 uppercase tracking-widest font-bold font-mono">Standard Configuration</span>
          </div>
          <h1 className="text-3xl font-serif italic font-medium text-stone-100 tracking-tight">
            Research Topology
          </h1>
          <p className="text-[12px] text-stone-500 leading-relaxed font-serif italic max-w-xl">
            A directory of active compute nodes assigned to hypothesis formation, adversarial critique, and verification.
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
            <span>Adjust Routing</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex flex-col gap-10 max-w-7xl mx-auto w-full">
        {/* Section 1: Active Role Assignments */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-stone-500 text-[20px]">hub</span>
              <h2 className="font-serif italic text-lg text-stone-100">
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
              const seat = rolesMap[item.roleKey as keyof typeof rolesMap] || { provider: 'gemini', model: 'gemini-3.8-flash' };
              const testInfo = testResults[seat.provider];
              return (
                <div key={item.roleKey} className="p-6 rounded-xl bg-stone-900/10 border border-stone-800/40 flex flex-col gap-6 hover:border-stone-700/60 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] text-stone-500 uppercase tracking-[0.2em] font-bold">{item.sub}</span>
                      <h3 className="font-serif italic text-xl text-stone-200">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-950 border border-stone-800">
                      <span className="font-mono text-[10px] text-stone-400 uppercase font-bold tracking-tight">
                        {seat.provider}
                      </span>
                    </div>
                  </div>
                  
                  <p className="font-sans text-[13px] text-stone-500 leading-relaxed italic">{item.desc}</p>
                  
                  <div className="pt-4 border-t border-stone-800/40 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-stone-600 uppercase font-bold tracking-widest mb-1">Assigned Model</span>
                      <span className="font-mono text-[11px] text-stone-300 font-bold tracking-tighter">{seat.model}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-stone-600 uppercase font-bold tracking-widest mb-1">Status</span>
                      {testInfo ? (
                        <span className={`font-mono text-[11px] font-bold ${testInfo.ok ? 'text-stone-100' : 'text-amber-600'}`}>
                          {testInfo.ok ? `${testInfo.latencyMs ? `${testInfo.latencyMs}ms` : 'Verified'}` : 'Verification Failed'}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-stone-600 font-bold uppercase tracking-widest italic">
                          Unconfigured
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
