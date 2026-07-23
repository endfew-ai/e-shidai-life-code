export type SourceType =
  | "uploaded_material"
  | "legacy_project"
  | "common_practice"
  | "unresolved"
  | "official";

export type SourceCertainty = "folklore" | "legacy" | "official" | "unresolved";
export type SourceProfileId =
  | "uploaded-numerology-v2"
  | "legacy-project-v1"
  | "taiwan-national-id-official"
  | "timeline-common-practice-v1"
  | "identity-destiny-common-practice-v1";

export interface RuleSourceProfile {
  readonly id: SourceProfileId;
  readonly sourceType: SourceType;
  readonly title: string;
  readonly certainty: SourceCertainty;
  readonly note: string;
  readonly urls?: readonly string[];
}

export type LifePathMode = "full_birth_digits" | "legacy_segmented";
export type BirthGridMode = "raw_birth_digits" | "raw_plus_life_path" | "legacy_project";
export type MasterNumberMode = "disabled" | "preserve_11_22_33" | "preserve_custom";
export type ZeroFiveMode = "literal" | "bridge_modifier" | "legacy_project";
export type TimelineProfileId =
  | "uploaded_sheet_exact"
  | "first_10_then_5"
  | "first_13_then_5"
  | "cyclic_5_year"
  | "legacy_project";
export type NumerologyRuleSetId = "uploaded-material-v2" | "legacy-project-v1";

export interface RuleSet {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly lifePathMode: LifePathMode;
  readonly birthGridMode: BirthGridMode;
  readonly masterNumberMode: MasterNumberMode;
  readonly customMasterNumbers: readonly number[];
  readonly zeroFiveMode: ZeroFiveMode;
  readonly timelineProfile: TimelineProfileId;
  readonly magneticFieldMapVersion: string;
  readonly interpretationVersion: string;
  readonly createdAt: string;
  readonly sourceNotes: readonly string[];
}

export type RuleSetOverrides = Partial<Omit<RuleSet, "schemaVersion">> & {
  readonly schemaVersion?: 1;
};
export type RuleSetReference = string | RuleSet;

export interface PersonalityProfile {
  readonly number: number;
  readonly title: string;
  readonly positiveTraits: readonly string[];
  readonly challengeTraits: readonly string[];
  readonly socialTraits: readonly string[];
  readonly workTraits: readonly string[];
  readonly healthFolkloreNotes: readonly string[];
  readonly disclaimer: string;
  readonly sourceProfile: SourceProfileId;
}

export type BirthGridLineKind = "main" | "secondary";

export interface BirthGridLineRule {
  readonly lineId: string;
  readonly kind: BirthGridLineKind;
  readonly numbers: readonly number[];
  readonly title: string;
  readonly positiveTraits: readonly string[];
  readonly cautionTraits: readonly string[];
  readonly sourceProfile: SourceProfileId;
}

export interface BirthGridLineResult extends BirthGridLineRule {
  readonly present: boolean;
  readonly missingNumbers: readonly number[];
  readonly strength: number;
  readonly basis: string;
}

export type MagneticFieldType =
  | "伏位"
  | "延年"
  | "生氣"
  | "天醫"
  | "禍害"
  | "六煞"
  | "絕命"
  | "五鬼";

export interface MagneticFieldInterpretation {
  readonly core: readonly string[];
  readonly strengths: readonly string[];
  readonly cautions: readonly string[];
  readonly observationQuestions: readonly string[];
  readonly sourceProfile: SourceProfileId;
}

export interface TimelineProfileBase {
  readonly id: TimelineProfileId;
  readonly sourceProfile: SourceProfileId;
  readonly label: string;
  readonly warning?: string;
}

export interface FixedTimelineProfile extends TimelineProfileBase {
  readonly intervals: readonly (readonly [number, number])[];
  readonly cyclic?: never;
  readonly unresolved?: never;
}

export interface CyclicTimelineProfile extends TimelineProfileBase {
  readonly cyclic: true;
  readonly intervals?: never;
  readonly unresolved?: never;
}

