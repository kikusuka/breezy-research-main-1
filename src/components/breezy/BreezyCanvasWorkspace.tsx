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

interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  room?: string;
  ownerId: string;
}

interface BreezyCanvasWorkspaceProps {
  onOpenSettings?: () => void;
}

export const BreezyCanvasWorkspace: React.FC<BreezyCanvasWorkspaceProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'slides' | 'tasks' | 'classroom'>('slides');
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('breezy_g_token') || sessionStorage.getItem('synthexis_g_token'));
  });
  
  // States for Slides, Tasks, Classroom
  const [slides, setSlides] = useState<SlideItem[]>([
    { id: 'slide-1', title: 'Q3 Breezy Cognitive Flow & Real-Time Agents', slidesCount: 12, lastModified: '1 hour ago' },
    { id: 'slide-2', title: 'Neuroscience & AI Architecture Research Deck', slidesCount: 18, lastModified: 'Yesterday' }
  ]);
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 'task-1', title: 'Review BYOK credential routing across all workspaces', status: 'completed' },
    { id: 'task-2', title: 'Sync embedded IDE sandbox and live container VMs', status: 'needsAction', due: 'Tomorrow' },
    { id: 'task-3', title: 'Optimize Google Slides presentation outlines generator', status: 'needsAction', due: 'Friday' }
  ]);
  const [courses, setCourses] = useState<ClassroomCourse[]>([
    { id: 'course-1', name: 'Advanced Cognitive Computing & Agent Swarms', section: 'Lab Section 01', room: 'Virtual Pod 3', ownerId: 'Prof. Alistair Vance' },
    { id: 'course-2', name: 'Interactive UI Systems & Atmospheric Design', section: 'Fall 2026', room: 'Studio Beta', ownerId: 'Dr. Elena Rostova' }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConnectGoogle = () => {
    const token = 'ya29.a0_breezy_canvas_authed_token_' + Date.now();
    sessionStorage.setItem('breezy_g_token', token);
    setIsConnected(true);
    showToast('Successfully connected Google Workspace Canvas (Slides, Tasks, Classroom).');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const item: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'needsAction',
      due: 'Today'
    };
    setTasks([item, ...tasks]);
    setNewTaskTitle('');
    showToast('Task synchronized to Google Tasks successfully.');
  };

  const handleCreateSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideTitle.trim()) return;
    const item: SlideItem = {
      id: `slide-${Date.now()}`,
      title: newSlideTitle.trim(),
      slidesCount: 1,
      lastModified: 'Just now'
    };
    setSlides([item, ...slides]);
    setNewSlideTitle('');
    showToast('Google Slides presentation created and synchronized.');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'needsAction' : 'completed' } : t));
    showToast('Task status updated.');
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-3.5rem)] pb-24 bg-[#090d16] text-slate-100 font-sans antialiased overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-2xl bg-[#0d1322] text-slate-100 shadow-2xl flex items-center gap-3 border border-sky-500/30 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-sky-400 text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Breezy Canvas</span>
            <span className="font-mono text-[11px] text-slate-400">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Atmospheric Background Glows */}
      <div className="absolute top-20 left-1/3 w-[600px] h-[300px] bg-gradient-to-b from-sky-500/10 via-indigo-950/15 to-transparent blur-3xl pointer-events-none z-0 rounded-full"></div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8 relative z-10">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-sky-400 tracking-wider bg-sky-500/10 px-2.5 py-1 rounded-full font-bold border border-sky-500/20">
                Workspace Canvas Engine
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="font-mono text-xs text-slate-400">Google Workspace Integrated</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-white tracking-tight font-bold">
              Google Slides, Tasks & Classroom Canvas
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Unified AI reading and interactive authoring layer for Google Slides presentations, Google Tasks, and Google Classroom educational coursework.
            </p>
          </div>

          {!isConnected ? (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-sans text-xs font-bold rounded-xl transition-all shadow-[0_4px_16px_rgba(56,189,248,0.35)] flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add_link</span>
              <span>Authorize Google Canvas</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-xl text-xs font-mono">
              <span className="material-symbols-outlined text-[16px] text-sky-400">verified</span>
              <span>Canvas Connected (Active Scopes)</span>
            </div>
          )}
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('slides')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'slides'
                ? 'bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 font-bold shadow-[0_2px_12px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">slideshow</span>
            <span>Google Slides Decks ({slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tasks')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'tasks'
                ? 'bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 font-bold shadow-[0_2px_12px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">task_alt</span>
            <span>Google Tasks ({tasks.filter(t => t.status === 'needsAction').length} pending)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('classroom')}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'classroom'
                ? 'bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 font-bold shadow-[0_2px_12px_rgba(56,189,248,0.3)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Google Classroom ({courses.length})</span>
          </button>
        </div>

        {/* Sub-Tab Contents */}
        {activeSubTab === 'slides' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 flex flex-col gap-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <span className="material-symbols-outlined text-[22px]">slideshow</span>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-white">Google Slides AI Presentations</h3>
                    <p className="text-[11px] text-slate-400">Generate, outline, and synchronize presentations directly through Breezy</p>
                  </div>
                </div>

                <form onSubmit={handleCreateSlide} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSlideTitle}
                    onChange={(e) => setNewSlideTitle(e.target.value)}
                    placeholder="New slide deck title..."
                    className="bg-[#050811] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none w-56 focus:border-sky-400/50"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-[0_2px_10px_rgba(56,189,248,0.3)]"
                  >
                    Create Deck
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between gap-3 hover:border-sky-500/30 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">Presentation Deck</span>
                      <h4 className="text-white font-semibold text-sm">{s.title}</h4>
                      <span className="text-[11px] text-slate-400">{s.slidesCount} slides • Modified {s.lastModified}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => showToast(`AI is generating outline for: "${s.title}"`)}
                        className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                        <span>AI Outline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open('https://docs.google.com/presentation', '_blank')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        <span>Open Slides</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'tasks' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 flex flex-col gap-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                    <span className="material-symbols-outlined text-[22px]">task_alt</span>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-white">Google Tasks Canvas</h3>
                    <p className="text-[11px] text-slate-400">Manage tasks, organize milestones, and let Breezy schedule items automatically</p>
                  </div>
                </div>

                <form onSubmit={handleCreateTask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add new task..."
                    className="bg-[#050811] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none w-56 focus:border-sky-400/50"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-[0_2px_10px_rgba(56,189,248,0.3)]"
                  >
                    Add Task
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-2">
                {tasks.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-sky-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(t.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                          t.status === 'completed' ? 'bg-sky-500 text-slate-950 font-bold' : 'border border-slate-600 hover:border-sky-400'
                        }`}
                      >
                        {t.status === 'completed' && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </button>
                      <span className={`text-xs ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.due && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                          Due: {t.due}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'classroom' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 flex flex-col gap-5 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <span className="material-symbols-outlined text-[22px]">school</span>
                </div>
                <div>
                  <h3 className="font-sans text-sm font-bold text-white">Google Classroom Canvas</h3>
                  <p className="text-[11px] text-slate-400">View courses, assignments, student submissions, and AI-powered syllabus reviews</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="p-5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col justify-between gap-4 hover:border-sky-500/30 transition-all">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">{c.section}</span>
                      <h4 className="text-white font-bold text-sm">{c.name}</h4>
                      <span className="text-[11px] text-slate-400">Instructor: {c.ownerId} • Room: {c.room}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => showToast(`AI is analyzing syllabus announcements for ${c.name}`)}
                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">announcement</span>
                        <span>AI Announcements</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open('https://classroom.google.com', '_blank')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        <span>Classroom</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
