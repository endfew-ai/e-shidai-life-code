import {
  LO_SHU_ORDER,
  analyzeBirthday,
  analyzeDigitCode,
  lineNames,
  localDateString,
  masterThemes,
  profiles,
} from "./calculator-core.js";
import { calculateModernThreeNumberHexagram } from "./kangjie-core.js";
import { createLineCorrespondencePanel } from "./line-correspondence-view.js?v=20260803-line-position-v19";
import { getIChingText } from "./iching-text.js";
import {
  JINGFANG_EIGHT_PALACES,
  JINGFANG_SOURCES,
  JINGFANG_STAGES,
  findJingFangPalacePosition,
} from "./jingfang-palaces.js?v=20260803-reference-v15";
import { secureIChingNumber } from "./secure-random.js?v=20260803-reference-v14";
import {
  hasIChingAccess,
  isIChingAccessCode,
  loadCumulativeVisitCount,
  rememberIChingAccess,
  VISIT_COUNTER_TIMEOUT_MS,
  VISIT_COUNTER_VERIFIED_MINIMUM,
} from "./site-services.js?v=20260802-reference-v13";
import { analyzeBirthdayV2 } from "./application/numerology-analysis.js";
import { mountNumerologyWorkspace } from "./application/advanced-workspace.js?v=20260803-reference-v18";
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
    help: "只需生日；身分證請用下方獨立入口。",
    art: "public/visuals/ai-dashboard/life-path-v1.webp",
    artWidth: 960,
    artHeight: 640,
    titleArt: "public/visuals/brush/title-birthday-web-v1.webp",
    alt: "九節點古金生命靈數分析儀",
  },
  code: {
    label: "數字頻譜",
    description: "任意號碼的加總、歸一數與數字分布",
    button: "分析數字頻譜",
    help: "支援全形、半形數字與空白；請勿輸入敏感資料。",
    art: "public/visuals/ai-dashboard/number-wave-v1.webp",
    artWidth: 960,
    artHeight: 640,
    titleArt: "public/visuals/brush/title-spectrum-web-v1.webp",
    alt: "古金數字頻率波形與九點節律模組背景",
  },
  iching: {
    label: "三數取卦",
    description: "一數定上卦、二數定下卦、三數定動爻",
    button: "開始三數取卦",
    help: "三鍵各自取 1～1000，亦可手動輸入正整數。",
    art: "public/visuals/iching-instrument-b-v3.webp",
    artWidth: 1586,
    artHeight: 992,
    titleArt: "public/visuals/brush/title-iching-web-v1.webp",
    alt: "低亮古金六爻測量儀視覺",
  },
};

