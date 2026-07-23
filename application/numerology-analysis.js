import {
  DEFAULT_RULE_SET,
  RULE_SOURCE_PROFILES,
  resolveRuleSet,
} from "../domain/numerology/rule-data.js";
import {
  calculateBirthdayNumber,
  calculateLifePath,
  calculatePersonalYear,
} from "../domain/numerology/life-path.js";
import { analyzeBirthGrid } from "../domain/numerology/birth-grid.js";
import { analyzeMagneticSequence } from "../domain/numerology/magnetic-field.js";
import { analyzeIdentityNumber } from "../domain/numerology/identity-timeline.js";
import {
  NUMEROLOGY_DISCLAIMER,
  buildBirthdayReportSections,
  buildMagneticReportSections,
  getPersonalityProfile,
} from "../domain/numerology/interpretation.js";

function createAnalysisId(inputType, createdAt, providedId) {
  if (providedId) return String(providedId);
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
  return `${inputType}-${createdAt.replace(/\D/g, "").slice(0, 14)}-${randomPart}`;
}

function requireClock(options) {
  if (!options.todayValue || !/^\d{4}-\d{2}-\d{2}$/.test(String(options.todayValue))) {
    throw new Error("分析必須由應用層提供 todayValue，避免日期結果隨執行環境漂移。");
  }
  if (!Number.isInteger(options.currentYear)) {
    throw new Error("分析必須由應用層提供 currentYear。");
  }
  const createdAt = options.createdAt ?? `${options.todayValue}T00:00:00.000Z`;
  if (Number.isNaN(Date.parse(createdAt))) throw new Error("createdAt 必須是有效 ISO 日期時間。");
  return { createdAt };
}

function maskSequence(rawValue, inputType) {
  const normalized = String(rawValue ?? "").trim().toUpperCase();
  if (inputType === "phone_number") {
    const visible = normalized.replace(/\D/g, "").slice(-4);
    return visible ? `手機末碼 ${visible.padStart(4, "*")}` : "手機號碼（已遮罩）";
  }
  if (normalized.length <= 2) return "*".repeat(normalized.length);
  const visibleCount = normalized.length <= 5 ? 1 : 2;
  return `${normalized.slice(0, visibleCount)}${"*".repeat(normalized.length - visibleCount * 2)}${normalized.slice(-visibleCount)}`;
}

export function analyzeBirthdayV2(input) {
  const clock = requireClock(input);
  const ruleSet = resolveRuleSet(input.ruleSet ?? input.ruleSetId ?? DEFAULT_RULE_SET.id, input.ruleOverrides);
  const lifePathResult = calculateLifePath(input.date, {
    ruleSet,
    todayValue: input.todayValue,
  });
  const birthdayNumberResult = calculateBirthdayNumber(input.date, {
    ruleSet,
    todayValue: input.todayValue,
  });
  const birthGridResult = analyzeBirthGrid(input.date, {
    ruleSet,
    todayValue: input.todayValue,
    lifePathResult,
  });
  const personalYearResult = calculatePersonalYear(input.date, input.currentYear, {
    todayValue: input.todayValue,
  });
  const personalYearCycles = Object.freeze(
    [input.currentYear - 1, input.currentYear, input.currentYear + 1].map((year) =>
      calculatePersonalYear(input.date, year, { todayValue: input.todayValue })),
  );
  const warnings = [];
  if (ruleSet.id === "legacy-project-v1") {
    warnings.push("目前使用舊版分段主數規則；可在規則設定切換至教材可追溯規則。");
  }
  const base = {
    schemaVersion: 1,
    id: createAnalysisId("birthday", clock.createdAt, input.id),
    inputType: "birthday",
    maskedInput: lifePathResult.date,
    normalizedInput: lifePathResult.date,
    ruleSetId: ruleSet.id,
    ruleSet,
    calculationSteps: Object.freeze([
      Object.freeze({ id: "life-path", label: "生命靈數", text: lifePathResult.calculationText }),
      Object.freeze({ id: "birthday-number", label: "生日數", text: birthdayNumberResult.calculationText }),
      Object.freeze({ id: "birth-grid", label: "生日九宮格", text: birthGridResult.calculationText }),
      Object.freeze({ id: "personal-year", label: "生日個人流年", text: personalYearResult.calculationText }),
    ]),
    lifePathResult,
    birthdayNumberResult,
    birthGridResult,
    magneticFieldResult: null,
    timelineResult: null,
    personalYearResult,
    personalYearCycles,
    personalityProfile: getPersonalityProfile(lifePathResult.baseNumber),
    destinyNumber: Object.freeze({
      status: "unresolved",
      label: "命格數：尚未設定演算規則",
      sourceProfile: RULE_SOURCE_PROFILES.unresolvedDestinyNumber.id,
    }),
    warnings: Object.freeze(warnings),
    disclaimer: NUMEROLOGY_DISCLAIMER,
    createdAt: clock.createdAt,
  };
  return Object.freeze({
    ...base,
    reportSections: buildBirthdayReportSections(base),
  });
}

