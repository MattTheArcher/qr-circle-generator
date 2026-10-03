/* Bedienlogik des QR-Kreis-Generators (Einzel- und Serienmodus). */
(function () {
  'use strict';
  var QRC = window.QRC;
  var $ = function (id) { return document.getElementById(id); };

  var DEMO_LINK = 'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6';
  var SELFTEST_PPM = 5;        // Pixel pro Modul für den Lesbarkeits-Test
  var MAX_PNG = 6000;          // Obergrenze Breite (Speicher/Browsergrenzen)
  var PRINT_DPI = 300;

  var state = {
    mode: 'single',
    contentType: 'spotify',
    linkFormat: 'web',
    fg: '#000000', bg: '#FFFFFF', transparent: false,
    eyes: 'round', gap: 1, labelSize: 'm', density: 0.45, ecc: 'H', seed: 0,
    series: [], selected: -1,
    seriesFormat: 'png'
  };

  // ---------------------------------------------------------------- Hilfen
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function setMessages(list, items) {
    list.textContent = '';
    items.forEach(function (it) { list.appendChild(el('li', it[0], it[1])); });
  }
  function radioValue(name) {
    var r = document.querySelector('input[name="' + name + '"]:checked');
    return r ? r.value : null;
  }
  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function nextFrame() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function parseHex(v) {
    var s = String(v || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.replace(/./g, '$&$&');
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return '#' + s.toUpperCase();
  }
  function luminance(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function styleForExport() {
    return { fg: state.fg, bg: state.transparent ? null : state.bg };
  }
  function designOptions(label) {
    return {
      eyes: state.eyes, gap: state.gap, labelSize: state.labelSize,
      density: state.density, ecc: state.ecc, seed: state.seed, label: label || ''
    };
  }

  /** Eingabe → Inhalt im Code (je nach Modus Spotify oder frei). */
  function resolve(raw) {
    if (state.contentType === 'spotify') return QRC.spotify.normalize(raw, state.linkFormat);
    var s = String(raw || '').trim();
    if (!s) return { ok: false, error: 'Bitte einen Link oder Text eingeben.', notes: [], warnings: [] };
    var r = { ok: true, content: s, notes: [], warnings: [] };
    if (s.length > 120) r.warnings.push('Langer Inhalt (' + s.length + ' Zeichen): Der Code wird feiner und schwerer lesbar. Kürzer ist besser.');
    return r;
  }

  function safeFileName(s) {
    return String(s).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, 80);
  }

  // ------------------------------------------------------------ Selbsttest
  function selfTest(model) {
    var style = { fg: state.fg, bg: state.transparent ? '#FFFFFF' : state.bg };
    var canvas = QRC.render.toCanvas(model, style, SELFTEST_PPM, document.createElement('canvas'));
    var ctx = canvas.getContext('2d');
    var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var res = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    return !!res && res.data === model.content;
  }

  // -------------------------------------------------------------- Vorschau
  var preview = $('preview');
  var current = null; // { model, resolved }

  function showModel(model, isDemo) {
    var svg = QRC.render.toSvg(model, isDemo ? { fg: '#1C2330', bg: null } : styleForExport());
    preview.innerHTML = svg.replace(/^<\?xml[^>]*>\s*/, '');
    var ar = model.width / model.height;
    preview.style.setProperty('--ar', ar);
    preview.style.width = 'min(100%, 560px, calc((100vh - 400px) * ' + ar.toFixed(4) + '))';
    preview.style.minWidth = 'min(100%, 260px)';
    preview.classList.toggle('is-demo', !!isDemo);
    preview.classList.toggle('has-card', !isDemo);
    preview.classList.toggle('transparent', !isDemo && state.transparent);
  }

  function updateMeta(model) {
    if (!model) { $('meta').textContent = ''; return; }
    var cm = function (px) { return (px / PRINT_DPI * 2.54).toFixed(1).replace('.', ','); };
    $('meta').textContent = 'QR-Version ' + model.version + ' · ' + model.size + ' × ' + model.size +
      ' Module · Fehlerkorrektur ' + model.ecc;
    var ppm = QRC.render.pxPerModuleFor(model, pngWidth());
    var w = Math.round(model.width * ppm), h = Math.round(model.height * ppm);
    $('png-info').textContent = 'Ergebnis: ' + w + ' × ' + h + ' Pixel (ganze Pixel pro Modul für scharfe Kanten). ' +
      'Gedruckt mit ' + PRINT_DPI + ' dpi: ' + cm(w) + ' × ' + cm(h) + ' cm.';
  }

  var selftestEl = $('selftest');
  function setSelftest(kind, text) {
    selftestEl.className = 'selftest' + (kind ? ' ' + kind : '');
    selftestEl.textContent = text;
  }

  var runSelftest = debounce(function () {
    if (!current) return;
    var ok = selfTest(current.model);
    current.readable = ok;
    setSelftest(ok ? 'ok' : 'bad', ok ? 'Lesbar – der eingebaute Scanner hat den Code erkannt'
      : 'Nicht lesbar – bitte Farben, Augenform oder Abstand ändern');
  }, 120);

  function refresh() {
    if (state.mode === 'single') refreshSingle(); else refreshSeriesPreview();
    updateColorMessages();
  }

  function refreshSingle() {
    var raw = $('single-input').value;
    var label = $('single-label').value;
    var msgs = $('single-messages');
    var exportOk = false;
    if (!raw.trim()) {
      setMessages(msgs, []);
      current = null;
      showModel(QRC.design.build(DEMO_LINK, designOptions(label || '228')), true);
      $('preview-caption').textContent = 'So wird es aussehen. Füge links einen ' + (state.contentType === 'spotify' ? 'Spotify-Link' : 'Link') + ' ein.';
      setSelftest('', 'Noch kein Inhalt');
      updateMeta(null);
      $('png-info').textContent = '';
    } else {
      var r = resolve(raw);
      var items = [];
      if (r.error) items.push(['error', r.error]);
      (r.warnings || []).forEach(function (w) { items.push(['warn', w]); });
      (r.notes || []).forEach(function (n) { items.push(['note', n]); });
      if (r.ok) items.push(['note', 'Im Code steht: ' + r.content]);
      setMessages(msgs, items);
      if (r.ok) {
        var model = QRC.design.build(r.content, designOptions(label));
        current = { model: model, resolved: r };
        showModel(model, false);
        $('preview-caption').textContent = '';
        updateMeta(model);
        setSelftest('busy', 'Wird geprüft …');
        runSelftest();
        exportOk = true;
      } else {
        current = null;
        showModel(QRC.design.build(DEMO_LINK, designOptions(label || '228')), true);
        $('preview-caption').textContent = 'Der Link ist noch nicht verwendbar – siehe Hinweis links.';
        setSelftest('', 'Noch kein gültiger Inhalt');
        updateMeta(null);
        $('png-info').textContent = '';
      }
    }
    $('save-png').disabled = !exportOk;
    $('save-svg').disabled = !exportOk;
  }

  // ---------------------------------------------------------------- Farben
  function updateColorMessages() {
    var items = [];
    var bg = state.transparent ? '#FFFFFF' : state.bg;
    var lf = luminance(state.fg), lb = luminance(bg);
    var ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    if (lf > lb) items.push(['warn', 'Helle Farbe auf dunklem Grund: Viele Scanner lesen solche Codes nicht. Besser dunkel auf hell.']);
    else if (ratio < 3) items.push(['warn', 'Zu wenig Kontrast zwischen Farbe und Hintergrund. Dunkler färben oder helleren Hintergrund wählen.']);
    if (state.transparent) items.push(['note', 'Durchsichtiger Hintergrund: Der Code braucht beim Drucken einen hellen Untergrund.']);
    setMessages($('color-messages'), items);
  }

  function bindColor(pickerId, hexId, key) {
    var picker = $(pickerId), hex = $(hexId);
    picker.addEventListener('input', function () {
      state[key] = picker.value.toUpperCase();
      hex.value = state[key];
      hex.removeAttribute('aria-invalid');
      refresh();
    });
    hex.addEventListener('input', function () {
      var v = parseHex(hex.value);
      if (!v) { hex.setAttribute('aria-invalid', 'true'); return; }
      hex.removeAttribute('aria-invalid');
      state[key] = v;
      picker.value = v.toLowerCase();
      refresh();
    });
    hex.addEventListener('blur', function () {
      hex.value = state[key];
      hex.removeAttribute('aria-invalid');
    });
  }

  // --------------------------------------------------------------- Export
  function pngWidth() {
    var v = $('png-size').value;
    var w = v === 'custom' ? parseInt($('png-custom').value, 10) : parseInt(v, 10);
    if (!(w > 0)) w = 2000;
    return Math.min(MAX_PNG, Math.max(200, w));
  }

  function renderPng(model, width) {
    var ppm = QRC.render.pxPerModuleFor(model, width);
    var canvas = QRC.render.toCanvas(model, styleForExport(), ppm, document.createElement('canvas'));
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) { reject(new Error('Das Bild ist zu groß für diesen Browser. Bitte eine kleinere PNG-Größe wählen.')); return; }
        blob.arrayBuffer().then(function (buf) {
          resolve(QRC.png.setDpi(new Uint8Array(buf), PRINT_DPI));
        }, reject);
      }, 'image/png');
    });
  }

  function download(data, name, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function singleBaseName() {
    var label = $('single-label').value.trim();
    if (label) return 'qr-' + safeFileName(label);
    var r = current && current.resolved;
    return 'qr-' + (r && r.id ? r.id : 'code');
  }

  function confirmIfUnreadable(model) {
    if (selfTest(model)) return true;
    return window.confirm('Der eingebaute Scanner konnte diesen Code nicht lesen. Trotzdem speichern?');
  }

  $('save-png').addEventListener('click', function () {
    if (!current || !confirmIfUnreadable(current.model)) return;
    var msg = $('export-message');
    msg.textContent = 'PNG wird erstellt …';
    renderPng(current.model, pngWidth()).then(function (bytes) {
      download(bytes, singleBaseName() + '.png', 'image/png');
      msg.textContent = 'PNG gespeichert (im Download-Ordner).';
    }, function (e) { msg.textContent = e.message; });
  });
  $('save-svg').addEventListener('click', function () {
    if (!current || !confirmIfUnreadable(current.model)) return;
    download(QRC.render.toSvg(current.model, styleForExport()), singleBaseName() + '.svg', 'image/svg+xml');
    $('export-message').textContent = 'SVG gespeichert (im Download-Ordner).';
  });

  // ---------------------------------------------------------------- Serie
  function loadCsv(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = QRC.csv.parse(new Uint8Array(reader.result));
      var summary = $('series-summary');
      if (parsed.error) {
        state.series = [];
        summary.innerHTML = '';
        summary.appendChild(el('p', 'st-err', file.name + ': ' + parsed.error));
        renderSeriesTable();
        refresh();
        return;
      }
      state.series = parsed.entries.map(function (e) { return { entry: e }; });
      state.fileName = file.name;
      validateSeries();
      state.selected = state.series.findIndex(function (s) { return s.resolved.ok; });
      renderSeriesTable();
      refresh();
    };
    reader.readAsArrayBuffer(file);
  }

  function validateSeries() {
    var names = {};
    state.series.forEach(function (s, i) {
      s.resolved = resolve(s.entry.content);
      s.readable = undefined;
      var base = safeFileName(s.entry.filename || s.entry.label) || ('qr-' + String(i + 1).padStart(3, '0'));
      var name = base, k = 2;
      while (names[name.toLowerCase()]) name = base + '_' + (k++);
      names[name.toLowerCase()] = true;
      s.fileBase = name;
    });
    var ok = state.series.filter(function (s) { return s.resolved.ok; }).length;
    var bad = state.series.length - ok;
    var summary = $('series-summary');
    summary.textContent = '';
    var p = el('p');
    p.appendChild(el('b', null, String(state.series.length)));
    p.appendChild(document.createTextNode(' Einträge aus ' + state.fileName + ': ' + ok + ' bereit' +
      (bad ? ', ' + bad + ' mit Fehler (werden übersprungen)' : '') + '.'));
    summary.appendChild(p);
    $('save-zip').disabled = ok === 0;
  }

  function statusOf(s) {
    if (!s.resolved.ok) return ['st-err', s.resolved.error];
    if (s.readable === false) return ['st-err', 'nicht lesbar'];
    if (s.resolved.warnings.length) return ['st-warn', s.resolved.warnings[0]];
    return ['st-ok', s.readable ? 'lesbar' : 'bereit'];
  }

  function renderSeriesTable() {
    var body = $('series-body');
    body.textContent = '';
    $('series-table-wrap').hidden = state.series.length === 0;
    state.series.forEach(function (s, i) {
      var tr = el('tr');
      tr.setAttribute('aria-selected', i === state.selected ? 'true' : 'false');
      tr.tabIndex = 0;
      tr.appendChild(el('td', null, s.entry.label || '–'));
      tr.appendChild(el('td', null, s.resolved.ok ? s.resolved.content : s.entry.content));
      var st = statusOf(s);
      tr.appendChild(el('td', st[0], st[1]));
      var pick = function () { state.selected = i; renderSeriesTable(); refresh(); };
      tr.addEventListener('click', pick);
      tr.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      body.appendChild(tr);
    });
  }

  function refreshSeriesPreview() {
    var s = state.series[state.selected];
    if (!s || !s.resolved.ok) {
      current = null;
      showModel(QRC.design.build(DEMO_LINK, designOptions('228')), true);
      $('preview-caption').textContent = state.series.length
        ? 'Wähle links einen Eintrag für die Vorschau.'
        : 'Lade eine CSV-Datei mit Nummern und Spotify-Links.';
      setSelftest('', state.series.length ? 'Kein Eintrag gewählt' : 'Noch keine Datei geladen');
      updateMeta(null);
      $('png-info').textContent = '';
      return;
    }
    var model = QRC.design.build(s.resolved.content, designOptions(s.entry.label));
    current = { model: model, resolved: s.resolved };
    showModel(model, false);
    $('preview-caption').textContent = 'Vorschau: ' + (s.entry.label ? 'Nr. ' + s.entry.label : 'Zeile ' + s.entry.line);
    updateMeta(model);
    setSelftest('busy', 'Wird geprüft …');
    runSelftest();
  }

  async function exportSeries() {
    var items = state.series.filter(function (s) { return s.resolved.ok; });
    if (!items.length) return;
    var fmt = state.seriesFormat;
    var width = pngWidth();
    var files = [], report = [['nummer', 'link_aus_csv', 'inhalt_im_code', 'datei', 'lesbar', 'hinweis']];
    var bar = $('progress-bar'), msg = $('export-message');
    $('progress').hidden = false; $('save-zip').disabled = true;
    var unreadable = 0;
    try {
      for (var i = 0; i < state.series.length; i++) {
        var s = state.series[i];
        if (!s.resolved.ok) {
          report.push([s.entry.label, s.entry.content, '', '', '', 'übersprungen: ' + s.resolved.error]);
          continue;
        }
        var model = QRC.design.build(s.resolved.content, designOptions(s.entry.label));
        s.readable = selfTest(model);
        if (!s.readable) unreadable++;
        var names = [];
        if (fmt === 'png' || fmt === 'both') {
          files.push({ name: s.fileBase + '.png', data: await renderPng(model, width) });
          names.push(s.fileBase + '.png');
        }
        if (fmt === 'svg' || fmt === 'both') {
          files.push({ name: s.fileBase + '.svg', data: new TextEncoder().encode(QRC.render.toSvg(model, styleForExport())) });
          names.push(s.fileBase + '.svg');
        }
        report.push([s.entry.label, s.entry.content, s.resolved.content, names.join(' + '), s.readable ? 'ja' : 'NEIN',
          s.resolved.warnings.concat(s.resolved.notes).join(' ')]);
        bar.style.width = Math.round((i + 1) / state.series.length * 100) + '%';
        msg.textContent = 'Erstelle ' + (i + 1) + ' von ' + state.series.length + ' …';
        if (i % 3 === 0) await nextFrame();
      }
      var csv = '﻿' + report.map(function (r) {
        return r.map(function (c) { c = String(c == null ? '' : c); return /[;"\r\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';');
      }).join('\r\n') + '\r\n';
      files.push({ name: 'uebersicht.csv', data: new TextEncoder().encode(csv) });
      var zipName = 'qr-codes-' + safeFileName((state.fileName || 'serie').replace(/\.[^.]+$/, '')) + '.zip';
      download(QRC.zip.makeZip(files), zipName, 'application/zip');
      msg.textContent = items.length + ' Codes gespeichert als ' + zipName + ' (im Download-Ordner).' +
        (unreadable ? ' Achtung: ' + unreadable + ' davon hat der eingebaute Scanner nicht gelesen – siehe Tabelle und uebersicht.csv.' : ' Alle wurden vom eingebauten Scanner gelesen.');
    } catch (e) {
      msg.textContent = 'Fehler: ' + e.message;
    } finally {
      $('progress').hidden = true; bar.style.width = '0';
      $('save-zip').disabled = false;
      renderSeriesTable();
    }
  }

  // ------------------------------------------------------------- Ereignisse
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.modes button').forEach(function (b) {
      b.setAttribute('aria-selected', b.dataset.mode === mode ? 'true' : 'false');
    });
    $('panel-single').hidden = mode !== 'single';
    $('panel-series').hidden = mode !== 'series';
    $('export-single').hidden = mode !== 'single';
    $('export-series').hidden = mode !== 'series';
    $('export-message').textContent = '';
    refresh();
  }
  document.querySelectorAll('.modes button').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.dataset.mode); });
  });

  $('single-input').addEventListener('input', debounce(refresh, 150));
  $('single-label').addEventListener('input', debounce(refresh, 150));
  bindColor('fg-picker', 'fg-hex', 'fg');
  bindColor('bg-picker', 'bg-hex', 'bg');
  $('bg-transparent').addEventListener('change', function (e) { state.transparent = e.target.checked; refresh(); });

  document.querySelectorAll('input[type="radio"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.eyes = radioValue('eyes');
      state.gap = parseInt(radioValue('gap'), 10);
      state.labelSize = radioValue('labelSize');
      state.seriesFormat = radioValue('seriesFormat');
      var ct = radioValue('contentType'), lf = radioValue('linkFormat');
      var revalidate = ct !== state.contentType || lf !== state.linkFormat;
      state.contentType = ct; state.linkFormat = lf;
      $('input-label').textContent = ct === 'spotify' ? 'Spotify-Link' : 'Link oder Text';
      if (revalidate && state.series.length) { validateSeries(); renderSeriesTable(); }
      refresh();
    });
  });
  $('ecc').addEventListener('change', function (e) { state.ecc = e.target.value; refresh(); });
  $('density').addEventListener('input', function (e) {
    state.density = parseInt(e.target.value, 10) / 100;
    $('density-out').textContent = e.target.value + ' %';
    refresh();
  });
  $('reroll').addEventListener('click', function () { state.seed++; refresh(); });
  $('png-size').addEventListener('change', function (e) {
    $('png-custom').hidden = e.target.value !== 'custom';
    if (current) updateMeta(current.model);
  });
  $('png-custom').addEventListener('input', function () { if (current) updateMeta(current.model); });

  // CSV laden: Klick, Tastatur, Ziehen & Ablegen
  var dz = $('dropzone'), fileInput = $('csv-file');
  dz.addEventListener('click', function () { fileInput.click(); });
  dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', function () { if (fileInput.files[0]) loadCsv(fileInput.files[0]); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) {
    dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove('drag'); });
  });
  dz.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) loadCsv(f); });
  // Datei aus Versehen außerhalb fallen gelassen: nicht im Browser öffnen
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });

  $('download-example').addEventListener('click', function () {
    download(new Blob([QRC.EXAMPLE_CSV], { type: 'text/csv' }), 'beispiel-serie.csv', 'text/csv');
  });
  $('save-zip').addEventListener('click', exportSeries);

  // Für automatische Tests erreichbar
  window.QRC.app = { state: state, refresh: refresh, selfTest: selfTest, renderPng: renderPng, loadCsv: loadCsv, exportSeries: exportSeries, current: function () { return current; } };

  refresh();
})();
