#!/usr/bin/env python3
"""إضافة كتاب إلى معرض الكتب من ملفَّي PDF (الغلاف + الكتاب) ونشره على haydarvsky.github.io/books

الاستعمال:
  python3 tools/add_book.py --cover غلاف.pdf --book كتاب.pdf --title "العنوان" --author "المؤلف" \
      --work both|cover|typeset [--lang ar|en] [--spreads 8] [--seed 7] [--year ...] [--note ...] \
      [--featured] [--hidden] [--dry-run] [--no-push] [--assets مجلد]

قواعد الفتحات:
  - الفتحة الأولى ثابتة: الصفحتان ٢–٣.
  - الباقي عشوائي: أزواجٌ متتالية (زوجي، فردي) = (٤–٥)، (٦–٧)… تُرتَّب تصاعدياً، وتُتجنَّب الصفحات البيضاء.
  - العربي: الزوجي يميناً والفردي يساراً. الإنجليزي: العكس (dir=ltr).

ملف الغلاف: ٤ لوحات (أمامي، كعب، خلفي، كامل) بأي ترتيب — تُميَّز آلياً:
  الأعرض = الكامل، الأضيق = الكعب، والأمامي هو ما يطابق نصف الكامل الذي يليه
  (العربي: الأمامي يسار الكامل، والإنجليزي: يمينه).
"""
import argparse, io, json, os, random, subprocess, sys, time
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageChops, ImageStat

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / 'data' / 'books.json'


def b36(n):
    s, a = '', '0123456789abcdefghijklmnopqrstuvwxyz'
    while n: n, r = divmod(n, 36); s = a[r] + s
    return s or '0'


def render(page, max_edge, dpi_cap=400):
    r = page.rect
    zoom = min(dpi_cap / 72, max_edge / max(r.width, r.height))
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False, colorspace=fitz.csRGB)
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)


def fit(im, max_edge):
    k = min(1, max_edge / max(im.size))
    return im if k == 1 else im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def jpeg(im, q):
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True); return buf.getvalue()


def ink(im):
    """نسبة الحبر في الصفحة — للتعرّف على الصفحات البيضاء"""
    g = im.convert('L').resize((120, round(120 * im.height / im.width)))
    px = list(g.tobytes())
    return sum(1 for v in px if v < 200) / len(px)


def dominant_color(im):
    """منقول من js/imgtools.js — متوسطٌ مشبَّع قليلاً"""
    import colorsys
    r, g, b = ImageStat.Stat(im.convert('RGB').resize((24, 24))).mean
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    s = min(1, s * 1.25 + .05)
    if l > .7: l = .55
    if l < .12: l = .18
    R, G, B = colorsys.hls_to_rgb(h, l, s)
    return '#' + ''.join(f'{round(v * 255):02x}' for v in (R, G, B))


def diff(a, b):
    size = (60, 90)
    return sum(ImageStat.Stat(ImageChops.difference(a.convert('RGB').resize(size), b.convert('RGB').resize(size))).mean)


def split_cover(pdf, ltr):
    doc = fitz.open(pdf)
    ims = [render(p, 3000) for p in doc]
    n = len(ims)
    if n == 1:
        sys.exit('ملف الغلاف فيه لوحة واحدة — المطلوب ٤ لوحات (أمامي، كعب، خلفي، كامل)')
    ratio = [im.width / im.height for im in ims]
    idx = list(range(n))
    full = max(idx, key=lambda i: ratio[i]) if n >= 4 else None
    rest = [i for i in idx if i != full]
    spine = min(rest, key=lambda i: ratio[i]) if n >= 3 else None
    faces = [i for i in rest if i != spine][:2]
    front, back = faces[0], (faces[1] if len(faces) > 1 else None)
    if full is not None and back is not None:
        F = ims[full]
        fw = round(F.height * ratio[front])
        left, right = F.crop((0, 0, fw, F.height)), F.crop((F.width - fw, 0, F.width, F.height))
        front_side = right if ltr else left  # العربي: الأمامي على يسار الغلاف المفرود
        if diff(ims[back], front_side) < diff(ims[front], front_side):
            front, back = back, front
    out = {'front': ims[front]}
    if spine is not None: out['spine'] = ims[spine]
    if back is not None: out['back'] = ims[back]
    if full is not None: out['full'] = ims[full]
    return out


