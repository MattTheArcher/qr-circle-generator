"""Kamera-ähnliche Störungen (Drehung, Perspektive, Unschärfe, Rauschen, kleine Auflösung) auf die
Bilder aus test/decode-matrix.js anwenden und mit zxing-cpp dekodieren. Vergleicht die Varianten.
Aufruf: python test/stress-zxing.py [Ordner] [Durchläufe je Bild]"""
import collections, json, os, sys
import cv2, numpy as np, zxingcpp
d = sys.argv[1] if len(sys.argv) > 1 else '/tmp/qrc-matrix'
reps = int(sys.argv[2]) if len(sys.argv) > 2 else 4
rng = np.random.default_rng(7)
def distort(img, level):
    h, w = img.shape[:2]
    # Perspektive
    j = level * 0.06 * w
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = src + rng.uniform(-j, j, src.shape).astype(np.float32)
    M = cv2.getPerspectiveTransform(src, dst)
    img = cv2.warpPerspective(img, M, (w, h), borderValue=(255, 255, 255))
    # Drehung
    R = cv2.getRotationMatrix2D((w / 2, h / 2), rng.uniform(-25, 25), 1.0)
    img = cv2.warpAffine(img, R, (w, h), borderValue=(255, 255, 255))
    # verkleinern (wenige Pixel pro Modul), Unschärfe, Rauschen, Helligkeitsverlauf
    scale = 0.42 - 0.05 * level
    img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    img = cv2.GaussianBlur(img, (0, 0), 0.5 + 0.3 * level)
    g = np.linspace(0.75, 1.0, img.shape[1])[None, :, None]
    img = np.clip(img * g + rng.normal(0, 6 + 6 * level, img.shape), 0, 255).astype(np.uint8)
    return img
res = collections.defaultdict(lambda: collections.Counter())
for e in json.load(open(os.path.join(d, 'manifest.json'))):
    if 'ppm12' not in e['file']:
        continue
    base = cv2.imread(os.path.join(d, e['file']))
    for level in (1, 2, 3):
        for _ in range(reps):
            img = distort(base, level)
            ok = e['content'] in [b.text for b in zxingcpp.read_barcodes(img)]
            c = res[(e['variant'].replace(' ppm12', ''), level)]; c['n'] += 1; c['ok'] += ok
print('Variante          Störung  gelesen')
for (v, lvl), c in sorted(res.items()):
    print(f'{v:16s}  Stufe {lvl}  {c["ok"]:3d}/{c["n"]}  ({100*c["ok"]/c["n"]:.0f} %)')
