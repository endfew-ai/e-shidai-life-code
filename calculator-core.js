import {
  DEFAULT_RULE_SET,
  LEGACY_RULE_SET,
  analyzeBirthGrid,
  calculateBirthdayNumber,
  calculateLifePath,
  calculatePersonalYear,
  parseBirthday,
  resolveRuleSet,
} from "./domain/numerology/index.js";

export const profiles = {
  1: {
    title: "領導與獨立",
    symbol: "陽性力量之源 · 開創與自主",
    traits: "具備強烈的開創力與帶動力，重視自主與決策空間。當目標明確時，往往能率先行動並帶領他人前進。",
    shadow: "壓力下容易固守自己的判斷，把不同意見解讀成阻礙。若能先聽完再決定，會更容易保有影響力與人際連結。",
    wellbeing: "緊繃時可先照顧規律進食、休息與放鬆，並觀察哪些安排能幫助自己恢復。持續不適仍應交由合格醫療專業評估。",
    color: "赤紅", hex: "#ef5350", marker: "先照我的方法做",
    markerDesc: "以快速決策維持掌控感，也可能讓別人來不及表達。",
    advice: "把接納建議視為擴充選項，而不是失去主導權。先定方向，再邀請一個不同觀點，決策會更完整。",
  },
  2: {
    title: "配合與連結", symbol: "共生之力 · 關聯與協調",
    traits: "擅長察言觀色、協調關係與照顧氣氛。對合作品質敏感，常能看見別人的需要與未說出口的訊息。",
    shadow: "為了維持和諧，可能壓下真實感受或過度迎合。長期下來容易累積委屈，也讓他人難以理解你的界線。",
    wellbeing: "情緒壓力增加時，可練習深呼吸、散步與說出需要，並觀察哪些方式最適合自己。持續不適請尋求專業協助。",
    color: "暖橙", hex: "#ff8a3d", marker: "好，都聽你的",
    markerDesc: "用配合換取安全感，有時會把自己的意見藏起來。",
    advice: "先從低風險的小事表達偏好，例如「我比較希望……」。溫和但清楚的界線，反而能讓關係更穩定。",
  },
  3: {
    title: "創意與表達", symbol: "赤子之心 · 靈感與感性",
    traits: "感受力與創意豐富，擅長把抽象想法轉成有感染力的表達。安全自在時，幽默、直接且充滿活力。",
    shadow: "遇到批評時可能迅速防禦、轉移話題或封閉自己。情緒來得快，也容易讓原本有價值的回饋被擋在門外。",
    wellbeing: "用腦過度或情緒起伏大時，可先補充休息、飲水並暫離螢幕。持續疼痛或不適請諮詢醫療專業。",
    color: "明黃", hex: "#f5c451", marker: "我知道",
    markerDesc: "快速結束回饋，保護內在敏感與自尊。",
    advice: "先把回饋記下來，不急著同意或反駁。隔一段時間再挑出一個可試驗的部分，創意會更容易落地。",
  },
  4: {
    title: "穩定與秩序", symbol: "四方成形 · 結構與安全",
    traits: "重視可驗證的經驗、流程與穩定性，擅長整理資源、建立秩序並守住品質，是值得信賴的執行者。",
    shadow: "面對未知變動時容易過度評估風險，甚至因害怕重來而停在原地。太早否定改變，可能錯過更好的做法。",
    wellbeing: "高警覺時可建立固定的休息與睡前流程，觀察是否有助放鬆。若長期失眠或不適，請尋求專業協助。",
    color: "青綠", hex: "#48c78e", marker: "真的要做嗎？",
    markerDesc: "透過反覆確認延緩不可控的變動。",
    advice: "把改變切成可回復的小步驟，先試一次、保留退路再評估。可控的實驗，比一次全面改動更適合你。",
  },
  5: {
    title: "自由與溝通", symbol: "流動之口 · 冒險與多樣",
    traits: "喜歡自由、多樣與新鮮感，對人事物反應快，通常具備良好口才與說服力，能為環境帶來動能。",
    shadow: "害怕承諾縮小可能性，容易延後決定或保留過多退路。當選項太多時，反而可能焦慮與分心。",
    wellbeing: "忙碌時可安排短暫停頓、補水與安靜時間，觀察是否有助恢復。反覆不適請諮詢合格醫療專業。",
    color: "澄藍", hex: "#4f9cf9", marker: "再看看吧",
    markerDesc: "保留彈性與撤退空間，避免太快被承諾綁住。",
    advice: "給選擇加上期限，只承諾下一個具體步驟。自由不必等於無限延後，清楚的邊界也能保留彈性。",
  },
  6: {
    title: "奉獻與關懷", symbol: "療癒之心 · 照顧與責任",
    traits: "同理心強，願意照顧他人並承擔責任。常是團隊中的穩定力量，能讓人感受到支持與被理解。",
    shadow: "容易把別人的問題變成自己的責任，也可能因難以拒絕而過度消耗。照顧若沒有界線，會逐漸變成負擔。",
    wellbeing: "承擔過多時，可安排伸展、休息與獨處時間，留意自己是否也被照顧。持續不適請尋求醫療協助。",
    color: "靛青", hex: "#7477e8", marker: "沒關係，我來就好",
    markerDesc: "以代勞確認自己的價值，也可能讓責任分配失衡。",
    advice: "在答應前先停十秒，確認「這真的是我的責任嗎？」。適度拒絕不是冷漠，而是讓關懷得以長久。",
  },
  7: {
    title: "分析與洞察", symbol: "探究之眼 · 邏輯與直覺",
    traits: "分析力強、對細節與資料敏感，喜歡追根究柢。能從線索中發現規律，也常有精準的直覺判斷。",
    shadow: "過度懷疑時容易反覆查證、難以信任，最後因想得太多而延遲行動。完美資訊往往不存在。",
    wellbeing: "思緒停不下來時，可透過規律運動與書寫讓注意力回到當下。若焦慮影響生活，請尋求專業協助。",
    color: "暮紫", hex: "#a675e5", marker: "真的嗎？",
    markerDesc: "以質疑確認可靠性，也可能讓交流變成持續考驗。",
    advice: "先定義「足夠的證據」與決策期限。把小型行動當成新的資料來源，能讓分析與實踐形成循環。",
  },
  8: {
    title: "權能與實踐", symbol: "資源之輪 · 成果與影響",
    traits: "對數字、資源與成果敏銳，具備強烈執行力與商業判斷。能把抽象目標轉成可衡量的進度。",
    shadow: "壓力下容易用投入產出衡量所有關係，讓人感到距離或功利。只看效率時，可能忽略長期信任。",
    wellbeing: "長期高速運轉時，可主動安排休息並留意身心壓力訊號。任何持續或急性不適都應由醫療專業評估。",
    color: "玫紅", hex: "#e85b9c", marker: "這能帶來什麼成果？",
    markerDesc: "以效益過濾資訊，快速保護時間與資源。",
    advice: "在成果指標之外，加上一項關係或永續指標。真正穩固的影響力，來自效率與信任同時累積。",
  },
  9: {
    title: "理想與服務", symbol: "遠方之光 · 願景與共好",
    traits: "視野宏觀、富使命感，容易看見更大的可能性。願意服務群體，也能以願景鼓舞身邊的人。",
    shadow: "理想過大時，可能低估執行細節或先答應再評估。若願景沒有下一步，就容易停留在想像。",
    wellbeing: "投入理想時也要保留規律飲食、睡眠與休息。身體狀況若有異常，請以合格醫療專業意見為準。",
    color: "鎏金", hex: "#e6b74e", marker: "沒問題",
    markerDesc: "先用承諾回應期待，之後才處理可行性。",
    advice: "把願景縮成七天內能完成的一件事，並寫下負責人與期限。每一個落地步驟，都在替理想增加可信度。",
  },
};

