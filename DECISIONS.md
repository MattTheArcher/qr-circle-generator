# Entscheidungen

Neue Einträge oben einfügen. Format:

```
## YYYY-MM-DD – Kurztitel
- **Entscheidung:** Was wurde entschieden?
- **Begründung:** Warum?
- **Verworfene Alternativen:** Was kam noch infrage, und warum nicht?
```

---

## 2026-10-03 – Repo öffentlich, Historie neu aufgesetzt
- **Entscheidung:** Das GitHub-Repo wird öffentlich (MIT-Lizenz). Vorher wurde die Historie durch einen einzigen
  sauberen Commit ersetzt (einmaliger Force-Push durch den Inhaber). Private Dateien liegen in `local/`
  (gitignored), z. B. das frühere Beispielbild des Vorbilds.
- **Begründung:** Das Beispielbild war ein privater QR-Code mit privatem Link und durfte auch in alten Commits
  nicht öffentlich werden. Vornamen in der Doku neutral formuliert.
- **Verworfene Alternativen:** Bild nur löschen (bliebe in der Historie abrufbar); Repo löschen und neu anlegen.

## 2026-10-03 – Vorgaben des Projektinhabers für Version 1
- **Entscheidung:** Eine HTML-Datei reicht (Technikwahl bestätigt). Fehlerkorrektur H bleibt. Abstand
  Standard **1 Modul**, Option 2 Module mit Hinweis „sicherer, besser lesbar“. Augen Standard **rund**,
  Option eckig mit Hinweis „sicherer“. Einzelmodus: Link einfügen. Serienmodus: CSV hochladen, Beispiel-CSV
  mitliefern. Standardinhalt: Spotify-Song-Links. Kein Logo. Farbe per Hex-Code.
- **Begründung:** Vorgabe des Projektinhabers (2026-10-03). Ersetzt den Standard „2 Module“ aus dem
  Eintrag „Designregeln“ darunter.
- **Verworfene Alternativen:** `.exe`; Logo in der Mitte.

## 2026-10-03 – Umsetzungsdetails Version 1
- **Entscheidung:**
  - Spotify-Links werden auf `https://open.spotify.com/<typ>/<22-Zeichen-ID>` gekürzt (ohne `?si=`,
    `intl-xx`, Text drumherum); `spotify:`-URIs werden umgewandelt; Kurzlinks (`spotify.link`) bleiben
    unverändert; Alben/Playlists erlaubt mit Warnung. Option „App-Link“ (`spotify:track:…`) in „Erweitert“
    als experimentell.
  - Deko-Muster deterministisch aus dem Inhalt (gleicher Link → gleiches Bild), „Neu würfeln“ ändert den
    Startwert; Filter gegen 3×3-Vollblöcke in der Deko.
  - Eingebauter Lesbarkeits-Test mit jsQR auf einem Bild mit 5 Pixeln pro Modul; vor dem Speichern eines
    unlesbaren Codes kommt eine Rückfrage.
  - PNG: ganze Pixel pro Modul (Breite wird auf das nächste Vielfache gerundet und angezeigt), 300 dpi im
    pHYs-Block, Obergrenze 6000 px. SVG: Beschriftung als Pfade (Liberation Sans), unabhängig von Schriften.
  - CSV: Trennzeichen `;`, `,` oder Tab automatisch; UTF-8 oder Windows-1252 (deutsches Excel);
    Spalten `nummer`/`link` (weitere Namen erkannt) oder ohne Kopfzeile; ZIP ohne Kompression mit
    `uebersicht.csv`.
- **Begründung:** Kürzere Links → kleinere QR-Version (V6 statt V8+) → robustere Codes. jsQR liest runde
  Augen zuverlässig (400/400 im Test), OpenCV nicht. ZIP-Kompression bringt bei PNG kaum etwas.
- **Verworfene Alternativen:** Großbuchstaben-URL für Alphanumerik-Modus (Spotify-IDs sind
  groß-/kleinschreibungsabhängig); zxing-wasm als Decoder (ca. 1 MB größer).

## 2026-10-03 – Designregeln aus dem Prototyp-Test
- **Entscheidung:** Fehlerkorrektur standardmäßig H; Abstand zwischen echtem Code und Deko-Modulen
  standardmäßig 2 Module, mindestens 1; Augenform wählbar (rund als Standard, eckig als „maximale
  Kompatibilität“); jede erzeugte Grafik wird vor dem Export automatisch dekodiert (Selbsttest).
- **Begründung:** Test mit 10 Zufallsmustern je Variante (`spike/spike.py`): ohne Abstand dekodiert ZXing
  nur 1/10 (M) bzw. 4/10 (H); ab 1 Modul Abstand 10/10. Runde Augen: ZXing 10/10, OpenCV 0/10; eckige
  Augen: beide 10/10. Das Vorbild (QR.io) nutzt ebenfalls H.
- **Verworfene Alternativen:** Volle Ruhezone von 4 Modulen (widerspricht dem Design, im Test nicht nötig);
  kein Abstand wie beim Vorbild (zu unzuverlässig).

## 2026-10-03 – Projekt-Setup und Technikwahl (Empfehlung)
- **Entscheidung:** Standardstruktur (CLAUDE.md, README, STATUS, DECISIONS, docs/). Technik-Empfehlung:
  eine selbständige HTML-Datei mit eingebettetem JavaScript und der MIT-lizenzierten QR-Bibliothek von
  Nayuki. (Später bestätigt, siehe oben.)
- **Begründung:** Läuft auf jedem Windows 10/11 per Doppelklick in Edge, offline, ohne Installation; keine
  SmartScreen-Warnung und keine Virenscanner-Fehlalarme wie bei unsignierten `.exe`-Dateien; SVG und PNG
  in beliebiger Auflösung lassen sich im Browser direkt erzeugen. Details: `docs/research-distribution.md`.
- **Verworfene Alternativen:** PyInstaller-`.exe` (häufige Fehlalarme, SmartScreen-Warnung, 15–30 MB);
  .NET-Framework-4.8-WinForms-`.exe` (klein, Laufzeit vorinstalliert, aber SmartScreen-Warnung ohne
  Signatur); Tauri/Electron (Toolchain-Aufwand, ebenfalls Signaturproblem). Eine `.exe`-Hülle bleibt als
  spätere Option, falls ausdrücklich gewünscht.
