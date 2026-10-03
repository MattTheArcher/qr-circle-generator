# Status

Zuletzt aktualisiert: 2026-10-03

## Aktueller Stand
Version 1 ist fertig: `dist/qr-circle-generator.html` (ca. 390 KB) läuft offline per Doppelklick und
kann Einzelmodus (Spotify-Link einfügen) und Serienmodus (CSV → ZIP) mit Export als PNG (wählbare Größe,
300 dpi) und SVG. Alle automatischen Tests sind grün (20 Unit-Tests, 20 Browser-Prüfungen, 400 von 400
Zufallscodes lesbar mit jsQR und zxing). Noch nicht gemacht: Test mit echten Handys und auf einem echten
Windows-PC.

## Zuletzt erledigt
- Kern: Spotify-Link-Prüfung/Kürzung, Kreis-Design, SVG/PNG, CSV-Import, ZIP, dpi im PNG
- Oberfläche (Deutsch): Einzel- und Serienmodus, Hex-Farben, Augen rund/eckig, Abstand 1/2, Nummerngröße,
  „Neu würfeln“, Erweitert (Inhaltstyp, App-Link, Fehlerkorrektur, Dichte), eingebauter Lesbarkeits-Test
- Beispiel-CSV `examples/beispiel-serie.csv`
- Tests: `test/unit.js`, `test/e2e.js` (Chromium, offline), `test/decode-matrix.js`, `test/stress-zxing.py`
- Recherche Spotify-Links: `docs/spotify-links.md`

## Nächste Schritte (priorisiert)
1. Datei auf Windows öffnen, einen Code drucken und mit mehreren Handys scannen (iPhone-Kamera,
   Android-Kamera, Google Lens). Dabei prüfen: Öffnet sich Spotify? Spielt der Song sofort oder erst
   nach Tippen auf Play? Zusätzlich die Option „App-Link“ (Erweitert) testen.
2. Ergebnisse in `docs/handy-test.md` festhalten; ggf. Standards anpassen.
3. Echte Spotify-Links in die Beispiel-CSV übernehmen (die jetzigen IDs stammen aus der Spotify-Doku und
   wurden nicht auf Abspielbarkeit geprüft).
4. Optional: Druckbogen (mehrere Codes auf A4 als PDF), falls die Codes als Aufkleber gedruckt werden.

## Offene Fragen / Blocker
- Spielt Spotify nach dem Scan automatisch ab? Laut Spotify öffnet ein open.spotify.com-Link die App beim
  Song; ein Parameter für automatisches Abspielen ist nicht dokumentiert. Nur ein Handy-Test klärt das.
