/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useRef, useState } from "react";
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

type AnalysisMode = "birthday" | "code" | "iching";
type BirthdayResult = ReturnType<typeof analyzeBirthday>;
type CodeResult = ReturnType<typeof analyzeDigitCode>;
type IChingResult = ReturnType<typeof calculateIChing>;
type NumerologyResult = BirthdayResult | CodeResult;

const modeContent = {
  birthday: {
    label: "生日命碼",
    badge: "主要",
    description: "生命路徑、生日數、態度數與個人流年",
    button: "分析生日命碼",
    help: "只需西元生日，不需姓名、時辰或身分證字號。",
    art: "/visuals/birthday-panel-b-v3.webp",
    titleArt: "/visuals/brush/title-birthday-v4.webp",
    artAlt: "古金曆法年輪與生日節點模組背景",
  },
  code: {
    label: "數字頻譜",
    badge: "次要",
    description: "任意號碼的加總、核心數與數字分布",
    button: "分析數字頻譜",
    help: "接受半形或全形數字、空白與半形連字號；請勿輸入敏感資料。",
    art: "/visuals/digit-spectrum-panel-b-v3.webp",
    titleArt: "/visuals/brush/title-spectrum-v4.webp",
    artAlt: "古金數字頻率波形與九點節律模組背景",
  },
  iching: {
    label: "三數取卦",
    badge: "補充",
    description: "固定卦表推算本卦、互卦、動爻與變卦",
    button: "開始三數取卦",
    help: "三個整數各自取卦，不會把生日或一串號碼自動切段。",
    art: "/visuals/iching-instrument-b-v3.webp",
    titleArt: "/visuals/brush/title-iching-v4.webp",
    artAlt: "低亮古金六爻測量儀視覺",
  },
} as const;

function BrushTitle({ src, text, className = "" }: { src: string; text: string; className?: string }) {
  return <span className={`brush-title ${className}`.trim()}><span className="sr-only">{text}</span><img className="brush-title-image" src={src} alt="" aria-hidden="true" /></span>;
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
  return (
    <details className="result-disclosure calculation-card digit-distribution">
      <summary><span><small>數字分布</small><strong>查看完整九宮</strong></span><em>出現 {9 - result.missing.length} 種・缺少 {result.missing.length} 種</em></summary>
      <div className="disclosure-body">
        <header className="panel-heading">
          <div><p>數字分布</p><h3>{title}</h3></div>
          <span>數字 0 出現 {result.zeroCount} 次</span>
        </header>
        <p className="panel-copy">採洛書 4・9・2／3・5・7／8・1・6 版位呈現次數。這是現代視覺化，不宣稱為古法命盤。</p>
        <div className="lo-shu-grid" aria-label="一到九數字出現次數">
          {LO_SHU_ORDER.map((digit) => {
            const count = result.counts[digit];
            return (
              <div className={`digit-cell ${count ? "is-present" : "is-missing"}`} key={digit}>
                <strong>{digit}</strong><span>{count ? `${count} 次` : "未出現"}</span>
                <i style={{ "--count": Math.min(count, 4) } as React.CSSProperties} aria-hidden="true" />
              </div>
            );
          })}
        </div>
        <p className="missing-summary">{result.missing.length ? `未出現：${result.missing.join("、")}` : "1 到 9 都有出現"}</p>
      </div>
    </details>
  );
}

