import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Check,
  Cpu,
  ShieldAlert,
  Scale,
  KeyRound,
  Search,
  Globe,
  Flame,
  Zap,
  HeartHandshake,
  Swords,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  HelpCircle,
  Database,
  UserCheck,
  Sparkles,
  RotateCcw,
  Save,
} from 'lucide-react';
import { ProviderKeyConfig, DebateTone, SearchEngineProvider, AgentRole } from '../types';

export interface CustomPersona {
  name: string;
  coreIdeology: string;
  tone: string;
  knowledgeFocus: string;
}

export type CustomPersonasMap = Record<AgentRole, CustomPersona>;

export const DEFAULT_PERSONAS: CustomPersonasMap = {
  architect: {
    name: 'The First-Principles Architect',
    coreIdeology: 'Constructive Synthesis, Structural Scalability & First-Principles Engineering',
    tone: 'Analytical, Systematic, Precision-Focused',
    knowledgeFocus: 'System Architecture, Algorithmic Foundations & Scalable Infrastructure',
  },
  skeptic: {
    name: 'The Adversarial Red-Teamer',
    coreIdeology: 'Zero-Trust Verification, Vulnerability Hunting & Edge-Case Failure Modes',
    tone: 'Incisive, Uncompromising, Sharp',
    knowledgeFocus: 'Security Exploits, Fault Tolerances & Boundary Conditions',
  },
  synthesizer: {
    name: 'The Dialectic Harmonizer',
    coreIdeology: 'Objective Categorization, Argument Mapping & Conflict Resolution',
    tone: 'Balanced, Neutral, Structured',
    knowledgeFocus: 'Logic Mapping, Cross-Domain Synthesis & Nuance Extraction',
  },
  arbiter: {
    name: 'The Supreme Strategic Adjudicator',
    coreIdeology: 'Pragmatic Decisiveness, Final Trade-Off Optimization & Executive Synthesis',
    tone: 'Authoritative, Nuanced, Decisive',
    knowledgeFocus: 'Strategic Execution, Empirical Risk Trade-offs & Unifying Consensus',
  },
  verifier: {
    name: 'The Formal Logic Inspector',
    coreIdeology: 'Mathematical Correctness, Consistency Auditing & Soundness Verification',
    tone: 'Rigorous, Methodical, Exact',
    knowledgeFocus: 'Formal Methods, Logical Fallacy Detection & Verification Audits',
  },
  solo: {
    name: 'The Direct Specialist',
    coreIdeology: 'Direct Execution, Focused Problem Solving & Rapid Analysis',
    tone: 'Direct, Crisp, Technical',
    knowledgeFocus: 'Domain Expertise, Focused Diagnostics & Implementation',
  },
};

interface CouncilConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: 'trio' | 'quad' | 'duel' | 'solo';
  onSelectProtocol: (p: 'trio' | 'quad' | 'duel' | 'solo') => void;
  tone?: DebateTone;
  onSelectTone?: (t: DebateTone) => void;
  searchEngine?: SearchEngineProvider;
  onSelectSearchEngine?: (engine: SearchEngineProvider) => void;
  seats: {
    architect: { provider: string; model: string };
    skeptic: { provider: string; model: string };
    arbiter: { provider: string; model: string };
  };
  onUpdateSeat: (seatName: 'architect' | 'skeptic' | 'arbiter', provider: string, model: string) => void;
  keys: ProviderKeyConfig;
  onOpenVault?: () => void;
  enableSearchGrounding?: boolean;
  onToggleSearchGrounding?: (enabled: boolean) => void;
}

