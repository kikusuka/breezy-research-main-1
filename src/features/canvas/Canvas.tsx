import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/breezy-shared';

function Canvas() {
  const [cards,setCards]=useState<CanvasCard[]>(()=>{try{return JSON.parse(localStorage.getItem('breezy:canvas:cards')||'[]').filter((x:any)=>x&&x.id&&!['card-1','card-2','card-3','card-4'].includes(x.id))}catch{return []}});
  const [filter,setFilter]=useState('all');
  const [title,setTitle]=useState('');
  const [content,setContent]=useState('');
  useEffect(()=>{localStorage.setItem('breezy:canvas:cards',JSON.stringify(cards))},[cards]);
  const add=()=>{if(!title.trim())return;setCards((c)=>[{id:'canvas_'+Date.now(),type:'idea',title:title.trim(),content:content.trim(),createdAt:new Date().toLocaleDateString()},...c]);setTitle('');setContent('')};
  const shown=filter==='all'?cards:cards.filter((c)=>c.type===filter);
  return <div className="page"><div className="section-head"><div><h1>Canvas</h1><p>A quiet place to keep research, ideas, code and tasks. Empty is a valid state.</p></div><button className="primary-btn" onClick={add}><Icon name="add"/>Add card</button></div>
    <div className="grid grid-2" style={{marginBottom:14}}><input className="input" placeholder="Card title" value={title} onChange={(e)=>setTitle(e.target.value)}/><input className="input" placeholder="Card note" value={content} onChange={(e)=>setContent(e.target.value)}/></div>
    <div className="tabs">{['all','idea','research','code','task'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
    {shown.length?<div className="canvas-board">{shown.map((c)=><div className="card" key={c.id}><div className="type">{c.type}</div><h3>{c.title}</h3><p>{c.content||'No note added.'}</p><div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span className="hero-note" style={{margin:0}}>{c.createdAt}</span><button className="ghost-btn" onClick={()=>setCards((all)=>all.filter((x)=>x.id!==c.id))}><Icon name="delete"/></button></div></div>)}</div>:<div className="empty">No cards yet. Pin a research result here or add a card.</div>}
  </div>;
}

export default Canvas;
