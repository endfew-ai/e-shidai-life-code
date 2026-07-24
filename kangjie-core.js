// Backward-compatible façade. All formulas live in domain/kangjie and domain/huangji.
import {
  calculateCalendarMethod,
  calculateChiCunMethod,
  calculateLongTextMethod,
  calculateObjectMethod,
  calculatePosteriorMethod,
  calculateSegmentedSoundMethod,
  calculateSingleCharacterMethod,
  calculateSingleSoundMethod,
  calculateStrokeTextMethod,
  calculateSurnameAdditionMethod,
  calculateTextMethod,
  calculateToneTextMethod,
  calculateZhangChiMethod,
  countHanCharacters,
  detectCalendarParts,
  earthlyBranches,
} from "./domain/kangjie/index.js";
import {
  calculateHuangjiPosition,
  decomposeHuangjiYears,
  huangjiEpochProfiles,
  huangjiUnits,
} from "./domain/huangji/index.js";

export {
  calculationProfiles,
  calendarProfiles,
  cwaCalendarOracle,
  DEFAULT_CALCULATION_PROFILE_ID,
  DEFAULT_CALENDAR_PROFILE_ID,
  directions,
  extractHanCharacters,
  findObjectTrigramCandidates,
  kangxiStrokeStatus,
  loadStrokeDataset,
  lookupStroke,
  objectTrigramCandidates,
  resolveCalendarProfile,
  resolveCalculationProfile,
  resolveStrokeText,
  SOURCE_REFS,
  strokeProviderMetadata,
  trigramElements,
} from "./domain/kangjie/index.js";
export {
  addCivilYears,
  astronomicalYearToCivil,
  calculateHuangjiPosition,
  civilYearToAstronomical,
  decomposeHuangjiYears,
  formatCivilYear,
  huangjiEpochProfiles,
  huangjiUnits,
} from "./domain/huangji/index.js";

export { earthlyBranches, countHanCharacters };

export function detectCurrentCalendarParts(rawDate = new Date(), requestedTimeZoneOrOptions = "") {
  const options = typeof requestedTimeZoneOrOptions === "string"
    ? { timeZone: requestedTimeZoneOrOptions || undefined }
    : requestedTimeZoneOrOptions;
  return detectCalendarParts(rawDate, options);
}

export function calculateCalendarHexagram(values, options = {}) {
  return calculateCalendarMethod(values, options);
}

export function calculateObjectHexagram(values, options = {}) {
  return calculateObjectMethod(values, options);
}

export function calculateSingleSoundHexagram(values, options = {}) {
  return calculateSingleSoundMethod(values, options);
}

export function calculateDoubleSoundHexagram(values, options = {}) {
  return calculateSegmentedSoundMethod(values, options);
}

export function calculateTextHexagram(values, options = {}) {
  return calculateTextMethod(values, options);
}

export function calculateStrokeHexagram(values, options = {}) {
  return calculateStrokeTextMethod(values, options);
}

export function calculateSingleCharacterHexagram(values, options = {}) {
  return calculateSingleCharacterMethod(values, options);
}

export function calculateToneTextHexagram(values, options = {}) {
  return calculateToneTextMethod(values, options);
}

export function calculateLongTextHexagram(rawText, options = {}) {
  return calculateLongTextMethod(rawText, options);
}

export function calculateZhangChiHexagram(values, options = {}) {
  return calculateZhangChiMethod(values, options);
}

export function calculateChiCunHexagram(values, options = {}) {
  return calculateChiCunMethod(values, options);
}

export function calculatePosteriorHexagram(values, options = {}) {
  return calculatePosteriorMethod(values, options);
}

export function calculateSurnameAdditionHexagram(values, options = {}) {
  return calculateSurnameAdditionMethod(values, options);
}

export function calculateHuangji(values) {
  return values?.mode === "position"
    ? calculateHuangjiPosition(values)
    : decomposeHuangjiYears(values?.years ?? values);
}

export const legacyExistingProfile = Object.freeze({
  id: "legacy-existing-v1",
  retainedMethods: Object.freeze([
    "calendar",
    "object",
    "sound-segmented",
    "text-count",
    "huangji-duration",
  ]),
  missingInOriginal: Object.freeze([
    "sound-single",
    "text-1-to-10",
    "stroke-auto",
    "length",
    "posterior",
    "surname-addition",
    "huangji-epoch",
  ]),
  epochProfile: huangjiEpochProfiles["legacy-existing-v1"],
  units: huangjiUnits,
});
