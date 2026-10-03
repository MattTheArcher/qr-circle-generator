# Recherche: Auslieferung als Standalone-Anwendung für Windows

Stand: 2026-10-03. Anforderung: Läuft auf jedem Windows-PC ohne Installation und ohne Vorkenntnisse;
exportiert PNG (Auflösung wählbar) und SVG.

## Empfehlung
**Eine einzige HTML-Datei** (`qr-circle-generator.html`) mit allem eingebettet (JavaScript, QR-Bibliothek,
Schrift-Pfade für die Ziffern). Doppelklick öffnet sie im Standardbrowser, auf Windows 10/11 ist Microsoft Edge
immer vorhanden. Funktioniert offline, braucht keine Rechte und löst keine SmartScreen-Warnung aus.

Optional zusätzlich dieselbe Datei auf GitHub Pages veröffentlichen: Dann reicht ein Link.

## Optionen im Vergleich

| Option | Installation nötig? | Warnungen beim Start | Größe | Aufwand | Bewertung |
|---|---|---|---|---|---|
| **HTML-Datei** (empfohlen) | nein, Edge ist vorinstalliert | keine | < 200 KB | gering | beste Nutzerfreundlichkeit |
| Webseite (GitHub Pages) | nein | keine | – | gering | ideal als Zusatz, braucht Internet beim ersten Aufruf |
| .NET Framework 4.8 WinForms-`.exe` | nein, 4.8/4.8.1 auf Win 10 (ab 1903) und Win 11 vorinstalliert | SmartScreen „Der Computer wurde geschützt“, solange unsigniert | < 1 MB | mittel | gute `.exe`-Variante, falls `.exe` Pflicht |
| Python + PyInstaller (`--onefile`) | nein | SmartScreen; häufige Virenscanner-Fehlalarme | 15–30 MB | mittel | nicht empfohlen |
| Tauri / Electron | nein (Tauri nutzt vorinstalliertes WebView2) | SmartScreen, solange unsigniert | 3–10 MB / > 80 MB | hoch | lohnt sich hier nicht |

## Begründung im Einzelnen

### SmartScreen und Signierung (betrifft jede `.exe`)
- Unsignierte Programme zeigen „Der Computer wurde durch Windows geschützt“; Nutzer müssen „Weitere
  Informationen → Trotzdem ausführen“ klicken. Für Laien ist das die größte Hürde (Microsoft Learn).
- EV-Zertifikate umgehen SmartScreen seit 2024 nicht mehr; Reputation entsteht über Downloads (Microsoft Learn).
- Kosten: Azure Artifact Signing ca. 9,99 $/Monat; OV-Zertifikat 150–300 $/Jahr. Microsoft nennt Artifact
  Signing für Einzelpersonen nur in USA/Kanada; ein Erfahrungsbericht (Melatonin, April 2026) meldet, dass
  sich Selbständige aus der EU anmelden können. **Widersprüchlich, bei Bedarf prüfen.**
- SignPath Foundation signiert qualifizierte Open-Source-Projekte kostenlos.
- Eine HTML-Datei umgeht das ganze Thema.

### PyInstaller
- Gleicher Bootloader in allen PyInstaller-Programmen, Entpacken in Temp-Ordner: Virenscanner melden das oft
  als verdächtig; Signieren hilft nur teilweise. (Quelle ist ein Anbieterblog mit eigenem Produkt, die
  Kernaussage deckt sich aber mit vielen Berichten in Foren und Issue-Trackern.)

### .NET Framework 4.8
- Laut Microsoft ist .NET Framework 4.8 auf Windows 10 ab Version 1903 und 4.8.1 auf Windows 11 ab 22H2
  vorinstalliert. Eine dagegen kompilierte WinForms-`.exe` ist klein und braucht keine Zusatzinstallation.
  Bleibt das Signaturproblem. Das ist der Plan B, falls eine `.exe` ausdrücklich gewünscht ist.

### Technische Punkte für die HTML-Variante
- **ES-Module laden nicht über `file://`** (CORS-Fehler). Deshalb wird alles per Build-Skript in ein einziges
  klassisches `<script>` eingebettet; keine externen Dateien, kein CDN.
- **Export:** SVG wird als Text erzeugt und als Datei heruntergeladen; PNG über ein Canvas in der gewählten
  Größe (`canvas.toBlob`). Browser begrenzen die Canvas-Größe; für gängige Größen bis 8000 px kein Problem,
  Obergrenze im Prototyp prüfen und in der Oberfläche begrenzen.
- **Speichern:** Standardmäßig landen Dateien im Download-Ordner; in Edge/Chrome kann zusätzlich der
  „Speichern unter“-Dialog genutzt werden (File System Access API), mit Rückfall auf normalen Download.
- **Weitergabe:** Die Datei kann per E-Mail, USB-Stick oder Link verteilt werden. Beim Öffnen einer
  heruntergeladenen HTML-Datei erscheint normalerweise keine Warnung; im Test auf einem frischen Windows
  bestätigen.

## Bibliotheken
- **Nayuki QR Code generator library** (MIT): klein, gut dokumentiert, alle 40 Versionen, alle Level, Boost ECL,
  automatische Maskenwahl, Segment-Modi; gibt die Modulmatrix aus, das Design zeichnen wir selbst. Empfohlen.
- danielgjackson/qrcodejs (BSD-2-Clause): kann runde Module und Augen sowie SVG/BMP/PNG, aber kein Kreis-Design
  mit Deko-Ring; als Referenz für runde Augen interessant.
- qr-code-styling (MIT, npm): viele Stile, aber keine Deko außerhalb des Rasters; nicht nötig.
- Decoder für den Selbsttest: z. B. zxing-wasm (Port von zxing-cpp) oder jsQR; Lizenz und Größe in Phase 1 prüfen.

## Quellen
- Microsoft Learn, SmartScreen-Reputation: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation
- Microsoft Learn, Code-Signing-Optionen: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
- Melatonin, Azure Artifact Signing: https://melatonin.dev/blog/code-signing-on-windows-with-azure-trusted-signing/
- SignPath Foundation: https://signpath.org/
- Microsoft Learn, .NET Framework auf Windows 10: https://learn.microsoft.com/dotnet/framework/install/on-windows-10
- Microsoft Learn, .NET Framework auf Windows 11: https://learn.microsoft.com/dotnet/framework/install/on-windows-11
- Eli Bendersky, ES-Module und file://: https://eli.thegreenplace.net/2023/es-module-imports-in-nodejs-and-the-browser/
- PyInstaller und Virenscanner: https://beatsyncpro.ai/blog/why-pyinstaller-gets-antivirus-flags
- Nayuki, QR Code generator library: https://www.nayuki.io/page/qr-code-generator-library
- danielgjackson/qrcodejs: https://github.com/danielgjackson/qrcodejs
- qr-code-styling: https://www.npmjs.com/package/qr-code-styling
