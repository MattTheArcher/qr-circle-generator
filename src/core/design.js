/*
 * Kreis-Design: baut aus einem Inhalt ein Formen-Modell in Moduleinheiten.
 * Dieses Modell ist die einzige Quelle für SVG- und PNG-Ausgabe.
 *
 * Aufbau (von innen nach außen):
 *   echter QR-Code (n × n Module) → Abstand (gap Module, leer) → Deko-Module bis zum Kreis
 *   → Außenring → optional Beschriftung darunter.
 */
(function (root) {
  'use strict';
  var QRC = root.QRC = root.QRC || {};

  var DEFAULTS = {
    ecc: 'H',            // Fehlerkorrektur L | M | Q | H
    gap: 1,              // leere Module zwischen Code und Deko (1 = Standard, 2 = sicherer)
    eyes: 'round',       // 'round' | 'square' (eckig = sicherer)
    density: 0.45,       // Anteil dunkler Deko-Module
    seed: 0,             // zusätzlicher Startwert für das Deko-Muster („Neu würfeln“)
    label: '',           // Beschriftung unter dem Kreis
    labelSize: 'm',      // 's' | 'm' | 'l'
    ring: true,          // Außenring zeichnen
    minVersion: 1
  };

  // Geometrie-Konstanten in Modulen (abgeleitet vom Referenzbild)
  var RING_CLEARANCE = 3.2;   // Abstand Code-Ecke → Innenkante Ring
  var RING_WIDTH = 0.8;
  var DECOR_TO_RING = 0.5;    // Deko-Module enden so weit vor dem Ring
  var MARGIN = 1.0;           // Rand außen um den Ring
  var LABEL_EM = { s: 0.09, m: 0.12, l: 0.16 }; // Schriftgröße relativ zum Ringdurchmesser
  var LABEL_GAP = 0.06;       // Abstand Ring → Oberkante der Großbuchstaben, relativ zum Durchmesser

  // --- kleiner, deterministischer Zufallsgenerator -------------------------
  function hashString(str) {
    var h = 2166136261 >>> 0; // FNV-1a
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- QR-Matrix ---------------------------------------------------------
  function makeQr(content, opts) {
    var qg = root.qrcodegen;
    var eclMap = { L: qg.QrCode.Ecc.LOW, M: qg.QrCode.Ecc.MEDIUM, Q: qg.QrCode.Ecc.QUARTILE, H: qg.QrCode.Ecc.HIGH };
    var segs = qg.QrSegment.makeSegments(content);
    // boostEcl = true: passt ein höheres Level ohne größere Version hinein, wird es genommen.
    return qg.QrCode.encodeSegments(segs, eclMap[opts.ecc] || eclMap.H, opts.minVersion || 1, 40, -1, true);
  }

  /**
   * @param {string} content Inhalt des QR-Codes
   * @param {object} options siehe DEFAULTS
   */
  function build(content, options) {
    var o = {};
    for (var k in DEFAULTS) o[k] = DEFAULTS[k];
    for (var k2 in (options || {})) if (options[k2] !== undefined) o[k2] = options[k2];
    o.gap = Math.max(1, Math.min(4, o.gap | 0));

    var qr = makeQr(content, o);
    var n = qr.size;

    // Radien relativ zur Kreismitte
    var halfDiag = n / 2 * Math.SQRT2;
    var rRingIn = halfDiag + RING_CLEARANCE;
    var rRingOut = rRingIn + RING_WIDTH;
    var rDecor = rRingIn - DECOR_TO_RING;

    // Gesamtbreite: kleinste ungerade ganze Zahl → Modulraster liegt auf ganzen Einheiten
    var W = Math.ceil(2 * (rRingOut + MARGIN));
    if (W % 2 === 0) W += 1;
    var c = W / 2;                 // Kreismitte (x und y)
    var ox = c - n / 2;            // linke obere Ecke des Codes (ganzzahlig)

    // --- Zellen: dunkle Module von Code und Deko in einem Raster -------------
    var cells = []; // Zeilen von booleans, Index [y][x] in Bildkoordinaten (0..W-1)
    for (var y = 0; y < W; y++) { cells.push(new Array(W).fill(false)); }

    var isFinder = function (x, y) {
      return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    };
    var roundEyes = o.eyes !== 'square';
    for (var qy = 0; qy < n; qy++) {
      for (var qx = 0; qx < n; qx++) {
        if (roundEyes && isFinder(qx, qy)) continue;
        if (qr.getModule(qx, qy)) cells[qy + ox][qx + ox] = true;
      }
    }

    // Deko: deterministisch aus Inhalt + Startwert
    var rnd = mulberry32(hashString(content) ^ Math.imul(o.seed | 0, 0x9E3779B1));
    var decor = []; // Liste der Deko-Zellen (für den Augen-Filter)
    for (var dy = 0; dy < W; dy++) {
      for (var dx = 0; dx < W; dx++) {
        var gx = dx - ox, gy = dy - ox; // Koordinaten relativ zum Code
        if (gx >= -o.gap && gx < n + o.gap && gy >= -o.gap && gy < n + o.gap) continue; // Code + Abstand
        // Zelle muss vollständig im Deko-Kreis liegen (alle vier Ecken)
        var fx = Math.max(Math.abs(dx - c), Math.abs(dx + 1 - c));
        var fy = Math.max(Math.abs(dy - c), Math.abs(dy + 1 - c));
        if (fx * fx + fy * fy > rDecor * rDecor) continue;
        var on = rnd() < o.density;
        if (on) { cells[dy][dx] = true; decor.push([dx, dy]); }
      }
    }
    // Filter: keine 3×3-Vollblöcke in der Deko (die könnten wie das Zentrum eines Finder-Auges wirken)
    var isDecor = function (x, y) {
      var gx = x - ox, gy = y - ox;
      return !(gx >= -o.gap && gx < n + o.gap && gy >= -o.gap && gy < n + o.gap);
    };
    for (var i = 0; i < decor.length; i++) {
      var px = decor[i][0], py = decor[i][1];
      if (px + 2 >= W || py + 2 >= W) continue;
      var full = true;
      for (var yy = py; yy < py + 3 && full; yy++)
        for (var xx = px; xx < px + 3 && full; xx++)
          if (!cells[yy][xx] || !isDecor(xx, yy)) full = false;
      if (full) cells[py + 1][px + 1] = false;
    }

    // --- Formen -------------------------------------------------------------
    // Module als horizontale Läufe (ein gemeinsamer Pfad → keine Haarlinien zwischen Modulen)
    var runs = [];
    for (var ry = 0; ry < W; ry++) {
      var start = -1;
      for (var rx = 0; rx <= W; rx++) {
        var dark = rx < W && cells[ry][rx];
        if (dark && start < 0) start = rx;
        if (!dark && start >= 0) { runs.push([start, ry, rx - start]); start = -1; }
      }
    }

    var circles = []; // {cx, cy, rOut, rIn} – rIn = 0 → volle Scheibe
    if (roundEyes) {
      [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function (e) {
        var ex = ox + e[0] + 3.5, ey = ox + e[1] + 3.5;
        circles.push({ cx: ex, cy: ey, rOut: 3.5, rIn: 2.5 });
        circles.push({ cx: ex, cy: ey, rOut: 1.5, rIn: 0 });
      });
    }
    if (o.ring) circles.push({ cx: c, cy: c, rOut: rRingOut, rIn: rRingIn });

    // --- Beschriftung ---------------------------------------------------------
    var H = W;
    var label = null;
    var text = String(o.label || '').trim();
    if (text) {
      var D = 2 * rRingOut;
      var em = (LABEL_EM[o.labelSize] || LABEL_EM.m) * D;
      var lay = layoutText(text, em);
      var top = c + rRingOut + LABEL_GAP * D;     // Oberkante der Großbuchstaben
      var baseline = top + lay.capHeight;
      label = { text: text, em: em, x: c - lay.width / 2, baseline: baseline, glyphs: lay.glyphs, scale: lay.scale };
      H = Math.ceil(baseline + Math.max(lay.descent, 0.12 * em) + MARGIN + 0.5);
    }

    return {
      content: content,
      options: o,
      version: qr.version,
      ecc: ['L', 'M', 'Q', 'H'][qr.errorCorrectionLevel.ordinal],
      size: n,
      width: W,
      height: H,
      codeOrigin: ox,
      center: c,
      runs: runs,
      circles: circles,
      label: label,
      diameterModules: 2 * rRingOut
    };
  }

  function layoutText(text, em) {
    var G = QRC.glyphs;
    var scale = em / G.meta.upm;
    var x = 0, glyphs = [], missing = G.g['?'];
    for (var i = 0; i < text.length; i++) {
      var g = G.g[text[i]] || missing;
      glyphs.push({ x: x, d: g[1] });
      x += g[0] * scale;
    }
    return {
      width: x, glyphs: glyphs, scale: scale,
      capHeight: G.meta.capHeight * scale,
      descent: /[gjpqy,;]/.test(text) ? -G.meta.descender * scale : 0
    };
  }

  /** Version, die ein Inhalt bei gegebenem Level braucht (für Anzeige/Warnungen). */
  function versionFor(content, ecc) {
    return makeQr(content, { ecc: ecc || 'H', minVersion: 1 }).version;
  }

  QRC.design = { build: build, versionFor: versionFor, DEFAULTS: DEFAULTS, hashString: hashString };
})(typeof window !== 'undefined' ? window : globalThis);
