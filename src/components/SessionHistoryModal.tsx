import React, { useState, useMemo } from 'react';
import {
  History,
  X,
  Search,
  Trash2,
  Clock,
  CheckCircle2,
  Radio,
  Plus,
  GitCompare,
  Compass,
  Fingerprint,
  BookOpen,
  Loader2,
  Activity,
} from 'lucide-react';
import { DebateSession, ProviderKeyConfig } from '../types';
import { ExportTranscriptMenu } from './ExportTranscriptMenu';
import { SessionCompareModal } from './SessionCompareModal';
import { SessionD3Chart } from './SessionD3Chart';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: DebateSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
  onNewDebate: () => void;
  keys?: ProviderKeyConfig;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllSessions,
  onNewDebate,
  keys,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareAId, setCompareAId] = useState<string | undefined>();
  const [compareBId, setCompareBId] = useState<string | undefined>();

  // Deduplicate sessions list to guarantee absolutely no duplicates are processed or rendered
  const uniqueSessions = useMemo(() => {
    const seen = new Set<string>();
    return sessions.filter((s) => {
      if (!s || !s.id) return false;
      if (seen.has(s.id)) {
        return false;
      }
      seen.add(s.id);
      return true;
    });
  }, [sessions]);

  // Selected session IDs for D3 comparison chart and batch actions
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(() =>
    uniqueSessions.slice(0, 3).map((s) => s.id)
  );

  // Executive summaries states with localStorage backup
  const [summaries, setSummaries] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('synthexis_debate_summaries');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [categories, setCategories] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('synthexis_debate_categories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [loadingSummaries, setLoadingSummaries] = useState<Record<string, boolean>>({});
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>({});

  // Batch action handlers
  const handleExportSelected = () => {
    if (selectedSessionIds.length === 0) return;
    const selectedData = uniqueSessions.filter((s) => selectedSessionIds.includes(s.id));
    const jsonString = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coherence_batch_export_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteSelected = () => {
    if (selectedSessionIds.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selectedSessionIds.length} selected transcripts?`)) {
      selectedSessionIds.forEach((id) => {
        onDeleteSession(id);
      });
      setSelectedSessionIds([]);
    }
  };

  if (!isOpen) return null;

  const handleGenerateSummary = async (session: DebateSession, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the session card and closing modal
    setLoadingSummaries((prev) => ({ ...prev, [session.id]: true }));
    setSummaryErrors((prev) => ({ ...prev, [session.id]: '' }));

    try {
      const response = await fetch('/api/debate/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session,
          providerKeyConfig: keys,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      const updatedSummaries = { ...summaries, [session.id]: data.summary };
      const updatedCategories = { ...categories, [session.id]: data.category };
      
      setSummaries(updatedSummaries);
      setCategories(updatedCategories);

      try {
        localStorage.setItem('synthexis_debate_summaries', JSON.stringify(updatedSummaries));
        localStorage.setItem('synthexis_debate_categories', JSON.stringify(updatedCategories));
      } catch (storeErr) {
        console.warn('Failed to store summaries in localStorage:', storeErr);
      }
    } catch (err: any) {
      console.error('Error in handleGenerateSummary:', err);
      setSummaryErrors((prev) => ({ ...prev, [session.id]: err.message || 'Error occurred.' }));
    } finally {
      setLoadingSummaries((prev) => ({ ...prev, [session.id]: false }));
    }
  };

  const filteredSessions = uniqueSessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const promptMatch = s.prompt.toLowerCase().includes(q);
    const protocolMatch = s.protocol.toLowerCase().includes(q);
    const outputMatch = s.finalOutput?.toLowerCase().includes(q) ?? false;
    return promptMatch || protocolMatch || outputMatch;
  });

  const handleOpenCompare = (idA?: string, idB?: string) => {
    setCompareAId(idA || sessions[0]?.id);
    setCompareBId(idB || sessions[1]?.id || sessions[0]?.id);
    setIsCompareOpen(true);
  };

  const formatExactTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Selected sessions for the chart comparison
  const selectedSessionsForChart = sessions.filter((s) => selectedSessionIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`flex flex-col w-full h-full sm:h-[88vh] sm:max-h-[820px] rounded-none sm:rounded-xl border-0 sm:border border-[#222838] bg-[#0d0f16] shadow-2xl overflow-hidden transition-all duration-300 ${
        sessions.length > 0 ? 'max-w-6xl' : 'max-w-3xl'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1c2230] bg-[#11141e] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#272f42] bg-[#151926] text-amber-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-[17px] font-normal tracking-[-0.016em] text-white">
                Deliberation Transcripts
              </h2>
              <p className="font-serif text-[12px] text-slate-400 leading-[1.35]">
                Persistent debate transcripts stored locally ({uniqueSessions.length} unique records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uniqueSessions.length >= 2 && (
              <button
                type="button"
                onClick={() => handleOpenCompare()}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-colors"
                title="Compare two transcripts side-by-side"
              >
                <GitCompare className="h-3.5 w-3.5" />
                <span>Compare Side-by-Side</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onNewDebate();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#262e40] bg-[#161a25] px-3 py-1.5 text-xs text-slate-200 hover:border-[#3a4660] hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Inquiry</span>
            </button>

            {uniqueSessions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all saved deliberation transcripts from local storage?')) {
                    onClearAllSessions();
                  }
                }}
                className="flex items-center gap-1 rounded-lg border border-[#252028] bg-[#181115] px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-950/40 transition-colors"
                title="Clear all saved transcripts"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1a202e] hover:text-white transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Layout Split */}
        {uniqueSessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center p-6">
            <History className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-medium text-slate-300 mb-1">No saved transcripts</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Convene the Council from the Dialogue Console to generate adversarial deliberation transcripts that persist here.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Panel: Search & Selectable Sessions List */}
            <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[#1c2230] min-h-0">
              {/* Search Filter Bar with Keyword Focus & Batch Actions Bar */}
              <div className="p-4 border-b border-[#1b202c] bg-[#0f121a] shrink-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search past inquiries by prompt keywords..."
                    className="w-full rounded-lg border border-[#202534] bg-[#121622] py-2 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#38435c] focus:outline-none"
                  />
                </div>

                {/* Batch Actions Toolbar */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = filteredSessions.map((s) => s.id);
                        const allSelected = allIds.every((id) => selectedSessionIds.includes(id));
                        if (allSelected) {
                          // Deselect all
                          setSelectedSessionIds((prev) => prev.filter((id) => !allIds.includes(id)));
                        } else {
                          // Select all
                          setSelectedSessionIds((prev) => {
                            const union = new Set([...prev, ...allIds]);
                            return Array.from(union);
                          });
                        }
                      }}
                      className="text-[11px] font-mono font-semibold text-slate-400 hover:text-white transition-colors bg-[#171b26] border border-[#272f42] px-2 py-1 rounded"
                    >
                      {filteredSessions.length > 0 && filteredSessions.every((s) => selectedSessionIds.includes(s.id))
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                    {selectedSessionIds.length > 0 && (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 font-semibold animate-pulse">
                        {selectedSessionIds.length} Selected
                      </span>
                    )}
                  </div>

                  {selectedSessionIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-1 duration-150">
                      <button
                        type="button"
                        onClick={handleExportSelected}
                        className="rounded bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/15 px-2.5 py-1 text-[10.5px] font-mono font-semibold text-white transition-all shadow-sm"
                        title="Export all selected transcripts to a combined JSON file"
                      >
                        Export Selected
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="rounded bg-rose-600 hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/15 px-2.5 py-1 text-[10.5px] font-mono font-semibold text-white transition-all shadow-sm"
                        title="Delete all selected transcripts"
                      >
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {filteredSessions.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-slate-400">
                      No transcripts matching prompt keywords "{searchQuery}".
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const consensusRate = session.metrics?.consensusRate;
                    const isSelectedForChart = selectedSessionIds.includes(session.id);

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          onSelectSession(session.id);
                          onClose();
                        }}
                        className={`group relative flex flex-col rounded-lg border p-4 transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'border-[#38435e] bg-[#141824]'
                            : 'border-[#1e2330] bg-[#10131c] hover:border-[#2f384d] hover:bg-[#131722]'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          {/* Multi-select checkbox for D3 chart */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionIds((prev) =>
                                prev.includes(session.id)
                                  ? prev.filter((id) => id !== session.id)
                                  : [...prev, session.id]
                              );
                            }}
                            className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
                              isSelectedForChart
                                ? 'border-amber-500/80 bg-amber-500/10 text-amber-400'
                                : 'border-[#272f42] bg-[#151926] text-slate-500 hover:border-slate-500/50'
                            }`}
                            title="Toggle comparison select"
                          >
                            {isSelectedForChart && (
                              <div className="h-2 w-2 rounded-xs bg-amber-400 shadow-sm shadow-amber-500/40" />
                            )}
                          </div>

                          {/* Prompt Title & Actions wrapper */}
                          <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                              {categories[session.id] && (
                                <div className="flex items-center gap-1 shrink-0 self-start">
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
                                    <Compass className="h-2 w-2 text-amber-400" />
                                    <span>{categories[session.id]}</span>
                                  </span>
                                </div>
                              )}
                              <h3 className="text-xs font-medium text-slate-100 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                                {session.prompt}
                              </h3>
                            </div>

                            {/* Actions */}
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {sessions.length >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const otherSession = sessions.find((s) => s.id !== session.id);
                                    handleOpenCompare(session.id, otherSession?.id);
                                  }}
                                  className="flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-mono text-amber-300 hover:bg-amber-500/20 transition-colors"
                                  title="Compare this transcript with another session side-by-side"
                                >
                                  <GitCompare className="h-3 w-3" />
                                  <span>Compare</span>
                                </button>
                              )}

                              <ExportTranscriptMenu
                                debate={{
                                  prompt: session.prompt,
                                  protocol: session.protocol,
                                  createdAt: session.createdAt,
                                  steps: session.steps || [],
                                  finalOutput: session.finalOutput,
                                  metrics: session.metrics,
                                }}
                                variant="minimal"
                              />

                              <button
                                type="button"
                                onClick={() => onDeleteSession(session.id)}
                                className="rounded p-1.5 text-slate-500 hover:bg-rose-950/30 hover:text-rose-400 transition-colors"
                                title="Delete transcript"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#171c26] text-[10px] font-mono text-slate-400">
                          <span className="rounded border border-[#23293a] bg-[#131722] px-1.5 py-0.5 uppercase text-slate-300">
                            {session.protocol}
                          </span>

                          {consensusRate !== undefined && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>{consensusRate}% consensus</span>
                            </span>
                          )}

                          <span>•</span>
                          <span>{session.steps?.length || 0} rounds</span>

                          {session.status === 'running' && (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <Radio className="h-2.5 w-2.5 animate-pulse" />
                              <span>In Progress</span>
                            </span>
                          )}

                          <span
                            className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] ml-auto"
                            title={`Exact creation timestamp: ${formatExactTimestamp(session.createdAt)}`}
                          >
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-300 font-medium">{formatExactTimestamp(session.createdAt)}</span>
                            <span className="text-slate-500">({formatRelativeTime(session.createdAt)})</span>
                          </span>

                          {isActive && (
                            <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.2 text-[9px] uppercase tracking-wider text-slate-200">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Currently Selected Session Summary Action & Output */}
                        {isActive && (
                          <div className="mt-3 pt-2.5 border-t border-[#252c3f]/40" onClick={(e) => e.stopPropagation()}>
                            {summaries[session.id] ? (
                              <div className="rounded-lg bg-[#0a0d14]/80 border border-amber-500/20 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                                    <Fingerprint className="h-3 w-3 text-amber-400 animate-pulse" />
                                    <span>Executive Summary</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleGenerateSummary(session, e)}
                                    disabled={loadingSummaries[session.id]}
                                    className="text-[9px] font-mono text-slate-400 hover:text-white transition-colors"
                                  >
                                    Regenerate
                                  </button>
                                </div>
                                <p className="text-[11.5px] text-slate-300 leading-relaxed font-serif italic">
                                  "{summaries[session.id]}"
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0d14]/30 border border-[#1b2131]/60 rounded-lg p-3">
                                <p className="text-[10px] text-slate-400 leading-normal max-w-md">
                                  Generate an LLM-powered single-sentence executive summary of this active session's final synthesized consensus.
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => handleGenerateSummary(session, e)}
                                  disabled={loadingSummaries[session.id]}
                                  className="flex items-center justify-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition-colors shrink-0"
                                >
                                  {loadingSummaries[session.id] ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin text-amber-300" />
                                      <span>Summarizing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <BookOpen className="h-3 w-3 text-amber-300" />
                                      <span>Summarize Session</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {summaryErrors[session.id] && (
                              <p className="mt-1.5 text-[10px] text-rose-400 font-mono">
                                Failed to summarize: {summaryErrors[session.id]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: D3.js Comparisons */}
            <div className="w-full md:w-1/2 flex flex-col bg-[#070910] p-5 overflow-y-auto min-h-0 border-t md:border-t-0 border-[#1c2230]">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-serif text-[14px] font-normal text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-400" />
                    <span>Dialectic Analysis Ledger</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {selectedSessionsForChart.length} selected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-serif leading-relaxed">
                  Toggle checkboxes in the past sessions list to feed their records to this D3.js visualization. Compare consensus thresholds (%) and execution duration (seconds) simultaneously.
                </p>
              </div>

              <div className="flex-1 min-h-[320px]">
                <SessionD3Chart selectedSessions={selectedSessionsForChart} />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#181d28] bg-[#0c0e15] px-6 py-3 text-xs text-slate-400 shrink-0">
          <span>Click any transcript to load its full dialectic rounds and consensus answer.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#222837] bg-[#131722] px-3.5 py-1.5 text-xs text-slate-200 hover:bg-[#181d2c] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <SessionCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        sessions={sessions}
        initialSessionAId={compareAId}
        initialSessionBId={compareBId}
        onSelectSession={onSelectSession}
      />
    </div>
  );
};
