const fs=require('fs'),path=require('path');
/* يُبنى ملفُّ العرض slides.html من صور الكتاب وخطّ صقّال سعد الموجود في المستودع.
   التشغيل:  node build-slides.js   ثم   node render-slides.js               */
const ROOT=path.resolve(__dirname,'../../..');          // جذر المستودع
const S=__dirname;
const b64=f=>fs.readFileSync(path.join(ROOT,'fonts',f)).toString('base64');
const f400=b64('sakkal-400.woff2'), f700=b64('sakkal-700.woff2');
const B=path.join(ROOT,'images','bmt336b7r')+'/';
const F=B+'front-mt338th9.jpg', BK=B+'back-mt338th9.jpg', SP=B+'spine-mt338th9.jpg';
const P=n=>B+n+'-mt338th9.jpg';
const COV=[1333,2000], PG=[1067,1600];

/* crop helper: fractions of the source image */
function crop(src,dim,x0,y0,x1,y1,outW,cls=''){
  const W=outW/(x1-x0), H=W*(dim[1]/dim[0]);
  const h=(y1-y0)*H;
  return `<div class="crop ${cls}" style="width:${outW}px;height:${h.toFixed(1)}px;
    background-image:url('${src}');background-size:${W.toFixed(1)}px ${H.toFixed(1)}px;
    background-position:-${(x0*W).toFixed(1)}px -${(y0*H).toFixed(1)}px"></div>`;
}

const CSS=`
@font-face{font-family:"Sakkal";src:url(data:font/woff2;base64,${f400}) format("woff2");font-weight:400}
@font-face{font-family:"Sakkal";src:url(data:font/woff2;base64,${f700}) format("woff2");font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0b0906;font-family:"Sakkal",serif;-webkit-font-smoothing:antialiased}
:root{
  --bg:#141009; --bg2:#1d1810; --cream:#E8DFCC; --paper:#FAF6EF; --gold:#D9A441;
  --green:#0F4C3A; --sand:#B1A068; --ink:#2A1A0F;
  --mut:rgba(232,223,204,.66); --mut2:rgba(232,223,204,.42); --line:rgba(217,164,65,.28);
}
.slide{width:1400px;background:var(--bg);color:var(--cream);padding:78px 86px 84px;position:relative;
  overflow:hidden;margin:0 0 40px;line-height:1.5}
.slide::before{content:"";position:absolute;inset:0;
  background:radial-gradient(1100px 620px at 50% -14%,#232a24 0%,var(--bg2) 44%,var(--bg) 100%);z-index:0}
.slide>*{position:relative;z-index:1}
.top{display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:44px}
.eyebrow{color:var(--gold);font-size:20px;font-weight:700;letter-spacing:.02em}
.num{color:var(--mut2);font-size:19px;font-weight:400;font-variant-numeric:tabular-nums}
h1{font-size:66px;font-weight:700;color:var(--paper);line-height:1.14;letter-spacing:-.01em}
h2{font-size:46px;font-weight:700;color:var(--paper);line-height:1.2;margin-bottom:14px}
h3{font-size:27px;font-weight:700;color:var(--gold);margin-bottom:9px}
p{font-size:23px;color:var(--mut);line-height:1.72}
p.lede{font-size:26px;color:var(--cream);line-height:1.66}
.kw{color:var(--gold);font-weight:700}
.wh{color:var(--paper);font-weight:700}
.rule{height:1px;background:var(--line);margin:34px 0}
.row{display:flex;gap:52px;align-items:flex-start}
.shot{box-shadow:0 44px 90px -26px rgba(0,0,0,.86),0 0 0 1px rgba(232,223,204,.09);display:block}
figcaption{font-size:19px;color:var(--mut2);margin-top:15px;line-height:1.55}
.crop{background-repeat:no-repeat;background-color:#FBF6E6;border-radius:3px;
  box-shadow:0 14px 34px -12px rgba(0,0,0,.7),0 0 0 1px rgba(232,223,204,.1)}
.specs{display:flex;flex-wrap:wrap;gap:0}
.spec{width:25%;padding:20px 22px 20px 0;border-top:1px solid var(--line)}
.spec b{display:block;font-size:37px;color:var(--gold);font-weight:700;line-height:1.1}
.spec span{font-size:19px;color:var(--mut2)}
ol.cal{list-style:none;counter-reset:c}
ol.cal li{counter-increment:c;position:relative;padding:0 56px 22px 0;margin-bottom:2px}
ol.cal li::before{content:counter(c,arabic-indic);position:absolute;right:0;top:2px;width:38px;height:38px;
  border-radius:50%;background:var(--gold);color:#1a1305;font-weight:700;font-size:21px;
  display:flex;align-items:center;justify-content:center}
ol.cal b{display:block;font-size:24px;color:var(--paper);font-weight:700;margin-bottom:2px}
ol.cal span{font-size:20px;color:var(--mut);line-height:1.6}
.dot{position:absolute;width:34px;height:34px;border-radius:50%;background:var(--gold);color:#1a1305;
  font-weight:700;font-size:19px;display:flex;align-items:center;justify-content:center;
  transform:translate(-50%,-50%);box-shadow:0 0 0 4px rgba(20,16,9,.55),0 6px 16px rgba(0,0,0,.55)}
.sw{width:100%;height:132px;border-radius:5px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}
.swb{font-size:22px;color:var(--paper);font-weight:700;margin-top:12px}
.swh{font-size:19px;color:var(--mut2);letter-spacing:.03em}
.tag{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:8px 20px;
  font-size:20px;color:var(--cream);margin:0 0 11px 11px}
.card{background:rgba(232,223,204,.045);border:1px solid rgba(232,223,204,.1);border-radius:9px;padding:26px 28px}
.card h3{margin-bottom:7px}
.card p{font-size:21px;line-height:1.62}
.gl{position:absolute;background:rgba(217,164,65,.55)}
.glbl{position:absolute;background:rgba(217,164,65,.28)}
.cw{position:relative;flex:none}
.tick{position:absolute;font-size:17px;color:var(--gold);white-space:nowrap;text-align:left;
  width:150px;left:-166px;transform:translateY(-50%);line-height:1.25}
.tick i{font-style:normal;display:block;font-size:15px;color:var(--mut2)}
.lead{position:absolute;left:-160px;height:1px;width:160px;background:linear-gradient(to right,rgba(217,164,65,.12),rgba(217,164,65,.55))}
.gut{padding-left:180px}
.fill{position:absolute;background:rgba(217,164,65,.11);outline:1px dashed rgba(217,164,65,.5)}
.ladder{display:flex;flex-direction:column;gap:26px}
.lrow{display:flex;align-items:center;gap:30px}
.lmeta{width:290px;flex:none;text-align:right}
.lmeta b{display:block;font-size:24px;color:var(--paper);font-weight:700}
.lmeta span{font-size:19px;color:var(--mut2);line-height:1.5}
`;

