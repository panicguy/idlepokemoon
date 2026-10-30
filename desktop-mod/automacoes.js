'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const vm = require('vm');
const HOSTS = new Set(['github.com', 'raw.githubusercontent.com']);
function githubUrl(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || !HOSTS.has(u.hostname) || u.username || u.password || u.port) throw Error('Use um link HTTPS de arquivo .js do GitHub.');
  if (u.hostname === 'github.com') {
    const p = u.pathname.split('/').filter(Boolean);
    if (p.length < 5 || !['blob', 'raw'].includes(p[2])) throw Error('Cole o link de um arquivo .js, não de uma pasta.');
    u.hostname = 'raw.githubusercontent.com'; u.pathname = '/' + [p[0], p[1], ...p.slice(3)].join('/');
  }
  if (!u.pathname.endsWith('.js')) throw Error('O arquivo precisa terminar em .js.');
  u.hash = ''; return u.href;
}
function download(value, redirects = 0) {
  const url = githubUrl(value);
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'IdleMoon-Automacoes', Accept: 'text/plain' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume();
        if (redirects >= 3) return reject(Error('Redirecionamentos demais.'));
        try { resolve(download(new URL(res.headers.location, url).href, redirects + 1)); } catch (e) { reject(e); }
        return;
      }
      if (res.statusCode !== 200) { res.resume(); return reject(Error('GitHub respondeu HTTP ' + res.statusCode)); }
      let size = 0; const chunks = [];
      res.on('data', c => { size += c.length; if (size > 2 * 1024 * 1024) res.destroy(Error('Limite de 2 MB por arquivo.')); else chunks.push(c); });
      res.on('error', reject);
      res.on('end', () => { const text = Buffer.concat(chunks).toString('utf8'); if (/^\s*(?:<!doctype|<html)/i.test(text)) reject(Error('O link retornou HTML.')); else resolve(text); });
    });
    req.setTimeout(15000, () => req.destroy(Error('Tempo de download esgotado.'))); req.on('error', reject);
  });
}
function metadata(code) {
  const block = /\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/.exec(code);
  const m = {};
  for (const line of (block ? block[1] : '').split('\n')) {
    const a = /^\s*\/\/\s*@([\w-]+)\s+(.+?)\s*$/.exec(line);
    if (a) (m[a[1]] ||= []).push(a[2]);
  }
  const grants = m.grant || [];
  const allowed = ['none', 'unsafeWindow', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues', 'GM_addStyle', 'GM_info', 'GM.getValue', 'GM.setValue', 'GM.deleteValue', 'GM.listValues', 'GM.addStyle', 'GM.info'];
  const missing = grants.filter(g => !allowed.includes(g));
  if (missing.length) throw Error('APIs ainda não suportadas: ' + missing.join(', '));
  if ((m['run-at'] || []).includes('document-start')) throw Error('Este script exige document-start. Esta versão suporta document-end e document-idle.');
  if ((m.resource || []).length) throw Error('@resource ainda não é suportado.');
  new vm.Script(code);
  return m;
}
function matches(pattern, url, glob = false) {
  if (pattern === '<all_urls>') return /^https?:/.test(url);
  if (glob) return new RegExp('^' + pattern.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(url);
  const m = /^(\*|https?):\/\/([^/]+)(\/.*)$/.exec(pattern);
  if (!m) return false;
  const u = new URL(url);
  return (m[1] === '*' ? /^https?:$/.test(u.protocol) : u.protocol === m[1] + ':') &&
    (m[2] === '*' || u.hostname === m[2] || (m[2].startsWith('*.') && (u.hostname === m[2].slice(2) || u.hostname.endsWith(m[2].slice(1))))) && matches(m[3], u.pathname + u.search, true);
}
function runtime(script) {
  return `(() => {
    const id = ${JSON.stringify(script.id)};
    const ran = window.__idleMoonScripts ||= new Set(); if (ran.has(id)) return; ran.add(id);
    const prefix = 'idlemoon:userscript:' + id + ':';
    const GM_getValue = (k, fallback) => { try { const v = localStorage.getItem(prefix + k); return v === null ? fallback : JSON.parse(v); } catch (_) { return fallback; } };
    const GM_setValue = (k, v) => localStorage.setItem(prefix + k, JSON.stringify(v));
    const GM_deleteValue = k => localStorage.removeItem(prefix + k);
    const GM_listValues = () => Object.keys(localStorage).filter(k => k.startsWith(prefix)).map(k => k.slice(prefix.length));
    const GM_addStyle = css => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).append(s); return s; };
    const GM_info = ${JSON.stringify({ script: { name: script.name, version: (script.meta.version || [''])[0] }, scriptHandler: 'IdleMoon', version: '1.0' })};
    const GM = { getValue: async (...a) => GM_getValue(...a), setValue: async (...a) => GM_setValue(...a), deleteValue: async (...a) => GM_deleteValue(...a), listValues: async () => GM_listValues(), addStyle: GM_addStyle, info: GM_info };
    const unsafeWindow = window;
    try {\n${script.dependencies || ''}\n${script.code}\n} catch (e) { console.error('[IdleMoon automação]', GM_info.script.name, e); throw e; }
  })();`;
}
function cardBridge() {
  return `(() => {
    if (window.__idleMoonCard) return;
    const bridge = window.__idleMoonCard = { state: null, sid: null, error: '' };
    const original = window.fetch.bind(window);
    window.fetch = async function(input, options) {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      const isState = url.origin === location.origin && url.pathname === '/api/state';
      if (isState) bridge.sid = new Headers(options?.headers || (typeof input === 'object' ? input.headers : undefined)).get('X-Sid') || bridge.sid;
      const response = await original(input, options);
      if (isState) {
        try {
          const result = await response.clone().json();
          if (!response.ok || result.sess === 'other' || result.sess === 'devlimit') { bridge.state = null; bridge.error = 'Sessão indisponível no Card.'; }
          else if (result.state) { bridge.state = result.state; bridge.error = ''; }
        } catch (_) { bridge.state = null; }
      }
      return response;
    };
    let actionQueue = Promise.resolve();
    const performAction = async (action, payload) => {
      if (!bridge.state || !bridge.sid) throw Error('Aguardando sessão e inventário do Card.');
      if (!['buy', 'sellLoot', 'throwBall'].includes(action)) throw Error('Ação indisponível no Card.');
      const token = localStorage.getItem('pmi_token');
      if (!token) throw Error('Sessão do Card expirou.');
      const response = await original('/api/action', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Sid': bridge.sid }, body: JSON.stringify({ token, action, bver: bridge.state.boxVer || 0, ...payload }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok || result.err || result.error || result.sess === 'other') throw Error(result.err || result.error || 'Ação recusada no Card (' + response.status + ').');
      if (result.state) bridge.state = result.state;
      return result;
    };
    bridge.action = (action, payload) => {
      const result = actionQueue.then(() => performAction(action, payload));
      actionQueue = result.catch(() => {});
      return result;
    };
  })();`;
}
function create({ file, views, origin, count = 3, fetchScript = download, presetsFile = null }) {
  let scripts = []; const errors = new Map();
  try { const saved = JSON.parse(fs.readFileSync(file, 'utf8')); if (Array.isArray(saved)) scripts = saved.filter(s => typeof s.code === 'string' && s.meta && Array.isArray(s.accounts)); } catch (e) {
    if (e.code !== 'ENOENT') throw Error('Não foi possível ler automacoes.json: ' + e.message);
    if (presetsFile && fs.existsSync(presetsFile)) {
      const presets = JSON.parse(fs.readFileSync(presetsFile, 'utf8'));
      scripts = presets.map(s => ({ ...s, id: crypto.randomUUID(), enabled: false, accounts: Array.from({ length: count }, (_, i) => i) }));
      fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(scripts, null, 2), { flag: 'wx' });
    }
  }
  const list = () => scripts.map(({ code, dependencies, meta, ...s }) => ({ ...s, version: (meta.version || [''])[0], error: errors.get(s.id) || '' }));
  function save() { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file + '.tmp', JSON.stringify(scripts, null, 2)); fs.renameSync(file + '.tmp', file); }
  async function prepare(url) {
    const code = await fetchScript(url), meta = metadata(code), deps = [];
    for (const link of meta.require || []) {
      if (deps.length >= 8) throw Error('Limite de 8 dependências.');
      const dep = await fetchScript(githubUrl(link)); new vm.Script(dep); deps.push(dep);
    }
    const capability = (meta['idlemoon-card'] || [])[0];
    return { name: (meta.name || [new URL(url).pathname.split('/').pop()])[0], url, code, meta,
      dependencies: deps.join('\n;\n'), cardSupport: ['autorefill-v1', 'autocatch-v1'].includes(capability) ? capability : undefined };
  }
  function reload(accounts) { for (const i of accounts) { const wc = views()[i]?.webContents; if (wc && !wc.isDestroyed()) { try { if (new URL(wc.getURL()).origin === origin) wc.reload(); } catch (_) {} } } }
  async function inject(wc, i, phase) {
    const url = wc.getURL();
    let card = false;
    try { const u = new URL(url); if (u.origin !== origin || !['/play', '/eco.html'].includes(u.pathname)) return; card = u.pathname === '/eco.html'; } catch (_) { return; }
    for (const s of scripts) {
      if (!s.enabled || !s.accounts.includes(i)) continue;
      if (card && !['autorefill-v1', 'autocatch-v1'].includes(s.cardSupport)) continue;
      const run = (s.meta['run-at'] || ['document-idle'])[0];
      if ((phase === 'end') !== (run === 'document-end')) continue;
      const matchUrl = card ? origin + '/play' : url;
      if ((s.meta.match || s.meta.include) && ![...(s.meta.match || []).map(p => matches(p, matchUrl)), ...(s.meta.include || []).map(p => matches(p, matchUrl, true))].some(Boolean)) continue;
      if ((s.meta['exclude-match'] || []).some(p => matches(p, matchUrl)) || (s.meta.exclude || []).some(p => matches(p, matchUrl, true))) continue;
      try { await wc.executeJavaScript((card ? cardBridge() : '') + runtime(s), false); errors.delete(s.id); } catch (e) { errors.set(s.id, 'Conta ' + (i + 1) + ': ' + e.message); }
    }
  }
  async function request(p) {
    const previous = JSON.stringify(scripts);
    try {
      if (!p || typeof p !== 'object') throw Error('Pedido inválido.');
      if (p.type === 'list') return { ok: true, scripts: list() };
      if (p.type === 'install') {
        if (scripts.length >= 30) throw Error('Limite de 30 scripts.');
        const url = githubUrl(p.url); if (scripts.some(s => s.url === url)) throw Error('Este script já está instalado.');
        scripts.push({ ...await prepare(url), id: crypto.randomUUID(), enabled: false, accounts: Array.from({ length: count }, (_, i) => i) }); save();
      } else if (p.type === 'update') {
        const s = scripts.find(s => s.id === p.id); if (!s) throw Error('Script não encontrado.');
        const prepared = await prepare(githubUrl(s.url));
        if (prepared.code === s.code && prepared.dependencies === s.dependencies) return { ok: true, scripts: list(), message: 'O script já está atualizado.' };
        const oldVersion = (s.meta.version || ['sem versão'])[0];
        Object.assign(s, prepared); save(); errors.delete(s.id);
        // ID, activation and account selection stay stable; scripts keep their own storage keys.
        if (s.enabled) reload(s.accounts);
        return { ok: true, scripts: list(), message: 'Atualizado: ' + oldVersion + ' → ' + (s.meta.version || ['sem versão'])[0] + '. Configurações preservadas.' };
      } else if (p.type === 'toggle' || p.type === 'remove' || p.type === 'accounts') {
        const s = scripts.find(s => s.id === p.id); if (!s) throw Error('Script não encontrado.');
        const affected = [...s.accounts];
        if (p.type === 'toggle') { if (typeof p.enabled !== 'boolean') throw Error('Estado inválido.'); s.enabled = p.enabled; }
        if (p.type === 'accounts') { if (!Array.isArray(p.accounts) || p.accounts.some(i => !Number.isInteger(i) || i < 0 || i >= count)) throw Error('Conta inválida.'); s.accounts = [...new Set(p.accounts)]; affected.push(...s.accounts); }
        if (p.type === 'remove') scripts = scripts.filter(x => x !== s);
        save(); reload([...new Set(affected)]);
      } else throw Error('Ação inválida.');
      return { ok: true, scripts: list() };
    } catch (e) { scripts = JSON.parse(previous); return { ok: false, error: e.message }; }
  }
  let queue = Promise.resolve();
  const ticking = new Set();
  async function tickCard() {
    await Promise.all(views().map(async (view, i) => {
      const wc = view?.webContents;
      if (!wc || wc.isDestroyed() || ticking.has(wc.id) || !scripts.some(s => s.enabled && ['autorefill-v1', 'autocatch-v1'].includes(s.cardSupport) && s.accounts.includes(i))) return;
      try { const u = new URL(wc.getURL()); if (u.origin !== origin || u.pathname !== '/eco.html') return; } catch (_) { return; }
      ticking.add(wc.id);
      try { await wc.executeJavaScript('Promise.all([window.__idleMoonRefillTick && window.__idleMoonRefillTick(), window.__idleMoonCatchTick && window.__idleMoonCatchTick()]).then(() => undefined)', false); } catch (_) {} finally { ticking.delete(wc.id); }
    }));
  }
  return { inject, tickCard, request: p => { const result = queue.then(() => request(p)); queue = result.catch(() => {}); return result; } };
}
module.exports = { create, githubUrl, metadata, matches, runtime, cardBridge };

