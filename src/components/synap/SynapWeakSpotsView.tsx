import React, { useState } from 'react';
import { SynapNotebook } from '../../types/synap';
import { computePredictedRecall, getSM2State } from '../../services/scheduler';

interface SynapWeakSpotsViewProps {
  notebooks?: SynapNotebook[];
  onStartTriage: () => void;
  onReviewCard: (concept: string) => void;
}

export const SynapWeakSpotsView: React.FC<SynapWeakSpotsViewProps> = ({
  notebooks = [],
  onStartTriage,
  onReviewCard,
}) => {
  const [filter, setFilter] = useState<'all' | 'resolved'>('all');

  const allStudyItems = notebooks.flatMap((n) =>
    n.studyItems.map((item) => ({ ...item, examDate: n.examDate, notebookTitle: n.title, courseCode: n.courseCode }))
  );

  // Derive weak and mastered items from predicted recall on exam date & lapses
  const weakItems = allStudyItems.filter((i) => {
    const state = getSM2State(i);
    const recall = i.examDate ? computePredictedRecall(i, i.examDate) : 0.5;
    const isReviewed = state.repetitions > 0 || state.interval > 0;
    // Weak: reviewed AND (lapses > 1 OR predicted recall < 60%)
    return isReviewed && (state.lapses > 1 || recall < 0.60);
  });

  const resolvedItems = allStudyItems.filter((i) => {
    const state = getSM2State(i);
    const recall = i.examDate ? computePredictedRecall(i, i.examDate) : 0.5;
    const isReviewed = state.repetitions > 0 || state.interval > 0;
    // Mastered / Resolved: predicted recall >= 75%
    return isReviewed && recall >= 0.75;
  });

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto animate-in fade-in duration-300 space-y-8">
      {/* Diagnostic Hero Section */}
      <section className="relative bg-[#1b1b23] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06),0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9d85f2]/20 text-[#ccbdff] border border-[#9d85f2]/30 font-mono text-[10px] tracking-wide uppercase font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccbdff]"></span>
                Concept Health Diagnostics
              </span>
            </div>

            <h1 className="font-serif italic text-2xl sm:text-3xl text-stone-100 tracking-tight font-normal">
              Exam Vulnerability Analysis
            </h1>

            <p className="font-sans text-xs sm:text-sm text-[#cac4d4] leading-relaxed">
              Calculates concepts with missed practice attempts across active course notebooks. Reviewing flagged items builds long-term recall stability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={onStartTriage}
              className="group relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] font-sans text-xs font-bold shadow-[0_4px_24px_rgba(157,133,242,0.35)] transition-all duration-200 cursor-pointer"
            >
              <span>Practice Flashcards</span>
              <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>
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
            All Flagged Gaps ({weakItems.length})
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
            Mastered ({resolvedItems.length})
          </button>
        </div>
      </div>

      {/* Items Grid or Empty State */}
      {filter === 'all' && weakItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#14141e] border border-white/5 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-sans text-base font-bold text-stone-100">0 Vulnerabilities Flagged</h2>
            <p className="font-sans text-xs text-[#cac4d4]">
              No weak spots detected across your active course notebooks. Complete flashcard practice sessions or diagnostic quizzes to identify areas for targeted practice.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartTriage}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] font-sans text-xs font-bold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">style</span>
            <span>Start Practice Review</span>
          </button>
        </div>
      ) : filter === 'resolved' && resolvedItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#14141e] border border-white/5 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ccbdff]/10 text-[#ccbdff] border border-[#ccbdff]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-sans text-base font-bold text-stone-100">0 Items Mastered Yet</h2>
            <p className="font-sans text-xs text-[#cac4d4]">
              Answer flashcard prompts correctly to build mastered concept memory.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filter === 'all' ? weakItems : resolvedItems).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#1b1b23] p-6 flex flex-col justify-between border border-[#ffb4ab]/20 shadow-md gap-4"
            >
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-[#ffb4ab] bg-[#ffb4ab]/10 px-2 py-0.5 rounded font-bold self-start">
                  {item.courseCode || 'Course'} · {item.notebookTitle}
                </span>
                <h3 className="font-sans text-sm font-bold text-stone-100">
                  {item.prompt}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onReviewCard(item.prompt)}
                className="w-full py-2 rounded-xl bg-[#292932] hover:bg-[#34343d] text-[#ccbdff] font-sans text-xs font-semibold cursor-pointer border border-white/5 transition-colors"
              >
                Review Item
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
