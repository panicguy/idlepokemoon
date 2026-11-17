// ==UserScript==
// @name         Poke Moon - Álbum Automático
// @namespace    local.pokemoon.album-auto
// @version      0.1.1
// @description  Abre pacotes acumulados em segundo plano. Lote padrão 10, configuração por conta.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(()=>{'use strict';if(window.__idleMoonAlbumAuto)return;window.__idleMoonAlbumAuto={starting:true};
  // BEGIN SHARED MOON DOCK — embedded in each standalone userscript.
  function moonDock() {
    if (window.__kjdMoonDockV2) return window.__kjdMoonDockV2;
    const entries = new Map();
    let dock = document.getElementById('kjd-moon-dock');
    if (!dock) {
      dock = document.createElement('nav'); dock.id = 'kjd-moon-dock';
      dock.setAttribute('aria-label', 'Automações Poke Moon'); document.body.appendChild(dock);
    }
    if (!document.getElementById('kjd-moon-dock-style')) {
      const css = document.createElement('style'); css.id = 'kjd-moon-dock-style';
      css.textContent = '#kjd-moon-dock{position:fixed;left:8px;top:50%;transform:translateY(-50%);z-index:2147483646;display:flex;flex-direction:column;gap:6px;padding:7px 5px;border:2px solid #785a28;border-radius:10px;background:#14100add;backdrop-filter:blur(4px);max-height:calc(100vh - 16px);overflow-y:auto;box-sizing:border-box}#kjd-moon-dock button{width:36px;height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:2px;border:1px solid transparent;border-radius:8px;background:transparent;cursor:pointer;font:23px system-ui;color:#ffe2a0}#kjd-moon-dock button:hover{background:#ffffff22}#kjd-moon-dock button.active{background:#d5aa4533;border-color:#d5aa45}#kjd-moon-dock canvas{width:29px;height:29px;object-fit:contain;image-rendering:pixelated;pointer-events:none}[data-kjd-panel]{box-sizing:border-box!important;max-width:calc(100vw - 16px)!important;max-height:calc(100vh - 16px)!important;overflow-y:auto!important}[data-kjd-panel][hidden]{display:none!important}#ipm-rota-best input{box-sizing:border-box;min-width:0}#ipm-rota-best label{min-width:0}';
      (document.head || document.documentElement).appendChild(css);
    }
    const foldKey = 'kjd-moon-dock-fold-v1';
    let folded = false, anchor = null, motion = 0, animations = [];
    try { const saved = JSON.parse(localStorage.getItem(foldKey) || '{}'); folded = saved.folded === true; if (Number.isFinite(saved.top)) anchor = saved.top; } catch (_) {}
    const foldStyle = document.createElement('style');
    foldStyle.textContent = '#kjd-moon-dock [data-dock-fold]{order:-1;position:sticky;top:0;z-index:2;background:#211d15;border-color:#806b3c;font-size:20px}#kjd-moon-dock [data-dock-fold]:focus-visible{outline:2px solid #ffe2a0;outline-offset:-2px}#kjd-moon-dock button[hidden]{display:none!important}#kjd-moon-dock.is-folding{overflow:hidden}#kjd-moon-dock [data-dock-chevron]{display:block;transition:transform .28s ease}#kjd-moon-dock.is-folded [data-dock-chevron]{transform:rotate(180deg)}@media(prefers-reduced-motion:reduce){#kjd-moon-dock [data-dock-chevron]{transition:none}}';
    (document.head || document.documentElement).appendChild(foldStyle);
    const foldButton = document.createElement('button');
    foldButton.type = 'button'; foldButton.dataset.dockFold = ''; foldButton.innerHTML = '<span data-dock-chevron aria-hidden="true">⌃</span>';
    dock.prepend(foldButton);
    function foldLabel() {
      foldButton.title = folded ? 'Expandir scripts' : 'Recolher scripts';
      foldButton.setAttribute('aria-label', foldButton.title); foldButton.setAttribute('aria-expanded', String(!folded));
      dock.classList.toggle('is-folded', folded);
    }
    function pin(top) {
      anchor = Math.max(8, Math.min(top, Math.max(8, innerHeight - dock.getBoundingClientRect().height - 8)));
      dock.style.top = anchor + 'px'; dock.style.transform = 'none';
    }
    async function setFolded(value, animate = true) {
      const turn = ++motion, start = dock.getBoundingClientRect();
      animations.forEach(a => a.cancel()); animations = [];
      folded = value === true; foldLabel();
      const buttons = [...entries.values()].map(e => e.button);
      if (folded) { document.querySelectorAll('[data-kjd-panel]').forEach(p => { p.hidden = true; }); sync(); }
      buttons.forEach(b => { b.hidden = false; b.inert = folded; });
      dock.style.height = 'auto';
      const endHeight = folded ? 54 : dock.getBoundingClientRect().height;
      dock.style.height = start.height + 'px';
      pin(Math.min(start.top, innerHeight - endHeight - 8));
      dock.classList.add('is-folding');
      const duration = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 320 : 0;
      if (duration) {
        const opts = {duration,easing:'cubic-bezier(.22,.7,.25,1)',fill:'both'};
        animations.push(dock.animate([{height:start.height+'px'},{height:endHeight+'px'}],opts));
        buttons.forEach((b,i) => {
          const hidden = {opacity:0,transform:'translateY(-'+Math.min(240,(i+1)*28)+'px)'}, shown = {opacity:1,transform:'translateY(0)'};
          animations.push(b.animate(folded ? [shown,hidden] : [hidden,shown],opts));
        });
        await Promise.race([Promise.allSettled(animations.map(a => a.finished)), new Promise(resolve => setTimeout(resolve, duration + 60))]);
      }
      if (turn !== motion) return;
      buttons.forEach(b => { b.hidden = folded; b.inert = folded; });
      dock.style.height = folded ? '54px' : 'auto';
      animations.forEach(a => a.cancel()); animations = [];
      dock.classList.remove('is-folding'); pin(anchor ?? start.top);
      try { localStorage.setItem(foldKey, JSON.stringify({folded,top:anchor})); } catch (_) {}
    }
    foldButton.onclick = () => { void setFolded(!folded); };
    // Drag the toggle itself; only a stationary click folds the dock.
    const positionKey = 'kjd-moon-dock-position-v1';
    let dockDrag = null, suppressClick = false;
    function placeDock(x, y) {
      dock.style.left = Math.max(8, Math.min(x, innerWidth - dock.getBoundingClientRect().width - 8)) + 'px';
      pin(y);
    }
    try {
      const p = JSON.parse(localStorage.getItem(positionKey) || 'null');
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) placeDock(p.x, p.y);
    } catch (_) {}
    foldButton.style.touchAction = 'none'; foldButton.style.cursor = 'grab';
    foldButton.addEventListener('click', e => {
      if (suppressClick) { e.preventDefault(); e.stopImmediatePropagation(); suppressClick = false; }
    }, true);
    foldButton.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const r = dock.getBoundingClientRect();
      dockDrag = {id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};
      suppressClick = false; foldButton.setPointerCapture(e.pointerId);
    });
    foldButton.addEventListener('pointermove', e => {
      if (!dockDrag || dockDrag.id !== e.pointerId) return;
      const dx=e.clientX-dockDrag.x, dy=e.clientY-dockDrag.y;
      if (!dockDrag.moved && Math.hypot(dx,dy)<5) return;
      dockDrag.moved=true; suppressClick=true; foldButton.style.cursor='grabbing';
      placeDock(dockDrag.left+dx,dockDrag.top+dy);
    });
    const finishDockDrag = e => {
      if (!dockDrag || dockDrag.id !== e.pointerId) return;
      if (dockDrag.moved) {
        const r=dock.getBoundingClientRect();
        try { localStorage.setItem(positionKey,JSON.stringify({x:r.left,y:r.top})); localStorage.setItem(foldKey,JSON.stringify({folded,top:anchor})); } catch (_) {}
      }
      dockDrag=null; foldButton.style.cursor='grab';
    };
    foldButton.addEventListener('pointerup',finishDockDrag);
    foldButton.addEventListener('pointercancel',finishDockDrag);
    foldButton.addEventListener('lostpointercapture',finishDockDrag);
    foldLabel();
    if (anchor !== null) pin(anchor);
    if (folded) dock.style.height = '54px';
    function clamp(pane, x, y) {
      if (pane.hidden) return;
      const rect = pane.getBoundingClientRect();
      pane.style.left = Math.max(8, Math.min(Number.isFinite(x) ? x : rect.left, innerWidth - rect.width - 8)) + 'px';
      pane.style.top = Math.max(8, Math.min(Number.isFinite(y) ? y : rect.top, innerHeight - rect.height - 8)) + 'px';
      pane.style.right = 'auto';
    }
    function sync() {
      for (const { pane, button } of entries.values()) {
        button.classList.toggle('active', !pane.hidden);
        button.setAttribute('aria-expanded', String(!pane.hidden));
      }
    }
    function register(id, label, image, pane) {
      let entry = entries.get(id);
      if (entry && entry.pane === pane) return entry.button;
      if (entry) { entry.observer.disconnect(); entry.button.remove(); }
      const button = document.createElement('button');
      button.type = 'button'; button.title = label; button.dataset.kjdButton = id;
      button.setAttribute('aria-label', label); button.setAttribute('aria-controls', pane.id);
      if (image && image.tagName === 'CANVAS') button.appendChild(image); else button.textContent = '🌙';
      pane.hidden = true; pane.dataset.kjdPanel = id;
      button.onclick = () => {
        const opening = pane.hidden;
        document.querySelectorAll('[data-kjd-panel]').forEach(p => { p.hidden = true; });
        pane.hidden = !opening;
        if (opening) clamp(pane);
        sync();
      };
      const observer = new MutationObserver(sync); observer.observe(pane, { attributes: true, attributeFilter: ['hidden'] });
      entries.set(id, { pane, button, observer }); dock.appendChild(button); sync();
      button.hidden = folded; button.inert = folded;
      for (const key of ['autocatch', 'autorefill', 'bestiario']) { const item = entries.get(key); if (item) dock.appendChild(item.button); }
      if (anchor !== null && !dock.classList.contains('is-folding')) pin(anchor);
      return button;
    }
    function drag(pane, handle, options = {}) {
      let active = null;
      const save = () => {
        const rect = pane.getBoundingClientRect(), position = { x: rect.left, y: rect.top };
        if (options.storageKey) { try { localStorage.setItem(options.storageKey, JSON.stringify(position)); } catch (_) {} }
        if (options.onSave) options.onSave(position);
      };
      let position = options.position;
      if (options.storageKey) { try { position = JSON.parse(localStorage.getItem(options.storageKey)); } catch (_) {} }
      if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
        pane.style.left = position.x + 'px'; pane.style.top = position.y + 'px'; pane.style.right = 'auto';
      }
      handle.style.touchAction = 'none';
      handle.addEventListener('pointerdown', e => {
        if (e.button !== 0 || e.target.closest('button, input, select, a')) return;
        const rect = pane.getBoundingClientRect(); active = { id: e.pointerId, dx: e.clientX - rect.left, dy: e.clientY - rect.top };
        handle.setPointerCapture(e.pointerId); e.preventDefault();
      });
      handle.addEventListener('pointermove', e => { if (active && active.id === e.pointerId) clamp(pane, e.clientX - active.dx, e.clientY - active.dy); });
      const stop = e => { if (!active || active.id !== e.pointerId) return; active = null; clamp(pane); save(); };
      handle.addEventListener('pointerup', stop); handle.addEventListener('pointercancel', stop); handle.addEventListener('lostpointercapture', stop);
    }
    window.addEventListener('resize', () => { for (const { pane } of entries.values()) clamp(pane); if (anchor !== null) placeDock(dock.getBoundingClientRect().left,anchor); });
    window.__kjdMoonDockV2 = { register, drag, clamp, sync };
    return window.__kjdMoonDockV2;
  }
  function moonPanelTheme() {
    if (document.getElementById('kjd-moon-panel-theme')) return;
    const css = document.createElement('style'); css.id = 'kjd-moon-panel-theme';
    css.textContent = `
      .moon-panel{position:fixed;top:145px;right:28px;z-index:99000;width:292px;box-sizing:border-box;overflow:hidden;background:linear-gradient(145deg,#182238,#101724 55%,#0b111e);border:1px solid #816e43;border-radius:10px;color:#e8edf6;font:12px/1.35 system-ui,"Segoe UI",sans-serif;box-shadow:0 2px 0 #3a3223 inset,0 12px 38px #000b}
      .moon-panel *{box-sizing:border-box}.moon-panel button{font:inherit;font-weight:750;cursor:pointer}.moon-panel .moon-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(#303342,#222838);border-bottom:1px solid #685936;cursor:move;user-select:none;touch-action:none}.moon-panel .moon-head canvas{width:22px!important;height:22px!important;object-fit:contain;image-rendering:pixelated;flex-shrink:0}.moon-panel .moon-title{font-size:12px;font-weight:850;color:#f4e4b8;letter-spacing:.2px;flex:1;min-width:0}.moon-panel .moon-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#64748b;margin-left:5px}.moon-panel.moon-active .moon-dot{background:#4cda93;box-shadow:0 0 6px #4cda93}.moon-panel .moon-head button{background:#111827;border:1px solid #4d556b;color:#e8edf6;border-radius:5px;min-width:23px;width:23px;height:23px;padding:0;font-size:16px;flex-shrink:0}.moon-panel .moon-head button:hover{background:#263349}
      .moon-panel .moon-body{padding:11px}.moon-panel.moon-collapsed .moon-body{display:none}.moon-panel .moon-state{padding:7px 9px;border:1px solid #31445c;background:#101c2a;border-radius:7px;color:#aebdd1;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px}.moon-panel.moon-active .moon-state{border-color:#326950;color:#8becbb}.moon-panel .moon-metrics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0}.moon-panel .moon-metric{padding:9px;border:1px solid #303c50;border-radius:7px;background:#101a2b;min-width:0}.moon-panel .moon-metric small{display:block;color:#8898ae;font-size:10px}.moon-panel .moon-metric strong{display:block;color:#ffdb78;font-size:19px;line-height:1.4;font-variant-numeric:tabular-nums}.moon-panel .moon-metric .moon-value-text{font-size:12px;line-height:1.5;padding-top:4px;overflow-wrap:anywhere}
      .moon-panel .moon-line{display:flex;justify-content:space-between;align-items:center;gap:7px;padding:7px 1px;border-top:1px solid #293346;color:#d2deed}.moon-panel input[type=number]{padding:5px;border:1px solid #485b77;border-radius:5px;color:#f7e9c8;background:#0d1727;outline:none;font:inherit}.moon-panel input[type=number]:focus{border-color:#d2ae5a;box-shadow:0 0 0 1px #d2ae5a55}.moon-panel .moon-line input[type=number]{width:84px;min-width:0}.moon-panel input[type=checkbox]{accent-color:#d2ae5a;width:16px;height:16px;flex-shrink:0}.moon-panel .moon-go,.moon-panel .moon-stop{width:100%;margin-top:9px;color:#eafff1;border:1px solid #59ad7c;border-radius:7px;padding:10px 8px;background:linear-gradient(#3a785b,#20593c)}.moon-panel .moon-go.active,.moon-panel .moon-stop{background:linear-gradient(#7a4549,#5b282f);border-color:#b76369;color:#ffe1e1}.moon-panel .moon-go:hover{filter:brightness(1.1)}.moon-panel button:disabled{opacity:.5;cursor:default}.moon-panel .moon-foot{font-size:10px;line-height:1.4;margin-top:8px;color:#8190a5;text-align:center}.moon-panel .moon-note{font-size:11px;line-height:1.5;margin:9px 0;color:#aebdd1}.moon-panel .moon-section{color:#f4e4b8;font-size:10px;font-weight:750;letter-spacing:.08em;margin:12px 0 5px}.moon-panel .moon-detail{white-space:pre-wrap;overflow-wrap:anywhere;margin-top:9px;padding:8px 9px;border:1px solid #31445c;border-radius:7px;background:#101c2a;color:#aebdd1;font-size:11px}
      .moon-panel,.moon-panel *{scrollbar-width:thin;scrollbar-color:#485b77 #101724}.moon-panel::-webkit-scrollbar,.moon-panel ::-webkit-scrollbar{width:6px;height:6px}.moon-panel::-webkit-scrollbar-thumb,.moon-panel ::-webkit-scrollbar-thumb{background:#485b77;border-radius:6px}.moon-panel::-webkit-scrollbar-track,.moon-panel ::-webkit-scrollbar-track{background:#101724}
      @media(max-width:500px){.moon-panel{top:85px;right:8px;width:270px}}
    `;
    (document.head || document.documentElement).appendChild(css);
  }
  function addMoonDockButton(id, label, image, pane) { return moonDock().register(id, label, image, pane); }
  // END SHARED MOON DOCK

