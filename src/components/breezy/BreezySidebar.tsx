import React from 'react';

interface BreezyChat {
  id: string;
  title: string;
  messages: any[];
  createdAt: string;
}

interface BreezySidebarProps {
  chats: Record<string, BreezyChat>;
  activeId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onOpenProfile: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const BreezySidebar: React.FC<BreezySidebarProps> = ({
  chats,
  activeId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenProfile,
  isOpenMobile,
  onCloseMobile,
}) => {
  const chatList = Object.values(chats).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#0d1322]/90 backdrop-blur-xl border-r border-slate-800/80 z-50 flex flex-col justify-between p-4 transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <span className="material-symbols-outlined text-lg">air</span>
              </div>
              <span className="font-sans text-sm font-bold text-white tracking-tight">
                Breezy
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* New Chat trigger */}
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile?.();
            }}
            className="w-full py-2 px-4 rounded-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-sans text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(56,189,248,0.35)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span>New Chat</span>
          </button>

          {/* Stream List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <span className="px-2 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                Current Streams
              </span>

              {chatList.length === 0 ? (
                <p className="px-2 font-sans text-xs text-slate-500 mt-1">
                  No active streams yet.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {chatList.map((c) => {
                    const isActive = c.id === activeId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectChat(c.id);
                          onCloseMobile?.();
                        }}
                        className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-800/80 text-sky-300 border border-sky-500/20'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`material-symbols-outlined text-base shrink-0 ${
                              isActive ? 'text-sky-400' : 'text-slate-500'
                            }`}
                          >
                            chat_bubble
                          </span>
                          <span className="truncate font-sans text-xs font-medium">
                            {c.title || 'New chat stream'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => onDeleteChat(c.id, e)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            close
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Card Bottom Bar */}
        <div
          onClick={onOpenProfile}
          className="pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/50 p-2.5 rounded-2xl cursor-pointer hover:bg-slate-800/50 transition-colors border border-white/5"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              alt="Elena Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/40 shrink-0"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-xs font-bold text-slate-200 leading-tight truncate">
                Elena Rostova
              </span>
              <span className="font-sans text-[11px] text-slate-400 leading-none truncate mt-0.5">
                Neuroscience & CS
              </span>
            </div>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white shrink-0"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
          </button>
        </div>
      </aside>
    </>
  );
};
