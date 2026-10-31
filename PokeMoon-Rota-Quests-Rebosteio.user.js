// ==UserScript==
// @name         Poke Moon Rota de Quests by time Rebosteio
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.0.0
// @description  Executa diárias de abates por tipo, resgata as selecionadas e leva o último Pokémon à melhor hunt de XP.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @idlemoon-hunts shortcut-v1
// ==/UserScript==
(() => {
'use strict';if(window.__rebosteioQuestRoute)return;window.__rebosteioQuestRoute=true;
// Letter icon supplied by the user, embedded locally.
const QUEST_PIXELS={"w":22,"h":24,"rgba":"//37///9/P/7////+P3////8/////f//+v/+//n/+v8bHA7/JRgI/zALA/87Cwf/OQsN/zEPEP//+vv//P/9//j/+v/0/vP///36///8+///9fr///n////9+v///fz//f7///z////28/z///3///v///////f/JhQK/72bkf/Up6H/uYaC/51nZ/+FV1n/LA4Q/yYSEf8mFBD/JxoU///8+v//9/b///r9///6/f//+/X////6//r4+////v////7///j5/f/+//3/KBYS/4lNTf/0qqn/z5SO/+atpP/8uLf/+rK1//+/w//mnaT/uGx2/4FGTP8uEhH/IRYS/yIUE/8fERH////4///++f/8/P7//f7///z////8/P7///74/zQOC//njJP//77E//++vv//zMv//7m4//+5uv/UhIf/8Jui//+uuf//u8T/9MbG/+TIxf+MeHf/JRYT//r/+P/7//3/9/////f////1///////9/yQLBv+YW1j//7a8//+Fkv/0a3v//6Ow///P1P/uuLj/9b2+//q8vf//u7z//7m6//+/w//5wcT/Vjc1///38//8//r/+v/8//T8/v/0/v//+f/////49v87Dgv/+aOi/+xrcP/TPUj/40xb/8A8Sf/4mZ3//83K///Py///ycT//83I///Ixv//s7n/omBk/y8RD////Pb//f3z////+v///P////r////+//8uFRj/o1te//+Tlv/XT1H//4eH//+4tf/LR0L/1kxJ/+leV//ZT0L/4mZa//uclv//wL7//7q7/2kzM/8mFQ7////2////+P/89/T///v////5////+fv/LgwN//+0tf/ve3z/3FBP//9+ev//g3r/3FJI/+dKRf//YFr//FpP/+dXTP+9TUv//7e6/9mcm/+AXVf/HxgO//j/9f/7/P7//v/////+////+///KRMV/5lwbv//ycD//5mQ/9ZLRv//Yl///3Z2//VbXf//ZGj//5mc//+qqf/vY2T/rzM7//GYnv+IY1v/amRY/xUbD//4//j//P////f8///7//////z9/zYUFf/WoJ7//8vC///As//UTUf//2Ni//9XXf/6Rk//+UlT//9YX///dHj/xDg7/7dDTP/AdXr/d2BY/1thU/8WHRX/+v/6//7////8////+//9/x0SDv+qdnr/96+y//u2r///zcX//4SB/+9JS///P0n/9Rwn//YaJP/5Jiz/4CQi/8QwLP/dg4P/nG5u/4p7dP8WFw/////7//39+//5/f7//f37//758/83Ghb/4Zif/9V+hP/mnJn//8XB//+orP/LJy7/0Q8Y/9sNF//eERj/0xUX/945Nf//ioX/x4eF/5Z8e/9iWVT/HBsX//38+v/9/f3/+f/////9//82Fhf/pmhr//WWnP//pan/+62p///Ew//1a3j/uhwq/78kKv/xYWH//4SD//iLiP//raz/87Oz/7SSkf+mlpb/IBYV///+/f/8////+/////j/////+/3/OwcL/96MkP/jfID//6ep/9eHhv//wMH/+4OP//+Bjv//qav//725///Fvv//zMb//9PT/8Kkpv+qnJz/WlRU/xgSEv///v//9fv7//j////7////KBYW/61rbf//sbH//6yq//6lof/snJ3//8XJ///Jzv//y87//8vI//+5sf//urX//bm2/+C2uP+qlpj/m5qY/xsfHv////////////n////4//////z7/ysTE//SkpP/7Zyb/9iHg///sa3/+Kir//+1uf/8t7r/+7e2//+xrf/XhID/66Cd//a6uf/Fo6T/pZeX/1xeXf8TGRn/+/z+//7////8////+v///ycVFf+LbnD/9MbI//vAwv//vr///bO0//+usv//q7H/8Jed/9uEiv//qq///LC0//i6vf/pu73/sJaV/6abmf8aGRf/+/38///////6+vr//P79//7///8oEhT/UDg4/1o8PP9aMzT/iFpa/7F5ev/bl5j/76Ol//+zuf//tbr//rW8//W4vf/3ycz/v5+g/6+dm/9gWFb/HRwa///////////////////////6+vr///f3/yUXF/89LS3/WUVE/2VNSf92Wlb/gV5a/45lYf+GWFj/glRU/59zdP+/m5v/1ry9/6mXl/+ZkY//GhkX//z8/P/8/Pz//f39///////29vb////////7/////P3/IxsZ/xYRDv9eWVX/dW5o/3luaP98bWb/jHl1/5F+ev+Uf37/qZeX/5uNjf+knJr/Xl1b/xoaGv//////+vr6///////9/f3//Pz8////////+v////v9///+////////Gh8b/xEYEf9TWFL/en12/3p5df+KhoP/ko2K/4+Jif+fmZv/nJiZ/xsZGv/+/v7///////z8/P/////////////////4+Pj///3////7///9/f///P////X+/f/4////EBsX/xcgHf9ZXVz/jY+O/4uLi/+amJv/n52g/11bXv8YGBr////////////8/Pz///////j4+P/////////////7/P///v////////7////8////+v////n9/v/8////Ghoc/xMRFP9fWl7/mJOX/5qYm/8dGx7//Pz8//r8+////////f39//7+/v////////////39/f///v////3+//r6/P/+////+Pn9//z////+//////7///78/////f//HBUc/xkUGv8bFhr///////39/f/+/////v7+///////9/f3//v7+///////9/f3/"};
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

// BEGIN SHINY CORE

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const TYPE_KEYS=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
  const matchups={normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},ghost:{normal:0,psychic:2,ghost:2,dark:.5},dragon:{dragon:2,steel:.5,fairy:0},dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}};
  function zonesFrom(raw){if(!Array.isArray(raw?.zonas))throw Error('A lista de hunts mudou.');return raw.zonas.map(z=>({index:z.i,name:z.n,base:norm(z.b||z.esp),level:Number(z.lv),types:[norm(z.t1),norm(z.t2)].filter(t=>TYPE_KEYS.includes(t))})).filter(z=>Number.isInteger(z.index)&&z.index>=0&&z.name&&z.base&&Number.isFinite(z.level));}
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
  const BASE='rebosteio-rota-quests-v1';
  const state=()=>{try{return typeof K==='object'&&K?.player?K:null}catch(_){return null}};
  const token=()=>{try{return typeof q==='string'?q:''}catch(_){return ''}};
  const account=()=>String(state()?.player?.id||state()?.player?.name||'');
  const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch(_){return fallback}};
  const roster=()=>{const map=new Map();for(const p of [...(state()?.team||[]),state()?.active])if(p?.id!=null)map.set(String(p.id),p);return [...map.values()];};
  const isDown=p=>!!p&&(p.fainted===true||Number(p.hp)<=0);
  let owner='',quests=[],settings={selected:[],hunters:{},afterXP:true},plan=null,zones=[],chart=null,catalogAt=0,busy=false,epoch=0,nextTick=0,status='Carregue suas quests. Nenhuma ação iniciada.';
  const panel=document.createElement('section');panel.id='rebosteio-rota-quests';panel.className='moon-panel';moonPanelTheme();
  panel.innerHTML=`<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">Rota de Quests<span class="moon-dot"></span></span><button data-minimize title="Minimizar">−</button><button data-close title="Fechar painel">×</button></div><div class="moon-body"><div class="moon-state"><span data-mode>Pausada</span><span>REBOSTEIO</span></div><div class="moon-metrics"><div class="moon-metric"><small>Quest atual</small><strong class="moon-value-text" data-current>—</strong></div><div class="moon-metric"><small>Fila concluída</small><strong data-count>0 / 0</strong></div></div><button class="quest-secondary" data-load>Carregar / atualizar quests</button><div class="quest-actions"><button class="quest-secondary" data-select>Selecionar compatíveis</button><button class="quest-secondary" data-clear>Limpar seleção</button></div><div class="moon-section">QUESTS ATIVAS</div><div data-list class="quest-list"></div><label class="moon-line"><span>Melhor XP ao terminar a fila</span><input data-afterxp type="checkbox" checked></label><button data-start class="moon-go">▶ Iniciar / retomar</button><button data-stop class="moon-stop">Ⅱ Pausar rota</button><div data-status class="moon-detail" role="status"></div><div class="moon-foot">Automatiza diárias de abates por tipo, respeitando o nível mínimo.<br>Resgata somente as quests selecionadas e confirmadas como prontas.<br>Pause a Rota Shiny/Evolutiva antes de iniciar. Tela completa; sem Card.</div></div>`;
  const css=document.createElement('style');css.textContent='#rebosteio-rota-quests{width:350px}#rebosteio-rota-quests .quest-list{max-height:270px;overflow:auto}#rebosteio-rota-quests .quest-row{padding:8px;border:1px solid #31445c;border-radius:7px;margin-top:6px;background:#101a2b}#rebosteio-rota-quests .quest-head{display:flex;gap:7px;align-items:center}#rebosteio-rota-quests .quest-head strong{flex:1}#rebosteio-rota-quests .quest-progress{font-size:11px;color:#aebdd1;margin:6px 0}#rebosteio-rota-quests select{width:100%;padding:5px;background:#0d1727;color:#f7e9c8;border:1px solid #485b77;border-radius:5px;font:inherit}#rebosteio-rota-quests .quest-secondary{background:#101c2a;color:#d2deed;border:1px solid #485b77;border-radius:7px;padding:8px;font:inherit}#rebosteio-rota-quests .quest-actions{display:flex;gap:6px;margin-top:6px}';document.head.appendChild(css);document.body.appendChild(panel);
  function icon(){const s=QUEST_PIXELS,c=document.createElement('canvas');c.width=s.w;c.height=s.h;const ctx=c.getContext('2d'),data=ctx.createImageData(s.w,s.h),bytes=atob(s.rgba);for(let i=0;i<bytes.length;i++)data.data[i]=bytes.charCodeAt(i);ctx.putImageData(data,0,0);return c;}
  panel.querySelector('[data-icon]').replaceWith(icon());const button=addMoonDockButton('quests','Rota de Quests — Carta',icon(),panel),dock=button.parentElement;
  const sortDock=()=>{const ids=['quests','shiny','evolution','autocatch','autorefill','bestiario','hunts','huntreturn'],list=[...dock.children].sort((a,b)=>ids.indexOf(a.dataset.kjdButton)-ids.indexOf(b.dataset.kjdButton));if(list.some((b,i)=>dock.children[i]!==b))list.forEach(b=>dock.appendChild(b));};new MutationObserver(sortDock).observe(dock,{childList:true});sortDock();moonDock().drag(panel,panel.querySelector('[data-handle]'),{storageKey:BASE+':position'});
  const $=key=>panel.querySelector('[data-'+key+']');
  function save(){if(owner)localStorage.setItem(BASE+':'+owner,JSON.stringify({settings,plan}));}
  function bind(){const next=account();if(!next)return false;if(next!==owner){epoch++;owner=next;const data=load(BASE+':'+owner,{});settings={selected:[],hunters:{},afterXP:true,...data.settings};if(!Array.isArray(settings.selected))settings.selected=[];settings.hunters=settings.hunters&&typeof settings.hunters==='object'?settings.hunters:{};plan=data.plan||null;quests=[];zones=[];catalogAt=0;status=plan?.running?'Retomando quests selecionadas…':'Carregue as quests para escolher sua fila.';draw();}return true;}
  function otherRoute(){return load('kjd-rota-shiny-v1:'+owner,{})?.plan?.running||load('kjd-rota-evolutiva-v1:plan:'+owner,{})?.running;}
  function check(context){if(context!==epoch||!plan?.running||account()!==owner)throw Error('Rota pausada ou conta alterada.');if(plan.day!==day())throw Error('O dia mudou. Atualize e selecione as quests novas.');if(otherRoute())throw Error('Pause a Rota Shiny/Evolutiva para evitar viagens concorrentes.');return state();}
  function render(){bind();const running=!!plan?.running;$('mode').textContent=running?'Ativa · '+(plan.phase==='xp'?'melhor XP':plan.recovery?'recuperação':'quests'):'Pausada';$('current').textContent=quests.find(q=>q.id===plan?.ids?.[plan.cursor])?.name||plan?.questName||'—';$('count').textContent=(plan?.cursor||0)+' / '+(plan?.ids?.length||settings.selected.length);$('status').textContent=status;panel.classList.toggle('moon-active',running);for(const key of ['load','select','clear','afterxp'])$(key).disabled=running||busy;$('afterxp').checked=settings.afterXP;$('start').disabled=running||busy||!settings.selected.length||!state()?.active;$('stop').disabled=!running;}
  function draw(){$('list').replaceChildren();for(const q of quests.filter(q=>!q.claimed)){const row=document.createElement('div');row.className='quest-row';const head=document.createElement('label');head.className='quest-head';const box=document.createElement('input');box.type='checkbox';box.checked=settings.selected.includes(q.id);box.disabled=!q.supported||!!plan?.running;box.onchange=()=>{settings.selected=box.checked?[...new Set([...settings.selected,q.id])]:settings.selected.filter(id=>id!==q.id);save();render();};const name=document.createElement('strong');name.textContent=q.name;head.append(box,name);row.appendChild(head);const detail=document.createElement('div');detail.className='quest-progress';detail.textContent=q.supported?Math.min(q.have,q.goal)+' / '+q.goal+' · '+TYPE_NAMES[q.type]+' · hunt nv '+q.min+'+':q.reason;row.appendChild(detail);if(q.supported){const select=document.createElement('select');select.setAttribute('aria-label','Pokémon para '+q.name);const auto=document.createElement('option');auto.value='auto';auto.textContent='Automático por tipos';select.appendChild(auto);for(const p of roster()){const o=document.createElement('option');o.value=String(p.id);o.textContent=(p.shiny?'✨ ':'')+p.name;select.appendChild(o);}const fixed=settings.hunters[q.id]||'auto';if(fixed!=='auto'&&!roster().some(p=>String(p.id)===fixed)){const o=document.createElement('option');o.value=fixed;o.textContent='Pokémon fora do time';select.appendChild(o);}select.value=fixed;select.disabled=!!plan?.running;select.onchange=()=>{settings.hunters[q.id]=select.value;save();};row.appendChild(select);} $('list').appendChild(row);}if(!quests.some(q=>!q.claimed))$('list').textContent='Nenhuma quest ativa carregada.';}
  function halt(message){epoch++;if(plan)plan.running=false;status=message;save();draw();render();}
  async function read(path){if(!token())throw Error('Sessão do jogo não encontrada.');const res=await fetch(path+'?token='+encodeURIComponent(token()),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}),data=await res.json();if(!res.ok||data?.err||data?.erro){const e=Error(data?.err||'Falha na consulta do jogo.');e.transient=res.status===429||res.status>=500;throw e;}return data;}
  async function refresh(){const raw=await read('/api/state'),s=raw.state||raw;if(s.player&&typeof handleStateUpdate==='function')handleStateUpdate(s);}
  async function refreshQuests(){quests=parseQuests(await read('/api/quests'));draw();}
  async function catalog(){if(!zones.length||Date.now()-catalogAt>60000){const raw=await read('/api/hunts');zones=zonesFrom(raw);chart=raw.typeChart||null;catalogAt=Date.now();}}
  async function allowed(){if(typeof window.IPM_HUNTS?.liberadas!=='function')throw Error('A interface de hunts não está pronta.');const result=await window.IPM_HUNTS.liberadas();if(!(result instanceof Set))throw Error('Não foi possível validar as hunts liberadas.');return new Set([...result].map(norm));}
  async function action(name,params,context){check(context);const res=await fetch('/api/action',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({token:token(),action:name,...params})}),data=await res.json();if(!res.ok||data?.err||data?.precisaConfirmar){const e=Error(data?.err||'O jogo recusou a ação ou pediu confirmação.');e.transient=res.status===429||res.status>=500;throw e;}if(data.state&&typeof handleStateUpdate==='function')handleStateUpdate(data.state);return data;}
  const zoneIndex=()=>Number.isInteger(state()?.inst?.zona)?state().inst.zona:state()?.zone?.index;
  async function activate(p,context){if(String(state()?.active?.id)!==String(p.id))await action('setActive',{pokeId:p.id},context);check(context);if(String(state()?.active?.id)!==String(p.id))throw Error('A troca do Pokémon não foi confirmada.');}
  async function travel(zone,context){const available=await allowed();check(context);if(!available.has(zone.base)||zone.level>state().player.level)throw Error('Hunt não liberada para a conta.');if(zoneIndex()!==zone.index||state()?.inst?.furiosa)await action('selectZone',{index:zone.index,furiosa:false,confirmo:false,naoPerguntar:false},context);check(context);if(zoneIndex()!==zone.index||state()?.inst?.furiosa)throw Error('Chegada à hunt normal não confirmada.');}
  async function heal(context){const r=plan.recovery;await refresh();check(context);if(Date.now()-r.started>120000)throw Error('Recuperação demorou demais. Confira a Nurse.');if(r.stage==='city'){status='Indo ao Centro Pokémon…';await action('goCity',{},context);r.stage='heal';save();return;}const p=roster().find(p=>String(p.id)===plan.hunterId);if(!p)throw Error('O Pokémon da quest saiu do time.');if(isDown(p)){let name;try{name=(typeof gameState==='object'?gameState.npcs:[])?.find(n=>n.role==='heal')?.name}catch(_){}if(!name){status='Aguardando a Nurse carregar…';return;}await action('npcTalk',{name},context);await refresh();check(context);if(isDown(roster().find(p=>String(p.id)===plan.hunterId)))throw Error('Cura não confirmada.');}plan.recovery=null;plan.zoneIndex=null;save();status='Equipe curada. Retomando a quest.';}
  async function step(context){await refresh();check(context);await refreshQuests();check(context);await catalog();check(context);
    if(plan.recovery){await heal(context);return;}
    if(plan.phase==='xp'){
      const p=roster().find(p=>String(p.id)===plan.lastHunterId);if(!p)throw Error('O Pokémon da última quest saiu do time.');if(isDown(p)){plan.hunterId=String(p.id);plan.recovery={stage:'city',started:Date.now()};save();await heal(context);return;}await activate(p,context);
      if(!window.__idleMoonHunts?.request)throw Error('Atualize o Hub para consultar melhor XP.');status='Quests entregues. Consultando melhor XP para '+p.name+'…';render();const result=await window.__idleMoonHunts.request({nivel:state().player.level,poke:String(p.id),furiosa:false});check(context);if(String(state()?.active?.id)!==String(p.id))throw Error('O Pokémon mudou durante a consulta de XP.');if(!result?.ok)throw Error(result?.error||'Falha ao consultar XP.');const zone=xpZone(result.data?.hunts,zones,await allowed(),state().player.level);await travel(zone,context);plan.phase='done';halt('Fila concluída e recompensas resgatadas. '+p.name+' em '+zone.name+' · '+Math.round(zone.xpH).toLocaleString('pt-BR')+' XP base/h.');return;
    }
    if(plan.cursor>=plan.ids.length){if(settings.afterXP&&plan.lastHunterId){plan.phase='xp';save();return;}plan.phase='done';halt('Fila concluída. Recompensas confirmadas no jogo.');return;}
    const id=plan.ids[plan.cursor],quest=quests.find(q=>q.id===id);if(!quest)throw Error('Uma quest selecionada desapareceu. Atualize a lista antes de retomar.');plan.questName=quest.name;
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
  async function tick(){if(busy||!bind()||!plan?.running||Date.now()<nextTick)return;busy=true;const context=epoch;render();try{await step(context);if(context===epoch){plan.retries=0;nextTick=Date.now()+6000;save();}}catch(e){if(context===epoch){if(e.transient||e.name==='TimeoutError'||e.name==='AbortError'){plan.retries=(plan.retries||0)+1;if(plan.retries<=3){nextTick=Date.now()+15000;status='Conexão lenta. Tentativa '+plan.retries+'/3 em 15 segundos.';save();}else halt('Falhas de conexão repetidas. Retome quando o jogo estabilizar.');}else halt(e.message);}}finally{busy=false;render();}}
  $('load').onclick=async()=>{if(busy)return;busy=true;render();try{await refresh();await refreshQuests();await catalog();status='Selecione as diárias compatíveis. As demais ficam identificadas para execução manual.';}catch(e){status=e.message;}finally{busy=false;render();}};
  $('select').onclick=()=>{settings.selected=quests.filter(q=>q.supported).map(q=>q.id);save();draw();render();};$('clear').onclick=()=>{settings.selected=[];save();draw();render();};$('afterxp').onchange=()=>{settings.afterXP=$('afterxp').checked;save();};
  $('start').onclick=()=>{if(!bind()||busy||!settings.selected.length)return;if(otherRoute()){status='Pause a Rota Shiny/Evolutiva antes de iniciar esta rota.';render();return;}const resume=plan?.phase==='xp'&&plan.lastHunterId;plan=resume?{...plan,running:true,day:day(),retries:0}:{running:true,day:day(),phase:'quests',ids:[...settings.selected],cursor:0,retries:0};epoch++;nextTick=0;save();draw();tick();};$('stop').onclick=()=>halt('Rota pausada. Combate, captura e seleção preservados.');
  $('close').onclick=()=>{panel.hidden=true;moonDock().sync();};$('minimize').onclick=()=>{panel.classList.toggle('moon-collapsed');$('minimize').textContent=panel.classList.contains('moon-collapsed')?'+':'−';};setInterval(()=>{render();tick();},2000);render();

})();
