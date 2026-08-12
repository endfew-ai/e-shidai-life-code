import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Taipei" });

test.beforeEach(async ({ page }) => {
  await page.route("https://page-views-api.ratneshc.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(route.request().url().includes("/track?") ? { success: true } : { views: 1062 }),
  }));
});

function collectBrowserErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
}

async function openWorkspaceView(page, view) {
  await page.locator(`[data-workspace-tab="${view}"]`).click();
  await expect(page.locator(`[data-workspace-view="${view}"]`)).toBeVisible();
}

test("rule settings switch the birthday engine between new and legacy results", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  const workspace = page.locator("#numerology-workspace");
  await expect(workspace).toBeVisible();
  await expect(workspace).toContainText("進階靈數工作台");
  await expect(workspace.locator("[data-workspace-clock]")).not.toBeEmpty();
  await workspace.screenshot({ path: "output/playwright/numerology-workspace-desktop-1440.png" });

  await openWorkspaceView(page, "settings");
  const form = workspace.locator("[data-settings-form]");
  await form.locator('[name="ruleSetId"]').selectOption("legacy-project-v1");
  await form.locator('button[type="submit"]').click();
  await expect(workspace.locator("[data-settings-status]")).toContainText("舊版相容規則");

  await page.locator("#birthday-input").fill("1950-05-22");
  await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
  await expect(page.locator("#result-anchor .metric-card").first()).toContainText("33／6");
  await expect(page.locator('[data-current-number-guide="6"]')).toContainText("6・照顧者*｜代表關愛");
  await expect(page.locator("#result-anchor")).toContainText("舊版月、日、年分段化簡");

  await openWorkspaceView(page, "settings");
  await form.locator('[name="ruleSetId"]').selectOption("uploaded-material-v2");
  await form.locator('button[type="submit"]').click();
  await expect(workspace.locator("[data-settings-status]")).toContainText("教材可追溯規則");

  await page.locator("#birthday-input").fill("1950-05-22");
  await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
  await expect(page.locator("#result-anchor .metric-card").first()).toContainText("6");
  await expect(page.locator("#result-anchor")).toContainText("YYYYMMDD 全部數字加總");
  await page.locator("#result-anchor .digit-distribution > summary").click();
  await expect(page.locator("#result-anchor .grid-line-summary")).toBeVisible();

  await openWorkspaceView(page, "history");
  await expect(workspace.locator("[data-history-list]")).toContainText("1950-05-22");
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("上傳教材 1 至 9 可直觀看到亞當與獨立，命數與連線可核對", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await page.locator("#birthday-input").fill("1959-10-25");
  await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());

  const fixedGuide = page.locator("[data-current-number-guide]");
  await expect(fixedGuide).toBeVisible();
  await expect(fixedGuide).toHaveAttribute("data-current-number-guide", "5");
  await expect(fixedGuide.locator("h3")).toHaveText("5・口｜代表口語表達");
  await expect(fixedGuide).toContainText("重視口語表達與口才");
  await expect(fixedGuide).toContainText("核心特質");
  await expect(fixedGuide).toContainText("互動方式");
  await expect(fixedGuide).toContainText("工作觀察");
  await expect(fixedGuide).toContainText("需要留意");
  await expect(fixedGuide).toContainText("生日八位數加總化簡 → 生命靈數基底 5");
  await expect(fixedGuide).toContainText("原教材常用語");
  await expect(fixedGuide).toContainText("有美食");
  await expect(fixedGuide).toContainText("不作醫療、升遷、宗教眷顧或命定保證");
  const desktopPlacement = await page.locator("#result-anchor .result-hero").evaluate((hero) => {
    const copy = hero.querySelector(".result-copy").getBoundingClientRect();
    const guide = hero.querySelector("[data-current-number-guide]").getBoundingClientRect();
    const button = hero.querySelector(".result-actions-top").getBoundingClientRect();
    const outer = hero.getBoundingClientRect();
    const overlaps = !(guide.right <= button.left || guide.left >= button.right || guide.bottom <= button.top || guide.top >= button.bottom);
    return {
      toRight: guide.left >= copy.right - 1,
      inHero: guide.left >= outer.left - 1 && guide.right <= outer.right + 1 && guide.top >= outer.top - 1 && guide.bottom <= outer.bottom + 1,
      overlaps,
    };
  });
  expect(desktopPlacement).toEqual({ toRight: true, inHero: true, overlaps: false });
  await page.locator("#result-anchor .result-hero").screenshot({ path: "output/playwright/current-number-guide-desktop-1440.png" });

  const distribution = page.locator("#result-nine-grid");
  await expect(distribution.locator(".digit-profile-strip > i")).toHaveCount(9);
  await expect(distribution.locator(".digit-profile-strip > i.is-core")).toHaveText("5");
  await distribution.locator("summary").click();
  await expect(distribution.locator(".digit-profile-strip")).toBeHidden();
  const guides = distribution.locator("[data-digit-profile]");
  await expect(guides).toHaveCount(9);
  await expect(guides.nth(0)).toContainText("1・亞當");
  await expect(guides.nth(0)).toContainText("代表獨立");
  await expect(guides.nth(4)).toHaveAttribute("aria-current", "true");
  await expect(guides.nth(4)).toContainText("你的命數");
  await expect(guides.locator(".digit-profile-count")).toHaveText([
    "生日出現 2 次", "生日出現 1 次", "生日未出現", "生日未出現", "生日出現 2 次",
    "生日未出現", "生日未出現", "生日未出現", "生日出現 2 次",
  ]);
  await expect(distribution.locator(".digit-profile-detail")).toContainText("生命靈數由生日八位數加總化簡");
  await expect(distribution.locator(".grid-line-summary")).toContainText("1-5-9・事業線／執行線（強度 2）");
  await expect(distribution.locator(".grid-line-summary")).toContainText("可觀察：工作投入、目標、成果");
  await guides.nth(0).click();
  await expect(distribution.locator(".digit-profile-detail > header")).toContainText("1・亞當｜代表獨立");
  await expect(fixedGuide).toHaveAttribute("data-current-number-guide", "5");
  await expect(distribution.locator(".digit-profile-marker")).toContainText("本站自我觀察句");
  await expect(distribution.locator(".digit-profile-label-note")).toContainText("不代表性別或人格本質");
  await expect(distribution.locator(".digit-profile-detail")).toContainText("無醫學診斷效力");
  await expect(distribution.locator(".digit-profile-editorial-legend")).toHaveText("* 本站中性摘要，非照片原文");
  await guides.nth(1).focus();
  await expect(guides.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(distribution.locator(".digit-profile-detail > header")).toContainText("2・夏娃｜代表陪伴");
  await guides.nth(0).click();
  await distribution.screenshot({ path: "output/playwright/numerology-number-guide-desktop-1440.png" });
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`1 至 9 教材總覽在 ${viewport.width}px 手機維持三欄且可閱讀`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/index.html", { waitUntil: "networkidle" });
    await page.locator("#birthday-input").fill("1959-10-25");
    await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
    const distribution = page.locator("#result-nine-grid");
    await distribution.locator("summary").click();
    await expect(distribution.locator("[data-digit-profile]")).toHaveCount(9);
    const measurements = await distribution.evaluate((node) => {
      const grid = node.querySelector(".lo-shu-grid.has-profile-overview");
      const title = node.querySelector(".digit-profile-title");
      const cells = [...node.querySelectorAll("[data-digit-profile]")];
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        numberFont: Number.parseFloat(getComputedStyle(cells[0].querySelector(".digit-profile-number")).fontSize),
        titleFont: Number.parseFloat(getComputedStyle(title).fontSize),
        countFont: Number.parseFloat(getComputedStyle(cells[0].querySelector(".digit-profile-count")).fontSize),
        minCellHeight: Math.min(...cells.map((cell) => cell.getBoundingClientRect().height)),
        cellsFit: cells.every((cell) => cell.scrollHeight <= cell.clientHeight),
      };
    });
    expect(measurements.columns).toBe(3);
    expect(measurements.numberFont).toBeGreaterThanOrEqual(16);
    expect(measurements.titleFont).toBeGreaterThanOrEqual(16);
    expect(measurements.countFont).toBeGreaterThanOrEqual(14);
    expect(measurements.minCellHeight).toBeGreaterThanOrEqual(84);
    expect(measurements.cellsFit).toBe(true);
    await distribution.screenshot({ path: `output/playwright/numerology-number-guide-mobile-${viewport.width}.png` });
    await expectNoHorizontalOverflow(page);
  });
}

