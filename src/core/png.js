/* PNG-Hilfen: Druckauflösung (dpi) als pHYs-Block eintragen. */
(function (root) {
  'use strict';
  var QRC = root.QRC = root.QRC || {};

  /** Fügt nach dem IHDR-Block einen pHYs-Block mit der gegebenen dpi ein (ersetzt einen vorhandenen). */
  function setDpi(png, dpi) {
    var ppm = Math.round(dpi / 0.0254);
    var view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    // Blöcke durchgehen; vorhandenes pHYs entfernen
    var pos = 8, keep = [png.subarray(0, 8)], insertedAfterIhdr = false;
    while (pos < png.length) {
      var len = view.getUint32(pos);
      var type = String.fromCharCode(png[pos + 4], png[pos + 5], png[pos + 6], png[pos + 7]);
      var chunk = png.subarray(pos, pos + 12 + len);
      if (type !== 'pHYs') keep.push(chunk);
      if (type === 'IHDR' && !insertedAfterIhdr) { keep.push(physChunk(ppm)); insertedAfterIhdr = true; }
      pos += 12 + len;
    }
    var total = keep.reduce(function (s, a) { return s + a.length; }, 0);
    var out = new Uint8Array(total), p = 0;
    keep.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }

  function physChunk(ppm) {
    var c = new Uint8Array(21);
    var v = new DataView(c.buffer);
    v.setUint32(0, 9);
    c.set([0x70, 0x48, 0x59, 0x73], 4); // „pHYs“
    v.setUint32(8, ppm);
    v.setUint32(12, ppm);
    c[16] = 1; // Einheit: Meter
    v.setUint32(17, QRC.zip.crc32(c, 4, 17));
    return c;
  }

  QRC.png = { setDpi: setDpi };
})(typeof window !== 'undefined' ? window : globalThis);
