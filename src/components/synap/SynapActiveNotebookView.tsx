import React, { useState } from 'react';
import { SynapNotebook } from '../../types/synap';

interface SynapActiveNotebookViewProps {
  notebook: SynapNotebook;
  onSendMessage: (text: string) => void;
  onAddSourceModal: () => void;
  onMakeFlashcards: () => void;
  onOpenExamProbe: () => void;
}

export const SynapActiveNotebookView: React.FC<SynapActiveNotebookViewProps> = ({
  notebook,
  onSendMessage,
  onAddSourceModal,
  onMakeFlashcards,
  onOpenExamProbe,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const insertPrompt = (text: string) => {
    setInputVal(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1520px] mx-auto animate-in fade-in duration-300">
      {/* LEFT COLUMN: Knowledge Base & Topic Mastery Tree (4 cols) */}
      <aside className="lg:col-span-4 flex flex-col gap-5">
        {/* Course Sources Card */}
        <div className="p-5 rounded-2xl bg-[#1f1f27] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ccbdff] text-[20px]">
                layers
              </span>
              <h2 className="font-sans text-sm font-semibold text-stone-100">
                Course Sources
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#292932] text-[#cac4d4] font-semibold">
                {notebook.sources.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onAddSourceModal}
              className="group flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#292932] hover:bg-[#34343d] text-[#ccbdff] hover:text-white text-xs font-semibold transition-all border border-white/5 cursor-pointer shadow-[inset_0_1px_0_rgba(232,235,255,0.08)]"
            >
              <span className="material-symbols-outlined text-[15px] transition-transform group-hover:rotate-90">
                add
              </span>
              <span>Add Doc / PDF</span>
            </button>
          </div>
          <p className="font-sans text-xs text-[#cac4d4]">
            Indexed against cognitive psychology, electrophysiology, and lecture audio embeddings.
          </p>

          {/* Sources List */}
          <div className="flex flex-col gap-2 pt-1">
            {notebook.sources.map((source, index) => {
              const isActive = index === 0;
              const hasWeak = !!source.weakSpotsTied;

              return (
                <div
                  key={source.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 relative overflow-hidden ${
                    isActive
                      ? 'bg-[#292932] border-[#9D85F2]/30 shadow-[0_4px_20px_-2px_rgba(10,10,15,0.7)]'
                      : 'bg-[#1b1b23] border-white/5 hover:bg-[#1f1f27]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ccbdff] to-[#9d85f2]"></div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`material-symbols-outlined text-[18px] shrink-0 ${
                          isActive ? 'text-[#ccbdff]' : 'text-[#cac4d4]'
                        }`}
                      >
                        {source.type === 'pdf'
                          ? 'picture_as_pdf'
                          : source.type === 'slides'
                          ? 'slideshow'
                          : 'description'}
                      </span>
                      <span className="font-sans text-xs text-stone-100 font-medium truncate">
                        {source.title}
                      </span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[#45dfa4] text-[18px] shrink-0">
                        check_circle
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[#cac4d4] font-mono text-[10px] pl-6">
                    <span>
                      {source.notesCount ? `${source.notesCount} notes indexed` : source.wordCount || 'Synced'}
                    </span>
                    {source.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ccbdff]/10 text-[#ccbdff] font-semibold uppercase tracking-wide">
                        {source.badge}
                      </span>
                    )}
                    {hasWeak && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#93000a]/40 text-[#ffb4ab] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-ping"></span>
                        {source.weakSpotsTied} weak spots tied
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Mastery Tree Card */}
        <div className="p-5 rounded-2xl bg-[#1f1f27] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#cabeff] text-[20px]">
                account_tree
              </span>
              <h3 className="font-sans text-sm font-semibold text-stone-100">
                Topic Mastery Tree
              </h3>
            </div>
            <span className="font-mono text-[11px] text-[#938e9d]">
              Unit 3: Synaptic
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {notebook.topicTree.map((topic) => {
              if (topic.isWeakSpot) {
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      topic.drillPrompt && insertPrompt(topic.drillPrompt)
                    }
                    className="w-full text-left flex flex-col gap-1 p-2.5 rounded-xl bg-[#1b1b23] hover:bg-[#292932] border border-[#ffb4ab]/20 transition-all group shadow-[0_0_12px_rgba(248,113,113,0.08)] cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-stone-100 font-sans flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                        {topic.name}
                        <span className="material-symbols-outlined text-[#ffb4ab] text-[14px]">
                          priority_high
                        </span>
                      </span>
                      <span className="text-[#ffb4ab] font-bold">
                        {topic.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#ffb4ab] h-full rounded-full"
                        style={{ width: `${topic.progress}%` }}
                      ></div>
                    </div>
                    <span className="font-sans text-[11px] text-[#ccbdff] group-hover:text-white flex items-center gap-1 pt-0.5 opacity-90 transition-opacity">
                      <span className="material-symbols-outlined text-[13px]">
                        psychology
                      </span>
                      Click to ask Synap to break this down
                    </span>
                  </button>
                );
              }

              return (
                <div
                  key={topic.id}
                  className="flex flex-col gap-1 p-2.5 rounded-xl bg-[#1b1b23] border border-white/5"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-stone-100 font-sans flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
                      {topic.name}
                    </span>
                    <span className="text-[#45dfa4] font-bold">
                      {topic.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0d0d15] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#45dfa4] h-full rounded-full"
                      style={{ width: `${topic.progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Synapse Topology Schematic Box */}
          <div className="mt-1 p-3.5 rounded-xl bg-[#0d0d15] border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#938e9d]">
              <span>SYNAPSE TOPOLOGY SCHEMATIC</span>
              <span className="text-[#cabeff]">Ch.12 p.254</span>
            </div>
            <div className="w-full h-24 rounded-lg overflow-hidden relative flex items-center justify-center bg-[#292932]/50 border border-white/5">
              <svg
                className="w-full h-full text-[#ccbdff]"
                fill="none"
                viewBox="0 0 300 110"
              >
                <path
                  d="M10 30 C 70 30, 90 70, 150 70 C 210 70, 230 30, 290 30"
                  stroke="#484552"
                  strokeDasharray="4 4"
                  strokeWidth="2"
                ></path>
                {/* Presynaptic Bouton */}
                <path
                  d="M 60 10 Q 150 35 240 10"
                  stroke="#ccbdff"
                  strokeWidth="2"
                ></path>
                <circle cx="100" cy="20" fill="#68fcbf" opacity="0.8" r="4"></circle>
                <circle cx="120" cy="18" fill="#68fcbf" opacity="0.8" r="4"></circle>
                <circle cx="140" cy="22" fill="#68fcbf" opacity="0.8" r="4"></circle>
                <circle cx="160" cy="17" fill="#68fcbf" opacity="0.8" r="4"></circle>
                <circle cx="180" cy="21" fill="#68fcbf" opacity="0.8" r="4"></circle>
                {/* Postsynaptic Density */}
                <path
                  d="M 50 90 Q 150 75 250 90"
                  stroke="#ccbdff"
                  strokeWidth="2.5"
                ></path>
                {/* AMPA receptor */}
                <rect fill="#cabeff" height="18" rx="3" width="16" x="95" y="70"></rect>
                <text fill="#cac4d4" fontSize="8" x="96" y="65">
                  AMPA
                </text>
                {/* NMDA receptor with Mg2+ cork */}
                <rect fill="#9d85f2" height="22" rx="4" width="22" x="175" y="68"></rect>
                <circle cx="186" cy="74" fill="#ffb4ab" r="3.5"></circle>
                <text fill="#ffb4ab" fontSize="8" x="172" y="62">
                  NMDA+Mg²⁺
                </text>
                {/* Calcium Rush Arrow */}
                <path
                  d="M 186 42 L 186 64"
                  stroke="#45dfa4"
                  strokeWidth="1.5"
                ></path>
              </svg>
            </div>
            <span className="text-center font-sans text-[11px] text-[#cac4d4]">
              Postsynaptic receptor distribution preview
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT COLUMN: Grounded Study Partner (8 cols) */}
      <main className="lg:col-span-8 flex flex-col gap-4">
        {/* Partner Status Toolbar */}
        <div className="p-4 rounded-2xl bg-[#1f1f27] border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.06)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9d85f2] via-[#4918c8] to-[#cabeff] flex items-center justify-center shadow-[0_0_16px_rgba(157,133,242,0.35)]">
                <span className="material-symbols-outlined text-white text-[22px]">
                  cognition
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#45dfa4] ring-2 ring-[#1f1f27]"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-sans text-sm font-bold text-stone-100 truncate">
                  Synap Study Partner
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#292932] text-[#45dfa4] font-mono text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span>{' '}
                  Active Grounding
                </span>
              </div>
              <span className="font-sans text-xs text-[#cac4d4] truncate">
                Grounded in <span className="text-[#e7deff]">Kandel Ch. 12</span> &{' '}
                <span className="text-[#e7deff]">Lecture 8 LTP Slides</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onOpenExamProbe}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292932] hover:bg-[#34343d] text-stone-100 font-sans text-xs font-semibold transition-all border border-white/5 cursor-pointer shadow-[inset_0_1px_0_rgba(232,235,255,0.08)]"
            >
              <span className="material-symbols-outlined text-[#cabeff] text-[16px]">
                mystery
              </span>
              <span>Exam Readiness Probe</span>
            </button>

            <button
              type="button"
              onClick={onMakeFlashcards}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#9d85f2] to-[#4918c8] text-white font-sans text-xs font-semibold transition-all hover:brightness-110 shadow-[0_4px_16px_rgba(124,92,252,0.3)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">style</span>
              <span>Make Flashcards</span>
            </button>
          </div>
        </div>

        {/* Dialogue Thread */}
        <div className="flex flex-col gap-6 p-6 rounded-2xl bg-[#0d0d15]/80 border border-white/5 shadow-[inset_0_1px_1px_0_rgba(232,235,255,0.04)] min-h-[580px] max-h-[640px] overflow-y-auto">
          {/* Scope Marker */}
          <div className="flex items-center gap-4 my-1">
            <div className="flex-1 h-px bg-[#34343d]/40"></div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#938e9d]">
              Session Focus: Coincidence Detection & Voltage-Gated Block
            </span>
            <div className="flex-1 h-px bg-[#34343d]/40"></div>
          </div>

          {notebook.chat.map((msg) => {
            const isUser = msg.role === 'user';
            if (isUser) {
              return (
                <div
                  key={msg.id}
                  className="flex items-start justify-end gap-3 group"
                >
                  <div className="flex flex-col items-end gap-1.5 max-w-[82%]">
                    <div className="p-4 rounded-2xl rounded-tr-sm bg-[#292932] text-stone-100 font-sans text-sm shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/5 leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#938e9d] px-1">
                      <span>Elena</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      <span className="material-symbols-outlined text-[14px] text-[#45dfa4]">
                        done_all
                      </span>
                    </div>
                  </div>
                  <img
                    alt="Elena"
                    className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#cabeff]/20"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  />
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ccbdff] to-[#cabeff] flex items-center justify-center text-[#351584] shrink-0 shadow-[0_0_12px_rgba(157,133,242,0.4)]">
                  <span className="material-symbols-outlined text-[18px]">
                    neurology
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-w-[88%]">
                  <div className="p-5 rounded-2xl rounded-tl-sm bg-[#1f1f27] text-stone-100 font-sans text-sm shadow-[0_4px_20px_-2px_rgba(10,10,15,0.7)] border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[#cabeff] font-sans text-xs font-semibold">
                      <span className="material-symbols-outlined text-[18px] text-[#ccbdff]">
                        tips_and_updates
                      </span>
                      <span>{msg.content}</span>
                    </div>

                    {/* Step Cards if present */}
                    {msg.steps && (
                      <div className="grid grid-cols-1 gap-2">
                        {msg.steps.map((step) => (
                          <div
                            key={step.stepNum}
                            className="p-3 rounded-xl bg-[#1b1b23] border border-white/5 flex gap-3 items-start"
                          >
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#ccbdff]/20 text-[#ccbdff] font-bold text-xs shrink-0">
                              {step.stepNum}
                            </span>
                            <div className="font-sans text-xs leading-relaxed text-[#cac4d4]">
                              <strong className="text-stone-100 font-semibold">
                                {step.title}:{' '}
                              </strong>
                              {step.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations Pill */}
                    {msg.citations && (
                      <div className="flex items-center gap-2 pt-1">
                        {msg.citations.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#292932] text-[#cabeff] font-mono text-[11px] border border-white/5"
                          >
                            <span className="material-symbols-outlined text-[14px] text-[#ccbdff]">
                              menu_book
                            </span>
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Coach Quick Check Trigger */}
                    <div className="p-3.5 rounded-xl bg-[#1b1b23] border border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#cabeff] text-[20px]">
                          timer
                        </span>
                        <div className="flex flex-col">
                          <span className="font-sans text-xs font-semibold text-stone-100">
                            Ready to test this right now?
                          </span>
                          <span className="font-sans text-[11px] text-[#cac4d4]">
                            Synap prepared a 10-second check on this exact mechanism.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          insertPrompt(
                            'Give me the 10-second check on the NMDA magnesium unblock mechanism.'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#292932] hover:bg-[#34343d] text-[#ccbdff] font-sans text-xs font-semibold transition-all border border-white/5 cursor-pointer shrink-0"
                      >
                        Answer quick check
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#938e9d] px-1">
                    <span>Synap Cognitive Companion</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Grounded Prompt Input Bar */}
        <div className="p-4 rounded-2xl bg-[#1f1f27] border border-white/5 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.8)] flex flex-col gap-2.5">
          {/* Quick Chip Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  insertPrompt(
                    'Test me with a hard multiple-choice question on Ca2+ signaling.'
                  )
                }
                className="px-3 py-1 rounded-full bg-[#292932] hover:bg-[#34343d] text-[#cac4d4] hover:text-stone-100 font-sans text-xs transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#cabeff] text-[14px]">
                  quiz
                </span>
                <span>Test Me on This</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  insertPrompt(
                    'Explain the difference between early-LTP and late-LTP protein synthesis.'
                  )
                }
                className="px-3 py-1 rounded-full bg-[#292932] hover:bg-[#34343d] text-[#cac4d4] hover:text-stone-100 font-sans text-xs transition-all flex items-center gap-1 border border-white/5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[#ccbdff] text-[14px]">
                  compare_arrows
                </span>
                <span>Compare Early vs Late LTP</span>
              </button>
            </div>
            <span className="font-mono text-[10px] text-[#938e9d] hidden sm:inline">
              Enter to send inquiry
            </span>
          </div>

          {/* Input Box */}
          <div className="flex items-center bg-[#0d0d15] rounded-xl p-1.5 border border-white/5 focus-within:border-[#9D85F2]/50 transition-all">
            <button
              type="button"
              onClick={onAddSourceModal}
              className="w-9 h-9 rounded-lg hover:bg-[#1f1f27] text-[#cac4d4] hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
              title="Attach specific course file or diagram"
            >
              <span className="material-symbols-outlined text-[18px]">
                attach_file
              </span>
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question grounded in your course materials... (e.g. 'Why is CaMKII autonomous?')"
              className="w-full bg-transparent px-3 py-2 font-sans text-xs text-stone-100 placeholder:text-[#938e9d] focus:outline-none"
            />

            <div className="flex items-center gap-1.5 shrink-0 pr-1">
              <button
                type="button"
                onClick={() => setIsMicActive(!isMicActive)}
                className={`w-9 h-9 rounded-lg hover:bg-[#1f1f27] flex items-center justify-center transition-all cursor-pointer ${
                  isMicActive ? 'text-[#ffb4ab] animate-pulse' : 'text-[#cac4d4] hover:text-white'
                }`}
                title="Deep Voice Query"
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={!inputVal.trim()}
                className={`px-4 py-2 rounded-lg font-sans text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  inputVal.trim()
                    ? 'bg-gradient-to-r from-[#ccbdff] to-[#9d85f2] text-[#331282] shadow-[0_4px_16px_rgba(124,92,252,0.3)] hover:brightness-110'
                    : 'bg-white/5 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[15px]">
                  arrow_upward
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 font-mono text-[10px] text-[#938e9d]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span>
              <span>
                Synthesizing from 4 indexed documents • Hallucination Safeguard ON
              </span>
            </div>
            <span>Synap v2.4 • Neuroscience Spec</span>
          </div>
        </div>
      </main>
    </div>
  );
};