export interface UnresolvedTimelineProfile extends TimelineProfileBase {
  readonly unresolved: true;
  readonly intervals?: never;
  readonly cyclic?: never;
  readonly warning: string;
}

export type TimelineProfile =
  | FixedTimelineProfile
  | CyclicTimelineProfile
  | UnresolvedTimelineProfile;

export interface FieldCombinationRule {
  readonly id: string;
  readonly previousField: MagneticFieldType | null;
  readonly currentField: MagneticFieldType | null;
  readonly nextField: MagneticFieldType | null;
  readonly title: string;
  readonly interpretation: string;
  readonly caution: string;
  readonly rawNote?: string;
  readonly sourceProfile: SourceProfileId;
  readonly certainty: "folklore" | "unresolved";
  readonly matchMode: "adjacent_unordered" | "unresolved";
  readonly enabled: boolean;
}

export const SOURCE_TYPES: Readonly<{
  uploadedMaterial: "uploaded_material";
  legacyProject: "legacy_project";
  commonPractice: "common_practice";
  unresolved: "unresolved";
  official: "official";
}>;
export const RULE_SOURCE_PROFILES: Readonly<Record<string, RuleSourceProfile>>;
export const FOLKLORE_HEALTH_DISCLAIMER: string;
export const PERSONALITY_PROFILES: Readonly<Record<number, PersonalityProfile>>;
export const BIRTH_GRID_LINE_RULES: readonly BirthGridLineRule[];
export const MAGNETIC_FIELD_GROUPS: Readonly<Record<MagneticFieldType, readonly string[]>>;
export const MAGNETIC_FIELD_MAP: Readonly<Partial<Record<string, MagneticFieldType>>>;
export const MAGNETIC_FIELD_INTERPRETATIONS: Readonly<
  Record<MagneticFieldType, MagneticFieldInterpretation>
>;
export const TIMELINE_PROFILES: Readonly<Record<TimelineProfileId, TimelineProfile>>;
export const FIELD_COMBINATION_RULES: readonly FieldCombinationRule[];
export const DEFAULT_RULE_SET: RuleSet;
export const LEGACY_RULE_SET: RuleSet;
export const RULE_SETS: Readonly<Record<string, RuleSet>>;

export function resolveRuleSet(
  ruleSetOrId?: RuleSetReference,
  overrides?: RuleSetOverrides,
): RuleSet;

export interface ParsedBirthday {
  readonly normalized: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly originalDigits: readonly number[];
}

export interface NumerologyReduction {
  readonly initial: number;
  readonly value: number;
  readonly baseNumber: number;
  readonly isMaster: boolean;
  readonly steps: readonly number[];
  readonly equations: readonly string[];
  readonly text: string;
}

export interface RuleSelectionOptions {
  readonly ruleSet?: RuleSetReference;
  readonly ruleSetId?: string;
  readonly ruleOverrides?: RuleSetOverrides;
}

export interface BirthdayCalculationOptions extends RuleSelectionOptions {
  readonly todayValue?: string;
}

export interface LifePathRuleProfile {
  readonly ruleSetId: string;
  readonly lifePathMode: LifePathMode;
  readonly masterNumberMode: MasterNumberMode;
  readonly sourceProfile: SourceProfileId;
}

export interface LifePathLegacyParts {
  readonly month: NumerologyReduction;
  readonly day: NumerologyReduction;
  readonly year: NumerologyReduction;
  readonly segmentedSum: number;
}

export interface LifePathResult {
  readonly originalDigits: readonly number[];
  readonly firstSum: number;
  readonly reductionSteps: readonly number[];
  readonly lifePathNumber: number;
  readonly baseNumber: number;
  readonly calculationText: string;
  readonly ruleProfile: LifePathRuleProfile;
  readonly legacyParts: LifePathLegacyParts | null;
  readonly isMaster: boolean;
  readonly date: string;
  readonly parts: Readonly<{ year: number; month: number; day: number }>;
}

export interface BirthdayNumberRuleProfile {
  readonly ruleSetId: string;
  readonly masterNumberMode: MasterNumberMode;
  readonly sourceProfile: SourceProfileId;
}

