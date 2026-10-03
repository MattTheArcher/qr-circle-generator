# Recherche: Best Practices für robuste QR-Codes

Stand: 2026-10-03. Quellen am Ende; eigene Messungen sind als solche gekennzeichnet.

## Kurzfassung (Regeln für dieses Projekt)
1. **Fehlerkorrektur H** als Standard, weil das Design (runde Augen, Deko direkt am Code) Lesereserve kostet.
2. **Mindestens 1 Modul Abstand** zwischen echtem Code und Deko. Standard 1 (Vorgabe des Projektinhabers), Option 2 als „sicherer“. Ohne Abstand scheitert das Lesen oft.
3. **Inhalt kurz halten**: kleinere Version, größere Module, bessere Lesbarkeit. Version anzeigen und ab Version 10 warnen.
4. **Dunkel auf hell**, hoher Kontrast, keine Invertierung.
5. **Runde Augen sind ein Kompatibilitätsrisiko**: eckige Augen als Option „maximale Kompatibilität“ anbieten, Handy-Test Pflicht.
6. **Selbsttest**: Jede erzeugte Grafik vor dem Export automatisch dekodieren und das Ergebnis mit der Eingabe vergleichen.
7. **SVG für Druck**, PNG mit ganzzahligen Pixeln pro Modul für scharfe Kanten.
8. **Statische Codes**: Der Inhalt steht direkt im Code, nicht hinter einem Kurzlink-Dienst eines Anbieters.

## 1. Fehlerkorrektur (Error Correction Level)
QR-Codes nutzen Reed-Solomon-Fehlerkorrektur in vier Stufen. Laut Denso Wave (Erfinder des QR-Codes):

| Level | stellt ca. wieder her | typischer Einsatz |
|---|---|---|
| L | 7 % | saubere Umgebung, viele Daten |
| M | 15 % | häufigste Wahl, Standard vieler Generatoren |
| Q | 25 % | verschmutzungsgefährdete Umgebung |
| H | 30 % | Logos/Designelemente, raue Umgebung |

Preis einer höheren Stufe: mehr Module, also eine größere Version bei gleichem Inhalt. Gemessen mit `segno`
(Version = Rastergröße, V2 = 25×25, V4 = 33×33, V5 = 37×37 Module):

| Länge Link | Level M | Level H |
|---|---|---|
| 20 Zeichen | V2 | V3 |
| 25–34 Zeichen | V2–V3 | V4 |
| 35–44 Zeichen | V3–V4 | V5 |
| 60 Zeichen | V4 | V7 |
| 80 Zeichen | V5 | V8 |

Das Vorbild, ein runder Code von QR.io (Inhalt: ein 20 Zeichen langer `qr.fm`-Kurzlink), ist laut Dekodierung mit ZXing Level H; das Raster
misst 33 Module, also Version 4. Bei Level H und 20 Zeichen wäre auch V3 möglich; vermutlich hat der Hersteller
eine Mindestversion für die Optik festgelegt. **Folgerung:** Mindestversion (z. B. 4) als Option vorsehen,
damit kurze Inhalte nicht zu grobe Codes ergeben.

Zusätzlich: „Boost ECL“ (Nayuki-Bibliothek) hebt die Fehlerkorrektur an, wenn die Version es ohne Größenzuwachs
erlaubt. Für dieses Projekt sinnvoll.

## 2. Ruhezone (Quiet Zone)
- ISO/IEC 18004 verlangt **4 Module** leeren Rand auf allen Seiten (Denso Wave, QR Code Generator, QRStuff).
- GS1 (Handel) behandelt das als absolute Pflicht; schon feine Linien im Rand gelten als Risiko.
- Das Kreis-Design verletzt diese Regel bewusst: Deko-Module stoßen an den Code. Scanner finden den Code
  trotzdem über die drei Finder-Augen; die Ruhezone hilft vor allem, das Raster sauber abzugrenzen.

**Eigene Messung** (`spike/spike.py`, Version 4, 10 zufällige Deko-Muster je Zeile, ZXing-cpp als Decoder):

