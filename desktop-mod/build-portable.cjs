'use strict';
// node desktop-mod/build-portable.cjs <official-app-folder> <new-output-folder>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const app = path.resolve(process.argv[2] || '');
const out = path.resolve(process.argv[3] || '');
if (!process.argv[2] || !process.argv[3] || out === app || fs.existsSync(out)) throw Error('Informe a pasta oficial e uma pasta de saída nova.');
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const baseFile = (file) => fs.existsSync(path.join(app, file + '.original-0.4.0')) ? path.join(app, file + '.original-0.4.0') : path.join(app, file);
const archive = fs.readFileSync(baseFile('resources/app.asar'));
const exe = fs.readFileSync(baseFile('Idle Poke Moon.exe'));
if (sha(archive) !== '5de2fcdb4fd587adc96c40314f8f3f4eef1fc80ce1807c44311b0010544e1e85' || sha(exe) !== '451503c85b20f25dd3f86a7c30337ca0705d9019010040a1b8dea3c4d009da03') throw Error('Base diferente da versão oficial 0.4.0 validada. Nenhum arquivo foi alterado.');
const header = JSON.parse(archive.subarray(16, 16 + archive.readUInt32LE(12)));
const base = 8 + archive.readUInt32LE(4);
function entry(name) { let current = header; for (const part of name.split('/')) current = current.files[part]; return current; }
const changes = new Map();
function read(name) { const e = entry(name); return archive.subarray(base + Number(e.offset), base + Number(e.offset) + e.size).toString('utf8'); }
function replace(name, before, after) { const text = changes.get(name) ?? read(name); if (!text.includes(before)) throw Error('Trecho esperado ausente: ' + name); changes.set(name, text.replace(before, after)); }
replace('src/main/janela.js', '  const contas = [];', `  const contas = [];
  const automacoes = require('./automacoes').create({ file: path.join(path.dirname(arquivoPrefs), 'automacoes.json'), views: () => contas, origin: origemJogo, count: CONTAS, presetsFile: path.join(__dirname, '..', '..', 'automation-presets.json'), recommendHunts: p => api.hunts(p) });
  const timerAutomacoes = setInterval(() => { if (!win.isDestroyed()) automacoes.tickCard().catch(() => {}); }, 500);
  timerAutomacoes.unref?.();
  win.once('closed', () => clearInterval(timerAutomacoes));`);
replace('src/main/janela.js', '    contas.push(v);', `    v.webContents.on('dom-ready', () => { automacoes.inject(v.webContents, n, 'end').catch(() => {}); });
    v.webContents.on('did-finish-load', () => { automacoes.inject(v.webContents, n, 'idle').catch(() => {}); });
    contas.push(v);`);
replace('src/main/janela.js', "  ipcMain.handle('dados', aoDados);", `  ipcMain.handle('dados', aoDados);
  ipcMain.handle('automacoes', (e, p) => {
    if (!remetenteOk(e) || e.sender !== painel.webContents || bloqueado) return { ok: false, error: 'Pedido recusado.' };
    return automacoes.request(p);
  });`);
