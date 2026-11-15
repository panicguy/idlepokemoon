// ==UserScript==
// @name         Poke Moon - Time Boss
// @namespace    local.pokemoon.team-boss
// @version      0.1.0
// @description  Monta times individuais para Suicune, Entei, Jirachi e Zeraora sem iniciar lutas.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(()=>{'use strict';if(window.__idleMoonTeamBoss)return;window.__idleMoonTeamBoss={starting:true};
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

const TB_PRESETS={"suicune":{"name":"Suicune","evidence":"Seu time dos prints. 100/100 vitórias na simulação local; resultado real depende dos atributos e das regras do servidor.","members":[{"name":"Wishiwashi (School)","moves":["Dive","Double-Edge","Feint Attack","Aqua Ring"],"ability":"u-wishiwashi-school-base","referencePacket":"eyJhIjoxLjY5OSwicyI6MS40NzYsImQiOjEuMzc4LCJlIjoxLjI0NCwiaCI6MS4xNTcsInYiOjEuNzk3LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywiZm8iOjAuMDE5OCwibiI6WyJTaW5vIENhbG1hbnRlIFQxIiwiSW5mdXPDo28gZGUgRsO6cmlhIFQ1Il19fQ"},{"name":"Blissey","moves":["Last Resort","Helping Hand","Heal Pulse","Soft-Boiled"],"ability":"g-normal","referencePacket":"eyJhIjoyLjMyMSwicyI6MS43MzQsImQiOjIuMDM4LCJlIjowLjg3MSwiaCI6MS4wMzEsInYiOjEuOTE3LCJ4IjoxLjA3NSwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Lapras","moves":["Perish Song","Rain Dance","Body Slam","Life Dew"],"ability":"u-lapras-base","referencePacket":"eyJhIjoxLjU5MiwicyI6MS42MjYsImQiOjEuNzk2LCJlIjoxLjM2NSwiaCI6MS4wNTMsInYiOjEuOTc1LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Milotic","moves":["Aqua Tail","Life Dew","Dragon Tail","Aqua Ring"],"ability":"u-milotic-base","referencePacket":"eyJhIjoxLjU2NiwicyI6MS4zODgsImQiOjEuMjkzLCJlIjoxLjM0OSwiaCI6MS4wNDIsInYiOjEuMTA1LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Dewgong","moves":["Dive","Aqua Ring","Encore","Headbutt"],"ability":"g-water","referencePacket":"eyJhIjoxLjUxNSwicyI6MS4xODMsImQiOjEuMjk1LCJlIjowLjgyMSwiaCI6MC45MjksInYiOjIuODU2LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Vaporeon","moves":["Aqua Ring","Double-Edge","Last Resort","Helping Hand"],"ability":"u-vaporeon-base","referencePacket":"eyJhIjoxLjg0NiwicyI6MS4zNzgsImQiOjEuNDQ1LCJlIjoxLjY1MywiaCI6MS4xNTYsInYiOjEuODI0LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"}]},"entei":{"name":"Entei","evidence":"100/100 vitórias na simulação local; resultado real depende dos atributos e das regras do servidor.","members":[{"name":"Tyranitar","moves":["Crunch","Earthquake","Dark Pulse","Iron Defense"],"ability":"u-tyranitar-base","referencePacket":"eyJhIjozLjU2NywicyI6Mi43NDQsImQiOjIuNzc4LCJlIjoyLjIyLCJoIjoyLjQwNCwidiI6My4xMDQsIngiOjEuMzU5LCJ4dCI6eyJidWciOjEuMDgsImRhcmsiOjEuMDUxLCJkcmFnb24iOjEuMDUxLCJlbGVjdHJpYyI6MS4wMywiZmFpcnkiOjEuMDUxLCJmaWdodGluZyI6MS4wOSwiZmlyZSI6MS4wMywiZmx5aW5nIjoxLjExMiwiZ2hvc3QiOjEuMDMsImdyYXNzIjoxLjA2LCJncm91bmQiOjEuMDMsImljZSI6MS4wMywibm9ybWFsIjoxLjExLCJwb2lzb24iOjEuMDMsInBzeWNoaWMiOjEuMDMsInJvY2siOjEuMDMsInN0ZWVsIjoxLjAzLCJ3YXRlciI6MS4xMX0sInJ0Ijp7ImJ1ZyI6MC45NSwiZGFyayI6MC45NSwiZWxlY3RyaWMiOjAuOTUsImZhaXJ5IjowLjk1LCJmaWdodGluZyI6MC45NSwiZmlyZSI6MC45NSwiZmx5aW5nIjowLjk1LCJnaG9zdCI6MC45NSwiZ3Jhc3MiOjAuOTUsImdyb3VuZCI6MC45NSwiaWNlIjowLjk1LCJub3JtYWwiOjAuOTUsInBvaXNvbiI6MC45NSwicHN5Y2hpYyI6MC45NSwicm9jayI6MC45NSwic3RlZWwiOjAuOTUsIndhdGVyIjowLjk1fSwidGIiOjEsImh2Ijp7IngiOjEuMDMzLCJuIjpbIkluZnVzw6NvIGRlIEbDunJpYSBUNSJdfSwidGEiOiJyb2NrIn0"},{"name":"Gyarados","moves":["Waterfall","Crunch","Dragon Dance","Aqua Tail"],"ability":"u-gyarados-base","referencePacket":"eyJhIjoyLjUzNCwicyI6MS4yOTcsImQiOjIuMTI5LCJlIjoxLjUxNCwiaCI6MS4zNDYsInYiOjEuODQ1LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywicmZlIjowLjAyNjQsIm4iOlsiRXNwZWxobyBSw7puaWNvIFQxIiwiSW5mdXPDo28gZGUgRsO6cmlhIFQ1Il19fQ"},{"name":"Rhyperior","moves":["Earthquake","Drill Run","Rock Wrecker","Megahorn"],"ability":"u-rhyperior-base","referencePacket":"eyJhIjoyLjAyMSwicyI6MS44MjYsImQiOjEuNjM3LCJlIjoxLjQ1MiwiaCI6MS4xNTIsInYiOjIuMDk5LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywicmZmIjowLjAxOTgsIm4iOlsiRWxtbyBSb2Nob3NvIFQxIiwiSW5mdXPDo28gZGUgRsO6cmlhIFQ1Il19fQ"},{"name":"Golem","moves":["Earthquake","Rock Blast","Stone Edge","Double-Edge"],"ability":"g-rock","referencePacket":"eyJhIjoxLjgwOSwicyI6MS4wNzgsImQiOjEuMzkxLCJlIjoxLjQwMSwiaCI6MS4wNTMsInYiOjEuODgyLCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Milotic","moves":["Aqua Tail","Life Dew","Dragon Tail","Aqua Ring"],"ability":"u-milotic-base","referencePacket":"eyJhIjoxLjU2NiwicyI6MS4zODgsImQiOjEuMjkzLCJlIjoxLjM0OSwiaCI6MS4wNDIsInYiOjEuMTA1LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Vaporeon","moves":["Aqua Ring","Double-Edge","Last Resort","Helping Hand"],"ability":"u-vaporeon-base","referencePacket":"eyJhIjoxLjg0NiwicyI6MS4zNzgsImQiOjEuNDQ1LCJlIjoxLjY1MywiaCI6MS4xNTYsInYiOjEuODI0LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"}]},"jirachi":{"name":"Jirachi","evidence":"Composição que você já venceu. 900/900 testes nominais locais; desejo recomendado: Vida.","members":[{"name":"Wishiwashi (School)","moves":["Beat Up","Feint Attack","Helping Hand","Aqua Ring"],"ability":"u-wishiwashi-school-base","referencePacket":"eyJhIjoxLjY5OSwicyI6MS40NzYsImQiOjEuMzc4LCJlIjoxLjI0NCwiaCI6MS4xNTcsInYiOjEuNzk3LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywiZm8iOjAuMDE5OCwibiI6WyJTaW5vIENhbG1hbnRlIFQxIiwiSW5mdXPDo28gZGUgRsO6cmlhIFQ1Il19fQ"},{"name":"Tyranitar","moves":["Crunch","Earthquake","Dark Pulse","Iron Defense"],"ability":"u-tyranitar-base","referencePacket":"eyJhIjozLjU2NywicyI6Mi43NDQsImQiOjIuNzc4LCJlIjoyLjIyLCJoIjoyLjQwNCwidiI6My4xMDQsIngiOjEuMzU5LCJ4dCI6eyJidWciOjEuMDgsImRhcmsiOjEuMDUxLCJkcmFnb24iOjEuMDUxLCJlbGVjdHJpYyI6MS4wMywiZmFpcnkiOjEuMDUxLCJmaWdodGluZyI6MS4wOSwiZmlyZSI6MS4wMywiZmx5aW5nIjoxLjExMiwiZ2hvc3QiOjEuMDMsImdyYXNzIjoxLjA2LCJncm91bmQiOjEuMDMsImljZSI6MS4wMywibm9ybWFsIjoxLjExLCJwb2lzb24iOjEuMDMsInBzeWNoaWMiOjEuMDMsInJvY2siOjEuMDMsInN0ZWVsIjoxLjAzLCJ3YXRlciI6MS4xMX0sInJ0Ijp7ImJ1ZyI6MC45NSwiZGFyayI6MC45NSwiZWxlY3RyaWMiOjAuOTUsImZhaXJ5IjowLjk1LCJmaWdodGluZyI6MC45NSwiZmlyZSI6MC45NSwiZmx5aW5nIjowLjk1LCJnaG9zdCI6MC45NSwiZ3Jhc3MiOjAuOTUsImdyb3VuZCI6MC45NSwiaWNlIjowLjk1LCJub3JtYWwiOjAuOTUsInBvaXNvbiI6MC45NSwicHN5Y2hpYyI6MC45NSwicm9jayI6MC45NSwic3RlZWwiOjAuOTUsIndhdGVyIjowLjk1fSwidGIiOjEsImh2Ijp7IngiOjEuMDMzLCJuIjpbIkluZnVzw6NvIGRlIEbDunJpYSBUNSJdfSwidGEiOiJyb2NrIn0"},{"name":"Houndoom","moves":["Flamethrower","Foul Play","Inferno","Crunch"],"ability":"u-houndoom-base","referencePacket":"eyJhIjoyLjI3MiwicyI6MS42NzMsImQiOjEuNzY0LCJlIjoxLjI4OSwiaCI6MS4wOTcsInYiOjEuMywieCI6MS4xLCJ4dCI6eyJidWciOjEuMDgsImRhcmsiOjEuMDUxLCJkcmFnb24iOjEuMDUxLCJlbGVjdHJpYyI6MS4wMywiZmFpcnkiOjEuMDUxLCJmaWdodGluZyI6MS4wOSwiZmlyZSI6MS4wMywiZmx5aW5nIjoxLjExMiwiZ2hvc3QiOjEuMDMsImdyYXNzIjoxLjA2LCJncm91bmQiOjEuMDMsImljZSI6MS4wMywibm9ybWFsIjoxLjExLCJwb2lzb24iOjEuMDMsInBzeWNoaWMiOjEuMDMsInJvY2siOjEuMDMsInN0ZWVsIjoxLjAzLCJ3YXRlciI6MS4xMX0sInJ0Ijp7ImJ1ZyI6MC45NSwiZGFyayI6MC45NSwiZWxlY3RyaWMiOjAuOTUsImZhaXJ5IjowLjk1LCJmaWdodGluZyI6MC45NSwiZmlyZSI6MC45NSwiZmx5aW5nIjowLjk1LCJnaG9zdCI6MC45NSwiZ3Jhc3MiOjAuOTUsImdyb3VuZCI6MC45NSwiaWNlIjowLjk1LCJub3JtYWwiOjAuOTUsInBvaXNvbiI6MC45NSwicHN5Y2hpYyI6MC45NSwicm9jayI6MC45NSwic3RlZWwiOjAuOTUsIndhdGVyIjowLjk1fSwidGIiOjEsImh2Ijp7IngiOjEuMDMzLCJuIjpbIkluZnVzw6NvIGRlIEbDunJpYSBUNSJdfX0"},{"name":"Hisuian Typhlosion","moves":["Flamethrower","Inferno","Eruption","Overheat"],"ability":"u-hisuian-typhlosion-base","referencePacket":"eyJhIjoyLjAzOSwicyI6MS4zNDUsImQiOjEuNTExLCJlIjoxLjM1MywiaCI6MC45NjMsInYiOjEuNzI0LCJ4IjoxLjEsInh0Ijp7ImJ1ZyI6MS4wOCwiZGFyayI6MS4wNTEsImRyYWdvbiI6MS4wNTEsImVsZWN0cmljIjoxLjAzLCJmYWlyeSI6MS4wNTEsImZpZ2h0aW5nIjoxLjA5LCJmaXJlIjoxLjAzLCJmbHlpbmciOjEuMTEyLCJnaG9zdCI6MS4wMywiZ3Jhc3MiOjEuMDYsImdyb3VuZCI6MS4wMywiaWNlIjoxLjAzLCJub3JtYWwiOjEuMTEsInBvaXNvbiI6MS4wMywicHN5Y2hpYyI6MS4wMywicm9jayI6MS4wMywic3RlZWwiOjEuMDMsIndhdGVyIjoxLjExfSwicnQiOnsiYnVnIjowLjk1LCJkYXJrIjowLjk1LCJlbGVjdHJpYyI6MC45NSwiZmFpcnkiOjAuOTUsImZpZ2h0aW5nIjowLjk1LCJmaXJlIjowLjk1LCJmbHlpbmciOjAuOTUsImdob3N0IjowLjk1LCJncmFzcyI6MC45NSwiZ3JvdW5kIjowLjk1LCJpY2UiOjAuOTUsIm5vcm1hbCI6MC45NSwicG9pc29uIjowLjk1LCJwc3ljaGljIjowLjk1LCJyb2NrIjowLjk1LCJzdGVlbCI6MC45NSwid2F0ZXIiOjAuOTV9LCJ0YiI6MSwiaHYiOnsieCI6MS4wMzMsImZvIjowLjAxOTgsIm4iOlsiU2lubyBDYWxtYW50ZSBUMSIsIkluZnVzw6NvIGRlIEbDunJpYSBUNSJdfX0"},{"name":"Gardevoir","moves":["Mystical Fire","Heal Pulse","Wish","Dream Eater"],"ability":"u-gardevoir-base","referencePacket":"eyJhIjoyLjAzNSwicyI6MS44MDEsImQiOjEuNTY4LCJlIjoxLjIzOCwiaCI6MS4yOTgsInYiOjIuMDUzLCJ4IjoxLjA3NSwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Vaporeon","moves":["Aqua Ring","Helping Hand","Last Resort","Double-Edge"],"ability":"u-vaporeon-base","referencePacket":"eyJhIjoxLjg0NiwicyI6MS4zNzgsImQiOjEuNDQ1LCJlIjoxLjY1MywiaCI6MS4xNTYsInYiOjEuODI0LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"}]},"zeraora":{"name":"Zeraora","evidence":"100/100 vitórias na simulação local; resultado real depende dos atributos e das regras do servidor.","members":[{"name":"Rhyperior","moves":["Earthquake","Drill Run","Rock Wrecker","Megahorn"],"ability":"u-rhyperior-base","referencePacket":"eyJhIjoyLjAyMSwicyI6MS44MjYsImQiOjEuNjM3LCJlIjoxLjQ1MiwiaCI6MS4xNTIsInYiOjIuMDk5LCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywicmZmIjowLjAxOTgsIm4iOlsiRWxtbyBSb2Nob3NvIFQxIiwiSW5mdXPDo28gZGUgRsO6cmlhIFQ1Il19fQ"},{"name":"Golem","moves":["Earthquake","Rock Blast","Stone Edge","Double-Edge"],"ability":"g-rock","referencePacket":"eyJhIjoxLjgwOSwicyI6MS4wNzgsImQiOjEuMzkxLCJlIjoxLjQwMSwiaCI6MS4wNTMsInYiOjEuODgyLCJ4IjoxLjA4OCwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Tyranitar","moves":["Crunch","Earthquake","Dark Pulse","Iron Defense"],"ability":"u-tyranitar-base","referencePacket":"eyJhIjozLjU2NywicyI6Mi43NDQsImQiOjIuNzc4LCJlIjoyLjIyLCJoIjoyLjQwNCwidiI6My4xMDQsIngiOjEuMzU5LCJ4dCI6eyJidWciOjEuMDgsImRhcmsiOjEuMDUxLCJkcmFnb24iOjEuMDUxLCJlbGVjdHJpYyI6MS4wMywiZmFpcnkiOjEuMDUxLCJmaWdodGluZyI6MS4wOSwiZmlyZSI6MS4wMywiZmx5aW5nIjoxLjExMiwiZ2hvc3QiOjEuMDMsImdyYXNzIjoxLjA2LCJncm91bmQiOjEuMDMsImljZSI6MS4wMywibm9ybWFsIjoxLjExLCJwb2lzb24iOjEuMDMsInBzeWNoaWMiOjEuMDMsInJvY2siOjEuMDMsInN0ZWVsIjoxLjAzLCJ3YXRlciI6MS4xMX0sInJ0Ijp7ImJ1ZyI6MC45NSwiZGFyayI6MC45NSwiZWxlY3RyaWMiOjAuOTUsImZhaXJ5IjowLjk1LCJmaWdodGluZyI6MC45NSwiZmlyZSI6MC45NSwiZmx5aW5nIjowLjk1LCJnaG9zdCI6MC45NSwiZ3Jhc3MiOjAuOTUsImdyb3VuZCI6MC45NSwiaWNlIjowLjk1LCJub3JtYWwiOjAuOTUsInBvaXNvbiI6MC45NSwicHN5Y2hpYyI6MC45NSwicm9jayI6MC45NSwic3RlZWwiOjAuOTUsIndhdGVyIjowLjk1fSwidGIiOjEsImh2Ijp7IngiOjEuMDMzLCJuIjpbIkluZnVzw6NvIGRlIEbDunJpYSBUNSJdfSwidGEiOiJyb2NrIn0"},{"name":"Gardevoir","moves":["Mystical Fire","Heal Pulse","Wish","Dream Eater"],"ability":"u-gardevoir-base","referencePacket":"eyJhIjoyLjAzNSwicyI6MS44MDEsImQiOjEuNTY4LCJlIjoxLjIzOCwiaCI6MS4yOTgsInYiOjIuMDUzLCJ4IjoxLjA3NSwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Blissey","moves":["Last Resort","Helping Hand","Heal Pulse","Soft-Boiled"],"ability":"g-normal","referencePacket":"eyJhIjoyLjMyMSwicyI6MS43MzQsImQiOjIuMDM4LCJlIjowLjg3MSwiaCI6MS4wMzEsInYiOjEuOTE3LCJ4IjoxLjA3NSwieHQiOnsiYnVnIjoxLjA4LCJkYXJrIjoxLjA1MSwiZHJhZ29uIjoxLjA1MSwiZWxlY3RyaWMiOjEuMDMsImZhaXJ5IjoxLjA1MSwiZmlnaHRpbmciOjEuMDksImZpcmUiOjEuMDMsImZseWluZyI6MS4xMTIsImdob3N0IjoxLjAzLCJncmFzcyI6MS4wNiwiZ3JvdW5kIjoxLjAzLCJpY2UiOjEuMDMsIm5vcm1hbCI6MS4xMSwicG9pc29uIjoxLjAzLCJwc3ljaGljIjoxLjAzLCJyb2NrIjoxLjAzLCJzdGVlbCI6MS4wMywid2F0ZXIiOjEuMTF9LCJydCI6eyJidWciOjAuOTUsImRhcmsiOjAuOTUsImVsZWN0cmljIjowLjk1LCJmYWlyeSI6MC45NSwiZmlnaHRpbmciOjAuOTUsImZpcmUiOjAuOTUsImZseWluZyI6MC45NSwiZ2hvc3QiOjAuOTUsImdyYXNzIjowLjk1LCJncm91bmQiOjAuOTUsImljZSI6MC45NSwibm9ybWFsIjowLjk1LCJwb2lzb24iOjAuOTUsInBzeWNoaWMiOjAuOTUsInJvY2siOjAuOTUsInN0ZWVsIjowLjk1LCJ3YXRlciI6MC45NX0sInRiIjoxLCJodiI6eyJ4IjoxLjAzMywibiI6WyJJbmZ1c8OjbyBkZSBGw7pyaWEgVDUiXX19"},{"name":"Noivern","moves":["Roost","Moonlight","Tailwind","Boomburst"],"ability":"g-flying","referencePacket":"eyJhIjoyLjM1NywicyI6MS44NzcsImQiOjEuOTMyLCJlIjowLjk3MiwiaCI6MS4yMSwidiI6Mi4wMywieCI6MS4wNzUsInh0Ijp7ImJ1ZyI6MS4wOCwiZGFyayI6MS4wNTEsImRyYWdvbiI6MS4wNTEsImVsZWN0cmljIjoxLjAzLCJmYWlyeSI6MS4wNTEsImZpZ2h0aW5nIjoxLjA5LCJmaXJlIjoxLjAzLCJmbHlpbmciOjEuMTEyLCJnaG9zdCI6MS4wMywiZ3Jhc3MiOjEuMDYsImdyb3VuZCI6MS4wMywiaWNlIjoxLjAzLCJub3JtYWwiOjEuMTEsInBvaXNvbiI6MS4wMywicHN5Y2hpYyI6MS4wMywicm9jayI6MS4wMywic3RlZWwiOjEuMDMsIndhdGVyIjoxLjExfSwicnQiOnsiYnVnIjowLjk1LCJkYXJrIjowLjk1LCJlbGVjdHJpYyI6MC45NSwiZmFpcnkiOjAuOTUsImZpZ2h0aW5nIjowLjk1LCJmaXJlIjowLjk1LCJmbHlpbmciOjAuOTUsImdob3N0IjowLjk1LCJncmFzcyI6MC45NSwiZ3JvdW5kIjowLjk1LCJpY2UiOjAuOTUsIm5vcm1hbCI6MC45NSwicG9pc29uIjowLjk1LCJwc3ljaGljIjowLjk1LCJyb2NrIjowLjk1LCJzdGVlbCI6MC45NSwid2F0ZXIiOjAuOTV9LCJ0YiI6MSwiaHYiOnsieCI6MS4wMzMsIm4iOlsiSW5mdXPDo28gZGUgRsO6cmlhIFQ1Il19fQ"}]}};
function resolveBossTeam(preset, owned, info) {
  const used = new Set(), time = [], golpes = {}, habs = {}, warnings = [];
  for (const member of preset.members) {
    const choices = owned.filter(p => p.n === member.name && !used.has(p.id))
      .sort((a,b) => Number(info.poder?.[b.id]?.pw || b.pw || 0) - Number(info.poder?.[a.id]?.pw || a.pw || 0));
    const chosen = choices[0];
    if (!chosen) throw Error('Falta nesta conta: ' + member.name + '. Nenhuma alteração feita.');
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

  const TB_KEY='pokemoon-team-boss-v1:';
  const tbToken=()=>{try{return typeof q==='string'&&q?q:localStorage.getItem('pmi_token');}catch(_){return null;}};
  const tbOwner=()=>{try{return String(K?.player?.id||K?.player?.name||'');}catch(_){return '';}};
  let tbBusy=false,tbBound='';
  function tbRead(owner){try{return JSON.parse(localStorage.getItem(TB_KEY+owner)||'{}');}catch(_){return {};}}
  function tbWrite(owner,data){localStorage.setItem(TB_KEY+owner,JSON.stringify({...tbRead(owner),...data}));}
  function tbRequester(token){
    return async function(route,data){
      if(!['/api/gm/pokes','/api/boss/equipe'].includes(route))throw Error('Endpoint não permitido.');
      if(data&&(route!=='/api/boss/equipe'||Object.keys(data).some(k=>!['time','golpes','habs'].includes(k))))throw Error('Operação não permitida.');
      const url=new URL(route,location.origin);if(!data)url.searchParams.set('token',token);
      const options=data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,...data})}:{method:'GET',cache:'no-store'};
      let response=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});
      if(response.status===421){const owner=response.headers.get('X-Pokeidle-Dono');if(/^\d+$/.test(owner||''))response=await fetch(url,{...options,headers:{...options.headers,'X-Pokeidle-P':owner},signal:AbortSignal.timeout(20000)});}
      const result=await response.json();if(!response.ok||result.err||result.error)throw Error(String(result.err||result.error||('HTTP '+response.status)));
      return result;
    };
  }
  moonPanelTheme();
  const tbPanel=document.createElement('section');tbPanel.id='pokemoon-team-boss';tbPanel.className='moon-panel';
  tbPanel.innerHTML='<div class="moon-head"><span>🏆</span><span class="moon-title">Time Boss</span><button data-close title="Fechar">×</button></div><div class="moon-body"><div class="moon-state">Boss individual · aplicação manual</div><p class="moon-note">Escolher um boss monta o time, os quatro golpes e as habilidades. Usa os exemplares mais fortes desta conta.</p><select data-select style="width:100%;padding:8px;background:#101c2a;color:#f4e4b8;border:1px solid #816e43;border-radius:6px"><option value="">Escolha um boss…</option></select><div class="moon-detail" data-team></div><button class="moon-go" data-apply>Aplicar novamente</button><div class="moon-detail" data-status>Escolha um boss para montar o time.</div><p class="moon-foot">Não inicia lutas, não usa chaves e não altera times da hunt, Ginásio ou guilda. Recarregar o jogo não aplica o time novamente.</p></div>';
  document.body.appendChild(tbPanel);
  const tbEl=k=>tbPanel.querySelector('[data-'+k+']');
  for(const [key,preset] of Object.entries(TB_PRESETS)){const opt=document.createElement('option');opt.value=key;opt.textContent='Team '+preset.name;tbEl('select').appendChild(opt);}
  const tbIcon=document.createElement('canvas');tbIcon.width=32;tbIcon.height=32;const tbCtx=tbIcon.getContext('2d');tbCtx.fillStyle='#d7ad47';tbCtx.fillRect(8,5,16,13);tbCtx.fillRect(4,7,4,8);tbCtx.fillRect(24,7,4,8);tbCtx.fillRect(13,18,6,6);tbCtx.fillRect(8,25,16,4);tbCtx.fillStyle='#fff0a8';tbCtx.fillRect(10,7,4,8);
  tbPanel.hidden=true;addMoonDockButton('time-boss','Time Boss',tbIcon,tbPanel);moonDock().drag(tbPanel,tbPanel.querySelector('.moon-head'),{storageKey:TB_KEY+'position'});
  tbEl('close').onclick=()=>{tbPanel.hidden=true;moonDock().sync();};
  function tbPreview(){const preset=TB_PRESETS[tbEl('select').value];tbEl('team').textContent=preset?preset.members.map((p,i)=>(i+1)+'. '+p.name+'\n'+p.moves.join(' · ')).join('\n\n')+'\n\n'+preset.evidence:'';tbEl('apply').disabled=tbBusy||!preset||!tbOwner();}
  function tbBind(){const owner=tbOwner();if(tbBusy||owner===tbBound)return;tbBound=owner;const saved=tbRead(owner);tbEl('select').value=TB_PRESETS[saved.selected]?saved.selected:'';tbEl('status').textContent=owner?(saved.status||'Escolha um boss para montar o time.'):'Aguardando personagem conectado.';tbPreview();}
  async function tbApply(){
    if(tbBusy)return;
    const owner=tbOwner(),token=tbToken(),key=tbEl('select').value,preset=TB_PRESETS[key];
    if(!owner||!token||!preset)return;
    tbBusy=true;tbEl('select').disabled=true;tbPreview();tbEl('status').textContent='Conferindo os Pokémon e salvando o time…';
    const guard=()=>{if(tbOwner()!==owner||tbToken()!==token)throw Error('Personagem ou sessão mudou durante a aplicação.');};
    try{
      const plan=await applyBossTeam({preset,request:tbRequester(token),guard,saveBackup:backup=>tbWrite(owner,{backup:{at:Date.now(),...backup}})});
      const status='Team '+preset.name+' confirmado no servidor.'+(plan.warnings.length?' Atributos diferentes da simulação em '+plan.warnings.join(', ')+'. A taxa de vitória pode mudar.':'')+(key==='jirachi'?' Para Jirachi, use o desejo Vida.':'');
      tbWrite(owner,{selected:key,status});if(tbOwner()===owner)tbEl('status').textContent=status;
    }catch(error){if(tbOwner()===owner)tbEl('status').textContent=error.message;}
    finally{tbBusy=false;tbEl('select').disabled=false;if(tbOwner()!==owner){tbBound='';tbBind();}tbPreview();}
  }
  tbEl('select').onchange=()=>{tbPreview();void tbApply();};tbEl('apply').onclick=tbApply;
  tbBind();setInterval(tbBind,5000);window.__idleMoonTeamBoss={version:'0.1.0'};

})();
