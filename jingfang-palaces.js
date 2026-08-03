import { hexagramTable, trigrams } from "./calculator-core.js";

/**
 * 京房八宮的世次依六爻自下而上（初爻到上爻）變化。
 * changedLineIndexes 使用 0 起算，0 代表初爻、5 代表上爻。
 */
export const JINGFANG_STAGES = Object.freeze([
  Object.freeze({ id: "base", label: "本宮", heading: "本宮（六世）", changedLineIndexes: Object.freeze([]) }),
  Object.freeze({ id: "first", label: "一世", heading: "一世", changedLineIndexes: Object.freeze([0]) }),
  Object.freeze({ id: "second", label: "二世", heading: "二世", changedLineIndexes: Object.freeze([0, 1]) }),
  Object.freeze({ id: "third", label: "三世", heading: "三世", changedLineIndexes: Object.freeze([0, 1, 2]) }),
  Object.freeze({ id: "fourth", label: "四世", heading: "四世", changedLineIndexes: Object.freeze([0, 1, 2, 3]) }),
  Object.freeze({ id: "fifth", label: "五世", heading: "五世", changedLineIndexes: Object.freeze([0, 1, 2, 3, 4]) }),
  Object.freeze({ id: "wandering", label: "遊魂", heading: "遊魂", changedLineIndexes: Object.freeze([0, 1, 2, 4]) }),
  Object.freeze({ id: "returning", label: "歸魂", heading: "歸魂", changedLineIndexes: Object.freeze([4]) }),
]);

/**
 * 顯示次序配合使用者提供的完整表；典籍常見編次另見來源說明。
 */
export const JINGFANG_PALACES = Object.freeze([
  Object.freeze({ trigramId: 1, palace: "乾宮", trigram: "乾", element: "金" }),
  Object.freeze({ trigramId: 6, palace: "坎宮", trigram: "坎", element: "水" }),
  Object.freeze({ trigramId: 7, palace: "艮宮", trigram: "艮", element: "土" }),
  Object.freeze({ trigramId: 4, palace: "震宮", trigram: "震", element: "木" }),
  Object.freeze({ trigramId: 5, palace: "巽宮", trigram: "巽", element: "木" }),
  Object.freeze({ trigramId: 3, palace: "離宮", trigram: "離", element: "火" }),
  Object.freeze({ trigramId: 8, palace: "坤宮", trigram: "坤", element: "土" }),
  Object.freeze({ trigramId: 2, palace: "兌宮", trigram: "兌", element: "金" }),
]);

export const JINGFANG_SOURCE_ORDER = Object.freeze(["乾宮", "震宮", "坎宮", "艮宮", "坤宮", "巽宮", "離宮", "兌宮"]);

export const JINGFANG_SOURCES = Object.freeze([
  Object.freeze({
    id: "jing-shi-yi-zhuan-siku",
    title: "《京氏易傳》（四庫全書本）",
    organization: "維基文庫轉錄",
    url: "https://zh.wikisource.org/zh/%E4%BA%AC%E6%B0%8F%E6%98%93%E5%82%B3_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%85%A8%E8%A6%BD",
    scope: "八宮分組與每宮一純卦統七變卦",
  }),
  Object.freeze({
    id: "gao-jiyi-jingshi-yizhuan",
    title: "〈論三卷本《京氏易傳》，兼及京房的六日七分說〉",
    organization: "中央研究院中國文哲研究所",
    url: "https://www.litphil.sinica.edu.tw/bulletin/33/33-205-251.pdf",
    scope: "八宮完整表、世次與遊魂歸魂變爻規則",
  }),
  Object.freeze({
    id: "ctext-book-of-changes",
    title: "《周易》通行卦序",
    organization: "中國哲學書電子化計劃",
    url: "https://ctext.org/book-of-changes/zh",
    scope: "六十四卦名稱與通行卦序核對",
  }),
]);

const TRIGRAM_BY_LINES = new Map(
  Object.values(trigrams).map((trigram) => [trigram.lines.join(","), trigram.id]),
);
const HEXAGRAM_BY_PAIR = new Map(
  hexagramTable.map(([upperId, lowerId, hexId, name]) => [
    `${upperId}-${lowerId}`,
    Object.freeze({ upperId, lowerId, hexId, name }),
  ]),
);

function resolveHexagramFromLines(lines) {
  const lowerId = TRIGRAM_BY_LINES.get(lines.slice(0, 3).join(","));
  const upperId = TRIGRAM_BY_LINES.get(lines.slice(3, 6).join(","));
  const hexagram = HEXAGRAM_BY_PAIR.get(`${upperId}-${lowerId}`);
  if (!hexagram) throw new Error("京房八宮卦象資料不完整");
  return hexagram;
}

function buildPalaceRow(palaceDefinition) {
  const pureLines = Object.freeze([
    ...trigrams[palaceDefinition.trigramId].lines,
    ...trigrams[palaceDefinition.trigramId].lines,
  ]);
  const entries = JINGFANG_STAGES.map((stage, stageIndex) => {
    const lines = pureLines.map((value, lineIndex) => (
      stage.changedLineIndexes.includes(lineIndex) ? (value === 1 ? 0 : 1) : value
    ));
    const hexagram = resolveHexagramFromLines(lines);
    return Object.freeze({
      ...hexagram,
      symbol: String.fromCodePoint(0x4dc0 + hexagram.hexId - 1),
      palace: palaceDefinition.palace,
      palaceTrigram: palaceDefinition.trigram,
      element: palaceDefinition.element,
      stageId: stage.id,
      stage: stage.label,
      stageIndex,
      lines: Object.freeze(lines),
    });
  });
  return Object.freeze({ ...palaceDefinition, entries: Object.freeze(entries) });
}

export const JINGFANG_EIGHT_PALACES = Object.freeze(JINGFANG_PALACES.map(buildPalaceRow));

const POSITION_BY_HEXAGRAM_ID = new Map(
  JINGFANG_EIGHT_PALACES.flatMap((row) => row.entries.map((entry) => [entry.hexId, entry])),
);

export function findJingFangPalacePosition(hexagramId) {
  if (!Number.isInteger(hexagramId) || hexagramId < 1 || hexagramId > 64) {
    throw new RangeError("卦序必須是 1 到 64 的整數");
  }
  const position = POSITION_BY_HEXAGRAM_ID.get(hexagramId);
  if (!position) throw new Error(`找不到第 ${hexagramId} 卦的京房八宮位置`);
  return position;
}
