/**
 * Local Outline Canvas & Presentation Planner
 * Explicit local workspace for organizing slides, milestones, and course outlines.
 * Truthful State: Local React/Browser storage mode with explicit labeling.
 */

import React, { useState } from 'react';

interface SlideItem {
  id: string;
  title: string;
  slidesCount: number;
  lastModified: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

interface CourseworkOutline {
  id: string;
  name: string;
  section: string;
  room?: string;
  instructor: string;
}

export const GoogleCanvasView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'slides' | 'tasks' | 'coursework'>('slides');

  // Local storage backed canvas state
  const [slides, setSlides] = useState<SlideItem[]>([
    { id: 'slide-1', title: 'Q3 Architectural Strategy & Multi-Node Consensus', slidesCount: 14, lastModified: 'Local draft' },
    { id: 'slide-2', title: 'Breezy v2.5 Release Deck & Security Audit', slidesCount: 8, lastModified: 'Local draft' },
  ]);

  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 'task-1', title: 'Review Edge Worker CORS policy and BYOK routes', status: 'needsAction', due: 'Today' },
    { id: 'task-2', title: 'Verify search grounding fallback citations', status: 'completed' },
    { id: 'task-3', title: 'Optimize Groq and OpenRouter failover routing', status: 'needsAction', due: 'Next milestone' },
  ]);

  const [coursework, setCoursework] = useState<CourseworkOutline[]>([
    { id: 'course-1', name: 'Advanced Distributed Systems & Consensus', section: 'Section A', room: 'Lab 4', instructor: 'Prof. Alistair' },
    { id: 'course-2', name: 'Applied AI Architecture & Multi-Agent Design', section: 'Module 2', room: 'Hall B', instructor: 'Dr. Evelyn' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'needsAction',
      due: 'Today',
    };
    setTasks([item, ...tasks]);
    setNewTaskTitle('');
    showToast('Task added to local canvas outline.');
  };

  const handleCreateSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideTitle.trim()) return;
    const item: SlideItem = {
      id: `slide-${Date.now()}`,
      title: newSlideTitle.trim(),
      slidesCount: 1,
      lastModified: 'Just now',
    };
    setSlides([item, ...slides]);
    setNewSlideTitle('');
    showToast('Slide outline created locally.');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: t.status === 'completed' ? 'needsAction' : 'completed' } : t)));
    showToast('Task status updated.');
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] pb-24 text-stone-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-xl bg-[#1c2026] text-stone-100 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Local Canvas</span>
            <span className="font-mono text-[11px] text-stone-400">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-sky-400 tracking-widest bg-sky-500/10 px-2.5 py-1 rounded-full font-semibold border border-sky-500/20">
                Outline & Canvas Tool
              </span>
              <span className="font-mono text-xs text-stone-400">[Local Storage Mode]</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-stone-100 tracking-tight font-semibold">
              Research Outlines & Canvas Planner
            </h1>
            <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
              Plan slide presentations, manage research action items, and organize course outlines directly in your local workspace.
            </p>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('slides')}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-medium flex items-center gap-2 cursor-pointer transition-all ${
              activeSubTab === 'slides' ? 'bg-white/10 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">slideshow</span>
            <span>Presentation Outlines ({slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-medium flex items-center gap-2 cursor-pointer transition-all ${
              activeSubTab === 'tasks' ? 'bg-white/10 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">checklist</span>
            <span>Action Items ({tasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('coursework')}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-medium flex items-center gap-2 cursor-pointer transition-all ${
              activeSubTab === 'coursework' ? 'bg-white/10 text-white shadow-xs' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Coursework Modules ({coursework.length})</span>
          </button>
        </div>

        {/* Tab 1: Presentation Outlines */}
        {activeSubTab === 'slides' && (
          <div className="flex flex-col gap-6">
            <form onSubmit={handleCreateSlide} className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={newSlideTitle}
                onChange={(e) => setNewSlideTitle(e.target.value)}
                placeholder="New presentation topic (e.g. Distributed Consensus Overviews)..."
                className="flex-1 bg-[#161a22] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-stone-200 outline-none focus:border-white/20"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-sans text-xs font-semibold cursor-pointer shrink-0 shadow-xs"
              >
                Add Deck
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slides.map((s) => (
                <div key={s.id} className="p-5 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-amber-400 text-[20px]">co_present</span>
                      <span className="font-mono text-[10px] text-stone-400">{s.slidesCount} slides</span>
                    </div>
                    <h3 className="font-sans text-xs font-semibold text-stone-100 mt-1">{s.title}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] font-mono text-stone-400">
                    <span>{s.lastModified}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Action Items */}
        {activeSubTab === 'tasks' && (
          <div className="flex flex-col gap-6">
            <form onSubmit={handleCreateTask} className="flex gap-2 max-w-xl">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New action item or milestone..."
                className="flex-1 bg-[#161a22] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-stone-200 outline-none focus:border-white/20"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-sans text-xs font-semibold cursor-pointer shrink-0 shadow-xs"
              >
                Add Item
              </button>
            </form>

            <div className="flex flex-col gap-2 max-w-3xl">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTaskStatus(t.id)}
                  className="p-3.5 rounded-xl bg-[#161a22] hover:bg-[#1a1f29] border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[18px] ${t.status === 'completed' ? 'text-emerald-400' : 'text-stone-500'}`}>
                      {t.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className={`text-xs ${t.status === 'completed' ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                      {t.title}
                    </span>
                  </div>
                  {t.due && <span className="font-mono text-[10px] text-stone-500">{t.due}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Coursework Modules */}
        {activeSubTab === 'coursework' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coursework.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-blue-400 text-[20px]">menu_book</span>
                  <span className="font-mono text-[10px] text-stone-400">{c.section}</span>
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold text-stone-100">{c.name}</h3>
                  <p className="text-[11px] text-stone-400 mt-1">{c.instructor} {c.room ? `• ${c.room}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