const S1=`<section class="slide" id="s1" style="padding-bottom:70px">
 <div class="top"><span class="eyebrow">تصميم غلاف كتاب · تنضيد وإخراج داخلي</span><span class="num">٠١ / ١٣</span></div>
 <div class="row" style="align-items:center;gap:70px;max-width:1080px;margin:0 auto">
  <div style="flex:1">
   <p style="font-size:24px;color:var(--sand);margin-bottom:12px">خالد سالم السدّاني · ١٤٤٧ﻫ – ٢٠٢٦م</p>
   <h1 style="font-size:88px">الململ</h1>
   <p class="lede" style="margin-top:18px">
    قصّةٌ مستوحاةٌ من أحداثٍ حقيقية: طفلةٌ ضاعت في صحراء الكويت،
    فلم يبقَ منها أثرٌ إلّا ثوبُ ململٍ معلَّقٌ على عرفجة.</p>
   <div class="rule" style="margin:30px 0 26px"></div>
   <p style="font-size:21px;line-height:1.9">
    <span class="kw">تصميم الغلاف</span> · <span class="kw">التنضيد الداخلي</span> ·
    <span class="kw">الصفّ والتنسيق</span> · <span class="kw">الإخراج الفنّي</span><br>
    <span style="color:var(--mut2)">حيدر المعاتيق — أبو إيليا</span></p>
  </div>
  <figure style="flex:none">
   <img class="shot" src="${F}" width="470" height="705" alt="تصميم غلاف كتاب الململ">
  </figure>
 </div>
</section>`;

const S2=`<section class="slide" id="s2">
 <div class="top"><span class="eyebrow">الغلاف كاملاً — مسطّحاً</span><span class="num">٠٢ / ١٣</span></div>
 <h2>غلافٌ واحدٌ يلتفّ حول الكتاب</h2>
 <p style="max-width:1080px;margin-bottom:38px">الظهر والكعب والوجه ليست ثلاث لوحات، بل لوحةٌ واحدةٌ مقطوعة: خطُّ الأفق يعبُر
  الكعب فيصل صحراءَ الظهر بصحراءِ الوجه، وأرضُ التهشير تُكمِل مسيرها تحت الكعب دون انقطاع. هذا هو الفرق بين
  <span class="wh">تصميم غلاف</span> وبين ثلاثة تصاميم مُلصَقة.</p>
 <div style="display:flex;direction:ltr;height:840px;justify-content:center;align-items:stretch;
   box-shadow:0 46px 96px -30px rgba(0,0,0,.9);background:#FBF6E6;width:fit-content;margin:0 auto">
  <img src="${F}"  style="height:100%;width:auto;display:block" alt="تصميم الغلاف الأمامي">
  <img src="${SP}" style="height:100%;width:auto;display:block" alt="تصميم كعب الكتاب">
  <img src="${BK}" style="height:100%;width:auto;display:block" alt="تصميم الغلاف الخلفي">
 </div>
 <div style="display:flex;direction:ltr;margin:16px auto 0;color:var(--mut2);font-size:19px;width:1168px;max-width:100%">
  <span style="flex:1;text-align:center">الغلاف الأمامي</span>
  <span style="width:50px;text-align:center">الكعب</span>
  <span style="flex:1;text-align:center">الغلاف الخلفي</span>
 </div>
 <p style="font-size:19px;color:var(--mut2);text-align:center;margin-top:10px">
  ترتيبُ الطبع للكتاب العربيّ: الوجهُ يساراً والظهرُ يميناً، والكعبُ بينهما.</p>
</section>`;

