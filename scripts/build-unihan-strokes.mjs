import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = Object.fromEntries(process.argv.slice(2).map((value, index, values) => {
  if (!value.startsWith("--")) return [null, null];
  return [value.slice(2), values[index + 1] && !values[index + 1].startsWith("--") ? values[index + 1] : true];
}).filter(([key]) => key));

const sourcePath = path.resolve(args.source || "output/research/unihan-17.0.0/extracted");
const outputPath = path.resolve(args.output || "public/data/unihan-kTotalStrokes-17.0.0.json");
const sourceInfo = await stat(sourcePath);
const sourceFiles = sourceInfo.isDirectory()
  ? (await readdir(sourcePath)).filter((name) => /^Unihan_.*\.txt$/i.test(name)).map((name) => path.join(sourcePath, name))
  : [sourcePath];

if (!sourceFiles.length) throw new Error(`找不到 Unihan_*.txt：${sourcePath}`);

const records = {};
const inputHashes = [];
for (const filePath of sourceFiles.sort()) {
  const buffer = await readFile(filePath);
  inputHashes.push({ file: path.basename(filePath), sha256: createHash("sha256").update(buffer).digest("hex") });
  const lines = buffer.toString("utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [codePoint, property, rawValue] = line.split("\t");
    if (property !== "kTotalStrokes") continue;
    if (!/^U\+[0-9A-F]+$/i.test(codePoint) || !/^\d{1,3}$/.test(rawValue)) {
      throw new Error(`無法解析 kTotalStrokes：${line}`);
    }
    const key = codePoint.slice(2).toUpperCase();
    const value = Number(rawValue);
    if (records[key] !== undefined && records[key] !== value) {
      throw new Error(`${codePoint} 出現衝突筆畫：${records[key]} / ${value}`);
    }
    records[key] = value;
  }
}

const keys = Object.keys(records).sort((left, right) => Number.parseInt(left, 16) - Number.parseInt(right, 16));
const sortedRecords = Object.fromEntries(keys.map((key) => [key, records[key]]));
const artifact = {
  schemaVersion: "unihan-total-strokes-index-v1",
  sourceId: "UNICODE-UNIHAN-17.0.0",
  sourceVersion: "17.0.0",
  sourceField: "kTotalStrokes",
  sourceUrl: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
  documentationUrl: "https://www.unicode.org/reports/tr38/",
  licenseId: "Unicode-3.0",
  licenseUrl: "https://www.unicode.org/license.txt",
  originalZipSha256: "f7a48b2b545acfaa77b2d607ae28747404ce02baefee16396c5d2d7a8ef34b5e",
  parserVersion: "build-unihan-strokes-v1",
  recordCount: keys.length,
  inputFiles: inputHashes,
  notice: "kTotalStrokes 是 Unicode／IRG informative 總筆畫，不是教育部標準字體或康熙筆畫。",
  records: sortedRecords,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(artifact)}\n`, "utf8");
const outputBuffer = await readFile(outputPath);
console.log(JSON.stringify({
  outputPath,
  recordCount: keys.length,
  sha256: createHash("sha256").update(outputBuffer).digest("hex"),
  bytes: outputBuffer.byteLength,
}, null, 2));
