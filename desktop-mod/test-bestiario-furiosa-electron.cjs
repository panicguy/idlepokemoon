'use strict';
const {app,BrowserWindow,session}=require('electron');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.dirname(__dirname),evidence=path.join(__dirname,'ui-evidence');
app.setPath('userData',path.join(evidence,'bestiario-furiosa-profile'));let server;
(async()=>{await app.whenReady();fs.mkdirSync(evidence,{recursive:true});
 const source=fs.readFileSync(path.join(root,'PokeMoon-Rota-Bestiario-KimJongDudu.user.js'),'utf8');
 server=http.createServer((req,res)=>{const cfg=JSON.parse(new URL(req.url,'http://fixture').searchParams.get('cfg')||'{}');res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><body><script>'+`
 let K={player:{id:'fixture',level:300},active:{id:'poke',hp:100},inst:{zona:${cfg.otherZone?2:1},furiosa:${!!cfg.currentFuriosa}},auto:{hunt:true,catch:true,ballAuto:true},balls:{ultra:1000}};let q='fixture-only';
 localStorage.clear();${cfg.saved===undefined?'':`localStorage.setItem('ipm-rota-bestiario-settings-v1:fixture',JSON.stringify({furiosa:${!!cfg.saved}}));`}
 window.__orders=[];window.setInterval=fn=>{window.__routeTick=fn;return 1};window.IPM_ON_STATE=fn=>window.__onState=fn;window.IPM_HUNTS={liberadas:async()=>new Set(['combee'])};function handleStateUpdate(s){K=s;window.__onState?.()}
 window.fetch=async(url,opts)=>{if(url.startsWith('/api/bestiario'))return{ok:true,json:async()=>({especies:[{k:'combee'}],candidatos:[],colecao:{}})};if(url.startsWith('/api/hunts'))return{ok:true,json:async()=>({zonas:[{i:1,n:'Área de Combee',b:'combee',lv:1}]})};if(url==='/api/action'){const p=JSON.parse(opts.body);if(p.action!=='selectZone')throw Error('Unexpected action');__orders.push(p);return{ok:true,json:async()=>({state:{...K,inst:{zona:p.index,furiosa:${cfg.wrongConfirmation?'!p.furiosa':'p.furiosa'}}}})}};throw Error('Unexpected request')};
 `+'</script><script>'+source+'</script>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 session.defaultSession.webRequest.onBeforeRequest((d,cb)=>cb({cancel:!d.url.startsWith(base)}));
 const win=new BrowserWindow({width:1100,height:850,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}}),js=s=>win.webContents.executeJavaScript(s);
 const load=async cfg=>{await win.loadURL(base+'/?cfg='+encodeURIComponent(JSON.stringify(cfg)));assert.equal(await js('__orders.length'),0,'does not start by itself');};
 const start=()=>js('(async()=>{await document.querySelector("[data-start]").onclick();await __routeTick()})()');
 for(const desired of [false,true])for(const current of [false,true]){
  await load({saved:desired,currentFuriosa:current});assert.equal(await js('document.querySelector("[data-furiosa]").checked'),desired);await start();const orders=await js('__orders');assert.equal(orders.length,desired===current?0:1,'same zone must also match the chosen mode');if(orders.length)assert.equal(orders[0].furiosa,desired);assert.equal(await js('document.querySelector("[data-furiosa]").disabled'),true);assert.match(await js('document.querySelector("[data-mode]").textContent'),/Ativa/);
 }
 await load({otherZone:true});assert.equal(await js('document.querySelector("[data-furiosa]").checked'),false,'old settings default to normal');await js('var flag=document.querySelector("[data-furiosa]");flag.checked=true;flag.onchange()');assert.equal(await js('JSON.parse(localStorage.getItem("ipm-rota-bestiario-settings-v1:fixture")).furiosa'),true);await start();assert.equal((await js('__orders'))[0].furiosa,true);
 await js('document.querySelector("[data-stop]").onclick()');assert.equal(await js('document.querySelector("[data-furiosa]").disabled'),false);await js('var f=document.querySelector("[data-furiosa]");f.checked=false;f.onchange()');assert.equal(await js('JSON.parse(localStorage.getItem("ipm-rota-bestiario-settings-v1:fixture")).furiosa'),false);
 await js('K.player.id="other-account";__routeTick()');assert.equal(await js('document.querySelector("[data-furiosa]").checked'),false);assert.equal(await js('localStorage.getItem("ipm-rota-bestiario-settings-v1:other-account")'),null);
 await load({saved:true,wrongConfirmation:true});await start();assert.equal(await js('document.querySelector("[data-mode]").textContent'),'Pausada');assert.match(await js('document.querySelector("[data-status]").textContent'),/não confirmou/);
 await js('document.querySelector("[data-kjd-button=bestiario]").click()');fs.writeFileSync(path.join(evidence,'bestiario-furiosa.png'),(await win.webContents.capturePage()).toPNG());
 console.log('PASS: normal/Furiosa travel, same-zone mode changes, matching-mode no-op, per-account persistence, default normal, paused editing, wrong-mode confirmation refusal, no real network.');win.destroy();server.close();app.quit();
})().catch(e=>{console.error(e);server?.close();app.exit(1)});