export const masterThemes = {
  11: "主數 11 以 2 的連結與協調為基底，傳統數字命理常把它視為直覺、感受與啟發主題的放大；日常解讀仍應同時回到 2。",
  22: "主數 22 以 4 的結構與穩定為基底，傳統數字命理常把它視為把大型構想落地的放大主題；日常解讀仍應同時回到 4。",
  33: "主數 33 以 6 的關懷與責任為基底，傳統數字命理常把它視為服務、教導與支持主題的放大；日常解讀仍應同時回到 6。",
};

export const CHEIRO_COLOR_SOURCE = Object.freeze({
  id: "cheiro-book-of-numbers-colours-v1",
  author: "Cheiro",
  title: "Cheiro's Book of Numbers",
  chapters: "第 23 章與第 27 章",
  scope: "出生日數 1 到 9 的歷史色彩對照",
  catalogUrl: "https://books.google.com/books?id=I-IOAAAAQAAJ",
  ruleUrl: "https://archive.org/details/in.ernet.dli.2015.70770/page/n125/mode/2up",
  paletteUrl: "https://archive.org/details/in.ernet.dli.2015.70770/page/n137/mode/2up",
  notice: "原書提供色名及穿戴、房間使用方向，沒有現代 HEX；本站色碼、具體搭配與數位用途均為現代延伸。",
});

