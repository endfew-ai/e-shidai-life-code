import { earthlyBranches } from "./shared-data.js";
import { buildMeihuaResult, trigramById } from "./engine.js";
import { toIntegerBigInt, toSafeInteger } from "./math.js";
import { resolveCalculationProfile } from "./profiles.js";

function positive(rawValue, label) {
  return toIntegerBigInt(rawValue, label, { minimum: 1 });
}

function branch(value) {
  return earthlyBranches[value - 1];
}

function commonTrace(label, total, divisor, detail = "") {
  return { label, equation: `${detail}${total}；除以 ${divisor}，整除時取 ${divisor}` };
}

export function calculateCalendarMethod(input, options = {}) {
  const originalInput = { ...input };
  const year = toSafeInteger(input.yearBranch, "年支", 1, 12);
  const month = toSafeInteger(input.lunarMonth, "農曆月", 1, 12);
  const day = toSafeInteger(input.lunarDay, "農曆日", 1, 30);
  const hour = toSafeInteger(input.hourBranch, "時支", 1, 12);
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
    normalizedInput: { yearBranch: year, lunarMonth: month, lunarDay: day, hourBranch: hour },
    inputSummary: `${branch(year).name}年・農曆${month}月${day}日・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", upperTotal, 8, `${year} + ${month} + ${day} = `),
      commonTrace("下卦", lowerTotal, 8, `${upperTotal} + ${hour} = `),
      commonTrace("動爻", lowerTotal, 6),
    ],
    profile,
    sourceIds: ["MYS-WIKI-01", "MYS-CTEXT-01", "CWA-CALENDAR-01"],
    assumptions: input.calendarTrace ? [`曆法輸入由 ${input.calendarTrace} 提供。`] : [],
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
    profile: options.profile ?? input.profile,
    sourceIds: ["MYS-WIKI-01", "MYS-CTEXT-01", "UNICODE-UNIHAN-17.0.0", "MOE-STANDARD-FONT-01"],
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
  const version = input.version || (profile.sizeMovingIncludesHour ? "modern-with-hour" : "old-without-hour");
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
  if ((scenario === "static" || scenario === "animal") && !String(input.trigger || "").trim()) {
    warnings.push("古籍強調不動不占、無故不占；請自行確認本次觸發事件。");
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
    },
    inputSummary: `${object.name}為物象・${direction.name}為方位・${branch(hour).name}時`,
    trace: [
      commonTrace("上卦", object.id, 8, `${object.name}先天數 = `),
      commonTrace("下卦", direction.id, 8, `${direction.name}先天數 = `),
      commonTrace("動爻", movingTotal, 6, `${object.id} + ${direction.id} + ${hour} = `),
    ],
    profile: options.profile ?? input.profile,
    warnings,
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
    profile: options.profile ?? input.profile,
    sourceIds: ["UNICODE-UNIHAN-17.0.0", "MOE-STANDARD-FONT-01"],
    dataVersions: {
      strokes: [...new Set(entries.map((entry) => `${entry.sourceId}:${entry.dataVersion || "unspecified"}`))],
    },
    warnings: ["本次核對《梅花易數》卷一未找到姓名或姓氏加數法的單一固定原文；此結果屬流傳／使用者指定規約，不冒充古籍主法。"],
  });
}
