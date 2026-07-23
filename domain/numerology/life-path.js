import { DEFAULT_RULE_SET, resolveRuleSet } from "./rule-data.js";

const STANDARD_MASTER_NUMBERS = Object.freeze([11, 22, 33]);

export function parseBirthday(dateValue, todayValue) {
  const normalized = String(dateValue ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) throw new Error("請選擇完整的西元出生日期。");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!valid) throw new Error("這不是有效的西元日期，請重新確認。");

  if (todayValue !== undefined) {
    const normalizedToday = String(todayValue).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedToday)) {
      throw new Error("今天日期格式不正確。");
    }
    if (normalized > normalizedToday) throw new Error("出生日期不能晚於今天。");
  }

  return Object.freeze({
    normalized,
    year,
    month,
    day,
    originalDigits: Object.freeze(normalized.replace(/\D/g, "").split("").map(Number)),
  });
}

function preservedNumbers(ruleSet) {
  if (ruleSet.masterNumberMode === "preserve_11_22_33") return new Set(STANDARD_MASTER_NUMBERS);
  if (ruleSet.masterNumberMode === "preserve_custom") return new Set(ruleSet.customMasterNumbers);
  return new Set();
}

function reduceToSingleDigit(value) {
  let reduced = value;
  while (reduced > 9) {
    reduced = String(reduced).split("").map(Number).reduce((sum, digit) => sum + digit, 0);
  }
  return reduced;
}

export function reduceNumerologyValue(initialValue, ruleSetOrId = DEFAULT_RULE_SET.id) {
  if (!Number.isSafeInteger(initialValue) || initialValue < 0) {
    throw new RangeError("化簡值必須是非負安全整數。");
  }
  const ruleSet = resolveRuleSet(ruleSetOrId);
  const preserve = preservedNumbers(ruleSet);
  const steps = [initialValue];
  const equations = [];
  let value = initialValue;

  while (value > 9 && !preserve.has(value)) {
    const digits = String(value).split("").map(Number);
    const next = digits.reduce((sum, digit) => sum + digit, 0);
    equations.push(`${digits.join(" + ")} = ${next}`);
    value = next;
    steps.push(value);
  }

  return Object.freeze({
    initial: initialValue,
    value,
    baseNumber: reduceToSingleDigit(value),
    isMaster: preserve.has(value),
    steps: Object.freeze(steps),
    equations: Object.freeze(equations),
    text: equations.length ? `${initialValue} → ${equations.join(" → ")}` : String(initialValue),
  });
}

function reduceLegacyPart(value, ruleSet) {
  return reduceNumerologyValue(value, ruleSet);
}

