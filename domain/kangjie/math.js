export function toIntegerBigInt(rawValue, label = "數值", { minimum = null, maximum = null } = {}) {
  const value = String(rawValue ?? "").trim();
  if (!/^[+-]?\d+$/.test(value)) throw new Error(`${label}必須是完整整數，不可輸入小數或文字。`);
  const parsed = BigInt(value);
  if (minimum !== null && parsed < BigInt(minimum)) throw new Error(`${label}不可小於 ${minimum}。`);
  if (maximum !== null && parsed > BigInt(maximum)) throw new Error(`${label}不可大於 ${maximum}。`);
  return parsed;
}

export function toSafeInteger(rawValue, label, minimum, maximum) {
  const parsed = toIntegerBigInt(rawValue, label, { minimum, maximum });
  const value = Number(parsed);
  if (!Number.isSafeInteger(value)) throw new Error(`${label}超出可安全計算範圍。`);
  return value;
}

export function floorModulo(value, modulus) {
  if (typeof value !== "bigint") throw new TypeError("value 必須是 BigInt");
  const divisor = typeof modulus === "bigint" ? modulus : BigInt(modulus);
  if (divisor <= 0n) throw new RangeError("modulus 必須是正整數");
  return ((value % divisor) + divisor) % divisor;
}

export function mod1(value, modulus) {
  const divisor = typeof modulus === "bigint" ? modulus : BigInt(modulus);
  const remainder = floorModulo(value, divisor);
  return Number(remainder === 0n ? divisor : remainder);
}

export function floorDiv(value, divisor) {
  if (typeof value !== "bigint" || typeof divisor !== "bigint" || divisor <= 0n) {
    throw new TypeError("floorDiv 需要 BigInt 與正除數");
  }
  const quotient = value / divisor;
  return value < 0n && value % divisor !== 0n ? quotient - 1n : quotient;
}

export function stringifyForTrace(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(stringifyForTrace);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stringifyForTrace(item)]));
  }
  return value;
}
