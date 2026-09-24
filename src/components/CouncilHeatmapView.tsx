import React, { useState, useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  ShieldAlert,
  Info,
  BarChart2,
  Calendar,
  Grid,
  Filter,
} from 'lucide-react';
import { DebateSession, AgentRole } from '../types';
import { AGENT_AVATARS, getAgentAvatar } from '../data/agentAvatars';

interface CouncilHeatmapViewProps {
  sessions: DebateSession[];
  onSelectSession?: (sessionId: string) => void;
}

export const CouncilHeatmapView: React.FC<CouncilHeatmapViewProps> = ({
  sessions,
  onSelectSession,
}) => {
  const [metricFilter, setMetricFilter] = useState<'effectiveness' | 'consensus' | 'flaws'>('effectiveness');
  const [hoveredCell, setHoveredCell] = useState<{
    role?: AgentRole;
    sessionIdx?: number;
    sessionId?: string;
    score?: number;
    prompt?: string;
    details?: string;
  } | null>(null);

  // Filter valid completed sessions
  const validSessions = useMemo(() => {
    return (sessions || [])
      .filter((s) => s.steps && s.steps.length > 0)
      .slice(-12) // focus on last 12 sessions for clean grid rendering
      .reverse();
  }, [sessions]);

  // Roles in standard order
  const roles: AgentRole[] = ['architect', 'skeptic', 'synthesizer', 'arbiter', 'verifier', 'solo'];

  // Calculate agent effectiveness heat levels for each session
  // Score formula incorporates: text content depth, duration efficiency, flaw resolution, consensus rate
  const heatmapData = useMemo(() => {
    return validSessions.map((session, sessionIdx) => {
      const sessionConsensus = session.metrics?.consensusRate ?? (session.finalOutput ? 88 : 70);
      const sessionFlaws = session.metrics?.resolvedPointsCount ?? 3;
      
      const roleScores: Record<
        AgentRole,
        {
          effectiveness: number; // 0-100
          contentLength: number;
          durationSec: number;
          status: string;
          model: string;
          summary: string;
        }
      > = {
        architect: { effectiveness: 0, contentLength: 0, durationSec: 0, status: 'none', model: '', summary: '' },
        skeptic: { effectiveness: 0, contentLength: 0, durationSec: 0, status: 'none', model: '', summary: '' },
        synthesizer: { effectiveness: 0, contentLength: 0, durationSec: 0, status: 'none', model: '', summary: '' },
        arbiter: { effectiveness: 0, contentLength: 0, durationSec: 0, status: 'none', model: '', summary: '' },
        verifier: { effectiveness: 0, contentLength: 0, durationSec: 0, status: 'none', model: '', summary: '' },
        solo: { effectiveness: 0, contentLength: 0, durationSec: 0, status: 'none', model: '', summary: '' },
      };

      session.steps.forEach((step) => {
        const role = step.role;
        if (!roleScores[role]) return;

        const contentLength = step.content?.length || 0;
        const durationSec = (step.durationMs || 3000) / 1000;
        
        // Compute heuristic effectiveness rating (0 - 100%)
        let score = 50;
        if (role === 'architect') {
          score = Math.min(98, 60 + Math.floor(contentLength / 60) + (sessionConsensus > 85 ? 15 : 5));
        } else if (role === 'skeptic') {
          score = Math.min(98, 55 + sessionFlaws * 8 + (contentLength > 500 ? 15 : 5));
        } else if (role === 'synthesizer') {
          score = Math.min(97, 65 + Math.floor(contentLength / 50));
        } else if (role === 'arbiter') {
          score = Math.min(100, 65 + Math.floor(sessionConsensus * 0.3) + (session.finalOutput ? 10 : 0));
        } else if (role === 'verifier') {
          score = Math.min(96, 70 + (session.protocol === 'quad' ? 20 : 5));
        }

        roleScores[role] = {
          effectiveness: Math.round(score),
          contentLength,
          durationSec: Number(durationSec.toFixed(1)),
          status: step.status,
          model: step.model || 'gemini-3.8-flash',
          summary: step.critiqueSummary || (contentLength > 0 ? `${contentLength} chars synthesized` : 'Pending'),
        };
      });

      return {
        session,
        sessionIdx,
        consensusRate: sessionConsensus,
        resolvedFlaws: sessionFlaws,
        roleScores,
      };
    });
  }, [validSessions]);

  // Overall heatmap summary statistics
  const summaryStats = useMemo(() => {
    if (heatmapData.length === 0) {
      return {
        avgConsensus: 85,
        avgEffectiveness: 88,
        topRole: 'The Arbiter',
        totalFlawsResolved: 12,
      };
    }

    let consensusSum = 0;
    let flawSum = 0;
    const roleEffectivenessSum: Record<AgentRole, { sum: number; count: number }> = {
      architect: { sum: 0, count: 0 },
      skeptic: { sum: 0, count: 0 },
      synthesizer: { sum: 0, count: 0 },
      arbiter: { sum: 0, count: 0 },
      verifier: { sum: 0, count: 0 },
      solo: { sum: 0, count: 0 },
    };

    heatmapData.forEach((item) => {
      consensusSum += item.consensusRate;
      flawSum += item.resolvedFlaws;
      roles.forEach((r) => {
        const score = item.roleScores[r].effectiveness;
        if (score > 0) {
          roleEffectivenessSum[r].sum += score;
          roleEffectivenessSum[r].count += 1;
        }
      });
    });

    const avgConsensus = Math.round(consensusSum / heatmapData.length);
    let bestRole: AgentRole = 'arbiter';
    let highestRoleAvg = 0;
    let overallEffectivenessSum = 0;
    let overallEffectivenessCount = 0;

    roles.forEach((r) => {
      const avg = roleEffectivenessSum[r].count > 0 ? roleEffectivenessSum[r].sum / roleEffectivenessSum[r].count : 0;
      if (avg > highestRoleAvg) {
        highestRoleAvg = avg;
        bestRole = r;
      }
      overallEffectivenessSum += roleEffectivenessSum[r].sum;
      overallEffectivenessCount += roleEffectivenessSum[r].count;
    });

    const avgEffectiveness = overallEffectivenessCount > 0 ? Math.round(overallEffectivenessSum / overallEffectivenessCount) : 85;

    return {
      avgConsensus,
      avgEffectiveness,
      topRole: getAgentAvatar(bestRole).name,
      totalFlawsResolved: flawSum,
    };
  }, [heatmapData]);

  // Color mapper for effectiveness cell values (0 - 100%)
  const getCellColorClass = (val: number) => {
    if (val === 0) return 'bg-[#141724] border-[#1e2334] text-slate-600';
    if (val < 50) return 'bg-indigo-950/40 border-indigo-900/40 text-indigo-300';
    if (val < 70) return 'bg-cyan-950/60 border-cyan-800/50 text-cyan-300';
    if (val < 85) return 'bg-teal-900/60 border-teal-600/50 text-teal-200';
    return 'bg-emerald-600/30 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
  };

  // Color mapper for consensus success rate cell values
  const getConsensusColorClass = (val: number) => {
    if (val < 60) return 'bg-rose-950/60 border-rose-800/50 text-rose-300';
    if (val < 80) return 'bg-amber-950/60 border-amber-800/50 text-amber-300';
    if (val < 90) return 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300';
    return 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.3)]';
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f17] overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b202e] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Flame className="h-4 w-4" />
            </div>
            <h2 className="font-serif text-[17px] font-semibold text-white tracking-[-0.012em]">
              Agent Contribution Heatmap & Consensus Velocity
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Matrix visualization of agent dialectic impact, flaw mitigation efficiency, and consensus rate trends across sessions.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-[#222838] bg-[#131622] p-1 text-xs">
          <button
            type="button"
            onClick={() => setMetricFilter('effectiveness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              metricFilter === 'effectiveness'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Agent Effectiveness</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricFilter('consensus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              metricFilter === 'consensus'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Consensus Success</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#22283a] bg-[#121522] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Avg Consensus Rate</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {summaryStats.avgConsensus}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across active dialectic sessions</p>
        </div>

        <div className="rounded-xl border border-[#22283a] bg-[#121522] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Avg Agent Effectiveness</span>
            <Flame className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {summaryStats.avgEffectiveness}%
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Synthesis quality index</p>
        </div>

        <div className="rounded-xl border border-[#22283a] bg-[#121522] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Top Performing Seat</span>
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-sm font-semibold text-sky-200 truncate mt-1">
            {summaryStats.topRole}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Highest average contribution score</p>
        </div>

        <div className="rounded-xl border border-[#22283a] bg-[#121522] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Flaws Resolved</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300 mt-1">
            {summaryStats.totalFlawsResolved}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Fatal flaws neutralized in debate</p>
        </div>
      </div>

      {/* Main Heatmap Grid Matrix */}
      {heatmapData.length === 0 ? (
        <div className="rounded-xl border border-[#202536] bg-[#10131e] p-12 text-center">
          <BarChart2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-slate-300">No Heatmap Data Recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Convene the council and execute dialectic deliberations to populate the agent contribution heatmap.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#202536] bg-[#10131e] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              {metricFilter === 'effectiveness'
                ? 'Matrix: Agent Seat vs Deliberation Session'
                : 'Matrix: Session Timeline vs Consensus Success Rate'}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-indigo-950 border border-indigo-800" /> Low (0-50%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-teal-900 border border-teal-600" /> Moderate (50-80%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500/30 border border-emerald-400" /> High (80-100%)
              </span>
            </div>
          </div>

          {/* Heatmap Grid Layout */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[640px] space-y-2">
              {/* Session Column Headers */}
              <div className="grid grid-cols-13 gap-2 items-center text-[10.5px] font-mono text-slate-400 border-b border-[#1b202e] pb-2">
                <div className="col-span-3 font-semibold text-slate-300">Agent Seat</div>
                {heatmapData.map((item, idx) => (
                  <div
                    key={item.session.id}
                    onClick={() => onSelectSession?.(item.session.id)}
                    className="col-span-1 text-center truncate cursor-pointer hover:text-sky-300 transition-colors"
                    title={item.session.prompt}
                  >
                    S-{idx + 1}
                  </div>
                ))}
              </div>

              {/* Heatmap Rows per Role */}
              {roles.map((role) => {
                const avatar = getAgentAvatar(role);

                return (
                  <div key={role} className="grid grid-cols-13 gap-2 items-center py-1.5">
                    {/* Role Row Header */}
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="relative h-6 w-6 overflow-hidden rounded border border-slate-700 bg-slate-900 shrink-0">
                        <img
                          src={avatar.avatarSrc}
                          alt={avatar.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-200">{avatar.name}</div>
                        <div className="text-[9.5px] font-mono text-slate-500 truncate">{avatar.title}</div>
                      </div>
                    </div>

                    {/* Heatmap Cells for each Session */}
                    {heatmapData.map((item, idx) => {
                      const scoreObj = item.roleScores[role];
                      const val = metricFilter === 'effectiveness' ? scoreObj.effectiveness : item.consensusRate;
                      const cellClass = metricFilter === 'effectiveness' ? getCellColorClass(val) : getConsensusColorClass(val);

                      return (
                        <div
                          key={`${role}-${item.session.id}`}
                          onMouseEnter={() =>
                            setHoveredCell({
                              role,
                              sessionIdx: idx + 1,
                              sessionId: item.session.id,
                              score: val,
                              prompt: item.session.prompt,
                              details: `Content: ${scoreObj.contentLength} chars | Latency: ${scoreObj.durationSec}s | Flaws: ${item.resolvedFlaws}`,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => onSelectSession?.(item.session.id)}
                          className={`col-span-1 h-10 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 ${cellClass}`}
                        >
                          <span className="text-[11px] font-bold font-mono">{val > 0 ? `${val}%` : '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Cell Hover Inspector Card */}
          {hoveredCell && (
            <div className="rounded-lg border border-sky-800/40 bg-[#0f1422] p-3 text-xs space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-200">
                  Session #{hoveredCell.sessionIdx}: {getAgentAvatar(hoveredCell.role!).name}
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  Score: {hoveredCell.score}%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Inquiry: "{hoveredCell.prompt}"
              </p>
              <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-sky-950/60">
                {hoveredCell.details}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
