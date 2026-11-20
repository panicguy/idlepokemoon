// ==UserScript==
// @name         Poke Moon - Transferência Rápida
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.1.0
// @description  Revisa o envio de dinheiro, Chaves de Boss e Genes Raros de Dudis ou Duzitow para KimJongDudu pelo dock.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/panicguy/idlepokemoon
// ==/UserScript==

(() => {
  'use strict';

  const id = 'transferencia-rapida';
  const titulo = 'Transferência Rápida';
  if (window.top !== window || window.__kjdTransferenciaRapida) return;
  window.__kjdTransferenciaRapida = true;

  function monta() {
    const dock = window.__kjdMoonDockV2;
    if (typeof dock?.register !== 'function') return false;

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
        <div class="moon-state">Destino <strong>KimJongDudu</strong></div>
        <button type="button" class="moon-go" data-origem="dudis">Transferir de Dudis</button>
        <button type="button" class="moon-go" data-origem="duzitow">Transferir de Duzitow</button>
        <p class="moon-note">Todo o dinheiro, Chaves de Boss livres e Genes Raros transferíveis.</p>
        <p class="moon-state erro" role="status" hidden></p>
      </div>`;
    const estilo = document.createElement('style');
    estilo.textContent = `
      #kjd-transferencia-rapida{position:fixed;top:145px;right:28px;z-index:99000;width:min(292px,calc(100vw - 16px));box-sizing:border-box;overflow:hidden;background:linear-gradient(145deg,#182238,#101724 55%,#0b111e);border:1px solid #816e43;border-radius:10px;color:#e8edf6;font:12px/1.35 system-ui,"Segoe UI",sans-serif;box-shadow:0 2px 0 #3a3223 inset,0 12px 38px #000b}
      #kjd-transferencia-rapida [hidden],#kjd-transferencia-rapida[hidden],#kjd-transferencia-rapida.moon-collapsed .moon-body{display:none!important}
      #kjd-transferencia-rapida .moon-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(#303342,#222838);border-bottom:1px solid #685936;cursor:move;user-select:none;touch-action:none}
      #kjd-transferencia-rapida .moon-title{font-weight:850;color:#f4e4b8;flex:1}
      #kjd-transferencia-rapida button{box-sizing:border-box;font:inherit;font-weight:750;cursor:pointer}
      #kjd-transferencia-rapida .moon-head button{padding:0;width:23px;height:23px;border:1px solid #4d556b;border-radius:5px;color:#e8edf6;background:#111827;font-size:16px}
      #kjd-transferencia-rapida .moon-body{padding:11px}
      #kjd-transferencia-rapida .moon-state{display:flex;justify-content:space-between;gap:8px;padding:7px 9px;border:1px solid #31445c;border-radius:7px;background:#101c2a;color:#aebdd1;font-size:11px}
      #kjd-transferencia-rapida .moon-state strong{color:#f4e4b8}
      #kjd-transferencia-rapida .moon-go{width:100%;margin-top:9px;padding:10px 8px;border:1px solid #59ad7c;border-radius:7px;background:linear-gradient(#3a785b,#20593c);color:#eafff1}
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

    dock.register(id, titulo, icone, pane);
    dock.drag?.(pane, pane.querySelector('.moon-head'), { storageKey: 'kjd-transferencia-rapida-posicao' });
    pane.querySelector('.fechar').onclick = () => {
      pane.hidden = true;
      dock.sync?.();
    };
    pane.querySelector('.minimizar').onclick = (evento) => {
      const recolhido = pane.classList.toggle('moon-collapsed');
      const botao = evento.currentTarget;
      botao.textContent = recolhido ? '+' : '−';
      botao.title = recolhido ? 'Expandir painel' : 'Recolher painel';
      botao.setAttribute('aria-label', botao.title);
      botao.setAttribute('aria-expanded', String(!recolhido));
    };
    for (const botao of pane.querySelectorAll('[data-origem]')) {
      botao.onclick = (evento) => {
        if (!evento.isTrusted) return;
        const erro = pane.querySelector('.erro');
        if (document.documentElement.dataset.idlemoonTransferenciaRapida !== '2') {
          erro.textContent = 'Atualize o Hub para usar este painel de transferência.';
          erro.hidden = false;
          return;
        }
        erro.hidden = true;
        window.location.assign('ipmapp://transferencia-rapida/' + botao.dataset.origem);
      };
    }
    return true;
  }

  if (monta()) return;
  const timer = setInterval(() => {
    if (monta()) clearInterval(timer);
  }, 250);
  setTimeout(() => clearInterval(timer), 30_000);
})();
