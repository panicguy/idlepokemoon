'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const code = fs.readFileSync(__dirname + '/../PokeMoon-AutoCatch-KimJongDudu.user.js', 'utf8');
function setup(settings, state, action) {
  let now = 10000; const nodes = new Map(), store = new Map(); const calls = [];
  store.set('kim-pokemoon-autocatch-settings', JSON.stringify(settings));
  const c = vm.createContext({ window: {}, Date: { now: () => now }, console,
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k,v) => store.set(k,v) },
    document: { body: { append: el => nodes.set(el.id,el) }, getElementById: id => nodes.get(id), createElement: () => ({ style: {} }) }, setInterval: () => 1 });
  c.window.__idleMoonCard = { state, action: async (name,payload) => { calls.push({name,payload}); if(action) return action(name,payload); return {}; } };
  vm.runInContext(code, c);
  return { c, calls, store, nodes, advance: ms => { now += ms; }, tick: () => c.window.__idleMoonCatchTick() };
}
(async () => {
  const state = { captures: [{id: 1,shiny: true}, {id: 2,shiny: false}], auto: {ball:'ultra'} };
  const normal = setup({enabled:true,shiny:false,intervalMs:1250}, state);
  await normal.tick(); assert.equal(normal.calls[0].name,'throwBall'); assert.equal(normal.calls[0].payload.captureId,2); assert.equal(normal.calls[0].payload.ball,'ultra');
  await normal.tick(); assert.equal(normal.calls.length,1); normal.advance(1250); await normal.tick(); assert.equal(normal.calls.length,2);
  const shiny = setup({enabled:true,shiny:true,intervalMs:1250},state); await shiny.tick(); assert.equal(shiny.calls[0].payload.captureId,1);
  const off = setup({enabled:false},state); await off.tick(); assert.equal(off.calls.length,0);
  const absent = setup({enabled:true},null); await absent.tick(); assert.equal(absent.calls.length,0);
  const noBall = setup({enabled:true}, {captures:[{id:1}]}); await noBall.tick(); assert.equal(noBall.calls.length,0);
  let release; const slow=setup({enabled:true,shiny:true},state,()=>new Promise(r=>{release=r})); const first=slow.tick(); await slow.tick(); assert.equal(slow.calls.length,1);release({});await first;
  const failure=setup({enabled:true,shiny:true},state,async()=>{throw Error('recusado')});await failure.tick();failure.advance(2000);await failure.tick();assert.equal(failure.calls.length,1);
  assert(failure.nodes.get('idlemoon-catch-card').textContent.includes('recusado'));
  console.log('PASS: disabled state, no inventory, shiny filter, selected ball, interval, overlapping tick prevention, server refusal backoff. All throws simulated.');
})().catch(e=>{console.error(e);process.exitCode=1});
