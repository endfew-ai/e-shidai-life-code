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

type AnalysisMode = "birthday" | "code" | "iching";
type BirthdayResult = ReturnType<typeof analyzeBirthday>;
type CodeResult = ReturnType<typeof analyzeDigitCode>;
type IChingResult = ReturnType<typeof calculateIChing>;
type NumerologyResult = BirthdayResult | CodeResult;

const modeContent = {
  birthday: {
    label: "生日命碼",
    description: "生命路徑、生日數、態度數與個人流年",
    button: "分析生日數理",
  },
  code: {
    label: "數字頻譜",
    description: "任意號碼的加總、核心數與數字分布",
    button: "分析數字符碼",
  },
  iching: {
    label: "三數取卦",
    description: "固定卦表推算本卦、互卦、動爻與變卦",
    button: "開始三數取卦",
  },
} as const;

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
  const title = result.kind === "birthday"
    ? "生日數字九宮分布"
    : "自訂數字九宮分布";

  return (
    <article className="calculation-card digit-distribution">
      <div className="panel-heading">
        <div>
          <p className="card-label">DIGIT MAP</p>
          <h3>{title}</h3>
        </div>
        <span className="zero-count">0 出現 {result.zeroCount} 次</span>
      </div>
      <p className="panel-copy">採洛書 4・9・2／3・5・7／8・1・6 版位呈現出現次數；這是現代數字視覺化，不宣稱為古法命盤。</p>
      <div className="lo-shu-grid" aria-label="一到九數字出現次數">
        {LO_SHU_ORDER.map((digit) => {
          const count = result.counts[digit];
          return (
            <div className={`digit-cell ${count ? "is-present" : "is-missing"}`} key={digit}>
              <strong>{digit}</strong>
              <span>{count ? `${count} 次` : "未出現"}</span>
              <i style={{ "--count": Math.min(count, 4) } as React.CSSProperties} aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <p className="missing-summary">
        {result.missing.length ? `未出現：${result.missing.join("、")}` : "1～9 都有出現"}
      </p>
    </article>
  );
}

function CalculationDetails({ result }: { result: NumerologyResult }) {
  return (
    <article className="calculation-card">
      <div className="panel-heading">
        <div>
          <p className="card-label">CALCULATION TRACE</p>
          <h3>這個結果怎麼算</h3>
        </div>
        <span className="verified-badge">可逐步核對</span>
      </div>
      <ol className="calculation-list">
        {result.calculations.map((calculation) => (
          <li key={calculation.label}>
            <span>{calculation.label}</span>
            <code>{calculation.text}</code>
          </li>
        ))}
      </ol>
      {result.kind === "birthday" && (
        <div className="year-cycle" aria-label="三年個人流年">
          {result.cycles.map((cycle) => (
            <div className={cycle.year === result.personalYear.year ? "is-current" : ""} key={cycle.year}>
              <span>{cycle.year}</span>
              <strong>{cycle.value}</strong>
              <small>{cycle.year === result.personalYear.year ? "今年" : "流年"}</small>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function NumerologyResults({ result, onReset }: { result: NumerologyResult; onReset: () => void }) {
  const profile = profiles[result.profileNumber];
  const birthdayMetrics = result.kind === "birthday"
    ? [
        { label: "生命路徑數", value: result.lifePath.display, note: "月、日、年分段化簡" },
        { label: "生日數", value: result.birthday.display, note: "保留原日期與基底" },
        { label: "態度數", value: String(result.attitude.value), note: "出生月＋出生日" },
        { label: `${result.personalYear.year} 個人流年`, value: String(result.personalYear.value), note: "採 1～12 月曆年制" },
      ]
    : [
        { label: "數字位數", value: String(result.length), note: "只計入實際數字" },
        { label: "逐位總和", value: String(result.sum), note: "尚未收斂的原始總和" },
        { label: "核心數", value: String(result.core), note: "逐位加總至 1～9" },
        {
          label: "最常出現",
          value: result.strongest.join("、"),
          note: result.strongest.length > 1 ? "並列最高次數" : "出現次數最高",
        },
      ];

  return (
    <section
      className="results"
      aria-labelledby="result-title"
      style={{ "--profile-color": profile.hex } as React.CSSProperties}
    >
      <div className="result-hero">
        <div className="number-orbit"><span>{result.headlineValue}</span></div>
        <div className="result-heading">
          <p className="section-kicker">{result.kind === "birthday" ? "生命路徑基底原型" : "數字符碼核心原型"}</p>
          <h2 id="result-title" tabIndex={-1}>{profile.title}</h2>
          <p>{profile.symbol} · 作為自我提問參考</p>
        </div>
        <div className="energy-color">
          <span style={{ backgroundColor: profile.hex }} aria-hidden="true" />
          <div><small>視覺識別色</small><strong>{profile.color}</strong></div>
        </div>
      </div>

      <div className="metric-grid">
        {birthdayMetrics.map((metric) => <MetricCard {...metric} key={metric.label} />)}
      </div>

      {result.kind === "birthday" && result.lifePath.isMaster && (
        <div className="master-note" role="note">
          <strong>主數 {result.lifePath.value}／基底 {result.lifePath.base}</strong>
          <p>{masterThemes[result.lifePath.value as 11 | 22 | 33]}</p>
        </div>
      )}

      <div className="result-overview">
        <CalculationDetails result={result} />
        <DigitDistribution result={result} />
      </div>

      <div className="insight-grid">
        <article className="insight-card ai-module-card core-module" style={{ "--module-image": "url('/ai-modules/core-orbit.webp')" } as React.CSSProperties}>
          <span className="card-index">A</span><p className="card-label">CORE PATTERN</p>
          <h3>核心傾向</h3><p>{profile.traits}</p>
        </article>
        <article className="insight-card ai-module-card shadow-card shadow-module" style={{ "--module-image": "url('/ai-modules/shadow-prism.webp')" } as React.CSSProperties}>
          <span className="card-index">B</span><p className="card-label">BLIND SPOT</p>
          <h3>壓力提醒</h3><p>{profile.shadow}</p>
        </article>
        <article className="insight-card ai-module-card wellbeing-module" style={{ "--module-image": "url('/ai-modules/wellbeing-flow.webp')" } as React.CSSProperties}>
          <span className="card-index">C</span><p className="card-label">WELLBEING</p>
          <h3>日常照顧提示</h3><p>{profile.wellbeing}</p>
        </article>
        <article className="insight-card ai-module-card language-card language-module" style={{ "--module-image": "url('/ai-modules/language-signal.webp')" } as React.CSSProperties}>
          <span className="card-index">D</span><p className="card-label">LANGUAGE MARKER</p>
          <h3>溝通提醒</h3><blockquote>「{profile.marker}」</blockquote><p>{profile.markerDesc}</p>
        </article>
      </div>

      <article className="advice-card">
        <div className="advice-symbol" aria-hidden="true">策</div>
        <div><p className="section-kicker">本次自我提問</p><h3>讓洞察成為下一步</h3><p>{profile.advice}</p></div>
      </article>

      <div className="result-actions">
        <button type="button" className="secondary-button" onClick={onReset}>重新分析另一筆資料</button>
      </div>
    </section>
  );
}

function HexagramLines({ lines, movingIndex = -1, mark = "" }: { lines: number[]; movingIndex?: number; mark?: string }) {
  return (
    <div className="hexagram-lines" aria-label="六爻卦象，畫面由上爻排列至初爻">
      {[5, 4, 3, 2, 1, 0].map((index) => (
        <div className={`line-row ${index === movingIndex ? "is-moving" : ""}`} key={index}>
          <span className="line-name">{lineNames[index]}</span>
          <span className={`yao ${lines[index] === 1 ? "yang" : "yin"}`} aria-label={lines[index] === 1 ? "陽爻" : "陰爻"}>
            <i />{lines[index] === 0 && <i />}
          </span>
          <strong>{index === movingIndex ? mark : ""}</strong>
        </div>
      ))}
    </div>
  );
}

function HexagramCard({
  label,
  value,
  movingIndex,
  mark,
}: {
  label: string;
  value: IChingResult["original"];
  movingIndex?: number;
  mark?: string;
}) {
  return (
    <article className="hexagram-card">
      <div className="hexagram-card-head">
        <div><p>{label}</p><h3><span>{value.hexId}</span>{value.name}</h3></div>
        <div className="trigram-pair" aria-label={`上${value.upper.name}下${value.lower.name}`}>
          <span>{value.upper.symbol}</span><span>{value.lower.symbol}</span>
        </div>
      </div>
      <p className="hexagram-meta">上{value.upper.name}（{value.upper.nature}）・下{value.lower.name}（{value.lower.nature}）</p>
      <HexagramLines lines={value.lines} movingIndex={movingIndex} mark={mark} />
    </article>
  );
}

function IChingResults({ result, onReset }: { result: IChingResult; onReset: () => void }) {
  return (
    <section className="iching-results" aria-labelledby="iching-result-title">
      <div className="iching-result-heading">
        <div><p className="section-kicker">固定卦表推算結果</p><h2 id="iching-result-title" tabIndex={-1}>本卦・互卦・變卦</h2></div>
        <p>動爻為<strong>{result.moving.name}</strong>，{result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。</p>
      </div>
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
      <p className="iching-boundary">本模式採現代三數先天數法，與生日命碼完全分開；只做固定卦象計算，不提供吉凶或決策建議。</p>
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

  function focusCurrentInput() {
    const ref = mode === "birthday" ? birthdayRef : mode === "code" ? codeRef : ichingRef;
    window.setTimeout(() => ref.current?.focus(), 0);
  }

  function changeMode(nextMode: AnalysisMode) {
    setMode(nextMode);
    setResult(null);
    setMessage("");
    window.setTimeout(() => {
      const ref = nextMode === "birthday" ? birthdayRef : nextMode === "code" ? codeRef : ichingRef;
      ref.current?.focus();
    }, 0);
  }

  function revealResult() {
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      resultRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    }, 80);
  }

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const currentYear = new Date().getFullYear();
      const nextResult = mode === "birthday"
        ? analyzeBirthday(birthday, currentYear, localDateString())
        : mode === "code"
          ? analyzeDigitCode(numberCode)
          : calculateIChing(ichingValues);
      setMessage("");
      setResult(nextResult);
      revealResult();
    } catch (error) {
      setResult(null);
      setMessage(error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。");
      focusCurrentInput();
    }
  }

  function handleReset() {
    if (mode === "birthday") setBirthday("");
    if (mode === "code") setNumberCode("");
    if (mode === "iching") setIChingValues(["", "", ""]);
    setResult(null);
    setMessage("");
    focusCurrentInput();
  }

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="hero">
        <div className="brand-mark" aria-hidden="true"><span>易</span></div>
        <p className="eyebrow">I CHING · NUMEROLOGY · TRANSPARENT LOGIC</p>
        <h1>e世代<span>生命密碼</span>分析儀</h1>
        <p className="hero-copy">三種資料、三套獨立規則。每一步都能核對，不把生日、號碼與易經混成同一種答案。</p>
        <div className="hero-note" role="note"><span className="note-dot" aria-hidden="true" />所有計算只在你的瀏覽器內完成，不儲存、不傳送輸入內容。</div>
      </header>

      <section className="analyzer-card" aria-labelledby="analyzer-title">
        <div className="analyzer-heading">
          <div><p className="section-kicker">選擇分析方式</p><h2 id="analyzer-title">先確認你要分析哪一種資料</h2></div>
          <span className="step-badge">01</span>
        </div>

        <form onSubmit={handleAnalyze} noValidate>
          <fieldset className="mode-switch">
            <legend className="sr-only">分析模式</legend>
            {(Object.keys(modeContent) as AnalysisMode[]).map((key) => (
              <label className={mode === key ? "is-active" : ""} key={key}>
                <input type="radio" name="analysis-mode" value={key} checked={mode === key} onChange={() => changeMode(key)} />
                <span><strong>{modeContent[key].label}</strong><small>{modeContent[key].description}</small></span>
              </label>
            ))}
          </fieldset>

          <div className="mode-panel">
            {mode === "birthday" && (
              <label className="field-block" htmlFor="birthday-input">
                <span>出生日期（西元）</span>
                <input ref={birthdayRef} id="birthday-input" type="date" autoComplete="bday" value={birthday} onChange={(event) => setBirthday(event.target.value)} aria-invalid={Boolean(message)} aria-describedby="input-help input-message" />
              </label>
            )}
            {mode === "code" && (
              <label className="field-block" htmlFor="number-code">
                <span>手機末碼、門牌或自訂數字</span>
                <input ref={codeRef} id="number-code" type="text" inputMode="numeric" autoComplete="off" maxLength={60} value={numberCode} onChange={(event) => setNumberCode(event.target.value)} placeholder="例如：１２ 34-5678" aria-invalid={Boolean(message)} aria-describedby="input-help input-message" />
              </label>
            )}
            {mode === "iching" && (
              <div className="triple-input-grid">
                {[
                  ["第一個整數", "取上卦・除以 8"],
                  ["第二個整數", "取下卦・除以 8"],
                  ["第三個整數", "取動爻・除以 6"],
                ].map(([label, help], index) => (
                  <label className="field-block" key={label}>
                    <span>{label}<small>{help}</small></span>
                    <input ref={index === 0 ? ichingRef : undefined} type="text" inputMode="numeric" autoComplete="off" value={ichingValues[index]} onChange={(event) => setIChingValues((values) => values.map((value, valueIndex) => valueIndex === index ? event.target.value : value))} placeholder={`例如：${[9, 13, 20][index]}`} aria-invalid={Boolean(message)} />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="form-meta">
            <p id="input-help">
              {mode === "birthday" && "只需生日，不需姓名、時辰或身分證字號。"}
              {mode === "code" && "接受半形／全形數字、空白與連字號；請勿輸入完整身分證、金融帳號等敏感資料。"}
              {mode === "iching" && "三個整數各自取卦，不會把生日或一串號碼自動切段。"}
            </p>
            {(mode === "birthday" ? Boolean(birthday) : mode === "code" ? Boolean(numberCode) : ichingValues.some(Boolean)) && <button type="button" className="text-button" onClick={handleReset}>清除</button>}
          </div>
          <p id="input-message" className="form-message" role="alert" aria-live="polite">{message}</p>
          <button type="submit" className="primary-button analyze-submit">{modeContent[mode].button}<span aria-hidden="true">→</span></button>
        </form>

        <ol className="method-strip" aria-label="分析流程">
          <li><span>1</span>辨識資料類型</li><li><span>2</span>套用固定規則</li><li><span>3</span>顯示完整算式</li><li><span>4</span>對照結果</li>
        </ol>
      </section>

      <div ref={resultRef} className="result-anchor">
        {result?.kind === "iching"
          ? <IChingResults result={result} onReset={handleReset} />
          : result && <NumerologyResults result={result} onReset={handleReset} />}
      </div>

      <section className="method-source" aria-labelledby="method-source-title">
        <details>
          <summary id="method-source-title">方法來源與採用範圍</summary>
          <div>
            <p>生日命碼固定採西方數字命理的月、日、年分段化簡規則；生命路徑與生日核心保留 11、22、33，態度數及個人流年一律化簡至 1～9。</p>
            <p>九宮只用來呈現 1～9 出現次數。傳統年月日時起卦需要農曆與時辰，本網站不會拿西元生日直接假造傳統卦象；三數取卦另列為獨立的現代先天數法。</p>
            <p className="source-links"><a href="https://www.worldnumerology.com/numerology-life-path/" target="_blank" rel="noreferrer">生命路徑計算來源</a><a href="https://zh.wikisource.org/zh-hant/梅花易數/卷一" target="_blank" rel="noreferrer">《梅花易數》原文</a><a href="https://www.eee-learning.com/article/6506" target="_blank" rel="noreferrer">三數取卦流派說明</a></p>
          </div>
        </details>
      </section>

      <section className="disclaimer" aria-labelledby="disclaimer-title">
        <span aria-hidden="true">※</span>
        <div><h2 id="disclaimer-title">使用提醒</h2><p>本工具內容屬文化娛樂與自我反思用途，不是科學人格測驗、命運預測、醫療診斷、心理評估或專業建議，也不應作為健康、財務、法律、工作或人事決策依據。</p></div>
      </section>

      <footer><p>© {new Date().getFullYear()} e世代生命密碼研究中心</p><p>固定規則 × 可核對算式 × 本機隱私</p></footer>
    </main>
  );
}
