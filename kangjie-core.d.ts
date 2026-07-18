import type { IChingAnalysis, Trigram } from "./calculator-core.js";

export type KangjieTrace = { label: string; equation: string };
export type KangjieAnalysis = Omit<IChingAnalysis, "kind"> & {
  kind: "kangjie";
  method: "calendar" | "object" | "sound" | "text";
  methodLabel: string;
  mutualSource: "original" | "transformed";
  roles: { body: Trigram; use: Trigram; note: string };
  trace: KangjieTrace[];
  inputSummary: string;
};

export type HuangjiAnalysis = {
  kind: "huangji";
  totalYears: string;
  units: { yuan: string; hui: string; yun: string; shi: string; years: string };
  equation: string;
};

export type CurrentCalendarParts = {
  instantIso: string;
  timeZone: string;
  timeZoneLabel: string;
  gregorianLabel: string;
  lunarLabel: string;
  relatedYear: number;
  yearBranch: number;
  yearBranchName: string;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  hour24: number;
  hourBranch: number;
  hourBranchName: string;
};

export const earthlyBranches: Array<{ value: number; name: string }>;
export const huangjiUnits: { yuan: bigint; hui: bigint; yun: bigint; shi: bigint };

export function detectCurrentCalendarParts(date?: Date | string | number, timeZone?: string): CurrentCalendarParts;
export function calculateCalendarHexagram(values: { yearBranch?: FormDataEntryValue | string | number; lunarMonth?: FormDataEntryValue | string | number; lunarDay?: FormDataEntryValue | string | number; hourBranch?: FormDataEntryValue | string | number }): KangjieAnalysis;
export function calculateObjectHexagram(values: { count?: FormDataEntryValue | string | number; hourBranch?: FormDataEntryValue | string | number }): KangjieAnalysis;
export function calculateDoubleSoundHexagram(values: { firstCount?: FormDataEntryValue | string | number; secondCount?: FormDataEntryValue | string | number; hourBranch?: FormDataEntryValue | string | number }): KangjieAnalysis;
export function countHanCharacters(text: unknown): number;
export function calculateLongTextHexagram(text: unknown): KangjieAnalysis;
export function decomposeHuangjiYears(years: unknown): HuangjiAnalysis;
