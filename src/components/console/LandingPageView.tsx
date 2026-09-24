import React, { useState } from 'react';

interface LandingPageViewProps {
  onLaunchWorkspace: (prompt?: string) => void;
  onOpenNotes: () => void;
  onOpenModels: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLaunchWorkspace,
  onOpenNotes,
  onOpenModels,
}) => {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  const demoScenarios = [
    {
      title: 'Kafka Streams vs. DuckDB for Financial Ledgers',
      category: 'Distributed Systems & Fintech',
      query: 'Can you compare Kafka streaming with DuckDB micro-batching for our ledger system in simple terms? Which one should we pick?',
      analyst: {
        model: 'Claude 3.5 Sonnet',
        role: 'Lead Analyst • Ingestion (Thesis)',
        point: 'Partitioned append-only write topics guarantee sub-5ms latency and horizontal consumer scaling with zero locking contention.',
        tag: '120k eps/node sustained',
      },
      critic: {
        model: 'GPT-4o',
        role: 'Adversarial Critic • Risk (Antithesis)',
        point: 'Warns against direct writes to DuckDB: embedded SQLite/DuckDB files lack distributed WAL failovers and lock up under concurrency spikes.',
        tag: 'Concurrent lock failure mode',
      },
      synthesis: {
        model: 'Gemini 1.5 Pro',
        role: 'Harmonizer & Synthesizer',
        point: 'Bifurcated architecture: Stream ingest and transactional write-ahead logs through Kafka, micro-batch into Parquet for DuckDB analytical reconciliations.',
        verdict: '94.2% Unanimous Consensus',
      },
    },
    {
      title: 'PostgreSQL + pgvector vs. Dedicated Pinecone Index',
      category: 'Vector Retrieval & Scalability',
      query: 'Should we store embeddings directly in PostgreSQL using pgvector or pay for a dedicated managed vector DB like Pinecone?',
      analyst: {
        model: 'Claude 3.5 Sonnet',
        role: 'Lead Analyst • Unified Storage',
        point: 'ACID guarantees and zero ETL synchronization lag. Filter metadata in standard relational SQL joins without secondary network hops.',
        tag: 'Single datastore simplicity',
      },
      critic: {
        model: 'GPT-4o',
        role: 'Adversarial Critic • Resource Contention',
        point: 'HNSW index builds consume heavy CPU/RAM; at 5M+ 1536-dim vectors, vacuuming and write contention degrades transactional DB performance.',
        tag: 'Memory spike hazard',
      },
      synthesis: {
        model: 'Gemini 1.5 Pro',
        role: 'Harmonizer & Synthesizer',
        point: 'Use pgvector below 2M vectors with IVFFlat. Only split into standalone vector nodes once vector cache thrashing impacts relational OLTP latency.',
        verdict: '91.8% Validated Consensus',
      },
    },
    {
      title: 'Modular Go Monolith vs. Kubernetes Microservices',
      category: 'Backend Architecture',
      query: 'Is migrating our 5-person engineering team to Kubernetes microservices worth the operational overhead, or should we stay on a modular Go monolith?',
      analyst: {
        model: 'Claude 3.5 Sonnet',
        role: 'Lead Analyst • Velocity Baseline',
        point: 'Modular Go monolith with domain packages and internal interfaces compiles in seconds, deploys via single binary, and eliminates network serialization tax.',
        tag: 'Max team velocity',
      },
      critic: {
        model: 'GPT-4o',
        role: 'Adversarial Critic • Failure Blast Radius',
        point: 'Single runtime crashes take down the entire platform. Microservices isolate memory leaks, crash loops, and enable independent deployment cadences.',
        tag: 'Blast radius isolation',
      },
      synthesis: {
        model: 'Gemini 1.5 Pro',
        role: 'Harmonizer & Synthesizer',
        point: 'Adopt a strict modular monolith with separate goroutine worker pools. Adopt microservices only when organizational team boundaries dictate separate repository ownership.',
        verdict: '96.5% Definite Consensus',
      },
    },
  ];

  const activeDemo = demoScenarios[selectedDemoIndex];

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-8 border-b border-outline-variant/20">
        {/* Subtle background ambient mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/8 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6 relative z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-secondary/30 text-xs font-mono text-secondary shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span>PROTOCOL V2.4 • DETERMINISTIC MULTI-MODEL SYNTHESIS</span>
          </div>

          {/* Headline */}
          <h1 className="font-sans text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-on-surface leading-[1.15] max-w-4xl">
            Don't settle for single-model hallucination.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#d7e3ff] to-secondary">
              Pitted in real-time adversarial debate.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Synthexis orchestrates frontier AI models—Claude 3.5 Sonnet, GPT-4o, and Gemini 1.5 Pro—in structured dialectical rounds. We stress-test assumptions, red-team failure modes, and synthesize mathematically validated consensus for mission-critical decisions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onLaunchWorkspace()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-sans text-sm font-semibold shadow-lg shadow-primary/10 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              <span>Launch Dialectic Workspace</span>
            </button>

            <button
              type="button"
              onClick={onOpenNotes}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-sans text-sm font-medium border border-outline-variant/40 transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary">library_books</span>
              <span>Explore Research Archives</span>
            </button>
          </div>

          {/* Key Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-outline-variant/15 mt-4">
            <div className="flex flex-col items-center">
              <span className="font-sans text-2xl font-semibold text-secondary">94.2%</span>
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider">
                Consensus Convergence
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-sans text-2xl font-semibold text-on-surface">16.4ms</span>
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider">
                Triad Latency (P95)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-sans text-2xl font-semibold text-primary">100%</span>
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider">
                Zero-Retention Enclave
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-sans text-2xl font-semibold text-on-surface">4.2M</span>
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider">
                Telemetry Quota
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Dialectic Simulator Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="font-mono text-xs uppercase text-primary tracking-widest font-semibold">
              Live Architecture Dialectic
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
              Watch Three Models Reconcile Complex Trade-offs
            </h2>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-xl">
              Select an engineering dilemma below to inspect how the Analyst, Critic, and Synthesizer formulate a bulletproof architecture.
            </p>

            {/* Scenario Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              {demoScenarios.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDemoIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedDemoIndex === idx
                      ? 'bg-surface-container-high text-primary border border-primary/40 shadow-xs'
                      : 'bg-surface-container-low text-tertiary hover:text-on-surface border border-outline-variant/30'
                  }`}
                >
                  {demo.title}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Simulation Frame */}
          <div className="rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-xl overflow-hidden">
            {/* Window bar */}
            <div className="px-5 py-3 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error/70"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary/70"></span>
                <span className="font-mono text-xs text-outline ml-2 truncate">
                  scenario: {activeDemo.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-secondary bg-secondary-container/40 px-2 py-0.5 rounded border border-secondary/30">
                  {activeDemo.synthesis.verdict}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col gap-6">
              {/* Query Inset */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-xs font-semibold text-on-surface">Architect Inquiry</span>
                  <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                    "{activeDemo.query}"
                  </p>
                </div>
              </div>

              {/* 3 Perspectives Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Node 1: Analyst */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-semibold text-primary">
                        {activeDemo.analyst.model}
                      </span>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        Thesis
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-tertiary">
                      {activeDemo.analyst.role}
                    </span>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {activeDemo.analyst.point}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/15 flex items-center gap-1.5 font-mono text-[10px] text-secondary">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    <span>{activeDemo.analyst.tag}</span>
                  </div>
                </div>

                {/* Node 2: Critic */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-semibold text-error">
                        {activeDemo.critic.model}
                      </span>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-error/10 text-error rounded">
                        Antithesis
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-tertiary">
                      {activeDemo.critic.role}
                    </span>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {activeDemo.critic.point}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/15 flex items-center gap-1.5 font-mono text-[10px] text-error">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    <span>{activeDemo.critic.tag}</span>
                  </div>
                </div>

                {/* Node 3: Synthesizer */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between gap-3 ring-1 ring-secondary/30">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-semibold text-secondary">
                        {activeDemo.synthesis.model}
                      </span>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-secondary/10 text-secondary rounded">
                        Synthesis
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-tertiary">
                      {activeDemo.synthesis.role}
                    </span>
                    <p className="font-sans text-xs text-on-surface leading-relaxed">
                      {activeDemo.synthesis.point}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/15 flex items-center gap-1.5 font-mono text-[10px] text-secondary">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    <span>Consensus Reconciled</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-mono text-xs text-outline">
                  Synthexis cross-referenced 12 benchmarks in 1.4s
                </span>
                <button
                  type="button"
                  onClick={() => onLaunchWorkspace(activeDemo.query)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-fixed font-medium transition-colors cursor-pointer"
                >
                  <span>Load this scenario in Workspace</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 border-t border-outline-variant/15 bg-surface-container-lowest/50">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="font-mono text-xs uppercase text-primary tracking-widest font-semibold">
              The Architecture
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
              Engineered for Cognitive Rigor
            </h2>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-xl">
              Why single-agent LLMs fail in mission-critical environments and how Synthexis fixes it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">alt_route</span>
              </div>
              <h3 className="font-sans text-base font-semibold text-on-surface">1. Parallel Ingestion</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Queries are dispatched simultaneously across disjoint model families (Anthropic, OpenAI, Google) to ensure diverse inductive priors and zero single-vendor bias.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[22px]">security</span>
              </div>
              <h3 className="font-sans text-base font-semibold text-on-surface">2. Adversarial Red-Teaming</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                Rather than polite agreement, the Critic is strictly prompted to search for edge cases, memory leaks, race conditions, and scenarios where the proposal collapses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <h3 className="font-sans text-base font-semibold text-on-surface">3. Mathematical Consensus</h3>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                The Reviewer adjudicates remaining disputes against calibrated agreement thresholds (75-95%) and outputs an uncompromised, production-ready checklist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 border-t border-outline-variant/15 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="font-mono text-xs uppercase text-primary tracking-widest font-semibold">
              Performance Delta
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
              Single Model vs. Synthexis Triad
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-low">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-surface-container border-b border-outline-variant/20 font-mono text-[11px] uppercase text-tertiary">
                <tr>
                  <th className="p-4">Capability</th>
                  <th className="p-4 text-outline">Standard LLM (ChatGPT / Claude)</th>
                  <th className="p-4 text-secondary font-semibold">Synthexis Tri-Stream Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                <tr>
                  <td className="p-4 font-medium text-on-surface">Hallucination Mitigation</td>
                  <td className="p-4 text-outline">Prone to convincing, fabricated claims</td>
                  <td className="p-4 text-secondary font-medium">Cross-verified by 3 independent model architectures</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-on-surface">Edge Case & Bug Detection</td>
                  <td className="p-4 text-outline">Low (optimistic default bias)</td>
                  <td className="p-4 text-secondary font-medium">High (dedicated adversarial Critic red-teams every point)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-on-surface">Vendor & Model Lock-In</td>
                  <td className="p-4 text-outline">Single model dependency</td>
                  <td className="p-4 text-secondary font-medium">Runs Anthropic + OpenAI + Google simultaneously</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-on-surface">Deterministic Boundary Limits</td>
                  <td className="p-4 text-outline">Rarely states when NOT to use</td>
                  <td className="p-4 text-secondary font-medium">Strict "When NOT to Use" operational boundaries declared</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-8 border-t border-outline-variant/20 bg-surface-container-low/80">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-5">
          <h2 className="font-sans text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
            Ready to stress-test your next architectural decision?
          </h2>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-lg">
            Start a dialectical inquiry in seconds. No complex setup required—powered by server-grounded frontier models.
          </p>
          <button
            type="button"
            onClick={() => onLaunchWorkspace()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-sans text-sm font-semibold shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span>Enter Dialectic Console</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-8 border-t border-outline-variant/15 text-center font-mono text-[11px] text-outline flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl mx-auto w-full">
        <span>Synthexis Protocol v2.4 • Deterministic Tri-Stream Architecture</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onOpenNotes} className="hover:text-on-surface transition-colors">
            Archives
          </button>
          <button type="button" onClick={onOpenModels} className="hover:text-on-surface transition-colors">
            Model Matrix
          </button>
          <button type="button" onClick={() => onLaunchWorkspace()} className="text-primary hover:underline">
            Console
          </button>
        </div>
      </footer>
    </div>
  );
};