const CALLS=[
 [80,14.2,'اسمُ المؤلف','بخطٍّ نسخيٍّ خفيفٍ فوق العنوان — يُقدَّم أدباً ولا يُزاحم.'],
 [89,25.3,'العنوان بخطٍّ كوفيٍّ ثقيل','كتلةٌ صمّاء بعرض ٥١٪ من الغلاف، أفقيّةُ الحسّ كخطّ الأفق تحتها.'],
 [76,34.6,'سطر التوصيف','«قصة مستوحاة من أحداث حقيقية» — بنطٌ صغيرٌ يُنهي كتلة الطباعة.'],
 [5,59,'«العافور»','عمود الغبار الدوّار — الحدث الذي تدور عليه القصّة، مُزاحٌ إلى الطرف صغيراً بعيداً.'],
 [31,57.5,'ثوبُ الململ','بياضُ الورق نفسه هو الثوب: لم يُطبَع أبيض، بل تُرك فراغاً في التهشير.'],
 [92,66,'العرفجة','الشجيرة الشوكيّة التي تعلّق بها الثوب — بؤرةُ الغلاف البصريّة.'],
 [6,74,'خطُّ الأفق','عند ٧٠٪ من ارتفاع الغلاف: سماءٌ واسعة وأرضٌ قصيرة، فيثقُل الخلاء.'],
 [50,93,'أرضُ التهشير','قلمُ حبرٍ خالص — لا رماديّ ولا تدرّج، فيبقى الغلاف قابلاً للطبع بلونٍ واحد.'],
];
const S3=`<section class="slide" id="s3">
 <div class="top"><span class="eyebrow">تشريح الغلاف — قراءةٌ في التفاصيل</span><span class="num">٠٣ / ١٣</span></div>
 <div class="row" style="gap:60px">
  <div style="flex:1">
   <h2 style="margin-bottom:10px">ثمانِ قراراتٍ صغيرة تصنع غلافاً</h2>
   <p style="margin-bottom:30px;font-size:21px">لا يُقاس <span class="wh">تصميم غلاف الكتاب</span> بجمال الصورة وحدها،
    بل بما تقوله كلُّ تفصيلةٍ عن النصّ الذي تحتها.</p>
   <ol class="cal">${CALLS.map(c=>`<li><b>${c[2]}</b><span>${c[3]}</span></li>`).join('')}</ol>
  </div>
  <figure style="flex:none;position:relative;width:470px">
   <img class="shot" src="${F}" width="470" height="705" alt="تشريح تصميم غلاف كتاب">
   <span style="position:absolute;left:0;top:70.6%;width:26%;height:1px;background:rgba(217,164,65,.8)"></span>
   ${CALLS.map((c,i)=>`<span class="dot" style="left:${c[0]}%;top:${c[1]}%">${'٠١٢٣٤٥٦٧٨٩'[i+1]}</span>`).join('')}
  </figure>
 </div>
</section>`;

