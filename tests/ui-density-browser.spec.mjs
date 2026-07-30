import { expect, test } from "@playwright/test";

const UI_DENSITY_BASE_URL = process.env.UI_DENSITY_BASE_URL || "http://127.0.0.1:4197";

const VIEWPORTS = [
  { label: "大型桌機", width: 1920, height: 1080 },
  { label: "附圖桌機", width: 1672, height: 941 },
  { label: "桌機", width: 1440, height: 900 },
  { label: "Windows 125% 縮放", width: 1536, height: 790 },
  { label: "平板橫向", width: 1024, height: 768 },
  { label: "平板直向", width: 768, height: 1024 },
  { label: "手機", width: 390, height: 844 },
  { label: "中窄手機", width: 360, height: 800 },
  { label: "窄版手機", width: 320, height: 720 },
];

test.use({
  baseURL: UI_DENSITY_BASE_URL.endsWith("/") ? UI_DENSITY_BASE_URL : `${UI_DENSITY_BASE_URL}/`,
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
    clientWidth: document.documentElement.clientWidth,
    documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  const scrollX = await page.evaluate(() => {
    window.scrollTo({ left: 100, top: window.scrollY, behavior: "instant" });
    return window.scrollX;
  });
  expect(scrollX, `頁面不得水平滑動（inner ${dimensions.innerWidth}／client ${dimensions.clientWidth}）`).toBe(0);
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
    expect(Math.round(item.height), `${label}「${item.text}」高度`).toBeGreaterThanOrEqual(minimum);
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

async function expectImageAssetLoads(page, path, label) {
  const state = await page.evaluate((assetPath) => new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => resolve({
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    }), { once: true });
    image.addEventListener("error", () => resolve({
      complete: image.complete,
      naturalWidth: 0,
      naturalHeight: 0,
    }), { once: true });
    image.src = assetPath;
  }), path);
  expect(state.complete, `${label} 應完成載入`).toBe(true);
  expect(state.naturalWidth, `${label} 寬度`).toBeGreaterThan(0);
  expect(state.naturalHeight, `${label} 高度`).toBeGreaterThan(0);
}

async function expectHeroContentClearOfRail(page) {
  const proof = page.locator(".dashboard-home-screen .hero-proof");
  await expect(proof).toBeVisible();
  await expect(proof.locator("li")).toHaveCount(3);

  const report = await page.evaluate(() => {
    const hero = document.querySelector(".dashboard-home-screen .hero");
    const copy = document.querySelector(".dashboard-home-screen .hero-copy");
    const title = document.querySelector(".dashboard-home-screen .hero-title");
    const summary = document.querySelector(".dashboard-home-screen .hero-summary");
    const proofList = document.querySelector(".dashboard-home-screen .hero-proof");
    const rail = document.querySelector(".dashboard-home-screen .hero-rail");

    if (!hero || !copy || !title || !summary || !proofList || !rail) {
      return null;
    }

    const heroRect = hero.getBoundingClientRect();
    const copyRect = copy.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const summaryRect = summary.getBoundingClientRect();
    const proofRect = proofList.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const railStyle = getComputedStyle(rail);

    return {
      copyOverflow: copy.scrollHeight - copy.clientHeight,
      titleAboveHero: heroRect.top - titleRect.top,
      titleSummaryGap: summaryRect.top - titleRect.bottom,
      summaryProofGap: proofRect.top - summaryRect.bottom,
      proofCopyBottomGap: copyRect.bottom - proofRect.bottom,
      proofHeroBottomGap: heroRect.bottom - proofRect.bottom,
      railDisplay: railStyle.display,
      proofRailGap: railRect.top - proofRect.bottom,
    };
  });

  expect(report, "首頁主視覺各元素必須存在").not.toBeNull();
  expect(report.copyOverflow, "主視覺文字不得溢出內容安全區").toBeLessThanOrEqual(1);
  expect(report.titleAboveHero, "毛筆標題不得超出主視覺上緣").toBeLessThanOrEqual(0);
  expect(report.titleSummaryGap, "毛筆標題與說明不得重疊").toBeGreaterThanOrEqual(0);
  expect(report.summaryProofGap, "說明與三項分析特色不得重疊").toBeGreaterThanOrEqual(0);
  expect(report.proofCopyBottomGap, "三項分析特色不得超出內容安全區").toBeGreaterThanOrEqual(-1);
  expect(report.proofHeroBottomGap, "三項分析特色必須完整位於主視覺內").toBeGreaterThanOrEqual(1);
  if (report.railDisplay !== "none") {
    expect(report.proofRailGap, "三項分析特色必須完整位於資訊列上方").toBeGreaterThanOrEqual(1);
  }
}

