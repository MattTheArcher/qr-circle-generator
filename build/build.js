// Baut dist/qr-circle-generator.html: alle Skripte, Stile und die Beispiel-CSV in eine Datei.
// Aufruf: node build/build.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SCRIPTS = [
  'vendor/jsQR.js',          // Apache-2.0, Lesbarkeits-Test
  'src/core/qrcodegen.js',   // MIT, Project Nayuki
  'src/core/glyphs.js',      // Liberation Sans (OFL 1.1)
  'src/core/spotify.js',
  'src/core/design.js',
  'src/core/render.js',
  'src/core/csv.js',
  'src/core/zip.js',
  'src/core/png.js',
];

const exampleCsv = read('examples/beispiel-serie.csv');
let js = SCRIPTS.map((f) => `/* ===== ${f} ===== */\n${read(f)}`).join('\n');
js += `\n/* ===== Beispiel-CSV ===== */\nwindow.QRC.EXAMPLE_CSV = ${JSON.stringify(exampleCsv)};\n`;
js += `/* ===== src/ui/app.js ===== */\n${read('src/ui/app.js')}`;
// Ein „</script“ im Code würde das eingebettete Skript vorzeitig beenden.
js = js.replace(/<\/script/gi, '<\\/script');

let html = read('src/ui/index.html');
html = html.replace('/*STYLE*/', () => read('src/ui/style.css'));
html = html.replace('/*SCRIPTS*/', () => js);

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'qr-circle-generator.html');
fs.writeFileSync(out, html);
console.log(`${path.relative(ROOT, out)}: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
