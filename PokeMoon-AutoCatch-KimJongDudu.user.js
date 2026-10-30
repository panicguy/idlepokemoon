// ==UserScript==
// @name         Poke Moon AutoCatch by KimJongDudu
// @namespace    https://idlepokemoon.com.br/
// @version      1.5.2
// @description  Auto Lançar em Minhas Capturas, com painel no dock lateral
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @idlemoon-card autocatch-v1
// ==/UserScript==

(() => {
  'use strict';
  const KJD_ICON_SPEC={"w":15,"h":15,"c":"AAAAAAA4QP8MDAz/ADhB/6moKv/OywD/rq0X/zk7NP8uMDD/AFRl//DwAP+EhEH/XFxT/1hWVP9cXk//MjIy/xwcHP8AVWb/AIWr////AP/3+o3/cXFP/1VVVf9yck7/qKUs/z09Ov8SEhL/AIKp/0vG2//4+/3/+fq+/9LSAP+TkDD/Q0E5/zg4OP8AMTX/AGiG/wCJrf9Wyt7/ALvU/67iMP+/vwD/gYEm/zw8PP8mJib/CwsL/wBrh/8Ac5L/ALLM/wCcwP8Amr7/AJm7/wCWt/8AXWr/NjY2/ygoKP8AdZD/AHSS/wCKrP8AkrX/AJm8/wZlcv88Pj3/MTEx/ysrK/8kJCT/Ghoa/yIiIv8GGR//AEpW/wB+nv8Aepf/AH+d/wBkd/8fHx//HzI5/wCfv/8AjrD/X2Vt/7Oxuf8WFhb/UmBp/xwoLv/78Pn/f5Oe/6O8yf+en6j/i6Ov/0xmb/9cdn//fpeg/xUnLv/J0dz/","p":"AAAAAAABAQECAgAAAAAAAAAAAQMEBQYHCAICAAAAAAABCQUKCwwNDg8QAgAAAAEREhMUFRYXGBkPGgIAAAEbHB0eFBMfICEiDwIAIyQlJicoKCkqKysrIiwtIy4vMDEyMzQzNTYPNywtIzg5Ojs8MT0+P0BBQkMtREVGR0hJLS0tQixKQxpEREtFTE0jTk9OLTdBUEtEAEtRRERST1NPUkREUUsAAERUVVFSTlZOUlFXWEQAAABEWVNaUlJSWVVZWwAAAAAAW0tVXFxVV0tbAAAAAAAAAABbW1tbWwAAAAAA"};
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
  if (window.__kimPokeMoonAutoCatch) return;
  window.__kimPokeMoonAutoCatch = true;

  const KEY = 'kim-pokemoon-autocatch-settings';
  const defaults = { enabled: false, shiny: true, intervalMs: 1250 };
  let settings;
  try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { settings = { ...defaults }; }
  let sent = 0, lastAttempt = 0, panel, status, toggle, count, menuButton;
  const save = () => localStorage.setItem(KEY, JSON.stringify(settings));
  if (window.__idleMoonCard) {
    let running = false, message = 'Aguardando capturas';
    const ATTEMPT = KEY + ':card-attempt';
    lastAttempt = Number(localStorage.getItem(ATTEMPT)) || 0;
    const interval = () => Math.max(750, Math.min(3000, Number(settings.intervalMs) || 1250));
    function renderCard() {
      let badge = document.getElementById('idlemoon-catch-card');
      if (!badge && document.body) {
        badge = document.createElement('div'); badge.id = 'idlemoon-catch-card';
        badge.style.cssText = 'padding:10px;border:1px solid #71618c;border-radius:8px;font:12px Segoe UI;color:#f3d98a;background:#11152b';
        document.body.append(badge);
      }
      const captures = window.__idleMoonCard.state?.captures;
      if (badge) badge.textContent = 'AutoCatch ' + (settings.enabled ? 'ligado' : 'desligado') + ' · ' + message + ' · Lançamentos aceitos: ' + sent + ' · Na lista: ' + (Array.isArray(captures) ? captures.length : '—');
    }
    async function tickCard() {
      if (!settings.enabled || running) { renderCard(); return; }
      const bridge = window.__idleMoonCard;
      const state = bridge.state;
      if (!state || !Array.isArray(state.captures)) { message = 'Aguardando inventário do Card'; renderCard(); return; }
      const capture = state.captures.find(c => settings.shiny || !c.shiny);
      if (!capture) { message = 'Aguardando capturas'; renderCard(); return; }
      if (!state.auto?.ball) { message = 'Selecione uma bola no jogo'; renderCard(); return; }
      if (Date.now() - lastAttempt < interval()) { renderCard(); return; }
      running = true;
      lastAttempt = Date.now(); localStorage.setItem(ATTEMPT, String(lastAttempt));
      try {
        await bridge.action('throwBall', { captureId: capture.id, ball: state.auto.ball });
        sent++; message = 'Lançamento enviado';
      } catch (e) {
        message = e.message || 'Lançamento recusado';
        // Falha de rede ou recusa: espera antes de tentar novamente.
        lastAttempt = Date.now() + 5000; localStorage.setItem(ATTEMPT, String(lastAttempt));
      } finally { running = false; renderCard(); }
    }
    window.__idleMoonCatchTick = tickCard;
    setInterval(() => { tickCard().catch(() => {}); }, 500);
    renderCard();
    return;
  }


  // Sidebar shared by the three independent Poke Moon scripts.
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
  function addMoonDockButton(id, label, image, pane) { return moonDock().register(id, label, image, pane); }
  // END SHARED MOON DOCK
  const css = document.createElement('style');
  css.textContent = `
    #kim-pm-panel {position:fixed;top:145px;right:28px;width:292px;max-width:calc(100vw - 20px);z-index:99000;box-sizing:border-box;overflow:hidden;
      background:linear-gradient(145deg,#182238,#101724 55%,#0b111e);border:1px solid #816e43;border-radius:10px;
      color:#e8edf6;font:12px/1.35 system-ui,"Segoe UI",sans-serif;box-shadow:0 2px 0 #3a3223 inset,0 12px 38px #000b}
    #kim-pm-panel[hidden]{display:none!important}
    #kim-pm-panel *{box-sizing:border-box}
    #kim-pm-panel .kim-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(#303342,#222838);
      border-bottom:1px solid #685936;cursor:move;user-select:none;touch-action:none}
    #kim-pm-panel .kim-head img{width:22px;height:22px;object-fit:contain}
    #kim-pm-panel .kim-title{font-weight:850;color:#f4e4b8;letter-spacing:.2px;flex:1}
    #kim-pm-panel .kim-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#64748b;margin-right:5px}
    #kim-pm-panel.kim-active .kim-dot{background:#4cda93;box-shadow:0 0 6px #4cda93}
    #kim-pm-panel button{font:inherit;font-weight:750;cursor:pointer}
    #kim-pm-panel .kim-head button{background:#111827;border:1px solid #4d556b;color:#e8edf6;border-radius:5px;width:23px;height:23px;padding:0;font-size:16px}
    #kim-pm-panel .kim-body{padding:11px}
    #kim-pm-panel.kim-collapsed .kim-body{display:none}
    #kim-pm-panel .kim-state{padding:7px 9px;border:1px solid #31445c;background:#101c2a;border-radius:7px;color:#aebdd1;
      display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px}
    #kim-pm-panel.kim-active .kim-state{border-color:#326950;color:#8becbb}
    #kim-pm-panel .kim-metrics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0}
    #kim-pm-panel .kim-metric{padding:9px;border:1px solid #303c50;border-radius:7px;background:#101a2b}
    #kim-pm-panel .kim-metric small{display:block;color:#8898ae;font-size:10px}
    #kim-pm-panel .kim-metric strong{display:block;color:#ffdb78;font-size:19px;line-height:1.4;font-variant-numeric:tabular-nums}
    #kim-pm-panel .kim-line{display:flex;justify-content:space-between;align-items:center;gap:7px;padding:7px 1px;
      border-top:1px solid #293346;color:#d2deed}
    #kim-pm-panel .kim-line input[type=number]{width:84px;padding:5px;border:1px solid #485b77;border-radius:5px;
      color:#f7e9c8;background:#0d1727;outline:none;font:inherit}
    #kim-pm-panel .kim-line input[type=checkbox]{accent-color:#d2ae5a;width:16px;height:16px}
    #kim-pm-panel .kim-go{width:100%;margin-top:9px;background:linear-gradient(#3a785b,#20593c);color:#eafff1;
      border:1px solid #59ad7c;border-radius:7px;padding:10px 8px}
    #kim-pm-panel.kim-active .kim-go{background:linear-gradient(#7a4549,#5b282f);border-color:#b76369;color:#ffe1e1}
    #kim-pm-panel .kim-foot{font-size:10px;line-height:1.4;margin-top:8px;color:#8190a5;text-align:center}
    #kim-pm-panel .kim-grip{position:absolute;right:1px;bottom:1px;width:11px;height:11px;pointer-events:none;
      border-right:2px solid #72613f;border-bottom:2px solid #72613f;border-radius:0 0 7px 0}
    #kim-pm-menu-entry{display:flex;align-items:center;justify-content:center;flex-direction:column;
      gap:4px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;padding:6px}
    #kim-pm-menu-entry img{width:32px;height:32px;object-fit:contain}
    @media(max-width:500px){#kim-pm-panel{top:85px;right:8px;width:270px}}
  `;
  (document.head || document.documentElement).appendChild(css);

  function render() {
    if (!panel) return;
    panel.classList.toggle('kim-active', !!settings.enabled);
    toggle.textContent = settings.enabled ? '⏹ Desativar AutoCatch' : '▶ Ativar AutoCatch';
    status.textContent = settings.enabled ? 'Monitorando capturas' : 'Em pausa';
    count.textContent = String(sent);
    const queue = panel.querySelector('[data-queue]');
    if (queue) queue.textContent = document.querySelectorAll('#cp-list .cp-row').length;
  }

  function createPanel() {
    if (panel || !document.body) return;
    panel = document.createElement('section');
    panel.id = 'kim-pm-panel';
    panel.hidden = true;
    panel.className = 'panel hud';
    panel.innerHTML = `
      <div class="kim-head drag-handle" title="Arraste para mover">
        <span data-moon-head-icon></span><span class="kim-title">AutoCatch <span class="kim-dot"></span></span>
        <button type="button" data-min title="Minimizar">−</button>
        <button type="button" data-close title="Fechar">×</button>
      </div>
      <div class="kim-body">
        <div class="kim-state"><span data-status>Em pausa</span><span>POKE MOON</span></div>
        <div class="kim-metrics">
          <div class="kim-metric"><small>Lançamentos</small><strong data-count>0</strong></div>
          <div class="kim-metric"><small>Na lista</small><strong data-queue>0</strong></div>
        </div>
        <label class="kim-line"><span>✨ Incluir shinies</span><input type="checkbox" data-shiny></label>
        <label class="kim-line"><span>⏱ Intervalo de lançamento</span><input type="number" min="750" max="3000" step="250" data-interval></label>
        <button type="button" class="kim-go" data-toggle></button>
        <div class="kim-foot">Conta cliques enviados, não capturas confirmadas.<br>Em abas suspensas, o navegador pode interromper a execução.</div>
      </div><i class="kim-grip" aria-hidden="true"></i>
    `;
    document.body.appendChild(panel);
    const headIcon=panel.querySelector('[data-moon-head-icon]');const renderedIcon=kjdPixelIcon(KJD_ICON_SPEC);if(renderedIcon)headIcon.replaceWith(renderedIcon);else headIcon.textContent='🌙';
    status = panel.querySelector('[data-status]');
    toggle = panel.querySelector('[data-toggle]');
    count = panel.querySelector('[data-count]');
    const shiny = panel.querySelector('[data-shiny]');
    const interval = panel.querySelector('[data-interval]');
    shiny.checked = !!settings.shiny;
    interval.value = settings.intervalMs;
    panel.querySelector('[data-close]').addEventListener('click', () => { panel.hidden = true; document.querySelectorAll('#kjd-moon-dock button').forEach(b => b.classList.remove('active')); });
    panel.querySelector('[data-min]').addEventListener('click', () => {
      panel.classList.toggle('kim-collapsed');
      panel.querySelector('[data-min]').textContent = panel.classList.contains('kim-collapsed') ? '+' : '−';
    });
    moonDock().drag(panel, panel.querySelector('.kim-head'), { storageKey: KEY + ':panel-position' });
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
      // Chama a rotina vinculada pelo jogo diretamente, sem emitir evento de clique.
      if (typeof button.onclick !== 'function') return;
      button.onclick();
      sent++;
      render();
    } catch (error) {
      console.warn('[Poke Moon AutoCatch] Falha no clique:', error);
    }
  }

  function init() {
    createPanel();
    addMoonDockButton('autocatch', 'AutoCatch - Moon Ball', kjdPixelIcon(KJD_ICON_SPEC), panel);
    setInterval(tick, 500);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

