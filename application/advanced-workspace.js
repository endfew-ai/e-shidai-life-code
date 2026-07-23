import {
  analyzeIdentityV2,
  analyzeSequenceV2,
} from "./numerology-analysis.js";
import {
  MAGNETIC_FIELD_INTERPRETATIONS,
  TIMELINE_PROFILES,
  buildTimelineStageInsight,
  generatePlainTextReport,
} from "../domain/numerology/index.js";
import {
  clearAnalysisHistory,
  loadAnalysisHistory,
  loadNumerologySettings,
  resolveSettingsRuleSet,
  saveAnalysisHistory,
  saveNumerologySettings,
} from "../infrastructure/numerology-storage.js";

const VIEW_META = Object.freeze({
  home: Object.freeze({ label: "功能總覽", title: "生命靈數工作台" }),
  identity: Object.freeze({ label: "身分證命格", title: "身分證命格與人生階段" }),
  sequence: Object.freeze({ label: "號碼磁場", title: "手機、車牌、門牌與自訂序列" }),
  settings: Object.freeze({ label: "規則設定", title: "版本化演算設定" }),
  history: Object.freeze({ label: "本機紀錄", title: "最近分析紀錄" }),
  sources: Object.freeze({ label: "規則說明", title: "規則版本與使用界線" }),
});

const SEQUENCE_META = Object.freeze({
  phone_number: Object.freeze({
    label: "手機號碼",
    help: "可輸入手機號碼；結果與歷史只顯示末四碼。",
    placeholder: "例如：0912-345-678",
    inputMode: "tel",
  }),
  vehicle_address: Object.freeze({
    label: "車牌／門牌",
    help: "英文字母依 A=01～Z=26 轉成數字；這是民俗規則。",
    placeholder: "例如：ABC-1234 或 168",
    inputMode: "text",
  }),
  custom_sequence: Object.freeze({
    label: "自訂英數序列",
    help: "接受英文字母、數字、空格與半形連字號。",
    placeholder: "例如：A1035B",
    inputMode: "text",
  }),
});

const FIELD_TONES = Object.freeze({
  伏位: "stable",
  延年: "lead",
  生氣: "growth",
  天醫: "support",
  禍害: "speech",
  六煞: "relation",
  絕命: "change",
  五鬼: "insight",
});

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function liveClock() {
  const now = new Date();
  return {
    todayValue: localDateString(now),
    currentYear: now.getFullYear(),
    createdAt: now.toISOString(),
  };
}

