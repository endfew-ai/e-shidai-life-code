import {
  FIELD_COMBINATION_RULES,
  MAGNETIC_FIELD_INTERPRETATIONS,
  PERSONALITY_PROFILES,
  RULE_SOURCE_PROFILES,
} from "./rule-data.js";

export const NUMEROLOGY_DISCLAIMER =
  "本結果屬民俗文化、娛樂與自我觀察用途，不是科學預測、醫療或心理診斷、投資保證、法律意見或命運保證。";

export function getPersonalityProfile(baseNumber) {
  if (!Number.isInteger(baseNumber) || baseNumber < 1 || baseNumber > 9) {
    throw new Error("人格基底必須是 1 到 9。");
  }
  return PERSONALITY_PROFILES[baseNumber];
}

function frozenList(values) {
  return Object.freeze([...values]);
}

function findStageBridgeFields(stage, bridges) {
  if (!stage?.pair || !Array.isArray(bridges)) return Object.freeze([]);
  const { startIndex, endIndex } = stage.pair;
  const fields = [];
  for (const bridge of bridges) {
    const containsStage = bridge?.startIndex <= startIndex && bridge?.endIndex >= endIndex;
    if (!containsStage || !bridge.fieldType || fields.includes(bridge.fieldType)) continue;
    fields.push(bridge.fieldType);
  }
  return Object.freeze(fields);
}

function buildTimelineTransition(stage, previousStage) {
  if (!previousStage) {
    return Object.freeze({
      status: "first_stage",
      title: "起始階段",
      interpretation: "這是時間軸的第一段，沒有前一段可比較。",
      caution: "只觀察本階段主題，不補造前段因果。",
      sourceProfile: "uploaded-numerology-v2",
    });
  }

  if (!previousStage.pair || !stage?.pair) {
    return Object.freeze({
      status: "unmatched_interval",
      title: "區間資料待確認",
      interpretation: "相鄰兩段中至少一段沒有可用配對，因此不建立轉接解讀。",
      caution: "不得用其他區間代替缺少的配對。",
      sourceProfile: "uploaded-numerology-v2",
    });
  }

  const previousField = previousStage.pair.fieldType;
  const currentField = stage.pair.fieldType;
  if (!previousField || !currentField) {
    return Object.freeze({
      status: "blocked_unclassified",
      title: "暫不跨段推論",
      interpretation: "相鄰兩段中至少一段屬未分類組合，本次不跨過該段連接前後磁場。",
      caution: "未分類不代表負面，也不能跳過它拼接其他階段。",
      sourceProfile: "uploaded-numerology-v2",
    });
  }

  if (previousField === currentField) {
    return Object.freeze({
      status: "same_field",
      title: `${currentField}主題延續`,
      interpretation: `前後兩段同為${currentField}，可持續觀察同一組核心主題是否重複出現。`,
      caution: "這只表示教材分類相同，不代表實際事件必然重複。",
      sourceProfile: "uploaded-numerology-v2",
    });
  }

  const rule = FIELD_COMBINATION_RULES.find((candidate) => {
    if (!candidate.enabled || candidate.matchMode !== "adjacent_unordered") return false;
    const forward = candidate.currentField === previousField && candidate.nextField === currentField;
    const reverse = candidate.currentField === currentField && candidate.nextField === previousField;
    return forward || reverse;
  });
  if (rule) {
    return Object.freeze({
      status: "matched_rule",
      title: rule.title,
      interpretation: rule.interpretation,
      caution: rule.caution,
      sourceProfile: rule.sourceProfile,
    });
  }

  return Object.freeze({
    status: "no_defined_rule",
    title: "相鄰組合尚無細則",
    interpretation: `教材目前沒有${previousField}與${currentField}的相鄰轉接規則，因此只分別呈現兩段主題。`,
    caution: "不自行補寫吉凶、因果或事件預測。",
    sourceProfile: "uploaded-numerology-v2",
  });
}

