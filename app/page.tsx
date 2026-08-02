/* eslint-disable @next/next/no-img-element */
"use client";

import { CSSProperties, FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import {
  LO_SHU_ORDER,
  analyzeBirthday,
  analyzeDigitCode,
  lineNames,
  localDateString,
  masterThemes,
  profiles,
} from "../calculator-core.js";
import { calculateModernThreeNumberHexagram, type KangjieAnalysis } from "../kangjie-core.js";
import { getIChingText } from "../iching-text.js";
import {
  hasIChingAccess,
  isIChingAccessCode,
  loadCumulativeVisitCount,
  rememberIChingAccess,
  VISIT_COUNTER_TIMEOUT_MS,
} from "../site-services.js";
import { analyzeBirthdayV2 } from "../application/numerology-analysis.js";
import { mountNumerologyWorkspace } from "../application/advanced-workspace.js";
import {
  loadNumerologySettings,
  resolveSettingsRuleSet,
  saveAnalysisHistory,
} from "../infrastructure/numerology-storage.js";

type AnalysisMode = "birthday" | "code" | "iching";
type BirthdayResultTarget = "overview" | "life-path" | "annual" | "grid" | "color";
type BirthdayResult = ReturnType<typeof analyzeBirthday>;
type CodeResult = ReturnType<typeof analyzeDigitCode>;
type IChingResult = KangjieAnalysis;
type NumerologyResult = BirthdayResult | CodeResult;
type NumerologyAudit = Readonly<{
  originalInput: string;
  normalizedInput: string;
  algorithmId: string;
  algorithmName: string;
  algorithmVersion: string;
  normalizationRule: string;
  context: string;
  ruleSummary: string;
}>;
type AuditableNumerologyResult = NumerologyResult & { readonly audit: NumerologyAudit };

const modeContent = {
  birthday: {
    label: "生日命碼",
    badge: "主要",
    description: "生命路徑、生日數、個人流年與傳統對應色",
    button: "分析生日命碼",
    help: "只需生日；身分證請用下方獨立入口。",
    art: "/visuals/ai-dashboard/life-path-v1.webp",
    cardArt: "/visuals/birthday-panel-b-v3.webp",
    titleArt: "/visuals/brush/title-birthday-web-v1.webp",
    titleWidth: 600,
    titleHeight: 213,
    artWidth: 960,
    artHeight: 640,
    artAlt: "九節點古金生命靈數分析儀",
  },
  code: {
    label: "數字頻譜",
    badge: "次要",
    description: "任意號碼的加總、歸一數與數字分布",
    button: "分析數字頻譜",
    help: "支援全形、半形數字與空白；請勿輸入敏感資料。",
    art: "/visuals/ai-dashboard/number-wave-v1.webp",
    cardArt: "/visuals/ai-dashboard/number-wave-v1.webp",
    titleArt: "/visuals/brush/title-spectrum-web-v1.webp",
    titleWidth: 600,
    titleHeight: 174,
    artWidth: 960,
    artHeight: 640,
    artAlt: "古金數字頻率波形與九點節律模組背景",
  },
  iching: {
    label: "三數取卦",
    badge: "密碼",
    description: "三數推算本卦、互卦、動爻與變卦",
    button: "開始三數取卦",
    help: "請分別輸入三個整數，不會自動切分生日或號碼。",
    art: "/visuals/iching-instrument-b-v3.webp",
    cardArt: "/visuals/iching-instrument-b-v3.webp",
    titleArt: "/visuals/brush/title-iching-web-v1.webp",
    titleWidth: 600,
    titleHeight: 176,
    artWidth: 1586,
    artHeight: 992,
    artAlt: "低亮古金六爻測量儀視覺",
  },
} as const;

const ichingSensorInputs = [
  {
    label: "第一數",
    help: "上卦 ÷ 8",
    placeholder: "例如：9",
    art: "/visuals/ai-dashboard/reference-v6/iching-sensor-upper-v6.webp",
  },
  {
    label: "第二數",
    help: "下卦 ÷ 8",
    placeholder: "例如：13",
    art: "/visuals/ai-dashboard/reference-v6/iching-sensor-lower-v6.webp",
  },
  {
    label: "第三數",
    help: "動爻 ÷ 6",
    placeholder: "例如：20",
    art: "/visuals/ai-dashboard/reference-v6/iching-sensor-moving-v6.webp",
  },
] as const;

function formatTaipeiClock(date = new Date()) {
  return {
    time: new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
    date: new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).format(date),
  };
}

function getDashboardAnalytics(result: NumerologyResult | IChingResult | null, mode: AnalysisMode) {
  const modeLabel = modeContent[mode].label;
  const emptyCounts = Array.from({ length: 9 }, () => 0);
  const emptyPreviewLabels: Record<AnalysisMode, string[]> = {
    birthday: ["生命路徑數", "生日數", "態度數", "個人流年"],
    code: ["號碼歸一數", "數字總和", "輸入位數", "最常出現"],
    iching: ["本卦", "互卦", "變卦", "動爻"],
  };
  if (!result) {
    return {
      status: "待分析",
      modeLabel,
      state: "等待輸入",
      core: "－",
      title: "等待輸入",
      note: "輸入資料後顯示主要結果與計算摘要。",
      counts: emptyCounts,
      distributionTitle: "數字出現次數",
      annual: "－",
      annualTitle: "等待生日",
      annualNote: "個人流年只在生日模式計算。",
      annualLabel: "模式狀態",
      annualYear: "本年度",
      previewLabels: emptyPreviewLabels[mode],
      previewValues: ["－", "－", "－", "－"],
    };
  }
  if (result.kind === "birthday") {
    return {
      status: "生日分析完成",
      modeLabel,
      state: "結果已更新",
      core: result.lifePath.display,
      title: profiles[result.profileNumber]?.title ?? "生命路徑",
      note: `生日數 ${result.birthday.display}，態度數 ${result.attitude.value}`,
      counts: Array.from({ length: 9 }, (_, index) => result.counts[index + 1] ?? 0),
      distributionTitle: "生日數字分佈",
      annual: String(result.personalYear.value),
      annualTitle: `個人流年數 ${result.personalYear.value}`,
      annualNote: `${result.personalYear.year} 年，依生日與年度數字計算`,
      annualLabel: "個人流年",
      annualYear: `${result.personalYear.year} 年`,
      previewLabels: ["生命路徑數", "生日數", "態度數", "個人流年"],
      previewValues: [result.lifePath.display, result.birthday.display, String(result.attitude.value), String(result.personalYear.value)],
    };
  }
  if (result.kind === "code") {
    return {
      status: "數字頻譜完成",
      modeLabel,
      state: `${result.length} 位數字`,
      core: String(result.core),
      title: profiles[result.profileNumber]?.title ?? "數字歸一結果",
      note: `實際總和 ${result.sum}，未出現 ${result.missing.length} 個數字`,
      counts: Array.from({ length: 9 }, (_, index) => result.counts[index + 1] ?? 0),
      distributionTitle: "數字出現次數",
      annual: "不適用",
      annualTitle: "數字頻譜模式",
      annualNote: "此模式只分析輸入數字，不推算個人流年。",
      annualLabel: "模式狀態",
      annualYear: "本年度",
      previewLabels: ["號碼歸一數", "數字總和", "輸入位數", "最常出現"],
      previewValues: [String(result.core), String(result.sum), String(result.length), result.strongest.join("、") || "無"],
    };
  }
  const counts = Array.from({ length: 9 }, () => 0);
  for (const value of result.inputs) {
    for (const digit of String(value).match(/\d/g) ?? []) {
      const number = Number(digit);
      if (number >= 1 && number <= 9) counts[number - 1] += 1;
    }
  }
  return {
    status: "三數取卦完成",
    modeLabel,
    state: "卦象已更新",
    core: getIChingText(result.original.hexId).symbol,
    title: result.original.name,
    note: `動爻 ${result.moving.name}，變卦 ${result.transformed.name}`,
    counts,
    distributionTitle: "輸入數字出現次數",
    annual: "不適用",
    annualTitle: "三數取卦模式",
    annualNote: "此模式只依三個整數取卦，不推算個人流年。",
    annualLabel: "模式狀態",
    annualYear: "本年度",
    previewLabels: ["本卦", "互卦", "變卦", "動爻"],
    previewValues: [result.original.name, result.mutual.name, result.transformed.name, result.moving.name],
  };
}

