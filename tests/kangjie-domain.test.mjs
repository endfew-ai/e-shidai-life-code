import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeFiveElementRelation,
  buildMeihuaResult,
  calculateChiCunMethod,
  calculatePosteriorMethod,
  calculateSegmentedSoundMethod,
  calculateSingleSoundMethod,
  calculateSurnameAdditionMethod,
  calculateTextMethod,
  calculateZhangChiMethod,
  detectCalendarParts,
  findObjectTrigramCandidates,
  mod1,
  normalizeManualCalendarParts,
  resolveCalendarProfile,
} from "../domain/kangjie/index.js";
import {
  addCivilYears,
  astronomicalYearToCivil,
  calculateHuangjiPosition,
  civilYearToAstronomical,
  decomposeHuangjiYears,
  formatCivilYear,
} from "../domain/huangji/index.js";
import {
  calculateIChing,
  hexagramTable,
  trigrams,
} from "../calculator-core.js";

function manualStroke(character, strokes) {
  return {
    character,
    strokes,
    sourceId: "manual",
    sourceLabel: "手動輸入",
    dataVersion: "test-v1",
    manualOverride: true,
  };
}

function probe({
  upper,
  lower,
  moving,
  profile = "classic-primary-v1",
}) {
  return buildMeihuaResult({
    method: "domain-test",
    methodLabel: "領域測試",
    upperTotal: upper,
    lowerTotal: lower,
    movingTotal: moving,
    originalInput: { upper, lower, moving },
    normalizedInput: {
      upper: String(upper),
      lower: String(lower),
      moving: String(moving),
    },
    profile,
  });
}

test("mod1 將除 8、除 6 的整除結果保留為 8、6，並採 Euclidean 餘數", () => {
  const cases = [
    [1n, 8, 1],
    [8n, 8, 8],
    [9n, 8, 1],
    [16n, 8, 8],
    [0n, 8, 8],
    [-1n, 8, 7],
    [-8n, 8, 8],
    [1n, 6, 1],
    [6n, 6, 6],
    [12n, 6, 6],
    [13n, 6, 1],
    [0n, 6, 6],
    [-1n, 6, 5],
  ];

  for (const [value, divisor, expected] of cases) {
    assert.equal(mod1(value, divisor), expected, `mod1(${value}, ${divisor})`);
  }
});

test("六十四卦資料完整覆蓋 8×8，且每個卦有唯一六爻組合", () => {
  assert.equal(hexagramTable.length, 64);
  assert.equal(new Set(hexagramTable.map(([upper, lower]) => `${upper}-${lower}`)).size, 64);
  assert.equal(new Set(hexagramTable.map(([, , id]) => id)).size, 64);

  const linePatterns = new Set();
  for (let upper = 1; upper <= 8; upper += 1) {
    for (let lower = 1; lower <= 8; lower += 1) {
      const result = calculateIChing([String(upper), String(lower), "1"]);
      assert.equal(result.original.upperId, upper);
      assert.equal(result.original.lowerId, lower);
      assert.equal(result.original.lines.length, 6);
      assert.ok(result.original.lines.every((line) => line === 0 || line === 1));
      assert.deepEqual(
        result.original.lines,
        [...trigrams[lower].lines, ...trigrams[upper].lines],
      );
      linePatterns.add(result.original.lines.join(""));
    }
  }
  assert.equal(linePatterns.size, 64);
});

test("所有 384 種動爻只翻指定一爻，翻同一爻兩次回到本卦", () => {
  let checked = 0;
  for (let upper = 1; upper <= 8; upper += 1) {
    for (let lower = 1; lower <= 8; lower += 1) {
      for (let moving = 1; moving <= 6; moving += 1) {
        const first = calculateIChing([String(upper), String(lower), String(moving)]);
        const differences = first.original.lines
          .map((line, index) => (line === first.transformed.lines[index] ? null : index))
          .filter((index) => index !== null);
        assert.deepEqual(differences, [moving - 1]);
        assert.equal(first.transformed.lines[moving - 1], 1 - first.original.lines[moving - 1]);

        const second = calculateIChing([
          String(first.transformed.upperId),
          String(first.transformed.lowerId),
          String(moving),
        ]);
        assert.deepEqual(second.transformed.lines, first.original.lines);
        checked += 1;
      }
    }
  }
  assert.equal(checked, 384);
});

