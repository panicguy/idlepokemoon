// ==UserScript==
// @name         Poke Moon AutoCatch by KimJongDudu
// @namespace    https://idlepokemoon.com.br/
// @version      1.2.1
// @description  Auto Lançar em Minhas Capturas, com atalho na Mochila
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.__kimPokeMoonAutoCatch) return;
  window.__kimPokeMoonAutoCatch = true;

  const KEY = 'kim-pokemoon-autocatch-settings';
  const defaults = { enabled: false, shiny: true, intervalMs: 1250 };
  let settings;
  try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { settings = { ...defaults }; }
  let sent = 0, lastAttempt = 0, panel, status, toggle, count, menuButton;
  const save = () => localStorage.setItem(KEY, JSON.stringify(settings));
  const icon = new URL('icons/pokebola.png', location.href).href;

  const css = document.createElement('style');
  css.textContent = `
    #kim-pm-panel { position: fixed; top: 125px; right: 15px; z-index: 999999;
      background: #111d2c; border: 1px solid #4675a0; color: #e9f5ff; border-radius: 12px;
      padding: 14px; width: 250px; font: 13px system-ui,sans-serif;
      box-shadow: 0 12px 36px #000a; }
    #kim-pm-panel[hidden] { display:none!important; }
    #kim-pm-panel header { display:flex; justify-content:space-between; align-items:center; font-weight:800; margin-bottom:12px; }
    #kim-pm-panel button { border: 1px solid #517a9b; border-radius: 7px;
      background: #244a6d; color: white; padding: 7px; cursor:pointer; }
    #kim-pm-panel .kim-line {display:flex;gap:8px;align-items:center;justify-content:space-between;margin:10px 0}
    #kim-pm-panel input[type=number] {width:75px;color:white;background:#142c43;border:1px solid #517a9b;padding:5px}
    #kim-pm-menu-entry {display:flex;align-items:center;justify-content:center;flex-direction:column;
      gap:4px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;padding:6px}
    #kim-pm-menu-entry img {width:32px;height:32px;object-fit:contain}
  `;
  (document.head || document.documentElement).appendChild(css);

  function render() {
    if (!panel) return;
    toggle.textContent = settings.enabled ? 'Desativar AutoCatch' : 'Ativar AutoCatch';
    toggle.style.background = settings.enabled ? '#176441' : '#244a6d';
    status.textContent = settings.enabled ? 'Ativo — aguardando capturas' : 'Desativado';
    count.textContent = String(sent);
  }

  function createPanel() {
    if (panel || !document.body) return;
    panel = document.createElement('section');
    panel.id = 'kim-pm-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <header><span>🔴 AutoCatch</span><button type="button" data-close>×</button></header>
      <div data-status></div>
      <div class="kim-line"><label>Capturar shinies</label><input type="checkbox" data-shiny></div>
      <div class="kim-line"><label>Intervalo (ms)</label><input type="number" min="750" max="3000" step="250" data-interval></div>
      <div class="kim-line"><span>Cliques enviados</span><b data-count>0</b></div>
      <button type="button" data-toggle style="width:100%"></button>
      <small>Continua enquanto o navegador mantiver a aba executando. Cliques não confirmam capturas.</small>
    `;
    document.body.appendChild(panel);
    status = panel.querySelector('[data-status]');
    toggle = panel.querySelector('[data-toggle]');
    count = panel.querySelector('[data-count]');
    const shiny = panel.querySelector('[data-shiny]');
    const interval = panel.querySelector('[data-interval]');
    shiny.checked = !!settings.shiny;
    interval.value = settings.intervalMs;
    panel.querySelector('[data-close]').addEventListener('click', () => { panel.hidden = true; });
    toggle.addEventListener('click', () => { settings.enabled = !settings.enabled; save(); render(); });
    shiny.addEventListener('change', () => { settings.shiny = shiny.checked; save(); });
    interval.addEventListener('change', () => {
      settings.intervalMs = Math.max(750, Math.min(3000, Number(interval.value) || 1250));
      interval.value = settings.intervalMs;
      save();
    });
    render();
  }

  function openPanel() {
    createPanel();
    if (panel) { panel.hidden = !panel.hidden; render(); }
  }

  function insertMenuEntry() {
    if (!document.body) return;
    const anchor = document.querySelector('#tbm-mochila');
    if (!anchor) return;
    if (!anchor.dataset.kimClickHook) {
      anchor.dataset.kimClickHook = '1';
      anchor.addEventListener('click', () => setTimeout(insertMenuEntry, 0));
    }

    // A bandeja do jogo muda dinamicamente. Identificamos o bloco por seus itens,
    // e nunca anexamos a opção à barra inteira do topo.
    const buttons = [...document.querySelectorAll('button,[role=menuitem]')];
    const normalize = el => (el.textContent || '').trim().toLowerCase();
    const mochilas = buttons.filter(b => normalize(b) === 'mochila');
    const consumiveis = buttons.filter(b => normalize(b).includes('consumíveis'));
    const capturas = buttons.filter(b => normalize(b).includes('minhas capturas'));
    for (const a of mochilas) {
      let ancestor = a.parentElement;
      for (let depth = 0; ancestor && depth < 4; depth++, ancestor = ancestor.parentElement) {
        if (!consumiveis.some(b => ancestor.contains(b)) ||
            !capturas.some(b => ancestor.contains(b))) continue;
        if (ancestor.id === 'topbar' || ancestor.contains(document.querySelector('#topbar'))) continue;
        if (ancestor.querySelector('#kim-pm-menu-entry')) return;
        menuButton = document.createElement('button');
        menuButton.id = 'kim-pm-menu-entry';
        menuButton.type = 'button';
        menuButton.innerHTML = '<img src="' + icon + '" alt=""><span>AutoCatch</span>';
        menuButton.addEventListener('click', e => {
          e.stopPropagation();
          openPanel();
        });
        ancestor.appendChild(menuButton);
        return;
      }
    }
  }

  function findLaunchButton() {
    for (const row of document.querySelectorAll('#cp-list .cp-row')) {
      if (!settings.shiny && row.classList.contains('shiny')) continue;
      const button = [...row.querySelectorAll('button')].find(b =>
        b.textContent.trim().toLowerCase() === 'lançar' &&
        !b.disabled && b.getClientRects().length > 0
      );
      if (button) return button;
    }
    return null;
  }

  function tick() {
    if (!settings.enabled) return;
    const now = Date.now();
    if (now - lastAttempt < settings.intervalMs) return;
    const button = findLaunchButton();
    if (!button) return;
    lastAttempt = now;
    try {
      button.click();
      sent++;
      render();
    } catch (error) {
      console.warn('[Poke Moon AutoCatch] Falha no clique:', error);
    }
  }

  function init() {
    createPanel();
    insertMenuEntry();
    const observer = new MutationObserver(() => insertMenuEntry());
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(tick, 500);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
