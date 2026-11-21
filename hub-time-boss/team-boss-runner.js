function tbPlanTeams(input, roster, data, types) {
  const norm = s => String(s || '').toLowerCase();
  const byName = new Map(roster.map(p => [norm(p.nome), p]));
  const moveIndex = new Map(data.gn.map((n,i) => [norm(n),i]));
  const decode = s => {try{return JSON.parse(atob(s.replace(/-/g,'+').replace(/_/g,'/')));}catch(_){return {};}};
  const damage = (attack, defenders) => defenders.reduce((v,t) => v * (types[attack]?.i?.includes(t) ? 0 : types[attack]?.f?.includes(t) ? 2 : types[attack]?.r?.includes(t) ? .5 : 1),1);
  const enemy = [...new Set((input.boss.fases || []).flatMap(p => [p.tipo1,p.tipo2]).filter(t => t && t !== 'none'))];
  if(input.choice && types[input.choice]) {enemy.length=0;enemy.push(input.choice);}
  const enemies = enemy.length ? enemy : [input.boss.arena?.tipo || 'normal'];
  const pool = input.owned.pokes.filter(p => byName.has(norm(p.n)) && p.pkJ && !/[~,;|]/.test(p.n)).map(p => {
    const r=byName.get(norm(p.n)), packet=decode(p.pkJ), clamp=x=>Math.max(.1,Math.min(8,+x||1));
    const a=(+r.s.atk||1)*clamp(packet.a),s=(+r.s.spa||1)*clamp(packet.s);
    const effective = t => enemies.reduce((v,e)=>v+damage(t,[e]),0)/enemies.length;
    const incoming = enemies.reduce((v,e)=>v+damage(e,r.tipos),0)/enemies.length;
    const legal = new Set((data.mp[p.n] || []).filter(x=>p.nv>=200 || x[1]<=p.nv).map(x=>data.gn[x[0]]));
    // Equipped moves are already learned. Never assume a learnable TM has been taught.
    for(const n of input.owned.golpes?.[p.id] || []) legal.add(n);
    const choices=[...legal].map(n=>{
      const i=moveIndex.get(norm(n)),g=i===undefined?null:data.g[i];
      if(!g)return {n,score:15,role:'other'};
      const [type,family,category,power]=g,stat=category==='p'?a:s;
      const support=/curaAliado|buffAliado|escudoAliado/.test(family);
      const heal=/cura/.test(family),buff=/buff|escudo|contra/.test(family);
      const score=power>0?power*stat/100*effective(type)*(r.tipos.includes(type)?1.15:1):support?105:heal?85:buff?60:12;
      return {n,score,role:power>0?'attack':support?'support':heal?'heal':buff?'buff':'other'};
    }).sort((a,b)=>b.score-a.score || a.n.localeCompare(b.n));
    const take = mode => {
      const selected=[],add=g=>{if(g&&!selected.includes(g.n))selected.push(g.n);};
      add(choices.find(g=>g.role==='attack'));
      if(mode==='support') {add(choices.find(g=>g.role==='support'));add(choices.find(g=>g.role==='heal'));}
      else {add(choices.find(g=>g.role==='heal'));add(choices.find(g=>g.role==='buff'));}
      for(const g of choices) {if(selected.length===4)break;add(g);}
      return selected;
    };
    const attack=choices.find(g=>g.role==='attack')?.score||1;
    const bulk=Math.sqrt((+r.s.hp||1)*clamp(packet.h)*Math.sqrt((+r.s.def||1)*clamp(packet.d)*(+r.s.spd||1)*clamp(packet.e)))/Math.max(.2,incoming);
    return {id:p.id,name:p.n,moves:take('balanced'),supportMoves:take('support'),ability:input.info.habVale?.[p.id]||data.e[p.n]?.[0],packet:p.pkJ,level:p.nv,tier:p.k,shiny:p.sh,attack,bulk,healer:choices.some(g=>g.role==='support'),legal};
  }).filter(p=>p.moves.length===4 && p.ability);
  if(pool.length<6)throw Error('São necessários seis Pokémon disponíveis com quatro golpes válidos.');
  const used=new Set(),teams=[];
  const add=(list,label)=>{
    if(list.length!==6 || list.some(p=>p.moves.length!==4) || new Set(list.map(p=>p.id)).size!==6)return;
    const team=list.map(p=>({id:p.id,name:p.name,moves:[...p.moves],ability:p.ability,referencePacket:p.packet,level:p.level,tier:p.tier,shiny:p.shiny}));
    const key=JSON.stringify(team.map(p=>[p.id,p.moves]));if(used.has(key))return;used.add(key);teams.push({label,members:team});
  };
  const pick=(rank,names=new Set())=>rank.filter(p=>{if(names.has(p.name))return false;names.add(p.name);return true;});
  const ranked = ratio => pick([...pool].sort((a,b)=>(b.attack**ratio*b.bulk**(1-ratio))-(a.attack**ratio*a.bulk**(1-ratio))));
  for(const ratio of [.65,.35,.9]) {
    const rank=ranked(ratio);add(rank.slice(0,6),'Equilíbrio '+Math.round(ratio*100));
    const healers=pick([...pool].filter(p=>p.healer).sort((a,b)=>b.bulk-a.bulk)).slice(0,2);
    const supports=healers.map(p=>({...p,moves:p.supportMoves}));
    add([...rank.filter(p=>!healers.some(h=>h.name===p.name)).slice(0,6-supports.length),...supports],'Suporte '+Math.round(ratio*100));
  }
  const current=(input.info.time||[]).map(id=>pool.find(p=>p.id===id));
  if(current.every(Boolean)&&current.length===6)add(current.map(p=>({...p,moves:(input.info.golpes?.[p.id]||p.moves).filter(n=>p.legal.has(n))})),'Time atual');
  const preset=Object.values(input.presets).find(p=>norm(p.name)===norm(input.boss.nome));
  if(preset){const selected=[],ids=new Set();for(const m of preset.members){const p=[...pool].filter(p=>p.name===m.name&&!ids.has(p.id)).sort((a,b)=>b.attack*b.bulk-a.attack*a.bulk)[0];if(!p||m.moves.some(n=>!p.legal.has(n)))break;ids.add(p.id);selected.push({...p,moves:m.moves,ability:p.ability});}add(selected,'Composição salva');}
  // Fixed bound keeps the search responsive; the final winner gets its own 50 trials.
  return teams.slice(0,8);
}


