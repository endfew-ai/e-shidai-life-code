export const cwaCalendarOracle = Object.freeze({
  sourceId: "CWA-CALENDAR-01",
  datasetId: "A-A0087-001",
  version: "2026-07-16-snapshot-metadata-v1",
  notice: "只保存演算法邊界所需的固定測試點；正式農曆日期仍由支援 chinese calendar 的 Intl 或人工輸入提供。",
  lichunInstants: Object.freeze({
    // 中央氣象署日曆資料的臺灣時間 2026-02-04 04:02。
    2026: "2026-02-03T20:02:00.000Z",
  }),
  testCases: Object.freeze([
    Object.freeze({ instantIso: "2023-03-22T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2023, lunarMonth: 2, lunarDay: 1, isLeapMonth: true }),
    Object.freeze({ instantIso: "2025-12-20T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2025, lunarMonth: 11, lunarDay: 1, isLeapMonth: false }),
    Object.freeze({ instantIso: "2026-01-19T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2025, lunarMonth: 12, lunarDay: 1, isLeapMonth: false }),
    Object.freeze({ instantIso: "2026-02-17T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2026, lunarMonth: 1, lunarDay: 1, isLeapMonth: false }),
  ]),
});
