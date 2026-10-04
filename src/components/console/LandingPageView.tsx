import React, { useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'solo' | 'standard' | 'deep'>('standard');

  const activeModel = useMemo(() => providerConfigService.getActiveRoutableModel(), []);
  const connected = Boolean(activeModel);

  const submit = () => {
    if (!query.trim()) return;
    onLaunchWorkspace(query.trim(), depth);
    setQuery('');
  };

  const examples = [
    { title: 'Investigate', text: 'Find the strongest evidence for a question before I make a decision.', icon: 'travel_explore' },
    { title: 'Compare', text: 'Compare two options and make the important trade-offs easy to see.', icon: 'compare_arrows' },
    { title: 'Stress-test', text: 'Take an idea I have and look for assumptions that could break it.', icon: 'rule' },
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-surface text-on-surface">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-16">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/breezy-logo.svg" alt="Breezy" className="h-9 w-9 object-contain" />
            <div>
              <div className="text-sm font-semibold tracking-tight text-on-surface">Breezy</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Research workspace</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenDocs} className="hidden h-9 px-3 text-xs text-on-surface-variant hover:text-on-surface sm:block">Docs</button>
            <button type="button" onClick={onOpenModels} className="h-9 border border-outline-variant bg-surface-container px-3 text-xs text-on-surface transition hover:border-primary/50 hover:text-primary">
              {connected ? activeModel?.model : 'Connect a model'}
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary" />
              A calmer way to research difficult questions
            </div>
            <h1 className="max-w-4xl font-headline text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-on-surface sm:text-6xl lg:text-[76px]">
              Ask something difficult.
              <span className="block text-primary">Work it out with Breezy.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-on-surface-variant sm:text-lg">
              Explore perspectives, challenge assumptions, check evidence, and get to an answer without having to manage the machinery underneath.
            </p>
          </div>

          <section className="mt-10 overflow-hidden border border-outline-variant bg-surface-container shadow-[0_24px_70px_rgba(0,0,0,.22)]">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3 sm:px-6">
              <span className="text-xs font-medium text-on-surface">What are you trying to figure out?</span>
              <span className="hidden text-[10px] uppercase tracking-[0.14em] text-outline sm:block">Enter to start · Shift + Enter for a new line</span>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={6}
              placeholder="Research a topic, compare choices, review an idea, or bring your own question..."
              className="min-h-[190px] w-full resize-none bg-transparent px-5 py-6 text-lg leading-8 text-on-surface outline-none placeholder:text-outline sm:px-7 sm:text-xl"
            />

            <div className="flex flex-col gap-4 border-t border-outline-variant bg-surface-container-low px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'solo' as const, label: 'Quick', help: 'One model' },
                  { id: 'standard' as const, label: 'Research', help: 'Perspectives + checks' },
                  { id: 'deep' as const, label: 'Deep', help: 'More independent checking' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDepth(item.id)}
                    title={item.help}
                    className={`min-h-10 border px-3 text-xs transition ${depth === item.id ? 'border-primary/60 bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-on-surface-variant hover:text-on-surface'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!query.trim()}
                onClick={submit}
                className="flex h-11 items-center justify-center gap-2 bg-primary px-6 text-xs font-semibold text-on-primary transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
              >
                Start research
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            </div>
          </section>

          {!connected && (
            <button type="button" onClick={onOpenModels} className="mt-4 flex w-full items-center justify-between border border-outline-variant/70 bg-surface-container-low px-4 py-3 text-left transition hover:border-primary/40">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-primary">memory</span>
                <span>
                  <span className="block text-xs font-medium text-on-surface">No model connected</span>
                  <span className="block pt-0.5 text-[11px] text-on-surface-variant">Connect a provider in Models before starting a live run.</span>
                </span>
              </span>
              <span className="text-xs text-primary">Configure →</span>
            </button>
          )}

          <div className="mt-10 grid gap-px border border-outline-variant bg-outline-variant md:grid-cols-3">
            {examples.map((example, index) => (
              <button
                key={example.title}
                type="button"
                onClick={() => setQuery(example.text)}
                className="group min-h-[170px] bg-surface p-6 text-left transition hover:bg-surface-container"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-outline">0{index + 1}</span>
                  <span className="material-symbols-outlined text-[19px] text-outline group-hover:text-primary">{example.icon}</span>
                </div>
                <h2 className="mt-10 text-sm font-semibold text-on-surface">{example.title}</h2>
                <p className="mt-2 max-w-xs text-xs leading-5 text-on-surface-variant">{example.text}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/60 pt-5 text-xs text-on-surface-variant">
            <div className="flex gap-5">
              <button type="button" onClick={onOpenNotes} className="hover:text-primary">History</button>
              <button type="button" onClick={onOpenModels} className="hover:text-primary">Models</button>
              {onOpenDocs && <button type="button" onClick={onOpenDocs} className="hover:text-primary">How Breezy works</button>}
            </div>
            <span>{connected ? `Using ${activeModel?.model}` : 'Connect a model to begin'}</span>
          </div>
        </section>
      </div>
    </main>
  );
};
