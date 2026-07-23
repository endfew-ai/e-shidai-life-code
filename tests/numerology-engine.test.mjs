import assert from "node:assert/strict";
import test from "node:test";

import {
  BIRTH_GRID_LINE_RULES,
  DEFAULT_RULE_SET,
  LEGACY_RULE_SET,
  MAGNETIC_FIELD_GROUPS,
  MAGNETIC_FIELD_INTERPRETATIONS,
  MAGNETIC_FIELD_MAP,
  TAIWAN_ID_LETTER_VALUES,
  alphabetToSequentialDigits,
  analyzeBirthGrid,
  analyzeIdentityNumber,
  analyzeSlidingPairs,
  buildIdentityTimeline,
  buildTimelineStageInsight,
  calculateLifePath,
  evaluateBirthGridLines,
  generatePlainTextReport,
  maskTaiwanNationalId,
  validateTaiwanNationalId,
} from "../domain/numerology/index.js";
import {
  analyzeBirthdayV2,
  analyzeIdentityV2,
  analyzeSequenceV2,
} from "../application/numerology-analysis.js";

const TODAY = "2026-07-23";
const CREATED_AT = "2026-07-23T04:05:06.000Z";

test("新版全生日數字與舊版分段主數規則保留固定回歸案例", () => {
  const cases = [
    { date: "1950-05-22", firstSum: 24, current: 6, legacy: 33, legacyBase: 6 },
    { date: "1942-06-18", firstSum: 31, current: 4, legacy: 22, legacyBase: 4 },
    { date: "1985-05-01", firstSum: 29, current: 2, legacy: 11, legacyBase: 2 },
    { date: "1959-10-25", firstSum: 32, current: 5, legacy: 5, legacyBase: 5 },
  ];

  for (const sample of cases) {
    const current = calculateLifePath(sample.date, {
      ruleSet: DEFAULT_RULE_SET,
      todayValue: TODAY,
    });
    const legacy = calculateLifePath(sample.date, {
      ruleSet: LEGACY_RULE_SET,
      todayValue: TODAY,
    });

    assert.equal(current.firstSum, sample.firstSum, `${sample.date} 新版第一次加總`);
    assert.equal(current.lifePathNumber, sample.current, `${sample.date} 新版生命靈數`);
    assert.equal(current.baseNumber, sample.current, `${sample.date} 新版人格基底`);
    assert.equal(current.ruleProfile.lifePathMode, "full_birth_digits");
    assert.equal(current.ruleProfile.masterNumberMode, "disabled");

    assert.equal(legacy.lifePathNumber, sample.legacy, `${sample.date} 舊版生命靈數`);
    assert.equal(legacy.baseNumber, sample.legacyBase, `${sample.date} 舊版人格基底`);
    assert.equal(legacy.ruleProfile.lifePathMode, "legacy_segmented");
    assert.equal(legacy.ruleProfile.masterNumberMode, "preserve_11_22_33");
  }

  const legacyMaster = calculateLifePath("1950-05-22", {
    ruleSet: LEGACY_RULE_SET,
    todayValue: TODAY,
  });
  assert.equal(legacyMaster.isMaster, true);
  assert.equal(legacyMaster.legacyParts.segmentedSum, 33);
  assert.match(legacyMaster.calculationText, /舊版分段：5 \+ 22 \+ 6 = 33/);
});

test("生日應用層結果固定時鐘、規則版本、九宮格與三年流年", () => {
  const result = analyzeBirthdayV2({
    id: "birthday-fixed-case",
    date: "1950-05-22",
    todayValue: TODAY,
    currentYear: 2026,
    createdAt: CREATED_AT,
  });

  assert.equal(result.id, "birthday-fixed-case");
  assert.equal(result.createdAt, CREATED_AT);
  assert.equal(result.lifePathResult.lifePathNumber, 6);
  assert.equal(result.ruleSetId, DEFAULT_RULE_SET.id);
  assert.equal(result.ruleSet.version, "2.1.1");
  assert.equal(result.birthGridResult.layoutProfile, "standard_1_to_9");
  assert.deepEqual(result.personalYearCycles.map(({ year }) => year), [2025, 2026, 2027]);
  assert.equal(Object.hasOwn(result, "destinyNumber"), false);
  assert.ok(result.reportSections.some(({ id }) => id === "birth-grid"));

  assert.throws(
    () => analyzeBirthdayV2({ date: "1950-05-22", currentYear: 2026 }),
    /todayValue/,
  );
});

