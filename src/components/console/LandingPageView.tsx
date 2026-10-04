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
    try { setSessionCount(loadSessions().length); } catch { setSessionCount(0); }
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 220) + 'px';
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
      fullPrompt += `\n\n--- ATTACHED FILE CONTEXT (${attachedFile?.name || 'reference'}) ---\n${fileContent}\n--- END ATTACHED FILE ---`;
    }
    const isGithubRepoOp = /push to repo|commit to repo|open pull request|create pull request|mount github repo/i.test(fullPrompt);
    const hasGithub = Boolean(localStorage.getItem('synthexis_github_token') || localStorage.getItem('breezy_github_token'));
    if (isGithubRepoOp && !hasGithub) {
      showToast('Connect GitHub in Settings before asking Breezy to write to a repository.');
      return;
    }
    setInputText('');
    setAttachedFile(null);
    setFileContent('');
    onLaunchWorkspace(fullPrompt, researchDepth);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
    const reader = new FileReader();
    reader.onload = (loadEvent) => setFileContent(typeof loadEvent.target?.result === 'string' ? loadEvent.target.result.slice(0, 12000) : '');
    reader.onerror = () => {
      setAttachedFile(null);
      setFileContent('');
      showToast('Breezy could not read that file. Try text, Markdown, JSON, CSV, or code.');
    };
    reader.readAsText(file);
  };

  const depthOptions = [
    { id: 'solo' as const, label: 'Quick', helper: 'One model, fast answer', icon: 'bolt' },
    { id: 'standard' as const, label: 'Research', helper: 'Perspectives, challenge, evidence', icon: 'search' },
    { id: 'deep' as const, label: 'Deep', helper: 'Research plus independent checks', icon: 'account_tree' },
  ];

  const workflows = [
    { title: 'Investigate', description: 'Start broad, find evidence, then narrow down what matters.', depth: 'standard' as const, icon: 'travel_explore', method: 'adaptive' },
    { title: 'Compare options', description: 'Set the criteria first and make alternatives defend themselves.', depth: 'deep' as const, icon: 'compare_arrows', method: 'comparative' },
    { title: 'Stress-test an idea', description: 'Give Breezy a position and ask it to look for weak spots.', depth: 'deep' as const, icon: 'rule', method: 'evidence-map' },
  ];

  const chooseWorkflow = (depth: 'solo' | 'standard' | 'deep', method?: string) => {
    setResearchDepth(depth);
    if (method) {
      const next = providerConfigService.getConfig();
      next.researchMethod = method as any;
      next.preset = depth === 'solo' ? 'fast' : depth === 'standard' ? 'balanced' : 'custom';
      if (next.preset !== 'custom') next.roles = PRESET_ROLE_CONFIGS[next.preset];
      providerConfigService.saveConfig(next);
    }
    textareaRef.current?.focus();
  };

  return (
    <div className="breezy-landing min-h-[calc(100vh-4rem)] overflow-hidden text-slate-100">
      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".txt,.md,.json,.csv,.log,.ts,.tsx,.js,.jsx,.py,.java,.kt,.html,.css" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1380px] grid-cols-1 gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(260px,0.7fr)_minmax(520px,1.35fr)] lg:gap-16 lg:px-12 lg:py-12 xl:grid-cols-[340px_minmax(620px,760px)]">
        <aside className="flex flex-col justify-between lg:py-5">
          <div>
            <div className="mb-14 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300 text-slate-950 shadow-[0_8px_24px_rgba(102,199,244,.2)]">
                <span className="material-symbols-outlined text-[21px]">air</span>
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight text-white">Breezy</div>
                <div className="text-[11px] text-sky-200/55">A calmer way to research</div>
              </div>
            </div>

            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/45">Start here</div>
            <h1 className="max-w-sm text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-white sm:text-5xl">
              Bring the hard question.
              <span className="mt-2 block text-sky-300">Keep the calm.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Breezy gives your question more than one pass: perspectives, pushback, evidence, then a clear result.
            </p>

            <div className="mt-10 flex items-center gap-3 border-t border-white/[0.08] pt-5 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${hasConnectedProvider ? 'bg-emerald-400' : 'bg-amber-300'}`} />
              <span>{hasConnectedProvider ? 'Ready to research' : 'No model connected yet'}</span>
              {!hasConnectedProvider && <button type="button" onClick={onOpenModels} className="font-medium text-sky-300 hover:text-sky-200">Connect one</button>}
            </div>
          </div>

          <div className="mt-12 border-t border-white/[0.08] pt-5 lg:mt-8">
            <div className="text-[11px] text-slate-500">{sessionCount ? `${sessionCount} saved research ${sessionCount === 1 ? 'session' : 'sessions'}` : 'No saved research yet'}</div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <button type="button" onClick={onOpenNotes} className="hover:text-white">Open history</button>
              <button type="button" onClick={onOpenModels} className="hover:text-sky-200">Research setup</button>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col justify-center lg:py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">What are you working through?</div>
              <div className="mt-1 text-xs text-slate-500">Ask a question, add context, and choose how much challenge you want.</div>
            </div>
            <div className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex"><span className="material-symbols-outlined text-[15px] text-sky-300">keyboard_return</span> Enter to start</div>
          </div>

          <section className="question-desk overflow-hidden rounded-[1.6rem] border border-sky-200/15 bg-[#0a1c31] shadow-[0_24px_70px_rgba(0,24,48,.35)]">
            <div className="p-5 sm:p-7">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(); } }}
                placeholder="Ask Breezy something difficult…"
                rows={6}
                className="min-h-[150px] w-full resize-none border-0 bg-transparent text-lg leading-8 text-white outline-none placeholder:text-slate-600 sm:min-h-[190px] sm:text-xl"
              />
              {attachedFile && (
                <div className="mt-4 flex max-w-full items-center gap-2 rounded-lg border border-sky-300/15 bg-sky-300/[0.06] px-3 py-2 text-xs text-sky-100">
                  <span className="material-symbols-outlined text-[16px] text-sky-300">description</span><span className="truncate">{attachedFile.name}</span><span className="text-sky-100/45">{attachedFile.size}</span>
                  <button type="button" onClick={() => { setAttachedFile(null); setFileContent(''); }} className="ml-auto text-sky-100/45 hover:text-white" aria-label="Remove attachment">close</button>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.08] bg-[#08182a] px-5 py-4 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Research depth</div>
                  <div className="flex flex-wrap gap-2">
                    {depthOptions.map((option) => {
                      const active = researchDepth === option.id;
                      return <button key={option.id} type="button" title={option.helper} onClick={() => chooseWorkflow(option.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${active ? 'border-sky-300/45 bg-sky-300/[0.12] text-sky-100' : 'border-white/[0.08] text-slate-400 hover:border-sky-300/25 hover:text-slate-200'}`}><span className={`material-symbols-outlined text-[16px] ${active ? 'text-sky-300' : 'text-slate-500'}`}>{option.icon}</span><span><span className="block text-xs font-medium">{option.label}</span><span className="hidden text-[10px] text-slate-500 sm:block">{option.helper}</span></span></button>;
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-xs text-slate-400 hover:border-sky-300/25 hover:text-sky-200"><span className="material-symbols-outlined text-[17px]">attach_file</span><span className="hidden sm:inline">Add context</span></button>
                  <button type="button" onClick={handleSend} disabled={!inputText.trim() && !fileContent} className={`flex h-10 items-center gap-2 rounded-lg px-5 text-xs font-semibold transition ${inputText.trim() || fileContent ? 'bg-sky-300 text-slate-950 hover:bg-sky-200' : 'bg-white/[0.06] text-slate-600'}`}><span>Start research</span><span className="material-symbols-outlined text-[16px]">arrow_upward</span></button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12">
            <div className="flex items-end justify-between gap-4"><div><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200/45">Useful starting points</div><p className="mt-2 text-sm text-slate-500">Choose a shape if you know how you want the question handled.</p></div><span className="hidden text-[11px] text-slate-600 sm:block">Change it later</span></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {workflows.map((workflow, index) => <button key={workflow.title} type="button" onClick={() => chooseWorkflow(workflow.depth, workflow.method)} className="group rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-300/[0.05]"><div className="flex items-start justify-between gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-300/[0.08] text-sky-300"><span className="material-symbols-outlined text-[17px]">{workflow.icon}</span></span><span className="text-[10px] text-slate-600">0{index + 1}</span></div><div className="mt-5 text-sm font-medium text-slate-200 group-hover:text-white">{workflow.title}</div><p className="mt-2 text-xs leading-5 text-slate-500">{workflow.description}</p></button>)}
            </div>
          </section>
        </main>
      </div>
      {toastMessage && <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-sky-300/20 bg-[#0a1c31] px-4 py-3 text-xs text-sky-50 shadow-2xl">{toastMessage}</div>}
    </div>
  );
};
