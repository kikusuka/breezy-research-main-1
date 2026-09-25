import React, { useState } from 'react';

interface SynapWeakSpotsViewProps {
  onStartTriage: () => void;
  onReviewCard: (concept: string) => void;
}

export const SynapWeakSpotsView: React.FC<SynapWeakSpotsViewProps> = ({
  onStartTriage,
  onReviewCard,
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'moderate' | 'resolved'>('all');
  const [showResolvedArchive, setShowResolvedArchive] = useState(false);

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto animate-in fade-in duration-300 space-y-8">
      {/* Diagnostic Hero Section */}
      <section className="relative bg-[#1b1b23] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06),0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* High-tech backdrop accent lines */}
        <div className="absolute top-0 right-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <svg className="w-72 h-72 text-[#ccbdff]" fill="none" stroke="currentColor" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="100" strokeDasharray="4 6" strokeWidth="1"></circle>
            <circle cx="120" cy="120" r="70" strokeWidth="1.5"></circle>
            <circle className="text-[#ffb4ab]" cx="120" cy="120" r="30" strokeWidth="2"></circle>
            <path d="M120 20 L120 220 M20 120 L220 120" strokeDasharray="2 4" strokeWidth="0.75"></path>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/20 font-mono text-[10px] tracking-wide uppercase font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
                Live Threat Vector
              </span>
              <span className="font-mono text-[10px] text-[#cac4d4] font-semibold tracking-wider uppercase">
                • Exam in 4 Days
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl text-stone-100 tracking-tight font-bold">
              Exam Vulnerability Analysis
            </h1>

            <p className="font-sans text-xs sm:text-sm text-[#cac4d4] leading-relaxed">
              We identified{' '}
              <span className="text-stone-100 font-semibold underline decoration-[#ffb4ab]/50 underline-offset-4">
                7 critical concepts
              </span>{' '}
              dragging down your predicted score in{' '}
              <span className="text-[#e6deff] font-semibold">
                Cognitive Neuroscience
              </span>
              . Resolving the top 3 high-yield bottlenecks will lift your readiness from{' '}
              <span className="text-[#ffb4ab] font-bold">81%</span> to{' '}
              <span className="text-[#68fcbf] font-bold tracking-tight">94%</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={onStartTriage}
              className="group relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#9d85f2] to-[#644cb5] text-white font-sans text-xs font-bold shadow-[0_4px_24px_rgba(157,133,242,0.35)] hover:shadow-[0_8px_32px_rgba(157,133,242,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <span>Start High-Yield Triage Session</span>
              <span className="font-mono text-[10px] bg-white/15 px-2 py-0.5 rounded text-white">
                12 mins
              </span>
              <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>

            <div className="flex items-center justify-center lg:justify-start gap-1.5 text-[#cac4d4] px-1 font-sans text-xs">
              <span className="material-symbols-outlined text-[16px] text-[#45dfa4]">
                bolt
              </span>
              <span>Covers +13% total test weighting</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#0d0d15] rounded-xl border border-white/5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1f1f27] text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                : 'text-[#cac4d4] hover:text-stone-100'
            }`}
          >
            All Vulnerabilities (7)
          </button>
          <button
            type="button"
            onClick={() => setFilter('critical')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'critical'
                ? 'bg-[#1f1f27] text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                : 'text-[#cac4d4] hover:text-stone-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
            Critical Urgency (3)
          </button>
          <button
            type="button"
            onClick={() => setFilter('moderate')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'moderate'
                ? 'bg-[#1f1f27] text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                : 'text-[#cac4d4] hover:text-stone-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#cabeff]"></span>
            Moderate (2)
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'resolved'
                ? 'bg-[#1f1f27] text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                : 'text-[#cac4d4] hover:text-stone-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
            Resolved (14)
          </button>
        </div>

        <div className="flex items-center gap-2 text-[#cac4d4] text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Ranked by:
          </span>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#1b1b23] border border-white/5 rounded-lg font-mono text-[11px] text-stone-200">
            <span className="material-symbols-outlined text-[15px] text-[#ccbdff]">
              priority_high
            </span>
            <span>Exam Impact & Memory Half-Life</span>
          </div>
        </div>
      </div>

      {/* Critical Urgency Matrix */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab] shadow-[0_0_10px_rgba(255,180,171,0.8)]"></div>
            <h2 className="font-sans text-base font-bold text-stone-100">
              Critical Urgency Matrix
            </h2>
            <span className="font-mono text-[10px] text-[#ffb4ab] bg-[#93000a]/20 px-2 py-0.5 rounded-full font-medium">
              Imminent Penalty
            </span>
          </div>
          <span className="font-sans text-xs text-[#cac4d4]">
            Requires 21 min total remediation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: NMDA */}
          <div className="group relative rounded-2xl bg-[#1b1b23] p-6 flex flex-col justify-between border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] text-[#ffb4ab] bg-[#ffb4ab]/10 px-2 py-0.5 rounded font-bold">
                  -8.5% Predicted
                </span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">
                    trending_down
                  </span>
                  <span className="text-[#ffb4ab] font-bold">71% Miss Rate</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-base font-bold text-stone-100 group-hover:text-[#ccbdff] transition-colors">
                  NMDA Mg²⁺ Voltage-Dependent Blockade
                </h3>
                <span className="font-sans text-[11px] text-[#cac4d4] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">
                    menu_book
                  </span>
                  Kandel Ch. 12 & Lecture 8
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0d0d15]/80 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[#cac4d4] font-mono text-[10px]">
                  <span className="material-symbols-outlined text-[14px] text-[#ccbdff]">
                    psychology
                  </span>
                  <span>Why you miss this:</span>
                </div>
                <p className="font-sans text-xs text-stone-300 leading-snug">
                  Confusing AMPA vs NMDA activation order during rapid LTP induction and extracellular depolarization thresholds.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReviewCard('NMDA Mg²⁺ Blockade')}
                className="flex-1 py-2 px-3 rounded-xl bg-[#9d85f2] text-[#331282] font-sans text-xs font-bold hover:bg-[#ccbdff] transition-all shadow-[0_2px_12px_rgba(157,133,242,0.3)] flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  play_circle
                </span>
                <span>Review Now</span>
              </button>
            </div>
          </div>

          {/* Card 2: Retrograde */}
          <div className="group relative rounded-2xl bg-[#1b1b23] p-6 flex flex-col justify-between border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] text-[#ffb4ab] bg-[#ffb4ab]/10 px-2 py-0.5 rounded font-bold">
                  -6.0% Predicted
                </span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">
                    trending_down
                  </span>
                  <span className="text-[#ffb4ab] font-bold">60% Miss Rate</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-base font-bold text-stone-100 group-hover:text-[#ccbdff] transition-colors">
                  Retrograde Endocannabinoid Signaling
                </h3>
                <span className="font-sans text-[11px] text-[#cac4d4] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">
                    menu_book
                  </span>
                  Squire Neuro Ch. 7 & Recitation 4
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0d0d15]/80 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[#cac4d4] font-mono text-[10px]">
                  <span className="material-symbols-outlined text-[14px] text-[#ccbdff]">
                    psychology
                  </span>
                  <span>Why you miss this:</span>
                </div>
                <p className="font-sans text-xs text-stone-300 leading-snug">
                  Mixing up post-synaptic 2-AG synthesis with pre-synaptic CB1 Gi-coupled receptor inhibition of neurotransmitter release.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReviewCard('Retrograde Endocannabinoid')}
                className="flex-1 py-2 px-3 rounded-xl bg-[#9d85f2] text-[#331282] font-sans text-xs font-bold hover:bg-[#ccbdff] transition-all shadow-[0_2px_12px_rgba(157,133,242,0.3)] flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  play_circle
                </span>
                <span>Review Now</span>
              </button>
            </div>
          </div>

          {/* Card 3: CaMKII */}
          <div className="group relative rounded-2xl bg-[#1b1b23] p-6 flex flex-col justify-between border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06),0_12px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] text-[#ffb4ab] bg-[#ffb4ab]/10 px-2 py-0.5 rounded font-bold">
                  -5.5% Predicted
                </span>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-[#ffb4ab]">
                    trending_down
                  </span>
                  <span className="text-[#ffb4ab] font-bold">67% Miss Rate</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-base font-bold text-stone-100 group-hover:text-[#ccbdff] transition-colors">
                  CaMKII Autophosphorylation (Thr286)
                </h3>
                <span className="font-sans text-[11px] text-[#cac4d4] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">
                    menu_book
                  </span>
                  Molecular Memory Module 3
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0d0d15]/80 border border-white/5 flex flex-col gap-1">
                <div className="flex items-center gap-1 text-[#cac4d4] font-mono text-[10px]">
                  <span className="material-symbols-outlined text-[14px] text-[#ccbdff]">
                    psychology
                  </span>
                  <span>Why you miss this:</span>
                </div>
                <p className="font-sans text-xs text-stone-300 leading-snug">
                  Overlooking molecular memory persistence: CaMKII remains autonomous even after Ca²⁺/Calmodulin disassociates.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReviewCard('CaMKII Autophosphorylation')}
                className="flex-1 py-2 px-3 rounded-xl bg-[#9d85f2] text-[#331282] font-sans text-xs font-bold hover:bg-[#ccbdff] transition-all shadow-[0_2px_12px_rgba(157,133,242,0.3)] flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  play_circle
                </span>
                <span>Review Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispersion Map & Diagnostic Pattern Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Dispersion Map */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#1b1b23] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ccbdff] text-[20px]">
                bubble_chart
              </span>
              <span className="font-sans text-sm font-bold text-stone-100">
                Cognitive Vulnerability Dispersion Map
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#cac4d4]">
              Complexity vs Frequency
            </span>
          </div>

          <div className="relative w-full h-44 rounded-xl bg-[#0d0d15] p-4 flex flex-col justify-between overflow-hidden border border-white/5">
            <div className="absolute top-2 right-3 font-mono text-[10px] text-[#ffb4ab] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
              Severe Grade Risk Region
            </div>

            <div className="relative w-full h-full">
              <div className="absolute top-3 right-12 flex items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-[#ffb4ab] text-[#690005] flex items-center justify-center font-mono text-xs font-bold shadow-[0_0_12px_rgba(255,180,171,0.7)]">
                  1
                </span>
                <span className="font-sans text-[10px] text-stone-200">
                  NMDA Blockade (-8.5%)
                </span>
              </div>

              <div className="absolute top-12 right-28 flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-[#ffb4ab] text-[#690005] flex items-center justify-center font-mono text-[10px] font-bold">
                  2
                </span>
                <span className="font-sans text-[10px] text-stone-200">
                  Retrograde (-6.0%)
                </span>
              </div>

              <div className="absolute top-20 right-44 flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-[#ffb4ab] text-[#690005] flex items-center justify-center font-mono text-[10px] font-bold">
                  3
                </span>
                <span className="font-sans text-[10px] text-stone-200">
                  CaMKII (-5.5%)
                </span>
              </div>

              <div className="absolute bottom-3 left-6 flex gap-2 items-center opacity-60">
                <span className="w-3 h-3 rounded-full bg-[#45dfa4]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#45dfa4]"></span>
                <span className="w-3 h-3 rounded-full bg-[#45dfa4]"></span>
                <span className="font-mono text-[10px] text-[#cac4d4]">
                  14 Secure Nodes
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[#938e9d] font-mono text-[10px] pt-1 border-t border-white/5">
              <span>← Low Concept Complexity</span>
              <span>High Cascade Complexity →</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Pattern & Trajectory */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#1b1b23] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#cabeff]">
            <span className="material-symbols-outlined text-[20px]">
              psychology_alt
            </span>
            <span className="font-sans text-sm font-bold text-stone-100">
              Synap Diagnostic Pattern
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#292932]/60 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
              <span className="font-mono text-[10px] text-[#45dfa4] uppercase font-bold">
                Cognitive Archetype Identified
              </span>
            </div>
            <p className="font-sans text-xs text-stone-300 leading-relaxed">
              You excel at <span className="text-[#68fcbf] font-semibold">structural neuroanatomy (98% accuracy)</span>, but drop points on <span className="text-[#ffb4ab] font-semibold">temporal biochemical sequences</span> and multi-step signaling cascades.
            </p>
          </div>

          {/* Mastery Trajectory Sparkline */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] uppercase text-[#cac4d4]">
                Mastery Trajectory If Resolved
              </span>
              <span className="font-mono text-xs text-[#45dfa4] font-bold">
                +13% Projection
              </span>
            </div>

            <div className="w-full h-28 bg-[#0d0d15] rounded-xl p-3 relative flex flex-col justify-end border border-white/5">
              <svg className="w-full h-16 overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 80">
                <defs>
                  <linearGradient id="gradTrajectory" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ccbdff"></stop>
                    <stop offset="100%" stopColor="#45dfa4"></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M 0 62 Q 80 58, 160 40 T 320 8"
                  fill="none"
                  stroke="url(#gradTrajectory)"
                  strokeWidth="3"
                ></path>
                <circle cx="0" cy="62" r="4" fill="#ccbdff"></circle>
                <circle cx="320" cy="8" r="5" fill="#45dfa4"></circle>
              </svg>

              <div className="flex justify-between items-center text-[#cac4d4] font-mono text-[10px] pt-1 border-t border-white/5">
                <span>Baseline (81%)</span>
                <span>Session 1 (+6%)</span>
                <span className="text-[#45dfa4] font-bold">Exam Day (94%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Resolved Concepts Archive */}
      <div className="p-6 rounded-2xl bg-[#1b1b23]/70 border border-white/5 flex flex-col gap-3">
        <div
          onClick={() => setShowResolvedArchive(!showResolvedArchive)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#45dfa4]"></div>
            <h3 className="font-sans text-sm font-bold text-stone-100">
              Recently Resolved Concepts (14)
            </h3>
            <span className="font-mono text-[10px] text-[#45dfa4] bg-[#45dfa4]/10 px-2 py-0.5 rounded-full font-medium">
              Safe Until Exam
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#cac4d4] font-sans text-xs">
            <span>{showResolvedArchive ? 'Hide Archive' : 'Show Archive'}</span>
            <span className="material-symbols-outlined text-[18px]">
              {showResolvedArchive ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </div>

        {showResolvedArchive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
            <div className="p-3 rounded-xl bg-[#0d0d15] flex items-center justify-between border border-white/5">
              <span className="font-sans text-xs text-stone-200 truncate">
                Sodium-Potassium ATPase Stoichiometry
              </span>
              <span className="font-mono text-xs text-[#45dfa4] font-bold">
                96%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d0d15] flex items-center justify-between border border-white/5">
              <span className="font-sans text-xs text-stone-200 truncate">
                Mossy Fiber Long-Term Potentiation
              </span>
              <span className="font-mono text-xs text-[#45dfa4] font-bold">
                92%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0d0d15] flex items-center justify-between border border-white/5">
              <span className="font-sans text-xs text-stone-200 truncate">
                GABA-A Allosteric Modulator Sites
              </span>
              <span className="font-mono text-xs text-[#45dfa4] font-bold">
                89%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
