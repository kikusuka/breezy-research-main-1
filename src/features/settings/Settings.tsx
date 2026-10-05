import React, { useState } from 'react';
import type { SearchEngineProvider } from '../../types';
import { providerConfigService } from '../../services/providerConfigService';
import { userProfileService } from '../../services/userProfileService';
import type { UserProfile } from '../../services/userProfileService';
import { Icon } from '../../components/breezy-shared';

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

export default Settings;
