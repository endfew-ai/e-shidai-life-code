import { expect, test } from "@playwright/test";

const viewports = [
  { label: "desktop-1672", width: 1672, height: 941 },
  { label: "desktop-1440", width: 1440, height: 900 },
  { label: "desktop-1366-short", width: 1366, height: 768 },
  { label: "desktop-1280-short", width: 1280, height: 720 },
  { label: "desktop-1280-compact", width: 1280, height: 640 },
  { label: "tablet-1024", width: 1024, height: 768 },
  { label: "mobile-390", width: 390, height: 844 },
  { label: "mobile-320", width: 320, height: 720 },
  { label: "mobile-320-short", width: 320, height: 568 },
];

test.beforeEach(async ({ page }) => {
  await page.route("https://api.counterapi.dev/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ count: 1284 }),
  }));
});

for (const viewport of viewports) {
  test(`v13 ${viewport.label} 首屏顯示全部功能且無遮蔽`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("index.html", { waitUntil: "networkidle" });

    const atlas = page.locator(".function-command-grid");
    await expect(atlas).toBeVisible();
    await expect(atlas.locator(":scope > a")).toHaveCount(18);
    await expect(atlas.locator(":scope > a:visible")).toHaveCount(18);
    await expect(page.locator("#analyzer-form .mode-switch > label, #analyzer-form .mode-switch > a")).toHaveCount(4);

    const report = await page.evaluate(() => {
      const atlasElement = document.querySelector(".function-command-grid");
      const atlasRect = atlasElement.getBoundingClientRect();
      const cells = [...atlasElement.querySelectorAll(":scope > a")].filter((cell) => {
        const rect = cell.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return {
        viewportHeight: innerHeight,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        clientWidth: document.documentElement.clientWidth,
        atlasTop: atlasRect.top,
        atlasBottom: atlasRect.bottom,
        columns: getComputedStyle(atlasElement).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
        cellMinimumHeight: Math.min(...cells.map((cell) => cell.getBoundingClientRect().height)),
        cellMinimumFont: Math.min(...cells.map((cell) => Number.parseFloat(getComputedStyle(cell.querySelector("strong")).fontSize))),
        clippedLabels: cells.filter((cell) => {
          const label = cell.querySelector("strong");
          return label.scrollWidth > label.clientWidth + 1 || label.scrollHeight > label.clientHeight + 1;
        }).map((cell) => cell.textContent.trim()),
        centersClickable: cells.map((cell) => {
          const rect = cell.getBoundingClientRect();
          return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.closest("a") === cell;
        }),
      };
    });

    expect(report.documentWidth).toBeLessThanOrEqual(report.clientWidth + 1);
    expect(report.columns).toBe(viewport.width <= 767 ? 4 : 6);
    expect(report.cellMinimumHeight).toBeGreaterThanOrEqual(viewport.width <= 767 ? 48 : 78);
    expect(report.cellMinimumFont).toBeGreaterThanOrEqual(viewport.width <= 767 ? 13 : 14);
    expect(report.clippedLabels).toEqual([]);
    expect(report.centersClickable.every(Boolean)).toBe(true);
    expect(report.atlasBottom).toBeLessThanOrEqual(report.viewportHeight + 1);

    await page.screenshot({
      path: `output/playwright/v13-${viewport.label}.png`,
      fullPage: false,
    });
  });
}

test("v13 十八個延伸模組名稱唯一，全部既有工具都有直達入口", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const expectedModules = [
    "life-path", "lo-shu", "annual", "color", "name-strokes", "identity",
    "kangjie-calendar", "kangjie-object", "kangjie-sound", "kangjie-text",
    "kangjie-supplement", "kangjie-huangji", "phone", "vehicle", "sequence",
    "history", "settings", "sources",
  ];
  await expect(page.locator("[data-command-module]")).toHaveCount(expectedModules.length);
  expect(await page.locator("[data-command-module]").evaluateAll(
    (links) => links.map((link) => link.dataset.commandModule),
  )).toEqual(expectedModules);
  await expect(page.locator('[data-command-module="name-strokes"]')).toHaveAttribute("href", "kangjie.html#name-strokes");

  for (const [moduleName, entryName] of [
    ["phone", "phone_number"],
    ["vehicle", "vehicle_address"],
    ["sequence", "custom_sequence"],
  ]) {
    await page.goto("index.html", { waitUntil: "networkidle" });
    await page.locator(`[data-command-module="${moduleName}"]`).click();
    await expect(page.locator('[data-workspace-tab="sequence"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(`input[name="sequence-type"][value="${entryName}"]`)).toBeChecked();
  }

  for (const [moduleName, tabName] of [
    ["identity", "identity"],
    ["history", "history"],
    ["settings", "settings"],
    ["sources", "sources"],
  ]) {
    await page.goto("index.html", { waitUntil: "networkidle" });
    await page.locator(`[data-command-module="${moduleName}"]`).click();
    await expect(page.locator(`[data-workspace-tab="${tabName}"]`)).toHaveAttribute("aria-selected", "true");
  }

  async function unlockIfNeeded() {
    const gate = page.locator("[data-access-gate]");
    if (!(await gate.isVisible())) return;
    await gate.locator('[name="password"]').fill("0000");
    await gate.locator('button[type="submit"]').click();
  }

  await page.goto("index.html", { waitUntil: "networkidle" });
  await page.locator('[data-command-module="name-strokes"]').click();
  await expect(page).toHaveURL(/kangjie(?:\.html)?#name-strokes$/);
  await unlockIfNeeded();
  await expect(page.locator('[data-method-tab="text"]')).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('#form-text [name="textMode"]')).toHaveValue("surname");

  for (const [moduleName, methodName] of [
    ["kangjie-calendar", "calendar"],
    ["kangjie-object", "object"],
    ["kangjie-sound", "sound"],
    ["kangjie-text", "text"],
    ["kangjie-supplement", "supplement"],
  ]) {
    await page.goto("index.html", { waitUntil: "networkidle" });
    await page.locator(`[data-command-module="${moduleName}"]`).click();
    await expect(page).toHaveURL(new RegExp(`kangjie(?:\\.html)?#method-${methodName}$`));
    await unlockIfNeeded();
    await expect(page.locator('[data-kangjie-tab="meihua"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(`[data-method-tab="${methodName}"]`)).toHaveAttribute("aria-selected", "true");
  }

  await page.goto("index.html", { waitUntil: "networkidle" });
  await page.locator('[data-command-module="kangjie-huangji"]').click();
  await expect(page).toHaveURL(/kangjie(?:\.html)?#method-huangji$/);
  await unlockIfNeeded();
  await expect(page.locator('[data-kangjie-tab="huangji"]')).toHaveAttribute("aria-selected", "true");
});

test("v13 適合色彩模組會使用生日分析並直達色彩結果", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("index.html", { waitUntil: "networkidle" });
  await page.locator("#birthday-input").fill("1990-07-12");
  await page.locator('[data-command-module="color"]').click();

  await expect(page.locator("#color-guide-title")).toBeVisible();
  await expect(page.locator("[data-personal-color-guide]")).toContainText("生日數 3");
});

test("v13 長造訪數在 1280 桌機不會和第八個導覽入口重疊", async ({ page }) => {
  await page.unroute("https://api.counterapi.dev/**");
  await page.route("https://api.counterapi.dev/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ count: 1234567890 }),
  }));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const report = await page.evaluate(() => {
    const actions = document.querySelector(".topbar-actions");
    const lastLink = actions.querySelector(":scope > a:last-of-type");
    const counter = actions.querySelector(".visit-counter");
    const actionsRect = actions.getBoundingClientRect();
    const linkRect = lastLink.getBoundingClientRect();
    const counterRect = counter.getBoundingClientRect();
    return {
      gap: counterRect.left - linkRect.right,
      counterInside: counterRect.right <= actionsRect.right + 1,
      counterClipped: counter.scrollWidth > counter.clientWidth + 1,
      pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  expect(report.gap).toBeGreaterThanOrEqual(0);
  expect(report.counterInside).toBe(true);
  expect(report.counterClipped).toBe(false);
  expect(report.pageOverflow).toBe(false);
});