const S4=`<section class="slide" id="s4">
 <div class="top"><span class="eyebrow">شبكة الغلاف والقياسات</span><span class="num">٠٤ / ١٣</span></div>
 <div class="row" style="gap:58px">
  <div style="flex:1">
   <h2>الفراغ قرارٌ لا فائض</h2>
   <p style="margin-bottom:26px">قِستُ الغلاف بعد إخراجه: كتلةُ الطباعة كلُّها محبوسةٌ بين ١٣٪ و٣٥٪ من أعلى الغلاف،
    ثم يأتي <span class="wh">شريطُ صمتٍ كامل</span> — عُشرٌ من الغلاف لا حبرَ فيه إطلاقاً — قبل أن يبدأ الرسم.
    هذا البياض هو الذي يجعل العنوان يُقرأ من بعيدٍ على رفّ المكتبة.</p>
   <div class="specs">
    <div class="spec" style="width:50%"><b>٢ : ٣</b><span>نسبة القطع</span></div>
    <div class="spec" style="width:50%"><b>٥١٪</b><span>عرض كتلة العنوان من عرض الغلاف</span></div>
    <div class="spec" style="width:50%"><b>٧٠٪</b><span>موضع خطّ الأفق من الأعلى</span></div>
    <div class="spec" style="width:50%"><b>١٤٪</b><span>مساحة تغطية الحبر في الغلاف كلّه</span></div>
    <div class="spec" style="width:50%"><b>٠٪</b><span>حبرٌ في الشريحة الخامسة (٤٠٪–٥٠٪)</span></div>
    <div class="spec" style="width:50%"><b>محورٌ واحد</b><span>يمرّ بالمؤلف والعنوان والتوصيف</span></div>
   </div>
  </div>
  <figure class="gut" style="flex:none;width:650px">
   <div class="cw" style="width:470px;margin-left:auto">
   <img class="shot" src="${F}" width="470" height="705" alt="شبكة تصميم الغلاف والهوامش">
   <span class="gl" style="left:50%;top:0;width:1px;height:100%"></span>
   <span class="fill" style="left:24.8%;top:19.6%;width:51%;height:11.5%"></span>
   <span class="glbl" style="left:0;top:12.8%;width:100%;height:1px"></span>
   <span class="glbl" style="left:0;top:35.4%;width:100%;height:1px"></span>
   <span class="fill" style="left:0;top:40%;width:100%;height:10%;background:rgba(217,164,65,.1)"></span>
   <span class="gl" style="left:0;top:70.6%;width:100%;height:1px"></span>
   <span class="lead" style="top:12.8%"></span><span class="tick" style="top:12.8%">١٢٫٨٪<i>مبدأ الطباعة</i></span>
   <span class="lead" style="top:35.4%"></span><span class="tick" style="top:35.4%">٣٥٫٤٪<i>نهاية الطباعة</i></span>
   <span class="lead" style="top:45%"></span><span class="tick" style="top:45%">٠٪ حبر<i>شريط صمت</i></span>
   <span class="lead" style="top:70.6%"></span><span class="tick" style="top:70.6%">٧٠٫٦٪<i>خطّ الأفق</i></span>
   </div>
  </figure>
 </div>
</section>`;

const SWATCH=[['#FCF8EC','ورقٌ كريميّ','خامة الغلاف — لا أبيضَ ناصع'],
 ['#23211D','حبرٌ أسود دافئ','لونُ الطباعة الوحيد'],
 ['#D9D5C7','رماديّ التهشير','ليس لوناً: كثافةُ خطوطٍ سوداء'],
 ['#B1A068','رمليّ الكعب','لون العمل في رفّ المعرض']];
const S5=`<section class="slide" id="s5">
 <div class="top"><span class="eyebrow">اللون والخامة</span><span class="num">٠٥ / ١٣</span></div>
 <h2>لونٌ واحدٌ على ورقٍ كريميّ</h2>
 <p style="max-width:1080px;margin-bottom:40px">الغلافُ كلُّه <span class="wh">حبرٌ أسودُ واحدٌ</span> على ورقٍ كريميّ.
  والرماديُّ الذي تراه في الأرض ليس لوناً ثالثاً، بل تهشيرٌ بقلمٍ أسود تتباعد خطوطه وتتقارب.
  هذا القرار يُبقي كلفة <span class="wh">طباعة الكتاب</span> منخفضة، ويحفظ للغلاف حِدّته مهما تغيّرت المطبعة.</p>
 <div class="row" style="gap:26px;margin-bottom:44px">
  ${SWATCH.map(s=>`<div style="flex:1">
    <div class="sw" style="background:${s[0]}"></div>
    <div class="swb">${s[1]}</div><div class="swh" dir="ltr" style="text-align:right">${s[0]}</div>
    <div style="font-size:18px;color:var(--mut2);margin-top:5px;line-height:1.5">${s[2]}</div></div>`).join('')}
 </div>
 <div class="row" style="gap:26px">
  <div class="card" style="flex:1"><h3>لماذا الكريميّ لا الأبيض؟</h3>
   <p>الورقُ الكريميّ يخفض تباين الحبر قليلاً فيُريح العين في القراءة الطويلة، ويمنح الرسم بالقلم دفءَ الورق القديم.</p></div>
  <div class="card" style="flex:1"><h3>وحدةُ الغلاف والمتن</h3>
   <p>الأسودُ نفسه في الغلاف هو أسودُ المتن واللوحات الداخلية — فلا ينكسر الحسُّ حين يفتح القارئ الكتاب.</p></div>
  <div class="card" style="flex:1"><h3>جاهزٌ للمطبعة</h3>
   <p>ملفٌّ بلونٍ واحد يعني بروفةً أسهل، وتسليماً أدقّ في <span class="kw">التجهيز للطباعة</span>.</p></div>
 </div>
</section>`;