export function calculateLifePath(dateValue, options = {}) {
  const ruleSet = resolveRuleSet(options.ruleSet ?? options.ruleSetId ?? DEFAULT_RULE_SET.id, options.ruleOverrides);
  const birthday = parseBirthday(dateValue, options.todayValue);
  const firstSum = birthday.originalDigits.reduce((sum, digit) => sum + digit, 0);
  const originalEquation = `${birthday.originalDigits.join(" + ")} = ${firstSum}`;

  if (ruleSet.lifePathMode === "legacy_segmented") {
    const month = reduceLegacyPart(birthday.month, ruleSet);
    const day = reduceLegacyPart(birthday.day, ruleSet);
    const year = reduceLegacyPart(birthday.year, ruleSet);
    const segmentedSum = month.value + day.value + year.value;
    const reduction = reduceNumerologyValue(segmentedSum, ruleSet);
    const segmentEquation = `${month.value} + ${day.value} + ${year.value} = ${segmentedSum}`;
    return Object.freeze({
      originalDigits: birthday.originalDigits,
      firstSum,
      reductionSteps: reduction.steps,
      lifePathNumber: reduction.value,
      baseNumber: reduceNumerologyValue(reduction.value, {
        ...DEFAULT_RULE_SET,
        masterNumberMode: "disabled",
      }).value,
      calculationText: `${originalEquation}；舊版分段：${segmentEquation}${reduction.equations.length ? ` → ${reduction.equations.join(" → ")}` : ""}`,
      ruleProfile: Object.freeze({
        ruleSetId: ruleSet.id,
        lifePathMode: ruleSet.lifePathMode,
        masterNumberMode: ruleSet.masterNumberMode,
        sourceProfile: "legacy-project-v1",
      }),
      legacyParts: Object.freeze({
        month,
        day,
        year,
        segmentedSum,
      }),
      isMaster: reduction.isMaster,
      date: birthday.normalized,
      parts: Object.freeze({ year: birthday.year, month: birthday.month, day: birthday.day }),
    });
  }

  const reduction = reduceNumerologyValue(firstSum, ruleSet);
  return Object.freeze({
    originalDigits: birthday.originalDigits,
    firstSum,
    reductionSteps: reduction.steps,
    lifePathNumber: reduction.value,
    baseNumber: reduceNumerologyValue(reduction.value, {
      ...DEFAULT_RULE_SET,
      masterNumberMode: "disabled",
    }).value,
    calculationText: `${originalEquation}${reduction.equations.length ? ` → ${reduction.equations.join(" → ")}` : ""}`,
    ruleProfile: Object.freeze({
      ruleSetId: ruleSet.id,
      lifePathMode: ruleSet.lifePathMode,
      masterNumberMode: ruleSet.masterNumberMode,
      sourceProfile: "uploaded-numerology-v2",
    }),
    legacyParts: null,
    isMaster: reduction.isMaster,
    date: birthday.normalized,
    parts: Object.freeze({ year: birthday.year, month: birthday.month, day: birthday.day }),
  });
}

export function calculateBirthdayNumber(dateValue, options = {}) {
  const ruleSet = resolveRuleSet(options.ruleSet ?? options.ruleSetId ?? DEFAULT_RULE_SET.id, options.ruleOverrides);
  const birthday = parseBirthday(dateValue, options.todayValue);
  const digits = String(birthday.day).padStart(2, "0").split("").map(Number);
  const firstSum = digits.reduce((sum, digit) => sum + digit, 0);
  const reduction = reduceNumerologyValue(firstSum, ruleSet);
  const equation = `${digits.join(" + ")} = ${firstSum}`;
  return Object.freeze({
    originalDay: birthday.day,
    originalDigits: Object.freeze(digits),
    firstSum,
    reductionSteps: reduction.steps,
    birthdayNumber: reduction.value,
    baseNumber: reduceNumerologyValue(reduction.value, {
      ...DEFAULT_RULE_SET,
      masterNumberMode: "disabled",
    }).value,
    calculationText: `${equation}${reduction.equations.length ? ` → ${reduction.equations.join(" → ")}` : ""}`,
    isMaster: reduction.isMaster,
    ruleProfile: Object.freeze({
      ruleSetId: ruleSet.id,
      masterNumberMode: ruleSet.masterNumberMode,
      sourceProfile: ruleSet.id === "legacy-project-v1" ? "legacy-project-v1" : "uploaded-numerology-v2",
    }),
  });
}

export function calculatePersonalYear(dateValue, targetYear, options = {}) {
  if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9999) {
    throw new Error("流年年份必須是 1 到 9999 的整數。");
  }
  const birthday = parseBirthday(dateValue, options.todayValue);
  const initial = birthday.month + birthday.day + targetYear;
  const disabledRuleSet = {
    ...DEFAULT_RULE_SET,
    id: "personal-year-calendar-legacy-v1",
    name: "生日個人流年既有規則",
    masterNumberMode: "disabled",
  };
  const reduction = reduceNumerologyValue(initial, disabledRuleSet);
  return Object.freeze({
    year: targetYear,
    initial,
    personalYearNumber: reduction.value,
    reductionSteps: reduction.steps,
    calculationText: `${birthday.month} + ${birthday.day} + ${targetYear} = ${initial}${reduction.equations.length ? ` → ${reduction.equations.join(" → ")}` : ""}`,
    ruleProfile: Object.freeze({
      id: "personal-year-calendar-legacy-v1",
      sourceProfile: "legacy-project-v1",
      masterNumberMode: "disabled",
    }),
  });
}
