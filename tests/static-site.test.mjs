import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub Pages entrypoint contains all three isolated modes and safeguards", async () => {
  const [html, appSource] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../app.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<html lang="zh-Hant-TW">/);
  assert.match(html, /生日命碼/);
  assert.match(html, /數字頻譜/);
  assert.match(html, /三數取卦/);
  assert.match(html, /本卦、互卦、動爻與變卦/);
  assert.match(html, /所有計算只在你的瀏覽器內完成/);
  assert.match(html, /不是科學人格測驗/);
  assert.match(html, /不會拿西元生日直接假造傳統卦象/);
  assert.match(html, /https:\/\/endfew-ai\.github\.io\/e-shidai-life-code\/og\.png/);
  assert.match(appSource, /from "\.\/calculator-core\.js"/);
  assert.doesNotMatch(appSource, /const profiles\s*=/);

  await Promise.all([
    access(new URL("../app.js", import.meta.url)),
    access(new URL("../calculator-core.js", import.meta.url)),
    access(new URL("../styles.css", import.meta.url)),
    access(new URL("../og.png", import.meta.url)),
    access(new URL("../.nojekyll", import.meta.url)),
    access(new URL("../public/ai-modules/core-orbit.webp", import.meta.url)),
    access(new URL("../public/ai-modules/shadow-prism.webp", import.meta.url)),
    access(new URL("../public/ai-modules/wellbeing-flow.webp", import.meta.url)),
    access(new URL("../public/ai-modules/language-signal.webp", import.meta.url)),
  ]);
});
