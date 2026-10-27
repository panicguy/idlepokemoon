'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const { cardBridge, create } = require('./automacoes');
const script = fs.readFileSync(__dirname + '/../PokeMoon-AutoRefill-KimJongDudu.user.js', 'utf8');
const key = 'pm-autorefill-kjd-v1';
function harness({ enabled = true, card = false, store = new Map(), fail = false } = {}) {
  if (!store.has(key)) store.set(key, JSON.stringify({ enabled, sellFirst: true, maxSpendCycle: 150, interval: 30, items: { 'potion:ultimate': { enabled: true, min: 100, target: 500 } } }));
  const calls = []; let interval;
  const state = { balls: { ultra: 800 }, potions: { ultimate: 50 } };
  const nodes = new Map();
  const context = vm.createContext({
    window: {}, console, Date, Promise,
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k,v) => store.set(k,v) },
    document: { body: { append: el => nodes.set(el.id, el) }, getElementById: id => id === 'kjd-autorefill' ? {} : nodes.get(id), createElement: () => ({ style: {} }) },
    setInterval: fn => { interval = fn; return 1; }, setTimeout: fn => { fn(); return 1; }
  });
  const action = async (name, payload) => { calls.push({ name, payload }); if (fail) throw Error('Servidor recusou'); if (name === 'buy') state.potions.ultimate += payload.qty; return { state }; };
  if (card) context.window.__idleMoonCard = { state, action };
  else { context.window.Y = action; context.seed = state; vm.runInContext('let K = seed;', context); }
  vm.runInContext(script, context);
  return { context, calls, state, store, interval };
}
(async () => {
  const play = harness(); await play.context.window.__idleMoonRefillTick();
  assert.equal(play.calls.length, 2); assert.equal(play.calls[0].name, 'sellLoot'); assert.equal(play.calls[1].payload.qty, 1);
  assert.equal(play.state.potions.ultimate, 51);
  const reload = harness({ store: play.store }); await reload.context.window.__idleMoonRefillTick(); assert.equal(reload.calls.length, 0, 'cooldown survives reload');
  play.store.delete(key + ':next-run');
  const card = harness({ card: true, store: play.store }); await card.context.window.__idleMoonRefillTick(); assert.equal(card.calls.length, 2, 'same settings resume in Card');
  assert.equal(card.context.window.Y, undefined, 'no full game needed');
  const off = harness({ enabled: false, card: true }); await off.context.window.__idleMoonRefillTick(); assert.equal(off.calls.length, 0);
  const rejected = harness({ card: true, fail: true }); await rejected.context.window.__idleMoonRefillTick();
  assert.equal(JSON.parse(rejected.store.get(key)).enabled, false, 'errors persist disabled state');
  const errorReload = harness({ card: true, store: rejected.store }); await errorReload.context.window.__idleMoonRefillTick(); assert.equal(errorReload.calls.length, 0);
  const bridgeCalls = [];
  const bridgeContext = vm.createContext({ window: {}, location: { href: 'https://idlepokemoon.com.br/eco.html', origin: 'https://idlepokemoon.com.br' }, URL, Headers, AbortSignal, localStorage: { getItem: () => 'fixture-token' } });
  bridgeContext.window.fetch = async (input, options) => { bridgeCalls.push({ input, options }); const body = String(input).includes('/api/state') ? { state: { balls: {}, potions: {}, boxVer: 9 } } : { state: { balls: {}, potions: { ultimate: 51 }, boxVer: 10 } }; return { ok: true, status: 200, clone: () => ({ json: async () => body }), json: async () => body }; };
  vm.runInContext(cardBridge(), bridgeContext);
  await bridgeContext.window.fetch('/api/state?token=fixture', { headers: { 'X-Sid': 'fixture-session' } });
  assert.equal(bridgeCalls.length, 1, 'bridge does not create additional inventory polling');
  await bridgeContext.window.__idleMoonCard.action('buy', { item: 'ultimate', kind: 'potion', qty: 1 });
  assert.equal(bridgeCalls[1].options.headers['X-Sid'], 'fixture-session');
  assert.equal(bridgeContext.window.__idleMoonCard.state.potions.ultimate, 51);
  await assert.rejects(() => bridgeContext.window.__idleMoonCard.action('other', {}));
  const fixtureFile = __dirname + '/card-manager-fixture.json';
  const fixture = { id: 'fixture', name: 'fixture', enabled: true, accounts: [0], code: '', meta: { match: ['https://idlepokemoon.com.br/play*'] } };
  const injected = [];
  const wc = { id: 501, isDestroyed: () => false, getURL: () => 'https://idlepokemoon.com.br/eco.html', executeJavaScript: async js => { injected.push(js); } };
  const opts = { file: fixtureFile, origin: 'https://idlepokemoon.com.br', views: () => [{ webContents: wc }] };
  try {
    fs.writeFileSync(fixtureFile, JSON.stringify([fixture]));
    await create(opts).inject(wc, 0, 'idle'); assert.equal(injected.length, 0, 'generic scripts are not injected into Card');
    fs.writeFileSync(fixtureFile, JSON.stringify([{ ...fixture, cardSupport: 'autorefill-v1' }]));
    const manager = create(opts);
    await manager.inject(wc, 0, 'idle'); assert.equal(injected.length, 1); assert(injected[0].includes('bridge.action'));
    await manager.tickCard(); assert.equal(injected.length, 2); assert(injected[1].includes('__idleMoonRefillTick'));
    await manager.inject(wc, 1, 'idle'); assert.equal(injected.length, 2, 'account selection respected in Card');
  } finally { fs.unlinkSync(fixtureFile); }
  console.log('PASS: reload resume, persisted cooldown, Card sell/buy with one-unit budget, disabled/error persistence, existing session reuse, no extra polling. All requests simulated.');
})().catch(e => { console.error(e); process.exitCode = 1; });
