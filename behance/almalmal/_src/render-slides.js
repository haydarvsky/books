const { chromium } = require('playwright');
const path=require('path');
const S=__dirname;
const OUT=path.resolve(__dirname,'../slides');
const names=['01-cover-hero','02-full-jacket-flat','03-cover-anatomy','04-cover-grid','05-palette-stock',
 '06-spine-back','07-interior-spread','08-page-grid','09-type-hierarchy','10-chapter-dividers',
 '11-plates','12-toc-appendix','13-credits'];
(async()=>{
 const fs=require('fs');
 const PINNED='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
 const opts={args:['--no-sandbox','--allow-file-access-from-files','--force-color-profile=srgb']};
 if(fs.existsSync(PINNED)) opts.executablePath=PINNED;   // بيئة كلود؛ وإلّا يستعمل متصفّح بلايرايت الافتراضي
 const b=await chromium.launch(opts);
 const p=await b.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:2});
 await p.goto('file://'+S+'/slides.html',{waitUntil:'load'});
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForTimeout(1200);
 for(let i=0;i<names.length;i++){
   const el=await p.$('#s'+(i+1));
   const box=await el.boundingBox();
   await el.screenshot({path:`${OUT}/${names[i]}.jpg`,type:'jpeg',quality:90});
   console.log(names[i], Math.round(box.width)+'x'+Math.round(box.height));
 }
 await b.close();
})();
