import React, { useState } from 'react';

interface SynapAddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (title: string, text: string) => void;
}

export const SynapAddSourceModal: React.FC<SynapAddSourceModalProps> = ({
  isOpen,
  onClose,
  onAddSource,
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddSource(title.trim() || 'Untitled Source Note', text.trim());
    setTitle('');
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#181824] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-stone-100">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ccbdff] text-[22px]">
              post_add
            </span>
            <h2 className="font-sans text-base font-bold">
              Add Course Source / Note
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#cac4d4] hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              Source Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lecture 9 Hippocampal LTP Slides.pdf"
              className="bg-[#0E0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              Extracted Text / Syllabus / Lecture Notes
            </label>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your course notes, transcript excerpts, or study material here..."
              className="bg-[#0E0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#cac4d4] hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                text.trim()
                  ? 'bg-[#ccbdff] text-[#331282] hover:bg-white'
                  : 'bg-white/5 text-stone-500 cursor-not-allowed'
              }`}
            >
              Index Source into Synap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
