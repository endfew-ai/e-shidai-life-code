import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Taipei" });

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

async function unlockKangjie(page) {
  const gate = page.locator("[data-access-gate]");
  await expect(gate).toBeVisible();
  const password = gate.locator('[name="password"]');
  await password.fill("1111");
  await gate.locator('button[type="submit"]').click();
  await expect(gate.locator("[data-access-message]")).toContainText("密碼不正確");
  await password.fill("0000");
  await gate.locator('button[type="submit"]').click();
  await expect(gate).toBeHidden();
  await expect(page.locator("[data-protected-content]")).not.toHaveAttribute("aria-hidden", "true");
}

async function expectCurrentTimeApplied(page) {
  const status = page.locator("[data-current-time-detect]");
  const calendar = page.locator("#form-calendar");
  await expect(status).toHaveAttribute("data-state", "ready");
  await expect(status.locator("[data-current-time]")).not.toHaveText("正在偵測裝置時間");
  await expect(status.locator("[data-current-lunar]")).toContainText("農曆");
  const values = await calendar.evaluate((form) => ({
    yearBranch: Number(form.elements.yearBranch.value),
    lunarMonth: Number(form.elements.lunarMonth.value),
    lunarDay: Number(form.elements.lunarDay.value),
    hourBranch: Number(form.elements.hourBranch.value),
  }));
  expect(values.yearBranch).toBeGreaterThanOrEqual(1);
  expect(values.yearBranch).toBeLessThanOrEqual(12);
  expect(values.lunarMonth).toBeGreaterThanOrEqual(1);
  expect(values.lunarMonth).toBeLessThanOrEqual(12);
  expect(values.lunarDay).toBeGreaterThanOrEqual(1);
  expect(values.lunarDay).toBeLessThanOrEqual(30);
  expect(values.hourBranch).toBeGreaterThanOrEqual(1);
  expect(values.hourBranch).toBeLessThanOrEqual(12);
}

async function openAllDetails(page) {
  await page.locator("details").evaluateAll((details) => details.forEach((detail) => { detail.open = true; }));
}

async function expectVisibleBrushTitlesUnclipped(page) {
  const report = await page.evaluate(async () => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const closedDetails = element.closest("details:not([open])");
      const hiddenByDetails = closedDetails && !element.closest("summary");
      return !hiddenByDetails && element.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const alphaBounds = window.__brushAlphaBounds instanceof Map ? window.__brushAlphaBounds : new Map();
    window.__brushAlphaBounds = alphaBounds;
    const getAlphaBounds = async (image) => {
      if (alphaBounds.has(image.currentSrc)) return alphaBounds.get(image.currentSrc);
      if (image.decode) await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width;
      let top = canvas.height;
      let right = 0;
      let bottom = 0;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 3) {
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x + 1);
            bottom = Math.max(bottom, y + 1);
          }
        }
      }
      const bounds = { left, top, right, bottom };
      alphaBounds.set(image.currentSrc, bounds);
      return bounds;
    };
    const missingArtwork = [...document.querySelectorAll("h1, h2, h3, h4")]
      .filter(visible)
      .filter((heading) => !heading.querySelector("img.brush-title-image"))
      .map((heading) => heading.textContent?.trim().slice(0, 80) || heading.outerHTML.slice(0, 120));
    const clippedArtwork = [];
    for (const image of [...document.querySelectorAll("img.brush-title-image")].filter(visible)) {
        const opaque = await getAlphaBounds(image);
        const imageRect = image.getBoundingClientRect();
        const scaleX = imageRect.width / image.naturalWidth;
        const scaleY = imageRect.height / image.naturalHeight;
        const inkRect = {
          left: imageRect.left + opaque.left * scaleX,
          right: imageRect.left + opaque.right * scaleX,
          top: imageRect.top + opaque.top * scaleY,
          bottom: imageRect.top + opaque.bottom * scaleY,
        };
        let ancestor = image.parentElement;
        while (ancestor && ancestor !== document.documentElement) {
          const style = getComputedStyle(ancestor);
          const ancestorRect = ancestor.getBoundingClientRect();
          const clipsX = ["hidden", "clip"].includes(style.overflowX);
          const clipsY = ["hidden", "clip"].includes(style.overflowY);
          if ((clipsX && (inkRect.left < ancestorRect.left - 1 || inkRect.right > ancestorRect.right + 1)) ||
              (clipsY && (inkRect.top < ancestorRect.top - 1 || inkRect.bottom > ancestorRect.bottom + 1))) {
            const ancestorName = `${ancestor.tagName.toLowerCase()}${ancestor.id ? `#${ancestor.id}` : ""}${ancestor.className ? `.${String(ancestor.className).trim().replace(/\s+/g, ".")}` : ""}`;
            clippedArtwork.push(`${image.getAttribute("src") || "unknown brush asset"} clipped by ${ancestorName}`);
            break;
          }
          ancestor = ancestor.parentElement;
        }
    }
    return { missingArtwork, clippedArtwork };
  });
  expect(report.missingArtwork).toEqual([]);
  expect(report.clippedArtwork).toEqual([]);
}