function CalculationDetails({ result }: { result: NumerologyResult }) {
  return (
    <details className="result-disclosure calculation-card">
      <summary><span><small>計算軌跡</small><strong>查看完整算式</strong></span><em>{result.calculations.length} 步可逐項核對</em></summary>
      <div className="disclosure-body">
        <header className="panel-heading"><div><p>計算軌跡</p><h3>這個結果怎麼算</h3></div><span>可逐步核對</span></header>
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

function NumerologyResults({ result, onReset }: { result: NumerologyResult; onReset: () => void }) {
  const profile = profiles[result.profileNumber];
  const resultArt = result.kind === "birthday" ? "/visuals/numerology-result-panel-b-v3.webp" : "/visuals/digit-spectrum-panel-b-v3.webp";
  const metrics = result.kind === "birthday"
    ? [
        { label: "生命路徑數", value: result.lifePath.display, note: "月、日、年分段化簡" },
        { label: "生日數", value: result.birthday.display, note: "保留原日期與基底" },
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
        <figure className="result-art"><img src={resultArt} alt="古金數字節點分析視覺" /><figcaption>核心數 {result.headlineValue}</figcaption></figure>
      </header>

      <div className="metric-grid">{metrics.map((metric) => <MetricCard {...metric} key={metric.label} />)}</div>

      {result.kind === "birthday" && result.lifePath.isMaster && (
        <div className="master-note" role="note"><strong>主數 {result.lifePath.value}／基底 {result.lifePath.base}</strong><p>{masterThemes[result.lifePath.value as 11 | 22 | 33]}</p></div>
      )}

      <div className="result-overview"><CalculationDetails result={result} /><DigitDistribution result={result} /></div>

      <details className="insight-ledger" aria-labelledby="insight-title">
        <summary><span><small>原型參考</small><strong id="insight-title">把結果變成可觀察的問題</strong></span><em>4 項觀察提醒</em></summary>
        <div>
          <article><span>01</span><h4>核心傾向</h4><p>{profile.traits}</p></article>
          <article><span>02</span><h4>壓力提醒</h4><p>{profile.shadow}</p></article>
          <article><span>03</span><h4>日常照顧</h4><p>{profile.wellbeing}</p></article>
          <article><span>04</span><h4>溝通提醒</h4><blockquote>「{profile.marker}」</blockquote><p>{profile.markerDesc}</p></article>
        </div>
      </details>

      <article className="advice-card"><span aria-hidden="true">策</span><div><h3>本次自我提問</h3><p>{profile.advice}</p></div></article>
      <div className="result-actions"><button type="button" className="secondary-button" onClick={onReset}>重新分析另一筆資料</button></div>
    </section>
  );
}

function HexagramLines({ lines, movingIndex = -1, mark = "" }: { lines: number[]; movingIndex?: number; mark?: string }) {
  return (
    <div className="hexagram-lines" aria-label="六爻卦象，畫面由上爻排列至初爻">
      {[5, 4, 3, 2, 1, 0].map((index) => (
        <div className={`line-row ${index === movingIndex ? "is-moving" : ""}`} key={index}>
          <span>{lineNames[index]}</span>
          <span className={`yao ${lines[index] === 1 ? "yang" : "yin"}`} aria-label={lines[index] === 1 ? "陽爻" : "陰爻"}><i />{lines[index] === 0 && <i />}</span>
          <strong>{index === movingIndex ? mark : ""}</strong>
        </div>
      ))}
    </div>
  );
}

function HexagramCard({ label, value, movingIndex, mark }: { label: string; value: IChingResult["original"]; movingIndex?: number; mark?: string }) {
  const text = getIChingText(value.hexId);
  return (
    <article className="hexagram-card">
      <header><div><p>{label}</p><h3><span>{text.symbol}</span>{value.name}</h3></div><small>第 {value.hexId} 卦</small></header>
      <p>上{value.upper.name}（{value.upper.nature}）・下{value.lower.name}（{value.lower.nature}）</p>
      <HexagramLines lines={value.lines} movingIndex={movingIndex} mark={mark} />
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
      <img className="classic-panel-art" src="/visuals/iching-manuscript-b-v3.webp" alt="" aria-hidden="true" />
      <div className="classic-panel-inner">
        <div className="classic-name"><span aria-hidden="true">{original.symbol}</span><div><small>第 {original.id} 卦</small><h3>{original.name}・{original.fullName}</h3></div></div>

        <div className="classic-columns">
          <article><h4>卦辭</h4><p>{original.judgment}</p></article>
          <article><h4>彖曰</h4><p>{original.tuan}</p></article>
          <article><h4>象曰</h4><p>{original.image}</p></article>
        </div>

        <div className="line-texts">
          <h4>六爻原文</h4>
          {original.lines.map((line, index) => (
            <article className={index === result.moving.index ? "is-active" : ""} key={line.position}>
              <span>{index === result.moving.index ? "動爻" : String(line.position).padStart(2, "0")}</span>
              <div><p>{line.text}</p><small>《象》曰：{line.image}</small></div>
            </article>
          ))}
          {original.special.map((line) => <article key={line.text}><span>用</span><div><p>{line.text}</p>{line.image && <small>《象》曰：{line.image}</small>}</div></article>)}
        </div>

        {original.wenyan && <details className="classic-details"><summary>展開《文言》原文</summary><p>{original.wenyan}</p></details>}
        <details className="classic-details"><summary>查看變卦第 {transformed.id} 卦「{transformed.name}」本文</summary><div><h4>卦辭</h4><p>{transformed.judgment}</p><h4>象曰</h4><p>{transformed.image}</p></div></details>
        <p className="classic-source">本文來源：<a href={sourceUrl} target="_blank" rel="noreferrer">維基文庫《周易》</a>，修訂版本 {original.sourceRevision}。</p>
      </div>
    </details>
  );
}

function IChingResults({ result, onReset }: { result: IChingResult; onReset: () => void }) {
  return (
    <section className="iching-results" aria-labelledby="iching-result-title">
      <header className="iching-result-heading"><div><h2 id="iching-result-title" className="brush-iching-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-iching-v4.webp" text="三數取卦" /></h2><p className="iching-structure">本卦・互卦・變卦</p></div><p>動爻為<strong>{result.moving.name}</strong>，{result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。</p></header>
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
  const resultRef = useRef<HTMLDivElement>(null);
  const birthdayRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const ichingRef = useRef<HTMLInputElement>(null);

  function currentRef(targetMode = mode) {
    return targetMode === "birthday" ? birthdayRef : targetMode === "code" ? codeRef : ichingRef;
  }

  function focusCurrentInput() { window.setTimeout(() => currentRef().current?.focus(), 0); }

  function changeMode(nextMode: AnalysisMode) {
    setMode(nextMode); setResult(null); setMessage("");
    window.setTimeout(() => currentRef(nextMode).current?.focus(), 0);
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
      const nextResult = mode === "birthday"
        ? analyzeBirthday(birthday, new Date().getFullYear(), localDateString())
        : mode === "code" ? analyzeDigitCode(numberCode) : calculateIChing(ichingValues);
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

  const hasValue = mode === "birthday" ? Boolean(birthday) : mode === "code" ? Boolean(numberCode) : ichingValues.some(Boolean);

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="主要導覽">
        <a className="wordmark" href="#top"><span aria-hidden="true"><i>命</i></span><strong><BrushTitle src="/visuals/brush/brand-life-code-v4.webp" text="e世代生命密碼" className="brush-brand" /></strong></a>
        <div><a href="#analyzer">開始分析</a><a href="#method-source">規則來源</a></div>
      </nav>

      <header className="hero" id="top">
        <h1 className="sr-only">看見你的數字軌跡</h1>
        <img className="hero-art" src="/visuals/hero-brush-title-b-v3.webp" alt="金墨毛筆字寫著看見你的數字軌跡，右側為古金曆法星軌" />
        <div className="hero-rail"><p><strong><BrushTitle src="/visuals/brush/theme-xuanxing-v4.webp" text="玄星觀象" className="brush-theme" /></strong><span>生日命碼為主要分析</span></p><p>固定規則・完整算式・所有資料只在本機處理</p></div>
      </header>

      <section className="analyzer-section" id="analyzer" aria-labelledby="analyzer-title">
        <form className="analyzer-card" onSubmit={handleAnalyze} noValidate>
          <fieldset className="mode-switch">
            <legend className="sr-only">分析模式</legend>
            {(Object.keys(modeContent) as AnalysisMode[]).map((key) => (
              <label className={mode === key ? "is-active" : ""} key={key}>
                <input type="radio" name="analysis-mode" value={key} checked={mode === key} onChange={() => changeMode(key)} />
                <span><strong><BrushTitle src={modeContent[key].titleArt} text={modeContent[key].label} className="brush-mode" /><em>{modeContent[key].badge}</em></strong><small>{modeContent[key].description}</small></span>
              </label>
            ))}
          </fieldset>

          <div className="mode-workbench">
            <figure className="mode-art"><img src={modeContent[mode].art} alt={modeContent[mode].artAlt} /><figcaption><p className="section-index">當前分析模式</p><h2 id="analyzer-title" className="brush-heading current-mode-heading"><BrushTitle src={modeContent[mode].titleArt} text={modeContent[mode].label} /></h2><span>{modeContent[mode].description}</span></figcaption></figure>
            <div className="mode-controls">
              <div className="input-panel">
                {mode === "birthday" && <label className="field-block" htmlFor="birthday-input"><span>出生日期（西元）</span><input ref={birthdayRef} id="birthday-input" type="date" autoComplete="bday" max={localDateString()} value={birthday} onChange={(event) => { setBirthday(event.target.value); setMessage(""); }} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>}
                {mode === "code" && <label className="field-block" htmlFor="number-code"><span>手機末碼、門牌或自訂數字</span><input ref={codeRef} id="number-code" type="text" inputMode="numeric" autoComplete="off" maxLength={60} value={numberCode} onChange={(event) => { setNumberCode(event.target.value); setMessage(""); }} placeholder="例如：１２ 34-5678" aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>}
                {mode === "iching" && <div className="triple-input-grid">{[["第一個整數", "取上卦・除以 8"], ["第二個整數", "取下卦・除以 8"], ["第三個整數", "取動爻・除以 6"]].map(([label, help], index) => <label className="field-block" key={label}><span>{label}<small>{help}</small></span><input ref={index === 0 ? ichingRef : undefined} type="text" inputMode="numeric" autoComplete="off" value={ichingValues[index]} onChange={(event) => { setIChingValues((values) => values.map((value, valueIndex) => valueIndex === index ? event.target.value : value)); setMessage(""); }} placeholder={`例如：${[9, 13, 20][index]}`} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" /></label>)}</div>}
              </div>

              <div className="form-meta"><p id="input-help">{modeContent[mode].help}</p>{hasValue && <button type="button" className="text-button" onClick={handleReset}>清除輸入</button>}</div>
              <p id="input-message" className="form-message" role="alert" aria-live="polite">{message}</p>
              <button type="submit" className="primary-button analyze-submit">{modeContent[mode].button}<span aria-hidden="true">↘</span></button>
            </div>
          </div>
          <ul className="method-strip" aria-label="分析承諾"><li>固定規則</li><li>顯示完整算式</li><li>資料不上傳</li></ul>
        </form>
      </section>

      <div ref={resultRef} className="result-anchor">{result?.kind === "iching" ? <IChingResults result={result} onReset={handleReset} /> : result && <NumerologyResults result={result} onReset={handleReset} />}</div>

      <section className="method-source" id="method-source" aria-labelledby="method-source-title">
        <details>
          <summary><span>固定規則</span><strong id="method-source-title"><BrushTitle src="/visuals/brush/title-rules-v4.webp" text="規則與來源" className="brush-rules" /></strong><small>可展開核對</small></summary>
          <div className="method-source-body"><div className="method-grid"><article><span>生日命碼</span><p>月、日、年分段化簡。生命路徑與生日核心保留 11、22、33；態度數及個人流年化簡至 1 到 9。</p></article><article><span>數字頻譜</span><p>只做逐位加總、核心數與出現次數。九宮採洛書版位作視覺排列，不宣稱為古法命盤。</p></article><article><span>三數取卦</span><p>第一數取上卦、第二數取下卦、第三數取動爻。它是獨立補充工具，不會由生日自動起卦。</p></article></div>
          <div className="data-source" id="data-source"><div><h2>方法與本文來源</h2><p>網站只保存固定規則與古籍本文，不產生 AI 解卦或吉凶判斷。</p></div><p><a href="https://www.worldnumerology.com/numerology-life-path/" target="_blank" rel="noreferrer">生命路徑計算</a><a href="https://zh.wikisource.org/zh/周易" target="_blank" rel="noreferrer">維基文庫《周易》</a><a href="https://zh.wikisource.org/zh-hant/梅花易數/卷一" target="_blank" rel="noreferrer">《梅花易數》卷一</a><a href="https://www.eee-learning.com/article/6506" target="_blank" rel="noreferrer">三數取卦說明</a></p></div></div>
        </details>
      </section>

      <section className="disclaimer" aria-labelledby="disclaimer-title"><span aria-hidden="true">※</span><div><h2 id="disclaimer-title">使用提醒</h2><p>本工具屬文化娛樂與自我反思用途，不是科學人格測驗、命運預測、醫療診斷、心理評估或專業建議，也不應作為健康、財務、法律、工作或人事決策依據。</p></div></section>
      <footer><p>© {new Date().getFullYear()} e世代生命密碼</p><p>同一網址，自動適配手機與電腦</p></footer>
    </main>
  );
}
