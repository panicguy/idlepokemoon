'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
function criaTransferenciaRapida({ mostraJanela, dados, validaPedido, randomUUID, indisponivel }) {
  const nomes = new Set(['chave de boss', 'gene raro']);
  const normaliza = (nome) => String(nome || '').trim().toLowerCase();
  const fmt = (n) => Number(n).toLocaleString('pt-BR');
  let ocupado = false;
  const pendentes = new Map();

  async function contas(de, para) {
    const r = await dados.responde({ tipo: 'contas' });
    const lista = Array.isArray(r.dados) ? r.dados : [];
    return [de, para].map((slot) => {
      const conta = lista[slot];
      if (!conta?.conectada || !conta.contaId || !conta.nick) {
        throw new Error('Conecte as contas selecionadas no Hub e atualize os saldos.');
      }
      return { slot, id: conta.contaId, nome: conta.nick };
    });
  }

  return async function transferirRapido(de, para) {
    if (![de, para].every((slot) => Number.isInteger(slot) && slot >= 0 && slot <= 2) ||
        de === para || ocupado || indisponivel()) return;
    ocupado = true;
    let mensagem, origem, destino, chave;
    try {
      const par = await contas(de, para);
      [origem, destino] = par.map((c) => c.nome);
      if (par[0].id === par[1].id) throw new Error('As contas de origem e destino precisam ser diferentes.');
      const assinatura = JSON.stringify(par);
      chave = JSON.stringify(par.map((c) => c.id));
      const incerto = pendentes.get(chave);
      const repetindo = Boolean(incerto);
      let pedido = incerto?.pedido;
      let resumo = incerto?.resumo;
      if (incerto && incerto.assinatura !== assinatura) {
        throw new Error('Reconecte as mesmas contas nos mesmos espaços para verificar o envio anterior.');
      }
      if (!pedido) {
        const r = await dados.responde({ tipo: 'bolsa' });
        const bolsa = r.dados?.contas?.find((c) => c.slot === de);
        if (!r.ok || !bolsa || !Array.isArray(bolsa.itens)) {
          throw new Error(r.erro || 'A bolsa de ' + origem + ' não respondeu.');
        }
        const itens = [];
        const linhas = [];
        function inclui(item, rotulo) {
          if (!item.qtd) return;
          itens.push(item);
          linhas.push(rotulo);
        }
        const gold = bolsa.gold;
        inclui({ tipo: 'gold', qtd: gold }, '$ ' + fmt(gold));
        for (const item of bolsa.itens) {
          if (!item.transferivel || !nomes.has(normaliza(item.nome))) continue;
          const pilhas = Array.isArray(item.pilhas) ? item.pilhas.filter((p) => p.qtd > 0) : [];
          for (const p of pilhas) {
            inclui({ tipo: item.tipo, chave: item.chave, tier: p.tier, qtd: p.qtd }, fmt(p.qtd) + ' × ' + item.nome + ' · ' + (p.rot || 'T' + p.tier));
          }
          if (!pilhas.length) {
            const qtd = item.livre ?? item.qtd;
            inclui({ tipo: item.tipo, chave: item.chave, qtd }, fmt(qtd) + ' × ' + item.nome);
          }
        }
        if (!itens.length) throw new Error(origem + ' não tem saldo nem itens livres para este envio.');
        pedido = validaPedido({ tipo: 'transferir', de, para, idem: randomUUID(), itens });
        if (!pedido) throw new Error('O aplicativo recusou as quantidades ou os itens da bolsa.');
        if (gold > 0) {
          const catalogo = await dados.responde({ tipo: 'catalogo' });
          const taxa = catalogo.dados?.taxa?.gold;
          if (taxa) {
            const valor = Math.max(taxa.minimaTaxa || 1, Math.ceil(gold * (taxa.pct / 100)));
            linhas.push('Taxa de $ ' + fmt(valor) + ' · chega $ ' + fmt(Math.max(0, gold - valor)));
          } else if (!catalogo.ok) {
            linhas.push('A taxa do dinheiro será calculada pelo servidor.');
          }
        }
        resumo = linhas.join('\n');
      }
      const confirmado = await mostraJanela({
        origem,
        destino,
        confirmar: true,
        detail: incerto ? 'O resultado do envio anterior ficou pendente. Reenvie o mesmo pedido para evitar duplicação.\n\n' + resumo : resumo,
      });
      if (!confirmado) return;
      if (indisponivel() || JSON.stringify(await contas(de, para)) !== assinatura || indisponivel()) {
        throw new Error('O app ou as contas mudaram. Confira a conexão e tente novamente.');
      }
      pendentes.set(chave, { assinatura, pedido, resumo });
      const r = await dados.responde(pedido);
      if (r.ok) {
        pendentes.delete(chave);
        const recibo = r.dados?.transferencia;
        const linhas = (recibo?.itens || []).map((i) => fmt(i.qtd) + ' × ' + (i.nome || i.chave));
        if (recibo?.gold) linhas.unshift('$ ' + fmt(recibo.recebidoGold ?? recibo.gold));
        mensagem = [r.dados?.repetida ? 'Envio já registrado.' : 'Transferência concluída.', ...linhas].join('\n');
      } else if (r.status > 0 && r.status < 500) {
        if (!repetindo) pendentes.delete(chave);
        mensagem = r.erro || 'O servidor recusou o envio.';
        if (repetindo) mensagem += '\nConfira o histórico para verificar o resultado do primeiro envio.';
      } else {
        mensagem = 'O servidor não confirmou o resultado.\nClique no atalho para tentar novamente com o mesmo pedido.';
      }
    } catch (erro) {
      mensagem = erro.message || 'Não foi possível preparar a transferência.';
      if (pendentes.has(chave)) mensagem += '\nClique no atalho para consultar o mesmo envio ou confira o histórico.';
    } finally {
      try {
        if (mensagem && !indisponivel()) await mostraJanela({ origem, destino, detail: mensagem });
      } finally {
        ocupado = false;
      }
    }
  };
}