export function buildTimelineStageInsight(stage, previousStage = null, options = {}) {
  const bridgeFields = findStageBridgeFields(stage, options.bridges);
  const fieldType = stage?.pair?.fieldType ?? null;
  const sourceProfile = options.sourceProfile ?? "uploaded-numerology-v2";
  const transitionFromPrevious = buildTimelineTransition(stage, previousStage);
  const disclaimer = "此為民俗教材的自我觀察提示，不是事件預測、醫療、心理、財務或命運判定。";

  if (!stage?.pair) {
    return Object.freeze({
      classificationStatus: "unmatched",
      fieldType: null,
      summary: "此區間沒有可對應的相鄰組合。",
      themes: frozenList(["資料待確認"]),
      observationQuestions: frozenList([
        "此區間是否需要依原始教材或採用流派重新確認？",
      ]),
      strengths: frozenList(["保留空缺", "避免補造"]),
      cautions: frozenList(["沒有配對時不建立磁場判讀"]),
      classificationNote: "所選時間軸區間多於可用相鄰組合，本站保留區間但不補造結果。",
      transitionFromPrevious,
      bridgeFields,
      sourceProfile,
      disclaimer,
    });
  }

  if (!fieldType) {
    let classificationNote = "這一組含 0 或 5，未列入 64 組直接分類，維持未分類。";
    if (options.zeroFiveMode === "bridge_modifier" && bridgeFields.length) {
      classificationNote = `這一組含 0 或 5，未列入 64 組直接分類；另偵測到橋接補充磁場：${bridgeFields.join("、")}。橋接只作補充，不取代本階段的直接分類。`;
    } else if (options.zeroFiveMode === "bridge_modifier") {
      classificationNote = "這一組含 0 或 5，未列入 64 組直接分類；目前沒有符合規則的完整橋接，維持未分類。";
    } else if (options.zeroFiveMode === "literal") {
      classificationNote = "這一組含 0 或 5，依目前只照錄設定維持未分類，不建立橋接推論。";
    } else if (options.zeroFiveMode === "legacy_project") {
      classificationNote = "舊版沒有 0 或 5 的磁場公式，本站維持未分類，不套用其他流派規則。";
    }
    return Object.freeze({
      classificationStatus: "modifier_unclassified",
      fieldType: null,
      summary: bridgeFields.length
        ? `直接組合未分類，另有${bridgeFields.join("、")}橋接補充。`
        : "直接組合未分類，建議連同前後階段觀察。",
      themes: frozenList(["過渡資訊", "規則界線", "前後合看"]),
      observationQuestions: frozenList([
        "這一段與前後階段的主題是否出現延續或轉折？",
        "實際經驗是否需要保留更多背景，而不是只用單一標籤解讀？",
      ]),
      strengths: frozenList(["保留原始順序", "避免強行套用八大磁場"]),
      cautions: frozenList([
        "未分類不等於無效或負面",
        bridgeFields.length ? "橋接結果只作補充，不取代直接分類" : "目前沒有可引用的八大磁場直接規則",
      ]),
      classificationNote,
      transitionFromPrevious,
      bridgeFields,
      sourceProfile,
      disclaimer,
    });
  }

  const interpretation = MAGNETIC_FIELD_INTERPRETATIONS[fieldType];
  return Object.freeze({
    classificationStatus: "classified",
    fieldType,
    summary: `以${interpretation.core.slice(0, 3).join("、")}為主要民俗觀察。`,
    themes: frozenList(interpretation.core),
    observationQuestions: frozenList(interpretation.observationQuestions),
    strengths: frozenList(interpretation.strengths),
    cautions: frozenList(interpretation.cautions),
    classificationNote: `本階段的直接相鄰組合已在 64 組磁場對照表中分類為${fieldType}。`,
    transitionFromPrevious,
    bridgeFields,
    sourceProfile: interpretation.sourceProfile,
    disclaimer,
  });
}

function section(id, title, summary, details, calculationSteps, sourceProfile) {
  return Object.freeze({
    id,
    title,
    summary,
    details: Object.freeze(details),
    calculationSteps: Object.freeze(calculationSteps),
    sourceProfile,
  });
}

