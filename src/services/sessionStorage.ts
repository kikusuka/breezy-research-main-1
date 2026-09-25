import { DebateSession, DebateStep, DebateTone } from '../types';

// Storage key constants - using synthexis_ prefix for consistency
export const STORAGE_SESSIONS_KEY = 'synthexis_debate_sessions_v1';
export const STORAGE_ACTIVE_ID_KEY = 'synthexis_active_session_id_v1';

export const SEED_SAMPLE_SESSIONS: DebateSession[] = [];

export const SEED_SAMPLE_SESSION: DebateSession | null = null;

/**
 * Load all saved debate sessions from LocalStorage.
 * Initializes with seed sessions if empty so users can immediately browse transcripts.
 */
export function loadSessions(): DebateSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) {
      // Seed default sessions
      saveSessions(SEED_SAMPLE_SESSIONS);
      return SEED_SAMPLE_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Sort newest first
      return parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    saveSessions(SEED_SAMPLE_SESSIONS);
    return SEED_SAMPLE_SESSIONS;
  } catch (err) {
    console.error('Failed to read debate sessions from localStorage:', err);
    return SEED_SAMPLE_SESSIONS;
  }
}

/**
 * Save array of sessions to LocalStorage. Limits to 40 most recent to prevent quota limits.
 */
export function saveSessions(sessions: DebateSession[]): void {
  try {
    const trimmed = sessions.slice(0, 40);
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save debate sessions to localStorage:', err);
  }
}

/**
 * Load active session ID from LocalStorage.
 */
export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist active session ID to LocalStorage.
 */
export function saveActiveSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
    }
  } catch (err) {
    console.error('Failed to save active session ID to localStorage:', err);
  }
}

/**
 * Helper to create a new session object
 */
export function createNewSession(
  prompt: string,
  protocol: 'trio' | 'quad' | 'duel' | 'solo',
  initialSteps: DebateStep[],
  tone: DebateTone = 'balanced'
): DebateSession {
  const now = Date.now();
  return {
    id: `deb_${now}_${Math.random().toString(36).slice(2, 7)}`,
    prompt,
    protocol,
    tone,
    createdAt: now,
    updatedAt: now,
    status: 'running',
    steps: initialSteps,
  };
}
