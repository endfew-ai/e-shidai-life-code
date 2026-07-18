import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
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
  assert.match(html, /分析生日命碼/);
  assert.match(html, /所有資料只在本機處理/);
  assert.match(html, /看見你的/);
  assert.match(html, /數字軌跡/);
  assert.match(html, /文化娛樂與自我反思用途/);
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
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
