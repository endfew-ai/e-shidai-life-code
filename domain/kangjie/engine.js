import { calculateIChing, trigrams } from "../../calculator-core.js";
import { mod1, stringifyForTrace } from "./math.js";
import { resolveCalculationProfile } from "./profiles.js";
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
  sourceIds = ["MYS-WIKI-01", "MYS-CTEXT-01"],
  profile: profileOrId,
  assumptions = [],
  warnings = [],
  ignoredInput = [],
  dataVersions = {},
}) {
  const profile = resolveCalculationProfile(profileOrId);
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
  const roles = {
    body: { ...body, element: trigramElements[body.id] },
    use: { ...use, element: trigramElements[use.id] },
    note: lowerIsUse ? "動爻在下卦，下卦為用，上卦為體。" : "動爻在上卦，上卦為用，下卦為體。",
  };
  const fiveElements = analyzeFiveElementRelation(body, use);
  const modulo = {
    upper: { total: totals.upper.toString(), divisor: 8, result: mod1(totals.upper, 8) },
    lower: { total: totals.lower.toString(), divisor: 8, result: mod1(totals.lower, 8) },
    moving: { total: totals.moving.toString(), divisor: 6, result: mod1(totals.moving, 6) },
  };
  const sources = resolveSources(sourceIds);

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
    trace,
    inputSummary,
    sourceRefs: sources,
    calculationTrace: {
      schemaVersion: "kangjie-calculation-trace-v1",
      methodId: method,
      algorithmVersion: profile.id,
      profile: stringifyForTrace(profile),
      originalInput: stringifyForTrace(originalInput),
      normalizedInput: stringifyForTrace(normalizedInput),
      totals: stringifyForTrace(totals),
      modulo,
      lineOrder: "初爻至上爻",
      primaryLines: [...baseResult.original.lines],
      mutualLowerSourceLines: baseResult.original.lines.slice(1, 4),
      mutualUpperSourceLines: baseResult.original.lines.slice(2, 5),
      changedLines: [...baseResult.transformed.lines],
      movingLine: baseResult.moving.index + 1,
      bodyUse: roles,
      fiveElements,
      steps: trace.map((item, index) => ({ order: index + 1, ...item })),
      assumptions: [...assumptions],
      warnings: [...warnings],
      ignoredInput: [...ignoredInput],
      sourceIds: sources.map((source) => source.id),
      dataVersions: { ...dataVersions },
    },
  };
}

export function trigramById(rawId, label = "卦數") {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1 || id > 8) throw new Error(`${label}必須是 1 至 8。`);
  return trigrams[id];
}
