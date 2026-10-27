const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { create, githubUrl, metadata, matches, runtime } = require('./automacoes');
(async () => {
  assert.equal(githubUrl('https://github.com/a/b/blob/main/test.user.js'), 'https://raw.githubusercontent.com/a/b/main/test.user.js');
  for (const url of ['http://github.com/a.js', 'https://evil.test/a.js', 'https://github.com/a/b', 'https://github.com@evil.test/a.js']) assert.throws(() => githubUrl(url));
  assert(matches('*://*.example.com/play*', 'https://example.com/play?a=1'));
  assert(!matches('*://*.example.com/play*', 'https://example.com.evil.test/play'));
  assert.throws(() => metadata('// ==UserScript==\n// @grant GM_xmlhttpRequest\n// ==/UserScript=='));
  assert.throws(() => metadata('// ==UserScript==\n// @run-at document-start\n// ==/UserScript=='));
  const temp = fs.mkdtempSync(path.join(__dirname, 'idlemoon-test-'));
  const file = path.join(temp, 'automacoes.json');
  const code = '// ==UserScript==\n// @name Teste\n// @match https://idlepokemoon.com.br/play*\n// @grant GM_setValue\n// ==/UserScript==\nGM_setValue("runs", GM_getValue("runs", 0) + 1); window.testRuns = GM_getValue("runs");';
  const storage = new Map();
  function context() { return vm.createContext({ window: {}, localStorage: { getItem: k => storage.has(k) ? storage.get(k) : null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }, console }); }
  let page = context(), reloads = 0, injected = 0;
  const wc = { isDestroyed: () => false, getURL: () => 'https://idlepokemoon.com.br/play?app=1', reload: () => { reloads++; page = context(); }, executeJavaScript: async js => { injected++; return vm.runInContext(js, page); } };
  const opts = { file, origin: 'https://idlepokemoon.com.br', views: () => [{ webContents: wc }], fetchScript: async () => code };
  const manager = create(opts);
  let r = await manager.request({ type: 'install', url: 'https://github.com/a/b/blob/main/test.js' }); assert(r.ok, r.error);
  const id = r.scripts[0].id; assert.equal(r.scripts[0].enabled, false);
  await manager.inject(wc, 0, 'idle'); assert.equal(injected, 0);
  assert((await manager.request({ type: 'toggle', id, enabled: true })).ok); assert.equal(reloads, 1);
  await manager.inject(wc, 0, 'end'); assert.equal(injected, 0);
  await manager.inject(wc, 0, 'idle'); await manager.inject(wc, 0, 'idle'); assert.equal(page.window.testRuns, 1);
  assert.equal((await create(opts).request({ type: 'list' })).scripts[0].enabled, true);
  assert((await manager.request({ type: 'accounts', id, accounts: [1] })).ok);
  const before = injected; await manager.inject(wc, 0, 'idle'); assert.equal(injected, before);
  assert.equal((await manager.request({ type: 'accounts', id, accounts: [-1] })).ok, false);
  assert((await manager.request({ type: 'remove', id })).ok);
  assert.equal((await manager.request({ type: 'list' })).scripts.length, 0);
  new vm.Script(runtime({ id: 'test', name: 'test', code: '', meta: {} }));
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('PASS: URL validation, metadata, match rules, installation, isolated execution, duplicate prevention, persistence, account selection, reload and removal.');
})().catch(e => { console.error(e); process.exitCode = 1; });


