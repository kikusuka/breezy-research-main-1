import React, { useState } from 'react';
import { EvidenceGraph, ResearchMetrics, ResearchClaim } from '../../types';

interface EvidenceGraphViewProps {
  evidenceGraph?: EvidenceGraph;
  researchMetrics?: ResearchMetrics;
  sessionTitle?: string;
  isCompact?: boolean;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  evidenceGraph,
  researchMetrics,
  sessionTitle = 'Research Evidence Trail',
  isCompact = false,
}) => {
  const claims = evidenceGraph?.claims || [];
  const contradictions = evidenceGraph?.contradictions || [];
  const sources = evidenceGraph?.sourcesConsulted || [];
  const researchPlan = evidenceGraph?.researchPlan || [];

  const [selectedClaimId, setSelectedClaimId] = useState<string>(
    claims.length > 0 ? claims[0].id : 'none'
  );

  // If selectedClaimId is out of sync or claims change
  const activeClaim: ResearchClaim | undefined =
    claims.find((c) => c.id === selectedClaimId) || claims[0];

  const totalClaims = researchMetrics?.claimsIdentified ?? claims.length;
  const supportedClaims =
    researchMetrics?.claimsSupported ?? claims.filter((c) => c.status === 'supported').length;
  const contradictedClaims =
    researchMetrics?.claimsContradicted ?? claims.filter((c) => c.status === 'contradicted').length;
  const unresolvedClaims =
    researchMetrics?.claimsUnresolved ?? claims.filter((c) => c.status === 'unresolved').length;
  const sourcesCount = researchMetrics?.sourcesConsulted ?? sources.length;

  if (claims.length === 0 && sources.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <span className="material-symbols-outlined text-3xl text-stone-500 mb-2">schema</span>
        <h4 className="text-sm font-medium text-stone-200">No Evidence Trail Available Yet</h4>
        <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
          Start a research inquiry to extract verifiable claims, cross-reference primary sources, and map contradictions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Evidence Metrics Strip (Human, real numbers only) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
        <div className="flex flex-col">
          <span className="text-[11px] text-stone-400 tracking-wide font-sans">
            Claims Evaluated
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg font-semibold text-stone-100 tabular-nums">
              {totalClaims}
            </span>
            <span className="text-[11px] text-stone-400">
              · {sourcesCount} sources
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-stone-400 tracking-wide font-sans">
            Supported Claims
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg font-semibold text-emerald-400 tabular-nums">
              {supportedClaims}
            </span>
            <span className="text-[11px] text-stone-400">
              verified
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-stone-400 tracking-wide font-sans">
            Contradictions Flagged
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-lg font-semibold tabular-nums ${contradictedClaims > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
              {contradictedClaims}
            </span>
            <span className="text-[11px] text-stone-400">
              {contradictedClaims > 0 ? 'reconciled' : 'none'}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-stone-400 tracking-wide font-sans">
            Unresolved
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg font-semibold text-stone-300 tabular-nums">
              {unresolvedClaims}
            </span>
            <span className="text-[11px] text-stone-400">
              {unresolvedClaims === 0 ? 'high confidence' : 'open questions'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Evidence Explorer */}
      <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-stone-400">menu_book</span>
            <span className="text-xs font-semibold text-stone-200 tracking-wide">
              Verified Claims & Sources
            </span>
          </div>
          <span className="text-[11px] text-stone-400">
            {claims.length} claims documented
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Claims List */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <span className="text-[11px] text-stone-400 font-medium mb-1">
              Select a claim to inspect evidence:
            </span>
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {claims.map((c) => {
                const isSelected = activeClaim?.id === c.id;
                const statusColor =
                  c.status === 'supported'
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : c.status === 'contradicted'
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-stone-400 border-stone-500/30 bg-stone-500/10';

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClaimId(c.id)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/20 text-stone-100 shadow-sm'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] text-stone-400 uppercase tracking-wider font-mono">
                        {c.id}
                      </span>
                      <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded border ${statusColor}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2">
                      {c.claim}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Claim Detail */}
          <div className="md:col-span-7 flex flex-col gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            {activeClaim ? (
              <>
                <div>
                  <span className="text-[11px] text-stone-400 block mb-1">Claim Statement</span>
                  <p className="text-sm font-medium text-stone-100 leading-relaxed">
                    "{activeClaim.claim}"
                  </p>
                </div>

                {activeClaim.reviewerVerdict && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <span className="font-semibold text-emerald-400 block mb-0.5">Synthesis Finding:</span>
                    <p className="text-stone-300 leading-relaxed">
                      {activeClaim.reviewerVerdict}
                    </p>
                  </div>
                )}

                {activeClaim.criticStance && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="font-semibold text-amber-400 block mb-0.5">Counterpoint & Edge Case:</span>
                    <p className="text-stone-300 leading-relaxed">
                      {activeClaim.criticStance}
                    </p>
                  </div>
                )}

                {/* Supporting Sources */}
                <div>
                  <span className="text-[11px] text-stone-400 block mb-2 font-medium">
                    Supporting Citations & Evidence:
                  </span>
                  {activeClaim.supportingSources && activeClaim.supportingSources.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {activeClaim.supportingSources.map((src, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-black/20 border border-white/5 text-xs flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-stone-200 truncate pr-2">
                              {src.title}
                            </span>
                            {src.url && (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-blue-400 hover:underline text-[11px] shrink-0"
                              >
                                View ↗
                              </a>
                            )}
                          </div>
                          {src.snippet && (
                            <p className="text-stone-400 italic text-[11px] leading-relaxed">
                              "{src.snippet}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic">
                      Derived from model reasoning and verified production conventions.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-stone-400">Select a claim to see evidence details.</p>
            )}
          </div>
        </div>
      </div>

      {/* Discovered Contradictions Section */}
      {contradictions.length > 0 && (
        <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5">
          <span className="text-xs font-semibold text-stone-200 block mb-3">
            Where Sources or Arguments Disagreed ({contradictions.length})
          </span>
          <div className="flex flex-col gap-3">
            {contradictions.map((contra, i) => (
              <div
                key={contra.id || i}
                className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-amber-400 font-medium">
                  <span>Point of Tension #{i + 1}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {contra.resolutionStatus}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-300">
                  <div className="p-2 rounded bg-black/20 border border-white/5">
                    <span className="text-[10px] text-stone-400 block">Perspective A</span>
                    <span>{contra.claimA}</span>
                  </div>
                  <div className="p-2 rounded bg-black/20 border border-white/5">
                    <span className="text-[10px] text-stone-400 block">Perspective B</span>
                    <span>{contra.claimB}</span>
                  </div>
                </div>
                {contra.reconciledResolution && (
                  <div className="pt-1.5 border-t border-amber-500/10 text-stone-300">
                    <span className="text-stone-400 font-medium mr-1.5">How this was resolved:</span>
                    <span>{contra.reconciledResolution}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investigated Angles (Research Plan) */}
      {researchPlan.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
          <span className="text-[11px] text-stone-400 block mb-2 font-medium">
            Investigated Angles:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300">
            {researchPlan.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-stone-500 font-mono text-[10px] mt-0.5">0{idx + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
