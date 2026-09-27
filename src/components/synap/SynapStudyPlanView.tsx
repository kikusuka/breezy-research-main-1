import React, { useState } from 'react';
import { SynapNotebook } from '../../types/synap';

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
    n.studyItems.map((item) => ({ ...item, notebookTitle: n.title, courseCode: n.courseCode }))
  );

  const today = new Date();
  const days = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return {
      offset,
      dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekdayStr: offset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto animate-in fade-in duration-300 space-y-6">
      {/* Header & Readiness Projection Banner */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-1.5 text-[#ccbdff] font-mono text-[10px] uppercase tracking-widest mb-1 font-semibold">
              <span className="material-symbols-outlined text-[16px]">
                orbit
              </span>
              <span>Adaptive Runway Engine</span>
            </div>
            <h1 className="font-serif italic text-2xl sm:text-3xl text-stone-100 tracking-tight font-normal">
              Exam Runway &amp; Adaptive Study Schedule
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#cac4d4] mt-1">
              Grounded in your active course notebooks and flashcard review history.
            </p>
          </div>
        </div>

        {/* Dynamic Runway Card */}
        <div className="bg-[#1b1b23] border border-white/5 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#9d85f2]/15 text-[#ccbdff] flex items-center justify-center shrink-0 border border-[#9d85f2]/20">
                <span className="material-symbols-outlined text-[26px]">
                  speed
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-base font-bold text-stone-100">
                    Active Study Schedule ({allStudyItems.length} Total Cards)
                  </span>
                </div>
                <p className="font-sans text-xs text-[#cac4d4] mt-0.5">
                  Distributes practice reviews across upcoming days based on flashcard retention history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Calendar Strip */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ccbdff] text-[18px]">
              view_timeline
            </span>
            <h2 className="font-sans text-sm font-bold text-stone-100">
              Upcoming 5-Day Schedule
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {days.map((day) => {
            const isSelected = activeDayOffset === day.offset;
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
                  <span className="font-mono text-[10px] text-[#ccbdff] uppercase font-bold">
                    {day.weekdayStr}
                  </span>
                  <span className="font-sans text-sm font-bold text-stone-100">
                    {day.dateStr}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#cac4d4] mt-3">
                  {allStudyItems.length === 0
                    ? '0 items'
                    : `${Math.ceil(allStudyItems.length / 5)} cards target`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Day Detail Block */}
      {allStudyItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#14141e] border border-white/5 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#9d85f2]/10 text-[#ccbdff] border border-[#9d85f2]/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">calendar_today</span>
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-sans text-base font-bold text-stone-100">No Study Items Scheduled Yet</h2>
            <p className="font-sans text-xs text-[#cac4d4]">
              Create a course notebook and upload lecture notes or PDFs to generate active study items.
            </p>
          </div>
        </div>
      ) : (() => {
        const itemsPerDay = Math.max(1, Math.ceil(allStudyItems.length / 5));
        const startIdx = activeDayOffset * itemsPerDay;
        const dayItems = allStudyItems.slice(startIdx, startIdx + itemsPerDay);
        const displayItems = dayItems.length > 0 ? dayItems : allStudyItems.slice(0, itemsPerDay);

        return (
          <div className="p-6 rounded-2xl bg-[#1b1b23] border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-sm font-bold text-stone-100">
                Scheduled Items for {days[activeDayOffset].weekdayStr} ({days[activeDayOffset].dateStr}) — {displayItems.length} Target Item{displayItems.length === 1 ? '' : 's'}
              </h3>
              <button
                type="button"
                onClick={onStartFlashcards}
                className="px-4 py-2 rounded-xl bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] font-sans text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Start Review Session
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#14141e] border border-white/5 flex flex-col gap-1"
                >
                  <span className="font-mono text-[10px] text-[#ccbdff]">
                    {item.courseCode || 'Course'} · {item.notebookTitle}
                  </span>
                  <span className="font-sans text-xs font-medium text-stone-200">
                    {item.prompt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
