// Dump interactive controls of a page: node explore.mjs <url> [waitMs]
import { launch } from "./cdp.mjs";
const [url, wait = "6000"] = process.argv.slice(2);
const b = await launch();
await b.goto(url, +wait);
const out = await b.eval(`JSON.stringify([...document.querySelectorAll('button,select,input,[role=button],a.btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).slice(0,60).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,cls:(e.className&&e.className.baseVal===undefined?e.className:'').slice(0,40),txt:(e.innerText||e.value||e.title||e.getAttribute('aria-label')||'').trim().slice(0,30),opts:e.tagName==='SELECT'?[...e.options].map(o=>o.text).slice(0,8):undefined,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}}))`);
console.log(out);
b.close();
