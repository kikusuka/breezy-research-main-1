import React, { useEffect, useRef, useState } from 'react';
import { PRESET_ROLE_CONFIGS, providerConfigService } from '../../services/providerConfigService';
import { loadSessions } from '../../services/sessionStorage';

interface LandingPageViewProps {
  onLaunchWorkspace: (prompt?: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onOpenNotes: () => void;
  onOpenModels: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLaunchWorkspace,
  onOpenNotes,
  onOpenModels,
}) => {
  const [inputText, setInputText] = useState('');
  const [researchDepth, setResearchDepth] = useState<'solo' | 'standard' | 'deep'>('standard');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      setSessionCount(loadSessions().length);
    } catch {
      setSessionCount(0);
    }
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
  }, [inputText]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const config = providerConfigService.getConfig();
  const hasConnectedProvider = providerConfigService.getConfiguredProviders().length > 0;

  const handleSend = () => {
    if (!inputText.trim() && !fileContent) return;

    let fullPrompt = inputText.trim();
    if (fileContent) {
      fullPrompt +=
        '\n\n--- ATTACHED FILE CONTEXT (' +
        (attachedFile?.name || 'reference') +
        ') ---\n' +
        fileContent +
        '\n--- END ATTACHED FILE ---';
    }

    const isGithubRepoOp = /push to repo|commit to repo|open pull request|create pull request|mount github repo/i.test(fullPrompt);
    const hasGithub = Boolean(
      localStorage.getItem('synthexis_github_token') ||
      localStorage.getItem('breezy_github_token')
    );

    if (isGithubRepoOp && !hasGithub) {
      showToast('Connect GitHub in Settings before asking Breezy to write to a repository.');
      return;
    }

    setInputText('');
    setAttachedFile(null);
    setFileContent('');
    onLaunchWorkspace(fullPrompt, researchDepth);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAttachedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
    });

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';
      setFileContent(text.slice(0, 12000));
    };
    reader.onerror = () => {
      setAttachedFile(null);
      setFileContent('');
      showToast('Breezy could not read that file. Try a text, Markdown, JSON, CSV, or code file.');
    };
    reader.readAsText(file);
  };

  const depthOptions = [
    { id: 'solo' as const, label: 'Quick', helper: 'One model, fast answer' },
    { id: 'standard' as const, label: 'Research', helper: 'Models challenge the first answer' },
    { id: 'deep' as const, label: 'Deep', helper: 'Research + independent verification' },
  ];

  const workflows = [
    {
      title: 'Investigate',
      description: 'Start broad, find evidence, then narrow down what actually matters.',
      depth: 'standard' as const,
    },
    {
      title: 'Compare',
      description: 'Set the criteria first, then make competing options defend themselves.',
      depth: 'deep' as const,
    },
    {
      title: 'Stress-test',
      description: 'Give Breezy an idea and make the research pipeline try to break it.',
      depth: 'deep' as const,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-slate-100">
      <div className="pointer-events-none absolute -left-32 -top-28 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-cyan-400/8 blur-3xl" />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.json,.csv,.log,.ts,.tsx,.js,.jsx,.py,.java,.kt,.html,.css"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-400/10">
              <span className="material-symbols-outlined text-[20px] text-sky-300">air</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Breezy</div>
              <div className="text-[11px] text-slate-400">Research workspace</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span>{sessionCount === 0 ? 'New workspace' : sessionCount + ' saved research ' + (sessionCount === 1 ? 'session' : 'sessions')}</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1 text-[11px] font-medium text-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              {hasConnectedProvider ? 'Ready to research' : 'Connect a model to start'}
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              Difficult questions deserve
              <span className="text-sky-300"> more than one take.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Breezy lets your models propose, challenge, verify, and resolve before it gives you the final answer.
            </p>
          </div>

          <section className="mt-10 rounded-[1.75rem] border border-sky-300/15 bg-slate-950/70 p-3 shadow-[0_30px_80px_rgba(2,132,199,0.12)] backdrop-blur-xl sm:p-4">
            <div className="rounded-[1.3rem] border border-white/[0.06] bg-white/[0.025] p-4 sm:p-5">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What are you trying to figure out?"
                rows={3}
                className="min-h-[84px] w-full resize-none border-0 bg-transparent p-0 text-base leading-7 text-white outline-none placeholder:text-slate-600 sm:text-lg"
              />

              {attachedFile && (
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
                  <span className="material-symbols-outlined text-[15px] text-sky-300">description</span>
                  <span className="max-w-[240px] truncate">{attachedFile.name}</span>
                  <span className="text-slate-600">{attachedFile.size}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFile(null);
                      setFileContent('');
                    }}
                    className="ml-1 text-slate-500 transition hover:text-white"
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-slate-400 transition hover:border-sky-300/20 hover:bg-sky-400/[0.06] hover:text-sky-200"
                  >
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                    Add context
                  </button>

                  <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-black/20 p-1">
                    {depthOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        title={option.helper}
                        onClick={() => {
                          setResearchDepth(option.id);
                          const presetKey = option.id === 'solo' ? 'fast' : option.id === 'standard' ? 'balanced' : 'deep';
                          const updated = {
                            ...config,
                            preset: presetKey as 'fast' | 'balanced' | 'deep',
                            roles: PRESET_ROLE_CONFIGS[presetKey],
                          };
                          providerConfigService.saveConfig(updated);
                        }}
                        className={
                          researchDepth === option.id
                            ? 'rounded-lg bg-sky-300 px-3 py-1.5 text-[11px] font-semibold text-slate-950'
                            : 'rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-200'
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() && !fileContent}
                  className={
                    inputText.trim() || fileContent
                      ? 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 text-xs font-semibold text-slate-950 transition hover:bg-sky-200'
                      : 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 text-xs font-semibold text-slate-600'
                  }
                >
                  Start
                  <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3 text-[11px] text-slate-500">
              <span>
                {researchDepth === 'solo'
                  ? 'Quick pass'
                  : researchDepth === 'standard'
                    ? 'Analyst → Critic → Synthesizer'
                    : 'Analyst → Critic → Verifier → Synthesizer'}
              </span>
              {!hasConnectedProvider && (
                <button
                  type="button"
                  onClick={onOpenModels}
                  className="text-sky-300 transition hover:text-sky-200"
                >
                  Connect a model
                </button>
              )}
            </div>
          </section>

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Start with a workflow</div>
                <div className="mt-1 text-sm text-slate-600">Pick a shape, then rewrite the question however you like.</div>
              </div>
              <div className="hidden text-[11px] text-slate-600 sm:block">You can change models later.</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {workflows.map((workflow) => (
                <button
                  key={workflow.title}
                  type="button"
                  onClick={() => {
                    setResearchDepth(workflow.depth);
                    setInputText('');
                    textareaRef.current?.focus();
                  }}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300/20 hover:bg-sky-300/[0.035]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-200">{workflow.title}</span>
                    <span className="material-symbols-outlined text-[16px] text-slate-600 transition group-hover:text-sky-300">arrow_outward</span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{workflow.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.06] pt-5 text-xs text-slate-500">
            <button type="button" onClick={onOpenNotes} className="transition hover:text-slate-200">History</button>
            <button type="button" onClick={onOpenModels} className="transition hover:text-sky-300">Models & research setup</button>
            <span className="text-slate-700">·</span>
            <span>Research can branch when the models disagree.</span>
          </section>
        </main>

        <footer className="flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Breezy Playground</span>
          <span>Chat · Research · Code</span>
        </footer>
      </div>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-sky-300/20 bg-slate-950/95 px-4 py-3 text-xs text-slate-200 shadow-2xl backdrop-blur-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
