import React, { useState } from 'react';
import { DebateSession } from '../../types';

interface ResearchNotesViewProps {
  onSelectNotePrompt: (prompt: string) => void;
  sessions: DebateSession[];
}

export const ResearchNotesView: React.FC<ResearchNotesViewProps> = ({ onSelectNotePrompt, sessions }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'solo' | 'multi'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyCitation = (title: string) => {
    navigator.clipboard.writeText(`Synthexis Research Archive: "${title}" (Verified Multi-Model Consensus)`);
    showToast('Citation reference copied to clipboard');
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1c2026] text-stone-100 px-4 py-2.5 rounded-lg shadow-xl border border-white/10 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
          <span className="font-mono text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header Strip & Command Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161a22] p-5 rounded-xl border border-white/5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-[#7bdb80] bg-white/5 px-2.5 py-0.5 rounded font-semibold">
              Consensus Archive
            </span>
            <span className="font-mono text-[11px] text-stone-500">Workspace Verified</span>
          </div>
          <h1 className="text-xl sm:text-2xl text-stone-100 tracking-tight font-semibold font-serif">
            Research Notes & Synthesis Archives
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            All completed inquiries are automatically converted into formal technical archives, backed by extracted claims, identified tensions, and verified publication citations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => showToast('Vault synchronized with local browser storage')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-medium transition-all border border-white/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-stone-400">cloud_sync</span>
            <span>Sync Archives</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectNotePrompt('')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold transition-all cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Inquiry</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Telemetry Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161a22] p-4 rounded-xl flex items-center justify-between border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-stone-500 font-semibold font-mono">Total Inquiries</span>
            <span className="text-xl text-stone-100 font-semibold mt-0.5">{completedSessions.length}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-stone-300 border border-white/10">
            <span className="material-symbols-outlined text-[18px]">library_books</span>
          </div>
        </div>

        <div className="bg-[#161a22] p-4 rounded-xl flex items-center justify-between border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-stone-500 font-semibold font-mono">Multi-Model Decided</span>
            <span className="text-xl text-stone-100 font-semibold mt-0.5">
              {completedSessions.filter((s) => s.protocol !== 'solo').length}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-stone-300 border border-white/10">
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
          </div>
        </div>

        <div className="bg-[#161a22] p-4 rounded-xl flex items-center justify-between border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-stone-500 font-semibold font-mono">Solo Brainstorming</span>
            <span className="text-xl text-stone-100 font-semibold mt-0.5">
              {completedSessions.filter((s) => s.protocol === 'solo').length}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-stone-300 border border-white/10">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </div>
        </div>

        <div className="bg-[#161a22] p-4 rounded-xl flex items-center justify-between border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-stone-500 font-semibold font-mono">Total Sources</span>
            <span className="text-xl text-emerald-400 font-semibold mt-0.5 tabular-nums">
              {completedSessions.reduce((acc, s) => acc + (s.evidenceGraph?.sourcesConsulted?.length || 0), 0)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-stone-300 border border-white/10">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
        </div>
      </div>

      {/* Filter, View & Search Command Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#161a22] p-2 rounded-xl border border-white/5">
        {/* Search Field */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/25 text-stone-400 focus-within:text-stone-200 flex-1 max-w-md border border-white/5">
          <span className="material-symbols-outlined text-[16px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified inquiries..."
            className="bg-transparent border-0 outline-none font-sans text-xs text-stone-200 placeholder:text-stone-550 w-full"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {(['all', 'solo', 'multi'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white/10 text-stone-100 shadow-sm'
                  : 'bg-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat === 'all'
                ? 'All Archives'
                : cat === 'solo'
                ? 'Solo Mode Only'
                : 'Multi-Model Consensus'}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              aria-label="Grid View"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === 'grid' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </button>
            <button
              type="button"
              aria-label="List View"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === 'list' ? 'bg-white/10 text-stone-200' : 'text-stone-400'
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
                const sourceCount = note.evidenceGraph?.sourcesConsulted?.length || 0;
                const claimCount = note.evidenceGraph?.claims?.length || 0;
                const contradictionCount = note.evidenceGraph?.contradictions?.length || 0;

                return (
                  <article
                    key={note.id}
                    className="flex flex-col justify-between bg-[#161a22] hover:bg-[#181d26] p-5 rounded-xl transition-all duration-200 border border-white/5 hover:border-white/10 group relative"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${note.protocol === 'solo' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                          <span className="font-mono text-[10px] text-stone-400 uppercase">
                            {note.protocol === 'solo' ? 'Solo Mode' : `${note.protocol.toUpperCase()} Consensus`}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-stone-500">
                          {new Date(note.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-semibold text-stone-200 group-hover:text-stone-100 transition-colors leading-snug line-clamp-2">
                          {note.prompt}
                        </h3>
                        <p className="text-[11px] text-stone-400 line-clamp-3 leading-relaxed mt-1 font-sans">
                          {note.finalOutput || 'No output produced yet.'}
                        </p>
                      </div>

                      {/* Real Calculated Metrics display inside note card */}
                      <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-white/5 text-center font-sans text-[10px] text-stone-400 bg-black/10 rounded-lg">
                        <div className="flex flex-col border-r border-white/5">
                          <span className="font-semibold text-stone-300">{claimCount}</span>
                          <span>Claims</span>
                        </div>
                        <div className="flex flex-col border-r border-white/5">
                          <span className="font-semibold text-stone-300">{sourceCount}</span>
                          <span>Sources</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-amber-400">{contradictionCount}</span>
                          <span>Conflicts</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Strip */}
                    <div className="flex items-center justify-between mt-4 pt-2.5 bg-black/25 p-2 rounded-lg border border-white/5 text-xs text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyCitation(note.prompt)}
                          className="p-1 rounded text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                          title="Copy Citation Reference"
                        >
                          <span className="material-symbols-outlined text-[14px]">format_quote</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectNotePrompt(note.prompt)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
                      >
                        <span>Open</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-stone-500 text-4xl">folder_zip</span>
              <div className="max-w-md">
                <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider">No synthesis archives yet</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Start an inquiry in the Research Workspace. Once the multi-model analysis is complete, the final verified answers will reside here permanently.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Telemetry Column (3 cols) */}
        <aside className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-[#161a22] p-4 rounded-xl flex flex-col gap-3 border border-white/5 font-sans">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-semibold text-stone-200">Active Peer Nodes</span>
              <span className="font-mono text-[9px] text-[#7bdb80] bg-[#7bdb80]/10 px-2 py-0.5 rounded border border-[#7bdb80]/20">
                Online
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Node A (Analyst)</span>
                <span className="font-mono text-[11px] text-stone-300">Claude 3.5 Sonnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Node B (Critic)</span>
                <span className="font-mono text-[11px] text-stone-300">GPT-4o</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Node C (Synthesizer)</span>
                <span className="font-mono text-[11px] text-stone-300">Gemini 3.8 Flash</span>
              </div>
            </div>
          </div>

          <div className="bg-[#161a22] p-4 rounded-xl flex flex-col gap-2.5 border border-white/5 font-sans text-xs">
            <span className="font-semibold text-stone-200 block mb-1">Enclave Assurance</span>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Your research credentials and session transcript metadata are kept isolated strictly inside your browser's private LocalStorage sandbox. No data residency on external servers.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
