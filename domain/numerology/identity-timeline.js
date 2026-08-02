import { DEFAULT_RULE_SET, TIMELINE_PROFILES, resolveRuleSet } from "./rule-data.js";
import { alphabetToSequentialDigits, analyzeSlidingPairs } from "./magnetic-field.js";

export const TAIWAN_ID_LETTER_VALUES = Object.freeze({
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17,
  I: 34, J: 18, K: 19, L: 20, M: 21, N: 22, O: 35, P: 23,
  Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29, W: 32, X: 30,
  Y: 31, Z: 33,
});

export const TAIWAN_ID_VALIDATION_SCOPE = "format_checksum_only";

export const TAIWAN_ID_DOCUMENT_TYPES = Object.freeze({
  nationalId: "national_id",
  foreignUiNew: "foreign_ui_new",
  foreignUiLegacy: "foreign_ui_legacy",
  unsupported: "unsupported",
});

const SUPPORTED_DOCUMENT_RULES = Object.freeze({
  [TAIWAN_ID_DOCUMENT_TYPES.nationalId]: Object.freeze({
    pattern: /^[A-Z][12]\d{8}$/,
    label: "台灣國民身分證統一編號",
    formatMessage: "格式應為 1 位大寫英文字母、1 或 2、再接 8 位數字。",
    validationRule: "taiwan-national-id-checksum-v1",
    sourceIds: Object.freeze([
      "TW-GOV-SCHEMA-167",
      "TW-GAZETTE-NATIONAL-ID-CHECKSUM",
    ]),
  }),
  [TAIWAN_ID_DOCUMENT_TYPES.foreignUiNew]: Object.freeze({
    pattern: /^[A-Z][89]\d{8}$/,
    label: "新式外來人口統一證號",
    formatMessage: "新式外來人口統一證號格式應為 1 位大寫英文字母、8 或 9、再接 8 位數字。",
    validationRule: "taiwan-foreign-ui-new-checksum-v1",
    sourceIds: Object.freeze([
      "TW-GOV-SCHEMA-167",
      "TW-NIA-FOREIGN-UI",
      "TW-MOF-FOREIGN-UI-FORMAT",
    ]),
  }),
});

export function normalizeTaiwanNationalId(rawValue) {
  return String(rawValue ?? "").replace(/\s+/g, "").toUpperCase();
}

export const normalizeTaiwanIdentityDocument = normalizeTaiwanNationalId;

export function maskTaiwanNationalId(rawValue) {
  const normalized = normalizeTaiwanNationalId(rawValue);
  if (normalized.length <= 5) return "*".repeat(normalized.length);
  return `${normalized.slice(0, 3)}${"*".repeat(normalized.length - 5)}${normalized.slice(-2)}`;
}

export const maskTaiwanIdentityDocument = maskTaiwanNationalId;

export function inferTaiwanIdentityDocumentType(rawValue) {
  const normalized = normalizeTaiwanIdentityDocument(rawValue);
  if (/^[A-Z][12]\d{8}$/.test(normalized)) return TAIWAN_ID_DOCUMENT_TYPES.nationalId;
  if (/^[A-Z][89]\d{8}$/.test(normalized)) return TAIWAN_ID_DOCUMENT_TYPES.foreignUiNew;
  if (/^[A-Z][A-D]\d{8}$/.test(normalized)) return TAIWAN_ID_DOCUMENT_TYPES.foreignUiLegacy;
  return TAIWAN_ID_DOCUMENT_TYPES.unsupported;
}

function officialChecksum(normalized) {
  const letterValue = TAIWAN_ID_LETTER_VALUES[normalized[0]];
  const officialDigits = `${letterValue}${normalized.slice(1)}`.split("").map(Number);
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const weightedSum = officialDigits.reduce((sum, digit, index) => sum + digit * weights[index], 0);
  const checksumRemainder = weightedSum % 10;
  return Object.freeze({
    officialDigits: Object.freeze(officialDigits),
    checksumRemainder,
    checksumValid: checksumRemainder === 0,
  });
}

function baseValidation(normalized, documentType, detectedDocumentType, details = {}) {
  return {
    normalized,
    documentType,
    detectedDocumentType,
    validationScope: TAIWAN_ID_VALIDATION_SCOPE,
    issuanceVerified: false,
    ...details,
  };
}

