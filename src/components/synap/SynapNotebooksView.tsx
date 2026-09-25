import React from 'react';
import { SynapNotebook } from '../../types/synap';

interface SynapNotebooksViewProps {
  notebooks: SynapNotebook[];
  onSelectNotebook: (nbId: string) => void;
  onNewNotebook: () => void;
  onInspectWeakSpots: () => void;
  onResumeReview: () => void;
  onStartQuiz: () => void;
}

export const SynapNotebooksView: React.FC<SynapNotebooksViewProps> = ({
  notebooks,
  onSelectNotebook,
  onNewNotebook,
  onInspectWeakSpots,
  onResumeReview,
  onStartQuiz,
}) => {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Background Ambient Glows */}
      <div className="relative">
        <div className="absolute -top-16 -left-20 w-96 h-96 rounded-full bg-[#9d85f2]/10 blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-[#00ab78]/10 blur-3xl pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#292932]/80 text-[#e6deff] text-xs font-semibold shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-pulse"></span>
              <span>Adaptive Memory Engine · Active Session</span>
            </div>
            <h1 className="font-sans text-3xl sm:text-4xl text-stone-100 tracking-tight font-bold">
              Good afternoon, Elena.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#cac4d4] max-w-2xl leading-relaxed">
              Your{' '}
              <span className="text-[#e6deff] font-semibold">
                Cognitive Neuroscience
              </span>{' '}
              final is in 4 days. You’re at{' '}
              <span className="text-[#45dfa4] font-bold tracking-tight">81%</span>{' '}
              predicted mastery across core neural pathways.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNewNotebook}
              className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#9d85f2] to-[#4918c8] text-white font-sans text-xs font-semibold shadow-[0_4px_20px_-2px_rgba(157,133,242,0.35)] hover:shadow-[0_8px_28px_rgba(157,133,242,0.5)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-90">
                add
              </span>
              <span>New Notebook</span>
            </button>

            <button
              type="button"
              onClick={onResumeReview}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-stone-100 font-sans text-xs font-semibold border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#cabeff] text-[18px]">
                play_circle
              </span>
              <span>Resume Review</span>
              <span className="text-[10px] text-[#cac4d4] px-1.5 py-0.5 rounded bg-[#1b1b23]">
                Action Potentials
              </span>
            </button>

            <button
              type="button"
              onClick={onStartQuiz}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1b1b23] hover:bg-[#1f1f27] text-[#cac4d4] hover:text-stone-100 font-sans text-xs font-semibold border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.04)] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>5-Min Quiz</span>
            </button>
          </div>
        </section>

        {/* Notebook Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {notebooks.map((nb) => {
            const isBio = nb.courseCode.includes('Bio');
            const isCS = nb.courseCode.includes('CS');
            const isMath = nb.courseCode.includes('Math');
            const isPhil = nb.courseCode.includes('Phil');

            const strokeColor = isBio
              ? '#ccbdff'
              : isCS
              ? '#FBBF24'
              : isMath
              ? '#45dfa4'
              : '#cabeff';

            const dashOffset = 188.5 - (188.5 * nb.readiness) / 100;

            return (
              <article
                key={nb.id}
                onClick={() => onSelectNotebook(nb.id)}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-[#1b1b23] border border-white/5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(232,235,255,0.08)] hover:bg-[#1f1f27] transition-all duration-300 group overflow-hidden cursor-pointer"
              >
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#ccbdff] uppercase tracking-wider">
                          Course · {nb.courseCode}
                        </span>
                        <span className="text-[#938e9d] text-xs">•</span>
                        <span className="text-[11px] font-mono text-[#cabeff]">
                          {nb.track}
                        </span>
                      </div>
                      <h2 className="font-sans text-lg text-stone-100 font-semibold group-hover:text-[#ccbdff] transition-colors">
                        {nb.title}
                      </h2>
                    </div>

                    {/* Circular Readiness Meter */}
                    <div className="relative shrink-0 flex items-center justify-center w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 72 72">
                        <circle
                          className="text-[#34343d]"
                          cx="36"
                          cy="36"
                          fill="none"
                          r="30"
                          stroke="currentColor"
                          strokeWidth="4.5"
                        />
                        <circle
                          className="transition-all duration-1000 ease-out"
                          cx="36"
                          cy="36"
                          fill="none"
                          r="30"
                          stroke={strokeColor}
                          strokeDasharray="188.5"
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          strokeWidth="4.5"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="font-mono text-sm text-stone-100 font-bold leading-none">
                          {nb.readiness}%
                        </span>
                        <span className="font-mono text-[8px] text-[#cac4d4] uppercase tracking-tighter mt-0.5">
                          Readiness
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vulnerability Banner */}
                  <div className="p-3.5 rounded-xl bg-[#0d0d15]/80 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#cac4d4] flex items-center gap-1.5 font-medium">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isBio || isCS ? 'bg-[#ffb4ab] animate-ping' : 'bg-[#45dfa4]'
                          }`}
                        ></span>
                        {isBio
                          ? 'Key Retention Vulnerability'
                          : isCS
                          ? 'Action Required'
                          : 'Peak Mastery'}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          isBio
                            ? 'text-[#ffb4ab]'
                            : isCS
                            ? 'text-[#e6deff]'
                            : 'text-[#45dfa4]'
                        }`}
                      >
                        {isBio
                          ? '2 Gaps Flagged'
                          : isCS
                          ? 'High Urgency'
                          : 'Optimal'}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-stone-300 leading-normal">
                      {isBio
                        ? 'High retention overall, but retrograde endocannabinoid feedback & LTP induction protocols require immediate recalibration.'
                        : isCS
                        ? 'Needs attention before next mock test. Primary confusion centers on Raft quorum split-brain mitigation and causality in vector clocks.'
                        : isMath
                        ? 'Solid retention across planar graphs and Euler tours. Scheduled for light maintenance flashcards in 5 days to sustain synapse weighting.'
                        : 'Stable comprehension on Spinoza and Locke. Kant’s transcendental deduction requires one deep-dive active retrieval session.'}
                    </p>
                  </div>

                  {/* Quick Numbers Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-[#1f1f27]/60 flex flex-col">
                      <span className="font-mono text-sm font-bold text-stone-100">
                        {nb.masteredCount}
                      </span>
                      <span className="font-sans text-[11px] text-[#cac4d4]">
                        Mastered
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#1f1f27]/60 flex flex-col">
                      <span
                        className={`font-mono text-sm font-bold ${
                          nb.weakCount > 5 ? 'text-[#ffb4ab]' : 'text-[#45dfa4]'
                        }`}
                      >
                        {nb.weakCount}
                      </span>
                      <span className="font-sans text-[11px] text-[#cac4d4]">
                        Weak Spots
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#1f1f27]/60 flex flex-col">
                      <span className="font-mono text-sm font-bold text-stone-100">
                        {nb.sourceCount}
                      </span>
                      <span className="font-sans text-[11px] text-[#cac4d4]">
                        Source Texts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#cabeff]">
                      event
                    </span>
                    <span className="font-mono text-xs text-stone-200">
                      {nb.examDate}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#4918c8]/40 text-[#e6deff] font-semibold">
                      {nb.daysLeft} days left
                    </span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#ccbdff] group-hover:text-white transition-colors"
                  >
                    <span>Enter Synthesis</span>
                    <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Recent Study Pulse Banner */}
        <section className="p-6 rounded-2xl bg-[#1b1b23] border border-white/5 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6),inset_0_1px_1px_0_rgba(232,235,255,0.08)] relative overflow-hidden mt-6">
          <div className="absolute left-1/2 -top-24 -translate-x-1/2 w-3/4 h-32 bg-[#9d85f2]/10 blur-3xl pointer-events-none"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#45dfa4] text-[18px]">
                  insights
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#cac4d4]">
                  Recent Study Pulse
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-stone-100">
                  +6%
                </span>
                <span className="font-sans text-sm text-[#45dfa4] font-medium">
                  Readiness Velocity this week
                </span>
              </div>
              <p className="font-sans text-xs text-[#cac4d4] leading-relaxed">
                Yesterday’s late-night flashcard run across{' '}
                <span className="text-stone-100 font-medium">
                  Synaptic Transmission
                </span>{' '}
                promoted 18 probationary concepts to persistent long-term recall storage.
              </p>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-[#cac4d4]">
                  <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
                  <span>18 Promoted</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#cac4d4]">
                  <span className="w-2 h-2 rounded-full bg-[#cabeff]"></span>
                  <span>42 Maintained</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#cac4d4]">
                  <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                  <span>5 Re-queued</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <div className="p-3.5 rounded-xl bg-[#0d0d15]/80 border border-white/5 shadow-[inset_0_1px_1px_rgba(232,235,255,0.03)] flex items-center gap-4">
                <div className="w-16 h-10 flex items-end gap-1 px-1">
                  <div className="w-2 bg-[#34343d] rounded-t h-4"></div>
                  <div className="w-2 bg-[#cabeff]/50 rounded-t h-6"></div>
                  <div className="w-2 bg-[#cabeff]/70 rounded-t h-5"></div>
                  <div className="w-2 bg-[#ccbdff] rounded-t h-8"></div>
                  <div className="w-2 bg-[#45dfa4] rounded-t h-10"></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-[#cac4d4]">
                    Daily Streak
                  </span>
                  <span className="font-mono text-base font-bold text-stone-100">
                    14 Days
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onInspectWeakSpots}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-stone-100 font-sans text-xs font-semibold border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Inspect Weak Spots</span>
                <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">
                  crisis_alert
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
