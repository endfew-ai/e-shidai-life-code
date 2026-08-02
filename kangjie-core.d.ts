import type { IChingAnalysis, Trigram } from "./calculator-core.js";

export type InputValue = FormDataEntryValue | string | number | bigint | null | undefined;
export type KangjieTrace = { label: string; equation: string; note?: string };
export type SourceRef = {
  id: string;
  title: string;
  organization: string;
  url: string;
  scope: string;
  accessedOn?: string;
  version?: string;
};
export type StrokeEntry = {
  character: string;
  strokes: InputValue;
  sourceId?: string;
  sourceLabel?: string;
  dataVersion?: string;
  manualOverride?: boolean;
};
export type ElementRelation = {
  code: "same" | "body-generates-use" | "use-generates-body" | "body-controls-use" | "use-controls-body";
  label: string;
  bodyElement: "金" | "木" | "水" | "火" | "土";
  useElement: "金" | "木" | "水" | "火" | "土";
  explanation: string;
};
export type InfluenceRelation = {
  stage: string;
  trigram: Trigram & { element: string };
  relation: ElementRelation;
};
export type SeasonalStrength = {
  lunarMonth: number;
  monthBranch: string;
  season: string;
  status: "旺" | "衰" | "平";
  trigramId: number;
  trigramName: string;
  element: string;
  explanation: string;
};
export type KangjieAnalysis = Omit<IChingAnalysis, "kind"> & {
  kind: "kangjie";
  method: string;
  methodLabel: string;
  algorithmVersion: string;
  profileId: string;
  profileLabel: string;
  mutualSource: "original" | "transformed";
  roles: {
    body: Trigram & { element: string; position: "upper" | "lower" };
    use: Trigram & { element: string; position: "upper" | "lower" };
    transformedUse: Trigram & { element: string; position: "upper" | "lower" };
    note: string;
  };
  fiveElements: ElementRelation;
  influenceRelations: InfluenceRelation[];
  partyBalance: { bodyElement: string; useElement: string; bodyPartyCount: number; usePartyCount: number | null; note: string };
  seasonalStrength: null | {
    lunarMonth: number;
    body: SeasonalStrength;
    use: SeasonalStrength;
    mutualLower: SeasonalStrength;
    mutualUpper: SeasonalStrength;
    transformedUse: SeasonalStrength;
    note: string;
  };
  trace: KangjieTrace[];
  inputSummary: string;
  sourceRefs: SourceRef[];
  formulaSourceRefs: SourceRef[];
  dataSourceRefs: SourceRef[];
  sharedCoreSourceRefs: SourceRef[];
  sourceScopes: {
    formula: { status: string; notice?: string; refs: SourceRef[] };
    data: { status: string; notice?: string; refs: SourceRef[] };
    sharedCore: { status: string; notice?: string; refs: SourceRef[] };
  };
  calculationTrace: {
    schemaVersion: string;
    methodId: string;
    algorithmVersion: string;
    profile: Record<string, unknown>;
    originalInput: Record<string, unknown>;
    normalizedInput: Record<string, unknown>;
    totals: { upper: string; lower: string; moving: string };
    modulo: Record<string, { total: string; divisor: number; quotient: string; remainder: string; result: number; exactMultipleRule: string }>;
    lineOrder: string;
    primaryLines: number[];
    mutualLowerSourceLines: number[];
    mutualUpperSourceLines: number[];
    changedLines: number[];
    movingLine: number;
    bodyUse: KangjieAnalysis["roles"];
    fiveElements: ElementRelation;
    influenceRelations: InfluenceRelation[];
    partyBalance: KangjieAnalysis["partyBalance"];
    seasonalStrength: KangjieAnalysis["seasonalStrength"];
    assumptions: string[];
    warnings: string[];
    ignoredInput: string[];
    sourceIds: string[];
    dataVersions: Record<string, unknown>;
  };
};

export type HuangjiAnalysis = {
  kind: "huangji";
  mode: "duration";
  algorithmVersion: string;
  profileId: string;
  profileLabel: string;
  totalYears: string;
  units: { yuan: string; hui: string; yun: string; shi: string; years: string };
  equation: string;
  sourceRefs: SourceRef[];
  calculationTrace: Record<string, unknown>;
};

export type HuangjiPositionAnalysis = {
  kind: "huangji";
  mode: "position";
  algorithmVersion: string;
  profileId: string;
  profileLabel: string;
  targetCivilYear: string;
  targetLabel: string;
  epoch: { civilYear: string; label: string; offsetYears: string; authority: string; notice: string };
  elapsedYears: string;
  cycleNumber: string;
  cycleOffset: string;
  position: { hui: string; yun: string; shi: string; year: string };
  yearsToNextBoundary: { shi: string; yun: string; hui: string; yuan: string };
  equation: string;
  sourceRefs: SourceRef[];
  calculationTrace: Record<string, unknown>;
};