export function validateTaiwanIdentityDocument(rawValue, options = {}) {
  const normalized = normalizeTaiwanIdentityDocument(rawValue);
  const requestedDocumentType = options.documentType ?? "auto";
  const allowedDocumentTypes = new Set([
    "auto",
    TAIWAN_ID_DOCUMENT_TYPES.nationalId,
    TAIWAN_ID_DOCUMENT_TYPES.foreignUiNew,
    TAIWAN_ID_DOCUMENT_TYPES.foreignUiLegacy,
  ]);
  if (!allowedDocumentTypes.has(requestedDocumentType)) {
    throw new Error("不支援的台灣證號類型。");
  }

  const detectedDocumentType = inferTaiwanIdentityDocumentType(normalized);
  const documentType = requestedDocumentType === "auto"
    ? detectedDocumentType
    : requestedDocumentType;

  if (documentType === TAIWAN_ID_DOCUMENT_TYPES.foreignUiLegacy) {
    const recognizedFormat = /^[A-Z][A-D]\d{8}$/.test(normalized);
    return Object.freeze(baseValidation(normalized, documentType, detectedDocumentType, {
      valid: false,
      supported: false,
      recognizedFormat,
      formatValid: recognizedFormat,
      checksumValid: null,
      officialDigits: null,
      checksumRemainder: null,
      message: recognizedFormat
        ? "已辨識為舊式外來人口統一證號；本工具未實作其官方檢查規則，因此不執行證號命格分析。"
        : "舊式外來人口統一證號格式應為 1 位大寫英文字母、第 2 碼 A、B、C 或 D、再接 8 位數字；本工具目前不支援其檢查規則。",
      sourceProfile: "taiwan-identity-document-official",
      validationRule: null,
      sourceIds: Object.freeze(["TW-NIA-FOREIGN-UI", "TW-MOF-FOREIGN-UI-FORMAT"]),
    }));
  }

  const rule = SUPPORTED_DOCUMENT_RULES[documentType];
  if (!rule) {
    return Object.freeze(baseValidation(normalized, TAIWAN_ID_DOCUMENT_TYPES.unsupported, detectedDocumentType, {
      valid: false,
      supported: false,
      recognizedFormat: false,
      formatValid: false,
      checksumValid: null,
      officialDigits: null,
      checksumRemainder: null,
      message: "無法辨識證號格式；請選擇國民身分證、新式外來人口統一證號，或改用自訂英數序列。",
      sourceProfile: "taiwan-identity-document-official",
      validationRule: null,
      sourceIds: Object.freeze(["TW-GOV-SCHEMA-167"]),
    }));
  }

  const formatValid = rule.pattern.test(normalized);
  if (!formatValid) {
    return Object.freeze(baseValidation(normalized, documentType, detectedDocumentType, {
      valid: false,
      supported: true,
      recognizedFormat: false,
      formatValid: false,
      checksumValid: false,
      officialDigits: null,
      checksumRemainder: null,
      message: rule.formatMessage,
      sourceProfile: "taiwan-identity-document-official",
      validationRule: rule.validationRule,
      sourceIds: rule.sourceIds,
    }));
  }

  const checksum = officialChecksum(normalized);
  return Object.freeze(baseValidation(normalized, documentType, detectedDocumentType, {
    valid: checksum.checksumValid,
    supported: true,
    recognizedFormat: true,
    formatValid: true,
    checksumValid: checksum.checksumValid,
    officialDigits: checksum.officialDigits,
    checksumRemainder: checksum.checksumRemainder,
    message: checksum.checksumValid
      ? `${rule.label}格式與檢查碼通過邏輯檢查。`
      : `${rule.label}格式正確，但檢查碼未通過。`,
    sourceProfile: "taiwan-identity-document-official",
    validationRule: rule.validationRule,
    sourceIds: rule.sourceIds,
  }));
}

export function validateTaiwanNationalId(rawValue) {
  return validateTaiwanIdentityDocument(rawValue, {
    documentType: TAIWAN_ID_DOCUMENT_TYPES.nationalId,
  });
}

function stageFromInterval(interval, pair, index, cycle = 1) {
  return Object.freeze({
    stageIndex: index,
    startAge: interval[0],
    endAge: interval[1],
    label: `${interval[0]}-${interval[1]} 歲`,
    cycle,
    pair: pair ?? null,
    status: pair ? "mapped" : "unmatched_interval",
  });
}

function timelineWarning(code, message, details = {}) {
  return Object.freeze({
    code,
    severity: "warning",
    message,
    sourceType: details.sourceType ?? "unresolved",
    canSummarize: details.canSummarize ?? false,
    ...details,
  });
}

function buildShiftedConversion(conversion, startIndex) {
  const digits = conversion.digits.slice(startIndex);
  const sourceMap = Object.freeze(conversion.sourceMap.slice(startIndex).map((entry) => Object.freeze({
    ...entry,
    outputIndex: entry.outputIndex - startIndex,
  })));
  return Object.freeze({
    ...conversion,
    digits,
    sourceMap,
    rule: "證號命格數列：字母依 A=01 至 Z=26 轉換；只有 01 至 09 的字母碼移除最前方 0。",
  });
}

