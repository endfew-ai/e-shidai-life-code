import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Taipei" });

test.beforeEach(async ({ page }) => {
  await page.route("https://api.counterapi.dev/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ count: 1284 }),
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
  await expect(result.locator(".timeline-list li")).toHaveCount(10);
  await expect(result.locator(".pair-card code").first()).toHaveText("••");
  await expect(result.locator(".timeline-list code").first()).toHaveText("••");
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
    };
  });
  await result.getByRole("button", { name: "列印／存成 PDF" }).click();
  const printSnapshot = await page.evaluate(() => window.__identityPrintSnapshot);
  expect(printSnapshot).not.toContain("A123456789");
  expect(printSnapshot).not.toContain("01123456789");
  expect(printSnapshot).not.toContain("1123456789");
  await expect(result.locator(".advanced-result-value")).toHaveText("A12*****89");
  await expect(result.locator(".pair-card code").first()).toHaveText("••");
  await expect(result.locator(".timeline-list code").first()).toHaveText("••");
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
  await expect(result.locator(".timeline-list li")).toHaveCount(10);
  const sizes = await result.evaluate((node) => ({
    rule: Number.parseFloat(getComputedStyle(node.querySelector(".identity-destiny-rule")).fontSize),
    pair: Number.parseFloat(getComputedStyle(node.querySelector(".pair-card p")).fontSize),
    timeline: Number.parseFloat(getComputedStyle(node.querySelector(".timeline-list p")).fontSize),
  }));
  expect(sizes.rule).toBeGreaterThanOrEqual(15);
  expect(sizes.pair).toBeGreaterThanOrEqual(15);
  expect(sizes.timeline).toBeGreaterThanOrEqual(15);
  await expectNoHorizontalOverflow(page);
  await result.screenshot({ path: "output/playwright/identity-destiny-mobile-390.png" });
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