export function buildBirthdayReportSections(analysis) {
  const lifePath = analysis.lifePathResult;
  const birthday = analysis.birthdayNumberResult;
  const grid = analysis.birthGridResult;
  const personality = getPersonalityProfile(lifePath.baseNumber);
  const established = grid.establishedLines;
  const missing = grid.missingNumbers;

  return Object.freeze([
    section(
      "life-path",
      "生日生命靈數",
      `生命靈數 ${lifePath.lifePathNumber}，人格基底 ${lifePath.baseNumber}`,
      [
        `原始生日數字：${lifePath.originalDigits.join("、")}`,
        `第一次加總：${lifePath.firstSum}`,
        `使用規則：${analysis.ruleSet.name} ${analysis.ruleSet.version}`,
      ],
      [lifePath.calculationText],
      lifePath.ruleProfile.sourceProfile,
    ),
    section(
      "birthday-number",
      "生日數",
      `生日數 ${birthday.birthdayNumber}`,
      [`只取出生日 ${birthday.originalDay} 日計算。`],
      [birthday.calculationText],
      birthday.ruleProfile.sourceProfile,
    ),
    section(
      "birth-grid",
      "生日九宮格",
      `出現 ${grid.presentNumbers.length} 種數字，成立 ${established.length} 條連線`,
      [
        `原始入格數字：${grid.rawGridDigits.join("、") || "無"}`,
        `缺少數字：${missing.join("、") || "無"}`,
        ...established.map((line) => `${line.title}（強度 ${line.strength}）：${line.basis}`),
      ],
      [grid.calculationText],
      grid.sourceProfile,
    ),
    section(
      "personality",
      "中性人格摘要",
      personality.title,
      [
        `優勢：${personality.positiveTraits.join("、")}`,
        `提醒：${personality.challengeTraits.join("、")}`,
        `工作觀察：${personality.workTraits.join("、")}`,
      ],
      [],
      personality.sourceProfile,
    ),
  ]);
}

export function buildMagneticReportSections(analysis) {
  const isIdentity = analysis.inputType === "taiwan_national_id";
  const magnetic = isIdentity
    ? (analysis.destinyMagneticFieldResult ?? analysis.identityDestiny?.magnetic ?? analysis.magneticFieldResult)
    : (analysis.magneticFieldResult ?? analysis.magnetic ?? analysis);
  const records = magnetic.resolvedRecords ?? analysis.resolvedRecords ?? [];
  const dominant = isIdentity
    ? (analysis.destinyDominantField ?? magnetic.dominantField)
    : (analysis.dominantField ?? magnetic.dominantField);
  const fieldDetails = Object.entries(dominant?.counts ?? {}).map(([fieldType, count]) => {
    const interpretation = MAGNETIC_FIELD_INTERPRETATIONS[fieldType];
    return `${fieldType} ${count} 次：${interpretation.core.join("、")}；提醒 ${interpretation.cautions.join("、")}`;
  });
  const pairSteps = records.map((record, index) => {
    if (!isIdentity) {
      return `第 ${index + 1} 組：${record.rawPair}${record.basePair && record.basePair !== record.rawPair ? `（橋接 ${record.basePair}）` : ""} → ${record.fieldType ?? "未分類"}`;
    }
    const position = record.kind === "bridge"
      ? `命格位置 ${record.startIndex + 1}～${record.endIndex + 1} 的橋接結果`
      : `命格第 ${record.startIndex + 1} 個相鄰視窗`;
    return `${position} → ${record.fieldType ?? "未分類"}`;
  });
  const sections = [];
  const destiny = analysis.identityDestiny ?? analysis.destiny;
  if (isIdentity && destiny) {
    sections.push(section(
      "identity-destiny-sequence",
      "身分證命格數列",
      destiny.droppedLeadingZero
        ? "字母碼的補位 0 已依命格規則移除"
        : "字母碼不以補位 0 開頭，完整保留",
      [
        `命格數列長度 ${destiny.sequenceLength} 位，共 ${destiny.magnetic.pairs.length} 個相鄰視窗。`,
        "命格數列用於長期格局的民俗觀察；它是一組序列，不是加總後的單一數字。",
        `人生階段另以完整 ${destiny.fullSequenceLength} 位數列計算，不套用此移除規則。`,
      ],
      [destiny.calculationText],
      destiny.sourceProfile,
    ));
  }
  sections.push(
    section(
      "magnetic-pairs",
      isIdentity ? "命格相鄰磁場" : "相鄰磁場",
      `共 ${records.length} 組可分類結果`,
      fieldDetails.length ? fieldDetails : ["目前沒有可分類的八大磁場配對。"],
      pairSteps,
      "uploaded-numerology-v2",
    ),
    section(
      "dominant-field",
      isIdentity ? "命格主要出現磁場" : "主要出現磁場",
      dominant?.label ?? "尚無可分類配對",
      [isIdentity
        ? "這是命格數列中的磁場次數摘要；平手時會完整列出所有並列結果。"
        : "平手時會完整列出所有並列結果。"],
      [],
      "uploaded-numerology-v2",
    ),
  );
  const timeline = analysis.timelineResult ?? analysis.timeline;
  if (timeline) {
    const timelineBridges = analysis.lifeEncounterMagnetic?.bridges
      ?? analysis.magneticFieldResult?.bridges
      ?? [];
    const zeroFiveMode = analysis.lifeEncounterMagnetic?.zeroFiveMode
      ?? analysis.magneticFieldResult?.zeroFiveMode;
    const timelineInsights = timeline.stages.map((stage, index) =>
      buildTimelineStageInsight(stage, timeline.stages[index - 1] ?? null, {
        bridges: timelineBridges,
        zeroFiveMode,
        sourceProfile: timeline.sourceProfile,
      }));
    const classifiedCount = timelineInsights.filter(({ classificationStatus }) =>
      classificationStatus === "classified").length;
    sections.push(section(
      "identity-timeline",
      "人生階段流年",
      `${timeline.profileLabel}，共 ${timeline.stages.length} 段，已分類 ${classifiedCount} 段`,
      timeline.stages.map((stage, index) => {
        const insight = timelineInsights[index];
        const transition = insight.transitionFromPrevious;
        const fieldLabel = insight.fieldType ?? (insight.classificationStatus === "unmatched" ? "待配對" : "未分類");
        return [
          `${stage.label}：${fieldLabel}。${insight.summary}`,
          `階段主題：${insight.themes.join("、")}。`,
          `可觀察：${insight.observationQuestions.join("；")}`,
          `可運用：${insight.strengths.join("、")}。`,
          `需要留意：${insight.cautions.join("、")}。`,
          `前段轉接：${transition.title}。${transition.interpretation}${transition.caution ? `提醒：${transition.caution}` : ""}`,
          `分類依據：${insight.classificationNote}`,
        ].join(" ");
      }),
      timeline.warnings.map((warning) => typeof warning === "string" ? warning : warning.message),
      timeline.sourceProfile,
    ));
  }
  return Object.freeze(sections);
}

