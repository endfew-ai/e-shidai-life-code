import assert from "node:assert/strict";
import test from "node:test";

import {
  CHEIRO_BIRTH_COLOR_PALETTES,
  CHEIRO_COLOR_SOURCE,
  LO_SHU_ORDER,
  analyzeBirthday,
  analyzeBirthdayLegacy,
  analyzeDigitCode,
  buildBirthdayColorGuide,
  calculateIChing,
  getCheiroColorGuide,
  hexagramTable,
  reductionTrace,
} from "../calculator-core.js";

const TODAY = "2026-07-18";

test("legacy birthday analysis preserves the documented segmented master-number convention", () => {
  const cases = [
    ["1990-08-12", "3", 3, 2, 3],
    ["1980-10-22", "5", 4, 5, 6],
    ["1984-11-29", "8", 2, 4, 5],
    ["1950-05-22", "33／6", 4, 9, 1],
    ["1942-06-18", "22／4", 9, 6, 7],
    ["1985-05-01", "11／2", 1, 6, 7],
  ];

  for (const [date, lifePath, birthdayBase, attitude, personalYear] of cases) {
    const result = analyzeBirthdayLegacy(date, 2026, TODAY);
    assert.equal(result.lifePath.display, lifePath, date);
    assert.equal(result.birthday.base, birthdayBase, date);
    assert.equal(result.attitude.value, attitude, date);
    assert.equal(result.personalYear.value, personalYear, date);
  }

  const masterExample = analyzeBirthdayLegacy("1950-05-22", 2026, TODAY);
  assert.equal(masterExample.lifePath.value, 33);
  assert.equal(masterExample.lifePath.base, 6);
  assert.match(masterExample.calculations.find(({ label }) => label === "生命靈數").text, /5 \+ 22 \+ 6 = 33/);
});

test("birthday validation rejects nonexistent and future dates but accepts leap day", () => {
  assert.equal(analyzeBirthday("2024-02-29", 2026, TODAY).parts.day, 29);
  assert.throws(() => analyzeBirthday("2023-02-29", 2026, TODAY), /有效的西元日期/);
  assert.throws(() => analyzeBirthday("2025-04-31", 2026, TODAY), /有效的西元日期/);
  assert.throws(() => analyzeBirthday("2026-07-19", 2026, TODAY), /不能晚於今天/);
  assert.throws(() => analyzeBirthday(" 2026-07-19 ", 2026, TODAY), /不能晚於今天/);
  assert.throws(() => analyzeBirthday("", 2026, TODAY), /完整的西元出生日期/);
});

test("personal years always reduce to 1-9 and are deterministic for a supplied year", () => {
  const result = analyzeBirthday("1990-08-12", 2026, TODAY);
  assert.deepEqual(result.cycles.map(({ year, value }) => [year, value]), [[2025, 2], [2026, 3], [2027, 4]]);
  assert.ok(result.cycles.every(({ value }) => value >= 1 && value <= 9));
  assert.equal(reductionTrace(11, false).value, 2);
  assert.equal(reductionTrace(11, true).value, 11);
});

