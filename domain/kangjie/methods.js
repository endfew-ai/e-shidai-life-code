import { earthlyBranches } from "./shared-data.js";
import { buildMeihuaResult, trigramById } from "./engine.js";
import { mod1, toIntegerBigInt, toSafeInteger } from "./math.js";
import { resolveCalculationProfile } from "./profiles.js";
import { normalizeManualCalendarParts } from "./calendar.js";

function positive(rawValue, label) {
  return toIntegerBigInt(rawValue, label, { minimum: 1 });
}

function branch(value) {
  return earthlyBranches[value - 1];
}

function commonTrace(label, total, divisor, detail = "") {
  const value = BigInt(total);
  const base = BigInt(divisor);
  const quotient = value / base;
  const remainder = value % base;
  const result = mod1(value, divisor);
  return {
    label,
    equation: `${detail}${value}；${value} ÷ ${divisor} = ${quotient} 餘 ${remainder}；${remainder === 0n ? `整除依設定取 ${divisor}` : `取餘數 ${result}`}`,
    dividend: value.toString(),
    divisor,
    quotient: quotient.toString(),
    remainder: remainder.toString(),
    result,
  };
}

function strokeSourceIds(entries) {
  const ids = [];
  if (entries.some((entry) => entry.sourceId === "unicode-unihan")) ids.push("UNICODE-UNIHAN-17.0.0");
  if (entries.some((entry) => entry.sourceId === "moe-concised")) ids.push("MOE-CONCISED-DICT-01");
  return ids;
}

export function calculateCalendarMethod(input, options = {}) {
  const originalInput = { ...input };
  const calendar = input.mode === "automatic"
    ? { ...input }
    : normalizeManualCalendarParts(input, { profile: input.calendarProfile ?? input.calendarProfileId });
  const year = toSafeInteger(calendar.yearBranch, "年支", 1, 12);
  const month = toSafeInteger(calendar.lunarMonth, "農曆月", 1, 12);
  const day = toSafeInteger(calendar.lunarDay, "農曆日", 1, 30);
  const hour = toSafeInteger(calendar.hourBranch, "時支", 1, 12);
  const upperTotal = BigInt(year + month + day);
  const lowerTotal = upperTotal + BigInt(hour);
  const profile = resolveCalculationProfile(options.profile ?? input.profile);
  return buildMeihuaResult({
    method: "calendar",
    methodLabel: "年月日時起卦",
    upperTotal,
    lowerTotal,
    movingTotal: lowerTotal,
    originalInput,
    normalizedInput: {
      mode: calendar.mode,
      yearBranch: year,
      lunarMonth: month,
      originalLunarMonth: calendar.originalLunarMonth ?? month,
      lunarDay: day,
      isLeapMonth: Boolean(calendar.isLeapMonth),
      hourBranch: hour,
      timeZone: calendar.timeZone,
      calendarProfileId: calendar.calendarProfileId,
      calendarProfileLabel: calendar.calendarProfileLabel,
      yearBoundary: calendar.yearBoundary,
      leapMonthRule: calendar.leapMonthRule,
      ziHourDayBoundary: calendar.ziHourDayBoundary,
      shiftedForLateZi: Boolean(calendar.shiftedForLateZi),
      lichunInstantIso: calendar.lichunInstantIso ?? null,
      instantIso: calendar.instantIso ?? null,
    },
    inputSummary: `${branch(year).name}年・農曆${calendar.isLeapMonth ? "閏" : ""}${calendar.originalLunarMonth ?? month}月${day}日・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", upperTotal, 8, `${year} + ${month} + ${day} = `),
      commonTrace("下卦", lowerTotal, 8, `${upperTotal} + ${hour} = `),
      commonTrace("動爻", lowerTotal, 6),
    ],
    profile,
    formulaSourceIds: ["MYS-WIKI-01", "MYS-CTEXT-01"],
    dataSourceIds: [...new Set(calendar.sourceIds ?? [])],
    assumptions: [
      `曆法模式：${calendar.mode === "automatic" ? "自動換算" : "人工輸入"}。`,
      `年界 ${calendar.yearBoundary || "lunar-new-year"}・閏月 ${calendar.leapMonthRule || "same-month-number"}・子時換日 ${calendar.ziHourDayBoundary || "civil-midnight"}。`,
    ],
    warnings: [...(calendar.warnings || [])],
    dataVersions: calendar.calendarDataVersion ? { calendar: calendar.calendarDataVersion } : {},
    seasonalLunarMonth: month,
  });
}

export function calculateObjectMethod(input, options = {}) {
  const originalInput = { ...input };
  const count = positive(input.count, "物數");
  const hour = toSafeInteger(input.hourBranch, "時支", 1, 12);
  const movingTotal = count + BigInt(hour);
  return buildMeihuaResult({
    method: "object",
    methodLabel: "物數起卦",
    upperTotal: count,
    lowerTotal: BigInt(hour),
    movingTotal,
    originalInput,
    normalizedInput: { count: count.toString(), hourBranch: hour },
    inputSummary: `物數 ${count}・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", count, 8, "可數之物 = "),
      commonTrace("下卦", hour, 8, `時支 ${branch(hour).name} = `),
      commonTrace("動爻", movingTotal, 6, `${count} + ${hour} = `),
    ],
    profile: options.profile ?? input.profile,
  });
}

