import assert from "node:assert/strict";
import test from "node:test";

import {
  LO_SHU_ORDER,
  analyzeBirthday,
  analyzeDigitCode,
  calculateIChing,
  hexagramTable,
  reductionTrace,
} from "../calculator-core.js";

const TODAY = "2026-07-18";

test("birthday analysis uses one documented segmented master-number convention", () => {
  const cases = [
    ["1990-08-12", "3", 3, 2, 3],
    ["1980-10-22", "5", 4, 5, 6],
    ["1984-11-29", "8", 2, 4, 5],
    ["1950-05-22", "33／6", 4, 9, 1],
    ["1942-06-18", "22／4", 9, 6, 7],
    ["1985-05-01", "11／2", 1, 6, 7],
  ];

  for (const [date, lifePath, birthdayBase, attitude, personalYear] of cases) {
    const result = analyzeBirthday(date, 2026, TODAY);
    assert.equal(result.lifePath.display, lifePath, date);
    assert.equal(result.birthday.base, birthdayBase, date);
    assert.equal(result.attitude.value, attitude, date);
    assert.equal(result.personalYear.value, personalYear, date);
  }

  const masterExample = analyzeBirthday("1950-05-22", 2026, TODAY);
  assert.equal(masterExample.lifePath.value, 33);
  assert.equal(masterExample.lifePath.base, 6);
  assert.match(masterExample.calculations.find(({ label }) => label === "生命路徑").text, /5 \+ 22 \+ 6 = 33/);
});

test("birthday validation rejects nonexistent and future dates but accepts leap day", () => {
  assert.equal(analyzeBirthday("2024-02-29", 2026, TODAY).parts.day, 29);
  assert.throws(() => analyzeBirthday("2023-02-29", 2026, TODAY), /有效的西元日期/);
  assert.throws(() => analyzeBirthday("2025-04-31", 2026, TODAY), /有效的西元日期/);
  assert.throws(() => analyzeBirthday("2026-07-19", 2026, TODAY), /不能晚於今天/);
  assert.throws(() => analyzeBirthday("", 2026, TODAY), /完整的西元出生日期/);
});

test("personal years always reduce to 1-9 and are deterministic for a supplied year", () => {
  const result = analyzeBirthday("1990-08-12", 2026, TODAY);
  assert.deepEqual(result.cycles.map(({ year, value }) => [year, value]), [[2025, 2], [2026, 3], [2027, 4]]);
  assert.ok(result.cycles.every(({ value }) => value >= 1 && value <= 9));
  assert.equal(reductionTrace(11, false).value, 2);
  assert.equal(reductionTrace(11, true).value, 11);
});

test("custom number analysis normalizes full-width digits without silently ignoring text", () => {
  const result = analyzeDigitCode("１２ 3-4");
  assert.deepEqual(result.digits, [1, 2, 3, 4]);
  assert.equal(result.length, 4);
  assert.equal(result.sum, 10);
  assert.equal(result.core, 1);
  assert.equal(result.counts[1], 1);
  assert.deepEqual(LO_SHU_ORDER, [4, 9, 2, 3, 5, 7, 8, 1, 6]);
  assert.throws(() => analyzeDigitCode("abc 29 xyz"), /僅接受/);
  assert.throws(() => analyzeDigitCode("0000"), /總和為 0/);
  assert.throws(() => analyzeDigitCode(""), /至少一個數字/);
});

test("three-number I Ching mode resolves the documented sample exactly", () => {
  const result = calculateIChing(["9", "13", "20"]);
  assert.deepEqual(result.remainders, [1, 5, 2]);
  assert.equal(result.original.hexId, 44);
  assert.equal(result.original.name, "天風姤");
  assert.equal(result.mutual.hexId, 1);
  assert.equal(result.transformed.hexId, 33);
  assert.equal(result.transformed.name, "天山遯");
  assert.equal(result.moving.name, "二爻");
});

test("fixed I Ching table covers 64 originals and all 384 moving-line changes", () => {
  assert.equal(hexagramTable.length, 64);
  assert.equal(new Set(hexagramTable.map(([upper, lower]) => `${upper}-${lower}`)).size, 64);
  assert.equal(new Set(hexagramTable.map(([, , id]) => id)).size, 64);

  const originals = new Set();
  let transformedChecks = 0;
  for (let upper = 1; upper <= 8; upper += 1) {
    for (let lower = 1; lower <= 8; lower += 1) {
      for (let moving = 1; moving <= 6; moving += 1) {
        const result = calculateIChing([String(upper), String(lower), String(moving)]);
        originals.add(result.original.hexId);
        assert.ok(result.mutual.hexId >= 1 && result.mutual.hexId <= 64);
        assert.ok(result.transformed.hexId >= 1 && result.transformed.hexId <= 64);
        transformedChecks += 1;
      }
    }
  }
  assert.equal(originals.size, 64);
  assert.equal(transformedChecks, 384);
});

test("three-number parser keeps huge integers exact and rejects ambiguous values", () => {
  const huge = `1${"0".repeat(200)}`;
  const result = calculateIChing([huge, `${huge}5`, `${huge}2`]);
  assert.equal(result.inputs[0], huge);
  assert.ok(result.remainders[0] >= 1 && result.remainders[0] <= 8);
  assert.throws(() => calculateIChing(["1.5", "2", "3"]), /完整整數/);
  assert.throws(() => calculateIChing(["1", "2"]), /三個整數/);
});
