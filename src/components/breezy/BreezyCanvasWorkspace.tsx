import React, { useState, useEffect } from 'react';

export type CanvasCardType = 'idea' | 'research' | 'code' | 'task';
export type CanvasCardColor = 'sky' | 'emerald' | 'amber' | 'violet' | 'slate';

export interface CanvasCard {
  id: string;
  type: CanvasCardType;
  title: string;
  content: string;
  color: CanvasCardColor;
  tags: string[];
  completed?: boolean;
  createdAt: string;
}

interface BreezyCanvasWorkspaceProps {
  onOpenSettings?: () => void;
}

const DEFAULT_CARDS: CanvasCard[] = [
  {
    id: 'card-1',
    type: 'research',
    title: 'Distributed Consensus & Event Sourcing',
    content: 'Investigating high-throughput append-only transaction logs. Comparing Kafka topic partitioning with Raft-replicated memory state machines.',
    color: 'sky',
    tags: ['Architecture', 'Distributed-Systems'],
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'card-2',
    type: 'code',
    title: 'SSE Streaming Handler Pattern',
    content: 'const eventStream = new EventSource("/api/debate/stream");\neventStream.onmessage = (e) => handleToken(JSON.parse(e.data));',
    color: 'emerald',
    tags: ['TypeScript', 'Backend'],
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'card-3',
    type: 'idea',
    title: 'Epistemic Uncertainty Scoring in Evidence Trees',
    content: 'Extract claim-level contradictions automatically and render a calibrated confidence index based on retrieved domain authority.',
    color: 'violet',
    tags: ['Research', 'AI'],
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'card-4',
    type: 'task',
    title: 'Verify mobile viewport scaling across iPhone and iPad',
    content: 'Ensure touch targets >= 44px, sticky bottoms adapt to dynamic viewport height (100dvh), and drawers close on selection.',
    color: 'amber',
    tags: ['Mobile', 'UI'],
    completed: true,
    createdAt: new Date().toLocaleDateString(),
  },
];

