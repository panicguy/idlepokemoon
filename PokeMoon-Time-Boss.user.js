// ==UserScript==
// @name         Poke Moon - Time Boss
// @namespace    local.pokemoon.team-boss
// @version      0.2.0
// @description  Simula 50 lutas locais contra bosses individuais com os Pokémon da conta e aplica o time sob comando.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(()=>{
'use strict';if(window.__idleMoonTeamBoss)return;window.__idleMoonTeamBoss={starting:true};
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

const TB_PRESETS={"suicune":{"name":"Suicune","members":[{"name":"Wishiwashi (School)","moves":["Dive","Double-Edge","Feint Attack","Aqua Ring"],"ability":"u-wishiwashi-school-base"},{"name":"Blissey","moves":["Last Resort","Helping Hand","Heal Pulse","Soft-Boiled"],"ability":"g-normal"},{"name":"Lapras","moves":["Perish Song","Rain Dance","Body Slam","Life Dew"],"ability":"u-lapras-base"},{"name":"Milotic","moves":["Aqua Tail","Life Dew","Dragon Tail","Aqua Ring"],"ability":"u-milotic-base"},{"name":"Dewgong","moves":["Dive","Aqua Ring","Encore","Headbutt"],"ability":"g-water"},{"name":"Vaporeon","moves":["Aqua Ring","Double-Edge","Last Resort","Helping Hand"],"ability":"u-vaporeon-base"}]},"entei":{"name":"Entei","members":[{"name":"Tyranitar","moves":["Crunch","Earthquake","Dark Pulse","Iron Defense"],"ability":"u-tyranitar-base"},{"name":"Gyarados","moves":["Waterfall","Crunch","Dragon Dance","Aqua Tail"],"ability":"u-gyarados-base"},{"name":"Rhyperior","moves":["Earthquake","Drill Run","Rock Wrecker","Megahorn"],"ability":"u-rhyperior-base"},{"name":"Golem","moves":["Earthquake","Rock Blast","Stone Edge","Double-Edge"],"ability":"g-rock"},{"name":"Milotic","moves":["Aqua Tail","Life Dew","Dragon Tail","Aqua Ring"],"ability":"u-milotic-base"},{"name":"Vaporeon","moves":["Aqua Ring","Double-Edge","Last Resort","Helping Hand"],"ability":"u-vaporeon-base"}]},"jirachi":{"name":"Jirachi","members":[{"name":"Wishiwashi (School)","moves":["Beat Up","Feint Attack","Helping Hand","Aqua Ring"],"ability":"u-wishiwashi-school-base"},{"name":"Tyranitar","moves":["Crunch","Earthquake","Dark Pulse","Iron Defense"],"ability":"u-tyranitar-base"},{"name":"Houndoom","moves":["Flamethrower","Foul Play","Inferno","Crunch"],"ability":"u-houndoom-base"},{"name":"Hisuian Typhlosion","moves":["Flamethrower","Inferno","Eruption","Overheat"],"ability":"u-hisuian-typhlosion-base"},{"name":"Gardevoir","moves":["Mystical Fire","Heal Pulse","Wish","Dream Eater"],"ability":"u-gardevoir-base"},{"name":"Vaporeon","moves":["Aqua Ring","Helping Hand","Last Resort","Double-Edge"],"ability":"u-vaporeon-base"}]},"zeraora":{"name":"Zeraora","members":[{"name":"Rhyperior","moves":["Earthquake","Drill Run","Rock Wrecker","Megahorn"],"ability":"u-rhyperior-base"},{"name":"Golem","moves":["Earthquake","Rock Blast","Stone Edge","Double-Edge"],"ability":"g-rock"},{"name":"Tyranitar","moves":["Crunch","Earthquake","Dark Pulse","Iron Defense"],"ability":"u-tyranitar-base"},{"name":"Gardevoir","moves":["Mystical Fire","Heal Pulse","Wish","Dream Eater"],"ability":"u-gardevoir-base"},{"name":"Blissey","moves":["Last Resort","Helping Hand","Heal Pulse","Soft-Boiled"],"ability":"g-normal"},{"name":"Noivern","moves":["Roost","Moonlight","Tailwind","Boomburst"],"ability":"g-flying"}]}};
function resolveBossTeam(preset, owned, info) {
  const used = new Set(), time = [], golpes = {}, habs = {}, warnings = [];
  for (const member of preset.members) {
    const choices = owned.filter(p => p.n === member.name && (!member.id || p.id === member.id) && !used.has(p.id))
      .sort((a,b) => Number(info.poder?.[b.id]?.pw || b.pw || 0) - Number(info.poder?.[a.id]?.pw || a.pw || 0));
    const chosen = choices[0];
    if (!chosen) throw Error('Falta nesta conta: ' + member.name + '. Nenhuma alteração feita.');
    if (member.id && (chosen.pkJ !== member.referencePacket || chosen.nv !== member.level || chosen.k !== member.tier || !!chosen.sh !== !!member.shiny)) throw Error('Os atributos de '+member.name+' mudaram. Simule novamente antes de aplicar.');
    used.add(chosen.id); time.push(chosen.id); golpes[chosen.id] = [...member.moves]; habs[chosen.id] = member.ability;
    if (chosen.pkJ !== member.referencePacket) warnings.push(member.name);
  }
  return {time,golpes,habs,warnings};
}
function verifyBossTeam(actual, expected) {
  if (actual.modo && actual.modo !== 'individual') throw Error('Resposta não corresponde ao boss individual.');
  if (JSON.stringify(actual.time) !== JSON.stringify(expected.time)) throw Error('O servidor não confirmou a ordem do time.');
  for (const id of expected.time) {
    if (JSON.stringify(actual.golpes?.[id]) !== JSON.stringify(expected.golpes[id])) throw Error('O servidor não confirmou os golpes.');
    if ((actual.habVale?.[id] || actual.habs?.[id]) !== expected.habs[id]) throw Error('O servidor não confirmou a habilidade.');
  }
}
async function applyBossTeam({preset,request,guard,saveBackup}) {
  guard();
  const [owned,before] = await Promise.all([request('/api/gm/pokes'),request('/api/boss/equipe')]);
  guard();
  if (before.modo && before.modo !== 'individual') throw Error('A equipe retornada não é individual.');
  const plan = resolveBossTeam(preset,owned.pokes || [],before);
  const affected = [...new Set([...before.time,...plan.time])];
  const backup = {time:before.time,golpes:{},habs:{}};
  for (const id of affected) {
    if (before.golpes?.[id]?.length) backup.golpes[id] = before.golpes[id];
    if (before.habs?.[id] || before.habVale?.[id]) backup.habs[id] = before.habs?.[id] || before.habVale[id];
  }
  saveBackup(backup); guard();
  let changed = false;
  try {
    changed = true; // A timed-out POST may have reached the server.
    await request('/api/boss/equipe',{time:plan.time}); guard();
    await request('/api/boss/equipe',{golpes:plan.golpes}); guard();
    await request('/api/boss/equipe',{habs:plan.habs}); guard();
    verifyBossTeam(await request('/api/boss/equipe'),plan); guard();
    return plan;
  } catch (e) {
    if (changed) {
      try {
        // request retains the captured owner's token even if the displayed account changes.
        await request('/api/boss/equipe',{time:backup.time});
        if (Object.keys(backup.golpes).length) await request('/api/boss/equipe',{golpes:backup.golpes});
        if (Object.keys(backup.habs).length) await request('/api/boss/equipe',{habs:backup.habs});
        verifyBossTeam(await request('/api/boss/equipe'),backup);
        throw Object.assign(Error(e.message + ' Time anterior restaurado.'),{restored:true});
      } catch (restore) {
        if (restore.restored) throw restore;
        throw Error(e.message + ' Não foi possível confirmar a restauração. Confira o time no jogo; backup local preservado.');
      }
    }
    throw e;
  }
}


