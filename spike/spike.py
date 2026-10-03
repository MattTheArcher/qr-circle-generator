"""Wegwerf-Prototyp aus der Recherche (2026-10-03), nicht Teil der Anwendung.

Rendert einen QR-Code im Kreis-Design (runde Augen, Zufalls-Deko, Außenring) und prüft mit
zxing-cpp und OpenCV, ob er lesbar ist – je nach Abstand Code↔Deko, Fehlerkorrektur und Augenform.

Abhängigkeiten: pip install segno pillow zxing-cpp opencv-python-headless numpy
Aufruf: python spike.py
"""
import segno, random, math, zxingcpp, cv2, numpy as np
from PIL import Image, ImageDraw
def render(data, ecc='h', gap=0, px=20, round_eyes=True, seed=1, ring=True):
    qr = segno.make_qr(data, error=ecc, boost_error=False)
    m = [list(r) for r in qr.matrix]; n=len(m)
    R = n/2*math.sqrt(2)+1.5            # circle radius in modules (covers corners)
    size = int(math.ceil(2*R))+4
    off = (size-n)/2
    img = Image.new('L',(int(size*px),int(size*px)),255); d=ImageDraw.Draw(img)
    cx=cy=size/2
    rnd=random.Random(seed)
    # filler
    for y in range(-int(off)-2, n+int(off)+2):
        for x in range(-int(off)-2, n+int(off)+2):
            inside = 0<=x<n and 0<=y<n
            if inside: continue
            # gap around code
            if -gap<=x<n+gap and -gap<=y<n+gap: continue
            mx,my = x+off+0.5, y+off+0.5
            if math.hypot(mx-cx,my-cy) > R-0.7: continue
            if rnd.random()<0.45:
                d.rectangle([ (x+off)*px,(y+off)*px,(x+off+1)*px-1,(y+off+1)*px-1],fill=0)
    eyes=[(0,0),(n-7,0),(0,n-7)]
    for y in range(n):
        for x in range(n):
            if round_eyes and any(ex<=x<ex+7 and ey<=y<ey+7 for ex,ey in eyes): continue
            if m[y][x]: d.rectangle([(x+off)*px,(y+off)*px,(x+off+1)*px-1,(y+off+1)*px-1],fill=0)
    if round_eyes:
        for ex,ey in eyes:
            c=((ex+off+3.5)*px,(ey+off+3.5)*px)
            for r,f in [(3.5,0),(2.5,255),(1.5,0)]:
                d.ellipse([c[0]-r*px,c[1]-r*px,c[0]+r*px,c[1]+r*px],fill=f)
    if ring:
        w=0.5*px; Rr=(R+0.6)*px
        d.ellipse([cx*px-Rr,cy*px-Rr,cx*px+Rr,cy*px+Rr],outline=0,width=int(w))
    canvas=Image.new('L',(img.width+8*px,img.height+8*px),255); canvas.paste(img,(4*px,4*px))
    return canvas, qr
def test(img):
    a=np.array(img)
    z=zxingcpp.read_barcodes(a); o=cv2.QRCodeDetector().detectAndDecode(a)[0]
    return ('zxing ok' if z else 'zxing FAIL'), ('opencv ok' if o else 'opencv FAIL')
url='https://example.org/t/228'
for gap in [0,1,2,4]:
    for ecc in ['m','h']:
        res=[test(render(url,ecc,gap,seed=s)[0]) for s in range(10)]
        zx=sum(r[0]=='zxing ok' for r in res); oc=sum(r[1]=='opencv ok' for r in res)
        print(f'gap={gap} ecc={ecc}: zxing {zx}/10, opencv {oc}/10')
img,qr=render(url,'h',1); img.save('spike_gap1.png'); print('version',qr.version)

# Augenform-Vergleich (rund vs. eckig), Abstand 1/2/4, Level H
for re in [True, False]:
    for gap in [1, 2, 4]:
        r = [test(render(url, 'h', gap, round_eyes=re, seed=s)[0]) for s in range(10)]
        print('round_eyes', re, 'gap', gap,
              'zxing', sum(x[0] == 'zxing ok' for x in r), 'opencv', sum(x[1] == 'opencv ok' for x in r))