test("fixed Taipei time fills the exact lunar date and branches", async ({ page }) => {
  await page.addInitScript(({ fixedTime }) => {
    const NativeDate = Date;
    class FixedDate extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [fixedTime])); }
      static now() { return fixedTime; }
    }
    Object.defineProperty(window, "Date", { configurable: true, value: FixedDate });
  }, { fixedTime: Date.parse("2026-07-19T02:44:00.000Z") });
  await page.goto("/kangjie.html#meihua", { waitUntil: "networkidle" });
  await unlockKangjie(page);
  await expectCurrentTimeApplied(page);
  const calendar = page.locator("#form-calendar");
  await expect(calendar.locator('[name="yearBranch"]')).toHaveValue("7");
  await expect(calendar.locator('[name="lunarMonth"]')).toHaveValue("6");
  await expect(calendar.locator('[name="lunarDay"]')).toHaveValue("6");
  await expect(calendar.locator('[name="hourBranch"]')).toHaveValue("6");
  await expect(calendar.locator("[data-current-lunar]")).toHaveText("農曆六月初六・午年・巳時");
  await calendar.locator('[name="yearBranch"]').selectOption("5");
  await expect(calendar.locator("[data-current-time-note]")).toContainText("你已手動修正");
  await calendar.locator("[data-detect-current-time]").click();
  await expect(calendar.locator('[name="yearBranch"]')).toHaveValue("7");
  await expect(calendar.locator("[data-current-time-note]")).toContainText("已依裝置時間自動填入");
});

