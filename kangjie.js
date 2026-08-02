import { getIChingText } from "./iching-text.js";
import { lineNames } from "./calculator-core.js";
import {
  calculateCalendarHexagram,
  calculateChiCunHexagram,
  calculateDoubleSoundHexagram,
  calculateLongTextHexagram,
  calculateObjectHexagram,
  calculatePosteriorHexagram,
  calculateSingleSoundHexagram,
  calculateStrokeHexagram,
  calculateSurnameAdditionHexagram,
  calculateTextHexagram,
  calculateZhangChiHexagram,
  calculateHuangjiPosition,
  countHanCharacters,
  decomposeHuangjiYears,
  detectCurrentCalendarParts,
  findObjectTrigramCandidates,
  loadStrokeDataset,
  resolveStrokeText,
} from "./kangjie-core.js";

let strokeDatasetPromise;
const strokeState = new WeakMap();
let currentCalendarState = null;
let currentCalendarIsManual = false;

function calculationProfile() {
  const id = document.querySelector("[data-calculation-profile]")?.value || "classic-primary-v1";
  if (id !== "user-custom-v1") return id;
  return {
    id,
    label: "使用者自訂",
    description: "由本次畫面選項建立，只影響本次演算。",
    pureHexagramMutual: document.querySelector("[data-custom-mutual]")?.value || "original",
    sizeMovingIncludesHour: document.querySelector("[data-custom-size-hour]")?.value !== "no",
    textFourToTen: document.querySelector("[data-custom-text-mode]")?.value || "tone",
  };
}

function getStrokeDataset() {
  if (!strokeDatasetPromise) {
    strokeDatasetPromise = loadStrokeDataset("public/data/unihan-kTotalStrokes-17.0.0.json");
  }
  return strokeDatasetPromise;
}

const fixedBrushTitles = {
  "本卦": "public/visuals/brush/title-hex-original-v2.webp",
  "互卦": "public/visuals/brush/title-hex-mutual-v2.webp",
  "變卦": "public/visuals/brush/title-hex-changed-v2.webp",
  "本卦原文節錄": "public/visuals/brush/title-kangjie-classic-v2.webp",
  "卦辭": "public/visuals/brush/title-judgment-v2.webp",
  "象曰": "public/visuals/brush/title-image-saying-v2.webp",
  "動爻原文": "public/visuals/brush/title-moving-line-v2.webp",
  "變卦本文": "public/visuals/brush/title-changed-text-v2.webp",
};

function initializeAccessGate() {
  const gate = document.querySelector("[data-access-gate]");
  const form = gate?.querySelector("[data-access-form]");
  const input = form?.querySelector('[name="password"]');
  const message = form?.querySelector("[data-access-message]");
  const content = document.querySelector("[data-protected-content]");
  if (!gate || !form || !input || !message || !content) return;

  function unlock({ focus = true } = {}) {
    try {
      sessionStorage.setItem("kangjie-access-v1", "granted");
    } catch {
      // 隱私模式可能停用 sessionStorage；本次頁面仍可正常解鎖。
    }
    document.documentElement.classList.remove("kangjie-locked");
    document.documentElement.classList.add("kangjie-unlocked");
    gate.hidden = true;
    content.inert = false;
    content.removeAttribute("aria-hidden");
    if (focus) content.querySelector("a, button")?.focus();
  }

  try {
    if (sessionStorage.getItem("kangjie-access-v1") === "granted") {
      unlock({ focus: false });
      return;
    }
  } catch {
    // 無法讀取儲存空間時維持密碼門。
  }

  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 4);
    message.textContent = "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input.value === "0000") {
      unlock();
      return;
    }
    message.textContent = "密碼不正確，請重新輸入四位數字。";
    input.select();
    input.focus();
  });
  window.setTimeout(() => input.focus(), 50);
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function brushTitleElement(src, text, className = "") {
  const wrapper = element("span", `brush-title ${className}`.trim());
  wrapper.append(element("span", "sr-only", text));
  const image = document.createElement("img");
  image.className = "brush-title-image";
  image.src = src;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  wrapper.append(image);
  return wrapper;
}

function fixedBrushTitleElement(text, className = "") {
  const src = fixedBrushTitles[text];
  if (!src) throw new Error(`缺少固定毛筆標題資產：${text}`);
  return brushTitleElement(src, text, className);
}

function activateTabs(tabSelector, panelSelector, nextName, { focus = false } = {}) {
  const tabs = [...document.querySelectorAll(tabSelector)];
  const panels = [...document.querySelectorAll(panelSelector)];
  for (const tab of tabs) {
    const active = tab.dataset.kangjieTab === nextName || tab.dataset.methodTab === nextName;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  }
  for (const panel of panels) {
    const active = panel.dataset.kangjiePanel === nextName || panel.dataset.methodPanel === nextName;
    panel.hidden = !active;
  }
}

