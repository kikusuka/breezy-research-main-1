import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldAlert,
  Scale,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DebateStep, DebateTone } from '../types';
import { getToneAvatar } from '../data/agentAvatars';

interface DeliberationBlockProps {
  steps: DebateStep[];
  isDeliberating: boolean;
  activeRound?: number;
  tone?: DebateTone;
}

export const DeliberationBlock: React.FC<DeliberationBlockProps> = ({
  steps,
  isDeliberating,
  activeRound,
  tone = 'balanced',
}) => {
  const [expandedSteps, setExpandedSteps] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleStep = (stepKey: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepKey]: prev[stepKey] === undefined ? false : !prev[stepKey],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getRoleBadge = (role: string) => {
    const avatar = getToneAvatar(role, tone);
    switch (role.toLowerCase()) {
      case 'architect':
        return {
          icon: <Cpu className="h-4 w-4 text-sky-400" />,
          title: 'Analyst • Thesis',
          subtitle: 'Initial baseline analysis and solution foundation',
          borderColor: 'border-sky-950/50 hover:border-sky-800/60',
          bgHeader: 'bg-sky-950/20',
          accentColor: 'text-sky-200',
          avatar,
        };
      case 'skeptic':
        return {
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          title: 'Critic • Risk Review',
          subtitle: 'Critical assessment, risk review & edge case analysis',
          borderColor: 'border-rose-950/50 hover:border-rose-800/60',
          bgHeader: 'bg-rose-950/20',
          accentColor: 'text-rose-200',
          avatar,
        };
      case 'verifier':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
          title: 'Verifier • Logic Audit',
          subtitle: 'Empirical verification & constraint boundary testing',
          borderColor: 'border-emerald-950/50 hover:border-emerald-800/60',
          bgHeader: 'bg-emerald-950/20',
          accentColor: 'text-emerald-200',
          avatar,
        };
      case 'arbiter':
      default:
        return {
          icon: <Scale className="h-4 w-4 text-amber-400" />,
          title: 'Reviewer • Synthesis',
          subtitle: 'Final synthesized response and reconciled points',
          borderColor: 'border-amber-950/50 hover:border-amber-800/60',
          bgHeader: 'bg-amber-950/20',
          accentColor: 'text-amber-200',
          avatar,
        };
    }
  };

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const roleInfo = getRoleBadge(step.role);
        const stepKey = step.stepId || `step-${idx + 1}`;
        const isExpanded = expandedSteps[stepKey] ?? true;

        return (
          <div
            key={stepKey}
            className={`rounded-xl border border-slate-800 bg-slate-900/90 transition-all ${roleInfo.borderColor}`}
          >
            {/* Header */}
            <div
              onClick={() => toggleStep(stepKey)}
              className={`flex items-center justify-between p-4 cursor-pointer rounded-t-xl ${roleInfo.bgHeader} transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                  <img
                    src={roleInfo.avatar.avatarSrc}
                    alt={roleInfo.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-100">
                      {roleInfo.title}
                    </h4>
                    {step.status === 'running' && (
                      <span className="flex items-center gap-1 rounded bg-blue-950/80 border border-blue-800/50 px-2 py-0.5 text-[10px] font-mono text-blue-300">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Generating
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {roleInfo.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(step.content, stepKey);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Copy turn content"
                >
                  {copiedId === stepKey ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Content Body */}
            {isExpanded && (
              <div className="p-4 pt-3 border-t border-slate-800">
                <div className="prose prose-invert max-w-none font-sans text-xs leading-relaxed text-slate-200">
                  <ReactMarkdown>{step.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
