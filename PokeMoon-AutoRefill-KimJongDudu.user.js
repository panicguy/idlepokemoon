// ==UserScript==
// @name         PokeMoon AutoRefill by KimJongDudu
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.3.0
// @description  Reabastece Pokebolas e Potions com estoque-alvo; venda opcional do loot antes da compra. Independente do AutoCatch.
// @match        https://idlepokemoon.com.br/play*
// @match        https://www.idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @idlemoon-card autorefill-v1
// ==/UserScript==

(() => {
  'use strict';
  const KJD_ICON_SPEC={"w":13,"h":21,"c":"AAAAAAMHB/8AAAD/4ODg/7S0tP+JiYn/U1NT/wMGB/8cMzb/teYd/3eOjv8isUz/","p":"AAAAAAAAAAABAQEBAAAAAAAAAAICAwMDAwIAAAABAQEDAwMDBAUCAAICAwMDAwMEBQUFAgIDAwMDAwQFBQUFAgACBAQDBAUFBQIFAgAAAgQEBAUFBQUFBQIAAAIEBAQFBQYFBQYCAgACBAQEBQYHBgYCAgICAgQIBAUGBwcHAgIBAgIEBwQFBgcHAgIBAQICBgQEBQYCCAgBAQECAgIGBgYBCAgIAQkBAgIIAgIBCggLCAEBAQICCAgICgoICAgBAQECAgkICAoKCAkIAQkBAgIICAsKCgICAgIBAQICCAICCgoCAgICAgICAgICAgoKAgsCAgICAAACAgIKCgICAgICAAAAAAICAgICAgIAAAAA"};
  function kjdPixelIcon(spec) {
    try {
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
      if(!ctx) throw Error('Canvas indisponível');
      canvas.width=spec.w;canvas.height=spec.h;
      canvas.style.cssText='width:29px;height:29px;object-fit:contain;image-rendering:pixelated;pointer-events:none';
      const palette=atob(spec.c),indexes=atob(spec.p),frame=ctx.createImageData(spec.w,spec.h);
      if(indexes.length!==spec.w*spec.h)throw Error('Ícone incompleto');
      for(let i=0;i<indexes.length;i++){const k=indexes.charCodeAt(i)*4;for(let j=0;j<4;j++)frame.data[i*4+j]=palette.charCodeAt(k+j)}
      ctx.putImageData(frame,0,0);return canvas;
    } catch(e){console.warn('[Moon Dock] ícone indisponível',e);return null}
  }
  if (window.__PM_AUTOREFILL_KJD__) return;
  window.__PM_AUTOREFILL_KJD__ = true;


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
      for (const key of ['autocatch', 'autorefill', 'bestiario']) { const item = entries.get(key); if (item) dock.appendChild(item.button); }
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
    window.addEventListener('resize', () => { for (const { pane } of entries.values()) clamp(pane); });
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
  const STORAGE = 'pm-autorefill-kjd-v1';
  const ITEMS = [
    { key: 'ball:pokeball', name: 'Poké Ball', kind: 'ball', item: 'pokeball', price: 15, max: 10000 },
    { key: 'ball:great', name: 'Great Ball', kind: 'ball', item: 'great', price: 40, max: 10000 },
    { key: 'ball:super', name: 'Super Ball', kind: 'ball', item: 'super', price: 50, max: 10000 },
    { key: 'ball:ultra', name: 'Ultra Ball', kind: 'ball', item: 'ultra', price: 80, max: 10000 },
    { key: 'potion:small', name: 'Small Potion', kind: 'potion', item: 'small', price: 10, max: 1000 },
    { key: 'potion:great', name: 'Great Potion', kind: 'potion', item: 'great', price: 25, max: 1000 },
    { key: 'potion:hyper', name: 'Hyper Potion', kind: 'potion', item: 'hyper', price: 50, max: 1000 },
    { key: 'potion:ultra', name: 'Ultra Potion', kind: 'potion', item: 'ultra', price: 90, max: 1000 },
    { key: 'potion:ultimate', name: 'Ultimate Potion', kind: 'potion', item: 'ultimate', price: 150, max: 1000 }
  ];
  const defaults = () => ({
    enabled: false, sellFirst: false, interval: 30, maxSpendCycle: 100000,
    collapsed: false, x: null, y: null,
    items: Object.fromEntries(ITEMS.map(i => [i.key, { enabled: false, min: 100, target: 500 }]))
  });
  let settings = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    settings = {
      ...settings, ...saved,
      items: Object.fromEntries(ITEMS.map(i => [i.key, { ...settings.items[i.key], ...(saved.items?.[i.key] || {}) }]))
    };
  } catch (_) { /* start with safe defaults */ }
  // Restore only the state explicitly selected by the user. Errors still disable it.
  settings.enabled = settings.enabled === true;
  const COOLDOWN = STORAGE + ':next-run';
  const rememberNextRun = value => { nextRun = value; localStorage.setItem(COOLDOWN, String(value)); };
  const save = () => localStorage.setItem(STORAGE, JSON.stringify(settings));
  // K is the current inventory used by the shop. gameState is a lexical
  // global in current builds; it is not exposed as window.gameState.
  const state = () => {
    if (window.__idleMoonCard) return window.__idleMoonCard.state;
    try { if (typeof K !== 'undefined' && K?.balls && K?.potions) return K; } catch (_) {}
    try { if (typeof Ktela === 'function') { const s = Ktela(); if (s?.balls && s?.potions) return s; } } catch (_) {}
    try { if (typeof gameState !== 'undefined' && gameState?._kTelaUlt) return gameState._kTelaUlt; } catch (_) {}
    return window.gameState?._kTelaUlt || null;
  };
  const action = (name, payload) => window.__idleMoonCard
    ? window.__idleMoonCard.action(name, payload) : window.Y(name, payload);
  const stock = (i) => {
    const n = (i.kind === 'ball' ? state()?.balls : state()?.potions)?.[i.item];
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const int = (v, low, high) => Math.min(high, Math.max(low, Math.floor(Number(v) || 0)));
  const money = n => '$ ' + n.toLocaleString('pt-BR');
  let busy = false, timer = null, nextRun = Math.max(0, Number(localStorage.getItem(COOLDOWN)) || 0), spentCycle = 0, statusText = settings.enabled ? 'Monitorando estoque' : 'Em pausa', lastSuccess = '—';
  let root, toggle, indicator, statusEl, summaryEl, itemRows = new Map();

  function log(message, error = false) {
    statusText = message;
    if (statusEl) statusEl.textContent = message;
    if (indicator) indicator.className = error ? 'kjd-dot moon-dot error' : settings.enabled ? 'kjd-dot moon-dot on' : 'kjd-dot moon-dot';
    console[error ? 'warn' : 'info']('[PM AutoRefill]', message);
  }
  function update() {
    if (window.__idleMoonCard) {
      let badge = document.getElementById('idlemoon-refill-card');
      if (!badge && document.body) {
        badge = document.createElement('div'); badge.id = 'idlemoon-refill-card';
        badge.style.cssText = 'padding:10px;border:1px solid #71618c;border-radius:8px;font:12px Segoe UI;color:#f3d98a;background:#11152b';
        document.body.append(badge);
      }
      if (badge) badge.textContent = 'AutoRefill ' + (settings.enabled ? 'ligado' : 'desligado') + ' · ' + statusText + (state()?.potions ? ' · Ultimate: ' + (state().potions.ultimate ?? '—') : ' · aguardando inventário');
      return;
    }
    if (!root) return;
    root.classList.toggle('kjd-collapsed', settings.collapsed);
    root.classList.toggle('moon-active', settings.enabled);
    toggle.textContent = settings.enabled ? '⏹ Desativar AutoRefill' : '▶ Ativar AutoRefill';
    toggle.classList.toggle('active', settings.enabled);
    for (const i of ITEMS) {
      const r = itemRows.get(i.key);
      if (r) r.textContent = stock(i) === null ? '—' : stock(i).toLocaleString('pt-BR');
    }
    summaryEl.querySelector('[data-spent]').textContent = money(spentCycle);
    summaryEl.querySelector('[data-last]').textContent = lastSuccess;
  }
  function validConfig(i) {
    const c = settings.items[i.key];
    const min = int(c.min, 0, 100000000);
    const target = int(c.target, 0, 100000000);
    return c.enabled && target > min ? { min, target } : null;
  }
  const responseError = (result) => !result || (typeof result === 'object' && (result.err || result.error));

  // If the game hasn't refreshed its inventory after a request, do not issue another.
  async function waitStockChange(i, before, timeout = 6500) {
    const until = Date.now() + timeout;
    while (Date.now() < until) {
      const current = stock(i);
      if (current !== null && current !== before) return current;
      await sleep(250);
    }
    return stock(i);
  }
  async function cycle() {
    if (!settings.enabled || busy || Date.now() < nextRun) return;
    if (!window.__idleMoonCard && typeof window.Y !== 'function') return log('Aguardando função do jogo Y()...');
    if (!state()?.balls || !state()?.potions) return log('Aguardando inventário do jogo...');
    const needs = ITEMS.filter(i => {
      const c = validConfig(i), have = stock(i);
      return c && have !== null && have < c.min;
    });
    if (!needs.length) return log('Estoque dentro dos limites');
    busy = true;
    rememberNextRun(Date.now() + Math.max(30, int(settings.interval, 10, 3600)) * 1000);
    spentCycle = 0;
    try {
      if (settings.sellFirst) {
        log('Vendendo loot antes das compras...');
        // Equivalent to the Mark's "Vender tudo" action. Never sell on its own cycle.
        const sold = await action('sellLoot', { items: 'all' });
        if (responseError(sold)) throw new Error('Venda recusada; compras canceladas');
        await sleep(500);
      }
      const limit = int(settings.maxSpendCycle, 0, 1000000000);
      if (limit < 1) throw new Error('Limite de gastos do ciclo é zero');
      for (const i of needs) {
        if (!settings.enabled) break;
        const c = validConfig(i), have = stock(i);
        if (!c || have === null || have >= c.min) continue;
        const budget = limit - spentCycle;
        const qty = Math.min(i.max, c.target - have, Math.floor(budget / i.price));
        if (qty <= 0) continue;
        log(`Comprando ${qty.toLocaleString('pt-BR')} × ${i.name}...`);
        const result = await action('buy', { item: i.item, qty, kind: i.kind });
        if (responseError(result)) throw new Error(`Compra recusada: ${i.name}`);
        const after = await waitStockChange(i, have);
        if (after === null || after <= have) {
          throw new Error(`Sem confirmação de estoque: ${i.name}. Parado para evitar duplicidade`);
        }
        // Charge budget against requested amount (conservative) even if a concurrent consumption occurred.
        spentCycle += qty * i.price;
        lastSuccess = `${i.name} +${(after - have).toLocaleString('pt-BR')}`;
        update();
        await sleep(650);
      }
      log('Ciclo concluído');
    } catch (e) {
      settings.enabled = false;
      save();
      log(e.message || 'Erro na operação. AutoRefill desligado', true);
    } finally {
      busy = false;
      rememberNextRun(Date.now() + Math.max(10, int(settings.interval, 10, 3600)) * 1000);
      update();
    }
  }

  function make(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function numericSetting(label, value, min, max, set, step = 1) {
    const wrap = make('label', 'kjd-field moon-line');
    wrap.append(make('span', '', label));
    const input = make('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.value = value;
    input.addEventListener('change', () => { const n = int(input.value, min, max); input.value = n; set(n); save(); update(); });
    wrap.append(input);
    return wrap;
  }
  function render() {
    if (document.getElementById('kjd-autorefill') || window.__idleMoonCard) return;
    const style = make('style');
    moonPanelTheme();
    style.textContent = `
      #kjd-autorefill{width:365px;z-index:99000;display:flex;flex-direction:column}#kjd-autorefill .kjd-head{flex-shrink:0}#kjd-autorefill .kjd-title{display:flex;align-items:center;gap:0}#kjd-autorefill .kjd-dot.on{background:#4cda93;box-shadow:0 0 6px #4cda93}#kjd-autorefill .kjd-dot.error{background:#e77b78}
      #kjd-autorefill.kjd-collapsed .kjd-content,#kjd-autorefill.kjd-collapsed .kjd-actions{display:none}#kjd-autorefill .kjd-content{max-height:calc(100vh - 166px);overflow-y:auto;min-height:0;flex:1}#kjd-autorefill .kjd-actions{padding:0 11px 11px;border-top:1px solid #293346;flex-shrink:0}#kjd-autorefill .kjd-options{display:grid;grid-template-columns:1fr;gap:0}#kjd-autorefill .kjd-field{min-width:0}#kjd-autorefill .kjd-field input{width:84px}
      #kjd-autorefill .kjd-item,#kjd-autorefill .kjd-cols{display:grid;grid-template-columns:16px minmax(75px,1fr) 49px 51px 51px;gap:5px;align-items:center}#kjd-autorefill .kjd-item{padding:6px 0;border-bottom:1px solid #293346}#kjd-autorefill .kjd-item input[type=number]{width:100%;padding:5px 2px;text-align:center}#kjd-autorefill .kjd-item input[type=checkbox]{margin:0}#kjd-autorefill .kjd-cols{color:#8898ae;font-size:10px}#kjd-autorefill .kjd-stock{font-size:11px;color:#ffdb78;font-variant-numeric:tabular-nums}#kjd-autorefill .kjd-section{margin-top:12px}#kjd-autorefill .kjd-help{margin:9px 0}#kjd-autorefill .kjd-status{min-width:0}#kjd-autorefill .kjd-warning{text-align:center}
      @media(max-width:390px){#kjd-autorefill{width:calc(100vw - 16px)}#kjd-autorefill .kjd-item,#kjd-autorefill .kjd-cols{grid-template-columns:16px minmax(65px,1fr) 42px 45px 45px;gap:3px}}
    `;
    document.head.append(style);
    root = make('div', 'moon-panel'); root.id = 'kjd-autorefill';
    const head = make('div', 'kjd-head moon-head'); indicator = make('i', 'kjd-dot moon-dot');
    const title = make('span', 'kjd-title moon-title', 'AutoRefill'); title.append(indicator);
    toggle = make('button', 'kjd-toggle moon-go', '▶ Ativar AutoRefill');
    toggle.addEventListener('click', () => {
      if (busy && settings.enabled) { settings.enabled = false; log('Desligando após requisição atual'); }
      else { settings.enabled = !settings.enabled; log(settings.enabled ? 'Ligado; verificando estoque...' : 'Desligado'); }
      save(); update(); if (settings.enabled) cycle();
    });
    const collapse = make('button', '', '−'); collapse.title = 'Minimizar';
    collapse.addEventListener('click', () => { settings.collapsed = !settings.collapsed; collapse.textContent = settings.collapsed ? '+' : '−'; save(); update(); });
    const close=make('button','','×');close.title='Fechar painel';close.onclick=()=>{root.hidden=true;document.querySelectorAll('#kjd-moon-dock button').forEach(b=>b.classList.remove('active'))};
    const icon = kjdPixelIcon(KJD_ICON_SPEC); if (icon) head.append(icon); head.append(title,collapse,close); root.append(head);
    const body = make('div', 'kjd-content moon-body');
    statusEl = make('span', 'kjd-status', statusText);
    const stateLine = make('div', 'moon-state'); stateLine.append(statusEl, make('span', '', 'POKE MOON')); body.append(stateLine);
    summaryEl = make('div', 'moon-metrics');
    for (const [key, label] of [['spent', 'Gasto no ciclo'], ['last', 'Última compra']]) {
      const metric = make('div', 'moon-metric'); const value = make('strong', key === 'last' ? 'moon-value-text' : '', key === 'last' ? '—' : money(spentCycle)); value.dataset[key] = ''; metric.append(make('small', '', label), value); summaryEl.append(metric);
    } body.append(summaryEl);
    body.append(make('p','kjd-help moon-note','Ative cada item e defina: mínimo = gatilho; alvo = estoque desejado. Ligado/desligado é mantido após recarregar.'));
    const sellLabel = make('label', 'moon-line'); const sell = make('input'); sell.type = 'checkbox'; sell.checked = !!settings.sellFirst;
    sell.addEventListener('change', () => { settings.sellFirst = sell.checked; save(); });
    sellLabel.append(document.createTextNode('Vender tudo antes de comprar'), sell);
    body.append(sellLabel);
    const options = make('div', 'kjd-options');
    options.append(numericSetting('Verificar a cada (s)', settings.interval, 10, 3600, n => settings.interval = n),
      numericSetting('Máx. gasto/ciclo ($)', settings.maxSpendCycle, 0, 1000000000, n => settings.maxSpendCycle = n));
    body.append(options);
    for (const kind of ['ball','potion']) {
      body.append(make('div','kjd-section moon-section',kind === 'ball' ? 'POKÉBOLAS' : 'POTIONS'));
      const cols = make('div','kjd-cols');
      for (const txt of ['','Item','Estoque','Mínimo','Alvo']) cols.append(make('span','',txt));
      body.append(cols);
      for (const i of ITEMS.filter(x => x.kind === kind)) {
        const c = settings.items[i.key], row = make('div','kjd-item');
        const chk = make('input'); chk.type = 'checkbox'; chk.checked = !!c.enabled;
        chk.addEventListener('change', () => { c.enabled = chk.checked; save(); });
        const name = make('span','',i.name); const qty = make('span','kjd-stock','—'); itemRows.set(i.key,qty);
        const min = make('input'); min.type = 'number'; min.min = '0'; min.max = '100000000'; min.value = c.min;
        min.title = 'Comprar quando o estoque ficar abaixo deste valor';
        const target = make('input'); target.type = 'number'; target.min = '0'; target.max = '100000000'; target.value = c.target;
        target.title = 'Quantidade de estoque desejada';
        min.addEventListener('change', () => { c.min = int(min.value,0,100000000); min.value = c.min; save(); });
        target.addEventListener('change', () => { c.target = int(target.value,0,100000000); target.value = c.target; save(); });
        row.append(chk,name,qty,min,target); body.append(row);
      }
    }
    const actions = make('div', 'kjd-actions');
    actions.append(toggle,make('div','kjd-warning moon-foot','Em erros ou estoque não confirmado, o AutoRefill desliga.\nVenda "tudo" segue as regras do Mark.'));
    root.append(body, actions); document.body.append(root);
    addMoonDockButton('autorefill','AutoRefill',kjdPixelIcon(KJD_ICON_SPEC),root);
    moonDock().drag(root, head, { position: { x: settings.x, y: settings.y }, onSave: p => { settings.x = p.x; settings.y = p.y; save(); } });
    update();
  }
  function boot() {
    if (!document.body) return setTimeout(boot, 300);
    render();
    window.__idleMoonRefillTick = () => { update(); return settings.enabled ? cycle() : Promise.resolve(); };
    timer = setInterval(() => {
      update();
      if (settings.enabled) cycle();
    }, 2000);
  }
  boot();
})();