export function calculateModernThreeNumberMethod(rawInput, options = {}) {
  const values = Array.isArray(rawInput)
    ? { upperNumber: rawInput[0], lowerNumber: rawInput[1], movingNumber: rawInput[2] }
    : rawInput;
  const upper = positive(values.upperNumber ?? values.first, "第一數");
  const lower = positive(values.lowerNumber ?? values.second, "第二數");
  const moving = positive(values.movingNumber ?? values.third, "第三數");
  return buildMeihuaResult({
    method: "modern-three-number",
    methodLabel: "三數取卦",
    upperTotal: upper,
    lowerTotal: lower,
    movingTotal: moving,
    originalInput: Array.isArray(rawInput) ? { values: [...rawInput] } : { ...rawInput },
    normalizedInput: {
      upperNumber: upper.toString(),
      lowerNumber: lower.toString(),
      movingNumber: moving.toString(),
    },
    inputSummary: `第一數 ${upper}・第二數 ${lower}・第三數 ${moving}`,
    trace: [
      commonTrace("第一數取上卦", upper, 8),
      commonTrace("第二數取下卦", lower, 8),
      commonTrace("第三數取動爻", moving, 6),
    ],
    profile: options.profile ?? values.profile ?? "modern-current-v1",
    formulaSourceIds: [],
    formulaSourceStatus: "not-found",
    formulaSourceNotice: "本次核對《梅花易數》未見固定三個輸入依序取上卦、下卦、動爻的主法；公式只標為現代三數法。",
    warnings: ["固定三個現代數字依序取上卦、下卦與動爻，未見於本次核對的《梅花易數》古籍主法；算法明確標為現代三數法。"],
    assumptions: ["三個輸入彼此獨立，不把生日、身分證或其他個資自動代入。"],
  });
}

export function calculateSingleSoundMethod(input, options = {}) {
  const originalInput = { ...input };
  const count = positive(input.count, "聲數");
  const hour = toSafeInteger(input.hourBranch, "時支", 1, 12);
  const lowerTotal = count + BigInt(hour);
  return buildMeihuaResult({
    method: "sound-single",
    methodLabel: "單一聲數起卦",
    upperTotal: count,
    lowerTotal,
    movingTotal: lowerTotal,
    originalInput,
    normalizedInput: { count: count.toString(), hourBranch: hour },
    inputSummary: `${count} 聲・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", count, 8, "所聞聲數 = "),
      commonTrace("下卦", lowerTotal, 8, `${count} + 時支 ${hour} = `),
      commonTrace("動爻", lowerTotal, 6, "聲數加時數 = "),
    ],
    profile: options.profile ?? input.profile,
    assumptions: ["「加時數配作下卦」採聲數加時數同時作下卦與動爻總數；可由自訂 profile 另行保存異讀。"],
  });
}

export function calculateSegmentedSoundMethod(input, options = {}) {
  const originalInput = { ...input };
  const first = positive(input.firstCount, "第一段聲數");
  const second = positive(input.secondCount, "第二段聲數");
  const hour = toSafeInteger(input.hourBranch, "時支", 1, 12);
  const movingTotal = first + second + BigInt(hour);
  return buildMeihuaResult({
    method: "sound-segmented",
    methodLabel: "分段聲數起卦",
    upperTotal: first,
    lowerTotal: second,
    movingTotal,
    originalInput,
    normalizedInput: { firstCount: first.toString(), secondCount: second.toString(), hourBranch: hour },
    inputSummary: `第一段 ${first} 聲・第二段 ${second} 聲・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", first, 8, "第一段聲數 = "),
      commonTrace("下卦", second, 8, "第二段聲數 = "),
      commonTrace("動爻", movingTotal, 6, `${first} + ${second} + ${hour} = `),
    ],
    profile: options.profile ?? input.profile,
  });
}

