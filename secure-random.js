const UINT32_RANGE = 0x1_0000_0000;

function defaultCryptoSource() {
  return typeof globalThis === "object" ? globalThis.crypto : undefined;
}

/**
 * Return an unbiased cryptographically secure integer in the inclusive range.
 * Rejection sampling avoids the modulo bias that a direct `% range` introduces.
 */
export function secureRandomInteger(minimum = 1, maximum = 1000, cryptoSource = defaultCryptoSource()) {
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum < minimum) {
    throw new RangeError("安全亂數範圍必須是有效的整數區間。");
  }

  const span = maximum - minimum + 1;
  if (span > UINT32_RANGE) {
    throw new RangeError("安全亂數範圍不可超過 2^32 個整數。");
  }
  if (!cryptoSource || typeof cryptoSource.getRandomValues !== "function") {
    throw new Error("此瀏覽器不支援安全亂數，請手動輸入正整數。");
  }

  const values = new Uint32Array(1);
  const unbiasedLimit = Math.floor(UINT32_RANGE / span) * span;
  do {
    cryptoSource.getRandomValues(values);
  } while (values[0] >= unbiasedLimit);

  return minimum + (values[0] % span);
}

export function secureIChingNumber(cryptoSource = defaultCryptoSource()) {
  return secureRandomInteger(1, 1000, cryptoSource);
}
