import {
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
  const magnetic = analysis.magneticFieldResult ?? analysis.magnetic ?? analysis;
  const records = magnetic.resolvedRecords ?? analysis.resolvedRecords ?? [];
  const dominant = analysis.dominantField ?? magnetic.dominantField;
  const fieldDetails = Object.entries(dominant?.counts ?? {}).map(([fieldType, count]) => {
    const interpretation = MAGNETIC_FIELD_INTERPRETATIONS[fieldType];
    return `${fieldType} ${count} 次：${interpretation.core.join("、")}；提醒 ${interpretation.cautions.join("、")}`;
  });
  const pairSteps = records.map((record, index) =>
    `第 ${index + 1} 組：${record.rawPair}${record.basePair && record.basePair !== record.rawPair ? `（橋接 ${record.basePair}）` : ""} → ${record.fieldType ?? "未分類"}`);
  const sections = [
    section(
      "magnetic-pairs",
      "相鄰磁場",
      `共 ${records.length} 組可分類結果`,
      fieldDetails.length ? fieldDetails : ["目前沒有可分類的八大磁場配對。"],
      pairSteps,
      "uploaded-numerology-v2",
    ),
    section(
      "dominant-field",
      "主要出現磁場",
      dominant?.label ?? "尚無可分類配對",
      ["平手時會完整列出，不把主要出現磁場稱為命格數。"],
      [],
      "uploaded-numerology-v2",
    ),
  ];
  const timeline = analysis.timelineResult ?? analysis.timeline;
  if (timeline) {
    sections.push(section(
      "identity-timeline",
      "人生階段流年",
      `${timeline.profileLabel}・${timeline.stages.length} 段`,
      timeline.stages.map((stage) =>
        `${stage.label}：${stage.pair?.rawPair ?? "無配對"} → ${stage.pair?.fieldType ?? "未分類／待確認"}`),
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
    dominantFields: [...(analysis.dominantField?.fields ?? [])],
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