const S6=`<section class="slide" id="s6">
 <div class="top"><span class="eyebrow">الكعب والغلاف الخلفي</span><span class="num">٠٦ / ١٣</span></div>
 <div class="row" style="gap:50px;align-items:flex-start">
  <figure style="flex:none">
   <img class="shot" src="${BK}" width="520" height="780" alt="تصميم الغلاف الخلفي للكتاب">
   <figcaption>الغلاف الخلفي — نصُّ التعريف في الثلث العلوي، والأرض تُكمِل مشهد الوجه.</figcaption>
  </figure>
  <div style="flex:1">
   <h2>الظهرُ نصٌّ، لا زحام</h2>
   <p style="margin-bottom:24px">أربعةُ أسطرٍ فقط، مضبوطةٌ بالتشكيل حيث يلزم، وسطرٌ واحدٌ مُبرَّزٌ بالأسود العريض هو مفتاح الكتاب:
    <span class="wh">«ثوبُ ململٍ معلَّقٌ على عرفجة»</span>. ما عدا ذلك بياض. لا فقراتِ مديحٍ ولا سِيَرٍ ذاتيّة —
    فالكتابُ قصّة، والغلافُ الخلفيُّ نافذةٌ لا واجهةُ محلّ.</p>
   <div class="rule"></div>
   <div class="row" style="gap:30px;align-items:flex-start">
    <figure style="flex:none">
     <img class="shot" src="${SP}" style="height:560px;width:auto;display:block" alt="تصميم كعب الكتاب">
    </figure>
    <div style="flex:1">
     <h3>الكعب: العمود الفقريّ</h3>
     <p style="font-size:21px">العنوانُ بالكوفيّ نفسه، والمؤلفُ بالنسخ نفسه، والأرضُ تنزل إلى أسفل الكعب
      فتُخبِر — والكتابُ مغلقٌ على الرفّ — أنّ تحت هذا الاسم صحراء.</p>
     <p style="font-size:21px;margin-top:14px;color:var(--mut2)">سُمكُ الكعب حُسِب على عدد صفحات الكتاب وسماكة الورق قبل التصميم،
      لا بعده؛ وهذه خطوةٌ يسقط فيها كثيرٌ من الأغلفة عند <span class="kw">التسليم للمطبعة</span>.</p>
    </div>
   </div>
  </div>
 </div>
</section>`;

const S7=`<section class="slide" id="s7">
 <div class="top"><span class="eyebrow">التنضيد الداخلي — نشرةٌ كاملة</span><span class="num">٠٧ / ١٣</span></div>
 <h2>النشرةُ وحدةُ التصميم، لا الصفحة</h2>
 <p style="max-width:1090px;margin-bottom:36px">القارئ لا يرى صفحةً واحدة، بل صفحتين معاً. لذلك يُصمَّم <span class="wh">التنضيد الداخلي</span>
  على النشرة: لوحةٌ كاملةٌ إلى اليمين تُقابلها كتلةُ نصٍّ إلى اليسار، فيستريح البصرُ في جهةٍ ويعمل في الأخرى.</p>
 <div style="display:flex;direction:ltr;width:fit-content;margin:0 auto;gap:3px;background:#efe9dc;padding:3px;
   box-shadow:0 46px 96px -30px rgba(0,0,0,.9)">
  <img src="${P('p03-l')}" style="width:566px;height:849px;display:block" alt="مفتتح فصل — تنضيد داخلي">
  <img src="${P('p03-r')}" style="width:566px;height:849px;display:block" alt="لوحة داخلية — إخراج كتاب">
 </div>
 <div class="row" style="gap:30px;margin-top:34px">
  <div style="flex:1"><h3>الصفحة اليمنى — لوحة</h3>
   <p style="font-size:21px">رسمٌ بالحبر بلا إطار، معلَّقٌ في بياض الصفحة، وتحته تعليقٌ ببنطٍ صغير: «الجصّاص عبدالله الغاير».</p></div>
  <div style="flex:1"><h3>الصفحة اليسرى — مفتتح فصل</h3>
   <p style="font-size:21px">العنوانُ ينزل ٢١٫٦٪ من أعلى الصفحة، ثم يبدأ المتن — نزلةٌ ثابتةٌ في كلّ فصل.</p></div>
  <div style="flex:1"><h3>الأسماء بالأسود العريض</h3>
   <p style="font-size:21px">أعلامُ القصّة ومصطلحاتُ اللهجة تُبرَّز عند أوّل ورودها فقط، فتُبنى ذاكرةُ القارئ دون ضجيج.</p></div>
 </div>
</section>`;

