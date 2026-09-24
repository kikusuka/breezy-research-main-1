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
