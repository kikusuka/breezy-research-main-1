import React, { useState } from 'react';
import { SynapNotebook } from '../../types/synap';
import { getSM2State, computePredictedRecall } from '../../services/scheduler';

interface SynapStudyPlanViewProps {
  notebooks?: SynapNotebook[];
  onStartFlashcards: () => void;
}

export const SynapStudyPlanView: React.FC<SynapStudyPlanViewProps> = ({
  notebooks = [],
  onStartFlashcards,
}) => {
  const [activeDayOffset, setActiveDayOffset] = useState<number>(0);

  const allStudyItems = notebooks.flatMap((n) =>
    n.studyItems.map((item) => ({
      ...item,
      examDate: n.examDate,
      notebookTitle: n.title,
      courseCode: n.courseCode,
    }))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Forecast items due on each of the upcoming 5 days per the scheduler due dates
  const days = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dStr = d.toISOString().split('T')[0];

    const dueCards = allStudyItems.filter((i) => {
      const state = getSM2State(i);
      if (offset === 0) {
        // Today includes everything due today or overdue
        return state.dueDate <= dStr;
      } else {
        // Other days show forecasted due items on that specific date
        return state.dueDate === dStr;
      }
    });

    return {
      offset,
      dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekdayStr: offset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dueCards,
    };
  });

  // 2. Compute forgotten metrics: cards with predicted recall < 70% on their respective exam dates
  let forgottenCount = 0;
  for (const item of allStudyItems) {
    if (item.examDate) {
      const recall = computePredictedRecall(item, item.examDate);
      // If reviewed but memory strength is low, it's highly susceptible to forgetting
      const state = getSM2State(item);
      const isReviewed = state.repetitions > 0 || state.interval > 0;
      if (isReviewed && recall < 0.70) {
        forgottenCount++;
      }
    }
  }

  const activeDay = days[activeDayOffset];
  const activeDayCards = activeDay.dueCards;

  // Unrealistic target alert (e.g. over 150 items due)
  const isUnrealistic = activeDayCards.length > 150;

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto animate-in fade-in duration-300 space-y-6 p-2">
      {/* Header & Readiness Projection Banner */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col max-w-2xl">
          <div className="flex items-center gap-1.5 text-purple-400 font-mono text-[10px] uppercase tracking-widest mb-1 font-extrabold">
            <span className="material-symbols-outlined text-[15px]">calendar_today</span>
            <span>Due Diligence Scheduler</span>
          </div>
          <h1 className="font-serif italic text-2xl sm:text-3xl text-stone-100 tracking-tight font-normal">
            Due &amp; Overdue Study Planner
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#cac4d4] mt-1">
            Track precise flashcard due queues computed using SuperMemo-2 mathematical intervals.
          </p>
        </div>

        {/* Dynamic Runway Card */}
        <div className="bg-[#1b1b23] border border-white/5 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#9d85f2]/15 text-[#ccbdff] flex items-center justify-center shrink-0 border border-[#9d85f2]/20">
              <span className="material-symbols-outlined text-[26px]">speed</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-sm font-bold text-stone-100">
                Active Study Plan ({allStudyItems.length} Total Cards)
              </span>
              <p className="font-sans text-xs text-[#cac4d4] leading-relaxed">
                Matches spaced repetitions dynamically against your performance records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="font-mono text-sm font-bold text-amber-400">{forgottenCount}</span>
              <span className="font-sans text-[10px] text-stone-400">Predicted Forgotten by Exam</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spaced Forecast & Forgotten Alert */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-stone-300 leading-relaxed flex items-center gap-3">
        <span className="material-symbols-outlined text-purple-400 text-lg">info</span>
        <span>
          <strong>{forgottenCount} cards</strong> are predicted to fall below 70% recall strength by your exam unless reviewed before then. Reviewing items when they are due guards your long-term memory stability!
        </span>
      </div>

      {/* Spacing Alert Warning for Unrealistic Load */}
      {isUnrealistic && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex flex-col gap-2">
          <span className="font-bold flex items-center gap-1 text-red-400">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Unrealistic Spaced Study Load Warning
          </span>
          <p className="leading-relaxed">
            Your targeted load for today exceeds <strong>150 cards</strong>. This is highly intense and can lead to study fatigue. We suggest adjusting your exam date further out to allow safer interval distribution, or reducing the number of study material sources.
          </p>
        </div>
      )}

      {/* 5-Day Calendar Strip */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ccbdff] text-[18px]">view_timeline</span>
            <h2 className="font-sans text-sm font-bold text-stone-100">Spaced Review Forecast</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {days.map((day) => {
            const isSelected = activeDayOffset === day.offset;
            const count = day.dueCards.length;
            
            return (
              <button
                key={day.offset}
                type="button"
                onClick={() => setActiveDayOffset(day.offset)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#292932] border-[#9d85f2] shadow-[0_0_16px_rgba(157,133,242,0.2)]'
                    : 'bg-[#1b1b23] border-white/5 hover:bg-[#22222b]'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] text-[#ccbdff] uppercase font-bold tracking-wider">
                    {day.weekdayStr}
                  </span>
                  <span className="font-sans text-xs font-bold text-stone-100">
                    {day.dateStr}
                  </span>
                </div>
                <span className={`font-mono text-[11px] font-semibold mt-3 ${count > 0 ? 'text-purple-400' : 'text-stone-500'}`}>
                  {count} {count === 1 ? 'card due' : 'cards due'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Day Detail Block */}
      {activeDayCards.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#14141e] border border-white/5 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">done_all</span>
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-sans text-base font-bold text-stone-100">All Caught Up!</h2>
            <p className="font-sans text-xs text-stone-400">
              Zero spaced review cards are due on this day. Outstanding work keeping your memory queue completely clear!
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#1b1b23] border border-white/5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans text-sm font-bold text-stone-100">
                Spaced Reviews for {activeDay.weekdayStr} ({activeDay.dateStr})
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {activeDayCards.length} card{activeDayCards.length === 1 ? ' is' : 's are'} due for practice based on your retention history.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartFlashcards}
              className="px-4.5 py-2.5 rounded-xl bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] font-sans text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#9d85f2]/10"
            >
              Start Practice Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {activeDayCards.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#14141e] border border-white/5 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-[#ccbdff] uppercase tracking-wider font-semibold">
                    {item.courseCode || 'Course'} · {item.notebookTitle}
                  </span>
                  {item.topic && (
                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-stone-400 font-medium">
                      {item.topic}
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs text-stone-200 leading-relaxed font-medium">
                  {item.prompt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
