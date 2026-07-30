export const ICHING_ACCESS_CODE = "0000";
export const ICHING_ACCESS_SESSION_KEY = "e-shidai-iching-access-v1";
export const VISIT_COUNTER_SESSION_KEY = "e-shidai-visit-counted-v1";
export const VISIT_COUNTER_ENDPOINT = "https://api.counterapi.dev/v1/endfew-ai-e-shidai-life-code/homepage-visits/";
export const VISIT_COUNTER_INCREMENT_TIMEOUT_MS = 8_000;
export const VISIT_COUNTER_TIMEOUT_MS = 24_000;

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

export async function loadCumulativeVisitCount({
  fetchImpl = globalThis.fetch,
  sessionStore,
  signal,
  incrementTimeoutMs = VISIT_COUNTER_INCREMENT_TIMEOUT_MS,
} = {}) {
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
  const requestCount = async (url) => {
    const response = await fetchImpl(url, {
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: "application/json" },
      referrerPolicy: "no-referrer",
      signal,
    });
    if (!response.ok) throw new Error(`造訪計數服務回應 ${response.status}`);
    return parseVisitCount(await response.json());
  };
  const withDeadline = async (request, timeoutMs) => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return request;
    let timeout;
    try {
      return await Promise.race([
        request,
        new Promise((_, reject) => {
          timeout = globalThis.setTimeout(() => reject(new Error("造訪計數累加逾時")), timeoutMs);
        }),
      ]);
    } finally {
      globalThis.clearTimeout(timeout);
    }
  };

  let value;
  try {
    const request = requestCount(incremented ? `${VISIT_COUNTER_ENDPOINT}up` : VISIT_COUNTER_ENDPOINT);
    value = incremented ? await withDeadline(request, incrementTimeoutMs) : await request;
  } catch (error) {
    if (!incremented || signal?.aborted) throw error;
    // 「up」可能已在伺服器完成、僅回程被暫時阻擋；重試只讀，避免重複累加。
    value = await requestCount(VISIT_COUNTER_ENDPOINT);
  }
  return { value, incremented };
}
