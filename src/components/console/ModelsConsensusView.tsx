import React, { useState, useEffect } from 'react';
import { providerConfigService, CanonicalWorkspaceConfig } from '../../services/providerConfigService';
import { apiClient } from '../../services/apiClient';

interface ModelsConsensusViewProps {
  onOpenSettings: () => void;
}

export const ModelsConsensusView: React.FC<ModelsConsensusViewProps> = ({ onOpenSettings }) => {
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

    const providersToTest = ['gemini', 'anthropic', 'groq', 'sambanova', 'openrouter'].filter(
      (p) => Boolean(keys[p]) || p === 'gemini'
    );

    for (const p of providersToTest) {
      const apiKey = keys[p] || '';
      if (p === 'gemini' && !apiKey) {
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
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] bg-[#10141a] text-stone-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#181c22] text-stone-100 px-4 py-2.5 rounded-lg shadow-xl border border-white/10 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="text-xs font-sans">{toastMessage}</span>
        </div>
      )}

      {/* Header Context */}
      <div className="px-4 sm:px-8 py-6 border-b border-white/10 bg-[#12151c]/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-stone-400 font-sans">
            Model Routing & Calibration
          </span>
          <h1 className="text-2xl font-serif font-medium text-stone-100 tracking-tight">
            Active Research Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            How Breezy executes multi-perspective analysis: assigned models for hypothesis building, adversarial critique, factual verification, and synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRebenchmark}
            disabled={isBenchmarking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[15px] ${isBenchmarking ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isBenchmarking ? 'Testing...' : 'Test Provider Keys'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-950 text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Customize Routing</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex flex-col gap-6 max-w-7xl">
        {/* Section 1: Active Role Assignments */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ccbdff] text-[18px]">account_tree</span>
              <h2 className="font-sans text-base font-semibold text-stone-100">
                Configured Model Roles
              </h2>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Preset: {(config.preset || 'balanced').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { roleKey: 'architect', title: 'Analyst', sub: 'Initial Argument', desc: 'Framing & core thesis proposal.' },
              { roleKey: 'skeptic', title: 'Critic', sub: 'Stress Testing', desc: 'Identifies flaws & edge cases.' },
              { roleKey: 'verifier', title: 'Verifier', sub: 'Fact Checking', desc: 'Evidence & constraint validation.' },
              { roleKey: 'arbiter', title: 'Synthesizer', sub: 'Executive Resolution', desc: 'Produces consensus summary.' },
            ].map((item) => {
              const seat = rolesMap[item.roleKey as keyof typeof rolesMap] || { provider: 'gemini', model: 'gemini-3.8-flash' };
              const testInfo = testResults[seat.provider];
              return (
                <div key={item.roleKey} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="font-mono text-[10px] text-[#ccbdff] uppercase">{item.sub}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-stone-300 border border-white/10 uppercase">
                        {seat.provider}
                      </span>
                    </div>
                    <h3 className="font-sans text-sm font-bold text-stone-100">{item.title}</h3>
                    <p className="font-sans text-xs text-stone-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-stone-300 truncate max-w-[140px]">{seat.model}</span>
                    {testInfo ? (
                      <span className={`text-[10px] ${testInfo.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {testInfo.ok ? `${testInfo.latencyMs ? `${testInfo.latencyMs}ms` : 'OK'}` : 'Failed'}
                      </span>
                    ) : (
                      <span className="text-stone-500 text-[10px]">Active</span>
                    )}
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
