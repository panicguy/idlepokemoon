'use strict';
// Development helper: scripts remain fully standalone at runtime.
const fs = require('fs');
const path = require('path');
const root = path.dirname(__dirname), shared = fs.readFileSync(path.join(__dirname, 'moon-dock.js'), 'utf8').trimEnd();
for (const name of ['AutoCatch', 'AutoRefill', 'Rota-Bestiario', 'Hunts-Rapidas', 'Voltar-Hunt']) {
  const file = path.join(root, 'PokeMoon-' + name + '-KimJongDudu.user.js');
  let text = fs.readFileSync(file, 'utf8');
  const begin = text.indexOf('  // BEGIN SHARED MOON DOCK'), end = text.indexOf('  // END SHARED MOON DOCK');
  if (begin < 0 || end < begin) throw Error('Missing embedded dock: ' + file);
  text = text.slice(0, begin) + shared + text.slice(end + '  // END SHARED MOON DOCK'.length);
  fs.writeFileSync(file, text);
}
