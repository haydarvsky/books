# -*- coding: utf-8 -*-
"""يبني مشهد الموشن (١٠ ثوانٍ) لمعرض الأعمال بهوية الموقع نفسها."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = [b for b in json.load(open(os.path.join(ROOT, 'data', 'books.json')))['books'] if not b.get('hidden')]
QR = open(os.path.join(ROOT, 'story', 'qr.svg'), encoding='utf-8').read()

BASE_H = 380          # ارتفاع الكتاب المرجعي (كما في --book-h بالموقع)
GAP = 14
FEATURED = 'bmsu7sz3p'
PEEKS = ['bmsviek27', 'bmsuuyinc', 'bmsu9nl70', 'bmsvk5sz4', 'bmsua3od5',
         'bmsvfxmlc', 'bmsvlyxou', FEATURED]

def hash_(s):
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h

def dims(b):
    hs = b.get('hs') or (0.84 + (hash_(b.get('id') or b['title']) % 17) / 100)
    h = round(BASE_H * hs)
    ar = min(0.9, max(0.55, float(b.get('ar') or 0.68)))
    w = round(h * ar)
    thick = min(5, max(1, int(b.get('thick') or 2)))
    t = round((18 + thick * 8) * (BASE_H / 230))
    if b.get('sar', 0) > 0:
        t = max(6, round(min(h * 0.45, h * b['sar'])))
    return h, w, t

def text_on(hexc):
    r, g, bl = int(hexc[1:3], 16), int(hexc[3:5], 16), int(hexc[5:7], 16)
    return '#2A1A0F' if (r * 299 + g * 587 + bl * 114) / 1000 > 150 else '#FAF6EF'

half = (len(BOOKS) + 1) // 2
rows = [BOOKS[:half], BOOKS[half:]]

idx, shelves_html = 0, []
peek_index, feat_index = {}, None
for row in rows:
    slots = []
    for b in row:
        h, w, t = dims(b)
        c = b.get('color') or '#0F4C3A'
        cov = b.get('cover') or {}
        spine = (f'<img src="../{cov["spine"]}" alt="">' if cov.get('spine') else
                 f'<div class="spine-txt"><span>{b["title"]}</span></div>')
        front = (f'<img src="../{cov["front"]}" alt="">' if cov.get('front') else
                 f'<div class="noimg"><b>{b["title"]}</b></div>')
        back = f'<img src="../{cov["back"]}" alt="">' if cov.get('back') else ''
        if b['id'] in PEEKS:
            peek_index[b['id']] = idx
        if b['id'] == FEATURED:
            feat_index = idx
        slots.append(
            f'<div class="slot" data-i="{idx}" data-id="{b["id"]}" '
            f'style="--w:{w}px;--h:{h}px;--t:{t}px;--c:{c};--tc:{text_on(c)}">'
            f'<div class="book">'
            f'<div class="face f-spine">{spine}</div>'
            f'<div class="face f-front">{front}</div>'
            f'<div class="face f-back">{back}</div>'
            f'<div class="face f-edge"></div><div class="face f-top"></div><div class="face f-bottom"></div>'
            f'</div><div class="book-shadow"></div></div>')
        idx += 1
    shelves_html.append('<div class="shelf"><div class="shelf-row">' + ''.join(slots) +
                        '</div><div class="plank"></div></div>')

feat = next(b for b in BOOKS if b['id'] == FEATURED)
fh, fw, ft = dims(feat)
fcov = feat['cover']
pg = feat['pages'][6] if len(feat.get('pages') or []) > 6 else feat['pages'][0]

peek_list = [peek_index[i] for i in PEEKS if i in peek_index]
count_ar = str(len(BOOKS)).translate(str.maketrans('0123456789', '٠١٢٣٤٥٦٧٨٩'))

HTML = f'''<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>موشن — معرض أعمالي في الكتب</title>
<style>
@font-face{{font-family:"Sakkal Saad";src:url("../fonts/sakkal-400.woff2") format("woff2");font-weight:400}}
@font-face{{font-family:"Sakkal Saad";src:url("../fonts/sakkal-700.woff2") format("woff2");font-weight:700}}
:root{{--green:#0F4C3A;--gold:#D9A441;--cream:#E8DFCC;--paper:#FAF6EF;--ink:#2A1A0F;
  --bg:#171410;--bg-2:#221c15;--wood:#5a3b1e;--wood-d:#33200f;--wood-l:#8a5a2b}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;overflow:hidden;background:var(--bg);
  font-family:"Sakkal Saad",serif;color:var(--cream)}}
.canvas{{position:relative;width:1080px;height:1920px;overflow:hidden;
  background:radial-gradient(820px 560px at 50% 40%,rgba(217,164,65,.11),transparent 70%),
    radial-gradient(1250px 900px at 50% -6%,#31432f 0%,#26302a 28%,var(--bg-2) 58%,var(--bg) 100%)}}
.grain{{position:absolute;inset:0;opacity:.15;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='.6'/></svg>")}}
.vig{{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 78% at 50% 46%,transparent 52%,rgba(0,0,0,.62) 100%)}}

.hdr{{position:absolute;top:150px;left:0;right:0;text-align:center;will-change:transform,opacity}}
.logo{{height:118px;margin:0 auto 20px;display:block;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6))}}
h1{{font-size:70px;font-weight:700;color:var(--paper);text-shadow:0 4px 20px rgba(0,0,0,.55)}}
.rule{{display:flex;align-items:center;justify-content:center;gap:16px;margin:18px auto 0;width:620px;overflow:hidden}}
.rule span{{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(217,164,65,.85),transparent)}}
.rule b{{color:var(--gold);font-size:24px;font-weight:400}}
.sub{{color:var(--gold);font-size:31px;margin-top:14px}}

.stage{{position:absolute;top:596px;left:0;right:0;height:920px;perspective:1600px;perspective-origin:50% 38%}}
.case{{transform-style:preserve-3d;display:flex;flex-direction:column;gap:46px;align-items:center;
  will-change:transform,opacity}}
.shelf{{position:relative;width:980px;height:{BASE_H + 40}px;transform-style:preserve-3d}}
.shelf-row{{position:absolute;inset:0 0 auto 0;height:{BASE_H}px;display:flex;justify-content:center;
  align-items:flex-end;gap:{GAP}px;transform-style:preserve-3d;padding:0 16px}}
.shelf::before{{content:"";position:absolute;left:0;right:0;top:-14px;height:120px;pointer-events:none;z-index:0;
  background:linear-gradient(180deg,rgba(255,236,196,.13),transparent)}}
.plank{{position:absolute;left:-12px;right:-12px;top:{BASE_H}px;height:20px;transform-style:preserve-3d}}
.plank::before{{content:"";position:absolute;inset:0;height:170px;top:-170px;
  background:linear-gradient(to bottom,var(--wood-l) 0%,var(--wood) 60%,var(--wood-d) 100%);
  transform-origin:bottom;transform:rotateX(90deg);box-shadow:inset 0 -30px 60px rgba(0,0,0,.4)}}
.plank::after{{content:"";position:absolute;inset:0;border-radius:2px;
  background:linear-gradient(to bottom,#6b4523,#3a2411 70%,#24160a);
  box-shadow:0 26px 40px -6px rgba(0,0,0,.65),0 2px 0 rgba(255,255,255,.08) inset}}
.slot{{position:relative;height:var(--h);width:var(--t);transform-style:preserve-3d;flex:none;
  will-change:transform,opacity}}
.book{{position:absolute;bottom:0;left:50%;margin-left:calc(var(--t)/-2);width:var(--t);height:var(--h);
  transform-style:preserve-3d;transform-origin:50% 100%;will-change:transform}}
.face{{position:absolute;backface-visibility:hidden;background:#ddd center/cover no-repeat;overflow:hidden}}
.face img{{width:100%;height:100%;object-fit:cover;display:block}}
.f-spine img{{object-fit:fill}}
.f-spine{{left:0;top:0;width:var(--t);height:var(--h);transform:translateZ(calc(var(--w)/2));
  background:var(--c);color:var(--tc);box-shadow:inset -3px 0 6px rgba(0,0,0,.25),inset 3px 0 6px rgba(0,0,0,.25)}}
.f-spine::after{{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(90deg,rgba(0,0,0,.28),transparent 25%,rgba(255,255,255,.12) 50%,transparent 75%,rgba(0,0,0,.28))}}
.spine-txt{{position:absolute;top:50%;left:50%;width:calc(var(--h) - 24px);height:calc(var(--t) - 6px);
  transform:translate(-50%,-50%) rotate(-90deg);display:flex;align-items:center;justify-content:center;
  white-space:nowrap;overflow:hidden;font-weight:700;line-height:1;
  font-size:clamp(11px,calc(var(--t)*.5),24px);text-shadow:0 1px 2px rgba(0,0,0,.35)}}
.f-front{{width:var(--w);height:var(--h);left:calc(var(--t)/2 - var(--w)/2);top:0;
  transform:rotateY(-90deg) translateZ(calc(var(--t)/2));background:var(--c);
  box-shadow:inset 0 0 40px rgba(0,0,0,.15)}}
.f-front::after{{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(90deg,rgba(0,0,0,.18),transparent 12%,transparent 88%,rgba(255,255,255,.08))}}
.f-back{{width:var(--w);height:var(--h);left:calc(var(--t)/2 - var(--w)/2);top:0;
  transform:rotateY(90deg) translateZ(calc(var(--t)/2));background:var(--c)}}
.f-edge{{left:0;top:0;width:var(--t);height:var(--h);transform:rotateY(180deg) translateZ(calc(var(--w)/2));
  background:repeating-linear-gradient(90deg,#f1ead9 0 1px,#d9d0bb 1px 2px)}}
.f-top{{left:0;top:calc(var(--w)/-2);width:var(--t);height:var(--w);transform:rotateX(90deg);
  background:repeating-linear-gradient(0deg,#f1ead9 0 1px,#d9d0bb 1px 2px)}}
.f-bottom{{left:0;top:calc(var(--h) - var(--w)/2);width:var(--t);height:var(--w);transform:rotateX(-90deg);
  background:#cfc6b1}}
.book-shadow{{position:absolute;bottom:-6px;left:50%;width:calc(var(--w)*.9);height:14px;
  transform:translateX(-50%) rotateX(90deg);transform-origin:bottom;opacity:0;
  background:radial-gradient(ellipse at center,rgba(0,0,0,.55),transparent 70%);filter:blur(3px)}}

/* الكتاب المميّز الطائر */
.fly{{position:absolute;top:0;left:0;width:{fw}px;height:{fh}px;opacity:0;
  transform-origin:50% 50%;perspective:1400px;will-change:transform,opacity;z-index:40}}
.fly-in{{position:relative;width:100%;height:100%;transform-style:preserve-3d}}
.fly-in img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:2px;
  box-shadow:0 50px 90px -30px rgba(0,0,0,.85)}}
.fly-sp{{position:absolute;top:0;right:100%;width:{ft}px;height:100%;transform-origin:100% 50%;
  transform:rotateY(72deg)}}

/* التنضيد */
.spread{{position:absolute;left:50%;top:1196px;width:680px;opacity:0;z-index:38;
  transform-origin:50% 0;display:flex;gap:6px;will-change:transform,opacity;
  filter:drop-shadow(0 40px 60px rgba(0,0,0,.75))}}
.spread img{{width:50%;height:auto;display:block;background:var(--paper)}}
.ui{{position:absolute;left:0;right:0;top:1556px;text-align:center;opacity:0;will-change:opacity,transform}}
.chips{{display:flex;justify-content:center;gap:14px}}
.chip{{padding:11px 32px;border-radius:999px;border:1px solid rgba(217,164,65,.5);
  background:rgba(0,0,0,.25);color:var(--cream);font-size:30px}}
.chip.on{{background:var(--gold);color:var(--ink);font-weight:700;border-color:var(--gold);
  box-shadow:0 10px 26px -8px rgba(217,164,65,.55)}}
.uihint{{margin-top:24px;font-size:27px;color:rgba(232,223,204,.72)}}
.cap{{position:absolute;left:0;right:0;top:1724px;text-align:center;font-size:31px;color:var(--paper);opacity:0;z-index:39}}

/* البطاقة الختامية */
.end{{position:absolute;inset:0;opacity:0;z-index:60;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:0;
  background:radial-gradient(760px 700px at 50% 48%,rgba(217,164,65,.10),transparent 72%),
    radial-gradient(1250px 900px at 50% -6%,#31432f 0%,#26302a 28%,var(--bg-2) 58%,var(--bg) 100%)}}
.end-logo{{height:112px;opacity:0;will-change:transform,opacity}}
.end-t{{font-size:58px;font-weight:700;color:var(--paper);margin-top:26px;opacity:0}}
.qr-wrap{{margin-top:44px;width:430px;height:430px;border-radius:30px;background:var(--paper);
  padding:30px;box-shadow:0 40px 80px -24px rgba(0,0,0,.8),0 0 0 3px rgba(217,164,65,.85);
  opacity:0;will-change:transform,opacity}}
.qr-wrap svg{{width:100%;height:100%;display:block}}
.bio{{margin-top:40px;font-size:44px;font-weight:700;color:var(--gold);opacity:0}}
.bio-s{{margin-top:14px;font-size:29px;color:rgba(232,223,204,.75);opacity:0}}
</style></head>
<body><div class="canvas">
  <div class="grain"></div>
  <header class="hdr" id="hdr">
    <img class="logo" id="logo" src="../img/logo-cream.svg" alt="">
    <h1 id="h1">معرض أعمالي في الكتب</h1>
    <div class="rule" id="rule"><span></span><b>✦</b><span></span></div>
    <p class="sub" id="sub">تصميم الأغلفة · التنضيد الداخلي · إخراج الكتاب</p>
  </header>

  <div class="stage"><div class="case" id="case">{''.join(shelves_html)}</div></div>

  <div class="ui" id="ui">
    <div class="chips"><div class="chip on">الكل</div><div class="chip">أغلفة</div><div class="chip">تنضيد</div></div>
    <p class="uihint">قِف على كتابٍ لتتأمّل غلافه · واضغطه لتقرأ تفاصيله</p>
  </div>

  <div class="fly" id="fly"><div class="fly-in" id="flyIn">
    <div class="fly-sp"><img src="../{fcov['spine']}" alt=""></div>
    <img src="../{fcov['front']}" alt="">
  </div></div>

  <div class="spread" id="spread">
    <img src="../{pg['r']}" alt=""><img src="../{pg['l']}" alt="">
  </div>
  <p class="cap" id="cap">من الغلاف إلى التنضيد · كتابٌ متكامل</p>

  <div class="vig"></div>

  <div class="end" id="end">
    <img class="end-logo" id="endLogo" src="../img/logo-cream.svg" alt="">
    <p class="end-t" id="endT">معرض أعمالي في الكتب</p>
    <div class="qr-wrap" id="qr">{QR}</div>
    <p class="bio" id="bio">رابط المعرض في البايو</p>
    <p class="bio-s" id="bioS">{count_ar} كتاباً · أغلفة وتنضيد · حيدر</p>
  </div>
</div>

<script>
const DUR = 10.0;
const PEEKS = {json.dumps(peek_list)};
const FEAT = {feat_index};
const $ = s => document.querySelector(s);
const slots = [...document.querySelectorAll('.slot')];
const books = slots.map(s => s.querySelector('.book'));
const shadows = slots.map(s => s.querySelector('.book-shadow'));
const planks = [...document.querySelectorAll('.plank')];

const cl = (v,a,b) => Math.min(b, Math.max(a, v));
const seg = (t,a,b) => cl((t-a)/(b-a), 0, 1);
const eo = p => 1 - Math.pow(1-p, 3);              // خروج هادئ
const eio = p => p<.5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
const lerp = (a,b,p) => a + (b-a)*p;

let featRect = null;
function measure(){{
  const r = slots[FEAT].getBoundingClientRect();
  featRect = {{x: r.left + r.width/2, y: r.top + r.height/2}};
}}

function setFrame(t){{
  if(!featRect) measure();

  /* ١ — الترويسة */
  const pl = eo(seg(t,.05,.75)), pt = eo(seg(t,.30,1.00)),
        pr = eo(seg(t,.55,1.15)), ps = eo(seg(t,.80,1.40));
  const hdrOut = eio(seg(t,7.55,8.05));
  $('#logo').style.opacity = pl;
  $('#logo').style.transform = `translateY(${{lerp(34,0,pl)}}px) scale(${{lerp(.84,1,pl)}})`;
  $('#h1').style.opacity = pt;
  $('#h1').style.transform = `translateY(${{lerp(28,0,pt)}}px)`;
  $('#rule').style.opacity = pr;
  $('#rule').style.width = lerp(120,620,pr)+'px';
  $('#sub').style.opacity = ps*.98;
  $('#sub').style.transform = `translateY(${{lerp(16,0,ps)}}px)`;
  $('#hdr').style.opacity = 1-hdrOut;
  $('#hdr').style.transform = `translateY(${{-40*hdrOut}}px)`;

  /* ٢ — وصول الرفوف والكتب */
  planks.forEach((pk,i) => {{
    const p = eo(seg(t, .95 + i*.14, 1.55 + i*.14));
    pk.style.opacity = p;
    pk.style.transform = `translateY(${{lerp(26,0,p)}}px)`;
  }});
  const drop = [];
  slots.forEach((s,i) => {{
    const d = 1.05 + i*.021;
    const p = eo(seg(t, d, d+.55));
    drop[i] = p;
    s.style.opacity = p;
  }});

  /* ٣ — موجة الاستعراض: كتابٌ يخرج ليكشف غلافه ثم يعود */
  const peekAmt = new Array(slots.length).fill(0);
  PEEKS.forEach((bi,k) => {{
    const t0 = 2.30 + k*.30, isLast = k === PEEKS.length-1;
    let q;
    if(isLast) q = eo(seg(t, t0, t0+.42));                       // الأخير يبقى خارجاً
    else {{
      const out = eo(seg(t, t0, t0+.34));
      const back = eio(seg(t, t0+.60, t0+.95));
      q = out * (1-back);
    }}
    peekAmt[bi] = Math.max(peekAmt[bi], q);
  }});
  books.forEach((bk,i) => {{
    const q = peekAmt[i], p = drop[i];
    bk.style.transform =
      `translateY(${{lerp(-70,0,p) - 18*q}}px) translateZ(${{lerp(150,0,p) + 118*q}}px) rotateY(${{84*q}}deg)`;
    slots[i].style.zIndex = q > .02 ? Math.round(10 + q*40) : 1;
    shadows[i].style.opacity = q*.9;
  }});

  /* ٤ — الكاميرا */
  const drift = eio(seg(t,1.2,5.2)), push = eio(seg(t,5.25,7.5));
  const dim = eio(seg(t,5.5,6.4));
  $('#case').style.transform =
    `translateY(${{lerp(0,-16,drift) + lerp(0,-96,push)}}px) scale(${{lerp(1,1.04,drift)*lerp(1,1.15,push)}}) rotateX(${{lerp(6,2.5,drift)}}deg)`;
  $('#case').style.opacity = 1 - .55*dim - .45*eio(seg(t,7.4,7.9));
  $('#case').style.filter = `blur(${{7*dim}}px)`;

  /* واجهة الموقع */
  const up = eo(seg(t,1.85,2.35)), uo = eio(seg(t,5.15,5.6));
  $('#ui').style.opacity = up*(1-uo);
  $('#ui').style.transform = `translateY(${{lerp(22,0,up) - 30*uo}}px)`;

  /* ٥ — الكتاب المميّز يتقدّم إلى المنتصف */
  const fp = eio(seg(t,5.45,6.55)), fo = eio(seg(t,7.45,7.95));
  const cx = 540, cy = 806;
  const fx = lerp(featRect.x, cx, fp) - {fw}/2;
  const fy = lerp(featRect.y, cy, fp) - {fh}/2;
  $('#fly').style.opacity = fp>0 ? Math.min(1, fp*2.4)*(1-fo) : 0;
  $('#fly').style.transform =
    `translate(${{fx}}px,${{fy}}px) scale(${{lerp(.62,1.42,fp)}}) rotate(${{lerp(-3,0,fp)}}deg)`;
  $('#flyIn').style.transform = `rotateY(${{lerp(-38,-13,fp)}}deg) rotateX(${{lerp(4,1.5,fp)}}deg)`;

  /* ٦ — التنضيد */
  const sp = eio(seg(t,6.55,7.35)), spo = eio(seg(t,7.5,7.95));
  $('#spread').style.opacity = sp*(1-spo);
  $('#spread').style.transform =
    `translateX(-50%) translateY(${{lerp(140,0,sp)}}px) scale(${{lerp(.9,1,sp)}}) rotateX(${{lerp(14,6,sp)}}deg)`;
  const cp = eio(seg(t,6.95,7.5));
  $('#cap').style.opacity = cp*(1-spo);
  $('#cap').style.transform = `translateY(${{lerp(20,0,cp)}}px)`;

  /* ٧ — البطاقة الختامية والباركود */
  const ep = eio(seg(t,7.75,8.25));
  $('#end').style.opacity = ep;
  const elp = eo(seg(t,7.95,8.45)), etp = eo(seg(t,8.10,8.60)),
        qp  = eo(seg(t,8.25,8.85)), bp = eo(seg(t,8.60,9.10)), bsp = eo(seg(t,8.85,9.35));
  $('#endLogo').style.opacity = elp;
  $('#endLogo').style.transform = `translateY(${{lerp(24,0,elp)}}px) scale(${{lerp(.9,1,elp)}})`;
  $('#endT').style.opacity = etp;
  $('#endT').style.transform = `translateY(${{lerp(20,0,etp)}}px)`;
  $('#qr').style.opacity = qp;
  $('#qr').style.transform = `translateY(${{lerp(30,0,qp)}}px) scale(${{lerp(.86,1,qp)}})`;
  $('#bio').style.opacity = bp;
  $('#bio').style.transform = `translateY(${{lerp(18,0,bp)}}px)`;
  $('#bioS').style.opacity = bsp*.9;
}}
window.setFrame = setFrame;
window.ready = Promise.all([document.fonts.ready,
  ...[...document.images].map(im => im.decode ? im.decode().catch(()=>{{}}) : Promise.resolve())])
  .then(() => {{ measure(); setFrame(0); return true; }});
</script></body></html>'''

open(os.path.join(ROOT, 'story', 'motion.html'), 'w', encoding='utf-8').write(HTML)
print('books:', len(BOOKS), 'peeks:', peek_list, 'featured idx:', feat_index)
