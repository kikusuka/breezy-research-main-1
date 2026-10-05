import React from 'react';
import type { DebateSession } from '../../types';
import { Icon, timeAgo } from '../../components/breezy-shared';
import { googleDocsService } from '../../services/googleDocsService';

function History({sessions,onSelect}:{sessions:DebateSession[];onSelect:(id:string)=>void}) {
  const [q,setQ]=useState('');
  const filtered=sessions.filter((s)=>!q||s.prompt.toLowerCase().includes(q.toLowerCase()));
  return <div className="page"><div className="section-head"><div><h1>History</h1><p>Completed and in-progress investigations saved locally by Breezy.</p></div></div><div className="panel"><input className="input" placeholder="Search investigations…" value={q} onChange={(e)=>setQ(e.target.value)}/><div className="list" style={{marginTop:10}}>{filtered.length?filtered.map((s)=><div className="list-row" key={s.id}><div className="list-main"><strong>{s.prompt}</strong><span>{new Date(s.createdAt).toLocaleString()} · {s.protocol} · {s.steps?.length||0} steps · {s.evidenceGraph?.sourcesConsulted?.length||0} sources</span></div><div style={{display:'flex',gap:7,alignItems:'center'}}><span className={'badge '+(s.status==='completed'?'good':'')}>{s.status}</span><button className="secondary-btn" onClick={()=>onSelect(s.id)}>Open</button></div></div>):<div className="empty">No saved investigations match that search.</div>}</div></div></div>;
}

export default History;
