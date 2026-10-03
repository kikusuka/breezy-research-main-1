import React, { useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.css';

import { gitHubService, GitHubRepository, GitHubContent } from '../../services/gitHubService';

interface BreezyIdeWorkspaceProps {
  onOpenSettings?: () => void;
}

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
  const [selectedFilePath, setSelectedFilePath] = useState<string>(() => {
    const injected = localStorage.getItem('breezy_ide_active_code');
    return injected ? 'untitled.py' : '';
  });
  const [editorContent, setEditorContent] = useState<string>(() => {
    const injected = localStorage.getItem('breezy_ide_active_code');
    if (injected) {
      localStorage.removeItem('breezy_ide_active_code');
      return injected;
    }
    return '';
  });
  const [fileSha, setFileSha] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string>('Refactor codebase via Breezy IDE');

  // Active Center Workspace View Mode: 'files' | 'code' | 'preview' | 'terminal'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'files' | 'code' | 'preview' | 'terminal'>('files');
  const [currentDirectory, setCurrentDirectory] = useState<string>('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => Boolean(localStorage.getItem('breezy_github_token') || localStorage.getItem('synthexis_github_token')) && localStorage.getItem('breezy_github_onboarding_seen') !== '1');

  // Terminal Logs Search Filter State
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Terminal output state
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '\u001b[36mBreezy Embedded Sandbox Environment [ansi-prism]\u001b[0m',
    '\u001b[90mShortcuts: Cmd+K (Clear logs) | Cmd+Shift+Down (Jump to bottom)\u001b[0m',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Live Preview Console Logs Captured from Iframe
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pyodide local WASM states
  const [pyodideInstance, setPyodideInstance] = useState<any>(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState<boolean>(false);

  const loadPyodideRuntime = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).loadPyodide) {
        resolve((window as any).loadPyodide);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
      script.onload = () => {
        resolve((window as any).loadPyodide);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Pyodide WebAssembly script from CDN.'));
      };
      document.head.appendChild(script);
    });
  };

  const handleRunCodeLocally = async () => {
    if (selectedFilePath.endsWith('.py')) {
      setActiveWorkspaceTab('terminal');
      setTerminalHistory((prev) => [
        ...prev,
        `\u001b[36m[Python WASM Runtime]\u001b[0m Launching Pyodide local sandbox...`,
      ]);
      
      try {
        let loadFn = (window as any).loadPyodide;
        if (!loadFn) {
          setIsPyodideLoading(true);
          loadFn = await loadPyodideRuntime();
        }
        
        let py = pyodideInstance;
        if (!py) {
          setTerminalHistory((prev) => [
            ...prev,
            `\u001b[90m[WebAssembly] Downloading WebAssembly Python binaries (~6MB)...`
          ]);
          py = await loadFn({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
          });
          setPyodideInstance(py);
        }
        
        setIsPyodideLoading(false);
        setTerminalHistory((prev) => [
          ...prev,
          `\u001b[32m[WASM System] Pyodide initialized. Executing Python locally...`,
          `--------------------------------------------------`
        ]);

        // Intercept Python stdout & stderr
        py.setStdout({
          write: (text: string) => {
            const trimmed = text.replace(/\n$/, '');
            if (trimmed) {
              setTerminalHistory((prev) => [...prev, trimmed]);
            }
            return text.length;
          }
        });
        py.setStderr({
          write: (text: string) => {
            const trimmed = text.replace(/\n$/, '');
            if (trimmed) {
              setTerminalHistory((prev) => [...prev, `\u001b[31m${trimmed}\u001b[0m`]);
            }
            return text.length;
          }
        });

        const startTime = performance.now();
        await py.runPythonAsync(editorContent);
        const duration = ((performance.now() - startTime) / 1000).toFixed(2);

        setTerminalHistory((prev) => [
          ...prev,
          `--------------------------------------------------`,
          `\u001b[1m\u001b[32m[Execution Success]\u001b[0m Python script finished in ${duration}s.`
        ]);
        showToast('Python executed locally via WASM!');
      } catch (err: any) {
        setIsPyodideLoading(false);
        setTerminalHistory((prev) => [
          ...prev,
          `\u001b[31m❌ [Python Error]\u001b[0m ${err.message || err}`
        ]);
        showToast('Python execution failed.');
      }
    } else {
      // For HTML / JS Counter
      setActiveWorkspaceTab('preview');
      showToast('Live preview updated instantly!');
    }
  };

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

  // Handle Terminal Shortcuts (Cmd+K / Ctrl+K inside Terminal tab and Cmd+Shift+Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Only hijack Cmd+K / Ctrl+K if currently on the terminal tab, leaving it available for Command Palette elsewhere
      if (modKey && e.key.toLowerCase() === 'k' && activeWorkspaceTab === 'terminal') {
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
  }, [activeWorkspaceTab]);

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

  // Auto-scroll terminal output to bottom whenever logs change
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory, previewLogs]);

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

  // Read the real repository tree. Nothing is invented until a real GitHub repository is selected.
  const loadDirectory = async (repoName: string, path = '') => {
    if (!repoName) return;
    setIsLoading(true);
    try {
      const contents = await gitHubService.listRepoContents(githubToken, repoName, path);
      setFiles(contents);
      setCurrentDirectory(path);
    } catch (err) {
      console.error(err);
      showToast(`Could not read ${path || 'repository root'} from GitHub.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepo = async (repoName: string) => {
    setSelectedRepo(repoName);
    setSelectedFilePath('');
    setEditorContent('');
    setFileSha('');
    setCurrentDirectory('');
    setShowNewFile(false);
    setActiveWorkspaceTab('files');
    if (repoName) await loadDirectory(repoName);
  };

  const handleSelectDirectory = async (path: string) => {
    if (selectedRepo) await loadDirectory(selectedRepo, path);
  };

  const handleSelectFile = async (filePath: string) => {
    if (!selectedRepo) return;
    setIsLoading(true);
    try {
      const details = await gitHubService.fetchFileDetails(githubToken, selectedRepo, filePath);
      setSelectedFilePath(filePath);
      setEditorContent(details.content);
      setFileSha(details.sha);
      setActiveWorkspaceTab('code');
    } catch (err: any) {
      console.error(err);
      showToast(`Could not open ${filePath}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = () => {
    if (!selectedRepo) return;
    const cleanPath = newFilePath.trim().replace(/^\/+/, '');
    if (!cleanPath || cleanPath.endsWith('/')) {
      showToast('Enter a file path, for example src/example.ts');
      return;
    }
    setSelectedFilePath(currentDirectory ? `${currentDirectory}/${cleanPath}` : cleanPath);
    setEditorContent('');
    setFileSha('');
    setShowNewFile(false);
    setNewFilePath('');
    setActiveWorkspaceTab('code');
    showToast('New file ready. Write the code, then commit it to GitHub.');
  };

  // Push changes to GitHub
  const handleCommitAndPush = async () => {
    if (!selectedRepo || !selectedFilePath || !githubToken) {
      showToast('Choose a GitHub repository and file first.');
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
        `\u001b[32m[git commit] Saved to ${selectedRepo}/${selectedFilePath}\u001b[0m`
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
      if (event.source !== iframeRef.current?.contentWindow) return;
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
        '  \u001b[36mnpm install <pkg>\u001b[0m   - [Preview] Simulate installing npm packages into sandbox',
        '  \u001b[36mpip install <pkg>\u001b[0m   - [Preview] Simulate installing python libraries into sandbox',
        '  \u001b[36mlist packages\u001b[0m       - List active packages currently in sandbox',
        '  \u001b[36mrun\u001b[0m                 - Render current code in Live Preview runner',
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
        `\u001b[32m[preview runner]\u001b[0m Rendering ${selectedFilePath || 'scratchpad'} in live sandboxed preview...`,
        `\u001b[36m[environment]\u001b[0m Active packages: ${installedPackages.join(', ')}`,
        `\u001b[1m\u001b[32m[preview]\u001b[0m Live sandboxed preview updated.`
      );
    } else if (primary === 'npm' && args[1]?.toLowerCase() === 'install') {
      const pkgName = args.slice(2).join(' ') || 'pkg-temp';
      setInstalledPackages((prev) => [...prev, pkgName]);
      output.push(
        `\u001b[36m[npm registry]\u001b[0m Resolving package '${pkgName}'...`,
        `\u001b[33m[preview]\u001b[0m Package installation simulated. Added '${pkgName}' to temporary sandbox.`
      );
    } else if (primary === 'pip' && args[1]?.toLowerCase() === 'install') {
      const pkgName = args.slice(2).join(' ') || 'pkg-temp';
      setInstalledPackages((prev) => [...prev, pkgName]);
      output.push(
        `\u001b[36m[pip registry]\u001b[0m Resolving library '${pkgName}'...`,
        `\u001b[33m[preview]\u001b[0m Package installation simulated. Added '${pkgName}' to temporary sandbox.`
      );
    } else if (primary === 'list' && args[1]?.toLowerCase() === 'packages') {
      output.push(`\u001b[1mCurrently Installed Packages (Temporary Sandbox):\u001b[0m`, ...installedPackages.map((p) => `  - \u001b[36m${p}\u001b[0m`));
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

      <div className="h-12 border-b border-slate-800/80 bg-[#0d1117] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">code</span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">${selectedRepo || 'GitHub project'}</div>
            <div className="text-[10px] text-slate-500 truncate">${selectedFilePath || 'Select a file to begin'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          ${selectedRepo && (
            <button type="button" onClick={() => { setShowNewFile(true); setActiveWorkspaceTab('files'); }} className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 rounded-md cursor-pointer">New file</button>
          )}
          {!isConnected ? (
            <button type="button" onClick={() => {
              const token = prompt('Enter a GitHub Personal Access Token with repository contents read/write access.');
              if (token?.trim()) {
                localStorage.setItem('breezy_github_token', token.trim());
                setGithubToken(token.trim());
                setIsConnected(true);
                setShowOnboarding(true);
                showToast('GitHub connected.');
              }
            }} className="px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-950 rounded-md text-xs font-semibold cursor-pointer">Connect GitHub</button>
          ) : (
            <button type="button" onClick={handleDisconnect} className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-300 border border-slate-700 rounded-md cursor-pointer">Disconnect</button>
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#090d16]">
        {/* Left Sidebar: Repo / Files Browser */}
        <div className={`w-full md:w-64 border-r border-slate-800/80 flex flex-col bg-[#0b0f19] shrink-0 ${activeWorkspaceTab === 'files' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-3 border-b border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between md:block">
              <span className="font-mono text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                Repositories & Sources
              </span>
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('code')}
                className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-sky-400 text-[10px] font-bold border border-sky-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Back to IDE</span>
              </button>
            </div>
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
            {!selectedRepo ? (
              <div className="p-4 text-sm text-slate-400 leading-relaxed">
                <p className="text-slate-200 font-medium mb-1">Choose a repository</p>
                <p>Nothing is loaded into the editor until you select a real GitHub repository.</p>
              </div>
            ) : isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[16px] animate-spin">sync</span>Reading GitHub…</div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {currentDirectory && <button type="button" onClick={() => handleSelectDirectory(currentDirectory.split('/').slice(0,-1).join('/'))} className="w-full text-left px-2.5 py-2 text-xs text-slate-500 hover:text-slate-200 flex items-center gap-2 cursor-pointer"><span className="material-symbols-outlined text-[15px]">arrow_upward</span>Parent directory</button>}
                {files.map((file) => {
                  const isSelected = selectedFilePath === file.path;
                  return <button key={file.path} type="button" onClick={() => file.type === 'dir' ? handleSelectDirectory(file.path) : handleSelectFile(file.path)} className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center gap-2 cursor-pointer ${isSelected ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
                    <span className="material-symbols-outlined text-[16px] text-slate-500">{file.type === 'dir' ? 'folder' : 'description'}</span>
                    <span className="truncate flex-1 font-sans">{file.name}</span>
                  </button>;
                })}
                {files.length === 0 && <div className="py-8 text-center text-xs text-slate-500">This directory is empty.</div>}
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Panel: Code Editor with Prism.js vs Live Preview vs Terminal */}
        <div className={`flex-1 flex flex-col min-w-0 h-full bg-[#050811] ${activeWorkspaceTab === 'files' ? 'hidden md:flex' : 'flex'}`}>
          {/* Workspace Tab Switcher Header */}
          <div className="h-11 border-b border-slate-800/80 px-2 sm:px-4 bg-[#0d1322] flex items-center justify-between shrink-0 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1">
              {/* Files tab button on mobile screens */}
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('files')}
                className={`md:hidden px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'files'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">folder_open</span>
                <span>Files</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('code')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'code'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span className="hidden sm:inline">Code Editor</span>
                <span className="sm:hidden">Code</span>
              </button>

              <button
                type="button"
                onClick={() => selectedFilePath && setActiveWorkspaceTab('preview')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'preview'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span className="hidden sm:inline">Live Preview</span>
                <span className="sm:hidden">Preview</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
              </button>

              <button
                type="button"
                onClick={() => selectedFilePath && setActiveWorkspaceTab('terminal')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeWorkspaceTab === 'terminal'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">terminal</span>
                <span className="hidden sm:inline">ANSI Terminal ({previewLogs.length})</span>
                <span className="sm:hidden">Terminal</span>
              </button>

              <button
                type="button"
                onClick={handleRunCodeLocally}
                disabled={isPyodideLoading || !selectedFilePath}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md ml-3 shrink-0"
                title="Run the selected file locally"
              >
                {isPyodideLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px] font-bold">play_arrow</span>
                    <span>Run Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal Search Filter & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-2">
              <div className="flex items-center gap-1 bg-[#050811] border border-slate-700/80 rounded-lg px-2 py-1">
                <span className="material-symbols-outlined text-[13px] text-slate-400">search</span>
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-transparent border-0 outline-none text-[10px] font-mono text-slate-200 w-20 sm:w-32 placeholder:text-slate-500"
                />
              </div>

              {activeWorkspaceTab === 'terminal' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono border border-slate-700 transition-colors flex items-center gap-1"
                    title="Clear Terminal Output (Cmd+K)"
                  >
                    <span className="material-symbols-outlined text-[12px]">delete_sweep</span>
                    <span className="hidden sm:inline">Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    title="Jump to bottom (Cmd+Shift+Down)"
                  >
                    <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                  </button>
                </div>
              )}
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
              sandbox="allow-scripts allow-modals allow-forms"
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

            <div className="h-10 border-t border-slate-800/80 bg-[#0d1117] px-4 flex items-center text-[10px] text-slate-500">Output from real local runs and the live preview appears here.</div>
          </div>
        </div>
      </div>
      {showNewFile && selectedRepo && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11161d] border border-slate-700 rounded-lg shadow-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-100">Create a file</h2>
            <p className="text-xs text-slate-500 mt-1">The file will be created in the connected repository when you commit it.</p>
            <input autoFocus value={newFilePath} onChange={(e) => setNewFilePath(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()} placeholder="src/example.ts" className="w-full mt-4 bg-[#0b0f14] border border-slate-700 rounded-md px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-slate-500" />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowNewFile(false)} className="px-3 py-2 text-xs text-slate-400 hover:text-white cursor-pointer">Cancel</button>
              <button type="button" onClick={handleCreateFile} className="px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-950 rounded-md hover:bg-white cursor-pointer">Create</button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && isConnected && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#11161d] border border-slate-700 rounded-lg shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">GitHub connected</p>
              <h2 className="text-xl font-semibold text-slate-100">Your code lives in GitHub. Breezy edits it there.</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">There is no fake project or preloaded code here. Choose a repository and work on the files that actually exist.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3"><span className="text-slate-500 font-mono text-xs">01</span><div><p className="text-sm text-slate-200">Choose a repository</p><p className="text-xs text-slate-500 mt-1">Breezy reads the repository tree directly from GitHub.</p></div></div>
              <div className="flex gap-3"><span className="text-slate-500 font-mono text-xs">02</span><div><p className="text-sm text-slate-200">Open a real file</p><p className="text-xs text-slate-500 mt-1">Folders are navigable. Nothing is preloaded as a demo.</p></div></div>
              <div className="flex gap-3"><span className="text-slate-500 font-mono text-xs">03</span><div><p className="text-sm text-slate-200">Edit and preview</p><p className="text-xs text-slate-500 mt-1">HTML previews in the browser; Python can run locally through WebAssembly.</p></div></div>
              <div className="flex gap-3"><span className="text-slate-500 font-mono text-xs">04</span><div><p className="text-sm text-slate-200">Commit the change</p><p className="text-xs text-slate-500 mt-1">You choose the commit message and Breezy writes the change back to GitHub.</p></div></div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button type="button" onClick={() => { localStorage.setItem('breezy_github_onboarding_seen','1'); setShowOnboarding(false); }} className="px-4 py-2 bg-slate-100 text-slate-950 rounded-md text-xs font-semibold hover:bg-white cursor-pointer">Choose a repository</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
