import assert from "node:assert/strict";
import test from "node:test";

import { analyzeIdentityV2 } from "../application/numerology-analysis.js";
import {
  MAX_HISTORY_RECORDS,
  NUMEROLOGY_HISTORY_KEY,
  NUMEROLOGY_SETTINGS_KEY,
  clearAnalysisHistory,
  defaultNumerologySettings,
  loadAnalysisHistory,
  loadNumerologySettings,
  resolveSettingsRuleSet,
  saveAnalysisHistory,
  saveNumerologySettings,
} from "../infrastructure/numerology-storage.js";

const TODAY = "2026-07-23";
const CREATED_AT = "2026-07-23T04:05:06.000Z";

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }
}

function syntheticAnalysis(index, overrides = {}) {
  return {
    schemaVersion: 1,
    id: `history-${index}`,
    inputType: "custom_sequence",
    maskedInput: `測試序列-${index}`,
    normalizedInput: `PRIVATE-${index}`,
    ruleSetId: "uploaded-material-v2",
    ruleSet: {
      id: "uploaded-material-v2",
      version: "2.0.0",
    },
    createdAt: `2026-07-23T04:${String(index).padStart(2, "0")}:00.000Z`,
    warnings: [],
    dominantField: { fields: ["天醫"] },
    reportSections: [{
      id: "magnetic-pairs",
      title: "相鄰磁場",
      summary: `摘要 ${index}`,
    }],
    ...overrides,
  };
}

test("規則設定可儲存、重載並解析為有效規則集", () => {
  const storage = new MemoryStorage();
  assert.deepEqual(loadNumerologySettings(storage), defaultNumerologySettings());

  const saved = saveNumerologySettings({
    ruleSetId: "uploaded-material-v2",
    masterNumberMode: "preserve_custom",
    customMasterNumbers: [44, "11", 44, -1, "not-a-number"],
    birthGridMode: "raw_plus_life_path",
    zeroFiveMode: "literal",
    timelineProfile: "cyclic_5_year",
    symbolMode: "error",
  }, storage);

  assert.deepEqual(saved.customMasterNumbers, [11, 44]);
  assert.equal(saved.birthGridMode, "raw_plus_life_path");
  assert.equal(saved.zeroFiveMode, "literal");
  assert.equal(saved.timelineProfile, "cyclic_5_year");
  assert.equal(saved.symbolMode, "error");
  assert.deepEqual(loadNumerologySettings(storage), saved);

  const ruleSet = resolveSettingsRuleSet(saved);
  assert.equal(ruleSet.masterNumberMode, "preserve_custom");
  assert.deepEqual(ruleSet.customMasterNumbers, [11, 44]);
  assert.equal(ruleSet.birthGridMode, "raw_plus_life_path");
  assert.equal(ruleSet.zeroFiveMode, "literal");
  assert.equal(ruleSet.timelineProfile, "cyclic_5_year");
});

test("損壞或不相容的設定不會污染預設值", () => {
  const storage = new MemoryStorage();
  storage.setItem(NUMEROLOGY_SETTINGS_KEY, "{broken-json");
  assert.deepEqual(loadNumerologySettings(storage), defaultNumerologySettings());

  storage.setItem(NUMEROLOGY_SETTINGS_KEY, JSON.stringify({
    ruleSetId: "unknown-rules",
  }));
  assert.deepEqual(loadNumerologySettings(storage), defaultNumerologySettings());

  assert.throws(
    () => saveNumerologySettings({
      ...defaultNumerologySettings(),
      masterNumberMode: "preserve_custom",
      customMasterNumbers: [],
    }, storage),
    /至少需要一個大於 9 的整數/,
  );
});

