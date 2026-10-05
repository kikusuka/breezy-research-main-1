import React, { useEffect, useState } from 'react';
import { AVAILABLE_MODELS, CanonicalWorkspaceConfig, providerConfigService } from '../../services/providerConfigService';
import { Icon, ModelIndicator, providerLabel } from '../../components/breezy-shared';
import { effectiveProviderService } from '../../services/effectiveProviderService';

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

export default Models;