export const CHEIRO_BIRTH_COLOR_PALETTES = Object.freeze({
  1: {
    number: 1,
    sourceFamilies: ["棕色", "黃色", "金色"],
    avoidNote: "原書未另列較少使用色。",
    swatches: [
      { role: "primary", name: "古金", hex: "#C6A15B", sourceRelation: "原書色群" },
      { role: "support", name: "暖黃", hex: "#E3BC59", sourceRelation: "原書色群" },
      { role: "accent", name: "金棕", hex: "#8A633B", sourceRelation: "原書色群" },
    ],
    uses: {
      wear: "以棕色為底，古金或暖黃用於配件。",
      space: "木質金棕作底，古金小面積點亮。",
      digital: "古金作重點，暖黃作提示。",
    },
  },
  2: {
    number: 2,
    sourceFamilies: ["綠色", "乳白", "白色"],
    avoidNote: "原書建議較少使用厚重暗色，尤其黑、紫與暗紅。",
    swatches: [
      { role: "primary", name: "森綠", hex: "#3F7255", sourceRelation: "原書色群" },
      { role: "support", name: "奶油白", hex: "#EFE1BE", sourceRelation: "原書色群" },
      { role: "accent", name: "月白", hex: "#F5F3EA", sourceRelation: "原書色群" },
    ],
    uses: {
      wear: "綠色搭配奶油白，可先從上衣或配件試用。",
      space: "白色為底，以綠色用品或植栽點綴。",
      digital: "森綠作重點，奶油白作柔和區塊。",
    },
  },
  3: {
    number: 3,
    sourceFamilies: ["淡紫紅", "紫羅蘭", "丁香紫"],
    avoidNote: "原書未另列較少使用色。",
    swatches: [
      { role: "primary", name: "木槿紫", hex: "#A46A96", sourceRelation: "原書色群" },
      { role: "support", name: "紫羅蘭", hex: "#7954A5", sourceRelation: "原書色群" },
      { role: "accent", name: "淡丁香", hex: "#C7ADD8", sourceRelation: "原書色群" },
    ],
    uses: {
      wear: "木槿紫作主體，淡丁香適合內搭或配件。",
      space: "以淡紫織品或桌面用品局部呈現。",
      digital: "紫羅蘭作互動重點，丁香紫作柔和區塊。",
    },
  },
  4: {
    number: 4,
    sourceFamilies: ["藍色", "灰色", "電光藍", "半色調"],
    avoidNote: "原書建議較少使用強烈、高彩度的純色。",
    swatches: [
      { role: "primary", name: "電光藍", hex: "#397BD7", sourceRelation: "原書色群" },
      { role: "support", name: "霧灰", hex: "#8B929C", sourceRelation: "原書色群" },
      { role: "accent", name: "半調灰藍", hex: "#7389A3", sourceRelation: "原書語意轉譯" },
    ],
    uses: {
      wear: "灰色為底，以電光藍作小面積焦點。",
      space: "灰藍低彩度搭配，避免整面高飽和色。",
      digital: "電光藍作操作重點，灰色維持資訊層級。",
    },
  },
  5: {
    number: 5,
    sourceFamilies: ["各種淺色", "淺灰", "白色與亮澤材質"],
    avoidNote: "原書建議較少使用深色。",
    swatches: [
      { role: "primary", name: "亮銀灰", hex: "#CBD0D6", sourceRelation: "原書色群" },
      { role: "support", name: "珠光白", hex: "#F2F1EC", sourceRelation: "原書色群" },
      { role: "accent", name: "冰霧藍", hex: "#D9EAF0", sourceRelation: "網站淺色轉譯" },
    ],
    uses: {
      wear: "淺灰白搭配微光材質，維持明亮感。",
      space: "採低彩度淺色，讓材質與光線成為重點。",
      digital: "珠光白作表面，冰霧藍作提示區。",
    },
  },
  6: {
    number: 6,
    sourceFamilies: ["淺藍至海軍藍", "玫瑰色", "粉紅色"],
    avoidNote: "原書一般建議少用紅、猩紅與緋紅，但另列出生時段例外。",
    swatches: [
      { role: "primary", name: "皇家藍", hex: "#2F5FA7", sourceRelation: "原書主色群" },
      { role: "support", name: "海軍藍", hex: "#1E3559", sourceRelation: "原書主色群" },
      { role: "accent", name: "玫瑰粉", hex: "#D88C9B", sourceRelation: "原書次色群" },
    ],
    uses: {
      wear: "藍色作主體，玫瑰粉用於配件或局部。",
      space: "深淺藍為底，以粉紅小物點綴。",
      digital: "藍色作主色，玫瑰粉只作小面積焦點。",
    },
  },
  7: {
    number: 7,
    sourceFamilies: ["淡綠", "白色", "淡黃與金色"],
    avoidNote: "原書表示最淡的粉彩色最適合。",
    swatches: [
      { role: "primary", name: "粉彩綠", hex: "#C6D8B4", sourceRelation: "原書色群" },
      { role: "support", name: "象牙白", hex: "#F3EFDF", sourceRelation: "原書色群" },
      { role: "accent", name: "淡金黃", hex: "#E5CE83", sourceRelation: "原書色群" },
    ],
    uses: {
      wear: "以極淡綠白為主，淡金用於配件。",
      space: "象牙白為底，粉彩綠與淡金局部搭配。",
      digital: "淡綠作資訊區，淡金作細節焦點。",
    },
  },
  8: {
    number: 8,
    sourceFamilies: ["深灰", "深藍", "紫色與黑色"],
    avoidNote: "原書建議較少使用明亮、花俏的顏色。",
    swatches: [
      { role: "primary", name: "炭灰", hex: "#41454D", sourceRelation: "原書色群" },
      { role: "support", name: "深靛藍", hex: "#243A5A", sourceRelation: "原書色群" },
      { role: "accent", name: "墨紫", hex: "#4C365A", sourceRelation: "原書色群" },
    ],
    uses: {
      wear: "炭灰與深藍為主，墨紫適合配件。",
      space: "用深灰藍作局部基底，保留足夠照明。",
      digital: "深藍作背景，炭灰作表面，墨紫作圖表。",
    },
  },
  9: {
    number: 9,
    sourceFamilies: ["紅色", "玫瑰紅", "緋紅", "粉紅", "紅紫"],
    avoidNote: "原書未另列較少使用色，並偏好較深、濃郁色調。",
    swatches: [
      { role: "primary", name: "緋紅", hex: "#B0263E", sourceRelation: "原書色群" },
      { role: "support", name: "深玫瑰", hex: "#8D3851", sourceRelation: "原書色群" },
      { role: "accent", name: "紅紫", hex: "#732B57", sourceRelation: "原書色群" },
    ],
    uses: {
      wear: "深紅作主體，玫瑰或紅紫用於配件。",
      space: "以深紅作小面積焦點，避免壓過其他物件。",
      digital: "紅紫可作品牌焦點，錯誤狀態仍依介面語意設計。",
    },
  },
});

