import React, { useState } from 'react';
import { SynapStudyItem } from '../../types/synap';

interface SynapQuizViewProps {
  studyItems: SynapStudyItem[];
  onAnswerQuestion: (isCorrect: boolean) => void;
  onExplainWithSynap: (prompt: string) => void;
}

export const SynapQuizView: React.FC<SynapQuizViewProps> = ({
  studyItems,
  onAnswerQuestion,
  onExplainWithSynap,
}) => {
  const quizItems = studyItems.filter((i) => i.type === 'quiz');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(1); // default demo state on option B
  const [isAnswered, setIsAnswered] = useState<boolean>(true);

  const fallbackItem: SynapStudyItem = {
    id: 'quiz-default',
    type: 'quiz',
    topic: 'Receptor Electrophysiology',
    prompt:
      'A researcher applies APV (an NMDA receptor antagonist) to a hippocampal slice preparation before delivering a high-frequency tetanus stimulation (100 Hz). What is the expected physiological outcome on synaptic strength?',
    options: [
      'Baseline EPSP amplitudes will permanently double.',
      'Early and late-phase LTP induction will be blocked; synaptic transmission remains at baseline.',
      'Long-Term Depression (LTD) will immediately be triggered instead.',
      'Presynaptic glutamate release will be irreversibly inhibited.',
    ],
    correctIndex: 1,
    explanation:
      'APV selectively and competitively binds NMDA receptors, preventing Ca²⁺ influx even during robust 100 Hz tetanic depolarization. Because Ca²⁺ entry through NMDA is the essential trigger for CaMKII autophosphorylation, LTP induction is fully blocked. Baseline transmission via AMPA receptors remains unaffected.',
    reference: 'Referenced in Lecture 8 (Slide 19) & Kandel Ch. 12',
    history: [],
  };

  const item = quizItems[currentStep] || fallbackItem;
  const isCorrect = selectedOpt === item.correctIndex;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOpt(index);
    setIsAnswered(true);
    onAnswerQuestion(index === item.correctIndex);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setCurrentStep(0);
      setSelectedOpt(1);
      setIsAnswered(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Context & Stepper Bar */}
      <section className="bg-[#1b1b23] rounded-2xl p-6 border border-white/5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#cabeff] font-semibold">
                Diagnostic Flow
              </span>
              <span className="text-[#938e9d] text-xs">•</span>
              <span className="font-mono text-[11px] text-[#cac4d4]">
                Active Session
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="font-sans text-xl sm:text-2xl text-stone-100 tracking-tight font-bold">
                Neurobiology Diagnostic Quiz
              </h1>
              <span className="font-mono text-xs text-[#ccbdff] font-bold">
                Question {currentStep + 1} of 5
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34343d]/60 text-stone-200 text-xs border border-white/5">
              <span className="material-symbols-outlined text-[15px] text-[#cabeff]">
                timer_off
              </span>
              <span>Untimed Practice Mode</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ab78]/20 text-[#68fcbf] text-xs font-semibold border border-[#45dfa4]/20">
              <span className="material-symbols-outlined text-[15px]">
                trending_up
              </span>
              <span>+3.2% if answered correctly</span>
            </div>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 w-full">
            {/* Step 1 */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-[#45dfa4]/20 text-[#45dfa4] flex items-center justify-center shrink-0 border border-[#45dfa4]/30">
                <span className="material-symbols-outlined text-[16px]">
                  check
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#45dfa4]/40 rounded-full"></div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-[#45dfa4]/20 text-[#45dfa4] flex items-center justify-center shrink-0 border border-[#45dfa4]/30">
                <span className="material-symbols-outlined text-[16px]">
                  check
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#ccbdff]/50 rounded-full"></div>
            </div>

            {/* Step 3 (Active) */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-[#9d85f2] text-[#331282] font-mono text-xs font-bold shadow-md flex items-center justify-center shrink-0">
                03
              </div>
              <div className="h-1.5 w-full bg-[#34343d] rounded-full"></div>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-[#292932] text-[#cac4d4] font-mono text-xs flex items-center justify-center shrink-0">
                04
              </div>
              <div className="h-1.5 w-full bg-[#34343d] rounded-full"></div>
            </div>

            {/* Step 5 */}
            <div className="flex items-center shrink-0">
              <div className="w-7 h-7 rounded-full bg-[#292932] text-[#cac4d4] font-mono text-xs flex items-center justify-center">
                05
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Center Question Card */}
      <section className="bg-[#1f1f27] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-xl flex flex-col gap-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292932] text-[#cabeff] text-xs font-semibold border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#cabeff]"></span>
            <span>{item.topic || 'Receptor Electrophysiology'}</span>
            <span className="text-[#938e9d]">•</span>
            <span className="text-[#ccbdff]">High-Yield Final Topic</span>
          </div>

          <span className="font-mono text-xs text-[#cac4d4] flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#938e9d]">
              analytics
            </span>
            Historical Cohort Accuracy: 64%
          </span>
        </div>

        <div className="z-10">
          <p className="font-sans text-base sm:text-lg text-stone-100 leading-relaxed font-semibold">
            {item.prompt}
          </p>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-3 z-10">
          {item.options?.map((opt, idx) => {
            const letters = ['A', 'B', 'C', 'D'];
            const isSelected = selectedOpt === idx;
            const isTargetCorrect = idx === item.correctIndex;

            let containerStyle =
              'bg-[#1b1b23] hover:bg-[#292932] text-stone-200 border-white/5';
            if (isAnswered) {
              if (isTargetCorrect) {
                containerStyle =
                  'bg-[#292932] text-stone-100 border-[#45dfa4]/40 shadow-[0_0_16px_rgba(69,223,164,0.15)]';
              } else if (isSelected) {
                containerStyle =
                  'bg-[#292932] text-stone-100 border-[#ffb4ab]/40';
              }
            }

            return (
              <div
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${containerStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isAnswered && isTargetCorrect
                      ? 'bg-[#00ab78] text-[#003825]'
                      : isAnswered && isSelected
                      ? 'bg-[#ffb4ab] text-[#690005]'
                      : 'bg-[#34343d] text-[#cac4d4]'
                  }`}
                >
                  {isAnswered && isTargetCorrect ? (
                    <span className="material-symbols-outlined text-[16px]">
                      check
                    </span>
                  ) : (
                    letters[idx]
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <span className="font-sans text-xs sm:text-sm leading-relaxed">
                    {opt}
                  </span>
                  {isAnswered && isTargetCorrect && (
                    <span className="font-mono text-[11px] text-[#45dfa4] flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[13px]">
                        verified
                      </span>{' '}
                      Selected & Correct Response
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Immediate Feedback Drawer */}
      {isAnswered && (
        <section className="bg-[#1b1b23] rounded-2xl p-6 border border-white/5 shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isCorrect
                    ? 'bg-[#00ab78]/20 text-[#68fcbf]'
                    : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  psychology
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-sm font-bold text-stone-100">
                  {isCorrect
                    ? 'Correct! Outstanding recall.'
                    : 'Missed — Let’s review the mechanism.'}
                </span>
                <span className="font-mono text-[10px] text-[#cac4d4]">
                  Synap Cognitive Coach Rationale
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1f1f27] text-[#68fcbf] font-mono text-xs border border-white/5">
              <span className="material-symbols-outlined text-[14px] text-[#45dfa4]">
                bolt
              </span>
              <span>NMDA Receptors readiness: 55% → 68%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-2">
              <p className="font-sans text-xs sm:text-sm text-stone-300 leading-relaxed">
                {item.explanation}
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-[#cabeff]">
                <span className="material-symbols-outlined text-[15px]">
                  menu_book
                </span>
                <span className="underline decoration-[#cabeff]/40">
                  {item.reference}
                </span>
              </div>
            </div>

            {/* Sparkline Plot visual */}
            <div className="lg:col-span-4 bg-[#1f1f27] p-4 rounded-xl flex flex-col gap-1 border border-white/5">
              <div className="flex items-center justify-between text-[#cac4d4] font-mono text-[10px]">
                <span>EPSP AMPLITUDE RESPONSE</span>
                <span className="text-[#45dfa4]">Baseline maintained</span>
              </div>

              <div className="w-full h-16 flex items-center justify-center">
                <svg
                  className="w-full h-full text-[#938e9d]"
                  fill="none"
                  viewBox="0 0 240 60"
                >
                  <line
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeOpacity="0.2"
                    strokeWidth="1"
                    x1="0"
                    x2="240"
                    y1="40"
                    y2="40"
                  ></line>
                  <line
                    stroke="currentColor"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                    x1="100"
                    x2="100"
                    y1="5"
                    y2="55"
                  ></line>
                  <text fill="currentColor" fontSize="8" opacity="0.6" x="104" y="16">
                    100Hz + APV
                  </text>
                  <path
                    d="M0,40 L60,40 L70,36 L80,42 L95,40 L100,24 L104,40 L160,39 L180,41 L240,40"
                    stroke="#45dfa4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Controls */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() =>
            onExplainWithSynap(
              'Explain the APV NMDA receptor antagonist experiment in CA1 neurons.'
            )
          }
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f1f27] hover:bg-[#292932] text-stone-100 font-sans text-xs font-semibold border border-white/5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-[#cabeff]">
            neurology
          </span>
          <span>Explain with Synap</span>
        </button>

        <div className="w-full sm:w-auto flex items-center justify-end gap-3">
          <button
            type="button"
            className="text-[#cac4d4] hover:text-stone-100 font-sans text-xs px-3 py-2 transition-colors cursor-pointer"
          >
            Flag Question
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ccbdff] hover:bg-white text-[#331282] font-sans text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <span>Next Question ({currentStep + 1} of 5)</span>
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
