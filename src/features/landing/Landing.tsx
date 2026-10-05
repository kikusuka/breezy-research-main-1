import React, { useState } from 'react';
import type { Tab, Depth } from '../../app/types';
import { Icon } from '../../components/breezy-shared';

function Landing({serverGemini,onStart,onGo}:{serverGemini:boolean;onStart:(q:string,d:Depth)=>void;onGo:(t:Tab)=>void}) {
  const [query,setQuery] = useState('');
  const [depth,setDepth] = useState<Depth>('standard');
  const starters = [
    ['Protocol Theory','Compare multi-agent debate protocols vs MCTS','Consensus bounds · Game theory'],
    ['Materials Sci','Audit solid-state electrolyte degradation pathways','Dendrite nucleation · Kinetics'],
    ['Cryptography','Explain zero-retention Merkle verification','State inclusion · ZK-proofs']
  ] as const;
  return <section className="hero">
    <div className="eyebrow">BREEZY COGNITIVE KERNEL · RESEARCH WORKSPACE</div>
    <h1>What would you like to explore?</h1>
    <p>Calm, evidence-first research across the models and providers you actually connect.</p>

    <div className="grid grid-3" style={{width:'min(760px,100%)',marginTop:24}}>
      {starters.map(([tag,title,meta])=><button key={title} className="panel" style={{textAlign:'left',height:112,cursor:'pointer'}} onClick={()=>setQuery(title)}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
          <span className="badge cyan">{tag}</span><Icon name="arrow_outward"/>
        </div>
        <div style={{font:'600 13px/18px Plus Jakarta Sans',marginTop:8}}>{title}</div>
        <div style={{font:'500 10px/16px JetBrains Mono',color:'var(--outline)',marginTop:5}}>{meta}</div>
      </button>)}
    </div>

    <div className="composer">
      <textarea value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Ask Breezy anything, or explore an inquiry..." rows={2}/>
      <div className="composer-footer">
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <div className="segmented">
            {([['solo','Solo'],['standard','Standard'],['deep','Deep']] as Array<[Depth,string]>).map(([id,label])=><button key={id} className={depth===id?'active':''} onClick={()=>setDepth(id)}>{label}</button>)}
          </div>
          <span className="badge"><span className={'dot '+(serverGemini?'good':'')}></span>{serverGemini?'Model available':'No model connected'}</span>
        </div>
        <button className="primary-btn" disabled={!query.trim()} onClick={()=>onStart(query.trim(),depth)}><Icon name="arrow_upward"/></button>
      </div>
    </div>

    <div className="hero-note">{serverGemini ? 'Configured inference is available.' : 'No model connected. Configure a provider before starting a live investigation.'}</div>
    <div className="hero-actions">
      <button className="ghost-btn" onClick={()=>onGo('chat')}><Icon name="chat_bubble"/>Chat</button>
      <button className="ghost-btn" onClick={()=>onGo('models')}><Icon name="hub"/>Models</button>
      <button className="ghost-btn" onClick={()=>onGo('docs')}><Icon name="menu_book"/>Docs</button>
    </div>
  </section>;
}

export default Landing;
