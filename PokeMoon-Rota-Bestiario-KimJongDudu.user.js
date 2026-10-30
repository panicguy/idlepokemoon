// ==UserScript==
// @name         Poke Moon - Rota do Bestiário
// @namespace    local.pokemoon.bestiario
// @version      1.0.6
// @description  Visita hunts liberadas e captura uma espécie normal faltante por vez.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @sandbox      raw
// ==/UserScript==

(() => {
  'use strict';
  if (document.getElementById('ipm-rota-best')) return;
  // Usa o contexto principal da página. Não copia nem persiste a autenticação.
  const state = () => typeof K === 'object' && K && K.player ? K : null;
  const token = () => typeof q === 'string' ? q : '';
  const norm = s => String(s || '').toLowerCase();
  let running = false, busy = false, stopping = false, target = null, generation = 0;
  let actions = Promise.resolve();
  let retryAt = 0;
  let catalog = null, zones = [], allowed = new Set(), lastCatalog = 0;
  let lastStateAt = Date.now(), startedAt = 0, startBalls = 0;
  const completed = new Set();
  const totalBalls = s => Object.values(s.balls || {}).reduce((n, v) => n + Math.max(0, Number(v) || 0), 0);

  const KJD_MAGMAR_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAnCAMAAACylgF9AAABGWlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGBSSCwoyGESYGDIzSspCnJ3UoiIjFJgf8XAxSDLIM7AzSCfmFxc4BgQ4MMABDAaFXy7xsAIoi/rgszClMcLuFJSi5OB9B8gzk4uKCphYGDMALKVy0sKQOweIFskKRvMXgBiFwEdCGRvAbHTIewTYDUQ9h2wmpAgZyD7A5DNlwRmM4Hs4kuHsAVAbKi9ICDomJKflKoA8r2GoaWlhSaJfiAISlIrSkC0c35BZVFmekaJgiMwpFIVPPOS9XQUjAyMzBgYQOEOUf05EByejGJnEGIIgBCbI8HA4L+UgYHlD0LMpJeBYYEOAwP/VISYmiEDg4A+A8O+OcmlRWVQYxiZjBkYCPEBQ4VKavFzojUAAAGAUExURaJtV8lZJNmqSKlkJG5hVJMzJJ+hnu3VbnNwbGxsbaaLX6mVkvDPPIx2b7ylNLCmoeWeKMO1rujq6Tc3Nz8+RVxQMmRYRn6Afql/gKqmpr///+/ehwAAAFAZD44lFjAWD68nFnAlFf///2scEFMmEtFHMxAIB1NGMpEbEY52KL29vU03FCwjF1pYVnM1GLA4JsqnMTINCFVGF25YGqmKKMgrF86ZLMnJyWtra88yGhkZF3NnZcw5J0tFRmpJGXdzc62qpysoKFQ4LmtXVJWUkzo1G0ssKVtbWJBnJoODg614K9bW1vPWTzc1NJBHKYxbGqWlpbSzs/j6+XZ3d7BoHbWXK9N0LNKyNPCmUevJSGk2LotGGIyIhpeVlbMwGtSJKOi5M+/IMfjWZ0dHR3EpI3VFKmhKR2dWII1WMIxaUIRlHpiEJ5KETo2JidXV1OelLUQNCntpJI4rIZNpZ6YeFKhEL7BVKqCdndKKStibTcjJyfX19SsrK1NRSmJHJXNlHfdlQm0AAACAdFJOU/r////g/x7/Lp7///+p/1b/Jv9m//9Ugv+QBP8A//////8D//////7//w7///////////////8ItP/////8//8u///7Uf//0P8J/wn//f//////lP//////////cP///////1T//fj///z/////////////////vP///zRwU3b/10NyYQAAA8RJREFUeNpt1Pd72jgYB3AHspvO23eWZHliPDC2MXsT9ggJJCF7772aNh3/emVIcndtvz/4eYQ+aLySTdE0vb1NP2X0k/ipQn8Xima3v3zZHh20xj+fnMifKz+YitiSpfH+75XfU2Njk6WfGW/vH2n84eGh9kvqfLOcZH+Y6++PM8Oyx3MSP2tr5Q9bU87BsP97wxLTeuMMjGervlFFBbcjkwnTNPv2bc01q2LnjaHEZ2dnzxrWRr1n901GFEvkyfMvB8br2TJk7aydLzubPfm3F2RBhb1bMEy/puxq+SVLjaZNY2us3k1N5lHH2XCs3KqfzuSvBCBlqKqx3sqFqZJyTsjU5rkiinpnvePV0WkbXSUYgHjbWJ9fLoapYbXlnK87TgcDHLi7E4SALi3BQAASU3XmialRo3m+M0QiQAgDCUEYEm55ABmGQwikWsvLhyssRb8XdW+IdF1BJhQlSBAg4CAEwSBCwaC64tb5vcgxpGvEd0NMNJFICAkIAEBBEAhg5G6yb6AgJBifjwmRMOQPgaCioJ2AQEzc75q/GsQwzA0xg4QSgaB1yd8KZN1AjPTvRm0PQN9ziIkywZZ9mdKjHAeDfUOz+QsfdbgD3SxdU6FoCAbLzrHJMwAP4V13XzSrXdz8SeWazebaTnKVGAaSysgmzwF9fgjH/H0T9BWLS5Oe+yaI/ToSikJctmVTJ7tPLawvD0w7fpE7oD4sLlZ3wQ4TYjjeOrJ4jAExRmtgZmfEXeqeGI93hOwLckBRSK1JHc3uwtd/TZP33i8uzjcxhAhwpIYcXIsCRbatZ8NjTj+ozt/pABTzS+5ZuOMpinlpDszH0yQPOIKaI5gDxescOdO1NYgVyzJNqTTYu/YuibCu6xg/HjgTXYNAr9q2rPZr+FpLpzUVAcBjSAqLi2mJDMqBlOwYxitLipBx2lpaEwlBPNmujnmJiksol0NlZ2NhqmebKlnPu1lNBABjpJh86gin9tX0ajZ9iuSFzc1e3bBc006m44RwAKnKUde2j/clN/vdjXq93huYysRE/HCJjFPUFOvYMLrH+4qiqke2seDxGIO5aLqUnNnjMdJmGtOW/croymYspppfZTfWdDbsmtpKI51HhRrtj6NpScqpUsa/ElOn3aBS2L0/BEUikTlycTN59yLHkuRlrk00EOaf7mE/pTny8Ddw1H2v+t8EVgOkwaG5Z8O6oyRPDwMv9rIZuu/T15CKowL7bNyE5+I5kI8UHhuRJEhG/mDp/xkyYzabLTw1IqQx9/it+0/YcDj8k8Y3tysAfqlXfMkAAAAASUVORK5CYII=';

  // Decodes bundled sprite bytes through the browser, without remote image requests.
  function kjdMagmarCanvas() {
    const canvas=document.createElement('canvas');
    canvas.width=35; canvas.height=39;
    canvas.style.cssText='width:29px;height:29px;object-fit:contain;image-rendering:pixelated;pointer-events:none';
    const fallback=()=>{if(canvas.isConnected)canvas.replaceWith(document.createTextNode('🔥'))};
    try {
      const base64=KJD_MAGMAR_ICON.slice('data:image/png;base64,'.length);
      const png=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
      const ctx=canvas.getContext('2d');
      if(!ctx)throw Error('Canvas indisponível');
      const paint=bitmap=>{ctx.drawImage(bitmap,0,0);if(typeof bitmap.close==='function')bitmap.close()};
      if(typeof createImageBitmap==='function')
        createImageBitmap(new Blob([png],{type:'image/png'})).then(paint).catch(fallback);
      else {
        const img=new Image();
        img.onload=()=>paint(img);
        img.onerror=fallback;
        img.src=KJD_MAGMAR_ICON;
      }
    } catch(error) { console.warn('[Moon Dock] Magmar não pôde ser desenhado',error); fallback(); }
    return canvas;
  }
  function addMoonDockButton(id,label,image,pane) {
    let dock=document.getElementById('kjd-moon-dock');
    if(!dock){
      const css=document.createElement('style');
      css.textContent='#kjd-moon-dock{position:fixed;left:8px;top:50%;transform:translateY(-50%);z-index:2147483646;display:flex;flex-direction:column;gap:6px;padding:7px 5px;border:2px solid #785a28;border-radius:10px;background:#14100add;backdrop-filter:blur(4px)}#kjd-moon-dock button{width:36px;height:36px;display:flex;align-items:center;justify-content:center;padding:2px;border:1px solid transparent;border-radius:8px;background:transparent;cursor:pointer;font:23px system-ui;color:#ffe2a0}#kjd-moon-dock button:hover{background:#ffffff22}#kjd-moon-dock button.active{background:#d5aa4533;border-color:#d5aa45}#kjd-moon-dock img{width:29px;height:29px;image-rendering:pixelated;object-fit:contain;pointer-events:none}#kim-pm-panel[hidden],#kjd-autorefill[hidden],#ipm-rota-best[hidden]{display:none!important}';
      document.head.appendChild(css);
      dock=document.createElement('nav');dock.id='kjd-moon-dock';dock.setAttribute('aria-label','Automações Poke Moon');document.body.appendChild(dock);
    }
    const button=document.createElement('button');button.type='button';button.title=label;button.setAttribute('aria-label',label);
    if(image && image.tagName==='CANVAS')button.appendChild(image);else button.textContent='🔥';
    pane.hidden=true;pane.dataset.kjdPanel=id;
    button.onclick=()=>{const opening=pane.hidden;document.querySelectorAll('[data-kjd-panel]').forEach(p=>{p.hidden=true});dock.querySelectorAll('button').forEach(b=>b.classList.remove('active'));pane.hidden=!opening;button.classList.toggle('active',opening)};
    dock.appendChild(button);
  }
  const panel = document.createElement('section');
  panel.id = 'ipm-rota-best';
  panel.style.cssText = "position:fixed;right:16px;top:110px;z-index:99999;width:340px;max-width:90vw;padding:14px;border:1px solid #6d80bb66;border-radius:16px;background:linear-gradient(160deg,#1e2b62f5,#0c1230f8);color:#eef3ff;font:13px/1.45 system-ui;box-shadow:0 12px 36px #0009";
  panel.innerHTML = "<div data-handle style=\"cursor:move;display:flex;gap:10px;align-items:center;border-bottom:1px solid #8c9dd333;padding-bottom:11px;user-select:none\"><span style=\"font-size:25px\">🏆</span><div><strong style=\"letter-spacing:3px;color:#f5d67b;font-size:17px\">PAINEL</strong><div style=\"font-size:11px;color:#9cadde\">Rota do Bestiário 1.0.3 · arraste para mover</div></div></div><div style=\"font-size:10px;letter-spacing:2px;color:#b1c1ef;margin:15px 0 8px\">RESUMO DA ROTA</div><div style=\"display:flex;gap:8px\"><div style=\"flex:1;border:1px solid #8c9dd333;border-radius:10px;padding:10px\"><small>Concluídas</small><div data-counter style=\"font-weight:800;font-size:23px;color:#f5d67b\">0</div></div><div style=\"flex:1;border:1px solid #8c9dd333;border-radius:10px;padding:10px\"><small>Status</small><div data-mode style=\"font-weight:800;font-size:21px\">Pronto</div></div></div><div style=\"font-size:10px;letter-spacing:2px;color:#b1c1ef;margin:15px 0 8px\">CONFIGURAÇÕES</div><div style=\"display:flex;gap:8px\"><label style=\"flex:1\">Minutos por hunt<input data-min type=\"number\" min=\"1\" max=\"1440\" value=\"10\" style=\"width:100%;padding:7px;background:#0c1437;color:white;border:1px solid #7186b777;border-radius:7px\"></label><label style=\"flex:1\">Bolas por hunt<input data-balls type=\"number\" min=\"1\" max=\"1000\" value=\"60\" style=\"width:100%;padding:7px;background:#0c1437;color:white;border:1px solid #7186b777;border-radius:7px\"></label></div><div style=\"display:flex;gap:8px;margin-top:14px\"><button data-start style=\"flex:1;background:#376cdd;color:white;border:0;padding:10px;border-radius:9px;cursor:pointer\">▶ Iniciar / retomar</button><button data-stop style=\"flex:1;background:#8a3653;color:white;border:0;padding:10px;border-radius:9px;cursor:pointer\">Ⅱ Pausar</button></div><div data-status role=\"status\" style=\"white-space:pre-wrap;margin-top:12px;padding:10px;border-radius:10px;border:1px solid #8c9dd333\">Pronto. Nenhuma ação iniciada.</div><small style=\"display:block;margin-top:10px;color:#abbbe5\">Captura uma espécie normal por vez. Pausar mantém Auto-Catch e combate.</small>";
  panel.style.maxHeight='calc(100vh - 24px)';panel.style.overflowY='auto';
  document.body.appendChild(panel);
  addMoonDockButton('bestiario','Rota do Bestiário - Magmar',kjdMagmarCanvas(),panel);
  const close=document.createElement('button');
  close.type='button';close.textContent='×';close.title='Fechar painel';
  close.style.cssText='position:absolute;top:8px;right:8px;background:#253968;color:white;border:1px solid #7282ac;border-radius:6px;padding:2px 8px;cursor:pointer;z-index:2';
  close.onclick=()=>{panel.hidden=true;document.querySelectorAll('#kjd-moon-dock button').forEach(b=>b.classList.remove('active'))};
  panel.appendChild(close);
  const posKey='ipm-rota-bestiario-pos-v103';
  const handle=panel.querySelector('[data-handle]');let drag=null;
  const move=(x,y)=>{panel.style.left=Math.max(0,Math.min(x,innerWidth-Math.max(panel.offsetWidth,Math.min(340,innerWidth*0.9))))+'px';panel.style.top=Math.max(0,Math.min(y,innerHeight-60))+'px';panel.style.right='auto';};
  try{const p=JSON.parse(localStorage.getItem(posKey));if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))move(p.x,p.y)}catch{}
  handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=panel.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};handle.setPointerCapture(e.pointerId);e.preventDefault()});
  handle.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId)move(e.clientX-drag.dx,e.clientY-drag.dy)});
  handle.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;const r=panel.getBoundingClientRect();try{localStorage.setItem(posKey,JSON.stringify({x:r.left,y:r.top}))}catch{}});
  const status = panel.querySelector('[data-status]');
  const startButton = panel.querySelector('[data-start]');
  function say(message) { status.textContent = message;panel.querySelector('[data-counter]').textContent=completed.size;panel.querySelector('[data-mode]').textContent=running?'Ativa':'Pausada'; }
  function numberSetting(selector, max) {
    const value = Number(panel.querySelector(selector).value);
    if (!Number.isFinite(value) || value < 1 || value > max) throw new Error('Preencha limites válidos no painel.');
    return value;
  }
  async function read(path) {
    const auth = token();
    if (!auth) throw new Error('Sessão do jogo não encontrada. Recarregue a página.');
    const response = await fetch(path + (path.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(auth), {
      credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      const error = new Error('Falha ao consultar o jogo (HTTP ' + response.status + ').');
      error.transient = response.status === 429 || response.status >= 500;
      throw error;
    }
    const data = await response.json();
    if (!data || data.err) throw new Error(data && data.err || 'Resposta vazia do jogo.');
    return data;
  }
  function action(name, params) {
    const request = actions.then(async () => {
      if (!running) return null;
      // Y transforma erros em false, perdendo a causa e o tempo de espera.
      const response = await fetch('/api/action', {method:'POST', credentials:'same-origin',
        headers:{'Content-Type':'application/json'}, signal:AbortSignal.timeout(15000),
        body:JSON.stringify({token:token(),action:name,...params})});
      const result = await response.json();
      if (!response.ok || !result || result.err || result.precisaConfirmar) {
        const error = new Error(result && result.err || 'Falha na ação: ' + name);
        error.transient = response.status === 429 || response.status >= 500 || /aguarde|viajar de novo|prazo|conexão/i.test(error.message);
        throw error;
      }
      if (result.state && typeof handleStateUpdate === 'function') { handleStateUpdate(result.state); lastStateAt = Date.now(); }
      return result;
    });
    actions = request.catch(() => {});
    return request;
  }
  async function refresh(full = false) {
    const data = await read(full ? '/api/bestiario' : '/api/bestiario?so=cand');
    if (!Array.isArray(data.candidatos) || !data.colecao || (full && !Array.isArray(data.especies))) {
      throw new Error('Formato do bestiário mudou; execução interrompida.');
    }
    catalog = full ? data : {...catalog, candidatos:data.candidatos, colecao:data.colecao};
    lastCatalog = Date.now();
  }
  function owned(base) {
    const species = catalog.especies.find(p => p.k === base);
    return catalog.candidatos.some(p => norm(p.base) === base && (!p.shiny || species && species.semShiny));
  }
  function missing(base) { return !catalog.colecao[base] && !completed.has(base) && !owned(base); }
  function currentZone() {
    const s = state();
    return s && s.inst && Number.isInteger(s.inst.zona) ? s.inst.zona : s && s.zone && s.zone.index;
  }
  async function pause(message) {
    running = false;
    generation++;
    say(message + '\nRota parada. Auto-Catch preservado; controle a captura pelo Auto-Helper.');
    startButton.disabled = false;
  }
  function checkSafety() {
    const s = state();
    if (!s) throw new Error('Jogo ainda não está pronto.');
    if (s.fainted || !s.active || Number(s.active.hp) <= 0) throw new Error('Pokémon desmaiado ou sem Pokémon ativo.');
    if (!s.auto || !s.auto.hunt) throw new Error('Ative a caça no Auto-Helper antes de iniciar.');
    if (!s.auto.catch) throw new Error('Ative o Auto-Catch no Auto-Helper antes de iniciar.');
    if (s.auto.sellDup) throw new Error('Desative Vender Duplicatas no Auto-Helper para preservar as capturas.');
    if (s.auto.evolve) throw new Error('Desative Auto-Evolve para preservar a espécie capturada.');
    if (totalBalls(s) < 1) throw new Error('Sem bolas na mochila.');
    if (s.boxCap && Number(s.boxCap.n) >= Number(s.boxCap.max) - 1) throw new Error('Box sem margem de espaço.');
    if (!s.auto.ballAuto && !(Number(s.balls[s.auto.ball]) > 0)) throw new Error('A bola selecionada acabou. Escolha outra no jogo.');
    return s;
  }
  async function next() {
    const s = checkSafety();
    const choices = zones.filter(z => allowed.has(z.base) && z.lv <= s.player.level && missing(z.base));
    choices.sort((a,b) => a.lv - b.lv || a.base.localeCompare(b.base));
    target = choices.find(z => z.index === currentZone()) || choices[0] || null;
    if (!target) return pause('Concluído: nenhuma espécie faltante elegível nas hunts liberadas.');
    startedAt = Date.now();
    startBalls = totalBalls(s);
    say('Indo para ' + target.name + '…');
    if (!running) return;
    if (currentZone() !== target.index) await action('selectZone', {index:target.index, furiosa:false, confirmo:false, naoPerguntar:false});
    // A resposta da troca precisa identificar a instância antes de capturar.
    if (!running) return;
    if (currentZone() !== target.index) throw new Error('O jogo não confirmou a chegada à hunt.');
    say('Caçando: ' + target.name + '\nAguardando 1 captura normal. Concluídas nesta sessão: ' + completed.size);
  }
  async function tick() {
    if (!running || busy || stopping || Date.now() < retryAt) return;
    busy = true;
    try {
      // Em segundo plano, o próprio jogo reduz a frequência das atualizações.
      if (Date.now() - lastStateAt > 30000) {
        const update = await read('/api/state');
        if (!running) return;
        if (update.state && typeof handleStateUpdate === 'function') handleStateUpdate(update.state);
        lastStateAt = Date.now();
      }
      const s = checkSafety();
      if (!target) { await next(); return; }
      if (currentZone() !== target.index) throw new Error('Hunt alterada fora do script.');
      if (!s.auto.catch) throw new Error('Auto-Catch foi desligado no jogo.');
      if (Date.now() - lastCatalog >= 8000) {
        await refresh();
        if (!running) return;
        // Confirma a espécie no catálogo, em vez de contar bolas lançadas ou abates.
        if (owned(target.base) || catalog.colecao[target.base]) {
          completed.add(target.base);
          target = null;
          if (running) await next();
          return;
        }
      }
      const used = Math.max(0, startBalls - totalBalls(s));
      const elapsed = (Date.now() - startedAt) / 60000;
      if (used >= numberSetting('[data-balls]',1000)) throw new Error('Limite de bolas atingido em ' + target.name + '.');
      if (elapsed >= numberSetting('[data-min]',1440)) throw new Error('Limite de tempo atingido em ' + target.name + '.');
      say('Caçando: ' + target.name + '\n' + used + ' bolas · ' + elapsed.toFixed(1) + ' min\nConcluídas nesta sessão: ' + completed.size);
    } catch (error) {
      if (error.transient || error.name === 'TimeoutError' || error instanceof TypeError) {
        retryAt = Date.now() + 5000;
        if (target && currentZone() !== target.index) target = null;
        say('Aguardando para tentar novamente: ' + error.message + '\nRota ativa. Auto-Catch preservado.');
      } else await pause(error.message);
    }
    finally { busy = false; }
  }
  startButton.onclick = async () => {
    if (busy || running || stopping) return;
    busy = true;
    startButton.disabled = true;
    const attempt = ++generation;
    try {
      if (typeof window.IPM_HUNTS?.liberadas !== 'function' || typeof window.IPM_ON_STATE !== 'function') {
        throw new Error('Interface do jogo indisponível. Recarregue a página.');
      }
      numberSetting('[data-min]',1440); numberSetting('[data-balls]',1000);
      checkSafety();
      say('Consultando hunts e bestiário…');
      await refresh(true);
      if (attempt !== generation) return;
      const raw = await read('/api/hunts');
      if (attempt !== generation) return;
      if (!Array.isArray(raw.zonas)) throw new Error('Formato das hunts mudou.');
      allowed = await window.IPM_HUNTS.liberadas();
      if (attempt !== generation) return;
      if (!(allowed instanceof Set)) throw new Error('Não foi possível validar as hunts liberadas.');
      zones = raw.zonas.map(z => ({index:z.i,name:z.n,base:norm(z.b || z.esp),lv:Number(z.lv)}))
        .filter(z => Number.isInteger(z.index) && z.base && Number.isFinite(z.lv));
      running = true;
      target = null;
      retryAt = 0;
      say('Rota ativa. Preparando a próxima hunt…');
    } catch (error) { await pause(error.message); }
    finally { busy = false; startButton.disabled = false; }
  };
  panel.querySelector('[data-stop]').onclick = () => {
    // Bloqueia o restante de qualquer fluxo pendente imediatamente.
    running = false;
    if (!stopping) void pause('Pausado pelo jogador.');
  };
  if (typeof window.IPM_ON_STATE === 'function') window.IPM_ON_STATE(() => {
    lastStateAt = Date.now();
    void tick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void tick(); });
  setInterval(() => { void tick(); }, 2000);
})();