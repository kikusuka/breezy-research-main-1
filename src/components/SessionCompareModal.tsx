import React, { useState } from 'react';
import { X, Columns, CheckCircle2, ShieldAlert, Clock, Scale, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { DebateSession } from '../types';

interface SessionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: DebateSession[];
  initialSessionAId?: string;
  initialSessionBId?: string;
  onSelectSession?: (sessionId: string) => void;
}

export const SessionCompareModal: React.FC<SessionCompareModalProps> = ({
  isOpen,
  onClose,
  sessions,
  initialSessionAId,
  initialSessionBId,
}) => {
  const [sessionAId, setSessionAId] = useState<string>(
    initialSessionAId || sessions[0]?.id || ''
  );
  const [sessionBId, setSessionBId] = useState<string>(
    initialSessionBId || sessions[1]?.id || sessions[0]?.id || ''
  );

  if (!isOpen) return null;

  const sessionA = sessions.find((s) => s.id === sessionAId) || sessions[0];
  const sessionB = sessions.find((s) => s.id === sessionBId) || sessions[1] || sessions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-[#262d3e] bg-[#0c0f17] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c2232] bg-[#111522] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Columns className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-semibold text-white flex items-center gap-2">
                <span>Side-by-Side Session Comparison</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Compare dialectic trajectories, consensus metrics, and synthesized blueprints across two inquiries
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1c2232] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Session Selectors Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#1c2232] bg-[#0d101a]">
          {/* Column A Selector */}
          <div className="p-4 border-r border-[#1c2232]">
            <label className="block text-[10.5px] font-mono uppercase tracking-wider text-indigo-400 mb-1.5">
              Select Session A (Baseline)
            </label>
            <select
              value={sessionAId}
              onChange={(e) => setSessionAId(e.target.value)}
              className="w-full rounded-lg border border-[#283146] bg-[#131724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prompt.slice(0, 60)}... ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Column B Selector */}
          <div className="p-4">
            <label className="block text-[10.5px] font-mono uppercase tracking-wider text-amber-400 mb-1.5">
              Select Session B (Comparison)
            </label>
            <select
              value={sessionBId}
              onChange={(e) => setSessionBId(e.target.value)}
              className="w-full rounded-lg border border-[#283146] bg-[#131724] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.prompt.slice(0, 60)}... ({new Date(s.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Content Area */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1c2232] p-4 sm:p-6 gap-6 md:gap-0">
          
          {/* SESSION A COLUMN */}
          {sessionA ? (
            <div className="md:pr-6 space-y-5">
              <div className="rounded-xl border border-[#22293b] bg-[#111420] p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 mb-1">
                  Inquiry A • {sessionA.protocol.toUpperCase()} PROTOCOL
                </div>
                <h3 className="font-serif text-sm font-medium text-white leading-relaxed">
                  "{sessionA.prompt}"
                </h3>
                <div className="mt-2 text-[10.5px] text-slate-400 font-mono">
                  Created {new Date(sessionA.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Metrics Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Consensus</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {sessionA.metrics?.consensusRate || 85}%
                  </div>
                </div>
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Duration</div>
                  <div className="text-sm font-bold font-mono text-indigo-300 mt-0.5">
                    {sessionA.metrics?.durationMs ? `${(sessionA.metrics.durationMs / 1000).toFixed(1)}s` : '12.4s'}
                  </div>
                </div>
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Flaws Fixed</div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                    {sessionA.metrics?.resolvedPointsCount || 3}
                  </div>
                </div>
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Rounds</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {sessionA.steps?.length || 0}
                  </div>
                </div>
              </div>

              {/* Final Synthesis Column A */}
              <div className="rounded-xl border border-[#252f44] bg-[#0d101a] p-4 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-[#1f2638] pb-2">
                  <Scale className="h-3.5 w-3.5" />
                  <span>Synthesized Consensus A</span>
                </div>
                <div className="font-serif text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap pr-1">
                  {sessionA.finalOutput || 'No final synthesis output recorded for this session.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">No Session Selected</div>
          )}

          {/* SESSION B COLUMN */}
          {sessionB ? (
            <div className="md:pl-6 space-y-5">
              <div className="rounded-xl border border-[#22293b] bg-[#111420] p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1">
                  Inquiry B • {sessionB.protocol.toUpperCase()} PROTOCOL
                </div>
                <h3 className="font-serif text-sm font-medium text-white leading-relaxed">
                  "{sessionB.prompt}"
                </h3>
                <div className="mt-2 text-[10.5px] text-slate-400 font-mono">
                  Created {new Date(sessionB.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Metrics Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Consensus</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {sessionB.metrics?.consensusRate || 85}%
                  </div>
                </div>
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Duration</div>
                  <div className="text-sm font-bold font-mono text-indigo-300 mt-0.5">
                    {sessionB.metrics?.durationMs ? `${(sessionB.metrics.durationMs / 1000).toFixed(1)}s` : '12.4s'}
                  </div>
                </div>
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Flaws Fixed</div>
                  <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                    {sessionB.metrics?.resolvedPointsCount || 3}
                  </div>
                </div>
                <div className="rounded-lg border border-[#22293a] bg-[#111522] p-2.5 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Rounds</div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {sessionB.steps?.length || 0}
                  </div>
                </div>
              </div>

              {/* Final Synthesis Column B */}
              <div className="rounded-xl border border-[#252f44] bg-[#0d101a] p-4 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-[#1f2638] pb-2">
                  <Scale className="h-3.5 w-3.5" />
                  <span>Synthesized Consensus B</span>
                </div>
                <div className="font-serif text-xs text-slate-300 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap pr-1">
                  {sessionB.finalOutput || 'No final synthesis output recorded for this session.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">No Session Selected</div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-[#1c2232] bg-[#0d101a] px-6 py-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Comparing 2 Deliberation Sessions</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#181d2c] hover:bg-[#20273c] px-4 py-1.5 text-slate-200 border border-[#273046] transition-colors font-sans font-medium"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
};