function openPageTab(name, options = {}) {
  const names = ["origins", "meihua", "huangji", "sources"];
  const nextName = names.includes(name) ? name : "origins";
  activateTabs("[data-kangjie-tab]", "[data-kangjie-panel]", nextName, options);
  if (options.updateHash !== false) history.replaceState(null, "", `#${nextName}`);
}

function initializePageTabs() {
  const tabs = [...document.querySelectorAll("[data-kangjie-tab]")];
  for (const tab of tabs) {
    tab.addEventListener("click", () => openPageTab(tab.dataset.kangjieTab, { updateHash: true }));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = tabs.indexOf(tab);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowRight" ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      openPageTab(tabs[nextIndex].dataset.kangjieTab, { focus: true, updateHash: true });
    });
  }

  for (const trigger of document.querySelectorAll("[data-open-tab]")) {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openPageTab(trigger.dataset.openTab, { updateHash: true });
      document.querySelector("#workspace")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  }

  openPageTab(location.hash.slice(1), { updateHash: false });
}

function initializeMethodTabs() {
  const tabs = [...document.querySelectorAll("[data-method-tab]")];
  const resultAnchor = document.querySelector("#kangjie-result");
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      activateTabs("[data-method-tab]", "[data-method-panel]", tab.dataset.methodTab);
      resultAnchor?.replaceChildren();
    });
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = tabs.indexOf(tab);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowRight" ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      activateTabs("[data-method-tab]", "[data-method-panel]", tabs[nextIndex].dataset.methodTab, { focus: true });
      resultAnchor?.replaceChildren();
    });
  }
}

