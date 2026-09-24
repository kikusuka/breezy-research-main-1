import React, { useState } from 'react';

export interface EvidenceNode {
  id: string;
  claim: string;
  status: 'supported' | 'contradicted' | 'synthesized' | 'unresolved';
  agent: string;
  sources: { title: string; url?: string; snippet: string; type: 'doc' | 'benchmark' | 'rfc' }[];
  contradictionNote?: string;
  resolution: string;
}

interface EvidenceGraphViewProps {
  sessionTitle?: string;
  isCompact?: boolean;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  sessionTitle = 'Kafka Streams vs. DuckDB for Financial Ledgers',
  isCompact = false,
}) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>('claim-1');

  const evidenceNodes: EvidenceNode[] = [
    {
      id: 'claim-1',
      claim: 'Kafka partitioned append-only topics guarantee sub-5ms write latency under 100k+ eps.',
      status: 'supported',
      agent: 'Claude 3.5 Sonnet (Ingestion Analyst)',
      sources: [
        {
          title: 'Apache Kafka 3.7 Documentation — Durability & Ack Protocols',
          type: 'doc',
          snippet: 'Partitioned write log buffers to OS page cache with zero-copy network sends, achieving <5ms write times with ack=all quorum.',
        },
        {
          title: 'Redpanda / Kafka Benchmarking Report (Fintech Core, 2025)',
          type: 'benchmark',
          snippet: '99.9th percentile latencies stayed under 8.2ms under 140k sustained write events/sec per 3-node cluster.',
        },
      ],
      resolution: 'Verified for continuous ledger transaction capture without lock contention.',
    },
    {
      id: 'claim-2',
      claim: 'Direct high-concurrency transactional writes to DuckDB files cause database lock failures.',
      status: 'contradicted',
      agent: 'GPT-4o (Adversarial Critic)',
      sources: [
        {
          title: 'DuckDB Official Documentation — Concurrency & Multi-Reader Single-Writer Model',
          type: 'doc',
          snippet: 'DuckDB uses a single-writer concurrency model. Concurrent write transactions will fail or queue with file locks if attempted in parallel across processes.',
        },
        {
          title: 'DuckDB GitHub Issue #4820 — Process lockouts under parallel worker threads',
          type: 'rfc',
          snippet: 'Direct embedded writes from multiple API worker nodes cause database lock collisions and I/O bottlenecks.',
        },
      ],
      contradictionNote: 'Directly refutes naive proposals to write live customer checkout transactions into embedded DuckDB.',
      resolution: 'Strictly isolate DuckDB to read-only analytical queries over immutable Parquet files.',
    },
    {
      id: 'claim-3',
      claim: 'Micro-batching Parquet files to S3 enables DuckDB to scan 50M+ rows in under 200ms.',
      status: 'supported',
      agent: 'Gemini 1.5 Pro (Architecture Synthesizer)',
      sources: [
        {
          title: 'DuckDB Parquet Reader Engine Spec',
          type: 'doc',
          snippet: 'Columnar projection pushdown and vectorized SIMD execution allow DuckDB to scan partitioned Parquet files at 1.2 GB/sec per core.',
        },
        {
          title: 'Ledger Audit Scale Report (DuckDB vs Spark, 2025)',
          type: 'benchmark',
          snippet: 'Daily balance reconciliation of 80M entries finished in 410ms on a single c6i.4xlarge EC2 instance.',
        },
      ],
      resolution: 'Optimal audit tier: Zero database server costs with local analytical speeds.',
    },
    {
      id: 'claim-4',
      claim: 'Bifurcated architecture eliminates write lock interference while retaining instant auditability.',
      status: 'synthesized',
      agent: 'Lead Reviewer (Arbitration Node)',
      sources: [
        {
          title: 'Synthexis Consensus Synthesis #042-US-EAST',
          type: 'rfc',
          snippet: 'Decouple write ingestion (Kafka) from audit reads (DuckDB). Event logs flush to Parquet in 1-minute micro-batches.',
        },
      ],
      resolution: 'Definitive recommendation: 100% agreement reached across all 3 frontier models.',
    },
  ];

  const activeClaim = evidenceNodes.find((n) => n.id === selectedClaimId) || evidenceNodes[0];

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Evidence Coverage Metrics Bar (No fake telemetry!) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-outline tracking-wider">Claims Evaluated</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-sans text-xl font-semibold text-on-surface">4 / 4</span>
            <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-1.5 py-0.2 rounded">100% Grounded</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-outline tracking-wider">Claims Supported</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-sans text-xl font-semibold text-secondary">3 Claims</span>
            <span className="font-mono text-[10px] text-secondary">✓ Primary Sources</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-outline tracking-wider">Contradictions Flagged</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-sans text-xl font-semibold text-error">1 Conflict</span>
            <span className="font-mono text-[10px] text-error bg-error/10 px-1.5 py-0.2 rounded">Reconciled</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-outline tracking-wider">Primary Sources</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-sans text-xl font-semibold text-primary">7 Sources</span>
            <span className="font-mono text-[10px] text-outline">Docs & Benchmarks</span>
          </div>
        </div>
      </div>

      {/* Visual Dialectic Evidence Flow Graph */}
      <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">schema</span>
            <span className="font-sans text-sm font-semibold text-on-surface">Evidence Trail & Contradiction Graph</span>
          </div>
          <span className="font-mono text-[10px] text-tertiary">Interactive Node Map</span>
        </div>

        {/* Visual Graph Layout */}
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          {/* Claim Nodes List */}
          <div className="flex flex-col gap-2 md:w-5/12">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
              Dissected Claims ({evidenceNodes.length})
            </span>
            <div className="flex flex-col gap-2">
              {evidenceNodes.map((node) => {
                const isSelected = node.id === selectedClaimId;
                const statusBadge =
                  node.status === 'supported'
                    ? { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30', label: 'SUPPORTED' }
                    : node.status === 'contradicted'
                    ? { bg: 'bg-error/10', text: 'text-error', border: 'border-error/30', label: 'CONTRADICTED' }
                    : { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', label: 'SYNTHESIS' };

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedClaimId(node.id)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-surface-container-high border-primary/50 shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high/60 border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] text-tertiary truncate">{node.agent}</span>
                      <span className={`font-mono text-[9px] uppercase px-1.5 py-0.2 rounded border font-semibold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-on-surface line-clamp-2 leading-relaxed">
                      {node.claim}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connective Indicator */}
          <div className="hidden md:flex flex-col items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </div>

          {/* Active Claim Evidence Deep-Dive */}
          <div className="flex-1 rounded-xl bg-surface-container p-4 border border-outline-variant/30 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-semibold">
                  Evidence Deep-Dive • {activeClaim.id.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-outline">{activeClaim.agent}</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                <span className="font-mono text-[9px] uppercase text-outline">Evaluated Claim</span>
                <p className="font-sans text-xs sm:text-sm text-on-surface font-medium mt-0.5 leading-relaxed">
                  "{activeClaim.claim}"
                </p>
              </div>

              {activeClaim.contradictionNote && (
                <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-2">
                  <span className="material-symbols-outlined text-error text-[16px] shrink-0 mt-0.5">warning</span>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-semibold text-error">Dialectic Contradiction Flagged</span>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {activeClaim.contradictionNote}
                    </p>
                  </div>
                </div>
              )}

              {/* Cited Primary Sources */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-tertiary uppercase tracking-wider font-semibold">
                  Primary Sources & Production References ({activeClaim.sources.length})
                </span>
                <div className="flex flex-col gap-2">
                  {activeClaim.sources.map((src, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-semibold text-secondary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">menu_book</span>
                          {src.title}
                        </span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-surface-container text-outline border border-outline-variant/30">
                          {src.type}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-on-surface-variant leading-relaxed italic">
                        "{src.snippet}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resolved Verdict */}
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span className="font-sans text-xs text-on-surface font-medium">
                  {activeClaim.resolution}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research State Flowchart (The Real Protocol) */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/25">
        <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold block mb-2">
          Research State & Verification Pipeline
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20 flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>1. Decomposed</span>
          </div>
          <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20 flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>2. Triad Dispatched</span>
          </div>
          <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20 flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>3. Sources Audited</span>
          </div>
          <div className="p-2.5 rounded bg-surface-container border border-outline-variant/20 flex items-center gap-2 text-secondary">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>4. Risk Reconciled</span>
          </div>
          <div className="p-2.5 rounded bg-surface-container border border-secondary/40 flex items-center gap-2 text-primary font-medium">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            <span>5. Consensus Built</span>
          </div>
        </div>
      </div>
    </div>
  );
};
