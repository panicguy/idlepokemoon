// ==UserScript==
// @name         Poke Moon Rota Evolutiva by KimJongDudu
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.1.0
// @description  Treina os tipos da missão em hunts fáceis, evolui e viaja para melhor XP após confirmar a nova forma.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @idlemoon-hunts shortcut-v1
// ==/UserScript==

(() => {
  'use strict';
  if(window.__kjdRotaEvolutiva)return;
  window.__kjdRotaEvolutiva=true;
  // Mega Stone generated for this project; embedded locally, no external resources.
  const MEGA_PIXELS = {"w":32,"h":32,"rgba":"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"};
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

  // BEGIN EVOLUTION CORE
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const TYPES = {normal:'Normal',fire:'Fogo',water:'Água',electric:'Elétrico',grass:'Planta',ice:'Gelo',fighting:'Lutador',poison:'Venenoso',ground:'Terra',flying:'Voador',psychic:'Psíquico',bug:'Inseto',rock:'Pedra',ghost:'Fantasma',dragon:'Dragão',dark:'Sombrio',steel:'Aço',fairy:'Fada'};
  function questFor(poke, target) {
    const quests = (poke?.evoQuests || []).filter(q=>!q.incompleta);
    return quests.find(q=>norm(q.para)===norm(target)) || null;
  }
  function requirements(poke, quest, level) {
    if (!quest || !quest.roteiro?.feito || !Array.isArray(quest.roteiro.feito.abates)) throw Error('O jogo ainda não informou o roteiro de evolução. Abra Time → Evoluir e consulte novamente.');
    if (quest.incompleta) throw Error('Essa evolução ainda não foi liberada.');
    if (quest.precisaEscolha && !quest.escolhida) throw Error('Escolha esse caminho em Time → Evoluir antes de iniciar. Trocar o caminho pode zerar o treino.');
    if (poke.evoQuestAtiva && (!quest.liberada || !quest.aceita)) throw Error('Libere e aceite esse treino pela tela de evolução do jogo.');
    const done=quest.roteiro.feito;
    const kills=done.abates.map(r=>{
      const type=norm(r.tipo),have=Number(r.feito),goal=Number(r.alvo);
      if (!TYPES[type] || !Number.isFinite(have) || !Number.isFinite(goal) || goal<0 || have<0) throw Error('Formato dos abates mudou; consulte a missão no jogo.');
      return {type,have,goal,remaining:Math.max(0,goal-have)};
    });
    if (!Array.isArray(done.itens) || !Array.isArray(done.pedras)) throw Error('Itens/pedras do roteiro não foram informados.');
    const pending=[];
    for(const item of done.itens) if(!item.ok) pending.push((item.nome||item.item||'Item')+': '+(item.feito??'?')+'/'+(item.alvo??'?'));
    for(const stone of done.pedras) if(!stone.tem) pending.push(stone.item||'Pedra da evolução');
    const option=(poke.evoOptions||[]).find(o=>norm(o.toKey)===norm(quest.para));
    if (!option) pending.push('Opção de evolução ainda não disponível');
    const requiredLevel=Number(option?.level||quest.nivelEvolui||0);
    if(level<requiredLevel) pending.push('Nível '+requiredLevel+' do treinador');
    if(option && !option.ready && level>=requiredLevel) pending.push('Requisitos de evolução ainda não liberados pelo jogo');
    for(const stone of option?.stones||[]) if(Number(stone.have)<Number(stone.count)) pending.push((stone.name||'Pedras')+': '+stone.have+'/'+stone.count);
    if(poke.evoQuestAtiva && !quest.progresso?.prontaPraEntrega) pending.push('Etapas adicionais do treino: confira Time → Evoluir');
    return {kills,pending:[...new Set(pending)],option,ready:kills.every(k=>!k.remaining)&&!pending.length};
  }
  function parseZones(raw) {
    if(!Array.isArray(raw?.zonas)) throw Error('A lista de hunts mudou.');
    return raw.zonas.map(z=>({index:z.i,name:z.n,base:norm(z.b||z.esp),level:Number(z.lv),region:norm(z.r),types:[norm(z.t1),norm(z.t2)].filter(t=>TYPES[t])})).filter(z=>Number.isInteger(z.index)&&z.index>=0&&z.name&&z.base&&Number.isFinite(z.level));
  }
  function chooseTraining(zones, allowed, kills, level, cap, excluded=[]) {
    const needed=kills.filter(k=>k.remaining>0).map(k=>k.type);
    const candidates=zones.filter(z=>z.level<=Math.min(level,cap)&&allowed.has(z.base)&&!excluded.includes(z.index)&&z.types.some(t=>needed.includes(t)));
    candidates.sort((a,b)=>a.level-b.level || b.types.filter(t=>needed.includes(t)).length-a.types.filter(t=>needed.includes(t)).length || a.name.localeCompare(b.name));
    return candidates[0]||null;
  }
  function bestXP(rows,zones,allowed,level) {
    if(!Array.isArray(rows)) throw Error('Resposta do recomendador mudou.');
    for(const row of rows.filter(r=>Number.isFinite(r.xpH)).slice().sort((a,b)=>b.xpH-a.xpH)) {
      const found=zones.filter(z=>z.level<=level&&allowed.has(z.base)&&norm(row.nome)===norm(z.name)&&(!row.espChave||norm(row.espChave)===z.base)&&(!row.regiao||norm(row.regiao)===z.region));
      if(found.length>1) throw Error('Hunt de XP ambígua. Confira Hunts no Hub.');
      if(found.length===1)return {...found[0],xpH:row.xpH};
    }
    throw Error('Nenhuma recomendação de XP corresponde a uma área liberada.');
  }
  function evolved(poke,plan) { return !!poke && String(poke.id)===plan.pokeId && norm(poke.key||poke.base||poke.name)===plan.target; }
  // END EVOLUTION CORE
  const BASE='kjd-rota-evolutiva-v1';
  const state=()=>{try{return typeof K==='object'&&K?.player?K:null}catch(_){return null}};
  const token=()=>{try{return typeof q==='string'?q:''}catch(_){return ''}};
  const currentOwner=()=>String(state()?.player?.id||state()?.player?.name||'');
  const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch(_){return fallback}};
  let owner='',plan=null,settings={autoEvolve:true,afterXP:true,furiosa:false,cap:50},zones=[],catalogAt=0,busy=false,epoch=0,status='Pronto. Consulte o Pokémon ativo antes de iniciar.',lastRead=0,previewZone='';
  const panel=document.createElement('section');panel.id='kjd-rota-evolutiva';panel.className='moon-panel';moonPanelTheme();
  panel.innerHTML=`<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">Rota Evolutiva<span class="moon-dot"></span></span><button type="button" data-minimize title="Minimizar">−</button><button type="button" data-close title="Fechar painel">×</button></div><div class="moon-body"><div class="moon-state"><span data-state>Pausada</span><span>POKE MOON</span></div><div class="moon-metrics"><div class="moon-metric"><small>Pokémon ativo</small><strong class="moon-value-text" data-pokemon>—</strong></div><div class="moon-metric"><small>Destino da rota</small><strong class="moon-value-text" data-zone>—</strong></div></div><label class="moon-line"><span>Pokémon do time</span><select data-pick></select></label><label class="moon-line"><span>Evolução</span><select data-target></select></label><label class="moon-line"><span>Nível máximo das hunts de treino</span><input data-cap type="number" min="1" max="1000" value="50"></label><label class="moon-line"><span>Evoluir quando estiver pronto</span><input data-autoevolve type="checkbox" checked></label><label class="moon-line"><span>Melhor XP após evoluir</span><input data-afterxp type="checkbox" checked></label><label class="moon-line"><span>Hunt Furiosa no treino</span><input data-furiosa type="checkbox"></label><button type="button" class="moon-go" data-preview>Consultar missão / rota</button><div class="moon-detail" data-progress>Abra uma conta com o Pokémon que deseja evoluir caçando.</div><button type="button" class="moon-go" data-start>▶ Iniciar / retomar rota</button><button type="button" class="moon-stop" data-stop>Ⅱ Pausar rota</button><div class="moon-detail" data-status role="status"></div><div class="moon-foot">Treina em hunts de nível baixo. Furiosa usa inimigos mais fortes.<br>Evoluir pode consumir as pedras, itens e gold exigidos pelo jogo.<br>Use uma rota por vez. Tela completa; não executa no Card.</div></div>`;
  const css=document.createElement('style');css.textContent='#kjd-rota-evolutiva{width:330px}#kjd-rota-evolutiva select{max-width:165px;padding:5px;background:#0d1727;color:#f7e9c8;border:1px solid #485b77;border-radius:5px;font:inherit}';document.head.appendChild(css);document.body.appendChild(panel);
  function iconCanvas(){const spec=MEGA_PIXELS,c=document.createElement('canvas');c.width=spec.w;c.height=spec.h;const ctx=c.getContext('2d'),data=ctx.createImageData(spec.w,spec.h),bytes=atob(spec.rgba);for(let i=0;i<bytes.length;i++)data.data[i]=bytes.charCodeAt(i);ctx.putImageData(data,0,0);return c;}
  panel.querySelector('[data-icon]').replaceWith(iconCanvas());
  const button=addMoonDockButton('evolution','Rota Evolutiva — Mega Stone',iconCanvas(),panel);
  // Preserve the stable order used by the existing independent shortcuts.
  const dock=button.parentElement,sortDock=()=>{const ids=['evolution','autocatch','autorefill','bestiario','hunts','huntreturn'],sorted=[...dock.children].sort((a,b)=>ids.indexOf(a.dataset.kjdButton)-ids.indexOf(b.dataset.kjdButton));if(sorted.some((b,i)=>dock.children[i]!==b))sorted.forEach(b=>dock.appendChild(b));};new MutationObserver(sortDock).observe(dock,{childList:true});sortDock();
  moonDock().drag(panel,panel.querySelector('[data-handle]'),{storageKey:BASE+':position'});
  const $=key=>panel.querySelector('[data-'+key+']');
  function save(){if(owner){localStorage.setItem(BASE+':settings:'+owner,JSON.stringify(settings));localStorage.setItem(BASE+':plan:'+owner,JSON.stringify(plan));}}
  function bind(){const next=currentOwner();if(!next)return false;if(next!==owner){epoch++;owner=next;settings={autoEvolve:true,afterXP:true,furiosa:false,cap:50,...load(BASE+':settings:'+owner,{})};plan=load(BASE+':plan:'+owner,null);zones=[];catalogAt=0;status=plan?.running?'Retomando a rota registrada…':'Pronto. Consulte o Pokémon ativo.';}return true;}
  function roster(){const s=state(),map=new Map();for(const p of [s?.active,...(s?.team||[])])if(p?.id!=null)map.set(String(p.id),p);return [...map.values()];}
  function selectedPokemon(){return roster().find(p=>String(p.id)===$('pick').value)||state()?.active;}
  function fillPick(){const list=roster(),old=$('pick').value,signature=list.map(p=>String(p.id)+':'+p.name).join('|');if($('pick').dataset.signature!==signature){$('pick').replaceChildren(...list.map(p=>{const o=document.createElement('option');o.value=String(p.id);o.textContent=(p.shiny?'✨ ':'')+p.name+(String(p.id)===String(state()?.active?.id)?' (ativo)':'');return o}));$('pick').dataset.signature=signature;$('pick').value=plan?.running?plan.pokeId:list.some(p=>String(p.id)===old)?old:String(state()?.active?.id);}}
  function fillTargets(){const p=selectedPokemon();if(!p)return;const list=(p.evoQuests||[]).filter(q=>!q.incompleta);const old=$('target').value,signature=String(p.id)+':'+list.map(q=>q.para).join('|');if($('target').dataset.signature!==signature){$('target').replaceChildren(...list.map(q=>{const o=document.createElement('option');o.value=norm(q.para);o.textContent=q.nome||q.para;return o}));$('target').dataset.signature=signature;const chosen=list.find(q=>q.escolhida);$('target').value=plan?.running?plan.target:chosen?norm(chosen.para):list.some(q=>norm(q.para)===old)?old:norm(list[0]?.para);}}
  function render(){bind();fillPick();fillTargets();const p=selectedPokemon(),running=!!plan?.running;$('pokemon').textContent=p?.name||'—';$('zone').textContent=plan?.running?plan.zoneName||previewZone||'—':previewZone||plan?.zoneName||'—';$('status').textContent=status;$('state').textContent=running?'Ativa · '+(plan.phase==='xp'?'melhor XP':'evolução'):'Pausada';panel.classList.toggle('moon-active',running);$('autoevolve').checked=settings.autoEvolve;$('afterxp').checked=settings.afterXP;$('furiosa').checked=settings.furiosa===true;$('cap').value=settings.cap;for(const key of ['pick','target','cap','autoevolve','afterxp','furiosa'])$(key).disabled=running||busy;$('preview').disabled=busy||running||!p;$('start').disabled=busy||running||!p||!$('target').value;$('stop').disabled=!running;}
  function halt(message){epoch++;if(plan)plan.running=false;status=message;save();render();}
  function check(context){if(context!==epoch||!plan?.running)throw Error('Rota pausada.');if(currentOwner()!==owner)throw Error('A conta mudou. Inicie novamente.');const s=state();if(!s?.active||String(s.active.id)!==plan.pokeId)throw Error('O Pokémon ativo mudou. A rota foi pausada.');if(s.fainted||Number(s.active.hp)<=0)throw Error('Pokémon desmaiado. A rota foi pausada.');if(Number(s.active.hpMax)>0&&s.active.hp/s.active.hpMax<0.2)throw Error('Vida abaixo de 20%. Cure o Pokémon antes de retomar.');return s;}
  async function read(path){if(!token())throw Error('Sessão do jogo não encontrada.');const response=await fetch(path+(path.includes('?')?'&':'?')+'token='+encodeURIComponent(token()),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok||!data||data.err)throw Error(data?.err||'Consulta recusada pelo jogo.');return data;}
  async function refresh(){const data=await read('/api/state');if(data.state&&typeof handleStateUpdate==='function')handleStateUpdate(data.state);else if(data.player&&typeof handleStateUpdate==='function')handleStateUpdate(data);lastRead=Date.now();}
  async function catalog(){if(!zones.length||Date.now()-catalogAt>60000){zones=parseZones(await read('/api/hunts'));catalogAt=Date.now();}return zones;}
  async function allowed(){if(typeof window.IPM_HUNTS?.liberadas!=='function')throw Error('A interface de hunts ainda não está pronta.');const result=await window.IPM_HUNTS.liberadas();if(!(result instanceof Set))throw Error('Não foi possível validar as áreas liberadas.');return new Set([...result].map(norm));}
  async function action(name,params,context){check(context);const response=await fetch('/api/action',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({token:token(),action:name,...params})});const result=await response.json();if(!response.ok||!result||result.err||result.precisaConfirmar)throw Error(result?.err||'O jogo pediu confirmação ou recusou a ação.');if(result.state&&typeof handleStateUpdate==='function')handleStateUpdate(result.state);return result;}
  const zoneIndex=()=>Number.isInteger(state()?.inst?.zona)?state().inst.zona:state()?.zone?.index;
  async function travel(zone,context,furiosa=false){const available=await allowed(),s=check(context);if(!available.has(zone.base)||zone.level>s.player.level)throw Error('Essa área não está liberada.');if(zoneIndex()===zone.index&&(s.inst?.furiosa===true)===furiosa){plan.zoneName=zone.name+(furiosa?' · Furiosa':'');save();return;}await action('selectZone',{index:zone.index,furiosa,confirmo:furiosa,naoPerguntar:false},context);check(context);if(zoneIndex()!==zone.index||(state()?.inst?.furiosa===true)!==furiosa)throw Error('O jogo não confirmou a chegada no modo de hunt escolhido.');plan.zoneName=zone.name+(furiosa?' · Furiosa':'');plan.entered=Date.now();save();}
  function showRequirements(req,quest){$('progress').textContent=(quest.nome||quest.para)+'\n'+req.kills.map(k=>TYPES[k.type]+': '+k.have+'/'+k.goal).join('\n')+(req.pending.length?'\nFalta: '+req.pending.join(' · '):'\nItens, pedras e nível conferidos pelo roteiro.');}
  async function preview(){if(busy)return;busy=true;render();try{await refresh();bind();fillPick();fillTargets();const s=state(),selected=selectedPokemon(),quest=questFor(selected,$('target').value),req=requirements(selected,quest,s?.player?.level);showRequirements(req,quest);const available=await allowed(),zone=chooseTraining(await catalog(),available,req.kills,s.player.level,Number(settings.cap));status=zone?'Próxima hunt de treino: '+zone.name+' · nível '+zone.level:req.kills.some(k=>k.remaining)?'Nenhuma hunt liberada dos tipos exigidos dentro do limite. Aumente o limite se necessário.':req.ready?'Pronto para evoluir. Inicie a rota para continuar.':'Abates concluídos; aguardando as pendências acima.';previewZone=zone?.name||'—';}catch(e){status=e.message;}finally{busy=false;render();}}
  async function step(context){await refresh();const s=check(context),p=s.active;await catalog();check(context);
    if(evolved(p,plan)){
      plan.phase='xp';save();
      if(!settings.afterXP){halt('Evolução confirmada: '+p.name+'. Rota concluída.');return;}
      if(!window.__idleMoonHunts?.request)throw Error('Evolução confirmada. Atualize o Hub para consultar melhor XP.');
      status='Evolução confirmada. Consultando melhor XP para '+p.name+'…';render();
      const result=await window.__idleMoonHunts.request({nivel:s.player.level,poke:String(p.id),furiosa:false});check(context);
      if(!evolved(state()?.active,plan))throw Error('A forma do Pokémon mudou durante a consulta de XP.');
      if(!result?.ok)throw Error(result?.error||'Falha no recomendador do Hub.');
      const zone=bestXP(result.data?.hunts,zones,await allowed(),state().player.level);check(context);await travel(zone,context);halt('Evolução confirmada! '+p.name+' em '+zone.name+' · '+Math.round(zone.xpH).toLocaleString('pt-BR')+' XP base/h. Rota concluída.');return;
    }
    if(norm(p.key||p.base||p.name)!==plan.source)throw Error('A forma ativa mudou e não corresponde à evolução escolhida.');
    const quest=questFor(p,plan.target),req=requirements(p,quest,s.player.level);showRequirements(req,quest);
    const missing=req.kills.filter(k=>k.remaining);
    if(!missing.length){status=req.pending.length?'Abates concluídos. Aguardando: '+req.pending.join(' · '):settings.autoEvolve?'Requisitos prontos. Evoluindo…':'Abates concluídos. Aguardando Auto Evoluir do jogo ou evolução manual.';render();
      if(req.ready&&settings.autoEvolve){plan.phase='evolving';save();await action('evolve',{pokeId:p.id,to:req.option.toKey},context);check(context);if(!evolved(state()?.active,plan)){await refresh();check(context);if(!evolved(state()?.active,plan))throw Error('O jogo ainda não confirmou a evolução. Confira Time → Evoluir antes de retomar.');}return step(context);}return;
    }
    const available=await allowed();check(context);let zone=chooseTraining(zones,available,req.kills,s.player.level,settings.cap,plan.excluded||[]);
    if(!zone)throw Error('Não há hunt liberada dos tipos necessários dentro do limite. Ajuste o nível máximo ou confira as áreas no jogo.');
    const count=req.kills.reduce((a,k)=>a+k.have,0);if(plan.lastCount!==count){plan.lastCount=count;plan.progressAt=Date.now();save();}
    if(plan.trainingIndex===zone.index&&Date.now()-(plan.progressAt||Date.now())>120000){plan.excluded=[...(plan.excluded||[]),zone.index];if(plan.excluded.length>=3)throw Error('Sem progresso em três hunts. Confira o Pokémon e a missão antes de retomar.');zone=chooseTraining(zones,available,req.kills,s.player.level,settings.cap,plan.excluded);if(!zone)throw Error('Sem progresso e sem outra área fácil disponível.');}
    if(plan.trainingIndex!==zone.index){plan.trainingIndex=zone.index;plan.progressAt=Date.now();save();}
    await travel(zone,context,settings.furiosa===true);status='Treinando '+p.name+' em '+zone.name+' · nível '+zone.level+(settings.furiosa?' · Furiosa':'')+'. Próxima troca ao concluir os tipos.';
  }
  async function tick(){if(busy||!bind()||!plan?.running)return;busy=true;const context=epoch;render();try{await step(context);}catch(e){if(context===epoch)halt(e.message);}finally{busy=false;render();}}
  $('pick').onchange=()=>{previewZone='';fillTargets();status='Consulte a missão desse Pokémon. Para iniciar, coloque-o como ativo no jogo.';render();};
  $('preview').onclick=preview;
  $('start').onclick=async()=>{if(busy||!bind())return;const p=selectedPokemon(),target=$('target').value;if(!p||!target)return;try{if(String(p.id)!==String(state()?.active?.id))throw Error('Coloque '+p.name+' para caçar em Time → Caçar com este antes de iniciar.');requirements(p,questFor(p,target),state().player.level);if(!Number.isInteger(settings.cap)||settings.cap<1||settings.cap>1000)throw Error('Use um limite de hunt entre 1 e 1000.');const resume=plan?.pokeId===String(p.id)&&plan?.target===target;plan={...(resume?plan:{}),pokeId:String(p.id),source:resume?plan.source:norm(p.key||p.base||p.name),target,running:true,phase:'training',excluded:[],progressAt:Date.now()};epoch++;status='Rota iniciada…';save();render();await tick();}catch(e){halt(e.message);}};
  $('stop').onclick=()=>halt('Rota pausada. Combate e outras automações preservados.');
  for(const [key,field]of [['autoevolve','autoEvolve'],['afterxp','afterXP'],['furiosa','furiosa'],['cap','cap']])$(key).onchange=()=>{settings[field]=key==='cap'?Number($(key).value):$(key).checked;save();};
  $('close').onclick=()=>{panel.hidden=true;moonDock().sync();};$('minimize').onclick=()=>{panel.classList.toggle('moon-collapsed');$('minimize').textContent=panel.classList.contains('moon-collapsed')?'+':'−';};
  window.addEventListener('ipm:progresso',render);if(typeof window.IPM_ON_STATE==='function')window.IPM_ON_STATE(render);
  setInterval(()=>{render();if(Date.now()-lastRead>5000)tick();},2000);render();

})();
