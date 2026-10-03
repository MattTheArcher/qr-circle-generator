// Lädt die Browser-Skripte aus src/core in Node (gleiche Dateien wie im Build).
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const FILES = ['qrcodegen.js', 'glyphs.js', 'spotify.js', 'design.js', 'render.js', 'csv.js', 'zip.js', 'png.js'];
module.exports = function loadCore() {
  const ctx = { console, URL, TextDecoder, TextEncoder, Uint8Array, Uint32Array, DataView, Math, Date };
  ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of FILES) {
    const p = path.join(__dirname, '..', 'src', 'core', f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  ctx.QRC.__qrcodegen = ctx.qrcodegen;
  return ctx;
};
