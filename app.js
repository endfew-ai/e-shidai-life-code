import {
  LO_SHU_ORDER,
  analyzeBirthday,
  analyzeDigitCode,
  calculateIChing,
  lineNames,
  localDateString,
  masterThemes,
  profiles,
} from "./calculator-core.js";
import { getIChingText } from "./iching-text.js";

const modeContent = {
  birthday: {
    label: "生日命碼",
    description: "生命路徑、生日數、態度數與個人流年",
    button: "分析生日命碼",
    help: "只需西元生日，不需姓名、時辰或身分證字號。",
    art: "public/visuals/birthday-panel-b-v3.webp",
    titleArt: "public/visuals/brush/title-birthday-v4.webp",
    alt: "古金曆法年輪與生日節點模組背景",
  },
  code: {
    label: "數字頻譜",
    description: "任意號碼的加總、核心數與數字分布",
    button: "分析數字頻譜",
    help: "接受半形或全形數字、空白與半形連字號；請勿輸入敏感資料。",
    art: "public/visuals/digit-spectrum-panel-b-v3.webp",
    titleArt: "public/visuals/brush/title-spectrum-v4.webp",
    alt: "古金數字頻率波形與九點節律模組背景",
  },
  iching: {
    label: "三數取卦",
    description: "固定卦表推算本卦、互卦、動爻與變卦",
    button: "開始三數取卦",
    help: "三個整數各自取卦，不會把生日或一串號碼自動切段。",
    art: "public/visuals/iching-instrument-b-v3.webp",
    titleArt: "public/visuals/brush/title-iching-v4.webp",
    alt: "低亮古金六爻測量儀視覺",
  },
};