const S8=`<section class="slide" id="s8">
 <div class="top"><span class="eyebrow">شبكة الصفحة الداخلية — قياساتٌ مأخوذةٌ من الكتاب</span><span class="num">٠٨ / ١٣</span></div>
 <div class="row" style="gap:56px">
  <div style="flex:1">
   <h2>هندسةُ الصفحة</h2>
   <p style="margin-bottom:28px">هذه ليست قياساتٍ نظريّة: قِستُها من صفحات الكتاب المطبوع نفسها.
    <span class="wh">الهوامش الجانبيّة متساويةٌ تماماً</span> يمنةً ويسرة — قرارٌ يليق بكتابٍ سرديٍّ
    صغير القطع لا تُثقِله المجلّدات، ويجعل النشرة تُقرأ ككتلةٍ واحدةٍ متوازنة.</p>
   <div class="specs">
    <div class="spec"><b>٢ : ٣</b><span>نسبة الصفحة</span></div>
    <div class="spec"><b>١٥٫١٪</b><span>الهامش الأيمن</span></div>
    <div class="spec"><b>١٥٫٢٪</b><span>الهامش الأيسر</span></div>
    <div class="spec"><b>٦٩٫٧٪</b><span>عرض العمود (المقاس)</span></div>
    <div class="spec"><b>٢١٫٦٪</b><span>نزلةُ مفتتح الفصل</span></div>
    <div class="spec"><b>١٠٫٣٪</b><span>هامشُ صفحة المتن العلوي</span></div>
    <div class="spec"><b>٤٫٧٪</b><span>موضعُ رقم الصفحة من الأسفل</span></div>
    <div class="spec"><b>١٫٥ ×</b><span>البياضُ بين السطور إلى ارتفاع السطر</span></div>
   </div>
   <div class="rule"></div>
   <p style="font-size:21px"><span class="kw">تنسيقٌ داخليٌّ</span> ثابتٌ عبر صفحات الكتاب كلِّها: المقاسُ نفسه، والنزلةُ نفسها،
    والترقيمُ في الموضع نفسه — لا تتزحزح ورقةٌ عن أختها.</p>
  </div>
  <figure class="gut" style="flex:none;width:650px">
   <div class="cw" style="width:470px;margin-left:auto">
   <img class="shot" src="${P('p04-r')}" width="470" height="705" alt="شبكة الصفحة الداخلية والهوامش في تنضيد الكتاب">
   <span class="fill" style="left:15.1%;top:10.3%;width:69.7%;height:48.5%"></span>
   <span class="gl" style="left:15.2%;top:0;width:1px;height:100%"></span>
   <span class="gl" style="right:15.1%;top:0;width:1px;height:100%"></span>
   <span class="glbl" style="left:0;top:10.3%;width:100%;height:1px"></span>
   <span class="gl" style="left:0;top:95.3%;width:100%;height:1px"></span>
   <span class="lead" style="top:10.3%"></span><span class="tick" style="top:10.3%">١٠٫٣٪<i>الهامش العلوي</i></span>
   <span class="lead" style="top:34%"></span><span class="tick" style="top:34%">٦٩٫٧٪<i>عرض العمود</i></span>
   <span class="lead" style="top:58.8%"></span><span class="tick" style="top:58.8%">١٥٫١٪ / ١٥٫٢٪<i>الهامشان متساويان</i></span>
   <span class="lead" style="top:95.3%"></span><span class="tick" style="top:95.3%">٤٫٧٪<i>رقم الصفحة</i></span>
   </div>
   <figcaption style="text-align:center">الظلُّ الذهبيّ = كتلةُ النصّ كما قِيست على الصفحة المطبوعة.</figcaption>
  </figure>
 </div>
</section>`;

const S9=`<section class="slide" id="s9">
 <div class="top"><span class="eyebrow">التدرّج الطباعي — خطّان لا أكثر</span><span class="num">٠٩ / ١٣</span></div>
 <h2>كوفيٌّ يصرخ، ونسخٌ يروي</h2>
 <p style="max-width:1080px;margin-bottom:40px">نظامُ <span class="wh">الصفّ والتنضيد</span> كلُّه مبنيٌّ على أسرةِ خطّين:
  كوفيٌّ ثقيلٌ للعناوين وحدها، ونسخٌ للقراءة. ستّ درجاتٍ فقط تحكم الكتاب من الغلاف إلى رقم الصفحة —
  وكلّما قلّت الدرجاتُ اشتدّ الانضباط.</p>
 <div class="ladder">
  <div class="lrow"><div class="lmeta"><b>١ · عنوان الغلاف</b><span>كوفيّ ثقيل — أكبر بنطٍ في الكتاب</span></div>
   ${crop(F,COV,0.24,0.19,0.77,0.315,600)}</div>
  <div class="lrow"><div class="lmeta"><b>٢ · فاصل الفصل</b><span>رقمُ الفصل نسخاً، وعنوانه كوفيّاً</span></div>
   ${crop(P('p02-l'),PG,0.17,0.475,0.85,0.565,600)}</div>
  <div class="lrow"><div class="lmeta"><b>٣ · مفتتح الفصل</b><span>كوفيّ متوسّط، منزَّلٌ ٢١٫٦٪</span></div>
   ${crop(P('p03-l'),PG,0.28,0.205,0.72,0.26,470)}</div>
  <div class="lrow"><div class="lmeta"><b>٤ · المتن</b><span>نسخ — مضبوطٌ بالتشكيل عند اللبس</span></div>
   ${crop(P('p04-r'),PG,0.15,0.145,0.85,0.272,600)}</div>
  <div class="lrow"><div class="lmeta"><b>٥ · تعليق اللوحة</b><span>بنطٌ صغير، وسط الصفحة</span></div>
   ${crop(P('p05-r'),PG,0.26,0.672,0.74,0.727,500)}</div>
  <div class="lrow"><div class="lmeta"><b>٦ · رقم الصفحة</b><span>أرقامٌ مشرقيّة (٤٤) لا لاتينيّة (44)</span></div>
   ${crop(P('p04-r'),PG,0.44,0.935,0.56,0.965,140)}</div>
 </div>
</section>`;

