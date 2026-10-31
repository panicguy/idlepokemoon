// ==UserScript==
// @name         Poke Moon Counters da Ranqueada by time Rebosteio
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      0.1.0
// @description  Analisa os times públicos dos top 20, sugere counters por tipos e monta uma rota de planejamento, sem ações de jogo.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==
(() => {
'use strict';if(window.__rebosteioCounterRankers)return;window.__rebosteioCounterRankers=true;
// User icon: https://wiki.pokexgames.com/images/7/79/Knife_Valencia_Quest.png
const KNIFE_PIXELS={"w":18,"h":24,"rgba":"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"};
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
  // BEGIN COUNTER CORE
  const TYPE_PT={normal:'Normal',fire:'Fogo',water:'Água',electric:'Elétrico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Veneno',ground:'Terra',flying:'Voador',psychic:'Psíquico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Dragão',dark:'Sombrio',steel:'Aço',fairy:'Fada'};
  const keyOf=p=>norm(p?.key||p?.base||p?.name||p?.nome).replace(/^shiny\s+/,'');
  function speciesMap(raw){if(!Array.isArray(raw?.especies))throw Error('Catálogo de espécies não reconhecido.');const map=new Map();for(const p of raw.especies){const types=[norm(p.t1),norm(p.t2)].filter(t=>TYPE_KEYS.includes(t));if(p.k&&types.length){const entry={key:norm(p.k),name:String(p.nome||p.k),types,tier:String(p.tier||'')};map.set(entry.key,entry);map.set(norm(entry.name),entry);}}return map;}
  function qualityOf(p){const value=p?.iv??p?.quality;const factor=value!=null&&Number.isFinite(Number(value))&&Number(value)>0&&Number(value)<=10?Number(value):null;return {factor,rarity:typeof p?.rarity==='string'?p.rarity:null,power:p?.power!=null&&Number.isFinite(Number(p.power))?Number(p.power):null};}
  function publicPokemon(p,catalog){if(!p||!(p.name||p.nome||p.key||p.base))return null;const key=keyOf(p),species=catalog.get(key),native=Array.isArray(p.types)?p.types.map(norm):[norm(p.type1||p.t1),norm(p.type2||p.t2)],types=native.filter(t=>TYPE_KEYS.includes(t));return {key,name:String(p.name||p.nome||species?.name||p.key||p.base),shiny:p.shiny===true,types:types.length?[...new Set(types)]:species?.types||[],...qualityOf(p)};}
  function profileTeam(raw,nick,catalog){const f=raw?.ficha;if(!f||norm(f.name)!==norm(nick)||!Array.isArray(f.team))throw Error('Ficha pública ausente, privada ou nome divergente.');return f.team.slice(0,6).map(p=>publicPokemon(p,catalog)).filter(Boolean);}
  function threatsFrom(profiles){const map=new Map();let unknown=0;for(const profile of profiles){for(const p of profile.team||[]){if(!p.types.length){unknown++;continue;}const id=p.key+'|'+p.types.join('/');const old=map.get(id)||{id,key:p.key,name:p.name,types:p.types,count:0,players:[]};old.count++;if(!old.players.includes(profile.nick))old.players.push(profile.nick);map.set(id,old);}}return {threats:[...map.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),unknown};}
  function matchup(candidate,enemy,chart){const attack=Math.max(...candidate.types.map(t=>multiplier(t,enemy.types,chart))),incoming=Math.max(...enemy.types.map(t=>multiplier(t,candidate.types,chart)));return {attack,incoming,solid:attack>=2&&incoming<=1,risky:attack>=2&&incoming<=2};}
  function inventoryFor(key,owned){return owned.filter(p=>keyOf(p)===key).map(p=>({id:p.id==null?null:String(p.id),name:String(p.name||p.base||key),shiny:p.shiny===true,...qualityOf(p)})).sort((a,b)=>(b.factor??-1)-(a.factor??-1)||(b.power??-1)-(a.power??-1));}
  function suggestCounters(threats,zones,allowed,level,owned,chart,minQuality=0){
    const candidates=new Map(),tierValue={C:1,B:2,A:3,S:4,SR:5,SSR:6,UR:7,L:8,M:9};
    for(const zone of zones){if(zone.level>level||!allowed.has(zone.base)||!zone.types.length)continue;const old=candidates.get(zone.base);if(!old||zone.level<old.zone.level)candidates.set(zone.base,{key:zone.base,name:zone.name.replace(/^Área de\s+/i,''),types:zone.types,tier:zone.tier||'',zone,owned:inventoryFor(zone.base,owned)});}
    const pool=[...candidates.values()],remaining=new Set(threats.map(t=>t.id)),picked=[];
    for(let slot=0;slot<6&&remaining.size;slot++){
      let best=null;for(const c of pool){if(picked.some(p=>p.key===c.key))continue;const coverage=threats.map(t=>({enemy:t,...matchup(c,t,chart)}));const fresh=coverage.filter(m=>remaining.has(m.enemy.id)&&(m.solid||m.risky));if(!fresh.length)continue;const solid=fresh.filter(m=>m.solid),score=solid.reduce((v,m)=>v+m.enemy.count,0)*100+fresh.reduce((v,m)=>v+m.enemy.count*Math.log2(m.attack)/Math.max(.5,m.incoming),0);const tier=tierValue[c.tier]||0;if(!best||score>best.score||score===best.score&&tier>best.tierScore||score===best.score&&tier===best.tierScore&&c.zone.level<best.zone.level)best={...c,coverage,score,tierScore:tier};}
      if(!best)break;const covered=best.coverage.filter(m=>remaining.has(m.enemy.id)&&(m.solid||m.risky));for(const m of covered)remaining.delete(m.enemy.id);const bestOwned=best.owned[0]||null,qualityOK=bestOwned&&(!minQuality||bestOwned.factor!=null&&bestOwned.factor>=minQuality);picked.push({...best,covers:covered.map(m=>({name:m.enemy.name,count:m.enemy.count,attack:m.attack,incoming:m.incoming,solid:m.solid})),bestOwned,needsHunt:!qualityOK});
    }
    return {counters:picked,uncovered:threats.filter(t=>remaining.has(t.id)),covered:threats.length-remaining.size};
  }
  // END COUNTER CORE
  const BASE='rebosteio-counter-rankers-v1',state=()=>{try{return typeof K==='object'&&K?.player?K:null}catch(_){return null}},token=()=>{try{return typeof q==='string'?q:''}catch(_){return ''}},account=()=>String(state()?.player?.id||state()?.player?.name||'');
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch(_){return fallback}};
  let owner='',report=null,busy=false,generation=0,status='Primeiro teste: análise e planejamento. Nenhuma viagem ou captura automática.',minQuality=0;
  const panel=document.createElement('section');panel.id='rebosteio-counter-rankers';panel.className='moon-panel';moonPanelTheme();panel.innerHTML=`<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">Counters da Ranqueada<span class="moon-dot"></span></span><button data-minimize title="Minimizar">−</button><button data-close title="Fechar painel">×</button></div><div class="moon-body"><div class="moon-state"><span data-mode>Planejamento</span><span>REBOSTEIO</span></div><div class="moon-note">Lê os 20 primeiros da ranqueada e seus times públicos atuais. O time do perfil pode ser diferente do usado no PvP.</div><label class="moon-line"><span>Qualidade desejada (×; 0 = sem filtro)</span><input data-quality type="number" min="0" max="10" step="0.01" value="0"></label><button data-analyze class="moon-go">🔎 Analisar top 20 e criar rota</button><button data-cancel class="moon-stop">Cancelar análise</button><div data-status class="moon-detail" role="status"></div><div data-summary class="moon-note"></div><details><summary>Times públicos consultados</summary><div data-profiles class="counter-scroll"></div></details><details><summary>Espécies mais frequentes</summary><div data-threats class="counter-scroll"></div></details><div class="moon-section">COUNTERS E ROTA SUGERIDA</div><div data-route class="counter-scroll counter-route"></div><div class="moon-foot">Sugestão por tipos e cobertura, não previsão de vitória.<br>Não avalia golpes, habilidades, velocidade, IVs ou dano real.<br>Nesta fase não caça, captura, altera seu time nem entra em PvP.</div></div>`;
  const css=document.createElement('style');css.textContent='#rebosteio-counter-rankers{width:380px}#rebosteio-counter-rankers .counter-scroll{max-height:190px;overflow:auto;margin-top:7px}#rebosteio-counter-rankers .counter-route{max-height:330px}#rebosteio-counter-rankers .counter-card{padding:8px;border:1px solid #31445c;background:#101a2b;border-radius:7px;margin:6px 0;font-size:11px;white-space:pre-wrap;line-height:1.5}#rebosteio-counter-rankers details{margin:8px 0;color:#aebdd1;font-size:11px}#rebosteio-counter-rankers summary{cursor:pointer}';document.head.appendChild(css);document.body.appendChild(panel);
  function icon(){const c=document.createElement('canvas'),s=KNIFE_PIXELS;c.width=s.w;c.height=s.h;const ctx=c.getContext('2d'),data=ctx.createImageData(s.w,s.h),bytes=atob(s.rgba);for(let i=0;i<bytes.length;i++)data.data[i]=bytes.charCodeAt(i);ctx.putImageData(data,0,0);return c;}panel.querySelector('[data-icon]').replaceWith(icon());const button=addMoonDockButton('counters','Counters da Ranqueada — Knife Valencia',icon(),panel),dock=button.parentElement;
  const sort=()=>{const ids=['counters','quests','shiny','evolution','autocatch','autorefill','bestiario','hunts','huntreturn'],list=[...dock.children].sort((a,b)=>ids.indexOf(a.dataset.kjdButton)-ids.indexOf(b.dataset.kjdButton));if(list.some((b,i)=>dock.children[i]!==b))list.forEach(b=>dock.appendChild(b));};new MutationObserver(sort).observe(dock,{childList:true});sort();moonDock().drag(panel,panel.querySelector('[data-handle]'),{storageKey:BASE+':position'});const $=key=>panel.querySelector('[data-'+key+']');
  function bind(){const next=account();if(!next)return false;if(next!==owner){generation++;busy=false;owner=next;report=load(BASE+':report:'+owner,null);minQuality=load(BASE+':quality:'+owner,0);$('quality').value=minQuality;status=report?'Análise anterior carregada. Atualize para refletir o ranking atual.':'Pronto para analisar o top 20.';draw();}return true;}
  function render(){bind();$('status').textContent=status;$('analyze').disabled=busy||!state()?.player;$('cancel').disabled=!busy;$('quality').disabled=busy;panel.classList.toggle('moon-active',busy);}
  const fmt=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
  function qualityLabel(p){const q=p.factor!=null?'×'+fmt(p.factor):'não informada';return (p.rarity?p.rarity+' · ':'')+q;}
  function card(parent,text){const c=document.createElement('div');c.className='counter-card';c.textContent=text;parent.appendChild(c);return c;}
  function draw(){for(const key of ['profiles','threats','route'])$(key).replaceChildren();if(!report){$('summary').textContent='';return;}const good=report.profiles.filter(p=>p.team.length),result=report.result;$('summary').textContent='Consulta: '+new Date(report.at).toLocaleString('pt-BR')+'\n'+good.length+'/'+report.top.length+' perfis com time público · '+report.threats.length+' espécies analisáveis · '+report.unknown+' Pokémon sem tipos reconhecidos.\nCobertura sugerida: '+result.covered+'/'+report.threats.length+' espécies. '+(result.uncovered.length?'Há espécies sem counter sugerido.':'')+(report.inventoryPartial?'\nInventário parcial: só exemplares presentes nos dados carregados.':'');
    for(const p of report.profiles)card($('profiles'),'#'+p.rank+' '+p.nick+'\n'+(p.error?p.error:p.team.map(t=>t.name+(t.shiny?' ✨':'')+' · qualidade '+qualityLabel(t)+(t.power!=null?' · poder '+fmt(t.power):' · poder não informado')+(!t.types.length?' · tipos não informados':'')).join('\n')||'Time não exposto'));
    for(const t of report.threats)card($('threats'),t.name+' · '+t.count+' ocorrências · '+t.types.map(t=>TYPE_PT[t]).join('/'));
    report.route=report.route||[];for(const [index,c]of result.counters.entries()){
      const row=card($('route'),'');const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=report.route.includes(c.key);box.onchange=()=>{report.route=box.checked?[...new Set([...report.route,c.key])]:report.route.filter(k=>k!==c.key);save();};label.appendChild(box);label.appendChild(document.createTextNode(' '+(index+1)+'. '+c.name+' · '+c.types.map(t=>TYPE_PT[t]).join('/')));row.appendChild(label);
      const text=document.createElement('div');text.textContent='Hunt: '+c.zone.name+' · nível '+c.zone.level+(c.tier?' · tier '+c.tier:'')+'\nCobre: '+c.covers.map(t=>t.name+' ×'+fmt(t.attack)+(t.solid?'':' (vulnerável a retorno)')).join(', ')+'\n'+(c.bestOwned?'Exemplar carregado: '+(c.bestOwned.shiny?'Shiny ':'')+c.bestOwned.name+' · qualidade '+qualityLabel(c.bestOwned)+(c.bestOwned.power!=null?' · poder '+fmt(c.bestOwned.power):''):'Nenhum exemplar nos dados de inventário carregados.')+'\n'+(c.needsHunt?'Incluído como alvo de captura/qualidade para revisar.':'Já possui exemplar dentro do filtro informado.');row.appendChild(text);
    }if(!result.counters.length)card($('route'),'Nenhuma sugestão segura com as hunts liberadas e os tipos reconhecidos.');
  }
  function save(){if(owner&&report)localStorage.setItem(BASE+':report:'+owner,JSON.stringify(report));}
  function check(id){if(id!==generation||account()!==owner)throw Error('Análise cancelada ou conta alterada.');}
  async function read(path){if(!/^\/api\/(rq\/top|ranking\/ficha|bestiario|hunts)(\?|$)/.test(path))throw Error('Consulta fora do escopo de leitura.');if(!token())throw Error('Sessão do jogo não encontrada.');const res=await fetch(path+(path.includes('?')?'&':'?')+'token='+encodeURIComponent(token()),{method:'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}),data=await res.json();if(!res.ok||data?.err)throw Error(data?.err||'Falha na consulta (HTTP '+res.status+').');return data;}
  async function analyze(){if(busy||!bind())return;const value=Number($('quality').value);if(!Number.isFinite(value)||value<0||value>10){status='Informe uma qualidade entre 0 e 10.';render();return;}busy=true;const id=++generation;minQuality=value;localStorage.setItem(BASE+':quality:'+owner,JSON.stringify(value));render();try{
      status='Consultando espécies, hunts e top da ranqueada…';render();const [catalogRaw,huntsRaw]=await Promise.all([read('/api/bestiario'),read('/api/hunts')]);check(id);const catalog=speciesMap(catalogRaw),zones=zonesFrom(huntsRaw),top=[],seen=new Set();
      for(let page=1;page<=20&&top.length<20;page++){const data=await read('/api/rq/top?pagina='+page);check(id);if(!Array.isArray(data.top))throw Error('Formato do Top Players mudou.');if(!data.top.length)break;const offset=Number.isInteger(data.ini)?data.ini:top.length;let added=0;for(const [i,p]of data.top.entries()){if(top.length>=20||offset+i+1>20)break;if(typeof p.nick!=='string'||!p.nick.trim()||seen.has(norm(p.nick)))continue;seen.add(norm(p.nick));top.push({nick:p.nick,rank:offset+i+1,pdl:Number.isFinite(Number(p.pdl))?Number(p.pdl):null});added++;}if(!added||Number.isFinite(data.paginas)&&page>=data.paginas)break;}
      if(!top.length)throw Error('Não há jogadores no Top Players desta temporada.');const profiles=[];
      for(const [i,p]of top.entries()){status='Lendo perfil público '+(i+1)+'/'+top.length+': '+p.nick;render();try{const data=await read('/api/ranking/ficha?nome='+encodeURIComponent(p.nick));check(id);profiles.push({...p,team:profileTeam(data,p.nick,catalog)});}catch(e){check(id);profiles.push({...p,team:[],error:e.message});}if(i<top.length-1)await new Promise(r=>setTimeout(r,300));check(id);}
      if(typeof window.IPM_HUNTS?.liberadas!=='function')throw Error('A interface de hunts ainda não está pronta.');const unlocked=await window.IPM_HUNTS.liberadas();check(id);if(!(unlocked instanceof Set))throw Error('Não foi possível validar as hunts liberadas.');const available=new Set([...unlocked].map(norm)),current=state();
      const owned=[...(current?.team||[]),...(Array.isArray(current?.box)?current.box:[]),...(catalogRaw.candidatos||[])],inventory=new Map();for(const p of [current?.active,...owned])if(p&&(p.key||p.base||p.name)){const key=p.id!=null?'id:'+p.id:'entry:'+keyOf(p)+':'+p.shiny+':'+p.iv;const old=inventory.get(key);if(!old||qualityOf(p).factor!=null)inventory.set(key,p);}
      const {threats,unknown}=threatsFrom(profiles);if(!threats.length)throw Error('Os perfis consultados não expuseram espécies/tipos suficientes para calcular counters.');const result=suggestCounters(threats,zones,available,current.player.level,[...inventory.values()],huntsRaw.typeChart||null,minQuality);
      report={at:Date.now(),top,profiles,threats,unknown,result,inventoryPartial:!Array.isArray(current.box),route:result.counters.filter(c=>c.needsHunt).map(c=>c.key)};save();draw();status='Rota de planejamento criada. Revise os alvos marcados. Nenhuma viagem, captura, troca de time ou luta foi executada.';
    }catch(e){if(id===generation)status=e.message;}finally{if(id===generation){busy=false;render();}}}
  $('analyze').onclick=analyze;$('cancel').onclick=()=>{generation++;busy=false;status='Análise cancelada. O relatório anterior foi preservado.';render();};$('close').onclick=()=>{panel.hidden=true;moonDock().sync();};$('minimize').onclick=()=>{panel.classList.toggle('moon-collapsed');$('minimize').textContent=panel.classList.contains('moon-collapsed')?'+':'−';};setInterval(render,3000);render();

})();
