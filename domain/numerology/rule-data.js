export const SOURCE_TYPES = Object.freeze({
  uploadedMaterial: "uploaded_material",
  legacyProject: "legacy_project",
  commonPractice: "common_practice",
  unresolved: "unresolved",
  official: "official",
});

export const RULE_SOURCE_PROFILES = Object.freeze({
  uploadedNumerologyV2: Object.freeze({
    id: "uploaded-numerology-v2",
    sourceType: SOURCE_TYPES.uploadedMaterial,
    title: "使用者提供的生命靈數與數字磁場規格",
    certainty: "folklore",
    note: "近代民俗教材規則；原始作者與古籍來源未獲確認。",
  }),
  legacyProjectV1: Object.freeze({
    id: "legacy-project-v1",
    sourceType: SOURCE_TYPES.legacyProject,
    title: "e世代生命密碼既有演算法",
    certainty: "legacy",
    note: "用於回歸與相容；不代表唯一或較權威的生命靈數流派。",
  }),
  taiwanNationalIdOfficial: Object.freeze({
    id: "taiwan-national-id-official",
    sourceType: SOURCE_TYPES.official,
    title: "國民身分證統一編號格式與邏輯檢查",
    certainty: "official",
    note: "只涵蓋格式與檢查碼；不包含任何民俗磁場解讀。",
    urls: Object.freeze([
      "https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg011228/ch04/type2/gov30/num2/OEg.pdf",
      "https://schema.gov.tw/lists/167",
    ]),
  }),
  timelineCommonPractice: Object.freeze({
    id: "timeline-common-practice-v1",
    sourceType: SOURCE_TYPES.commonPractice,
    title: "身分證流年近代流傳版本",
    certainty: "folklore",
    note: "區間版本彼此不一致，必須由規則設定明確選擇。",
  }),
  unresolvedDestinyNumber: Object.freeze({
    id: "destiny-number-unresolved",
    sourceType: SOURCE_TYPES.unresolved,
    title: "命格數公式尚未確認",
    certainty: "unresolved",
    note: "現有專案與教材不足以證明命格數公式，因此不自動計算。",
  }),
});

export const FOLKLORE_HEALTH_DISCLAIMER =
  "此為原教材中的民俗對應，無醫學診斷效力；身體不適應諮詢合格醫療專業人員。";