const fixedBrushTitles: Record<string, string> = {
  "這個結果怎麼算": "/visuals/brush/title-calculation-explain-v2.webp",
  "生日數字九宮分布": "/visuals/brush/title-grid-birthday-v2.webp",
  "自訂數字九宮分布": "/visuals/brush/title-grid-code-v2.webp",
  "核心傾向": "/visuals/brush/title-insight-core-v2.webp",
  "壓力提醒": "/visuals/brush/title-insight-pressure-v2.webp",
  "日常照顧": "/visuals/brush/title-insight-care-v2.webp",
  "溝通提醒": "/visuals/brush/title-insight-communication-v2.webp",
  "本次自我提問": "/visuals/brush/title-self-question-v2.webp",
  "個人色彩指引": "/visuals/brush/title-color-guide-v1.webp",
  "本卦": "/visuals/brush/title-hex-original-v2.webp",
  "互卦": "/visuals/brush/title-hex-mutual-v2.webp",
  "變卦": "/visuals/brush/title-hex-changed-v2.webp",
  "卦辭": "/visuals/brush/title-judgment-v2.webp",
  "彖曰": "/visuals/brush/title-tuan-v2.webp",
  "象曰": "/visuals/brush/title-image-saying-v2.webp",
  "六爻原文": "/visuals/brush/title-six-lines-v2.webp",
};

function BrushTitle({ src, text, className = "", lazy = false, priority = false, width, height }: { src: string; text: string; className?: string; lazy?: boolean; priority?: boolean; width?: number; height?: number }) {
  return <span className={`brush-title ${className}`.trim()}><span className="sr-only">{text}</span><img className="brush-title-image" src={src} width={width} height={height} fetchPriority={priority ? "high" : undefined} alt="" aria-hidden="true" loading={lazy ? "lazy" : undefined} decoding={(lazy || priority) ? "async" : undefined} /></span>;
}

function FixedBrushTitle({ text, className = "", lazy = false }: { text: string; className?: string; lazy?: boolean }) {
  const src = fixedBrushTitles[text];
  if (!src) throw new Error(`缺少固定毛筆標題資產：${text}`);
  return <BrushTitle src={src} text={text} className={className} lazy={lazy} />;
}

