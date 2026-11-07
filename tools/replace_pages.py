import sys, io, json, time
from pathlib import Path
REPO = Path('/Volumes/Extreme Pro/محتواي/كودات/معرض-الكتب')
sys.path.insert(0, str(REPO / 'tools'))
import add_book as A, fitz
from PIL import Image
PDF = sys.argv[1]; SEED = 0; OUT = Path(sys.argv[3]); WRITE = len(sys.argv) > 4 and sys.argv[4] == 'write'
import os
BID = os.environ.get('BID', 'bmsvlyxou')
doc = fitz.open(PDF)
for p in doc:
    if p.trimbox != p.mediabox: p.set_cropbox(p.trimbox)  # بلا علامات القصّ
spreads = [tuple(map(int, x.split('-'))) for x in sys.argv[2].split(',')] if '-' in sys.argv[2] else A.pick_spreads(doc, 8, SEED)
print('الفتحات:', ' · '.join(f'{e}-{o}' for e, o in spreads), '| الصفحات', len(doc))
ts = A.b36(int(time.time() * 1000)); rel = f'images/{BID}'
files, pages, pars = {}, [], []
for i, (e, o) in enumerate(spreads, 1):
    ime, imo = A.render(doc[e - 1], 2400), A.render(doc[o - 1], 2400)
    right, left = imo, ime  # الإنجليزي: الزوجي يساراً والفردي يميناً
    pr, pl = f'{rel}/p{i:02d}-r-{ts}.jpg', f'{rel}/p{i:02d}-l-{ts}.jpg'
    files[pr] = A.jpeg(A.fit(right, 1600), 85); files[pl] = A.jpeg(A.fit(left, 1600), 85)
    pages.append({'r': pr, 'l': pl}); pars += [ime.width / ime.height, imo.width / imo.height]
par = round(sorted(pars)[len(pars) // 2], 3)
# معاينة بترتيب العرض (اليسار يساراً)
w = 200; h = round(w / par)
sheet = Image.new('RGB', (4 * (2 * w + 20) + 20, ((len(pages) + 3) // 4) * (h + 20) + 20), '#bbb')
for i, p in enumerate(pages):
    L = Image.open(io.BytesIO(files[p['l']])).resize((w, h)); R = Image.open(io.BytesIO(files[p['r']])).resize((w, h))
    x, y = 20 + (i % 4) * (2 * w + 20), 20 + (i // 4) * (h + 20)
    sheet.paste(L, (x, y)); sheet.paste(R, (x + w, y))
sheet.save(OUT, quality=85); print('par', par, 'size', Image.open(io.BytesIO(files[pages[0]['r']])).size)
if WRITE:
    db = json.load(open(REPO / 'data/books.json', encoding='utf-8'))
    b = next(x for x in db['books'] if x['id'] == BID)
    old = [v for p in b.get('pages', []) for v in p.values() if v]
    for p_, data in files.items(): (REPO / p_).write_bytes(data)
    for f in old: (REPO / f).unlink(missing_ok=True)
    now = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
    b['pages'] = pages; b['par'] = par; b['pageCount'] = len(doc); b['updatedAt'] = now; db['updated'] = now
    (REPO / 'data/books.json').write_text(json.dumps(db, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('كُتب', len(files), 'صورة وحُذف', len(old))
