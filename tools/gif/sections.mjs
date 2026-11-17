// Screenshot page sections: node sections.mjs <url> <outDir> <theme> [width]
import { launch, sleep } from "./cdp.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const [url, out, theme = "dark", width = "1400"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await launch({ width: +width, height: 900, port: 9340 + (theme === "light" ? 1 : 0) + (+width < 800 ? 2 : 0) });
await b.goto(url + (url.includes("?") ? "&" : "?") + "theme=" + theme, 6000);
const ids = ["top", "demos", "tep", "grants", "publications", "events"];
for (const id of ids) {
  const r = JSON.parse(await b.eval(`(()=>{const e=${id === "top" ? "document.querySelector('.hero')" : `document.getElementById('${id}')`};e.scrollIntoView();const r=e.getBoundingClientRect();return JSON.stringify({x:0,y:r.top+scrollY,w:innerWidth,h:Math.min(r.height,2400)})})()`));
  await sleep(id === "publications" ? 2500 : 900);
  const res = await b.send("Page.captureScreenshot", { format: "jpeg", quality: 80, captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${out}/${theme}_${width}_${id}.jpg`, Buffer.from(res.result.data, "base64"));
}
b.close();
