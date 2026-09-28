import { SynapStudyItem } from '../types/synap';

export interface SM2State {
  interval: number;
  ease: number;
  repetitions: number;
  dueDate: string;
  lapses: number;
}

/**
 * Initializes or returns the standard SM-2 scheduling attributes on a study item
 */
export function getSM2State(item: SynapStudyItem): SM2State {
  // If the item already has scheduler properties, return them
  const anyItem = item as any;
  const interval = typeof anyItem.interval === 'number' ? anyItem.interval : 0;
  const ease = typeof anyItem.ease === 'number' ? anyItem.ease : 2.5;
  const repetitions = typeof anyItem.repetitions === 'number' ? anyItem.repetitions : 0;
  const lapses = typeof anyItem.lapses === 'number' ? anyItem.lapses : 0;
  
  // Parse or default due date
  let dueDate = anyItem.dueDate;
  if (!dueDate) {
    dueDate = new Date().toISOString().split('T')[0];
  }

  return { interval, ease, repetitions, dueDate, lapses };
}

/**
 * Apply SuperMemo-2 (SM-2) algorithm updating ease, repetitions, interval, and next due date
 * Ratings:
 * 1: Again (reset repetitions, interval = 1, decrease ease, increment lapses)
 * 2: Hard (slight ease decrease, interval increases moderately)
 * 3: Good (standard repeat, interval scales by ease factor)
 * 4: Easy (ease increases, interval scales by ease factor + bonus)
 */
export function scheduleItem(item: SynapStudyItem, rating: number): SM2State {
  const state = getSM2State(item);
  let { interval, ease, repetitions, lapses } = state;

  const todayStr = new Date().toISOString().split('T')[0];

  if (rating === 1) {
    // Again
    lapses++;
    repetitions = 0;
    interval = 1;
    ease = Math.round(Math.max(1.3, ease - 0.2) * 100) / 100;
  } else if (rating === 2) {
    // Hard
    repetitions++;
    ease = Math.round(Math.max(1.3, ease - 0.15) * 100) / 100;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 4;
    } else {
      interval = Math.ceil(interval * 1.2);
    }
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

  // Calculate the next due date based on interval
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + interval);
  const dueDateStr = nextDueDate.toISOString().split('T')[0];

  return {
    interval,
    ease,
    repetitions,
    dueDate: dueDateStr,
    lapses,
  };
}

/**
 * Computes predicted probability of recall (R) for a study item on a target date (e.g. Exam Date)
 * R = e^(-0.1 * t / I) where t is the delay (days) past the due date.
 */
export function computePredictedRecall(item: SynapStudyItem, examDateStr?: string): number {
  if (!examDateStr) return 0;
  
  const state = getSM2State(item);
  if (state.repetitions === 0 && state.interval === 0) {
    return 0; // Never reviewed counts as 0
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(examDateStr);
  examDate.setHours(0, 0, 0, 0);

  const dueDate = new Date(state.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  // Days from today until exam
  const daysToExam = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  // Days from today until due date
  const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // If the exam occurs before or on the card's due date, recall is expected to be high
  if (daysToExam <= daysToDue) {
    return 1.0;
  }

  // Delay from due date to exam date
  const t = daysToExam - daysToDue;
  const I = Math.max(1, state.interval);

  // Exponential forgetting curve model: R = e^(-0.1 * t / I)
  const recall = Math.exp(-0.1 * (t / I));
  return Math.max(0, Math.min(1.0, recall));
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
      totalRecall += 0; // Unreviewed counts as 0
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

/**
 * Derive weak spots grouped by topic from lapses (lapseCount > 1) and low predicted recall (R < 0.6)
 */
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

  // Group by topic
  const grouped: Record<string, SynapStudyItem[]> = {};
  for (const item of items) {
    const state = getSM2State(item);
    const recall = examDateStr ? computePredictedRecall(item, examDateStr) : 0.5;
    
    // A card is classified as weak if it has been lapsed (>1) OR has low predicted recall (<0.60)
    // but only if it's been reviewed (unreviewed items don't have enough data yet to be considered a weak point)
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
 * Checks if a string appears verbatim in a reference chunk (strictly case-sensitive, ignoring excess leading/trailing whitespace)
 */
export function verifyQuoteVerbatim(quote: string, chunkText: string): boolean {
  if (!quote || !chunkText) return false;
  const cleanQuote = quote.trim();
  const cleanChunk = chunkText.trim();
  return cleanChunk.includes(cleanQuote);
}
