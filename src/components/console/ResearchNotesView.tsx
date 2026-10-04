import React, { useMemo, useState } from 'react';
import { DebateSession } from '../../types';
import { googleDocsService } from '../../services/googleDocsService';

interface ResearchNotesViewProps {
  onSelectNotePrompt: (prompt: string) => void;
  sessions: DebateSession[];
  onSync?: () => void;
  activeTab?: 'history' | 'notes';
}

export const ResearchNotesView: React.FC<ResearchNotesViewProps> = ({
  onSelectNotePrompt,
  sessions,
  activeTab = 'history',
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'research' | 'solo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingDocId, setSavingDocId] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 2400);
  };

  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'completed' || Boolean(session.finalOutput)),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return completedSessions.filter((session) => {
      if (filterMode === 'solo' && session.protocol !== 'solo') return false;
      if (filterMode === 'research' && session.protocol === 'solo') return false;
      if (!query) return true;

      return (
        session.prompt.toLowerCase().includes(query) ||
        Boolean(session.finalOutput?.toLowerCase().includes(query))
      );
    });
  }, [completedSessions, filterMode, searchQuery]);

  const copyReference = async (session: DebateSession) => {
    try {
      const label = session.protocol === 'solo' ? 'Solo research' : 'Multi-model research';
      await navigator.clipboard.writeText('Breezy Research — ' + label + ': "' + session.prompt + '"');
      showToast('Reference copied');
    } catch {
      showToast('Clipboard access was unavailable');
    }
  };

  const saveToGoogleDocs = async (session: DebateSession) => {
    if (!session.finalOutput) {
      showToast('This session has no completed output yet');
      return;
    }

    setSavingDocId(session.id);
    try {
      const url = await googleDocsService.saveResearchSession(session);
      showToast('Saved to Google Docs');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      showToast(error?.message || 'Google Docs save failed');
    } finally {
      setSavingDocId(null);
    }
  };

  const viewDescription =
    activeTab === 'notes'
      ? 'Review research outputs and excerpts you may want to continue working from.'
      : 'Browse completed research sessions, sources, and final outputs stored in this workspace.';

  return (
    <div className="relative w-full flex-1 flex flex-col bg-surface font-sans text-on-surface p-space-md sm:p-space-lg pb-24 max-w-7xl mx-auto gap-space-lg">
      <div className="pointer-events-none absolute -top-32 left-1/3 w-[640px] h-[360px] bg-primary/10 rounded-full blur-[140px]" />

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg pb-space-sm">
        <div>
          <div className="flex items-center gap-2 text-outline font-mono text-code-sm uppercase tracking-wider">
            <span>Workspace</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary">{activeTab === 'notes' ? 'Notes' : 'History'}</span>
          </div>
          <h1 className="mt-1 font-headline font-bold text-headline-xl text-on-surface tracking-tight">
            {activeTab === 'notes' ? 'Research Notes' : 'Research History'}
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant max-w-2xl">
            {viewDescription}
          </p>
        </div>

        <div className="w-full lg:w-[380px]">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/25">
            <span className="material-symbols-outlined text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={activeTab === 'notes' ? 'Search notes and findings…' : 'Search past research…'}
              className="w-full bg-transparent text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-surface-container font-mono text-code-sm text-outline">
              /
            </kbd>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-container-low">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'research' as const, label: 'Research' },
            { id: 'solo' as const, label: 'Solo' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={
                'px-3 py-1.5 rounded-md text-label-md transition-colors ' +
                (filterMode === tab.id
                  ? 'bg-surface-container-high text-primary'
                  : 'text-on-surface-variant hover:text-on-surface')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-code-sm text-outline">
          {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="min-h-[280px] rounded-xl bg-surface-container-low flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[24px]">
              {activeTab === 'notes' ? 'sticky_note_2' : 'history'}
            </span>
          </div>
          <h2 className="mt-4 font-headline font-semibold text-headline-sm text-on-surface">
            {searchQuery ? 'No matching sessions' : 'No ' + (activeTab === 'notes' ? 'notes' : 'completed sessions') + ' yet'}
          </h2>
          <p className="mt-1 max-w-sm text-body-sm text-on-surface-variant">
            {searchQuery
              ? 'Try a different search term or filter.'
              : 'Complete a research run and its output will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filteredSessions.map((session) => {
            const sourcesCount = session.evidenceGraph?.sourcesConsulted?.length || 0;
            const excerpt = session.finalOutput
              ? session.finalOutput.replace(/#{1,6}\s?/g, '').replace(/\s+/g, ' ').slice(0, 300)
              : 'No final output is stored for this session.';

            return (
              <article key={session.id} className="group rounded-xl bg-surface-container-low overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-mono text-code-sm">
                      <span className={'w-1.5 h-1.5 rounded-full ' + (session.protocol === 'solo' ? 'bg-secondary' : 'bg-primary')} />
                      <span className="text-primary">
                        {session.protocol === 'solo' ? 'Solo' : 'Research'}
                      </span>
                    </div>
                    <span className="text-label-sm text-outline">
                      {new Date(session.createdAt || Date.now()).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h2 className="mt-3 font-headline font-semibold text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                    {session.prompt}
                  </h2>

                  <p className="mt-2 text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">
                    {excerpt}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-label-sm text-outline flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">source</span>
                      {sourcesCount} {sourcesCount === 1 ? 'source' : 'sources'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">timeline</span>
                      {session.steps.length} {session.steps.length === 1 ? 'step' : 'steps'}
                    </span>
                    {session.researchMetrics?.durationMs ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        {Math.max(1, Math.round(session.researchMetrics.durationMs / 1000))}s
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-3 bg-surface-container border-t border-outline-variant/20 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectNotePrompt(session.prompt)}
                    className="inline-flex items-center gap-1.5 text-label-md text-primary hover:text-secondary transition-colors"
                  >
                    Continue research
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyReference(session)}
                      className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Copy reference"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => saveToGoogleDocs(session)}
                      disabled={savingDocId === session.id}
                      className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high disabled:opacity-50 transition-colors"
                      title="Save to Google Docs"
                    >
                      <span className={'material-symbols-outlined text-[18px] ' + (savingDocId === session.id ? 'animate-spin' : '')}>
                        {savingDocId === session.id ? 'sync' : 'article'}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-lg shadow-2xl text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
