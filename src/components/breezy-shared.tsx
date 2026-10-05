import React from 'react';
import { DebateStep } from '../types';
import { CanonicalWorkspaceConfig, providerConfigService } from '../services/providerConfigService';
import type { UserProfile } from '../services/userProfileService';

export const RESEARCH_STEPS = [
  ['Question','Define the inquiry'],
  ['Exploration','Gather perspectives'],
  ['Proposals','Generate candidate answers'],
  ['Challenge','Stress-test the claims'],
  ['Verification','Check evidence'],
  ['Synthesis','Assemble the result'],
];

function Icon({name}:{name:string}) {
  return <span className="material-symbols-outlined">{name}</span>;
}

function initials(profile:UserProfile) {
  const value = profile.displayName.trim();
  if (!value) return 'B';
  return value.split(/\s+/).slice(0,2).map((x)=>x[0]?.toUpperCase()).join('') || 'B';
}

function timeAgo(ts:number) {
  const s = Math.max(0, Date.now()-ts)/1000;
  if (s < 60) return Math.floor(s)+'s ago';
  if (s < 3600) return Math.floor(s/60)+'m ago';
  if (s < 86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}

function providerLabel(id:string) {
  const map:Record<string,string> = {
    gemini:'Gemini',
    anthropic:'Anthropic',
    groq:'Groq',
    sambanova:'SambaNova',
    openrouter:'OpenRouter',
    ollama:'Ollama',
    'openai-compatible':'OpenAI-compatible',
  };
  return map[id] || id || 'No model';
}

function makeInitialSteps(config:CanonicalWorkspaceConfig, protocol:Depth): DebateStep[] {
  const roles = protocol === 'solo'
    ? [{id:'solo',name:'Solo Researcher',provider:config.defaultProvider,model:config.defaultModel}]
    : [
      {id:'architect',name:'Architect',provider:config.roles.architect.provider,model:config.roles.architect.model},
      {id:'skeptic',name:'Skeptic',provider:config.roles.skeptic.provider,model:config.roles.skeptic.model},
      {id:'verifier',name:'Verifier',provider:config.roles.verifier.provider,model:config.roles.verifier.model},
      {id:'arbiter',name:'Arbiter',provider:config.roles.arbiter.provider,model:config.roles.arbiter.model},
    ];
  return roles.map((r:any,idx:number)=>({
    stepId:'step_'+idx+'_'+Date.now(),
    role:r.id,
    agentName:r.name,
    provider:r.provider || '',
    model:r.model || '',
    status:'pending',
    content:'',
    timestamp:Date.now(),
  })) as DebateStep[];
}

function ModelIndicator({serverGemini}:{serverGemini:boolean}) {
  const active = providerConfigService.getActiveRoutableModel();
  if (active) {
    return <span className="status-pill"><span className="dot good"></span>{providerLabel(active.provider)} · {active.model}</span>;
  }
  if (serverGemini) {
    return <span className="status-pill"><span className="dot good"></span>Server Gemini available</span>;
  }
  return <span className="status-pill"><span className="dot"></span>No model connected</span>;
}
