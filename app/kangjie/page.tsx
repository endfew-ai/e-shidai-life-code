/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getIChingText, type IChingLineText } from "../../iching-text.js";
import { lineNames } from "../../calculator-core.js";
import {
  calculateCalendarHexagram,
  calculateChiCunHexagram,
  calculateDoubleSoundHexagram,
  calculateHuangjiPosition,
  calculateLongTextHexagram,
  calculateObjectHexagram,
  calculatePosteriorHexagram,
  calculateSingleSoundHexagram,
  calculateStrokeHexagram,
  calculateSurnameAdditionHexagram,
  calculateTextHexagram,
  calculateZhangChiHexagram,
  countHanCharacters,
  decomposeHuangjiYears,
  detectCurrentCalendarParts,
  earthlyBranches,
  loadStrokeDataset,
  resolveStrokeText,
  type CurrentCalendarParts,
  type HuangjiAnalysis,
  type HuangjiPositionAnalysis,
  type KangjieAnalysis,
  type StrokeDataset,
  type StrokeEntry,
} from "../../kangjie-core.js";

type PageTab = "origins" | "meihua" | "huangji" | "sources";
type MethodTab = "calendar" | "object" | "sound" | "text" | "supplement";

const fixedBrushTitles: Record<string, string> = {
  "本卦": "/visuals/brush/title-hex-original-v2.webp",
  "互卦": "/visuals/brush/title-hex-mutual-v2.webp",
  "變卦": "/visuals/brush/title-hex-changed-v2.webp",
  "本卦原文節錄": "/visuals/brush/title-kangjie-classic-v2.webp",
  "卦辭": "/visuals/brush/title-judgment-v2.webp",
  "象曰": "/visuals/brush/title-image-saying-v2.webp",
  "動爻原文": "/visuals/brush/title-moving-line-v2.webp",
  "變卦本文": "/visuals/brush/title-changed-text-v2.webp",
};

const methodTitleAssets: Record<MethodTab, { label: string; tabArt: string; formLabel: string; formArt: string }> = {
  calendar: { label: "年月日時", tabArt: "/visuals/brush/title-kangjie-method-calendar-v2.webp", formLabel: "年月日時起例", formArt: "/visuals/brush/title-kangjie-form-calendar-v2.webp" },
  object: { label: "物數", tabArt: "/visuals/brush/title-kangjie-method-object-v2.webp", formLabel: "物數起例", formArt: "/visuals/brush/title-kangjie-form-object-v2.webp" },
  sound: { label: "聲音", tabArt: "/visuals/brush/title-kangjie-method-sound-v2.webp", formLabel: "聲音起卦", formArt: "/visuals/brush/title-kangjie-form-sound-v2.webp" },
  text: { label: "字占與姓名", tabArt: "/visuals/brush/title-kangjie-method-text-v2.webp", formLabel: "字占與姓名筆畫", formArt: "/visuals/brush/title-kangjie-form-text-v2.webp" },
  supplement: { label: "古例補充", tabArt: "/visuals/brush/title-kangjie-origin-boundaries-v2.webp", formLabel: "丈尺尺寸與後天端法", formArt: "/visuals/brush/title-kangjie-origin-boundaries-v2.webp" },
};

function BrushTitle({ src, text, className = "" }: { src: string; text: string; className?: string }) {
  return <span className={`brush-title ${className}`.trim()}><span className="sr-only">{text}</span><img className="brush-title-image" src={src} alt="" aria-hidden="true" /></span>;
}

function FixedBrushTitle({ text, className = "" }: { text: string; className?: string }) {
  const src = fixedBrushTitles[text];
  if (!src) throw new Error(`缺少固定毛筆標題資產：${text}`);
  return <BrushTitle src={src} text={text} className={className} />;
}

function BranchSelect({ name, label, defaultValue = "" }: { name: string; label: string; defaultValue?: string | number }) {
  return <label className="field-block"><span>{label}<small>{label === "時支" ? "自動偵測，可手動選" : "子 1 至亥 12"}</small></span><select name={name} required defaultValue={defaultValue}><option value="">請選{label}</option>{earthlyBranches.map((item) => <option value={item.value} key={item.value}>{item.name}・{item.value}</option>)}</select></label>;
}

function writeDetectedFields(form: HTMLFormElement | null, detected: CurrentCalendarParts) {
  if (!form) return;
  const fields = {
    yearBranch: detected.yearBranch,
    lunarMonth: detected.lunarMonth,
    lunarDay: detected.lunarDay,
    hourBranch: detected.hourBranch,
  };
  for (const [name, value] of Object.entries(fields)) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = String(value);
  }
}

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === "0000") { onUnlock(); return; }
    setMessage("密碼不正確，請重新輸入四位數字。");
    inputRef.current?.select();
  }

  return <section className="access-gate" aria-labelledby="access-gate-title"><img className="access-gate-art" src="/visuals/hero-celestial-background-v4.webp" alt="" aria-hidden="true" /><div className="access-gate-card"><span className="access-gate-index">PRIVATE ACCESS・專頁存取</span><h1 id="access-gate-title"><BrushTitle src="/visuals/brush/title-kangjie-entry-v1.webp" text="邵康節易學" className="brush-access-gate" /></h1><p>輸入四位密碼，驗證後進入年月日時與梅花易數衍算。</p><form onSubmit={handleSubmit} noValidate><label htmlFor="kangjie-password-react">存取密碼</label><div><input ref={inputRef} id="kangjie-password-react" name="password" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} pattern="[0-9]{4}" placeholder="輸入 4 位數字" value={password} onChange={(event) => { setPassword(event.target.value.replace(/\D/g, "").slice(0, 4)); setMessage(""); }} required /><button type="submit">驗證後進入</button></div><p data-access-message role="alert" aria-live="polite">{message}</p></form><Link href="/">返回首頁</Link></div></section>;
}

