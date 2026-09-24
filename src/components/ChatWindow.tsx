import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  History,
  Plus,
  ArrowUpRight,
  Columns,
  FileText,
  Sidebar,
  Compass,
  ArrowRight,
  Copy,
  Check,
  Printer,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  DebateStep,
  HeartbeatState,
  DebateSession,
  SessionSnapshot,
} from '../types';
import { PromptInput } from './PromptInput';
import { FinalAnswerCard } from './FinalAnswerCard';
import { DeliberationBlock } from './DeliberationBlock';
import { ExportTranscriptMenu } from './ExportTranscriptMenu';
import { SessionCompareModal } from './SessionCompareModal';

interface ChatWindowProps {
  currentPrompt: string;
  isDeliberating: boolean;
  activeRound?: number;
  steps: DebateStep[];
  finalOutput?: string;
  heartbeat?: HeartbeatState;
  protocol: string;
  metrics?: {
    durationMs: number;
    consensusRate: number;
    contentionLevel: string;
    resolvedPointsCount: number;
  };
  sessions?: DebateSession[];
  activeSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onStartDebate: (promptText: string) => void;
  onCancel?: () => void;
  onCancelDebate?: () => void;
  onNewDebate?: () => void;
  onOpenHistory?: () => void;
  onOpenCouncilWindow?: () => void;
  onRestoreSnapshot?: (snapshot: SessionSnapshot) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentPrompt,
  isDeliberating,
  activeRound,
  steps,
  finalOutput,
  heartbeat,
  protocol,
  metrics,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onStartDebate,
  onCancel,
  onCancelDebate,
  onNewDebate,
  onOpenHistory,
  onOpenCouncilWindow,
  onRestoreSnapshot,
}) => {
  const cancelHandler = onCancel || onCancelDebate;
  const [isExecSummaryOpen, setIsExecSummaryOpen] = useState(false);
  const [isSourcesSidebarOpen, setIsSourcesSidebarOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [ignoredSourceUrls, setIgnoredSourceUrls] = useState<string[]>([]);

  const handleToggleIgnoreUrl = (url: string) => {
    setIgnoredSourceUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const computeExecSummaryText = () => {
    if (!steps || steps.length === 0) {
      return 'No response turns recorded yet.';
    }

    const synthesizerStep = steps.find((s) => s.role === 'synthesizer');
    if (synthesizerStep?.content) {
      const cleanStep = synthesizerStep.content
        .replace(/^#+\s*/gm, '')
        .replace(/\*\*/g, '')
        .slice(0, 320);
      return `EXECUTIVE SUMMARY: ${cleanStep}...`;
    }

    return `EXECUTIVE SUMMARY: In evaluating "${currentPrompt}", models reviewed design constraints and edge cases across ${steps.length} turns, arriving at an optimal consensus path with ${metrics?.consensusRate || 85}% agreement.`;
  };
  
  const [localSnapshots, setLocalSnapshots] = useState<SessionSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('synthexis_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveSnapshot = (name: string) => {
    const protoVal = (activeSession?.protocol || protocol) as 'trio' | 'quad' | 'duel' | 'solo';
    const newSnap: SessionSnapshot = {
      id: `snap-${Date.now()}`,
      sessionId: activeSessionId || 'sandbox',
      name: name || `Checkpoint at ${new Date().toLocaleTimeString()}`,
      prompt: currentPrompt,
      protocol: protoVal,
      steps: JSON.parse(JSON.stringify(steps)),
      finalOutput,
      timestamp: Date.now(),
    };
    const nextSnaps = [newSnap, ...localSnapshots];
    setLocalSnapshots(nextSnaps);
    localStorage.setItem('synthexis_snapshots', JSON.stringify(nextSnaps));
  };

  const extractCitations = () => {
    const list: { title: string; url: string; id: string }[] = [];
    const seen = new Set<string>();

    steps.forEach((step) => {
      const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
      let match;
      while ((match = mdRegex.exec(step.content)) !== null) {
        const title = match[1].trim();
        const url = match[2].trim();
        if (!seen.has(url)) {
          seen.add(url);
          list.push({ title, url, id: url });
        }
      }

      const rawRegex = /(https?:\/\/[^\s<]+)/g;
      let rawMatch;
      while ((rawMatch = rawRegex.exec(step.content)) !== null) {
        const url = rawMatch[1].trim().replace(/[).,;:]$/, '');
        if (!seen.has(url) && !url.includes(')') && !url.includes(']')) {
          seen.add(url);
          let title = url;
          try {
            const parsed = new URL(url);
            title = parsed.hostname.replace('www.', '');
          } catch {}
          list.push({ title, url, id: url });
        }
      }
    });

    return list;
  };

  const citations = extractCitations();
  const hasStarted = Boolean(currentPrompt || isDeliberating || finalOutput);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      id="chat-window-container"
      className="relative flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden transition-all"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300">
            <MessageSquare className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-slate-200">
            Chat & Analysis Window
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            / Protocol: {activeSession?.protocol || protocol}
          </span>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {hasStarted && steps.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const name = prompt('Enter a name for this checkpoint branch:', `Snapshot - Round ${steps.length}`);
                if (name !== null) {
                  handleSaveSnapshot(name);
                }
              }}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              title="Save snapshot"
            >
              <span>💾 Save Checkpoint</span>
            </button>
          )}

          {citations.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSourcesSidebarOpen(!isSourcesSidebarOpen)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
                isSourcesSidebarOpen
                  ? 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300'
                  : 'border-slate-800 bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sidebar className="h-3 w-3" />
              <span>Sources ({citations.length - ignoredSourceUrls.length}/{citations.length})</span>
            </button>
          )}

          {hasStarted && steps.length > 0 && (
            <ExportTranscriptMenu
              debate={{
                prompt: currentPrompt || activeSession?.prompt || 'Research Inquiry',
                protocol: activeSession?.protocol || protocol,
                createdAt: activeSession?.createdAt,
                steps,
                finalOutput,
                metrics,
              }}
              variant="secondary"
            />
          )}

          {hasStarted && (
            <button
              type="button"
              onClick={() => setIsExecSummaryOpen(!isExecSummaryOpen)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all ${
                isExecSummaryOpen
                  ? 'border-slate-700 bg-slate-800 text-slate-100 shadow-xs'
                  : 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="h-3 w-3 text-amber-400" />
              <span>Executive Summary</span>
            </button>
          )}

          {sessions.length >= 2 && (
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Columns className="h-3 w-3 text-indigo-400" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <History className="h-3 w-3 text-slate-400" />
              <span className="hidden sm:inline">Transcripts</span>
            </button>
          )}

          {onNewDebate && hasStarted && (
            <button
              type="button"
              onClick={onNewDebate}
              className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3 w-3 text-slate-400" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {onOpenCouncilWindow && (
            <button
              type="button"
              onClick={onOpenCouncilWindow}
              className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <span>Analysis Trace</span>
              <ArrowUpRight className="h-3 w-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 min-w-0">
          {!hasStarted ? (
            /* Empty State Intro */
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center max-w-xl mx-auto py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80 text-blue-400 mb-4 shadow-xs">
                <Compass className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-100 mb-2">
                Research & Analysis Workspace
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md mb-8">
                Ask a technical question, architecture design proposal, or strategy trade-off. Dynamic models will analyze assumptions and synthesize a clear answer.
              </p>

              {/* Previous Sessions */}
              {sessions.length > 0 && onSelectSession && (
                <div className="w-full text-left space-y-2 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1.5">
                      <History className="h-3 w-3 text-slate-400" />
                      Previous Sessions
                    </span>
                    {onOpenHistory && (
                      <button
                        type="button"
                        onClick={onOpenHistory}
                        className="text-slate-400 hover:text-slate-200 transition-colors lowercase"
                      >
                        browse all ({sessions.length})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {sessions.slice(0, 3).map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => onSelectSession(session.id)}
                        className="group flex items-center justify-between gap-3 w-full rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-left transition-all hover:border-slate-700 hover:bg-slate-900"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors leading-relaxed">
                            {session.prompt}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                            <span className="uppercase">{session.protocol}</span>
                            <span>•</span>
                            <span>{session.steps?.length || 0} turns</span>
                            {session.metrics?.consensusRate && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400">
                                  {session.metrics.consensusRate}% agreement
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Executive Summary Card */}
              {isExecSummaryOpen && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-semibold text-amber-300 uppercase tracking-wider text-[10px] font-mono">
                      Executive Summary
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExecSummaryOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans">
                    {computeExecSummaryText()}
                  </p>
                </div>
              )}

              {/* Prompt Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Question / Hypothesis
                </span>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {currentPrompt}
                </p>
              </div>

              {/* Deliberation Turns */}
              {steps.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Model Analysis Turns
                  </span>
                  <DeliberationBlock
                    steps={steps}
                    isDeliberating={isDeliberating}
                    activeRound={activeRound}
                  />
                </div>
              )}

              {/* Final Answer */}
              {finalOutput && (
                <FinalAnswerCard
                  content={finalOutput}
                  prompt={currentPrompt}
                  protocol={protocol}
                  steps={steps}
                  metrics={metrics}
                />
              )}
            </div>
          )}
        </div>

        {/* Grounding Sources Sidebar */}
        {isSourcesSidebarOpen && citations.length > 0 && (
          <div className="w-64 border-l border-slate-800 bg-slate-900 p-4 space-y-3 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200">
                Grounding Sources
              </span>
              <button
                type="button"
                onClick={() => setIsSourcesSidebarOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {citations.map((c) => {
                const isIgnored = ignoredSourceUrls.includes(c.url);
                return (
                  <div
                    key={c.id}
                    className={`rounded-lg border p-2.5 space-y-1 transition-all ${
                      isIgnored
                        ? 'border-slate-800 bg-slate-950/40 opacity-50'
                        : 'border-slate-800 bg-slate-950/80'
                    }`}
                  >
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-400 hover:underline block truncate"
                    >
                      {c.title}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleToggleIgnoreUrl(c.url)}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200"
                    >
                      {isIgnored ? 'Include source' : 'Exclude source'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Input Bar */}
      <div className="border-t border-slate-800 bg-slate-900/95 p-4 backdrop-blur-md">
        <PromptInput
          onStartDebate={onStartDebate}
          isDeliberating={isDeliberating}
          onCancel={onCancelDebate}
        />
      </div>

      {/* Compare Sessions Modal */}
      <SessionCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        sessions={sessions}
      />
    </div>
  );
};