export const LO_SHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];
export const MASTER_NUMBERS = [11, 22, 33];
const MASTER_SET = new Set(MASTER_NUMBERS);

export function reductionTrace(initialValue, preserveMaster = false) {
  if (!Number.isSafeInteger(initialValue) || initialValue < 0) {
    throw new RangeError("化簡值必須是非負安全整數");
  }

  let value = initialValue;
  const steps = [value];
  const equations = [];
  while (value > 9 && !(preserveMaster && MASTER_SET.has(value))) {
    const digits = String(value).split("").map(Number);
    const next = digits.reduce((sum, digit) => sum + digit, 0);
    equations.push(`${digits.join(" + ")} = ${next}`);
    value = next;
    steps.push(value);
  }

  return {
    initial: initialValue,
    value,
    steps,
    equations,
    text: equations.length ? `${initialValue} → ${equations.join(" → ")}` : String(initialValue),
  };
}

export function reduceNumber(initialValue, preserveMaster = false) {
  return reductionTrace(initialValue, preserveMaster).value;
}

export function formatCoreNumber(value) {
  return MASTER_SET.has(value) ? `${value}／${reduceNumber(value, false)}` : String(value);
}

export function getCheiroColorGuide(day) {
  if (!Number.isSafeInteger(day) || day < 1 || day > 31) {
    throw new RangeError("出生日必須是 1 到 31 的整數");
  }
  const trace = reductionTrace(day, false);
  return {
    methodVersion: "cheiro-birth-number-v1",
    originalDay: day,
    number: trace.value,
    display: trace.text,
    trace,
    palette: CHEIRO_BIRTH_COLOR_PALETTES[trace.value],
  };
}