async function expectCompactMobileDashboard(page) {
  const report = await page.evaluate(() => {
    const columns = (selector) => getComputedStyle(document.querySelector(selector))
      .gridTemplateColumns.split(/\s+/).filter(Boolean).length;
    const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
    const wordmark = document.querySelector(".dashboard-canvas > .topbar .wordmark");
    const wordmarkStyle = getComputedStyle(wordmark);
    return {
      viewportWidth: window.innerWidth,
      visibleWordmarkHeight: wordmarkStyle.display === "none" ? null : rect(".dashboard-canvas > .topbar .wordmark").height,
      cockpitColumns: columns(".cockpit-status"),
      cockpitCount: document.querySelectorAll(".cockpit-status > article").length,
      cockpitHeight: rect(".cockpit-status").height,
      atlasColumns: columns(".mobile-function-atlas"),
      atlasCount: document.querySelectorAll(".mobile-function-atlas > a").length,
      atlasBottom: rect(".mobile-function-atlas").bottom,
      viewportHeight: window.innerHeight,
      workspaceTabColumns: columns(".workspace-tabs"),
      workspaceEntryColumns: columns(".workspace-entry-grid"),
      workspaceEntryHeights: [...document.querySelectorAll(".workspace-entry-grid button")]
        .map((element) => element.getBoundingClientRect().height),
      modeArtDisplay: getComputedStyle(document.querySelector(".dashboard-lead .mode-art")).display,
      moduleRailDisplay: getComputedStyle(document.querySelector(".visual-module-rail")).display,
      desktopAnalyticsDisplay: getComputedStyle(document.querySelector("[data-ui-region='desktop-analytics']")).display,
    };
  });

  if (report.visibleWordmarkHeight !== null) {
    expect(report.visibleWordmarkHeight, "可見手機品牌連結觸控高度").toBeGreaterThanOrEqual(44);
  }
  expect(report.cockpitCount, "手機即時摘要必須正好四格").toBe(4);
  expect(report.cockpitColumns, "手機即時摘要應維持 2×2").toBe(2);
  expect(report.cockpitHeight, "手機即時摘要不得退化成過長四列").toBeLessThanOrEqual(92);
  expect(report.desktopAnalyticsDisplay, "手機不得重複顯示桌機四模塊總覽").toBe("none");
  expect(report.atlasColumns, "手機八功能入口應採四欄兩列").toBe(4);
  expect(report.atlasCount, "手機功能總覽必須正好八個入口").toBe(8);
  expect(report.atlasBottom, "手機首屏必須完整顯示八個功能入口").toBeLessThanOrEqual(report.viewportHeight - 4);
  expect(report.workspaceTabColumns, "手機工作台分頁應採三欄兩列").toBe(3);
  expect(report.workspaceEntryColumns, "手機工作台六入口應採兩欄三列").toBe(2);
  expect(Math.max(...report.workspaceEntryHeights), "手機工作台入口不得過度拉長").toBeLessThanOrEqual(180);
  expect(report.modeArtDisplay, "手機不重複顯示當前模式橫幅").toBe("none");
  expect(report.moduleRailDisplay, "手機以八格總覽取代過長卡片牆").toBe("none");
  await expectReadableSamples(
    page,
    [".cockpit-status small", ".mobile-function-atlas strong", ".mobile-function-atlas small"],
    14,
    "手機儀表與入口標籤",
  );
}

