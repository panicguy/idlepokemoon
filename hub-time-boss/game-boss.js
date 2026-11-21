'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('idleMoonBossSimulator',{
  version:'1',
  run:payload=>ipcRenderer.invoke('team-boss:run',payload),
  cancel:id=>ipcRenderer.invoke('team-boss:cancel',id),
  onProgress:fn=>{const handler=(_event,m)=>fn(m);ipcRenderer.on('team-boss:progress',handler);return ()=>ipcRenderer.removeListener('team-boss:progress',handler);}
});
