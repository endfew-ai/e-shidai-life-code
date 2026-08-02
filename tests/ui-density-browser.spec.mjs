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
  if (page.viewportSize().height <= 680) {
    await expect(proof).toBeHidden();
    const compactReport = await page.evaluate(() => {
      const hero = document.querySelector(".dashboard-home-screen .hero").getBoundingClientRect();
      const title = document.querySelector(".dashboard-home-screen .hero-title").getBoundingClientRect();
      const summary = document.querySelector(".dashboard-home-screen .hero-summary").getBoundingClientRect();
      return {
        titleTop: title.top - hero.top,
        summaryBottom: hero.bottom - summary.bottom,
        titleSummaryGap: summary.top - title.bottom,
      };
    });
    expect(compactReport.titleTop, "短高桌機主標不得超出主視覺上緣").toBeGreaterThanOrEqual(-1);
    expect(compactReport.summaryBottom, "短高桌機說明不得超出主視覺下緣").toBeGreaterThanOrEqual(1);
    expect(compactReport.titleSummaryGap, "短高桌機主標與說明不得重疊").toBeGreaterThanOrEqual(0);
    return;
  }
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
      atlasVisibleCount: [...document.querySelectorAll(".mobile-function-atlas > a")]
        .filter((element) => element.getBoundingClientRect().width > 0).length,
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
  expect(report.cockpitColumns, "手機四項結果應維持單列四欄").toBe(4);
  expect(report.cockpitHeight, "手機即時摘要不得退化成過長四列").toBeLessThanOrEqual(92);
  expect(report.desktopAnalyticsDisplay, "手機不得重複顯示桌機四模塊總覽").toBe("none");
  expect(report.atlasColumns, "手機十八個輔助入口應採四欄密集排列").toBe(4);
  expect(report.atlasCount, "DOM 必須保留二十二個唯一功能入口").toBe(22);
  expect(report.atlasVisibleCount, "四個主要模式置頂後，功能總覽不得再重複顯示").toBe(18);
  expect(report.atlasBottom, "手機首屏必須完整顯示十八個輔助入口").toBeLessThanOrEqual(report.viewportHeight - 4);
  expect(report.workspaceTabColumns, "手機工作台分頁應採三欄兩列").toBe(3);
  expect(report.workspaceEntryColumns, "手機工作台六入口應採兩欄三列").toBe(2);
  expect(Math.max(...report.workspaceEntryHeights), "手機工作台入口不得過度拉長").toBeLessThanOrEqual(180);
  expect(report.modeArtDisplay, "手機不重複顯示當前模式橫幅").toBe("none");
  expect(report.moduleRailDisplay, "手機以十八格輔助總覽取代過長卡片牆").toBe("none");
  await expectReadableSamples(
    page,
    [".cockpit-status small"],
    12,
    "手機結果與即時狀態標籤",
  );
  await expectReadableSamples(page, [".mobile-function-atlas strong"], page.viewportSize().width <= 360 ? 13 : 14, "手機功能標籤");
}

