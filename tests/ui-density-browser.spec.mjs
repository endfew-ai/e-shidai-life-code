import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { label: "附圖桌機", width: 1672, height: 941 },
  { label: "桌機", width: 1440, height: 900 },
  { label: "Windows 125% 縮放", width: 1536, height: 790 },
  { label: "平板橫向", width: 1024, height: 768 },
  { label: "平板直向", width: 768, height: 1024 },
  { label: "手機", width: 390, height: 844 },
  { label: "窄版手機", width: 320, height: 720 },
];

test.use({
  baseURL: process.env.UI_DENSITY_BASE_URL || "http://127.0.0.1:4197",
  reducedMotion: "reduce",
  timezoneId: "Asia/Taipei",
});

test.beforeEach(async ({ page }) => {
  await page.route("https://api.counterapi.dev/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ count: 1284 }),
  }));
});

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
}

async function expectMinimumHeight(locator, minimum, label) {
  const heights = await locator.evaluateAll(
    (elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          element.getClientRects().length > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) > 0
          && rect.width > 0
          && rect.height > 0
        );
      })
      .map((element) => ({
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || element.tagName,
        height: element.getBoundingClientRect().height,
      })),
  );

  expect(heights.length, `${label} 至少要有一個可見項目`).toBeGreaterThan(0);
  for (const item of heights) {
    expect(item.height, `${label}「${item.text}」高度`).toBeGreaterThanOrEqual(minimum);
  }
}

async function expectReadableSamples(page, selectors, minimum, label) {
  const samples = await page.evaluate(
    ({ selectors: requestedSelectors }) => requestedSelectors.map((selector) => {
      const element = [...document.querySelectorAll(selector)].find((candidate) => {
        const style = getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();
        return (
          candidate.getClientRects().length > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) > 0
          && rect.width > 0
          && rect.height > 0
        );
      });
      return {
        selector,
        fontSize: element ? Number.parseFloat(getComputedStyle(element).fontSize) : null,
      };
    }),
    { selectors },
  );

  for (const sample of samples) {
    expect(sample.fontSize, `${label}「${sample.selector}」必須可見`).not.toBeNull();
    expect(sample.fontSize, `${label}「${sample.selector}」字級`).toBeGreaterThanOrEqual(minimum);
  }
}

async function expectHeroContentClearOfRail(page) {
  await expect(page.locator(".dashboard-home-screen .hero-cta")).toBeVisible();

  const report = await page.evaluate(() => {
    const hero = document.querySelector(".dashboard-home-screen .hero");
    const copy = document.querySelector(".dashboard-home-screen .hero-copy");
    const title = document.querySelector(".dashboard-home-screen .hero-title");
    const summary = document.querySelector(".dashboard-home-screen .hero-summary");
    const cta = document.querySelector(".dashboard-home-screen .hero-cta");
    const rail = document.querySelector(".dashboard-home-screen .hero-rail");

    if (!hero || !copy || !title || !summary || !cta || !rail) {
      return null;
    }

    const heroRect = hero.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const summaryRect = summary.getBoundingClientRect();
    const ctaRect = cta.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const bottomHit = document.elementFromPoint(
      ctaRect.left + ctaRect.width / 2,
      ctaRect.bottom - 2,
    );

    return {
      copyOverflow: copy.scrollHeight - copy.clientHeight,
      titleAboveHero: heroRect.top - titleRect.top,
      titleSummaryGap: summaryRect.top - titleRect.bottom,
      summaryCtaGap: ctaRect.top - summaryRect.bottom,
      ctaCopyBottomGap: copyRect.bottom - ctaRect.bottom,
      ctaRailGap: railRect.top - ctaRect.bottom,
      ctaOwnsBottomPoint: bottomHit === cta || cta.contains(bottomHit),
    };
  });

  expect(report, "首頁主視覺各元素必須存在").not.toBeNull();
  expect(report.copyOverflow, "主視覺文字不得溢出內容安全區").toBeLessThanOrEqual(1);
  expect(report.titleAboveHero, "毛筆標題不得超出主視覺上緣").toBeLessThanOrEqual(0);
  expect(report.titleSummaryGap, "毛筆標題與說明不得重疊").toBeGreaterThanOrEqual(0);
  expect(report.summaryCtaGap, "說明與金色按鈕不得重疊").toBeGreaterThanOrEqual(0);
  expect(report.ctaCopyBottomGap, "金色按鈕不得超出內容安全區").toBeGreaterThanOrEqual(-1);
  expect(report.ctaRailGap, "金色按鈕必須完整位於資訊列上方").toBeGreaterThanOrEqual(1);
  expect(report.ctaOwnsBottomPoint, "金色按鈕下緣不得被資訊列蓋住").toBe(true);
}