function initializeMethodDeepLink() {
  const methodByHash = {
    "#method-calendar": "calendar",
    "#method-object": "object",
    "#method-sound": "sound",
    "#method-text": "text",
    "#method-supplement": "supplement",
  };
  const method = methodByHash[location.hash];
  if (location.hash === "#method-huangji") {
    openPageTab("huangji", { updateHash: false });
  } else if (location.hash === "#name-strokes" || method) {
    openPageTab("meihua", { updateHash: false });
    activateTabs("[data-method-tab]", "[data-method-panel]", method || "text");
    if (location.hash === "#name-strokes") {
      const profile = document.querySelector("[data-calculation-profile]");
      if (profile && ["classic-primary-v1", "classic-variant-v1"].includes(profile.value)) {
        profile.value = "modern-current-v1";
        updateProfileFields();
      }
      const textMode = document.querySelector("[data-text-mode]");
      if (textMode) {
        textMode.value = "surname";
        textMode.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  } else {
    return;
  }
  document.querySelector("#workspace")?.scrollIntoView({ behavior: "auto", block: "start" });
}

function createHexagramLines(lines, texts, movingIndex = -1, mark = "") {
  const wrapper = element("div", "hexagram-lines");
  wrapper.setAttribute("aria-label", "六爻卦象與爻辭，畫面由上爻排列至初爻");
  for (const index of [5, 4, 3, 2, 1, 0]) {
    const row = element("div", `line-row${index === movingIndex ? " is-moving" : ""}`);
    const line = element("span", `yao ${lines[index] === 1 ? "yang" : "yin"}`);
    line.setAttribute("aria-label", lines[index] === 1 ? "陽爻" : "陰爻");
    line.append(element("i"));
    if (lines[index] === 0) line.append(element("i"));
    row.append(
      element("span", "line-position", lineNames[index]),
      line,
      element("strong", "line-change-mark", index === movingIndex ? mark : ""),
      element("span", "line-text", texts[index].text),
    );
    wrapper.append(row);
  }
  return wrapper;
}

function createHexagramCard(label, value, movingIndex = -1, mark = "", note = "") {
  const text = getIChingText(value.hexId);
  const card = element("article", "hexagram-card");
  const header = element("header");
  const copy = element("div");
  const roleTitle = element("h3", "hexagram-role-title brush-fixed-heading");
  roleTitle.append(fixedBrushTitleElement(label, "brush-hexagram-role"));
  const computedName = element("p", "hexagram-computed-name");
  computedName.append(element("span", "", text.symbol), document.createTextNode(value.name));
  copy.append(roleTitle, computedName);
  if (note) copy.append(element("small", "hexagram-role-note", note));
  header.append(copy, element("small", "", `第 ${value.hexId} 卦`));
  const judgment = element("p", "hexagram-judgment");
  judgment.append(element("strong", "", "卦辭"), element("span", "", `${text.name}，${text.judgment}`));
  card.append(
    header,
    element("p", "hexagram-structure", `上${value.upper.name}（${value.upper.nature}）・下${value.lower.name}（${value.lower.nature}）`),
    judgment,
    createHexagramLines(value.lines, text.lines, movingIndex, mark),
  );
  return card;
}

function createYaoLegend() {
  const legend = element("div", "yao-legend");
  legend.setAttribute("aria-label", "卦爻顏色圖例");
  for (const [className, label] of [["is-yang", "陽爻"], ["is-yin", "陰爻"]]) {
    const item = element("span", className);
    const swatch = element("i");
    swatch.setAttribute("aria-hidden", "true");
    item.append(swatch, document.createTextNode(label));
    legend.append(item);
  }
  return legend;
}

function createClassicExcerpt(result) {
  const original = getIChingText(result.original.hexId);
  const transformed = getIChingText(result.transformed.hexId);
  const details = element("details", "kangjie-classic-excerpt");
  const summary = element("summary");
  const summaryTitle = element("strong");
  summaryTitle.append(fixedBrushTitleElement("本卦原文節錄", "brush-kangjie-classic"));
  summary.append(summaryTitle, element("span", "", "卦辭・象曰・動爻"));
  const body = element("div");
  const judgment = element("article");
  const judgmentTitle = element("h4", "brush-fixed-heading");
  judgmentTitle.append(fixedBrushTitleElement("卦辭", "brush-classic-label"));
  judgment.append(judgmentTitle, element("p", "classic-computed-label", `${original.symbol} ${original.name}`), element("p", "", original.judgment));
  const image = element("article");
  const imageTitle = element("h4", "brush-fixed-heading");
  imageTitle.append(fixedBrushTitleElement("象曰", "brush-classic-label"));
  image.append(imageTitle, element("p", "", original.image));
  const moving = original.lines[result.moving.index];
  const line = element("article", "is-moving-copy");
  const movingTitle = element("h4", "brush-fixed-heading");
  movingTitle.append(fixedBrushTitleElement("動爻原文", "brush-classic-label brush-moving-line"));
  line.append(movingTitle, element("p", "classic-computed-label", `${result.moving.name}・${moving.text}`), element("p", "", `《象》曰：${moving.image}`));
  const changed = element("article");
  const changedTitle = element("h4", "brush-fixed-heading");
  changedTitle.append(fixedBrushTitleElement("變卦本文", "brush-classic-label brush-changed-text"));
  changed.append(changedTitle, element("p", "classic-computed-label", `${transformed.symbol} ${transformed.name}`), element("p", "", transformed.judgment));
  const source = element("p", "classic-source");
  const link = element("a", "", "中國哲學書電子化計劃《周易》");
  link.href = "https://ctext.org/book-of-changes/zh";
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "維基文庫《周易》";
  link.href = "https://zh.wikisource.org/zh/周易";
  source.append("內嵌本文來源：", link, "。中國哲學書電子化計劃另作交叉核對；只列原文，不作吉凶解讀。");
  body.append(judgment, image, line, changed, source);
  details.append(summary, body);
  return details;
}

function createKangjieResult(result) {
  const section = element("section", "kangjie-calculation-result");
  section.setAttribute("aria-labelledby", "kangjie-result-title");
  const heading = element("header", "kangjie-result-heading");
  const headingCopy = element("div");
  const title = element("h2");
  title.id = "kangjie-result-title";
  title.tabIndex = -1;
  title.append(brushTitleElement("public/visuals/brush/title-kangjie-result-v1.webp", "衍算結果", "brush-kangjie-result"));
  headingCopy.append(element("p", "section-index", result.methodLabel), title, element("p", "result-input-summary", result.inputSummary));
  const moving = element("p", "moving-summary");
  moving.append("動爻為", element("strong", "", result.moving.name), `，${result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。`);
  const headingMeta = element("div", "result-heading-meta");
  headingMeta.append(moving, createYaoLegend());
  heading.append(headingCopy, headingMeta);

  const grid = element("div", "hexagram-grid");
  grid.append(
    createHexagramCard("本卦", result.original, result.moving.index, "動"),
    createHexagramCard("互卦", result.mutual, -1, "", result.mutualSource === "transformed" ? "取自變卦" : ""),
    createHexagramCard("變卦", result.transformed, result.moving.index, "變"),
  );

  const trace = element("div", "kangjie-trace");
  for (const item of result.trace) {
    const row = element("div");
    row.append(element("span", "", item.label), element("code", "", item.equation));
    trace.append(row);
  }

  const roles = element("div", "body-use-ledger");
  const body = element("article");
  body.append(element("span", "", "體卦"), element("strong", "", `${result.roles.body.symbol} ${result.roles.body.name}`), element("small", "", `${result.roles.body.nature}・${result.roles.body.element}`));
  const use = element("article");
  use.append(element("span", "", "用卦"), element("strong", "", `${result.roles.use.symbol} ${result.roles.use.name}`), element("small", "", `${result.roles.use.nature}・${result.roles.use.element}`));
  const relation = element("article");
  relation.append(element("span", "", "五行關係"), element("strong", "", result.fiveElements.label), element("small", "", result.fiveElements.explanation));
  roles.append(body, use, relation, element("p", "", result.roles.note));

  const influences = element("div", "influence-ledger");
  const influenceHeader = element("header");
  influenceHeader.append(element("strong", "", "本・互・變對體"), element("span", "", result.partyBalance.note));
  influences.append(influenceHeader);
  for (const entry of result.influenceRelations) {
    const card = element("article");
    card.append(element("span", "", entry.stage), element("strong", "", `${entry.trigram.symbol} ${entry.trigram.name}・${entry.relation.label}`), element("small", "", entry.relation.explanation));
    influences.append(card);
  }

  const seasonal = result.seasonalStrength ? element("div", "seasonal-ledger") : null;
  if (seasonal) {
    const header = element("header");
    header.append(element("strong", "", "月令旺衰"), element("span", "", `農曆 ${result.seasonalStrength.lunarMonth} 月；只標旺、衰、平`));
    seasonal.append(header);
    for (const [label, strength] of [
      ["體卦", result.seasonalStrength.body], ["用卦", result.seasonalStrength.use],
      ["下互", result.seasonalStrength.mutualLower], ["上互", result.seasonalStrength.mutualUpper],
      ["變卦用方", result.seasonalStrength.transformedUse],
    ]) {
      const card = element("article");
      card.append(element("span", "", label), element("strong", "", `${strength.trigramName}・${strength.status}`), element("small", "", `${strength.season}・${strength.monthBranch}月`));
      seasonal.append(card);
    }
    seasonal.append(element("p", "", result.seasonalStrength.note));
  }

  const audit = element("details", "calculation-audit");
  const auditSummary = element("summary");
  auditSummary.append(element("strong", "", "完整演算明細"), element("span", "", `${result.profileLabel}・${result.algorithmVersion}`));
  const auditBody = element("div", "calculation-audit-body");
  const originalInput = element("pre", "", JSON.stringify(result.calculationTrace.originalInput, null, 2));
  const normalizedInput = element("pre", "", JSON.stringify(result.calculationTrace.normalizedInput, null, 2));
  const inputGrid = element("div", "calculation-input-grid");
  const originalCard = element("article");
  originalCard.append(element("span", "", "原始輸入"), originalInput);
  const normalizedCard = element("article");
  normalizedCard.append(element("span", "", "正規化輸入"), normalizedInput);
  inputGrid.append(originalCard, normalizedCard);
  const warnings = element("ul", "calculation-warning-list");
  for (const warning of result.calculationTrace.warnings) warnings.append(element("li", "", warning));
  for (const assumption of result.calculationTrace.assumptions) warnings.append(element("li", "", `採用設定：${assumption}`));
  const sources = element("div", "calculation-source-list source-scope-list");
  for (const [label, scope, emptyText] of [
    ["方法公式來源", result.sourceScopes?.formula, "沒有可核對的公式原文；本工具不以共用卦象來源替方法公式背書。"],
    ["資料來源", result.sourceScopes?.data, "本方法不需要外部資料集。"],
    ["共用卦象核心來源", result.sourceScopes?.sharedCore, "沒有列出共用卦象核心來源。"],
  ]) {
    if (!scope) continue;
    const group = element("section", "calculation-source-scope");
    const statusLabel = {
      documented: "已核對",
      "not-found": "未找到原文",
      "not-required": "不需外部資料",
    }[scope.status] || scope.status;
    group.append(element("p", "calculation-source-scope-title", `${label}・${statusLabel}`));
    if (scope.notice) group.append(element("small", "", scope.notice));
    for (const sourceItem of scope.refs || []) {
      const sourceLink = element("a");
      sourceLink.href = sourceItem.url;
      sourceLink.target = "_blank";
      sourceLink.rel = "noreferrer";
      sourceLink.append(element("strong", "", sourceItem.title), element("span", "", `${sourceItem.organization}・${sourceItem.id}`));
      group.append(sourceLink);
    }
    if (!(scope.refs || []).length) {
      group.append(element("p", "calculation-source-empty", emptyText));
    }
    sources.append(group);
  }
  auditBody.append(inputGrid, warnings, sources);
  audit.append(auditSummary, auditBody);

  const boundary = element("p", "iching-boundary", "此處只依固定規則呈現卦象結構、體用位置與原文節錄，不產生事件預測或決策建議。除以 6 整除時歸上爻，是為完整表示六爻範圍採用的實作判定。");
  section.append(heading, grid, trace, roles, influences);
  if (seasonal) section.append(seasonal);
  section.append(audit, boundary, createClassicExcerpt(result));
  return section;
}

function revealResult(anchor) {
  window.setTimeout(() => {
    anchor.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    anchor.querySelector("h2")?.focus({ preventScroll: true });
  }, 60);
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function initializeCurrentTimeDetection() {
  const status = document.querySelector("[data-current-time-detect]");
  const clock = status?.querySelector("[data-current-time]");
  const lunar = status?.querySelector("[data-current-lunar]");
  const timeZone = status?.querySelector("[data-current-timezone]");
  const note = document.querySelector("[data-current-time-note]");
  const applyButton = status?.querySelector("[data-detect-current-time]");
  const trackedFields = [...document.querySelectorAll('.kangjie-form [name="yearBranch"], .kangjie-form [name="lunarMonth"], .kangjie-form [name="lunarDay"], .kangjie-form [name="hourBranch"], #form-calendar [name="isLeapMonth"]')];
  if (!status || !clock || !lunar || !timeZone || !note || !applyButton) return;

  let manualOverride = false;

  function applyFields(detected) {
    const values = {
      yearBranch: detected.yearBranch,
      lunarMonth: detected.lunarMonth,
      lunarDay: detected.lunarDay,
    };
    for (const [name, value] of Object.entries(values)) {
      for (const field of document.querySelectorAll(`#form-calendar [name="${name}"], [data-auto-calendar="${name}"]`)) {
        field.value = String(value);
      }
    }
    for (const field of document.querySelectorAll('.kangjie-form [name="hourBranch"]')) {
      field.value = String(detected.hourBranch);
    }
    const leapField = document.querySelector('#form-calendar [name="isLeapMonth"]');
    if (leapField instanceof HTMLInputElement) leapField.checked = detected.isLeapMonth;
  }

  function refresh({ applyValues = false } = {}) {
    try {
      const calendarForm = document.querySelector("#form-calendar");
      const detected = detectCurrentCalendarParts(new Date(), {
        profile: calendarForm?.querySelector('[name="calendarProfile"]')?.value || "taipei-lunar-new-year-v1",
        timeZone: calendarForm?.querySelector('[name="timeZone"]')?.value || "Asia/Taipei",
      });
      currentCalendarState = detected;
      clock.textContent = detected.gregorianLabel;
      lunar.textContent = detected.lunarLabel;
      timeZone.textContent = detected.timeZoneLabel;
      status.dataset.state = "ready";
      if (applyValues) applyFields(detected);
      note.textContent = manualOverride
        ? `你已手動修正，欄位不會被時鐘覆蓋；按「重新套用現在」可恢復自動值。${detected.isLeapMonth ? "目前為閏月，月份取值仍需核對。" : "子初換日與年界仍需依採用曆法核對。"}`
        : detected.isLeapMonth
          ? `已自動填入同名月份 ${detected.lunarMonth}。目前為閏月，月份取值、子初換日與年界仍需依採用曆法核對。`
          : "已依裝置時間自動填入。子初換日與年界仍需依採用曆法另行核對，也可手動修正。";
    } catch (error) {
      status.dataset.state = "error";
      currentCalendarState = null;
      clock.textContent = "無法自動偵測";
      lunar.textContent = error instanceof Error ? error.message : "請手動輸入年月日時。";
      timeZone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "本機時區";
      note.textContent = "請保留手動輸入並確認裝置日期、時間與瀏覽器支援。";
    }
  }

  for (const field of trackedFields) {
    const markManual = () => {
      manualOverride = true;
      if (field.closest("#form-calendar")) currentCalendarIsManual = true;
      refresh();
    };
    field.addEventListener("input", markManual);
    field.addEventListener("change", markManual);
  }
  applyButton.addEventListener("click", () => {
    manualOverride = false;
    currentCalendarIsManual = false;
    refresh({ applyValues: true });
  });
  document.querySelector('#form-calendar [name="calendarProfile"]')?.addEventListener("change", () => {
    manualOverride = false;
    currentCalendarIsManual = false;
    refresh({ applyValues: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh({ applyValues: !manualOverride });
  });

  refresh({ applyValues: true });
  window.setInterval(() => refresh({ applyValues: !manualOverride }), 1000);
}

function setHidden(node, hidden) {
  if (node) node.hidden = hidden;
}

function updateSoundFields() {
  const form = document.querySelector("#form-sound");
  const single = form?.querySelector("[data-sound-mode]")?.value === "single";
  for (const field of form?.querySelectorAll("[data-segmented-sound]") || []) setHidden(field, single);
  setHidden(form?.querySelector("[data-single-sound]"), !single);
}

function updateTextFields() {
  const form = document.querySelector("#form-text");
  if (!form) return;
  const mode = form.querySelector("[data-text-mode]")?.value || "long";
  const count = countHanCharacters(form.querySelector("textarea")?.value);
  const customTextUsesStrokes = document.querySelector("[data-calculation-profile]")?.value === "user-custom-v1"
    && document.querySelector("[data-custom-text-mode]")?.value === "strokes";
  const needsStroke = mode === "strokes"
    || mode === "surname"
    || (mode === "classic" && count >= 2 && count <= 3)
    || (mode === "classic" && customTextUsesStrokes && count >= 4 && count <= 10);
  setHidden(form.querySelector("[data-stroke-workspace]"), !needsStroke);
  setHidden(form.querySelector("[data-name-calendar]"), mode !== "surname");
  setHidden(form.querySelector("[data-single-character-fields]"), !(mode === "classic" && count === 1));
  setHidden(form.querySelector("[data-tone-fields]"), !(mode === "classic" && count >= 4 && count <= 10));
  const submit = form.querySelector('button[type="submit"]');
  if (submit) {
    submit.firstChild.textContent = mode === "surname" ? "依姓名加數衍算" : mode === "long" ? "依字數衍算" : "依字占衍算";
  }
}

function updateProfileFields() {
  const profileId = document.querySelector("[data-calculation-profile]")?.value || "classic-primary-v1";
  const isCustom = profileId === "user-custom-v1";
  setHidden(document.querySelector("[data-custom-profile]"), !isCustom);
  const sizeVersion = document.querySelector('[data-size-version] select[name="version"]');
  if (sizeVersion) {
    sizeVersion.disabled = isCustom;
    sizeVersion.value = isCustom
      ? (document.querySelector("[data-custom-size-hour]")?.value === "no" ? "old-without-hour" : "modern-with-hour")
      : (profileId === "classic-variant-v1" ? "old-without-hour" : "modern-with-hour");
  }
  updateTextFields();
}

function updateSupplementFields() {
  const form = document.querySelector("#form-supplement");
  if (!form) return;
  const type = form.querySelector("[data-supplement-type]")?.value || "zhang-chi";
  const posterior = ["posterior", "person", "self", "animal", "static", "direction"].includes(type);
  setHidden(form.querySelector("[data-length-fields]"), posterior);
  setHidden(form.querySelector("[data-posterior-fields]"), !posterior);
  setHidden(form.querySelector("[data-trigger-field]"), !(type === "animal" || type === "static"));
  setHidden(form.querySelector("[data-size-version]"), type !== "chi-cun");
  setHidden(form.querySelector("[data-zhang-field]"), type !== "zhang-chi");
}

function updateObjectCandidates() {
  const form = document.querySelector("#form-supplement");
  const description = form?.querySelector("[data-object-description]");
  const container = form?.querySelector("[data-object-candidates]");
  const select = form?.querySelector("[data-object-trigram]");
  const confirmed = form?.querySelector("[data-object-confirmed]");
  if (!description || !container || !select || !confirmed) return;
  container.replaceChildren();
  const candidates = findObjectTrigramCandidates(description.value);
  for (const candidate of candidates) {
    const button = element("button");
    button.type = "button";
    if (select.value === String(candidate.trigramId)) button.classList.add("is-selected");
    button.append(element("strong", "", `${candidate.trigram}${candidate.trigramId}`), element("small", "", candidate.matches.join("、")));
    button.addEventListener("click", () => {
      select.value = String(candidate.trigramId);
      confirmed.value = "true";
      updateObjectCandidates();
    });
    container.append(button);
  }
}

function renderStrokeEvidence(form, resolution) {
  const container = form.querySelector("[data-stroke-evidence]");
  if (!container) return;
  container.replaceChildren();
  if (!resolution.characters.length) {
    container.textContent = "請先輸入至少一個漢字。";
    return;
  }
  resolution.lookups.forEach((lookup, index) => {
    const row = element("label", `stroke-evidence-row${lookup.requiresManualInput ? " is-unresolved" : ""}`);
    const selected = lookup.selected;
    const copy = element("span");
    copy.append(
      element("strong", "", lookup.character),
      element("small", "", selected
        ? `${selected.codePoints?.join(" ") || ""}・${selected.sourceLabel}・${selected.dataVersion || "本次手動"}`
        : "資料庫查不到，請手動輸入"),
    );
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "999";
    input.inputMode = "numeric";
    input.value = selected ? String(selected.strokes) : "";
    input.dataset.strokeManualIndex = String(index);
    input.dataset.autoValue = selected && !selected.manualOverride ? String(selected.strokes) : "";
    input.setAttribute("aria-label", `${lookup.character}的筆畫數`);
    row.append(copy, input, element("em", "", selected ? `${selected.strokes} 畫` : "待補"));
    container.append(row);
  });
}

async function resolveFormStrokes(form) {
  const text = form.querySelector("textarea")?.value || "";
  const dataset = await getStrokeDataset();
  const existingInputs = [...form.querySelectorAll("[data-stroke-manual-index]")];
  const manualOverrides = existingInputs.map((input) => (
    input.value && input.value !== input.dataset.autoValue ? input.value : undefined
  ));
  const resolution = resolveStrokeText(text, { unihanDataset: dataset, manualOverrides, prefer: "unicode" });
  strokeState.set(form, { text, resolution });
  renderStrokeEvidence(form, resolution);
  return resolution;
}

async function readyStrokeEntries(form) {
  const state = strokeState.get(form);
  const text = form.querySelector("textarea")?.value || "";
  const resolution = !state || state.text !== text ? await resolveFormStrokes(form) : await resolveFormStrokes(form);
  if (!resolution.ready) {
    throw new Error(`「${resolution.unresolved.map((item) => item.character).join("、")}」查不到筆畫，請逐字手動輸入後再計算。`);
  }
  return resolution.entries;
}

function initializeAdvancedFormControls() {
  document.querySelector("[data-calculation-profile]")?.addEventListener("change", updateProfileFields);
  document.querySelector("[data-custom-size-hour]")?.addEventListener("change", updateProfileFields);
  document.querySelector("[data-custom-text-mode]")?.addEventListener("change", updateTextFields);
  updateProfileFields();

  const soundMode = document.querySelector("[data-sound-mode]");
  soundMode?.addEventListener("change", updateSoundFields);
  updateSoundFields();

  const textForm = document.querySelector("#form-text");
  const textarea = textForm?.querySelector("textarea");
  const counter = textForm?.querySelector("[data-character-count]");
  const updateText = () => {
    if (counter) counter.textContent = `已計 ${countHanCharacters(textarea?.value)} 個漢字`;
    strokeState.delete(textForm);
    const evidence = textForm?.querySelector("[data-stroke-evidence]");
    if (evidence) evidence.textContent = "輸入姓名後按下自動計算。";
    updateTextFields();
  };
  textarea?.addEventListener("input", updateText);
    textForm?.querySelector("[data-text-mode]")?.addEventListener("change", () => {
      const mode = textForm.querySelector("[data-text-mode]")?.value;
      const profile = document.querySelector("[data-calculation-profile]");
      if (mode === "surname" && profile && ["classic-primary-v1", "classic-variant-v1"].includes(profile.value)) {
        profile.value = "modern-current-v1";
        updateProfileFields();
      }
      updateText();
    });
  textForm?.querySelector("[data-lookup-strokes]")?.addEventListener("click", async () => {
    const message = textForm.querySelector(".form-message");
    try {
      await resolveFormStrokes(textForm);
      message.textContent = "";
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : "筆畫資料無法載入。";
    }
  });
  updateText();

  document.querySelector("[data-supplement-type]")?.addEventListener("change", updateSupplementFields);
  const objectDescription = document.querySelector("[data-object-description]");
  objectDescription?.addEventListener("input", () => {
    const confirmed = document.querySelector("[data-object-confirmed]");
    if (confirmed) confirmed.value = "false";
    updateObjectCandidates();
  });
  document.querySelector("[data-object-trigram]")?.addEventListener("change", () => {
    const confirmed = document.querySelector("[data-object-confirmed]");
    if (confirmed) confirmed.value = "true";
    updateObjectCandidates();
  });
  updateObjectCandidates();
  updateSupplementFields();
}

async function calculateMeihuaForm(form) {
  const values = formValues(form);
  const profile = calculationProfile();
  values.profile = profile;
  if (form.id === "form-calendar") {
    const calendarInput = !currentCalendarIsManual && currentCalendarState
      ? { ...currentCalendarState, ...values, mode: "automatic", calendarProfile: values.calendarProfile }
      : { ...values, mode: "manual" };
    return calculateCalendarHexagram(calendarInput, { profile });
  }
  if (form.id === "form-object") return calculateObjectHexagram(values, { profile });
  if (form.id === "form-sound") {
    if (values.soundMode === "single") {
      if (profile === "legacy-existing-v1") throw new Error("原程式舊版沒有單一聲數法，請改選古籍主法或今本。");
      return calculateSingleSoundHexagram(values, { profile });
    }
    return calculateDoubleSoundHexagram(values, { profile });
  }
  if (form.id === "form-text") {
    const mode = values.textMode || "long";
    if (mode === "long") return calculateLongTextHexagram(values.text, { profile });
    if (profile === "legacy-existing-v1") throw new Error("原程式舊版只有 11 字以上字數法，沒有自動筆畫與姓名加數法。");
    if (mode === "surname") {
      const strokeEntries = await readyStrokeEntries(form);
      return calculateSurnameAdditionHexagram({ ...values, name: values.text, strokeEntries }, { profile });
    }
    if (mode === "strokes") {
      const strokeEntries = await readyStrokeEntries(form);
      return calculateStrokeHexagram({ ...values, strokeEntries }, { profile });
    }
    const count = countHanCharacters(values.text);
    const customTextUsesStrokes = typeof profile === "object" && profile.textFourToTen === "strokes";
    const textInput = {
      ...values,
      strokeEntries: (count >= 2 && count <= 3) || (customTextUsesStrokes && count >= 4 && count <= 10)
        ? await readyStrokeEntries(form)
        : undefined,
      toneValues: String(values.toneValues || "").split(/[,，\s]+/).filter(Boolean),
    };
    return calculateTextHexagram(textInput, { profile });
  }
  if (profile === "legacy-existing-v1") throw new Error("原程式舊版沒有古例補充入口，請改選古籍主法、古本異文或今本。");
  if (values.supplementType === "zhang-chi") return calculateZhangChiHexagram(values, { profile });
  if (values.supplementType === "chi-cun") return calculateChiCunHexagram(values, { profile });
  return calculatePosteriorHexagram({
    ...values,
    scenario: values.supplementType,
  }, { profile });
}

function initializeMeihuaForms() {
  const anchor = document.querySelector("#kangjie-result");
  for (const form of document.querySelectorAll(".kangjie-form")) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = form.querySelector(".form-message");
      try {
        const result = await calculateMeihuaForm(form);
        message.textContent = "";
        anchor.replaceChildren(createKangjieResult(result));
        revealResult(anchor);
      } catch (error) {
        anchor.replaceChildren();
        message.textContent = error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。";
        form.querySelector("input, select, textarea")?.focus();
      }
    });
  }
}

function createHuangjiResult(result) {
  const section = element("section", "huangji-calculation-result");
  section.setAttribute("aria-labelledby", "huangji-result-title");
  const title = element("h2");
  title.id = "huangji-result-title";
  title.tabIndex = -1;
  title.append(brushTitleElement("public/visuals/brush/title-kangjie-result-v1.webp", "衍算結果", "brush-kangjie-result"));
  const isPosition = result.mode === "position";
  const values = isPosition
    ? [["會序", result.position.hui], ["運序", result.position.yun], ["世序", result.position.shi], ["年序", result.position.year], ["週期位移", result.cycleOffset]]
    : [["元", result.units.yuan], ["會", result.units.hui], ["運", result.units.yun], ["世", result.units.shi], ["餘年", result.units.years]];
  const grid = element("div", "huangji-output-grid");
  for (const [label, value] of values) {
    const card = element("article");
    card.append(element("span", "", label), element("strong", "", value));
    grid.append(card);
  }
  const boundaryText = isPosition
    ? `${result.epoch.notice} 本結果依可設定錨點作數學定位，不主張唯一傳統紀元。`
    : "這是時間長度的單位換算，不是西元紀年定位、天文週期證明或事件預言。";
  const audit = element("details", "calculation-audit huangji-audit");
  const auditSummary = element("summary");
  auditSummary.append(element("strong", "", "完整演算明細"), element("span", "", `${result.algorithmVersion}・${result.profileId}`));
  const auditBody = element("div", "calculation-audit-body");
  const inputGrid = element("div", "calculation-input-grid");
  const originalCard = element("article");
  originalCard.append(element("span", "", "原始輸入"), element("pre", "", JSON.stringify(result.calculationTrace.originalInput, null, 2)));
  const normalizedCard = element("article");
  normalizedCard.append(element("span", "", "正規化輸入"), element("pre", "", JSON.stringify(result.calculationTrace.normalizedInput, null, 2)));
  inputGrid.append(originalCard, normalizedCard);
  const steps = element("ol", "huangji-step-list");
  for (const step of result.calculationTrace.steps || []) steps.append(element("li", "", JSON.stringify(step)));
  const warnings = element("ul", "calculation-warning-list");
  for (const warning of result.calculationTrace.warnings || []) warnings.append(element("li", "", warning));
  const sources = element("div", "calculation-source-list");
  for (const sourceItem of result.sourceRefs) {
    const link = element("a");
    link.href = sourceItem.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.append(element("strong", "", sourceItem.title), element("span", "", `${sourceItem.organization}・${sourceItem.id}`));
    sources.append(link);
  }
  auditBody.append(inputGrid, steps, warnings, sources);
  audit.append(auditSummary, auditBody);
  section.append(
    element("p", "section-index", isPosition ? `${result.targetLabel}・${result.profileLabel}` : `時間長度 ${result.totalYears} 年`),
    title,
    grid,
    element("code", "huangji-equation", result.equation),
    audit,
    element("p", "iching-boundary", boundaryText),
  );
  return section;
}

function initializeHuangjiForm() {
  const form = document.querySelector("#huangji-form");
  const anchor = document.querySelector("#huangji-result");
  const updateMode = () => {
    const position = form?.querySelector("[data-huangji-mode]")?.value === "position";
    setHidden(form?.querySelector("[data-huangji-duration]"), position);
    setHidden(form?.querySelector("[data-huangji-position]"), !position);
  };
  form?.querySelector("[data-huangji-mode]")?.addEventListener("change", updateMode);
  updateMode();
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = form.querySelector(".form-message");
    try {
      const values = formValues(form);
      const result = values.mode === "position"
        ? calculateHuangjiPosition(values)
        : decomposeHuangjiYears(values.years);
      message.textContent = "";
      anchor.replaceChildren(createHuangjiResult(result));
      revealResult(anchor);
    } catch (error) {
      anchor.replaceChildren();
      message.textContent = error instanceof Error ? error.message : "年數無法分解，請重新確認。";
      form.querySelector("input")?.focus();
    }
  });
}

initializeAccessGate();
initializePageTabs();
initializeMethodTabs();
initializeCurrentTimeDetection();
initializeAdvancedFormControls();
initializeMeihuaForms();
initializeHuangjiForm();
initializeMethodDeepLink();