| Abstand Code ↔ Deko | Level M | Level H |
|---|---|---|
| 0 Module | 1/10 gelesen | 4/10 gelesen |
| 1 Modul | 10/10 | 10/10 |
| 2 Module | 10/10 | 10/10 |
| 4 Module | 10/10 | 10/10 |

**Folgerung:** Abstand einstellbar, Minimum 1 (Standard 1 laut Vorgabe, 2 als sicherere Option). Das Vorbild hat 0 Abstand und funktioniert,
was nach der Messung eher Glück des konkreten Musters ist.

Weitere Regel für die Deko: Zufallsmuster dürfen keine augenähnlichen Strukturen bilden (Verhältnis
1:1:3:1:1 dunkel/hell), sonst kann ein Scanner ein falsches Auge finden. Der Generator sollte solche Stellen
erkennen und neu würfeln; der Selbsttest fängt den Rest ab.

## 3. Finder-Augen und Formen
- Scanner suchen die drei Augen über das Hell-Dunkel-Verhältnis 1:1:3:1:1 entlang von Bildzeilen. Konzentrische
  Kreise erhalten dieses Verhältnis durch die Mitte, deshalb funktionieren runde Augen grundsätzlich.
- Augen, Ausrichtungsmuster (Alignment) und Timing-Linien nicht überdecken (QR Code Generator, Regel 5).
- QR.io weist selbst darauf hin, dass runde Codes mit älteren Scannern nicht immer funktionieren.

**Eigene Messung:** Runde Augen, Abstand 1–4: ZXing 10/10, **OpenCV 0/10**. Eckige Augen mit gleicher Deko:
beide 10/10. Ein normaler QR-Code: beide lesen ihn. Das Vorbild: ZXing liest es, OpenCV nicht.
**Folgerung:** Runde Augen als Standard (das ist der gewünschte Look, und die verbreiteten Scanner auf
ZXing-/ML-Basis kommen klar), aber eckige Augen als Option anbieten und vor dem Einsatz auf echten Handys
testen (iPhone-Kamera, Android-Kamera, Google Lens, ältere Geräte).

## 4. Inhalt und Datenmenge
- Kurz ist robust: weniger Daten, kleinere Version, größere Module (QR Code Generator, Regel 7).
- Großbuchstaben-URLs (`HTTPS://EXAMPLE.ORG/ABC`) passen in den kompakteren Alphanumerik-Modus und sparen
  rund 30 % Bits (ImperialViolet). Nur möglich, wenn der Pfad groß geschrieben funktionieren darf; als
  optionaler Hinweis, nicht automatisch.
- **Statisch vs. dynamisch:** Das Vorbild verweist auf `qr.fm`, den Kurzlink-Dienst von QR.io (laut
  urlert). Solche dynamischen Codes hängen am Abo des Anbieters. Unser Generator schreibt den Inhalt direkt in
  den Code. Wer ein später änderbares Ziel will, nutzt einen eigenen Kurzlink.

## 5. Größe und Druck
- Modulbreite für Handy-Scan im Druck etwa **0,4–0,5 mm**; Faustregel Leseabstand ≈ 10 × Seitenlänge
  des Codes (QR Code Generator, Regel 3).
- Für das Kreis-Design gilt: Kreisdurchmesser ≈ Rasterbreite × 1,41 + Rand. Bei Version 4 (33 Module) und
  0,5 mm pro Modul: Code ca. 16,5 mm, Kreis ca. 24–25 mm. **Empfehlung in der App:** Druckgröße in mm anzeigen
  und unter ca. 2,5 cm Kreisdurchmesser warnen.
- Denso Wave rechnet die Modulgröße aus Druckerauflösung und Punkten pro Modul (z. B. 400 dpi, 4 Punkte
  = 0,254 mm) – relevant für Etikettendrucker.

## 6. Farbe und Kontrast
- Dunkle Module auf hellem Grund, Leuchtdichte-Kontrast mindestens etwa 40 %; keine invertierten Codes
  (QR Code Generator, Regel 4). Die App erlaubt Farben, warnt aber bei zu wenig Kontrast oder Invertierung.

