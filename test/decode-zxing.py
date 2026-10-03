"""Zweiter Decoder für test/decode-matrix.js: zxing-cpp und OpenCV.
Aufruf: python test/decode-zxing.py [Ordner]   (pip install zxing-cpp opencv-python-headless)"""
import collections, json, os, sys
import cv2, zxingcpp
d = sys.argv[1] if len(sys.argv) > 1 else '/tmp/qrc-matrix'
res = collections.defaultdict(lambda: [0, 0, 0])
for e in json.load(open(os.path.join(d, 'manifest.json'))):
    img = cv2.imread(os.path.join(d, e['file']))
    z = [b.text for b in zxingcpp.read_barcodes(img)]
    o = cv2.QRCodeDetector().detectAndDecode(img)[0]
    r = res[e['variant']]; r[0] += 1; r[1] += e['content'] in z; r[2] += o == e['content']
for k, (n, z, o) in sorted(res.items()):
    print(f'{k:22s} zxing {z}/{n}  opencv {o}/{n}')
