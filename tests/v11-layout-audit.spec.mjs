import { expect, test } from "@playwright/test";

const viewports = [
  { label: "desktop-1672", width: 1672, height: 941 },
  { label: "desktop-1440", width: 1440, height: 900 },
  { label: "mobile-390", width: 390, height: 844 },
  { label: "mobile-320", width: 320, height: 720 },
];

test.beforeEach(async ({ page }) => {
  await page.route("https://api.counterapi.dev/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ count: 1284 }),
  }));
});

for (const viewport of viewports) {
  test(`v11 ${viewport.label} 首屏顯示全部功能且無遮蔽`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("index.html", { waitUntil: "networkidle" });

    const atlas = page.locator(".function-command-grid");
    await expect(atlas).toBeVisible();
    await expect(atlas.locator(":scope > a")).toHaveCount(16);
    await expect(page.locator("#analyzer-form .mode-switch > label, #analyzer-form .mode-switch > a")).toHaveCount(4);

    const report = await page.evaluate(() => {
      const atlasElement = document.querySelector(".function-command-grid");
      const atlasRect = atlasElement.getBoundingClientRect();
      const cells = [...atlasElement.querySelectorAll(":scope > a")];
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
    expect(report.columns).toBe(viewport.width <= 767 ? 4 : 8);
    expect(report.cellMinimumHeight).toBeGreaterThanOrEqual(viewport.width <= 767 ? 48 : 80);
    expect(report.cellMinimumFont).toBeGreaterThanOrEqual(viewport.width <= 767 ? 13 : 14);
    expect(report.clippedLabels).toEqual([]);
    expect(report.centersClickable.every(Boolean)).toBe(true);
    expect(report.atlasBottom).toBeLessThanOrEqual(report.viewportHeight + 1);

    await page.screenshot({
      path: `output/playwright/v11-${viewport.label}.png`,
      fullPage: false,
    });
  });
}

test("v11 十六個模組名稱唯一，工作台入口直接切到正確工具", async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto("index.html", { waitUntil: "networkidle" });

  const expectedModules = [
    "birthday", "life-path", "spectrum", "lo-shu", "annual", "color", "iching", "name-strokes",
    "kangjie", "identity", "phone", "vehicle", "sequence", "history", "settings", "sources",
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

  await page.goto("index.html", { waitUntil: "networkidle" });
  await page.locator('[data-command-module="name-strokes"]').click();
  await expect(page).toHaveURL(/kangjie(?:\.html)?#name-strokes$/);
  const gate = page.locator("[data-access-gate]");
  await gate.locator('[name="password"]').fill("0000");
  await gate.locator('button[type="submit"]').click();
  await expect(page.locator('[data-method-tab="text"]')).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('#form-text [name="textMode"]')).toHaveValue("surname");
});