function MetricCard({ label, value, note, id }: { label: string; value: string; note: string; id?: string }) {
  return (
    <article className="metric-card" id={id} tabIndex={id ? -1 : undefined}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

function DigitDistribution({ result }: { result: NumerologyResult }) {
  const title = result.kind === "birthday" ? "生日數字九宮分布" : "自訂數字九宮分布";
  const gridResult = result.kind === "birthday" ? result.birthGrid : null;
  const displayOrder = gridResult?.displayOrder ?? LO_SHU_ORDER;
  const displayCounts = gridResult?.counts ?? result.counts;
  return (
    <details className="result-disclosure calculation-card digit-distribution" id={result.kind === "birthday" ? "result-nine-grid" : undefined}>
      <summary><span><small>數字分布</small><strong>查看完整九宮</strong></span><em>出現 {9 - result.missing.length} 種・缺少 {result.missing.length} 種</em></summary>
      <div className="disclosure-body">
        <header className="panel-heading">
          <div><p>數字分布</p><h3 className="brush-fixed-heading"><FixedBrushTitle text={title} className="brush-panel-title" /></h3></div>
          <span>數字 0 出現 {result.zeroCount} 次</span>
        </header>
        <p className="panel-copy">{gridResult?.layoutProfile === "standard_1_to_9"
          ? "依 1・2・3／4・5・6／7・8・9 排列；連線判定依規則資料，不由畫面位置猜測。"
          : "採洛書 4・9・2／3・5・7／8・1・6 版位呈現次數。這是現代視覺化，不宣稱為古法命盤。"}</p>
        <div className="lo-shu-grid" aria-label="一到九數字出現次數">
          {displayOrder.map((digit) => {
            const count = displayCounts[digit];
            return (
              <div className={`digit-cell ${count ? "is-present" : "is-missing"}`} key={digit}>
                <strong>{digit}</strong><span>{count ? `${count} 次` : "未出現"}</span>
                <i style={{ "--count": Math.min(count, 4) } as React.CSSProperties} aria-hidden="true" />
              </div>
            );
          })}
        </div>
        <p className="missing-summary">{result.missing.length ? `未出現：${result.missing.join("、")}` : "1 到 9 都有出現"}</p>
        {gridResult?.lines && (
          <div className="grid-line-summary">
            <p className="grid-line-title" role="heading" aria-level={4}>成立連線 {gridResult.establishedLines.length} 條</p>
            <ul>{gridResult.establishedLines.length
              ? gridResult.establishedLines.map((line) => <li key={line.lineId}>{line.lineId}・{line.title}（強度 {line.strength}）</li>)
              : <li>目前沒有完整成立的連線。</li>}</ul>
          </div>
        )}
      </div>
    </details>
  );
}

function CalculationDetails({ result }: { result: NumerologyResult }) {
  const audit = (result as AuditableNumerologyResult).audit;
  return (
    <details className="result-disclosure calculation-card">
      <summary><span><small>計算軌跡</small><strong>查看完整算式</strong></span><em>{result.calculations.length} 步・規則 {audit.algorithmVersion}</em></summary>
      <div className="disclosure-body">
        <header className="panel-heading"><div><p>計算軌跡</p><h3 className="brush-fixed-heading"><FixedBrushTitle text="這個結果怎麼算" className="brush-panel-title" /></h3></div><span>可逐步核對</span></header>
        <div className="numerology-audit-ledger">
          <article><span>原始輸入</span><code>{audit.originalInput}</code><small>使用者送入分析器的內容</small></article>
          <article><span>正規化輸入</span><code>{audit.normalizedInput}</code><small>{audit.normalizationRule}</small></article>
          <article><span>演算法版本</span><code>{audit.algorithmId}@{audit.algorithmVersion}</code><small>{audit.algorithmName}</small></article>
          <p className="numerology-audit-context">{audit.context}；{audit.ruleSummary}</p>
        </div>
        <ol className="calculation-list">
          {result.calculations.map((item) => <li key={item.label}><span>{item.label}</span><code>{item.text}</code></li>)}
        </ol>
        {result.kind === "birthday" && (
          <div className="year-cycle" aria-label="三年個人流年">
            {result.cycles.map((cycle) => (
              <div className={cycle.year === result.personalYear.year ? "is-current" : ""} key={cycle.year}>
                <span>{cycle.year}</span><strong>{cycle.value}</strong><small>{cycle.year === result.personalYear.year ? "今年" : "流年"}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function BirthdayColorGuide({ result }: { result: BirthdayResult }) {
  const guide = result.colorGuide;
  const palette = guide.traditional.palette;
  const roleNotes: Record<string, string> = {
    "birth-day": "出生日色群的數位代表色",
    "life-path": "將生命路徑基底延伸套入同一色表",
    attitude: "將態度數延伸套入同一色表",
  };
  const uses = [
    ["穿搭點綴・本站延伸", palette.uses.wear],
    ["工作空間・本站延伸", palette.uses.space],
    ["數位配色・本站延伸", palette.uses.digital],
  ];
  const sources = [
    ["Cheiro 原書・第 23 章主次色規則", guide.source.ruleUrl],
    ["Cheiro 原書・第 27 章色彩對照", guide.source.paletteUrl],
    ["色彩心理研究界線", "https://doi.org/10.1146/annurev-psych-010213-115035"],
  ];

  return (
    <section className="personal-color-guide" data-personal-color-guide aria-labelledby="color-guide-title" aria-describedby="color-guide-disclaimer">
      <header className="color-guide-heading">
        <div><p>文化色彩參考</p><h3 id="color-guide-title" className="brush-fixed-heading"><FixedBrushTitle text="個人色彩指引" className="brush-color-guide" lazy /></h3></div>
        <p className="color-guide-basis">生日數 {guide.traditional.number}・原書色名 {palette.historicalColorFamilies.join("、")}・HEX 為本站轉譯</p>
      </header>

      <ol className="color-role-list">
        {guide.composition.map((assignment) => (
          <li className={`color-role color-role-${assignment.role}`} data-color-swatch data-color-role={assignment.role} data-color-number={assignment.mappedNumber} key={assignment.role}>
            <span className="color-swatch" data-color-chip style={{ "--swatch": assignment.swatch.hex } as React.CSSProperties} aria-hidden="true" />
            <div className="color-role-copy">
              <div className="color-role-label"><span>{assignment.label}</span><em>{assignment.badge}</em></div>
              <div className="color-role-name"><strong>{assignment.swatch.name}</strong><code data-color-hex>{assignment.swatch.hex}</code></div>
              <span className="color-role-basis">{assignment.calculation}・色彩基底 {assignment.mappedNumber}</span>
              <p>{roleNotes[assignment.role]}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="color-guide-uses">
        {uses.map(([label, copy]) => <p key={label}><strong>{label}</strong>{copy}</p>)}
      </div>
      <p className="color-guide-reminder"><strong>原書的配色提醒</strong>{palette.avoidNote}</p>

      <details className="color-guide-evidence" data-color-source-details>
        <summary><span><small>可核對</small><strong>計算、書據與轉譯</strong></span><em>原書・色票・本站延伸</em></summary>
        <div className="color-guide-evidence-body">
          <div className="color-guide-explanation">
            <p>Cheiro《Cheiro&apos;s Book of Numbers》以出生日化簡至 1 到 9 對照色群。你的出生日為 {guide.traditional.display}，因此採用數字 {guide.traditional.number}。</p>
            <p>{guide.source.notice}</p>
            <p>生命路徑延伸色與態度數搭配色，是本站把既有數字套入同一色表的延伸，不是原書明示的生命路徑配色。</p>
          </div>
          <ol className="color-guide-formulas">
            {guide.composition.map((assignment) => <li data-color-formula={assignment.role} key={assignment.role}><span>{assignment.label}</span><code>{assignment.calculation}；色彩基底 {assignment.mappedNumber}</code></li>)}
          </ol>
          <p className="color-guide-source-links">
            {sources.map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={label}>{label}</a>)}
          </p>
        </div>
      </details>

      <p id="color-guide-disclaimer" className="color-guide-disclaimer">{guide.disclaimer}</p>
    </section>
  );
}

function NumerologyResults({ result, onReset }: { result: NumerologyResult; onReset: () => void }) {
  const profile = profiles[result.profileNumber];
  const resultArt = result.kind === "birthday" ? "/visuals/numerology-result-panel-b-v3.webp" : "/visuals/digit-spectrum-panel-b-v3.webp";
  const metrics = result.kind === "birthday"
    ? [
        { label: "生命路徑數", value: result.lifePath.display, note: result.ruleSet.lifePathMode === "full_birth_digits" ? "YYYYMMDD 全部數字加總" : "舊版月、日、年分段化簡" },
        { label: "生日數", value: result.birthday.display, note: result.ruleSet.masterNumberMode === "disabled" ? "主數化簡至 1～9" : "依設定保留主數" },
        { label: "態度數", value: String(result.attitude.value), note: "出生月加出生日" },
        { label: `${result.personalYear.year} 個人流年`, value: String(result.personalYear.value), note: "採 1 至 12 月曆年制" },
        { label: `${result.personalMonth.month} 月個人月`, value: String(result.personalMonth.value), note: "個人年加當月；現代流傳" },
        { label: `${result.personalDay.month}/${result.personalDay.day} 個人日`, value: String(result.personalDay.value), note: "個人月加當日；現代流傳" },
      ]
    : [
        { label: "數字位數", value: String(result.length), note: "只計入實際數字" },
        { label: "逐位總和", value: String(result.sum), note: "尚未收斂的總和" },
        { label: "號碼歸一數", value: String(result.core), note: "逐位加總至 1 到 9" },
        { label: "最常出現", value: result.strongest.join("、"), note: result.strongest.length > 1 ? "並列最高次數" : "出現次數最高" },
      ];

  return (
    <section className="results" aria-labelledby="result-title">
      <header className="result-hero" id={result.kind === "birthday" ? "result-life-path" : undefined}>
        <div className="result-copy">
          <h2 id="result-title" className="brush-result-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-result-v4.webp" text="數理結果" /></h2>
          <div className="result-value">{result.headlineValue}<small>{profile.title}</small></div>
          <p>{profile.symbol}。以下內容只作文化娛樂與自我提問參考。</p>
        </div>
        <figure className="result-art"><img src={resultArt} width={result.kind === "birthday" ? 1586 : 1823} height={result.kind === "birthday" ? 992 : 863} loading="lazy" decoding="async" alt="古金數字節點分析視覺" /><figcaption>{result.kind === "birthday" ? "生命路徑數" : "號碼歸一數"} {result.headlineValue}</figcaption></figure>
        <div className="result-actions result-actions-top"><button type="button" className="secondary-button" onClick={onReset}>{result.kind === "birthday" ? "修改生日" : "修改數字"}</button></div>
      </header>

      <div className={`metric-grid${result.kind === "birthday" ? " is-six" : ""}`}>{metrics.map((metric, index) => <MetricCard {...metric} id={result.kind === "birthday" && index === 3 ? "result-annual-cycle" : undefined} key={metric.label} />)}</div>

      {result.kind === "birthday" && result.lifePath.isMaster && (
        <div className="master-note" role="note"><strong>主數 {result.lifePath.value}／基底 {result.lifePath.base}</strong><p>{masterThemes[result.lifePath.value as 11 | 22 | 33] ?? "此為自訂保留主數；人格摘要仍依化簡後的 1～9 基底呈現。"}</p></div>
      )}

      {result.kind === "birthday" && <BirthdayColorGuide result={result} />}

      <div className="result-overview"><CalculationDetails result={result} /><DigitDistribution result={result} /></div>

      <details className="insight-ledger" aria-labelledby="insight-title">
        <summary><span><small>原型參考</small><strong id="insight-title"><BrushTitle src="/visuals/brush/title-insight-v5.webp" text="把結果變成可觀察的問題" className="brush-insight" /></strong></span><em>4 項觀察提醒</em></summary>
        <div>
          <article><span>01</span><h4 className="brush-fixed-heading"><FixedBrushTitle text="核心傾向" className="brush-card-title" /></h4><p>{profile.traits}</p></article>
          <article><span>02</span><h4 className="brush-fixed-heading"><FixedBrushTitle text="壓力提醒" className="brush-card-title" /></h4><p>{profile.shadow}</p></article>
          <article><span>03</span><h4 className="brush-fixed-heading"><FixedBrushTitle text="日常照顧" className="brush-card-title" /></h4><p>{profile.wellbeing}</p></article>
          <article><span>04</span><h4 className="brush-fixed-heading"><FixedBrushTitle text="溝通提醒" className="brush-card-title" /></h4><blockquote>「{profile.marker}」</blockquote><p>{profile.markerDesc}</p></article>
        </div>
      </details>

      <article className="advice-card"><span aria-hidden="true">策</span><div><h3 className="brush-fixed-heading"><FixedBrushTitle text="本次自我提問" className="brush-advice-title" /></h3><p>{profile.advice}</p></div></article>
      <div className="result-actions"><button type="button" className="secondary-button" onClick={onReset}>重新分析另一筆資料</button></div>
    </section>
  );
}

function HexagramLines({ lines, texts, movingIndex = -1, mark = "" }: { lines: number[]; texts: ReturnType<typeof getIChingText>["lines"]; movingIndex?: number; mark?: string }) {
  return (
    <div className="hexagram-lines" aria-label="六爻卦象與爻辭，畫面由上爻排列至初爻">
      {[5, 4, 3, 2, 1, 0].map((index) => (
        <div className={`line-row ${index === movingIndex ? "is-moving" : ""}`} key={index}>
          <span className="line-position">{lineNames[index]}</span>
          <span className={`yao ${lines[index] === 1 ? "yang" : "yin"}`} aria-label={lines[index] === 1 ? "陽爻" : "陰爻"}><i />{lines[index] === 0 && <i />}</span>
          <strong className="line-change-mark">{index === movingIndex ? mark : ""}</strong>
          <span className="line-text">{texts[index].text}</span>
        </div>
      ))}
    </div>
  );
}

function YaoLegend() {
  return (
    <div className="yao-legend" aria-label="卦爻顏色圖例">
      <span className="is-yang"><i aria-hidden="true" />陽爻</span>
      <span className="is-yin"><i aria-hidden="true" />陰爻</span>
    </div>
  );
}

function HexagramCard({ label, value, movingIndex, mark }: { label: string; value: IChingResult["original"]; movingIndex?: number; mark?: string }) {
  const text = getIChingText(value.hexId);
  return (
    <article className="hexagram-card">
      <header><div><h3 className="hexagram-role-title brush-fixed-heading"><FixedBrushTitle text={label} className="brush-hexagram-role" /></h3><p className="hexagram-computed-name"><span>{text.symbol}</span>{value.name}</p></div><small>第 {value.hexId} 卦</small></header>
      <p className="hexagram-structure">上{value.upper.name}（{value.upper.nature}）・下{value.lower.name}（{value.lower.nature}）</p>
      <p className="hexagram-judgment"><strong>卦辭</strong><span>{text.name}，{text.judgment}</span></p>
      <HexagramLines lines={value.lines} texts={text.lines} movingIndex={movingIndex} mark={mark} />
    </article>
  );
}

function OriginalTextPanel({ result }: { result: IChingResult }) {
  const original = getIChingText(result.original.hexId);
  const transformed = getIChingText(result.transformed.hexId);
  const sourceUrl = `https://zh.wikisource.org/wiki/${encodeURIComponent(original.sourceTitle)}`;
  return (
    <details className="classic-panel" aria-labelledby="classic-title">
      <summary className="classic-summary"><span><small>補充資料</small><strong id="classic-title"><BrushTitle src="/visuals/brush/title-classic-v4.webp" text="易經本文" className="brush-classic" /></strong></span><em>展開卦辭、彖、象與六爻原文</em><i>只列原文，不解卦</i></summary>
      <img className="classic-panel-art" src="/visuals/iching-manuscript-b-v3.webp" width={1586} height={992} loading="lazy" decoding="async" alt="" aria-hidden="true" />
      <div className="classic-panel-inner">
        <div className="classic-name"><span aria-hidden="true">{original.symbol}</span><div><small>第 {original.id} 卦</small><p className="classic-computed-name">{original.name}・{original.fullName}</p></div></div>

        <div className="classic-columns">
          <article><h4 className="brush-fixed-heading"><FixedBrushTitle text="卦辭" className="brush-classic-label" /></h4><p>{original.judgment}</p></article>
          <article><h4 className="brush-fixed-heading"><FixedBrushTitle text="彖曰" className="brush-classic-label" /></h4><p>{original.tuan}</p></article>
          <article><h4 className="brush-fixed-heading"><FixedBrushTitle text="象曰" className="brush-classic-label" /></h4><p>{original.image}</p></article>
        </div>

        <div className="line-texts">
          <h4 className="brush-fixed-heading"><FixedBrushTitle text="六爻原文" className="brush-classic-label brush-six-lines" /></h4>
          {original.lines.map((line, index) => (
            <article className={index === result.moving.index ? "is-active" : ""} key={line.position}>
              <span>{index === result.moving.index ? "動爻" : String(line.position).padStart(2, "0")}</span>
              <div><p>{line.text}</p><small>《象》曰：{line.image}</small></div>
            </article>
          ))}
          {original.special.map((line) => <article key={line.text}><span>用</span><div><p>{line.text}</p>{line.image && <small>《象》曰：{line.image}</small>}</div></article>)}
        </div>

        {original.wenyan && <details className="classic-details"><summary>展開《文言》原文</summary><p>{original.wenyan}</p></details>}
        <details className="classic-details"><summary>查看變卦第 {transformed.id} 卦「{transformed.name}」本文</summary><div><h4 className="brush-fixed-heading"><FixedBrushTitle text="卦辭" className="brush-classic-label" /></h4><p>{transformed.judgment}</p><h4 className="brush-fixed-heading"><FixedBrushTitle text="象曰" className="brush-classic-label" /></h4><p>{transformed.image}</p></div></details>
        <p className="classic-source">本文來源：<a href={sourceUrl} target="_blank" rel="noreferrer">維基文庫《周易》</a>，修訂版本 {original.sourceRevision}。</p>
      </div>
    </details>
  );
}

function IChingResults({ result, onReset }: { result: IChingResult; onReset: () => void }) {
  return (
    <section className="iching-results" aria-labelledby="iching-result-title">
      <header className="iching-result-heading"><div><h2 id="iching-result-title" className="brush-iching-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-iching-web-v1.webp" text="三數取卦" width={600} height={176} /></h2><p className="iching-structure">本卦・互卦・變卦</p></div><div className="iching-result-meta"><p>動爻為<strong>{result.moving.name}</strong>，{result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。</p><YaoLegend /></div><div className="result-actions result-actions-top"><button type="button" className="secondary-button" onClick={onReset}>修改三數</button></div></header>
      <div className="hexagram-grid">
        <HexagramCard label="本卦" value={result.original} movingIndex={result.moving.index} mark="動" />
        <HexagramCard label="互卦" value={result.mutual} />
        <HexagramCard label="變卦" value={result.transformed} movingIndex={result.moving.index} mark="變" />
      </div>
      <div className="iching-trace">
        {result.trace.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.equation}</strong></div>)}
      </div>
      <div className="iching-role-ledger">
        <article><span>體卦</span><strong>{result.roles.body.symbol} {result.roles.body.name}</strong><small>{result.roles.body.nature}・{result.roles.body.element}</small></article>
        <article><span>用卦</span><strong>{result.roles.use.symbol} {result.roles.use.name}</strong><small>{result.roles.use.nature}・{result.roles.use.element}</small></article>
        <article><span>五行關係</span><strong>{result.fiveElements.label}</strong><small>{result.fiveElements.explanation}</small></article>
        <p>{result.roles.note}</p>
      </div>
      <details className="iching-audit"><summary><strong>完整演算與來源</strong><span>{result.profileLabel}・{result.algorithmVersion}</span></summary><div className="iching-audit-body"><div className="iching-audit-inputs"><article><span>原始輸入</span><pre>{JSON.stringify(result.calculationTrace.originalInput, null, 2)}</pre></article><article><span>正規化輸入</span><pre>{JSON.stringify(result.calculationTrace.normalizedInput, null, 2)}</pre></article></div><ul className="iching-relation-list">{result.influenceRelations.map((entry) => <li key={entry.stage}>{entry.stage}：{entry.trigram.name}{entry.trigram.element}・{entry.relation.label}</li>)}</ul><div className="iching-source-list"><p className="iching-source-notice">{result.sourceScopes?.formula.notice || "下列來源只支持除八、除六、卦象、互變與體用共用核心，不代表現代三數公式出自古籍。"}</p>{(result.sharedCoreSourceRefs || result.sourceRefs).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><strong>{source.title}</strong><small>{source.organization}</small></a>)}</div></div></details>
      <p className="iching-boundary">本模式採現代三數先天數法，與生日命碼完全分開。只做固定卦象計算，不提供吉凶、預測或決策建議。</p>
      <OriginalTextPanel result={result} />
      <div className="result-actions"><button type="button" className="secondary-button" onClick={onReset}>重新輸入三個數字</button></div>
    </section>
  );
}

export default function Home() {
  const [mode, setMode] = useState<AnalysisMode>("birthday");
  const [birthday, setBirthday] = useState("");
  const [numberCode, setNumberCode] = useState("");
  const [ichingValues, setIChingValues] = useState(["", "", ""]);
  const [result, setResult] = useState<NumerologyResult | IChingResult | null>(null);
  const [message, setMessage] = useState("");
  const [entryHint, setEntryHint] = useState("");
  const [ichingUnlocked, setIChingUnlocked] = useState(() => hasIChingAccess());
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessMessage, setAccessMessage] = useState("");
  const [visitCount, setVisitCount] = useState("讀取中");
  const [visitState, setVisitState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [cockpitClock, setCockpitClock] = useState({ time: "--:--", date: "台北時間" });
  const resultRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const birthdayRef = useRef<HTMLInputElement>(null);
  const birthdayAutoSubmitRef = useRef(false);
  const birthdayResultTargetRef = useRef<BirthdayResultTarget>("overview");
  const codeRef = useRef<HTMLInputElement>(null);
  const ichingRef = useRef<HTMLInputElement>(null);
  const accessDialogRef = useRef<HTMLDialogElement>(null);
  const accessInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = accessDialogRef.current;
    if (!dialog) return;
    if (accessOpen && !dialog.open) dialog.showModal();
    if (!accessOpen && dialog.open) dialog.close();
    if (accessOpen) window.setTimeout(() => accessInputRef.current?.focus(), 0);
  }, [accessOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), VISIT_COUNTER_TIMEOUT_MS);
    loadCumulativeVisitCount({ signal: controller.signal })
      .then(({ value }) => {
        setVisitCount(new Intl.NumberFormat("zh-TW").format(value));
        setVisitState("ready");
      })
      .catch(() => {
        setVisitCount("--");
        setVisitState("unavailable");
      })
      .finally(() => window.clearTimeout(timeout));
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    const updateClock = () => setCockpitClock(formatTaipeiClock());
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!workspaceRef.current) return;
    return mountNumerologyWorkspace(workspaceRef.current, { assetRoot: "/visuals" });
  }, []);

  function currentRef(targetMode = mode) {
    return targetMode === "birthday" ? birthdayRef : targetMode === "code" ? codeRef : ichingRef;
  }

  function focusCurrentInput() { window.setTimeout(() => currentRef().current?.focus(), 0); }

  function changeMode(nextMode: AnalysisMode) {
    setMode(nextMode); setResult(null); setMessage(""); setEntryHint("");
    window.setTimeout(() => currentRef(nextMode).current?.focus(), 0);
  }

  function requestMode(nextMode: AnalysisMode) {
    if (nextMode === "iching" && !(ichingUnlocked || hasIChingAccess())) {
      setAccessMessage(""); setAccessPassword(""); setAccessOpen(true);
      return;
    }
    if (nextMode === "iching") setIChingUnlocked(true);
    changeMode(nextMode);
  }

  function startBirthdayAnalysis(event: ReactMouseEvent<HTMLAnchorElement>, resultTarget: BirthdayResultTarget = "overview") {
    event.preventDefault();
    const mountedBirthdayInput = birthdayRef.current;
    const shouldAnalyze = Boolean(birthday);
    birthdayAutoSubmitRef.current = !shouldAnalyze;
    changeMode("birthday");
    birthdayResultTargetRef.current = resultTarget;
    const analyzer = document.querySelector("#analyzer");
    analyzer?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    analyzer?.classList.remove("is-entry-highlight");
    window.requestAnimationFrame(() => analyzer?.classList.add("is-entry-highlight"));
    window.setTimeout(() => analyzer?.classList.remove("is-entry-highlight"), 1400);
    window.history.replaceState(null, "", "#analyzer");
    if (!shouldAnalyze) setEntryHint("請選擇出生日期；選好後會立即完成分析，不必再按一次。");
    if (mountedBirthdayInput) {
      mountedBirthdayInput.focus({ preventScroll: true });
      if (shouldAnalyze) {
        window.setTimeout(() => document.querySelector<HTMLFormElement>("#analyzer-form")?.requestSubmit(), 0);
        return;
      }
      try {
        mountedBirthdayInput.showPicker?.();
      } catch {
        // 日期選擇器可能被瀏覽器的使用者手勢規則阻擋，欄位仍已正確聚焦。
      }
      return;
    }
    window.setTimeout(() => {
      const birthdayInput = birthdayRef.current;
      birthdayInput?.focus({ preventScroll: true });
      if (shouldAnalyze) {
        document.querySelector<HTMLFormElement>("#analyzer-form")?.requestSubmit();
        return;
      }
      try {
        birthdayInput?.showPicker?.();
      } catch {
        // 日期選擇器可能被瀏覽器的使用者手勢規則阻擋，欄位仍已正確聚焦。
      }
    }, 0);
  }

  function closeAccessDialog() {
    setAccessOpen(false); setAccessPassword(""); setAccessMessage("");
  }

  function handleAccessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIChingAccessCode(accessPassword)) {
      setAccessMessage("密碼不正確，請重新輸入四位數字。");
      window.setTimeout(() => accessInputRef.current?.select(), 0);
      return;
    }
    rememberIChingAccess(); setIChingUnlocked(true); closeAccessDialog(); changeMode("iching");
  }

  function revealResult(resultTarget: BirthdayResultTarget = "overview") {
    window.setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targetSelector = {
        overview: "#result-life-path",
        "life-path": "#result-life-path",
        annual: "#result-annual-cycle",
        grid: "#result-nine-grid",
        color: "#color-guide-title",
      }[resultTarget];
      const target = document.querySelector<HTMLElement>(targetSelector) ?? resultRef.current;
      if (target instanceof HTMLDetailsElement) target.open = true;
      target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      (target?.querySelector<HTMLElement>("h2, summary") ?? target)?.focus?.({ preventScroll: true });
      birthdayResultTargetRef.current = "overview";
    }, 80);
  }

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const settings = loadNumerologySettings();
      const ruleSet = resolveSettingsRuleSet(settings);
      const todayValue = localDateString();
      const currentYear = new Date().getFullYear();
      const nextResult = mode === "birthday"
        ? analyzeBirthday(birthday, currentYear, todayValue, { ruleSet })
        : mode === "code" ? analyzeDigitCode(numberCode) : calculateModernThreeNumberHexagram(ichingValues);
      if (mode === "birthday") {
        saveAnalysisHistory(analyzeBirthdayV2({
          date: birthday,
          currentYear,
          todayValue,
          createdAt: new Date().toISOString(),
          ruleSet,
        }));
      }
      birthdayAutoSubmitRef.current = false;
      const requestedResultTarget = mode === "birthday" ? birthdayResultTargetRef.current : "overview";
      setEntryHint(""); setMessage(""); setResult(nextResult); revealResult(requestedResultTarget);
    } catch (error) {
      birthdayAutoSubmitRef.current = false;
      setResult(null); setMessage(error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。"); focusCurrentInput();
    }
  }

  function handleReset() {
    if (mode === "birthday") setBirthday("");
    if (mode === "code") setNumberCode("");
    if (mode === "iching") setIChingValues(["", "", ""]);
    birthdayAutoSubmitRef.current = false;
    setEntryHint(""); setResult(null); setMessage(""); focusCurrentInput();
  }

  function openWorkspace(view: "home" | "identity" | "sequence" | "settings" | "history" | "sources") {
    return (event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const tab = document.querySelector<HTMLButtonElement>(`[data-workspace-tab="${view}"]`);
      if (tab) {
        tab.click();
        if (window.location.hash !== "#numerology-workspace") window.history.pushState(null, "", "#numerology-workspace");
      }
      else document.querySelector("#numerology-workspace")?.scrollIntoView({ behavior: "auto", block: "start" });
    };
  }

  function openWorkspaceEntry(entry: "phone_number" | "vehicle_address" | "custom_sequence") {
    return (event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const entryButton = document.querySelector<HTMLButtonElement>(`[data-entry="${entry}"]`);
      if (entryButton) entryButton.click();
      else document.querySelector<HTMLButtonElement>('[data-workspace-tab="sequence"]')?.click();
      if (window.location.hash !== "#numerology-workspace") window.history.pushState(null, "", "#numerology-workspace");
    };
  }

  const hasValue = mode === "birthday" ? Boolean(birthday) : mode === "code" ? Boolean(numberCode) : ichingValues.some(Boolean);
  const analyticsView = getDashboardAnalytics(result, mode);
  const maximumDigitCount = Math.max(0, ...analyticsView.counts);

  return (
    <main className="site-shell" data-ui="xuanxing-aaa">
      <aside className="dashboard-sidebar" aria-label="快速功能">
        <a className="sidebar-brand" href="#top">
          <span className="sidebar-crest" aria-hidden="true"><img src="/visuals/ai-dashboard/reference-v2/brand-crest-v2.webp" width={512} height={512} fetchPriority="high" decoding="async" alt="" /></span>
          <BrushTitle src="/visuals/brush/brand-life-numerology-aaa-web-v1.webp" text="生命靈數" className="brush-sidebar-brand" priority width={720} height={194} />
        </a>
        <p className="sidebar-tagline">數字有軌跡，規則可核對</p>
        <p className="sidebar-intro">把生日、生命路徑、九宮、流年與數字紀錄集中在同一個可核對的工作台。</p>
        <a className="sidebar-primary" href="#analyzer" onClick={startBirthdayAnalysis} aria-label="選擇生日後自動完成分析；已有日期時立即更新結果"><span>{birthday ? "立即更新完整結果" : "選生日・直接看完整結果"}</span><b aria-hidden="true">→</b></a>
        <a className="sidebar-secondary" href="#numerology-workspace" onClick={openWorkspace("history")}><span>開啟本機紀錄</span><b aria-hidden="true">↗</b></a>
        <nav className="sidebar-links" aria-label="功能捷徑">
          <a href="#analyzer" onClick={() => requestMode("birthday")}><span>01</span><strong>生日分析</strong><small>生命路徑與流年</small></a>
          <a href="#analyzer" onClick={() => requestMode("code")}><span>02</span><strong>數字頻譜</strong><small>號碼核心與分布</small></a>
          <a href="#numerology-workspace" onClick={openWorkspace("home")}><span>03</span><strong>進階工作台</strong><small>九宮、磁場與歷史</small></a>
          <a href="/kangjie"><span>04</span><strong>邵康節易學</strong><small>獨立專頁・需密碼</small></a>
          <a href="#method-source"><span>05</span><strong>規則來源</strong><small>公式、版本與界線</small></a>
        </nav>
        <div className="sidebar-quick" aria-label="快速工具">
          <p>快速工具</p>
          <div>
            <a href="#analyzer" onClick={startBirthdayAnalysis}><img src="/visuals/ai-dashboard/reference-v5/function-bay-1-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span><strong>生日</strong><small>主命數</small></span></a>
            <a href="#analyzer" onClick={() => requestMode("code")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-3-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span><strong>頻譜</strong><small>號碼</small></span></a>
            <a href="#analyzer" onClick={() => requestMode("iching")}><img src="/visuals/ai-dashboard/reference-v2/portal-iching-v2.webp" width={512} height={512} alt="" aria-hidden="true" /><span><strong>取卦</strong><small>密碼</small></span></a>
            <a href="#numerology-workspace" onClick={openWorkspace("identity")}><img src="/visuals/ai-dashboard/reference-v13/identity-verification-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>身分證</strong><small>命格</small></span></a>
            <a href="#numerology-workspace" onClick={openWorkspace("history")}><img src="/visuals/ai-dashboard/reference-v13/local-history-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>紀錄</strong><small>本機</small></span></a>
            <a href="#numerology-workspace" onClick={openWorkspace("sources")}><img src="/visuals/ai-dashboard/reference-v13/source-provenance-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>規則</strong><small>來源</small></span></a>
            <a href="/kangjie"><img src="/visuals/ai-dashboard/reference-v2/portal-kangjie-v2.webp" width={512} height={512} alt="" aria-hidden="true" /><span><strong>康節</strong><small>專頁</small></span></a>
            <a href="#numerology-workspace" onClick={openWorkspace("home")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-6-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span><strong>專業</strong><small>工作台</small></span></a>
          </div>
        </div>
        <section className="sidebar-start-guide" aria-label="三步取得生命靈數結果">
          <p>三步取得完整結果</p>
          <ol>
            <li><span>1</span><strong>選擇出生日期</strong><small>按上方金色按鈕</small></li>
            <li><span>2</span><strong>自動完成演算</strong><small>選好日期不必再按一次</small></li>
            <li><span>3</span><strong>查看完整算式</strong><small>生命路徑、九宮與流年</small></li>
          </ol>
        </section>
        <div className="sidebar-status"><span aria-hidden="true" /><p><strong>本機安全運算</strong><small>輸入資料不上傳</small></p></div>
        <a className="sidebar-version" href="#method-source"><span>公開版 0.1.0</span><small>公式、來源與版本紀錄</small></a>
      </aside>

      <div className="dashboard-canvas">
      <nav className="topbar" aria-label="主要導覽">
        <a className="wordmark" href="#top"><span aria-hidden="true"><i>命</i></span><strong><BrushTitle src="/visuals/brush/brand-life-numerology-aaa-web-v1.webp" text="生命靈數" className="brush-brand" priority width={720} height={194} /></strong></a>
        <div className="topbar-actions">
          <a href="#analyzer" onClick={startBirthdayAnalysis}><img src="/visuals/ai-dashboard/reference-v5/function-bay-1-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>生日分析</span></a>
          <a href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "life-path")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-2-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>生命路徑</span></a>
          <a href="#analyzer" onClick={() => requestMode("code")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-3-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>數字頻譜</span></a>
          <a href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "grid")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-4-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>九宮配置</span></a>
          <a href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "annual")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-5-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>流年分析</span></a>
          <a href="#numerology-workspace" onClick={openWorkspace("home")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-6-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>專業工作台</span></a>
          <a href="#method-source"><img src="/visuals/ai-dashboard/reference-v5/function-bay-7-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span>規則來源</span></a>
          <a href="#privacy-section"><img src="/visuals/ai-dashboard/reference-v13/identity-verification-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span>本機隱私</span></a>
          <p className="visit-counter" data-visit-counter data-state={visitState} role="status" aria-live="polite" aria-atomic="true" aria-label={visitState === "ready" ? `累積造訪 ${visitCount} 次` : visitState === "unavailable" ? "累積造訪次數暫時無法讀取" : "正在讀取累積造訪次數"}><span>累積造訪</span><strong data-visit-count>{visitCount}</strong><small>次</small></p>
        </div>
      </nav>

      <div className="dashboard-home-screen reference-v3 reference-v4 reference-v10 reference-v11 reference-v12 reference-v13">
      <div className="dashboard-lead" data-ui-region="dashboard-lead">
      <header className="hero" id="top">
        <img className="hero-art" src="/visuals/ai-dashboard/reference-v10/hero-celestial-command-v10.webp" width={1774} height={887} fetchPriority="high" decoding="async" alt="" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-kicker"><span>玄星觀象</span><em>生命靈數演算系統</em></p>
          <h1 className="hero-title"><BrushTitle src="/visuals/ai-dashboard/reference-v13/hero-title-calligraphy-v13.webp" text="解碼生命・掌握命運" className="brush-hero" width={1440} height={558} /></h1>
          <p className="hero-summary">從生日開始，核對你的生命路徑、數字分布與人生階段。</p>
          <ul className="hero-proof" aria-label="分析特色"><li><img src="/visuals/ai-dashboard/reference-v5/function-bay-1-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span><strong>規則演算</strong><small>固定版本與逐步算式</small></span></li><li><img src="/visuals/ai-dashboard/reference-v5/function-bay-3-v5.webp" width={384} height={384} alt="" aria-hidden="true" /><span><strong>完整解析</strong><small>生日、路徑、九宮與流年</small></span></li><li><img src="/visuals/ai-dashboard/reference-v13/identity-verification-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>隱私安全</strong><small>分析資料只在本機處理</small></span></li></ul>
        </div>
        <div className="hero-rail"><p><strong><BrushTitle src="/visuals/brush/theme-xuanxing-web-v1.webp" text="玄星觀象" className="brush-theme" width={640} height={187} /></strong><span>生日生命靈數為主要分析</span></p><p>程式即時計算，沒有預填範例數值</p></div>
      </header>

      <section className="analyzer-section" id="analyzer" data-ui-region="analyzer" aria-labelledby="analyzer-title">
        <form className="analyzer-card" id="analyzer-form" data-active-mode={mode} onSubmit={handleAnalyze} noValidate>
          <fieldset className="mode-switch" data-ui-region="mode-deck">
            <legend className="sr-only">分析模式</legend>
            {(Object.keys(modeContent) as AnalysisMode[]).map((key) => (
              <label className={mode === key ? "is-active" : ""} data-mode-label={key} key={key}>
                <img className="mode-card-art" src={`/visuals/ai-dashboard/reference-v2/portal-${key === "birthday" ? "birthday" : key === "code" ? "spectrum" : "iching"}-v2.webp`} width={512} height={512} loading="eager" decoding="async" alt="" aria-hidden="true" />
                <input type="radio" name="analysis-mode" value={key} checked={mode === key} onChange={() => requestMode(key)} />
                <span><strong><BrushTitle src={modeContent[key].titleArt} text={modeContent[key].label} className="brush-mode" width={modeContent[key].titleWidth} height={modeContent[key].titleHeight} /><em>{modeContent[key].badge}</em></strong><small>{modeContent[key].description}</small></span>
              </label>
            ))}
            <a className="kangjie-mode-entry" href="/kangjie"><img className="mode-card-art" src="/visuals/ai-dashboard/reference-v2/portal-kangjie-v2.webp" width={512} height={512} loading="eager" decoding="async" alt="" aria-hidden="true" /><span><strong><BrushTitle src="/visuals/brush/title-kangjie-entry-web-v1.webp" text="邵康節易學" className="brush-mode brush-kangjie-entry" width={600} height={154} /><em>專頁</em></strong><small>梅花易數衍算與皇極經世尺度</small></span></a>
          </fieldset>

          <div className="mode-workbench">
            <figure className="mode-art"><img src={modeContent[mode].art} width={modeContent[mode].artWidth} height={modeContent[mode].artHeight} loading="lazy" decoding="async" alt={modeContent[mode].artAlt} /><figcaption><p className="section-index">當前分析模式</p><h2 id="analyzer-title" className="brush-heading current-mode-heading"><BrushTitle src={modeContent[mode].titleArt} text={modeContent[mode].label} lazy width={modeContent[mode].titleWidth} height={modeContent[mode].titleHeight} /></h2><span>{modeContent[mode].description}</span></figcaption></figure>
            <div className="mode-controls">
              <div className="input-panel" data-mode-panel={mode}>
                {mode === "birthday" && <label className="field-block" htmlFor="birthday-input"><span>出生日期（西元）</span><input ref={birthdayRef} id="birthday-input" type="date" autoComplete="bday" max={localDateString()} value={birthday} onChange={(event) => { const nextBirthday = event.target.value; setBirthday(nextBirthday); setMessage(""); setEntryHint(""); setResult(null); if (birthdayAutoSubmitRef.current && nextBirthday) { birthdayAutoSubmitRef.current = false; window.setTimeout(() => document.querySelector<HTMLFormElement>("#analyzer-form")?.requestSubmit(), 0); } }} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>}
                {mode === "code" && <label className="field-block" htmlFor="number-code"><span>手機末碼、門牌或自訂數字</span><input ref={codeRef} id="number-code" type="text" inputMode="numeric" autoComplete="off" maxLength={40} value={numberCode} onChange={(event) => { setNumberCode(event.target.value); setMessage(""); setResult(null); }} placeholder="例如：１２ 34-5678" aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>}
                {mode === "iching" && <div className="triple-input-grid">{ichingSensorInputs.map(({ label, help, placeholder, art }, index) => <label className="field-block" key={label}><span>{label}<small>{help}</small></span><img className="iching-sensor-art" src={art} width={384} height={384} loading="eager" decoding="async" alt="" aria-hidden="true" /><input className="iching-input" ref={index === 0 ? ichingRef : undefined} type="text" inputMode="numeric" autoComplete="off" value={ichingValues[index]} onChange={(event) => { setIChingValues((values) => values.map((value, valueIndex) => valueIndex === index ? event.target.value : value)); setMessage(""); setResult(null); }} placeholder={placeholder} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>)}</div>}
              </div>

              <div className="form-meta"><p id="input-help" aria-live="polite">{entryHint || modeContent[mode].help}</p>{hasValue && <button type="button" className="text-button" onClick={handleReset}>清除輸入</button>}</div>
              <p id="input-message" className="form-message" role="alert" aria-live="polite">{message}</p>
              <button type="submit" className="primary-button analyze-submit" id="analyze-button"><span data-analyze-label>{modeContent[mode].button}</span><img className="analyze-seal" src="/visuals/ai-dashboard/reference-v2/analyze-dragon-seal-v2.webp" width={384} height={384} loading="eager" decoding="async" alt="" aria-hidden="true" /><b aria-hidden="true">↘</b></button>
            </div>
          </div>
          <section className="desktop-result-preview" aria-label="生命路徑即時總覽">
            <header><strong>生命路徑總覽</strong><span data-preview-status>{result ? "結果已更新" : "等待輸入"}</span></header>
            <div>{(["primary", "secondary", "tertiary", "annual"] as const).map((key, index) => <article key={key}><small data-preview-label={key}>{analyticsView.previewLabels[index]}</small><strong data-preview-value={key}>{analyticsView.previewValues[index]}</strong></article>)}</div>
          </section>
          <ul className="method-strip" aria-label="分析承諾"><li>版本化規則</li><li>顯示完整算式</li><li>分析資料不上傳</li></ul>
        </form>
      </section>
      </div>

      <section className="dashboard-analytics" data-ui-region="desktop-analytics" aria-label="生命靈數分析總覽">
        <article className="analytics-overview">
          <header><span>分析狀態</span><strong data-analytics-status>{analyticsView.status}</strong></header>
          <div><span className="analytics-orbit" aria-hidden="true"><b>式</b><em>規則</em></span><span className="sr-only" data-analytics-core>{analyticsView.core}</span><dl><div><dt>目前模式</dt><dd data-analytics-mode>{analyticsView.modeLabel}</dd></div><div><dt>結果狀態</dt><dd data-analytics-state>{analyticsView.state}</dd></div><div><dt>計算方式</dt><dd>固定規則</dd></div></dl></div>
        </article>
        <article className="analytics-spectrum">
          <header><span data-analytics-distribution-title>{analyticsView.distributionTitle}</span><small>實際輸入 1 至 9</small></header>
          <div className="digit-bars" role="img" aria-label={result ? `數字一至九出現次數：${analyticsView.counts.map((count, index) => `${index + 1} 為 ${count} 次`).join("，")}` : "尚未分析，數字一至九出現次數皆為零"}>
            {analyticsView.counts.map((count, index) => {
              const level = maximumDigitCount > 0 ? Math.max(8, Math.round((count / maximumDigitCount) * 100)) : 0;
              return <span key={index + 1} data-digit-bar={index + 1} style={{ "--bar-level": level } as CSSProperties}><em>{count}</em><i /><b>{index + 1}</b></span>;
            })}
          </div>
        </article>
        <article className="analytics-core-detail">
          <header><span>本次主要結果</span><small data-preview-label="primary">{analyticsView.previewLabels[0]}</small></header>
          <div><span className="analytics-core-medal" aria-hidden="true"><b data-analytics-core-large>{analyticsView.core}</b></span><p><strong data-analytics-title>{analyticsView.title}</strong><em data-analytics-note>{analyticsView.note}</em></p></div>
        </article>
        <article className="analytics-annual">
          <header><span>個人流年摘要</span><small data-analytics-year>{analyticsView.annualYear}</small></header>
          <div><span className="analytics-year-medal"><small data-analytics-year-label>{analyticsView.annualLabel}</small><strong data-analytics-annual>{analyticsView.annual}</strong></span><p><strong data-analytics-annual-title>{analyticsView.annualTitle}</strong><em data-analytics-annual-note>{analyticsView.annualNote}</em></p></div>
        </article>
      </section>

      <section className="trust-rail cockpit-status" data-ui-region="cockpit" aria-label="四項主要結果">
        <header className="cockpit-live-rail"><span>台北 <strong data-cockpit-time>{cockpitClock.time}</strong><em data-cockpit-date>{cockpitClock.date}</em></span><span>模式 <strong data-cockpit-mode>{modeContent[mode].label}</strong><em data-cockpit-mode-note>{modeContent[mode].description}</em></span><span>本機安全運算</span></header>
        {(["primary", "secondary", "tertiary", "annual"] as const).map((key, index) => <article key={key}><small data-cockpit-result-label={key}>{analyticsView.previewLabels[index]}</small><strong data-cockpit-result-value={key}>{analyticsView.previewValues[index]}</strong></article>)}
      </section>

      <nav className="mobile-function-atlas function-command-grid" aria-label="十八項延伸功能；四個主要模式在上方切換">
        <a data-command-module="life-path" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "life-path")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-2-v5.webp" width={384} height={384} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>生命路徑</strong><small>主要數字</small></span></a>
        <a data-command-module="lo-shu" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "grid")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-4-v5.webp" width={384} height={384} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>九宮配置</strong><small>連線缺數</small></span></a>
        <a data-command-module="annual" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "annual")}><img src="/visuals/ai-dashboard/reference-v5/function-bay-5-v5.webp" width={384} height={384} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>個人流年</strong><small>年度週期</small></span></a>
        <a data-command-module="color" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "color")}><img src="/visuals/ai-dashboard/reference-v13/color-compass-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>適合色彩</strong><small>生日對應</small></span></a>
        <a data-command-module="name-strokes" href="/kangjie#name-strokes"><img src="/visuals/ai-dashboard/reference-v13/name-strokes-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>姓名筆畫</strong><small>自動查畫</small></span></a>
        <a data-command-module="identity" href="#numerology-workspace" onClick={openWorkspace("identity")}><img src="/visuals/ai-dashboard/reference-v13/identity-verification-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>身分證命格</strong><small>獨立入口</small></span></a>
        <a data-command-module="kangjie-calendar" href="/kangjie#method-calendar"><img src="/visuals/ai-dashboard/reference-v12/kangjie-calendar-v12.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>年月日時</strong><small>自動偵時</small></span></a>
        <a data-command-module="kangjie-object" href="/kangjie#method-object"><img src="/visuals/ai-dashboard/reference-v12/kangjie-object-v12.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>物數起卦</strong><small>可數之物</small></span></a>
        <a data-command-module="kangjie-sound" href="/kangjie#method-sound"><img src="/visuals/ai-dashboard/reference-v12/kangjie-sound-v12.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>聲音起卦</strong><small>單聲分段</small></span></a>
        <a data-command-module="kangjie-text" href="/kangjie#method-text"><img src="/visuals/ai-dashboard/reference-v12/kangjie-text-v12.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>字占姓名</strong><small>筆畫來源</small></span></a>
        <a data-command-module="kangjie-supplement" href="/kangjie#method-supplement"><img src="/visuals/ai-dashboard/reference-v12/kangjie-supplement-v12.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>古例補充</strong><small>尺寸端法</small></span></a>
        <a data-command-module="kangjie-huangji" href="/kangjie#method-huangji"><img src="/visuals/ai-dashboard/reference-v12/kangjie-huangji-v12.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>元會運世</strong><small>皇極數制</small></span></a>
        <a data-command-module="phone" href="#numerology-workspace" onClick={openWorkspaceEntry("phone_number")}><img src="/visuals/ai-dashboard/reference-v13/phone-resonance-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>手機磁場</strong><small>滑動配對</small></span></a>
        <a data-command-module="vehicle" href="#numerology-workspace" onClick={openWorkspaceEntry("vehicle_address")}><img src="/visuals/ai-dashboard/reference-v13/vehicle-address-map-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>車牌門牌</strong><small>英數轉換</small></span></a>
        <a data-command-module="sequence" href="#numerology-workspace" onClick={openWorkspaceEntry("custom_sequence")}><img src="/visuals/ai-dashboard/reference-v13/custom-sequence-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>自訂序列</strong><small>其他編號</small></span></a>
        <a data-command-module="history" href="#numerology-workspace" onClick={openWorkspace("history")}><img src="/visuals/ai-dashboard/reference-v13/local-history-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>本機紀錄</strong><small>遮罩保存</small></span></a>
        <a data-command-module="settings" href="#numerology-workspace" onClick={openWorkspace("settings")}><img src="/visuals/ai-dashboard/reference-v13/rule-profiles-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>規則設定</strong><small>版本切換</small></span></a>
        <a data-command-module="sources" href="#numerology-workspace" onClick={openWorkspace("sources")}><img src="/visuals/ai-dashboard/reference-v13/source-provenance-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><span><strong>規則來源</strong><small>公式界線</small></span></a>
      </nav>

      <section className="visual-module-rail" data-ui-region="modules" aria-labelledby="visual-module-title">
        <header><p>主要分析與進階工具</p><h2 id="visual-module-title"><BrushTitle src="/visuals/brush/title-workspace-web-v1.webp" text="進階靈數工作台" className="brush-visual-module" lazy width={640} height={122} /></h2><span>點一下直接進入，結果由程式即時計算</span></header>
        <div className="visual-module-grid">
          <a data-module="birthday" href="#analyzer" onClick={startBirthdayAnalysis}><img src="/visuals/birthday-panel-b-v3.webp" width={1717} height={916} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>生日分析</small><strong>生命全圖</strong><em>從出生日期建立主要數字</em><ul><li>生命路徑與生日數</li><li>態度數與個人流年</li><li>傳統對應色</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="life-path" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "life-path")}><img src="/visuals/ai-dashboard/life-path-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>生命路徑</small><strong>人生軌跡</strong><em>查看生命路徑與人生階段</em><ul><li>生命路徑數</li><li>生日週期</li><li>階段觀察</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="spectrum" href="#analyzer" onClick={() => requestMode("code")}><img src="/visuals/ai-dashboard/number-wave-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>數字頻譜</small><strong>號碼能量</strong><em>檢視任意數字分布</em><ul><li>逐位加總</li><li>出現頻率</li><li>號碼歸一數</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="lo-shu" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "grid")}><img src="/visuals/ai-dashboard/lo-shu-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>九宮配置</small><strong>數字格局</strong><em>出生九宮與連線缺數</em><ul><li>九宮分布</li><li>連線檢查</li><li>缺數整理</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="annual-cycle" href="#analyzer" onClick={(event) => startBirthdayAnalysis(event, "annual")}><img src="/visuals/ai-dashboard/annual-cycle-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>流年分析</small><strong>年度週期</strong><em>個人年與人生階段</em><ul><li>個人流年</li><li>年度位置</li><li>階段提醒</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
        </div>
        <div className="support-module-grid" data-ui-region="support" aria-label="工作台支援模塊">
          <a data-module="workbench" href="#numerology-workspace" onClick={openWorkspace("home")} aria-label="專業工作台：開啟九宮、磁場與本機紀錄"><img src="/visuals/ai-dashboard/reference-v10/name-stroke-workbench-v10.webp" width={1672} height={941} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><strong>專業工作台</strong><em>九宮、磁場與本機紀錄</em><ul><li>九宮配置</li><li>號碼磁場</li><li>身分證命格</li><li>分析歷史</li></ul><b>開啟工作台 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="sources" href="#method-source" aria-label="規則來源：查看版本、公式與使用界線"><img src="/visuals/ai-dashboard/reference-v13/source-provenance-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><strong>規則來源</strong><em>版本、公式與使用界線</em><ul><li>演算規則</li><li>資料來源</li><li>版本紀錄</li><li>使用界線</li></ul><b>核對規則 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="privacy" href="#privacy-section" aria-label="本機隱私：查看分析資料處理說明"><img src="/visuals/ai-dashboard/reference-v13/identity-verification-v13.webp" width={768} height={768} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><strong>本機隱私</strong><em>分析輸入不送往服務</em><ul><li>本機運算</li><li>本機儲存</li><li>可自行清除</li><li>不傳分析輸入</li></ul><b>查看說明 <i aria-hidden="true">→</i></b></div></a>
        </div>
      </section>
      </div>

      <div ref={resultRef} className="result-anchor">{result?.kind === "kangjie" ? <IChingResults result={result} onReset={handleReset} /> : result && <NumerologyResults result={result} onReset={handleReset} />}</div>

      <section className="method-source" id="method-source" aria-labelledby="method-source-title">
        <details>
          <summary><span>固定規則</span><strong id="method-source-title"><BrushTitle src="/visuals/brush/title-rules-web-v1.webp" text="規則與來源" className="brush-rules" lazy width={640} height={171} /></strong><small>可展開核對</small></summary>
          <div className="method-source-body"><div className="method-grid"><article><BrushTitle src="/visuals/brush/title-birthday-web-v1.webp" text="生日命碼" className="brush-method-card" lazy width={600} height={213} /><p>新版預設將 YYYYMMDD 全部數字相加，主數化簡至 1～9；舊版分段保留主數仍可在設定中切回。生日九宮與連線另有獨立規則版本；生命路徑色與態度色明列為本站延伸。</p></article><article><BrushTitle src="/visuals/brush/title-spectrum-web-v1.webp" text="數字頻譜" className="brush-method-card" lazy width={600} height={174} /><p>進階工作台以相鄰滑動配對處理八大磁場，保留原序列與 0／5 修飾軌跡；內容屬近代民俗，不宣稱為科學或古法定論。</p></article><article><BrushTitle src="/visuals/brush/title-iching-web-v1.webp" text="三數取卦" className="brush-method-card" lazy width={600} height={176} /><p>第一數取上卦、第二數取下卦、第三數取動爻。它是獨立補充工具，不會由生日或身分證自動起卦。</p></article><article><BrushTitle src="/visuals/brush/title-kangjie-entry-web-v1.webp" text="邵康節易學" className="brush-method-card" lazy width={600} height={154} /><p>獨立專頁分開處理年月日時、物數、雙段聲數、字數法與皇極時間尺度。</p></article></div>
          <div className="data-source" id="data-source"><div><h2><BrushTitle src="/visuals/brush/title-source-web-v1.webp" text="方法與本文來源" className="brush-source" lazy width={640} height={133} /></h2><p>色名可查原書，HEX 為本站數位轉譯；色彩功能屬歷史命理文化參考，不是科學個人色彩診斷。</p></div><p><a href="https://www.worldnumerology.com/numerology-life-path/" target="_blank" rel="noreferrer">生命路徑計算</a><a href="https://www.worldnumerology.com/do-your-own-reading/" target="_blank" rel="noreferrer">個人年／月／日現代公式</a><a href="https://archive.org/details/in.ernet.dli.2015.70770/page/n137/mode/2up" target="_blank" rel="noreferrer">Cheiro 原書色彩章</a><a href="https://doi.org/10.1146/annurev-psych-010213-115035" target="_blank" rel="noreferrer">色彩心理研究界線</a><a href="https://zh.wikisource.org/zh/周易" target="_blank" rel="noreferrer">維基文庫《周易》</a><a href="https://ctext.org/wiki.pl?chapter=867487&amp;if=en&amp;remap=gb" target="_blank" rel="noreferrer">《梅花易數》卷一</a><a href="/kangjie#sources">邵康節專頁來源</a></p></div></div>
        </details>
      </section>

      <section className="disclaimer" id="privacy-section" aria-labelledby="disclaimer-title"><span aria-hidden="true">※</span><div><h2 id="disclaimer-title"><BrushTitle src="/visuals/brush/title-disclaimer-web-v1.webp" text="使用提醒" className="brush-disclaimer" lazy width={640} height={180} /></h2><p>本工具屬文化娛樂與自我反思用途，不是科學人格測驗或個人色彩測驗、命運預測、醫療診斷、心理評估或專業建議，也不應作為健康、財務、法律、工作或人事決策依據。</p><p className="counter-privacy-note">生日、身分證、密碼與輸入數字只在本機計算；完整身分證不寫入歷史。頁面只向公開計數服務送出造訪請求，不包含任何分析輸入。</p></div></section>
      <section id="numerology-workspace" ref={workspaceRef}></section>
      <footer><p>© {new Date().getFullYear()} 生命靈數</p><p>同一網址，自動適配手機與電腦</p></footer>
      </div>
      <dialog ref={accessDialogRef} className="mode-password-dialog" aria-labelledby="iching-access-title-react" aria-describedby="iching-access-description-react" onCancel={(event) => { event.preventDefault(); closeAccessDialog(); }}>
        <form className="mode-password-card" onSubmit={handleAccessSubmit} noValidate>
          <button type="button" className="mode-password-close" onClick={closeAccessDialog} aria-label="關閉密碼視窗">×</button>
          <p className="section-index">受保護模式・需密碼</p>
          <h2 id="iching-access-title-react"><BrushTitle src="/visuals/brush/title-iching-web-v1.webp" text="三數取卦" className="brush-dialog-iching" width={600} height={176} /></h2>
          <p id="iching-access-description-react">輸入四位密碼後，才能開啟三數取卦。</p>
          <label htmlFor="iching-access-password-react">存取密碼</label>
          <div className="mode-password-fields"><input ref={accessInputRef} id="iching-access-password-react" name="password" type="password" inputMode="numeric" autoComplete="off" maxLength={4} pattern="[0-9]{4}" placeholder="輸入 4 位數字" value={accessPassword} onChange={(event) => { setAccessPassword(event.target.value.replace(/\D/g, "").slice(0, 4)); setAccessMessage(""); }} aria-invalid={Boolean(accessMessage)} aria-describedby="iching-access-message-react" required /><button type="submit">驗證並開啟</button></div>
          <p className="mode-password-message" id="iching-access-message-react" role="alert" aria-live="polite">{accessMessage}</p>
          <small>這是瀏覽器端簡易入口鎖，適合避免一般誤入，不適合存放機密資料。</small>
        </form>
      </dialog>
    </main>
  );
}