export interface BirthdayNumberResult {
  readonly originalDay: number;
  readonly originalDigits: readonly number[];
  readonly firstSum: number;
  readonly reductionSteps: readonly number[];
  readonly birthdayNumber: number;
  readonly baseNumber: number;
  readonly calculationText: string;
  readonly isMaster: boolean;
  readonly ruleProfile: BirthdayNumberRuleProfile;
}

export interface PersonalYearResult {
  readonly year: number;
  readonly initial: number;
  readonly personalYearNumber: number;
  readonly reductionSteps: readonly number[];
  readonly calculationText: string;
  readonly ruleProfile: Readonly<{
    id: "personal-year-calendar-legacy-v1";
    sourceProfile: "legacy-project-v1";
    masterNumberMode: "disabled";
  }>;
}

export function parseBirthday(dateValue: unknown, todayValue?: unknown): ParsedBirthday;
export function reduceNumerologyValue(
  initialValue: number,
  ruleSetOrId?: RuleSetReference,
): NumerologyReduction;
export function calculateLifePath(
  dateValue: unknown,
  options?: BirthdayCalculationOptions,
): LifePathResult;
export function calculateBirthdayNumber(
  dateValue: unknown,
  options?: BirthdayCalculationOptions,
): BirthdayNumberResult;
export function calculatePersonalYear(
  dateValue: unknown,
  targetYear: number,
  options?: Pick<BirthdayCalculationOptions, "todayValue">,
): PersonalYearResult;

export type BirthGridCounts = Readonly<Record<number, number>>;

export interface BirthGridAnalysis {
  readonly mode: BirthGridMode;
  readonly ruleSetId: string;
  readonly sourceProfile: SourceProfileId;
  readonly layoutProfile: "legacy_lo_shu" | "standard_1_to_9";
  readonly displayOrder: readonly number[];
  readonly originalDigits: readonly number[];
  readonly rawGridDigits: readonly number[];
  readonly analysisDigits: readonly number[];
  readonly addedByLifePath: readonly number[];
  readonly counts: BirthGridCounts;
  readonly presentNumbers: readonly number[];
  readonly missingNumbers: readonly number[];
  readonly lines: readonly BirthGridLineResult[];
  readonly establishedLines: readonly BirthGridLineResult[];
  readonly absentLines: readonly BirthGridLineResult[];
  readonly zeroCount: number;
  readonly calculationText: string;
}

export interface BirthGridOptions extends BirthdayCalculationOptions {
  readonly lifePathResult?: LifePathResult;
}

export const STANDARD_BIRTH_GRID_ORDER: readonly number[];
export const LEGACY_LO_SHU_ORDER: readonly number[];
export function evaluateBirthGridLines(counts: Readonly<Record<number, number>>): readonly BirthGridLineResult[];
export function analyzeBirthGrid(dateValue: unknown, options?: BirthGridOptions): BirthGridAnalysis;

export type SymbolMode = "skip_spaces_hyphens" | "skip_all" | "error";

export interface SequenceSourceMapEntry {
  readonly outputIndex: number;
  readonly sourceIndex: number;
  readonly sourceCharacter: string;
  readonly normalizedCharacter: string;
}

export interface SkippedSequenceCharacter {
  readonly sourceIndex: number;
  readonly sourceCharacter: string;
}

export interface AlphabetConversion {
  readonly raw: string;
  readonly normalized: string;
  readonly digits: string;
  readonly sourceMap: readonly SequenceSourceMapEntry[];
  readonly skippedCharacters: readonly SkippedSequenceCharacter[];
  readonly rule: string;
}

export interface PairSourceCharacter {
  readonly sourceIndex: number;
  readonly character: string;
}

export type ModifierEffect = "hidden" | "amplified";

export interface MagneticModifier {
  readonly digit: "0" | "5";
  readonly index: number;
  readonly effect: ModifierEffect;
  readonly label: string;
}

