// ==UserScript==
// @name         Poke Moon - Revive Automático
// @namespace    local.pokemoon.revive-auto
// @version      1.0.1
// @description  Cura o Pokémon derrotado após a troca automática e retoma a hunt original.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @homepageURL  https://github.com/panicguy/idlepokemoon
// @updateURL    https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Revive-Automatico.user.js
// @downloadURL  https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Revive-Automatico.user.js
// ==/UserScript==

(() => {
  'use strict';
  if (window.__ipmReviveAuto) return;
  window.__ipmReviveAuto = true;
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

  const key = 'pokemoon-revive-auto:';
  const state = () => typeof K === 'object' ? K : null;
  const token = () => typeof q === 'string' ? q : '';
  const account = () => String(state()?.player?.id ?? state()?.player?.name ?? '');
  const id = p => p?.id == null ? null : String(p.id);
  const hp = p => p?.hp == null || p.hp === '' ? NaN : Number(p.hp);
  const down = p => !!p && (p.fainted === true || p.defeated === true ||
    /^(fainted|defeated)$/i.test(p.status ?? '') || (Number.isFinite(hp(p)) && hp(p) <= 0));
  const member = (s, target) => id(s?.active) === target
    ? s.active : s?.team?.find(p => id(p) === target);
  const hunt = s => {
    const index = Number.isInteger(s?.inst?.zona) ? s.inst.zona : s?.zone?.index;
    return Number.isInteger(index) && index >= 0
      ? { index, furiosa:s.inst?.furiosa === true } : null;
  };
  const nurseHere = () => typeof gameState === 'object' && Array.isArray(gameState.npcs)
    ? gameState.npcs.find(npc => npc.role === 'heal' && npc.name) : null;
  const sameHunt = (a, b) => !!a && !!b && a.index === b.index && a.furiosa === b.furiosa;

  moonPanelTheme();
  const panel = document.createElement('section');
  panel.id = 'pokemoon-revive-auto';
  panel.className = 'moon-panel';
  panel.innerHTML = '<div class="moon-head"><span class="moon-title">Revive Automático<span class="moon-dot"></span></span><button type="button" aria-label="Fechar">×</button></div><div class="moon-body"><button type="button" class="moon-go"></button><div class="moon-detail" role="status"></div></div>';
  document.body.append(panel);
  const icon = document.createElement('canvas');
  icon.width = icon.height = 16;
  const art = [
    '................', '.......oo.......', '......oyyo......', '.....oyhhyo.....',
    '....oyhhhhyo....', '...oyhhwwhhyo...', '..oyyhhwwhhyyo..', '.oyyyywwwwyyyyo.',
    '.oyyyywwwwyyydo.', '..odyyywwyddo..', '...odyywwydo...', '....odydddo....',
    '.....odddo.....', '......odo......', '.......o.......', '................',
  ];
  const palette = { o:'#483251', y:'#ffc442', h:'#ffe988', w:'#fff7dc', d:'#e47b38' };
  const ctx = icon.getContext('2d');
  art.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (palette[pixel]) {
      ctx.fillStyle = palette[pixel];
      ctx.fillRect(x, y, 1, 1);
    }
  }));
  addMoonDockButton('revive-auto', 'Revive Automático', icon, panel);
  moonDock().drag(panel, panel.querySelector('.moon-head'), { storageKey: key + 'position' });
  panel.querySelector('.moon-head button').onclick = () => { panel.hidden = true; moonDock().sync(); };

  const toggle = panel.querySelector('.moon-go');
  const status = panel.querySelector('.moon-detail');
  let owner = '', enabled = false, tracked = null, recovery = null, busy = false;
  let manualPending = 0;
  const render = message => {
    toggle.disabled = !owner;
    toggle.textContent = enabled ? 'Desligar automação' : 'Ligar automação';
    toggle.classList.toggle('active', enabled);
    panel.classList.toggle('moon-active', enabled);
    status.textContent = message;
  };

  const nativeFetch = window.fetch;
  window.fetch = function (input, options) {
    let switching = false;
    try {
      const url = new URL(input?.url ?? input, location.href);
      switching = enabled && url.origin === location.origin && url.pathname === '/api/action' &&
        typeof options?.body === 'string' && ['setActive', 'goCity', 'selectZone'].includes(JSON.parse(options.body)?.action);
    } catch (_) {}
    if (!switching) return nativeFetch.apply(this, arguments);
    tracked = null;
    recovery = null;
    manualPending++;
    render('Troca ou viagem solicitada. Aguardando a próxima hunt ativa.');
    // The game applies the response after fetch resolves and parses its body.
    return Promise.resolve().then(() => nativeFetch.call(this, input, options))
      .finally(() => setTimeout(() => { manualPending--; }, 1500));
  };

  toggle.onclick = () => {
    if (!owner) return;
    enabled = !enabled;
    tracked = recovery = null;
    localStorage.setItem(key + owner, enabled ? '1' : '0');
    render(enabled ? 'Aguardando uma derrota seguida de troca automática.' : 'Desligado.');
  };

  async function advance(plan) {
    const valid = () => recovery === plan && enabled && account() === plan.owner && token() === plan.token;
    const request = async (action, params) => {
      if (!valid()) return null;
      const response = await nativeFetch.call(window, '/api/action', {
        method:'POST', credentials:'same-origin', signal:AbortSignal.timeout(15000),
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ token:plan.token, action, ...params }),
      });
      const result = await response.json();
      if (!valid()) return null;
      if (!response.ok || result.err || result.precisaConfirmar) {
        if ((action === 'selectZone' || action === 'goCity') && !result.precisaConfirmar &&
            /aguard[ea].*viajar/i.test(result.err ?? '')) {
          const seconds = Number(result.err.match(/(\d+)\s*s\b/i)?.[1]) || 5;
          plan.retryAt = Date.now() + Math.min(30, seconds + 1) * 1000;
          render('Aguardando o intervalo de viagem do jogo.');
          return null;
        }
        throw Error(result.err || (result.precisaConfirmar ? 'A viagem exige confirmação no jogo.' : 'Ação recusada pelo jogo.'));
      }
      if (result.state && typeof handleStateUpdate === 'function') handleStateUpdate(result.state);
      return result;
    };
    if (Date.now() > plan.deadline) throw Error('Tempo de recuperação excedido.');
    switch (plan.stage) {
      case 'city':
        if (!sameHunt(hunt(state()), plan.hunt) || id(state()?.active) !== plan.replacement)
          throw Error('A hunt ou o Pokémon ativo mudou antes da recuperação.');
        render('Pokémon derrotado. Indo ao Centro Pokémon…');
        if (await request('goCity', {})) plan.stage = 'heal';
        break;
      case 'heal': {
        const nurse = nurseHere();
        if (!nurse) { render('Aguardando a enfermeira no Centro Pokémon…'); break; }
        render('Curando o Pokémon derrotado…');
        if (!await request('npcTalk', { name:nurse.name })) break;
        const healed = member(state(), plan.id);
        if (!healed || down(healed) || !(hp(healed) > 0))
          throw Error('O jogo não confirmou a cura.');
        plan.stage = 'activate';
        break;
      }
      case 'activate': {
        const healed = member(state(), plan.id);
        if (!healed || down(healed) || !(hp(healed) > 0))
          throw Error('O Pokémon recuperado não está disponível.');
        if (id(state()?.active) !== plan.id && !await request('setActive', { pokeId:healed.id })) break;
        if (id(state()?.active) !== plan.id) throw Error('O jogo não confirmou o Pokémon ativo.');
        plan.stage = 'return';
        break;
      }
      case 'return':
        render('Voltando à hunt original…');
        if (!await request('selectZone', { ...plan.hunt, confirmo:false, naoPerguntar:false })) break;
        plan.stage = 'verify';
        plan.retryAt = Date.now() + 2500;
        break;
      case 'verify': {
        const url = new URL('/api/state', location.origin);
        url.searchParams.set('token', plan.token);
        const response = await nativeFetch.call(window, url, {
          credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(15000),
        });
        const result = await response.json();
        if (!valid()) break;
        const actual = result.state ?? result;
        if (!response.ok || result.err || !actual.player ||
            !sameHunt(hunt(actual), plan.hunt) || id(actual.active) !== plan.id ||
            actual.fainted || down(actual.active) || !(hp(actual.active) > 0) || !actual.auto?.hunt) {
          throw Error('O jogo não confirmou a hunt ativa com o Pokémon recuperado.');
        }
        recovery = null;
        render('Pokémon curado e hunt retomada.');
        break;
      }
    }
  }

  async function tick() {
    const currentOwner = account();
    if (currentOwner !== owner) {
      owner = currentOwner;
      enabled = !!owner && localStorage.getItem(key + owner) === '1';
      tracked = recovery = null;
      render(enabled ? 'Aguardando uma derrota seguida de troca automática.' : 'Desligado.');
    }
    if (!enabled || busy || manualPending || !token()) return;
    if (!recovery) {
      const s = state(), active = s?.active, activeId = id(active), location = hunt(s);
      if (!s || s.boss?.active || window.__ipmProfessionGatherLease) {
        tracked = null;
        return;
      }
      if (tracked) {
        const previous = member(s, tracked.id);
        const samePokemon = activeId === tracked.id;
        const defeated = down(previous) || (samePokemon && !!s.fainted) || tracked.defeated;
        if (sameHunt(tracked.hunt, location)) {
          if (samePokemon) {
            tracked.defeated = down(previous) || !!s.fainted || (tracked.defeated && !(hp(active) > 0));
          } else if (defeated && activeId && hp(active) > 0 && !down(active)) {
            recovery = { ...tracked, replacement:activeId, owner, token:token(),
              stage:'city', deadline:Date.now() + 120000, retryAt:0 };
          } else if (!activeId && defeated) {
            tracked.defeated = true;
            return;
          }
        } else if (!location && defeated) {
          // The server may send the team to the Center without a healthy replacement.
          tracked.defeated = true;
          tracked.centerDeadline ??= Date.now() + 15000;
          if (Date.now() < tracked.centerDeadline) {
            if (!nurseHere()) return;
            recovery = { ...tracked, owner, token:token(),
              stage:'heal', deadline:Date.now() + 120000, retryAt:0 };
          }
        }
      }
      if (recovery) tracked = null;
      else if (tracked?.id !== activeId || !sameHunt(tracked?.hunt, location)) {
        tracked = location && activeId && !s.fainted && !down(active) && hp(active) > 0 && s.auto?.hunt
          ? { id:activeId, hunt:location, defeated:false } : null;
      }
    }
    const plan = recovery;
    if (!plan || Date.now() < plan.retryAt) return;
    busy = true;
    try { await advance(plan); }
    catch (error) {
      if (recovery === plan) {
        recovery = null;
        render('Recuperação interrompida. ' + error.message);
      }
    } finally { busy = false; }
  }
  if (typeof window.IPM_ON_STATE === 'function') window.IPM_ON_STATE(() => queueMicrotask(tick));
  setInterval(tick, 500);
  void tick();
})();
