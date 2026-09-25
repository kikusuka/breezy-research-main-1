import React from 'react';
import { SynapNavView } from '../../types/synap';

interface SynapSidebarProps {
  activeView: SynapNavView;
  onSelectView: (view: SynapNavView) => void;
  onOpenProfile: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SynapSidebar: React.FC<SynapSidebarProps> = ({
  activeView,
  onSelectView,
  onOpenProfile,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: SynapNavView; label: string; icon: string }[] = [
    { id: 'notebooks', label: 'Notebooks', icon: 'auto_stories' },
    { id: 'active-notebook', label: 'Active Notebook', icon: 'neurology' },
    { id: 'weak-spots', label: 'Weak Spots', icon: 'crisis_alert' },
    { id: 'flashcard-review', label: 'Flashcard Review', icon: 'style' },
    { id: 'quiz-mode', label: 'Quiz Mode', icon: 'psychology_alt' },
    { id: 'study-plan', label: 'Study Plan', icon: 'event_upcoming' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#0d0d15]/95 backdrop-blur-2xl z-50 flex flex-col justify-between p-6 border-r border-white/5 transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Mark */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-[#181824] border border-[#9D85F2]/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(157,133,242,0.2)]">
              <svg width="22" height="22" viewBox="0 0 40 40">
                <circle cx="12" cy="12" r="3" fill="#B8A9F8" />
                <circle cx="26" cy="10" r="2.2" fill="#9D85F2" />
                <circle cx="20" cy="26" r="3.5" fill="#7C5CFC" />
                <path
                  d="M12 12L26 10M12 12L20 26M26 10L20 26"
                  stroke="#B8A9F8"
                  strokeOpacity="0.7"
                  strokeWidth="1.4"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-lg text-stone-100 font-bold tracking-tight leading-none">
                Synap
              </span>
              <span className="font-mono text-[10px] text-[#A5B0D6] tracking-wider uppercase mt-1">
                Cognitive Companion
              </span>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="p-3.5 rounded-xl bg-[#1b1b23] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] flex items-center gap-3">
            <img
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#9D85F2]/30"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-xs font-semibold text-stone-100 truncate">
                Elena Rostova
              </span>
              <span className="font-mono text-[11px] text-[#A5B0D6] truncate">
                Neuroscience & CS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile?.();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#9d85f2] text-[#0A0A0F] font-bold shadow-[0_4px_16px_rgba(124,92,252,0.3)]'
                      : 'text-[#A5B0D6] hover:bg-[#1f1f27] hover:text-stone-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer & Focus Mode Drawer */}
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-[#1b1b23] border border-white/5 flex flex-col gap-1.5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#A5B0D6] uppercase tracking-wider">
                Focus Mode
              </span>
              <span className="material-symbols-outlined text-[#45dfa4] text-[18px]">
                ambient_screen
              </span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-sans text-xs text-stone-200">
                Late-Night Session
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-pulse"></span>
            </div>
          </div>

          <div
            onClick={onOpenProfile}
            className="p-3 rounded-xl bg-[#181824] hover:bg-[#222233] border border-white/5 flex items-center justify-between cursor-pointer transition-colors shadow-inner"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                alt="Profile Avatar"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#9D85F2]/30 shrink-0"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-xs font-bold text-stone-100 truncate">
                  Elena Rostova
                </span>
                <span className="font-mono text-[10px] text-[#A5B0D6] truncate">
                  Neuroscience & CS
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-stone-400">
              tune
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