export function buildBirthdayColorGuide({ day, lifePathValue, attitudeValue }) {
  for (const [label, value] of [["生命路徑值", lifePathValue], ["態度數", attitudeValue]]) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(`${label}必須是正安全整數`);
    }
  }
  const traditional = getCheiroColorGuide(day);
  const inputs = [
    {
      role: "birth-day",
      label: "生日數主色",
      badge: "原書對照",
      inputValue: day,
      mappedNumber: traditional.number,
      calculation: `生日 ${traditional.trace.text}`,
      authority: "cheiro-source",
      selectedSwatchIndex: 0,
    },
    {
      role: "life-path",
      label: "生命路徑延伸色",
      badge: "本站延伸",
      inputValue: lifePathValue,
      mappedNumber: reduceNumber(lifePathValue, false),
      calculation: `生命路徑 ${reductionTrace(lifePathValue, false).text}`,
      authority: "site-extension",
      selectedSwatchIndex: 1,
    },
    {
      role: "attitude",
      label: "態度數搭配色",
      badge: "本站延伸",
      inputValue: attitudeValue,
      mappedNumber: reduceNumber(attitudeValue, false),
      calculation: `態度數 ${reductionTrace(attitudeValue, false).text}`,
      authority: "site-extension",
      selectedSwatchIndex: 2,
    },
  ];

  const composition = inputs.map((assignment) => ({
    ...assignment,
    swatch: CHEIRO_BIRTH_COLOR_PALETTES[assignment.mappedNumber].swatches[assignment.selectedSwatchIndex],
  }));

  return {
    methodVersion: "cheiro-birth-colors-v1",
    source: CHEIRO_COLOR_SOURCE,
    traditional,
    composition,
    disclaimer: "這是歷史數字命理的文化對應與本站配色延伸，不是科學評估，也不代表顏色能帶來特定結果。",
  };
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateBirthday(dateValue, todayValue = localDateString()) {
  const parsed = parseBirthday(dateValue, todayValue);
  return { year: parsed.year, month: parsed.month, day: parsed.day, date: parsed.normalized };
}

export function countDigits(digits) {
  const counts = Object.fromEntries(Array.from({ length: 10 }, (_, digit) => [digit, 0]));
  for (const rawDigit of digits) {
    const digit = Number(rawDigit);
    if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
      throw new RangeError("數字統計只接受 0 到 9 的單一數字。");
    }
    counts[digit] += 1;
  }
  return counts;
}

function joinedReduction(prefix, initial, preserveMaster) {
  const trace = reductionTrace(initial, preserveMaster);
  return trace.equations.length ? `${prefix} = ${initial} → ${trace.equations.join(" → ")}` : `${prefix} = ${initial}`;
}