test("互卦固定取本卦第 2、3、4 爻與第 3、4、5 爻", () => {
  for (let upper = 1; upper <= 8; upper += 1) {
    for (let lower = 1; lower <= 8; lower += 1) {
      const result = calculateIChing([String(upper), String(lower), "3"]);
      const expectedLower = result.original.lines.slice(1, 4);
      const expectedUpper = result.original.lines.slice(2, 5);
      assert.deepEqual(result.mutual.lines, [...expectedLower, ...expectedUpper]);
    }
  }

  const traced = probe({ upper: 2, lower: 3, moving: 1 });
  assert.deepEqual(
    traced.calculationTrace.mutualLowerSourceLines,
    traced.original.lines.slice(1, 4),
  );
  assert.deepEqual(
    traced.calculationTrace.mutualUpperSourceLines,
    traced.original.lines.slice(2, 5),
  );
});

test("動爻在下卦時下卦為用，動爻在上卦時上卦為用", () => {
  const lowerMoving = probe({ upper: 1, lower: 5, moving: 2 });
  assert.equal(lowerMoving.moving.index + 1, 2);
  assert.equal(lowerMoving.roles.body.id, 1);
  assert.equal(lowerMoving.roles.use.id, 5);
  assert.match(lowerMoving.roles.note, /下卦為用/);

  const upperMoving = probe({ upper: 1, lower: 5, moving: 4 });
  assert.equal(upperMoving.moving.index + 1, 4);
  assert.equal(upperMoving.roles.body.id, 5);
  assert.equal(upperMoving.roles.use.id, 1);
  assert.match(upperMoving.roles.note, /上卦為用/);
});

test("五行關係完整區分比和、體生用、用生體、體克用、用克體", () => {
  const cases = [
    [1, 2, "same", "體用比和", "金", "金"],
    [4, 3, "body-generates-use", "體生用", "木", "火"],
    [3, 4, "use-generates-body", "用生體", "火", "木"],
    [1, 4, "body-controls-use", "體克用", "金", "木"],
    [4, 1, "use-controls-body", "用克體", "木", "金"],
  ];

  for (const [bodyId, useId, code, label, bodyElement, useElement] of cases) {
    const relation = analyzeFiveElementRelation(trigrams[bodyId], trigrams[useId]);
    assert.equal(relation.code, code);
    assert.equal(relation.label, label);
    assert.equal(relation.bodyElement, bodyElement);
    assert.equal(relation.useElement, useElement);
    assert.ok(relation.explanation);
  }
});

test("古籍主法與 legacy-existing-v1 明確保留乾坤互卦差異", () => {
  const classicQian = probe({ upper: 1, lower: 1, moving: 2 });
  const legacyQian = probe({
    upper: 1,
    lower: 1,
    moving: 2,
    profile: "legacy-existing-v1",
  });
  assert.equal(classicQian.original.name, "乾為天");
  assert.equal(classicQian.mutual.name, "乾為天");
  assert.equal(classicQian.mutualSource, "original");
  assert.equal(legacyQian.mutual.name, "天風姤");
  assert.equal(legacyQian.mutualSource, "transformed");

  const classicKun = probe({ upper: 8, lower: 8, moving: 3 });
  const legacyKun = probe({
    upper: 8,
    lower: 8,
    moving: 3,
    profile: "legacy-existing-v1",
  });
  assert.equal(classicKun.original.name, "坤為地");
  assert.equal(classicKun.mutual.name, "坤為地");
  assert.equal(classicKun.mutualSource, "original");
  assert.equal(legacyKun.mutual.name, "雷水解");
  assert.equal(legacyKun.mutualSource, "transformed");
});

