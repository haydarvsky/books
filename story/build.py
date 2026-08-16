# -*- coding: utf-8 -*-
"""يبني ستوري إنستغرام (1080×1920) من هوية موقع «معرض أعمالي في الكتب»."""
import json, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
books = json.load(open(os.path.join(ROOT, 'data', 'books.json')))['books']
by = {b['id']: b for b in books}

# اختيار أعمالٍ متنوّعة الألوان لثلاثة رفوف
SHELVES = [
    ['bmsu7sz3p', 'bmsu9nl70', 'bmsviek27', 'bmsuuyinc', 'bmsvg9mcy'],
    ['bmsua3od5', 'bmsuufjd0', 'bmsvk5sz4', 'bmsvqyqnf', 'bmsvfxmlc'],
    ['bmsu7kf3m', 'bmsvlcyza', 'bmsvrntdh', 'bmsvhkkgm', 'bmsu5w29j'],
]

BOOK_H = [214, 200, 222, 206, 218]  # تفاوتٌ طفيف في الأطوال ليبدو الرفّ حيًّا

def shelf_html(ids, si):
    cells = []
    for i, bid in enumerate(ids):
        b = by[bid]
        h = BOOK_H[(i + si) % len(BOOK_H)]
        w = round(h * b.get('ar', 0.666))
        cells.append(
            f'<div class="bk" style="--h:{h}px;--w:{w}px;--c:{b["color"]}">'
            f'<img src="../{b["cover"]["front"]}" alt="">'
            f'<i class="glare"></i></div>'
        )
    return ('<div class="shelf"><div class="row">' + ''.join(cells) +
            '</div><div class="plank"></div></div>')

