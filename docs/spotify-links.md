# Recherche: Spotify-Links im QR-Code

Stand: 2026-10-03.

## Linkformate, die beim Teilen entstehen
| Format | Beispiel | Behandlung im Generator |
|---|---|---|
| Web-Link mit Tracking | `https://open.spotify.com/track/<ID>?si=<16 Zeichen>` | auf `https://open.spotify.com/track/<ID>` gekürzt |
| Web-Link mit Sprachpräfix | `https://open.spotify.com/intl-de/track/<ID>` | Präfix entfernt |
| Spotify-URI | `spotify:track:<ID>` | in Web-Link umgewandelt (oder bleibt bei Option „App-Link“) |
| Kurzlink | `https://spotify.link/<Code>` | unverändert übernommen (ohne Parameter) |

- Spotify-IDs sind Base-62, 22 Zeichen (Spotify-Entwicklerdoku). Groß-/Kleinschreibung zählt, deshalb
  kein Großbuchstaben-Trick für einen kleineren Code.
- Seit etwa Anfang 2023 teilt die Spotify-App teils Kurzlinks über `spotify.link`; sie lassen sich nicht ohne
  Internetabfrage auflösen (Spotify Community). Der Generator übernimmt sie daher, wie sie sind.
- Der gekürzte Link (53 Zeichen) passt bei Fehlerkorrektur H in Version 6 (41 × 41 Module). Mit `?si=…`
  wären es über 70 Zeichen und Version 8 oder größer.

## Spielt der Song nach dem Scan sofort?
- Spotify-Doku: Ein open.spotify.com-Link öffnet, wenn die App installiert ist, die App und „navigiert zur
  angefragten Ressource“ – also zur Song-Seite. Von automatischem Abspielen steht dort nichts.
- Einen offiziellen Parameter für automatisches Abspielen (z. B. `autoplay`) konnte ich nicht finden.
- In der Spotify-Community wird berichtet, dass Spotify-Codes (das eigene Barcode-Format, gescannt in der
  Spotify-App) mit einer Song-URI direkt abspielen. Das gilt für den Scanner in der Spotify-App, nicht für
  normale QR-Codes und die Handy-Kamera.
- **Folgerung:** Verhalten auf echten Handys testen (iPhone/Android, Kamera und Spotify-App, mit und ohne
  Spotify Premium). Die Option „App-Link“ (`spotify:track:…`) ist für diesen Test gedacht; nicht jede
  Kamera-App öffnet solche Links.

## Quellen
- Spotify for Developers, URIs und IDs: https://developer.spotify.com/documentation/web-api/concepts/spotify-uris-ids
- Spotify for Developers, Get Track (Beispiel-ID): https://developer.spotify.com/documentation/web-api/reference/get-track
- Spotify Community, Kurzlinks spotify.link: https://community.spotify.com/t5/Spotify-for-Developers/How-to-see-through-shortened-https-spotify-link-links/m-p/5643368/highlight/true
- Spotify Community, Spotify-Code direkt abspielen: https://community.spotify.com/t5/Other-Podcasts-Partners-etc/Is-it-possible-to-scan-a-Spotify-code-and-have-the-song-start/m-p/5678287
- u2l.ai, Spotify-QR-Codes (Tracking-Parameter entfernen): https://u2l.ai/blog/qr-code-for-spotify
