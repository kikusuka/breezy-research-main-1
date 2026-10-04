import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DebateSession,
  DebateStep,
  DebateTone,
  SearchEngineProvider,
} from './types';
import {
  AVAILABLE_MODELS,
  providerConfigService,
  CanonicalWorkspaceConfig,
} from './services/providerConfigService';
import { effectiveProviderService } from './services/effectiveProviderService';
import { apiClient } from './services/apiClient';
import {
  createNewSession,
  loadActiveSessionId,
  loadSessions,
  saveActiveSessionId,
  saveSessions,
} from './services/sessionStorage';
import { userProfileService, UserProfile } from './services/userProfileService';
import { googleDocsService } from './services/googleDocsService';
import { gitHubService, GitHubRepository, GitHubContent } from './services/gitHubService';

type Tab = 'landing'|'chat'|'research'|'history'|'models'|'docs'|'settings'|'profile'|'build'|'canvas'|'notes';
type Depth = 'solo'|'standard'|'deep';
type ChatItem = { role:'user'|'assistant'; content:string };

const NAV: Array<{id:Tab;label:string;icon:string;group:string}> = [
  {id:'chat',label:'Chat',icon:'chat_bubble',group:'Workspace'},
  {id:'research',label:'Research',icon:'science',group:'Workspace'},
  {id:'history',label:'History',icon:'history',group:'Workspace'},
  {id:'models',label:'Models',icon:'hub',group:'Workspace'},
  {id:'docs',label:'Docs',icon:'menu_book',group:'Workspace'},
  {id:'settings',label:'Settings',icon:'settings',group:'Workspace'},
  {id:'profile',label:'Profile',icon:'person',group:'Workspace'},
  {id:'build',label:'Build',icon:'code',group:'Lab'},
  {id:'canvas',label:'Canvas',icon:'dashboard',group:'Lab'},
];

