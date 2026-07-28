/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import {
  LO_SHU_ORDER,
  analyzeBirthday,
  analyzeDigitCode,
  calculateIChing,
  lineNames,
  localDateString,
  masterThemes,
  profiles,
} from "../calculator-core.js";
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
type BirthdayResult = ReturnType<typeof analyzeBirthday>;
type CodeResult = ReturnType<typeof analyzeDigitCode>;
type IChingResult = ReturnType<typeof calculateIChing>;
type NumerologyResult = BirthdayResult | CodeResult;

const modeContent = {
  birthday: {
    label: "生日命碼",
    badge: "主要",
    description: "生命路徑、生日數、個人流年與傳統對應色",
    button: "分析生日命碼",
    help: "只需西元生日；身分證請使用下方獨立入口。",
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
    description: "任意號碼的加總、核心數與數字分布",
    button: "分析數字頻譜",
    help: "接受半形或全形數字、空白與半形連字號；請勿輸入敏感資料。",
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
    help: "三個整數各自取卦，不會自動切分生日或號碼。",
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

function getCockpitSummary(result: NumerologyResult | IChingResult | null) {
  if (!result) return { value: "待分析", note: "輸入資料後即時顯示" };
  if (result.kind === "birthday") {
    return {
      value: `生命路徑 ${result.lifePath.display}`,
      note: `生日數 ${result.birthday.display}・${result.personalYear.year} 流年 ${result.personalYear.value}`,
    };
  }
  if (result.kind === "code") {
    return { value: `核心數 ${result.core}`, note: `${result.length} 位數・總和 ${result.sum}` };
  }
  return { value: result.original.name, note: `動爻 ${result.moving.name}・變卦 ${result.transformed.name}` };
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

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="metric-card">
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
    <details className="result-disclosure calculation-card digit-distribution">
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
  return (
    <details className="result-disclosure calculation-card">
      <summary><span><small>計算軌跡</small><strong>查看完整算式</strong></span><em>{result.calculations.length} 步可逐項核對</em></summary>
      <div className="disclosure-body">
        <header className="panel-heading"><div><p>計算軌跡</p><h3 className="brush-fixed-heading"><FixedBrushTitle text="這個結果怎麼算" className="brush-panel-title" /></h3></div><span>可逐步核對</span></header>
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
        <div><p>色彩參考</p><h3 id="color-guide-title" className="brush-fixed-heading"><FixedBrushTitle text="個人色彩指引" className="brush-color-guide" lazy /></h3></div>
        <p className="color-guide-basis">生日數 {guide.traditional.number}・原書色群 {palette.sourceFamilies.join("、")}</p>
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
      ]
    : [
        { label: "數字位數", value: String(result.length), note: "只計入實際數字" },
        { label: "逐位總和", value: String(result.sum), note: "尚未收斂的總和" },
        { label: "核心數", value: String(result.core), note: "逐位加總至 1 到 9" },
        { label: "最常出現", value: result.strongest.join("、"), note: result.strongest.length > 1 ? "並列最高次數" : "出現次數最高" },
      ];

  return (
    <section className="results" aria-labelledby="result-title">
      <header className="result-hero">
        <div className="result-copy">
          <h2 id="result-title" className="brush-result-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-result-v4.webp" text="數理結果" /></h2>
          <div className="result-value">{result.headlineValue}<small>{profile.title}</small></div>
          <p>{profile.symbol}。以下內容只作文化娛樂與自我提問參考。</p>
        </div>
        <figure className="result-art"><img src={resultArt} width={result.kind === "birthday" ? 1586 : 1823} height={result.kind === "birthday" ? 992 : 863} loading="lazy" decoding="async" alt="古金數字節點分析視覺" /><figcaption>核心數 {result.headlineValue}</figcaption></figure>
      </header>

      <div className="metric-grid">{metrics.map((metric) => <MetricCard {...metric} key={metric.label} />)}</div>

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
      <header className="iching-result-heading"><div><h2 id="iching-result-title" className="brush-iching-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-iching-web-v1.webp" text="三數取卦" width={600} height={176} /></h2><p className="iching-structure">本卦・互卦・變卦</p></div><div className="iching-result-meta"><p>動爻為<strong>{result.moving.name}</strong>，{result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。</p><YaoLegend /></div></header>
      <div className="hexagram-grid">
        <HexagramCard label="本卦" value={result.original} movingIndex={result.moving.index} mark="動" />
        <HexagramCard label="互卦" value={result.mutual} />
        <HexagramCard label="變卦" value={result.transformed} movingIndex={result.moving.index} mark="變" />
      </div>
      <div className="iching-trace">
        <div><span>第一數取上卦</span><strong>{result.inputs[0]} ÷ 8 → 餘 {result.remainders[0]}（{result.original.upper.name}）</strong></div>
        <div><span>第二數取下卦</span><strong>{result.inputs[1]} ÷ 8 → 餘 {result.remainders[1]}（{result.original.lower.name}）</strong></div>
        <div><span>第三數取動爻</span><strong>{result.inputs[2]} ÷ 6 → 餘 {result.remainders[2]}（{result.moving.name}）</strong></div>
      </div>
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
    setMode(nextMode); setResult(null); setMessage("");
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

  function startBirthdayAnalysis(event: ReactMouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const mountedBirthdayInput = birthdayRef.current;
    changeMode("birthday");
    const analyzer = document.querySelector("#analyzer");
    analyzer?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    analyzer?.classList.remove("is-entry-highlight");
    window.requestAnimationFrame(() => analyzer?.classList.add("is-entry-highlight"));
    window.setTimeout(() => analyzer?.classList.remove("is-entry-highlight"), 1400);
    window.history.replaceState(null, "", "#analyzer");
    mountedBirthdayInput?.focus({ preventScroll: true });
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

  function revealResult() {
    window.setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      resultRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
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
        : mode === "code" ? analyzeDigitCode(numberCode) : calculateIChing(ichingValues);
      if (mode === "birthday") {
        saveAnalysisHistory(analyzeBirthdayV2({
          date: birthday,
          currentYear,
          todayValue,
          createdAt: new Date().toISOString(),
          ruleSet,
        }));
      }
      setMessage(""); setResult(nextResult); revealResult();
    } catch (error) {
      setResult(null); setMessage(error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。"); focusCurrentInput();
    }
  }

  function handleReset() {
    if (mode === "birthday") setBirthday("");
    if (mode === "code") setNumberCode("");
    if (mode === "iching") setIChingValues(["", "", ""]);
    setResult(null); setMessage(""); focusCurrentInput();
  }

  function openWorkspace(view: "home" | "identity" | "sequence" | "settings" | "history" | "sources") {
    return (event: ReactMouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const tab = document.querySelector<HTMLButtonElement>(`[data-workspace-tab="${view}"]`);
      if (tab) tab.click();
      else document.querySelector("#numerology-workspace")?.scrollIntoView({ behavior: "auto", block: "start" });
    };
  }

  const hasValue = mode === "birthday" ? Boolean(birthday) : mode === "code" ? Boolean(numberCode) : ichingValues.some(Boolean);
  const cockpitSummary = getCockpitSummary(result);

  return (
    <main className="site-shell" data-ui="xuanxing-aaa">
      <aside className="dashboard-sidebar" aria-label="快速功能">
        <a className="sidebar-brand" href="#top">
          <span className="sidebar-crest" aria-hidden="true"><img src="/visuals/ai-dashboard/reference-v2/brand-crest-v2.webp" width={512} height={512} fetchPriority="high" decoding="async" alt="" /></span>
          <BrushTitle src="/visuals/brush/brand-life-numerology-aaa-web-v1.webp" text="生命靈數" className="brush-sidebar-brand" priority width={720} height={194} />
        </a>
        <p className="sidebar-tagline">數字有軌跡，規則可核對</p>
        <p className="sidebar-intro">把生日、生命路徑、九宮、流年與數字紀錄集中在同一個可核對的工作台。</p>
        <a className="sidebar-primary" href="#analyzer" onClick={startBirthdayAnalysis} aria-label="切換至生日命碼並聚焦出生日期欄位"><span>輸入生日開始分析</span><b aria-hidden="true">→</b></a>
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
            <a href="#analyzer" onClick={() => requestMode("birthday")}><strong>生日</strong><small>主命數</small></a>
            <a href="#analyzer" onClick={() => requestMode("code")}><strong>頻譜</strong><small>號碼</small></a>
            <a href="#analyzer" onClick={() => requestMode("iching")}><strong>取卦</strong><small>密碼</small></a>
            <a href="#numerology-workspace" onClick={openWorkspace("identity")}><strong>身分證</strong><small>命格</small></a>
            <a href="#numerology-workspace" onClick={openWorkspace("history")}><strong>紀錄</strong><small>本機</small></a>
            <a href="#numerology-workspace" onClick={openWorkspace("sources")}><strong>規則</strong><small>來源</small></a>
          </div>
        </div>
        <div className="sidebar-status"><span aria-hidden="true" /><p><strong>本機安全運算</strong><small>輸入資料不上傳</small></p></div>
      </aside>

      <div className="dashboard-canvas">
      <nav className="topbar" aria-label="主要導覽">
        <a className="wordmark" href="#top"><span aria-hidden="true"><i>命</i></span><strong><BrushTitle src="/visuals/brush/brand-life-numerology-aaa-web-v1.webp" text="生命靈數" className="brush-brand" priority width={720} height={194} /></strong></a>
        <div><a href="#analyzer" onClick={() => requestMode("birthday")}>生日分析</a><a href="#analyzer" onClick={() => requestMode("code")}>數字頻譜</a><a className="nav-optional" href="#analyzer" onClick={() => requestMode("birthday")}>九宮配置</a><a className="nav-optional" href="#analyzer" onClick={() => requestMode("birthday")}>流年分析</a><a href="#numerology-workspace" onClick={openWorkspace("home")}>進階工作台</a><a href="/kangjie">邵康節專頁</a><a className="nav-optional" href="#method-source">規則來源</a><p className="visit-counter" data-visit-counter data-state={visitState} role="status" aria-live="polite" aria-atomic="true" aria-label={visitState === "ready" ? `累積造訪 ${visitCount} 次` : visitState === "unavailable" ? "累積造訪次數暫時無法讀取" : "正在讀取累積造訪次數"}><span>累積造訪</span><strong data-visit-count>{visitCount}</strong><small>次</small></p></div>
      </nav>

      <div className="dashboard-home-screen">
      <div className="dashboard-lead" data-ui-region="dashboard-lead">
      <header className="hero" id="top">
        <img className="hero-art" src="/visuals/ai-dashboard/hero-life-v1.webp" width={1915} height={821} fetchPriority="high" decoding="async" alt="" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-kicker"><span>玄星觀象</span><em>生命靈數演算系統</em></p>
          <h1 className="hero-title"><BrushTitle src="/visuals/brush/title-hero-web-v1.webp" text="看見你的數字軌跡" className="brush-hero" width={900} height={576} /></h1>
          <p className="hero-summary">從生日開始，核對你的生命路徑、數字分布與人生階段。</p>
          <a className="hero-cta" href="#analyzer" onClick={startBirthdayAnalysis} aria-label="切換至生日命碼並聚焦出生日期欄位"><span>直接輸入出生日期</span><strong aria-hidden="true">↘</strong></a>
        </div>
        <div className="hero-rail"><p><strong><BrushTitle src="/visuals/brush/theme-xuanxing-web-v1.webp" text="玄星觀象" className="brush-theme" width={640} height={187} /></strong><span>生日生命靈數為主要分析</span></p><p>版本化規則・完整算式・所有分析輸入只在本機處理</p></div>
      </header>

      <section className="trust-rail cockpit-status" data-ui-region="cockpit" aria-label="即時分析摘要">
        <article className="cockpit-time"><span className="cockpit-dial" aria-hidden="true"><i /></span><div><small>台北目前時間</small><strong data-cockpit-time>{cockpitClock.time}</strong><em data-cockpit-date>{cockpitClock.date}</em></div></article>
        <article><span className="cockpit-mark" aria-hidden="true">式</span><div><small>目前分析模式</small><strong data-cockpit-mode>{modeContent[mode].label}</strong><em data-cockpit-mode-note>{modeContent[mode].description}</em></div></article>
        <article><span className="cockpit-mark" aria-hidden="true">核</span><div><small>核心摘要</small><strong data-cockpit-core>{cockpitSummary.value}</strong><em data-cockpit-core-note>{cockpitSummary.note}</em></div></article>
        <article><span className="cockpit-mark" aria-hidden="true">安</span><div><small>資料處理</small><strong>只在本機</strong><em>分析輸入不送往服務</em></div></article>
        <span className="cockpit-center-seal" aria-hidden="true"><img src="/visuals/ai-dashboard/reference-v2/cockpit-seal-frame-v2.webp" width={384} height={384} loading="eager" decoding="async" alt="" /><i>☯</i></span>
      </section>

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
                {mode === "birthday" && <label className="field-block" htmlFor="birthday-input"><span>出生日期（西元）</span><input ref={birthdayRef} id="birthday-input" type="date" autoComplete="bday" max={localDateString()} value={birthday} onChange={(event) => { setBirthday(event.target.value); setMessage(""); }} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>}
                {mode === "code" && <label className="field-block" htmlFor="number-code"><span>手機末碼、門牌或自訂數字</span><input ref={codeRef} id="number-code" type="text" inputMode="numeric" autoComplete="off" maxLength={60} value={numberCode} onChange={(event) => { setNumberCode(event.target.value); setMessage(""); }} placeholder="例如：１２ 34-5678" aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>}
                {mode === "iching" && <div className="triple-input-grid">{[["第一數", "上卦 ÷ 8"], ["第二數", "下卦 ÷ 8"], ["第三數", "動爻 ÷ 6"]].map(([label, help], index) => <label className="field-block" key={label}><span>{label}<small>{help}</small></span><input className="iching-input" ref={index === 0 ? ichingRef : undefined} type="text" inputMode="numeric" autoComplete="off" value={ichingValues[index]} onChange={(event) => { setIChingValues((values) => values.map((value, valueIndex) => valueIndex === index ? event.target.value : value)); setMessage(""); }} placeholder={`例如：${[9, 13, 20][index]}`} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>)}</div>}
              </div>

              <div className="form-meta"><p id="input-help">{modeContent[mode].help}</p>{hasValue && <button type="button" className="text-button" onClick={handleReset}>清除輸入</button>}</div>
              <p id="input-message" className="form-message" role="alert" aria-live="polite">{message}</p>
              <button type="submit" className="primary-button analyze-submit" id="analyze-button">{modeContent[mode].button}<img className="analyze-seal" src="/visuals/ai-dashboard/reference-v2/analyze-dragon-seal-v2.webp" width={384} height={384} loading="eager" decoding="async" alt="" aria-hidden="true" /><span aria-hidden="true">↘</span></button>
            </div>
          </div>
          <ul className="method-strip" aria-label="分析承諾"><li>版本化規則</li><li>顯示完整算式</li><li>分析資料不上傳</li></ul>
        </form>
      </section>
      </div>

      <section className="visual-module-rail" data-ui-region="modules" aria-labelledby="visual-module-title">
        <header><p>主要分析與進階工具</p><h2 id="visual-module-title"><BrushTitle src="/visuals/brush/title-workspace-web-v1.webp" text="進階靈數工作台" className="brush-visual-module" lazy width={640} height={122} /></h2><span>點一下直接進入，結果由程式即時計算</span></header>
        <div className="visual-module-grid">
          <a data-module="birthday" href="#analyzer" onClick={() => requestMode("birthday")}><img src="/visuals/birthday-panel-b-v3.webp" width={1717} height={916} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>生日分析</small><strong>生命全圖</strong><em>從出生日期建立主要數字</em><ul><li>生命路徑與生日數</li><li>態度數與個人流年</li><li>傳統對應色</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="life-path" href="#analyzer" onClick={() => requestMode("birthday")}><img src="/visuals/ai-dashboard/life-path-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>生命路徑</small><strong>人生軌跡</strong><em>查看核心數與人生階段</em><ul><li>生命路徑數</li><li>生日週期</li><li>階段觀察</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="spectrum" href="#analyzer" onClick={() => requestMode("code")}><img src="/visuals/ai-dashboard/number-wave-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>數字頻譜</small><strong>號碼能量</strong><em>檢視任意數字分布</em><ul><li>逐位加總</li><li>出現頻率</li><li>核心數字</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="lo-shu" href="#numerology-workspace" onClick={openWorkspace("home")}><img src="/visuals/ai-dashboard/lo-shu-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>九宮配置</small><strong>數字格局</strong><em>出生九宮與連線缺數</em><ul><li>九宮分布</li><li>連線檢查</li><li>缺數整理</li></ul><b>開啟工作台 <i aria-hidden="true">→</i></b></div></a>
          <a data-module="annual-cycle" href="#analyzer" onClick={() => requestMode("birthday")}><img src="/visuals/ai-dashboard/annual-cycle-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><small>流年分析</small><strong>年度週期</strong><em>個人年與人生階段</em><ul><li>個人流年</li><li>年度位置</li><li>階段提醒</li></ul><b>立即分析 <i aria-hidden="true">→</i></b></div></a>
        </div>
        <div className="support-module-grid" data-ui-region="support" aria-label="工作台支援模塊">
          <a data-module="workbench" href="#numerology-workspace" onClick={openWorkspace("home")} aria-label="專業工作台：開啟九宮、磁場與本機紀錄"><img src="/visuals/ai-dashboard/workbench-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><strong>專業工作台</strong><em>九宮、磁場與本機紀錄</em><small>身分證命格・號碼磁場・分析歷史</small></div></a>
          <a data-module="sources" href="#method-source" aria-label="規則來源：查看版本、公式與使用界線"><img src="/visuals/ai-dashboard/sources-library-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><strong>規則來源</strong><em>版本、公式與使用界線</em><small>演算規則・資料來源・版本紀錄</small></div></a>
          <a data-module="privacy" href="#privacy-section" aria-label="本機隱私：查看分析資料處理說明"><img src="/visuals/ai-dashboard/privacy-lock-v1.webp" width={960} height={640} loading="lazy" decoding="async" alt="" aria-hidden="true" /><div><strong>本機隱私</strong><em>分析輸入不送往服務</em><small>本機運算・本機儲存・可自行清除</small></div></a>
        </div>
      </section>
      </div>

      <div ref={resultRef} className="result-anchor">{result?.kind === "iching" ? <IChingResults result={result} onReset={handleReset} /> : result && <NumerologyResults result={result} onReset={handleReset} />}</div>

      <section id="numerology-workspace" ref={workspaceRef}></section>

      <section className="method-source" id="method-source" aria-labelledby="method-source-title">
        <details>
          <summary><span>固定規則</span><strong id="method-source-title"><BrushTitle src="/visuals/brush/title-rules-web-v1.webp" text="規則與來源" className="brush-rules" lazy width={640} height={171} /></strong><small>可展開核對</small></summary>
          <div className="method-source-body"><div className="method-grid"><article><BrushTitle src="/visuals/brush/title-birthday-web-v1.webp" text="生日命碼" className="brush-method-card" lazy width={600} height={213} /><p>新版預設將 YYYYMMDD 全部數字相加，主數化簡至 1～9；舊版分段保留主數仍可在設定中切回。生日九宮與連線另有獨立規則版本；生命路徑色與態度色明列為本站延伸。</p></article><article><BrushTitle src="/visuals/brush/title-spectrum-web-v1.webp" text="數字頻譜" className="brush-method-card" lazy width={600} height={174} /><p>進階工作台以相鄰滑動配對處理八大磁場，保留原序列與 0／5 修飾軌跡；內容屬近代民俗，不宣稱為科學或古法定論。</p></article><article><BrushTitle src="/visuals/brush/title-iching-web-v1.webp" text="三數取卦" className="brush-method-card" lazy width={600} height={176} /><p>第一數取上卦、第二數取下卦、第三數取動爻。它是獨立補充工具，不會由生日或身分證自動起卦。</p></article><article><BrushTitle src="/visuals/brush/title-kangjie-entry-web-v1.webp" text="邵康節易學" className="brush-method-card" lazy width={600} height={154} /><p>獨立專頁分開處理年月日時、物數、雙段聲數、字數法與皇極時間尺度。</p></article></div>
          <div className="data-source" id="data-source"><div><h2><BrushTitle src="/visuals/brush/title-source-web-v1.webp" text="方法與本文來源" className="brush-source" lazy width={640} height={133} /></h2><p>色名可查原書，HEX 為本站數位轉譯；色彩功能屬歷史命理文化參考，不是科學個人色彩診斷。</p></div><p><a href="https://www.worldnumerology.com/numerology-life-path/" target="_blank" rel="noreferrer">生命路徑計算</a><a href="https://archive.org/details/in.ernet.dli.2015.70770/page/n137/mode/2up" target="_blank" rel="noreferrer">Cheiro 原書色彩章</a><a href="https://doi.org/10.1146/annurev-psych-010213-115035" target="_blank" rel="noreferrer">色彩心理研究界線</a><a href="https://zh.wikisource.org/zh/周易" target="_blank" rel="noreferrer">維基文庫《周易》</a><a href="https://ctext.org/wiki.pl?chapter=867487&amp;if=en&amp;remap=gb" target="_blank" rel="noreferrer">《梅花易數》卷一</a><a href="/kangjie#sources">邵康節專頁來源</a></p></div></div>
        </details>
      </section>

      <section className="disclaimer" id="privacy-section" aria-labelledby="disclaimer-title"><span aria-hidden="true">※</span><div><h2 id="disclaimer-title"><BrushTitle src="/visuals/brush/title-disclaimer-web-v1.webp" text="使用提醒" className="brush-disclaimer" lazy width={640} height={180} /></h2><p>本工具屬文化娛樂與自我反思用途，不是科學人格測驗或個人色彩測驗、命運預測、醫療診斷、心理評估或專業建議，也不應作為健康、財務、法律、工作或人事決策依據。</p><p className="counter-privacy-note">生日、身分證、密碼與輸入數字只在本機計算；完整身分證不寫入歷史。頁面只向公開計數服務送出造訪請求，不包含任何分析輸入。</p></div></section>
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
