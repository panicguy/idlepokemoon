'use strict';
const {BrowserWindow,session,ipcMain}=require('electron');
const {randomUUID}=require('crypto');
const {tbSimulationHTML}=require('./team-boss-runner');
const ENTRY='https://idlemoon-boss.invalid/simulation';
function createBossSimulator({views,origin}){
  const active=new Map();
  const allowed=e=>views().some(v=>v.webContents===e.sender)&&e.senderFrame===e.sender.mainFrame&&e.sender.getURL().startsWith(origin+'/play');
  function cancel(senderId){active.get(senderId)?.finish(Error('Simulação cancelada.'));}
  ipcMain.handle('team-boss:cancel',(e,id)=>{if(!allowed(e))throw Error('Conta inválida.');const r=active.get(e.sender.id);if(r?.id===id)cancel(e.sender.id);return {ok:true};});
  ipcMain.handle('team-boss:run',async(e,p)=>{
    if(!allowed(e))throw Error('Conta inválida.');
    if(!p||typeof p.id!=='string'||p.id.length>80||!p.input||typeof p.html!=='string'||!p.assets||JSON.stringify(p).length>16000000)throw Error('Pedido de simulação inválido.');
    if(!/^[a-z0-9-]{2,40}$/.test(p.input.boss?.id||'')||!Array.isArray(p.input.owned?.pokes)||p.input.owned.pokes.length>10000)throw Error('Inventário ou boss inválido.');
    cancel(e.sender.id);
    const channel=randomUUID(),prefix='IPM_BOSS_'+channel+':',ses=session.fromPartition('boss-offline-'+randomUUID());
    const html=tbSimulationHTML(p.html,p.assets,p.input.boss.id,p.input.choice||'',p.input,channel).replace('<body>','<body><script>addEventListener("message",e=>{if(e.source===window&&e.data?.channel==='+JSON.stringify(channel)+')console.log('+JSON.stringify(prefix)+'+JSON.stringify(e.data));});</script>');
    await ses.protocol.handle('https',req=>req.url===ENTRY?new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}}):new Response('Offline',{status:403}));
    ses.webRequest.onBeforeRequest((details,cb)=>cb({cancel:details.url!==ENTRY}));
    ses.setPermissionRequestHandler((_w,_p,cb)=>cb(false));ses.setPermissionCheckHandler(()=>false);
    const worker=new BrowserWindow({show:false,webPreferences:{session:ses,sandbox:true,contextIsolation:true,nodeIntegration:false,nodeIntegrationInSubFrames:false,webSecurity:true,devTools:false,backgroundThrottling:false}});
    worker.webContents.setWindowOpenHandler(()=>({action:'deny'}));worker.webContents.on('will-navigate',ev=>ev.preventDefault());
    return new Promise(resolve=>{
      let finished=false,watchdog;
      const onNavigation=()=>finish(Error('A conta foi recarregada. Simulação cancelada.'));
      const onDestroyed=()=>finish(Error('A conta foi fechada.'));
      const finish=(error,result)=>{
        if(finished)return;finished=true;clearTimeout(watchdog);e.sender.removeListener('did-start-navigation',onNavigation);e.sender.removeListener('destroyed',onDestroyed);active.delete(e.sender.id);
        if(!worker.isDestroyed())worker.destroy();try{ses.protocol.unhandle('https');}catch(_){}resolve(error?{ok:false,error:error.message}:{ok:true,result});
      };
      active.set(e.sender.id,{id:p.id,finish});
      e.sender.on('did-start-navigation',onNavigation);e.sender.once('destroyed',onDestroyed);
      const arm=()=>{clearTimeout(watchdog);watchdog=setTimeout(()=>finish(Error('O simulador ficou 60 segundos sem progresso. Tente novamente.')),60000);};arm();
      worker.webContents.on('console-message',(...args)=>{
        const message=args[0]?.message||args[2];if(typeof message!=='string'||!message.startsWith(prefix))return;
        try{const m=JSON.parse(message.slice(prefix.length));if(m.channel!==channel)return;
          if(m.type==='progress'){arm();if(!e.sender.isDestroyed())e.sender.send('team-boss:progress',{id:p.id,...m});}
          else if(m.type==='done')finish(null,m.data);else if(m.type==='error')finish(Error(m.data?.message||'Erro no motor.'));
        }catch(err){finish(err);}
      });
      worker.webContents.on('render-process-gone',()=>finish(Error('Processo do simulador encerrou.')));
      worker.loadURL(ENTRY).catch(finish);
    });
  });
  return {dispose(){for(const r of [...active.values()])r.finish(Error('Hub fechado.'));ipcMain.removeHandler('team-boss:run');ipcMain.removeHandler('team-boss:cancel');}};
}
module.exports={createBossSimulator};