test("使用者自訂 profile 可切換互卦、尺寸時辰與四至十字筆畫法", () => {
  const custom = {
    id: "user-custom-v1",
    label: "使用者自訂",
    pureHexagramMutual: "transformed",
    sizeMovingIncludesHour: false,
    textFourToTen: "strokes",
  };
  const qian = probe({ upper: 1, lower: 1, moving: 2, profile: custom });
  assert.equal(qian.profileId, "user-custom-v1");
  assert.equal(qian.mutualSource, "transformed");

  const size = calculateChiCunMethod({ chi: 5, cun: 4, hourBranch: 7 }, { profile: custom });
  assert.equal(size.calculationTrace.totals.moving, "9");

  const text = calculateTextMethod({
    text: "天地玄黃",
    strokeEntries: [
      manualStroke("天", 4),
      manualStroke("地", 6),
      manualStroke("玄", 5),
      manualStroke("黃", 12),
    ],
  }, { profile: custom });
  assert.equal(text.method, "text-strokes");
  assert.equal(text.profileId, "user-custom-v1");
  assert.deepEqual(text.calculationTrace.totals, { upper: "10", lower: "17", moving: "27" });
});

test("單一聲數與分段聲數各守其公式並保留完整總數", () => {
  const single = calculateSingleSoundMethod({ count: 3, hourBranch: 8 });
  assert.equal(single.method, "sound-single");
  assert.deepEqual(single.calculationTrace.totals, {
    upper: "3",
    lower: "11",
    moving: "11",
  });
  assert.deepEqual(single.remainders, [3, 3, 5]);
  assert.equal(single.original.name, "離為火");
  assert.equal(single.moving.index + 1, 5);
  assert.equal(single.transformed.name, "天火同人");

  const segmented = calculateSegmentedSoundMethod({
    firstCount: 1,
    secondCount: 5,
    hourBranch: 10,
  });
  assert.equal(segmented.method, "sound-segmented");
  assert.deepEqual(segmented.calculationTrace.totals, {
    upper: "1",
    lower: "5",
    moving: "16",
  });
  assert.deepEqual(segmented.remainders, [1, 5, 4]);
  assert.equal(segmented.original.name, "天風姤");
  assert.equal(segmented.moving.index + 1, 4);
  assert.equal(segmented.transformed.name, "巽為風");
});

test("一字占使用人工左右筆畫，並警告總筆畫不能代替左右拆分", () => {
  const result = calculateTextMethod({
    text: "明",
    leftStrokes: 4,
    rightStrokes: 8,
  });
  assert.equal(result.method, "text-single-character");
  assert.deepEqual(result.calculationTrace.totals, {
    upper: "4",
    lower: "8",
    moving: "12",
  });
  assert.equal(result.original.name, "雷地豫");
  assert.equal(result.moving.index + 1, 6);
  assert.equal(result.transformed.name, "火地晉");
  assert.match(result.calculationTrace.warnings.join(""), /左右筆畫必須.*手動確認/);
});

test("二字、三字筆畫依少上多下分組，逐字來源可追溯", () => {
  const two = calculateTextMethod({
    text: "天地",
    strokeEntries: [
      manualStroke("天", 4),
      manualStroke("地", 6),
    ],
  });
  assert.equal(two.method, "text-strokes");
  assert.deepEqual(two.calculationTrace.totals, {
    upper: "4",
    lower: "6",
    moving: "10",
  });
  assert.equal(two.original.name, "雷水解");
  assert.equal(two.transformed.name, "地水師");
  assert.deepEqual(two.calculationTrace.normalizedInput.upperCharacters, ["天"]);
  assert.deepEqual(two.calculationTrace.normalizedInput.lowerCharacters, ["地"]);
  assert.deepEqual(two.calculationTrace.dataVersions.strokes, ["manual:test-v1"]);

  const three = calculateTextMethod({
    text: "天地人",
    strokeEntries: [
      manualStroke("天", 4),
      manualStroke("地", 6),
      manualStroke("人", 2),
    ],
  });
  assert.equal(three.method, "text-strokes");
  assert.deepEqual(three.calculationTrace.totals, {
    upper: "4",
    lower: "8",
    moving: "12",
  });
  assert.equal(three.original.name, "雷地豫");
  assert.equal(three.transformed.name, "火地晉");
  assert.deepEqual(three.calculationTrace.normalizedInput.upperCharacters, ["天"]);
  assert.deepEqual(three.calculationTrace.normalizedInput.lowerCharacters, ["地", "人"]);
});