function tbPlanTeams(input, roster, data, types) {
  const norm = s => String(s || '').toLowerCase();
  const byName = new Map(roster.map(p => [norm(p.nome), p]));
  const moveIndex = new Map(data.gn.map((n,i) => [norm(n),i]));
  const decode = s => {try{return JSON.parse(atob(s.replace(/-/g,'+').replace(/_/g,'/')));}catch(_){return {};}};
  const damage = (attack, defenders) => defenders.reduce((v,t) => v * (types[attack]?.i?.includes(t) ? 0 : types[attack]?.f?.includes(t) ? 2 : types[attack]?.r?.includes(t) ? .5 : 1),1);
  const enemy = [...new Set((input.boss.fases || []).flatMap(p => [p.tipo1,p.tipo2]).filter(t => t && t !== 'none'))];
  if(input.choice && types[input.choice]) {enemy.length=0;enemy.push(input.choice);}
  const enemies = enemy.length ? enemy : [input.boss.arena?.tipo || 'normal'];
  const pool = input.owned.pokes.filter(p => byName.has(norm(p.n)) && p.pkJ && !/[~,;|]/.test(p.n)).map(p => {
    const r=byName.get(norm(p.n)), packet=decode(p.pkJ), clamp=x=>Math.max(.1,Math.min(8,+x||1));
    const a=(+r.s.atk||1)*clamp(packet.a),s=(+r.s.spa||1)*clamp(packet.s);
    const effective = t => enemies.reduce((v,e)=>v+damage(t,[e]),0)/enemies.length;
    const incoming = enemies.reduce((v,e)=>v+damage(e,r.tipos),0)/enemies.length;
    const legal = new Set((data.mp[p.n] || []).filter(x=>p.nv>=200 || x[1]<=p.nv).map(x=>data.gn[x[0]]));
    // Equipped moves are already learned. Never assume a learnable TM has been taught.
    for(const n of input.owned.golpes?.[p.id] || []) legal.add(n);
    const choices=[...legal].map(n=>{
      const i=moveIndex.get(norm(n)),g=i===undefined?null:data.g[i];
      if(!g)return {n,score:15,role:'other'};
      const [type,family,category,power]=g,stat=category==='p'?a:s;
      const support=/curaAliado|buffAliado|escudoAliado/.test(family);
      const heal=/cura/.test(family),buff=/buff|escudo|contra/.test(family);
      const score=power>0?power*stat/100*effective(type)*(r.tipos.includes(type)?1.15:1):support?105:heal?85:buff?60:12;
      return {n,score,role:power>0?'attack':support?'support':heal?'heal':buff?'buff':'other'};
    }).sort((a,b)=>b.score-a.score || a.n.localeCompare(b.n));
    const take = mode => {
      const selected=[],add=g=>{if(g&&!selected.includes(g.n))selected.push(g.n);};
      add(choices.find(g=>g.role==='attack'));
      if(mode==='support') {add(choices.find(g=>g.role==='support'));add(choices.find(g=>g.role==='heal'));}
      else {add(choices.find(g=>g.role==='heal'));add(choices.find(g=>g.role==='buff'));}
      for(const g of choices) {if(selected.length===4)break;add(g);}
      return selected;
    };
    const attack=choices.find(g=>g.role==='attack')?.score||1;
    const bulk=Math.sqrt((+r.s.hp||1)*clamp(packet.h)*Math.sqrt((+r.s.def||1)*clamp(packet.d)*(+r.s.spd||1)*clamp(packet.e)))/Math.max(.2,incoming);
    return {id:p.id,name:p.n,moves:take('balanced'),supportMoves:take('support'),ability:input.info.habVale?.[p.id]||data.e[p.n]?.[0],packet:p.pkJ,level:p.nv,tier:p.k,shiny:p.sh,attack,bulk,healer:choices.some(g=>g.role==='support'),legal};
  }).filter(p=>p.moves.length===4 && p.ability);
  if(pool.length<6)throw Error('São necessários seis Pokémon disponíveis com quatro golpes válidos.');
  const used=new Set(),teams=[];
  const add=(list,label)=>{
    if(list.length!==6 || list.some(p=>p.moves.length!==4) || new Set(list.map(p=>p.id)).size!==6)return;
    const team=list.map(p=>({id:p.id,name:p.name,moves:[...p.moves],ability:p.ability,referencePacket:p.packet,level:p.level,tier:p.tier,shiny:p.shiny}));
    const key=JSON.stringify(team.map(p=>[p.id,p.moves]));if(used.has(key))return;used.add(key);teams.push({label,members:team});
  };
  const pick=(rank,names=new Set())=>rank.filter(p=>{if(names.has(p.name))return false;names.add(p.name);return true;});
  const ranked = ratio => pick([...pool].sort((a,b)=>(b.attack**ratio*b.bulk**(1-ratio))-(a.attack**ratio*a.bulk**(1-ratio))));
  for(const ratio of [.65,.35,.9]) {
    const rank=ranked(ratio);add(rank.slice(0,6),'Equilíbrio '+Math.round(ratio*100));
    const healers=pick([...pool].filter(p=>p.healer).sort((a,b)=>b.bulk-a.bulk)).slice(0,2);
    const supports=healers.map(p=>({...p,moves:p.supportMoves}));
    add([...rank.filter(p=>!healers.some(h=>h.name===p.name)).slice(0,6-supports.length),...supports],'Suporte '+Math.round(ratio*100));
  }
  const current=(input.info.time||[]).map(id=>pool.find(p=>p.id===id));
  if(current.every(Boolean)&&current.length===6)add(current.map(p=>({...p,moves:(input.info.golpes?.[p.id]||p.moves).filter(n=>p.legal.has(n))})),'Time atual');
  const preset=Object.values(input.presets).find(p=>norm(p.name)===norm(input.boss.nome));
  if(preset){const selected=[],ids=new Set();for(const m of preset.members){const p=[...pool].filter(p=>p.name===m.name&&!ids.has(p.id)).sort((a,b)=>b.attack*b.bulk-a.attack*a.bulk)[0];if(!p||m.moves.some(n=>!p.legal.has(n)))break;ids.add(p.id);selected.push({...p,moves:m.moves,ability:p.ability});}add(selected,'Composição salva');}
  // Fixed bound keeps the search responsive; the final winner gets its own 50 trials.
  return teams.slice(0,8);
}


