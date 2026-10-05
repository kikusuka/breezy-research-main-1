import React, { useState } from 'react';
import type { Tab, Depth } from '../../app/types';
import { Icon } from '../../components/breezy-shared';

function Landing({serverGemini,onStart,onGo}:{serverGemini:boolean;onStart:(q:string,d:Depth)=>void;onGo:(t:Tab)=>void}) {
  const [query,setQuery] = useState('');
  const [depth,setDepth] = useState<Depth>('standard');
  return <section className="hero">
    <div className="eyebrow">BREEZY RESEARCH WORKSPACE</div>
    <h1>Research that <span>thinks deeper.</span></h1>
    <p>Calm, multi-perspective research for questions that deserve evidence, challenge, and a clear synthesis. Breezy uses only the models and providers you actually connect.</p>
    <div className="composer">
      <textarea value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="What do you want to investigate?" />
      <div className="composer-footer">
        <div className="segmented">
          {([['solo','Solo'],['standard','Standard'],['deep','Deep']] as Array<[Depth,string]>).map(([id,label])=><button key={id} className={depth===id?'active':''} onClick={()=>setDepth(id)}>{label}</button>)}
        </div>
        <button className="primary-btn" disabled={!query.trim()} onClick={()=>onStart(query.trim(),depth)}><Icon name="arrow_forward"/>Start research</button>
      </div>
    </div>
    <div className="hero-actions">
      <button className="secondary-btn" onClick={()=>onGo('chat')}><Icon name="chat_bubble"/>Open Chat</button>
      <button className="secondary-btn" onClick={()=>onGo('models')}><Icon name="hub"/>Configure models</button>
      <button className="ghost-btn" onClick={()=>onGo('docs')}><Icon name="menu_book"/>Read Docs</button>
    </div>
    <div className="hero-note">{serverGemini ? 'Server Gemini is available. BYOK providers can be added in Models.' : 'No model connected yet. Configure a provider before starting a live investigation.'}</div>
  </section>;
}

export default Landing;