replace('src/main/janela.js', "ipcMain.removeHandler('dados');", "ipcMain.removeHandler('dados'); ipcMain.removeHandler('automacoes');");
replace('src/preload/painel.js', '  acao: (a)', "  automacoes: (p) => ipcRenderer.invoke('automacoes', p),\n  acao: (a)");
replace('src/ui/painel.html', '<script src="painel-ajustes.js"></script>', '<script src="painel-automacoes.js"></script>\n<script src="painel-ajustes.js"></script>');
replace('src/ui/painel-ajustes.js', "    raiz.append(sec('🎛️ Desempenho'), blocoPerfis(S));", "    raiz.append(sec('🤖 Automações'), window.blocoAutomacoes());\n    raiz.append(sec('🎛️ Desempenho'), blocoPerfis(S));");
changes.set('src/ui/painel.css', read('src/ui/painel.css') + '\n.automacoes input{width:100%;box-sizing:border-box;margin:12px 0;padding:10px;border:1px solid #675a92;border-radius:8px;background:#11152b;color:#eee}.automacoes .n em{display:block;margin-top:6px}.auto-script{border-top:1px solid #45405d;margin-top:16px;padding-top:14px;display:grid;gap:10px}.auto-url{overflow-wrap:anywhere;opacity:.65}.automacoes p{line-height:1.5}\n');
const manager = require('./automacoes');
const presets = ['PokeMoon-AutoCatch-KimJongDudu.user.js', 'PokeMoon-AutoRefill-KimJongDudu.user.js', 'PokeMoon-Rota-Bestiario-KimJongDudu.user.js', 'PokeMoon-Hunts-Rapidas-KimJongDudu.user.js', 'PokeMoon-Voltar-Hunt-KimJongDudu.user.js', 'PokeMoon-Rota-Evolutiva-KimJongDudu.user.js', 'PokeMoon-Rota-Shiny-Rebosteio.user.js', 'PokeMoon-Rota-Quests-Rebosteio.user.js', 'PokeMoon-Counters-Ranqueada-Rebosteio.user.js'].map(file => {
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const meta = manager.metadata(code);
  return { name: meta.name[0], url: 'https://raw.githubusercontent.com/panicguy/idlepokemoon/main/' + file, code, meta, cardSupport: (meta['idlemoon-card'] || [])[0], huntsSupport: (meta['idlemoon-hunts'] || [])[0], dependencies: '' };
});
changes.set('automation-presets.json', JSON.stringify(presets, null, 2));
changes.set('src/main/automacoes.js', fs.readFileSync(path.join(__dirname, 'automacoes.js'), 'utf8'));
changes.set('src/ui/painel-automacoes.js', fs.readFileSync(path.join(__dirname, 'painel-automacoes.js'), 'utf8'));
for (const [name, content] of changes) {
  if (name.endsWith('.js')) new vm.Script(content, { filename: name });
  const parts = name.split('/'); let current = header;
  for (const part of parts.slice(0, -1)) { current.files[part] ||= { files: {} }; current = current.files[part]; }
  current.files[parts.at(-1)] ||= {};
}
const chunks = []; let offset = 0;
function pack(files, prefix = '') {
  for (const [name, e] of Object.entries(files)) {
    const relative = prefix + name;
    if (e.files) { pack(e.files, relative + '/'); continue; }
    const data = changes.has(relative) ? Buffer.from(changes.get(relative)) : archive.subarray(base + Number(e.offset), base + Number(e.offset) + e.size);
    e.offset = String(offset); e.size = data.length;
    const blockSize = 4194304, blocks = [];
    for (let i = 0; i < data.length; i += blockSize) blocks.push(sha(data.subarray(i, i + blockSize)));
    e.integrity = { algorithm: 'SHA256', hash: sha(data), blockSize, blocks };
    chunks.push(data); offset += data.length;
  }
}
pack(header.files);
const json = Buffer.from(JSON.stringify(header));
const padded = Math.ceil((4 + json.length) / 4) * 4;
const head = Buffer.alloc(4 + padded); head.writeUInt32LE(padded, 0); head.writeUInt32LE(json.length, 4); json.copy(head, 8);
const size = Buffer.alloc(8); size.writeUInt32LE(4, 0); size.writeUInt32LE(head.length, 4);
const newArchive = Buffer.concat([size, head, ...chunks]);
const oldHash = Buffer.from(sha(archive.subarray(16, 16 + archive.readUInt32LE(12))));
const position = exe.indexOf(oldHash);
if (position < 0 || exe.indexOf(oldHash, position + 1) >= 0) throw Error('Referência de integridade inesperada no executável.');
Buffer.from(sha(json)).copy(exe, position);
fs.mkdirSync(path.join(out, 'resources'), { recursive: true });
// Explicit allowlist: no user profile, logs, backup executables or work files.
for (const name of ['chrome_100_percent.pak','chrome_200_percent.pak','d3dcompiler_47.dll','dxcompiler.dll','dxil.dll','ffmpeg.dll','icudtl.dat','LICENSE.electron.txt','LICENSES.chromium.html','resources.pak','snapshot_blob.bin','v8_context_snapshot.bin','vk_swiftshader_icd.json','vk_swiftshader.dll','vulkan-1.dll']) fs.copyFileSync(path.join(app, name), path.join(out, name));
fs.cpSync(path.join(app, 'locales'), path.join(out, 'locales'), { recursive: true });
for (const name of ['app-update.yml','elevate.exe','icon.ico']) fs.copyFileSync(path.join(app, 'resources', name), path.join(out, 'resources', name));
fs.writeFileSync(path.join(out, 'resources', 'app.asar'), newArchive);
fs.writeFileSync(path.join(out, 'Idle Poke Moon.exe'), exe);
fs.copyFileSync(path.join(__dirname, 'COMO-USAR.txt'), path.join(out, 'LEIA-ME.txt'));
const hashes = { 'Idle Poke Moon.exe': sha(exe), 'resources/app.asar': sha(newArchive) };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ version: '0.4.0-mod2', base: '0.4.0', hashes, cleanProfile: true }, null, 2));
console.log(JSON.stringify({ output: out, hashes, scripts: presets.map(s => s.name) }));

