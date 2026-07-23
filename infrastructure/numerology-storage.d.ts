import type {
  AnalysisHistoryRecord,
  RuleSet,
  RuleSetOverrides,
  SymbolMode,
  TimelineProfileId,
  BirthGridMode,
  MasterNumberMode,
  ZeroFiveMode,
} from "../domain/numerology/index.js";
import type { AnalysisResult } from "../application/numerology-analysis.js";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface NumerologySettings {
  readonly schemaVersion: 1;
  readonly ruleSetId: string;
  readonly masterNumberMode: MasterNumberMode;
  readonly customMasterNumbers: readonly number[];
  readonly birthGridMode: BirthGridMode;
  readonly zeroFiveMode: ZeroFiveMode;
  readonly timelineProfile: TimelineProfileId;
  readonly symbolMode: SymbolMode;
}

export type NumerologySettingsInput = Partial<NumerologySettings> & RuleSetOverrides;

export const NUMEROLOGY_SETTINGS_KEY: "e-shidai-numerology-settings-v1";
export const NUMEROLOGY_HISTORY_KEY: "e-shidai-numerology-history-v1";
export const NUMEROLOGY_STORAGE_SCHEMA_VERSION: 1;
export const MAX_HISTORY_RECORDS: 20;

export function defaultNumerologySettings(): NumerologySettings;
export function loadNumerologySettings(storage?: StorageLike | null): NumerologySettings;
export function saveNumerologySettings(
  candidate: NumerologySettingsInput,
  storage?: StorageLike | null,
): NumerologySettings;
export function resolveSettingsRuleSet(settings?: NumerologySettingsInput): RuleSet;
export function loadAnalysisHistory(storage?: StorageLike | null): readonly AnalysisHistoryRecord[];
export function saveAnalysisHistory(
  analysis: AnalysisResult,
  storage?: StorageLike | null,
): readonly AnalysisHistoryRecord[];
export function clearAnalysisHistory(storage?: StorageLike | null): boolean;
