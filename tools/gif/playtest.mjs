import { launch, sleep } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
const [url, out] = process.argv.slice(2);
const b = await launch({ width: 1400, height: 900, port: 9392 });
await b.goto(url, 4500);
await b.eval(`window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));document.getElementById('netStage').scrollIntoView({block:'center'});1`);
await sleep(400);
const r = JSON.parse(await b.eval(`(()=>{const r=document.getElementById('netStage').getBoundingClientRect();return JSON.stringify({x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height})})()`));
await b.eval(`document.getElementById('netPlay').click()`);
for (const [i, t] of [[0, 900], [1, 3200], [2, 6500], [3, 10500]].entries ? [[0, 900], [1, 2300], [2, 3300], [3, 4200]] : []) {
  await sleep(t);
  const s = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 70, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: .55 } });
  writeFileSync(`${out}_${i}.jpg`, Buffer.from(s.result.data, "base64"));
  console.log(i, await b.eval(`document.getElementById('netYearLbl').textContent+' '+document.querySelector('#netSvg line[stroke-width]')?.getAttribute('stroke-width')`));
}
console.log("errors", await b.eval(`JSON.stringify(__errs)`));
b.close();
