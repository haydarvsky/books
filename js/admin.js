/* ===== لوحة تحكم معرض الكتب ===== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = { owner: 'haydarvsky', repo: 'books', branch: 'main' };
  const DATA_PATH = 'data/books.json';
  const MOCK = new URLSearchParams(location.search).get('mock') === '1';
  const arNum = n => new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(n);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const workLabel = { cover: 'غلاف', typeset: 'تنضيد' };

  let api = null, DB = { updated: null, books: [] }, ORDER_DIRTY = false, ED = null;

  /* ---------- واجهة مساعدة ---------- */
  const toastEl = $('#toast'); let toastT;
  function toast(msg, kind = '') { toastEl.textContent = msg; toastEl.className = 'toast ' + kind; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => toastEl.hidden = true, 4200); }
  const busy = $('#busy');
  function showBusy(title, msg = '', pct = 0) { busy.hidden = false; $('#busyTitle').textContent = title; $('#busyMsg').textContent = msg; $('#busyBar').style.width = pct + '%'; }
  function hideBusy() { busy.hidden = true; }
  const errMsg = e => {
    if (!e) return 'خطأ غير معروف';
    if (e.status === 401) return 'رمز الوصول مرفوض (401) — تحقّق من الرمز.';
    if (e.status === 403) return 'ليست لديك صلاحية الكتابة على المستودع (403) — تأكّد من صلاحية Contents: Read and write.';
    if (e.status === 404) return 'المستودع أو الملف غير موجود (404) — تأكّد أن الرمز يشمل مستودع books.';
    if (e.status === 409 || e.status === 422) return 'تعارض في النشر — أعد المحاولة بعد لحظات.';
    return e.message || String(e);
  };

  /* ---------- الاتصال ---------- */
  function makeApi(token) {
    if (MOCK) return mockApi();
    return new GhApi({ ...CFG, token });
  }
  function mockApi() {
    let json = null; const paths = new Set();
    return {
      token: 'mock', mock: true,
      async check() { return { repo: 'mock/books', canPush: true, user: 'تجريبي' }; },
      async readText(p) { if (json == null) { const r = await fetch(p + '?t=' + Date.now()); json = r.ok ? await r.text() : '{"books":[]}'; } return { sha: 'x', text: json }; },
      async tree() { return new Map([...paths].map(p => [p, 'x'])); },
      async commit({ message, files, deletes, onProgress }) {
        for (let i = 0; i < files.length; i++) { await new Promise(r => setTimeout(r, 120)); onProgress({ stage: 'upload', done: i + 1, total: files.length, path: files[i].path }); }
        files.forEach(f => paths.add(f.path)); deletes.forEach(p => paths.delete(p));
        const j = files.find(f => f.path === DATA_PATH); if (j) json = j.text;
        console.log('[mock commit]', message, files.map(f => f.path), 'deletes:', deletes);
        onProgress({ stage: 'done' }); return { sha: 'mock' };
      },
    };
  }
  async function connect(token, quiet) {
    api = makeApi(token);
    const st = $('#ghStatus');
    if (!token && !MOCK) { st.textContent = 'غير متصل — أدخل رمز الوصول'; st.className = 'status'; updateSaveHint(); return false; }
    st.textContent = 'جارٍ التحقق…'; st.className = 'status';
    try {
      const c = await api.check();
      st.textContent = `متصل ✓ ${c.user ? c.user + ' · ' : ''}${c.repo}${c.canPush ? '' : ' — بلا صلاحية كتابة!'}`;
      st.className = 'status ' + (c.canPush ? 'ok' : 'bad');
      if (!quiet) toast(c.canPush ? 'الاتصال ناجح' : 'متصل لكن بلا صلاحية كتابة', c.canPush ? 'ok' : 'err');
      updateSaveHint(); return c.canPush;
    } catch (e) {
      st.textContent = 'فشل الاتصال: ' + errMsg(e); st.className = 'status bad'; updateSaveHint(); return false;
    }
  }
  const canPublish = () => !!(api && api.token);
  function updateSaveHint() { $('#saveHint').textContent = canPublish() ? '' : 'أدخل رمز الوصول أعلاه لتتمكن من النشر'; $('#btnSave').disabled = !canPublish(); }

  $('#btnSaveToken').addEventListener('click', async () => {
    const t = $('#token').value.trim(); if (!t) return toast('ألصق الرمز أولاً', 'err');
    localStorage.setItem('bg_token', t);
    if (await connect(t)) loadDB();
  });
  $('#btnForget').addEventListener('click', () => { localStorage.removeItem('bg_token'); $('#token').value = ''; connect('', true); toast('نُسي الرمز من هذا المتصفح'); });

  /* ---------- البيانات ---------- */
  async function loadDB(silent) {
    try {
      let text;
      if (api && api.token) { const f = await api.readText(DATA_PATH); text = f ? f.text : '{"books":[]}'; }
      else { const r = await fetch(DATA_PATH + '?t=' + Date.now(), { cache: 'no-store' }); text = r.ok ? await r.text() : '{"books":[]}'; }
      DB = JSON.parse(text); DB.books = (DB.books || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      ORDER_DIRTY = false; $('#btnSaveOrder').hidden = true;
      renderList(); if (!silent) toast('تم التحديث', 'ok');
    } catch (e) { toast('تعذّر تحميل البيانات: ' + errMsg(e), 'err'); }
  }
  $('#btnReload').addEventListener('click', () => loadDB());

  function renderList() {
    const list = $('#list'); list.innerHTML = '';
    $('#count').textContent = DB.books.length ? `(${arNum(DB.books.length)})` : '';
    $('#emptyList').hidden = DB.books.length > 0; $('#listHint').hidden = DB.books.length < 2;
    DB.books.forEach((b, i) => {
      const it = document.createElement('div'); it.className = 'item' + (b.hidden ? ' is-hidden' : ''); it.draggable = true; it.dataset.i = i;
      const th = b.cover?.front ? `<img class="thumb" src="${esc(b.cover.front)}" alt="">` : `<div class="thumb txt" style="background:${esc(b.color || '#0F4C3A')}">${esc(b.title)}</div>`;
      const tags = (b.work || []).map(w => `<span class="tag t-${w}">${workLabel[w]}</span>`).join('') + (b.pages?.length ? `<span class="tag t-pages">${arNum(b.pages.length)} فتحات</span>` : '') + (b.hidden ? '<span class="tag t-hidden">🙈 مخفي</span>' : '') + (b.featured ? '<span class="tag t-feat">✦ مميّز</span>' : '') + (b.dir === 'ltr' ? '<span class="tag t-en">EN</span>' : '');
      it.innerHTML = `<span class="grip" title="اسحب للترتيب">⋮⋮</span>${th}
        <div class="item-t"><b>${esc(b.title)}</b><small>${esc(b.author || '')}${b.year ? ' · ' + esc(b.year) : ''}</small><div class="tags">${tags}</div></div>
        <div class="item-b"><button data-vis title="${b.hidden ? 'إظهار في المعرض' : 'إخفاء من المعرض'}">${b.hidden ? '🙈' : '👁'}</button><button data-up title="أعلى">▲</button><button data-down title="أسفل">▼</button><button data-edit title="تعديل">✎</button></div>`;
      $('[data-edit]', it).addEventListener('click', () => openEditor(b));
      $('[data-vis]', it).addEventListener('click', () => toggleVisible(b));
      $('[data-up]', it).addEventListener('click', () => moveBook(i, -1));
      $('[data-down]', it).addEventListener('click', () => moveBook(i, 1));
      it.addEventListener('dragstart', e => { it.classList.add('dragging'); e.dataTransfer.setData('text/plain', i); e.dataTransfer.effectAllowed = 'move'; });
      it.addEventListener('dragend', () => it.classList.remove('dragging'));
      it.addEventListener('dragover', e => { e.preventDefault(); it.classList.add('over'); });
      it.addEventListener('dragleave', () => it.classList.remove('over'));
      it.addEventListener('drop', e => { e.preventDefault(); it.classList.remove('over'); const from = +e.dataTransfer.getData('text/plain'); if (from !== i) { const [m] = DB.books.splice(from, 1); DB.books.splice(i, 0, m); orderChanged(); } });
      list.appendChild(it);
    });
  }
  async function toggleVisible(b) {
    if (!canPublish()) return toast('أدخل رمز الوصول أولاً', 'err');
    const hide = !b.hidden;
    try {
      showBusy(hide ? 'جارٍ إخفاء الكتاب…' : 'جارٍ إظهار الكتاب…');
      await publish((hide ? 'إخفاء كتاب: ' : 'إظهار كتاب: ') + b.title, [], [], books => { const x = books.find(k => k.id === b.id); if (x) x.hidden = hide; return books; });
      hideBusy(); toast(hide ? 'أُخفي الكتاب من المعرض (ما زال محفوظًا هنا)' : 'صار الكتاب ظاهرًا على الرفّ ✓', 'ok');
    } catch (e) { hideBusy(); toast(errMsg(e), 'err'); }
  }
  function moveBook(i, d) { const j = i + d; if (j < 0 || j >= DB.books.length) return; [DB.books[i], DB.books[j]] = [DB.books[j], DB.books[i]]; orderChanged(); }
  function orderChanged() { DB.books.forEach((b, i) => b.order = i); ORDER_DIRTY = true; $('#btnSaveOrder').hidden = !canPublish(); renderList(); }
  $('#btnSaveOrder').addEventListener('click', async () => {
    try {
      showBusy('جارٍ حفظ الترتيب…');
      await publish('ترتيب الرفّ', [], [], books => { const pos = new Map(DB.books.map((b, i) => [b.id, i])); books.forEach(b => { if (pos.has(b.id)) b.order = pos.get(b.id); }); return books; });
      hideBusy(); toast('حُفظ الترتيب ونُشر ✓', 'ok');
    } catch (e) { hideBusy(); toast(errMsg(e), 'err'); }
  });

  /* ---------- النشر: يقرأ أحدث نسخة ثم يطبّق التعديل ثم يلتزم ---------- */
  async function publish(message, files, deletes, mutate) {
    const cur = await api.readText(DATA_PATH);
    let db; try { db = cur ? JSON.parse(cur.text) : { books: [] }; } catch { db = { books: [] }; }
    db.books = (db.books || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    db.books = mutate(db.books);
    db.books.forEach((b, i) => b.order = i);
    db.updated = new Date().toISOString();
    const text = JSON.stringify(db, null, 2) + '\n';
    await api.commit({
      message, files: [...files, { path: DATA_PATH, text }], deletes,
      onProgress: p => {
        if (p.stage === 'upload') showBusy('جارٍ رفع الصور…', `${arNum(p.done)} من ${arNum(p.total)}`, Math.round(p.done / p.total * 80));
        else if (p.stage === 'tree') showBusy('جارٍ تجهيز الالتزام…', '', 88);
        else if (p.stage === 'commit') showBusy('جارٍ النشر…', '', 95);
        else if (p.stage === 'done') showBusy('تم ✓', '', 100);
      },
    });
    DB = db; ORDER_DIRTY = false; $('#btnSaveOrder').hidden = true; renderList();
  }

  /* ---------- المحرّر ---------- */
  const editor = $('#editor'), form = $('#form');
  const F = { title: $('#fTitle'), author: $('#fAuthor'), year: $('#fYear'), note: $('#fNote'), wCover: $('#wCover'), wTypeset: $('#wTypeset'), thick: $('#fThick'), color: $('#fColor') };
  const newSlot = (path) => ({ path: path || null, file: null, preview: path || '', removed: false, w: 0, h: 0 });

  function openEditor(b) {
    ED = { isNew: !b, id: b?.id || ('b' + Date.now().toString(36)), orig: b || null, colorAuto: !b || !b.color, slots: {}, pairs: [] };
    $('#edTitle').textContent = b ? 'تعديل: ' + b.title : 'إضافة كتاب';
    F.title.value = b?.title || ''; F.author.value = b?.author || ''; F.year.value = b?.year || ''; F.note.value = b?.note || '';
    F.wCover.checked = b ? (b.work || []).includes('cover') : true; F.wTypeset.checked = b ? (b.work || []).includes('typeset') : false;
    F.thick.value = b?.thick || 3; $('#thickOut').textContent = arNum(F.thick.value);
    $('#visOff').checked = !!b?.hidden; $('#visOn').checked = !b?.hidden;
    $('#fFeatured').checked = !!b?.featured; $('#fPhil').value = b?.philosophy || '';
    $('#dirLtr').checked = b?.dir === 'ltr'; $('#dirRtl').checked = b?.dir !== 'ltr';
    ED.hotspots = (b?.hotspots || []).map(h => ({ x: +h.x, y: +h.y, t: h.t || '' }));
    F.color.value = b?.color || '#0F4C3A';
    ['front', 'spine', 'back'].forEach(k => { ED.slots[k] = newSlot(b?.cover?.[k]); paintSlot($(`.dz[data-slot=${k}]`), ED.slots[k]); });
    ED.pairs = (b?.pages || []).map(p => ({ r: newSlot(p.r), l: newSlot(p.l) }));
    renderPairs(); renderHotspots(); syncHsPic();
    $('#btnDelete').hidden = !b;
    syncSections(); syncThick();
    editor.hidden = false; updateSaveHint();
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => F.title.focus(), 300);
  }
  function closeEditor() { ED = null; editor.hidden = true; $('#listCard').scrollIntoView({ behavior: 'smooth' }); }
  $('#btnAdd').addEventListener('click', () => openEditor(null));
  $('#btnCancel').addEventListener('click', closeEditor);
  F.thick.addEventListener('input', () => $('#thickOut').textContent = arNum(F.thick.value));
  F.color.addEventListener('input', () => { if (ED) ED.colorAuto = false; });
  $('#btnAutoColor').addEventListener('click', autoColor);
  [F.wCover, F.wTypeset].forEach(c => c.addEventListener('change', syncSections));
  function syncSections() {
    const c = F.wCover.checked, t = F.wTypeset.checked;
    $('#secPages').classList.toggle('off', !t);
    // قسم الغلاف يظهر دائماً: للتنضيد فقط تُعرض صورة الغلاف الأمامي اختياريًّا للرفّ
    $('#coverLegend').textContent = c ? 'صور الغلاف' : 'صورة الغلاف الأمامي (للعرض على الرفّ فقط)';
    $('#coverHint').textContent = c ? 'ارفع الغلاف الأمامي (إلزامي)، والكعب والخلفي إن وُجدا. تُضغط الصور تلقائيًّا قبل الرفع.'
      : 'اختياري: صورة الغلاف كما طُبع ليظهر الكتاب على الرفّ بشكله الحقيقي؛ وإن تركتها فُرض غلاف بلون الكعب وعنوان الكتاب.';
    $$('.dz[data-slot=spine],.dz[data-slot=back]').forEach(d => d.hidden = !c);
    if (ED) syncThick();
  }

  /* --- خانات الصور --- */
  function paintSlot(dz, slot) {
    const has = slot && !slot.removed && (slot.file || slot.path);
    dz.classList.toggle('has', !!has);
    const im = $('.dz-prev', dz); if (has) im.src = slot.preview; else im.removeAttribute('src');
  }
  async function assignFile(slot, file) {
    if (!file || !file.type.startsWith('image/')) return toast('الملف ليس صورة', 'err');
    if (slot.file && slot.preview.startsWith('blob:')) URL.revokeObjectURL(slot.preview);
    slot.file = file; slot.preview = URL.createObjectURL(file); slot.removed = false;
  }
  function bindDz(dz, getSlot, after) {
    const inp = $('input[type=file]', dz);
    inp.addEventListener('change', async () => { const f = inp.files[0]; if (!f) return; await assignFile(getSlot(), f); paintSlot(dz, getSlot()); inp.value = ''; after && after(); });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', async e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files[0]; if (!f) return; await assignFile(getSlot(), f); paintSlot(dz, getSlot()); after && after(); });
    const x = $('.dz-x', dz); if (x) x.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); const s = getSlot(); s.file = null; s.removed = !!s.path; s.preview = ''; paintSlot(dz, s); after && after(); });
  }
  ['front', 'spine', 'back'].forEach(k => bindDz($(`.dz[data-slot=${k}]`), () => ED.slots[k], k === 'front' ? () => { autoColorIfAuto(); syncHsPic(); } : k === 'spine' ? syncThick : null));

  /* --- فلسفة الغلاف: نقاط التفاصيل --- */
  const hsStage = $('#hsStage'), hsPic = $('#hsPic'), hsDots = $('#hsDots'), hsList = $('#hsList');
  function syncHsPic() {
    const s = ED?.slots.front; const has = s && slotHas(s);
    hsStage.classList.toggle('has', !!has);
    if (has) hsPic.src = s.preview; else hsPic.removeAttribute('src');
  }
  function renderHotspots() {
    const hs = ED?.hotspots || [];
    hsDots.innerHTML = hs.map((h, i) => `<span class="hs-dot" data-i="${i}" style="left:${(h.x * 100).toFixed(2)}%;top:${(h.y * 100).toFixed(2)}%">${arNum(i + 1)}</span>`).join('');
    hsList.innerHTML = hs.map((h, i) => `<div class="hs-item" data-i="${i}"><i>${arNum(i + 1)}</i><textarea rows="2" placeholder="اكتب شرح هذه التفصيلة…">${esc(h.t)}</textarea><button type="button" data-del title="حذف النقطة">✕</button></div>`).join('')
      + (hs.length ? '' : '<p class="hs-note">لا نقاط بعد — اضغط على الصورة لإضافة أول نقطة. يمكنك سحب النقطة لتحريكها.</p>');
    $$('.hs-item textarea', hsList).forEach(t => t.addEventListener('input', () => { ED.hotspots[+t.parentElement.dataset.i].t = t.value; }));
    $$('.hs-item textarea', hsList).forEach(t => t.addEventListener('focus', () => hsSelect(+t.parentElement.dataset.i)));
    $$('.hs-item [data-del]', hsList).forEach(bt => bt.addEventListener('click', () => { ED.hotspots.splice(+bt.parentElement.dataset.i, 1); renderHotspots(); }));
  }
  function hsSelect(i) { $$('.hs-dot,.hs-item', $('#secNotes')).forEach(el => el.classList.toggle('is-on', +el.dataset.i === i)); }
  let hsDrag = null;
  hsStage.addEventListener('pointerdown', e => {
    if (!ED || !hsStage.classList.contains('has')) return;
    const dot = e.target.closest('.hs-dot');
    if (dot) { hsDrag = { i: +dot.dataset.i, moved: false }; hsStage.setPointerCapture(e.pointerId); hsSelect(hsDrag.i); e.preventDefault(); }
  });
  hsStage.addEventListener('pointermove', e => {
    if (!hsDrag) return; hsDrag.moved = true;
    const r = hsPic.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    ED.hotspots[hsDrag.i].x = x; ED.hotspots[hsDrag.i].y = y;
    const d = $(`.hs-dot[data-i="${hsDrag.i}"]`, hsDots); d.style.left = (x * 100) + '%'; d.style.top = (y * 100) + '%';
  });
  const hsUp = () => { hsDrag = null; };
  hsStage.addEventListener('pointerup', hsUp); hsStage.addEventListener('pointercancel', hsUp);
  hsStage.addEventListener('click', e => {
    if (!ED || !hsStage.classList.contains('has') || e.target.closest('.hs-dot')) return;
    const r = hsPic.getBoundingClientRect(); if (!r.width) return;
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    ED.hotspots.push({ x: +x.toFixed(4), y: +y.toFixed(4), t: '' }); renderHotspots(); hsSelect(ED.hotspots.length - 1);
    const ta = $$('.hs-item textarea', hsList).pop(); if (ta) ta.focus();
  });
  function syncThick() { const has = ED && slotHas(ED.slots.spine) && F.wCover.checked; $('#thickWrap').classList.toggle('auto', !!has); $('#thickAuto').hidden = !has; }
  async function autoColorIfAuto() { if (ED && ED.colorAuto) autoColor(); }
  async function autoColor() {
    const s = ED?.slots.front; if (!s) return;
    try {
      let src = s.file ? s.file : (s.path && !s.removed ? s.path : null); if (!src) return;
      if (typeof src === 'string') { const im = new Image(); im.crossOrigin = 'anonymous'; await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = src; }); src = im; }
      F.color.value = await ImgTools.dominantColor(src); ED.colorAuto = true;
    } catch (e) { console.warn(e); }
  }

  /* --- الفتحات --- */
  const pairsEl = $('#pairs');
  function renderPairs() {
    pairsEl.innerHTML = '';
    ED.pairs.forEach((p, i) => {
      const row = document.createElement('div'); row.className = 'pair';
      row.innerHTML = `<span class="n">${arNum(i + 1)}</span>
        <div class="spread">
          <div class="dz" data-side="r"><input type="file" accept="image/*"><div class="dz-in"><span class="dz-ico">📄</span><b>يمين</b></div><img class="dz-prev" alt=""><button type="button" class="dz-x">✕</button></div>
          <div class="dz" data-side="l"><input type="file" accept="image/*"><div class="dz-in"><span class="dz-ico">📄</span><b>يسار</b></div><img class="dz-prev" alt=""><button type="button" class="dz-x">✕</button></div>
        </div>
        <div class="pair-b"><button type="button" data-up title="أعلى">▲</button><button type="button" data-down title="أسفل">▼</button><button type="button" data-del title="حذف الفتحة">🗑</button></div>`;
      ['r', 'l'].forEach(side => { const dz = $(`.dz[data-side=${side}]`, row); paintSlot(dz, p[side]); bindDz(dz, () => p[side]); });
      $('[data-up]', row).addEventListener('click', () => { if (i > 0) { [ED.pairs[i - 1], ED.pairs[i]] = [ED.pairs[i], ED.pairs[i - 1]]; renderPairs(); } });
      $('[data-down]', row).addEventListener('click', () => { if (i < ED.pairs.length - 1) { [ED.pairs[i + 1], ED.pairs[i]] = [ED.pairs[i], ED.pairs[i + 1]]; renderPairs(); } });
      $('[data-del]', row).addEventListener('click', () => { const pr = ED.pairs[i]; ['r', 'l'].forEach(s => { if (pr[s].path) { pr[s].removed = true; ED.trash = (ED.trash || []).concat(pr[s].path); } }); ED.pairs.splice(i, 1); renderPairs(); });
      pairsEl.appendChild(row);
    });
  }
  $('#btnAddPair').addEventListener('click', () => { ED.pairs.push({ r: newSlot(), l: newSlot() }); renderPairs(); });
  // الرفع الجماعي
  const multi = $('#dzMulti');
  const natural = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  async function addMany(files) {
    const imgs = [...files].filter(f => f.type.startsWith('image/')).sort(natural);
    if (!imgs.length) return;
    let cur = ED.pairs.find(p => !p.r.file && !p.r.path && !p.l.file && !p.l.path) || null;
    for (const f of imgs) {
      // ابحث عن أول خانة فارغة (يمين ثم يسار) وإلا فتحة جديدة
      let placed = false;
      for (const p of ED.pairs) { for (const s of ['r', 'l']) { const sl = p[s]; if (!sl.file && (!sl.path || sl.removed)) { await assignFile(sl, f); placed = true; break; } } if (placed) break; }
      if (!placed) { const p = { r: newSlot(), l: newSlot() }; await assignFile(p.r, f); ED.pairs.push(p); }
    }
    renderPairs();
    if (imgs.length % 2) toast('العدد فردي — أكمل الصفحة اليسرى للفتحة الأخيرة', 'err');
  }
  $('input', multi).addEventListener('change', e => { addMany(e.target.files); e.target.value = ''; });
  multi.addEventListener('dragover', e => { e.preventDefault(); multi.classList.add('over'); });
  multi.addEventListener('dragleave', () => multi.classList.remove('over'));
  multi.addEventListener('drop', e => { e.preventDefault(); multi.classList.remove('over'); addMany(e.dataTransfer.files); });

  /* --- الحفظ --- */
  const slotHas = s => !!(s && !s.removed && (s.file || s.path));
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (!ED) return;
    const title = F.title.value.trim(); if (!title) { F.title.focus(); return toast('اكتب اسم الكتاب', 'err'); }
    const work = []; if (F.wCover.checked) work.push('cover'); if (F.wTypeset.checked) work.push('typeset');
    if (!work.length) return toast('حدّد نوع العمل: غلاف و/أو تنضيد', 'err');
    if (work.includes('cover') && !slotHas(ED.slots.front)) return toast('صورة الغلاف الأمامي إلزامية لأعمال الغلاف', 'err');
    const pairs = work.includes('typeset') ? ED.pairs : [];
    if (work.includes('typeset')) {
      if (!pairs.length) return toast('أضِف فتحةً واحدةً على الأقل (صفحتين)', 'err');
      const bad = pairs.findIndex(p => !slotHas(p.r) || !slotHas(p.l));
      if (bad >= 0) return toast(`الفتحة ${arNum(bad + 1)} ناقصة — كل فتحة تحتاج صفحة يمين وصفحة يسار`, 'err');
    }
    if (!canPublish()) return toast('أدخل رمز الوصول أولاً', 'err');

    try {
      showBusy('جارٍ تجهيز الصور…');
      const ts = Date.now().toString(36);
      const files = [], deletes = new Set(ED.trash || []);
      const b = { ...(ED.orig || {}), id: ED.id, title, author: F.author.value.trim(), year: F.year.value.trim(), note: F.note.value.trim(), work, thick: +F.thick.value, color: F.color.value, hidden: $('#visOff').checked, featured: $('#fFeatured').checked, philosophy: $('#fPhil').value.trim(), hotspots: (ED.hotspots || []).filter(h => h.t && h.t.trim()).map(h => ({ x: +(+h.x).toFixed(4), y: +(+h.y).toFixed(4), t: h.t.trim() })) };
      if (!b.philosophy) delete b.philosophy; if (!b.hotspots.length) delete b.hotspots; if (!b.featured) delete b.featured;
      if ($('#dirLtr').checked) b.dir = 'ltr'; else delete b.dir;
      // الغلاف
      const cover = {}; let ar = ED.orig?.ar || 0;
      let n = 0, total = ['front', 'spine', 'back'].filter(k => ED.slots[k].file).length + pairs.reduce((a, p) => a + (p.r.file ? 1 : 0) + (p.l.file ? 1 : 0), 0);
      const prep = async (slot, path, opts) => {
        if (slot.file) {
          showBusy('جارٍ تجهيز الصور…', `${arNum(++n)} من ${arNum(total)}`, Math.round(n / Math.max(1, total) * 30));
          const c = await ImgTools.compress(slot.file, opts);
          files.push({ path, base64: c.base64 }); if (slot.path) deletes.add(slot.path);
          return { path, w: c.w, h: c.h };
        }
        if (slot.removed) { if (slot.path) deletes.add(slot.path); return null; }
        return slot.path ? { path: slot.path, w: 0, h: 0 } : null;
      };
      const showCover = work.includes('cover');
      const fr = await prep(ED.slots.front, `images/${ED.id}/front-${ts}.jpg`, { maxEdge: 2000, quality: .88 });
      if (fr) { cover.front = fr.path; if (fr.w) ar = +(fr.w / fr.h).toFixed(3); }
      if (showCover) {
        const sp = await prep(ED.slots.spine, `images/${ED.id}/spine-${ts}.jpg`, { maxEdge: 2000, quality: .88 }); if (sp) { cover.spine = sp.path; if (sp.w) b.sar = +(sp.w / sp.h).toFixed(4); } else delete b.sar;
        const bk = await prep(ED.slots.back, `images/${ED.id}/back-${ts}.jpg`, { maxEdge: 2000, quality: .88 }); if (bk) cover.back = bk.path;
      } else { ['spine', 'back'].forEach(k => { const s = ED.slots[k]; if (s.path) deletes.add(s.path); }); }
      if (cover.spine && !b.sar) { try { const im = new Image(); await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = cover.spine; }); if (im.naturalHeight) b.sar = +(im.naturalWidth / im.naturalHeight).toFixed(4); } catch { } }
      b.cover = cover; if (ar) b.ar = ar;
      // الصفحات
      const pages = []; let par = ED.orig?.par || 0;
      if (work.includes('typeset')) {
        for (let i = 0; i < pairs.length; i++) {
          const nn = String(i + 1).padStart(2, '0');
          const r = await prep(pairs[i].r, `images/${ED.id}/p${nn}-r-${ts}.jpg`, { maxEdge: 1600, quality: .85 });
          const l = await prep(pairs[i].l, `images/${ED.id}/p${nn}-l-${ts}.jpg`, { maxEdge: 1600, quality: .85 });
          if (r && r.w && !par) par = +(r.w / r.h).toFixed(3);
          pages.push({ r: r?.path || null, l: l?.path || null });
        }
      } else { (ED.orig?.pages || []).forEach(p => { if (p.r) deletes.add(p.r); if (p.l) deletes.add(p.l); }); }
      b.pages = pages; if (par) b.par = par;
      b.updatedAt = new Date().toISOString();
      // لا تحذف ما أُعيد استعماله
      const keep = new Set([cover.front, cover.spine, cover.back, ...pages.flatMap(p => [p.r, p.l])].filter(Boolean));
      const del = [...deletes].filter(p => !keep.has(p));
      // تأكد أن المحذوفات موجودة فعلاً في المستودع (تجنّب فشل الالتزام)
      let existing = null; try { existing = await api.tree(); } catch { }
      const del2 = existing ? del.filter(p => existing.has(p)) : del;

      showBusy('جارٍ النشر…', '', 35);
      await publish((ED.isNew ? 'إضافة كتاب: ' : 'تعديل كتاب: ') + title, files, del2, books => {
        const i = books.findIndex(x => x.id === b.id);
        if (i >= 0) { b.order = books[i].order; books[i] = b; } else { b.order = books.length; books.push(b); }
        return books;
      });
      hideBusy(); closeEditor();
      toast(api.mock ? 'حُفظ (وضع تجريبي)' : 'نُشر ✓ سيظهر في المعرض خلال دقيقة تقريبًا', 'ok');
    } catch (err) { hideBusy(); console.error(err); toast('فشل النشر: ' + errMsg(err), 'err'); }
  });

  $('#btnDelete').addEventListener('click', async () => {
    if (!ED?.orig) return;
    if (!confirm(`حذف «${ED.orig.title}» نهائيًّا من المعرض مع صوره؟`)) return;
    try {
      showBusy('جارٍ الحذف…');
      let del = [];
      try { const t = await api.tree(); del = [...t.keys()].filter(p => p.startsWith(`images/${ED.id}/`)); } catch { }
      const id = ED.id, title = ED.orig.title;
      await publish('حذف كتاب: ' + title, [], del, books => books.filter(x => x.id !== id));
      hideBusy(); closeEditor(); toast('حُذف الكتاب ونُشر التغيير', 'ok');
    } catch (e) { hideBusy(); toast('فشل الحذف: ' + errMsg(e), 'err'); }
  });

  addEventListener('beforeunload', e => { if (ED || ORDER_DIRTY) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- البدء ---------- */
  (async () => {
    const t = localStorage.getItem('bg_token') || '';
    if (t) $('#token').value = t;
    if (MOCK) { $('#ghStatus').textContent = 'وضع تجريبي (بلا نشر)'; $('#ghStatus').className = 'status ok'; }
    await connect(t, true);
    loadDB(true);
  })();
})();