export const PERSONALITY_PROFILES = Object.freeze({
  1: Object.freeze({
    number: 1,
    title: "獨立與行動",
    positiveTraits: Object.freeze(["獨立", "自信", "領導", "行動"]),
    challengeTraits: Object.freeze(["可能較固執", "不喜歡受控制"]),
    socialTraits: Object.freeze(["重視尊重", "傾向直接表達立場"]),
    workTraits: Object.freeze(["適合明確目標", "願意主動承擔"]),
    healthFolkloreNotes: Object.freeze(["教材曾提及胃腸對應；僅保留為民俗註記。"]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  2: Object.freeze({
    number: 2,
    title: "感受與連結",
    positiveTraits: Object.freeze(["感受細膩", "關心他人", "情感表達"]),
    challengeTraits: Object.freeze(["可能較在意關係", "需要安全感"]),
    socialTraits: Object.freeze(["重視陪伴", "能觀察氣氛"]),
    workTraits: Object.freeze(["適合協調", "重視合作品質"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  3: Object.freeze({
    number: 3,
    title: "創意與表達",
    positiveTraits: Object.freeze(["活潑", "創造力", "表達直接", "重視家庭"]),
    challengeTraits: Object.freeze(["可能因直率產生摩擦"]),
    socialTraits: Object.freeze(["容易帶動氣氛", "喜歡分享"]),
    workTraits: Object.freeze(["適合創意表達", "重視變化"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  4: Object.freeze({
    number: 4,
    title: "秩序與安全",
    positiveTraits: Object.freeze(["組織", "秩序", "理財", "專業", "整理"]),
    challengeTraits: Object.freeze(["改變需要時間", "可能較重視規則"]),
    socialTraits: Object.freeze(["重視可靠", "偏好清楚界線"]),
    workTraits: Object.freeze(["擅長流程", "能維持品質"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  5: Object.freeze({
    number: 5,
    title: "溝通與決策",
    positiveTraits: Object.freeze(["表達", "口才", "飲食感受", "決策"]),
    challengeTraits: Object.freeze(["決定後通常不易改變"]),
    socialTraits: Object.freeze(["反應快", "擅長說明"]),
    workTraits: Object.freeze(["適合溝通整合", "重視彈性"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  6: Object.freeze({
    number: 6,
    title: "照顧與協調",
    positiveTraits: Object.freeze(["照顧", "關懷", "協調", "情感豐富"]),
    challengeTraits: Object.freeze(["不一定容易直接說出感受"]),
    socialTraits: Object.freeze(["願意支持他人", "重視關係穩定"]),
    workTraits: Object.freeze(["適合服務與協調", "願意承擔責任"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  7: Object.freeze({
    number: 7,
    title: "研究與洞察",
    positiveTraits: Object.freeze(["好奇", "研究", "分析", "追根究柢", "直覺"]),
    challengeTraits: Object.freeze(["可能過度分析", "反覆確認"]),
    socialTraits: Object.freeze(["重視可信度", "需要思考空間"]),
    workTraits: Object.freeze(["適合研究", "能發現細節"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  8: Object.freeze({
    number: 8,
    title: "管理與資源",
    positiveTraits: Object.freeze(["管理", "金錢", "資源", "責任", "事業企圖"]),
    challengeTraits: Object.freeze(["可能承受較高財務或成就壓力"]),
    socialTraits: Object.freeze(["重視承諾", "在意成果"]),
    workTraits: Object.freeze(["擅長資源配置", "重視可衡量進度"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
  9: Object.freeze({
    number: 9,
    title: "服務與理想",
    positiveTraits: Object.freeze(["服務", "使命", "公益", "長輩緣", "理想"]),
    challengeTraits: Object.freeze(["可能付出過多", "容易忽略自己"]),
    socialTraits: Object.freeze(["關注群體", "願意分享資源"]),
    workTraits: Object.freeze(["適合願景與服務導向工作"]),
    healthFolkloreNotes: Object.freeze([]),
    disclaimer: FOLKLORE_HEALTH_DISCLAIMER,
    sourceProfile: "uploaded-numerology-v2",
  }),
});

const mainLine = (lineId, numbers, title, positiveTraits, cautionTraits) =>
  Object.freeze({
    lineId,
    kind: "main",
    numbers: Object.freeze(numbers),
    title,
    positiveTraits: Object.freeze(positiveTraits),
    cautionTraits: Object.freeze(cautionTraits),
    sourceProfile: "uploaded-numerology-v2",
  });

const secondaryLine = (lineId, numbers, title, positiveTraits, cautionTraits = []) =>
  Object.freeze({
    lineId,
    kind: "secondary",
    numbers: Object.freeze(numbers),
    title,
    positiveTraits: Object.freeze(positiveTraits),
    cautionTraits: Object.freeze(cautionTraits),
    sourceProfile: "uploaded-numerology-v2",
  });

export const BIRTH_GRID_LINE_RULES = Object.freeze([
  mainLine("1-2-3", [1, 2, 3], "創意線／藝術線", ["創意", "藝術", "表達", "行動"], ["任性", "自我要求", "情緒反應"]),
  mainLine("4-5-6", [4, 5, 6], "組織線／秩序線", ["組織", "邏輯", "程序", "執行"], ["要求過高", "完美主義"]),
  mainLine("7-8-9", [7, 8, 9], "貴人線／權威線", ["人脈", "長輩緣", "資源整合"], ["依賴外援", "依賴權威"]),
  mainLine("1-4-7", [1, 4, 7], "物質線／實務線", ["務實", "品質", "資源與物質管理"], ["對成果或物質較執著"]),
  mainLine("2-5-8", [2, 5, 8], "情感線／溝通線", ["傾聽", "溝通", "感受力"], ["情緒受他人影響"]),
  mainLine("3-6-9", [3, 6, 9], "智慧線／思考線", ["想像", "規劃", "智慧"], ["過度思考", "需要正向環境"]),
  mainLine("1-5-9", [1, 5, 9], "事業線／執行線", ["工作投入", "目標", "成果"], ["承擔壓力", "埋頭苦幹"]),
  mainLine("3-5-7", [3, 5, 7], "人際線／表達線", ["表達", "舞台", "人際", "帶動氣氛"], ["重視掌聲", "重視外界認同"]),
  secondaryLine("2-4", [2, 4], "靈巧線", ["細膩", "手作", "靈巧"]),
  secondaryLine("2-6", [2, 6], "公平線", ["公正", "協調", "平衡"]),
  secondaryLine("4-8", [4, 8], "模範線", ["規範", "責任", "示範"]),
  secondaryLine("6-8", [6, 8], "感受線", ["敏感", "含蓄", "情緒感受"]),
  secondaryLine(
    "2-4-6-8",
    [2, 4, 6, 8],
    "情緒壓力組合",
    ["感受細膩", "責任感"],
    ["依此民俗教材的說法，可能較容易累積情緒壓力；這不是心理或醫療診斷。"],
  ),
]);

export const MAGNETIC_FIELD_GROUPS = Object.freeze({
  伏位: Object.freeze(["11", "22", "33", "44", "66", "77", "88", "99"]),
  延年: Object.freeze(["19", "91", "26", "62", "34", "43", "78", "87"]),
  生氣: Object.freeze(["14", "41", "28", "82", "39", "93", "67", "76"]),
  天醫: Object.freeze(["13", "31", "27", "72", "49", "94", "68", "86"]),
  禍害: Object.freeze(["17", "71", "23", "32", "46", "64", "89", "98"]),
  六煞: Object.freeze(["16", "61", "29", "92", "38", "83", "47", "74"]),
  絕命: Object.freeze(["12", "21", "37", "73", "48", "84", "69", "96"]),
  五鬼: Object.freeze(["18", "81", "24", "42", "36", "63", "79", "97"]),
});

function buildMagneticFieldMap() {
  const map = {};
  const orderedDigits = ["1", "2", "3", "4", "6", "7", "8", "9"];
  const allowedDigits = new Set(orderedDigits);
  const expectedPairs = new Set(orderedDigits.flatMap((left) =>
    orderedDigits.map((right) => `${left}${right}`)));
  for (const [fieldType, pairs] of Object.entries(MAGNETIC_FIELD_GROUPS)) {
    if (pairs.length !== 8) throw new Error(`磁場 ${fieldType} 必須正好包含 8 組`);
    for (const pair of pairs) {
      if (!/^\d{2}$/.test(pair) || [...pair].some((digit) => !allowedDigits.has(digit))) {
        throw new Error(`磁場配對 ${pair} 含有不允許的數字`);
      }
      if (map[pair]) throw new Error(`磁場配對 ${pair} 重複出現在 ${map[pair]} 與 ${fieldType}`);
      map[pair] = fieldType;
    }
  }
  if (Object.keys(map).length !== 64) throw new Error("八大磁場映射必須正好包含 64 組");
  const actualPairs = Object.keys(map);
  const missingPairs = [...expectedPairs].filter((pair) => !map[pair]);
  const unexpectedPairs = actualPairs.filter((pair) => !expectedPairs.has(pair));
  if (missingPairs.length || unexpectedPairs.length) {
    throw new Error(`八大磁場必須完整覆蓋 8×8 有向配對；缺少 ${missingPairs.join("、") || "無"}，多出 ${unexpectedPairs.join("、") || "無"}`);
  }
  return Object.freeze(map);
}

export const MAGNETIC_FIELD_MAP = buildMagneticFieldMap();

export const MAGNETIC_FIELD_INTERPRETATIONS = Object.freeze({
  伏位: Object.freeze({
    core: ["穩定", "等待", "延續", "累積", "潛伏"],
    strengths: ["耐力", "守成", "規劃"],
    cautions: ["停滯", "猶豫", "反覆"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  延年: Object.freeze({
    core: ["責任", "能力", "領導", "事業", "持續力"],
    strengths: ["執行", "管理", "承擔"],
    cautions: ["壓力", "控制", "過度工作"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  生氣: Object.freeze({
    core: ["機會", "人緣", "貴人", "樂觀", "名聲"],
    strengths: ["開展", "合作", "資源"],
    cautions: ["依賴外援", "過度樂觀"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  天醫: Object.freeze({
    core: ["資源", "財富", "關係", "照顧", "穩定支持"],
    strengths: ["整合資源", "親和", "信任"],
    cautions: ["理財依賴", "感情理想化", "名稱不代表醫療或治療效果"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  禍害: Object.freeze({
    core: ["語言", "表達", "辯論", "口舌", "突發摩擦"],
    strengths: ["口才", "說服", "反應"],
    cautions: ["誤解", "爭執", "說話過急"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  六煞: Object.freeze({
    core: ["人際", "魅力", "情感", "審美", "敏感度"],
    strengths: ["協調", "藝術", "關係經營"],
    cautions: ["情緒糾葛", "曖昧", "關係壓力"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  絕命: Object.freeze({
    core: ["冒險", "決斷", "突破", "高波動"],
    strengths: ["行動", "膽識", "商業嗅覺"],
    cautions: ["衝動", "風險", "財務起伏"],
    sourceProfile: "uploaded-numerology-v2",
  }),
  五鬼: Object.freeze({
    core: ["變動", "靈感", "跳躍思考", "非典型創意"],
    strengths: ["創新", "研究", "策略", "藝術"],
    cautions: ["不穩定", "反覆", "睡眠或壓力感受", "名稱不代表超自然事件"],
    sourceProfile: "uploaded-numerology-v2",
  }),
});

export const TIMELINE_PROFILES = Object.freeze({
  uploaded_sheet_exact: Object.freeze({
    id: "uploaded_sheet_exact",
    sourceProfile: "uploaded-numerology-v2",
    label: "教材原表照錄",
    intervals: Object.freeze([
      Object.freeze([0, 10]), Object.freeze([10, 15]), Object.freeze([15, 20]),
      Object.freeze([20, 25]), Object.freeze([25, 30]), Object.freeze([30, 35]),
      Object.freeze([35, 40]), Object.freeze([40, 45]), Object.freeze([45, 50]),
      Object.freeze([50, 70]), Object.freeze([70, 75]),
    ]),
    warning: "原始教材區間數量與可配對磁場數量不一致，尚待確認。",
  }),
  first_10_then_5: Object.freeze({
    id: "first_10_then_5",
    sourceProfile: "uploaded-numerology-v2",
    label: "首段十年、其後五年",
    intervals: Object.freeze([
      Object.freeze([0, 10]), Object.freeze([10, 15]), Object.freeze([15, 20]),
      Object.freeze([20, 25]), Object.freeze([25, 30]), Object.freeze([30, 35]),
      Object.freeze([35, 40]), Object.freeze([40, 45]), Object.freeze([45, 50]),
      Object.freeze([50, 55]),
    ]),
  }),
  first_13_then_5: Object.freeze({
    id: "first_13_then_5",
    sourceProfile: "timeline-common-practice-v1",
    label: "首段十三年、其後五年",
    intervals: Object.freeze([
      Object.freeze([0, 13]), Object.freeze([13, 18]), Object.freeze([18, 23]),
      Object.freeze([23, 28]), Object.freeze([28, 33]), Object.freeze([33, 38]),
      Object.freeze([38, 43]), Object.freeze([43, 48]), Object.freeze([48, 53]),
      Object.freeze([53, 58]),
    ]),
  }),
  cyclic_5_year: Object.freeze({
    id: "cyclic_5_year",
    sourceProfile: "timeline-common-practice-v1",
    label: "五年循環",
    cyclic: true,
  }),
  legacy_project: Object.freeze({
    id: "legacy_project",
    sourceProfile: "legacy-project-v1",
    label: "舊專案相容",
    unresolved: true,
    warning: "舊專案沒有身分證流年實作，無可回歸的區間公式；目前不自動產生時間軸。",
  }),
});

export const FIELD_COMBINATION_RULES = Object.freeze([
  Object.freeze({
    id: "tianyi-shengqi",
    previousField: null,
    currentField: "天醫",
    nextField: "生氣",
    title: "資源與開展",
    interpretation: "此民俗組合可中性理解為資源整合與合作開展並存。",
    caution: "不代表必然獲利或得到外援。",
    sourceProfile: "uploaded-numerology-v2",
    certainty: "folklore",
    matchMode: "adjacent_unordered",
    enabled: true,
  }),
  Object.freeze({
    id: "tianyi-yannian",
    previousField: null,
    currentField: "天醫",
    nextField: "延年",
    title: "資源與持續",
    interpretation: "此民俗組合可中性理解為資源運用與持續執行並存。",
    caution: "不代表必然累積財富。",
    sourceProfile: "uploaded-numerology-v2",
    certainty: "folklore",
    matchMode: "adjacent_unordered",
    enabled: true,
  }),
  Object.freeze({
    id: "shengqi-yannian",
    previousField: null,
    currentField: "生氣",
    nextField: "延年",
    title: "開展與持續",
    interpretation: "此民俗組合可中性描述為行動機會與持續力並存。",
    caution: "仍需依實際條件評估。",
    sourceProfile: "uploaded-numerology-v2",
    certainty: "folklore",
    matchMode: "adjacent_unordered",
    enabled: true,
  }),
  Object.freeze({
    id: "tianyi-jueming",
    previousField: null,
    currentField: "天醫",
    nextField: "絕命",
    title: "資源與高波動",
    interpretation: "教材有較強烈比喻；本站僅保留為資源運用伴隨高波動的民俗觀察。",
    caution: "不得解讀為必然發財、事故或危險。",
    sourceProfile: "uploaded-numerology-v2",
    certainty: "folklore",
    matchMode: "adjacent_unordered",
    enabled: true,
  }),
  Object.freeze({
    id: "raw-shorthand-unresolved",
    previousField: null,
    currentField: null,
    nextField: null,
    title: "未確認簡寫",
    interpretation: "",
    caution: "",
    rawNote: "前天、絕、後生等簡寫尚未確認定義，因此不啟用自動解讀。",
    sourceProfile: "uploaded-numerology-v2",
    certainty: "unresolved",
    matchMode: "unresolved",
    enabled: false,
  }),
]);

export const DEFAULT_RULE_SET = Object.freeze({
  schemaVersion: 1,
  id: "uploaded-material-v2",
  name: "教材可追溯規則",
  version: "2.0.0",
  lifePathMode: "full_birth_digits",
  birthGridMode: "raw_birth_digits",
  masterNumberMode: "disabled",
  customMasterNumbers: Object.freeze([]),
  zeroFiveMode: "bridge_modifier",
  timelineProfile: "first_10_then_5",
  magneticFieldMapVersion: "uploaded-material-v1",
  interpretationVersion: "neutral-zh-tw-v1",
  createdAt: "2026-07-23",
  sourceNotes: Object.freeze([
    "生命靈數、九宮連線與八大磁場來自使用者提供的近代民俗教材規格。",
    "台灣身分證格式與檢查碼另依官方資料，不與 A=01 民俗轉換混用。",
  ]),
});

export const LEGACY_RULE_SET = Object.freeze({
  schemaVersion: 1,
  id: "legacy-project-v1",
  name: "舊版相容規則",
  version: "1.0.0",
  lifePathMode: "legacy_segmented",
  birthGridMode: "legacy_project",
  masterNumberMode: "preserve_11_22_33",
  customMasterNumbers: Object.freeze([]),
  zeroFiveMode: "legacy_project",
  timelineProfile: "legacy_project",
  magneticFieldMapVersion: "unavailable-in-legacy",
  interpretationVersion: "legacy-profile-copy-v1",
  createdAt: "2026-07-18",
  sourceNotes: Object.freeze([
    "生命路徑採月、日、年分段化簡並保留 11、22、33。",
    "生日九宮沿用舊站洛書版位，但舊站實際計數仍來自原始生日數字。",
    "舊站沒有八大磁場、身分證流年或可遷移歷史資料。",
  ]),
});

export const RULE_SETS = Object.freeze({
  [DEFAULT_RULE_SET.id]: DEFAULT_RULE_SET,
  [LEGACY_RULE_SET.id]: LEGACY_RULE_SET,
});

const allowedRuleValues = Object.freeze({
  lifePathMode: new Set(["full_birth_digits", "legacy_segmented"]),
  birthGridMode: new Set(["raw_birth_digits", "raw_plus_life_path", "legacy_project"]),
  masterNumberMode: new Set(["disabled", "preserve_11_22_33", "preserve_custom"]),
  zeroFiveMode: new Set(["literal", "bridge_modifier", "legacy_project"]),
  timelineProfile: new Set(Object.keys(TIMELINE_PROFILES)),
});

export function resolveRuleSet(ruleSetOrId = DEFAULT_RULE_SET.id, overrides = {}) {
  const base = typeof ruleSetOrId === "string" ? RULE_SETS[ruleSetOrId] : ruleSetOrId;
  if (!base || typeof base !== "object") throw new Error("找不到指定的規則版本。");
  const candidate = { ...base, ...overrides };
  for (const [key, allowed] of Object.entries(allowedRuleValues)) {
    if (!allowed.has(candidate[key])) throw new Error(`規則設定 ${key} 不受支援：${candidate[key]}`);
  }
  const customMasterNumbers = [...new Set((candidate.customMasterNumbers ?? []).map(Number))]
    .filter((value) => Number.isSafeInteger(value) && value > 9)
    .sort((a, b) => a - b);
  if (candidate.masterNumberMode === "preserve_custom" && customMasterNumbers.length === 0) {
    throw new Error("自訂主數模式至少需要一個大於 9 的整數。");
  }
  return Object.freeze({ ...candidate, customMasterNumbers: Object.freeze(customMasterNumbers) });
}
