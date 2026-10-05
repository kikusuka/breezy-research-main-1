import type { Tab } from './types';

export const NAV: Array<{id:Tab;label:string;icon:string;group:string}> = [
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