test("四至十字採人工平上去入，古例「今日動靜如何」得到地風升初爻變地天泰", () => {
  const result = calculateTextMethod({
    text: "今日動靜如何",
    toneValues: [1, 4, 3, 3, 1, 1],
  });
  assert.equal(result.method, "text-tones");
  assert.deepEqual(result.calculationTrace.totals, {
    upper: "8",
    lower: "5",
    moving: "13",
  });
  assert.deepEqual(result.remainders, [8, 5, 1]);
  assert.equal(result.original.name, "地風升");
  assert.equal(result.moving.index + 1, 1);
  assert.equal(result.transformed.name, "地天泰");
  assert.equal(result.mutual.name, "雷澤歸妹");
  assert.match(result.calculationTrace.warnings.join(""), /古代四聲不可直接用現代國語/);
});

test("十一字以上只計漢字並以少上多下的字數起卦", () => {
  const result = calculateTextMethod({
    text: "天地定位山澤通氣雷風相，123 ABC",
  });
  assert.equal(result.method, "text-count");
  assert.deepEqual(result.calculationTrace.normalizedInput, {
    characters: ["天", "地", "定", "位", "山", "澤", "通", "氣", "雷", "風", "相"],
    count: 11,
    upperCount: 5,
    lowerCount: 6,
  });
  assert.deepEqual(result.calculationTrace.totals, {
    upper: "5",
    lower: "6",
    moving: "11",
  });
  assert.equal(result.original.name, "風水渙");
  assert.equal(result.moving.index + 1, 5);
  assert.equal(result.transformed.name, "山水蒙");
});

test("丈尺占忽略寸數；尺寸占可核傳本加時並保留未證不加時異法", () => {
  const zhangChi = calculateZhangChiMethod({
    zhang: 3,
    chi: 5,
    cun: 7,
  });
  assert.deepEqual(zhangChi.calculationTrace.totals, {
    upper: "3",
    lower: "5",
    moving: "8",
  });
  assert.equal(zhangChi.original.name, "火風鼎");
  assert.equal(zhangChi.transformed.name, "火山旅");
  assert.deepEqual(zhangChi.calculationTrace.ignoredInput, ["寸數 7 未納入丈尺占。"]);

  const modern = calculateChiCunMethod(
    { chi: 5, cun: 4, hourBranch: 7 },
    { profile: "modern-current-v1" },
  );
  assert.equal(modern.profileId, "modern-current-v1");
  assert.equal(modern.calculationTrace.normalizedInput.version, "modern-with-hour");
  assert.equal(modern.calculationTrace.totals.moving, "16");
  assert.equal(modern.moving.index + 1, 4);
  assert.equal(modern.transformed.name, "天雷無妄");

  const old = calculateChiCunMethod(
    { chi: 5, cun: 4, hourBranch: 7 },
    { profile: "classic-variant-v1" },
  );
  assert.equal(old.profileId, "classic-variant-v1");
  assert.equal(old.calculationTrace.normalizedInput.version, "old-without-hour");
  assert.equal(old.calculationTrace.totals.moving, "9");
  assert.equal(old.moving.index + 1, 3);
  assert.equal(old.transformed.name, "風火家人");
  assert.match(old.calculationTrace.warnings.join(""), /未找到可核古本影證/);
});

