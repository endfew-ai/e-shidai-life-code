import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const mainFixedBrushAssets = [
  "title-calculation-explain-v2.webp",
  "title-grid-birthday-v2.webp",
  "title-grid-code-v2.webp",
  "title-insight-core-v2.webp",
  "title-insight-pressure-v2.webp",
  "title-insight-care-v2.webp",
  "title-insight-communication-v2.webp",
  "title-self-question-v2.webp",
  "title-color-guide-v1.webp",
  "title-judgment-v2.webp",
  "title-tuan-v2.webp",
  "title-image-saying-v2.webp",
  "title-six-lines-v2.webp",
];

const kangjieFixedBrushAssets = [
  "title-kangjie-overview-entry-v2.webp",
  "title-kangjie-overview-layers-v2.webp",
  "title-kangjie-overview-scale-v2.webp",
  "title-kangjie-origin-sequence-v2.webp",
  "title-kangjie-origin-calendar-v2.webp",
  "title-kangjie-origin-boundaries-v2.webp",
  "title-kangjie-origin-duration-v2.webp",
  "title-kangjie-method-calendar-v2.webp",
  "title-kangjie-method-object-v2.webp",
  "title-kangjie-method-sound-v2.webp",
  "title-kangjie-method-text-v2.webp",
  "title-kangjie-form-calendar-v2.webp",
  "title-kangjie-form-object-v2.webp",
  "title-kangjie-form-sound-v2.webp",
  "title-kangjie-form-text-v2.webp",
  "title-hex-original-v2.webp",
  "title-hex-mutual-v2.webp",
  "title-hex-changed-v2.webp",
  "title-kangjie-classic-v2.webp",
  "title-moving-line-v2.webp",
  "title-changed-text-v2.webp",
  "title-kangjie-tab-source-v2.webp",
];

