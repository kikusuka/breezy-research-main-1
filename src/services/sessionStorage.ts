import { DebateSession, DebateStep, DebateTone } from '../types';

// Storage key constants - using synthexis_ prefix for consistency
export const STORAGE_SESSIONS_KEY = 'synthexis_debate_sessions_v1';
export const STORAGE_ACTIVE_ID_KEY = 'synthexis_active_session_id_v1';

export const SEED_SAMPLE_SESSIONS: DebateSession[] = [
  {
    id: 'session-kafka-vs-duckdb',
    prompt: 'Can you compare Kafka streaming with DuckDB micro-batching for our ledger system in simple terms? Which one should we pick?',
    protocol: 'trio',
    tone: 'balanced',
    createdAt: Date.now() - 1000 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 10,
    status: 'completed',
    steps: [
      {
        stepId: 'step-1',
        role: 'architect',
        agentName: 'Claude 3.5 Sonnet',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 12,
        durationMs: 3820,
        content: `### The Pure Kafka Choice
Partitioned topics guarantee **immutable append-only write throughput** without lock contention across distributed ledger workers.
- 120k eps/node sustained throughput
- Guaranteed durability with fsync ack=all
- Operational consideration: heavier infrastructure overhead (KRaft quorum)`,
      },
      {
        stepId: 'step-2',
        role: 'skeptic',
        agentName: 'GPT-4o',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 11,
        durationMs: 4190,
        content: `### Micro-Batching Risk Analysis
Warns against direct concurrent writes to DuckDB files: embedded databases lack distributed WALs and risk catastrophic lockouts.
- File-level lock contention under spike load
- Superb in-memory analytical query speeds
- Strict recommendation: read/audit tier only`,
      },
      {
        stepId: 'step-3',
        role: 'synthesizer',
        agentName: 'Gemini 1.5 Pro',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 10,
        durationMs: 4430,
        content: `### The Hybrid Setup
Proposes a **bifurcated pipeline**: stream ingest via Kafka topics, micro-batching into S3 Parquet tables for zero-copy DuckDB analysis.
- Instant balances via Kafka event streaming
- Lightning 100M+ row ledger reconciliation
- No lock interference on live financial writes`,
      },
      {
        stepId: 'step-4',
        role: 'arbiter',
        agentName: 'Synthexis Reviewer',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 10,
        durationMs: 4200,
        content: `### Tri-Node Consensus Synthesis
In short: **Kafka** is best if you need instant millisecond processing for every single transaction. **DuckDB** is much simpler and cheaper if waiting 5 seconds for batches is fine for your team.

**Recommendation: Go with the Hybrid approach for balanced cost and reliability.**`,
      },
    ],
    finalOutput: `In short: **Kafka** is best if you need instant millisecond processing for every single transaction. **DuckDB** is much simpler and cheaper if waiting 5 seconds for batches is fine for your team.

**Recommendation: Go with the Hybrid approach for balanced cost and reliability.**

- **Ingress Path**: Deploy Kafka partitioned topics for high-throughput append-only event streaming (120k eps/node) with strict \`ack=all\` durability.
- **Audit & Analytics**: Periodically compact micro-batches into Parquet tables on object storage for zero-copy sub-second DuckDB reconciliation.
- **Strict Boundary**: Avoid direct concurrent writes to raw DuckDB files on hot transactional paths to prevent file lock exhaustion.`,
    metrics: {
      durationMs: 12440,
      consensusRate: 94.2,
      contentionLevel: 'Moderate',
      resolvedPointsCount: 7,
    },
    researchMetrics: {
      durationMs: 12440,
      claimsIdentified: 18,
      claimsSupported: 12,
      claimsContradicted: 3,
      claimsUnresolved: 3,
      sourcesConsulted: 27,
      primarySourcesCount: 9,
      consensusRate: 94.2,
    },
    evidenceGraph: {
      researchPlan: [
        '1. Audit write-ahead logging durability and throughput benchmarks for high-frequency ledger events.',
        '2. Measure file-level lock contention and memory footprint during concurrent DuckDB analytical queries.',
        '3. Evaluate dual-track hybrid ingestion: Kafka real-time ingestion into Parquet cold-storage partitions.',
        '4. Formulate operational failure modes under node partitions and out-of-order delivery.'
      ],
      claims: [
        {
          id: 'claim-1',
          claim: 'Kafka partitioned topics sustain 120k+ events/sec per broker with deterministic partition-level sequencing.',
          status: 'supported',
          confidence: 96,
          supportingSources: [
            { title: 'Apache Kafka 3.7 Core Performance Benchmarks', url: 'https://kafka.apache.org/benchmarks', domain: 'kafka.apache.org', snippet: 'Sustained throughput of 120k eps under fsync ack=all across 3-broker cluster with zero event loss.' },
            { title: 'Confluent Financial Ledger Architecture Whitepaper', url: 'https://confluent.io/resources/fintech-architecture', domain: 'confluent.io', snippet: 'Monotonic offset progression guarantees ordered transaction event state.' }
          ],
          counterEvidence: [],
          analystStance: 'Foundational write path. Append-only throughput prevents lock starvation under multi-tenant volume.',
          criticStance: 'Requires KRaft quorum management overhead, but claim is empirically validated.',
          reviewerVerdict: 'Adopted as primary write ingestion mechanism.',
          verifiedAt: '14:32:15 UTC'
        },
        {
          id: 'claim-2',
          claim: 'Direct concurrent writes to local DuckDB files under heavy web traffic trigger file-level write lockouts.',
          status: 'supported',
          confidence: 98,
          supportingSources: [
            { title: 'DuckDB Concurrency & Process Attachment Limits', url: 'https://duckdb.org/docs/connect/concurrency', domain: 'duckdb.org', snippet: 'DuckDB uses a single-writer multiple-reader concurrency lock. Concurrent writer processes will fail with LockException.' },
            { title: 'VLDB 2023: In-Process Analytical Engines in Production', url: 'https://vldb.org/pvldb/vol16/p1920-duckdb.pdf', domain: 'vldb.org', snippet: 'Attempting transactional OLTP writes across multiple container processes yields catastrophic lock contention.' }
          ],
          counterEvidence: [
            { title: 'DuckDB In-Memory Thread Safety', url: 'https://duckdb.org/docs/connect/threading', domain: 'duckdb.org', snippet: 'In-memory databases support multi-threaded reader-writer transactions with internal MVCC.' }
          ],
          analystStance: 'Can be mitigated with in-process connection pooling for single-instance applications.',
          criticStance: 'Fatal flaw under horizontal multi-container deployments: embedded files across multiple pods fail.',
          reviewerVerdict: 'Verified. Restrict DuckDB strictly to analytical audit queries against static Parquet snapshots.',
          verifiedAt: '14:32:18 UTC'
        },
        {
          id: 'claim-3',
          claim: 'DuckDB vectorizes columnar reconciliation queries across 100M+ rows in under 400ms without GPU acceleration.',
          status: 'supported',
          confidence: 94,
          supportingSources: [
            { title: 'TPC-H Columnar Benchmark Results on DuckDB v0.10', url: 'https://db-benchmark.com/duckdb-tpch', domain: 'db-benchmark.com', snippet: 'SIMD vectorized engine processes 100M rows in 320ms on standard 8-core CPU.' }
          ],
          counterEvidence: [
            { title: 'RAM Exhaustion with Large In-Memory Aggregations', url: 'https://duckdb.org/docs/guides/performance/memory', domain: 'duckdb.org', snippet: 'Aggregations exceeding memory limit spill to disk, multiplying latency by 6x.' }
          ],
          analystStance: 'Superior to traditional Postgres table scans for end-of-day reconciliation audits.',
          criticStance: 'Memory ceiling must be strictly bounded to prevent Linux OOM killer termination.',
          reviewerVerdict: 'Adopted for batch verification and regulatory compliance reconciliation.',
          verifiedAt: '14:32:20 UTC'
        },
        {
          id: 'claim-4',
          claim: 'A single monolithic ledger without streaming queue handles unexpected traffic spikes via database connection pooling.',
          status: 'contradicted',
          confidence: 28,
          supportingSources: [],
          counterEvidence: [
            { title: 'AWS Well-Architected: Queue-Based Load Leveling Pattern', url: 'https://aws.amazon.com/architecture', domain: 'aws.amazon.com', snippet: 'Synchronous relational connection pools saturate during traffic bursts, causing cascading 504 timeouts.' }
          ],
          analystStance: 'Theoretical fallback for lightweight prototypes with low concurrency.',
          criticStance: 'Catastrophic failure mode in financial production: leads to unbounded connection pile-ups.',
          reviewerVerdict: 'Rejected. Dedicated ingestion queue is mandatory for financial ledger integrity.',
          verifiedAt: '14:32:22 UTC'
        }
      ],
      contradictions: [
        {
          id: 'contra-1',
          claimA: 'Analyst: Direct embedded DuckDB file logging provides adequate persistence.',
          claimB: 'Critic: Direct DuckDB file writes across multi-container web pods cause fatal file lock contention.',
          description: 'Conflict between embedded simplicity and distributed multi-tenant process safety.',
          sourceA: 'duckdb.org (Threading Guide)',
          sourceB: 'duckdb.org (Concurrency Lock Spec)',
          resolutionStatus: 'resolved',
          reconciledResolution: 'Adopted bifurcated architecture: Kafka for append-only streaming, DuckDB for read-only Parquet analysis.'
        }
      ],
      sourcesConsulted: [
        { id: 'src-1', title: 'Apache Kafka 3.7 Core Performance Benchmarks', url: 'https://kafka.apache.org/benchmarks', domain: 'kafka.apache.org', isPrimary: true, snippet: 'Throughput and partition durability validation.' },
        { id: 'src-2', title: 'DuckDB Concurrency & Process Attachment Limits', url: 'https://duckdb.org/docs/connect/concurrency', domain: 'duckdb.org', isPrimary: true, snippet: 'Single-writer concurrency lock mechanics.' },
        { id: 'src-3', title: 'Martin Kleppmann: Designing Data-Intensive Applications', url: 'https://dataintensive.net', domain: 'dataintensive.net', isPrimary: true, snippet: 'Event sourcing, stream processing, and partition idempotency.' },
        { id: 'src-4', title: 'VLDB 2023: In-Process Analytical Engines in Production', url: 'https://vldb.org/pvldb/vol16/p1920-duckdb.pdf', domain: 'vldb.org', isPrimary: true, snippet: 'Analytical vectorization across columnar formats.' },
        { id: 'src-5', title: 'Confluent Financial Ledger Architecture Whitepaper', url: 'https://confluent.io/resources/fintech-architecture', domain: 'confluent.io', isPrimary: false, snippet: 'Distributed ledger ingestion patterns.' },
        { id: 'src-6', title: 'Apache Parquet Columnar Format Specification', url: 'https://parquet.apache.org/docs', domain: 'parquet.apache.org', isPrimary: true, snippet: 'Columnar compression and predicate pushdown.' }
      ]
    },
  },
  {
    id: 'session-rlhf-alignment',
    prompt: 'RLHF Alignment Dialectics: Refusal vs Helpfulness in Security Research Tooling',
    protocol: 'trio',
    tone: 'balanced',
    createdAt: Date.now() - 1000 * 60 * 2,
    updatedAt: Date.now() - 1000 * 60 * 2,
    status: 'completed',
    steps: [],
    finalOutput: `Resolved: Implement dual sandboxing with ephemeral HSM keys to safely permit automated vulnerability scanning without triggering over-refusal safety tripwires.`,
    metrics: {
      durationMs: 11500,
      consensusRate: 96.0,
      contentionLevel: 'Low',
      resolvedPointsCount: 5,
    },
  },
  {
    id: 'session-moe-routing',
    prompt: 'MoE Routing Benchmarks across Triad Nodes and Expert Activation Decays',
    protocol: 'trio',
    tone: 'balanced',
    createdAt: Date.now() - 1000 * 60 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60,
    status: 'completed',
    steps: [],
    finalOutput: `Routing cost decay drops 42% under dynamic expert switching. Tail latency stabilized at 340ms with warmup caching.`,
    metrics: {
      durationMs: 14200,
      consensusRate: 89.0,
      contentionLevel: 'Moderate',
      resolvedPointsCount: 6,
    },
  },
  {
    id: 'session-sparse-attention',
    prompt: 'Sparse Attention Kernels for 1M Token Context Windows in Low-Memory Clusters',
    protocol: 'trio',
    tone: 'rigorous',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    status: 'completed',
    steps: [],
    finalOutput: `Adopt block-sparse FlashAttention kernels with rolling KV-cache eviction to preserve 98.4% retrieval accuracy under 24GB VRAM constraints.`,
    metrics: {
      durationMs: 15300,
      consensusRate: 92.5,
      contentionLevel: 'Low',
      resolvedPointsCount: 8,
    },
  },
  {
    id: 'session-quantization-degradation',
    prompt: 'Quantization Degradation in Edge Llama-3 8B under 4-Bit AWQ Precision Limits',
    protocol: 'trio',
    tone: 'rigorous',
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    updatedAt: Date.now() - 1000 * 60 * 60 * 72,
    status: 'completed',
    steps: [],
    finalOutput: `Retain FP16 for query-key projections while quantizing feedforward layers to INT4 to prevent the 14.8% perplexity penalty in mathematical reasoning.`,
    metrics: {
      durationMs: 16800,
      consensusRate: 85.2,
      contentionLevel: 'High',
      resolvedPointsCount: 9,
    },
  },
];

