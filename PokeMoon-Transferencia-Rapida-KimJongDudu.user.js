// ==UserScript==
// @name         Poke Moon - Transferência Rápida
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.3.0
// @description  Mostra os saldos e permite escolher a origem e o destino do envio no Hub.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/panicguy/idlepokemoon
// ==/UserScript==

(() => {
  'use strict';

  const id = 'transferencia-rapida';
  const titulo = 'Transferência Rápida';
  const papeis = ['origem', 'destino'];
  const fmt = new Intl.NumberFormat('pt-BR');
  if (window.top !== window || window.__kjdTransferenciaRapida) return;
  window.__kjdTransferenciaRapida = true;

  function monta(avulso = false) {
    const dock = window.__kjdMoonDockV2;
    if (!avulso && typeof dock?.register !== 'function') return false;

    const pane = document.createElement('section');
    pane.id = 'kjd-transferencia-rapida';
    pane.className = 'moon-panel';
    pane.hidden = true;
    pane.setAttribute('aria-label', titulo);
    pane.innerHTML = `
      <header class="moon-head">
        <span aria-hidden="true">🔁</span><strong class="moon-title">Transferência Rápida</strong>
        <button type="button" class="minimizar" title="Recolher painel" aria-label="Recolher painel" aria-expanded="true">−</button>
        <button type="button" class="fechar" aria-label="Fechar painel">×</button>
      </header>
      <div class="moon-body">
        <div class="selecao">
          <label>Origem<select name="origem" disabled><option value="">Escolha a conta</option></select></label>
          <button type="button" class="inverter" aria-label="Inverter origem e destino" title="Inverter origem e destino" disabled>⇄</button>
          <label>Destino<select name="destino" disabled><option value="">Escolha a conta</option></select></label>
        </div>
        ${papeis.map((papel) => `
          <section class="saldo" data-papel="${papel}" hidden>
            <h3>Saldo da ${papel === 'origem' ? 'origem' : 'conta de destino'}<small data-estado></small></h3>
            <dl>
              <div><dt>Dinheiro</dt><dd data-valor="dinheiro">—</dd></div>
              <div><dt>Diamantes</dt><dd data-valor="diamantes">—</dd></div>
              <div><dt>Chave de Boss</dt><dd data-valor="chaves">—</dd></div>
              <div><dt>Gene Raro</dt><dd data-valor="genes">—</dd></div>
            </dl>
          </section>
        `).join('')}
        <button type="button" class="moon-go" disabled>Revisar transferência</button>
        <button type="button" class="atualizar">Atualizar saldos</button>
        <p class="moon-note">Diamantes: troca manual pelo Social.</p>
        <p class="moon-state erro" role="status" hidden></p>
      </div>`;
    const estilo = document.createElement('style');
    estilo.textContent = `
      #kjd-transferencia-rapida{position:fixed;top:145px;right:28px;z-index:99000;width:min(292px,calc(100vw - 16px));max-height:calc(100vh - 16px);box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(145deg,#182238,#101724 55%,#0b111e);border:1px solid #816e43;border-radius:10px;color:#e8edf6;font:12px/1.35 system-ui,"Segoe UI",sans-serif;box-shadow:0 2px 0 #3a3223 inset,0 12px 38px #000b}
      #kjd-transferencia-rapida [hidden],#kjd-transferencia-rapida[hidden],#kjd-transferencia-rapida.moon-collapsed .moon-body{display:none!important}
      #kjd-transferencia-rapida .moon-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(#303342,#222838);border-bottom:1px solid #685936;cursor:move;user-select:none;touch-action:none}
      #kjd-transferencia-rapida .moon-title{font-weight:850;color:#f4e4b8;flex:1}
      #kjd-transferencia-rapida button{box-sizing:border-box;font:inherit;font-weight:750;cursor:pointer}
      #kjd-transferencia-rapida .moon-head button{padding:0;width:23px;height:23px;border:1px solid #4d556b;border-radius:5px;color:#e8edf6;background:#111827;font-size:16px}
      #kjd-transferencia-rapida .moon-body{padding:11px;min-height:0;overflow:auto;scrollbar-width:thin}
      #kjd-transferencia-rapida .moon-state{display:flex;justify-content:space-between;gap:8px;padding:7px 9px;border:1px solid #31445c;border-radius:7px;background:#101c2a;color:#aebdd1;font-size:11px}
      #kjd-transferencia-rapida .moon-state strong{color:#f4e4b8}
      #kjd-transferencia-rapida .selecao{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:end}
      #kjd-transferencia-rapida .selecao label{color:#aebdd1;font-size:11px}
      #kjd-transferencia-rapida select,#kjd-transferencia-rapida .inverter{width:100%;min-width:0;margin-top:4px;padding:6px;border:1px solid #485b77;border-radius:6px;background:#101c2a;color:#e8edf6;font:inherit}
      #kjd-transferencia-rapida button:disabled{opacity:.55;cursor:default}
      #kjd-transferencia-avulsa{position:fixed;top:105px;right:8px;z-index:98999;padding:6px 8px;border:1px solid #816e43;border-radius:8px;background:#101724;color:#f4e4b8;cursor:pointer}
      #kjd-transferencia-rapida .saldo{margin-top:9px;padding:8px;border:1px solid #303c50;border-radius:7px;background:#101a2b}
      #kjd-transferencia-rapida .saldo h3{display:flex;justify-content:space-between;align-items:baseline;gap:6px;margin:0;color:#f4e4b8;font-size:12px}
      #kjd-transferencia-rapida .saldo small{color:#aebdd1;font-weight:normal;text-align:right}
      #kjd-transferencia-rapida dl{margin:6px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:5px}
      #kjd-transferencia-rapida dl div{padding:5px 6px;border:1px solid #31445c;border-radius:5px;background:#0e1725;min-width:0}
      #kjd-transferencia-rapida dt{font-size:10px;color:#aebdd1}
      #kjd-transferencia-rapida dd{margin:1px 0 0;font-size:12px;font-weight:750;color:#f4e4b8;overflow-wrap:anywhere}
      #kjd-transferencia-rapida .moon-go{width:100%;margin-top:9px;padding:10px 8px;border:1px solid #59ad7c;border-radius:7px;background:linear-gradient(#3a785b,#20593c);color:#eafff1}
      #kjd-transferencia-rapida .atualizar{margin-top:9px;padding:6px 9px;border:1px solid #485b77;border-radius:6px;background:#101c2a;color:#e8edf6}
      #kjd-transferencia-rapida .atualizar:disabled{opacity:.55;cursor:default}
      #kjd-transferencia-rapida button:hover{filter:brightness(1.15)}
      #kjd-transferencia-rapida .moon-note{margin:9px 0 0;color:#aebdd1;font-size:11px;line-height:1.5}
      #kjd-transferencia-rapida .erro{color:#ffb0b2;border-color:#8b4349}
      @media(max-width:500px){#kjd-transferencia-rapida{top:85px;right:8px}}
    `;
    document.head.append(estilo);
    document.body.append(pane);

    const icone = document.createElement('canvas');
    icone.width = icone.height = 48;
    icone.setAttribute('aria-hidden', 'true');
    const ctx = icone.getContext('2d');
    ctx.font = '36px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔁', 24, 25);

    const botaoDock = dock?.register?.(id, titulo, icone, pane) || document.createElement('button');
    if (!botaoDock.isConnected && typeof dock?.register !== 'function') {
      botaoDock.id = 'kjd-transferencia-avulsa';
      botaoDock.type = 'button';
      botaoDock.textContent = '🔁';
      botaoDock.title = titulo;
      botaoDock.setAttribute('aria-label', titulo);
      botaoDock.onclick = () => { pane.hidden = !pane.hidden; };
      document.body.append(botaoDock);
    }
    dock?.drag?.(pane, pane.querySelector('.moon-head'), { storageKey: 'kjd-transferencia-rapida-posicao' });
    const seletores = Object.fromEntries(papeis.map((papel) => [papel, pane.querySelector('select[name="' + papel + '"]')]));
    const inverter = pane.querySelector('.inverter');
    const enviar = pane.querySelector('.moon-go');
    let contas = [];
    const erro = pane.querySelector('.erro');
    const atualizar = pane.querySelector('.atualizar');
    let timeout;
    const aviso = (mensagem) => {
      erro.textContent = mensagem;
      erro.hidden = !mensagem;
    };
    const formataItens = ({ livres, presos }) => presos
      ? fmt.format(livres) + ' livres · ' + fmt.format(presos) + ' presos'
      : fmt.format(livres);
    function preencheContas(novas) {
      const antigas = contas;
      contas = novas.filter((c) => Number.isInteger(c?.slot) && typeof c.nome === 'string');
      for (const seletor of Object.values(seletores)) {
        const anterior = antigas.find((c) => String(c.slot) === seletor.value);
        seletor.replaceChildren(new Option('Escolha a conta', ''), ...contas.map((c) => new Option(c.nome, String(c.slot))));
        seletor.disabled = contas.length === 0;
        if (anterior && contas.some((c) => c.slot === anterior.slot && c.nome === anterior.nome)) seletor.value = String(anterior.slot);
      }
      renderizaSaldos();
    }
    function renderizaSaldos() {
      const { origem, destino } = seletores;
      const parValido = Boolean(origem.value && destino.value && origem.value !== destino.value);
      inverter.disabled = !parValido;
      enviar.disabled = !parValido;
      for (const card of pane.querySelectorAll('[data-papel]')) {
        const conta = contas.find((c) => String(c.slot) === seletores[card.dataset.papel].value);
        card.hidden = !conta;
        card.querySelector('[data-estado]').textContent = conta?.estado === 'ok' ? '' : 'Indisponível';
        const valores = conta?.estado === 'ok' ? {
          dinheiro: '$ ' + fmt.format(conta.dinheiro),
          diamantes: fmt.format(conta.diamantes),
          chaves: formataItens(conta.chaves),
          genes: formataItens(conta.genes),
        } : {};
        for (const campo of card.querySelectorAll('[data-valor]')) campo.textContent = valores[campo.dataset.valor] ?? '—';
      }
      if (!pane.hidden) dock?.clamp?.(pane);
    }
    function consultaSaldos() {
      if (atualizar.disabled) return;
      if (document.documentElement.dataset.idlemoonTransferenciaRapida !== '3') {
        aviso('Atualize o Hub para consultar os saldos.');
        return;
      }
      aviso('');
      atualizar.disabled = true;
      atualizar.textContent = 'Consultando…';
      timeout = setTimeout(() => {
        atualizar.disabled = false;
        atualizar.textContent = 'Atualizar saldos';
        aviso('A consulta demorou. Tente atualizar novamente.');
      }, 12_000);
      window.location.assign('ipmapp://transferencia-rapida/saldos');
    }
    window.addEventListener('kjd-transferencia-saldos', ({ detail }) => {
      clearTimeout(timeout);
      atualizar.disabled = false;
      atualizar.textContent = 'Atualizar saldos';
      const lista = Array.isArray(detail?.contas) ? detail.contas : [];
      preencheContas(lista);
      aviso(detail?.erro || (lista.length < 2 ? 'Conecte duas contas no Hub e atualize os saldos.' : ''));
    });
    botaoDock.addEventListener('click', () => {
      if (!pane.hidden) consultaSaldos();
    });
    atualizar.onclick = consultaSaldos;
    pane.querySelector('.fechar').onclick = () => {
      pane.hidden = true;
      dock?.sync?.();
    };
    pane.querySelector('.minimizar').onclick = (evento) => {
      const recolhido = pane.classList.toggle('moon-collapsed');
      const botao = evento.currentTarget;
      botao.textContent = recolhido ? '+' : '−';
      botao.title = recolhido ? 'Expandir painel' : 'Recolher painel';
      botao.setAttribute('aria-label', botao.title);
      botao.setAttribute('aria-expanded', String(!recolhido));
    };
    for (const papel of papeis) {
      seletores[papel].onchange = () => {
        const outro = seletores[papel === 'origem' ? 'destino' : 'origem'];
        if (outro.value === seletores[papel].value) outro.value = '';
        renderizaSaldos();
      };
    }
    inverter.onclick = () => {
      const { origem, destino } = seletores;
      [origem.value, destino.value] = [destino.value, origem.value];
      renderizaSaldos();
    };
    enviar.onclick = (evento) => {
      if (!evento.isTrusted || enviar.disabled || document.documentElement.dataset.idlemoonTransferenciaRapida !== '3') return;
      const { origem, destino } = seletores;
      window.location.assign('ipmapp://transferencia-rapida/enviar/' + origem.value + '/' + destino.value);
    };
    return true;
  }

  if (monta()) return;
  const timer = setInterval(() => {
    if (monta()) clearInterval(timer);
  }, 250);
  setTimeout(() => { clearInterval(timer); if (!document.getElementById('kjd-transferencia-rapida')) monta(true); }, 3000);
})();
