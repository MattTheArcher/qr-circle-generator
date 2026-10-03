/* CSV-Import für den Serienmodus: Trennzeichen und Kodierung werden automatisch erkannt. */
(function (root) {
  'use strict';
  var QRC = root.QRC = root.QRC || {};

  var LABEL_NAMES = ['nummer', 'nr', 'nr.', 'number', 'no', 'label', 'beschriftung', 'text', 'id'];
  var CONTENT_NAMES = ['link', 'url', 'spotify', 'spotify-link', 'spotify link', 'spotifylink', 'inhalt', 'content'];
  var FILE_NAMES = ['dateiname', 'datei', 'filename', 'file'];

  /** Bytes → Text: UTF-8 (auch mit BOM); sonst Windows-1252 (so speichert deutsches Excel „CSV“). */
  function decode(bytes) {
    var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, '');
    } catch (e) {
      return new TextDecoder('windows-1252').decode(u8);
    }
  }

  function detectDelimiter(text) {
    var firstLine = text.split(/\r?\n/).find(function (l) { return l.trim() !== ''; }) || '';
    var best = ',', bestCount = 0;
    [';', ',', '\t'].forEach(function (d) {
      var count = 0, inQ = false;
      for (var i = 0; i < firstLine.length; i++) {
        var ch = firstLine[i];
        if (ch === '"') inQ = !inQ;
        else if (ch === d && !inQ) count++;
      }
      if (count > bestCount) { best = d; bestCount = count; }
    });
    return best;
  }

  /** RFC-4180-artiges Parsen mit Anführungszeichen. */
  function parseRows(text, delim) {
    var rows = [], row = [], field = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
        } else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === delim) { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += ch;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
  }

  function findCol(header, names) {
    for (var i = 0; i < header.length; i++) {
      if (names.indexOf(header[i].trim().toLowerCase()) >= 0) return i;
    }
    return -1;
  }

  /**
   * @returns {{entries: {line:number, label:string, content:string, filename:string}[], delimiter:string, hasHeader:boolean, error?:string}}
   */
  function parse(bytesOrText) {
    var text = typeof bytesOrText === 'string' ? bytesOrText.replace(/^﻿/, '') : decode(bytesOrText);
    var delim = detectDelimiter(text);
    var rows = parseRows(text, delim);
    var result = { entries: [], delimiter: delim, hasHeader: false };
    if (!rows.length) { result.error = 'Die Datei ist leer.'; return result; }

    var header = rows[0];
    var cLabel = findCol(header, LABEL_NAMES);
    var cContent = findCol(header, CONTENT_NAMES);
    var cFile = findCol(header, FILE_NAMES);
    var start = 0;
    if (cContent >= 0 || cLabel >= 0) {
      result.hasHeader = true;
      start = 1;
      if (cContent < 0) {
        result.error = 'In der Kopfzeile fehlt die Spalte „link“.';
        return result;
      }
    } else {
      // Ohne Kopfzeile: eine Spalte = Link; zwei oder mehr = Nummer, Link
      var cols = rows[0].length;
      cLabel = cols >= 2 ? 0 : -1;
      cContent = cols >= 2 ? 1 : 0;
    }
    for (var r = start; r < rows.length; r++) {
      var row = rows[r];
      var content = (row[cContent] || '').trim();
      var label = cLabel >= 0 ? (row[cLabel] || '').trim() : '';
      if (!content && !label) continue;
      result.entries.push({
        line: r + 1,
        label: label,
        content: content,
        filename: cFile >= 0 ? (row[cFile] || '').trim() : ''
      });
    }
    if (!result.entries.length) result.error = 'Keine Einträge gefunden.';
    return result;
  }

  QRC.csv = { parse: parse, decode: decode, detectDelimiter: detectDelimiter, parseRows: parseRows };
})(typeof window !== 'undefined' ? window : globalThis);