function element(tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function imageElement(src, alt = "") {
  const image = element("img");
  image.src = src;
  image.alt = alt;
  return image;
}

function brushTitleElement(src, text, className = "") {
  const title = element("span", `brush-title ${className}`.trim());
  const accessibleText = element("span", "sr-only", text);
  const image = imageElement(src, "");
  image.className = "brush-title-image";
  image.setAttribute("aria-hidden", "true");
  title.append(accessibleText, image);
  return title;
}

function panelHeading(kicker, title, badge) {
  const header = element("header", "panel-heading");
  const copy = element("div");
  copy.append(element("p", "", kicker), element("h3", "", title));
  header.append(copy);
  if (badge) header.append(element("span", "", badge));
  return header;
}

function createMetricCard(label, value, note) {
  const card = element("article", "metric-card");
  card.append(element("p", "", label), element("strong", "", value), element("span", "", note));
  return card;
}

function createCalculationCard(result) {
  const card = element("details", "result-disclosure calculation-card");
  const summary = element("summary");
  const summaryCopy = element("span");
  summaryCopy.append(element("small", "", "計算軌跡"), element("strong", "", "查看完整算式"));
  summary.append(summaryCopy, element("em", "", `${result.calculations.length} 步可逐項核對`));
  const body = element("div", "disclosure-body");
  body.append(panelHeading("計算軌跡", "這個結果怎麼算", "可逐步核對"));
  const list = element("ol", "calculation-list");
  for (const item of result.calculations) {
    const row = element("li");
    row.append(element("span", "", item.label), element("code", "", item.text));
    list.append(row);
  }
  body.append(list);

  if (result.kind === "birthday") {
    const cycles = element("div", "year-cycle");
    cycles.setAttribute("aria-label", "三年個人流年");
    for (const cycle of result.cycles) {
      const cycleCard = element("div", cycle.year === result.personalYear.year ? "is-current" : "");
      cycleCard.append(element("span", "", cycle.year), element("strong", "", cycle.value), element("small", "", cycle.year === result.personalYear.year ? "今年" : "流年"));
      cycles.append(cycleCard);
    }
    body.append(cycles);
  }
  card.append(summary, body);
  return card;
}

function createDigitDistribution(result) {
  const title = result.kind === "birthday" ? "生日數字九宮分布" : "自訂數字九宮分布";
  const card = element("details", "result-disclosure calculation-card digit-distribution");
  const summary = element("summary");
  const summaryCopy = element("span");
  summaryCopy.append(element("small", "", "數字分布"), element("strong", "", "查看完整九宮"));
  summary.append(summaryCopy, element("em", "", `出現 ${9 - result.missing.length} 種・缺少 ${result.missing.length} 種`));
  const body = element("div", "disclosure-body");
  body.append(panelHeading("數字分布", title, `數字 0 出現 ${result.zeroCount} 次`));
  body.append(element("p", "panel-copy", "採洛書 4・9・2／3・5・7／8・1・6 版位呈現次數。這是現代視覺化，不宣稱為古法命盤。"));
  const grid = element("div", "lo-shu-grid");
  grid.setAttribute("aria-label", "一到九數字出現次數");
  for (const digit of LO_SHU_ORDER) {
    const count = result.counts[digit];
    const cell = element("div", `digit-cell ${count ? "is-present" : "is-missing"}`);
    const bar = element("i");
    bar.style.setProperty("--count", String(Math.min(count, 4)));
    bar.setAttribute("aria-hidden", "true");
    cell.append(element("strong", "", digit), element("span", "", count ? `${count} 次` : "未出現"), bar);
    grid.append(cell);
  }
  body.append(grid, element("p", "missing-summary", result.missing.length ? `未出現：${result.missing.join("、")}` : "1 到 9 都有出現"));
  card.append(summary, body);
  return card;
}

function createInsightLedger(profile) {
  const section = element("details", "insight-ledger");
  section.setAttribute("aria-labelledby", "insight-title");
  const summary = element("summary");
  const heading = element("span");
  const headingTitle = element("strong");
  headingTitle.id = "insight-title";
  headingTitle.append(brushTitleElement("public/visuals/brush/title-insight-v5.webp", "把結果變成可觀察的問題", "brush-insight"));
  heading.append(element("small", "", "原型參考"), headingTitle);
  summary.append(heading, element("em", "", "4 項觀察提醒"));
  const grid = element("div");
  const items = [
    ["01", "核心傾向", profile.traits],
    ["02", "壓力提醒", profile.shadow],
    ["03", "日常照顧", profile.wellbeing],
    ["04", "溝通提醒", profile.markerDesc],
  ];
  for (const [index, title, copy] of items) {
    const article = element("article");
    article.append(element("span", "", index), element("h4", "", title));
    if (index === "04") article.append(element("blockquote", "", `「${profile.marker}」`));
    article.append(element("p", "", copy));
    grid.append(article);
  }
  section.append(summary, grid);
  return section;
}

function createResetButton(label, onReset) {
  const wrapper = element("div", "result-actions");
  const button = element("button", "secondary-button", label);
  button.type = "button";
  button.addEventListener("click", onReset);
  wrapper.append(button);
  return wrapper;
}

function createNumerologyResult(result, onReset) {
  const profile = profiles[result.profileNumber];
  const section = element("section", "results");
  section.setAttribute("aria-labelledby", "result-title");

  const hero = element("header", "result-hero");
  const copy = element("div", "result-copy");
  const title = element("h2", "brush-result-title");
  title.id = "result-title";
  title.tabIndex = -1;
  title.append(brushTitleElement("public/visuals/brush/title-result-v4.webp", "數理結果"));
  const value = element("div", "result-value");
  value.append(document.createTextNode(result.headlineValue), element("small", "", profile.title));
  copy.append(title, value, element("p", "", `${profile.symbol}。以下內容只作文化娛樂與自我提問參考。`));
  const art = element("figure", "result-art");
  art.append(
    imageElement(result.kind === "birthday" ? "public/visuals/numerology-result-panel-b-v3.webp" : "public/visuals/digit-spectrum-panel-b-v3.webp", "古金數理節點分析模組背景"),
    element("figcaption", "", `核心數 ${result.headlineValue}`),
  );
  hero.append(copy, art);
  section.append(hero);

  const metrics = result.kind === "birthday"
    ? [
        ["生命路徑數", result.lifePath.display, "月、日、年分段化簡"],
        ["生日數", result.birthday.display, "保留原日期與基底"],
        ["態度數", String(result.attitude.value), "出生月加出生日"],
        [`${result.personalYear.year} 個人流年`, String(result.personalYear.value), "採 1 至 12 月曆年制"],
      ]
    : [
        ["數字位數", String(result.length), "只計入實際數字"],
        ["逐位總和", String(result.sum), "尚未收斂的總和"],
        ["核心數", String(result.core), "逐位加總至 1 到 9"],
        ["最常出現", result.strongest.join("、"), result.strongest.length > 1 ? "並列最高次數" : "出現次數最高"],
      ];
  const metricGrid = element("div", "metric-grid");
  for (const metric of metrics) metricGrid.append(createMetricCard(...metric));
  section.append(metricGrid);

  if (result.kind === "birthday" && result.lifePath.isMaster) {
    const note = element("div", "master-note");
    note.setAttribute("role", "note");
    note.append(element("strong", "", `主數 ${result.lifePath.value}／基底 ${result.lifePath.base}`), element("p", "", masterThemes[result.lifePath.value]));
    section.append(note);
  }

  const overview = element("div", "result-overview");
  overview.append(createCalculationCard(result), createDigitDistribution(result));
  section.append(overview, createInsightLedger(profile));

  const advice = element("article", "advice-card");
  const adviceMark = element("span", "", "策");
  adviceMark.setAttribute("aria-hidden", "true");
  const adviceCopy = element("div");
  adviceCopy.append(element("h3", "", "本次自我提問"), element("p", "", profile.advice));
  advice.append(adviceMark, adviceCopy);
  section.append(advice, createResetButton("重新分析另一筆資料", onReset));
  return section;
}

function createHexagramLines(lines, movingIndex = -1, mark = "") {
  const container = element("div", "hexagram-lines");
  container.setAttribute("aria-label", "六爻卦象，畫面由上爻排列至初爻");
  for (const index of [5, 4, 3, 2, 1, 0]) {
    const row = element("div", `line-row ${index === movingIndex ? "is-moving" : ""}`);
    const yao = element("span", `yao ${lines[index] === 1 ? "yang" : "yin"}`);
    yao.setAttribute("aria-label", lines[index] === 1 ? "陽爻" : "陰爻");
    yao.append(element("i"));
    if (lines[index] === 0) yao.append(element("i"));
    row.append(element("span", "", lineNames[index]), yao, element("strong", "", index === movingIndex ? mark : ""));
    container.append(row);
  }
  return container;
}

function createHexagramCard(label, value, movingIndex = -1, mark = "") {
  const text = getIChingText(value.hexId);
  const card = element("article", "hexagram-card");
  const header = element("header");
  const heading = element("div");
  const title = element("h3");
  title.append(element("span", "", text.symbol), document.createTextNode(value.name));
  heading.append(element("p", "", label), title);
  header.append(heading, element("small", "", `第 ${value.hexId} 卦`));
  card.append(header, element("p", "", `上${value.upper.name}（${value.upper.nature}）・下${value.lower.name}（${value.lower.nature}）`), createHexagramLines(value.lines, movingIndex, mark));
  return card;
}

function createOriginalTextPanel(result) {
  const original = getIChingText(result.original.hexId);
  const transformed = getIChingText(result.transformed.hexId);
  const panel = element("details", "classic-panel");
  panel.setAttribute("aria-labelledby", "classic-title");
  const summary = element("summary", "classic-summary");
  const summaryCopy = element("span");
  const headingTitle = element("strong");
  headingTitle.id = "classic-title";
  headingTitle.append(brushTitleElement("public/visuals/brush/title-classic-v4.webp", "易經本文", "brush-classic"));
  summaryCopy.append(element("small", "", "補充資料"), headingTitle);
  summary.append(summaryCopy, element("em", "", "展開卦辭、彖、象與六爻原文"), element("i", "", "只列原文，不解卦"));
  const art = imageElement("public/visuals/iching-manuscript-b-v3.webp", "");
  art.className = "classic-panel-art";
  art.setAttribute("aria-hidden", "true");
  const inner = element("div", "classic-panel-inner");

  const name = element("div", "classic-name");
  const symbol = element("span", "", original.symbol);
  symbol.setAttribute("aria-hidden", "true");
  const nameCopy = element("div");
  nameCopy.append(element("small", "", `第 ${original.id} 卦`), element("h3", "", `${original.name}・${original.fullName}`));
  name.append(symbol, nameCopy);

  const columns = element("div", "classic-columns");
  for (const [title, copy] of [["卦辭", original.judgment], ["彖曰", original.tuan], ["象曰", original.image]]) {
    const article = element("article");
    article.append(element("h4", "", title), element("p", "", copy));
    columns.append(article);
  }

  const lines = element("div", "line-texts");
  lines.append(element("h4", "", "六爻原文"));
  for (const [index, line] of original.lines.entries()) {
    const article = element("article", index === result.moving.index ? "is-active" : "");
    const copy = element("div");
    copy.append(element("p", "", line.text), element("small", "", `《象》曰：${line.image}`));
    article.append(element("span", "", index === result.moving.index ? "動爻" : String(line.position).padStart(2, "0")), copy);
    lines.append(article);
  }
  for (const special of original.special) {
    const article = element("article");
    const copy = element("div");
    copy.append(element("p", "", special.text));
    if (special.image) copy.append(element("small", "", `《象》曰：${special.image}`));
    article.append(element("span", "", "用"), copy);
    lines.append(article);
  }

  inner.append(name, columns, lines);
  if (original.wenyan) {
    const details = element("details", "classic-details");
    details.append(element("summary", "", "展開《文言》原文"), element("p", "", original.wenyan));
    inner.append(details);
  }
  const transformedDetails = element("details", "classic-details");
  const transformedCopy = element("div");
  transformedCopy.append(element("h4", "", "卦辭"), element("p", "", transformed.judgment), element("h4", "", "象曰"), element("p", "", transformed.image));
  transformedDetails.append(element("summary", "", `查看變卦第 ${transformed.id} 卦「${transformed.name}」本文`), transformedCopy);
  inner.append(transformedDetails);

  const source = element("p", "classic-source", "本文來源：");
  const link = element("a", "", "維基文庫《周易》");
  link.href = `https://zh.wikisource.org/wiki/${encodeURIComponent(original.sourceTitle)}`;
  link.target = "_blank";
  link.rel = "noreferrer";
  source.append(link, document.createTextNode(`，修訂版本 ${original.sourceRevision}。`));
  inner.append(source);
  panel.append(summary, art, inner);
  return panel;
}

function createIChingResult(result, onReset) {
  const section = element("section", "iching-results");
  section.setAttribute("aria-labelledby", "iching-result-title");
  const heading = element("header", "iching-result-heading");
  const titleCopy = element("div");
  const title = element("h2", "brush-iching-title");
  title.id = "iching-result-title";
  title.tabIndex = -1;
  title.append(brushTitleElement("public/visuals/brush/title-iching-v4.webp", "三數取卦"));
  titleCopy.append(title, element("p", "iching-structure", "本卦・互卦・變卦"));
  const summary = element("p");
  summary.append(document.createTextNode("動爻為"), element("strong", "", result.moving.name), document.createTextNode(`，${result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。`));
  heading.append(titleCopy, summary);

  const grid = element("div", "hexagram-grid");
  grid.append(createHexagramCard("本卦", result.original, result.moving.index, "動"), createHexagramCard("互卦", result.mutual), createHexagramCard("變卦", result.transformed, result.moving.index, "變"));

  const trace = element("div", "iching-trace");
  const traces = [
    ["第一數取上卦", `${result.inputs[0]} ÷ 8 → 餘 ${result.remainders[0]}（${result.original.upper.name}）`],
    ["第二數取下卦", `${result.inputs[1]} ÷ 8 → 餘 ${result.remainders[1]}（${result.original.lower.name}）`],
    ["第三數取動爻", `${result.inputs[2]} ÷ 6 → 餘 ${result.remainders[2]}（${result.moving.name}）`],
  ];
  for (const [label, value] of traces) {
    const item = element("div");
    item.append(element("span", "", label), element("strong", "", value));
    trace.append(item);
  }

  section.append(
    heading,
    grid,
    trace,
    element("p", "iching-boundary", "本模式採現代三數先天數法，與生日命碼完全分開。只做固定卦象計算，不提供吉凶、預測或決策建議。"),
    createOriginalTextPanel(result),
    createResetButton("重新輸入三個數字", onReset),
  );
  return section;
}

function initializeAnalyzer() {
  const form = document.querySelector("#analyzer-form");
  if (!form) return;
  const modeInputs = [...document.querySelectorAll('input[name="analysis-mode"]')];
  const modeLabels = [...document.querySelectorAll("[data-mode-label]")];
  const modePanels = [...document.querySelectorAll("[data-mode-panel]")];
  const birthdayInput = document.querySelector("#birthday-input");
  const codeInput = document.querySelector("#number-code");
  const ichingInputs = [...document.querySelectorAll(".iching-input")];
  const message = document.querySelector("#input-message");
  const help = document.querySelector("#input-help");
  const clearButton = document.querySelector("#clear-button");
  const analyzeButton = document.querySelector("#analyze-button");
  const analyzerTitleText = document.querySelector("#analyzer-title-text");
  const analyzerTitleImage = document.querySelector("#analyzer-title-image");
  const analyzerDescription = document.querySelector("#analyzer-description");
  const modeArt = document.querySelector("#mode-art-image");
  const resultAnchor = document.querySelector("#result-anchor");
  let mode = "birthday";

  birthdayInput.max = localDateString();
  document.querySelector("#copyright-year").textContent = new Date().getFullYear();

  function currentInputs() {
    if (mode === "birthday") return [birthdayInput];
    if (mode === "code") return [codeInput];
    return ichingInputs;
  }

  function hasCurrentValue() { return currentInputs().some((input) => input.value.length > 0); }
  function clearResult() { resultAnchor.replaceChildren(); }
  function setInvalid(invalid) { for (const input of currentInputs()) input.setAttribute("aria-invalid", String(invalid)); }
  function updateClearButton() { clearButton.hidden = !hasCurrentValue(); }
  function focusResult() {
    window.setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultAnchor.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      resultAnchor.querySelector("h2")?.focus({ preventScroll: true });
    }, 80);
  }

  function changeMode(nextMode) {
    mode = nextMode;
    for (const panel of modePanels) panel.hidden = panel.dataset.modePanel !== mode;
    for (const label of modeLabels) label.classList.toggle("is-active", label.dataset.modeLabel === mode);
    analyzerTitleText.textContent = modeContent[mode].label;
    analyzerTitleImage.src = modeContent[mode].titleArt;
    analyzerDescription.textContent = modeContent[mode].description;
    help.textContent = modeContent[mode].help;
    analyzeButton.firstChild.textContent = modeContent[mode].button;
    modeArt.src = modeContent[mode].art;
    modeArt.alt = modeContent[mode].alt;
    message.textContent = "";
    setInvalid(false);
    clearResult();
    updateClearButton();
    window.setTimeout(() => currentInputs()[0].focus(), 0);
  }

  function resetCurrent() {
    for (const input of currentInputs()) input.value = "";
    message.textContent = "";
    setInvalid(false);
    clearResult();
    updateClearButton();
    currentInputs()[0].focus();
  }

  for (const input of modeInputs) input.addEventListener("change", () => changeMode(input.value));
  for (const input of [birthdayInput, codeInput, ...ichingInputs]) {
    input.addEventListener("input", () => {
      message.textContent = "";
      setInvalid(false);
      updateClearButton();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const result = mode === "birthday"
        ? analyzeBirthday(birthdayInput.value, new Date().getFullYear(), localDateString())
        : mode === "code" ? analyzeDigitCode(codeInput.value) : calculateIChing(ichingInputs.map((input) => input.value));
      message.textContent = "";
      setInvalid(false);
      resultAnchor.replaceChildren(result.kind === "iching" ? createIChingResult(result, resetCurrent) : createNumerologyResult(result, resetCurrent));
      focusResult();
    } catch (error) {
      clearResult();
      message.textContent = error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。";
      setInvalid(true);
      currentInputs()[0].focus();
    }
  });

  clearButton.addEventListener("click", resetCurrent);
  updateClearButton();
}

if (typeof document !== "undefined") initializeAnalyzer();