const RESEARCH_STEPS = [
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

function Sidebar({active,onChange,profile,open,setOpen}:{active:Tab;onChange:(t:Tab)=>void;profile:UserProfile;open:boolean;setOpen:(v:boolean)=>void}) {
  const groups = ['Workspace','Lab'];
  return <aside className={'sidebar '+(open?'open':'')}>
    <div className="brand">
      <div className="brand-mark"><Icon name="air"/></div>
      <div><div className="brand-title">Breezy</div><div className="brand-sub">Research workspace</div></div>
    </div>
    {groups.map((group)=>(
      <React.Fragment key={group}>
        <div className="nav-section">{group}</div>
        <div className="nav">
          {NAV.filter((n)=>n.group===group).map((item)=>(
            <button key={item.id} className={active===item.id?'active':''} onClick={()=>{onChange(item.id);setOpen(false)}}><Icon name={item.icon}/><span>{item.label}</span></button>
          ))}
        </div>
      </React.Fragment>
    ))}
    <div className="sidebar-bottom">
      <button className="nav" style={{width:'100%',border:0,background:'transparent'}} onClick={()=>{onChange('profile');setOpen(false)}}>
        <div className="profile-mini">
          <div className="avatar">{initials(profile)}</div>
          <div style={{minWidth:0,textAlign:'left'}}>
            <div className="name">{profile.displayName || 'Breezy user'}</div>
            <div className="role">{profile.roleTitle || 'No role set'}</div>
          </div>
        </div>
      </button>
    </div>
  </aside>;
}

function Topbar({serverGemini,onMenu,onNewResearch}:{serverGemini:boolean;onMenu:()=>void;onNewResearch:()=>void}) {
  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-btn" onClick={onMenu} aria-label="Menu"><Icon name="menu"/></button>
      <ModelIndicator serverGemini={serverGemini}/>
    </div>
    <div className="topbar-right">
      <button className="secondary-btn" onClick={onNewResearch}><Icon name="add"/>New investigation</button>
    </div>
  </header>;
}

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

function Chat({serverGemini}:{serverGemini:boolean}) {
  const [messages,setMessages] = useState<ChatItem[]>([]);
  const [input,setInput] = useState('');
  const [busy,setBusy] = useState(false);
  const send = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    if (!serverGemini && !providerConfigService.getActiveRoutableModel()) {
      setMessages((m)=>[...m,{role:'assistant',content:'No model connected. Open Models and configure a provider first.'}]);
      return;
    }
    setInput('');
    setMessages((m)=>[...m,{role:'user',content:prompt}]);
    setBusy(true);
    try {
      const active = providerConfigService.getActiveRoutableModel();
      const key = active ? providerConfigService.getKey(active.provider) : undefined;
      const history = messages.map((m)=>({role:m.role,content:m.content}));
      const result = await apiClient.chatBreezy({prompt,history,provider:active?.provider,model:active?.model,apiKey:key});
      setMessages((m)=>[...m,{role:'assistant',content:result.text || 'The model returned an empty response.'}]);
    } catch (e:any) {
      setMessages((m)=>[...m,{role:'assistant',content:'Chat failed: '+(e?.message || 'Unknown error')}]);
    } finally { setBusy(false); }
  };
  return <div className="chat">
    <div className="chat-body">
      {messages.length===0 ? <div className="empty" style={{marginTop:80}}>
        <div className="eyebrow">BREEZY CHAT</div>
        <h2 style={{fontFamily:'Plus Jakarta Sans',margin:'0 0 8px'}}>Ask without the theater.</h2>
        <p>Use the same configured provider state as Research. Nothing is pretending to be connected.</p>
      </div> : messages.map((m,i)=><div key={i} className={'chat-msg '+m.role}><div className={'bubble '+m.role}>{m.content}</div></div>)}
      {busy && <div className="chat-msg assistant"><div className="bubble assistant">Thinking…</div></div>}
    </div>
    <div className="chat-compose"><div className="chat-compose-inner">
      <div className="composer" style={{marginTop:0}}>
        <textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Ask Breezy a question…" rows={3}/>
        <div className="composer-footer"><span className="hero-note" style={{margin:0}}>{serverGemini || providerConfigService.getActiveRoutableModel() ? 'Live model available' : 'No model connected'}</span><button className="primary-btn" disabled={!input.trim()||busy} onClick={send}><Icon name="arrow_upward"/>Send</button></div>
      </div>
    </div></div>
  </div>;
}

function Research({sessions,setSessions,activeId,setActiveId,serverGemini,onToast,pendingResearch,onConsumed}:{sessions:DebateSession[];setSessions:React.Dispatch<React.SetStateAction<DebateSession[]>>;activeId:string|null;setActiveId:(v:string|null)=>void;serverGemini:boolean;onToast:(s:string)=>void;pendingResearch:{q:string;d:Depth}|null;onConsumed:()=>void}) {
  const current=sessions.find((s)=>s.id===activeId) || sessions[0] || null;
  const [query,setQuery]=useState(current?.prompt || '');
  const [depth,setDepth]=useState<Depth>(current?.protocol==='solo'?'solo':current?.protocol==='deep'?'deep':'standard');
  const [running,setRunning]=useState(false);
  const [activeStep,setActiveStep]=useState(0);
  const [events,setEvents]=useState<string[]>([]);
  const controller=useRef<AbortController|null>(null);

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
    if(!serverAvailable && providerConfigService.getConfiguredProviders().length===0){
      onToast('No model connected. Configure a provider in Models first.');
      return;
    }
    controller.current?.abort();
    const c=new AbortController(); controller.current=c;
    const protocol = chosenDepth==='solo'?'solo':'trio';
    const session=createNewSession(prompt,protocol,makeInitialSteps(cfg,depth), 'balanced');
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
          enableSearchGrounding:true,autoResolve:cfg.autoResolve??true,selectedRound:cfg.selectedRound??2,
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
      if(e?.name!=='AbortError'){setSessions((prev)=>prev.map((s)=>s.id===session.id?{...s,status:'error',error:e?.message||'Research failed'}:s));setEvents((ev)=>[...ev,'Error: '+(e?.message||'Research failed')]);}
    } finally {setRunning(false);controller.current=null;saveSessions(sessions);}
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
            <button className="primary-btn" disabled={!query.trim()||running} onClick={start}><Icon name={running?'hourglass_top':'play_arrow'}/>{running?'Running…':'Initiate Synthesis'}</button>
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

