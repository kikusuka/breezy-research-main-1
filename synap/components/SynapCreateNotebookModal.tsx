import React, { useState } from 'react';
import { SynapNotebook } from '../types/synap';

interface SynapCreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (notebook: Partial<SynapNotebook>, initialSourceText?: string, initialSourceTitle?: string) => void;
}

export const SynapCreateNotebookModal: React.FC<SynapCreateNotebookModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [track, setTrack] = useState('');
  const [examDate, setExamDate] = useState('');
  const [initialNotes, setInitialNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let computedDaysLeft = 0;
    let formattedDate = 'Unscheduled';

    if (examDate) {
      const target = new Date(examDate);
      if (!isNaN(target.getTime())) {
        formattedDate = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        computedDaysLeft = Math.max(0, Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }
    }

    onCreate(
      {
        title: title.trim(),
        courseCode: courseCode.trim() || 'General',
        track: track.trim() || 'Core Studies',
        examDate: formattedDate,
        daysLeft: computedDaysLeft,
      },
      initialNotes.trim() ? initialNotes.trim() : undefined,
      initialNotes.trim() ? `${title.trim()} - Syllabus & Overview` : undefined
    );

    setTitle('');
    setCourseCode('');
    setTrack('');
    setExamDate('');
    setInitialNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#14141e] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9d85f2]/20 text-[#ccbdff] border border-[#9d85f2]/30 flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">auto_stories</span>
            </div>
            <div>
              <h2 className="font-sans text-base font-bold text-stone-100">
                Create Course Notebook
              </h2>
              <p className="font-sans text-[11px] text-[#A5B0D6]">
                Set up a course repository for lecture notes, flashcards, and grounded AI study.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#cac4d4] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-[#ccbdff] font-semibold uppercase tracking-wider">
              Course / Subject Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Systems & Cloud Architecture"
              className="bg-[#0e0e16] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:border-[#9d85f2] outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-[#cac4d4]">
                Course Code
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS 452 or BIO 301"
                className="bg-[#0e0e16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:border-[#9d85f2] outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] text-[#cac4d4]">
                Field / Academic Track
              </label>
              <input
                type="text"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                placeholder="e.g. Computer Science, Pre-Med"
                className="bg-[#0e0e16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:border-[#9d85f2] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              Target Exam or Milestone Date (Optional)
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="bg-[#0e0e16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 focus:border-[#9d85f2] outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              Initial Course Notes or Syllabus (Optional)
            </label>
            <textarea
              rows={4}
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
              placeholder="Paste lecture excerpts, syllabus objectives, or key formulas to index immediately..."
              className="bg-[#0e0e16] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:border-[#9d85f2] outline-none resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#cac4d4] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-5 py-2 rounded-xl font-sans text-xs font-bold transition-all shadow-md cursor-pointer ${
                title.trim()
                  ? 'bg-[#9d85f2] hover:bg-[#8b5cf6] text-[#0d0d15] shadow-[0_4px_16px_rgba(157,133,242,0.3)]'
                  : 'bg-white/5 text-stone-500 cursor-not-allowed'
              }`}
            >
              Create Notebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
