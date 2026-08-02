export const cwaCalendarOracle = Object.freeze({
  sourceId: "CWA-CALENDAR-01",
  datasetId: "A-A0087-001",
  solarTermDatasetId: "A-A0087-003",
  version: "cwa-annual-calendar-2023-2028-v1",
  notice: "只保存演算法邊界所需的官方立春時刻與固定測試點；正式農曆日期仍由支援 chinese calendar 的 Intl 或人工輸入提供。",
  lichunInstants: Object.freeze({
    // 中央氣象署年度日曆資料，均為臺灣時間（UTC+8）。
    2023: "2023-02-04T02:43:00.000Z", // 02/04 10:43
    2024: "2024-02-04T08:27:00.000Z", // 02/04 16:27
    2025: "2025-02-03T14:10:00.000Z", // 02/03 22:10
    2026: "2026-02-03T20:02:00.000Z",
    2027: "2027-02-04T01:46:00.000Z", // 02/04 09:46
    2028: "2028-02-04T07:31:00.000Z", // 02/04 15:31
  }),
  annualCalendarSources: Object.freeze([
    Object.freeze({ year: 2023, url: "https://www.cwa.gov.tw/Data/astronomy/2023cal.pdf", published: "2022-02" }),
    Object.freeze({ year: 2024, url: "https://www.cwa.gov.tw/Data/astronomy/2024cal.pdf", published: "2023-02" }),
    Object.freeze({ year: 2025, url: "https://www.cwa.gov.tw/Data/astronomy/2025cal.pdf", published: "2024-02" }),
    Object.freeze({ year: 2026, url: "https://www.cwa.gov.tw/Data/astronomy/2026cal.pdf", published: "2025-02" }),
    Object.freeze({ year: 2027, url: "https://www.cwa.gov.tw/Data/astronomy/2027cal.pdf", published: "2026-02" }),
    Object.freeze({
      year: 2028,
      url: "https://www.cwa.gov.tw/Data/astronomy/2028cal.pdf",
      detailSourceUrl: "https://www.cwa.gov.tw/Data/astronomy/2027cal.pdf",
      published: "2026-02",
      note: "2028 日期由 2028 年日曆核對；立春 15:31 交節時刻列於 2027 年日曆第 2 頁的次年節氣附表。",
    }),
  ]),
  testCases: Object.freeze([
    Object.freeze({ instantIso: "2023-03-22T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2023, lunarMonth: 2, lunarDay: 1, isLeapMonth: true }),
    Object.freeze({ instantIso: "2025-12-20T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2025, lunarMonth: 11, lunarDay: 1, isLeapMonth: false }),
    Object.freeze({ instantIso: "2026-01-19T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2025, lunarMonth: 12, lunarDay: 1, isLeapMonth: false }),
    Object.freeze({ instantIso: "2026-02-17T04:00:00.000Z", timeZone: "Asia/Taipei", relatedYear: 2026, lunarMonth: 1, lunarDay: 1, isLeapMonth: false }),
  ]),
});
