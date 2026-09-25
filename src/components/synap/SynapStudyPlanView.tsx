import React, { useState } from 'react';

interface SynapStudyPlanViewProps {
  onStartFlashcards: () => void;
}

export const SynapStudyPlanView: React.FC<SynapStudyPlanViewProps> = ({
  onStartFlashcards,
}) => {
  const [activeDay, setActiveDay] = useState<'may14' | 'may15' | 'may16' | 'may17' | 'may18'>('may14');
  const [circadianChecked, setCircadianChecked] = useState(true);
  const [audioBufferChecked, setAudioBufferChecked] = useState(true);

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
            <h1 className="font-sans text-2xl sm:text-3xl text-stone-100 tracking-tight font-bold">
              Elena's Exam Runway & Adaptive Study Schedule
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#cac4d4] mt-1">
              Synced with{' '}
              <span className="text-[#cabeff] font-medium">
                Cognitive Neuroscience Final
              </span>{' '}
              in 4 days (May 18) and{' '}
              <span className="text-stone-100 font-medium">
                Distributed Systems
              </span>{' '}
              in 10 days (May 24).
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-stone-100 text-xs font-semibold transition-all border border-white/5 cursor-pointer shadow-[inset_0_1px_1px_rgba(232,235,255,0.06)]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#ccbdff]">
                tune
              </span>
              <span>Recalibrate</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-[#cac4d4] hover:text-stone-100 text-xs font-semibold transition-all border border-white/5 cursor-pointer shadow-[inset_0_1px_1px_rgba(232,235,255,0.06)]"
            >
              <span className="material-symbols-outlined text-[16px]">
                calendar_month
              </span>
              <span>Export (iCal/Google)</span>
            </button>
          </div>
        </div>

        {/* Primary Readiness Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1b1b23] p-6 border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#9d85f2]/15 text-[#ccbdff] flex items-center justify-center shrink-0 border border-[#9d85f2]/20">
                <span className="material-symbols-outlined text-[26px]">
                  speed
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-base font-bold text-stone-100">
                    Projected 94% Exam Readiness
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#00ab78]/30 text-[#45dfa4] font-mono text-[10px] font-bold">
                    +16% lift
                  </span>
                </div>
                <p className="font-sans text-xs text-[#cac4d4] mt-0.5">
                  Maintained if 4 daily target micro-sessions (avg 28 mins) are completed prior to Sunday 2:00 PM.
                </p>
              </div>
            </div>

            <div className="flex flex-col min-w-[240px] md:w-72">
              <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                <span className="text-[#cac4d4]">Runway Pace</span>
                <span className="text-[#ccbdff] font-bold">
                  Day 1 of 4 • On Schedule
                </span>
              </div>
              <div className="h-2 w-full bg-[#0d0d15] rounded-full overflow-hidden p-0.5 border border-white/5">
                <div className="h-full bg-gradient-to-r from-[#cabeff] to-[#45dfa4] rounded-full w-[78%] transition-all duration-700"></div>
              </div>
              <span className="font-mono text-[10px] text-[#938e9d] mt-1 text-right">
                Target 94% threshold
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Runway Strip */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ccbdff] text-[18px]">
              view_timeline
            </span>
            <h2 className="font-sans text-sm font-bold text-stone-100">
              Weekly Runway Strip
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-ping"></span>
            <span className="font-mono text-[10px] text-[#cac4d4]">
              Cognitive Engine Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 overflow-x-auto pb-1">
          {/* Day 1: Today */}
          <div
            onClick={() => setActiveDay('may14')}
            className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
              activeDay === 'may14'
                ? 'bg-[#292932] border-[#9D85F2]/40 shadow-[0_0_24px_-2px_rgba(157,133,242,0.35)]'
                : 'bg-[#1b1b23] border-white/5 hover:bg-[#1f1f27]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#ccbdff] font-bold uppercase tracking-wider">
                Today
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ccbdff]"></span>
            </div>
            <span className="font-sans text-sm font-bold text-stone-100">
              May 14
            </span>
            <span className="font-mono text-[11px] text-[#e6deff] mt-0.5">
              35m Scheduled
            </span>
            <div className="mt-2.5 pt-2 bg-[#0d0d15]/60 rounded-lg p-2 flex flex-col">
              <span className="font-sans text-xs text-[#ccbdff] font-semibold truncate">
                Triage: Weak Spots
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">
                3 micro-blocks
              </span>
            </div>
          </div>

          {/* Day 2: May 15 */}
          <div
            onClick={() => setActiveDay('may15')}
            className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
              activeDay === 'may15'
                ? 'bg-[#292932] border-[#9D85F2]/40 shadow-[0_0_24px_-2px_rgba(157,133,242,0.35)]'
                : 'bg-[#1b1b23] border-white/5 hover:bg-[#1f1f27]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#cac4d4]">
                Tomorrow
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">86%</span>
            </div>
            <span className="font-sans text-sm font-bold text-stone-100">
              May 15
            </span>
            <span className="font-mono text-[11px] text-[#cac4d4] mt-0.5">
              27m Scheduled
            </span>
            <div className="mt-2.5 pt-2 bg-[#0d0d15]/40 rounded-lg p-2 flex flex-col">
              <span className="font-sans text-xs text-[#cac4d4] truncate">
                Decay Check & GHK
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">
                2 micro-blocks
              </span>
            </div>
          </div>

          {/* Day 3: May 16 */}
          <div
            onClick={() => setActiveDay('may16')}
            className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
              activeDay === 'may16'
                ? 'bg-[#292932] border-[#9D85F2]/40 shadow-[0_0_24px_-2px_rgba(157,133,242,0.35)]'
                : 'bg-[#1b1b23] border-white/5 hover:bg-[#1f1f27]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#cac4d4]">Friday</span>
              <span className="font-mono text-[10px] text-[#938e9d]">91%</span>
            </div>
            <span className="font-sans text-sm font-bold text-stone-100">
              May 16
            </span>
            <span className="font-mono text-[11px] text-[#cac4d4] mt-0.5">
              45m Scheduled
            </span>
            <div className="mt-2.5 pt-2 bg-[#0d0d15]/40 rounded-lg p-2 flex flex-col">
              <span className="font-sans text-xs text-[#cac4d4] truncate">
                Synthesis Mock Exam
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">
                25-Q Sim
              </span>
            </div>
          </div>

          {/* Day 4: May 17 */}
          <div
            onClick={() => setActiveDay('may17')}
            className={`flex flex-col p-4 rounded-2xl border transition-all cursor-pointer ${
              activeDay === 'may17'
                ? 'bg-[#292932] border-[#9D85F2]/40 shadow-[0_0_24px_-2px_rgba(157,133,242,0.35)]'
                : 'bg-[#1b1b23] border-white/5 hover:bg-[#1f1f27]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#cac4d4]">
                Saturday
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">95%</span>
            </div>
            <span className="font-sans text-sm font-bold text-stone-100">
              May 17
            </span>
            <span className="font-mono text-[11px] text-[#cac4d4] mt-0.5">
              20m Scheduled
            </span>
            <div className="mt-2.5 pt-2 bg-[#0d0d15]/40 rounded-lg p-2 flex flex-col">
              <span className="font-sans text-xs text-[#45dfa4] truncate">
                Serenity & Lock-in
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">
                Mastered only
              </span>
            </div>
          </div>

          {/* Day 5: Exam Day */}
          <div
            onClick={() => setActiveDay('may18')}
            className="flex flex-col p-4 rounded-2xl bg-[#9d85f2]/20 border border-[#ccbdff]/30 shadow-[0_4px_20px_rgba(157,133,242,0.2)] cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#ccbdff] font-bold uppercase tracking-wider">
                🎯 Exam
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#ccbdff]">
                flag
              </span>
            </div>
            <span className="font-sans text-sm font-bold text-[#ccbdff]">
              May 18
            </span>
            <span className="font-mono text-[11px] text-stone-200 font-semibold mt-0.5">
              2:00 PM Final
            </span>
            <div className="mt-2.5 pt-2 bg-[#0d0d15]/70 rounded-lg p-2 flex flex-col">
              <span className="font-sans text-xs text-[#e6deff] font-semibold truncate">
                Neurobiology
              </span>
              <span className="font-mono text-[10px] text-[#938e9d]">
                Hall B • Bring ID
              </span>
            </div>
          </div>

          {/* Day 6 & 7 */}
          <div className="flex flex-col p-4 rounded-2xl bg-[#0d0d15] opacity-75 border border-white/5">
            <span className="font-mono text-[10px] text-[#cac4d4]">Monday</span>
            <span className="font-sans text-sm text-stone-200">May 19</span>
            <span className="font-mono text-[10px] text-[#938e9d] mt-1">
              Recovery Day
            </span>
          </div>

          <div className="flex flex-col p-4 rounded-2xl bg-[#0d0d15] opacity-75 border border-white/5">
            <span className="font-mono text-[10px] text-[#cac4d4]">Tuesday</span>
            <span className="font-sans text-sm text-stone-200">May 20</span>
            <span className="font-mono text-[10px] text-[#e6deff] mt-1">
              Raft Prep
            </span>
          </div>
        </div>
      </section>

      {/* Itinerary & Insights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Daily Itinerary (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-2xl bg-[#1f1f27] p-6 border border-white/5 shadow-[0_4px_20px_-2px_rgba(10,10,15,0.7)] flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ccbdff] to-[#9d85f2]"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-base font-bold text-stone-100">
                    Today — Wednesday, May 14
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ccbdff]/20 text-[#ccbdff] font-mono text-[10px] font-bold uppercase">
                    Active
                  </span>
                </div>
                <span className="font-sans text-xs text-[#cac4d4]">
                  35 mins total study runway • Day 1 of Focused Triage
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1b1b23] text-[#45dfa4] font-mono text-xs border border-white/5">
                <span className="material-symbols-outlined text-[15px]">
                  check_circle
                </span>
                <span>1 / 3 Completed</span>
              </div>
            </div>

            {/* Task Items */}
            <div className="flex flex-col gap-2.5">
              {/* Task 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1b1b23] border border-white/5 opacity-80">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md bg-[#45dfa4]/20 text-[#45dfa4] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      done
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs line-through text-[#938e9d]">
                      Review Lecture 8: NMDA voltage blockade notes
                    </span>
                    <span className="font-mono text-[10px] text-[#938e9d]">
                      10 mins • Concept verified with high retention
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#34343d] text-[#45dfa4] font-mono text-[10px]">
                  Completed
                </span>
              </div>

              {/* Task 2: Actionable Flashcards */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#292932] border border-[#ccbdff]/30 shadow-[0_4px_16px_rgba(124,92,252,0.15)]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-[#9d85f2] text-[#331282] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      play_arrow
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-bold text-stone-100">
                        Triage Flashcards: CaMKII & Retrograde signaling
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#93000a]/40 text-[#ffb4ab] font-mono text-[10px] font-semibold">
                        Weak Spot
                      </span>
                    </div>
                    <span className="font-sans text-xs text-[#cac4d4]">
                      28 dynamic cards • Target 90% accuracy before unlock
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onStartFlashcards}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#ccbdff] text-[#331282] font-sans text-xs font-bold shadow-[0_2px_12px_rgba(157,133,242,0.4)] hover:brightness-110 transition-all shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    style
                  </span>
                  <span>Start Flashcards (15m)</span>
                </button>
              </div>

              {/* Task 3 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#1b1b23] border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md bg-[#34343d] text-[#cac4d4] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[15px]">
                      schedule
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs text-stone-200">
                      5-question diagnostic mock quiz on Hippocampal LTP
                    </span>
                    <span className="font-mono text-[10px] text-[#cac4d4]">
                      Scheduled for tonight @ 8:00 PM • 10 mins
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1f1f27] text-[#cac4d4] font-mono text-[10px]">
                  Queued
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Insights Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Retention Half-Life Forecast */}
          <div className="rounded-2xl bg-[#1f1f27] p-5 border border-white/5 shadow-[0_4px_20px_-2px_rgba(10,10,15,0.7)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#ccbdff] font-mono text-[10px] uppercase tracking-wider font-semibold">
                <span className="material-symbols-outlined text-[15px]">
                  insights
                </span>
                <span>Memory Dynamics</span>
              </div>
              <span className="font-mono text-[10px] text-[#45dfa4] font-bold">
                Decay Protected
              </span>
            </div>

            <h3 className="font-sans text-sm font-bold text-stone-100">
              Retention Half-Life Forecast
            </h3>

            {/* Retention Curve SVG */}
            <div className="w-full bg-[#0d0d15] p-3 rounded-xl flex flex-col border border-white/5">
              <div className="flex items-center justify-between font-mono text-[10px] text-[#938e9d] mb-1">
                <span>Recall %</span>
                <span className="text-[#45dfa4]">With Adaptive Runway</span>
              </div>
              <svg className="w-full h-20 overflow-visible" fill="none" viewBox="0 0 280 90">
                <line
                  stroke="#34343d"
                  strokeDasharray="3 3"
                  x1="0"
                  x2="280"
                  y1="20"
                  y2="20"
                ></line>
                <path
                  d="M 10 20 Q 70 85 270 88"
                  fill="none"
                  stroke="#ffb4ab"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                ></path>
                <path
                  d="M 10 20 Q 50 35 70 42 L 72 22 Q 120 32 140 38 L 142 18 Q 200 25 270 20"
                  fill="none"
                  stroke="#45dfa4"
                  strokeWidth="2.5"
                ></path>
                <circle cx="72" cy="22" r="3.5" fill="#ccbdff"></circle>
                <circle cx="142" cy="18" r="3.5" fill="#ccbdff"></circle>
                <circle cx="270" cy="20" r="4.5" fill="#45dfa4"></circle>
              </svg>
              <div className="flex justify-between items-center font-mono text-[10px] text-[#cac4d4] mt-1 pt-1 border-t border-white/5">
                <span>Day 1</span>
                <span>Day 2</span>
                <span className="text-[#45dfa4] font-bold">Exam Day (94%)</span>
              </div>
            </div>
          </div>

          {/* Time Investment vs Grade ROI */}
          <div className="rounded-2xl bg-[#1f1f27] p-5 border border-white/5 flex flex-col gap-3">
            <h3 className="font-sans text-sm font-bold text-stone-100">
              Time Investment vs. Grade ROI
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#1b1b23] border border-white/5 flex flex-col">
                <span className="font-mono text-[10px] text-[#938e9d]">
                  Runway Time
                </span>
                <span className="font-mono text-base font-bold text-stone-100 mt-0.5">
                  1.8 hrs
                </span>
                <span className="font-mono text-[10px] text-[#e6deff]">
                  Across 4 days
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#1b1b23] border border-white/5 flex flex-col">
                <span className="font-mono text-[10px] text-[#938e9d]">
                  Projected Score
                </span>
                <span className="font-mono text-base font-bold text-[#45dfa4] mt-0.5">
                  A (3.8+)
                </span>
                <span className="font-mono text-[10px] text-[#938e9d]">
                  High confidence
                </span>
              </div>
            </div>
          </div>

          {/* Late-Night Ergonomics */}
          <div className="rounded-2xl bg-[#1f1f27] p-5 border border-white/5 flex flex-col gap-3">
            <span className="font-mono text-[10px] text-[#ccbdff] uppercase tracking-wider font-bold">
              Late-Night Ergonomics
            </span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between p-2 rounded-xl bg-[#1b1b23] hover:bg-[#292932] border border-white/5 transition-colors cursor-pointer">
                <span className="font-sans text-xs text-stone-200">
                  Circadian Dimming
                </span>
                <input
                  type="checkbox"
                  checked={circadianChecked}
                  onChange={(e) => setCircadianChecked(e.target.checked)}
                  className="accent-[#ccbdff] cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded-xl bg-[#1b1b23] hover:bg-[#292932] border border-white/5 transition-colors cursor-pointer">
                <span className="font-sans text-xs text-stone-200">
                  Anxiety Buffer Audio (40Hz)
                </span>
                <input
                  type="checkbox"
                  checked={audioBufferChecked}
                  onChange={(e) => setAudioBufferChecked(e.target.checked)}
                  className="accent-[#ccbdff] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
