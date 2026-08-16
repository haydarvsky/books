/* ===== نموذج تجريبي: يولّد أغلفة وصفحات وهمية على الكانفاس (?demo=1) ===== */
window.DEMO_BOOKS = async function () {
  try { await document.fonts.load('700 40px "Sakkal Saad"'); await document.fonts.load('400 30px "Sakkal Saad"'); } catch (e) { }
  const F = '"Sakkal Saad", system-ui, sans-serif';
  const LOREM = 'كان الليلُ يهبطُ على المدينةِ هبوطَ الستائرِ الثقيلة، والنوافذُ تُطفئُ أنوارَها واحدةً بعد أخرى، وأنا أُقلِّبُ في يديَّ رسالةً قديمةً لم أجرؤْ على فتحِها منذ سنين. في الصباحِ التالي خرجتُ إلى السوقِ فوجدتُ الناسَ يتحدّثون عن المطرِ الذي لم يأتِ، وعن الكتبِ التي لم تُقرأ، وعن الأحلامِ التي أُجِّلت إلى موسمٍ آخر. '.repeat(3).split(' ');

  function wrap(ctx, words, maxW) {
    const lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }
  function pattern(ctx, W, H, c2, seed) {
    ctx.save(); ctx.globalAlpha = .18; ctx.strokeStyle = c2; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const r = 60 + i * 55 + (seed % 20); ctx.beginPath(); ctx.arc(W * .5, H * .38, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = .12; ctx.fillStyle = c2;
    for (let i = 0; i < 40; i++) { const x = ((seed * (i + 3) * 97) % W), y = ((seed * (i + 7) * 61) % H); ctx.beginPath(); ctx.arc(x, y, 3 + (i % 4), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function cover(b, side) {
    const W = 600, H = 860, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    ctx.fillStyle = b.color; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    pattern(ctx, W, H, b.accent, b.seed);
    ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.fillStyle = b.accent;
    if (side === 'front') {
      ctx.fillRect(W * .2, H * .58, W * .6, 3);
      ctx.fillStyle = '#FAF6EF'; ctx.font = `700 64px ${F}`;
      const lines = wrap(ctx, b.title.split(' '), W * .78);
      lines.forEach((l, i) => ctx.fillText(l, W / 2, H * .5 - (lines.length - 1) * 38 + i * 76));
      ctx.font = `400 34px ${F}`; ctx.fillStyle = b.accent; ctx.fillText(b.author, W / 2, H * .66);
      ctx.font = `400 22px ${F}`; ctx.fillStyle = 'rgba(250,246,239,.7)'; ctx.fillText(b.kind, W / 2, H * .72);
      ctx.fillText('دار الأفق للنشر', W / 2, H * .93);
    } else {
      ctx.fillStyle = 'rgba(250,246,239,.9)'; ctx.font = `700 30px ${F}`; ctx.fillText('من أجواء الكتاب', W / 2, H * .18);
      ctx.font = `400 24px ${F}`; ctx.textAlign = 'right';
      wrap(ctx, LOREM.slice(0, 70), W * .72).slice(0, 12).forEach((l, i) => ctx.fillText(l, W * .86, H * .26 + i * 40));
      ctx.fillStyle = '#fff'; ctx.fillRect(W * .12, H * .8, 150, 60); ctx.fillStyle = '#000';
      for (let i = 0; i < 28; i++) ctx.fillRect(W * .12 + 8 + i * 5, H * .8 + 8, (i * 7) % 3 + 1, 44);
    }
    return cv.toDataURL('image/jpeg', .85);
  }
  function spine(b) {
    const W = 90, H = 860, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    ctx.fillStyle = b.color; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = b.accent; ctx.fillRect(20, 60, 50, 3); ctx.fillRect(20, H - 120, 50, 3);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(b.dir === 'ltr' ? Math.PI / 2 : -Math.PI / 2);
    ctx.direction = b.dir === 'ltr' ? 'ltr' : 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FAF6EF'; ctx.font = `700 40px ${F}`;
    ctx.fillText(b.title, 0, -6); ctx.restore();
    ctx.save(); ctx.translate(W / 2, H - 80); ctx.rotate(-Math.PI / 2); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = b.accent; ctx.font = `400 22px ${F}`; ctx.fillText(b.author.split(' ').slice(-1)[0], 0, 0); ctx.restore();
    return cv.toDataURL('image/jpeg', .85);
  }
  function page(b, n, side) {
    const W = 600, H = 860, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    ctx.fillStyle = '#FBF8F1'; ctx.fillRect(0, 0, W, H);
    ctx.direction = 'rtl'; ctx.fillStyle = '#2A1A0F';
    const inner = side === 'r' ? 60 : 90, outer = side === 'r' ? 90 : 60; // الهامش الداخلي أضيق
    const left = side === 'r' ? inner : outer, right = W - (side === 'r' ? outer : inner);
    // الترويسة
    ctx.font = `400 18px ${F}`; ctx.fillStyle = '#7a6a58'; ctx.textAlign = side === 'r' ? 'right' : 'left';
    ctx.fillText(side === 'r' ? b.title : b.chapter, side === 'r' ? right : left, 70);
    ctx.fillStyle = '#C2780A'; ctx.fillRect(left, 82, right - left, 1);
    let y = 130;
    if (n === 2) { ctx.font = `700 40px ${F}`; ctx.fillStyle = '#0F4C3A'; ctx.textAlign = 'center'; ctx.fillText(b.chapter, W / 2, 160); y = 230; }
    ctx.font = `400 22px ${F}`; ctx.fillStyle = '#2A1A0F'; ctx.textAlign = 'right';
    const words = LOREM.slice((n * 13) % 40);
    const lines = wrap(ctx, words, right - left);
    for (const l of lines) { if (y > H - 110) break; ctx.fillText(l, right, y); y += 38; }
    // شعر أحياناً
    if (n % 3 === 0) { ctx.textAlign = 'center'; ctx.font = `700 22px ${F}`; ctx.fillStyle = '#0F4C3A'; ['وما البيتُ إلا ما ثوى فيه أهلُه', 'وما الدارُ إلا ما أقامَ بها الودُّ'].forEach((h, i) => ctx.fillText(h, W / 2, H - 200 + i * 40)); }
    // رقم الصفحة
    ctx.font = `400 20px ${F}`; ctx.fillStyle = '#7a6a58'; ctx.textAlign = 'center';
    ctx.fillText(new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(n), W / 2, H - 50);
    return cv.toDataURL('image/jpeg', .85);
  }

  const seeds = [
    { title: 'مسالكُ النور', author: 'د. عبدالله الراشد', kind: 'دراسة أدبية', color: '#0F4C3A', accent: '#D9A441', work: ['cover', 'typeset'], thick: 4, chapter: 'الفصل الأول: البدايات' },
    { title: 'حديقةُ الحكايات', author: 'مريم العلي', kind: 'قصص', color: '#8B3A2F', accent: '#F1D2A6', work: ['cover'], thick: 2 },
    { title: 'رسائلُ إلى ابني', author: 'حسن آل مبارك', kind: 'نثر', color: '#1F3A5F', accent: '#E8DFCC', work: ['typeset'], thick: 3, chapter: 'الرسالة الأولى' },
    { title: 'ديوانُ الصَّبا', author: 'سالم بن ناصر', kind: 'شعر', color: '#4A2C5A', accent: '#D9A441', work: ['cover', 'typeset'], thick: 3, chapter: 'قافية الدال' },
    { title: 'تاريخُ القهوة في الخليج', author: 'أ. خالد المهنا', kind: 'تاريخ', color: '#6B4423', accent: '#F5E6C8', work: ['cover'], thick: 5 },
    { title: 'فقهُ الجمال', author: 'ندى الحمود', kind: 'فكر', color: '#2E5E4E', accent: '#F0E4C0', work: ['cover', 'typeset'], thick: 2, chapter: 'مدخل' },
    { title: 'سيرةُ مدينة', author: 'يوسف الغانم', kind: 'رواية', color: '#B85C38', accent: '#FFF1DB', work: ['cover'], thick: 3 },
    { title: 'معجمُ البحر', author: 'مجموعة باحثين', kind: 'معجم', color: '#12384F', accent: '#8FCDE0', work: ['typeset'], thick: 5, chapter: 'باب الألف' },
    { title: 'خطواتٌ على الرمل', author: 'لطيفة الشمري', kind: 'خواطر', color: '#C2780A', accent: '#2A1A0F', work: ['cover', 'typeset'], thick: 1, chapter: 'الخطوة الأولى' },
    { title: 'أنوارُ الطريق', author: 'الشيخ محمد الحسن', kind: 'تربية', color: '#3B2F2F', accent: '#D9A441', work: ['cover'], thick: 4 },
    { title: 'The Silent Coast', author: 'A. R. Whitfield', kind: 'Novel', color: '#1F3A5F', accent: '#E8DFCC', work: ['cover', 'typeset'], thick: 3, chapter: 'Chapter One', dir: 'ltr' },
  ];
  return seeds.map((s, i) => {
    const b = { ...s, seed: i * 17 + 5, id: 'demo' + i, order: i, ar: 0.7, par: 0.7, year: (1440 + i % 7) + 'هـ' };
    b.note = s.work.length === 2 ? 'تصميم الغلاف كاملاً (أمامي وكعب وخلفي) مع تنضيد المتن وإخراجه للطباعة.' : s.work[0] === 'cover' ? 'تصميم الغلاف الكامل بوجهيه والكعب.' : 'تنضيد المتن وإخراجه الداخلي فقط.';
    const hasCover = s.work.includes('cover');
    b.cover = { front: cover(b, 'front'), spine: hasCover ? spine(b) : null, back: hasCover ? cover(b, 'back') : null };
    if (i === 0 || i === 3 || i === 5) {
      b.featured = true;
      b.philosophy = 'انطلق الغلاف من فكرة «الدائرة» بوصفها رمز الاكتمال والدوران حول مركزٍ واحد؛ فجاءت الحلقات المتّحدة المركز خلف العنوان لتوحي بالعمق والاتساع معًا، واختير اللون ' + s.kind + ' الهادئ ليمنح الكتاب وقارًا يليق بموضوعه، مع خطٍّ عربيٍّ ثقيلٍ للعنوان يثبّت البصر ويعطي هيبةً في المكتبات.';
      b.hotspots = [
        { x: 0.5, y: 0.5, t: 'العنوان بخطٍّ ثقيل متوسِّط ليقرأ من بعيد على الرفّ' },
        { x: 0.5, y: 0.66, t: 'اسم المؤلف بلونٍ ذهبيٍّ مخفَّفٍ حتى لا يزاحم العنوان' },
        { x: 0.5, y: 0.38, t: 'الحلقات المتّحدة المركز: رمز الاكتمال والدوران حول فكرةٍ واحدة' },
        { x: 0.5, y: 0.93, t: 'شعار الدار في الأسفل بحجمٍ صغيرٍ متوازن' },
      ];
    }
    if (s.work.includes('typeset')) { const n = 2 + (i % 3); b.pages = []; for (let k = 0; k < n; k++) b.pages.push({ r: page(b, k * 2 + 2, 'r'), l: page(b, k * 2 + 3, 'l') }); }
    return b;
  });
};
