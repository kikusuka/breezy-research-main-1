import React, { useState } from 'react';
import { providerConfigService } from '../../services/providerConfigService';

interface LandingPageViewProps {
  onLaunchWorkspace: (prompt?: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onOpenNotes: () => void;
  onOpenModels: () => void;
  onOpenDocs?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLaunchWorkspace,
  onOpenNotes,
  onOpenModels,
  onOpenDocs,
}) => {
  const [inquiryText, setInquiryText] = useState('');
  const [isBatterySample, setIsBatterySample] = useState(false);

  const sampleFormalVerification = {
    title: 'Evaluating multi-agent debate protocols vs tree-of-thought search in automated formal verification',
    takeaway:
      'Multi-agent debate accelerates theorem clause exploration by 38.4% over standard Tree-of-Thought search, but is susceptible to cyclical agreement loops on unsound lemmas. Incorporating a deterministic Lean 4 checker in the loop eliminates false convergence, yielding provably sound formal verification scripts with zero post-hoc hallucinations.',
    citations: ['arXiv:2403.01129', 'doi:10.1007/formal-lean4', 'Lean Mathlib 4.8.0'],
    concordance: '94.8%',
  };

  const sampleBattery = {
    title: 'Quantifying polysulfide dissolution suppression mechanisms in room-temperature Lithium-Sulfur cathodes',
    takeaway:
      'Dual-model audit confirms that while atomic layer deposition of TiO2/graphene limits shuttle diffusion by 82%, cathode cracking accelerates after 350 cycles unless an ether-fluorinated co-solvent is maintained. 4 peer-reviewed DOIs confirmed consensus on reaction kinetics.',
    citations: ['Nature Energy 2024.11', 'doi:10.1038/s41560', 'J. Electrochem. Soc.'],
    concordance: '96.2%',
  };

  const currentSample = isBatterySample ? sampleBattery : sampleFormalVerification;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inquiryText.trim()) {
      onLaunchWorkspace(inquiryText.trim(), 'standard');
    }
  };

  return (
    <div className="relative w-full overflow-hidden text-on-surface bg-surface font-sans selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* Subtle Ambient Radial Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,0.14)_0%,rgba(76,214,251,0.05)_45%,transparent_75%)] blur-3xl" />
        <div className="absolute top-[35%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,180,216,0.09)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute top-[65%] -right-[10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(76,214,251,0.11)_0%,transparent_75%)] blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative w-full px-space-md sm:px-space-lg pt-12 pb-16 lg:pt-20 lg:pb-24 flex flex-col items-center text-center max-w-7xl mx-auto">
          {/* Tag Badge */}
          <div className="inline-flex items-center gap-space-sm px-space-md py-1 rounded-full bg-surface-container-high border border-outline-variant/40 shadow-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-code-sm text-primary tracking-wider uppercase font-medium">
              PROTOCOL V4.1 • DUAL-CONSENSUS KERNEL
            </span>
          </div>

          {/* Logo & Architecture Tag */}
          <div className="mt-space-lg flex items-center justify-center gap-space-sm">
            <img src="/breezy-logo.svg" alt="Breezy Logo" className="w-8 h-8 object-contain" />
            <span className="font-mono text-code-md text-on-surface-variant uppercase tracking-widest">
              Breezy Cognitive Architecture
            </span>
          </div>

          {/* Big Headline */}
          <h1 className="mt-space-md font-headline font-bold text-headline-xl sm:text-[44px] sm:leading-[52px] lg:text-[56px] lg:leading-[64px] text-on-surface max-w-4xl tracking-tight">
            Research that <span className="text-primary">thinks deeper.</span>
          </h1>

          <p className="mt-space-md font-sans text-body-lg text-on-surface-variant max-w-2xl text-balance leading-relaxed">
            Calm, multi-perspective synthesis for complex scientific, technical, and macroeconomic
            questions. Multiple models explore, challenge, and verify — delivering definitive
            consensus without AI theater.
          </p>

          {/* CTAs */}
          <div className="mt-space-xl flex flex-col sm:flex-row items-center gap-space-md w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onLaunchWorkspace(undefined, 'standard')}
              className="w-full sm:w-auto px-space-xl py-3 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shadow-[0_0_20px_rgba(76,214,251,0.25)] flex items-center justify-center gap-space-xs group active:scale-[0.99]"
            >
              <span>Start an Investigation</span>
              <span className="material-symbols-outlined text-headline-sm group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatterySample((prev) => !prev)}
              className="w-full sm:w-auto px-space-lg py-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-headline font-medium text-headline-sm transition-all flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-secondary">science</span>
              <span>
                {isBatterySample ? 'Reset: Formal Verification' : 'Sample: Lithium-Sulfur Batteries'}
              </span>
            </button>
          </div>

          <div className="mt-space-sm font-mono text-code-sm text-on-surface-variant">
            No credit card required • Verifiable model logs • Local Ollama bridge ready
          </div>

          {/* Workspace Mockup / Synthesis Preview Card */}
          <div className="mt-space-xl w-full max-w-5xl rounded-2xl bg-surface-container-low border border-outline-variant/40 shadow-2xl p-space-sm sm:p-space-md relative text-left">
            {/* Window Chrome / Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-sm pb-space-sm bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant/30">
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-error/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary/80" />
                <span className="hidden sm:inline-block ml-space-xs font-mono text-code-sm text-on-surface-variant truncate">
                  run_id: deb_tot_8841a // session: formal-verification
                </span>
              </div>
              <div className="flex items-center gap-space-sm">
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary flex items-center gap-1 border border-tertiary/20">
                  <span className="material-symbols-outlined text-label-sm">verified</span>{' '}
                  {currentSample.concordance} CONCORDANT
                </span>
                <span className="font-mono text-code-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant">
                  3 MODELS VERIFIED
                </span>
              </div>
            </div>

            {/* Active Research Inquiry Banner */}
            <div className="mt-space-sm p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-primary mt-0.5">neurology</span>
                  <div>
                    <span className="font-mono text-code-sm text-primary uppercase font-medium">
                      Active Research Inquiry
                    </span>
                    <p className="font-headline font-semibold text-headline-sm text-on-surface mt-0.5">
                      {currentSample.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs shrink-0 self-end sm:self-auto font-mono text-code-sm text-tertiary">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span>SYNTHESIS COMMITTED</span>
                </div>
              </div>
            </div>

            {/* Pipeline Workflow Stepper */}
            <div className="mt-space-sm grid grid-cols-2 md:grid-cols-4 gap-space-xs">
              <div className="p-space-sm rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-code-sm text-tertiary font-medium">
                    01. DECOMPOSITION
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-label-md">
                    check_circle
                  </span>
                </div>
                <span className="font-headline font-medium text-body-md text-on-surface">
                  3 Engine Primitives
                </span>
                <span className="font-sans text-body-sm text-on-surface-variant">
                  Partitioned into 18 state transitions
                </span>
              </div>

              <div className="p-space-sm rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-code-sm text-tertiary font-medium">
                    02. ADVERSARIAL GAP
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-label-md">
                    check_circle
                  </span>
                </div>
                <span className="font-headline font-medium text-body-md text-on-surface">
                  o3-mini vs Claude 3.7
                </span>
                <span className="font-sans text-body-sm text-on-surface-variant">
                  Identified deadlock vulnerability
                </span>
              </div>

              <div className="p-space-sm rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-code-sm text-tertiary font-medium">
                    03. VERIFICATION
                  </span>
                  <span className="material-symbols-outlined text-tertiary text-label-md">
                    check_circle
                  </span>
                </div>
                <span className="font-headline font-medium text-body-md text-on-surface">
                  Lean 4 AST Proofs
                </span>
                <span className="font-sans text-body-sm text-on-surface-variant">
                  Formal validation via Lean kernel
                </span>
              </div>

              <div className="p-space-sm rounded-xl bg-surface-container-high border border-primary/30 flex flex-col gap-1 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-code-sm text-primary font-medium">
                    04. SYNTHESIS
                  </span>
                  <span className="material-symbols-outlined text-primary text-label-md">bolt</span>
                </div>
                <span className="font-headline font-semibold text-body-md text-primary">
                  Definitive Brief
                </span>
                <span className="font-sans text-body-sm text-on-surface">
                  Zero hallucination consensus
                </span>
              </div>
            </div>

            {/* Canvas Body / Takeaway & Telemetry */}
            <div className="mt-space-sm grid grid-cols-1 lg:grid-cols-3 gap-space-sm">
              {/* Main Takeaway */}
              <div className="lg:col-span-2 p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-label-md uppercase text-secondary tracking-wider font-medium">
                      Executive Synthesis Takeaway
                    </span>
                    <span className="font-mono text-code-sm text-on-surface-variant">
                      Confidence: 0.96 / Calibrated
                    </span>
                  </div>
                  <p className="mt-space-sm font-sans text-body-md text-on-surface leading-relaxed">
                    {currentSample.takeaway}
                  </p>
                </div>
                {/* Inline Citations */}
                <div className="mt-space-md pt-space-sm flex flex-wrap items-center gap-space-xs border-t border-outline-variant/20">
                  <span className="font-mono text-code-sm text-on-surface-variant mr-1">
                    PRIMARY CITATIONS:
                  </span>
                  {currentSample.citations.map((cite) => (
                    <span
                      key={cite}
                      className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary font-mono text-code-sm flex items-center gap-1 border border-outline-variant/30 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-label-sm">verified_user</span>{' '}
                      {cite}
                    </span>
                  ))}
                </div>
              </div>

              {/* Radial Alignment Gauge */}
              <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
                <span className="font-sans text-label-md uppercase text-on-surface tracking-wider font-medium">
                  Consensus Telemetry
                </span>
                <div className="my-space-sm flex items-center justify-center">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container-highest"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="94.8, 100"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-headline font-bold text-headline-md text-on-surface">
                        {currentSample.concordance}
                      </span>
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">
                        Alignment
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 font-mono text-code-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Claude 3.7 Reasoning</span>
                    <span className="text-tertiary">Verified (0.97)</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>o3-mini Deep</span>
                    <span className="text-tertiary">Verified (0.94)</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Ollama / DeepSeek-R1</span>
                    <span className="text-secondary">Concurred (0.93)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Philosophy Anchor */}
        <section className="w-full py-space-xl px-space-md sm:px-space-lg bg-surface-container-lowest border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-baseline justify-between gap-space-lg">
            <div className="max-w-md">
              <span className="font-mono text-code-sm text-primary uppercase tracking-widest font-semibold">
                Our Engineering Creed
              </span>
              <h2 className="mt-space-xs font-headline font-bold text-headline-lg text-on-surface">
                Complicated inside.
                <br />
                Calm outside.
              </h2>
            </div>
            <p className="font-sans text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
              We reject generative theater. We do not generate text just to keep a streaming cursor
              spinning. Breezy coordinates disparate frontier models and formal verification checkers
              behind an impenetrable, serene research canvas. The noise is resolved in isolation; only
              substantiated truth reaches your desk.
            </p>
          </div>
        </section>

        {/* Visual Storytelling Grid */}
        <section className="w-full py-space-xl px-space-md sm:px-space-lg max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg items-center">
            <div className="flex flex-col gap-space-md">
              <span className="font-mono text-code-sm text-secondary uppercase tracking-widest font-medium">
                Cognitive Focus Environment
              </span>
              <h3 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight">
                Crafted for analysts who cannot afford illusions.
              </h3>
              <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
                From sovereign debt stress-testing to solid-state electrolyte degradation pathways,
                Breezy structures arguments into formal graphs where every claim is verified against
                peer-reviewed literature or direct observational data.
              </p>
              <div className="grid grid-cols-2 gap-space-md pt-space-xs">
                <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="font-headline font-bold text-headline-lg text-primary">0%</span>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-1">
                    Simulated confidence intervals
                  </p>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container border border-outline-variant/30">
                  <span className="font-headline font-bold text-headline-lg text-tertiary">
                    &lt; 1.2s
                  </span>
                  <p className="font-sans text-body-sm text-on-surface-variant mt-1">
                    DOI source resolution speed
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal Graphic Card */}
            <div className="relative w-full h-[340px] sm:h-[380px] rounded-2xl overflow-hidden shadow-xl bg-surface-container-high border border-outline-variant/40 p-space-md flex flex-col justify-between font-mono text-code-sm">
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
                <div className="flex items-center gap-space-xs text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Dual-Model Consensus Engine</span>
                </div>
                <span className="text-on-surface-variant">AST Node Graph V4</span>
              </div>
              <div className="flex-1 py-space-sm overflow-hidden text-outline-variant space-y-1 select-none">
                <div className="text-secondary font-medium">
                  &gt; disassembling theorem assertions across 3 isolates...
                </div>
                <div className="text-on-surface-variant">
                  [node-1] extracting boundary predicates (18 sub-hypotheses)
                </div>
                <div className="text-tertiary">
                  [node-2] arXiv DOI verified: doi:10.1038/s41560 (Nature Energy)
                </div>
                <div className="text-error">
                  [node-3] contrarian challenger flagged temperature baseline bias
                </div>
                <div className="text-primary">
                  [synthesis] reconciled dialectic: 94.8% concordant resolution
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between text-on-surface">
                <span className="text-tertiary flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-label-md">verified</span> Zero Drift
                  Confirmed
                </span>
                <span className="text-outline">Runtime: 1,420ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Four-Pillar Methodology */}
        <section className="w-full py-space-xl px-space-md sm:px-space-lg bg-surface-container-lowest border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <span className="font-mono text-code-sm text-primary uppercase tracking-widest font-semibold">
                The Architecture
              </span>
              <h2 className="mt-space-xs font-headline font-bold text-headline-xl text-on-surface">
                The Four-Pillar Methodology
              </h2>
              <p className="mt-space-sm font-sans text-body-md text-on-surface-variant">
                Conventional LLMs generate plausible completions. Breezy executes an asynchronous,
                verified discovery and critique cycle.
              </p>
            </div>

            <div className="mt-space-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Pillar 1 */}
              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between shadow-md hover:-translate-y-1 transition-transform">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-space-md border border-primary/20">
                    <span className="material-symbols-outlined text-headline-md">hub</span>
                  </div>
                  <span className="font-mono text-code-sm text-secondary uppercase font-medium">
                    Pillar 01
                  </span>
                  <h3 className="font-headline font-semibold text-headline-md text-on-surface mt-1">
                    Multi-Angle Exploration
                  </h3>
                  <p className="mt-space-sm font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    Independent reasoning engines decompose hypotheses without shared groupthink. Models
                    generate orthogonal hypotheses before any consensus attempt is scheduled.
                  </p>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between font-mono text-code-sm text-on-surface-variant">
                  <span>Isolation Index</span>
                  <span className="text-tertiary">100% Hermetic</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between shadow-md hover:-translate-y-1 transition-transform">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary mb-space-md border border-secondary/20">
                    <span className="material-symbols-outlined text-headline-md">gavel</span>
                  </div>
                  <span className="font-mono text-code-sm text-secondary uppercase font-medium">
                    Pillar 02
                  </span>
                  <h3 className="font-headline font-semibold text-headline-md text-on-surface mt-1">
                    Adversarial Contradiction
                  </h3>
                  <p className="mt-space-sm font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    Contrarian models actively probe premises, pinpointing unstated assumptions,
                    cherry-picked baselines, and logic regressions before output formulation.
                  </p>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between font-mono text-code-sm text-on-surface-variant">
                  <span>Challenge Rounds</span>
                  <span className="text-primary">2 - 5 Loops</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between shadow-md hover:-translate-y-1 transition-transform">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary mb-space-md border border-tertiary/20">
                    <span className="material-symbols-outlined text-headline-md">verified</span>
                  </div>
                  <span className="font-mono text-code-sm text-secondary uppercase font-medium">
                    Pillar 03
                  </span>
                  <h3 className="font-headline font-semibold text-headline-md text-on-surface mt-1">
                    Ground-Truth Verification
                  </h3>
                  <p className="mt-space-sm font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    Factual assertions are checked against direct DOI paper alignment, real-time
                    academic indexing, or formal proof kernels. Unverified assertions are purged.
                  </p>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between font-mono text-code-sm text-on-surface-variant">
                  <span>Verification Standard</span>
                  <span className="text-tertiary">Cryptographic DOI</span>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between shadow-md hover:-translate-y-1 transition-transform">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-space-md border border-primary/20">
                    <span className="material-symbols-outlined text-headline-md">auto_stories</span>
                  </div>
                  <span className="font-mono text-code-sm text-secondary uppercase font-medium">
                    Pillar 04
                  </span>
                  <h3 className="font-headline font-semibold text-headline-md text-on-surface mt-1">
                    Calm Synthesis
                  </h3>
                  <p className="mt-space-sm font-sans text-body-sm text-on-surface-variant leading-relaxed">
                    Answer-first resolution of divergent viewpoints. You receive clean, dense executive
                    briefs, annotated citation trails, and a clear breakdown of remaining uncertainties.
                  </p>
                </div>
                <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between font-mono text-code-sm text-on-surface-variant">
                  <span>Cognitive Output</span>
                  <span className="text-primary">Calm Document</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="w-full py-space-xl px-space-md sm:px-space-lg max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div>
              <span className="font-mono text-code-sm text-primary uppercase tracking-widest font-semibold">
                Architectural Audit
              </span>
              <h2 className="mt-space-xs font-headline font-bold text-headline-xl text-on-surface">
                Breezy vs Conventional AI Chat
              </h2>
            </div>
            <p className="font-sans text-body-sm text-on-surface-variant max-w-md">
              Chat interfaces prioritize immediate fluency over empirical truth. Breezy is designed
              around deterministic verification pipelines.
            </p>
          </div>

          <div className="w-full rounded-2xl bg-surface-container border border-outline-variant/30 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant/30">
                    <th className="p-space-md font-sans text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                      Dimension
                    </th>
                    <th className="p-space-md font-sans text-label-md text-on-surface-variant uppercase tracking-wider font-semibold w-1/3">
                      Conventional AI Chatbots
                    </th>
                    <th className="p-space-md font-sans text-label-md text-primary uppercase tracking-wider font-semibold w-1/3 bg-surface-container-highest">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span>Breezy Cognitive Workspace</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="font-sans text-body-sm divide-y divide-outline-variant/20">
                  <tr className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="p-space-md font-headline font-medium text-on-surface">
                      Verification Topology
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      Single model monologue; plausible hallucinations presented with equal tone.
                    </td>
                    <td className="p-space-md text-on-surface bg-surface-container-highest font-medium">
                      Multi-provider debate (Anthropic + OpenAI + Local) with cross-model contradiction audits.
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="p-space-md font-headline font-medium text-on-surface">
                      Source Attribution
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      Unchecked search engine snippets; synthetic URL hallucination risk.
                    </td>
                    <td className="p-space-md text-on-surface bg-surface-container-highest font-medium">
                      Deterministic DOI resolution, full PDF arXiv extraction, cryptographic citation mapping.
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="p-space-md font-headline font-medium text-on-surface">
                      Divergence Resolution
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      Syndromic consensus; smooths over contradictions to avoid confusing user.
                    </td>
                    <td className="p-space-md text-on-surface bg-surface-container-highest font-medium">
                      Preserves authentic scientific disagreement; explicitly maps edge cases and conflicting baselines.
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="p-space-md font-headline font-medium text-on-surface">
                      Data Retention Policy
                    </td>
                    <td className="p-space-md text-on-surface-variant">
                      Prompts often used for post-training updates unless negotiated via custom enterprise contracts.
                    </td>
                    <td className="p-space-md text-on-surface bg-surface-container-highest font-medium">
                      Zero Data Retention by default; private key vault on client machine; local Ollama connectivity.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Enterprise & Research Security */}
        <section className="w-full py-space-xl px-space-md sm:px-space-lg bg-surface-container-lowest border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
              <span className="font-mono text-code-sm text-primary uppercase tracking-widest font-semibold">
                Enterprise Cryptographic Hygiene
              </span>
              <h2 className="mt-space-xs font-headline font-bold text-headline-xl text-on-surface">
                Zero Retention. Zero Training. Complete Provenance.
              </h2>
              <p className="mt-space-sm font-sans text-body-md text-on-surface-variant">
                Your critical hypotheses, proprietary drug targets, and competitive intelligence never
                leave your ephemeral execution context.
              </p>
            </div>
            <div className="mt-space-xl grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm shadow-md">
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-headline-sm">lock</span>
                </div>
                <h3 className="font-headline font-semibold text-headline-md text-on-surface">
                  Client-Side Key Custody
                </h3>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Your OpenAI, Anthropic, or DeepSeek API credentials remain in local OS keystore
                  enclaves. Requests are dispatched directly or via end-to-end encrypted envelopes.
                </p>
                <div className="mt-auto pt-space-xs font-mono text-code-sm text-tertiary">
                  AES-256-GCM Ephemeral Vault
                </div>
              </div>

              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm shadow-md">
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary border border-secondary/20">
                  <span className="material-symbols-outlined text-headline-sm">terminal</span>
                </div>
                <h3 className="font-headline font-semibold text-headline-md text-on-surface">
                  Local Ollama Bridge
                </h3>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Air-gapped deployment option allows entire runs to route through on-premise hardware
                  using Ollama at <code className="text-primary font-mono text-code-sm">127.0.0.1:11434</code>{' '}
                  without external packets.
                </p>
                <div className="mt-auto pt-space-xs font-mono text-code-sm text-primary">
                  Full Air-Gap Compatibility
                </div>
              </div>

              <div className="p-space-lg rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-sm shadow-md">
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary border border-tertiary/20">
                  <span className="material-symbols-outlined text-headline-sm">account_tree</span>
                </div>
                <h3 className="font-headline font-semibold text-headline-md text-on-surface">
                  Cryptographic Provenance
                </h3>
                <p className="font-sans text-body-sm text-on-surface-variant leading-relaxed">
                  Every executive synthesis yields a verifiable signature linking output sentences to
                  exact byte ranges in retrieved PDF and DOI artifacts.
                </p>
                <div className="mt-auto pt-space-xs font-mono text-code-sm text-tertiary">
                  Deterministic SHA-256 Trails
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="relative w-full py-space-xl px-space-md sm:px-space-lg my-space-lg max-w-4xl mx-auto text-center">
          <div className="relative rounded-3xl bg-surface-container border border-outline-variant/30 p-space-lg sm:p-space-xl shadow-2xl flex flex-col items-center">
            <span className="font-mono text-code-sm text-primary uppercase tracking-widest font-semibold">
              Begin Your Research
            </span>
            <h2 className="mt-space-sm font-headline font-bold text-headline-xl text-on-surface tracking-tight">
              Bring intellectual rigor to your inquiries.
            </h2>
            <p className="mt-space-sm font-sans text-body-md text-on-surface-variant max-w-xl">
              Deploy multiple frontier models into an orchestrated dialectic that discovers what is
              actually true.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-space-xl w-full max-w-2xl flex flex-col sm:flex-row items-center gap-space-xs p-1.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-inner"
            >
              <div className="flex items-center gap-space-sm px-space-md w-full">
                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                <input
                  type="text"
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="e.g. Compare solid electrolyte stability under lithium dendrite propagation"
                  className="w-full py-2 bg-transparent text-on-surface placeholder:text-on-surface-variant/60 font-sans text-body-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-space-lg py-2.5 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shrink-0 shadow-md flex items-center justify-center gap-1 active:scale-95"
              >
                <span>Investigate</span>
                <span className="material-symbols-outlined text-headline-sm">arrow_forward</span>
              </button>
            </form>

            <div className="mt-space-md flex flex-wrap items-center justify-center gap-space-lg font-mono text-code-sm text-on-surface-variant">
              {onOpenDocs && (
                <button
                  type="button"
                  onClick={onOpenDocs}
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-label-sm">menu_book</span>
                  <span>Read Documentation &amp; Architecture</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenModels}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-label-sm">hub</span>
                <span>Configure Models &amp; Providers</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