// Sources execute only inside a sandbox without same-origin access or network permissions.
function tbEngineBootstrap(config) {
  window.__tbSearch=config.search;
  window.SIM_SEM_TELA=true;
  window.requestAnimationFrame=()=>0;
  window.__tbDiscardMessage=()=>{};
  window.__tbErrors=[];
  addEventListener('error',e=>__tbErrors.push(String(e.message)));
  addEventListener('unhandledrejection',e=>__tbErrors.push(String(e.reason?.message||e.reason)));
  window.fetch=async (url,options={})=>{
    if(options.method && options.method!=='GET')throw Error('Simulação bloqueou uma escrita.');
    const u=new URL(String(url),'https://offline.invalid/arena-proto/');
    if(u.origin!=='https://offline.invalid')throw Error('Simulação sem acesso à rede.');
    if(Object.hasOwn(config.assets,u.pathname))return new Response(config.assets[u.pathname],{status:200});
    if(u.pathname.endsWith('/manifesto.json') || u.pathname==='/sprites/manifest.json')return new Response('{}');
    throw Error('Arquivo não disponível no simulador: '+u.pathname);
  };
}
async function tbEngineRun(input, send) {
  // Hidden-frame timers are throttled by Chromium. MessageChannel yields to the
  // event loop without turning every batch into a one-second background wait.
  const queue=[],scheduler=new MessageChannel();scheduler.port1.onmessage=()=>queue.shift()?.();
  const yieldUI=()=>new Promise(r=>{queue.push(r);scheduler.port2.postMessage(0);});
  img=async()=>null;imgLutador=async()=>null;
  const roster=await(await fetch('roster.json')).json();ROSTER=roster.pokes;TIPOS=roster.tipos;
  await BX.carregaLuta(BOSS_ID);
  if(!BX.lutas[BOSS_ID])throw Error('O módulo não registrou este boss.');
  const slots=members=>members.map(p=>(p.shiny?'*':'')+p.name+'~'+p.moves.join(';')+'~'+p.ability+'~'+p.level+'~'+p.tier+'~'+p.referencePacket);
  const trial=async (members,seed)=>{
    __tbErrors.length=0;
    window.__tbSearch='?'+new URLSearchParams({boss:input.boss.id,semtela:'1',servidor:'1',nv:String(input.boss.nivelRecomendado||200),seed:String(seed),escolha:input.choice||'',times:slots(members).join(',')});
    BX.escolha=input.choice||null;ARENA_SEED=seed;
    const fatias=[seed];let v=seed;for(let i=1;i<650;i++){v=(v+1831565813)>>>0;let t=v;t=Math.imul(t^t>>>15,1|t);t^=t+Math.imul(t^t>>>7,61|t);fatias.push((t^t>>>14)>>>0);}SIM.fatias=i=>fatias[i];
    await BX.novaLuta();
    if(times[0]?.length!==6)throw Error('O motor não montou os seis Pokémon.');
    for(let i=0;i<6;i++)if(times[0][i].nome!==members[i].name)throw Error('O motor alterou a composição.');
    while(!fim && simT<600000){for(let i=0;i<240&&!fim&&simT<600000;i++){const prev=SIM.ticks;passoLogica();if(SIM.ticks===prev)throw Error('Motor de batalha parou.');}await yieldUI();}
    const out=BX.resultado(),errors=[...__tbErrors,...SIM.erros];
    if(errors.length)throw Error('Motor: '+errors[0]);
    return {win:out.vitoria===true,finished:!!out.terminou,seconds:+out.seg||simT/1000,damage:+out.danoTotal||0};
  };
  const candidates=tbPlanTeams(input,ROSTER,V4_DADOS,TIPOS);
  if(input.testOnly){const result=await trial(candidates[0].members,67891);send('ready',{boss:BOSS_ID,result});return;}
  let best=null;const seed0=crypto.getRandomValues(new Uint32Array(1))[0]||12345;
  for(let c=0;c<candidates.length;c++){
    let wins=0,damage=0,seconds=0;
    for(let i=0;i<3;i++){send('progress',{text:'Triagem de times: '+(c*3+i)+'/'+(candidates.length*3)});const r=await trial(candidates[c].members,(seed0+i*104729)>>>0||1);wins+=r.win?1:0;damage+=r.damage;seconds+=r.seconds;}
    const score={wins,damage,seconds,team:candidates[c]};
    if(!best || wins>best.wins || wins===best.wins&&(wins?seconds<best.seconds:damage>best.damage))best=score;
  }
  if(!best)throw Error('Não foi possível formar uma composição.');
  let wins=0,timeouts=0,totalSeconds=0;const seeds=[];
  for(let i=0;i<50;i++){
    send('progress',{text:'Validação do time escolhido: '+i+'/50',completed:i,wins});
    // Validation seeds are separate from screening, fixed for this run and recorded.
    const seed=(seed0+(i+100)*104729)>>>0||1;seeds.push(seed);
    const r=await trial(best.team.members,seed);wins+=r.win?1:0;timeouts+=r.finished?0:1;totalSeconds+=r.seconds;
  }
  send('done',{members:best.team.members,label:best.team.label,wins,losses:50-wins,timeouts,total:50,meanSeconds:totalSeconds/50,seeds,choice:input.choice||'',bossId:input.boss.id,at:Date.now()});
}
function tbSimulationHTML(html, assets, bossId, choice, input, channel) {
  const json=x=>JSON.stringify(x).replace(/</g,'\\u003c');
  const tag=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
  const sources=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>new URL(m[1],'https://offline.invalid/arena-proto/arena.html')).filter(u=>u.origin==='https://offline.invalid'&&!/arena-replay\.js$/.test(u.pathname));
  let body=html.slice(html.indexOf('<body>')+6,html.indexOf('<script'));
  const search='?'+new URLSearchParams({boss:bossId,escolha:choice||'',semtela:'1',servidor:'1',seed:'1'});
  let content=tag('('+tbEngineBootstrap.toString()+')('+json({search,assets})+');');
  for(const u of sources){
    let source=assets[u.pathname];if(typeof source!=='string')throw Error('Falta arquivo '+u.pathname);
    if(u.pathname.endsWith('/arena-main.js')){const marker=',(async()=>{const e=await(await fetch("roster.json"))',i=source.indexOf(marker);if(i<0)throw Error('O motor mudou; atualização necessária antes de simular.');source=source.slice(0,i)+';';}
    source=source.replace(/(?:window\.|self\.)?location\.search/g,'window.__tbSearch').replace(/(?:window\.)?parent\.postMessage/g,'window.__tbDiscardMessage');
    // No network bridge to the game, replays, or real fight submission is installed.
    if(/\/(?:arena-servidor|arena-resultado)\.js$/.test(u.pathname))continue;
    content+=tag(source);
  }
  // Boss modules read the choice at registration, so each run gets a fresh realm.
  const modulePath='/arena-proto/arena-boss-'+bossId+'.js';
  const virtualAssets={...assets,[modulePath]:assets[modulePath].replace(/(?:window\.|self\.)?location\.search/g,'window.__tbSearch').replace(/(?:window\.)?parent\.postMessage/g,'window.__tbDiscardMessage')};
  content+=tag('('+tbEngineBootstrap.toString()+')('+json({search,assets:virtualAssets})+');\n'+tbPlanTeams.toString()+'\nconst __tbSend=(type,data)=>parent.postMessage({channel:'+json(channel)+',type,data},"*");('+tbEngineRun.toString()+')('+json(input)+',__tbSend).catch(e=>__tbSend("error",{message:e.message}));');
  return '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><body>'+body+content+'</body>';
}


  const TB_KEY='pokemoon-team-boss-v2:';
  const tbToken=()=>{try{return typeof q==='string'&&q?q:localStorage.getItem('pmi_token');}catch(_){return null;}};
  const tbOwner=()=>{try{return String(K?.player?.id||K?.player?.name||'');}catch(_){return '';}};
  const tbRead=owner=>{try{return JSON.parse(localStorage.getItem(TB_KEY+owner)||'{}');}catch(_){return {};}};
  const tbWrite=(owner,data)=>{try{localStorage.setItem(TB_KEY+owner,JSON.stringify({...tbRead(owner),...data}));}catch(_){}};
  let tbBound='',tbBusy=false,tbRun=null,tbResult=null,tbBosses=[],tbCatalogOwner='',tbApplying=false;
  const tbAssetCache=new Map();
  async function tbFetch(token,route,data,signal){
    const url=new URL(route,location.origin);if(url.origin!==location.origin)throw Error('Origem inválida.');
    if(!data)url.searchParams.set('token',token);
    const options=data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,...data})}:{method:'GET',cache:'no-store'};
    const timeout=AbortSignal.timeout(25000),combined=signal?AbortSignal.any([signal,timeout]):timeout;
    let response=await fetch(url,{...options,signal:combined});
    if(response.status===421){const owner=response.headers.get('X-Pokeidle-Dono');if(/^\d+$/.test(owner||''))response=await fetch(url,{...options,headers:{...options.headers,'X-Pokeidle-P':owner},signal:combined});}
    if(!response.ok)throw Error('HTTP '+response.status+' ao carregar '+url.pathname);
    return response;
  }
  function tbRequester(token,signal){return async(route,data)=>{
    if(!['/api/gm/pokes','/api/boss/equipe','/api/boss/list?modo=individual'].includes(route))throw Error('Endpoint não permitido.');
    if(data&&(route!=='/api/boss/equipe'||Object.keys(data).some(k=>!['time','golpes','habs'].includes(k))))throw Error('Operação não permitida.');
    const result=await(await tbFetch(token,route,data,signal)).json();
    if(result.err||result.error)throw Error(String(result.err||result.error));return result;
  };}
  async function tbAssets(token,bossId,signal,progress){
    const get=async pathname=>{
      if(!/^\/arena-proto\/[a-zA-Z0-9_./-]+\.(?:js|json|html)$/.test(pathname)&&pathname!=='/golpe-nomes.js')throw Error('Arquivo do motor não permitido.');
      if(pathname.split('/').includes('..'))throw Error('Caminho inválido.');
      if(tbAssetCache.has(pathname))return tbAssetCache.get(pathname);
      const text=await(await tbFetch(token,pathname,null,signal)).text();
      if(/<html|<!doctype/i.test(text)&&!pathname.endsWith('.html'))throw Error('O jogo não retornou o arquivo do motor. Tente novamente.');
      tbAssetCache.set(pathname,text);return text;
    };
    const html=await get('/arena-proto/arena.html');
    const paths=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>new URL(m[1],location.origin+'/arena-proto/arena.html')).filter(u=>u.origin===location.origin&&!/arena-replay\.js$/.test(u.pathname)).map(u=>u.pathname);
    paths.push('/arena-proto/roster.json','/arena-proto/arena-boss-'+bossId+'.js');
    const unique=[...new Set(paths)],assets={};let index=0,done=0;
    await Promise.all(Array.from({length:Math.min(6,unique.length)},async()=>{while(index<unique.length){const p=unique[index++];assets[p]=await get(p);progress('Carregando motor: '+(++done)+'/'+unique.length);}}));
    return {html,assets};
  }
  moonPanelTheme();
  const tbPanel=document.createElement('section');tbPanel.id='pokemoon-team-boss';tbPanel.className='moon-panel';
  tbPanel.innerHTML='<div class="moon-head"><span>🏆</span><span class="moon-title">Time Boss</span><button data-close title="Fechar">×</button></div><div class="moon-body"><div class="moon-state">Boss individual · simulação local</div><p class="moon-note">Busca composições com os Pokémon desta conta e valida o time escolhido em 50 lutas.</p><select data-select aria-label="Boss individual"><option value="">Carregando bosses…</option></select><select data-choice aria-label="Variação do boss" hidden></select><button class="moon-go" data-simulate>Simular 50 lutas</button><button data-cancel hidden>Cancelar simulação</button><div class="moon-detail" data-status>Abra o Time Boss para carregar o catálogo.</div><button class="moon-go" data-apply disabled>Aplicar time simulado</button><div class="moon-detail" data-team hidden></div><p class="moon-foot">Sem lutas reais ou gasto de chaves. A taxa é uma estimativa local, não garantia. Não ensina TMs. O time só muda ao clicar em Aplicar.</p></div>';
  const tbStyle=document.createElement('style');tbStyle.textContent='#pokemoon-team-boss{width:min(370px,calc(100vw - 16px));max-height:calc(100vh - 16px)}#pokemoon-team-boss .moon-body{overflow:auto;max-height:calc(100vh - 75px)}#pokemoon-team-boss select{width:100%;padding:8px;margin:4px 0;background:#101c2a;color:#f4e4b8;border:1px solid #816e43;border-radius:6px}#pokemoon-team-boss [data-team]{max-height:220px;overflow:auto;white-space:pre-wrap}#pokemoon-team-boss button{cursor:pointer}#pokemoon-team-boss button:disabled{opacity:.5;cursor:default}';document.head.appendChild(tbStyle);document.body.appendChild(tbPanel);
  const tbEl=k=>tbPanel.querySelector('[data-'+k+']');
  const tbIcon=document.createElement('canvas');tbIcon.width=32;tbIcon.height=32;const tbCtx=tbIcon.getContext('2d');tbCtx.fillStyle='#d7ad47';for(const r of [[8,5,16,13],[4,7,4,8],[24,7,4,8],[13,18,6,6],[8,25,16,4]])tbCtx.fillRect(...r);tbCtx.fillStyle='#fff0a8';tbCtx.fillRect(10,7,4,8);
  tbPanel.hidden=true;addMoonDockButton('time-boss','Time Boss',tbIcon,tbPanel);moonDock().drag(tbPanel,tbPanel.querySelector('.moon-head'),{storageKey:'pokemoon-team-boss-v1:position'});
  tbEl('close').onclick=()=>{tbPanel.hidden=true;moonDock().sync();};
  const tbSelected=()=>tbBosses.find(b=>b.id===tbEl('select').value);
  function tbButtons(){tbEl('select').disabled=tbBusy;tbEl('choice').disabled=tbBusy;tbEl('simulate').disabled=tbBusy||!tbSelected()||!tbOwner();tbEl('cancel').hidden=!tbRun;tbEl('apply').disabled=tbBusy||!tbResult||tbResult.total!==50||tbResult.bossId!==tbEl('select').value||tbResult.choice!==(tbEl('choice').value||'');}
  function tbPreview(){
    const r=tbResult;tbEl('team').hidden=!r;
    tbEl('team').textContent=r?r.wins+'/50 vitórias ('+(r.wins*2)+'%) · '+r.losses+' derrotas'+(r.timeouts?' · '+r.timeouts+' sem conclusão em 10 min':'')+'\nTempo médio: '+Math.round(r.meanSeconds)+' s\n'+(r.choice?'Variação: '+r.choice+'\n':'')+'\n'+r.members.map((p,i)=>(i+1)+'. '+p.name+'\n'+p.moves.join(' · ')).join('\n\n'):'';
    tbButtons();if(!tbPanel.hidden)moonDock().clamp(tbPanel);
  }
  function tbChoices(){
    const b=tbSelected(),c=b?.escolhaArena;tbEl('choice').replaceChildren();
    if(c){
      if(c.lista){const o=document.createElement('option');o.value='';o.textContent='Ordem padrão do boss';tbEl('choice').append(o);}
      else {if(c.opcional){const o=document.createElement('option');o.value='';o.textContent='Padrão / sem escolha';tbEl('choice').append(o);}for(const item of c.opcoes||[]){const o=document.createElement('option');o.value=item.id;o.textContent=item.rotulo;tbEl('choice').append(o);}if(b.id==='estelar-jirachi')tbEl('choice').value='vida';}
    }
    tbEl('choice').hidden=!c;tbResult=null;tbPreview();
  }
  async function tbLoad(){
    const owner=tbOwner(),token=tbToken();if(!owner||!token||tbBusy||tbCatalogOwner===owner)return;
    tbBusy=true;tbButtons();tbEl('status').textContent='Lendo bosses individuais…';
    try{const data=await tbRequester(token)('/api/boss/list?modo=individual');if(owner!==tbOwner()||token!==tbToken())return;
      tbBosses=(data.bosses||[]).filter(b=>b.modo!=='guilda'&&/^[a-z0-9-]{2,40}$/.test(b.id));tbCatalogOwner=owner;tbEl('select').replaceChildren();
      const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Escolha um boss ('+tbBosses.length+')…';tbEl('select').append(placeholder);
      for(const b of [...tbBosses].sort((a,b)=>a.nome.localeCompare(b.nome))){const o=document.createElement('option');o.value=b.id;o.textContent=b.nome+' · Nv '+b.nivelRecomendado+(b.travadoNivel?' · nível bloqueado':'');tbEl('select').append(o);}
      const saved=tbRead(owner);tbEl('select').value=tbBosses.some(b=>b.id===saved.selected)?saved.selected:'';tbChoices();
      if(saved.result?.total===50&&saved.result.bossId===tbEl('select').value){tbEl('choice').value=saved.result.choice||'';tbResult=saved.result;}
      tbEl('status').textContent=tbResult?'Resultado salvo nesta conta. Simule novamente para atualizar os testes.':'Escolha o boss e clique em Simular. A triagem vem antes das 50 lutas de validação.';
    }catch(e){if(owner===tbOwner())tbEl('status').textContent=e.message;}finally{tbBusy=false;tbPreview();}
  }
  function tbCancel(message='Simulação cancelada. Nenhum time alterado.'){
    const run=tbRun;if(!run)return;tbRun=null;run.controller.abort();clearTimeout(run.timer);removeEventListener('message',run.listener);run.frame?.remove();tbBusy=false;tbResult=null;tbEl('status').textContent=message;tbPreview();
  }
  async function tbSimulate(){
    if(tbBusy)return;const boss=tbSelected(),owner=tbOwner(),token=tbToken();if(!boss||!owner||!token)return;
    const choice=tbEl('choice').value||'',run={controller:new AbortController(),owner,token};tbRun=run;tbBusy=true;tbResult=null;tbPreview();
    const guard=()=>{if(tbRun!==run||owner!==tbOwner()||token!==tbToken())throw Error('Simulação cancelada ou conta alterada.');};
    const progress=text=>{guard();tbEl('status').textContent=text;};
    try{
      progress('Lendo Pokémon e atributos atuais…');
      const request=tbRequester(token,run.controller.signal),[owned,info]=await Promise.all([request('/api/gm/pokes'),request('/api/boss/equipe')]);guard();
      const pack=await tbAssets(token,boss.id,run.controller.signal,progress);guard();
      const frame=document.createElement('iframe');run.frame=frame;frame.setAttribute('sandbox','allow-scripts');frame.hidden=true;frame.setAttribute('aria-hidden','true');
      const channel=crypto.randomUUID();run.listener=e=>{
        if(tbRun!==run||e.source!==frame.contentWindow||e.data?.channel!==channel)return;
        try{guard();const {type,data}=e.data;
          if(type==='progress'){progress(data.text);return;}
          if(type==='error')throw Error(data.message);
          if(type==='done'){
            if(data.total!==50||data.bossId!==boss.id||data.choice!==choice||data.members?.length!==6||new Set(data.members.map(p=>p.id)).size!==6||!Number.isInteger(data.wins)||data.wins<0||data.wins>50)throw Error('Resultado de simulação inválido.');
            tbResult=data;tbWrite(owner,{selected:boss.id,result:data});tbFinish(run);tbEl('status').textContent='Validação concluída: '+data.wins+'/50 vitórias. '+(data.wins?'Revise o time abaixo antes de aplicar.':'O time não venceu nesta amostra. Considere melhorar seus Pokémon.');tbPreview();
          }
        }catch(e){tbCancel(e.message);}
      };addEventListener('message',run.listener);
      run.timer=setTimeout(()=>tbCancel('A simulação excedeu 5 minutos. Tente novamente.'),300000);
      frame.srcdoc=tbSimulationHTML(pack.html,pack.assets,boss.id,choice,{boss,choice,owned,info,presets:TB_PRESETS},channel);document.body.append(frame);progress('Iniciando triagem local…');
    }catch(e){if(tbRun===run)tbCancel(e.message);}
  }
  function tbFinish(run){clearTimeout(run.timer);removeEventListener('message',run.listener);run.frame?.remove();run.controller.abort();if(tbRun===run)tbRun=null;tbBusy=false;}
  async function tbApply(){
    if(tbBusy||!tbResult)return;const owner=tbOwner(),token=tbToken(),r=tbResult,boss=tbSelected();if(!owner||!token||r.bossId!==boss?.id||r.choice!==(tbEl('choice').value||''))return;
    tbBusy=true;tbApplying=true;tbButtons();tbEl('status').textContent='Conferindo os exemplares simulados e salvando o time…';
    const guard=()=>{if(owner!==tbOwner()||token!==tbToken())throw Error('Personagem ou sessão mudou durante a aplicação.');};
    try{await applyBossTeam({preset:{members:r.members},request:tbRequester(token),guard,saveBackup:backup=>tbWrite(owner,{backup:{at:Date.now(),...backup}})});if(owner===tbOwner())tbEl('status').textContent='Time confirmado no boss individual.'+(r.choice?' Ao entrar na luta, escolha a variação '+r.choice+'.':'');}
    catch(e){if(owner===tbOwner())tbEl('status').textContent=e.message;}
    finally{tbBusy=false;tbApplying=false;tbBind();tbPreview();}
  }
  function tbBind(){
    const owner=tbOwner();if(tbRun&&(tbRun.owner!==owner||tbRun.token!==tbToken()))tbCancel('Conta alterada. Simulação cancelada.');
    if(tbApplying)return;
    if(tbBound!==owner){tbBound=owner;tbResult=null;tbBosses=[];tbCatalogOwner='';tbEl('select').replaceChildren();tbEl('status').textContent=owner?'Abra o Time Boss para carregar o catálogo.':'Aguardando personagem conectado.';tbPreview();}
    if(!tbPanel.hidden&&!tbBusy&&tbCatalogOwner!==owner)void tbLoad();
  }
  tbEl('select').onchange=()=>{tbChoices();tbWrite(tbOwner(),{selected:tbEl('select').value,result:null});tbEl('status').textContent='Clique em Simular para testar este boss.';};
  tbEl('choice').onchange=()=>{tbResult=null;tbWrite(tbOwner(),{result:null});tbPreview();};
  tbEl('simulate').onclick=tbSimulate;tbEl('cancel').onclick=()=>tbCancel();tbEl('apply').onclick=tbApply;
  const tbObserver=new MutationObserver(()=>{tbBind();});tbObserver.observe(tbPanel,{attributes:true,attributeFilter:['hidden']});
  tbBind();setInterval(tbBind,1000);window.__idleMoonTeamBoss={version:'0.2.0'};

})();
