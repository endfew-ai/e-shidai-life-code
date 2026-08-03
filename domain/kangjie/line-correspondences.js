import { resolveSources } from "./sources.js";

export const LINE_CORRESPONDENCE_VERSION = "line-correspondence-v1";

export const LINE_CORRESPONDENCE_SOURCE_IDS = Object.freeze([
  "ZHOUYI-XICI-CTEXT-01",
  "ZHOUYI-ZHENGYI-CTEXT-01",
  "YIYIN-CTEXT-V6-01",
  "YIYIN-CTEXT-V8-01",
  "BUSHIQUANSHU-CTEXT-V7-01",
  "BUSHIZHENGZONG-CTEXT-01",
]);

export const EQUAL_TIME_PRESETS = Object.freeze([
  Object.freeze({ id: "day-twelve-double-hours", label: "一日十二時辰", total: 12, unit: "時辰" }),
  Object.freeze({ id: "month-thirty-days", label: "一月三十日", total: 30, unit: "日" }),
  Object.freeze({ id: "year-twelve-months", label: "一年十二月", total: 12, unit: "月" }),
  Object.freeze({ id: "six-years", label: "六年期", total: 6, unit: "年" }),
]);

const LINE_ROWS = Object.freeze([
  Object.freeze({
    position: 1,
    lineName: "初爻",
    classicStage: "發端與根本",
    stageDetail: "事情剛開始，條件尚未完全顯露。",
    body: Object.freeze({ label: "足部", detail: "承載、站立與起步的部位類象。" }),
    occupation: Object.freeze({ laterDivination: "吏人", modernAnalogy: "新進成員、第一線執行" }),
    house: Object.freeze({ label: "住宅根基、井位", zone: "內卦・宅內基礎" }),
  }),
  Object.freeze({
    position: 2,
    lineName: "二爻",
    classicStage: "展開與承接",
    stageDetail: "下卦居中，事情逐步成形；《繫辭下》稱二多譽。",
    body: Object.freeze({ label: "股、膝", detail: "腿部與膝部的部位類象。" }),
    occupation: Object.freeze({ laterDivination: "曹官", modernAnalogy: "資深執行、組長" }),
    house: Object.freeze({ label: "堂屋、灶", zone: "內卦・主要生活空間" }),
  }),
  Object.freeze({
    position: 3,
    lineName: "三爻",
    classicStage: "下卦之終",
    stageDetail: "下卦將盡，常是壓力與轉折位置；《繫辭下》稱三多凶。",
    body: Object.freeze({ label: "腹、小腹、腰、臀", detail: "腰腹與骨盆周邊的部位類象。" }),
    occupation: Object.freeze({ laterDivination: "長官", modernAnalogy: "中階主管、專案負責" }),
    house: Object.freeze({ label: "門、門位", zone: "內外銜接・門的位置類象" }),
  }),
  Object.freeze({
    position: 4,
    lineName: "四爻",
    classicStage: "上卦之始",
    stageDetail: "進入上卦且接近尊位，需審慎；《繫辭下》稱四多懼。",
    body: Object.freeze({ label: "胸、胃、乳", detail: "胸腹上段的部位類象。" }),
    occupation: Object.freeze({ laterDivination: "監司", modernAnalogy: "高階主管、副手" }),
    house: Object.freeze({ label: "戶、門戶", zone: "外卦・門戶位置類象" }),
  }),
  Object.freeze({
    position: 5,
    lineName: "五爻",
    classicStage: "居中居尊",
    stageDetail: "上卦居中居尊，責任與成果集中；《繫辭下》稱五多功。",
    body: Object.freeze({ label: "面、頸項、手", detail: "臉部、頸項與手部的部位類象。" }),
    occupation: Object.freeze({ laterDivination: "朝仕", modernAnalogy: "最高決策者、負責人" }),
    house: Object.freeze({ label: "道路", zone: "外卦・通行與外部連接" }),
  }),
  Object.freeze({
    position: 6,
    lineName: "上爻",
    classicStage: "終局與收束",
    stageDetail: "上爻為末端位置；收束、退出或轉化屬本站的階段摘要。",
    body: Object.freeze({ label: "頭、腦", detail: "頭部與腦部的部位類象。" }),
    occupation: Object.freeze({ laterDivination: "執政", modernAnalogy: "顧問、創辦人、榮譽職" }),
    house: Object.freeze({ label: "棟梁、棟宇", zone: "外卦・屋體上部類象" }),
  }),
]);

function assertPositiveFinite(rawTotal) {
  const total = Number(rawTotal);
  if (!Number.isFinite(total) || total < Number.EPSILON || total > Number.MAX_SAFE_INTEGER) {
    throw new Error(`等分時間的總量必須介於 ${Number.EPSILON} 與 ${Number.MAX_SAFE_INTEGER} 之間。`);
  }
  return total;
}

