export const ICHING_ACCESS_CODE = "0000";
export const ICHING_ACCESS_SESSION_KEY = "e-shidai-iching-access-v1";
export const VISIT_COUNTER_SESSION_KEY = "e-shidai-visit-counted-v2";
export const VISIT_COUNTER_SITE = "endfew-ai.github.io";
export const VISIT_COUNTER_PATH = "/e-shidai-life-code";
export const VISIT_COUNTER_ENDPOINT = "https://page-views-api.ratneshc.com/api/v1";
export const VISIT_COUNTER_VERIFIED_MINIMUM = 222;
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

function abortError(signal) {
  if (signal?.reason instanceof Error) return signal.reason;
  const error = new Error("造訪計數已取消");
  error.name = "AbortError";
  return error;
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
  const value = Number(payload?.views);
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
  fallbackMinimum = null,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("瀏覽器不支援造訪計數");
  if (signal?.aborted) throw abortError(signal);
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
  const requestJson = async (url, requestSignal = signal) => {
    const response = await fetchImpl(url, {
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: "application/json" },
      referrerPolicy: "no-referrer",
      signal: requestSignal,
    });
    if (!response.ok) throw new Error(`造訪計數服務回應 ${response.status}`);
    return response.json();
  };
  const requestWithDeadline = async (url, timeoutMs) => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return requestJson(url);
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort(signal?.reason);
    if (signal?.aborted) throw abortError(signal);
    signal?.addEventListener("abort", forwardAbort, { once: true });
    const timeout = globalThis.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      return await requestJson(url, controller.signal);
    } catch (error) {
      if (signal?.aborted) throw abortError(signal);
      if (timedOut) throw new Error("造訪計數累加逾時");
      throw error;
    } finally {
      globalThis.clearTimeout(timeout);
      signal?.removeEventListener("abort", forwardAbort);
    }
  };

  const query = new URLSearchParams({ site: VISIT_COUNTER_SITE, path: VISIT_COUNTER_PATH }).toString();
  const trackUrl = `${VISIT_COUNTER_ENDPOINT}/track?${query}`;
  const viewsUrl = `${VISIT_COUNTER_ENDPOINT}/views?${query}`;
  let value;
  let finalError;
  try {
    if (incremented) await requestWithDeadline(trackUrl, incrementTimeoutMs);
    value = parseVisitCount(await requestJson(viewsUrl));
  } catch (error) {
    finalError = error;
    if (incremented && !signal?.aborted) {
      try {
        // 追蹤可能已完成、僅回程被暫時阻擋；重試只讀，避免重複累加。
        value = parseVisitCount(await requestJson(viewsUrl));
        finalError = null;
      } catch (readError) {
        finalError = readError;
      }
    }
  }
  if (signal?.aborted) throw abortError(signal);
  if (Number.isSafeInteger(value)) {
    return { value: VISIT_COUNTER_VERIFIED_MINIMUM + value, incremented };
  }
  if (Number.isSafeInteger(fallbackMinimum) && fallbackMinimum >= 0) {
    return {
      value: fallbackMinimum,
      incremented,
      fallback: true,
    };
  }
  throw finalError ?? new Error("造訪計數暫時無法讀取");
}