async function expectReferenceMobileDashboard(page) {
  await expect(page.locator(".dashboard-home-screen .hero")).toBeHidden();
  await expect(page.locator("[data-ui-region='desktop-analytics']")).toBeHidden();
  await expect(page.locator("[data-ui-region='mode-deck']")).toBeVisible();
  await expect(page.locator(".cockpit-center-seal")).toBeVisible();
  await expect(page.locator(".cockpit-status > article")).toHaveCount(4);
  await expect(page.locator(".mobile-function-atlas")).toBeVisible();
  await expect(page.locator(".mobile-function-atlas > a")).toHaveCount(8);
  await expect(page.locator(".visual-module-rail")).toBeHidden();
  await expectImageAssetLoads(
    page,
    "public/visuals/ai-dashboard/reference-v4/analyzer-console-frame-v4.webp",
    "手機分析台框架",
  );

  const report = await page.evaluate(() => {
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
    const modeDeck = document.querySelector("[data-ui-region='mode-deck']");
    const modeEntries = [...modeDeck.querySelectorAll(":scope > label, :scope > .kangjie-mode-entry")];
    const modeEntryTops = modeEntries.map((entry) => entry.getBoundingClientRect().top);
    const centerSeal = document.querySelector(".cockpit-center-seal");
    const portalImages = [...document.querySelectorAll(".mode-switch .mode-card-art")];
    const cockpitCells = [...document.querySelectorAll(".cockpit-status > article")];
    const atlasLinks = [...document.querySelectorAll(".mobile-function-atlas > a")];
    const atlasRects = atlasLinks.map((card) => card.getBoundingClientRect());
    const centerOwnsPoint = (element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return hit === element || element.contains(hit);
    };
    return {
      viewportHeight: window.innerHeight,
      modeEntryCount: modeEntries.length,
      modeEntryTopSpread: Math.max(...modeEntryTops) - Math.min(...modeEntryTops),
      analyzer: rect("[data-ui-region='analyzer']"),
      cockpit: rect("[data-ui-region='cockpit']"),
      atlas: rect(".mobile-function-atlas"),
      methodSource: rect(".method-source > details"),
      cockpitCount: cockpitCells.length,
      cockpitColumns: getComputedStyle(document.querySelector(".cockpit-status"))
        .gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      atlasCount: atlasLinks.length,
      atlasColumns: getComputedStyle(document.querySelector(".mobile-function-atlas"))
        .gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      atlasWidthSpread: atlasRects.length
        ? Math.max(...atlasRects.map((box) => box.width)) - Math.min(...atlasRects.map((box) => box.width))
        : null,
      atlasCentersAreClickable: atlasLinks.map(centerOwnsPoint),
      atlasImageState: [...document.querySelectorAll(".mobile-function-atlas img")].map((image) => ({
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })),
      modeCentersAreClickable: modeEntries.map(centerOwnsPoint),
      portalImageState: portalImages.map((image) => ({
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        width: image.getBoundingClientRect().width,
        height: image.getBoundingClientRect().height,
      })),
      centerSealPointerEvents: getComputedStyle(centerSeal).pointerEvents,
    };
  });

  expect(report.modeEntryCount, "手機必須有四個功能入口").toBe(4);
  expect(report.modeEntryTopSpread, "手機四個功能入口必須同列").toBeLessThanOrEqual(1);
  expect(report.cockpitCount, "手機摘要必須正好四格").toBe(4);
  expect(report.cockpitColumns, "手機摘要必須排成 2×2").toBe(2);
  expect(report.analyzer).not.toBeNull();
  expect(report.cockpit).not.toBeNull();
  expect(report.atlas).not.toBeNull();
  expect(report.methodSource).not.toBeNull();
  expect(report.cockpit.top, "摘要區必須接在分析器後方").toBeGreaterThanOrEqual(report.analyzer.bottom);
  expect(report.cockpit.top - report.analyzer.bottom, "分析器與摘要區不可出現大空白").toBeLessThanOrEqual(12);
  expect(report.atlas.top, "八格功能總覽必須接在摘要後方").toBeGreaterThanOrEqual(report.cockpit.bottom);
  expect(report.atlas.top - report.cockpit.bottom, "摘要與八格功能總覽不可出現大空白").toBeLessThanOrEqual(12);
  expect(report.methodSource.top, "規則來源必須接在八格功能總覽後方").toBeGreaterThanOrEqual(report.atlas.bottom);
  expect(report.methodSource.top - report.atlas.bottom, "八格功能總覽與規則來源不可出現大空白").toBeLessThanOrEqual(16);
  expect(report.atlasCount, "手機必須正好顯示八個功能入口").toBe(8);
  expect(report.atlasColumns, "手機八功能入口必須排成四欄兩列").toBe(4);
  expect(report.atlasWidthSpread, "手機八格入口寬度必須一致").toBeLessThanOrEqual(2);
  expect(report.atlas.bottom, "手機首屏必須完整顯示八個功能入口")
    .toBeLessThanOrEqual(report.viewportHeight - 4);
  expect(report.modeCentersAreClickable.every(Boolean), "四個模式入口中央不得被裝飾圖遮住").toBe(true);
  expect(report.atlasCentersAreClickable.every(Boolean), "八格功能入口中央不得被裝飾圖遮住").toBe(true);
  expect(report.atlasImageState.length, "手機必須載入八張功能徽章").toBe(8);
  expect(
    report.atlasImageState.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
    "手機八張 AI 功能徽章都必須完成載入",
  ).toBe(true);
  expect(report.centerSealPointerEvents, "中央儀器章不可攔截觸控").toBe("none");
  for (const image of report.portalImageState) {
    expect(image.complete).toBe(true);
    expect(image.naturalWidth, "四個 AI 圓盤圖必須載入").toBeGreaterThan(0);
    expect(image.width, "四個圓盤寬度").toBeGreaterThanOrEqual(32);
    expect(image.height, "四個圓盤高度").toBeGreaterThanOrEqual(32);
  }
}

