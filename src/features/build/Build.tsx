import React, { useState } from 'react';
import { gitHubService } from '../../services/gitHubService';
import type { GitHubRepository, GitHubContent } from '../../services/gitHubService';
import { Icon } from '../../components/breezy-shared';

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

export default Build;