function maskDigitSequence(sequence) {
  if (sequence.length <= 4) return "•".repeat(sequence.length);
  return `${sequence.slice(0, 2)}${"•".repeat(sequence.length - 4)}${sequence.slice(-2)}`;
}

export function buildIdentityDestinyProfile(conversion, options = {}) {
  if (!conversion || typeof conversion.digits !== "string" || !Array.isArray(conversion.sourceMap)) {
    throw new Error("命格數列需要有效的 A=01 民俗轉換結果。");
  }
  if (conversion.digits.length < 3 || !/^[A-Z]$/.test(conversion.normalized?.[0] ?? "")) {
    throw new Error("命格數列只適用於以英文字母開頭的身分證格式。");
  }
  const ruleSet = resolveRuleSet(options.ruleSet ?? options.ruleSetId ?? DEFAULT_RULE_SET.id, options.ruleOverrides);
  const letterSequentialValue = conversion.digits.slice(0, 2);
  const droppedLeadingZero = letterSequentialValue.startsWith("0");
  const destinyConversion = buildShiftedConversion(conversion, droppedLeadingZero ? 1 : 0);
  const magnetic = analyzeSlidingPairs(destinyConversion, { ruleSet });
  const action = droppedLeadingZero
    ? `字母碼 ${letterSequentialValue} 以 0 開頭，命格分析只移除最前方 0`
    : `字母碼 ${letterSequentialValue} 不以 0 開頭，命格分析完整保留`;
  return Object.freeze({
    status: "resolved",
    mode: "drop_leading_letter_zero",
    label: "證號命格數列",
    sourceProfile: "identity-destiny-common-practice-v1",
    letterSequentialValue,
    droppedLeadingZero,
    fullSequenceLength: conversion.digits.length,
    sequenceLength: destinyConversion.digits.length,
    maskedSequence: maskDigitSequence(destinyConversion.digits),
    calculationText: `${action}；${destinyConversion.digits.length} 位數列建立 ${magnetic.pairs.length} 個相鄰視窗。`,
    conversion: destinyConversion,
    magnetic,
  });
}

export function buildIdentityTimeline(pairRecords, timelineProfileId, options = {}) {
  if (!Array.isArray(pairRecords)) throw new Error("時間軸需要相鄰配對陣列。");
  const profile = TIMELINE_PROFILES[timelineProfileId];
  if (!profile) throw new Error("請先選擇有效的身分證流年區間版本。");
  const warnings = [];

  if (profile.unresolved) {
    const warning = timelineWarning(
      "TIMELINE_PROFILE_UNRESOLVED",
      profile.warning,
      { profileId: profile.id },
    );
    return Object.freeze({
      profileId: profile.id,
      profileLabel: profile.label,
      sourceProfile: profile.sourceProfile,
      status: "unresolved",
      stages: Object.freeze([]),
      provisionalAssignments: Object.freeze([]),
      unassignedPairs: Object.freeze([...pairRecords]),
      unassignedIntervals: Object.freeze([]),
      warnings: Object.freeze([warning]),
      cyclic: false,
      canSummarize: false,
    });
  }

  if (profile.cyclic) {
    const startAge = Number.isInteger(options.startAge) ? options.startAge : 0;
    const maxAge = Number.isInteger(options.maxAge) ? options.maxAge : 80;
    if (startAge < 0 || maxAge <= startAge || maxAge > 150) {
      throw new Error("循環時間軸年齡範圍必須介於 0 到 150 歲。");
    }
    if (pairRecords.length === 0) throw new Error("沒有可供循環的磁場配對。");
    const stages = [];
    let index = 0;
    for (let age = startAge; age < maxAge; age += 5) {
      const pairIndex = index % pairRecords.length;
      const cycle = Math.floor(index / pairRecords.length) + 1;
      stages.push(stageFromInterval(
        Object.freeze([age, Math.min(age + 5, maxAge)]),
        pairRecords[pairIndex],
        index,
        cycle,
      ));
      index += 1;
    }
    warnings.push(timelineWarning(
      "TIMELINE_CYCLIC_EXTENSION",
      "超過第一輪的區間屬延伸演算，已標示循環輪次。",
      { profileId: profile.id, sourceType: "common_practice", canSummarize: true },
    ));
    return Object.freeze({
      profileId: profile.id,
      profileLabel: profile.label,
      sourceProfile: profile.sourceProfile,
      status: "complete",
      stages: Object.freeze(stages),
      provisionalAssignments: Object.freeze(stages),
      unassignedPairs: Object.freeze([]),
      unassignedIntervals: Object.freeze([]),
      warnings: Object.freeze(warnings),
      cyclic: true,
      canSummarize: true,
    });
  }

  const stages = profile.intervals.map((interval, index) => stageFromInterval(interval, pairRecords[index], index));
  const unassignedPairs = pairRecords.slice(profile.intervals.length);
  const unassignedIntervals = profile.intervals.slice(pairRecords.length);
  let status = "complete";
  let canSummarize = true;
  if (profile.warning) {
    warnings.push(timelineWarning(
      "TIMELINE_SOURCE_WARNING",
      profile.warning,
      { profileId: profile.id },
    ));
  }
  if (profile.intervals.length !== pairRecords.length) {
    status = "mismatch";
    canSummarize = false;
    warnings.push(timelineWarning(
      "TIMELINE_PROFILE_PAIR_COUNT_MISMATCH",
      `區間共有 ${profile.intervals.length} 段，但相鄰磁場共有 ${pairRecords.length} 組；未靜默截斷。`,
      {
        profileId: profile.id,
        intervalCount: profile.intervals.length,
        pairCount: pairRecords.length,
      },
    ));
  }
  if (profile.intervals.some(([startAge, endAge]) => endAge - startAge > 13)) {
    warnings.push(timelineWarning(
      "TIMELINE_INTERVAL_DURATION_OUTLIER",
      "原始教材含明顯較長的年齡區間，本站照錄並標示，不擅自改寫。",
      { profileId: profile.id },
    ));
  }

  return Object.freeze({
    profileId: profile.id,
    profileLabel: profile.label,
    sourceProfile: profile.sourceProfile,
    status,
    stages: Object.freeze(stages),
    provisionalAssignments: Object.freeze(stages.filter((stage) => stage.pair)),
    unassignedPairs: Object.freeze(unassignedPairs),
    unassignedIntervals: Object.freeze(unassignedIntervals),
    warnings: Object.freeze(warnings),
    cyclic: false,
    canSummarize,
  });
}

