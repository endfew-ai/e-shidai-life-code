import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCalendarHexagram,
  calculateDoubleSoundHexagram,
  calculateLongTextHexagram,
  calculateObjectHexagram,
  countHanCharacters,
  decomposeHuangjiYears,
  detectCurrentCalendarParts,
} from "../kangjie-core.js";

test("自動偵測將台北當下時間換成農曆年月日時", () => {
  const detected = detectCurrentCalendarParts(new Date("2026-07-19T02:44:00.000Z"), "Asia/Taipei");
  assert.equal(detected.gregorianLabel.includes("10:44:00"), true);
  assert.equal(detected.relatedYear, 2026);
  assert.equal(detected.yearBranch, 7);
  assert.equal(detected.yearBranchName, "午");
  assert.equal(detected.lunarMonth, 6);
  assert.equal(detected.lunarDay, 6);
  assert.equal(detected.hourBranch, 6);
  assert.equal(detected.hourBranchName, "巳");
  assert.equal(detected.lunarLabel, "農曆六月初六・午年・巳時");
  assert.match(detected.timeZoneLabel, /^Asia\/Taipei・GMT\+8$/);
});

test("自動偵測保留閏月提示並正確處理子時", () => {
  const leap = detectCurrentCalendarParts(new Date("2023-03-22T04:00:00.000Z"), "Asia/Taipei");
  const late = detectCurrentCalendarParts(new Date("2026-07-19T15:30:00.000Z"), "Asia/Taipei");
  assert.equal(leap.isLeapMonth, true);
  assert.equal(leap.lunarMonth, 2);
  assert.match(leap.lunarLabel, /^農曆閏二月初一/);
  assert.equal(late.hour24, 23);
  assert.equal(late.hourBranch, 1);
  assert.equal(late.hourBranchName, "子");
  assert.throws(() => detectCurrentCalendarParts("不是日期", "Asia/Taipei"), /裝置時間無法辨識/);
});

test("自動偵測支援冬月、臘月與跨農曆新年", () => {
  const winter = detectCurrentCalendarParts(new Date("2025-12-20T04:00:00.000Z"), "Asia/Taipei");
  const twelfth = detectCurrentCalendarParts(new Date("2026-01-19T04:00:00.000Z"), "Asia/Taipei");
  const newYear = detectCurrentCalendarParts(new Date("2026-02-17T04:00:00.000Z"), "Asia/Taipei");
  assert.deepEqual([winter.relatedYear, winter.lunarMonth, winter.lunarDay, winter.yearBranch], [2025, 11, 1, 6]);
  assert.equal(winter.lunarLabel.startsWith("農曆冬月初一・巳年"), true);
  assert.deepEqual([twelfth.relatedYear, twelfth.lunarMonth, twelfth.lunarDay, twelfth.yearBranch], [2025, 12, 1, 6]);
  assert.equal(twelfth.lunarLabel.startsWith("農曆臘月初一・巳年"), true);
  assert.deepEqual([newYear.relatedYear, newYear.lunarMonth, newYear.lunarDay, newYear.yearBranch], [2026, 1, 1, 7]);
  assert.equal(newYear.lunarLabel.startsWith("農曆正月初一・午年"), true);
});

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
