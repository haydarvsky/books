const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.goto('file:///home/user/books/');
  const out = await p.evaluate(async () => {
    function load(src){return new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=src;});}
    async function ctxOf(src){const img=await load(src);const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);return {x,w:img.width,h:img.height};}
    const {x,w,h}=await ctxOf('images/bmt336b7r/front-mt338th9.jpg');
    const d=x.getImageData(0,0,w,h).data;
    const row=new Array(h).fill(0);
    for(let yy=0;yy<h;yy++){let c=0;for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4;const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];if(L<170)c++;}row[yy]=c;}
    // type block = top 45% ink bands
    const bands=[];let s=null;
    for(let yy=0;yy<Math.round(h*0.45);yy++){if(row[yy]>3){if(s===null)s=yy;}else{if(s!==null){if(yy-s>5)bands.push([s,yy,+(s/h*100).toFixed(1),+(yy/h*100).toFixed(1)]);s=null;}}}
    // horizon: first row below 60% where ink jumps strongly and stays
    let horizon=null;
    for(let yy=Math.round(h*0.6);yy<h;yy++){ if(row[yy]>w*0.55){horizon=yy;break;} }
    // widest ink row in type area (title extent)
    let titleRow=0,best=0;
    for(let yy=Math.round(h*0.18);yy<Math.round(h*0.32);yy++){if(row[yy]>best){best=row[yy];titleRow=yy;}}
    let l=0,r=w-1;
    for(let xx=0;xx<w;xx++){const i=(titleRow*w+xx)*4;const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];if(L<170){l=xx;break;}}
    for(let xx=w-1;xx>=0;xx--){const i=(titleRow*w+xx)*4;const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];if(L<170){r=xx;break;}}
    // ink density by horizontal band (10 bands)
    const dens=[];
    for(let k=0;k<10;k++){let c=0,t=0;for(let yy=Math.round(h*k/10);yy<Math.round(h*(k+1)/10);yy+=2)for(let xx=0;xx<w;xx+=2){t++;const i=(yy*w+xx)*4;const L=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];if(L<200)c++;}dens.push(+(c/t*100).toFixed(1));}
    return {w,h,typeBands:bands,horizonY:horizon,horizonPct:horizon?+(horizon/h*100).toFixed(1):null,
      titleRow,titleLeftPct:+(l/w*100).toFixed(1),titleRightPct:+(r/w*100).toFixed(1),titleWidthPct:+((r-l)/w*100).toFixed(1),
      inkDensityByTenth:dens};
  });
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