for (const fixture of [
  { width: 390, height: 844, date: "1959-10-25", number: "5" },
  { width: 320, height: 568, date: "2000-01-05", number: "8" },
]) {
  test(`目前數字完整解說在 ${fixture.width}px 手機位於結果下方且不裁切`, async ({ page }) => {
    await page.setViewportSize({ width: fixture.width, height: fixture.height });
    await page.goto("/index.html", { waitUntil: "networkidle" });
    await page.locator("#birthday-input").fill(fixture.date);
    await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
    const hero = page.locator("#result-anchor .result-hero");
    const guide = page.locator("[data-current-number-guide]");
    await expect(guide).toHaveAttribute("data-current-number-guide", fixture.number);
    await expect(guide.locator(".result-current-profile__details")).not.toHaveAttribute("open", "");
    const layout = await hero.evaluate((node) => {
      const copy = node.querySelector(".result-copy").getBoundingClientRect();
      const panel = node.querySelector("[data-current-number-guide]");
      const panelBox = panel.getBoundingClientRect();
      const outer = node.getBoundingClientRect();
      const heading = panel.querySelector("h3");
      const body = panel.querySelector(".result-current-profile__summary");
      return {
        below: panelBox.top >= copy.bottom - 1,
        inHero: panelBox.bottom <= outer.bottom + 1,
        heroFits: node.scrollHeight <= node.clientHeight + 1,
        panelFits: panel.scrollWidth <= panel.clientWidth + 1 && panel.scrollHeight <= panel.clientHeight + 1,
        headingFont: Number.parseFloat(getComputedStyle(heading).fontSize),
        bodyFont: Number.parseFloat(getComputedStyle(body).fontSize),
        height: outer.height,
      };
    });
    expect(layout.below).toBe(true);
    expect(layout.inHero).toBe(true);
    expect(layout.heroFits).toBe(true);
    expect(layout.panelFits).toBe(true);
    expect(layout.headingFont).toBeGreaterThanOrEqual(20);
    expect(layout.bodyFont).toBeGreaterThanOrEqual(16);
    expect(layout.height).toBeLessThanOrEqual(fixture.height);
    await hero.screenshot({ path: `output/playwright/current-number-guide-mobile-${fixture.width}.png` });
    await expectNoHorizontalOverflow(page);
  });
}

