import React, { useEffect, useRef } from 'react';
import type { UserProfile } from '../../services/userProfileService';
import { AVAILABLE_MODELS, providerConfigService } from '../../services/providerConfigService';

import type { ResearchUiState } from '../../app/types';

type Props = {
  file: string;
  mobileFile?: string;
  profile: UserProfile;
  researchState?: ResearchUiState;
  screen?: 'landing' | 'chat' | 'research' | 'docs' | 'models' | 'profile';
  onNavigate: (tab: string) => void;
  onResearch?: (query: string, depth?: 'solo' | 'standard' | 'deep') => void;
  onChat?: (query: string) => Promise<string>;
  onProviderKeySave?: (provider: string, key: string) => void;
  onSeatModelChange?: (index: number, provider: string, model: string) => void;
  onModelProbe?: () => void;
};

const LIVE_NAV = new Set(['landing','chat','research','history','models','docs','settings','profile','build','canvas','notes','sign-up','sign-in','documentation','models-and-verification','research-methodology']);

const LANDING_NAV_MAP: Record<string,string> = {
  'sign-up': 'research',
  'sign-in': 'chat',
  'documentation': 'docs',
  'models-and-verification': 'models',
  'research-methodology': 'research',
};

function replaceLeafText(doc: Document, replacements: Array<[string,string]>) {
  doc.querySelectorAll<HTMLElement>('body *').forEach((el) => {
    if (el.children.length !== 0 || !el.textContent) return;
    let t = el.textContent;
    for (const [from, to] of replacements) {
      if (t === from) t = to;
    }
    if (t !== el.textContent) el.textContent = t;
  });
}

function activeModelLabel() {
  const active = providerConfigService.getActiveRoutableModel();
  return active ? active.model : 'No model assigned';
}

function applyTruthfulResearchLabels(doc: Document) {
  const config = providerConfigService.getConfig();
  const active = providerConfigService.getActiveRoutableModel();
  const model = active ? active.model : 'No model assigned';
  const search = config.searchEngine || 'No search configured';

  replaceLeafText(doc, [
    ['Cluster Active', 'BREEZY WORKSPACE'],
    ['Ready for Inquiry', active ? 'Model available' : 'No model connected'],
    ['H100 x 8 Idle', 'No live compute'],
    ['Claude 3.7 Sonnet', model],
    ['DeepSeek-R1', model],
    ['arXiv + PubMed', search],
    ['Lean 4 Sandbox', 'Not connected'],
    ['Auto-Ensemble (Claude 3.7 + o3-mini)', active ? 'Configured model' : 'No model connected'],
    ['Valid', 'Not verified'],
    ['Connected', 'Not verified'],
    ['All Nodes Reachable', 'Connectivity not verified'],
    ['Pinging 4 Nodes...', 'Checking connectivity...'],
    ['Matrix Committed', 'Routing saved locally'],
  ]);
}

function providerDisplayName(id: string) {
  const names: Record<string,string> = {
    gemini:'Gemini',
    anthropic:'Anthropic',
    groq:'Groq',
    sambanova:'SambaNova',
    openrouter:'OpenRouter',
    ollama:'Ollama',
    'openai-compatible':'OpenAI-compatible',
  };
  return names[id] || id;
}

function applyTruthfulModelSurface(doc: Document) {
  const cfg = providerConfigService.getConfig();
  const selects = Array.from(doc.querySelectorAll<HTMLSelectElement>('select')).slice(0, 4);
  const roles = ['architect','skeptic','verifier','arbiter'] as const;
  selects.forEach((select, index) => {
    const role = roles[index];
    if (!role) return;
    const current = cfg.roles[role];
    const liveOptions: Array<{provider:string;model:string;name:string}> = [];
    Object.entries(AVAILABLE_MODELS).forEach(([provider,items]) => {
      items.forEach((item) => liveOptions.push({provider,model:item.id,name:item.name}));
    });
    select.innerHTML = '';
    const none = doc.createElement('option');
    none.value = '';
    none.textContent = 'No model assigned';
    select.appendChild(none);
    liveOptions.forEach((item) => {
      const opt = doc.createElement('option');
      opt.value = item.provider + ':' + item.model;
      opt.textContent = providerDisplayName(item.provider) + ': ' + item.name;
      select.appendChild(opt);
    });
    const value = current.provider && current.model ? current.provider + ':' + current.model : '';
    if (value && !liveOptions.some((item) => item.provider + ':' + item.model === value)) {
      const custom = doc.createElement('option');
      custom.value = value;
      custom.textContent = providerDisplayName(current.provider) + ': ' + current.model + ' (current)';
      select.appendChild(custom);
    }
    select.value = value;
  });
}