async function verifyHomepage(page) {
  await page.goto("index.html", { waitUntil: "networkidle" });

  const form = page.locator("#analyzer-form");
  const birthdayInput = page.locator("#birthday-input");
  const submit = form.locator(".analyze-submit");

  await expect(form).toBeVisible();
  await expect(birthdayInput).toBeVisible();
  await expect(submit).toBeVisible();
  await expect(submit).toBeEnabled();
  await expect(page.locator("[data-analytics-status]")).toHaveText("待分析");
  await expect(page.locator("[data-analytics-core]")).toHaveText("－");
  await expect(page.locator("[data-analytics-core-large]")).toHaveText("－");
  await expect(page.locator("[data-analytics-annual]")).toHaveText("－");
  await expect(page.locator("[data-preview-value]")).toHaveText(["－", "－", "－", "－"]);
  if (page.viewportSize().width <= 767) {
    await expectReferenceMobileDashboard(page);
  } else if (page.viewportSize().width <= 1180) {
    await expect(page.locator("[data-ui-region='desktop-analytics']")).toBeHidden();
    await expect(page.locator("[data-ui-region='cockpit']")).toBeVisible();
    await expect(page.locator("[data-ui-region='cockpit'] > article")).toHaveCount(4);
    await expect(page.locator(".dashboard-home-screen .hero")).toBeVisible();
    const intermediateLayout = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const lead = rect(".dashboard-home-screen .dashboard-lead");
      const hero = rect(".dashboard-home-screen .hero");
      const analyzer = rect(".dashboard-home-screen .analyzer-section");
      const cockpit = rect(".dashboard-home-screen [data-ui-region='cockpit']");
      return {
        overlapWidth: Math.max(0, Math.min(hero.right, analyzer.right) - Math.max(hero.left, analyzer.left)),
        overlapHeight: Math.max(0, Math.min(hero.bottom, analyzer.bottom) - Math.max(hero.top, analyzer.top)),
        cockpitGap: cockpit.top - lead.bottom,
      };
    });
    expect(
      intermediateLayout.overlapWidth <= 1 || intermediateLayout.overlapHeight <= 1,
      "平板主視覺與分析器不得互相重疊",
    ).toBe(true);
    expect(intermediateLayout.cockpitGap, "平板摘要不得蓋住主分析區").toBeGreaterThanOrEqual(-1);
    expect(intermediateLayout.cockpitGap, "平板主分析區與摘要不得留下大空白").toBeLessThanOrEqual(16);
  } else {
    await expect(page.locator("[data-ui-region='desktop-analytics']")).toBeVisible();
    await expect(page.locator("[data-ui-region='desktop-analytics'] > article")).toHaveCount(4);
    await expect(page.locator("[data-ui-region='cockpit']")).toBeHidden();
    await expectHeroContentClearOfRail(page);
  }

  await expectMinimumHeight(page.locator("[data-mode-label], .kangjie-mode-entry"), 44, "首頁模式入口");
  await expectMinimumHeight(submit, 44, "首頁主要分析按鈕");
  const readableSelectors = page.viewportSize().width <= 767
    ? [".field-block > span", ".mobile-function-atlas strong", ".mobile-function-atlas small"]
    : [".mode-art figcaption > span", ".field-block > span", ".form-meta p"];
  await expectReadableSamples(
    page,
    readableSelectors,
    page.viewportSize().width <= 767 ? 14 : 16,
    "首頁一般說明",
  );

  await page.locator('[data-mode-label="code"]').click();
  await expect(page.locator('input[name="analysis-mode"][value="code"]')).toBeChecked();
  if (page.viewportSize().width <= 767) {
    await page.locator('[data-mode-label="birthday"]').click();
    await birthdayInput.click();
  } else if (page.viewportSize().width > 1180) {
    await page.locator(".sidebar-primary").click();
    await expect(page.locator("#analyzer")).toHaveClass(/is-entry-highlight/);
  } else {
    await page.locator('[data-mode-label="birthday"]').click();
  }
  await expect(page.locator('input[name="analysis-mode"][value="birthday"]')).toBeChecked();
  await expect(birthdayInput).toBeFocused();
  if (page.viewportSize().width > 1180) await expect(page).toHaveURL(/#analyzer$/);

  await birthdayInput.fill("1990-07-12");
  await expect(page.locator("#clear-button")).toBeVisible();
  if (page.viewportSize().width <= 767) {
    await expectMinimumHeight(page.locator("#clear-button"), 44, "手機清除輸入按鈕");
    await expectReadableSamples(page, ["#clear-button"], 14, "手機清除輸入按鈕");
  }
  await submit.click();
  await expect(page.locator("#result-anchor")).toBeVisible();
  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await expect(page.locator("[data-cockpit-core]")).toContainText("生命路徑");
  await expect(page.locator("[data-cockpit-core]")).not.toHaveText("待分析");
  await expect(page.locator("[data-analytics-status]")).toHaveText("生日分析完成");
  await expect(page.locator("[data-analytics-core]")).toHaveText("2");

  const workspaceTabs = page.locator(".workspace-tabs");
  if (await workspaceTabs.count()) {
    const tabOverflow = await workspaceTabs.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(tabOverflow.scrollWidth).toBeLessThanOrEqual(tabOverflow.clientWidth + 1);
  }

  if (page.viewportSize().width <= 767) {
    await expectCompactMobileDashboard(page);
  } else {
    const moduleGrid = await page.locator(".visual-module-grid").evaluate((element) => {
      const children = [...element.children];
      return {
        viewportWidth: window.innerWidth,
        columnCount: getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
        minimumCardWidth: Math.min(...children.map((child) => child.getBoundingClientRect().width)),
      };
    });
    expect(moduleGrid.columnCount).toBe(moduleGrid.viewportWidth <= 1180 ? 3 : 5);
    expect(moduleGrid.minimumCardWidth).toBeGreaterThanOrEqual(150);
  }
  await expectNoHorizontalOverflow(page);
}