export const SEED_SAMPLE_SESSION: DebateSession = SEED_SAMPLE_SESSIONS[0];

/**
 * Load all saved debate sessions from LocalStorage.
 * Initializes with seed sessions if empty so users can immediately browse transcripts.
 */
export function loadSessions(): DebateSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) {
      // Seed default sessions
      saveSessions(SEED_SAMPLE_SESSIONS);
      return SEED_SAMPLE_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Sort newest first
      return parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    saveSessions(SEED_SAMPLE_SESSIONS);
    return SEED_SAMPLE_SESSIONS;
  } catch (err) {
    console.error('Failed to read debate sessions from localStorage:', err);
    return SEED_SAMPLE_SESSIONS;
  }
}

/**
 * Save array of sessions to LocalStorage. Limits to 40 most recent to prevent quota limits.
 */
export function saveSessions(sessions: DebateSession[]): void {
  try {
    const trimmed = sessions.slice(0, 40);
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save debate sessions to localStorage:', err);
  }
}

/**
 * Load active session ID from LocalStorage.
 */
export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist active session ID to LocalStorage.
 */
export function saveActiveSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
    }
  } catch (err) {
    console.error('Failed to save active session ID to localStorage:', err);
  }
}

/**
 * Helper to create a new session object
 */
export function createNewSession(
  prompt: string,
  protocol: 'trio' | 'quad' | 'duel' | 'solo',
  initialSteps: DebateStep[],
  tone: DebateTone = 'balanced'
): DebateSession {
  const now = Date.now();
  return {
    id: `deb_${now}_${Math.random().toString(36).slice(2, 7)}`,
    prompt,
    protocol,
    tone,
    createdAt: now,
    updatedAt: now,
    status: 'running',
    steps: initialSteps,
  };
}