const AA_ICON="data:image/png;base64,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";
function albumAmount(value){return Math.max(1,Math.min(999,Math.floor(Number(value)||10)));}
function albumPlan(boosters,amount,pending,max=10){
  amount=albumAmount(amount);max=Math.max(1,Math.min(10,Math.floor(Number(max)||10)));
  let key=pending?.key,remaining=pending?.remaining;
  if(!key||!Number.isInteger(remaining)||remaining<=0){key=Object.keys(boosters||{}).sort().find(k=>/^album:[a-z]+:(normal|especial)$/.test(k)&&Number(boosters[k])>=amount);remaining=amount;}
  if(!key||!/^album:[a-z]+:(normal|especial)$/.test(key))return null;
  const count=Math.max(0,Math.floor(Number(boosters[key])||0));
  if(!count)return null;
  return {key,remaining,qtd:Math.min(max,count,remaining)};
}

  const AA_KEY='pokemoon-album-auto-v1:';
  let aaOwner='',aaState=null,aaBusy=false,aaNext=0,aaPending=null,aaEpoch=0;
  const aaToken=()=>{try{return typeof q==='string'&&q?q:localStorage.getItem('pmi_token');}catch(_){return '';}};
  const aaPlayer=()=>{try{return String(K?.player?.id||K?.player?.name||'');}catch(_){return '';}};
  function aaSave(){if(aaOwner&&aaState)localStorage.setItem(AA_KEY+aaOwner,JSON.stringify(aaState));}
  function aaBind(){const owner=aaPlayer();if(owner===aaOwner)return;aaOwner=owner;aaEpoch++;aaPending=null;aaNext=0;let saved={};try{saved=JSON.parse(localStorage.getItem(AA_KEY+owner)||'{}')||{};}catch(_){}aaState={enabled:saved.enabled===true,amount:albumAmount(saved.amount),opened:Number(saved.opened)||0,logs:Array.isArray(saved.logs)?saved.logs.slice(-20):[]};aaRender();}
  function aaLog(text){if(aaState.logs.at(-1)?.text!==text)aaState.logs.push({at:Date.now(),text});aaState.logs=aaState.logs.slice(-20);aaSave();aaRender();}
  async function aaRequest(token,data){
    const url=new URL(data?'/api/album/abrir':'/api/album',location.origin);
    if(data&&(!/^album:[a-z]+:(normal|especial)$/.test(data.booster)||!Number.isInteger(data.qtd)||data.qtd<1||data.qtd>10))throw Error('Lote inválido.');
    if(!data)url.searchParams.set('token',token);
    const opts=data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,booster:data.booster,qtd:data.qtd})}:{method:'GET',cache:'no-store'};
    let r=await fetch(url,{...opts,signal:AbortSignal.timeout(20000)});
    if(r.status===421){const owner=r.headers.get('X-Pokeidle-Dono');if(/^\d+$/.test(owner||''))r=await fetch(url,{...opts,headers:{...opts.headers,'X-Pokeidle-P':owner},signal:AbortSignal.timeout(20000)});}
    const j=await r.json();if(!r.ok||j.err)throw Error(j.err||'HTTP '+r.status);return j;
  }
  moonPanelTheme();const aaPanel=document.createElement('section');aaPanel.id='pokemoon-album-auto';aaPanel.className='moon-panel';
  aaPanel.innerHTML='<div class="moon-head"><span>▣</span><span class="moon-title">Álbum Automático<span class="moon-dot"></span></span><button data-close title="Fechar">×</button></div><div class="moon-body"><div class="moon-state" data-mode>Desligado</div><p class="moon-note">Abre pacotes em segundo plano, sem sair da hunt. A quantidade vale para cada região e tipo (Normal ou Especial).</p><label class="moon-line">Juntar e abrir <input data-amount type="number" min="1" max="999" step="1" value="10"></label><button class="moon-go" data-toggle>Ligar automação</button><div class="moon-detail" data-status>Começa desligado. Padrão: 10 pacotes.</div><div class="moon-note" data-count></div><details><summary>Histórico</summary><div class="moon-detail" data-log style="max-height:180px;overflow:auto"></div></details><p class="moon-foot">Só abre pacotes da mochila. Não compra pacotes, não gasta dinheiro ou diamantes e não transforma cartas em pó. Lotes acima de 10 são divididos.</p></div>';
  document.body.appendChild(aaPanel);const aaEl=k=>aaPanel.querySelector('[data-'+k+']');
  const aaIcon=document.createElement('canvas');aaIcon.width=64;aaIcon.height=64;
  const ac=aaIcon.getContext('2d'),aaHeadIcon=aaIcon.cloneNode(),aaSprite=new Image();
  ac.imageSmoothingEnabled=false;
  aaSprite.onload=()=>{ac.clearRect(0,0,64,64);ac.drawImage(aaSprite,0,0,64,64);const ctx=aaHeadIcon.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(aaSprite,0,0,64,64);};
  aaSprite.src=AA_ICON;aaPanel.querySelector('.moon-head > span').replaceWith(aaHeadIcon);
  aaPanel.hidden=true;addMoonDockButton('album-auto','Álbum Automático',aaIcon,aaPanel);moonDock().drag(aaPanel,aaPanel.querySelector('.moon-head'),{storageKey:AA_KEY+'position'});
  aaEl('close').onclick=()=>{aaPanel.hidden=true;moonDock().sync();};
  function aaRender(){if(!aaState)return;aaPanel.classList.toggle('moon-active',aaState.enabled);aaEl('mode').textContent=aaState.enabled?'Ligado · abrindo em segundo plano':'Desligado';aaEl('toggle').textContent=aaState.enabled?'Desligar automação':'Ligar automação';aaEl('toggle').classList.toggle('active',aaState.enabled);aaEl('toggle').disabled=!aaOwner;aaEl('amount').disabled=aaBusy;if(document.activeElement!==aaEl('amount'))aaEl('amount').value=aaState.amount;aaEl('status').textContent=aaState.logs.at(-1)?.text||'Aguardando você ligar. Padrão: 10 pacotes.';aaEl('count').textContent=aaState.opened+' pacotes confirmados por esta automação.';aaEl('log').textContent=aaState.logs.slice().reverse().map(x=>new Date(x.at).toLocaleString('pt-BR')+' · '+x.text).join('\n')||'Nenhuma abertura registrada.';}
  aaEl('amount').onchange=()=>{aaBind();if(!aaState)return;aaState.amount=albumAmount(aaEl('amount').value);aaPending=null;aaNext=0;aaSave();aaRender();};
  aaEl('toggle').onclick=()=>{aaBind();if(!aaOwner)return;aaState.enabled=!aaState.enabled;aaPending=null;aaNext=0;aaSave();aaLog(aaState.enabled?'Ligado. Aguardando '+aaState.amount+' pacotes do mesmo tipo.':aaBusy?'Desligado. Uma abertura já enviada ainda pode ser concluída.':'Desligado manualmente.');if(aaState.enabled)void aaTick();};
  async function aaTick(){
    aaBind();if(aaBusy||!aaOwner||!aaState.enabled||Date.now()<aaNext)return;
    const token=aaToken(),owner=aaOwner,epoch=aaEpoch;if(!token)return;
    const same=()=>aaPlayer()===owner&&aaToken()===token&&aaEpoch===epoch;
    aaBusy=true;aaNext=Date.now()+30000;aaRender();
    try{
      const inventory=await aaRequest(token);if(!same()||!aaState.enabled)return;
      if(document.querySelector('#alb-jan')||document.querySelector('.alb-abrir-cena')){aaPending=null;return;}
      const plan=albumPlan(inventory.boosters||{},aaState.amount,aaPending);if(!plan){aaPending=null;aaLog('Aguardando '+aaState.amount+' pacotes do mesmo tipo.');return;}
      aaPending=plan;
      const result=await aaRequest(token,{booster:plan.key,qtd:plan.qtd});
      if(!same())return;
      const confirmed=Array.isArray(result.pacotes)?result.pacotes.length:0;
      if(confirmed!==plan.qtd)throw Error('Resposta incompleta. Vou reler o inventário antes de continuar.');
      aaState.opened+=confirmed;aaPending=aaState.enabled&&plan.remaining>confirmed?{key:plan.key,remaining:plan.remaining-confirmed}:null;
      aaNext=Date.now()+5000;aaLog('Abriu '+confirmed+' × '+plan.key.replace('album:','').replace(':',' · ')+'. Cartas e bônus registrados no servidor.');
    }catch(error){if(same()){aaPending=null;aaNext=Date.now()+60000;aaLog('Aguardando: '+error.message+' Vou reler o inventário em 1 minuto; não repetirei a abertura às cegas.');}}
    finally{aaBusy=false;aaBind();aaRender();}
  }
  aaBind();setInterval(()=>void aaTick(),5000);window.__idleMoonAlbumAuto={version:'0.1.1'};



})();
