import { cwaCalendarOracle } from "./calendar-oracle.js";
import { resolveCalendarProfile } from "./profiles.js";
import { earthlyBranches } from "./shared-data.js";
import { toSafeInteger } from "./math.js";

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
  const digits = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
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

function localNumericPart(date, timeZone, type) {
  const options = type === "hour"
    ? { timeZone, hour: "2-digit", hourCycle: "h23" }
    : { timeZone, year: "numeric" };
  const rawValue = new Intl.DateTimeFormat("en-US", options).formatToParts(date).find((part) => part.type === type)?.value;
  return Number(rawValue);
}

function branch(value) {
  return earthlyBranches[value - 1];
}

function resolveLichunYear(date, timeZone, manualLichunInstantIso) {
  const civilYear = localNumericPart(date, timeZone, "year");
  const rawInstant = manualLichunInstantIso || cwaCalendarOracle.lichunInstants[civilYear];
  if (!rawInstant) {
    throw new Error(`立春年界目前沒有 ${civilYear} 年的固定節氣資料；請改用正月初一年界或手動提供立春時刻。`);
  }
  const lichun = new Date(rawInstant);
  if (Number.isNaN(lichun.getTime())) throw new Error("自訂立春時刻格式無法辨識。");
  return {
    branchYear: date.getTime() >= lichun.getTime() ? civilYear : civilYear - 1,
    lichunInstantIso: lichun.toISOString(),
    civilYear,
  };
}

export function detectCalendarParts(rawDate = new Date(), options = {}) {
  const date = rawDate instanceof Date ? new Date(rawDate.getTime()) : new Date(rawDate);
  if (Number.isNaN(date.getTime())) throw new Error("裝置時間無法辨識，請確認系統日期與時間設定。");
  const profile = resolveCalendarProfile(options.profile ?? options.calendarProfile);
  const timeZone = options.timeZone || profile.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const originalHour = localNumericPart(date, timeZone, "hour");
  if (!Number.isInteger(originalHour) || originalHour < 0 || originalHour > 23) {
    throw new Error("裝置時區無法辨識，請手動選擇時支。");
  }
  const shiftedForLateZi = profile.ziHourDayBoundary === "late-zi-next-day" && originalHour === 23;
  const lunarDate = shiftedForLateZi ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : date;

  const lunarFormatter = new Intl.DateTimeFormat("zh-TW-u-ca-chinese", {
    timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (lunarFormatter.resolvedOptions().calendar !== "chinese") {
    throw new Error("此瀏覽器不支援農曆換算，請保留手動輸入並自行核對。");
  }
  const lunarParts = lunarFormatter.formatToParts(lunarDate);
  const relatedYear = Number(lunarParts.find((part) => part.type === "relatedYear" || part.type === "year")?.value);
  const monthText = lunarParts.find((part) => part.type === "month")?.value ?? "";
  const dayText = lunarParts.find((part) => part.type === "day")?.value ?? "";
  let lunarMonth = parseLunarMonth(monthText);
  const lunarDay = parseLunarDay(dayText);
  const isLeapMonth = /^[閏闰]/.test(monthText);
  if (isLeapMonth && profile.leapMonthRule === "next-month-number") lunarMonth = lunarMonth % 12 + 1;
  if (
    !Number.isInteger(relatedYear)
    || !Number.isInteger(lunarMonth)
    || lunarMonth < 1
    || lunarMonth > 12
    || !Number.isInteger(lunarDay)
    || lunarDay < 1
    || lunarDay > 30
  ) {
    throw new Error("此瀏覽器無法完成農曆換算，請保留手動輸入並自行核對。");
  }

  const yearResolution = profile.yearBoundary === "lichun"
    ? resolveLichunYear(date, timeZone, options.lichunInstantIso)
    : { branchYear: relatedYear, lichunInstantIso: null, civilYear: localNumericPart(date, timeZone, "year") };
  const yearBranch = positiveModulo(yearResolution.branchYear - 4, 12) + 1;
  const hourBranch = Math.floor(((originalHour + 1) % 24) / 2) + 1;
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
    mode: "automatic",
    instantIso: date.toISOString(),
    timeZone,
    timeZoneLabel: offset ? `${timeZone}・${offset}` : timeZone,
    gregorianLabel,
    lunarLabel: `農曆${isLeapMonth ? "閏" : ""}${cleanMonthText}月${lunarDayLabel(lunarDay)}・${branch(yearBranch).name}年・${branch(hourBranch).name}時`,
    relatedYear,
    branchYear: yearResolution.branchYear,
    yearBranch,
    yearBranchName: branch(yearBranch).name,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    hour24: originalHour,
    hourBranch,
    hourBranchName: branch(hourBranch).name,
    calendarProfileId: profile.id,
    calendarProfileLabel: profile.label,
    yearBoundary: profile.yearBoundary,
    leapMonthRule: profile.leapMonthRule,
    ziHourDayBoundary: profile.ziHourDayBoundary,
    shiftedForLateZi,
    lichunInstantIso: yearResolution.lichunInstantIso,
    sourceIds: ["CWA-CALENDAR-01"],
    warnings: [
      "自動農曆日期由瀏覽器 Intl Chinese Calendar 轉換；中央氣象署固定資料只作邊界測試與節氣核對。",
      ...(shiftedForLateZi ? ["依目前 profile，23 時的農曆日期已換作次日。"] : []),
    ],
  };
}

export function normalizeManualCalendarParts(input, options = {}) {
  const profile = resolveCalendarProfile(options.profile ?? input.calendarProfile);
  const yearBranch = toSafeInteger(input.yearBranch, "年支", 1, 12);
  const lunarMonth = toSafeInteger(input.lunarMonth, "農曆月", 1, 12);
  const lunarDay = toSafeInteger(input.lunarDay, "農曆日", 1, 30);
  const hourBranch = toSafeInteger(input.hourBranch, "時支", 1, 12);
  return {
    mode: "manual",
    timeZone: input.timeZone || profile.timeZone,
    yearBranch,
    yearBranchName: branch(yearBranch).name,
    lunarMonth,
    lunarDay,
    isLeapMonth: Boolean(input.isLeapMonth),
    hourBranch,
    hourBranchName: branch(hourBranch).name,
    calendarProfileId: profile.id,
    calendarProfileLabel: profile.label,
    yearBoundary: profile.yearBoundary,
    leapMonthRule: profile.leapMonthRule,
    ziHourDayBoundary: profile.ziHourDayBoundary,
    sourceIds: [],
    warnings: ["此筆資料使用人工輸入，請依所選曆法與時區自行核對。"],
  };
}
