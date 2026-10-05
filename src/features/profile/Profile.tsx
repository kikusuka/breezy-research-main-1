import React, { useState } from 'react';
import { userProfileService } from '../../services/userProfileService';
import type { UserProfile } from '../../services/userProfileService';
import { Icon, initials } from '../../components/breezy-shared';

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

export default Profile;
