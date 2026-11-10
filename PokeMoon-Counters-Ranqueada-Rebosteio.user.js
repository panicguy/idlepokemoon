// ==UserScript==
// @name         Poke Moon Mapeamento de Hunts by time Rebosteio
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      0.2.0
// @description  Mapeia hunts por tier e level mínimos durante 15 minutos cada, com XP/h, kills/h e loot/h reais e histórico lateral.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==
(() => {
'use strict';if(window.__rebosteioCounterRankers)return;window.__rebosteioCounterRankers=true;
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
// BEGIN HUNT MAPPER CORE

// Shared selection rules for measured and simulated hunt reports.
const TIERS = ['C', 'B', 'A', 'S', 'SR', 'SSR', 'UR', 'LR', 'PRISMA'];
const normalize = value => String(value ?? '').trim().toUpperCase().replace(/\+$/, '');
function selectHunts(zones, tier, level) {
  const minimum = TIERS.indexOf(normalize(tier));
  const floor = Number(String(level).trim().replace(/\+$/, ''));
  if (minimum < 0) throw Error('Tier mínimo inválido.');
  if (!Number.isSafeInteger(floor) || floor < 1) throw Error('Level mínimo inválido.');
  return zones.filter(zone => {
    const rank = TIERS.indexOf(normalize(zone.tier));
    const required = Number(zone.lv ?? zone.level);
    return rank >= minimum && Number.isFinite(required) && required >= floor;
  });
}
function hourly(total, milliseconds) {
  if (!Number.isFinite(total) || total < 0 || !Number.isFinite(milliseconds) || milliseconds <= 0) return null;
  return total * 3600000 / milliseconds;
}
function snapshot(hunt) {
  if (!hunt || !Number.isFinite(hunt.secs) || !Number.isFinite(hunt.xp) || !Number.isFinite(hunt.kills)) throw Error('Dados da Análise de Hunt indisponíveis.');
  const loot = Number.isFinite(hunt.lootGold) ? hunt.lootGold : (hunt.loot || []).reduce((sum, item) => sum + Number(item.gold || 0), 0);
  return { epoch: hunt.t0real ?? hunt.t0, secs: hunt.secs, xp: hunt.xp, kills: hunt.kills, loot };
}
function measurement(before, after) {
  const seconds = after.secs - before.secs;
  if (before.epoch !== after.epoch || seconds < 0 || ['xp','kills','loot'].some(k => after[k] < before[k])) throw Error('A Análise de Hunt foi reiniciada. Recomece esta hunt.');
  return { seconds, xp: after.xp-before.xp, kills: after.kills-before.kills, loot: after.loot-before.loot,
    xpH: hourly(after.xp-before.xp, seconds*1000), killsH: hourly(after.kills-before.kills, seconds*1000), lootH: hourly(after.loot-before.loot, seconds*1000) };
}


// END HUNT MAPPER CORE
const BASE='rebosteio-hunt-mapper-v1';
const state=()=>{try{return typeof K==='object'&&K?.player?K:window.IPM_ESTADO?.()}catch(_){return window.IPM_ESTADO?.()}};
const token=()=>{try{return typeof q==='string'?q:''}catch(_){return ''}};
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch(_){return fallback}};
const fmt=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{maximumFractionDigits:0});
const node=(tag,text)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;return el;};
let owner='',settings={tier:'S',level:200},report=[],queue=[],cursor=0,running=false,busy=false,epoch=0,baseline=null,context=null,lastStateAt=Date.now(),status='Pronto para montar o mapeamento.',historyOpen=true,preview=[];
const panel=node('section');panel.id='rebosteio-hunt-mapper';panel.className='moon-panel';moonPanelTheme();
panel.innerHTML=`<div class="moon-head"><span class="moon-title">Mapeamento de Hunts<span class="moon-dot"></span></span><button data-history title="Resultados laterais">☷</button><button data-minimize title="Minimizar">−</button><button data-close title="Fechar">×</button></div><div class="moon-body"><div class="moon-state"><span>15 min por hunt</span><span>REBOSTEIO</span></div><label class="moon-line">Tier mínimo<select data-tier>${TIERS.map(t=>'<option value="'+t+'">'+t+'+</option>').join('')}</select></label><label class="moon-line">Level mínimo<input data-level type="number" min="1" max="100000" step="1" value="200"></label><div class="moon-note">S+ inclui S e superiores. Level 200+ inclui hunts de nível 200 em diante, até o nível da conta e nas hunts liberadas.</div><button data-preview class="moon-go">Consultar hunts do filtro</button><div data-plan class="moon-note"></div><button data-start class="moon-go">Iniciar mapeamento</button><button data-stop class="moon-stop">Pausar</button><div data-status class="moon-detail" role="status"></div><div class="moon-foot">15 minutos de caça ao vivo por hunt. XP/h, kills/h e loot/h usam os contadores da Análise de Hunt. Loot é o valor dos drops, sem descontar supply.</div></div>`;
document.body.append(panel);const $=k=>panel.querySelector('[data-'+k+']');
const history=node('section');history.id='rebosteio-hunt-history';history.className='moon-panel';history.dataset.kjdPanel='hunt-map-history';history.hidden=true;
history.innerHTML='<div class="moon-head"><span class="moon-title">Histórico de Hunts</span><button data-history-close title="Fechar histórico">×</button></div><div class="hunt-history-tools"><select data-sort><option value="at">Mais recentes</option><option value="xpH">XP/h</option><option value="killsH">Kills/h</option><option value="lootH">Loot/h</option></select><button data-export>Exportar CSV</button></div><div class="moon-note hunt-history-note">Resultados reais por conta · 15 min de caça ao vivo</div><div data-list></div>';
document.body.append(history);const list=history.querySelector('[data-list]');
const css=node('style');css.textContent='#rebosteio-hunt-mapper{width:330px}#rebosteio-hunt-history{width:350px;height:min(600px,calc(100vh - 16px));display:flex;flex-direction:column;z-index:2147483647}#rebosteio-hunt-history[hidden]{display:none!important}#rebosteio-hunt-history [data-list]{overflow:auto;flex:1;min-height:60px;padding:0 12px 12px}.hunt-history-tools{display:flex;gap:8px;padding:10px}.hunt-history-tools>*{flex:1;min-width:0}.hunt-history-note{padding:0 12px}.hunt-history-row{border-bottom:1px solid #31445c;padding:12px 0}.hunt-history-row strong{color:#9be4ff}.hunt-history-row small{display:block;color:#a8bacf;font-size:10px;margin:5px 0}.hunt-history-values{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.hunt-history-values span{background:#101a2b;border:1px solid #31445c;border-radius:6px;padding:7px 4px;color:#ffdb78;font-weight:750;text-align:center;overflow-wrap:anywhere}.hunt-history-values small{font-weight:400}#rebosteio-hunt-mapper select,.hunt-history-tools select,.hunt-history-tools button{background:#0d1727;color:#f6e8c5;border:1px solid #485b77;border-radius:5px;padding:5px;font:inherit}';document.head.append(css);
const icon=node('canvas');icon.width=24;icon.height=24;const ctx=icon.getContext('2d');ctx.font='21px sans-serif';ctx.fillText('📊',0,21);
addMoonDockButton('counters','Mapeamento de Hunts',icon,panel);moonDock().drag(panel,panel.querySelector('.moon-head'),{storageKey:BASE+':position'});
function syncHistory(){const open=historyOpen&&!panel.hidden;history.hidden=!open;$('history').setAttribute('aria-expanded',String(open));if(!open)return;const r=panel.getBoundingClientRect(),w=Math.min(350,innerWidth-16);history.style.width=w+'px';history.style.left=Math.max(8,Math.min(r.right+w+8<=innerWidth?r.right+8:r.left-w-8,innerWidth-w-8))+'px';history.style.top=Math.max(8,Math.min(r.top,innerHeight-Math.min(600,innerHeight-16)-8))+'px';history.style.right='auto';history.style.maxHeight=(innerHeight-parseFloat(history.style.top)-8)+'px';}
function save(){if(owner)localStorage.setItem(BASE+':'+owner,JSON.stringify({settings,report,historyOpen}));}
function draw(){const top=list.scrollTop;list.replaceChildren();const by=history.querySelector('[data-sort]').value;const rows=[...report].sort((a,b)=>Number(b[by])-Number(a[by]));if(!rows.length)list.append(node('p','Nenhuma hunt mapeada ainda.'));for(const row of rows){const card=node('div');card.className='hunt-history-row';card.append(node('strong',row.zone.name+' · '+row.zone.tier+' · Lv '+row.zone.lv),node('small',row.account+' · '+new Date(row.at).toLocaleString('pt-BR')),node('small',row.pokemon+' · '+(row.furiosa?'Furiosa':'Padrão')+' · '+(row.seconds/60).toFixed(1)+' min'));const values=node('div');values.className='hunt-history-values';for(const [label,key]of [['XP/h','xpH'],['Kills/h','killsH'],['Loot/h','lootH']]){const value=node('span',fmt(row[key]));value.append(node('small',label));values.append(value);}card.append(values,node('small','Total: '+fmt(row.xp)+' XP · '+fmt(row.kills)+' kills · $ '+fmt(row.loot)+' loot'));list.append(card);}list.scrollTop=top;}
function bind(){const next=String(state()?.player?.id||state()?.player?.name||'');if(next===owner)return !!next;epoch++;running=false;baseline=null;queue=[];cursor=0;preview=[];owner=next;const saved=load(BASE+':'+owner,{});settings={tier:'S',level:200,...saved.settings};report=Array.isArray(saved.report)?saved.report:[];historyOpen=saved.historyOpen!==false;$('tier').value=settings.tier;$('level').value=settings.level;status='Pronto. Resultados anteriores preservados.';draw();return !!next;}
function render(){bind();$('status').textContent=status;$('start').disabled=busy||running||!owner;$('preview').disabled=busy||running||!owner;$('stop').disabled=!running;$('tier').disabled=busy||running;$('level').disabled=busy||running;panel.classList.toggle('moon-active',running);syncHistory();}
function stop(message){epoch++;running=false;baseline=null;status=message;render();}
function safety(){const s=state();if(!s?.player||!s.active||s.fainted||!(s.active.hp>0))throw Error('Sem Pokémon ativo disponível para caçar.');if(!s.auto?.hunt)throw Error('Ative a caça no Auto-Helper.');if(window.__ipmProfessionGatherLease)throw Error('Aguarde a coleta de profissão terminar.');for(const id of ['kjd-rota-shiny','kjd-rota-evolutiva','rebosteio-rota-quests','ipm-rota-best']){const p=document.getElementById(id);if(p?.classList.contains('moon-active'))throw Error('Pause as outras rotas antes de mapear.');}return s;}
function fingerprint(s){return JSON.stringify([s.active?.id,s.active?.tmArea||'',s.team?.map(p=>p.id)]);}
function zoneOf(s){return s?.inst?.zona??s?.zone?.index;}
function matches(s,z){return zoneOf(s)===z.index&&(s.inst?.furiosa===true)===context.furiosa;}
async function readHunts(){const res=await fetch('/api/hunts?token='+encodeURIComponent(token()),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});const data=await res.json();if(!res.ok||data.err||!Array.isArray(data.zonas))throw Error(data.err||'Não foi possível ler as hunts.');return data.zonas;}
function readSettings(){const tier=$('tier').value,level=Number($('level').value);selectHunts([],tier,level);settings={tier,level};save();}
async function plan(){readSettings();if(typeof window.IPM_HUNTS?.liberadas!=='function')throw Error('Interface de hunts ainda indisponível.');const id=epoch,who=owner;const [zones,unlocked]=await Promise.all([readHunts(),window.IPM_HUNTS.liberadas()]);if(id!==epoch||who!==String(state()?.player?.id||state()?.player?.name||''))throw Error('Conta alterada. Consulte novamente.');if(!(unlocked instanceof Set))throw Error('Não foi possível validar hunts liberadas.');const allowed=new Set([...unlocked].map(norm));preview=selectHunts(zones,settings.tier,settings.level).map(z=>({index:z.i,name:z.n,base:norm(z.b||z.esp),lv:Number(z.lv),tier:z.tier})).filter(z=>Number.isInteger(z.index)&&z.lv<=state().player.level&&allowed.has(z.base)).sort((a,b)=>TIERS.indexOf(a.tier)-TIERS.indexOf(b.tier)||a.lv-b.lv||a.index-b.index);$('plan').textContent=preview.length+' hunts · cerca de '+fmt(preview.length*15)+' minutos, mais viagens.\n'+preview.map(z=>z.name+' ('+z.tier+', '+z.lv+')').join(' · ');return preview;}
async function travel(z,id){if(!matches(state(),z)){const res=await fetch('/api/action',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({token:token(),action:'selectZone',index:z.index,furiosa:context.furiosa,confirmo:false,naoPerguntar:false})});const data=await res.json();if(id!==epoch||!running)return;if(!res.ok||data.err||data.precisaConfirmar)throw Error(data.err||'Viagem requer confirmação no jogo.');if(data.state&&typeof handleStateUpdate==='function')handleStateUpdate(data.state);}if(id!==epoch||!running)return;if(!matches(state(),z))throw Error('Chegada à hunt não confirmada.');baseline=snapshot(state().hunt);status='Mapeando '+z.name+' · 0:00 / 15:00 · '+(cursor+1)+'/'+queue.length;}
async function tick(){bind();if(!running||busy)return;busy=true;const id=epoch;try{const s=safety();if(Date.now()-lastStateAt>60000)throw Error('Sem atualização do jogo. Recomece a hunt atual ao retomar.');if(context.fingerprint!==fingerprint(s))throw Error('Pokémon ou time alterado. Inicie novo mapeamento.');if(!baseline){await travel(queue[cursor],id);return;}if(!matches(s,queue[cursor]))throw Error('Hunt ou modo alterado fora do mapeamento.');const sample=measurement(baseline,snapshot(s.hunt));const remaining=Math.max(0,900-sample.seconds);status='Mapeando '+queue[cursor].name+' · faltam '+Math.floor(remaining/60)+':'+String(Math.floor(remaining%60)).padStart(2,'0')+' · '+(cursor+1)+'/'+queue.length+'\n'+fmt(sample.xpH)+' XP/h · '+fmt(sample.killsH)+' kills/h · $ '+fmt(sample.lootH)+' loot/h';if(sample.seconds>=900){report.push({...sample,at:Date.now(),zone:queue[cursor],account:context.account,pokemon:context.pokemon,furiosa:context.furiosa});save();draw();cursor++;baseline=null;if(cursor>=queue.length){stop('Mapeamento concluído: '+queue.length+' hunts. Resultados no painel lateral.');return;}status='Resultado salvo. Preparando '+queue[cursor].name+'…';}}catch(e){if(id===epoch)stop(e.message);}finally{busy=false;render();}}
$('preview').onclick=async()=>{if(busy||running)return;busy=true;try{bind();await plan();status='Filtro consultado. Pronto para iniciar.';}catch(e){status=e.message;}finally{busy=false;render();}};
$('start').onclick=async()=>{if(busy||running)return;busy=true;try{bind();const s=safety();snapshot(s.hunt);queue=[...await plan()];if(!queue.length)throw Error('Nenhuma hunt liberada corresponde ao filtro.');context={fingerprint:fingerprint(s),account:String(s.player.name||s.player.id),pokemon:s.active.name||s.active.base||'Pokémon ativo',furiosa:!!s.active.tmArea};cursor=0;baseline=null;running=true;epoch++;lastStateAt=Date.now();status='Iniciando mapeamento…';}catch(e){status=e.message;}finally{busy=false;render();void tick();}};
$('stop').onclick=()=>stop('Mapeamento pausado. Hunts concluídas preservadas; a amostra incompleta foi descartada.');
$('close').onclick=()=>{panel.hidden=true;syncHistory();moonDock().sync();};$('minimize').onclick=()=>{panel.classList.toggle('moon-collapsed');$('minimize').textContent=panel.classList.contains('moon-collapsed')?'+':'−';};$('history').onclick=()=>{historyOpen=!historyOpen;save();syncHistory();};history.querySelector('[data-history-close]').onclick=()=>{historyOpen=false;save();syncHistory();};history.querySelector('[data-sort]').onchange=draw;
history.querySelector('[data-export]').onclick=()=>{const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const lines=[['Conta','Data','Hunt','Tier','Level','Pokémon','Modo','Segundos','XP/h','Kills/h','Loot/h'],...report.map(r=>[r.account,new Date(r.at).toISOString(),r.zone.name,r.zone.tier,r.zone.lv,r.pokemon,r.furiosa?'Furiosa':'Padrão',r.seconds,r.xpH,r.killsH,r.lootH])];const url=URL.createObjectURL(new Blob(['\ufeff'+lines.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=node('a');a.href=url;a.download='mapeamento-hunts.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
new MutationObserver(syncHistory).observe(panel,{attributes:true,attributeFilter:['hidden','style']});window.addEventListener('resize',syncHistory);window.IPM_ON_STATE?.(()=>{lastStateAt=Date.now();void tick();});setInterval(()=>{render();void tick();},2000);render();

})();