test("號碼歸一也會自動切換右側目前數字解說", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await page.locator('input[name="analysis-mode"][value="code"]').check();
  await page.locator("#number-code").fill("128-357-649");
  await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
  const guide = page.locator("[data-current-number-guide]");
  await expect(guide).toBeVisible();
  await expect(guide.locator(".result-current-profile__eyebrow")).toHaveText("本次號碼歸一解說");
  await expect(guide).toHaveAttribute("data-current-number-guide", "9");
  await expect(guide.locator("h3")).toContainText("9・服務*");
});

test("命數數字出現四次時底條不會遮住命數標記", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await page.locator("#birthday-input").fill("1900-11-16");
  await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
  const distribution = page.locator("#result-nine-grid");
  await distribution.locator("summary").click();
  const core = distribution.locator('[data-digit-profile="1"]');
  await expect(core).toContainText("生日出現 4 次");
  await expect(core).toContainText("你的命數");
  const layout = await core.evaluate((cell) => {
    const badge = cell.querySelector(".digit-profile-core-badge");
    const bar = cell.querySelector(":scope > i");
    return {
      fits: cell.scrollHeight <= cell.clientHeight,
      badgeZ: Number.parseFloat(getComputedStyle(badge).zIndex),
      barZ: getComputedStyle(bar).zIndex,
      badgeFont: Number.parseFloat(getComputedStyle(badge).fontSize),
    };
  });
  expect(layout.fits).toBe(true);
  expect(layout.badgeZ).toBeGreaterThanOrEqual(2);
  expect(layout.barZ).toBe("auto");
  expect(layout.badgeFont).toBeGreaterThanOrEqual(14);
  await expectNoHorizontalOverflow(page);
});

