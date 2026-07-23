import type {
  BirthdayNumberResult,
  BirthGridAnalysis,
  CalculationStep,
  DominantFieldResult,
  IdentityConversion,
  IdentityTimeline,
  LifePathResult,
  MagneticSequenceAnalysis,
  PersonalityProfile,
  PersonalYearResult,
  ReportSection,
  RuleSet,
  RuleSetOverrides,
  SlidingPairAnalysis,
  SymbolMode,
  TimelineOptions,
  TimelineProfileId,
  TaiwanIdValidation,
} from "../domain/numerology/index.js";

export type AnalysisInputType =
  | "birthday"
  | "phone_number"
  | "vehicle_address"
  | "custom_sequence"
  | "taiwan_national_id";

export interface AnalysisClockInput {
  readonly todayValue: string;
  readonly currentYear: number;
  readonly createdAt?: string;
  readonly id?: string | number;
}

export interface AnalysisRuleInput {
  readonly ruleSet?: string | RuleSet;
  readonly ruleSetId?: string;
  readonly ruleOverrides?: RuleSetOverrides;
}

export interface BirthdayAnalysisInput extends AnalysisClockInput, AnalysisRuleInput {
  readonly date: string;
}

export interface SequenceAnalysisInput extends AnalysisClockInput, AnalysisRuleInput {
  readonly value: unknown;
  readonly inputType?: "phone_number" | "vehicle_address" | "custom_sequence";
  readonly symbolMode?: SymbolMode;
}

export interface IdentityAnalysisInput extends AnalysisClockInput, AnalysisRuleInput {
  readonly value: unknown;
  readonly allowInvalidChecksum?: boolean;
  readonly timelineProfile?: TimelineProfileId;
  readonly timelineOptions?: TimelineOptions;
}

export interface DestinyNumberUnresolved {
  readonly status: "unresolved";
  readonly label: string;
  readonly sourceProfile: "destiny-number-unresolved";
}

export interface AnalysisResultBase {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly inputType: AnalysisInputType;
  readonly maskedInput: string;
  readonly normalizedInput: string;
  readonly ruleSetId: string;
  readonly ruleSet: RuleSet;
  readonly calculationSteps: readonly CalculationStep[];
  readonly warnings: readonly string[];
  readonly disclaimer: string;
  readonly createdAt: string;
  readonly reportSections: readonly ReportSection[];
}

export interface BirthdayAnalysisResult extends AnalysisResultBase {
  readonly inputType: "birthday";
  readonly lifePathResult: LifePathResult;
  readonly birthdayNumberResult: BirthdayNumberResult;
  readonly birthGridResult: BirthGridAnalysis;
  readonly magneticFieldResult: null;
  readonly timelineResult: null;
  readonly personalYearResult: PersonalYearResult;
  readonly personalYearCycles: readonly PersonalYearResult[];
  readonly personalityProfile: PersonalityProfile;
  readonly destinyNumber: DestinyNumberUnresolved;
}

export interface SequenceAnalysisResult extends AnalysisResultBase {
  readonly inputType: "phone_number" | "vehicle_address" | "custom_sequence";
  readonly lifePathResult: null;
  readonly birthdayNumberResult: null;
  readonly birthGridResult: null;
  readonly magneticFieldResult: MagneticSequenceAnalysis;
  readonly timelineResult: null;
  readonly dominantField: DominantFieldResult;
}

export interface IdentityAnalysisResult extends AnalysisResultBase {
  readonly inputType: "taiwan_national_id";
  readonly lifePathResult: null;
  readonly birthdayNumberResult: null;
  readonly birthGridResult: null;
  readonly magneticFieldResult: SlidingPairAnalysis;
  readonly timelineResult: IdentityTimeline;
  readonly timeline: IdentityTimeline;
  readonly dominantField: DominantFieldResult;
  readonly identityValidation: TaiwanIdValidation;
  readonly identityConversion: IdentityConversion;
}

export type AnalysisResult =
  | BirthdayAnalysisResult
  | SequenceAnalysisResult
  | IdentityAnalysisResult;

export function analyzeBirthdayV2(input: BirthdayAnalysisInput): BirthdayAnalysisResult;
export function analyzeSequenceV2(input: SequenceAnalysisInput): SequenceAnalysisResult;
export function analyzeIdentityV2(input: IdentityAnalysisInput): IdentityAnalysisResult;
