/* Spotify-Links erkennen und auf die kürzeste stabile Form bringen. */
(function (root) {
  'use strict';
  var QRC = root.QRC = root.QRC || {};

  var TYPES = ['track', 'album', 'playlist', 'episode', 'show', 'artist'];
  var TYPE_LABEL = {
    track: 'Song', album: 'Album', playlist: 'Playlist',
    episode: 'Podcast-Folge', show: 'Podcast', artist: 'Künstler'
  };
  var ID_RE = /^[A-Za-z0-9]{22}$/;
  var SHORT_HOSTS = ['spotify.link', 'spoti.fi'];

  /**
   * Wandelt eine Eingabe in den Inhalt für den QR-Code um.
   * @param {string} input   eingefügter Link oder URI
   * @param {string} format  'web' (https://open.spotify.com/…) oder 'app' (spotify:track:…)
   * @returns {{ok:boolean, content?:string, type?:string, id?:string, notes:string[], warnings:string[], error?:string}}
   */
  function normalize(input, format) {
    var res = { ok: false, notes: [], warnings: [] };
    var s = String(input == null ? '' : input).trim();
    if (!s) { res.error = 'Bitte einen Spotify-Link einfügen.'; return res; }

    // Manche Apps teilen „Titel – Künstler https://…“: Link aus dem Text herauslösen.
    var embedded = s.match(/(https?:\/\/\S+|spotify:[a-z]+:[A-Za-z0-9]+)/);
    if (embedded && embedded[0] !== s) {
      s = embedded[0];
      res.notes.push('Link aus dem eingefügten Text herausgelöst.');
    }

    var type, id;
    var uri = s.match(/^spotify:([a-z]+):([A-Za-z0-9]+)$/);
    if (uri) {
      type = uri[1]; id = uri[2];
    } else {
      var url;
      try {
        url = new URL(/^[a-z]+:\/\//i.test(s) ? s : 'https://' + s);
      } catch (e) {
        res.error = 'Das sieht nicht nach einem Link aus.'; return res;
      }
      var host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (SHORT_HOSTS.indexOf(host) >= 0) {
        if (format === 'app') {
          res.warnings.push('Kurzlinks (' + host + ') können nicht in einen App-Link umgewandelt werden; der Kurzlink wird verwendet.');
        }
        res.ok = true;
        res.content = 'https://' + host + url.pathname;
        res.type = 'short';
        res.notes.push('Spotify-Kurzlink: wird unverändert übernommen (ohne Zusatzparameter). Er funktioniert, solange Spotify ihn weiterleitet.');
        if (url.search) res.notes.push('Zusatzparameter entfernt.');
        return res;
      }
      if (host !== 'open.spotify.com' && host !== 'play.spotify.com') {
        res.error = 'Kein Spotify-Link. Erwartet wird z. B. https://open.spotify.com/track/…';
        return res;
      }
      var parts = url.pathname.split('/').filter(Boolean);
      // optionale Präfixe wie „intl-de“ oder „embed“ überspringen
      while (parts.length && (/^intl-[a-z-]+$/i.test(parts[0]) || parts[0] === 'embed')) parts.shift();
      type = parts[0]; id = parts[1];
      if (url.search || url.hash) res.notes.push('Tracking-Teil (z. B. „?si=…“) entfernt – der Code wird dadurch kleiner und robuster.');
      if (/^intl-/i.test(url.pathname.split('/')[1] || '')) res.notes.push('Sprachpräfix („intl-…“) entfernt.');
    }

    if (TYPES.indexOf(type) < 0) {
      res.error = 'Unbekannter Spotify-Link-Typ' + (type ? ' „' + type + '“' : '') + '.'; return res;
    }
    if (!id || !ID_RE.test(id)) {
      res.error = 'Die Spotify-ID im Link ist unvollständig (erwartet: 22 Zeichen).'; return res;
    }
    if (type !== 'track') {
      res.warnings.push('Das ist kein einzelner Song, sondern: ' + TYPE_LABEL[type] + '. Der Code wird trotzdem erstellt.');
    }
    res.ok = true;
    res.type = type;
    res.id = id;
    res.content = format === 'app' ? 'spotify:' + type + ':' + id : 'https://open.spotify.com/' + type + '/' + id;
    return res;
  }

  QRC.spotify = { normalize: normalize, TYPE_LABEL: TYPE_LABEL };
})(typeof window !== 'undefined' ? window : globalThis);