function History({sessions,onSelect}:{sessions:DebateSession[];onSelect:(id:string)=>void}) {
  const [q,setQ]=useState('');
  const filtered=sessions.filter((s)=>!q||s.prompt.toLowerCase().includes(q.toLowerCase()));
  return <div className="page"><div className="section-head"><div><h1>History</h1><p>Completed and in-progress investigations saved locally by Breezy.</p></div></div><div className="panel"><input className="input" placeholder="Search investigations…" value={q} onChange={(e)=>setQ(e.target.value)}/><div className="list" style={{marginTop:10}}>{filtered.length?filtered.map((s)=><div className="list-row" key={s.id}><div className="list-main"><strong>{s.prompt}</strong><span>{new Date(s.createdAt).toLocaleString()} · {s.protocol} · {s.steps?.length||0} steps · {s.evidenceGraph?.sourcesConsulted?.length||0} sources</span></div><div style={{display:'flex',gap:7,alignItems:'center'}}><span className={'badge '+(s.status==='completed'?'good':'')}>{s.status}</span><button className="secondary-btn" onClick={()=>onSelect(s.id)}>Open</button></div></div>):<div className="empty">No saved investigations match that search.</div>}</div></div></div>;
}

function Models({serverGemini,onToast}:{serverGemini:boolean;onToast:(s:string)=>void}) {
  const [cfg,setCfg]=useState<CanonicalWorkspaceConfig>(()=>providerConfigService.getConfig());
  const [selected,setSelected]=useState('gemini');
  const [key,setKey]=useState('');
  const [,force]=useState(0);
  useEffect(()=>{effectiveProviderService.refreshServerHealth();return effectiveProviderService.subscribe(()=>force((x)=>x+1))},[]);
  const saveKey=()=>{
    const keys={...providerConfigService.getKeys(),[selected]:key.trim()};
    providerConfigService.saveKeys(keys);setCfg(providerConfigService.getConfig());setKey('');onToast('Provider key saved locally.');force((x)=>x+1);
  };
  const setRole=(role:keyof CanonicalWorkspaceConfig['roles'],provider:string,model:string)=>{
    const next={...cfg,roles:{...cfg.roles,[role]:{provider:provider as any,model}}};
    setCfg(next);providerConfigService.saveConfig(next);
  };
  return <div className="page"><div className="section-head"><div><h1>Models & Providers</h1><p>Configure what Breezy can actually route to. Static model catalogs are not connection claims.</p></div><ModelIndicator serverGemini={serverGemini}/></div>
    <div className="grid grid-3">
      <div className="metric"><div className="value">{providerConfigService.getConfiguredProviders().length}</div><div className="label">Configured providers</div></div>
      <div className="metric"><div className="value">{Object.values(AVAILABLE_MODELS).flat().length}</div><div className="label">Catalog models</div></div>
      <div className="metric"><div className="value">{serverGemini?'Available':'Not connected'}</div><div className="label">Server Gemini</div></div>
    </div>
    <div className="grid grid-2" style={{marginTop:12}}>
      <div className="panel"><div className="panel-title"><h2>Provider connections</h2><small>BYOK</small></div>
        <div className="list">{Object.keys(AVAILABLE_MODELS).map((p)=><div className="list-row" key={p}><div className="list-main"><strong>{providerLabel(p)}</strong><span>{(AVAILABLE_MODELS[p]||[]).length?AVAILABLE_MODELS[p].length+' catalog models':'Custom/local model support'}</span></div><span className={'badge '+(effectiveProviderService.getProviderInfo(p).status==='CONNECTED'||effectiveProviderService.getProviderInfo(p).status==='CONFIGURED'?'good':'')}>{effectiveProviderService.getProviderInfo(p).status.replace('_',' ')}</span></div>)}</div>
        <div className="grid grid-2" style={{marginTop:14}}>
          <label className="field"><span>Provider</span><select className="select" value={selected} onChange={(e)=>setSelected(e.target.value)}>{Object.keys(AVAILABLE_MODELS).map((p)=><option key={p} value={p}>{providerLabel(p)}</option>)}</select></label>
          <label className="field"><span>API key</span><input className="input" type="password" value={key} onChange={(e)=>setKey(e.target.value)} placeholder={selected==='ollama'?'Not required for local Ollama':''}/></label>
        </div>
        <button className="primary-btn" style={{marginTop:10}} onClick={saveKey}>Save provider</button>
      </div>
      <div className="panel"><div className="panel-title"><h2>Research seats</h2><small>Router</small></div>
        {(['architect','skeptic','verifier','arbiter'] as Array<keyof CanonicalWorkspaceConfig['roles']>).map((role)=><div key={role} className="list-row"><div className="list-main"><strong style={{textTransform:'capitalize'}}>{role}</strong><span>{cfg.roles[role].provider?providerLabel(cfg.roles[role].provider)+' · '+cfg.roles[role].model:'No model assigned'}</span></div><select className="select" style={{width:150}} value={cfg.roles[role].model||''} onChange={(e)=>{const model=e.target.value;const prov=(cfg.roles[role].provider || 'gemini');setRole(role,prov,model)}}><option value="">No model</option>{Object.entries(AVAILABLE_MODELS).flatMap(([p,models])=>models.map((m)=><option key={p+'_'+m.id} value={m.id}>{m.name}</option>))}</select></div>)}
      </div>
    </div>
    <div className="panel" style={{marginTop:12}}><div className="panel-title"><h2>Presets</h2><small>Optional shortcuts</small></div><div className="section-actions">{(['fast','balanced','deep'] as const).map((p)=><button className="secondary-btn" key={p} onClick={()=>{const n=providerConfigService.applyPreset(p);setCfg(n);onToast(p+' preset applied.')}}>{p[0].toUpperCase()+p.slice(1)}</button>)}<button className="ghost-btn" onClick={()=>{const n=providerConfigService.getConfig();n.roles={architect:{provider:'',model:''},skeptic:{provider:'',model:''},verifier:{provider:'',model:''},arbiter:{provider:'',model:''}};n.defaultProvider='';n.defaultModel='';providerConfigService.saveConfig(n);setCfg(n);onToast('Role assignments cleared.')}}>Clear assignments</button></div></div>
  </div>;
}

