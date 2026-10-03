# QR-Kreis-Generator

Macht aus Spotify-Song-Links runde QR-Codes mit Nummer darunter – einzeln oder als ganze Serie aus einer
CSV-Datei. Eine einzige Datei, läuft ohne Installation und ohne Internet auf jedem Windows-PC.

## So benutzt du es
1. `dist/qr-circle-generator.html` doppelklicken. Die Datei öffnet sich im Browser (Edge ist auf jedem
   Windows dabei). Die Datei kann auf einen USB-Stick oder per E-Mail weitergegeben werden.
2. **Einzeln:** In Spotify beim Song auf *Teilen → Link kopieren*, in das Feld einfügen, optional eine
   Nummer eintragen. Der Link wird automatisch gekürzt (z. B. ohne `?si=…`).
3. **Serie aus CSV:** Oben auf *Serie aus CSV*, Datei hineinziehen. Aufbau siehe
   `examples/beispiel-serie.csv` (auch in der App unter *Beispiel-CSV herunterladen*):
   ```
   nummer;link
   1;https://open.spotify.com/track/…
   2;https://open.spotify.com/track/…
   ```
   In Excel als *CSV (Trennzeichen-getrennt)* speichern. Ergebnis ist eine ZIP-Datei mit einem Bild pro
   Zeile (Dateiname = Nummer) und einer `uebersicht.csv`.
4. Aussehen: Farbe und Hintergrund als Hex-Code (z. B. `#1A3D7C`), runde oder eckige Augen, Abstand
   1 oder 2 Module. Eckige Augen und 2 Module sind sicherer lesbar.
5. **PNG speichern** (Größe wählbar, mit 300 dpi für den Druck) oder **SVG speichern** (verlustfrei
   skalierbar). Die grüne Anzeige „Lesbar“ bedeutet: Der eingebaute Scanner hat den Code erkannt.

Vor dem Drucken einer großen Serie einen Code ausdrucken und mit mehreren Handys testen.

## Entwicklung
Voraussetzungen: Node.js 22, für die Tests zusätzlich Python 3 mit `zxing-cpp opencv-python-headless pillow cairosvg`.

```
npm install
npm run build      # erzeugt dist/qr-circle-generator.html
npm test           # Unit-Tests, Build, Browser-Test
npm run test:decode  # Lesbarkeits-Statistik über viele Zufallscodes
```

## Projektstand
Aktueller Stand: [STATUS.md](STATUS.md) · Entscheidungen: [DECISIONS.md](DECISIONS.md) ·
Plan: [docs/plan.md](docs/plan.md)

## Lizenz
Eigener Code: MIT-Lizenz (siehe [LICENSE](LICENSE)). Enthaltene Fremdteile:
QR Code generator library (Project Nayuki, MIT) · jsQR (Cosmo Wolfe, Apache-2.0, `vendor/jsQR-LICENSE.txt`) ·
Zeichenformen aus Liberation Sans (SIL Open Font License 1.1). Spotify ist eine Marke von Spotify AB;
dieses Werkzeug steht in keiner Verbindung zu Spotify.
