import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub Pages entrypoint is numerology-first with three isolated modes and safeguards", async () => {
  const [html, appSource, styles] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../app.js", import.meta.url), "utf8"),
    readFile(new URL("../styles.css", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<html lang="zh-Hant-TW">/);
  assert.match(html, /生日命碼/);
  assert.match(html, /數字頻譜/);
  assert.match(html, /三數取卦/);
  assert.match(html, /本卦、互卦、動爻與變卦/);
  assert.ok(html.indexOf("生日命碼") < html.indexOf("三數取卦"));
  assert.match(html, /看見你的/);
  assert.match(html, /數字軌跡/);
  assert.match(html, /所有資料只在本機處理/);
  assert.match(html, /不是科學人格測驗/);
  assert.match(html, /不會由生日自動起卦/);
  assert.match(html, /https:\/\/endfew-ai\.github\.io\/e-shidai-life-code\/og-b-v3\.png/);
  assert.match(html, /hero-brush-title-b-v3\.webp/);
  assert.match(html, /birthday-panel-b-v3\.webp/);
  assert.doesNotMatch(html, /birth-orbit-b-v2\.webp/);
  assert.match(html, /<link rel="icon" href="public\/favicon\.svg"/);
  assert.match(appSource, /from "\.\/calculator-core\.js"/);
  assert.match(appSource, /from "\.\/iching-text\.js"/);
  assert.match(appSource, /只列原文，不解卦/);
  assert.doesNotMatch(appSource, /const profiles\s*=/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /[—–]/);

  await Promise.all([
    access(new URL("../app.js", import.meta.url)),
    access(new URL("../calculator-core.js", import.meta.url)),
    access(new URL("../styles.css", import.meta.url)),
    access(new URL("../iching-text.js", import.meta.url)),
    access(new URL("../og-b-v3.png", import.meta.url)),
    access(new URL("../public/og-b-v3.png", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
    access(new URL("../.nojekyll", import.meta.url)),
    access(new URL("../public/ai-modules/core-orbit.webp", import.meta.url)),
    access(new URL("../public/ai-modules/shadow-prism.webp", import.meta.url)),
    access(new URL("../public/ai-modules/wellbeing-flow.webp", import.meta.url)),
    access(new URL("../public/ai-modules/language-signal.webp", import.meta.url)),
    access(new URL("../public/visuals/hero-brush-title-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/birthday-panel-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/digit-spectrum-panel-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/numerology-result-panel-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/iching-instrument-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/iching-manuscript-b-v3.webp", import.meta.url)),
    access(new URL("../AI_MODULE_PROMPTS.md", import.meta.url)),
  ]);
});