function dashboardAnalytics(result, mode = "birthday") {
  const modeLabel = modeContent[mode]?.label ?? "生日命碼";
  const emptyCounts = Array.from({ length: 9 }, () => 0);
  const emptyPreview = {
    birthday: ["生命路徑數", "生日數", "態度數", "個人流年"],
    code: ["號碼歸一數", "數字總和", "輸入位數", "最常出現"],
    iching: ["本卦", "互卦", "變卦", "動爻"],
  }[mode] ?? ["主要結果", "次要結果", "分析項目", "狀態"];
  if (!result) {
    return {
      status: "待分析",
      modeLabel,
      state: "等待輸入",
      core: "－",
      title: "等待輸入",
      note: "輸入資料後顯示主要結果與計算摘要。",
      counts: emptyCounts,
      distributionTitle: "數字出現次數",
      annual: "－",
      annualTitle: "等待生日",
      annualNote: "個人流年只在生日模式計算。",
      preview: { labels: emptyPreview, values: ["－", "－", "－", "－"] },
    };
  }

  if (result.kind === "birthday") {
    return {
      status: "生日分析完成",
      modeLabel,
      state: "結果已更新",
      core: result.lifePath.display,
      title: profiles[result.profileNumber]?.title ?? "生命路徑",
      note: `生日數 ${result.birthday.display}，態度數 ${result.attitude.value}`,
      counts: Array.from({ length: 9 }, (_, index) => result.counts[index + 1] ?? 0),
      distributionTitle: "生日數字分佈",
      annual: String(result.personalYear.value),
      annualTitle: `個人流年數 ${result.personalYear.value}`,
      annualNote: `${result.personalYear.year} 年，依生日與年度數字計算`,
      preview: {
        labels: ["生命路徑數", "生日數", "態度數", "個人流年"],
        values: [result.lifePath.display, result.birthday.display, String(result.attitude.value), String(result.personalYear.value)],
      },
    };
  }

  if (result.kind === "code") {
    return {
      status: "數字頻譜完成",
      modeLabel,
      state: `${result.length} 位數字`,
      core: String(result.core),
      title: profiles[result.profileNumber]?.title ?? "數字歸一結果",
      note: `實際總和 ${result.sum}，未出現 ${result.missing.length} 個數字`,
      counts: Array.from({ length: 9 }, (_, index) => result.counts[index + 1] ?? 0),
      distributionTitle: "數字出現次數",
      annual: "不適用",
      annualTitle: "數字頻譜模式",
      annualNote: "此模式只分析輸入數字，不推算個人流年。",
      preview: {
        labels: ["號碼歸一數", "數字總和", "輸入位數", "最常出現"],
        values: [String(result.core), String(result.sum), String(result.length), result.strongest.join("、") || "無"],
      },
    };
  }

  const counts = Array.from({ length: 9 }, () => 0);
  for (const value of result.inputs) {
    for (const digit of String(value).match(/\d/g) ?? []) {
      const number = Number(digit);
      if (number >= 1 && number <= 9) counts[number - 1] += 1;
    }
  }
  return {
    status: "三數取卦完成",
    modeLabel,
    state: "卦象已更新",
    core: getIChingText(result.original.hexId).symbol,
    title: result.original.name,
    note: `動爻 ${result.moving.name}，變卦 ${result.transformed.name}`,
    counts,
    distributionTitle: "輸入數字出現次數",
    annual: "不適用",
    annualTitle: "三數取卦模式",
    annualNote: "此模式只依三個整數取卦，不推算個人流年。",
    preview: {
      labels: ["本卦", "互卦", "變卦", "動爻"],
      values: [result.original.name, result.mutual.name, result.transformed.name, result.moving.name],
    },
  };
}

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
  const audit = result.audit;
  const card = element("details", "result-disclosure calculation-card");
  const summary = element("summary");
  const summaryCopy = element("span");
  summaryCopy.append(element("small", "", "計算軌跡"), element("strong", "", "查看完整算式"));
  summary.append(summaryCopy, element("em", "", `${result.calculations.length} 步・規則 ${audit.algorithmVersion}`));
  const body = element("div", "disclosure-body");
  body.append(panelHeading("計算軌跡", "這個結果怎麼算", "可逐步核對"));
  const auditLedger = element("div", "numerology-audit-ledger");
  for (const [label, value, note] of [
    ["原始輸入", audit.originalInput, "使用者送入分析器的內容"],
    ["正規化輸入", audit.normalizedInput, audit.normalizationRule],
    ["演算法版本", `${audit.algorithmId}@${audit.algorithmVersion}`, audit.algorithmName],
  ]) {
    const item = element("article");
    item.append(element("span", "", label), element("code", "", value), element("small", "", note));
    auditLedger.append(item);
  }
  auditLedger.append(element("p", "numerology-audit-context", `${audit.context}；${audit.ruleSummary}`));
  body.append(auditLedger);
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
  if (result.kind === "birthday") card.id = "result-nine-grid";
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
  headingCopy.append(element("p", "", "文化色彩參考"), title);
  header.append(
    headingCopy,
    element("p", "color-guide-basis", `生日數 ${guide.traditional.number}・原書色名 ${palette.historicalColorFamilies.join("、")}・HEX 為本站轉譯`),
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

function createResetButton(label, onReset, placement = "bottom") {
  const wrapper = element("div", `result-actions${placement === "top" ? " result-actions-top" : ""}`);
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
  if (result.kind === "birthday") hero.id = "result-life-path";
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
    imageElement(
      result.kind === "birthday" ? "public/visuals/ai-dashboard/reference-v18/life-path-wayfinder-v18.webp" : "public/visuals/digit-spectrum-panel-b-v3.webp",
      result.kind === "birthday" ? "生命路徑玉石軌道視覺" : "古金數理節點分析模組背景",
    ),
    element("figcaption", "", `${result.kind === "birthday" ? "生命路徑數" : "號碼歸一數"} ${result.headlineValue}`),
  );
  hero.append(copy, art, createResetButton(result.kind === "birthday" ? "修改生日" : "修改數字", onReset, "top"));
  section.append(hero);

  const metrics = result.kind === "birthday"
    ? [
        ["生命路徑數", result.lifePath.display, result.ruleSet.lifePathMode === "full_birth_digits" ? "YYYYMMDD 全部數字加總" : "舊版月、日、年分段化簡"],
        ["生日數", result.birthday.display, result.ruleSet.masterNumberMode === "disabled" ? "主數化簡至 1～9" : "依設定保留主數"],
        ["態度數", String(result.attitude.value), "出生月加出生日"],
        [`${result.personalYear.year} 個人流年`, String(result.personalYear.value), "採 1 至 12 月曆年制"],
        [`${result.personalMonth.month} 月個人月`, String(result.personalMonth.value), "個人年加當月；現代流傳"],
        [`${result.personalDay.month}/${result.personalDay.day} 個人日`, String(result.personalDay.value), "個人月加當日；現代流傳"],
      ]
    : [
        ["數字位數", String(result.length), "只計入實際數字"],
        ["逐位總和", String(result.sum), "尚未收斂的總和"],
        ["號碼歸一數", String(result.core), "逐位加總至 1 到 9"],
        ["最常出現", result.strongest.join("、"), result.strongest.length > 1 ? "並列最高次數" : "出現次數最高"],
      ];
  const metricGrid = element("div", "metric-grid");
  if (result.kind === "birthday") metricGrid.classList.add("is-six");
  for (const [index, metric] of metrics.entries()) {
    const metricCard = createMetricCard(...metric);
    if (result.kind === "birthday" && index === 3) {
      metricCard.id = "result-annual-cycle";
      metricCard.tabIndex = -1;
    }
    metricGrid.append(metricCard);
  }
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

function createHexagramLines(lines, texts, movingIndex = -1, mark = "") {
  const container = element("div", "hexagram-lines");
  container.setAttribute("aria-label", "六爻卦象與爻辭，畫面由上爻排列至初爻");
  for (const index of [5, 4, 3, 2, 1, 0]) {
    const row = element("div", `line-row ${index === movingIndex ? "is-moving" : ""}`);
    const yao = element("span", `yao ${lines[index] === 1 ? "yang" : "yin"}`);
    yao.setAttribute("aria-label", lines[index] === 1 ? "陽爻" : "陰爻");
    yao.append(element("i"));
    if (lines[index] === 0) yao.append(element("i"));
    row.append(
      element("span", "line-position", lineNames[index]),
      yao,
      element("strong", "line-change-mark", index === movingIndex ? mark : ""),
      element("span", "line-text", texts[index].text),
    );
    container.append(row);
  }
  return container;
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
  const meta = element("div", "iching-result-meta");
  meta.append(summary, createYaoLegend());
  heading.append(titleCopy, meta, createResetButton("修改三數", onReset, "top"));
  section.append(heading);

  const grid = element("div", "hexagram-grid");
  grid.append(createHexagramCard("本卦", result.original, result.moving.index, "動"), createHexagramCard("互卦", result.mutual), createHexagramCard("變卦", result.transformed, result.moving.index, "變"));

  const trace = element("div", "iching-trace");
  for (const traceItem of result.trace) {
    const traceRow = element("div");
    traceRow.append(element("span", "", traceItem.label), element("strong", "", traceItem.equation));
    trace.append(traceRow);
  }

  const roleLedger = element("div", "iching-role-ledger");
  for (const [label, value, note] of [
    ["體卦", `${result.roles.body.symbol} ${result.roles.body.name}`, `${result.roles.body.nature}・${result.roles.body.element}`],
    ["用卦", `${result.roles.use.symbol} ${result.roles.use.name}`, `${result.roles.use.nature}・${result.roles.use.element}`],
    ["五行關係", result.fiveElements.label, result.fiveElements.explanation],
  ]) {
    const card = element("article");
    card.append(element("span", "", label), element("strong", "", value), element("small", "", note));
    roleLedger.append(card);
  }
  roleLedger.append(element("p", "", result.roles.note));

  const audit = element("details", "iching-audit");
  const auditSummary = element("summary");
  auditSummary.append(element("strong", "", "完整演算與來源"), element("span", "", `${result.profileLabel}・${result.algorithmVersion}`));
  const auditBody = element("div", "iching-audit-body");
  const inputs = element("div", "iching-audit-inputs");
  const originalInput = element("article");
  originalInput.append(element("span", "", "原始輸入"), element("pre", "", JSON.stringify(result.calculationTrace.originalInput, null, 2)));
  const normalizedInput = element("article");
  normalizedInput.append(element("span", "", "正規化輸入"), element("pre", "", JSON.stringify(result.calculationTrace.normalizedInput, null, 2)));
  inputs.append(originalInput, normalizedInput);
  const relations = element("ul", "iching-relation-list");
  for (const entry of result.influenceRelations) relations.append(element("li", "", `${entry.stage}：${entry.trigram.name}${entry.trigram.element}・${entry.relation.label}`));
  const sourceList = element("div", "iching-source-list");
  sourceList.append(element(
    "p",
    "iching-source-notice",
    result.sourceScopes?.formula?.notice || "下列來源只支持除八、除六、卦象、互變與體用共用核心，不代表現代三數公式出自古籍。",
  ));
  for (const source of result.sharedCoreSourceRefs || result.sourceRefs) {
    const link = element("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.append(element("strong", "", source.title), element("small", "", source.organization));
    sourceList.append(link);
  }
  auditBody.append(inputs, relations, sourceList);
  audit.append(auditSummary, auditBody);

  section.append(
    grid,
    createLineCorrespondencePanel(result.lineCorrespondences),
    createJingFangPalaceAtlas(result),
    trace,
    roleLedger,
    audit,
    element("p", "iching-boundary", "本模式採現代三數先天數法，與生日命碼完全分開。只做固定卦象計算，不提供吉凶、預測或決策建議。"),
    createOriginalTextPanel(result),
    createResetButton("重新輸入三個數字", onReset),
  );
  return section;
}

function jingFangRolesFor(result, hexId) {
  return [
    result.original.hexId === hexId ? { key: "original", short: "本", label: "本卦" } : null,
    result.mutual.hexId === hexId ? { key: "mutual", short: "互", label: "互卦" } : null,
    result.transformed.hexId === hexId ? { key: "transformed", short: "變", label: "變卦" } : null,
  ].filter(Boolean);
}

function createJingFangPositionSummary(label, entry, role) {
  const summary = element("span", `jingfang-position is-${role}`);
  summary.dataset.jingfangSummary = role;
  summary.append(element("small", "", label), element("strong", "", entry.name), element("em", "", `${entry.palace}・${entry.element}・${entry.stage}`));
  return summary;
}

function createJingFangPalaceAtlas(result) {
  const atlas = element("section", "jingfang-palace-atlas");
  atlas.setAttribute("aria-labelledby", "jingfang-atlas-title");
  const heading = element("header", "jingfang-atlas-heading");
  const title = element("h3");
  title.id = "jingfang-atlas-title";
  title.append(element("span", "sr-only", "京房八宮六十四卦"));
  const titleImage = document.createElement("img");
  titleImage.className = "brush-title-image";
  titleImage.src = "public/visuals/ai-dashboard/reference-v15/brush-jingfang-eight-palaces-v15.webp";
  titleImage.width = 1288;
  titleImage.height = 276;
  titleImage.loading = "eager";
  titleImage.decoding = "async";
  titleImage.alt = "";
  titleImage.setAttribute("aria-hidden", "true");
  title.append(titleImage);
  const headingCopy = element("p");
  headingCopy.append(element("strong", "", "完整八宮歸宮對照"), element("span", "", "八宮・八世・六十四卦一次看清"));
  heading.append(title, headingCopy);

  const original = findJingFangPalacePosition(result.original.hexId);
  const mutual = findJingFangPalacePosition(result.mutual.hexId);
  const transformed = findJingFangPalacePosition(result.transformed.hexId);
  const resultSummary = element("div", "jingfang-result-summary");
  resultSummary.setAttribute("aria-label", "本卦互卦變卦的八宮位置");
  resultSummary.append(
    createJingFangPositionSummary("本卦", original, "original"),
    createJingFangPositionSummary("互卦", mutual, "mutual"),
    createJingFangPositionSummary("變卦", transformed, "transformed"),
  );

  const wrap = element("div", "jingfang-table-wrap");
  wrap.tabIndex = 0;
  wrap.setAttribute("aria-label", "京房八宮六十四卦完整表；窄螢幕自動重排");
  const table = element("table", "jingfang-palace-table");
  const caption = element("caption", "sr-only", "京房八宮六十四卦完整對照表");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const palaceHeader = element("th", "", "宮別");
  palaceHeader.scope = "col";
  headerRow.append(palaceHeader);
  for (const stage of JINGFANG_STAGES) {
    const header = element("th", "", stage.heading);
    header.scope = "col";
    headerRow.append(header);
  }
  thead.append(headerRow);
  const tbody = document.createElement("tbody");
  for (const row of JINGFANG_EIGHT_PALACES) {
    const tableRow = document.createElement("tr");
    tableRow.dataset.jingfangPalaceRow = row.palace;
    const rowHeader = document.createElement("th");
    rowHeader.scope = "row";
    rowHeader.append(element("strong", "", row.palace), element("span", "", row.element));
    tableRow.append(rowHeader);
    for (const entry of row.entries) {
      const roles = jingFangRolesFor(result, entry.hexId);
      const cell = document.createElement("td");
      cell.className = roles.map(({ key }) => `is-${key}`).join(" ");
      cell.dataset.stage = entry.stage;
      cell.dataset.palace = entry.palace;
      cell.dataset.hexagramId = String(entry.hexId);
      cell.dataset.jingfangRoles = roles.map(({ key }) => key).join(" ");
      if (roles.some(({ key }) => key === "original")) cell.setAttribute("aria-current", "true");
      cell.append(
        element("span", "jingfang-cell-stage", entry.stage),
        element("span", "jingfang-cell-symbol", entry.symbol),
      );
      cell.querySelector(".jingfang-cell-stage").setAttribute("aria-hidden", "true");
      cell.querySelector(".jingfang-cell-symbol").setAttribute("aria-hidden", "true");
      const cellCopy = element("span", "jingfang-cell-copy");
      cellCopy.append(element("strong", "", entry.name), element("small", "", `第 ${entry.hexId} 卦`));
      cell.append(cellCopy);
      if (roles.length > 0) {
        const marks = element("span", "jingfang-result-marks");
        marks.setAttribute("aria-label", roles.map(({ label }) => label).join("、"));
        for (const role of roles) {
          const mark = element("b", `is-${role.key}`, role.short);
          mark.setAttribute("aria-hidden", "true");
          marks.append(mark);
        }
        cell.append(marks);
      }
      tableRow.append(cell);
    }
    tbody.append(tableRow);
  }
  table.append(caption, thead, tbody);
  wrap.append(table);

  const sourceNote = element("details", "jingfang-source-note");
  sourceNote.append(element("summary", "", "資料來源與編次說明"));
  sourceNote.append(element("p", "", "畫面依參考表採「乾、坎、艮、震、巽、離、坤、兌」展示；典籍常見編次為「乾、震、坎、艮、坤、巽、離、兌」。兩者只差展示次序，不影響歸宮與世次。"));
  const sourceLinks = element("div");
  for (const source of JINGFANG_SOURCES) {
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.append(element("strong", "", source.title), element("small", "", `${source.organization}・${source.scope}`));
    sourceLinks.append(link);
  }
  sourceNote.append(sourceLinks);

  atlas.append(
    heading,
    resultSummary,
    element("p", "jingfang-atlas-boundary", "起卦仍採現代三數法；京房八宮表只用於標示宮別與世次，不改變起卦公式。"),
    wrap,
    sourceNote,
  );
  return atlas;
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
  const ichingRandomButtons = [...document.querySelectorAll("[data-iching-randomize]")];
  const ichingRandomStatus = document.querySelector("#iching-random-status");
  const message = document.querySelector("#input-message");
  const help = document.querySelector("#input-help");
  const clearButton = document.querySelector("#clear-button");
  const analyzerTitleText = document.querySelector("#analyzer-title-text");
  const analyzerTitleImage = document.querySelector("#analyzer-title-image");
  const analyzerDescription = document.querySelector("#analyzer-description");
  const modeArt = document.querySelector("#mode-art-image");
  const quickModeLinks = [...document.querySelectorAll("[data-quick-mode]")];
  const birthdayEntryLinks = [...document.querySelectorAll("[data-start-birthday]")];
  const resultAnchor = document.querySelector("#result-anchor");
  const accessDialog = document.querySelector("#iching-access-dialog");
  const accessForm = document.querySelector("#iching-access-form");
  const accessInput = document.querySelector("#iching-access-password");
  const accessMessage = document.querySelector("[data-iching-access-message]");
  const accessCancel = document.querySelector("[data-iching-access-cancel]");
  const analyzeLabel = document.querySelector("[data-analyze-label]");
  const analyzeButton = document.querySelector("#analyze-button");
  const cockpitMode = document.querySelector("[data-cockpit-mode]");
  const cockpitModeNote = document.querySelector("[data-cockpit-mode-note]");
  const cockpitCore = document.querySelector("[data-cockpit-core]");
  const cockpitCoreNote = document.querySelector("[data-cockpit-core-note]");
  let mode = "birthday";
  let ichingUnlocked = hasIChingAccess();
  let birthdayAutoSubmitArmed = false;
  let birthdayResultTarget = "overview";
  const ichingRandomTimers = new Map();
  const ichingNumberLabels = ["第一數", "第二數", "第三數"];

  birthdayInput.max = localDateString();
  document.querySelector("#copyright-year").textContent = new Date().getFullYear();

  function currentInputs() {
    if (mode === "birthday") return [birthdayInput];
    if (mode === "code") return [codeInput];
    return ichingInputs;
  }

  function finishIChingRoll(index) {
    const button = ichingRandomButtons[index];
    if (button) {
      button.disabled = false;
      button.classList.remove("is-rolling");
      button.setAttribute("aria-busy", "false");
    }
    ichingRandomTimers.delete(index);
    if (analyzeButton && ichingRandomTimers.size === 0) analyzeButton.disabled = false;
  }

  function stopIChingRolls() {
    for (const [index, timer] of ichingRandomTimers) {
      window.clearTimeout(timer);
      finishIChingRoll(index);
    }
    if (ichingRandomStatus) ichingRandomStatus.textContent = "";
  }

  function randomizeIChingNumber(button) {
    const index = Number(button.dataset.ichingRandomize);
    const input = ichingInputs[index];
    if (!input || !Number.isInteger(index)) return;

    const previousTimer = ichingRandomTimers.get(index);
    if (previousTimer) window.clearTimeout(previousTimer);
    button.disabled = true;
    if (analyzeButton) analyzeButton.disabled = true;
    button.classList.add("is-rolling");
    button.setAttribute("aria-busy", "true");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stepsRemaining = reduceMotion ? 1 : 10;

    const advance = () => {
      try {
        input.value = String(secureIChingNumber());
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (error) {
        finishIChingRoll(index);
        message.textContent = error instanceof Error ? error.message : "安全亂數暫時無法使用，請手動輸入正整數。";
        input.focus({ preventScroll: true });
        return;
      }

      stepsRemaining -= 1;
      if (stepsRemaining > 0) {
        const timer = window.setTimeout(advance, 54);
        ichingRandomTimers.set(index, timer);
        return;
      }

      finishIChingRoll(index);
      if (ichingRandomStatus) {
        ichingRandomStatus.textContent = `${ichingNumberLabels[index]}已取得 ${input.value}；此鍵只更改${ichingNumberLabels[index]}。`;
      }
      input.focus({ preventScroll: true });
    };

    advance();
  }

  function hasCurrentValue() { return currentInputs().some((input) => input.value.length > 0); }
  function clearResult() { resultAnchor.replaceChildren(); }
  function setInvalid(invalid) { for (const input of currentInputs()) input.setAttribute("aria-invalid", String(invalid)); }
  function updateClearButton() { clearButton.hidden = !hasCurrentValue(); }
  function updateCockpitMode() {
    if (cockpitMode) cockpitMode.textContent = modeContent[mode].label;
    if (cockpitModeNote) cockpitModeNote.textContent = modeContent[mode].description;
  }
  function updateCockpitResult(result) {
    if (!cockpitCore || !cockpitCoreNote) return;
    if (!result) {
      cockpitCore.textContent = "待分析";
      cockpitCoreNote.textContent = "輸入資料後即時顯示";
      return;
    }
    if (result.kind === "birthday") {
      cockpitCore.textContent = `生命路徑 ${result.lifePath.display}`;
      cockpitCoreNote.textContent = `生日數 ${result.birthday.display}・${result.personalYear.year} 流年 ${result.personalYear.value}`;
      return;
    }
    if (result.kind === "code") {
      cockpitCore.textContent = `號碼歸一數 ${result.core}`;
      cockpitCoreNote.textContent = `${result.length} 位數・總和 ${result.sum}`;
      return;
    }
    cockpitCore.textContent = result.original.name;
    cockpitCoreNote.textContent = `動爻 ${result.moving.name}・變卦 ${result.transformed.name}`;
  }
  function updateDashboardAnalytics(result) {
    const view = dashboardAnalytics(result, mode);
    const setText = (selector, value) => {
      for (const node of document.querySelectorAll(selector)) node.textContent = value;
    };
    setText("[data-analytics-status]", view.status);
    setText("[data-analytics-mode]", view.modeLabel);
    setText("[data-analytics-state]", view.state);
    setText("[data-analytics-core]", view.core);
    setText("[data-analytics-core-large]", view.core);
    setText("[data-analytics-title]", view.title);
    setText("[data-analytics-note]", view.note);
    setText("[data-analytics-distribution-title]", view.distributionTitle);
    setText("[data-analytics-annual]", view.annual);
    setText("[data-analytics-annual-title]", view.annualTitle);
    setText("[data-analytics-annual-note]", view.annualNote);
    setText("[data-analytics-year]", result?.kind === "birthday" ? `${result.personalYear.year} 年` : "本年度");
    setText("[data-analytics-year-label]", result?.kind === "birthday" ? "個人流年" : "模式狀態");
    setText("[data-preview-status]", result ? "結果已更新" : "等待輸入");
    ["primary", "secondary", "tertiary", "annual"].forEach((key, index) => {
      setText(`[data-preview-label="${key}"]`, view.preview.labels[index]);
      setText(`[data-preview-value="${key}"]`, view.preview.values[index]);
      setText(`[data-cockpit-result-label="${key}"]`, view.preview.labels[index]);
      setText(`[data-cockpit-result-value="${key}"]`, view.preview.values[index]);
    });

    const maximum = Math.max(0, ...view.counts);
    for (const bar of document.querySelectorAll("[data-digit-bar]")) {
      const digit = Number(bar.dataset.digitBar);
      const count = view.counts[digit - 1] ?? 0;
      const level = maximum > 0 ? Math.max(8, Math.round((count / maximum) * 100)) : 0;
      bar.style.setProperty("--bar-level", String(level));
      const countLabel = bar.querySelector("em");
      if (countLabel) countLabel.textContent = result ? String(count) : "－";
    }
    const chart = document.querySelector(".digit-bars");
    if (chart) {
      chart.classList.toggle("is-empty", !result);
      chart.setAttribute(
        "aria-label",
        result
          ? `數字一至九出現次數：${view.counts.map((count, index) => `${index + 1} 為 ${count} 次`).join("，")}`
          : "尚未分析，輸入資料後顯示數字一至九的出現次數",
      );
    }
  }
  function focusResult(resultTarget = "overview") {
    window.setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targetSelector = {
        overview: "#result-life-path",
        "life-path": "#result-life-path",
        annual: "#result-annual-cycle",
        grid: "#result-nine-grid",
        color: "#color-guide-title",
      }[resultTarget];
      const target = document.querySelector(targetSelector) ?? resultAnchor;
      if (target instanceof HTMLDetailsElement) target.open = true;
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      (target.querySelector("h2, summary") ?? target).focus?.({ preventScroll: true });
      birthdayResultTarget = "overview";
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
    stopIChingRolls();
    birthdayAutoSubmitArmed = false;
    form.classList.remove("is-awaiting-birthday");
    mode = nextMode;
    form.dataset.activeMode = mode;
    for (const input of modeInputs) input.checked = input.value === mode;
    for (const panel of modePanels) panel.hidden = panel.dataset.modePanel !== mode;
    for (const label of modeLabels) label.classList.toggle("is-active", label.dataset.modeLabel === mode);
    analyzerTitleText.textContent = modeContent[mode].label;
    analyzerTitleImage.src = modeContent[mode].titleArt;
    analyzerDescription.textContent = modeContent[mode].description;
    help.textContent = modeContent[mode].help;
    if (analyzeLabel) analyzeLabel.textContent = modeContent[mode].button;
    modeArt.src = modeContent[mode].art;
    modeArt.alt = modeContent[mode].alt;
    modeArt.width = modeContent[mode].artWidth;
    modeArt.height = modeContent[mode].artHeight;
    message.textContent = "";
    setInvalid(false);
    clearResult();
    updateCockpitMode();
    updateCockpitResult(null);
    updateDashboardAnalytics(null);
    updateClearButton();
    window.setTimeout(() => currentInputs()[0].focus(), 0);
  }

  function startBirthdayAnalysis(event) {
    event.preventDefault();
    const shouldAnalyze = Boolean(birthdayInput.value);
    changeMode("birthday");
    birthdayAutoSubmitArmed = !shouldAnalyze;
    birthdayResultTarget = event.currentTarget?.dataset.resultTarget ?? "overview";
    const analyzer = document.querySelector("#analyzer");
    analyzer?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    analyzer?.classList.remove("is-entry-highlight");
    window.requestAnimationFrame(() => analyzer?.classList.add("is-entry-highlight"));
    window.setTimeout(() => analyzer?.classList.remove("is-entry-highlight"), 1400);
    window.history.replaceState(null, "", "#analyzer");
    birthdayInput.focus({ preventScroll: true });
    if (shouldAnalyze) {
      form.classList.remove("is-awaiting-birthday");
      window.setTimeout(() => form.requestSubmit(), 0);
      return;
    }
    form.classList.add("is-awaiting-birthday");
    help.textContent = "請選擇出生日期；選好後會立即完成分析，不必再按一次。";
    try {
      if (typeof birthdayInput.showPicker === "function") birthdayInput.showPicker();
      else birthdayInput.click();
    } catch {
      // 日期選擇器可能被瀏覽器的使用者手勢規則阻擋，欄位仍已正確聚焦。
    }
  }

  function updateBirthdayEntryLabel() {
    for (const link of birthdayEntryLinks) {
      const label = link.querySelector("span");
      if (label && link.classList.contains("sidebar-primary")) {
        label.textContent = birthdayInput.value ? "立即更新完整結果" : "選生日・直接看完整結果";
      }
    }
  }

  function resetCurrent() {
    stopIChingRolls();
    for (const input of currentInputs()) input.value = "";
    message.textContent = "";
    form.classList.remove("is-awaiting-birthday");
    setInvalid(false);
    clearResult();
    updateCockpitResult(null);
    updateDashboardAnalytics(null);
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
  for (const link of quickModeLinks) {
    link.addEventListener("click", (event) => {
      const nextMode = link.dataset.quickMode;
      if (!modeContent[nextMode]) return;
      if (nextMode === "iching" && !ichingUnlocked) {
        event.preventDefault();
        openAccessDialog();
        return;
      }
      changeMode(nextMode);
    });
  }
  for (const link of birthdayEntryLinks) {
    link.addEventListener("click", startBirthdayAnalysis);
  }
  for (const input of [birthdayInput, codeInput, ...ichingInputs]) {
    input.addEventListener("input", () => {
      message.textContent = "";
      setInvalid(false);
      clearResult();
      updateCockpitResult(null);
      updateDashboardAnalytics(null);
      updateClearButton();
      if (input === birthdayInput && input.value) form.classList.remove("is-awaiting-birthday");
      if (input === birthdayInput) updateBirthdayEntryLabel();
    });
  }
  for (const button of ichingRandomButtons) {
    button.addEventListener("click", () => randomizeIChingNumber(button));
  }
  birthdayInput.addEventListener("change", () => {
    if (!birthdayAutoSubmitArmed || !birthdayInput.value) return;
    birthdayAutoSubmitArmed = false;
    form.requestSubmit();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const settings = loadNumerologySettings();
      const ruleSet = resolveSettingsRuleSet(settings);
      const todayValue = localDateString();
      const currentYear = new Date().getFullYear();
      const result = mode === "birthday"
        ? analyzeBirthday(birthdayInput.value, currentYear, todayValue, { ruleSet })
        : mode === "code" ? analyzeDigitCode(codeInput.value) : calculateModernThreeNumberHexagram(ichingInputs.map((input) => input.value));
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
      form.classList.remove("is-awaiting-birthday");
      birthdayAutoSubmitArmed = false;
      help.textContent = modeContent[mode].help;
      setInvalid(false);
      resultAnchor.replaceChildren(result.kind === "kangjie" ? createIChingResult(result, resetCurrent) : createNumerologyResult(result, resetCurrent));
      updateCockpitResult(result);
      updateDashboardAnalytics(result);
      focusResult(mode === "birthday" ? birthdayResultTarget : "overview");
    } catch (error) {
      birthdayAutoSubmitArmed = false;
      form.classList.remove("is-awaiting-birthday");
      clearResult();
      updateCockpitResult(null);
      updateDashboardAnalytics(null);
      message.textContent = error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。";
      setInvalid(true);
      currentInputs()[0].focus();
    }
  });

  clearButton.addEventListener("click", resetCurrent);
  window.addEventListener("pagehide", stopIChingRolls, { once: true });
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
  updateCockpitMode();
  updateCockpitResult(null);
  updateDashboardAnalytics(null);
  updateBirthdayEntryLabel();
  updateClearButton();
}

function initializeCockpitClock() {
  const timeOutput = document.querySelector("[data-cockpit-time]");
  const dateOutput = document.querySelector("[data-cockpit-date]");
  if (!timeOutput || !dateOutput) return;
  const timeFormat = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateFormat = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const update = () => {
    const now = new Date();
    timeOutput.textContent = timeFormat.format(now);
    dateOutput.textContent = dateFormat.format(now);
  };
  update();
  const interval = window.setInterval(update, 30_000);
  window.addEventListener("pagehide", () => window.clearInterval(interval), { once: true });
}

function initializeVisitCounter() {
  const container = document.querySelector("[data-visit-counter]");
  const output = document.querySelector("[data-visit-count]");
  if (!container || !output) return;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, VISIT_COUNTER_TIMEOUT_MS);
  const renderCount = (value, fallback = false) => {
    const formatted = new Intl.NumberFormat("zh-TW").format(value);
    output.textContent = fallback ? `${formatted}+` : formatted;
    container.dataset.state = "ready";
    container.dataset.quality = fallback ? "verified-minimum" : "live";
    container.setAttribute("aria-label", fallback
      ? `累積造訪至少 ${formatted} 次`
      : `累積造訪 ${formatted} 次`);
    container.title = fallback
      ? "計數服務暫時無法讀取；目前顯示發佈前已驗證的最低累積值"
      : "累積造訪次數；同一瀏覽器分頁重新整理不重複累加";
  };
  loadCumulativeVisitCount({
    signal: controller.signal,
    fallbackMinimum: VISIT_COUNTER_VERIFIED_MINIMUM,
  })
    .then(({ value, fallback }) => renderCount(value, fallback))
    .catch(() => {
      if (timedOut) {
        renderCount(VISIT_COUNTER_VERIFIED_MINIMUM, true);
        return;
      }
      output.textContent = "--";
      container.dataset.state = "unavailable";
      container.setAttribute("aria-label", "累積造訪次數暫時無法讀取");
      container.title = "計數服務暫時無法讀取，其他功能仍可正常使用";
    })
    .finally(() => window.clearTimeout(timeout));
}

function initializeWorkspaceLinks(workspaceRoot) {
  if (!workspaceRoot) return;
  for (const link of document.querySelectorAll("[data-workspace-target]")) {
    link.addEventListener("click", (event) => {
      const target = link.dataset.workspaceTarget;
      const tab = workspaceRoot.querySelector(`[data-workspace-tab="${target}"]`);
      const entry = link.dataset.workspaceEntry;
      const entryButton = entry ? workspaceRoot.querySelector(`[data-entry="${entry}"]`) : null;
      if (!tab && !entryButton) return;
      event.preventDefault();
      if (entryButton) entryButton.click();
      else tab.click();
      if (window.location.hash !== "#numerology-workspace") window.history.pushState(null, "", "#numerology-workspace");
    });
  }
}

function initializeFunctionCommandToggle() {
  const toggle = document.querySelector("[data-function-command-toggle]");
  const grid = document.querySelector("#function-command-grid");
  const label = toggle?.querySelector("[data-function-command-toggle-label]");
  if (!(toggle instanceof HTMLButtonElement) || !(grid instanceof HTMLElement)) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    grid.hidden = !open;
    if (label) label.textContent = open ? "收合全部" : "展開全部";
  };

  setOpen(false);
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
    if (open) window.requestAnimationFrame(() => grid.scrollIntoView({ block: "nearest" }));
  });
}

if (typeof document !== "undefined") {
  initializeAnalyzer();
  initializeCockpitClock();
  initializeVisitCounter();
  initializeFunctionCommandToggle();
  const workspaceRoot = document.querySelector("#numerology-workspace");
  mountNumerologyWorkspace(workspaceRoot, { assetRoot: "public/visuals" });
  initializeWorkspaceLinks(workspaceRoot);
}