export function analyzeBirthday(dateValue, currentYear = new Date().getFullYear(), todayValue = localDateString(), options = {}) {
  const { year, month, day, date } = validateBirthday(dateValue, todayValue);
  if (!Number.isInteger(currentYear) || currentYear < 1 || currentYear > 9999) {
    throw new Error("流年年份必須是有效西元年。");
  }
  const ruleSet = resolveRuleSet(options.ruleSet ?? options.ruleSetId ?? DEFAULT_RULE_SET.id, options.ruleOverrides);
  const lifeResult = calculateLifePath(date, { ruleSet, todayValue });
  const birthdayResult = calculateBirthdayNumber(date, { ruleSet, todayValue });
  const lifeBase = lifeResult.baseNumber;
  const birthdayBase = birthdayResult.baseNumber;
  const attitudeInitial = month + day;
  const attitude = reductionTrace(attitudeInitial, false);
  const colorGuide = buildBirthdayColorGuide({ day, lifePathValue: lifeResult.lifePathNumber, attitudeValue: attitude.value });

  const personalYearFor = (targetYear) => {
    const result = calculatePersonalYear(date, targetYear, { todayValue });
    return {
      year: result.year,
      value: result.personalYearNumber,
      trace: reductionTrace(result.initial, false),
      initial: result.initial,
      calculationText: result.calculationText,
      ruleProfile: result.ruleProfile,
    };
  };
  const personalYear = personalYearFor(currentYear);
  const cycles = [currentYear - 1, currentYear, currentYear + 1].map(personalYearFor);
  const digits = date.replace(/\D/g, "").split("").map(Number);
  const counts = countDigits(digits);
  const birthGrid = analyzeBirthGrid(date, { ruleSet, todayValue, lifePathResult: lifeResult });
  const headlineValue = lifeResult.isMaster
    ? `${lifeResult.lifePathNumber}／${lifeResult.baseNumber}`
    : String(lifeResult.lifePathNumber);
  const birthdayDisplay = birthdayResult.isMaster
    ? (day === birthdayResult.birthdayNumber
      ? `${birthdayResult.birthdayNumber}／${birthdayResult.baseNumber}`
      : `${day} → ${birthdayResult.birthdayNumber}／${birthdayResult.baseNumber}`)
    : (day === birthdayResult.birthdayNumber ? String(day) : `${day} → ${birthdayResult.birthdayNumber}`);

  return {
    kind: "birthday",
    date,
    parts: { year, month, day },
    profileNumber: lifeBase,
    headlineValue,
    ruleSet,
    ruleProfile: lifeResult.ruleProfile,
    originalDigits: lifeResult.originalDigits,
    firstSum: lifeResult.firstSum,
    reductionSteps: lifeResult.reductionSteps,
    lifePath: {
      value: lifeResult.lifePathNumber,
      base: lifeBase,
      display: headlineValue,
      isMaster: lifeResult.isMaster,
      originalDigits: lifeResult.originalDigits,
      firstSum: lifeResult.firstSum,
      reductionSteps: lifeResult.reductionSteps,
      calculationText: lifeResult.calculationText,
      ruleProfile: lifeResult.ruleProfile,
    },
    birthday: {
      original: day,
      core: birthdayResult.birthdayNumber,
      base: birthdayBase,
      display: birthdayDisplay,
      calculationText: birthdayResult.calculationText,
      reductionSteps: birthdayResult.reductionSteps,
      ruleProfile: birthdayResult.ruleProfile,
    },
    colorGuide,
    attitude: { value: attitude.value },
    personalYear,
    cycles,
    counts,
    zeroCount: counts[0],
    missing: birthGrid.missingNumbers,
    birthGrid,
    calculations: [
      { label: "生日原始數字", text: lifeResult.originalDigits.join("、") },
      { label: "第一次加總", text: String(lifeResult.firstSum) },
      { label: "生命靈數", text: lifeResult.calculationText },
      { label: "生日數", text: birthdayResult.calculationText },
      { label: "態度數", text: joinedReduction(`${month} + ${day}`, attitudeInitial, false) },
      {
        label: `${currentYear} 個人流年`,
        text: personalYear.calculationText,
      },
    ],
  };
}

export function analyzeBirthdayLegacy(dateValue, currentYear = new Date().getFullYear(), todayValue = localDateString()) {
  return analyzeBirthday(dateValue, currentYear, todayValue, { ruleSet: LEGACY_RULE_SET });
}

function normalizeFullWidthDigits(value) {
  return value.replace(/[０-９]/g, (character) => String(character.charCodeAt(0) - 0xff10));
}

