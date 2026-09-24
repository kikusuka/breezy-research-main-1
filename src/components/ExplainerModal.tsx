import React from 'react';
import { X, CheckCircle2, Sliders, ArrowRight, Activity } from 'lucide-react';

interface ExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainerModal: React.FC<ExplainerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">How Synthexis Works</h2>
            <p className="text-xs text-slate-400">
              Multi-Model Research, Risk Analysis & Synthesis
            </p>
          </div>
        </div>

        {/* Concept Description Box */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <h3 className="mb-1 text-xs font-semibold text-slate-200">Beyond Single-Prompt Responses</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            When evaluating complex technical tradeoffs, architecture designs, or policy decisions, a single model response often misses edge cases. <strong>Synthexis</strong> runs structured, multi-role analysis where specialized personas evaluate hypotheses, stress-test risks, and synthesize a single well-reasoned answer.
          </p>
        </div>

        {/* Core Capabilities */}
        <div className="mb-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Key Analysis Capabilities
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">Structured Roles</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-300">
                Compare responses from specialized perspectives: an Analyst for baseline structure, a Critic for vulnerability checks, and a Reviewer for final reconciliation.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-blue-400">
                <Sliders className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">Configurable Persona Deck</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-300">
                Customize model assignments, select search grounding engines, and adjust tone levels from standard consensus to strict red-team analysis.
              </p>
            </div>
          </div>
        </div>

        {/* How the Analysis Sequence Works */}
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Analysis Sequence
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/20 font-mono text-[11px] font-bold text-blue-400">
                1
              </div>
              <div>
                <span className="font-semibold text-slate-100">Analyst Baseline</span>
                <p className="mt-0.5 text-slate-300">
                  Formulates the initial solution proposal, technical blueprint, or strategy architecture.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-500/20 font-mono text-[11px] font-bold text-rose-400">
                2
              </div>
              <div>
                <span className="font-semibold text-slate-100">Critic Risk Review</span>
                <p className="mt-0.5 text-slate-300">
                  Reviews the baseline proposal for hidden assumptions, security vulnerabilities, and failure modes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 font-mono text-[11px] font-bold text-amber-400">
                3
              </div>
              <div>
                <span className="font-semibold text-slate-100">Reviewer Synthesis</span>
                <p className="mt-0.5 text-slate-300">
                  Reconciles conflicting points and outputs a balanced, actionable final synthesis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-500"
          >
            <span>Start Analysis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