test("後天端法共用為人、動物、靜物入口，且無觸發事件時保留警告", () => {
  assert.equal(findObjectTrigramCandidates("老人").at(0).trigram, "乾");
  assert.equal(findObjectTrigramCandidates("狗忽然吠叫").at(0).trigram, "艮");
  assert.equal(findObjectTrigramCandidates("方物").at(0).trigram, "坤");

  for (const scenario of ["posterior", "person"]) {
    const result = calculatePosteriorMethod({
      scenario,
      objectTrigram: 1,
      directionTrigram: 5,
      hourBranch: 4,
      trigger: "老人往巽方",
    });
    assert.equal(result.method, `posterior-${scenario}`);
    assert.deepEqual(result.calculationTrace.totals, {
      upper: "1",
      lower: "5",
      moving: "10",
    });
    assert.equal(result.original.name, "天風姤");
    assert.equal(result.moving.index + 1, 4);
    assert.equal(result.transformed.name, "巽為風");
  }

  const animal = calculatePosteriorMethod({
    scenario: "animal",
    objectTrigram: 7,
    directionTrigram: 4,
    hourBranch: 2,
    trigger: "",
  });
  assert.equal(animal.method, "posterior-animal");
  assert.equal(animal.original.name, "山雷頤");
  assert.match(animal.calculationTrace.warnings.join(""), /不動不占/);

  const staticObject = calculatePosteriorMethod({
    scenario: "static",
    objectTrigram: 8,
    directionTrigram: 2,
    hourBranch: 3,
    trigger: "",
  });
  assert.equal(staticObject.method, "posterior-static");
  assert.equal(staticObject.original.name, "地澤臨");
  assert.match(staticObject.calculationTrace.warnings.join(""), /不動不占/);
});

test("姓氏加數流傳法保留逐字筆畫來源並得到雷火豐三爻變震為雷", () => {
  const result = calculateSurnameAdditionMethod({
    surname: "王",
    strokeEntries: [manualStroke("王", 4)],
    yearBranch: 3,
    lunarMonth: 12,
    lunarDay: 1,
    hourBranch: 7,
  });
  assert.deepEqual(result.calculationTrace.totals, {
    upper: "20",
    lower: "27",
    moving: "27",
  });
  assert.deepEqual(result.remainders, [4, 3, 3]);
  assert.equal(result.original.name, "雷火豐");
  assert.equal(result.moving.index + 1, 3);
  assert.equal(result.transformed.name, "震為雷");
  assert.equal(result.calculationTrace.normalizedInput.addedTotal, "4");
  assert.deepEqual(result.calculationTrace.dataVersions.strokes, ["manual:test-v1"]);
  assert.match(result.calculationTrace.warnings.join(""), /流傳／使用者指定規約/);
});

test("Calendar profiles 分離正月初一年界、閏月規則、晚子時換日與立春年界", () => {
  assert.equal(resolveCalendarProfile().id, "taipei-lunar-new-year-v1");

  const leapInstant = new Date("2023-03-22T04:00:00.000Z");
  const sameMonth = detectCalendarParts(leapInstant, {
    profile: "taipei-lunar-new-year-v1",
  });
  assert.equal(sameMonth.isLeapMonth, true);
  assert.equal(sameMonth.lunarMonth, 2);
  assert.equal(sameMonth.lunarDay, 1);
  assert.equal(sameMonth.leapMonthRule, "same-month-number");

  const nextMonth = detectCalendarParts(leapInstant, {
    profile: {
      id: "test-next-month-v1",
      label: "測試・閏月作次月",
      timeZone: "Asia/Taipei",
      yearBoundary: "lunar-new-year",
      leapMonthRule: "next-month-number",
      ziHourDayBoundary: "civil-midnight",
    },
  });
  assert.equal(nextMonth.isLeapMonth, true);
  assert.equal(nextMonth.lunarMonth, 3);
  assert.equal(nextMonth.leapMonthRule, "next-month-number");

  const lateZiInstant = new Date("2026-07-19T15:30:00.000Z");
  const civilMidnight = detectCalendarParts(lateZiInstant, {
    profile: "taipei-lunar-new-year-v1",
  });
  const lateZiNextDay = detectCalendarParts(lateZiInstant, {
    profile: "taipei-late-zi-next-day-v1",
  });
  assert.equal(civilMidnight.hourBranch, 1);
  assert.equal(civilMidnight.lunarDay, 6);
  assert.equal(civilMidnight.shiftedForLateZi, false);
  assert.equal(lateZiNextDay.hourBranch, 1);
  assert.equal(lateZiNextDay.lunarDay, 7);
  assert.equal(lateZiNextDay.shiftedForLateZi, true);

  const beforeLichun = detectCalendarParts(
    new Date("2026-02-03T20:01:00.000Z"),
    { profile: "taipei-lichun-v1" },
  );
  const afterLichun = detectCalendarParts(
    new Date("2026-02-03T20:03:00.000Z"),
    { profile: "taipei-lichun-v1" },
  );
  const lunarBoundaryAtSameInstant = detectCalendarParts(
    new Date("2026-02-03T20:03:00.000Z"),
    { profile: "taipei-lunar-new-year-v1" },
  );
  assert.equal(beforeLichun.branchYear, 2025);
  assert.equal(beforeLichun.yearBranch, 6);
  assert.equal(afterLichun.branchYear, 2026);
  assert.equal(afterLichun.yearBranch, 7);
  assert.equal(lunarBoundaryAtSameInstant.branchYear, 2025);
  assert.equal(lunarBoundaryAtSameInstant.yearBranch, 6);
  assert.equal(afterLichun.lichunInstantIso, "2026-02-03T20:02:00.000Z");

  const manual = normalizeManualCalendarParts({
    yearBranch: 4,
    lunarMonth: 2,
    lunarDay: 1,
    isLeapMonth: true,
    hourBranch: 7,
    calendarProfile: "taipei-lunar-new-year-v1",
  });
  assert.equal(manual.mode, "manual");
  assert.equal(manual.isLeapMonth, true);
  assert.equal(manual.calendarProfileId, "taipei-lunar-new-year-v1");
});

