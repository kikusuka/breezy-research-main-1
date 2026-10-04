import React, { useEffect, useRef } from 'react';
import { UserProfile } from './services/userProfileService';

type Props = {
  file: string;
  mobileFile?: string;
  profile: UserProfile;
  onNavigate: (tab: string) => void;
  onResearch?: (query: string) => void;
  onChat?: (query: string) => Promise<string>;
};

const LIVE_NAV = new Set(['landing','chat','research','history','models','docs','settings','profile','build','canvas','notes']);

export default function StitchFrame({ file, mobileFile, profile, onNavigate, onResearch, onChat }: Props) {
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
          onNavigate(path);
        });
      });

      const name = profile.displayName.trim() || 'Breezy user';
      const role = profile.roleTitle.trim() || 'No role set';
      const email = profile.email.trim();
      const initials = name.split(/\s+/).slice(0, 2).map((x) => x[0] || '').join('').toUpperCase() || 'B';

      doc.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        if (el.children.length !== 0 || !el.textContent) return;
        const t = el.textContent.trim();
        if (t === 'Dr. Aris Vance' || t === 'Dr. Elena Rostova') el.textContent = name;
        else if (t === 'Lead Analyst' || t.includes('Principal Synthesis Architect')) el.textContent = role;
        else if (t === 'AV' || t === 'L9') el.textContent = initials;
        else if (t.includes('Workspace namespace') && email) el.textContent = t.replace('Workspace namespace', email);
      });

      // Remove generated claims that could be mistaken for live telemetry, credentials, or connected infrastructure.
      const replacements: Array<[string,string]> = [
        ['94.8% CONCORDANT', 'ILLUSTRATIVE PREVIEW'],
        ['99.4%', 'PREVIEW'],
        ['99.2%', 'PREVIEW'],
        ['3 MODELS VERIFIED', 'NO LIVE RUN'],
        ['4 Nodes', 'No live nodes'],
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
        ['3 MODELS VERIFIED', 'NO LIVE RUN'],
        ['No credit card required • Dual-engine verifiable logs • Local Ollama bridge ready', 'Connect a model to run a live investigation'],
      ];
      doc.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        if (el.children.length !== 0 || !el.textContent) return;
        let t = el.textContent;
        for (const [from, to] of replacements) if (t.includes(from)) t = t.replace(from, to);
        el.textContent = t;
      });

      const landingForm = doc.getElementById('inquiryForm') as HTMLFormElement | null;
      const landingInput = doc.getElementById('userInquiry') as HTMLInputElement | null;
      if (landingForm && landingInput) {
        landingForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const q = landingInput.value.trim();
          if (q) onResearch?.(q);
        });
      }

      const researchInput = doc.getElementById('inquiry-input') as HTMLTextAreaElement | null;
      const researchButton = doc.getElementById('btn-initiate') as HTMLButtonElement | null;
      if (researchButton && researchInput) {
        researchButton.addEventListener('click', (event) => {
          event.preventDefault();
          const q = researchInput.value.trim();
          if (q) onResearch?.(q);
        });
      }

      const chatInput = doc.getElementById('inquiryInput') as HTMLInputElement | HTMLTextAreaElement | null;
      if (chatInput && onChat) {
        chatInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' && !(event as KeyboardEvent).shiftKey) {
            event.preventDefault();
            const q = chatInput.value.trim();
            if (q) { const result = await onChat(q); const wrap = doc.createElement('div'); wrap.className='flex justify-start mb-6'; wrap.innerHTML='<div class="max-w-2xl rounded-2xl bg-surface-container px-space-md py-space-sm text-on-surface">'+result.replace(/</g,'&lt;')+'</div>'; doc.body.appendChild(wrap); chatInput.value=''; }
          }
        });
      }

      const sample = doc.getElementById('sampleBtn');
      if (sample && landingInput) {
        sample.addEventListener('click', () => {
          landingInput.value = 'Compare the evidence for a research question you care about';
        });
      }
    };

    frame.addEventListener('load', handleLoad);
    return () => frame.removeEventListener('load', handleLoad);
  }, [file, profile, onNavigate, onResearch, onChat]);

  const src = mobileFile && typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? mobileFile : file;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#111319', zIndex: 1 }}>
      <iframe ref={ref} title="Breezy Stitch interface" src={'/stitch/' + src} style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
    </div>
  );
}
