import { BIRTH_GRID_LINE_RULES, DEFAULT_RULE_SET, resolveRuleSet } from "./rule-data.js";
import { calculateLifePath, parseBirthday } from "./life-path.js";

export const STANDARD_BIRTH_GRID_ORDER = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);
export const LEGACY_LO_SHU_ORDER = Object.freeze([4, 9, 2, 3, 5, 7, 8, 1, 6]);

function emptyCounts() {
  return Object.fromEntries(STANDARD_BIRTH_GRID_ORDER.map((number) => [number, 0]));
}

export function evaluateBirthGridLines(counts) {
  return Object.freeze(BIRTH_GRID_LINE_RULES.map((rule) => {
    const missingNumbers = rule.numbers.filter((number) => (counts[number] ?? 0) < 1);
    const present = missingNumbers.length === 0;
    const strength = present ? Math.min(...rule.numbers.map((number) => counts[number])) : 0;
    return Object.freeze({
      lineId: rule.lineId,
      kind: rule.kind,
      numbers: rule.numbers,
      present,
      missingNumbers: Object.freeze(missingNumbers),
      strength,
      title: rule.title,
      positiveTraits: rule.positiveTraits,
      cautionTraits: rule.cautionTraits,
      sourceProfile: rule.sourceProfile,
      basis: present
        ? `${rule.numbers.join("-")} 每個數字至少出現一次；最低出現次數為 ${strength}。`
        : `缺少 ${missingNumbers.join("、")}，因此本線未成立。`,
    });
  }));
}

export function analyzeBirthGrid(dateValue, options = {}) {
  const ruleSet = resolveRuleSet(options.ruleSet ?? options.ruleSetId ?? DEFAULT_RULE_SET.id, options.ruleOverrides);
  const birthday = parseBirthday(dateValue, options.todayValue);
  const lifePath = options.lifePathResult ?? calculateLifePath(birthday.normalized, {
    ruleSet,
    todayValue: options.todayValue,
  });
  const rawDigits = birthday.originalDigits.filter((digit) => digit !== 0);
  const analysisDigits = [...rawDigits];
  const addedByLifePath = [];

  if (ruleSet.birthGridMode === "raw_plus_life_path") {
    analysisDigits.push(lifePath.baseNumber);
    addedByLifePath.push(lifePath.baseNumber);
  }

  const counts = emptyCounts();
  for (const digit of analysisDigits) {
    if (digit >= 1 && digit <= 9) counts[digit] += 1;
  }

  const lines = evaluateBirthGridLines(counts);
  const missingNumbers = STANDARD_BIRTH_GRID_ORDER.filter((number) => counts[number] === 0);
  const presentNumbers = STANDARD_BIRTH_GRID_ORDER.filter((number) => counts[number] > 0);
  const displayOrder = ruleSet.birthGridMode === "legacy_project"
    ? LEGACY_LO_SHU_ORDER
    : STANDARD_BIRTH_GRID_ORDER;

  return Object.freeze({
    mode: ruleSet.birthGridMode,
    ruleSetId: ruleSet.id,
    sourceProfile: ruleSet.birthGridMode === "legacy_project"
      ? "legacy-project-v1"
      : "uploaded-numerology-v2",
    layoutProfile: ruleSet.birthGridMode === "legacy_project" ? "legacy_lo_shu" : "standard_1_to_9",
    displayOrder,
    originalDigits: birthday.originalDigits,
    rawGridDigits: Object.freeze(rawDigits),
    analysisDigits: Object.freeze(analysisDigits),
    addedByLifePath: Object.freeze(addedByLifePath),
    counts: Object.freeze(counts),
    presentNumbers: Object.freeze(presentNumbers),
    missingNumbers: Object.freeze(missingNumbers),
    lines,
    establishedLines: Object.freeze(lines.filter((line) => line.present)),
    absentLines: Object.freeze(lines.filter((line) => !line.present)),
    zeroCount: birthday.originalDigits.filter((digit) => digit === 0).length,
    calculationText: ruleSet.birthGridMode === "raw_plus_life_path"
      ? `生日原始數字（0 不入格）：${rawDigits.join("、") || "無"}；另加入生命靈數基底 ${lifePath.baseNumber}。`
      : `生日原始數字（0 不入格）：${rawDigits.join("、") || "無"}。`,
  });
}
