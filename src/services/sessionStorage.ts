import { DebateSession, DebateStep, DebateTone } from '../types';

// Storage key constants - using synthexis_ prefix for consistency
export const STORAGE_SESSIONS_KEY = 'synthexis_debate_sessions_v1';
export const STORAGE_ACTIVE_ID_KEY = 'synthexis_active_session_id_v1';

export const SEED_SAMPLE_SESSIONS: DebateSession[] = [
  {
    id: 'session-seed-event-driven-vs-batch',
    prompt: 'Architect an ultra-low latency real-time ledger auditing pipeline: Event-Driven Kafka vs Periodic Micro-Batching with DuckDB.',
    protocol: 'trio',
    tone: 'rigorous',
    createdAt: Date.now() - 1000 * 60 * 45, // 45 minutes ago
    updatedAt: Date.now() - 1000 * 60 * 42,
    status: 'completed',
    steps: [
      {
        stepId: 'step-1',
        role: 'architect',
        agentName: 'The Architect',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 45,
        durationMs: 3820,
        content: `### Executive Architecture Baseline: Dual-Track Event Stream with Tiered CDC

To fulfill an ultra-low latency ledger auditing mandate while preserving deterministic reconciliation, we deploy an **Asynchronous Log-Centric Architecture**:

1. **Ingress & Ingestion**:
   - Primary transactional writes land in an append-only transaction log (Distributed Kafka cluster with 3-way partition replication, \`acks=all\`, and \`min.insync.replicas=2\`).
   - Transactions are serialized with strict monotonic event sequencing IDs per ledger partition key.

2. **Real-Time Stream Verification**:
   - Stream processing consumers (Apache Flink / Kafka Streams) execute continuous sliding-window anomaly and balance invariant validation within 10ms of publish.
   - Dual-entry invariant verification: Every debit MUST yield an exact balanced credit in the same transaction block.

3. **Storage Tiering**:
   - Hot state: Redis Cluster storing active rolling 24-hour balances.
   - Cold/Reconciliation state: Parquet columnar archives compacted on object storage for analytical queries.`,
      },
      {
        stepId: 'step-2',
        role: 'skeptic',
        agentName: 'The Skeptic',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 44,
        durationMs: 4190,
        content: `### Adversarial Critique & Latent Vulnerability Audit

The Architect's purely event-driven model suffers from 3 critical production failure modes:

1. **Out-of-Order Delivery & Partition Rebalancing Lag**:
   - Kafka partitions serialize by key, but partition rebalances during node failures introduce transient consumer skew. If account balance invariants depend on cross-partition multi-account ledger entries (e.g., transferring Account A on Partition 1 to Account B on Partition 8), pure stream consumers cannot guarantee atomic snapshots without distributed locking overhead.

2. **Poison Pill Invariant Halts**:
   - A single malformed event in the continuous Flink stream that triggers an unhandled invariant exception risks blocking the consumer offset or dumping records into a dead-letter queue (DLQ), causing ledger desynchronization.

3. **Compaction Storms vs. Write Amplification**:
   - Compacting hot Kafka changelogs alongside analytical Parquet storage generates severe I/O thrashing during market surges.`,
      },
      {
        stepId: 'step-3',
        role: 'arbiter',
        agentName: 'The Arbiter',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 42,
        durationMs: 4430,
        content: `### Council Consensus Synthesis & Hardened Architectural Specification

Having balanced the Architect's low-latency throughput with the Skeptic's distributed failure vectors, the Council ratifies the **Hybrid Strata-Log Architecture**:

1. **Partition Grouping by Currency Ledger Shards**:
   - Eliminate cross-partition skew by routing paired double-entry postings within shared partition boundary envelopes.

2. **Sub-Second Micro-Batching Invariant Barrier**:
   - Rather than pure per-event locking or heavy hourly batches, employ 250ms deterministic micro-batches. DuckDB in-process engines vectorize columnar balance assertions across the 250ms batch in under 8ms, yielding sub-100ms total audit latency with zero distributed locking.

3. **Isolated DLQ with Non-Blocking Quarantine**:
   - Ledger anomalies automatically quarantine disputed transaction paths into an active sandbox without stalling partition progression for uncontested accounts.`,
      },
    ],
    finalOutput: `### Consensus Resolution: Hybrid Strata-Log Ledger Audit

The Deliberation Council has converged on a verified, hardened pipeline for real-time ledger auditing:

- **Ingress Layer**: Kafka partition envelopes with strict double-entry colocation to eliminate cross-partition synchronization lag.
- **Verification Engine**: 250ms vectorized in-memory batch auditing combining the throughput of stream pipelines with the exact relational safety of columnar engines.
- **Latency Profile**: Verified sub-100ms end-to-end anomaly detection with zero single-point-of-failure deadlocks.
- **Failure Recovery**: Non-blocking account isolation quarantine protecting global pipeline throughput.`,
    metrics: {
      durationMs: 12440,
      consensusRate: 94,
      contentionLevel: 'Moderate',
      resolvedPointsCount: 7,
    },
  },
  {
    id: 'session-seed-semantic-caching',
    prompt: 'Design a high-throughput multi-tier semantic cache for enterprise LLM workloads with sub-5ms lookup latency.',
    protocol: 'trio',
    tone: 'balanced',
    createdAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    updatedAt: Date.now() - 1000 * 60 * 118,
    status: 'completed',
    steps: [
      {
        stepId: 'step-1',
        role: 'architect',
        agentName: 'The Architect',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 120,
        durationMs: 3450,
        content: `### Tiered Semantic Cache Architecture
- **L1 Exact Match**: In-memory Redis with xxHash64 hash index (<1ms).
- **L2 Approximate KNN**: Qdrant vector index embedded with quantized embeddings (<8ms).
- **L3 Cold Cache**: Distributed Key-Value store on SSD with TTL eviction policies.`,
      },
      {
        stepId: 'step-2',
        role: 'skeptic',
        agentName: 'The Skeptic',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 119,
        durationMs: 3980,
        content: `### Vulnerability Audit: Semantic Drift & Cache Poisoning
1. **Embedding Distance Ambiguity**: Cosine similarity thresholds above 0.92 still conflate inverted logic prompts (e.g., "Do not include X" vs "Include X").
2. **Context Bleed**: Variable temperature requests cannot safely share deterministic cache entries.`,
      },
      {
        stepId: 'step-3',
        role: 'arbiter',
        agentName: 'The Arbiter',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 118,
        durationMs: 4120,
        content: `### Ratified Consensus: Guardrailed Hybrid Semantic Gateway
- Enforce strict negative-intent keyword hash filters prior to vector distance checks.
- Parameterize cache key namespaces with generation temperature and user authorization scopes.`,
      },
    ],
    finalOutput: `Ratified multi-tier semantic cache featuring pre-filter guardrails against semantic inversion and tenant-isolated namespaces.`,
    metrics: {
      durationMs: 11550,
      consensusRate: 91,
      contentionLevel: 'Low',
      resolvedPointsCount: 5,
    },
  },
  {
    id: 'session-seed-zero-trust-service-mesh',
    prompt: 'Implement zero-trust mTLS service mesh authentication with automated ephemeral credential rotation across hybrid-cloud Kubernetes clusters.',
    protocol: 'trio',
    tone: 'aggressive',
    createdAt: Date.now() - 1000 * 60 * 240, // 4 hours ago
    updatedAt: Date.now() - 1000 * 60 * 238,
    status: 'completed',
    steps: [
      {
        stepId: 'step-1',
        role: 'architect',
        agentName: 'The Architect',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 240,
        durationMs: 4100,
        content: `### SPIFFE/SPIRE Cross-Cluster Federation
Deploy SPIRE agents on each node using Kubernetes node attestation with Envoy sidecar proxies dynamically reloading short-lived X.509 SVIDs every 30 minutes.`,
      },
      {
        stepId: 'step-2',
        role: 'skeptic',
        agentName: 'The Skeptic',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 239,
        durationMs: 4620,
        content: `### Red-Team Scrutiny: CA Latency Cascades & Thundering Herd
1. **SPIRE Server Bottlenecks**: 30-minute rotation cycles across 5,000 pods trigger synchronized renewal spikes and intermediate CA timeouts during network partitions.
2. **Revocation Deficits**: Short TTL without OCSP stapling leaves 30-minute exploitation windows for compromised nodes.`,
      },
      {
        stepId: 'step-3',
        role: 'arbiter',
        agentName: 'The Arbiter',
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        status: 'completed',
        timestamp: Date.now() - 1000 * 60 * 238,
        durationMs: 4780,
        content: `### Fortified Specification: Jittered Rotation with Local Node Caching
- Introduce uniform randomized jitter (±40%) to renewal schedules to flatten SPIRE CA request distribution.
- Implement SPIFFE-aware eBPF socket filters for instant local connection termination upon node revocation signals.`,
      },
    ],
    finalOutput: `Hardened zero-trust mesh deployment with jitter-stabilized SPIFFE renewals and eBPF revocation enforcement.`,
    metrics: {
      durationMs: 13500,
      consensusRate: 88,
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
