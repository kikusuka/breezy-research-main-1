import { SynapStudyItem } from '../types/synap';

export interface SM2State {
  interval: number;
  ease: number;
  repetitions: number;
  dueDate: string;
  lapses: number;
}

/**
 * Returns a consistent local ISO date string (YYYY-MM-DD) avoiding UTC midnight skew
 */
export function toLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initializes or returns standard SM-2 scheduling attributes on a study item
 */
export function getSM2State(item: SynapStudyItem): SM2State {
  const anyItem = item as any;
  const interval = typeof anyItem.interval === 'number' ? anyItem.interval : 0;
  const ease = typeof anyItem.ease === 'number' ? anyItem.ease : 2.5;
  const repetitions = typeof anyItem.repetitions === 'number' ? anyItem.repetitions : 0;
  const lapses = typeof anyItem.lapses === 'number' ? anyItem.lapses : 0;
  
  let dueDate = anyItem.dueDate;
  if (!dueDate) {
    dueDate = toLocalDateString();
  }

  return { interval, ease, repetitions, dueDate, lapses };
}

/**
 * Apply SuperMemo-2 (SM-2) algorithm updating ease, repetitions, interval, and next due date
 * Ratings:
 * 1: Again (reset repetitions, interval = 1, decrease ease, increment lapses)
 * 2: Hard (marginal recall: repetitions stay unchanged, interval increases slightly, ease decreases)
 * 3: Good (standard repeat: repetitions++, interval scales by ease factor)
 * 4: Easy (ease increases, interval scales by ease factor + bonus)
 */
export function scheduleItem(item: SynapStudyItem, rating: number): SM2State {
  const state = getSM2State(item);
  let { interval, ease, repetitions, lapses } = state;

  if (rating === 1) {
    // Again
    lapses++;
    repetitions = 0;
    interval = 1;
    ease = Math.round(Math.max(1.3, ease - 0.2) * 100) / 100;
  } else if (rating === 2) {
    // Hard: marginal pass. Do NOT increment repetitions so it doesn't artificially inflate mastery.
    ease = Math.round(Math.max(1.3, ease - 0.15) * 100) / 100;
    interval = Math.max(1, Math.ceil(interval * 1.2));
  } else if (rating === 3) {
    // Good
    repetitions++;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * ease);
    }
  } else {
    // Easy
    repetitions++;
    ease = Math.round((ease + 0.15) * 100) / 100;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * ease * 1.3);
    }
  }

  // Calculate next due date using local date arithmetic
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + interval);
  const dueDateStr = toLocalDateString(nextDueDate);

  return {
    interval,
    ease,
    repetitions,
    dueDate: dueDateStr,
    lapses,
  };
}

/**
 * Computes estimated retention probability (R) for a study item on a target exam date.
 * Factoring in memory stability (interval * ease), repetition history, and elapsed days.
 * Prevents inflation by ensuring single-review cards decay appropriately over time.
 */
export function computePredictedRecall(item: SynapStudyItem, examDateStr?: string): number {
  if (!examDateStr) return 0;
  
  const state = getSM2State(item);
  if (state.repetitions === 0 && state.interval === 0) {
    return 0; // Unreviewed counts as 0
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(examDateStr);
  examDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(state.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Memory stability factor based on interval, ease, and lapse penalties
  const stability = Math.max(1, state.interval) * Math.max(1.2, state.ease) * Math.max(0.4, 1.0 - 0.15 * state.lapses);

  // If exam is on or before due date, retention is strong but bounded by repetition count
  if (daysToExam <= daysToDue) {
    const baseMastery = Math.min(0.95, 0.5 + 0.1 * state.repetitions);
    return Math.max(0.1, baseMastery);
  }

  // Elapsed days past due date until exam
  const t = daysToExam - daysToDue;
  
  // Real-world empirical decay model factoring in stability
  const retention = Math.exp(-0.25 * (t / stability)) * Math.min(1.0, 0.5 + 0.1 * state.repetitions);
  return Math.max(0.0, Math.min(1.0, retention));
}

/**
 * Computes total notebook exam readiness as the average predicted recall across ALL cards.
 * Returns null if there are no cards or no exam date is supplied.
 */
export function computeNotebookReadiness(
  items: SynapStudyItem[],
  examDateStr?: string
): { readiness: number; unreviewedCount: number } | null {
  if (!items || items.length === 0 || !examDateStr) {
    return null;
  }

  let totalRecall = 0;
  let unreviewedCount = 0;

  for (const item of items) {
    const state = getSM2State(item);
    if (state.repetitions === 0 && state.interval === 0) {
      unreviewedCount++;
      totalRecall += 0;
    } else {
      const recall = computePredictedRecall(item, examDateStr);
      totalRecall += recall;
    }
  }

  const readiness = Math.round((totalRecall / items.length) * 100);
  return {
    readiness,
    unreviewedCount,
  };
}

export interface SynapWeakSpotTopic {
  topic: string;
  items: SynapStudyItem[];
  averageRecall: number;
}

export function deriveWeakSpotTopics(
  items: SynapStudyItem[],
  examDateStr?: string
): SynapWeakSpotTopic[] {
  if (!items || items.length === 0) return [];

  const grouped: Record<string, SynapStudyItem[]> = {};
  for (const item of items) {
    const state = getSM2State(item);
    const recall = examDateStr ? computePredictedRecall(item, examDateStr) : 0.5;
    
    const isReviewed = state.repetitions > 0 || state.interval > 0;
    const isWeak = isReviewed && (state.lapses > 1 || recall < 0.60);

    if (isWeak) {
      const topicName = item.topic || 'General Material';
      if (!grouped[topicName]) {
        grouped[topicName] = [];
      }
      grouped[topicName].push(item);
    }
  }

  return Object.entries(grouped).map(([topic, topicItems]) => {
    let sumRecall = 0;
    for (const item of topicItems) {
      sumRecall += examDateStr ? computePredictedRecall(item, examDateStr) : 0.5;
    }
    const averageRecall = Math.round((sumRecall / topicItems.length) * 100);

    return {
      topic,
      items: topicItems,
      averageRecall,
    };
  });
}

/**
 * Checks if a string appears verbatim in a reference chunk, normalizing excess whitespace/newlines while respecting case sensitivity.
 */
export function verifyQuoteVerbatim(quote: string, chunkText: string): boolean {
  if (!quote || !chunkText) return false;
  const cleanQuote = quote.replace(/\s+/g, ' ').trim();
  const cleanChunk = chunkText.replace(/\s+/g, ' ').trim();
  return cleanChunk.includes(cleanQuote);
}
