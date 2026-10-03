// Unit-Tests für Spotify-Normalisierung, CSV, ZIP und PNG-dpi.  Aufruf: node test/unit.js
const assert = require('assert'); const fs = require('fs'); const path = require('path');
const { execSync } = require('child_process');
const Q = require('./load-core')().QRC;
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

const ID = '6rqhFgbbKwnb9MLmUQDhG6';
t('Spotify: kurze Form bleibt', () => assert.equal(Q.spotify.normalize('https://open.spotify.com/track/' + ID, 'web').content, 'https://open.spotify.com/track/' + ID));
t('Spotify: ?si= und intl entfernt', () => {
  const r = Q.spotify.normalize(' https://open.spotify.com/intl-de/track/' + ID + '?si=abc123&context=x ', 'web');
  assert.equal(r.content, 'https://open.spotify.com/track/' + ID); assert.equal(r.notes.length, 2);
});
t('Spotify: URI → Web-Link', () => assert.equal(Q.spotify.normalize('spotify:track:' + ID, 'web').content, 'https://open.spotify.com/track/' + ID));
t('Spotify: Web-Link → App-Link', () => assert.equal(Q.spotify.normalize('https://open.spotify.com/track/' + ID, 'app').content, 'spotify:track:' + ID));
t('Spotify: ohne https', () => assert.equal(Q.spotify.normalize('open.spotify.com/track/' + ID, 'web').content, 'https://open.spotify.com/track/' + ID));
t('Spotify: Link in Text', () => assert.equal(Q.spotify.normalize('Hör dir das an: https://open.spotify.com/track/' + ID + '?si=x', 'web').content, 'https://open.spotify.com/track/' + ID));
t('Spotify: Kurzlink übernommen', () => {
  const r = Q.spotify.normalize('https://spotify.link/AbCdEf123?x=1', 'web'); assert.ok(r.ok); assert.equal(r.content, 'https://spotify.link/AbCdEf123');
});
t('Spotify: Album mit Warnung', () => {
  const r = Q.spotify.normalize('https://open.spotify.com/album/' + ID, 'web'); assert.ok(r.ok); assert.equal(r.warnings.length, 1);
});
t('Spotify: fremder Link → Fehler', () => assert.ok(!Q.spotify.normalize('https://youtube.com/watch?v=1', 'web').ok));
t('Spotify: kaputte ID → Fehler', () => assert.ok(!Q.spotify.normalize('https://open.spotify.com/track/abc', 'web').ok));
t('Spotify: leer → Fehler', () => assert.ok(!Q.spotify.normalize('  ', 'web').ok));

t('CSV: Beispieldatei (UTF-8 mit BOM, Semikolon)', () => {
  const r = Q.csv.parse(new Uint8Array(fs.readFileSync(path.join(__dirname, '..', 'examples', 'beispiel-serie.csv'))));
  assert.equal(r.delimiter, ';'); assert.ok(r.hasHeader); assert.equal(r.entries.length, 5);
  assert.equal(r.entries[0].label, '1');
  r.entries.forEach(e => assert.ok(Q.spotify.normalize(e.content, 'web').ok, e.content));
});
t('CSV: Windows-1252 mit Umlauten, Komma, Anführungszeichen', () => {
  const bytes = Buffer.from('Nummer,Link\r\n"Ä 1","https://open.spotify.com/track/' + ID + '"\r\n', 'latin1');
  const r = Q.csv.parse(new Uint8Array(bytes)); assert.equal(r.entries[0].label, 'Ä 1');
});
t('CSV: ohne Kopfzeile, nur Links', () => {
  const r = Q.csv.parse('https://open.spotify.com/track/' + ID + '\nhttps://open.spotify.com/track/' + ID + '\n');
  assert.equal(r.entries.length, 2); assert.equal(r.entries[0].label, '');
});
t('CSV: ohne Kopfzeile, Nummer;Link', () => {
  const r = Q.csv.parse('7;https://open.spotify.com/track/' + ID); assert.equal(r.entries[0].label, '7');
});
t('CSV: Kopfzeile ohne link-Spalte → Fehler', () => assert.ok(Q.csv.parse('nummer;foo\n1;x').error));

t('ZIP: von unzip lesbar, Umlaute im Namen', () => {
  const z = Q.zip.makeZip([{ name: 'ä-1.txt', data: new TextEncoder().encode('hallo') }, { name: 'b.txt', data: new Uint8Array([1, 2, 3]) }]);
  fs.writeFileSync('/tmp/qrc-test.zip', z);
  const out = execSync('python3 -c "import zipfile;z=zipfile.ZipFile(\'/tmp/qrc-test.zip\');print(z.testzip(), z.namelist(), z.read(\'ä-1.txt\'))"').toString();
  assert.ok(out.includes("None ['ä-1.txt', 'b.txt'] b'hallo'"), out);
});
t('PNG: pHYs mit 300 dpi', () => {
  const { Resvg } = require('@resvg/resvg-js');
  const m = Q.design.build('https://open.spotify.com/track/' + ID, {});
  const png = new Uint8Array(new Resvg(Q.render.toSvg(m, { fg: '#000', bg: '#fff' })).render().asPng());
  fs.writeFileSync('/tmp/qrc-dpi.png', Q.png.setDpi(png, 300));
  const out = execSync('python3 -c "from PIL import Image;im=Image.open(\'/tmp/qrc-dpi.png\');im.load();print(im.info.get(\'dpi\'))"').toString();
  assert.ok(/299\.9|300/.test(out), out);
});
t('Design: gleiche Eingabe → gleiches Muster; Startwert ändert es', () => {
  const c = 'https://open.spotify.com/track/' + ID;
  const a = Q.render.modulesPath(Q.design.build(c, {})), b = Q.render.modulesPath(Q.design.build(c, {}));
  const d = Q.render.modulesPath(Q.design.build(c, { seed: 1 }));
  assert.equal(a, b); assert.notEqual(a, d);
});
t('Design: Spotify-Link ergibt Version 6 bei H', () => assert.equal(Q.design.build('https://open.spotify.com/track/' + ID, {}).version, 6));
console.log(`\n${n} Tests bestanden`);