test("生日九宮格固定使用 1 至 9、排除 0，並完整評估 13 組線", () => {
  const result = analyzeBirthGrid("1987-06-24", {
    ruleSet: DEFAULT_RULE_SET,
    todayValue: TODAY,
  });

  assert.deepEqual(result.displayOrder, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(result.rawGridDigits, [1, 9, 8, 7, 6, 2, 4]);
  assert.equal(result.zeroCount, 1);
  assert.deepEqual(result.counts, {
    1: 1, 2: 1, 3: 0, 4: 1, 5: 0, 6: 1, 7: 1, 8: 1, 9: 1,
  });
  assert.deepEqual(result.missingNumbers, [3, 5]);
  assert.equal(BIRTH_GRID_LINE_RULES.length, 13);
  assert.equal(result.lines.length, 13);
  assert.deepEqual(
    result.establishedLines.map(({ lineId }) => lineId),
    ["7-8-9", "1-4-7", "2-4", "2-6", "4-8", "6-8", "2-4-6-8"],
  );
});

test("九宮連線強度採各線最低出現次數，缺數時強度為零", () => {
  const counts = {
    1: 3, 2: 2, 3: 4,
    4: 2, 5: 1, 6: 2,
    7: 1, 8: 2, 9: 3,
  };
  const lines = evaluateBirthGridLines(counts);
  assert.equal(lines.length, 13);
  assert.equal(lines.find(({ lineId }) => lineId === "1-2-3").strength, 2);
  assert.equal(lines.find(({ lineId }) => lineId === "2-4-6-8").strength, 2);
  assert.ok(lines.every(({ present }) => present));

  const withMissing = evaluateBirthGridLines({ ...counts, 5: 0 });
  const emotional = withMissing.find(({ lineId }) => lineId === "2-5-8");
  assert.equal(emotional.present, false);
  assert.equal(emotional.strength, 0);
  assert.deepEqual(emotional.missingNumbers, [5]);
});

test("八大磁場正好覆蓋排除 0 與 5 後的 64 組有序配對", () => {
  const baseDigits = [..."12346789"];
  const expectedPairs = baseDigits.flatMap((left) => baseDigits.map((right) => `${left}${right}`)).sort();
  const actualPairs = Object.keys(MAGNETIC_FIELD_MAP).sort();

  assert.deepEqual(actualPairs, expectedPairs);
  assert.equal(actualPairs.length, 64);
  assert.equal(Object.keys(MAGNETIC_FIELD_GROUPS).length, 8);
  for (const [fieldType, pairs] of Object.entries(MAGNETIC_FIELD_GROUPS)) {
    assert.equal(pairs.length, 8, fieldType);
    for (const pair of pairs) assert.equal(MAGNETIC_FIELD_MAP[pair], fieldType, pair);
  }
});

test("滑動視窗不跳號：1234 必須產生 12、23、34", () => {
  const result = analyzeSlidingPairs("1234");
  assert.deepEqual(result.pairs.map(({ rawPair }) => rawPair), ["12", "23", "34"]);
  assert.deepEqual(result.pairs.map(({ fieldType }) => fieldType), ["絕命", "禍害", "延年"]);
  assert.deepEqual(result.pairs.map(({ startIndex, endIndex }) => [startIndex, endIndex]), [
    [0, 1], [1, 2], [2, 3],
  ]);
  assert.equal(result.resolvedRecords.length, 3);
});

test("0 與 5 橋接保留原序列、外側基礎磁場及修飾順序", () => {
  const samples = [
    {
      sequence: "103",
      rawPair: "103",
      modifiers: [{ digit: "0", effect: "hidden", index: 1 }],
    },
    {
      sequence: "153",
      rawPair: "153",
      modifiers: [{ digit: "5", effect: "amplified", index: 1 }],
    },
    {
      sequence: "10053",
      rawPair: "10053",
      modifiers: [
        { digit: "0", effect: "hidden", index: 1 },
        { digit: "0", effect: "hidden", index: 2 },
        { digit: "5", effect: "amplified", index: 3 },
      ],
    },
  ];

  for (const sample of samples) {
    const result = analyzeSlidingPairs(sample.sequence);
    assert.equal(result.bridges.length, 1, sample.sequence);
    assert.equal(result.bridges[0].rawPair, sample.rawPair, sample.sequence);
    assert.equal(result.bridges[0].basePair, "13", sample.sequence);
    assert.equal(result.bridges[0].fieldType, "天醫", sample.sequence);
    assert.deepEqual(
      result.bridges[0].modifierChain.map(({ digit, effect, index }) => ({ digit, effect, index })),
      sample.modifiers,
      sample.sequence,
    );
    assert.equal(
      result.standaloneModifiers.length,
      0,
      `${sample.sequence} 的橋接鏈內修飾數字不應重複標成孤立修飾`,
    );
  }
});

test("八大磁場人生階段細解沿用教材內容並提供中性觀察問題", () => {
  const samples = [
    ["11", "伏位"],
    ["19", "延年"],
    ["14", "生氣"],
    ["13", "天醫"],
    ["17", "禍害"],
    ["16", "六煞"],
    ["12", "絕命"],
    ["18", "五鬼"],
  ];

  for (const [sequence, fieldType] of samples) {
    const pair = analyzeSlidingPairs(sequence).pairs[0];
    const stage = {
      stageIndex: 0,
      startAge: 0,
      endAge: 10,
      label: "0-10 歲",
      cycle: 1,
      pair,
      status: "mapped",
    };
    const insight = buildTimelineStageInsight(stage);
    assert.equal(insight.classificationStatus, "classified", sequence);
    assert.equal(insight.fieldType, fieldType, sequence);
    assert.deepEqual(insight.themes, MAGNETIC_FIELD_INTERPRETATIONS[fieldType].core, sequence);
    assert.deepEqual(insight.strengths, MAGNETIC_FIELD_INTERPRETATIONS[fieldType].strengths, sequence);
    assert.deepEqual(insight.cautions, MAGNETIC_FIELD_INTERPRETATIONS[fieldType].cautions, sequence);
    assert.equal(insight.observationQuestions.length, 2, sequence);
    assert.equal(insight.transitionFromPrevious.status, "first_stage", sequence);
    assert.doesNotMatch(JSON.stringify(insight), new RegExp(sequence), sequence);
  }
});

test("人生階段未分類、橋接補充與無配對區間不會被冒充成直接磁場", () => {
  const magnetic = analyzeSlidingPairs("1053");
  const firstStage = {
    stageIndex: 0,
    startAge: 0,
    endAge: 10,
    label: "0-10 歲",
    cycle: 1,
    pair: magnetic.pairs[0],
    status: "mapped",
  };
  const bridged = buildTimelineStageInsight(firstStage, null, {
    bridges: magnetic.bridges,
    zeroFiveMode: magnetic.zeroFiveMode,
  });
  assert.equal(bridged.classificationStatus, "modifier_unclassified");
  assert.equal(bridged.fieldType, null);
  assert.deepEqual(bridged.bridgeFields, ["天醫"]);
  assert.match(bridged.classificationNote, /橋接只作補充，不取代本階段的直接分類/);
  assert.match(bridged.cautions.join("、"), /未分類不等於無效或負面/);
  assert.doesNotMatch(JSON.stringify(bridged), /1053|10|53/);

  const unmatched = buildTimelineStageInsight({
    stageIndex: 10,
    startAge: 70,
    endAge: 75,
    label: "70-75 歲",
    cycle: 1,
    pair: null,
    status: "unmatched_interval",
  }, firstStage);
  assert.equal(unmatched.classificationStatus, "unmatched");
  assert.equal(unmatched.transitionFromPrevious.status, "unmatched_interval");
  assert.match(unmatched.classificationNote, /不補造結果/);
});

test("人生階段前段轉接只使用真正相鄰的已啟用規則", () => {
  const stageFor = (sequence, stageIndex) => ({
    stageIndex,
    startAge: stageIndex * 5,
    endAge: stageIndex * 5 + 5,
    label: `${stageIndex * 5}-${stageIndex * 5 + 5} 歲`,
    cycle: 1,
    pair: analyzeSlidingPairs(sequence).pairs[0],
    status: "mapped",
  });
  const knownRules = [
    ["13", "14", "資源與開展"],
    ["13", "19", "資源與持續"],
    ["14", "19", "開展與持續"],
    ["13", "12", "資源與高波動"],
  ];
  for (const [previousPair, currentPair, title] of knownRules) {
    const insight = buildTimelineStageInsight(stageFor(currentPair, 1), stageFor(previousPair, 0));
    assert.equal(insight.transitionFromPrevious.status, "matched_rule", title);
    assert.equal(insight.transitionFromPrevious.title, title);
  }

  const same = buildTimelineStageInsight(stageFor("22", 1), stageFor("11", 0));
  assert.equal(same.transitionFromPrevious.status, "same_field");
  assert.match(same.transitionFromPrevious.interpretation, /同為伏位/);

  const undefinedPair = buildTimelineStageInsight(stageFor("17", 1), stageFor("11", 0));
  assert.equal(undefinedPair.transitionFromPrevious.status, "no_defined_rule");
  assert.match(undefinedPair.transitionFromPrevious.caution, /不自行補寫/);

  const blocked = buildTimelineStageInsight(stageFor("13", 1), stageFor("10", 0));
  assert.equal(blocked.transitionFromPrevious.status, "blocked_unclassified");
  assert.match(blocked.transitionFromPrevious.interpretation, /不跨過該段/);
});

test("A=01 民俗轉換與台灣身分證官方字母值保持分離", () => {
  const conversion = alphabetToSequentialDigits("A-Z");
  assert.equal(conversion.normalized, "A-Z");
  assert.equal(conversion.digits, "0126");
  assert.deepEqual(
    conversion.sourceMap.map(({ outputIndex, sourceIndex, normalizedCharacter }) => ({
      outputIndex, sourceIndex, normalizedCharacter,
    })),
    [
      { outputIndex: 0, sourceIndex: 0, normalizedCharacter: "A" },
      { outputIndex: 1, sourceIndex: 0, normalizedCharacter: "A" },
      { outputIndex: 2, sourceIndex: 2, normalizedCharacter: "Z" },
      { outputIndex: 3, sourceIndex: 2, normalizedCharacter: "Z" },
    ],
  );

  assert.equal(TAIWAN_ID_LETTER_VALUES.A, 10);
  assert.equal(TAIWAN_ID_LETTER_VALUES.I, 34);
  assert.equal(TAIWAN_ID_LETTER_VALUES.O, 35);
  assert.equal(TAIWAN_ID_LETTER_VALUES.W, 32);
  assert.equal(TAIWAN_ID_LETTER_VALUES.Z, 33);
  assert.notEqual(Number(conversion.digits.slice(0, 2)), TAIWAN_ID_LETTER_VALUES.A);
  assert.match(conversion.rule, /不是身分證官方驗證碼轉換/);
});

test("台灣身分證格式、檢查碼、遮罩與民俗序列結果可分別檢查", () => {
  const valid = validateTaiwanNationalId(" a123456789 ");
  assert.equal(valid.normalized, "A123456789");
  assert.equal(valid.formatValid, true);
  assert.equal(valid.checksumValid, true);
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.officialDigits, [1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(maskTaiwanNationalId(valid.normalized), "A12*****89");

  const badChecksum = validateTaiwanNationalId("A123456788");
  assert.equal(badChecksum.formatValid, true);
  assert.equal(badChecksum.checksumValid, false);
  assert.throws(() => analyzeIdentityNumber("A123456788"), /檢查碼未通過/);

  const analyzed = analyzeIdentityNumber("A123456789");
  assert.equal(analyzed.conversion.letter, "A");
  assert.equal(analyzed.conversion.sequentialValue, "01");
  assert.equal(analyzed.conversion.fullSequence, "01123456789");
  assert.equal(analyzed.maskedInput, "A12*****89");
  assert.equal(analyzed.validation.officialDigits.slice(0, 2).join(""), "10");
  assert.notEqual(analyzed.conversion.sequentialValue, analyzed.validation.officialDigits.slice(0, 2).join(""));
  assert.equal(analyzed.destiny.status, "resolved");
  assert.equal(analyzed.destiny.conversion.digits, "1123456789");
  assert.equal(analyzed.destiny.magnetic.pairs.length, 9);
  assert.equal(analyzed.encounterMagnetic.normalizedSequence, "01123456789");
  assert.equal(analyzed.encounterMagnetic.pairs.length, 10);
  assert.equal(analyzed.timeline.stages[0].pair.rawPair, "01");
  assert.equal(analyzed.destiny.magnetic.pairs[0].rawPair, "11");
});

test("命格數列只移除 A 至 I 字母碼的補位零，人生階段完整保留 11 位", () => {
  const cases = [
    {
      input: "A123456784",
      code: "01",
      destinySequence: "1123456784",
      destinyPairs: ["11", "12", "23", "34", "45", "56", "67", "78", "84"],
      droppedLeadingZero: true,
    },
    {
      input: "E123456784",
      code: "05",
      destinySequence: "5123456784",
      destinyPairs: ["51", "12", "23", "34", "45", "56", "67", "78", "84"],
      droppedLeadingZero: true,
    },
    {
      input: "J123456784",
      code: "10",
      destinySequence: "10123456784",
      destinyPairs: ["10", "01", "12", "23", "34", "45", "56", "67", "78", "84"],
      droppedLeadingZero: false,
    },
    {
      input: "Z123456784",
      code: "26",
      destinySequence: "26123456784",
      destinyPairs: ["26", "61", "12", "23", "34", "45", "56", "67", "78", "84"],
      droppedLeadingZero: false,
    },
  ];

  for (const sample of cases) {
    const result = analyzeIdentityNumber(sample.input, { allowInvalidChecksum: true });
    assert.equal(result.destiny.letterSequentialValue, sample.code, sample.input);
    assert.equal(result.destiny.droppedLeadingZero, sample.droppedLeadingZero, sample.input);
    assert.equal(result.destiny.conversion.digits, sample.destinySequence, sample.input);
    assert.deepEqual(result.destiny.magnetic.pairs.map(({ rawPair }) => rawPair), sample.destinyPairs, sample.input);
    assert.equal(result.destiny.magnetic.pairs.length, sample.droppedLeadingZero ? 9 : 10, sample.input);
    assert.equal(result.encounterMagnetic.normalizedSequence, `${sample.code}123456784`, sample.input);
    assert.equal(result.encounterMagnetic.pairs.length, 10, sample.input);
    assert.equal(result.timeline.stages.length, 10, sample.input);
    assert.equal(result.destiny.conversion.sourceMap[0].outputIndex, 0, sample.input);
    assert.equal(result.destiny.conversion.sourceMap[0].sourceIndex, 0, sample.input);
  }

  const zeroTail = analyzeIdentityNumber("A100000004", { allowInvalidChecksum: true });
  assert.equal(zeroTail.destiny.conversion.digits, "1100000004");
  assert.equal(zeroTail.encounterMagnetic.normalizedSequence, "01100000004");
});

test("教材原表區間不靜默截斷，五年循環會標示輪次", () => {
  const pairRecords = Array.from({ length: 10 }, (_, index) => Object.freeze({
    rawPair: `${index}${index + 1}`,
    fieldType: index % 2 === 0 ? "天醫" : "生氣",
  }));

  const mismatch = buildIdentityTimeline(pairRecords, "uploaded_sheet_exact");
  assert.equal(mismatch.stages.length, 11);
  assert.equal(mismatch.status, "mismatch");
  assert.equal(mismatch.canSummarize, false);
  assert.equal(mismatch.stages.at(-1).status, "unmatched_interval");
  assert.equal(mismatch.stages.at(-1).pair, null);
  assert.ok(mismatch.warnings.some(({ code, message }) =>
    code === "TIMELINE_PROFILE_PAIR_COUNT_MISMATCH"
      && /區間共有 11 段.*相鄰磁場共有 10 組/.test(message)));

  const cyclic = buildIdentityTimeline(pairRecords.slice(0, 2), "cyclic_5_year", {
    startAge: 0,
    maxAge: 25,
  });
  assert.equal(cyclic.cyclic, true);
  assert.deepEqual(cyclic.stages.map(({ startAge, endAge }) => [startAge, endAge]), [
    [0, 5], [5, 10], [10, 15], [15, 20], [20, 25],
  ]);
  assert.deepEqual(cyclic.stages.map(({ cycle }) => cycle), [1, 1, 2, 2, 3]);
  assert.deepEqual(cyclic.stages.map(({ pair }) => pair.rawPair), ["01", "12", "01", "12", "01"]);
  assert.ok(cyclic.warnings.some(({ code, message }) =>
    code === "TIMELINE_CYCLIC_EXTENSION" && /延伸演算/.test(message)));
});

test("應用層身分證與一般序列分析均輸出結構化結果", () => {
  const identity = analyzeIdentityV2({
    id: "identity-fixed-case",
    value: "A123456789",
    todayValue: TODAY,
    currentYear: 2026,
    createdAt: CREATED_AT,
    timelineProfile: "first_10_then_5",
  });
  assert.equal(identity.maskedInput, "A12*****89");
  assert.equal(identity.identityValidation.valid, true);
  assert.equal(identity.identityDestiny.status, "resolved");
  assert.equal(identity.destinyMagneticFieldResult.pairs.length, 9);
  assert.equal(identity.lifeEncounterMagnetic.pairs.length, 10);
  assert.equal(identity.timelineResult.stages.length, 10);
  assert.ok(identity.calculationSteps.some(({ id }) => id === "official-validation"));
  assert.ok(identity.calculationSteps.some(({ id }) => id === "folklore-letter-conversion"));
  assert.ok(identity.calculationSteps.some(({ id }) => id === "identity-destiny-sequence"));
  assert.ok(identity.reportSections.some(({ id }) => id === "identity-destiny-sequence"));
  const maskedReport = generatePlainTextReport(identity);
  assert.doesNotMatch(maskedReport, /A123456789/);
  assert.doesNotMatch(maskedReport, /01123456789/);
  assert.doesNotMatch(maskedReport, /1123456789/);
  assert.match(maskedReport, /命格第 1 個相鄰視窗/);
  assert.match(maskedReport, /命格位置 5～7 的橋接結果/);
  assert.match(maskedReport, /階段主題：/);
  assert.match(maskedReport, /可觀察：/);
  assert.match(maskedReport, /前段轉接：/);
  assert.match(maskedReport, /分類依據：/);

  const sequence = analyzeSequenceV2({
    id: "sequence-fixed-case",
    inputType: "phone_number",
    value: "0912-345-678",
    todayValue: TODAY,
    currentYear: 2026,
    createdAt: CREATED_AT,
  });
  assert.equal(sequence.id, "sequence-fixed-case");
  assert.equal(sequence.maskedInput, "手機末碼 5678");
  assert.equal(sequence.magneticFieldResult.pairs.length, 9);
  assert.ok(sequence.calculationSteps.some(({ id }) => id === "alphabet-sequence"));
});
