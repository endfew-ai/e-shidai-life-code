import { getIChingText } from "./iching-text.js";
import { lineNames } from "./calculator-core.js";
import {
  calculateCalendarHexagram,
  calculateDoubleSoundHexagram,
  calculateLongTextHexagram,
  calculateObjectHexagram,
  countHanCharacters,
  decomposeHuangjiYears,
} from "./kangjie-core.js";

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

function createHexagramLines(lines, movingIndex = -1, mark = "") {
  const wrapper = element("div", "hexagram-lines");
  wrapper.setAttribute("aria-label", "六爻卦象，畫面由上爻排列至初爻");
  for (const index of [5, 4, 3, 2, 1, 0]) {
    const row = element("div", `line-row${index === movingIndex ? " is-moving" : ""}`);
    const line = element("span", `yao ${lines[index] === 1 ? "yang" : "yin"}`);
    line.setAttribute("aria-label", lines[index] === 1 ? "陽爻" : "陰爻");
    line.append(element("i"));
    if (lines[index] === 0) line.append(element("i"));
    row.append(element("span", "", lineNames[index]), line, element("strong", "", index === movingIndex ? mark : ""));
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
  card.append(header, element("p", "", `上${value.upper.name}（${value.upper.nature}）・下${value.lower.name}（${value.lower.nature}）`), createHexagramLines(value.lines, movingIndex, mark));
  return card;
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
  source.append("本文核對：", link, "。只列原文，不作吉凶解讀。");
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
  heading.append(headingCopy, moving);

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
  body.append(element("span", "", "體卦"), element("strong", "", `${result.roles.body.symbol} ${result.roles.body.name}`), element("small", "", result.roles.body.nature));
  const use = element("article");
  use.append(element("span", "", "用卦"), element("strong", "", `${result.roles.use.symbol} ${result.roles.use.name}`), element("small", "", result.roles.use.nature));
  roles.append(body, use, element("p", "", result.roles.note));

  const boundary = element("p", "iching-boundary", "此處只依固定規則呈現卦象結構、體用位置與原文節錄，不產生事件預測或決策建議。除以 6 整除時歸上爻，是為完整表示六爻範圍採用的實作判定。");
  section.append(heading, grid, trace, roles, boundary, createClassicExcerpt(result));
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

function initializeMeihuaForms() {
  const anchor = document.querySelector("#kangjie-result");
  for (const form of document.querySelectorAll(".kangjie-form")) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.querySelector(".form-message");
      try {
        const values = formValues(form);
        const result = form.id === "form-calendar"
          ? calculateCalendarHexagram(values)
          : form.id === "form-object"
            ? calculateObjectHexagram(values)
            : form.id === "form-sound"
              ? calculateDoubleSoundHexagram(values)
              : calculateLongTextHexagram(values.text);
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

  const textarea = document.querySelector("#form-text textarea");
  const counter = document.querySelector("[data-character-count]");
  textarea?.addEventListener("input", () => {
    counter.textContent = `已計 ${countHanCharacters(textarea.value)} 個漢字`;
  });
}

function createHuangjiResult(result) {
  const section = element("section", "huangji-calculation-result");
  section.setAttribute("aria-labelledby", "huangji-result-title");
  const title = element("h2");
  title.id = "huangji-result-title";
  title.tabIndex = -1;
  title.append(brushTitleElement("public/visuals/brush/title-kangjie-result-v1.webp", "衍算結果", "brush-kangjie-result"));
  const values = [
    ["元", result.units.yuan],
    ["會", result.units.hui],
    ["運", result.units.yun],
    ["世", result.units.shi],
    ["餘年", result.units.years],
  ];
  const grid = element("div", "huangji-output-grid");
  for (const [label, value] of values) {
    const card = element("article");
    card.append(element("span", "", label), element("strong", "", value));
    grid.append(card);
  }
  section.append(element("p", "section-index", `時間長度 ${result.totalYears} 年`), title, grid, element("code", "huangji-equation", result.equation), element("p", "iching-boundary", "這是時間長度的單位換算，不是西元紀年定位、天文週期證明或事件預言。"));
  return section;
}

function initializeHuangjiForm() {
  const form = document.querySelector("#huangji-form");
  const anchor = document.querySelector("#huangji-result");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = form.querySelector(".form-message");
    try {
      const result = decomposeHuangjiYears(formValues(form).years);
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

initializePageTabs();
initializeMethodTabs();
initializeMeihuaForms();
initializeHuangjiForm();
