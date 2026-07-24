export const SOURCE_REFS = Object.freeze({
  MYS_WIKI_01: Object.freeze({
    id: "MYS-WIKI-01",
    title: "《梅花易數》卷一",
    organization: "維基文庫",
    url: "https://zh.wikisource.org/zh-hant/%E6%A2%85%E8%8A%B1%E6%98%93%E6%95%B8/%E5%8D%B7%E4%B8%80",
    scope: "先天八卦數、除八除六、年月日時、物數、聲音、字占、丈尺尺寸、體用與後天端法",
    accessedOn: "2026-07-24",
  }),
  MYS_CTEXT_01: Object.freeze({
    id: "MYS-CTEXT-01",
    title: "《梅花易數》卷一",
    organization: "中國哲學書電子化計劃",
    url: "https://ctext.org/wiki.pl?chapter=867487&if=gb",
    scope: "現行傳本文字交叉核對",
    accessedOn: "2026-07-24",
  }),
  MYS_CTEXT_02: Object.freeze({
    id: "MYS-CTEXT-02",
    title: "《梅花易數》卷二",
    organization: "中國哲學書電子化計劃",
    url: "https://ctext.org/wiki.pl?chapter=475043&if=gb",
    scope: "體用與五行生剋交叉核對",
    accessedOn: "2026-07-24",
  }),
  HUANGJI_KANRIPO_01: Object.freeze({
    id: "HUANGJI-KANRIPO-01",
    title: "《皇極經世書》",
    organization: "漢籍リポジトリ Kanseki Repository",
    url: "https://www.kanripo.org/text/KR3g0006/001",
    scope: "元、會、運、世的傳本結構與尺度",
    accessedOn: "2026-07-24",
  }),
  CWA_CALENDAR_01: Object.freeze({
    id: "CWA-CALENDAR-01",
    title: "日曆資料",
    organization: "交通部中央氣象署開放資料平臺",
    url: "https://opendata.cwa.gov.tw/dataset/all/A-A0087-001",
    scope: "國曆、農曆、節氣日期時間的離線測試基準",
    accessedOn: "2026-07-24",
  }),
  UNICODE_UNIHAN_17: Object.freeze({
    id: "UNICODE-UNIHAN-17.0.0",
    title: "Unihan Database, kTotalStrokes",
    organization: "Unicode Consortium",
    url: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
    documentationUrl: "https://www.unicode.org/reports/tr38/",
    scope: "漢字總筆畫數；不是康熙筆畫，也不等同教育部標準字體筆順",
    version: "17.0.0",
    releasedOn: "2025-09-09",
    sha256: "F7A48B2B545ACFAA77B2D607AE28747404CE02BAEFEE16396C5D2D7A8EF34B5E",
  }),
  MOE_STANDARD_FONT_01: Object.freeze({
    id: "MOE-STANDARD-FONT-01",
    title: "常用國字標準字體表及筆順學習資料",
    organization: "中華民國教育部",
    url: "https://language.moe.gov.tw/material/info?m=9fe3ff5a-5a8c-4817-9e60-6337dd55a509",
    scope: "臺灣標準字體與筆順核對；未將受授權限制的 XML 重新散布於本站",
    accessedOn: "2026-07-24",
  }),
});

export function resolveSources(ids) {
  return ids.map((id) => {
    const source = Object.values(SOURCE_REFS).find((item) => item.id === id);
    if (!source) throw new Error(`找不到資料來源：${id}`);
    return source;
  });
}