export type CurrentCalendarParts = {
  mode: "automatic";
  instantIso: string;
  timeZone: string;
  timeZoneLabel: string;
  gregorianLabel: string;
  lunarLabel: string;
  relatedYear: number;
  branchYear: number;
  yearBranch: number;
  yearBranchName: string;
  lunarMonth: number;
  originalLunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  hour24: number;
  hourBranch: number;
  hourBranchName: string;
  calendarProfileId: string;
  calendarProfileLabel: string;
  yearBoundary: string;
  leapMonthRule: string;
  ziHourDayBoundary: string;
  shiftedForLateZi: boolean;
  lichunInstantIso: string | null;
  computedBy: "ECMA402-Intl-Chinese";
  crossCheckedBy: string[];
  oracleCoverage: {
    status: "verified" | "mismatch" | "not_sampled";
    sourceId: string;
    oracleVersion: string;
    matchedFixture: string | null;
    differences: readonly {
      field: string;
      expected: unknown;
      actual: unknown;
    }[];
    note: string;
  };
  calendarDataVersion: string | null;
  sourceIds: string[];
  warnings: string[];
};

export const earthlyBranches: ReadonlyArray<{ value: number; name: string }>;
export const huangjiUnits: { readonly yuan: bigint; readonly hui: bigint; readonly yun: bigint; readonly shi: bigint };
export const calculationProfiles: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
export const calendarProfiles: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
export const SOURCE_REFS: Readonly<Record<string, SourceRef>>;
export function findObjectTrigramCandidates(description: unknown): Array<{
  trigramId: number;
  trigram: string;
  keywords: readonly string[];
  matches: string[];
  score: number;
}>;

export function detectCurrentCalendarParts(
  date?: Date | string | number,
  timeZoneOrOptions?: string | { timeZone?: string; profile?: string | Record<string, unknown>; lichunInstantIso?: string },
): CurrentCalendarParts;
export function calculateCalendarHexagram(values: { yearBranch?: InputValue; lunarMonth?: InputValue; lunarDay?: InputValue; hourBranch?: InputValue; calendarProfile?: string; timeZone?: string; calendarTrace?: string; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateObjectHexagram(values: { count?: InputValue; hourBranch?: InputValue; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateModernThreeNumberHexagram(values: InputValue[] | Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateSingleSoundHexagram(values: { count?: InputValue; hourBranch?: InputValue; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateDoubleSoundHexagram(values: { firstCount?: InputValue; secondCount?: InputValue; hourBranch?: InputValue; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateTextHexagram(values: Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateStrokeHexagram(values: { text?: unknown; strokeEntries?: StrokeEntry[]; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateSingleCharacterHexagram(values: { text?: unknown; leftStrokes?: InputValue; rightStrokes?: InputValue; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateToneTextHexagram(values: { text?: unknown; toneValues?: InputValue[]; profile?: string }, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function countHanCharacters(text: unknown): number;
export function calculateLongTextHexagram(text: unknown, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateZhangChiHexagram(values: Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateChiCunHexagram(values: Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculatePosteriorHexagram(values: Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function calculateSurnameAdditionHexagram(values: Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): KangjieAnalysis;
export function decomposeHuangjiYears(years: unknown): HuangjiAnalysis;
export function calculateHuangjiPosition(values: Record<string, unknown>): HuangjiPositionAnalysis;
export function calculateHuangji(values: Record<string, unknown> | unknown): HuangjiAnalysis | HuangjiPositionAnalysis;
export function normalizeManualCalendarParts(values: Record<string, unknown>, options?: { profile?: string | Record<string, unknown> }): Record<string, unknown>;

export type StrokeDataset = {
  schemaVersion: string;
  sourceId: string;
  sourceVersion: string;
  sourceField: string;
  records: Record<string, number>;
};
export type StrokeLookup = {
  character: string;
  selected: StrokeEntry | null;
  candidates: StrokeEntry[];
  status: string;
  requiresManualInput: boolean;
  selectedBy: string | null;
  warnings: string[];
};
export function loadStrokeDataset(url?: string, fetchImpl?: typeof fetch): Promise<StrokeDataset>;
export function lookupStroke(character: string, options?: Record<string, unknown>): StrokeLookup;
export function resolveStrokeText(text: unknown, options?: Record<string, unknown>): {
  characters: string[];
  lookups: StrokeLookup[];
  entries: Array<StrokeEntry | null>;
  unresolved: Array<{ index: number; character: string }>;
  ready: boolean;
};
