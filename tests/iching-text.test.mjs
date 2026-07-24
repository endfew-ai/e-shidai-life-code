import assert from "node:assert/strict";
import test from "node:test";

import { hexagramTable, trigrams } from "../calculator-core.js";
import { ICHING_TEXT_SOURCE, getIChingText, ichingTexts } from "../iching-text.js";

test("embedded Zhouyi text covers all 64 hexagrams with six line texts and source revisions", () => {
  assert.equal(Object.keys(ichingTexts).length, 64);
  assert.equal(Object.keys(ICHING_TEXT_SOURCE.generatedFromRevisions).length, 64);
  assert.match(ICHING_TEXT_SOURCE.url, /zh\.wikisource\.org/);

  for (let id = 1; id <= 64; id += 1) {
    const record = getIChingText(id);
    const tableRecord = hexagramTable.find(([, , hexId]) => hexId === id);
    assert.equal(record.id, id);
    assert.equal(record.fullName, tableRecord[3]);
    assert.equal(record.symbol.codePointAt(0), 0x4dc0 + id - 1);
    assert.ok(record.judgment.length > 0, `第 ${id} 卦缺少卦辭`);
    assert.ok(record.tuan.length > 0, `第 ${id} 卦缺少彖傳`);
    assert.ok(record.image.length > 0, `第 ${id} 卦缺少大象`);
    assert.equal(record.lines.length, 6, `第 ${id} 卦爻辭數量錯誤`);
    assert.ok(record.lines.every((line, index) => line.position === index + 1 && line.text && line.image));
    assert.ok(Number.isInteger(record.sourceRevision) && record.sourceRevision > 0);
  }
});

test("moving-line source text aligns with deterministic sample", () => {
  const qian = getIChingText(1);
  assert.equal(qian.judgment, "元亨。利貞。");
  assert.equal(qian.lines[0].text, "初九：潛龍勿用。");
  assert.match(qian.lines[0].image, /陽在下也/);
  assert.equal(qian.special[0].text, "用九：見羣龍无首，吉。");

  const kun = getIChingText(2);
  assert.match(kun.judgment, /利西南得朋/);
  assert.match(kun.lines[5].text, /上六：龍戰于野/);
  assert.equal(kun.special[0].text, "用六：利永貞。");

  const gou = getIChingText(44);
  assert.equal(gou.fullName, "天風姤");
  assert.match(gou.lines[1].text, /^九二：包有魚/);
});

test("all 384 line texts use the same yin-yang marker as their hexagram lines", () => {
  for (const [upperId, lowerId, hexId] of hexagramTable) {
    const expectedLines = [...trigrams[lowerId].lines, ...trigrams[upperId].lines];
    const record = getIChingText(hexId);
    record.lines.forEach((line, index) => {
      const designation = line.text.split(/[：，]/u, 1)[0];
      const expectedMarker = expectedLines[index] === 1 ? "九" : "六";
      assert.ok(
        designation.includes(expectedMarker),
        `第 ${hexId} 卦第 ${index + 1} 爻應為${expectedMarker}，實際為「${line.text}」`,
      );
    });
  }
});

test("invalid hexagram IDs are rejected", () => {
  assert.throws(() => getIChingText(0), /1 到 64/);
  assert.throws(() => getIChingText(65), /1 到 64/);
});