function HexagramLines({ lines, texts, movingIndex = -1, mark = "" }: { lines: number[]; texts: IChingLineText[]; movingIndex?: number; mark?: string }) {
  return <div className="hexagram-lines" aria-label="六爻卦象與爻辭，畫面由上爻排列至初爻">{[5, 4, 3, 2, 1, 0].map((index) => <div className={`line-row${index === movingIndex ? " is-moving" : ""}`} key={index}><span className="line-position">{lineNames[index]}</span><span className={`yao ${lines[index] === 1 ? "yang" : "yin"}`} aria-label={lines[index] === 1 ? "陽爻" : "陰爻"}><i />{lines[index] === 0 && <i />}</span><strong className="line-change-mark">{index === movingIndex ? mark : ""}</strong><span className="line-text">{texts[index].text}</span></div>)}</div>;
}

function HexagramCard({ label, value, movingIndex, mark, note = "" }: { label: string; value: KangjieAnalysis["original"]; movingIndex?: number; mark?: string; note?: string }) {
  const text = getIChingText(value.hexId);
  return <article className="hexagram-card"><header><div><h3 className="hexagram-role-title brush-fixed-heading"><FixedBrushTitle text={label} className="brush-hexagram-role" /></h3><p className="hexagram-computed-name"><span>{text.symbol}</span>{value.name}</p>{note && <small className="hexagram-role-note">{note}</small>}</div><small>第 {value.hexId} 卦</small></header><p className="hexagram-structure">上{value.upper.name}（{value.upper.nature}）・下{value.lower.name}（{value.lower.nature}）</p><p className="hexagram-judgment"><strong>卦辭</strong><span>{text.name}，{text.judgment}</span></p><HexagramLines lines={value.lines} texts={text.lines} movingIndex={movingIndex} mark={mark} /></article>;
}

function YaoLegend() {
  return <div className="yao-legend" aria-label="卦爻顏色圖例"><span className="is-yang"><i aria-hidden="true" />陽爻</span><span className="is-yin"><i aria-hidden="true" />陰爻</span></div>;
}

function KangjieResult({ result }: { result: KangjieAnalysis }) {
  const original = getIChingText(result.original.hexId);
  const transformed = getIChingText(result.transformed.hexId);
  const movingLine = original.lines[result.moving.index];
  return <section className="kangjie-calculation-result" aria-labelledby="react-kangjie-result-title">
    <header className="kangjie-result-heading"><div><p className="section-index">{result.methodLabel}</p><h2 id="react-kangjie-result-title" tabIndex={-1}><BrushTitle src="/visuals/brush/title-kangjie-result-v1.webp" text="衍算結果" className="brush-kangjie-result" /></h2><p className="result-input-summary">{result.inputSummary}</p></div><div className="result-heading-meta"><p className="moving-summary">動爻為<strong>{result.moving.name}</strong>，{result.moving.oldValue === 1 ? "陽爻變陰爻" : "陰爻變陽爻"}。</p><YaoLegend /></div></header>
    <div className="hexagram-grid"><HexagramCard label="本卦" value={result.original} movingIndex={result.moving.index} mark="動" /><HexagramCard label="互卦" value={result.mutual} note={result.mutualSource === "transformed" ? "取自變卦" : ""} /><HexagramCard label="變卦" value={result.transformed} movingIndex={result.moving.index} mark="變" /></div>
    <div className="kangjie-trace">{result.trace.map((item) => <div key={item.label}><span>{item.label}</span><code>{item.equation}</code></div>)}</div>
    <div className="body-use-ledger"><article><span>體卦</span><strong>{result.roles.body.symbol} {result.roles.body.name}</strong><small>{result.roles.body.nature}・{result.roles.body.element}</small></article><article><span>用卦</span><strong>{result.roles.use.symbol} {result.roles.use.name}</strong><small>{result.roles.use.nature}・{result.roles.use.element}</small></article><article><span>五行關係</span><strong>{result.fiveElements.label}</strong><small>{result.fiveElements.explanation}</small></article><p>{result.roles.note}</p></div>
    <details className="calculation-audit"><summary><strong>完整演算明細</strong><span>{result.profileLabel}・{result.algorithmVersion}</span></summary><div className="calculation-audit-body"><div className="calculation-input-grid"><article><span>原始輸入</span><pre>{JSON.stringify(result.calculationTrace.originalInput, null, 2)}</pre></article><article><span>正規化輸入</span><pre>{JSON.stringify(result.calculationTrace.normalizedInput, null, 2)}</pre></article></div><ul className="calculation-warning-list">{result.calculationTrace.warnings.map((warning) => <li key={warning}>{warning}</li>)}{result.calculationTrace.assumptions.map((assumption) => <li key={assumption}>採用設定：{assumption}</li>)}</ul><div className="calculation-source-list">{result.sourceRefs.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><strong>{source.title}</strong><span>{source.organization}・{source.id}</span></a>)}</div></div></details>
    <p className="iching-boundary">此處只依固定規則呈現卦象結構、體用位置與原文節錄，不產生事件預測或決策建議。除以 6 整除時歸上爻，是為完整表示六爻範圍採用的實作判定。</p>
    <details className="kangjie-classic-excerpt"><summary><strong><FixedBrushTitle text="本卦原文節錄" className="brush-kangjie-classic" /></strong><span>卦辭・象曰・動爻</span></summary><div><article><h4 className="brush-fixed-heading"><FixedBrushTitle text="卦辭" className="brush-classic-label" /></h4><p className="classic-computed-label">{original.symbol} {original.name}</p><p>{original.judgment}</p></article><article><h4 className="brush-fixed-heading"><FixedBrushTitle text="象曰" className="brush-classic-label" /></h4><p>{original.image}</p></article><article className="is-moving-copy"><h4 className="brush-fixed-heading"><FixedBrushTitle text="動爻原文" className="brush-classic-label brush-moving-line" /></h4><p className="classic-computed-label">{result.moving.name}・{movingLine.text}</p><p>《象》曰：{movingLine.image}</p></article><article><h4 className="brush-fixed-heading"><FixedBrushTitle text="變卦本文" className="brush-classic-label brush-changed-text" /></h4><p className="classic-computed-label">{transformed.symbol} {transformed.name}</p><p>{transformed.judgment}</p></article><p className="classic-source">內嵌本文來源：<a href="https://zh.wikisource.org/zh/周易" target="_blank" rel="noreferrer">維基文庫《周易》</a>。中國哲學書電子化計劃另作交叉核對；只列原文，不作吉凶解讀。</p></div></details>
  </section>;
}

