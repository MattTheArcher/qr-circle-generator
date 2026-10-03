// End-to-End-Test der fertigen Datei im echten Browser (Chromium), offline über file://.
// Aufruf: node test/e2e.js [Ausgabeordner]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const OUT = process.argv[2] || '/tmp/qrc-e2e';
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const FILE = 'file://' + path.join(__dirname, '..', 'dist', 'qr-circle-generator.html');
const ID = '6rqhFgbbKwnb9MLmUQDhG6';
const zx = (f) => execSync(`python3 -c "import zxingcpp,cv2,sys;print('|'.join(b.text for b in zxingcpp.read_barcodes(cv2.imread(sys.argv[1]))))" ${f}`).toString().trim();
const check = (cond, msg) => { if (!cond) { console.error('FEHLER:', msg); process.exitCode = 1; } else console.log('ok -', msg); };

(async () => {
  const browser = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1360, height: 900 } });
  const requests = [];
  ctx.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) requests.push(r.url()); });
  await ctx.route(/^https?:/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.dismiss());
  await page.goto(FILE);
  await page.screenshot({ path: `${OUT}/01-leer.png` });
  check(await page.locator('#save-png').isDisabled(), 'Speichern ist ohne Link gesperrt');

  // Einzelmodus
  await page.fill('#single-input', `https://open.spotify.com/intl-de/track/${ID}?si=0123456789abcdef`);
  await page.fill('#single-label', '228');
  await page.waitForFunction(() => document.getElementById('selftest').classList.contains('ok'), null, { timeout: 5000 });
  check(true, 'Selbsttest meldet lesbar');
  const msgs = await page.locator('#single-messages').innerText();
  check(msgs.includes(`Im Code steht: https://open.spotify.com/track/${ID}`), 'Link wurde gekürzt angezeigt');
  await page.screenshot({ path: `${OUT}/02-einzeln.png` });
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save-png')]);
  await dl.saveAs(`${OUT}/einzeln.png`);
  check(dl.suggestedFilename() === 'qr-228.png', 'PNG-Dateiname qr-228.png');
  check(zx(`${OUT}/einzeln.png`) === `https://open.spotify.com/track/${ID}`, 'exportiertes PNG ist mit zxing lesbar');
  const dpi = execSync(`python3 -c "from PIL import Image;im=Image.open('${OUT}/einzeln.png');print(im.size, round(im.info['dpi'][0]))"`).toString().trim();
  check(/ 300$/.test(dpi), 'PNG hat 300 dpi und Größe ' + dpi);
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save-svg')]);
  await dl.saveAs(`${OUT}/einzeln.svg`);
  execSync(`python3 -c "import cairosvg" 2>/dev/null || pip install -q --break-system-packages cairosvg`);
  execSync(`python3 -c "import cairosvg;cairosvg.svg2png(url='${OUT}/einzeln.svg',write_to='${OUT}/einzeln-svg.png',output_width=1500,background_color='white')"`);
  check(zx(`${OUT}/einzeln-svg.png`) === `https://open.spotify.com/track/${ID}`, 'exportiertes SVG ist (über cairosvg gerendert) lesbar');

  // Varianten: eckig, Abstand 2, Farbe per Hex, durchsichtig
  await page.check('input[name="eyes"][value="square"]');
  await page.check('input[name="gap"][value="2"]');
  await page.fill('#fg-hex', '#1a3d7c');
  await page.waitForFunction(() => document.getElementById('selftest').classList.contains('ok'));
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save-png')]);
  await dl.saveAs(`${OUT}/eckig-blau.png`);
  check(zx(`${OUT}/eckig-blau.png`).endsWith(ID), 'eckig + Abstand 2 + Farbe #1A3D7C lesbar');
  const px = execSync(`python3 -c "from PIL import Image;im=Image.open('${OUT}/eckig-blau.png').convert('RGB');from collections import Counter;print(Counter(im.getdata()).most_common(2))"`).toString();
  check(px.includes('(26, 61, 124)'), 'Vordergrundfarbe im PNG ist #1A3D7C');
  await page.screenshot({ path: `${OUT}/03-eckig-blau.png` });
  await page.fill('#fg-hex', '#dddddd');
  await page.waitForTimeout(400);
  check((await page.locator('#color-messages').innerText()).includes('Kontrast'), 'Kontrastwarnung bei hellgrau');
  await page.fill('#fg-hex', '#000000');
  await page.check('input[name="eyes"][value="round"]');
  await page.check('input[name="gap"][value="1"]');

  // Fehlerfall
  await page.fill('#single-input', 'https://www.youtube.com/watch?v=abc');
  await page.waitForTimeout(400);
  check((await page.locator('#single-messages').innerText()).includes('Kein Spotify-Link'), 'Fehlermeldung bei fremdem Link');
  check(await page.locator('#save-png').isDisabled(), 'Speichern gesperrt bei ungültigem Link');

  // Serienmodus
  await page.click('#tab-series');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download-example')]);
  await dl.saveAs(`${OUT}/beispiel.csv`);
  check(fs.readFileSync(`${OUT}/beispiel.csv`, 'utf8').startsWith('﻿nummer;link'), 'Beispiel-CSV herunterladbar');
  await page.setInputFiles('#csv-file', path.join(__dirname, '..', 'examples', 'beispiel-serie.csv'));
  await page.waitForSelector('#series-body tr');
  check((await page.locator('#series-body tr').count()) === 5, 'CSV: 5 Einträge geladen');
  await page.waitForFunction(() => document.getElementById('selftest').classList.contains('ok'));
  await page.screenshot({ path: `${OUT}/04-serie.png` });
  await page.click('label:has(input[name="seriesFormat"][value="both"])');
  await page.selectOption('#png-size', '1000');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save-zip')]);
  await dl.saveAs(`${OUT}/serie.zip`);
  await page.waitForFunction(() => !document.getElementById('save-zip').disabled);
  await page.screenshot({ path: `${OUT}/05-serie-fertig.png` });
  const zres = execSync(`cd ${OUT} && rm -rf z && mkdir z && cd z && python3 -c "import zipfile;z=zipfile.ZipFile('../serie.zip');print(z.testzip());z.extractall('.');print(sorted(z.namelist()))"`).toString();
  check(zres.startsWith('None'), 'ZIP ist gültig: ' + zres.trim().split('\n')[1]);
  let all = true;
  for (let i = 1; i <= 5; i++) {
    const t = zx(`${OUT}/z/${i}.png`);
    if (!/^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/.test(t)) { all = false; console.error('  nicht lesbar:', i, t); }
  }
  check(all, 'alle 5 PNGs aus dem ZIP mit zxing lesbar und gekürzt');
  const report = fs.readFileSync(`${OUT}/z/uebersicht.csv`, 'utf8');
  check(report.split('\r\n').filter(Boolean).length === 6 && !report.includes('NEIN'), 'uebersicht.csv vollständig, alle lesbar');

  // Mobile Breite
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${OUT}/06-mobil.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflow, 'kein waagrechtes Scrollen bei 390 px');

  check(errors.length === 0, 'keine JavaScript-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  check(requests.length === 0, 'keine Netzwerkzugriffe' + (requests.length ? ': ' + requests.join(', ') : ''));
  await browser.close();
})();
