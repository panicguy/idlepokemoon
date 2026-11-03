// ==UserScript==
// @name         Poke Moon Sniper de Diamantes by time Rebosteio
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.0.0
// @description  Sniper de diamantes com contas selecionáveis, preço máximo, meta, orçamento e reserva. Começa em observação.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// @idlemoon-card market-v1
// @idlemoon-market diamonds-v1
// ==/UserScript==

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

(() => {
'use strict';
if(window.__rebosteioDiamondSniper)return;window.__rebosteioDiamondSniper=true;
const bridge=()=>window.__idleMoonDiamonds;
let model=null,busy=false,editing=false,panel,body,status='Conectando ao Hub…';
const money=n=>Number(n||0).toLocaleString('pt-BR');
function diamond(){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const shape=(points,color)=>{x.fillStyle=color;x.beginPath();points.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fill();};shape([[5,8],[11,3],[23,3],[29,9],[17,30],[3,10]],'#102b50');shape([[5,9],[11,5],[22,5],[27,9],[16,27]],'#28b9f4');shape([[5,10],[27,10],[16,27]],'#117ed1');shape([[11,5],[16,10],[22,5]],'#c0f4ff');shape([[5,10],[16,10],[11,5]],'#72dcff');shape([[16,10],[27,10],[22,5]],'#43bfee');shape([[11,10],[20,10],[16,27]],'#7ce7ff');x.fillStyle='#f2ffff';x.fillRect(5,3,2,6);x.fillRect(3,5,6,2);x.fillRect(26,17,2,4);return c;}
function node(tag,text){const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;}
async function send(command){if(busy)return;busy=true;try{if(!bridge())throw Error('Atualize o Hub para habilitar o Sniper de Diamantes.');const r=await bridge().request(command);if(!r.ok)throw Error(r.error);model=r;status='';editing=false;render();}catch(e){status=e.message;renderStatus();}finally{busy=false;}}
function renderStatus(){if(panel)panel.querySelector('[data-status]').textContent=status;}
function render(){
  if(!panel||editing)return;body.replaceChildren();const state=node('div');state.className='moon-state';state.append(node('span',model?.running?'Ativo · '+(model.mode==='buy'?'Compra automática':'Observação'):'Parado'),node('span','REBOSTEIO'));body.append(state);
  const intro=node('div','Escolha as contas e os limites de cada uma. Usa Dollar do jogo.');intro.className='moon-note';body.append(intro);
  const mode=node('select');mode.setAttribute('aria-label','Modo do sniper');for(const [value,label]of [['observe','Observação · não compra'],['buy','Compra automática']]){const o=node('option',label);o.value=value;mode.append(o);}mode.value=model?.mode||'observe';mode.disabled=!!model?.running;mode.onchange=()=>{editing=true;};body.append(mode);
  const accounts=[];
  for(let i=0;i<3;i++){
    const a=model?.accounts[i]||{selected:false,maxUnit:0,target:0,budget:0,reserve:0},card=node('details');card.className='diamond-account';card.open=i===(bridge()?.slot??0);const label=node('label'),flag=node('input');flag.type='checkbox';flag.checked=a.selected;flag.disabled=!!model?.running;flag.setAttribute('aria-label','Usar '+(model?.names[i]||'Conta '+(i+1)));flag.onchange=()=>{editing=true;};label.append(flag,node('strong',model?.names[i]||'Conta '+(i+1)));const summary=node('summary');summary.append(label);card.append(summary);if(model&&!model.available[i])card.append(node('small','Habilite este script nesta conta nos Ajustes do Hub.'));
    const controls={selected:flag};for(const [key,title]of [['maxUnit','Preço máximo por 💎'],['target','Meta de 💎'],['budget','Orçamento máximo ($)'],['reserve','Manter em Dollar ($)']]){const line=node('label');line.className='diamond-field';const input=node('input');input.type='number';input.min='0';input.step='1';input.value=a[key];input.setAttribute('aria-label',title+' · '+(model?.names[i]||'Conta '+(i+1)));input.disabled=!!model?.running;input.oninput=()=>{editing=true;};line.append(node('span',title),input);card.append(line);controls[key]=input;}accounts.push(controls);
    const totals=model?.totals[i]||{qty:0,spent:0};card.append(node('small','Meta contabilizada: '+money(totals.qty)+' 💎 · Orçamento usado/reservado: $ '+money(totals.spent)));card.append(node('div',model?.last[i]||'Parado.'));body.append(card);
  }
  const note=node('div','O orçamento contabiliza o teto por compra. Uma resposta incerta mantém esse valor reservado. Ao reabrir o app, o sniper permanece parado.');note.className='moon-note';body.append(note);
  const buttons=node('div');buttons.className='diamond-actions';const add=(title,fn,disabled=false,cls='')=>{const b=node('button',title);b.disabled=disabled;b.className=cls;b.onclick=fn;buttons.append(b);};
  const config=()=>({mode:mode.value,accounts:accounts.map(a=>({selected:a.selected.checked,...Object.fromEntries(['maxUnit','target','budget','reserve'].map(k=>[k,Number(a[k].value)]))}))});
  add('Salvar limites',()=>send({type:'save',config:config()}),!!model?.running);
  add('▶ Iniciar',async()=>{await send({type:'save',config:config()});if(!status)await send({type:'start'});},!!model?.running||!!model?.pending,'moon-go');
  add('Ⅱ Parar',()=>send({type:'stop'}),!model?.running,'moon-stop');body.append(buttons);
  if(model?.pending){const warning=node('div','Compra sem confirmação na '+model.names[model.pending.slot]+'. Confira o Histórico do Mercado antes de continuar. Os limites continuam reservados para evitar duplicidade.');warning.className='moon-detail';body.append(warning);const ack=node('button','Já conferi o Histórico do Mercado');ack.onclick=()=>send({type:'ack'});body.append(ack);}
  const history=node('details'),sum=node('summary','Histórico do sniper');history.append(sum);for(const h of model?.history||[])history.append(node('div',new Date(h.at).toLocaleString('pt-BR')+' · '+model.names[h.slot]+' · '+h.qty+' 💎 · até $ '+money(h.cap)+' · '+h.status));body.append(history);const statusEl=node('div',status);statusEl.dataset.status='';statusEl.className='moon-detail';body.append(statusEl);
}
if(location.pathname==='/eco.html'){
  const badge=node('div','Sniper de Diamantes · parado');badge.style.cssText='position:fixed;bottom:55px;left:12px;right:12px;padding:6px;color:#aeeaff;background:#102036;border:1px solid #276c92;font:12px system-ui;z-index:999999';document.body.append(badge);
  setInterval(async()=>{if(!bridge()||busy)return;busy=true;try{const r=await bridge().request({type:'get'});if(r.ok){const i=bridge().slot;badge.textContent='💎 Sniper '+(r.running&&r.accounts[i].selected?'ativo':'parado')+' · '+r.last[i];}}finally{busy=false;}},5000);return;
}
moonPanelTheme();panel=node('section');panel.id='rebosteio-diamond-sniper';panel.className='moon-panel';panel.innerHTML='<div class="moon-head"><span data-icon></span><span class="moon-title">Sniper de Diamantes</span><button data-close title="Fechar painel">×</button></div>';panel.querySelector('[data-icon]').replaceWith(diamond());body=node('div');body.className='moon-body';panel.append(body);document.body.append(panel);
const style=node('style');style.textContent='#rebosteio-diamond-sniper{width:390px}#rebosteio-diamond-sniper select,#rebosteio-diamond-sniper input[type=number]{background:#0d1727;color:#f6e8c5;border:1px solid #485b77;border-radius:5px;padding:5px;font:inherit;box-sizing:border-box}#rebosteio-diamond-sniper select{width:100%}.diamond-account{border:1px solid #31445c;background:#101a2b;border-radius:7px;padding:9px;margin-top:9px}.diamond-account summary label{display:flex;gap:8px;align-items:center;color:#9be4ff;margin-bottom:8px}.diamond-account summary{cursor:pointer;list-style:none}.diamond-account summary::after{content:"▾ limites da conta";color:#8190a5;font-size:10px}.diamond-account small{display:block;color:#a8bacf;font-size:10px;margin-top:7px}.diamond-field{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}.diamond-field input{width:130px}.diamond-actions{display:flex;gap:5px;margin:10px 0}.diamond-actions button{flex:1;border:1px solid #485b77;border-radius:6px;padding:9px 5px;background:#1b2940;color:#f6e8c5;cursor:pointer}.diamond-actions button:disabled{opacity:.5;cursor:default}.diamond-actions .moon-go{background:#246346}.diamond-actions .moon-stop{background:#4a2834}.diamond-actions button,#rebosteio-diamond-sniper details{font:inherit}#rebosteio-diamond-sniper details div{padding:7px;border-bottom:1px solid #31445c}';document.head.append(style);
moonDock().register('diamonds','Sniper de Diamantes — Diamante azul',diamond(),panel);moonDock().drag(panel,panel.querySelector('.moon-head'),{storageKey:'rebosteio-diamond-sniper-position'});panel.querySelector('[data-close]').onclick=()=>{panel.hidden=true;moonDock().sync();};render();send({type:'get'});setInterval(()=>{if(!editing&&!busy&&!panel.hidden)send({type:'get'});},5000);
})();