test("皇極時間長度在 30、360、10800、129600 年邊界正確進位", () => {
  const cases = [
    [30, { yuan: "0", hui: "0", yun: "0", shi: "1", years: "0" }],
    [360, { yuan: "0", hui: "0", yun: "1", shi: "0", years: "0" }],
    [10800, { yuan: "0", hui: "1", yun: "0", shi: "0", years: "0" }],
    [129600, { yuan: "1", hui: "0", yun: "0", shi: "0", years: "0" }],
  ];

  for (const [years, expected] of cases) {
    const result = decomposeHuangjiYears(years);
    assert.deepEqual(result.units, expected);
    assert.equal(result.calculationTrace.normalizedInput.years, String(years));
  }
});

test("BCE 跨 CE 內部連續且所有顯示均不產生西元 0 年", () => {
  assert.equal(civilYearToAstronomical(-1), 0n);
  assert.equal(civilYearToAstronomical(1), 1n);
  assert.equal(astronomicalYearToCivil(0), -1n);
  assert.equal(astronomicalYearToCivil(1), 1n);
  assert.equal(addCivilYears(-1, 1), 1n);
  assert.equal(addCivilYears(1, -1), -1n);
  assert.equal(formatCivilYear(-1), "西元前 1 年");
  assert.equal(formatCivilYear(1), "西元 1 年");
  assert.throws(() => civilYearToAstronomical(0), /沒有西元 0 年/);
  assert.throws(() => formatCivilYear(0), /沒有西元 0 年/);

  const bce = calculateHuangjiPosition({
    targetCivilYear: -1,
    epochProfileId: "civil-era-reference-v1",
  });
  const ce = calculateHuangjiPosition({
    targetCivilYear: 1,
    epochProfileId: "civil-era-reference-v1",
  });
  assert.equal(BigInt(ce.elapsedYears) - BigInt(bce.elapsedYears), 1n);
  assert.equal(bce.targetLabel, "西元前 1 年");
  assert.equal(ce.targetLabel, "西元 1 年");
  assert.doesNotMatch(`${bce.targetLabel}\n${bce.epoch.label}`, /西元 0 年/);
  assert.doesNotMatch(`${ce.targetLabel}\n${ce.epoch.label}`, /西元 0 年/);
  assert.equal(bce.calculationTrace.normalizedInput.targetAstronomical, "0");
  assert.equal(ce.calculationTrace.normalizedInput.targetAstronomical, "1");
});