const SEARCH_ENGINES: {
  id: SearchEngineProvider;
  name: string;
  tagline: string;
  badge: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  requiresKey: boolean;
  keyProp?: keyof ProviderKeyConfig;
  description: string;
  groundingDetail: string;
  keyDocsUrl?: string;
}[] = [
  {
    id: 'google',
    name: 'Google Native Search Grounding',
    tagline: 'Google real-time web search tool integrated directly into model reasoning',
    badge: 'Zero-Config • Built-in',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-300',
    requiresKey: false,
    description: 'Direct live Google web search grounding. Pulls up-to-the-minute web results, documentation, and news with verified source URLs without requiring third-party search accounts.',
    groundingDetail: 'Employs Google Search Grounding with real-time web citation verification across active turns.',
  },
  {
    id: 'tavily',
    name: 'Tavily AI Search',
    tagline: 'Search engine purpose-built for LLMs and autonomous research agents',
    badge: 'AI-Optimized • High Precision',
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-300',
    requiresKey: true,
    keyProp: 'tavily',
    keyDocsUrl: 'https://tavily.com',
    description: 'Tavily extracts clean markdown and high-signal factual content from the web while discarding ads and boilerplate, providing agents with dense context for critique and synthesis.',
    groundingDetail: 'Advanced semantic search with direct answer synthesis and ranked source snippets.',
  },
  {
    id: 'serper',
    name: 'Serper.dev (Google SERP API)',
    tagline: 'High-speed Google search index with structured knowledge graphs',
    badge: 'Structured SERP • Fast',
    badgeBg: 'bg-indigo-950/70',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-300',
    requiresKey: true,
    keyProp: 'serper',
    keyDocsUrl: 'https://serper.dev',
    description: 'Direct programmatic access to Google search rankings, knowledge panels, organic results, and instant answer boxes.',
    groundingDetail: 'Extracts official knowledge graph panels, organic web ranks, and featured answer snippets.',
  },
  {
    id: 'brave',
    name: 'Brave Search API',
    tagline: 'Independent, privacy-first web index covering billions of pages',
    badge: 'Independent Index • Private',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
    requiresKey: true,
    keyProp: 'brave',
    keyDocsUrl: 'https://brave.com/search/api/',
    description: 'A 100% independent web index built from scratch, free of Big Tech search bias and tracking. Delivers diverse search perspectives for dialectic debate.',
    groundingDetail: 'Independent web index results with privacy preservation and alternative viewpoints.',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo Keyless Search',
    tagline: 'Keyless full web scraper & deep research index',
    badge: 'Zero-Config • Unlimited',
    badgeBg: 'bg-orange-950/70',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-300',
    requiresKey: false,
    description: 'Full keyless web search index and deep research crawler. Dynamically crawls organic SERPs and bypasses limits. Perfect as an unlimited, keyless research engine when exporting or using Groq.',
    groundingDetail: 'Live high-accuracy organic web SERP crawling with direct redirect decoding.',
  },
];

