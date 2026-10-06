import React, { useEffect, useState } from 'react';
import StitchFrame from '../components/stitch/StitchFrame';
import { effectiveProviderService } from '../services/effectiveProviderService';
import { apiClient } from '../services/apiClient';
import { loadActiveSessionId, loadSessions, saveActiveSessionId, saveSessions } from '../services/sessionStorage';
import { providerConfigService } from '../services/providerConfigService';
import { userProfileService } from '../services/userProfileService';
import type { DebateSession } from '../types';
import type { UserProfile } from '../services/userProfileService';
import type { Tab, Depth, ResearchUiState } from './types';
import { NAV } from './navigation';
import Research from '../features/research/Research';
import History from '../features/history/History';
import Settings from '../features/settings/Settings';
import Build from '../features/build/Build';
import Canvas from '../features/canvas/Canvas';
import { Sidebar, Topbar } from '../components/layout';
import { Icon } from '../components/breezy-shared';

export default function App() {
  const [active,setActive]=useState<Tab>(()=>{const h=window.location.hash.replace('#','') as Tab;return (NAV.some((x)=>x.id===h)||h==='landing')?h:'landing'});
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [sessions,setSessions]=useState<DebateSession[]>(()=>loadSessions());
  const [activeSessionId,setActiveSessionId]=useState<string|null>(()=>loadActiveSessionId());
  const [profile,setProfile]=useState<UserProfile>(()=>userProfileService.getProfile());
  const [serverGemini,setServerGemini]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [chatHistory,setChatHistory]=useState<Array<{role:'user'|'assistant';content:string}>>([]);
  const [pendingResearch,setPendingResearch]=useState<{q:string;d:Depth}|null>(null);
  const [researchUi,setResearchUi]=useState<ResearchUiState>({running:false,activeStep:0,status:'idle',query:'',output:''});

  useEffect(()=>{window.location.hash=active;setSidebarOpen(false)},[active]);
  useEffect(()=>{saveSessions(sessions)},[sessions]);
  useEffect(()=>{if(activeSessionId)saveActiveSessionId(activeSessionId)},[activeSessionId]);
  useEffect(()=>{
    let mounted=true;
    const refresh=async()=>{try{const h=await apiClient.getHealth();if(mounted)setServerGemini(Boolean(h.serverGeminiConfigured));await effectiveProviderService.refreshServerHealth();}catch{}};
    void refresh();
    const unsubscribe=effectiveProviderService.subscribe(()=>{});
    return ()=>{mounted=false;unsubscribe();};
  },[]);

  const showToast=(s:string)=>{setToast(s);window.setTimeout(()=>setToast(null),3200)};
  const startFromLanding=(q:string,d:Depth)=>{setPendingResearch({q,d});setActive('research')};

  const render=()=>{
    if(active==='landing')return <StitchFrame file="landing-desktop.html" mobileFile="landing-mobile.html" profile={profile} onNavigate={(tab)=>setActive(tab as Tab)} onResearch={(query,depth)=>startFromLanding(query,depth||'standard')}/>;
    if(active==='chat')return <StitchFrame file="chat-desktop.html" mobileFile="chat-mobile.html" profile={profile} onNavigate={(tab)=>setActive(tab as Tab)} onChat={async(query)=>{
      const activeModel=effectiveProviderService.getActiveRoutableModel();
      if(!activeModel)return 'No model connected. Open Models and configure a provider first.';
      try{
        const key=providerConfigService.getKey(activeModel.provider);
        const result=await apiClient.chatBreezy({prompt:query,history:chatHistory.slice(-20),provider:activeModel.provider,model:activeModel.model,apiKey:key});
        const response=result.text||'The model returned an empty response.';
        setChatHistory(prev=>[...prev,{role:'user',content:query},{role:'assistant',content:response}].slice(-20));
        return response;
      }catch(e:any){return 'Chat failed: '+(e?.message||'Unknown error');}
    }}/>;
    if(active==='research')return <StitchFrame file="research-desktop.html" mobileFile="research-mobile.html" profile={profile} researchState={researchUi} onNavigate={(tab)=>setActive(tab as Tab)} onResearch={(query,depth)=>startFromLanding(query,depth||'deep')}/>;
    if(active==='history'||active==='notes')return <History sessions={sessions} onSelect={(id)=>{setActiveSessionId(id);setActive('research')}}/>;
    if(active==='models')return <StitchFrame file="models-desktop.html" profile={profile} screen="models" onNavigate={(t)=>setActive(t as Tab)}
      onProviderKeySave={(provider,key)=>{
        const map:Record<string,string>={Anthropic:'anthropic','Google DeepMind':'gemini',OpenAI:'openai-compatible','Local Ollama':'ollama','Custom LLM Provider / vLLM':'openai-compatible'};
        const id=map[provider]; if(!id){showToast('Unknown provider. Nothing was saved.');return;}
        const cfg=providerConfigService.getConfig();
        if(id==='ollama'){cfg.ollamaBaseUrl=key.trim();providerConfigService.saveConfig(cfg);showToast('Local Ollama endpoint saved. Select a live model before routing.');}
        else{providerConfigService.saveKeys({...providerConfigService.getKeys(),[id]:key.trim()});showToast(provider+' key saved locally.');}
      }}
      onSeatModelChange={(index,provider,model)=>{
        const roles=['architect','skeptic','verifier','arbiter'] as const; const role=roles[index]; if(!role)return;
        const cfg=providerConfigService.getConfig();
        cfg.roles={...cfg.roles,[role]:{provider:provider as any,model}};
        providerConfigService.saveConfig(cfg);
        showToast(role[0].toUpperCase()+role.slice(1)+' routing updated.');
      }}
      onModelProbe={()=>showToast('Live node probing is not implemented here; no connection claim was made.')}/>;
    if(active==='docs')return <StitchFrame file="docs-desktop.html" profile={profile} screen="docs" onNavigate={(t)=>setActive(t as Tab)}/>;
    if(active==='settings')return <Settings serverGemini={serverGemini} onProfileSaved={(p)=>{setProfile(p);showToast('Settings saved.')}}/>;
    if(active==='profile')return <StitchFrame file="profile-desktop.html" profile={profile} screen="profile" onNavigate={(t)=>setActive(t as Tab)}/>;
    if(active==='build')return <Build/>;
    if(active==='canvas')return <Canvas/>;
    return null;
  };

  const isStitchScreen=active==='landing'||active==='chat'||active==='research'||active==='docs'||active==='models'||active==='profile';
  return <>
    <div style={{display:'none'}} aria-hidden="true">
      <Research sessions={sessions} setSessions={setSessions} activeId={activeSessionId} setActiveId={setActiveSessionId} serverGemini={serverGemini} onToast={showToast} pendingResearch={pendingResearch} onConsumed={()=>setPendingResearch(null)} onStateChange={setResearchUi}/>
    </div>
    {isStitchScreen?render():(
      <div className="app">
        <Sidebar active={active} onChange={setActive} profile={profile} open={sidebarOpen} setOpen={setSidebarOpen}/>
        <div className="main"><Topbar serverGemini={serverGemini} onMenu={()=>setSidebarOpen(!sidebarOpen)} onNewResearch={()=>setActive('research')}/>{render()}</div>
        <nav className="mobile-nav">{NAV.slice(0,6).map(n=><button key={n.id} className={active===n.id?'active':''} onClick={()=>setActive(n.id)}><Icon name={n.icon}/><span>{n.label}</span></button>)}</nav>
        {toast&&<div className="toast">{toast}</div>}
      </div>
    )}
    {toast&&isStitchScreen&&<div className="toast" style={{zIndex:100}}>{toast}</div>}
  </>;
}
