let panelSequence = 0;

function node(tagName, className = "", text = "") {
  const value = document.createElement(tagName);
  if (className) value.className = className;
  if (text !== "") value.textContent = text;
  return value;
}

function evidenceBadge(label) {
  return node("b", "line-evidence-badge", label);
}

function activeMetric(label, value, detail, tier, tierLabel) {
  const article = node("article");
  article.dataset.evidenceTier = tier;
  const meta = node("div", "line-evidence-meta");
  meta.append(node("span", "", label), evidenceBadge(tierLabel));
  article.append(meta, node("strong", "", value));
  if (detail) article.append(node("small", "", detail));
  return article;
}

function timeCell(row) {
  const cell = node("div", "line-correspondence-cell is-time");
  cell.setAttribute("role", "cell");
  cell.dataset.label = "時間";
  cell.dataset.evidenceTier = row.time.sourceTier;
  const copy = node("div");
  copy.append(evidenceBadge("現代等分"), node("strong", "", `現代均分・${row.time.relative}`), node("small", "", `${row.time.percent}・非古籍應期法`));
  const presets = node("ul", "line-time-presets");
  for (const preset of row.time.presets) {
    const item = node("li");
    item.append(node("span", "", preset.label), node("b", "", preset.span));
    presets.append(item);
  }
  cell.append(copy, presets);
  return cell;
}

function copyCell(label, primary, secondary, className = "", tier = "", tierLabel = "") {
  const cell = node("div", `line-correspondence-cell ${className}`.trim());
  cell.setAttribute("role", "cell");
  cell.dataset.label = label;
  if (tier) cell.dataset.evidenceTier = tier;
  if (tierLabel) cell.append(evidenceBadge(tierLabel));
  cell.append(node("strong", "", primary), node("small", "", secondary));
  return cell;
}

export function createLineCorrespondencePanel(analysis) {
  panelSequence += 1;
  const titleId = `line-correspondence-title-${panelSequence}`;
  const active = analysis.active;
  const section = node("section", "line-correspondence-panel");
  section.dataset.lineCorrespondence = analysis.version;
  section.setAttribute("aria-labelledby", titleId);

  const heading = node("header", "line-correspondence-heading");
  const headingCopy = node("div");
  const title = node("h3", "line-correspondence-title");
  const titleMark = node("img", "brush-title-image line-correspondence-title-mark");
  titleMark.src = "public/visuals/marks/line-correspondence-v19.svg";
  titleMark.alt = "";
  titleMark.setAttribute("aria-hidden", "true");
  titleMark.decoding = "async";
  title.append(titleMark, node("span", "", "時序・身體・職位・家宅"));
  headingCopy.append(
    node("p", "section-index", `六爻層位・本次動爻 ${active.lineName}`),
    title,
  );
  headingCopy.lastElementChild.id = titleId;
  heading.append(
    headingCopy,
    node("p", "line-correspondence-boundary", "古典爻位、後世類象與現代等分時間分層顯示，不直接推成吉凶或疾病。"),
  );

  const activeGrid = node("div", "line-correspondence-active");
  activeGrid.setAttribute("aria-label", `${active.lineName}四項對應摘要`);
  activeGrid.append(
    activeMetric("時間", active.time.relative, `現代均分・${active.classicStage}・非古籍應期法`, active.time.sourceTier, "現代等分"),
    activeMetric("身體類象", active.body.label, "後世術數類象・非醫療診斷", active.evidence.body.tier, "後世類象"),
    activeMetric("職位", active.occupation.laterDivination, `後世官祿古例；現代生涯類比：${active.occupation.modernAnalogy}`, "later-divination-analogy modern-analogy", "後世＋現代"),
    activeMetric("家宅", active.house.label, `${active.house.zone}・不可直接判吉凶`, active.evidence.houseMapping.tier, "後世類象"),
  );

  const details = node("details", "line-correspondence-details");
  const summary = node("summary");
  const summaryCopy = node("span");
  summaryCopy.append(node("strong", "", "展開六爻完整對照"), node("small", "", "上爻至初爻，四類一次核對"));
  const expandMark = node("b", "", "＋");
  expandMark.setAttribute("aria-hidden", "true");
  summary.append(summaryCopy, expandMark);

  const table = node("div", "line-correspondence-table");
  table.setAttribute("role", "table");
  table.setAttribute("aria-label", "六爻時間、身體、職位與家宅完整對照");
  const labels = node("div", "line-correspondence-labels");
  labels.setAttribute("role", "row");
  for (const label of ["爻位", "時間", "身體", "職位", "家宅"]) {
    const cell = node("span", "", label);
    cell.setAttribute("role", "columnheader");
    labels.append(cell);
  }
  table.append(labels);

  for (const row of [...analysis.rows].reverse()) {
    const item = node("article", `line-correspondence-row${row.isMoving ? " is-active" : ""}`);
    item.dataset.linePosition = String(row.position);
    item.setAttribute("role", "row");
    if (row.isMoving) item.setAttribute("aria-current", "true");
    const position = node("div", "line-correspondence-position");
    position.setAttribute("role", "cell");
    position.dataset.label = "爻位";
    position.dataset.evidenceTier = row.evidence.stage.tier;
    position.append(evidenceBadge("古典爻位摘要"), node("strong", "", row.lineName), node("span", "", row.classicStage), node("small", "", row.stageDetail));
    if (row.isMoving) position.append(node("em", "", "本次動爻"));
    item.append(
      position,
      timeCell(row),
      copyCell("身體", row.body.label, `${row.body.detail} 非醫療診斷。`, "is-body", row.evidence.body.tier, "後世類象"),
      copyCell("職位", `後世官祿古例：${row.occupation.laterDivination}`, `現代生涯類比：${row.occupation.modernAnalogy}`, "is-occupation", "later-divination-analogy modern-analogy", "後世＋現代"),
      copyCell("家宅", row.house.label, `${row.house.zone}・不可直接判吉凶`, "is-house", row.evidence.houseMapping.tier, "後世類象"),
    );
    table.append(item);
  }

  const sourceDetails = node("details", "line-correspondence-sources");
  const sourceSummary = node("summary", "", "來源與使用界線");
  const sourceBody = node("div");
  const notices = node("ul");
  for (const notice of analysis.notices) notices.append(node("li", "", notice));
  const links = node("div", "line-correspondence-source-links");
  for (const source of analysis.sources) {
    const link = node("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.append(node("strong", "", source.title), node("small", "", `${source.organization}・${source.scope}`));
    links.append(link);
  }
  sourceBody.append(notices, links);
  sourceDetails.append(sourceSummary, sourceBody);
  details.append(summary, sourceDetails, table);
  section.append(heading, activeGrid, details);
  return section;
}
