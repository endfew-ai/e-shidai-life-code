import { PERSONALITY_PROFILES } from "./rule-data.js";

export const NUMBER_GUIDE_DIGITS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

function requireCounts(counts) {
  if (!counts || typeof counts !== "object") throw new TypeError("1～9 數字總覽需要生日數字次數。");
  for (const number of NUMBER_GUIDE_DIGITS) {
    const count = counts[number];
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError(`數字 ${number} 的次數必須是非負安全整數。`);
  }
}

export function buildNumberGuideOverview(counts, lifePathBaseNumber) {
  requireCounts(counts);
  if (!NUMBER_GUIDE_DIGITS.includes(lifePathBaseNumber)) {
    throw new RangeError("生命靈數人格基底必須是 1 到 9。");
  }
  return Object.freeze(NUMBER_GUIDE_DIGITS.map((number) => {
    const profile = PERSONALITY_PROFILES[number];
    const count = counts[number];
    return Object.freeze({
      ...profile,
      count,
      isPresent: count > 0,
      isLifePath: number === lifePathBaseNumber,
    });
  }));
}
