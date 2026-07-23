import {
  DEFAULT_RULE_SET,
  FIELD_COMBINATION_RULES,
  MAGNETIC_FIELD_INTERPRETATIONS,
  MAGNETIC_FIELD_MAP,
  resolveRuleSet,
} from "./rule-data.js";

const BASE_DIGITS = new Set(["1", "2", "3", "4", "6", "7", "8", "9"]);
const MODIFIER_DIGITS = new Set(["0", "5"]);

function freezeSourceMap(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

export function alphabetToSequentialDigits(rawValue, options = {}) {
  const symbolMode = options.symbolMode ?? "skip_spaces_hyphens";
  if (!["skip_spaces_hyphens", "skip_all", "error"].includes(symbolMode)) {
    throw new Error("符號處理模式不受支援。");
  }
  const raw = String(rawValue ?? "");
  const normalized = raw.toUpperCase();
  let digits = "";
  const sourceMap = [];
  const skippedCharacters = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (/[A-Z]/.test(character)) {
      const converted = String(character.charCodeAt(0) - 64).padStart(2, "0");
      for (const digit of converted) {
        digits += digit;
        sourceMap.push({ outputIndex: digits.length - 1, sourceIndex: index, sourceCharacter: raw[index], normalizedCharacter: character });
      }
      continue;
    }
    if (/\d/.test(character)) {
      digits += character;
      sourceMap.push({ outputIndex: digits.length - 1, sourceIndex: index, sourceCharacter: raw[index], normalizedCharacter: character });
      continue;
    }

    const isDefaultSkippable = /[\s-]/.test(character);
    if (symbolMode === "skip_all" || (symbolMode === "skip_spaces_hyphens" && isDefaultSkippable)) {
      skippedCharacters.push({ sourceIndex: index, sourceCharacter: raw[index] });
      continue;
    }
    throw new Error(`不支援的符號「${raw[index]}」；預設只會略過空格與半形連字號。`);
  }

  if (!digits) throw new Error("請輸入至少一個英文字母或數字。");
  return Object.freeze({
    raw,
    normalized,
    digits,
    sourceMap: freezeSourceMap(sourceMap),
    skippedCharacters: freezeSourceMap(skippedCharacters),
    rule: "A=01、B=02，依序至 Z=26；此為民俗轉換，不是身分證官方驗證碼轉換。",
  });
}

function modifierFor(digit, index) {
  return Object.freeze({
    digit,
    index,
    effect: digit === "0" ? "hidden" : "amplified",
    label: digit === "0" ? "內隱／弱化" : "加強／顯化",
  });
}

