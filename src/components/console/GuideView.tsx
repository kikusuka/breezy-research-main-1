import React, { useEffect, useMemo, useState } from 'react';
import { effectiveProviderService } from '../../services/effectiveProviderService';
import { providerConfigService } from '../../services/providerConfigService';

type Topic = {
  id: string;
  label: string;
  group: string;
};

const topics: Topic[] = [
  { id: 'getting-started', label: 'Getting Started', group: 'Overview' },
  { id: 'research-workflow', label: 'Research Workflow', group: 'Research' },
  { id: 'chat-vs-research', label: 'Chat vs Research', group: 'Research' },
  { id: 'model-routing', label: 'Model Routing', group: 'Infrastructure' },
  { id: 'evidence-and-export', label: 'Evidence & Export', group: 'Output' },
  { id: 'integrations', label: 'Integrations', group: 'Infrastructure' },
];

const roleLabels: Record<string, string> = {
  architect: 'Architect',
  skeptic: 'Skeptic',
  verifier: 'Verifier',
  arbiter: 'Arbiter',
};

export const GuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [filterQuery, setFilterQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [providerVersion, setProviderVersion] = useState(0);

  useEffect(() => effectiveProviderService.subscribe(() => setProviderVersion((v) => v + 1)), []);

  const activeModel = useMemo(() => effectiveProviderService.getActiveRoutableModel(), [providerVersion]);
  const config = useMemo(() => providerConfigService.getConfig(), [providerVersion]);
  const configuredProviders = useMemo(() => providerConfigService.getConfiguredProviders(), [providerVersion]);

  const filteredTopics = topics.filter((topic) =>
    topic.label.toLowerCase().includes(filterQuery.trim().toLowerCase())
  );

  const routingSnapshot = useMemo(() => {
    const roles = Object.entries(config.roles || {}).map(([role, seat]) => ({
      role,
      provider: seat?.provider || null,
      model: seat?.model || null,
    }));

    return JSON.stringify(
      {
        defaultProvider: config.defaultProvider || null,
        defaultModel: config.defaultModel || null,
        preset: config.preset,
        roles,
        searchEngine: config.searchEngine || null,
        researchMethod: config.researchMethod || null,
      },
      null,
      2
    );
  }, [config]);

  const copyRoutingSnapshot = async () => {
    try {
      await navigator.clipboard.writeText(routingSnapshot);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface p-space-md sm:p-space-lg pb-24 max-w-7xl mx-auto">
      <div className="pointer-events-none absolute -top-32 left-1/3 w-[640px] h-[360px] bg-primary/10 rounded-full blur-[140px]" />

      <div className="flex flex-col lg:flex-row gap-space-lg py-space-xs w-full">
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 self-start">
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between pb-space-sm">
              <span className="font-mono text-code-sm uppercase tracking-wider text-outline">
                Documentation Index
              </span>
              <span className="font-mono text-code-sm text-primary bg-surface-container px-2 py-0.5 rounded">
                GUIDE
              </span>
            </div>

            <div className="relative mt-1 mb-space-md">
              <input
                type="text"
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                placeholder="Filter topics..."
                className="w-full bg-surface-container text-on-surface placeholder:text-outline font-sans text-body-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>

            <nav className="flex flex-col gap-space-sm">
              {['Overview', 'Research', 'Infrastructure', 'Output'].map((group) => {
                const groupTopics = filteredTopics.filter((topic) => topic.group === group);
                if (!groupTopics.length) return null;

                return (
                  <div key={group}>
                    <span className="font-mono text-label-sm uppercase tracking-wider text-outline px-1">
                      {group}
                    </span>
                    <div className="flex flex-col mt-1 gap-0.5">
                      {groupTopics.map((topic) => {
                        const active = activeSection === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => scrollToSection(topic.id)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors text-label-md ${active
                              ? 'bg-surface-container-high text-primary font-medium'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            <span>{topic.label}</span>
                            {active && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="mt-space-lg p-3 bg-surface-container rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${activeModel ? 'bg-tertiary' : 'bg-outline'}`} />
                <span className="text-label-sm text-on-surface font-semibold">
                  {activeModel ? 'Model ready' : 'No model configured'}
                </span>
              </div>
              <p className="mt-1 font-mono text-code-sm text-on-surface-variant break-words">
                {activeModel ? `${activeModel.provider} · ${activeModel.model}` : 'Connect a provider in Models.'}
              </p>
              <span className="mt-1 block text-label-sm text-outline">
                {configuredProviders.length} provider{configuredProviders.length === 1 ? '' : 's'} configured
              </span>
            </div>
          </div>
        </aside>

        <article className="flex-1 min-w-0 max-w-4xl space-y-space-xl pb-12">
          <header className="flex flex-col gap-2 bg-surface-container-low p-space-lg rounded-xl relative overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap font-mono text-code-sm">
              <span className="text-primary bg-surface-container px-2 py-0.5 rounded uppercase">Breezy guide</span>
              <span className="text-outline">/</span>
              <span className="text-on-surface-variant">Product documentation</span>
            </div>
            <h1 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight">
              How Breezy fits together
            </h1>
            <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">
              Breezy separates the calm interface from the machinery underneath: model configuration, research orchestration,
              evidence, notes, integrations, and developer workspaces.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 bg-surface-container p-2 rounded-lg">
              <div>
                <span className="font-mono text-code-sm text-outline">MODEL</span>
                <span className="block text-label-md text-on-surface font-semibold">
                  {activeModel ? activeModel.model : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="font-mono text-code-sm text-outline">PROVIDERS</span>
                <span className="block text-label-md text-primary font-semibold">{configuredProviders.length}</span>
              </div>
              <div>
                <span className="font-mono text-code-sm text-outline">MODE</span>
                <span className="block text-label-md text-on-surface font-semibold">{config.preset}</span>
              </div>
              <div>
                <span className="font-mono text-code-sm text-outline">SEARCH</span>
                <span className="block text-label-md text-tertiary font-semibold">{config.searchEngine || 'Default'}</span>
              </div>
            </div>
          </header>

          <section id="getting-started" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm">01</span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Getting Started</h2>
            </div>
            <div className="bg-surface-container-low p-space-lg rounded-xl space-y-3">
              <h3 className="font-headline font-semibold text-headline-md">Start with Models</h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Open Models and connect a provider or local model. Breezy intentionally does not pretend a model is available
                before one is actually configured.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  ['01', 'Configure', 'Connect a provider and choose a model.'],
                  ['02', 'Ask', 'Use Chat for direct questions or Research for a deeper run.'],
                  ['03', 'Inspect', 'Review evidence, sources, notes, and the final synthesis.'],
                ].map(([step, title, copy]) => (
                  <div key={step} className="p-3 rounded-lg bg-surface-container">
                    <span className="font-mono text-code-sm text-primary">{step}</span>
                    <h4 className="mt-1 font-semibold text-on-surface">{title}</h4>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="research-workflow" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm">02</span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Research Workflow</h2>
            </div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Research runs through a visible workflow so you can see what Breezy is doing instead of watching a generic loading animation.
              The interface exposes planning, exploration, challenge, evidence, and synthesis state as the run progresses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['Question', 'Turn the request into a focused research prompt.'],
                ['Exploration', 'Search and gather material using the configured search path.'],
                ['Proposals', 'Let configured research roles generate candidate findings.'],
                ['Challenge', 'Stress-test findings through the configured debate/review flow.'],
                ['Evidence', 'Inspect sources, claims, contradictions, and grounding results.'],
                ['Synthesis', 'Read the combined result and continue with notes, export, or Build/Canvas.'],
              ].map(([title, copy], index) => (
                <div key={title} className="bg-surface-container-low p-4 rounded-xl">
                  <span className="font-mono text-code-sm text-primary">STEP {String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-1 font-semibold text-on-surface">{title}</h3>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="chat-vs-research" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm">03</span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Chat vs Research</h2>
            </div>
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead className="bg-surface-container font-mono text-code-sm text-outline uppercase">
                    <tr>
                      <th className="py-3 px-4">Use</th>
                      <th className="py-3 px-4">Chat</th>
                      <th className="py-3 px-4 text-primary">Research</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    <tr>
                      <td className="py-3 px-4 font-semibold">Best for</td>
                      <td className="py-3 px-4 text-on-surface-variant">Quick questions, drafting, exploration</td>
                      <td className="py-3 px-4 text-on-surface-variant">Multi-step investigation and evidence review</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">Configuration</td>
                      <td className="py-3 px-4 text-on-surface-variant">Uses the active routable model</td>
                      <td className="py-3 px-4 text-on-surface-variant">Uses the selected research preset, roles, and grounding settings</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">Output</td>
                      <td className="py-3 px-4 text-on-surface-variant">Conversation</td>
                      <td className="py-3 px-4 text-on-surface-variant">Synthesis, evidence, sources, metrics, and exportable notes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="model-routing" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm">04</span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Model Routing</h2>
            </div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Breezy keeps provider configuration separate from the research UI. A role can remain unassigned, and the UI should show
              that state plainly instead of inventing a model name.
            </p>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
              <div className="bg-surface-container px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-code-sm text-outline">CURRENT ROUTING SNAPSHOT</span>
                <button
                  type="button"
                  onClick={copyRoutingSnapshot}
                  className="flex items-center gap-1.5 text-label-md text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-code-sm text-on-surface leading-relaxed">
                <code>{routingSnapshot}</code>
              </pre>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(config.roles || {}).map(([role, seat]) => (
                <div key={role} className="p-3 rounded-lg bg-surface-container-low">
                  <span className="font-mono text-label-sm text-outline uppercase">{roleLabels[role] || role}</span>
                  <span className="block mt-1 text-label-md text-on-surface">{seat?.model || 'No model assigned'}</span>
                  <span className="block mt-0.5 text-label-sm text-on-surface-variant">{seat?.provider || 'No provider'}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="evidence-and-export" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm">05</span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Evidence & Export</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                ['Evidence', 'Inspect claims, supporting sources, contradictions, and research metrics when a run provides them.'],
                ['Notes', 'Keep working notes connected to the research session instead of copying findings into another tool.'],
                ['Export', 'Export completed research into the supported document formats from the result view.'],
              ].map(([title, copy]) => (
                <div key={title} className="bg-surface-container-low p-4 rounded-xl">
                  <span className="material-symbols-outlined text-primary">fact_check</span>
                  <h3 className="mt-2 font-semibold text-on-surface">{title}</h3>
                  <p className="mt-1 text-body-sm text-on-surface-variant leading-relaxed">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="integrations" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-surface-container-high text-primary flex items-center justify-center font-mono text-code-sm">06</span>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">Integrations</h2>
            </div>
            <div className="bg-surface-container-low p-space-lg rounded-xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  ['Google Workspace', 'Connect Google services from Settings for document workflows and sync.'],
                  ['GitHub', 'Connect a repository for Build / IDE features and repository-aware work.'],
                  ['Canvas & Build', 'Continue from a research result into the developer or visual workspace when the feature is applicable.'],
                ].map(([title, copy]) => (
                  <div key={title} className="p-4 rounded-lg bg-surface-container">
                    <h3 className="font-semibold text-on-surface">{title}</h3>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{copy}</p>
                  </div>
                ))}
              </div>
              <p className="text-label-sm text-outline">
                Connection state comes from the current Breezy session/configuration. Disconnected integrations are not presented as active.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