scene = ''.join(shelf_html(ids, i) for i, ids in enumerate(SHELVES))
count = len(books)
count_ar = str(count).translate(str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩'))

HTML = f'''<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>ستوري — معرض أعمالي في الكتب</title>
<style>
@font-face{{font-family:"Sakkal Saad";src:url("../fonts/sakkal-400.woff2") format("woff2");font-weight:400}}
@font-face{{font-family:"Sakkal Saad";src:url("../fonts/sakkal-700.woff2") format("woff2");font-weight:700}}
:root{{
  --green:#0F4C3A;--green-2:#1B6B52;--amber:#C2780A;--gold:#D9A441;
  --cream:#E8DFCC;--paper:#FAF6EF;--ink:#2A1A0F;
  --bg:#171410;--bg-2:#221c15;--wood:#5a3b1e;--wood-d:#33200f;--wood-l:#8a5a2b;
}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;overflow:hidden;font-family:"Sakkal Saad",serif;
  color:var(--cream);background:var(--bg)}}
.canvas{{position:relative;width:1080px;height:1920px;overflow:hidden;
  background:
    radial-gradient(820px 560px at 50% 36%,rgba(217,164,65,.11),transparent 70%),
    radial-gradient(1250px 900px at 50% -6%,#31432f 0%,#26302a 28%,var(--bg-2) 58%,var(--bg) 100%);}}
/* حبيبات ورقية خفيفة */
.grain{{position:absolute;inset:0;opacity:.16;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='.6'/></svg>")}}
.vig{{position:absolute;inset:0;background:radial-gradient(120% 78% at 50% 46%,transparent 52%,rgba(0,0,0,.62) 100%)}}

/* ===== الترويسة ===== */
.hdr{{position:absolute;top:138px;left:0;right:0;text-align:center}}
.logo{{height:132px;margin:0 auto 22px;display:block;
  filter:drop-shadow(0 10px 26px rgba(0,0,0,.6))}}
h1{{font-size:74px;font-weight:700;color:var(--paper);line-height:1.18;
  text-shadow:0 4px 20px rgba(0,0,0,.55)}}
.rule{{display:flex;align-items:center;justify-content:center;gap:16px;margin:20px auto 0;width:640px}}
.rule span{{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(217,164,65,.85),transparent)}}
.rule b{{color:var(--gold);font-size:26px;font-weight:400}}
.sub{{color:var(--gold);font-size:33px;margin-top:16px;opacity:.95}}

/* ===== الرفّ ===== */
.stage{{position:absolute;top:548px;left:0;right:0;height:830px;
  perspective:1500px;perspective-origin:50% 40%}}
.case{{transform-style:preserve-3d;transform:rotateX(4deg);
  display:flex;flex-direction:column;gap:30px;align-items:center}}
.shelf{{position:relative;width:930px;height:250px;transform-style:preserve-3d}}
.row{{position:absolute;inset:auto 0 22px 0;display:flex;justify-content:center;
  align-items:flex-end;gap:26px;transform-style:preserve-3d}}
.bk{{position:relative;width:var(--w);height:var(--h);background:var(--c);border-radius:3px;
  box-shadow:0 22px 30px -12px rgba(0,0,0,.75),0 2px 0 rgba(0,0,0,.5),
             inset 0 0 26px rgba(0,0,0,.22);transform-style:preserve-3d}}
.bk img{{width:100%;height:100%;object-fit:cover;border-radius:3px;display:block}}
/* حافّة الورق على يسار الغلاف */
.bk::before{{content:"";position:absolute;top:4px;bottom:4px;left:-5px;width:5px;border-radius:2px 0 0 2px;opacity:.75;
  background:linear-gradient(90deg,#4a4034,#9d9280 45%,#c3b9a3 72%,#6d6355)}}
.bk::after{{content:"";position:absolute;inset:0;border-radius:3px;pointer-events:none;
  background:linear-gradient(100deg,rgba(255,255,255,.16) 0 12%,transparent 34%,transparent 70%,rgba(0,0,0,.3));
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}}
.glare{{position:absolute;inset:auto 0 -24px 0;height:24px;
  background:linear-gradient(180deg,rgba(0,0,0,.5),transparent);filter:blur(4px)}}
.plank{{position:absolute;left:-14px;right:-14px;bottom:0;height:22px;
  background:linear-gradient(to bottom,#6b4523,#3a2411 70%,#24160a);border-radius:3px;
  box-shadow:0 26px 44px -8px rgba(0,0,0,.7),inset 0 2px 0 rgba(255,255,255,.10)}}
.plank::before{{content:"";position:absolute;left:0;right:0;bottom:22px;height:26px;
  background:linear-gradient(to bottom,rgba(138,90,43,.95),rgba(90,59,30,.6));
  transform-origin:bottom;transform:scaleY(.55);filter:blur(.4px);opacity:.9}}

/* ===== شريط الأرقام ===== */
.chips{{position:absolute;top:1408px;left:0;right:0;display:flex;justify-content:center;gap:16px}}
.chip{{padding:12px 34px;border-radius:999px;border:1px solid rgba(217,164,65,.55);
  background:rgba(0,0,0,.28);color:var(--cream);font-size:31px}}
.chip.on{{background:var(--gold);color:var(--ink);font-weight:700;border-color:var(--gold);
  box-shadow:0 10px 26px -8px rgba(217,164,65,.6)}}

/* ===== منطقة الملصق (الرابط) ===== */
.cta{{position:absolute;top:1498px;left:0;right:0;text-align:center}}
.cta p{{font-size:34px;color:var(--paper);opacity:.95}}
.arrows{{margin-top:14px;color:var(--gold);font-size:38px;letter-spacing:18px;opacity:.85}}
.slot{{position:absolute;top:1580px;left:50%;transform:translateX(-50%);
  width:680px;height:160px;border-radius:26px;
  background:radial-gradient(62% 100% at 50% 50%,rgba(217,164,65,.17),rgba(217,164,65,.05) 55%,transparent 74%)}}
.sign{{position:absolute;bottom:104px;left:0;right:0;text-align:center;
  font-size:25px;color:rgba(232,223,204,.55)}}
</style></head>
<body><div class="canvas">
  <div class="grain"></div>

  <header class="hdr">
    <img class="logo" src="../img/logo-cream.svg" alt="">
    <h1>معرض أعمالي في الكتب</h1>
    <div class="rule"><span></span><b>✦</b><span></span></div>
    <p class="sub">تصميم الأغلفة · التنضيد الداخلي · إخراج الكتاب</p>
  </header>

  <div class="stage"><div class="case">{scene}</div></div>

  <div class="chips">
    <div class="chip on">{count_ar} كتاباً على الرفّ</div>
    <div class="chip">أغلفة</div>
    <div class="chip">تنضيد</div>
  </div>

  <div class="cta">
    <p>افتح الرفّ التفاعلي وتصفّح الأعمال</p>
    <div class="arrows">﹀ ﹀ ﹀</div>
  </div>
  <div class="slot"></div>

  <p class="sign">حيدر — أبو إيليا · من الفكرة إلى المطبعة</p>
  <div class="vig"></div>
</div></body></html>'''

open(os.path.join(ROOT, 'story', 'story.html'), 'w', encoding='utf-8').write(HTML)
print('ok')