const S10=`<section class="slide" id="s10">
 <div class="top"><span class="eyebrow">فواصل الفصول ومفاتحها</span><span class="num">١٠ / ١٣</span></div>
 <div class="row" style="gap:46px;align-items:flex-start">
  <figure style="flex:none">
   <img class="shot" src="${P('p02-l')}" width="440" height="660" alt="صفحة فاصل الفصل في تنضيد الكتاب">
   <figcaption>فاصلُ الفصل: صفحةٌ كاملةٌ لسطرين.</figcaption></figure>
  <figure style="flex:none">
   <img class="shot" src="${P('p03-l')}" width="440" height="660" alt="مفتتح الفصل والتنسيق الداخلي">
   <figcaption>مفتتحُ الفصل: عنوانٌ ثم متن.</figcaption></figure>
  <div style="flex:1">
   <h2 style="font-size:40px">إيقاعُ الدخول</h2>
   <p style="font-size:21px;margin-bottom:20px">لكلّ فصلٍ بابان: صفحةٌ فاصلةٌ تحمل رقم الفصل وعنوانه في وسط البياض،
    ثم صفحةُ المفتتح. الأولى تُوقِف القارئ، والثانية تُدخِله.</p>
   <div class="card" style="margin-bottom:18px"><h3>لماذا صفحةٌ كاملةٌ لسطرين؟</h3>
    <p>لأنّ الصمتَ في كتابٍ عن فقدٍ ليس ترفاً. البياضُ هنا جزءٌ من السرد، لا هدرٌ في الورق.</p></div>
   <div class="card" style="margin-bottom:18px"><h3>العنوان فوق المنتصف</h3>
    <p>موضوعٌ أعلى من مركز الصفحة قليلاً — تصحيحٌ بصريٌّ، لأنّ المنتصف الحسابيّ يبدو للعين هابطاً.</p></div>
   <div class="card"><h3>صفحاتٌ بيضٌ مقصودة</h3>
    <p>يبدأ كلُّ فصلٍ في صفحةٍ فرديّة — وهي اليسرى في الكتاب العربيّ؛ فإن اقتضى الأمرُ تُرِكت
     صفحةٌ بيضاء قبله، كالصفحة ٢٠ قبل فاصل الفصل الثاني. وهذا من ضبط
     <span class="kw">إخراج الكتاب</span> لا من إهماله.</p></div>
  </div>
 </div>
</section>`;

const S11=`<section class="slide" id="s11">
 <div class="top"><span class="eyebrow">اللوحات الداخلية</span><span class="num">١١ / ١٣</span></div>
 <h2>رسمٌ بالحبر يُكمِل النصّ ولا يُكرّره</h2>
 <p style="max-width:1090px;margin-bottom:34px">لوحاتُ الكتاب كلُّها بالقلم الأسود على بياض الصفحة، بلا إطارٍ ولا خلفيّة.
  والوجوهُ فيها متروكةٌ بيضاء عمداً: القصّةُ حقيقيّةٌ وأهلُها معروفون، فلا يُفترى على ملامحهم.</p>
 <div class="row" style="gap:34px;align-items:flex-start">
  <figure style="flex:1"><img class="shot" src="${P('p05-r')}" style="width:100%;display:block" alt="لوحة العافور في إخراج الكتاب">
   <figcaption><span class="wh">«العافور»</span> — العاصفة التي تدور عليها القصّة، وهي نفسها العمودُ البعيد في الغلاف.</figcaption></figure>
  <figure style="flex:1"><img class="shot" src="${P('p06-r')}" style="width:100%;display:block" alt="لوحة داخلية بالحبر — تنضيد وإخراج">
   <figcaption><span class="wh">«يبا يبا، أنا حصّة»</span> — لحظةُ الذروة، والوجوهُ بيضاء.</figcaption></figure>
  <div style="flex:none;width:330px">
   <div class="card" style="margin-bottom:16px"><h3>وحدةُ القلم</h3>
    <p>سماكةُ الخطّ نفسها في الغلاف واللوحات، فتبدو كأنّها من دفترٍ واحد.</p></div>
   <div class="card" style="margin-bottom:16px"><h3>موضعُ اللوحة</h3>
    <p>كلُّ لوحةٍ في صفحةٍ يمنى تُقابل نصَّها في اليسرى — لا تسبقُ الحدثَ ولا تتأخّر عنه.</p></div>
   <div class="card"><h3>التعليق</h3>
    <p>سطرٌ واحدٌ تحت اللوحة بلغةِ الكتاب نفسها، يضبط المشهد ولا يشرحه.</p></div>
  </div>
 </div>
</section>`;

