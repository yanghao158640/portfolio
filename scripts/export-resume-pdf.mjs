/**
 * 把 /resume 打印成一页纸 PDF
 * ---------------------------------------------------------------------------
 * 用无头 Edge 打开简历路由，按 CSS 里的 @page（A4 + 13mm/14mm 页边距）打印，
 * 产物直接写进 public/resume/，站点上的「下载简历 PDF」按钮指向它。
 *
 * 用法：
 *   1. 先起服务：npm run build && npm start -- -p 3001（或 npm run dev）
 *   2. 再导出：  npm run resume:pdf
 *
 * 想换地址（比如 dev 的 3000 端口）就带上环境变量：
 *   $env:RESUME_URL="http://localhost:3000/resume"; npm run resume:pdf
 *
 * 注意：简历页在屏幕上是「一张 A4 纸」，但 @page 只在打印媒体里生效 ——
 * 所以这里是真打印，不是截图。
 * ---------------------------------------------------------------------------
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.RESUME_URL || "http://localhost:3001/resume";
const OUT = resolve(process.cwd(), "public/resume/yangyuhao-resume.pdf");
const PORT = Number(process.env.PDF_PORT || 9333);

/** A4 = 210×297mm，换算成英寸 */
const A4 = { width: 8.27, height: 11.69 };

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const browser = BROWSERS.find((path) => existsSync(path));
if (!browser) {
  console.error("找不到 Edge / Chrome，请把浏览器可执行文件路径加进 BROWSERS。");
  process.exit(1);
}

/** 独立的用户目录：不打扰你正在用的浏览器，退出后也方便一起删掉 */
const userDataDir = join(tmpdir(), `resume-pdf-${Date.now()}`);

const child = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${PORT}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

const cleanup = () => {
  try {
    child.kill();
  } catch {
    /* 已经退出了就不用管 */
  }
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(1);
});

/** 等调试端口起来 */
let list = null;
for (let i = 0; i < 60; i++) {
  await sleep(250);
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await res.json();
    const page = targets.find(
      (t) => t.type === "page" && t.webSocketDebuggerUrl
    );
    if (page) {
      list = page;
      break;
    }
  } catch {
    /* 还没起来，接着等 */
  }
}
if (!list) {
  console.error(`无头浏览器没能在 ${PORT} 端口起来（端口被占用？换 PDF_PORT 试试）`);
  cleanup();
  process.exit(1);
}

const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
let loaded = false;
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (msg.method === "Page.loadEventFired") {
    loaded = true;
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");
// 关掉「减少动效」之类的系统偏好，免得样式跟着变
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
});

await send("Page.navigate", { url: URL });

for (let i = 0; i < 120 && !loaded; i++) await sleep(100);
if (!loaded) {
  console.error(`打不开 ${URL} —— 先把站点跑起来（npm start -- -p 3001）再导出。`);
  cleanup();
  process.exit(1);
}

// 中文字体落位之后再打印，否则可能套用回退字体
await evaluate("document.fonts.ready.then(() => true)");
await sleep(400);

const { result } = await send("Page.printToPDF", {
  printBackground: true,
  preferCSSPageSize: true,
  paperWidth: A4.width,
  paperHeight: A4.height,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
});

if (!result?.data) {
  console.error("打印失败：", JSON.stringify(result).slice(0, 300));
  cleanup();
  process.exit(1);
}

const pdf = Buffer.from(result.data, "base64");
const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, pdf);

// 一页纸是目标，多了就是排版溢出了，得回 resume.css 收一收
if (pages > 1) {
  console.warn(
    `⚠ 打印出 ${pages} 页 —— 一页纸简历溢出了，去 app/resume/resume.css 压一压行距或删点内容。`
  );
}

console.log(`✓ ${pages} 页 · ${(pdf.length / 1024).toFixed(0)} KB`);
console.log(`  写入 ${OUT}`);

ws.close();
cleanup();
process.exit(0);