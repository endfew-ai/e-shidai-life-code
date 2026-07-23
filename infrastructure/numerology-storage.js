import { DEFAULT_RULE_SET, resolveRuleSet } from "../domain/numerology/rule-data.js";
import { createHistoryRecord } from "../domain/numerology/interpretation.js";

export const NUMEROLOGY_SETTINGS_KEY = "e-shidai-numerology-settings-v1";
export const NUMEROLOGY_HISTORY_KEY = "e-shidai-numerology-history-v1";
export const NUMEROLOGY_STORAGE_SCHEMA_VERSION = 1;
export const MAX_HISTORY_RECORDS = 20;

function resolveStorage(provided) {
  if (provided !== undefined) return provided;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function defaultNumerologySettings() {
  return Object.freeze({
    schemaVersion: NUMEROLOGY_STORAGE_SCHEMA_VERSION,
    ruleSetId: DEFAULT_RULE_SET.id,
    masterNumberMode: DEFAULT_RULE_SET.masterNumberMode,
    customMasterNumbers: Object.freeze([]),
    birthGridMode: DEFAULT_RULE_SET.birthGridMode,
    zeroFiveMode: DEFAULT_RULE_SET.zeroFiveMode,
    timelineProfile: DEFAULT_RULE_SET.timelineProfile,
    symbolMode: "skip_spaces_hyphens",
  });
}

function normalizeSettings(candidate) {
  const defaults = defaultNumerologySettings();
  const combined = {
    ...defaults,
    ...(candidate && typeof candidate === "object" ? candidate : {}),
    schemaVersion: NUMEROLOGY_STORAGE_SCHEMA_VERSION,
  };
  const baseRuleSet = resolveRuleSet(combined.ruleSetId);
  const ruleSet = resolveRuleSet(baseRuleSet, {
    masterNumberMode: combined.masterNumberMode,
    customMasterNumbers: combined.customMasterNumbers,
    birthGridMode: combined.birthGridMode,
    zeroFiveMode: combined.zeroFiveMode,
    timelineProfile: combined.timelineProfile,
  });
  return Object.freeze({
    schemaVersion: NUMEROLOGY_STORAGE_SCHEMA_VERSION,
    ruleSetId: baseRuleSet.id,
    masterNumberMode: ruleSet.masterNumberMode,
    customMasterNumbers: ruleSet.customMasterNumbers,
    birthGridMode: ruleSet.birthGridMode,
    zeroFiveMode: ruleSet.zeroFiveMode,
    timelineProfile: ruleSet.timelineProfile,
    symbolMode: ["skip_spaces_hyphens", "skip_all", "error"].includes(combined.symbolMode)
      ? combined.symbolMode
      : defaults.symbolMode,
  });
}

export function loadNumerologySettings(storage) {
  const store = resolveStorage(storage);
  if (!store) return defaultNumerologySettings();
  try {
    const raw = store.getItem(NUMEROLOGY_SETTINGS_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : defaultNumerologySettings();
  } catch {
    return defaultNumerologySettings();
  }
}

export function saveNumerologySettings(candidate, storage) {
  const store = resolveStorage(storage);
  const normalized = normalizeSettings(candidate);
  if (!store) return normalized;
  try {
    store.setItem(NUMEROLOGY_SETTINGS_KEY, JSON.stringify(normalized));
  } catch {
    throw new Error("瀏覽器無法儲存規則設定；本次仍可使用，但重新開啟後會恢復預設。");
  }
  return normalized;
}

export function resolveSettingsRuleSet(settings = loadNumerologySettings()) {
  const normalized = normalizeSettings(settings);
  return resolveRuleSet(normalized.ruleSetId, {
    masterNumberMode: normalized.masterNumberMode,
    customMasterNumbers: normalized.customMasterNumbers,
    birthGridMode: normalized.birthGridMode,
    zeroFiveMode: normalized.zeroFiveMode,
    timelineProfile: normalized.timelineProfile,
  });
}

function validHistoryRecord(record) {
  return record
    && record.schemaVersion === NUMEROLOGY_STORAGE_SCHEMA_VERSION
    && typeof record.id === "string"
    && typeof record.inputType === "string"
    && typeof record.maskedInput === "string"
    && record.sensitiveDataStored === false
    && !Object.hasOwn(record, "normalizedInput")
    && !Object.hasOwn(record, "structuredResult");
}

export function loadAnalysisHistory(storage) {
  const store = resolveStorage(storage);
  if (!store) return Object.freeze([]);
  try {
    const raw = store.getItem(NUMEROLOGY_HISTORY_KEY);
    if (!raw) return Object.freeze([]);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Object.freeze([]);
    return Object.freeze(parsed.filter(validHistoryRecord).slice(0, MAX_HISTORY_RECORDS).map(Object.freeze));
  } catch {
    return Object.freeze([]);
  }
}

export function saveAnalysisHistory(analysis, storage) {
  const store = resolveStorage(storage);
  const record = createHistoryRecord(analysis);
  if (!validHistoryRecord(record)) throw new Error("歷史紀錄包含不允許的敏感欄位。");
  const next = Object.freeze([
    record,
    ...loadAnalysisHistory(store).filter((existing) => existing.id !== record.id),
  ].slice(0, MAX_HISTORY_RECORDS));
  if (!store) return next;
  try {
    store.setItem(NUMEROLOGY_HISTORY_KEY, JSON.stringify(next));
  } catch {
    throw new Error("瀏覽器無法儲存歷史紀錄。");
  }
  return next;
}

export function clearAnalysisHistory(storage) {
  const store = resolveStorage(storage);
  if (!store) return false;
  try {
    store.removeItem(NUMEROLOGY_HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}
