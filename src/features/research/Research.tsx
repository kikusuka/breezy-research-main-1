import React, { useEffect, useRef, useState } from 'react';
import type { DebateSession, DebateStep, DebateTone, SearchEngineProvider } from '../../types';
import type { Depth, ResearchUiState } from '../../app/types';
import { apiClient } from '../../services/apiClient';
import { providerConfigService } from '../../services/providerConfigService';
import { effectiveProviderService } from '../../services/effectiveProviderService';
import { createNewSession } from '../../services/sessionStorage';
import { Icon, ModelIndicator, makeInitialSteps, RESEARCH_STEPS } from '../../components/breezy-shared';

function Research({sessions,setSessions,activeId,setActiveId,serverGemini,onToast,pendingResearch,onConsumed,onStateChange}:{sessions:DebateSession[];setSessions:React.Dispatch<React.SetStateAction<DebateSession[]>>;activeId:string|null;setActiveId:(v:string|null)=>void;serverGemini:boolean;onToast:(s:string)=>void;pendingResearch:{q:string;d:Depth}|null;onConsumed:()=>void;onStateChange?:(state:ResearchUiState)=>void}) {
  const current=sessions.find((s)=>s.id===activeId) || sessions[0] || null;
  const [query,setQuery]=useState(current?.prompt || '');
  const [depth,setDepth]=useState<Depth>(current?.protocol==='solo'?'solo':current?.protocol==='quad'?'deep':'standard');
  const [running,setRunning]=useState(false);
  const [activeStep,setActiveStep]=useState(0);
  const [events,setEvents]=useState<string[]>([]);
  const controller=useRef<AbortController|null>(null);

  useEffect(()=>{
    onStateChange?.({
      running,
      activeStep: current?.status === 'completed' ? 5 : activeStep,
      status: current?.status || 'idle',
      query: query || current?.prompt || '',
      output: current?.finalOutput || '',
    });
  },[running,activeStep,current?.id,current?.status,current?.updatedAt,current?.finalOutput,query,onStateChange]);

  useEffect(()=>{if(current?.prompt)setQuery(current.prompt)},[current?.id]);

  useEffect(()=>{
    if(!pendingResearch || running) return;
    const next=pendingResearch;
    onConsumed();
    setQuery(next.q);
    setDepth(next.d);
    setTimeout(()=>{ void start(next.q,next.d); },0);
  },[pendingResearch]);

  const start=async(forcedQuery?:string, forcedDepth?:Depth)=>{
    const prompt=(forcedQuery || query).trim();
    const chosenDepth=forcedDepth || depth;
    if(!prompt)return;
    const cfg=providerConfigService.getConfig();
    let serverAvailable=serverGemini;
    try { const h=await apiClient.getHealth(); serverAvailable=Boolean(h.serverGeminiConfigured); } catch {}
    await effectiveProviderService.refreshServerHealth();
    const routableModel = effectiveProviderService.getActiveRoutableModel();
    if(!serverAvailable && !routableModel){
      onToast('No model connected. Configure a provider in Models first.');
      return;
    }
    controller.current?.abort();
    const c=new AbortController(); controller.current=c;
    const protocol = chosenDepth==='solo'?'solo':'trio';
    const session=createNewSession(prompt,protocol,makeInitialSteps(cfg,chosenDepth), 'balanced');
    session.status='running';
    session.searchEngine=(cfg.searchEngine || 'duckduckgo') as SearchEngineProvider;
    session.enableSearchGrounding=true;
    session.researchMethod=cfg.researchMethod || 'adaptive';
    const seats=providerConfigService.getSeatsPayload(cfg);
    setSessions((prev)=>[session,...prev]); setActiveId(session.id);
    setRunning(true); setActiveStep(0); setEvents(['Investigation started: '+prompt]);
    try {
      await apiClient.streamDebate(
        {
          prompt,protocol,tone:'balanced' as DebateTone,searchEngine:session.searchEngine,keys:providerConfigService.getKeys(),seats,
          enableSearchGrounding:true,autoResolve:cfg.autoResolve??true,selectedRound:chosenDepth==='solo'?1:chosenDepth==='deep'?4:2,
          researchMethod:cfg.researchMethod||'adaptive',heartbeatEnabled:cfg.heartbeatEnabled!==false,heartbeatIntervalSec:cfg.heartbeatIntervalSec||60,
        },
        {
          signal:c.signal,
          onNotice:(msg)=>setEvents((e)=>[...e,msg]),
          onEvent:(data)=>{
            if(data.type==='status'){setEvents((e)=>[...e,data.message].filter(Boolean));if(data.role){const idx=['architect','skeptic','verifier','arbiter'].indexOf(data.role);if(idx>=0)setActiveStep(idx);}}
            if(data.type==='round_start'){setActiveStep(Math.max(0,(data.round||1)-1));setEvents((e)=>[...e,(data.agentName||data.role||'Research step')+' started']);}
            if(data.type==='token'){
              setSessions((prev)=>prev.map((s)=>{
                if(s.id!==session.id)return s;
                const steps=[...(s.steps||[])];const idx=Math.max(0,(data.round||1)-1);
                if(steps[idx])steps[idx]={...steps[idx],status:'running',content:(steps[idx].content||'')+(data.token||'')};
                return {...s,steps,updatedAt:Date.now()};
              }));
            }
            if(data.type==='round_complete'){
              setSessions((prev)=>prev.map((s)=>{
                if(s.id!==session.id)return s;
                const steps=[...(s.steps||[])];const idx=Math.max(0,(data.round||1)-1);
                if(steps[idx])steps[idx]={...steps[idx],status:'completed',content:data.content||steps[idx].content,provider:data.provider||steps[idx].provider,model:data.model||steps[idx].model};
                return {...s,steps,updatedAt:Date.now()};
              }));
            }
            if(data.type==='search_grounding' && data.sources){
              setSessions((prev)=>prev.map((s)=>s.id===session.id?{...s,evidenceGraph:{...(s.evidenceGraph||{researchPlan:[],claims:[],contradictions:[],sourcesConsulted:[]}),sourcesConsulted:data.sources}}:s));
            }
            if(data.type==='complete'){
              setSessions((prev)=>prev.map((s)=>s.id===session.id?{...s,status:'completed',finalOutput:data.finalOutput||s.finalOutput,evidenceGraph:data.evidenceGraph||s.evidenceGraph,researchMetrics:data.researchMetrics||s.researchMetrics,usage:data.usage||s.usage,metrics:data.metrics||s.metrics,updatedAt:Date.now()}:s));
              setActiveStep(5);setEvents((e)=>[...e,'Investigation complete.']);
            }
            if(data.type==='error'){
              setSessions((prev)=>prev.map((s)=>s.id===session.id?{...s,status:'error',error:data.message||data.error}:s));
              setEvents((e)=>[...e,'Error: '+(data.message||data.error||'Research failed')]);
            }
          }
        }
      );
    } catch(e:any) {
      if(e?.name==='AbortError'){
        setSessions((prev)=>prev.map((s)=>s.id===session.id?{
          ...s,
          status:'cancelled',
          error:'Research stopped by user.',
          updatedAt:Date.now(),
        }:s));
        setEvents((ev)=>[...ev,'Investigation stopped by user.']);
      } else {
        setSessions((prev)=>prev.map((s)=>s.id===session.id?{...s,status:'error',error:e?.message||'Research failed'}:s));
        setEvents((ev)=>[...ev,'Error: '+(e?.message||'Research failed')]);
      }
    } finally {setRunning(false);controller.current=null;}
  };

  return <div className="page">
    <div className="section-head"><div><h1>Research Workspace</h1><p>Question → exploration → challenge → verification → synthesis, driven by your configured providers.</p></div><div className="section-actions"><ModelIndicator serverGemini={serverGemini}/>{running&&<button className="secondary-btn" onClick={()=>controller.current?.abort()}><Icon name="stop_circle"/>Stop</button>}</div></div>
    <div className="research-layout">
      <div className="panel">
        <div className="panel-title"><h2>Protocol</h2><small>{current?.status || 'idle'}</small></div>
        <div className="stepper">
          {RESEARCH_STEPS.map((s,i)=>{const done=i<activeStep||(current?.status==='completed'&&i<=5);return <div key={s[0]} className={'step '+(i===activeStep?'active ':'')+(done?'done':'')}><div className="step-marker">{done?'✓':i+1}</div><div className="step-text"><strong>{s[0]}</strong><span>{s[1]}</span></div></div>})}
        </div>
        <div style={{marginTop:18}} className="hero-note">Search: {providerConfigService.getConfig().searchEngine || 'duckduckgo'} · Method: {providerConfigService.getConfig().researchMethod || 'adaptive'}</div>
      </div>
      <div className="grid" style={{alignContent:'start'}}>
        <div className="panel">
          <div className="panel-title"><h2>Inquiry</h2><small>{depth}</small></div>
          <textarea className="input" style={{minHeight:120,resize:'vertical'}} value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Enter a question worth investigating…" />
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:10}}>
            <div className="segmented">{([['solo','Solo'],['standard','Standard'],['deep','Deep']] as Array<[Depth,string]>).map(([id,label])=><button key={id} className={depth===id?'active':''} onClick={()=>setDepth(id)}>{label}</button>)}</div>
            <button className="primary-btn" disabled={!query.trim()||running} onClick={()=>void start()}><Icon name={running?'hourglass_top':'play_arrow'}/>{running?'Running…':'Initiate Synthesis'}</button>
          </div>
        </div>
        {current && <div className="grid grid-2">
          <div className="panel"><div className="panel-title"><h2>Live Output</h2><small>{current.status}</small></div><div className="research-output output">{current.finalOutput || current.steps?.map((s)=>s.content).filter(Boolean).join('\n\n') || 'No synthesis recorded yet.'}</div></div>
          <div className="panel"><div className="panel-title"><h2>Research Events</h2><small>{events.length} events</small></div><div className="event-list">{events.map((e,i)=><div className="event" key={i}>{e}</div>)}</div></div>
        </div>}
        {current?.evidenceGraph?.sourcesConsulted?.length ? <div className="panel"><div className="panel-title"><h2>Evidence</h2><small>{current.evidenceGraph.sourcesConsulted.length} sources</small></div><div className="source-grid">{current.evidenceGraph.sourcesConsulted.map((s:any)=><div className="source" key={s.id||s.url}><strong>{s.title}</strong><p>{s.domain}</p><a href={s.url} target="_blank" rel="noreferrer">Open source</a></div>)}</div></div>:null}
      </div>
    </div>
  </div>;
}

export default Research;
