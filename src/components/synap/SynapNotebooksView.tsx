import React from 'react';
import { SynapNotebook } from '../../types/synap';

interface SynapNotebooksViewProps {
  notebooks: SynapNotebook[];
  onSelectNotebook: (nbId: string) => void;
  onNewNotebook: () => void;
  onInspectWeakSpots: () => void;
  onResumeReview: () => void;
  onStartQuiz: () => void;
  onClearWorkspace?: () => void;
}

export const SynapNotebooksView: React.FC<SynapNotebooksViewProps> = ({
  notebooks,
  onSelectNotebook,
  onNewNotebook,
  onInspectWeakSpots,
  onResumeReview,
  onStartQuiz,
  onClearWorkspace,
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
            <h1 className="font-serif italic text-3xl sm:text-4xl text-stone-100 tracking-tight font-normal">
              Synap Repository
            </h1>
            <p className="font-mono text-xs text-[#ccbdff] uppercase tracking-wide">
              {notebooks.length === 0
                ? '0 active notebooks · create your first course repository'
                : `${notebooks.length} notebook${notebooks.length > 1 ? 's' : ''} loaded · ${notebooks.reduce((acc, n) => acc + n.sources.length, 0)} sources indexed`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNewNotebook}
              className="group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] font-sans text-xs font-bold shadow-[0_4px_20px_-2px_rgba(157,133,242,0.4)] transition-all duration-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-90">
                add
              </span>
              <span>New Notebook</span>
            </button>

            {onClearWorkspace && (
              <button
                type="button"
                onClick={onClearWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-[#ffb4ab] font-sans text-xs font-semibold border border-white/5 hover:border-[#ffb4ab]/30 transition-all cursor-pointer"
                title="Clear all stored notebooks and reset to fresh empty state"
              >
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>Reset Workspace</span>
              </button>
            )}

            {notebooks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onResumeReview}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-stone-100 font-sans text-xs font-semibold border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#ccbdff] text-[18px]">
                    play_circle
                  </span>
                  <span>Resume Review</span>
                </button>

                <button
                  type="button"
                  onClick={onStartQuiz}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1b1b23] hover:bg-[#1f1f27] text-[#cac4d4] hover:text-stone-100 font-sans text-xs font-semibold border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.04)] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  <span>Practice Quiz</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Empty State when zero notebooks exist */}
        {notebooks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#14141e] border border-white/5 text-center flex flex-col items-center justify-center gap-4 mt-8">
            <div className="w-12 h-12 rounded-full bg-[#9d85f2]/10 text-[#ccbdff] border border-[#9d85f2]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">folder_open</span>
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <span className="font-sans text-base font-bold text-stone-100">No Course Notebooks Yet</span>
              <p className="font-sans text-xs text-stone-400 leading-relaxed">
                Organize lecture notes, PDF docs, and generate interactive flashcards grounded directly in your course materials.
              </p>
            </div>
            <button
              type="button"
              onClick={onNewNotebook}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] font-sans text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create First Notebook</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {notebooks.map((nb) => {
            const realTotalItems = nb.studyItems.length;
            const realMasteredCount = nb.studyItems.filter(
              (i) => i.history && i.history.some((h) => h.correct)
            ).length;
            const realWeakCount = nb.studyItems.filter(
              (i) => i.history && i.history.some((h) => !h.correct)
            ).length;
            const realSourceCount = nb.sources.length;
            const computedReadiness =
              realTotalItems > 0
                ? Math.round((realMasteredCount / realTotalItems) * 100)
                : 0;

            const strokeColor =
              computedReadiness >= 75
                ? '#45dfa4'
                : computedReadiness >= 40
                ? '#ccbdff'
                : '#ffb4ab';

            const dashOffset = 188.5 - (188.5 * computedReadiness) / 100;

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
                          Course · {nb.courseCode || 'General'}
                        </span>
                        <span className="text-[#938e9d] text-xs">•</span>
                        <span className="text-[11px] font-mono text-[#cabeff]">
                          {nb.track || 'Course Repository'}
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
                          {computedReadiness}%
                        </span>
                        <span className="font-mono text-[8px] text-[#cac4d4] uppercase tracking-tighter mt-0.5">
                          Readiness
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="p-3.5 rounded-xl bg-[#0d0d15]/80 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#cac4d4] flex items-center gap-1.5 font-medium">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            realWeakCount > 0
                              ? 'bg-[#ffb4ab]'
                              : realTotalItems > 0
                              ? 'bg-[#45dfa4]'
                              : 'bg-stone-500'
                          }`}
                        ></span>
                        {realTotalItems === 0
                          ? 'Awaiting Materials'
                          : realWeakCount > 0
                          ? 'Review Recommended'
                          : 'Optimal Retention'}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          realWeakCount > 0
                            ? 'text-[#ffb4ab]'
                            : realTotalItems > 0
                            ? 'text-[#45dfa4]'
                            : 'text-stone-400'
                        }`}
                      >
                        {realTotalItems === 0
                          ? '0 Cards'
                          : realWeakCount > 0
                          ? `${realWeakCount} Gaps Flagged`
                          : 'Optimal'}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-stone-300 leading-normal">
                      {realSourceCount === 0
                        ? 'No documents uploaded to this course notebook. Add PDFs, slides, or notes to index concepts and generate interactive flashcards.'
                        : realTotalItems === 0
                        ? `${realSourceCount} document source(s) indexed. Open notebook to generate practice flashcards and diagnostic quizzes.`
                        : `${realTotalItems} active study items generated across ${realSourceCount} document source(s). ${realMasteredCount} mastered, ${realWeakCount} flagged for review.`}
                    </p>
                  </div>

                  {/* Quick Numbers Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-[#1f1f27]/60 flex flex-col">
                      <span className="font-mono text-sm font-bold text-stone-100">
                        {realMasteredCount}
                      </span>
                      <span className="font-sans text-[11px] text-[#cac4d4]">
                        Mastered
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#1f1f27]/60 flex flex-col">
                      <span
                        className={`font-mono text-sm font-bold ${
                          realWeakCount > 0 ? 'text-[#ffb4ab]' : 'text-[#45dfa4]'
                        }`}
                      >
                        {realWeakCount}
                      </span>
                      <span className="font-sans text-[11px] text-[#cac4d4]">
                        Weak Spots
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#1f1f27]/60 flex flex-col">
                      <span className="font-mono text-sm font-bold text-stone-100">
                        {realSourceCount}
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
                  Repository Overview
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-stone-100">
                  {notebooks.reduce((acc, n) => acc + n.studyItems.length, 0)}
                </span>
                <span className="font-sans text-sm text-[#45dfa4] font-medium">
                  Total Active Flashcards &amp; Quizzes
                </span>
              </div>
              <p className="font-sans text-xs text-[#cac4d4] leading-relaxed">
                Indexed across {notebooks.length} active notebook{notebooks.length > 1 ? 's' : ''} containing {notebooks.reduce((acc, n) => acc + n.sources.length, 0)} uploaded study document{notebooks.reduce((acc, n) => acc + n.sources.length, 0) !== 1 ? 's' : ''}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
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
        )}
      </div>
    </div>
  );
};