async function verifyHomepage(page) {
  await page.goto("/index.html", { waitUntil: "networkidle" });

  const form = page.locator("#analyzer-form");
  const birthdayInput = page.locator("#birthday-input");
  const submit = form.locator(".analyze-submit");

  await expect(form).toBeVisible();
  await expect(birthdayInput).toBeVisible();
  await expect(submit).toBeVisible();
  await expect(submit).toBeEnabled();
  await expectHeroContentClearOfRail(page);

  await expectMinimumHeight(page.locator("[data-mode-label], .kangjie-mode-entry"), 44, "首頁模式入口");
  await expectMinimumHeight(submit, 44, "首頁主要分析按鈕");
  await expectReadableSamples(
    page,
    [".mode-art figcaption > span", ".field-block > span", ".form-meta p"],
    16,
    "首頁一般說明",
  );

  await page.locator('[data-mode-label="code"]').click();
  await expect(page.locator('input[name="analysis-mode"][value="code"]')).toBeChecked();
  await page.locator('[data-mode-label="birthday"]').click();
  await expect(page.locator('input[name="analysis-mode"][value="birthday"]')).toBeChecked();

  await birthdayInput.fill("1990-08-12");
  await submit.click();
  await expect(page.locator("#result-anchor")).toBeVisible();
  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await expect(page.locator("[data-cockpit-core]")).toContainText("生命路徑");
  await expect(page.locator("[data-cockpit-core]")).not.toHaveText("待分析");

  const workspaceTabs = page.locator(".workspace-tabs");
  if (await workspaceTabs.count()) {
    const tabOverflow = await workspaceTabs.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(tabOverflow.scrollWidth).toBeLessThanOrEqual(tabOverflow.clientWidth + 1);
  }

  const moduleGrid = await page.locator(".visual-module-grid").evaluate((element) => {
    const children = [...element.children];
    return {
      viewportWidth: window.innerWidth,
      columnCount: getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      minimumCardWidth: Math.min(...children.map((child) => child.getBoundingClientRect().width)),
    };
  });
  const expectedColumns = moduleGrid.viewportWidth <= 360
    ? 1
    : moduleGrid.viewportWidth <= 640
      ? 2
      : moduleGrid.viewportWidth <= 1180
        ? 3
        : 5;
  expect(moduleGrid.columnCount).toBe(expectedColumns);
  expect(moduleGrid.minimumCardWidth).toBeGreaterThanOrEqual(150);
  await expectNoHorizontalOverflow(page);
}

