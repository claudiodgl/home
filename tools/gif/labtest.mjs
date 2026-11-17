// Hovers every co-author and counts overlapping visible name labels; screenshots the hover with the most labels.
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
const [url, out, w = "1280"] = process.argv.slice(2);
const b = await launch({ width: +w, height: 900, port: 9394 });
await b.goto(url, 5000);
await b.eval(`document.getElementById('netStage').scrollIntoView({block:'center'});1`);
await sleep(600);
const res = await b.eval(`(async()=>{
  const ov=()=>{const L=[...document.querySelectorAll('#netSvg text')].filter(t=>t.style.opacity>0&&t.closest('g')!==document.querySelector('#netSvg g'));
    const bb=L.filter(t=>+getComputedStyle(t).opacity>0).map(t=>t.getBBox());let n=0;
    for(let i=0;i<bb.length;i++)for(let j=i+1;j<bb.length;j++){const a=bb[i],c=bb[j];if(a.x<c.x+c.width&&c.x<a.x+a.width&&a.y<c.y+c.height&&c.y<a.y+a.height)n++}
    return [bb.length,n]};
  const out=[["none",...ov()]];const nd=[...document.querySelectorAll('#netSvg .nd')];
  for(const g of nd){g.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false,clientX:10,clientY:10}));await new Promise(r=>setTimeout(r,30));
    out.push([g.__data__.name,...ov()]);g.dispatchEvent(new MouseEvent('mouseleave'));}
  return JSON.stringify(out)})()`);
const arr = JSON.parse(res);
const bad = arr.filter(a => a[2] > 0);
console.log("hovers:", arr.length, "with overlaps:", bad.length, JSON.stringify(bad.slice(0, 8)));
const top = arr.slice(1).sort((a, c) => c[1] - a[1])[0];
console.log("most labels:", top);
await b.eval(`(()=>{const g=[...document.querySelectorAll('#netSvg .nd')].find(g=>g.__data__.name===${JSON.stringify(top[0])});g.dispatchEvent(new MouseEvent('mouseenter',{clientX:10,clientY:10}));})()`);
await sleep(300);
const r = JSON.parse(await b.eval(`(()=>{const r=document.getElementById('netSvg').getBoundingClientRect();return JSON.stringify({x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height})})()`));
const s = await b.send("Page.captureScreenshot", { format: "png", clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
writeFileSync(out, Buffer.from(s.result.data, "base64"));
b.close();