const TONE_LEVELS: {
  id: DebateTone;
  index: number;
  label: string;
  badge: string;
  tagline: string;
  description: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  sliderColor: string;
  architectBehavior: string;
  skepticBehavior: string;
  arbiterBehavior: string;
}[] = [
  {
    id: 'diplomatic',
    index: 0,
    label: 'Diplomatic',
    badge: 'Level 1 • Collegiate & Nuanced',
    tagline: 'Constructive, respectful, and cordial critique',
    description: 'Council members engage with polite collegiality. The Skeptic offers gentle stress-testing, subtle nuance, and constructive suggestions without harsh confrontation.',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-300',
    sliderColor: '#10b981',
    architectBehavior: 'Patient, foundational exposition explaining core rationale',
    skepticBehavior: 'Polite suggestions, constructive boundary checks & nuanced caveats',
    arbiterBehavior: 'Harmonious reconciliation with measured diplomatic phrasing',
  },
  {
    id: 'balanced',
    index: 1,
    label: 'Balanced',
    badge: 'Level 2 • Standard Dialectic',
    tagline: 'Objective, structured, and candid analysis',
    description: 'Default council dynamic. Structured thesis and antithesis with unvarnished exposure of failure modes, architectural trade-offs, and practical constraints.',
    badgeBg: 'bg-sky-950/70',
    badgeBorder: 'border-sky-500/40',
    badgeText: 'text-sky-300',
    sliderColor: '#0ea5e9',
    architectBehavior: 'Comprehensive first-principles blueprint & mechanism design',
    skepticBehavior: 'Candid flaw detection, red-teaming & fatal edge-case exposure',
    arbiterBehavior: 'Impartial adjudication with candid reality-check limitations',
  },
  {
    id: 'rigorous',
    index: 2,
    label: 'Rigorous',
    badge: 'Level 3 • Zero-Tolerance Audit',
    tagline: 'Strict, uncompromising, and exacting scrutiny',
    description: 'High-standard engineering review. Demands empirical justification, rejects hand-wavy assumptions, and aggressively tests extreme scale and security boundaries.',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-300',
    sliderColor: '#f59e0b',
    architectBehavior: 'Mathematically defensible, exhaustively detailed baseline',
    skepticBehavior: 'Surgical deconstruction, strict constraint audits & debt exposure',
    arbiterBehavior: 'Demands complete mitigation of all verified vulnerabilities',
  },
  {
    id: 'aggressive',
    index: 3,
    label: 'Aggressive / Direct',
    badge: 'Level 4 • Ruthless Red-Team',
    tagline: 'Fiercely adversarial, razor-sharp, zero sugarcoating',
    description: 'Maximum adversarial pressure. The Skeptic aggressively attacks flawed premises with biting clarity, exposing why the solution will collapse or is useless in practice.',
    badgeBg: 'bg-rose-950/70',
    badgeBorder: 'border-rose-500/40',
    badgeText: 'text-rose-300',
    sliderColor: '#f43f5e',
    architectBehavior: 'Bold, highly opinionated, conviction-driven architecture',
    skepticBehavior: 'Aggressive red-teaming, merciless flaw exposure & scathing critique',
    arbiterBehavior: 'Decisive execution, ruthlessly discarding weak or flawed logic',
  },
];

