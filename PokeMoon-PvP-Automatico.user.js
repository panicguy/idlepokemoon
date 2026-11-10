// ==UserScript==
// @name         Poke Moon - PvP Automático
// @namespace    local.pokemoon.pvp
// @version      0.1.0
// @description  Fila ranqueada, aceite e confirmação automática. Começa desligado por conta.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @idlemoon-ranked queue-v1
// ==/UserScript==

(()=>{'use strict';if(window.__idleMoonPvpAuto)return;
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
'use strict';
function pvpPlan(v,c={}){
 const p=v?.partida,side=p?.lado,owned=c.ownsQueue && (!c.matchId || String(c.matchId)===String(p?.id));
 if(!Number.isFinite(Number(v?.agora)))return {wait:'Aguardando horário do servidor.'};
 if(p?.modo==='duelo' || v?.fim?.modo==='duelo')return {wait:'Duelo fora da automação.',foreign:true};
 if(['aceitar','prep','jogando'].includes(v.fase)){
  if(!owned || p?.id==null || ![0,1].includes(side))return {wait:'Partida manual ou diferente da fila autorizada.',foreign:true};
  if(v.fase==='jogando')return {arena:true,wait:'Partida em andamento no cliente oficial.'};
  const flags=v.fase==='aceitar'?p.aceitos:p.confirmados;
  if(!Array.isArray(flags))return {wait:'Confirmações ainda não reconhecidas.'};
  if(flags[side])return {arena:v.fase==='prep',wait:v.fase==='aceitar'?'Aceite confirmado; aguardando oponente.':'Time confirmado; aguardando a luta.'};
  if(!Number.isFinite(Number(p.ate)) || Number(p.ate)<=Number(v.agora))return {wait:'Prazo vencido; relendo o estado do servidor.'};
  if(v.fase==='aceitar')return {op:'aceitar',body:{},key:p.id+':aceitar',wait:'Aceitando partida…'};
  const team=p.eu?.time;
  if(!Array.isArray(team)||!team.length||team.length>6||team.some(x=>typeof x!=='string'||!x))return {wait:'Time da partida não reconhecido.'};
  return {op:'confirmar',body:{ordem:team.slice(),perm:team.map((_,i)=>i)},key:p.id+':confirmar',arena:true,wait:'Confirmando a ordem original do time…'};
 }
 if(v.fase==='fila')return {wait:'Na fila; aguardando partida.'};
 if(v.fase==='fim')return c.ownsQueue?{op:'sair',body:{},key:'fim:'+c.matchId,wait:'Registrando resultado e continuando…'}:{wait:'Resultado de partida manual.'};
 if(v.fase!=='livre')return {wait:'Estado da ranqueada não reconhecido.'};
 if(!c.enabled||c.stopping)return {done:true,wait:'Desligada. Nenhuma nova fila será iniciada.'};
 if(v.req?.ok!==true)return {halt:true,wait:'Requisito de nível da ranqueada não atendido.'};
 if(!c.nativeReady || !c.teamMatches)return {halt:true,wait:'O time ou a cota mudou. Confira o Ginásio e inicie novamente.'};
 const t=c.team;
 if(!t?.nomes?.length || t.nomes.length>6 || !t.cota?.ok)return {halt:true,wait:'Escolha um time válido dentro da cota no Ginásio.'};
 if(c.maxMatches>0 && c.stats.matches>=c.maxMatches || c.maxLosses>0 && c.stats.losses>=c.maxLosses)return {done:true,wait:'Limite da sessão atingido. Nenhuma nova fila será iniciada.'};
 return {op:'entrar',body:{time:t.nomes.slice(),golpes:t.golpes||{},habs:t.habs||{}},key:'fila:'+c.session,wait:'Entrando na fila com o time aprovado…'};
}

  const PVP_KEY='pokemoon-pvp-auto-v1:';
  let pvpOwner='',pvpBusy=false,pvpStarting=false,pvpHubAt=0,pvpLastRead=0,pvpNext=0,pvpView=null,pvpNativeAt=0,pvpEpoch=0,pvpPhase='livre',pvpSignature='',pvpState=null;
  const pvpGame=()=>{try{return typeof K==='object'&&K?.player?K:null;}catch(_){return null;}};
  const pvpToken=()=>{try{return typeof q==='string'&&q?q:localStorage.getItem('pmi_token');}catch(_){return null;}};
  const pvpEmpty=()=>({enabled:false,stopping:false,ownsQueue:false,matchId:null,team:null,session:'',maxMatches:0,maxLosses:0,stats:{matches:0,wins:0,losses:0,pdl:0},history:[],seen:[],logs:[]});
  function pvpSave(){if(pvpOwner&&pvpState)try{localStorage.setItem(PVP_KEY+pvpOwner,JSON.stringify(pvpState));}catch(_){}}
  function pvpBind(){const p=pvpGame()?.player,id=p&&String(p.id||p.name||p.nome||'');if(!id)return false;if(id===pvpOwner)return true;pvpOwner=id;pvpEpoch++;pvpLastRead=0;pvpNext=0;pvpView=null;pvpPhase='livre';let saved={};try{saved=JSON.parse(localStorage.getItem(PVP_KEY+id)||'{}')||{};}catch(_){}pvpState={...pvpEmpty(),...saved};pvpState.stats={matches:0,wins:0,losses:0,pdl:0,...saved.stats};for(const k of ['history','seen','logs'])if(!Array.isArray(pvpState[k]))pvpState[k]=[];return true;}
  const pvpActive=()=>!!(pvpStarting||pvpState?.enabled||pvpState?.ownsQueue||pvpState?.stopping);
  function pvpLog(message){if(!pvpState||!message||pvpState.logs.at(-1)?.message===message)return;pvpState.logs.push({at:Date.now(),message});pvpState.logs=pvpState.logs.slice(-30);pvpSave();pvpRender();}
  function pvpTeam(){const t=window.GINASIO_MENU?.timeInfo?.(),quota=window.GINASIO_MENU?.cota?.();if(!t||!Array.isArray(t.nomes)||!t.nomes.length||t.nomes.length>6||t.nomes.some(x=>typeof x!=='string'||!x))return null;return JSON.parse(JSON.stringify({nomes:t.nomes,golpes:t.golpes||{},habs:t.habs||{},cota:{ok:quota?.ok===true}}));}
  const pvpTeamSig=t=>JSON.stringify(t?{nomes:t.nomes,golpes:t.golpes,habs:t.habs}:null);
  function pvpHubReady(){return Date.now()-pvpHubAt<3500;}
  const pvpPanel=document.createElement('section');pvpPanel.id='pokemoon-pvp-auto';pvpPanel.className='moon-panel';moonPanelTheme();
  pvpPanel.innerHTML='<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">PvP Automático<span class="moon-dot"></span></span><button data-close title="Fechar painel">×</button></div><div class="moon-body"><div class="moon-state"><span data-mode>Desligado</span><span data-phase>Conectando…</span></div><div class="moon-note">Usa o time salvo no Ginásio, na ordem atual. Aceita, confirma e repete a fila ranqueada.</div><div class="moon-detail" data-team>Abra o Ginásio e configure seu time.</div><label class="moon-line">Partidas na sessão · 0 sem limite<input data-matches type="number" min="0" max="1000" value="0"></label><label class="moon-line">Derrotas na sessão · 0 sem limite<input data-losses type="number" min="0" max="1000" value="0"></label><button class="moon-go" data-start>Iniciar fila automática</button><button class="moon-stop" data-stop>Parar após a partida</button><button class="pvp-secondary" data-gym>Abrir Ginásio / Ranqueada</button><div class="moon-detail" data-stats>0 partidas · 0V / 0D · 0 PdL</div><div class="moon-detail" role="status" data-status>A automação começa desligada por personagem.</div><details><summary>Histórico da sessão e partidas</summary><div data-history></div></details><div class="moon-foot">Confirma apenas partidas iniciadas por esta automação. Sem duelos, apostas ou desistência. Segue a fila normal, inclusive BOT.<br>Enquanto ativo, o Hub mantém a conta carregada. Parar conclui a fila/partida já iniciada e impede novas buscas.<br>Conexão ou PC interrompidos ainda podem causar penalidade.</div></div>';
  function pvpIcon(){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle='#263650';g.fillRect(2,2,28,28);g.strokeStyle='#d9e5ff';g.lineWidth=3;g.beginPath();g.moveTo(7,6);g.lineTo(25,25);g.moveTo(25,6);g.lineTo(7,25);g.stroke();g.strokeStyle='#efc66b';g.lineWidth=2;g.beginPath();g.moveTo(4,21);g.lineTo(11,28);g.moveTo(21,28);g.lineTo(28,21);g.stroke();return c;}
  pvpPanel.querySelector('[data-icon]').replaceWith(pvpIcon());document.body.appendChild(pvpPanel);addMoonDockButton('pvp','PvP Automático — Ranqueada',pvpIcon(),pvpPanel);moonDock().drag(pvpPanel,pvpPanel.querySelector('[data-handle]'),{storageKey:'pokemoon-pvp-auto-position-v1'});const pvpEl=k=>pvpPanel.querySelector('[data-'+k+']');pvpEl('close').onclick=()=>{pvpPanel.hidden=true;moonDock().sync();};
  const pvpCss=document.createElement('style');pvpCss.textContent='#pokemoon-pvp-auto{width:350px}#pokemoon-pvp-auto input{width:64px;background:#101c2a;color:#f7e9c8;border:1px solid #485b77;border-radius:5px;padding:4px}#pokemoon-pvp-auto .pvp-secondary{width:100%;padding:7px;border:1px solid #485b77;background:#15243a;color:#e8e0cd;border-radius:6px;margin-top:7px}#pokemoon-pvp-auto [data-status]{min-height:60px;white-space:pre-wrap}#pokemoon-pvp-auto [data-history]{max-height:180px;overflow:auto;white-space:pre-wrap;font-size:10px}';document.head.appendChild(pvpCss);
  function pvpRender(){if(!pvpState)return;const active=pvpActive();pvpPanel.classList.toggle('moon-active',active);pvpEl('mode').textContent=pvpStarting?'Preparando…':pvpState.stopping?'Parando após a partida':pvpState.enabled?'Ligado':'Desligado';pvpEl('phase').textContent=({livre:'Livre',fila:'Na fila',aceitar:'Aceitar partida',prep:'Preparação',jogando:'Em combate',fim:'Resultado'})[pvpPhase]||pvpPhase;if(['aceitar','prep'].includes(pvpPhase)&&pvpView?.partida?.ate){const left=Math.max(0,Math.ceil((Number(pvpView.partida.ate)-Number(pvpView.agora)-(Date.now()-pvpLastRead))/1000));pvpEl('phase').textContent+=' · '+left+'s';}pvpEl('team').textContent=pvpState.team?.nomes?.join(' → ')||'Abra o Ginásio e configure seu time.';pvpEl('start').disabled=active||!pvpHubReady();pvpEl('stop').disabled=!active||pvpState.stopping;for(const k of ['matches','losses']){pvpEl(k).disabled=active;if(document.activeElement!==pvpEl(k))pvpEl(k).value=pvpState[k==='matches'?'maxMatches':'maxLosses'];}const st=pvpState.stats;pvpEl('stats').textContent=st.matches+' partidas · '+st.wins+'V / '+st.losses+'D · '+(st.pdl>0?'+':'')+st.pdl+' PdL';pvpEl('status').textContent=pvpState.logs.at(-1)?.message||(!pvpHubReady()?'Reabra o Hub atualizado para habilitar a proteção da fila.':'A automação começa desligada por personagem.');const sig=JSON.stringify(pvpState.history);if(sig!==pvpSignature){pvpSignature=sig;pvpEl('history').textContent=pvpState.history.slice(-20).reverse().map(h=>new Date(h.at).toLocaleString('pt-BR')+' · '+h.result+' · '+(h.pdl>0?'+':'')+h.pdl+' PdL · '+h.score).join('\n')||'Nenhuma partida automática registrada.';}}
  async function pvpOpen(){if(typeof window.GINASIO_MENU?.abre!=='function')throw Error('O menu Ginásio ainda não está carregado.');await window.GINASIO_MENU.abre('ranqueada');}
  function pvpEnsureArena(){const body=document.querySelector('.rq-corpo[data-fase="jogando"],.rq-corpo[data-fase="prep"]');const visible=body && body.getClientRects().length>0;if(visible && (pvpPhase!=='jogando'||body.querySelector('iframe')))return;if(Date.now()-pvpNativeAt<2000)return;pvpNativeAt=Date.now();void pvpOpen().catch(e=>pvpLog('Arena: '+e.message));}
  function pvpAdopt(v){if(!v||typeof v.fase!=='string')throw Error('Resposta da ranqueada não reconhecida.');pvpView=v;pvpPhase=v.fase;if(pvpState?.ownsQueue && v.partida?.id!=null && !pvpState.matchId && v.partida.modo!=='duelo'){pvpState.matchId=String(v.partida.id);pvpSave();}try{window.RANQUEADA?.push?.(v);}catch(_){}pvpRender();return v;}
  async function pvpRequest(op,body,ticket){if(ticket!==pvpEpoch)throw Error('Personagem alterado.');const tk=pvpToken();if(!tk)throw Error('Sessão do jogo indisponível.');let url='/api/rq/estado?token='+encodeURIComponent(tk),opts={cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(5000)};if(op){if(!['entrar','aceitar','confirmar','sair'].includes(op))throw Error('Ação PvP não permitida.');if(op==='sair' && pvpView?.fase!=='fim')throw Error('O script não sai de partidas em andamento.');url='/api/rq/'+op;opts={...opts,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tk,...body})};}const res=await fetch(url,opts),data=await res.json();if(ticket!==pvpEpoch)throw Error('Personagem alterado.');if(!res.ok || data.err)throw Error(data.err||'Ranqueada: HTTP '+res.status);pvpLastRead=Date.now();return pvpAdopt(data);}
  function pvpRecord(v){const f=v.fim;if(!f || !pvpState.ownsQueue)return;const key=pvpState.matchId||JSON.stringify([f.vs,f.res,f.placar,f.motivo]);if(pvpState.seen.includes(key))return;pvpState.seen.push(key);pvpState.seen=pvpState.seen.slice(-100);const h={at:Date.now(),match:key,result:f.res==='V'?'Vitória':f.res==='D'?'Derrota':'Anulada',pdl:Number(f.dPdl)||0,score:Array.isArray(f.placar)?f.placar.join(':'):'-',vs:f.vs};pvpState.history.push(h);pvpState.history=pvpState.history.slice(-100);pvpState.stats.matches++;if(f.res==='V')pvpState.stats.wins++;if(f.res==='D')pvpState.stats.losses++;pvpState.stats.pdl+=h.pdl;pvpSave();pvpLog(h.result+' · '+(h.pdl>0?'+':'')+h.pdl+' PdL.');}
  async function pvpTick(force=false){if(!pvpBind()||pvpBusy||pvpStarting)return;pvpRender();if(!pvpActive() && pvpPanel.hidden)return;if(!pvpHubReady())return;if(Date.now()<pvpNext || !force && Date.now()-pvpLastRead<(pvpActive()?1000:5000))return;pvpBusy=true;const ticket=pvpEpoch;try{const v=await pvpRequest(null,null,ticket);if(ticket!==pvpEpoch)return;if(v.fase==='livre' && pvpState.ownsQueue){pvpState.ownsQueue=false;pvpState.matchId=null;pvpSave();}const current=pvpTeam(),plan=pvpPlan(v,{...pvpState,nativeReady:!!current?.cota?.ok,teamMatches:!!current && pvpTeamSig(current)===pvpTeamSig(pvpState.team)});if(plan.foreign){pvpState.enabled=false;pvpState.stopping=false;pvpState.ownsQueue=false;pvpSave();pvpLog(plan.wait);return;}if(plan.arena)pvpEnsureArena();if(plan.done||plan.halt){pvpState.enabled=false;pvpState.stopping=false;pvpState.ownsQueue=false;pvpSave();pvpLog(plan.wait);return;}if(!plan.op){pvpLog(plan.wait);return;}if(plan.op==='entrar'){if(!pvpHubReady())return;pvpState.ownsQueue=true;pvpState.matchId=null;pvpSave();}if(plan.op==='sair')pvpRecord(v);pvpLog(plan.wait);const next=await pvpRequest(plan.op,plan.body,ticket);if(plan.op==='sair'&&next.fase==='livre'){pvpState.ownsQueue=false;pvpState.matchId=null;pvpSave();}if(next.fase==='prep'||next.fase==='jogando')pvpEnsureArena();pvpNext=Date.now()+250;pvpLog(plan.op==='entrar'?'Fila iniciada. Monitorando aceite.':plan.op==='aceitar'?'Aceite enviado; conferindo confirmação.':plan.op==='confirmar'?'Time enviado; aguardando a arena oficial.':'Resultado registrado.');}catch(e){if(ticket===pvpEpoch){pvpNext=Date.now()+1000;pvpLog('Aguardando conexão/servidor: '+e.message+'. Releitura antes de repetir.');}}finally{pvpBusy=false;pvpRender();}}
  pvpEl('gym').onclick=()=>void pvpOpen().catch(e=>pvpLog(e.message));
  pvpEl('start').onclick=async()=>{if(!pvpBind()||pvpActive()||pvpBusy)return;if(!pvpHubReady()){pvpLog('Reabra o Hub atualizado antes de iniciar.');return;}const limit=k=>{const n=Number(pvpEl(k).value);if(!Number.isInteger(n)||n<0||n>1000)throw Error('Use limites inteiros entre 0 e 1000.');return n;};pvpStarting=true;pvpRender();const ticket=pvpEpoch;try{const maxMatches=limit('matches'),maxLosses=limit('losses');await pvpOpen();const until=Date.now()+12000;let team;while(!(team=pvpTeam())&&Date.now()<until){await new Promise(r=>setTimeout(r,200));if(ticket!==pvpEpoch||!pvpStarting)throw Error('Início cancelado.');}if(!team?.cota?.ok)throw Error('Monte um time dentro da cota no Ginásio.');const v=await pvpRequest(null,null,ticket);if(!pvpStarting || ticket!==pvpEpoch)return;if(!['livre','fim'].includes(v.fase)||v.fim?.modo==='duelo')throw Error('Há fila ou partida manual em andamento. Resolva pelo Ginásio antes de iniciar.');if(v.req?.ok!==true)throw Error('Nível da ranqueada não liberado.');if(v.fase==='fim')await pvpRequest('sair',{},ticket);Object.assign(pvpState,{enabled:true,stopping:false,ownsQueue:false,matchId:null,team,session:String(Date.now()),maxMatches,maxLosses,stats:{matches:0,wins:0,losses:0,pdl:0}});pvpSave();pvpNext=0;pvpLog('Time aprovado. Iniciando fila automática.');}catch(e){pvpState.enabled=false;pvpSave();pvpLog(e.message);}finally{pvpStarting=false;pvpRender();void pvpTick(true);}};
  pvpEl('stop').onclick=()=>{if(!pvpBind())return;pvpStarting=false;pvpState.enabled=false;pvpState.stopping=pvpState.ownsQueue===true;pvpSave();pvpNext=0;pvpLog(pvpState.stopping?'Parada solicitada: concluindo a fila/partida já iniciada.':'Desligado. Nenhuma nova fila.');void pvpTick(true);};
  for(const [key,field]of [['matches','maxMatches'],['losses','maxLosses']])pvpEl(key).onchange=()=>{if(pvpActive())return;const n=Number(pvpEl(key).value);if(Number.isInteger(n)&&n>=0&&n<=1000){pvpState[field]=n;pvpSave();}};
  window.__idleMoonPvpAuto={hubPulse(){pvpHubAt=Date.now();pvpBind();void pvpTick();return {active:pvpActive(),owner:pvpOwner,phase:pvpPhase};},status(){return {active:pvpActive(),owner:pvpOwner,phase:pvpPhase};}};
  if(typeof window.IPM_ON_STATE==='function')window.IPM_ON_STATE(()=>{pvpBind();void pvpTick();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)void pvpTick(true);});setInterval(()=>{pvpBind();pvpRender();void pvpTick();},1000);pvpBind();pvpRender();

})();
