// ==UserScript==
// @name         Poke Moon Rota de Quests by time Rebosteio
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.3.1
// @description  Caça, coleta e entrega de etapas de quests com continuação automática; lutas de chefe são manuais.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @idlemoon-hunts shortcut-v1
// ==/UserScript==
(() => {
'use strict';if(window.__rebosteioQuestRoute)return;window.__rebosteioQuestRoute=true;
// Martial Arts Scroll icon, bundled with original transparency.
// Source: https://wiki.pokexgames.com/images/d/d8/Martial_Arts_Scroll.png
const QUEST_PIXELS={"w":28,"h":30,"rgba":"////AP///wD///8A////AP///wAAAAD/AAAA/wAAAP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAAA/wAAAP8AAAD/////AP///wD///8A////AP///wD///8A////AP///wAAAAD/+dcl///+T//52Cb/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA//nYJv///k//+dcl/wAAAP////8A////AP///wD///8A////AP///wD///8AAAAA/2dUEf/U1CH/tK4Q/41ODf/VZhz/2moU/9FuGP/ScyD/3HUl/92CPf/hmGD/4Zhg/95+TP/efkz/7HlA/+x5QP+NWAz/1NQh/9TUIf8AAAD/////AP///wD///8A////AP///wD///8A////AAAAAP87KwX/xrsb/7+zG/93TSP/gD0k/4dBHv+SSCb/j0cp/5BJKv+ZTSz/lUgn/5VOLv+aUC//oEse/5RDF/+UQxf/Zy8Q/8a7G/97WQr/AAAA/////wD///8A////AP///wD///8A////AP///wD///8AAAAA/3tZCv9YShH/KxMM/ysTDP8rEwz/KBEK/yUPCf8kDgj/JA0I/yQOCP8lDwn/Jg8J/ycQCv8nEAr/KxMM/1hKEf97WQr/AAAA/////wD///8A////AP///wD///8A////AP///wD///8A////AAAAAP8AAAD/AAAA/xMNC/9FNyb/WUc8/0w7MP9RPDD/WUE1/1lAM/9UPzL/VUE3/1A8Mv9OPDX/UkA6/0g7N/8ODgv/AAAA/////wD///8A////AP///wD///8A////AP///wD///8A////AAAAAP8AFh7/AAAA/wAAAP9VRD7/vIVc/9Wxj/+tiGz/s5V8/8arlf/Mrpb/uKCG/7CbiP+eiXb/iHZm/4t1YP+QgXn/mYR9/xIREP////8A////AP///wD///8A////AP///wD///8A////AAAAAP8DOQf/AAAA/////wAAAAD/TkU//+fDlf/hrWv/Wiwh/39ZM/+vknT/4Mu5//Xgyv/Zu5j/28ev/6aWf/92alz/OBkA/5+QgP+8i3L/BAQE/////wD///8A////AP///wD///8A////AAAAAP8JUBX/AAAA/////wD///8A////AAAAAP/gwqD/xqZw/4pjNv9aLCH/gWlP/9G7pv/Yt5P/mHBA/7B/QP/fw6X/ai4A/9Cuhf9qLwD/1ahx/3RdSv8AAAD/////AP///wD///8A////AAAAAP8UXiz/AAAA/////wD///8A////AP///wAAAAD/ya2c/+jLqv9nHQD/jHNa/7uxo//Tx7T/2MGq/4VjQP/Yy7n/2cuz/8msj/+odUH/7NzF/2svAP+ki3X/AAAA/////wD///8A////AAAAAP8eZDz/AAAA/////wD///8A////AP///wD///8AAwMD/8qulP+/oX7/rWww/8Khiv/o39L/4tzM/8yxnP+fkYH/v7ey/7Smjv/bwqn/u3g+/+rMsf/ator/rI96/wAAAP////8A////AP///wAAAAD/HYZJ/wAAAP////8A////AP///wD///8AAAAA/1dBPP/ixaT/5b6f/9Osk/+9mYT/1MO4/9vRy//Ruav/vK2l/7moof/PxLr/y7mk/72Vcv+ug2D/pWI1/3BOOf8AAAD/////AP///wD///8AAAAA/yqVVv8AAAD/////AP///wD///8A////AAEBAP9+Zkv/2bKS/8WQb/+JWUb/rot3/7aek/+jjYH/n3NY/4xwX/9jQTv/jHdn/3RXP/90UDX/eVE3/4JQK/9KMRT/AAAA/////wD///8A////AP///wAAAAD/QLRw/wAAAP////8A////AP///wACAQD/dF5N/8CdhP+relv/o3xi/66Ic/+ATTP/WSwh/35YQ/9YQDf/bVlQ/0MqIv91Uz3/Si4l/3VXQ/90VTj/CQQC/////wD///8A////AP///wD///8AAAAA/0/Bf/8AAAD/////AP///wD///8AAgAA/3tiVv/KqJD/wZp7/y0AAP9ySS3/LQAA/3thU/9pUkn/Uzs2/1lCOf9GHRb/ZE08/z4sHv9cQDL/TDYj/wQCAf////8A////AP///wD///8A////AAAAAP9hzo7/AAAA/////wD///8A////AAAAAP9XQTz/sJSA/8OljP+WfmT/ZFVC/29kVP9oXlP/Wk1H/ysAAP9eUkj/U0M2/1E/Mv8fAAD/bk44/xkVEv////8A////AP///wD///8A////AP///wAAAAD/xN+b/wAAAP////8A////AP///wD///8ABQIB/3hgRP+XcVf/JBAK/yEOCP94XUr/h3Vi/3ZkVP9lVEb/VEQ1/04/M/8gAAD/IAAA/3BRP/9/XzX/AAAA/////wD///8A////AP///wD///8A////AAAAAP////8A////AP///wD///8A////AP///wADAQH/LRQM//6em//NISf/KxIL/4dfR/+DaFH/pY1z/6OEav+AYUv/bU89/4RoWv+qi3j/hGc8/wAAAP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAAA/wAAAP////8ABwYW/wAAAP/RJCz/xQwM/6ouKv8AAAD/cVdF/3ddTf+AW0n/lm5Y/6B3YP+leGL/rX1i/3ZgRf8rEwz/AAAA/wAAAP8AAAD/////AP///wD///8A////AP///wD///8AAAAA/7ycA//38Ij/AAAA/y8VDf8sFAz/UgwQ/1IMEP9SDBD/AAAA/ysSC/8nDwn/KhMM/zQbFP81HRT/MxkR/y8VDv8sFA3/KxMM/wEAAP//+I//upoB/wEBAP////8A////AP///wD///8A////AAAAAP/8+jT/0tAr/1UgDP9XGAv/VxgL/wAAAP8AAAD/AAAA/wAAAP9XGAv/diwW/3kuGP9zKhT/bikV/2ooE/9lKxb/aC0Y/2AmEP9dJA3//Po0/8nDJP8NDQP/////AP///wD///8A////AP///wAAAAD/nYkM/52JDP9HGwr/ejsU/3o7FP8AAAD/KrtN/w5KF/8AAAD/ejsU/6pLIf+7aUD/w3FI/8htQv/hmGD/4Zhg/9ZJHP/RVi//tkYi/6WKA/+diQz/AQEA/////wD///8A////AP///wD///8AAAAA/4BcBv91VAb/TB4L/wAAAP8AAAD/AAAA/ySlRP8OShf/AAAA/wAAAP8AAAD/AQEB/wEBAf8CAgL/BQUE/wcGBf8MCQj/BwcG/zgWCP9nQwH/YVQN/wAAAP////8A////AP///wD///8A////AP///wAAAAD/AAAA/wAAAP////8A////AAAAAP8cgDT/AAAA/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAD/AAAA/wAAAP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AAAAAP8y2lv/Hpo2/wAAAP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAD/Mtpb/x6aNv8AAAD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAAA/zLaW/8emjb/AAAA/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AAAAAP8y2lv/Hpo2/wAAAP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAAA/zLaW/8AAAD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wAAAAD/////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A"};
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
    window.addEventListener('resize', () => { for (const { pane } of entries.values()) clamp(pane); if (anchor !== null) pin(anchor); });
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

// BEGIN SHINY CORE

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const TYPE_KEYS=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  const matchups={normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},ghost:{normal:0,psychic:2,ghost:2,dark:.5},dragon:{dragon:2,steel:.5,fairy:0},dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}};
  function zonesFrom(raw){if(!Array.isArray(raw?.zonas))throw Error('A lista de hunts mudou.');return raw.zonas.map(z=>({index:z.i,name:z.n,base:norm(z.b||z.esp),level:Number(z.lv),tier:String(z.tier||''),region:String(z.r||''),types:[norm(z.t1),norm(z.t2)].filter(t=>TYPE_KEYS.includes(t))})).filter(z=>Number.isInteger(z.index)&&z.index>=0&&z.name&&z.base&&Number.isFinite(z.level));}
  function typesOf(p,zones){const own=Array.isArray(p.types)?p.types.map(norm):[norm(p.type1||p.t1),norm(p.type2||p.t2)];const known=own.filter(t=>TYPE_KEYS.includes(t));return known.length?[...new Set(known)]:zones.find(z=>z.base===norm(p.key||p.base||p.name).replace(/^shiny\s+/,''))?.types||[];}
  function multiplier(attack,defenders,chart){return defenders.reduce((v,d)=>{const native=chart?.[attack]?.[d];return v*(Number.isFinite(native)&&native>=0?native:matchups[attack]?.[d]??1);},1);}
  function selectHunter(team,zone,zones,chart,fixed='auto'){
    const healthy=team.filter(p=>p?.id!=null&&!p.fainted&&!(Number.isFinite(p.hp)&&p.hp<=0));
    if(fixed!=='auto'){const p=healthy.find(p=>String(p.id)===fixed);if(!p)throw Error('O Pokémon fixado saiu do time ou está desmaiado.');return {poke:p,reason:'Escolha fixa'};}
    if(!zone.types.length)throw Error('Tipos da hunt não informados. Escolha um Pokémon fixo.');
    const ranked=healthy.map(p=>{const types=typesOf(p,zones);return {poke:p,types,attack:types.length?Math.max(...types.map(t=>multiplier(t,zone.types,chart))):0,defense:types.length?Math.max(...zone.types.map(t=>multiplier(t,types,chart))):Infinity};}).filter(p=>p.types.length&&p.attack>0);
    ranked.sort((a,b)=>b.attack-a.attack||a.defense-b.defense||String(a.poke.id).localeCompare(String(b.poke.id)));
    if(!ranked.length)throw Error('Não foi possível avaliar os tipos do time. Escolha um Pokémon fixo.');return {...ranked[0],reason:'Vantagem de tipos: ×'+ranked[0].attack};
  }
  function cleanQueue(raw){if(!Array.isArray(raw))return [];return raw.slice(0,30).filter(r=>Number.isInteger(r.index)&&r.index>=0).map(r=>({index:r.index,base:norm(r.base),name:String(r.name||'Hunt #'+r.index),minutes:Number.isFinite(+r.minutes)&&+r.minutes>=1&&+r.minutes<=1440?+r.minutes:10,hunter:r.hunter==null?'auto':String(r.hunter)}));}
  