async function expectDenseDesktopFirstFold(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const analytics = page.locator("[data-ui-region='desktop-analytics']");
  await expect(analytics).toBeVisible();
  await expect(analytics.locator(":scope > article")).toHaveCount(4);
  for (const moduleClass of [
    "analytics-overview",
    "analytics-spectrum",
    "analytics-core-detail",
    "analytics-annual",
  ]) {
    await expect(analytics.locator(`.${moduleClass}`)).toBeVisible();
  }
  await expect(page.locator("[data-ui-region='cockpit']")).toBeHidden();
  await expect(page.locator(".topbar-actions > a")).toHaveCount(8);
  await expect(page.locator(".visual-module-grid > a")).toHaveCount(5);
  await expect(page.locator(".support-module-grid > a")).toHaveCount(3);
  await expect(page.locator(".support-module-grid > a ul")).toHaveCount(3);
  await expect(page.locator(".support-module-grid > a li")).toHaveCount(12);
  await expect(page.locator(".dashboard-home-screen .hero-art"))
    .toHaveAttribute("src", /reference-v3\/desktop-hero-command-v3\.webp/);
  await expect(page.locator(".dashboard-home-screen .hero-title img"))
    .toHaveAttribute("src", /reference-v4\/hero-title-calligraphy-v4\.png/);
  await expectImageAssetLoads(
    page,
    "public/visuals/ai-dashboard/reference-v3/desktop-hero-command-v3.webp",
    "桌機主視覺圖",
  );
  for (const [path, label] of [
    ["public/visuals/ai-dashboard/reference-v4/hero-title-calligraphy-v4.png", "黃金毛筆主標"],
    ["public/visuals/ai-dashboard/reference-v4/analyzer-console-frame-v4.webp", "分析輸入台"],
    ["public/visuals/ai-dashboard/reference-v4/analytics-overview-instrument-v4.webp", "核心總覽儀表"],
    ["public/visuals/ai-dashboard/reference-v4/analytics-spectrum-instrument-v4.webp", "頻譜儀表"],
    ["public/visuals/ai-dashboard/reference-v4/analytics-core-instrument-v4.webp", "核心數字儀表"],
    ["public/visuals/ai-dashboard/reference-v4/analytics-annual-instrument-v4.webp", "個人流年儀表"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-1-v5.webp", "生日物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-2-v5.webp", "生命路徑物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-3-v5.webp", "數字頻譜物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-4-v5.webp", "九宮配置物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-5-v5.webp", "流年分析物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-6-v5.webp", "專業工作台物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-7-v5.webp", "規則來源物件徽章"],
    ["public/visuals/ai-dashboard/reference-v5/function-bay-8-v5.webp", "本機隱私物件徽章"],
  ]) {
    await expectImageAssetLoads(page, path, label);
  }

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
      lead: rect(".dashboard-home-screen .dashboard-lead"),
      hero: rect(".dashboard-home-screen .hero"),
      analyzer: rect(".dashboard-home-screen .analyzer-section"),
      analytics: rect(".dashboard-home-screen [data-ui-region='desktop-analytics']"),
      analyticsModules: [...document.querySelectorAll("[data-ui-region='desktop-analytics'] > article")]
        .map((element) => {
          const box = element.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, width: box.width, height: box.height };
        }),
      mainModules: rect(".dashboard-home-screen .visual-module-grid"),
      supportModules: rect(".dashboard-home-screen .support-module-grid"),
      firstScreen: rect(".dashboard-home-screen"),
      topbarActions: [...document.querySelectorAll(".topbar-actions > a")].map((element) => rect(
        `.topbar-actions > a:nth-child(${[...element.parentElement.children].indexOf(element) + 1})`,
      )),
      viewportHeight: window.innerHeight,
    };
  });

  for (const key of ["lead", "hero", "analyzer", "analytics", "mainModules", "supportModules", "firstScreen"]) {
    expect(layout[key], `${key} 必須存在`).not.toBeNull();
  }
  expect(Math.abs(layout.hero.top - layout.analyzer.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.hero.height - layout.analyzer.height)).toBeLessThanOrEqual(1);
  expect(layout.analyticsModules.length, "桌機總覽必須包含四個可見模塊").toBe(4);
  for (const moduleCard of layout.analyticsModules) {
    expect(moduleCard.width, "桌機總覽模塊寬度").toBeGreaterThan(0);
    expect(moduleCard.height, "桌機總覽模塊高度").toBeGreaterThan(0);
  }
  expect(layout.analytics.top, "四模塊總覽必須接在主分析區後方").toBeGreaterThanOrEqual(layout.lead.bottom);
  expect(layout.analytics.top - layout.lead.bottom, "主分析區與四模塊總覽不可有大空白").toBeLessThanOrEqual(12);
  expect(layout.mainModules.top).toBeGreaterThanOrEqual(layout.analytics.bottom);
  expect(layout.mainModules.top - layout.analytics.bottom, "四模塊總覽與主要入口不可有大空白").toBeLessThanOrEqual(12);
  expect(layout.supportModules.top).toBeGreaterThanOrEqual(layout.mainModules.bottom);
  expect(layout.supportModules.top - layout.mainModules.bottom, "主要入口與支援入口不可有大空白").toBeLessThanOrEqual(12);
  expect(layout.supportModules.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.firstScreen.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(
    layout.viewportHeight - layout.supportModules.bottom,
    "桌機首屏底部不得留下明顯空白",
  ).toBeLessThanOrEqual(Math.max(24, layout.viewportHeight * 0.03));
  expect(layout.mainModules.height).toBeGreaterThanOrEqual(150);
  expect(layout.supportModules.height).toBeGreaterThanOrEqual(80);
  expect(layout.topbarActions.length, "桌機頂欄必須有八個真實功能入口").toBe(8);
  for (let index = 1; index < layout.topbarActions.length; index += 1) {
    expect(
      layout.topbarActions[index].left,
      `桌機頂欄第 ${index + 1} 個入口不得與前一個重疊`,
    ).toBeGreaterThanOrEqual(layout.topbarActions[index - 1].right - 1);
  }
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
  await expectMinimumHeight(gate.locator('a[href="index.html"]'), 44, "康節密碼門返回首頁");

  await gate.locator('[name="password"]').fill("0000");
  await gate.locator('button[type="submit"]').click();

  await expect(gate).toBeHidden();
  await expect(page.locator("[data-protected-content]")).not.toHaveAttribute("aria-hidden", "true");
}

