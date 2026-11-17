// Zoomed captures of one element over time: node zoomtile.mjs <url> <selector> <outPrefix> <theme>
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
const [url, sel, out, theme = "dark"] = process.argv.slice(2);
const b = await launch({ width: 1400, height: 900, port: 9380 });
await b.goto(url + "?theme=" + theme, 4000);
for (let i = 0; i < 3; i++) {
  const r = JSON.parse(await b.eval(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return JSON.stringify({x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height})})()`));
  const s = await b.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 4 } });
  writeFileSync(`${out}_${i}.png`, Buffer.from(s.result.data, "base64"));
  await sleep(900);
}
b.close();
