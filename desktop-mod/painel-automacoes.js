'use strict';
(() => {
  const { h } = window.UI;
  let scripts = null, loading = false, busy = false, message = '', draft = '';
  const render = () => { if (window.PAINEL?.aba === 'ajustes') window.PAINEL.render(); };
  async function request(p) {
    busy = true; message = ''; render();
    try { const r = await window.app.automacoes(p); if (!r.ok) message = r.error; else { scripts = r.scripts; if (p.type === 'install') { draft = ''; message = 'Instalado. Escolha as contas e ative o script.'; } } }
    catch (_) { message = 'Não foi possível completar o pedido.'; }
    busy = false; render();
  }
  window.blocoAutomacoes = () => {
    if (scripts === null && !loading) { loading = true; request({ type: 'list' }).finally(() => { loading = false; }); }
    const input = h('input', { type: 'url', placeholder: 'https://github.com/usuario/repositorio/blob/main/script.user.js', value: draft,
      oninput: e => { draft = e.target.value; }, disabled: busy, 'aria-label': 'Link do script no GitHub' });
    const box = h('div.card.automacoes',
      h('div.n', h('b', 'Scripts do GitHub'), h('em', 'Cole o link de um .js ou .user.js. Instale apenas scripts em que você confia: eles podem agir nas contas selecionadas.')),
      input, h('button.btn-g', { disabled: busy, onclick: () => request({ type: 'install', url: draft.trim() }) }, busy ? 'Aguarde…' : 'Instalar script'),
      message ? h('p', { role: 'status' }, message) : null,
      h('p.dim.pequeno', 'Ativar, desativar ou trocar contas recarrega as contas afetadas. Scripts ficam salvos; novas versões são instaladas manualmente.'));
    for (const s of scripts || []) {
      box.append(h('div.auto-script',
        h('b', s.name + (s.version ? ' · ' + s.version : '')),
        ['autorefill-v1', 'autocatch-v1'].includes(s.cardSupport) ? h('small', 'Compatível com Card · mantém o estado após recarregar') : null,
        h('small.auto-url', s.url),
        h('div.visao', [true, false].map(on => h('button' + (s.enabled === on ? '.on' : ''), { disabled: busy, onclick: () => request({ type: 'toggle', id: s.id, enabled: on }) }, on ? 'Ligado' : 'Desligado'))),
        h('div.visao', [0, 1, 2].map(i => h('button' + (s.accounts.includes(i) ? '.on' : ''), { disabled: busy, onclick: () => request({ type: 'accounts', id: s.id, accounts: s.accounts.includes(i) ? s.accounts.filter(n => n !== i) : [...s.accounts, i] }) }, window.PAINEL.nomeConta(i)))),
        s.error ? h('p', s.error) : null,
        h('button', { disabled: busy, onclick: () => request({ type: 'remove', id: s.id }) }, 'Remover')));
    }
    if (scripts && !scripts.length) box.append(h('p.dim', 'Nenhuma automação instalada.'));
    return box;
  };
})();