async function verifyKangjie(page) {
  await page.goto("kangjie.html#meihua", { waitUntil: "networkidle" });
  await unlockKangjie(page);

  const tabs = page.locator("[data-kangjie-tab]");
  await expect(tabs).toHaveCount(4);
  await expectMinimumHeight(tabs, 44, "康節主分頁");
  await expectMinimumHeight(page.locator(".kangjie-wordmark, .kangjie-shell .topbar > div a"), 44, "康節頂欄連結");

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
    [".kangjie-panel-heading > p", ".form-intro p", ".form-note", ".current-time-copy strong"],
    16,
    "康節一般說明",
  );
  await expectReadableSamples(page, [".current-time-copy > span"], 14, "康節時間標籤");

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

test("桌機未分析只顯示占位，1990-07-12 顯示可核對的真實結果", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const analytics = page.locator("[data-ui-region='desktop-analytics']");
  await expect(analytics).toBeVisible();
  await expect(analytics.locator(":scope > article")).toHaveCount(4);
  await expect(page.locator("[data-analytics-status]")).toHaveText("待分析");
  await expect(page.locator("[data-analytics-state]")).toHaveText("等待輸入");
  await expect(page.locator("[data-analytics-core]")).toHaveText("－");
  await expect(page.locator("[data-analytics-core-large]")).toHaveText("－");
  await expect(page.locator("[data-analytics-annual]")).toHaveText("－");
  await expect(page.locator("[data-preview-value]")).toHaveText(["－", "－", "－", "－"]);
  await expect(page.locator("[data-digit-bar] em")).toHaveText(Array.from({ length: 9 }, () => "0"));

  await page.locator("#birthday-input").fill("1990-07-12");
  await page.locator("#analyze-button").click();

  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await expect(page.locator("[data-analytics-status]")).toHaveText("生日分析完成");
  await expect(page.locator("[data-analytics-state]")).toHaveText("結果已更新");
  await expect(page.locator("[data-analytics-core]")).toHaveText("2");
  await expect(page.locator("[data-analytics-core-large]")).toHaveText("2");
  await expect(page.locator("[data-analytics-annual]")).toHaveText("2");
  await expect(page.locator('[data-preview-value="primary"]')).toHaveText("2");
  await expect(page.locator('[data-preview-value="secondary"]')).toHaveText("12 → 3");
  await expect(page.locator('[data-preview-value="tertiary"]')).toHaveText("1");
  await expect(page.locator('[data-preview-value="annual"]')).toHaveText("2");
  await expect(page.locator("[data-digit-bar] em")).toHaveText([
    "2", "1", "0", "0", "0", "0", "1", "0", "2",
  ]);
  await expect(page.locator("[data-analytics-distribution-title]")).toHaveText("生日數字分佈");
  await expectNoHorizontalOverflow(page);
});

