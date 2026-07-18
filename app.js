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

export { analyzeBirthday, analyzeDigitCode, calculateIChing } from "./calculator-core.js";

const modeContent = {
  birthday: {
    button: "分析生日數理",
    help: "只需生日，不需姓名、時辰或身分證字號。",
  },
  code: {
    button: "分析數字符碼",
    help: "接受半形／全形數字、空白與連字號；請勿輸入完整身分證、金融帳號等敏感資料。",
  },
  iching: {
    button: "開始三數取卦",
    help: "三個整數各自取卦，不會把生日或一串號碼自動切段。",
  },
};

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function initializeAnalyzer() {
  const form = document.querySelector("#analyzer-form");
  if (!form) return;

  const modeInputs = [...document.querySelectorAll('input[name="analysis-mode"]')];
  const modePanels = [...document.querySelectorAll("[data-mode-panel]")];
  const modeLabels = [...document.querySelectorAll("[data-mode-label]")];
  const birthdayInput = document.querySelector("#birthday-input");
  const codeInput = document.querySelector("#number-code");
  const ichingInputs = [...document.querySelectorAll(".iching-input")];
  const message = document.querySelector("#input-message");
  const help = document.querySelector("#input-help");
  const clearButton = document.querySelector("#clear-button");
  const analyzeButton = document.querySelector("#analyze-button");
  const numerologyResults = document.querySelector("#numerology-results");
  const ichingResults = document.querySelector("#iching-results");
  const resultAnchor = document.querySelector("#result-anchor");
  let mode = "birthday";

  birthdayInput.max = localDateString();
  document.querySelector("#copyright-year").textContent = new Date().getFullYear();

  function currentInputs() {
    if (mode === "birthday") return [birthdayInput];
    if (mode === "code") return [codeInput];
    return ichingInputs;
  }

  function hasCurrentValue() {
    return currentInputs().some((input) => input.value.length > 0);
  }

  function hideResults() {
    numerologyResults.hidden = true;
    ichingResults.hidden = true;
  }

  function setInvalid(invalid) {
    for (const input of currentInputs()) input.setAttribute("aria-invalid", String(invalid));
  }

  function focusResult(selector) {
    window.setTimeout(() => {
      resultAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector(selector)?.focus({ preventScroll: true });
    }, 80);
  }

  function updateClearButton() {
    clearButton.hidden = !hasCurrentValue();
  }

  function changeMode(nextMode) {
    mode = nextMode;
    for (const panel of modePanels) panel.hidden = panel.dataset.modePanel !== mode;
    for (const label of modeLabels) label.classList.toggle("is-active", label.dataset.modeLabel === mode);
    help.textContent = modeContent[mode].help;
    analyzeButton.firstChild.textContent = modeContent[mode].button;
    message.textContent = "";
    setInvalid(false);
    hideResults();
    updateClearButton();
    window.setTimeout(() => currentInputs()[0].focus(), 0);
  }

  function resetCurrent() {
    for (const input of currentInputs()) input.value = "";
    message.textContent = "";
    setInvalid(false);
    hideResults();
    updateClearButton();
    currentInputs()[0].focus();
  }

  function renderMetrics(result) {
    const metrics = result.kind === "birthday"
      ? [
          ["生命路徑數", result.lifePath.display, "月、日、年分段化簡"],
          ["生日數", result.birthday.display, "保留原日期與基底"],
          ["態度數", String(result.attitude.value), "出生月＋出生日"],
          [`${result.personalYear.year} 個人流年`, String(result.personalYear.value), "採 1～12 月曆年制"],
        ]
      : [
          ["數字位數", String(result.length), "只計入實際數字"],
          ["逐位總和", String(result.sum), "尚未收斂的原始總和"],
          ["核心數", String(result.core), "逐位加總至 1～9"],
          ["最常出現", result.strongest.join("、"), result.strongest.length > 1 ? "並列最高次數" : "出現次數最高"],
        ];

    const cards = metrics.map(([label, value, note]) => {
      const card = element("article", "metric-card");
      card.append(element("p", "", label), element("strong", "", value), element("span", "", note));
      return card;
    });
    document.querySelector("#metric-grid").replaceChildren(...cards);
  }

  function renderCalculation(result) {
    const rows = result.calculations.map((calculation) => {
      const row = element("li");
      row.append(element("span", "", calculation.label), element("code", "", calculation.text));
      return row;
    });
    document.querySelector("#calculation-list").replaceChildren(...rows);

    const yearCycle = document.querySelector("#year-cycle");
    if (result.kind === "birthday") {
      const cycles = result.cycles.map((cycle) => {
        const card = element("div", cycle.year === result.personalYear.year ? "is-current" : "");
        card.append(
          element("span", "", String(cycle.year)),
          element("strong", "", String(cycle.value)),
          element("small", "", cycle.year === result.personalYear.year ? "今年" : "流年"),
        );
        return card;
      });
      yearCycle.replaceChildren(...cycles);
      yearCycle.hidden = false;
    } else {
      yearCycle.hidden = true;
      yearCycle.replaceChildren();
    }
  }

  function renderDigitMap(result) {
    document.querySelector("#digit-map-title").textContent = result.kind === "birthday" ? "生日數字九宮分布" : "自訂數字九宮分布";
    document.querySelector("#zero-count").textContent = `0 出現 ${result.zeroCount} 次`;
    const cells = LO_SHU_ORDER.map((digit) => {
      const count = result.counts[digit];
      const cell = element("div", `digit-cell ${count ? "is-present" : "is-missing"}`);
      const bar = element("i");
      bar.style.setProperty("--count", String(Math.min(count, 4)));
      bar.setAttribute("aria-hidden", "true");
      cell.append(element("strong", "", String(digit)), element("span", "", count ? `${count} 次` : "未出現"), bar);
      return cell;
    });
    document.querySelector("#lo-shu-grid").replaceChildren(...cells);
    document.querySelector("#missing-summary").textContent = result.missing.length ? `未出現：${result.missing.join("、")}` : "1～9 都有出現";
  }

  function renderNumerology(result) {
    const profile = profiles[result.profileNumber];
    numerologyResults.style.setProperty("--profile-color", profile.hex);
    document.querySelector("#headline-number").textContent = result.headlineValue;
    document.querySelector("#result-kicker").textContent = result.kind === "birthday" ? "生命路徑基底原型" : "數字符碼核心原型";
    document.querySelector("#result-title").textContent = profile.title;
    document.querySelector("#result-symbol").textContent = `${profile.symbol} · 作為自我提問參考`;
    document.querySelector("#color-name").textContent = profile.color;
    document.querySelector("#color-swatch").style.backgroundColor = profile.hex;
    document.querySelector("#traits-text").textContent = profile.traits;
    document.querySelector("#shadow-text").textContent = profile.shadow;
    document.querySelector("#wellbeing-text").textContent = profile.wellbeing;
    document.querySelector("#marker-text").textContent = `「${profile.marker}」`;
    document.querySelector("#marker-description").textContent = profile.markerDesc;
    document.querySelector("#advice-text").textContent = profile.advice;

    renderMetrics(result);
    renderCalculation(result);
    renderDigitMap(result);

    const masterNote = document.querySelector("#master-note");
    if (result.kind === "birthday" && result.lifePath.isMaster) {
      document.querySelector("#master-title").textContent = `主數 ${result.lifePath.value}／基底 ${result.lifePath.base}`;
      document.querySelector("#master-text").textContent = masterThemes[result.lifePath.value];
      masterNote.hidden = false;
    } else {
      masterNote.hidden = true;
    }

    ichingResults.hidden = true;
    numerologyResults.hidden = false;
    focusResult("#result-title");
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
      row.append(element("span", "line-name", lineNames[index]), yao, element("strong", "", index === movingIndex ? mark : ""));
      container.append(row);
    }
    return container;
  }

  function createHexagramCard(label, value, movingIndex = -1, mark = "") {
    const card = element("article", "hexagram-card");
    const head = element("div", "hexagram-card-head");
    const text = element("div");
    const title = element("h3");
    title.append(element("span", "", String(value.hexId)), document.createTextNode(value.name));
    text.append(element("p", "", label), title);
    const pair = element("div", "trigram-pair");
    pair.setAttribute("aria-label", `上${value.upper.name}下${value.lower.name}`);
    pair.append(element("span", "", value.upper.symbol), element("span", "", value.lower.symbol));
    head.append(text, pair);
    card.append(
      head,
      element("p", "hexagram-meta", `上${value.upper.name}（${value.upper.nature}）・下${value.lower.name}（${value.lower.nature}）`),
      createHexagramLines(value.lines, movingIndex, mark),
    );
    return card;
  }

  function renderIChing(result) {
    document.querySelector("#moving-summary").textContent = `動爻為 ${result.moving.name}，${result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。`;
    document.querySelector("#hexagram-grid").replaceChildren(
      createHexagramCard("本卦", result.original, result.moving.index, "動"),
      createHexagramCard("互卦", result.mutual),
      createHexagramCard("變卦", result.transformed, result.moving.index, "變"),
    );

    const traces = [
      ["第一數取上卦", `${result.inputs[0]} ÷ 8 → 餘 ${result.remainders[0]}（${result.original.upper.name}）`],
      ["第二數取下卦", `${result.inputs[1]} ÷ 8 → 餘 ${result.remainders[1]}（${result.original.lower.name}）`],
      ["第三數取動爻", `${result.inputs[2]} ÷ 6 → 餘 ${result.remainders[2]}（${result.moving.name}）`],
    ].map(([label, value]) => {
      const trace = element("div");
      trace.append(element("span", "", label), element("strong", "", value));
      return trace;
    });
    document.querySelector("#iching-trace").replaceChildren(...traces);
    numerologyResults.hidden = true;
    ichingResults.hidden = false;
    focusResult("#iching-result-title");
  }

  for (const modeInput of modeInputs) {
    modeInput.addEventListener("change", () => changeMode(modeInput.value));
  }
  for (const input of [birthdayInput, codeInput, ...ichingInputs]) {
    input.addEventListener("input", () => {
      message.textContent = "";
      input.setAttribute("aria-invalid", "false");
      updateClearButton();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const result = mode === "birthday"
        ? analyzeBirthday(birthdayInput.value, new Date().getFullYear(), localDateString())
        : mode === "code"
          ? analyzeDigitCode(codeInput.value)
          : calculateIChing(ichingInputs.map((input) => input.value));
      message.textContent = "";
      setInvalid(false);
      if (result.kind === "iching") renderIChing(result);
      else renderNumerology(result);
    } catch (error) {
      hideResults();
      message.textContent = error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。";
      setInvalid(true);
      currentInputs()[0].focus();
    }
  });

  clearButton.addEventListener("click", resetCurrent);
  for (const button of document.querySelectorAll(".reset-button")) button.addEventListener("click", resetCurrent);
  updateClearButton();
}

if (typeof document !== "undefined") initializeAnalyzer();
