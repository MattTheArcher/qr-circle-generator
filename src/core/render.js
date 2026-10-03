/* Ausgabe des Formen-Modells (design.js) als SVG-Text oder auf ein Canvas. */
(function (root) {
  'use strict';
  var QRC = root.QRC = root.QRC || {};

  function num(v) { return +v.toFixed(4); }

  function modulesPath(model) {
    var d = [];
    for (var i = 0; i < model.runs.length; i++) {
      var r = model.runs[i];
      d.push('M' + r[0] + ' ' + r[1] + 'h' + r[2] + 'v1h' + (-r[2]) + 'z');
    }
    return d.join('');
  }

  function circlePath(c) {
    // Kreis als zwei Halbbögen; Annulus = äußerer + innerer Kreis mit evenodd
    var one = function (r) {
      return 'M' + num(c.cx - r) + ' ' + num(c.cy) +
        'a' + num(r) + ' ' + num(r) + ' 0 1 0 ' + num(2 * r) + ' 0' +
        'a' + num(r) + ' ' + num(r) + ' 0 1 0 ' + num(-2 * r) + ' 0z';
    };
    return one(c.rOut) + (c.rIn > 0 ? one(c.rIn) : '');
  }

  function escapeXml(s) {
    return String(s).replace(/[<>&"]/g, function (ch) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch];
    });
  }

  /**
   * @param {object} model  aus QRC.design.build
   * @param {{fg:string, bg:(string|null), pxPerModule?:number}} style
   */
  function toSvg(model, style) {
    var W = model.width, H = model.height;
    var scale = style.pxPerModule || 10;
    var out = [];
    out.push('<?xml version="1.0" encoding="UTF-8"?>');
    out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + W * scale + '" height="' + H * scale +
      '" viewBox="0 0 ' + W + ' ' + H + '">');
    out.push('<title>' + escapeXml(model.label ? model.label.text : 'QR-Code') + '</title>');
    out.push('<desc>' + escapeXml(model.content) + '</desc>');
    if (style.bg) out.push('<rect width="' + W + '" height="' + H + '" fill="' + style.bg + '"/>');
    out.push('<g fill="' + style.fg + '">');
    out.push('<path d="' + modulesPath(model) + '"/>');
    for (var i = 0; i < model.circles.length; i++) {
      out.push('<path fill-rule="evenodd" d="' + circlePath(model.circles[i]) + '"/>');
    }
    if (model.label) {
      var L = model.label;
      for (var j = 0; j < L.glyphs.length; j++) {
        var g = L.glyphs[j];
        if (!g.d) continue;
        out.push('<path transform="translate(' + num(L.x + g.x) + ' ' + num(L.baseline) + ') scale(' + num(L.scale) + ')" d="' + g.d + '"/>');
      }
    }
    out.push('</g></svg>');
    return out.join('\n');
  }

  /**
   * Zeichnet das Modell auf ein Canvas. pxPerModule sollte ganzzahlig sein (scharfe Kanten).
   * Gibt das Canvas zurück.
   */
  function toCanvas(model, style, pxPerModule, canvas) {
    var s = pxPerModule;
    canvas = canvas || document.createElement('canvas');
    canvas.width = Math.round(model.width * s);
    canvas.height = Math.round(model.height * s);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (style.bg) { ctx.fillStyle = style.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.fillStyle = style.fg;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fill(new Path2D(modulesPath(model)));
    for (var i = 0; i < model.circles.length; i++) {
      ctx.fill(new Path2D(circlePath(model.circles[i])), 'evenodd');
    }
    if (model.label) {
      var L = model.label;
      for (var j = 0; j < L.glyphs.length; j++) {
        var g = L.glyphs[j];
        if (!g.d) continue;
        ctx.setTransform(s * L.scale, 0, 0, s * L.scale, s * (L.x + g.x), s * L.baseline);
        ctx.fill(new Path2D(g.d));
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas;
  }

  /** Ganze Pixel pro Modul für eine gewünschte Bildbreite. */
  function pxPerModuleFor(model, targetWidth) {
    return Math.max(2, Math.round(targetWidth / model.width));
  }

  QRC.render = { toSvg: toSvg, toCanvas: toCanvas, pxPerModuleFor: pxPerModuleFor, modulesPath: modulesPath, circlePath: circlePath };
})(typeof window !== 'undefined' ? window : globalThis);