test("Cheiro 1 to 9 palettes preserve the documented color families and valid digital swatches", () => {
  const expectedFamilies = {
    1: ["棕色", "黃色", "金色"],
    2: ["綠色", "乳白", "白色"],
    3: ["淡紫紅", "紫羅蘭", "丁香紫"],
    4: ["藍色", "灰色", "電光藍", "半色調"],
    5: ["各種淺色", "淺灰", "白色與亮澤材質"],
    6: ["淺藍至海軍藍", "玫瑰色", "粉紅色"],
    7: ["淡綠", "白色", "淡黃與金色"],
    8: ["深灰", "深藍", "紫色與黑色"],
    9: ["紅色", "玫瑰紅", "緋紅", "粉紅", "紅紫"],
  };
  assert.deepEqual(Object.keys(CHEIRO_BIRTH_COLOR_PALETTES).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (let number = 1; number <= 9; number += 1) {
    const palette = CHEIRO_BIRTH_COLOR_PALETTES[number];
    assert.equal(palette.number, number);
    assert.deepEqual(palette.sourceFamilies, expectedFamilies[number]);
    assert.deepEqual(palette.swatches.map(({ role }) => role), ["primary", "support", "accent"]);
    assert.equal(new Set(palette.swatches.map(({ hex }) => hex)).size, 3);
    assert.ok(palette.avoidNote.trim());
    for (const swatch of palette.swatches) {
      assert.ok(swatch.name.trim());
      assert.match(swatch.hex, /^#[0-9A-F]{6}$/);
      assert.ok(swatch.sourceRelation.trim());
    }
    assert.deepEqual(Object.keys(palette.uses).sort(), ["digital", "space", "wear"]);
  }

  assert.equal(CHEIRO_COLOR_SOURCE.title, "Cheiro's Book of Numbers");
  assert.equal(new URL(CHEIRO_COLOR_SOURCE.catalogUrl).hostname, "books.google.com");
  assert.equal(new URL(CHEIRO_COLOR_SOURCE.ruleUrl).hostname, "archive.org");
  assert.equal(new URL(CHEIRO_COLOR_SOURCE.paletteUrl).hostname, "archive.org");
  assert.match(CHEIRO_COLOR_SOURCE.notice, /沒有現代 HEX/);
  assert.match(CHEIRO_COLOR_SOURCE.notice, /均為現代延伸/);
});

test("days 1 to 31 map to the documented Cheiro birth-number palettes", () => {
  const expectedByDay = [
    null,
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    1, 2, 3, 4,
  ];
  for (let day = 1; day <= 31; day += 1) {
    const direct = getCheiroColorGuide(day);
    const date = `2000-01-${String(day).padStart(2, "0")}`;
    const result = analyzeBirthdayLegacy(date, 2026, TODAY);
    assert.equal(direct.number, expectedByDay[day], `day ${day}`);
    assert.equal(direct.palette.number, expectedByDay[day], `day ${day}`);
    assert.deepEqual(result.colorGuide.traditional, direct, `day ${day}`);
    assert.equal(result.colorGuide.composition[0].mappedNumber, expectedByDay[day]);
  }
  assert.equal(getCheiroColorGuide(22).display, "22 → 2 + 2 = 4");
  assert.equal(getCheiroColorGuide(29).display, "29 → 2 + 9 = 11 → 1 + 1 = 2");
  for (const invalid of [0, 32, 1.5, NaN, "22"]) {
    assert.throws(() => getCheiroColorGuide(invalid), /1 到 31 的整數/);
  }
});

test("birth color is source-backed while life-path and attitude colors are labeled site extensions", () => {
  const guide = buildBirthdayColorGuide({ day: 29, lifePathValue: 22, attitudeValue: 11 });
  assert.deepEqual(
    guide.composition.map(({ role, label, badge, inputValue, mappedNumber, authority, selectedSwatchIndex }) => ({
      role, label, badge, inputValue, mappedNumber, authority, selectedSwatchIndex,
    })),
    [
      { role: "birth-day", label: "生日數主色", badge: "原書對照", inputValue: 29, mappedNumber: 2, authority: "cheiro-source", selectedSwatchIndex: 0 },
      { role: "life-path", label: "生命路徑延伸色", badge: "本站延伸", inputValue: 22, mappedNumber: 4, authority: "site-extension", selectedSwatchIndex: 1 },
      { role: "attitude", label: "態度數搭配色", badge: "本站延伸", inputValue: 11, mappedNumber: 2, authority: "site-extension", selectedSwatchIndex: 2 },
    ],
  );
  for (const assignment of guide.composition) {
    assert.deepEqual(
      assignment.swatch,
      CHEIRO_BIRTH_COLOR_PALETTES[assignment.mappedNumber].swatches[assignment.selectedSwatchIndex],
    );
  }
  assert.match(guide.disclaimer, /歷史數字命理/);
  assert.match(guide.disclaimer, /不是科學評估/);
  assert.match(guide.disclaimer, /不代表顏色能帶來特定結果/);
});

test("birthday color composition rejects invalid public helper inputs", () => {
  for (const invalid of [0, -1, 1.5, NaN, "11"]) {
    assert.throws(() => buildBirthdayColorGuide({ day: 1, lifePathValue: invalid, attitudeValue: 2 }), /生命路徑值必須是正安全整數/);
    assert.throws(() => buildBirthdayColorGuide({ day: 1, lifePathValue: 2, attitudeValue: invalid }), /態度數必須是正安全整數/);
  }
});

test("life-path master numbers use bases 2, 4 and 6 only for the labeled extension colors", () => {
  const cases = [
    ["1985-05-01", 11, 2, 1],
    ["1942-06-18", 22, 4, 9],
    ["1950-05-22", 33, 6, 4],
  ];
  for (const [date, master, base, birthBase] of cases) {
    const result = analyzeBirthdayLegacy(date, 2026, TODAY);
    const [birthColor, lifeColor] = result.colorGuide.composition;
    assert.equal(result.lifePath.value, master);
    assert.equal(result.lifePath.base, base);
    assert.equal(birthColor.mappedNumber, birthBase);
    assert.equal(lifeColor.inputValue, master);
    assert.equal(lifeColor.mappedNumber, base);
    assert.equal(lifeColor.swatch.role, "support");
  }
});

test("birthday colors are deterministic and isolated from other analyzers", () => {
  const first = analyzeBirthday("1984-11-29", 2026, TODAY).colorGuide;
  assert.deepEqual(analyzeBirthday("1984-11-29", 2026, TODAY).colorGuide, first);
  assert.deepEqual(analyzeBirthday("1984-11-29", 2039, TODAY).colorGuide, first);
  assert.equal(Object.hasOwn(analyzeDigitCode("123456"), "colorGuide"), false);
  assert.equal(Object.hasOwn(calculateIChing(["9", "13", "20"]), "colorGuide"), false);
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