export const CouncilConfigModal: React.FC<CouncilConfigModalProps> = ({
  isOpen,
  onClose,
  protocol,
  onSelectProtocol,
  tone = 'balanced',
  onSelectTone,
  searchEngine = 'google',
  onSelectSearchEngine,
  seats,
  onUpdateSeat,
  keys,
  onOpenVault,
  enableSearchGrounding = true,
  onToggleSearchGrounding,
}) => {
  const [activeTab, setActiveTab] = useState<'coherence' | 'personas'>('coherence');
  const [personas, setPersonas] = useState<CustomPersonasMap>(() => {
    try {
      const saved = localStorage.getItem('synthexis_custom_personas');
      if (saved) {
        return { ...DEFAULT_PERSONAS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PERSONAS;
  });
  const [selectedPersonaRole, setSelectedPersonaRole] = useState<AgentRole>('architect');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('synthexis_custom_personas', JSON.stringify(personas));
    } catch {
      // ignore
    }
  }, [personas]);

  const handleUpdatePersonaField = (field: keyof CustomPersona, val: string) => {
    setPersonas((prev) => ({
      ...prev,
      [selectedPersonaRole]: {
        ...prev[selectedPersonaRole],
        [field]: val,
      },
    }));
  };

  const handleResetPersonas = () => {
    setPersonas(DEFAULT_PERSONAS);
    localStorage.removeItem('synthexis_custom_personas');
  };

  const handleSavePersonas = () => {
    try {
      localStorage.setItem('synthexis_custom_personas', JSON.stringify(personas));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const currentToneConfig = TONE_LEVELS.find((t) => t.id === tone) || TONE_LEVELS[1];
  const currentToneIndex = currentToneConfig.index;

  const currentEngineConfig =
    SEARCH_ENGINES.find((e) => e.id === searchEngine) || SEARCH_ENGINES[0];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const selected = TONE_LEVELS.find((t) => t.index === val) || TONE_LEVELS[1];
    if (onSelectTone) {
      onSelectTone(selected.id);
    }
  };

  const hasGroq = Boolean(keys.groq?.trim());
  const hasSamba = Boolean(keys.sambanova?.trim());
  const hasGemini = Boolean(keys.gemini?.trim());
  const hasTavily = Boolean(keys.tavily?.trim());
  const hasSerper = Boolean(keys.serper?.trim());
  const hasBrave = Boolean(keys.brave?.trim());

  const currentEngineHasKey =
    !currentEngineConfig.requiresKey ||
    (currentEngineConfig.keyProp && Boolean(keys[currentEngineConfig.keyProp]?.trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#262b3c] bg-[#12141d] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8c92a4] transition-colors hover:bg-[#1f2333] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center justify-between border-b border-[#23293a] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Council Configuration</h2>
              <p className="text-xs text-[#8c92a4]">
                Manage debate protocols, model bindings, and custom agent personas
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-lg border border-[#232a3c] bg-[#10131c] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('coherence')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'coherence'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Coherence</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('personas')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'personas'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Personas</span>
            </button>
          </div>
        </div>

        {/* TAB 1: COHERENCE & PROTOCOLS */}
        {activeTab === 'coherence' && (
          <>
        {/* Protocol Selector */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8b93aa]">
              Council Protocol
            </label>
            <span className="text-[11px] text-cyan-400 font-mono">
              3 Distinct Roles Core
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSelectProtocol('trio')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                protocol === 'trio'
                  ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-md'
                  : 'border-[#232736] bg-[#161823] text-[#8e95ab] hover:border-[#353b52]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-white">Trio Dialectic</span>
                {protocol === 'trio' && <Check className="h-3.5 w-3.5 text-indigo-400" />}
              </div>
              <span className="mt-1 text-[10px] text-[#8c92a4]">
                Architect → Skeptic → Arbiter
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectProtocol('quad')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                protocol === 'quad'
                  ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-md'
                  : 'border-[#232736] bg-[#161823] text-[#8e95ab] hover:border-[#353b52]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-white">Quad Council</span>
                {protocol === 'quad' && <Check className="h-3.5 w-3.5 text-indigo-400" />}
              </div>
              <span className="mt-1 text-[10px] text-[#8c92a4]">
                Adds Verifier before Arbiter
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectProtocol('duel')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                protocol === 'duel'
                  ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-md'
                  : 'border-[#232736] bg-[#161823] text-[#8e95ab] hover:border-[#353b52]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-white">Dialectic Duel</span>
                {protocol === 'duel' && <Check className="h-3.5 w-3.5 text-indigo-400" />}
              </div>
              <span className="mt-1 text-[10px] text-[#8c92a4]">
                Active Rebuttal & Pushback
              </span>
            </button>
          </div>
        </div>

        {/* TONE SETTING SECTION */}
        <div className="mb-6 rounded-xl border border-[#252b3d] bg-[#141723] p-4 shadow-sm transition-all">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Debate Tone & Dialectic Intensity
              </label>
            </div>
            <span
              className={`rounded border px-2 py-0.5 text-[10.5px] font-mono font-medium ${currentToneConfig.badgeBg} ${currentToneConfig.badgeBorder} ${currentToneConfig.badgeText}`}
            >
              {currentToneConfig.badge}
            </span>
          </div>

          <p className="text-[11.5px] text-slate-400 leading-relaxed mb-4">
            Calibrate how aggressively The Skeptic challenges The Architect, ranging from collegial diplomacy to hyper-direct red-teaming.
          </p>

          {/* Interactive Range Slider */}
          <div className="px-1.5 mb-5">
            <div className="relative mb-2">
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={currentToneIndex}
                onChange={handleSliderChange}
                aria-label="Debate tone intensity slider"
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-emerald-500 via-sky-500 via-amber-500 to-rose-500 focus:outline-none accent-white shadow-inner"
              />
            </div>

            {/* Range Markers / Labels */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              {TONE_LEVELS.map((t) => {
                const isActive = t.id === tone;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTone && onSelectTone(t.id)}
                    className={`transition-colors font-medium ${
                      isActive
                        ? `${t.badgeText} font-bold scale-105`
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone Behavior Card */}
          <div className="rounded-lg border border-[#202536] bg-[#0d1018] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {tone === 'diplomatic' && <HeartHandshake className="h-4 w-4 text-emerald-400" />}
                {tone === 'balanced' && <Scale className="h-4 w-4 text-sky-400" />}
                {tone === 'rigorous' && <Zap className="h-4 w-4 text-amber-400" />}
                {tone === 'aggressive' && <Flame className="h-4 w-4 text-rose-400" />}
                <span className={`text-xs font-semibold ${currentToneConfig.badgeText}`}>
                  {currentToneConfig.tagline}
                </span>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-300 leading-normal mb-3">
              {currentToneConfig.description}
            </p>

            {/* Role Behavior Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#1a1f2e] pt-2.5 text-[10.5px]">
              <div className="rounded bg-[#121520] border border-sky-950/40 p-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-sky-400 block mb-0.5">Architect</span>
                <p className="text-slate-300 leading-tight">{currentToneConfig.architectBehavior}</p>
              </div>
              <div className="rounded bg-[#151114] border border-rose-950/40 p-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-rose-400 block mb-0.5">Skeptic</span>
                <p className="text-rose-200/90 leading-tight">{currentToneConfig.skepticBehavior}</p>
              </div>
              <div className="rounded bg-[#141310] border border-amber-950/40 p-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400 block mb-0.5">Arbiter</span>
                <p className="text-amber-200/90 leading-tight">{currentToneConfig.arbiterBehavior}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roles and Seats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8b93aa]">
              Role Model Assignments
            </label>
            {onOpenVault && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVault();
                }}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
              >
                <KeyRound className="h-3 w-3" />
                <span>Configure BYOK Keys</span>
              </button>
            )}
          </div>

          {/* ROLE 1: The Architect */}
          <div className="rounded-xl border border-[#232838] bg-[#151824] p-3.5 transition-all hover:border-[#31384f]">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Cpu className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Role 1: The Architect</span>
                  <span className="ml-2 rounded bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.2 text-[10px] font-medium text-blue-300">
                    Generating Initial Solution
                  </span>
                </div>
              </div>
            </div>
            <p className="mb-2 text-[11px] text-[#8c92a4]">
              Responsible for generating the initial, comprehensive solution and first-principles baseline.
            </p>
            <select
              value={`${seats.architect.provider}:::${seats.architect.model}`}
              onChange={(e) => {
                const [p, m] = e.target.value.split(':::');
                onUpdateSeat('architect', p, m);
              }}
              className="w-full rounded-lg border border-[#2c3245] bg-[#1c2030] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="gemini:::gemini-2.5-flash">
                Google Gemini: gemini-2.5-flash (Recommended • High Throughput & Reasoning)
              </option>
              <option value="gemini:::gemini-2.5-pro">
                Google Gemini: gemini-2.5-pro (Deep First-Principles Architecture)
              </option>
              <option value="gemini:::gemini-2.5-flash-lite">
                Google Gemini: gemini-2.5-flash-lite (Ultra-Low Latency)
              </option>
              <option value="gemini:::gemini-3.8-flash">
                Google Gemini: gemini-3.8-flash (Experimental High Demand)
              </option>
              <option value="gemini:::gemini-flash-latest">
                Google Gemini: gemini-flash-latest (Fast Consensus)
              </option>
              <option value="groq:::llama-3.3-70b-versatile" disabled={!hasGroq}>
                Groq: Llama 3.3 70B {!hasGroq ? '(Requires Groq BYOK key)' : '(Ultra-fast 300+ tok/s)'}
              </option>
              <option value="sambanova:::Meta-Llama-3.3-70B-Instruct" disabled={!hasSamba}>
                SambaNova: Llama 3.3 70B {!hasSamba ? '(Requires SambaNova key)' : '(SN40L RDU)'}
              </option>
              <option value="sambanova:::Qwen2.5-72B-Instruct" disabled={!hasSamba}>
                SambaNova: Qwen 2.5 72B {!hasSamba ? '(Requires SambaNova key)' : '(SN40L RDU)'}
              </option>
            </select>
          </div>

          {/* ROLE 2: The Skeptic */}
          <div className="rounded-xl border border-[#232838] bg-[#151824] p-3.5 transition-all hover:border-[#31384f]">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Role 2: The Skeptic</span>
                  <span className="ml-2 rounded bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.2 text-[10px] font-medium text-rose-300">
                    Identifying Flaws & Edge Cases
                  </span>
                </div>
              </div>
            </div>
            <p className="mb-2 text-[11px] text-[#8c92a4]">
              Tasked with identifying flaws, edge cases, vulnerabilities, race conditions, and unstated assumptions in the initial solution.
            </p>
            <select
              value={`${seats.skeptic.provider}:::${seats.skeptic.model}`}
              onChange={(e) => {
                const [p, m] = e.target.value.split(':::');
                onUpdateSeat('skeptic', p, m);
              }}
              className="w-full rounded-lg border border-[#2c3245] bg-[#1c2030] px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="gemini:::gemini-2.5-flash">
                Google Gemini: gemini-2.5-flash (Recommended • Edge-Case Hunter)
              </option>
              <option value="gemini:::gemini-2.5-pro">
                Google Gemini: gemini-2.5-pro (Deep Vulnerability & Red-Team Analysis)
              </option>
              <option value="gemini:::gemini-2.5-flash-lite">
                Google Gemini: gemini-2.5-flash-lite (Quick Adversarial Critique)
              </option>
              <option value="gemini:::gemini-3.8-flash">
                Google Gemini: gemini-3.8-flash (Experimental High Demand)
              </option>
              <option value="gemini:::gemini-flash-latest">
                Google Gemini: gemini-flash-latest (Fast Adversarial Red-Team)
              </option>
              <option value="groq:::llama-3.3-70b-versatile" disabled={!hasGroq}>
                Groq: Llama 3.3 70B {!hasGroq ? '(Requires Groq BYOK key)' : '(Ultra-fast 300+ tok/s)'}
              </option>
              <option value="sambanova:::Qwen2.5-72B-Instruct" disabled={!hasSamba}>
                SambaNova: Qwen 2.5 72B {!hasSamba ? '(Requires SambaNova key)' : '(SN40L RDU)'}
              </option>
              <option value="sambanova:::Meta-Llama-3.3-70B-Instruct" disabled={!hasSamba}>
                SambaNova: Llama 3.3 70B {!hasSamba ? '(Requires SambaNova key)' : '(SN40L RDU)'}
              </option>
            </select>
          </div>

          {/* ROLE 3: The Arbiter */}
          <div className="rounded-xl border border-[#232838] bg-[#151824] p-3.5 transition-all hover:border-[#31384f]">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Scale className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Role 3: The Arbiter</span>
                  <span className="ml-2 rounded bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.2 text-[10px] font-medium text-purple-300">
                    Synthesizing Final Output
                  </span>
                </div>
              </div>
            </div>
            <p className="mb-2 text-[11px] text-[#8c92a4]">
              Responsible for synthesizing the final output by resolving tensions and hardening the solution against identified edge cases.
            </p>
            <select
              value={`${seats.arbiter.provider}:::${seats.arbiter.model}`}
              onChange={(e) => {
                const [p, m] = e.target.value.split(':::');
                onUpdateSeat('arbiter', p, m);
              }}
              className="w-full rounded-lg border border-[#2c3245] bg-[#1c2030] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="gemini:::gemini-2.5-flash">
                Google Gemini: gemini-2.5-flash (Recommended • Balanced Impartial Synthesis)
              </option>
              <option value="gemini:::gemini-2.5-pro">
                Google Gemini: gemini-2.5-pro (Comprehensive Master Synthesis)
              </option>
              <option value="gemini:::gemini-2.5-flash-lite">
                Google Gemini: gemini-2.5-flash-lite (Concise Adjudication)
              </option>
              <option value="gemini:::gemini-3.8-flash">
                Google Gemini: gemini-3.8-flash (Experimental High Demand)
              </option>
              <option value="gemini:::gemini-flash-latest">
                Google Gemini: gemini-flash-latest (Fast Impartial Synthesizer)
              </option>
              <option value="groq:::llama-3.3-70b-versatile" disabled={!hasGroq}>
                Groq: Llama 3.3 70B {!hasGroq ? '(Requires Groq BYOK key)' : '(Ultra-fast 300+ tok/s)'}
              </option>
              <option value="sambanova:::Meta-Llama-3.3-70B-Instruct" disabled={!hasSamba}>
                SambaNova: Llama 3.3 70B {!hasSamba ? '(Requires SambaNova key)' : '(SN40L RDU)'}
              </option>
            </select>
          </div>
        </div>

        {/* Search Engine Source & Grounding Section */}
        <div className="mt-5 rounded-xl border border-sky-900/40 bg-sky-950/20 p-4 transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Real-Time Search Grounding
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                      enableSearchGrounding
                        ? `${currentEngineConfig.badgeBg} ${currentEngineConfig.badgeBorder} ${currentEngineConfig.badgeText}`
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {enableSearchGrounding ? currentEngineConfig.badge : 'Grounding Inactive'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Grounds council agents with live web search facts, empirical citations, and documentation before synthesizing consensus.
                </p>
              </div>
            </div>

            {onToggleSearchGrounding && (
              <button
                type="button"
                onClick={() => onToggleSearchGrounding(!enableSearchGrounding)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enableSearchGrounding ? 'bg-sky-500' : 'bg-slate-700'
                }`}
                title="Toggle real-time web search grounding"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    enableSearchGrounding ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Search Engine Source Dropdown */}
          <div className="pt-2 border-t border-sky-900/30">
            <label className="block text-[11px] font-semibold text-sky-200 mb-1.5">
              Search Engine Source
            </label>
            <div className="relative">
              <select
                value={searchEngine}
                onChange={(e) => onSelectSearchEngine?.(e.target.value as SearchEngineProvider)}
                disabled={!enableSearchGrounding}
                className="w-full rounded-lg border border-sky-800/50 bg-[#101424] px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {SEARCH_ENGINES.map((eng) => {
                  let keyStatus = '';
                  if (eng.requiresKey && eng.keyProp) {
                    const hasKey = Boolean(keys[eng.keyProp]?.trim());
                    keyStatus = hasKey ? ' (BYOK Key Active)' : ' (Requires Key / Fallback)';
                  } else {
                    keyStatus = ' (Zero-Config)';
                  }
                  return (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}{keyStatus}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Engine Capabilities Card */}
            {enableSearchGrounding && (
              <div className="mt-3 rounded-lg border border-sky-900/30 bg-[#0c101c] p-3 text-[11px] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sky-100">{currentEngineConfig.name}</span>
                    <p className="text-[10.5px] text-slate-300 mt-0.5">{currentEngineConfig.tagline}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-2 py-0.5 text-[9.5px] font-mono ${currentEngineConfig.badgeBg} ${currentEngineConfig.badgeBorder} ${currentEngineConfig.badgeText}`}
                  >
                    {currentEngineConfig.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {currentEngineConfig.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-sky-950/60 text-[10px]">
                  <span className="text-slate-400">
                    <strong className="text-sky-300">Grounding Flow:</strong> {currentEngineConfig.groundingDetail}
                  </span>
                  {currentEngineConfig.requiresKey && (
                    <div className="flex items-center gap-2">
                      {currentEngineHasKey ? (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="h-3 w-3" /> Key Detected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenVault}
                          className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-medium"
                        >
                          <KeyRound className="h-3 w-3" /> Configure Key in Vault
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {/* TAB 2: CUSTOM AGENT PERSONAS */}
        {activeTab === 'personas' && (
          <div className="space-y-4 my-3">
            <div className="flex items-center justify-between bg-[#101422] p-3 rounded-xl border border-[#232a3f]">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-indigo-400" />
                  <span>Custom Agent Ideologies & Focus</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Define distinct persona parameters that influence how agents argue and synthesize
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPersonas}
                  className="flex items-center gap-1 rounded-lg border border-[#283144] bg-[#161a28] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white transition-all"
                  title="Reset custom personas to baseline defaults"
                >
                  <RotateCcw className="h-3 w-3 text-slate-400" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePersonas}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      <span>Save Personas</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Persona Role Selection Tabs */}
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-[#0c0f18] border border-[#1d2334]">
              {(['architect', 'skeptic', 'synthesizer', 'arbiter', 'verifier'] as AgentRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedPersonaRole(r)}
                  className={`rounded-lg py-1.5 text-center text-xs font-medium capitalize transition-all ${
                    selectedPersonaRole === r
                      ? 'bg-[#1e2538] text-amber-400 border border-[#374463] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Persona Editor Form */}
            <div className="rounded-xl border border-[#242b3d] bg-[#111522] p-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Persona Title & Name
                </label>
                <input
                  type="text"
                  value={personas[selectedPersonaRole]?.name || ''}
                  onChange={(e) => handleUpdatePersonaField('name', e.target.value)}
                  className="w-full rounded-lg border border-[#283146] bg-[#0b0e16] px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. The Empirical Systems Architect"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Core Ideology & Stance
                </label>
                <input
                  type="text"
                  value={personas[selectedPersonaRole]?.coreIdeology || ''}
                  onChange={(e) => handleUpdatePersonaField('coreIdeology', e.target.value)}
                  className="w-full rounded-lg border border-[#283146] bg-[#0b0e16] px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. First-Principles, Zero-Trust, Structural Robustness"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Dialectic Tone
                  </label>
                  <input
                    type="text"
                    value={personas[selectedPersonaRole]?.tone || ''}
                    onChange={(e) => handleUpdatePersonaField('tone', e.target.value)}
                    className="w-full rounded-lg border border-[#283146] bg-[#0b0e16] px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Incisive, Surgical, Socratic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Knowledge Focus
                  </label>
                  <input
                    type="text"
                    value={personas[selectedPersonaRole]?.knowledgeFocus || ''}
                    onChange={(e) => handleUpdatePersonaField('knowledgeFocus', e.target.value)}
                    className="w-full rounded-lg border border-[#283146] bg-[#0b0e16] px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Security, Game Theory, Systems Design"
                  />
                </div>
              </div>

              {/* Active Persona Operational Summary Card */}
              <div className="mt-2 rounded-lg border border-[#252f44] bg-[#0b0e17] p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
                  <span>PERSISTENCE: LOCAL STORAGE ACTIVE</span>
                  <span className="text-amber-400 uppercase font-semibold">{selectedPersonaRole}</span>
                </div>
                <p className="text-slate-200 font-medium">
                  {personas[selectedPersonaRole]?.name}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "{personas[selectedPersonaRole]?.coreIdeology}"
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[#8c92a4]">Active BYOK:</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${hasGemini ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-[#181b28] text-[#717890]'}`}>
              Gemini {hasGemini ? 'BYOK' : 'Server'}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${hasGroq ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40' : 'bg-[#181b28] text-[#717890]'}`}>
              Groq {hasGroq ? 'Ready' : 'Off'}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${hasSamba ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40' : 'bg-[#181b28] text-[#717890]'}`}>
              SambaNova {hasSamba ? 'Ready' : 'Off'}
            </span>
            {hasTavily && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                Tavily Ready
              </span>
            )}
            {hasSerper && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                Serper Ready
              </span>
            )}
            {hasBrave && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                Brave Ready
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:bg-indigo-500"
          >
            Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
