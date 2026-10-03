import React, { useState } from 'react';
import { DebateSession } from '../../types';
import { providerConfigService } from '../../services/providerConfigService';
import { apiClient } from '../../services/apiClient';
import { googleDocsService } from '../../services/googleDocsService';

interface ResearchNotesViewProps {
  onSelectNotePrompt: (prompt: string) => void;
  sessions: DebateSession[];
  onSync?: () => void;
}

export const ResearchNotesView: React.FC<ResearchNotesViewProps> = ({ onSelectNotePrompt, sessions, onSync }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'solo' | 'multi'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [savingDocId, setSavingDocId] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    apiClient.checkHealth(true).then((ok) => {
      if (!cancelled) setBackendStatus(ok ? 'online' : 'offline');
    }).catch(() => {
      if (!cancelled) setBackendStatus('offline');
    });
    return () => { cancelled = true; };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyCitation = (title: string, protocol?: string) => {
    const label =
      protocol === 'solo'
        ? 'Solo Model Inquiry'
        : protocol === 'quad'
          ? 'Quad-Model Research'
          : 'Multi-Model Research';
    navigator.clipboard.writeText(`Breezy Research Archive: "${title}" (${label})`);
    showToast('Citation reference copied to clipboard');
  };

  const saveToGoogleDocs = async (session: DebateSession) => {
    if (!session?.finalOutput) return;
    setSavingDocId(session.id);
    try {
      const url = await googleDocsService.saveResearchSession(session);
      showToast('Saved to your single Breezy Research Google Doc.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      showToast(err?.message || 'Google Docs save failed.');
    } finally {
      setSavingDocId(null);
    }
  };

  // Only display completed sessions as formal notes/archives
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const filteredSessions = completedSessions.filter((s) => {
    // Filter by mode
    if (activeCategory === 'solo' && s.protocol !== 'solo') return false;
    if (activeCategory === 'multi' && s.protocol === 'solo') return false;

    // Filter by search query
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
    <div className="relative w-full px-4 sm:px-8 py-6 flex flex-col gap-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-lg shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2 backdrop-blur-md">
          <span className="material-symbols-outlined text-stone-400 text-[18px]">check_circle</span>
          <span className="font-mono text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header Strip & Command Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900/40 p-5 rounded-xl border border-stone-800/40 backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase text-stone-100 bg-stone-800 px-2.5 py-0.5 rounded font-bold tracking-widest">
              RESEARCH_ARCHIVE
            </span>
            <span className="font-mono text-[10px] text-stone-500 font-medium uppercase tracking-tight">Index: Local_Enclave</span>
          </div>
          <h1 className="text-xl sm:text-2xl text-stone-100 tracking-tight font-semibold font-serif italic">
            Research Repositories
          </h1>
          <p className="text-[11px] text-stone-500 max-w-2xl leading-relaxed uppercase tracking-wider">
            Consolidated research intelligence and cross-model verifications.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const url = googleDocsService.getArchiveUrl();
              if (url) window.open(url, '_blank', 'noopener,noreferrer');
              else showToast('Save a research result first to create the Google Doc.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/40 hover:bg-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all border border-stone-800/60 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Open_Google_Doc</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSync?.();
              showToast('Research archive refreshed');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800/40 hover:bg-stone-800 text-stone-400 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all border border-stone-800/60 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectNotePrompt('')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New_Inquiry</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Telemetry Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total_Streams', value: completedSessions.length, icon: 'library_books' },
          { label: 'Multi_Analyses', value: completedSessions.filter((s) => s.protocol !== 'solo').length, icon: 'account_tree' },
          { label: 'Solo_Analyses', value: completedSessions.filter((s) => s.protocol === 'solo').length, icon: 'bolt' },
          { label: 'Source_Network', value: completedSessions.reduce((acc, s) => acc + (s?.evidenceGraph?.sourcesConsulted?.length || 0), 0), icon: 'verified_user', color: 'text-stone-400' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-stone-900/40 p-4 rounded-xl flex items-center justify-between border border-stone-800/40 backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-stone-500 font-bold font-mono tracking-widest">{stat.label}</span>
              <span className={`text-xl text-stone-100 font-semibold mt-0.5 tabular-nums ${stat.color || ''}`}>{stat.value}</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-stone-800/60 flex items-center justify-center text-stone-400 border border-stone-700/40">
              <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter, View & Search Command Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-stone-900/40 p-2 rounded-xl border border-stone-800/40 backdrop-blur-sm">
        {/* Search Field */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-950/60 text-stone-600 focus-within:text-stone-300 flex-1 max-w-md border border-stone-800/60">
          <span className="material-symbols-outlined text-[16px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified inquiries..."
            className="bg-transparent border-0 outline-none font-mono text-[10px] text-stone-200 placeholder:text-stone-700 w-full uppercase tracking-widest"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {(['all', 'solo', 'multi'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-stone-800 text-stone-100 shadow-sm'
                  : 'bg-transparent text-stone-500 hover:text-stone-200'
              }`}
            >
              {cat === 'all'
                ? 'Archives_All'
                : cat === 'solo'
                ? 'Fast_Solo'
                : 'Deep_Research'}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-stone-950/40 p-0.5 rounded-lg border border-stone-800/60">
            <button
              type="button"
              aria-label="Grid View"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === 'grid' ? 'bg-stone-800 text-stone-200' : 'text-stone-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </button>
            <button
              type="button"
              aria-label="List View"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === 'list' ? 'bg-stone-800 text-stone-200' : 'text-stone-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Side Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Notes Column */}
        <div className="xl:col-span-9 flex flex-col gap-4">
          {filteredSessions.length > 0 ? (
            <div
              className={
                viewMode === 'list'
                  ? 'flex flex-col gap-3 w-full'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full'
              }
            >
              {filteredSessions.map((note) => {
                if (!note) return null;
                const sourceCount = note.evidenceGraph?.sourcesConsulted?.length || 0;
                const claimCount = note.evidenceGraph?.claims?.length || 0;
                const contradictionCount = note.evidenceGraph?.contradictions?.length || 0;

                return (
                  <article
                    key={note.id}
                    className="flex flex-col justify-between bg-stone-900/20 hover:bg-stone-900/40 p-5 rounded-xl transition-all duration-300 border border-stone-800/40 hover:border-stone-700/60 group relative backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${note.protocol === 'solo' ? 'bg-stone-600' : 'bg-stone-100'}`}></span>
                          <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest font-bold">
                            {note.protocol === 'solo' ? 'Protocol:Solo' : `Protocol:${note.protocol.toUpperCase()}`}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-stone-600 uppercase tracking-tighter">
                          {new Date(note.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-serif italic text-stone-200 group-hover:text-stone-100 transition-colors leading-snug line-clamp-2">
                          {note.prompt}
                        </h3>
                        <p className="text-[11px] text-stone-500 line-clamp-3 leading-relaxed mt-1 font-sans">
                          {note.finalOutput || 'Analysis pipeline terminated.'}
                        </p>
                      </div>

                      {/* Real Calculated Metrics display inside note card */}
                      <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-stone-800/40 text-center font-mono text-[9px] text-stone-500 bg-stone-950/40 rounded uppercase tracking-tighter">
                        <div className="flex flex-col border-r border-stone-800/40">
                          <span className="font-bold text-stone-300">{claimCount}</span>
                          <span>Claims</span>
                        </div>
                        <div className="flex flex-col border-r border-stone-800/40">
                          <span className="font-bold text-stone-300">{sourceCount}</span>
                          <span>Sources</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-400">{contradictionCount}</span>
                          <span>Conflicts</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Strip */}
                    <div className="flex items-center justify-between mt-4 pt-2.5">
                      <button
                        type="button"
                        onClick={() => copyCitation(note.prompt, note.protocol)}
                        className="text-stone-600 hover:text-stone-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">format_quote</span>
                        <span className="font-mono text-[9px] uppercase tracking-widest">Cite_Reference</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveToGoogleDocs(note)}
                          disabled={savingDocId === note.id}
                          className="flex items-center gap-1 text-[9px] text-stone-500 hover:text-stone-200 transition-colors cursor-pointer disabled:opacity-50"
                          title="Append this research to the single Breezy Research Google Doc"
                        >
                          <span className="material-symbols-outlined text-[13px]">{savingDocId === note.id ? 'sync' : 'description'}</span>
                          <span>{savingDocId === note.id ? 'Saving' : 'Google Doc'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectNotePrompt(note.prompt)}
                          className="flex items-center gap-1 text-[10px] text-stone-100 hover:underline underline-offset-4 transition-all font-bold uppercase tracking-widest cursor-pointer"
                        >
                          <span>Inspect</span>
                          <span className="material-symbols-outlined text-[14px]">east</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-800 bg-stone-900/10 p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-stone-700 text-4xl">folder_zip</span>
              <div className="max-w-md">
                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">Enclave_Empty</h4>
                <p className="text-[11px] text-stone-600 mt-2 leading-relaxed font-serif italic">
                  Initiate an inquiry in the Research Workspace to populate the secure local archives.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Telemetry Column (3 cols) */}
        <aside className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-stone-900/40 p-4 rounded-xl flex flex-col gap-3 border border-stone-800/40 font-mono backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-stone-800/40 pb-2">
              <span className="text-[10px] font-bold text-stone-200 uppercase tracking-widest">Backend_Connection</span>
              <span className={`font-mono text-[9px] px-2 py-0.5 rounded border uppercase tracking-tighter ${backendStatus === 'online' ? 'text-stone-200 bg-stone-800 border-stone-700' : backendStatus === 'checking' ? 'text-stone-400 bg-stone-900 border-stone-800' : 'text-stone-500 bg-stone-950 border-stone-900'}`}>
                {backendStatus === 'online' ? 'Online' : backendStatus === 'checking' ? 'Checking' : 'Offline'}
              </span>
            </div>
            {(() => {
              const roles = providerConfigService.getConfig().roles;
              const seatLabel = (role: typeof roles.architect) => {
                if (!role?.provider || !role?.model) return 'Not configured';
                if (!providerConfigService.isProviderConfigured(role.provider)) return 'Key not set';
                return role.model;
              };
              return (
                <div className="flex flex-col gap-2.5 text-[10px] tracking-tight">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-stone-500 uppercase">
                      <span className={`w-1 h-1 rounded-full ${backendStatus === 'online' ? 'bg-stone-100' : 'bg-stone-700'}`}></span>
                      <span>Node_Alpha</span>
                    </div>
                    <span className="text-stone-300 truncate max-w-[120px]">
                      {seatLabel(roles.architect)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-stone-500 uppercase">
                      <span className={`w-1 h-1 rounded-full ${backendStatus === 'online' ? 'bg-stone-100' : 'bg-stone-700'}`}></span>
                      <span>Node_Beta</span>
                    </div>
                    <span className="text-stone-300 truncate max-w-[120px]">
                      {seatLabel(roles.skeptic)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-stone-500 uppercase">
                      <span className={`w-1 h-1 rounded-full ${backendStatus === 'online' ? 'bg-stone-100' : 'bg-stone-700'}`}></span>
                      <span>Node_Gamma</span>
                    </div>
                    <span className="text-stone-300 truncate max-w-[120px]">
                      {seatLabel(roles.arbiter)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-stone-900/40 p-4 rounded-xl flex flex-col gap-2.5 border border-stone-800/40 font-mono text-[10px] backdrop-blur-sm">
            <span className="font-bold text-stone-200 uppercase tracking-widest block mb-1 underline underline-offset-4 decoration-stone-800">Enclave_Assurance</span>
            <p className="text-stone-500 leading-relaxed uppercase tracking-tighter">
              Research sessions are stored in this browser. If cloud sync is enabled, copies may also be stored in your connected cloud account.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
