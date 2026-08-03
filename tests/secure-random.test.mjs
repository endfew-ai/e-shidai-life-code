import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { secureIChingNumber, secureRandomInteger } from "../secure-random.js";

function sequenceCrypto(sequence) {
  let calls = 0;
  return {
    get calls() { return calls; },
    getRandomValues(values) {
      values[0] = sequence[Math.min(calls, sequence.length - 1)];
      calls += 1;
      return values;
    },
  };
}

test("感而遂通安全亂數固定落在 1 至 1000", () => {
  assert.equal(secureIChingNumber(sequenceCrypto([0])), 1);
  assert.equal(secureIChingNumber(sequenceCrypto([999])), 1000);
  assert.equal(secureRandomInteger(17, 23, sequenceCrypto([0])), 17);
  assert.equal(secureRandomInteger(17, 23, sequenceCrypto([6])), 23);
});

test("拒絕取樣會捨棄造成模數偏差的 uint32 尾端值", () => {
  const cryptoSource = sequenceCrypto([0xffff_ffff, 41]);
  assert.equal(secureIChingNumber(cryptoSource), 42);
  assert.equal(cryptoSource.calls, 2);
});

test("不支援 Web Crypto 時明確要求手動輸入", () => {
  assert.throws(() => secureIChingNumber(null), /不支援安全亂數/);
  assert.throws(() => secureRandomInteger(9, 1, sequenceCrypto([0])), /有效的整數區間/);
});

test("安全亂數模組不使用可預測的 Math.random", async () => {
  const source = await readFile(new URL("../secure-random.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /Math\.random/);
  assert.match(source, /getRandomValues/);
  assert.match(source, /unbiasedLimit/);
});