export interface AdjacentPairRecord {
  readonly kind: "adjacent";
  readonly startIndex: number;
  readonly endIndex: number;
  readonly rawPair: string;
  readonly basePair: string | null;
  readonly sourceCharacters: readonly PairSourceCharacter[];
  readonly fieldType: MagneticFieldType | null;
  readonly modifiers: readonly MagneticModifier[];
  readonly confidence: number;
  readonly explanation: string;
}

export interface BridgePairRecord {
  readonly kind: "bridge";
  readonly startIndex: number;
  readonly endIndex: number;
  readonly rawPair: string;
  readonly basePair: string;
  readonly sourceCharacters: readonly PairSourceCharacter[];
  readonly fieldType: MagneticFieldType | null;
  readonly modifiers: readonly MagneticModifier[];
  readonly modifierChain: readonly MagneticModifier[];
  readonly confidence: number;
  readonly explanation: string;
}

export type MagneticPairRecord = AdjacentPairRecord | BridgePairRecord;

export interface StandaloneModifier extends MagneticModifier {
  readonly kind: "standalone_modifier";
  readonly status: "unresolved";
  readonly explanation: string;
}

export interface DominantFieldResult {
  readonly counts: Readonly<Partial<Record<MagneticFieldType, number>>>;
  readonly highestCount: number;
  readonly fields: readonly MagneticFieldType[];
  readonly label: string;
}

export interface FieldCombinationMatch extends FieldCombinationRule {
  readonly startRecordIndex: number;
  readonly observedFields: readonly [MagneticFieldType, MagneticFieldType];
}

export interface SlidingPairAnalysis {
  readonly normalizedSequence: string;
  readonly sourceMap: readonly SequenceSourceMapEntry[];
  readonly zeroFiveMode: ZeroFiveMode;
  readonly pairs: readonly AdjacentPairRecord[];
  readonly bridges: readonly BridgePairRecord[];
  readonly standaloneModifiers: readonly StandaloneModifier[];
  readonly resolvedRecords: readonly MagneticPairRecord[];
  readonly dominantField: DominantFieldResult;
  readonly combinationMatches: readonly FieldCombinationMatch[];
  readonly warnings: readonly string[];
  readonly sourceProfile: "uploaded-numerology-v2";
  readonly disclaimer: string;
}

export type MagneticInputType =
  | "phone_number"
  | "vehicle_address"
  | "custom_sequence"
  | "taiwan_national_id";

export interface MagneticFieldSummary {
  readonly fieldType: MagneticFieldType;
  readonly count: number;
  readonly interpretation: MagneticFieldInterpretation;
}

export interface MagneticSequenceAnalysis extends SlidingPairAnalysis {
  readonly inputType: MagneticInputType | string;
  readonly maskedInput: string;
  readonly normalizedInput: string;
  readonly conversion: AlphabetConversion;
  readonly fieldSummaries: readonly MagneticFieldSummary[];
}

export interface MagneticConversionOptions {
  readonly symbolMode?: SymbolMode;
}

export interface SlidingPairOptions extends RuleSelectionOptions, MagneticConversionOptions {}

export interface MagneticSequenceOptions extends SlidingPairOptions {
  readonly inputType?: MagneticInputType | string;
  readonly maskedInput?: string;
}

export function alphabetToSequentialDigits(
  rawValue: unknown,
  options?: MagneticConversionOptions,
): AlphabetConversion;
export function calculateDominantFields(
  records: readonly Pick<MagneticPairRecord, "fieldType">[],
): DominantFieldResult;
export function analyzeSlidingPairs(
  sequence: string | AlphabetConversion,
  profile?: SlidingPairOptions,
): SlidingPairAnalysis;
export function analyzeMagneticSequence(
  rawValue: unknown,
  options?: MagneticSequenceOptions,
): MagneticSequenceAnalysis;

export type TaiwanIdLetter = keyof typeof TAIWAN_ID_LETTER_VALUES;

export type TaiwanIdValidation =
  | Readonly<{
      normalized: string;
      valid: false;
      formatValid: false;
      checksumValid: false;
      officialDigits: null;
      checksumRemainder: null;
      message: string;
      sourceProfile: "taiwan-national-id-official";
    }>
  | Readonly<{
      normalized: string;
      valid: boolean;
      formatValid: true;
      checksumValid: boolean;
      officialDigits: readonly number[];
      checksumRemainder: number;
      message: string;
      sourceProfile: "taiwan-national-id-official";
    }>;

