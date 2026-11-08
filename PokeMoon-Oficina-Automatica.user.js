// ==UserScript==
// @name         Poke Moon - Oficina Automática
// @namespace    local.pokemoon.profissoes
// @version      1.4.0
// @description  Bancada, pedidos, estufa, insumos e expedições com Mapa Antigo.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(()=>{'use strict';if(document.getElementById('ipm-auto-prof'))return;
function professionPlan(v, options = {}, catalog = null) {
  const p = v?.nucleo?.prof;
  if (!p || !['engenheiro','herborista','pesquisador'].includes(p.id)) return {wait:'Escolha sua profissão no jogo.'};
  const o = {bench:true,npc:true,public:true,garden:true,...options};
  const f = p.fila || {}, items = f.itens || [], free = Math.max(0,(f.livres?.vagas || 0)+(f.livres?.espera || 0));
  const recipes = p.receitas || [], ped = v.ped || {};
  const paid = x => ['gold','diamonds','dinheiro','diamante','preco','taxaCraft'].some(k=>Number(x?.[k])>0);
  const typeKeys=new Set(['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']);
  const choices = (r, requestedType=null) => {
    if (!r || r.trancada || r.estado !== 'pronto' || paid(r)) return [];
    const definition=catalog?.profissoes?.[p.id]?.receitas?.find(x=>x.id===r.id);
    const typed=r.tipo===true || definition?.tipo===true;
    if(requestedType && !typeKeys.has(requestedType))return [];
    const selected=requestedType || (typeKeys.has(o.craftType)?o.craftType:'normal');
    const variants=Array.isArray(r.tipos) && r.tipos.length?r.tipos:[{tipo:typed?selected:null,maxN:r.maxN,maxQtd:r.maxQtd,custo:r.custo}];
    return variants.filter(t=>(!typed || typeKeys.has(t.tipo)) && (!requestedType || !typed && !t.tipo || t.tipo===requestedType) && !paid(t) && (t.custo || r.custo || []).every(c=>!/(gold|diam|dinheiro|money|coin)/i.test(c.id) && Number(c.tem)>=Number(c.qtd)) && Number(t.maxN)>0)
      .map(t=>({r,t,cap:Math.max(0,Math.min(Number(t.maxN)||0,Number(t.maxQtd ?? r.maxQtd ?? free)||0,free))}));
  };
  const focusCost=Number(v.nucleo.foco?.porItem ?? 10), focusBalance=Math.max(0,Number(v.nucleo.foco?.v)||0);
  const focusSlots=Number.isFinite(focusCost) && focusCost>0?Math.floor(focusBalance/focusCost):0;
  const focusImproves=r=>r.fixa==null && Array.isArray(r.chances) && Array.isArray(r.chancesFoco) && r.chances.length===r.chancesFoco.length && r.chancesFoco.reduce((sum,chance,q)=>sum+Number(chance)*q,0)>r.chances.reduce((sum,chance,q)=>sum+Number(chance)*q,0);
  const focusFor = (r,q,n=1) => r.fixa == null && !(r.chances || []).slice(q).some(x=>x>0) && (r.chancesFoco || []).slice(q).some(x=>x>0) && focusSlots>=n;
  const quality = (r,q,n=1) => r.fixa != null ? r.fixa >= q : (r.chances || []).slice(q).some(x=>x>0) || focusFor(r,q,n);
  const parse = key => /^p2:([^@~]+)(?:@([a-z]+))?/.exec(key || '');
  const forOrder = x => { const k = parse(x.chave); return choices(recipes.find(r=>r.id===(x.rid || k?.[1])),k?.[2]).find(c=>!c.t.tipo || c.t.tipo===k?.[2]); };
  const craft = (c,n,label,q=0) => {
    let quantity=Math.min(c.cap,n);
    const required=focusFor(c.r,q,quantity), auto=o.focus===true && focusImproves(c.r) && focusSlots>0;
    if(auto && !required)quantity=Math.min(quantity,focusSlots);
    return {op:'fazer',args:{rid:c.r.id,n:quantity,tipo:c.t.tipo,foco:!!(required || auto)},label:label+(required || auto?' · com Foco':'')};
  };
  // Somente provisões da rota conhecida; nenhum outro apoio ou compra implícita.
  if(o.exped && p.id==='pesquisador' && v.exped?.pode) {
    const e=v.exped, chest=(e.baus || []).find(b=>b.id!=null);
    if(chest) return {op:'expAbrir',args:{id:chest.id},label:'Abrindo baú de expedição'};
    const route=(e.rotas || []).find(r=>r.id===(o.expedRoute || 'media') && r.aberta===true && !r.trancada);
    const price=Number(route?.provisoes);
    if(route && Number.isFinite(price) && price>=0 && Number(v.gold)>=price && (e.equipes || []).length<Number(e.vagas))
      return {op:'expMandar',args:{rota:route.id,usar:o.expedMap!==false && Number(e.apoio?.mapa)>0?['mapa']:[]},expeditionCost:price,label:'Enviando expedição: '+route.nome};
  }
  if (items.some(x=>x.pronto)) return {op:'coletar',args:{},label:'Coletando itens prontos'};
  if (o.npc) for (const x of ped.npc || []) if (!x.feito && x.tem>=x.n) return {op:'pedNpc',args:{i:x.i},label:'Entregando pedido de '+x.npc};
  if (o.public) for (const x of ped.aceitos || []) if (!x.meu && x.pronto>=x.n) return {op:'pedEntregar',args:{id:x.id},label:'Entregando pedido fabricado'};
  if (o.garden && p.id==='herborista' && v.estufa?.pode) {
    const e=v.estufa, cant=e.cant || [], now=Number(v.agora)||Date.now();
    // Coleta com Estufa Viva pode replantar cobrando adubo. Desligar só o interruptor não gasta pontos.
    if (e.talentos?.viva && e.talentos.vivaLigada) return {op:'estufaViva',args:{on:false},label:'Desligando replantio pago da Estufa Viva'};
    const ready=cant.find(c=>!c.vazio && (c.pronto===true || Number(c.fim)<=now));
    if (ready) return {op:'estufaColher',args:{i:ready.i ?? cant.indexOf(ready)},label:'Colhendo estufa'};
    const empty=cant.find(c=>c.vazio);
    const isFree=Number(e.adubo?.gratisHoje)>0 || e.adubo?.porGrau===0;
    const price=Number(e.adubo?.porGrau);
    if (empty && (isFree || Number.isFinite(price) && price>=0) && (!e.talentos?.viva || !e.talentos.vivaLigada)) {
      const candidates=[];
      for (const t of e.tipos || []) for(let g=1;g<=6;g++) {
        const quantity=Number((e.ess?.[t.tipo] || e.ess?.[t.item] || [])[g]) || 0;
        if ((isFree || price*g<=Number(v.gold)) && Number(e.nivel)>=Number((e.grauNivel || [0,1,10,25,45,65,85])[g]) && quantity>=Number(e.conf?.custo || 10)) candidates.push({t,g,quantity});
      }
      // Multiplica o estoque já disponível; preserva os graus altos escassos.
      candidates.sort((a,b)=>b.quantity-a.quantity || a.g-b.g);
      if(candidates.length) {const c=candidates[0];return {op:'estufaPlantar',args:{i:empty.i ?? cant.indexOf(empty),tipo:c.t.tipo,grau:c.g,modo:'plantar'},plantCost:isFree?0:price*c.g,label:isFree?'Plantando sem custo de adubo':'Plantando: $'+(price*c.g).toLocaleString('pt-BR')+' de adubo'};}
    }
  }
  if (free>0) {
    if(o.bench) {
      const list=recipes.flatMap(r=>choices(r)).filter(c=>c.cap>0 && Number(c.r.xp?.vFim ?? c.r.xp?.v)>0 && Number(c.r.tempo?.fim)>0);
      list.sort((a,b)=>Number(b.r.xp.vFim ?? b.r.xp.v)-Number(a.r.xp.vFim ?? a.r.xp.v) || a.r.tempo.fim-b.r.tempo.fim || b.r.nivel-a.r.nivel);
      if(list.length) return craft(list[0],list[0].cap,'Enchendo fila: '+list[0].r.nome);
    }


    if(o.public) for(const x of ped.aceitos || []) {
      const c=forOrder(x), remaining=x.n-(x.pronto || 0)-(x.naFila || 0);
      if(!x.meu && remaining>0 && c?.cap>=remaining && quality(c.r,x.qmin || 0,remaining)) return {op:'pedFabricar',args:{id:x.id,foco:!!(focusFor(c.r,x.qmin || 0,remaining) || o.focus===true && focusImproves(c.r) && focusSlots>=remaining)},label:'Fabricando pedido aceito'};
    }
    if(o.npc) for(const x of ped.npc || []) {
      if(x.feito || x.tem>=x.n) continue;
      const c=forOrder(x), queued=items.filter(i=>i.rid===(x.rid || c?.r.id) && (!i.chave || i.chave===x.chave)).reduce((s,i)=>s+(i.n || 0),0);
      const remaining=x.n-(x.tem || 0)-queued;
      if(c?.cap>0 && remaining>0 && quality(c.r,x.qmin || 0,Math.min(c.cap,remaining))) return craft(c,remaining,'Fabricando para pedido de '+x.npc,x.qmin || 0);
    }
    if(o.public && (ped.aceitos || []).length < Number(ped.regras?.maxReserva || 3)) for(const x of ped.quadro || []) {
      const c=forOrder(x), duration=Number(c?.r.tempo?.fim)*1000;
      const wait=Math.max(0,Number(f.fimTudo || v.agora)-Number(v.agora));
      if(!x.meu && !x.aceito && x.pode && !x.res && c?.cap>=x.n && quality(c.r,x.qmin || 0,x.n) && duration>0 && wait+duration*x.n < Number(x.resta)*0.8)
        return {op:'pedAceitar',args:{id:x.id},label:'Aceitando pedido com insumos e prazo'};
    }
  }
  const garden=v.estufa?.pode && o.garden && (v.estufa.cant || []).some(c=>c.vazio) && !(Number(v.estufa.adubo?.gratisHoje)>0) && v.estufa.adubo?.porGrau>0;
  return {wait:(free?'Aguardando insumos ou receita com XP.':'Fila cheia; aguardando conclusão.')+(garden?' Estufa: saldo ou insumos; aguardando plantio elegível.':'')};
}

