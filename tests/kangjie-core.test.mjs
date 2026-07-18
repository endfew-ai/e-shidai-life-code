import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCalendarHexagram,
  calculateDoubleSoundHexagram,
  calculateLongTextHexagram,
  calculateObjectHexagram,
  countHanCharacters,
  decomposeHuangjiYears,
} from "../kangjie-core.js";

test("年月日時重現觀梅占的固定卦象", () => {
  const result = calculateCalendarHexagram({ yearBranch: 5, lunarMonth: 12, lunarDay: 17, hourBranch: 9 });
  assert.equal(result.original.hexId, 49);
  assert.equal(result.original.name, "澤火革");
  assert.equal(result.moving.index, 0);
  assert.equal(result.transformed.hexId, 31);
  assert.equal(result.mutual.name, "天風姤");
  assert.equal(result.roles.body.name, "兌");
  assert.equal(result.roles.use.name, "離");
});

test("年月日時重現牡丹占的固定卦象", () => {
  const result = calculateCalendarHexagram({ yearBranch: 6, lunarMonth: 3, lunarDay: 16, hourBranch: 4 });
  assert.equal(result.original.name, "天風姤");
  assert.equal(result.moving.index, 4);
  assert.equal(result.transformed.name, "火風鼎");
  assert.equal(result.mutual.name, "乾為天");
});

test("物數法將八整除歸坤、六整除歸上爻", () => {
  const result = calculateObjectHexagram({ count: 8, hourBranch: 4 });
  assert.deepEqual(result.remainders, [8, 4, 6]);
  assert.equal(result.original.name, "地雷復");
  assert.equal(result.transformed.name, "山雷頤");
});

test("雙段聲數法重現一聲五聲酉時案例", () => {
  const result = calculateDoubleSoundHexagram({ firstCount: 1, secondCount: 5, hourBranch: 10 });
  assert.equal(result.original.name, "天風姤");
  assert.equal(result.moving.index, 3);
  assert.equal(result.transformed.name, "巽為風");
});

test("十一字以上只計漢字並按少上多下分組", () => {
  const text = "天地定位山澤通氣雷風相薄";
  assert.equal(countHanCharacters(`${text}，123 ABC`), 12);
  const result = calculateLongTextHexagram("天地定位山澤通氣雷風相");
  assert.equal(result.inputSummary, "共 11 個漢字・上組 5 字・下組 6 字");
  assert.equal(result.original.name, "風水渙");
  assert.equal(result.moving.index, 4);
  assert.equal(result.transformed.name, "山水蒙");
  assert.throws(() => calculateLongTextHexagram("不足十一字"), /11 至 100/);
});

test("皇極時間尺度以元會運世年分解，不綁定西元紀年", () => {
  assert.deepEqual(decomposeHuangjiYears("129600").units, { yuan: "1", hui: "0", yun: "0", shi: "0", years: "0" });
  assert.deepEqual(decomposeHuangjiYears("130000").units, { yuan: "1", hui: "0", yun: "1", shi: "1", years: "10" });
  assert.throws(() => decomposeHuangjiYears("0"), /大於 0/);
});

test("邵康節輸入欄位拒絕越界與非整數", () => {
  assert.throws(() => calculateCalendarHexagram({ yearBranch: 13, lunarMonth: 1, lunarDay: 1, hourBranch: 1 }), /年支/);
  assert.throws(() => calculateCalendarHexagram({ yearBranch: 1, lunarMonth: 2, lunarDay: 31, hourBranch: 1 }), /農曆日/);
  assert.throws(() => calculateObjectHexagram({ count: "1.5", hourBranch: 1 }), /物數/);
});