export function analyzeSequenceV2(input) {
  const clock = requireClock(input);
  const inputType = input.inputType ?? "custom_sequence";
  if (!["phone_number", "vehicle_address", "custom_sequence"].includes(inputType)) {
    throw new Error("不支援的序列分析類型。");
  }
  const ruleSet = resolveRuleSet(input.ruleSet ?? input.ruleSetId ?? DEFAULT_RULE_SET.id, input.ruleOverrides);
  const magneticFieldResult = analyzeMagneticSequence(input.value, {
    inputType,
    ruleSet,
    symbolMode: input.symbolMode,
    maskedInput: maskSequence(input.value, inputType),
  });
  const base = {
    schemaVersion: 1,
    id: createAnalysisId(inputType, clock.createdAt, input.id),
    inputType,
    maskedInput: magneticFieldResult.maskedInput,
    normalizedInput: magneticFieldResult.normalizedInput,
    ruleSetId: ruleSet.id,
    ruleSet,
    calculationSteps: Object.freeze([
      Object.freeze({
        id: "alphabet-sequence",
        label: "英數轉換",
        text: `${magneticFieldResult.conversion.normalized} → ${magneticFieldResult.normalizedSequence}`,
      }),
      ...magneticFieldResult.pairs.map((pair, index) => Object.freeze({
        id: `pair-${index + 1}`,
        label: `第 ${index + 1} 組`,
        text: `${pair.rawPair} → ${pair.fieldType ?? "未分類"}`,
      })),
      ...magneticFieldResult.bridges.map((bridge, index) => Object.freeze({
        id: `bridge-${index + 1}`,
        label: `0／5 橋接 ${index + 1}`,
        text: bridge.explanation,
      })),
    ]),
    lifePathResult: null,
    birthdayNumberResult: null,
    birthGridResult: null,
    magneticFieldResult,
    timelineResult: null,
    dominantField: magneticFieldResult.dominantField,
    warnings: magneticFieldResult.warnings,
    disclaimer: NUMEROLOGY_DISCLAIMER,
    createdAt: clock.createdAt,
  };
  return Object.freeze({
    ...base,
    reportSections: buildMagneticReportSections(base),
  });
}

export function analyzeIdentityV2(input) {
  const clock = requireClock(input);
  const ruleSet = resolveRuleSet(input.ruleSet ?? input.ruleSetId ?? DEFAULT_RULE_SET.id, input.ruleOverrides);
  const identity = analyzeIdentityNumber(input.value, {
    ruleSet,
    allowInvalidChecksum: input.allowInvalidChecksum,
    timelineProfile: input.timelineProfile ?? ruleSet.timelineProfile,
    timelineOptions: input.timelineOptions,
  });
  const base = {
    schemaVersion: 1,
    id: createAnalysisId("taiwan_national_id", clock.createdAt, input.id),
    inputType: "taiwan_national_id",
    maskedInput: identity.maskedInput,
    normalizedInput: identity.normalizedInput,
    ruleSetId: ruleSet.id,
    ruleSet,
    calculationSteps: Object.freeze([
      Object.freeze({
        id: "official-validation",
        label: "官方格式／檢查碼",
        text: identity.validation.message,
      }),
      Object.freeze({
        id: "folklore-letter-conversion",
        label: "民俗字母轉換",
        text: identity.conversion.explanation,
      }),
      ...identity.magnetic.pairs.map((pair, index) => Object.freeze({
        id: `pair-${index + 1}`,
        label: `第 ${index + 1} 組`,
        text: `${pair.rawPair} → ${pair.fieldType ?? "未分類"}`,
      })),
    ]),
    lifePathResult: null,
    birthdayNumberResult: null,
    birthGridResult: null,
    magneticFieldResult: identity.magnetic,
    timelineResult: identity.timeline,
    timeline: identity.timeline,
    dominantField: identity.dominantField,
    identityValidation: identity.validation,
    identityConversion: identity.conversion,
    warnings: identity.warnings,
    disclaimer: identity.disclaimer,
    createdAt: clock.createdAt,
  };
  return Object.freeze({
    ...base,
    reportSections: buildMagneticReportSections(base),
  });
}
