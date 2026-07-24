import { extractHanCharacters } from "./methods.js";

export const strokeProviderMetadata = Object.freeze({
  "moe-concised": Object.freeze({
    providerId: "moe-concised",
    sourceLabel: "教育部《國語辭典簡編本》",
    authority: "moe-taiwan",
    sourceField: "總筆畫數",
    sourceUrl: "https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_concised_download.html",
    licenseId: "CC-BY-ND-3.0-TW",
    bundled: false,
    notice: "供應器介面已支援；為保守遵守禁止改作條款，公開版本未散布轉換後索引，需載入獲授權的原始資料解析結果。",
  }),
  "unicode-unihan": Object.freeze({
    providerId: "unicode-unihan",
    sourceLabel: "Unicode Unihan kTotalStrokes",
    authority: "unicode-irg-informative",
    sourceField: "kTotalStrokes",
    sourceVersion: "17.0.0",
    sourceUrl: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
    licenseId: "Unicode-3.0",
    bundled: true,
    notice: "Unicode／IRG informative 總筆畫，不是教育部標準字體或康熙筆畫。",
  }),
  "manual-user": Object.freeze({
    providerId: "manual-user",
    sourceLabel: "使用者手動輸入",
    authority: "manual",
    sourceField: "manual",
    bundled: false,
    notice: "人工覆寫只作用於本次演算，不修改官方資料。",
  }),
  "kangxi-authorized": Object.freeze({
    providerId: "kangxi-authorized",
    sourceLabel: "康熙筆畫（尚無授權資料）",
    authority: "kangxi",
    sourceField: null,
    bundled: false,
    notice: "Unihan kKangXi 是頁碼索引而非筆畫；未取得可稽核授權資料前不啟用。",
  }),
});

export async function loadStrokeDataset(url = "/data/unihan-kTotalStrokes-17.0.0.json", fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new Error("目前環境沒有可用的 fetch，請直接傳入已載入的筆畫資料。");
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`筆畫資料載入失敗（HTTP ${response.status}）。`);
  const dataset = await response.json();
  if (
    dataset?.schemaVersion !== "unihan-total-strokes-index-v1"
    || dataset?.sourceId !== "UNICODE-UNIHAN-17.0.0"
    || typeof dataset?.records !== "object"
  ) {
    throw new Error("筆畫資料格式或版本不符。");
  }
  return dataset;
}

function normalizedDatasetRecord(dataset, character, providerId) {
  if (!dataset?.records) return null;
  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) return null;
  const key = codePoint.toString(16).toUpperCase();
  const rawValue = dataset.records[key];
  if (!Number.isInteger(rawValue) || rawValue < 1 || rawValue > 999) return null;
  const metadata = strokeProviderMetadata[providerId];
  return {
    character,
    codePoints: [`U+${key}`],
    strokes: rawValue,
    count: rawValue,
    sourceId: providerId,
    providerId,
    sourceLabel: metadata.sourceLabel,
    dataVersion: String(dataset.sourceVersion || ""),
    sourceVersion: String(dataset.sourceVersion || ""),
    sourceField: String(dataset.sourceField || metadata.sourceField || ""),
    rawValue: String(rawValue),
    sourceUrl: metadata.sourceUrl,
    licenseId: metadata.licenseId,
    authority: metadata.authority,
    manualOverride: false,
    warnings: metadata.notice ? [metadata.notice] : [],
  };
}

function manualRecord(character, rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") return null;
  const strokes = Number(rawValue);
  if (!Number.isInteger(strokes) || strokes < 1 || strokes > 999) {
    throw new Error(`「${character}」手動筆畫必須是 1 至 999 的完整整數。`);
  }
  const key = character.codePointAt(0)?.toString(16).toUpperCase() ?? "";
  return {
    character,
    codePoints: key ? [`U+${key}`] : [],
    strokes,
    count: strokes,
    sourceId: "manual",
    providerId: "manual-user",
    sourceLabel: "手動輸入",
    dataVersion: "",
    sourceVersion: "",
    sourceField: "manual",
    rawValue: String(strokes),
    sourceUrl: null,
    licenseId: null,
    authority: "manual",
    manualOverride: true,
    warnings: ["此筆畫由使用者手動覆寫，只作用於本次演算。"],
  };
}

export function lookupStroke(character, {
  manualValue,
  moeDataset = null,
  unihanDataset = null,
  prefer = "moe",
} = {}) {
  const manual = manualRecord(character, manualValue);
  const moe = normalizedDatasetRecord(moeDataset, character, "moe-concised");
  const unihan = normalizedDatasetRecord(unihanDataset, character, "unicode-unihan");
  const candidates = [manual, moe, unihan].filter(Boolean);
  let selected = manual;
  let selectedBy = manual ? "manual-override" : null;
  if (!selected) {
    selected = prefer === "unicode" ? (unihan || moe) : (moe || unihan);
    selectedBy = selected ? "profile" : null;
  }
  const warnings = [];
  if (moe && unihan && moe.strokes !== unihan.strokes) {
    warnings.push(`教育部 ${moe.strokes} 畫與 Unicode／IRG ${unihan.strokes} 畫不同，已依目前資料 profile 選擇。`);
  }
  return {
    character,
    selected,
    candidates,
    status: selected ? (warnings.length ? "conflict" : "resolved") : "manual",
    requiresManualInput: !selected,
    selectedBy,
    warnings,
  };
}

export function resolveStrokeText(rawText, {
  manualOverrides = [],
  moeDataset = null,
  unihanDataset = null,
  prefer = "moe",
} = {}) {
  const characters = extractHanCharacters(rawText);
  const lookups = characters.map((character, index) => lookupStroke(character, {
    manualValue: manualOverrides[index],
    moeDataset,
    unihanDataset,
    prefer,
  }));
  return {
    characters,
    lookups,
    entries: lookups.map((lookup) => lookup.selected),
    unresolved: lookups.map((lookup, index) => lookup.requiresManualInput ? { index, character: lookup.character } : null).filter(Boolean),
    ready: lookups.length > 0 && lookups.every((lookup) => !lookup.requiresManualInput),
  };
}

export function kangxiStrokeStatus(character) {
  return {
    character,
    selected: null,
    candidates: [],
    status: "unavailable",
    requiresManualInput: true,
    selectedBy: null,
    warnings: [strokeProviderMetadata["kangxi-authorized"].notice],
  };
}
