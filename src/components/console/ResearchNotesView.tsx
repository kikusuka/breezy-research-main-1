import React, { useState } from 'react';

interface ResearchNotesViewProps {
  onSelectNotePrompt: (prompt: string) => void;
}

interface NoteItem {
  id: string;
  category: 'consensus' | 'architecture' | 'audit';
  code: string;
  title: string;
  excerpt: string;
  statusBadge: string;
  statusColor: string;
  pinned?: boolean;
  convergence: string;
  tags: string[];
  models: { name: string; tag: string; bg: string }[];
  updatedAt: string;
  author: string;
  metricType?: 'sparkline' | 'cost' | 'delta' | 'gauge' | 'hipaa' | 'delay';
  metricData?: any;
}

export const ResearchNotesView: React.FC<ResearchNotesViewProps> = ({ onSelectNotePrompt }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'consensus' | 'architecture' | 'audit'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyCitation = (title: string) => {
    navigator.clipboard.writeText(`Synthexis Research Archive: "${title}" (v2.4 Engine Dialectic)`);
    showToast('Citation reference copied to clipboard');
  };

  const notesList: NoteItem[] = [
    {
      id: 'SEC-0894',
      category: 'consensus',
      code: 'SEC-0894',
      title: 'Kafka Streams vs. DuckDB for Financial Ledgers',
      excerpt:
        'Tri-model evaluation of write-ahead logging under heavy multi-tenant backpressure. DuckDB excels in sub-second analytical reconciliation while Kafka secures absolute partition-level idempotency.',
      statusBadge: '98.2% High Consensus',
      statusColor: 'text-secondary',
      pinned: true,
      convergence: '98.2%',
      tags: ['Distributed Systems', 'Fintech', 'Production Decided'],
      models: [
        { name: 'Claude 3.5 Sonnet', tag: 'C3', bg: 'bg-primary text-on-primary' },
        { name: 'GPT-4o', tag: 'G4', bg: 'bg-secondary text-on-secondary' },
        { name: 'Llama 3 70B', tag: 'L3', bg: 'bg-tertiary text-on-tertiary' },
      ],
      updatedAt: 'Saved 2h ago by Dr. Vance',
      author: 'Dr. K. Vance',
      metricType: 'sparkline',
    },
    {
      id: 'MOE-401',
      category: 'architecture',
      code: 'MOE-401',
      title: 'MoE Routing Benchmarks across Triad Nodes',
      excerpt:
        'Investigation into token cost decay when dynamic expert switching is active. Evaluated cold start penalty on 8x22B architecture versus dense single-pass weights.',
      statusBadge: '89% Convergence',
      statusColor: 'text-secondary',
      convergence: '89%',
      tags: ['Performance', 'Token Cost', 'vLLM'],
      models: [
        { name: 'Claude 3.5', tag: 'C3', bg: 'bg-primary text-on-primary' },
        { name: 'GPT-4o', tag: 'G4', bg: 'bg-secondary text-on-secondary' },
      ],
      updatedAt: 'Updated yesterday',
      author: 'Alex Mercer',
      metricType: 'cost',
      metricData: { cost: '$0.34', change: '-42%', latency: '340ms' },
    },
    {
      id: 'SAF-014',
      category: 'audit',
      code: 'SAF-014',
      title: 'RLHF Alignment Dialectics: Refusal vs Helpfulness',
      excerpt:
        'Direct confrontation on prompt over-refusal edge cases regarding penetration testing code samples. Claude defended defensive quarantine while GPT-4o suggested dual-use sandboxing.',
      statusBadge: 'Dialectic Resolved',
      statusColor: 'text-primary',
      convergence: '94%',
      tags: ['Safety', 'Red Teaming', 'RLHF Boundaries'],
      models: [
        { name: 'Claude 3.5', tag: 'C3', bg: 'bg-primary text-on-primary' },
        { name: 'GPT-4o', tag: 'G4', bg: 'bg-secondary text-on-secondary' },
      ],
      updatedAt: 'Oct 14, 2024',
      author: 'Elena Rostova',
      metricType: 'delta',
      metricData: { resolution: 'Dual Sandboxing + Ephemeral Key' },
    },
    {
      id: 'EDGE-902',
      category: 'architecture',
      code: 'EDGE-902',
      title: 'Quantization Degradation in Edge Llama-3 8B',
      excerpt:
        'Empirical measurement of reasoning drop under 4-bit AWQ compression. Mathematical perplexity drops 14.8% on zero-shot financial calculation benchmarks.',
      statusBadge: 'Precision Alert',
      statusColor: 'text-error',
      convergence: '85.2%',
      tags: ['Edge Deployment', 'AWQ', 'FP16 vs INT4'],
      models: [{ name: 'Llama 3', tag: 'L3', bg: 'bg-tertiary text-on-tertiary' }],
      updatedAt: 'Oct 12, 2024',
      author: 'Dr. K. Vance',
      metricType: 'gauge',
      metricData: { retained: '85.2%' },
    },
    {
      id: 'AUD-770',
      category: 'audit',
      code: 'AUD-770',
      title: 'Zero-Retention Boundary Validation for Medical Data',
      excerpt:
        'Hardware-enforced ephemeral enclave verification for clinical PHI queries. Both private LLM endpoints proved non-logging guarantees with TLS key destruction.',
      statusBadge: 'HIPAA Compliant',
      statusColor: 'text-secondary',
      convergence: '100%',
      tags: ['Compliance', 'HIPAA', 'Enclaves'],
      models: [
        { name: 'Claude 3.5', tag: 'C3', bg: 'bg-primary text-on-primary' },
        { name: 'GPT-4o', tag: 'G4', bg: 'bg-secondary text-on-secondary' },
        { name: 'Llama 3', tag: 'L3', bg: 'bg-tertiary text-on-tertiary' },
      ],
      updatedAt: 'Oct 09, 2024',
      author: 'Elena Rostova',
      metricType: 'hipaa',
    },
    {
      id: 'SYS-104',
      category: 'consensus',
      code: 'SYS-104',
      title: 'Asynchronous Log-Centric Architecture for CDC',
      excerpt:
        'Consensus on Debezium change-data-capture ingestion straight to Apache Iceberg formats. Model triad aligned against dual-write ORM patterns to preserve event causality.',
      statusBadge: 'Adopted Architecture',
      statusColor: 'text-secondary',
      convergence: '96%',
      tags: ['Architecture', 'Iceberg', 'CDC'],
      models: [
        { name: 'Claude 3.5', tag: 'C3', bg: 'bg-primary text-on-primary' },
        { name: 'Llama 3', tag: 'L3', bg: 'bg-tertiary text-on-tertiary' },
      ],
      updatedAt: 'Oct 04, 2024',
      author: 'Dr. K. Vance',
      metricType: 'delay',
      metricData: { delay: '< 14ms (P99)' },
    },
  ];

  const filteredNotes = notesList.filter((n) => {
    if (activeCategory !== 'all' && n.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="relative w-full px-4 sm:px-8 py-6 flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-surface-container-highest text-on-surface px-4 py-2.5 rounded-lg shadow-xl border border-outline-variant/40 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
          <span className="font-mono text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header Strip & Command Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-5 rounded-xl shadow-xs border border-outline-variant/25">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-primary bg-primary-container/20 px-2 py-0.5 rounded font-semibold">
              Consensus Vault
            </span>
            <span className="font-mono text-[11px] text-outline">v2.4 Archive Verified</span>
          </div>
          <h1 className="font-sans text-xl sm:text-2xl text-on-surface tracking-tight font-semibold">
            Research Notes & Synthesis Archives
          </h1>
          <p className="font-sans text-xs sm:text-sm text-tertiary max-w-2xl">
            Saved multi-model dialectic transcripts, tri-party consensus resolutions, formal safety audits, and production architectural decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => showToast('Vault synchronized with encrypted HSM storage')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-medium transition-all shadow-xs border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px] text-tertiary">cloud_sync</span>
            <span>Sync Vault</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectNotePrompt('')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Note</span>
            <span className="font-mono text-[10px] bg-on-primary/20 px-1 py-0.2 rounded ml-1">⌘N</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Telemetry Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-xs border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase text-outline font-semibold">Total Archives</span>
            <span className="font-sans text-xl text-on-surface font-semibold mt-0.5">24</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px]">library_books</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-xs border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase text-outline font-semibold">Pinned Reports</span>
            <span className="font-sans text-xl text-on-surface font-semibold mt-0.5">3</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px]">push_pin</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-xs border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase text-outline font-semibold">Avg Triad Convergence</span>
            <span className="font-sans text-xl text-secondary font-semibold mt-0.5">91.4%</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px]">join_inner</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between shadow-xs border border-outline-variant/20">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase text-outline font-semibold">Telemetry Backlog</span>
            <span className="font-sans text-xl text-on-surface font-semibold mt-0.5">142 KB</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary border border-outline-variant/30">
            <span className="material-symbols-outlined text-[18px]">storage</span>
          </div>
        </div>
      </div>

      {/* Filter, View & Search Command Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface-container p-2 rounded-xl border border-outline-variant/25">
        {/* Search Field */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-outline focus-within:text-on-surface flex-1 max-w-md shadow-xs border border-outline-variant/30">
          <span className="material-symbols-outlined text-[16px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter syntheses, authors, token bounds..."
            className="bg-transparent border-0 outline-none font-sans text-xs text-on-surface placeholder:text-outline w-full"
          />
          <span className="font-mono text-[10px] text-tertiary bg-surface-container-high px-1.5 py-0.5 rounded">
            /
          </span>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {(['all', 'consensus', 'architecture', 'audit'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-surface-container-high text-on-surface shadow-xs border border-outline-variant/40'
                  : 'bg-surface-container-low text-tertiary hover:text-on-surface'
              }`}
            >
              {cat === 'all'
                ? 'All Notes'
                : cat === 'consensus'
                ? 'Consensus Reports'
                : cat === 'architecture'
                ? 'Architecture Decisions'
                : 'Vulnerability Audits'}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/30">
            <button
              type="button"
              aria-label="Grid View"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-surface-container-highest text-primary' : 'text-tertiary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </button>
            <button
              type="button"
              aria-label="List View"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list' ? 'bg-surface-container-highest text-primary' : 'text-tertiary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Telemetry Side Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Notes Column (9 cols) */}
        <div className="xl:col-span-9 flex flex-col gap-4">
          <div
            className={
              viewMode === 'list'
                ? 'flex flex-col gap-3 w-full'
                : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full'
            }
          >
            {filteredNotes.map((note) => (
              <article
                key={note.id}
                className="flex flex-col justify-between bg-surface-container-low hover:bg-surface-container p-5 rounded-xl transition-all duration-200 shadow-xs border border-outline-variant/30 hover:border-outline-variant/60 group relative"
              >
                {note.pinned && (
                  <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 bg-secondary text-on-secondary px-2 py-0.5 rounded-full font-mono text-[9px] uppercase font-semibold shadow-xs">
                    <span className="material-symbols-outlined text-[11px]">push_pin</span>
                    <span>Pinned Dialectic</span>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className={`font-mono text-xs font-medium ${note.statusColor}`}>
                        {note.statusBadge}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-outline">{note.code}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-sm font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
                      {note.title}
                    </h3>
                    <p className="font-sans text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                      {note.excerpt}
                    </p>
                  </div>

                  {/* Inline Visual Gauge / Metric Block */}
                  {note.metricType === 'sparkline' && (
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg flex flex-col gap-1 border border-outline-variant/20">
                      <div className="flex items-center justify-between text-[10px] font-mono text-tertiary">
                        <span>Throughput Divergence</span>
                        <span className="text-secondary font-medium">182k tx/sec</span>
                      </div>
                      <svg className="w-full h-6 text-primary" fill="none" viewBox="0 0 200 30">
                        <path
                          d="M0 25 Q30 5, 60 18 T120 8 T160 20 T200 4"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="2"
                        />
                        <path
                          d="M0 25 Q30 5, 60 18 T120 8 T160 20 T200 4 L200 30 L0 30 Z"
                          fill="currentColor"
                          opacity="0.1"
                        />
                      </svg>
                    </div>
                  )}

                  {note.metricType === 'cost' && (
                    <div className="grid grid-cols-2 gap-2 bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] uppercase text-outline">Cost / 1M Tokens</span>
                        <span className="font-mono text-xs text-on-surface">
                          {note.metricData?.cost}{' '}
                          <span className="text-secondary text-[10px]">{note.metricData?.change}</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] uppercase text-outline">P95 Tail Latency</span>
                        <span className="font-mono text-xs text-on-surface">{note.metricData?.latency}</span>
                      </div>
                    </div>
                  )}

                  {note.metricType === 'delta' && (
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] uppercase text-outline">Resolution Delta</span>
                        <span className="font-mono text-xs text-on-surface">{note.metricData?.resolution}</span>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                    </div>
                  )}

                  {note.metricType === 'gauge' && (
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg flex flex-col gap-1 border border-outline-variant/20">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-tertiary">INT4 Precision Retained</span>
                        <span className="text-error font-medium">{note.metricData?.retained}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-error rounded-full" style={{ width: note.metricData?.retained }}></div>
                      </div>
                    </div>
                  )}

                  {note.metricType === 'hipaa' && (
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center gap-2 border border-outline-variant/20">
                      <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-on-surface font-medium">Zero Data Residency</span>
                        <span className="font-mono text-[9px] text-outline">Ephemeral enclave HSM verified</span>
                      </div>
                    </div>
                  )}

                  {note.metricType === 'delay' && (
                    <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between font-mono text-[10px] border border-outline-variant/20">
                      <span className="text-tertiary">Event Sourcing Delay</span>
                      <span className="text-secondary font-medium">{note.metricData?.delay}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1">
                    {note.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface-container text-tertiary font-mono text-[9px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Multi-Model Badges */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center -space-x-1">
                      {note.models.map((m, mi) => (
                        <span
                          key={mi}
                          className={`w-5 h-5 rounded-full ${m.bg} flex items-center justify-center font-mono text-[8px] font-bold shadow-xs ring-1 ring-background`}
                          title={m.name}
                        >
                          {m.tag}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] text-outline">{note.updatedAt}</span>
                  </div>
                </div>

                {/* Card Actions Strip */}
                <div className="flex items-center justify-between mt-4 pt-2.5 bg-surface-container-lowest/50 p-1.5 rounded-lg border border-outline-variant/15">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyCitation(note.title)}
                      className="p-1 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Copy Dialectic Citation"
                    >
                      <span className="material-symbols-outlined text-[15px]">format_quote</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyCitation(note.title)}
                      className="p-1 rounded text-tertiary hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Export Markdown"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectNotePrompt(note.title)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-fixed transition-colors font-medium"
                  >
                    <span>Inspect Dialectic</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Right Telemetry Column (3 cols) */}
        <aside className="xl:col-span-3 flex flex-col gap-4">
          {/* Triad Status */}
          <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 shadow-xs border border-outline-variant/25">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[17px]">verified</span>
                <span className="font-sans text-xs font-semibold text-on-surface">Triad Status</span>
              </div>
              <span className="font-mono text-[10px] text-secondary bg-secondary-container/30 px-2 py-0.5 rounded border border-secondary/20">
                All Synced
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-tertiary">Claude 3.5 Sonnet</span>
                <span className="font-mono text-[11px] text-on-surface">Node A (Thesis)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-tertiary">GPT-4o Omniscience</span>
                <span className="font-mono text-[11px] text-on-surface">Node B (Antithesis)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-tertiary">Llama 3 70B Instruct</span>
                <span className="font-mono text-[11px] text-on-surface">Node C (Arbiter)</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-3 rounded-lg flex flex-col gap-1.5 border border-outline-variant/20">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="uppercase text-outline font-semibold">Consensus Threshold</span>
                <span className="text-secondary font-medium">85% Minimum</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>

          {/* Active Authors */}
          <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 shadow-xs border border-outline-variant/25">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-on-surface">Active Authors</span>
              <span className="font-mono text-[10px] text-tertiary">Cluster Alpha</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center font-mono text-[10px] text-on-primary font-semibold">
                    KV
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-medium text-on-surface">Dr. K. Vance</span>
                    <span className="font-mono text-[9px] text-outline">18 Syntheses</span>
                  </div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" title="Online now"></span>
              </div>

              <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-mono text-[10px] text-on-surface font-semibold">
                    EL
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-medium text-on-surface">Elena Rostova</span>
                    <span className="font-mono text-[9px] text-outline">4 Syntheses</span>
                  </div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" title="Online now"></span>
              </div>

              <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-mono text-[10px] text-outline font-semibold">
                    AM
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-medium text-on-surface">Alex Mercer</span>
                    <span className="font-mono text-[9px] text-outline">2 Syntheses</span>
                  </div>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-outline" title="Away"></span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast('Invite link copied to clipboard')}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-tertiary hover:text-on-surface text-xs font-medium transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              <span>Invite Researcher</span>
            </button>
          </div>

          {/* Integrity Assurance Card */}
          <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2 shadow-xs border border-outline-variant/25">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-outline font-semibold">Integrity Assurance</span>
              <div className="flex items-center gap-1 text-secondary font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>Encrypted HSM</span>
              </div>
            </div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              All synthesis cards are immutable, hashed with SHA-256 Merkle trees, and auto-mirrored to on-prem Cold Vault every 15 minutes.
            </p>
            <div className="mt-1 flex items-center justify-between bg-surface-container-lowest p-2 rounded-lg font-mono text-[10px] border border-outline-variant/20">
              <span className="text-tertiary">Merkle Root:</span>
              <span className="text-primary truncate max-w-[140px]">9f83...4bb1e7</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
