// Tap the portrait under touch emulation and sample the orbit angle to measure its speed.
import { launch, sleep } from "./cdp.mjs";
const b = await launch({ width: 390, height: 844, port: 9394 });
await b.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await b.send("Emulation.setTouchEmulationEnabled", { enabled: true });
await b.goto(process.argv[2], 4000);
const ang = () => b.eval(`parseFloat((document.querySelector('.orbit').style.transform||'rotate(0deg)').slice(7))`);
const speed = async () => { const a = await ang(); await sleep(500); const c = await ang(); return (((c - a) % 360) + 360) % 360 * 2; };
console.log("idle deg/s", (await speed()).toFixed(1));
const r = JSON.parse(await b.eval(`(()=>{const r=document.querySelector('.portrait').getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2})})()`));
await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.x, y: r.y }] });
await sleep(60);
await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await sleep(400);
console.log("after tap deg/s", (await speed()).toFixed(1));
await sleep(3500);
console.log("4 s later deg/s", (await speed()).toFixed(1));
b.close();
