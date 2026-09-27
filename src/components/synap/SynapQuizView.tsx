import React, { useState } from 'react';
import { SynapStudyItem } from '../../types/synap';

interface SynapQuizViewProps {
  studyItems: SynapStudyItem[];
  onAnswerQuestion: (isCorrect: boolean) => void;
  onExplainWithSynap: (prompt: string) => void;
  onGoToNotebook?: () => void;
}

export const SynapQuizView: React.FC<SynapQuizViewProps> = ({
  studyItems,
  onAnswerQuestion,
  onExplainWithSynap,
  onGoToNotebook,
}) => {
  const quizItems = studyItems.filter((i) => i.type === 'quiz');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{ isCorrect: boolean; topic: string }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  if (quizItems.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 rounded-2xl bg-[#14141e] border border-white/5 text-center flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-[#ccbdff]/10 text-[#ccbdff] border border-[#ccbdff]/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">quiz</span>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <span className="font-sans text-base font-bold text-stone-100">No Quiz Questions in Active Course</span>
          <p className="font-sans text-xs text-stone-400 leading-relaxed">
            Upload notes or lecture materials in your active course notebook to generate customized practice sets.
          </p>
        </div>
        {onGoToNotebook && (
          <button
            type="button"
            onClick={onGoToNotebook}
            className="px-4 py-2 bg-[#9d85f2] text-[#331282] rounded-xl font-sans text-xs font-bold hover:bg-white transition-all cursor-pointer shadow-md"
          >
            Open Active Notebook
          </button>
        )}
      </div>
    );
  }

  // Quiz Completion Screen
  if (isCompleted) {
    const totalAnswered = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const percentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const missedTopics = sessionResults.filter((r) => !r.isCorrect).map((r) => r.topic);

    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#1b1b23] rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
            percentage >= 70
              ? 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
              : 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
          }`}>
            <span className="material-symbols-outlined text-[36px]">
              {percentage >= 70 ? 'emoji_events' : 'psychology'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#ccbdff] font-bold">
              Diagnostic Complete
            </span>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-stone-100">
              {percentage >= 90
                ? 'Mastery Level: Exceptional!'
                : percentage >= 70
                ? 'Solid Grasp • Ready to Review'
                : 'Concept Gaps Identified'}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-stone-400 max-w-md mx-auto mt-1">
              Your responses have been recorded in the Synap Mastery index to guide exam readiness.
            </p>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2">
            <div className="p-4 rounded-2xl bg-[#14141e] border border-white/5 flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-stone-100">{percentage}%</span>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">Accuracy</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#14141e] border border-white/5 flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-[#45dfa4]">{correctCount}</span>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">Correct</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#14141e] border border-white/5 flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-[#ffb4ab]">{totalAnswered - correctCount}</span>
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">Missed</span>
            </div>
          </div>

          {missedTopics.length > 0 && (
            <div className="w-full max-w-md p-4 rounded-2xl bg-[#292932]/60 border border-white/5 text-left flex flex-col gap-2">
              <span className="font-mono text-[11px] text-[#ffb4ab] uppercase font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">flag</span>
                Topics for Targeted Review:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(missedTopics)).map((topic, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-black/40 text-stone-300 font-sans text-xs border border-white/5">
                    {topic || 'Core Concept'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(0);
                setSelectedOpt(null);
                setIsAnswered(false);
                setSessionResults([]);
                setIsCompleted(false);
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ccbdff] to-[#9d85f2] text-[#331282] font-sans text-xs font-bold hover:brightness-110 shadow-lg cursor-pointer transition-all"
            >
              Retake Diagnostic Quiz
            </button>
            {onGoToNotebook && (
              <button
                type="button"
                onClick={onGoToNotebook}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#292932] hover:bg-[#34343d] text-stone-200 font-sans text-xs font-semibold border border-white/5 cursor-pointer transition-all"
              >
                Back to Notebook
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const item = quizItems[currentStep];
  const isCorrect = selectedOpt === item?.correctIndex;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOpt(index);
    setIsAnswered(true);
    const correct = index === item.correctIndex;
    onAnswerQuestion(correct);
    setSessionResults((prev) => [
      ...prev,
      { isCorrect: correct, topic: item.topic || 'Concept Review' },
    ]);
  };

  const handleNext = () => {
    if (currentStep < quizItems.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Context & Dynamic Stepper Bar */}
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
                {item?.topic ? `${item.topic} Practice Quiz` : 'Course Diagnostic Quiz'}
              </h1>
              <span className="font-mono text-xs text-[#ccbdff] font-bold">
                Question {currentStep + 1} of {quizItems.length}
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
                check_circle
              </span>
              <span>Logged to Review History</span>
            </div>
          </div>
        </div>

        {/* Dynamic Stepper Indicator */}
        <div className="flex items-center gap-1.5 pt-2 overflow-x-auto">
          {quizItems.map((_, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={idx} className="flex items-center gap-1.5 flex-1 min-w-[28px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border font-mono text-xs ${
                    isCurrent
                      ? 'bg-[#9d85f2] text-[#331282] font-bold border-[#9d85f2] shadow-md'
                      : isCompleted
                      ? 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/30'
                      : 'bg-[#292932] text-[#cac4d4] border-white/5'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[15px]">check</span>
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < quizItems.length - 1 && (
                  <div
                    className={`h-1.5 w-full rounded-full ${
                      isCompleted ? 'bg-[#45dfa4]/40' : 'bg-[#34343d]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Center Question Card */}
      <section className="bg-[#1f1f27] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-xl flex flex-col gap-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292932] text-[#cabeff] text-xs font-semibold border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#cabeff]"></span>
            <span>{item.topic || 'Target Concept'}</span>
          </div>

          <span className="font-mono text-xs text-[#cac4d4]">
            Item #{currentStep + 1}
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
            const letters = ['A', 'B', 'C', 'D', 'E'];
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
                    letters[idx] || `${idx + 1}`
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
                      Selected &amp; Correct Response
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
                    : 'Missed — Let’s review the concept.'}
                </span>
                <span className="font-mono text-[10px] text-[#cac4d4]">
                  Synap Cognitive Feedback
                </span>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1f1f27] font-mono text-xs border border-white/5 ${isCorrect ? 'text-[#68fcbf]' : 'text-[#ffb4ab]'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {isCorrect ? 'check_circle' : 'flag'}
              </span>
              <span>{isCorrect ? 'Correct • Added to review history' : 'Incorrect • Flagged for review'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {item.explanation && (
              <p className="font-sans text-xs sm:text-sm text-stone-300 leading-relaxed">
                {item.explanation}
              </p>
            )}
            {item.reference && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-[#cabeff]">
                <span className="material-symbols-outlined text-[15px]">
                  menu_book
                </span>
                <span className="underline decoration-[#cabeff]/40">
                  {item.reference}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer Controls */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() =>
            onExplainWithSynap(
              `Explain this concept in depth: "${item.prompt}". Key takeaway: ${item.explanation || item.options?.[item.correctIndex ?? 0] || 'Clarify the core mechanism.'}`
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
            onClick={handleNext}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#ccbdff] hover:bg-white text-[#331282] font-sans text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <span>Next Question ({currentStep + 1} of {quizItems.length})</span>
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
