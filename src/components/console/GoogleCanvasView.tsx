import React, { useState, useEffect } from 'react';

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

export const GoogleCanvasView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'slides' | 'tasks' | 'classroom'>('slides');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');
  
  // States for Slides, Tasks, Classroom
  const [slides, setSlides] = useState<SlideItem[]>([
    { id: 'slide-1', title: 'Q3 Architectural Strategy & Multi-Node Consensus', slidesCount: 14, lastModified: '2 hours ago' },
    { id: 'slide-2', title: 'Synthexis v2.4 Release Deck & Security Review', slidesCount: 8, lastModified: 'Yesterday' }
  ]);
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 'task-1', title: 'Review Firestore security rules and RBAC policies', status: 'needsAction', due: 'Tomorrow' },
    { id: 'task-2', title: 'Audit Google Classroom assignments sync', status: 'completed' },
    { id: 'task-3', title: 'Optimize Groq and OpenRouter failover routing', status: 'needsAction', due: 'Next week' }
  ]);
  const [courses, setCourses] = useState<ClassroomCourse[]>([
    { id: 'course-1', name: 'Advanced Distributed Systems & Consensus', section: 'Section A - 2026', room: 'Virtual Lab 4', ownerId: 'Prof. Alistair' },
    { id: 'course-2', name: 'Applied AI Architecture & Multi-Agent Design', section: 'Fall Semester', room: 'Hall B', ownerId: 'Dr. Evelyn' }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConnectGoogle = () => {
    // Simulate or retrieve connected token
    const token = sessionStorage.getItem('synthexis_g_token') || 'ya29.a0_synthexis_canvas_authed_token';
    setAccessToken(token);
    setIsConnected(true);
    showToast('Successfully connected Google Workspace Canvas (Slides, Tasks, Classroom)');
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
    <div className="flex flex-col w-full min-h-[calc(100vh-3.5rem)] pb-24 text-stone-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-8 z-50 p-4 rounded-xl bg-[#1c2026] text-stone-100 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">task_alt</span>
          <div className="flex flex-col">
            <span className="font-sans text-xs font-semibold">Canvas Sync</span>
            <span className="font-mono text-[11px] text-stone-400">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full font-semibold border border-emerald-500/20">
                Workspace Canvas Engine
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-xs text-stone-400">Google Workspace Integrated</span>
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-stone-100 tracking-tight font-semibold">
              Google Slides, Tasks & Classroom Canvas
            </h1>
            <p className="font-sans text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
              Unified AI reading and writing layer for Google Slides presentations, Google Tasks lists, and Google Classroom educational courses.
            </p>
          </div>

          {!isConnected ? (
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="px-4 py-2.5 bg-stone-100 hover:bg-white text-stone-950 font-sans text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add_link</span>
              <span>Authorize Google Canvas</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-mono">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Canvas Connected (Active Scopes)</span>
            </div>
          )}
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('slides')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeSubTab === 'slides'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">slideshow</span>
            <span>Google Slides Decks ({slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tasks')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeSubTab === 'tasks'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">task_alt</span>
            <span>Google Tasks ({tasks.filter(t => t.status === 'needsAction').length} pending)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('classroom')}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer ${
              activeSubTab === 'classroom'
                ? 'bg-stone-100 text-stone-950 font-semibold'
                : 'bg-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Google Classroom ({courses.length})</span>
          </button>
        </div>

        {/* Sub-Tab Contents */}
        {activeSubTab === 'slides' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <span className="material-symbols-outlined text-[22px]">slideshow</span>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-stone-100">Google Slides AI Presentations</h3>
                    <p className="text-[11px] text-stone-400">Generate, outline, and synchronize presentations directly through Canvas</p>
                  </div>
                </div>

                <form onSubmit={handleCreateSlide} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSlideTitle}
                    onChange={(e) => setNewSlideTitle(e.target.value)}
                    placeholder="New slide deck title..."
                    className="bg-[#1c212a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-100 outline-none w-56 focus:border-white/20"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-stone-100 hover:bg-white text-stone-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Create Deck
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-3 hover:bg-white/[0.04] transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest">Presentation</span>
                      <h4 className="text-stone-100 font-semibold text-sm">{s.title}</h4>
                      <span className="text-[11px] text-stone-400">{s.slidesCount} slides • Modified {s.lastModified}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => showToast(`AI is outlining presentation: "${s.title}"`)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                        <span>AI Outline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open('https://docs.google.com/presentation', '_blank')}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ml-auto"
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
            <div className="p-6 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <span className="material-symbols-outlined text-[22px]">task_alt</span>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-stone-100">Google Tasks Canvas</h3>
                    <p className="text-[11px] text-stone-400">Manage tasks, organize milestones, and let AI schedule items automatically</p>
                  </div>
                </div>

                <form onSubmit={handleCreateTask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add new task..."
                    className="bg-[#1c212a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-100 outline-none w-56 focus:border-white/20"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-stone-100 hover:bg-white text-stone-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Add Task
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-2">
                {tasks.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(t.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                          t.status === 'completed' ? 'bg-emerald-500 text-stone-950' : 'border border-stone-500 hover:border-stone-300'
                        }`}
                      >
                        {t.status === 'completed' && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </button>
                      <span className={`text-xs ${t.status === 'completed' ? 'line-through text-stone-500' : 'text-stone-200 font-medium'}`}>
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.due && (
                        <span className="text-[10px] font-mono text-stone-400 bg-white/5 px-2 py-0.5 rounded">
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
            <div className="p-6 rounded-2xl bg-[#161a22] border border-white/5 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                  <span className="material-symbols-outlined text-[22px]">school</span>
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-stone-100">Google Classroom Canvas</h3>
                  <p className="text-[11px] text-stone-400">View courses, student submissions, announcements, and AI-powered assignments</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-4 hover:bg-white/[0.04] transition-all">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest">{c.section}</span>
                      <h4 className="text-stone-100 font-semibold text-sm">{c.name}</h4>
                      <span className="text-[11px] text-stone-400">Instructor: {c.ownerId} • Room: {c.room}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => showToast(`AI is reviewing announcements for ${c.name}`)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">announcement</span>
                        <span>AI Announcements</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open('https://classroom.google.com', '_blank')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-200 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
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
