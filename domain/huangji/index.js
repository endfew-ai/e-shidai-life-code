import { floorDiv, floorModulo, toIntegerBigInt } from "../kangjie/math.js";
import { resolveSources } from "../kangjie/sources.js";

export const huangjiUnits = Object.freeze({
  yuan: 129600n,
  hui: 10800n,
  yun: 360n,
  shi: 30n,
});

export const huangjiEpochProfiles = Object.freeze({
  "legacy-existing-v1": Object.freeze({
    id: "legacy-existing-v1",
    label: "原程式舊版・只拆時間長度",
    epochCivilYear: null,
    epochOffsetYears: 0n,
    authority: "legacy",
    notice: "原程式沒有歷史錨點，不可冒充為傳統唯一定位。",
  }),
  "civil-era-reference-v1": Object.freeze({
    id: "civil-era-reference-v1",
    label: "西元紀年計算基準",
    epochCivilYear: 1n,
    epochOffsetYears: 0n,
    authority: "computational-reference",
    notice: "只用來示範跨西元前後且無西元 0 的可重播定位，不主張為《皇極經世》傳統錨點。",
  }),
});

export function civilYearToAstronomical(rawYear) {
  const civilYear = toIntegerBigInt(rawYear, "西元年份");
  if (civilYear === 0n) throw new Error("歷史紀年沒有西元 0 年；請使用西元前 1 年或西元 1 年。");
  return civilYear < 0n ? civilYear + 1n : civilYear;
}

export function astronomicalYearToCivil(rawYear) {
  const astronomical = typeof rawYear === "bigint" ? rawYear : BigInt(rawYear);
  return astronomical <= 0n ? astronomical - 1n : astronomical;
}

export function formatCivilYear(rawYear) {
  const civilYear = typeof rawYear === "bigint" ? rawYear : BigInt(rawYear);
  if (civilYear === 0n) throw new Error("歷史紀年沒有西元 0 年。");
  return civilYear < 0n ? `西元前 ${-civilYear} 年` : `西元 ${civilYear} 年`;
}

export function decomposeHuangjiYears(rawYears, { allowZero = false } = {}) {
  const minimum = allowZero ? 0 : 1;
  let totalYears;
  try {
    totalYears = toIntegerBigInt(rawYears, "時間長度", { minimum });
  } catch (error) {
    if (!allowZero && /不可小於 1/.test(error instanceof Error ? error.message : "")) {
      throw new Error("時間長度必須是大於 0 的完整正整數。");
    }
    throw error;
  }
  let remainder = totalYears;
  const yuan = remainder / huangjiUnits.yuan;
  remainder %= huangjiUnits.yuan;
  const hui = remainder / huangjiUnits.hui;
  remainder %= huangjiUnits.hui;
  const yun = remainder / huangjiUnits.yun;
  remainder %= huangjiUnits.yun;
  const shi = remainder / huangjiUnits.shi;
  const years = remainder % huangjiUnits.shi;
  return {
    kind: "huangji",
    mode: "duration",
    algorithmVersion: "huangji-duration-v1",
    profileId: "legacy-existing-v1",
    profileLabel: "時間長度分解",
    totalYears: totalYears.toString(),
    units: {
      yuan: yuan.toString(),
      hui: hui.toString(),
      yun: yun.toString(),
      shi: shi.toString(),
      years: years.toString(),
    },
    equation: `${totalYears} 年 = ${yuan} 元・${hui} 會・${yun} 運・${shi} 世・${years} 年`,
    sourceRefs: resolveSources(["HUANGJI-KANRIPO-01"]),
    calculationTrace: {
      schemaVersion: "huangji-calculation-trace-v1",
      ratios: { shi: "30", yun: "360", hui: "10800", yuan: "129600" },
      originalInput: { years: String(rawYears ?? "") },
      normalizedInput: { years: totalYears.toString() },
      warnings: ["這是時間單位換算，不是西元歷史定位或事件預測。"],
    },
  };
}

