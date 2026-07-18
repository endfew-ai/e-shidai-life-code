import { expect, test } from "@playwright/test";

function collectBrowserErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
}

async function expectAllImagesLoaded(page) {
  const failed = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute("src")));
  expect(failed).toEqual([]);
}

test("desktop entry, four derivations, tabs, sources and screenshots", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await expect(page.locator("a.kangjie-mode-entry")).toBeVisible();
  await expect(page.locator("a.kangjie-mode-entry .sr-only")).toHaveText("邵康節易學");
  await expectNoHorizontalOverflow(page);
  await page.locator("a.kangjie-mode-entry").click();
  await expect(page).toHaveURL(/kangjie\.html/);
  await expect(page.locator("h1 .sr-only")).toHaveText("象數觀物");
  await expectAllImagesLoaded(page);
  await expectNoHorizontalOverflow(page);

  const pageTabs = page.locator("[data-kangjie-tab]");
  await pageTabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kangjie-tab="meihua"]')).toHaveAttribute("aria-selected", "true");

  const calendar = page.locator("#form-calendar");
  await calendar.locator('[name="yearBranch"]').selectOption("5");
  await calendar.locator('[name="lunarMonth"]').fill("12");
  await calendar.locator('[name="lunarDay"]').fill("17");
  await calendar.locator('[name="hourBranch"]').selectOption("9");
  await calendar.locator('button[type="submit"]').click();
  await expect(page.locator("#kangjie-result")).toContainText("澤火革");
  await expect(page.locator("#kangjie-result")).toContainText("天風姤");
  await expect(page.locator("#kangjie-result")).toContainText("澤山咸");
  await expect(page.locator("#kangjie-result")).toContainText("體卦");
  await page.screenshot({ path: "output/playwright/kangjie-desktop-result.png", fullPage: true });

  await page.locator('[data-method-tab="object"]').click();
  const objectForm = page.locator("#form-object");
  await objectForm.locator('[name="count"]').fill("8");
  await objectForm.locator('[name="hourBranch"]').selectOption("4");
  await objectForm.locator('button[type="submit"]').click();
  await expect(page.locator("#kangjie-result")).toContainText("地雷復");
  await expect(page.locator("#kangjie-result")).toContainText("山雷頤");

  await page.locator('[data-method-tab="sound"]').click();
  const soundForm = page.locator("#form-sound");
  await soundForm.locator('[name="firstCount"]').fill("1");
  await soundForm.locator('[name="secondCount"]').fill("5");
  await soundForm.locator('[name="hourBranch"]').selectOption("10");
  await soundForm.locator('button[type="submit"]').click();
  await expect(page.locator("#kangjie-result")).toContainText("天風姤");
  await expect(page.locator("#kangjie-result")).toContainText("巽為風");

  await page.locator('[data-method-tab="text"]').click();
  const textForm = page.locator("#form-text");
  await textForm.locator("textarea").fill("天地定位山澤通氣雷風相");
  await expect(textForm.locator("output")).toHaveText("已計 11 個漢字");
  await textForm.locator('button[type="submit"]').click();
  await expect(page.locator("#kangjie-result")).toContainText("風水渙");
  await expect(page.locator("#kangjie-result")).toContainText("山水蒙");

  await page.locator('[data-kangjie-tab="huangji"]').click();
  await page.locator('#huangji-form [name="years"]').fill("130000");
  await page.locator('#huangji-form button[type="submit"]').click();
  await expect(page.locator("#huangji-result")).toContainText("1 元・0 會・1 運・1 世・10 年");

  await page.locator('[data-kangjie-tab="sources"]').click();
  await expect(page.locator("#panel-sources")).toContainText("梅花易數・卷一");
  await expect(page.locator("#panel-sources")).toContainText("推演界線");
  await expectAllImagesLoaded(page);
  expect(errors).toEqual([]);
});

for (const width of [390, 320]) {
  test(`responsive layout at ${width}px`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/index.html", { waitUntil: "networkidle" });
    await expect(page.locator("a.kangjie-mode-entry")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (width === 390) await page.screenshot({ path: "output/playwright/home-four-options-390.png", fullPage: false });
    await page.goto("/kangjie.html#meihua", { waitUntil: "networkidle" });
    await expect(page.locator('[data-kangjie-tab="meihua"]')).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
    await expectAllImagesLoaded(page);
    const calendar = page.locator("#form-calendar");
    await calendar.locator('[name="yearBranch"]').selectOption("5");
    await calendar.locator('[name="lunarMonth"]').fill("12");
    await calendar.locator('[name="lunarDay"]').fill("17");
    await calendar.locator('[name="hourBranch"]').selectOption("9");
    await calendar.locator('button[type="submit"]').click();
    await expect(page.locator("#kangjie-result")).toContainText("澤火革");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `output/playwright/kangjie-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