test("desktop entry, four derivations, tabs, sources and screenshots", async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/index.html", { waitUntil: "networkidle" });
  await expect(page.locator("a.kangjie-mode-entry")).toBeVisible();
  await expect(page.locator("a.kangjie-mode-entry .sr-only")).toHaveText("邵康節易學");
  await expectAllImagesLoaded(page);
  await expectVisibleBrushTitlesUnclipped(page);
  await expectNoHorizontalOverflow(page);

  await page.locator("#birthday-input").fill("1990-08-12");
  await page.locator("#analyzer-form").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
  await openAllDetails(page);
  await expectAllImagesLoaded(page);
  await expectVisibleBrushTitlesUnclipped(page);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "output/playwright/home-birthday-result-1440.png", fullPage: true });

  await page.locator('[data-mode-label="iching"]').click();
  const threeNumbers = page.locator(".iching-input");
  await threeNumbers.nth(0).fill("9");
  await threeNumbers.nth(1).fill("13");
  await threeNumbers.nth(2).fill("20");
  await page.locator("#analyzer-form").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#result-anchor")).toContainText("天風姤");
  await expect(page.locator("#result-anchor")).toContainText("天山遯");
  await openAllDetails(page);
  await expectAllImagesLoaded(page);
  await expectVisibleBrushTitlesUnclipped(page);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "output/playwright/home-iching-result-1440.png", fullPage: true });

  await page.locator("a.kangjie-mode-entry").click();
  await expect(page).toHaveURL(/\/kangjie(?:\.html)?(?:[?#]|$)/);
  await page.screenshot({ path: "output/playwright/kangjie-access-gate-1440.png", fullPage: false });
  await unlockKangjie(page);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("[data-access-gate]")).toBeHidden();
  await expect(page.locator(".kangjie-hero h1 .sr-only")).toHaveText("象數觀物");
  await expectAllImagesLoaded(page);
  await expectVisibleBrushTitlesUnclipped(page);
  await expectNoHorizontalOverflow(page);

  const pageTabs = page.locator("[data-kangjie-tab]");
  await pageTabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kangjie-tab="meihua"]')).toHaveAttribute("aria-selected", "true");
  await expectCurrentTimeApplied(page);

  const calendar = page.locator("#form-calendar");
  await calendar.locator('[name="yearBranch"]').selectOption("5");
  await calendar.locator('[name="lunarMonth"]').fill("12");
  await calendar.locator('[name="lunarDay"]').fill("17");
  await calendar.locator('[name="hourBranch"]').selectOption("9");
  await expect(calendar.locator("[data-current-time-note]")).toContainText("你已手動修正");
  await page.waitForTimeout(1100);
  await expect(calendar.locator('[name="yearBranch"]')).toHaveValue("5");
  await expect(calendar.locator('[name="lunarMonth"]')).toHaveValue("12");
  await expect(calendar.locator('[name="lunarDay"]')).toHaveValue("17");
  await expect(calendar.locator('[name="hourBranch"]')).toHaveValue("9");
  await calendar.locator('button[type="submit"]').click();
  await expect(page.locator("#kangjie-result")).toContainText("澤火革");
  await expect(page.locator("#kangjie-result")).toContainText("天風姤");
  await expect(page.locator("#kangjie-result")).toContainText("澤山咸");
  await expect(page.locator("#kangjie-result")).toContainText("體卦");
  await expectVisibleBrushTitlesUnclipped(page);
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
  await expectVisibleBrushTitlesUnclipped(page);
  expect(errors).toEqual([]);
});

for (const width of [390, 320]) {
  test(`responsive layout at ${width}px`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/index.html", { waitUntil: "networkidle" });
    await expect(page.locator("a.kangjie-mode-entry")).toBeVisible();
    await expectAllImagesLoaded(page);
    await expectVisibleBrushTitlesUnclipped(page);
    await expectNoHorizontalOverflow(page);
    if (width === 390) await page.screenshot({ path: "output/playwright/home-four-options-390.png", fullPage: false });
    await page.locator("#birthday-input").fill("1990-08-12");
    await page.locator("#analyzer-form").evaluate((form) => form.requestSubmit());
    await expect(page.locator("#result-anchor")).toContainText("生命路徑數");
    await openAllDetails(page);
    await expectAllImagesLoaded(page);
    await expectVisibleBrushTitlesUnclipped(page);
    await expectNoHorizontalOverflow(page);
    await page.goto("/kangjie.html#meihua", { waitUntil: "networkidle" });
    if (width === 390) await page.screenshot({ path: "output/playwright/kangjie-access-gate-390.png", fullPage: false });
    await unlockKangjie(page);
    await expect(page.locator('[data-kangjie-tab="meihua"]')).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
    await expectAllImagesLoaded(page);
    await expectCurrentTimeApplied(page);
    const calendar = page.locator("#form-calendar");
    await calendar.locator('[name="yearBranch"]').selectOption("5");
    await calendar.locator('[name="lunarMonth"]').fill("12");
    await calendar.locator('[name="lunarDay"]').fill("17");
    await calendar.locator('[name="hourBranch"]').selectOption("9");
    await calendar.locator('button[type="submit"]').click();
    await expect(page.locator("#kangjie-result")).toContainText("澤火革");
    await expectVisibleBrushTitlesUnclipped(page);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `output/playwright/kangjie-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
