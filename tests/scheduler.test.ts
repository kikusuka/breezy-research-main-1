import { describe, it, expect } from 'vitest';
import { scheduleItem, computeNotebookReadiness, verifyQuoteVerbatim } from '../src/services/scheduler';
import { SynapStudyItem } from '../src/types/synap';

describe('Synap SM-2 Scheduler', () => {
  it('should initialize and grow interval after successive Good ratings', () => {
    let card: SynapStudyItem = {
      id: 'test-card-1',
      type: 'flashcard',
      prompt: 'What is 1+1?',
      answer: '2',
      history: [],
    };

    // First Review: Rated Good (3)
    const state1 = scheduleItem(card, 3);
    expect(state1.repetitions).toBe(1);
    expect(state1.interval).toBe(1);

    // Second Review: Rated Good (3)
    card = { ...card, ...state1 } as any;
    const state2 = scheduleItem(card, 3);
    expect(state2.repetitions).toBe(2);
    expect(state2.interval).toBe(6);

    // Third Review: Rated Good (3)
    card = { ...card, ...state2 } as any;
    const state3 = scheduleItem(card, 3);
    expect(state3.repetitions).toBe(3);
    expect(state3.interval).toBe(Math.ceil(6 * state2.ease));
  });

  it('should reset repetitions and set interval to 1 day after Again rating', () => {
    let card: SynapStudyItem = {
      id: 'test-card-2',
      type: 'flashcard',
      prompt: 'What is 2+2?',
      answer: '4',
      interval: 12,
      ease: 2.8,
      repetitions: 4,
      lapses: 1,
      history: [],
    } as any;

    const state = scheduleItem(card, 1); // Rated Again (1)
    expect(state.repetitions).toBe(0);
    expect(state.interval).toBe(1);
    expect(state.lapses).toBe(2);
    expect(state.ease).toBe(2.6); // 2.8 - 0.2
  });
});

describe('Synap Exam Readiness Computations', () => {
  it('should return null if there are no cards or no exam date', () => {
    expect(computeNotebookReadiness([], '2026-10-15')).toBeNull();
    expect(computeNotebookReadiness([{ id: '1', type: 'flashcard', prompt: 'Q', history: [] }], '')).toBeNull();
  });

  it('should count unreviewed cards as 0 predicted recall', () => {
    const unreviewedCard: SynapStudyItem = {
      id: 'unreviewed',
      type: 'flashcard',
      prompt: 'Prompt',
      history: [],
    };

    const res = computeNotebookReadiness([unreviewedCard], '2026-10-30');
    expect(res).not.toBeNull();
    expect(res!.readiness).toBe(0);
    expect(res!.unreviewedCount).toBe(1);
  });
});

describe('Quote Verbatim Verification', () => {
  it('should return true for strict verbatim matches ignoring whitespace', () => {
    const chunk = "Breezy Research Suite operates a local-first memory cache.";
    expect(verifyQuoteVerbatim("Breezy Research Suite", chunk)).toBe(true);
    expect(verifyQuoteVerbatim(" local-first memory ", chunk)).toBe(true);
  });

  it('should return false for modified quotes or non-matches', () => {
    const chunk = "Breezy Research Suite operates a local-first memory cache.";
    expect(verifyQuoteVerbatim("Breezy Suite operates", chunk)).toBe(false); // skipped word
    expect(verifyQuoteVerbatim("local-first memory CACHE", chunk)).toBe(false); // different casing
  });
});