function el(tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function button(label, className = "") {
  const node = el("button", className, label);
  node.type = "button";
  return node;
}

function headingText(text, className, level) {
  const node = el("p", className, text);
  node.setAttribute("role", "heading");
  node.setAttribute("aria-level", String(level));
  return node;
}

function statusMessage(container, message, state = "info") {
  container.textContent = message;
  container.dataset.state = state;
}

function setSensitiveText(node, actualText, maskedText, sensitiveValues) {
  node.textContent = maskedText;
  if (Array.isArray(sensitiveValues)) {
    sensitiveValues.push(Object.freeze({ node, actualText: String(actualText), maskedText: String(maskedText) }));
  }
  return node;
}

function fieldBadge(fieldType) {
  const badge = el("span", "magnetic-field-badge", fieldType ?? "未分類");
  badge.dataset.fieldTone = fieldType ? FIELD_TONES[fieldType] : "unresolved";
  return badge;
}

function createWorkspaceMarkup(root, assetRoot) {
  root.classList.add("numerology-workspace");
  root.setAttribute("aria-labelledby", "numerology-workspace-title");
  root.innerHTML = `
    <header class="workspace-heading">
      <div>
        <p class="section-index">生命靈數・五模組引擎</p>
        <p id="numerology-workspace-title" class="workspace-title brush-title" role="heading" aria-level="2"><span class="sr-only">進階靈數工作台</span><img class="brush-title-image" src="${assetRoot}/brush/title-workspace-v1.webp" alt="" aria-hidden="true" /></p>
        <p>生日、九宮格、數字磁場、身分證時間軸與解讀報告，各自獨立計算並標示規則版本。</p>
      </div>
      <div class="workspace-clock" aria-live="off">
        <span>本機時間自動偵測</span>
        <time data-workspace-clock></time>
      </div>
    </header>
    <nav class="workspace-tabs" aria-label="進階靈數功能">
      ${Object.entries(VIEW_META).map(([id, meta]) =>
        `<button type="button" data-workspace-tab="${id}" aria-selected="${id === "home"}">${meta.label}</button>`).join("")}
    </nav>
    <div class="workspace-panels">
      <section data-workspace-view="home">
        <div class="workspace-intro">
          <span class="workspace-rule-mark">RULESET 2.1</span>
          <p class="workspace-intro-title" role="heading" aria-level="3">先選資料，再核對規則與演算過程</p>
          <p>生命靈數是主要入口；易經功能維持獨立，不會混入生日或身分證分析。</p>
        </div>
        <div class="workspace-entry-grid">
          <button type="button" data-entry="birthday"><span>01</span><strong>生日生命靈數</strong><small>全部生日數字加總、生日數、九宮連線與個人流年</small></button>
          <button type="button" data-entry="identity"><span>02</span><strong>身分證命格</strong><small>命格數列與人生階段分流計算，輸入預設遮罩</small></button>
          <button type="button" data-entry="phone_number"><span>03</span><strong>手機號碼磁場</strong><small>相鄰滑動配對、0／5 修飾與八大磁場</small></button>
          <button type="button" data-entry="vehicle_address"><span>04</span><strong>車牌／門牌</strong><small>英數轉換與來源字元追溯</small></button>
          <button type="button" data-entry="custom_sequence"><span>05</span><strong>自訂英數序列</strong><small>適合其他非敏感編號；不當作身分證檢查</small></button>
          <button type="button" data-entry="settings"><span>06</span><strong>規則與版本</strong><small>主數、九宮格、0／5 與時間軸皆可明確選擇</small></button>
        </div>
        <div class="workspace-boundary">
          <strong>資料界線</strong>
          <p>所有分析只在本機瀏覽器執行。身分證完整字號、轉換序列與配對不寫入歷史；民俗內容不作醫療、財務、法律或命運保證。</p>
        </div>
      </section>
      <section data-workspace-view="identity" hidden>
        <header class="workspace-panel-heading">
          <div><p>輸入檢查 × 民俗規則</p><p class="workspace-panel-title" role="heading" aria-level="3" tabindex="-1">身分證命格與人生階段</p></div>
          <span data-active-timeline></span>
        </header>
        <form data-identity-form novalidate>
          <label class="workspace-field">
            <span>台灣國民身分證統一編號</span>
            <input data-identity-input type="password" maxlength="10" autocomplete="off" spellcheck="false" autocapitalize="characters" placeholder="輸入 1 個英文字母與 9 位數字" aria-describedby="identity-privacy identity-status" />
          </label>
          <label class="workspace-check">
            <input data-identity-override type="checkbox" />
            <span>檢查碼未通過時，仍視為「自訂民俗序列」分析</span>
          </label>
          <p id="identity-privacy" class="workspace-help">完整字號不寫入網址、造訪計數、console 或本機歷史。結果預設顯示遮罩。</p>
          <p id="identity-status" class="workspace-status" data-identity-status role="alert" aria-live="polite"></p>
          <div class="workspace-form-actions">
            <button type="submit" class="primary-button">開始身分證分析 <span aria-hidden="true">↘</span></button>
            <button type="reset" class="secondary-button">清除</button>
          </div>
        </form>
        <div data-identity-result></div>
      </section>
      <section data-workspace-view="sequence" hidden>
        <header class="workspace-panel-heading">
          <div><p>相鄰滑動配對</p><p class="workspace-panel-title" role="heading" aria-level="3" tabindex="-1">手機、車牌、門牌與自訂序列</p></div>
          <span data-active-zero-five></span>
        </header>
        <form data-sequence-form novalidate>
          <div class="sequence-type-switch" role="radiogroup" aria-label="序列類型">
            ${Object.entries(SEQUENCE_META).map(([id, meta]) =>
              `<label><input type="radio" name="sequence-type" value="${id}" ${id === "phone_number" ? "checked" : ""} /><span>${meta.label}</span></label>`).join("")}
          </div>
          <label class="workspace-field">
            <span data-sequence-label>手機號碼</span>
            <input data-sequence-input type="text" maxlength="80" autocomplete="off" spellcheck="false" inputmode="tel" placeholder="例如：0912-345-678" aria-describedby="sequence-help sequence-status" />
          </label>
          <p id="sequence-help" class="workspace-help" data-sequence-help>可輸入手機號碼；結果與歷史只顯示末四碼。</p>
          <p id="sequence-status" class="workspace-status" data-sequence-status role="alert" aria-live="polite"></p>
          <div class="workspace-form-actions">
            <button type="submit" class="primary-button">分析數字磁場 <span aria-hidden="true">↘</span></button>
            <button type="reset" class="secondary-button">清除</button>
          </div>
        </form>
        <div data-sequence-result></div>
      </section>
      <section data-workspace-view="settings" hidden>
        <header class="workspace-panel-heading">
          <div><p>會影響結果，請明確選擇</p><p class="workspace-panel-title" role="heading" aria-level="3" tabindex="-1">版本化演算設定</p></div>
          <span data-settings-badge></span>
        </header>
        <form class="settings-grid" data-settings-form>
          <label><span>規則基底</span><select name="ruleSetId"><option value="uploaded-material-v2">教材可追溯規則 v2（建議）</option><option value="legacy-project-v1">舊版相容規則 v1</option></select></label>
          <label><span>主數處理</span><select name="masterNumberMode"><option value="disabled">不保留，化簡至 1～9（預設）</option><option value="preserve_11_22_33">保留 11／22／33</option><option value="preserve_custom">自訂保留主數</option></select></label>
          <label data-custom-masters hidden><span>自訂主數</span><input name="customMasterNumbers" type="text" inputmode="numeric" placeholder="例如：11,22,33,44" /></label>
          <label><span>生日九宮入格</span><select name="birthGridMode"><option value="raw_birth_digits">生日原始數字</option><option value="raw_plus_life_path">生日數字＋生命靈數基底</option><option value="legacy_project">舊版洛書版位</option></select></label>
          <label><span>0／5 處理</span><select name="zeroFiveMode"><option value="bridge_modifier">橋接修飾，保留原序列</option><option value="literal">只列原始相鄰配對</option><option value="legacy_project">舊版未定義，不自動判定</option></select></label>
          <label><span>身分證時間軸</span><select name="timelineProfile"><option value="first_10_then_5">首段 10 年，其後 5 年（預設）</option><option value="uploaded_sheet_exact">教材原表照錄（含不一致警告）</option><option value="first_13_then_5">首段 13 年，其後 5 年</option><option value="cyclic_5_year">每 5 年循環延伸</option><option value="legacy_project">舊版無公式，不產生時間軸</option></select></label>
          <label><span>符號處理</span><select name="symbolMode"><option value="skip_spaces_hyphens">略過空格與半形連字號</option><option value="skip_all">略過全部非英數符號</option><option value="error">遇到符號立即報錯</option></select></label>
          <div class="settings-summary" data-settings-summary></div>
          <p class="workspace-status" data-settings-status role="status" aria-live="polite"></p>
          <div class="workspace-form-actions"><button type="submit" class="primary-button">儲存並套用設定</button></div>
        </form>
      </section>
      <section data-workspace-view="history" hidden>
        <header class="workspace-panel-heading">
          <div><p>只存在這台裝置</p><p class="workspace-panel-title" role="heading" aria-level="3" tabindex="-1">最近分析紀錄</p></div>
          <button type="button" class="secondary-button compact-button" data-clear-history>清除全部紀錄</button>
        </header>
        <p class="workspace-help">最多保留 20 筆遮罩摘要。完整身分證、英數轉換序列、磁場配對與時間軸都不儲存。</p>
        <div data-history-list></div>
        <p class="workspace-status" data-history-status role="status" aria-live="polite"></p>
      </section>
      <section data-workspace-view="sources" hidden>
        <header class="workspace-panel-heading"><div><p>規則版本分開標示</p><p class="workspace-panel-title" role="heading" aria-level="3" tabindex="-1">規則版本與使用界線</p></div><span>民俗文化參考</span></header>
        <div class="source-ledger">
          <article><span>本專案教材</span><p class="source-ledger-title" role="heading" aria-level="4">生命靈數、九宮連線與八大磁場</p><p>依本專案提供的近代民俗教材建立版本化規則；不同流派可能有差異，結果只供文化研究、娛樂與自我觀察。</p></article>
          <article><span>身分證命格規則</span><p class="source-ledger-title" role="heading" aria-level="4">命格數列與人生階段分流</p><p>字母先依 A=01～Z=26 轉換。命格數列只在字母碼為 01～09 時移除最前方 0；人生階段保留完整數列。</p></article>
          <article><span>可選時間軸</span><p class="source-ledger-title" role="heading" aria-level="4">身分證人生階段區間</p><p>區間有不同流傳版本；目前採用版本可在設定頁查看與切換，遇到教材區間數量差異時會明確提示。</p></article>
        </div>
      </section>
    </div>
  `;
}

function describeSettings(settings, ruleSet) {
  const timeline = TIMELINE_PROFILES[settings.timelineProfile];
  const masterLabel = settings.masterNumberMode === "disabled"
    ? "主數不保留"
    : settings.masterNumberMode === "preserve_11_22_33"
      ? "保留 11／22／33"
      : `自訂主數 ${settings.customMasterNumbers.join("、")}`;
  return `${ruleSet.name} ${ruleSet.version}｜${masterLabel}｜九宮 ${settings.birthGridMode}｜0／5 ${settings.zeroFiveMode}｜時間軸 ${timeline.label}`;
}

function renderPairCards(container, magnetic, options = {}) {
  const maskSensitive = options.maskSensitive === true;
  const sensitiveValues = options.sensitiveValues;
  const wrapper = el("div", "magnetic-results");
  const summary = el("header", "magnetic-summary");
  const titleBlock = el("div");
  titleBlock.append(
    el("p", "", options.eyebrow ?? "主要出現磁場"),
    headingText(magnetic.dominantField.label, "magnetic-summary-title", 4),
  );
  const count = el("span", "", `${magnetic.pairs.length} 個相鄰視窗`);
  summary.append(titleBlock, count);
  wrapper.append(summary);

  const pairGrid = el("div", "pair-grid");
  for (const [index, pair] of magnetic.pairs.entries()) {
    const card = el("article", "pair-card");
    const heading = el("header");
    const pairCode = el("code");
    if (maskSensitive) setSensitiveText(pairCode, pair.rawPair, "••", sensitiveValues);
    else pairCode.textContent = pair.rawPair;
    heading.append(el("span", "", String(index + 1).padStart(2, "0")), pairCode);
    if (pair.fieldType) heading.append(fieldBadge(pair.fieldType));
    else heading.append(fieldBadge(null));
    const source = pair.sourceCharacters.map(({ character }) => character).join("") || "數字輸入";
    const explanation = el("p");
    const sourceNote = el("small");
    if (maskSensitive) {
      setSensitiveText(explanation, pair.explanation, `${pair.fieldType ?? "未分類"}；完整相鄰數字預設遮罩。`, sensitiveValues);
      setSensitiveText(
        sourceNote,
        `位置 ${pair.startIndex + 1}–${pair.endIndex + 1}・來源 ${source}`,
        `第 ${index + 1} 個命格視窗・來源預設遮罩`,
        sensitiveValues,
      );
    } else {
      explanation.textContent = pair.explanation;
      sourceNote.textContent = `位置 ${pair.startIndex + 1}–${pair.endIndex + 1}・來源 ${source}`;
    }
    card.append(
      heading,
      explanation,
      sourceNote,
    );
    pairGrid.append(card);
  }
  wrapper.append(pairGrid);

  if (magnetic.bridges.length) {
    const bridgeBlock = el("section", "bridge-block");
    bridgeBlock.append(headingText("0／5 橋接修飾", "bridge-block-title", 4));
    for (const bridge of magnetic.bridges) {
      const row = el("article");
      const head = el("div");
      const rawCode = el("code");
      const baseCode = el("code");
      const explanation = el("p");
      if (maskSensitive) {
        setSensitiveText(rawCode, bridge.rawPair, "•••", sensitiveValues);
        setSensitiveText(baseCode, bridge.basePair, "••", sensitiveValues);
        setSensitiveText(explanation, bridge.explanation, `橋接結果：${bridge.fieldType ?? "未分類"}；完整數字預設遮罩。`, sensitiveValues);
      } else {
        rawCode.textContent = bridge.rawPair;
        baseCode.textContent = bridge.basePair;
        explanation.textContent = bridge.explanation;
      }
      head.append(rawCode, el("span", "", "→"), baseCode, fieldBadge(bridge.fieldType));
      row.append(head, explanation);
      bridgeBlock.append(row);
    }
    wrapper.append(bridgeBlock);
  }

  if (magnetic.standaloneModifiers.length) {
    const notes = el("p", "standalone-modifiers");
    notes.append(el("strong", "", "未橋接修飾："));
    const actualText = magnetic.standaloneModifiers.map(({ digit, index, label }) =>
      `${digit}（第 ${index + 1} 位，${label}）`).join("；");
    const detail = el("span");
    if (maskSensitive) {
      setSensitiveText(detail, actualText, `${magnetic.standaloneModifiers.length} 個位置，完整數字預設遮罩`, sensitiveValues);
    } else {
      detail.textContent = actualText;
    }
    notes.append(detail);
    wrapper.append(notes);
  }

  const fields = el("div", "field-summary-grid");
  for (const [fieldType, occurrence] of Object.entries(magnetic.dominantField.counts)) {
    const interpretation = MAGNETIC_FIELD_INTERPRETATIONS[fieldType];
    const card = el("article");
    const head = el("header");
    head.append(fieldBadge(fieldType), el("strong", "", `${occurrence} 次`));
    card.append(
      head,
      el("p", "", `觀察：${interpretation.core.join("、")}`),
      el("small", "", `提醒：${interpretation.cautions.join("、")}`),
    );
    fields.append(card);
  }
  if (fields.childElementCount) wrapper.append(fields);
  container.append(wrapper);
}

function renderIdentityDestiny(container, destiny) {
  const block = el("section", "identity-destiny-block");
  const header = el("header");
  const copy = el("div");
  copy.append(
    el("p", "", "規則已設定"),
    headingText("身分證命格數列", "identity-destiny-title", 4),
  );
  header.append(copy, el("code", "", destiny.maskedSequence));
  const rule = el("p", "identity-destiny-rule", destiny.droppedLeadingZero
    ? `字母碼 ${destiny.letterSequentialValue} 以 0 開頭；命格分析只移除這個補位 0。`
    : `字母碼 ${destiny.letterSequentialValue} 不以 0 開頭；命格分析完整保留。`);
  const stats = el("dl", "identity-destiny-stats");
  for (const [label, value] of [
    ["命格數列", `${destiny.sequenceLength} 位`],
    ["命格相鄰視窗", `${destiny.magnetic.pairs.length} 組`],
    ["人生階段數列", `${destiny.fullSequenceLength} 位完整保留`],
  ]) {
    const item = el("div");
    item.append(el("dt", "", label), el("dd", "", value));
    stats.append(item);
  }
  block.append(
    header,
    rule,
    stats,
    el("small", "", "命格數列是一組長期格局序列，不是加總化簡後的單一數字。"),
  );
  container.append(block);
}

function renderTimeline(container, timeline, options = {}) {
  const maskSensitive = options.maskSensitive === true;
  const sensitiveValues = options.sensitiveValues;
  const magnetic = options.magnetic;
  const insights = timeline.stages.map((stage, index) =>
    buildTimelineStageInsight(stage, timeline.stages[index - 1] ?? null, {
      bridges: magnetic?.bridges ?? [],
      zeroFiveMode: magnetic?.zeroFiveMode,
      sourceProfile: timeline.sourceProfile,
    }));
  const classifiedCount = insights.filter(({ classificationStatus }) =>
    classificationStatus === "classified").length;
  const unclassifiedCount = insights.filter(({ classificationStatus }) =>
    classificationStatus === "modifier_unclassified").length;
  const unmatchedCount = insights.filter(({ classificationStatus }) =>
    classificationStatus === "unmatched").length;
  const block = el("section", "timeline-block");
  const header = el("header");
  const copy = el("div");
  copy.append(el("p", "", "人生階段流年"), headingText(timeline.profileLabel, "timeline-title", 4));
  const counts = el("div", "timeline-stage-counts");
  for (const label of [
    `${timeline.stages.length} 個階段`,
    `已分類 ${classifiedCount}`,
    `未分類 ${unclassifiedCount}`,
    ...(unmatchedCount ? [`待配對 ${unmatchedCount}`] : []),
  ]) {
    counts.append(el("span", "", label));
  }
  header.append(copy, counts);

  const controls = el("div", "timeline-controls");
  const expandAll = button("全部展開", "timeline-control");
  const collapseAll = button("全部收合", "timeline-control");
  controls.setAttribute("aria-label", "人生階段細解顯示控制");
  controls.append(expandAll, collapseAll);
  block.append(header, controls);

  const list = el("ol", "timeline-list");
  const stageDetails = [];
  for (const [index, stage] of timeline.stages.entries()) {
    const insight = insights[index];
    const stateClass = insight.classificationStatus === "unmatched"
      ? "is-unmatched"
      : insight.classificationStatus === "modifier_unclassified"
        ? "is-unclassified"
        : "";
    const item = el("li", stateClass);
    const details = el("details", "timeline-stage-details");
    details.dataset.timelineStageDetails = "";
    const disclosure = el("summary", "timeline-stage-disclosure");
    const overview = el("div", "timeline-stage-overview");
    const age = el("span", "timeline-age", stage.label);
    const heading = el("p", "timeline-stage-heading");
    const pairCode = el("code");
    if (stage.pair && maskSensitive) setSensitiveText(pairCode, stage.pair.rawPair, "••", sensitiveValues);
    else pairCode.textContent = stage.pair?.rawPair ?? "無";
    heading.append(
      pairCode,
      stage.pair?.fieldType ? fieldBadge(stage.pair.fieldType) : fieldBadge(null),
    );
    overview.append(
      age,
      heading,
      el("p", "timeline-stage-summary", insight.summary),
    );
    if (stage.cycle > 1) overview.append(el("small", "timeline-stage-cycle", `第 ${stage.cycle} 輪延伸`));
    const action = el("span", "timeline-stage-toggle");
    action.append(el("span", "", "查看細解"), el("span", "timeline-stage-toggle-icon", "+"));
    disclosure.append(overview, action);

    const panel = el("div", "timeline-stage-panel");
    const appendListSection = (title, values, className = "") => {
      const article = el("article", `timeline-insight-section ${className}`.trim());
      article.append(el("p", "timeline-insight-label", title));
      const listNode = el("ul");
      for (const value of values) listNode.append(el("li", "", value));
      article.append(listNode);
      panel.append(article);
    };
    appendListSection("階段主題", insight.themes);
    appendListSection("可觀察", insight.observationQuestions);
    appendListSection("可運用", insight.strengths);
    appendListSection("需要留意", insight.cautions);

    const transition = el("article", "timeline-insight-section is-wide");
    transition.append(
      el("p", "timeline-insight-label", "前段轉接"),
      el("strong", "", insight.transitionFromPrevious.title),
      el("p", "", insight.transitionFromPrevious.interpretation),
    );
    if (insight.transitionFromPrevious.caution) {
      transition.append(el("small", "", `提醒：${insight.transitionFromPrevious.caution}`));
    }
    panel.append(transition);

    const basis = el("article", "timeline-insight-section is-wide timeline-insight-basis");
    basis.append(
      el("p", "timeline-insight-label", "分類依據"),
      el("p", "", insight.classificationNote),
      el("small", "", insight.disclaimer),
    );
    panel.append(basis);

    details.append(disclosure, panel);
    const syncExpandedState = () => {
      item.classList.toggle("is-expanded", details.open);
      const toggleLabel = action.firstElementChild;
      const toggleIcon = action.lastElementChild;
      if (toggleLabel) toggleLabel.textContent = details.open ? "收合細解" : "查看細解";
      if (toggleIcon) toggleIcon.textContent = details.open ? "−" : "+";
    };
    details.addEventListener("toggle", syncExpandedState);
    item.append(details);
    list.append(item);
    stageDetails.push(Object.freeze({ details, item, syncExpandedState }));
  }
  expandAll.addEventListener("click", () => {
    for (const entry of stageDetails) {
      entry.details.open = true;
      entry.syncExpandedState();
    }
  });
  collapseAll.addEventListener("click", () => {
    for (const entry of stageDetails) {
      entry.details.open = false;
      entry.syncExpandedState();
    }
  });
  block.append(list);
  if (timeline.warnings.length) {
    const warnings = el("ul", "result-warnings");
    for (const warning of timeline.warnings) {
      warnings.append(el("li", "", typeof warning === "string" ? warning : warning.message));
    }
    block.append(warnings);
  }
  container.append(block);
}

function renderAnalysisResult(container, analysis, options = {}) {
  container.replaceChildren();
  const sensitiveValues = [];
  const section = el("section", "advanced-analysis-result");
  section.setAttribute("aria-live", "polite");
  const heading = el("header", "advanced-result-heading");
  const headingCopy = el("div");
  headingCopy.append(
    el("p", "", analysis.inputType === "taiwan_national_id" ? "身分證分析結果" : "數字磁場分析結果"),
    headingText(analysis.maskedInput, "advanced-result-value", 3),
    el("small", "", `${analysis.ruleSet.name} ${analysis.ruleSet.version}`),
  );
  const sensitiveHeading = headingCopy.querySelector(".advanced-result-value");
  sensitiveHeading.dataset.sensitiveResult = "";
  if (analysis.inputType === "taiwan_national_id") {
    setSensitiveText(sensitiveHeading, analysis.normalizedInput, analysis.maskedInput, sensitiveValues);
  }
  const activeDominant = analysis.inputType === "taiwan_national_id"
    ? analysis.destinyDominantField
    : analysis.dominantField;
  const dominant = el("div", "dominant-result");
  dominant.append(el("span", "", "主要出現"), el("strong", "", activeDominant?.fields.join("、") || "尚無分類"));
  heading.append(headingCopy, dominant);
  section.append(heading);

  if (analysis.inputType === "taiwan_national_id") {
    const validation = el("div", `identity-validation ${analysis.identityValidation.checksumValid ? "is-valid" : "is-warning"}`);
    validation.append(
      el("strong", "", analysis.identityValidation.checksumValid ? "格式與檢查碼通過" : "以自訂序列繼續"),
      el("p", "", analysis.identityValidation.message),
      el("small", "", "邏輯檢查通過不等於證明號碼已配發或持有人身分。"),
    );
    section.append(validation);
    renderIdentityDestiny(section, analysis.identityDestiny);
  }

  renderPairCards(
    section,
    analysis.inputType === "taiwan_national_id"
      ? analysis.destinyMagneticFieldResult
      : analysis.magneticFieldResult,
    analysis.inputType === "taiwan_national_id"
      ? { eyebrow: "命格主要出現磁場", maskSensitive: true, sensitiveValues }
      : {},
  );
  if (analysis.timelineResult) {
    renderTimeline(section, analysis.timelineResult, {
      maskSensitive: analysis.inputType === "taiwan_national_id",
      sensitiveValues,
      magnetic: analysis.lifeEncounterMagnetic,
    });
  }

  const details = el("details", "analysis-trace");
  const traceSummary = el("summary");
  traceSummary.append(el("span", "", "展開完整演算過程"), el("em", "", `${analysis.calculationSteps.length} 步`));
  const traceList = el("ol");
  for (const step of analysis.calculationSteps) {
    const item = el("li");
    const stepCode = el("code");
    if (analysis.inputType === "taiwan_national_id" && step.id.startsWith("pair-")) {
      setSensitiveText(stepCode, step.text, "完整命格相鄰數字預設遮罩", sensitiveValues);
    } else {
      stepCode.textContent = step.text;
    }
    item.append(el("span", "", step.label), stepCode);
    traceList.append(item);
  }
  details.append(traceSummary, traceList);
  section.append(details);

  if (analysis.warnings.length) {
    const warnings = el("ul", "result-warnings");
    for (const warning of analysis.warnings) warnings.append(el("li", "", typeof warning === "string" ? warning : warning.message));
    section.append(warnings);
  }

  const privacy = el("p", "analysis-privacy", "民俗結果只供文化娛樂與自我觀察，不作醫療、心理、財務、法律或命運判定。");
  const actions = el("div", "workspace-form-actions");
  let sensitiveHideTimer = null;
  let revealButton = null;
  const concealSensitiveValues = () => {
    if (sensitiveHideTimer !== null) window.clearTimeout(sensitiveHideTimer);
    for (const entry of sensitiveValues) entry.node.textContent = entry.maskedText;
    sensitiveHideTimer = null;
    if (revealButton) {
      revealButton.disabled = false;
      revealButton.textContent = "顯示完整字號 10 秒";
    }
  };
  const copyReport = button("複製遮罩報告", "secondary-button");
  copyReport.addEventListener("click", async () => {
    const report = generatePlainTextReport(analysis);
    try {
      await navigator.clipboard.writeText(report);
      copyReport.textContent = "已複製遮罩報告";
    } catch {
      copyReport.textContent = "瀏覽器未允許複製";
    }
  });
  const printReport = button("列印／存成 PDF", "secondary-button");
  printReport.dataset.printReport = "";
  printReport.addEventListener("click", () => {
    concealSensitiveValues();
    const printableDetails = [...section.querySelectorAll(".timeline-stage-details, .analysis-trace")];
    const openStates = printableDetails.map((printable) => Object.freeze({
      printable,
      open: printable.open,
      timelineItem: printable.closest(".timeline-list > li"),
    }));
    for (const state of openStates) {
      state.printable.open = true;
      state.timelineItem?.classList.add("is-expanded");
    }
    try {
      window.print();
    } finally {
      for (const state of openStates) {
        state.printable.open = state.open;
        state.timelineItem?.classList.toggle("is-expanded", state.open);
      }
    }
  });
  actions.append(copyReport, printReport);

  if (analysis.inputType === "taiwan_national_id" && options.allowReveal) {
    const reveal = button("顯示完整字號 10 秒", "text-button sensitive-reveal");
    revealButton = reveal;
    reveal.addEventListener("click", () => {
      if (sensitiveHideTimer !== null) window.clearTimeout(sensitiveHideTimer);
      for (const entry of sensitiveValues) entry.node.textContent = entry.actualText;
      reveal.disabled = true;
      reveal.textContent = "完整字號顯示中";
      sensitiveHideTimer = window.setTimeout(concealSensitiveValues, 10000);
    });
    actions.prepend(reveal);
  }

  section.append(privacy, actions);
  container.append(section);
}

function renderHistory(container, status) {
  container.replaceChildren();
  const history = loadAnalysisHistory();
  if (!history.length) {
    container.append(el("div", "history-empty", "目前沒有本機分析紀錄。完成一次進階分析後，會在這裡保存遮罩摘要。"));
    return;
  }
  const list = el("ol", "history-list");
  for (const record of history) {
    const item = el("li");
    const heading = el("header");
    const typeLabel = record.inputType === "taiwan_national_id"
      ? "身分證命格"
      : record.inputType === "phone_number"
        ? "手機號碼"
        : record.inputType === "vehicle_address"
          ? "車牌／門牌"
          : "自訂序列";
    heading.append(el("span", "", typeLabel), el("time", "", new Date(record.createdAt).toLocaleString("zh-TW")));
    item.append(heading, el("strong", "", record.maskedInput));
    const summaries = el("ul");
    for (const summary of record.summary) summaries.append(el("li", "", `${summary.title}：${summary.summary}`));
    item.append(summaries, el("small", "", `規則 ${record.ruleSetId} ${record.ruleSetVersion ?? ""}`.trim()));
    list.append(item);
  }
  container.append(list);
  statusMessage(status, `目前保存 ${history.length} 筆遮罩摘要。`, "success");
}

function populateSettings(form, settings) {
  form.elements.ruleSetId.value = settings.ruleSetId;
  form.elements.masterNumberMode.value = settings.masterNumberMode;
  form.elements.customMasterNumbers.value = settings.customMasterNumbers.join(",");
  form.elements.birthGridMode.value = settings.birthGridMode;
  form.elements.zeroFiveMode.value = settings.zeroFiveMode;
  form.elements.timelineProfile.value = settings.timelineProfile;
  form.elements.symbolMode.value = settings.symbolMode;
  form.querySelector("[data-custom-masters]").hidden = settings.masterNumberMode !== "preserve_custom";
}

function formSettings(form) {
  const customMasterNumbers = String(form.elements.customMasterNumbers.value)
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map(Number);
  return {
    ruleSetId: form.elements.ruleSetId.value,
    masterNumberMode: form.elements.masterNumberMode.value,
    customMasterNumbers,
    birthGridMode: form.elements.birthGridMode.value,
    zeroFiveMode: form.elements.zeroFiveMode.value,
    timelineProfile: form.elements.timelineProfile.value,
    symbolMode: form.elements.symbolMode.value,
  };
}

export function mountNumerologyWorkspace(root, options = {}) {
  if (!root || root.dataset.workspaceMounted === "true") return () => {};
  root.dataset.workspaceMounted = "true";
  createWorkspaceMarkup(root, options.assetRoot ?? "/visuals");

  const tabs = [...root.querySelectorAll("[data-workspace-tab]")];
  const views = [...root.querySelectorAll("[data-workspace-view]")];
  const clock = root.querySelector("[data-workspace-clock]");
  const settingsForm = root.querySelector("[data-settings-form]");
  const settingsSummary = root.querySelector("[data-settings-summary]");
  const settingsBadge = root.querySelector("[data-settings-badge]");
  const settingsStatus = root.querySelector("[data-settings-status]");
  const identityForm = root.querySelector("[data-identity-form]");
  const identityInput = root.querySelector("[data-identity-input]");
  const identityStatus = root.querySelector("[data-identity-status]");
  const identityResult = root.querySelector("[data-identity-result]");
  const sequenceForm = root.querySelector("[data-sequence-form]");
  const sequenceInput = root.querySelector("[data-sequence-input]");
  const sequenceStatus = root.querySelector("[data-sequence-status]");
  const sequenceResult = root.querySelector("[data-sequence-result]");
  const historyList = root.querySelector("[data-history-list]");
  const historyStatus = root.querySelector("[data-history-status]");
  let activeView = "home";
  let activeSequenceType = "phone_number";

  function updateClock() {
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = new Intl.DateTimeFormat("zh-TW", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false,
    }).format(now);
  }

  function refreshSettingsLabels() {
    const settings = loadNumerologySettings();
    const ruleSet = resolveSettingsRuleSet(settings);
    const description = describeSettings(settings, ruleSet);
    settingsSummary.textContent = description;
    settingsBadge.textContent = `${ruleSet.name} ${ruleSet.version}`;
    root.querySelector("[data-active-timeline]").textContent = `時間軸：${TIMELINE_PROFILES[settings.timelineProfile].label}`;
    root.querySelector("[data-active-zero-five]").textContent = `0／5：${settings.zeroFiveMode}`;
    populateSettings(settingsForm, settings);
  }

  function showView(viewId, focus = true) {
    if (!VIEW_META[viewId]) return;
    if (activeView === "identity" && viewId !== "identity") {
      identityInput.value = "";
      identityResult.replaceChildren();
      statusMessage(identityStatus, "");
    }
    activeView = viewId;
    for (const tab of tabs) {
      const selected = tab.dataset.workspaceTab === viewId;
      tab.setAttribute("aria-selected", String(selected));
    }
    for (const view of views) view.hidden = view.dataset.workspaceView !== viewId;
    if (viewId === "history") renderHistory(historyList, historyStatus);
    if (viewId === "settings") refreshSettingsLabels();
    if (focus) {
      root.querySelector(`[data-workspace-view="${viewId}"] [role="heading"]`)?.focus?.({ preventScroll: true });
      root.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }

  function updateSequenceType(type) {
    if (!SEQUENCE_META[type]) return;
    activeSequenceType = type;
    const meta = SEQUENCE_META[type];
    root.querySelector("[data-sequence-label]").textContent = meta.label;
    root.querySelector("[data-sequence-help]").textContent = meta.help;
    sequenceInput.placeholder = meta.placeholder;
    sequenceInput.inputMode = meta.inputMode;
    sequenceInput.value = "";
    sequenceResult.replaceChildren();
    statusMessage(sequenceStatus, "");
  }

  for (const tab of tabs) tab.addEventListener("click", () => showView(tab.dataset.workspaceTab));
  for (const entry of root.querySelectorAll("[data-entry]")) {
    entry.addEventListener("click", () => {
      const target = entry.dataset.entry;
      if (target === "birthday") {
        document.querySelector("#analyzer")?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector("#birthday-input")?.focus();
        return;
      }
      if (SEQUENCE_META[target]) {
        showView("sequence");
        const radio = root.querySelector(`input[name="sequence-type"][value="${target}"]`);
        if (radio) radio.checked = true;
        updateSequenceType(target);
        sequenceInput.focus();
        return;
      }
      showView(target);
    });
  }

  for (const radio of root.querySelectorAll('input[name="sequence-type"]')) {
    radio.addEventListener("change", () => updateSequenceType(radio.value));
  }

  settingsForm.elements.masterNumberMode.addEventListener("change", () => {
    settingsForm.querySelector("[data-custom-masters]").hidden =
      settingsForm.elements.masterNumberMode.value !== "preserve_custom";
  });
  settingsForm.elements.ruleSetId.addEventListener("change", () => {
    const selected = settingsForm.elements.ruleSetId.value;
    if (selected === "legacy-project-v1") {
      settingsForm.elements.masterNumberMode.value = "preserve_11_22_33";
      settingsForm.elements.birthGridMode.value = "legacy_project";
      settingsForm.elements.zeroFiveMode.value = "legacy_project";
      settingsForm.elements.timelineProfile.value = "legacy_project";
    } else {
      settingsForm.elements.masterNumberMode.value = "disabled";
      settingsForm.elements.birthGridMode.value = "raw_birth_digits";
      settingsForm.elements.zeroFiveMode.value = "bridge_modifier";
      settingsForm.elements.timelineProfile.value = "first_10_then_5";
    }
    settingsForm.querySelector("[data-custom-masters]").hidden =
      settingsForm.elements.masterNumberMode.value !== "preserve_custom";
  });
  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const saved = saveNumerologySettings(formSettings(settingsForm));
      const resolved = resolveSettingsRuleSet(saved);
      refreshSettingsLabels();
      statusMessage(settingsStatus, `已套用：${describeSettings(saved, resolved)}`, "success");
      window.dispatchEvent(new CustomEvent("numerology-settings-changed", { detail: saved }));
    } catch (error) {
      statusMessage(settingsStatus, error instanceof Error ? error.message : "設定無法儲存。", "error");
    }
  });

  identityInput.addEventListener("input", () => {
    identityInput.value = identityInput.value.replace(/\s+/g, "").toUpperCase().slice(0, 10);
    identityInput.setAttribute("aria-invalid", "false");
    statusMessage(identityStatus, "");
  });
  identityForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      identityResult.replaceChildren();
      statusMessage(identityStatus, "");
      identityInput.focus();
    }, 0);
  });
  identityForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const settings = loadNumerologySettings();
      const analysis = analyzeIdentityV2({
        value: identityInput.value,
        allowInvalidChecksum: root.querySelector("[data-identity-override]").checked,
        timelineProfile: settings.timelineProfile,
        ruleSet: resolveSettingsRuleSet(settings),
        ...liveClock(),
      });
      identityInput.value = "";
      identityInput.setAttribute("aria-invalid", "false");
      statusMessage(identityStatus, "分析完成；完整字號已從輸入框清除。", "success");
      renderAnalysisResult(identityResult, analysis, { allowReveal: true });
      saveAnalysisHistory(analysis);
      renderHistory(historyList, historyStatus);
    } catch (error) {
      identityResult.replaceChildren();
      identityInput.setAttribute("aria-invalid", "true");
      statusMessage(identityStatus, error instanceof Error ? error.message : "身分證資料無法分析。", "error");
      identityInput.focus();
    }
  });

  sequenceInput.addEventListener("input", () => {
    sequenceInput.setAttribute("aria-invalid", "false");
    statusMessage(sequenceStatus, "");
  });
  sequenceForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      sequenceResult.replaceChildren();
      statusMessage(sequenceStatus, "");
      sequenceInput.focus();
    }, 0);
  });
  sequenceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const settings = loadNumerologySettings();
      const analysis = analyzeSequenceV2({
        value: sequenceInput.value,
        inputType: activeSequenceType,
        symbolMode: settings.symbolMode,
        ruleSet: resolveSettingsRuleSet(settings),
        ...liveClock(),
      });
      sequenceInput.setAttribute("aria-invalid", "false");
      statusMessage(sequenceStatus, "分析完成；已保存遮罩摘要。", "success");
      renderAnalysisResult(sequenceResult, analysis);
      saveAnalysisHistory(analysis);
      renderHistory(historyList, historyStatus);
    } catch (error) {
      sequenceResult.replaceChildren();
      sequenceInput.setAttribute("aria-invalid", "true");
      statusMessage(sequenceStatus, error instanceof Error ? error.message : "英數序列無法分析。", "error");
      sequenceInput.focus();
    }
  });

  root.querySelector("[data-clear-history]").addEventListener("click", () => {
    if (clearAnalysisHistory()) {
      renderHistory(historyList, historyStatus);
      statusMessage(historyStatus, "本機歷史已清除，無法復原。", "success");
    } else {
      statusMessage(historyStatus, "目前沒有可清除的本機紀錄，或瀏覽器阻擋儲存操作。", "info");
    }
  });

  updateClock();
  refreshSettingsLabels();
  renderHistory(historyList, historyStatus);
  const clockTimer = window.setInterval(updateClock, 30000);
  if (options.initialView && VIEW_META[options.initialView]) showView(options.initialView, false);

  return () => {
    window.clearInterval(clockTimer);
    root.replaceChildren();
    delete root.dataset.workspaceMounted;
  };
}
