export const ICHING_ACCESS_CODE = "0000";
export const ICHING_ACCESS_SESSION_KEY = "e-shidai-iching-access-v1";
export const VISIT_COUNTER_SESSION_KEY = "e-shidai-visit-counted-v1";
export const VISIT_COUNTER_ENDPOINT = "https://api.counterapi.dev/v1/endfew-ai-e-shidai-life-code/homepage-visits/";
export const VISIT_COUNTER_TIMEOUT_MS = 8_000;

function resolveSessionStore(provided) {
  if (provided !== undefined) return provided;
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function isIChingAccessCode(value) {
  return String(value) === ICHING_ACCESS_CODE;
}

export function hasIChingAccess(sessionStore) {
  const storage = resolveSessionStore(sessionStore);
  try {
    return storage?.getItem(ICHING_ACCESS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberIChingAccess(sessionStore) {
  const storage = resolveSessionStore(sessionStore);
  try {
    storage?.setItem(ICHING_ACCESS_SESSION_KEY, "1");
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function parseVisitCount(payload) {
  const value = Number(payload?.count);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("造訪計數回應無效");
  }
  return value;
}

export async function loadCumulativeVisitCount({ fetchImpl = globalThis.fetch, sessionStore, signal } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("瀏覽器不支援造訪計數");
  const storage = resolveSessionStore(sessionStore);
  let alreadyCounted = false;
  try {
    alreadyCounted = storage?.getItem(VISIT_COUNTER_SESSION_KEY) === "1";
  } catch {
    alreadyCounted = false;
  }

  const incremented = !alreadyCounted;
  if (incremented) {
    try {
      storage?.setItem(VISIT_COUNTER_SESSION_KEY, "1");
    } catch {
      // 儲存空間不可用時仍嘗試讀取計數。
    }
  }
  const response = await fetchImpl(incremented ? `${VISIT_COUNTER_ENDPOINT}up` : VISIT_COUNTER_ENDPOINT, {
    cache: "no-store",
    credentials: "omit",
    headers: { Accept: "application/json" },
    referrerPolicy: "no-referrer",
    signal,
  });
  if (!response.ok) throw new Error(`造訪計數服務回應 ${response.status}`);
  const value = parseVisitCount(await response.json());
  return { value, incremented };
}
