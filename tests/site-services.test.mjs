import assert from "node:assert/strict";
import test from "node:test";

import {
  ICHING_ACCESS_SESSION_KEY,
  VISIT_COUNTER_ENDPOINT,
  VISIT_COUNTER_INCREMENT_TIMEOUT_MS,
  VISIT_COUNTER_SESSION_KEY,
  VISIT_COUNTER_TIMEOUT_MS,
  VISIT_COUNTER_VERIFIED_MINIMUM,
  VISIT_COUNTER_PATH,
  VISIT_COUNTER_SITE,
  hasIChingAccess,
  isIChingAccessCode,
  loadCumulativeVisitCount,
  parseVisitCount,
  rememberIChingAccess,
} from "../site-services.js";

test("visit counter timeout allows the observed public service response window", () => {
  assert.ok(VISIT_COUNTER_INCREMENT_TIMEOUT_MS >= 5_000);
  assert.ok(VISIT_COUNTER_TIMEOUT_MS > VISIT_COUNTER_INCREMENT_TIMEOUT_MS);
  assert.ok(VISIT_COUNTER_TIMEOUT_MS >= 8_000);
});

function memoryStore() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test("I Ching access accepts only the exact four-digit code and persists per session", () => {
  const storage = memoryStore();
  assert.equal(isIChingAccessCode("0000"), true);
  for (const invalid of ["", "0", "000", "00000", "1111", 0, null]) assert.equal(isIChingAccessCode(invalid), false);
  assert.equal(hasIChingAccess(storage), false);
  assert.equal(rememberIChingAccess(storage), true);
  assert.equal(storage.getItem(ICHING_ACCESS_SESSION_KEY), "1");
  assert.equal(hasIChingAccess(storage), true);
});

test("access helpers fail closed when browser storage is unavailable", () => {
  const unavailable = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(hasIChingAccess(unavailable), false);
  assert.equal(rememberIChingAccess(unavailable), false);
});

test("visit counter increments once and then reads without incrementing in the same session", async () => {
  const storage = memoryStore();
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, async json() { return url.includes("/track?") ? { success: true } : { views: 42 }; } };
  };

  const first = await loadCumulativeVisitCount({ fetchImpl, sessionStore: storage });
  const second = await loadCumulativeVisitCount({ fetchImpl, sessionStore: storage });
  assert.deepEqual(first, { value: VISIT_COUNTER_VERIFIED_MINIMUM + 42, incremented: true });
  assert.deepEqual(second, { value: VISIT_COUNTER_VERIFIED_MINIMUM + 42, incremented: false });
  const expectedQuery = `site=${encodeURIComponent(VISIT_COUNTER_SITE)}&path=${encodeURIComponent(VISIT_COUNTER_PATH)}`;
  assert.equal(requests[0].url, `${VISIT_COUNTER_ENDPOINT}/track?${expectedQuery}`);
  assert.equal(requests[1].url, `${VISIT_COUNTER_ENDPOINT}/views?${expectedQuery}`);
  assert.equal(requests[2].url, `${VISIT_COUNTER_ENDPOINT}/views?${expectedQuery}`);
  assert.equal(requests[0].options.credentials, "omit");
  assert.equal(requests[0].options.referrerPolicy, "no-referrer");
  assert.equal(storage.getItem(VISIT_COUNTER_SESSION_KEY), "1");
});

test("visit counter retries with a read-only request after a transient increment failure", async () => {
  const storage = memoryStore();
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(url);
    if (requests.length === 1) throw new TypeError("temporary CORS response failure");
    return { ok: true, status: 200, async json() { return { views: 77 }; } };
  };

  const result = await loadCumulativeVisitCount({ fetchImpl, sessionStore: storage });
  assert.deepEqual(result, { value: VISIT_COUNTER_VERIFIED_MINIMUM + 77, incremented: true });
  assert.equal(requests.length, 2);
  assert.match(requests[0], /\/track\?/);
  assert.match(requests[1], /\/views\?/);
});

test("visit counter falls back to a read-only request when increment response is slow", async () => {
  const storage = memoryStore();
  const requests = [];
  let incrementWasAborted = false;
  const fetchImpl = async (url, options) => {
    requests.push(url);
    if (url.includes("/track?")) {
      return new Promise((_, reject) => {
        options.signal.addEventListener("abort", () => {
          incrementWasAborted = true;
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        }, { once: true });
      });
    }
    return { ok: true, status: 200, async json() { return { views: 81 }; } };
  };

  const result = await loadCumulativeVisitCount({
    fetchImpl,
    sessionStore: storage,
    incrementTimeoutMs: 5,
  });
  assert.deepEqual(result, { value: VISIT_COUNTER_VERIFIED_MINIMUM + 81, incremented: true });
  assert.equal(requests.length, 2);
  assert.match(requests[0], /\/track\?/);
  assert.match(requests[1], /\/views\?/);
  assert.equal(incrementWasAborted, true, "逾時的累加請求必須實際中止，不能留在背景占用資源");
});

test("visit counter rejects failed and malformed service responses", async () => {
  assert.equal(parseVisitCount({ views: 0 }), 0);
  assert.equal(parseVisitCount({ views: "123" }), 123);
  for (const invalid of [{}, { views: -1 }, { views: 1.5 }, { views: "not-a-number" }]) {
    assert.throws(() => parseVisitCount(invalid), /造訪計數回應無效/);
  }
  const storage = memoryStore();
  await assert.rejects(
    loadCumulativeVisitCount({ fetchImpl: async () => ({ ok: false, status: 503 }), sessionStore: storage }),
    /503/,
  );
  assert.equal(storage.getItem(VISIT_COUNTER_SESSION_KEY), "1", "失敗後仍應避免同一頁籤反覆灌入計數");
});

test("visit counter service outage returns only the controlled verified release minimum", async () => {
  const sessionStore = memoryStore();
  const result = await loadCumulativeVisitCount({
    fetchImpl: async () => ({ ok: false, status: 503 }),
    sessionStore,
    fallbackMinimum: VISIT_COUNTER_VERIFIED_MINIMUM,
  });
  assert.deepEqual(result, {
    value: VISIT_COUNTER_VERIFIED_MINIMUM,
    incremented: true,
    fallback: true,
  });
});

test("retired or rate-limited counter responses fall back without breaking the page", async () => {
  for (const status of [410, 429]) {
    const result = await loadCumulativeVisitCount({
      fetchImpl: async () => ({ ok: false, status }),
      sessionStore: memoryStore(),
      fallbackMinimum: VISIT_COUNTER_VERIFIED_MINIMUM,
    });
    assert.deepEqual(result, {
      value: VISIT_COUNTER_VERIFIED_MINIMUM,
      incremented: true,
      fallback: true,
    });
  }
});

test("visit counter preserves AbortSignal cancellation instead of converting it to fallback success", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    loadCumulativeVisitCount({
      fetchImpl: async () => ({ ok: false, status: 503 }),
      sessionStore: memoryStore(),
      signal: controller.signal,
      fallbackMinimum: VISIT_COUNTER_VERIFIED_MINIMUM,
    }),
    (error) => error?.name === "AbortError",
  );
});
