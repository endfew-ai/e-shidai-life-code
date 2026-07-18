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

const lunarMonthNumbers = new Map([
  ["正", 1], ["一", 1], ["二", 2], ["三", 3], ["四", 4], ["五", 5], ["六", 6],
  ["七", 7], ["八", 8], ["九", 9], ["十", 10], ["十一", 11], ["冬", 11],
  ["十二", 12], ["臘", 12], ["腊", 12],
]);

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

function parseLunarMonth(rawValue) {
  const value = String(rawValue ?? "").replace(/[閏闰月\s]/g, "");
  if (/^\d+$/.test(value)) return Number(value);
  return lunarMonthNumbers.get(value) ?? Number.NaN;
}

function parseLunarDay(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (/^\d+$/.test(value)) return Number(value);
  const digits = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
  if (value === "初十" || value === "十") return 10;
  if (value === "二十") return 20;
  if (value === "三十") return 30;
  const prefix = value.startsWith("初") ? 0 : value.startsWith("十") ? 10 : value.startsWith("廿") ? 20 : 0;
  const last = digits[value.at(-1)] ?? Number.NaN;
  return Number.isNaN(last) ? Number.NaN : prefix + last;
}

function lunarDayLabel(day) {
  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (day <= 9) return `初${digits[day]}`;
  if (day === 10) return "初十";
  if (day < 20) return `十${digits[day - 10]}`;
  if (day === 20) return "二十";
  if (day < 30) return `廿${digits[day - 20]}`;
  return "三十";
}

function timeZoneOffsetLabel(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("zh-TW", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function detectCurrentCalendarParts(rawDate = new Date(), requestedTimeZone = "") {
  const date = rawDate instanceof Date ? new Date(rawDate.getTime()) : new Date(rawDate);
  if (Number.isNaN(date.getTime())) throw new Error("裝置時間無法辨識，請確認系統日期與時間設定。");

  const timeZone = requestedTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const lunarFormatter = new Intl.DateTimeFormat("zh-TW-u-ca-chinese", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (lunarFormatter.resolvedOptions().calendar !== "chinese") {
    throw new Error("此瀏覽器不支援農曆換算，請保留手動輸入並自行核對。");
  }
  const lunarParts = lunarFormatter.formatToParts(date);
  const relatedYear = Number(lunarParts.find((part) => part.type === "relatedYear" || part.type === "year")?.value);
  const monthText = lunarParts.find((part) => part.type === "month")?.value ?? "";
  const dayText = lunarParts.find((part) => part.type === "day")?.value ?? "";
  const lunarMonth = parseLunarMonth(monthText);
  const lunarDay = parseLunarDay(dayText);
  if (!Number.isInteger(relatedYear) || !Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12 || !Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
    throw new Error("此瀏覽器無法完成農曆換算，請保留手動輸入並自行核對。");
  }

  const hourText = new Intl.DateTimeFormat("zh-TW", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).find((part) => part.type === "hour")?.value;
  const hour = Number(hourText);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("裝置時區無法辨識，請手動選擇時支。");

  const yearBranch = positiveModulo(relatedYear - 4, 12) + 1;
  const hourBranch = Math.floor(((hour + 1) % 24) / 2) + 1;
  const isLeapMonth = /^[閏闰]/.test(monthText);
  const cleanMonthText = monthText.replace(/^[閏闰]/, "").replace(/月$/, "");
  const offset = timeZoneOffsetLabel(date, timeZone);
  const gregorianLabel = new Intl.DateTimeFormat("zh-TW", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return {
    instantIso: date.toISOString(),
    timeZone,
    timeZoneLabel: offset ? `${timeZone}・${offset}` : timeZone,
    gregorianLabel,
    lunarLabel: `農曆${isLeapMonth ? "閏" : ""}${cleanMonthText}月${lunarDayLabel(lunarDay)}・${branch(yearBranch).name}年・${branch(hourBranch).name}時`,
    relatedYear,
    yearBranch,
    yearBranchName: branch(yearBranch).name,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    hour24: hour,
    hourBranch,
    hourBranchName: branch(hourBranch).name,
  };
}

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
