import React from 'react';
import type { Tab } from '../../app/types';
import type { UserProfile } from '../../services/userProfileService';
import { Icon, initials } from '../breezy-shared';

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

export default Sidebar;