export function countHanCharacters(rawText) {
  return [...String(rawText ?? "")].filter((character) => /\p{Script=Han}/u.test(character)).length;
}

export function extractHanCharacters(rawText) {
  return [...String(rawText ?? "")].filter((character) => /\p{Script=Han}/u.test(character));
}

function normalizeStrokeEntries(characters, rawEntries) {
  if (!Array.isArray(rawEntries)) throw new Error("請先自動查詢筆畫；查不到的字請手動輸入。");
  if (rawEntries.length !== characters.length) throw new Error("逐字筆畫數量與文字長度不一致，請重新查詢。");
  return rawEntries.map((entry, index) => {
    const character = characters[index];
    if (!entry || entry.character !== character) throw new Error(`第 ${index + 1} 字「${character}」的筆畫資料不一致。`);
    const strokes = toSafeInteger(entry.strokes, `「${character}」筆畫`, 1, 999);
    const sourceId = String(entry.sourceId || "manual");
    return {
      character,
      strokes,
      sourceId,
      sourceLabel: String(entry.sourceLabel || (sourceId === "manual" ? "手動輸入" : sourceId)),
      dataVersion: String(entry.dataVersion || ""),
      manualOverride: Boolean(entry.manualOverride || sourceId === "manual"),
    };
  });
}

function sumStrokeEntries(entries) {
  return entries.reduce((total, entry) => total + BigInt(entry.strokes), 0n);
}

function strokeSummary(entries) {
  return entries.map((entry) => `${entry.character} ${entry.strokes} 畫（${entry.sourceLabel}）`).join("、");
}

export function calculateStrokeTextMethod(input, options = {}) {
  const originalInput = { text: input.text, strokeEntries: input.strokeEntries };
  const characters = extractHanCharacters(input.text);
  if (characters.length < 2 || characters.length > 10) {
    throw new Error("筆畫分組法接受 2 至 10 個漢字；一字請用左右拆分，11 字以上請用字數法。");
  }
  const profile = resolveCalculationProfile(options.profile ?? input.profile);
  if (characters.length >= 4 && profile.textFourToTen !== "strokes") {
    throw new Error(`${profile.label}的四至十字主法是平上去入；若要改用逐字筆畫，請選擇使用者自訂並明確設定「逐字筆畫分組」。`);
  }
  const entries = normalizeStrokeEntries(characters, input.strokeEntries);
  const upperLength = Math.floor(characters.length / 2);
  const upperEntries = entries.slice(0, upperLength);
  const lowerEntries = entries.slice(upperLength);
  const upperTotal = sumStrokeEntries(upperEntries);
  const lowerTotal = sumStrokeEntries(lowerEntries);
  const movingTotal = upperTotal + lowerTotal;
  return buildMeihuaResult({
    method: "text-strokes",
    methodLabel: "筆畫分組起卦",
    upperTotal,
    lowerTotal,
    movingTotal,
    originalInput,
    normalizedInput: {
      characters,
      strokeEntries: entries,
      upperCharacters: upperEntries.map((entry) => entry.character),
      lowerCharacters: lowerEntries.map((entry) => entry.character),
    },
    inputSummary: `${characters.join("")}・${strokeSummary(entries)}`,
    trace: [
      { label: "逐字筆畫", equation: strokeSummary(entries) },
      commonTrace("上卦", upperTotal, 8, `${upperEntries.map((entry) => entry.strokes).join(" + ")} = `),
      commonTrace("下卦", lowerTotal, 8, `${lowerEntries.map((entry) => entry.strokes).join(" + ")} = `),
      commonTrace("動爻", movingTotal, 6, `${upperTotal} + ${lowerTotal} = `),
    ],
    profile,
    formulaSourceIds: ["MYS-WIKI-01", "MYS-CTEXT-01"],
    dataSourceIds: strokeSourceIds(entries),
    dataVersions: {
      strokes: [...new Set(entries.map((entry) => `${entry.sourceId}:${entry.dataVersion || "unspecified"}`))],
    },
  });
}

