export type Tab = 'landing'|'chat'|'research'|'history'|'models'|'docs'|'settings'|'profile'|'build'|'canvas'|'notes';
export type Depth = 'solo'|'standard'|'deep';
export type ChatItem = { role:'user'|'assistant'; content:string };
export type ResearchUiState = {
  running: boolean;
  activeStep: number;
  status: string;
  query: string;
  output: string;
};
