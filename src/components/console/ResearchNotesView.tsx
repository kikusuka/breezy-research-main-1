import React, { useState } from 'react';
import { DebateSession } from '../../types';
import { googleDocsService } from '../../services/googleDocsService';

interface ResearchNotesViewProps {
  onSelectNotePrompt: (prompt: string) => void;
  sessions: DebateSession[];
  onSync?: () => void;
}

export const ResearchNotesView: React.FC<ResearchNotesViewProps> = ({
  onSelectNotePrompt,
  sessions,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'standard' | 'solo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingDocId, setSavingDocId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyCitation = (title: string, protocol?: string) => {
    const label = protocol === 'solo' ? 'Solo Scan' : 'Multi-Model Synthesis';
    navigator.clipboard.writeText(`Breezy Research Archive: "${title}" (${label})`);
    showToast('Citation reference copied to clipboard');
  };

  const saveToGoogleDocs = async (session: DebateSession) => {
    if (!session?.finalOutput) return;
    setSavingDocId(session.id);
    try {
      const url = await googleDocsService.saveResearchSession(session);
      showToast('Saved to your Breezy Research Google Doc archive.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      showToast(err?.message || 'Google Docs save failed.');
    } finally {
      setSavingDocId(null);
    }
  };

  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.finalOutput);

  const filteredSessions = completedSessions.filter((s) => {
    if (filterMode === 'solo' && s.protocol !== 'solo') return false;
    if (filterMode === 'standard' && s.protocol === 'solo') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.prompt.toLowerCase().includes(q) ||
        (s.finalOutput && s.finalOutput.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface p-space-md sm:p-space-lg pb-24 max-w-7xl mx-auto gap-space-lg">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-space-xs pb-space-sm border-b border-outline-variant/20">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm text-outline font-mono text-code-sm uppercase tracking-wider">
            <span>Research OS</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Session Archives</span>
          </div>
          <h1 className="font-headline font-bold text-headline-xl text-on-surface tracking-tight">
            Research History &amp; Evidence
          </h1>
          <p className="font-sans text-body-md text-on-surface-variant max-w-xl">
            Immutable records of past multi-model investigations, citations, contradiction logs, and definitive resolutions.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts &amp; citations..."
            className="w-full bg-surface-container text-on-surface placeholder:text-outline font-sans text-body-sm pl-9 pr-space-md py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary shadow-sm"
          />
          <span className="material-symbols-outlined text-outline text-[18px] absolute left-3 top-2.5">
            search
          </span>
        </div>
      </div>

      {/* Filter Tabs Strip */}
      <div className="flex items-center justify-between gap-space-md flex-wrap">
        <div className="flex items-center gap-space-xs p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
          {[
            { id: 'all' as const, label: 'All Investigations' },
            { id: 'standard' as const, label: 'Deep Syntheses' },
            { id: 'solo' as const, label: 'Fast Scans' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`px-space-md py-1.5 rounded-lg font-sans text-label-md transition-all ${
                filterMode === tab.id
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="font-mono text-code-sm text-outline">
          Showing {filteredSessions.length} {filteredSessions.length === 1 ? 'record' : 'records'}
        </div>
      </div>

      {/* Grid of Past Investigation Cards */}
      {filteredSessions.length === 0 ? (
        <div className="p-space-xl rounded-3xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center justify-center my-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-space-md">
            <span className="material-symbols-outlined text-headline-lg">history_edu</span>
          </div>
          <h3 className="font-headline font-semibold text-headline-sm text-on-surface">
            No completed investigations found
          </h3>
          <p className="font-sans text-body-sm text-on-surface-variant mt-1 max-w-sm">
            {searchQuery
              ? 'No sessions matched your filter criteria.'
              : 'Launch a research run to generate grounded multi-model synthesis dossiers.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {filteredSessions.map((session) => {
            const sourcesList = session.evidenceGraph?.sourcesConsulted || [];
            const hasSources = sourcesList.length > 0;
            return (
              <div
                key={session.id}
                className="p-space-lg rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-md flex flex-col justify-between gap-space-md hover:border-primary/40 transition-all group"
              >
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20 font-mono text-code-sm">
                    <span className="text-primary font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {session.protocol === 'solo' ? 'Fast Solo Scan' : 'Multi-Model Consensus'}
                    </span>
                    <span className="text-outline">
                      {new Date(session.createdAt || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="font-headline font-semibold text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                    {session.prompt}
                  </h3>

                  {session.finalOutput && (
                    <p className="font-sans text-body-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                      {session.finalOutput.replace(/#{1,6}\s?/g, '').slice(0, 240)}...
                    </p>
                  )}

                  {hasSources && (
                    <div className="flex items-center gap-1 font-mono text-[11px] text-tertiary">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      <span>{sourcesList.length} verified citation references</span>
                    </div>
                  )}
                </div>

                <div className="pt-space-sm border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-space-xs">
                  <button
                    type="button"
                    onClick={() => onSelectNotePrompt(session.prompt)}
                    className="flex items-center gap-1 text-primary hover:underline font-headline font-semibold text-body-sm"
                  >
                    <span>Inspect Investigation</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>

                  <div className="flex items-center gap-space-xs">
                    <button
                      type="button"
                      onClick={() => copyCitation(session.prompt, session.protocol)}
                      className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                      title="Copy Citation Reference"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => saveToGoogleDocs(session)}
                      disabled={savingDocId === session.id}
                      className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                      title="Save to Google Docs Archive"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {savingDocId === session.id ? 'sync' : 'article'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