export function analyzeIdentityNumber(rawValue, options = {}) {
  const ruleSet = resolveRuleSet(options.ruleSet ?? options.ruleSetId ?? DEFAULT_RULE_SET.id, options.ruleOverrides);
  const validation = validateTaiwanIdentityDocument(rawValue, {
    documentType: options.documentType ?? "auto",
  });
  if (!validation.supported) {
    throw new Error(validation.message);
  }
  if (!validation.formatValid) {
    throw new Error(`${validation.message} 若要分析其他英數序列，請改用自訂數字分析。`);
  }
  if (!validation.checksumValid && !options.allowInvalidChecksum) {
    throw new Error("證號檢查碼未通過；如確認只作自訂民俗序列分析，請勾選「仍要分析」。");
  }

  const conversion = alphabetToSequentialDigits(validation.normalized);
  const encounterMagnetic = analyzeSlidingPairs(conversion, { ruleSet });
  const destiny = buildIdentityDestinyProfile(conversion, { ruleSet });
  const timelineProfileId = options.timelineProfile ?? ruleSet.timelineProfile;
  const timeline = buildIdentityTimeline(encounterMagnetic.pairs, timelineProfileId, options.timelineOptions);
  const warnings = [];
  if (!validation.checksumValid) warnings.push("檢查碼未通過；以下只把輸入視為自訂序列，不代表有效或已配發的證號。");
  warnings.push(...new Set([
    ...destiny.magnetic.warnings,
    ...encounterMagnetic.warnings,
    ...timeline.warnings.map((warning) => typeof warning === "string" ? warning : warning.message),
  ]));

  const inputType = validation.checksumValid
    ? validation.documentType === TAIWAN_ID_DOCUMENT_TYPES.foreignUiNew
      ? "taiwan_foreign_ui_new"
      : "taiwan_national_id"
    : "unverified_taiwan_identity_sequence";

  return Object.freeze({
    kind: "identity",
    inputType,
    documentType: validation.documentType,
    validationScope: validation.validationScope,
    issuanceVerified: validation.issuanceVerified,
    maskedInput: maskTaiwanNationalId(validation.normalized),
    normalizedInput: validation.normalized,
    validation,
    conversion: Object.freeze({
      letter: validation.normalized[0],
      sequentialValue: conversion.digits.slice(0, 2),
      fullSequence: conversion.digits,
      sourceMap: conversion.sourceMap,
      explanation: `${validation.normalized[0]} = ${conversion.digits.slice(0, 2)}（民俗 A=01 順序轉換）`,
    }),
    destiny,
    destinyMagneticAnalysis: destiny.magnetic,
    lifeEventMagneticAnalysis: encounterMagnetic,
    destinyDominantField: destiny.magnetic.dominantField,
    lifeEventDominantField: encounterMagnetic.dominantField,
    magnetic: encounterMagnetic,
    encounterMagnetic,
    timeline,
    dominantField: encounterMagnetic.dominantField,
    warnings: Object.freeze(warnings),
    ruleSet,
    disclaimer: "身分證格式／檢查碼屬官方邏輯檢查；A=01、八大磁場與人生階段屬民俗文化娛樂，兩者不可混為一談。",
  });
}
