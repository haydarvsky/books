/* ===== معرض أعمالي في الكتب — منطق الرفّ والنافذة ===== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const DEMO = params.get('demo') === '1';

  const bookcase = $('#bookcase');
  const stage = $('#stage');
  const emptyEl = $('#empty');
  const loadingEl = $('#loading');
  $('#year').textContent = new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(new Date().getFullYear());

  let BOOKS = [];
  let FILTER = 'all';
  const VIEWS = ['spine', 'cover', 'stack'];
  let VIEW = VIEWS.includes(localStorage.getItem('bg_view')) ? localStorage.getItem('bg_view') : 'spine';
  const featCase = $('#featCase'), featSec = $('#featured'), allTitle = $('#allTitle');
  const isTouch = matchMedia('(hover:none)').matches;

  /* ---------- أدوات ---------- */
  const arNum = n => new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(n);
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  function luminance(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return 0.2;
    const n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  const textOn = hex => luminance(hex) > 0.6 ? '#2A1A0F' : '#FAF6EF';
  const workLabel = { cover: 'تصميم الغلاف', typeset: 'التنضيد الداخلي' };
  const hasWork = (b, w) => Array.isArray(b.work) && b.work.includes(w);
  const MOB = () => innerWidth <= 820;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- تحميل البيانات ---------- */
  async function load() {
    try {
      if (DEMO && window.DEMO_BOOKS) {
        BOOKS = await window.DEMO_BOOKS();
      } else {
        const r = await fetch('data/books.json?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        BOOKS = (j.books || []).filter(b => !b.hidden).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } catch (e) {
      console.warn('تعذّر تحميل البيانات', e);
      BOOKS = [];
    }
    await measureSpines();
    loadingEl.hidden = true;
    render(); if (VIEW === 'stack') kick();
  }
  /* يقيس نسبة عرض الكعب إلى ارتفاعه من صورته إن لم تكن محفوظة في البيانات */
  function measureSpines() {
    const jobs = BOOKS.filter(b => b.cover?.spine && !b.sar).map(b => new Promise(res => {
      const im = new Image(); const done = () => { if (im.naturalWidth && im.naturalHeight) b.sar = im.naturalWidth / im.naturalHeight; res(); };
      im.onload = done; im.onerror = res; im.src = b.cover.spine; setTimeout(res, 4000);
    }));
    return Promise.all(jobs);
  }

  /* ---------- بناء الرفوف ---------- */
  function bookDims(b, mode = VIEW) {
    let baseH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--book-h')) || 230;
    if (mode === 'stack') baseH *= MOB() ? 1.15 : 1.4; // الكتب المستلقية أكبر لتُقرأ كعوبها
    const hs = 0.84 + ((hash(b.id || b.title) % 17) / 100); // تنويع طفيف في الارتفاع
    const h = Math.round(baseH * (b.hs || hs));
    const ar = Math.min(0.9, Math.max(0.55, +b.ar || 0.68));
    const w = Math.round(h * ar);
    const thick = Math.min(5, Math.max(1, +b.thick || 2));
    let t = Math.round((18 + thick * 8) * (baseH / 230));
    if (b.sar > 0) t = Math.max(4, Math.round(Math.min(h * 0.45, h * b.sar))); // من صورة الكعب نفسها بلا قصّ
    return { h, w, t };
  }


  function bookEl(b, feat, mode = VIEW) {
    const d = bookDims(b, mode);
    const c = b.color || '#0F4C3A';
    const tc = textOn(c);
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.style.cssText = `--w:${d.w}px;--h:${d.h}px;--t:${d.t}px;--c:${c};--tc:${tc};--ex:0;--sw:${Math.max(d.t, 22)}px`;
    slot.dataset.id = b.id;
    const front = b.cover?.front, spine = b.cover?.spine, back = b.cover?.back;
    const tags = (b.work || []).map(w => `<span class="tag t-${w}">${workLabel[w] || w}</span>`).join('');
    slot.innerHTML = `
      <div class="book" role="button" tabindex="0" aria-label="${esc(b.title)}${b.author ? ' — ' + esc(b.author) : ''}">
        <div class="face f-spine">${spine ? `<img src="${esc(spine)}" alt="">`
          : `<div class="spine-txt"><span>${esc(b.title)}</span>${b.author ? `<span class="dot">·</span><small>${esc(b.author)}</small>` : ''}</div>`}</div>
        <div class="face f-front">${front ? `<img src="${esc(front)}" alt="${esc(b.title)}" loading="lazy">`
          : `<div class="noimg"><b>${esc(b.title)}</b>${b.author ? `<small>${esc(b.author)}</small>` : ''}</div>`}</div>
        <div class="face f-back">${back ? `<img src="${esc(back)}" alt="" loading="lazy">` : `<div class="noimg">${esc(b.author || '')}</div>`}</div>
        <div class="face f-edge"></div>
        <div class="face f-top"></div>
        <div class="face f-bottom"></div>
      </div>
      <div class="book-shadow"></div>
      ${feat ? `<span class="feat-star">✦</span><div class="feat-cap"><b>${esc(b.title)}</b>${b.author ? `<small>${esc(b.author)}</small>` : ''}</div>` : ''}
      <div class="tip"><b>${esc(b.title)}</b>${b.author ? `<small>${esc(b.author)}</small>` : ''}<div class="tags">${tags}</div></div>`;
    const bookNode = $('.book', slot);
    bookNode.addEventListener('click', () => openBook(b));
    bookNode.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBook(b); } });
    return slot;
  }

  /* عرض فتحة كتاب بحسب طريقة العرض */
  function slotW(b, mode = VIEW) {
    const d = bookDims(b, mode);
    if (mode === 'cover') return d.w + (MOB() ? 10 : 18);
    return Math.max(d.t, 22) + (MOB() ? 8 : 12);
  }
  /* يبني صفوف رفوف من قائمة كتب داخل حاوية */
  function buildShelves(container, list, { mode = VIEW, feat = false } = {}) {
    container.innerHTML = '';
    container.className = 'bookcase mode-' + mode;
    const avail = Math.max(280, container.clientWidth - (MOB() ? 24 : 60));
    let i = 0;
    const mkShelf = () => { const shelf = document.createElement('div'); shelf.className = 'shelf'; const sr = document.createElement('div'); sr.className = 'shelf-row'; const plank = document.createElement('div'); plank.className = 'plank'; shelf.append(sr, plank); container.appendChild(shelf); return sr; };
    if (mode === 'stack') {
      // أكداس: كل كدس ٣–٦ كتب مستلقية
      const sizes = [4, 5, 3, 6, 4];
      const piles = []; let k = 0, si = 0;
      while (k < list.length) { const n = sizes[si++ % sizes.length]; piles.push(list.slice(k, k + n)); k += n; }
      const pileW = p => Math.max(...p.map(b => bookDims(b, 'stack').h)) + 10;
      let row = null, wsum = 0;
      piles.forEach(p => {
        const pw = pileW(p);
        if (!row || wsum + pw + 36 > avail) { row = mkShelf(); wsum = 0; }
        wsum += pw + 36;
        const pile = document.createElement('div'); pile.className = 'pile';
        let y = 0; const nodes = [];
        p.forEach((b, j) => {
          const d = bookDims(b, 'stack');
          const slot = bookEl(b, false, 'stack');
          const jx = ((hash(b.id) % 21) - 10) * 0.6; // إزاحة أفقية طفيفة
          slot.style.setProperty('--y', y + 'px'); slot.style.setProperty('--jx', jx + 'px');
          slot.style.animationDelay = (i++ * 45) + 'ms';
          nodes.push(slot); y += d.t + 1;
        });
        pile.style.setProperty('--ph', y + 'px'); pile.style.setProperty('--pw', pw + 'px');
        nodes.forEach(n => pile.appendChild(n));
        row.appendChild(pile);
      });
      $$('.shelf', container).forEach(sh => { const maxH = Math.max(...$$('.pile', sh).map(p => parseFloat(p.style.getPropertyValue('--ph')))); sh.style.height = (maxH + 40) + 'px'; $('.shelf-row', sh).style.height = maxH + 'px'; $('.plank', sh).style.top = maxH + 'px'; });
      return;
    }
    let row = null, wsum = 0;
    list.forEach(b => {
      const sw = slotW(b, mode);
      if (!row || wsum + sw > avail) { row = mkShelf(); wsum = 0; }
      wsum += sw;
      const slot = bookEl(b, feat, mode); slot.style.animationDelay = (i++ * 45) + 'ms'; row.appendChild(slot);
    });
  }

  function render() {
    // رفّ المميّز (أغلفة أمامية دائماً)
    const feats = BOOKS.filter(b => b.featured);
    featSec.hidden = !feats.length;
    if (feats.length) buildShelves(featCase, feats, { mode: 'cover', feat: true });
    // كل الأعمال
    const list = BOOKS.filter(b => FILTER === 'all' || hasWork(b, FILTER));
    allTitle.hidden = !(feats.length && list.length);
    bookcase.innerHTML = '';
    if (!list.length) {
      emptyEl.hidden = false;
      if (BOOKS.length) { $('h2', emptyEl).textContent = 'لا كتب في هذا التصنيف بعد'; $('.empty-demo', emptyEl).hidden = true; }
      return;
    }
    emptyEl.hidden = true;
    buildShelves(bookcase, list, { mode: VIEW });
    document.body.dataset.view = VIEW;
  }
  /* مبدّل طريقة العرض */
  const viewsNav = $('#views');
  function setView(v, save = true) {
    VIEW = v; if (save) localStorage.setItem('bg_view', v);
    $$('button', viewsNav).forEach(b => b.classList.toggle('is-on', b.dataset.v === v));
    baseX = v === 'stack' ? 14 : 0; kick();
    render();
  }
  viewsNav.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) setView(b.dataset.v); });
  $$('button', viewsNav).forEach(b => b.classList.toggle('is-on', b.dataset.v === VIEW));

  // إعادة الرسم عند تغيّر العرض فقط — على الجوال يتغيّر الارتفاع باستمرار مع شريط العنوان أثناء التمرير، ولا داعي لإعادة بناء الرفّ حينها
  let rt, lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth === lastW) return; clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; render(); } }, 250); });

  /* ---------- حركة الرفّ مع الفأرة ---------- */
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, baseX = VIEW === 'stack' ? 14 : 0, cbx = 0;
  function tick() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; cbx += (baseX - cbx) * 0.08;
    bookcase.style.transform = `rotateX(${cy + cbx}deg) rotateY(${cx}deg)`;
    featCase.style.transform = `rotateX(${cy}deg) rotateY(${cx}deg)`;
    if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 || Math.abs(baseX - cbx) > 0.01) raf = requestAnimationFrame(tick); else raf = null;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  if (!isTouch) {
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 10; ty = -py * 5; kick();
    });
    stage.addEventListener('mouseleave', () => { tx = 0; ty = 0; kick(); });
  } else if (window.DeviceOrientationEvent) {
    addEventListener('deviceorientation', e => {
      if (e.gamma == null) return;
      tx = Math.max(-10, Math.min(10, e.gamma / 4)); ty = Math.max(-5, Math.min(5, (e.beta - 45) / -8)); kick();
    }, { passive: true });
  }

  /* ---------- التصفية ---------- */
  $('#filters').addEventListener('click', e => {
    const btn = e.target.closest('.chip'); if (!btn) return;
    $$('.chip').forEach(c => c.classList.toggle('is-on', c === btn));
    FILTER = btn.dataset.f; render();
  });

  /* ---------- النافذة ---------- */
  const modal = $('#modal'), paneCover = $('#paneCover'), panePages = $('#panePages'), tabs = $('#mTabs');
  let CUR = null;
  function openBook(b) {
    CUR = b;
    $('#mTitle').textContent = b.title;
    $('#mAuthor').textContent = b.author ? 'تأليف: ' + b.author + (b.year ? ' · ' + b.year : '') : (b.year || '');
    $('#mBadges').innerHTML = (b.work || []).map(w => `<span class="tag t-${w}">${workLabel[w] || w}</span>`).join('');
    const note = $('#mNote'); note.hidden = !b.note; note.textContent = b.note || '';
    tabs.innerHTML = '';
    const list = [];
    if (hasWork(b, 'cover')) list.push(['cover', 'الغلاف']);
    if (hasWork(b, 'typeset') && b.pages?.length) list.push(['pages', 'التنضيد الداخلي']);
    if (!list.length) list.push(hasWork(b, 'typeset') ? ['pages', 'التنضيد الداخلي'] : ['cover', 'الغلاف']);
    list.forEach(([k, l], i) => {
      const bt = document.createElement('button'); bt.textContent = l; bt.dataset.tab = k;
      bt.classList.toggle('is-on', i === 0); bt.addEventListener('click', () => showTab(k)); tabs.appendChild(bt);
    });
    tabs.hidden = list.length < 2;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    showTab(list[0][0]);
    setTimeout(() => $('.m-close').focus(), 50);
  }
  function showTab(k) {
    $$('button', tabs).forEach(b => b.classList.toggle('is-on', b.dataset.tab === k));
    paneCover.hidden = k !== 'cover'; panePages.hidden = k !== 'pages';
    if (k === 'cover') setupCover(CUR); else setupPages(CUR);
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));

  /* ---------- الغلاف ثلاثي الأبعاد ---------- */
  const cover3d = $('#cover3d'), coverStage = $('#coverStage'), coverFlat = $('#coverFlat');
  let ry = -22, rx = 0, drag = null, moved = false;
  function setupCover(b) {
    const stageR = coverStage.getBoundingClientRect();
    const ar = Math.min(0.95, Math.max(0.5, +b.ar || 0.68));
    const ch = Math.min(stageR.height - 50, 520);
    const cw = Math.min(ch * ar, stageR.width * 0.7);
    const thick = Math.min(5, Math.max(1, +b.thick || 2));
    const ct = b.sar > 0 ? Math.max(4, Math.round(Math.min(ch * 0.45, ch * b.sar))) : Math.round((14 + thick * 7) * (ch / 230) * 0.9);
    cover3d.style.cssText = `--cw:${cw}px;--ch:${ch}px;--ct:${ct}px;--c:${b.color || '#0F4C3A'}`;
    const face = (id, src, txt) => { const el = $(id); el.innerHTML = src ? `<img src="${esc(src)}" alt="">` : `<div class="noimg">${esc(txt || '')}</div>`; el.dataset.src = src || ''; };
    face('#cfFront', b.cover?.front, b.title);
    face('#cfSpine', b.cover?.spine, b.title);
    face('#cfBack', b.cover?.back, b.author || '');
    // المسطّح
    const setFlat = (id, src) => { const im = $(id); im.hidden = !src; if (src) im.src = src; };
    setFlat('#flatFront', b.cover?.front); setFlat('#flatSpine', b.cover?.spine); setFlat('#flatBack', b.cover?.back);
    $$('img', coverFlat).forEach(im => { im.onload = fitFlat; });
    // فلسفة الغلاف وتفاصيله
    const hs = (b.hotspots || []).filter(h => h && h.t);
    const hasNotes = !!(b.philosophy || hs.length) && !!b.cover?.front;
    $('#btnNotes').hidden = !hasNotes;
    if (hasNotes) {
      $('#cnPic').src = b.cover.front; $('#cnPhil').textContent = b.philosophy || ''; $('#cnPhil').hidden = !b.philosophy;
      $('#cnDots').innerHTML = hs.map((h, i) => `<span class="cn-dot" data-i="${i}" style="left:${(+h.x * 100).toFixed(2)}%;top:${(+h.y * 100).toFixed(2)}%">${arNum(i + 1)}<span class="cn-bubble">${esc(h.t)}</span></span>`).join('');
      $('#cnList').innerHTML = hs.map((h, i) => `<li data-i="${i}"><i>${arNum(i + 1)}</i><span>${esc(h.t)}</span></li>`).join('');
      $('.cn-hint', coverNotes).hidden = !hs.length;
    }
    setCoverView(hasNotes && b.featured ? 'notes' : 'front', true);
  }
  const coverNotes = $('#coverNotes');
  function cnSelect(i, toggle) {
    const cur = $('.cn-dot.is-on', coverNotes)?.dataset.i;
    const on = toggle && cur === String(i) ? null : String(i);
    $$('.cn-dot,#cnList li', coverNotes).forEach(el => el.classList.toggle('is-on', el.dataset.i === on));
  }
  coverNotes.addEventListener('click', e => { const el = e.target.closest('.cn-dot,#cnList li'); if (el) cnSelect(el.dataset.i, true); });
  coverNotes.addEventListener('mouseover', e => { const el = e.target.closest('.cn-dot,#cnList li'); if (el && !$('.cn-dot.is-on', coverNotes)) $$('.cn-dot,#cnList li', coverNotes).forEach(x => x.classList.toggle('is-hl', x.dataset.i === el.dataset.i)); });
  function fitFlat() { // ملاءمة الغلاف المسطّح داخل المسرح
    if (coverFlat.hidden) return;
    const r = coverStage.getBoundingClientRect();
    const imgs = $$('img', coverFlat).filter(i => !i.hidden && i.naturalWidth);
    const sum = imgs.reduce((a, i) => a + i.naturalWidth / i.naturalHeight, 0) || 1;
    const h = Math.max(120, Math.min(r.height - 40, (r.width - 40) / sum));
    coverFlat.style.height = h + 'px';
  }
  addEventListener('resize', fitFlat);
  function applyRot() { cover3d.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; }
  function setCoverView(v, instant) {
    $$('.cover-ctl [data-view]').forEach(b => b.classList.toggle('is-on', b.dataset.view === v));
    const flat = v === 'flat', notes = v === 'notes';
    coverFlat.hidden = !flat; coverNotes.hidden = !notes; cover3d.hidden = flat || notes;
    if (notes) return;
    if (flat) { fitFlat(); return; }
    rx = 0;
    if (v === 'front') ry = -22; else if (v === 'spine') ry = -90; else if (v === 'back') ry = -200;
    if (instant) { cover3d.classList.add('dragging'); applyRot(); void cover3d.offsetWidth; cover3d.classList.remove('dragging'); }
    else applyRot();
  }
  $$('.cover-ctl [data-view]').forEach(b => b.addEventListener('click', () => setCoverView(b.dataset.view)));
  coverStage.addEventListener('pointerdown', e => {
    if (cover3d.hidden) return;
    drag = { x: e.clientX, y: e.clientY, ry, rx }; moved = false;
    coverStage.setPointerCapture(e.pointerId); cover3d.classList.add('dragging');
  });
  coverStage.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    ry = drag.ry + dx * 0.45; rx = Math.max(-25, Math.min(25, drag.rx - dy * 0.2)); applyRot();
  });
  const endDrag = () => { drag = null; cover3d.classList.remove('dragging'); };
  coverStage.addEventListener('pointerup', endDrag); coverStage.addEventListener('pointercancel', endDrag);
  cover3d.addEventListener('click', e => {
    if (moved) return;
    const f = e.target.closest('.cf'); if (!f || !f.dataset.src) return;
    openZoom(f.dataset.src);
  });
  coverFlat.addEventListener('click', e => { if (e.target.tagName === 'IMG') openZoom(e.target.src); });
  $('.cover-ctl [data-zoom]').addEventListener('click', () => {
    const b = CUR; if (!b) return;
    // كبّر الوجه الظاهر
    const on = $('.cover-ctl [data-view].is-on')?.dataset.view;
    const src = on === 'spine' ? b.cover?.spine : on === 'back' ? b.cover?.back : b.cover?.front;
    if (src) openZoom(src);
  });

  /* ---------- الكتاب المفتوح (التنضيد) ---------- */
  const pgR = $('#pgR img'), pgL = $('#pgL img'), leaf = $('#leaf'), leafF = $('.leaf-f img', leaf), leafB = $('.leaf-b img', leaf);
  const bookOpen = $('#bookOpen'), pgPrev = $('#pgPrev'), pgNext = $('#pgNext'), pgCount = $('#pgCount');
  let SP = [], si = 0, flipping = false, flipTimers = [];
  function setupPages(b) {
    SP = (b.pages || []).filter(p => p && (p.r || p.l));
    si = 0; flipping = false; flipTimers.forEach(clearTimeout); flipTimers = []; leaf.hidden = true;
    bookOpen.style.setProperty('--par', Math.min(0.9, Math.max(0.5, +b.par || 0.7)));
    showSpread();
    // تحميل مسبق
    SP.forEach(p => { [p.r, p.l].forEach(s => { if (s) { const im = new Image(); im.src = s; } }); });
  }
  function showSpread() {
    const s = SP[si] || {};
    pgR.src = s.r || ''; pgL.src = s.l || '';
    pgR.parentElement.style.visibility = s.r ? '' : 'hidden'; pgL.parentElement.style.visibility = s.l ? '' : 'hidden';
    pgPrev.disabled = si <= 0; pgNext.disabled = si >= SP.length - 1;
    pgCount.textContent = SP.length ? `الفتحة ${arNum(si + 1)} من ${arNum(SP.length)}` : 'لا صفحات بعد';
  }
  function flip(dir) { // dir = +1 التالي (تُقلب الصفحة اليسرى إلى اليمين) / -1 السابق
    if (flipping) return;
    const ni = si + dir; if (ni < 0 || ni >= SP.length) return;
    flipping = true;
    const cur = SP[si], nxt = SP[ni];
    leaf.className = 'leaf ' + (dir > 0 ? 'from-left' : 'from-right');
    leafF.src = (dir > 0 ? cur.l : cur.r) || ''; leafB.src = (dir > 0 ? nxt.r : nxt.l) || '';
    leaf.style.transition = 'none'; leaf.style.transform = 'rotateY(0deg)'; leaf.hidden = false;
    // ما تحت الورقة يتغيّر فوراً في الجهة التي تُغادرها الورقة
    if (dir > 0) { pgL.src = nxt.l || ''; pgL.parentElement.style.visibility = nxt.l ? '' : 'hidden'; }
    else { pgR.src = nxt.r || ''; pgR.parentElement.style.visibility = nxt.r ? '' : 'hidden'; }
    void leaf.offsetWidth;
    leaf.style.transition = ''; leaf.style.transform = `rotateY(${dir > 0 ? 180 : -180}deg)`;
    flipTimers = [
      setTimeout(() => { // منتصف القلبة: الجهة الأخرى
        if (dir > 0) { pgR.src = nxt.r || ''; pgR.parentElement.style.visibility = nxt.r ? '' : 'hidden'; }
        else { pgL.src = nxt.l || ''; pgL.parentElement.style.visibility = nxt.l ? '' : 'hidden'; }
      }, 420),
      setTimeout(() => { si = ni; leaf.hidden = true; flipping = false; showSpread(); }, 880)
    ];
  }
  pgNext.addEventListener('click', () => flip(1));
  pgPrev.addEventListener('click', () => flip(-1));
  $('#pgR').addEventListener('click', () => { if (pgR.src) openZoom(pgR.src); });
  $('#pgL').addEventListener('click', () => { if (pgL.src) openZoom(pgL.src); });
  $('.pg-ctl [data-zoom-page]').addEventListener('click', () => { const s = pgR.src || pgL.src; if (s) openZoom(s); });
  // سحب أفقي لقلب الصفحات
  let sw = null;
  bookOpen.addEventListener('pointerdown', e => { sw = { x: e.clientX, t: Date.now() }; });
  bookOpen.addEventListener('pointerup', e => {
    if (!sw) return; const dx = e.clientX - sw.x; sw = null;
    if (Math.abs(dx) > 50) { flip(dx < 0 ? 1 : -1); e.preventDefault(); }
  });

  /* ---------- لوحة المفاتيح ---------- */
  addEventListener('keydown', e => {
    if (!zoom.hidden) { if (e.key === 'Escape') closeZoom(); return; }
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (!panePages.hidden) {
      if (e.key === 'ArrowLeft') flip(1);
      if (e.key === 'ArrowRight') flip(-1);
    } else if (!paneCover.hidden && !cover3d.hidden) {
      if (e.key === 'ArrowLeft') { ry -= 30; applyRot(); }
      if (e.key === 'ArrowRight') { ry += 30; applyRot(); }
    }
  });

  /* ---------- المكبّر ---------- */
  const zoom = $('#zoom'), zView = $('#zView'), zImg = $('#zImg'), zPct = $('#zPct');
  let Z = { s: 1, x: 0, y: 0, fit: 1, nw: 0, nh: 0 }, zdrag = null;
  function openZoom(src) {
    zoom.hidden = false;
    zImg.onload = () => { Z.nw = zImg.naturalWidth; Z.nh = zImg.naturalHeight; zFit(); };
    zImg.src = src; if (zImg.complete && zImg.naturalWidth) zImg.onload();
  }
  function closeZoom() { zoom.hidden = true; zImg.src = ''; }
  function zApply() {
    zImg.style.transform = `translate(${Z.x}px,${Z.y}px) scale(${Z.s})`;
    zPct.textContent = arNum(Math.round(Z.s * 100)) + '٪';
  }
  function zFit() {
    const r = zView.getBoundingClientRect();
    Z.fit = Math.min(r.width / Z.nw, r.height / Z.nh, 1.5);
    Z.s = Z.fit; Z.x = (r.width - Z.nw * Z.s) / 2; Z.y = (r.height - Z.nh * Z.s) / 2; zApply();
  }
  function zTo(ns, px, py) { // تكبير حول نقطة
    ns = Math.max(Z.fit * 0.5, Math.min(6, ns));
    const k = ns / Z.s;
    Z.x = px - (px - Z.x) * k; Z.y = py - (py - Z.y) * k; Z.s = ns; zApply();
  }
  zView.addEventListener('wheel', e => {
    e.preventDefault(); const r = zView.getBoundingClientRect();
    zTo(Z.s * (e.deltaY < 0 ? 1.15 : 0.87), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  zView.addEventListener('pointerdown', e => { zdrag = { x: e.clientX - Z.x, y: e.clientY - Z.y }; zView.setPointerCapture(e.pointerId); zView.classList.add('dragging'); });
  zView.addEventListener('pointermove', e => { if (!zdrag) return; Z.x = e.clientX - zdrag.x; Z.y = e.clientY - zdrag.y; zApply(); });
  const zEnd = () => { zdrag = null; zView.classList.remove('dragging'); };
  zView.addEventListener('pointerup', zEnd); zView.addEventListener('pointercancel', zEnd);
  zView.addEventListener('dblclick', e => {
    const r = zView.getBoundingClientRect();
    if (Z.s > Z.fit * 1.05) zFit(); else zTo(Math.max(2, Z.fit * 2.5), e.clientX - r.left, e.clientY - r.top);
  });
  // قرصة الأصابع
  const pts = new Map(); let pinch = null;
  zView.addEventListener('pointerdown', e => { pts.set(e.pointerId, e); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: Z.s }; zdrag = null; } });
  zView.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const r = zView.getBoundingClientRect();
      zTo(pinch.s * d / pinch.d, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
    }
  });
  const pEnd = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
  zView.addEventListener('pointerup', pEnd); zView.addEventListener('pointercancel', pEnd);
  $('#zIn').addEventListener('click', () => { const r = zView.getBoundingClientRect(); zTo(Z.s * 1.3, r.width / 2, r.height / 2); });
  $('#zOut').addEventListener('click', () => { const r = zView.getBoundingClientRect(); zTo(Z.s / 1.3, r.width / 2, r.height / 2); });
  $('#zFit').addEventListener('click', zFit);
  $('#zClose').addEventListener('click', closeZoom);
  addEventListener('resize', () => { if (!zoom.hidden) zFit(); });

  load();
})();