export function analyzeDigitCode(rawValue) {
  const normalized = normalizeFullWidthDigits(String(rawValue).trim());
  if (!normalized) throw new Error("請輸入至少一個數字。");
  if (!/^[0-9\s\-]+$/.test(normalized)) {
    throw new Error("僅接受 0 到 9、全形數字、空白與半形連字號。");
  }

  const digits = normalized.match(/\d/g)?.map(Number) ?? [];
  if (digits.length === 0) throw new Error("請輸入至少一個數字。");
  if (digits.length > 40) throw new Error("最多可分析 40 位數字。");
  const sum = digits.reduce((total, digit) => total + digit, 0);
  if (sum === 0) throw new Error("數字總和為 0，無法收斂成 1～9 的核心數。");

  const reduction = reductionTrace(sum, false);
  const counts = countDigits(digits);
  const nonZeroCounts = Array.from({ length: 9 }, (_, index) => ({ digit: index + 1, count: counts[index + 1] }));
  const maxCount = Math.max(...nonZeroCounts.map(({ count }) => count));
  const strongest = nonZeroCounts.filter(({ count }) => count === maxCount && count > 0).map(({ digit }) => digit);
  const missing = nonZeroCounts.filter(({ count }) => count === 0).map(({ digit }) => digit);
  const digitEquation = `${digits.join(" + ")} = ${sum}`;

  return {
    kind: "code",
    digits,
    length: digits.length,
    sum,
    core: reduction.value,
    profileNumber: reduction.value,
    headlineValue: String(reduction.value),
    counts,
    zeroCount: counts[0],
    strongest,
    missing,
    calculations: [
      { label: "逐位加總", text: digitEquation },
      {
        label: "收斂核心",
        text: reduction.equations.length ? `${sum} → ${reduction.equations.join(" → ")}` : String(sum),
      },
    ],
  };
}

export const trigrams = {
  1: { id: 1, name: "乾", nature: "天", symbol: "☰", lines: [1, 1, 1] },
  2: { id: 2, name: "兌", nature: "澤", symbol: "☱", lines: [1, 1, 0] },
  3: { id: 3, name: "離", nature: "火", symbol: "☲", lines: [1, 0, 1] },
  4: { id: 4, name: "震", nature: "雷", symbol: "☳", lines: [1, 0, 0] },
  5: { id: 5, name: "巽", nature: "風", symbol: "☴", lines: [0, 1, 1] },
  6: { id: 6, name: "坎", nature: "水", symbol: "☵", lines: [0, 1, 0] },
  7: { id: 7, name: "艮", nature: "山", symbol: "☶", lines: [0, 0, 1] },
  8: { id: 8, name: "坤", nature: "地", symbol: "☷", lines: [0, 0, 0] },
};

export const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

const LINES_TO_TRIGRAM = new Map(Object.values(trigrams).map((trigram) => [trigram.lines.join(","), trigram.id]));