'use strict';
function gatherRecipeCandidates(v,o={}) {
  const p=v?.nucleo?.prof,f=p?.fila;
  if(!p || !f || (Number(f.livres?.vagas)||0)+(Number(f.livres?.espera)||0)<=0)return [];
  const n=(Number(f.livres?.vagas)||0)+(Number(f.livres?.espera)||0);
  const npc=o.npc===false?[]:(v.ped?.npc || []).filter(x=>!x.feito && x.tem<x.n);
  const pending=o.public===false?[]:(v.ped?.aceitos || []).filter(x=>x.pronto+(x.naFila||0)<x.n);
  const needed=new Set([...npc,...pending].map(x=>x.rid || /^p2:([^@~]+)/.exec(x.chave||'')?.[1]));
  return (p.receitas||[]).filter(r=>!r.trancada && !['bloq','tal','rara'].includes(r.estado) && (needed.has(r.id) || o.bench!==false && Number(r.xp?.vFim ?? r.xp?.v)>0))
    .flatMap(r=>(r.tipos || [{tipo:null,custo:r.custo}]).map(t=>({rid:r.id,tipo:t.tipo,n,priority:needed.has(r.id)?1:0,name:t.nome||r.nome,
      score:Number(r.xp?.vFim ?? r.xp?.v)||0,
      costs:(t.custo || r.custo || []).map(c=>({id:c.id,grau:Number(c.grau)||1,qtd:Number(c.qtd)*n,tem:Number(c.tem)||0})),
      blocked:['gold','diamonds','dinheiro','diamante','preco','taxaCraft'].some(k=>Number(r[k])>0)})))
    .filter(r=>!r.blocked && r.costs.length && r.costs.every(c=>c.id && c.qtd>0 && !/(gold|diam|dinheiro|money|coin)/i.test(c.id)) && r.costs.some(c=>c.tem<c.qtd))
    .sort((a,b)=>b.score-a.score || b.priority-a.priority || a.name.localeCompare(b.name));
}
function gatherEligibleZones(origin,zones,allowed,level) {
  if(!origin || origin.categoria==='boss' || origin.semRota)return [];
  const routes=(origin.rotas||[]).filter(r=>!r.boss && !r.lutas && typeof r.tier==='string');
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  return zones.filter(z=>Number.isInteger(z.i) && !z.boss && !z.chefe && !z.luta && !z.bossId && Number(z.lv)<=level && allowed.has(String(z.b||z.esp||'').toLowerCase()) &&
    Array.isArray(z.loot) && z.loot.some(x=>norm(x)===norm(origin.item)) && routes.some(r=>r.tier===z.tier))
    .map(z=>({...z,shinyOnly:!routes.some(r=>r.tier===z.tier && !r.shiny)}))
    .sort((a,b)=>Number(a.shinyOnly)-Number(b.shinyOnly) || Number(a.lv)-Number(b.lv) || a.i-b.i);
}
function gatherHasAoE(s){const a=s?.active || (s?.team || []).find(x=>x.id===s.activeId);return typeof a?.tmArea==='string' && a.tmArea.length>0;}

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
  let gathering=null,originCache=new Map(),huntCatalog=null,originsCheckedAt=0;
  let shinyZone=null,shinyIds=new Set(),shinyHoldUntil=0,seenShinyFrame=null,hookedShinyRender=null;
  function observeGatherShiny(){
    const st=state(),zone=st?.inst?.id || st?.inst?.zona;
    if(zone!==shinyZone){shinyZone=zone;shinyIds.clear();shinyHoldUntil=0;seenShinyFrame=null;}
    const events=ev=>{for(const e of ev || []){if(e.tipo==='nasce' && e.lado!=='aliado' && e.shiny)shinyIds.add(e.id);if(['morte','some','foge'].includes(e.tipo) && shinyIds.delete(e.id))shinyHoldUntil=Date.now()+5000;}};
    const frame=st?.caca;if(frame && frame!==seenShinyFrame){seenShinyFrame=frame;const photo=frame.foto || frame.f;if(photo?.ents){shinyIds.clear();for(const e of photo.ents)if(e.shiny && e.lado!=='aliado' && !e.morto && Number(e.hp)>0)shinyIds.add(e.id);}events(frame.ev);}
    const renderer=window.CacaTela?.render;if(renderer && renderer!==hookedShinyRender){hookedShinyRender=renderer;const original=renderer.receber;renderer.receber=function(ev){events(ev);return original.apply(this,arguments);};}
    return shinyIds.size>0 || Date.now()<shinyHoldUntil || (st?.captures || []).some(c=>c.shiny);
  }
  async function nextGatherRecipe(v,ticket){
    const s=state(),allowed=await window.IPM_HUNTS.liberadas();
    for(const recipe of gatherRecipeCandidates(v,options())){const costs=[];let possible=true;
      for(const c of recipe.costs){if(c.tem>=c.qtd){costs.push(c);continue;}const origin=await materialOrigin(c,true),zones=gatherEligibleZones(origin,huntCatalog,allowed,s.player.level);if(!zones.length){possible=false;break;}costs.push({...c,tem:Number(origin.tem)||0});}
      if(ticket!==generation || !enabled || !options().gather)return null;if(possible && costs.some(c=>c.tem<c.qtd))return {...recipe,costs};
    }return null;
  }
  const gatherKey=()=> 'ipm-auto-prof-gather-v1:'+owner;
  function saveGather(){if(owner)localStorage.setItem(gatherKey(),JSON.stringify(gathering));}
  function gatherLease(){window.__ipmProfessionGatherLease=gathering?{owner,since:gathering.started}:null;}
  function restoreGather(){try{gathering=JSON.parse(localStorage.getItem(gatherKey())||'null');}catch(_){gathering=null;}
    if(gathering && (!gathering.origin || !Number.isInteger(gathering.origin.index) || !Array.isArray(gathering.costs)))gathering=null;
    if(gathering && !enabled){gathering.returning=true;saveGather();}gatherLease();}
  async function gatherRead(route){const tk=typeof q==='string'?q:localStorage.getItem('pmi_token');if(!tk)throw Error('Sessão do jogo indisponível.');
    const response=await fetch(route+(route.includes('?')?'&':'?')+'token='+encodeURIComponent(tk),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
    const data=await response.json();if(!response.ok || data?.err)throw Error(data?.err || 'HTTP '+response.status);return data;}
  async function materialOrigin(c,fresh=false){const key=c.id+'@'+c.grau;let cached=originCache.get(key);if(fresh || !cached){cached=await gatherRead('/api/profissoes/origem?item='+encodeURIComponent(c.id)+'&grau='+c.grau);originCache.set(key,cached);}return cached;}
  const zoneNow=()=>Number.isInteger(state()?.inst?.zona)?state().inst.zona:state()?.zone?.index;
  const atGatherZone=z=>zoneNow()===z.index && (state()?.inst?.furiosa===true)===z.furiosa;
  async function gatherTravel(z,ticket){
    const known=huntCatalog?.find(x=>x.i===z.index);
    if(!known || known.boss || known.chefe || known.luta || known.bossId || !Number.isInteger(z.index) || ticket!==generation)throw Error('Viagem cancelada.');
    if(atGatherZone(z))return;
    if(observeGatherShiny())throw Error('Shiny na hunt: aguardando finalizar a captura antes de viajar.');
    const tk=typeof q==='string'?q:localStorage.getItem('pmi_token');
    const response=await fetch('/api/action',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),
      body:JSON.stringify({token:tk,action:'selectZone',index:z.index,furiosa:z.furiosa===true,confirmo:false,naoPerguntar:false})});
    const data=await response.json();if(!response.ok || data.err || data.precisaConfirmar || data.precisaPagar)throw Error(data.err || 'Hunt não confirmou a viagem.');
    if(data.state && typeof handleStateUpdate==='function')handleStateUpdate(data.state);
    if(ticket!==generation)return;
    if(!atGatherZone(z))throw Error('Chegada ainda não confirmada; verificará novamente.');
  }
  async function gatherTick(v,ticket){
    const opt=options(),s=state();
    if(observeGatherShiny()){if(gathering)gatherLease();render('Shiny na hunt: aguardando finalizar a captura antes de viajar.');return true;}
    if(!gathering){
      if(!enabled || !opt.gather || Date.now()-originsCheckedAt<60000)return false;
      if(!s?.active || Number(s.active.hp)<=0 || s.fainted || s.boss?.active || !s.auto?.hunt || !Number.isInteger(zoneNow()))return false;
      const candidates=gatherRecipeCandidates(v,opt);if(!candidates.length)return false;
      originsCheckedAt=Date.now();
      if(!window.IPM_HUNTS?.liberadas){render('Busca: interface de hunts indisponível.');return true;}
      huntCatalog=huntCatalog || (await gatherRead('/api/hunts')).zonas;
      if(!Array.isArray(huntCatalog))throw Error('Catálogo de hunts inválido.');
      if(!huntCatalog.some(z=>z.i===zoneNow() && !z.boss && !z.chefe && !z.luta && !z.bossId))return false;
      const allowed=await window.IPM_HUNTS.liberadas();if(!(allowed instanceof Set))throw Error('Hunts liberadas indisponíveis.');
      for(const recipe of candidates.slice(0,12)){
        const costs=[];let possible=true;
        for(const c of recipe.costs){if(c.tem>=c.qtd){costs.push(c);continue;}
          const origin=await materialOrigin(c),zones=gatherEligibleZones(origin,huntCatalog,allowed,s.player.level);
          if(!zones.length){possible=false;break;}costs.push({...c,zones:zones.map(z=>({index:z.i,name:z.n,shinyOnly:z.shinyOnly}))});
        }
        if(ticket!==generation || !enabled || !options().gather)return true;
        if(!possible)continue;
        gathering={origin:{index:zoneNow(),furiosa:s.inst?.furiosa===true,name:s.inst?.nome||s.zone?.name||'hunt original'},rid:recipe.rid,recipe:recipe.name,tipo:recipe.tipo,n:recipe.n,costs,started:Date.now(),settleUntil:Date.now()+17000,phase:'preparing',destination:null};
        saveGather();gatherLease();render('Busca de insumos: pausando temporariamente as outras rotas…');return true;
      }
      render('Busca: nenhum craft com todos os insumos faltantes disponíveis em hunts liberadas. Bosses ignorados.');return true;
    }
    gatherLease();
    if(!huntCatalog)huntCatalog=(await gatherRead('/api/hunts')).zonas;
    if(ticket!==generation)return true;
    if(!enabled || !opt.gather)gathering.returning=true;
    if(gathering.returning){
      const origin=gathering.origin;render('Voltando para '+origin.name+'…');await gatherTravel(origin,ticket);
      if(ticket===generation && atGatherZone(origin)){gathering=null;saveGather();gatherLease();render(enabled?'Voltou à hunt original. Retomando produção.':'Desligada. Retorno à hunt original concluído.');originsCheckedAt=Date.now();}
      return true;
    }
    if(Date.now()<gathering.settleUntil){render('Busca: aguardando as outras rotas terminarem a ação em andamento…');return true;}
    if(!s?.active || Number(s.active.hp)<=0 || s.fainted || !s.auto?.hunt){render('Busca aguardando Pokémon ativo e caça ligada.');return true;}
    if(s.boss?.active){render('Busca aguardando fim do boss já iniciado; nenhuma chave será usada.');return true;}
    // Mudança manual de hunt respeita a escolha do jogador; a reserva é liberada.
    if(gathering.phase==='hunting' && gathering.destination && !atGatherZone(gathering.destination)){
      if(zoneNow()!==gathering.destination.index){gathering=null;saveGather();gatherLease();render('Busca cancelada: hunt alterada fora da Oficina.');return true;}
    }
    let target=null,all=true;
    for(const c of gathering.costs){const origin=await materialOrigin(c,true);if(ticket!==generation)return true;
      c.tem=Number(origin.tem)||0;
      if(c.tem<c.qtd){all=false;
        const allowed=await window.IPM_HUNTS.liberadas();const zones=gatherEligibleZones(origin,huntCatalog || (huntCatalog=(await gatherRead('/api/hunts')).zonas),allowed,s.player.level);
        if(!zones.length){gathering.returning=true;saveGather();render('Fonte deixou de ser elegível; retornando sem entrar em boss.');return true;}
        target={...c,zone:zones[0]};break;
      }
    }
    if(all){
      const plan=professionPlan(v,{...opt,craftType:state()?.active?.tmArea},window.P2.dados);
      if(plan.op){gathering.costs=[];saveGather();render('Insumos reunidos; preenchendo a bancada antes de voltar…');return false;}
      const next=await nextGatherRecipe(v,ticket);if(ticket!==generation)return true;
      if(next){Object.assign(gathering,{rid:next.rid,recipe:next.name,tipo:next.tipo,n:next.n,costs:next.costs});saveGather();render('Continuando a fila de insumos: '+next.name+'…');return true;}
      gathering.returning=true;saveGather();render('Fila de recursos concluída. Voltando à hunt original…');return true;
    }
    const destination={index:target.zone.i,name:target.zone.n,furiosa:gatherHasAoE(s)};
    gathering.destination=destination;gathering.phase='travelling';saveGather();
    render('Buscando '+target.id+' · grau '+target.grau+': '+target.tem+'/'+target.qtd+'\n'+destination.name+' · '+(destination.furiosa?'Furiosa (TM AoE)':'Padrão')+(target.zone.shinyOnly?' · depende de shiny':''));
    await gatherTravel(destination,ticket);if(ticket!==generation)return true;
    gathering.phase='hunting';saveGather();return true;
  }
  const panel=document.createElement('section');panel.id='ipm-auto-prof';panel.className='moon-panel';moonPanelTheme();
  panel.innerHTML=`<div class="moon-head" data-handle><span data-icon></span><span class="moon-title">Oficina Automática<span class="moon-dot"></span></span><button data-close title="Fechar painel">×</button></div><div class="moon-body"><div class="moon-state"><span data-mode>Desligada</span><span data-prof>Detectando profissão…</span></div><p class="moon-note">Bancada prioriza o maior XP por craft. Busca completa a fila antes de voltar.</p><label class="moon-line">Bancada e coleta<input type="checkbox" data-opt="bench" checked></label><label class="moon-line" title="Melhora a qualidade usando o Foco disponível; continua sem Foco quando acabar.">Usar Foco automaticamente<input type="checkbox" data-opt="focus" checked></label><label class="moon-line">Pedidos de NPC<input type="checkbox" data-opt="npc" checked></label><label class="moon-line">Pedidos de jogadores<input type="checkbox" data-opt="public" checked></label><label class="moon-line">Estufa · plantio sem teto<input type="checkbox" data-opt="garden" checked></label><label class="moon-line">Expedições automáticas<input type="checkbox" data-opt="exped" checked></label><label class="moon-line" data-route-row>Rota da expedição<select data-route><option value="media">Caverna de Cristal</option></select></label><label class="moon-line">Usar Mapa Antigo<input type="checkbox" data-opt="expedMap" checked></label><label class="moon-line">Buscar insumos nas hunts<input type="checkbox" data-opt="gather"></label><button class="moon-go" data-toggle>Ligar automação</button><div class="moon-detail" role="status" data-status>Começa desligada. Sua escolha fica salva por personagem.</div><div class="moon-foot">Sem compras de itens, diamantes ou pontos de talento.<br>Dinheiro para adubo e provisões de expedição; sem teto acumulado.<br><span data-focus>Foco: aguardando dados</span><br><span data-budget>Adubo gasto: $0</span></div></div>`;
  function hammerIcon(){const c=document.createElement('canvas');c.width=c.height=32;c.style.imageRendering='pixelated';const g=c.getContext('2d'),im=new Image();im.onload=()=>{if(g){g.imageSmoothingEnabled=false;g.drawImage(im,0,0,32,32);}};im.src='data:image/png;base64,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';return c;}
  panel.querySelector('[data-icon]').replaceWith(hammerIcon());document.body.appendChild(panel);
  addMoonDockButton('profissoes','Oficina Automática — Martelo',hammerIcon(),panel);
  moonDock().drag(panel,panel.querySelector('[data-handle]'),{storageKey:'ipm-auto-prof-position-v1'});
  panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;moonDock().sync();};
  const status=panel.querySelector('[data-status]'),toggle=panel.querySelector('[data-toggle]');
  let owner='',enabled=false,busy=false,generation=0,lastRead=0,lastView=null,suspended=false,plantSpent=0;
  const inputs=[...panel.querySelectorAll('[data-opt]')];
  const routeSelect=panel.querySelector('[data-route]');
  const options=()=>({...Object.fromEntries(inputs.map(i=>[i.dataset.opt,i.checked])),expedRoute:routeSelect.value || 'media'});
  function professionOptions(v){
    const id=v?.nucleo?.prof?.id;
    for(const i of inputs){const relevant=i.dataset.opt==='garden'?id==='herborista':['exped','expedMap'].includes(i.dataset.opt)?id==='pesquisador':true;i.disabled=!relevant;i.closest('label').hidden=!relevant;}
    panel.querySelector('[data-route-row]').hidden=id!=='pesquisador';
    const chosen=routeSelect.value || 'media',routes=v?.exped?.rotas || [];
    if(id==='pesquisador' && routes.length){routeSelect.replaceChildren(...routes.map(r=>{const o=document.createElement('option');o.value=r.id;o.disabled=r.aberta!==true || !!r.trancada;o.textContent=r.nome+(o.disabled?' · Nv '+r.nivel:'')+' · $'+Number(r.provisoes || 0).toLocaleString('pt-BR');return o;}));routeSelect.value=chosen;if(!routeSelect.value){const o=document.createElement('option');o.value=chosen;o.textContent='Rota indisponível';o.disabled=true;routeSelect.appendChild(o);routeSelect.value=chosen;}}
  }
  const routeCss=document.createElement('style');routeCss.textContent='#ipm-auto-prof label[hidden]{display:none!important}#ipm-auto-prof select{max-width:180px;background:#101c2a;color:#f7e9c8;border:1px solid #485b77;border-radius:5px;padding:4px}';document.head.appendChild(routeCss);
  routeSelect.onchange=()=>{save();generation++;lastRead=0;void tick();};
  const state=()=>typeof K==='object' && K?.player ? K : null;
  const storageKey=()=> 'ipm-auto-prof-v1:'+owner;
  function render(message){panel.classList.toggle('moon-active',enabled);panel.querySelector('[data-mode]').textContent=enabled?'Ligada'+(suspended?' · aguardando':''):'Desligada';toggle.textContent=enabled?'Desligar automação':'Ligar automação';toggle.classList.toggle('active',enabled);panel.querySelector('[data-budget]').textContent='Adubo gasto: $'+plantSpent.toLocaleString('pt-BR');if(message)status.textContent=message;}
  function save(){if(!owner)return;localStorage.setItem(storageKey(),JSON.stringify({enabled,options:options(),plantSpent}));}
  function bind(){const p=state()?.player;const id=p && String(p.id || p.name || p.nome || '');if(!id || id===owner)return;
    owner=id;generation++;lastRead=0;lastView=null;suspended=false;let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey())||'{}')||{};}catch(_){}
    routeSelect.replaceChildren(Object.assign(document.createElement('option'),{value:saved.options?.expedRoute || 'media',textContent:'Carregando rotas…'}));plantSpent=Math.max(0,Number(saved.plantSpent)||0);enabled=saved.enabled===true;for(const i of inputs)i.checked=i.dataset.opt==='gather'?saved.options?.gather===true:saved.options?.[i.dataset.opt]!==false;render(enabled?'Retomando automação salva…':'Desligada. Nenhum recurso será usado.');restoreGather();}
  toggle.onclick=()=>{bind();if(!owner){render('Aguarde o personagem carregar.');return;}enabled=!enabled;generation++;suspended=false;save();render(enabled?'Ligada: verificando profissão e insumos…':'Desligada manualmente. Itens já na bancada continuam no jogo.');if(gathering && !enabled){gathering.returning=true;saveGather();}if(enabled || gathering){lastRead=0;void tick();}};
  inputs.forEach(i=>i.onchange=()=>{save();generation++;suspended=false;lastRead=0;void tick();});
  const allowedOps=new Set(['fazer','coletar','pedNpc','pedAceitar','pedFabricar','pedEntregar','estufaColher','estufaPlantar','estufaViva','expMandar','expAbrir']);
  async function tick(){
    bind();observeGatherShiny();if(busy || !owner || !window.P2?.ligado?.())return;
    if(Date.now()-lastRead < (enabled || gathering?15000:60000))return;
    busy=true;const ticket=generation,account=owner;
    try{
      const v=await window.P2.carregar();lastRead=Date.now();
      if(ticket!==generation || account!==owner || !v?.ok)return;
      lastView=v;const focus=v.nucleo?.foco;panel.querySelector('[data-focus]').textContent=focus?'Foco: '+focus.v+'/'+focus.max+' · '+focus.porItem+' por item':'Foco indisponível';professionOptions(v);const p=v.nucleo?.prof;panel.querySelector('[data-prof]').textContent=p?p.nome+' · Nv '+p.nivel:'Sem profissão';
      if((!enabled && !gathering) || suspended)return;
      const plan=professionPlan(v,{...options(),craftType:state()?.active?.tmArea},window.P2.dados);
      if(!['expMandar','expAbrir'].includes(plan.op) && (gathering || !plan.op && options().gather) && await gatherTick(v,ticket))return;
      if(!enabled)return;
      if(!plan.op){render(plan.wait);return;}
      if(!allowedOps.has(plan.op) || (plan.args?.foco===true && !['fazer','pedFabricar'].includes(plan.op)) || plan.args?.pagar || plan.args?.confirmo)throw Error('Ação não permitida.');
      if(plan.op==='estufaViva' && plan.args.on!==false)throw Error('Replantio pago não permitido.');
      if(!enabled || ticket!==generation)return;
      const plantCost=Number(plan.plantCost)||0, expeditionCost=Number(plan.expeditionCost)||0;
      const reserved=plantCost+expeditionCost;
      if(plan.op==='expMandar' && (plan.args.rota!==options().expedRoute || !(v.exped?.rotas || []).some(r=>r.id===plan.args.rota && r.aberta===true && !r.trancada) || !Array.isArray(plan.args.usar) || plan.args.usar.some(x=>x!=='mapa') || !options().exped))throw Error('Expedição não permitida.');
      if(expeditionCost && (plan.op!=='expMandar' || expeditionCost<0 || !Number.isFinite(expeditionCost)))throw Error('Provisões inválidas.');
      if(reserved && (!['estufaPlantar','expMandar'].includes(plan.op) || reserved<0 || reserved>Number(v.gold)))throw Error('Saldo insuficiente para adubo.');
      if(plantCost){plantSpent+=plantCost;save();}
      render(plan.label+'…');
      const result=await window.P2.op(plan.op,plan.args);
      if(ticket!==generation)return;
      if(!result || result.err || result.precisaPagar || result.precisaConfirmar) {if(result?.err && plantCost){plantSpent-=plantCost;save();}render('Aguardando: '+(result?.err || 'ação não confirmada')+'. Tentará novamente sem desligar.');return;}
      if(result.gold!=null && v.gold!=null && result.gold<v.gold-reserved || result.diamonds!=null && v.diamonds!=null && result.diamonds<v.diamonds){suspended=true;render('Saldo diminuiu durante a ação. Verificação suspensa; desligue e ligue para revisar.');return;}
      if(plantCost && Number.isFinite(result.r?.adubo) && result.r.adubo>=0 && result.r.adubo<reserved){plantSpent-=reserved-result.r.adubo;save();}
      render(plan.label+' ✓');lastRead=Date.now()-12000;
    }catch(e){render('Aguardando conexão: '+e.message+'. Continua ligada.');lastRead=Date.now();}
    finally{busy=false;if(ticket!==generation)lastRead=0;}
  }
  if(typeof window.IPM_ON_STATE==='function')window.IPM_ON_STATE(()=>{bind();observeGatherShiny();void tick();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastRead=0;void tick();}});
  setInterval(()=>void tick(),3000);bind();void tick();

})();
