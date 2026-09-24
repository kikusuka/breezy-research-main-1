import React, { useState, useEffect } from 'react';
import { Activity, Cpu, CheckCircle2, Loader2 } from 'lucide-react';
import { HeartbeatState, AgentRole } from '../types';

export interface HeartbeatIndicatorProps {
  heartbeat?: HeartbeatState;
  isDeliberating?: boolean;
  onClick?: () => void;
  className?: string;
}

export const HeartbeatIndicator: React.FC<HeartbeatIndicatorProps> = ({
  heartbeat,
  isDeliberating = false,
  onClick,
  className = '',
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (isDeliberating) {
      const startTime = Date.now();
      timer = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDeliberating, heartbeat?.agentName]);

  const formattedElapsed = `${(elapsedMs / 1000).toFixed(1)}s`;

  const getStatusText = () => {
    if (!isDeliberating) return 'Ready · 3 Models';
    if (heartbeat?.agentName) {
      const roleMap: Record<string, string> = {
        'The Architect': 'Analyst',
        'The Skeptic': 'Critic',
        'The Arbiter': 'Reviewer',
        'The Verifier': 'Verifier',
      };
      const cleanName = roleMap[heartbeat.agentName] || heartbeat.agentName;
      return `${cleanName} active`;
    }
    return 'Analyzing...';
  };

  return (
    <button
      type="button"
      id="header-heartbeat-indicator"
      onClick={onClick}
      title={
        isDeliberating
          ? `Analysis active (${formattedElapsed}): ${heartbeat?.agentName || 'Model'} processing`
          : 'Multi-model workspace ready. Click to switch to Analysis view.'
      }
      className={`group relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
        isDeliberating
          ? 'border-blue-500/40 bg-blue-950/20 text-blue-200'
          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
      } ${className}`}
    >
      <div className="relative flex h-3.5 w-3.5 items-center justify-center">
        {isDeliberating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
        )}
      </div>

      <span className="font-medium text-slate-200 text-xs">
        {getStatusText()}
      </span>

      {isDeliberating && (
        <span className="font-mono text-[11px] text-blue-300 font-semibold border-l border-slate-700/80 pl-2">
          {formattedElapsed}
        </span>
      )}
    </button>
  );
};