## 7. Export
- **SVG** für Druck und Weiterverarbeitung (verlustfrei skalierbar).
- **PNG** in wählbarer Breite. Für scharfe Kanten die Pixel pro Modul ganzzahlig wählen (Größe intern auf das
  nächste Vielfache runden und anzeigen) und Kantenglättung bei Quadraten vermeiden.
- Die Nummer unter dem Kreis liegt außerhalb des Codes und stört nicht. Im SVG die Ziffern als Pfade
  ausgeben, damit die Schrift auf jedem Rechner gleich aussieht.
- Optional: Druckauflösung (dpi) im PNG hinterlegen, damit Word/Druckprogramme die richtige Größe übernehmen.

## 8. Testen
- Vor dem Einsatz mit mehreren Geräten und Apps sowie bei unterschiedlichem Licht testen (QR Code Generator,
  Regel 10).
- In der App: eingebauter Decoder prüft jede Grafik (Selbsttest-Anzeige „lesbar / nicht lesbar“).
- In der Entwicklung: automatischer Test über viele Zufallsinhalte und Muster.

## 9. Messungen mit der fertigen Version 1 (2026-10-03)
Testcodes: Spotify-Links mit zufälligen IDs (Version 6, Level H), je 50 pro Variante, gerendert aus dem
SVG der App (`npm run test:decode`).

**Saubere Bilder** (6 und 12 Pixel pro Modul): jsQR 400/400, zxing-cpp 400/400. OpenCV: runde Augen 0/200,
eckige Augen 192/200.

**Kamera-ähnliche Störungen** (`test/stress-zxing.py`, zxing-cpp; Perspektive, Drehung bis 25°,
Unschärfe, Rauschen, Helligkeitsverlauf; Stufe 3 = sehr starke Störung):

| Variante | Stufe 1 | Stufe 2 | Stufe 3 |
|---|---|---|---|
| rund, Abstand 1 | 76 % | 79 % | 7 % |
| rund, Abstand 2 | 76 % | 82 % | 4 % |
| eckig, Abstand 1 | 100 % | 98 % | 24 % |
| eckig, Abstand 2 | 100 % | 100 % | 14 % |

Einzeln getestet: Drehung (bis 45°), Verkleinerung auf 4 Pixel pro Modul und Unschärfe stören runde Augen
nicht (50/50). Der Verlust entsteht bei **unregelmäßiger Perspektive** (schräg gehaltenes Handy): runde Augen
78–96 %, eckige 100 %. Das Vorbild von QR.io verhält sich gleich (17/20 bei derselben Perspektive), unser
Design ist also nicht schlechter als das Vorbild. Handy-Scanner (Apple, Google ML Kit) sind meist robuster
als zxing-cpp; ein echter Handy-Test steht noch aus.

**Folgerung:** Der Hinweis „eckig = sicherer“ ist durch Messungen belegt. Beim Abstand ist der Unterschied
zwischen 1 und 2 Modulen in diesen Tests klein; 2 Module entsprechen eher der Norm (Ruhezone) und bleiben
als „sicherer“ gekennzeichnet.

## Quellen
- Denso Wave, Error Correction: https://www.qrcode.com/en/about/error_correction.html
- Denso Wave, Code-Größe und Ruhezone: https://www.qrcode.com/en/howto/code.html
- QR Code Generator, 10 Design Rules: https://www.qr-code-generator.com/blog/qr-code-design-rules/
- QRStuff, GS1 Quiet Zone: https://www.qrstuff.com/feeds/blog/gs1-qr-code-quiet-zone-4-modules
- QR.io, Circular QR Code: https://qr.io/blog/circular-qr-code
- urlert, Domain qr.fm: https://www.urlert.com/domains/qr.fm
- ImperialViolet, QR-Encoding von URLs: https://www.imperialviolet.org/2021/08/26/qrencoding.html
- Nayuki, QR Code generator library: https://www.nayuki.io/page/qr-code-generator-library
- Eigene Messungen: `spike/spike.py` (segno, Pillow, zxing-cpp, OpenCV), 2026-10-03