// Sources execute only inside a sandbox without same-origin access or network permissions.
function tbEngineBootstrap(config) {
  window.__tbSearch=config.search;
  window.SIM_SEM_TELA=true;
  window.requestAnimationFrame=()=>0;
  window.__tbDiscardMessage=()=>{};
  window.__tbErrors=[];
  addEventListener('error',e=>__tbErrors.push(String(e.message)));
  addEventListener('unhandledrejection',e=>__tbErrors.push(String(e.reason?.message||e.reason)));
  window.fetch=async (url,options={})=>{
    if(options.method && options.method!=='GET')throw Error('Simulação bloqueou uma escrita.');
    const u=new URL(String(url),'https://offline.invalid/arena-proto/');
    if(u.origin!=='https://offline.invalid')throw Error('Simulação sem acesso à rede.');
    if(Object.hasOwn(config.assets,u.pathname))return new Response(config.assets[u.pathname],{status:200});
    if(u.pathname.endsWith('/manifesto.json') || u.pathname==='/sprites/manifest.json')return new Response('{}');
    throw Error('Arquivo não disponível no simulador: '+u.pathname);
  };
}
async function tbEngineRun(input, send) {
  // Hidden-frame timers are throttled by Chromium. MessageChannel yields to the
  // event loop without turning every batch into a one-second background wait.
  const queue=[],scheduler=new MessageChannel();scheduler.port1.onmessage=()=>queue.shift()?.();
  const yieldUI=()=>new Promise(r=>{queue.push(r);scheduler.port2.postMessage(0);});
  img=async()=>null;imgLutador=async()=>null;
  const roster=await(await fetch('roster.json')).json();ROSTER=roster.pokes;TIPOS=roster.tipos;
  await BX.carregaLuta(BOSS_ID);
  if(!BX.lutas[BOSS_ID])throw Error('O módulo não registrou este boss.');
  const slots=members=>members.map(p=>(p.shiny?'*':'')+p.name+'~'+p.moves.join(';')+'~'+p.ability+'~'+p.level+'~'+p.tier+'~'+p.referencePacket);
  let phase='Iniciando batalha';const progress=data=>{phase=data.text;send('progress',data);};
  const trial=async (members,seed)=>{
    __tbErrors.length=0;
    window.__tbSearch='?'+new URLSearchParams({boss:input.boss.id,semtela:'1',servidor:'1',nv:String(input.boss.nivelRecomendado||200),seed:String(seed),escolha:input.choice||'',times:slots(members).join(',')});
    BX.escolha=input.choice||null;ARENA_SEED=seed;
    const fatias=[seed];let v=seed;for(let i=1;i<650;i++){v=(v+1831565813)>>>0;let t=v;t=Math.imul(t^t>>>15,1|t);t^=t+Math.imul(t^t>>>7,61|t);fatias.push((t^t>>>14)>>>0);}SIM.fatias=i=>fatias[i];
    await BX.novaLuta();
    if(times[0]?.length!==6)throw Error('O motor não montou os seis Pokémon.');
    for(let i=0;i<6;i++)if(times[0][i].nome!==members[i].name)throw Error('O motor alterou a composição.');
    let heartbeat=Date.now();while(!fim && simT<600000){for(let i=0;i<240&&!fim&&simT<600000;i++){const prev=SIM.ticks;passoLogica();if(SIM.ticks===prev)throw Error('Motor de batalha parou.');}if(Date.now()-heartbeat>=2000){send('progress',{text:phase+' · batalha em '+Math.floor(simT/1000)+' s'});heartbeat=Date.now();}await yieldUI();}
    const out=BX.resultado(),errors=[...__tbErrors,...SIM.erros];
    if(errors.length)throw Error('Motor: '+errors[0]);
    return {win:out.vitoria===true,finished:!!out.terminou,seconds:+out.seg||simT/1000,damage:+out.danoTotal||0};
  };
  const candidates=tbPlanTeams(input,ROSTER,V4_DADOS,TIPOS);
  if(input.testOnly){const result=await trial(candidates[0].members,67891);send('ready',{boss:BOSS_ID,result});return;}
  let best=null;const seed0=crypto.getRandomValues(new Uint32Array(1))[0]||12345;
  for(let c=0;c<candidates.length;c++){
    let wins=0,damage=0,seconds=0;
    for(let i=0;i<3;i++){progress({text:'Triagem de times: '+(c*3+i)+'/'+(candidates.length*3)});const r=await trial(candidates[c].members,(seed0+i*104729)>>>0||1);wins+=r.win?1:0;damage+=r.damage;seconds+=r.seconds;}
    const score={wins,damage,seconds,team:candidates[c]};
    if(!best || wins>best.wins || wins===best.wins&&(wins?seconds<best.seconds:damage>best.damage))best=score;
  }
  if(!best)throw Error('Não foi possível formar uma composição.');
  let wins=0,timeouts=0,totalSeconds=0;const seeds=[];
  for(let i=0;i<50;i++){
    progress({text:'Validação do time escolhido: '+i+'/50',completed:i,wins});
    // Validation seeds are separate from screening, fixed for this run and recorded.
    const seed=(seed0+(i+100)*104729)>>>0||1;seeds.push(seed);
    const r=await trial(best.team.members,seed);wins+=r.win?1:0;timeouts+=r.finished?0:1;totalSeconds+=r.seconds;
  }
  send('done',{members:best.team.members,label:best.team.label,wins,losses:50-wins,timeouts,total:50,meanSeconds:totalSeconds/50,seeds,choice:input.choice||'',bossId:input.boss.id,at:Date.now()});
}
function tbSimulationHTML(html, assets, bossId, choice, input, channel) {
  const json=x=>JSON.stringify(x).replace(/</g,'\\u003c');
  const tag=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
  const sources=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>new URL(m[1],'https://offline.invalid/arena-proto/arena.html')).filter(u=>u.origin==='https://offline.invalid'&&!/arena-replay\.js$/.test(u.pathname));
  let body=html.slice(html.indexOf('<body>')+6,html.indexOf('<script'));
  const search='?'+new URLSearchParams({boss:bossId,escolha:choice||'',semtela:'1',servidor:'1',seed:'1'});
  let content=tag('parent.postMessage({channel:'+json(channel)+',type:"boot"},"*");('+tbEngineBootstrap.toString()+')('+json({search,assets})+');');
  for(const u of sources){
    let source=assets[u.pathname];if(typeof source!=='string')throw Error('Falta arquivo '+u.pathname);
    if(u.pathname.endsWith('/arena-main.js')){const marker=',(async()=>{const e=await(await fetch("roster.json"))',i=source.indexOf(marker);if(i<0)throw Error('O motor mudou; atualização necessária antes de simular.');source=source.slice(0,i)+';';}
    source=source.replace(/(?:window\.|self\.)?location\.search/g,'window.__tbSearch').replace(/(?:window\.)?parent\.postMessage/g,'window.__tbDiscardMessage');
    // No network bridge to the game, replays, or real fight submission is installed.
    if(/\/(?:arena-servidor|arena-resultado)\.js$/.test(u.pathname))continue;
    content+=tag(source);
  }
  // Boss modules read the choice at registration, so each run gets a fresh realm.
  const modulePath='/arena-proto/arena-boss-'+bossId+'.js';
  const virtualAssets={...assets,[modulePath]:assets[modulePath].replace(/(?:window\.|self\.)?location\.search/g,'window.__tbSearch').replace(/(?:window\.)?parent\.postMessage/g,'window.__tbDiscardMessage')};
  content+=tag('('+tbEngineBootstrap.toString()+')('+json({search,assets:virtualAssets})+');\n'+tbPlanTeams.toString()+'\nconst __tbSend=(type,data)=>parent.postMessage({channel:'+json(channel)+',type,data},"*");('+tbEngineRun.toString()+')('+json(input)+',__tbSend).catch(e=>__tbSend("error",{message:e.message}));');
  return '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><body>'+body+content+'</body>';
}


module.exports={tbSimulationHTML};
