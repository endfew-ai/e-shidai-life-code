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
import {
  hasIChingAccess,
  isIChingAccessCode,
  loadCumulativeVisitCount,
  rememberIChingAccess,
} from "./site-services.js";
import { analyzeBirthdayV2 } from "./application/numerology-analysis.js";
import { mountNumerologyWorkspace } from "./application/advanced-workspace.js";
import {
  loadNumerologySettings,
  resolveSettingsRuleSet,
  saveAnalysisHistory,
} from "./infrastructure/numerology-storage.js";

const modeContent = {
  birthday: {
    label: "生日命碼",
    description: "生命路徑、生日數、個人流年與傳統對應色",
    button: "分析生日命碼",
    help: "只需西元生日；身分證請使用下方獨立入口。",
    art: "public/visuals/life-path-instrument-aaa-v1.webp",
    titleArt: "public/visuals/brush/title-birthday-web-v1.webp",
    alt: "九節點古金生命靈數分析儀",
  },
  code: {
    label: "數字頻譜",
    description: "任意號碼的加總、核心數與數字分布",
    button: "分析數字頻譜",
    help: "接受半形或全形數字、空白與半形連字號；請勿輸入敏感資料。",
    art: "public/visuals/digit-spectrum-panel-b-v3.webp",
    titleArt: "public/visuals/brush/title-spectrum-web-v1.webp",
    alt: "古金數字頻率波形與九點節律模組背景",
  },
  iching: {
    label: "三數取卦",
    description: "輸入密碼後推算本卦、互卦、動爻與變卦",
    button: "開始三數取卦",
    help: "三個整數各自取卦，不會把生日或一串號碼自動切段。",
    art: "public/visuals/iching-instrument-b-v3.webp",
    titleArt: "public/visuals/brush/title-iching-web-v1.webp",
    alt: "低亮古金六爻測量儀視覺",
  },
};

