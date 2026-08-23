const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.goto('file:///home/user/books/');
  const out = await p.evaluate(async () => {
    function load(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
    async function ctxOf(src){const img=await load(src);const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);return {x,w:img.width,h:img.height};}
    const hex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
    const res={pages:{}};
    for (const name of ['p03-l','p04-l','p04-r','p08-r']) {
      const {x,w,h}=await ctxOf(`images/bmt336b7r/${name}-mt338th9.jpg`);
      const img=x.getImageData(0,0,w,h).data;
      const rowInk=new Array(h).fill(0), colInk=new Array(w).fill(0);
      for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4; if(img[i]<140){rowInk[yy]++;colInk[xx]++;}}
      const fi=a=>a.findIndex(v=>v>1), li=a=>a.length-1-[...a].reverse().findIndex(v=>v>1);
      const bands=[]; let s=null;
      for(let yy=0;yy<h;yy++){ if(rowInk[yy]>2){ if(s===null)s=yy; } else { if(s!==null){ if(yy-s>6) bands.push([s,yy]); s=null; } } }
      if(s!==null)bands.push([s,h]);
      const starts=bands.map(bb=>bb[0]); const gaps=[];
      for(let i=1;i<starts.length;i++)gaps.push(starts[i]-starts[i-1]);
      const g2=[...gaps].sort((a,b)=>a-b);
      res.pages[name]={w,h,left:fi(colInk),right:li(colInk),top:fi(rowInk),bottom:li(rowInk),
        mL:+(fi(colInk)/w*100).toFixed(1), mR:+((w-li(colInk))/w*100).toFixed(1),
        mT:+(fi(rowInk)/h*100).toFixed(1), mB:+((h-li(rowInk))/h*100).toFixed(1),
        measure:+((li(colInk)-fi(colInk))/w*100).toFixed(1),
        nBands:bands.length, medPitch:g2.length?g2[Math.floor(g2.length/2)]:null, gaps};
    }
    // cover colours: paper (mode), ink (darkest 1%), hatch grey
    {
      const {x,w,h}=await ctxOf('images/bmt336b7r/front-mt338th9.jpg');
      const d=x.getImageData(0,0,w,h).data;
      const map=new Map(); let dark=[0,0,0,0];
      const lums=[];
      for(let i=0;i<d.length;i+=4*11){
        const r=d[i],g=d[i+1],bl=d[i+2];
        const k=(r>>2<<12)|(g>>2<<6)|(bl>>2);
        map.set(k,(map.get(k)||0)+1);
        const L=0.299*r+0.587*g+0.114*bl; lums.push(L);
        if(L<60){dark[0]+=r;dark[1]+=g;dark[2]+=bl;dark[3]++;}
      }
      const [k0]=[...map.entries()].sort((a,b)=>b[1]-a[1])[0];
      res.coverPaper=hex((k0>>12&63)<<2,(k0>>6&63)<<2,(k0&63)<<2);
      res.coverInk=dark[3]?hex(dark[0]/dark[3],dark[1]/dark[3],dark[2]/dark[3]):null;
      // hatch mid-tone: average of pixels in ground band
      let a=[0,0,0,0];
      for(let yy=Math.round(h*0.86);yy<Math.round(h*0.95);yy++)for(let xx=0;xx<w;xx+=3){const i=(yy*w+xx)*4;a[0]+=d[i];a[1]+=d[i+1];a[2]+=d[i+2];a[3]++;}
      res.coverGroundAvg=hex(a[0]/a[3],a[1]/a[3],a[2]/a[3]);
      // ink coverage on cover
      let ink=0,tot=0;
      for(let i=0;i<d.length;i+=4*7){tot++;const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];if(L<200)ink++;}
      res.coverInkCoveragePct=+(ink/tot*100).toFixed(1);
    }
    return res;
  });
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