// END SHINY CORE
  // BEGIN QUEST CORE
  const TYPE_NAMES={normal:'Normal',fire:'Fogo',water:'Água',electric:'Elétrico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Venenoso',ground:'Terra',flying:'Voador',psychic:'Psíquico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Dragão',dark:'Sombrio',steel:'Aço',fairy:'Fada'};
  function parseQuests(raw){
    if(!Array.isArray(raw?.lista)||raw.erro)throw Error('O jogo não retornou a lista de quests.');
    return raw.lista.map(q=>{const type=String(q.id||'').match(/^d2-([a-z]+)$/)?.[1],revealed=raw.revelado||{},min=Number(q.min??q.nivelMin??revealed.min),have=Number(q.feito),goal=Number(q.alvo);let reason='';
      if(q.resgatada)reason='Recompensa já resgatada';else if(q.travada)reason='Quest bloqueada';else if(q.tipo!=='diaria'||!TYPE_NAMES[type]||!Array.isArray(revealed.tipos)||!revealed.tipos.includes(type))reason='Objetivo ainda não automatizado';else if(!Number.isInteger(min)||min<1)reason='Nível mínimo da hunt não informado';else if(!Number.isFinite(have)||have<0||!Number.isFinite(goal)||goal<=0)reason='Progresso não reconhecido';
      return {id:String(q.id||''),name:String(q.nome||q.id||'Quest'),text:String(q.texto||''),type,min,have,goal,ready:q.pronta===true,claimed:q.resgatada===true,locked:q.travada===true,supported:!reason,reason};});
  }
  function questZone(quest,zones,allowed,level,team,chart,fixed='auto'){
    const candidates=zones.filter(z=>z.types.includes(quest.type)&&z.level>=quest.min&&z.level<=level&&allowed.has(z.base));
    const ranked=[];for(const zone of candidates){try{const hunter=selectHunter(team,zone,zones,chart,fixed);ranked.push({zone,hunter});}catch(e){if(fixed!=='auto')throw e;}}
    ranked.sort((a,b)=>a.zone.level-b.zone.level||(b.hunter.attack||0)-(a.hunter.attack||0)||(a.hunter.defense||1)-(b.hunter.defense||1)||a.zone.name.localeCompare(b.zone.name));
    if(!ranked.length)throw Error('Nenhuma hunt liberada de '+TYPE_NAMES[quest.type]+' no nível mínimo '+quest.min+' com um Pokémon disponível.');return ranked[0];
  }
  function xpZone(rows,zones,allowed,level){if(!Array.isArray(rows))throw Error('Resposta de XP não reconhecida.');for(const row of rows.filter(r=>Number.isFinite(r.xpH)).slice().sort((a,b)=>b.xpH-a.xpH)){const found=zones.filter(z=>z.level<=level&&allowed.has(z.base)&&norm(z.name)===norm(row.nome)&&(!row.espChave||z.base===norm(row.espChave)));if(found.length>1)throw Error('Recomendação de XP ambígua. Confira Hunts no Hub.');if(found.length===1)return {...found[0],xpH:row.xpH};}throw Error('Nenhuma recomendação de XP corresponde às áreas liberadas.');}
  // END QUEST CORE
  // BEGIN BOSS PREPARATION CORE
  function bossFromFicha(ficha){
    const q=ficha?.quest,bossId=String(ficha?.luta?.id||q?.id||'');if(!q||!bossId)return null;
    const step=Number(q.passoAtual),stage=Array.isArray(q.passos)&&Number.isInteger(step)?q.passos[step]:null;
    const objectives=(stage?.objetivos||[]).filter(o=>['item','material'].includes(o.conta)).map(o=>({kind:o.conta,key:norm(o.chave),name:String(o.texto||o.chave||'Item'),grade:o.grau==null?0:Number(o.grau),have:Number(o.feito),goal:Number(o.alvo),ok:o.ok===true}));
    let reason='';if(!q.aceita)reason='Aceite a quest de chefe no jogo';else if(q.liberada)reason='Luta liberada — enfrentar manualmente';else if(!stage||!Number.isInteger(step)||step<0)reason='Etapa de chefe não reconhecida';else if(!objectives.length)reason='Etapa manual: sem materiais para coletar';else if(objectives.some(o=>!o.key||!Number.isFinite(o.have)||o.have<0||!Number.isFinite(o.goal)||o.goal<=0||!Number.isInteger(o.grade)||o.grade<0||o.grade>6||(o.kind==='material'&&o.grade<1)))reason='Material ou grau da etapa não reconhecido';
    const chain=parseIslands({lista:[{nome:bossId,titulo:q.titulo||q.nome,aceita:q.aceita,passoAtual:q.passoAtual,passos:q.passos}]} )[0],battleRequired=q.liberada===true||chain.objectives.some(o=>o.kind==='boss'&&!o.ok);if(q.aceita&&stage&&!battleRequired&&(chain.ready||chain.objectives.some(o=>!o.ok&&o.huntable)))reason='';const have=objectives.reduce((sum,o)=>sum+Math.min(o.have,o.goal),0),goal=objectives.reduce((sum,o)=>sum+o.goal,0);
    return {id:'boss:'+bossId,stageId:'boss:'+bossId+':'+step,allObjectives:chain.objectives,costs:chain.costs,nativeReady:chain.ready,battleRequired,kind:'boss',bossId,step,name:String(q.titulo||q.nome||bossId)+' · '+String(q.nome||bossId),text:String(stage?.titulo||''),objectives,have,goal,ready:!reason&&objectives.every(o=>o.have>=o.goal),claimed:false,locked:!q.aceita,supported:!reason,reason,manualOther:(stage?.objetivos||[]).filter(o=>!['item','material'].includes(o.conta)&&!o.ok).map(o=>String(o.texto||o.conta))};
  }
  function eligibleSources(objective,source,zones){
    if(norm(source?.item)!==objective.key||!Array.isArray(source.rotas))throw Error('Origem do item não confirmada pelo jogo.');
    const out=[];
    if(objective.kind==='material'){
      if(Number(source.grau)!==objective.grade)throw Error('O grau consultado não corresponde ao pedido.');
      for(const route of source.rotas){if(typeof route.shiny!=='boolean'||typeof route.tier!=='string'||!Array.isArray(route.exemplos))continue;const names=route.exemplos.filter(e=>!e.traco).map(e=>norm(e.nome));for(const zone of zones)if(norm(zone.tier)===norm(route.tier)&&names.some(n=>n===zone.base||n===norm(zone.name).replace(/^area de /,'')))out.push({zone,shinyOnly:route.shiny,rule:String(route.titulo||'')});}
    }else{
      const typeMap=Object.fromEntries(Object.entries(TYPE_NAMES).flatMap(([key,value])=>[[norm(value),key],[key,key]]));Object.assign(typeMap,{terrestre:'ground',veneno:'poison'});
      for(const route of source.rotas){let region='',type='',min=0,valid=true;for(const line of route.linhas||[]){const text=norm(line),r=text.match(/^regiao:\s*(.+)$/),t=text.match(/^pokemon do tipo\s+(.+)$/),l=text.match(/^nivel minimo:\s*(\d+)$/);if(r)region=r[1];else if(t&&typeMap[t[1]])type=typeMap[t[1]];else if(l)min=+l[1];else if(text)valid=false;}
        if(!valid||(!region&&!type))continue;for(const zone of zones)if((!region||norm(zone.region)===region)&&(!type||zone.types.includes(type))&&zone.level>=min)out.push({zone,shinyOnly:false,rule:String(route.titulo||'')});
      }
    }
    const unique=new Map();for(const entry of out){const key=entry.zone.index+':'+entry.shinyOnly;unique.set(key,entry);}if(!unique.size)throw Error('Nenhuma origem de caça reconhecida para '+objective.name+'. Confira Onde conseguir no jogo.');return [...unique.values()];
  }
  function stockFor(objective,source,reserved){const stock=Number(source?.tem);if(!Number.isFinite(stock)||stock<0)throw Error('O jogo não informou o estoque válido desse material.');return Math.max(0,Math.max(stock,objective.have)-Number(reserved||0));}
  function chooseMaterial(candidates,allowed,level,team,zones,chart,fixed){const options=[];for(const entry of candidates){if(!allowed.has(entry.zone.base)||entry.zone.level>level)continue;try{options.push({...entry,hunter:selectHunter(team,entry.zone,zones,chart,fixed)});}catch(e){if(fixed!=='auto')throw e;}}options.sort((a,b)=>Number(a.shinyOnly)-Number(b.shinyOnly)||a.zone.level-b.zone.level||(b.hunter.attack||0)-(a.hunter.attack||0));if(!options.length)throw Error('Nenhuma hunt de origem liberada para esse material/grau com o time atual.');return options[0];}
  // END BOSS PREPARATION CORE

  // BEGIN ISLAND QUEST CORE
  const ISLAND_HUNTS=new Set(['abates','abatesJanela','abatesTipo','abatesTipoJanela','abatesEspecie','regiao','capturas','capturasTipo','capturasEspecie']);
  function islandType(key){const value=norm(key);return TYPE_KEYS.find(t=>t===value||norm(TYPE_NAMES[t])===value)||({veneno:'poison',terrestre:'ground'})[value]||'';}
  function parseIslands(raw){
    if(!Array.isArray(raw?.lista))throw Error('A lista de quests das ilhas não foi reconhecida.');
    return raw.lista.map(q=>{const step=Number(q.passoAtual),stage=Number.isInteger(step)&&Array.isArray(q.passos)?q.passos[step]:null;
      const objectives=(stage?.objetivos||[]).map((o,index)=>({index,kind:String(o.conta||''),key:String(o.chave||''),name:String(o.texto||o.chave||o.conta||'Objetivo'),have:Number(o.feito),goal:Number(o.alvo),min:o.min==null?1:Number(o.min),grade:o.grau==null?0:Number(o.grau),ok:o.ok===true}));
      const huntValid=o=>ISLAND_HUNTS.has(o.kind)&&Number.isFinite(o.have)&&o.have>=0&&Number.isFinite(o.goal)&&o.goal>0&&Number.isInteger(o.min)&&o.min>=1&&(!['abatesTipo','abatesTipoJanela','capturasTipo'].includes(o.kind)||!!islandType(o.key))&&(!['abatesEspecie','capturasEspecie','regiao'].includes(o.kind)||!!norm(o.key));
      for(const o of objectives)o.huntable=huntValid(o);
      let reason='';if(!q.nome)reason='Ilha sem identificação';else if(q.liberada)reason='Ilha já liberada';else if(!q.aceita)reason='Aceite esta linha de quest no Atlas';else if(!stage||step<0||!objectives.length)reason='Etapa da ilha não reconhecida';
      const pending=objectives.filter(o=>!o.ok),ready=stage?.pronto===true&&pending.length===0;
      const manual=pending.filter(o=>!o.huntable);if(!reason&&!ready&&!pending.some(o=>o.huntable||['item','material'].includes(o.kind)))reason='Etapa manual: '+manual.map(o=>o.name+' ('+o.kind+')').join(' · ');
      return {id:'island:'+String(q.nome||''),kind:'island',island:String(q.nome||''),step,stage:String(stage?.titulo||''),name:String(q.titulo||q.nome||'Quest da ilha'),text:String(q.resumo||''),objectives,ready,claimed:q.liberada===true,locked:!q.aceita,supported:!reason,reason,costs:objectives.filter(o=>['gold','item','material'].includes(o.kind)),manual,have:objectives.reduce((n,o)=>n+(Number.isFinite(o.have)?Math.min(o.have,o.goal):0),0)};
    });
  }
  function islandMatches(o,z){if(!o.huntable||z.level<o.min)return false;if(['abatesTipo','abatesTipoJanela','capturasTipo'].includes(o.kind))return z.types.includes(islandType(o.key));if(['abatesEspecie','capturasEspecie'].includes(o.kind))return z.base===norm(o.key);if(o.kind==='regiao')return norm(z.region)===norm(o.key);return true;}
  function islandZone(quest,zones,allowed,level,team,chart,fixed='auto'){
    const pending=quest.objectives.filter(o=>!o.ok&&o.huntable);if(!pending.length)throw Error('Conclua os requisitos manuais no Atlas e atualize a rota.');
    const target=pending[0],options=[];for(const zone of zones){if(!allowed.has(zone.base)||zone.level>level||!islandMatches(target,zone))continue;try{options.push({zone,hunter:selectHunter(team,zone,zones,chart,fixed),hits:pending.filter(o=>islandMatches(o,zone)).length,target});}catch(e){if(fixed!=='auto')throw e;}}
    options.sort((a,b)=>a.zone.level-b.zone.level||b.hits-a.hits||(b.hunter.attack||0)-(a.hunter.attack||0)||(a.hunter.defense||1)-(b.hunter.defense||1));if(!options.length)throw Error('Nenhuma hunt liberada atende ao objetivo '+target.name+'.');return options[0];
  }
  // END ISLAND QUEST CORE

  const BASE='rebosteio-rota-quests-v1';
  let bossCache=new Map(),bossIds=[],bossFetchedAt=0,originCache=new Map();
  const state=()=>{try{return typeof K==='object'&&K?.player?K:null}catch(_){return null}};
  const token=()=>{try{return typeof q==='string'?q:''}catch(_){return ''}};
  const account=()=>String(state()?.player?.id||state()?.player?.name||'');
  const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch(_){return fallback}};
  const roster=()=>{const map=new Map();for(const p of [...(state()?.team||[]),state()?.active])if(p?.id!=null)map.set(String(p.id),p);return [...map.values()];};
  const isDown=p=>!!p&&(p.fainted===true||Number(p.hp)<=0);
  let owner='',quests=[],settings={selected:[],hunters:{},afterXP:true,islandCosts:false},plan=null,zones=[],chart=null,catalogAt=0,busy=false,epoch=0,nextTick=0,status='Carregue suas quests. Nenhuma ação iniciada.';
  const panel=document.createElement('section');panel.id='rebosteio-rota-quests';panel.className='moon-panel';moonPanelTheme();
  panel.innerHTML=`<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">Rota de Quests<span class="moon-dot"></span></span><button data-minimize title="Minimizar">−</button><button data-close title="Fechar painel">×</button></div><div class="moon-body"><div class="moon-state"><span data-mode>Pausada</span><span>REBOSTEIO</span></div><div class="moon-metrics"><div class="moon-metric"><small>Quest atual</small><strong class="moon-value-text" data-current>—</strong></div><div class="moon-metric"><small>Fila concluída</small><strong data-count>0 / 0</strong></div></div><button class="quest-secondary" data-load>Carregar / atualizar quests</button><div class="quest-actions"><button class="quest-secondary" data-select>Selecionar compatíveis</button><button class="quest-secondary" data-clear>Limpar seleção</button></div><div class="moon-section">QUESTS ATIVAS</div><div data-list class="quest-list"></div><label class="moon-line"><span>Melhor XP ao terminar a fila</span><input data-afterxp type="checkbox" checked></label><label class="moon-line"><span>Entregar etapas automaticamente (itens/gold)</span><input data-islandcosts type="checkbox"></label><button data-start class="moon-go">▶ Iniciar / retomar</button><button data-stop class="moon-stop">Ⅱ Pausar rota</button><div data-status class="moon-detail" role="status"></div><div class="moon-foot">Diárias, quests das ilhas do Atlas e materiais de chefe.<br>Capturas usam seu AutoCatch/Auto-Helper configurado.<br>Continua após entregar etapas; lutas de chefe são manuais.<br>Pause a Rota Shiny/Evolutiva antes de iniciar. Tela completa; sem Card.</div></div>`;
  const css=document.createElement('style');css.textContent='#rebosteio-rota-quests{width:350px}#rebosteio-rota-quests .quest-list{max-height:270px;overflow:auto}#rebosteio-rota-quests .quest-row{padding:8px;border:1px solid #31445c;border-radius:7px;margin-top:6px;background:#101a2b}#rebosteio-rota-quests .quest-head{display:flex;gap:7px;align-items:center}#rebosteio-rota-quests .quest-head strong{flex:1}#rebosteio-rota-quests .quest-progress{font-size:11px;color:#aebdd1;margin:6px 0}#rebosteio-rota-quests select{width:100%;padding:5px;background:#0d1727;color:#f7e9c8;border:1px solid #485b77;border-radius:5px;font:inherit}#rebosteio-rota-quests .quest-secondary{background:#101c2a;color:#d2deed;border:1px solid #485b77;border-radius:7px;padding:8px;font:inherit}#rebosteio-rota-quests .quest-actions{display:flex;gap:6px;margin-top:6px}';document.head.appendChild(css);document.body.appendChild(panel);
  function icon(){const s=QUEST_PIXELS,c=document.createElement('canvas');c.width=s.w;c.height=s.h;const ctx=c.getContext('2d'),data=ctx.createImageData(s.w,s.h),bytes=atob(s.rgba);for(let i=0;i<bytes.length;i++)data.data[i]=bytes.charCodeAt(i);ctx.putImageData(data,0,0);return c;}
  panel.querySelector('[data-icon]').replaceWith(icon());const button=addMoonDockButton('quests','Rota de Quests — Martial Arts Scroll',icon(),panel),dock=button.parentElement;
  const sortDock=()=>{const ids=['quests','shiny','evolution','autocatch','autorefill','bestiario','hunts','huntreturn'],list=[...dock.children].sort((a,b)=>ids.indexOf(a.dataset.kjdButton)-ids.indexOf(b.dataset.kjdButton));if(list.some((b,i)=>dock.children[i]!==b))list.forEach(b=>dock.appendChild(b));};new MutationObserver(sortDock).observe(dock,{childList:true});sortDock();moonDock().drag(panel,panel.querySelector('[data-handle]'),{storageKey:BASE+':position'});
  const $=key=>panel.querySelector('[data-'+key+']');
  function save(){if(owner)localStorage.setItem(BASE+':'+owner,JSON.stringify({settings,plan}));}
  function bind(){const next=account();if(!next)return false;if(next!==owner){epoch++;owner=next;const data=load(BASE+':'+owner,{});settings={selected:[],hunters:{},afterXP:true,islandCosts:false,...data.settings};if(!Array.isArray(settings.selected))settings.selected=[];settings.hunters=settings.hunters&&typeof settings.hunters==='object'?settings.hunters:{};const stable=id=>String(id).replace(/^(boss:[^:]+):\d+$/,'$1');settings.selected=[...new Set(settings.selected.map(stable))];for(const [id,value]of Object.entries(settings.hunters)){const key=stable(id);if(key!==id&&!settings.hunters[key])settings.hunters[key]=value;}plan=data.plan||null;if(plan?.ids)plan.ids=plan.ids.map(stable);quests=[];zones=[];catalogAt=0;bossCache=new Map();bossIds=[];bossFetchedAt=0;originCache=new Map();status=plan?.running?'Retomando quests selecionadas…':'Carregue as quests para escolher sua fila.';draw();}return true;}
  function otherRoute(){return load('kjd-rota-shiny-v1:'+owner,{})?.plan?.running||load('kjd-rota-evolutiva-v1:plan:'+owner,{})?.running;}
  function check(context){if(context!==epoch||!plan?.running||account()!==owner)throw Error('Rota pausada ou conta alterada.');if(plan.day!==day())throw Error('O dia mudou. Atualize e selecione as quests novas.');if(otherRoute())throw Error('Pause a Rota Shiny/Evolutiva para evitar viagens concorrentes.');return state();}
  function render(){bind();const running=!!plan?.running;$('mode').textContent=running?'Ativa · '+(plan.phase==='xp'?'melhor XP':plan.recovery?'recuperação':'quests'):'Pausada';$('current').textContent=quests.find(q=>q.id===plan?.ids?.[plan.cursor])?.name||plan?.questName||'—';$('count').textContent=(plan?.cursor||0)+' / '+(plan?.ids?.length||settings.selected.length);$('status').textContent=status;panel.classList.toggle('moon-active',running);for(const key of ['load','select','clear','afterxp','islandcosts'])$(key).disabled=running||busy;$('afterxp').checked=settings.afterXP;$('islandcosts').checked=!!settings.islandCosts;$('start').disabled=running||busy||!settings.selected.length||!state()?.active;$('stop').disabled=!running;}
  function draw(){$('list').replaceChildren();for(const q of quests.filter(q=>!q.claimed)){const row=document.createElement('div');row.className='quest-row';const head=document.createElement('label');head.className='quest-head';const box=document.createElement('input');box.type='checkbox';box.checked=settings.selected.includes(q.id);box.disabled=!q.supported||!!plan?.running;box.onchange=()=>{settings.selected=box.checked?[...new Set([...settings.selected,q.id])]:settings.selected.filter(id=>id!==q.id);save();render();};const name=document.createElement('strong');name.textContent=q.name;head.append(box,name);row.appendChild(head);const detail=document.createElement('div');detail.className='quest-progress';detail.textContent=q.kind==='island'?'Ilha: '+q.island+' · Etapa '+(q.step+1)+' · '+q.stage+'\n'+q.objectives.map(o=>(o.ok?'✓ ':'')+o.name+': '+o.have+'/'+o.goal).join('\n')+(q.reason?'\n'+q.reason:'')+(q.ready?'\n✓ Pronta para entregar':'')+(q.manual.length?'\nRequisitos manuais: '+q.manual.map(o=>o.name).join(' · '):''):q.kind==='boss'?(q.supported?q.text+'\n'+(settings.islandCosts?q.allObjectives:q.objectives).map(o=>o.name+': '+Math.min(o.have,o.goal)+'/'+o.goal).join('\n')+(plan?.prepared?.includes(q.stageId||q.id)?'\n✓ Materiais preparados — entrega/luta manuais':''):q.reason):q.supported?Math.min(q.have,q.goal)+' / '+q.goal+' · '+TYPE_NAMES[q.type]+' · hunt nv '+q.min+'+':q.reason;detail.style.whiteSpace='pre-wrap';row.appendChild(detail);if(q.supported){const select=document.createElement('select');select.setAttribute('aria-label','Pokémon para '+q.name);const auto=document.createElement('option');auto.value='auto';auto.textContent='Automático por tipos';select.appendChild(auto);for(const p of roster()){const o=document.createElement('option');o.value=String(p.id);o.textContent=(p.shiny?'✨ ':'')+p.name;select.appendChild(o);}const fixed=settings.hunters[q.id]||'auto';if(fixed!=='auto'&&!roster().some(p=>String(p.id)===fixed)){const o=document.createElement('option');o.value=fixed;o.textContent='Pokémon fora do time';select.appendChild(o);}select.value=fixed;select.disabled=!!plan?.running;select.onchange=()=>{settings.hunters[q.id]=select.value;save();};row.appendChild(select);} $('list').appendChild(row);}if(!quests.some(q=>!q.claimed))$('list').textContent='Nenhuma quest ativa carregada.';}
  function halt(message){epoch++;if(plan)plan.running=false;status=message;save();draw();render();}
  async function read(path){if(!token())throw Error('Sessão do jogo não encontrada.');const res=await fetch(path+(path.includes('?')?'&':'?')+'token='+encodeURIComponent(token()),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}),data=await res.json();if(!res.ok||data?.err||data?.erro){const e=Error(data?.err||'Falha na consulta do jogo.');e.transient=res.status===429||res.status>=500;throw e;}return data;}
  async function refresh(){const raw=await read('/api/state'),s=raw.state||raw;if(s.player&&typeof handleStateUpdate==='function')handleStateUpdate(s);}
  async function refreshQuests(){const daily=parseQuests(await read('/api/quests')),islands=parseIslands(await read('/api/ilhas'));if(!bossFetchedAt||Date.now()-bossFetchedAt>60000){const catalog=await read('/api/boss/catalogo');if(!Array.isArray(catalog.lutas))throw Error('Catálogo de chefes não reconhecido.');bossIds=[...new Set([...catalog.lutas.filter(l=>l.quest&&l.quest.estado==='andamento').map(l=>String(l.id)),...settings.selected.filter(id=>id.startsWith('boss:')).map(id=>id.slice(5))])];const details=await Promise.all(bossIds.map(id=>read('/api/boss/ficha?id='+encodeURIComponent(id))));for(let i=0;i<details.length;i++)bossCache.set(bossIds[i],bossFromFicha(details[i]));bossFetchedAt=Date.now();}else{const id=plan?.ids?.[plan.cursor];if(id?.startsWith('boss:')){const cached=[...bossCache.values()].find(q=>q?.id===id);if(cached)bossCache.set(cached.bossId,bossFromFicha(await read('/api/boss/ficha?id='+encodeURIComponent(cached.bossId))));}}quests=[...daily,...islands,...bossIds.map(id=>bossCache.get(id)).filter(Boolean)];draw();}
  async function catalog(){if(!zones.length||Date.now()-catalogAt>60000){const raw=await read('/api/hunts');zones=zonesFrom(raw);chart=raw.typeChart||null;catalogAt=Date.now();}}
  async function allowed(){if(typeof window.IPM_HUNTS?.liberadas!=='function')throw Error('A interface de hunts não está pronta.');const result=await window.IPM_HUNTS.liberadas();if(!(result instanceof Set))throw Error('Não foi possível validar as hunts liberadas.');return new Set([...result].map(norm));}
  async function action(name,params,context){if(!['setActive','selectZone','goCity','npcTalk','questclaim','ilhaEntregar','bossQuestEntregar'].includes(name)||name==='questclaim'&&String(params.id).startsWith('boss:'))throw Error('Ação não permitida: lutas de chefe são manuais.');if(name==='bossQuestEntregar'){const current=quests.find(q=>q.id===plan?.ids?.[plan.cursor]);if(!settings.islandCosts||current?.kind!=='boss'||current.bossId!==params.luta||!current.nativeReady||current.battleRequired)throw Error('Entrega de chefe não autorizada, não pronta ou exige luta manual.');}if(name==='ilhaEntregar'){const current=quests.find(q=>q.id===plan?.ids?.[plan.cursor]);if(current?.kind!=='island'||!current.ready||current.island!==params.ilha||current.costs.length&&!settings.islandCosts)throw Error('Entrega da ilha não autorizada ou etapa ainda não pronta.');}check(context);const res=await fetch('/api/action',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({token:token(),action:name,...params})}),data=await res.json();if(!res.ok||data?.err||data?.precisaConfirmar){const e=Error(data?.err||'O jogo recusou a ação ou pediu confirmação.');e.transient=res.status===429||res.status>=500;if(['selectZone','goCity'].includes(name)&&!data?.precisaConfirmar&&/aguard[ea].*viajar/i.test(e.message))e.travelCooldown=true;throw e;}if(data.state&&typeof handleStateUpdate==='function')handleStateUpdate(data.state);return data;}
  const zoneIndex=()=>Number.isInteger(state()?.inst?.zona)?state().inst.zona:state()?.zone?.index;
  async function activate(p,context){if(String(state()?.active?.id)!==String(p.id))await action('setActive',{pokeId:p.id},context);check(context);if(String(state()?.active?.id)!==String(p.id))throw Error('A troca do Pokémon não foi confirmada.');}
  async function travel(zone,context){const available=await allowed();check(context);if(!available.has(zone.base)||zone.level>state().player.level)throw Error('Hunt não liberada para a conta.');if(zoneIndex()!==zone.index||state()?.inst?.furiosa)await action('selectZone',{index:zone.index,furiosa:false,confirmo:false,naoPerguntar:false},context);check(context);if(zoneIndex()!==zone.index||state()?.inst?.furiosa)throw Error('Chegada à hunt normal não confirmada.');}
  async function heal(context){const r=plan.recovery;await refresh();check(context);if(Date.now()-r.started>120000)throw Error('Recuperação demorou demais. Confira a Nurse.');if(r.stage==='city'){status='Indo ao Centro Pokémon…';await action('goCity',{},context);r.stage='heal';save();return;}const p=roster().find(p=>String(p.id)===plan.hunterId);if(!p)throw Error('O Pokémon da quest saiu do time.');if(isDown(p)){let name;try{name=(typeof gameState==='object'?gameState.npcs:[])?.find(n=>n.role==='heal')?.name}catch(_){}if(!name){status='Aguardando a Nurse carregar…';return;}await action('npcTalk',{name},context);await refresh();check(context);if(isDown(roster().find(p=>String(p.id)===plan.hunterId)))throw Error('Cura não confirmada.');}plan.recovery=null;plan.zoneIndex=null;save();status='Equipe curada. Retomando a quest.';}
  async function origin(objective){const key=objective.kind+':'+objective.key+':'+objective.grade,cached=originCache.get(key);if(cached&&Date.now()-cached.at<15000)return cached.data;const path=objective.kind==='material'?'/api/profissoes/origem':'/api/item/origem';const data=await read(path+'?item='+encodeURIComponent(objective.key)+(objective.grade?'&grau='+objective.grade:''));originCache.set(key,{data,at:Date.now()});return data;}
  async function prepareBoss(quest,context){
    if(plan.prepared?.includes(quest.stageId||quest.id)){plan.cursor++;plan.zoneIndex=null;save();return;}
    if(!quest.supported)throw Error(quest.reason);plan.questName=quest.name;
    const tracked=roster().find(p=>String(p.id)===plan.hunterId);if(plan.currentId===quest.id&&tracked&&isDown(tracked)){plan.recovery={stage:'city',started:Date.now()};save();await heal(context);return;}
    if(plan.currentId!==quest.id){plan.currentId=quest.id;plan.progressAt=Date.now();plan.lastProgress=-1;plan.zoneIndex=null;}
    if(plan.zoneIndex!=null&&(String(state()?.active?.id)!==plan.hunterId||zoneIndex()!==plan.zoneIndex||state()?.inst?.furiosa))throw Error('Hunt ou Pokémon alterado fora da rota. Pause e retome.');
    const reserved=plan.reserved||{},working={...reserved},evaluated=[];for(const objective of quest.objectives){check(context);const source=await origin(objective);check(context);const have=stockFor(objective,source,working[objective.key]);evaluated.push({objective,source,have});working[objective.key]=(working[objective.key]||0)+objective.goal;}
    const pending=evaluated.filter(e=>e.have<e.objective.goal);
    if(!pending.length){plan.prepared=[...(plan.prepared||[]),quest.stageId||quest.id];plan.reserved=reserved;for(const {objective}of evaluated)plan.reserved[objective.key]=(plan.reserved[objective.key]||0)+objective.goal;plan.cursor++;plan.zoneIndex=null;save();draw();status='Materiais de '+quest.name+' preparados. Entrega de passo e luta ficam manuais.'+(quest.manualOther.length?' Outros requisitos: '+quest.manualOther.join(' · '):'');return;}
    const task=pending[0],sources=eligibleSources(task.objective,task.source,zones),chosen=chooseMaterial(sources,await allowed(),state().player.level,roster(),zones,chart,settings.hunters[quest.id]||'auto');check(context);await activate(chosen.hunter.poke,context);plan.hunterId=String(chosen.hunter.poke.id);plan.lastHunterId=plan.hunterId;save();await travel(chosen.zone,context);plan.zoneIndex=chosen.zone.index;
    const progress=evaluated.reduce((sum,e)=>sum+Math.min(e.have,e.objective.goal),0);if(progress!==plan.lastProgress){plan.lastProgress=progress;plan.progressAt=Date.now();}if(Date.now()-plan.progressAt>3600000)throw Error('Sem materiais válidos há uma hora. Confira a origem e o grau no jogo.');save();status='Coletando '+task.objective.name+': '+Math.min(task.have,task.objective.goal)+'/'+task.objective.goal+' em '+chosen.zone.name+' com '+chosen.hunter.poke.name+(chosen.shinyOnly?' · ATENÇÃO: o grau pedido só cai de abates SHINY nesta origem.':'')+(reserved[task.objective.key]?' · Estoque reservado para outros chefes: '+reserved[task.objective.key]+'.':'');
  }
  async function runIsland(quest,context){
    if(quest.claimed){plan.cursor++;plan.zoneIndex=null;save();return;}
    if(!quest.supported&&!quest.battleRequired)throw Error(quest.reason);
    const tracked=roster().find(p=>String(p.id)===plan.hunterId);if(plan.currentId?.startsWith(quest.id+':')&&tracked&&isDown(tracked)){plan.recovery={stage:'city',started:Date.now()};save();await heal(context);return;}
    const isBoss=quest.kind==='boss',ready=isBoss?quest.nativeReady:quest.ready;
    if((quest.battleRequired||quest.objectives.some(o=>o.kind==='boss'&&!o.ok))&&!quest.objectives.some(o=>!o.ok&&(o.huntable||['item','material'].includes(o.kind)))){plan.blockedBoss=[...new Set([...(plan.blockedBoss||[]),quest.name])];plan.cursor++;plan.zoneIndex=null;save();status=quest.name+': etapa de enfrentar chefe. Luta manual; continuando as outras quests.';return;}
    if(ready){if((isBoss||quest.costs.length)&&!settings.islandCosts)throw Error('Etapa pronta. Entregue no jogo ou marque Entregar etapas automaticamente (itens/gold).');status='Entregando '+quest.name+' · '+quest.stage+'…';render();await action(isBoss?'bossQuestEntregar':'ilhaEntregar',isBoss?{luta:quest.bossId}:{ilha:quest.island},context);check(context);if(isBoss)bossCache.set(quest.bossId,bossFromFicha(await read('/api/boss/ficha?id='+encodeURIComponent(quest.bossId))));await refreshQuests();check(context);const updated=quests.find(q=>q.id===quest.id);if(!updated||!updated.claimed&&!updated.battleRequired&&updated.step!==quest.step+1)throw Error('O jogo não confirmou o avanço da quest. Confira a missão antes de retomar.');plan.zoneIndex=null;plan.currentId=null;plan.progressAt=Date.now();originCache.clear();if(updated.claimed)plan.cursor++;save();status=updated.claimed?quest.name+' finalizada!':'Etapa entregue. Continuando '+updated.name+'.';return;}
    const material=quest.objectives.find(o=>!o.ok&&['item','material'].includes(o.kind));
    if(material){if(!material.key||!Number.isFinite(material.goal)||material.goal<=0||!Number.isFinite(material.have)||material.have<0||!Number.isInteger(material.grade)||material.grade<0||material.grade>6||material.kind==='material'&&material.grade<1)throw Error('Material/grau da quest não reconhecido.');const source=await origin({...material,key:norm(material.key)});check(context);const have=stockFor(material,source,0);if(have>=material.goal){status='Estoque suficiente. Aguardando o jogo confirmar a etapa de '+quest.name+'…';save();return;}const chosen=chooseMaterial(eligibleSources({...material,key:norm(material.key)},source,zones),await allowed(),state().player.level,roster(),zones,chart,settings.hunters[quest.id]||'auto');check(context);const taskId=quest.id+':'+quest.step+':material:'+material.index;if(plan.currentId!==taskId){plan.currentId=taskId;plan.progressAt=Date.now();plan.lastProgress=have;plan.zoneIndex=null;}if(plan.zoneIndex!=null&&(String(state()?.active?.id)!==plan.hunterId||zoneIndex()!==plan.zoneIndex||state()?.inst?.furiosa))throw Error('Hunt ou Pokémon alterado fora da rota. Pause e retome.');await activate(chosen.hunter.poke,context);plan.hunterId=String(chosen.hunter.poke.id);plan.lastHunterId=plan.hunterId;save();await travel(chosen.zone,context);plan.zoneIndex=chosen.zone.index;if(have>plan.lastProgress){plan.lastProgress=have;plan.progressAt=Date.now();}if(Date.now()-plan.progressAt>3600000)throw Error('Sem materiais válidos há uma hora. Confira origem e grau.');save();status=quest.name+' · '+material.name+': '+have+'/'+material.goal+' · '+chosen.zone.name+(chosen.shinyOnly?' · Material depende de abates shiny.':'');return;}
    const chosen=islandZone(quest,zones,await allowed(),state().player.level,roster(),chart,settings.hunters[quest.id]||'auto');check(context);const taskId=quest.id+':'+quest.step+':'+chosen.target.index;
    if(plan.currentId!==taskId){plan.currentId=taskId;plan.lastProgress=chosen.target.have;plan.progressAt=Date.now();plan.zoneIndex=null;}
    if(plan.zoneIndex!=null&&(String(state()?.active?.id)!==plan.hunterId||zoneIndex()!==plan.zoneIndex||state()?.inst?.furiosa))throw Error('Hunt ou Pokémon alterado fora da rota. Pause e retome.');
    await activate(chosen.hunter.poke,context);plan.hunterId=String(chosen.hunter.poke.id);plan.lastHunterId=plan.hunterId;save();await travel(chosen.zone,context);plan.zoneIndex=chosen.zone.index;
    if(chosen.target.have<plan.lastProgress)throw Error('O progresso da ilha voltou atrás. Confira o Atlas.');if(chosen.target.have>plan.lastProgress){plan.lastProgress=chosen.target.have;plan.progressAt=Date.now();}if(Date.now()-plan.progressAt>180000)throw Error('Sem progresso por três minutos. Confira o objetivo e o AutoCatch/Auto-Helper para capturas.');save();status=quest.name+' · '+quest.stage+' · '+chosen.target.name+': '+chosen.target.have+'/'+chosen.target.goal+' · '+chosen.zone.name+' com '+chosen.hunter.poke.name+(chosen.hits>1?' · '+chosen.hits+' objetivos na mesma hunt.':'.');
  }
  async function step(context){await refresh();check(context);await refreshQuests();check(context);await catalog();check(context);
    if(plan.recovery){await heal(context);return;}
    if(plan.phase==='xp'){
      const p=roster().find(p=>String(p.id)===plan.lastHunterId);if(!p)throw Error('O Pokémon da última quest saiu do time.');if(isDown(p)){plan.hunterId=String(p.id);plan.recovery={stage:'city',started:Date.now()};save();await heal(context);return;}await activate(p,context);
      if(!window.__idleMoonHunts?.request)throw Error('Atualize o Hub para consultar melhor XP.');status='Quests entregues. Consultando melhor XP para '+p.name+'…';render();const result=await window.__idleMoonHunts.request({nivel:state().player.level,poke:String(p.id),furiosa:false});check(context);if(String(state()?.active?.id)!==String(p.id))throw Error('O Pokémon mudou durante a consulta de XP.');if(!result?.ok)throw Error(result?.error||'Falha ao consultar XP.');const zone=xpZone(result.data?.hunts,zones,await allowed(),state().player.level);await travel(zone,context);plan.phase='done';halt('Fila concluída. '+(plan.prepared?.length?plan.prepared.length+' chefe(s) com materiais preparados; entrega/luta manuais. ':'')+p.name+' em '+zone.name+' · '+Math.round(zone.xpH).toLocaleString('pt-BR')+' XP base/h.');return;
    }
    if(plan.cursor>=plan.ids.length){if(plan.blockedBoss?.length){plan.phase='done';halt('Coletas/entregas concluídas. Luta manual pendente: '+plan.blockedBoss.join(' · ')+'.');return;}if(settings.afterXP&&plan.lastHunterId){plan.phase='xp';save();return;}plan.phase='done';halt('Fila concluída. '+(plan.prepared?.length?plan.prepared.length+' chefe(s) preparados: entrega e luta manuais. ':'')+'Resgates de diárias confirmados no jogo.');return;}
    const id=plan.ids[plan.cursor],quest=quests.find(q=>q.id===id);if(!quest)throw Error('Uma quest selecionada desapareceu. Atualize a lista antes de retomar.');plan.questName=quest.name;
    if(quest.kind==='island'){await runIsland(quest,context);return;}
    if(quest.kind==='boss'){if(settings.islandCosts)await runIsland({...quest,objectives:quest.allObjectives,stage:quest.text},context);else await prepareBoss(quest,context);return;}
    if(quest.claimed){plan.cursor++;plan.zoneIndex=null;save();return;}
    if(!quest.supported)throw Error(quest.reason);
    const tracked=roster().find(p=>String(p.id)===plan.hunterId);if(plan.currentId===id&&tracked&&isDown(tracked)){plan.recovery={stage:'city',started:Date.now()};save();await heal(context);return;}
    const available=await allowed();check(context);const chosen=questZone(quest,zones,available,state().player.level,roster(),chart,settings.hunters[id]||'auto');
    if(plan.currentId!==id){plan.currentId=id;plan.lastProgress=quest.have;plan.progressAt=Date.now();plan.zoneIndex=null;}
    if(plan.zoneIndex!=null&&(String(state()?.active?.id)!==plan.hunterId||zoneIndex()!==plan.zoneIndex||state()?.inst?.furiosa))throw Error('Hunt ou Pokémon alterado fora da rota. Pause e retome.');
    await activate(chosen.hunter.poke,context);plan.hunterId=String(chosen.hunter.poke.id);plan.lastHunterId=plan.hunterId;save();
    if(quest.ready){status='Quest pronta. Resgatando '+quest.name+'…';render();await action('questclaim',{id},context);check(context);await refreshQuests();check(context);const confirmed=quests.find(q=>q.id===id);if(!confirmed?.claimed)throw Error('O jogo não confirmou o resgate. Consulte as quests antes de retomar.');plan.cursor++;plan.zoneIndex=null;plan.lastClaimed=id;save();status='Recompensa de '+quest.name+' resgatada. Preparando a próxima.';return;}
    await travel(chosen.zone,context);plan.zoneIndex=chosen.zone.index;
    if(quest.have<plan.lastProgress)throw Error('O progresso da quest foi reiniciado. Confira a missão antes de retomar.');if(quest.have>plan.lastProgress){plan.lastProgress=quest.have;plan.progressAt=Date.now();}
    if(Date.now()-plan.progressAt>180000)throw Error('Sem progresso por três minutos. Confira os requisitos da quest e o Pokémon.');save();status=quest.name+': '+quest.have+'/'+quest.goal+' · '+chosen.zone.name+' (nv '+chosen.zone.level+') com '+chosen.hunter.poke.name+'.';
  }
  async function tick(){if(busy||!bind()||!plan?.running||Date.now()<nextTick)return;busy=true;const context=epoch;render();try{await step(context);if(context===epoch){plan.cooldownStarted=0;plan.retries=0;nextTick=Date.now()+6000;save();}}catch(e){if(context===epoch){if(e.travelCooldown){plan.cooldownStarted=plan.cooldownStarted||Date.now();if(Date.now()-plan.cooldownStarted>=120000)halt('Viagem bloqueada por dois minutos. Confira o jogo e retome.');else{nextTick=Date.now()+10000;status='Aguardando o intervalo de viagem do jogo. Nova tentativa na mesma hunt em 10 segundos.';save();}}else if(e.transient||e.name==='TimeoutError'||e.name==='AbortError'){plan.retries=(plan.retries||0)+1;if(plan.retries<=3){nextTick=Date.now()+15000;status='Conexão lenta. Tentativa '+plan.retries+'/3 em 15 segundos.';save();}else halt('Falhas de conexão repetidas. Retome quando o jogo estabilizar.');}else halt(e.message);}}finally{busy=false;render();}}
  $('load').onclick=async()=>{if(busy)return;busy=true;render();try{await refresh();await refreshQuests();await catalog();status='Selecione diárias, quests aceitas das ilhas e preparações de chefe. Marque Entregar etapas automaticamente para entregar materiais/gold e continuar as próximas etapas. Lutas de chefe continuam manuais.';}catch(e){status=e.message;}finally{busy=false;render();}};
  $('select').onclick=()=>{settings.selected=quests.filter(q=>q.supported).map(q=>q.id);save();draw();render();};$('clear').onclick=()=>{settings.selected=[];save();draw();render();};$('islandcosts').onchange=()=>{settings.islandCosts=$('islandcosts').checked;save();draw();};$('afterxp').onchange=()=>{settings.afterXP=$('afterxp').checked;save();};
  $('start').onclick=()=>{if(!bind()||busy||!settings.selected.length)return;if(otherRoute()){status='Pause a Rota Shiny/Evolutiva antes de iniciar esta rota.';render();return;}const resume=plan&&plan.day===day()&&plan.phase!=='done'&&JSON.stringify(plan.ids)===JSON.stringify(settings.selected);plan=resume?{...plan,running:true,day:day(),retries:0,zoneIndex:null,progressAt:Date.now()}:{running:true,day:day(),phase:'quests',ids:[...settings.selected],cursor:0,retries:0};epoch++;nextTick=0;save();draw();tick();};$('stop').onclick=()=>halt('Rota pausada. Combate, captura e seleção preservados.');
  $('close').onclick=()=>{panel.hidden=true;moonDock().sync();};$('minimize').onclick=()=>{panel.classList.toggle('moon-collapsed');$('minimize').textContent=panel.classList.contains('moon-collapsed')?'+':'−';};setInterval(()=>{render();tick();},2000);render();

})();