test("桌機側欄生日 CTA 空白時選完日期自動分析，已有日期時直接送出", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const sidebarCta = page.locator(".sidebar-primary");
  const birthdayInput = page.locator("#birthday-input");
  await expect(sidebarCta).toBeVisible();
  await expect(birthdayInput).toHaveValue("");

  await page.locator('[data-mode-label="code"]').click();
  await sidebarCta.click();
  await expect(page.locator('input[name="analysis-mode"][value="birthday"]')).toBeChecked();
  await expect(birthdayInput).toBeFocused();
  await expect(page.locator("#result-anchor")).toBeEmpty();
  await expect(page.locator("#input-help")).toContainText("選好後會立即完成分析");

  await birthdayInput.fill("1990-07-12");
  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await expect(page.locator("[data-analytics-status]")).toHaveText("生日分析完成");
  await expect(page.locator("[data-analytics-core]")).toHaveText("2");

  await page.locator('[data-mode-label="code"]').click();
  await sidebarCta.click();
  await expect(page.locator('input[name="analysis-mode"][value="birthday"]')).toBeChecked();
  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await expectNoHorizontalOverflow(page);
});

test("生命路徑、流年、九宮與工作台入口各自直達真實內容並可返回", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const topbarEntries = page.locator(".topbar-actions > a");
  await expect(topbarEntries).toHaveCount(8);
  await expect(topbarEntries).toHaveText([
    "生日分析",
    "生命路徑",
    "數字頻譜",
    "九宮配置",
    "流年分析",
    "專業工作台",
    "規則來源",
    "本機隱私",
  ]);

  await topbarEntries.nth(1).click();
  await expect(page.locator("#birthday-input")).toBeFocused();
  await page.locator("#birthday-input").fill("1990-07-12");
  await expect(page.locator("#result-life-path")).toBeVisible();
  await expect(page.locator("#result-life-path")).toBeInViewport();

  await topbarEntries.nth(4).click();
  await expect(page.locator("#result-annual-cycle")).toBeVisible();
  await expect(page.locator("#result-annual-cycle")).toBeInViewport();

  await topbarEntries.nth(3).click();
  await expect(page.locator("#result-nine-grid")).toHaveAttribute("open", "");
  await expect(page.locator("#result-nine-grid")).toBeInViewport();

  await topbarEntries.nth(5).click();
  await expect(page).toHaveURL(/#numerology-workspace$/);
  await expect(page.locator('[data-workspace-tab="home"]')).toHaveAttribute("aria-selected", "true");
  const workspaceReturn = page.locator(".workspace-return");
  await expect(workspaceReturn).toBeVisible();
  await expectMinimumHeight(workspaceReturn, 44, "工作台返回分析台");
  await workspaceReturn.click();
  await expect(page).toHaveURL(/#analyzer$/);
  await expect(page.locator("#analyzer")).toBeInViewport();
  await expectNoHorizontalOverflow(page);
});

test("三數取卦總覽只稱輸入次數，不冒充能量分布", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  await page.locator('[data-mode-label="iching"]').click();
  const accessDialog = page.locator("#iching-access-dialog");
  await expect(accessDialog).toBeVisible();
  await accessDialog.locator("#iching-access-password").fill("0000");
  await accessDialog.locator('button[type="submit"]').click();
  await expect(page.locator('input[name="analysis-mode"][value="iching"]')).toBeChecked();

  const distributionTitle = page.locator("[data-analytics-distribution-title]");
  await expect(distributionTitle).toHaveText("數字出現次數");
  await expect(distributionTitle).not.toContainText(/能量分[布佈]/);

  const ichingInputs = page.locator(".iching-input");
  await ichingInputs.nth(0).fill("9");
  await ichingInputs.nth(1).fill("13");
  await ichingInputs.nth(2).fill("20");
  await page.locator("#analyze-button").click();

  await expect(page.locator("#result-anchor")).toContainText("本卦");
  await expect(page.locator("#result-anchor")).toContainText("互卦");
  await expect(page.locator("#result-anchor")).toContainText("變卦");
  await expect(page.locator("[data-analytics-status]")).toHaveText("三數取卦完成");
  await expect(page.locator("[data-analytics-core]")).not.toHaveText("");
  await expect(page.locator("[data-analytics-core]")).not.toHaveText("－");
  await expect(distributionTitle).toHaveText("輸入數字出現次數");
  await expect(distributionTitle).not.toContainText(/能量分[布佈]/);
  await expect(page.locator("[data-analytics-annual]")).toHaveText("不適用");
  await expectNoHorizontalOverflow(page);
});

for (const viewport of VIEWPORTS) {
  test(`${viewport.label} ${viewport.width}×${viewport.height} 維持緊湊、可讀且可操作`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await verifyHomepage(page);
    await verifyKangjie(page);
  });
}

for (const viewport of [
  { width: 1672, height: 941 },
  { width: 1920, height: 1080 },
]) {
  test(`首頁第一屏 ${viewport.width}×${viewport.height} 完整顯示所有主要模塊`, async ({ page }) => {
    await expectDenseDesktopFirstFold(page, viewport.width, viewport.height);
  });
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 390, height: 693 },
  { width: 360, height: 800 },
  { width: 320, height: 720 },
]) {
  test(`手機首屏 ${viewport.width}×${viewport.height} 完整顯示四模式、表單、四摘要與八功能`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("index.html", { waitUntil: "networkidle" });
    await expectReferenceMobileDashboard(page);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `output/playwright/home-reference-mobile-${viewport.width}x${viewport.height}.png`,
      fullPage: false,
    });
  });
}
