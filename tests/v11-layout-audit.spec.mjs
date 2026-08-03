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

async function openFunctionGrid(page) {
  const toggle = page.locator("[data-function-command-toggle]");
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#function-command-grid")).toBeVisible();
}

for (const viewport of viewports) {
  test(`v16 ${viewport.label} 預設收合且展開後全部功能無遮蔽`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("index.html", { waitUntil: "networkidle" });

    const toggle = page.locator("[data-function-command-toggle]");
    const atlas = page.locator(".function-command-grid");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "function-command-grid");
    expect(await toggle.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await expect(atlas).toBeHidden();
    await expect(atlas.locator(":scope > a")).toHaveCount(18);
    await expect(atlas.locator(":scope > a:visible")).toHaveCount(0);
    const collapsedWidth = await page.evaluate(() => ({
      documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(collapsedWidth.documentWidth).toBeLessThanOrEqual(collapsedWidth.clientWidth + 1);

    await openFunctionGrid(page);
    await expect(atlas.locator(":scope > a:visible")).toHaveCount(18);
    await expect.poll(() => atlas.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.top >= -1 && box.bottom <= window.innerHeight + 1;
    }), { message: "展開後應只移動必要距離，讓 18 項功能完整進入可視範圍" }).toBe(true);
    await expect(page.locator("#analyzer-form .mode-switch > label, #analyzer-form .mode-switch > a")).toHaveCount(4);

    const report = await page.evaluate(() => {
      const atlasElement = document.querySelector(".function-command-grid");
      const cells = [...atlasElement.querySelectorAll(":scope > a")].filter((cell) => {
        const rect = cell.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return {
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        clientWidth: document.documentElement.clientWidth,
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
    expect(report.cellMinimumHeight).toBeGreaterThanOrEqual(48);
    expect(report.cellMinimumFont).toBeGreaterThanOrEqual(viewport.width <= 767 ? 13 : 14);
    expect(report.clippedLabels).toEqual([]);
    expect(report.centersClickable.every(Boolean)).toBe(true);

    await page.screenshot({
      path: `output/playwright/v16-${viewport.label}.png`,
      fullPage: false,
    });

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(atlas).toBeHidden();
    await expect(atlas.locator(":scope > a:visible")).toHaveCount(0);
  });
}

test("v16 01～18 收合控制支援鍵盤操作", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("index.html", { waitUntil: "networkidle" });
  const toggle = page.locator("[data-function-command-toggle]");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#function-command-grid > a:visible")).toHaveCount(18);
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-command-module="life-path"]')).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#function-command-grid")).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("v16 十八個延伸模組名稱唯一，全部既有工具都有直達入口", async ({ page }) => {
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
    await openFunctionGrid(page);
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
    await openFunctionGrid(page);
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
  await openFunctionGrid(page);
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
    await openFunctionGrid(page);
    await page.locator(`[data-command-module="${moduleName}"]`).click();
    await expect(page).toHaveURL(new RegExp(`kangjie(?:\\.html)?#method-${methodName}$`));
    await unlockIfNeeded();
    await expect(page.locator('[data-kangjie-tab="meihua"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(`[data-method-tab="${methodName}"]`)).toHaveAttribute("aria-selected", "true");
  }

  await page.goto("index.html", { waitUntil: "networkidle" });
  await openFunctionGrid(page);
  await page.locator('[data-command-module="kangjie-huangji"]').click();
  await expect(page).toHaveURL(/kangjie(?:\.html)?#method-huangji$/);
  await unlockIfNeeded();
  await expect(page.locator('[data-kangjie-tab="huangji"]')).toHaveAttribute("aria-selected", "true");
});

test("v16 適合色彩模組會使用生日分析並直達色彩結果", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("index.html", { waitUntil: "networkidle" });
  await page.locator("#birthday-input").fill("1990-07-12");
  await openFunctionGrid(page);
  await page.locator('[data-command-module="color"]').click();

  await expect(page.locator("#color-guide-title")).toBeVisible();
  await expect(page.locator("[data-personal-color-guide]")).toContainText("生日數 3");
});

test("v16 長造訪數在 1280 桌機不會和第八個導覽入口重疊", async ({ page }) => {
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