export function calculateSingleCharacterMethod(input, options = {}) {
  const characters = extractHanCharacters(input.text);
  if (characters.length !== 1) throw new Error("一字占必須剛好輸入一個漢字。");
  const left = positive(input.leftStrokes, "左部筆畫");
  const right = positive(input.rightStrokes, "右部筆畫");
  const total = left + right;
  return buildMeihuaResult({
    method: "text-single-character",
    methodLabel: "一字左右拆分起卦",
    upperTotal: left,
    lowerTotal: right,
    movingTotal: total,
    originalInput: { ...input },
    normalizedInput: { character: characters[0], leftStrokes: left.toString(), rightStrokes: right.toString() },
    inputSummary: `${characters[0]}・左 ${left} 畫・右 ${right} 畫`,
    trace: [
      commonTrace("上卦", left, 8, "楷書左部陽畫 = "),
      commonTrace("下卦", right, 8, "楷書右部陰畫 = "),
      commonTrace("動爻", total, 6, `${left} + ${right} = `),
    ],
    profile: options.profile ?? input.profile,
    warnings: ["Unicode 總筆畫不能自動判定古籍所稱左右陰陽畫；左右筆畫必須由使用者依所寫楷書手動確認。"],
  });
}

export function calculateToneTextMethod(input, options = {}) {
  const characters = extractHanCharacters(input.text);
  if (characters.length < 4 || characters.length > 10) throw new Error("平上去入聲調法接受 4 至 10 個漢字。");
  if (!Array.isArray(input.toneValues) || input.toneValues.length !== characters.length) {
    throw new Error("請逐字輸入古代平、上、去、入聲數。");
  }
  const tones = input.toneValues.map((value, index) => toSafeInteger(value, `「${characters[index]}」聲調數`, 1, 4));
  const upperLength = Math.floor(characters.length / 2);
  const upperTotal = tones.slice(0, upperLength).reduce((sum, value) => sum + BigInt(value), 0n);
  const lowerTotal = tones.slice(upperLength).reduce((sum, value) => sum + BigInt(value), 0n);
  const movingTotal = upperTotal + lowerTotal;
  return buildMeihuaResult({
    method: "text-tones",
    methodLabel: "四至十字平上去入起卦",
    upperTotal,
    lowerTotal,
    movingTotal,
    originalInput: { ...input },
    normalizedInput: { characters, toneValues: tones, upperLength },
    inputSummary: `${characters.join("")}・聲調數 ${tones.join("、")}`,
    trace: [
      { label: "聲調", equation: characters.map((character, index) => `${character}=${tones[index]}`).join("；") + "（平1、上2、去3、入4）" },
      commonTrace("上卦", upperTotal, 8),
      commonTrace("下卦", lowerTotal, 8),
      commonTrace("動爻", movingTotal, 6),
    ],
    profile: options.profile ?? input.profile,
    warnings: ["古代四聲不可直接用現代國語聲調自動代換；本功能要求人工確認。"],
  });
}

export function calculateLongTextMethod(rawInput, options = {}) {
  const input = typeof rawInput === "string" ? { text: rawInput } : rawInput;
  const characters = extractHanCharacters(input.text);
  const count = characters.length;
  if (count < 11 || count > 100) throw new Error("字數法只接受 11 至 100 個漢字；空格、標點、數字及符號不計入。");
  const upperCount = Math.floor(count / 2);
  const lowerCount = Math.ceil(count / 2);
  return buildMeihuaResult({
    method: "text-count",
    methodLabel: "十一字以上字數起卦",
    upperTotal: BigInt(upperCount),
    lowerTotal: BigInt(lowerCount),
    movingTotal: BigInt(count),
    originalInput: { text: input.text },
    normalizedInput: { characters, count, upperCount, lowerCount },
    inputSummary: `共 ${count} 個漢字・上組 ${upperCount} 字・下組 ${lowerCount} 字`,
    trace: [
      { label: "字數", equation: `只計漢字，共 ${count} 字` },
      commonTrace("上卦", upperCount, 8, `前 ${upperCount} 字 = `),
      commonTrace("下卦", lowerCount, 8, `後 ${lowerCount} 字 = `),
      commonTrace("動爻", count, 6, `${upperCount} + ${lowerCount} = `),
    ],
    profile: options.profile ?? input.profile,
  });
}

export function calculateTextMethod(input, options = {}) {
  const count = countHanCharacters(input.text);
  if (count === 1) return calculateSingleCharacterMethod(input, options);
  if (count >= 2 && count <= 3) return calculateStrokeTextMethod(input, options);
  if (count >= 4 && count <= 10) {
    const profile = resolveCalculationProfile(options.profile ?? input.profile);
    return profile.textFourToTen === "strokes"
      ? calculateStrokeTextMethod(input, { ...options, profile })
      : calculateToneTextMethod(input, { ...options, profile });
  }
  return calculateLongTextMethod(input, options);
}

