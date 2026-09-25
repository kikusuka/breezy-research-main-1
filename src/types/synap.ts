export interface SynapNotebook {
  id: string;
  title: string;
  courseCode: string;
  track: string;
  examDate: string;
  daysLeft: number;
  readiness: number;
  masteredCount: number;
  weakCount: number;
  sourceCount: number;
  createdAt: string;
  sources: SynapSource[];
  chat: SynapChatMessage[];
  studyItems: SynapStudyItem[];
  topicTree: SynapTopicNode[];
}

export interface SynapSource {
  id: string;
  title: string;
  type: 'pdf' | 'slides' | 'notes' | 'text';
  text: string;
  addedAt: string;
  notesCount?: number;
  badge?: string;
  weakSpotsTied?: number;
  wordCount?: string;
}

export interface SynapChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
  steps?: { stepNum: number; title: string; desc: string; highlight?: string }[];
  equation?: string;
  masteryUpdate?: { topic: string; from: number; to: number };
}

export interface SynapStudyItem {
  id: string;
  type: 'flashcard' | 'quiz';
  topic?: string;
  prompt: string;
  answer?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  reference?: string;
  vulnerability?: 'critical' | 'moderate' | 'low';
  riskImpact?: string;
  history: SynapAttemptRecord[];
}

export interface SynapAttemptRecord {
  timestamp: string;
  correct: boolean;
  rating?: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
}

export interface SynapTopicNode {
  id: string;
  name: string;
  progress: number;
  isWeakSpot?: boolean;
  drillPrompt?: string;
}

export type SynapNavView =
  | 'notebooks'
  | 'active-notebook'
  | 'weak-spots'
  | 'flashcard-review'
  | 'quiz-mode'
  | 'study-plan';

export interface SynapProviderConfig {
  type: 'gemini' | 'openai' | 'anthropic';
  baseUrl?: string;
  model: string;
  key: string;
}
