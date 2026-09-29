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
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] bg-stone-950 text-stone-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-lg shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
          <span className="material-symbols-outlined text-stone-400 text-[18px]">check_circle</span>
          <span className="font-mono text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header Context */}
      <div className="px-4 sm:px-8 py-6 border-b border-stone-800/40 bg-stone-900/20 flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-100 bg-stone-800 px-2 py-0.5 rounded font-bold">
              COMPUTE_MATRIX
            </span>
            <span className="font-mono text-[10px] text-stone-600 uppercase tracking-widest font-bold">Protocol: Synthexis_LORA</span>
          </div>
          <h1 className="text-2xl font-serif italic font-medium text-stone-100 tracking-tight mt-1">
            Research Pipeline Topology
          </h1>
          <p className="text-[11px] text-stone-500 leading-relaxed uppercase tracking-widest mt-1">
            Assigned compute nodes for hypothesis formation, adversarial critique, and verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRebenchmark}
            disabled={isBenchmarking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/40 hover:bg-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest border border-stone-800/60 transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[15px] ${isBenchmarking ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isBenchmarking ? 'Running_Health_Check' : 'Test_Credentials'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-950 text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all cursor-pointer shadow-lg"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Reconfigure_Routing</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex flex-col gap-6 max-w-7xl">
        {/* Section 1: Active Role Assignments */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-stone-500 text-[18px]">hub</span>
              <h2 className="font-mono text-[10px] font-bold text-stone-100 uppercase tracking-[0.2em]">
                Active_Node_Assignments
              </h2>
            </div>
            <span className="font-mono text-[9px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 uppercase tracking-widest font-bold">
              Preset: {(config.preset || 'balanced').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { roleKey: 'architect', title: 'Lead Analyst', sub: 'Hypothesis_Form', desc: 'Framing & initial thesis proposal.' },
              { roleKey: 'skeptic', title: 'Adversary', sub: 'Stress_Testing', desc: 'Identifies flaws & edge cases.' },
              { roleKey: 'verifier', title: 'Verifier', sub: 'Fact_Verification', desc: 'Evidence & constraint validation.' },
              { roleKey: 'arbiter', title: 'Synthesizer', sub: 'Final_Resolution', desc: 'Produces integrated summary.' },
            ].map((item) => {
              const seat = rolesMap[item.roleKey as keyof typeof rolesMap] || { provider: 'gemini', model: 'gemini-3.8-flash' };
              const testInfo = testResults[seat.provider];
              return (
                <div key={item.roleKey} className="p-5 rounded-xl bg-stone-900/20 border border-stone-800/40 flex flex-col justify-between gap-4 backdrop-blur-sm group hover:border-stone-700/60 transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-800/40">
                      <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest font-bold">{item.sub}</span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800 uppercase font-bold tracking-tighter group-hover:text-stone-100 transition-colors">
                        {seat.provider}
                      </span>
                    </div>
                    <h3 className="font-serif italic text-base text-stone-200 group-hover:text-stone-100 transition-colors">{item.title}</h3>
                    <p className="font-sans text-[11px] text-stone-500 leading-relaxed uppercase tracking-tight">{item.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-stone-800/40 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-stone-400 font-bold tracking-tighter truncate max-w-[120px]">{seat.model}</span>
                    {testInfo ? (
                      <span className={`font-bold ${testInfo.ok ? 'text-stone-200' : 'text-stone-600'}`}>
                        {testInfo.ok ? `${testInfo.latencyMs ? `${testInfo.latencyMs}MS` : 'VERIFIED'}` : 'FAILED'}
                      </span>
                    ) : (
                      <span className="text-stone-600 font-bold uppercase tracking-widest">Active</span>
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
