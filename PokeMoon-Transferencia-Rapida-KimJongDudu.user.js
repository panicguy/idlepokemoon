// ==UserScript==
// @name         Poke Moon - Transferência Rápida
// @namespace    https://github.com/panicguy/idlepokemoon
// @version      1.0.0
// @description  Abre a revisão do envio de dinheiro, Chaves de Boss e Genes Raros de Dudis para KimJongDudu pelo dock.
// @match        https://idlepokemoon.com.br/play*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/panicguy/idlepokemoon
// ==/UserScript==

(() => {
  'use strict';

  const id = 'transferencia-rapida';
  const titulo = 'Transferir de Dudis para KimJongDudu';
  if (window.top !== window || window.__kjdTransferenciaRapida) return;
  window.__kjdTransferenciaRapida = true;

  function monta() {
    const dock = window.__kjdMoonDockV2;
    if (typeof dock?.register !== 'function') return false;

    const pane = document.createElement('div');
    pane.id = 'kjd-transferencia-rapida';
    pane.hidden = true;
    document.body.append(pane);

    const icone = document.createElement('canvas');
    icone.width = icone.height = 48;
    icone.setAttribute('aria-hidden', 'true');
    const ctx = icone.getContext('2d');
    ctx.font = '36px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔁', 24, 25);

    const botao = dock.register(id, titulo, icone, pane);
    botao.removeAttribute('aria-controls');
    botao.onclick = (evento) => {
      if (!evento.isTrusted) return;
      if (document.documentElement.dataset.idlemoonTransferenciaRapida !== '1') {
        window.alert('Este atalho precisa de uma versão do Hub com suporte a Transferência Rápida.');
        return;
      }
      window.location.assign('ipmapp://transferencia-rapida');
    };
    return true;
  }

  if (monta()) return;
  const timer = setInterval(() => {
    if (monta()) clearInterval(timer);
  }, 250);
  setTimeout(() => clearInterval(timer), 30_000);
})();