async function expectDenseDesktopFirstFold(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await page.waitForFunction(() => [...document.querySelectorAll(".dashboard-home-screen img")]
    .every((image) => image.complete && image.naturalWidth > 0));

  await expect(page.locator(".cockpit-status article")).toHaveCount(4);
  await expect(page.locator(".visual-module-grid > a")).toHaveCount(5);
  await expect(page.locator(".support-module-grid > a")).toHaveCount(3);
  await expect(page.locator("[data-cockpit-time]")).not.toHaveText("--:--");

  const layout = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      const box = element?.getBoundingClientRect();
      return box ? {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      } : null;
    };
    return {
      hero: rect(".dashboard-home-screen .hero"),
      analyzer: rect(".dashboard-home-screen .analyzer-section"),
      cockpit: rect(".dashboard-home-screen .cockpit-status"),
      mainModules: rect(".dashboard-home-screen .visual-module-grid"),
      supportModules: rect(".dashboard-home-screen .support-module-grid"),
      firstScreen: rect(".dashboard-home-screen"),
      viewportHeight: window.innerHeight,
    };
  });

  for (const key of ["hero", "analyzer", "cockpit", "mainModules", "supportModules", "firstScreen"]) {
    expect(layout[key], `${key} 必須存在`).not.toBeNull();
  }
  expect(Math.abs(layout.hero.top - layout.analyzer.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.hero.height - layout.analyzer.height)).toBeLessThanOrEqual(1);
  expect(layout.cockpit.top).toBeGreaterThanOrEqual(layout.hero.bottom);
  expect(layout.mainModules.top).toBeGreaterThanOrEqual(layout.cockpit.bottom);
  expect(layout.supportModules.top).toBeGreaterThanOrEqual(layout.mainModules.bottom);
  expect(layout.supportModules.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.firstScreen.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.mainModules.height).toBeGreaterThanOrEqual(180);
  expect(layout.supportModules.height).toBeGreaterThanOrEqual(100);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: `output/playwright/home-density-${width}x${height}.png`,
    fullPage: false,
  });
}

async function unlockKangjie(page) {
  const gate = page.locator("[data-access-gate]");
  await expect(gate).toBeVisible();
  await expect(gate.locator('[name="password"]')).toBeVisible();
  await expectMinimumHeight(gate.locator('button[type="submit"]'), 44, "康節密碼驗證按鈕");

  await gate.locator('[name="password"]').fill("0000");
  await gate.locator('button[type="submit"]').click();

  await expect(gate).toBeHidden();
  await expect(page.locator("[data-protected-content]")).not.toHaveAttribute("aria-hidden", "true");
}

async function verifyKangjie(page) {
  await page.goto("/kangjie.html#meihua", { waitUntil: "networkidle" });
  await unlockKangjie(page);

  const tabs = page.locator("[data-kangjie-tab]");
  await expect(tabs).toHaveCount(4);
  await expectMinimumHeight(tabs, 44, "康節主分頁");

  const tabPanels = [
    ["origins", "#panel-origins"],
    ["meihua", "#panel-meihua"],
    ["huangji", "#panel-huangji"],
    ["sources", "#panel-sources"],
  ];

  for (const [tab, panel] of tabPanels) {
    await page.locator(`[data-kangjie-tab="${tab}"]`).click();
    await expect(page.locator(`[data-kangjie-tab="${tab}"]`)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(panel)).toBeVisible();
  }

  await page.locator('[data-kangjie-tab="meihua"]').click();
  const calendar = page.locator("#form-calendar");
  const submit = calendar.locator('button[type="submit"]');

  await expect(calendar).toBeVisible();
  await expectMinimumHeight(page.locator("[data-method-tab]"), 44, "康節起卦方法分頁");
  await expectMinimumHeight(submit, 44, "康節主要起卦按鈕");
  await expectReadableSamples(
    page,
    [".kangjie-panel-heading > p", ".form-intro p", ".form-note"],
    16,
    "康節一般說明",
  );

  await calendar.locator('[name="yearBranch"]').selectOption("5");
  await calendar.locator('[name="lunarMonth"]').fill("12");
  await calendar.locator('[name="lunarDay"]').fill("17");
  await calendar.locator('[name="hourBranch"]').selectOption("9");
  await submit.click();

  await expect(page.locator("#kangjie-result")).toBeVisible();
  await expect(page.locator("#kangjie-result")).toContainText("本卦");
  await expect(page.locator("#kangjie-result")).toContainText("互卦");
  await expect(page.locator("#kangjie-result")).toContainText("變卦");
  await expectNoHorizontalOverflow(page);
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.label} ${viewport.width}×${viewport.height} 維持緊湊、可讀且可操作`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await verifyHomepage(page);
    await verifyKangjie(page);
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1672, height: 941 },
]) {
  test(`首頁第一屏 ${viewport.width}×${viewport.height} 完整顯示所有主要模塊`, async ({ page }) => {
    await expectDenseDesktopFirstFold(page, viewport.width, viewport.height);
  });
}
