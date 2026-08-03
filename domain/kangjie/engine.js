import { calculateIChing, trigrams } from "../../calculator-core.js";
import { mod1, stringifyForTrace } from "./math.js";
import { buildLineCorrespondenceAnalysis } from "./line-correspondences.js";
import { assertProfileSupportsMethod } from "./profiles.js";
import { resolveSources } from "./sources.js";

export const trigramElements = Object.freeze({
  1: "金",
  2: "金",
  3: "火",
  4: "木",
  5: "木",
  6: "水",
  7: "土",
  8: "土",
});

const GENERATES = Object.freeze({ 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" });
const CONTROLS = Object.freeze({ 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" });
const LUNAR_MONTH_BRANCHES = Object.freeze(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]);

export function analyzeFiveElementRelation(bodyTrigram, useTrigram) {
  const bodyElement = trigramElements[bodyTrigram.id];
  const useElement = trigramElements[useTrigram.id];
  let code = "same";
  let label = "體用比和";
  let explanation = `${bodyTrigram.name}${bodyElement}與${useTrigram.name}${useElement}同五行。`;
  if (GENERATES[bodyElement] === useElement) {
    code = "body-generates-use";
    label = "體生用";
    explanation = `體卦${bodyElement}生用卦${useElement}。`;
  } else if (GENERATES[useElement] === bodyElement) {
    code = "use-generates-body";
    label = "用生體";
    explanation = `用卦${useElement}生體卦${bodyElement}。`;
  } else if (CONTROLS[bodyElement] === useElement) {
    code = "body-controls-use";
    label = "體克用";
    explanation = `體卦${bodyElement}克用卦${useElement}。`;
  } else if (CONTROLS[useElement] === bodyElement) {
    code = "use-controls-body";
    label = "用克體";
    explanation = `用卦${useElement}克體卦${bodyElement}。`;
  }
  return { code, label, bodyElement, useElement, explanation };
}

export function analyzeSeasonalStrength(trigram, rawLunarMonth) {
  const lunarMonth = Number(rawLunarMonth);
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new Error("月令旺衰需要 1 至 12 的農曆月數。");
  }
  const earthMonth = [3, 6, 9, 12].includes(lunarMonth);
  const season = earthMonth
    ? "四季土月"
    : lunarMonth <= 2 ? "春"
      : lunarMonth <= 5 ? "夏"
        : lunarMonth <= 8 ? "秋" : "冬";
  const strongIds = earthMonth ? [7, 8]
    : season === "春" ? [4, 5]
      : season === "夏" ? [3]
        : season === "秋" ? [1, 2] : [6];
  const weakIds = earthMonth ? [6]
    : season === "春" ? [7, 8]
      : season === "夏" ? [1, 2]
        : season === "秋" ? [4, 5] : [3];
  const status = strongIds.includes(trigram.id) ? "旺" : weakIds.includes(trigram.id) ? "衰" : "平";
  return {
    lunarMonth,
    monthBranch: LUNAR_MONTH_BRANCHES[lunarMonth - 1],
    season,
    status,
    trigramId: trigram.id,
    trigramName: trigram.name,
    element: trigramElements[trigram.id],
    explanation: `農曆${lunarMonth}月（${LUNAR_MONTH_BRANCHES[lunarMonth - 1]}月・${season}），${trigram.name}卦依原文列為${status}。`,
  };
}

function influenceEntry(stage, body, target) {
  return {
    stage,
    trigram: { ...target, element: trigramElements[target.id] },
    relation: analyzeFiveElementRelation(body, target),
  };
}

function moduloEntry(total, divisor) {
  const value = BigInt(total);
  const base = BigInt(divisor);
  const remainder = value % base;
  return {
    total: value.toString(),
    divisor,
    quotient: (value / base).toString(),
    remainder: remainder.toString(),
    result: mod1(value, divisor),
    exactMultipleRule: remainder === 0n ? `整除時取 ${divisor}` : "取餘數",
  };
}

function legacyPureMutual(baseResult, profile) {
  if (
    profile.pureHexagramMutual === "transformed"
    && (baseResult.original.hexId === 1 || baseResult.original.hexId === 2)
  ) {
    return {
      mutual: calculateIChing([
        String(baseResult.transformed.upperId),
        String(baseResult.transformed.lowerId),
        "1",
      ]).mutual,
      mutualSource: "transformed",
    };
  }
  return { mutual: baseResult.mutual, mutualSource: "original" };
}

export function buildMeihuaResult({
  method,
  methodLabel,
  upperTotal,
  lowerTotal,
  movingTotal,
  originalInput,
  normalizedInput,
  inputSummary,
  trace = [],
  sourceIds,
  formulaSourceIds,
  dataSourceIds = [],
  sharedCoreSourceIds = ["MYS-WIKI-01", "MYS-WIKI-02", "MYS-NLC-1925-01"],
  formulaSourceStatus = "documented",
  formulaSourceNotice = "本方法公式可由所列傳本文字核對。",
  profile: profileOrId,
  assumptions = [],
  warnings = [],
  ignoredInput = [],
  dataVersions = {},
  seasonalLunarMonth = null,
}) {
  const profile = assertProfileSupportsMethod(profileOrId, method);
  const totals = {
    upper: BigInt(upperTotal),
    lower: BigInt(lowerTotal),
    moving: BigInt(movingTotal),
  };
  const baseResult = calculateIChing([
    totals.upper.toString(),
    totals.lower.toString(),
    totals.moving.toString(),
  ]);
  const { mutual, mutualSource } = legacyPureMutual(baseResult, profile);
  const lowerIsUse = baseResult.moving.index < 3;
  const body = lowerIsUse ? baseResult.original.upper : baseResult.original.lower;
  const use = lowerIsUse ? baseResult.original.lower : baseResult.original.upper;
  const transformedUse = lowerIsUse ? baseResult.transformed.lower : baseResult.transformed.upper;
  const roles = {
    body: { ...body, element: trigramElements[body.id], position: lowerIsUse ? "upper" : "lower" },
    use: { ...use, element: trigramElements[use.id], position: lowerIsUse ? "lower" : "upper" },
    transformedUse: { ...transformedUse, element: trigramElements[transformedUse.id], position: lowerIsUse ? "lower" : "upper" },
    note: lowerIsUse ? "動爻在下卦，下卦為用，上卦為體。" : "動爻在上卦，上卦為用，下卦為體。",
  };
  const fiveElements = analyzeFiveElementRelation(body, use);
  const influenceRelations = [
    influenceEntry("本卦用卦", body, use),
    influenceEntry("互卦下互", body, mutual.lower),
    influenceEntry("互卦上互", body, mutual.upper),
    influenceEntry("變卦用方", body, transformedUse),
  ];
  const bodyPartyCount = influenceRelations.filter((entry) => entry.trigram.element === roles.body.element).length;
  const usePartyCount = roles.body.element === roles.use.element
    ? null
    : influenceRelations.filter((entry) => entry.trigram.element === roles.use.element).length;
  const partyBalance = {
    bodyElement: roles.body.element,
    useElement: roles.use.element,
    bodyPartyCount,
    usePartyCount,
    note: usePartyCount === null
      ? "體用同五行，比和時不把同一卦重複分作體黨與用黨。"
      : `互變四個觀察位置中，與體同五行 ${bodyPartyCount} 個，與用同五行 ${usePartyCount} 個。`,
  };
  const seasonalStrength = seasonalLunarMonth === null || seasonalLunarMonth === undefined || seasonalLunarMonth === ""
    ? null
    : {
      lunarMonth: Number(seasonalLunarMonth),
      body: analyzeSeasonalStrength(body, seasonalLunarMonth),
      use: analyzeSeasonalStrength(use, seasonalLunarMonth),
      mutualLower: analyzeSeasonalStrength(mutual.lower, seasonalLunarMonth),
      mutualUpper: analyzeSeasonalStrength(mutual.upper, seasonalLunarMonth),
      transformedUse: analyzeSeasonalStrength(transformedUse, seasonalLunarMonth),
      note: "只依《梅花易數》所列旺、衰月份作結構標記；未列者標為平，不自動推成吉凶預測。",
    };
  const modulo = {
    upper: moduloEntry(totals.upper, 8),
    lower: moduloEntry(totals.lower, 8),
    moving: moduloEntry(totals.moving, 6),
  };
  const effectiveFormulaSourceIds = formulaSourceIds ?? sourceIds ?? ["MYS-WIKI-01", "MYS-CTEXT-01"];
  const formulaSourceRefs = resolveSources([...new Set(effectiveFormulaSourceIds)]);
  const dataSourceRefs = resolveSources([...new Set(dataSourceIds)]);
  const sharedCoreSourceRefs = resolveSources([...new Set(sharedCoreSourceIds)]);
  const sourceRefs = [...formulaSourceRefs, ...dataSourceRefs].filter(
    (source, index, values) => values.findIndex((candidate) => candidate.id === source.id) === index,
  );
  const lineCorrespondences = buildLineCorrespondenceAnalysis(baseResult.moving.index);
  const allSourceIds = [...new Set([
    ...formulaSourceRefs.map((source) => source.id),
    ...dataSourceRefs.map((source) => source.id),
    ...sharedCoreSourceRefs.map((source) => source.id),
    ...lineCorrespondences.sources.map((source) => source.id),
  ])];
  const mutualSourceLines = mutualSource === "transformed"
    ? baseResult.transformed.lines
    : baseResult.original.lines;
  return {
    ...baseResult,
    kind: "kangjie",
    method,
    methodLabel,
    algorithmVersion: profile.id,
    profileId: profile.id,
    profileLabel: profile.label,
    mutual,
    mutualSource,
    roles,
    fiveElements,
    influenceRelations,
    partyBalance,
    seasonalStrength,
    lineCorrespondences,
    trace,
    inputSummary,
    sourceRefs,
    formulaSourceRefs,
    dataSourceRefs,
    sharedCoreSourceRefs,
    sourceScopes: {
      formula: { status: formulaSourceStatus, notice: formulaSourceNotice, refs: formulaSourceRefs },
      data: { status: dataSourceRefs.length ? "documented" : "not-required", refs: dataSourceRefs },
      sharedCore: { status: "documented", notice: "只支持除八、除六、卦象、互變與體用共用核心，不替方法本身背書。", refs: sharedCoreSourceRefs },
      correspondence: { status: "layered", notice: "古典爻位、後世類象與現代等分時間分層呈現。", refs: lineCorrespondences.sources },
    },
    calculationTrace: {
      schemaVersion: "kangjie-calculation-trace-v2",
      methodId: method,
      algorithmVersion: profile.id,
      profile: stringifyForTrace(profile),
      originalInput: stringifyForTrace(originalInput),
      normalizedInput: stringifyForTrace(normalizedInput),
      totals: stringifyForTrace(totals),
      modulo,
      lineOrder: "初爻至上爻",
      primaryLines: [...baseResult.original.lines],
      mutualSource,
      mutualLowerSourceLines: mutualSourceLines.slice(1, 4),
      mutualUpperSourceLines: mutualSourceLines.slice(2, 5),
      changedLines: [...baseResult.transformed.lines],
      movingLine: baseResult.moving.index + 1,
      bodyUse: roles,
      fiveElements,
      influenceRelations,
      partyBalance,
      seasonalStrength,
      lineCorrespondenceVersion: lineCorrespondences.version,
      activeLineCorrespondence: lineCorrespondences.active,
      steps: trace.map((item, index) => ({ order: index + 1, ...item })),
      assumptions: [...assumptions],
      warnings: [...warnings],
      ignoredInput: [...ignoredInput],
      sourceIds: allSourceIds,
      sourceScopes: {
        formula: { status: formulaSourceStatus, notice: formulaSourceNotice, sourceIds: formulaSourceRefs.map((source) => source.id) },
        data: { status: dataSourceRefs.length ? "documented" : "not-required", sourceIds: dataSourceRefs.map((source) => source.id) },
        sharedCore: { status: "documented", sourceIds: sharedCoreSourceRefs.map((source) => source.id) },
        correspondence: { status: "layered", sourceIds: lineCorrespondences.sources.map((source) => source.id) },
      },
      dataVersions: { ...dataVersions },
    },
  };
}

export function trigramById(rawId, label = "卦數") {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1 || id > 8) throw new Error(`${label}必須是 1 至 8。`);
  return trigrams[id];
}
