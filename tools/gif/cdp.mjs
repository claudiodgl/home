// Minimal Chrome DevTools Protocol driver (Node >= 22: global WebSocket + fetch).
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";

export async function launch({ port = 9333, width = 1280, height = 800, headless = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "cdp-"));
  const args = [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${width},${height}`,
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "about:blank"];
  if (headless) args.unshift("--headless=new");
  const proc = spawn(CHROME, args, { stdio: "ignore" });
  let ver;
  for (let i = 0; i < 60; i++) {
    try { ver = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (ver.length) break; } catch {}
    await sleep(250);
  }
  const page = ver.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  const api = {
    send,
    async goto(url, wait = 4000) { await send("Page.navigate", { url }); await sleep(wait); },
    async eval(expr) { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.text; },
    async shot(file, quality = 85) { const r = await send("Page.captureScreenshot", { format: "jpeg", quality }); writeFileSync(file, Buffer.from(r.result.data, "base64")); },
    async mouse(type, x, y) { await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: type === "mouseMoved" ? 0 : 1 }); },
    async click(x, y) { await api.mouse("mouseMoved", x, y); await api.mouse("mousePressed", x, y); await api.mouse("mouseReleased", x, y); },
    async wheel(x, y, dy) { await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY: dy }); },
    close() { try { ws.close(); } catch {} proc.kill(); },
  };
  return api;
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
