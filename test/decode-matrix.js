// Prüft die Lesbarkeit vieler zufälliger Codes: rendert per resvg zu PNG, dekodiert mit jsQR
// und speichert die PNGs für den zweiten Decoder (zxing-cpp, test/decode-zxing.py).
// Aufruf: node test/decode-matrix.js [Anzahl je Variante] [Ausgabeordner]
const load = require('./load-core'); const fs = require('fs'); const path = require('path');
const { Resvg } = require('@resvg/resvg-js'); const jsQR = require('jsqr');
const Q = load().QRC;
const N = +(process.argv[2] || 50); const OUT = process.argv[3] || '/tmp/qrc-matrix';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const B62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
const randId = () => Array.from({ length: 22 }, () => B62[Math.floor(rnd() * 62)]).join('');
const variants = [];
for (const eyes of ['round', 'square']) for (const gap of [1, 2]) for (const ppm of [6, 12]) variants.push({ eyes, gap, ppm });
const summary = []; const manifest = [];
for (const v of variants) {
  let ok = 0;
  for (let i = 0; i < N; i++) {
    const content = 'https://open.spotify.com/track/' + randId();
    const m = Q.design.build(content, { eyes: v.eyes, gap: v.gap, label: String(i + 1) });
    const svg = Q.render.toSvg(m, { fg: '#000000', bg: '#ffffff' });
    const img = new Resvg(svg, { fitTo: { mode: 'width', value: m.width * v.ppm } }).render();
    const r = jsQR(new Uint8ClampedArray(img.pixels), img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (r && r.data === content) ok++;
    const file = `${v.eyes}-gap${v.gap}-ppm${v.ppm}-${i}.png`;
    fs.writeFileSync(path.join(OUT, file), img.asPng());
    manifest.push({ file, content, variant: `${v.eyes} gap${v.gap} ppm${v.ppm}` });
  }
  summary.push(`${v.eyes.padEnd(6)} gap${v.gap} ppm${String(v.ppm).padEnd(2)}  jsQR ${ok}/${N}`);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
console.log(summary.join('\n'));