export function buildEqualTimeSegments(rawTotal, unit = "單位") {
  const total = assertPositiveFinite(rawTotal);
  const safeUnit = String(unit || "單位").trim() || "單位";
  const segments = LINE_ROWS.map((row, index) => {
    const start = index === 0 ? 0 : total * (index / 6);
    const end = index === 5 ? total : total * ((index + 1) / 6);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error("等分時間超出可安全表示的數值範圍。");
    }
    return Object.freeze({
      position: row.position,
      lineName: row.lineName,
      start,
      end,
      startFraction: Object.freeze({ numerator: index, denominator: 6 }),
      endFraction: Object.freeze({ numerator: index + 1, denominator: 6 }),
      unit: safeUnit,
      intervalRule: index === 5 ? "前閉後閉" : "前閉後開",
    });
  });
  return Object.freeze(segments);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value.toFixed(3)).toString();
}

function formatPresetSpan(position, preset) {
  const segment = buildEqualTimeSegments(preset.total, preset.unit)[position - 1];
  const ordinalStart = segment.start + 1;
  const ordinalEnd = segment.end;
  if (Number.isInteger(ordinalStart) && Number.isInteger(ordinalEnd)) {
    return ordinalStart === ordinalEnd
      ? `第 ${ordinalStart} ${preset.unit}`
      : `第 ${ordinalStart} 至 ${ordinalEnd} ${preset.unit}`;
  }
  return `${formatNumber(segment.start)} 至 ${formatNumber(segment.end)} ${preset.unit}`;
}

function timeForPosition(position) {
  const startPercent = (position - 1) * 100 / 6;
  const endPercent = position * 100 / 6;
  return Object.freeze({
    relative: `全程第 ${position}/6`,
    percent: `${formatNumber(startPercent)}% 至 ${formatNumber(endPercent)}%`,
    presets: Object.freeze(EQUAL_TIME_PRESETS.map((preset) => Object.freeze({
      id: preset.id,
      label: preset.label,
      span: formatPresetSpan(position, preset),
    }))),
    sourceTier: "modern-equal-division",
  });
}

export function buildLineCorrespondenceAnalysis(rawMovingIndex) {
  const movingIndex = Number(rawMovingIndex);
  if (!Number.isInteger(movingIndex) || movingIndex < 0 || movingIndex > 5) {
    throw new Error("動爻索引必須是 0 至 5。");
  }
  const rows = LINE_ROWS.map((row) => Object.freeze({
    ...row,
    isMoving: row.position === movingIndex + 1,
    time: timeForPosition(row.position),
    evidence: Object.freeze({
      stage: Object.freeze({ tier: "classical-derived-summary", sourceIds: Object.freeze(["ZHOUYI-XICI-CTEXT-01", "ZHOUYI-ZHENGYI-CTEXT-01"]) }),
      body: Object.freeze({ tier: "later-divination-analogy", sourceIds: Object.freeze(["YIYIN-CTEXT-V8-01"]) }),
      occupationLater: Object.freeze({ tier: "later-divination-analogy", sourceIds: Object.freeze(["YIYIN-CTEXT-V6-01"]) }),
      occupationModern: Object.freeze({ tier: "modern-analogy", sourceIds: Object.freeze([]) }),
      houseMapping: Object.freeze({ tier: "later-divination-analogy", sourceIds: Object.freeze(["BUSHIQUANSHU-CTEXT-V7-01"]) }),
      houseCaution: Object.freeze({ tier: "interpretive-caution", sourceIds: Object.freeze(["BUSHIZHENGZONG-CTEXT-01"]) }),
    }),
  }));
  return Object.freeze({
    version: LINE_CORRESPONDENCE_VERSION,
    storageOrder: "初爻至上爻",
    displayOrder: "上爻至初爻",
    activeLineNumber: movingIndex + 1,
    active: rows[movingIndex],
    rows: Object.freeze(rows),
    sources: Object.freeze(resolveSources(LINE_CORRESPONDENCE_SOURCE_IDS)),
    notices: Object.freeze([
      "爻位階段依《繫辭下》的本末、遠近與貴賤原則整理，不等同精確應期。",
      "總時間除以六是現代等分模型，非本次可核古籍所載的應期法。",
      "人體只作後世術數類象展示，不是解剖學、醫療診斷或疾病預測。",
      "現代職稱是幫助理解的類比，不是古籍原文。",
      "家宅爻位只提示觀察區域，不能脫離用神與卦中條件直接判吉凶。",
      "中國哲學書電子化計劃的術數頁面為可編輯轉錄，仍應以影印底本複核。",
    ]),
  });
}

export const LINE_CORRESPONDENCE_ROWS = LINE_ROWS;
