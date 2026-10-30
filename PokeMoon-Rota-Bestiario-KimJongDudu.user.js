// ==UserScript==
// @name         Poke Moon - Rota do Bestiário
// @namespace    local.pokemoon.bestiario
// @version      1.1.0
// @description  Visita hunts liberadas e captura uma espécie normal faltante por vez.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('ipm-rota-best')) return;
  // Usa o contexto principal da página. Não copia nem persiste a autenticação.
  const state = () => typeof K === 'object' && K && K.player ? K : null;
  const token = () => typeof q === 'string' ? q : '';
  const norm = s => String(s || '').toLowerCase();
  let running = false, busy = false, stopping = false, target = null, generation = 0;
  let actions = Promise.resolve();
  let retryAt = 0;
  let catalog = null, zones = [], allowed = new Set(), lastCatalog = 0;
  let lastStateAt = Date.now(), startedAt = 0, startBalls = 0;
  const completed = new Set();
  const totalBalls = s => Object.values(s.balls || {}).reduce((n, v) => n + Math.max(0, Number(v) || 0), 0);


  const KJD_MAGMAR_PIXELS={"w":35,"h":39,"c":"AAAAAEdHR1SfoZ4eKysrcBAIB/+Dg4MJ////A2JHJXZzcGwuU1FKU5KETv+Odij/jFsa/1NGMv5kWEZUakkZ/+3Vbv+mi1//W1tY0KlkJP/ryUj/796H//X19TTW1tYJNzc3ZuelLf/vyDH/kGcm/0tFRvy///8EyMnJ/6Wlpf9uYVTg2apI/3NnZf/V1dT/tLOz/1pYVv/Ym03/+NZn//DPPP/OmSz/jVYw/729vQ7lnij/89ZP/+i5M/+teCv/MBYP/5WUk1GtqqcuycnJCMO1riaXlZX/sGgd/8qnMf9NNxT/+Pr5/zc1NP1uWBr/qYoo/1MmEv+Mdm+pa1dU+1xQMv+plZL/aEpH+KhEL/9QGQ//sKahVqJtV/p3c3P/VUYX/7WXK/9UOC7/jish/9FHM//UiSj/czUY/42Jif/MOSf/rycW/9N0LP+LRhj/Sywp/ywjF/9wJRX/sDgm/7BVKv9pNi7/jiUW/8lZJP9rHBD/jFpQ/IyIhnCgnZ28yCsX/88yGv8yDQj/kzMk/5EbEf+mHhT/cSkj/6qmppB7aST/a2trtEQNCv+TaWf/mIQn/3VFKv2pf4D/kEcp/7MwGv8ZGRf/0opK/z8+Rf/SsjT/8KZR/4RlHv9zZR3/6Orp/7ylNP9nViD/Kygo/2xsbZ46NRv/dnd3lH6AfoI=","p":"AAAAAQEAAAAAAAAAAAACAwQDBQAAAAAAAAAAAAAAAAAAAAAABgEHBwECAAAAAAAACAkKCgsJBQAAAAAAAAAAAAAAAAAAAAAFBAwLDQgFAAAAAAUODxAQERIFAAAAAAAAAAAAAAAAAAAAAAUEExQVDQgWFhYXGA8ZGhscBgAAAAAAAAAAAAAAAAAAAAAdHh8gCyEhCiIjJCUbJicoKSogKwAAAAAAAAAAAAAAAAAAAAYeHyAMLCkKIiMkJRshJy0uLzAxAAAAADIyMwAABjQ0FwAABjUENiw3OCI5OTkjOjsuLRQ8MDEAAAAyBAQSAAAyPT0+AAAGNQQTISc3CyUjJD8bKRoUC0BBBgAAMUJDRCAARUY8Lxs+BgJHSDcnEC1JDxE/MDYpLik7SjUrADI/S0xEDTJGLzdNDEozEjgZJxAtKBoZOAQETjZNNhNOME8kMEtQUUQwPTw3TVJTVDMgVQwpGU0pKTZWRFZXWFhMTFdODVlaV1daRDA9LylSUlNUFwI/PTZbW1tbTFpaWldQTExbTEM9RFpRUVwwMEQPDFNTXV4GAF8EThNgTFtMS1pRYGFQTExMTFpEXFpaRGJiMDBiYlVeAAAAXwRcUVBMTGNkZVFgYWFQUFBMUFpEREQwYkRXV1YwQQYAAABfBFxaTExQUWRkUWBgYGBRUVBMV2I4ODBmV0xXVjAiKwAAAGc6XFpMUVFlZGRRUVFRUVFRYFBXYjtoPUNMV1pERARpAAAABhdCRFpkZGRkZGRkZGRkUVFgYVFiDDxoD05hXFxaYmkAAAAABj9qZEZdZlpaWlpaWWtGYGFgWmIbKWxIPVFEVltWbV4GAAAGJWplbkZKb29vcGYcNUZgYVFaPS8pC0g9XEROUltWcSsAAAYlYmRUVFkRIXJvRHFzY2BhWlYbPAtITkRiYg90TVNxKwAABiQiakoqRiZ1dS9tRGZRYFFcPTt2Oz1WVkRiD3Q3DHErAAAGOR8EbUZyJnV1IRNjUVFRWlxEODg9RFpaWkRISXR3cSsAAAY5HwRtbz0TcnV1Um9WWlowRFxERERcWnBhRDgLPDtxKwAABjkfBD1WXE4qL1JYTkREVD9ZRFxaWlFRWlw4OEhoSHErAAAGHk8cPURcXE4qb2NWXERUa0pEWlFwcFpWODs7SEgNEgYAAAYlJXgcMFZOTk5WVlpRUVwwMERRYXBaRE4vPDwLVWkAAABFJUdHJVUwREQ9VlpcXFpWVEcNRFxcXEQPCyk3N3k7DWkGACQlRyUEMEREMD09VlZOVj0NRiINMEpKMBspLnQoFDxIVSsAeDklBEREVlYwOEg9D3ZWD3pVRzV7R08wC3QaGhQtNztVKwAkHEciRFZWXEQwVTh2STw8bHoNDQ0NDXpJLi0tLRQ3O1UrAAV8fCJdWVZWMFQlODtsNzdJbHo4OFVVdjw3dCEhNzxIVSsAAAASHB9CPVYwJR86fTs8eTdJC0hxcVVIdwsLCwsLO317MwAAABdeOkc/MDEXACsiMH0NDUpVDTIrXnFVfX19fX0wEjMAAAAAABdpaWl+BgAAMj9EREQwcRwxAAAXfDowVj1ERARpAAAAAAAAAAASfgAAACs6VmFXWkQwMQAAAAAGJURhV1pcMH4AAAAAAAAAAAYGAAAyHE9dV0FCezIAAAAAKzpHa1pGIjAxBgAAAAAAAAAAAAAAADN+IkpEP2kxAAAAAAAzfmkcRBxpfwYAAAAAAAAAAAAAAAAAAAASe3t7MQAAAAAAAAAAaXt7e34AAAAAAAAAAAAAAAAAAAAAAAYzMzMAAAAAAAAAAAAGMzMzAAAAAAAA"};
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
  function kjdMagmarCanvas() { return kjdPixelIcon(KJD_MAGMAR_PIXELS); }
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
  const panel = document.createElement('section');
  panel.id = 'ipm-rota-best';
  panel.className = 'moon-panel'; moonPanelTheme();
  panel.innerHTML = `
    <div data-handle class="moon-head"><span data-route-icon></span><span class="moon-title">Rota do Bestiário<span class="moon-dot"></span></span><button type="button" data-minimize title="Minimizar">−</button><button type="button" data-close title="Fechar painel">×</button></div>
    <div class="moon-body">
      <div class="moon-state"><span data-mode>Pronto</span><span>POKE MOON</span></div>
      <div class="moon-metrics"><div class="moon-metric"><small>Concluídas</small><strong data-counter>0</strong></div><div class="moon-metric"><small>Espécies por vez</small><strong>1</strong></div></div>
      <label class="moon-line"><span>⏱ Minutos por hunt</span><input data-min type="number" min="1" max="1440" value="10"></label>
      <label class="moon-line"><span>◉ Bolas por hunt</span><input data-balls type="number" min="1" max="1000" value="60"></label>
      <button type="button" data-start class="moon-go">▶ Iniciar / retomar</button>
      <button type="button" data-stop class="moon-stop">Ⅱ Pausar rota</button>
      <div data-status role="status" class="moon-detail">Pronto. Nenhuma ação iniciada.</div>
      <div class="moon-foot">Captura uma espécie normal por vez.<br>Pausar mantém Auto-Catch e combate.</div>
    </div>`;
  const routeIcon = kjdMagmarCanvas(); if (routeIcon) panel.querySelector('[data-route-icon]').replaceWith(routeIcon);
  panel.querySelector('[data-minimize]').onclick = e => { panel.classList.toggle('moon-collapsed'); e.currentTarget.textContent = panel.classList.contains('moon-collapsed') ? '+' : '−'; };
  panel.style.maxHeight='calc(100vh - 24px)';panel.style.overflowY='auto';
  document.body.appendChild(panel);
  addMoonDockButton('bestiario','Rota do Bestiário - Magmar',kjdMagmarCanvas(),panel);
  panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;moonDock().sync()};
  moonDock().drag(panel, panel.querySelector('[data-handle]'), { storageKey: 'ipm-rota-bestiario-pos-v103' });
  const status = panel.querySelector('[data-status]');
  const startButton = panel.querySelector('[data-start]');
  function say(message) { panel.classList.toggle('moon-active', running); status.textContent = message;panel.querySelector('[data-counter]').textContent=completed.size;panel.querySelector('[data-mode]').textContent=running?'Ativa':'Pausada'; }
  function numberSetting(selector, max) {
    const value = Number(panel.querySelector(selector).value);
    if (!Number.isFinite(value) || value < 1 || value > max) throw new Error('Preencha limites válidos no painel.');
    return value;
  }
  async function read(path) {
    const auth = token();
    if (!auth) throw new Error('Sessão do jogo não encontrada. Recarregue a página.');
    const response = await fetch(path + (path.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(auth), {
      credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      const error = new Error('Falha ao consultar o jogo (HTTP ' + response.status + ').');
      error.transient = response.status === 429 || response.status >= 500;
      throw error;
    }
    const data = await response.json();
    if (!data || data.err) throw new Error(data && data.err || 'Resposta vazia do jogo.');
    return data;
  }
  function action(name, params) {
    const request = actions.then(async () => {
      if (!running) return null;
      // Y transforma erros em false, perdendo a causa e o tempo de espera.
      const response = await fetch('/api/action', {method:'POST', credentials:'same-origin',
        headers:{'Content-Type':'application/json'}, signal:AbortSignal.timeout(15000),
        body:JSON.stringify({token:token(),action:name,...params})});
      const result = await response.json();
      if (!response.ok || !result || result.err || result.precisaConfirmar) {
        const error = new Error(result && result.err || 'Falha na ação: ' + name);
        error.transient = response.status === 429 || response.status >= 500 || /aguarde|viajar de novo|prazo|conexão/i.test(error.message);
        throw error;
      }
      if (result.state && typeof handleStateUpdate === 'function') { handleStateUpdate(result.state); lastStateAt = Date.now(); }
      return result;
    });
    actions = request.catch(() => {});
    return request;
  }
  async function refresh(full = false) {
    const data = await read(full ? '/api/bestiario' : '/api/bestiario?so=cand');
    if (!Array.isArray(data.candidatos) || !data.colecao || (full && !Array.isArray(data.especies))) {
      throw new Error('Formato do bestiário mudou; execução interrompida.');
    }
    catalog = full ? data : {...catalog, candidatos:data.candidatos, colecao:data.colecao};
    lastCatalog = Date.now();
  }
  function owned(base) {
    const species = catalog.especies.find(p => p.k === base);
    return catalog.candidatos.some(p => norm(p.base) === base && (!p.shiny || species && species.semShiny));
  }
  function missing(base) { return !catalog.colecao[base] && !completed.has(base) && !owned(base); }
  function currentZone() {
    const s = state();
    return s && s.inst && Number.isInteger(s.inst.zona) ? s.inst.zona : s && s.zone && s.zone.index;
  }
  async function pause(message) {
    running = false;
    generation++;
    say(message + '\nRota parada. Auto-Catch preservado; controle a captura pelo Auto-Helper.');
    startButton.disabled = false;
  }
  function checkSafety() {
    const s = state();
    if (!s) throw new Error('Jogo ainda não está pronto.');
    if (s.fainted || !s.active || Number(s.active.hp) <= 0) throw new Error('Pokémon desmaiado ou sem Pokémon ativo.');
    if (!s.auto || !s.auto.hunt) throw new Error('Ative a caça no Auto-Helper antes de iniciar.');
    if (!s.auto.catch) throw new Error('Ative o Auto-Catch no Auto-Helper antes de iniciar.');
    if (s.auto.sellDup) throw new Error('Desative Vender Duplicatas no Auto-Helper para preservar as capturas.');
    if (s.auto.evolve) throw new Error('Desative Auto-Evolve para preservar a espécie capturada.');
    if (totalBalls(s) < 1) throw new Error('Sem bolas na mochila.');
    if (s.boxCap && Number(s.boxCap.n) >= Number(s.boxCap.max) - 1) throw new Error('Box sem margem de espaço.');
    if (!s.auto.ballAuto && !(Number(s.balls[s.auto.ball]) > 0)) throw new Error('A bola selecionada acabou. Escolha outra no jogo.');
    return s;
  }
  async function next() {
    const s = checkSafety();
    const choices = zones.filter(z => allowed.has(z.base) && z.lv <= s.player.level && missing(z.base));
    choices.sort((a,b) => a.lv - b.lv || a.base.localeCompare(b.base));
    target = choices.find(z => z.index === currentZone()) || choices[0] || null;
    if (!target) return pause('Concluído: nenhuma espécie faltante elegível nas hunts liberadas.');
    startedAt = Date.now();
    startBalls = totalBalls(s);
    say('Indo para ' + target.name + '…');
    if (!running) return;
    if (currentZone() !== target.index) await action('selectZone', {index:target.index, furiosa:false, confirmo:false, naoPerguntar:false});
    // A resposta da troca precisa identificar a instância antes de capturar.
    if (!running) return;
    if (currentZone() !== target.index) throw new Error('O jogo não confirmou a chegada à hunt.');
    say('Caçando: ' + target.name + '\nAguardando 1 captura normal. Concluídas nesta sessão: ' + completed.size);
  }
  async function tick() {
    if (!running || busy || stopping || Date.now() < retryAt) return;
    busy = true;
    try {
      // Em segundo plano, o próprio jogo reduz a frequência das atualizações.
      if (Date.now() - lastStateAt > 30000) {
        const update = await read('/api/state');
        if (!running) return;
        if (update.state && typeof handleStateUpdate === 'function') handleStateUpdate(update.state);
        lastStateAt = Date.now();
      }
      const s = checkSafety();
      if (!target) { await next(); return; }
      if (currentZone() !== target.index) throw new Error('Hunt alterada fora do script.');
      if (!s.auto.catch) throw new Error('Auto-Catch foi desligado no jogo.');
      if (Date.now() - lastCatalog >= 8000) {
        await refresh();
        if (!running) return;
        // Confirma a espécie no catálogo, em vez de contar bolas lançadas ou abates.
        if (owned(target.base) || catalog.colecao[target.base]) {
          completed.add(target.base);
          target = null;
          if (running) await next();
          return;
        }
      }
      const used = Math.max(0, startBalls - totalBalls(s));
      const elapsed = (Date.now() - startedAt) / 60000;
      if (used >= numberSetting('[data-balls]',1000)) throw new Error('Limite de bolas atingido em ' + target.name + '.');
      if (elapsed >= numberSetting('[data-min]',1440)) throw new Error('Limite de tempo atingido em ' + target.name + '.');
      say('Caçando: ' + target.name + '\n' + used + ' bolas · ' + elapsed.toFixed(1) + ' min\nConcluídas nesta sessão: ' + completed.size);
    } catch (error) {
      if (error.transient || error.name === 'TimeoutError' || error instanceof TypeError) {
        retryAt = Date.now() + 5000;
        if (target && currentZone() !== target.index) target = null;
        say('Aguardando para tentar novamente: ' + error.message + '\nRota ativa. Auto-Catch preservado.');
      } else await pause(error.message);
    }
    finally { busy = false; }
  }
  startButton.onclick = async () => {
    if (busy || running || stopping) return;
    busy = true;
    startButton.disabled = true;
    const attempt = ++generation;
    try {
      if (typeof window.IPM_HUNTS?.liberadas !== 'function' || typeof window.IPM_ON_STATE !== 'function') {
        throw new Error('Interface do jogo indisponível. Recarregue a página.');
      }
      numberSetting('[data-min]',1440); numberSetting('[data-balls]',1000);
      checkSafety();
      say('Consultando hunts e bestiário…');
      await refresh(true);
      if (attempt !== generation) return;
      const raw = await read('/api/hunts');
      if (attempt !== generation) return;
      if (!Array.isArray(raw.zonas)) throw new Error('Formato das hunts mudou.');
      allowed = await window.IPM_HUNTS.liberadas();
      if (attempt !== generation) return;
      if (!(allowed instanceof Set)) throw new Error('Não foi possível validar as hunts liberadas.');
      zones = raw.zonas.map(z => ({index:z.i,name:z.n,base:norm(z.b || z.esp),lv:Number(z.lv)}))
        .filter(z => Number.isInteger(z.index) && z.base && Number.isFinite(z.lv));
      running = true;
      target = null;
      retryAt = 0;
      say('Rota ativa. Preparando a próxima hunt…');
    } catch (error) { await pause(error.message); }
    finally { busy = false; startButton.disabled = false; }
  };
  panel.querySelector('[data-stop]').onclick = () => {
    // Bloqueia o restante de qualquer fluxo pendente imediatamente.
    running = false;
    if (!stopping) void pause('Pausado pelo jogador.');
  };
  if (typeof window.IPM_ON_STATE === 'function') window.IPM_ON_STATE(() => {
    lastStateAt = Date.now();
    void tick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void tick(); });
  setInterval(() => { void tick(); }, 2000);
})();