def pick_spreads(doc, count, seed):
    """(٢،٣) ثابتة + أزواج (زوجي، فردي) عشوائية بلا صفحات بيضاء. الأرقام أرقام صفحات الكتاب (١ = أول صفحة في الملف)"""
    N = len(doc)
    if N < 3: sys.exit('الكتاب أقصر من ٣ صفحات')
    thumbs = {}
    def blank(n):
        if n not in thumbs: thumbs[n] = ink(render(doc[n - 1], 240)) < 0.004
        return thumbs[n]
    pool = [(e, e + 1) for e in range(4, N, 2) if e + 1 <= N]
    rnd = random.Random(seed)
    rnd.shuffle(pool)
    chosen = []
    for e, o in pool:
        if len(chosen) >= count - 1: break
        if blank(e) or blank(o): continue
        chosen.append((e, o))
    return [(2, 3)] + sorted(chosen)


def git(*a, check=True):
    return subprocess.run(['git', '-C', str(REPO), *a], check=check, capture_output=True, text=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cover'); ap.add_argument('--book')
    ap.add_argument('--title', required=True); ap.add_argument('--author', default='')
    ap.add_argument('--work', choices=['both', 'cover', 'typeset'], default='both')
    ap.add_argument('--lang', choices=['ar', 'en'], default='ar')
    ap.add_argument('--spreads', type=int, default=8, help='عدد الفتحات مع الثابتة ٢–٣')
    ap.add_argument('--seed', type=int, default=None)
    ap.add_argument('--year', default=''); ap.add_argument('--note', default='')
    ap.add_argument('--featured', action='store_true'); ap.add_argument('--hidden', action='store_true')
    ap.add_argument('--dry-run', action='store_true', help='يجهّز الأصول والمعاينة بلا كتابة في المستودع')
    ap.add_argument('--no-push', action='store_true')
    ap.add_argument('--assets', help='مجلد أصول عالية الدقة لبيهانس (افتراضياً كودات/بيهانس-<العنوان>/أصول)')
    a = ap.parse_args()

    ltr = a.lang == 'en'
    work = {'both': ['cover', 'typeset'], 'cover': ['cover'], 'typeset': ['typeset']}[a.work]
    if not a.cover and not a.book: sys.exit('أعطني ملف الغلاف أو ملف الكتاب على الأقل')
    if 'typeset' in work and not a.book: sys.exit('التنضيد يحتاج ملف الكتاب --book')

    assets = Path(a.assets) if a.assets else REPO.parent / f"بيهانس-{a.title.replace(' ', '-')}" / 'أصول'
    assets.mkdir(parents=True, exist_ok=True)

    if not a.dry_run:
        git('pull', '-q', '--ff-only')

    seed = a.seed if a.seed is not None else int(time.time()) % 100000
    bid = 'b' + b36(int(time.time() * 1000)); ts = b36(int(time.time() * 1000) + 7)
    rel = f'images/{bid}'
    files = {}  # path -> bytes
    book = {'id': bid, 'title': a.title, 'author': a.author, 'year': a.year, 'note': a.note,
            'work': work, 'thick': 3, 'color': '#0F4C3A', 'hidden': a.hidden}
    if a.featured: book['featured'] = True
    if ltr: book['dir'] = 'ltr'

    # ——— الغلاف ———
    cov = {}
    if a.cover:
        parts = split_cover(a.cover, ltr)
        for k, im in parts.items():
            im.save(assets / f'cover-{k}.png')
        fr = fit(parts['front'], 2000)
        files[f'{rel}/front-{ts}.jpg'] = jpeg(fr, 88); cov['front'] = f'{rel}/front-{ts}.jpg'
        book['ar'] = round(fr.width / fr.height, 3)
        book['color'] = dominant_color(parts['front'])
        if 'cover' in work:
            if 'spine' in parts:
                sp = fit(parts['spine'], 2000)
                files[f'{rel}/spine-{ts}.jpg'] = jpeg(sp, 88); cov['spine'] = f'{rel}/spine-{ts}.jpg'
                book['sar'] = round(sp.width / sp.height, 4)
            if 'back' in parts:
                files[f'{rel}/back-{ts}.jpg'] = jpeg(fit(parts['back'], 2000), 88); cov['back'] = f'{rel}/back-{ts}.jpg'
        print('الغلاف:', {k: v.size for k, v in parts.items()})
    book['cover'] = cov

    # ——— التنضيد ———
    pages, spreads = [], []
    if a.book:
        doc = fitz.open(a.book)
        if not a.cover:  # بلا ملف غلاف: الصفحة الأولى واجهةٌ مؤقتة
            fr = fit(render(doc[0], 2000), 2000)
            files[f'{rel}/front-{ts}.jpg'] = jpeg(fr, 88); cov['front'] = f'{rel}/front-{ts}.jpg'
            book['ar'] = round(fr.width / fr.height, 3)
        if 'typeset' in work:
            spreads = pick_spreads(doc, a.spreads, seed)
            pars = []
            for i, (e, o) in enumerate(spreads, 1):
                ime, imo = render(doc[e - 1], 2400), render(doc[o - 1], 2400)
                ime.save(assets / f'page-{e:03d}.png'); imo.save(assets / f'page-{o:03d}.png')
                # العربي: الزوجي يميناً والفردي يساراً — والإنجليزي بالعكس
                right, left = (imo, ime) if ltr else (ime, imo)
                nn = f'{i:02d}'
                pr, pl = f'{rel}/p{nn}-r-{ts}.jpg', f'{rel}/p{nn}-l-{ts}.jpg'
                files[pr] = jpeg(fit(right, 1600), 85); files[pl] = jpeg(fit(left, 1600), 85)
                pages.append({'r': pr, 'l': pl}); pars += [ime.width / ime.height, imo.width / imo.height]
            book['par'] = round(sorted(pars)[len(pars) // 2], 3)
        book['pageCount'] = len(doc)
        print('الفتحات:', ' · '.join(f'{e}-{o}' for e, o in spreads), f'(البذرة {seed}، الصفحات {len(doc)})')
    book['pages'] = pages
    book['updatedAt'] = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')

    # معاينة سريعة للفتحات بترتيب العرض
    if pages:
        w, h = 260, round(260 / book['par'])
        sheet = Image.new('RGB', (2 * w * 4 + 5 * 20, (h + 20) * ((len(pages) + 3) // 4) + 20), '#ddd')
        for i, p in enumerate(pages):
            R = Image.open(io.BytesIO(files[p['r']])).resize((w, h)); L = Image.open(io.BytesIO(files[p['l']])).resize((w, h))
            x, y = 20 + (i % 4) * (2 * w + 20), 20 + (i // 4) * (h + 20)
            sheet.paste(L, (x, y)); sheet.paste(R, (x + w, y))
        sheet.save(assets / 'spreads-preview.jpg', quality=80)
    json.dump({**book, 'spreadsNumbers': spreads, 'seed': seed}, open(assets / 'book.json', 'w'), ensure_ascii=False, indent=2)
    print('الأصول:', assets)

    if a.dry_run:
        print('تجربة فقط — لم يُكتب شيء في المستودع'); return

    for p, data in files.items():
        f = REPO / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_bytes(data)
    db = json.load(open(DATA))
    db['books'] = sorted(db.get('books', []), key=lambda b: b.get('order', 0))
    book['order'] = len(db['books']); db['books'].append(book)
    for i, b in enumerate(db['books']): b['order'] = i
    db['updated'] = book['updatedAt']
    DATA.write_text(json.dumps(db, ensure_ascii=False, indent=2) + '\n')
    git('add', 'data/books.json', rel)
    git('commit', '-q', '-m', f'إضافة كتاب: {a.title}')
    print('التزام:', git('log', '--oneline', '-1'))
    if not a.no_push:
        r = subprocess.run(['git', '-C', str(REPO), 'push', '-q', 'origin', 'main'], capture_output=True, text=True)
        if r.returncode: sys.exit('فشل الدفع:\n' + r.stderr)
        print('نُشر ← https://haydarvsky.github.io/books/  (المعرّف', bid + ')')


if __name__ == '__main__':
    main()
