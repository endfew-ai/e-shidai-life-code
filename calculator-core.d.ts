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
  lifePath: { value: number; base: number; display: string; isMaster: boolean };
  birthday: { original: number; core: number; base: number; display: string };
  attitude: { value: number };
  personalYear: { year: number; value: number; trace: ReductionTrace; initial: number };
  cycles: Array<{ year: number; value: number; trace: ReductionTrace; initial: number }>;
  counts: DigitCounts;
  zeroCount: number;
  missing: number[];
  calculations: CalculationItem[];
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
export const LO_SHU_ORDER: number[];
export const MASTER_NUMBERS: number[];
export const trigrams: Record<number, Trigram>;
export const lineNames: string[];
export const hexagramTable: Array<[number, number, number, string]>;

export function reductionTrace(initialValue: number, preserveMaster?: boolean): ReductionTrace;
export function reduceNumber(initialValue: number, preserveMaster?: boolean): number;
export function formatCoreNumber(value: number): string;
export function localDateString(date?: Date): string;
export function validateBirthday(dateValue: string, todayValue?: string): { year: number; month: number; day: number; date: string };
export function countDigits(digits: Array<number | string>): DigitCounts;
export function analyzeBirthday(dateValue: string, currentYear?: number, todayValue?: string): BirthdayAnalysis;
export function analyzeDigitCode(rawValue: string): CodeAnalysis;
export function normalizedRemainder(value: bigint, divisor: number): number;
export function calculateIChing(rawValues: unknown[]): IChingAnalysis;
