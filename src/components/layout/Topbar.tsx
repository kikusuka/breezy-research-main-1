import React from 'react';
import { Icon, ModelIndicator } from '../breezy-shared';

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

export default Topbar;