const S12=`<section class="slide" id="s12">
 <div class="top"><span class="eyebrow">الفهرس والملاحق — عملُ الإخراج غير المرئيّ</span><span class="num">١٢ / ١٣</span></div>
 <div class="row" style="gap:44px;align-items:flex-start">
  <figure style="flex:none"><img class="shot" src="${P('p07-r')}" width="430" height="645" alt="فهرس الكتاب — تنضيد وتنسيق داخلي">
   <figcaption>الفهرس: فصلٌ ثم عنوانٌ ثم بنودٌ بنقاطٍ رابطة.</figcaption></figure>
  <figure style="flex:none"><img class="shot" src="${P('p08-l')}" width="430" height="645" alt="ملاحق الكتاب ومسرد المصطلحات">
   <figcaption>الملاحق: مسردُ المصطلحات وخطُّ سير الأحداث.</figcaption></figure>
  <div style="flex:1">
   <h2 style="font-size:40px">ما لا يراه القارئ</h2>
   <p style="font-size:21px;margin-bottom:22px">الفهرسُ أضيقُ من المتن عمداً: عرضُه <span class="wh">٥٥٫٥٪</span> من الصفحة
    مقابل ٦٩٫٧٪ للمتن — لأنّ النقاطَ الرابطة تحتاج مدىً قصيراً كي لا تتفكّك العلاقةُ بين العنوان ورقمه.</p>
   <div class="specs" style="margin-bottom:8px">
    <div class="spec" style="width:50%"><b>٥٥٫٥٪</b><span>عرضُ عمود الفهرس</span></div>
    <div class="spec" style="width:50%"><b>٢٢٫٢٪</b><span>هامشُ الفهرس الجانبي</span></div>
    <div class="spec" style="width:50%"><b>×٢</b><span>بياضٌ مضاعفٌ بين مجموعات الفصول</span></div>
    <div class="spec" style="width:50%"><b>١٧</b><span>فصلاً + ملحقان</span></div>
   </div>
   <div class="card"><h3>الملاحق ليست حشواً</h3>
    <p><span class="kw">مسردُ المصطلحات</span> يشرح ألفاظ اللهجة الكويتيّة القديمة («الجصّاص»، «العافور»، «الململ»)،
     و<span class="kw">خطُّ سير الأحداث</span> يرتّب زمن القصّة. اقتراحُهما وتنضيدُهما جزءٌ من
     <span class="kw">الإخراج الفنّي للكتاب</span>، لا من كتابته.</p></div>
  </div>
 </div>
</section>`;

const TAGS=['تصميم غلاف كتاب','تنضيد داخلي','تنسيق داخلي للكتب','صفّ وتنضيد','إخراج كتاب',
 'الإخراج الفنّي','تصميم كتب عربية','مصمم أغلفة كتب','شبكة الصفحة','ضبط النصّ العربي',
 'تجهيز للمطبعة','دار نشر','أدب كويتي','رسم بالحبر','هوية الكتاب'];
const S13=`<section class="slide" id="s13">
 <div class="top"><span class="eyebrow">الاعتماد</span><span class="num">١٣ / ١٣</span></div>
 <div class="row" style="gap:56px;align-items:flex-start">
  <div style="flex:1">
   <h2 style="font-size:52px">من الفكرة إلى المطبعة</h2>
   <p class="lede" style="margin-bottom:30px;max-width:560px">أتولّى الكتاب كاملاً: <span class="wh">تصميم الغلاف</span>،
    و<span class="wh">التنضيد الداخلي</span>، وبناء شبكة الصفحة، وضبط النصّ العربيّ وتشكيله عند اللبس،
    والفهرسة والملاحق، وقراءة البروفة، وتسليم ملفّاتٍ جاهزةٍ للمطبعة.</p>
   <div class="specs">
    <div class="spec" style="width:50%"><b>الململ</b><span>خالد سالم السدّاني · ١٤٤٧ﻫ – ٢٠٢٦م</span></div>
    <div class="spec" style="width:50%"><b>١٧</b><span>فصلاً · وملحقان</span></div>
    <div class="spec" style="width:50%"><b>الغلاف + الداخل</b><span>نطاق العمل</span></div>
    <div class="spec" style="width:50%"><b>حيدر المعاتيق</b><span>تصميم وإخراج</span></div>
   </div>
   <div class="rule"></div>
   <p style="font-size:22px;line-height:1.9">
    المعرض الكامل: <span class="kw">haydarvsky.github.io/books</span><br>
    للطلبات: <span class="kw">واتساب <span dir="ltr">+966 56 756 5937</span></span></p>
  </div>
  <div style="flex:none;width:520px">
   <img class="shot" src="${F}" style="width:300px;height:450px;display:block;margin:0 0 30px auto" alt="غلاف كتاب الململ">
   <h3 style="margin-bottom:14px">كلماتٌ مفتاحيّة</h3>
   <div>${TAGS.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
  </div>
 </div>
</section>`;

const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${CSS}</style></head>
<body>${[S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12,S13].join('\n')}</body></html>`;
fs.writeFileSync(path.join(S,'slides.html'),html);
console.log('written',html.length);