export interface TimelineStage {
  readonly stageIndex: number;
  readonly startAge: number;
  readonly endAge: number;
  readonly label: string;
  readonly cycle: number;
  readonly pair: AdjacentPairRecord | null;
  readonly status: "mapped" | "unmatched_interval";
}

export type TimelineStageClassificationStatus =
  | "classified"
  | "modifier_unclassified"
  | "unmatched";

export type TimelineTransitionStatus =
  | "first_stage"
  | "unmatched_interval"
  | "blocked_unclassified"
  | "same_field"
  | "matched_rule"
  | "no_defined_rule";

export interface TimelineTransitionInsight {
  readonly status: TimelineTransitionStatus;
  readonly title: string;
  readonly interpretation: string;
  readonly caution: string;
  readonly sourceProfile: SourceProfileId;
}

export interface TimelineStageInsightOptions {
  readonly bridges?: readonly BridgePairRecord[];
  readonly zeroFiveMode?: ZeroFiveMode;
  readonly sourceProfile?: SourceProfileId;
}

export interface TimelineStageInsight {
  readonly classificationStatus: TimelineStageClassificationStatus;
  readonly fieldType: MagneticFieldType | null;
  readonly summary: string;
  readonly themes: readonly string[];
  readonly observationQuestions: readonly string[];
  readonly strengths: readonly string[];
  readonly cautions: readonly string[];
  readonly classificationNote: string;
  readonly transitionFromPrevious: TimelineTransitionInsight;
  readonly bridgeFields: readonly MagneticFieldType[];
  readonly sourceProfile: SourceProfileId;
  readonly disclaimer: string;
}

export interface TimelineWarning {
  readonly code: string;
  readonly severity: "warning";
  readonly message: string;
  readonly sourceType: SourceType;
  readonly canSummarize: boolean;
  readonly profileId?: TimelineProfileId;
  readonly intervalCount?: number;
  readonly pairCount?: number;
}

export interface IdentityTimeline {
  readonly profileId: TimelineProfileId;
  readonly profileLabel: string;
  readonly sourceProfile: SourceProfileId;
  readonly status: "complete" | "mismatch" | "unresolved";
  readonly stages: readonly TimelineStage[];
  readonly provisionalAssignments: readonly TimelineStage[];
  readonly unassignedPairs: readonly AdjacentPairRecord[];
  readonly unassignedIntervals: readonly (readonly [number, number])[];
  readonly warnings: readonly TimelineWarning[];
  readonly cyclic: boolean;
  readonly canSummarize: boolean;
}

export interface TimelineOptions {
  readonly startAge?: number;
  readonly maxAge?: number;
}

export interface IdentityConversion {
  readonly letter: TaiwanIdLetter;
  readonly sequentialValue: string;
  readonly fullSequence: string;
  readonly sourceMap: readonly SequenceSourceMapEntry[];
  readonly explanation: string;
}

export interface IdentityDestinyProfile {
  readonly status: "resolved";
  readonly mode: "drop_leading_letter_zero";
  readonly label: "身分證命格數列";
  readonly sourceProfile: "identity-destiny-common-practice-v1";
  readonly letterSequentialValue: string;
  readonly droppedLeadingZero: boolean;
  readonly fullSequenceLength: number;
  readonly sequenceLength: number;
  readonly maskedSequence: string;
  readonly calculationText: string;
  readonly conversion: AlphabetConversion;
  readonly magnetic: SlidingPairAnalysis;
}

