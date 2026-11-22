// ==UserScript==
// @name         PokeMoon - AutoBreed
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      0.1.1
// @description  Aprimora o exemplar escolhido e prepara duplicatas no modo Normal.
// @match        https://idlepokemoon.com.br/play*
// @match        https://www.idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(() => {
  'use strict';

  const stats = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', vel: 'Vel' };
  const id = pokemon => String(pokemon.id);
  const sum = pokemon => Object.keys(stats).reduce((total, stat) => total + Number(pokemon.growth?.[stat]), 0);
  const available = pokemon => !pokemon.ativo && !pokemon.emAndamento;
  const sameSpecies = (a, b) => a.key === b.key && Boolean(a.shiny) === Boolean(b.shiny);

  function plan(data, config, canUseAsFood) {
    const group = data.grupos.find(group => group.exemplares.some(p => id(p) === config.main));
    const main = group?.exemplares.find(p => id(p) === config.main);
    if (!main) return { status: 'Principal fora da lista de Aprimoramento.' };
    if (!available(main)) return { status: 'Principal ativo na caça ou em aprimoramento.' };
    if (group.estrelas >= Math.min(config.target, data.max ?? 5)) return { status: 'Meta de estrelas atingida.' };
    const total = sum(main);
    if (!Number.isFinite(total)) return { status: 'IVs do principal indisponíveis.' };

    const pools = data.grupos.filter(other => sameSpecies(group, other)).map(other => ({
      group: other,
      food: other.exemplares.filter(p => id(p) !== config.main && available(p) && !p.locked &&
        canUseAsFood(p) && sum(p) < total)
        .sort((a, b) => Number(b.iv) - Number(a.iv) || sum(a) - sum(b))
    }));
    const pool = stars => pools.find(p => p.group.estrelas === stars);
    const direct = pool(group.estrelas)?.food[0];
    if (direct) return { group, keep: main, consume: direct, mode: 'seletivo' };

    // Preserve the best-quality food when combining it with a low-IV copy.
    const needed = (stars, count) => {
      const current = pool(stars);
      const food = current?.food ?? [];
      if (food.length >= count) return { ready: true };
      if (stars <= 0) return {};
      const lower = needed(stars - 1, (count - food.length) * 2);
      if (!lower.ready) return lower;
      const source = pool(stars - 1);
      const [keep] = source.food;
      const consume = source.food.slice(1).reduce((lowest, p) => sum(p) < sum(lowest) ? p : lowest);
      // Normal can roll +1. Reserve room so the final food cannot overtake the principal.
      if (Math.max(sum(keep), sum(consume)) + 1 >= total) {
        const safe = source.food.filter(p => sum(p) + 1 < total);
        if (safe.length < 2) return {};
        return { group: source.group, keep: safe[0], consume: safe.at(-1), mode: 'normal' };
      }
      return { group: source.group, keep, consume, mode: 'normal' };
    };
    const result = needed(group.estrelas, 1);
    return result.keep ? result : { status: 'Aguardando cópias seguras para montar a próxima food.' };
  }

  function chooseStat(main, preview, priorities) {
    return [...new Set(priorities)]
      .filter(stat => Object.hasOwn(stats, stat) && Number.isFinite(Number(main.growth?.[stat])) &&
        Number(main.growth[stat]) < (main.aurora === stat ? preview.tetoStatAurora ?? 42 : preview.tetoStat ?? 32))
      .sort((a, b) => main.growth[a] - main.growth[b])[0];
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { plan, chooseStat };
    return;
  }
  if (window.__pokeMoonAutoBreed || !document.body) return;
  window.__pokeMoonAutoBreed = true;

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

  const token = () => typeof q === 'string' && q ? q : localStorage.getItem('pmi_token');
  const profile = () => typeof K === 'object' && K ? K : null;
  const aoeKeys = ['tmArea', 'tmAreaTipo', 'tmArea2', 'tmArea2Tipo', 'ta2', 'tma', 'ta', 'tan', 'tan2', 'tmAreaNome', 'tmArea2Nome', 'tmAoe'];
  const hasAoE = pokemon => aoeKeys.some(key => Boolean(pokemon?.[key])) || Boolean(pokemon?.attrs?.ta || pokemon?.attrs?.ta2);
  const roster = () => {
    const state = profile();
    return new Map([...(state?.team ?? []), ...(state?.box ?? [])].filter(Boolean).map(p => [id(p), p]));
  };
  const canUse = (p, owned) => owned.has(id(p)) && !hasAoE(p) && !hasAoE(owned.get(id(p)));
  let accountToken = '';
  let storageKey;
  let config;
  let busy = false;
  const defaults = { main: '', first: 'spa', second: 'atk', target: 5, active: false, pending: null };

  async function loadAccount(current) {
    if (current === accountToken) {
      config = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
      return;
    }
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current));
    storageKey = 'kjd-autobreed-v1-' + Array.from(new Uint8Array(digest).slice(0, 12), byte => byte.toString(16).padStart(2, '0')).join('');
    config = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') };
    accountToken = current;
    for (const name of ['first', 'second', 'target']) fields[name].value = config[name];
  }

  moonPanelTheme();
  const style = document.createElement('style');
  style.textContent = `
    #kjd-autobreed select{max-width:100%;min-width:0;padding:5px;border:1px solid #485b77;border-radius:5px;color:#f7e9c8;background:#0d1727;font:inherit}
    #kjd-autobreed select:focus-visible,#kjd-autobreed button:focus-visible{outline:1px solid #d2ae5a;outline-offset:2px}
    #kjd-autobreed .breed-main{display:grid;gap:5px}
    #kjd-autobreed .breed-preview{width:100%;margin-top:9px;padding:7px;border:1px solid #485b77;border-radius:7px;background:#17263c;color:#e8edf6}
  `;
  document.head.append(style);
  const panel = document.createElement('section');
  panel.id = 'kjd-autobreed';
  panel.className = 'moon-panel';
  panel.hidden = true;
  panel.innerHTML = `<header class="moon-head"><canvas width="32" height="32" aria-hidden="true"></canvas>
    <span class="moon-title">AutoBreed<span class="moon-dot"></span></span>
    <button type="button" data-field="close" aria-label="Fechar">×</button></header>
    <div class="moon-body">
      <div class="moon-state" data-field="mode">Desligado</div>
      <div class="moon-section">Aprimoramento</div>
      <label class="moon-line breed-main">Pokémon principal <select data-field="main"></select></label>
      <label class="moon-line">Prioridade no empate <select data-field="first"></select></label>
      <label class="moon-line">Equilibrar com <select data-field="second"><option value="">Nenhum</option></select></label>
      <label class="moon-line">Meta <select data-field="target">${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}★</option>`).join('')}</select></label>
      <button type="button" class="breed-preview" data-field="preview">Simular</button>
      <button type="button" class="moon-go" data-field="toggle">Ligar automação</button>
      <div class="moon-detail" data-field="status" role="status">Carregando…</div>
    </div>`;
  const fields = Object.fromEntries([...panel.querySelectorAll('[data-field]')].map(el => [el.dataset.field, el]));
  for (const [value, label] of Object.entries(stats)) {
    fields.first.add(new Option(label, value));
    fields.second.add(new Option(label, value));
  }
  document.body.append(panel);
  const save = () => localStorage.setItem(storageKey, JSON.stringify(config));
  const status = value => { fields.status.textContent = value; };
  const controls = () => {
    const active = Boolean(config?.active);
    panel.classList.toggle('moon-active', active);
    fields.toggle.classList.toggle('active', active);
    fields.toggle.textContent = active ? 'Desligar automação' : 'Ligar automação';
    fields.mode.textContent = active ? 'Ligado · aprimorando em segundo plano' : 'Desligado';
  };
  fields.close.onclick = () => { panel.hidden = true; };
  for (const name of ['main', 'first', 'second', 'target']) {
    fields[name].onchange = () => {
      if (!config) return;
      config[name] = name === 'target' ? Number(fields[name].value) : fields[name].value;
      config.active = false;
      save();
      controls();
    };
  }

  async function request(path, current, params = {}) {
    const url = new URL(path, location.origin);
    url.search = new URLSearchParams({ token: current, ...params });
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Aprimoramento indisponível.');
    const result = await response.json();
    if (!result || result.err) throw new Error(result?.err || 'Resposta inválida.');
    return result;
  }

  function refreshOptions(data, owned) {
    const rows = data.grupos.flatMap(group => group.exemplares.map(p => ({ p, group })));
    rows.sort((a, b) => a.group.nome.localeCompare(b.group.nome) || Number(b.p.iv) - Number(a.p.iv));
    fields.main.replaceChildren(new Option('Escolha um exemplar', ''));
    for (const { group, p } of rows) {
      const aoe = hasAoE(p) || hasAoE(owned.get(id(p)));
      fields.main.add(new Option(
        `${group.nome}${group.shiny ? ' shiny' : ''} · ${group.estrelas}★ · Q ${p.iv} · IV ${sum(p)}${aoe ? ' · AoE' : ''} · #${id(p)}`, id(p)
      ));
    }
    if (config.main && !rows.some(({ p }) => id(p) === config.main)) {
      fields.main.add(new Option('Principal temporariamente fora da lista', config.main));
    }
    fields.main.value = config.main;
  }

  async function process(simulation, refresh) {
    if (busy) return;
    busy = true;
    try {
      const current = token();
      if (!current) return status('Abra o jogo na conta desejada.');
      await loadAccount(current);
      controls();
      if (!config.active && !simulation && !refresh) return;
      const data = await request('/api/estrelas', current);
      if (!Array.isArray(data.grupos)) throw new Error('Lista de exemplares indisponível.');
      const owned = roster();
      if (refresh || simulation) refreshOptions(data, owned);
      if (config.pending) {
        const { keep, consume, next } = config.pending;
        const finished = data.grupos.some(group => group.estrelas >= next &&
          group.exemplares.some(p => id(p) === keep && !p.emAndamento));
        const donorStillListed = data.grupos.some(group => group.exemplares.some(p => id(p) === consume));
        if (!finished || donorStillListed) {
          return status(config.pending.uncertain
            ? 'Envio sem confirmação. Confira Em andamento antes de liberar uma nova tentativa.'
            : 'Aguardando a fusão em andamento terminar.');
        }
        config.pending = null;
        save();
      }
      if (!config.active && !simulation) return status('Automático pausado. Use Simular para conferir o próximo passo.');
      const next = plan(data, config, p => canUse(p, owned));
      if (!next.keep) return status(next.status);
      const { group, keep, consume, mode } = next;
      const { previa } = await request('/api/estrelas/previa', current, { a: id(keep), b: id(consume) });
      if (!previa || previa.err || previa.ok === false) return status('O jogo recusou a prévia desse par.');
      if (mode === 'seletivo' && previa.vencedor !== 'a') return status('A prévia não confirmou o bloco de IVs do principal.');
      const stat = mode === 'seletivo' ? chooseStat(keep, previa, [config.first, config.second]) : '';
      if (mode === 'seletivo' && !stat) return status('Os atributos escolhidos atingiram o teto.');
      const genes = mode === 'seletivo' ? previa.genesSeletivo ?? data.gene?.seletivo ?? 10 : previa.genes ?? data.gene?.porFusao ?? 1;
      const description = `${mode === 'seletivo' ? 'Principal' : 'Food'} ${group.nome} ${group.estrelas}★ → ${group.estrelas + 1}★ · ${genes} genes · ${Number(group.custoDollar).toLocaleString('pt-BR')}${stat ? ' · +1 ' + stats[stat] : ''}`;
      if (simulation) return status(description);
      if (!(Number(data.gene?.tem) >= genes && Number(group.temDollar) >= Number(group.custoDollar)) ||
        (Number(group.custoStone) > 0 && !(Number(group.temStone) >= Number(group.custoStone)))) {
        return status('Aguardando recursos. ' + description);
      }
      const latest = roster();
      if (!config.active || token() !== current || !canUse(consume, latest) ||
        (mode === 'normal' && !canUse(keep, latest)) ||
        (mode === 'seletivo' && id(keep) !== config.main)) return status('A configuração ou os exemplares mudaram.');

      config.pending = { keep: id(keep), consume: id(consume), next: group.estrelas + 1, uncertain: true };
      save();
      const response = await fetch('/api/action', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: current, action: 'estrelaFundir', pokeId: keep.id, comId: consume.id, modo: mode, stat }),
        signal: AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (result?.err) {
        config.pending = null;
        config.active = false;
        save();
        controls();
        return status(result.err);
      }
      if (!response.ok || !result || typeof result !== 'object') throw new Error('Resposta da fusão incerta. Confira Em andamento.');
      config.pending.uncertain = false;
      save();
      status('Fusão iniciada. ' + description);
    } catch (error) {
      status(config?.pending?.uncertain ? 'Envio sem confirmação. Confira Em andamento.' : error.message);
    } finally {
      busy = false;
    }
  }

  fields.preview.onclick = () => run(true);
  fields.toggle.onclick = () => {
    if (!config?.main) return status('Escolha o Pokémon principal.');
    if (config.active) {
      config.active = false;
      save();
      controls();
      return status('Automático pausado.');
    }
    if (!confirm('Ligar o AutoBreed? Ele consumirá cópias e recursos até a meta selecionada.')) return;
    config.active = true;
    save();
    controls();
    run();
  };
  const icon = document.createElement('canvas');
  icon.width = icon.height = 32;
  const sprite = new Image();
  const icons = [icon, panel.querySelector('.moon-head canvas')];
  for (const canvas of icons) {
    const ctx = canvas.getContext('2d');
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#ffcf56';
    ctx.fillText('★', 3, 26);
  }
  sprite.onload = () => {
    for (const canvas of icons) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 32, 32);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, 0, 0, 32, 32);
    }
  };
  sprite.src = (window.IPM_AV || String)('icons/tb-aprimoramento.png');

  const dock = moonDock();
  dock.register('autobreed', 'AutoBreed', icon, panel);
  dock.drag(panel, panel.querySelector('header'), { storageKey: 'kjd-autobreed-position' });
  new MutationObserver(() => { if (!panel.hidden) run(false, true); }).observe(panel, {
    attributes: true, attributeFilter: ['hidden']
  });

  function run(simulation = false, refresh = false) {
    if (navigator.locks) {
      return navigator.locks.request('kjd-autobreed-action', { ifAvailable: true }, lock => {
        if (lock) return process(simulation, refresh);
        if (simulation || refresh) status('AutoBreed ocupado em outra aba.');
      });
    }
    return process(simulation, refresh);
  }
  setInterval(() => run(), 30000);
})();
