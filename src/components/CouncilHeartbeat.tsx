import React, { useEffect, useState } from 'react';
import { Activity, Loader2, CheckCircle2, Cpu, ShieldAlert, Scale } from 'lucide-react';
import { HeartbeatState, AgentRole, DebateStep } from '../types';

interface CouncilHeartbeatProps {
  heartbeat?: HeartbeatState;
  isDeliberating: boolean;
  activeRound: number;
  steps?: DebateStep[];
}

export const CouncilHeartbeat: React.FC<CouncilHeartbeatProps> = ({
  heartbeat,
  isDeliberating,
  activeRound,
  steps = [],
}) => {
  const [agentElapsedMs, setAgentElapsedMs] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isDeliberating) {
      const startTime = Date.now();
      timer = setInterval(() => {
        setAgentElapsedMs(Date.now() - startTime);
      }, 100);
    } else {
      setAgentElapsedMs(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDeliberating, heartbeat?.agentName]);

  const formattedTimer = `${(agentElapsedMs / 1000).toFixed(1)}s`;

  const runningStep = steps.find((s) => s.status === 'running');
  const completedSteps = steps.filter((s) => s.status === 'completed');

  const getAgentCleanName = (name?: string) => {
    if (!name) return 'Model';
    if (name.includes('Architect')) return 'Analyst';
    if (name.includes('Skeptic')) return 'Critic';
    if (name.includes('Arbiter')) return 'Reviewer';
    if (name.includes('Verifier')) return 'Verifier';
    return name;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
            {isDeliberating ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {isDeliberating
                  ? `Analyzing: ${getAgentCleanName(heartbeat?.agentName)}`
                  : 'Analysis Complete'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                Round {activeRound > 0 ? activeRound : Math.max(1, steps.length)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDeliberating
                ? `${getAgentCleanName(heartbeat?.agentName)} is reviewing context and formulating response...`
                : `${completedSteps.length} response turn${completedSteps.length === 1 ? '' : 's'} recorded`}
            </p>
          </div>
        </div>

        {/* Runtime Timer & Stats */}
        <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duration</span>
            <span className="text-slate-200 font-semibold">{formattedTimer}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Completed</span>
            <span className="text-slate-200 font-semibold">{completedSteps.length} turns</span>
          </div>
        </div>
      </div>
    </div>
  );
};
