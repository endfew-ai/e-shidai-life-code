import assert from "node:assert/strict";
import test from "node:test";

import {
  ICHING_ACCESS_SESSION_KEY,
  VISIT_COUNTER_ENDPOINT,
  VISIT_COUNTER_SESSION_KEY,
  hasIChingAccess,
  isIChingAccessCode,
  loadCumulativeVisitCount,
  parseVisitCount,
  rememberIChingAccess,
} from "../site-services.js";

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
    return { ok: true, status: 200, async json() { return { count: requests.length === 1 ? 42 : 42 }; } };
  };

  const first = await loadCumulativeVisitCount({ fetchImpl, sessionStore: storage });
  const second = await loadCumulativeVisitCount({ fetchImpl, sessionStore: storage });
  assert.deepEqual(first, { value: 42, incremented: true });
  assert.deepEqual(second, { value: 42, incremented: false });
  assert.equal(requests[0].url, `${VISIT_COUNTER_ENDPOINT}up`);
  assert.equal(requests[1].url, VISIT_COUNTER_ENDPOINT);
  assert.equal(requests[0].options.credentials, "omit");
  assert.equal(requests[0].options.referrerPolicy, "no-referrer");
  assert.equal(storage.getItem(VISIT_COUNTER_SESSION_KEY), "1");
});

test("visit counter rejects failed and malformed service responses", async () => {
  assert.equal(parseVisitCount({ count: 0 }), 0);
  assert.equal(parseVisitCount({ count: "123" }), 123);
  for (const invalid of [{}, { count: -1 }, { count: 1.5 }, { count: "not-a-number" }]) {
    assert.throws(() => parseVisitCount(invalid), /造訪計數回應無效/);
  }
  const storage = memoryStore();
  await assert.rejects(
    loadCumulativeVisitCount({ fetchImpl: async () => ({ ok: false, status: 503 }), sessionStore: storage }),
    /503/,
  );
  assert.equal(storage.getItem(VISIT_COUNTER_SESSION_KEY), "1", "失敗後仍應避免同一頁籤反覆灌入計數");
});
