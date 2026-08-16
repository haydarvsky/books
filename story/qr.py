# -*- coding: utf-8 -*-
"""يولّد رمز QR لرابط المعرض بألوان الهوية (SVG) ويتحقّق من قابليّته للمسح."""
import os, cv2, numpy as np

URL = "https://haydarvsky.github.io/books/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIET = 4  # هامش صامت بأربع وحدات كما يوجب المعيار

qr = cv2.QRCodeEncoder_create().encode(URL)      # 0 = وحدة داكنة
m = (qr == 0).astype(np.uint8)
n = m.shape[0]
side = n + QUIET * 2

rects = []
for y in range(n):
    x = 0
    row = m[y]
    while x < n:
        if row[x]:
            x2 = x
            while x2 + 1 < n and row[x2 + 1]:
                x2 += 1
            rects.append(f'<rect x="{x+QUIET}" y="{y+QUIET}" width="{x2-x+1}" height="1"/>')
            x = x2 + 1
        else:
            x += 1

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}" shape-rendering="crispEdges">'
       f'<rect width="{side}" height="{side}" fill="#FAF6EF"/>'
       f'<g fill="#2A1A0F">{"".join(rects)}</g></svg>')
open(os.path.join(ROOT, 'story', 'qr.svg'), 'w', encoding='utf-8').write(svg)

# تحقّق: فكّ الترميز من المصفوفة نفسها
big = cv2.copyMakeBorder(cv2.resize(qr, None, fx=16, fy=16, interpolation=cv2.INTER_NEAREST),
                         64, 64, 64, 64, cv2.BORDER_CONSTANT, value=255)
val = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(big, cv2.COLOR_GRAY2BGR))[0]
assert val == URL, f'فشل التحقق من الباركود: {val!r}'
print('modules:', n, '| verified ->', val)
