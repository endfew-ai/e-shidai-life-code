import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { hexagramTable } from "../calculator-core.js";

const SOURCE_NAMES = [
  "乾", "坤", "屯", "蒙", "需", "訟", "師", "比", "小畜", "履", "泰", "否", "同人", "大有", "謙", "豫",
  "隨", "蠱", "臨", "觀", "噬嗑", "賁", "剝", "復", "无妄", "大畜", "頤", "大過", "坎", "離", "咸", "恒",
  "遯", "大壯", "晉", "明夷", "家人", "睽", "蹇", "解", "損", "益", "夬", "姤", "萃", "升", "困", "井",
  "革", "鼎", "震", "艮", "漸", "歸妹", "豐", "旅", "巽", "兌", "渙", "節", "中孚", "小過", "既濟", "未濟",
];

const DISPLAY_NAMES = SOURCE_NAMES.map((name) => name === "恒" ? "恆" : name);
const API = "https://zh.wikisource.org/w/api.php";

function cleanWikiText(value) {
  return value
    .replace(/-\{([^{}]+)\}-/g, "$1")
    .replace(/\{\{\*\|([^{}]+)\}\}/g, "（$1）")
    .replace(/\{\{[^{}]+\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s*(?:\*#|\*{1,4}|:+)\s*/, "")
    .replace(/'{2,5}/g, "")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionLines(lines, startPattern, endPatterns) {
  const start = lines.findIndex((line) => startPattern.test(line));
  if (start < 0) return [];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (endPatterns.some((pattern) => pattern.test(lines[index]))) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).map(cleanWikiText).filter(Boolean);
}

function sectionEntries(lines, startPattern, endPatterns) {
  const start = lines.findIndex((line) => startPattern.test(line));
  if (start < 0) return [];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (endPatterns.some((pattern) => pattern.test(lines[index]))) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end)
    .map((raw) => ({ numbered: /^\s*\*#/.test(raw), text: cleanWikiText(raw) }))
    .filter(({ text }) => Boolean(text));
}

async function fetchJsonWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { "Api-User-Agent": "e-shidai-life-code/1.0 (github.com/endfew-ai/e-shidai-life-code)" },
    });
    if (response.ok) return response.json();
    lastError = new Error(`維基文庫下載失敗：HTTP ${response.status}`);
    if (response.status !== 429 && response.status < 500) throw lastError;
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : (attempt + 1) * 2500;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw lastError;
}

async function fetchSourcePages() {
  const pages = new Map();
  const titles = SOURCE_NAMES.map((name) => `周易/${name}`);
  for (let offset = 0; offset < titles.length; offset += 40) {
    const batch = titles.slice(offset, offset + 40);
    const params = new URLSearchParams({
      action: "query",
      prop: "revisions",
      rvprop: "ids|content",
      rvslots: "main",
      titles: batch.join("|"),
      redirects: "1",
      format: "json",
      formatversion: "2",
      origin: "*",
    });
    const payload = await fetchJsonWithRetry(`${API}?${params}`);
    if (payload.error || !payload.query?.pages) {
      throw new Error(`維基文庫批次資料無法解析：${payload.error?.info ?? "沒有頁面"}`);
    }
    for (const page of payload.query.pages) pages.set(page.title, page);
    for (const redirect of payload.query.redirects ?? []) {
      const target = pages.get(redirect.to);
      if (target) pages.set(redirect.from, target);
    }
  }
  return pages;
}

function parseHexagramText(index, sourceName, sourcePage) {
  const title = `周易/${sourceName}`;
  if (!sourcePage?.revisions?.[0]?.slots?.main?.content) {
    throw new Error(`${title} 沒有可用的本文修訂版本`);
  }
  const revision = sourcePage.revisions[0];
  const raw = revision.slots.main.content.replace(/\r/g, "");
  const lines = raw.split("\n");
  const classic = sectionEntries(lines, /易經：/, [/彖曰：/]);
  const tuan = sectionLines(lines, /彖曰：/, [/象曰：/, /文言曰：/]);
  const xiang = sectionEntries(lines, /象曰：/, [/文言曰：/]);
  const wenyan = sectionLines(lines, /文言曰：/, []);

  const classicLineStart = classic.findIndex(({ numbered }) => numbered);
  const xiangLineStart = xiang.findIndex(({ numbered }) => numbered);
  if (classicLineStart < 1 || xiangLineStart < 1 || tuan.length < 1) {
    throw new Error(`${title} 欄位不足：易經 ${classic.length}、彖 ${tuan.length}、象 ${xiang.length}`);
  }

  const judgment = classic.slice(0, classicLineStart).map(({ text }) => text).join("").replace(/^[^：]{1,8}：\s*/, "");
  const numberedClassic = classic.slice(classicLineStart).filter(({ numbered }) => numbered).map(({ text }) => text);
  const lineTexts = numberedClassic.slice(0, 6);
  const specialLines = numberedClassic.slice(6);
  const image = xiang.slice(0, xiangLineStart).map(({ text }) => text).join("");
  const numberedXiang = xiang.slice(xiangLineStart).filter(({ numbered }) => numbered).map(({ text }) => text);
  const lineImages = numberedXiang.slice(0, 6);
  const specialImages = numberedXiang.slice(6);
  if (lineTexts.length !== 6 || lineImages.length !== 6) {
    throw new Error(`${title} 爻辭或小象不足：爻辭 ${lineTexts.length}、小象 ${lineImages.length}`);
  }
  const tableRow = hexagramTable.find(([, , hexId]) => hexId === index + 1);
  if (!tableRow) throw new Error(`找不到第 ${index + 1} 卦的固定卦表資料`);

  return {
    id: index + 1,
    name: DISPLAY_NAMES[index],
    fullName: tableRow[3],
    symbol: String.fromCodePoint(0x4dc0 + index),
    judgment,
    tuan: tuan.join(""),
    image,
    lines: lineTexts.map((text, lineIndex) => ({
      position: lineIndex + 1,
      text,
      image: lineImages[lineIndex],
    })),
    special: specialLines.map((text, specialIndex) => ({
      text,
      image: specialImages[specialIndex] ?? "",
    })),
    wenyan: wenyan.join("\n\n"),
    sourceTitle: sourcePage.title,
    sourceRevision: revision.revid,
  };
}

const sourcePages = await fetchSourcePages();
const records = [];
for (let index = 0; index < SOURCE_NAMES.length; index += 1) {
  const title = `周易/${SOURCE_NAMES[index]}`;
  records.push(parseHexagramText(index, SOURCE_NAMES[index], sourcePages.get(title)));
}

if (records.length !== 64 || records.some((record) => record.lines.length !== 6)) {
  throw new Error("易經本文資料驗證失敗");
}

const source = {
  name: "維基文庫《周易》",
  url: "https://zh.wikisource.org/zh/周易",
  license: "原典為公有領域；維基文庫編排依 CC BY-SA 4.0",
  generatedFromRevisions: Object.fromEntries(records.map((record) => [record.id, record.sourceRevision])),
};

const output = `// Generated by scripts/build-iching-text.mjs. Do not edit by hand.\n` +
  `// Source: https://zh.wikisource.org/zh/周易\n` +
  `export const ICHING_TEXT_SOURCE = Object.freeze(${JSON.stringify(source, null, 2)});\n\n` +
  `export const ichingTexts = Object.freeze(${JSON.stringify(Object.fromEntries(records.map((record) => [record.id, record])), null, 2)});\n\n` +
  `export function getIChingText(hexagramId) {\n` +
  `  const record = ichingTexts[Number(hexagramId)];\n` +
  `  if (!record) throw new RangeError(\"卦序必須介於 1 到 64\");\n` +
  `  return record;\n` +
  `}\n`;

const outputPath = fileURLToPath(new URL("../iching-text.js", import.meta.url));
await writeFile(outputPath, output, "utf8");
console.log(`已產生 ${outputPath}，共 ${records.length} 卦。`);
