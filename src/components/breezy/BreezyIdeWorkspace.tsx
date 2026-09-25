import React, { useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

import { gitHubService, GitHubRepository, GitHubContent } from '../../services/gitHubService';
import { cloudExecutionService, CloudJobStatus } from '../../services/cloudExecutionService';

interface BreezyIdeWorkspaceProps {
  onOpenSettings?: () => void;
}

const TEMPLATES = [
  {
    name: 'Python ML Training (Colab/Google Cloud)',
    filename: 'train_model.py',
    content: `# Ephemeral Google Cloud Execution Script
# Authenticated automatically via Google Account session

import time
import json

print("\u001b[36m[Google Cloud Session]\u001b[0m Initializing model training pipeline...")
time.sleep(1)

dataset = [
    {"epoch": 1, "loss": 0.542, "accuracy": 0.781},
    {"epoch": 2, "loss": 0.312, "accuracy": 0.894},
    {"epoch": 3, "loss": 0.189, "accuracy": 0.946},
]

print("\u001b[32m[Metrics] Training completed across 3 epochs.\u001b[0m")
print(json.dumps(dataset, indent=2))
`
  },
  {
    name: 'Tailwind Landing Page (HTML)',
    filename: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Breezy App Preview</title>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-6 font-sans">
  <div class="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-sky-500/30 shadow-2xl text-center backdrop-blur-xl">
    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)]">⚡</div>
    <h1 class="text-2xl font-bold mb-2 tracking-tight">Breezy Live IDE</h1>
    <p class="text-slate-400 text-xs mb-6 leading-relaxed">Edit code in the editor and view live execution instantly in the <strong>Live Preview</strong> runner tab.</p>
    <button onclick="triggerAlert()" class="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-bold text-xs transition-all shadow-[0_4px_16px_rgba(56,189,248,0.3)] cursor-pointer">
      Test Interactive Action
    </button>
  </div>

  <script>
    function triggerAlert() {
      console.log('Interactive button clicked successfully!');
      alert('Hello from Breezy Sandbox Live Preview!');
    }
    console.log('Breezy Live Preview script initialized and running.');
  </script>
</body>
</html>`
  },
  {
    name: 'Interactive Counter & Console (JS)',
    filename: 'counter.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Counter Sandbox</title>
</head>
<body class="bg-[#090d16] text-white p-8 flex flex-col items-center justify-center min-h-screen font-sans">
  <div class="p-8 bg-[#0d1322] border border-slate-800/80 rounded-2xl text-center shadow-2xl w-80">
    <h2 class="text-sm font-bold mb-2 text-sky-400 font-mono uppercase tracking-wider">Interactive Counter</h2>
    <p class="text-slate-400 text-[11px] mb-6">Test live DOM updates and console logging.</p>
    <div id="counter" class="text-5xl font-mono font-bold mb-6 text-white">0</div>
    <div class="flex gap-3">
      <button onclick="updateCount(-1)" class="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all cursor-pointer">-</button>
      <button onclick="updateCount(1)" class="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_2px_10px_rgba(56,189,248,0.3)] cursor-pointer">+</button>
    </div>
  </div>

  <script>
    let count = 0;
    function updateCount(delta) {
      count += delta;
      document.getElementById('counter').innerText = count;
      console.log('Counter updated:', count);
    }
    console.log('Counter sandbox mounted.');
  </script>
</body>
</html>`
  }
];

