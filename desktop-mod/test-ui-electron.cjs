'use strict';
// Run with the official Electron executable: electron test-ui-electron.cjs
const { app, BrowserWindow, session } = require('electron');
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = path.dirname(__dirname), evidence = path.join(__dirname, 'ui-evidence');
app.setPath('userData', path.join(evidence, 'isolated-profile'));
const files = ['PokeMoon-AutoCatch-KimJongDudu.user.js','PokeMoon-AutoRefill-KimJongDudu.user.js','PokeMoon-Rota-Bestiario-KimJongDudu.user.js'];
const shared = fs.readFileSync(path.join(__dirname, 'moon-dock.js'), 'utf8').trimEnd();
for (const file of files) assert(fs.readFileSync(path.join(root, file), 'utf8').includes(shared), 'Embedded dock out of sync: ' + file);
const orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const initial = { 'kim-pokemoon-autocatch-settings': { enabled: true, shiny: false, intervalMs: 2000 }, 'pm-autorefill-kjd-v1': { enabled: true, sellFirst: false, interval: 60, maxSpendCycle: 100, items: {} }, 'ipm-rota-bestiario-pos-v103': { x: 99999, y: 99999 } };
const setup = `localStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify(initial)}))localStorage.setItem(k,JSON.stringify(v));window.__testActions=0;window.Y=async()=>{window.__testActions++;throw Error('Unexpected real action')};window.fetch=async()=>{window.__testActions++;throw Error('Unexpected fetch')};window.gameState={_kTelaUlt:{balls:{ultra:1000},potions:{ultimate:1000}}};`;
let server;
(async()=>{await app.whenReady();fs.mkdirSync(evidence,{recursive:true});
  server=http.createServer((req,res)=>{
    res.setHeader('Content-Type',req.url.endsWith('.js')?'application/javascript; charset=utf-8':'text/html; charset=utf-8');
    if(req.url==='/setup.js')return res.end(setup);
    const script=files.find(f=>req.url==='/'+f);if(script)return res.end(fs.readFileSync(path.join(root,script)));
    const order=orders[Number(new URL(req.url,'http://fixture').searchParams.get('order'))||0];
    res.end('<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\'; connect-src \'self\'"><body style="background:#11182d;color:white;font:16px system-ui"><h2>Moon Dock — teste isolado</h2><div id="cp-list"></div><script src="/setup.js"></script>'+order.map(i=>'<script src="/'+files[i]+'"></script>').join(''));
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;const remote=[];
  session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{const allowed=details.url.startsWith('http://127.0.0.1:'+port+'/');if(!allowed)remote.push(details.url);callback({cancel:!allowed})});
  const win=new BrowserWindow({width:1280,height:800,show:false,webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});
  const pageErrors=[];win.webContents.on('console-message',(_e,level,message)=>{if(level>=3)pageErrors.push(message)});
  for(let order=0;order<orders.length;order++){
    win.setSize(1280,800);await win.loadURL('http://127.0.0.1:'+port+'/?order='+order);
    const results=await win.webContents.executeJavaScript(`(async()=>{
      const check=(v,m)=>{if(!v)throw Error(m)};
      const dock=document.querySelector('#kjd-moon-dock');check(dock,'dock missing');check(document.querySelectorAll('#kjd-moon-dock').length===1,'duplicate dock');
      check(dock.children.length===3,'three buttons');check(document.querySelectorAll('#kjd-moon-dock-style').length===1,'one shared style');
      const buttons=[...dock.querySelectorAll('button')],panes=[...document.querySelectorAll('[data-kjd-panel]')];check(panes.length===3&&panes.every(p=>p.hidden),'panels initially hidden');
      check(buttons.map(b=>b.dataset.kjdButton).join(',')==='autocatch,autorefill,bestiario','stable button order');
      const icons=buttons.map(b=>{const c=b.querySelector('canvas');check(c,'canvas icon missing');const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;check(pixels.some((v,i)=>i%4===3&&v>0),'transparent icon');return{button:b.dataset.kjdButton,width:c.width,height:c.height}});
      const saved=localStorage.getItem('kim-pokemoon-autocatch-settings')+'|'+localStorage.getItem('pm-autorefill-kjd-v1');
      for(const button of buttons){button.click();await Promise.resolve();const visible=panes.filter(p=>!p.hidden);check(visible.length===1&&visible[0].dataset.kjdPanel===button.dataset.kjdButton,'exclusive panel');check(button.getAttribute('aria-expanded')==='true','expanded status');button.click();await Promise.resolve();check(panes.every(p=>p.hidden),'toggle closes');}
      for(const button of buttons){button.click();const pane=panes.find(p=>p.dataset.kjdPanel===button.dataset.kjdButton);const close=pane.querySelector('[data-close]')||[...pane.querySelectorAll('button')].find(b=>(b.title||'').startsWith('Fechar'));check(close,'close button');close.click();await Promise.resolve();check(!button.classList.contains('active')&&button.getAttribute('aria-expanded')==='false','close sync');}
      const first=buttons[0];first.click();const pane=panes.find(p=>p.dataset.kjdPanel===first.dataset.kjdButton);window.__kjdMoonDockV2.register(first.dataset.kjdButton,first.title,first.querySelector('canvas'),pane);check(dock.children.length===3,'registration deduplicated');
      pane.style.left='99999px';pane.style.top='99999px';window.__kjdMoonDockV2.clamp(pane);const rect=pane.getBoundingClientRect();check(rect.right<=innerWidth&&rect.bottom<=innerHeight,'opening clamp');
      check(saved===localStorage.getItem('kim-pokemoon-autocatch-settings')+'|'+localStorage.getItem('pm-autorefill-kjd-v1'),'UI changed automation settings');check(window.__testActions===0,'unexpected action');
      return{icons,buttons:buttons.length,panes:panes.length};
    })()`);
    if(order===0){
      for(const id of ['autocatch','autorefill','bestiario']){
        await win.webContents.executeJavaScript(`document.querySelectorAll('[data-kjd-panel]').forEach(p=>p.hidden=true);document.querySelector('[data-kjd-button="${id}"]').click()`);
        await new Promise(r=>setTimeout(r,120));
        const visible=await win.webContents.executeJavaScript(`(()=>{const p=document.querySelector('[data-kjd-panel="${id}"]');const r=p.getBoundingClientRect();return {hidden:p.hidden,display:getComputedStyle(p).display,x:r.x,y:r.y,width:r.width,height:r.height}})()`);
        assert.equal(visible.hidden,false,'screenshot panel visible');console.log('Snapshot '+id+': '+JSON.stringify(visible));
        // Hidden windows may need one capture to submit their first compositor frame.
        await win.webContents.capturePage();await new Promise(r=>setTimeout(r,120));
        const png=await win.webContents.capturePage();fs.writeFileSync(path.join(evidence,id+'.png'),png.toPNG());
      }
    }
    win.setSize(420,340);await new Promise(r=>setTimeout(r,80));
    await win.webContents.executeJavaScript(`(()=>{window.dispatchEvent(new Event('resize'));const p=document.querySelector('[data-kjd-panel]:not([hidden])');const r=p.getBoundingClientRect();if(r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1)throw Error('Resize outside viewport');})()`);
    // Replay all scripts as if reinjected: guards must prevent duplicate panels/buttons.
    for(const file of files)await win.webContents.executeJavaScript(fs.readFileSync(path.join(root,file),'utf8'));
    const counts=await win.webContents.executeJavaScript(`({buttons:document.querySelectorAll('#kjd-moon-dock button').length,panes:document.querySelectorAll('[data-kjd-panel]').length,actions:window.__testActions})`);
    assert.deepEqual(counts,{buttons:3,panes:3,actions:0});console.log('PASS order '+orders[order].join(',')+': '+JSON.stringify(results));
  }
  assert.equal(remote.length,0,'remote image/resource requested');assert.deepEqual(pageErrors,[],'renderer errors');
  win.destroy();console.log('PASS: Electron '+process.versions.electron+', all 6 load orders, Canvas pixels, exclusive panels, close sync, deduplication, settings preservation, viewport limits, no external resources or actions.');
  server.close();app.quit();
})().catch(e=>{console.error(e);if(server)server.close();app.exit(1)});
