import { calculateIChing } from "./calculator-core.js";

export const earthlyBranches = [
  { value: 1, name: "子" },
  { value: 2, name: "丑" },
  { value: 3, name: "寅" },
  { value: 4, name: "卯" },
  { value: 5, name: "辰" },
  { value: 6, name: "巳" },
  { value: 7, name: "午" },
  { value: 8, name: "未" },
  { value: 9, name: "申" },
  { value: 10, name: "酉" },
  { value: 11, name: "戌" },
  { value: 12, name: "亥" },
];

export const huangjiUnits = {
  yuan: 129600n,
  hui: 10800n,
  yun: 360n,
  shi: 30n,
};

function integerInRange(rawValue, label, minimum, maximum) {
  const value = String(rawValue ?? "").trim();
  if (!/^\d+$/.test(value)) throw new Error(`${label}必須是 ${minimum} 至 ${maximum} 的完整正整數。`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${label}必須是 ${minimum} 至 ${maximum}。`);
  }
  return parsed;
}

function positiveBigInt(rawValue, label) {
  const value = String(rawValue ?? "").trim();
  if (!/^\d+$/.test(value) || BigInt(value) <= 0n) throw new Error(`${label}必須是大於 0 的完整正整數。`);
  return BigInt(value);
}

function branch(value) {
  return earthlyBranches[value - 1];
}

function addKangjieStructure(baseResult, method, methodLabel, trace, inputSummary) {
  let mutual = baseResult.mutual;
  let mutualSource = "original";

  // 《梅花易數》卷一另記「乾坤無互，互其變卦」。
  if (baseResult.original.hexId === 1 || baseResult.original.hexId === 2) {
    mutual = calculateIChing([
      String(baseResult.transformed.upperId),
      String(baseResult.transformed.lowerId),
      "1",
    ]).mutual;
    mutualSource = "transformed";
  }

  const lowerIsUse = baseResult.moving.index < 3;
  return {
    ...baseResult,
    kind: "kangjie",
    method,
    methodLabel,
    mutual,
    mutualSource,
    roles: {
      body: lowerIsUse ? baseResult.original.upper : baseResult.original.lower,
      use: lowerIsUse ? baseResult.original.lower : baseResult.original.upper,
      note: lowerIsUse ? "動爻在下卦，下卦為用，上卦為體。" : "動爻在上卦，上卦為用，下卦為體。",
    },
    trace,
    inputSummary,
  };
}

function calculateFromTotals({ method, methodLabel, upperTotal, lowerTotal, movingTotal, trace, inputSummary }) {
  const baseResult = calculateIChing([
    String(upperTotal),
    String(lowerTotal),
    String(movingTotal),
  ]);
  return addKangjieStructure(baseResult, method, methodLabel, trace, inputSummary);
}

export function calculateCalendarHexagram({ yearBranch, lunarMonth, lunarDay, hourBranch }) {
  const year = integerInRange(yearBranch, "年支", 1, 12);
  const month = integerInRange(lunarMonth, "農曆月", 1, 12);
  const day = integerInRange(lunarDay, "農曆日", 1, 30);
  const hour = integerInRange(hourBranch, "時支", 1, 12);
  const upperTotal = year + month + day;
  const lowerTotal = upperTotal + hour;

  return calculateFromTotals({
    method: "calendar",
    methodLabel: "年月日時起卦",
    upperTotal,
    lowerTotal,
    movingTotal: lowerTotal,
    inputSummary: `${branch(year).name}年・農曆${month}月${day}日・${branch(hour).name}時`,
    trace: [
      { label: "上卦", equation: `${year} + ${month} + ${day} = ${upperTotal}；除以 8 取餘數` },
      { label: "下卦", equation: `${upperTotal} + ${hour} = ${lowerTotal}；除以 8 取餘數` },
      { label: "動爻", equation: `${lowerTotal} 除以 6 取餘數` },
    ],
  });
}

export function calculateObjectHexagram({ count, hourBranch }) {
  const objectCount = positiveBigInt(count, "物數");
  const hour = integerInRange(hourBranch, "時支", 1, 12);
  const movingTotal = objectCount + BigInt(hour);

  return calculateFromTotals({
    method: "object",
    methodLabel: "物數起卦",
    upperTotal: objectCount,
    lowerTotal: hour,
    movingTotal,
    inputSummary: `物數 ${objectCount}・${branch(hour).name}時`,
    trace: [
      { label: "上卦", equation: `${objectCount} 除以 8 取餘數` },
      { label: "下卦", equation: `時支 ${branch(hour).name} = ${hour}；除以 8 取餘數` },
      { label: "動爻", equation: `${objectCount} + ${hour} = ${movingTotal}；除以 6 取餘數` },
    ],
  });
}

export function calculateDoubleSoundHexagram({ firstCount, secondCount, hourBranch }) {
  const first = positiveBigInt(firstCount, "第一段聲數");
  const second = positiveBigInt(secondCount, "第二段聲數");
  const hour = integerInRange(hourBranch, "時支", 1, 12);
  const movingTotal = first + second + BigInt(hour);

  return calculateFromTotals({
    method: "sound",
    methodLabel: "雙段聲數起卦",
    upperTotal: first,
    lowerTotal: second,
    movingTotal,
    inputSummary: `第一段 ${first} 聲・第二段 ${second} 聲・${branch(hour).name}時`,
    trace: [
      { label: "上卦", equation: `第一段 ${first} 聲；除以 8 取餘數` },
      { label: "下卦", equation: `第二段 ${second} 聲；除以 8 取餘數` },
      { label: "動爻", equation: `${first} + ${second} + ${hour} = ${movingTotal}；除以 6 取餘數` },
    ],
  });
}

export function countHanCharacters(rawText) {
  return [...String(rawText ?? "")].filter((character) => /\p{Script=Han}/u.test(character)).length;
}

export function calculateLongTextHexagram(rawText) {
  const text = String(rawText ?? "");
  const count = countHanCharacters(text);
  if (count < 11 || count > 100) throw new Error("字數法只接受 11 至 100 個漢字；空格、標點、數字及符號不計入。");
  const upperCount = Math.floor(count / 2);
  const lowerCount = Math.ceil(count / 2);

  return calculateFromTotals({
    method: "text",
    methodLabel: "十一字以上字數起卦",
    upperTotal: upperCount,
    lowerTotal: lowerCount,
    movingTotal: count,
    inputSummary: `共 ${count} 個漢字・上組 ${upperCount} 字・下組 ${lowerCount} 字`,
    trace: [
      { label: "字數", equation: `只計漢字，共 ${count} 字` },
      { label: "上下卦", equation: `上組 ${upperCount} 字；下組 ${lowerCount} 字` },
      { label: "動爻", equation: `${upperCount} + ${lowerCount} = ${count}；除以 6 取餘數` },
    ],
  });
}

export function decomposeHuangjiYears(rawYears) {
  const totalYears = positiveBigInt(rawYears, "時間長度");
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
    totalYears: totalYears.toString(),
    units: {
      yuan: yuan.toString(),
      hui: hui.toString(),
      yun: yun.toString(),
      shi: shi.toString(),
      years: years.toString(),
    },
    equation: `${totalYears} 年 = ${yuan} 元・${hui} 會・${yun} 運・${shi} 世・${years} 年`,
  };
}