// Helper to parse ANSI Escape sequences into React Spans
const renderAnsiLine = (text: string) => {
  const ansiRegex = /\u001b\[([0-9;]+)m|\x1b\[([0-9;]+)m/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let currentColor = '';
  let isBold = false;
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(text)) !== null) {
    const plainText = text.substring(lastIndex, match.index);
    if (plainText) {
      parts.push(
        <span key={`p-${lastIndex}`} className={`${currentColor} ${isBold ? 'font-bold' : ''}`}>
          {plainText}
        </span>
      );
    }

    const code = match[1] || match[2];
    const codes = code.split(';');
    for (const c of codes) {
      if (c === '0') { currentColor = ''; isBold = false; }
      else if (c === '1') { isBold = true; }
      else if (c === '31') { currentColor = 'text-red-400'; }
      else if (c === '32') { currentColor = 'text-emerald-400'; }
      else if (c === '33') { currentColor = 'text-amber-400'; }
      else if (c === '34') { currentColor = 'text-blue-400'; }
      else if (c === '35') { currentColor = 'text-fuchsia-400'; }
      else if (c === '36') { currentColor = 'text-sky-400'; }
      else if (c === '37') { currentColor = 'text-slate-200'; }
      else if (c === '90') { currentColor = 'text-slate-500'; }
    }

    lastIndex = ansiRegex.lastIndex;
  }

  const remaining = text.substring(lastIndex);
  if (remaining) {
    parts.push(
      <span key={`r-${lastIndex}`} className={`${currentColor} ${isBold ? 'font-bold' : ''}`}>
        {remaining}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
};

export const BreezyIdeWorkspace: React.FC<BreezyIdeWorkspaceProps> = ({ onOpenSettings }) => {
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token') || '';
  });
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token'));
  });
  
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [files, setFiles] = useState<GitHubContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Selected File States
  const [selectedFilePath, setSelectedFilePath] = useState<string>(TEMPLATES[0].filename);
  const [editorContent, setEditorContent] = useState<string>(TEMPLATES[0].content);
  const [fileSha, setFileSha] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>('Refactor codebase via Breezy IDE');

  // Active Center Workspace View Mode: 'code' | 'preview' | 'terminal'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'code' | 'preview' | 'terminal'>('code');

  // Background Cloud Jobs State
  const [activeCloudJob, setActiveCloudJob] = useState<CloudJobStatus | null>(null);

  // Terminal Logs Search Filter State
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Terminal & Installed Packages State
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '\u001b[36mBreezy Embedded Sandbox Environment [v3.9.0-ansi-prism]\u001b[0m',
    '\u001b[90mShortcuts: Cmd+K (Clear logs) | Cmd+Shift+Down (Jump to bottom)\u001b[0m',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [installedPackages, setInstalledPackages] = useState<string[]>(['lodash', 'typescript', '@google/genai', 'tailwindcss']);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Live Preview Console Logs Captured from Iframe
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Clear Terminal & Preview Logs
  const handleClearLogs = () => {
    setTerminalHistory([
      '\u001b[36m[Terminal Reset]\u001b[0m Output view cleared.',
      ''
    ]);
    setPreviewLogs([]);
    showToast('Terminal logs cleared (Cmd+K).');
  };

  // Filter terminal history based on logSearchQuery
  const filteredTerminalHistory = useMemo(() => {
    if (!logSearchQuery.trim()) return terminalHistory;
    const q = logSearchQuery.toLowerCase();
    return terminalHistory.filter((line) => line.toLowerCase().includes(q));
  }, [terminalHistory, logSearchQuery]);

  // Filter preview logs based on logSearchQuery
  const filteredPreviewLogs = useMemo(() => {
    if (!logSearchQuery.trim()) return previewLogs;
    const q = logSearchQuery.toLowerCase();
    return previewLogs.filter((log) => log.toLowerCase().includes(q));
  }, [previewLogs, logSearchQuery]);

  // Handle Terminal Shortcuts (Cmd+K / Ctrl+K and Cmd+Shift+Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleClearLogs();
      }

      if (modKey && e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveWorkspaceTab('terminal');
        terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        showToast('Jumped to bottom of log output.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine language for Prism highlighting
  const prismLanguage = useMemo(() => {
    if (selectedFilePath.endsWith('.py')) return 'python';
    if (selectedFilePath.endsWith('.ts') || selectedFilePath.endsWith('.tsx')) return 'typescript';
    if (selectedFilePath.endsWith('.js') || selectedFilePath.endsWith('.jsx')) return 'javascript';
    if (selectedFilePath.endsWith('.json')) return 'json';
    if (selectedFilePath.endsWith('.css')) return 'css';
    return 'html';
  }, [selectedFilePath]);

  // Highlighted code HTML generated via Prism.js
  const highlightedCodeHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[prismLanguage] || Prism.languages.html;
      return Prism.highlight(editorContent, grammar, prismLanguage);
    } catch (e) {
      return editorContent;
    }
  }, [editorContent, prismLanguage]);

  // Subscribe to background cloud job updates
  useEffect(() => {
    const unsubscribe = cloudExecutionService.subscribe((updatedJob) => {
      setActiveCloudJob(updatedJob);
      setTerminalHistory((prev) => [...prev, ...updatedJob.logs.slice(-2)]);
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll terminal output to bottom whenever logs change
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory, previewLogs]);

  const handleRunBackgroundCloudJob = (runtimeTarget: 'colab' | 'google_cloud') => {
    showToast(`Dispatching ${selectedFilePath} using Google Account Session (${runtimeTarget.toUpperCase()})...`);
    cloudExecutionService.executeInBackground(selectedFilePath, editorContent, {
      runtime: runtimeTarget,
      gpuAccelerator: 'T4',
      autoPurgeMinutes: 2,
      autoFixOnFailure: true,
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem('breezy_github_token');
    localStorage.removeItem('synthexis_github_token');
    setGithubToken('');
    setIsConnected(false);
    setRepos([]);
    setSelectedRepo('');
    setFiles([]);
    setSelectedFilePath('');
    setEditorContent('');
    showToast('GitHub disconnected.');
  };

  // Load repositories if connected
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
      setTerminalHistory((prev) => [...prev, `\u001b[31m[system error] Failed to mount repository ${repoName}\u001b[0m`]);
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
      setActiveWorkspaceTab('code');
      setTerminalHistory((prev) => [...prev, `\u001b[36mMounted file:\u001b[0m ${filePath} (SHA: ${details.sha.slice(0, 7)})`]);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to load file details: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Template
  const handleSelectTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedFilePath(tpl.filename);
    setEditorContent(tpl.content);
    setSelectedRepo('');
    setActiveWorkspaceTab(tpl.filename.endsWith('.html') ? 'preview' : 'code');
    showToast(`Loaded template: ${tpl.name}`);
  };

  // Push changes to GitHub
  const handleCommitAndPush = async () => {
    if (!selectedRepo || !selectedFilePath || !githubToken) {
      alert('No GitHub repository currently mounted. Use templates or connect GitHub repository first.');
      return;
    }
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
      if (res.content?.sha) {
        setFileSha(res.content.sha);
      }
      setTerminalHistory((prev) => [
        ...prev,
        `\u001b[32m[git commit] Committed changes to branch main: "${commitMessage}"\u001b[0m`,
        `\u001b[32m[git push] Successfully pushed commit to https://github.com/${selectedRepo}\u001b[0m`
      ]);
      showToast('Code synchronized and committed to GitHub successfully.');
    } catch (err: any) {
      console.error(err);
      setTerminalHistory((prev) => [...prev, `\u001b[31m[git error] Push rejected: ${err.message}\u001b[0m`]);
      alert(`Commit failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Sandboxed HTML content with console interceptor for live preview
  const previewSrcDoc = useMemo(() => {
    if (!editorContent) return '<div style="color: #64748b; font-family: monospace; padding: 2rem; text-align: center;">No code to preview.</div>';
    
    const consoleInterceptor = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          function sendToParent(type, args) {
            try {
              window.parent.postMessage({
                type: 'BREEZY_CONSOLE',
                logType: type,
                message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
              }, '*');
            } catch(e) {}
          }

          console.log = function(...args) {
            originalLog.apply(console, args);
            sendToParent('log', args);
          };
          console.error = function(...args) {
            originalError.apply(console, args);
            sendToParent('error', args);
          };
          console.warn = function(...args) {
            originalWarn.apply(console, args);
            sendToParent('warn', args);
          };

          window.addEventListener('error', function(e) {
            sendToParent('error', [e.message + ' at ' + e.filename + ':' + e.lineno]);
          });
        })();
      </script>
    `;

    if (editorContent.includes('</html>') || editorContent.includes('<!DOCTYPE')) {
      return editorContent.replace('</head>', consoleInterceptor + '</head>');
    } else {
      return `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>${consoleInterceptor}</head><body class="bg-slate-950 text-white p-6 font-sans"><div id="root">${editorContent}</div></body></html>`;
    }
  }, [editorContent]);

  // Listen for console messages from iframe preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BREEZY_CONSOLE') {
        const prefix = event.data.logType === 'error' ? '\u001b[31m❌ [preview error]\u001b[0m' : event.data.logType === 'warn' ? '\u001b[33m⚠️ [preview warn]\u001b[0m' : '\u001b[36mℹ️ [preview log]\u001b[0m';
        setPreviewLogs((prev) => [...prev, `${prefix} ${event.data.message}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
        '\u001b[1mAvailable Breezy Sandbox Commands:\u001b[0m',
        '  \u001b[36mnpm install <pkg>\u001b[0m   - Install npm packages temporarily into sandbox',
        '  \u001b[36mpip install <pkg>\u001b[0m   - Install python libraries temporarily',
        '  \u001b[36mlist packages\u001b[0m       - List active packages currently mounted in sandbox',
        '  \u001b[36mrun\u001b[0m                 - Execute current editor code in live preview runner',
        '  \u001b[36mgit status\u001b[0m          - Inspect active changes for repository',
        '  \u001b[36mclear\u001b[0m               - Clear terminal history output (or Cmd+K)'
      );
    } else if (primary === 'clear') {
      handleClearLogs();
      setTerminalInput('');
      return;
    } else if (primary === 'run') {
      setActiveWorkspaceTab('preview');
      output.push(
        `\u001b[32m[sandbox execution]\u001b[0m Executing ${selectedFilePath || 'scratchpad'} in live preview runner...`,
        `\u001b[36m[environment]\u001b[0m Active packages: ${installedPackages.join(', ')}`,
        `\u001b[1m\u001b[32mSUCCESS:\u001b[0m Live preview updated.`
      );
    } else if (primary === 'npm' && args[1]?.toLowerCase() === 'install') {
      const pkgName = args.slice(2).join(' ') || 'pkg-temp';
      setInstalledPackages((prev) => [...prev, pkgName]);
      output.push(
        `\u001b[36m[npm registry]\u001b[0m Resolving package '${pkgName}'...`,
        `\u001b[32m+ ${pkgName}@latest\u001b[0m mounted in current sandbox environment.`
      );
    } else if (primary === 'pip' && args[1]?.toLowerCase() === 'install') {
      const pkgName = args.slice(2).join(' ') || 'pkg-temp';
      setInstalledPackages((prev) => [...prev, pkgName]);
      output.push(
        `\u001b[36m[pip registry]\u001b[0m Installing '${pkgName}' into Google Account Session sandbox...`,
        `\u001b[32mSUCCESS:\u001b[0m Installed ${pkgName}`
      );
    } else if (primary === 'list' && args[1]?.toLowerCase() === 'packages') {
      output.push(`\u001b[1mCurrently Installed Packages:\u001b[0m`, ...installedPackages.map((p) => `  - \u001b[36m${p}\u001b[0m`));
    } else {
      output.push(`\u001b[31msh: command not found: ${primary}. Type "help" for available commands.\u001b[0m`);
    }

    setTerminalHistory((prev) => [...prev, ...output, '']);
    setTerminalInput('');
  };

  return (
    <div className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] bg-[#090d16] text-slate-100 font-sans antialiased overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-2xl bg-[#0d1322] text-slate-100 shadow-2xl flex items-center gap-3 border border-sky-500/30 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-sky-400 text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Breezy Live IDE</span>
            <span className="font-mono text-[11px] text-slate-400">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner / Quick Templates Bar */}
      <div className="h-12 border-b border-slate-800/80 bg-[#0d1322] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-sky-400 text-[18px]">code</span>
          <span className="font-sans text-xs font-bold text-slate-200">
            {selectedRepo ? `Repo: ${selectedRepo} (${selectedFilePath || 'Select file'})` : `Scratchpad: ${selectedFilePath}`}
          </span>
          <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-mono">Quick Templates:</span>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.filename}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono transition-all cursor-pointer"
              >
                {tpl.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Background Cloud Execution Bar (Google Session) */}
        <div className="flex items-center gap-2">
          {activeCloudJob && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-sky-500/30 text-[10px] font-mono text-sky-300">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span>
                {activeCloudJob.runtime.toUpperCase()}: {activeCloudJob.state}
                {activeCloudJob.storagePurged && ' (Drive Clean)'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleRunBackgroundCloudJob('colab')}
            className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-mono text-[11px] border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all"
            title="Dispatch job using Google Account session"
          >
            <span className="material-symbols-outlined text-[14px]">cloud_sync</span>
            <span>Run Colab (Google Auth)</span>
          </button>

          {selectedRepo && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-700">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                className="bg-[#050811] border border-slate-700/85 rounded-xl px-3 py-1 text-[11px] text-slate-200 outline-none w-32 focus:border-sky-400/50"
              />
              <button
                type="button"
                onClick={handleCommitAndPush}
                disabled={isSaving}
                className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">publish</span>
                <span>Push</span>
              </button>
            </div>
          )}

          {!isConnected ? (
            <button
              type="button"
              onClick={() => {
                const token = prompt('Enter your GitHub Personal Access Token (PAT):');
                if (token) {
                  localStorage.setItem('breezy_github_token', token.trim());
                  setGithubToken(token.trim());
                  setIsConnected(true);
                  showToast('GitHub connected.');
                }
              }}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono text-[11px] flex items-center gap-1.5 cursor-pointer border border-sky-500/20"
            >
              <span className="material-symbols-outlined text-[14px]">key</span>
              <span>Connect GitHub</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-[10px] cursor-pointer border border-red-500/20"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#090d16]">
        {/* Left Sidebar: Repo / Files Browser */}
        <div className="w-full md:w-64 border-r border-slate-800/80 flex flex-col bg-[#0b0f19] shrink-0">
          <div className="p-3 border-b border-slate-800/80 flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider">
              Repositories & Sources
            </span>
            <select
              value={selectedRepo}
              onChange={(e) => handleSelectRepo(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700/80 rounded-xl p-2 text-xs text-slate-200 outline-none focus:border-sky-400/50"
            >
              <option value="">-- Local Scratchpad / Templates --</option>
              {repos.map((r) => (
                <option key={r.id} value={r.full_name}>{r.full_name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono block px-2 mb-2">
              {selectedRepo ? 'Repository Files' : 'Available Templates'}
            </span>
            {selectedRepo ? (
              isLoading ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] animate-spin text-sky-400">sync</span>
                  <span>Loading index...</span>
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
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/15 text-sky-300 font-medium border border-sky-500/30'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 disabled:opacity-40'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-sky-400' : 'text-slate-500'}`}>
                          {file.type === 'dir' ? 'folder' : 'article'}
                        </span>
                        <span className="truncate flex-1 font-sans">{file.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 italic">No files found.</div>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.filename}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                      selectedFilePath === tpl.filename
                        ? 'bg-sky-500/15 text-sky-300 font-medium border border-sky-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60 bg-slate-900/40 border border-slate-800/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-sky-400">code_blocks</span>
                    <div className="flex flex-col truncate">
                      <span className="font-sans font-semibold text-white truncate">{tpl.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{tpl.filename}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Panel: Code Editor with Prism.js vs Live Preview vs Terminal */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-[#050811]">
          {/* Workspace Tab Switcher Header */}
          <div className="h-11 border-b border-slate-800/80 px-4 bg-[#0d1322] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('code')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'code'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span>Code Editor (Prism.js)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('preview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'preview'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span>Live Preview (Runner)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1"></span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('terminal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'terminal'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">terminal</span>
                <span>ANSI Terminal & Logs ({previewLogs.length})</span>
              </button>
            </div>

            {/* Terminal Search Filter & Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#050811] border border-slate-700/80 rounded-lg px-2 py-1">
                <span className="material-symbols-outlined text-[13px] text-slate-400">search</span>
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-transparent border-0 outline-none text-[10px] font-mono text-slate-200 w-24 sm:w-32 placeholder:text-slate-500"
                />
                {logSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLogSearchQuery('')}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearLogs}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-[10px] font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                title="Reset terminal history and preview logs (Cmd+K)"
              >
                <span className="material-symbols-outlined text-[13px] text-amber-400">cleaning_services</span>
                <span>Clear Logs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveWorkspaceTab('terminal');
                  terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/80 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                title="Jump to bottom (Cmd+Shift+Down)"
              >
                <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
              </button>
            </div>
          </div>

          {/* Tab Content 1: Prism.js Syntax-Highlighted Code Editor */}
          <div className={`flex-1 flex flex-col min-h-0 ${activeWorkspaceTab === 'code' ? 'flex' : 'hidden'}`}>
            <div className="flex-1 flex p-4 font-mono text-xs overflow-hidden bg-[#050811] relative">
              {/* Line Numbers Column */}
              <div className="text-slate-600 select-none text-right pr-3 border-r border-slate-800/80 flex flex-col leading-relaxed z-10">
                {Array.from({ length: Math.max(editorContent.split('\n').length, 1) }).map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>

              {/* Prism Dual Overlay Editor Container */}
              <div className="flex-1 relative h-full ml-4 overflow-auto">
                <pre
                  aria-hidden="true"
                  className="absolute top-0 left-0 w-full h-full m-0 p-0 font-mono text-xs leading-relaxed pointer-events-none whitespace-pre overflow-hidden bg-transparent"
                  dangerouslySetInnerHTML={{ __html: highlightedCodeHtml + '<br/>' }}
                />
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="absolute top-0 left-0 w-full h-full m-0 p-0 bg-transparent text-transparent caret-sky-400 font-mono text-xs outline-none resize-none leading-relaxed whitespace-pre overflow-auto"
                  placeholder="// Write or edit code with Prism.js syntax highlighting..."
                  spellCheck="false"
                />
              </div>
            </div>
          </div>

          {/* Tab Content 2: Live Preview Runner */}
          <div className={`flex-1 flex flex-col min-h-0 bg-white ${activeWorkspaceTab === 'preview' ? 'flex' : 'hidden'}`}>
            <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-slate-300 text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-emerald-400">play_circle</span>
                <span>Live Sandboxed Runner (Active Iframe View)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.srcdoc = previewSrcDoc;
                    showToast('Live preview reloaded.');
                  }
                }}
                className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">refresh</span>
                <span>Reload Runner</span>
              </button>
            </div>
            <iframe
              ref={iframeRef}
              srcDoc={previewSrcDoc}
              title="Breezy Live Preview Runner"
              className="flex-1 w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            />
          </div>

          {/* Tab Content 3: ANSI Terminal & Process Logs */}
          <div className={`flex-1 flex flex-col min-h-0 bg-[#070b14] ${activeWorkspaceTab === 'terminal' ? 'flex' : 'hidden'}`}>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed flex flex-col gap-1.5 min-h-0 bg-[#050811] scroll-smooth">
              <div className="flex items-center justify-between text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">
                <span>Background Execution Stream & ANSI Terminal:</span>
                {logSearchQuery && (
                  <span className="text-amber-400 font-mono text-[10px] normal-case">
                    Filtered by "{logSearchQuery}"
                  </span>
                )}
              </div>
              {filteredTerminalHistory.map((line, index) => (
                <div key={`term-${index}`} className="whitespace-pre-wrap font-mono text-slate-200">
                  {renderAnsiLine(line)}
                </div>
              ))}
              {filteredPreviewLogs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="text-emerald-400 uppercase tracking-wider text-[10px] font-bold mb-2">
                    Console Output Stream (Iframe):
                  </div>
                  {filteredPreviewLogs.map((log, i) => (
                    <div key={`log-${i}`} className="whitespace-pre-wrap font-mono bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-500/20 mb-1 text-[11px]">
                      {renderAnsiLine(log)}
                    </div>
                  ))}
                </div>
              )}
              <div ref={terminalBottomRef} />
            </div>

            <form onSubmit={handleTerminalCommand} className="h-12 border-t border-slate-800/80 bg-[#0d1322] px-4 flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-sky-400 font-semibold">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type 'help', 'run', 'npm install <pkg>', 'pip install <pkg>'..."
                className="flex-1 bg-transparent border-0 outline-none text-xs text-sky-300 font-mono placeholder:text-slate-600"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
