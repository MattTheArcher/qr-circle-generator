# qr-circle-generator

## Ziel
Ein Generator für QR-Codes im kreisförmigen Design (Vorbild: runde QR-Codes von QR.io; ein Beispielbild liegt nur lokal in `local/`, nicht im Repo): echter QR-Code
in der Mitte, runde Finder-Augen, dekorative Module bis zum Kreisrand, Außenring und Nummer darunter.
Standardzweck: geteilte Spotify-Song-Links in Codes umwandeln. Läuft als eine HTML-Datei offline auf jedem
Windows-PC ohne Installation; Einzelmodus (Link einfügen) und Serienmodus (CSV hochladen → ZIP);
Export PNG (Größe wählbar, 300 dpi) und SVG.

## Technik
- Eine selbständige HTML-Datei `dist/qr-circle-generator.html`, klassische `<script>`-Blöcke (keine
  ES-Module: die laden nicht über `file://`), keine Netzwerkzugriffe, keine Webfonts.
- QR-Kern: Nayuki „QR Code generator library“ (MIT), `src/core/qrcodegen.js` = mit `tsc --target ES2017`
  kompiliertes `typescript-javascript/qrcodegen.ts` aus github.com/nayuki/QR-Code-generator.
- Lesbarkeits-Test in der App: jsQR (Apache-2.0), `vendor/jsQR.js` = `node_modules/jsqr/dist/jsQR.js`.
- Beschriftung als Pfade aus Liberation Sans (OFL): `src/core/glyphs.js`, erzeugt mit `build/make-glyphs.py`.
- Bauen: `npm install` (einmalig), dann `npm run build`
- Testen: `npm test` (Unit-Tests + Build + Browser-Test mit Playwright/Chromium; braucht Python mit
  `zxing-cpp`, `opencv-python-headless`, `pillow`, `cairosvg`). Lesbarkeits-Statistik: `npm run test:decode`.
- Nutzen: `dist/qr-circle-generator.html` doppelklicken.

## Ordnerstruktur
- `src/core/`: Logik ohne Oberfläche (läuft auch in Node, siehe `test/load-core.js`)
  - `spotify.js` Links prüfen/kürzen · `design.js` Kreis-Design → Formen-Modell · `render.js` SVG/Canvas
  - `csv.js` CSV-Import · `zip.js` ZIP + CRC32 · `png.js` dpi im PNG · `glyphs.js` · `qrcodegen.js`
- `src/ui/`: `index.html` (Vorlage), `style.css`, `app.js`
- `build/build.js`: bettet alles in `dist/qr-circle-generator.html` ein (wird mit committet)
- `examples/beispiel-serie.csv`: Beispiel für den Serienmodus (auch in der App herunterladbar)
- `test/`: Unit-, Browser- und Lesbarkeits-Tests · `vendor/`: jsQR · `spike/`: alter Python-Prototyp
- `docs/`: Recherche (`research-*.md`, `spotify-links.md`), `plan.md`
- `local/`: private Dateien, nur auf dem eigenen Rechner (in `.gitignore`)

## Konventionen
- Dateinamen englisch; Doku und Commit-Nachrichten auf Deutsch; Code und Bezeichner englisch.
- Oberfläche der Anwendung auf Deutsch, einfache Sprache für Laien.
- Keine Umlaute oder Leerzeichen in Datei- und Ordnernamen.
- Datumsformat YYYY-MM-DD, Datum per Shell ermitteln (`date +%F`).
- Standards (vom Projektinhaber festgelegt): Fehlerkorrektur H; Abstand 1 Modul (Option 2 = „sicherer“);
  runde Augen (Option eckig = „sicherer“); Inhalt Spotify. Nicht ohne Rücksprache ändern.
- Nach jeder Änderung an `src/`: `npm run build` und `npm test`; `dist/` mit committen.

## Arbeitsregeln
Du hast zwischen Sitzungen kein Gedächtnis. STATUS.md und DECISIONS.md sind die einzige Brücke zur nächsten Sitzung; schreib sie so, dass jemand ohne Vorwissen weiterarbeiten kann.

1. Zu Beginn jeder Sitzung STATUS.md und DECISIONS.md lesen.
2. Wichtige Entscheidungen sofort in DECISIONS.md eintragen (Format steht dort).
3. Wenn ich die Sitzung beende (Skill `end-session`) oder nach einem größeren Meilenstein: STATUS.md aktualisieren und committen.
4. Niemals Passwörter, API-Keys oder Tokens ins Repo. Sie gehören in `.env`; neue Variablennamen in `.env.example` eintragen.
5. Vor jedem Commit `git status` prüfen; keine Secrets, Temp- oder Build-Dateien committen (Ausnahme: `dist/qr-circle-generator.html`).
6. GitHub: Nicht vorab behaupten, keinen Zugriff zu haben. Befehl ausführen, nach dem Ergebnis urteilen, bei Fehlern die exakte Meldung zeigen. Kein `--force`.
7. Git aus der Cloud-Sitzung: Commit und Push über das MCP-Tool `project_git` mit `repo="qr-circle-generator"`
   (läuft auf dem Windows-Rechner mit der GitHub-Anmeldung des Inhabers). Remote: https://github.com/MattTheArcher/qr-circle-generator
8. Entwickeln und Testen in der Cloud-Sitzung (Node, Chromium, Python); auf dem Windows-Rechner liegen nur die Dateien.
9. Das Repo ist öffentlich: keine privaten Daten (Namen, private Links, eigene Fotos/Codes) committen; so etwas gehört nach `local/`.