async function expectReferenceMobileDashboard(page) {
  await expect(page.locator(".dashboard-home-screen .hero")).toBeHidden();
  await expect(page.locator("[data-ui-region='desktop-analytics']")).toBeHidden();
  await expect(page.locator("[data-ui-region='mode-deck']")).toBeVisible();
  await expect(page.locator(".cockpit-live-rail")).toBeHidden();
  await expect(page.locator(".cockpit-status > article")).toHaveCount(4);
  await expect(page.locator(".mobile-function-atlas")).toBeVisible();
  await expect(page.locator(".mobile-function-atlas > a")).toHaveCount(22);
  await expect(page.locator(".visual-module-rail")).toBeHidden();
  await expectImageAssetLoads(
    page,
    "public/visuals/ai-dashboard/reference-v10/analytics-instrument-triad-v10.webp",
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
    const liveRail = document.querySelector(".cockpit-live-rail");
    const portalImages = [...document.querySelectorAll(".mode-switch .mode-card-art")];
    const cockpitCells = [...document.querySelectorAll(".cockpit-status > article")];
    const atlasAllLinks = [...document.querySelectorAll(".mobile-function-atlas > a")];
    const atlasLinks = atlasAllLinks.filter((card) => card.getBoundingClientRect().width > 0);
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
      atlasCount: atlasAllLinks.length,
      atlasVisibleCount: atlasLinks.length,
      atlasColumns: getComputedStyle(document.querySelector(".mobile-function-atlas"))
        .gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      atlasWidthSpread: atlasRects.length
        ? Math.max(...atlasRects.map((box) => box.width)) - Math.min(...atlasRects.map((box) => box.width))
        : null,
      atlasCentersAreClickable: atlasLinks.map(centerOwnsPoint),
      atlasImageState: atlasLinks.map((card) => card.querySelector("img")).map((image) => ({
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
      liveRailHeight: liveRail.getBoundingClientRect().height,
    };
  });

  expect(report.modeEntryCount, "手機必須有四個功能入口").toBe(4);
  expect(report.modeEntryTopSpread, "手機四個功能入口必須同列").toBeLessThanOrEqual(1);
  expect(report.cockpitCount, "手機摘要必須正好四格").toBe(4);
  expect(report.cockpitColumns, "手機四項結果必須排成單列四欄").toBe(4);
  expect(report.analyzer).not.toBeNull();
  expect(report.cockpit).not.toBeNull();
  expect(report.atlas).not.toBeNull();
  expect(report.methodSource).not.toBeNull();
  expect(report.cockpit.top, "摘要區必須接在分析器後方").toBeGreaterThanOrEqual(report.analyzer.bottom);
  expect(report.cockpit.top - report.analyzer.bottom, "分析器與摘要區不可出現大空白").toBeLessThanOrEqual(12);
  expect(report.atlas.top, "十八格輔助總覽必須接在摘要後方").toBeGreaterThanOrEqual(report.cockpit.bottom);
  expect(report.atlas.top - report.cockpit.bottom, "摘要與十八格輔助總覽不可出現大空白").toBeLessThanOrEqual(12);
  expect(report.methodSource.top, "規則來源必須接在十八格輔助總覽後方").toBeGreaterThanOrEqual(report.atlas.bottom);
  expect(report.methodSource.top - report.atlas.bottom, "十八格輔助總覽與規則來源不可出現大空白").toBeLessThanOrEqual(16);
  expect(report.atlasCount, "DOM 必須保留二十二個唯一功能入口").toBe(22);
  expect(report.atlasVisibleCount, "四個主要模式置頂後只顯示十八個不重複輔助入口").toBe(18);
  expect(report.atlasColumns, "手機十八個輔助入口必須排成四欄").toBe(4);
  expect(report.atlasWidthSpread, "手機十八格入口寬度必須一致").toBeLessThanOrEqual(2);
  expect(report.atlas.bottom, "手機首屏必須完整顯示十八個輔助入口")
    .toBeLessThanOrEqual(report.viewportHeight - 4);
  expect(report.modeCentersAreClickable.every(Boolean), "四個模式入口中央不得被裝飾圖遮住").toBe(true);
  expect(report.atlasCentersAreClickable.every(Boolean), "十八格輔助入口中央不得被裝飾圖遮住").toBe(true);
  expect(report.atlasImageState.length, "手機必須載入十八張可見輔助功能徽章").toBe(18);
  expect(
    report.atlasImageState.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
    "手機十八張可見 AI 功能徽章都必須完成載入",
  ).toBe(true);
  expect(report.liveRailHeight, "手機移除重複即時狀態列以節省高度").toBe(0);
  for (const image of report.portalImageState) {
    expect(image.complete).toBe(true);
    expect(image.naturalWidth, "四個 AI 圓盤圖必須載入").toBeGreaterThan(0);
    expect(image.width, "四個模式辨識圖寬度").toBeGreaterThanOrEqual(24);
    expect(image.height, "四個模式辨識圖高度").toBeGreaterThanOrEqual(24);
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

  await expect(page.locator("[data-ui-region='mode-deck']")).toBeVisible();
  await expectMinimumHeight(page.locator("[data-mode-label], .kangjie-mode-entry"), 44, "首頁模式入口");
  if (page.viewportSize().width > 1180) {
    await expectMinimumHeight(page.locator(".topbar-actions > a, .sidebar-quick a"), 44, "桌機功能入口");
  }
  await expectMinimumHeight(submit, 44, "首頁主要分析按鈕");
  const readableSelectors = page.viewportSize().width <= 767
    ? [".field-block > span", ".mobile-function-atlas strong"]
    : [".field-block > span", ".form-meta p", ".function-command-grid strong"];
  await expectReadableSamples(
    page,
    readableSelectors,
    page.viewportSize().width <= 360 ? 13 : 14,
    "首頁一般說明",
  );

  if (page.viewportSize().width > 1180) {
    await page.locator(".topbar-actions > a").nth(2).click();
  } else {
    await page.locator('[data-mode-label="code"]').click();
  }
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
  await expect(page.locator('[data-cockpit-result-label="primary"]')).toHaveText("生命路徑數");
  await expect(page.locator('[data-cockpit-result-value="primary"]')).toHaveText("2");
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
    const moduleGrid = await page.locator(".function-command-grid").evaluate((element) => {
      const children = [...element.children].filter((child) => child.getBoundingClientRect().width > 0);
      return {
        viewportWidth: window.innerWidth,
        columnCount: getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
        minimumCardWidth: Math.min(...children.map((child) => child.getBoundingClientRect().width)),
      };
    });
    expect(moduleGrid.columnCount).toBe(6);
    expect(moduleGrid.minimumCardWidth).toBeGreaterThanOrEqual(moduleGrid.viewportWidth <= 1180 ? 80 : 120);
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
  await expect(page.locator(".function-command-grid > a")).toHaveCount(22);
  await expect(page.locator(".function-command-grid > a:visible")).toHaveCount(18);
  await expect(page.locator(".function-command-grid")).toBeVisible();
  await expect(page.locator(".visual-module-rail")).toBeHidden();
  await expect(page.locator(".dashboard-home-screen .hero-art"))
    .toHaveAttribute("src", /reference-v10\/hero-celestial-command-v10\.webp/);
  await expect(page.locator(".dashboard-home-screen .hero-title img"))
    .toHaveAttribute("src", /reference-v4\/hero-title-calligraphy-v4\.png/);
  await expectImageAssetLoads(
    page,
    "public/visuals/ai-dashboard/reference-v10/hero-celestial-command-v10.webp",
    "桌機主視覺圖",
  );
  for (const [path, label] of [
    ["public/visuals/ai-dashboard/reference-v4/hero-title-calligraphy-v4.png", "黃金毛筆主標"],
    ["public/visuals/ai-dashboard/reference-v10/analytics-instrument-triad-v10.webp", "新版分析儀表"],
    ["public/visuals/ai-dashboard/reference-v10/sidebar-three-step-rail-v10.webp", "側欄三步流程"],
    ["public/visuals/ai-dashboard/reference-v10/name-stroke-workbench-v10.webp", "姓名筆畫工作台"],
    ["public/visuals/ai-dashboard/reference-v10/local-history-vault-v10.webp", "本機紀錄與隱私庫"],
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
      commandModules: rect(".dashboard-home-screen .function-command-grid"),
      commandModuleColumns: getComputedStyle(document.querySelector(".function-command-grid"))
        .gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      commandModuleHeights: [...document.querySelectorAll(".function-command-grid > a")]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => element.getBoundingClientRect().height),
      topbarActions: [...document.querySelectorAll(".topbar-actions > a")].map((element) => rect(
        `.topbar-actions > a:nth-child(${[...element.parentElement.children].indexOf(element) + 1})`,
      )),
      viewportHeight: window.innerHeight,
    };
  });

  for (const key of ["lead", "hero", "analyzer", "analytics", "commandModules"]) {
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
  expect(layout.commandModules.top).toBeGreaterThanOrEqual(layout.analytics.bottom);
  expect(layout.commandModules.top - layout.analytics.bottom, "四模塊總覽與十八個輔助入口不可有大空白").toBeLessThanOrEqual(12);
  expect(layout.commandModules.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(
    layout.viewportHeight - layout.commandModules.bottom,
    "桌機首屏底部不得留下明顯空白",
  ).toBeLessThanOrEqual(Math.max(80, layout.viewportHeight * 0.1));
  expect(layout.commandModuleColumns, "桌機十八個輔助入口必須排成六欄三列").toBe(6);
  expect(Math.min(...layout.commandModuleHeights), "桌機功能模塊高度").toBeGreaterThanOrEqual(80);
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
  await expect(page.locator("[data-digit-bar] em")).toHaveText(Array.from({ length: 9 }, () => "－"));
  await expect(page.locator(".digit-bars")).toHaveClass(/is-empty/);
  await expect(page.locator(".digit-bars")).toHaveAttribute(
    "aria-label",
    "尚未分析，輸入資料後顯示數字一至九的出現次數",
  );

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

  await page.locator(".topbar-actions > a").nth(2).click();
  await sidebarCta.click();
  await expect(page.locator('input[name="analysis-mode"][value="birthday"]')).toBeChecked();
  await expect(birthdayInput).toBeFocused();
  await expect(page.locator("#result-anchor")).toBeEmpty();
  await expect(page.locator("#input-help")).toContainText("選好後會立即完成分析");
  await expect(page.locator("#analyzer-form")).toHaveClass(/is-awaiting-birthday/);

  await birthdayInput.fill("1990-07-12");
  await expect(page.locator("#analyzer-form")).not.toHaveClass(/is-awaiting-birthday/);
  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await expect(page.locator("[data-analytics-status]")).toHaveText("生日分析完成");
  await expect(page.locator("[data-analytics-core]")).toHaveText("2");

  await page.locator(".topbar-actions > a").nth(2).click();
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

  await topbarEntries.nth(0).click();
  await expect(page.locator("#birthday-input")).toBeFocused();
  await expect(page.locator("#analyzer-form")).toHaveClass(/is-awaiting-birthday/);
  await page.locator("#birthday-input").fill("1990-07-12");
  await expect(page.locator("#result-life-path")).toBeVisible();

  await topbarEntries.nth(2).click();
  await expect(page.locator('input[name="analysis-mode"][value="code"]')).toBeChecked();
  await expect(page.locator("#number-code")).toBeVisible();

  await topbarEntries.nth(1).click();
  await expect(page.locator("#birthday-input")).toBeFocused();
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

  await topbarEntries.nth(6).click();
  await expect(page).toHaveURL(/#method-source$/);
  await expect(page.locator("#method-source")).toBeInViewport();

  await topbarEntries.nth(7).click();
  await expect(page).toHaveURL(/#privacy-section$/);
  await expect(page.locator("#privacy-section")).toBeInViewport();
  await expectNoHorizontalOverflow(page);
});

test("三數取卦總覽只稱輸入次數，不冒充能量分布", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  await page.locator(".sidebar-quick a[data-quick-mode='iching']").click();
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

test("平板摘要完整可讀、來源區緊接模塊且三數輸入至少 44px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const tabletLayout = await page.evaluate(() => {
    const cockpit = document.querySelector(".cockpit-status");
    const rail = document.querySelector(".function-command-grid").getBoundingClientRect();
    const source = document.querySelector(".method-source > details").getBoundingClientRect();
    const textSamples = [...cockpit.querySelectorAll("strong, em")].map((element) => ({
      text: element.textContent.trim(),
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    return {
      cockpitColumns: getComputedStyle(cockpit).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      sourceGap: source.top - rail.bottom,
      textSamples,
    };
  });

  expect(tabletLayout.cockpitColumns, "768px 平板四項結果必須維持單列四欄").toBe(4);
  expect(tabletLayout.sourceGap, "平板模塊與規則來源不可留下大空白").toBeLessThanOrEqual(16);
  for (const sample of tabletLayout.textSamples) {
    expect(
      sample.scrollWidth <= sample.clientWidth + 1 && sample.scrollHeight <= sample.clientHeight + 2,
      `平板摘要文字不得被裁切：${sample.text}（寬 ${sample.clientWidth}/${sample.scrollWidth}；高 ${sample.clientHeight}/${sample.scrollHeight}）`,
    ).toBe(true);
  }

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("index.html", { waitUntil: "networkidle" });
  await page.locator('[data-mode-label="iching"]').click();
  const accessDialog = page.locator("#iching-access-dialog");
  await expect(accessDialog).toBeVisible();
  await accessDialog.locator("#iching-access-password").fill("0000");
  await accessDialog.locator('button[type="submit"]').click();
  await expectMinimumHeight(page.locator(".iching-input"), 44, "平板三數取卦輸入框");

  const compactTabletGap = await page.evaluate(() => {
    const rail = document.querySelector(".function-command-grid").getBoundingClientRect();
    const source = document.querySelector(".method-source > details").getBoundingClientRect();
    return source.top - rail.bottom;
  });
  expect(compactTabletGap, "1024px 平板模塊與規則來源不可留下大空白").toBeLessThanOrEqual(16);
  await expectNoHorizontalOverflow(page);
});

test("短高桌機三數取卦維持橫排標籤、完整提示與 44px 操作區", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 790 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const proofFontSizes = await page.locator(".hero-proof li > span, .hero-proof small").evaluateAll(
    (elements) => elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  );
  expect(proofFontSizes).toHaveLength(6);
  expect(proofFontSizes.every((size) => size >= 12), "短高桌機的主視覺證明卡文字至少 12px").toBe(true);

  await page.locator(".sidebar-quick a[data-quick-mode='iching']").click();
  const accessDialog = page.locator("#iching-access-dialog");
  await expect(accessDialog).toBeVisible();
  await accessDialog.locator("#iching-access-password").fill("0000");
  await accessDialog.locator('button[type="submit"]').click();

  const compactIChing = await page.evaluate(() => {
    const controls = document.querySelector(".analyzer-card[data-active-mode='iching'] .mode-controls");
    const analyzer = document.querySelector(".analyzer-card");
    const controlsRect = controls.getBoundingClientRect();
    const analyzerRect = analyzer.getBoundingClientRect();
    const fields = [...controls.querySelectorAll(".triple-input-grid .field-block")].map((field) => {
      const label = field.querySelector(":scope > span");
      const sensor = field.querySelector(".iching-sensor-art");
      const input = field.querySelector(".iching-input");
      const labelRect = label.getBoundingClientRect();
      const sensorRect = sensor.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      return {
        labelClientWidth: label.clientWidth,
        labelScrollWidth: label.scrollWidth,
        labelClientHeight: label.clientHeight,
        labelScrollHeight: label.scrollHeight,
        labelWritingMode: getComputedStyle(label).writingMode,
        sensorWidth: sensorRect.width,
        sensorBottom: sensorRect.bottom,
        labelTop: labelRect.top,
        labelBottom: labelRect.bottom,
        inputTop: inputRect.top,
        inputHeight: inputRect.height,
      };
    });
    const help = controls.querySelector(".form-meta");
    return {
      controlsBottom: controlsRect.bottom,
      analyzerBottom: analyzerRect.bottom,
      fields,
      helpClientWidth: help.clientWidth,
      helpScrollWidth: help.scrollWidth,
    };
  });

  expect(compactIChing.controlsBottom).toBeLessThanOrEqual(compactIChing.analyzerBottom + 1);
  expect(compactIChing.helpScrollWidth, "短高桌機的三數提示不可被裁切").toBeLessThanOrEqual(compactIChing.helpClientWidth + 1);
  for (const field of compactIChing.fields) {
    expect(field.labelWritingMode).toBe("horizontal-tb");
    expect(field.labelScrollWidth).toBeLessThanOrEqual(field.labelClientWidth + 1);
    expect(field.labelScrollHeight).toBeLessThanOrEqual(field.labelClientHeight + 2);
    expect(field.sensorWidth).toBeGreaterThanOrEqual(36);
    expect(field.sensorBottom).toBeLessThanOrEqual(field.labelTop + 1);
    expect(field.labelBottom).toBeLessThanOrEqual(field.inputTop + 1);
    expect(field.inputHeight).toBeGreaterThanOrEqual(44);
  }
  await expectMinimumHeight(page.locator("#analyze-button"), 44, "短高桌機三數取卦按鈕");
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "output/playwright/home-iching-analyzer-short-1536.png",
    fullPage: false,
  });
});

test("桌機 AI 模塊清楚可辨、短畫面去除重複側欄且高畫面填滿工具區", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 790 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  await expect(page.locator(".sidebar-links")).toBeHidden();
  await expect(page.locator(".sidebar-start-guide")).toBeVisible();
  await expect(page.locator(".sidebar-start-guide li")).toHaveText([
    "1選擇出生日期按上方金色按鈕",
    "2自動完成演算選好日期不必再按一次",
    "3查看完整算式生命路徑、九宮與流年",
  ]);
  await expectMinimumHeight(page.locator(".topbar-actions img"), 30, "桌機頂欄 AI 功能圖");
  const compactFinish = await page.evaluate(() => {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const version = document.querySelector(".sidebar-version").getBoundingClientRect();
    const modeDeck = document.querySelector(".mode-switch");
    const supportLists = [...document.querySelectorAll(".support-module-grid ul")];
    const quickSmall = [...document.querySelectorAll(".sidebar-quick small")];
    return {
      modeDeckDisplay: getComputedStyle(modeDeck).display,
      visibleSupportLists: supportLists.filter((list) => getComputedStyle(list).display !== "none").length,
      visibleSupportItems: [...document.querySelectorAll(".support-module-grid li")]
        .filter((item) => getComputedStyle(item).display !== "none" && item.getClientRects().length > 0).length,
      minimumQuickSmallFont: Math.min(...quickSmall.map((node) => Number.parseFloat(getComputedStyle(node).fontSize))),
      sidebarClientHeight: sidebar.clientHeight,
      sidebarScrollHeight: sidebar.scrollHeight,
      versionBottom: version.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(compactFinish.modeDeckDisplay, "桌機分析器必須直接顯示四模式列").toBe("grid");
  expect(compactFinish.visibleSupportLists).toBe(0);
  expect(compactFinish.visibleSupportItems).toBe(0);
  expect(compactFinish.minimumQuickSmallFont).toBeGreaterThanOrEqual(12);
  expect(compactFinish.sidebarScrollHeight).toBeLessThanOrEqual(compactFinish.sidebarClientHeight + 1);
  expect(compactFinish.versionBottom).toBeLessThanOrEqual(compactFinish.viewportHeight + 1);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("index.html", { waitUntil: "networkidle" });
  const tallSidebar = await page.evaluate(() => {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const quickGrid = document.querySelector(".sidebar-quick > div");
    const quick = quickGrid.getBoundingClientRect();
    const guide = document.querySelector(".sidebar-start-guide").getBoundingClientRect();
    const status = document.querySelector(".sidebar-status").getBoundingClientRect();
    const version = document.querySelector(".sidebar-version").getBoundingClientRect();
    return {
      columns: getComputedStyle(quickGrid).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      blankGap: status.top - guide.bottom,
      guideGap: guide.top - quick.bottom,
      minimumIcon: Math.min(...[...quickGrid.querySelectorAll("img")]
        .map((image) => image.getBoundingClientRect().width)),
      sidebarClientHeight: sidebar.clientHeight,
      sidebarScrollHeight: sidebar.scrollHeight,
      versionBottom: version.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(tallSidebar.columns).toBe(2);
  expect(tallSidebar.minimumIcon).toBeGreaterThanOrEqual(42);
  expect(tallSidebar.guideGap).toBeLessThanOrEqual(12);
  expect(tallSidebar.blankGap, "高畫面側欄操作指南下方不應留下大片空白").toBeLessThanOrEqual(36);
  expect(tallSidebar.sidebarScrollHeight).toBeLessThanOrEqual(tallSidebar.sidebarClientHeight + 1);
  expect(tallSidebar.versionBottom).toBeLessThanOrEqual(tallSidebar.viewportHeight + 1);
  await expectNoHorizontalOverflow(page);
});

for (const viewport of [
  { width: 1672, height: 941 },
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1536, height: 790 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1280, height: 640 },
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
  test(`手機首屏 ${viewport.width}×${viewport.height} 完整顯示四模式、表單、四結果與十八個不重複輔助功能`, async ({ page }) => {
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
