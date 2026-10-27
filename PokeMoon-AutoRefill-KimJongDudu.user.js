// ==UserScript==
// @name         PokeMoon AutoRefill by KimJongDudu
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.0.0
// @description  Reabastece Pokebolas e Potions com estoque-alvo; venda opcional do loot antes da compra. Independente do AutoCatch.
// @match        https://idlepokemoon.com.br/play*
// @match        https://www.idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.__PM_AUTOREFILL_KJD__) return;
  window.__PM_AUTOREFILL_KJD__ = true;

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
  // Never automatically resume purchases merely because a tab was reloaded.
  settings.enabled = false;
  const save = () => localStorage.setItem(STORAGE, JSON.stringify(settings));
  const state = () => window.gameState?._kTelaUlt;
  const stock = (i) => {
    const n = (i.kind === 'ball' ? state()?.balls : state()?.potions)?.[i.item];
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const int = (v, low, high) => Math.min(high, Math.max(low, Math.floor(Number(v) || 0)));
  const money = n => '$ ' + n.toLocaleString('pt-BR');
  let busy = false, timer = null, nextRun = 0, spentCycle = 0, statusText = 'Desligado', lastSuccess = '—';
  let root, toggle, indicator, statusEl, summaryEl, itemRows = new Map();

  function log(message, error = false) {
    statusText = message;
    if (statusEl) statusEl.textContent = message;
    if (indicator) indicator.className = error ? 'kjd-dot error' : settings.enabled ? 'kjd-dot on' : 'kjd-dot';
    console[error ? 'warn' : 'info']('[PM AutoRefill]', message);
  }
  function update() {
    if (!root) return;
    root.classList.toggle('kjd-collapsed', settings.collapsed);
    toggle.textContent = settings.enabled ? 'Ligado' : 'Desligado';
    toggle.classList.toggle('active', settings.enabled);
    for (const i of ITEMS) {
      const r = itemRows.get(i.key);
      if (r) r.textContent = stock(i) === null ? '—' : stock(i).toLocaleString('pt-BR');
    }
    summaryEl.textContent = `Última compra: ${lastSuccess} · Gasto no ciclo: ${money(spentCycle)}`;
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
    if (typeof window.Y !== 'function') return log('Aguardando função do jogo Y()...');
    if (!state()?.balls || !state()?.potions) return log('Aguardando inventário do jogo...');
    const needs = ITEMS.filter(i => {
      const c = validConfig(i), have = stock(i);
      return c && have !== null && have < c.min;
    });
    if (!needs.length) return log('Estoque dentro dos limites');
    busy = true;
    spentCycle = 0;
    try {
      if (settings.sellFirst) {
        log('Vendendo loot antes das compras...');
        // Equivalent to the Mark's "Vender tudo" action. Never sell on its own cycle.
        const sold = await window.Y('sellLoot', { items: 'all' });
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
        const result = await window.Y('buy', { item: i.item, qty, kind: i.kind });
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
      nextRun = Date.now() + Math.max(10, int(settings.interval, 10, 3600)) * 1000;
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
    const wrap = make('label', 'kjd-field');
    wrap.append(make('span', '', label));
    const input = make('input'); input.type = 'number'; input.min = min; input.max = max; input.step = step; input.value = value;
    input.addEventListener('change', () => { const n = int(input.value, min, max); input.value = n; set(n); save(); update(); });
    wrap.append(input);
    return wrap;
  }
  function render() {
    if (document.getElementById('kjd-autorefill')) return;
    const style = make('style');
    style.textContent = `
      #kjd-autorefill{position:fixed;z-index:2147483500;top:140px;right:20px;width:365px;max-width:calc(100vw - 24px);color:#eae5d8;font:12px/1.4 Arial,sans-serif;background:linear-gradient(160deg,#242931,#11171d);border:1px solid #9f8150;border-radius:11px;box-shadow:0 7px 28px #000b;overflow:hidden}
      #kjd-autorefill *{box-sizing:border-box}#kjd-autorefill .kjd-head{display:flex;align-items:center;gap:9px;padding:11px 12px;background:linear-gradient(90deg,#222a32,#333027);border-bottom:1px solid #715c38;cursor:move;user-select:none}
      #kjd-autorefill .kjd-title{font-size:14px;font-weight:800;color:#f6d592;flex:1}#kjd-autorefill .kjd-dot{height:8px;width:8px;border-radius:50%;background:#888}#kjd-autorefill .kjd-dot.on{background:#63ce87;box-shadow:0 0 6px #63ce87}#kjd-autorefill .kjd-dot.error{background:#e77b78}
      #kjd-autorefill button{border:1px solid #8f7349;background:#2e3842;color:#f5e4bd;border-radius:6px;cursor:pointer;padding:5px 8px;font-weight:bold}#kjd-autorefill button:hover{background:#46505a}#kjd-autorefill .kjd-toggle.active{background:#236747;color:#fff;border-color:#3ea56b}
      #kjd-autorefill .kjd-content{padding:10px 12px;max-height:min(70vh,660px);overflow:auto}#kjd-autorefill.kjd-collapsed .kjd-content{display:none}#kjd-autorefill .kjd-help{color:#aeb5b8;font-size:11px;margin:0 0 9px}
      #kjd-autorefill .kjd-options{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:9px 0}#kjd-autorefill .kjd-field{display:flex;align-items:center;gap:5px;flex:1;min-width:125px;justify-content:space-between;color:#d4c9b4}#kjd-autorefill .kjd-field input{width:72px;min-width:0}
      #kjd-autorefill input[type=number]{background:#10191d;color:#f3dcaa;border:1px solid #65645d;border-radius:4px;padding:4px 3px;font:inherit}#kjd-autorefill input[type=checkbox]{accent-color:#c89a43}
      #kjd-autorefill .kjd-section{color:#e0bd79;font-weight:800;letter-spacing:.06em;margin:11px 0 5px;border-bottom:1px solid #4f4940;padding-bottom:4px}#kjd-autorefill .kjd-item{display:grid;grid-template-columns:19px minmax(97px,1fr) 70px 56px 56px;align-items:center;gap:5px;border-bottom:1px solid #323b40;padding:6px 0}
      #kjd-autorefill .kjd-item input[type=number]{width:100%;text-align:center}#kjd-autorefill .kjd-stock{color:#c9ae7a;font-size:11px}#kjd-autorefill .kjd-cols{display:grid;grid-template-columns:19px minmax(97px,1fr) 70px 56px 56px;gap:5px;color:#8d9da3;font-size:10px}
      #kjd-autorefill .kjd-status{color:#e0bd79;font-size:11px;margin-top:8px;overflow-wrap:anywhere}#kjd-autorefill .kjd-summary{color:#93a1a8;font-size:10px;margin-top:4px}#kjd-autorefill .kjd-warning{color:#d8aa7b;font-size:10px;margin-top:8px}
    `;
    document.head.append(style);
    root = make('div'); root.id = 'kjd-autorefill';
    const head = make('div', 'kjd-head'); indicator = make('i', 'kjd-dot');
    const title = make('span', 'kjd-title', 'AutoRefill · KimJongDudu');
    toggle = make('button', 'kjd-toggle', 'Desligado');
    toggle.addEventListener('click', () => {
      if (busy && settings.enabled) { settings.enabled = false; log('Desligando após requisição atual'); }
      else { settings.enabled = !settings.enabled; log(settings.enabled ? 'Ligado; verificando estoque...' : 'Desligado'); }
      save(); update(); if (settings.enabled) cycle();
    });
    const collapse = make('button', '', '−'); collapse.title = 'Minimizar';
    collapse.addEventListener('click', () => { settings.collapsed = !settings.collapsed; collapse.textContent = settings.collapsed ? '+' : '−'; save(); update(); });
    head.append(indicator, title, toggle, collapse); root.append(head);
    const body = make('div', 'kjd-content');
    body.append(make('p','kjd-help','Ative cada item e defina: mínimo = gatilho; alvo = estoque desejado. Configurações começam desativadas.'));
    const sellLabel = make('label'); const sell = make('input'); sell.type = 'checkbox'; sell.checked = !!settings.sellFirst;
    sell.addEventListener('change', () => { settings.sellFirst = sell.checked; save(); });
    sellLabel.append(sell, document.createTextNode(' Vender tudo antes de comprar'));
    body.append(sellLabel);
    const options = make('div', 'kjd-options');
    options.append(numericSetting('Verificar a cada (s)', settings.interval, 10, 3600, n => settings.interval = n),
      numericSetting('Máx. gasto/ciclo ($)', settings.maxSpendCycle, 0, 1000000000, n => settings.maxSpendCycle = n));
    body.append(options);
    for (const kind of ['ball','potion']) {
      body.append(make('div','kjd-section',kind === 'ball' ? 'POKÉBOLAS' : 'POTIONS'));
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
    statusEl = make('div','kjd-status',statusText);
    summaryEl = make('div','kjd-summary');
    body.append(statusEl,summaryEl,make('div','kjd-warning','Venda "tudo" usa as regras do Mark. Em erros ou estoque não confirmado, o AutoRefill desliga. Não funciona sem a função Y() do jogo.'));
    root.append(body); document.body.append(root);
    if (settings.x !== null && settings.y !== null) {
      root.style.left = `${Math.min(Math.max(0,settings.x),window.innerWidth - 60)}px`;
      root.style.top = `${Math.min(Math.max(0,settings.y),window.innerHeight - 40)}px`;
      root.style.right = 'auto';
    }
    let dragging = null;
    head.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      dragging = { x:e.clientX, y:e.clientY, left:root.getBoundingClientRect().left, top:root.getBoundingClientRect().top };
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointermove', e => {
      if (!dragging) return;
      root.style.left = `${Math.max(0,Math.min(window.innerWidth-60,dragging.left+e.clientX-dragging.x))}px`;
      root.style.top = `${Math.max(0,Math.min(window.innerHeight-40,dragging.top+e.clientY-dragging.y))}px`;
      root.style.right = 'auto';
    });
    head.addEventListener('pointerup', () => {
      if (!dragging) return; dragging=null;
      settings.x = Math.round(root.getBoundingClientRect().left);
      settings.y = Math.round(root.getBoundingClientRect().top); save();
    });
    head.addEventListener('pointercancel', () => dragging = null);
    update();
  }
  function boot() {
    if (!document.body) return setTimeout(boot, 300);
    render();
    timer = setInterval(() => {
      update();
      if (settings.enabled) cycle();
    }, 2000);
  }
  boot();
})();
