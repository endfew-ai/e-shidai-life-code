import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { calculateLifeNumber } from "../app.js";

test("digit reduction matches the original analyzer rule", () => {
  assert.equal(calculateLifeNumber("19950102"), 9);
  assert.equal(calculateLifeNumber("abc 29 xyz"), 2);
  assert.equal(calculateLifeNumber("000"), 0);
  assert.equal(calculateLifeNumber("no digits"), 0);
});

test("GitHub Pages entrypoint contains required public-use safeguards", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="zh-Hant-TW">/);
  assert.match(html, /e世代生命密碼分析儀/);
  assert.match(html, /所有計算只在你的瀏覽器內完成/);
  assert.match(html, /請勿輸入完整身分證號/);
  assert.match(html, /文化娛樂與自我反思用途/);
  assert.match(html, /https:\/\/endfew-ai\.github\.io\/e-shidai-life-code\/og\.png/);
  await Promise.all([
    access(new URL("../app.js", import.meta.url)),
    access(new URL("../styles.css", import.meta.url)),
    access(new URL("../og.png", import.meta.url)),
    access(new URL("../.nojekyll", import.meta.url)),
    access(new URL("../public/ai-modules/core-orbit.webp", import.meta.url)),
    access(new URL("../public/ai-modules/shadow-prism.webp", import.meta.url)),
    access(new URL("../public/ai-modules/wellbeing-flow.webp", import.meta.url)),
    access(new URL("../public/ai-modules/language-signal.webp", import.meta.url)),
  ]);
  assert.match(html, /ai-module-card core-module/);
  assert.match(html, /public\/ai-modules\/language-signal\.webp/);
});
