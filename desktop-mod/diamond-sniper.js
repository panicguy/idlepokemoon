'use strict';
const fs=require('fs'),path=require('path');
const LIMIT=Number.MAX_SAFE_INTEGER;
function validate(input){
  if(!input||!['observe','buy'].includes(input.mode)||!Array.isArray(input.accounts)||input.accounts.length!==3)throw Error('Configuração inválida.');
  const accounts=input.accounts.map(a=>{if(!a||typeof a.selected!=='boolean')throw Error('Seleção inválida.');const out={selected:a.selected};for(const k of ['maxUnit','target','budget','reserve']){if(!Number.isSafeInteger(a[k])||a[k]<0||a[k]>LIMIT)throw Error('Use valores inteiros válidos.');out[k]=a[k];}return out;});
  return {mode:input.mode,accounts};
}
function quote(market,cfg,total){
  if(!market||!Array.isArray(market.listings)||!Number.isSafeInteger(market.gold)||market.gold<0||!Number.isSafeInteger(market.diamonds)||market.diamonds<0)throw Error('Saldo ou anúncios não reconhecidos.');
  if(!cfg.maxUnit||!cfg.target||!cfg.budget)return {qty:0,cost:0,reason:'Defina preço, meta e orçamento.'};
  const rows=market.listings.filter(l=>l.cat==='diamond'&&l.currency==='gold'&&l.mine===false&&!l.offerOnly&&Number.isSafeInteger(l.unit)&&l.unit>0&&l.unit<=cfg.maxUnit&&Number.isSafeInteger(l.left)&&l.left>0).sort((a,b)=>a.unit-b.unit);
  const stock=rows.reduce((n,l)=>Math.min(LIMIT,n+l.left),0),qty=Math.max(0,Math.min(1000,stock,cfg.target-total.qty,Math.floor((cfg.budget-total.spent)/cfg.maxUnit),Math.floor((market.gold-cfg.reserve)/cfg.maxUnit)));
  if(!qty)return {qty:0,cost:0,reason:total.qty>=cfg.target?'Meta atingida.':stock===0?'Nenhuma oferta dentro do preço.':'Orçamento ou reserva de Dollar atingidos.'};
  let left=qty,cost=0;for(const l of rows){const n=Math.min(left,l.left);cost+=n*l.unit;left-=n;if(!left)break;}
  const cap=qty*cfg.maxUnit;if(!Number.isSafeInteger(cap)||!Number.isSafeInteger(cost))throw Error('Valor da compra excede o limite.');return {qty,cost,cap,maxUnit:cfg.maxUnit,reason:'Oferta dentro dos limites.'};
}
function bridge(slot){return `(()=>{if(window.__idleMoonDiamonds)return;let pending=null,done=null,timer;window.__idleMoonDiamonds={slot:${slot},get pending(){return pending},request(command){if(pending)return Promise.reject(Error('Aguarde a consulta atual.'));return new Promise(resolve=>{const id=crypto.randomUUID();pending={id,command};done=resolve;timer=setTimeout(()=>this.settle(id,{ok:false,error:'O Hub demorou para responder.'}),12000)})},settle(id,result){if(!pending||pending.id!==id)return;clearTimeout(timer);const resolve=done;pending=null;done=null;resolve(result)}}})();`;}
function readCode(){return `/* DIAMOND READ */ (async()=>{const token=localStorage.getItem('pmi_token');if(!token)throw Error('Sessão indisponível.');const headers=window.__idleMoonCard?.sid?{'X-Sid':window.__idleMoonCard.sid}:{};const r=await fetch('/api/mercado?token='+encodeURIComponent(token)+'&leve=1',{headers,cache:'no-store',signal:AbortSignal.timeout(15000)}),d=await r.json();if(!r.ok||d.err||d.error||d.sess==='other'||d.sess==='devlimit')throw Error(d.err||'Mercado indisponível.');return {gold:d.gold,diamonds:d.diamonds,listings:(d.listings||[]).filter(l=>l.cat==='diamond').map(l=>({id:l.id,cat:l.cat,currency:l.currency,unit:l.unit,left:l.left,mine:l.mine===true,offerOnly:l.offerOnly===true}))}})()`;}
function buyCode(order){return `/* DIAMOND BUY */ (async()=>{const p=${JSON.stringify({op:'buyQty',cat:'diamond',item:'',tier:null,currency:'gold',qty:order.qty,maxUnit:order.maxUnit})};const run=window.__idleMoonCard?window.__idleMoonCard.action:window.Y;if(typeof run!=='function')throw Error('Compra indisponível nesta página.');const result=await run('mgOp',p);if(!result||result.err||result.error||result.precisaConfirmar||result.cancelado)return {refused:true,error:result?.err||result?.error||'Compra recusada.'};const after=await (${readCode()});return {after};})()`;}
function create({file,views,origin,allowed,now=Date.now}){
  const empty=()=>({mode:'observe',accounts:Array.from({length:3},()=>({selected:false,maxUnit:0,target:0,budget:0,reserve:0})),totals:Array.from({length:3},()=>({qty:0,spent:0})),history:[],pending:null});
  let state=empty(),running=false,busy=false,next=0,cursor=0,last=['Parado.','Parado.','Parado.'];
  if(fs.existsSync(file)){const data=JSON.parse(fs.readFileSync(file,'utf8'));state={...empty(),...validate(data),totals:data.totals,history:data.history,pending:data.pending};if(!Array.isArray(state.totals)||state.totals.length!==3||state.totals.some(t=>!Number.isSafeInteger(t.qty)||t.qty<0||!Number.isSafeInteger(t.spent)||t.spent<0)||!Array.isArray(state.history))throw Error('Histórico do sniper inválido.');if(state.pending)last[state.pending.slot]='Compra sem confirmação: confira o Histórico do Mercado. O limite foi reservado.';}
  const save=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(state,null,2));fs.renameSync(file+'.tmp',file);};
  const names=()=>{try{const p=JSON.parse(fs.readFileSync(path.join(path.dirname(file),'preferencias.json'),'utf8'));return [0,1,2].map(i=>p.nomes?.[i]||'Conta '+(i+1));}catch{return ['Conta 1','Conta 2','Conta 3'];}};
  const snapshot=()=>({ok:true,mode:state.mode,accounts:state.accounts,totals:state.totals,history:state.history.slice(-20).reverse(),pending:state.pending,running,last,names:names(),available:[0,1,2].map(i=>!!allowed(i))});
  function command(c){try{if(!c||typeof c!=='object')throw Error('Pedido inválido.');if(c.type==='get')return snapshot();if(c.type==='stop'){running=false;return snapshot();}if(c.type==='ack'){if(running||busy||!state.pending)throw Error('Pare o sniper e confira o Histórico.');state.pending=null;save();return snapshot();}if(c.type==='save'){if(running||busy)throw Error('Pare o sniper antes de editar.');const config=validate(c.config);state={...state,...config};save();return snapshot();}if(c.type==='start'){if(state.pending)throw Error('Há uma compra sem confirmação. Confira o Histórico do Mercado antes de continuar.');const active=state.accounts.filter((a,i)=>a.selected&&allowed(i));if(!active.length)throw Error('Marque uma conta e habilite o script nela no Hub.');if(active.some(a=>!a.maxUnit||!a.target||!a.budget))throw Error('Defina preço, meta e orçamento nas contas marcadas.');running=true;next=0;return snapshot();}if(c.type==='scan'){if(running||busy)throw Error('Aguarde ou pare o sniper.');next=0;running=true;oneShot=true;return snapshot();}throw Error('Pedido inválido.');}catch(e){return {ok:false,error:e.message};}}
  let oneShot=false;
  async function tick(){if(!running||busy||now()<next)return;busy=true;let activeSlot=0;next=now()+15000;try{
    const slots=[0,1,2].filter(i=>state.accounts[i].selected&&allowed(i));if(!slots.length){running=false;return;}const i=slots[cursor++%slots.length],wc=views()[i]?.webContents;if(!wc||wc.isDestroyed())throw Error('Conta indisponível.');const u=new URL(wc.getURL());if(u.origin!==origin||!['/play','/eco.html'].includes(u.pathname))throw Error('Abra o jogo na conta selecionada.');
    activeSlot=i;const market=await wc.executeJavaScript(readCode(),false),cfg=state.accounts[i],order=quote(market,cfg,state.totals[i]);last[i]=order.reason;
    if(!running||!allowed(i)||!cfg.selected||!order.qty)return;
    if(state.mode==='observe'||oneShot){last[i]='Simulação: '+order.qty+' 💎 por até $ '+order.cap.toLocaleString('pt-BR')+' (cotação $ '+order.cost.toLocaleString('pt-BR')+').';return;}
    // Persist the full ceiling before dispatch. A timeout never retries a possibly executed order.
    state.pending={slot:i,qty:order.qty,cap:order.cap,at:now()};state.totals[i].qty+=order.qty;state.totals[i].spent+=order.cap;save();
    let result;try{result=await wc.executeJavaScript(buyCode(order),false);}catch(e){last[i]='Compra sem confirmação. Confira o Histórico do Mercado.';running=false;state.history.push({...state.pending,status:'incerta'});save();return;}
    if(result?.refused){state.totals[i].qty-=order.qty;state.totals[i].spent-=order.cap;state.history.push({...state.pending,status:'recusada',error:String(result.error).slice(0,200)});state.pending=null;last[i]=String(result.error);running=false;save();return;}
    if(result?.after?.diamonds!==market.diamonds+order.qty){last[i]='Saldo de diamantes não confirmou a compra. Confira o Histórico do Mercado.';running=false;state.history.push({...state.pending,status:'incerta'});save();return;}
    state.history.push({...state.pending,status:'confirmada'});state.history=state.history.slice(-100);state.pending=null;last[i]=order.qty+' 💎 comprados e confirmados.';save();
  }catch(e){last[activeSlot]='Falha: '+e.message;running=false;}finally{if(oneShot){oneShot=false;running=false;}busy=false;}}
  return {command,tick,snapshot};
}
module.exports={create,validate,quote,bridge,readCode,buyCode};
