import React, { useState } from 'react';

interface ModelsConsensusViewProps {
  onOpenSettings: () => void;
}

export const ModelsConsensusView: React.FC<ModelsConsensusViewProps> = ({ onOpenSettings }) => {
  const [agreementThreshold, setAgreementThreshold] = useState(78);
  const [adversarialHardening, setAdversarialHardening] = useState(true);
  const [deepSeekPromoted, setDeepSeekPromoted] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRebenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      setIsBenchmarking(false);
      showToast('Triad re-benchmarked: 16.2ms avg latency, 94.8% convergence');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-surface-container-highest text-on-surface px-4 py-2.5 rounded-lg shadow-xl border border-outline-variant/40 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">task_alt</span>
          <span className="font-mono text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Sub-header Breadcrumb & Operational Controls */}
      <div className="px-4 sm:px-8 py-3 bg-surface-container-lowest/60 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-tertiary">synthexis</span>
          <span className="text-outline-variant">/</span>
          <span className="text-tertiary">workspace</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-medium tracking-tight">model-matrix</span>
          <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container border border-secondary/30">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono text-[10px] text-secondary">
              {deepSeekPromoted ? '4 Nodes Active (Quad)' : '4 Nodes Configured • 3 Active'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRebenchmark}
            disabled={isBenchmarking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/40 transition-colors shadow-xs"
          >
            <span className={`material-symbols-outlined text-[15px] text-tertiary ${isBenchmarking ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isBenchmarking ? 'Benchmarking...' : 'Re-benchmark Triad'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Model Node</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex flex-col gap-6 max-w-7xl">
        {/* Page Header Context */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-xl sm:text-2xl text-on-surface tracking-tight font-semibold">
              Models & Consensus Arbitration
            </h1>
            <span className="font-mono text-[11px] text-tertiary bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">
              TRIAD-P2P
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Configure model roles in the dialectic triad, benchmark consensus convergence, and manage node routing weights across adversarial synthesis rounds.
          </p>
        </div>

        {/* KPI Stats Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                Consensus Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-2xl font-semibold text-on-surface">94.2%</span>
                <span className="font-mono text-xs text-secondary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>+1.4%
                </span>
              </div>
              <span className="font-mono text-[11px] text-tertiary">Optimal semantic alignment</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                Average Triad Latency
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-2xl font-semibold text-on-surface">
                  16.4<span className="text-sm text-tertiary ml-0.5">ms</span>
                </span>
                <span className="font-mono text-[11px] text-secondary font-medium">P95: 28ms</span>
              </div>
              <span className="font-mono text-[11px] text-tertiary">Parallel dispatch verified</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px]">speed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase text-outline tracking-wider font-semibold">
                Triad Operational Status
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-2xl font-semibold text-on-surface">
                  {deepSeekPromoted ? '4 Active' : '3 Active'}
                </span>
                <span className="font-mono text-[11px] text-tertiary">
                  {deepSeekPromoted ? '0 Standby' : '1 Standby'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                All nodes healthy
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
          </div>
        </div>

        {/* Section 1: Active Dialectic Triad Roles */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
              <h2 className="font-sans text-base text-on-surface font-semibold">
                Active Dialectic Triad Roles
              </h2>
              <span className="font-mono text-[10px] text-tertiary bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">
                P2P Cluster Pipeline
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-outline">
              <span>Routing Total:</span>
              <span className="text-secondary font-medium">100% Allocated</span>
            </div>
          </div>

          {/* Cards Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Claude 3.5 Sonnet */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_#7bdb80]"></span>
                    <span className="font-mono text-[10px] text-tertiary uppercase">Node 01</span>
                  </div>
                  <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-medium">
                    Weight 35%
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-sans text-base font-semibold text-on-surface">Claude 3.5 Sonnet</h3>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary uppercase mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                      Lead Analyst (Thesis)
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[18px]">neurology</span>
                  </div>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Generates structural foundations, primary analytical framing, and empirical proposition sets.
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-tertiary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>12ms • Anthropic
                </span>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-medium border border-outline-variant/30 transition-colors"
                >
                  <span>Configure</span>
                  <span className="material-symbols-outlined text-[13px]">tune</span>
                </button>
              </div>
            </div>

            {/* GPT-4o */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-error/50 transition-all flex flex-col justify-between shadow-xs gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_#7bdb80]"></span>
                    <span className="font-mono text-[10px] text-tertiary uppercase">Node 02</span>
                  </div>
                  <span className="font-mono text-[10px] text-error bg-error/10 border border-error/20 px-2 py-0.5 rounded font-medium">
                    Weight 35%
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-sans text-base font-semibold text-on-surface">GPT-4o</h3>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-error uppercase mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">gavel</span>
                      Adversarial Critic (Antithesis)
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-error border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[18px]">security</span>
                  </div>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Identifies counter-premises, edge-case vulnerability vectors, and logical incoherencies.
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-tertiary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>18ms • OpenAI
                </span>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-medium border border-outline-variant/30 transition-colors"
                >
                  <span>Configure</span>
                  <span className="material-symbols-outlined text-[13px]">tune</span>
                </button>
              </div>
            </div>

            {/* Gemini 1.5 Pro */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-secondary/50 transition-all flex flex-col justify-between shadow-xs gap-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_#7bdb80]"></span>
                    <span className="font-mono text-[10px] text-tertiary uppercase">Node 03</span>
                  </div>
                  <span className="font-mono text-[10px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded font-medium">
                    Weight 30%
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-sans text-base font-semibold text-on-surface">Gemini 1.5 Pro</h3>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-secondary uppercase mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">hub</span>
                      Harmonizer & Synthesizer
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[18px]">balance</span>
                  </div>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Reconciles Thesis-Antithesis divergence into actionable, consensus-validated outputs.
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-mono text-[11px] text-tertiary flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>14ms • Google AI
                </span>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-medium border border-outline-variant/30 transition-colors"
                >
                  <span>Configure</span>
                  <span className="material-symbols-outlined text-[13px]">tune</span>
                </button>
              </div>
            </div>
          </div>

          {/* Standby / Fallback Node Banner */}
          <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-outline text-[20px]">dns</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-semibold text-on-surface">DeepSeek R1</span>
                  <span className="font-mono text-[9px] text-outline bg-surface-container px-1.5 py-0.2 rounded border border-outline-variant/30 uppercase">
                    {deepSeekPromoted ? 'Active Node (Promoted)' : 'Standby Node'}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-tertiary">
                  <span>Role: Deep Reasoning Verifier (Fallback)</span>
                  <span>•</span>
                  <span>Endpoint: Self-Hosted vLLM Instance (cluster-internal:8080)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant/30">
                <span className={`w-2 h-2 rounded-full ${deepSeekPromoted ? 'bg-secondary' : 'bg-outline'}`}></span>
                <span className="font-mono text-[10px] text-tertiary uppercase">
                  {deepSeekPromoted ? 'Online in Quad' : 'Idle / Ready'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeepSeekPromoted(!deepSeekPromoted);
                  showToast(deepSeekPromoted ? 'DeepSeek R1 demoted to Standby' : 'DeepSeek R1 promoted to Active Triad');
                }}
                className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium border border-outline-variant/40 transition-colors"
              >
                {deepSeekPromoted ? 'Demote to Standby' : 'Promote to Triad'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Consensus & Arbitration Rules + Benchmark Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consensus Rules */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                <h2 className="font-sans text-base text-on-surface font-semibold">
                  Consensus & Arbitration Rules
                </h2>
              </div>
              <span className="font-mono text-[10px] text-secondary bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded">
                Active Matrix
              </span>
            </div>

            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-4 shadow-xs">
              <div className="flex flex-col gap-2 pb-3 border-b border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-sans text-xs text-on-surface font-medium">Agreement Threshold</span>
                    <span className="font-mono text-[10px] text-outline">
                      Consensus triggers at {agreementThreshold}% convergence
                    </span>
                  </div>
                  <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded font-semibold">
                    {agreementThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={agreementThreshold}
                  onChange={(e) => setAgreementThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-on-surface font-medium">Fallback Mechanism</span>
                  <span className="font-mono text-[10px] text-outline">Synthesizer reconciles divergence</span>
                </div>
                <span className="font-mono text-[11px] text-on-surface bg-surface-container-high px-2.5 py-1 rounded border border-outline-variant/30">
                  Gemini 1.5 Pro
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="font-sans text-xs text-on-surface font-medium">Adversarial Hardening</span>
                  <span className="font-mono text-[10px] text-outline">Run 2-pass counter-claim injection</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdversarialHardening(!adversarialHardening)}
                  className={`w-9 h-5 rounded-full relative p-0.5 transition-colors ${
                    adversarialHardening ? 'bg-primary-container' : 'bg-surface-container-highest'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-on-primary shadow-xs transition-transform ${
                      adversarialHardening ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Node Benchmark Matrix */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">analytics</span>
                <h2 className="font-sans text-base text-on-surface font-semibold">Node Benchmark Matrix</h2>
              </div>
              <span className="font-mono text-[10px] text-outline">1,000 Rounds Tracked</span>
            </div>

            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col justify-between gap-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[22px]">insights</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-medium text-on-surface">
                      All Triad Nodes Benchmarked
                    </span>
                    <span className="font-mono text-[11px] text-secondary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>Convergence stability at 96.4%
                    </span>
                  </div>
                </div>
                <div className="font-mono text-xs text-tertiary text-right">
                  <span className="text-on-surface font-semibold">±1.8ms</span>
                  <span className="block text-[9px] text-outline uppercase">Jitter</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between font-mono text-[11px]">
                <span className="text-outline">
                  Top Alignment: <span className="text-on-surface font-medium">Gemini 1.5 Pro (98.2%)</span>
                </span>
                <span className="text-outline">
                  Avg Token Cost: <span className="text-tertiary font-medium">$0.0038/1k</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleRebenchmark}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-sans text-xs font-medium border border-outline-variant/40 transition-colors shadow-xs group"
              >
                <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-105 transition-transform">
                  open_in_new
                </span>
                <span>Inspect Detailed Telemetry & Benchmarks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