export const BreezyCanvasWorkspace: React.FC<BreezyCanvasWorkspaceProps> = () => {
  const [cards, setCards] = useState<CanvasCard[]>(() => {
    try {
      const stored = localStorage.getItem('breezy:canvas:cards');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CARDS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | CanvasCardType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExpandingId, setIsExpandingId] = useState<string | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);

  // New card form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<CanvasCardType>('idea');
  const [newColor, setNewColor] = useState<CanvasCardColor>('sky');
  const [newTagInput, setNewTagInput] = useState('');

  // Editing card state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Persist cards
  const saveCards = (next: CanvasCard[]) => {
    setCards(next);
    try {
      localStorage.setItem('breezy:canvas:cards', JSON.stringify(next));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = newTagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newCard: CanvasCard = {
      id: `card-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim(),
      color: newColor,
      tags: tags.length ? tags : ['General'],
      completed: newType === 'task' ? false : undefined,
      createdAt: new Date().toLocaleDateString(),
    };

    saveCards([newCard, ...cards]);
    setNewTitle('');
    setNewContent('');
    setNewTagInput('');
    setIsAddingCard(false);
    showToast('New canvas card added.');
  };

  const handleDeleteCard = (id: string) => {
    saveCards(cards.filter((c) => c.id !== id));
    showToast('Card deleted.');
  };

  const handleToggleTask = (id: string) => {
    saveCards(
      cards.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      )
    );
  };

  const startEditCard = (card: CanvasCard) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
    setEditContent(card.content);
  };

  const saveEditCard = (id: string) => {
    saveCards(
      cards.map((c) =>
        c.id === id
          ? { ...c, title: editTitle.trim() || c.title, content: editContent }
          : c
      )
    );
    setEditingCardId(null);
    showToast('Changes saved.');
  };

  // Real AI Expansion using /api/breezy/chat
  const handleAiExpand = async (card: CanvasCard) => {
    setIsExpandingId(card.id);
    showToast('Synthesizing expansion with AI...');

    try {
      const prompt = `You are Breezy Canvas AI. Expand this research/thought card with structured, actionable insights, technical specifics, or implementation details. Keep it concise (under 120 words):\n\nCARD TITLE: ${card.title}\nCARD CONTENT: ${card.content || '(empty)'}`;

      const res = await fetch('/api/breezy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('AI generation service error');
      const data = await res.json();
      const expansionText = data.text;

      saveCards(
        cards.map((c) =>
          c.id === card.id
            ? {
                ...c,
                content: c.content
                  ? `${c.content}\n\n---\n**AI Synthesis:**\n${expansionText}`
                  : expansionText,
              }
            : c
        )
      );
      showToast('AI analysis appended to card.');
    } catch (err: any) {
      showToast(`AI Expansion note: ${err.message}`);
    } finally {
      setIsExpandingId(null);
    }
  };

  const handleExportMarkdown = () => {
    const md = cards
      .map(
        (c) =>
          `### [${c.type.toUpperCase()}] ${c.title}\n*Tags: ${c.tags.join(', ')} | Date: ${c.createdAt}*\n\n${c.content}\n\n---`
      )
      .join('\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breezy-canvas-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Canvas exported to Markdown.');
  };

  // Filter and search
  const filteredCards = cards.filter((card) => {
    const matchesFilter = activeFilter === 'all' || card.type === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getColorClasses = (color: CanvasCardColor) => {
    switch (color) {
      case 'sky':
        return 'border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-slate-900/40 text-sky-300';
      case 'emerald':
        return 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-900/40 text-emerald-300';
      case 'amber':
        return 'border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/40 text-amber-300';
      case 'violet':
        return 'border-violet-500/30 bg-gradient-to-b from-violet-950/20 to-slate-900/40 text-violet-300';
      default:
        return 'border-slate-700/60 bg-slate-900/40 text-slate-300';
    }
  };

  const getTypeIcon = (type: CanvasCardType) => {
    switch (type) {
      case 'idea':
        return 'lightbulb';
      case 'research':
        return 'science';
      case 'code':
        return 'code_blocks';
      case 'task':
        return 'check_circle';
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] bg-[#090d16] text-slate-100 font-sans antialiased overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 sm:p-4 rounded-2xl bg-[#0d1322] text-slate-100 shadow-2xl flex items-center gap-3 border border-sky-500/30 animate-in fade-in slide-in-from-bottom-3 text-xs">
          <span className="material-symbols-outlined text-sky-400 text-[18px]">info</span>
          <span className="font-sans font-medium text-slate-200">{toastMessage}</span>
        </div>
      )}

      {/* Atmospheric Background */}
      <div className="absolute top-12 left-1/3 w-[600px] h-[300px] bg-gradient-to-b from-sky-500/10 via-indigo-950/15 to-transparent blur-3xl pointer-events-none z-0 rounded-full"></div>

      <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-24 flex flex-col gap-6 relative z-10">
        {/* Header Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sky-400 text-[20px]">space_dashboard</span>
              <h1 className="font-sans text-xl sm:text-2xl text-white font-bold tracking-tight">
                Breezy Research & Ideation Canvas
              </h1>
            </div>
            <p className="font-sans text-xs sm:text-sm text-slate-400">
              Interactive workspace for organizing research findings, architecture patterns, and project notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingCard(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-sans text-xs font-bold rounded-xl transition-all shadow-[0_4px_16px_rgba(56,189,248,0.3)] flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Card</span>
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-sans text-xs font-medium rounded-xl transition-all border border-slate-700/80 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              title="Export all cards as Markdown"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d1322]/80 backdrop-blur-md p-2 rounded-2xl border border-slate-800/80">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['all', 'idea', 'research', 'code', 'task'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer capitalize flex items-center gap-1.5 ${
                  activeFilter === tab
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab !== 'all' && (
                  <span className="material-symbols-outlined text-[14px]">
                    {getTypeIcon(tab)}
                  </span>
                )}
                <span>{tab === 'all' ? 'All Cards' : `${tab}s`}</span>
                <span className="text-[10px] opacity-60">
                  ({tab === 'all' ? cards.length : cards.filter((c) => c.type === tab).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#070b14] border border-slate-700/80 rounded-xl">
            <span className="material-symbols-outlined text-slate-400 text-[16px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ideas, tags, code..."
              className="bg-transparent border-0 outline-none text-xs text-slate-100 placeholder:text-slate-500 w-full sm:w-48"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal / Card Creator Drawer */}
        {isAddingCard && (
          <div className="p-4 sm:p-6 rounded-2xl bg-[#0d1424] border border-sky-500/30 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-sans text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-400 text-[18px]">post_add</span>
                Create New Canvas Card
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Card Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Real-Time Event Driven State Machine"
                    className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CanvasCardType)}
                    className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  >
                    <option value="idea">💡 Idea / Concept</option>
                    <option value="research">🔬 Technical Research</option>
                    <option value="code">💻 Code Snippet</option>
                    <option value="task">✅ Action Item</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Content / Markdown Details</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Elaborate your hypothesis, implementation details, notes, or checklist steps..."
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400 leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Architecture, Database, High-Performance"
                    className="w-full bg-[#050811] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Card Color Theme</label>
                  <div className="flex items-center gap-2 pt-1">
                    {(['sky', 'emerald', 'amber', 'violet', 'slate'] as CanvasCardColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                          c === 'sky'
                            ? 'bg-sky-500'
                            : c === 'emerald'
                            ? 'bg-emerald-500'
                            : c === 'amber'
                            ? 'bg-amber-500'
                            : c === 'violet'
                            ? 'bg-violet-500'
                            : 'bg-slate-600'
                        } ${newColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save to Canvas
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cards Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const isEditing = editingCardId === card.id;
              const isExpanding = isExpandingId === card.id;

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl p-4 sm:p-5 border backdrop-blur-xl flex flex-col justify-between transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] ${getColorClasses(
                    card.color
                  )}`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">
                          {getTypeIcon(card.type)}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider font-bold opacity-80">
                          {card.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAiExpand(card)}
                          disabled={isExpanding}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                          title="Expand card with AI analysis"
                        >
                          <span className={`material-symbols-outlined text-[16px] ${isExpanding ? 'animate-spin text-sky-400' : ''}`}>
                            {isExpanding ? 'sync' : 'auto_awesome'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => (isEditing ? saveEditCard(card.id) : startEditCard(card))}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title={isEditing ? 'Save changes' : 'Edit card'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isEditing ? 'check' : 'edit'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete card"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Title */}
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-white outline-none focus:border-sky-400"
                      />
                    ) : (
                      <h3 className="font-sans text-sm sm:text-base font-bold text-white leading-snug">
                        {card.title}
                      </h3>
                    )}

                    {/* Card Body */}
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-sky-400 leading-relaxed font-sans"
                      />
                    ) : (
                      <div className="font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-line py-1">
                        {card.type === 'code' ? (
                          <pre className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] overflow-x-auto text-emerald-300">
                            <code>{card.content}</code>
                          </pre>
                        ) : (
                          card.content
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Tags & Status */}
                  <div className="pt-3 mt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Task Toggle or Date */}
                    {card.type === 'task' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleTask(card.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                          card.completed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {card.completed ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{card.completed ? 'Completed' : 'Pending'}</span>
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-slate-400">
                        {card.createdAt}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <span className="material-symbols-outlined text-3xl text-slate-600">dashboard_customize</span>
            <p className="text-sm font-medium text-slate-300">No cards match the active filter</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Create a new note, research inquiry, or code snippet using the button above.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingCard(true)}
              className="mt-2 px-3.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold"
            >
              Add Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
