// ==UserScript==
// @name         Poke Moon Voltar à Hunt by KimJongDudu
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.0.1
// @description  Volte à hunt anterior ou a uma hunt salva. Atalho com a bicicleta do Pokémon.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(() => {
  'use strict';
  if (window.__kjdVoltarHunt) return;
  window.__kjdVoltarHunt = true;
  // Bicycle sprite supplied by the user, embedded as exact RGBA pixels.
  // Source: https://wiki.pokexgames.com/images/9/95/Bicycle4.png
  const BICYCLE_PIXELS = {"w":24,"h":24,"rgba":"////AP///wD///8A////AAUHCf8NDg//DA0P/wEBAf8DAwP/AAAA/wAAAAsAAAAA////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AAcHCf8ICQr/ExMU/xQUFf9OTk//RUVF/0NDRP88PD3/GBkZ/xUVFv8QERL/CAkK/wYHCP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8ADA0N/zw8PP9KSkr/Mzg4/zk7O/9FRET/TU1N/0hISP86Ojr/XGVl/zc5Of8wLy//TExM/zg4OP8CAwT/AAAA/wgKDf8EBQb/AAAA/////wD///8A////AP///wD///8ABQcK/wMEBv8CAwX/NgwM/ygWFv8FCgr/VVhY/1lfX/8JCwz/VAgI/y8gIP8CAwX/AwQG/wYIC/8HCAv/HR8h/zw+Rv80Njz/FBQV/wUGCP////8A////AP///wD///8ABQcK/xwdHv9DRkb/RSEi/xMDBP8KBgj/KCEh/x4VFf8IBwr/KAEB/zwfH/9DSEj/GRod/yEcCP95clj/bmlW/5OBPP94bD7/MzU8/x0cF/8GCAr/////AP///wD///8A////AAkKDP8MDQ//BQcK/////wBBCwz/wh4e/6QLC/8sAwP/BggK/////wAMDQ//BwkL/y4oCv9yYBr/UUMQ/yEbBP99aBf/bmAn/xwZCv8AAAD/////AP///wD///8A////AP///wD///8A////AP///wByFhb/9Ssr/7sICP91AwP/BQYI/////wD///8ABggK/wAAAv8GCAr/GBsg/zU2Of8EBQf/CwoG/wYIC/8GCAr/BggK/wYICv////8A////AP///wD///8AAAAADwAAAP4KCAn/LSUl/zIGBv+vAAD/HwQE/////wD///8ABggKAAYICgAGCAoADRMV/yMoKP////8A////ABUVFv88PDz/OTk5/zU1Nf8HCAr/////AP///wD///8ABwkM/y8wMf9sbW3/dXl5/1tdXf9jJCT/cQIC/wYGCP8AAAD/BQQE/xAHCv9CBQb/ZiAg/zcbG/////8A////ACQkJP8REhP/DA0O/2tra/9DQ0P/////AP///wD///8ABwkM/z4+P/9ubm7/ZGRk/4CGhv9FKCj/pgIC/1IEBf8pBAb/igwN/7IXF//eGhr/3wsN/1UBAf8MERP/HB0e/xITE/8FBgj/CQoL/4eHh/8LDA3/////AP///wD///8A////ABYXGf8fHx//AgME/0NHR/8PAgL/ngQE/80REf/bHBz/zxQU/6cLC/9ZBAX/cA8F/0AUE/9RWFj/VVVW/1VUUv8wLyn/T1BQ/01NTf8GBwr/////AP///wAHCQz/HB0e/x8fH/8fHx//GRoa/35+fv8CBwj/QAID/8YICP96AwL/GQID/wMEBf8EDAT/NjgK/yo0MP83QUH/HiQk/yUjHf8oJBH/e3t+/wkKC/////8ABggKLQgKDf8vLzD/Xl5e/zU1Nf8eHh7/GBgY/3R0df8KDRP/BgID/6gGBv9rAgP/KikJ/11REf+8niP/jn0d/zQMB/9VAAD/PRgX/xcfH/8mJyr/UlJP/wQFB/////8ABggKUhUWGP9gYGD/LS0t/xYVFv9BQUH/BQYI/0pIQ/9bUCD/Bw0N/0QCAv/BBwf/MA4D/xMTCP9XSRH/T0US/xQDAP8UBAX/UAIC/1IpKf9ocHb/WU4g/z42FP8FBwr/DhAS/0lJSf8+Pj7/BQYI/xkaHP9LS0v/Hx8h/zExMP+EcR//ODQV/wQDBP+oBwf/gQME/wYEBv8BAgb/GCAn/x0EBP8fEBD/OUdH/0YAAP8pEBH/DxAH/11SIf8DBAj/Hh8g/1RUVP8RERL/BggL/yMkJf+ampr/Tk5O/yYnMP9fUx7/cWIj/wMEB/9GAQH/mAUF/ycFBf8QExP/LxcX/y4UFP9VDAz/eBgY/4ANDf8hAQH/CgwG/2tdJv8DBAj/DAwN/y0tLf8GCAn/BggL/2BgYP9YWFj/Pz8//y0tMP8REAv/iXUb/wcIBv8ZExX/HQIC/x4ODv9KR0f/YQ4O/3EXF/+AHBz/aTEx/1E6Ov8tKCv/FxUI/4BtJf8DBAf/CwsM/ygoKP8GCAn/BggL/2BgYP85OTn/RENE/z09P/8ICAb/j3kb/wcHBf8iJSf/GBwd/ygrK/8sLS3/GCIi/w4ZGf8LFhb/Nj09/2JlZv8OEBb/blsT/3JgF/8EBgj/DAwN/ysrK/8FBgf/BggL/1paWv9HSEj/Pz9A/zs8P/8QDgf/qo4h/wcIB/8FBwn/Hh4f/0FBQf8FBgb/EhIT/x8fH/8EBQf/BggL/wYIC/8KCQb/waEl/xkWDf////8ABgYH/ycnJ/8XFxf/BggL/xMUF/9iYmL/XV5f/wsNFP9lVRD/iXQi/wUGCP////8ABQcK/xobHf8vMTP/MTIz/x4eHf8dHR3/BAUH/xsYCP98ah7/Wk4g/wUGCP////8ABQcKNwsMDf8xMTH/CgsM/wYIC/8GCAv/BggL/ykjCv+7niX/FxUN/////wD///8ABQYH/z4wJ/9MPTL/Pjcy/xQUFP8gICD/LCwt/zQyK/8kIRj/BAYI/////wD///8AAAAAAAUGCP8hISH/NTU1/wsMDf8HBwb/KiMJ/62SJP9LQx7/BQYI/////wD///8ABgYG/10xE/9lNhP/OiMU/wUGCf8EBgj/BQYH/wQFB/8GBwr/////AP///wD///8AAAAAAAAAAAAFBgj/GBgY/ykqLf9FQCj/XVEc/xcVDf8EBgj/////AP///wD///8A////AAYICv8GCAr/BggK/////wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8ABAYI/woLDP8NDQ7/BAUH/wQGCP////8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A"};
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

  // BEGIN HUNT SHORTCUTS CORE
  const normalizeHunt = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function cleanDestination(value) {
    if (!value || !Number.isInteger(value.index) || value.index < 0) return null;
    return { index: value.index, furiosa: value.furiosa === true, name: String(value.name || 'Hunt #' + value.index).slice(0, 120), base: String(value.base || '').slice(0, 80) };
  }
  function sameHunt(a, b) { return !!a && !!b && a.index === b.index && a.furiosa === b.furiosa; }
  function createHuntHistory(saved = {}) {
    let current = cleanDestination(saved.current), previous = cleanDestination(saved.previous), bookmark = cleanDestination(saved.bookmark);
    return {
      observe(value) {
        const next = cleanDestination(value); if (!next) return false;
        if (sameHunt(current, next)) { const changed = current.name !== next.name || current.base !== next.base; current = next; return changed; }
        previous = current; current = next; return true;
      },
      saveCurrent() { if (!current) throw Error('Entre em uma hunt antes de salvar.'); bookmark = { ...current }; },
      snapshot() { return { current, previous, bookmark }; }
    };
  }
  function normalizeZones(raw) {
    if (!raw || !Array.isArray(raw.zonas)) throw Error('O formato da lista de hunts mudou.');
    return raw.zonas.map(z => ({ index: z.i, name: z.n, base: normalizeHunt(z.b || z.esp), level: Number(z.lv), region: normalizeHunt(z.r) }))
      .filter(z => Number.isInteger(z.index) && z.index >= 0 && z.base && z.name && Number.isFinite(z.level));
  }
  function chooseBestHunt(rows, zones, allowed, level, furiosa) {
    if (!Array.isArray(rows) || !(allowed instanceof Set)) throw Error('Resposta de recomendações inválida.');
    const ranked = rows.filter(r => Number.isFinite(r.xpH) && r.xpH >= 0 && Number(r.nivelMin || r.nivel || 0) <= level).slice().sort((a, b) => b.xpH - a.xpH);
    for (const row of ranked) {
      const candidates = zones.filter(z => z.level <= level && allowed.has(z.base) &&
        (Number.isInteger(row.index) ? row.index === z.index : normalizeHunt(row.nome) === normalizeHunt(z.name)) &&
        (!row.espChave || normalizeHunt(row.espChave) === z.base) && (!row.regiao || normalizeHunt(row.regiao) === z.region));
      if (candidates.length > 1) throw Error('A recomendação corresponde a mais de uma hunt. Abra Hunts no Hub para conferir.');
      if (candidates.length === 1) return { ...candidates[0], furiosa: furiosa === true, xpH: row.xpH, verdict: row.veredito || '', reason: row.motivo || '' };
    }
    throw Error('Nenhuma recomendação de XP corresponde a uma hunt liberada para esta conta.');
  }
  // END HUNT SHORTCUTS CORE

  const BASE = 'kjd-hunts-rapidas-v1';
  const defaults = () => ({ mode: 'species', furiosa: false, tm: false });
  let settings = defaults(), history = createHuntHistory(), owner = '', busy = false, zones = [], catalogAt = 0, recommendation = null;
  const state = () => { try { return typeof K === 'object' && K?.player ? K : null; } catch (_) { return null; } };
  const token = () => { try { return typeof q === 'string' ? q : ''; } catch (_) { return ''; } };
  const readSaved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const writeHistory = () => { if (owner) localStorage.setItem(BASE + ':history:' + owner, JSON.stringify(history.snapshot())); };
  const descriptor = s => {
    const index = Number.isInteger(s?.inst?.zona) ? s.inst.zona : s?.zone?.index;
    if (!Number.isInteger(index) || index < 0) return null;
    const zone = zones.find(z => z.index === index);
    return { index, furiosa: s?.inst?.furiosa === true, name: zone?.name || s.inst?.nome || s.zone?.name || 'Hunt #' + index, base: zone?.base || '' };
  };
  const fingerprint = s => JSON.stringify([s?.player?.id || s?.player?.name, s?.player?.level, s?.active?.id, s?.active?.name]);
  const fmt = value => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const panel = document.createElement('section'); panel.id = 'kjd-hunt-return'; panel.className = 'moon-panel'; moonPanelTheme();
  const style = document.createElement('style'); style.textContent = '#kjd-hunt-return{width:320px}#kjd-hunt-return select{max-width:150px;padding:5px;background:#0d1727;color:#f7e9c8;border:1px solid #485b77;border-radius:5px;font:inherit}#kjd-hunt-return .hunt-secondary{width:100%;margin-top:7px;padding:9px 8px;border:1px solid #485b77;border-radius:7px;background:#101c2a;color:#d2deed}#kjd-hunt-return .hunt-secondary:hover{background:#1c2d44}#kjd-hunt-return .hunt-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}';
  document.head.appendChild(style);
  panel.innerHTML = `<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">Voltar à Hunt<span class="moon-dot"></span></span><button type="button" data-minimize title="Minimizar">−</button><button type="button" data-close title="Fechar painel">×</button></div>
    <div class="moon-body"><div class="moon-state"><span data-status>Entre numa conta para usar</span><span>POKE MOON</span></div>
    <div class="moon-metrics"><div class="moon-metric"><small>Hunt atual</small><strong class="moon-value-text" data-current>—</strong></div><div class="moon-metric"><small>Hunt anterior</small><strong class="moon-value-text" data-previous>—</strong></div></div>
    <div class="moon-note" data-context>Histórico separado por conta, salvo neste dispositivo.</div>
    <button type="button" class="moon-go" data-back>↶ Voltar à hunt anterior</button>
    <div class="moon-section">REFERÊNCIA PARA SEUS TESTES</div><div class="moon-detail" data-bookmark>Nenhuma hunt salva.</div><div class="hunt-grid"><button type="button" class="hunt-secondary" data-save>Salvar hunt atual</button><button type="button" class="hunt-secondary" data-return>Voltar à salva</button></div>
    <div class="moon-foot">Anterior acompanha suas trocas de hunt. A hunt salva fica fixa até você salvar outra.<br>Configure na tela completa. Nenhuma viagem é automática.</div></div>`;
  document.body.appendChild(panel);
  function iconCanvas() { const spec=BICYCLE_PIXELS,canvas=document.createElement('canvas');canvas.width=spec.w;canvas.height=spec.h;const ctx=canvas.getContext('2d'),data=ctx.createImageData(spec.w,spec.h),pixels=atob(spec.rgba);for(let i=0;i<pixels.length;i++)data.data[i]=pixels.charCodeAt(i);ctx.putImageData(data,0,0);return canvas; }
  panel.querySelector('[data-icon]').replaceWith(iconCanvas());
  const button = addMoonDockButton('huntreturn', 'Voltar à Hunt — Bicicleta', iconCanvas(), panel);
  const dock = button.parentElement;
  // Older standalone scripts sort only their original three entries. Keep the new shortcut last.
  const keepLast = () => { const order = ['autocatch','autorefill','bestiario','hunts','huntreturn']; const sorted = [...dock.children].sort((a,b)=>order.indexOf(a.dataset.kjdButton)-order.indexOf(b.dataset.kjdButton)); if(sorted.some((b,i)=>dock.children[i]!==b)) sorted.forEach(b=>dock.appendChild(b)); };
  new MutationObserver(keepLast).observe(dock, { childList: true }); keepLast();
  moonDock().drag(panel, panel.querySelector('[data-handle]'), { storageKey: BASE + ':return-panel-position' });
  const $ = key => panel.querySelector('[data-' + key + ']');
  const label = value => value ? value.name + (value.furiosa ? ' · Furiosa' : '') : '—';
  function render() {
    const s = state(), snapshot = history.snapshot();
    $('current').textContent = label(snapshot.current); $('previous').textContent = label(snapshot.previous); $('bookmark').textContent = snapshot.bookmark ? label(snapshot.bookmark) : 'Nenhuma hunt salva.';
    $('context').textContent = 'Histórico separado por conta, salvo neste dispositivo.';
    for (const element of panel.querySelectorAll('.moon-body button,select,input')) element.disabled = busy || !s?.active;
    $('back').disabled = busy || !snapshot.previous; $('save').disabled = busy || !snapshot.current; $('return').disabled = busy || !snapshot.bookmark;
    panel.classList.toggle('moon-active', busy);
  }
  function observe() {
    const s = state(); if (!s?.player) { render(); return; }
    const id = String(s.player.id || s.player.name || 'conta');
    if (id !== owner) { owner = id; history = createHuntHistory(readSaved(BASE + ':history:' + owner, {})); settings = { ...defaults(), ...readSaved(BASE + ':settings:' + owner, {}) }; if (!['species','mine'].includes(settings.mode)) settings.mode = 'species'; recommendation = null; $('status').textContent = 'Pronto'; }
    if (history.observe(descriptor(s))) writeHistory(); render();
  }
  async function read(path) {
    if (!token()) throw Error('Sessão do jogo não encontrada.');
    const response = await fetch(path + (path.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token()), { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const result = await response.json(); if (!response.ok || !result || result.err) throw Error(result?.err || 'Consulta recusada pelo jogo.'); return result;
  }
  async function catalog(force = false) { if (!zones.length || force || Date.now() - catalogAt > 30000) { zones = normalizeZones(await read('/api/hunts')); catalogAt = Date.now(); observe(); } return zones; }
  async function allowedHunts() { if (typeof window.IPM_HUNTS?.liberadas !== 'function') throw Error('A interface de hunts do jogo ainda não está pronta.'); const result = await window.IPM_HUNTS.liberadas(); if (!(result instanceof Set)) throw Error('Não foi possível validar as hunts liberadas.'); return new Set([...result].map(normalizeHunt)); }
  async function travel(destination) {
    if (!destination) throw Error('Ainda não há uma hunt registrada para esse atalho.');
    await catalog(true); const s = state(), available = await allowedHunts();
    if (!s?.active || s.fainted || Number(s.active.hp) <= 0) throw Error('Use um pokémon ativo que não esteja desmaiado.');
    const zone = zones.find(z => z.index === destination.index);
    if (!zone || (destination.base && zone.base !== destination.base) || !available.has(zone.base) || zone.level > s.player.level) throw Error('Essa hunt não está liberada para a conta atual.');
    if (sameHunt(descriptor(s), destination)) { $('status').textContent = 'Você já está nessa hunt.'; return; }
    observe(); $('status').textContent = 'Viajando para ' + zone.name + '…';
    // Same travel action/payload as the Bestiary route. Never bypass server confirmation.
    const response = await fetch('/api/action', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ token: token(), action: 'selectZone', index: zone.index, furiosa: destination.furiosa === true, confirmo: false, naoPerguntar: false }) });
    const result = await response.json();
    if (!response.ok || !result || result.err || result.precisaConfirmar) throw Error(result?.err || (result?.precisaConfirmar ? 'Confirme a Hunt Furiosa pela interface original do jogo.' : 'O jogo recusou a viagem.'));
    if (result.state && typeof handleStateUpdate === 'function') handleStateUpdate(result.state);
    if (!sameHunt(descriptor(state()), destination)) throw Error('O jogo não confirmou a chegada à hunt.');
    observe(); $('status').textContent = 'Chegou em ' + zone.name;
  }
  async function run(action) { if (busy) return; busy = true; render(); try { await action(); } catch (e) { $('status').textContent = e.message || 'Não foi possível concluir.'; } finally { busy = false; observe(); } }
  $('back').onclick = () => run(() => travel(history.snapshot().previous)); $('return').onclick = () => run(() => travel(history.snapshot().bookmark));
  $('save').onclick = () => { try { observe(); history.saveCurrent(); writeHistory(); $('status').textContent = 'Hunt de referência salva'; render(); } catch (e) { $('status').textContent = e.message; } };
  $('close').onclick = () => { panel.hidden = true; moonDock().sync(); };
  $('minimize').onclick = () => { panel.classList.toggle('moon-collapsed'); $('minimize').textContent = panel.classList.contains('moon-collapsed') ? '+' : '−'; };
  if (typeof window.IPM_ON_STATE === 'function') window.IPM_ON_STATE(observe);
  setInterval(observe, 2000); observe();
})();