function resolveEpoch(input) {
  const profileId = String(input.epochProfileId || "legacy-existing-v1");
  const base = huangjiEpochProfiles[profileId];
  if (!base && profileId !== "user-custom-v1") throw new Error(`未知的元會運世錨點版本：${profileId}`);
  const epochCivilYearRaw = input.epochCivilYear ?? base?.epochCivilYear;
  if (epochCivilYearRaw === null || epochCivilYearRaw === undefined || String(epochCivilYearRaw).trim() === "") {
    throw new Error("目前版本沒有歷史錨點；請選擇計算基準或輸入自訂錨點年份。");
  }
  const epochCivilYear = toIntegerBigInt(epochCivilYearRaw, "錨點年份");
  if (epochCivilYear === 0n) throw new Error("錨點年份不可是西元 0 年。");
  const epochOffsetYears = toIntegerBigInt(input.epochOffsetYears ?? base?.epochOffsetYears ?? 0, "錨點週期位移");
  return {
    id: profileId,
    label: String(input.epochLabel || base?.label || "使用者自訂錨點"),
    epochCivilYear,
    epochOffsetYears,
    authority: String(input.epochAuthority || base?.authority || "user"),
    notice: String(input.epochNotice || base?.notice || "使用者提供的錨點；請依師承或版本自行核對。"),
  };
}

function yearsToNext(offset, unit) {
  const remainder = floorModulo(offset, unit);
  return (remainder === 0n ? unit : unit - remainder).toString();
}

export function calculateHuangjiPosition(input) {
  const targetCivilYear = toIntegerBigInt(input.targetCivilYear, "目標年份");
  if (targetCivilYear === 0n) throw new Error("目標年份不可是西元 0 年。");
  const epoch = resolveEpoch(input);
  const targetAstronomical = civilYearToAstronomical(targetCivilYear);
  const epochAstronomical = civilYearToAstronomical(epoch.epochCivilYear);
  const elapsedYears = targetAstronomical - epochAstronomical + epoch.epochOffsetYears;
  const cycleNumber = floorDiv(elapsedYears, huangjiUnits.yuan);
  const cycleOffset = floorModulo(elapsedYears, huangjiUnits.yuan);
  let remainder = cycleOffset;
  const huiZero = remainder / huangjiUnits.hui;
  remainder %= huangjiUnits.hui;
  const yunZero = remainder / huangjiUnits.yun;
  remainder %= huangjiUnits.yun;
  const shiZero = remainder / huangjiUnits.shi;
  const yearZero = remainder % huangjiUnits.shi;

  return {
    kind: "huangji",
    mode: "position",
    algorithmVersion: "huangji-epoch-position-v1",
    profileId: epoch.id,
    profileLabel: epoch.label,
    targetCivilYear: targetCivilYear.toString(),
    targetLabel: formatCivilYear(targetCivilYear),
    epoch: {
      civilYear: epoch.epochCivilYear.toString(),
      label: formatCivilYear(epoch.epochCivilYear),
      offsetYears: epoch.epochOffsetYears.toString(),
      authority: epoch.authority,
      notice: epoch.notice,
    },
    elapsedYears: elapsedYears.toString(),
    cycleNumber: cycleNumber.toString(),
    cycleOffset: cycleOffset.toString(),
    position: {
      hui: (huiZero + 1n).toString(),
      yun: (yunZero + 1n).toString(),
      shi: (shiZero + 1n).toString(),
      year: (yearZero + 1n).toString(),
    },
    yearsToNextBoundary: {
      shi: yearsToNext(cycleOffset, huangjiUnits.shi),
      yun: yearsToNext(cycleOffset, huangjiUnits.yun),
      hui: yearsToNext(cycleOffset, huangjiUnits.hui),
      yuan: yearsToNext(cycleOffset, huangjiUnits.yuan),
    },
    equation: `${formatCivilYear(targetCivilYear)} − ${formatCivilYear(epoch.epochCivilYear)} + ${epoch.epochOffsetYears} = ${elapsedYears} 年；落在週期內第 ${cycleOffset + 1n} 年`,
    sourceRefs: resolveSources(["HUANGJI-KANRIPO-01"]),
    calculationTrace: {
      schemaVersion: "huangji-calculation-trace-v1",
      originalInput: { ...input },
      normalizedInput: {
        targetCivilYear: targetCivilYear.toString(),
        targetAstronomical: targetAstronomical.toString(),
        epochCivilYear: epoch.epochCivilYear.toString(),
        epochAstronomical: epochAstronomical.toString(),
        epochOffsetYears: epoch.epochOffsetYears.toString(),
      },
      ratios: { shi: "30", yun: "360", hui: "10800", yuan: "129600" },
      warnings: [epoch.notice, "序位採一基數顯示；底層位移採零基數計算。"],
    },
  };
}

export function addCivilYears(rawCivilYear, rawDelta) {
  const astronomical = civilYearToAstronomical(rawCivilYear);
  const delta = toIntegerBigInt(rawDelta, "年數位移");
  return astronomicalYearToCivil(astronomical + delta);
}
