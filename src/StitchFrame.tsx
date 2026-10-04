import React, { useEffect, useRef } from 'react';
import { UserProfile } from './services/userProfileService';

type Props = {
  file: string;
  profile: UserProfile;
  onNavigate: (tab: string) => void;
  onResearch: (query: string) => void;
};

export default function StitchFrame({ file, profile, onNavigate, onResearch }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;

    const handleLoad = () => {
      const doc = frame.contentDocument;
      if (!doc) return;

      const navTargets = new Set(['landing','chat','research','history','models','docs','settings','profile','build','canvas','notes']);

      doc.querySelectorAll<HTMLElement>('[data-path]').forEach((el) => {
        el.addEventListener('click', (event) => {
          const path = el.getAttribute('data-path') || '';
          if (!navTargets.has(path)) return;
          event.preventDefault();
          onNavigate(path);
        });
      });

      const name = profile.displayName.trim() || 'Breezy user';
      const role = profile.roleTitle.trim() || 'No role set';
      doc.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        if (el.children.length === 0) {
          if (el.textContent?.trim() === 'Dr. Aris Vance') el.textContent = name;
          if (el.textContent?.trim() === 'Lead Analyst') el.textContent = role;
          if (el.textContent?.trim() === 'AV') el.textContent = name.split(/\\s+/).slice(0,2).map((x) => x[0] || '').join('').toUpperCase() || 'B';
        }
      });

      const form = doc.getElementById('inquiryForm') as HTMLFormElement | null;
      const input = doc.getElementById('userInquiry') as HTMLInputElement | null;
      if (form && input) {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const query = input.value.trim();
          if (query) onResearch(query);
        });
      }

      const primary = doc.querySelector<HTMLElement>('[data-path="sign-up"]');
      if (primary) {
        primary.addEventListener('click', (event) => {
          event.preventDefault();
          onNavigate('research');
        });
      }

      const sample = doc.getElementById('sampleBtn');
      if (sample) {
        sample.addEventListener('click', () => {
          if (input) input.value = 'Compare the evidence for a research question you care about';
        });
      }

      // The original Stitch landing preview contains illustrative telemetry.
      // Keep the visual composition, but prevent it from being mistaken for live Breezy state.
      const replacements: Array<[string,string]> = [
        ['SYNTHESIS ENGINE : READY', 'BREEZY WORKSPACE'],
        ['94.8% CONCORDANT', 'ILLUSTRATIVE PREVIEW'],
        ['3 MODELS VERIFIED', 'NO LIVE RUN'],
        ['SYNTHESIS COMMITTED', 'PREVIEW ONLY'],
        ['Zero hallucination consensus', 'Evidence-aware synthesis'],
        ['No credit card required • Dual-engine verifiable logs • Local Ollama bridge ready', 'Connect a model to run a live investigation'],
      ];
      doc.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        if (el.children.length === 0 && el.textContent) {
          for (const [from, to] of replacements) {
            if (el.textContent.includes(from)) el.textContent = el.textContent.replace(from, to);
          }
        }
      });
    };

    frame.addEventListener('load', handleLoad);
    return () => frame.removeEventListener('load', handleLoad);
  }, [file, profile, onNavigate, onResearch]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#111319', zIndex: 1 }}>
      <iframe
        ref={ref}
        title="Breezy Stitch interface"
        src={'/stitch/' + file}
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
