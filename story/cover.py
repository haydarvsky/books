# -*- coding: utf-8 -*-
"""كفر الفيديو (١٠٨٠×١٩٢٠) — العناصر الأساسية داخل المربّع الأوسط ليسلم قصّ الشبكة."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = [b for b in json.load(open(os.path.join(ROOT, 'data', 'books.json')))['books'] if not b.get('hidden')]
by = {b['id']: b for b in BOOKS}

FEAT = 'bmsu7sz3p'
BEHIND = ['bmsuuyinc', 'bmsu9nl70', 'bmsvfxmlc', 'bmsu7kf3m']

f = by[FEAT]
FH = 620
FW = round(FH * f.get('ar', 0.7))
FT = max(18, round(FH * f.get('sar', 0.08)))

behind = []
for i, bid in enumerate(BEHIND):
    b = by[bid]
    h = 276 + (i % 3) * 14
    w = round(h * b.get('ar', 0.666))
    behind.append(f'<div class="bk" style="--h:{h}px;--w:{w}px;--c:{b["color"]}">'
                  f'<img src="../{b["cover"]["front"]}" alt=""></div>')

count_ar = str(len(BOOKS)).translate(str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩'))

HTML = f'''<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>كفر الفيديو</title>
<style>
@font-face{{font-family:"Sakkal Saad";src:url("../fonts/sakkal-400.woff2") format("woff2");font-weight:400}}
@font-face{{font-family:"Sakkal Saad";src:url("../fonts/sakkal-700.woff2") format("woff2");font-weight:700}}
:root{{--gold:#D9A441;--cream:#E8DFCC;--paper:#FAF6EF;--ink:#2A1A0F;
  --bg:#171410;--bg-2:#221c15;--wood:#5a3b1e;--wood-d:#33200f;--wood-l:#8a5a2b}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;overflow:hidden;font-family:"Sakkal Saad",serif;color:var(--cream);background:var(--bg)}}
.canvas{{position:relative;width:1080px;height:1920px;overflow:hidden;
  background:radial-gradient(760px 620px at 50% 52%,rgba(217,164,65,.14),transparent 70%),
    radial-gradient(1250px 900px at 50% -6%,#31432f 0%,#26302a 28%,var(--bg-2) 58%,var(--bg) 100%)}}
.grain{{position:absolute;inset:0;opacity:.15;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='.6'/></svg>")}}
.vig{{position:absolute;inset:0;background:radial-gradient(120% 76% at 50% 48%,transparent 50%,rgba(0,0,0,.66) 100%)}}

.hdr{{position:absolute;top:300px;left:0;right:0;text-align:center;z-index:5}}
.logo{{height:112px;margin:0 auto 20px;display:block;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6))}}
h1{{font-size:82px;font-weight:700;color:var(--paper);line-height:1.15;text-shadow:0 6px 26px rgba(0,0,0,.7)}}
.rule{{display:flex;align-items:center;justify-content:center;gap:16px;margin:22px auto 0;width:600px}}
.rule span{{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(217,164,65,.85),transparent)}}
.rule b{{color:var(--gold);font-size:26px;font-weight:400}}
.sub{{color:var(--gold);font-size:34px;margin-top:16px}}

/* رفّ الخلفية */
.back{{position:absolute;left:0;right:0;top:1056px;height:304px;display:flex;justify-content:center;align-items:flex-end;
  gap:26px;filter:blur(2px) brightness(.62);z-index:1}}
.bk{{position:relative;width:var(--w);height:var(--h);background:var(--c);border-radius:3px;
  box-shadow:0 22px 34px -14px rgba(0,0,0,.8)}}
.bk img{{width:100%;height:100%;object-fit:cover;border-radius:3px}}
.plank{{position:absolute;left:44px;right:44px;top:1360px;height:22px;z-index:2;border-radius:3px;
  background:linear-gradient(to bottom,#6b4523,#3a2411 70%,#24160a);
  box-shadow:0 30px 50px -10px rgba(0,0,0,.75),inset 0 2px 0 rgba(255,255,255,.10)}}

/* الكتاب العربي: الكعب على اليمين */
.fly{{position:absolute;left:50%;top:742px;width:{FW}px;height:{FH}px;margin-left:-{FW//2}px;
  perspective:1500px;z-index:4}}
.fly-in{{position:relative;width:100%;height:100%;transform-style:preserve-3d;
  transform:rotateY(-15deg) rotateX(2deg)}}
.fly-in>img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:2px;
  box-shadow:0 60px 110px -34px rgba(0,0,0,.9)}}
.fly-sp{{position:absolute;top:0;left:100%;width:{FT}px;height:100%;transform-origin:0% 50%;
  transform:rotateY(80deg);box-shadow:inset 6px 0 14px rgba(0,0,0,.35)}}
.fly-sp img{{width:100%;height:100%;object-fit:fill;display:block}}
.glow{{position:absolute;left:50%;top:1330px;width:760px;height:120px;margin-left:-380px;z-index:3;
  background:radial-gradient(ellipse at center,rgba(217,164,65,.20),transparent 70%);filter:blur(8px)}}

.foot{{position:absolute;left:0;right:0;top:1478px;text-align:center;z-index:6}}
.chip{{display:inline-block;padding:14px 40px;border-radius:999px;background:var(--gold);color:var(--ink);
  font-size:34px;font-weight:700;box-shadow:0 14px 34px -10px rgba(217,164,65,.65)}}
.sign{{margin-top:26px;font-size:29px;color:rgba(232,223,204,.72)}}
</style></head>
<body><div class="canvas">
  <div class="grain"></div>
  <header class="hdr">
    <img class="logo" src="../img/logo-cream.svg" alt="">
    <h1>معرض أعمالي<br>في الكتب</h1>
    <div class="rule"><span></span><b>✦</b><span></span></div>
    <p class="sub">جولةٌ في رفّ الأعمال</p>
  </header>

  <div class="back">{''.join(behind)}</div>
  <div class="plank"></div>
  <div class="glow"></div>

  <div class="fly"><div class="fly-in">
    <div class="fly-sp"><img src="../{f['cover']['spine']}" alt=""></div>
    <img src="../{f['cover']['front']}" alt="">
  </div></div>

  <div class="foot">
    <span class="chip">{count_ar} كتاباً · أغلفة وتنضيد</span>
    <p class="sign">حيدر — أبو إيليا · من الفكرة إلى المطبعة</p>
  </div>
  <div class="vig"></div>
</div></body></html>'''

open(os.path.join(ROOT, 'story', 'cover.html'), 'w', encoding='utf-8').write(HTML)
print('cover built')