function mostraJanelaTransferencia({ BrowserWindow, owner, origem, destino, detail = '', confirmar = false }) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const area = owner.getContentBounds();
  const width = Math.min(430, area.width);
  const caracteresPorLinha = Math.max(1, Math.floor((width - 44) / 7));
  const linhas = detail.split('\n').reduce((n, linha) => n + Math.max(1, Math.ceil(linha.length / caracteresPorLinha)), 0);
  const height = Math.min(area.height, 160 + 20 * linhas);
  const titulo = confirmar ? 'Confirmar' : 'Transferência Rápida';
  const modal = new BrowserWindow({
    parent: owner, modal: true, show: false,
    x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2),
    width, height, frame: false, transparent: true, resizable: false, skipTaskbar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
  <title>${titulo}</title>
  <style>
    *{box-sizing:border-box}
    html,body{height:100%;margin:0}
    body{font:13px "Segoe UI",system-ui,sans-serif;color:#cbd5e1}
    main{height:100%;display:flex;flex-direction:column;border:1px solid #aa353b;border-radius:12px;overflow:hidden;background:#0c1117}
    h1{margin:0;padding:12px 16px;font:700 14px/19px "Segoe UI",sans-serif;color:#ffa0a4;background:linear-gradient(#1e0e10,#101319);border-bottom:1px solid #313949}
    section{flex:1;min-height:0;padding:13px 16px;overflow:auto;line-height:20px}
    strong{display:block;margin-bottom:4px;color:#e8edf4}
    p{white-space:pre-wrap;margin:0}
    footer{padding:12px 16px 14px;border-top:1px solid #1c242e;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    footer.aviso{grid-template-columns:1fr}
    a{border:1px solid #3b4c60;border-radius:8px;background:#151b23;color:#aebdcd;text-decoration:none;text-align:center;font-weight:700;line-height:35px}
    a:hover,a:focus-visible{filter:brightness(1.25);outline:1px solid #93a3b8;outline-offset:1px}
    a.confirmar{color:#ffa0a4;border-color:#af353b;background:linear-gradient(#3a1719,#261116)}
  </style>
  <main aria-labelledby="titulo"><h1 id="titulo">${titulo}</h1>
  <section><strong>${origem && destino ? esc(origem) + ' → ' + esc(destino) : 'Contas selecionadas'}</strong><p>${esc(detail)}</p></section>
  ${confirmar
    ? '<footer><a href="https://transferencia.invalid/cancelar">Cancelar</a><a class="confirmar" href="https://transferencia.invalid/confirmar">Confirmar</a></footer>'
    : '<footer class="aviso"><a class="confirmar" href="https://transferencia.invalid/cancelar">OK</a></footer>'}
  </main></html>`;
  return new Promise((resolve) => {
    let confirmado = false;
    modal.once('closed', () => resolve(confirmado));
    modal.webContents.on('will-navigate', (e, url) => {
      e.preventDefault();
      const alvo = e.url || url;
      if (!['https://transferencia.invalid/confirmar', 'https://transferencia.invalid/cancelar'].includes(alvo)) return;
      confirmado = confirmar && alvo.endsWith('/confirmar');
      modal.close();
    });
    modal.webContents.on('before-input-event', (e, tecla) => {
      if (tecla.type === 'keyDown' && tecla.key === 'Escape') {
        e.preventDefault();
        modal.close();
      }
    });
    modal.once('ready-to-show', () => modal.show());
    modal.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html)).catch(() => {
      if (!modal.isDestroyed()) modal.close();
    });
  });
}
function criaLeitorSaldos(dados) {
  let cache;
  let pendente;

  async function consulta() {
    const contas = await dados.responde({ tipo: 'contas' });
    if (!contas.ok || !Array.isArray(contas.dados)) throw new Error('Contas indisponíveis.');
    const ids = new Set();
    const slots = contas.dados.flatMap((conta, slot) => {
      if (!conta?.conectada || !conta.contaId || !conta.nick || ids.has(conta.contaId)) return [];
      ids.add(conta.contaId);
      return [{ slot, id: conta.contaId, nome: conta.nick }];
    });
    if (!slots.length) return [];
    const bolsa = await dados.responde({ tipo: 'bolsa' });
    if (!bolsa.ok || !Array.isArray(bolsa.dados?.contas)) throw new Error('Bolsa indisponível.');
    const atuais = await dados.responde({ tipo: 'contas' });
    if (!atuais.ok || !Array.isArray(atuais.dados)) throw new Error('Contas indisponíveis.');
    const numero = (n) => Number.isSafeInteger(n) && n >= 0 ? n : 0;
    return slots.flatMap(({ slot, id, nome }) => {
      if (atuais.dados[slot]?.contaId !== id || !atuais.dados[slot]?.conectada) return [];
      const recursos = bolsa.dados.contas.find((c) => c.slot === slot);
      if (!recursos || !Array.isArray(recursos.itens)) return [{ slot, nome, estado: 'indisponivel' }];
      function somaItem(nomeItem) {
        const total = { livres: 0, presos: 0 };
        for (const item of recursos.itens) {
          if (String(item.nome).trim().toLowerCase() !== nomeItem) continue;
          const pilhas = Array.isArray(item.pilhas) ? item.pilhas.filter((p) => p.qtd > 0) : [];
          if (item.transferivel) total.livres += pilhas.length
            ? pilhas.reduce((n, p) => n + numero(p.qtd), 0)
            : numero(item.livre ?? item.qtd);
          total.presos += numero(item.preso ?? (item.transferivel ? 0 : item.qtd));
        }
        return total;
      }
      return [{
        slot,
        nome,
        estado: 'ok',
        dinheiro: numero(recursos.gold),
        chaves: somaItem('chave de boss'),
        genes: somaItem('gene raro'),
        diamantes: numero(recursos.diamantes),
      }];
    });
  }

  return function leSaldos(forcar = false) {
    if (pendente) return pendente;
    if (!forcar && cache && Date.now() - cache.em < 3000) return Promise.resolve(cache.saldos);
    pendente = consulta().then((saldos) => {
      cache = { saldos, em: Date.now() };
      return saldos;
    }).finally(() => { pendente = null; });
    return pendente;
  };
}

const argumentoHub = process.argv.find((arg) => arg.startsWith('--hub='));
const root = argumentoHub ? path.resolve(argumentoHub.slice(6)) : process.cwd();
const userscript = "// ==UserScript==\r\n// @name         Poke Moon - Transferência Rápida\r\n// @namespace    https://github.com/panicguy/idlepokemoon\r\n// @version      1.3.0\r\n// @description  Mostra os saldos e permite escolher a origem e o destino do envio no Hub.\r\n// @match        https://idlepokemoon.com.br/play*\r\n// @run-at       document-idle\r\n// @grant        none\r\n// @homepageURL  https://github.com/panicguy/idlepokemoon\r\n// ==/UserScript==\r\n\r\n(() => {\r\n  'use strict';\r\n\r\n  const id = 'transferencia-rapida';\r\n  const titulo = 'Transferência Rápida';\r\n  const papeis = ['origem', 'destino'];\r\n  const fmt = new Intl.NumberFormat('pt-BR');\r\n  if (window.top !== window || window.__kjdTransferenciaRapida) return;\r\n  window.__kjdTransferenciaRapida = true;\r\n\r\n  function monta(avulso = false) {\r\n    const dock = window.__kjdMoonDockV2;\r\n    if (!avulso && typeof dock?.register !== 'function') return false;\r\n\r\n    const pane = document.createElement('section');\r\n    pane.id = 'kjd-transferencia-rapida';\r\n    pane.className = 'moon-panel';\r\n    pane.hidden = true;\r\n    pane.setAttribute('aria-label', titulo);\r\n    pane.innerHTML = `\r\n      <header class=\"moon-head\">\r\n        <span aria-hidden=\"true\">🔁</span><strong class=\"moon-title\">Transferência Rápida</strong>\r\n        <button type=\"button\" class=\"minimizar\" title=\"Recolher painel\" aria-label=\"Recolher painel\" aria-expanded=\"true\">−</button>\r\n        <button type=\"button\" class=\"fechar\" aria-label=\"Fechar painel\">×</button>\r\n      </header>\r\n      <div class=\"moon-body\">\r\n        <div class=\"selecao\">\r\n          <label>Origem<select name=\"origem\" disabled><option value=\"\">Escolha a conta</option></select></label>\r\n          <button type=\"button\" class=\"inverter\" aria-label=\"Inverter origem e destino\" title=\"Inverter origem e destino\" disabled>⇄</button>\r\n          <label>Destino<select name=\"destino\" disabled><option value=\"\">Escolha a conta</option></select></label>\r\n        </div>\r\n        ${papeis.map((papel) => `\r\n          <section class=\"saldo\" data-papel=\"${papel}\" hidden>\r\n            <h3>Saldo da ${papel === 'origem' ? 'origem' : 'conta de destino'}<small data-estado></small></h3>\r\n            <dl>\r\n              <div><dt>Dinheiro</dt><dd data-valor=\"dinheiro\">—</dd></div>\r\n              <div><dt>Diamantes</dt><dd data-valor=\"diamantes\">—</dd></div>\r\n              <div><dt>Chave de Boss</dt><dd data-valor=\"chaves\">—</dd></div>\r\n              <div><dt>Gene Raro</dt><dd data-valor=\"genes\">—</dd></div>\r\n            </dl>\r\n          </section>\r\n        `).join('')}\r\n        <button type=\"button\" class=\"moon-go\" disabled>Revisar transferência</button>\r\n        <button type=\"button\" class=\"atualizar\">Atualizar saldos</button>\r\n        <p class=\"moon-note\">Diamantes: troca manual pelo Social.</p>\r\n        <p class=\"moon-state erro\" role=\"status\" hidden></p>\r\n      </div>`;\r\n    const estilo = document.createElement('style');\r\n    estilo.textContent = `\r\n      #kjd-transferencia-rapida{position:fixed;top:145px;right:28px;z-index:99000;width:min(292px,calc(100vw - 16px));max-height:calc(100vh - 16px);box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:linear-gradient(145deg,#182238,#101724 55%,#0b111e);border:1px solid #816e43;border-radius:10px;color:#e8edf6;font:12px/1.35 system-ui,\"Segoe UI\",sans-serif;box-shadow:0 2px 0 #3a3223 inset,0 12px 38px #000b}\r\n      #kjd-transferencia-rapida [hidden],#kjd-transferencia-rapida[hidden],#kjd-transferencia-rapida.moon-collapsed .moon-body{display:none!important}\r\n      #kjd-transferencia-rapida .moon-head{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(#303342,#222838);border-bottom:1px solid #685936;cursor:move;user-select:none;touch-action:none}\r\n      #kjd-transferencia-rapida .moon-title{font-weight:850;color:#f4e4b8;flex:1}\r\n      #kjd-transferencia-rapida button{box-sizing:border-box;font:inherit;font-weight:750;cursor:pointer}\r\n      #kjd-transferencia-rapida .moon-head button{padding:0;width:23px;height:23px;border:1px solid #4d556b;border-radius:5px;color:#e8edf6;background:#111827;font-size:16px}\r\n      #kjd-transferencia-rapida .moon-body{padding:11px;min-height:0;overflow:auto;scrollbar-width:thin}\r\n      #kjd-transferencia-rapida .moon-state{display:flex;justify-content:space-between;gap:8px;padding:7px 9px;border:1px solid #31445c;border-radius:7px;background:#101c2a;color:#aebdd1;font-size:11px}\r\n      #kjd-transferencia-rapida .moon-state strong{color:#f4e4b8}\r\n      #kjd-transferencia-rapida .selecao{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:end}\r\n      #kjd-transferencia-rapida .selecao label{color:#aebdd1;font-size:11px}\r\n      #kjd-transferencia-rapida select,#kjd-transferencia-rapida .inverter{width:100%;min-width:0;margin-top:4px;padding:6px;border:1px solid #485b77;border-radius:6px;background:#101c2a;color:#e8edf6;font:inherit}\r\n      #kjd-transferencia-rapida button:disabled{opacity:.55;cursor:default}\r\n      #kjd-transferencia-avulsa{position:fixed;top:105px;right:8px;z-index:98999;padding:6px 8px;border:1px solid #816e43;border-radius:8px;background:#101724;color:#f4e4b8;cursor:pointer}\r\n      #kjd-transferencia-rapida .saldo{margin-top:9px;padding:8px;border:1px solid #303c50;border-radius:7px;background:#101a2b}\r\n      #kjd-transferencia-rapida .saldo h3{display:flex;justify-content:space-between;align-items:baseline;gap:6px;margin:0;color:#f4e4b8;font-size:12px}\r\n      #kjd-transferencia-rapida .saldo small{color:#aebdd1;font-weight:normal;text-align:right}\r\n      #kjd-transferencia-rapida dl{margin:6px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:5px}\r\n      #kjd-transferencia-rapida dl div{padding:5px 6px;border:1px solid #31445c;border-radius:5px;background:#0e1725;min-width:0}\r\n      #kjd-transferencia-rapida dt{font-size:10px;color:#aebdd1}\r\n      #kjd-transferencia-rapida dd{margin:1px 0 0;font-size:12px;font-weight:750;color:#f4e4b8;overflow-wrap:anywhere}\r\n      #kjd-transferencia-rapida .moon-go{width:100%;margin-top:9px;padding:10px 8px;border:1px solid #59ad7c;border-radius:7px;background:linear-gradient(#3a785b,#20593c);color:#eafff1}\r\n      #kjd-transferencia-rapida .atualizar{margin-top:9px;padding:6px 9px;border:1px solid #485b77;border-radius:6px;background:#101c2a;color:#e8edf6}\r\n      #kjd-transferencia-rapida .atualizar:disabled{opacity:.55;cursor:default}\r\n      #kjd-transferencia-rapida button:hover{filter:brightness(1.15)}\r\n      #kjd-transferencia-rapida .moon-note{margin:9px 0 0;color:#aebdd1;font-size:11px;line-height:1.5}\r\n      #kjd-transferencia-rapida .erro{color:#ffb0b2;border-color:#8b4349}\r\n      @media(max-width:500px){#kjd-transferencia-rapida{top:85px;right:8px}}\r\n    `;\r\n    document.head.append(estilo);\r\n    document.body.append(pane);\r\n\r\n    const icone = document.createElement('canvas');\r\n    icone.width = icone.height = 48;\r\n    icone.setAttribute('aria-hidden', 'true');\r\n    const ctx = icone.getContext('2d');\r\n    ctx.font = '36px \"Segoe UI Emoji\", sans-serif';\r\n    ctx.textAlign = 'center';\r\n    ctx.textBaseline = 'middle';\r\n    ctx.fillText('🔁', 24, 25);\r\n\r\n    const botaoDock = dock?.register?.(id, titulo, icone, pane) || document.createElement('button');\r\n    if (!botaoDock.isConnected && typeof dock?.register !== 'function') {\r\n      botaoDock.id = 'kjd-transferencia-avulsa';\r\n      botaoDock.type = 'button';\r\n      botaoDock.textContent = '🔁';\r\n      botaoDock.title = titulo;\r\n      botaoDock.setAttribute('aria-label', titulo);\r\n      botaoDock.onclick = () => { pane.hidden = !pane.hidden; };\r\n      document.body.append(botaoDock);\r\n    }\r\n    dock?.drag?.(pane, pane.querySelector('.moon-head'), { storageKey: 'kjd-transferencia-rapida-posicao' });\r\n    const seletores = Object.fromEntries(papeis.map((papel) => [papel, pane.querySelector('select[name=\"' + papel + '\"]')]));\r\n    const inverter = pane.querySelector('.inverter');\r\n    const enviar = pane.querySelector('.moon-go');\r\n    let contas = [];\r\n    const erro = pane.querySelector('.erro');\r\n    const atualizar = pane.querySelector('.atualizar');\r\n    let timeout;\r\n    const aviso = (mensagem) => {\r\n      erro.textContent = mensagem;\r\n      erro.hidden = !mensagem;\r\n    };\r\n    const formataItens = ({ livres, presos }) => presos\r\n      ? fmt.format(livres) + ' livres · ' + fmt.format(presos) + ' presos'\r\n      : fmt.format(livres);\r\n    function preencheContas(novas) {\r\n      const antigas = contas;\r\n      contas = novas.filter((c) => Number.isInteger(c?.slot) && typeof c.nome === 'string');\r\n      for (const seletor of Object.values(seletores)) {\r\n        const anterior = antigas.find((c) => String(c.slot) === seletor.value);\r\n        seletor.replaceChildren(new Option('Escolha a conta', ''), ...contas.map((c) => new Option(c.nome, String(c.slot))));\r\n        seletor.disabled = contas.length === 0;\r\n        if (anterior && contas.some((c) => c.slot === anterior.slot && c.nome === anterior.nome)) seletor.value = String(anterior.slot);\r\n      }\r\n      renderizaSaldos();\r\n    }\r\n    function renderizaSaldos() {\r\n      const { origem, destino } = seletores;\r\n      const parValido = Boolean(origem.value && destino.value && origem.value !== destino.value);\r\n      inverter.disabled = !parValido;\r\n      enviar.disabled = !parValido;\r\n      for (const card of pane.querySelectorAll('[data-papel]')) {\r\n        const conta = contas.find((c) => String(c.slot) === seletores[card.dataset.papel].value);\r\n        card.hidden = !conta;\r\n        card.querySelector('[data-estado]').textContent = conta?.estado === 'ok' ? '' : 'Indisponível';\r\n        const valores = conta?.estado === 'ok' ? {\r\n          dinheiro: '$ ' + fmt.format(conta.dinheiro),\r\n          diamantes: fmt.format(conta.diamantes),\r\n          chaves: formataItens(conta.chaves),\r\n          genes: formataItens(conta.genes),\r\n        } : {};\r\n        for (const campo of card.querySelectorAll('[data-valor]')) campo.textContent = valores[campo.dataset.valor] ?? '—';\r\n      }\r\n      if (!pane.hidden) dock?.clamp?.(pane);\r\n    }\r\n    function consultaSaldos() {\r\n      if (atualizar.disabled) return;\r\n      if (document.documentElement.dataset.idlemoonTransferenciaRapida !== '3') {\r\n        aviso('Atualize o Hub para consultar os saldos.');\r\n        return;\r\n      }\r\n      aviso('');\r\n      atualizar.disabled = true;\r\n      atualizar.textContent = 'Consultando…';\r\n      timeout = setTimeout(() => {\r\n        atualizar.disabled = false;\r\n        atualizar.textContent = 'Atualizar saldos';\r\n        aviso('A consulta demorou. Tente atualizar novamente.');\r\n      }, 12_000);\r\n      window.location.assign('ipmapp://transferencia-rapida/saldos');\r\n    }\r\n    window.addEventListener('kjd-transferencia-saldos', ({ detail }) => {\r\n      clearTimeout(timeout);\r\n      atualizar.disabled = false;\r\n      atualizar.textContent = 'Atualizar saldos';\r\n      const lista = Array.isArray(detail?.contas) ? detail.contas : [];\r\n      preencheContas(lista);\r\n      aviso(detail?.erro || (lista.length < 2 ? 'Conecte duas contas no Hub e atualize os saldos.' : ''));\r\n    });\r\n    botaoDock.addEventListener('click', () => {\r\n      if (!pane.hidden) consultaSaldos();\r\n    });\r\n    atualizar.onclick = consultaSaldos;\r\n    pane.querySelector('.fechar').onclick = () => {\r\n      pane.hidden = true;\r\n      dock?.sync?.();\r\n    };\r\n    pane.querySelector('.minimizar').onclick = (evento) => {\r\n      const recolhido = pane.classList.toggle('moon-collapsed');\r\n      const botao = evento.currentTarget;\r\n      botao.textContent = recolhido ? '+' : '−';\r\n      botao.title = recolhido ? 'Expandir painel' : 'Recolher painel';\r\n      botao.setAttribute('aria-label', botao.title);\r\n      botao.setAttribute('aria-expanded', String(!recolhido));\r\n    };\r\n    for (const papel of papeis) {\r\n      seletores[papel].onchange = () => {\r\n        const outro = seletores[papel === 'origem' ? 'destino' : 'origem'];\r\n        if (outro.value === seletores[papel].value) outro.value = '';\r\n        renderizaSaldos();\r\n      };\r\n    }\r\n    inverter.onclick = () => {\r\n      const { origem, destino } = seletores;\r\n      [origem.value, destino.value] = [destino.value, origem.value];\r\n      renderizaSaldos();\r\n    };\r\n    enviar.onclick = (evento) => {\r\n      if (!evento.isTrusted || enviar.disabled || document.documentElement.dataset.idlemoonTransferenciaRapida !== '3') return;\r\n      const { origem, destino } = seletores;\r\n      window.location.assign('ipmapp://transferencia-rapida/enviar/' + origem.value + '/' + destino.value);\r\n    };\r\n    return true;\r\n  }\r\n\r\n  if (monta()) return;\r\n  const timer = setInterval(() => {\r\n    if (monta()) clearInterval(timer);\r\n  }, 250);\r\n  setTimeout(() => { clearInterval(timer); if (!document.getElementById('kjd-transferencia-rapida')) monta(true); }, 3000);\r\n})();\r\n";
const arquivo = path.join(root, 'resources', 'app.asar');
const executavel = path.join(root, 'Idle Poke Moon.exe');
const original = fs.readFileSync(arquivo);
const exe = fs.readFileSync(executavel);
const jsonOriginal = original.subarray(16, 16 + original.readUInt32LE(12));
const arvore = JSON.parse(jsonOriginal);
const inicio = 8 + original.readUInt32LE(4);
const alteracoes = new Map();
const hash = (dados) => createHash('sha256').update(dados).digest('hex');
const conteudo = (entrada) => original.subarray(inicio + Number(entrada.offset), inicio + Number(entrada.offset) + entrada.size);

function le(nome) {
  const entrada = nome.split('/').reduce((no, parte) => no.files[parte], arvore);
  return (alteracoes.get(nome) || conteudo(entrada)).toString('utf8');
}

function altera(nome, antes, depois) {
  const fonte = le(nome);
  const pos = fonte.indexOf(antes);
  if (pos < 0 || fonte.indexOf(antes, pos + antes.length) >= 0) {
    throw new Error('Trecho inesperado em ' + nome);
  }
  alteracoes.set(nome, Buffer.from(fonte.replace(antes, () => depois)));
}

const janela = 'src/main/janela.js';
const registro = "  ipcMain.handle('dados', aoDados);";
const injeta = '    contas.push(v);';
const originalJanela = le(janela);
if (originalJanela.includes("idlemoonTransferenciaRapida = '3'")) {
  console.log('A transferência rápida já está atualizada.');
  process.exit(0);
}
const temAutomacoes = originalJanela.includes("ipcMain.handle('automacoes'");
if (originalJanela.includes('async function pedeTransferenciaDoDock')) {
  const base = originalJanela
    .replace(/, dialog(?=, BrowserWindow }| })|, BrowserWindow(?= })/g, '')
    .replace(/\n  const transferirRapido = [\s\S]*?\n  }(?=\n  ipcMain\.handle\('automacoes')/, '')
    .replace(/      if \(alvo[^\n]*ipmapp:\/\/transferencia-rapida[\s\S]*?(?=      const pl = lePayload)/, '')
    .replace(/\n    v.webContents.on\('dom-ready', \(\) => \{\n      const url = new URL\(v.webContents.getURL\(\)\);[\s\S]*?idlemoonTransferenciaRapida[^\n]*\n    }\);/, '');
  if (/pedeTransferenciaDoDock|idlemoonTransferenciaRapida|ipmapp:\/\/transferencia-rapida/.test(base)) {
    throw new Error('A versão anterior da ponte não pôde ser identificada.');
  }
  alteracoes.set(janela, Buffer.from(base));
}
altera(janela, 'ipcMain, screen, session }', 'ipcMain, screen, session, BrowserWindow }');
altera(janela, registro, registro + `
  const transferirRapido = (${criaTransferenciaRapida.toString()})({
    mostraJanela: (texto) => (${mostraJanelaTransferencia.toString()})({ BrowserWindow, owner: win, ...texto }),
    dados,
    validaPedido,
    randomUUID: require('node:crypto').randomUUID,
    indisponivel: () => bloqueado || !dados || win.isDestroyed(),
  });
  const leSaldosTransferencia = (${criaLeitorSaldos.toString()})(dados);

  async function pedeTransferenciaDoDock(wc, slot, par) {
    const ehJogoAtual = () => {
      if (win.isDestroyed() || wc.isDestroyed() || contas[slot]?.webContents !== wc || bloqueado) return false;
      const origem = new URL(wc.getURL());
      return origem.origin === origemJogo && origem.pathname === '/play';
    };
    if (!ehJogoAtual()) return;
${temAutomacoes ? `    const { scripts } = await automacoes.request({ type: 'list' });
    const url = 'https://raw.githubusercontent.com/panicguy/idlepokemoon/main/PokeMoon-Transferencia-Rapida-KimJongDudu.user.js';
    if (!ehJogoAtual() || !scripts?.some((script) => script.url === url && script.enabled && script.accounts.includes(slot))) return;
` : ''}    if (par) await transferirRapido(...par);
    if (!ehJogoAtual()) return;
    let resultado;
    try { resultado = { contas: await leSaldosTransferencia(Boolean(par)) }; }
    catch (_) { resultado = { erro: 'Não foi possível consultar os saldos agora.' }; }
    if (!ehJogoAtual()) return;
    await wc.executeJavaScript("window.dispatchEvent(new CustomEvent('kjd-transferencia-saldos',{detail:" +
      JSON.stringify(resultado) + "}))", false);
  }`);
const navega = '      const pl = lePayload(alvo);';
altera(janela, navega, `      if (alvo.startsWith('ipmapp://transferencia-rapida/')) {
        const caminho = alvo.slice('ipmapp://transferencia-rapida/'.length);
        const par = /^enviar\\/([0-2])\\/([0-2])$/.exec(caminho);
        if (caminho === 'saldos' || (par && par[1] !== par[2])) {
          pedeTransferenciaDoDock(v.webContents, n, par ? [Number(par[1]), Number(par[2])] : null).catch(() => {});
        }
        return;
      }
` + navega);
altera(janela, injeta, `
    v.webContents.on('dom-ready', () => {
      const url = new URL(v.webContents.getURL());
      if (url.origin !== origemJogo || url.pathname !== '/play') return;
      v.webContents.executeJavaScript(${JSON.stringify(
        "document.documentElement.dataset.idlemoonTransferenciaRapida = '3';\n" + (temAutomacoes ? '' : userscript),
      )}, false).catch(() => {});
    });
` + injeta);

for (const [nome, fonte] of alteracoes) {
  if (nome.endsWith('.js')) new vm.Script(fonte.toString(), { filename: nome });
}

const blocos = [];
let offset = 0;
function empacota(entradas, prefixo = '') {
  for (const [nome, entrada] of Object.entries(entradas)) {
    const id = prefixo + nome;
    if (entrada.files) {
      empacota(entrada.files, id + '/');
      continue;
    }
    if (entrada.unpacked || entrada.link) continue;
    const alterado = alteracoes.get(id);
    const bytes = alterado || conteudo(entrada);
    entrada.offset = String(offset);
    if (alterado) {
      const blockSize = 4 * 1024 * 1024;
      const blocks = [];
      for (let i = 0; i < bytes.length; i += blockSize) blocks.push(hash(bytes.subarray(i, i + blockSize)));
      entrada.size = bytes.length;
      entrada.integrity = { algorithm: 'SHA256', hash: hash(bytes), blockSize, blocks };
    }
    blocos.push(bytes);
    offset += bytes.length;
  }
}
empacota(arvore.files);

const json = Buffer.from(JSON.stringify(arvore));
const tamanho = Math.ceil((json.length + 4) / 4) * 4;
const cabecalho = Buffer.alloc(12 + tamanho);
cabecalho.writeUInt32LE(4, 0);
cabecalho.writeUInt32LE(tamanho + 4, 4);
cabecalho.writeUInt32LE(tamanho, 8);
cabecalho.writeUInt32LE(json.length, 12);
json.copy(cabecalho, 16);
const pacote = Buffer.concat([cabecalho, ...blocos]);
const hashAnterior = Buffer.from(hash(jsonOriginal));
const indice = exe.indexOf(hashAnterior);
if (indice < 0 || exe.indexOf(hashAnterior, indice + 1) >= 0) throw new Error('Referência ASAR do executável inesperada.');
Buffer.from(hash(json)).copy(exe, indice);

if (process.argv.includes('--apply')) {
  const lista = execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    "Get-Process | Where-Object ProcessName -eq 'Idle Poke Moon' | Select-Object -ExpandProperty Id",
  ], { encoding: 'utf8' });
  if (lista.trim()) throw new Error('Feche o app antes de instalar.');
  const backup = fs.mkdtempSync(path.join(root, 'backup-transferencia-rapida-'));
  const copiaAsar = path.join(backup, path.basename(arquivo));
  const copiaExe = path.join(backup, path.basename(executavel));
  fs.copyFileSync(arquivo, copiaAsar);
  fs.copyFileSync(executavel, copiaExe);
  const descritor = fs.openSync(executavel, 'r+');
  let trocouExe = false;
  try {
    trocouExe = true;
    const trecho = exe.subarray(indice, indice + hashAnterior.length);
    if (fs.writeSync(descritor, trecho, 0, trecho.length, indice) !== trecho.length) throw new Error('Escrita incompleta do executável.');
    fs.fsyncSync(descritor);
    fs.writeFileSync(arquivo, pacote);
    if (!fs.readFileSync(arquivo).equals(pacote) || !fs.readFileSync(executavel).equals(exe)) {
      throw new Error('Falha ao verificar a instalação.');
    }
  } catch (erro) {
    fs.copyFileSync(copiaAsar, arquivo);
    if (trocouExe) {
      fs.writeSync(descritor, hashAnterior, 0, hashAnterior.length, indice);
      fs.fsyncSync(descritor);
    }
    throw erro;
  } finally {
    fs.closeSync(descritor);
  }
  console.log('Atalho instalado. Backup em ' + backup);
} else {
  console.log('Empacotamento verificado para ' + [...alteracoes.keys()].join(', '));
}