export function generatePlainTextReport(analysis, options = {}) {
  const showSensitive = options.showSensitive === true;
  const displayInput = analysis.inputType === "taiwan_national_id" && !showSensitive
    ? analysis.maskedInput
    : (analysis.normalizedInput ?? analysis.maskedInput);
  const lines = [
    "e世代生命密碼分析報告",
    `分析類型：${analysis.inputType}`,
    `輸入資料：${displayInput}`,
    `規則版本：${analysis.ruleSet?.name ?? analysis.ruleSetId} ${analysis.ruleSet?.version ?? ""}`.trim(),
    "",
  ];
  for (const reportSection of analysis.reportSections ?? []) {
    lines.push(`【${reportSection.title}】`, reportSection.summary);
    for (const detail of reportSection.details) lines.push(`- ${detail}`);
    if (reportSection.calculationSteps.length) {
      lines.push("演算過程：", ...reportSection.calculationSteps.map((step) => `  ${step}`));
    }
    lines.push("");
  }
  lines.push(`免責聲明：${analysis.disclaimer ?? NUMEROLOGY_DISCLAIMER}`);
  return lines.join("\n");
}

export function createHistoryRecord(analysis) {
  const common = {
    schemaVersion: 1,
    id: analysis.id,
    inputType: analysis.inputType,
    maskedInput: analysis.maskedInput,
    ruleSetId: analysis.ruleSet?.id ?? analysis.ruleSetId,
    ruleSetVersion: analysis.ruleSet?.version ?? null,
    createdAt: analysis.createdAt,
    warnings: [...(analysis.warnings ?? [])],
    summary: analysis.reportSections?.map(({ id, title, summary }) => ({ id, title, summary })) ?? [],
  };
  return Object.freeze({
    ...common,
    sensitiveDataStored: false,
    dominantFields: [...(analysis.inputType === "taiwan_national_id"
      ? (analysis.destinyDominantField?.fields ?? analysis.dominantField?.fields ?? [])
      : (analysis.dominantField?.fields ?? []))],
    note: analysis.inputType === "taiwan_national_id"
      ? "完整身分證、轉換序列、配對與時間軸未寫入歷史，避免由本機紀錄反推出原號。"
      : "歷史只保存遮罩輸入、規則版本與摘要；完整原始序列不寫入本機紀錄。",
  });
}

export function sourceProfileFor(id) {
  const source = Object.values(RULE_SOURCE_PROFILES).find((profile) => profile.id === id);
  if (!source) throw new Error(`找不到來源註記：${id}`);
  return source;
}