function PageHeading({ index, src, title, children, source = false }: { index: string; src: string; title: string; children: React.ReactNode; source?: boolean }) {
  return <header className="kangjie-panel-heading"><div><p className="section-index">{index}</p><h2><BrushTitle src={src} text={title} className={`brush-kangjie-section${source ? " brush-kangjie-source" : ""}`} /></h2></div><p>{children}</p></header>;
}

export default function KangjiePage() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [pageTab, setPageTab] = useState<PageTab>("origins");
  const [method, setMethod] = useState<MethodTab>("calendar");
  const [calculationProfile, setCalculationProfile] = useState("classic-primary-v1");
  const [customMutualSource, setCustomMutualSource] = useState<"original" | "transformed">("original");
  const [customSizeIncludesHour, setCustomSizeIncludesHour] = useState(true);
  const [customTextFourToTen, setCustomTextFourToTen] = useState<"tone" | "strokes">("tone");
  const [soundMode, setSoundMode] = useState<"segmented" | "single">("segmented");
  const [textMode, setTextMode] = useState<"long" | "classic" | "strokes" | "surname">("long");
  const [textValue, setTextValue] = useState("");
  const [strokeEntries, setStrokeEntries] = useState<StrokeEntry[]>([]);
  const [strokeLoading, setStrokeLoading] = useState(false);
  const [supplementType, setSupplementType] = useState("zhang-chi");
  const [huangjiMode, setHuangjiMode] = useState<"duration" | "position">("duration");
  const [result, setResult] = useState<KangjieAnalysis | null>(null);
  const [huangji, setHuangji] = useState<HuangjiAnalysis | HuangjiPositionAnalysis | null>(null);
  const [message, setMessage] = useState("");
  const [textCount, setTextCount] = useState(0);
  const [currentTime, setCurrentTime] = useState<CurrentCalendarParts | null>(null);
  const [currentTimeError, setCurrentTimeError] = useState("");
  const [calendarProfile, setCalendarProfile] = useState("taipei-lunar-new-year-v1");
  const [calendarTimeZone, setCalendarTimeZone] = useState("Asia/Taipei");
  const [manualTimeOverride, setManualTimeOverride] = useState(false);
  const [manualTimeValues, setManualTimeValues] = useState<Record<string, string>>({});
  const resultRef = useRef<HTMLDivElement>(null);
  const huangjiRef = useRef<HTMLDivElement>(null);
  const meihuaFormRef = useRef<HTMLFormElement>(null);
  const protectedContentRef = useRef<HTMLElement>(null);
  const manualTimeOverrideRef = useRef(false);
  const focusAfterUnlockRef = useRef(false);
  const strokeDatasetRef = useRef<StrokeDataset | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setAccessGranted(sessionStorage.getItem("kangjie-access-v1") === "granted"); } catch { setAccessGranted(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("kangjie-locked", !accessGranted);
    document.documentElement.classList.toggle("kangjie-unlocked", accessGranted);
    return () => { document.documentElement.classList.remove("kangjie-locked", "kangjie-unlocked"); };
  }, [accessGranted]);

  useEffect(() => {
    if (!accessGranted || !focusAfterUnlockRef.current) return;
    const timer = window.setTimeout(() => {
      protectedContentRef.current?.querySelector<HTMLElement>("a, button")?.focus();
      focusAfterUnlockRef.current = false;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accessGranted]);

  useEffect(() => {
    function refreshCurrentTime() {
      try {
        const detected = detectCurrentCalendarParts(new Date(), {
          profile: calendarProfile,
          timeZone: calendarTimeZone || undefined,
        });
        setCurrentTime(detected);
        setCurrentTimeError("");
        if (!manualTimeOverrideRef.current) writeDetectedFields(meihuaFormRef.current, detected);
      } catch (error) {
        setCurrentTimeError(error instanceof Error ? error.message : "請手動輸入年月日時。");
      }
    }
    function handleVisibility() { if (document.visibilityState === "visible") refreshCurrentTime(); }
    refreshCurrentTime();
    const interval = window.setInterval(refreshCurrentTime, 1000);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [calendarProfile, calendarTimeZone]);

  useEffect(() => {
    if (currentTime && !manualTimeOverrideRef.current) writeDetectedFields(meihuaFormRef.current, currentTime);
  }, [currentTime, method, pageTab]);

  function reveal(ref: React.RefObject<HTMLDivElement | null>) {
    window.setTimeout(() => { ref.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); ref.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true }); }, 60);
  }

  function changePage(next: PageTab) { setPageTab(next); setMessage(""); }

  function unlockAccess() {
    try { sessionStorage.setItem("kangjie-access-v1", "granted"); } catch { /* 本次頁面仍可解鎖。 */ }
    focusAfterUnlockRef.current = true;
    setAccessGranted(true);
  }

  function handleManualTimeChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (!["yearBranch", "lunarMonth", "lunarDay", "hourBranch"].includes(target.name)) return;
    const wasManual = manualTimeOverrideRef.current;
    const snapshot: Record<string, string> = {};
    if (!wasManual) {
      for (const name of ["yearBranch", "lunarMonth", "lunarDay", "hourBranch"]) {
        const field = event.currentTarget.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) snapshot[name] = field.value;
      }
    }
    setManualTimeValues((previous) => ({ ...(wasManual ? previous : snapshot), [target.name]: target.value }));
    manualTimeOverrideRef.current = true;
    setManualTimeOverride(true);
  }

  function applyCurrentTime() {
    try {
      const detected = detectCurrentCalendarParts(new Date(), {
        profile: calendarProfile,
        timeZone: calendarTimeZone || undefined,
      });
      manualTimeOverrideRef.current = false;
      setManualTimeValues({});
      setManualTimeOverride(false);
      setCurrentTime(detected);
      setCurrentTimeError("");
      writeDetectedFields(meihuaFormRef.current, detected);
    } catch (error) {
      setCurrentTimeError(error instanceof Error ? error.message : "請手動輸入年月日時。");
    }
  }

  async function resolveReactStrokes(text: string) {
    setStrokeLoading(true);
    try {
      if (!strokeDatasetRef.current) strokeDatasetRef.current = await loadStrokeDataset("/data/unihan-kTotalStrokes-17.0.0.json");
      const manualOverrides = strokeEntries.map((entry) => entry.manualOverride ? entry.strokes : undefined);
      const resolution = resolveStrokeText(text, { unihanDataset: strokeDatasetRef.current, manualOverrides, prefer: "unicode" });
      const entries = resolution.entries.filter((entry): entry is StrokeEntry => Boolean(entry));
      setStrokeEntries(entries);
      if (!resolution.ready) throw new Error(`「${resolution.unresolved.map((item) => item.character).join("、")}」查不到筆畫，請逐字手動輸入。`);
      return entries;
    } finally {
      setStrokeLoading(false);
    }
  }

  function changeStroke(index: number, rawValue: string) {
    setStrokeEntries((previous) => previous.map((entry, entryIndex) => entryIndex === index
      ? { ...entry, strokes: rawValue, sourceId: "manual", sourceLabel: "手動輸入", dataVersion: "", manualOverride: true }
      : entry));
  }

  async function handleMeihua(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const activeProfile: string | Record<string, unknown> = calculationProfile === "user-custom-v1"
      ? {
          id: "user-custom-v1",
          label: "使用者自訂",
          description: "由本次畫面選項建立，只影響本次演算。",
          pureHexagramMutual: customMutualSource,
          sizeMovingIncludesHour: customSizeIncludesHour,
          textFourToTen: customTextFourToTen,
        }
      : calculationProfile;
    try {
      let next: KangjieAnalysis;
      if (method === "calendar") {
        next = calculateCalendarHexagram({
          ...values,
          calendarTrace: currentTime
            ? `${currentTime.calendarProfileId}・${currentTime.timeZone}・${currentTime.mode}`
            : "人工輸入",
        }, { profile: activeProfile });
      } else if (method === "object") {
        next = calculateObjectHexagram(values, { profile: activeProfile });
      } else if (method === "sound") {
        if (soundMode === "single" && calculationProfile === "legacy-existing-v1") throw new Error("原程式舊版沒有單一聲數法，請改選古籍主法或今本。");
        next = soundMode === "single"
          ? calculateSingleSoundHexagram(values, { profile: activeProfile })
          : calculateDoubleSoundHexagram(values, { profile: activeProfile });
      } else if (method === "text") {
        if (textMode === "long") {
          next = calculateLongTextHexagram(values.text, { profile: activeProfile });
        } else {
          if (calculationProfile === "legacy-existing-v1") throw new Error("原程式舊版只有 11 字以上字數法，沒有自動筆畫與姓名加數法。");
          const count = countHanCharacters(values.text);
          const customTextUsesStrokes = calculationProfile === "user-custom-v1" && customTextFourToTen === "strokes";
          const needsStrokes = textMode === "strokes"
            || textMode === "surname"
            || (textMode === "classic" && count >= 2 && count <= 3)
            || (textMode === "classic" && customTextUsesStrokes && count >= 4 && count <= 10);
          const entries = needsStrokes ? await resolveReactStrokes(String(values.text || "")) : [];
          if (textMode === "surname") {
            next = calculateSurnameAdditionHexagram({ ...values, name: values.text, strokeEntries: entries }, { profile: activeProfile });
          } else if (textMode === "strokes") {
            next = calculateStrokeHexagram({ ...values, strokeEntries: entries }, { profile: activeProfile });
          } else {
            next = calculateTextHexagram({
              ...values,
              strokeEntries: entries,
              toneValues: String(values.toneValues || "").split(/[,，\s]+/).filter(Boolean),
            }, { profile: activeProfile });
          }
        }
      } else {
        if (calculationProfile === "legacy-existing-v1") throw new Error("原程式舊版沒有古例補充入口，請改選古籍主法、古本異文或今本。");
        next = supplementType === "zhang-chi"
          ? calculateZhangChiHexagram(values, { profile: activeProfile })
          : supplementType === "chi-cun"
            ? calculateChiCunHexagram(calculationProfile === "user-custom-v1"
                ? { ...values, version: customSizeIncludesHour ? "modern-with-hour" : "old-without-hour" }
                : values, { profile: activeProfile })
            : calculatePosteriorHexagram({ ...values, scenario: supplementType }, { profile: activeProfile });
      }
      setMessage(""); setResult(next); reveal(resultRef);
    } catch (error) { setResult(null); setMessage(error instanceof Error ? error.message : "輸入資料無法計算，請重新確認。"); }
  }

  function handleHuangji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { const next = huangjiMode === "position" ? calculateHuangjiPosition(values) : decomposeHuangjiYears(values.years); setMessage(""); setHuangji(next); reveal(huangjiRef); } catch (error) { setHuangji(null); setMessage(error instanceof Error ? error.message : "年數無法分解，請重新確認。"); }
  }

  const pageTabs: Array<[PageTab, string, string, string]> = [["origins", "壹", "原典脈絡", "/visuals/brush/title-kangjie-origins-v1.webp"], ["meihua", "貳", "梅花起卦", "/visuals/brush/title-kangjie-meihua-v1.webp"], ["huangji", "參", "皇極尺度", "/visuals/brush/title-kangjie-huangji-v1.webp"], ["sources", "肆", "原文與來源", "/visuals/brush/title-kangjie-tab-source-v2.webp"]];
  const methodTabs = Object.keys(methodTitleAssets) as MethodTab[];
  const timeDefaultValue = (name: string, detectedValue: number | undefined) => manualTimeOverride ? manualTimeValues[name] ?? detectedValue ?? "" : detectedValue ?? "";
  const currentTimeNote = currentTimeError
    ? "自動偵測失敗，請保留手動輸入並確認裝置日期、時間與瀏覽器支援。"
    : manualTimeOverride
      ? `你已手動修正，欄位不會被時鐘覆蓋；按「重新套用現在」可恢復自動值。${currentTime?.isLeapMonth ? "目前為閏月，月份取值仍需核對。" : "子初換日與年界仍需依採用曆法核對。"}`
      : currentTime?.isLeapMonth
        ? `已自動填入同名月份 ${currentTime.lunarMonth}。目前為閏月，月份取值、子初換日與年界仍需依採用曆法核對。`
        : "已依裝置時間自動填入。子初換日與年界仍需依採用曆法另行核對，也可手動修正。";

  return <>{!accessGranted && <AccessGate onUnlock={unlockAccess} />}<main ref={protectedContentRef} className={`site-shell kangjie-shell${accessGranted ? "" : " is-access-locked"}`} data-protected-content aria-hidden={accessGranted ? undefined : true}>
    <nav className="topbar" aria-label="邵康節專頁導覽"><Link className="wordmark kangjie-wordmark" href="/"><span aria-hidden="true"><i>易</i></span><strong><BrushTitle src="/visuals/brush/title-kangjie-entry-v1.webp" text="邵康節易學" className="brush-brand" /></strong></Link><div><Link href="/">返回首頁</Link><button type="button" className="nav-button" onClick={() => changePage("meihua")}>開始衍算</button><button type="button" className="nav-button" onClick={() => changePage("sources")}>原文來源</button></div></nav>
    <header className="hero kangjie-hero" id="top"><img className="hero-art" src="/visuals/hero-celestial-background-v4.webp" alt="" aria-hidden="true" /><div className="kangjie-hero-copy"><p className="section-index">同網域獨立專頁・固定規則・本機運算</p><h1 className="hero-title kangjie-hero-title"><BrushTitle src="/visuals/brush/title-kangjie-hero-v1.webp" text="象數觀物" className="brush-kangjie-hero" /></h1><p>把現行本所載公式逐步展開。只算卦象結構與時間尺度，不生成吉凶斷語。</p></div><div className="hero-rail kangjie-rail"><p><strong><BrushTitle src="/visuals/brush/theme-kangjie-v1.webp" text="康節觀象" className="brush-kangjie-theme" /></strong><span>相傳邵雍所撰的現行傳本規則</span></p><p>梅花易數・皇極經世・完整算式可核對</p></div></header>
    <section className="kangjie-overview" aria-label="專頁功能摘要"><article><span>01</span><strong><BrushTitle src="/visuals/brush/title-kangjie-overview-entry-v3.webp" text="五種起卦入口" className="brush-kangjie-overview" /></strong><p>年月日時、物數、聲音、字占與古例補充分開演算。</p></article><article><span>02</span><strong><BrushTitle src="/visuals/brush/title-kangjie-overview-layers-v2.webp" text="三層卦象" className="brush-kangjie-overview" /></strong><p>固定呈現本卦、互卦、變卦、動爻、體用與五行。</p></article><article><span>03</span><strong><BrushTitle src="/visuals/brush/title-kangjie-overview-scale-v2.webp" text="五級時間尺度" className="brush-kangjie-overview" /></strong><p>元會運世獨立引擎支援時間拆分與自訂錨點。</p></article></section>
    <section className="kangjie-workspace" id="workspace" aria-label="邵康節易學內容與衍算">
      <div className="kangjie-tabs" role="tablist" aria-label="專頁分頁">{pageTabs.map(([key, number, label, src]) => <button type="button" role="tab" aria-selected={pageTab === key} onClick={() => changePage(key)} key={key}><span className="tab-index">{number}</span><BrushTitle src={src} text={label} className="brush-kangjie-tab" /></button>)}</div>

      {pageTab === "origins" && <section className="kangjie-panel" role="tabpanel"><PageHeading index="傳本與方法邊界" src="/visuals/brush/title-kangjie-origins-v1.webp" title="原典脈絡">本頁依現行本《梅花易數》及《皇極經世書》整理。書目常署宋邵雍撰，也有資料採「相傳」；本頁不宣稱現行傳本全為邵雍親筆。</PageHeading><div className="origin-ledger"><article><span>先天數序</span><h3 className="brush-fixed-heading"><BrushTitle src="/visuals/brush/title-kangjie-origin-sequence-v2.webp" text="乾一至坤八" className="brush-kangjie-card" /></h3><p>乾 1、兌 2、離 3、震 4、巽 5、坎 6、艮 7、坤 8。卦數整除 8 時歸坤。</p></article><article><span>年月日時</span><h3 className="brush-fixed-heading"><BrushTitle src="/visuals/brush/title-kangjie-origin-calendar-v2.webp" text="傳統曆序手動輸入" className="brush-kangjie-card brush-kangjie-card-long" /></h3><p>原典沒有公曆自動換算；本頁只把裝置時間當便利預填，仍保留手動修正。</p></article><article><span>物、聲、字</span><h3 className="brush-fixed-heading"><BrushTitle src="/visuals/brush/title-kangjie-origin-boundaries-v2.webp" text="每個入口各守其法" className="brush-kangjie-card brush-kangjie-card-long" /></h3><p>可數之物、兩段聲數與十一字以上字數法分開，避免把任意號碼冒充通用古法。</p></article><article><span>皇極數制</span><h3 className="brush-fixed-heading"><BrushTitle src="/visuals/brush/title-kangjie-origin-duration-v2.webp" text="只做時間長度分解" className="brush-kangjie-card brush-kangjie-card-long" /></h3><p>一世 30 年、一運 360 年、一會 10,800 年、一元 129,600 年。這是傳統數制，不是科學宇宙週期。</p></article></div><button className="primary-button panel-next" type="button" onClick={() => changePage("meihua")}>進入梅花起卦<span aria-hidden="true">↘</span></button></section>}

      {pageTab === "meihua" && <section className="kangjie-panel" role="tabpanel">
        <PageHeading index="五個獨立入口" src="/visuals/brush/title-kangjie-meihua-v1.webp" title="梅花起卦">請先選方法，再輸入該方法真正需要的數。資料只在目前瀏覽器運算，不上傳。</PageHeading>
        <div className="method-selector" role="tablist" aria-label="梅花起卦方法">{methodTabs.map((key) => <button type="button" role="tab" aria-selected={method === key} onClick={() => { setMethod(key); setResult(null); setMessage(""); }} key={key}><BrushTitle src={methodTitleAssets[key].tabArt} text={methodTitleAssets[key].label} className="brush-kangjie-method" /></button>)}</div>
        <div className="method-forms">
          <label className="field-block profile-selector"><span>演算版本<small>每次結果完整記錄</small></span><select value={calculationProfile} onChange={(event) => setCalculationProfile(event.target.value)}><option value="classic-primary-v1">古籍主法</option><option value="classic-variant-v1">古本異文（未證異法）</option><option value="modern-current-v1">今本</option><option value="legacy-existing-v1">原程式舊版</option><option value="user-custom-v1">使用者自訂</option></select></label>
          {calculationProfile === "user-custom-v1" && <div className="triple-input-grid custom-profile-fields" aria-label="使用者自訂算法設定"><label className="field-block"><span>純乾坤互卦<small>互卦資料來源</small></span><select value={customMutualSource} onChange={(event) => setCustomMutualSource(event.target.value as "original" | "transformed")}><option value="original">由本卦取互卦</option><option value="transformed">由變卦取互卦</option></select></label><label className="field-block"><span>尺寸動爻<small>是否加入時辰</small></span><select value={customSizeIncludesHour ? "yes" : "no"} onChange={(event) => setCustomSizeIncludesHour(event.target.value === "yes")}><option value="yes">加入時辰</option><option value="no">不加時（未證異法）</option></select></label><label className="field-block"><span>四至十字<small>取數方式</small></span><select value={customTextFourToTen} onChange={(event) => setCustomTextFourToTen(event.target.value as "tone" | "strokes")}><option value="tone">人工古代四聲</option><option value="strokes">逐字筆畫分組</option></select></label></div>}
          <form ref={meihuaFormRef} className="kangjie-form" onSubmit={handleMeihua} onChange={handleManualTimeChange} noValidate>
            <div className="form-intro"><div><span>{method === "supplement" ? "古例補充" : method === "text" ? "一字至多字" : "原典公式"}</span><h3 className="brush-fixed-heading"><BrushTitle src={methodTitleAssets[method].formArt} text={methodTitleAssets[method].formLabel} className={`brush-kangjie-form-title${method === "text" || method === "supplement" ? " brush-kangjie-form-long" : ""}`} /></h3></div><p>{method === "calendar" ? "年支加農曆月日取上卦，再加時支取下卦與動爻。" : method === "object" ? "可數之物作上卦，時支配作下卦，兩數合計取動爻。" : method === "sound" ? "單聲與分段聲數分開演算。" : method === "text" ? "姓名逐字自動查筆畫，並可人工修正。" : "丈尺、尺寸與後天端法各守其公式。"}</p></div>

            {method === "calendar" && <><div className="current-time-detect" data-state={currentTimeError ? "error" : "ready"} role="status" aria-live="polite"><div className="current-time-copy"><span>裝置當下時間</span><strong>{currentTimeError ? "無法自動偵測" : currentTime?.gregorianLabel ?? "正在偵測裝置時間"}</strong><small>{currentTimeError || currentTime?.lunarLabel || "準備換算農曆年月日時"}</small></div><div className="current-time-actions"><span>{currentTime?.timeZoneLabel ?? "本機時區"}</span><button type="button" onClick={applyCurrentTime}>重新套用現在</button></div></div><div className="quad-input-grid"><BranchSelect name="yearBranch" label="年支" defaultValue={timeDefaultValue("yearBranch", currentTime?.yearBranch)} /><label className="field-block"><span>農曆月<small>正月為 1</small></span><input name="lunarMonth" type="number" inputMode="numeric" min="1" max="12" placeholder="1 至 12" defaultValue={timeDefaultValue("lunarMonth", currentTime?.lunarMonth)} required /></label><label className="field-block"><span>農曆日<small>初一為 1</small></span><input name="lunarDay" type="number" inputMode="numeric" min="1" max="30" placeholder="1 至 30" defaultValue={timeDefaultValue("lunarDay", currentTime?.lunarDay)} required /></label><BranchSelect name="hourBranch" label="時支" defaultValue={timeDefaultValue("hourBranch", currentTime?.hourBranch)} /></div><div className="dual-input-grid calendar-profile-grid"><label className="field-block"><span>曆法年界<small>可切換立春或晚子時</small></span><select name="calendarProfile" value={calendarProfile} onChange={(event) => setCalendarProfile(event.target.value)}><option value="taipei-lunar-new-year-v1">臺北・正月初一年界</option><option value="taipei-lichun-v1">臺北・立春年界</option><option value="taipei-late-zi-next-day-v1">臺北・晚子時換日</option></select></label><label className="field-block"><span>時區<small>IANA 名稱</small></span><input name="timeZone" value={calendarTimeZone} onChange={(event) => setCalendarTimeZone(event.target.value)} /></label></div></>}

            {method === "object" && <div className="dual-input-grid"><label className="field-block"><span>可數之物數量<small>大於 0 的整數</small></span><input name="count" type="text" inputMode="numeric" placeholder="例如：8" required /></label><BranchSelect name="hourBranch" label="時支" defaultValue={timeDefaultValue("hourBranch", currentTime?.hourBranch)} /></div>}

            {method === "sound" && <><label className="field-block"><span>聲音方法<small>單聲與分段聲分開</small></span><select name="soundMode" value={soundMode} onChange={(event) => setSoundMode(event.target.value as "segmented" | "single")}><option value="segmented">分段聲數</option><option value="single">單一聲數</option></select></label><div className="triple-input-grid">{soundMode === "segmented" ? <><label className="field-block"><span>第一段聲數<small>大於 0 的整數</small></span><input name="firstCount" type="text" inputMode="numeric" placeholder="例如：1" required /></label><label className="field-block"><span>第二段聲數<small>大於 0 的整數</small></span><input name="secondCount" type="text" inputMode="numeric" placeholder="例如：5" required /></label></> : <label className="field-block"><span>聲音次數<small>大於 0 的整數</small></span><input name="count" type="text" inputMode="numeric" placeholder="例如：3" required /></label>}<BranchSelect name="hourBranch" label="時支" defaultValue={timeDefaultValue("hourBranch", currentTime?.hourBranch)} /></div></>}

            {method === "text" && <><label className="field-block"><span>字占方法<small>姓名模式會自動查每字幾畫</small></span><select name="textMode" value={textMode} onChange={(event) => { setTextMode(event.target.value as typeof textMode); setStrokeEntries([]); }}><option value="long">11 至 100 字字數法</option><option value="classic">一至十字古籍主法</option><option value="strokes">二至十字筆畫分組</option><option value="surname">姓名或姓氏加數法</option></select></label><label className="field-block text-field"><span>輸入漢字或姓名<small>非漢字符號不計</small></span><textarea name="text" rows={4} placeholder="例如：王小明" value={textValue} onChange={(event) => { setTextValue(event.target.value); setTextCount(countHanCharacters(event.target.value)); setStrokeEntries([]); }} required /><output>已計 {textCount} 個漢字</output></label>
              {textMode === "classic" && textCount === 1 && <div className="dual-input-grid"><label className="field-block"><span>左部陽畫<small>依楷書手動確認</small></span><input name="leftStrokes" type="number" min="1" max="999" /></label><label className="field-block"><span>右部陰畫<small>依楷書手動確認</small></span><input name="rightStrokes" type="number" min="1" max="999" /></label></div>}
              {textMode === "classic" && textCount >= 4 && textCount <= 10 && <label className="field-block"><span>逐字古代四聲數<small>平1、上2、去3、入4，以逗號分隔</small></span><input name="toneValues" type="text" placeholder="例如：1,4,3,1" /></label>}
              {textMode === "surname" && <div className="quad-input-grid"><BranchSelect name="yearBranch" label="年支" defaultValue={timeDefaultValue("yearBranch", currentTime?.yearBranch)} /><label className="field-block"><span>農曆月<small>正月為 1</small></span><input name="lunarMonth" type="number" min="1" max="12" defaultValue={timeDefaultValue("lunarMonth", currentTime?.lunarMonth)} /></label><label className="field-block"><span>農曆日<small>初一為 1</small></span><input name="lunarDay" type="number" min="1" max="30" defaultValue={timeDefaultValue("lunarDay", currentTime?.lunarDay)} /></label><BranchSelect name="hourBranch" label="時支" defaultValue={timeDefaultValue("hourBranch", currentTime?.hourBranch)} /></div>}
              {(textMode === "strokes" || textMode === "surname" || (textMode === "classic" && textCount >= 2 && textCount <= 3) || (textMode === "classic" && calculationProfile === "user-custom-v1" && customTextFourToTen === "strokes" && textCount >= 4 && textCount <= 10)) && <div className="stroke-workspace"><button type="button" className="secondary-button" disabled={strokeLoading} onClick={() => resolveReactStrokes(textValue).catch((error) => setMessage(error instanceof Error ? error.message : "筆畫資料無法載入。"))}>{strokeLoading ? "正在查詢" : "自動計算每個字幾畫"}</button><div className="stroke-evidence-list">{strokeEntries.length ? strokeEntries.map((entry, index) => <label className="stroke-evidence-row" key={`${entry.character}-${index}`}><span><strong>{entry.character}</strong><small>{entry.sourceLabel}・{entry.dataVersion || "本次手動"}</small></span><input type="number" min="1" max="999" value={String(entry.strokes ?? "")} onChange={(event) => changeStroke(index, event.target.value)} aria-label={`${entry.character}的筆畫數`} /><em>{String(entry.strokes ?? "")} 畫</em></label>) : "輸入姓名後按下自動計算。"}</div></div>}
            </>}

            {method === "supplement" && <><label className="field-block"><span>補充方法<small>每種方法各守其法</small></span><select name="supplementType" value={supplementType} onChange={(event) => setSupplementType(event.target.value)}><option value="zhang-chi">丈尺占</option><option value="chi-cun">尺寸占</option><option value="posterior">後天端法</option><option value="person">為人占</option><option value="animal">動物占</option><option value="static">靜物占</option><option value="direction">方位取卦</option></select></label>{["zhang-chi", "chi-cun"].includes(supplementType) ? <><div className="triple-input-grid">{supplementType === "zhang-chi" && <label className="field-block"><span>丈數<small>作上卦</small></span><input name="zhang" type="number" min="1" defaultValue="1" /></label>}<label className="field-block"><span>尺數<small>依方法入卦</small></span><input name="chi" type="number" min="1" defaultValue="1" /></label><label className="field-block"><span>寸數<small>丈尺占不採用</small></span><input name="cun" type="number" min="1" defaultValue="1" /></label></div>{supplementType === "chi-cun" && <><label className="field-block"><span>尺寸版本<small>可核傳本加時；另保留未證異法</small></span><select name="version"><option value="modern-with-hour">傳本主法：動爻加時辰</option><option value="old-without-hour">未證異法：動爻不加時辰</option></select></label><BranchSelect name="hourBranch" label="時支" defaultValue={timeDefaultValue("hourBranch", currentTime?.hourBranch)} /></>}</> : <><div className="triple-input-grid"><label className="field-block"><span>物象卦<small>請依類象確認</small></span><select name="objectTrigram">{[["1", "乾1"], ["2", "兌2"], ["3", "離3"], ["4", "震4"], ["5", "巽5"], ["6", "坎6"], ["7", "艮7"], ["8", "坤8"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="field-block"><span>方位卦<small>請依方向確認</small></span><select name="directionTrigram">{[["1", "西北・乾1"], ["2", "西・兌2"], ["3", "南・離3"], ["4", "東・震4"], ["5", "東南・巽5"], ["6", "北・坎6"], ["7", "東北・艮7"], ["8", "西南・坤8"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><BranchSelect name="hourBranch" label="時支" defaultValue={timeDefaultValue("hourBranch", currentTime?.hourBranch)} /></div>{["animal", "static"].includes(supplementType) && <label className="field-block"><span>觸發事件<small>不動不占、無故不占</small></span><input name="trigger" type="text" placeholder="例如：枯枝無風自墜" /></label>}</>}</>}

            <p className="form-note">{method === "calendar" ? currentTimeNote : method === "text" ? "Unicode／IRG 筆畫不是康熙筆畫；查不到時必須人工補填。" : "時支會依裝置當下時間帶入，仍可手動修改。"}</p><p className="form-message" role="alert" aria-live="polite">{message}</p><button className="primary-button" type="submit">開始固定衍算<span aria-hidden="true">↘</span></button>
          </form>
        </div>
        <div ref={resultRef} className="kangjie-result-anchor">{result && <KangjieResult result={result} />}</div>
      </section>}

      {pageTab === "huangji" && <section className="kangjie-panel" role="tabpanel">
        <PageHeading index="元・會・運・世・年" src="/visuals/brush/title-kangjie-huangji-v1.webp" title="皇極尺度">保留原有時間長度分解，並新增可設定錨點的歷史定位；錨點不冒充唯一正統。</PageHeading>
        <div className="huangji-scale"><article><span>世</span><strong>30</strong><small>年</small></article><article><span>運</span><strong>360</strong><small>年・12 世</small></article><article><span>會</span><strong>10,800</strong><small>年・30 運</small></article><article><span>元</span><strong>129,600</strong><small>年・12 會</small></article></div>
        <form className="huangji-form" onSubmit={handleHuangji} noValidate>
          <label className="field-block"><span>元會運世模式<small>舊版拆分或自訂錨點定位</small></span><select name="mode" value={huangjiMode} onChange={(event) => setHuangjiMode(event.target.value as "duration" | "position")}><option value="duration">時間長度分解</option><option value="position">歷史年份定位</option></select></label>
          {huangjiMode === "duration" ? <label className="field-block"><span>要分解的時間長度<small>輸入大於 0 的完整年數</small></span><input name="years" type="text" inputMode="numeric" placeholder="例如：130000" required /></label> : <><div className="triple-input-grid"><label className="field-block"><span>目標年份<small>西元前請輸入負數，沒有 0 年</small></span><input name="targetCivilYear" type="text" inputMode="numeric" placeholder="例如：2026" /></label><label className="field-block"><span>錨點年份<small>可依師承自訂</small></span><input name="epochCivilYear" type="text" inputMode="numeric" defaultValue="1" /></label><label className="field-block"><span>錨點位移<small>預設 0 年</small></span><input name="epochOffsetYears" type="text" inputMode="numeric" defaultValue="0" /></label></div><input name="epochProfileId" type="hidden" value="user-custom-v1" /><label className="field-block"><span>錨點名稱<small>完整寫入演算追蹤</small></span><input name="epochLabel" type="text" defaultValue="使用者自訂錨點" /></label></>}
          <p className="form-message" role="alert" aria-live="polite">{message}</p><button className="primary-button" type="submit">{huangjiMode === "duration" ? "分解元會運世" : "依錨點定位"}<span aria-hidden="true">↘</span></button>
        </form>
        <div ref={huangjiRef} className="huangji-result-anchor">{huangji && <section className="huangji-calculation-result"><p className="section-index">{huangji.mode === "duration" ? `時間長度 ${huangji.totalYears} 年` : `${huangji.targetLabel}・${huangji.profileLabel}`}</p><h2 tabIndex={-1}><BrushTitle src="/visuals/brush/title-kangjie-result-v1.webp" text="衍算結果" className="brush-kangjie-result" /></h2><div className="huangji-output-grid">{(huangji.mode === "duration" ? [["元", huangji.units.yuan], ["會", huangji.units.hui], ["運", huangji.units.yun], ["世", huangji.units.shi], ["餘年", huangji.units.years]] : [["會序", huangji.position.hui], ["運序", huangji.position.yun], ["世序", huangji.position.shi], ["年序", huangji.position.year], ["週期位移", huangji.cycleOffset]]).map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><code className="huangji-equation">{huangji.equation}</code><p className="iching-boundary">{huangji.mode === "duration" ? "這是時間長度的單位換算，不是西元紀年定位、天文週期證明或事件預言。" : `${huangji.epoch.notice} 本結果依可設定錨點作數學定位。`}</p></section>}</div>
      </section>}

      {pageTab === "sources" && <section className="kangjie-panel" role="tabpanel"><PageHeading index="可回到原文逐條核對" src="/visuals/brush/title-kangjie-source-v1.webp" title="原文與來源" source>古籍、官方曆法與筆畫資料均固定版本並保留來源。</PageHeading><div className="source-ledger">{[["梅花易數・卷一", "卦數、年月日時、物數、聲音、字占、丈尺與後天端法", "https://zh.wikisource.org/zh-hant/梅花易數/卷一"], ["梅花易數・卷二", "體用與五行生剋交叉核對", "https://ctext.org/wiki.pl?chapter=475043&if=gb"], ["維基文庫《周易》", "本站內嵌卦爻本文的實際來源", "https://zh.wikisource.org/zh/周易"], ["皇極經世書", "元會運世結構與固定數制", "https://www.kanripo.org/text/KR3g0006/001"], ["中央氣象署日曆資料", "國農曆與節氣測試基準", "https://opendata.cwa.gov.tw/dataset/all/A-A0087-001"], ["Unicode Unihan 17.0", "kTotalStrokes 本機筆畫索引", "https://www.unicode.org/reports/tr38/"], ["教育部辭典公眾授權網", "標準字體總筆畫 provider 與授權界線", "https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/index.html"]].map(([title, note, href]) => <a href={href} target="_blank" rel="noreferrer" key={title}><span>{title}</span><strong>{note}</strong><small>開啟來源 ↗</small></a>)}</div><aside className="kangjie-boundary"><span aria-hidden="true">※</span><div><h2><BrushTitle src="/visuals/brush/title-kangjie-boundary-v1.webp" text="推演界線" className="brush-kangjie-boundary" /></h2><p>本工具依現行傳本製作，供傳統文化研究、演算核對與娛樂。它不是科學預測，不主張唯一正統，也不作醫療、法律、投資、工作、人事或重大人生決策依據。</p></div></aside></section>}
    </section>
    <footer><p>© 2026 生命靈數・邵康節易學專頁</p><p>同一網址體系，自動適配手機與電腦</p></footer>
  </main></>;
}
