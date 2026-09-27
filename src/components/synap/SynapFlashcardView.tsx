import React, { useState, useEffect, useCallback } from 'react';
import { SynapStudyItem } from '../../types/synap';

interface SynapFlashcardViewProps {
  studyItems: SynapStudyItem[];
  onRateCard: (cardId: string, rating: number, isCorrect: boolean) => void;
  onExit: () => void;
  onAskAiToBreakDown: (concept: string) => void;
}

const STORAGE_KEY_BOOKMARKS = 'synap:bookmarked_cards';

export const SynapFlashcardView: React.FC<SynapFlashcardViewProps> = ({
  studyItems,
  onRateCard,
  onExit,
  onAskAiToBreakDown,
}) => {
  const cards = studyItems.filter((i) => i.type === 'flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBookmark = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      try {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const currentCard = cards[currentIndex % (cards.length || 1)] || null;

  const handleRate = useCallback(
    (rating: number) => {
      if (!currentCard) return;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      const isCorrect = rating >= 3;
      onRateCard(currentCard.id, rating, isCorrect);
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    },
    [currentCard, cards.length, onRateCard]
  );

  const speakCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentCard || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = isFlipped
      ? `Prompt: ${currentCard.prompt}. Answer: ${currentCard.answer || currentCard.explanation || ''}`
      : currentCard.prompt;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Global Keyboard Shortcuts (1-4, Space, Esc, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an active input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        handleRate(1);
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate(2);
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate(3);
      } else if (e.key === '4') {
        e.preventDefault();
        handleRate(4);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        onExit();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [handleRate, onExit, cards.length]);

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[#cac4d4]">
        <span className="material-symbols-outlined text-[48px] text-[#ccbdff] mb-3">
          style
        </span>
        <h2 className="font-sans text-lg font-bold text-stone-100">
          No Flashcards in Active Notebook
        </h2>
        <p className="font-sans text-xs max-w-sm mt-1">
          Generate flashcards from your uploaded course notes or PDFs in the Active Notebook view.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 px-4 py-2 bg-[#9d85f2] text-[#331282] rounded-xl font-sans text-xs font-bold cursor-pointer hover:bg-white transition-all shadow-md"
        >
          Go to Active Notebook
        </button>
      </div>
    );
  }

  const masteredCount = cards.filter((c) => c.history && c.history.some((h) => h.correct)).length;
  const strugglingCount = cards.filter((c) => c.history && c.history.some((h) => !h.correct)).length;
  const reviewingCount = Math.max(0, cards.length - masteredCount - strugglingCount);
  const isBookmarked = currentCard ? bookmarkedIds.has(currentCard.id) : false;

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center animate-in fade-in duration-300">
      {/* Ambient Atmospheric Glows */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[620px] h-[360px] bg-[#4918c8]/15 rounded-full blur-[110px] pointer-events-none -z-10"></div>
      <div className="absolute top-48 left-1/3 w-[340px] h-[240px] bg-[#00ab78]/10 rounded-full blur-[90px] pointer-events-none -z-10"></div>

      {/* Top Focus Session Bar */}
      <header className="w-full flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#292932] text-[#ccbdff] border border-white/5">
              <span className="material-symbols-outlined text-[17px]">
                psychology
              </span>
            </span>
            <div className="flex items-center gap-1.5 text-[#cac4d4] font-sans text-xs truncate">
              <span className="text-stone-100 font-semibold tracking-tight">
                Course Study Session
              </span>
              <span className="text-[#938e9d]">•</span>
              <span className="truncate">
                {currentCard?.topic || 'Active Concept'}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1b23] border border-white/5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
              <span className="text-stone-100 font-bold">{masteredCount}</span>
              <span className="text-[#cac4d4]">Mastered</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1b23] border border-white/5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#cabeff]"></span>
              <span className="text-stone-100 font-bold">{reviewingCount}</span>
              <span className="text-[#cac4d4]">Reviewing</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1b23] border border-white/5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
              <span className="text-stone-100 font-bold">{strugglingCount}</span>
              <span className="text-[#cac4d4]">Struggling</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onExit();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1b1b23] hover:bg-[#292932] text-[#cac4d4] hover:text-stone-100 transition-all font-sans text-xs border border-white/5 cursor-pointer shadow-[inset_0_1px_0_rgba(232,235,255,0.04)]"
          >
            <span className="material-symbols-outlined text-[15px]">
              arrow_back
            </span>
            <span>Exit</span>
            <kbd className="ml-1 px-1 py-0.2 rounded bg-[#34343d] text-[#938e9d] text-[10px] font-mono">
              Esc
            </kbd>
          </button>
        </div>

        {/* Linear Progress Track */}
        <div className="w-full flex items-center gap-4 pt-1">
          <div className="flex-1 h-1.5 rounded-full bg-[#0d0d15] overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#ccbdff] via-[#9d85f2] to-[#45dfa4] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(157,133,242,0.4)]"
              style={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#cac4d4]">
            <span className="text-stone-100 font-bold">
              Card {currentIndex + 1}
            </span>
            <span className="text-[#938e9d]">/ {cards.length}</span>
            <span className="text-[#e7deff] ml-1">
              ({Math.round(((currentIndex + 1) / cards.length) * 100)}%)
            </span>
          </div>
        </div>
      </header>

      {/* Main Flashcard Stage */}
      <div className="relative w-full max-w-[760px] min-h-[440px]">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full h-full rounded-[2rem] bg-[#1b1b23] border border-white/5 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.85),0_0_28px_2px_rgba(157,133,242,0.08),inset_0_1px_1px_0_rgba(232,235,255,0.09)] transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 overflow-hidden cursor-pointer"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34343d] text-stone-100 font-mono text-xs border border-white/5">
                <span className="material-symbols-outlined text-[13px] text-[#ccbdff]">
                  tag
                </span>
                <span>Concept #{currentIndex + 1}</span>
              </span>

              {currentCard.vulnerability === 'critical' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#93000a]/40 text-[#ffb4ab] font-mono text-xs border border-[#ffb4ab]/20 shadow-[0_0_12px_rgba(147,0,10,0.25)] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                  <span>Needs Review</span>
                  <span className="text-[#cac4d4] font-mono text-[10px] bg-[#0d0d15]/60 px-1.5 py-0.5 rounded">
                    {currentCard.riskImpact || 'Priority'}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[#cac4d4]">
              <button
                type="button"
                onClick={speakCard}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isSpeaking
                    ? 'bg-[#ccbdff] text-[#331282] ring-2 ring-[#9d85f2] animate-pulse'
                    : 'hover:bg-[#292932] text-[#cac4d4] hover:text-white'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read card aloud (TTS)'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSpeaking ? 'volume_off' : 'volume_up'}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => toggleBookmark(currentCard.id, e)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#9d85f2]/20 text-[#ccbdff]'
                    : 'hover:bg-[#292932] text-[#cac4d4] hover:text-white'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark concept'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isBookmarked ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="relative z-10 flex flex-col my-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] text-[#ccbdff] uppercase tracking-wider font-bold">
                PROMPT
              </span>
              <h2 className="font-sans text-lg sm:text-xl text-stone-100 font-bold tracking-tight leading-snug">
                {currentCard.prompt}
              </h2>
            </div>

            {isFlipped ? (
              <>
                <div className="w-full my-4 flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#484552]/40 shadow-[0_1px_3px_rgba(157,133,242,0.15)]"></div>
                  <span className="font-mono text-[10px] text-[#cac4d4]/70 uppercase tracking-widest px-1 font-semibold">
                    Target Answer &amp; Key Synthesis
                  </span>
                  <div className="flex-1 h-px bg-[#484552]/40 shadow-[0_1px_3px_rgba(157,133,242,0.15)]"></div>
                </div>

                <div className="flex flex-col gap-3 text-stone-200">
                  <div className="p-4 rounded-xl bg-[#1f1f27]/80 border border-white/5 flex flex-col gap-2">
                    <span className="font-sans text-xs font-semibold text-[#cabeff]">
                      Answer:
                    </span>
                    <p className="font-sans text-sm text-stone-100 leading-relaxed">
                      {currentCard.answer || currentCard.explanation || 'No answer details specified for this card.'}
                    </p>
                  </div>

                  {currentCard.explanation && currentCard.explanation !== currentCard.answer && (
                    <div className="p-3.5 rounded-xl bg-[#0d0d15] border border-white/5 flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase text-[#68fcbf] font-semibold">
                        Conceptual Explanation
                      </span>
                      <p className="font-sans text-xs text-[#cac4d4] leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-[#938e9d] font-sans text-xs">
                Click or press Space to flip and reveal answer
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#cac4d4] relative z-10 border-t border-white/5">
            <div className="flex items-center gap-1.5 font-sans text-xs">
              <span className="material-symbols-outlined text-[15px] text-[#938e9d]">
                menu_book
              </span>
              <span>{currentCard.reference || currentCard.topic || 'Course Notes'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ccbdff]">
              <span className="material-symbols-outlined text-[16px]">
                flip_camera_android
              </span>
              <span>{isFlipped ? 'Flip Back' : 'Flip to Answer'}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#34343d] text-stone-300 text-[10px] font-mono">
                Space
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* SuperMemo SM-2 Ergonomic 4-Button Rating Interface */}
      <div className="w-full max-w-[760px] mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[10px] text-[#cac4d4] uppercase tracking-wider font-semibold">
            Rate Cognitive Recall
          </span>
          <span className="font-mono text-[11px] text-[#cac4d4]/80">
            Press numbers{' '}
            <kbd className="px-1 py-0.5 rounded bg-[#292932] text-stone-100 font-mono text-[10px]">
              1
            </kbd>{' '}
            through{' '}
            <kbd className="px-1 py-0.5 rounded bg-[#292932] text-stone-100 font-mono text-[10px]">
              4
            </kbd>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1: Again */}
          <button
            type="button"
            onClick={() => handleRate(1)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1b1b23] hover:bg-[#1f1f27] border border-white/5 transition-all text-center cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(248,113,113,0.15)]"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <kbd className="w-5 h-5 rounded-md bg-[#34343d] text-[#ffb4ab] font-mono text-[11px] font-bold flex items-center justify-center shadow-sm">
                1
              </kbd>
              <span className="font-sans text-xs font-bold text-stone-100">
                Again
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#ffb4ab]/90">
              &lt; 10 min
            </span>
          </button>

          {/* 2: Hard */}
          <button
            type="button"
            onClick={() => handleRate(2)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1b1b23] hover:bg-[#1f1f27] border border-white/5 transition-all text-center cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <kbd className="w-5 h-5 rounded-md bg-[#34343d] text-[#e6deff] font-mono text-[11px] font-bold flex items-center justify-center shadow-sm">
                2
              </kbd>
              <span className="font-sans text-xs font-bold text-stone-100">
                Hard
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#cac4d4]">1 day</span>
          </button>

          {/* 3: Good */}
          <button
            type="button"
            onClick={() => handleRate(3)}
            className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1f1f27] hover:bg-[#292932] border border-[#ccbdff]/30 transition-all text-center cursor-pointer shadow-[0_4px_24px_rgba(157,133,242,0.22)]"
          >
            <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-[#ccbdff] text-[#331282] font-mono text-[9px] uppercase font-bold tracking-wider shadow-md">
              Optimal
            </span>
            <div className="flex items-center gap-1.5 mb-0.5">
              <kbd className="w-5 h-5 rounded-md bg-[#9d85f2] text-[#331282] font-mono text-[11px] font-bold flex items-center justify-center shadow-sm">
                3
              </kbd>
              <span className="font-sans text-xs font-bold text-[#ccbdff]">
                Good
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#ccbdff]">3 days</span>
          </button>

          {/* 4: Easy */}
          <button
            type="button"
            onClick={() => handleRate(4)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1b1b23] hover:bg-[#1f1f27] border border-white/5 transition-all text-center cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(69,223,164,0.18)]"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <kbd className="w-5 h-5 rounded-md bg-[#34343d] text-[#68fcbf] font-mono text-[11px] font-bold flex items-center justify-center shadow-sm">
                4
              </kbd>
              <span className="font-sans text-xs font-bold text-stone-100">
                Easy
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#45dfa4]">6 days</span>
          </button>
        </div>
      </div>

      {/* AI Breakout Drawer */}
      <div className="w-full max-w-[760px] mt-6 flex items-center justify-between p-4 rounded-2xl bg-[#1b1b23] border border-white/5 shadow-[inset_0_1px_1px_rgba(232,235,255,0.06)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#292932] flex items-center justify-center text-[#ccbdff] shrink-0 border border-white/5">
            <span className="material-symbols-outlined text-[20px]">
              neurology
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sans text-xs font-semibold text-stone-100 truncate">
              Need more clarity on this concept?
            </span>
            <span className="font-sans text-[11px] text-[#cac4d4] truncate">
              Ask Synap Coach to explain &quot;{currentCard.prompt}&quot; with an intuitive analogy.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onAskAiToBreakDown(
              `Explain "${currentCard.prompt}" with a clear, intuitive analogy and step-by-step conceptual breakdown.`
            )
          }
          className="shrink-0 ml-4 px-3.5 py-2 rounded-xl bg-[#ccbdff] text-[#331282] font-sans text-xs font-bold hover:bg-white transition-all flex items-center gap-1.5 shadow-[0_4px_16px_rgba(157,133,242,0.3)] cursor-pointer"
        >
          <span>Break down concept</span>
          <span className="material-symbols-outlined text-[16px]">spark</span>
        </button>
      </div>
    </div>
  );
};