export function calculateZhangChiMethod(input, options = {}) {
  const zhang = positive(input.zhang, "丈數");
  const chi = positive(input.chi, "尺數");
  const movingTotal = zhang + chi;
  return buildMeihuaResult({
    method: "length-zhang-chi",
    methodLabel: "丈尺占",
    upperTotal: zhang,
    lowerTotal: chi,
    movingTotal,
    originalInput: { ...input },
    normalizedInput: { zhang: zhang.toString(), chi: chi.toString() },
    inputSummary: `${zhang} 丈・${chi} 尺`,
    trace: [
      commonTrace("上卦", zhang, 8, "丈數 = "),
      commonTrace("下卦", chi, 8, "尺數 = "),
      commonTrace("動爻", movingTotal, 6, `${zhang} + ${chi} = `),
      { label: "忽略", equation: "古籍明載寸數不用。" },
    ],
    profile: options.profile ?? input.profile,
    ignoredInput: input.cun ? [`寸數 ${input.cun} 未納入丈尺占。`] : [],
  });
}

export function calculateChiCunMethod(input, options = {}) {
  const profile = resolveCalculationProfile(options.profile ?? input.profile);
  const chi = positive(input.chi, "尺數");
  const cun = positive(input.cun, "寸數");
  const hour = toSafeInteger(input.hourBranch ?? 1, "時支", 1, 12);
  const profileVersion = profile.sizeMovingIncludesHour ? "modern-with-hour" : "old-without-hour";
  const version = input.version || profileVersion;
  if (version !== profileVersion) {
    throw new Error(`${profile.label}設定的尺寸版本為「${profileVersion}」，但輸入要求「${version}」；請改用相符 profile 或使用者自訂，不可在結果中混掛版本名稱。`);
  }
  const includesHour = version === "modern-with-hour";
  const movingTotal = chi + cun + (includesHour ? BigInt(hour) : 0n);
  return buildMeihuaResult({
    method: "length-chi-cun",
    methodLabel: "尺寸占",
    upperTotal: chi,
    lowerTotal: cun,
    movingTotal,
    originalInput: { ...input },
    normalizedInput: { chi: chi.toString(), cun: cun.toString(), hourBranch: hour, version },
    inputSummary: `${chi} 尺・${cun} 寸・${includesHour ? `傳本主法加${branch(hour).name}時` : "未證異法不加時辰"}`,
    trace: [
      commonTrace("上卦", chi, 8, "尺數 = "),
      commonTrace("下卦", cun, 8, "寸數 = "),
      commonTrace("動爻", movingTotal, 6, includesHour ? `${chi} + ${cun} + ${hour} = ` : `${chi} + ${cun} = `),
      { label: "版本", equation: includesHour ? "可核傳本主法：動爻加入時辰。" : "未證流傳異法：動爻不加入時辰。" },
    ],
    profile,
    assumptions: [`尺寸占版本：${includesHour ? "可核傳本主法（加時辰）" : "流傳異法（不加時辰，未找到可核古本影證）"}。`],
    warnings: includesHour ? [] : ["目前可核《梅花易數》傳本均寫尺寸合數加時取爻；未找到可核古本影證支持不加時，只作未證異法保留。"],
  });
}

const scenarioLabels = Object.freeze({
  posterior: "後天端法",
  person: "為人占",
  self: "自己占",
  animal: "動物占",
  static: "靜物占",
  direction: "方位取卦",
});