function applyResearchState(doc: Document, state?: ResearchUiState) {
  if (!state) return;

  const input = doc.getElementById('inquiry-input') as HTMLTextAreaElement | null;
  const hint = doc.getElementById('char-hint');
  if (input && state.query && input.value !== state.query) input.value = state.query;
  if (hint) hint.textContent = state.query ? state.query.length + ' characters staged' : 'Awaiting statement formulation';

  const button = doc.getElementById('btn-initiate') as HTMLButtonElement | null;
  if (button) {
    button.disabled = state.running;
    button.innerHTML = state.running
      ? '<span class="material-symbols-outlined text-headline-sm animate-spin">progress_activity</span><span>Running…</span>'
      : state.status === 'completed'
        ? '<span class="material-symbols-outlined text-headline-sm">check_circle</span><span>Run again</span>'
        : '<span>Initiate Synthesis</span><span class="material-symbols-outlined text-headline-sm">arrow_forward</span>';
  }

  const title = Array.from(doc.querySelectorAll<HTMLElement>('h1,h2,h3')).find((el) => el.textContent?.trim() === 'No active synthesis in progress');
  const copy = title?.parentElement?.querySelector<HTMLElement>('p');
  if (title) {
    title.textContent =
      state.status === 'completed' ? 'Synthesis complete'
      : state.status === 'error' ? 'Synthesis stopped'
      : state.running ? 'Synthesis in progress'
      : 'Ready for inquiry';
  }
  if (copy) {
    copy.textContent =
      state.status === 'completed' ? (state.output ? 'The investigation completed. Your result is preserved in History.' : 'The investigation completed and is preserved in History.')
      : state.status === 'error' ? 'The run stopped with an error. Correct the connection or prompt and try again.'
      : state.running ? 'Breezy is coordinating the configured research pipeline. You can watch the session in History as it evolves.'
      : 'Submit an inquiry above to coordinate multi-model exploration, challenge, verification, and synthesis.';
  }

  const labels=['Question','Exploration','Proposals','Challenge','Evidence','Synthesis'];
  const step=Math.max(0,Math.min(5,state.activeStep));
  labels.forEach((label,idx)=>{
    const textEl=Array.from(doc.querySelectorAll<HTMLElement>('span')).find((el)=>el.textContent?.trim()===label);
    const block=textEl?.parentElement;
    const marker=block?.querySelector<HTMLElement>('div.w-9.h-9');
    if(!block || !marker || !textEl) return;
    const reached=idx<=step && (state.running || state.status==='completed');
    marker.classList.remove('bg-surface-container','bg-surface-container-high','bg-primary','text-primary','text-on-primary','text-outline');
    textEl.classList.remove('text-primary','text-outline');
    if(reached){
      marker.classList.add('bg-primary','text-on-primary');
      textEl.classList.add('text-primary');
      const icon=marker.querySelector<HTMLElement>('.material-symbols-outlined');
      if(icon && idx<step) icon.textContent='check';
    } else {
      marker.classList.add(idx===0 ? 'bg-surface-container-high' : 'bg-surface-container','text-outline');
      textEl.classList.add(idx===0 ? 'text-primary' : 'text-outline');
    }
  });
}

