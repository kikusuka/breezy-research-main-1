import React, { useMemo, useState } from 'react';

type GuideProduct = 'breezy' | 'synthexis';

interface GuideViewProps {
  product: GuideProduct;
}

const breezySections = [
  {
    id: 'start',
    title: 'Start here',
    text: 'Breezy is your everyday workspace. Chat, research, build, create, and configure the models you actually connect.',
  },
  {
    id: 'models',
    title: 'Choose your model',
    text: 'Open model controls and connect a provider you actually own or have access to. Breezy does not invent a connected model. BYOK, local runtimes, and compatible endpoints can be used where configured.',
  },
  {
    id: 'ide',
    title: 'Use the IDE',
    text: 'Connect GitHub first. Select a real repository, open a file, edit it, preview when supported, and commit deliberately. Breezy should never pretend an edit was written when it was only suggested.',
  },
  {
    id: 'custom',
    title: 'Customize it',
    text: 'Use a custom model ID when your provider exposes a model that is not in the built-in catalog. For local or self-hosted inference, use Ollama or an OpenAI-compatible endpoint where supported.',
  },
];

const synthexisSections = [
  {
    id: 'start',
    title: 'Start a research run',
    text: 'Enter a real question. Choose the research method that matches the job: Adaptive, Systematic, Evidence map, or Comparative. Breezy Research builds a research plan before the evidence pass.',
  },
  {
    id: 'roles',
    title: 'Assign the research roles',
    text: 'Lead Analyst frames the problem, Adversary stress-tests it, Verifier checks evidence, and Synthesizer reconciles the result. Each seat can use a different provider and model.',
  },
  {
    id: 'steer',
    title: 'Join the debate',
    text: 'You are not a spectator. Pause or steer the research by challenging a claim, changing a criterion, adding evidence, or narrowing scope. Your input becomes a new research branch.',
  },
  {
    id: 'integrity',
    title: 'Understand the output',
    text: 'Watch sources, claims, conflicts, uncertainty, elapsed time, token usage, and progress checkpoints. A missing provider or failed verification should be visible rather than replaced with fake data.',
  },
];

export const GuideView: React.FC<GuideViewProps> = ({ product }) => {
  const [activeId, setActiveId] = useState('start');
  const sections = useMemo(() => product === 'breezy' ? breezySections : synthexisSections, [product]);
  const active = sections.find((section) => section.id === activeId) || sections[0];

  return (
    <div className={product === 'breezy'
      ? 'min-h-[calc(100vh-4rem)] bg-[#090d16] text-slate-100'
       : 'min-h-[calc(100vh-4rem)] bg-[#07111f] text-slate-100'}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div className="max-w-3xl">
          <div className="text-xs font-medium text-slate-500 mb-3">
            {product === 'breezy' ? 'Breezy guide' : 'Breezy Research guide'}
          </div>
          <h1 className={product === 'breezy'
            ? 'text-3xl sm:text-4xl font-semibold tracking-tight text-white'
             : 'text-3xl sm:text-4xl font-semibold tracking-tight text-white'}>
            How to use {product === 'breezy' ? 'Breezy' : 'Breezy Research'}
          </h1>
          <p className={product === 'breezy'
            ? 'mt-3 text-sm leading-7 text-slate-400'
             : 'mt-3 text-sm leading-7 text-slate-400'}>
            A practical guide to using Breezy's real chat, research, model setup, and code workflows.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={product === 'breezy'
                  ? `w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${activeId === section.id ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`
                   : `w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer ${activeId === section.id ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}>
                {section.title}
              </button>
            ))}
          </nav>

          <article className={product === 'breezy'
            ? 'rounded-xl border border-slate-800/80 bg-[#0d1322] p-6 sm:p-8'
             : 'rounded-xl border border-slate-800/80 bg-[#0d1322] p-6 sm:p-8'}>
            <h2 className={product === 'breezy' ? 'text-xl font-semibold text-white'  : 'text-xl font-semibold text-white'}>
              {active.title}
            </h2>
            <p className={product === 'breezy'
              ? 'mt-4 text-sm leading-7 text-slate-400'
               : 'mt-4 text-sm leading-7 text-slate-400'}>
              {active.text}
            </p>

            {active.id === 'models' && product === 'breezy' && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {['BYOK provider', 'Ollama / local', 'OpenAI-compatible'].map((item) => (
                  <div key={item} className="rounded-lg border border-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-200">{item}</div>
                    <div className="mt-1 text-[11px] text-slate-500">Connect it explicitly, then select its model.</div>
                  </div>
                ))}
              </div>
            )}

            {active.id === 'roles' && product === 'synthexis' && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {['Lead Analyst', 'Adversary', 'Verifier', 'Synthesizer'].map((item) => (
                  <div key={item} className="rounded-lg border border-slate-800 p-4">
                    <div className="text-xs font-medium text-slate-200">{item}</div>
                    <div className="mt-1 text-[11px] text-slate-500">Assign the provider and model you want this seat to use.</div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};