const fixedBrushTitles = {
  "這個結果怎麼算": "public/visuals/brush/title-calculation-explain-v2.webp",
  "生日數字九宮分布": "public/visuals/brush/title-grid-birthday-v2.webp",
  "自訂數字九宮分布": "public/visuals/brush/title-grid-code-v2.webp",
  "核心傾向": "public/visuals/brush/title-insight-core-v2.webp",
  "壓力提醒": "public/visuals/brush/title-insight-pressure-v2.webp",
  "日常照顧": "public/visuals/brush/title-insight-care-v2.webp",
  "溝通提醒": "public/visuals/brush/title-insight-communication-v2.webp",
  "本次自我提問": "public/visuals/brush/title-self-question-v2.webp",
  "個人色彩指引": "public/visuals/brush/title-color-guide-v1.webp",
  "本卦": "public/visuals/brush/title-hex-original-v2.webp",
  "互卦": "public/visuals/brush/title-hex-mutual-v2.webp",
  "變卦": "public/visuals/brush/title-hex-changed-v2.webp",
  "卦辭": "public/visuals/brush/title-judgment-v2.webp",
  "彖曰": "public/visuals/brush/title-tuan-v2.webp",
  "象曰": "public/visuals/brush/title-image-saying-v2.webp",
  "六爻原文": "public/visuals/brush/title-six-lines-v2.webp",
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

function brushTitleElement(src, text, className = "", { lazy = false } = {}) {
  const title = element("span", `brush-title ${className}`.trim());
  const accessibleText = element("span", "sr-only", text);
  const image = imageElement(src, "");
  image.className = "brush-title-image";
  image.setAttribute("aria-hidden", "true");
  if (lazy) {
    image.loading = "lazy";
    image.decoding = "async";
  }
  title.append(accessibleText, image);
  return title;
}

function fixedBrushTitleElement(text, className = "", options = {}) {
  const src = fixedBrushTitles[text];
  if (!src) throw new Error(`缺少固定毛筆標題資產：${text}`);
  return brushTitleElement(src, text, className, options);
}

function panelHeading(kicker, title, badge) {
  const header = element("header", "panel-heading");
  const copy = element("div");
  const heading = element("h3", "brush-fixed-heading");
  heading.append(fixedBrushTitleElement(title, "brush-panel-title"));
  copy.append(element("p", "", kicker), heading);
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
  const gridResult = result.kind === "birthday" ? result.birthGrid : null;
  const displayOrder = gridResult?.displayOrder ?? LO_SHU_ORDER;
  const displayCounts = gridResult?.counts ?? result.counts;
  const layoutCopy = gridResult?.layoutProfile === "standard_1_to_9"
    ? "依 1・2・3／4・5・6／7・8・9 排列；連線判定依規則資料，不由畫面位置猜測。"
    : "採洛書 4・9・2／3・5・7／8・1・6 版位呈現次數。這是現代視覺化，不宣稱為古法命盤。";
  body.append(element("p", "panel-copy", layoutCopy));
  const grid = element("div", "lo-shu-grid");
  grid.setAttribute("aria-label", "一到九數字出現次數");
  for (const digit of displayOrder) {
    const count = displayCounts[digit];
    const cell = element("div", `digit-cell ${count ? "is-present" : "is-missing"}`);
    const bar = element("i");
    bar.style.setProperty("--count", String(Math.min(count, 4)));
    bar.setAttribute("aria-hidden", "true");
    cell.append(element("strong", "", digit), element("span", "", count ? `${count} 次` : "未出現"), bar);
    grid.append(cell);
  }
  body.append(grid, element("p", "missing-summary", result.missing.length ? `未出現：${result.missing.join("、")}` : "1 到 9 都有出現"));
  if (gridResult?.lines) {
    const established = element("div", "grid-line-summary");
    const lineTitle = element("p", "grid-line-title", `成立連線 ${gridResult.establishedLines.length} 條`);
    lineTitle.setAttribute("role", "heading");
    lineTitle.setAttribute("aria-level", "4");
    established.append(lineTitle);
    const list = element("ul");
    for (const line of gridResult.establishedLines) {
      list.append(element("li", "", `${line.lineId}・${line.title}（強度 ${line.strength}）`));
    }
    if (!gridResult.establishedLines.length) list.append(element("li", "", "目前沒有完整成立的連線。"));
    established.append(list);
    body.append(established);
  }
  card.append(summary, body);
  return card;
}

function createBirthdayColorGuide(result) {
  const guide = result.colorGuide;
  const palette = guide.traditional.palette;
  const section = element("section", "personal-color-guide");
  section.setAttribute("data-personal-color-guide", "");
  section.setAttribute("aria-labelledby", "color-guide-title");
  section.setAttribute("aria-describedby", "color-guide-disclaimer");

  const header = element("header", "color-guide-heading");
  const headingCopy = element("div");
  const title = element("h3", "brush-fixed-heading");
  title.id = "color-guide-title";
  title.append(fixedBrushTitleElement("個人色彩指引", "brush-color-guide", { lazy: true }));
  headingCopy.append(element("p", "", "色彩參考"), title);
  header.append(
    headingCopy,
    element("p", "color-guide-basis", `生日數 ${guide.traditional.number}・原書色群 ${palette.sourceFamilies.join("、")}`),
  );

  const roleList = element("ol", "color-role-list");
  const roleNotes = {
    "birth-day": "出生日色群的數位代表色",
    "life-path": "將生命路徑基底延伸套入同一色表",
    attitude: "將態度數延伸套入同一色表",
  };
  for (const assignment of guide.composition) {
    const item = element("li", `color-role color-role-${assignment.role}`);
    item.setAttribute("data-color-swatch", "");
    item.setAttribute("data-color-role", assignment.role);
    item.setAttribute("data-color-number", String(assignment.mappedNumber));
    const swatch = element("span", "color-swatch");
    swatch.setAttribute("data-color-chip", "");
    swatch.style.setProperty("--swatch", assignment.swatch.hex);
    swatch.setAttribute("aria-hidden", "true");
    const copy = element("div", "color-role-copy");
    const label = element("div", "color-role-label");
    label.append(element("span", "", assignment.label), element("em", "", assignment.badge));
    const name = element("div", "color-role-name");
    const colorHex = element("code", "", assignment.swatch.hex);
    colorHex.setAttribute("data-color-hex", "");
    name.append(element("strong", "", assignment.swatch.name), colorHex);
    copy.append(
      label,
      name,
      element("span", "color-role-basis", `${assignment.calculation}・色彩基底 ${assignment.mappedNumber}`),
      element("p", "", roleNotes[assignment.role]),
    );
    item.append(swatch, copy);
    roleList.append(item);
  }

  const uses = element("div", "color-guide-uses");
  for (const [label, copy] of [
    ["穿搭點綴・本站延伸", palette.uses.wear],
    ["工作空間・本站延伸", palette.uses.space],
    ["數位配色・本站延伸", palette.uses.digital],
  ]) {
    const item = element("p");
    item.append(element("strong", "", label), document.createTextNode(copy));
    uses.append(item);
  }
  const reminder = element("p", "color-guide-reminder");
  reminder.append(element("strong", "", "原書的配色提醒"), document.createTextNode(palette.avoidNote));

  const evidence = element("details", "color-guide-evidence");
  evidence.setAttribute("data-color-source-details", "");
  const summary = element("summary");
  const summaryCopy = element("span");
  summaryCopy.append(element("small", "", "可核對"), element("strong", "", "計算、書據與轉譯"));
  summary.append(summaryCopy, element("em", "", "原書・色票・本站延伸"));
  const evidenceBody = element("div", "color-guide-evidence-body");
  const explanation = element("div", "color-guide-explanation");
  explanation.append(
    element("p", "", `Cheiro《Cheiro's Book of Numbers》以出生日化簡至 1 到 9 對照色群。你的出生日為 ${guide.traditional.display}，因此採用數字 ${guide.traditional.number}。`),
    element("p", "", guide.source.notice),
    element("p", "", "生命路徑延伸色與態度數搭配色，是本站把既有數字套入同一色表的延伸，不是原書明示的生命路徑配色。"),
  );
  const formulaList = element("ol", "color-guide-formulas");
  for (const assignment of guide.composition) {
    const row = element("li");
    row.setAttribute("data-color-formula", assignment.role);
    row.append(element("span", "", assignment.label), element("code", "", `${assignment.calculation}；色彩基底 ${assignment.mappedNumber}`));
    formulaList.append(row);
  }
  const sourceLinks = element("p", "color-guide-source-links");
  for (const [label, url] of [
    ["Cheiro 原書・第 23 章主次色規則", guide.source.ruleUrl],
    ["Cheiro 原書・第 27 章色彩對照", guide.source.paletteUrl],
    ["色彩心理研究界線", "https://doi.org/10.1146/annurev-psych-010213-115035"],
  ]) {
    const link = element("a", "", label);
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    sourceLinks.append(link);
  }
  evidenceBody.append(explanation, formulaList, sourceLinks);
  evidence.append(summary, evidenceBody);

  const disclaimer = element("p", "color-guide-disclaimer", guide.disclaimer);
  disclaimer.id = "color-guide-disclaimer";
  section.append(header, roleList, uses, reminder, evidence, disclaimer);
  return section;
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
    const heading = element("h4", "brush-fixed-heading");
    heading.append(fixedBrushTitleElement(title, "brush-card-title"));
    article.append(element("span", "", index), heading);
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
        ["生命路徑數", result.lifePath.display, result.ruleSet.lifePathMode === "full_birth_digits" ? "YYYYMMDD 全部數字加總" : "舊版月、日、年分段化簡"],
        ["生日數", result.birthday.display, result.ruleSet.masterNumberMode === "disabled" ? "主數化簡至 1～9" : "依設定保留主數"],
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
    note.append(
      element("strong", "", `主數 ${result.lifePath.value}／基底 ${result.lifePath.base}`),
      element("p", "", masterThemes[result.lifePath.value] ?? "此為自訂保留主數；人格摘要仍依化簡後的 1～9 基底呈現。"),
    );
    section.append(note);
  }

  if (result.kind === "birthday") section.append(createBirthdayColorGuide(result));

  const overview = element("div", "result-overview");
  overview.append(createCalculationCard(result), createDigitDistribution(result));
  section.append(overview, createInsightLedger(profile));

  const advice = element("article", "advice-card");
  const adviceMark = element("span", "", "策");
  adviceMark.setAttribute("aria-hidden", "true");
  const adviceCopy = element("div");
  const adviceTitle = element("h3", "brush-fixed-heading");
  adviceTitle.append(fixedBrushTitleElement("本次自我提問", "brush-advice-title"));
  adviceCopy.append(adviceTitle, element("p", "", profile.advice));
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
  const roleTitle = element("h3", "hexagram-role-title brush-fixed-heading");
  roleTitle.append(fixedBrushTitleElement(label, "brush-hexagram-role"));
  const computedName = element("p", "hexagram-computed-name");
  computedName.append(element("span", "", text.symbol), document.createTextNode(value.name));
  heading.append(roleTitle, computedName);
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
  nameCopy.append(element("small", "", `第 ${original.id} 卦`), element("p", "classic-computed-name", `${original.name}・${original.fullName}`));
  name.append(symbol, nameCopy);

  const columns = element("div", "classic-columns");
  for (const [title, copy] of [["卦辭", original.judgment], ["彖曰", original.tuan], ["象曰", original.image]]) {
    const article = element("article");
    const heading = element("h4", "brush-fixed-heading");
    heading.append(fixedBrushTitleElement(title, "brush-classic-label"));
    article.append(heading, element("p", "", copy));
    columns.append(article);
  }

  const lines = element("div", "line-texts");
  const linesTitle = element("h4", "brush-fixed-heading");
  linesTitle.append(fixedBrushTitleElement("六爻原文", "brush-classic-label brush-six-lines"));
  lines.append(linesTitle);
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
  const transformedJudgment = element("h4", "brush-fixed-heading");
  transformedJudgment.append(fixedBrushTitleElement("卦辭", "brush-classic-label"));
  const transformedImage = element("h4", "brush-fixed-heading");
  transformedImage.append(fixedBrushTitleElement("象曰", "brush-classic-label"));
  transformedCopy.append(transformedJudgment, element("p", "", transformed.judgment), transformedImage, element("p", "", transformed.image));
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
  title.append(brushTitleElement("public/visuals/brush/title-iching-web-v1.webp", "三數取卦"));
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
  const accessDialog = document.querySelector("#iching-access-dialog");
  const accessForm = document.querySelector("#iching-access-form");
  const accessInput = document.querySelector("#iching-access-password");
  const accessMessage = document.querySelector("[data-iching-access-message]");
  const accessCancel = document.querySelector("[data-iching-access-cancel]");
  let mode = "birthday";
  let ichingUnlocked = hasIChingAccess();

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

  function restoreSelectedMode() {
    const selected = modeInputs.find((input) => input.value === mode);
    if (selected) selected.checked = true;
  }

  function closeAccessDialog() {
    if (accessDialog?.open && typeof accessDialog.close === "function") accessDialog.close();
    else accessDialog?.removeAttribute("open");
    if (accessInput) {
      accessInput.value = "";
      accessInput.setAttribute("aria-invalid", "false");
    }
    if (accessMessage) accessMessage.textContent = "";
    restoreSelectedMode();
  }

  function openAccessDialog() {
    restoreSelectedMode();
    if (!accessDialog) return;
    if (typeof accessDialog.showModal === "function") {
      if (!accessDialog.open) accessDialog.showModal();
    } else {
      accessDialog.setAttribute("open", "");
    }
    window.setTimeout(() => accessInput?.focus(), 0);
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

  for (const input of modeInputs) {
    input.addEventListener("change", () => {
      if (input.value === "iching" && !ichingUnlocked) {
        openAccessDialog();
        return;
      }
      changeMode(input.value);
    });
  }
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
      const settings = loadNumerologySettings();
      const ruleSet = resolveSettingsRuleSet(settings);
      const todayValue = localDateString();
      const currentYear = new Date().getFullYear();
      const result = mode === "birthday"
        ? analyzeBirthday(birthdayInput.value, currentYear, todayValue, { ruleSet })
        : mode === "code" ? analyzeDigitCode(codeInput.value) : calculateIChing(ichingInputs.map((input) => input.value));
      if (mode === "birthday") {
        saveAnalysisHistory(analyzeBirthdayV2({
          date: birthdayInput.value,
          currentYear,
          todayValue,
          createdAt: new Date().toISOString(),
          ruleSet,
        }));
      }
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
  accessInput?.addEventListener("input", () => {
    accessInput.value = accessInput.value.replace(/\D/g, "").slice(0, 4);
    accessInput.setAttribute("aria-invalid", "false");
    if (accessMessage) accessMessage.textContent = "";
  });
  accessForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isIChingAccessCode(accessInput?.value ?? "")) {
      if (accessMessage) accessMessage.textContent = "密碼不正確，請重新輸入四位數字。";
      accessInput?.setAttribute("aria-invalid", "true");
      accessInput?.select();
      return;
    }
    rememberIChingAccess();
    ichingUnlocked = true;
    closeAccessDialog();
    const ichingMode = modeInputs.find((input) => input.value === "iching");
    if (ichingMode) ichingMode.checked = true;
    changeMode("iching");
  });
  accessCancel?.addEventListener("click", closeAccessDialog);
  accessDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAccessDialog();
  });
  updateClearButton();
}

function initializeVisitCounter() {
  const container = document.querySelector("[data-visit-counter]");
  const output = document.querySelector("[data-visit-count]");
  if (!container || !output) return;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);
  loadCumulativeVisitCount({ signal: controller.signal })
    .then(({ value }) => {
      const formatted = new Intl.NumberFormat("zh-TW").format(value);
      output.textContent = formatted;
      container.dataset.state = "ready";
      container.setAttribute("aria-label", `累積造訪 ${formatted} 次`);
      container.title = "累積造訪次數；同一瀏覽器分頁重新整理不重複累加";
    })
    .catch(() => {
      output.textContent = "--";
      container.dataset.state = "unavailable";
      container.setAttribute("aria-label", "累積造訪次數暫時無法讀取");
      container.title = "計數服務暫時無法讀取，其他功能仍可正常使用";
    })
    .finally(() => window.clearTimeout(timeout));
}

if (typeof document !== "undefined") {
  initializeAnalyzer();
  initializeVisitCounter();
  mountNumerologyWorkspace(document.querySelector("#numerology-workspace"), { assetRoot: "public/visuals" });
}