export function calculatePosteriorMethod(input, options = {}) {
  const scenario = String(input.scenario || "posterior");
  const object = trigramById(input.objectTrigram, "物象卦");
  const direction = trigramById(input.directionTrigram, "方位卦");
  const hour = toSafeInteger(input.hourBranch, "時支", 1, 12);
  const movingTotal = BigInt(object.id + direction.id + hour);
  const warnings = [];
  if (scenario === "static" && !String(input.trigger || "").trim()) {
    warnings.push("不動不占、無故不占：靜物占的原文要求有初創、置成或異常觸發；目前未填觸發事件，請自行核對是否具備起占條件。");
  }
  if (scenario === "animal" && !String(input.trigger || "").trim()) {
    warnings.push("不動不占：請記錄單一動物、所來方位及當時觸發情境，以便重播本次輸入。");
  }
  if (scenario === "animal" && Number(input.subjectCount || 1) !== 1) {
    throw new Error("動物後天端法只接受單一所見之物；群物之動原文不作此法起卦。");
  }
  if (scenario === "direction") {
    warnings.push("方位在後天端法中只提供下卦，仍須先由所見物象確認上卦；本工具不以單一方向冒充完整重卦。");
  }
  return buildMeihuaResult({
    method: `posterior-${scenario}`,
    methodLabel: scenarioLabels[scenario] || scenarioLabels.posterior,
    upperTotal: BigInt(object.id),
    lowerTotal: BigInt(direction.id),
    movingTotal,
    originalInput: { ...input },
    normalizedInput: {
      scenario,
      objectTrigram: object.id,
      directionTrigram: direction.id,
      hourBranch: hour,
      trigger: String(input.trigger || "").trim(),
      objectDescription: String(input.objectDescription || "").trim(),
      objectCandidateConfirmed: input.objectCandidateConfirmed === true || input.objectCandidateConfirmed === "true" || input.objectCandidateConfirmed === "on",
      subjectCount: scenario === "animal" ? 1 : null,
    },
    inputSummary: `${object.name}為物象・${direction.name}為方位・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", object.id, 8, `${object.name}先天數 = `),
      commonTrace("下卦", direction.id, 8, `${direction.name}先天數 = `),
      commonTrace("動爻", movingTotal, 6, `${object.id} + ${direction.id} + ${hour} = `),
    ],
    profile: options.profile ?? input.profile,
    warnings: [
      ...warnings,
      ...(String(input.objectDescription || "").trim() && !(input.objectCandidateConfirmed === true || input.objectCandidateConfirmed === "true" || input.objectCandidateConfirmed === "on")
        ? ["已記錄物象描述，但候選只供比對；請以所選物象卦作為使用者最終確認。"] : []),
    ],
  });
}

export function calculateSurnameAdditionMethod(input, options = {}) {
  const characters = extractHanCharacters(input.name ?? input.surname);
  if (!characters.length) throw new Error("請輸入姓名或姓氏。");
  const entries = normalizeStrokeEntries(characters, input.strokeEntries);
  const addedTotal = sumStrokeEntries(entries);
  const year = toSafeInteger(input.yearBranch, "年支", 1, 12);
  const month = toSafeInteger(input.lunarMonth, "農曆月", 1, 12);
  const day = toSafeInteger(input.lunarDay, "農曆日", 1, 30);
  const hour = toSafeInteger(input.hourBranch, "時支", 1, 12);
  const upperTotal = BigInt(year + month + day) + addedTotal;
  const lowerTotal = upperTotal + BigInt(hour);
  return buildMeihuaResult({
    method: "surname-addition",
    methodLabel: "姓名或姓氏加數法",
    upperTotal,
    lowerTotal,
    movingTotal: lowerTotal,
    originalInput: { ...input, strokeEntries: input.strokeEntries },
    normalizedInput: {
      characters,
      strokeEntries: entries,
      addedTotal: addedTotal.toString(),
      yearBranch: year,
      lunarMonth: month,
      lunarDay: day,
      hourBranch: hour,
    },
    inputSummary: `${characters.join("")}・${strokeSummary(entries)}・共加 ${addedTotal} 畫`,
    trace: [
      { label: "姓名筆畫", equation: `${strokeSummary(entries)}；合計 ${addedTotal} 畫` },
      commonTrace("上卦", upperTotal, 8, `${year} + ${month} + ${day} + ${addedTotal} = `),
      commonTrace("下卦", lowerTotal, 8, `${upperTotal} + ${hour} = `),
      commonTrace("動爻", lowerTotal, 6),
    ],
    profile: options.profile ?? input.profile ?? "modern-current-v1",
    formulaSourceIds: [],
    dataSourceIds: strokeSourceIds(entries),
    formulaSourceStatus: "not-found",
    formulaSourceNotice: "本次核對《梅花易數》卷一未找到姓名或姓氏加數法的單一固定原文；這是流傳／使用者指定規約。",
    dataVersions: {
      strokes: [...new Set(entries.map((entry) => `${entry.sourceId}:${entry.dataVersion || "unspecified"}`))],
    },
    warnings: ["本次核對《梅花易數》卷一未找到姓名或姓氏加數法的單一固定原文；此結果屬流傳／使用者指定規約，不冒充古籍主法。"],
    seasonalLunarMonth: month,
  });
}
