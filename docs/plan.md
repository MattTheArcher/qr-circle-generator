# Plan

Stand: 2026-10-03. Grundlage: `research-qr-best-practices.md`, `research-distribution.md`, `spotify-links.md`.

**Fortschritt:** Phasen 0–3 erledigt (Version 1 in `dist/`). Vorgaben: siehe DECISIONS.md, Eintrag „Vorgaben des Projektinhabers für Version 1“.

## Zielbild
Eine Datei `qr-circle-generator.html`. Doppelklick, Inhalt eintippen, Vorschau sehen, „PNG speichern“ oder
„SVG speichern“ klicken. Oberfläche auf Deutsch, verständlich ohne Vorwissen; Fachbegriffe nur in einem
aufklappbaren Bereich „Erweitert“.

## Funktionsumfang (umgesetzt in Version 1)

**Einzelmodus:** Spotify-Link einfügen (wird geprüft und gekürzt), Nummer optional, Live-Vorschau,
Lesbarkeits-Anzeige, „PNG speichern“ / „SVG speichern“.

**Serienmodus:** CSV hineinziehen (`nummer;link`), Tabelle mit Status je Zeile, Klick zeigt Vorschau,
„Alle als ZIP speichern“ als PNG, SVG oder beides, plus `uebersicht.csv`. Beispiel-CSV in der App.

**Aussehen (für beide Modi):** Farbe und Hintergrund als Hex-Code (oder durchsichtig) mit Kontrastwarnung;
Augen rund (Standard) / eckig (sicherer); Abstand 1 Modul (Standard) / 2 Module (sicherer); Größe der Nummer;
„Neu würfeln“.

**Erweitert:** Inhalt Spotify / beliebiger Link oder Text; Spotify-Linkformat Web / App (experimentell);
Fehlerkorrektur (Standard H); Dichte des Musters.

**Export:** PNG ca. 1000 / 2000 / 4000 px oder eigene Breite (200–6000), ganze Pixel pro Modul, 300 dpi;
SVG mit Beschriftung als Pfade.

**Nicht umgesetzt (bewusst):** Logo (nicht gewünscht), Mindestversion, Ringstärke einstellbar.

## Architektur
- `src/core/qrcodegen.js`: Nayuki-Bibliothek (MIT, kompiliert aus TypeScript).
- `src/core/spotify.js`: Links erkennen, kürzen, prüfen.
- `src/core/design.js`: Modulmatrix + Deko (deterministisch, Filter gegen 3×3-Blöcke) → Formen-Modell
  (Modul-Läufe, Kreise/Ringe, Glyphen) in Moduleinheiten. Eine Quelle für SVG und PNG.
- `src/core/render.js`: Formen-Modell → SVG-Text bzw. Canvas.
- `src/core/glyphs.js`: Zeichen als Pfade (Liberation Sans), erzeugt mit `build/make-glyphs.py`.
- `src/core/csv.js`, `zip.js`, `png.js`: CSV-Import, ZIP-Schreiber, dpi im PNG.
- `src/ui/`: HTML-Vorlage, CSS, Bedienlogik; Lesbarkeits-Test mit `vendor/jsQR.js`.
- `build/build.js`: bettet alles in `dist/qr-circle-generator.html` ein.
- `test/`: Unit-Tests (Node), Browser-Test (Playwright), Lesbarkeits-Statistik (jsQR, zxing-cpp, OpenCV).

## Phasen
| Phase | Inhalt | Ergebnis / Abnahme |
|---|---|---|
| 0 ✓ | Recherche, Python-Prototyp | diese Dokumente, `spike/` |
| 1 ✓ | Render-Kern in JS (layout, decor, SVG, PNG) + Testlauf mit Decoder | erreicht: 400/400 Zufallscodes lesbar (jsQR und zxing-cpp) |
| 2 ✓ | Oberfläche Deutsch, Vorschau, Export, Selbsttest | Laie erzeugt ohne Erklärung einen Code wie das Vorbild |
| 3 ✓ | Build zu einer Datei, Browser-Test offline (Chromium); Test auf echtem Windows mit Edge steht noch aus | Doppelklick genügt, keine Warnung |
| 4 | Praxistest: Handys (iPhone, Android, Google Lens, ältere Geräte), Ausdruck in 2,5 / 4 / 8 cm | Testprotokoll in `docs/` |
| 5 | Verteilung: Release auf GitHub, optional GitHub Pages; Kurzanleitung mit Screenshots | fertige Datei + Anleitung |
| (6) | Optional: Druckbogen A4 (PDF), weitere Wünsche | nach Bedarf |

## Risiken
- **Runde Augen** werden nicht von jedem Decoder erkannt (OpenCV 0/10 im Test). Gegenmittel: Handy-Test in
  Phase 4, eckige Augen als Option, Selbsttest-Anzeige.
- **Canvas-Grenzen** bei sehr großen PNGs: in der Oberfläche auf 6000 px Breite begrenzt.
- **Decoder-Größe:** gelöst, jsQR (Apache-2.0) macht ca. 250 KB der 390 KB aus.
- **Große Serien:** 200 Codes à 2000 px dauern im Test ca. 20 s und ergeben ein ZIP von ca. 48 MB; bei sehr
  vielen Codes kleinere PNG-Größe oder SVG wählen.

## Offene Fragen
1. Spielt der Song nach dem Scan auf deinen Handys direkt ab (siehe `spotify-links.md`)?
2. Werden die Codes als Aufkleber gedruckt? Dann wäre ein Druckbogen (A4-PDF mit Schnittmarken) sinnvoll.
