import assert from "node:assert/strict";
import test from "node:test";

import {
  JINGFANG_EIGHT_PALACES,
  JINGFANG_PALACES,
  JINGFANG_SOURCES,
  JINGFANG_SOURCE_ORDER,
  JINGFANG_STAGES,
  findJingFangPalacePosition,
} from "../jingfang-palaces.js";

const EXPECTED = [
  ["乾宮", "金", ["乾為天", "天風姤", "天山遯", "天地否", "風地觀", "山地剝", "火地晉", "火天大有"], [1, 44, 33, 12, 20, 23, 35, 14]],
  ["坎宮", "水", ["坎為水", "水澤節", "水雷屯", "水火既濟", "澤火革", "雷火豐", "地火明夷", "地水師"], [29, 60, 3, 63, 49, 55, 36, 7]],
  ["艮宮", "土", ["艮為山", "山火賁", "山天大畜", "山澤損", "火澤睽", "天澤履", "風澤中孚", "風山漸"], [52, 22, 26, 41, 38, 10, 61, 53]],
  ["震宮", "木", ["震為雷", "雷地豫", "雷水解", "雷風恆", "地風升", "水風井", "澤風大過", "澤雷隨"], [51, 16, 40, 32, 46, 48, 28, 17]],
  ["巽宮", "木", ["巽為風", "風天小畜", "風火家人", "風雷益", "天雷無妄", "火雷噬嗑", "山雷頤", "山風蠱"], [57, 9, 37, 42, 25, 21, 27, 18]],
  ["離宮", "火", ["離為火", "火山旅", "火風鼎", "火水未濟", "山水蒙", "風水渙", "天水訟", "天火同人"], [30, 56, 50, 64, 4, 59, 6, 13]],
  ["坤宮", "土", ["坤為地", "地雷復", "地澤臨", "地天泰", "雷天大壯", "澤天夬", "水天需", "水地比"], [2, 24, 19, 11, 34, 43, 5, 8]],
  ["兌宮", "金", ["兌為澤", "澤水困", "澤地萃", "澤山咸", "水山蹇", "地山謙", "雷山小過", "雷澤歸妹"], [58, 47, 45, 31, 39, 15, 62, 54]],
];

test("京房八宮完整表包含八宮八世且 64 卦恰好各一次", () => {
  assert.equal(JINGFANG_PALACES.length, 8);
  assert.equal(JINGFANG_STAGES.length, 8);
  assert.equal(JINGFANG_EIGHT_PALACES.length, 8);
  const entries = JINGFANG_EIGHT_PALACES.flatMap(({ entries: rowEntries }) => rowEntries);
  assert.equal(entries.length, 64);
  assert.deepEqual([...new Set(entries.map(({ hexId }) => hexId))].sort((a, b) => a - b), Array.from({ length: 64 }, (_, index) => index + 1));
  assert.equal(new Set(entries.map(({ name }) => name)).size, 64);
  assert.ok(Object.isFrozen(JINGFANG_EIGHT_PALACES));
  assert.ok(entries.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.lines)));
});

test("完整 8 乘 8 卦名與通行卦序符合校勘資料", () => {
  assert.deepEqual(JINGFANG_SOURCE_ORDER, ["乾宮", "震宮", "坎宮", "艮宮", "坤宮", "巽宮", "離宮", "兌宮"]);
  assert.deepEqual(
    JINGFANG_EIGHT_PALACES.map((row) => [
      row.palace,
      row.element,
      row.entries.map(({ name }) => name),
      row.entries.map(({ hexId }) => hexId),
    ]),
    EXPECTED,
  );
});

test("世次變爻規則採初爻至上爻儲存並正確生成遊魂與歸魂", () => {
  assert.deepEqual(JINGFANG_STAGES.map(({ changedLineIndexes }) => [...changedLineIndexes]), [
    [], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 4], [4],
  ]);
  const qian = JINGFANG_EIGHT_PALACES[0];
  assert.deepEqual(qian.entries[6].lines, [0, 0, 0, 1, 0, 1]);
  assert.deepEqual(qian.entries[7].lines, [1, 1, 1, 1, 0, 1]);
  assert.equal(qian.entries[6].symbol, "䷢");
  assert.equal(qian.entries[7].symbol, "䷍");
});

test("任一卦序可查回唯一宮別、五行與世次", () => {
  assert.deepEqual(
    (({ palace, element, stage, name }) => ({ palace, element, stage, name }))(findJingFangPalacePosition(12)),
    { palace: "乾宮", element: "金", stage: "三世", name: "天地否" },
  );
  assert.deepEqual(
    (({ palace, element, stage, name }) => ({ palace, element, stage, name }))(findJingFangPalacePosition(53)),
    { palace: "艮宮", element: "土", stage: "歸魂", name: "風山漸" },
  );
  for (let hexId = 1; hexId <= 64; hexId += 1) assert.equal(findJingFangPalacePosition(hexId).hexId, hexId);
  for (const invalid of [0, 65, 1.5, NaN, "1"]) assert.throws(() => findJingFangPalacePosition(invalid), /1 到 64 的整數/);
});

test("資料來源清楚區分八宮規則、校勘表與通行卦序", () => {
  assert.equal(JINGFANG_SOURCES.length, 3);
  assert.deepEqual(JINGFANG_SOURCES.map(({ organization }) => organization), [
    "維基文庫轉錄",
    "中央研究院中國文哲研究所",
    "中國哲學書電子化計劃",
  ]);
  for (const source of JINGFANG_SOURCES) {
    assert.equal(new URL(source.url).protocol, "https:");
    assert.ok(source.scope.length > 8);
  }
});