test("身分證歷史只保存遮罩、摘要與規則，不寫入完整號碼或可反推序列", () => {
  const storage = new MemoryStorage();
  const analysis = analyzeIdentityV2({
    id: "identity-private-history",
    value: "A123456789",
    todayValue: TODAY,
    currentYear: 2026,
    createdAt: CREATED_AT,
    timelineProfile: "first_10_then_5",
  });

  const history = saveAnalysisHistory(analysis, storage);
  assert.equal(history.length, 1);
  assert.equal(history[0].maskedInput, "A12*****89");
  assert.equal(history[0].sensitiveDataStored, false);
  assert.equal(Object.hasOwn(history[0], "normalizedInput"), false);
  assert.equal(Object.hasOwn(history[0], "structuredResult"), false);
  assert.equal(Object.hasOwn(history[0], "timeline"), false);

  const rawStored = storage.getItem(NUMEROLOGY_HISTORY_KEY);
  assert.doesNotMatch(rawStored, /A123456789/);
  assert.doesNotMatch(rawStored, /01123456789/);
  assert.doesNotMatch(rawStored, /normalizedInput/);
  assert.doesNotMatch(rawStored, /structuredResult/);
  assert.match(rawStored, /A12\*\*\*\*\*89/);
});

test("歷史紀錄去重、限制 20 筆，最新資料在前", () => {
  const storage = new MemoryStorage();
  for (let index = 0; index < MAX_HISTORY_RECORDS + 3; index += 1) {
    saveAnalysisHistory(syntheticAnalysis(index), storage);
  }

  const history = loadAnalysisHistory(storage);
  assert.equal(history.length, MAX_HISTORY_RECORDS);
  assert.equal(history[0].id, `history-${MAX_HISTORY_RECORDS + 2}`);
  assert.equal(history.at(-1).id, "history-3");

  saveAnalysisHistory(syntheticAnalysis(10, {
    maskedInput: "更新後遮罩",
    reportSections: [{ id: "updated", title: "更新", summary: "更新摘要" }],
  }), storage);
  const deduplicated = loadAnalysisHistory(storage);
  assert.equal(deduplicated.length, MAX_HISTORY_RECORDS);
  assert.equal(deduplicated[0].id, "history-10");
  assert.equal(deduplicated[0].maskedInput, "更新後遮罩");
  assert.equal(deduplicated.filter(({ id }) => id === "history-10").length, 1);
});

test("載入歷史會排除帶有敏感欄位或版本不符的紀錄", () => {
  const storage = new MemoryStorage();
  const valid = {
    schemaVersion: 1,
    id: "valid",
    inputType: "taiwan_national_id",
    maskedInput: "A12*****89",
    sensitiveDataStored: false,
  };
  storage.setItem(NUMEROLOGY_HISTORY_KEY, JSON.stringify([
    valid,
    { ...valid, id: "full-id", normalizedInput: "A123456789" },
    { ...valid, id: "result-copy", structuredResult: { fullSequence: "01123456789" } },
    { ...valid, id: "claims-sensitive", sensitiveDataStored: true },
    { ...valid, id: "future-schema", schemaVersion: 2 },
  ]));

  assert.deepEqual(loadAnalysisHistory(storage).map(({ id }) => id), ["valid"]);
});

test("清除歷史只移除歷史鍵，不影響規則設定", () => {
  const storage = new MemoryStorage();
  saveNumerologySettings(defaultNumerologySettings(), storage);
  saveAnalysisHistory(syntheticAnalysis(1), storage);
  assert.equal(loadAnalysisHistory(storage).length, 1);

  assert.equal(clearAnalysisHistory(storage), true);
  assert.deepEqual(loadAnalysisHistory(storage), []);
  assert.notEqual(storage.getItem(NUMEROLOGY_SETTINGS_KEY), null);
  assert.equal(clearAnalysisHistory(null), false);
});

test("沒有 localStorage 時仍可回傳設定與記憶體內歷史，不假裝已持久化", () => {
  const settings = saveNumerologySettings(defaultNumerologySettings(), null);
  assert.deepEqual(settings, defaultNumerologySettings());

  const history = saveAnalysisHistory(syntheticAnalysis(1), null);
  assert.equal(history.length, 1);
  assert.equal(history[0].id, "history-1");
  assert.equal(history[0].sensitiveDataStored, false);
});