function Docs() {
  return <div className="page"><div className="section-head"><div><h1>Docs</h1><p>The calm surface around Breezy's real research architecture.</p></div></div><div className="grid grid-2">
    {[
      ['Research workflow','Breezy streams multi-perspective research through the configured protocol, search provider, evidence collection, challenge, and synthesis.'],
      ['Truthful routing','Provider state comes from providerConfigService and effectiveProviderService. A catalog model is not a connected model.'],
      ['Storage','Research sessions are saved locally and mirrored into IndexedDB when available. Fake sample sessions are filtered on load.'],
      ['Deployment','The frontend remains a Vite static application with the existing API failover architecture and Cloudflare deployment path.'],
      ['Evidence','Search-grounded findings are stored on the session evidence graph when the backend reports sources.'],
      ['Build','The Build workspace uses real GitHub API operations when you provide a GitHub token; it does not create a fake demo repository.'],
    ].map(([t,b])=><div className="panel" key={t}><div className="panel-title"><h2>{t}</h2></div><p style={{color:'#aab5ba',fontSize:13,lineHeight:1.7,margin:0}}>{b}</p></div>)}
  </div></div>;
}

function Settings({serverGemini,onProfileSaved}:{serverGemini:boolean;onProfileSaved:(p:UserProfile)=>void}) {
  const [cfg,setCfg]=useState(()=>providerConfigService.getConfig());
  const [profile,setProfile]=useState<UserProfile>(()=>userProfileService.getProfile());
  const save=()=>{providerConfigService.saveConfig(cfg);userProfileService.saveProfile(profile);onProfileSaved(profile)};
  return <div className="page"><div className="section-head"><div><h1>Settings</h1><p>Only settings backed by actual Breezy state are exposed here.</p></div><button className="primary-btn" onClick={save}><Icon name="save"/>Save changes</button></div>
    <div className="grid grid-2">
      <div className="panel"><div className="panel-title"><h2>Research</h2><small>Runtime</small></div>
        <div className="grid grid-2">
          <label className="field"><span>Search engine</span><select className="select" value={cfg.searchEngine||'duckduckgo'} onChange={(e)=>setCfg({...cfg,searchEngine:e.target.value as SearchEngineProvider})}>{['duckduckgo','google','tavily','serper','brave','searxng'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>Research method</span><select className="select" value={cfg.researchMethod||'adaptive'} onChange={(e)=>setCfg({...cfg,researchMethod:e.target.value as any})}>{['adaptive','systematic','evidence-map','comparative'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>Selected round</span><select className="select" value={cfg.selectedRound||2} onChange={(e)=>setCfg({...cfg,selectedRound:Number(e.target.value)})}>{[1,2,3,4].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>Heartbeat interval (sec)</span><input className="input" type="number" value={cfg.heartbeatIntervalSec||60} onChange={(e)=>setCfg({...cfg,heartbeatIntervalSec:Number(e.target.value)})}/></label>
        </div>
        <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}><input type="checkbox" checked={cfg.heartbeatEnabled!==false} onChange={(e)=>setCfg({...cfg,heartbeatEnabled:e.target.checked})}/> Enable heartbeat</label>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}><input type="checkbox" checked={cfg.autoResolve!==false} onChange={(e)=>setCfg({...cfg,autoResolve:e.target.checked})}/> Auto-resolve</label>
        </div>
      </div>
      <div className="panel"><div className="panel-title"><h2>Profile</h2><small>{profile.authorizationType}</small></div>
        <div className="grid grid-2">
          {([
            ['displayName','Display name'],
            ['email','Email'],
            ['roleTitle','Role / title'],
            ['organization','Organization'],
          ] as Array<[keyof UserProfile,string]>).map(([k,label])=><label className="field" key={k}><span>{label}</span><input className="input" value={profile[k] as string} onChange={(e)=>setProfile({...profile,[k]:e.target.value})}/></label>)}
        </div>
        <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,marginTop:12}}><input type="checkbox" checked={profile.autoSaveToDrive} onChange={(e)=>setProfile({...profile,autoSaveToDrive:e.target.checked})}/> Auto-save completed research to Google Docs when authorized</label>
      </div>
    </div>
    <div className="panel" style={{marginTop:12}}><div className="panel-title"><h2>Connection truth</h2><small>Live state</small></div><div className="grid grid-3"><div className="metric"><div className="value">{serverGemini?'Yes':'No'}</div><div className="label">Server Gemini</div></div><div className="metric"><div className="value">{providerConfigService.getConfiguredProviders().length}</div><div className="label">BYOK / local providers</div></div><div className="metric"><div className="value">{providerConfigService.getActiveRoutableModel()?.model || 'None'}</div><div className="label">Active model</div></div></div></div>
  </div>;
}

function Profile({profile,setProfile}:{profile:UserProfile;setProfile:(p:UserProfile)=>void}) {
  const [draft,setDraft]=useState(profile);
  return <div className="page"><div className="section-head"><div><h1>Profile</h1><p>Your identity is optional. Breezy does not invent one.</p></div><button className="primary-btn" onClick={()=>setProfile(userProfileService.saveProfile(draft))}><Icon name="save"/>Save profile</button></div>
    <div className="panel" style={{maxWidth:760}}><div style={{display:'flex',gap:16,alignItems:'center',marginBottom:18}}><div className="avatar" style={{width:58,height:58,fontSize:18}}>{initials(draft)}</div><div><h2 style={{fontFamily:'Plus Jakarta Sans',margin:'0 0 3px'}}>{draft.displayName || 'Breezy user'}</h2><span style={{fontSize:11,color:'#7c898e'}}>{draft.roleTitle || 'No role set'}{draft.organization?' · '+draft.organization:''}</span></div></div>
      <div className="grid grid-2">{[
        ['displayName','Display name'],['email','Email'],['roleTitle','Role / title'],['organization','Organization']
      ].map(([k,l])=><label className="field" key={k}><span>{l}</span><input className="input" value={(draft as any)[k]} onChange={(e)=>setDraft({...draft,[k]:e.target.value})}/></label>)}</div>
      <div style={{marginTop:18}} className="badge">{draft.authorizationType==='guest'?'Guest profile':'Authorized via '+draft.authorizationType}</div>
    </div>
  </div>;
}

function Build() {
  const [token,setToken]=useState('');
  const [repos,setRepos]=useState<GitHubRepository[]>([]);
  const [repo,setRepo]=useState('');
  const [files,setFiles]=useState<GitHubContent[]>([]);
  const [activePath,setActivePath]=useState('');
  const [code,setCode]=useState('');
  const [sha,setSha]=useState('');
  const [logs,setLogs]=useState<string[]>([]);
  const connect=async()=>{const list=await gitHubService.listRepositories(token);setRepos(list);setLogs((x)=>['Loaded '+list.length+' repositories.',...x])};
  const openRepo=async(r:string)=>{setRepo(r);const list=await gitHubService.listRepoContents(token,r,'');setFiles(list);setLogs((x)=>['Opened '+r,...x])};
  const openFile=async(path:string)=>{try{const d=await gitHubService.fetchFileDetails(token,repo,path);setActivePath(path);setCode(d.content);setSha(d.sha);setLogs((x)=>['Opened '+path,...x])}catch(e:any){setLogs((x)=>['Open failed: '+(e?.message||'error'),...x])}};
  const save=async()=>{if(!repo||!activePath)return;try{await gitHubService.updateFileContent(token,repo,activePath,code,sha,'Update '+activePath+' via Breezy');setLogs((x)=>['Committed '+activePath,...x]);}catch(e:any){setLogs((x)=>['Commit failed: '+(e?.message||'error'),...x])}};
  return <div className="page"><div className="section-head"><div><h1>Build</h1><p>A real repository-first workspace. Give Breezy a GitHub token and work on actual files.</p></div><span className="badge cyan">No demo repository</span></div>
    <div className="panel" style={{marginBottom:10}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><input className="input" style={{maxWidth:460}} type="password" placeholder="GitHub personal access token" value={token} onChange={(e)=>setToken(e.target.value)}/><button className="primary-btn" onClick={connect} disabled={!token}><Icon name="link"/>Connect GitHub</button></div></div>
    <div className="ide">
      <div className="ide-pane"><div className="ide-toolbar"><span>Repositories</span><span>{repos.length}</span></div><div className="file-list">{repos.map((r)=><div className={'file '+(repo===r.full_name?'active':'')} key={r.id} onClick={()=>openRepo(r.full_name)}>{r.name}</div>)}</div></div>
      <div className="ide-pane"><div className="ide-toolbar"><span>{activePath||'Select a file'}</span><button className="ghost-btn" style={{padding:'4px 7px'}} onClick={save} disabled={!activePath||!repo}><Icon name="commit"/></button></div><textarea className="editor" value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Open a repository file to edit it."/><div className="file-list" style={{maxHeight:160}}>{files.map((f)=><div className={'file '+(activePath===f.path?'active':'')} key={f.path} onClick={()=>f.type==='file'&&openFile(f.path)}>{f.type==='dir'?'▸ ':''}{f.path}</div>)}</div></div>
      <div className="ide-pane"><div className="ide-toolbar"><span>Activity</span><span>{repo||'No repo'}</span></div><div className="terminal">{logs.length?logs.map((l,i)=><div key={i}>{l}</div>):'Nothing here yet.'}</div></div>
    </div>
  </div>;
}

type CanvasCard={id:string;type:'idea'|'research'|'code'|'task';title:string;content:string;tags?:string[];done?:boolean;createdAt:string};
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

export default function App() {
  const [active,setActive]=useState<Tab>(()=>{const h=window.location.hash.replace('#','') as Tab;return (NAV.some((x)=>x.id===h)||h==='landing')?h:'landing'});
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sessions,setSessions]=useState<DebateSession[]>(()=>loadSessions());
  const [activeSessionId,setActiveSessionId]=useState<string|null>(()=>loadActiveSessionId());
  const [profile,setProfile]=useState<UserProfile>(()=>userProfileService.getProfile());
  const [serverGemini,setServerGemini]=useState(false);
  const [toast,setToast]=useState<string|null>(null);

  const current=sessions.find((s)=>s.id===activeSessionId)||sessions[0]||null;
  useEffect(()=>{window.location.hash=active;setSidebarOpen(false)},[active]);
  useEffect(()=>{saveSessions(sessions)},[sessions]);
  useEffect(()=>{if(activeSessionId)saveActiveSessionId(activeSessionId)},[activeSessionId]);
  useEffect(()=>{apiClient.getHealth().then((h)=>setServerGemini(Boolean(h.serverGeminiConfigured))).catch(()=>{});return effectiveProviderService.subscribe(()=>{})},[]);

  const showToast=(s:string)=>{setToast(s);window.setTimeout(()=>setToast(null),3200)};
  const startFromLanding=(q:string,d:Depth)=>{setPendingResearch({q,d});setActive('research')};

  const render=()=>{
    if(active==='landing')return <Landing serverGemini={serverGemini} onStart={startFromLanding} onGo={setActive}/>;
    if(active==='chat')return <Chat serverGemini={serverGemini}/>;
    if(active==='research')return <Research sessions={sessions} setSessions={setSessions} activeId={activeSessionId} setActiveId={setActiveSessionId} serverGemini={serverGemini} onToast={showToast} pendingResearch={pendingResearch} onConsumed={()=>setPendingResearch(null)}/>;
    if(active==='history'||active==='notes')return <History sessions={sessions} onSelect={(id)=>{setActiveSessionId(id);setActive('research')}}/>;
    if(active==='models')return <Models serverGemini={serverGemini} onToast={showToast}/>;
    if(active==='docs')return <Docs/>;
    if(active==='settings')return <Settings serverGemini={serverGemini} onProfileSaved={(p)=>{setProfile(p);showToast('Settings saved.')}}/>;
    if(active==='profile')return <Profile profile={profile} setProfile={(p)=>{setProfile(p);showToast('Profile saved.')}}/>;
    if(active==='build')return <Build/>;
    if(active==='canvas')return <Canvas/>;
    return null;
  };

  return <div className="app">
    <Sidebar active={active} onChange={setActive} profile={profile} open={sidebarOpen} setOpen={setSidebarOpen}/>
    <div className="main">
      <Topbar serverGemini={serverGemini} onMenu={()=>setSidebarOpen(!sidebarOpen)} onNewResearch={()=>setActive('research')}/>
      {render()}
    </div>
    <nav className="mobile-nav">{NAV.slice(0,6).map((n)=><button key={n.id} className={active===n.id?'active':''} onClick={()=>setActive(n.id)}><Icon name={n.icon}/><span>{n.label}</span></button>)}</nav>
    {toast&&<div className="toast">{toast}</div>}
  </div>;
}