test("公開計數服務離線時顯示可辨識最低值且不影響生命靈數分析", async ({ page }) => {
  await page.unroute("https://page-views-api.ratneshc.com/**");
  await page.route("https://page-views-api.ratneshc.com/**", (route) => route.abort("failed"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await expect(page.locator("[data-visit-count]")).toHaveText("222+");
  await expect(page.locator("[data-visit-counter]")).toHaveAttribute("data-quality", "verified-minimum");
  await page.locator("#birthday-input").fill("1959-10-25");
  await page.locator("#analyzer-form").evaluate((node) => node.requestSubmit());
  await expect(page.locator("#result-nine-grid")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("identity result is masked and local history never stores the full identifier", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  await openWorkspaceView(page, "identity");
  const input = page.locator("[data-identity-input]");
  await expect(input).toHaveAttribute("type", "password");
  await expect(input).toHaveAttribute("autocomplete", "off");
  await input.fill("A123456789");
  await page.locator("[data-identity-form]").evaluate((node) => node.requestSubmit());

  const result = page.locator("[data-identity-result]");
  await expect(input).toHaveValue("");
  await expect(result.locator(".advanced-result-value")).toHaveText("A12*****89");
  await expect(result).toContainText("格式與檢查碼通過");
  await expect(result).toContainText("身分證命格數列");
  await expect(result).toContainText("規則已設定");
  await expect(result.locator(".pair-card")).toHaveCount(9);
  await expect(result.locator(".timeline-list > li")).toHaveCount(10);
  await expect(result.locator(".timeline-stage-details")).toHaveCount(10);
  await expect(result.locator(".timeline-stage-counts")).toContainText("10 個階段");
  await expect(result.locator(".timeline-stage-counts")).toContainText("已分類");
  await expect(result.locator(".timeline-stage-counts")).toContainText("未分類");
  await expect(result.locator(".pair-card code").first()).toHaveText("••");
  await expect(result.locator(".timeline-list code").first()).toHaveText("••");
  expect(await result.locator(".timeline-stage-details").evaluateAll((nodes) =>
    nodes.every((node) => !node.open))).toBe(true);
  const attributeLeak = await result.evaluate((node) =>
    [...node.querySelectorAll("*")].some((element) =>
      [...element.attributes].some(({ value }) =>
        value.includes("A123456789") || value.includes("01123456789"))));
  expect(attributeLeak).toBe(false);

  const firstStage = result.locator(".timeline-stage-details").first();
  await firstStage.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(firstStage).toHaveAttribute("open", "");
  await expect(firstStage).toContainText("未分類不等於無效或負面");
  await expect(firstStage).toContainText("目前沒有符合規則的完整橋接");
  await page.keyboard.press("Enter");
  await expect(firstStage).not.toHaveAttribute("open", "");

  const secondStage = result.locator(".timeline-stage-details").nth(1);
  await secondStage.locator("summary").click();
  await expect(secondStage).toHaveAttribute("open", "");
  await expect(secondStage).toContainText("階段主題");
  await expect(secondStage).toContainText("可觀察");
  await expect(secondStage).toContainText("可運用");
  await expect(secondStage).toContainText("需要留意");
  await expect(secondStage).toContainText("前段轉接");
  await expect(secondStage).toContainText("分類依據");
  await expect(secondStage).toContainText("穩定");
  await expect(secondStage).toContainText("耐力");
  await expect(secondStage).toContainText("停滯");
  await result.screenshot({ path: "output/playwright/identity-timeline-expanded-desktop-1440.png" });

  await result.getByRole("button", { name: "全部展開" }).click();
  expect(await result.locator(".timeline-stage-details").evaluateAll((nodes) =>
    nodes.every((node) => node.open))).toBe(true);
  await result.getByRole("button", { name: "全部收合" }).click();
  expect(await result.locator(".timeline-stage-details").evaluateAll((nodes) =>
    nodes.every((node) => !node.open))).toBe(true);
  await result.screenshot({ path: "output/playwright/identity-destiny-desktop-1440.png" });
  const reveal = result.locator(".sensitive-reveal");
  await expect(reveal).toBeVisible();
  await reveal.click();
  await expect(result.locator(".advanced-result-value")).toHaveText("A123456789");
  await expect(result.locator(".pair-card code").first()).toHaveText("11");
  await expect(result.locator(".timeline-list code").first()).toHaveText("01");
  await page.evaluate(() => {
    window.print = () => {
      window.__identityPrintSnapshot = document.querySelector("[data-identity-result]")?.textContent ?? "";
      window.__identityPrintDetailsOpen = [...document.querySelectorAll("[data-identity-result] .timeline-stage-details")]
        .every((node) => node.open);
      window.__identityPrintPanelDisplay = getComputedStyle(
        document.querySelector("[data-identity-result] .timeline-stage-panel"),
      ).display;
      window.__identityPrintControlsDisplay = getComputedStyle(
        document.querySelector("[data-identity-result] .timeline-controls"),
      ).display;
    };
  });
  await page.emulateMedia({ media: "print" });
  await result.locator("[data-print-report]").evaluate((node) => node.click());
  const printSnapshot = await page.evaluate(() => window.__identityPrintSnapshot);
  expect(await page.evaluate(() => window.__identityPrintDetailsOpen)).toBe(true);
  expect(await page.evaluate(() => window.__identityPrintPanelDisplay)).toBe("grid");
  expect(await page.evaluate(() => window.__identityPrintControlsDisplay)).toBe("none");
  await page.emulateMedia({ media: "screen" });
  expect(printSnapshot).not.toContain("A123456789");
  expect(printSnapshot).not.toContain("01123456789");
  expect(printSnapshot).not.toContain("1123456789");
  await expect(result.locator(".advanced-result-value")).toHaveText("A12*****89");
  await expect(result.locator(".pair-card code").first()).toHaveText("••");
  await expect(result.locator(".timeline-list code").first()).toHaveText("••");
  expect(await result.locator(".timeline-stage-details").evaluateAll((nodes) =>
    nodes.every((node) => !node.open))).toBe(true);
  await expect(reveal).toBeEnabled();
  await expect(reveal).toHaveText("顯示完整字號 10 秒");

  const persisted = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(persisted).not.toContain("A123456789");
  expect(persisted).toContain("A12*****89");

  await openWorkspaceView(page, "history");
  await expect(page.locator("[data-history-list]")).toContainText("A12*****89");
  await expect(page.locator("[data-history-list]")).not.toContainText("A123456789");

  await openWorkspaceView(page, "sources");
  const sources = page.locator("[data-workspace-view='sources']");
  await expect(sources).toContainText("規則版本與使用界線");
  await expect(sources).toContainText("命格數列與人生階段分流");
  await expect(sources.locator(".source-ledger article")).toHaveCount(3);
  await expect(sources).not.toContainText("官方資料");
  await expect(sources).not.toContainText("尚未設定演算規則");
  await expect(page.locator("a[href='https://schema.gov.tw/lists/167']")).toHaveCount(0);
  await expect(page.locator("a[href*='gazette.nat.gov.tw']")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  expect(errors.join("\n")).not.toContain("A123456789");
  expect(errors).toEqual([]);
});

test("new and legacy foreign identity document choices keep their validation boundaries", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  await openWorkspaceView(page, "identity");
  const panel = page.locator("[data-workspace-view='identity']");
  const input = panel.locator("[data-identity-input]");
  const status = panel.locator("[data-identity-status]");

  await panel.getByText("新式外來證號", { exact: true }).click();
  await expect(panel.locator('input[value="foreign_ui_new"]')).toBeChecked();
  await expect(panel.locator("[data-identity-label]")).toHaveText("新式外來人口統一證號");
  await expect(panel.locator("[data-identity-document-help]")).toContainText("第二碼須為 8 或 9");
  await expect(input).toHaveAttribute("placeholder", "例如：A800000014");
  await input.fill("A800000014");
  await panel.locator("[data-identity-form]").evaluate((node) => node.requestSubmit());

  const result = panel.locator("[data-identity-result]");
  await expect(result.locator(".advanced-result-value")).toHaveText("A80*****14");
  await expect(result).toContainText("新式外來證號格式與檢查碼通過");
  await expect(result).toContainText("新式外來證號命格數列");
  await expect(result).toContainText("不查證號碼是否已配發或持有人身分");
  await expectNoHorizontalOverflow(page);
  await panel.screenshot({ path: "output/playwright/foreign-ui-mobile-390.png" });

  await panel.getByText("舊式外來證號", { exact: true }).click();
  await expect(panel.locator('input[value="foreign_ui_legacy"]')).toBeChecked();
  await expect(result).toBeEmpty();
  await expect(panel.locator("[data-identity-label]")).toHaveText("舊式外來人口統一證號");
  await expect(input).toHaveAttribute("placeholder", "例如：AC00000014");
  await input.fill("AC00000014");
  await panel.locator("[data-identity-form]").evaluate((node) => node.requestSubmit());
  await expect(status).toContainText("未實作其官方檢查規則");
  await expect(status).toContainText("不執行證號命格分析");
  await expect(result).toBeEmpty();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("mobile identity destiny result stays readable without horizontal overflow", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  await openWorkspaceView(page, "identity");
  await page.locator("[data-identity-input]").fill("A123456789");
  await page.locator("[data-identity-form]").evaluate((node) => node.requestSubmit());

  const result = page.locator("[data-identity-result]");
  await expect(result).toContainText("身分證命格數列");
  await expect(result.locator(".pair-card")).toHaveCount(9);
  await expect(result.locator(".timeline-list > li")).toHaveCount(10);
  const firstStage = result.locator(".timeline-stage-details").first();
  await firstStage.locator("summary").click();
  await expect(firstStage).toHaveAttribute("open", "");
  const sizes = await result.evaluate((node) => ({
    rule: Number.parseFloat(getComputedStyle(node.querySelector(".identity-destiny-rule")).fontSize),
    pair: Number.parseFloat(getComputedStyle(node.querySelector(".pair-card p")).fontSize),
    timeline: Number.parseFloat(getComputedStyle(node.querySelector(".timeline-list p")).fontSize),
    timelineAge: Number.parseFloat(getComputedStyle(node.querySelector(".timeline-age")).fontSize),
    timelineDetail: Number.parseFloat(getComputedStyle(node.querySelector(".timeline-insight-section li")).fontSize),
    toggleHeight: node.querySelector(".timeline-stage-toggle").getBoundingClientRect().height,
    columns: getComputedStyle(node.querySelector(".timeline-list")).gridTemplateColumns.split(" ").length,
    listWidth: node.querySelector(".timeline-list").getBoundingClientRect().width,
    expandedWidth: node.querySelector(".timeline-list li.is-expanded").getBoundingClientRect().width,
  }));
  expect(sizes.rule).toBeGreaterThanOrEqual(15);
  expect(sizes.pair).toBeGreaterThanOrEqual(15);
  expect(sizes.timeline).toBeGreaterThanOrEqual(15);
  expect(sizes.timelineAge).toBeGreaterThanOrEqual(17);
  expect(sizes.timelineDetail).toBeGreaterThanOrEqual(17);
  expect(sizes.toggleHeight).toBeGreaterThanOrEqual(48);
  expect(sizes.columns).toBe(2);
  expect(sizes.expandedWidth).toBeGreaterThanOrEqual(sizes.listWidth - 2);
  await expectNoHorizontalOverflow(page);
  await result.screenshot({ path: "output/playwright/identity-destiny-mobile-390.png" });

  await page.setViewportSize({ width: 320, height: 760 });
  const narrowColumns = await result.evaluate((node) =>
    getComputedStyle(node.querySelector(".timeline-list")).gridTemplateColumns.split(" ").length);
  expect(narrowColumns).toBe(1);
  await expectNoHorizontalOverflow(page);
  await result.screenshot({ path: "output/playwright/identity-destiny-mobile-320.png" });
  expect(errors).toEqual([]);
});

test("mobile workspace analyzes a bridged custom sequence without overflow", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html", { waitUntil: "networkidle" });

  await page.locator('[data-entry="custom_sequence"]').click();
  const sequencePanel = page.locator("[data-workspace-view='sequence']");
  await expect(sequencePanel).toBeVisible();
  await sequencePanel.locator("[data-sequence-input]").fill("A10053B");
  await sequencePanel.locator("[data-sequence-form]").evaluate((node) => node.requestSubmit());

  const result = sequencePanel.locator("[data-sequence-result]");
  await expect(result.locator(".pair-card")).toHaveCount(8);
  await expect(result.locator(".bridge-block")).toContainText("10053");
  await expect(result.locator(".bridge-block")).toContainText("天醫");
  await expect(result.locator(".advanced-result-value")).not.toHaveText("A10053B");

  const sizes = await page.evaluate(() => ({
    help: Number.parseFloat(getComputedStyle(document.querySelector(".workspace-help")).fontSize),
    pair: Number.parseFloat(getComputedStyle(document.querySelector(".pair-card p")).fontSize),
    titleImage: document.querySelector(".workspace-title .brush-title-image").getBoundingClientRect().height,
  }));
  expect(sizes.help).toBeGreaterThanOrEqual(15);
  expect(sizes.pair).toBeGreaterThanOrEqual(15);
  expect(sizes.titleImage).toBeGreaterThanOrEqual(40);
  await expectNoHorizontalOverflow(page);
  await page.locator("#numerology-workspace").screenshot({ path: "output/playwright/numerology-workspace-mobile-390.png" });
  expect(errors).toEqual([]);
});