test("GitHub Pages entrypoint is numerology-first with three analyzers and a separate Shao Kangjie option", async () => {
  const [html, appSource, reactSource, styles, coreSource, typeSource, serviceSource, serviceTypes, advancedSource] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../app.js", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../styles.css", import.meta.url), "utf8"),
    readFile(new URL("../calculator-core.js", import.meta.url), "utf8"),
    readFile(new URL("../calculator-core.d.ts", import.meta.url), "utf8"),
    readFile(new URL("../site-services.js", import.meta.url), "utf8"),
    readFile(new URL("../site-services.d.ts", import.meta.url), "utf8"),
    readFile(new URL("../application/advanced-workspace.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /<html lang="zh-Hant-TW"[^>]*>/);
  assert.match(html, /生日命碼/);
  assert.match(html, /數字頻譜/);
  assert.match(html, /三數取卦/);
  assert.match(html, /邵康節易學/);
  assert.match(html, /href="kangjie\.html"/);
  assert.match(html, /本卦、互卦、動爻與變卦/);
  assert.ok(html.indexOf('value="birthday"') < html.indexOf('value="iching"'));
  assert.match(html, /看見你的/);
  assert.match(html, /數字軌跡/);
  assert.match(html, /所有分析輸入只在本機處理/);
  assert.match(html, /不是科學人格測驗/);
  assert.match(html, /不會由生日或身分證自動起卦/);
  assert.match(html, /https:\/\/endfew-ai\.github\.io\/e-shidai-life-code\/og-life-numerology-aaa-v1\.png/);
  assert.match(html, /hero-celestial-aaa-v1\.webp/);
  assert.match(html, /title-hero-web-v1\.webp/);
  assert.doesNotMatch(html, /hero-brush-title-b-v3\.webp/);
  assert.match(html, /life-path-instrument-aaa-v1\.webp/);
  assert.match(html, /brand-life-numerology-aaa-web-v1\.webp/);
  assert.match(html, /data-ui="xuanxing-aaa"/);
  assert.match(html, /class="trust-rail"/);
  assert.match(html, /public\/ai-modules\/core-orbit\.webp/);
  assert.match(html, /public\/ai-modules\/language-signal\.webp/);
  assert.match(html, /public\/ai-modules\/shadow-prism\.webp/);
  assert.match(html, /public\/ai-modules\/wellbeing-flow\.webp/);
  assert.match(html, /theme-xuanxing-web-v1\.webp/);
  assert.match(html, /title-birthday-web-v1\.webp/);
  assert.match(html, /title-spectrum-web-v1\.webp/);
  assert.match(html, /title-iching-web-v1\.webp/);
  assert.match(html, /title-kangjie-entry-web-v1\.webp/);
  assert.match(html, /title-rules-web-v1\.webp/);
  assert.match(html, /title-source-web-v1\.webp/);
  assert.match(html, /title-disclaimer-web-v1\.webp/);
  assert.match(html, /Cheiro 原書色彩章/);
  assert.match(html, /archive\.org\/details\/in\.ernet\.dli\.2015\.70770\/page\/n137/);
  assert.match(html, /HEX 為本站數位轉譯/);
  assert.match(html, /不是科學個人色彩診斷/);
  assert.match(html, /id="iching-access-dialog"/);
  assert.match(html, /id="iching-access-password"/);
  assert.match(html, /data-iching-access-message/);
  assert.match(html, /瀏覽器端簡易入口鎖/);
  assert.match(html, /data-visit-counter/);
  assert.match(html, /累積造訪/);
  assert.match(html, /不包含任何分析輸入/);
  assert.match(html, /id="numerology-workspace"/);
  assert.match(appSource, /mountNumerologyWorkspace/);
  assert.match(reactSource, /mountNumerologyWorkspace/);
  assert.match(reactSource, /href="\/kangjie"/);
  assert.match(reactSource, /href="\/kangjie#sources"/);
  assert.doesNotMatch(reactSource, /href="\/kangjie\.html/);
  assert.match(appSource, /title-insight-v5\.webp/);
  assert.match(reactSource, /title-insight-v5\.webp/);
  for (const asset of mainFixedBrushAssets) {
    assert.ok(appSource.includes(asset), `${asset} must be referenced by the static application`);
    assert.ok(reactSource.includes(asset), `${asset} must be referenced by the React application`);
  }
  assert.match(html, /<span class="sr-only">看見你的數字軌跡<\/span><img class="brush-title-image" src="public\/visuals\/brush\/title-hero-web-v1\.webp"/);
  assert.match(html, /<span class="sr-only">方法與本文來源<\/span><img class="brush-title-image" src="public\/visuals\/brush\/title-source-web-v1\.webp"/);
  assert.match(html, /<span class="sr-only">使用提醒<\/span><img class="brush-title-image" src="public\/visuals\/brush\/title-disclaimer-web-v1\.webp"/);
  assert.match(appSource, /brushTitleElement\("public\/visuals\/brush\/title-insight-v5\.webp", "把結果變成可觀察的問題"/);
  assert.match(appSource, /function createBirthdayColorGuide\(result\)/);
  assert.match(appSource, /data-personal-color-guide/);
  assert.match(reactSource, /function BirthdayColorGuide/);
  assert.match(reactSource, /data-personal-color-guide/);
  assert.match(appSource, /from "\.\/site-services\.js"/);
  assert.match(reactSource, /from "\.\.\/site-services\.js"/);
  assert.match(appSource, /isIChingAccessCode/);
  assert.match(reactSource, /isIChingAccessCode/);
  assert.match(appSource, /loadCumulativeVisitCount/);
  assert.match(reactSource, /loadCumulativeVisitCount/);
  assert.match(serviceSource, /ICHING_ACCESS_CODE = "0000"/);
  assert.match(serviceSource, /VISIT_COUNTER_ENDPOINT/);
  assert.match(serviceSource, /credentials: "omit"/);
  assert.match(serviceSource, /referrerPolicy: "no-referrer"/);
  assert.match(serviceTypes, /loadCumulativeVisitCount/);
  assert.match(advancedSource, /命格數列與人生階段分流/);
  assert.match(advancedSource, /命格分析只移除這個補位 0/);
  assert.match(advancedSource, /buildTimelineStageInsight/);
  assert.match(advancedSource, /全部展開/);
  assert.match(advancedSource, /前段轉接/);
  assert.match(styles, /\.timeline-stage-panel/);
  assert.match(styles, /@media \(max-width: 360px\)/);
  assert.doesNotMatch(advancedSource, /官方資料|尚未設定演算規則|schema\.gov\.tw|gazette\.nat\.gov\.tw/);
  assert.match(appSource, /result\.kind === "birthday"[^\n]*createBirthdayColorGuide\(result\)/);
  assert.match(reactSource, /result\.kind === "birthday" && <BirthdayColorGuide result=\{result\}/);
  assert.match(coreSource, /export const CHEIRO_BIRTH_COLOR_PALETTES/);
  assert.match(coreSource, /export function getCheiroColorGuide/);
  assert.match(coreSource, /export function buildBirthdayColorGuide/);
  assert.match(typeSource, /colorGuide: BirthdayColorGuide/);
  assert.match(typeSource, /CHEIRO_BIRTH_COLOR_PALETTES/);
  assert.doesNotMatch(`${html}\n${appSource}\n${reactSource}`, /科學證明|科學認證|保證改運|保證帶來/);
  assert.doesNotMatch(html, /<h2>方法與本文來源<\/h2>/);
  assert.doesNotMatch(html, /<h2 id="disclaimer-title">使用提醒<\/h2>/);
  assert.doesNotMatch(html, /birth-orbit-b-v2\.webp/);
  assert.match(html, /<link rel="icon" href="public\/favicon\.svg"/);
  assert.match(appSource, /from "\.\/calculator-core\.js"/);
  assert.match(appSource, /from "\.\/iching-text\.js"/);
  assert.match(appSource, /只列原文，不解卦/);
  assert.doesNotMatch(appSource, /const profiles\s*=/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /\.personal-color-guide/);
  assert.match(styles, /\.color-role-list \{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 560px\)[\s\S]*\.color-role-list \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /\u9577\u8F29\u95B1\u8B80\u53CB\u5584\u5B57\u7D1A/);
  assert.match(styles, /\.classic-columns p[^}]*font-size: 18px/s);
  assert.doesNotMatch(html, /[—–]/);

  await Promise.all([
    access(new URL("../app.js", import.meta.url)),
    access(new URL("../calculator-core.js", import.meta.url)),
    access(new URL("../styles.css", import.meta.url)),
    access(new URL("../iching-text.js", import.meta.url)),
    access(new URL("../site-services.js", import.meta.url)),
    access(new URL("../site-services.d.ts", import.meta.url)),
    access(new URL("../og-life-numerology-aaa-v1.png", import.meta.url)),
    access(new URL("../public/og-life-numerology-aaa-v1.png", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
    access(new URL("../.nojekyll", import.meta.url)),
    access(new URL("../public/ai-modules/core-orbit.webp", import.meta.url)),
    access(new URL("../public/ai-modules/shadow-prism.webp", import.meta.url)),
    access(new URL("../public/ai-modules/wellbeing-flow.webp", import.meta.url)),
    access(new URL("../public/ai-modules/language-signal.webp", import.meta.url)),
    access(new URL("../public/visuals/hero-celestial-background-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/birthday-panel-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/digit-spectrum-panel-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/numerology-result-panel-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/iching-instrument-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/iching-manuscript-b-v3.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/theme-xuanxing-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/hero-celestial-aaa-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/life-path-instrument-aaa-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/brand-life-numerology-aaa-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/brand-life-numerology-aaa-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/theme-xuanxing-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-hero-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-birthday-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-spectrum-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-iching-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-entry-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-rules-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-source-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-disclaimer-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-workspace-web-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/brand-life-code-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-birthday-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-spectrum-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-iching-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-entry-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-result-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-classic-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-rules-v4.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-hero-v5.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-insight-v5.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-source-v5.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-disclaimer-v5.webp", import.meta.url)),
    ...mainFixedBrushAssets.map((asset) => access(new URL(`../public/visuals/brush/${asset}`, import.meta.url))),
    access(new URL("../AI_MODULE_PROMPTS.md", import.meta.url)),
  ]);
});

test("Shao Kangjie static page keeps every primary title in an independent brush asset and exposes all supported derivations", async () => {
  const [html, scriptSource, coreSource, styles, appSource] = await Promise.all([
    readFile(new URL("../kangjie.html", import.meta.url), "utf8"),
    readFile(new URL("../kangjie.js", import.meta.url), "utf8"),
    readFile(new URL("../kangjie-core.js", import.meta.url), "utf8"),
    readFile(new URL("../kangjie.css", import.meta.url), "utf8"),
    readFile(new URL("../app/kangjie/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<html lang="zh-Hant-TW"[^>]*>/);
  assert.match(html, /title-kangjie-entry-v1\.webp/);
  assert.match(html, /theme-kangjie-v1\.webp/);
  assert.match(html, /title-kangjie-hero-v1\.webp/);
  assert.match(html, /title-kangjie-origins-v1\.webp/);
  assert.match(html, /title-kangjie-meihua-v1\.webp/);
  assert.match(html, /title-kangjie-huangji-v1\.webp/);
  assert.match(html, /title-kangjie-source-v1\.webp/);
  assert.match(html, /title-kangjie-boundary-v1\.webp/);
  assert.match(appSource, /title-kangjie-result-v1\.webp/);
  for (const asset of kangjieFixedBrushAssets) {
    assert.ok(`${html}\n${appSource}`.includes(asset), `${asset} must be referenced by the static Kangjie page`);
  }
  assert.match(html, /data-method-panel="calendar"/);
  assert.match(html, /data-method-panel="object"/);
  assert.match(html, /data-method-panel="sound"/);
  assert.match(html, /data-method-panel="text"/);
  assert.match(html, /data-access-gate/);
  assert.match(html, /data-current-time-detect/);
  assert.match(html, /重新套用現在/);
  assert.match(html, /自動偵測，可手動選/);
  assert.match(scriptSource, /input\.value === "0000"/);
  assert.match(scriptSource, /initializeCurrentTimeDetection/);
  assert.match(appSource, /password === "0000"/);
  assert.match(appSource, /detectCurrentCalendarParts/);
  assert.match(html, /一世 30 年/);
  assert.match(html, /不把現代西元年對讀成唯一正統位置/);
  assert.match(html, /ctext\.org\/wiki\.pl\?chapter=867487/);
  assert.match(coreSource, /calculateCalendarHexagram/);
  assert.match(coreSource, /calculateObjectHexagram/);
  assert.match(coreSource, /calculateDoubleSoundHexagram/);
  assert.match(coreSource, /calculateLongTextHexagram/);
  assert.match(coreSource, /decomposeHuangjiYears/);
  assert.match(coreSource, /detectCurrentCalendarParts/);
  assert.match(styles, /@media \(max-width: 650px\)/);
  assert.match(styles, /grid-template-columns: repeat\(2, 1fr\)/);
  assert.doesNotMatch(html, /[—–]/);
  assert.doesNotMatch(appSource, /[—–]/);

  const fixedTextHeading = /<h[1-4][^>]*>\s*[^\s<]/i;
  assert.doesNotMatch(html, fixedTextHeading);

  await Promise.all([
    access(new URL("../kangjie.html", import.meta.url)),
    access(new URL("../kangjie.js", import.meta.url)),
    access(new URL("../kangjie-core.js", import.meta.url)),
    access(new URL("../kangjie-core.d.ts", import.meta.url)),
    access(new URL("../kangjie.css", import.meta.url)),
    access(new URL("../app/kangjie/page.tsx", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-entry-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/theme-kangjie-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-hero-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-origins-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-meihua-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-huangji-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-result-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-source-v1.webp", import.meta.url)),
    access(new URL("../public/visuals/brush/title-kangjie-boundary-v1.webp", import.meta.url)),
    ...kangjieFixedBrushAssets.map((asset) => access(new URL(`../public/visuals/brush/${asset}`, import.meta.url))),
  ]);
});
