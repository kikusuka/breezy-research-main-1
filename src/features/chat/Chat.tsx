import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { providerConfigService } from '../../services/providerConfigService';
import { Icon } from '../../components/breezy-shared';

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

export default Chat;
