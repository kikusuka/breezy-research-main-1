import React, { useState, useEffect, useRef } from 'react';
import { gitHubService, GitHubRepository, GitHubContent } from '../../services/gitHubService';

export const IdeWorkspaceView: React.FC = () => {
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token') || '');
  const [isConnected, setIsConnected] = useState<boolean>(Boolean(localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token')));
  
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [files, setFiles] = useState<GitHubContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Selected File States
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [fileSha, setFileSha] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>('Refactor codebase via Breezy IDE');

  // Terminal & Installed Packages State
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Breezy Workspace Sandbox [v1.0.0 - Preview Mode]',
    'Type "help" to list available operational commands.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [installedPackages, setInstalledPackages] = useState<string[]>(['lodash', 'typescript']);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch repositories if connected
  useEffect(() => {
    if (isConnected && githubToken) {
      setIsLoading(true);
      gitHubService.listRepositories(githubToken)
        .then((data) => setRepos(data))
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }
  }, [isConnected, githubToken]);

  // Load files when repo changes
  const handleSelectRepo = async (repoName: string) => {
    setSelectedRepo(repoName);
    setSelectedFilePath('');
    setEditorContent('');
    if (!repoName) {
      setFiles([]);
      return;
    }
    setIsLoading(true);
    try {
      const rootFiles = await gitHubService.listRepoContents(githubToken, repoName);
      setFiles(rootFiles);
    } catch (err) {
      console.error(err);
      setTerminalHistory((prev) => [...prev, `[system error] Failed to mount repository ${repoName}`]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load file detail into editor
  const handleSelectFile = async (filePath: string) => {
    if (!selectedRepo) return;
    setIsLoading(true);
    try {
      const details = await gitHubService.fetchFileDetails(githubToken, selectedRepo, filePath);
      setSelectedFilePath(filePath);
      setEditorContent(details.content);
      setFileSha(details.sha);
      setTerminalHistory((prev) => [...prev, `Mounted file: ${filePath} (SHA: ${details.sha.slice(0, 7)})`]);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to load file details: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Push changes to GitHub
  const handleCommitAndPush = async () => {
    if (!selectedRepo || !selectedFilePath || !githubToken) return;
    setIsSaving(true);
    try {
      const res = await gitHubService.updateFileContent(
        githubToken,
        selectedRepo,
        selectedFilePath,
        editorContent,
        fileSha,
        commitMessage
      );
      // Update local file SHA to prevent conflict on next save
      if (res.content?.sha) {
        setFileSha(res.content.sha);
      }
      setTerminalHistory((prev) => [
        ...prev,
        `[git commit] Committed changes to branch main: "${commitMessage}"`,
        `[git push] Successfully pushed commit to https://github.com/${selectedRepo}`
      ]);
      showToast('Code synchronized and committed to GitHub successfully.');
    } catch (err: any) {
      console.error(err);
      setTerminalHistory((prev) => [...prev, `[git error] Push rejected: ${err.message}`]);
      alert(`Commit failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Terminal actions simulator
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    let output: string[] = [`$ ${cmd}`];

    const args = cmd.split(' ');
    const primary = args[0].toLowerCase();

    if (primary === 'help') {
      output.push(
        'Available Workspace Commands:',
        '  npm install <pkg>   - [Preview] Simulate installing npm packages into sandbox',
        '  pip install <pkg>   - [Preview] Simulate installing python libraries',
        '  list packages       - List active packages currently mounted in sandbox',
        '  run                 - [Preview] Simulate execution of current editor content (No remote execution)',
        '  git status          - Inspect active changes for repository',
        '  git log             - [Preview] View sample commit history log',
        '  clear               - Clear terminal history output'
      );
    } else if (primary === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (primary === 'run') {
      if (!selectedFilePath) {
        output.push('Error: No active file in editor. Open a file first.');
      } else {
        output.push(
          `[preview] Executing simulation for: ${selectedFilePath}`,
          `[environment] Active packages: ${installedPackages.join(', ')}`,
          `------------------------------------------------`,
          `> Simulation Output:`,
          `[preview] Execution simulation completed for ${editorContent.split('\n').length} lines. No remote code was executed.`
        );
      }
    } else if (primary === 'npm' && args[1]?.toLowerCase() === 'install') {
      const pkgName = args.slice(2).join(' ') || 'pkg-temp';
      setInstalledPackages((prev) => [...prev, pkgName]);
      output.push(
        `[npm registry] Resolving package '${pkgName}'...`,
        `[preview] Package installation simulated. Added '${pkgName}' to temporary sandbox environment.`
      );
    } else if (primary === 'pip' && args[1]?.toLowerCase() === 'install') {
      const pkgName = args.slice(2).join(' ') || 'pkg-temp';
      setInstalledPackages((prev) => [...prev, pkgName]);
      output.push(
        `[pip registry] Resolving index for '${pkgName}'...`,
        `[preview] Package installation simulated. Added '${pkgName}' to temporary sandbox environment.`
      );
    } else if (primary === 'list' && args[1]?.toLowerCase() === 'packages') {
      output.push(`Currently Installed Packages (Temporary Sandbox):`, ...installedPackages.map((p) => `  - ${p}`));
    } else if (primary === 'git' && args[1]?.toLowerCase() === 'status') {
      if (!selectedRepo) {
        output.push('Error: No workspace repo is currently mounted.');
      } else {
        output.push(
          `On branch main`,
          `Your branch is up to date with 'origin/main'.`,
          selectedFilePath 
            ? `Changes not staged for commit:\n  (use "Commit" action in top panel to sync)\n\tmodified:   ${selectedFilePath}`
            : 'nothing to commit, working tree clean'
        );
      }
    } else if (primary === 'git' && args[1]?.toLowerCase() === 'log') {
      output.push(
        `[preview] Sample commit history (connect repository for live git history):`,
        `commit 248db1d (HEAD -> main, origin/main)`,
        `Author: Breezy Team <dev@breezy.io>`,
        `Date:   ${new Date().toLocaleString()}`,
        `    refactor: rename branding to Breezy and update migrations`,
        ``,
        `commit 1e4db9a`,
        `Author: Breezy Team <dev@breezy.io>`,
        `Date:   ${new Date(Date.now() - 86400000).toLocaleString()}`,
        `    feat: add execution preview and evidence graph grounding`
      );
    } else {
      output.push(`sh: command not found: ${primary}. Type "help" for a list of functional parameters.`);
    }

    setTerminalHistory((prev) => [...prev, ...output, '']);
    setTerminalInput('');
  };

  // Scroll terminal to bottom
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] text-stone-200 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-xl bg-[#1c2026] text-stone-100 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Workspace Sync</span>
            <span className="font-mono text-[11px] text-stone-400">{toastMessage}</span>
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1016] p-8 text-center">
          <div className="max-w-md flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-stone-400 border border-white/15">
              <span className="material-symbols-outlined text-[36px]">terminal</span>
            </div>
            <h2 className="text-xl font-serif text-stone-100 font-medium">Coding Sandbox Locked</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              If GitHub is not integrated, the application cannot write or run code. Register your Personal Access Token (PAT) inside Settings to deploy actual code files, browse directories, edit specs, and run simulations.
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>Coding capabilities unlock upon GitHub synchronization.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row bg-[#0d1016] min-h-0">
          {/* Files sidebar (Left Pane) */}
          <div className="w-full md:w-64 border-r border-white/5 flex flex-col bg-[#11141b] shrink-0">
            <div className="p-3 border-b border-white/5 flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase text-stone-500 font-bold tracking-widest">
                Active Repository
              </span>
              <select
                value={selectedRepo}
                onChange={(e) => handleSelectRepo(e.target.value)}
                className="w-full bg-[#1c212a] border border-white/10 rounded-lg p-2 text-xs text-stone-200 outline-none"
              >
                <option value="">-- Mount Repo --</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.full_name}>{r.full_name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold font-mono block px-2 mb-2">
                Workspace Files
              </span>
              {isLoading ? (
                <div className="py-8 text-center text-xs text-stone-500 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Fetching index...</span>
                </div>
              ) : files.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {files.map((file) => {
                    const isSelected = selectedFilePath === file.path;
                    return (
                      <button
                        key={file.path}
                        type="button"
                        disabled={file.type !== 'file'}
                        onClick={() => handleSelectFile(file.path)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                          isSelected
                            ? 'bg-white/10 text-stone-100 font-medium'
                            : 'text-stone-405 hover:bg-white/5 hover:text-stone-200 disabled:opacity-40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-stone-500 text-[16px]">
                          {file.type === 'dir' ? 'folder' : 'article'}
                        </span>
                        <span className="truncate flex-1">{file.name}</span>
                        {file.type === 'file' && (
                          <span className="text-[9px] text-stone-605 font-mono">{(file.size / 1024).toFixed(0)}K</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-stone-550 italic">
                  Select a repo above to view repository files.
                </div>
              )}
            </div>
          </div>

          {/* Code Workspace Editor and Terminal (Right Pane) */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Toolbar Panel */}
            <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between bg-[#11141b] shrink-0 text-xs">
              <div className="flex items-center gap-3 truncate pr-4">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">terminal</span>
                <span className="font-mono text-stone-300 font-semibold truncate">
                  {selectedFilePath ? `${selectedRepo}/${selectedFilePath}` : selectedRepo ? `${selectedRepo} (Mounted)` : 'Editor Workspace Empty'}
                </span>
                {selectedRepo && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <a
                      href={`https://stackblitz.com/github/${selectedRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded border border-blue-500/25 text-[10px] font-mono flex items-center gap-1 transition-all"
                      title="Launch actual online terminal and code container in StackBlitz"
                    >
                      <span className="material-symbols-outlined text-[11px]">bolt</span>
                      <span>StackBlitz Sandbox</span>
                    </a>
                    <a
                      href={`https://github.com/codespaces/new?repo=${selectedRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 rounded border border-violet-500/25 text-[10px] font-mono flex items-center gap-1 transition-all"
                      title="Launch full cloud virtual machine container in GitHub Codespaces"
                    >
                      <span className="material-symbols-outlined text-[11px]">cloud_queue</span>
                      <span>Codespaces VM</span>
                    </a>
                  </div>
                )}
              </div>

              {selectedFilePath && (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message"
                    className="bg-black/20 border border-white/10 rounded-lg p-1.5 text-[11px] text-stone-300 outline-none w-48"
                  />
                  <button
                    type="button"
                    onClick={handleCommitAndPush}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 font-sans text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">publish</span>
                        <span>Commit & Push</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Code Text Editor panel */}
            <div className="flex-1 bg-[#090b0f] p-4 flex flex-col min-h-0">
              {selectedFilePath ? (
                <div className="flex-1 flex gap-3 font-mono text-xs overflow-hidden">
                  {/* Line Numbers Simulation */}
                  <div className="text-stone-600 select-none text-right pr-2 border-r border-white/5 flex flex-col leading-relaxed select-none">
                    {Array.from({ length: Math.max(editorContent.split('\n').length, 1) }).map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  {/* Real interactive editor */}
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="flex-1 h-full bg-transparent text-stone-100 font-mono text-xs outline-none resize-none leading-relaxed overflow-y-auto"
                    placeholder="// Write or modify code specifications here..."
                    spellCheck="false"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 gap-2">
                  <span className="material-symbols-outlined text-[36px] text-stone-600">code_blocks</span>
                  <p className="text-xs">No active file in editor. Select a repo and choose a file to begin writing code.</p>
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            <div className="h-64 border-t border-white/5 bg-[#090b0f] flex flex-col shrink-0 min-h-0">
              {/* Terminal Tab Bar */}
              <div className="h-8 border-b border-white/5 bg-[#11141b] px-3 flex items-center justify-between text-[11px] font-mono shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-stone-400">wysiwyg</span>
                  <span className="text-stone-300 font-bold">Interactive Sandbox Terminal</span>
                </div>
                <div className="text-stone-550 flex items-center gap-2">
                  <span>Packages: {installedPackages.length} active</span>
                </div>
              </div>

              {/* Terminal Logs list */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] text-[#7bdb80] leading-relaxed flex flex-col gap-0.5 min-h-0">
                {terminalHistory.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Terminal Command Prompt */}
              <form onSubmit={handleTerminalCommand} className="h-10 border-t border-white/5 bg-[#11141b] px-3 flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-stone-400 font-semibold">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Type 'help' or run commands here (e.g. 'npm install lodash', 'run')..."
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-[#7bdb80] font-mono placeholder:text-stone-600"
                />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
