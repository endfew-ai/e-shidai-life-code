import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Traditional Chinese product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="zh-Hant-TW"/i);
  assert.match(html, /<title>e世代生命密碼分析儀<\/title>/i);
  assert.match(html, /生日命碼/);
  assert.match(html, /數字頻譜/);
  assert.match(html, /三數取卦/);
  assert.match(html, /邵康節易學/);
  assert.match(html, /分析生日命碼/);
  assert.match(html, /所有分析輸入只在本機處理/);
  assert.match(html, /看見你的/);
  assert.match(html, /數字軌跡/);
  assert.match(html, /Cheiro 原書色彩章/);
  assert.match(html, /HEX 為本站數位轉譯/);
  assert.match(html, /本站延伸/);
  assert.match(html, /archive\.org\/details\/in\.ernet\.dli\.2015\.70770/);
  assert.match(html, /文化娛樂與自我反思用途/);
  assert.match(html, /累積造訪/);
  assert.match(html, /受保護模式・需密碼/);
  assert.match(html, /iching-access-password-react/);
  assert.match(html, /不包含上述輸入內容/);
  assert.doesNotMatch(html, /科學證明|科學認證|保證改運|保證帶來/);
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("server-renders the complete Shao Kangjie route", async () => {
  const response = await render("/kangjie");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>邵康節易學｜象數觀物<\/title>/);
  assert.match(html, /象數觀物/);
  assert.match(html, /康節觀象/);
  assert.match(html, /原典脈絡/);
  assert.match(html, /年月日時/);
  assert.match(html, /雙段聲數/);
  assert.match(html, /十一字以上/);
  assert.match(html, /皇極尺度/);
  assert.match(html, /原文來源/);
  assert.match(html, /現行傳本/);
  assert.match(html, /不是科學宇宙週期/);
  assert.match(html, /PRIVATE ACCESS・專頁存取/);
  assert.match(html, /type="password"/);
  assert.match(html, /驗證後進入/);
  assert.doesNotMatch(html, developmentPreviewMeta);
});

test("removes all disposable starter markers", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(page, /inputMode="numeric"/);
  assert.match(page, /type="date"/);
  assert.match(page, /生日命碼完全分開/);
  assert.match(page, /calculateIChing/);
  assert.match(page, /getIChingText/);
  assert.match(page, /只列原文，不解卦/);
});