export default function StitchFrame({ file, mobileFile, profile, researchState, screen, onNavigate, onResearch, onChat, onProviderKeySave, onSeatModelChange, onModelProbe }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;

    const handleLoad = () => {
      const doc = frame.contentDocument;
      if (!doc) return;

      doc.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
        el.addEventListener('click', (event) => {
          const path = el.getAttribute('data-path') || '';
          if (!LIVE_NAV.has(path)) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          onNavigate(LANDING_NAV_MAP[path] || path);
        }, true);
      });

      const name = profile.displayName.trim() || 'Breezy user';
      const role = profile.roleTitle.trim() || 'No role set';
      const email = profile.email.trim();
      const initials = name.split(/\s+/).slice(0, 2).map((x) => x[0] || '').join('').toUpperCase() || 'B';
      replaceLeafText(doc, [
        ['Dr. Aris Vance', name],
        ['Dr. Elena Rostova', name],
        ['Lead Analyst', role],
        ['Principal Synthesis Architect', role],
        ['AV', initials],
        ['L9', initials],
        ...(email ? [['Workspace namespace','' + email] as [string,string]] : []),
      ]);

      replaceLeafText(doc, [
        ['94.8% CONCORDANT', 'ILLUSTRATIVE PREVIEW'],
        ['99.4%', 'PREVIEW'],
        ['99.2%', 'PREVIEW'],
        ['3 MODELS VERIFIED', 'NO LIVE RUN'],
        ['4 Nodes', 'No live nodes'],
        ['H100 x 8 Idle', 'No live compute connected'],
        ['Daemon Listening • 0ms auth', 'No local daemon verified'],
        ['Local Node Synced', 'Connection not verified'],
        ['Connected Engine Providers', 'Provider connections'],
        ['Connected', 'Not verified'],
        ['Valid', 'Not verified'],
        ['Active Engines', 'Available engines'],
        ['Failover Armed', 'Failover not verified'],
        ['PFS Guaranteed', 'Not verified'],
        ['PEER MESH: ACTIVE', 'Peer mesh not connected'],
        ['Key Custody Verified', 'Key custody not verified'],
        ['Zero-Log Enclave Tier 4', 'No enclave connected'],
        ['KMS-SEALED VAULT', 'No vault connected'],
        ['OLLAMA-LOCAL', 'Local provider'],
        ['OLLMAMA-LOCAL', 'Local provider'],
        ['127.0.0.1:11434', 'Local endpoint not verified'],
        ['enclave.breezy.internal', 'No enclave configured'],
        ['SYNTHESIS COMMITTED', 'PREVIEW ONLY'],
        ['No credit card required • Dual-engine verifiable logs • Local Ollama bridge ready', 'Connect a model to run a live investigation'],
        ['claude-3-7-sonnet', activeModelLabel()],
        ['deepseek-r1:70b-q4_K_M', activeModelLabel()],
        ['OpenAI GPT-4o', 'No model assigned'],
        ['Mistral Large', 'No model assigned'],
        ['VAULT_REF_ANTHROPIC', 'No vault reference'],
        ['Local Daemon (:11434)', 'Local provider'],
        ['CONNECTED', 'NOT VERIFIED'],
        ['100% VALIDATED', 'NOT VERIFIED'],
        ['CONFIDENCE: 99.4%', 'ILLUSTRATIVE PREVIEW'],
        ['Integrity Verified: 0x9f1a...c82d', 'Integrity status not verified'],
        ['MATCH VERIFIED', 'Verification status not verified'],
        ['Latency: 1.4ms · Zero outbound telemetry', 'Live latency not measured'],
        ['Validated using deterministic tree traversal. Zero drift detected.', 'Validation method not connected.'],
        ['Zero Data Retention', 'Retention policy not verified'],
        ['100% VALIDATED', 'NOT VERIFIED'],
        ['ACTIVE', 'NOT VERIFIED'],
        ['Inference: Idle', 'No live inference'],
        ['OLLAMA:11434', 'Local provider not verified'],
        ['10.240.4.11 • Debian 12 • 8x H100 Enclave', 'Compute enclave not connected'],
        ['All memory pages are encrypted via ephemeral AES-256-GCM hardware keys and flushed on tab close.', 'Local encryption state not verified'],
        ['Connected External Inferences & Vault Endpoints', 'Provider endpoints'],
        ['Connected Research Workstations', 'Research workstations'],
        ['Active Local Daemons', 'Local providers'],
      ]);
      applyTruthfulResearchLabels(doc);

      const landingForm = doc.getElementById('inquiryForm') as HTMLFormElement | null;
      const landingInput = doc.getElementById('userInquiry') as HTMLInputElement | null;
      if (landingForm && landingInput) {
        landingForm.addEventListener('submit', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          const q = landingInput.value.trim();
          if (q) onResearch?.(q, 'standard');
        }, true);
      }

      const researchInput = doc.getElementById('inquiry-input') as HTMLTextAreaElement | null;
      const researchButton = doc.getElementById('btn-initiate') as HTMLButtonElement | null;
      if (researchButton && researchInput) {
        researchButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          const q = researchInput.value.trim();
          if (!q) {
            researchInput.focus();
            return;
          }
          const depthValue = (doc.getElementById('depth-select') as HTMLSelectElement | null)?.value;
          const depth = depthValue === 'standard' ? 'standard' : depthValue === 'exhaustive' ? 'deep' : 'deep';
          onResearch?.(q, depth);
        }, true);
      }

      const chatInput = doc.getElementById('inquiryInput') as HTMLInputElement | HTMLTextAreaElement | null;
      if (chatInput && onChat) {
        chatInput.addEventListener('keydown', (event) => {
          if ((event as KeyboardEvent).key !== 'Enter' || (event as KeyboardEvent).shiftKey) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const q = chatInput.value.trim();
          if (!q) return;

          void (async () => {
            const result = await onChat(q);
            const wrap = doc.createElement('div');
            wrap.className = 'flex justify-start mb-6';
            const bubble = doc.createElement('div');
            bubble.className = 'max-w-2xl rounded-2xl bg-surface-container px-space-md py-space-sm text-on-surface whitespace-pre-wrap';
            bubble.textContent = result;
            wrap.appendChild(bubble);
            const scrollHost = chatInput.closest('.flex-1.overflow-y-auto') || chatInput.closest('main') || doc.body;
            scrollHost.insertBefore(wrap, scrollHost.lastElementChild || null);
            chatInput.value = '';
          })();
        }, true);
      }

      if (screen === 'models') {
        applyTruthfulModelSurface(doc);
        const saveBtn = doc.getElementById('modalSaveBtn') as HTMLButtonElement | null;
        if (saveBtn) {
          saveBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const title = doc.getElementById('modalProviderTitle')?.textContent?.trim() || '';
            const provider = title.replace(/^Configure\\s*/, '');
            const key = (doc.getElementById('modalKeyInput') as HTMLInputElement | null)?.value || '';
            if (!key.trim()) return;
            onProviderKeySave?.(provider, key);
            const modal = doc.getElementById('credentialModal');
            modal?.classList.add('hidden');
          }, true);
        }

        const testBtn = doc.getElementById('modalTestBtn') as HTMLButtonElement | null;
        if (testBtn) {
          testBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            testBtn.textContent = 'Verification unavailable';
            onModelProbe?.();
          }, true);
        }

        const pingBtn = doc.getElementById('testConnectionsBtn') as HTMLButtonElement | null;
        if (pingBtn) {
          pingBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            pingBtn.textContent = 'No live node check';
            onModelProbe?.();
          }, true);
        }

        const routingBtn = doc.getElementById('saveRoutingBtn') as HTMLButtonElement | null;
        if (routingBtn) {
          routingBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            routingBtn.textContent = 'Routing saved locally';
          }, true);
        }

        Array.from(doc.querySelectorAll<HTMLSelectElement>('select')).slice(0,4).forEach((select,index) => {
          select.addEventListener('change', (event) => {
            event.stopImmediatePropagation();
            const value = select.value;
            if (!value) {
              onSeatModelChange?.(index,'','');
              return;
            }
            const split = value.indexOf(':');
            if (split < 0) {
              onSeatModelChange?.(index,'','');
              return;
            }
            onSeatModelChange?.(index,value.slice(0,split),value.slice(split+1));
          }, true);
        });

        replaceLeafText(doc, [
          ['Claude 3.7 Sonnet', 'Catalog model — choose from live catalog'],
          ['OpenAI GPT-4.5 Preview', 'Catalog entry'],
          ['OpenAI: GPT-4.5 Preview', 'Catalog entry'],
          ['Google DeepMind: Gemini 2.0 Pro', 'Catalog entry'],
          ['o3-mini', 'Catalog entry'],
          ['Zero-Log Confidentiality Guarantee', 'Provider connection storage'],
          ['All remote API payloads utilize ephemeral stateless contexts with zero data retention parameters.', 'Provider privacy behavior depends on the configured service.'],
          ['Local Storage: Encrypted AES-256', 'Local storage'],
          ['CONNECTED', 'NOT VERIFIED'],
          ['ACTIVE', 'NOT VERIFIED'],
          ['All Nodes Reachable', 'Connectivity not verified'],
          ['Pinging 4 Nodes...', 'Checking connectivity...'],
        ]);
      }

      const sample = doc.getElementById('sampleBtn');
      if (sample && landingInput) {
        sample.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          landingInput.value = 'Compare the evidence for a research question you care about';
        }, true);
      }

      applyResearchState(doc, researchState);
    };

    frame.addEventListener('load', handleLoad);
    return () => frame.removeEventListener('load', handleLoad);
  }, [file, profile, screen, onNavigate, onResearch, onChat, onProviderKeySave, onSeatModelChange, onModelProbe, researchState]);

  useEffect(() => {
    if (!researchState) return;
    const doc = ref.current?.contentDocument;
    if (doc) applyResearchState(doc, researchState);
  }, [researchState]);

  const src = mobileFile && typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? mobileFile : file;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#111319', zIndex: 1 }}>
      <iframe ref={ref} title="Breezy Stitch interface" src={'/stitch/' + src} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
    </div>
  );
}
