import React, { useState } from 'react';

export const GuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [verifierInput, setVerifierInput] = useState('RUN-4091-88F3A2');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<{ sealed: string; text: string } | null>({
    sealed: '0x9f1a...c82d',
    text: 'All 14 claims matched against indexed arXiv abstracts without citation deviation.',
  });

  const handleCopyConfig = () => {
    const jsonSnippet = `{
  "matrix_version": "2025.1",
  "nodes": {
    "decomposition_node": {
      "provider": "ollama",
      "endpoint": "http://127.0.0.1:11434",
      "model": "deepseek-r1:70b-q4_K_M",
      "temperature": 0.05
    },
    "adversarial_node": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet",
      "max_tokens": 8192
    },
    "grounding_retrieval": {
      "provider": "local_embed",
      "vector_engine": "qdrant_embedded",
      "model": "nomic-embed-text-v1.5"
    }
  }
}`;
    navigator.clipboard.writeText(jsonSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleSimulateVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setVerifiedResult({
        sealed: '0x8d4e...a31c',
        text: 'All assertions verified against cryptographic hash trails. Zero post-synthesis drift detected.',
      });
      setIsVerifying(false);
    }, 600);
  };

  const navTopics = [
    { id: 'getting-started', label: 'Getting Started', group: 'Overview' },
    { id: 'core-philosophy', label: 'Core Philosophy', group: 'Overview' },
    { id: 'multi-model-arch', label: 'Multi-Model Fabric', group: 'Overview' },
    { id: 'research-engine', label: 'Verification Engine (4-Stage)', group: 'Investigation' },
    { id: 'chat-vs-pipelines', label: 'Chat vs Deep Pipelines', group: 'Investigation' },
    { id: 'model-orchestration', label: 'Model Orchestration', group: 'Infrastructure' },
    { id: 'privacy-cryptography', label: 'Privacy & Cryptography', group: 'Infrastructure' },
  ];

  const filteredTopics = navTopics.filter((t) =>
    t.label.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface p-space-md sm:p-space-lg pb-24 max-w-7xl mx-auto">
      {/* Subtle Ambient Radial Lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/3 w-[640px] h-[360px] bg-primary/10 rounded-full blur-[140px] -z-10" />

      <div className="flex flex-col lg:flex-row gap-space-lg py-space-xs w-full">
        {/* Sub-Navigation Tree Panel */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 self-start">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-space-md shadow-sm">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
              <span className="font-mono text-code-sm uppercase tracking-wider text-outline">
                Documentation Index
              </span>
              <span className="font-mono text-code-sm text-primary bg-surface-container px-space-xs py-0.5 rounded border border-primary/20">
                v2.4.1
              </span>
            </div>

            {/* Quick Search Filter */}
            <div className="relative mt-space-sm mb-space-md">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter topics..."
                className="w-full bg-surface-container text-on-surface placeholder:text-outline font-sans text-body-sm px-space-md py-1.5 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary shadow-sm"
              />
            </div>

            <nav className="flex flex-col gap-space-xs">
              {['Overview', 'Investigation', 'Infrastructure'].map((grp) => {
                const groupTopics = filteredTopics.filter((t) => t.group === grp);
                if (groupTopics.length === 0) return null;

                return (
                  <div key={grp} className="pt-space-xs">
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline px-space-xs">
                      {grp}
                    </span>
                    <div className="flex flex-col mt-space-xs gap-1">
                      {groupTopics.map((topic) => {
                        const active = activeSection === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => {
                              setActiveSection(topic.id);
                              document.getElementById(topic.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`flex items-center justify-between px-space-sm py-1.5 rounded-lg text-left transition-colors font-sans text-label-md ${
                              active
                                ? 'bg-surface-container-high text-primary font-medium border border-primary/20'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            <span>{topic.label}</span>
                            {active && (
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Live Status Tile in Sidebar */}
            <div className="mt-space-lg p-space-sm bg-surface-container rounded-xl border border-outline-variant/30 flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="font-sans text-label-sm text-on-surface font-semibold">
                  Local Node Synced
                </span>
              </div>
              <p className="font-mono text-code-sm text-on-surface-variant">ollama://127.0.0.1:11434</p>
              <span className="font-mono text-code-sm text-outline">
                Latency: 1.4ms · Zero outbound telemetry
              </span>
            </div>
          </div>
        </aside>

        {/* Main Reading Canvas */}
        <article className="flex-1 min-w-0 max-w-4xl space-y-space-xl">
          {/* Document Header Meta */}
          <header className="flex flex-col gap-space-xs bg-surface-container-low border border-outline-variant/30 p-space-lg rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-space-sm flex-wrap font-mono text-code-sm">
              <span className="text-primary bg-surface-container px-space-xs py-0.5 rounded uppercase border border-primary/20 font-medium">
                Manual / Technical Specs
              </span>
              <span className="text-outline">/</span>
              <span className="text-on-surface-variant">Updated today</span>
              <span className="text-outline">/</span>
              <span className="text-tertiary font-semibold">Hash: #7e2d9b9a</span>
            </div>

            <h1 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight mt-space-xs">
              Breezy Architecture &amp; Specification
            </h1>
            <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed">
              A hardened computing environment engineered for multi-hypothesis synthesis, deterministic
              factual verification, and privacy-first model routing.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-md bg-surface-container border border-outline-variant/20 p-space-sm rounded-xl">
              <div className="flex flex-col">
                <span className="font-mono text-code-sm text-outline">PRIMARY ROLE</span>
                <span className="font-sans text-label-md text-on-surface font-semibold">Synthesis Engine</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-code-sm text-outline">DEFAULT PIPELINE</span>
                <span className="font-sans text-label-md text-primary font-semibold">4-Pass Adversarial</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-code-sm text-outline">KEY STORAGE</span>
                <span className="font-sans text-label-md text-on-surface font-semibold">WebCrypto (AES-GCM)</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-code-sm text-outline">VERIFICATION</span>
                <span className="font-sans text-label-md text-tertiary font-semibold">Deterministic</span>
              </div>
            </div>
          </header>

          {/* Section 1: Getting Started */}
          <section id="getting-started" className="space-y-space-md scroll-mt-20">
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm font-semibold border border-primary/20">
                01
              </span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Getting Started</h2>
            </div>

            <div id="core-philosophy" className="bg-surface-container-low border border-outline-variant/30 p-space-lg rounded-2xl space-y-space-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-semibold text-headline-md text-on-surface">
                  Core Philosophy: &quot;Complicated inside. Calm outside.&quot;
                </h3>
                <span className="material-symbols-outlined text-primary">spa</span>
              </div>
              <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
                Conventional generative AI interfaces prioritize the spectacle: shifting gradient meshes,
                faux-thinking spinners, and conversational cheerfulness. Breezy rejects generative theater.
                The system treats cognitive research as an audit process where intelligence is defined by the
                rigorous subtraction of noise.
              </p>
              <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">info</span>
                <div className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-on-surface">Architectural Axiom:</span> The workspace does
                  not summarize unchecked texts. If a claim cannot be verified against citation nodes or localized
                  literature vectors within the configured confidence interval, it is isolated and flagged for human
                  review.
                </div>
              </div>
            </div>

            {/* Multi-Model Fabric */}
            <div id="multi-model-arch" className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl space-y-space-xs">
                <div className="flex items-center gap-space-xs text-primary">
                  <span className="material-symbols-outlined text-headline-sm">hub</span>
                  <span className="font-headline font-semibold text-headline-sm text-on-surface">
                    Orchestration Mesh
                  </span>
                </div>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Breezy does not rely on a monolithic parameter stack. Query decomposition, critique, retrieval,
                  and neutral synthesis are distributed across specialized endpoints according to compute
                  economics.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl space-y-space-xs">
                <div className="flex items-center gap-space-xs text-tertiary">
                  <span className="material-symbols-outlined text-headline-sm">fact_check</span>
                  <span className="font-headline font-semibold text-headline-sm text-on-surface">
                    Provenance Audit
                  </span>
                </div>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Every generated statement contains an internal cryptographic reference fingerprint mapping
                  directly to an immutable source chunk, complete with line numbers and token spans.
                </p>
              </div>
            </div>

            {/* SVG Pipeline Schematic */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 p-space-lg rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-space-sm font-mono text-code-sm">
                <span className="text-outline">SCHEMATIC 1.0 : MULTI-MODEL EVENT TRANSIT</span>
                <span className="text-primary font-medium">ASYNC RUNTIME</span>
              </div>
              <div className="w-full overflow-x-auto py-space-sm">
                <svg className="w-full min-w-[640px] text-on-surface" fill="none" viewBox="0 0 760 160">
                  <path d="M 60 80 L 700 80" stroke="#32353a" strokeDasharray="4 4" strokeWidth="2" />
                  {/* Node 1 */}
                  <rect fill="#1d2025" height="70" rx="8" width="120" x="20" y="45" stroke="#3d494d" strokeWidth="1" />
                  <text fill="#4cd6fb" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" textAnchor="middle" x="80" y="75">
                    INPUT INQUIRY
                  </text>
                  <text fill="#869398" fontFamily="Inter" fontSize="10" textAnchor="middle" x="80" y="95">
                    Constraint Parse
                  </text>
                  <circle cx="140" cy="80" fill="#4cd6fb" r="4" />

                  {/* Node 2 */}
                  <rect fill="#1d2025" height="70" rx="8" width="130" x="180" y="45" stroke="#3d494d" strokeWidth="1" />
                  <text fill="#e1e2e9" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" textAnchor="middle" x="245" y="75">
                    PARALLEL DECOMP
                  </text>
                  <text fill="#869398" fontFamily="Inter" fontSize="10" textAnchor="middle" x="245" y="95">
                    Sub-Claim Trees
                  </text>
                  <circle cx="310" cy="80" fill="#4cd6fb" r="4" />

                  {/* Node 3 */}
                  <rect fill="#1d2025" height="70" rx="8" width="130" x="360" y="45" stroke="#3d494d" strokeWidth="1" />
                  <text fill="#ffb4ab" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" textAnchor="middle" x="425" y="75">
                    RED-TEAM CRITIQUE
                  </text>
                  <text fill="#869398" fontFamily="Inter" fontSize="10" textAnchor="middle" x="425" y="95">
                    Counter-Evidence
                  </text>
                  <circle cx="490" cy="80" fill="#4edea3" r="4" />

                  {/* Node 4 */}
                  <rect fill="#272a30" height="80" rx="8" width="170" x="540" y="40" stroke="#4cd6fb" strokeWidth="1.5" />
                  <text fill="#4edea3" fontFamily="JetBrains Mono" fontSize="12" fontWeight="700" textAnchor="middle" x="625" y="73">
                    NEUTRAL SYNTHESIS
                  </text>
                  <text fill="#bcc9ce" fontFamily="Inter" fontSize="10" textAnchor="middle" x="625" y="93">
                    Audited Trace Matrix
                  </text>
                  <text fill="#4cd6fb" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="625" y="108">
                    CONFIDENCE: 99.4%
                  </text>
                </svg>
              </div>
            </div>
          </section>

          {/* Section 2: Research Engine */}
          <section id="research-engine" className="space-y-space-md scroll-mt-20">
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm font-semibold border border-primary/20">
                02
              </span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">
                The 4-Stage Research Engine
              </h2>
            </div>
            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
              Deep runs execute sequentially through four cryptographically isolated passes. Each phase writes
              output artifacts to the local session graph, ensuring full reproducibility.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl flex flex-col justify-between">
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-code-sm text-primary bg-surface-container px-space-xs py-0.5 rounded border border-primary/20">
                      STAGE 01
                    </span>
                    <span className="material-symbols-outlined text-outline text-headline-sm">account_tree</span>
                  </div>
                  <h3 className="font-headline font-semibold text-headline-sm text-on-surface">
                    Question Decomposition
                  </h3>
                  <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    The primary inquiry is broken down into falsifiable sub-claims. Unstated premises are exposed as
                    isolated logical predicates.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs font-mono text-code-sm text-outline border-t border-outline-variant/20">
                  Artifact: <span className="text-on-surface">claims_tree.json</span>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl flex flex-col justify-between">
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-code-sm text-error bg-surface-container px-space-xs py-0.5 rounded border border-error/20">
                      STAGE 02
                    </span>
                    <span className="material-symbols-outlined text-error text-headline-sm">security</span>
                  </div>
                  <h3 className="font-headline font-semibold text-headline-sm text-on-surface">
                    Adversarial Red-Teaming
                  </h3>
                  <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    A high-parameter model takes the persona of a skeptical reviewer tasked with discovering
                    methodological flaws, confirmation bias, and conflicting empirical data.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs font-mono text-code-sm text-outline border-t border-outline-variant/20">
                  Artifact: <span className="text-on-surface">critique_matrix.ndjson</span>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl flex flex-col justify-between">
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-code-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded border border-secondary/20">
                      STAGE 03
                    </span>
                    <span className="material-symbols-outlined text-secondary text-headline-sm">library_books</span>
                  </div>
                  <h3 className="font-headline font-semibold text-headline-sm text-on-surface">
                    Literature Grounding
                  </h3>
                  <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    Connectors scan configured vector bases, PubMed, arXiv, and local documents. Fragments are ranked
                    using hybrid BM25 + dense cross-encoder re-ranking.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs font-mono text-code-sm text-outline border-t border-outline-variant/20">
                  Artifact: <span className="text-on-surface">evidence_registry.sqlite</span>
                </div>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl flex flex-col justify-between">
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-code-sm text-tertiary bg-surface-container px-space-xs py-0.5 rounded border border-tertiary/20">
                      STAGE 04
                    </span>
                    <span className="material-symbols-outlined text-tertiary text-headline-sm">draw</span>
                  </div>
                  <h3 className="font-headline font-semibold text-headline-sm text-on-surface">
                    Neutral Synthesis
                  </h3>
                  <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    The final analytical manuscript is synthesized. Points of consensus are highlighted in emerald;
                    irreconcilable evidentiary tensions are surfaced explicitly in amber.
                  </p>
                </div>
                <div className="mt-space-md pt-space-xs font-mono text-code-sm text-outline border-t border-outline-variant/20">
                  Artifact: <span className="text-on-surface">synthesis_report.md</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Chat vs Pipelines */}
          <section id="chat-vs-pipelines" className="space-y-space-md scroll-mt-20">
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm font-semibold border border-primary/20">
                03
              </span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">
                Chat vs. Deep Pipelines
              </h2>
            </div>
            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
              Understanding the computational boundary between interactive conversational sessions and background
              batch synthesis is critical for cost and latency control.
            </p>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-body-sm">
                  <thead>
                    <tr className="bg-surface-container text-outline font-mono text-code-sm uppercase border-b border-outline-variant/20">
                      <th className="py-space-sm px-space-md">Dimension</th>
                      <th className="py-space-sm px-space-md text-on-surface">Chat Mode (/chat)</th>
                      <th className="py-space-sm px-space-md text-primary">Deep Research Pipeline (/run)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-space-sm px-space-md font-semibold text-on-surface">Latency Budget</td>
                      <td className="py-space-sm px-space-md text-on-surface-variant">&lt; 850ms first-token stream</td>
                      <td className="py-space-sm px-space-md text-tertiary">120s – 15m asynchronous execution</td>
                    </tr>
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-space-sm px-space-md font-semibold text-on-surface">Context Window</td>
                      <td className="py-space-sm px-space-md text-on-surface-variant">Sliding 8k – 32k tokens</td>
                      <td className="py-space-sm px-space-md text-on-surface">Recursive trees (up to 2.4M tokens scanned)</td>
                    </tr>
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-space-sm px-space-md font-semibold text-on-surface">Source Verification</td>
                      <td className="py-space-sm px-space-md text-on-surface-variant">Heuristic retrieval snippets</td>
                      <td className="py-space-sm px-space-md text-primary font-medium">Deterministic cross-examination &amp; hash verification</td>
                    </tr>
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="py-space-sm px-space-md font-semibold text-on-surface">Adversarial Checks</td>
                      <td className="py-space-sm px-space-md text-outline">Disabled (Standard prompt)</td>
                      <td className="py-space-sm px-space-md text-on-surface">Mandatory isolated challenger step</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 4: Model Orchestration & Local Ollama */}
          <section id="model-orchestration" className="space-y-space-md scroll-mt-20">
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm font-semibold border border-primary/20">
                04
              </span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">
                Model Orchestration &amp; Local Ollama
              </h2>
            </div>
            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
              Breezy can run decoupled from cloud telemetry. You can route high-speed decomposition to local
              weights running via Ollama, and reserve proprietary API keys for exhaustive adversarial steps.
            </p>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-surface-container px-space-md py-space-xs flex items-center justify-between border-b border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                  <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                  <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                  <span className="font-mono text-code-sm text-outline ml-space-xs">~/.breezy/routing-matrix.json</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface font-mono text-code-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-label-md">
                    {copiedConfig ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedConfig ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-space-md font-mono text-code-sm overflow-x-auto text-on-surface leading-relaxed">
                <code>{`{
  "matrix_version": "2025.1",
  "nodes": {
    "decomposition_node": {
      "provider": "ollama",
      "endpoint": "http://127.0.0.1:11434",
      "model": "deepseek-r1:70b-q4_K_M",
      "temperature": 0.05
    },
    "adversarial_node": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet",
      "max_tokens": 8192
    },
    "grounding_retrieval": {
      "provider": "local_embed",
      "vector_engine": "qdrant_embedded",
      "model": "nomic-embed-text-v1.5"
    }
  }
}`}</code>
              </pre>
            </div>
          </section>

          {/* Section 5: Privacy & Cryptography */}
          <section id="privacy-cryptography" className="space-y-space-md scroll-mt-20">
            <div className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm font-semibold border border-primary/20">
                05
              </span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">
                Privacy &amp; Cryptography
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl space-y-space-xs">
                <span className="material-symbols-outlined text-primary text-headline-md">vpn_key</span>
                <h4 className="font-headline font-semibold text-headline-sm text-on-surface">Client Key Custody</h4>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Third-party API keys never touch Breezy central servers. Credentials are stored in browser storage
                  via WebCrypto (AES-256-GCM) with user-derived protection.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl space-y-space-xs">
                <span className="material-symbols-outlined text-tertiary text-headline-md">delete_sweep</span>
                <h4 className="font-headline font-semibold text-headline-sm text-on-surface">Zero Data Retention</h4>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Sessions are strictly ephemeral or localized. Closing a session zeroizes active runtime matrices. Outbound
                  API payloads enforce standard zero-retention parameters across providers.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/30 p-space-md rounded-2xl space-y-space-xs">
                <span className="material-symbols-outlined text-secondary text-headline-md">verified</span>
                <h4 className="font-headline font-semibold text-headline-sm text-on-surface">Hash Verification</h4>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Synthesized briefs produce a SHA-256 provenance manifest capturing the exact prompts, token hashes, and
                  referenced documents for immutable chain-of-custody audits.
                </p>
              </div>
            </div>

            {/* Interactive Run Verifier Toy */}
            <div className="bg-surface-container-low border border-outline-variant/30 p-space-lg rounded-2xl space-y-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-semibold text-headline-sm text-on-surface">
                    Deterministic Run Verifier
                  </h4>
                  <p className="font-sans text-body-sm text-on-surface-variant">
                    Test a run artifact manifest digest to verify that claims have not suffered post-synthesis drift.
                  </p>
                </div>
                <span className="font-mono text-code-sm text-primary bg-surface-container px-space-xs py-0.5 rounded border border-primary/20">
                  UTILITY
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-space-sm">
                <input
                  type="text"
                  value={verifierInput}
                  onChange={(e) => setVerifierInput(e.target.value)}
                  placeholder="Paste manifest SHA-256 or Run # identifier..."
                  className="flex-1 bg-surface-container font-mono text-code-sm text-on-surface px-space-md py-space-sm rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleSimulateVerify}
                  disabled={isVerifying}
                  className="bg-primary text-on-primary font-sans text-label-md font-semibold px-space-lg py-space-sm rounded-xl hover:bg-secondary transition-colors flex items-center justify-center gap-space-xs shrink-0 shadow-md"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isVerifying ? 'animate-spin' : ''}`}>
                    {isVerifying ? 'refresh' : 'verified_user'}
                  </span>
                  <span>{isVerifying ? 'Auditing...' : 'Verify Artifact'}</span>
                </button>
              </div>

              {verifiedResult && (
                <div className="p-space-sm bg-surface-container rounded-xl border border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                    <div className="flex flex-col">
                      <span className="font-mono text-code-sm text-on-surface font-semibold">
                        Integrity Sealed: {verifiedResult.sealed}
                      </span>
                      <span className="font-sans text-body-sm text-on-surface-variant">
                        {verifiedResult.text}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-code-sm text-tertiary hidden sm:inline font-semibold">
                    100% VALIDATED
                  </span>
                </div>
              )}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
