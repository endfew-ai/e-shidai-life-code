const baseProfile = {
  sizeMovingIncludesHour: true,
  pureHexagramMutual: "original",
  textFourToTen: "tone",
  strokeFallback: "manual-required",
};

export const calculationProfiles = Object.freeze({
  "classic-primary-v1": Object.freeze({
    ...baseProfile,
    id: "classic-primary-v1",
    label: "古籍主法",
    description: "依現行傳本主文；互卦一律由本卦第 2–4、3–5 爻取得。",
  }),
  "classic-variant-v1": Object.freeze({
    ...baseProfile,
    id: "classic-variant-v1",
    label: "古本異文（未證異法）",
    pureHexagramMutual: "transformed",
    sizeMovingIncludesHour: false,
    description: "保留「乾坤無互，互其變卦」及尺寸動爻不加時辰等流傳異法；本次未找到足以證實尺寸不加時的古本影證，結果會明確警告。",
  }),
  "modern-current-v1": Object.freeze({
    ...baseProfile,
    id: "modern-current-v1",
    label: "今本",
    description: "採現行傳本尺寸占加時辰，並使用可版本化的現代資料供應器。",
  }),
  "legacy-existing-v1": Object.freeze({
    ...baseProfile,
    id: "legacy-existing-v1",
    label: "原程式舊版",
    pureHexagramMutual: "transformed",
    description: "封存原程式既有年月日時、物數、雙段聲數、11 字以上字數法與乾坤互變卦行為。",
  }),
});

export const DEFAULT_CALCULATION_PROFILE_ID = "classic-primary-v1";

export function resolveCalculationProfile(profileOrId = DEFAULT_CALCULATION_PROFILE_ID) {
  if (typeof profileOrId === "string") {
    const profile = calculationProfiles[profileOrId];
    if (!profile) throw new Error(`未知的算法版本：${profileOrId}`);
    return profile;
  }
  if (!profileOrId || typeof profileOrId !== "object") throw new Error("使用者自訂算法必須是物件。");
  return Object.freeze({
    ...baseProfile,
    ...profileOrId,
    id: String(profileOrId.id || "user-custom-v1"),
    label: String(profileOrId.label || "使用者自訂"),
    description: String(profileOrId.description || "使用者自行設定的公式參數。"),
  });
}

export const calendarProfiles = Object.freeze({
  "taipei-lunar-new-year-v1": Object.freeze({
    id: "taipei-lunar-new-year-v1",
    label: "臺北・正月初一年界",
    timeZone: "Asia/Taipei",
    yearBoundary: "lunar-new-year",
    leapMonthRule: "same-month-number",
    ziHourDayBoundary: "civil-midnight",
  }),
  "taipei-lichun-v1": Object.freeze({
    id: "taipei-lichun-v1",
    label: "臺北・立春年界",
    timeZone: "Asia/Taipei",
    yearBoundary: "lichun",
    leapMonthRule: "same-month-number",
    ziHourDayBoundary: "civil-midnight",
  }),
  "taipei-late-zi-next-day-v1": Object.freeze({
    id: "taipei-late-zi-next-day-v1",
    label: "臺北・晚子時換日",
    timeZone: "Asia/Taipei",
    yearBoundary: "lunar-new-year",
    leapMonthRule: "same-month-number",
    ziHourDayBoundary: "late-zi-next-day",
  }),
});

export const DEFAULT_CALENDAR_PROFILE_ID = "taipei-lunar-new-year-v1";

export function resolveCalendarProfile(profileOrId = DEFAULT_CALENDAR_PROFILE_ID) {
  if (typeof profileOrId === "string") {
    const profile = calendarProfiles[profileOrId];
    if (!profile) throw new Error(`未知的曆法設定：${profileOrId}`);
    return profile;
  }
  if (!profileOrId || typeof profileOrId !== "object") throw new Error("自訂曆法設定必須是物件。");
  return Object.freeze({
    ...calendarProfiles[DEFAULT_CALENDAR_PROFILE_ID],
    ...profileOrId,
    id: String(profileOrId.id || "user-calendar-custom-v1"),
    label: String(profileOrId.label || "使用者自訂曆法"),
  });
}
