import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kangxiStrokeStatus,
  lookupStroke,
  resolveStrokeText,
} from "../kangjie-core.js";

const datasetBuffer = await readFile(new URL("../public/data/unihan-kTotalStrokes-17.0.0.json", import.meta.url));
const dataset = JSON.parse(datasetBuffer.toString("utf8"));

test("Unihan 17.0 本機索引筆數、版本與產物雜湊固定", () => {
  assert.equal(dataset.schemaVersion, "unihan-total-strokes-index-v1");
  assert.equal(dataset.sourceId, "UNICODE-UNIHAN-17.0.0");
  assert.equal(dataset.sourceVersion, "17.0.0");
  assert.equal(dataset.recordCount, 102998);
  assert.equal(Object.keys(dataset.records).length, 102998);
  assert.equal(
    createHash("sha256").update(datasetBuffer).digest("hex"),
    "ff6b6fd20c0a372af064281f6a48bd0c6ac019c600e3e97c4e7cc880dbb54eca",
  );
});

test("姓名逐字自動取得筆畫並保留 Unicode／IRG 來源", () => {
  const result = resolveStrokeText("王小明", { unihanDataset: dataset, prefer: "unicode" });
  assert.equal(result.ready, true);
  assert.deepEqual(result.entries.map((entry) => [entry.character, entry.strokes]), [["王", 4], ["小", 3], ["明", 8]]);
  assert.equal(result.entries.every((entry) => entry.sourceId === "unicode-unihan"), true);
  assert.equal(result.entries.every((entry) => entry.dataVersion === "17.0.0"), true);
});

test("人工覆寫只覆蓋本次候選，官方筆畫仍保留為證據", () => {
  const result = lookupStroke("王", { unihanDataset: dataset, manualValue: "5", prefer: "unicode" });
  assert.equal(result.selected.strokes, 5);
  assert.equal(result.selected.sourceId, "manual");
  assert.equal(result.candidates.some((candidate) => candidate.sourceId === "unicode-unihan" && candidate.strokes === 4), true);
});

test("康熙 provider 沒有授權資料時拒絕冒充", () => {
  const result = kangxiStrokeStatus("康");
  assert.equal(result.status, "unavailable");
  assert.equal(result.requiresManualInput, true);
  assert.match(result.warnings[0], /而非筆畫/);
});
