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
    <div className="breezy-landing min-h-[calc(100vh-4rem)] overflow-y-auto text-[#e1e2e9]">
      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".txt,.md,.json,.csv,.log,.ts,.tsx,.js,.jsx,.py,.java,.kt,.html,.css" />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <section className="grid min-h-[calc(100vh-9rem)] items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div className="relative">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src="/breezy.png" alt="Breezy" className="h-9 w-9 object-contain" />
              <span className="text-sm font-semibold text-[#e1e2e9]">Breezy</span>
            </div>

            <div className="mb-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#4cd6fb]/70">
              <span className="h-px w-8 bg-sky-300/50" />
              Research, without the noise
            </div>

            <h1 className="max-w-xl text-5xl font-semibold leading-[0.96] tracking-[-0.065em] text-[#e1e2e9] sm:text-6xl lg:text-[76px]">
              Hard questions.
              <span className="block text-[#4cd6fb]">Better thinking.</span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-7 text-[#bcc9ce] sm:text-lg">
              Breezy lets different perspectives examine the same question, challenge weak reasoning, check evidence, and give you a result you can actually use.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#869398]">
              <span className="inline-flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${hasConnectedProvider ? 'bg-emerald-400' : 'bg-amber-300'}`} />{hasConnectedProvider ? 'Model connected' : 'No model connected'}</span>
              <button type="button" onClick={onOpenModels} className="text-[#4cd6fb] transition hover:text-[#7bd0ff]">{hasConnectedProvider ? 'Change model' : 'Connect a model'}</button>
              {sessionCount > 0 && <span>{sessionCount} saved {sessionCount === 1 ? 'research session' : 'research sessions'}</span>}
            </div>

            <div className="mt-12 hidden max-w-[300px] overflow-hidden border border-[#3d494d]/55 bg-[#191c21] shadow-[0_24px_70px_rgba(0,0,0,.26)] sm:block">
              <div className="relative aspect-square overflow-hidden">
                <img src="/breezy-mark-reference.png" alt="Breezy mark" className="h-full w-full object-cover opacity-85 mix-blend-screen" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07111f] via-transparent to-transparent" />
              </div>
              <div className="border-t border-[#3d494d]/50 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#69767b]">Breezy</div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[#e1e2e9]">Start with the question</div>
                <div className="mt-1 text-xs text-[#869398]">Choose the amount of thinking you want. You can change it later.</div>
              </div>
              <div className="hidden text-[11px] text-[#69767b] sm:block">⌘ Enter</div>
            </div>

            <section className="overflow-hidden border border-[#3d494d]/60 bg-[#191c21] shadow-[0_24px_70px_rgba(0,0,0,.28)]">
              <div className="p-5 sm:p-7 lg:p-8">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(); } }}
                  placeholder="What are you trying to figure out?"
                  rows={7}
                  className="min-h-[180px] w-full resize-none border-0 bg-transparent text-xl leading-8 text-[#e1e2e9] outline-none placeholder:text-[#69767b] sm:min-h-[230px] sm:text-2xl"
                />
                {attachedFile && <div className="mt-4 flex items-center gap-2 border border-[#4cd6fb]/20 bg-[#4cd6fb]/5 px-3 py-2 text-xs text-[#b3ebff]"><span className="material-symbols-outlined text-[16px] text-[#4cd6fb]">description</span><span className="truncate">{attachedFile.name}</span><span className="text-[#b3ebff]/40">{attachedFile.size}</span><button type="button" onClick={() => { setAttachedFile(null); setFileContent(''); }} className="ml-auto text-[#869398] hover:text-[#e1e2e9]" aria-label="Remove attachment">close</button></div>}
              </div>

              <div className="border-t border-[#3d494d]/50 bg-[#0b0e13] px-5 py-4 sm:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {depthOptions.map((option) => {
                      const active = researchDepth === option.id;
                      return <button key={option.id} type="button" title={option.helper} onClick={() => chooseWorkflow(option.id)} className={`flex items-center gap-2 border px-3 py-2 text-left transition ${active ? 'border-[#4cd6fb]/40 bg-[#4cd6fb]/10 text-[#b3ebff]' : 'border-[#3d494d]/50 text-[#869398] hover:border-[#4cd6fb]/25 hover:text-slate-300'}`}><span className={`material-symbols-outlined text-[16px] ${active ? 'text-[#4cd6fb]' : 'text-[#69767b]'}`}>{option.icon}</span><span className="text-xs font-medium">{option.label}</span></button>;
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 items-center gap-2 border border-[#3d494d]/50 px-3 text-xs text-[#869398] transition hover:border-[#4cd6fb]/25 hover:text-[#7bd0ff]"><span className="material-symbols-outlined text-[17px]">attach_file</span>Context</button>
                    <button type="button" onClick={handleSend} disabled={!inputText.trim() && !fileContent} className={`flex h-10 items-center gap-2 px-5 text-xs font-semibold transition ${inputText.trim() || fileContent ? 'bg-sky-300 text-[#003642] hover:bg-sky-200' : 'bg-[#272a30] text-[#69767b]'}`}><span>Start</span><span className="material-symbols-outlined text-[16px]">arrow_upward</span></button>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10 grid gap-px border border-[#3d494d]/50 bg-[#3d494d]/45 sm:grid-cols-3">
              {[
                ['01', 'Propose', 'Independent perspectives form an initial view.'],
                ['02', 'Challenge', 'Those perspectives test assumptions and each other.'],
                ['03', 'Resolve', 'Evidence and disagreement shape the final answer.'],
              ].map(([num, title, body]) => <div key={num} className="bg-[#111319] p-4 sm:p-5"><div className="text-[10px] font-mono text-[#4cd6fb]/45">{num}</div><div className="mt-5 text-sm font-medium text-[#e1e2e9]">{title}</div><p className="mt-2 text-xs leading-5 text-[#69767b]">{body}</p></div>)}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#69767b]">
              <button type="button" onClick={() => chooseWorkflow('standard', 'adaptive')} className="hover:text-[#4cd6fb]">Investigate something</button>
              <button type="button" onClick={() => chooseWorkflow('deep', 'comparative')} className="hover:text-[#4cd6fb]">Compare options</button>
              <button type="button" onClick={() => chooseWorkflow('deep', 'evidence-map')} className="hover:text-[#4cd6fb]">Stress-test an idea</button>
              <button type="button" onClick={onOpenNotes} className="hover:text-[#4cd6fb]">Open history</button>
            </div>
          </div>
        </section>
      </div>

      {toastMessage && <div className="fixed bottom-5 right-5 z-50 max-w-sm border border-[#4cd6fb]/25 bg-[#191c21] px-4 py-3 text-xs text-sky-50 shadow-2xl">{toastMessage}</div>}
    </div>
  );
};