export type LifeProfile = {
  title: string;
  symbol: string;
  traits: string;
  shadow: string;
  wellbeing: string;
  color: string;
  hex: string;
  marker: string;
  markerDesc: string;
  advice: string;
};

export type ColorNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type DigitalColorSwatch = {
  role: "primary" | "support" | "accent";
  name: string;
  hex: `#${string}`;
  sourceRelation: string;
};
export type CheiroColorPaletteEntry = {
  number: ColorNumber;
  sourceFamilies: string[];
  avoidNote: string;
  swatches: DigitalColorSwatch[];
  uses: { wear: string; space: string; digital: string };
};
export type CheiroColorSource = {
  id: string;
  author: string;
  title: string;
  chapters: string;
  scope: string;
  catalogUrl: string;
  ruleUrl: string;
  paletteUrl: string;
  notice: string;
};
export type CheiroTraditionalColorGuide = {
  methodVersion: "cheiro-birth-number-v1";
  originalDay: number;
  number: ColorNumber;
  display: string;
  trace: ReductionTrace;
  palette: CheiroColorPaletteEntry;
};
export type BirthdayColorAssignment = {
  role: "birth-day" | "life-path" | "attitude";
  label: string;
  badge: "原書對照" | "本站延伸";
  inputValue: number;
  mappedNumber: ColorNumber;
  calculation: string;
  authority: "cheiro-source" | "site-extension";
  selectedSwatchIndex: number;
  swatch: DigitalColorSwatch;
};
export type BirthdayColorGuide = {
  methodVersion: "cheiro-birth-colors-v1";
  source: CheiroColorSource;
  traditional: CheiroTraditionalColorGuide;
  composition: BirthdayColorAssignment[];
  disclaimer: string;
};

export type ReductionTrace = {
  initial: number;
  value: number;
  steps: number[];
  equations: string[];
  text: string;
};

export type CalculationItem = { label: string; text: string };
export type DigitCounts = Record<number, number>;

export type BirthdayAnalysis = {
  kind: "birthday";
  date: string;
  parts: { year: number; month: number; day: number };
  profileNumber: number;
  headlineValue: string;
  ruleSet: RuleSet;
  ruleProfile: LifePathRuleProfile;
  originalDigits: readonly number[];
  firstSum: number;
  reductionSteps: readonly number[];
  lifePath: {
    value: number;
    base: number;
    display: string;
    isMaster: boolean;
    originalDigits: readonly number[];
    firstSum: number;
    reductionSteps: readonly number[];
    calculationText: string;
    ruleProfile: LifePathRuleProfile;
  };
  birthday: {
    original: number;
    core: number;
    base: number;
    display: string;
    calculationText: string;
    reductionSteps: readonly number[];
    ruleProfile: {
      readonly ruleSetId: string;
      readonly masterNumberMode: RuleSet["masterNumberMode"];
      readonly sourceProfile: string;
    };
  };
  colorGuide: BirthdayColorGuide;
  attitude: { value: number };
  personalYear: {
    year: number;
    value: number;
    trace: ReductionTrace;
    initial: number;
    calculationText: string;
    ruleProfile: {
      readonly id: "personal-year-calendar-legacy-v1";
      readonly sourceProfile: "legacy-project-v1";
      readonly masterNumberMode: "disabled";
    };
  };
  cycles: Array<{
    year: number;
    value: number;
    trace: ReductionTrace;
    initial: number;
    calculationText: string;
    ruleProfile: {
      readonly id: "personal-year-calendar-legacy-v1";
      readonly sourceProfile: "legacy-project-v1";
      readonly masterNumberMode: "disabled";
    };
  }>;
  counts: DigitCounts;
  zeroCount: number;
  missing: number[];
  birthGrid: BirthGridAnalysis;
  calculations: CalculationItem[];
};

export type AnalyzeBirthdayOptions = {
  ruleSet?: string | RuleSet;
  ruleSetId?: string;
  ruleOverrides?: RuleSetOverrides;
};

export type CodeAnalysis = {
  kind: "code";
  digits: number[];
  length: number;
  sum: number;
  core: number;
  profileNumber: number;
  headlineValue: string;
  counts: DigitCounts;
  zeroCount: number;
  strongest: number[];
  missing: number[];
  calculations: CalculationItem[];
};

export type LineValue = 0 | 1;
export type Trigram = {
  id: number;
  name: string;
  nature: string;
  symbol: string;
  lines: [LineValue, LineValue, LineValue];
};
export type HexagramResult = {
  upperId: number;
  lowerId: number;
  hexId: number;
  name: string;
  lines: LineValue[];
  upper: Trigram;
  lower: Trigram;
};
export type IChingAnalysis = {
  kind: "iching";
  inputs: string[];
  remainders: [number, number, number];
  original: HexagramResult;
  mutual: HexagramResult;
  transformed: HexagramResult;
  moving: { index: number; name: string; oldValue: LineValue; newValue: LineValue };
};

export const profiles: Record<number, LifeProfile>;
export const masterThemes: Record<11 | 22 | 33, string>;
export const CHEIRO_COLOR_SOURCE: CheiroColorSource;
export const CHEIRO_BIRTH_COLOR_PALETTES: Record<ColorNumber, CheiroColorPaletteEntry>;
export const LO_SHU_ORDER: number[];
export const MASTER_NUMBERS: number[];
export const trigrams: Record<number, Trigram>;
export const lineNames: string[];
export const hexagramTable: Array<[number, number, number, string]>;

export function reductionTrace(initialValue: number, preserveMaster?: boolean): ReductionTrace;
export function reduceNumber(initialValue: number, preserveMaster?: boolean): number;
export function formatCoreNumber(value: number): string;
export function getCheiroColorGuide(day: number): CheiroTraditionalColorGuide;
export function buildBirthdayColorGuide(input: { day: number; lifePathValue: number; attitudeValue: number }): BirthdayColorGuide;
export function localDateString(date?: Date): string;
export function validateBirthday(dateValue: string, todayValue?: string): { year: number; month: number; day: number; date: string };
export function countDigits(digits: Array<number | string>): DigitCounts;
export function analyzeBirthday(
  dateValue: string,
  currentYear?: number,
  todayValue?: string,
  options?: AnalyzeBirthdayOptions,
): BirthdayAnalysis;
export function analyzeBirthdayLegacy(
  dateValue: string,
  currentYear?: number,
  todayValue?: string,
): BirthdayAnalysis;
export function analyzeDigitCode(rawValue: string): CodeAnalysis;
export function normalizedRemainder(value: bigint, divisor: number): number;
export function calculateIChing(rawValues: unknown[]): IChingAnalysis;
import type {
  BirthGridAnalysis,
  LifePathRuleProfile,
  RuleSet,
  RuleSetOverrides,
} from "./domain/numerology/index.js";
