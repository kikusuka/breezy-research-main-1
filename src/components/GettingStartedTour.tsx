import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Compass,
  MessageSquare,
  Activity,
  Columns,
} from 'lucide-react';

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  highlightText: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Synthexis',
    subtitle: 'Multi-Model Research & Analysis Platform',
    description:
      'Synthexis uses dynamic model personas (Analyst, Critic, Reviewer) to evaluate your proposals, test assumptions, and synthesize clear answers.',
    badge: 'Step 1 of 4 • Overview',
    icon: <Compass className="h-5 w-5 text-indigo-400" />,
    highlightText: 'Submit any technical design, architecture proposal, or strategic question.',
  },
  {
    title: 'The Analysis Console',
    subtitle: 'Grounding Sources & Model Protocols',
    description:
      'Enter your prompt in the input area. You can enable live search grounding, customize assigned models, or adjust analysis protocols.',
    badge: 'Step 2 of 4 • Console',
    icon: <MessageSquare className="h-5 w-5 text-sky-400" />,
    highlightText: 'Try sample questions or tune analysis mode (Consensus to Strict Red-Team).',
  },
  {
    title: 'Live Processing Status',
    subtitle: 'Model Output & Runtime Progress',
    description:
      'Track model progress in real time as each model analyzes the question and contributes its reasoning.',
    badge: 'Step 3 of 4 • Status',
    icon: <Activity className="h-5 w-5 text-emerald-400" />,
    highlightText: 'Watch turn-by-turn responses and cross-model reviews as they complete.',
  },
  {
    title: 'Analysis Trace & Exports',
    subtitle: 'Trace Replay, TL;DR & Transcripts',
    description:
      'Open the Analysis Trace to review individual model steps. Export complete transcripts to Markdown or print-ready PDF reports.',
    badge: 'Step 4 of 4 • Outputs',
    icon: <Columns className="h-5 w-5 text-amber-400" />,
    highlightText: 'Export full transcripts to Markdown, styled PDF reports, or JSON checkpoints.',
  },
];

interface GettingStartedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GettingStartedTour: React.FC<GettingStartedTourProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, onClose]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = () => {
    localStorage.setItem('synthexis_tour_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl text-left space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              {step.icon}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-semibold bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full">
              {step.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {step.title}
          </h3>
          <p className="text-xs font-mono text-indigo-400 font-medium">
            {step.subtitle}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {step.description}
          </p>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 text-xs text-indigo-200 flex items-start gap-2.5 font-mono">
            <Compass className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-normal">{step.highlightText}</p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={isLastStep ? handleFinish : () => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all"
            >
              <span>{isLastStep ? 'Get Started' : 'Next'}</span>
              {isLastStep ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
