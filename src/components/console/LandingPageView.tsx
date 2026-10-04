import React, { useEffect, useRef, useState } from 'react';
import { PRESET_ROLE_CONFIGS, providerConfigService } from '../../services/providerConfigService';
import { loadSessions } from '../../services/sessionStorage';

interface LandingPageViewProps {
  onLaunchWorkspace: (prompt?: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onOpenNotes: () => void;
  onOpenModels: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onLaunchWorkspace, onOpenNotes, onOpenModels }) => {
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
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 260) + 'px';
  }, [inputText]);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const hasConnectedProvider = providerConfigService.getConfiguredProviders().length > 0;

  const handleSend = () => {
    if (!inputText.trim() && !fileContent) return;
    let fullPrompt = inputText.trim();
    if (fileContent) fullPrompt += `\n\n--- ATTACHED FILE CONTEXT (${attachedFile?.name || 'reference'}) ---\n${fileContent}\n--- END ATTACHED FILE ---`;
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
    { title: 'Investigate', description: 'Find the useful facts before you make a decision.', depth: 'standard' as const, icon: 'travel_explore', method: 'adaptive' },
    { title: 'Compare', description: 'Put options side by side and make the trade-offs clear.', depth: 'deep' as const, icon: 'compare_arrows', method: 'comparative' },
    { title: 'Stress-test', description: 'Give Breezy an idea and look for what could break it.', depth: 'deep' as const, icon: 'rule', method: 'evidence-map' },
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
    <div className="min-h-[calc(100vh-4rem)] overflow-y-auto bg-[#0e1116] text-[#e8edf0]">
      <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".txt,.md,.json,.csv,.log,.ts,.tsx,.js,.jsx,.py,.java,.kt,.html,.css" />

      <div className="mx-auto w-full max-w-[1240px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-10 lg:pt-16">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/breezy.png" alt="Breezy" className="h-9 w-9 object-contain" />
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Breezy</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#718087]">Research workspace</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden text-[#718087] sm:inline">{sessionCount ? `${sessionCount} saved ${sessionCount === 1 ? 'session' : 'sessions'}` : 'Ready when you are'}</span>
            <button type="button" onClick={onOpenModels} className="border border-[#39434a] bg-[#171b21] px-3 py-2 text-[#b9c5ca] transition hover:border-[#00b4d8]/60 hover:text-white">
              {hasConnectedProvider ? 'Models' : 'Connect model'}
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-[1080px]">
          <div className="mb-7 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 border border-[#39434a] bg-[#15191f] px-3 py-1.5 text-[11px] font-medium text-[#9eabb0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00b4d8]" />
              Research that shows its work
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[72px]">
              Ask a hard question.
              <span className="block text-[#63d9f7]">Breezy will work through it.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#9eabb0] sm:text-lg">
              Explore ideas, compare evidence, challenge assumptions, and keep the useful disagreement visible.
            </p>
          </div>

          <div className="overflow-hidden border border-[#39434a] bg-[#171b21] shadow-[0_30px_90px_rgba(0,0,0,.32)]">
            <div className="border-b border-[#39434a] px-5 py-3.5 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#dce4e7]">What do you want to figure out?</span>
                <span className="hidden text-[10px] uppercase tracking-[0.14em] text-[#66747b] sm:block">Shift + Enter for a new line</span>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(); } }}
                placeholder="Research a topic, compare two choices, review an idea, or bring your own material..."
                rows={5}
                className="min-h-[170px] w-full resize-none border-0 bg-transparent text-lg leading-8 text-white outline-none placeholder:text-[#5f6d74] sm:min-h-[205px] sm:text-xl"
              />
              {attachedFile && (
                <div className="mt-4 flex items-center gap-2 border border-[#00b4d8]/20 bg-[#00b4d8]/[0.06] px-3 py-2 text-xs text-[#bcefff]">
                  <span className="material-symbols-outlined text-[16px] text-[#00b4d8]">description</span>
                  <span className="truncate">{attachedFile.name}</span>
                  <span className="text-[#bcefff]/40">{attachedFile.size}</span>
                  <button type="button" onClick={() => { setAttachedFile(null); setFileContent(''); }} className="ml-auto text-[#718087] hover:text-white" aria-label="Remove attachment">close</button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-[#39434a] bg-[#12161b] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {depthOptions.map((option) => {
                  const active = researchDepth === option.id;
                  return (
                    <button key={option.id} type="button" title={option.helper} onClick={() => chooseWorkflow(option.id)} className={`flex min-h-10 items-center gap-2 border px-3 text-left transition ${active ? 'border-[#00b4d8]/60 bg-[#00b4d8]/[0.10] text-[#c7f3ff]' : 'border-[#39434a] text-[#8e9ba1] hover:border-[#5d6b72] hover:text-white'}`}>
                      <span className={`material-symbols-outlined text-[16px] ${active ? 'text-[#00b4d8]' : 'text-[#66747b]'}`}>{option.icon}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  );
                })}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-10 items-center gap-2 border border-[#39434a] px-3 text-xs text-[#8e9ba1] transition hover:border-[#5d6b72] hover:text-white">
                  <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  Add context
                </button>
              </div>
              <button type="button" onClick={handleSend} disabled={!inputText.trim() && !fileContent} className={`flex h-11 items-center justify-center gap-2 px-6 text-xs font-semibold transition ${inputText.trim() || fileContent ? 'bg-[#63d9f7] text-[#06232b] hover:bg-[#8be5fb]' : 'bg-[#2a3036] text-[#647178]'}`}>
                Start research
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-px border border-[#39434a] bg-[#39434a] md:grid-cols-3">
            {workflows.map((workflow, index) => (
              <button key={workflow.title} type="button" onClick={() => chooseWorkflow(workflow.depth, workflow.method)} className="group min-h-[150px] bg-[#0e1116] p-5 text-left transition hover:bg-[#151a20] sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-[0.16em] text-[#59676e]">0{index + 1}</span>
                  <span className="material-symbols-outlined text-[18px] text-[#58666d] transition group-hover:text-[#00b4d8]">{workflow.icon}</span>
                </div>
                <div className="mt-7 text-sm font-semibold text-white">{workflow.title}</div>
                <p className="mt-2 max-w-xs text-xs leading-5 text-[#718087]">{workflow.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#273036] pt-5 text-xs text-[#647178]">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <button type="button" onClick={() => chooseWorkflow('standard', 'adaptive')} className="hover:text-[#63d9f7]">Investigate something</button>
              <button type="button" onClick={() => chooseWorkflow('deep', 'comparative')} className="hover:text-[#63d9f7]">Compare options</button>
              <button type="button" onClick={() => chooseWorkflow('deep', 'evidence-map')} className="hover:text-[#63d9f7]">Stress-test an idea</button>
            </div>
            <button type="button" onClick={onOpenNotes} className="hover:text-[#63d9f7]">Open history →</button>
          </div>
        </section>
      </div>

      {toastMessage && <div className="fixed bottom-5 right-5 z-50 max-w-sm border border-[#00b4d8]/30 bg-[#171b21] px-4 py-3 text-xs text-white shadow-2xl">{toastMessage}</div>}
    </div>
  );
};
