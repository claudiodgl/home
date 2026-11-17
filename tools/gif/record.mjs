// Record demo frames: node record.mjs <zigzag|lnv|forest> <outDir>
// Frames are written as NNN_<durationMs>.jpg; make_gifs.py assembles them.
import { launch, sleep } from "./cdp.mjs";
import { mkdirSync } from "node:fs";
const [which, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let n = 0;
const shot = async (b, dur) => b.shot(`${out}/${String(n++).padStart(3, "0")}_${dur}.jpg`);
const dbl = async (b, x, y) => {
  await b.mouse("mouseMoved", x, y);
  for (const c of [1, 2]) {
    await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: c });
    await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: c });
  }
};
// smooth pointer glide with a frame every step
const glide = async (b, x0, y0, x1, y1, steps, dur) => {
  for (let i = 1; i <= steps; i++) { await b.mouse("mouseMoved", x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await sleep(120); await shot(b, dur); }
};

if (which === "zigzag") {
  const b = await launch({ width: 1280, height: 760, port: 9361 });
  await b.goto("https://claudiodgl.github.io/ZigzagNetVis/", 7000);
  const set = (id, i) => b.eval(`(()=>{const s=document.getElementById('${id}');s.selectedIndex=${i};s.dispatchEvent(new Event('change',{bubbles:true}));return s.value})()`);
  await shot(b, 1000);
  await glide(b, 150, 330, 1100, 330, 6, 160);                  // hover sweep across the barcode
  for (let i = 0; i < 2; i++) { await b.wheel(470, 400, -200); await sleep(400); await shot(b, 260); }   // zoom in on the dense part
  await glide(b, 330, 400, 620, 395, 4, 180);                   // hover while zoomed
  await dbl(b, 470, 400); await sleep(2500); await shot(b, 1600); // open node-link diagrams for this timeslice
  await dbl(b, 560, 405); await sleep(2500); await shot(b, 1600);
  await b.eval(`document.getElementById('reset-btn').click()`); await sleep(1500); await shot(b, 600);
  await b.click(160, 69); await sleep(600);                     // select by connected component
  for (const [x, y] of [[300, 400], [700, 380]]) { await b.mouse("mouseMoved", x, y); await sleep(300); await b.click(x, y); await sleep(1300); await shot(b, 1100); }
  await b.click(28, 69); await sleep(400);                      // back to select by label
  await set("dataset-select", 1); await sleep(3000); await b.mouse("mouseMoved", 1270, 750); await shot(b, 1200);
  await glide(b, 200, 300, 1000, 330, 4, 170);
  await set("dataset-select", 0); await sleep(3000); await b.mouse("mouseMoved", 1270, 750); await shot(b, 900);
  b.close();
} else if (which === "lnv") {
  const b = await launch({ width: 1440, height: 810, port: 9362 });
  await b.goto("https://claudiodgl.github.io/LargeNetVis/", 6000);
  await b.eval(`(()=>{document.querySelector('input[value=hospital]').checked=true;document.getElementById('submitForm').click();return 1})()`);
  await sleep(4000); await b.eval(`document.getElementById('submitSampling').click()`); await sleep(9000);
  await b.eval(`typeof closeNav==='function'&&closeNav()`); await sleep(1200);
  await shot(b, 1100);
  for (const [x, y] of [[148, 375], [207, 333], [207, 375]]) { await b.click(x, y); await sleep(1300); await shot(b, 1100); }   // taxonomy matrix cells
  for (const [x, y] of [[722, 290], [776, 399], [830, 344], [613, 344]]) {                                                     // communities in the global view
    await b.mouse("mouseMoved", x, y); await sleep(500); await shot(b, 400);
    await b.click(x, y); await sleep(2500); await shot(b, 1400);
  }
  b.close();
} else if (which === "forest") {
  const b = await launch({ headless: false, port: 9335, width: 1280, height: 760 });
  await b.goto("https://benpowley.github.io/ForestVis-Demo/", 90000);
  await shot(b, 1000);
  for (let i = 0; i < 14; i++) { await b.wheel(640, 420, -240); await sleep(350); await shot(b, 170); }
  await b.mouse("mouseMoved", 640, 420); await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 640, y: 420, button: "left", clickCount: 1 });
  for (let i = 1; i <= 10; i++) { await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 640 - i * 14, y: 420 - i * 4, button: "left", buttons: 1 }); await sleep(150); await shot(b, 170); }
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 500, y: 380, button: "left", clickCount: 1 });
  await sleep(500); await shot(b, 1400);
}