function pairSourceCharacters(sourceMap, startIndex, endIndex) {
  const unique = [];
  const seen = new Set();
  for (const entry of sourceMap.slice(startIndex, endIndex + 1)) {
    const key = `${entry.sourceIndex}:${entry.sourceCharacter}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(Object.freeze({ sourceIndex: entry.sourceIndex, character: entry.sourceCharacter }));
    }
  }
  return Object.freeze(unique);
}

function createDirectPair(digits, sourceMap, startIndex) {
  const endIndex = startIndex + 1;
  const rawPair = digits.slice(startIndex, endIndex + 1);
  const fieldType = MAGNETIC_FIELD_MAP[rawPair] ?? null;
  const modifiers = [...rawPair].flatMap((digit, offset) =>
    MODIFIER_DIGITS.has(digit) ? [modifierFor(digit, startIndex + offset)] : []);
  return Object.freeze({
    kind: "adjacent",
    startIndex,
    endIndex,
    rawPair,
    basePair: fieldType ? rawPair : null,
    sourceCharacters: pairSourceCharacters(sourceMap, startIndex, endIndex),
    fieldType,
    modifiers: Object.freeze(modifiers),
    confidence: fieldType ? 1 : 0,
    explanation: fieldType
      ? `${rawPair} 對應 ${fieldType}；屬近代民俗磁場分類。`
      : `${rawPair} 含 0 或 5，未直接列入 64 組八大磁場。`,
  });
}

function createBridgePair(digits, sourceMap, startIndex, endIndex) {
  const rawPair = digits.slice(startIndex, endIndex + 1);
  const basePair = `${digits[startIndex]}${digits[endIndex]}`;
  const fieldType = MAGNETIC_FIELD_MAP[basePair] ?? null;
  const modifiers = [];
  for (let index = startIndex + 1; index < endIndex; index += 1) {
    modifiers.push(modifierFor(digits[index], index));
  }
  return Object.freeze({
    kind: "bridge",
    startIndex,
    endIndex,
    rawPair,
    basePair,
    sourceCharacters: pairSourceCharacters(sourceMap, startIndex, endIndex),
    fieldType,
    modifiers: Object.freeze(modifiers),
    modifierChain: Object.freeze(modifiers.map(({ digit, effect, label, index }) => Object.freeze({ digit, effect, label, index }))),
    confidence: fieldType ? 0.75 : 0,
    explanation: fieldType
      ? `保留原始 ${rawPair}；流派橋接外側 ${basePair} 為 ${fieldType}，中間修飾依序為 ${modifiers.map(({ label }) => label).join("、")}。`
      : `原始 ${rawPair} 的外側 ${basePair} 無法形成已知磁場，標記為 unresolved。`,
  });
}

function findBridgePairs(digits, sourceMap) {
  const bridges = [];
  let index = 0;
  while (index < digits.length) {
    if (!BASE_DIGITS.has(digits[index])) {
      index += 1;
      continue;
    }
    let cursor = index + 1;
    while (cursor < digits.length && MODIFIER_DIGITS.has(digits[cursor])) cursor += 1;
    if (cursor > index + 1 && cursor < digits.length && BASE_DIGITS.has(digits[cursor])) {
      bridges.push(createBridgePair(digits, sourceMap, index, cursor));
    }
    index = Math.max(index + 1, cursor);
  }
  return Object.freeze(bridges);
}

function findStandaloneModifiers(digits, bridges) {
  const bridgedModifierIndexes = new Set();
  for (const bridge of bridges) {
    for (let index = bridge.startIndex + 1; index < bridge.endIndex; index += 1) {
      bridgedModifierIndexes.add(index);
    }
  }
  const modifiers = [];
  for (let index = 0; index < digits.length; index += 1) {
    const digit = digits[index];
    if (!MODIFIER_DIGITS.has(digit)) continue;
    if (bridgedModifierIndexes.has(index)) continue;
    const hasBaseLeft = index > 0 && BASE_DIGITS.has(digits[index - 1]);
    const hasBaseRight = index + 1 < digits.length && BASE_DIGITS.has(digits[index + 1]);
    if (!hasBaseLeft || !hasBaseRight) {
      modifiers.push(Object.freeze({
        ...modifierFor(digit, index),
        kind: "standalone_modifier",
        status: "unresolved",
        explanation: `${digit} 在此位置沒有可直接確認的左右基礎數字，不強行判定磁場。`,
      }));
    }
  }
  return Object.freeze(modifiers);
}

export function calculateDominantFields(records) {
  const counts = {};
  for (const record of records) {
    if (record.fieldType) counts[record.fieldType] = (counts[record.fieldType] ?? 0) + 1;
  }
  const highestCount = Math.max(0, ...Object.values(counts));
  const fields = Object.keys(counts).filter((field) => counts[field] === highestCount);
  return Object.freeze({
    counts: Object.freeze(counts),
    highestCount,
    fields: Object.freeze(fields),
    label: fields.length ? `主要出現磁場：${fields.join("、")}` : "主要出現磁場：尚無可分類配對",
  });
}

function matchCombinationRules(records) {
  const classified = records.filter((record) => record.fieldType);
  const matches = [];
  for (let index = 0; index < classified.length - 1; index += 1) {
    const current = classified[index].fieldType;
    const next = classified[index + 1].fieldType;
    for (const rule of FIELD_COMBINATION_RULES) {
      if (!rule.enabled || rule.matchMode !== "adjacent_unordered") continue;
      const matchesForward = rule.currentField === current && rule.nextField === next;
      const matchesReverse = rule.currentField === next && rule.nextField === current;
      if (!matchesForward && !matchesReverse) continue;
      matches.push(Object.freeze({
        ...rule,
        startRecordIndex: index,
        observedFields: Object.freeze([current, next]),
      }));
    }
  }
  return Object.freeze(matches);
}

export function analyzeSlidingPairs(sequence, profile = {}) {
  const conversion = typeof sequence === "string"
    ? alphabetToSequentialDigits(sequence, { symbolMode: profile.symbolMode })
    : sequence;
  if (!conversion || typeof conversion.digits !== "string" || !Array.isArray(conversion.sourceMap)) {
    throw new Error("滑動配對需要有效的數字序列。");
  }
  const digits = conversion.digits;
  if (digits.length < 2) throw new Error("至少需要兩位數字才能建立相鄰配對。");
  const ruleSet = resolveRuleSet(profile.ruleSet ?? profile.ruleSetId ?? DEFAULT_RULE_SET.id, profile.ruleOverrides);

  const pairs = Object.freeze(Array.from(
    { length: digits.length - 1 },
    (_, index) => createDirectPair(digits, conversion.sourceMap, index),
  ));
  const bridges = ruleSet.zeroFiveMode === "bridge_modifier"
    ? findBridgePairs(digits, conversion.sourceMap)
    : Object.freeze([]);
  const standaloneModifiers = findStandaloneModifiers(digits, bridges);
  const resolvedRecords = Object.freeze(
    [...pairs.filter((pair) => pair.fieldType), ...bridges.filter((bridge) => bridge.fieldType)]
      .sort((left, right) => left.startIndex - right.startIndex || left.endIndex - right.endIndex),
  );
  const warnings = [];
  if (ruleSet.zeroFiveMode === "legacy_project") {
    warnings.push("舊專案沒有 0／5 磁場公式；為避免捏造，含 0／5 的組合維持未分類。");
  }

  return Object.freeze({
    normalizedSequence: digits,
    sourceMap: conversion.sourceMap,
    zeroFiveMode: ruleSet.zeroFiveMode,
    pairs,
    bridges,
    standaloneModifiers,
    resolvedRecords,
    dominantField: calculateDominantFields(resolvedRecords),
    combinationMatches: matchCombinationRules(resolvedRecords),
    warnings: Object.freeze(warnings),
    sourceProfile: "uploaded-numerology-v2",
    disclaimer: "八大磁場與 0／5 修飾屬近代民俗流派規則，不是科學定律、醫療或風險預測。",
  });
}

export function analyzeMagneticSequence(rawValue, options = {}) {
  const conversion = alphabetToSequentialDigits(rawValue, { symbolMode: options.symbolMode });
  const result = analyzeSlidingPairs(conversion, options);
  const fieldSummaries = Object.freeze(Object.entries(result.dominantField.counts).map(([fieldType, count]) =>
    Object.freeze({
      fieldType,
      count,
      interpretation: MAGNETIC_FIELD_INTERPRETATIONS[fieldType],
    })));
  return Object.freeze({
    inputType: options.inputType ?? "custom_sequence",
    maskedInput: options.maskedInput ?? conversion.normalized,
    normalizedInput: conversion.normalized,
    conversion,
    ...result,
    fieldSummaries,
  });
}
