import React from 'react';
import { Icon } from '../../components/breezy-shared';

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

export default Docs;