export interface IdentityAnalysis {
  readonly kind: "identity";
  readonly inputType: "taiwan_national_id";
  readonly maskedInput: string;
  readonly normalizedInput: string;
  readonly validation: TaiwanIdValidation;
  readonly conversion: IdentityConversion;
  readonly destiny: IdentityDestinyProfile;
  readonly destinyMagneticAnalysis: SlidingPairAnalysis;
  readonly lifeEventMagneticAnalysis: SlidingPairAnalysis;
  readonly destinyDominantField: DominantFieldResult;
  readonly lifeEventDominantField: DominantFieldResult;
  readonly magnetic: SlidingPairAnalysis;
  readonly encounterMagnetic: SlidingPairAnalysis;
  readonly timeline: IdentityTimeline;
  readonly dominantField: DominantFieldResult;
  readonly warnings: readonly string[];
  readonly ruleSet: RuleSet;
  readonly disclaimer: string;
}

export interface IdentityAnalysisOptions extends RuleSelectionOptions {
  readonly allowInvalidChecksum?: boolean;
  readonly timelineProfile?: TimelineProfileId;
  readonly timelineOptions?: TimelineOptions;
}

export const TAIWAN_ID_LETTER_VALUES: Readonly<Record<
  "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" |
  "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z",
  number
>>;
export function normalizeTaiwanNationalId(rawValue: unknown): string;
export function maskTaiwanNationalId(rawValue: unknown): string;
export function validateTaiwanNationalId(rawValue: unknown): TaiwanIdValidation;
export function buildIdentityDestinyProfile(
  conversion: AlphabetConversion,
  options?: SlidingPairOptions,
): IdentityDestinyProfile;
export function buildIdentityTimeline(
  pairRecords: readonly AdjacentPairRecord[],
  timelineProfileId: TimelineProfileId,
  options?: TimelineOptions,
): IdentityTimeline;
export function analyzeIdentityNumber(
  rawValue: unknown,
  options?: IdentityAnalysisOptions,
): IdentityAnalysis;

export interface ReportSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly calculationSteps: readonly string[];
  readonly sourceProfile: SourceProfileId;
}

export interface CalculationStep {
  readonly id: string;
  readonly label: string;
  readonly text: string;
}

export interface HistorySummary {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
}

export interface AnalysisHistoryRecord {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly inputType: string;
  readonly maskedInput: string;
  readonly ruleSetId: string;
  readonly ruleSetVersion: string | null;
  readonly createdAt: string;
  readonly warnings: readonly string[];
  readonly summary: readonly HistorySummary[];
  readonly sensitiveDataStored: false;
  readonly dominantFields: readonly MagneticFieldType[];
  readonly note: string;
}

export interface ReportableAnalysis {
  readonly id: string;
  readonly inputType: string;
  readonly maskedInput: string;
  readonly normalizedInput?: string;
  readonly ruleSetId: string;
  readonly ruleSet?: RuleSet;
  readonly createdAt: string;
  readonly warnings?: readonly string[];
  readonly reportSections?: readonly ReportSection[];
  readonly dominantField?: DominantFieldResult;
  readonly disclaimer?: string;
}

export interface BirthdayReportInput {
  readonly lifePathResult: LifePathResult;
  readonly birthdayNumberResult: BirthdayNumberResult;
  readonly birthGridResult: BirthGridAnalysis;
  readonly ruleSet: RuleSet;
}

export interface MagneticReportInput {
  readonly magnetic?: SlidingPairAnalysis;
  readonly resolvedRecords?: readonly MagneticPairRecord[];
  readonly dominantField?: DominantFieldResult;
  readonly timeline?: IdentityTimeline | null;
}

export const NUMEROLOGY_DISCLAIMER: string;
export function getPersonalityProfile(baseNumber: number): PersonalityProfile;
export function buildTimelineStageInsight(
  stage: TimelineStage,
  previousStage?: TimelineStage | null,
  options?: TimelineStageInsightOptions,
): TimelineStageInsight;
export function buildBirthdayReportSections(
  analysis: BirthdayReportInput,
): readonly ReportSection[];
export function buildMagneticReportSections(
  analysis: MagneticReportInput,
): readonly ReportSection[];
export function generatePlainTextReport(
  analysis: ReportableAnalysis,
  options?: { readonly showSensitive?: boolean },
): string;
export function createHistoryRecord(analysis: ReportableAnalysis): AnalysisHistoryRecord;
export function sourceProfileFor(id: string): RuleSourceProfile;