export const hexagramTable = [
  [1, 1, 1, "乾為天"], [1, 2, 10, "天澤履"], [1, 3, 13, "天火同人"], [1, 4, 25, "天雷無妄"], [1, 5, 44, "天風姤"], [1, 6, 6, "天水訟"], [1, 7, 33, "天山遯"], [1, 8, 12, "天地否"],
  [2, 1, 43, "澤天夬"], [2, 2, 58, "兌為澤"], [2, 3, 49, "澤火革"], [2, 4, 17, "澤雷隨"], [2, 5, 28, "澤風大過"], [2, 6, 47, "澤水困"], [2, 7, 31, "澤山咸"], [2, 8, 45, "澤地萃"],
  [3, 1, 14, "火天大有"], [3, 2, 38, "火澤睽"], [3, 3, 30, "離為火"], [3, 4, 21, "火雷噬嗑"], [3, 5, 50, "火風鼎"], [3, 6, 64, "火水未濟"], [3, 7, 56, "火山旅"], [3, 8, 35, "火地晉"],
  [4, 1, 34, "雷天大壯"], [4, 2, 54, "雷澤歸妹"], [4, 3, 55, "雷火豐"], [4, 4, 51, "震為雷"], [4, 5, 32, "雷風恆"], [4, 6, 40, "雷水解"], [4, 7, 62, "雷山小過"], [4, 8, 16, "雷地豫"],
  [5, 1, 9, "風天小畜"], [5, 2, 61, "風澤中孚"], [5, 3, 37, "風火家人"], [5, 4, 42, "風雷益"], [5, 5, 57, "巽為風"], [5, 6, 59, "風水渙"], [5, 7, 53, "風山漸"], [5, 8, 20, "風地觀"],
  [6, 1, 5, "水天需"], [6, 2, 60, "水澤節"], [6, 3, 63, "水火既濟"], [6, 4, 3, "水雷屯"], [6, 5, 48, "水風井"], [6, 6, 29, "坎為水"], [6, 7, 39, "水山蹇"], [6, 8, 8, "水地比"],
  [7, 1, 26, "山天大畜"], [7, 2, 41, "山澤損"], [7, 3, 22, "山火賁"], [7, 4, 27, "山雷頤"], [7, 5, 18, "山風蠱"], [7, 6, 4, "山水蒙"], [7, 7, 52, "艮為山"], [7, 8, 23, "山地剝"],
  [8, 1, 11, "地天泰"], [8, 2, 19, "地澤臨"], [8, 3, 36, "地火明夷"], [8, 4, 24, "地雷復"], [8, 5, 46, "地風升"], [8, 6, 7, "地水師"], [8, 7, 15, "地山謙"], [8, 8, 2, "坤為地"],
];

const HEXAGRAM_MAP = new Map(hexagramTable.map(([upperId, lowerId, hexId, name]) => [
  `${upperId}-${lowerId}`,
  { upperId, lowerId, hexId, name },
]));

export function normalizedRemainder(value, divisor) {
  if (typeof value !== "bigint") throw new TypeError("value 必須是 BigInt");
  if (!Number.isInteger(divisor) || divisor <= 0) throw new RangeError("divisor 必須是正整數");
  const bigDivisor = BigInt(divisor);
  const remainder = ((value % bigDivisor) + bigDivisor) % bigDivisor;
  return remainder === 0n ? divisor : Number(remainder);
}

function resolveHexagram(lines) {
  const lowerId = LINES_TO_TRIGRAM.get(lines.slice(0, 3).join(","));
  const upperId = LINES_TO_TRIGRAM.get(lines.slice(3, 6).join(","));
  const info = HEXAGRAM_MAP.get(`${upperId}-${lowerId}`);
  if (!info) throw new Error("卦象資料不完整");
  return {
    ...info,
    lines: [...lines],
    upper: trigrams[upperId],
    lower: trigrams[lowerId],
  };
}

export function calculateIChing(rawValues) {
  if (!Array.isArray(rawValues) || rawValues.length !== 3) throw new Error("請完整輸入三個整數。");
  const inputs = rawValues.map((rawValue) => {
    const value = String(rawValue).trim();
    if (!/^[+-]?\d+$/.test(value)) throw new Error("三個欄位都必須是完整整數，不可輸入小數或文字。");
    return BigInt(value).toString();
  });

  const values = inputs.map((value) => BigInt(value));
  const upperRemainder = normalizedRemainder(values[0], 8);
  const lowerRemainder = normalizedRemainder(values[1], 8);
  const movingRemainder = normalizedRemainder(values[2], 6);
  const upper = trigrams[upperRemainder];
  const lower = trigrams[lowerRemainder];
  const originalLines = [...lower.lines, ...upper.lines];
  const original = resolveHexagram(originalLines);
  const mutual = resolveHexagram([...originalLines.slice(1, 4), ...originalLines.slice(2, 5)]);
  const movingIndex = movingRemainder - 1;
  const transformedLines = [...originalLines];
  transformedLines[movingIndex] = transformedLines[movingIndex] === 1 ? 0 : 1;
  const transformed = resolveHexagram(transformedLines);

  return {
    kind: "iching",
    inputs,
    remainders: [upperRemainder, lowerRemainder, movingRemainder],
    original,
    mutual,
    transformed,
    moving: {
      index: movingIndex,
      name: lineNames[movingIndex],
      oldValue: originalLines[movingIndex],
      newValue: transformedLines[movingIndex],
    },
  };
}
