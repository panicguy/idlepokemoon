// ==UserScript==
// @name         Poke Moon - Rota do Bestiário
// @namespace    local.pokemoon.bestiario
// @version      1.0.2
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
  const panel = document.createElement('section');
  panel.id = 'ipm-rota-best';
  panel.style.cssText = 'position:fixed;left:12px;top:100px;z-index:99999;width:300px;max-width:90vw;padding:14px;border:1px solid #6394bb;border-radius:12px;background:#101d2bf2;color:#f2f7ff;font:13px/1.45 system-ui;box-shadow:0 6px 24px #0008';
  panel.innerHTML = `<strong>🏆 Rota do Bestiário · 1.0.2</strong>
    <div style="margin:7px 0;color:#becedf">Captura 1 normal por espécie. Guardar no bestiário fica por sua conta. Pula espécies já disponíveis no Box.</div>
    <label>Máximo de minutos por hunt <input data-min type="number" min="1" max="120" value="10" style="width:48px"></label><br>
    <label>Máximo de bolas por hunt <input data-balls type="number" min="1" max="1000" value="60" style="width:48px"></label>
    <div style="display:flex;gap:6px;margin-top:10px"><button data-start>Iniciar / retomar</button><button data-stop>Pausar</button></div>
    <div data-status role="status" style="white-space:pre-wrap;margin-top:10px">Pronto. Nenhuma ação iniciada.</div>
    <small>Pausar interrompe só a rota. Auto-Catch, combate e poções continuam conforme o Auto-Helper.</small>`;
  document.body.appendChild(panel);
  const status = panel.querySelector('[data-status]');
  const startButton = panel.querySelector('[data-start]');
  function say(message) { status.textContent = message; }
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
      if (elapsed >= numberSetting('[data-min]',120)) throw new Error('Limite de tempo atingido em ' + target.name + '.');
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
      numberSetting('[data-min]',120); numberSetting('[data-balls]',1000);
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