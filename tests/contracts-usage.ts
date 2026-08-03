import { analyzeIdentityV2 } from "../application/numerology-analysis.js";
import {
  IDENTITY_SOURCE_REFS,
  type TaiwanIdentityAnalysisInputType,
  type TaiwanIdentityDocumentType,
} from "../domain/numerology/index.js";
import {
  buildEqualTimeSegments,
  buildLineCorrespondenceAnalysis,
  detectCurrentCalendarParts,
  type KangjieAnalysis,
  type LineCorrespondenceAnalysis,
} from "../kangjie-core.js";

const foreignIdentity = analyzeIdentityV2({
  value: "A800000014",
  documentType: "foreign_ui_new",
  todayValue: "2026-08-02",
  currentYear: 2026,
});

const identityInputType: TaiwanIdentityAnalysisInputType = foreignIdentity.inputType;
const identityDocumentType: Exclude<TaiwanIdentityDocumentType, "foreign_ui_legacy" | "unsupported"> =
  foreignIdentity.documentType;
const sensitiveIdentityValue: string = foreignIdentity.sensitiveNormalizedInput;
const validationScope: "format_checksum_only" = foreignIdentity.validationScope;

const calendar = detectCurrentCalendarParts(new Date("2026-08-02T04:00:00.000Z"));
const calendarDataVersion: string | null = calendar.calendarDataVersion;
const calendarProvider: "ECMA402-Intl-Chinese" = calendar.computedBy;
const oracleStatus: "verified" | "mismatch" | "not_sampled" = calendar.oracleCoverage.status;
const sourceUrl: string = IDENTITY_SOURCE_REFS["TW-NIA-FOREIGN-UI"].url;
const lineCorrespondences: LineCorrespondenceAnalysis = buildLineCorrespondenceAnalysis(0);
const firstLineBody: string = lineCorrespondences.rows[0].body.label;
const firstLineLaterOccupation: string = lineCorrespondences.rows[0].occupation.laterDivination;
const finalTimeBoundary: number = buildEqualTimeSegments(7, "日")[5].end;
declare const kangjieAnalysis: KangjieAnalysis;
const correspondenceScopeStatus: string = kangjieAnalysis.calculationTrace.sourceScopes.correspondence.status;

void [
  identityInputType,
  identityDocumentType,
  sensitiveIdentityValue,
  validationScope,
  calendarDataVersion,
  calendarProvider,
  oracleStatus,
  sourceUrl,
  firstLineBody,
  firstLineLaterOccupation,
  finalTimeBoundary,
  correspondenceScopeStatus,
];
